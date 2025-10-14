const USER = import.meta.env.GITHUB_USERNAME || "XDextX";
const TOKEN = import.meta.env.GITHUB_TOKEN; // opcional

const baseHeaders: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": `${USER}-portfolio`
};
if (TOKEN) baseHeaders.Authorization = `Bearer ${TOKEN}`;

export async function ghListByTopic({ topic = "", per_page = 50 }: { topic: string; per_page?: number; }) {
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
    const { items = [] } = await r.json();
    return items;
}
export async function ghRepo({ user, name }: { user: string; name: string }) {
    const r = await fetch(`https://api.github.com/repos/${user}/${name}`, { headers: baseHeaders });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(`GitHub error ${r.status}`);
    return r.json();
}

export async function ghSearch(q: string) {
    if (!q.trim()) return [];
    const url = new URL("https://api.github.com/search/repositories");
    url.searchParams.set("q", q);
    url.searchParams.set("per_page", "10");
    const r = await fetch(url, { headers: baseHeaders });
    if (!r.ok) throw new Error(`GitHub error ${r.status}`);
    return (await r.json()).items ?? [];
}