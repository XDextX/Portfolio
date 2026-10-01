import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

import { ABOUT } from '../src/data/about';

describe('AboutSection component source checks', () => {
    const filePath = path.resolve(process.cwd(), 'src', 'components', 'AboutSection.astro');

    it('renders the avatar and the CV/social actions', () => {
        const src = fs.readFileSync(filePath, 'utf-8');

        // El CV se enlaza por prop desde ABOUT.resumeUrl y los sociales se
        // iteran desde ABOUT.socials, así que no buscamos literales aquí.
        expect(src).toMatch(/href=\{ABOUT\.resumeUrl\}/);
        expect(src).toMatch(/ABOUT\.socials\.map/);
        expect(src).toContain('AvatarCircle');
    });

    it('exposes a working mailto link through the About socials', () => {
        // El href de mailto vive en los datos, no en el markup del componente.
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
