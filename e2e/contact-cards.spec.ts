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

// ── Spec 045: no value on a phone (720px and below), the label in its typography ──

type Pointer = 'fine' | 'coarse';

/** #Contact at a width with a pointer, theme and locale, the 720px rule loaded and settled. */
async function openAt(browser: import('@playwright/test').Browser, width: number, pointer: Pointer, theme: Theme, locale: string, needRule = false) {
    const context = await browser.newContext(pointer === 'coarse' ? { viewport: { width, height: 844 }, isMobile: true, hasTouch: true, permissions: ['clipboard-read', 'clipboard-write'] } : { viewport: { width, height: 800 }, permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await context.newPage();
    await openContact(page, theme, locale);
    // The rule must be in a loaded sheet before anything is measured (AGENTS: a stale sheet misleads).
    const loaded = await page.evaluate(() => [...document.styleSheets].some((s) => { try { return [...s.cssRules].some((r) => r instanceof CSSMediaRule && r.conditionText.replace(/\s+/g, '').includes('max-width:720px') && [...r.cssRules].some((x) => (x as CSSStyleRule).selectorText?.includes('.contact-value'))); } catch { return false; } }));
    if (needRule) expect(loaded, 'the 720px .contact-value rule is in document.styleSheets').toBe(true);
    await page.waitForTimeout(500);
    return { page, context };
}

/** Per card: the value's holders, the parts, their boxes and typography, read in the page. */
const readCards = (page: Page, vals: string[]) => page.locator(`${SECTION} .contact-card`).evaluateAll((cards, values) => cards.map((card, i) => {
    const shown = (e: Element | null) => !!e && (e as HTMLElement).checkVisibility({ visibilityProperty: true, opacityProperty: true } as any) && e.getBoundingClientRect().width * e.getBoundingClientRect().height > 1;
    const box = (e: Element | null) => { const r = e?.getBoundingClientRect(); return r ? { top: r.top, bottom: r.bottom, mid: (r.top + r.bottom) / 2 } : null; };
    const typo = (e: Element | null) => { const c = e && getComputedStyle(e); return c ? `${c.fontSize}/${c.fontWeight}/${c.color}` : null; };
    const holders = [...card.querySelectorAll('*')].filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent!.includes(values[i])) && shown(e));
    const value = card.querySelector('.contact-value') as HTMLElement | null;
    const label = card.querySelector('.contact-label') as HTMLElement | null;
    const copy = card.querySelector('.copy-btn');
    const open = card.querySelector('.contact-actions a.icon-btn');
    const icon = card.querySelector('.contact-icon');
    return {
        holders: holders.length, iconShown: shown(icon), labelShown: shown(label), copyShown: shown(copy), openShown: shown(open),
        valueShown: shown(value), valueClipped: !!value && value.scrollWidth > value.clientWidth, valueBox: box(value), copyBox: box(copy),
        labelTypo: typo(label), valueTypo: typo(value), labelClipped: !!label && label.scrollWidth > label.clientWidth,
        mids: [icon, label, copy, open].map((e) => box(e)?.mid ?? NaN),
        name: card.getAttribute('aria-label'), copyAria: copy?.getAttribute('aria-label'), openAria: open?.getAttribute('aria-label'), openHref: open?.getAttribute('href'),
    };
}), vals);

const values = contacts.map((c) => c.value as string);

