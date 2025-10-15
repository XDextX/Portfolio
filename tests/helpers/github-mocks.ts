import type { GitHubRepo } from "../../src/types/github";

/** Minimal Response-like factory used for fetch stubs in tests */
function makeResponse<T>(body: T | null, status = 200) {
    const ok = status >= 200 && status < 300;
    return {
        ok,
        status,
        json: async () => body,
        text: async () => (body ? JSON.stringify(body) : ''),
    } as unknown as Response;
}

export function mockGitHubSearchResponse(items: GitHubRepo[] = []) {
    return makeResponse({ items }, 200);
}

export function mockGitHubRepoResponse(repo: GitHubRepo | null) {
    if (!repo) return makeResponse(null, 404);
    return makeResponse(repo, 200);
}

/** Create an error Response (non-OK) with optional json body */
export function mockErrorResponse(status = 500, body: unknown = null) {
    return makeResponse(body as any, status);
}

/**
 * Build a fetch stub function that yields responses in sequence.
 * Example: vi.stubGlobal('fetch', sequenceFetch([r1, r2]));
 */
export function sequenceFetch(responses: Response[]) {
    let i = 0;
    return async () => {
        const r = responses[Math.min(i, responses.length - 1)];
        i += 1;
        return r;
    };
}

export type FetchStub = () => Promise<Response>;
