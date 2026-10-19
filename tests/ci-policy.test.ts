import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Spec 049: where each suite runs. A source check on purpose (constitution 8): the hook and the
// workflow are configuration, with no output to render. Read with line regexes, no YAML parser.

const ROOT = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf-8');

/** The text with every `#` comment removed, a shebang included; `${{ }}` and a quoted `#` kept. */
function stripHashComments(src: string): string {
    return src.split(/\r?\n/).map((line) => {
        let quote = '';
        for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (quote) { if (c === quote) quote = ''; continue; }
            if (c === '"' || c === "'") quote = c;
            else if (c === '#' && (i === 0 || /\s/.test(line[i - 1]))) return line.slice(0, i).trimEnd();
        }
        return line;
    }).join('\n');
}

/** Each top-level job under `jobs:` as its name and the lines indented under it. */
function jobs(workflow: string): { name: string; body: string }[] {
    const lines = workflow.split('\n');
    const start = lines.findIndex((l) => /^jobs:\s*$/.test(l));
    if (start < 0) return [];
    const out: { name: string; body: string[] }[] = [];
    for (const line of lines.slice(start + 1)) {
        const head = line.match(/^ {2}([\w-]+):\s*$/);
        if (head) out.push({ name: head[1], body: [] });
        else if (out.length && (line.startsWith('   ') || line.trim() === '')) out[out.length - 1].body.push(line);
        else if (line.trim() !== '' && !line.startsWith(' ')) break;
    }
    return out.map((j) => ({ name: j.name, body: j.body.join('\n') }));
}

/** The branches listed under `on.<event>.branches`, or [] when the event is absent. */
function triggerBranches(workflow: string, event: 'push' | 'pull_request'): string[] {
    const lines = workflow.split('\n');
    const on = lines.findIndex((l) => /^on:\s*$/.test(l));
    if (on < 0) return [];
    const at = lines.findIndex((l, i) => i > on && new RegExp(`^ {2}${event}:\\s*$`).test(l));
    if (at < 0) return [];
    const block: string[] = [];
    for (const l of lines.slice(at + 1)) { if (/^ {0,2}\S/.test(l)) break; block.push(l); }
    const text = block.join('\n');
    const inline = text.match(/branches:\s*\[([^\]]*)\]/);
    if (inline) return inline[1].split(',').map((b) => b.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
    return [...text.matchAll(/^\s+-\s+['"]?([^'"\s]+)['"]?\s*$/gm)].map((m) => m[1]);
}

describe('the helpers (spec 049)', () => {
    it('stripHashComments drops comments and a shebang, keeps a quoted # and ${{ }}', () => {
        const src = "#!/usr/bin/env sh\n# a note about npm run test:e2e\necho 'a # b' # trailing\nenv: ${{ secrets.X }}";
        expect(stripHashComments(src)).toBe("\n\necho 'a # b'\nenv: ${{ secrets.X }}");
    });

    it('jobs splits the workflow by top-level job name', () => {
        const wf = 'name: CI\njobs:\n  a:\n    steps:\n      - run: npm test\n  b:\n    needs: [a]\n    steps:\n      - run: npm run test:e2e\n';
        expect(jobs(wf).map((j) => j.name)).toEqual(['a', 'b']);
        expect(jobs(wf)[1].body).toContain('needs: [a]');
        expect(jobs(wf)[0].body).not.toContain('test:e2e');
    });

    it('triggerBranches reads an inline list and a block list, and [] for a missing event', () => {
        const wf = 'on:\n  push:\n    branches: [ main, dev ]\n  pull_request:\n    branches:\n      - main\n';
        expect(triggerBranches(wf, 'push')).toEqual(['main', 'dev']);
        expect(triggerBranches(wf, 'pull_request')).toEqual(['main']);
        expect(triggerBranches('on:\n  push:\n    branches: [ main ]\n', 'pull_request')).toEqual([]);
    });
});

describe('a commit waits on the shortcut check and npm test only (spec 049 RF-1)', () => {
    const hook = stripHashComments(read('.husky/pre-commit'));

    it('runs the marker check and npm test', () => {
        // As commands, not mentions: an echo message quotes both and would satisfy a bare match.
        expect(hook).toMatch(/^\s*if\s+git diff --cached\b.*\|\s*grep\b.*shortcut[:]/m);
        expect(hook).toMatch(/^\s*npm test\s*$/m);
    });

    it('runs no rendered suite', () => {
        expect(hook).not.toMatch(/test:e2e|playwright/);
    });
});

describe('the workflow (spec 049 RF-2 to RF-5)', () => {
    const wf = stripHashComments(read('.github/workflows/ci.yml'));
    const all = jobs(wf);
    // A job runs a suite when a `run:` line is that command, not when a name or note mentions it.
    const e2e = all.find((j) => /^\s*(-\s+)?run:\s*npm run test:e2e\s*$/m.test(j.body))!;
    const unit = all.find((j) => /^\s*(-\s+)?run:\s*npm test\s*$/m.test(j.body))!;
    const condition = e2e?.body.match(/^\s+if:\s*(.+)$/m)?.[1] ?? '';

    it('RF-2: a pull request into main runs the e2e job, after the job that runs npm test', () => {
        expect(e2e && unit, 'a job runs npm test and a job runs npm run test:e2e').toBeTruthy();
        expect(triggerBranches(wf, 'pull_request')).toContain('main');
        expect(e2e.body).toMatch(new RegExp(`needs:\\s*\\[?\\s*${unit.name}\\b`));
        // The exact expression: a loosened one would run the suite on branches, or on nothing.
        expect(condition).toBe("github.ref == 'refs/heads/main' || (github.event_name == 'pull_request' && github.base_ref == 'main')");
    });

    it('RF-3: a push to main runs the same job as a backstop', () => {
        expect(triggerBranches(wf, 'push')).toContain('main');
        expect(condition).toMatch(/refs\/heads\/main/);
    });

    it('RF-4: the workflow downloads no browser (the runner has Chrome installed)', () => {
        expect(wf).not.toMatch(/playwright\s+install/);
    });

    it('RF-5: the e2e step gets the token from the workflow and the selection from variables, never a literal', () => {
        const sources = { GITHUB_TOKEN: 'secrets', GITHUB_TOPIC: 'vars', GITHUB_USERNAME: 'vars' } as const;
        for (const [name, source] of Object.entries(sources)) {
            expect(e2e.body, `${name} from ${source}`).toMatch(new RegExp(`${name}:\\s*\\$\\{\\{\\s*${source}\\.${name}\\s*\\}\\}`));
            expect(e2e.body.match(new RegExp(`${name}:`, 'g')) ?? [], `${name} is set once`).toHaveLength(1);
        }
    });
});

describe('one Node major (spec 049 RF-6)', () => {
    const wf = stripHashComments(read('.github/workflows/ci.yml'));

    it('package.json declares engines.node as 22.x, the Vercel runtime', () => {
        expect(JSON.parse(read('package.json')).engines?.node).toBe('22.x');
    });

    it('every setup-node step reads it from package.json, and none carries a version of its own', () => {
        const lines = wf.split('\n');
        const steps = lines.map((l, i) => (/uses:\s*actions\/setup-node/.test(l) ? i : -1)).filter((i) => i >= 0);
        expect(steps.length, 'the workflow sets up Node').toBeGreaterThan(0);
        for (const i of steps) expect(lines.slice(i, i + 4).join('\n')).toMatch(/node-version-file:\s*package\.json/);
        expect(wf).not.toMatch(/^\s*node-version:/m);
    });
});
