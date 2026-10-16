import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Spec 012: the Skills section's data. *skill table* is RF-1, *logo record* is RF-9
 * with the orphan-file NFR, and the cases pin populatedAreas, logoFor and logoFiles.
 */

const ROOT = process.cwd();
const TECH_DIR = path.join(ROOT, 'public', 'tech');

// A missing export fails by name instead of crashing every test on module shape.
const load = async () => (await import('../src/data/tech')) as any;
const need = (m: any, name: string) => {
    if (m[name] === undefined) throw new Error(`src/data/tech.ts exports no ${name}`);
    return m[name];
};

// Spec 012's Definitions table with today's levels, dated 2026-10-15; sorted by name.
const TABLE = [
    { name: '.NET', level: 'advanced', area: 'backend' },
    { name: 'Angular', level: 'advanced', area: 'frontend' },
    { name: 'Astro', level: 'intermediate', area: 'frontend' },
    { name: 'Azure', level: 'advanced', area: 'cloudDevops' },
    { name: 'Docker', level: 'beginner', area: 'cloudDevops' },
    { name: 'Java', level: 'intermediate', area: 'languages' },
    { name: 'MongoDB', level: 'intermediate', area: 'databases' },
    { name: 'PostgreSQL', level: 'advanced', area: 'databases' },
    { name: 'SSE', level: 'beginner', area: 'backend' },
    { name: 'TypeScript', level: 'advanced', area: 'languages' },
];
const AREAS = ['languages', 'frontend', 'backend', 'databases', 'cloudDevops', 'testing'];

describe('skill table (spec 012 RF-1)', () => {
    it('declares the six areas in order and files each skill under its area and level', async () => {
        const m = await load();
        const areas = need(m, 'SKILL_AREAS') as { key: string }[];
        expect(areas.map((a) => a.key)).toEqual(AREAS);
        const rows = (m.TECH as any[])
            .map((e) => ({ name: e.name, level: e.level, area: e.area }))
            .sort((a, b) => (a.name < b.name ? -1 : 1));
        expect(rows).toEqual(TABLE);
        const undeclared = (m.TECH as any[]).filter((e) => !AREAS.includes(e.area)).map((e) => `${e.name}: ${e.area}`);
        expect(undeclared, 'entries naming an undeclared area').toEqual([]);
    });
});

describe('skill helpers (spec 012 §3)', () => {
    it('populatedAreas walks the declared areas, drops empty ones and ignores entry order', async () => {
        const populatedAreas = need(await load(), 'populatedAreas');
        const areas = [{ key: 'a', glyph: 'x' }, { key: 'b', glyph: 'y' }, { key: 'c', glyph: 'z' }];
        const items = [{ n: 1, area: 'c' }, { n: 2, area: 'a' }, { n: 3, area: 'c' }];
        const got = populatedAreas(areas, items);
        expect(got.map((g: any) => g.key)).toEqual(['a', 'c']);
        expect(got[1].items.map((i: any) => i.n)).toEqual([1, 3]);
        expect(populatedAreas(areas, [...items].reverse()).map((g: any) => g.key)).toEqual(['a', 'c']);
    });

    it('logoFor picks the theme member, and null draws the generic mark', async () => {
        const logoFor = need(await load(), 'logoFor');
        expect(logoFor('/tech/x.svg', 'dark')).toBe('/tech/x.svg');
        expect(logoFor({ light: '/l.svg', dark: '/d.svg' }, 'light')).toBe('/l.svg');
        expect(logoFor({ light: '/l.svg', dark: '/d.svg' }, 'dark')).toBe('/d.svg');
        expect(logoFor(undefined, 'light')).toBeNull();
    });

    it('logoFiles lists the distinct files an entry draws', async () => {
        const logoFiles = need(await load(), 'logoFiles');
        expect(logoFiles(undefined)).toEqual([]);
        expect(logoFiles('/a.svg')).toEqual(['/a.svg']);
        expect(logoFiles({ light: '/a.svg', dark: '/b.svg' })).toEqual(['/a.svg', '/b.svg']);
        expect(logoFiles({ light: '/a.svg', dark: '/a.svg' })).toEqual(['/a.svg']);
    });
});

describe('logo record (spec 012 RF-9, orphan NFR)', () => {
    it('names every drawn logo in the notice, cites only licences that exist, and leaves no orphan', async () => {
        const m = await load();
        const logoFiles = need(m, 'logoFiles');
        const drawn = new Set<string>((m.TECH as any[]).flatMap((e) => logoFiles(e.logo)));
        const offenders: string[] = [];
        const noticeFile = path.join(TECH_DIR, 'NOTICE.md');
        const notice = fs.existsSync(noticeFile) ? fs.readFileSync(noticeFile, 'utf-8') : '';
        if (!notice) offenders.push('public/tech/NOTICE.md is missing');
        for (const file of drawn) {
            if (!file.startsWith('/tech/')) offenders.push(`${file} is not under /tech/`);
            if (!fs.existsSync(path.join(ROOT, 'public', file))) offenders.push(`public${file} is missing`);
            if (!notice.includes(`\`${path.basename(file)}\``)) offenders.push(`NOTICE.md does not name ${path.basename(file)}`);
        }
        for (const cited of new Set([...notice.matchAll(/`(LICENSE[\w.-]*)`/g)].map((x) => x[1]))) {
            if (!fs.existsSync(path.join(TECH_DIR, cited))) offenders.push(`NOTICE.md cites ${cited}, which does not exist`);
        }
        for (const svg of fs.readdirSync(TECH_DIR).filter((f) => f.endsWith('.svg'))) {
            if (![...drawn].some((d) => path.basename(d) === svg)) offenders.push(`public/tech/${svg} is drawn by no entry`);
        }
        if (fs.existsSync(path.join(TECH_DIR, 'mono'))) offenders.push('public/tech/mono/ still exists');
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
});
