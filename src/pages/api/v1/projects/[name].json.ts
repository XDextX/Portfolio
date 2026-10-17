import type { APIRoute } from "astro";
import { getRepo } from "../../../lib/github";

// One of the configured repositories as JSON; cached in github.ts with the pages (spec 023).
export const GET: APIRoute = async ({ params }) => {
    try {
        const repo = await getRepo(params.name!);
        if (!repo) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
        return new Response(JSON.stringify(repo), { headers: { "Content-Type": "application/json" } });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: "Unexpected error", detail: String(e) }), { status: 500 });
    }
};
