import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { E2E_URL } from './helpers/server';
import { THEMES, openIn } from './helpers/rendered';
import { ABOUT } from '../src/data/about';

// Spec 035: the hero arranged like the proposal — framed avatar tile, larger role line, phrases
// stacked on the right on a wide sheet and in a row under the name on a narrow one, the proposal's
// bio, the hero's own «Email» label.

const HERO = 'section.section--hero';
const read = (l: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'i18n', 'locales', `${l}.json`), 'utf-8'));
const at = (o: any, k: string) => k.split('.').reduce((n, p) => n?.[p], o);
const PROPOSAL_BIO = 'Desarrollo soluciones de software completas, desde la arquitectura hasta su puesta en producción. Más de 6 años de experiencia trabajando con .NET, Java, TypeScript y tecnologías en la nube.';

async function open(page: Page, width: number, theme: 'light' | 'dark' = 'light', locale = 'es') {
    await page.setViewportSize({ width, height: 900 });
    await openIn(page, E2E_URL, theme, `/?lang=${locale}`);
    await page.waitForTimeout(400);
}

const readHero = (page: Page) => page.locator(HERO).evaluate((hero) => {
    const box = (e: Element | null) => { if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height }; };
    const tile = hero.querySelector('.about-avatar')!;
    const ts = getComputedStyle(tile);
    const img = tile.querySelector('img');
    const probe = (v: string) => { const i = document.createElement('i'); i.style.cssText = v; hero.append(i); const cs = getComputedStyle(i); const out = { size: cs.fontSize, colour: cs.color }; i.remove(); return out; };
    const items = [...hero.querySelectorAll('.about-phrases li')];
    return {
        tile: box(tile), img: box(img), name: box(hero.querySelector('.about-name')), sub: box(hero.querySelector('.about-sub')),
        bio: box(hero.querySelector('.about-bio')), bioText: hero.querySelector('.about-bio')?.textContent?.trim(),
        border: { width: parseFloat(ts.borderTopWidth), colour: ts.borderTopColor, style: ts.borderTopStyle }, padding: parseFloat(ts.paddingTop),
        borderToken: probe('color: var(--color-border)').colour, base: probe('font-size: var(--fs-base)').size,
        job: getComputedStyle(hero.querySelector('.about-job')!).fontSize, location: getComputedStyle(hero.querySelector('.about-location')!).fontSize,
        phrases: items.map((li) => {
            const d = getComputedStyle(li, '::before'), a = getComputedStyle(li, '::after');
            return { ...box(li)!, style: getComputedStyle(li).fontStyle, before: d.content,
                mark: { bg: d.backgroundColor, w: d.width, h: d.height, mask: d.maskImage || (d as any).webkitMaskImage, top: parseFloat(d.top) },
                seg: { content: a.content, bg: a.backgroundColor, top: parseFloat(a.top), h: parseFloat(a.height) } };
        }),
        accent: probe('color: var(--accent-text)').colour,
        content: box(hero),
        email: [...hero.querySelectorAll('.btn-social')].find((a) => a.getAttribute('href')?.startsWith('mailto:'))?.textContent?.trim(),
    };
});

