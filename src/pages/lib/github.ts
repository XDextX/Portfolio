import type { GitHubRepo } from "@type/github";
import { PROJECT_CATEGORIES, type CategoryKey } from "../../data/projectCategories";

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
    const raw = await rawReadme(name, now);
    return raw === null ? null : rewriteReadmeImages(raw, USER, name);
}

function rawReadme(name: string, now: number): Promise<string | null> {
    return cached(`readme:${name}`, now, () => ghRepoReadme({ user: USER, name }));
}

// Spec 037: README images come from this origin, not GitHub's image hosts (constitution 2). The
// route takes an index, never a URL, and fetches only what GitHub's HTML names, on GitHub's hosts.
export const README_IMAGE_HOSTS: ReadonlySet<string> = new Set([
    "camo.githubusercontent.com", "raw.githubusercontent.com", "github.com", "user-images.githubusercontent.com",
]);

const IMG_TAG = /<img\b[^>]*>/g;

/**
 * The `src` of every image in a README, in document order.
 * @param html GitHub's rendered README @returns absolute image URLs
 */
export function readmeImageUrls(html: string): string[] {
    return [...html.matchAll(IMG_TAG)].map((m) => m[0].match(/\ssrc="([^"]*)"/)?.[1] ?? "");
}

/**
 * The same-origin path of a README's N-th image (spec 037).
 * @param owner the repository owner @param name the repository @param n the image's index
 * @returns the route's path
 */
export function readmeImagePath(owner: string, name: string, n: number): string {
    return `/api/v1/projects/readme/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/image/${n}`;
}

/**
 * A README with each image pointed at its index on this origin and its `srcset` dropped; nothing
 * else changes. @param html GitHub's rendered README @param owner the owner @param name the repo
 * @returns the rewritten HTML
 */
export function rewriteReadmeImages(html: string, owner: string, name: string): string {
    let n = 0;
    return html.replace(IMG_TAG, (tag) => tag
        .replace(/\s+srcset="[^"]*"/, "")
        .replace(/(\ssrc=")[^"]*(")/, (_, a, b) => `${a}${readmeImagePath(owner, name, n++)}${b}`));
}

/**
 * A README's N-th image as GitHub serves it; null for another owner, no README, an index not a
 * whole number in range, or a host outside GitHub's (spec 037 RF-3).
 * @param owner as asked @param name as asked @param n as asked @param now the clock @returns it or null
 */
export async function getReadmeImage(owner: string, name: string, n: string, now = Date.now()): Promise<Response | null> {
    if (!isOwner(owner) || !/^\d+$/.test(n)) return null;
    const raw = await rawReadme(name, now);
    if (raw === null) return null;
    const url = readmeImageUrls(raw)[Number(n)];
    if (!url) return null;
    let host = "";
    try { host = new URL(url).host; } catch { return null; }
    return README_IMAGE_HOSTS.has(host) ? fetch(url) : null;
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
 * The category named by the `cat` query value (spec 040).
 * @param value the raw query value, exact: keys are lowercase as typed in the URL
 * @returns one of the six keys, or null for a missing or unknown value (which means Todos)
 */
export function parseCategory(value: string | null): CategoryKey | null {
    return PROJECT_CATEGORIES.find((c) => c.key === value)?.key ?? null;
}

/**
 * Whether a repository belongs to a category: it carries the category's topic, or for `other`
 * none of the category topics. A repository with two category topics is in both (spec 040).
 * @param repo its `topics` @param key the category @returns true when it belongs
 */
export function inCategory(repo: Pick<GitHubRepo, "topics">, key: CategoryKey): boolean {
    const topics = repo.topics ?? [];
    const entry = PROJECT_CATEGORIES.find((c) => c.key === key);
    if (!entry) return false;
    if (entry.topic) return topics.includes(entry.topic);
    return !PROJECT_CATEGORIES.some((c) => c.topic && topics.includes(c.topic));
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


/** A heading's or fragment's text: tags stripped (so image alt text is out), entities decoded. */
function textOf(html: string): string {
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
        .replace(/&quot;/g, '"').replace(/&#x27;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

/** Whether two names match once lowercased and stripped of everything but letters and digits. */
function sameName(a: string, b: string): boolean {
    const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    return norm(a) !== '' && norm(a) === norm(b);
}

const ANCHOR = String.raw`<a\b[^>]*\bclass="anchor"[^>]*>[\s\S]*?<\/a>`;

/**
 * A README as the project page shows it (spec 044): anchors dropped, their ids moved onto their
 * headings, no leading heading repeating the name. @param html GitHub's README, images already
 * rewritten. @param repoName the repository's name. @returns the HTML to render.
 */
export function tidyReadme(html: string, repoName: string): string {
    // The id sits on the anchor, not the heading: carry it over, or a link to the heading breaks.
    const withId = (open: string, attrs: string, anchor: string) => {
        const id = anchor.match(/\bid="([^"]*)"/)?.[1];
        return `${open}${attrs}${id && !/\bid=/.test(attrs) ? ` id="${id}"` : ''}>`;
    };
    html = html
        .replace(new RegExp(String.raw`(<h([1-6])\b)([^>]*)>((?:(?!<h[1-6]\b)[\s\S])*?<\/h\2>)\s*(${ANCHOR})`, 'g'),
            (_, open, _l, attrs, rest, anchor) => `${withId(open, attrs, anchor)}${rest}`)
        .replace(new RegExp(String.raw`(<h([1-6])\b)([^>]*)>\s*(${ANCHOR})`, 'g'),
            (_, open, _l, attrs, anchor) => withId(open, attrs, anchor));

    const first = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/.exec(html);
    if (!first || textOf(html.slice(0, first.index)).trim() !== '' || !sameName(textOf(first[2]), repoName)) return html;
    let [start, end] = [first.index, first.index + first[0].length];
    const wrapper = /<div class="markdown-heading"[^>]*>\s*$/.exec(html.slice(0, start));
    const close = /^\s*<\/div>/.exec(html.slice(end));
    if (wrapper && close) [start, end] = [wrapper.index, end + close[0].length];
    return html.slice(0, start) + html.slice(end);
}
