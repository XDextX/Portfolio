import { test, expect, type Browser, type Page } from '@playwright/test';
import { E2E_URL } from './helpers/server';
import { THEMES, openIn, type Theme } from './helpers/rendered';
import { targetBox, holdsSquare, intruders, STEP, type Sample, type Box } from './helpers/targets';

// Spec 048: with a coarse pointer every control's target is 44 × 44 px and no target overlaps
// another (RF-1, RF-2); with a fine one the boxes stay as measured (RF-3); the header pair is
// one height (RF-4). Measured by a hit-test grid, not by getBoundingClientRect (plan D-8).

const ROUTES = ['/', '/proyectos', '/proyectos/Portfolio'];
const COARSE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
const FINE = { viewport: { width: 1280, height: 800 } };

interface Probe { name: string; drawn: Box; region: Box; owners: number[]; cols: number; index: number }
interface Audited { name: string; box: Box | null; holds: boolean; intruders: string[] }

/** A page in a context with the given pointer, the route opened in theme and locale. */
async function openAs(browser: Browser, pointer: 'coarse' | 'fine', theme: Theme, route: string, lang = 'es') {
    const context = await browser.newContext(pointer === 'coarse' ? COARSE : FINE);
    const page = await context.newPage();
    await openIn(page, E2E_URL, theme, `${route}${route.includes('?') ? '&' : '?'}lang=${lang}`);
    expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches), `the ${pointer} pass`).toBe(pointer === 'coarse');
    await page.waitForTimeout(400);
    return { page, context };
}

