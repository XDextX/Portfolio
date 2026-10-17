import { test, expect, type Page } from '@playwright/test';
import { E2E_URL } from './helpers/server';
import { THEMES, openIn, installHelpers } from './helpers/rendered';
import { contrast } from '../tests/helpers/colour';

// Spec 025: the project page's ghost buttons. Measured before the fix in light: the back link at
// 1.00:1 (navy on navy) and the code link at 1.49:1 (ink on navy), neither changing on hover.

const BUTTONS = { back: 'a.back-btn', code: 'nav.actions a[href*="github.com"]' } as const;

/** Text, border and box of a button, each colour against the ground actually behind it. */
const read = (page: Page, sel: string) => page.locator(sel).evaluate((el) => {
    const w = window as any;
    const cs = getComputedStyle(el);
    const b = el.getBoundingClientRect();
    return {
        fg: w.__toHex(cs.color),
        textGround: w.__groundOf(el, 'none').colour as string,
        border: cs.borderTopColor,
        borderGround: w.__groundOf(el.parentElement, 'none').colour as string,
        box: [b.x, b.y, b.width, b.height].map((n) => Math.round(n)).join(','),
    };
});

/** The theme's accent as the browser resolves it. */
const accent = (page: Page) => page.evaluate(() => {
    const probe = document.createElement('i');
    probe.style.color = 'var(--accent-text)';
    document.body.append(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    return (window as any).__toHex(c);
});

for (const theme of THEMES) {
    test(`ghost buttons: readable text, visible border, gold hover that moves nothing — ${theme} (RF-1, RF-2, RF-3)`, async ({ page, request }) => {
        const [first] = await (await request.get(`${E2E_URL}/api/github-list.json`)).json();
        await openIn(page, E2E_URL, theme, `/proyectos/${first.name}?lang=es`);
        await installHelpers(page);
        const gold = await accent(page);
        const offenders: string[] = [];
        for (const [name, sel] of Object.entries(BUTTONS)) {
            await page.mouse.move(0, 0);
            await page.waitForTimeout(400);
            const rest = await read(page, sel);
            const text = contrast(rest.fg, rest.textGround);
            if (text < 4.5) offenders.push(`RF-1: ${name} at rest, text ${rest.fg} on ${rest.textGround} is ${text.toFixed(2)}:1`);
            let edge = 0;
            try { edge = contrast((await page.evaluate((c) => (window as any).__toHex(c), rest.border)), rest.borderGround); } catch { /* a transparent border: 0 */ }
            if (edge < 3) offenders.push(`RF-2: ${name} border ${rest.border} on ${rest.borderGround} is ${edge.toFixed(2)}:1`);
            await page.locator(sel).hover();
            await page.waitForTimeout(400);
            const hover = await read(page, sel);
            const hoverText = contrast(hover.fg, hover.textGround);
            if (hoverText < 4.5) offenders.push(`RF-1: ${name} hovered, text is ${hoverText.toFixed(2)}:1`);
            let hoverBorder = '';
            try { hoverBorder = await page.evaluate((c) => (window as any).__toHex(c), hover.border); } catch { hoverBorder = hover.border; }
            if (hoverBorder !== gold) offenders.push(`RF-3: ${name} hovered border ${hoverBorder}, not the accent ${gold}`);
            if (hover.box !== rest.box) offenders.push(`RF-3: ${name} moved on hover, ${rest.box} to ${hover.box}`);
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
}

test('every ghost button carries the one ghost class (RF-4)', async ({ page, request }) => {
    const [first] = await (await request.get(`${E2E_URL}/api/github-list.json`)).json();
    await openIn(page, E2E_URL, 'light', `/proyectos/${first.name}?lang=es`);
    const r = await page.evaluate((sels) => ({
        stray: document.querySelectorAll('.ghost:not(.btn--ghost)').length,
        missing: Object.entries(sels).filter(([, s]) => !document.querySelector(s)?.classList.contains('btn--ghost')).map(([n]) => n),
    }), BUTTONS);
    expect(r.stray, 'elements with the old ghost class').toBe(0);
    expect(r.missing, 'buttons without btn--ghost').toEqual([]);
});
