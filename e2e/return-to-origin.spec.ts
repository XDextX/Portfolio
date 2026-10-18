import { test, expect, type Page, type Locator } from '@playwright/test';
import { E2E_URL } from './helpers/server';
import { THEMES, openIn, settled, type Theme } from './helpers/rendered';

// Spec 041: following a link back to a page lands on the link the visitor left from, focused.
// Links are chosen by position, not by repo name, so the GitHub list does not matter.

const VIEWPORTS = [{ width: 1280, height: 800 }, { width: 390, height: 800 }];
const HOME_LINKS = 'section[aria-labelledby="projects-title"]';
const INICIO = (page: Page) => page.getByRole('link', { name: 'Inicio', exact: true }).first();
const BACK = (page: Page) => page.locator('a.back-btn');

async function open(page: Page, route: string, vp = VIEWPORTS[0], theme: Theme = 'light') {
    await page.setViewportSize(vp);
    await openIn(page, E2E_URL, theme, `${route}${route.includes('?') ? '&' : '?'}lang=es`);
    await page.waitForTimeout(400);
}

/** The link as the record holds it: its href and its place among links with that href. */
const identify = (link: Locator) => link.evaluate((a) => {
    const href = a.getAttribute('href')!;
    return { href, index: [...document.querySelectorAll(`a[href="${CSS.escape(href)}"]`)].indexOf(a) };
});

/** Follow a link and wait for the new page to settle; returns the settled scrollY. */
async function follow(page: Page, link: Locator, path: string) {
    await link.click();
    await page.waitForURL((u) => u.pathname === path);
    return settled(() => page.evaluate(() => scrollY));
}

/** The active element and the link it must be, plus whether the link sits fully inside the viewport. */
const landed = (page: Page, origin: { href: string; index: number }) => page.evaluate((o) => {
    const link = document.querySelectorAll(`a[href="${CSS.escape(o.href)}"]`)[o.index] as HTMLElement;
    const r = link.getBoundingClientRect();
    return { focused: document.activeElement === link, inView: r.top >= 0 && r.bottom <= innerHeight };
}, origin);

const lastCard = (page: Page) => page.locator('a[href^="/proyectos/"]').last();

for (const vp of VIEWPORTS) {
    for (const theme of THEMES) {
        test(`Home, "Ver todos", "Inicio" lands on that link, focused — ${vp.width}px ${theme} (RF-1)`, async ({ page }) => {
            await open(page, '/', vp, theme);
            const link = page.locator(`${HOME_LINKS} a[href="/proyectos"]`).nth(1);
            const origin = await identify(link);
            await follow(page, link, '/proyectos');
            await follow(page, INICIO(page), '/');
            expect(await landed(page, origin)).toEqual({ focused: true, inView: true });
        });
    }

    test(`Home, the first card, "Inicio" lands on that card, focused — ${vp.width}px (RF-1)`, async ({ page }) => {
        await open(page, '/', vp);
        const card = page.locator(`${HOME_LINKS} a[href^="/proyectos/"]`).first();
        const origin = await identify(card);
        await follow(page, card, new URL(E2E_URL + origin.href).pathname);
        await follow(page, INICIO(page), '/');
        expect(await landed(page, origin)).toEqual({ focused: true, inView: true });
    });

    // The page's other "Volver a proyectos" is on the unavailable-repo branch, which a card never reaches.
    test(`/proyectos, the last card, "Volver a proyectos" lands on that card — ${vp.width}px (RF-1)`, async ({ page }) => {
        await open(page, '/proyectos', vp);
        const card = lastCard(page);
        const origin = await identify(card);
        await follow(page, card, origin.href);
        await follow(page, BACK(page).first(), '/proyectos');
        expect(await landed(page, origin)).toEqual({ focused: true, inView: true });
    });
}

// Astro fires astro:page-load after astro:after-swap, so a Back clicked from the swap itself is the
// earliest click there is: no listener armed on page-load exists yet (the first 390px run, cold, hit it).
test('Back clicked as the page swaps in still lands on the card (RF-1)', async ({ page }) => {
    await open(page, '/proyectos', VIEWPORTS[1]);
    const card = lastCard(page);
    const origin = await identify(card);
    await page.evaluate(() => {
        const w = window as any; w.__swaps = 0;
        document.addEventListener('astro:after-swap', () => {
            if (++w.__swaps === 1) document.querySelector<HTMLElement>('a.back-btn')?.click();
        });
    });
    await card.click();
    await page.waitForFunction(() => (window as any).__swaps === 2); // the card's swap, then the return's
    await settled(() => page.evaluate(() => scrollY));
    expect(await landed(page, origin)).toEqual({ focused: true, inView: true });
});

