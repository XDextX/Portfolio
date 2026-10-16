import { test, expect, type Page } from '@playwright/test';
import { startDevServer, waitForServer } from './helpers/dev-server';
import { contrast } from '../tests/helpers/colour';

// Spec 007: the primary button's ink, rendered. RF-3 (every consumer paints the
// ink token), RF-4 (hover keeps 4.5:1 as composited over its ground) and the light
// NFR (light renders white on #7A5D10, unchanged).

let DEV_URL = '';
const THEMES = ['light', 'dark'] as const;
type Theme = (typeof THEMES)[number];

async function openIn(page: Page, theme: Theme, route: string) {
    await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
    await page.emulateMedia({ colorScheme: theme });
    await page.goto(DEV_URL + route);
}

// In-page helpers: opaque rgb() to #rrggbb, alpha compositing, the first opaque
// ancestor, and a read repeated every 50 ms until two reads agree (1 s cap).
async function installHelpers(page: Page) {
    await page.evaluate(() => {
        const w = window as any;
        w.__toHex = (css: string) => {
            const m = css.match(/rgba?\(([^)]+)\)/);
            if (!m) throw new Error(`not an rgb colour: ${css}`);
            const [r, g, b, a = '1'] = m[1].split(/[\s,/]+/).filter(Boolean);
            if (Number(a) < 1) throw new Error(`not opaque: ${css}`);
            return '#' + [r, g, b].map((v) => Number(v).toString(16).padStart(2, '0')).join('');
        };
        w.__ground = (el: Element) => {
            for (let n = el.parentElement; n; n = n.parentElement) {
                const bg = getComputedStyle(n).backgroundColor;
                const a = bg.match(/rgba?\(([^)]+)\)/)?.[1].split(/[\s,/]+/)[3];
                if (bg !== 'transparent' && (a === undefined || Number(a) === 1)) return w.__toHex(bg);
            }
            throw new Error('no opaque ground up to html');
        };
        w.__probe = () => {
            const s = document.createElement('span');
            s.style.color = 'var(--accent-surface-text)';
            s.style.backgroundColor = 'var(--accent-surface)';
            document.body.append(s);
            const cs = getComputedStyle(s);
            const out = { want: w.__toHex(cs.color), fill: w.__toHex(cs.backgroundColor) };
            const declared = getComputedStyle(document.documentElement).getPropertyValue('--accent-surface-text').trim();
            s.remove();
            return { ...out, declared };
        };
    });
}

async function settled<T>(read: () => Promise<T>): Promise<T> {
    let last = JSON.stringify(await read());
    for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 50));
        const now = await read();
        if (JSON.stringify(now) === last) return now;
        last = JSON.stringify(now);
    }
    return read();
}

const colours = (page: Page, selector: string) =>
    page.locator(selector).first().evaluate((el) => {
        const w = window as any;
        const cs = getComputedStyle(el);
        const safe = (c: string) => { try { return w.__toHex(c); } catch { return c; } };
        return { color: safe(cs.color), bg: safe(cs.backgroundColor), opacity: Number(cs.opacity), ground: w.__ground(el) };
    });

// Composite a colour at an opacity over its ground, per channel, rounded.
function composite(fg: string, ground: string, alpha: number): string {
    const ch = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
    return '#' + [0, 1, 2].map((i) => Math.round(alpha * ch(fg, i) + (1 - alpha) * ch(ground, i)).toString(16).padStart(2, '0')).join('');
}

async function firstProjectRoute(page: Page): Promise<string> {
    await page.goto(DEV_URL + '/');
    const href = await page.locator('a[href^="/proyectos/"]').first().getAttribute('href');
    if (!href) throw new Error('no project link on / — the project page needs the GitHub fetch to succeed');
    return href;
}

const PRIMARIES: { route: 'home' | '404' | 'project'; selector: string; name: string }[] = [
    { route: 'home', selector: '.btn-cv', name: 'CV button' },
    { route: 'home', selector: '.btn-action.primary', name: '"Ver todos"' },
    { route: '404', selector: '.btn--primary', name: '404 home button' },
    { route: 'project', selector: '.btn--primary', name: '"Demo"' },
];

