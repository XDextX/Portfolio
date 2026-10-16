import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { CONTACTS } from '../src/data/contacts';
import { stripComments } from './helpers/source';
import { recordingSender, failingSender, hangingSender, fakeSchedule, captureConsole } from './helpers/contact-mocks';

/**
 * Spec 015: the contact form's server side. The handler is pure: the sender, the clock,
 * the limiter and the schedule are supplied, so nothing here touches the network.
 */

const ROOT = process.cwd();
// Explicit imports, so a missing module fails by name in each case rather than the whole file.
const MODULES: Record<string, () => Promise<unknown>> = {
    contact: () => import('../src/pages/lib/contact'),
    mailtrap: () => import('../src/pages/lib/mailtrap'),
    'contact-runtime': () => import('../src/pages/lib/contact-runtime'),
};
const load = async (mod: string) => (await MODULES[mod]()) as any;
const RECIPIENT = CONTACTS.find((c) => c.kind === 'email')!.value;
const VALID = { name: 'Ana Ruiz', email: 'ana@example.com', subject: 'Hola', message: 'Un mensaje <b>breve</b>.' };

const form = (fields: Record<string, string | string[]>, init: { method?: string; type?: string; body?: BodyInit; length?: string } = {}) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(fields)) for (const x of [v].flat()) p.append(k, x);
    const headers: Record<string, string> = { 'content-type': init.type ?? 'application/x-www-form-urlencoded' };
    if (init.length) headers['content-length'] = init.length;
    const method = init.method ?? 'POST';
    return new Request('http://localhost/api/contact', { method, headers, body: method === 'GET' ? undefined : init.body ?? p.toString(), duplex: 'half' } as any);
};

async function setup(overrides: Record<string, unknown> = {}) {
    const c = await load('contact');
    const rec = recordingSender();
    const sched = fakeSchedule();
    const logs: string[] = [];
    const deps = { sender: rec.sender, limiter: c.createRateLimiter(c.RATE), now: 1_000_000, clientKey: 'client-a', recipient: RECIPIENT, schedule: sched.schedule, log: (k: string) => logs.push(k), ...overrides };
    return { c, rec, sched, logs, deps, run: (req: Request, d = deps) => c.handleContact(req, d) };
}

