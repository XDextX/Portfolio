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

    it('gives every social a label to render', () => {
        for (const social of ABOUT.socials) {
            expect(social.label.trim(), social.id).not.toBe('');
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
