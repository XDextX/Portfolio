import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * An implementation note written *inside* an Astro template is not a comment:
 * Astro emits it verbatim, so it ships to every visitor. Inside a template only
 * a brace comment is treated as one; better, put the note in the frontmatter.
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

const CODE_FILES = [
    ...walk(path.join(ROOT, 'src'), ['.astro', '.ts']),
    ...walk(path.join(ROOT, 'tests'), ['.ts']),
    ...walk(path.join(ROOT, 'public', 'styles'), ['.css']),
];

const MAX_COMMENT_LINES = 5;

/**
 * Comment blocks longer than MAX_COMMENT_LINES, as { line, n, kind }. Lines are
 * 1-based against the whole file. A block marks its own lines covered so the run
 * below cannot double-report, and reads raw text, so its labels avoid openers.
 */
function longCommentBlocks(src: string): { line: number; n: number; kind: string }[] {
    const out: { line: number; n: number; kind: string }[] = [];
    const lines = src.split(/\r?\n/);
    const covered = new Set<number>();

    for (const m of src.matchAll(/\/\*[\s\S]*?\*\//g)) {
        const start = src.slice(0, m.index).split(/\r?\n/).length;
        const n = m[0].split(/\r?\n/).length;
        for (let i = start; i < start + n; i++) covered.add(i);
        if (n > MAX_COMMENT_LINES) out.push({ line: start, n, kind: 'block' });
    }

    let run = 0;
    let start = 0;
    const flush = () => {
        if (run > MAX_COMMENT_LINES) out.push({ line: start, n: run, kind: 'lines' });
        run = 0;
    };
    lines.forEach((text, i) => {
        if (covered.has(i + 1)) return flush();
        if (/^\s*\/\//.test(text)) {
            if (run === 0) start = i + 1;
            run++;
        } else {
            flush();
        }
    });
    flush();

    return out.sort((a, b) => a.line - b.line);
}

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
 * The markup body as one string, so a comment can be matched whole. Measuring
 * per line is the bug: a four-line note has a short first line, passes a
 * per-line check and still ships 290 characters per page.
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
         * An allowlist, not a length check. A threshold cannot tell a label from
         * a note: it passed four real notes of 47-72 characters. Enumerating them
         * is the point — `<!-- Header -->` is unremarkable, `<!-- why -->` is not.
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

describe('comments stay short', () => {
    it('no comment block runs past five lines', () => {
        const offenders: string[] = [];

        for (const file of CODE_FILES) {
            for (const h of longCommentBlocks(fs.readFileSync(file, 'utf-8'))) {
                offenders.push(
                    `${path.relative(ROOT, file)}:${h.line}  ${h.n} lines  ${h.kind}`,
                );
            }
        }

        expect(
            offenders,
            `A comment nobody reads to the end is worse than none, because it\n` +
            `looks like the subject is documented. Cut to ${MAX_COMMENT_LINES} lines:\n` +
            `keep the number that justifies the decision, drop the retelling, and\n` +
            `point at AGENTS.md when the rule already lives there:\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });

    it('the scanner detects a long block', () => {
        // The slash is split so this fixture leaves no `/*` in the file: the
        // scanner reads raw text, and a literal here made it flag its own test —
        // matching from inside the string to a `*/` twenty lines away.
        const s = '/';
        const probe = [
            s + '*', ' * one', ' * two', ' * three',
            ' * four', ' * five', ' * six', ' ' + s + '*' + '/',
        ].join('\n');

        expect(longCommentBlocks(probe)).toHaveLength(1);
        expect(longCommentBlocks(probe)[0].n).toBe(8);
    });

    it('the scanner leaves a short block alone', () => {
        const s = '/';
        const probe = [s + '/', ' one', ' two', ' three'].join('\n');
        expect(longCommentBlocks(probe)).toEqual([]);
    });

    it('scans the files it claims to', () => {
        expect(CODE_FILES.length).toBeGreaterThan(20);
    });
});
