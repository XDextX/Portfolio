import { describe, it, expect } from 'vitest';
import { tidyReadme } from '../src/pages/lib/github';

// Spec 044 RF-6, RF-7: GitHub's README heading markup as the project page shows it.

/** GitHub's current shape: the anchor, id and all, follows its heading in a wrapper. */
const heading = (level: number, text: string, slug: string) =>
    `<div class="markdown-heading" dir="auto"><h${level} class="heading-element" dir="auto">${text}</h${level}>` +
    `<a id="user-content-${slug}" class="anchor" aria-label="Permalink: ${text}" href="#${slug}"><svg class="octicon octicon-link"><path d="M1"></path></svg></a></div>`;
/** The older shape: the anchor first, inside the heading. */
const oldHeading = (level: number, text: string, slug: string) =>
    `<h${level} dir="auto"><a id="user-content-${slug}" class="anchor" href="#${slug}"><svg class="octicon octicon-link"></svg></a>${text}</h${level}>`;

describe('tidyReadme (spec 044)', () => {
    it('RF-6: drops a leading heading that is the repository name, wrapper included', () => {
        const out = tidyReadme(heading(1, 'My App', 'my-app') + '<p>Body</p>', 'my-app');
        expect(out).toBe('<p>Body</p>');
    });

    it('RF-6: drops it past a badge row, which has no text', () => {
        const badges = '<p><a href="x"><img alt="build" src="b.svg"></a></p>';
        expect(tidyReadme(badges + heading(1, 'My App', 'my-app') + '<p>Body</p>', 'my-app')).toBe(badges + '<p>Body</p>');
    });

    it('RF-6: names a linked heading and ignores an image alt', () => {
        expect(tidyReadme('<h1><a href="u">My App</a></h1><p>B</p>', 'my-app')).toBe('<p>B</p>');
        expect(tidyReadme('<h1><img alt="logo" src="l.png"> My App</h1><p>B</p>', 'my-app')).toBe('<p>B</p>');
    });

    it('RF-6: keeps a longer title, a heading after text, and a different name', () => {
        const longer = heading(1, 'My App — a tool', 'my-app--a-tool');
        expect(tidyReadme(longer, 'my-app')).not.toContain('Permalink');
        expect(tidyReadme(longer, 'my-app')).toContain('My App — a tool');
        expect(tidyReadme('<p>Intro text</p><h1>My App</h1>', 'my-app')).toContain('<h1>My App</h1>');
        expect(tidyReadme('<h1>Usage</h1>', 'my-app')).toContain('Usage');
    });

    it('RF-7: removes every anchor and puts its id on its heading, both shapes', () => {
        const out = tidyReadme(heading(2, 'Usage', 'usage') + oldHeading(3, 'Install', 'install'), 'other');
        expect(out).not.toMatch(/class="anchor"|octicon/);
        expect(out).toMatch(/<h2 [^>]*id="user-content-usage"[^>]*>Usage<\/h2>/);
        expect(out).toMatch(/<h3 [^>]*id="user-content-install"[^>]*>Install<\/h3>/);
    });

    it('RF-7: an anchor goes only to the heading it follows, never to an earlier anchorless one', () => {
        const out = tidyReadme('<h2 align="center">Intro</h2><p>text</p>' + heading(2, 'Usage', 'usage'), 'other');
        expect(out).toContain('<h2 align="center">Intro</h2>');
        expect(out).toMatch(/<h2 [^>]*id="user-content-usage"[^>]*>Usage<\/h2>/);
        expect(out.match(/id="user-content-usage"/g)).toHaveLength(1);
    });

    it('RF-7: removes the leading heading together with its id (it is not shown)', () => {
        expect(tidyReadme(heading(1, 'My App', 'my-app') + heading(2, 'Usage', 'usage'), 'my-app')).not.toContain('user-content-my-app');
    });

    it('leaves input without headings, and the empty string, unchanged', () => {
        expect(tidyReadme('<p>No headings</p>', 'x')).toBe('<p>No headings</p>');
        expect(tidyReadme('', 'x')).toBe('');
    });

    it('leaves a later image and an anchor away from any heading untouched, byte for byte', () => {
        const tail = '<p><img src="/api/v1/projects/readme/o/n/image/3" alt="a"></p><a class="anchor" id="x" href="#x">hi</a>';
        expect(tidyReadme(heading(2, 'Usage', 'usage') + tail, 'other').endsWith(tail)).toBe(true);
    });
});
