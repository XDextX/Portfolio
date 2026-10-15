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
