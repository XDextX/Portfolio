import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { startDevServer, waitForServer } from './helpers/dev-server';
import { THEMES, openIn, installHelpers, settled } from './helpers/rendered';
import { titleWords, plainText } from '../i18n/i18n';
import { SECTION_TITLES } from '../src/data/sectionTitles';

// Spec 008: one section-title treatment, rendered. RF-1 one treatment, RF-2 icon,
// RF-3 dash, RF-4 gold runs, RF-6 names, RF-8 wrap, and no hover state.

let DEV_URL = '';
const LOCALES = ['es', 'en'] as const;
const raw = (locale: string, key: string): string => {
    const json = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'i18n', 'locales', `${locale}.json`), 'utf-8'));
    return key.split('.').reduce((o: any, k) => o?.[k], json);
};

// Everything a title renders, read in the page: boxes, glyph edges, colours, text runs.
const measure = (page: Page) =>
    page.evaluate(() => {
        const w = window as any;
        const probe = document.createElement('span');
        probe.style.color = 'var(--accent-text)';
        document.body.append(probe);
        const gold = w.__toHex(getComputedStyle(probe).color);
        probe.remove();
        const body = w.__toHex(getComputedStyle(document.body).color);
        return [...document.querySelectorAll('h2.section-title, main section > h2, main section header h2')].map((h) => {
            const icon = h.querySelector('.section-title__icon');
            const dash = h.querySelector('.section-title__dash');
            const texts: Text[] = [];
            const walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
            for (let n = walker.nextNode(); n; n = walker.nextNode()) if ((n.textContent ?? '').trim()) texts.push(n as Text);
            const glyph = (t: Text, i: number) => { const r = document.createRange(); r.setStart(t, i); r.setEnd(t, i + 1); return r.getBoundingClientRect(); };
            const first = texts[0] ? glyph(texts[0], texts[0].textContent!.search(/\S/)) : null;
            const lastT = texts[texts.length - 1];
            const last = lastT ? glyph(lastT, lastT.textContent!.replace(/\s+$/, '').length - 1) : null;
            const box = (el: Element | null) => (el ? el.getBoundingClientRect() : null);
            const runs = texts.map((t) => ({ text: t.textContent!.trim(), color: w.__toHex(getComputedStyle(t.parentElement!).color) }));
            const cs = getComputedStyle(h);
            return {
                id: h.id,
                fontSize: cs.fontSize, fontWeight: cs.fontWeight, lineHeight: cs.lineHeight,
                icon: box(icon), dash: box(dash), first, last,
                iconColour: icon ? w.__toHex(getComputedStyle(icon).backgroundColor) : null,
                dashColour: dash ? w.__toHex(getComputedStyle(dash).backgroundColor) : null,
                runs, gold, body,
                overflow: (h as HTMLElement).scrollWidth > (h as HTMLElement).clientWidth,
            };
        });
    });

type Title = Awaited<ReturnType<typeof measure>>[number];
const sameLine = (a: DOMRect | null, b: DOMRect | null) => !!a && !!b && a.top < b.bottom && b.top < a.bottom;

