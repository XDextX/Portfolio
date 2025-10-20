import type { APIRoute } from "astro";
import { ghRepoReadme } from "@lib/github";

const cache: { [key: string]: { data: string; at: number } } = {};
const TTL_MS = 30 * 60 * 1000;

export const GET: APIRoute = async ({ params }) => {
    try {
        const { owner, name } = params;
        if (!owner || !name) return new Response(JSON.stringify({ error: "Missing params" }), { status: 400 });
        const key = owner + name;
        const data = cache[key];
        if (data && Date.now() - data.at < TTL_MS) {
            console.info("cache hit");
            return new Response(data.data, { headers: { "Content-Type": "text/plain" } });
        } console.log(data);

        const readme = await ghRepoReadme({ user: owner, name: name });
        return new Response(readme, { headers: { "Content-Type": "text/plain" } });
    } catch (e: any) {
        console.error(e);
        return new Response(JSON.stringify({ error: "Unexpected error", detail: String(e) }), { status: 500 });
    }
};