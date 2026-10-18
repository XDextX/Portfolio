import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { E2E_URL } from './helpers/server';
import { worstOverBackground } from './helpers/pixels';
import { readTokens, cardHtml, phrasesFor, cardLocales } from '../scripts/og-cover.ts';

// Spec 033: the social card laid out like the hero (RF-1, RF-2, RF-4), checked on the generator's
// own markup in the installed Chrome; and each page names its own locale's card (RF-9).

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, 'public');
const LOCALES_DIR = path.join(ROOT, 'i18n', 'locales');
const readings = readTokens(path.join(PUBLIC, 'styles'));
// Spec 034: canonical and hreflang stay on the site astro.config.mjs declares.
const CONFIGURED_SITE = new URL(fs.readFileSync(path.join(ROOT, 'astro.config.mjs'), 'utf-8').match(/site:\s*['"]([^'"]+)['"]/)![1]).origin;

for (const locale of cardLocales(LOCALES_DIR)) {
    test(`card layout: avatar left, name on one line in ink and gold, italic phrases — ${locale} (RF-1, RF-2, RF-4)`, async ({ page }) => {
        await page.setViewportSize({ width: readings.geometry.widthPx, height: readings.geometry.heightPx });
        // A 1×1 white PNG: no network, the layout is what is measured.
        const avatar = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';
        await page.setContent(cardHtml(readings, phrasesFor(locale, LOCALES_DIR), readings.type.baseSizePx, PUBLIC, avatar), { waitUntil: 'load' });
        await page.evaluate(() => document.fonts.ready);
        const r = await page.evaluate(() => {
            const box = (s: string) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom, h: b.height }; };
            const colour = (s: string) => { const e = document.querySelector(s); return e ? getComputedStyle(e).color : null; };
            const probe = (c: string) => { const i = document.createElement('i'); i.style.color = c; document.body.append(i); const v = getComputedStyle(i).color; i.remove(); return v; };
            const name = document.querySelector('.name')!;
            return {
                fonts: [...document.fonts].filter((f) => f.family.includes('IBM Plex Sans')).map((f) => `${f.style} ${f.status}`),
                avatar: box('.avatar'), name: box('.name'), lineHeight: parseFloat(getComputedStyle(name).lineHeight),
                given: colour('.given'), family: colour('.family'),
                phrases: [...document.querySelectorAll('.phrases li')].map((li) => getComputedStyle(li).fontStyle),
                probe,
            };
        });
        const want = await page.evaluate(([ink, accent]) => {
            const probe = (c: string) => { const i = document.createElement('i'); i.style.color = c; document.body.append(i); const v = getComputedStyle(i).color; i.remove(); return v; };
            return { ink: probe(ink!), accent: probe(accent!) };
        }, [readings.palette.ink, readings.palette.accent]);
        const offenders: string[] = [];
        const { widthPx, heightPx } = readings.geometry;
        if (!r.avatar || !r.name) offenders.push('RF-1: no avatar or no name drawn');
        else {
            if (r.avatar.r > r.name.l) offenders.push(`RF-1: the avatar (right edge ${r.avatar.r}) is not left of the name (${r.name.l})`);
            if (r.avatar.l < 0 || r.avatar.t < 0 || r.avatar.r > widthPx || r.avatar.b > heightPx) offenders.push('RF-1: the avatar leaves the canvas');
            if (r.name.h > r.lineHeight * 1.5) offenders.push(`RF-2: the name wraps (${r.name.h}px for a ${r.lineHeight}px line)`);
        }
        if (r.given !== want.ink) offenders.push(`RF-2: given is ${r.given}, not the ink ${want.ink}`);
        if (r.family !== want.accent) offenders.push(`RF-2: family is ${r.family}, not the accent ${want.accent}`);
        // AGENTS: IBM Plex Sans, never the fallback (every card before spec 033 drew in Segoe UI).
        if (!r.fonts.includes('normal loaded') || !r.fonts.includes('italic loaded')) offenders.push(`fonts: ${r.fonts.join(', ')}`);
        if (r.phrases.length !== 4 || r.phrases.some((s) => s !== 'italic')) offenders.push(`RF-4: phrases ${JSON.stringify(r.phrases)}`);
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    test(`card text clears 4.5:1 over the band — ${locale} (spec 036 RF-4)`, async ({ page }) => {
        await page.setViewportSize({ width: readings.geometry.widthPx, height: readings.geometry.heightPx });
        const avatar = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';
        await page.setContent(cardHtml(readings, phrasesFor(locale, LOCALES_DIR), readings.type.baseSizePx, PUBLIC, avatar), { waitUntil: 'load' });
        await page.evaluate(() => document.fonts.ready);
        const targets = ['.given', '.family', '.role', '.location', '.phrases li'].map((sel) => ({ sel, kind: 'text' as const, floor: 4.5 }));
        const offenders = (await worstOverBackground(page, targets, '.text, .avatar', 'body')).filter((w) => w.ratio < w.floor)
            .map((w) => `RF-4: ${w.sel} ${w.fg} on ${w.at} is ${w.ratio.toFixed(2)}:1`);
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    test(`page binds its own card — ${locale} (RF-9)`, async ({ page, request }) => {
        await page.goto(`${E2E_URL}/?lang=${locale}`);
        const og = await page.locator('meta[property="og:image"]').getAttribute('content');
        const tw = await page.locator('meta[name="twitter:image"]').getAttribute('content');
        const offenders: string[] = [];
        if (og !== tw) offenders.push(`RF-9: og:image ${og} and twitter:image ${tw} differ`);
        if (!og?.endsWith(`/og-cover-${locale}.png`)) offenders.push(`RF-9: og:image is ${og}`);
        // Spec 034: the social tags on the serving origin, search engines on production.
        const served = new URL(E2E_URL).origin;
        const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');
        if (!og?.startsWith(`${served}/`) || !ogUrl?.startsWith(`${served}/`)) offenders.push(`spec 034 RF-1: og:image ${og}, og:url ${ogUrl} not on ${served}`);
        const seo = await page.locator('link[rel="canonical"], link[rel="alternate"][hreflang]').evaluateAll((ls) => ls.map((l) => l.getAttribute('href')));
        if (seo.length !== 4 || seo.some((h) => !h?.startsWith(`${CONFIGURED_SITE}/`))) offenders.push(`spec 034 RF-2: ${seo.join(', ')}`);
        const res = await request.get(`${E2E_URL}/og-cover-${locale}.png`);
        if (res.status() !== 200) offenders.push(`RF-9: /og-cover-${locale}.png answers ${res.status()}`);
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
}
