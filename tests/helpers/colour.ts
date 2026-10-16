/**
 * The colour maths every visual guard shares, one copy for vitest and the e2e suite
 * (spec 016, plan D-5): WCAG contrast, and a resolver that follows token aliases.
 */

import fs from 'fs';
import path from 'path';

/** Source with comments blanked out, so a note is not read as a rule. */
export function stripComments(src: string): string {
    return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
}

/**
 * WCAG 2.x relative luminance of an opaque colour.
 * @param hex `#rrggbb`
 * @returns luminance in [0, 1]
 */
export function luminance(hex: string): number {
    const m = hex.replace('#', '').match(/.{2}/g);
    if (!m || m.length < 3) throw new Error(`not a hex colour: ${hex}`);
    const [r, g, b] = m.map((p) => parseInt(p, 16) / 255);
    const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * WCAG contrast ratio between two opaque colours.
 * @param a `#rrggbb` @param b `#rrggbb`
 * @returns ratio in [1, 21]
 */
export function contrast(a: string, b: string): number {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
}

/**
 * Split `var(--token, fallback?)` into its parts.
 * @param value a CSS value
 * @returns the token and fallback, or null when the value is not a var()
 */
export function parseVarRef(value: string): { token: string; fallback: string } | null {
    const m = value.trim().match(/^var\(\s*(--[A-Za-z0-9_-]+)\s*(?:,\s*(.+?))?\s*\)$/s);
    if (!m) return null;
    return { token: m[1], fallback: (m[2] ?? '').trim() };
}

/**
 * Normalise to `#rrggbb`; anything else throws, so an unmeasurable colour fails loudly.
 * @param value a CSS colour
 * @returns the lower-cased six-digit hex
 */
export function toHex(value: string): string {
    const hex = value.trim().toLowerCase();
    const short = hex.match(/^#([0-9a-f]{3})$/);
    if (short) return '#' + [...short[1]].map((c) => c + c).join('');
    if (/^#[0-9a-f]{6}$/.test(hex)) return hex;
    throw new Error(`not an opaque hex colour: ${value}`);
}

// The first declaration of a token across the layers, in cascade order, or null.
function declared(token: string, layers: string[]): string | null {
    const re = new RegExp(`(?<![\\w-])${token}\\s*:\\s*([^;]+);`, 'i');
    for (const src of layers) {
        const m = src.match(re);
        if (m) return m[1].trim();
    }
    return null;
}

/**
 * Resolve a colour through any chain of token aliases.
 * @param expr a literal or `var()` @param layers sources in cascade order, first declaration wins
 * @returns `#rrggbb`; throws on a token declared nowhere without a fallback, or on a cycle
 */
export function resolveColour(expr: string, ...layers: string[]): string {
    const seen = new Set<string>();
    const walk = (value: string): string => {
        const ref = parseVarRef(value);
        if (!ref) return toHex(value);
        if (seen.has(ref.token)) throw new Error(`${ref.token} aliases itself through a cycle`);
        seen.add(ref.token);
        const found = declared(ref.token, layers);
        if (found !== null) return walk(found);
        if (!ref.fallback) throw new Error(`${ref.token} resolves in no layer`);
        return walk(ref.fallback);
    };
    return walk(expr);
}

/** One CSS rule: its selectors split, its declarations, and the at-rules around it. */
export interface CssRule {
    selectors: string[];
    body: string;
    media: string;
}

/**
 * Walk a stylesheet's braces into its innermost rules, keeping each one's `@media` context.
 * @param src comment-stripped CSS
 * @returns the style rules; at-rule blocks are context, never rules
 */
export function cssRules(src: string): CssRule[] {
    const rules: CssRule[] = [];
    const stack: { prelude: string; parent: boolean }[] = [];
    let buf = '';
    for (const ch of src) {
        if (ch === '{') {
            if (stack.length) stack[stack.length - 1].parent = true;
            stack.push({ prelude: buf.trim(), parent: false });
            buf = '';
        } else if (ch === '}') {
            const top = stack.pop();
            if (top && !top.parent && !top.prelude.startsWith('@')) {
                rules.push({
                    selectors: top.prelude.split(/,(?![^(]*\))/).map((s) => s.trim()).filter(Boolean),
                    body: buf,
                    media: stack.map((s) => s.prelude).filter((p) => p.startsWith('@')).join(' '),
                });
            }
            buf = '';
        } else {
            buf += ch;
        }
    }
    return rules;
}

function walkFiles(dir: string, ext: string): string[] {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const full = path.join(dir, e.name);
        return e.isDirectory() ? walkFiles(full, ext) : e.name.endsWith(ext) ? [full] : [];
    });
}

/**
 * Every stylesheet the site ships and every component <style> block, comments stripped.
 * @param root the repository root
 * @returns one entry per stylesheet or <style> block, named by its file
 */
export function styleSources(root: string): { file: string; css: string }[] {
    const sheets = [path.join(root, 'public', 'styles'), path.join(root, 'src', 'styles')]
        .flatMap((d) => walkFiles(d, '.css'))
        .map((file) => ({ file, css: stripComments(fs.readFileSync(file, 'utf-8')) }));
    const blocks = walkFiles(path.join(root, 'src'), '.astro').flatMap((file) =>
        [...fs.readFileSync(file, 'utf-8').matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => ({
            file,
            css: stripComments(m[1]),
        })),
    );
    return [...sheets, ...blocks];
}

/**
 * HSL hue of an opaque colour, in degrees; 0 for a grey.
 * @param hex `#rrggbb`
 * @returns hue in [0, 360)
 */
export function hue(hex: string): number {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const max = Math.max(r, g, b);
    const d = max - Math.min(r, g, b);
    if (d === 0) return 0;
    const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return (h * 60 + 360) % 360;
}

/**
 * Circular distance between two hues.
 * @param a degrees @param b degrees
 * @returns the shorter way round, in [0, 180]
 */
export function hueDistance(a: number, b: number): number {
    const d = Math.abs(a - b) % 360;
    return Math.min(d, 360 - d);
}

/**
 * The colour term of a rule's border: `border-color`, else the `border` shorthand's colour.
 * @param decls the rule's declarations, property to value
 * @returns the colour, or null when the rule sets none (`none`, `0`, width and style only)
 */
export function borderColourOf(decls: Map<string, string>): string | null {
    const explicit = decls.get('border-color');
    if (explicit) return explicit.trim();
    const short = decls.get('border');
    if (!short) return null;
    const KEYWORD = /^(?:\d[\w.]*|thin|medium|thick|none|hidden|solid|dashed|dotted|double|groove|ridge|inset|outset)$/i;
    const colour = short.trim().split(/\s+(?![^(]*\))/).filter((t) => !KEYWORD.test(t));
    return colour.length ? colour.join(' ') : null;
}

/** A colour with 0–255 float channels and an alpha in [0, 1]. */
export interface Rgba {
    r: number;
    g: number;
    b: number;
    a: number;
}

/**
 * Parse a computed colour: `rgb()`, `rgba()`, `color(srgb r g b / a)` or `#rrggbb`.
 * @param css the serialised colour
 * @returns its channels; throws on any other space, so an `oklch()` stop fails loudly
 */
export function parseColour(css: string): Rgba {
    const s = css.trim();
    if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(s)) {
        const h = toHex(s);
        return { r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16), a: 1 };
    }
    const rgb = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i);
    if (rgb) {
        const a = rgb[4] === undefined ? 1 : rgb[4].endsWith('%') ? parseFloat(rgb[4]) / 100 : Number(rgb[4]);
        return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]), a };
    }
    const srgb = s.match(/^color\(\s*srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)$/i);
    if (srgb) {
        const ch = (v: string) => Math.round(Number(v) * 255 * 1e6) / 1e6;
        return { r: ch(srgb[1]), g: ch(srgb[2]), b: ch(srgb[3]), a: srgb[4] === undefined ? 1 : Number(srgb[4]) };
    }
    throw new Error(`not a measurable sRGB colour: ${css}`);
}

