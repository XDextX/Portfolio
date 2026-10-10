/**
 * Generator for `public/og-cover.png`: `node --no-warnings scripts/og-cover.ts`.
 * It reads the site's own tokens and fonts and imports `ABOUT`, exporting every
 * reading as data — a token renamed in the sheet has to turn a check red, and a
 * rendered PNG cannot show that. It never parses the data file (plan D3).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { ABOUT } from '../src/data/about.ts';

/** The card's own padding. The sheet's spacing scale has no step for a 1200px
 *  canvas, and a token invented for one file would be a second source. */
const CARD_PADDING_PX = 64;

/** Every `rem` in the type scale resolves against this. */
const ROOT_FONT_SIZE_PX = 16;

/** The tokens the card is drawn from. A subset, not the sheet: a token it does
 *  not draw with has no business in what it exports. */
const DRAWN_TOKENS = [
    '--brand-primary',
    '--brand-accent',
    '--font-sans',
    '--font-mono',
    '--fs-xs',
    '--fs-4xl',
] as const;

export interface Readings {
    /**
     * Name -> value, verbatim from the sheet. A token the sheet no longer
     * declares arrives as `undefined` rather than being dropped, because the
     * loss is the thing `tests/seo.test.ts` has to go red on.
     */
    tokens: Record<string, string | undefined>;
    /** Root-absolute paths the font sheet names, read from it and not listed here. */
    fonts: string[];
    /**
     * The pair the card is drawn with: the accent, over the ground. Exported as
     * values so a caller can compute their contrast without naming a token —
     * the names stay here, and a test that wrote them would be asserting on a
     * pair it chose rather than the one the card draws.
     */
    palette: { accent: string | undefined; ground: string | undefined };
    content: { name: string; role: string };
    geometry: { widthPx: 1200; heightPx: 630; paddingPx: number; contentWidthPx: number };
    type: {
        baseSizePx: number;
        floorSizePx: number;
        familySans: string | undefined;
        familyMono: string | undefined;
    };
}

/**
 * Comments off before anything is parsed, never after. The sheet's own notes
 * name `--brand-primary` and the gold inside prose, and a reader on raw text
 * would find a token in the paragraph explaining why it exists.
 */
