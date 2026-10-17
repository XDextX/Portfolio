import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createHash } from 'crypto';

import {
    homeDescription,
    homeDescriptionDraft,
    projectDescription,
    projectEntity,
} from '../src/utils/seo';
import { TECH } from '../src/data/tech';
import { ABOUT } from '../src/data/about';
import { init, setLocale, t } from '../i18n/i18n';
import type { GitHubRepo } from '@type/github';
import { buildRepo as baseRepo } from './helpers/github-mocks';
import type { Readings } from '../scripts/og-cover.ts';

const locale = (name: 'es' | 'en') =>
    JSON.parse(fs.readFileSync(path.join(process.cwd(), 'i18n', 'locales', `${name}.json`), 'utf-8'));

const LOCALES = ['es', 'en'] as const;

// `@i18n/index` runs `init()` at import time. `i18n/i18n` is the same `t()`
// underneath, imported by path and initialised here, so this test owns its locale
// and the description is still interpolated by the shipping code.
init({ es: locale('es'), en: locale('en') }, 'es');

// Two shapes of draft. SHORT is what today's data produces: under the maximum,
// so nothing is truncated. LONG is the edge case RF-3 names — the role grows and
// the description crosses 160 — and it is the only fixture where truncation
// happens, so it is the one that can tell the two halves apart.
const SHORT =
    'Portfolio of a full-stack developer: TypeScript, .NET and Angular. ' +
    'Projects, experience and contact.';
const LONG =
    'Portfolio of a full-stack developer specialised in distributed systems, ' +
    'cloud infrastructure and developer tooling: TypeScript, .NET and Angular. ' +
    'Projects, experience and contact.';

describe('homeDescriptionDraft (RF-3, the untruncated half)', () => {
    it('collapses runs of whitespace and trims', () => {
        expect(homeDescriptionDraft('  a  \n\t b   c ')).toBe('a b c');
    });

    it('leaves a single-spaced draft unchanged', () => {
        expect(homeDescriptionDraft(SHORT)).toBe(SHORT);
    });
});

describe('homeDescription (RF-3)', () => {
    // The first half. A hard character slice satisfies it by construction, which
    // is exactly why it is asserted on its own: if it ever goes red, the length
    // really is over the maximum rather than a boundary rule failing nearby.
    it('keeps the result at most 160 characters', () => {
        for (const template of [SHORT, LONG]) {
            expect(homeDescription(template).length).toBeLessThanOrEqual(160);
        }
    });

    // The second half, and the only one that can tell whole words from a slice.
    // `rest` is where the draft continues, so it has to begin on whitespace.
    it('stops at a whole word rather than cutting one in half', () => {
        for (const template of [SHORT, LONG]) {
            const draft = homeDescriptionDraft(template);
            const result = homeDescription(template);
            const rest = draft.slice(result.length);

            expect(draft.startsWith(result)).toBe(true);
            expect(rest === '' || /^\s/.test(rest)).toBe(true);
        }
    });

    // Without this, the two assertions above would pass on LONG with a truncation
    // that never ran, because nothing has to cut a word if nothing is cut.
    it('truncates a draft that crosses the maximum', () => {
        expect(LONG.length).toBeGreaterThan(160);
        expect(homeDescription(LONG).length).toBeLessThan(LONG.length);
    });

    // D-3: "at most max" and "whole words" are not simultaneously satisfiable,
    // and word integrity wins. Asserting the over-length result is the cost.
    it('keeps a first word that alone exceeds the maximum whole', () => {
        const word = 'Pneumonoultramicroscopicsilicovolcanoconiosis';
        const result = homeDescription(`${word} and more`, 40);

        expect(result).toBe(word);
        expect(result.length).toBeGreaterThan(40);
    });
});

// D-4's split rule. The Spanish list is comma-only: a `y` between the last two
// names would arrive here as one token and fail membership on a correct value.
const splitTechs = (list: string): string[] =>
    list
        .split(/,\s*|\s+and\s+/i)
        .map((name) => name.trim())
        .filter(Boolean);

const techNamesFor = (lang: 'es' | 'en'): string[] => splitTechs(locale(lang).seo.home.techs);

/** The description the home route will build: t() interpolating its own keys. */
function homeDescriptionFor(lang: 'es' | 'en'): string {
    setLocale(lang);
    return t('seo.home.description', { role: ABOUT.title, techs: t('seo.home.techs') });
}

describe('seo.home keys (RF-2)', () => {
    // The membership half, and the one Q-4 is about: a name the skills section
    // does not show is a hand-written list nothing maintains.
    it('names only technologies that exist in src/data/tech.ts, in both locales', () => {
        const known = TECH.map((tech) => tech.name);

        for (const lang of LOCALES) {
            const unknown = techNamesFor(lang).filter((name) => !known.includes(name));

            expect(
                unknown,
                `seo.home.techs in ${lang}.json names ${unknown.join(', ')}, which ` +
                    `src/data/tech.ts does not list. The description must describe the\n` +
                    `skills the page actually shows, so change the JSON, not the guard.`,
            ).toEqual([]);
        }
    });

    it('names at least two of them, in both locales', () => {
        for (const lang of LOCALES) {
            expect(techNamesFor(lang).length).toBeGreaterThanOrEqual(2);
        }
    });

    // Without this the list could be retyped into the sentence and drift from
    // seo.home.techs while every assertion above still passed.
    it('interpolates the list rather than repeating it in the sentence', () => {
        for (const lang of LOCALES) {
            expect(locale(lang).seo.home.description).toContain('{{techs}}');
        }
    });

    it('reads the role and the named technologies in the generated description', () => {
        for (const lang of LOCALES) {
            const description = homeDescriptionFor(lang);

            expect(description).toContain(ABOUT.title);
            expect(
                techNamesFor(lang).filter((name) => description.includes(name)).length,
            ).toBeGreaterThanOrEqual(2);
        }
    });
});

