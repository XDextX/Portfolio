import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { E2E_URL } from './helpers/server';

// Spec 021 RF-2: an unknown project answers at its own URL with the not-found page and 404,
// without the 302 to /404 it used to send.

const read = (l: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'i18n', 'locales', `${l}.json`), 'utf-8'));

for (const locale of ['es', 'en'] as const) {
    test(`an unknown project is a 404 at its own URL, no redirect — ${locale} (RF-2)`, async ({ request }) => {
        const res = await request.get(`${E2E_URL}/proyectos/no-such-repo-021?lang=${locale}`, { maxRedirects: 0 });
        const html = await res.text();
        const offenders: string[] = [];
        if (res.status() !== 404) offenders.push(`RF-2: status ${res.status()}, not 404`);
        if (res.headers()['location']) offenders.push(`RF-2: redirects to ${res.headers()['location']}`);
        if (!html.includes(read(locale).notFound.title)) offenders.push('RF-2: the not-found title is missing');
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
}
