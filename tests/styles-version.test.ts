import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

// Spec 038 RF-2: the public sheets' version follows their content — any byte, any file added or
// renamed — and two identical copies agree.

function copy(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'styles-'));
    fs.cpSync(path.join(process.cwd(), 'public', 'styles'), dir, { recursive: true });
    return dir;
}

describe('the public sheets version (spec 038 RF-2)', () => {
    it('agrees on identical copies and moves with any change', async () => {
        const { stylesVersion } = await import('../src/utils/styles-version');
        const a = copy(), b = copy();
        try {
            const base = stylesVersion(a);
            expect(base).toMatch(/^[0-9a-f]{12}$/);
            expect(stylesVersion(b), 'two identical copies disagree').toBe(base);
            const tokens = path.join(b, '00-tokens.css');
            fs.writeFileSync(tokens, fs.readFileSync(tokens, 'utf-8').replace(/;/, ' ;'));
            const edited = stylesVersion(b);
            expect(edited, 'a one-byte edit kept the version').not.toBe(base);
            fs.writeFileSync(path.join(b, 'extra.css'), '');
            expect(stylesVersion(b), 'an added file kept the version').not.toBe(edited);
            fs.rmSync(path.join(b, 'extra.css'));
            fs.renameSync(path.join(a, '01-base.css'), path.join(a, '01-base-renamed.css'));
            expect(stylesVersion(a), 'a renamed file kept the version').not.toBe(base);
        } finally {
            fs.rmSync(a, { recursive: true, force: true });
            fs.rmSync(b, { recursive: true, force: true });
        }
    });
});
