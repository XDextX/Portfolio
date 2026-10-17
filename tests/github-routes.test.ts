import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { setLocale } from '@i18n/index';
import { mockTextResponse } from './helpers/github-mocks';

// Spec 021: the README route serves only the configured user (RF-1), a project that cannot be
// fetched answers 503 instead of not-found (RF-3), and every route names the configured user
// (RF-4). RF-2 (unknown project → 404, no redirect) is rendered: e2e/github-routes.spec.ts.

const LOCALES = ['es', 'en'] as const;
const read = (l: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'i18n', 'locales', `${l}.json`), 'utf-8'));
const MESSAGES = { es: read('es'), en: read('en') };

/** A fetch stand-in that records each URL and answers with `answer(url)`. */
function recorder(answer: (url: string) => Response) {
    const urls: string[] = [];
    vi.stubGlobal('fetch', async (u: unknown) => { urls.push(String(u)); return answer(String(u)); });
    return urls;
}

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });

describe('README route (spec 021 RF-1)', () => {
    const route = () => import('../src/pages/api/v1/projects/readme/[owner]/[name]/readme.json');

    it('refuses an owner other than the configured user without asking GitHub', async () => {
        const urls = recorder(() => mockTextResponse('<h1>Not yours</h1>'));
        const { GET } = await route();
        const res = await GET({ params: { owner: 'torvalds', name: 'linux' } } as any);
        expect(res.status).toBe(404);
        expect(urls, 'GitHub was asked').toEqual([]);
    });

    it('serves the configured user, in any case', async () => {
        const { USER } = await import('../src/pages/lib/github');
        for (const owner of [USER, USER.toLowerCase(), USER.toUpperCase()]) {
            vi.resetModules();
            const urls = recorder(() => mockTextResponse('<h1>Readme</h1>'));
            const { GET } = await route();
            const res = await GET({ params: { owner, name: `repo-${owner}` } } as any);
            expect(res.status, owner).toBe(200);
            expect(await res.text()).toBe('<h1>Readme</h1>');
            expect(urls).toHaveLength(1);
        }
    });
});

describe('the configured user (spec 021 RF-4)', () => {
    it('the list and the project route both ask for the configured user, never a literal', async () => {
        vi.stubEnv('GITHUB_USERNAME', 'someone');
        vi.resetModules();
        const urls = recorder((u) => u.includes('/search/')
            ? mockTextResponse(JSON.stringify({ items: [] }))
            : mockTextResponse(JSON.stringify({ name: 'repo' })));
        const gh = await import('../src/pages/lib/github');
        await gh.ghListByTopic({ topic: '' });
        await gh.ghRepo({ name: 'repo' });
        const { GET } = await import('../src/pages/api/v1/projects/[name].json');
        await GET({ params: { name: 'other-repo' } } as any);
        expect(urls).toHaveLength(3);
        for (const u of urls) {
            expect(u, u).toMatch(/someone/);
            expect(u, u).not.toMatch(/XDextX/i);
        }
    });
});

describe('a project GitHub cannot serve (spec 021 RF-3)', () => {
    let container: AstroContainer;
    beforeAll(async () => { container = await AstroContainer.create(); });

    for (const status of [403, 500]) {
        for (const locale of LOCALES) {
            it(`GitHub answering ${status} renders the unavailable state with 503 — ${locale}`, async () => {
                // The project route today, GitHub's repo URL once the page asks it directly (spec 023).
                recorder(() => mockTextResponse('{"error":"x"}', status));
                const ProjectPage = (await import('../src/pages/proyectos/[name].astro')).default;
                setLocale(locale);
                const res = await container.renderToResponse(ProjectPage, {
                    params: { name: 'fixture' },
                    request: new Request(`https://example.test/proyectos/fixture?lang=${locale}`),
                });
                expect(res.status).toBe(503);
                expect(await res.text()).toContain(MESSAGES[locale].project.unavailable?.title ?? 'project.unavailable.title is missing');
            });
        }
    }
});
