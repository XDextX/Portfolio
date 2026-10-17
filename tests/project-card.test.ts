import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ProjectCard from '../src/components/ProjectCard.astro';
import ProjectPage from '../src/pages/proyectos/[name].astro';
import { setLocale, t } from '@i18n/index';
import * as tech from '../src/data/tech';
import { buildRepo, mockTextResponse } from './helpers/github-mocks';
import { clearGitHubCache } from '../src/pages/lib/github';

/**
 * Spec 014: the project card, rendered through Astro's Container API (D-1) so the cases
 * the live repositories lack — no language, a `javascript:` homepage, a blank
 * description — are rendered, not only computed.
 */

const ROOT = process.cwd();
const data = tech as any;
const LOCALES = ['es', 'en'] as const;
let container: Awaited<ReturnType<typeof AstroContainer.create>>;

beforeAll(async () => { container = await AstroContainer.create(); });
afterEach(() => vi.unstubAllGlobals());

const card = async (repo: object, locale: 'es' | 'en' = 'es') => {
    setLocale(locale);
    return container.renderToString(ProjectCard, { props: { repo: buildRepo(repo as any), locale } });
};
const text = (html: string, cls: string) =>
    (html.match(new RegExp(`class="[^"]*\\b${cls}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/`))?.[1] ?? '').replace(/<[^>]+>/g, '').trim();
// The Demo anchor's href, '' when it renders without one, null when there is no Demo link.
const demoHref = (html: string, label: string) => {
    const m = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].find((x) => x[2].replace(/<[^>]+>/g, '').trim() === label);
    return m ? (m[1].match(/href="([^"]*)"/)?.[1] ?? '') : null;
};

describe('project logos (spec 014 RF-2, RF-3)', () => {
    it('logo files: each known language draws an existing, root-absolute logo', () => {
        if (!data.languageLogo || !data.REPO_LANGUAGES) throw new Error('src/data/tech.ts exports no languageLogo or REPO_LANGUAGES');
        const offenders: string[] = [];
        for (const language of Object.keys(data.REPO_LANGUAGES)) {
            const logo = data.languageLogo(language);
            if (!logo) { offenders.push(`${language} has no logo`); continue; }
            for (const f of data.logoFiles(logo)) {
                if (!f.startsWith('/')) offenders.push(`${language}: ${f} is not root-absolute`);
                else if (!fs.existsSync(path.join(ROOT, 'public', f))) offenders.push(`${language}: public${f} is missing`);
            }
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    it('generic: no language and an unknown one both draw the project mark', () => {
        if (!data.languageLogo) throw new Error('src/data/tech.ts exports no languageLogo');
        expect(data.languageLogo(null)).toBeNull();
        expect(data.languageLogo('JavaScript')).toBeNull();
    });
});

describe('project card, rendered (spec 014 RF-3, RF-5, RF-6, RF-7, RF-8)', () => {
    it('no badge: no language renders no badge and no N/A; a known one renders one', async () => {
        const offenders: string[] = [];
        for (const language of [undefined, null, '', '   ']) {
            const html = await card({ language });
            if (/\bcard-lang\b/.test(html)) offenders.push(`RF-5: language ${JSON.stringify(language)} renders a badge`);
            if (/N\/A/.test(html)) offenders.push(`RF-5: language ${JSON.stringify(language)} prints N/A`);
        }
        const known = await card({ language: 'TypeScript' });
        if (text(known, 'card-lang') !== 'TypeScript') offenders.push('RF-4: the TypeScript card has no TypeScript badge');
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    it('unknown: JavaScript renders its badge, no logo image and one project mark', async () => {
        const html = await card({ language: 'JavaScript' });
        expect(text(html, 'card-lang'), 'RF-4: badge').toBe('JavaScript');
        expect((html.match(/<img\b/g) ?? []).length, 'RF-3: logo image').toBe(0);
        expect((html.match(/\bcard-mark\b/g) ?? []).length, 'RF-3: project mark').toBe(1);
    });

    it('badge logo: a known language draws it in the badge, an unknown one text alone (spec 031 RF-1, RF-3)', async () => {
        // The badge's markup up to its first closing span: the logo or a mark would sit in it.
        const badge = (html: string) => { const i = html.search(/class="[^"]*\bcard-lang\b/); return i < 0 ? '' : html.slice(i, html.indexOf('</span>', i)); };
        const offenders: string[] = [];
        const unknown = badge(await card({ language: 'Cobol' }));
        if (!unknown) offenders.push('RF-3: the Cobol card has no badge');
        if (/<img\b/.test(unknown) || /\bmark\b/.test(unknown)) offenders.push('RF-3: the Cobol badge draws a logo or a mark');
        if (!/<img\b/.test(badge(await card({ language: 'TypeScript' })))) offenders.push('RF-1: the TypeScript badge draws no logo');
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    it('description: the card shows what the detail page resolves, both locales', async () => {
        const offenders: string[] = [];
        for (const locale of LOCALES) {
            for (const description of [null, '', '   ', ' Text ']) {
                const repo = buildRepo({ name: 'fixture', description } as any);
                // GitHub's repo URL (the page reads it in process, spec 023); the README is absent.
                vi.stubGlobal('fetch', async (url: string) =>
                    /\/repos\/[^/]+\/fixture$/.test(String(url)) ? mockTextResponse(JSON.stringify(repo)) : mockTextResponse('', 404));
                clearGitHubCache();
                setLocale(locale);
                const page = await container.renderToString(ProjectPage, {
                    params: { name: 'fixture' },
                    request: new Request(`https://example.test/proyectos/fixture?lang=${locale}`),
                });
                vi.unstubAllGlobals();
                const detail = (page.match(/id="project-desc"[^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? '').trim();
                const shown = text(await card(repo, locale), 'card-desc');
                if (!detail) offenders.push(`RF-6: ${locale} ${JSON.stringify(description)}: no description on the detail page`);
                else if (shown !== detail) offenders.push(`RF-6: ${locale} ${JSON.stringify(description)}: card "${shown}", detail "${detail}"`);
            }
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    it('demo / no demo: only an absolute http(s) homepage links, trimmed', async () => {
        const offenders: string[] = [];
        const label = (setLocale('es'), t('project.actions.liveDemo'));
        for (const [homepage, want] of [[' https://x.test ', 'https://x.test'], ['HTTPS://x.test', 'HTTPS://x.test']] as const) {
            const href = demoHref(await card({ homepage }), label);
            if (href !== want) offenders.push(`RF-7: homepage ${JSON.stringify(homepage)} links ${href}, not ${want}`);
        }
        for (const homepage of ['javascript:alert(1)', 'x.test', 'ftp://x.test', '', null]) {
            const href = demoHref(await card({ homepage }), label);
            if (href !== null) offenders.push(`RF-8: homepage ${JSON.stringify(homepage)} renders a Demo link to ${href}`);
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
});
