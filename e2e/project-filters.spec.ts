import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { E2E_URL } from './helpers/server';
import { THEMES, openIn, type Theme } from './helpers/rendered';
import { contrast } from '../tests/helpers/colour';

// Spec 040: the seven category filters under the /proyectos header — links with their glyphs
// (RF-1) and the current one marked for sight and for assistive tech (RF-3).

const locale = (l: string) => JSON.parse(readFileSync(join(process.cwd(), 'i18n', 'locales', `${l}.json`), 'utf8'));

const FILTERS = [
    { key: null, href: '/proyectos', icon: 'layout-grid' },
    { key: 'web', href: '/proyectos?cat=web', icon: 'world' },
    { key: 'backend', href: '/proyectos?cat=backend', icon: 'server' },
    { key: 'frontend', href: '/proyectos?cat=frontend', icon: 'layout' },
    { key: 'mobile', href: '/proyectos?cat=mobile', icon: 'device-mobile' },
    { key: 'database', href: '/proyectos?cat=database', icon: 'table' },
    { key: 'other', href: '/proyectos?cat=other', icon: 'dots' },
];

async function open(page: Page, theme: Theme, route = '/proyectos', lang = 'es') {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openIn(page, E2E_URL, theme, `${route}${route.includes('?') ? '&' : '?'}lang=${lang}`);
    await page.waitForTimeout(400);
}

const hex = (rgb: string) => '#' + (rgb.match(/\d+/g)!.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, '0')).join(''));
const NAV = '.page-header .project-filters a';

for (const lang of ['es', 'en']) {
    test(`seven links in order, each with its label and an aria-hidden glyph mask — ${lang} (RF-1)`, async ({ page }) => {
        await open(page, 'light', '/proyectos', lang);
        const links = await page.evaluate((sel) => [...document.querySelectorAll(sel)].map((a) => {
            const glyph = [...a.querySelectorAll('*')].find((e) => e.getAttribute('aria-hidden') === 'true');
            const cs = glyph ? getComputedStyle(glyph) : null;
            const hrefAttr = a.getAttribute('href');
            return { href: hrefAttr, text: a.textContent?.replace(/\s+/g, ' ').trim(), glyph: !!glyph, mask: cs ? (cs.maskImage || cs.webkitMaskImage || '') : '',
                glyphText: glyph?.textContent?.trim() ?? '' };
        }), NAV);
        const l = locale(lang).projects.filters;
        const labels = [l.all, l.web, l.backend, l.frontend, l.mobile, l.database, l.other];
        const offenders: string[] = [];
        if (links.length !== 7) offenders.push(`RF-1: ${links.length} links, want 7`);
        FILTERS.forEach((f, i) => {
            const got = links[i];
            if (!got) return;
            if (got.href !== f.href) offenders.push(`RF-1: link ${i} href ${got.href}, want ${f.href}`);
            if (got.text !== labels[i]) offenders.push(`RF-1: link ${i} label "${got.text}", want "${labels[i]}"`);
            if (!got.glyph) offenders.push(`RF-1: link ${i} (${f.href}) has no aria-hidden glyph`);
            else if (!got.mask.includes(`/icons/ui/${f.icon}.svg`)) offenders.push(`RF-1: link ${i} glyph mask "${got.mask}", want /icons/ui/${f.icon}.svg`);
        });
        const label = await page.locator('.page-header .project-filters').first().getAttribute('aria-label');
        if (label !== l.label) offenders.push(`RF-1: nav aria-label "${label}", want "${l.label}"`);
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
}

for (const theme of THEMES) for (const current of [null, 'backend']) {
    test(`one link is current (${current ?? 'Todos'}), its ink clears 4.5:1 and the rest keep a 3:1 border — ${theme} (RF-3)`, async ({ page }) => {
        await open(page, theme, current ? `/proyectos?cat=${current}` : '/proyectos');
        const r = await page.evaluate((sel) => {
            const links = [...document.querySelectorAll<HTMLAnchorElement>(sel)];
            const header = document.querySelector('.page-header');
            return {
                inHeader: links.every((a) => header?.contains(a)),
                current: links.map((a, i) => ({ i, c: a.getAttribute('aria-current') })).filter((x) => x.c !== null),
                links: links.map((a) => { const cs = getComputedStyle(a); return { color: cs.color, bg: cs.backgroundColor, border: cs.borderTopColor, w: cs.borderTopWidth }; }),
                sheet: getComputedStyle(document.querySelector('main')!).backgroundColor,
                scroll: [document.documentElement.scrollWidth, innerWidth],
            };
        }, NAV);
        const offenders: string[] = [];
        const want = FILTERS.findIndex((f) => f.key === current);
        if (!r.inHeader) offenders.push('RF-3: the links sit outside .page-header');
        if (r.current.length !== 1 || r.current[0].i !== want || r.current[0].c !== 'page') offenders.push(`RF-3: aria-current on ${JSON.stringify(r.current)}, want only link ${want} = page`);
        r.links.forEach((l, i) => {
            if (i === want) {
                const q = contrast(hex(l.color), hex(l.bg));
                if (q < 4.5) offenders.push(`RF-3: current ink ${l.color} on ${l.bg} is ${q.toFixed(2)}:1, under 4.5`);
            } else {
                const q = contrast(hex(l.border), hex(r.sheet));
                if (q < 3) offenders.push(`RF-3: link ${i} border ${l.border} on the sheet ${r.sheet} is ${q.toFixed(2)}:1, under 3`);
            }
        });
        const surface = await page.evaluate(() => { const i = document.createElement('i'); i.style.color = 'var(--accent-surface)'; document.body.append(i); const c = getComputedStyle(i).color; i.remove(); return c; });
        if (r.links[want] && r.links[want].bg !== surface) offenders.push(`RF-3: current fill ${r.links[want].bg}, want --accent-surface ${surface}`);
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
}

test('hover turns the border gold and nothing lifts (RF-3, AGENTS hover)', async ({ page }) => {
    await open(page, 'light');
    const link = page.locator(NAV).nth(1);
    const before = await link.evaluate((a) => ({ b: getComputedStyle(a).borderTopColor, y: a.getBoundingClientRect().top }));
    await link.hover();
    await page.waitForTimeout(400);
    const after = await link.evaluate((a) => ({ b: getComputedStyle(a).borderTopColor, y: a.getBoundingClientRect().top }));
    expect(after.b).not.toBe(before.b);
    expect(after.y).toBe(before.y);
});

test('nothing scrolls sideways at 360px (RF-1)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await openIn(page, E2E_URL, 'light', '/proyectos?lang=es');
    await page.waitForTimeout(400);
    const w = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: innerWidth }));
    expect(w.scroll, `scrollWidth ${w.scroll} > innerWidth ${w.inner}`).toBeLessThanOrEqual(w.inner);
});