test.describe('contact values (spec 045)', () => {
    for (const [width, pointer] of [[360, 'fine'], [390, 'fine'], [720, 'fine'], [390, 'coarse']] as [number, Pointer][]) for (const locale of LOCALES) {
        test(`phone: no value, but icon, label and both controls — ${width}px ${pointer}, ${locale} (RF-1)`, async ({ browser }) => {
            const { page, context } = await openAt(browser, width, pointer, 'light', locale, true);
            const cards = await readCards(page, values);
            await context.close();
            const offenders: string[] = [];
            cards.forEach((c, i) => {
                if (c.holders) offenders.push(`RF-1: ${contacts[i].id} still shows its value`);
                for (const part of ['iconShown', 'labelShown', 'copyShown', 'openShown'] as const) if (!c[part]) offenders.push(`RF-1: ${contacts[i].id} has no visible ${part}`);
            });
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }

    for (const width of [721, 1280]) for (const pointer of ['fine', 'coarse'] as Pointer[]) for (const locale of LOCALES) {
        test(`desktop: every value shown, unclipped, on the controls row — ${width}px ${pointer}, ${locale} (RF-2)`, async ({ browser }) => {
            const { page, context } = await openAt(browser, width, pointer, 'light', locale);
            const cards = await readCards(page, values);
            await context.close();
            const offenders: string[] = [];
            cards.forEach((c, i) => {
                if (!c.valueShown) offenders.push(`RF-2: ${contacts[i].id} hides its value`);
                if (c.valueClipped) offenders.push(`RF-2: ${contacts[i].id} value is clipped`);
                if (c.valueBox && c.copyBox && (c.valueBox.bottom <= c.copyBox.top || c.valueBox.top >= c.copyBox.bottom)) offenders.push(`RF-2: ${contacts[i].id} value is off the controls row`);
            });
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }

    for (const width of [360, 1280]) {
        test(`the value stays in the name, the copy text and the open href — ${width}px (RF-3)`, async ({ browser }) => {
            const { page, context } = await openAt(browser, width, 'fine', 'light', 'es');
            const t = tr('es');
            const cards = await readCards(page, values);
            const offenders: string[] = [];
            for (let i = 0; i < contacts.length; i++) {
                const c = contacts[i];
                if (cards[i].name !== `${contactLabel(c, t)}: ${c.value}`) offenders.push(`RF-3: ${c.id} is named "${cards[i].name}"`);
                if (cards[i].openHref !== c.href) offenders.push(`RF-3: ${c.id} opens ${cards[i].openHref}`);
                await page.locator(`${SECTION} .contact-card`).nth(i).locator('.copy-btn').click();
                const got = await page.evaluate(() => navigator.clipboard.readText());
                if (got !== copyValue(c)) offenders.push(`RF-3: ${c.id} copies "${got}"`);
            }
            await context.close();
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }

    for (const theme of THEMES) for (const width of [360, 390, 1280]) {
        test(`the label takes the value typography on a phone, the muted style on a desktop — ${width}px, ${theme} (RF-4)`, async ({ browser }) => {
            const { page, context } = await openAt(browser, width, 'fine', theme, 'es', true);
            const cards = await readCards(page, values);
            await context.close();
            const offenders: string[] = [];
            cards.forEach((c, i) => {
                if (width <= 720) { if (c.labelTypo !== c.valueTypo) offenders.push(`RF-4: ${contacts[i].id} label ${c.labelTypo}, value ${c.valueTypo}`); }
                else if (c.labelTypo === c.valueTypo || !c.labelTypo!.startsWith('12px/600/')) offenders.push(`RF-4: ${contacts[i].id} label ${c.labelTypo} lost its desktop style`);
            });
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }

    for (const width of [360, 390]) for (const locale of LOCALES) {
        test(`one row with a coarse pointer: icon, label and both controls — ${width}px, ${locale} (RF-5)`, async ({ browser }) => {
            const { page, context } = await openAt(browser, width, 'coarse', 'light', locale);
            const cards = await readCards(page, values);
            await context.close();
            const offenders: string[] = [];
            cards.forEach((c, i) => {
                if (Math.max(...c.mids) - Math.min(...c.mids) > 1) offenders.push(`RF-5: ${contacts[i].id} centres at ${c.mids.map((m) => m.toFixed(1)).join(', ')}`);
                if (c.labelClipped) offenders.push(`RF-5: ${contacts[i].id} label is clipped`);
            });
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }

    for (const width of [360, 390, 1280]) for (const pointer of ['fine', 'coarse'] as Pointer[]) for (const locale of LOCALES) {
        test(`both controls stay, named, and the copy box holds its three states — ${width}px ${pointer}, ${locale} (RF-6)`, async ({ browser }) => {
            const { page, context } = await openAt(browser, width, pointer, 'light', locale);
            const t = tr(locale);
            const cards = await readCards(page, values);
            const offenders: string[] = [];
            for (let i = 0; i < contacts.length; i++) {
                const label = contactLabel(contacts[i], t);
                if (!cards[i].copyShown || !cards[i].openShown) offenders.push(`RF-6: ${contacts[i].id} lost a control`);
                if (cards[i].copyAria !== t('contact.actions.copyAria', { label })) offenders.push(`RF-6: ${contacts[i].id} copy is named "${cards[i].copyAria}"`);
                if (cards[i].openAria !== t('contact.actions.openAria', { label })) offenders.push(`RF-6: ${contacts[i].id} open is named "${cards[i].openAria}"`);
                const sizes = await page.locator(`${SECTION} .contact-card`).nth(i).locator('.copy-btn').evaluate((btn) => {
                    const size = () => { const r = btn.getBoundingClientRect(); return `${r.width.toFixed(1)}x${r.height.toFixed(1)}`; };
                    const out = [size()];
                    for (const s of ['ok', 'err']) { btn.classList.add(`copy-btn--${s}`); out.push(size()); btn.classList.remove(`copy-btn--${s}`); }
                    return out;
                });
                if (new Set(sizes).size !== 1) offenders.push(`RF-6: ${contacts[i].id} copy box is ${sizes.join(' / ')}`);
            }
            await context.close();
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }

    test('one threshold: at 720 and 721 either every card shows its value or none does (NFR)', async ({ browser }) => {
        const seen: Record<number, boolean[]> = {};
        for (const width of [720, 721]) {
            const { page, context } = await openAt(browser, width, 'fine', 'light', 'es', true);
            seen[width] = (await readCards(page, values)).map((c) => c.valueShown);
            await context.close();
            expect(new Set(seen[width]).size, `${width}px mixes shown and hidden values`).toBe(1);
        }
        expect(seen[720][0]).toBe(false);
        expect(seen[721][0]).toBe(true);
    });
});
