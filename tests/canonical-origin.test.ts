import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { CANONICAL_ORIGIN } from '../src/data/site';
import config from '../astro.config.mjs';
import { stripComments } from './helpers/source';

// Spec 042: one canonical origin, written once, that every identity URL names.

describe('the single source (spec 042 RF-5)', () => {
    it('holds exactly the production origin', () => {
        expect(CANONICAL_ORIGIN).toBe('https://www.xdextx.dev');
    });

    it("is the origin Astro's own `site` declares", () => {
        expect(config.site).toBe(CANONICAL_ORIGIN);
    });
});

describe('robots.txt (spec 042 RF-3)', () => {
    it('has one Sitemap line on the canonical origin and keeps its directives', async () => {
        const { GET } = await import('../src/pages/robots.txt');
        const res = await (GET as any)({});
        const lines = (await res.text()).split('\n').map((l: string) => l.trim()).filter(Boolean);
        expect(lines.filter((l: string) => l.startsWith('Sitemap:'))).toEqual([`Sitemap: ${CANONICAL_ORIGIN}/sitemap.xml`]);
        expect(lines).toEqual(expect.arrayContaining(['User-agent: *', 'Allow: /', 'Disallow: /api/']));
        expect(lines.indexOf('User-agent: *'), 'the directives sit under the user agent').toBe(0);
    });
});

describe('JSON-LD (spec 042 RF-4)', () => {
    it("names the canonical origin as the person's url", async () => {
        const { JsonLdAbout } = await import('../src/data/about');
        expect(JsonLdAbout.url).toBe(CANONICAL_ORIGIN);
    });
});

// ── The scan: a second copy of the host is what this spec removes ──

const ROOT = process.cwd();
const OLD_HOST = 'portfolio-dext.vercel.app';
const TEXT = /\.(ts|mjs|js|astro|css|json|md|txt|html|xml|svg)$/;

/** Every text file under the given directories, as repo-relative paths. */
function textFiles(dirs: string[]): string[] {
    const out: string[] = [];
    const walk = (dir: string) => {
        for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
            const rel = path.join(dir, e.name);
            if (e.isDirectory()) walk(rel);
            else if (TEXT.test(e.name)) out.push(rel.split(path.sep).join('/'));
        }
    };
    dirs.forEach(walk);
    return out;
}

// A source check on purpose (constitution 8): the rule is about a second copy of a datum.
describe('one source for the host (spec 042 RF-5)', () => {
    const own = 'tests/canonical-origin.test.ts';
    const read = (f: string) => stripComments(fs.readFileSync(path.join(ROOT, f), 'utf-8'));

    it('writes the canonical host in exactly one source file', () => {
        const files = [...textFiles(['src', 'public', 'scripts']), 'astro.config.mjs'];
        expect(files.filter((f) => read(f).includes(new URL(CANONICAL_ORIGIN).host))).toEqual(['src/data/site.ts']);
    });

    it('writes the old host nowhere in code, public files, tests or e2e', () => {
        const files = [...textFiles(['src', 'public', 'scripts', 'tests', 'e2e']), 'astro.config.mjs'].filter((f) => f !== own);
        expect(files.filter((f) => read(f).includes(OLD_HOST))).toEqual([]);
    });
});

describe("the README's links to the live site (spec 042 RF-6)", () => {
    const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf-8');
    // Every link target, so the badge's (an image inside the link text) is read too.
    const hrefs = [...readme.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]);

    it('names the old host nowhere', () => {
        expect(readme).not.toContain(OLD_HOST);
    });

    it('links the live site at the canonical origin, with its host as the text', () => {
        expect(readme).toContain(`**Live:** [${new URL(CANONICAL_ORIGIN).host}](${CANONICAL_ORIGIN})`);
    });

    it('has every link to the site on the canonical origin', () => {
        const site = hrefs.filter((h) => /xdextx\.dev|vercel\.app/.test(h));
        expect(site.length, 'the badge and the Live link').toBe(2);
        expect(site.filter((h) => !h.startsWith(CANONICAL_ORIGIN))).toEqual([]);
    });
});