// Settles a client-router navigation: resolves once the swap and the page load have both fired.
const settled = (page: Page) => page.evaluate(() => new Promise<void>((done) => {
    document.addEventListener('astro:page-load', () => setTimeout(done, 700), { once: true });
}));
const headerBox = (page: Page) => page.evaluate(() => { const r = document.querySelector('.page-header')!.getBoundingClientRect(); return { x: r.left, y: r.top + scrollY, w: r.width, h: r.height }; });

test('the header is excluded from the transition and keeps its box across a filter click (RF-6)', async ({ page }) => {
    await open(page, 'light');
    const scoped = await page.locator('.page-header').getAttribute('data-astro-transition-scope');
    expect(scoped, 'header carries no data-astro-transition-scope (transition:animate none)').not.toBeNull();
    const before = await headerBox(page);
    const done = settled(page);
    await page.locator(NAV).nth(2).click();
    await done;
    expect(page.url()).toContain('cat=backend');
    const after = await headerBox(page);
    for (const k of ['x', 'y', 'w', 'h'] as const) expect(Math.abs(after[k] - before[k]), `header ${k} ${before[k]} -> ${after[k]}`).toBeLessThanOrEqual(1);
});

test('cards fade in and out under no-preference motion, and keep their transition names (RF-7)', async ({ page }) => {
    await open(page, 'light', '/proyectos?cat=other');
    const names = () => page.evaluate(() => [...document.querySelectorAll('.project-card')].map((a) => getComputedStyle(a).viewTransitionName));
    const rules = await page.evaluate(() => {
        const found: string[] = [];
        const walk = (list: CSSRuleList, inMotion: boolean) => { for (const r of Array.from(list)) {
            if (r instanceof CSSMediaRule) walk(r.cssRules, inMotion || /prefers-reduced-motion:\s*no-preference/.test(r.conditionText));
            else if (inMotion && r instanceof CSSStyleRule && /view-transition-(old|new)\(\*?\.project-card\)/.test(r.selectorText)) found.push(r.selectorText + '{' + r.style.cssText + '}');
            else if (inMotion && r instanceof CSSKeyframesRule) found.push('@keyframes ' + r.name + ' ' + r.cssText);
        } };
        for (const sh of Array.from(document.styleSheets)) { try { walk(sh.cssRules, false); } catch { /* cross-origin sheet */ } }
        return found;
    });
    // A card that arrives or leaves is faded by an animation whose keyframes move opacity.
    for (const side of ['old', 'new']) {
        const rule = rules.find((r) => new RegExp(`view-transition-${side}\\(\\*?\\.project-card\\):only-child`).test(r));
        const kf = rule?.match(/animation:\s*([\w-]+)/)?.[1];
        expect(kf, `no ${side} rule for .project-card under no-preference: ${rules.join(' | ')}`).toBeTruthy();
        expect(rules.some((r) => r.startsWith(`@keyframes ${kf} `) && /opacity/.test(r)), `keyframes ${kf} do not move opacity`).toBe(true);
    }
    const other = await names();
    expect(other.length).toBeGreaterThan(0);
    const done = settled(page);
    await page.locator(NAV).nth(0).click();
    await done;
    const all = await names();
    for (const n of other) expect(all, `card name ${n} lost across the filter change`).toContain(n);
    expect(other.every((n) => /^p-\d+$/.test(n))).toBe(true);
});