test.describe('primary button ink (spec 007)', () => {
    // Every check runs and reports, even after another fails.
    test.describe.configure({ mode: 'default' });
    let proc: any;
    let projectRoute = '';

    test.beforeAll(async ({ browser }) => {
        const started = startDevServer();
        proc = started.proc;
        DEV_URL = await started.readyPromise;
        await waitForServer(DEV_URL, 30000);
        const page = await browser.newPage();
        projectRoute = await firstProjectRoute(page);
        await page.close();
    });

    test.afterAll(() => {
        if (proc && !proc.killed) proc.kill();
    });

    const routeOf = (r: 'home' | '404' | 'project') => (r === 'home' ? '/' : r === '404' ? '/no-existe' : projectRoute);

    for (const theme of THEMES) {
        test(`every consumer paints the ink token, ${theme} (RF-3, light NFR)`, async ({ page }) => {
            const offenders: string[] = [];
            for (const route of ['home', '404', 'project'] as const) {
                await openIn(page, theme, routeOf(route));
                await installHelpers(page);
                const { want, fill, declared } = await page.evaluate(() => (window as any).__probe());
                if (!declared) offenders.push(`RF-3: ${theme} ${route}: --accent-surface-text is not declared`);
                // Discovery (plan D-6): anything painted with the fill is a consumer, known or not.
                const strays = await page.evaluate(({ fill, want }) => {
                    const w = window as any;
                    const safe = (c: string) => { try { return w.__toHex(c); } catch { return c; } };
                    return [...document.querySelectorAll('body *')]
                        .filter((el) => safe(getComputedStyle(el).backgroundColor) === fill)
                        .filter((el) => safe(getComputedStyle(el).color) !== want)
                        .map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`);
                }, { fill, want });
                for (const s of strays) offenders.push(`RF-3: ${theme} ${route}: ${s} sits on the accent surface without its ink`);
                for (const p of PRIMARIES.filter((x) => x.route === route)) {
                    if ((await page.locator(p.selector).count()) === 0) {
                        offenders.push(`RF-3: ${theme}: ${p.name} not found on ${routeOf(route)}${route === 'project' ? ' (the first repo needs a homepage)' : ''}`);
                        continue;
                    }
                    const c = await settled(() => colours(page, p.selector));
                    if (c.bg !== fill) offenders.push(`RF-3: ${theme}: ${p.name} fill ${c.bg}, not the accent surface ${fill}`);
                    if (c.color !== want) offenders.push(`RF-3: ${theme}: ${p.name} ink ${c.color}, not ${want}`);
                    if (theme === 'light' && (c.bg !== '#7a5d10' || c.color !== '#ffffff')) {
                        offenders.push(`NFR: light: ${p.name} renders ${c.color} on ${c.bg}, not #ffffff on #7a5d10`);
                    }
                }
                if (route === 'home') {
                    const btn = page.locator('.icon-btn').first();
                    await btn.hover();
                    const h = await settled(() => colours(page, '.icon-btn'));
                    if (h.bg !== fill || h.color !== want) offenders.push(`RF-3: ${theme}: hovered icon button ${h.color} on ${h.bg}`);
                    await btn.click();
                    const l = await settled(() => colours(page, '.icon-btn'));
                    if (l.color !== want) offenders.push(`RF-3: ${theme}: copy label ink ${l.color}, not ${want}`);
                }
            }
            expect(offenders, offenders.join('\n')).toEqual([]);
        });

        test(`a hovered primary keeps 4.5:1 over its ground, ${theme} (RF-4)`, async ({ page }) => {
            const offenders: string[] = [];
            for (const p of PRIMARIES) {
                await openIn(page, theme, routeOf(p.route));
                await installHelpers(page);
                if ((await page.locator(p.selector).count()) === 0) {
                    offenders.push(`RF-4: ${theme}: ${p.name} not found`);
                    continue;
                }
                await page.locator(p.selector).first().hover();
                const c = await settled(() => colours(page, p.selector));
                const ratio = contrast(composite(c.color, c.ground, c.opacity), composite(c.bg, c.ground, c.opacity));
                if (ratio < 4.5) offenders.push(`RF-4: ${theme}: hovered ${p.name} is ${ratio.toFixed(2)}:1`);
            }
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }
});
