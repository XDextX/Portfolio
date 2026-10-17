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
