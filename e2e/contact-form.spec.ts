import { E2E_URL as BASE } from './helpers/server';
import { test, expect, type Page, type Browser } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { THEMES, openIn, installHelpers, settled, type Theme } from './helpers/rendered';
import { contrast, parseColour, parseGradients, composites, worstPoint } from '../tests/helpers/colour';
import { FIELD_LIMITS } from '../src/pages/lib/contact';
import { STUB_FAIL_SUBJECT } from './helpers/stub-sender';

// Spec 015: the contact form, on the e2e server (playwright.config.ts webServer, stub sender). RF-1–3 rendering, RF-13 client assets, RF-15–17 plain, RF-18–24 enhanced.

const SECTION = '#Contact';
const FORM = `${SECTION} form[data-contact-form]`;
const LOCALES = ['es', 'en'] as const;
const FIELDS = ['name', 'email', 'subject', 'message'] as const;
type Field = (typeof FIELDS)[number];
// Spec 015 Decision 6, the approved wording, dated 2026-10-15.
const PRIVACY = {
    es: 'Solo para responderte; este sitio no guarda tu mensaje. Se envía a través de Mailtrap.',
    en: 'Only used to reply to you; this site does not store your message. It is sent through Mailtrap.',
};
const json = (l: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'i18n', 'locales', `${l}.json`), 'utf-8'));
const tr = (l: string) => (key: string): string => key.split('.').reduce((o: any, k) => o?.[k], json(l)) ?? `(missing ${key})`;
const LABEL_KEYS: Record<Field, string> = { name: 'contact.form.name', email: 'about.social.email', subject: 'contact.form.subject', message: 'contact.form.message' };
const VALID = { name: 'Ana Ruiz', email: 'ana@example.com', subject: 'Hola', message: 'Un mensaje breve.' };

const field = (page: Page, f: Field) => page.locator(`${FORM} [name="${f}"]`);

async function fill(page: Page, values: Record<Field, string>) {
    for (const f of FIELDS) await field(page, f).fill(values[f]);
}

// A fresh limiter key per test (the seam reads x-e2e-client on the e2e server only).
async function freshPage(browser: Browser, js = true) {
    const ctx = await browser.newContext({ javaScriptEnabled: js, baseURL: BASE, extraHTTPHeaders: { 'x-e2e-client': randomUUID() } });
    return { ctx, page: await ctx.newPage() };
}

// html:focus-within makes scrolling smooth once a field has focus; under load every retried
// click restarted an animated scroll and the button never held still. Smooth scrolling is not
// under test, so each loaded page drops it.
const steady = (page: Page) => page.locator('html').evaluate((h) => h.style.setProperty('scroll-behavior', 'auto', 'important'));

async function open(page: Page, locale: string, theme: Theme = 'light') {
    await openIn(page, BASE, theme, `/?lang=${locale}`);
    await steady(page);
    await page.locator(SECTION).scrollIntoViewIfNeeded();
}

// A click before astro:page-load binds the script submits natively; wait for the binding.
const enhanced = (page: Page) => page.locator(`${FORM}[data-enhanced]`).waitFor({ state: 'attached' });
const submitButton = async (page: Page) => page.locator(`${FORM} button[type="submit"]`);
const statusText = (page: Page) => page.locator(`${FORM} [data-contact-status]`).textContent().then((t) => (t ?? '').trim());
const values = (page: Page) => Promise.all(FIELDS.map((f) => field(page, f).inputValue()));
const describedBy = (page: Page, f: Field) => field(page, f).evaluate((el) => (el.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean).map((id) => document.getElementById(id)?.textContent?.trim() ?? '').join(' '));