// RF-3 over the data rather than over a fixture. `homeDescriptionFor()` is the
// string the home route ships, so a length that grows with `ABOUT.title` or with
// the tech list lands here; SHORT and LONG above only prove the mechanism works.
describe('homeDescription over the description the home route ships (RF-3, the data)', () => {
    it('keeps the generated description at most 160 characters', () => {
        for (const lang of LOCALES) {
            const shipped = homeDescription(homeDescriptionFor(lang));

            expect(shipped.length, `seo.home.description in ${lang}.json`).toBeLessThanOrEqual(160);
        }
    });

    it('cuts the generated description at a whole word', () => {
        for (const lang of LOCALES) {
            const generated = homeDescriptionFor(lang);
            const draft = homeDescriptionDraft(generated);
            const shipped = homeDescription(generated);
            const rest = draft.slice(shipped.length);

            expect(draft.startsWith(shipped)).toBe(true);
            expect(rest === '' || /^\s/.test(rest)).toBe(true);
        }
    });

    // The spec's own edge case: the length is an accident of the data, so crossing
    // 160 has to be red here and not a meta tag quietly losing its last clause.
    it('ships the whole generated text, dropping no word', () => {
        for (const lang of LOCALES) {
            const generated = homeDescriptionFor(lang);
            const draft = homeDescriptionDraft(generated);

            expect(
                homeDescription(generated),
                `seo.home.description in ${lang}.json generates ${draft.length} characters, ` +
                    `past RF-3's 160, so the meta tag ships truncated`,
            ).toBe(draft);
        }
    });
});

// D-7: a route's props to a layout are not importable from a test, and no test
// in `npm test` renders a page, so the home's tag is read from source instead.
const layoutTag = (route: string): string => {
    // Comments go first: one in the markup region is emitted verbatim to
    // visitors, and a note naming a prop would read as the prop.
    const source = fs
        .readFileSync(path.join(process.cwd(), 'src', 'pages', route), 'utf-8')
        .replace(/<!--[\s\S]*?-->/g, '');

    const tag = source.match(/<BaseLayout\b[^>]*>/s);
    if (tag === null) throw new Error(`${route} carries no <BaseLayout> opening tag`);

    return tag[0];
};

/** The title the home route builds: its own key, then D-9's literal suffix. */
function homeTitleFor(lang: 'es' | 'en'): string {
    setLocale(lang);
    return `${t('seo.home.title', { role: ABOUT.title })} - Portfolio`;
}

describe('the home route metadata (RF-1)', () => {
    // Anchored on the whitespace, not a bare `title=`: any attribute ending in
    // the prop name would satisfy a substring, which is the sixth guard's shape.
    it('passes its own title and description to the layout', () => {
        const tag = layoutTag('index.astro');

        expect(tag).toMatch(/\stitle=/);
        expect(tag).toMatch(/\sdescription=/);
    });

    // `t()` prints a placeholder it has no value for and leaves it in the string
    // (i18n/i18n.ts:53), so a misspelled one ships with nothing in the console.
    // An unresolved `{{` is the only trace either of these leaves.
    it('leaves no placeholder unresolved in the title or the description', () => {
        for (const lang of LOCALES) {
            expect(homeTitleFor(lang), `title in ${lang}.json`).not.toContain('{{');
            expect(homeDescriptionFor(lang), `description in ${lang}.json`).not.toContain('{{');
        }
    });

    // Read on the key, never on the built title: that one ends in `- Portfolio`,
    // and what is forbidden is saying it twice.
    it('does not repeat the word the suffix already carries', () => {
        for (const lang of LOCALES) {
            const title = locale(lang).seo.home.title.toLowerCase();

            expect(title, `seo.home.title in ${lang}.json`).not.toContain('portafolio');
            expect(title, `seo.home.title in ${lang}.json`).not.toContain('portfolio');
        }
    });
});

// The routes RF-9 protects. They carried their own metadata before this spec
// touched anything, so nothing here says what the values are: the rule is only
// that each route still supplies them, and inheriting the layout default is what
// a well-intended change to that default would cause without anyone noticing.
const OWN_METADATA_ROUTES = ['proyectos/index.astro', 'proyectos/[name].astro', '404.astro'];

describe('the other three routes metadata (RF-9)', () => {
    it('each passes its own title and description to the layout', () => {
        for (const route of OWN_METADATA_ROUTES) {
            // Same reader, same `\s` anchoring and same `s` flag as the home's:
            // `proyectos/index.astro`'s tag spans five lines, and a bare `title=`
            // would also match `data-title=`.
            const tag = layoutTag(route);

            expect(tag, `${route} supplies no title to the layout`).toMatch(/\stitle=/);
            expect(tag, `${route} supplies no description to the layout`).toMatch(/\sdescription=/);
        }
    });
});

// The shared builder (spec 014 moved it to tests/helpers/) with this file's fixture:
// a described TypeScript repository with a fixed date.
function buildRepo(overrides: Partial<GitHubRepo> = {}): GitHubRepo {
    return baseRepo({
        id: 7,
        name: 'portfolio',
        full_name: 'someone/portfolio',
        description: 'A portfolio built with Astro',
        html_url: 'https://github.com/someone/portfolio',
        language: 'TypeScript',
        updated_at: '2026-01-01T00:00:00Z',
        owner: { login: 'someone', avatar_url: '' },
        ...overrides,
    });
}

const PAGE_URL = 'https://example.test/proyectos/portfolio';

// The fallback the route passes down, read from es.json instead of typed here: a
// copy in this file would compare the entity against the test's own idea of it.
const FALLBACK: string = locale('es').project.meta.noDescription;

// `description` is resolved by the route's own function, not written out again.
// That is the whole of RF-6: one value, read where the route reads it.
function entityFor(overrides: Partial<GitHubRepo> = {}) {
    const repo = buildRepo(overrides);
    return projectEntity({ repo, url: PAGE_URL, description: projectDescription(repo, FALLBACK) });
}

