import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Spec 011: the "Lo que construyo" steps. *process data* is RF-3 (absorbs 003's
 * RF-2, RF-3, RF-6); *process strings* is the editable-content NFR, 003's walk
 * widened to every text of the section, tags as whole tokens.
 */

type Lang = 'es' | 'en';
const LOCALES: readonly Lang[] = ['es', 'en'];
const COMPONENTS_DIR = path.resolve(process.cwd(), 'src', 'components');

const loadProcess = async () => (await import('../src/data/process')).PROCESS;

/**
 * Every fault in the section's data, one message each.
 * @param p the section's data @param locales the locales that must be complete
 * @returns the messages; `[]` means valid
 */
function stepIssues(p: any, locales: readonly Lang[]): string[] {
    const out: string[] = [];
    const blank = (v: unknown) => typeof v !== 'string' || v.trim() === '';
    for (const l of locales) {
        if (blank(p?.intro?.[l])) out.push(`intro.${l} is blank`);
        if (blank(p?.note?.[l])) out.push(`note.${l} is blank`);
    }
    const steps: any[] = p?.steps ?? [];
    if (steps.length !== 4) out.push(`${steps.length} steps, not 4`);
    for (const l of locales) {
        steps.forEach((s, i) => {
            if (blank(s.title?.[l])) out.push(`step ${i + 1} title.${l} is blank`);
            if (blank(s.description?.[l])) out.push(`step ${i + 1} description.${l} is blank`);
            const tags: unknown[] = s.tags?.[l] ?? [];
            if (tags.length < 2 || tags.length > 3) out.push(`step ${i + 1} has ${tags.length} ${l} tags, not 2-3`);
            tags.forEach((t, j) => { if (blank(t)) out.push(`step ${i + 1} tag ${j + 1}.${l} is blank`); });
        });
        for (const field of ['title', 'description'] as const) {
            const seen = steps.map((s) => s[field]?.[l]);
            seen.forEach((v, i) => {
                if (!blank(v) && seen.indexOf(v) !== i) out.push(`step ${i + 1} ${field}.${l} repeats step ${seen.indexOf(v) + 1}'s`);
            });
        }
    }
    return out;
}

const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');

function componentFiles(): string[] {
    if (!fs.existsSync(COMPONENTS_DIR)) return [];
    return fs.readdirSync(COMPONENTS_DIR, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith('.astro'))
        .map((entry) => path.join(COMPONENTS_DIR, entry.name));
}

describe('process data (spec 011 RF-3)', () => {
    it('carries a complete, distinct entry for each step in both locales', async () => {
        const issues = stepIssues(await loadProcess(), LOCALES);
        expect(issues, issues.join('\n')).toEqual([]);
    });

    it('shows bulb, code, database, rocket in step order', async () => {
        expect((await loadProcess()).steps.map((s: any) => s.icon)).toEqual(['bulb', 'code', 'database', 'rocket']);
    });

    it('stepIssues catches each fault it names', () => {
        const step = (n: number) => ({ icon: 'bulb', title: { es: `t${n}`, en: `t${n}` }, description: { es: `d${n}`, en: `d${n}` }, tags: { es: ['a', 'b'], en: ['a', 'b'] } });
        const ok = { intro: { es: 'i', en: 'i' }, note: { es: 'n', en: 'n' }, steps: [1, 2, 3, 4].map(step) };
        expect(stepIssues(ok, LOCALES)).toEqual([]);
        expect(stepIssues({ ...ok, steps: ok.steps.slice(0, 3) }, LOCALES)).toHaveLength(1);
        const dup = structuredClone(ok); dup.steps[2].description.es = 'd1';
        expect(stepIssues(dup, LOCALES)).toEqual(["step 3 description.es repeats step 1's"]);
    });
});

describe('process strings live in PROCESS, not in components (spec 011)', () => {
    it('finds component files to check', () => {
        expect(componentFiles().length).toBeGreaterThan(0);
    });

    it('spells no text of the section in any component', async () => {
        const p = await loadProcess();
        const texts = LOCALES.flatMap((l) => [p.intro[l], p.note[l], ...p.steps.flatMap((s: any) => [s.title[l], s.description[l]])]).filter((t: string) => t.trim() !== '');
        const tags = [...new Set(LOCALES.flatMap((l) => p.steps.flatMap((s: any) => [...s.tags[l]])))] as string[];
        const offenders: string[] = [];
        for (const file of componentFiles()) {
            const src = stripComments(fs.readFileSync(file, 'utf-8'));
            const where = path.relative(process.cwd(), file);
            for (const text of texts) if (src.includes(text)) offenders.push(`${where} spells "${text.slice(0, 48)}"`);
            for (const tag of tags) {
                const esc = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                if (new RegExp(`(?<![\\p{L}/])${esc}(?![\\p{L}/])`, 'u').test(src)) offenders.push(`${where} spells the tag "${tag}"`);
            }
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
});
