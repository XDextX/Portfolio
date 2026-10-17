import { test, expect } from '@playwright/test';
import { E2E_URL as DEV_URL } from './helpers/server';
import { THEMES, openIn, installHelpers, settled } from './helpers/rendered';

// Spec 017 RF-3: every bordered control turns its border gold on hover. The
// view-toggle is read on the group, never a button: the active button is 012's.

const CONTROLS: { name: string; selector: string; needs?: string }[] = [
    { name: 'language selector', selector: '.language-switcher' },
    { name: 'theme toggle', selector: '.theme-btn' },
    { name: 'hero social button', selector: '.btn-social' },
    { name: 'view-toggle group', selector: '.view-toggle' },
    { name: 'skill chip', selector: '.chip', needs: 'the list view' },
    // Spec 030 replaced the show-more toggle with this header link, the projects section's control.
    { name: '"Ver todos" link', selector: '.projects-all', needs: 'repos from the GitHub fetch' },
    { name: 'card action', selector: '.project-card .btn-action', needs: 'repos from the GitHub fetch' },
    { name: 'contact button', selector: '.icon-btn' },
];

test.describe('control borders (spec 017)', () => {
    test.describe.configure({ mode: 'default' });

    for (const theme of THEMES) {
        test(`every bordered control turns gold on hover, ${theme} (RF-3)`, async ({ page }) => {
            await openIn(page, DEV_URL, theme, '/');
            await installHelpers(page);
            const gold = await page.evaluate(() => {
                const s = document.createElement('span');
                s.style.color = 'var(--accent-text)';
                document.body.append(s);
                const c = (window as any).__toHex(getComputedStyle(s).color);
                s.remove();
                return c;
            });
            const list = page.locator('.toggle-btn').nth(1);
            if (await list.count()) await list.click();
            const offenders: string[] = [];
            for (const c of CONTROLS) {
                const el = page.locator(c.selector).first();
                if ((await page.locator(c.selector).count()) === 0) {
                    offenders.push(`RF-3: ${theme}: ${c.name} not found${c.needs ? ` (needs ${c.needs})` : ''}`);
                    continue;
                }
                const borders = () => el.evaluate((e) => {
                    const cs = getComputedStyle(e);
                    const w = window as any;
                    return [cs.borderTopColor, cs.borderRightColor, cs.borderBottomColor, cs.borderLeftColor].map((x) => w.__toHex(x));
                });
                await page.mouse.move(0, 0);
                const rest = (await settled(borders))[0];
                if (rest === gold) offenders.push(`RF-3: ${theme}: ${c.name} already rests in the gold`);
                await el.hover();
                const hovered = await settled(borders);
                if (hovered.some((x) => x !== gold)) offenders.push(`RF-3: ${theme}: hovered ${c.name} border ${hovered.join(' ')}, not the gold ${gold}`);
            }
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }
});