/** Every visible control, each probed on a 2px hit grid around its drawn box (plan block 4). */
async function probe(page: Page): Promise<Probe[]> {
    await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity).map((a) => a.finished.catch(() => {}))));
    return page.evaluate(async ({ step }) => {
        const exempt = (el: Element) => {
            if (el.closest('.readme-body')) return true;
            if (el.tagName !== 'A') return false;
            const block = el.closest('p, dd, td, blockquote, figcaption');
            return !!block && block.textContent!.trim() !== el.textContent!.trim();
        };
        const visible = (el: Element) => (el as HTMLElement).checkVisibility({ visibilityProperty: true, opacityProperty: true } as any) && el.getBoundingClientRect().width * el.getBoundingClientRect().height > 0;
        const cands = [...document.querySelectorAll('a[href], button, select, input, textarea, summary')].filter((el) => visible(el) && !exempt(el));
        const index = new Map<Element, number>(cands.map((c, i) => [c, i]));
        const ownerOf = (hit: Element | null): number => {
            for (let el = hit; el; el = el.parentElement) {
                const i = index.get(el);
                if (i === undefined) continue;
                if (cands[i].tagName === 'SELECT') return hit === cands[i] ? i : -1;
                return i;
            }
            const label = hit?.closest('label');
            const input = label && cands.find((c) => (c.tagName === 'INPUT' || c.tagName === 'TEXTAREA') && c.closest('label') === label);
            return input ? index.get(input)! : -1;
        };
        const nameOf = (el: Element) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${[...el.classList].map((c) => '.' + c).join('')} "${(el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28)}"${el.getAttribute('href') ? ' ' + el.getAttribute('href') : ''}`;
        const out: any[] = [];
        for (const c of cands) {
            c.scrollIntoView({ block: 'center', behavior: 'instant' });
            await new Promise((r) => requestAnimationFrame(() => r(null)));
            const r = c.getBoundingClientRect();
            // Sample centres sit 1px in from the control's own edge and every 2px after it, so a box of
            // w px owns w / 2 samples across, never one more (D-8).
            const from = (edge: number, lo: number) => edge + 1 + step * Math.ceil((Math.max(lo, edge - 22) - edge - 1) / step);
            const x0 = from(r.left, 0), y0 = from(r.top, 0);
            const owners: number[] = [];
            let cols = 0, rows = 0;
            for (let y = y0; y < Math.min(innerHeight, r.bottom + 22); y += step) { cols = 0; rows++; for (let x = x0; x < Math.min(innerWidth, r.right + 22); x += step) { owners.push(ownerOf(document.elementFromPoint(x, y))); cols++; } }
            out.push({ name: nameOf(c), drawn: { x: r.left, y: r.top, w: r.width, h: r.height }, region: { x: x0, y: y0, w: cols * step, h: rows * step }, owners, cols, index: index.get(c) });
        }
        return out;
    }, { step: STEP });
}

/** The probe's verdicts: each control's target box, whether it holds a 44px square, who intrudes. */
function judge(probes: Probe[]): Audited[] {
    return probes.map((p) => {
        const samples: Sample[] = p.owners.map((owner, k) => ({ x: p.region.x + (k % p.cols) * STEP, y: p.region.y + Math.floor(k / p.cols) * STEP, owner }));
        const box = targetBox(samples, p.index);
        return { name: p.name, box, holds: !!box && holdsSquare(samples, p.index, box, 44), intruders: intruders(samples, p.index, p.drawn).map((i) => probes.find((q) => q.index === i)?.name ?? String(i)) };
    });
}

const bad = (a: Audited) => !a.box || a.box.w < 44 || a.box.h < 44 || !a.holds || a.intruders.length > 0;
const describe = (a: Audited) => `${a.name}: ${a.box ? `${a.box.w}×${a.box.h}` : 'no target'}${a.intruders.length ? `, over ${a.intruders.join(' | ')}` : ''}`;

/** The route as loaded, plus, on Home, after a tap on the list view (its chips are controls too). */
async function audit(page: Page, route: string): Promise<Audited[]> {
    const rounds = [judge(await probe(page))];
    if (route === '/') {
        await page.locator('.toggle-btn[data-view="list"]').first().tap();
        await page.waitForTimeout(600);
        rounds.push(judge(await probe(page)));
    }
    return rounds.flat();
}

for (const route of ROUTES) for (const theme of THEMES) for (const lang of ['es', 'en']) {
    test(`coarse: every control has a 44 × 44 target and none overlaps — ${route}, ${theme}, ${lang} (RF-1, RF-2)`, async ({ browser }) => {
        const { page, context } = await openAs(browser, 'coarse', theme, route, lang);
        const result = await audit(page, route);
        await context.close();
        expect(result.filter(bad).map(describe)).toEqual([]);
    });
}

test('the candidate list names the theme button, the language select and a breadcrumb link', async ({ browser }) => {
    const { page, context } = await openAs(browser, 'coarse', 'light', '/proyectos/Portfolio');
    const names = (await probe(page)).map((p) => p.name).join('\n');
    await context.close();
    expect(names).toContain('.theme-btn');
    expect(names).toContain('select.select');
    expect(names).toContain('a "Proyectos" /proyectos');
});

// ── RF-3, RF-4 and the radius and size-class NFRs: read the same controls with both pointers ──

/** [selector, route, width, height] of every control in the spec's table, Spanish, 1280 fine. */
const TABLE: [string, string, number, number][] = [
    ['.language-switcher', '/', 106, 30],
    ['.theme-btn', '/', 34, 30],
    ['.toggle-btn', '/', 32, 32],
    ['.copy-btn', '/', 71.9, 32],
    ['.contact-actions a.icon-btn', '/', 34, 32],
    ['.actions a.btn--ghost', '/proyectos/Portfolio', 0, 42],
    ['.actions a.btn--primary', '/proyectos/Portfolio', 0, 42],
    ['.back-btn', '/proyectos/Portfolio', 0, 37.2],
    ['.contact-form__submit', '/', 0, 42],
    ['.crumbs a', '/proyectos/Portfolio', 0, 17],
];

const box = (page: Page, sel: string) => page.locator(sel).first().evaluate((e) => { const r = e.getBoundingClientRect(); return { w: r.width, h: r.height, radius: getComputedStyle(e).borderRadius, font: getComputedStyle(e).fontSize }; });

test('fine pointer: the table keeps its boxes within 1px (RF-3)', async ({ browser }) => {
    const offenders: string[] = [];
    for (const route of ['/', '/proyectos/Portfolio']) {
        const { page, context } = await openAs(browser, 'fine', 'light', route);
        for (const [sel, r, w, h] of TABLE.filter((row) => row[1] === route)) {
            const b = await box(page, sel);
            if (Math.abs(b.h - h) > 1) offenders.push(`${sel}: ${b.h.toFixed(1)} tall, table says ${h}`);
            if (w && Math.abs(b.w - w) > 1) offenders.push(`${sel}: ${b.w.toFixed(1)} wide, table says ${w}`);
        }
        await context.close();
    }
    const en = await openAs(browser, 'fine', 'light', '/', 'en');
    const copy = await box(en.page, '.copy-btn');
    await en.context.close();
    if (Math.abs(copy.w - 61.2) > 1) offenders.push(`.copy-btn (en): ${copy.w.toFixed(1)} wide, table says 61.2`);
    expect(offenders).toEqual([]);
});

test('the language control and the theme button are one height, with each pointer (RF-4)', async ({ browser }) => {
    const heights: Record<string, number[]> = {};
    for (const pointer of ['fine', 'coarse'] as const) {
        const { page, context } = await openAs(browser, pointer, 'light', '/');
        heights[pointer] = [(await box(page, '.language-switcher')).h, (await box(page, '.theme-btn')).h];
        await context.close();
    }
    expect(heights.fine[0], 'fine').toBe(heights.fine[1]);
    expect(heights.coarse[0], 'coarse').toBe(heights.coarse[1]);
});

test('a control that grows keeps its radius and its text size across pointers (NFR)', async ({ browser }) => {
    const sels = ['.language-switcher', '.theme-btn', '.toggle-btn', '.icon-btn', '.btn-cv', '.btn-social', '.btn-action', '.contact-form__submit'];
    const read = async (pointer: 'fine' | 'coarse') => {
        const out: Record<string, string> = {};
        for (const [route, list] of [['/', sels], ['/proyectos', ['.crumbs a']]] as const) {
            const { page, context } = await openAs(browser, pointer, 'light', route);
            for (const sel of list) { const b = await box(page, sel); out[sel] = `${b.radius} / ${b.font}`; }
            await context.close();
        }
        return out;
    };
    expect(await read('coarse')).toEqual(await read('fine'));
});

test('coarse: the header band still reaches the top edge of the sheet (T-3, spec 036)', async ({ browser }) => {
    const { page, context } = await openAs(browser, 'coarse', 'light', '/proyectos');
    const r = await page.evaluate(() => ({ band: document.querySelector('.hero-band')!.getBoundingClientRect().top, main: document.querySelector('main')!.getBoundingClientRect().top }));
    await context.close();
    expect(Math.abs(r.band - r.main)).toBeLessThanOrEqual(1);
});

test('the active indicator stays centred and as wide as the icon with each pointer (T-5)', async ({ browser }) => {
    for (const pointer of ['fine', 'coarse'] as const) {
        const { page, context } = await openAs(browser, pointer, 'light', '/');
        const r = await page.evaluate(() => {
            const btn = document.querySelector('.toggle-btn[aria-pressed="true"]')!;
            const box = (e: Element) => { const b = e.getBoundingClientRect(); return { mid: b.left + b.width / 2, w: b.width }; };
            return { icon: box(btn.querySelector('svg')!), bar: box(btn.querySelector('.toggle-indicator')!) };
        });
        await context.close();
        expect(Math.abs(r.icon.mid - r.bar.mid), `${pointer}: the bar is off the icon's centre`).toBeLessThanOrEqual(0.5);
        expect(Math.abs(r.icon.w - r.bar.w), `${pointer}: the bar is not as wide as the icon`).toBeLessThanOrEqual(0.5);
    }
});

