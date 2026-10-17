import { describe, it, expect, vi, afterEach } from 'vitest';
import * as github from '../src/pages/lib/github';
import { ghListByTopic, ghRepo, ghRepoReadme, sortRepos } from '../src/pages/lib/github';
import { buildRepo, mockGitHubSearchResponse, mockGitHubRepoResponse, mockTextResponse } from './helpers/github-mocks';
// Same module as `@type/github`, which is what the source itself imports. One
// spelling for one file: two paths for one type is two places to update.
import type { GitHubRepo } from '@type/github';


describe('GitHub helpers', () => {
    afterEach(() => {
        // restore any stubbed globals
        vi.unstubAllGlobals();
    });

    it('ghListByTopic returns items when fetch is stubbed', async () => {
        const fake: GitHubRepo[] = [buildRepo({ description: 'desc' })];
        vi.stubGlobal('fetch', () => mockGitHubSearchResponse(fake));
        const items = await ghListByTopic({ topic: '' });
        expect(items).toHaveLength(1);
        expect(items[0].name).toBe('repo');
    });

    it('ghRepo returns repo object when available', async () => {
        const repo = buildRepo({ id: 2, name: 'repo2', full_name: 'XDextX/repo2', description: null });
        vi.stubGlobal('fetch', () => mockGitHubRepoResponse(repo));
        const r = await ghRepo({ user: 'XDextX', name: 'repo2' });
        expect(r).not.toBeNull();
        expect(r!.name).toBe('repo2');
    });

});

describe('ghRepoReadme', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('returns the rendered readme body', async () => {
        vi.stubGlobal('fetch', () => mockTextResponse('<h1>Readme</h1>'));
        expect(await ghRepoReadme({ user: 'XDextX', name: 'repo' })).toBe('<h1>Readme</h1>');
    });

    it('asks for rendered HTML, not raw markdown', async () => {
        // Raw markdown would ship to the page as text and render as source.
        const fetchStub = vi.fn(async () => mockTextResponse(''));
        vi.stubGlobal('fetch', fetchStub);

        await ghRepoReadme({ user: 'XDextX', name: 'repo' });

        const [, init] = fetchStub.mock.calls[0];
        expect(init.headers.Accept).toBe('application/vnd.github.v3.html');
    });

    it('returns null for a repo with no readme instead of throwing', async () => {
        // 404 is an expected answer here, not an error: most repos have one, but
        // not all, and the page renders its own message for the empty case.
        vi.stubGlobal('fetch', () => mockTextResponse('Not Found', 404));
        expect(await ghRepoReadme({ user: 'XDextX', name: 'bare' })).toBeNull();
    });

    it('throws on any other failure', async () => {
        // The distinction matters: a rate-limited 403 must not read as "no
        // readme", or the page would claim a repo has none when GitHub is down.
        vi.stubGlobal('fetch', () => mockTextResponse('rate limited', 403));
        await expect(ghRepoReadme({ user: 'XDextX', name: 'repo' })).rejects.toThrow('GitHub error 403');
    });
});

describe('sortRepos', () => {
    const named = (name: string, extra: Partial<GitHubRepo> = {}) =>
        buildRepo({ name, full_name: `XDextX/${name}`, ...extra });

    /**
     * Each case names its repos so the name order CONTRADICTS the key under
     * test: written the obvious way, the name fallback gives the same answer and
     * the assertion proves nothing — how the forks comparison was first missed.
     */
    it('ranks by stars first', () => {
        const out = sortRepos([
            named('aaa', { stargazers_count: 1 }),
            named('zzz', { stargazers_count: 9 }),
        ]);
        expect(out.map((r) => r.name)).toEqual(['zzz', 'aaa']);
    });

    it('breaks a star tie on forks', () => {
        const out = sortRepos([
            named('aaa', { stargazers_count: 5, forks_count: 0 }),
            named('zzz', { stargazers_count: 5, forks_count: 3 }),
        ]);
        expect(out.map((r) => r.name)).toEqual(['zzz', 'aaa']);
    });

    it('puts a repo with a live demo ahead of one without', () => {
        const out = sortRepos([
            named('aaa'),
            named('zzz', { homepage: 'https://example.com' }),
        ]);
        expect(out.map((r) => r.name)).toEqual(['zzz', 'aaa']);
    });

    it('treats a blank homepage as no demo', () => {
        // A homepage of "" or whitespace would otherwise outrank a real demo.
        const out = sortRepos([
            named('blank', { homepage: '   ' }),
            named('demo', { homepage: 'https://example.com' }),
        ]);
        expect(out.map((r) => r.name)).toEqual(['demo', 'blank']);
    });

    it('falls back to name so the order is total and stable', () => {
        // Without this, two repos equal on every other key keep their input
        // order, which differs per route and re-shuffles on refresh.
        const out = sortRepos([named('zebra'), named('alpha'), named('mango')]);
        expect(out.map((r) => r.name)).toEqual(['alpha', 'mango', 'zebra']);
    });

    it('does not mutate its input', () => {
        const input = [named('b', { stargazers_count: 1 }), named('a', { stargazers_count: 9 })];
        const before = input.map((r) => r.name);

        sortRepos(input);

        expect(input.map((r) => r.name)).toEqual(before);
    });

    it('handles an empty list', () => {
        expect(sortRepos([])).toEqual([]);
    });
});

// Spec 014: what a repository's raw fields mean to a visitor. A missing export fails by name.
const helper = (name: string) => {
    const fn = (github as any)[name];
    if (typeof fn !== 'function') throw new Error(`src/pages/lib/github.ts exports no ${name}`);
    return fn;
};

describe('repo language and demo URL (spec 014 RF-4, RF-5, RF-7, RF-8)', () => {
    it('language: trimmed, or null when absent or blank', () => {
        const repoLanguage = helper('repoLanguage');
        for (const language of [undefined, null, '', '   ']) expect(repoLanguage(buildRepo({ language } as any)), String(language)).toBeNull();
        expect(repoLanguage(buildRepo({ language: ' Go ' }))).toBe('Go');
    });

    it('demo URL: an absolute http(s) homepage, trimmed and as given, else null', () => {
        const demoUrl = helper('demoUrl');
        expect(demoUrl(buildRepo({ homepage: ' https://x.test ' }))).toBe('https://x.test');
        expect(demoUrl(buildRepo({ homepage: 'HTTPS://x.test' }))).toBe('HTTPS://x.test');
        for (const homepage of ['javascript:alert(1)', 'x.test', 'ftp://x.test', '', null]) expect(demoUrl(buildRepo({ homepage } as any)), String(homepage)).toBeNull();
    });
});
