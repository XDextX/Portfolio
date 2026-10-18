import { test, expect } from '@playwright/test';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { E2E_URL } from './helpers/server';
import { gotoPastOverlay } from './helpers/rendered';

// Spec 038: every public sheet linked with ?v= the hash of public/styles (RF-1), in today's order
// (RF-3). The hash is recomputed here by this test's own reader, not imported from the site.

const DIR = path.join(process.cwd(), 'public', 'styles');
function ownHash(): string {
    const files: string[] = [];
    const walk = (d: string) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); e.isDirectory() ? walk(f) : files.push(path.relative(DIR, f).split(path.sep).join('/')); } };
    walk(DIR);
    const h = createHash('sha256');
    for (const f of files.sort()) h.update(f).update('\0').update(fs.readFileSync(path.join(DIR, f))).update('\0');
    return h.digest('hex').slice(0, 12);
}
const ORDER = ['00-tokens', '05-fonts', '01-base', '02-utilities', '03-components', '04-layouts', 'themes/light', 'themes/dark'].map((n) => `/styles/${n}.css`);

for (const route of ['/', '/proyectos']) {
    test(`public sheets carry the content version, in order — ${route} (RF-1, RF-3)`, async ({ page }) => {
        await gotoPastOverlay(page, `${E2E_URL}${route}`);
        const hrefs = await page.locator('link[rel="stylesheet"]').evaluateAll((ls) => ls.map((l) => l.getAttribute('href') ?? '').filter((h) => h.startsWith('/styles/')));
        const want = ownHash();
        const offenders: string[] = [];
        const urls = hrefs.map((h) => new URL(h, 'http://x'));
        const paths = urls.map((u) => u.pathname);
        if (JSON.stringify(paths) !== JSON.stringify(ORDER)) offenders.push(`RF-3: sheets are ${paths.join(', ')}`);
        urls.forEach((u) => { if (u.searchParams.get('v') !== want) offenders.push(`RF-1: ${u.pathname} has v=${u.searchParams.get('v')}, not ${want}`); });
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
}
