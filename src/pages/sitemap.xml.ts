import type { APIRoute } from "astro";

const SITE = "https://portfolio-dext.vercel.app";
const TTL_MS = 30 * 60 * 1000;

let cache: { xml: string; at: number } | null = null;

type SitemapUrl = {
    loc: string;
    changefreq: "daily" | "weekly" | "monthly";
    priority: string;
};

export const GET: APIRoute = async ({ site }) => {
    if (cache && Date.now() - cache.at < TTL_MS) {
        return new Response(cache.xml, {
            headers: {
                "Content-Type": "application/xml; charset=utf-8",
                "Cache-Control": `public, max-age=${TTL_MS / 1000}`,
            },
        });
    }

    const origin = (site?.origin ?? SITE).replace(/\/$/, "");

    const urls: SitemapUrl[] = [
        { loc: `${origin}/`, changefreq: "weekly", priority: "1.0" },
        { loc: `${origin}/proyectos`, changefreq: "weekly", priority: "0.8" },
    ];

    // If the repo listing fails the sitemap is still valid with the static
    // routes: a dead API must not turn this into a 500.
    try {
        const res = await fetch(new URL("/api/github-list.json", site ?? origin));
        if (res.ok) {
            const payload = await res.json();
            const repos: Array<{ name?: string }> = Array.isArray(payload)
                ? payload
                : Array.isArray(payload?.items)
                    ? payload.items
                    : [];

            for (const repo of repos) {
                if (!repo?.name) continue;
                urls.push({
                    loc: `${origin}/proyectos/${encodeURIComponent(repo.name)}`,
                    changefreq: "monthly",
                    priority: "0.7",
                });
            }
        }
    } catch {
        // no project detail; emit the static routes only
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
        urls.map((u) => `
      <url>
        <loc>${u.loc}</loc>
        <changefreq>${u.changefreq}</changefreq>
        <priority>${u.priority}</priority>
      </url>`).join("") +
        `</urlset>`;

    cache = { xml, at: Date.now() };

    return new Response(xml, {
        headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": `public, max-age=${TTL_MS / 1000}`,
        },
    });
};
