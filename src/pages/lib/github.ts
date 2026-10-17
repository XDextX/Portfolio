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