describe('projectEntity (RF-4)', () => {
    it('types the entity as SoftwareSourceCode', () => {
        // Equality, never `toContain`: a substring check would also pass on
        // 'SoftwareApplication' + anything, which is the field being corrected.
        expect(entityFor()['@type']).toBe('SoftwareSourceCode');
    });
});

describe('projectEntity (RF-5)', () => {
    it('declares codeRepository as the repository url', () => {
        // An html_url that differs from every other value in the fixture, so the
        // assertion cannot be satisfied by something that merely repeats the repo.
        const entity = entityFor({ html_url: 'https://github.test/someone/other.git' });

        expect(entity.codeRepository).toBe('https://github.test/someone/other.git');
    });
});

describe('projectEntity (RF-7)', () => {
    it('declares the language the repository provides', () => {
        expect(entityFor({ language: 'C#' }).programmingLanguage).toBe('C#');
    });

    it('omits the key entirely when the repository has no language', () => {
        // `in`, not a comparison against undefined: a key present carrying the
        // value undefined passes the second and still ships the field.
        for (const language of [null, undefined, '']) {
            expect('programmingLanguage' in entityFor({ language })).toBe(false);
        }
    });
});

describe('projectEntity (RF-8)', () => {
    it('declares neither applicationCategory nor operatingSystem', () => {
        const entity = entityFor();

        expect('applicationCategory' in entity).toBe(false);
        expect('operatingSystem' in entity).toBe(false);
    });
});

// The three fields no RF names. Plan 004 section 4 fixes them, and a field that
// nothing asserts is a field that can be deleted with the suite still green.
describe('projectEntity (the fields the plan fixes)', () => {
    it('declares the schema.org context', () => {
        expect(entityFor()['@context']).toBe('https://schema.org');
    });

    it('names the repository', () => {
        expect(entityFor({ name: 'renamed-repo' }).name).toBe('renamed-repo');
    });

    it('points url at this page, not at the repository', () => {
        // The two urls are different fields on the entity; swapping them is the
        // plausible drift, so the assertion pins url and RF-5 pins the other.
        const entity = entityFor({ html_url: 'https://github.test/someone/other.git' });

        expect(entity.url).toBe(PAGE_URL);
    });
});

describe('projectDescription (RF-6, the resolution the route uses)', () => {
    it('returns the repository own text verbatim', () => {
        expect(projectDescription(buildRepo(), FALLBACK)).toBe('A portfolio built with Astro');
    });

    it('returns the fallback when the repository carries no text', () => {
        // `'   '` is in the list because `repo.description ?? fallback` does not
        // fire on whitespace, so the trim is what makes the fallback reach the page.
        for (const description of [null, '', '   ']) {
            expect(projectDescription(buildRepo({ description }), FALLBACK)).toBe(FALLBACK);
        }
    });

    it('reads a real fallback from the locale file', () => {
        // Guards the two above: a key missing from es.json makes FALLBACK
        // undefined, and `toBe(undefined)` passes on undefined.
        expect(typeof FALLBACK).toBe('string');
        expect(FALLBACK.length).toBeGreaterThan(0);
    });
});

// Two calls on the builder, one per branch, each fed by the function the route
// resolves with — not by a second copy of the fallback written out in this file.
describe('projectEntity description (RF-6, non-divergence)', () => {
    it('carries the repository own text verbatim', () => {
        expect(entityFor().description).toBe('A portfolio built with Astro');
    });

    it('carries the translated fallback verbatim where the repository has none', () => {
        expect(entityFor({ description: null }).description).toBe(FALLBACK);
    });
});

// ── Spec 002, RF-4: the generator that draws the social preview card ────────
//
// Nothing here reaches a browser (plan D2): the card's readings are exported as
// data, so a token renamed in the sheet turns this file red in a second, and no
// check on an already-rendered PNG ever could.

const ROOT = process.cwd();
const GENERATOR = path.join(ROOT, 'scripts', 'og-cover.ts');
const SHEET_DIR = path.join(ROOT, 'public', 'styles');
const PUBLIC_DIR = path.join(ROOT, 'public');
const PAGES_DIR = path.join(ROOT, 'src', 'pages');

/**
 * CSS and JS comments off before anything is parsed. The sheet's own notes name
 * `--brand-primary` (00-tokens.css:8-12), so a reader on raw text finds the
 * token in the paragraph that explains why it exists.
 */
function stripComments(src: string): string {
    return src
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/^\s*\/\/.*$/gm, ' ');
}

/**
 * `--name: value` by THIS file's reader. Importing the generator's own parser
 * would have the check compare the generator against itself, and then it would
 * agree with any wrong value.
 */
function sheetTokens(file: string = path.join(SHEET_DIR, '00-tokens.css')): Record<string, string> {
    const src = stripComments(fs.readFileSync(file, 'utf-8'));
    const out: Record<string, string> = {};

    for (const m of src.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) out[m[1]] = m[2].trim();

    return out;
}

/**
 * Throws a named error rather than letting a missing generator reach
 * `readFileSync` or an `import()`: either surfaces as an ENOENT or a
 * module-resolution stack trace, which is not a failure anyone can act on.
 */
function requireGenerator(): void {
    if (!fs.existsSync(GENERATOR)) {
        throw new Error(
            `scripts/og-cover.ts does not exist, so there is no generator here to read from:\n` +
                `nothing can redraw the card and RF-4 has nothing to import.`,
        );
    }
}

/**
 * The generator's own readings, imported on demand rather than at the top of
 * the file: a static import takes the whole suite down at collection the moment
 * the generator is deleted.
 */
async function readings(): Promise<Readings> {
    requireGenerator();

    const { readTokens } = await import('../scripts/og-cover.ts');

    return readTokens(SHEET_DIR);
}

describe('the og-cover generator (T-S4b)', () => {
    it('ships the generator, and the readings came out of it', async () => {
        expect(
            fs.existsSync(GENERATOR),
            `scripts/og-cover.ts does not exist. A card with no generator beside it\n` +
                `leaves nothing that can redraw it, and RF-4 has nothing to import.`,
        ).toBe(true);

        expect(
            Object.keys((await readings()).tokens).length,
            'the generator exported no readings at all',
        ).toBeGreaterThan(0);
    });
});

