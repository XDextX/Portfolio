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
 */
function markupComments(file: string): { line: number; body: string }[] {
    const body = markupRegions(file)
        .map((r) => r.text)
        .join('\n');
    const out: { line: number; body: string }[] = [];
    const re = /<!--([\s\S]*?)-->/g;
    let m: RegExpExecArray | null;

    while ((m = re.exec(body)) !== null) {
        out.push({ line: body.slice(0, m.index).split('\n').length, body: m[1].trim() });
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

    it('no HTML comment in the template is a prose note', () => {
        // Short labels such as <!-- Header --> are fine and intentional.
        // Anything long is a note that leaked from the source. The whole
        // comment is measured, not its first line: a wrapped note keeps the
        // opening line short and passes a per-line check while shipping the
        // rest of itself to every visitor.
        const offenders: string[] = [];

        for (const file of ASTRO_FILES) {
            for (const { line, body } of markupComments(file)) {
                if (body.length > 90) {
                    offenders.push(
                        `${path.relative(ROOT, file)}:${line}  ${body.length} chars  ${body.slice(0, 60)}`,
                    );
                }
            }
        }

        expect(
            offenders,
            `These HTML comments in the template are long enough to be notes\n` +
            `rather than labels, and they ship to every visitor:\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });
});