describe('contact handler (spec 015 RF-4 – RF-8, RF-10 – RF-12, RF-14)', () => {
    it('recipient: one message to the email contact, reply-to the visitor (RF-4)', async () => {
        const { rec, run } = await setup();
        const r = await run(form(VALID));
        expect(r.outcome).toBe('sent');
        expect(rec.calls.length).toBe(1);
        expect(rec.calls[0].m.to).toBe(RECIPIENT);
        expect(rec.calls[0].m.replyTo).toBe(VALID.email);
    });

    it('rules: each failing field is named, the sender untouched (RF-5)', async () => {
        const { c, rec, run } = await setup();
        const L = c.FIELD_LIMITS;
        const cases: [string, Record<string, string | string[]>, string][] = [
            ['name blank', { ...VALID, name: '    ' }, 'name'],
            ['email blank', { ...VALID, email: '' }, 'email'],
            ['subject blank', { ...VALID, subject: '\t' }, 'subject'],
            ['message blank', { ...VALID, message: '  ' }, 'message'],
            ['email shape', { ...VALID, email: 'a@b' }, 'email'],
            ['email whitespace', { ...VALID, email: 'a b@c.de' }, 'email'],
            ['name line break', { ...VALID, name: 'Ana\nRuiz' }, 'name'],
            ['subject line break', { ...VALID, subject: 'Ho la' }, 'subject'],
            ['name too long', { ...VALID, name: 'x'.repeat(L.name + 1) }, 'name'],
            ['email too long', { ...VALID, email: 'a'.repeat(L.email) + '@x.io' }, 'email'],
            ['subject too long', { ...VALID, subject: 'x'.repeat(L.subject + 1) }, 'subject'],
            ['message too long', { ...VALID, message: 'x'.repeat(L.message + 1) }, 'message'],
            ['name repeated', { ...VALID, name: ['Ana', 'Eva'] }, 'name'],
            ['message missing', { name: VALID.name, email: VALID.email, subject: VALID.subject }, 'message'],
        ];
        for (const [label, fields, field] of cases) {
            const r = await run(form(fields));
            expect(r.outcome, label).toBe('invalid');
            expect(r.fields, label).toEqual([field]);
        }
        expect(rec.calls.length, 'sender calls').toBe(0);
    });

    it('rules: lengths count as the browser does — trimmed, CRLF as one (RF-5)', async () => {
        const { c, rec, run } = await setup();
        // Folded, each 'x\r\n' counts 2, so this is exactly the limit; unfolded it is 50% over.
        const crlf = 'x\r\n'.repeat(c.FIELD_LIMITS.message / 2 - 1) + 'xx';
        expect(c.fieldLength(crlf)).toBe(c.FIELD_LIMITS.message);
        expect(c.fieldLength('  ab  ')).toBe(2);
        expect((await run(form({ ...VALID, message: `  ${crlf}  ` }))).outcome).toBe('sent');
        expect(rec.calls.length).toBe(1);
    });

    it('gate: another method, another type or a body past 32 KB is invalid (RF-6)', async () => {
        const { c, rec, run } = await setup();
        const big = 'message=' + 'x'.repeat(c.BODY_CAP);
        const stream = new ReadableStream({ start(ctl) { ctl.enqueue(new TextEncoder().encode(big)); ctl.close(); } });
        const cases: [string, Request][] = [
            ['GET', form(VALID, { method: 'GET' })],
            ['PUT', form(VALID, { method: 'PUT' })],
            ['multipart', form(VALID, { type: 'multipart/form-data; boundary=x' })],
            ['json', form(VALID, { type: 'application/json' })],
            ['length over cap', form({}, { body: big, length: String(big.length) })],
            ['no length over cap', form({}, { body: stream })],
            // Declared over the cap, it is refused before a byte is read: this body throws if pulled.
            ['length over cap, unread', form({}, { body: new ReadableStream({ pull() { throw new Error('read past the gate'); } }), length: String(c.BODY_CAP + 1) })],
        ];
        for (const [label, req] of cases) {
            const r = await run(req);
            expect(r.outcome, label).toBe('invalid');
            expect(r.fields, label).toEqual([]);
        }
        expect(rec.calls.length).toBe(0);
    });

    it('honeypot: a filled trap answers sent and sends nothing (RF-7)', async () => {
        const { rec, run } = await setup();
        expect((await run(form({ ...VALID, website: 'http://spam.test' }))).outcome).toBe('sent');
        expect(rec.calls.length).toBe(0);
    });

    it('limit: three accepted per window; invalid and honeypot posts do not count (RF-8)', async () => {
        const { c, rec, deps, run } = await setup();
        const at = (now: number) => ({ ...deps, now });
        expect((await run(form(VALID), at(0))).outcome).toBe('sent');
        expect((await run(form({ ...VALID, email: 'bad' }), at(1))).outcome).toBe('invalid');
        expect((await run(form(VALID), at(2))).outcome).toBe('sent');
        expect((await run(form({ ...VALID, website: 'x' }), at(3))).outcome).toBe('sent');
        expect((await run(form(VALID), at(4))).outcome).toBe('sent');
        const fourth = await run(form(VALID), at(5));
        expect(fourth.outcome).toBe('limited');
        expect(fourth.values?.message).toBe(VALID.message);
        expect(rec.calls.length).toBe(3);
        expect((await run(form({ ...VALID }), { ...deps, now: 1, clientKey: 'client-b' })).outcome, 'another client').toBe('sent');
        expect((await run(form(VALID), at(c.RATE.windowMs + 1))).outcome, 'after the window').toBe('sent');
        deps.limiter.allows('client-a', 10 * c.RATE.windowMs);
        deps.limiter.allows('client-b', 10 * c.RATE.windowMs);
        expect(deps.limiter.size(), 'expired keys dropped').toBe(0);
    });

    it('failure: a throw, a timeout or a non-2xx answer is failed, never a 500 (RF-10)', async () => {
        const { c, deps, run } = await setup();
        expect((await run(form(VALID), { ...deps, sender: failingSender(new Error('boom')) })).outcome, 'throw').toBe('failed');
        const sched = fakeSchedule();
        const pending = run(form(VALID), { ...deps, clientKey: 'k2', sender: hangingSender(), schedule: sched.schedule });
        await new Promise((r) => setTimeout(r, 0));
        expect(sched.delays).toEqual([c.SEND_TIMEOUT_MS]);
        sched.fire();
        expect((await pending).outcome, 'timeout').toBe('failed');
        expect((await run(form(VALID), { ...deps, clientKey: 'k3', sender: recordingSender(502).sender })).outcome, '502').toBe('failed');
    });

    it('silence: no token and no field value in the response or the console (RF-11, RF-12)', async () => {
        const { c, deps } = await setup();
        const cap = captureConsole();
        try {
            const secret = 'fake-token-123';
            const err = new Error(`401 Bearer ${secret} for ${VALID.email} ${VALID.message}`);
            const r = await c.handleContact(form(VALID), { ...deps, sender: failingSender(err), log: (k: string) => console.warn('contact', k) });
            // The response may carry the typed values back to the form (RF-16), never the token.
            expect(JSON.stringify(r)).not.toContain(secret);
            const logged = cap.lines.join('\n');
            for (const v of [secret, VALID.email, VALID.message, VALID.name, VALID.subject]) expect(logged, `the console holds ${v}`).not.toContain(v);
            expect(cap.lines.length, 'the failure is logged').toBeGreaterThan(0);
        } finally { cap.restore(); }
    });

    it('plain text: the message carries the values verbatim as text (RF-14)', async () => {
        const { rec, run } = await setup();
        await run(form(VALID));
        const m = rec.calls[0].m;
        expect(m.text).toContain(VALID.message);
        expect(m.subject).toBe(VALID.subject);
        expect(m.fromName).toBe(VALID.name);
        expect(Object.keys(m).sort()).toEqual(['fromName', 'replyTo', 'subject', 'text', 'to']);
    });
});

