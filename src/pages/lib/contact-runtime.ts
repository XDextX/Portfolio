import type { AstroGlobal, APIContext } from "astro";
import { createRateLimiter, RATE, type ContactDeps, type Outcome, type Sender } from "./contact";
import { createMailtrapSender, mailtrapConfig } from "./mailtrap";
import { CONTACTS } from "../../data/contacts";

/** The status each outcome answers with, shared by the page and the API route. */
export const STATUS: Record<Outcome, number> = { sent: 200, invalid: 400, limited: 429, failed: 503 };

type Flags = { dev: boolean; e2e: boolean };

// One limiter per server instance: best effort, lost on a cold start (spec 015 Decision 1).
const limiter = createRateLimiter(RATE);

/**
 * The sender a request uses: the e2e stub only on a dev server started for the e2e run.
 * @param flags dev and e2e @param real builds the real sender @param loadStub loads the stub
 * @returns the chosen sender, or whatever `real` returns (null when unconfigured)
 */
export async function selectSender<T>(flags: Flags, real: () => T, loadStub: () => Promise<T>): Promise<T> {
    return flags.dev && flags.e2e ? loadStub() : real();
}

/**
 * The limiter key: the adapter's client address, or the e2e run's per-test header in dev only.
 * @param flags dev and e2e @param header the x-e2e-client header @param clientAddress the adapter's
 * @returns the key
 */
export function selectClientKey(flags: Flags, header: string | null, clientAddress: string): string {
    return flags.dev && flags.e2e && header ? header : clientAddress;
}

/**
 * Everything the handler needs for one request; the only reader of the clock and the timer.
 * @param ctx the page's Astro global or the route's context
 * @returns the handler's deps
 */
export async function contactDeps(ctx: AstroGlobal | APIContext): Promise<ContactDeps> {
    // DEV is a build-time constant, false in every astro build: production can never select the stub.
    // Astro coerces a numeric env value: CONTACT_E2E=1 arrives as the number 1, so compare as text.
    const flags = { dev: import.meta.env.DEV, e2e: String(import.meta.env.CONTACT_E2E) === "1" };
    const sender = await selectSender<Sender | null>(
        flags,
        () => createMailtrapSender(mailtrapConfig(), fetch),
        // A literal false in a build, so the bundler drops the branch and the stub never ships.
        import.meta.env.DEV ? async () => (await import("../../../e2e/helpers/stub-sender")).stub : async () => null,
    );
    let clientAddress = "unknown";
    try { clientAddress = ctx.clientAddress; } catch { /* the adapter has none: one shared key */ }
    return {
        sender,
        limiter,
        now: Date.now(),
        clientKey: selectClientKey(flags, ctx.request.headers.get("x-e2e-client"), clientAddress),
        recipient: CONTACTS.find((c) => c.kind === "email")?.value ?? "",
        schedule: (fn, ms) => { const id = setTimeout(fn, ms); return () => clearTimeout(id); },
        log: (kind) => console.warn("contact form:", kind),
    };
}
