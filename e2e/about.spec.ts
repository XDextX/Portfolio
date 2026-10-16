import { test, expect } from '@playwright/test';
import fetch from 'node-fetch';
import { startDevServer, waitForServer } from './helpers/dev-server';

let DEV_URL = '';

// Captured 2026-10-11 by loading `/` from `npm run dev` and recording every
// request host (listener attached before goto, two runs, same set). `localhost`
// is the dev origin, filtered at runtime; the remote pair is the avatar
// redirect `github.com` -> `avatars.githubusercontent.com`.
const HOME_HOSTS = new Set(['avatars.githubusercontent.com', 'github.com']);

test.describe.serial('About section e2e', () => {
    let proc: any;

    test.beforeAll("Before all", async () => {
        const started = startDevServer();
        proc = started.proc;
        DEV_URL = await started.readyPromise;
        // after stdout indicates ready, also poll the url
        await waitForServer(DEV_URL, 30000);
    });

    test.afterAll(() => {
        if (proc && !proc.killed) proc.kill();
    });

    test('home requests no host beyond the captured baseline', async ({ page }) => {
        const hosts = new Set<string>();
        page.on('request', (r) => hosts.add(new URL(r.url()).host));
        await page.goto(DEV_URL);

        expect(hosts.size, 'expected the home to issue at least one request').toBeGreaterThan(0);

        const origin = new URL(DEV_URL).host;
        const extra = [...hosts].filter((h) => h !== '' && h !== origin && !HOME_HOSTS.has(h));
        expect(extra, `the home requests hosts it did not request before: ${extra.join(', ')}`).toEqual([]);
    });

    test('value proposition is the second section of the home', async ({ page }) => {
        await page.goto(DEV_URL);

        const ids = await page.$$eval('main > section', (els) => els.map((e) => e.id));
        expect(ids[1]).toBe('ValueProposition');
    });

    test('CV download link responds 200 and mailto exists', async ({ page }) => {
        await page.goto(DEV_URL);

        // Find first anchor that links to cv/ folder
        const anchors = await page.$$eval('a', as => as.map(a => a.getAttribute('href')));
        const cvHref = anchors.find(h => h && h.includes('cv/'));
        expect(cvHref).toBeTruthy();

        // Resolve absolute URL
        const cvUrl = cvHref!.startsWith('http') ? cvHref! : new URL(cvHref!, DEV_URL).href;

        const resp = await fetch(cvUrl);
        expect(resp.status).toBe(200);

        // mailto exists
        const mailExists = anchors.some(h => h && h.startsWith('mailto:'));
        expect(mailExists).toBe(true);

        // Avatar image exists in DOM
        const imgs = await page.$$eval('img', imgs => imgs.map(i => ({ src: i.getAttribute('src'), alt: i.getAttribute('alt') })));
        const avatar = imgs.find(s => s && s.src && s.src.includes('github.com'));
        expect(avatar).toBeTruthy();

        // The avatar alt is the computed full name, unconditionally (spec 010).
        const { ABOUT } = await import('../src/data/about');
        expect(imgs.some(i => i && i.alt === ABOUT.name), `no img with alt "${ABOUT.name}"`).toBe(true);
    });
});
