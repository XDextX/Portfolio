import type { APIRoute } from "astro";
import { listRepos } from "../lib/github";

// The configured repositories as JSON; cached in github.ts with the pages (spec 023).
export const GET: APIRoute = async () => {
    try {
        return new Response(JSON.stringify(await listRepos()), { headers: { "Content-Type": "application/json" } });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: "Unexpected error", detail: String(e) }), { status: 500 });
    }
};
