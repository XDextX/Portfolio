import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('AboutSection component source checks', () => {
    it('contains resume download link and mailto', () => {
        const filePath = path.resolve(process.cwd(), 'src', 'components', 'AboutSection.astro');
        const src = fs.readFileSync(filePath, 'utf-8');

        expect(src.includes('ABOUT.resumeUrl')).toBe(true);
        expect(src.includes('mailto:')).toBe(true);
        // Check AvatarCircle usage
        expect(src.includes('AvatarCircle')).toBe(true);
    });
});