describe('the og-cover readings (T-S4a, RF-4)', () => {
    it('draws with tokens the sheet declares, at the sheet own values', async () => {
        const read = (await readings()).tokens;
        const sheet = sheetTokens();
        const drifted = Object.entries(read).filter(([name, value]) => value !== sheet[name]);

        expect(
            drifted,
            `The generator draws with these at a value 00-tokens.css does not declare:\n` +
                `  ${drifted.map(([n, v]) => `${n}: ${v} (sheet: ${sheet[n]})`).join('\n  ')}`,
        ).toEqual([]);

        // The second half, and the one a rename goes red on: the sheet no longer
        // declares the token, so both readers see `undefined`, the equality
        // above agrees with itself, and only this can still tell.
        const unread = Object.entries(read).filter(([, v]) => typeof v !== 'string' || v.trim() === '');

        expect(
            unread.map(([name]) => name),
            `The generator draws with these and read no value for them, so a renamed\n` +
                `token renders undefined in the card instead of failing the run.`,
        ).toEqual([]);
    });

    // Spec 033: the card is the hero on the dark page, so its text colours come from the dark theme.
    it('draws the dark theme tokens at the dark sheet own values', async () => {
        const read = (await readings()).darkTokens ?? {};
        const sheet = sheetTokens(path.join(SHEET_DIR, 'themes', 'dark.css'));
        expect(Object.keys(read).length, 'the generator exports no dark tokens').toBeGreaterThan(0);
        const off = Object.entries(read).filter(([name, value]) => typeof value !== 'string' || value !== sheet[name]);
        expect(off.map(([n, v]) => `${n}: ${v} (dark.css: ${sheet[n]})`)).toEqual([]);
    });

    it('names only font files that are really there under public/fonts', async () => {
        const { fonts } = await readings();

        // Without this the loop below is satisfied by an empty list, and a
        // generator that exported no font at all passes the check that the
        // fonts it names exist. Every assertion here has to have a body.
        expect(
            fonts.length,
            'the generator exported no font paths, so the check that they exist is empty',
        ).toBeGreaterThan(0);

        for (const font of fonts) {
            const full = path.join(ROOT, 'public', font);

            expect(
                font.startsWith('/fonts/'),
                `${font} is not under /fonts, so it resolves against the current route`,
            ).toBe(true);
            expect(
                fs.existsSync(full) && fs.statSync(full).isFile(),
                `${font} is named by the generator but ${path.relative(ROOT, full)} does not exist`,
            ).toBe(true);
        }
    });
});

// ── Spec 002, RF-7: the accent drawn on the card's ground ──────────────────
//
// The two token names live in the generator and nowhere in this file. A test
// that named them would assert on a pair it picked rather than on the one the
// card draws, and redrawing the card on another gold would stay green.
async function cardContrast(): Promise<number> {
    requireGenerator();
    const { contrastRatio } = await import('../scripts/og-cover.ts');
    const { palette } = await readings();

    // Named rather than a TypeError on the next line: "cannot read property of
    // undefined" is a stack trace, and RF-7's check has to be actionable.
    if (!palette || typeof palette.accent !== 'string' || typeof palette.ground !== 'string') {
        throw new Error(
            `the generator exports no accent/ground pair, so there is nothing here to\n` +
                `compute RF-7's ratio from.`,
        );
    }

    return contrastRatio(palette.accent, palette.ground);
}

/** Every text colour the card draws, measured on its ground (spec 033 RF-8). */
async function textContrasts(): Promise<Record<string, number>> {
    const { contrastRatio } = await import('../scripts/og-cover.ts');
    const { palette } = await readings();
    const out: Record<string, number> = {};
    for (const key of ['accent', 'ink', 'secondary'] as const) {
        const colour = (palette as any)[key];
        if (typeof colour !== 'string' || typeof palette.ground !== 'string') throw new Error(`the generator exports no ${key} or ground`);
        out[key] = contrastRatio(colour, palette.ground);
    }
    return out;
}

describe('the og-cover contrast (T-S7, RF-7)', () => {
    it('draws every text colour on the ground at 4.5:1 or better (spec 033 RF-8)', async () => {
        const ratios = await textContrasts();
        const low = Object.entries(ratios).filter(([, r]) => r < 4.5);
        expect(low.map(([k, r]) => `${k} ${r.toFixed(2)}:1`)).toEqual([]);
    });

    it('draws the accent on the ground at 4.5:1 or better', async () => {
        const ratio = await cardContrast();

        expect(
            ratio,
            `The card draws its accent on its ground at ${ratio.toFixed(2)}:1, under the\n` +
                `4.5:1 RF-7 requires. Measured, not assumed — this number used to live in\n` +
                `a comment on dark.css and nowhere else.`,
        ).toBeGreaterThanOrEqual(4.5);
    });

    // Half (a): falsify the formula against references whose correct answer is
    // known. Without this, `return 99`, a swapped numerator and an unexpanded
    // byte average all satisfy the `>= 4.5` above, while RF-7 says *computed*.
    // 21.0000 kills a constant, 1.0000 a swapped numerator, 4.5422 a dropped
    // sRGB transfer function — a byte average without expanding.
    it('reproduces the WCAG references: black on white 21, white on white 1, #767676 on white 4.5422', async () => {
        requireGenerator();
        const { contrastRatio } = await import('../scripts/og-cover.ts');

        // 21.0000 — the WCAG maximum. No constant or byte average without
        // expanding gives this; only the full sRGB transfer function does.
        expect(
            contrastRatio('#000000', '#FFFFFF'),
            'black on white must be 21.0000, the WCAG maximum. A constant or a\n' +
                'swapped numerator cannot produce this.',
        ).toBe(21);

        // 1.0000 — the WCAG minimum. A swapped numerator gives 1 here too, but
        // the 21 above already caught it; this is the floor.
        expect(
            contrastRatio('#FFFFFF', '#FFFFFF'),
            'white on white must be 1.0000, the WCAG minimum.',
        ).toBe(1);

        // 4.5422 — the canonical threshold grey. This is the only one of the
        // three that detects a dropped sRGB transfer function: a byte average
        // without expanding gives a different number exactly here, which is
        // where this card's gold lives.
        expect(
            contrastRatio('#767676', '#FFFFFF'),
            '#767676 on white must be 4.5422. A byte average without expanding\n' +
                'the sRGB transfer function gives a different number here.',
        ).toBeCloseTo(4.5422, 4);
    });
});

