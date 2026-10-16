import type { Page } from '@playwright/test';

/** The two themes every rendered check runs in. */
export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

/**
 * Open a route with a theme already applied, before the page's own scripts run.
 * @param page the Playwright page @param base the dev server URL
 * @param theme light or dark @param route a path such as `/`
 */
export async function openIn(page: Page, base: string, theme: Theme, route: string) {
    await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
    await page.emulateMedia({ colorScheme: theme });
    await page.goto(base + route);
}

/**
 * Install in-page helpers: `__toHex` (opaque rgb() to #rrggbb, throws otherwise) and
 * `__ground` (the first opaque ancestor's background).
 * @param page the Playwright page
 */
export async function installHelpers(page: Page) {
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
    });
}

/**
 * Re-read a value every 50 ms until two reads agree (1 s cap), so a transition settles.
 * @param read the read to repeat
 * @returns the settled value
 */
export async function settled<T>(read: () => Promise<T>): Promise<T> {
    let last = JSON.stringify(await read());
    for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 50));
        const now = await read();
        if (JSON.stringify(now) === last) return now;
        last = JSON.stringify(now);
    }
    return read();
}

/**
 * Composite a colour at an opacity over its ground, per channel, rounded.
 * @param fg `#rrggbb` @param ground `#rrggbb` @param alpha opacity in [0, 1]
 * @returns the rendered `#rrggbb`
 */
export function composite(fg: string, ground: string, alpha: number): string {
    const ch = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
    return '#' + [0, 1, 2].map((i) => Math.round(alpha * ch(fg, i) + (1 - alpha) * ch(ground, i)).toString(16).padStart(2, '0')).join('');
}
