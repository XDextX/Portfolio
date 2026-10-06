import { describe, it, expect, vi, afterEach } from 'vitest';
import { ghListByTopic, ghRepo, ghRepoReadme, ghSearch, sortRepos } from '../src/pages/lib/github';
import { mockGitHubSearchResponse, mockGitHubRepoResponse, mockTextResponse } from './helpers/github-mocks';
// Same module as `@type/github`, which is what the source itself imports. One
// spelling for one file: two paths for one type is two places to update.
import type { GitHubRepo } from '@type/github';

const defaultOwner: GitHubRepo['owner'] = {
    login: 'XDextX',
    avatar_url: 'https://avatars.githubusercontent.com/u/0?v=4'
};

function buildRepo(overrides: Partial<GitHubRepo> = {}): GitHubRepo {
    const { owner, updated_at = new Date().toISOString(), ...rest } = overrides;
    return {
        id: 1,
        name: 'repo',
        full_name: 'XDextX/repo',
        description: '',
        html_url: 'https://github.com/XDextX/repo',
        stargazers_count: 0,
        forks_count: 0,
        updated_at,
        owner: { ...defaultOwner, ...(owner ?? {}) },
        ...rest
    };
}

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

    it('ghSearch scopes queries to the default user and keeps perPage default', async () => {
        const fake = [buildRepo({ id: 3, name: 'scoped', full_name: 'XDextX/scoped', html_url: 'https://github.com/XDextX/scoped' })];
        const fetchStub = vi.fn(async (input: any) => mockGitHubSearchResponse(fake));
        vi.stubGlobal('fetch', fetchStub);

        const items = await ghSearch('portfolio');

        expect(items).toHaveLength(1);
        const [[requestedUrl]] = fetchStub.mock.calls;
        const url = requestedUrl instanceof URL ? requestedUrl : new URL(String(requestedUrl));
        expect(url.searchParams.get('q')).toBe('user:XDextX portfolio');
        expect(url.searchParams.get('per_page')).toBe('10');
    });

    it('ghSearch allows overriding perPage and disabling user scoping', async () => {
        const fake = [
            buildRepo({
                id: 4,
                name: 'global',
                full_name: 'someone/global',
                html_url: 'https://github.com/someone/global',
                owner: { login: 'someone', avatar_url: 'https://avatars.githubusercontent.com/u/123?v=4' }
            })
        ];
        const fetchStub = vi.fn(async (input: any) => mockGitHubSearchResponse(fake));
        vi.stubGlobal('fetch', fetchStub);

        const items = await ghSearch('astro', { perPage: 5, restrictToUser: false });

        expect(items).toHaveLength(1);
        const [[requestedUrl]] = fetchStub.mock.calls;
        const url = requestedUrl instanceof URL ? requestedUrl : new URL(String(requestedUrl));
        expect(url.searchParams.get('q')).toBe('astro');
        expect(url.searchParams.get('per_page')).toBe('5');
    });

    it('ghSearch preserves explicit user scoping in the query string', async () => {
        const fetchStub = vi.fn(async (input: any) => mockGitHubSearchResponse([]));
        vi.stubGlobal('fetch', fetchStub);

        await ghSearch('user:someone cool-project');

        const [[requestedUrl]] = fetchStub.mock.calls;
        const url = requestedUrl instanceof URL ? requestedUrl : new URL(String(requestedUrl));
        expect(url.searchParams.get('q')).toBe('user:someone cool-project');
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
