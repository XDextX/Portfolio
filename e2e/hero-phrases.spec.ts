import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { E2E_URL } from './helpers/server';
import { THEMES, openIn, type Theme } from './helpers/rendered';
import { worstOverBackground, type PixelTarget } from './helpers/pixels';
import { ABOUT } from '../src/data/about';

// Spec 047: the hero's four phrases, two per line where four do not fit. RF-1 two per line, in
// order; RF-2 a gold chevron joins each pair; RF-3 no line starts with a chevron; the sweep holds
// every width from 320 to 720 to one line where four fit and two per line where they do not.

const LOCALES = fs.readdirSync(path.join(process.cwd(), 'i18n', 'locales')).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));
const PHRASES = '.about-phrases';

async function open(page: Page, width: number, theme: Theme, locale: string) {
    await page.setViewportSize({ width, height: 844 });
    await openIn(page, E2E_URL, theme, `/?lang=${locale}`);
    await page.waitForTimeout(400);
}

/** The phrases as rendered: each one's line (tops within 1px), its text start and its chevron. */
const readPhrases = (page: Page) => page.locator(PHRASES).evaluate((ul) => {
    const left = ul.getBoundingClientRect().left;
    const items = [...ul.querySelectorAll('li')].map((li) => {
        const range = document.createRange();
        range.selectNodeContents(li);
        const text = [...li.childNodes].find((n) => n.nodeType === 3);
        if (text) { range.selectNodeContents(text); }
        const content = getComputedStyle(li, '::before').content;
        return { top: li.getBoundingClientRect().top, textLeft: range.getBoundingClientRect().left, chevron: content !== 'none' && content !== 'normal' };
    });
    const lines: number[][] = [];
    items.forEach((it, i) => {
        const line = lines.find((l) => Math.abs(items[l[0]].top - it.top) < 1);
        if (line) line.push(i); else lines.push([i]);
    });
    const lis = [...ul.querySelectorAll('li')];
    const row = lis[lis.length - 1].getBoundingClientRect().right - lis[0].getBoundingClientRect().left;
    return { items, lines, left, width: ul.clientWidth, row };
});

test('the hero has four phrases (a fifth is a finding for that change, spec 047 edge case)', () => {
    expect(ABOUT.phraseKeys.length).toBe(4);
});

for (const width of [360, 390]) for (const locale of LOCALES) {
    test(`two phrases per line, in order — ${width}px, ${locale} (RF-1)`, async ({ page }) => {
        await open(page, width, 'light', locale);
        expect((await readPhrases(page)).lines).toEqual([[0, 1], [2, 3]]);
    });

    test(`no line starts with a chevron, the second phrase of a line carries one — ${width}px, ${locale} (RF-3, RF-2)`, async ({ page }) => {
        await open(page, width, 'light', locale);
        const r = await readPhrases(page);
        const offenders: string[] = [];
        r.lines.forEach((line, n) => {
            const first = r.items[line[0]];
            if (Math.abs(first.textLeft - r.left) > 0.5) offenders.push(`RF-3: line ${n + 1} starts at ${first.textLeft.toFixed(1)}, the row at ${r.left.toFixed(1)}`);
            if (first.chevron) offenders.push(`RF-3: line ${n + 1} starts with a chevron`);
            for (const i of line.slice(1)) if (!r.items[i].chevron) offenders.push(`RF-2: phrase ${i + 1} has no chevron after its pair`);
        });
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
}

// RF-2: the chevron's own colour over the hero's bare ground, worst pixel (the dark glow included).
const CHEVRON: PixelTarget[] = [{ sel: `${PHRASES} li:nth-child(2n)`, pseudo: '::before', kind: 'border', floor: 3 }];
for (const theme of THEMES) for (const width of [360, 390]) {
    test(`the chevron is gold and clears 3:1 over the hero — ${theme}, ${width}px (RF-2)`, async ({ page }) => {
        await open(page, width, theme, 'es');
        const accent = await page.evaluate(() => { const i = document.createElement('i'); i.style.color = 'var(--accent-text)'; document.body.append(i); const c = getComputedStyle(i).color; i.remove(); return c; });
        const res = await worstOverBackground(page, CHEVRON, '.layout-topbar, .section--hero > :not(.hero-band)', 'section.section--hero');
        expect(res.length, 'chevrons measured').toBe(2);
        for (const w of res) {
            expect(w.fg, 'the chevron is --accent-text').toBe(accent);
            expect(w.ratio, `${w.fg} on ${w.at}`).toBeGreaterThanOrEqual(w.floor);
        }
    });
}

// The sweep: where four fit on one line the row stays one line; where they do not, two per line.
// The row's own width is read at 720 (one line there), not typed in.
for (const locale of LOCALES) {
    test(`every width from 320 to 720 shows one line or two pairs, never a 3+1 wrap — ${locale} (NFR)`, async ({ page }) => {
        await open(page, 720, 'light', locale);
        const wide = await readPhrases(page);
        expect(wide.lines.length, 'the row is one line at 720').toBe(1);
        const row = wide.row;
        const offenders: string[] = [];
        for (let w = 320; w <= 720; w += 4) {
            await page.setViewportSize({ width: w, height: 844 });
            await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
            const r = await readPhrases(page);
            const oneLine = r.lines.length === 1 && r.items.slice(1).every((it) => it.chevron);
            const pairs = JSON.stringify(r.lines) === '[[0,1],[2,3]]' && !r.items[2].chevron && !r.items[0].chevron;
            const layout = oneLine ? 'one' : pairs ? 'pairs' : 'other';
            const expected = r.width >= row + 16 ? 'one' : r.width < row ? 'pairs' : 'either';
            if (layout === 'other') offenders.push(`${w}px: ${JSON.stringify(r.lines)}`);
            else if (expected !== 'either' && layout !== expected) offenders.push(`${w}px: ${layout}, wanted ${expected} (row ${row.toFixed(0)}, room ${r.width})`);
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
}
