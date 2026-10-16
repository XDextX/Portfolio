import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

// Spec 019 RF-1: requests in different locales rendered at the same time each come back
// entirely in their own locale. Measured before the fix: 20/40 pages per round carried the
// other locale's strings. Runs on the e2e server (playwright.config.ts webServer, spec 015).

const BASE = 'http://localhost:4329';
const ROUNDS = 3;
const PER_ROUND = 40;
const LOCALES = ['es', 'en'] as const;
type Locale = (typeof LOCALES)[number];
const read = (l: Locale) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'i18n', 'locales', `${l}.json`), 'utf-8'));
const MESSAGES = { es: read('es'), en: read('en') };
const marks = (l: Locale): string[] => [MESSAGES[l].contact.tagline, MESSAGES[l].contact.form.submit];
// A POST page must also carry its own invalid outcome: proof it rendered the form's answer.
const postMarks = (l: Locale): string[] => [...marks(l), MESSAGES[l].contact.form.outcome.invalid];

test('concurrent requests each render in their own locale, plain POSTs included (RF-1)', async ({ request }) => {
    const offenders: string[] = [];
    for (let round = 0; round < ROUNDS; round++) {
        const pages = await Promise.all(Array.from({ length: PER_ROUND }, async (_, i) => {
            const lang: Locale = LOCALES[i % 2];
            // Two of every eight, one per locale: i % 2 alone would make every POST English.
            const post = i % 8 >= 6;
            const url = `${BASE}/?lang=${lang}`;
            // One in four is the plain contact POST: an empty body renders the page as invalid
            // and never reaches the sender. Astro answers 403 to a form POST with no Origin.
            const res = post
                ? await request.post(url, {
                    headers: { 'content-type': 'application/x-www-form-urlencoded', origin: BASE, 'x-e2e-client': randomUUID() },
                    data: '',
                })
                : await request.get(url);
            return { lang, method: post ? 'POST' : 'GET', html: await res.text() };
        }));
        let mixed = 0;
        for (const { lang, method, html } of pages) {
            const other: Locale = lang === 'es' ? 'en' : 'es';
            const foreign = marks(other).filter((s) => html.includes(s));
            const missing = (method === 'POST' ? postMarks(lang) : marks(lang)).filter((s) => !html.includes(s));
            if (foreign.length || missing.length) {
                mixed++;
                if (offenders.length < 6) offenders.push(`RF-1: a ${method} ?lang=${lang} page holds ${JSON.stringify(foreign)} and lacks ${JSON.stringify(missing)}`);
            }
        }
        if (mixed) offenders.push(`RF-1: round ${round + 1}, ${mixed}/${PER_ROUND} pages mixed`);
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
});
