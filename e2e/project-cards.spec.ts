import { test, expect, type Page } from '@playwright/test';
import { E2E_URL as DEV_URL } from './helpers/server';
import { THEMES, openIn, installHelpers, settled, type Theme } from './helpers/rendered';
import { contrast } from '../tests/helpers/colour';
import * as tech from '../src/data/tech';

// Spec 014: project cards. RF-1 placeholder, RF-2 logo, RF-3 mark, RF-4 badge; fill, badge
// contrast, no project image, the home preview of four. Expectations from the live list (D-8).

let REPOS: any[] = [];
// github.ts reads import.meta.env at load, which Playwright has none of; the spec's rule is
// derived here instead, an oracle that does not call the helper under test.
const repoLanguage = (r: any): string | null => (typeof r.language === 'string' && r.language.trim()) || null;
const d = tech as any;
const ROUTES = ['/', '/proyectos'] as const;

const need = (m: any, name: string) => { if (typeof m[name] === 'undefined') throw new Error(`${name} is not exported`); return m[name]; };

async function openCards(page: Page, theme: Theme, route: string) {
    await openIn(page, DEV_URL, theme, route);
    await installHelpers(page);
}

// Every card, read in the page: boxes, images, mark, badge and colours.
const readCards = (page: Page) =>
    settled(() => page.locator('.project-card').evaluateAll((cards) => cards.filter((c) => (c as HTMLElement).checkVisibility()).map((c) => {
        const w = window as any;
        const box = (e: Element | null) => { if (!e) return null; const b = e.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom }; };
        const media = c.querySelector('.card-media');
        const badge = c.querySelector('.card-lang');
        const mark = c.querySelector('.card-mark');
        const imgs = [...c.querySelectorAll('img')];
        // Spec 031: the badge carries the language's logo too; the placeholder's picture is the one outside it.
        const shown = imgs.filter((i) => i.checkVisibility() && !i.closest('.card-lang'));
        const bgImages = media ? [media, ...media.querySelectorAll('*')].map((e) => getComputedStyle(e).backgroundImage).filter((b) => b !== 'none') : [];
        return {
            name: c.querySelector('.card-title a')?.textContent?.trim() ?? '',
            card: box(c), media: box(media), title: box(c.querySelector('h3')),
            fill: media ? w.__toHex(getComputedStyle(media).backgroundColor) : null,
            shown: shown.map((i) => ({ src: new URL(i.currentSrc || i.src).pathname, alt: i.getAttribute('alt'), box: box(i) })),
            all: imgs.map((i) => new URL(i.getAttribute('src')!, location.href).pathname),
            mark: mark ? { mask: getComputedStyle(mark).maskImage || getComputedStyle(mark).webkitMaskImage, hidden: mark.getAttribute('aria-hidden') === 'true', box: box(mark) } : null,
            badge: badge ? { text: badge.textContent?.trim(), box: box(badge), fg: w.__toHex(getComputedStyle(badge).color), bg: w.__toHex(getComputedStyle(badge).backgroundColor) } : null,
            bgImages,
            preview: !!c.querySelector('.card-preview'),
        };
    })));

const overlap = (a: any, b: any) => !!a && !!b && a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
const inside = (a: any, b: any) => !!a && !!b && a.l >= b.l - 0.5 && a.r <= b.r + 0.5 && a.t >= b.t - 0.5 && a.b <= b.b + 0.5;

