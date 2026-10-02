import type { GitHubRepo } from "@type/github";

const USER = import.meta.env.GITHUB_USERNAME || "XDextX";
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

export async function ghRepo({ user, name }: { user: string; name: string }): Promise<GitHubRepo | null> {
    const r = await fetch(`https://api.github.com/repos/${user}/${name}`, { headers: baseHeaders });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(`GitHub error ${r.status}`);
    const json = await r.json();
    return json as GitHubRepo;
}

export async function ghSearch(
    q: string,
    { perPage = 10, restrictToUser = true }: { perPage?: number; restrictToUser?: boolean } = {}
): Promise<GitHubRepo[]> {
    const trimmedQuery = q.trim();
    if (!trimmedQuery) return [];
    const url = new URL("https://api.github.com/search/repositories");
    const scopedQuery = restrictToUser && !trimmedQuery.includes("user:")
        ? `user:${USER} ${trimmedQuery}`
        : trimmedQuery;
    url.searchParams.set("q", scopedQuery);
    url.searchParams.set("per_page", String(perPage));
    const r = await fetch(url, { headers: baseHeaders });
    if (!r.ok) throw new Error(`GitHub error ${r.status}`);
    const json = await r.json();
    return (json.items ?? []) as GitHubRepo[];
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
 * Order repositories for display. Shared by the home page and /proyectos so the
 * same repo never shows up in two different positions across routes.
 *
 * Ranking, most significant first:
 *   1. stars (desc)
 *   2. forks (desc)
 *   3. repos with a live demo before those without
 *   4. name (asc), which makes the order total and therefore stable
 *
 * @param repos Repositories to rank. The input array is not mutated.
 * @returns A new array in display order.
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