describe('the og-cover generator source (T-LANG)', () => {
    // Two halves as two tests, because in one test the first failing expect
    // hides the second: a probe that replaces the import with a literal then
    // only ever shows the missing import, and the literal half looks untested.
    it('imports ABOUT from the data module', () => {
        // Comments off first: a note quoting the import would satisfy a grep
        // while the file imported nothing, which is the six-guard shape.
        requireGenerator();
        const src = stripComments(fs.readFileSync(GENERATOR, 'utf-8'));
        const imported = src.match(
            /import\s*\{[^}]*\bABOUT\b[^}]*\}\s*from\s*['"][^'"]*data\/about\.ts['"]/,
        );

        expect(
            imported,
            `scripts/og-cover.ts does not import ABOUT from src/data/about.ts. Without it\n` +
                `the card carries its own copy of the name and the role, and a second\n` +
                `source for the identity is exactly what there must not be.`,
        ).not.toBeNull();
    });

    it('spells out no value of ABOUT', () => {
        requireGenerator();
        const src = stripComments(fs.readFileSync(GENERATOR, 'utf-8'));

        // Both values read out of the data module and looked for as text. Typed
        // in here, this would compare the file against this file's own copy, and
        // then it could never go red.
        for (const value of [ABOUT.name, ABOUT.title, ABOUT.location, ABOUT.nameParts.given]) {
            expect(
                src,
                `scripts/og-cover.ts spells out a value that lives in src/data/about.ts, so\n` +
                    `the card is drawn from a literal rather than from the module.`,
            ).not.toContain(value);
        }
    });
});

// ── Spec 002, RF-5: the card is served as a static file, not a route ────────
//
// One behaviour over two listings: `public/` holds the PNG and nothing that
// renders it, and `src/pages/` gains no route matching `og-cover`. The same
// listing settles the Security NFR — the card is the only file added.

/** Every file under `dir`, recursively. */
function filesUnder(dir: string): string[] {
    const out: string[] = [];
    const walk = (current: string) => {
        for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
            const full = path.join(current, entry.name);
            if (entry.isDirectory()) walk(full);
            else out.push(full);
        }
    };
    walk(dir);
    return out;
}

describe('the og-cover listings (T-S5a, T-S5b, RF-5)', () => {
    it('public/ holds one card per locale, no og-cover.png, and nothing that renders them beside it', () => {
        const files = fs.readdirSync(PUBLIC_DIR);

        for (const card of OG_COVERS) {
            expect(files, `public/ holds no ${card}, so a share in that locale resolves a 404.`).toContain(card);
        }
        expect(files, 'og-cover.png is still there beside the per-locale cards (spec 033 RF-9)').not.toContain('og-cover.png');

        // Astro serves `public/` verbatim, so any of these is fetched by the
        // browser as a separate asset. An HTML file beside the PNG means the
        // card is also rendered by the visitor's browser — RF-5 forbids that.
        const renderers = files.filter((f) => /^og-cover[\w-]*\.(html|css|js)$/i.test(f));
        expect(
            renderers,
            `public/ holds files that render the card beside the PNG: ` +
                `${renderers.join(', ')}. RF-5: nothing renders the card in the\n` +
                `visitor's browser — delete them, not this guard.`,
        ).toEqual([]);
    });

    it('src/pages/ gains no route matching og-cover', () => {
        const routes = filesUnder(PAGES_DIR)
            .map((f) => path.relative(PAGES_DIR, f))
            .filter((rel) => /og-cover/i.test(rel));

        expect(
            routes,
            `src/pages/ has routes matching og-cover: ${routes.join(', ')}.\n` +
                `RF-5: a route serving the card renders it in the visitor's browser\n` +
                `and lets it drift from the site's own CSS and fonts.`,
        ).toEqual([]);
    });
});

// ── Spec 002, RF-8: the name fits on one line, reduced until it fits ──────
//
// The font engine is the injectable external here, the same rule as a clock:
// `measure` is a parameter, and no function calls `new Date()` — a timestamp
// would make every run produce different bytes, so the PNG diff carries no signal.

/** A measure that is a function of the text and the size — the font engine
 *  is the injectable external here, the same rule as a clock. */
function fakeMeasure(text: string, sizePx: number): number {
    return text.length * sizePx;
}

/** The type-scale steps the card walks, largest first. */
const TYPE_SCALE_PX = [52, 40, 32, 24, 20, 16, 13, 12];

describe('the og-cover name fit (T-S8a, RF-8)', () => {
    it('draws the name on one line, at or above the floor', async () => {
        requireGenerator();
        const { fitFontSize } = await import('../scripts/og-cover.ts');
        const { content, geometry, type } = await readings();

        const fit = fitFontSize({
            text: content.name,
            measure: fakeMeasure,
            maxWidthPx: geometry.contentWidthPx,
            sizesPx: TYPE_SCALE_PX,
            floorPx: type.floorSizePx,
        });

        expect(fit.lines).toBe(1);
        expect(fit.sizePx).toBeGreaterThanOrEqual(type.floorSizePx);
        // The size must be the largest that fits under the injected measure
        const fittedWidth = fakeMeasure(content.name, fit.sizePx);
        expect(fittedWidth).toBeLessThanOrEqual(geometry.contentWidthPx);
        // And the next size up must NOT fit (otherwise we are not at the largest)
        const nextSizeUp = TYPE_SCALE_PX.find((s) => s > fit.sizePx);
        if (nextSizeUp !== undefined) {
            const nextWidth = fakeMeasure(content.name, nextSizeUp);
            expect(nextWidth).toBeGreaterThan(geometry.contentWidthPx);
        }
    });
});

