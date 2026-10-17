import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { stripComments } from './helpers/source';

// Spec 022 RF-1: every rendered check runs on the one dev server the runner starts. A source
// check by necessity (constitution 8): a spec that starts a server shows only in its code.

const E2E = path.join(process.cwd(), 'e2e');
const files = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true })
    .flatMap((d) => d.isDirectory() ? files(path.join(dir, d.name)) : d.name.endsWith('.ts') ? [path.join(dir, d.name)] : []);

describe('e2e infrastructure (spec 022)', () => {
    it('no file under e2e/ starts a process of its own (RF-1)', () => {
        const offenders = files(E2E).filter((f) => {
            const src = stripComments(fs.readFileSync(f, 'utf-8'));
            return /from\s+['"](node:)?child_process['"]|require\(\s*['"](node:)?child_process['"]\s*\)|(?<![.\w])(spawn|exec|execSync|fork)\s*\(/.test(src);
        }).map((f) => path.relative(process.cwd(), f));
        expect(offenders, `start their own process:\n${offenders.join('\n')}`).toEqual([]);
    });
});
