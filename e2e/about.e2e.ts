import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import fetch from 'node-fetch';

const DEV_URL = 'http://localhost:3000';

function startDevServer() {
    const proc = spawn('npm', ['run', 'dev'], { shell: true, stdio: 'pipe' });
    return proc;
}

async function waitForServer(url: string, timeout = 20000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        try {
            const r = await fetch(url);
            if (r.ok) return;
        } catch (e) {
            // ignore
        }
        await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error(`Server did not become ready at ${url}`);
}

test.describe.serial('About section e2e', () => {
    let proc: any;

    test.beforeAll(async () => {
        proc = startDevServer();
        await waitForServer(DEV_URL);
    });

    test.afterAll(() => {
        if (proc && !proc.killed) proc.kill();
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
        const imgs = await page.$$eval('img', imgs => imgs.map(i => i.getAttribute('src')));
        const avatar = imgs.find(s => s && s.includes('github.com')); // ABOUT.avatar is GitHub URL
        expect(avatar).toBeTruthy();
    });
});
