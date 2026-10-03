import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * A custom property that is read but never defined does not fail loudly: the
 * declaration using it becomes "invalid at computed-value time" and the browser
 * silently falls back to the initial value. That is how AvatarCircle ended up
 * with `border: 0px none` for weeks — `--avatar-ring` existed nowhere and the
 * whole `border` shorthand was discarded with no error in the console.
 *
 * These tests assert on the token data itself, not on any particular markup, so
 * they survive refactors.
 */

const ROOT = process.cwd();

/**
 * Strips CSS and JS comments, so a token named inside a note is not counted as
 * a use of it.
 *
 * This matters as soon as anyone explains a bug in the source. The note that
 * documents why `--bg-color` was removed names the token, and reading that as a
 * real use fails a test about a token that no longer exists — the guard
 * reporting its own explanation. A note about a token is not a use of it.
 */
function stripComments(src: string): string {
    return src
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/^\s*\/\/.*$/gm, ' ');
}

function walk(dir: string, exts: string[]): string[] {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return walk(full, exts);
        return exts.includes(path.extname(entry.name)) ? [full] : [];
    });
}

const CSS_FILES = [
    ...walk(path.join(ROOT, 'public', 'styles'), ['.css']),
    ...walk(path.join(ROOT, 'src', 'styles'), ['.css']),
];

const SOURCE_FILES = [
    ...walk(path.join(ROOT, 'src', 'components'), ['.astro', '.ts']),
    ...walk(path.join(ROOT, 'src', 'pages'), ['.astro', '.ts']),
    ...walk(path.join(ROOT, 'src', 'layouts'), ['.astro', '.ts']),
];

/**
 * Every `--token:` declaration, from stylesheets and from component sources.
 * The optional quote handles inline style objects, where Astro emits keys as
 * `'--ring': '3px'` and the quote sits between the name and the colon.
 */
function collectDefined(): Set<string> {
    const defined = new Set<string>();
    const files = [...CSS_FILES, ...SOURCE_FILES];

    for (const file of files) {
        const src = stripComments(fs.readFileSync(file, 'utf-8'));
        for (const m of src.matchAll(/['"]?(--[a-z0-9-]+)['"]?\s*:/gi)) defined.add(m[1]);
    }
    return defined;
}

/** Every `var(--token)`, flagging the ones that carry a fallback. */
function collectUsed(): Map<string, { fallback: boolean; where: string }> {
    const used = new Map<string, { fallback: boolean; where: string }>();

    for (const file of SOURCE_FILES) {
        const src = stripComments(fs.readFileSync(file, 'utf-8'));
        const where = path.relative(ROOT, file);

        // Capture whether a comma (fallback) follows the token name.
        for (const m of src.matchAll(/var\(\s*(--[a-z0-9-]+)\s*(,|\s*\))/gi)) {
            const existing = used.get(m[1]);
            // Keep the strictest reading: a use without a fallback is a failure
            // even if another file provides one.
            const fallback = m[2] === ',' ? true : existing?.fallback ?? false;
            if (!existing || existing.fallback) {
                used.set(m[1], { fallback, where });
            }
        }
    }
    return used;
}

describe('design tokens', () => {
    it('every var() in a component resolves to a defined custom property', () => {
        const defined = collectDefined();
        const used = collectUsed();

        const broken = [...used.entries()]
            .filter(([token, { fallback }]) => !defined.has(token) && !fallback)
            .map(([token, { where }]) => `${token} (used in ${where})`);

        expect(
            broken,
            `These custom properties are read but never defined and have no ` +
            `fallback, so the declaration using them is dropped by the browser:\n  ` +
            broken.join('\n  '),
        ).toEqual([]);
    });

    it('no token is kept alive only by a hardcoded fallback', () => {
        const defined = new Set<string>();
        for (const file of CSS_FILES) {
            const src = fs.readFileSync(file, 'utf-8');
            for (const m of src.matchAll(/['"]?(--[a-z0-9-]+)['"]?\s*:/gi)) defined.add(m[1]);
        }

        const onlyByFallback: string[] = [];
        for (const file of SOURCE_FILES) {
            const src = fs.readFileSync(file, 'utf-8');
            // var(--x, #abc) or var(--x, rgb(...)) where --x is defined nowhere.
            for (const m of src.matchAll(
                /var\(\s*(--[a-z0-9-]+)\s*,\s*(#[0-9a-f]{3,8}|rgba?\([^)]*\))/gi,
            )) {
                if (!defined.has(m[1])) {
                    onlyByFallback.push(
                        `${m[1]} in ${path.relative(ROOT, file)} (fallback ${m[2]})`,
                    );
                }
            }
        }

        expect(
            onlyByFallback,
            `These tokens are undefined everywhere and only a hardcoded colour ` +
            `keeps them rendering, which means they never follow the theme:\n  ` +
            onlyByFallback.join('\n  '),
        ).toEqual([]);
    });

    it('stylesheet custom properties are unique per theme layer', () => {
        // A duplicate declaration in the same rule usually means a copy-paste
        // that silently overrides an earlier value.
        for (const file of CSS_FILES) {
            const src = fs.readFileSync(file, 'utf-8');
            const blocks = src.matchAll(/\{([^{}]*)\}/g);
            for (const block of blocks) {
                const seen = new Map<string, number>();
                for (const m of block[1].matchAll(/(--[a-z0-9-]+)\s*:/gi)) {
                    seen.set(m[1], (seen.get(m[1]) ?? 0) + 1);
                }
                const dupes = [...seen.entries()]
                    .filter(([, n]) => n > 1)
                    .map(([token]) => token);
                expect(
                    dupes,
                    `Duplicate declarations in one rule of ${path.relative(ROOT, file)}: ${dupes.join(', ')}`,
                ).toEqual([]);
            }
        }
    });
});
