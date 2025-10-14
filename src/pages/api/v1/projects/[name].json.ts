// src/pages/api/v1/projects/[name].ts
import type { APIRoute } from "astro";
import { ghRepo } from "../../../lib/github";

export const GET: APIRoute = async ({ params }) => {

    const name = params.name!;
    console.log(name);
    const repo = await ghRepo({ user: "XDextX", name });
    if (!repo) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    return new Response(JSON.stringify(repo), { headers: { "Content-Type": "application/json" } });
};