test.describe('contact form (spec 015)', () => {
    test.describe.configure({ mode: 'default' });

    for (const locale of LOCALES) {
        test(`names, privacy line, limits and trap — ${locale} (RF-1, RF-2, RF-3, NFR)`, async ({ browser }) => {
            const { ctx, page } = await freshPage(browser);
            await open(page, locale);
            const t = tr(locale);
            const offenders: string[] = [];
            for (const f of FIELDS) {
                const named = page.locator(FORM).getByRole('textbox', { name: t(LABEL_KEYS[f]), exact: true });
                if ((await named.count()) !== 1) offenders.push(`RF-1: no field named "${t(LABEL_KEYS[f])}"`);
                const r = await field(page, f).evaluate((el) => ({ required: (el as HTMLInputElement).required, max: (el as HTMLInputElement).maxLength }));
                if (!r.required || r.max !== FIELD_LIMITS[f]) offenders.push(`RF-3: ${f} is required=${r.required} maxlength=${r.max}, not ${FIELD_LIMITS[f]}`);
            }
            if ((await page.locator(FORM).getByRole('button', { name: t('contact.form.submit'), exact: true }).count()) !== 1) offenders.push(`RF-1: no button named "${t('contact.form.submit')}"`);
            if (t('contact.form.privacy') !== PRIVACY[locale]) offenders.push(`RF-2: ${locale}.json privacy is "${t('contact.form.privacy')}"`);
            const privacy = await page.locator(FORM).getByText(PRIVACY[locale], { exact: true }).count();
            if (privacy !== 1) offenders.push('RF-2: the privacy line is not in the form');
            const trap = await page.locator(`${FORM} [name="website"]`).evaluate((el) => {
                const wrap = el.closest('[aria-hidden="true"]');
                const b = el.getBoundingClientRect();
                return { tab: (el as HTMLElement).tabIndex, auto: el.getAttribute('autocomplete'), hidden: !!wrap, off: b.right <= 0 || b.bottom <= 0 || b.left >= innerWidth || b.width * b.height <= 1 };
            }).catch(() => null);
            if (!trap) offenders.push('NFR: no honeypot field');
            else if (trap.tab !== -1 || trap.auto !== 'off' || !trap.hidden || !trap.off) offenders.push(`NFR: honeypot tab=${trap.tab} autocomplete=${trap.auto} aria-hidden=${trap.hidden} offscreen=${trap.off}`);
            await ctx.close();
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }

    test('plain: scripts off, each outcome on the returned page, values kept, none in the URL (RF-15, RF-16, RF-17, RF-23)', async ({ browser }) => {
        const { ctx, page } = await freshPage(browser, false);
        const t = tr('es');
        const offenders: string[] = [];
        // RF-17: checked after every submit; a value leaked into the action shows on the next one.
        const noValueInUrl = (v: Record<Field, string>) => { for (const x of Object.values(v)) if (page.url().includes(encodeURIComponent(x)) || page.url().includes(x)) offenders.push(`RF-17: the URL holds "${x}"`); };
        const typed: Record<Field, string>[] = [];
        const submit = async (v: Record<Field, string>) => {
            typed.push(v);
            await fill(page, v);
            const posted = page.waitForResponse((r) => r.request().method() === 'POST');
            await (await submitButton(page)).click();
            await posted;
            await page.waitForLoadState('load');
            await steady(page);
            for (const earlier of typed) noValueInUrl(earlier);
        };
        await open(page, 'es');
        await submit(VALID);
        if ((await statusText(page)) !== t('contact.form.outcome.sent')) offenders.push(`RF-15: sent reads "${await statusText(page)}"`);
        const bad = { ...VALID, email: 'a@b' };
        await submit(bad);
        if ((await statusText(page)) !== t('contact.form.outcome.invalid')) offenders.push(`RF-15: invalid reads "${await statusText(page)}"`);
        if (JSON.stringify(await values(page)) !== JSON.stringify(FIELDS.map((f) => bad[f]))) offenders.push('RF-16: invalid lost the typed values');
        if ((await describedBy(page, 'email')) !== t('contact.form.errors.email')) offenders.push(`RF-23: email is described by "${await describedBy(page, 'email')}"`);
        const failing = { ...VALID, subject: STUB_FAIL_SUBJECT };
        await submit(failing);
        if ((await statusText(page)) !== t('contact.form.outcome.failed')) offenders.push(`RF-15: failed reads "${await statusText(page)}"`);
        if (JSON.stringify(await values(page)) !== JSON.stringify(FIELDS.map((f) => failing[f]))) offenders.push('RF-16: failed lost the typed values');
        await submit(VALID); // third accepted (sent, the failed one, this)
        await submit(VALID);
        if ((await statusText(page)) !== t('contact.form.outcome.limited')) offenders.push(`RF-15: the fourth accepted reads "${await statusText(page)}"`);
        if (JSON.stringify(await values(page)) !== JSON.stringify(FIELDS.map((f) => VALID[f]))) offenders.push('RF-16: limited lost the typed values');
        await ctx.close();
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    test('enhanced: no navigation, live outcomes, keep or clear, focus, one request (RF-18 – RF-24)', async ({ browser }) => {
        const { ctx, page } = await freshPage(browser);
        const t = tr('en');
        const offenders: string[] = [];
        await open(page, 'en');
        await enhanced(page);
        await page.evaluate(() => { (window as any).__marker = 1; });
        const url = page.url();
        let loads = 0;
        page.on('load', () => loads++); // a document load; history.replaceState is not one
        const send = async (v: Record<Field, string>) => {
            await fill(page, v);
            const before = await statusText(page);
            const res = page.waitForResponse((r) => r.url().endsWith('/api/contact'));
            await (await submitButton(page)).click();
            await res;
            // The response lands before the script has read it, and the old outcome is still shown;
            // wait for a new one, set a frame after the clear. No two consecutive sends repeat one.
            await page.waitForFunction(([sel, old]) => {
                const st = document.querySelector(sel);
                const text = st?.textContent?.trim() ?? '';
                return !!text && text !== old && !st?.closest('form')?.hasAttribute('aria-busy');
            }, [`${FORM} [data-contact-status]`, before] as const);
        };
        await send(VALID);
        if ((await statusText(page)) !== t('contact.form.outcome.sent')) offenders.push(`RF-22: sent announces "${await statusText(page)}"`);
        if ((await values(page)).some((v) => v !== '')) offenders.push('RF-21: sent did not clear the form');
        if ((await page.locator(`${FORM} [data-contact-status]`).getAttribute('aria-live')) !== 'polite') offenders.push('RF-22: the status is not a polite live region');
        const bad = { ...VALID, name: ' ', email: 'a@b' };
        await send(bad);
        if ((await statusText(page)) !== t('contact.form.outcome.invalid')) offenders.push(`RF-22: invalid announces "${await statusText(page)}"`);
        if (JSON.stringify(await values(page)) !== JSON.stringify(FIELDS.map((f) => bad[f]))) offenders.push('RF-20: invalid lost the typed values');
        if ((await describedBy(page, 'name')) !== t('contact.form.errors.name')) offenders.push(`RF-23: name is described by "${await describedBy(page, 'name')}"`);
        if ((await page.evaluate(() => (document.activeElement as HTMLInputElement | null)?.name)) !== 'name') offenders.push('RF-24: focus is not on the first invalid field');
        await send({ ...VALID, subject: STUB_FAIL_SUBJECT });
        if ((await statusText(page)) !== t('contact.form.outcome.failed')) offenders.push(`RF-22: failed announces "${await statusText(page)}"`);
        if ((await field(page, 'subject').inputValue()) !== STUB_FAIL_SUBJECT) offenders.push('RF-20: failed lost the typed values');
        await send(VALID);
        await send(VALID);
        if ((await statusText(page)) !== t('contact.form.outcome.limited')) offenders.push(`RF-22: the fourth accepted announces "${await statusText(page)}"`);
        if (loads || page.url() !== url || (await page.evaluate(() => (window as any).__marker)) !== 1) offenders.push(`RF-18: the page navigated (${loads} loads)`);
        // RF-19: a double click against a slow endpoint makes one request.
        const { ctx: c2, page: p2 } = await freshPage(browser);
        let requests = 0;
        await p2.route('**/api/contact', async (route) => { requests++; await new Promise((r) => setTimeout(r, 1000)); await route.continue(); });
        await open(p2, 'en');
        await enhanced(p2);
        await fill(p2, VALID);
        const btn = await submitButton(p2);
        const answered = p2.waitForResponse((r) => r.url().endsWith('/api/contact'));
        await btn.dblclick();
        await answered;
        await p2.waitForTimeout(300);
        if (requests !== 1) offenders.push(`RF-19: a double click made ${requests} requests`);
        // RF-18: still enhanced after a client navigation away and back.
        await p2.goto(BASE + '/proyectos');
        await p2.goBack();
        await steady(p2);
        await p2.locator(SECTION).scrollIntoViewIfNeeded();
        await enhanced(p2);
        await p2.evaluate(() => { (window as any).__marker2 = 1; });
        await fill(p2, VALID);
        const res = p2.waitForResponse((r) => r.url().endsWith('/api/contact'));
        await (await submitButton(p2)).click();
        await res;
        if ((await p2.evaluate(() => (window as any).__marker2)) !== 1) offenders.push('RF-18: after navigating back, the submit navigated');
        await c2.close();
        await ctx.close();
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    test('client assets: no secret name or value in any script or stylesheet (RF-13)', async ({ browser, request }) => {
        const { ctx, page } = await freshPage(browser);
        await open(page, 'es');
        const urls = await page.evaluate(() => [...document.querySelectorAll('script[src], link[rel="stylesheet"], link[rel="modulepreload"]')].map((e) => (e as HTMLScriptElement).src || (e as HTMLLinkElement).href));
        const inline = await page.evaluate(() => [...document.querySelectorAll('script:not([src])')].map((s) => s.textContent ?? '').join('\n'));
        const offenders: string[] = [];
        for (const needle of ['MAILTRAP_API_TOKEN', 'e2e-fake-token', 'CONTACT_FROM_EMAIL']) {
            if (inline.includes(needle)) offenders.push(`RF-13: an inline script holds ${needle}`);
            for (const u of urls) { const body = await (await request.get(u)).text(); if (body.includes(needle)) offenders.push(`RF-13: ${u} holds ${needle}`); }
        }
        if (!urls.length) offenders.push('RF-13: no client asset found to scan');
        await ctx.close();
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    for (const theme of THEMES) {
        test(`contrast and 360px: labels, errors and the privacy line clear 4.5:1 — ${theme} (NFR)`, async ({ browser }) => {
            const { ctx, page } = await freshPage(browser);
            await open(page, 'es', theme);
            await enhanced(page);
            await installHelpers(page);
            await fill(page, { ...VALID, email: 'a@b' });
            const res = page.waitForResponse((r) => r.url().endsWith('/api/contact'));
            await (await submitButton(page)).click();
            await res;
            await settled(() => statusText(page));
            const r = await page.locator(FORM).evaluate((form) => {
                const w = window as any;
                const els = [...form.querySelectorAll('label, [data-error-for]:not([hidden]), [data-contact-privacy]')];
                const section = form.closest('section')!;
                return {
                    items: els.map((e) => ({ what: e.textContent?.trim().slice(0, 30), fg: w.__toHex(getComputedStyle(e).color), ground: w.__groundOf(e, 'main > section.section') })),
                    image: getComputedStyle(section).backgroundImage,
                    sheet: getComputedStyle(document.querySelector('main')!).backgroundColor,
                };
            });
            const offenders: string[] = [];
            if (r.items.length < 6) offenders.push(`NFR: only ${r.items.length} texts measured`);
            for (const it of r.items) {
                const ratio = it.ground.glow ? worstPoint(parseColour(it.fg), parseGradients(r.image).flatMap((g) => composites(g, parseColour(r.sheet)))) : contrast(it.fg, it.ground.colour);
                if (ratio < 4.5) offenders.push(`NFR: "${it.what}" ${it.fg} is ${ratio.toFixed(2)}:1`);
            }
            await page.setViewportSize({ width: 360, height: 800 });
            const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
            if (over) offenders.push(`NFR: ${over}px of page scroll at 360px`);
            await ctx.close();
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }
});
