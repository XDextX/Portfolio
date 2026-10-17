import { describe, it, expect, vi, afterEach } from 'vitest';
import { mockTextResponse } from './helpers/github-mocks';

// Spec 032: a repository's custom social preview, read through GraphQL (RF-4) and served from the
// site's own origin by a route that only relays the URL GitHub gave for a listed name (RF-5, RF-6).

const LISTED = 'listed-repo';
const HIDDEN = 'hidden-repo';
const PLAIN = 'plain-repo';
const IMG_LISTED = 'https://img.example.test/1';
const IMG_HIDDEN = 'https://img.example.test/2';
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);

const node = (name: string, custom: boolean, url: string | null) => ({ name, usesCustomOpenGraphImage: custom, openGraphImageUrl: url });
const NODES = [node(LISTED, true, IMG_LISTED), node(HIDDEN, true, IMG_HIDDEN), node(PLAIN, false, 'https://opengraph.example.test/generated')];

/** A fetch stand-in recording every URL: the search lists two repos, GraphQL the nodes, the image `image`. */
function github(image: () => Response = () => new Response(PNG, { headers: { 'Content-Type': 'image/png' } })) {
    const urls: string[] = [];
    vi.stubGlobal('fetch', async (u: unknown) => {
        const url = String(u);
        urls.push(url);
        if (url.includes('/search/')) return mockTextResponse(JSON.stringify({ items: [{ name: LISTED }, { name: PLAIN }] }));
        if (url.endsWith('/graphql')) return mockTextResponse(JSON.stringify({ data: { user: { repositories: { nodes: NODES } } } }));
        if (url === IMG_LISTED || url === IMG_HIDDEN) return image();
        return mockTextResponse('', 404);
    });
    return urls;
}

const load = async (token = 'test-token') => {
    vi.stubEnv('GITHUB_TOKEN', token);
    vi.resetModules();
    return import('../src/pages/lib/github');
};
const route = async (name: string) => {
    const { GET } = await import('../src/pages/api/v1/projects/preview/[name]');
    return GET({ params: { name } } as any);
};

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });

describe('previews from GitHub (spec 032 RF-4)', () => {
    it('keeps only the previews the owner uploaded', async () => {
        const { previewsFrom } = await load();
        const map = previewsFrom([...NODES, node('no-url', true, null), node('', true, IMG_LISTED)]);
        expect([...map.entries()]).toEqual([[LISTED, IMG_LISTED], [HIDDEN, IMG_HIDDEN]]);
        expect(previewsFrom([]).size).toBe(0);
    });

    it('asks GraphQL with the token, and nothing without one', async () => {
        let urls = github();
        let gh = await load();
        expect([...(await gh.listPreviews()).keys()]).toEqual([LISTED, HIDDEN]);
        expect(urls.filter((u) => u.endsWith('/graphql'))).toHaveLength(1);
        vi.unstubAllGlobals();
        urls = github();
        gh = await load('');
        expect((await gh.listPreviews()).size).toBe(0);
        expect(urls, 'a request without a token').toEqual([]);
    });

    it('reads the previews once per cache window', async () => {
        const urls = github();
        const gh = await load();
        await gh.listPreviews(1_000);
        await gh.listPreviews(2_000);
        expect(urls.filter((u) => u.endsWith('/graphql'))).toHaveLength(1);
    });
});

describe('preview route (spec 032 RF-5, RF-6)', () => {
    it('answers 404 for any name it does not list with a custom preview, fetching nothing from it', async () => {
        const offenders: string[] = [];
        for (const name of ['unknown-repo', PLAIN, HIDDEN, '../../etc/passwd', '']) {
            const urls = github();
            await load();
            const res = await route(name);
            if (res.status !== 404) offenders.push(`RF-5: ${JSON.stringify(name)} answered ${res.status}`);
            if (urls.includes(IMG_HIDDEN)) offenders.push(`RF-5: ${JSON.stringify(name)} fetched the hidden repo's image`);
            for (const u of urls) if (name && u.includes(name)) offenders.push(`RF-5: ${JSON.stringify(name)} reached ${u}`);
            vi.unstubAllGlobals();
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    it('serves the bytes with an image type and a public cache lifetime', async () => {
        github();
        await load();
        const res = await route(LISTED);
        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toMatch(/^image\//);
        expect(res.headers.get('Cache-Control')).toMatch(/^public\b/);
        expect(new Uint8Array(await res.arrayBuffer())).toEqual(PNG);
    });

    it('does not relay an upstream answer that is not an image', async () => {
        github(() => new Response('<html>login</html>', { headers: { 'Content-Type': 'text/html' } }));
        await load();
        const res = await route(LISTED);
        expect(res.status).toBe(502);
        expect(await res.text()).not.toContain('login');
    });
});

describe('a failed read (spec 032 RF-4)', () => {
    it('leaves the cards without previews instead of failing the page', async () => {
        vi.stubGlobal('fetch', async (u: unknown) => String(u).endsWith('/graphql') ? mockTextResponse('', 502) : mockTextResponse('', 404));
        const gh = await load();
        expect(await gh.listPreviewNames()).toEqual([]);
    });
});
