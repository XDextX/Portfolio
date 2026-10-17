import type { APIRoute } from "astro";
import { getPreview } from "@lib/github";

const MAX_AGE_S = 30 * 60;
const json = (body: object, status: number) =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

// A listed repository's uploaded social preview, served from this origin (constitution 2,
// spec 032): only the URL GitHub gave for the name is fetched, and only an image is relayed.
export const GET: APIRoute = async ({ params }) => {
    try {
        const upstream = await getPreview(String(params.name || ""));
        if (upstream === null) return json({ error: "Preview not found" }, 404);
        const type = upstream.headers.get("Content-Type") ?? "";
        if (!upstream.ok || !type.startsWith("image/")) return json({ error: "Preview unavailable" }, 502);
        return new Response(upstream.body, {
            status: 200,
            headers: { "Content-Type": type, "Cache-Control": `public, max-age=${MAX_AGE_S}` },
        });
    } catch (e: any) {
        return json({ error: "Unexpected error", detail: String(e) }, 500);
    }
};