describe('the og-cover name fit floor (T-S8b, RF-8)', () => {
    it('reports fits: false when even the floor overflows', async () => {
        requireGenerator();
        const { fitFontSize } = await import('../scripts/og-cover.ts');
        const { content, geometry, type } = await readings();

        const fit = fitFontSize({
            text: content.name,
            measure: () => geometry.contentWidthPx + 1,
            maxWidthPx: geometry.contentWidthPx,
            sizesPx: TYPE_SCALE_PX,
            floorPx: type.floorSizePx,
        });

        expect(fit.fits).toBe(false);
    });

    it('returns the largest step when everything fits', async () => {
        requireGenerator();
        const { fitFontSize } = await import('../scripts/og-cover.ts');
        const { content, geometry, type } = await readings();

        const fit = fitFontSize({
            text: content.name,
            measure: () => 1,
            maxWidthPx: geometry.contentWidthPx,
            sizesPx: TYPE_SCALE_PX,
            floorPx: type.floorSizePx,
        });

        expect(fit.sizePx).toBe(TYPE_SCALE_PX[0]);
    });
});

// ── Spec 002, RF-1, RF-2, Size: the artifact itself ──────────────────────────
//
// `pngInfo()` reads the file's own header rather than a constant repeated in
// the test — which is the only reason RF-2 can fail on a 1200×600 card.

// Spec 033: one card per locale the site serves, read from the locale files by this test.
const CARD_LOCALES = fs.readdirSync(path.join(ROOT, 'i18n', 'locales')).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).sort();
const OG_COVERS = CARD_LOCALES.map((l) => `og-cover-${l}.png`);

/**
 * Reads the PNG header of `file`: signature, first chunk, IHDR dimensions
 * and byte size. Reads the file's own header, not a constant repeated here —
 * which is the only reason RF-2 can fail on a 1200×600 card.
 */
function pngInfo(file: string): { width: number; height: number; bytes: number } {
    const buf = fs.readFileSync(file);
    const bytes = buf.length;

    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    for (let i = 0; i < signature.length; i++) {
        if (buf[i] !== signature[i]) {
            throw new Error(
                `${file} is not a PNG: byte ${i} is ${buf[i]?.toString(16)}, expected ${signature[i].toString(16)}`,
            );
        }
    }

    // First chunk must be IHDR
    const chunkType = buf.toString('ascii', 12, 16);
    if (chunkType !== 'IHDR') {
        throw new Error(
            `${file} has no IHDR chunk first: found '${chunkType}' at bytes 12-15`,
        );
    }

    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);

    return { width, height, bytes };
}

describe('the og-cover artifact (T-S1, RF-1)', () => {
    it('ships public/og-cover-<locale>.png for every locale with a real PNG signature', () => {
        expect(OG_COVERS.length, 'no locale files, so no card is asked for').toBeGreaterThan(0);
        for (const card of OG_COVERS) {
            const file = path.join(PUBLIC_DIR, card);
            expect(fs.existsSync(file), `public/${card} does not exist, and og:image composes it for that locale`).toBe(true);
            expect(pngInfo(file).bytes).toBeGreaterThan(0);
        }
    });
});

describe('the og-cover dimensions (T-S2, RF-2)', () => {
    it('is 1200×630, read from the IHDR', () => {
        for (const card of OG_COVERS) {
            const info = pngInfo(path.join(PUBLIC_DIR, card));
            expect([card, info.width, info.height]).toEqual([card, 1200, 630]);
        }
    });
});

// ── Spec 002, RF-3: no runtime and no build dependency ───────────────────────
//
// Constitution 1 and 7 stated on the artifact, not in a comment. Equality by
// value, not "did not grow": a removal is as much a dependency change as an
// addition, and only equality settles both.

describe('the package.json dependency sets (T-S3, RF-3)', () => {
    it('dependencies and devDependencies equal today’s sets exactly, by value', () => {
        const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));

        expect(pkg.dependencies).toEqual({
            '@astrojs/vercel': '^8.2.8',
            astro: '^5.5.5',
        });
        expect(pkg.devDependencies).toEqual({
            '@playwright/test': '^1.56.0',
            '@types/node': '^20.4.2',
            husky: '^9.1.7',
            playwright: '^1.56.0',
            // ^3.2: Vite 6, the one Astro 5 runs on, so .astro compiles in vitest (spec 014 D-1, owner OK).
            vitest: '^3.2.7',
        });
    });

    // Spec 024 RF-1. Source by necessity (constitution 8): the adapter choice lives only in the config.
    it('the adapter the build configuration uses is a runtime dependency', () => {
        const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
        const config = stripComments(fs.readFileSync(path.join(ROOT, 'astro.config.mjs'), 'utf-8'));
        const binding = config.match(/adapter:\s*(\w+)\s*\(/)?.[1];
        const module = binding && config.match(new RegExp(`import\\s+${binding}\\s+from\\s+['"]([^'"]+)['"]`))?.[1];
        expect(module, 'no adapter import found in astro.config.mjs').toBeTruthy();
        expect(Object.keys(pkg.dependencies), `${module} is not a runtime dependency`).toContain(module);
    });
});

describe('the og-cover byte size (T-SIZE)', () => {
    it('is under 5 MB', () => {
        for (const card of OG_COVERS) {
            const info = pngInfo(path.join(PUBLIC_DIR, card));
            expect(info.bytes, `public/${card} is ${info.bytes} bytes, past the 5 MB platform ceiling`).toBeLessThan(5 * 1024 * 1024);
        }
    });
});

// ── Spec 002, RF-6: og:image and twitter:image bind the same file ──────────
//
// A source reader cannot follow the expression into a served `<head>`: no test
// renders a page and `output: "server"` leaves `dist/` without HTML. This
// settles what the tags bind; the served `<head>` is a manual step.

