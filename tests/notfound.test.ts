import { describe, it, expect } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';

const read = (...parts: string[]) =>
    fs.readFile(path.resolve(process.cwd(), ...parts), 'utf-8');

/**
 * `proyectos/[name].astro` redirects to /404 when the repo lookup fails, but
 * `src/pages/404.astro` did not exist: the redirect landed on Astro's default
 * error page. Verified live before and after adding it.
 *
 * Locale parity is a separate concern and lives in `i18n.test.ts`, which checks
 * every page rather than only this one.
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
        const keys = [...page.matchAll(/\bt\(\s*['"]([\w.]+)['"]/g)].map((m) => m[1]);
        expect(keys.length).toBeGreaterThan(0);

        const en = JSON.parse(await read('i18n', 'locales', 'en.json'));
        const es = JSON.parse(await read('i18n', 'locales', 'es.json'));
        const resolve = (obj: unknown, key: string) =>
            key.split('.').reduce<unknown>((acc, part) => {
                if (acc == null || typeof acc !== 'object') return undefined;
                return (acc as Record<string, unknown>)[part];
            }, obj);

        for (const key of keys) {
            expect(resolve(en, key), `missing in en.json: ${key}`).toBeTruthy();
            expect(resolve(es, key), `missing in es.json: ${key}`).toBeTruthy();
        }
    });

    it('is not shadowed by a Resume route', async () => {
        // `Resume.astro` once lived in src/pages/ and Astro registered it as
        // /Resume, duplicating / with conflicting canonical and hreflang tags. It
        // is a component now; this asserts it stayed one.
        const component = path.resolve(process.cwd(), 'src', 'components', 'Resume.astro');
        expect((await fs.stat(component)).isFile()).toBe(true);

        const pages = path.resolve(process.cwd(), 'src', 'pages');
        const registered = await fs.readdir(pages, { withFileTypes: true });

        expect(
            registered
                .filter((e) => e.isFile() && e.name.toLowerCase() === 'resume.astro')
                .map((e) => e.name),
            'Resume.astro must not live in src/pages/ — Astro would register it as a route',
        ).toEqual([]);
    });
});
