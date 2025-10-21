// src/pages/api/v1/projects/readme/[owner]/[name].ts
import type { APIRoute } from "astro";
import { ghRepoReadme } from "@lib/github";

type CacheEntry = { data: string; at: number };
const cache: Record<string, CacheEntry> = {};
const TTL_MS = 30 * 60 * 1000; // 30 min

export const GET: APIRoute = async ({ params }) => {
    try {
        const owner = String(params.owner || "");
        const name = String(params.name || "");
        if (!owner || !name) {
            return new Response(
                JSON.stringify({ error: "Missing params: owner/name" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const key = `${owner}/${name}`;
        const entry = cache[key];

        // Cache HIT
        if (entry && Date.now() - entry.at < TTL_MS) {
            return new Response(entry.data, {
                status: 200,
                headers: {
                    "Content-Type": "text/html; charset=utf-8",
                    "Cache-Control": `public, max-age=${TTL_MS / 1000}`,
                    "X-Cache": "HIT",
                },
            });
        }

        // Fetch desde GitHub
        const readme = await ghRepoReadme({ user: owner, name });
        if (readme === null) {
            return new Response(
                JSON.stringify({ error: "README not found" }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        // Guardar en caché (MISS)
        cache[key] = { data: readme, at: Date.now() };

        return new Response(readme, {
            status: 200,
            headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": `public, max-age=${TTL_MS / 1000}`,
                "X-Cache": "MISS",
            },
        });
    } catch (e: any) {
        console.error(e);
        return new Response(
            JSON.stringify({ error: "Unexpected error", detail: String(e) }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};