const BASE_LAYOUT = path.join(ROOT, 'src', 'layouts', 'BaseLayout.astro');

describe('the og-cover image tags (T-S6, RF-6)', () => {
    it('binds og:image and twitter:image to the same content expression, composing the locale card from site, and every such file exists with a PNG signature', () => {
        // Comments off first: a note naming `og-cover.png` would satisfy a grep
        // while the tag bound nothing, which is the six-guard shape.
        const src = stripComments(fs.readFileSync(BASE_LAYOUT, 'utf-8'));

        // ── 1. Both tags bind the same `content` expression ──
        const ogImage = src.match(/<meta\s+property=['"]og:image['"]\s+content=\{([^}]+)\}/);
        const twitterImage = src.match(/<meta\s+name=['"]twitter:image['"]\s+content=\{([^}]+)\}/);

        expect(
            ogImage,
            `BaseLayout.astro carries no <meta property='og:image' content={...}> tag. ` +
                `Without it, every share of this site resolves a 404.`,
        ).not.toBeNull();
        expect(
            twitterImage,
            `BaseLayout.astro carries no <meta name='twitter:image' content={...}> tag. ` +
                `Without it, every share of this site resolves a 404.`,
        ).not.toBeNull();

        const ogContent = ogImage![1].trim();
        const twitterContent = twitterImage![1].trim();

        expect(
            twitterContent,
            `og:image binds content={${ogContent}} but twitter:image binds ` +
                `content={${twitterContent}}. They must bind the same expression, ` +
                `or the two platforms resolve different files.`,
        ).toBe(ogContent);

        // ── 2. The pathname that expression composes from `site` is `og-cover.png` ──
        // Find the `const image = ...` definition and verify it composes `${site}/og-cover.png`.
        const imageDef = src.match(/const\s+image\s*=\s*`([^`]+)`/);
        expect(
            imageDef,
            `BaseLayout.astro carries no \`const image = ...\` definition. ` +
                `Without it, the content expression has nothing to bind to.`,
        ).not.toBeNull();

        const imageTemplate = imageDef![1];
        expect(
            imageTemplate,
            `The image definition is \`${imageTemplate}\`, which does not compose ` +
                `\${site}/og-cover-\${locale}.png: a page would share another locale's card (spec 033).`,
        ).toBe('${site}/og-cover-${locale}.png');

        // ── 3. This check stats that path and reads the PNG signature itself ──
        // The pathname is `og-cover.png`, so the file is `public/og-cover.png`.
        // This check defers to nothing: it stats the path and reads the signature.
        for (const card of OG_COVERS) {
            const cardPath = path.join(PUBLIC_DIR, card);
            expect(fs.existsSync(cardPath), `public/${card} does not exist, and og:image composes it for that locale`).toBe(true);
            expect(pngInfo(cardPath).bytes).toBeGreaterThan(0);
        }
    });
});
// ── Spec 033: the card composed like the hero, one per locale ───────────────

const LOCALES_DIR = path.join(ROOT, 'i18n', 'locales');
const FAKE_AVATAR = 'data:image/png;base64,iVBORw0KGgo=';
const localeFile = (l: string) => JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, `${l}.json`), 'utf-8'));
const at = (obj: any, key: string) => key.split('.').reduce((n, k) => n?.[k], obj);
/** The text inside the first element carrying `cls`, tags stripped. */
const textOf = (html: string, cls: string) => (html.match(new RegExp(`class="${cls}"[^>]*>([\\s\\S]*?)</(?:span|p|h1)>`))?.[1] ?? '').replace(/<[^>]+>/g, '').trim();

async function card(locale: string): Promise<string> {
    const gen = await import('../scripts/og-cover.ts');
    const r = await readings();
    return gen.cardHtml(r, gen.phrasesFor(locale, LOCALES_DIR), 52, PUBLIC_DIR, FAKE_AVATAR);
}