for (const theme of THEMES) {
    test(`tile and role line — ${theme} (RF-1, RF-2)`, async ({ page }) => {
        await open(page, 1280, theme);
        const r = await readHero(page);
        const offenders: string[] = [];
        if (!(r.border.width >= 1 && r.border.style !== 'none' && r.border.colour === r.borderToken)) offenders.push(`RF-1: the tile border is ${r.border.width}px ${r.border.style} ${r.border.colour}, not --color-border`);
        if (!(r.padding > 0)) offenders.push('RF-1: the tile has no padding around the image');
        if (Math.abs(r.tile!.t - r.name!.t) > 4) offenders.push(`RF-1: the tile's top ${r.tile!.t.toFixed(0)} is not level with the name's ${r.name!.t.toFixed(0)}`);
        if (!r.img || r.img.w > 140 || r.img.h > 140) offenders.push(`RF-1: the image is ${r.img?.w.toFixed(0)}×${r.img?.h.toFixed(0)}`);
        if (r.job !== r.base || r.location !== r.base) offenders.push(`RF-2: role ${r.job}, location ${r.location}, not ${r.base}`);
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
}

test('phrases stacked on the right at 1280 (RF-3)', async ({ page }) => {
    await open(page, 1280);
    const r = await readHero(page);
    const offenders: string[] = [];
    const p = r.phrases;
    if (p.length !== 4) offenders.push(`RF-3: ${p.length} phrases`);
    // The flow (owner, at the visual review): a gold check at each phrase, a gold segment to the next.
    p.forEach((li, i) => {
        if (li.before === 'none' || li.before === 'normal' || li.mark.bg !== r.accent || li.mark.w !== li.mark.h || !li.mark.mask.includes('circle-check.svg')) offenders.push(`RF-3: phrase ${i + 1} mark is ${JSON.stringify(li.mark)}`);
        if (i < p.length - 1) {
            const next = p[i + 1];
            const end = li.t + li.seg.top + li.seg.h;
            const nextMark = next.t + next.mark.top;
            if (li.seg.content === 'none' || li.seg.bg !== r.accent || li.seg.h <= 0 || end > nextMark + 0.5 || nextMark - end > 6) offenders.push(`RF-3: phrase ${i + 1} segment ${JSON.stringify(li.seg)} does not reach the next check (ends ${end.toFixed(1)}, check at ${nextMark.toFixed(1)})`);
        } else if (li.seg.content !== 'none' && li.seg.content !== 'normal') offenders.push('RF-3: the last phrase draws a segment past the flow');
        if (i && li.t < p[i - 1].b - 0.5) offenders.push(`RF-3: phrase ${i + 1} is not below phrase ${i}`);
        if (li.l < r.bio!.r) offenders.push(`RF-3: phrase ${i + 1} starts at ${li.l.toFixed(0)}, inside the bio's column (ends ${r.bio!.r.toFixed(0)})`);
        if (li.r > r.content!.r + 0.5) offenders.push(`RF-3: phrase ${i + 1} overflows the hero`);
        if (li.style !== 'italic') offenders.push(`RF-3: phrase ${i + 1} is ${li.style}`);
    });
    expect(offenders, offenders.join('\n')).toEqual([]);
});

test('phrases in a row under the name at 390 (RF-4)', async ({ page }) => {
    await open(page, 390);
    const r = await readHero(page);
    const offenders: string[] = [];
    const p = r.phrases;
    if (p.some((li) => li.t < r.sub!.b - 0.5 || li.b > r.bio!.t + 0.5)) offenders.push('RF-4: the phrases are not between the role line and the bio');
    if (!p.some((li, i) => i && Math.abs(li.t - p[i - 1].t) < 1)) offenders.push('RF-4: no two phrases share a line');
    // A phrase that starts a line has no chevron (spec 047 RF-3); each one sharing a line with its predecessor does.
    const drawn = (li: { before: string }) => li.before !== 'none' && li.before !== 'normal';
    const joined = p.filter((li, i) => i && Math.abs(li.t - p[i - 1].t) < 1);
    if (!joined.length || !joined.every(drawn)) offenders.push('RF-4: a phrase sharing a line with the one before has no chevron');
    expect(offenders, offenders.join('\n')).toEqual([]);
});

for (const locale of ['es', 'en']) {
    test(`bio and the email label — ${locale} (RF-5, RF-6)`, async ({ page }) => {
        await open(page, 1280, 'light', locale);
        const r = await readHero(page);
        const card = await page.locator('.contact-card:has(a[href^="mailto:"]) .contact-label').first().textContent();
        const offenders: string[] = [];
        if (r.bioText !== (ABOUT.bio as any)[locale]) offenders.push(`RF-5: the bio reads "${r.bioText?.slice(0, 50)}…"`);
        if ((ABOUT.bio as any).es !== PROPOSAL_BIO) offenders.push('RF-5: ABOUT.bio.es is not the proposal\'s sentence');
        if (r.email !== 'Email') offenders.push(`RF-6: the hero's email button reads "${r.email}"`);
        if (card?.trim() !== at(read(locale), 'about.social.email')) offenders.push(`RF-6: the contact card reads "${card?.trim()}", not about.social.email`);
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
}

for (const theme of THEMES) {
    test(`avatar beside the name on a phone — 390px, ${theme} (RF-7)`, async ({ page }) => {
        await open(page, 390, theme);
        const r = await readHero(page);
        const offenders: string[] = [];
        if (r.tile!.r > r.name!.l + 0.5) offenders.push(`RF-7: the tile (right edge ${r.tile!.r.toFixed(0)}) is not left of the name (${r.name!.l.toFixed(0)})`);
        if (Math.abs(r.tile!.t - r.name!.t) > 4) offenders.push(`RF-7: the tile's top ${r.tile!.t.toFixed(0)} is not level with the name's ${r.name!.t.toFixed(0)}`);
        if (r.bio!.l >= r.name!.l - 0.5) offenders.push(`RF-7: the bio starts at ${r.bio!.l.toFixed(0)}, not under the tile`);
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
}
