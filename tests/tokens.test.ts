import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * A custom property read but never defined fails silently: the declaration is
 * "invalid at computed-value time", so the browser drops it and nothing appears
 * in the console. `AvatarCircle` shipped `border: 0px none` for weeks.
 */

const ROOT = process.cwd();

/**
 * Strips CSS and JS comments, so a token named inside a note is not read as a
 * use of it. The note documenting why `--bg-color` was removed names the token,
 * and counting that fails a test about a token that no longer exists.
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

/**
 * Every `.astro` and `.ts` that can read a token. `src/data` has to be in here:
 * `levelLabels.ts` is the only place a token is read from inside a JS string,
 * and a scan that skipped it called three live tokens dead.
 */
const SOURCE_FILES = [
    ...walk(path.join(ROOT, 'src', 'components'), ['.astro', '.ts']),
    ...walk(path.join(ROOT, 'src', 'pages'), ['.astro', '.ts']),
    ...walk(path.join(ROOT, 'src', 'layouts'), ['.astro', '.ts']),
    ...walk(path.join(ROOT, 'src', 'data'), ['.astro', '.ts']),
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

/** Every `var(--token)` anywhere it can appear, flagging the ones with a fallback. */
function collectUsed(): Map<string, { fallback: boolean; where: string }> {
    const used = new Map<string, { fallback: boolean; where: string }>();

    // Stylesheets count as readers. `--bg` is read only from light.css and
    // dark.css, so a component-only scan calls it dead while the browser paints
    // the page with it — the first version of the dead-token test did exactly
    // that and reported 28 false positives.
    for (const file of [...CSS_FILES, ...SOURCE_FILES]) {
        const src = stripComments(fs.readFileSync(file, 'utf-8'));
        const where = path.relative(ROOT, file);

        // Capture whether a fallback follows the token name. The delimiter may be
        // a comma or the closing paren, and it may be a quote: a token read from
        // inside a JS string is written 'var(--clr-beginner-text, …)', where a
        // pattern requiring , or ) straight after the name misses it. That made
        // three live tokens look dead on the first run.
        for (const m of src.matchAll(/var\(\s*(--[a-z0-9-]+)\s*([,)\s'"])/gi)) {
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
        // Comments come off first, and that is not tidiness: a `{ … }` inside a
        // CSS comment pairs with the next real `}`, so a note quoting a
        // declaration swallows the rule after it. One did in 00-tokens.css, and
        // the scan read 193 of that file's 6389 characters and never saw a token.
        for (const file of CSS_FILES) {
            const src = stripComments(fs.readFileSync(file, 'utf-8'));
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

/**
 * A token declared in one theme and read in both is worse than a missing one:
 * nothing errors and the fallback is the other theme's palette. `--bg-color`
 * lived in light.css only, so in dark the skills toggle painted `#E4E8EE`.
 */
describe('theme token coverage', () => {
    const THEME_DIR = path.join(ROOT, 'public', 'styles', 'themes');

    function declaredIn(file: string): Set<string> {
        const src = stripComments(fs.readFileSync(path.join(THEME_DIR, file), 'utf-8'));
        return new Set(
            [...src.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map((m) => m[1]),
        );
    }

    function base(): Set<string> {
        const src = stripComments(
            fs.readFileSync(path.join(ROOT, 'public', 'styles', '00-tokens.css'), 'utf-8'),
        );
        return new Set([...src.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map((m) => m[1]));
    }

    it('a token read anywhere is declared in both themes or in neither', () => {
        const shared = base();
        const light = declaredIn('light.css');
        const dark = declaredIn('dark.css');
        const used = collectUsed();

        const offenders: string[] = [];

        for (const token of used.keys()) {
            if (shared.has(token)) continue; // available in both by definition
            const inLight = light.has(token);
            const inDark = dark.has(token);
            if (inLight !== inDark) {
                const only = inLight ? 'light.css' : 'dark.css';
                offenders.push(
                    `${token} is declared only in ${only} but read in ${used.get(token)?.where}`,
                );
            }
        }

        expect(
            offenders,
            `These tokens are declared in one theme file and read somewhere, so the\n` +
            `other theme silently inherits this one's value. Declare them in both\n` +
            `files or in neither:\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });

    it('a semantic name is declared in terms of a token, never as a second literal', () => {
        /*
         * Two literals under one value means two values: a theme redefining one
         * leaves the other stale. Aliases are deliberate, so one name is the
         * literal and the rest `var()` of it. Eleven real violations so far.
         */
        const offenders: string[] = [];

        for (const file of ['light.css', 'dark.css']) {
            const src = stripComments(fs.readFileSync(path.join(THEME_DIR, file), 'utf-8'));
            const byValue = new Map<string, string[]>();

            for (const m of src.matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9a-f]{3,8}|rgba?\([^;]+\))\s*;/gi)) {
                byValue.set(m[2].trim(), [...(byValue.get(m[2].trim()) ?? []), m[1]]);
            }

            for (const [value, names] of byValue) {
                if (names.length < 2) continue;
                offenders.push(
                    `${file}: ${value} is a literal under ${names.length} names (${names.join(', ')})`,
                );
            }
        }

        expect(
            offenders,
            `Each of these literals is declared under more than one name. They look\n` +
            `like aliases but they are independent values: a theme that changes one\n` +
            `leaves the others stale, and any reader of a forgotten name keeps the old\n` +
            `colour. Keep one literal and write the rest as var(--that-one):\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });

    it('no token is declared in a theme and read by nobody', () => {
        /*
         * Dead token surface: `--text-inverse` and `--color-brand-600` sat in
         * light.css with zero readers. A reader counts inside another token's
         * value too — scanning components only called `--clr-beginner-text` dead.
         */
        const shared = base();
        const used = collectUsed();
        const offenders: string[] = [];

        for (const file of ['light.css', 'dark.css']) {
            const src = stripComments(fs.readFileSync(path.join(THEME_DIR, file), 'utf-8'));
            for (const m of src.matchAll(/(--[a-z0-9-]+)\s*:/gi)) {
                const token = m[1];
                if (shared.has(token) || used.has(token)) continue;
                offenders.push(`${token} in ${file}`);
            }
        }

        expect(
            offenders,
            `These tokens are declared in a theme file and read nowhere. They are\n` +
            `surface area with no reader: someone will reach for one, and it will\n` +
            `resolve to nothing in half the themes:\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });
});
