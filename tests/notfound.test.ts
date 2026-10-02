import { describe, it, expect } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';

const read = (...parts: string[]) =>
    fs.readFile(path.resolve(process.cwd(), ...parts), 'utf-8');

/**
 * `proyectos/[name].astro` redirects to /404 when the repo lookup fails, but
 * `src/pages/404.astro` did not exist: the redirect landed on Astro's default
 * error page. Verified live before and after adding it.
 */
describe('404 route', () => {
    it('src/pages/404.astro exists', async () => {
        const stat = await fs.stat(path.resolve(process.cwd(), 'src', 'pages', '404.astro'));
        expect(stat.isFile()).toBe(true);
    });

    it('the redirect target matches the page that exists', async () => {
        const detail = await read('src', 'pages', 'proyectos', '[name].astro');
        const redirect = detail.match(/Astro\.redirect\(['"]([^'"]+)['"]\)/)?.[1];

        expect(redirect).toBe('/404');

        // The route file Astro will serve for that path must exist.
        const target = path.resolve(process.cwd(), 'src', 'pages', `${redirect!.slice(1)}.astro`);
        await expect(fs.stat(target)).resolves.toBeDefined();
    });

    it('uses i18n keys instead of hardcoded strings', async () => {
        const page = await read('src', 'pages', '404.astro');

        // t() returning the key when a translation is missing is silent, so the
        // keys must exist in both locales.
        const keys = [...page.matchAll(/t\(['"]([\w.]+)['"]/g)].map((m) => m[1]);
        expect(keys.length).toBeGreaterThan(0);

        const en = JSON.parse(await read('i18n', 'locales', 'en.json'));
        const es = JSON.parse(await read('i18n', 'locales', 'es.json'));

        for (const key of keys) {
            const resolve = (obj: any) =>
                key.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), obj);

            expect(resolve(en), `missing in en.json: ${key}`).toBeTruthy();
            expect(resolve(es), `missing in es.json: ${key}`).toBeTruthy();
        }
    });
});

describe('i18n locale parity', () => {
    it('both locales define the same top-level keys', async () => {
        const en = JSON.parse(await read('i18n', 'locales', 'en.json'));
        const es = JSON.parse(await read('i18n', 'locales', 'es.json'));

        expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
    });
});