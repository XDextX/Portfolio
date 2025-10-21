import { describe, it, expect, vi, afterEach } from 'vitest';
import { ghListByTopic, ghRepo, ghSearch } from '../src/pages/lib/github';
import { mockGitHubSearchResponse, mockGitHubRepoResponse } from './helpers/github-mocks';
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
