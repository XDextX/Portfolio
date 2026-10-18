import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/**
 * The version of a directory of stylesheets: a hash of every file's relative path and bytes, in
 * path order, so any edit, addition or rename gives new link URLs (spec 038).
 * @param dir the directory, e.g. `public/styles` @returns 12 hex characters
 */
export function stylesVersion(dir: string): string {
    const files: string[] = [];
    const walk = (d: string) => {
        for (const e of fs.readdirSync(d, { withFileTypes: true })) {
            const full = path.join(d, e.name);
            if (e.isDirectory()) walk(full);
            else files.push(path.relative(dir, full).split(path.sep).join('/'));
        }
    };
    walk(dir);
    const hash = createHash('sha256');
    for (const f of files.sort()) hash.update(f).update('\0').update(fs.readFileSync(path.join(dir, f))).update('\0');
    return hash.digest('hex').slice(0, 12);
}
