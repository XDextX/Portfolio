// src/pages/api/v1/projects/[name].ts
import type { APIRoute } from "astro";
import { ghRepo } from "../../../lib/github";
let cache: { [key: string]: { data: any; at: number } } = {};
const TTL_MS = 30 * 60 * 1000;
export const GET: APIRoute = async ({ params }) => {
    try {
        const name = params.name!;
        const data = cache[name];
        if (data && Date.now() - data.at < TTL_MS) {
            console.info("cache hit");
            return new Response(JSON.stringify(data.data), { headers: { "Content-Type": "application/json" } });
        }
        const repo = await ghRepo({ user: "XDextX", name });
        if (!repo) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
        cache[name] = { data: repo, at: Date.now() };
        return new Response(JSON.stringify(repo), { headers: { "Content-Type": "application/json" } });
    } catch (e: any) {
        console.error(e);
        return new Response(JSON.stringify({ error: "Unexpected error", detail: String(e) }), { status: 500 });
    }

};
