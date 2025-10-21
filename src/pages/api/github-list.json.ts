import type { APIRoute } from "astro";
import { ghListByTopic } from "../lib/github";

const GITHUB_TOPIC = import.meta.env.GITHUB_TOPIC;

let cache: { data: any; at: number, key: string } | null = null;
const TTL_MS = 30 * 60 * 1000;

export const GET: APIRoute = async () => {
    try {
        if (cache && Date.now() - cache.at < TTL_MS && cache.key === GITHUB_TOPIC)
            return new Response(JSON.stringify(cache.data), { headers: { "Content-Type": "application/json" } });
        const items = await ghListByTopic({ topic: GITHUB_TOPIC });
        cache = { data: items, at: Date.now(), key: GITHUB_TOPIC };
        return new Response(JSON.stringify(items), { headers: { "Content-Type": "application/json" } });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: "Unexpected error", detail: String(e) }), { status: 500 });
    }
};
