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
/** The bars-view row component: the one file RF-5 and RF-7 are mounted on. */
const SKILL_BAR = path.join(ROOT, 'src', 'components', 'SkillBar.astro');

/** The row's `<style>` block, comments already stripped by `code()`. */
function styleBlock(file: string): string {
    const block = code(file).match(/<style>([\s\S]*?)<\/style>/);
    if (!block) throw new Error(`${path.relative(ROOT, file)} has no <style> block`);
    return block[1];
}

/**
 * Every CSS rule as { selector, body }, in source order. A `@media` wrapper is
 * not returned; its inner rules are, which is what a rule-level assertion wants.
 */
function cssRules(src: string): { selector: string; body: string }[] {
    return [...src.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
        selector: m[1].trim(),
        body: m[2].trim(),
    }));
}

/** The row's markup: icon, name over track, level badge. */
function rowMarkup(): string {
    return code(SKILL_BAR).match(/<li class=['"]bar-row['"][\s\S]*?<\/li>/)?.[0] ?? '';
}

/**
 * A rule head can list several selectors, and only one of them has to be the
 * offender, so they are checked one at a time. The comma is only a separator
 * outside parentheses.
 */
function selectorList(head: string): string[] {
    return head
        .split(/,(?![^()]*\))/)
        .map((s) => s.trim())
        .filter(Boolean);
}

/** The hovered element has to be the row itself, not something inside it. */
const ROW_HOVER = /^\.bar-row(?:[.:][\w-]+)*$/;

/**
 * '' when every element the selector can match sits inside the one row the
 * pointer is over, and why not when it does not. `+` or `~` after the hovered
 * compound is the failure mode: `.bar-row:hover + .bar-row img` lights the next.
 */
function outOfRowScope(selector: string): string {
    const tokens = selector.trim().split(/\s*(>|\+|~)\s*|\s+/).filter(Boolean);
    const hovered = tokens.findIndex((t) => t.includes(':hover'));
    if (hovered === -1) return 'brand colour is not behind a :hover';
    if (!ROW_HOVER.test(tokens[hovered])) return `the :hover is not on the row but on ${tokens[hovered]}`;
    const sibling = tokens.slice(hovered + 1).find((t) => t === '+' || t === '~');
    return sibling
        ? `it steps \`${sibling}\` to a row nobody is hovering, so the brand colour lands there`
        : '';
}

describe('the bars-view icon', () => {
    it('mounts monochrome and reaches brand colour only on the row hover', () => {
        /*
         * RF-5. The default is the monochrome mount, and the brand colour is
         * reachable only from the row's own `:hover`: checking the first alone
         * would pass on a component whose default is the brand logo.
         */
        const offenders: string[] = [];
        const css = styleBlock(SKILL_BAR);
        const row = rowMarkup();
        const all = cssRules(css);

        if (!row) offenders.push('the bars-view row markup is gone');

        // The at-rest mount: one colour, shaped by the logo's own alpha. The
        // mask lives on a pseudo because it does not clip the replaced element
        // it sits on — the brand pixels keep painting on top of it.
        const atRest = all.filter(
            (r) => /\.bar-logo::before/.test(r.selector) && !r.selector.includes(':hover'),
        );
        if (atRest.length !== 1) {
            offenders.push(
                `expected one at-rest .bar-logo::before rule, found ${atRest.length}`,
            );
        } else {
            const { body } = atRest[0];
            if (!/background-color\s*:/i.test(body)) {
                offenders.push('the at-rest layer paints no colour of its own');
            }
            if (!/var\(\s*--logo\s*\)/.test(body)) {
                offenders.push('the at-rest layer does not read var(--logo)');
            }
            if (!/(-webkit-)?mask(-image)?\s*:/i.test(body)) {
                offenders.push('the at-rest layer is not clipped, so it paints a plate');
            }
            if (/mask[^:]*:\s*none/i.test(body)) {
                offenders.push('the at-rest layer drops its mask, so brand pixels paint');
            }
        }

        // The CSS only says what reads `--logo`. The row is what supplies it, from
        // its own prop: without the mount the mask resolves to nothing and the
        // at-rest layer paints a flat plate, with nothing in the console.
        const mount = row.match(/style=\{`([^`]*--logo[^`]*)`\}/)?.[1] ?? '';
        if (!mount) {
            offenders.push('no markup in the row mounts --logo, so the mask reads nothing');
        } else if (!/--logo\s*:\s*url\(\s*["']?\$\{\s*logo\s*\}["']?\s*\)/.test(mount)) {
            offenders.push(`--logo is not the row own logo — ${mount.trim()}`);
        }
        if (!/const\s*\{[^}]*\blogo\b[^}]*\}\s*=\s*Astro\.props/.test(code(SKILL_BAR))) {
            offenders.push('the row takes no `logo` prop, so --logo cannot be per-row data');
        }

        // The brand presentation: exists, and only from the row's :hover.
        const brand = all.filter(
            (r) =>
                /(?:^|[\s;])opacity\s*:\s*1\s*;/i.test(r.body) ||
                /mask[^:]*:\s*none/i.test(r.body),
        );
        if (brand.length === 0) {
            offenders.push('nothing reveals the brand logo, so the hover has no second state');
        }
        for (const { selector } of brand) {
            for (const one of selectorList(selector)) {
                const why = outOfRowScope(one);
                if (why) offenders.push(`${why} — ${one}`);
            }
        }

        const hiddenAtRest = all.some(
            (r) =>
                !r.selector.includes(':hover') &&
                /img/.test(r.selector) &&
                /(?:^|[\s;])(?:opacity\s*:\s*0\s*;|visibility\s*:\s*hidden)/i.test(r.body),
        );
        if (!hiddenAtRest) offenders.push('the default mount leaves the brand logo painted');

        // The row is not a control: nothing focusable reaches the brand colour,
        // and the icon's decorative name says which tech it is anyway.
        if (/:focus/.test(css)) {
            offenders.push('the icon has a focus state; the row is not a control');
        }
        if (/tabindex/i.test(row)) {
            offenders.push('the row is focusable; the brand colour is a decoration');
        }
        if (/<script\b/i.test(code(SKILL_BAR))) {
            offenders.push('a script here would be a second path to the brand state');
        }

        // Owner, 2026-10-11: the hover paints nothing and lifts nothing. The row
        // had grown a transparent border to turn gold; it was dropped, and the
        // icon's colour is the only thing this section's hover changes.
        for (const { selector, body } of all.filter((r) => r.selector.includes(':hover'))) {
            if (/(?:^|[\s;{])(?:border|background|outline)[a-z-]*\s*:/i.test(body)) {
                offenders.push(`the hover paints or re-shapes the row — ${selector}`);
            }
            if (/(?:^|[\s;{])transform\s*:/i.test(body)) {
                offenders.push(`the hover lifts — ${selector}`);
            }
        }

        // The NFR is conditional: animated, then disabled under reduced motion.
        const moving = all.filter(
            (r) => /bar-logo/.test(r.selector) && /(?:^|[\s;])(?:transition|animation)\s*:/i.test(r.body),
        );
        const stilled = all.some(
            (r) =>
                /bar-logo/.test(r.selector) &&
                /(?:^|[\s;])(?:transition|animation)\s*:\s*none/i.test(r.body),
        );
        if (moving.length > 0 && !stilled) {
            offenders.push('the icon animates with no prefers-reduced-motion override');
        }

        expect(
            offenders,
            `The bars-view icon is not the mount RF-5 describes: monochrome by\n` +
            `default in one colour per theme, the logo's own colours only while the\n` +
            `pointer is over its row, and a hover that paints and lifts nothing.\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });

    it('reserves the 22px slot and treats the icon as decorative', () => {
        /*
         * RF-7. The slot is held by the wrapper's box rather than by the logo
         * arriving, and the icon carries no meaning of its own, so a URL that
         * 404s leaves the name, the bar and the badge where they were.
         */
        const offenders: string[] = [];
        const css = styleBlock(SKILL_BAR);
        const row = rowMarkup();
        if (!row) offenders.push('the bars-view row markup is gone');

        const img = row.match(/<img\b[^>]*>/)?.[0] ?? '';
        if (!img) {
            offenders.push('the row renders no icon element');
        } else {
            if (!/\balt=['"]['"]/.test(img)) {
                offenders.push(`the icon is not decorative-empty — ${img}`);
            }
            if (!/\bwidth=['"]22['"]/.test(img) || !/\bheight=['"]22['"]/.test(img)) {
                offenders.push(`the icon does not declare its 22px size — ${img}`);
            }
        }

        const slot = cssRules(css).filter((r) => /^\.bar-logo(\s|$)/.test(r.selector));
        if (!slot.some((r) => /\bwidth\s*:\s*22px/i.test(r.body) && /\bheight\s*:\s*22px/i.test(r.body))) {
            offenders.push('no rule reserves a 22px box for the icon');
        }
        for (const { selector, body } of slot) {
            if (/background[a-z-]*\s*:/i.test(body)) {
                offenders.push(`the icon slot paints a surface — ${selector}`);
            }
        }

        expect(
            offenders,
            `A logo that never loads must leave the row exactly as it was: the\n` +
            `reserved 22px slot, and an icon that carries no meaning to read.\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });
});