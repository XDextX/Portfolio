import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const read = (...parts: string[]) =>
    fs.readFileSync(path.resolve(process.cwd(), ...parts), 'utf-8');

/**
 * Con <ClientRouter /> el DOM se reemplaza en cada navegación: cualquier script
 * que se ligue una sola vez (o que capture el nodo actual al parsear) muere tras
 * la primera transición. Estos tests son la red de seguridad para esa clase de bug.
 */
describe('view transitions: client scripts must be re-bindable', () => {
    const components = [
        'LanguageSwitcher.astro',
        'ThemeSwitch.astro',
        'TechGrid.astro',
        'ContactCard.astro',
        'ProjectsSection.astro',
    ];

    it.each(components)('%s re-binds on astro:page-load', (name) => {
        const src = read('src', 'components', name);
        expect(src).toContain("addEventListener('astro:page-load'");
    });

    it.each(components)('%s does not use is:inline', (name) => {
        const src = read('src', 'components', name);
        expect(src).not.toContain('is:inline');
    });

    it('no component binds listeners to document.currentScript', () => {
        // currentScript apunta al nodo viejo tras un swap: nunca debe usarse para
        // capturar un contenedor que el router va a reemplazar.
        for (const name of components) {
            const src = read('src', 'components', name);
            expect(src, name).not.toContain('currentScript');
        }
    });
});

describe('view transitions: element names match across routes', () => {
    it('ProjectCard and the project detail share the p-{id}-title name', () => {
        const card = read('src', 'components', 'ProjectCard.astro');
        const detail = read('src', 'pages', 'proyectos', '[name].astro');

        // Mismo nombre en origen y destino es lo que hace que la card " viaje".
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
});
