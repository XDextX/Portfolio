import { describe, it, expect } from 'vitest';
import { EXPERIENCES } from '../src/data/experience';

/**
 * Spec 013: the experience data's shape. No duration exists in the data (RF-2,
 * data half), and each job's chips and glyph are well formed.
 */

const ALLOWED = ['role', 'company', 'period', 'location', 'bullets', 'glyph', 'tech'] as const;
const GLYPHS = ['building', 'plant'];

/**
 * Keys of a job outside the declared shape: a duration, a start month or a typo.
 * @param job one experience entry @param allowed the declared keys
 * @returns the unknown keys, empty when the shape holds
 */
function unknownKeys(job: object, allowed: readonly string[]): string[] {
    return Object.keys(job).filter((k) => !allowed.includes(k));
}

describe('experience shape (spec 013 RF-2, RF-3, RF-4)', () => {
    it('unknownKeys finds what the shape does not declare', () => {
        expect(unknownKeys({ role: 1, duration: 2 }, ALLOWED)).toEqual(['duration']);
        expect(unknownKeys({ role: 1, period: 2 }, ALLOWED)).toEqual([]);
    });

    it('every job keeps to the declared keys, with well-formed chips and a declared glyph', () => {
        const offenders: string[] = [];
        EXPERIENCES.forEach((job, i) => {
            const where = `job ${i + 1} (${job.company})`;
            for (const k of unknownKeys(job, ALLOWED)) offenders.push(`${where} carries an undeclared key "${k}"`);
            const tech = (job as any).tech;
            if (tech !== undefined) {
                if (!Array.isArray(tech)) offenders.push(`${where}: tech is not an array`);
                else {
                    for (const t of tech) if (typeof t !== 'string' || t.trim() === '' || t !== t.trim()) offenders.push(`${where}: chip ${JSON.stringify(t)} is blank or untrimmed`);
                    if (new Set(tech).size !== tech.length) offenders.push(`${where}: a chip repeats`);
                }
            }
            const glyph = (job as any).glyph;
            if (glyph !== undefined && !GLYPHS.includes(glyph)) offenders.push(`${where}: glyph "${glyph}" is not declared`);
        });
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
});

/** Every Spanish string of the experience data: role, period, location and bullets. */
function spanishStrings(jobs: typeof EXPERIENCES): string[] {
    return jobs.flatMap((j) => [j.role.es, j.period.es, ...(j.location ? [j.location.es] : []), ...j.bullets.es]);
}

describe('the Spanish copy keeps its accents (spec 046 RF-4)', () => {
    const WANT: [string, string][] = [['Optimizacion', 'Optimización'], ['indices', 'índices'], ['Implementacion', 'Implementación'], ['Diseno', 'Diseño'], ['moviles', 'móviles'], ['Administracion', 'Administración']];
    const has = (text: string, word: string) => new RegExp(`(?<!\\p{L})${word}(?!\\p{L})`, 'u').test(text);

    it('spanishStrings reads the role, period, location and every bullet', () => {
        const job = { role: { es: 'R', en: '' }, company: 'C', period: { es: 'P', en: '' }, location: { es: 'L', en: '' }, bullets: { es: ['b1', 'b2'], en: [] } };
        expect(spanishStrings([job as any])).toEqual(['R', 'P', 'L', 'b1', 'b2']);
    });

    it('no unaccented word is left, and each accented one is present', () => {
        const text = spanishStrings(EXPERIENCES).join('\n');
        const offenders: string[] = [];
        for (const [plain, accented] of WANT) {
            if (has(text, plain)) offenders.push(`"${plain}" is still unaccented`);
            if (!has(text, accented)) offenders.push(`"${accented}" is missing`);
        }
        expect(offenders, offenders.join('; ')).toEqual([]);
    });
});
