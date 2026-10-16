import { spawn } from 'child_process';
import fetch from 'node-fetch';

/**
 * Start `npm run dev` and resolve with the local URL it prints — its own, not whatever
 * already holds 4321 (a stale server there once answered these tests).
 * @returns the spawned process and a promise of the server's URL
 */
export function startDevServer() {
    const proc = spawn('npm', ['run', 'dev'], { shell: true, stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    proc.stdout?.on('data', (d) => {
        try { stdout += d.toString(); } catch (e) { }
    });
    proc.stderr?.on('data', (d) => {
        try { stdout += d.toString(); } catch (e) { }
    });

    const readyPromise = new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Dev server start timed out')), 60000);
        const check = () => {
            const url = stdout.match(/https?:\/\/localhost:\d+/)?.[0];
            if (url) {
                clearTimeout(timeout);
                resolve(url);
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

/**
 * Poll a URL until it answers 2xx.
 * @param url the address to poll @param timeout milliseconds before giving up
 * @returns once the server answers; throws after the timeout
 */
export async function waitForServer(url: string, timeout = 60000) {
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
