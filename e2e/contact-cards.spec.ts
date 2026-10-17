import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { E2E_URL as DEV_URL } from './helpers/server';
import { THEMES, openIn, installHelpers, type Theme } from './helpers/rendered';
import { contrast } from '../tests/helpers/colour';
import { CONTACTS } from '../src/data/contacts';
import { contactLabel, copyValue, FEEDBACK_MS } from '../src/utils/contact';

// Spec 018: contact cards. RF-1 three cards and visible logos, RF-2 one location datum, RF-4
// clipboard, RF-5 feedback box, RF-6 announcement; 360px, a second click.

const SECTION = '#Contact';
const LOCALES = ['es', 'en'] as const;
const contacts = CONTACTS as any[];
const json = (l: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'i18n', 'locales', `${l}.json`), 'utf-8'));
const tr = (l: string) => (key: string, vars: Record<string, string> = {}) =>
    String(key.split('.').reduce((o: any, k) => o?.[k], json(l)) ?? key).replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
const copyable = contacts;

async function openContact(page: Page, theme: Theme, locale: string, opts: { fail?: boolean; clock?: boolean } = {}) {
    if (opts.fail) await page.addInitScript(() => { navigator.clipboard.writeText = () => Promise.reject(new Error('denied')); });
    if (opts.clock) await page.clock.install();
    await openIn(page, DEV_URL, theme, `/?lang=${locale}`);
    await installHelpers(page);
    // install() lets time flow; paused, the fake clock moves only through runFor.
    if (opts.clock) await page.clock.pauseAt(Date.now() + 60_000);
    await page.locator(SECTION).scrollIntoViewIfNeeded();
}

// Click a copy control and wait, in real time, until the write settled into ok or error: a
// granted clipboard write resolves on its own schedule, not on the paused fake clock.
async function copyAndSettle(page: Page, i: number) {
    const btn = page.locator(`${SECTION} .contact-card`).nth(i).locator('.copy-btn');
    await btn.evaluate((b) => b.classList.remove('copy-btn--ok', 'copy-btn--err'));
    await btn.click();
    await expect.poll(() => btn.evaluate((b) => b.classList.contains('copy-btn--ok') || b.classList.contains('copy-btn--err'))).toBe(true);
}

const grant = (ctx: BrowserContext) => ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: DEV_URL });

// The copy button of a card: its box and which of icon / ok / error shows.
const buttonState = (page: Page, i: number) =>
    page.locator(`${SECTION} .contact-card`).nth(i).evaluate((card) => {
        const b = card.querySelector('.copy-btn') as HTMLElement | null;
        if (!b) return null;
        const r = b.getBoundingClientRect();
        const vis = (sel: string) => { const e = b.querySelector(sel) as HTMLElement | null; return !!e && e.checkVisibility({ visibilityProperty: true } as any); };
        const ok = b.querySelector('.copy-btn__ok') as HTMLElement | null;
        const err = b.querySelector('.copy-btn__err') as HTMLElement | null;
        return {
            box: [r.width, r.height].map((v) => Math.round(v * 100) / 100).join('x'),
            icon: vis('.copy-btn__icon'), ok: vis('.copy-btn__ok'), err: vis('.copy-btn__err'),
            fits: [ok, err].every((l) => !l || l.scrollWidth <= b.clientWidth),
            // Only a polite live region is announced; text in a plain node is not.
            live: card.querySelector('[data-copy-live][aria-live="polite"]')?.textContent ?? null,
        };
    });

