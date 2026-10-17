import type { APIRoute } from "astro";
import { getReadme } from "@lib/github";

const MAX_AGE_S = 30 * 60;
const json = (body: object, status: number) =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

// A configured repository's README as GitHub renders it; another owner is a 404 before any
// request (spec 021), and the cache is github.ts's, shared with the pages (spec 023).
export const GET: APIRoute = async ({ params }) => {
    try {
        const owner = String(params.owner || "");
        const name = String(params.name || "");
        if (!owner || !name) return json({ error: "Missing params: owner/name" }, 400);
        const readme = await getReadme(owner, name);
        if (readme === null) return json({ error: "README not found" }, 404);
        return new Response(readme, {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": `public, max-age=${MAX_AGE_S}` },
        });
    } catch (e: any) {
        return json({ error: "Unexpected error", detail: String(e) }, 500);
    }
};