test.describe('project cards (spec 014)', () => {
    test.describe.configure({ mode: 'default' });

    test.beforeAll(async ({ request }) => {
        REPOS = await (await request.get(DEV_URL + '/api/github-list.json')).json();
    });

    for (const theme of THEMES) for (const route of ROUTES) {
        test(`cards: placeholder, logo or mark, badge, fill, no project image — ${route}, ${theme} (RF-1–RF-4)`, async ({ page }) => {
            const languageLogo = need(d, 'languageLogo');
            const offenders: string[] = [];
            const known = REPOS.filter((r) => languageLogo(repoLanguage(r)));
            const bare = REPOS.filter((r) => !repoLanguage(r));
            if (!known.length || !bare.length) offenders.push(`data: needs a known-language and a no-language repository (${known.length}, ${bare.length})`);
            await openCards(page, theme, route);
            const neutral = await page.evaluate(() => { const s = document.createElement('span'); s.style.color = 'var(--neutral-200)'; document.body.append(s); const c = (window as any).__toHex(getComputedStyle(s).color); s.remove(); return c; });
            const cards = await readCards(page);
            // Spec 030: the home shows one row of four; /proyectos shows every repository.
            const expected = route === '/' ? Math.min(4, REPOS.length) : REPOS.length;
            if (cards.length !== expected) offenders.push(`${route}: ${cards.length} cards, not ${expected} for ${REPOS.length} repositories`);
            for (const c of cards) {
                const repo = REPOS.find((r) => r.name === c.name);
                if (!repo) { offenders.push(`${c.name}: not in the list`); continue; }
                const lang = repoLanguage(repo);
                const logo = languageLogo(lang);
                const where = `${route} ${theme} ${c.name}`;
                if (!c.media) { offenders.push(`RF-1: ${where} has no placeholder`); continue; }
                if (!inside(c.media, c.card) || (c.title && c.media.b > c.title.t + 0.5)) offenders.push(`RF-1: ${where} placeholder is not above the name inside the card`);
                if (c.fill !== neutral) offenders.push(`NFR: ${where} placeholder fill ${c.fill}, not ${neutral}`);
                if (c.bgImages.length) offenders.push(`NFR: ${where} draws a background image (${c.bgImages[0].slice(0, 40)})`);
                // Spec 032: the card's own same-origin preview is the one project image allowed.
                const preview = `/api/v1/projects/preview/${encodeURIComponent(c.name)}`;
                const allowed = [...(logo ? d.logoFiles(logo) : []), ...(c.preview ? [preview] : [])];
                for (const src of c.all) if (!allowed.includes(src)) offenders.push(`NFR: ${where} draws ${src}, not its language logo`);
                if (c.preview) {
                    if (c.shown.length !== 1 || c.shown[0].src !== preview) offenders.push(`spec 032: ${where} shows ${c.shown.map((s) => s.src).join(', ')}, not its preview alone`);
                } else if (logo) {
                    const want = d.logoFor(logo, theme);
                    if (c.shown.length !== 1 || c.shown[0].src !== want) offenders.push(`RF-2: ${where} shows ${c.shown.map((s) => s.src).join(', ') || 'no image'}, not ${want}`);
                    else if (c.shown[0].alt !== '') offenders.push(`RF-2: ${where} logo alt is ${JSON.stringify(c.shown[0].alt)}`);
                } else {
                    if (c.shown.length) offenders.push(`RF-3: ${where} shows an image with no known language`);
                    if (!c.mark) offenders.push(`RF-3: ${where} has no project mark`);
                    else {
                        if (!c.mark.mask.includes(d.PROJECT_MARK)) offenders.push(`RF-3: ${where} mark masks ${c.mark.mask}`);
                        if (!c.mark.hidden) offenders.push(`RF-3: ${where} mark is not aria-hidden`);
                    }
                }
                if (lang) {
                    if (!c.badge || c.badge.text !== lang) offenders.push(`RF-4: ${where} badge reads ${c.badge?.text ?? 'nothing'}, not ${lang}`);
                    else {
                        if (!inside(c.badge.box, c.media)) offenders.push(`RF-4: ${where} badge sits outside the placeholder`);
                        const pic = c.shown[0]?.box ?? c.mark?.box;
                        // Owner, 2026-10-17 (spec 031): the wider badge may overlap the picture's edge, never its centre.
                        // Spec 032: over a full-bleed preview the badge overlaps it by design.
                        if (pic && !c.preview && overlap(c.badge.box, pic) && c.badge.box.l < (pic.l + pic.r) / 2) offenders.push(`RF-4: ${where} badge covers the logo or mark past its centre`);
                        const ratio = contrast(c.badge.fg, c.badge.bg);
                        if (ratio < 4.5) offenders.push(`NFR: ${where} badge ${c.badge.fg} on ${c.badge.bg} is ${ratio.toFixed(2)}:1`);
                    }
                } else if (c.badge) offenders.push(`RF-5: ${where} shows a badge with no language`);
            }
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }

    test('preview: the home shows four cards before "see more" (NFR)', async ({ page }) => {
        await openIn(page, DEV_URL, 'light', '/');
        const visible = await page.locator('.project-card').evaluateAll((cs) => cs.filter((c) => (c as HTMLElement).checkVisibility()).length);
        expect(visible, `the home shows ${visible} cards before expanding`).toBe(Math.min(4, REPOS.length));
    });
});