function stripComments(css: string): string {
    return css.replace(/\/\*[\s\S]*?\*\//g, ' ');
}

/** Every `--name: value` the sheet declares. */
function parseTokens(css: string): Record<string, string> {
    const stripped = stripComments(css);
    const out: Record<string, string> = {};

    for (const m of stripped.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) out[m[1]] = m[2].trim();

    return out;
}

/** Every `/fonts/...` url the sheet's `@font-face` blocks name. */
function parseFontFaces(css: string): string[] {
    return [...stripComments(css).matchAll(/url\((['"]?)(\/fonts\/[^'")]+)\1\)/g)].map((m) => m[2]);
}

/** `rem` to px. A token with no value yields NaN, never a number invented here. */
function pxFromRem(value: string | undefined): number {
    return Math.round(Number.parseFloat(value ?? '') * ROOT_FONT_SIZE_PX);
}

/** One sRGB channel to relative luminance, on WCAG 2.x's own split at 0.03928. */
function luminanceChannel(value: number): number {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/**
 * Relative luminance of a `#RGB` or `#RRGGBB` value, per WCAG 2.x.
 *
 * The sRGB transfer function, not a 0.2126-weighted average of the bytes: an
 * unexpanded average overstates midtones, which is exactly where this card's
 * gold sits. Verified against the three references the formula is quoted with —
 * black on white returns 21, white on white 1, and `#767676` on white 4.5422.
 *
 * @param hex - a `#RGB` or `#RRGGBB` colour; anything else throws by name.
 * @returns luminance in [0, 1].
 */
function luminance(hex: string): number {
    const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
    if (m === null) throw new Error(`not a #RGB or #RRGGBB value: ${hex}`);

    const full =
        m[1].length === 3
            ? m[1]
                  .split('')
                  .map((c) => c + c)
                  .join('')
            : m[1];
    const n = Number.parseInt(full, 16);

    return (
        0.2126 * luminanceChannel((n >> 16) & 255) +
        0.7152 * luminanceChannel((n >> 8) & 255) +
        0.0722 * luminanceChannel(n & 255)
    );
}

/**
 * WCAG 2.x contrast ratio between two colours: the lighter luminance +0.05
 * over the darker +0.05, so it is symmetric and lands in [1, 21].
 *
 * Takes values, never token names: the card's own exported pair feeds it, so
 * redrawing on another gold turns RF-7's check red instead of passing unnoticed.
 *
 * @param fg - the foreground colour, as `#RGB` or `#RRGGBB`.
 * @param bg - the background colour, in the same form.
 * @returns the ratio, 21 being black on white.
 */
export function contrastRatio(fg: string, bg: string): number {
    const a = luminance(fg);
    const b = luminance(bg);

    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** The identity, lifted from the module the site itself imports. No parser over
 *  that file: a regex there is a second reading of a datum, and one that could
 *  drift from the object it reads without knowing it (constitution 9). */
function readAbout(): { name: string; role: string } {
    return { name: ABOUT.name, role: ABOUT.title };
}

/**
 * Reads the site's tokens, fonts and identity and returns them as data.
 *
 * @param sheetDir - the directory holding `00-tokens.css` and `05-fonts.css`.
 * @returns every reading the card draws with, verbatim and unrounded.
 */
export function readTokens(sheetDir: string): Readings {
    const sheet = parseTokens(fs.readFileSync(path.join(sheetDir, '00-tokens.css'), 'utf-8'));
    const fonts = parseFontFaces(fs.readFileSync(path.join(sheetDir, '05-fonts.css'), 'utf-8'));

    // Keyed by name and built from the list above rather than filtered out of
    // the sheet: a renamed token has to arrive here carrying `undefined`, and
    // filtering would drop the key and hide the loss instead of reporting it.
    const tokens: Record<string, string | undefined> = {};
    for (const name of DRAWN_TOKENS) tokens[name] = sheet[name];

    return {
        tokens,
        fonts,
        // The names stay here: this is the only place that knows which value is
        // drawn over which, so a caller cannot pair two colours the card never
        // puts together.
        palette: { accent: tokens['--brand-accent'], ground: tokens['--brand-primary'] },
        content: readAbout(),
        geometry: {
            widthPx: 1200,
            heightPx: 630,
            paddingPx: CARD_PADDING_PX,
            contentWidthPx: 1200 - CARD_PADDING_PX * 2,
        },
        type: {
            baseSizePx: pxFromRem(tokens['--fs-4xl']),
            floorSizePx: pxFromRem(tokens['--fs-xs']),
            familySans: tokens['--font-sans'],
            familyMono: tokens['--font-mono'],
        },
    };
}

/** The font engine, injected — the same rule as a clock. In `main()` it is
 *  backed by Chromium's text measurement; in the check it is a plain function
 *  of the text and the size. */
export interface Measure {
    (text: string, sizePx: number): number;
}

export interface FitFontSizeArgs {
    text: string;
    measure: Measure;
    maxWidthPx: number;
    sizesPx: number[];
    floorPx: number;
}

export interface FitResult {
    sizePx: number;
    widthPx: number;
    fits: boolean;
    lines: 1;
}

/**
 * The largest step in `sizesPx` at which `text` fits `maxWidthPx`, and `fits:
 * false` when even `floorPx` overflows. `lines` is `1` by construction — this
 * function never returns a wrapping size.
 */
export function fitFontSize(args: FitFontSizeArgs): FitResult {
    const { text, measure, maxWidthPx, sizesPx, floorPx } = args;

    for (const sizePx of sizesPx) {
        const widthPx = measure(text, sizePx);
        if (widthPx <= maxWidthPx) {
            return { sizePx, widthPx, fits: true, lines: 1 };
        }
    }

    const widthPx = measure(text, floorPx);
    return { sizePx: floorPx, widthPx, fits: false, lines: 1 };
}

// ── T-4: cardHtml(), renderCard(), main() ──────────────────────────────────

/** The type-scale steps the card walks, largest first (plan D7). */
const TYPE_SCALE_PX = [52, 40, 32, 24, 20, 16, 13, 12];

/** Escape HTML special characters in text drawn on the card. */
function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** The font family a `/fonts/...` path belongs to, by its file name. */
function fontFamilyFor(fontPath: string): string {
    if (fontPath.includes('Mono')) return 'IBM Plex Mono';
    return 'IBM Plex Sans';
}

/**
 * The card's HTML: `@font-face` with `file://` URLs (a `/fonts/...` path here
 * resolves against nothing and silently falls back to Times), and
 * `white-space: nowrap` on the name so "one line" is a property of the markup
 * (plan D6).
 */
export function cardHtml(readings: Readings, fitSizePx: number, publicDir: string): string {
    const fontFaces = readings.fonts
        .map((font) => {
            const fileUrl = pathToFileURL(path.resolve(publicDir, font)).href;
            const family = fontFamilyFor(font);
            return `@font-face { font-family: '${family}'; src: url('${fileUrl}') format('woff2'); }`;
        })
        .join('\n');

    return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
${fontFaces}
body {
    margin: 0;
    width: ${readings.geometry.widthPx}px;
    height: ${readings.geometry.heightPx}px;
    background: ${readings.palette.ground};
    font-family: ${readings.type.familySans};
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding: ${readings.geometry.paddingPx}px;
    box-sizing: border-box;
}
.name {
    font-size: ${fitSizePx}px;
    white-space: nowrap;
    font-weight: 700;
    color: #FFFFFF;
    margin: 0;
    line-height: 1.15;
}
.role {
    font-family: ${readings.type.familyMono};
    font-size: 16px;
    color: ${readings.palette.accent};
    margin: 12px 0 0 0;
    line-height: 1.4;
}
</style>
</head>
<body>
<h1 class="name">${escapeHtml(readings.content.name)}</h1>
<p class="role">${escapeHtml(readings.content.role)}</p>
</body>
</html>`;
}

/** Validate that every required token is present and non-empty (state 4). */
function validateTokens(readings: Readings): void {
    for (const name of DRAWN_TOKENS) {
        const value = readings.tokens[name];
        if (typeof value !== 'string' || value.trim() === '') {
            throw new Error(`Required token ${name} is missing or empty in 00-tokens.css`);
        }
    }
}

/** Validate that every font file exists (state 5). */
function validateFonts(readings: Readings, publicDir: string): void {
    for (const font of readings.fonts) {
        const fullPath = path.join(publicDir, font);
        if (!fs.existsSync(fullPath)) {
            throw new Error(`Font file ${font} is missing from ${publicDir}`);
        }
    }
}

/** Validate that ABOUT fields are non-empty (state 7). */
function validateAbout(readings: Readings): void {
    if (readings.content.name.trim() === '') {
        throw new Error('ABOUT.name is empty — a card with a blank headline is not a card');
    }
    if (readings.content.role.trim() === '') {
        throw new Error('ABOUT.title is empty — a card with no role is not a card');
    }
}

/**
 * The one code path that launches a browser (plan D5): `playwright` is
 * imported here, never at module scope, so importing this module in a test
 * costs nothing. Two `setContent` passes — measure, then draw — because the
 * second layout after a size change races `document.fonts.ready` (plan D4).
 */
export async function renderCard(
    readings: Readings,
    publicDir: string,
): Promise<Readings & { fit: FitResult }> {
    const { chromium } = await import('playwright');

    let browser;
    try {
        browser = await chromium.launch();
    } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        throw new Error(
            `Playwright browser cache missing or Chromium failed to launch.\n` +
            `Expected at %LOCALAPPDATA%\\ms-playwright\n` +
            `Run: npx playwright install\n` +
            `Original error: ${detail}`
        );
    }

    try {
        const page = await browser.newPage({
            viewport: {
                width: readings.geometry.widthPx,
                height: readings.geometry.heightPx,
            },
            deviceScaleFactor: 1,
        });

        // First pass: measure all candidate sizes at once.
        await page.setContent(cardHtml(readings, readings.type.baseSizePx, publicDir), {
            waitUntil: 'load',
        });
        await page.evaluate(() => document.fonts.ready);

        const sizesToMeasure = [...TYPE_SCALE_PX, readings.type.floorSizePx];
        const widths = await page.evaluate(
            ({ text, sizes }: { text: string; sizes: number[] }) => {
                const bodyFont = getComputedStyle(document.body).fontFamily;
                const results: Record<number, number> = {};
                for (const s of sizes) {
                    const probe = document.createElement('span');
                    probe.textContent = text;
                    probe.style.cssText =
                        'position:absolute;visibility:hidden;white-space:nowrap;' +
                        `font-size:${s}px;font-weight:700;font-family:${bodyFont}`;
                    document.body.append(probe);
                    results[s] = probe.getBoundingClientRect().width;
                    probe.remove();
                }
                return results;
            },
            { text: readings.content.name, sizes: sizesToMeasure },
        );

        const measure = (_text: string, sizePx: number) => widths[sizePx] ?? 0;

        const fit = fitFontSize({
            text: readings.content.name,
            measure,
            maxWidthPx: readings.geometry.contentWidthPx,
            sizesPx: TYPE_SCALE_PX,
            floorPx: readings.type.floorSizePx,
        });

        if (!fit.fits) {
            throw new Error(
                `the name does not fit even at --fs-xs (${readings.type.floorSizePx}px): ` +
                `${fit.widthPx}px in ${readings.geometry.contentWidthPx}px. Nothing is written.`
            );
        }

        // Second pass: draw at the fitted size.
        await page.setContent(cardHtml(readings, fit.sizePx, publicDir), {
            waitUntil: 'load',
        });
        await page.evaluate(() => document.fonts.ready);

        const buffer = await page.screenshot({ type: 'png' });
        fs.writeFileSync(path.join(publicDir, 'og-cover.png'), buffer);

        return { ...readings, fit };
    } finally {
        await browser.close();
    }
}

/**
 * Entry point: reads the site, renders the card, prints the chosen name size
 * and the contrast ratio. Every failure exits non-zero before `writeFile`,
 * so the committed PNG is either current or untouched (plan §5).
 */
export async function main(): Promise<void> {
    const repoRoot = process.cwd();
    const publicDir = path.join(repoRoot, 'public');
    const sheetDir = path.join(publicDir, 'styles');

    const readings = readTokens(sheetDir);
    validateTokens(readings);
    validateFonts(readings, publicDir);
    validateAbout(readings);

    const result = await renderCard(readings, publicDir);

    const ratio = contrastRatio(result.palette.accent!, result.palette.ground!);
    console.log(`og-cover.png written · ${result.fit.sizePx}px name · ${ratio.toFixed(2)}:1`);
}

/** Whether this file is being run directly (not imported as a module). */
function isMainModule(): boolean {
    if (!process.argv[1]) return false;
    try {
        return path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
    } catch {
        return false;
    }
}

if (isMainModule()) {
    main().catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        console.error(message);
        process.exitCode = 1;
    });
}