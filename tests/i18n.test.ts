import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * `t()` returns the key itself when a translation is missing, so a key that was
 * never added to a locale file renders as `projects.viewAll` to a visitor and
 * throws nothing. The only thing that catches it is a check that the key exists
 * on both sides.
 *
 * The scope is every file that can call `t()`, not just the 404 page it grew out
 * of. Reading one page's keys is a guard that says nothing about the other
 * twenty components.
 */

const ROOT = process.cwd();

function walk(dir: string, exts: string[]): string[] {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return walk(full, exts);
        return exts.includes(path.extname(entry.name)) ? [full] : [];
    });
}

const SOURCE_FILES = [
    ...walk(path.join(ROOT, 'src'), ['.astro', '.ts']),
];

const locale = (name: 'en' | 'es') =>
    JSON.parse(fs.readFileSync(path.join(ROOT, 'i18n', 'locales', `${name}.json`), 'utf-8'));

const resolve = (obj: unknown, key: string) =>
    key.split('.').reduce<unknown>((acc, part) => {
        if (acc == null || typeof acc !== 'object') return undefined;
        return (acc as Record<string, unknown>)[part];
    }, obj);

describe('i18n locales', () => {
    it('both locales define the same top-level keys', () => {
        expect(Object.keys(locale('es')).sort()).toEqual(Object.keys(locale('en')).sort());
    });

    it('every t() key used anywhere resolves in both locales', () => {
        // Comments come off first. Components carry notes quoting the strings
        // they used to inline, and a scan that reads those as live calls fails on
        // its own explanation.
        const en = locale('en');
        const es = locale('es');
        const offenders: string[] = [];

        for (const file of SOURCE_FILES) {
            const src = fs
                .readFileSync(file, 'utf-8')
                .replace(/\/\*[\s\S]*?\*\//g, ' ')
                .replace(/^\s*\/\/.*$/gm, ' ');
            const where = path.relative(ROOT, file);

            // \bt( so that `format(` and friends are not read as calls.
            for (const m of src.matchAll(/\bt\(\s*['"]([\w.]+)['"]/g)) {
                const key = m[1];
                if (resolve(en, key) == null) offenders.push(`${key} missing in en.json (${where})`);
                if (resolve(es, key) == null) offenders.push(`${key} missing in es.json (${where})`);
            }
        }

        expect(
            offenders,
            `t() returns the key itself when a translation is missing, so these\n` +
            `ship the raw key to a visitor with nothing in the console:\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });

    it('finds the keys to check', () => {
        // The guard above returns an empty list for a scan that matched nothing,
        // which reads exactly like a clean run. Assert the scan sees real keys.
        const src = fs.readFileSync(path.join(ROOT, 'src', 'pages', '404.astro'), 'utf-8');
        expect([...src.matchAll(/\bt\(\s*['"]([\w.]+)['"]/g)].length).toBeGreaterThan(0);
    });
});
