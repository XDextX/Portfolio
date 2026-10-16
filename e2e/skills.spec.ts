import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { startDevServer, waitForServer } from './helpers/dev-server';
import { THEMES, openIn, installHelpers, settled, axQuery } from './helpers/rendered';
import * as tech from '../src/data/tech';
import { contrast, parseColour, parseGradients, composites, worstPoint } from '../tests/helpers/colour';

// Spec 012: the Skills section. RF-2/3 areas, RF-5 compact headings, RF-6/7/8 logos,
// RF-10/11 heading icons, RF-12/13/14 the toggle's active indicator.

let DEV_URL = '';
const LOCALES = ['es', 'en'] as const;
const SECTION = '.tech-grid';
const data = tech as any;

const heading = (locale: string, key: string): string => {
    const json = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'i18n', 'locales', `${locale}.json`), 'utf-8'));
    return json.skills?.areas?.[key];
};

// The populated areas, in declared order, derived here and not through populatedAreas:
// a guard that called the function under test would agree with any bug in it.
const populated = (): { key: string; glyph: string }[] => {
    if (!data.SKILL_AREAS) throw new Error('src/data/tech.ts exports no SKILL_AREAS');
    return data.SKILL_AREAS.filter((a: any) => data.TECH.some((e: any) => e.area === a.key));
};
const expectedHeadings = (locale: string): string[] => populated().map((a) => heading(locale, a.key));

const panelHeadings = (page: Page, panel: 'bars' | 'list') =>
    page.locator(`${SECTION} [data-panel='${panel}'] .cat-label`).evaluateAll((els) => els.map((e) => (e.textContent ?? '').trim()));

async function showList(page: Page) {
    await page.locator(`${SECTION} [data-view='list']`).click();
    await expect(page.locator(`${SECTION} [data-panel='list']`)).toBeVisible();
}

