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

/**
 * Every `.astro` and `.ts` that can read a token.
 *
 * `src/data` has to be in here. `levelLabels.ts` holds the only code in the repo
 * that reads a token from inside a JS string —
 * `'var(--clr-beginner-text, var(--clr-beginner))'` — and a scan that skipped it
 * called three live tokens dead. `AGENTS.md` calls `src/data/*.ts` editable
 * content, but it still emits CSS values into `style` attributes, so it is a
 * reader of tokens and has to be scanned as one.
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
        // A duplicate declaration in the same rule usually means a copy-paste
        // that silently overrides an earlier value.
        //
        // Comments come off first, and that is not tidiness. A `{ … }` written
        // inside a CSS comment pairs with the next real `}`, so a note quoting a
        // declaration swallows the whole rule that follows it. 00-tokens.css has
        // one — a backtick-quoted `a { color: … }` explaining a past fallback —
        // and it matched the `}` that closed `:root`, so this scan read 193
        // characters of that file out of 6389 and never saw a single token.
        // Every duplicate in the largest token file passed.
        //
        // That is the same shape as the `skipUntil` bug in comments.test.ts: a
        // scanner that silently drops most of its subject is worse than no
        // scanner, because it reports having checked. Widen what it reads.
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
 * nothing errors, and the fallback is the other theme's palette.
 *
 * `--bg-color` lived in light.css only. The skills view toggle read it, so in
 * dark the selected button painted `#E4E8EE` — a near-white grey from the
 * palette this site moved off — on top of the navy sheet. The first test in this
 * file could not see it: the token was defined *somewhere*, which is all it
 * checks.
 *
 * The scope is deliberately narrow. A theme file is allowed to add tokens the
 * other does not define, as long as nothing reads them; `:root[data-theme=…]`
 * and `:root` selectors mean a value declared in either sheet reaches both
 * themes. So the rule is only about tokens that are actually read.
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
         * `--bg-color` and `--bg` both read #E4E8EE in light, and that is what
         * let one theme drift: the name that stopped being redefined is the one a
         * reader silently kept on the old value.
         *
         * The site is full of deliberate aliases — `--text-color` over the
         * foreground ramp, `--color-border` over `--neutral-200`, `--tag-surface`
         * over `--neutral-200` again. They exist so a component can say what a
         * colour *means* rather than where it sits in a ramp, and they are how a
         * theme file makes that mapping explicit.
         *
         * **Two literals mean two values, and a theme that redefines one leaves
         * the other stale.** One literal plus `var(--the-other)` means the link is
         * enforced by the cascade and cannot drift. So the rule is: where a value
         * appears under two names in a theme, at most one of them may be a
         * literal; the rest must be written in terms of it.
         *
         * That is eleven real violations today — `--fg`, `--text-color` and
         * `--text-main` are three names for one ink — and it is the point of the
         * test. A version of this that only demanded "one name per value" would
         * have reported the same eleven with no way to tell a healthy alias from a
         * broken one.
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
         * Dead token surface. `--text-inverse` and `--color-brand-600` sat in
         * light.css with zero readers; the first audit pass listed them as
         * "defined in one theme" when in fact nothing read them at all.
         *
         * A reader counts anywhere it can appear, including from another token's
         * value: `--clr-beginner-text` is declared as
         * `var(--clr-beginner-text, var(--clr-beginner))` in `levelLabels.ts`, so
         * the first version of this test — scanning components for `var()` only —
         * called it dead and reported eleven false positives in one go.
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