test.describe('section titles (spec 008)', () => {
    test.describe.configure({ mode: 'default' });
    let proc: any;

    test.beforeAll(async () => {
        const started = startDevServer();
        proc = started.proc;
        DEV_URL = await started.readyPromise;
        await waitForServer(DEV_URL, 30000);
    });
    test.afterAll(() => { if (proc && !proc.killed) proc.kill(); });

    for (const locale of LOCALES) {
        for (const theme of THEMES) {
            test(`one treatment, icon, dash and gold runs — ${locale}, ${theme} (RF-1–RF-4)`, async ({ page }) => {
                await openIn(page, DEV_URL, theme, `/?lang=${locale}`);
                await installHelpers(page);
                const titles: Title[] = await settled(() => measure(page));
                const offenders: string[] = [];
                if (titles.length !== Object.keys(SECTION_TITLES).length) offenders.push(`RF-1: ${titles.length} section headings, expected ${Object.keys(SECTION_TITLES).length}`);
                const tuple = (t: Title) => JSON.stringify([t.fontSize, t.fontWeight, t.lineHeight, t.icon?.width, t.icon?.height, t.dash?.width, t.dash?.height,
                    t.icon && t.first ? Math.round(t.first.left - t.icon.right) : null, t.dash && t.last ? Math.round(t.dash.left - t.last.right) : null, t.iconColour, t.dashColour]);
                const tuples = new Set(titles.map(tuple));
                if (tuples.size !== 1) offenders.push(`RF-1: ${tuples.size} different treatments: ${[...tuples].join(' / ')}`);
                for (const t of titles) {
                    if (t.fontSize !== '24px') offenders.push(`RF-1: #${t.id} is ${t.fontSize}, not 24px`);
                    if (!t.icon || !t.first || t.icon.right > t.first.left + 0.5 || !sameLine(t.icon, t.first)) offenders.push(`RF-2: #${t.id} has no icon before its first glyph on that line`);
                    if (t.iconColour !== t.gold) offenders.push(`RF-2: #${t.id} icon ${t.iconColour}, not the gold ${t.gold}`);
                    if (!t.dash || !t.last || t.dash.left < t.last.right - 0.5 || !sameLine(t.dash, t.last) || !t.dash.width || !t.dash.height) offenders.push(`RF-3: #${t.id} has no dash after its last glyph on that line`);
                    if (t.dashColour !== t.gold) offenders.push(`RF-3: #${t.id} dash ${t.dashColour}, not the gold ${t.gold}`);
                    const entry = Object.values(SECTION_TITLES).find((e) => e.id === t.id);
                    const word = entry ? titleWords(raw(locale, entry.key)).find((x) => x.gold)?.text : undefined;
                    const goldText = t.runs.filter((r) => r.color === t.gold).map((r) => r.text).join(' ');
                    if (goldText !== word) offenders.push(`RF-4: #${t.id} gold text "${goldText}", expected "${word}"`);
                    for (const r of t.runs.filter((r) => r.color !== t.gold)) if (r.color !== t.body) offenders.push(`RF-4: #${t.id} "${r.text}" is ${r.color}, not the body ${t.body}`);
                }
                // A theme flip without reload repaints icon and dash in the new gold.
                await page.locator('[data-theme-toggle]').first().click();
                const after: Title[] = await settled(() => measure(page));
                for (const t of after) if (t.iconColour !== t.gold || t.dashColour !== t.gold) offenders.push(`RF-2/RF-3: #${t.id} after the toggle: icon ${t.iconColour}, dash ${t.dashColour}, gold ${t.gold}`);
                expect(offenders, offenders.join('\n')).toEqual([]);
            });

            test(`no title changes on hover but the projects link's underline — ${locale}, ${theme} (NFR)`, async ({ page }) => {
                await openIn(page, DEV_URL, theme, `/?lang=${locale}`);
                await installHelpers(page);
                const offenders: string[] = [];
                const snap = (sel: string) => page.locator(sel).evaluate((h) => [h, ...h.querySelectorAll('*')].map((e) => {
                    const c = getComputedStyle(e);
                    return [c.color, c.backgroundColor, c.transform, c.borderColor, c.boxShadow, c.opacity, e.tagName === 'A' ? '' : c.textDecorationLine].join('|');
                }).join(';'));
                for (const { id } of Object.values(SECTION_TITLES)) {
                    const sel = `h2#${id}`;
                    if ((await page.locator(sel).count()) === 0) { offenders.push(`NFR: #${id} not found`); continue; }
                    const before = await settled(() => snap(sel));
                    await page.locator(sel).hover();
                    const after = await settled(() => snap(sel));
                    if (before !== after) offenders.push(`NFR: #${id} changes on hover`);
                }
                expect(offenders, offenders.join('\n')).toEqual([]);
            });
        }

        test(`each heading is named by its plain title — ${locale} (RF-6)`, async ({ page }) => {
            await openIn(page, DEV_URL, 'light', `/?lang=${locale}`);
            const cdp = await page.context().newCDPSession(page);
            const { nodes } = (await cdp.send('Accessibility.getFullAXTree')) as { nodes: any[] };
            const headings = nodes.filter((n) => n.role?.value === 'heading' && n.properties?.some((p: any) => p.name === 'level' && p.value.value === 2));
            const names = headings.map((n) => n.name?.value as string);
            const offenders: string[] = [];
            for (const { key } of Object.values(SECTION_TITLES)) {
                const plain = plainText(raw(locale, key));
                if (!names.includes(plain)) offenders.push(`RF-6: no h2 named "${plain}" (names: ${names.join(' | ')})`);
            }
            const link = nodes.find((n) => n.role?.value === 'link' && n.name?.value === plainText(raw(locale, 'projects.title')));
            if (!link) offenders.push(`RF-6: the projects title link is not named "${plainText(raw(locale, 'projects.title'))}"`);
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }

    test('a title that wraps keeps its icon and dash with a word, and does not overflow (RF-8)', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await openIn(page, DEV_URL, 'light', '/?lang=es');
        await installHelpers(page);
        const id = SECTION_TITLES.experience.id;
        // min-content wraps at every opportunity yet never overflows a glued unit.
        await page.locator(`h2#${id}`).evaluate((h) => { (h as HTMLElement).style.inlineSize = 'min-content'; });
        const t = (await settled(() => measure(page))).find((x) => x.id === id);
        const offenders: string[] = [];
        if (!t) offenders.push(`RF-8: #${id} not found`);
        else {
            if (!sameLine(t.icon, t.first)) offenders.push('RF-8: the icon sits alone on its line');
            if (!sameLine(t.dash, t.last)) offenders.push('RF-8: the dash sits alone on its line');
            if (t.overflow) offenders.push('RF-8: the heading overflows its box');
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
});
