import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

import { ABOUT } from '../src/data/about';

describe('AboutSection component source checks', () => {
    const filePath = path.resolve(process.cwd(), 'src', 'components', 'AboutSection.astro');

    it('renders the avatar and the CV/social actions', () => {
        const src = fs.readFileSync(filePath, 'utf-8');

        // The CV links via a prop from ABOUT.resumeUrl and the socials are iterated
        // from ABOUT.socials, so we do not grep for literals here.
        expect(src).toMatch(/href=\{ABOUT\.resumeUrl\}/);
        expect(src).toMatch(/ABOUT\.socials\.map/);
        expect(src).toContain('AvatarCircle');
    });

    it('exposes a working mailto link through the About socials', () => {
        // The mailto href lives in the data, not in the component markup.
        const mailto = ABOUT.socials.find((s) => s.href.startsWith('mailto:'));

        expect(mailto).toBeDefined();
        expect(mailto!.href).toMatch(/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/);
        expect(mailto!.label.length).toBeGreaterThan(0);
    });

    it('keeps every social href absolute or mailto', () => {
        for (const social of ABOUT.socials) {
            const isAbsolute = /^https?:\/\//.test(social.href);
            const isMailto = social.href.startsWith('mailto:');
            expect(isAbsolute || isMailto, `${social.id}: ${social.href}`).toBe(true);
        }
    });
});
