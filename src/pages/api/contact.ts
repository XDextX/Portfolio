import type { APIRoute } from "astro";
import { handleContact } from "../lib/contact";
import { contactDeps, STATUS } from "../lib/contact-runtime";

// Spec 015: the enhanced submit. Every method reaches the handler, whose gate answers invalid
// for anything but a url-encoded POST; the values never travel back, the form still holds them.
export const ALL: APIRoute = async (ctx) => {
    const { outcome, fields } = await handleContact(ctx.request, await contactDeps(ctx));
    return new Response(JSON.stringify({ outcome, fields }), {
        status: STATUS[outcome],
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
};
