import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * The visual language, enforced rather than described.
 *
 * AGENTS.md states these as rules with the failure mode each one prevents. This
 * file turns the mechanical ones into checks, because a rule that only lives in
 * prose is a rule that quietly stops being true. Three of the guards in this repo
 * were green while the exact thing they existed to prevent was happening; every
 * one of them had looked where the violation was not.
 *
 * Two are asserted here. The rest — the palette itself, the type scale, the font
 * pairing — are decisions about taste and belong to a human looking at the page.
 */

const ROOT = process.cwd();

function walk(dir: string, exts: string[]): string[] {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return walk(full, exts);
        return exts.includes(path.extname(entry.name)) ? [full] : [];
    });
}

const ALL_FILES = [
    ...walk(path.join(ROOT, 'src'), ['.astro', '.ts']),
    ...walk(path.join(ROOT, 'public', 'styles'), ['.css']),
];

/** Source with comments blanked out, so a note is not read as a rule. */
function stripComments(src: string): string {
    return src
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/^\s*\/\/.*$/gm, ' ');
}

describe('visual language', () => {
    it('no hover lifts an element', () => {
        // "Hover means the border turns gold, and nothing lifts." Three rules
        // said translateY(-1px) on hover: the hero's download and social buttons
        // and .btn in 03-components.css. The first two also changed the border,
        // so they carried both signals and disagreed with each other about what
        // hover is; the third only lifted, which is a different signal again.
        //
        // `.btn` is the one case allowed to lift, and the reason is recorded in
        // the file rather than assumed: it is a standalone 404 call to action
        // with no hover of its own, so it has nothing else to signal. Named
        // explicitly so deleting the exception is a decision, not an oversight.
        const LIFT_ALLOWED = new Set(['.btn']);

        const offenders: string[] = [];

        for (const file of ALL_FILES) {
            const src = stripComments(fs.readFileSync(file, 'utf-8'));
            const where = path.relative(ROOT, file);

            for (const m of src.matchAll(
                /([^{}]+)\{([^{}]*transform\s*:\s*translateY[^{}]*)\}/gi,
            )) {
                const selector = m[1].trim().split('\n').pop()?.trim() ?? '';
                if (!selector.includes(':hover')) continue;
                const base = selector.replace(/:hover\b.*$/, '').trim();
                if (LIFT_ALLOWED.has(base)) continue;
                offenders.push(`${where}  ${selector}`);
            }
        }

        expect(
            offenders,
            `These hover rules translate an element. The site's hover signal is the\n` +
            `border turning gold; lifting is a second, different signal, and a\n` +
            `component that does both is inconsistent with one that does either.\n` +
            `Remove the transform, or add the selector to LIFT_ALLOWED with a reason:\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });

    it('no font weight outside the variable font range', () => {
        // IBM Plex Sans is served as a variable font declaring 100 700. A
        // font-weight of 800 is clamped to 700 while the CSS still claims
        // otherwise, so the declaration and the rendering quietly disagree. This
        // shipped on the hero name and is still on the 404 code.
        const MAX = 700;
        const offenders: string[] = [];

        for (const file of ALL_FILES) {
            const src = stripComments(fs.readFileSync(file, 'utf-8'));
            const where = path.relative(ROOT, file);

            for (const m of src.matchAll(/font-weight\s*:\s*(\d{3})/gi)) {
                const weight = Number(m[1]);
                if (weight <= MAX) continue;
                offenders.push(`${where}  font-weight: ${weight}`);
            }
        }

        expect(
            offenders,
            `The self-hosted variable font declares 100-${MAX}. A weight above that is\n` +
            `clamped by the browser while the CSS still claims it, so the rule and the\n` +
            `rendering disagree with nothing in the console to say so:\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });

    it('no hover rule sets a background and nothing else', () => {
        // "Never signal hover with a background change alone." A surface shift is
        // the weakest channel available and it lowers the contrast of whatever
        // sits on the surface: the theme toggle went from 16.44 to 14.11 in light
        // and 8.31 to 6.08 in dark.
        //
        // The check is deliberately narrow — the rule has to contain a background
        // declaration, because a hover that sets only `color` is not the problem.
        // A version of this that flagged every hover rule without a `color` in it
        // reported ThemeSwitch's gold hover, which is exactly the rule the change
        // was meant to produce.
        const offenders: string[] = [];

        for (const file of ALL_FILES) {
            const src = stripComments(fs.readFileSync(file, 'utf-8'));
            const where = path.relative(ROOT, file);

            for (const m of src.matchAll(
                /([^{}]+)\{([^{}]*(?:^|[;{])\s*background[a-z-]*\s*:[^{}]*)\}/gim,
            )) {
                const selector = m[1].trim().split('\n').pop()?.trim() ?? '';
                if (!selector.includes(':hover')) continue;
                const body = m[2];
                const movesColour =
                    /(?:^|[;{\s])(?:color|border-color|border-[a-z]+-color)\s*:/i.test(body);
                if (movesColour) continue;
                offenders.push(`${where}  ${selector}`);
            }
        }

        expect(
            offenders,
            `These hover rules change only a background. That lowers the contrast of\n` +
            `whatever sits on the surface and is a weaker signal than a colour change;\n` +
            `the site's convention is the border turning gold:\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });

    it('translations go through t(), not inline ternaries', () => {
        // "Inline `lang === 'es' ? … : …` survives a locale switch and ships
        // Spanish to English readers." AboutSection held three of them.
        //
        // A BCP 47 tag is not a translation and is allowed: `'es-CR'` versus
        // `'en-US'` picks a language *region* for `Intl` and for the html lang
        // attribute, and there is nothing to translate in it. The first version of
        // this test tried to allow that with a pattern on the value and reported
        // three locale-code ternaries as prose — the check belongs on the shape of
        // the value, not on what the ternary selects.
        const isLanguageTag = (s: string) => /^[a-z]{2,3}-[A-Za-z]{2,4}$/.test(s);
        const offenders: string[] = [];

        for (const file of walk(path.join(ROOT, 'src'), ['.astro'])) {
            const src = fs.readFileSync(file, 'utf-8');
            const where = path.relative(ROOT, file);
            const withoutComments = src.replace(/\/\*[\s\S]*?\*\//g, ' ');

            for (const m of withoutComments.matchAll(
                /(?:lang|locale)\s*===\s*'es'\s*\?\s*'([^']*)'\s*:\s*'([^']*)'/g,
            )) {
                const [, es, en] = m;
                if (isLanguageTag(es) && isLanguageTag(en)) continue;
                offenders.push(`${where}  '${es}' | '${en}'`);
            }
        }

        expect(
            offenders,
            `These strings are chosen with a locale ternary, so they live in the\n` +
            `component instead of i18n/locales and a translator cannot find them.\n` +
            `A BCP 47 tag like 'es-CR' is fine — it selects a region, not prose — but\n` +
            `anything a reader sees belongs in t():\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });

    it('the person is described in one place', () => {
        // "Person identity lives in src/data/about.ts only." A literal name in
        // a component is a duplicate source even in a meta tag, and BaseLayout
        // had three: the default title, the default description and og:site_name.
        const src = fs.readFileSync(
            path.join(ROOT, 'src', 'data', 'about.ts'),
            'utf-8',
        );
        // The file uses double quotes for that field, and a single-quoted pattern
        // found nothing and threw — a guard that cannot read its own subject.
        const name = src.match(/name\s*:\s*["']([^"']+)["']/)?.[1];
        if (!name) throw new Error('no name found in src/data/about.ts');

        const parts = name.split(/\s+/).filter((p) => p.length > 2);
        const offenders: string[] = [];

        for (const file of walk(path.join(ROOT, 'src'), ['.astro', '.ts'])) {
            if (path.basename(file) === 'about.ts') continue;
            const text = stripComments(fs.readFileSync(file, 'utf-8'));
            const where = path.relative(ROOT, file);
            for (const part of parts) {
                if (text.includes(part)) {
                    offenders.push(`${where}  contains "${part}"`);
                }
            }
        }

        expect(
            offenders,
            `The name is "${name}" in src/data/about.ts. These files repeat part of\n` +
            `it, which means renaming the person needs editing every one of them:\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });

    it('a surface that white text sits on is dark in both themes', () => {
        /*
         * `--accent-surface` carried #E3C770 in dark and nobody measured it: the
         * theme file never set it, so it inherited the value from 00-tokens.css.
         * Every primary button on that theme put white on light gold at 1.66:1
         * against 4.5:1 for text, and the 404's button was hard to read. The rule
         * existed — AGENTS.md has said "must stay dark in both themes" since the
         * first design block, for exactly this reason — but prose is not a check.
         *
         * Three components hardcode `color: #fff` on this token, so the token has
         * to hold under white text rather than merely look like the accent.
         * Lightness, not hue: in dark it is the same gold family as
         * `--accent-text`, and deliberately NOT var() of it, because white sits on
         * one and not the other.
         */
        const AA_TEXT = 4.5;

        const luminance = (hex: string): number => {
            const m = hex.replace('#', '').match(/.{2}/g);
            if (!m || m.length < 3) throw new Error(`not a hex colour: ${hex}`);
            const [r, g, b] = m.map((p) => parseInt(p, 16) / 255);
            const lin = (c: number) =>
                c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
            return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
        };
        const contrast = (a: string, b: string) => {
            const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
            return (hi + 0.05) / (lo + 0.05);
        };

        const THEME_DIR = path.join(ROOT, 'public', 'styles', 'themes');
        const read = (file: string) =>
            stripComments(fs.readFileSync(path.join(THEME_DIR, file), 'utf-8'));

        const offenders: string[] = [];

        for (const file of ['light.css', 'dark.css']) {
            const src = read(file);
            const declared = src.match(/--accent-surface\s*:\s*([^;]+);/i);
            if (!declared) {
                offenders.push(
                    `${file} does not set --accent-surface, so it inherits whatever ` +
                    `00-tokens.css holds — and the two were written for different jobs`,
                );
                continue;
            }
            // Follow one level of var() so an alias is checked, not skipped.
            let value = declared[1].trim();
            const alias = value.match(/^var\(\s*(--[a-z0-9-]+)/i);
            if (alias) {
                const target = alias[1];
                const targetValue = src.match(
                    new RegExp(`${target}\\s*:\\s*(#[0-9a-f]{3,8})`, 'i'),
                );
                if (!targetValue) {
                    offenders.push(
                        `${file}: --accent-surface is ${value}, which does not resolve here`,
                    );
                    continue;
                }
                value = targetValue[1];
            }
            if (!/^#[0-9a-f]{3,8}$/i.test(value)) continue;

            const ratio = contrast('#FFFFFF', value);
            if (ratio < AA_TEXT) {
                offenders.push(
                    `${file}: --accent-surface is ${value}, which gives white text ` +
                    `${ratio.toFixed(2)}:1 — below ${AA_TEXT}:1`,
                );
            }
        }

        expect(
            offenders,
            `These themes put white text on --accent-surface without enough contrast.\n` +
            `Three components hardcode color: #fff on it, so the fill has to hold under\n` +
            `white rather than merely look like the accent:\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });
});
