import { test, expect, type Page } from '@playwright/test';
import { E2E_URL } from './helpers/server';
import { THEMES, openIn, type Theme } from './helpers/rendered';

// Spec 044: the project page in the site's design system.

async function open(page: Page, width: number, theme: Theme = 'light', route = '/proyectos/Portfolio') {
    await page.setViewportSize({ width, height: 900 });
    await openIn(page, E2E_URL, theme, `${route}?lang=es`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
}

for (const width of [1280, 390]) for (const theme of THEMES) {
    test(`the lead sits in the header under the title, capped by --measure — ${width}px, ${theme} (RF-4)`, async ({ page }) => {
        await open(page, width, theme);
        const r = await page.evaluate(() => {
            const lead = document.querySelector('.page-header .page-header__lead') as HTMLElement | null;
            const h1 = document.querySelector('.page-header h1');
            // `ch` follows the element's font, so the probe lives inside the lead.
            const probe = document.createElement('i'); probe.style.cssText = 'display:block;font-style:normal;inline-size:var(--measure)'; lead?.append(probe);
            const measure = probe.getBoundingClientRect().width; probe.remove();
            return { lead: lead && { top: lead.getBoundingClientRect().top, width: lead.getBoundingClientRect().width, max: getComputedStyle(lead).maxWidth, text: lead.textContent!.trim() }, h1Bottom: h1?.getBoundingClientRect().bottom ?? null, measure };
        });
        const offenders: string[] = [];
        if (!r.lead) offenders.push('RF-4: no lead in the header');
        else {
            if (r.h1Bottom !== null && r.lead.top < r.h1Bottom - 0.5) offenders.push(`RF-4: the lead (${r.lead.top.toFixed(1)}) is above the h1's bottom (${r.h1Bottom.toFixed(1)})`);
            if (r.lead.width > r.measure + 0.5) offenders.push(`RF-4: the lead is ${r.lead.width.toFixed(1)}px, over --measure ${r.measure.toFixed(1)}px`);
            if (!r.lead.text) offenders.push('RF-4: the lead is empty');
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
}

test('a long name at 360px wraps beside the tile, which stays 48px and left of it (RF-1, edge)', async ({ page }) => {
    await open(page, 360);
    await page.locator('.page-header h1').evaluate((h) => { h.textContent = 'a-very-long-repository-name-that-cannot-fit-on-one-line-at-360'; });
    await page.waitForTimeout(100);
    const r = await page.evaluate(() => {
        const box = (e: Element) => { const x = e.getBoundingClientRect(); return { l: x.left, r: x.right, w: x.width, h: x.height }; };
        const h1 = document.querySelector('.page-header h1')!;
        return { tile: box(document.querySelector('.page-header__tile')!), h1: box(h1), lines: Math.round(h1.getBoundingClientRect().height / parseFloat(getComputedStyle(h1).lineHeight)), main: box(document.querySelector('main')!), doc: document.documentElement.scrollWidth, vw: innerWidth };
    });
    const offenders: string[] = [];
    if (Math.abs(r.tile.w - 48) > 0.5 || Math.abs(r.tile.h - 48) > 0.5) offenders.push(`the tile is ${r.tile.w}×${r.tile.h}, not 48×48`);
    if (r.tile.r > r.h1.l + 0.5) offenders.push('the tile is not left of the name');
    if (r.lines < 2) offenders.push(`the name takes ${r.lines} line, it should wrap`);
    if (r.doc > r.vw) offenders.push(`the page scrolls sideways: ${r.doc} > ${r.vw}`);
    expect(offenders, offenders.join('\n')).toEqual([]);
});

/** Left and right edges of the header, and of the cards (/proyectos) or the body (project page). */
const edges = (page: Page, body: boolean) => page.evaluate((isBody) => {
    const x = (e: Element) => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right }; };
    const header = x(document.querySelector('.page-header')!);
    if (!isBody) return { header, body: x(document.querySelector('.projects-grid')!) };
    const parts = [...document.querySelector('.grid')!.children].map(x);
    return { header, body: { l: Math.min(...parts.map((p) => p.l)), r: Math.max(...parts.map((p) => p.r)) } };
}, body);

for (const width of [360, 390, 800, 1280]) {
    test(`the header and the body sit where /proyectos's header and cards sit — ${width}px (RF-3)`, async ({ page }) => {
        await open(page, width, 'light', '/proyectos');
        const list = await edges(page, false);
        await open(page, width, 'light');
        const detail = await edges(page, true);
        const offenders: string[] = [];
        for (const [what, a, b] of [['header', detail.header, list.header], ['body', detail.body, list.body]] as const) {
            for (const k of ['l', 'r'] as const) if (Math.abs(a[k] - b[k]) > 1) offenders.push(`RF-3: the ${what}'s ${k} is ${a[k].toFixed(1)}, /proyectos has ${b[k].toFixed(1)}`);
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
}

/** README headings as the browser holds them: text, visibility, id. */
const readmeHeadings = (page: Page) => page.evaluate(() => [...document.querySelectorAll('.readme-body :is(h1,h2,h3,h4,h5,h6)')].map((h) => ({ text: h.textContent!.trim(), id: h.id, shown: (h as HTMLElement).offsetParent !== null })));

test('a README that opens with the project name shows one heading of that name; another opening still shows (RF-6)', async ({ page }) => {
    await open(page, 1280);
    const names = await page.locator('h1, h2, h3, h4, h5, h6').evaluateAll((hs) => hs.filter((h) => (h as HTMLElement).offsetParent !== null).map((h) => h.textContent!.trim().toLowerCase()).filter((n) => n === 'portfolio'));
    expect(names).toEqual(['portfolio']);
    await open(page, 1280, 'light', '/proyectos/XDextX');
    const first = (await readmeHeadings(page))[0];
    expect(first?.shown, 'XDextX README opens with a heading that is not its name').toBe(true);
    expect(first.text.toLowerCase().replace(/[^a-z0-9]/g, '')).not.toBe('xdextx');
});

for (const width of [390, 1280]) {
    test(`no anchor icon, and every README heading keeps its id — ${width}px (RF-7)`, async ({ page }) => {
        await open(page, width);
        expect(await page.locator('.readme-body .octicon-link, .readme-body a.anchor').count()).toBe(0);
        const hs = await readmeHeadings(page);
        expect(hs.length, 'the README has headings').toBeGreaterThan(0);
        expect(hs.filter((h) => !h.id.startsWith('user-content-')).map((h) => h.text)).toEqual([]);
    });
}
