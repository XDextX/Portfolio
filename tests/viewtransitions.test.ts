import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const COMPONENT_DIR = path.resolve(process.cwd(), 'src', 'components');

const read = (...parts: string[]) =>
    fs.readFileSync(path.resolve(process.cwd(), ...parts), 'utf-8');

const componentNames = () =>
    fs.readdirSync(COMPONENT_DIR).filter((f) => f.endsWith('.astro'));

/**
 * Every component that ships a *client* script — anything that is not JSON-LD —
 * derived from what is on disk.
 *
 * This was a hardcoded list of five names. It was right on the day it was
 * written and wrong the moment a sixth component added a script: a
 * `DOMContentLoaded` binding in `SkillChip.astro` passed all seventeen tests,
 * because the guard only read the five names it had been told about. A list that
 * has to be remembered is a list that goes stale silently.
 *
 * The list stays narrow on purpose. A JSON-LD block has no listener to re-bind,
 * so asking one of it would be a rule with no meaning — and AboutSection's only
 * script is such a block, which is exactly why it never appeared here.
 *
 * `is:inline` is not checked here. It belongs to `markup.test.ts`, which owns it
 * as an allowlist of the single legitimate use and scans pages and layouts as
 * well as components. Two guards for one rule is two places to forget to update,
 * and this one had already been the weaker of the pair.
 */
const componentsWithClientScript = () =>
    componentNames().filter((n) =>
        [...fs.readFileSync(path.join(COMPONENT_DIR, n), 'utf-8').matchAll(/<script\b[^>]*>/g)]
            .some((m) => !/application\/ld\+json/.test(m[0])),
    );

/**
 * Con <ClientRouter /> el DOM se reemplaza en cada navegación: cualquier script
 * que se ligue una sola vez (o que capture el nodo actual al parsear) muere tras
 * la primera transición. Estos tests son la red de seguridad para esa clase de bug.
 */
describe('view transitions: client scripts must be re-bindable', () => {
    const withClientScript = componentsWithClientScript();

    it('finds components shipping a client script', () => {
        // A list that silently resolved to empty would turn every it.each below
        // into zero runs and the whole file would report green.
        expect(withClientScript.length).toBeGreaterThan(0);
    });

    it.each(withClientScript)('%s re-binds on astro:page-load', (name) => {
        const src = read('src', 'components', name);
        expect(src).toContain("addEventListener('astro:page-load'");
    });

    it('no component binds listeners to document.currentScript', () => {
        // currentScript points at the stale node after a swap: never use it to
        // capture a container the router is going to replace.
        for (const name of componentNames()) {
            const src = read('src', 'components', name);
            expect(src, name).not.toContain('currentScript');
        }
    });
});

describe('view transitions: element names match across routes', () => {
    it('ProjectCard and the project detail share the p-{id}-title name', () => {
        const card = read('src', 'components', 'ProjectCard.astro');
        const detail = read('src', 'pages', 'proyectos', '[name].astro');

        // Matching the name in source and destination is what makes the card " travel".
        expect(card).toContain('p-${repo.id}-title');
        expect(detail).toContain('p-${repo.id}-title');
    });

    it('ClientRouter is enabled in the layout', () => {
        const layout = read('src', 'layouts', 'BaseLayout.astro');
        expect(layout).toContain("from 'astro:transitions'");
        expect(layout).toContain('<ClientRouter />');
    });
});

describe('view transitions: no global IDs for JS hooks', () => {
    it('ProjectsSection uses data attributes instead of document.getElementById', () => {
        const src = read('src', 'components', 'ProjectsSection.astro');

        expect(src).not.toContain('getElementById');
        expect(src).toContain('data-projects-root');
        expect(src).toContain('data-projects-grid');
        expect(src).toContain('data-projects-toggle');
    });

    it('ProjectsFooter marks its toggle with data-projects-toggle', () => {
        const src = read('src', 'components', 'ProjectsFooter.astro');
        expect(src).toContain('data-projects-toggle');
        expect(src).not.toMatch(/id='projects-toggle'/);
    });

    it('ThemeSwitch finds its button by data attribute, not a global id', () => {
        const src = read('src', 'components', 'ThemeSwitch.astro');

        // A global id only supports one instance per page and collides with
        // anything else that wants #theme-toggle.
        expect(src).not.toContain('getElementById');
        expect(src).not.toMatch(/id='theme-toggle'/);
        expect(src).toContain('data-theme-toggle');
    });

    it('no component uses a global id to reach an element from a script', () => {
        // getElementById / querySelector('#x') on a script-owned hook is the
        // rule AGENTS.md forbids; data-* keeps several instances independent.
        for (const name of componentNames()) {
            const src = read('src', 'components', name);
            expect(src, name).not.toMatch(/document\.getElementById|querySelector\(\s*['"]#/);
        }
    });
});
