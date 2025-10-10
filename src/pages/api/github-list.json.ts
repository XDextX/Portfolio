import type { APIRoute } from "astro";

const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;
const GITHUB_USERNAME = import.meta.env.GITHUB_USERNAME || "XDextX";
const GITHUB_TOPIC = import.meta.env.GITHUB_TOPIC || "portfolio";

let cache: { data: any; at: number } | null = null;
const TTL_MS = 30 * 60 * 1000;

export const GET: APIRoute = async () => {
    try {
        if (cache && Date.now() - cache.at < TTL_MS) {
            return new Response(JSON.stringify(cache.data), { headers: { "Content-Type": "application/json" } });
        }
        const url = new URL("https://api.github.com/search/repositories");
        // url.searchParams.set("q", `user:${GITHUB_USERNAME} topic:${GITHUB_TOPIC}`);
        url.searchParams.set("q", `user:${GITHUB_USERNAME}`);
        url.searchParams.set("per_page", "50");
        url.searchParams.set("sort", "updated");
        url.searchParams.set("order", "desc");

        const res = await fetch(url.toString(), {
            headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
                "User-Agent": `${GITHUB_USERNAME}-portfolio`
            }
        });
        if (!res.ok) {
            return new Response(JSON.stringify({ error: "GitHub API error" }), { status: 500 });
        }
        const data = await res.json();
        const items = (data.items || []).map((r: any) => ({
            id: r.id, name: r.name, full_name: r.full_name,
            description: r.description, html_url: r.html_url,
            homepage: r.homepage, language: r.language,
            topics: r.topics || [], stargazers_count: r.stargazers_count,
            forks_count: r.forks_count, updated_at: r.updated_at
        }));
        console.log(items);


        cache = { data: items, at: Date.now() };
        return new Response(JSON.stringify(items), { headers: { "Content-Type": "application/json" } });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: "Unexpected error", detail: String(e) }), { status: 500 });
    }
};
