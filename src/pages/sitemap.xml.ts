import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
    const site = "https://portfolio-dext.vercel.app";
    //  rutas estáticas
    const urls = [
        { loc: `${site}/`, changefreq: "weekly", priority: "1.0" },

    ];

    // 2) (opcional) añadir rutas dinámicas: por ejemplo, si tienes detalle por proyecto:
    const projects = await fetch(`${site}/api/portfolio.json`).then(r => r.json());
    projects.forEach((p:any) => {
      urls.push({ loc: `${site}/proyectos/${encodeURIComponent(p.name)}`, changefreq: "monthly", priority: "0.7" });
    });

    const xml =
        `<?xml version="1.0" encoding="UTF-8"?>` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
        urls.map(u => `
      <url>
        <loc>${u.loc}</loc>
        <changefreq>${u.changefreq}</changefreq>
        <priority>${u.priority}</priority>
      </url>`).join("") +
        `</urlset>`;

    return new Response(xml, {
        headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
};
