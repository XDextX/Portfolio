import { test, expect, type Page } from '@playwright/test';
import { E2E_URL as DEV_URL } from './helpers/server';
import { openIn, installHelpers, settled } from './helpers/rendered';
import { parseColour, parseGradients, composites, worstPoint, onRamp, luminance, type Rgba } from '../tests/helpers/colour';

// Spec 009: dark glows on the home sections. RF-1 placement, RF-2 light unchanged,
// RF-3 forced colours, RF-4 palette, RF-5/6 worst point, RF-7 ramp bound, RF-8 static.

let PROJECT = '';
const WIDTHS = [390, 800, 1280];
const SURFACES = 'main > section.section';

// Recorded 2026-10-15 from the code before spec 009's CSS, light theme, reading every
// <section>'s background-image and background-color on four routes at three widths.
const LIGHT_BASELINE_VALUE = 'none | rgba(0, 0, 0, 0)';
const LIGHT_BASELINE_KEYS = [
    '/ @390 About#0', '/ @390 ValueProposition#1', '/ @390 skills#2', '/ @390 Experience#3', '/ @390 section#4', '/ @390 Contact#5',
    '/ @800 About#0', '/ @800 ValueProposition#1', '/ @800 skills#2', '/ @800 Experience#3', '/ @800 section#4', '/ @800 Contact#5',
    '/ @1280 About#0', '/ @1280 ValueProposition#1', '/ @1280 skills#2', '/ @1280 Experience#3', '/ @1280 section#4', '/ @1280 Contact#5',
    '/proyectos @390 wrap#0', '/proyectos @390 section#1', '/proyectos @800 wrap#0', '/proyectos @800 section#1',
    '/proyectos @1280 wrap#0', '/proyectos @1280 section#1',
    '/proyectos/<first> @390 wrap#0', '/proyectos/<first> @390 grid#1', '/proyectos/<first> @390 readme#2',
    '/proyectos/<first> @800 wrap#0', '/proyectos/<first> @800 grid#1', '/proyectos/<first> @800 readme#2',
    '/proyectos/<first> @1280 wrap#0', '/proyectos/<first> @1280 grid#1', '/proyectos/<first> @1280 readme#2',
    '/no-such-page @390 wrap#0', '/no-such-page @800 wrap#0', '/no-such-page @1280 wrap#0',
];

const hex = (c: Rgba) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const lum = (c: Rgba) => luminance(hex(c));

// The dark ramp, the gold and the sheet, read from probes so the tokens stay the source.
const readRamp = (page: Page) =>
    page.evaluate(() => {
        const read = (v: string) => {
            const s = document.createElement('span');
            s.style.color = `var(${v})`;
            document.body.append(s);
            const c = getComputedStyle(s).color;
            s.remove();
            return c;
        };
        return {
            ramp: ['--bg', '--neutral-50', '--main-bg', '--neutral-100', '--neutral-200'].map(read),
            gold: read('--brand-accent'),
            sheet: getComputedStyle(document.querySelector('main')!).backgroundColor,
        };
    });