// "Inicio" arms a restore for Home; "Volver a proyectos" clicked from its astro:after-preparation
// supersedes it before the swap. /proyectos was never left in this tab, so it opens at the top.
test('a superseded navigation restores nothing on the page that replaced it (RF-5)', async ({ page }) => {
    await open(page, '/');
    const card = page.locator(`${HOME_LINKS} a[href^="/proyectos/"]`).first();
    await follow(page, card, new URL(E2E_URL + (await identify(card)).href).pathname);
    await page.evaluate(() => document.addEventListener('astro:after-preparation', () => {
        document.querySelector<HTMLElement>('a.back-btn')?.click();
    }, { once: true }));
    await INICIO(page).click();
    await page.waitForURL((u) => u.pathname === '/proyectos');
    expect(await settled(() => page.evaluate(() => scrollY))).toBe(0);
    expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
});

/** Journey Home, "Ver todos", then rewrite Home's record and return with "Inicio". */
async function returnHomeWith(page: Page, record: object | null) {
    await open(page, '/');
    await follow(page, page.locator(`${HOME_LINKS} a[href="/proyectos"]`).nth(1), '/proyectos');
    await page.evaluate((r) => {
        if (r) sessionStorage.setItem('return-origin:/', JSON.stringify(r));
        else sessionStorage.removeItem('return-origin:/');
    }, record);
    return follow(page, INICIO(page), '/');
}

test('the origin gone: the section heading is shown, fully in view (RF-2)', async ({ page }) => {
    await returnHomeWith(page, { href: '/proyectos', index: 99, heading: 'projects-title' });
    const box = await page.locator('#projects-title').evaluate((e) => {
        const r = e.getBoundingClientRect();
        return { inView: r.top >= 0 && r.bottom <= innerHeight };
    });
    expect(box).toEqual({ inView: true });
});

test('the origin and its section gone: the page opens at the top (RF-2)', async ({ page }) => {
    await returnHomeWith(page, { href: '/proyectos', index: 99, heading: 'no-such-heading' });
    expect(await page.evaluate(() => scrollY)).toBe(0);
});

test('/proyectos: the origin gone and no heading: the page heading is in view (RF-2)', async ({ page }) => {
    await open(page, '/proyectos');
    await follow(page, lastCard(page), (await identify(lastCard(page))).href);
    await page.evaluate(() => sessionStorage.setItem('return-origin:/proyectos', JSON.stringify({ href: '/proyectos', index: 99, heading: null })));
    await follow(page, BACK(page).first(), '/proyectos');
    const inView = await page.locator('main h1').evaluate((e) => {
        const r = e.getBoundingClientRect();
        return r.top >= 0 && r.bottom <= innerHeight;
    });
    expect(inView).toBe(true);
});

for (const reduce of ['reduce', 'no-preference'] as const) {
    test(`the return never paints at the top first — motion ${reduce} (RF-3, NFR)`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: reduce });
        await open(page, '/');
        await follow(page, page.locator(`${HOME_LINKS} a[href="/proyectos"]`).nth(1), '/proyectos');
        await page.waitForTimeout(600); // the previous return's transition tail still moves scrollY
        await page.evaluate(() => {
            const w = window as any; w.__y = [];
            const tick = () => { w.__y.push(Math.round(scrollY)); requestAnimationFrame(tick); };
            requestAnimationFrame(tick);
            // A frame sampler cannot see the router's same-task scroll, so also read scrollY at
            // astro:after-swap from a listener registered after the component's: the view is captured next.
            document.addEventListener('astro:before-preparation', () => {
                document.addEventListener('astro:after-swap', () => { w.__swap = Math.round(scrollY); }, { once: true });
            }, { once: true });
        });
        const finalY = await follow(page, INICIO(page), '/');
        const seen = [...new Set(await page.evaluate(() => (window as any).__y as number[]))];
        expect(finalY).toBeGreaterThan(0);
        expect(await page.evaluate(() => (window as any).__swap), 'scrollY when the new view is captured').toBe(Math.round(finalY));
        expect(seen.filter((y) => y !== 0 && y !== Math.round(finalY)), 'a frame between').toEqual([]);
        // The leaving page sits at 0, so the proof is that 0 stops being sampled once the final value shows.
        const all = await page.evaluate(() => (window as any).__y as number[]);
        const first = all.indexOf(Math.round(finalY));
        expect(first, 'a frame at the final position').toBeGreaterThanOrEqual(0);
        expect(all.slice(first).filter((y) => y === 0), 'a frame at the top after the final one').toEqual([]);
    });
}

