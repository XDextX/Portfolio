import { test, expect } from '@playwright/test';
import { E2E_URL } from './helpers/server';
import { gotoPastOverlay } from './helpers/rendered';

// Spec 037 RF-1: a project page asks only this origin for its README's images. The two repositories
// whose READMEs carry images (measured 2026-10-17); between them at least one image must be found.

const PAGES = ['/proyectos/Portfolio', '/proyectos/XDextX'];
// The captured baseline (e2e/about.spec.ts): the avatar and its github.com redirect.
const BASELINE = new Set(['avatars.githubusercontent.com', 'github.com']);

test('README images load from this origin only (RF-1)', async ({ page }) => {
    const offenders: string[] = [];
    let found = 0;
    for (const route of PAGES) {
        const hosts = new Set<string>();
        const onRequest = (r: { url(): string }) => hosts.add(new URL(r.url()).host);
        page.on('request', onRequest);
        await gotoPastOverlay(page, `${E2E_URL}${route}`);
        await page.waitForLoadState('load');
        const imgs = await page.locator('.readme-body img').evaluateAll((list) => list.map((i) => {
            const img = i as HTMLImageElement;
            return { src: img.getAttribute('src') ?? '', srcset: img.hasAttribute('srcset'), origin: new URL(img.currentSrc || img.src).origin, loaded: img.complete && img.naturalWidth > 0 };
        }));
        page.off('request', onRequest);
        found += imgs.length;
        const origin = new URL(E2E_URL).origin;
        for (const [n, i] of imgs.entries()) {
            if (i.origin !== origin) offenders.push(`RF-1: ${route} image ${n} loads from ${i.origin}`);
            if (i.srcset) offenders.push(`RF-1: ${route} image ${n} keeps a srcset`);
            // An image broken at its source (camo answering 404) shows as 502, the spec's edge case;
            // anything else that fails to load is this site's fault.
            if (!i.loaded) {
                const status = (await page.request.get(`${origin}${i.src}`)).status();
                if (status !== 502) offenders.push(`RF-1: ${route} image ${n} (${i.src}) did not load: ${status}`);
            }
        }
        const extra = [...hosts].filter((h) => h !== new URL(E2E_URL).host && !BASELINE.has(h));
        if (extra.length) offenders.push(`RF-1: ${route} requests ${extra.join(', ')}`);
    }
    if (!found) offenders.push('data: no README image on either page, so the check would pass empty');
    expect(offenders, offenders.join('\n')).toEqual([]);
});
