import { test, expect, type Page } from '@playwright/test';
import { THEMES, openIn } from './helpers/rendered';

// Spec 020: under reduced motion the page never scrolls with an animation (RF-1); without a
// preference it keeps today's smooth scroll once focus is inside (RF-2). Measured before the
// fix: `smooth` with a field focused under both preferences.

const BASE = 'http://localhost:4329';
const FIELD = '#Contact form[data-contact-form] [name="name"]';
const scroll = (page: Page) => page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
// AGENTS: confirm the rule is in document.styleSheets before trusting a computed value.
const ruleLoaded = (page: Page) => page.evaluate(() => [...document.styleSheets].some((s) => {
    try { return [...s.cssRules].some((r) => r.cssText.includes('scroll-behavior')); } catch { return false; }
}));

for (const theme of THEMES) {
    test(`scroll follows the motion preference, at rest and focused — ${theme} (RF-1, RF-2)`, async ({ browser }) => {
        const offenders: string[] = [];
        for (const pref of ['reduce', 'no-preference'] as const) {
            const ctx = await browser.newContext({ reducedMotion: pref });
            const page = await ctx.newPage();
            await openIn(page, BASE, theme, '/');
            if (!(await ruleLoaded(page))) offenders.push(`${pref}: no scroll-behavior rule in document.styleSheets`);
            const rest = await scroll(page);
            await page.locator(FIELD).focus();
            const focused = await scroll(page);
            const want = pref === 'reduce' ? ['auto', 'auto'] : ['auto', 'smooth'];
            const rf = pref === 'reduce' ? 'RF-1' : 'RF-2';
            if (rest !== want[0]) offenders.push(`${rf}: ${pref} at rest reads ${rest}, not ${want[0]}`);
            if (focused !== want[1]) offenders.push(`${rf}: ${pref} focused reads ${focused}, not ${want[1]}`);
            if (pref === 'no-preference') {
                await page.emulateMedia({ reducedMotion: 'reduce' });
                const live = await scroll(page);
                if (live !== 'auto') offenders.push(`RF-1: switched to reduce with the field focused, reads ${live}`);
            }
            await ctx.close();
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
}
