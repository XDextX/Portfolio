import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { levelLabelMap } from '../src/data/levelLabels';

/**
 * `t()` returns the key itself when a translation is missing, so a key absent
 * from a locale file renders as `projects.viewAll` and throws nothing. Scope is
 * every file that can call `t()`, not the one page this grew out of.
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

describe('skills area cards (spec 012 RF-3, RF-4)', () => {
    // Astro components cannot be rendered under vitest — `npm test` never
    // opens a browser — so the card structure below is read from source, the
    // same reason tests/markup.test.ts scans files instead of the DOM.
    // Spec 012's Definitions table, dated 2026-10-15: the heading each declared area reads.
    const HEADINGS: Record<string, { es: string; en: string }> = {
        languages: { es: 'Lenguajes', en: 'Languages' },
        frontend: { es: 'Frontend', en: 'Frontend' },
        backend: { es: 'Backend', en: 'Backend' },
        databases: { es: 'Bases de datos', en: 'Databases' },
        cloudDevops: { es: 'Nube y DevOps', en: 'Cloud & DevOps' },
        testing: { es: 'Testing', en: 'Testing' },
    };
    const loadAreas = async () => ((await import('../src/data/tech')) as any).SKILL_AREAS as { key: string; glyph: string }[] | undefined;

    const strip = (src: string) =>
        src.replace(/\r\n/g, '\n').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
    const gridSrc = () => strip(fs.readFileSync(path.join(ROOT, 'src', 'components', 'TechGrid.astro'), 'utf-8'));
    const headingSrc = () => {
        const file = path.join(ROOT, 'src', 'components', 'AreaHeading.astro');
        return fs.existsSync(file) ? strip(fs.readFileSync(file, 'utf-8')) : '';
    };

    const barsPanel = () => {
        const src = gridSrc();
        return src.slice(src.indexOf("data-panel='bars'"), src.indexOf('<!-- LIST -->'));
    };

    /**
     * From `open` through the parenthesis that closes it. Bracket counting and
     * not a regex: the slice has to survive someone reformatting the block it
     * reads.
     */
    const callBlock = (src: string, open: string) => {
        const start = src.indexOf(open);
        if (start === -1) return '';
        let depth = 0;
        for (let i = src.indexOf('(', start); i < src.length; i += 1) {
            if (src[i] === '(') depth += 1;
            else if (src[i] === ')' && --depth === 0) return src.slice(start, i + 1);
        }
        return '';
    };

    /**
     * The rule for the class the markup mounts: the component's scoped <style>
     * or the shared stylesheet, both count. Comments come off first, as in every
     * other reader here — a `}` inside one would end the match early.
     */
    const cardFrameRule = (cardClass: string) => {
        const rule = new RegExp(`\\.${cardClass}\\s*\\{[^}]*\\}`, 's');
        const shared = strip(fs.readFileSync(path.join(ROOT, 'public', 'styles', '03-components.css'), 'utf-8'));
        const src = gridSrc();
        return src.slice(src.indexOf('<style>')).match(rule)?.[0] ?? shared.match(rule)?.[0] ?? '';
    };

    it('finds the declared areas and the grouping, so the guards below are not vacuous', async () => {
        const areas = await loadAreas();
        expect(areas?.length ?? 0, 'src/data/tech.ts exports no SKILL_AREAS').toBeGreaterThan(0);
        // The grouping is computed once in the frontmatter and iterated by the bars panel.
        expect(gridSrc(), 'TechGrid does not group with populatedAreas(').toMatch(/\bareas\s*=\s*populatedAreas\(\s*SKILL_AREAS\b/);
        expect(callBlock(barsPanel(), 'areas.map(')).not.toBe('');
    });

    it('every declared area resolves to its Definitions heading in both locales (RF-4)', async () => {
        const areas = (await loadAreas()) ?? [];
        const offenders: string[] = [];
        if (JSON.stringify(areas.map((a) => a.key)) !== JSON.stringify(Object.keys(HEADINGS))) {
            offenders.push(`declared areas are ${areas.map((a) => a.key).join(', ') || 'none'}, not ${Object.keys(HEADINGS).join(', ')}`);
        }
        for (const [key, want] of Object.entries(HEADINGS)) {
            for (const lang of ['es', 'en'] as const) {
                const got = resolve(locale(lang), `skills.areas.${key}`);
                if (got !== want[lang]) offenders.push(`skills.areas.${key} in ${lang}.json is ${JSON.stringify(got)}, not "${want[lang]}"`);
            }
        }
        for (const lang of ['es', 'en'] as const) {
            const extra = Object.keys((resolve(locale(lang), 'skills.areas') as object) ?? {}).filter((k) => !(k in HEADINGS));
            if (extra.length) offenders.push(`${lang}.json keeps undeclared area keys: ${extra.join(', ')}`);
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    it('the bars view renders one bordered card per populated area with a translated heading', () => {
        const bars = barsPanel();
        const perArea = callBlock(bars, 'areas.map(');
        expect(perArea, `The bars panel no longer iterates the populated areas:\n  ${bars}`).not.toBe('');

        // The container is read off the markup: the element a heading sits inside.
        const containers = [...perArea.matchAll(/<div\b[^>]*\bclass=['"]([\w-]+)['"][^>]*>\s*<(?:h[1-6]\b|AreaHeading\b)/g)];
        expect(containers.length, `Expected one card container wrapping an area heading per iteration; found ${containers.length}`).toBe(1);
        const cardClass = containers[0][1];

        // No heading spelled literally: the key is the lookup, the text lives in the locales.
        const literals = Object.values(HEADINGS).flatMap((h) => [h.es, h.en]).filter((h) => bars.includes(`>${h}<`) || bars.includes(`'${h}'`));
        expect(literals, `These area headings are spelled in the bars panel:\n  ${literals.join('\n  ')}`).toEqual([]);

        // The heading goes through t(): inline, or inside AreaHeading's own <h4>.
        const inline = perArea.match(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/)?.[1] ?? '';
        const viaComponent = /<AreaHeading\b/.test(perArea);
        const translated = viaComponent
            ? /<h4\b[^>]*>[\s\S]*\{t\(/.test(headingSrc())
            : /\{t\(/.test(inline);
        expect(translated, `The area heading does not resolve through t() (${viaComponent ? 'AreaHeading.astro' : inline})`).toBe(true);

        const cardRule = cardFrameRule(cardClass);
        expect(cardRule, `No \`.${cardClass}\` rule borders the area card`).not.toBe('');
        expect(cardRule).toMatch(/border:\s*1px solid var\(--color-border\)/);
        expect(cardRule).toMatch(/padding:\s*1\.25rem/);
    });
});

describe('skills default level (RF-6)', () => {
    // Astro components cannot be rendered under vitest — `npm test` never
    // opens a browser — so the fallback below is read from source, the
    // same reason tests/markup.test.ts scans files instead of the DOM.
    const techGridSrc = () =>
        fs
            .readFileSync(path.join(ROOT, 'src', 'components', 'TechGrid.astro'), 'utf-8')
            .replace(/\r\n/g, '\n')
            .replace(/\/\*[\s\S]*?\*\//g, ' ')
            .replace(/^\s*\/\/.*$/gm, ' ');
    const skillBarSrc = () =>
        fs
            .readFileSync(path.join(ROOT, 'src', 'components', 'SkillBar.astro'), 'utf-8')
            .replace(/\r\n/g, '\n')
            .replace(/\/\*[\s\S]*?\*\//g, ' ')
            .replace(/^\s*\/\/.*$/gm, ' ');

    it('the level-less fallback resolves through the same map the row reads, in both locales', () => {
        const fallback = techGridSrc().match(/tech\.level\s*\?\?\s*['"]([^'"]+)['"]/)?.[1];
        expect(fallback, `TechGrid must keep a level-less fallback (tech.level ?? '<level>')`).toBeDefined();
        const level = fallback as keyof typeof levelLabelMap.en;
        for (const locale of ['en', 'es'] as const) {
            const label = (levelLabelMap[locale] as Record<string, unknown>)[level];
            expect(
                typeof label === 'string' && (label as string).trim() !== '' && label !== level,
                `default level '${level}' has no label in ${locale} via levelLabelMap`,
            ).toBe(true);
        }
        // The row resolves its badge through that same map, not a second copy.
        expect(skillBarSrc()).toMatch(/levelLabelMap\s*\[\s*locale\s*\]\s*\[\s*level\s*\]/);
    });
});

describe('section title gold word (spec 008 RF-7)', () => {
    // The i18n module is imported inside the test, so a missing export fails here, not the file.
    const LOCALES: Record<string, Record<string, unknown>> = {
        es: JSON.parse(fs.readFileSync(path.join(ROOT, 'i18n', 'locales', 'es.json'), 'utf-8')),
        en: JSON.parse(fs.readFileSync(path.join(ROOT, 'i18n', 'locales', 'en.json'), 'utf-8')),
    };
    const raw = (locale: string, key: string) =>
        key.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], LOCALES[locale]);

    it('every section title marks one whole word of its own text, in both locales', async () => {
        const { titleWords, plainText, t, setLocale } = await import('../i18n/i18n');
        await import('../i18n/index');
        const { SECTION_TITLES } = await import('../src/data/sectionTitles');
        const offenders: string[] = [];
        for (const [locale] of Object.entries(LOCALES)) {
            setLocale(locale);
            for (const { key } of Object.values(SECTION_TITLES)) {
                const value = raw(locale, key);
                if (typeof value !== 'string') {
                    offenders.push(`RF-7: ${locale} ${key} is missing`);
                    continue;
                }
                try {
                    const gold = titleWords(value).filter((w) => w.gold);
                    const plain = plainText(value);
                    const hits = plain.match(new RegExp(`(?<!\\p{L})${gold[0].text}(?!\\p{L})`, 'gu')) ?? [];
                    if (hits.length !== 1) offenders.push(`RF-7: ${locale} ${key}: "${gold[0].text}" occurs ${hits.length} times in "${plain}"`);
                    if (t(key) !== plain) offenders.push(`RF-7: ${locale} ${key}: t() returns "${t(key)}", not "${plain}"`);
                } catch (err) {
                    offenders.push(`RF-7: ${locale} ${key}: ${err instanceof Error ? err.message : String(err)}`);
                }
            }
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
});

describe('hero keys (spec 010)', () => {
    it('every phrase key and social label key resolves in both locales (RF-2, RF-8)', async () => {
        // Keys held as data: the t('…') scan above cannot see them.
        const { ABOUT } = (await import('../src/data/about')) as any;
        const keys: string[] = [...(ABOUT.phraseKeys ?? []), ...ABOUT.socials.map((s: any) => s.labelKey)];
        const offenders: string[] = [];
        if ((ABOUT.phraseKeys ?? []).length !== 4) offenders.push(`RF-2: ABOUT.phraseKeys holds ${(ABOUT.phraseKeys ?? []).length} keys, not 4`);
        for (const key of keys) {
            if (typeof key !== 'string') { offenders.push(`RF-8: a social has no labelKey`); continue; }
            for (const lang of ['en', 'es'] as const) if (typeof resolve(locale(lang), key) !== 'string') offenders.push(`${key} missing in ${lang}.json`);
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
});
