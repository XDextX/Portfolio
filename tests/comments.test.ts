import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * An implementation note written *inside* an Astro template is not a comment:
 * Astro emits it verbatim into the HTML response, so it ships to every visitor
 * and shows up in "view source" and DevTools. A `//` line in the template body
 * becomes a stray HTML comment; the note has to live in the frontmatter.
 *
 * Inside a template, a JSX-style brace comment is the only syntax Astro treats
 * as a real comment; a plain HTML comment always ships. Far better: put the note
 * in the frontmatter, where it never leaves the build.
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

const ASTRO_FILES = [
    ...walk(path.join(ROOT, 'src', 'components'), ['.astro']),
    ...walk(path.join(ROOT, 'src', 'pages'), ['.astro']),
    ...walk(path.join(ROOT, 'src', 'layouts'), ['.astro']),
];

type Region = { line: number; text: string };

/** The markup region of a file: outside frontmatter, <script> and <style>. */
function markupRegions(file: string): Region[] {
    const lines = fs.readFileSync(file, 'utf-8').split(/\r?\n/);
    const out: Region[] = [];

    let inFrontmatter = false;
    let fenceSeen = false;
    let skipUntil = '';

    lines.forEach((raw, i) => {
        const text = raw.trim();

        if (i === 0 && text === '---') {
            inFrontmatter = true;
            return;
        }
        if (inFrontmatter) {
            if (text === '---') inFrontmatter = false;
            return;
        }

        if (skipUntil) {
            if (text === skipUntil) skipUntil = '';
            return;
        }
        // A self-closing <script ... /> or <style ... /> opens and closes on one
        // line. Treating it as an opening tag without a matching close drops
        // every following line from the analysis, which silently hides whatever
        // comes after it — the JSON-LD block in AboutSection did exactly that,
        // and a 34-character probe note placed under it went unnoticed.
        if (/^<(script|style)\b[^>]*\/>/.test(text)) return;
        if (text.startsWith('<script')) {
            skipUntil = '</script>';
            return;
        }
        if (text.startsWith('<style')) {
            skipUntil = '</style>';
            return;
        }

        out.push({ line: i + 1, text });
    });

    return out;
}

/**
 * The markup body as one string, so a comment can be matched whole.
 *
 * Measuring per line is the bug this guards against: a four-line note has a
 * short first line, passes a per-line length check, and still ships 290
 * characters to every visitor. Every occurrence of the block comment gets its
 * own entry, because one note inside a repeated component renders many times.
 *
 * The reported line is relative to the start of the markup region, not the
 * file, because regions are collected and joined. An absolute number would be
 * wrong and quietly so; treat it as "this far into the markup".
 */
function markupComments(file: string): { line: number; body: string }[] {
    const regions = markupRegions(file);
    const body = regions.map((r) => r.text).join('\n');
    const out: { line: number; body: string }[] = [];
    const re = /<!--([\s\S]*?)-->/g;
    let m: RegExpExecArray | null;

    while ((m = re.exec(body)) !== null) {
        // Walk the region list rather than counting newlines in the joined
        // string, so the offset maps to a real source line.
        const offset = body.slice(0, m.index).split('\n').length - 1;
        out.push({
            line: regions[offset]?.line ?? offset,
            body: m[1].trim(),
        });
    }

    return out;
}

describe('comments never leak into the markup', () => {
    it('no // line comment sits in the template body', () => {
        const offenders: string[] = [];

        for (const file of ASTRO_FILES) {
            for (const { line, text } of markupRegions(file)) {
                if (text.startsWith('//')) {
                    offenders.push(
                        `${path.relative(ROOT, file)}:${line}  ${text.slice(0, 72)}`,
                    );
                }
            }
        }

        expect(
            offenders,
            `These // comments are in the template, so Astro emits them as HTML\n` +
            `comments in the response. Move them into the frontmatter:\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });

    it('every HTML comment in the template is a known short label', () => {
        /*
         * An allowlist, not a length check.
         *
         * A length threshold cannot tell a label from a note: it passed four
         * real notes of 47-72 characters while looking like it worked, because
         * they were shorter than the limit. It also cannot tell a note from a
         * label, which is the only thing that matters here — a note is prose
         * addressed to whoever opens view-source, and no visitor should read it.
         *
         * So the permitted comments are enumerated. A new one has to be added
         * deliberately, which is the point: adding `<!-- Header -->` is
         * unremarkable, adding `<!-- why this is here -->` should be a decision
         * someone makes on purpose rather than something they trip into.
         */
        const ALLOWED = new Set([
            // BaseLayout: one per page, and they orient a reader of <head>.
            'Open Graph',
            'Twitter / X',
            'hreflang',
            'Preconnect',
            // ProjectCard and ContactCard: structural markers inside a card.
            'Header',
            'Description',
            'Topics',
            'Footer',
            'Icon',
            'Info',
            'Actions',
            'External / arrow icon',
            'Copy icon',
            // AboutSection and TechGrid: one of each per page.
            'Content',
            'BARS',
            'LIST',
        ]);

        const offenders: string[] = [];

        for (const file of ASTRO_FILES) {
            for (const { line, body } of markupComments(file)) {
                if (!ALLOWED.has(body)) {
                    offenders.push(
                        `${path.relative(ROOT, file)}:${line}  ${body.length} chars  ${body.slice(0, 60)}`,
                    );
                }
            }
        }

        expect(
            offenders,
            `These HTML comments are not on the allowlist, so they are notes\n` +
            `that reach every visitor. Move them into the frontmatter, or add the\n` +
            `label to ALLOWED if it really is a label:\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });
});
