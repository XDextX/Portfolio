import type { APIRoute } from 'astro';
export const GET: APIRoute = async () => {
    const response = await fetch('https://api.github.com/users/XDextX/repos');
    const data = await response.json();
    return new Response(JSON.stringify(data));
};