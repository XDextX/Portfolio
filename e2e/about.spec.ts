import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import fetch from 'node-fetch';

const DEV_URL = 'http://localhost:3000';

function startDevServer() {
    const proc = spawn('npm', ['run', 'dev'], { shell: true, stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    proc.stdout?.on('data', (d) => {
        try { stdout += d.toString(); } catch (e) { }
    });
    proc.stderr?.on('data', (d) => {
        try { stdout += d.toString(); } catch (e) { }
    });

    const readyPromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Dev server start timed out')), 60000);
        const check = () => {
            // Astro prints a local URL like "Local: http://localhost:3000"
            if (/https?:\/\/localhost:\d+/.test(stdout) || /Local:.*http/.test(stdout)) {
                clearTimeout(timeout);
                resolve();
            }
        };
        proc.stdout?.on('data', () => check());
        proc.stderr?.on('data', () => check());
        // also poll stdout periodically
        const interval = setInterval(() => {
            check();
            if (proc.killed) {
                clearInterval(interval);
                clearTimeout(timeout);
                reject(new Error('Dev server process exited early'));
            }
        }, 500);
    });

    return { proc, readyPromise };
}

async function waitForServer(url: string, timeout = 60000) {
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
        const started = startDevServer();
        proc = started.proc;
        await started.readyPromise;
        // after stdout indicates ready, also poll the url
        await waitForServer(DEV_URL, 30000);
    }, 70000);

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
        const imgs = await page.$$eval('img', imgs => imgs.map(i => ({ src: i.getAttribute('src'), alt: i.getAttribute('alt') })));
        const avatar = imgs.find(s => s && s.src && s.src.includes('github.com'));
        expect(avatar).toBeTruthy();

        // Check avatar alt equals ABOUT.name from data file
        const fs = await import('fs');
        const path = await import('path');
        const aboutSrc = fs.readFileSync(path.resolve(process.cwd(), 'src', 'data', 'about.ts'), 'utf-8');
        const match = aboutSrc.match(/name:\s*"([^"]+)"/);
        const expectedName = match ? match[1] : null;
        if (expectedName) {
            const altMatch = imgs.find(i => i && i.alt === expectedName);
            expect(altMatch).toBeTruthy();
        }
    });
});