test('coarse: the copy button keeps its box at rest, copied and failed, in both locales (T-6, spec 018)', async ({ browser }) => {
    const offenders: string[] = [];
    for (const lang of ['es', 'en']) {
        const { page, context } = await openAs(browser, 'coarse', 'light', '/', lang);
        const sizes = await page.locator('.copy-btn').first().evaluate((btn) => {
            const size = () => { const r = btn.getBoundingClientRect(); return `${r.width.toFixed(1)}×${r.height.toFixed(1)}`; };
            const out = { rest: size() } as Record<string, string>;
            for (const state of ['ok', 'err']) { btn.classList.add(`copy-btn--${state}`); out[state] = size(); btn.classList.remove(`copy-btn--${state}`); }
            return out;
        });
        await context.close();
        if (new Set(Object.values(sizes)).size !== 1) offenders.push(`${lang}: ${JSON.stringify(sizes)}`);
        // Equal is not enough: with the hidden labels dropped from the cell every state shrinks to the
        // 44px floor together. The box must stay as wide as its longest label asks (71.9 es, 61.2 en).
        const wide = Number(sizes.rest.split('×')[0]);
        if (wide < (lang === 'es' ? 71.5 : 60.7)) offenders.push(`${lang}: ${wide}px wide, the labels need more`);
    }
    expect(offenders).toEqual([]);
});

test('a touch tablet at 1280px keeps every target at 44 × 44 (edge case)', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, hasTouch: true });
    const page = await context.newPage();
    await openIn(page, E2E_URL, 'light', '/?lang=es');
    expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
    await page.waitForTimeout(400);
    const result = await audit(page, '/');
    await context.close();
    expect(result.filter(bad).map(describe)).toEqual([]);
});

test('coarse: the breadcrumb row looks as it does with a fine pointer: same offsets, same gaps (T-4)', async ({ browser }) => {
    const read = async (pointer: 'fine' | 'coarse') => {
        const { page, context } = await openAs(browser, pointer, 'light', '/proyectos/Portfolio');
        const r = await page.evaluate(() => {
            const nav = document.querySelector('.crumbs')!.getBoundingClientRect();
            const items = [...document.querySelectorAll('.crumbs li > a, .crumbs li > span')].map((e) => { const b = e.getBoundingClientRect(); return { l: b.left - nav.left, w: b.width, r: b.right - nav.left }; });
            return { items, gaps: items.slice(1).map((it, i) => it.l - items[i].r) };
        });
        await context.close();
        return r;
    };
    const [fine, coarse] = [await read('fine'), await read('coarse')];
    const offenders: string[] = [];
    coarse.items.forEach((it, i) => {
        if (Math.abs(it.l - fine.items[i].l) > 1) offenders.push(`crumb ${i}: starts ${it.l.toFixed(1)} from the row's left, fine ${fine.items[i].l.toFixed(1)}`);
        if (Math.abs(it.w - fine.items[i].w) > 1) offenders.push(`crumb ${i}: ${it.w.toFixed(1)} wide, fine ${fine.items[i].w.toFixed(1)}`);
    });
    coarse.gaps.forEach((g, i) => { if (Math.abs(g - coarse.gaps[0]) > 1) offenders.push(`gap ${i}: ${g.toFixed(1)}, the first is ${coarse.gaps[0].toFixed(1)}`); });
    expect(offenders).toEqual([]);
});