test.describe('contact cards (spec 018)', () => {
    test.describe.configure({ mode: 'default' });

    for (const theme of THEMES) for (const locale of LOCALES) {
        test(`three cards, each logo its theme's; one location datum — ${theme}, ${locale} (RF-1, RF-2)`, async ({ page }) => {
            await openContact(page, theme, locale);
            const t = tr(locale);
            const r = await page.locator(SECTION).evaluate((s) => {
                const cards = [...s.querySelectorAll('.contact-card')];
                const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((x) => { try { return JSON.parse(x.textContent ?? ''); } catch { return null; } }).find((j) => j?.['@type'] === 'Person');
                return {
                    labels: cards.map((c) => c.getAttribute('aria-label')),
                    pictures: cards.map((c) => { const b = c.querySelector('.contact-icon')?.getBoundingClientRect(); return b ? b.width * b.height : 0; }),
                    // The logo each card shows: a white mark on the light card is a box that paints nothing.
                    shown: cards.map((c) => [...c.querySelectorAll('.contact-icon img')].filter((i) => (i as HTMLElement).checkVisibility()).map((i) => new URL((i as HTMLImageElement).currentSrc || (i as HTMLImageElement).src).pathname)),
                    about: document.querySelector('.about-location')?.textContent?.trim() ?? null,
                    country: ld?.address?.addressCountry ?? null,
                };
            });
            const offenders: string[] = [];
            const want = contacts.map((c) => `${contactLabel(c, t)}: ${c.value}`);
            if (JSON.stringify(r.labels) !== JSON.stringify(want)) offenders.push(`RF-1: cards read ${r.labels.join(' | ')}, not ${want.join(' | ')}`);
            r.pictures.forEach((a, i) => { if (!a) offenders.push(`RF-1: card ${i + 1} has no rendered icon`); });
            contacts.forEach((c, i) => {
                if (!c.icon) return;
                const want = typeof c.icon === 'object' ? c.icon[theme] : c.icon;
                if (r.shown[i].length !== 1 || r.shown[i][0] !== want) offenders.push(`RF-1: ${c.id} shows ${r.shown[i].join(', ') || 'no image'} in ${theme}, not ${want}`);
            });
            if (!r.about || r.about !== r.country) offenders.push(`RF-2: the location reads About "${r.about}", JSON-LD "${r.country}"`);
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }

    test('clipboard: each control writes its value, a profile its https URL (RF-4)', async ({ page, context }) => {
        await grant(context);
        await openContact(page, 'light', 'es');
        const offenders: string[] = [];
        const cards = page.locator(`${SECTION} .contact-card`);
        for (let i = 0; i < contacts.length; i++) {
            const want = copyValue(contacts[i]);
            const btn = cards.nth(i).locator('.copy-btn');
            if (!(await btn.count())) { offenders.push(`RF-4: ${contacts[i].id} has no copy control`); continue; }
            await btn.click();
            const got = await page.evaluate(() => navigator.clipboard.readText());
            if (got !== want) offenders.push(`RF-4: ${contacts[i].id} copied "${got}", not "${want}"`);
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    for (const locale of LOCALES) for (const fail of [false, true]) {
        test(`feedback and announcement: ${fail ? 'a failed' : 'a successful'} copy — ${locale} (RF-5, RF-6)`, async ({ page, context }) => {
            await grant(context);
            await openContact(page, 'light', locale, { fail, clock: true });
            const t = tr(locale);
            const offenders: string[] = [];
            for (const c of copyable) {
                const i = contacts.indexOf(c);
                const rest = await buttonState(page, i);
                if (!rest) { offenders.push(`RF-5: ${c.id} has no copy control`); continue; }
                await copyAndSettle(page, i);
                await page.clock.runFor(50);
                const shown = (await buttonState(page, i))!;
                const label = fail ? shown.err : shown.ok;
                if (!label || shown.icon) offenders.push(`RF-5: ${c.id} shows no ${fail ? 'error' : 'copied'} label`);
                if (!shown.fits) offenders.push(`RF-5: ${c.id} label overflows the control`);
                if (shown.box !== rest.box) offenders.push(`RF-5: ${c.id} control is ${shown.box} with the label, ${rest.box} at rest`);
                const live = t(fail ? 'contact.actions.errorLive' : 'contact.actions.copiedLive', { label: contactLabel(c, t) });
                if (shown.live !== live) offenders.push(`RF-6: ${c.id} announces "${shown.live}", not "${live}"`);
                await page.clock.runFor(FEEDBACK_MS - 51);
                if ((await buttonState(page, i))!.icon) offenders.push(`RF-5: ${c.id} drops the label before ${FEEDBACK_MS}ms`);
                await page.clock.runFor(1);
                if (!(await buttonState(page, i))!.icon) offenders.push(`RF-5: ${c.id} keeps the label after ${FEEDBACK_MS}ms`);
            }
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }

    test('second click: a new click within 1.5 s restarts the feedback (edge case)', async ({ page, context }) => {
        await grant(context);
        await openContact(page, 'light', 'es', { clock: true });
        const i = contacts.indexOf(copyable[0]);
        await copyAndSettle(page, i);
        await page.clock.runFor(1000);
        await copyAndSettle(page, i);
        await page.clock.runFor(1000);
        const mid = (await buttonState(page, i))!;
        await page.clock.runFor(500);
        const end = (await buttonState(page, i))!;
        const offenders: string[] = [];
        if (mid.icon) offenders.push('edge: the first timer dropped the label of the second click');
        if (!end.icon) offenders.push('edge: the label outlived the second click by more than 1.5 s');
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    test('360px: no page scroll, at rest and mid-feedback (NFR)', async ({ page, context }) => {
        await grant(context);
        await page.setViewportSize({ width: 360, height: 800 });
        await openContact(page, 'light', 'es', { clock: true });
        const over = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        const offenders: string[] = [];
        if (await over()) offenders.push(`NFR: ${await over()}px of page scroll at rest`);
        await page.locator(`${SECTION} .copy-btn`).first().click();
        await page.clock.runFor(50);
        if (await over()) offenders.push(`NFR: ${await over()}px of page scroll mid-feedback`);
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    for (const theme of THEMES) {
        test(`logos show on their card: some opaque pixel clears 1.5:1 — ${theme} (RF-1)`, async ({ page }) => {
            await openContact(page, theme, 'es');
            // Brand contrast is accepted as measured (AGENTS; LinkedIn peaks at 1.72 in dark); a logo
            // that paints nothing visible is not: the white GitHub mark measured 1.00 on the light card.
            // The page only collects the opaque pixels' colours; the WCAG math is the shared helper's.
            const cards = await page.locator(`${SECTION} .contact-card`).evaluateAll(async (els) => {
                const hex = (rgb: number[]) => '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');
                const out: { id: string; bg: string; colours: string[] }[] = [];
                for (const card of els) {
                    const img = [...card.querySelectorAll('.contact-icon img')].find((i) => (i as HTMLElement).checkVisibility()) as HTMLImageElement | undefined;
                    if (!img) continue;
                    img.loading = 'eager';
                    await img.decode().catch(() => {});
                    const bg = (getComputedStyle(card).backgroundColor.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
                    const cv = document.createElement('canvas'); cv.width = cv.height = 56;
                    const ctx = cv.getContext('2d')!; ctx.drawImage(img, 0, 0, 56, 56);
                    const px = ctx.getImageData(0, 0, 56, 56).data;
                    const colours = new Set<string>();
                    for (let k = 0; k < px.length; k += 4) if (px[k + 3] > 200) colours.add(hex([px[k], px[k + 1], px[k + 2]]));
                    out.push({ id: card.getAttribute('aria-label')?.split(':')[0] ?? '?', bg: hex(bg), colours: [...colours] });
                }
                return out;
            });
            const r = cards.map((c) => ({ id: c.id, best: Math.max(1, ...c.colours.map((x) => contrast(x, c.bg))) }));
            const offenders = r.filter((x) => x.best < 1.5).map((x) => `RF-1: the ${x.id} logo peaks at ${x.best}:1 on its card in ${theme}`);
            if (!r.length) offenders.push('RF-1: no contact logo measured');
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }
});
