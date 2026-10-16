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

describe('the bars-view icon', () => {
    it('reserves the 22px slot and keeps the icon out of the accessibility tree', () => {
        // RF-7, its "decorative-alt" read with the owner on 2026-10-15 as "the
        // icon exposes no accessible name": an aria-hidden slot. Spec 012 draws an
        // <img> in it, so the no-image clause went. A URL that 404s moves nothing.
        const offenders: string[] = [];
        const css = styleBlock(SKILL_BAR);
        const row = rowMarkup();
        if (!row) offenders.push('the bars-view row markup is gone');

        const slotEl = row.match(/<span\b[^>]*\bclass=['"]bar-logo['"][^>]*>/)?.[0] ?? '';
        if (!slotEl) {
            offenders.push('the row has no .bar-logo slot element');
        } else if (!/\baria-hidden=['"]true['"]/.test(slotEl)) {
            offenders.push(`the icon slot is not aria-hidden — ${slotEl}`);
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
            `reserved 22px slot, and an icon that exposes nothing to read.\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });
});

describe('the health bar (spec 006)', () => {
    const rules = () => cssRules(styleBlock(SKILL_BAR));
    const body = (selector: string) => rules().find((r) => r.selector === selector)?.body ?? '';

    it('renders one segment per level, lit from segmentsFor', () => {
        // RF-1/RF-2, the half that data cannot reach: the row draws what
        // segmentsFor returns and types no count of its own.
        const row = rowMarkup();
        const offenders: string[] = [];
        if (!/segmentsFor\(\s*level\s*\)\.map\(/.test(row)) {
            offenders.push('the bar does not map segmentsFor(level)');
        }
        if (!/class:list=\{\[\s*['"]bar-seg['"]\s*,\s*\{\s*lit\s*\}\s*\]\}/.test(row)) {
            offenders.push('a segment does not take its lit flag from segmentsFor');
        }
        if (!/--segments\s*:\s*\$\{\s*LEVEL_SCALE\.length\s*\}/.test(row)) {
            offenders.push('the column count is not the length of LEVEL_SCALE');
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    it('frames the bar square: 2px border, padding and gap, derived radius, no pill', () => {
        // RF-5. The segment radius is the frame's minus its padding, written as
        // that relationship (AGENTS.md, radius), so a square segment is derived.
        const offenders: string[] = [];
        const track = body('.bar-track');
        const seg = body('.bar-seg');
        if (!/--bar-pad\s*:\s*2px\s*;/.test(track)) offenders.push('.bar-track sets no --bar-pad: 2px');
        if (!/(?:^|[\s;])border\s*:\s*2px\s+solid\s/.test(track)) offenders.push('.bar-track has no 2px solid border');
        if (!/padding\s*:\s*var\(\s*--bar-pad\s*\)/.test(track)) offenders.push('.bar-track padding is not var(--bar-pad)');
        if (!/(?:^|[\s;])gap\s*:\s*var\(\s*--bar-pad\s*\)/.test(track)) offenders.push('.bar-track gap is not var(--bar-pad)');
        if (!/border-radius\s*:\s*var\(\s*--radius-xs\s*\)/.test(track)) offenders.push('.bar-track radius is not --radius-xs');
        if (!/border-radius\s*:\s*calc\(\s*var\(\s*--radius-xs\s*\)\s*-\s*var\(\s*--bar-pad\s*\)\s*\)/.test(seg)) {
            offenders.push('.bar-seg radius is not calc(var(--radius-xs) - var(--bar-pad))');
        }
        for (const r of rules()) {
            if (/bar-(?:track|seg)/.test(r.selector) && /--radius-pill/.test(r.body)) {
                offenders.push(`the pill radius is back on ${r.selector}`);
            }
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    it('lights lit segments 120ms apart, 120ms each, and never animates an unlit one', () => {
        // RF-6. The delay is derived from each segment's own index, so no
        // segment carries a typed delay; an unlit segment matches no animation.
        const offenders: string[] = [];
        const animated = rules().filter(
            (r) => /bar-seg/.test(r.selector) && /(?:^|[\s;])animation\s*:(?!\s*none\b)/i.test(r.body),
        );
        if (animated.length !== 1) offenders.push(`expected one segment animation rule, found ${animated.length}`);
        for (const { selector, body: b } of animated) {
            if (!/\.lit\b/.test(selector)) offenders.push(`an unlit segment can animate — ${selector}`);
            if (!/\.bar-track\.animated\b/.test(selector)) offenders.push(`the animation is not gated on .animated — ${selector}`);
            if (!/\b120ms\b[^;]*calc\(\s*var\(\s*--i\s*\)\s*\*\s*120ms\s*\)/.test(b)) {
                offenders.push(`not 120ms long with a calc(var(--i) * 120ms) delay — ${b.trim()}`);
            }
        }
        if (!/--i\s*:\s*\$\{\s*i\s*\}/.test(rowMarkup())) offenders.push('--i is not mounted from the map index');
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    it('drops the segment animation under reduced motion', () => {
        // RF-7: lit segments are already lit, so removing the animation is all
        // reduced motion needs.
        const blocks = [...styleBlock(SKILL_BAR).matchAll(
            /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{([\s\S]*?\})\s*\}/g,
        )].map((m) => m[1]);
        expect(
            blocks.some((b) => /\.bar-seg\.lit[^{]*\{[^}]*animation\s*:\s*none/.test(b)),
            'no prefers-reduced-motion: reduce rule sets the lit segment animation to none',
        ).toBe(true);
    });

    it('paints the lit colour without the class the script adds', () => {
        // RF-8: with scripts off .animated never arrives, so the lit colour must
        // sit on a rule that does not need it.
        const atRest = rules().filter(
            (r) =>
                /\.bar-seg\.lit/.test(r.selector) &&
                !/\.animated/.test(r.selector) &&
                /background(?:-color)?\s*:\s*var\(\s*--clr\s*\)/.test(r.body),
        );
        expect(atRest.length, 'no rule paints .bar-seg.lit in var(--clr) without .animated').toBeGreaterThan(0);
    });
});

describe('the skill rows per line (spec 006 RF-9)', () => {
    it('fits two rows per line from a minimum derived from the row itself', () => {
        // RF-9: the list's minimum row width is the row's own geometry summed —
        // icon, gap, track floor, gap, badge maximum — so a change to the row
        // moves the threshold with it. auto-fill keeps a lone row at half width.
        const offenders: string[] = [];
        const bar = cssRules(styleBlock(SKILL_BAR));
        const list = cssRules(styleBlock(path.join(ROOT, 'src', 'components', 'TechGrid.astro')))
            .find((r) => r.selector === '.bars-list')?.body ?? '';

        const row = bar.find((r) => r.selector === '.bar-row')?.body ?? '';
        const cols = row.match(/grid-template-columns\s*:\s*(\S+)\s+minmax\(\s*([^,\s]+)\s*,\s*1fr\s*\)/);
        const gap = row.match(/(?:^|[\s;])gap\s*:\s*([^;\s]+)\s*;/)?.[1];
        const badge = bar.find((r) => r.selector === '.level-tag')?.body.match(/max-width\s*:\s*([^;\s]+)\s*;/)?.[1];
        if (!cols || !gap || !badge) offenders.push('the row geometry (icon, floor, gap, badge max) is not readable');

        if (!/display\s*:\s*grid/.test(list)) offenders.push('.bars-list is not a grid');
        const fill = list.match(
            /grid-template-columns\s*:\s*repeat\(\s*(auto-fill|auto-fit)\s*,\s*minmax\(\s*min\(\s*calc\(([^)]*)\)\s*,\s*100%\s*\)\s*,\s*1fr\s*\)\s*\)/,
        );
        if (!fill) {
            offenders.push('.bars-list columns are not repeat(auto-fill, minmax(min(calc(…), 100%), 1fr))');
        } else {
            if (fill[1] !== 'auto-fill') offenders.push(`${fill[1]} stretches a lone row; RF-9 keeps it at half width`);
            if (cols && gap && badge) {
                const terms = fill[2].split('+').map((t) => t.trim()).sort();
                const expected = [cols[1], gap, cols[2], gap, badge].sort();
                if (JSON.stringify(terms) !== JSON.stringify(expected)) {
                    offenders.push(`the minimum is calc(${fill[2].trim()}), not the row's ${expected.join(' + ')}`);
                }
            }
        }

        expect(
            offenders,
            `Two rows share a line only when both keep the row's own minimum:\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });
});

describe('the area cards per line (spec 006 RF-10)', () => {
    it('fits as many area cards as hold one minimum row with their own padding and border', () => {
        // RF-10: a card's minimum is RF-9's row minimum plus .card-frame's padding
        // and border, summed, so changing the row or the card frame moves the
        // threshold with it instead of leaving a stale number behind.
        const offenders: string[] = [];
        const bar = cssRules(styleBlock(SKILL_BAR));
        const grid = cssRules(styleBlock(path.join(ROOT, 'src', 'components', 'TechGrid.astro')))
            .find((r) => r.selector === '.bars-grid')?.body ?? '';
        const frame = cssRules(
            fs.readFileSync(path.join(ROOT, 'public', 'styles', '03-components.css'), 'utf-8')
                .replace(/\/\*[\s\S]*?\*\//g, ' '),
        ).find((r) => r.selector === '.card-frame')?.body ?? '';

        const row = bar.find((r) => r.selector === '.bar-row')?.body ?? '';
        const cols = row.match(/grid-template-columns\s*:\s*(\S+)\s+minmax\(\s*([^,\s]+)\s*,\s*1fr\s*\)/);
        const gap = row.match(/(?:^|[\s;])gap\s*:\s*([^;\s]+)\s*;/)?.[1];
        const badge = bar.find((r) => r.selector === '.level-tag')?.body.match(/max-width\s*:\s*([^;\s]+)\s*;/)?.[1];
        const pad = frame.match(/(?:^|[\s;])padding\s*:\s*([^;\s]+)\s*;/)?.[1];
        const border = frame.match(/(?:^|[\s;])border\s*:\s*(\d+(?:\.\d+)?px)\s/)?.[1];
        if (!cols || !gap || !badge) offenders.push('the row geometry (icon, floor, gap, badge max) is not readable');
        if (!pad || !border) offenders.push('.card-frame padding or border width is not readable as one value');

        const fit = grid.match(
            /grid-template-columns\s*:\s*repeat\(\s*(auto-fit|auto-fill)\s*,\s*minmax\(\s*min\(\s*calc\(([^)]*)\)\s*,\s*100%\s*\)\s*,\s*1fr\s*\)\s*\)/,
        );
        if (!fit) {
            offenders.push('.bars-grid columns are not repeat(auto-fit, minmax(min(calc(…), 100%), 1fr))');
        } else if (fit[1] !== 'auto-fit') {
            offenders.push(`.bars-grid uses ${fit[1]}; RF-10 is auto-fit`);
        } else if (cols && gap && badge && pad && border) {
            const terms = fit[2].split('+').map((t) => t.trim()).sort();
            const expected = [cols[1], gap, cols[2], gap, badge, pad, pad, border, border].sort();
            if (JSON.stringify(terms) !== JSON.stringify(expected)) {
                offenders.push(`the card minimum is calc(${fit[2].trim()}), not ${expected.join(' + ')}`);
            }
        }

        expect(
            offenders,
            `Area cards share a line only when each still holds one minimum row:\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });
});