for (const cat of [null, 'backend']) {
    test(`exactly the current filter carries view-transition-name project-filter-current — ${cat ?? 'Todos'} (RF-8)`, async ({ page }) => {
        await open(page, 'light', cat ? `/proyectos?cat=${cat}` : '/proyectos');
        const named = await page.evaluate(() => [...document.querySelectorAll('*')]
            .filter((e) => getComputedStyle(e).viewTransitionName === 'project-filter-current')
            .map((e) => e.getAttribute('aria-current') === 'page' && e.matches('.project-filters a')));
        expect(named, 'one element, the aria-current link').toEqual([true]);
    });
}

// The router scrolls to the top on every new URL; a filter keeps the row where it was, even when the
// chosen category is too short to scroll that far (owner, after the first RF-9 only tested scrollY 0).
for (const from of [0, 200]) {
    test(`choosing a filter keeps the page where it is — from scrollY ${from} (RF-9)`, async ({ page }) => {
        await open(page, 'light');
        await page.setViewportSize({ width: 1280, height: 640 });
        await page.evaluate((y) => scrollTo(0, y), from);
        await page.waitForTimeout(200);
        const rowTop = () => page.locator('.project-filters').evaluate((e) => Math.round(e.getBoundingClientRect().top));
        const before = await rowTop();
        const click = async (i: number) => {
            const done = settled(page);
            await page.locator(NAV).nth(i).click();
            await done;
            return { y: await page.evaluate(() => scrollY), row: await rowTop() };
        };
        expect(await page.evaluate(() => scrollY)).toBe(from);
        expect(await click(2), 'after Backend').toEqual({ y: from, row: before });
        expect(page.url()).toContain('cat=backend');
        expect(await click(0), 'after Todos').toEqual({ y: from, row: before });
    });
}

// The router copies <html>'s attributes from the new document, which carries no data-theme; the
// body painted light for a frame and its background transition faded back (owner, a white flash).
test('dark: the body never paints light during a filter swap (RF-6)', async ({ page }) => {
    await open(page, 'dark');
    const rest = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await page.evaluate(() => {
        const w = window as any; w.__bg = [];
        const tick = () => { w.__bg.push(getComputedStyle(document.body).backgroundColor); if (w.__bg.length < 90) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
    });
    await page.locator(NAV).nth(2).click();
    await page.waitForTimeout(1600);
    const off = [...new Set(await page.evaluate(() => (window as any).__bg as string[]))].filter((c) => c !== rest);
    expect(off, `body background left ${rest}`).toEqual([]);
});

test('the topbar has its own transition group, stacked above the header band (RF-6)', async ({ page }) => {
    await open(page, 'dark');
    expect(await page.locator('.layout-topbar').getAttribute('data-astro-transition-scope'), 'topbar has no transition scope').not.toBeNull();
    const z = await page.evaluate(() => {
        const found: string[] = [];
        const walk = (l: CSSRuleList) => { for (const r of Array.from(l)) {
            if (r instanceof CSSStyleRule && /view-transition-group\(layout-topbar\)/.test(r.selectorText)) found.push(r.style.zIndex);
            else if ((r as CSSGroupingRule).cssRules) walk((r as CSSGroupingRule).cssRules);
        } };
        for (const sh of Array.from(document.styleSheets)) { try { walk(sh.cssRules); } catch { /* cross-origin sheet */ } }
        return found;
    });
    expect(z.some((v) => Number(v) >= 1), `no z-index >= 1 on the topbar group: ${JSON.stringify(z)}`).toBe(true);
});

test('mid-transition the topbar group computes z-index 1 (RF-6)', async ({ page }) => {
    await open(page, 'dark');
    await page.evaluate(() => {
        const w = window as any;
        w.__seen = [];
        const read = () => { if (document.documentElement.matches(':active-view-transition')) w.__seen.push(getComputedStyle(document.documentElement, '::view-transition-group(layout-topbar)').zIndex); };
        const tick = () => { read(); w.__raf = requestAnimationFrame(tick); };
        tick();
    });
    const done = settled(page);
    await page.locator(NAV).nth(2).click();
    await done;
    const seen: string[] = await page.evaluate(() => (window as any).__seen);
    expect(seen.length, 'no frame observed inside an active view transition').toBeGreaterThan(0);
    expect(seen.every((z) => z === '1'), `topbar group z-index while active: ${JSON.stringify([...new Set(seen)])}`).toBe(true);
});