/**
 * The gradients in a computed `background-image`.
 * @param image the computed value
 * @returns each gradient's stops and whether it interpolates in sRGB; `none` gives []
 */
export function parseGradients(image: string): { srgb: boolean; stops: Rgba[] }[] {
    if (image.trim() === 'none') return [];
    if (/url\(/i.test(image)) throw new Error(`an image, not a gradient: ${image}`);
    const out: { srgb: boolean; stops: Rgba[] }[] = [];
    const re = /[\w-]*gradient\(/g;
    for (let m = re.exec(image); m; m = re.exec(image)) {
        let depth = 1;
        let i = m.index + m[0].length;
        for (; i < image.length && depth; i++) depth += image[i] === '(' ? 1 : image[i] === ')' ? -1 : 0;
        const body = image.slice(m.index + m[0].length, i - 1);
        const colours = body.match(/(?:rgba?|color)\([^()]*\)/gi) ?? [];
        const stops = colours.map(parseColour);
        const srgb = /\bin srgb\b/i.test(body) || colours.every((c) => /^rgba?\(/i.test(c));
        out.push({ srgb, stops });
        re.lastIndex = i;
    }
    return out;
}

/**
 * Every colour a gradient renders over an opaque sheet, each segment sampled.
 * @param g a parsed gradient @param sheet the opaque ground @param steps samples per segment
 * @returns the composites, endpoints included
 */
export function composites(g: { stops: Rgba[] }, sheet: Rgba, steps = 64): Rgba[] {
    const over = (c: Rgba): Rgba => ({
        r: c.a * c.r + (1 - c.a) * sheet.r,
        g: c.a * c.g + (1 - c.a) * sheet.g,
        b: c.a * c.b + (1 - c.a) * sheet.b,
        a: 1,
    });
    const flat = g.stops.map(over);
    const out: Rgba[] = flat.length ? [flat[0]] : [];
    for (let i = 1; i < flat.length; i++) {
        for (let s = 1; s <= steps; s++) {
            const t = s / steps;
            const [p, q] = [flat[i - 1], flat[i]];
            out.push({ r: p.r + (q.r - p.r) * t, g: p.g + (q.g - p.g) * t, b: p.b + (q.b - p.b) * t, a: 1 });
        }
    }
    return out;
}

const hexOf = (c: Rgba) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

/**
 * The lowest contrast a colour reaches against a gradient's composites.
 * @param colour the foreground @param samples the gradient's composites
 * @returns the worst ratio
 */
export function worstPoint(colour: Rgba, samples: Rgba[]): number {
    return Math.min(...samples.map((s) => contrast(hexOf(colour), hexOf(s))));
}

/**
 * Whether a colour lies on the ramp: transparent, or within `tol` of a segment between two ramp colours.
 * @param c the colour @param allowed the ramp @param tol per-channel tolerance
 * @returns true when on the ramp
 */
export function onRamp(c: Rgba, allowed: Rgba[], tol = 1): boolean {
    if (c.a === 0) return true;
    const near = (p: Rgba, q: Rgba) => {
        const d = [q.r - p.r, q.g - p.g, q.b - p.b];
        const len = d[0] ** 2 + d[1] ** 2 + d[2] ** 2;
        const t = len ? Math.max(0, Math.min(1, ((c.r - p.r) * d[0] + (c.g - p.g) * d[1] + (c.b - p.b) * d[2]) / len)) : 0;
        return [p.r + d[0] * t - c.r, p.g + d[1] * t - c.g, p.b + d[2] * t - c.b].every((v) => Math.abs(v) <= tol);
    };
    return allowed.some((p, i) => allowed.slice(i).some((q) => near(p, q)));
}

/**
 * The WCAG contrast floor for a piece of text.
 * @param px font size in px @param weight font weight
 * @returns 3 for large text (≥ 24px, or ≥ 18.66px at 700+), else 4.5
 */
export function floorFor(px: number, weight: number): 3 | 4.5 {
    return px >= 24 || (px >= 18.66 && weight >= 700) ? 3 : 4.5;
}
