import type { APIRoute } from "astro";
import { CANONICAL_ORIGIN } from "../data/site";

/** Writes robots.txt from the canonical origin, so the Sitemap line never names a second host (spec 042). */
export const GET: APIRoute = () =>
    new Response(
        `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${CANONICAL_ORIGIN}/sitemap.xml\n`,
        { headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
