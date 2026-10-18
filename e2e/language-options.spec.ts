import { test, expect } from '@playwright/test';
import { E2E_URL } from './helpers/server';
import { THEMES, openIn } from './helpers/rendered';
import { contrast } from '../tests/helpers/colour';

// The language list the platform draws takes its colours from each <option>: a transparent one fell
// back to a white popup under the dark theme's light text (owner, 2026-10-17). Each option needs an
// opaque ground and text that clears 4.5:1 on it, in both themes.

for (const theme of THEMES) {
    test(`language options are readable — ${theme}`, async ({ page }) => {
        await openIn(page, E2E_URL, theme, '/?lang=es');
        const opts = await page.locator('[data-lang-switcher] option').evaluateAll((list) => list.map((o) => {
            const cs = getComputedStyle(o);
            const hex = (c: string) => { const m = c.match(/[\d.]+/g)!.map(Number); return { hex: '#' + m.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join(''), alpha: m[3] ?? 1 }; };
            return { text: o.textContent?.trim(), fg: hex(cs.color), bg: hex(cs.backgroundColor) };
        }));
        const offenders: string[] = [];
        if (!opts.length) offenders.push('no options found');
        for (const o of opts) {
            if (o.bg.alpha < 1) offenders.push(`${o.text}: the option ground is not opaque`);
            else if (contrast(o.fg.hex, o.bg.hex) < 4.5) offenders.push(`${o.text}: ${o.fg.hex} on ${o.bg.hex} is ${contrast(o.fg.hex, o.bg.hex).toFixed(2)}:1`);
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
}
