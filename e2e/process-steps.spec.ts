import { test, expect, type Page } from '@playwright/test';
import { E2E_URL as DEV_URL } from './helpers/server';
import { THEMES, openIn, installHelpers, settled, axQuery, type Theme } from './helpers/rendered';
import { parseColour, parseGradients, composites, worstPoint, contrast, floorFor } from '../tests/helpers/colour';
import { PROCESS } from '../src/data/process';

// Spec 011: "Lo que construyo" as four steps. RF-2 order, RF-4/5 tint and tone,
// RF-6 floors, RF-7 rows, RF-8 arrows; card edge, inert, silent and exception scope.

let PROJECT = '';
const SECTION = '#ValueProposition';
const LOCALES = ['es', 'en'] as const;

// The spec's Colour table, copied 2026-10-15 (D-9: a probe of --step-N-* compares the token with itself).
const TINTS: Record<Theme, string[] | null> = { light: ['#fcf3d6', '#e3ecfb', '#def2e5', '#ece6fa'], dark: null };
const TONES: Record<Theme, string[]> = {
    light: ['#7a5d10', '#1f4494', '#14572a', '#5532a0'],
    dark: ['#e3c770', '#9dbcf5', '#6ee7a8', '#c7b5f7'],
};
// The values the exception introduces: the four light tints and both violet tones.
const EXCEPTION = ['#fcf3d6', '#e3ecfb', '#def2e5', '#ece6fa', '#5532a0', '#c7b5f7'];

/**
 * Distinct rows among box tops.
 * @param tops each box's top @param tol pixels two tops may differ and share a row
 * @returns the number of rows
 */
const rowCount = (tops: number[], tol = 1) =>
    [...tops].sort((a, b) => a - b).reduce((rows, t, i, all) => (i === 0 || t - all[i - 1] > tol ? rows + 1 : rows), 0);

/**
 * Which way a rotated right-pointing arrow points.
 * @param rotate the computed `rotate` value
 * @returns `right`, `down`, or the raw value
 */
const pointing = (rotate: string) => (rotate === 'none' || rotate === '0deg' ? 'right' : rotate === '90deg' ? 'down' : rotate);

const probe = (page: Page, token: string) =>
    page.evaluate((v) => {
        const s = document.createElement('span');
        s.style.color = `var(${v})`;
        document.body.append(s);
        const c = (window as any).__toHex(getComputedStyle(s).color);
        s.remove();
        return c as string;
    }, token);

// Toggle the theme the way a visitor does, then wait for the colours to settle.
async function toggleTo(page: Page, theme: Theme) {
    await page.locator('[data-theme-toggle]').first().click();
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute('data-theme') ?? 'light')).toBe(theme);
    await installHelpers(page);
}

const readColours = (page: Page) =>
    settled(() => page.evaluate((sel) => {
        const w = window as any;
        return [...document.querySelectorAll(`${sel} ol.steps > li`)].map((li) => ({
            card: w.__toHex(getComputedStyle(li).backgroundColor),
            icon: w.__toHex(getComputedStyle(li.querySelector('.step__icon')!).backgroundColor),
        }));
    }, SECTION));