describe('the og-cover hero composition (spec 033 RF-1 to RF-5)', () => {
    it('draws the avatar it was given, the name parts, the role and the location', async () => {
        const html = await card('es');
        const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
        const offenders: string[] = [];
        if (imgs.length !== 1 || !imgs[0].includes(`src="${FAKE_AVATAR}"`)) offenders.push(`RF-1: ${imgs.length} images, not the avatar it was given`);
        if (textOf(html, 'given') !== ABOUT.nameParts.given) offenders.push(`RF-2: given reads "${textOf(html, 'given')}"`);
        if (textOf(html, 'family') !== (ABOUT.nameParts.family ?? '')) offenders.push(`RF-2: family reads "${textOf(html, 'family')}"`);
        if (textOf(html, 'role') !== ABOUT.title) offenders.push('RF-3: the role is missing');
        if (textOf(html, 'location') !== ABOUT.location) offenders.push('RF-3: the location is missing');
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    it('draws each locale its own four phrases, in order', async () => {
        const offenders: string[] = [];
        for (const locale of CARD_LOCALES) {
            const html = await card(locale);
            const shown = [...(html.match(/<ul class="phrases">([\s\S]*?)<\/ul>/)?.[1] ?? '').matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1]);
            const want = ABOUT.phraseKeys.map((k) => at(localeFile(locale), k));
            if (JSON.stringify(shown) !== JSON.stringify(want)) offenders.push(`RF-4: ${locale} shows ${shown.join(' · ')}, not ${want.join(' · ')}`);
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    it('draws no action and no bio', async () => {
        const offenders: string[] = [];
        for (const locale of CARD_LOCALES) {
            const html = (await card(locale)).replace(/<style>[\s\S]*?<\/style>/, '');
            const m = localeFile(locale);
            const actions = ['about.cv', ...ABOUT.socials.map((x: any) => x.labelKey)].map((k) => at(m, k));
            if (actions.some((x) => typeof x !== 'string')) offenders.push(`RF-5: ${locale} lacks an action label to check against`);
            for (const label of actions) if (html.includes(`>${label}<`)) offenders.push(`RF-5: ${locale} draws "${label}"`);
            const bio = (ABOUT.bio as any)[locale];
            if (typeof bio === 'string' && html.includes(bio.slice(0, 40))) offenders.push(`RF-5: ${locale} draws the bio`);
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    it('fails naming a phrase key a locale file lacks', async () => {
        const { phrasesFor } = await import('../scripts/og-cover.ts');
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'og-locales-'));
        fs.writeFileSync(path.join(dir, 'xx.json'), JSON.stringify({ about: { phrases: {} } }));
        expect(() => phrasesFor('xx', dir)).toThrow(ABOUT.phraseKeys[0]);
        fs.rmSync(dir, { recursive: true, force: true });
    });
});

describe('the og-cover avatar (spec 033 RF-1, RF-7)', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 9, 8, 7]);

    it('asks ABOUT.avatar once and embeds its bytes', async () => {
        const { fetchAvatar } = await import('../scripts/og-cover.ts');
        const asked: string[] = [];
        const url = await fetchAvatar(ABOUT.avatar, (async (u: any) => { asked.push(String(u)); return new Response(png, { headers: { 'Content-Type': 'image/png' } }); }) as any);
        expect(asked).toEqual([ABOUT.avatar]);
        expect(url).toBe(`data:image/png;base64,${Buffer.from(png).toString('base64')}`);
    });

    it('rejects a failed answer and one that is not an image', async () => {
        const { fetchAvatar } = await import('../scripts/og-cover.ts');
        await expect(fetchAvatar(ABOUT.avatar, (async () => new Response('', { status: 404 })) as any)).rejects.toThrow();
        await expect(fetchAvatar(ABOUT.avatar, (async () => new Response('<html>', { headers: { 'Content-Type': 'text/html' } })) as any)).rejects.toThrow();
    });

    it('leaves every committed card untouched when the avatar cannot be fetched', async () => {
        const { main } = await import('../scripts/og-cover.ts');
        // A copy of what the generator reads, so a broken generator can never overwrite the real cards.
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'og-root-'));
        for (const dir of ['public/styles', 'public/fonts', 'i18n/locales']) fs.cpSync(path.join(ROOT, dir), path.join(root, dir), { recursive: true });
        for (const card of OG_COVERS) fs.copyFileSync(path.join(PUBLIC_DIR, card), path.join(root, 'public', card));
        const snapshot = () => fs.readdirSync(path.join(root, 'public')).filter((f) => f.startsWith('og-cover')).map((f) => [f, createHash('sha1').update(fs.readFileSync(path.join(root, 'public', f))).digest('hex')].join(':')).sort();
        const before = snapshot();
        try {
            for (const answer of [() => new Response('', { status: 500 }), () => new Response('<html>', { headers: { 'Content-Type': 'text/html' } })]) {
                vi.stubGlobal('fetch', async () => answer());
                await expect(main(root)).rejects.toThrow();
                vi.unstubAllGlobals();
            }
            expect(before.length, 'the copy holds no card to compare').toBe(OG_COVERS.length);
            expect(snapshot()).toEqual(before);
        } finally {
            vi.unstubAllGlobals();
            fs.rmSync(root, { recursive: true, force: true });
        }
    }, 30_000);
});

describe('the og-cover generator spells out no colour (spec 033 RF-6)', () => {
    // A source check on purpose (constitution 8): the AGENTS rule is about what the author types.
    it('holds no hex, rgb() or hsl() literal', () => {
        const src = stripComments(fs.readFileSync(GENERATOR, 'utf-8'));
        const literals = src.match(/#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/gi) ?? [];
        expect(literals).toEqual([]);
    });
});

// ── Spec 034: the social tags follow the serving origin, search engines keep production ──

const CONFIGURED_SITE = new URL(stripComments(fs.readFileSync(path.join(ROOT, 'astro.config.mjs'), 'utf-8')).match(/site:\s*['"]([^'"]+)['"]/)![1]).origin;
const PREVIEW = 'https://preview.example.test';

/** Every `<meta>`/`<link>` the head carries, as attribute maps. */
function headTags(html: string): Record<string, string>[] {
    return [...html.matchAll(/<(?:meta|link)\b([^>]*)>/g)].map((m) => Object.fromEntries([...m[1].matchAll(/([\w:-]+)=["']([^"']*)["']/g)].map((a) => [a[1], a[2]])));
}

describe('the head origins (spec 034)', () => {
    // RF-2 (canonical and hreflang on the configured site) is e2e/og-cover-layout.spec.ts's: the
    // Container types a `site` option but never applies it, so Astro.site is empty here.
    it('composes the social tags from the serving origin', async () => {
        const { experimental_AstroContainer: AstroContainer } = await import('astro/container');
        const container = await AstroContainer.create();
        const BaseLayout = (await import('../src/layouts/BaseLayout.astro')).default;
        setLocale('es');
        const html = await container.renderToString(BaseLayout, { props: { title: 't', description: 'd', locale: 'es' }, request: new Request(`${PREVIEW}/proyectos?lang=es`) });
        const tags = headTags(html);
        const meta = (k: string, v: string) => tags.find((t) => t[k] === v)?.content;
        const offenders: string[] = [];
        if (meta('property', 'og:image') !== `${PREVIEW}/og-cover-es.png`) offenders.push(`RF-1: og:image is ${meta('property', 'og:image')}`);
        if (meta('name', 'twitter:image') !== `${PREVIEW}/og-cover-es.png`) offenders.push(`RF-1: twitter:image is ${meta('name', 'twitter:image')}`);
        if (meta('property', 'og:url') !== `${PREVIEW}/proyectos`) offenders.push(`RF-1: og:url is ${meta('property', 'og:url')}`);
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    // A source check on purpose (constitution 8): the rule is about a second copy of a datum.
    it('spells the configured site nowhere in the layout', () => {
        const src = stripComments(fs.readFileSync(BASE_LAYOUT, 'utf-8'));
        expect(src).not.toContain(new URL(CONFIGURED_SITE).host);
    });
});
