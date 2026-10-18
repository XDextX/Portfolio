import { test, expect, type Page } from '@playwright/test';
import { E2E_URL } from './helpers/server';
import { CANONICAL_ORIGIN } from '../src/data/site';

// Spec 042: every identity URL names the canonical origin, whatever origin serves the page (the
// e2e server is localhost, a preview-like origin). The social tags keep the serving origin (034).

/** The head's identity URLs and og:url, as the browser holds them. */
const head = (page: Page) => page.evaluate(() => {
    const href = (sel: string) => document.querySelector<HTMLLinkElement>(sel)?.getAttribute('href');
    return {
        canonical: href('link[rel="canonical"]'),
        es: href('link[rel="alternate"][hreflang="es-CR"]'),
        en: href('link[rel="alternate"][hreflang="en-US"]'),
        def: href('link[rel="alternate"][hreflang="x-default"]'),
        ogUrl: document.querySelector('meta[property="og:url"]')?.getAttribute('content'),
    };
});

/** Every `url` key in every JSON-LD block, nested ones included. */
const jsonLdUrls = (page: Page) => page.evaluate(() => {
    const out: string[] = [];
    const walk = (v: any) => {
        if (Array.isArray(v)) v.forEach(walk);
        else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { if (k === 'url' && typeof x === 'string') out.push(x); else walk(x); }
    };
    document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => walk(JSON.parse(s.textContent!)));
    return out;
});

for (const route of ['/', '/proyectos?cat=backend&lang=en']) {
    test(`${route}: canonical and hreflang name the canonical origin, og:url the serving one (RF-1)`, async ({ page }) => {
        await page.goto(E2E_URL + route);
        const path = new URL(E2E_URL + route).pathname;
        expect(await head(page)).toEqual({
            canonical: `${CANONICAL_ORIGIN}${path}`,
            es: `${CANONICAL_ORIGIN}${path}`,
            en: `${CANONICAL_ORIGIN}${path}?lang=en`,
            def: `${CANONICAL_ORIGIN}${path}`,
            ogUrl: `${E2E_URL}${path}`,
        });
    });
}

test('a project page and the 404: the head names the canonical origin (RF-1)', async ({ page }) => {
    await page.goto(`${E2E_URL}/proyectos?lang=es`);
    const href = (await page.locator('a[href^="/proyectos/"]').first().getAttribute('href'))!;
    await page.goto(E2E_URL + href);
    const project = await head(page);
    expect([project.canonical, project.es, project.def]).toEqual(Array(3).fill(`${CANONICAL_ORIGIN}${href}`));
    expect(project.en).toBe(`${CANONICAL_ORIGIN}${href}?lang=en`);
    expect(project.ogUrl!.startsWith(E2E_URL)).toBe(true);

    await page.goto(`${E2E_URL}/proyectos/__missing__`);
    const missing = await head(page);
    expect([missing.canonical, missing.es, missing.en, missing.def].filter((u) => !u!.startsWith(`${CANONICAL_ORIGIN}/`))).toEqual([]);
    expect(missing.ogUrl!.startsWith(E2E_URL)).toBe(true);
});

test('JSON-LD urls name the canonical origin, each with its path rule (RF-4)', async ({ page }) => {
    await page.goto(`${E2E_URL}/?lang=es`);
    expect(await jsonLdUrls(page)).toEqual(expect.arrayContaining([CANONICAL_ORIGIN]));
    expect((await jsonLdUrls(page)).filter((u) => !u.startsWith(CANONICAL_ORIGIN))).toEqual([]);

    await page.goto(`${E2E_URL}/proyectos?cat=backend&lang=en`);
    const collection = await jsonLdUrls(page);
    expect(collection).toContain(`${CANONICAL_ORIGIN}/proyectos?cat=backend&lang=en`);
    expect(collection.filter((u) => !u.startsWith(CANONICAL_ORIGIN))).toEqual([]);

    await page.goto(`${E2E_URL}/proyectos?lang=es`);
    const href = (await page.locator('a[href^="/proyectos/"]').first().getAttribute('href'))!;
    await page.goto(E2E_URL + href);
    const project = await jsonLdUrls(page);
    expect(project).toContain(`${CANONICAL_ORIGIN}${href}`);
    expect(project.filter((u) => !u.startsWith(CANONICAL_ORIGIN))).toEqual([]);
});

test('the sitemap lists only canonical <loc>s (RF-2)', async ({ request }) => {
    const xml = await (await request.get(`${E2E_URL}/sitemap.xml`)).text();
    const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
    expect(locs.length).toBeGreaterThanOrEqual(2);
    expect(locs.filter((l) => !l.startsWith(`${CANONICAL_ORIGIN}/`))).toEqual([]);
});

test('robots.txt has one canonical Sitemap line and its directives, served by the route (RF-3)', async ({ request }) => {
    const res = await request.get(`${E2E_URL}/robots.txt`);
    expect(res.status()).toBe(200);
    const lines = (await res.text()).split('\n').map((l) => l.trim()).filter(Boolean);
    expect(lines.filter((l) => l.startsWith('Sitemap:'))).toEqual([`Sitemap: ${CANONICAL_ORIGIN}/sitemap.xml`]);
    expect(lines).toEqual(expect.arrayContaining(['User-agent: *', 'Allow: /', 'Disallow: /api/']));
});
