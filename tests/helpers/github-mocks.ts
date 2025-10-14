import type { GitHubRepo } from "../../src/types/github";

export function mockGitHubSearchResponse(items: GitHubRepo[] = []) {
    return {
        ok: true,
        status: 200,
        json: async () => ({ items }),
    } as unknown as Response;
}

export function mockGitHubRepoResponse(repo: GitHubRepo | null) {
    if (!repo) return { ok: false, status: 404 } as unknown as Response;
    return {
        ok: true,
        status: 200,
        json: async () => repo,
    } as unknown as Response;
}