describe('Mailtrap sender, seam and secret readers (spec 015 RF-9, RF-13, RF-14)', () => {
    const CONFIG = { token: 'fake-token-123', from: 'form@example.test', endpoint: undefined };
    const MESSAGE = { to: 'owner@example.com', replyTo: VALID.email, fromName: VALID.name, subject: VALID.subject, text: `x\n\n${VALID.message}` };

    it('config: a missing token or sender address builds no sender and calls nothing (RF-9)', async () => {
        const m = await load('mailtrap');
        let calls = 0;
        const fetchImpl = async () => { calls++; return new Response('{}'); };
        expect(m.createMailtrapSender({ ...CONFIG, token: '' }, fetchImpl)).toBeNull();
        expect(m.createMailtrapSender({ ...CONFIG, from: undefined }, fetchImpl)).toBeNull();
        expect(calls).toBe(0);
        const { run, deps } = await setup();
        const logs: string[] = [];
        expect((await run(form(VALID), { ...deps, sender: null, log: (k: string) => logs.push(k) })).outcome).toBe('failed');
        expect(logs).toEqual(['config']);
    });

    it('payload: plain text, Bearer, a User-Agent, no html (RF-14)', async () => {
        const m = await load('mailtrap');
        let seen: { url: string; init: RequestInit } | null = null;
        const sender = m.createMailtrapSender(CONFIG, async (url: string, init: RequestInit) => { seen = { url, init }; return new Response('{"success":true}', { status: 200 }); });
        const r = await sender(MESSAGE, new AbortController().signal);
        expect(r.status).toBe(200);
        const body = JSON.parse(String(seen!.init.body));
        expect(seen!.url).toBe('https://send.api.mailtrap.io/api/send');
        expect((seen!.init.headers as any).Authorization).toBe(`Bearer ${CONFIG.token}`);
        expect((seen!.init.headers as any)['User-Agent']).toBeTruthy();
        expect(body.text).toContain('<b>breve</b>');
        expect('html' in body).toBe(false);
        expect(body.reply_to.email).toBe(VALID.email);
        expect(body.from).toEqual({ email: CONFIG.from, name: VALID.name });
    });

    it('seam: outside dev, never the stub and never the header key', async () => {
        const rt = await load('contact-runtime');
        const real = () => 'real';
        const stub = async () => 'stub';
        expect(await rt.selectSender({ dev: false, e2e: true }, real, stub)).toBe('real');
        expect(await rt.selectSender({ dev: true, e2e: false }, real, stub)).toBe('real');
        expect(await rt.selectSender({ dev: true, e2e: true }, real, stub)).toBe('stub');
        expect(rt.selectClientKey({ dev: false, e2e: true }, 'k', '1.2.3.4')).toBe('1.2.3.4');
        expect(rt.selectClientKey({ dev: true, e2e: true }, 'k', '1.2.3.4')).toBe('k');
        expect(rt.selectClientKey({ dev: true, e2e: true }, null, '1.2.3.4')).toBe('1.2.3.4');
    });

    it('one reader: each secret is named in one server module only (RF-13, constitution 6)', () => {
        const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
            const full = path.join(dir, e.name);
            return e.isDirectory() ? walk(full) : /\.(ts|astro|js|mjs)$/.test(e.name) ? [full] : [];
        });
        const READERS: Record<string, string> = {
            GITHUB_TOKEN: path.join('src', 'pages', 'lib', 'github.ts'),
            MAILTRAP_API_TOKEN: path.join('src', 'pages', 'lib', 'mailtrap.ts'),
            CONTACT_FROM_EMAIL: path.join('src', 'pages', 'lib', 'mailtrap.ts'),
            MAILTRAP_ENDPOINT: path.join('src', 'pages', 'lib', 'mailtrap.ts'),
        };
        const offenders: string[] = [];
        for (const [name, reader] of Object.entries(READERS)) {
            const where = walk(path.join(ROOT, 'src')).filter((f) => stripComments(fs.readFileSync(f, 'utf-8')).includes(name)).map((f) => path.relative(ROOT, f));
            if (JSON.stringify(where) !== JSON.stringify([reader])) offenders.push(`${name} is read in ${where.join(', ') || 'nothing'}, not only ${reader}`);
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
});

