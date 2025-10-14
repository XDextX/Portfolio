import { describe, it, expect, vi } from 'vitest';
import { ghListByTopic, ghRepo } from '../src/pages/lib/github';
import { mockGitHubSearchResponse, mockGitHubRepoResponse } from './helpers/github-mocks';

describe('GitHub helpers', () => {
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
