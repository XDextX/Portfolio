import type { GitHubRepo } from "@type/github";

/** The GitHub user whose repositories the site shows; the one place that names it (spec 021). */
export const USER = import.meta.env.GITHUB_USERNAME || "XDextX";
const TOKEN = import.meta.env.GITHUB_TOKEN; // opcional

const baseHeaders: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": `${USER}-portfolio`
};
if (TOKEN) baseHeaders.Authorization = `Bearer ${TOKEN}`;

export async function ghListByTopic({ topic = "", per_page = 50 }: { topic: string; per_page?: number; }): Promise<GitHubRepo[]> {
    const url = new URL("https://api.github.com/search/repositories");
    if (topic.trim() === "")
        url.searchParams.set("q", `user:${USER}`);
    else
        url.searchParams.set("q", `user:${USER} topic:${topic}`);
    url.searchParams.set("per_page", String(per_page));
    url.searchParams.set("sort", "updated");
    url.searchParams.set("order", "desc");

    const r = await fetch(url, { headers: baseHeaders });
    if (!r.ok) throw new Error(`GitHub error ${r.status}`);
    const json = await r.json();
    const { items = [] } = json as { items?: GitHubRepo[] };
    return items;
}

/**
 * Whether a login is the configured user; GitHub logins are case-insensitive (spec 021 D-4).
 * @param login a repository owner as it arrived @returns true for the configured user
 */
export function isOwner(login: string): boolean {
    return login.toLowerCase() === USER.toLowerCase();
}

export async function ghRepo({ user = USER, name }: { user?: string; name: string }): Promise<GitHubRepo | null> {
    const r = await fetch(`https://api.github.com/repos/${user}/${name}`, { headers: baseHeaders });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(`GitHub error ${r.status}`);
    const json = await r.json();
    return json as GitHubRepo;
}

export async function ghRepoReadme({ user, name }: { user: string; name: string }): Promise<string | null> {
    const r = await fetch(`https://api.github.com/repos/${user}/${name}/readme`, {
        headers: {
            ...baseHeaders,
            Accept: 'application/vnd.github.v3.html',
        }
    });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(`GitHub error ${r.status}`);
    const response = await r.text();

    return response;
}

// Spec 023: one cache for pages and API routes, so a page no longer calls its own API over HTTP.
const TTL_MS = 30 * 60 * 1000;
const memo = new Map<string, { at: number; value: unknown }>();

/**
 * A read answered from memory for 30 minutes; a throw is not stored, so the next call retries.
 * @param key what is asked @param now the caller's clock @param read the GitHub request
 * @returns the cached or fresh value
 */
async function cached<T>(key: string, now: number, read: () => Promise<T>): Promise<T> {
    const hit = memo.get(key);
    if (hit && now - hit.at < TTL_MS) return hit.value as T;
    const value = await read();
    // Expired entries go on every write: absent names asked by a bot never pile up.
    for (const [k, e] of memo) if (now - e.at >= TTL_MS) memo.delete(k);
    memo.set(key, { at: now, value });
    return value;
}

/**
 * The configured user's repositories for the configured topic, cached.
 * @param now the clock, a parameter for tests @returns the repositories, unsorted
 */
export function listRepos(now = Date.now()): Promise<GitHubRepo[]> {
    const topic = import.meta.env.GITHUB_TOPIC ?? "";
    return cached(`list:${topic}`, now, () => ghListByTopic({ topic }));
}

/**
 * One of the configured user's repositories, cached; null when GitHub has none by that name.
 * @param name the repository @param now the clock @returns the repository or null
 */
export function getRepo(name: string, now = Date.now()): Promise<GitHubRepo | null> {
    return cached(`repo:${name}`, now, () => ghRepo({ name }));
}

/**
 * A README rendered by GitHub, cached; null for another owner (spec 021) or no README.
 * @param owner the repository owner as asked @param name the repository @param now the clock
 * @returns the HTML or null
 */
export async function getReadme(owner: string, name: string, now = Date.now()): Promise<string | null> {
    if (!isOwner(owner)) return null;
    return cached(`readme:${name}`, now, () => ghRepoReadme({ user: USER, name }));
}

// Spec 032: a repository's social preview, only when the owner uploaded one. GraphQL alone
// exposes it, and GraphQL answers no request without a token.
const PREVIEWS_QUERY = `query($login: String!) { user(login: $login) { repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC) {
    nodes { name usesCustomOpenGraphImage openGraphImageUrl } } } }`;

