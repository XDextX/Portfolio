import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Three rules AGENTS.md states and nothing checked. All three were held in place
 * by a comment explaining their absence, so a naive scan fails on the first run
 * by reading the note that explains the rule. Comments come off first.
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

const TEMPLATE_FILES = [
    ...walk(path.join(ROOT, 'src', 'components'), ['.astro']),
    ...walk(path.join(ROOT, 'src', 'pages'), ['.astro']),
    ...walk(path.join(ROOT, 'src', 'layouts'), ['.astro']),
];

/** Source with CSS and JS comments blanked, so a note is not read as code. */
const code = (file: string) =>
    fs
        .readFileSync(file, 'utf-8')
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/^\s*\/\/.*$/gm, ' ');

/** Every `<script …>` opening tag, with the file it came from. */
function scriptTags(): { where: string; tag: string; file: string }[] {
    return TEMPLATE_FILES.flatMap((file) =>
        [...code(file).matchAll(/<script\b[^>]*>/g)].map((m) => {
            const rel = path.relative(ROOT, file).split(path.sep).join('/');
            return { file: rel, where: rel, tag: m[0] };
        }),
    );
}

/** The body of the first `<script>` in a file, or '' when there is none. */
function scriptBody(file: string): string {
    const m = code(path.join(ROOT, file)).match(/<script\b[^>]*>([\s\S]*?)<\/script>/);
    return m ? m[1] : '';
}

const JSON_LD = (tag: string) => /application\/ld\+json/.test(tag);

describe('the scanner reads the code', () => {
    it('sees known-present constructs once comments are stripped', () => {
        // If this fails, every rule below is passing because the scan reads
        // nothing at all — which looks exactly like a clean run.
        const all = TEMPLATE_FILES.map(code).join('\n');

        expect(TEMPLATE_FILES.length).toBeGreaterThan(0);
        expect(all).toContain('set:html');
        expect(scriptTags().length).toBeGreaterThan(0);
    });

    it('finds the notes that explain two of the rules, and excludes them', () => {
        // Both rules are held in place by a comment naming the forbidden thing.
        // If stripping ever stops working, these become violations.
        const raw = TEMPLATE_FILES.map((f) => fs.readFileSync(f, 'utf-8')).join('\n');
        const stripped = TEMPLATE_FILES.map(code).join('\n');

        expect(raw).toMatch(/itemscope/);
        expect(raw).toMatch(/childNodes/);
        expect(stripped).not.toMatch(/itemscope/);
        expect(stripped).not.toMatch(/childNodes/);
    });
});

describe('JSON-LD', () => {
    it('every ld+json block is written with set:html', () => {
        // `is:inline` disables expression evaluation, so the older pattern
        // shipped the literal text `{JSON.stringify(personJsonLd)}` to crawlers.
        const offenders = scriptTags()
            .filter(({ tag }) => JSON_LD(tag) && !/set:html/.test(tag))
            .map(({ where, tag }) => `${where}  ${tag}`);

        expect(
            offenders,
            `These ld+json blocks do not use set:html. With is:inline the\n` +
            `expression is not evaluated and the response carries the literal\n` +
            `source instead of the data:\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });

    it('no ld+json block is marked is:inline', () => {
        // The original bug, in the shape it actually had. Kept separate from the
        // allowlist below so the failure names the real cause.
        const offenders = scriptTags()
            .filter(({ tag }) => JSON_LD(tag) && /\bis:inline\b/.test(tag))
            .map(({ where, tag }) => `${where}  ${tag}`);

        expect(
            offenders,
            `is:inline does not evaluate expressions, so an ld+json block marked\n` +
            `that way ships \`{JSON.stringify(...)}\` as literal text:\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });
});

/**
 * The anti-FOUC theme script is the one script that must be `is:inline`: a
 * bundled module runs after the first paint, the flash it prevents. This started
 * narrower, checking only the opening tag. An allowlist needs no parsing.
 */describe('is:inline has exactly one legitimate use', () => {
    const ALLOWED = new Set(['src/layouts/BaseLayout.astro']);

    it('appears only on the anti-FOUC theme script', () => {
        const offenders = scriptTags()
            .filter(({ tag, file }) => /\bis:inline\b/.test(tag) && !ALLOWED.has(file))
            .map(({ where, tag }) => `${where}  ${tag}`);

        expect(
            offenders,
            `is:inline does not run on view transitions, so a client script\n` +
            `marked that way is dead after the first navigation. The anti-FOUC\n` +
            `theme script in BaseLayout is the one legitimate use:\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });

    it('and that script stays free of Astro expressions', () => {
        // A bare { cannot be told apart from a JS block, so the allowed script is
        // checked for one directly rather than guessed at.
        for (const file of ALLOWED) {
            expect(scriptBody(file), `${file} must stay plain JS`).not.toMatch(/[{}]/);
        }
    });

    it('finds the allowed script, so the allowlist is not vacuous', () => {
        const inline = scriptTags().filter(({ tag }) => /\bis:inline\b/.test(tag));
        expect(inline.length).toBeGreaterThan(0);
        expect(inline.every(({ file }) => ALLOWED.has(file))).toBe(true);
    });
});

describe('one entity, one format', () => {
    it('no microdata itemscope anywhere', () => {
        // AboutSection owns the Person JSON-LD. An itemscope wrapper for the same
        // person reads to a crawler as two conflicting entities.
        const offenders = TEMPLATE_FILES.filter((f) => /\bitemscope\b/.test(code(f))).map(
            (f) => path.relative(ROOT, f),
        );

        expect(
            offenders,
            `itemscope and JSON-LD for the same entity on one page reads as two\n` +
            `entities. AboutSection owns the Person JSON-LD:\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });
});

describe('no positional DOM access', () => {
    it('nothing reaches into childNodes', () => {
        // `toggle.childNodes[0].textContent = …` breaks the moment someone adds
        // whitespace or wraps the text. The toggle carries both labels in the DOM
        // and CSS reveals one, so no script has to rewrite text at all.
        const offenders = TEMPLATE_FILES.filter((f) => /\bchildNodes\b/.test(code(f))).map(
            (f) => path.relative(ROOT, f),
        );

        expect(
            offenders,
            `Indexing childNodes to swap a label breaks on whitespace. Give the\n` +
            `label its own element and target that:\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });
});
