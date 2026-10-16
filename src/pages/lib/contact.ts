/**
 * Spec 015: the contact form's outcome for one request. Pure: the sender, the clock, the
 * limiter and the timer are supplied by the caller, so nothing here reads the env, a clock
 * or the network, and the tests run it as is.
 */

export const FIELD_LIMITS = { name: 100, email: 254, subject: 150, message: 5000 } as const;
export const BODY_CAP = 32 * 1024;
export const RATE = { max: 3, windowMs: 600_000 } as const;
export const SEND_TIMEOUT_MS = 8000;

export type Field = keyof typeof FIELD_LIMITS;
export type Outcome = 'sent' | 'invalid' | 'limited' | 'failed';
export type ContactMessage = { to: string; replyTo: string; fromName: string; subject: string; text: string };
export type Sender = (m: ContactMessage, signal: AbortSignal) => Promise<{ status: number }>;
export type Schedule = (fn: () => void, ms: number) => () => void;
export type LogKind = 'config' | 'threw' | 'timeout' | 'status' | 'internal';
export type RateLimiter = ReturnType<typeof createRateLimiter>;

export interface ContactDeps {
    sender: Sender | null;
    limiter: RateLimiter;
    now: number;
    clientKey: string;
    recipient: string;
    schedule: Schedule;
    log: (kind: LogKind) => void;
}

export interface ContactResult {
    outcome: Outcome;
    fields: Field[];
    values?: Record<Field, string>;
}

const FIELDS = Object.keys(FIELD_LIMITS) as Field[];
const LINE_BREAK = /[\r\n\u0085\u2028\u2029]/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * A field's length as the browser's maxlength counts it: trimmed, a CRLF as one unit.
 * @param v the submitted value
 * @returns UTF-16 units after trimming and folding CRLF to LF
 */
export function fieldLength(v: string): number {
    return v.trim().replace(/\r\n/g, '\n').length;
}

/**
 * The four fields of a submission, trimmed, and which of them break a rule.
 * @param p the decoded form body
 * @returns the trimmed values and each failing field once, in form order
 */
export function validateFields(p: URLSearchParams): { values: Record<Field, string>; errors: Field[] } {
    const values = {} as Record<Field, string>;
    const errors: Field[] = [];
    for (const f of FIELDS) {
        const all = p.getAll(f);
        const v = all.length === 1 ? all[0].trim() : '';
        values[f] = all[0]?.trim() ?? '';
        const bad = all.length !== 1 || v === '' || fieldLength(v) > FIELD_LIMITS[f]
            || ((f === 'name' || f === 'subject') && LINE_BREAK.test(v))
            || (f === 'email' && !EMAIL.test(v));
        if (bad) errors.push(f);
    }
    return { values, errors };
}

/**
 * Whether a request may carry a form at all: a POST, url-encoded, not declared over the cap.
 * @param method the HTTP method @param headers the request headers
 * @returns true when the body is worth reading
 */
export function gateRequest(method: string, headers: Headers): boolean {
    const type = (headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
    const length = headers.get('content-length');
    return method === 'POST' && type === 'application/x-www-form-urlencoded' && (length === null || Number(length) <= BODY_CAP);
}

/**
 * The body as text, read no further than the cap.
 * @param body the request body @param cap the most bytes accepted
 * @returns the decoded text, or null when it is missing or runs past the cap
 */
export async function readCapped(body: ReadableStream<Uint8Array> | null, cap: number): Promise<string | null> {
    if (!body) return null;
    const reader = body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > cap) { await reader.cancel(); return null; }
        chunks.push(value);
    }
    const all = new Uint8Array(total);
    let at = 0;
    for (const c of chunks) { all.set(c, at); at += c.byteLength; }
    return new TextDecoder().decode(all);
}

/**
 * Accepted submissions per client in a sliding window, held in memory for the window only.
 * @param rate how many per how long
 * @returns allows / record / size, each taking the caller's clock
 */
export function createRateLimiter(rate: { max: number; windowMs: number }) {
    const stamps = new Map<string, number[]>();
    const sweep = (now: number) => {
        for (const [key, list] of stamps) {
            const kept = list.filter((t) => t > now - rate.windowMs);
            if (kept.length) stamps.set(key, kept); else stamps.delete(key);
        }
    };
    return {
        allows(key: string, now: number) { sweep(now); return (stamps.get(key)?.length ?? 0) < rate.max; },
        record(key: string, now: number) { sweep(now); stamps.set(key, [...(stamps.get(key) ?? []), now]); },
        size() { return stamps.size; },
    };
}

/**
 * Hand a message to the sender, giving up after `ms`.
 * @param sender the sender @param m the message @param ms the timeout @param schedule the timer
 * @returns 'ok' on a 2xx, else why not
 */
export async function sendWithTimeout(sender: Sender, m: ContactMessage, ms: number, schedule: Schedule): Promise<'ok' | 'threw' | 'timeout' | 'status'> {
    const ctrl = new AbortController();
    let timedOut = false;
    const cancel = schedule(() => { timedOut = true; ctrl.abort(); }, ms);
    try {
        const r = await Promise.race([
            sender(m, ctrl.signal),
            new Promise<never>((_, reject) => ctrl.signal.addEventListener('abort', () => reject(new Error('timeout')))),
        ]);
        return r.status >= 200 && r.status < 300 ? 'ok' : 'status';
    } catch {
        return timedOut ? 'timeout' : 'threw';
    } finally {
        cancel();
    }
}

/**
 * The outcome of one contact request. Never throws: anything unexpected is `failed`.
 * @param req the incoming request @param deps sender, limiter, clock, client key, recipient, timer, log
 * @returns the outcome, the failing fields and, when the form should keep them, the values
 */
export async function handleContact(req: Request, deps: ContactDeps): Promise<ContactResult> {
    try {
        if (!gateRequest(req.method, req.headers)) return { outcome: 'invalid', fields: [] };
        const text = await readCapped(req.body, BODY_CAP);
        if (text === null) return { outcome: 'invalid', fields: [] };
        const params = new URLSearchParams(text);
        if (params.get('website')?.trim()) return { outcome: 'sent', fields: [] };
        const { values, errors } = validateFields(params);
        if (errors.length) return { outcome: 'invalid', fields: errors, values };
        if (!deps.limiter.allows(deps.clientKey, deps.now)) return { outcome: 'limited', fields: [], values };
        if (!deps.sender) { deps.log('config'); return { outcome: 'failed', fields: [], values }; }
        deps.limiter.record(deps.clientKey, deps.now);
        const message: ContactMessage = {
            to: deps.recipient,
            replyTo: values.email,
            fromName: values.name,
            subject: values.subject,
            text: `${values.name} <${values.email}>\n\n${values.message}`,
        };
        const r = await sendWithTimeout(deps.sender, message, SEND_TIMEOUT_MS, deps.schedule);
        if (r === 'ok') return { outcome: 'sent', fields: [] };
        deps.log(r);
        return { outcome: 'failed', fields: [], values };
    } catch {
        deps.log('internal');
        return { outcome: 'failed', fields: [] };
    }
}
