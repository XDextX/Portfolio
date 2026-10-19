import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { E2E_URL } from './helpers/server';
import { THEMES, openIn, type Theme } from './helpers/rendered';
import { worstOverBackground, type PixelTarget } from './helpers/pixels';
import { contrast } from '../tests/helpers/colour';

// Spec 039: the /proyectos header — glyph tile (RF-1), two-tone title (RF-2), the section's line
// (RF-3) and the spec 036 band behind it (RF-4). Spec 044: the tile and the band are checked on
// the project page too, whose header is the same component.

const ROUTES = ['/proyectos', '/proyectos/Portfolio'];
const locale = (l: string) => JSON.parse(readFileSync(join(process.cwd(), 'i18n', 'locales', `${l}.json`), 'utf8'));
const plain = (s: string) => s.replace(/\*/g, '');

async function open(page: Page, width: number, theme: Theme, lang = 'es', route = '/proyectos') {
    await page.setViewportSize({ width, height: 900 });
    await openIn(page, E2E_URL, theme, `${route}?lang=${lang}`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
}

// Resolved colour of a token, as the browser computes it (rgb()), through a probe element.
const token = (page: Page, name: string) => page.evaluate((v) => {
    const i = document.createElement('i'); i.style.color = `var(${v})`; document.body.append(i);
    const c = getComputedStyle(i).color; i.remove(); return c;
}, name);
const hex = (rgb: string) => '#' + (rgb.match(/\d+/g)!.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, '0')).join(''));

