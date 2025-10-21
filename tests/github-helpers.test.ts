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
        const fake = [
            { id: 1, name: 'repo', full_name: 'XDextX/repo', description: 'desc', html_url: 'https://github.com/XDextX/repo', stargazers_count: 0, forks_count: 0, updated_at: new Date().toISOString() }
        ];
        vi.stubGlobal('fetch', () => mockGitHubSearchResponse(fake));
        const items = await ghListByTopic({ topic: '' });
        expect(items).toHaveLength(1);
        expect(items[0].name).toBe('repo');
    });

    it('ghRepo returns repo object when available', async () => {
        const repo = { id: 2, name: 'repo2', full_name: 'XDextX/repo2', description: null, html_url: 'https://github.com/XDextX/repo2', stargazers_count: 0, forks_count: 0, updated_at: new Date().toISOString() };
        vi.stubGlobal('fetch', () => mockGitHubRepoResponse(repo));
        const r = await ghRepo({ user: 'XDextX', name: 'repo2' });
        expect(r).not.toBeNull();
        expect(r!.name).toBe('repo2');
    });
});