test.describe('process steps (spec 011)', () => {
    test.describe.configure({ mode: 'default' });

    test.beforeAll(async ({ browser }) => {
        const page = await browser.newPage();
        await page.goto(DEV_URL + '/');
        PROJECT = (await page.locator('a[href^="/proyectos/"]').first().getAttribute('href')) ?? '';
        await page.close();
    });

    for (const locale of LOCALES) {
        test(`document order: intro, note, four steps — ${locale} (RF-2)`, async ({ page }) => {
            await openIn(page, DEV_URL, 'light', `/?lang=${locale}`);
            const r = await page.locator(SECTION).evaluate((s) => {
                const kids = [...s.children].map((c) => c.tagName.toLowerCase() + (c.className ? '.' + String(c.className).split(' ')[0] : ''));
                const ol = s.querySelector('ol');
                return {
                    kids,
                    intro: s.querySelector('.process__intro')?.textContent?.trim(),
                    note: s.querySelector('.process__note')?.textContent?.trim(),
                    lists: s.querySelectorAll('ol').length,
                    attrs: ol ? [ol.hasAttribute('start'), ol.hasAttribute('reversed'), [...ol.children].some((li) => li.hasAttribute('value'))] : [],
                    steps: ol ? [...ol.children].map((li) => ({
                        title: li.querySelector('.step__title')?.textContent?.trim(),
                        description: li.querySelector('.step__desc')?.textContent?.trim(),
                        tags: [...li.querySelectorAll('.step__tag')].map((t) => t.textContent?.trim()),
                    })) : [],
                };
            });
            const offenders: string[] = [];
            const order = r.kids.filter((k) => /process__intro|process__note|^ol/.test(k));
            if (JSON.stringify(order) !== JSON.stringify(['p.process__intro', 'p.process__note', 'ol.steps'])) offenders.push(`RF-2: section order is ${r.kids.join(', ')}`);
            if (r.intro !== PROCESS.intro[locale]) offenders.push(`RF-2: intro reads "${r.intro}"`);
            if (r.note !== PROCESS.note[locale]) offenders.push(`RF-2: note reads "${r.note}"`);
            if (r.lists !== 1) offenders.push(`RF-2: ${r.lists} ordered lists, not 1`);
            if (r.attrs.some(Boolean)) offenders.push('RF-2: the list renumbers itself (start, reversed or value)');
            const want = PROCESS.steps.map((s) => ({ title: s.title[locale], description: s.description[locale], tags: [...s.tags[locale]] }));
            if (JSON.stringify(r.steps) !== JSON.stringify(want)) offenders.push(`RF-2: steps read ${JSON.stringify(r.steps).slice(0, 160)}`);
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }

    for (const [from, to] of [['light', 'dark'], ['dark', 'light']] as const) {
        test(`tints and tones, ${from} toggled to ${to} (RF-4, RF-5)`, async ({ page }) => {
            await openIn(page, DEV_URL, from, '/?lang=es');
            await installHelpers(page);
            const offenders: string[] = [];
            const check = async (theme: Theme) => {
                const got = await readColours(page);
                if (got.length !== 4) { offenders.push(`RF-4: ${got.length} step cards in ${theme}`); return; }
                const tints = TINTS[theme] ?? Array(4).fill(await probe(page, '--card-background'));
                got.forEach((g, i) => {
                    if (g.card !== tints[i]) offenders.push(`RF-4: ${theme} card ${i + 1} is ${g.card}, not ${tints[i]}`);
                    if (g.icon !== TONES[theme][i]) offenders.push(`RF-5: ${theme} icon ${i + 1} is ${g.icon}, not ${TONES[theme][i]}`);
                });
            };
            await check(from);
            await toggleTo(page, to);
            await check(to);
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }

    for (const theme of THEMES) {
        test(`floors: every text, icon and arrow clears its floor — ${theme} (RF-6)`, async ({ page }) => {
            await page.setViewportSize({ width: 1280, height: 900 });
            await openIn(page, DEV_URL, theme === 'light' ? 'dark' : 'light', '/?lang=es');
            await installHelpers(page);
            await toggleTo(page, theme);
            const items = await settled(() => page.evaluate((sel) => {
                const w = window as any;
                const s = document.querySelector(sel)!;
                const text = (el: Element, pseudo: string | null = null) => {
                    const cs = getComputedStyle(el, pseudo);
                    return { colour: w.__toHex(cs.color), px: parseFloat(cs.fontSize), weight: Number(cs.fontWeight) };
                };
                const out: any[] = [];
                // The arrow sits in the gap, outside its card: its ground is the section's, not its own fill.
                const onGround = (el: Element, what: string, kind: 'text' | 'mark', c: any) =>
                    out.push({ what, kind, ...c, ground: w.__groundOf(el.classList.contains('step__arrow') ? s : el, 'main > section.section'), image: getComputedStyle(s).backgroundImage });
                for (const el of s.querySelectorAll('.process__intro, .process__note')) onGround(el, el.className, 'text', text(el));
                s.querySelectorAll('ol.steps > li').forEach((li, i) => {
                    const card = w.__toHex(getComputedStyle(li).backgroundColor);
                    const push = (what: string, kind: 'text' | 'mark', c: any, ground = card) => out.push({ what: `step ${i + 1} ${what}`, kind, ...c, ground: { glow: false, colour: ground } });
                    push('number', 'text', text(li, '::marker'));
                    push('title', 'text', text(li.querySelector('.step__title')!));
                    push('description', 'text', text(li.querySelector('.step__desc')!));
                    li.querySelectorAll('.step__tag').forEach((t, j) => push(`tag ${j + 1}`, 'text', text(t), w.__toHex(getComputedStyle(t).backgroundColor)));
                    push('icon', 'mark', { colour: w.__toHex(getComputedStyle(li.querySelector('.step__icon')!).backgroundColor) });
                    const arrow = li.querySelector('.step__arrow');
                    if (arrow) onGround(arrow, `step ${i + 1} arrow`, 'mark', { colour: w.__toHex(getComputedStyle(arrow).backgroundColor) });
                });
                return { out, sheet: getComputedStyle(document.querySelector('main')!).backgroundColor };
            }, SECTION));
            const offenders: string[] = [];
            if (items.out.length < 20) offenders.push(`RF-6: only ${items.out.length} items measured`);
            for (const it of items.out) {
                const floor = it.kind === 'mark' ? 3 : floorFor(it.px, it.weight);
                const ratio = it.ground.glow
                    ? worstPoint(parseColour(it.colour), parseGradients(it.image).flatMap((g) => composites(g, parseColour(items.sheet))))
                    : contrast(it.colour, it.ground.colour);
                if (ratio < floor) offenders.push(`RF-6: ${it.what} ${it.colour} on ${it.ground.glow ? 'the glow' : it.ground.colour} is ${ratio.toFixed(2)}:1, under ${floor}`);
            }
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }

    for (const locale of LOCALES) {
        test(`rows: one row from 1131px, one per row below — ${locale} (RF-7)`, async ({ page }) => {
            const offenders: string[] = [];
            for (const [width, want] of [[1280, 1], [1131, 1], [1130, 4], [320, 4]] as const) {
                await page.setViewportSize({ width, height: 900 });
                await openIn(page, DEV_URL, 'light', `/?lang=${locale}`);
                // Overflow is content past the card's inner edge; the arrow sits outside on purpose.
                const r = await settled(() => page.locator(`${SECTION} ol.steps > li`).evaluateAll((lis) => lis.map((li) => {
                    const box = li.getBoundingClientRect();
                    const inner = box.right - parseFloat(getComputedStyle(li).borderRightWidth);
                    const content = [...li.querySelectorAll('*')].filter((e) => !e.closest('.step__arrow'));
                    return { top: box.top, over: content.some((e) => e.getBoundingClientRect().right > inner + 0.5) };
                })));
                const rows = rowCount(r.map((x) => x.top));
                if (rows !== want) offenders.push(`RF-7: ${rows} rows at ${width}px, not ${want}`);
                r.forEach((x, i) => { if (x.over) offenders.push(`RF-7: card ${i + 1} overflows at ${width}px`); });
            }
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }

    test('arrows: three, between consecutive steps, right in a row and down stacked (RF-8)', async ({ page }) => {
        const offenders: string[] = [];
        for (const [width, dir] of [[1280, 'right'], [1130, 'down']] as const) {
            await page.setViewportSize({ width, height: 900 });
            await openIn(page, DEV_URL, 'light', '/?lang=es');
            const r = await settled(() => page.locator(`${SECTION} ol.steps`).evaluate((ol) => {
                const lis = [...ol.children];
                return {
                    count: ol.querySelectorAll('.step__arrow').length,
                    steps: lis.map((li) => {
                        const a = li.querySelector(':scope > .step__arrow');
                        const box = (e: Element) => { const b = e.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom }; };
                        return { card: box(li), arrow: a ? box(a) : null, rotate: a ? getComputedStyle(a).rotate : null };
                    }),
                };
            }));
            if (r.count !== 3) offenders.push(`RF-8: ${r.count} arrows at ${width}px, not 3`);
            r.steps.slice(0, 3).forEach((s, i) => {
                const next = r.steps[i + 1].card;
                if (!s.arrow) { offenders.push(`RF-8: step ${i + 1} holds no arrow at ${width}px`); return; }
                if (pointing(s.rotate!) !== dir) offenders.push(`RF-8: arrow ${i + 1} points ${pointing(s.rotate!)} at ${width}px, not ${dir}`);
                const between = dir === 'right'
                    ? s.arrow.l >= s.card.r - 0.5 && s.arrow.r <= next.l + 0.5
                    : s.arrow.t >= s.card.b - 0.5 && s.arrow.b <= next.t + 0.5;
                if (!between) offenders.push(`RF-8: arrow ${i + 1} is not between steps ${i + 1} and ${i + 2} at ${width}px`);
            });
            if (r.steps[3]?.arrow) offenders.push('RF-8: the last step holds an arrow');
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    for (const theme of THEMES) {
        test(`frame: card edge, radii, italic note, capped intro — ${theme} (NFR)`, async ({ page }) => {
            await openIn(page, DEV_URL, theme, '/?lang=es');
            await installHelpers(page);
            const border = await probe(page, '--color-border');
            const r = await page.locator(SECTION).evaluate((s) => {
                const w = window as any;
                const p = document.createElement('div');
                p.style.cssText = 'max-inline-size: var(--measure); border-radius: var(--radius-xs)';
                s.append(p);
                const want = { measure: getComputedStyle(p).maxInlineSize, tagRadius: getComputedStyle(p).borderTopLeftRadius };
                p.remove();
                return {
                    want,
                    cards: [...s.querySelectorAll('ol.steps > li')].map((li) => { const cs = getComputedStyle(li); return [cs.borderTopWidth, cs.borderTopStyle, w.__toHex(cs.borderTopColor), cs.borderTopLeftRadius].join(' '); }),
                    tags: [...s.querySelectorAll('.step__tag')].map((t) => getComputedStyle(t).borderTopLeftRadius),
                    note: s.querySelector('.process__note') ? getComputedStyle(s.querySelector('.process__note')!).fontStyle : 'missing',
                    intro: s.querySelector('.process__intro') ? getComputedStyle(s.querySelector('.process__intro')!).maxInlineSize : 'missing',
                };
            });
            const offenders: string[] = [];
            if (r.cards.length !== 4) offenders.push(`NFR: ${r.cards.length} step cards`);
            r.cards.forEach((c, i) => { if (c !== `1px solid ${border} 14px`) offenders.push(`NFR: card ${i + 1} edge is ${c}, not 1px solid ${border} 14px`); });
            if (!r.tags.length || r.tags.some((t) => t !== r.want.tagRadius)) offenders.push(`NFR: tag radii ${[...new Set(r.tags)].join(', ') || 'none'}, not ${r.want.tagRadius}`);
            if (r.note !== 'italic') offenders.push(`NFR: the note is ${r.note}, not italic`);
            if (r.intro !== r.want.measure) offenders.push(`NFR: the intro caps at ${r.intro}, not ${r.want.measure}`);
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }

    test('inert and silent: no control, no hover change, no decoration in the AX tree (NFR)', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 900 });
        await openIn(page, DEV_URL, 'light', '/?lang=es');
        await installHelpers(page);
        const offenders: string[] = [];
        const controls = await page.locator(`${SECTION} ol.steps`).evaluate((ol) => ol.querySelectorAll('a, button, [tabindex], script').length);
        if (controls) offenders.push(`NFR: ${controls} link, button, tab stop or script in the steps`);
        const snap = (i: number) => page.locator(`${SECTION} ol.steps > li`).nth(i).evaluate((li) => {
            const cs = getComputedStyle(li);
            return [cs.borderColor, cs.backgroundColor, cs.transform, getComputedStyle(li.querySelector('.step__icon')!).backgroundColor].join('|');
        });
        const n = await page.locator(`${SECTION} ol.steps > li`).count();
        for (let i = 0; i < n; i++) {
            const before = await settled(() => snap(i));
            await page.locator(`${SECTION} ol.steps > li`).nth(i).hover();
            if ((await settled(() => snap(i))) !== before) offenders.push(`NFR: step ${i + 1} changes on hover`);
        }
        const images = await axQuery(page, SECTION, 'image');
        if (images.length) offenders.push(`NFR: ${images.length} image node(s) in the section's AX tree`);
        // queryAXTree returns every descendant list item: the four steps plus each tag.
        const tagCount = PROCESS.steps.reduce((n, s) => n + s.tags.es.length, 0);
        const items = await axQuery(page, `${SECTION} ol.steps`, 'listitem');
        if (items.length !== 4 + tagCount) offenders.push(`NFR: the AX tree holds ${items.length} list items, not 4 steps + ${tagCount} tags`);
        const hidden = await page.locator(`${SECTION} .step__icon, ${SECTION} .step__arrow`).evaluateAll((els) => els.filter((e) => e.getAttribute('aria-hidden') !== 'true').length);
        if (hidden) offenders.push(`NFR: ${hidden} icon or arrow not aria-hidden`);
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    for (const theme of THEMES) {
        test(`exception scope: no step colour outside the section — ${theme} (NFR)`, async ({ page }) => {
            test.setTimeout(90000);
            expect(PROJECT, 'the project page needs the GitHub fetch to succeed').not.toBe('');
            const offenders: string[] = [];
            for (const route of ['/', '/proyectos', PROJECT, '/no-such-page']) {
                await openIn(page, DEV_URL, theme, route);
                const hits = await page.evaluate(([sel, bad]) => {
                    const hex = (c: string) => {
                        const m = c.match(/rgba?\(([^)]+)\)/);
                        if (!m) return '';
                        const [r, g, b, a = '1'] = m[1].split(/[\s,/]+/).filter(Boolean);
                        return Number(a) === 0 ? '' : '#' + [r, g, b].map((v) => Number(v).toString(16).padStart(2, '0')).join('');
                    };
                    const section = document.querySelector(sel);
                    const out: string[] = [];
                    for (const el of document.querySelectorAll('body *')) {
                        if (section && section.contains(el)) continue;
                        const cs = getComputedStyle(el);
                        for (const p of ['background-color', 'color', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'outline-color', 'fill', 'stroke']) {
                            const h = hex(cs.getPropertyValue(p));
                            if ((bad as string[]).includes(h)) out.push(`${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''} ${p} ${h}`);
                        }
                    }
                    return out;
                }, [SECTION, EXCEPTION] as const);
                for (const h of hits) offenders.push(`NFR: ${route} ${h}`);
            }
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }
});
