import { describe, it, expect } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';

import { ABOUT } from '../src/data/about';
import { CONTACTS } from '../src/data/contacts';

describe('About data and assets', () => {
    it('ABOUT object has resumeUrl and avatar', () => {
        expect(ABOUT).toBeDefined();
        expect(typeof ABOUT.resumeUrl).toBe('string');
        expect(typeof ABOUT.avatar).toBe('string');
        expect(ABOUT.resumeUrl.length).toBeGreaterThan(0);
        expect(ABOUT.avatar.length).toBeGreaterThan(0);
    });

    it('CV file exists in public/cv folder', async () => {
        const resumePath = path.resolve(process.cwd(), 'public', ABOUT.resumeUrl);

        const stat = await fs.stat(resumePath);
        expect(stat.isFile()).toBe(true);
    });
});
