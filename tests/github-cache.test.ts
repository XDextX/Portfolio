import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { setLocale } from '@i18n/index';
import { buildRepo, mockTextResponse } from './helpers/github-mocks';
import { CANONICAL_ORIGIN } from '../src/data/site';

// Spec 023: pages read GitHub data in process (RF-1), one 30-minute cache serves pages and
// routes (RF-2), the sitemap lists its own environment's repos (RF-3), and the public routes
// keep their answers (RF-4).

const ORIGIN = 'https://example.test';
const TTL_MS = 30 * 60 * 1000;
const REPOS = [buildRepo({ id: 1, name: 'alpha' }), buildRepo({ id: 2, name: 'beta' })];

/** Answers GitHub's URLs (and, until the fix, the site's own API) and records every request. */
function github(mode: 'ok' | 'missing' | 'fail' = 'ok') {
    const urls: string[] = [];
    vi.stubGlobal('fetch', async (input: unknown) => {
        const u = String(input);
        urls.push(u);
        if (mode === 'fail') return mockTextResponse('{"message":"boom"}', 500);
        const name = u.match(/\/(?:repos\/[^/]+|projects(?:\/readme\/[^/]+)?)\/([^/.?]+)/)?.[1] ?? 'alpha';
        if (/readme/.test(u)) return mode === 'missing' ? mockTextResponse('{}', 404) : mockTextResponse(`<h1>${name}</h1>`);
        if (/search\/repositories|github-list/.test(u)) return mockTextResponse(JSON.stringify(u.includes('github-list') ? REPOS : { items: REPOS }));
        if (mode === 'missing') return mockTextResponse('{"message":"Not Found"}', 404);
        return mockTextResponse(JSON.stringify(buildRepo({ id: 9, name })));
    });
    return urls;
}

const lib = async () => {
    const m = await import('../src/pages/lib/github');
    m.clearGitHubCache?.();
    return m;
};

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

describe('pages without self-fetch (spec 023 RF-1)', () => {
    let container: AstroContainer;
    beforeAll(async () => { container = await AstroContainer.create(); });

    const pages: [string, () => Promise<any>, string, Record<string, string>?][] = [
        ['home', () => import('../src/pages/index.astro'), '/?lang=es'],
        ['projects', () => import('../src/pages/proyectos/index.astro'), '/proyectos?lang=es'],
        ['project', () => import('../src/pages/proyectos/[name].astro'), '/proyectos/alpha?lang=es', { name: 'alpha' }],
    ];
    for (const [label, load, route, params] of pages) {
        it(`the ${label} page never requests its own origin`, async () => {
            await lib();
            const urls = github();
            setLocale('es');
            await container.renderToString((await load()).default, { request: new Request(ORIGIN + route), params });
            const own = urls.filter((u) => u.startsWith(ORIGIN));
            expect(own, `requested its own origin:\n${own.join('\n')}`).toEqual([]);
            expect(urls.length, 'asked GitHub for nothing').toBeGreaterThan(0);
        });
    }
});

describe('one cache for pages and routes (spec 023 RF-2)', () => {
    it('a repeated question is answered from cache inside 30 minutes, asked again after', async () => {
        const gh = await lib();
        const urls = github();
        const t = 1_000_000;
        await gh.listRepos(t);
        await gh.listRepos(t + 1);
        expect(urls, 'two GitHub requests inside the window').toHaveLength(1);
        await gh.listRepos(t + TTL_MS);
        expect(urls).toHaveLength(2);
        await gh.getRepo('alpha', t);
        await gh.getRepo('alpha', t + TTL_MS - 1);
        expect(urls).toHaveLength(3);
    });

    it('a failed read is not cached', async () => {
        const gh = await lib();
        let urls = github('fail');
        await expect(gh.listRepos(5)).rejects.toThrow();
        urls = github();
        await gh.listRepos(6);
        expect(urls, 'the failure was cached').toHaveLength(1);
    });
});

describe('the sitemap (spec 023 RF-3, spec 042 RF-2)', () => {
    const locs = (xml: string) => [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
    const cases: [string, any][] = [['no site', {}], ['a preview site', { site: new URL(ORIGIN) }]];

    for (const [label, ctx] of cases) {
        it(`lists the stubbed repositories on the canonical origin, with ${label}, without asking it`, async () => {
            await lib();
            const urls = github();
            const { GET } = await import('../src/pages/sitemap.xml');
            const found = locs(await (await GET(ctx as any)).text());
            for (const r of REPOS) expect(found, r.name).toContain(`${CANONICAL_ORIGIN}/proyectos/${r.name}`);
            expect(found.filter((l) => !l.startsWith(`${CANONICAL_ORIGIN}/`)), 'a <loc> off the canonical origin').toEqual([]);
            const asked = urls.filter((u) => u.startsWith(CANONICAL_ORIGIN));
            expect(asked, `asked the canonical origin: ${asked.join(', ')}`).toEqual([]);
        });
    }

    it('still lists / and /proyectos on the canonical origin when GitHub fails', async () => {
        await lib();
        github('fail');
        const { GET } = await import('../src/pages/sitemap.xml');
        const res = await GET({ site: new URL(ORIGIN) } as any);
        expect(res.status).toBe(200);
        expect(locs(await res.text())).toEqual([`${CANONICAL_ORIGIN}/`, `${CANONICAL_ORIGIN}/proyectos`]);
    });
});

describe('the public routes keep their answers (spec 023 RF-4)', () => {
    const list = () => import('../src/pages/api/github-list.json');
    const project = () => import('../src/pages/api/v1/projects/[name].json');
    const readme = () => import('../src/pages/api/v1/projects/readme/[owner]/[name]/readme.json');

    it('list: 200 with the shared result, 500 on failure', async () => {
        const gh = await lib();
        github();
        const shared = await gh.listRepos();
        const res = await (await list()).GET({} as any);
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(JSON.parse(JSON.stringify(shared)));
        vi.resetModules();
        await lib();
        github('fail');
        expect((await (await list()).GET({} as any)).status).toBe(500);
    });

    it('project: 200 with the shared result, 404 when missing, 500 on failure', async () => {
        const gh = await lib();
        github();
        const shared = await gh.getRepo('alpha');
        const ok = await (await project()).GET({ params: { name: 'alpha' } } as any);
        expect(ok.status).toBe(200);
        expect(await ok.json()).toEqual(JSON.parse(JSON.stringify(shared)));
        for (const [mode, status] of [['missing', 404], ['fail', 500]] as const) {
            vi.resetModules();
            await lib();
            github(mode);
            expect((await (await project()).GET({ params: { name: 'alpha' } } as any)).status, mode).toBe(status);
        }
    });

    it('README: 200 HTML with the shared result, 404 when missing, 500 on failure', async () => {
        const gh = await lib();
        github();
        const shared = await gh.getReadme(gh.USER, 'alpha');
        const ok = await (await readme()).GET({ params: { owner: gh.USER, name: 'alpha' } } as any);
        expect(ok.status).toBe(200);
        expect(ok.headers.get('content-type')).toMatch(/text\/html/);
        expect(await ok.text()).toBe(shared);
        for (const [mode, status] of [['missing', 404], ['fail', 500]] as const) {
            vi.resetModules();
            const m = await lib();
            github(mode);
            expect((await (await readme()).GET({ params: { owner: m.USER, name: 'alpha' } } as any)).status, mode).toBe(status);
        }
    });
});