type PreviewNode = { name?: string; usesCustomOpenGraphImage?: boolean; openGraphImageUrl?: string | null };

/**
 * The previews the owner uploaded, by repository name; GitHub's generated ones are dropped.
 * @param nodes GraphQL repository nodes @returns name → image URL
 */
export function previewsFrom(nodes: PreviewNode[]): Map<string, string> {
    const map = new Map<string, string>();
    for (const n of nodes) if (n.name && n.usesCustomOpenGraphImage && n.openGraphImageUrl) map.set(n.name, n.openGraphImageUrl);
    return map;
}

async function ghPreviews(): Promise<Map<string, string>> {
    if (!TOKEN) return new Map();
    const r = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: { ...baseHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ query: PREVIEWS_QUERY, variables: { login: USER } }),
    });
    if (!r.ok) throw new Error(`GitHub error ${r.status}`);
    const json = (await r.json()) as { data?: { user?: { repositories?: { nodes?: PreviewNode[] } } } };
    return previewsFrom(json.data?.user?.repositories?.nodes ?? []);
}

/**
 * The configured user's uploaded previews, cached like the list.
 * @param now the clock, a parameter for tests @returns name → image URL
 */
export function listPreviews(now = Date.now()): Promise<Map<string, string>> {
    return cached("previews", now, ghPreviews);
}

/**
 * A listed repository's preview as GitHub serves it; null for any other name, before any
 * request built from it (spec 032 RF-5). @param name as asked @param now the clock
 * @returns the upstream response or null
 */
export async function getPreview(name: string, now = Date.now()): Promise<Response | null> {
    const [repos, previews] = await Promise.all([listRepos(now), listPreviews(now)]);
    const url = previews.get(name);
    if (!url || !repos.some((r) => r.name === name)) return null;
    return fetch(url);
}

/**
 * The names with an uploaded preview; a failed read means none, so the cards render as without
 * spec 032 (RF-4). @param now the clock @returns repository names
 */
export async function listPreviewNames(now = Date.now()): Promise<string[]> {
    try {
        return [...(await listPreviews(now)).keys()];
    } catch {
        return [];
    }
}

/**
 * The same-origin path a card loads a preview from (spec 032 RF-3).
 * @param name the repository @returns the route's path
 */
export function previewPath(name: string): string {
    return `/api/v1/projects/preview/${encodeURIComponent(name)}`;
}

/** Empty the cache; tests only, so one case's answer never reaches the next. */
export function clearGitHubCache(): void {
    memo.clear();
}

/**
 * Order repos: stars desc, forks desc, has-demo first, then name asc so the
 * order is total and stable. Shared by / and /proyectos so a repo cannot land
 * in two positions. @param repos not mutated. @returns a new array.
 */
export function sortRepos(repos: GitHubRepo[]): GitHubRepo[] {
    return [...repos].sort((a, b) => {
        if (b.stargazers_count !== a.stargazers_count)
            return b.stargazers_count - a.stargazers_count;
        if (b.forks_count !== a.forks_count) return b.forks_count - a.forks_count;
        const aHasDemo = a.homepage?.trim() ? 1 : 0;
        const bHasDemo = b.homepage?.trim() ? 1 : 0;
        if (bHasDemo !== aHasDemo) return bHasDemo - aHasDemo;
        return a.name.localeCompare(b.name);
    });
}

/**
 * The repository's language as a visitor reads it (spec 014).
 * @param repo its `language` field
 * @returns the trimmed name, or null when absent or blank
 */
export function repoLanguage(repo: Pick<GitHubRepo, "language">): string | null {
    const s = (repo.language ?? "").trim();
    return s === "" ? null : s;
}

/**
 * The homepage as a demo link: an absolute http(s) URL only, never `javascript:` (spec 014).
 * @param repo its `homepage` field
 * @returns the trimmed string as given, or null
 */
export function demoUrl(repo: Pick<GitHubRepo, "homepage">): string | null {
    const s = (repo.homepage ?? "").trim();
    if (s === "") return null;
    try {
        const { protocol } = new URL(s);
        return protocol === "http:" || protocol === "https:" ? s : null;
    } catch {
        return null;
    }
}
