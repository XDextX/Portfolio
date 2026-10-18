import type { APIRoute } from "astro";
import { getReadmeImage } from "@lib/github";

const MAX_AGE_S = 30 * 60;
const json = (body: object, status: number) =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

// A README's N-th image, from this origin (constitution 2, spec 037). Only an image is relayed, and
// an SVG opened directly here can run nothing: no sources, sandboxed, no type sniffing.
export const GET: APIRoute = async ({ params }) => {
    try {
        const upstream = await getReadmeImage(String(params.owner || ""), String(params.name || ""), String(params.n || ""));
        if (upstream === null) return json({ error: "Image not found" }, 404);
        const type = upstream.headers.get("Content-Type") ?? "";
        if (!upstream.ok || !type.startsWith("image/")) return json({ error: "Image unavailable" }, 502);
        return new Response(upstream.body, {
            status: 200,
            headers: {
                "Content-Type": type,
                "Cache-Control": `public, max-age=${MAX_AGE_S}`,
                "X-Content-Type-Options": "nosniff",
                "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
            },
        });
    } catch (e: any) {
        return json({ error: "Unexpected error", detail: String(e) }, 500);
    }
};
