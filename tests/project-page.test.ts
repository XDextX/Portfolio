import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ProjectPage from '../src/pages/proyectos/[name].astro';
import { setLocale, t } from '@i18n/index';
import { buildRepo, mockTextResponse } from './helpers/github-mocks';
import { clearGitHubCache } from '../src/pages/lib/github';

// Spec 044: the project page rendered through the Container with GitHub stubbed.

const LOCALES = ['es', 'en'] as const;
let container: Awaited<ReturnType<typeof AstroContainer.create>>;
beforeAll(async () => { container = await AstroContainer.create(); });
afterEach(() => vi.unstubAllGlobals());

/** The page for `fixture`, with the README GitHub answers (404 when null). */
async function page(locale: 'es' | 'en', repo: object = {}, readme: string | null = null) {
    const r = buildRepo({ name: 'fixture', ...repo } as any);
    vi.stubGlobal('fetch', async (url: string) => {
        const u = String(url);
        if (/\/repos\/[^/]+\/fixture$/.test(u)) return mockTextResponse(JSON.stringify(r));
        if (/readme/.test(u) && readme !== null) return mockTextResponse(readme);
        return mockTextResponse('', 404);
    });
    clearGitHubCache();
    setLocale(locale);
    const html = await container.renderToString(ProjectPage, { params: { name: 'fixture' }, request: new Request(`https://example.test/proyectos/fixture?lang=${locale}`) });
    vi.unstubAllGlobals();
    return html;
}

const header = (html: string) => html.match(/<header class="page-header"[\s\S]*?<\/header>/)?.[0] ?? '';
const strip = (s: string) => s.replace(/<[^>]+>/g, '').trim();

describe('the project page header (spec 044)', () => {
    it('RF-1, RF-2: the header is the shared one, with its tile and band', async () => {
        const h = header(await page('es'));
        expect(h).toContain('page-header__tile');
        expect(h).toContain('hero-band');
        expect(h).toMatch(/<h1\b/);
    });

    it('RF-4: the description is the lead under the title, or the locale fallback', async () => {
        const offenders: string[] = [];
        for (const l of LOCALES) {
            for (const [description, want] of [[' Text ', 'Text'], [null, (setLocale(l), t('project.meta.noDescription'))]] as const) {
                const h = header(await page(l, { description }));
                const lead = strip(h.match(/<p class="page-header__lead"[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? '');
                if (lead !== want) offenders.push(`${l} ${JSON.stringify(description)}: lead "${lead}", want "${want}"`);
                if (h.indexOf('<h1') > h.indexOf('page-header__lead')) offenders.push(`${l}: the lead is above the h1`);
            }
        }
        expect(offenders, offenders.join(', ')).toEqual([]);
    });

    it('RF-4: no heading ends with a colon and the description key is gone from both locales', async () => {
        for (const l of LOCALES) {
            const html = await page(l);
            const headings = [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/g)].map((m) => strip(m[2]));
            expect(headings.filter((h) => h.endsWith(':')), `${l}: a heading ends with ":"`).toEqual([]);
            const keys = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'i18n', 'locales', `${l}.json`), 'utf-8')).project.meta;
            expect(keys, `${l}: project.meta.description is still defined`).not.toHaveProperty('description');
        }
    });

    it('RF-5: outside the README no heading skips a level', async () => {
        for (const l of LOCALES) {
            const html = (await page(l, {}, '<h2>Usage</h2>')).replace(/<div class="readme-body"[\s\S]*$/, '');
            const levels = [...html.matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]));
            const skips = levels.filter((lv, i) => i > 0 && lv > levels[i - 1] + 1);
            expect(levels.length, `${l}: no headings`).toBeGreaterThan(0);
            expect(skips, `${l}: levels ${levels.join(',')}`).toEqual([]);
        }
    });

    const GH = (level: number, text: string, slug: string) =>
        `<div class="markdown-heading"><h${level} class="heading-element">${text}</h${level}><a id="user-content-${slug}" class="anchor" aria-label="Permalink: ${text}" href="#${slug}"><svg class="octicon octicon-link"></svg></a></div>`;
    const body = (html: string) => html.match(/<article class="readme-body"[^>]*>([\s\S]*?)<\/article>/)?.[1] ?? '';

    it('RF-6: a README opening with the repository name shows one heading of that name, the h1', async () => {
        const html = await page('es', {}, GH(1, 'fixture', 'fixture') + '<p>Body</p>' + GH(2, 'Usage', 'usage'));
        const names = [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/g)].map((m) => strip(m[2]).toLowerCase()).filter((n) => n === 'fixture');
        expect(names).toEqual(['fixture']);
        expect(body(html)).toContain('Usage');
    });

    it('RF-6: a README opening with another heading still shows it', async () => {
        expect(body(await page('es', {}, GH(1, 'Usage', 'usage')))).toContain('Usage');
    });

    it('RF-7: no anchor icon is left and each heading carries the anchor id', async () => {
        const html = body(await page('en', {}, GH(2, 'Usage', 'usage') + GH(3, 'Install', 'install')));
        expect(html).not.toMatch(/class="anchor"|octicon/);
        expect(html).toMatch(/<h2\b[^>]*\bid="user-content-usage"/);
        expect(html).toMatch(/<h3\b[^>]*\bid="user-content-install"/);
    });

    it('edge: the unavailable page has the shared header, the title as h1 and the message as lead', async () => {
        for (const l of LOCALES) {
            vi.stubGlobal('fetch', async () => mockTextResponse('{"message":"boom"}', 500));
            clearGitHubCache();
            setLocale(l);
            const html = await container.renderToString(ProjectPage, { params: { name: 'fixture' }, request: new Request(`https://example.test/proyectos/fixture?lang=${l}`) });
            vi.unstubAllGlobals();
            const h = header(html);
            expect(h, `${l}: no shared header`).toContain('page-header__tile');
            expect(strip(h.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? ''), `${l}: the h1`).toBe(t('project.unavailable.title'));
            expect(strip(h.match(/<p class="page-header__lead"[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? ''), `${l}: the lead`).toBe(t('project.unavailable.message'));
        }
    });
});