test('back and forward keep the router position, including after a return (RF-4)', async ({ page }) => {
    await open(page, '/');
    await page.evaluate(() => document.querySelector('section[aria-labelledby="projects-title"]')!.scrollIntoView({ behavior: 'instant' }));
    await page.waitForTimeout(200);
    const before = await page.evaluate(() => scrollY);
    expect(before).toBeGreaterThan(0);
    await follow(page, page.locator(`${HOME_LINKS} a[href="/proyectos"]`).nth(1), '/proyectos');
    await page.goBack();
    await page.waitForURL((u) => u.pathname === '/');
    expect(await settled(() => page.evaluate(() => scrollY)), 'back').toBe(before);

    await follow(page, page.locator(`${HOME_LINKS} a[href="/proyectos"]`).nth(1), '/proyectos');
    const returned = await follow(page, INICIO(page), '/');
    await page.goBack();
    await page.waitForURL((u) => u.pathname === '/proyectos');
    await page.goForward();
    await page.waitForURL((u) => u.pathname === '/');
    expect(await settled(() => page.evaluate(() => scrollY)), 'forward').toBe(returned);
});

test('a page never left before opens at the top (RF-5)', async ({ page }) => {
    await open(page, '/proyectos');
    expect(await follow(page, INICIO(page), '/')).toBe(0);
});

test('a filter click records no origin (RF-6)', async ({ page }) => {
    await open(page, '/proyectos');
    const nav = page.locator('.projects-page__header .project-filters a');
    const onBody = () => page.evaluate(() => document.activeElement === document.body);
    await nav.nth(2).click();
    await page.waitForURL(/cat=backend/);
    expect(await onBody(), 'focus after Backend').toBe(true);
    await nav.nth(0).click();
    await page.waitForURL((u) => !u.search.includes('cat='));
    expect(await onBody(), 'focus after Todos').toBe(true);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => Object.keys(sessionStorage).filter((k) => k.startsWith('return-origin:')))).toEqual([]);
});

test('no request made during a return carries the origin (NFR)', async ({ page }) => {
    await open(page, '/');
    await follow(page, page.locator(`${HOME_LINKS} a[href="/proyectos"]`).nth(1), '/proyectos');
    const record = (await page.evaluate(() => sessionStorage.getItem('return-origin:/')))!;
    expect(record).toBeTruthy();
    const carried: string[] = [];
    page.on('request', async (r) => {
        const all = [r.url(), r.postData() ?? '', JSON.stringify(await r.allHeaders())].join('\n');
        if (all.includes('return-origin') || all.includes(encodeURIComponent(record))) carried.push(r.url());
    });
    await follow(page, INICIO(page), '/');
    await page.waitForTimeout(300);
    expect(carried).toEqual([]);
});

test('without JavaScript "Inicio" opens Home at the top (NFR)', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: VIEWPORTS[0] });
    const page = await context.newPage();
    const top = async () => (await page.locator('h1').first().boundingBox())!.y;
    await page.goto(`${E2E_URL}/?lang=es`);
    const rest = await top();
    await page.goto(`${E2E_URL}/proyectos?lang=es`);
    await INICIO(page).click();
    await page.waitForURL((u) => u.pathname === '/');
    expect(await top()).toBe(rest);
    await context.close();
});

test('storage that throws: links land at the top and nothing errors (edge)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(() => {
        Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('blocked'); } });
    });
    await open(page, '/');
    await follow(page, page.locator(`${HOME_LINKS} a[href="/proyectos"]`).nth(1), '/proyectos');
    expect(await follow(page, INICIO(page), '/')).toBe(0);
    expect(errors).toEqual([]);
});
