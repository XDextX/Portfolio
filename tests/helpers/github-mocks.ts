import type { GitHubRepo } from '@type/github';

/** Minimal Response-like factory used for fetch stubs in tests. */
function makeResponse<T>(body: T | null, status = 200) {
    const ok = status >= 200 && status < 300;
    return {
        ok,
        status,
        json: async () => body,
        text: async () => (body ? JSON.stringify(body) : ''),
    } as unknown as Response;
}

/** A successful search result carrying `items`. */
export function mockGitHubSearchResponse(items: GitHubRepo[] = []) {
    return makeResponse({ items }, 200);
}

/** A single-repo response, or a 404 when `repo` is null. */
export function mockGitHubRepoResponse(repo: GitHubRepo | null) {
    if (!repo) return makeResponse(null, 404);
    return makeResponse(repo, 200);
}

/**
 * A text response. `ghRepoReadme` asks for rendered HTML and reads `.text()`,
 * which the two factories above do not exercise, so the stub needs a body that
 * survives that path rather than stringifying JSON into it.
 */
export function mockTextResponse(body: string, status = 200) {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => JSON.parse(body),
        text: async () => body,
    } as unknown as Response;
}