for (const route of ROUTES) for (const width of [1280, 390]) for (const theme of THEMES) {
    test(`the tile sits left of the title on one row, with the folder glyph — ${route}, ${width}px, ${theme} (RF-1)`, async ({ page }) => {
        await open(page, width, theme, 'es', route);
        const r = await page.evaluate(() => {
            const tile = document.querySelector('.page-header__tile');
            const h1 = document.querySelector('.page-header h1');
            const box = (e: Element | null) => { if (!e) return null; const x = e.getBoundingClientRect(); return { l: x.left, r: x.right, t: x.top, b: x.bottom }; };
            // The glyph is the tile, a child or the tile's ::before — whichever carries the folder mask.
            const styles = tile ? [getComputedStyle(tile), getComputedStyle(tile, '::before'), ...[...tile.querySelectorAll('*')].map((e) => getComputedStyle(e))] : [];
            const glyph = styles.find((cs) => /folder\.svg/.test(cs.maskImage || cs.webkitMaskImage || ''));
            return { tile: box(tile), h1: box(h1), hidden: tile?.getAttribute('aria-hidden'), bg: tile ? getComputedStyle(tile).backgroundColor : null,
                glyphFound: !!glyph, glyphColour: glyph ? glyph.backgroundColor : null };
        });
        const offenders: string[] = [];
        if (!r.tile || !r.h1) offenders.push('RF-1: no tile or no h1 in the header');
        else {
            if (r.tile.r > r.h1.l + 0.5) offenders.push(`RF-1: the tile's right ${r.tile.r.toFixed(1)} is past the h1's left ${r.h1.l.toFixed(1)}`);
            if (r.tile.b <= r.h1.t || r.tile.t >= r.h1.b) offenders.push('RF-1: the tile and the h1 are not on one row');
            if (r.hidden !== 'true') offenders.push('RF-1: the tile is not aria-hidden');
            if (!r.glyphFound) offenders.push('RF-1: no folder.svg mask in the tile');
            const surface = await token(page, '--accent-surface');
            const ink = await token(page, '--accent-surface-text');
            if (r.bg !== surface) offenders.push(`RF-1: tile fill ${r.bg}, want --accent-surface ${surface}`);
            if (r.glyphColour !== ink) offenders.push(`RF-1: glyph ${r.glyphColour}, want --accent-surface-text ${ink}`);
            if (r.bg && r.glyphColour && contrast(hex(r.glyphColour), hex(r.bg)) < 3) offenders.push(`RF-1: glyph on tile under 3:1`);
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
}

for (const theme of THEMES) {
    test(`the title is ink with a gold word, named by the plain title — ${theme} (RF-2)`, async ({ page }) => {
        await open(page, 1280, theme);
        const r = await page.evaluate(() => {
            const h1 = document.querySelector('.page-header h1');
            const word = document.querySelector('.page-header h1 .projects-page__word');
            return { name: h1?.textContent?.replace(/\s+/g, ' ').trim(), ink: h1 ? getComputedStyle(h1).color : null, gold: word ? getComputedStyle(word).color : null,
                sheet: getComputedStyle(document.querySelector('main')!).backgroundColor };
        });
        const offenders: string[] = [];
        const want = plain(locale('es').projects.title);
        if (r.name !== want) offenders.push(`RF-2: accessible name "${r.name}", want "${want}"`);
        const accent = await token(page, '--accent-text');
        const text = await token(page, '--text-color');
        if (r.gold !== accent) offenders.push(`RF-2: gold word ${r.gold}, want --accent-text ${accent}`);
        if (r.ink !== text) offenders.push(`RF-2: h1 ${r.ink}, want --text-color ${text}`);
        for (const [n, c] of [['gold', r.gold], ['ink', r.ink]] as const) if (c && contrast(hex(c), hex(r.sheet)) < 4.5) offenders.push(`RF-2: ${n} under 4.5:1 on the sheet`);
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
}

for (const lang of ['es', 'en']) {
    test(`the lead reads projects.lead — ${lang} (RF-3)`, async ({ page }) => {
        await open(page, 1280, 'light', lang);
        const got = await page.locator('.page-header__lead').first().textContent({ timeout: 2000 }).catch(() => null);
        expect(got?.trim() ?? null).toBe(locale(lang).projects.lead);
    });
}

// RF-4: every text, icon and control in the header, measured over the bare band.
const TARGETS: PixelTarget[] = [
    { sel: '.page-header .crumbs a', kind: 'text', floor: 4.5 },
    { sel: '.page-header .crumbs span', kind: 'text', floor: 4.5 },
    { sel: '.page-header h1', kind: 'text', floor: 4.5 },
    { sel: '.page-header h1 .projects-page__word', kind: 'text', floor: 4.5 },
    { sel: '.page-header__lead', kind: 'text', floor: 4.5 },
    { sel: '.layout-topbar select, .layout-topbar label', kind: 'border', floor: 3 },
    { sel: '.theme-btn', kind: 'border', floor: 3 },
    { sel: '.theme-btn', kind: 'icon', floor: 3 },
    // Spec 040: the filters rest transparent on the band; the current one carries its own fill (RF-3).
    { sel: '.page-header .project-filter:not([aria-current])', kind: 'text', floor: 4.5 },
    { sel: '.page-header .project-filter:not([aria-current])', kind: 'border', floor: 3 },
];

for (const route of ROUTES) for (const width of [1280, 390]) {
    test(`band box: sheet top to header bottom, full sheet width — ${route}, ${width}px (RF-4)`, async ({ page }) => {
        await open(page, width, 'light', 'es', route);
        const r = await page.evaluate(() => {
            const b = (e: Element | null) => { if (!e) return null; const x = e.getBoundingClientRect(); return { l: x.left, r: x.right, t: x.top, b: x.bottom }; };
            return { band: b(document.querySelector('.hero-band')), main: b(document.querySelector('main')), header: b(document.querySelector('.page-header')), grid: b(document.querySelector('.grid')) };
        });
        const offenders: string[] = [];
        if (!r.band) offenders.push('RF-4: no band');
        else for (const [k, want] of [['l', r.main!.l], ['r', r.main!.r], ['t', r.main!.t], ['b', r.header!.b]] as const) {
            if (Math.abs((r.band as any)[k] - want) > 1) offenders.push(`RF-4: band ${k} ${(r.band as any)[k].toFixed(1)}, want ${want.toFixed(1)}`);
        }
        // The sidebar and the README sit below the header, so the band ends above them (spec 044).
        if (route !== '/proyectos' && (!r.grid || r.grid.t < r.header!.b - 0.5)) offenders.push('RF-2: the body starts inside the header');
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
}

// The project page's header: crumbs, the back button's text and border, the title, the lead.
const PROJECT_TARGETS: PixelTarget[] = [
    { sel: '.page-header .crumbs a', kind: 'text', floor: 4.5 },
    { sel: '.page-header .crumbs span', kind: 'text', floor: 4.5 },
    { sel: '.page-header .back-btn', kind: 'text', floor: 4.5 },
    { sel: '.page-header .back-btn', kind: 'border', floor: 3 },
    { sel: '.page-header h1', kind: 'text', floor: 4.5 },
    { sel: '.page-header__lead', kind: 'text', floor: 4.5 },
    { sel: '.layout-topbar select, .layout-topbar label', kind: 'border', floor: 3 },
    { sel: '.theme-btn', kind: 'border', floor: 3 },
    { sel: '.theme-btn', kind: 'icon', floor: 3 },
];

for (const route of ROUTES) for (const theme of THEMES) for (const width of [1280, 390]) {
    test(`text, icons and controls clear their floors over the band — ${route}, ${theme}, ${width}px (RF-4)`, async ({ page }) => {
        await open(page, width, theme, 'es', route);
        const res = await worstOverBackground(page, route === '/proyectos' ? TARGETS : PROJECT_TARGETS, '.layout-topbar, .page-header > :not(.hero-band)', '.hero-band');
        const offenders = res.filter((w) => w.ratio < w.floor).map((w) => `RF-4: ${w.sel} ${w.kind} ${w.fg} on ${w.at} is ${w.ratio.toFixed(2)}:1, under ${w.floor}`);
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
}