test.describe('skills (spec 012)', () => {
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
        test(`area order: populated areas in declared order, both views — ${locale} (RF-2)`, async ({ page }) => {
            await openIn(page, DEV_URL, 'light', `/?lang=${locale}`);
            const want = expectedHeadings(locale);
            const bars = await panelHeadings(page, 'bars');
            await showList(page);
            const list = await panelHeadings(page, 'list');
            const offenders: string[] = [];
            if (JSON.stringify(bars) !== JSON.stringify(want)) offenders.push(`RF-2: bars headings ${bars.join(' | ')}, not ${want.join(' | ')}`);
            if (JSON.stringify(list) !== JSON.stringify(want)) offenders.push(`RF-2: list headings ${list.join(' | ')}, not ${want.join(' | ')}`);
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }

    test('empty areas: five groups per view and no Testing heading (RF-3)', async ({ page }) => {
        await openIn(page, DEV_URL, 'light', '/?lang=es');
        const count = (panel: string) => page.locator(`${SECTION} [data-panel='${panel}'] :is(.card-frame, .cat-group)`).count();
        const offenders: string[] = [];
        const bars = await count('bars');
        await showList(page);
        const list = await count('list');
        if (bars !== 5) offenders.push(`RF-3: the bars view shows ${bars} groups, not 5`);
        if (list !== 5) offenders.push(`RF-3: the list view shows ${list} groups, not 5`);
        const all = await page.locator(`${SECTION} .cat-label`).allTextContents();
        if (all.some((t) => /Testing/.test(t))) offenders.push('RF-3: a Testing heading renders with no skill in it');
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    // Each entry's slot in a view: the bars row or the chip, matched by the skill's name.
    const slots = (page: Page, panel: 'bars' | 'list') =>
        page.locator(`${SECTION} [data-panel='${panel}']`).evaluate((p, panel) => {
            const rows = panel === 'bars'
                ? [...p.querySelectorAll('.bar-row')].map((r) => ({ name: r.querySelector('.bar-name')?.textContent?.trim() ?? '', slot: r.querySelector('.bar-logo') }))
                : [...p.querySelectorAll('.chip')].map((c) => ({ name: [...c.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim(), slot: c }));
            return rows.map(({ name, slot }) => {
                const imgs = slot ? [...slot.querySelectorAll('img')] : [];
                const mark = slot?.querySelector('.mark');
                return {
                    name,
                    imgs: imgs.length,
                    shown: imgs.filter((i) => i.checkVisibility()).map((i) => new URL(i.currentSrc || i.src).pathname),
                    mark: mark ? { mask: getComputedStyle(mark).maskImage || getComputedStyle(mark).webkitMaskImage, colour: (window as any).__toHex(getComputedStyle(mark).backgroundColor) } : null,
                };
            });
        }, panel);

    for (const theme of THEMES) {
        test(`row logos: each skill draws its logo for the theme, both views — ${theme} (RF-6)`, async ({ page }) => {
            await openIn(page, DEV_URL, theme, '/?lang=es');
            await installHelpers(page);
            const offenders: string[] = [];
            for (const panel of ['bars', 'list'] as const) {
                if (panel === 'list') await showList(page);
                const got = await slots(page, panel);
                for (const e of data.TECH.filter((x: any) => x.logo)) {
                    const want = data.logoFor ? data.logoFor(e.logo, theme) : '(no logoFor export)';
                    const row = got.find((g) => g.name === e.name);
                    if (!row) { offenders.push(`RF-6: ${panel} has no slot for ${e.name}`); continue; }
                    if (row.shown.length !== 1 || row.shown[0] !== want) offenders.push(`RF-6: ${panel} ${e.name} shows ${row.shown.join(', ') || 'no image'}, not ${want}`);
                }
            }
            expect(offenders, offenders.join('\n')).toEqual([]);
        });

        test(`generic mark: a skill with no logo draws the mark in the mono colour — ${theme} (RF-8)`, async ({ page }) => {
            await openIn(page, DEV_URL, theme, '/?lang=es');
            await installHelpers(page);
            const mono = await page.evaluate(() => {
                const s = document.createElement('span');
                s.style.color = 'var(--icon-mono)';
                document.body.append(s);
                const c = (window as any).__toHex(getComputedStyle(s).color);
                s.remove();
                return c as string;
            });
            const offenders: string[] = [];
            const bare = data.TECH.filter((x: any) => !x.logo);
            if (!bare.length) offenders.push('RF-8: no entry without a logo to check');
            for (const panel of ['bars', 'list'] as const) {
                if (panel === 'list') await showList(page);
                const got = await slots(page, panel);
                for (const e of bare) {
                    const row = got.find((g) => g.name === e.name);
                    if (!row) { offenders.push(`RF-8: ${panel} has no slot for ${e.name}`); continue; }
                    if (row.imgs) offenders.push(`RF-8: ${panel} ${e.name} draws ${row.imgs} image(s)`);
                    if (!row.mark) { offenders.push(`RF-8: ${panel} ${e.name} has no .mark`); continue; }
                    if (!row.mark.mask.includes(data.GENERIC_MARK ?? '(no GENERIC_MARK)')) offenders.push(`RF-8: ${panel} ${e.name} masks ${row.mark.mask}`);
                    if (row.mark.colour !== mono) offenders.push(`RF-8: ${panel} ${e.name} mark is ${row.mark.colour}, not ${mono}`);
                }
            }
            expect(offenders, offenders.join('\n')).toEqual([]);
        });

        test(`row at rest: hovering a skill row changes nothing — ${theme} (RF-7)`, async ({ page }) => {
            await page.setViewportSize({ width: 1280, height: 900 });
            await openIn(page, DEV_URL, theme, '/?lang=es');
            await page.locator(`${SECTION} .bar-row`).first().scrollIntoViewIfNeeded();
            const snap = (i: number) => page.locator(`${SECTION} .bar-row`).nth(i).evaluate((row) => {
                const all = [row, ...row.querySelectorAll('.bar-logo, .bar-logo *')];
                return all.map((el) => { const cs = getComputedStyle(el); return [...cs].map((p) => `${p}:${cs.getPropertyValue(p)}`).join(';'); }).join('|');
            });
            const n = await page.locator(`${SECTION} .bar-row`).count();
            const offenders: string[] = [];
            for (let i = 0; i < n; i++) {
                await page.mouse.move(0, 0);
                const before = await settled(() => snap(i));
                await page.locator(`${SECTION} .bar-row`).nth(i).hover();
                const after = await settled(() => snap(i));
                if (before !== after) {
                    const diff = before.split(';').filter((d, k) => d !== after.split(';')[k]).slice(0, 3);
                    offenders.push(`RF-7: row ${i + 1} changes on hover (${diff.join(', ')})`);
                }
            }
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }

    for (const locale of LOCALES) {
        test(`compact headings: the list view's headings are translated — ${locale} (RF-5)`, async ({ page }) => {
            await openIn(page, DEV_URL, 'light', `/?lang=${locale}`);
            await showList(page);
            const got = await panelHeadings(page, 'list');
            const want = expectedHeadings(locale);
            expect(got, `RF-5: compact headings ${got.join(' | ')}, not ${want.join(' | ')}`).toEqual(want);
        });
    }

    for (const theme of THEMES) {
        test(`header icons: one hidden glyph before each heading, within its line, in the mono colour — ${theme} (RF-10, RF-11)`, async ({ page }) => {
            await openIn(page, DEV_URL, theme, '/?lang=es');
            await installHelpers(page);
            const offenders: string[] = [];
            const mono = await page.evaluate(() => {
                const s = document.createElement('span');
                s.style.color = 'var(--icon-mono)';
                document.body.append(s);
                const c = (window as any).__toHex(getComputedStyle(s).color);
                s.remove();
                return c as string;
            });
            const glyphs: string[] = populated().map((a) => a.glyph);
            for (const panel of ['bars', 'list'] as const) {
                if (panel === 'list') await showList(page);
                const rows = await page.locator(`${SECTION} [data-panel='${panel}'] .cat-label`).evaluateAll((hs) => hs.map((h) => {
                    const w = window as any;
                    const icons = [...h.querySelectorAll('.area-icon')];
                    const icon = icons[0] as HTMLElement | undefined;
                    const text = [...h.childNodes].find((n) => n.nodeType === 3 && (n.textContent ?? '').trim());
                    let textLeft = Infinity;
                    if (text) { const r = document.createRange(); const i = text.textContent!.search(/\S/); r.setStart(text, i); r.setEnd(text, i + 1); textLeft = r.getBoundingClientRect().left; }
                    const cs = icon ? getComputedStyle(icon) : null;
                    const lh = parseFloat(getComputedStyle(h).lineHeight) || parseFloat(getComputedStyle(h).fontSize) * 1.2;
                    return {
                        icons: icons.length,
                        hidden: icon?.getAttribute('aria-hidden') === 'true',
                        mask: cs ? cs.maskImage || cs.webkitMaskImage : '',
                        right: icon ? icon.getBoundingClientRect().right : 0,
                        height: icon ? icon.getBoundingClientRect().height : 0,
                        textLeft, lh,
                        colour: cs ? w.__toHex(cs.backgroundColor) : '',
                        // From the heading, not the icon: the icon's own fill is not its ground.
                        ground: icon ? w.__groundOf(h, 'main > section.section') : null,
                        image: getComputedStyle(h.closest('section')!).backgroundImage,
                        sheet: getComputedStyle(document.querySelector('main')!).backgroundColor,
                    };
                }));
                rows.forEach((r, i) => {
                    const where = `${panel} heading ${i + 1}`;
                    if (r.icons !== 1) { offenders.push(`RF-10: ${where} has ${r.icons} icons, not 1`); return; }
                    if (!r.hidden) offenders.push(`RF-10: ${where} icon is not aria-hidden`);
                    if (!glyphs[i] || !r.mask.includes(`/icons/ui/${glyphs[i]}.svg`)) offenders.push(`RF-10: ${where} masks ${r.mask}, not ${glyphs[i]}`);
                    if (r.right > r.textLeft + 0.5) offenders.push(`RF-10: ${where} icon is not left of its text`);
                    if (r.height > r.lh + 0.5) offenders.push(`RF-10: ${where} icon ${r.height.toFixed(1)}px is taller than its line ${r.lh.toFixed(1)}px`);
                    if (r.colour !== mono) offenders.push(`RF-11: ${where} icon is ${r.colour}, not ${mono}`);
                    else if (r.ground) {
                        const ratio = r.ground.glow
                            ? worstPoint(parseColour(r.colour), parseGradients(r.image).flatMap((g) => composites(g, parseColour(r.sheet))))
                            : contrast(r.colour, r.ground.colour);
                        if (ratio < 3) offenders.push(`RF-11: ${where} icon ${r.colour} on ${r.ground.glow ? 'the glow' : r.ground.colour} is ${ratio.toFixed(2)}:1`);
                    }
                });
            }
            // queryAXTree also returns ignored nodes, such as an alt='' logo; only exposed ones count.
            const images = (await axQuery(page, SECTION, 'image')).filter((n) => !n.ignored);
            if (images.length) offenders.push(`RF-10: ${images.length} image node(s) in the section's AX tree`);
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }

    // The toggle's two buttons: indicator box and visibility, svg box, fills and borders.
    const toggleState = (page: Page) =>
        settled(() => page.locator(`${SECTION} .view-toggle`).evaluate((g) => {
            const w = window as any;
            const probe = document.createElement('span');
            probe.style.color = 'var(--accent-text)';
            document.body.append(probe);
            const gold = w.__toHex(getComputedStyle(probe).color);
            probe.remove();
            return {
                gold,
                group: w.__toHex(getComputedStyle(g).backgroundColor),
                buttons: [...g.querySelectorAll('.toggle-btn')].map((b) => {
                    const ind = b.querySelector('.toggle-indicator') as HTMLElement | null;
                    const svg = b.querySelector('svg')!.getBoundingClientRect();
                    const cs = getComputedStyle(b);
                    const ics = ind ? getComputedStyle(ind) : null;
                    const box = ind?.getBoundingClientRect();
                    return {
                        view: (b as HTMLElement).dataset.view,
                        pressed: b.getAttribute('aria-pressed') === 'true',
                        fill: cs.backgroundColor,
                        // A border's colour only matters where it is drawn; a none border follows currentColor.
                        border: (['Top', 'Right', 'Bottom', 'Left'] as const).map((d) => { const st = cs.getPropertyValue(`border-${d.toLowerCase()}-style`); return st === 'none' ? 'none' : `${cs.getPropertyValue(`border-${d.toLowerCase()}-width`)} ${st} ${cs.getPropertyValue(`border-${d.toLowerCase()}-color`)}`; }).join(' / '),
                        shown: !!ind && ics!.visibility === 'visible' && ics!.display !== 'none' && box!.width > 0 && box!.height > 0,
                        colour: ics ? ics.backgroundColor : '',
                        duration: ics ? ics.transitionDuration : '',
                        top: box?.top ?? 0, centre: box ? box.left + box.width / 2 : 0,
                        svgBottom: svg.bottom, svgCentre: svg.left + svg.width / 2,
                    };
                }),
            };
        }));

    const indicatorOffenders = (s: Awaited<ReturnType<typeof toggleState>>, active: string, where: string) => {
        const out: string[] = [];
        const hex = (c: string) => '#' + (c.match(/[\d.]+/g) ?? []).slice(0, 3).map((v) => Number(v).toString(16).padStart(2, '0')).join('');
        const opaque = (c: string) => !/rgba\([^)]*,\s*0\)/.test(c) && c !== 'transparent';
        const on = s.buttons.find((b) => b.view === active);
        const off = s.buttons.find((b) => b.view !== active);
        if (!on || !off) return [`RF-12: ${where}: the toggle has no ${active} button`];
        if (!on.shown) out.push(`RF-12: ${where}: the ${active} button shows no indicator`);
        else {
            if (on.top < on.svgBottom - 0.5) out.push(`RF-12: ${where}: the indicator is not under the icon`);
            if (Math.abs(on.centre - on.svgCentre) > 1) out.push(`RF-12: ${where}: the indicator is ${(on.centre - on.svgCentre).toFixed(1)}px off the icon's centre`);
            if (hex(on.colour) !== s.gold) out.push(`RF-12: ${where}: the indicator is ${hex(on.colour)}, not ${s.gold}`);
            for (const [name, ground] of [['group', s.group], ['active fill', opaque(on.fill) ? hex(on.fill) : s.group]] as const) {
                const ratio = contrast(hex(on.colour), ground);
                if (ratio < 3) out.push(`RF-12: ${where}: the indicator is ${ratio.toFixed(2)}:1 on the ${name} ${ground}`);
            }
        }
        if (on.border !== off.border) out.push(`RF-12: ${where}: the active border differs (${on.border} vs ${off.border})`);
        if (off.shown) out.push(`RF-12: ${where}: the inactive button shows the indicator too`);
        return out;
    };

    for (const theme of THEMES) {
        test(`active indicator: a gold bar under the active icon, after a click and under reduced motion — ${theme} (RF-12)`, async ({ page }) => {
            await openIn(page, DEV_URL, theme, '/?lang=es');
            await installHelpers(page);
            const offenders = [...indicatorOffenders(await toggleState(page), 'bars', 'at load')];
            await page.locator(`${SECTION} [data-view='list']`).click();
            offenders.push(...indicatorOffenders(await toggleState(page), 'list', 'after clicking list'));
            await page.emulateMedia({ reducedMotion: 'reduce' });
            await page.locator(`${SECTION} [data-view='bars']`).click();
            const reduced = await toggleState(page);
            offenders.push(...indicatorOffenders(reduced, 'bars', 'under reduced motion'));
            for (const b of reduced.buttons) if (b.duration && !/^0s(, 0s)*$/.test(b.duration)) offenders.push(`NFR: the ${b.view} indicator animates for ${b.duration} under reduced motion`);
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }

    test('hover inactive: hovering the inactive button shows no indicator on it (RF-13)', async ({ page }) => {
        await openIn(page, DEV_URL, 'light', '/?lang=es');
        await installHelpers(page);
        await page.locator(`${SECTION} [data-view='list']`).hover();
        const s = await toggleState(page);
        const list = s.buttons.find((b) => b.view === 'list');
        expect(list?.shown, 'RF-13: the hovered inactive button shows the indicator').toBe(false);
    });

    test('no script: only the bars button shows the indicator (RF-14)', async ({ browser }) => {
        const ctx = await browser.newContext({ javaScriptEnabled: false });
        const page = await ctx.newPage();
        await page.goto(DEV_URL + '/?lang=es');
        const shown = await page.locator(`${SECTION} .toggle-btn`).evaluateAll((bs) => bs.map((b) => {
            const ind = b.querySelector('.toggle-indicator') as HTMLElement | null;
            if (!ind) return `${(b as HTMLElement).dataset.view}:none`;
            const cs = getComputedStyle(ind);
            const box = ind.getBoundingClientRect();
            return `${(b as HTMLElement).dataset.view}:${cs.visibility === 'visible' && box.width > 0 ? 'shown' : 'hidden'}`;
        }));
        await ctx.close();
        expect(shown, `RF-14: with scripts off the indicators read ${shown.join(', ')}`).toEqual(['bars:shown', 'list:hidden']);
    });
});
