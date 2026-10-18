import { describe, it, expect, vi, afterEach } from 'vitest';
import { mockTextResponse } from './helpers/github-mocks';

// Spec 037: a README's images rewritten to the site's own origin (RF-1, RF-6) and served by a route
// that only relays the N-th image GitHub's HTML points at, on GitHub's hosts (RF-2 to RF-5).

const CAMO_A = 'https://camo.githubusercontent.com/aaa';
const CAMO_B = 'https://camo.githubusercontent.com/bbb';
const RAW = 'https://raw.githubusercontent.com/u/r/main/logo.png';
const FOREIGN = 'https://evil.example.test/x.png';
const README = [
    '<h1>Title</h1>',
    `<p><a target="_blank" rel="noopener noreferrer nofollow" href="${CAMO_A}"><img src="${CAMO_A}" alt="Astro" data-canonical-src="https://img.shields.io/a" style="max-width: 100%;"></a> text</p>`,
    `<p><img src="${CAMO_B}" srcset="${CAMO_B} 2x" alt="B"></p>`,
    `<p><img alt="Logo" src="${RAW}"> <a href="https://example.test/docs">docs</a></p>`,
    `<p><img src="${FOREIGN}" alt="Foreign"></p>`,
].join('\n');
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 4, 5, 6]);

/** GitHub stubbed: the README for any repo, an image for the known hosts; every URL recorded. */
function github(image: () => Response = () => new Response(PNG, { headers: { 'Content-Type': 'image/png' } })) {
    const urls: string[] = [];
    vi.stubGlobal('fetch', async (u: unknown) => {
        const url = String(u);
        urls.push(url);
        if (url.endsWith('/readme')) return url.includes('/no-readme/') ? mockTextResponse('', 404) : mockTextResponse(README);
        return image();
    });
    return urls;
}

const load = async () => { vi.resetModules(); return import('../src/pages/lib/github'); };
const route = async (owner: string, name: string, n: string) => {
    const { GET } = await import('../src/pages/api/v1/projects/readme/[owner]/[name]/image/[n]');
    return GET({ params: { owner, name, n } } as any);
};

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

describe('README rewrite (spec 037 RF-1, RF-6)', () => {
    it('lists the images in order', async () => {
        const { readmeImageUrls } = await load();
        expect(readmeImageUrls(README)).toEqual([CAMO_A, CAMO_B, RAW, FOREIGN]);
    });

    it('points each image at its index on this origin, drops srcset, and changes nothing else', async () => {
        const { rewriteReadmeImages, readmeImagePath, USER } = await load();
        const out = rewriteReadmeImages(README, USER, 'repo');
        // \s, not \b: data-canonical-src would match a word boundary before "src".
        const paths = [...out.matchAll(/<img\b[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]);
        expect(paths).toEqual([0, 1, 2, 3].map((i) => readmeImagePath(USER, 'repo', i)));
        expect(paths.every((p) => p.startsWith('/'))).toBe(true);
        expect(out).not.toMatch(/\bsrcset=/);
        // Put the originals back by hand: what is left must be the input, byte for byte.
        let back = out;
        [CAMO_A, CAMO_B, RAW, FOREIGN].forEach((u, i) => { back = back.replace(`src="${readmeImagePath(USER, 'repo', i)}"`, `src="${u}"`); });
        expect(back).toBe(README.replace(` srcset="${CAMO_B} 2x"`, ''));
    });

    it('serves the rewritten HTML from one README fetch', async () => {
        const urls = github();
        const gh = await load();
        const html = await gh.getReadme(gh.USER, 'repo');
        expect(html).toContain(`src="${gh.readmeImagePath(gh.USER, 'repo', 0)}"`);
        await gh.getReadmeImage(gh.USER, 'repo', '0');
        expect(urls.filter((u) => u.endsWith('/readme'))).toHaveLength(1);
    });
});

describe('README image route (spec 037 RF-2 to RF-5)', () => {
    it('relays the N-th image with its type and safe headers', async () => {
        const urls = github();
        const { USER } = await load();
        const res = await route(USER, 'repo', '2');
        expect(res.status).toBe(200);
        expect(urls).toContain(RAW);
        expect(res.headers.get('Content-Type')).toMatch(/^image\//);
        expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
        expect(res.headers.get('Content-Security-Policy')).toMatch(/default-src 'none'/);
        expect(res.headers.get('Content-Security-Policy')).toMatch(/\bsandbox\b/);
        expect(res.headers.get('Cache-Control')).toMatch(/^public\b/);
        expect(new Uint8Array(await res.arrayBuffer())).toEqual(PNG);
    });

    it('answers 404 for every case it must refuse, fetching no image', async () => {
        const offenders: string[] = [];
        const { USER } = await load();
        for (const [owner, name, n] of [['torvalds', 'repo', '0'], [USER, 'no-readme', '0'], [USER, 'repo', '9'], [USER, 'repo', '-1'], [USER, 'repo', '1.5'], [USER, 'repo', 'x'], [USER, 'repo', '1e0'], [USER, 'repo', ' 1'], [USER, 'repo', '3']]) {
            const urls = github();
            await load();
            const res = await route(owner, name, n);
            if (res.status !== 404) offenders.push(`RF-3: ${owner}/${name}/${n} answered ${res.status}`);
            const images = urls.filter((u) => !u.endsWith('/readme'));
            if (images.length) offenders.push(`RF-3: ${owner}/${name}/${n} fetched ${images.join(', ')}`);
            vi.unstubAllGlobals();
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    it('does not relay an upstream answer that is not an image', async () => {
        github(() => new Response('<html>login</html>', { headers: { 'Content-Type': 'text/html' } }));
        const { USER } = await load();
        const res = await route(USER, 'repo', '0');
        expect(res.status).toBe(502);
        expect(await res.text()).not.toContain('login');
    });
});
