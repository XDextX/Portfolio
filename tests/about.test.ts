import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { promises as fsp } from 'fs';
import path from 'path';

import { ABOUT } from '../src/data/about';

const COMPONENT = path.resolve(process.cwd(), 'src', 'components', 'AboutSection.astro');

describe('ABOUT data and assets', () => {
    it('exposes a resumeUrl and an avatar', () => {
        expect(ABOUT).toBeDefined();
        expect(typeof ABOUT.resumeUrl).toBe('string');
        expect(typeof ABOUT.avatar).toBe('string');
        expect(ABOUT.resumeUrl.length).toBeGreaterThan(0);
        expect(ABOUT.avatar.length).toBeGreaterThan(0);
    });

    it('points the CV at a file that exists in public/', async () => {
        // resumeUrl is a root-absolute URL; strip the leading slash to locate it
        // on disk.
        const relative = ABOUT.resumeUrl.replace(/^\/+/, '');
        const stat = await fsp.stat(path.resolve(process.cwd(), 'public', relative));

        expect(stat.isFile()).toBe(true);
    });

    it('ships the avatar as one fetchable https URL', () => {
        // ABOUT.avatar is remote, so there is nothing on disk to stat. What can
        // be checked is that it is a single URL rather than a path that would
        // resolve against the current route.
        expect(ABOUT.avatar).toMatch(/^https:\/\/\S+$/);
    });
});

describe('ABOUT.socials', () => {
    // `socials` is derived from CONTACTS by id, so these assert the derivation
    // held rather than re-listing the channels.
    it('carries the email channel through to the About actions', () => {
        const mailto = ABOUT.socials.find((s) => s.href.startsWith('mailto:'));

        expect(mailto).toBeDefined();
        expect(mailto!.href).toMatch(/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    it('gives every social a label to render', async () => {
        // Spec 018: a contact's label is a name or a locale key; the hero reads its own key.
        const { t } = await import('@i18n/index');
        for (const social of ABOUT.socials) {
            expect(t(social.labelKey).trim(), social.id).not.toBe('');
        }
    });

    it('points every social at an absolute or mailto href', () => {
        for (const social of ABOUT.socials) {
            const browsable = /^https?:\/\//.test(social.href);
            const mailto = social.href.startsWith('mailto:');
            expect(browsable || mailto, `${social.id}: ${social.href}`).toBe(true);
        }
    });
});

/**
 * AboutSection must read its CV link and socials from ABOUT, not from literals
 * in the template. Two checks once lived here are gone: `toContain('AvatarCircle')`
 * passed on the import path, and a ternary check flagged its own explanatory note.
 */
describe('AboutSection sources its data from ABOUT', () => {
    it('links the CV through ABOUT.resumeUrl', () => {
        const src = fs.readFileSync(COMPONENT, 'utf-8');
        expect(src).toMatch(/href=\{ABOUT\.resumeUrl\}/);
    });

    it('iterates ABOUT.socials instead of a hardcoded list', () => {
        const src = fs.readFileSync(COMPONENT, 'utf-8');
        expect(src).toMatch(/ABOUT\.socials\.map/);
    });
});

describe('location once (spec 018 RF-2)', () => {
    // A source read: an equal string duplicated renders the same (constitution 8). Job
    // locations are another datum, so experience.ts is skipped.
    const strip = (src: string) => src.replace(/<!--[\s\S]*?-->/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
    const walk = (dir: string, exts: string[]): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const full = path.join(dir, e.name);
        return e.isDirectory() ? walk(full, exts) : exts.includes(path.extname(e.name)) ? [full] : [];
    });

    it('spells the location datum once, in about.ts', () => {
        const loc = ABOUT.location;
        expect(typeof loc === 'string' && loc.trim() !== '', 'ABOUT.location is empty').toBe(true);
        const files = [
            ...walk(path.join(process.cwd(), 'src', 'data'), ['.ts']).filter((f) => path.basename(f) !== 'experience.ts'),
            ...['components', 'layouts', 'pages'].flatMap((d) => walk(path.join(process.cwd(), 'src', d), ['.astro'])),
            ...walk(path.join(process.cwd(), 'i18n', 'locales'), ['.json']),
        ];
        const hits = files.map((f) => ({ f: path.relative(process.cwd(), f), n: strip(fs.readFileSync(f, 'utf-8')).split(loc).length - 1 })).filter((h) => h.n > 0);
        const total = hits.reduce((a, h) => a + h.n, 0);
        expect({ total, where: hits.map((h) => `${h.f} x${h.n}`) }).toEqual({ total: 1, where: [path.join('src', 'data', 'about.ts') + ' x1'] });
    });
});
