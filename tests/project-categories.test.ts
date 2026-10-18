import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ProjectsPage from '../src/pages/proyectos/index.astro';
import { setLocale } from '@i18n/index';
import { buildRepo, mockGitHubSearchResponse } from './helpers/github-mocks';
import { clearGitHubCache, parseCategory, inCategory } from '../src/pages/lib/github';
import { PROJECT_CATEGORIES } from '../src/data/projectCategories';

/**
 * Spec 040: the category of a repository comes from its GitHub topics. The helpers are checked
 * as functions; the page is rendered through the Container with the list stubbed, because the
 * live list carries no category and the e2e server takes no test seam.
 */

const KEYS = ['web', 'backend', 'frontend', 'mobile', 'database', 'other'];
const locale = (l: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'i18n', 'locales', `${l}.json`), 'utf8'));

let container: Awaited<ReturnType<typeof AstroContainer.create>>;
beforeAll(async () => { container = await AstroContainer.create(); });
afterEach(() => vi.unstubAllGlobals());

describe('parseCategory (spec 040 RF-2, RF-5)', () => {
    it('the six keys come back as given', () => {
        for (const k of KEYS) expect(parseCategory(k)).toBe(k);
    });

    it('anything else is null: missing, empty, unknown, upper case, padded', () => {
        for (const v of [null, '', 'unknown', 'WEB', 'Web', ' web', 'web ', 'web,backend', 'todos', 'all']) expect(parseCategory(v), JSON.stringify(v)).toBeNull();
    });
});

describe('inCategory (spec 040 RF-2)', () => {
    const topics = (...t: string[]) => buildRepo({ topics: t });

    it('a repository is in the category its topic names', () => {
        expect(inCategory(topics('web'), 'web')).toBe(true);
        expect(inCategory(topics('web'), 'backend')).toBe(false);
        expect(inCategory(topics('mobile', 'portfolio-proyect'), 'mobile')).toBe(true);
    });

    it('two category topics put it under both', () => {
        const r = topics('backend', 'database');
        expect([inCategory(r, 'backend'), inCategory(r, 'database'), inCategory(r, 'web')]).toEqual([true, true, false]);
    });

    it('other is a repository carrying none of the five, and a tagged one is never other', () => {
        expect(inCategory(topics(), 'other')).toBe(true);
        expect(inCategory(buildRepo({}), 'other'), 'topics absent').toBe(true);
        expect(inCategory(topics('portfolio-proyect'), 'other')).toBe(true);
        for (const k of KEYS.filter((k) => k !== 'other')) expect(inCategory(topics(k), 'other'), k).toBe(false);
    });
});

describe('the category list (spec 040 RF-1)', () => {
    it('six entries in order, every one but other naming its topic', () => {
        expect(PROJECT_CATEGORIES.map((c) => c.key)).toEqual(KEYS);
        for (const c of PROJECT_CATEGORIES) expect(c.topic, c.key).toBe(c.key === 'other' ? null : c.key);
    });
});

describe('/proyectos, rendered with the list stubbed (spec 040 RF-2, RF-4, RF-5)', () => {
    const REPOS = [
        buildRepo({ id: 1, name: 'alpha-web', topics: ['web'], stargazers_count: 9 }),
        buildRepo({ id: 2, name: 'beta-api', topics: ['backend', 'database'], stargazers_count: 8 }),
        buildRepo({ id: 3, name: 'gamma-none', topics: [], stargazers_count: 7 }),
    ];

    const page = async (query: string, lang: 'es' | 'en' = 'es') => {
        vi.stubGlobal('fetch', async () => mockGitHubSearchResponse(REPOS));
        clearGitHubCache();
        setLocale(lang);
        const html = await container.renderToString(ProjectsPage, { request: new Request(`https://example.test/proyectos?${query}&lang=${lang}`) });
        vi.unstubAllGlobals();
        return html;
    };
    const names = (html: string) => [...html.matchAll(/<h3\b[^>]*\bcard-title\b[^>]*>\s*<a\b[^>]*>([^<]*)<\/a>/g)].map((m) => m[1].trim());

    it('each category renders exactly its repositories', async () => {
        const want: Record<string, string[]> = {
            web: ['alpha-web'], backend: ['beta-api'], database: ['beta-api'], other: ['gamma-none'],
        };
        const offenders: string[] = [];
        for (const [cat, expected] of Object.entries(want)) {
            const got = names(await page(`cat=${cat}`));
            if (JSON.stringify(got) !== JSON.stringify(expected)) offenders.push(`RF-2: cat=${cat} renders ${JSON.stringify(got)}, want ${JSON.stringify(expected)}`);
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    it('without cat every repository renders', async () => {
        expect(names(await page('x=1')).sort()).toEqual(['alpha-web', 'beta-api', 'gamma-none']);
    });

    it('an empty category says so in the locale and renders no card', async () => {
        const offenders: string[] = [];
        for (const lang of ['es', 'en'] as const) {
            const html = await page('cat=mobile', lang);
            const msg = locale(lang).projects.empty.category as string | undefined;
            if (!msg) { offenders.push(`RF-4: ${lang} has no projects.empty.category`); continue; }
            if (!html.includes(msg)) offenders.push(`RF-4: ${lang} cat=mobile does not render "${msg}"`);
            if (names(html).length) offenders.push(`RF-4: ${lang} cat=mobile renders cards`);
            if (html.includes(locale(lang).projects.empty.message.slice(0, 20))) offenders.push(`RF-4: ${lang} cat=mobile renders the topic message too`);
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    it('the filter links point at the bare route, the header opts out of the transition (RF-6)', async () => {
        const html = await page('cat=web');
        const hrefs = [...html.matchAll(/<a\b[^>]*\bclass="[^"]*\bproject-filter\b[^"]*"[^>]*>/g)].map((m) => m[0].match(/href="([^"]*)"/)?.[1]);
        expect(hrefs).toEqual(['/proyectos', ...KEYS.map((k) => `/proyectos?cat=${k}`)]);
        expect(html).toMatch(/<header\b[^>]*data-astro-transition-scope[^>]*>/);
    });

    it('an unknown key renders every repository with Todos current', async () => {
        const html = await page('cat=unknown');
        const offenders: string[] = [];
        if (names(html).length !== 3) offenders.push(`RF-5: cat=unknown renders ${names(html).length} cards, want 3`);
        const current = [...html.matchAll(/<a\b[^>]*\baria-current="page"[^>]*>/g)].map((m) => m[0].match(/href="([^"]*)"/)?.[1]);
        if (JSON.stringify(current) !== JSON.stringify(['/proyectos'])) offenders.push(`RF-5: current links ${JSON.stringify(current)}, want ["/proyectos"]`);
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
});
