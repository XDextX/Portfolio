import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

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

const locale = (name: 'es' | 'en') =>
    JSON.parse(fs.readFileSync(path.join(process.cwd(), 'i18n', 'locales', `${name}.json`), 'utf-8'));

const LOCALES = ['es', 'en'] as const;

// `@i18n/index` runs `init()` at import time and needs an alias the runner has
// none of (D-2). `i18n/i18n` is the same `t()` underneath, imported by path and
// initialised here, so the description is interpolated by the shipping code.
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

// Local to this file on purpose: the builder in github-helpers.test.ts is not
// exported, and hoisting it into tests/helpers/ would edit a file no task here owns.
function buildRepo(overrides: Partial<GitHubRepo> = {}): GitHubRepo {
    return {
        id: 7,
        name: 'portfolio',
        full_name: 'someone/portfolio',
        description: 'A portfolio built with Astro',
        html_url: 'https://github.com/someone/portfolio',
        language: 'TypeScript',
        stargazers_count: 0,
        forks_count: 0,
        updated_at: '2026-01-01T00:00:00Z',
        owner: { login: 'someone', avatar_url: '' },
        ...overrides,
    };
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