test.describe('dark glows (spec 009)', () => {
    test.describe.configure({ mode: 'default' });

    test.beforeAll(async ({ browser }) => {
        const page = await browser.newPage();
        await page.goto(DEV_URL + '/');
        PROJECT = (await page.locator('a[href^="/proyectos/"]').first().getAttribute('href')) ?? '';
        await page.close();
    });

    test('light renders every section as before (RF-2)', async ({ page }) => {
        test.setTimeout(90000);
        expect(PROJECT, 'the project page needs the GitHub fetch to succeed').not.toBe('');
        const seen: string[] = [];
        const offenders: string[] = [];
        for (const route of ['/', '/proyectos', PROJECT, '/no-such-page']) {
            for (const width of WIDTHS) {
                await page.setViewportSize({ width, height: 900 });
                await openIn(page, DEV_URL, 'light', route);
                const rows = await page.evaluate(() => [...document.querySelectorAll('section')].map((el, i) => {
                    const cs = getComputedStyle(el);
                    return [`${el.id || el.className.split(' ')[0]}#${i}`, `${cs.backgroundImage} | ${cs.backgroundColor}`];
                }));
                for (const [k, v] of rows) {
                    const key = `${route === PROJECT ? '/proyectos/<first>' : route} @${width} ${k}`;
                    seen.push(key);
                    if (v !== LIGHT_BASELINE_VALUE) offenders.push(`RF-2: ${key} renders ${v}`);
                }
            }
        }
        expect(seen.sort(), 'the set of sections changed since the recording').toEqual([...LIGHT_BASELINE_KEYS].sort());
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    test('a glow on every home section and nowhere else, in dark (RF-1, NFRs)', async ({ page }) => {
        test.setTimeout(90000);
        const offenders: string[] = [];
        const byLocale: Record<string, string> = {};
        for (const locale of ['es', 'en']) {
            for (const width of WIDTHS) {
                await page.setViewportSize({ width, height: 900 });
                await openIn(page, DEV_URL, 'dark', `/?lang=${locale}`);
                const r = await page.evaluate((sel) => {
                    const surfaces = [...document.querySelectorAll(sel)];
                    const bad: string[] = [];
                    const has = (el: Element, pseudo?: string) => /gradient\(|url\(/.test(getComputedStyle(el, pseudo).backgroundImage);
                    for (const s of surfaces) {
                        const cs = getComputedStyle(s);
                        if (!/gradient\(/.test(cs.backgroundImage)) bad.push(`RF-1: ${s.id || 'section'} holds no gradient`);
                        if (/url\(/.test(cs.backgroundImage)) bad.push(`NFR: ${s.id} holds an image`);
                        if (cs.filter !== 'none' || cs.backdropFilter !== 'none') bad.push(`NFR: ${s.id} has a filter`);
                        if (cs.backgroundAttachment.includes('fixed')) bad.push(`NFR: ${s.id} is fixed`);
                        if (has(s, '::before') || has(s, '::after')) bad.push(`RF-1: a pseudo-element of ${s.id} holds a glow`);
                        for (const d of s.querySelectorAll('*')) {
                            if (has(d)) bad.push(`RF-1: ${d.tagName.toLowerCase()}.${[...d.classList].join('.')} inside ${s.id} holds a background image`);
                            if (has(d, '::before') || has(d, '::after')) bad.push(`RF-1: a pseudo-element inside ${s.id} holds a glow`);
                        }
                    }
                    for (const el of [document.body, document.querySelector('main')!]) if (has(el)) bad.push(`RF-1: ${el.tagName.toLowerCase()} holds a glow`);
                    return { count: surfaces.length, hero: !!document.querySelector('main > section.section--hero'), bad, images: surfaces.map((s) => getComputedStyle(s).backgroundImage).join(' ; ') };
                }, SURFACES);
                if (r.count < 6) offenders.push(`RF-1: ${r.count} home sections, expected 6`);
                if (!r.hero) offenders.push('RF-1: no .section--hero on the home page');
                offenders.push(...r.bad);
                if (width === 1280) byLocale[locale] = r.images;
            }
        }
        if (byLocale.es !== byLocale.en) offenders.push('NFR: the glows differ between es and en');
        for (const route of ['/proyectos', PROJECT || '/proyectos/<missing: GitHub fetch>', '/no-such-page']) {
            await openIn(page, DEV_URL, 'dark', route);
            const n = await page.evaluate(() => [...document.querySelectorAll('section, main, body')].filter((el) => /gradient\(/.test(getComputedStyle(el).backgroundImage)).length);
            if (n) offenders.push(`RF-1: ${route} holds ${n} glow(s)`);
        }
        expect([...new Set(offenders)], [...new Set(offenders)].join('\n')).toEqual([]);
    });

    test('no glow under forced colours (RF-3)', async ({ page }) => {
        await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
        await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });
        await page.goto(DEV_URL + '/');
        const images = await page.evaluate((sel) => [...document.querySelectorAll(sel)].map((s) => getComputedStyle(s).backgroundImage), SURFACES);
        const offenders = images.map((im, i) => (im !== 'none' ? `RF-3: surface ${i} keeps ${im}` : '')).filter(Boolean);
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    test('every glow is sRGB navy steps, gold in the hero only, inside the ramp (RF-4, RF-7)', async ({ page }) => {
        await openIn(page, DEV_URL, 'dark', '/');
        const { ramp, gold, sheet } = await readRamp(page);
        const steps = ramp.map(parseColour);
        const goldLine = steps.map((st) => mix(st, parseColour(gold)));
        const offenders: string[] = [];
        const surfaces = await page.evaluate((sel) => [...document.querySelectorAll(sel)].map((s) => ({ id: s.id || 'section', hero: s.classList.contains('section--hero'), image: getComputedStyle(s).backgroundImage })), SURFACES);
        const [lo, hi] = [lum(steps[1]), lum(steps[3])];
        for (const s of surfaces) {
            let gradients: ReturnType<typeof parseGradients> = [];
            try { gradients = parseGradients(s.image); } catch (err) { offenders.push(`RF-4: ${s.id}: ${(err as Error).message}`); continue; }
            for (const g of gradients) {
                if (!g.srgb) offenders.push(`RF-4: ${s.id} interpolates outside sRGB`);
                for (const stop of g.stops) {
                    const flat = composites({ stops: [stop] }, parseColour(sheet))[0];
                    const allowed = s.hero ? [...steps, ...goldLine] : steps;
                    if (!onRamp(flat, allowed, 1.5)) offenders.push(`RF-4: ${s.id} stop ${hex(flat)} is off the navy ramp${s.hero ? ' and its gold line' : ''}`);
                }
                for (const c of composites(g, parseColour(sheet))) {
                    const L = lum(c);
                    if (L < lo - 1e-4 || L > hi + 1e-4) offenders.push(`RF-7: ${s.id} composite ${hex(c)} (L ${L.toFixed(4)}) outside ${lo.toFixed(4)}–${hi.toFixed(4)}`);
                }
            }
        }
        expect([...new Set(offenders)], [...new Set(offenders)].join('\n')).toEqual([]);
    });

    test('text, icons, control borders and focus rings clear their floor at the worst point (RF-5, RF-6)', async ({ page }) => {
        test.setTimeout(150000);
        await openIn(page, DEV_URL, 'dark', '/');
        await installHelpers(page);
        const list = page.locator('.toggle-btn').nth(1);
        if (await list.count()) await list.click();
        const { sheet } = await readRamp(page);
        const images = await page.evaluate((sel) => [...document.querySelectorAll(sel)].map((s) => getComputedStyle(s).backgroundImage), SURFACES);
        const samplesOf = (i: number) => parseGradients(images[i]).flatMap((g) => composites(g, parseColour(sheet)));
        const offenders: string[] = [];
        const measure = async (label: string) => {
            const items = await page.evaluate((sel) => {
                const w = window as any;
                const out: { surface: number; what: string; colour: string; floor: number }[] = [];
                const visible = (el: Element) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
                for (const el of document.querySelectorAll(`${sel} *`)) {
                    if (!visible(el)) continue;
                    const cs = getComputedStyle(el);
                    const name = `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`;
                    const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? '').trim());
                    const px = parseFloat(cs.fontSize);
                    const isIcon = el.tagName.toLowerCase() === 'svg' || (!!cs.maskImage && cs.maskImage !== 'none');
                    const bordered = parseFloat(cs.borderTopWidth) > 0 && (el.matches('a, button, select, input, [tabindex]') || el.getAttribute('role') === 'group');
                    if (!ownText && !isIcon && !bordered) continue;
                    // Text and icons sit on the element's own ground; a border sits on what is behind the element.
                    const groundOf = (start: Element | null) => {
                        try { return w.__groundOf(start, sel); } catch (e) { out.push({ surface: -1, what: `${name}: ${String(e)}`, colour: '', floor: 0 }); return null; }
                    };
                    if (ownText || isIcon) {
                        const g = groundOf(el);
                        if (g?.glow) {
                            if (ownText) out.push({ surface: g.index, what: `text in ${name}`, colour: cs.color, floor: px >= 24 || (px >= 18.66 && Number(cs.fontWeight) >= 700) ? 3 : 4.5 });
                            if (isIcon) out.push({ surface: g.index, what: `icon ${name}`, colour: el.tagName.toLowerCase() === 'svg' ? cs.color : cs.backgroundColor, floor: 3 });
                        }
                    }
                    if (bordered) {
                        const g = groundOf(el.parentElement);
                        if (g?.glow) out.push({ surface: g.index, what: `border of ${name}`, colour: cs.borderTopColor, floor: 3 });
                    }
                }
                return out;
            }, SURFACES);
            for (const it of items) {
                if (it.surface < 0) { offenders.push(`RF-6: ${it.what}`); continue; }
                let c: Rgba;
                try { c = parseColour(it.colour); } catch { continue; }
                if (c.a < 1) continue;
                const r = worstPoint(c, samplesOf(it.surface));
                if (r < it.floor) offenders.push(`${it.what.startsWith('text') ? 'RF-5' : 'RF-6'}: ${label}: surface ${it.surface} ${it.what} ${hex(c)} is ${r.toFixed(2)}:1, floor ${it.floor}`);
            }
            return items.map((i) => i.what).join(' ');
        };
        const found = await measure('at rest');
        for (const need of ['btn-social', 'view-toggle', 'projects-footer__toggle']) if (!found.includes(need)) offenders.push(`RF-6: ${need} not measured on a glow`);
        const focusables = page.locator(`${SURFACES} a, ${SURFACES} button`);
        const n = Math.min(await focusables.count(), 40);
        for (let i = 0; i < n; i++) {
            const f = focusables.nth(i);
            if (!(await f.isVisible())) continue;
            await f.hover();
            await settled(() => f.evaluate((e) => getComputedStyle(e).borderTopColor + getComputedStyle(e).color));
            await measure(`hovering control ${i}`);
        }
        await page.mouse.move(0, 0);
        for (let i = 0; i < 60; i++) {
            await page.keyboard.press('Tab');
            const ring = await page.evaluate((sel) => {
                const a = document.activeElement;
                const s = a && a !== document.body ? a.closest(sel) : null;
                return s ? { surface: [...document.querySelectorAll(sel)].indexOf(s), colour: getComputedStyle(a!).outlineColor, name: a!.tagName.toLowerCase() } : null;
            }, SURFACES);
            if (!ring) continue;
            const r = worstPoint(parseColour(ring.colour), samplesOf(ring.surface));
            if (r < 3) offenders.push(`RF-6: focus ring on ${ring.name} in surface ${ring.surface} is ${r.toFixed(2)}:1`);
        }
        expect([...new Set(offenders)], [...new Set(offenders)].join('\n')).toEqual([]);
    });

    test('glows do not change on interaction and never animate (RF-8, static)', async ({ page }) => {
        test.setTimeout(90000);
        await openIn(page, DEV_URL, 'dark', '/');
        const images = () => page.evaluate((sel) => [...document.querySelectorAll(sel)].map((s) => getComputedStyle(s).backgroundImage), SURFACES);
        const rest = await images();
        const offenders: string[] = [];
        const controls = page.locator(`${SURFACES} a, ${SURFACES} button`);
        const n = Math.min(await controls.count(), 30);
        for (let i = 0; i < n; i++) {
            const c = controls.nth(i);
            if (!(await c.isVisible())) continue;
            await c.hover();
            await c.focus();
            const box = await c.boundingBox();
            if (box) { await page.mouse.move(box.x + 2, box.y + 2); await page.mouse.down(); await page.mouse.move(0, 0); await page.mouse.up(); }
            if (page.url() !== DEV_URL + '/') { await openIn(page, DEV_URL, 'dark', '/'); continue; }
            const now = await settled(images);
            if (JSON.stringify(now) !== JSON.stringify(rest)) offenders.push(`RF-8: a glow changes while control ${i} is hovered, focused or pressed`);
        }
        const toggle = page.locator('[data-theme-toggle]').first();
        await toggle.click();
        await toggle.click();
        await page.waitForTimeout(400);
        const motion = await page.evaluate((sel) => [...document.querySelectorAll(sel)].map((s) => {
            const cs = getComputedStyle(s);
            return { anims: s.getAnimations().length, name: cs.animationName, tp: cs.transitionProperty };
        }), SURFACES);
        for (const [i, m] of motion.entries()) {
            if (m.anims || m.name !== 'none') offenders.push(`NFR: surface ${i} animates`);
            if (/background-image|background-position|background-size|(^|,\s*)background(,|$)|(^|,\s*)all(,|$)/.test(m.tp)) offenders.push(`NFR: surface ${i} transitions ${m.tp}`);
        }
        expect([...new Set(offenders)], [...new Set(offenders)].join('\n')).toEqual([]);
    });
});

// A navy step mixed 5% toward the gold: the line the hero's stops may lie on.
function mix(a: Rgba, b: Rgba, t = 0.05): Rgba {
    return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t, a: 1 };
}
