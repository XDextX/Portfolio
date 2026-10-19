import { test, expect, type Page } from '@playwright/test';
import { E2E_URL } from './helpers/server';
import { THEMES, openIn, type Theme } from './helpers/rendered';
import { HERO_SHAPES } from '../src/data/heroShapes';
import { worstOverBackground, type PixelTarget } from './helpers/pixels';

// Spec 036: the flat-shape band behind the top of the home page — its box (RF-1), token fills that
// follow the theme (RF-2), every text, icon and control clear of the shapes (RF-3), the hero's
// layout untouched (RF-5).

async function open(page: Page, width: number, theme: Theme, route = '/?lang=es') {
    await page.setViewportSize({ width, height: 900 });
    await openIn(page, E2E_URL, theme, route);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
}

const box = (page: Page, sel: string) => page.locator(sel).first().evaluate((e) => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom }; });

for (const width of [1280, 390]) {
    test(`band box: sheet top to hero bottom, full sheet width, sheet corners — ${width}px (RF-1)`, async ({ page }) => {
        await open(page, width, 'light');
        const r = await page.evaluate(() => {
            const b = (e: Element | null) => { if (!e) return null; const x = e.getBoundingClientRect(); return { l: x.left, r: x.right, t: x.top, b: x.bottom }; };
            const band = document.querySelector('.hero-band');
            const main = document.querySelector('main')!;
            return { band: b(band), main: b(main), hero: b(document.querySelector('.section--hero')),
                hidden: band?.getAttribute('aria-hidden'), events: band ? getComputedStyle(band).pointerEvents : null,
                radius: band ? getComputedStyle(band).borderTopLeftRadius : null, mainRadius: getComputedStyle(main).borderTopLeftRadius };
        });
        const offenders: string[] = [];
        if (!r.band) offenders.push('RF-1: no band');
        else {
            for (const [k, want] of [['l', r.main.l], ['r', r.main.r], ['t', r.main.t], ['b', r.hero!.b]] as const) if (Math.abs((r.band as any)[k] - want) > 1) offenders.push(`RF-1: band ${k} ${(r.band as any)[k].toFixed(1)}, want ${want.toFixed(1)}`);
            if (r.hidden !== 'true') offenders.push('RF-1: the band is not aria-hidden');
            if (r.events !== 'none') offenders.push(`RF-1: the band takes pointer events (${r.events})`);
            if (r.radius !== r.mainRadius) offenders.push(`RF-1: the band's corner ${r.radius}, the sheet's ${r.mainRadius}`);
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
}

test('fills are the band tokens and follow the toggle (RF-2)', async ({ page }) => {
    await open(page, 1280, 'light');
    const read = () => page.evaluate((names) => {
        const probe = (v: string) => { const i = document.createElement('i'); i.style.color = `var(${v})`; document.body.append(i); const c = getComputedStyle(i).color; i.remove(); return c; };
        const shapes = [...document.querySelectorAll('.hero-band [data-shape]')].map((e) => { const cs = getComputedStyle(e); return e.tagName.toLowerCase() === 'line' ? cs.stroke : cs.fill; });
        return { shapes, want: names.map(probe) };
    }, HERO_SHAPES.map((s: any) => s.fill ?? s.stroke));
    const offenders: string[] = [];
    const light = await read();
    if (light.shapes.length !== HERO_SHAPES.length) offenders.push(`RF-2: ${light.shapes.length} shapes drawn for ${HERO_SHAPES.length} defined`);
    light.shapes.forEach((c, i) => { if (c !== light.want[i]) offenders.push(`RF-2: light shape ${i + 1} is ${c}, not ${light.want[i]}`); });
    await page.locator('.theme-btn').click();
    await page.waitForTimeout(300);
    const dark = await read();
    if (await page.evaluate(() => document.documentElement.dataset.theme) !== 'dark') offenders.push('RF-2: the toggle did not switch to dark');
    dark.shapes.forEach((c, i) => { if (c !== dark.want[i]) offenders.push(`RF-2: dark shape ${i + 1} is ${c}, not ${dark.want[i]}`); });
    if (JSON.stringify(dark.shapes) === JSON.stringify(light.shapes)) offenders.push('RF-2: the fills did not change with the theme');
    expect(offenders, offenders.join('\n')).toEqual([]);
});

// RF-3: every text, icon and control in the band, measured over the bare band.
const TARGETS: PixelTarget[] = [
    { sel: '.about-name__given', kind: 'text', floor: 4.5 },
    { sel: '.about-name__family', kind: 'text', floor: 4.5 },
    { sel: '.about-job', kind: 'text', floor: 4.5 },
    { sel: '.about-location', kind: 'text', floor: 4.5 },
    { sel: '.about-phrases li', kind: 'text', floor: 4.5 },
    { sel: '.about-bio', kind: 'text', floor: 4.5 },
    { sel: '.btn-social', kind: 'text', floor: 4.5 },
    { sel: '.btn-social', kind: 'border', floor: 3 },
    { sel: '.layout-topbar select, .layout-topbar label', kind: 'border', floor: 3 },
    { sel: '.theme-btn', kind: 'border', floor: 3 },
    { sel: '.theme-btn', kind: 'icon', floor: 3 },
];
const worstOverBand = (page: Page) => worstOverBackground(page, TARGETS, '.layout-topbar, .section--hero > :not(.hero-band)', '.hero-band');

for (const theme of THEMES) for (const width of [1280, 800, 390]) {
    test(`text, icons and controls clear their floors over the band — ${theme}, ${width}px (RF-3)`, async ({ page }) => {
        await open(page, width, theme);
        const offenders = (await worstOverBand(page)).filter((w) => w.ratio < w.floor)
            .map((w) => `RF-3: ${w.sel} ${w.kind} ${w.fg} on ${w.at} is ${w.ratio.toFixed(2)}:1, under ${w.floor}`);
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
}

test('the hero lays out the same with and without the band (RF-5)', async ({ page }) => {
    await open(page, 1280, 'light');
    const sels = ['.about-avatar', '.about-name', '.about-phrases', '.about-bio', '.about-actions'];
    const read = () => Promise.all(sels.map((s) => box(page, s)));
    const withBand = await read();
    await page.evaluate(() => document.querySelector('.hero-band')?.remove());
    const without = await read();
    const offenders: string[] = [];
    sels.forEach((s, i) => { for (const k of ['l', 'r', 't', 'b'] as const) if (Math.abs(withBand[i][k] - without[i][k]) > 1) offenders.push(`RF-5: ${s} ${k} moves ${(withBand[i][k] - without[i][k]).toFixed(1)}px`); });
    expect(offenders, offenders.join('\n')).toEqual([]);
});

// RF-6: the band's last 6rem fade out, so its bottom rows are the page as it is without the band.
async function rows(page: Page, ys: number[], x: number, width: number) {
    const shots: number[][][] = [];
    for (const y of ys) {
        const png = await page.screenshot({ clip: { x, y, width, height: 1 }, animations: 'disabled' });
        shots.push(await page.evaluate(async (b64) => {
            const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode();
            const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = 1;
            const g = c.getContext('2d')!; g.drawImage(img, 0, 0);
            const d = g.getImageData(0, 0, c.width, 1).data; const out: number[][] = [];
            for (let i = 0; i < d.length; i += 4) out.push([d[i], d[i + 1], d[i + 2]]);
            return out;
        }, png.toString('base64')));
    }
    return shots;
}

for (const theme of THEMES) for (const width of [1280, 1860]) {
    test(`the band fades out at its bottom — ${theme}, ${width}px (RF-6)`, async ({ page }) => {
        await open(page, width, theme);
        const band = (await page.locator('.hero-band').boundingBox())!;
        const remPx = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
        const bottom = Math.floor(band.y + band.height) - 2;
        const above = Math.floor(band.y + band.height - 6 * remPx) - 2;
        // Only the band's own pixels: hide everything in front of it, then capture with and without it.
        await page.evaluate(() => { for (const e of document.querySelectorAll('.layout-topbar, .section--hero > :not(.hero-band), main > .section:not(.section--hero)')) (e as HTMLElement).style.visibility = 'hidden'; });
        const x = Math.ceil(band.x), w = Math.floor(band.width);
        const [withBottom, withAbove] = await rows(page, [bottom, above], x, w);
        await page.evaluate(() => { (document.querySelector('.hero-band') as HTMLElement).style.visibility = 'hidden'; });
        const [bareBottom, bareAbove] = await rows(page, [bottom, above], x, w);
        const diff = (a: number[][], b: number[][]) => Math.max(...a.map((p, i) => Math.max(...p.map((v, k) => Math.abs(v - b[i][k])))));
        const offenders: string[] = [];
        if (diff(withBottom, bareBottom) > 2) offenders.push(`RF-6: the band's bottom row differs from the bare page by ${diff(withBottom, bareBottom)}`);
        if (diff(withAbove, bareAbove) <= 10) offenders.push('RF-6: 6rem above the bottom no shape shows, so the fade check has nothing to fade');
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
}
