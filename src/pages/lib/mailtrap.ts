import type { ContactMessage, Sender } from "./contact";

/** The Mailtrap configuration: server-side only, and read here and nowhere else (constitution 6). */
export interface MailtrapConfig {
    token?: string;
    from?: string;
    endpoint?: string;
}

const SEND_URL = "https://send.api.mailtrap.io/api/send";

/**
 * The three variables, read once. Values never leave this module except inside the request.
 * @returns the token, the sender address and an optional endpoint (the sandbox, by hand)
 */
export function mailtrapConfig(): MailtrapConfig {
    return {
        token: import.meta.env.MAILTRAP_API_TOKEN,
        from: import.meta.env.CONTACT_FROM_EMAIL,
        endpoint: import.meta.env.MAILTRAP_ENDPOINT,
    };
}

/**
 * Mailtrap's Email Sending payload: plain text only, the visitor as reply-to.
 * @param m the message @param from the verified sender address
 * @returns the JSON body
 */
export function toMailtrapPayload(m: ContactMessage, from: string) {
    return {
        from: { email: from, name: m.fromName },
        to: [{ email: m.to }],
        reply_to: { email: m.replyTo },
        subject: m.subject,
        text: m.text,
        category: "contact-form",
    };
}

/**
 * The real sender over fetch, or null when the token or the sender address is missing.
 * @param config the configuration @param fetchImpl fetch, or a stand-in in tests
 * @returns a Sender, or null so the handler answers failed without touching the network
 */
export function createMailtrapSender(config: MailtrapConfig, fetchImpl: typeof fetch): Sender | null {
    if (!config.token || !config.from) return null;
    const { token, from } = config;
    return async (m, signal) => {
        const res = await fetchImpl(config.endpoint || SEND_URL, {
            method: "POST",
            signal,
            // Mailtrap asks for a real User-Agent; Node's fetch sends "node".
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "User-Agent": "portfolio-contact" },
            body: JSON.stringify(toMailtrapPayload(m, from)),
        });
        return { status: res.status };
    };
}
