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

describe('skills area cards (RF-4)', () => {
    // Astro components cannot be rendered under vitest — `npm test` never
    // opens a browser — so the card structure below is read from source, the
    // same reason tests/markup.test.ts scans files instead of the DOM.
    const TECH_SRC = fs
        .readFileSync(path.join(ROOT, 'src', 'data', 'tech.ts'), 'utf-8')
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/^\s*\/\/.*$/gm, ' ');
    // Category values from the data entries (`category: 'Frontend'`), never a
    // literal list: the data file is the source of which areas exist.
    const categories = Array.from(
        new Set([...TECH_SRC.matchAll(/category:\s*'([^']+)'/g)].map((m) => m[1])),
    );
    const areaKey = (category: string) => `skills.areas.${category.toLowerCase()}`;

    const gridSrc = () =>
        fs
            .readFileSync(path.join(ROOT, 'src', 'components', 'TechGrid.astro'), 'utf-8')
            .replace(/\r\n/g, '\n')
            .replace(/\/\*[\s\S]*?\*\//g, ' ')
            .replace(/^\s*\/\/.*$/gm, ' ');

    /** The data field the grouping keys on, read from the grouping itself. */
    const groupKey = () =>
        gridSrc().match(/groupBy\(items\s*,\s*\(?\s*\w+\s*\)?\s*=>\s*\w+\.(\w+)/)?.[1] ?? '';

    /** The bucket a tech with no category lands in, read from the grouping. */
    const fallbackCategory = () =>
        gridSrc().match(/groupBy\(items[^;]*\?\?\s*'([^']+)'/)?.[1] ?? '';

    // The bars panel only: the compact list behind the toggle is phase 2 and
    // stays as is.
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
        const shared = fs
            .readFileSync(path.join(ROOT, 'public', 'styles', '03-components.css'), 'utf-8')
            .replace(/\r\n/g, '\n')
            .replace(/\/\*[\s\S]*?\*\//g, ' ')
            .replace(/^\s*\/\/.*$/gm, ' ');
        const src = gridSrc();
        return (
            src.slice(src.indexOf('<style>')).match(rule)?.[0] ??
            shared.match(rule)?.[0] ??
            ''
        );
    };

    it('finds data categories, so the guards below are not vacuous', () => {
        expect(categories.length).toBeGreaterThan(0);
        expect(barsPanel().length).toBeGreaterThan(0);
        expect(groupKey(), 'the category grouping is gone').not.toBe('');
        expect(fallbackCategory(), 'the uncategorised bucket is gone').not.toBe('');
        expect(callBlock(barsPanel(), 'byCategory.map(')).not.toBe('');
    });

    it('every data category resolves to an area heading in both locales', () => {
        const en = locale('en');
        const es = locale('es');
        const offenders: string[] = [];
        // The uncategorised bucket renders a heading of its own, so it is read
        // from the grouping rather than spelled here.
        for (const category of [...categories, fallbackCategory()]) {
            const key = areaKey(category);
            for (const [name, messages] of [
                ['en', en],
                ['es', es],
            ] as const) {
                const value = resolve(messages, key);
                if (typeof value !== 'string' || value.trim() === '' || value === key) {
                    offenders.push(`${key} missing in ${name}.json`);
                }
            }
        }
        expect(
            offenders,
            `Each bars-view area heading resolves through the locale files, so these\n` +
                `ship the raw key to a visitor with nothing in the console:\n  ` +
                offenders.join('\n  '),
        ).toEqual([]);
    });

    it('the bars view renders one bordered card per data category with a translated heading', () => {
        const bars = barsPanel();
        // The per-category iteration itself: the block the grouping callback
        // renders. Counted from the markup, never from a list of area names.
        const perCategory = callBlock(bars, 'byCategory.map(');
        expect(
            perCategory,
            `The bars panel no longer iterates the category grouping, so it has no\n` +
                `card per area at all:\n  ${bars}`,
        ).not.toBe('');

        // The container is read off the markup: the element a category heading
        // sits inside. Deleting it, or renaming the class on the markup side
        // only, has to fail here rather than leave an orphan CSS rule behind.
        const containers = [
            ...perCategory.matchAll(/<div\b[^>]*\bclass=['"]([\w-]+)['"][^>]*>\s*<h[1-6]\b/g),
        ];
        expect(
            containers.length,
            `Expected one card container wrapping a category heading per iteration, so\n` +
                `each area reads as one bordered unit. Found ${containers.length} inside\n` +
                `the bars panel's per-category map.` +
                (containers.length ? ':\n  ' + containers.map((m) => m[0]).join('\n  ') : ''),
        ).toBe(1);
        const cardClass = containers[0][1];

        // The grouping keys on the data's own field, so the number of cards is
        // the number of categories in the data file — nothing is counted here.
        const key = groupKey();
        expect(
            TECH_SRC,
            `TechGrid groups on \`${key}\`, a field the data entries do not carry, so\n` +
                `every tech lands in one bucket and the bars view renders one card:`,
        ).toMatch(new RegExp(`\\b${key}\\s*:`));

        // The data value is the lookup only: no area name spelled as text.
        const literals = categories.filter(
            (category) =>
                bars.includes(`'${category}'`) ||
                bars.includes(`"${category}"`) ||
                bars.includes(`>${category}<`),
        );
        expect(
            literals,
            `These area names are spelled literally in the bars panel; the data value\n` +
                `is the lookup key into skills.areas, never visitor text:\n  ` +
                literals.join('\n  '),
        ).toEqual([]);

        // Each card carries its heading through t().
        const heading = perCategory.match(/<h[1-6]\b[^>]*>([^<]*)<\/h[1-6]>/)?.[1] ?? '';
        expect(
            heading,
            `The heading inside the card container does not resolve through t():\n  ${heading}`,
        ).toMatch(/^\{t\(/);

        // And the card is bordered with the shared card padding — looked up by
        // the class the markup mounts, so the two sides cannot drift apart
        // whether the rule lives in the component or in the shared sheet.
        const cardRule = cardFrameRule(cardClass);
        expect(
            cardRule,
            `No \`.${cardClass}\` rule styles the container the bars panel renders, in\n` +
                `TechGrid's <style> or in /styles/03-components.css, so each area has no\n` +
                `border of its own:\n  ${cardClass}`,
        ).not.toBe('');
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
