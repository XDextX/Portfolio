import { test, expect, type Page } from '@playwright/test';
import { E2E_URL } from './helpers/server';
import { THEMES, openIn, type Theme } from './helpers/rendered';
import * as tech from '../src/data/tech';

// Spec 031: the language's logo before its name in the project badge, sized to the text.

const d = tech as any;

// A text-only badge's height, measured on a clone with its images removed: the RF-2 baseline.
const readBadges = (page: Page) => page.locator('.project-card .card-lang').evaluateAll((badges) => badges.filter((b) => (b as HTMLElement).checkVisibility()).map((b) => {
    const imgs = [...b.querySelectorAll('img')].filter((i) => i.checkVisibility());
    const box = (e: Element) => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height }; };
    const bare = b.cloneNode(true) as HTMLElement;
    bare.querySelectorAll('img, .mark').forEach((e) => e.remove());
    b.parentElement!.append(bare);
    const bareH = bare.getBoundingClientRect().height;
    bare.remove();
    return {
        lang: b.textContent?.trim() ?? '', h: b.getBoundingClientRect().height, bareH,
        imgs: imgs.map((i) => ({ src: new URL(i.currentSrc || i.src).pathname, alt: i.getAttribute('alt'), box: box(i) })),
        text: box(b.querySelector('.card-lang-text') ?? b),
    };
}));

for (const theme of THEMES) for (const route of ['/', '/proyectos']) {
    test(`badge logo: before the name, the theme's file, sized to the text — ${route}, ${theme} (RF-1, RF-2)`, async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 1000 });
        await openIn(page, E2E_URL, theme as Theme, `${route}?lang=es`);
        const badges = await readBadges(page);
        const offenders: string[] = [];
        const known = badges.filter((b) => d.languageLogo(b.lang));
        if (!known.length) offenders.push('data: no badge with a known language');
        for (const b of known) {
            const want = d.logoFor(d.languageLogo(b.lang), theme);
            const job = `${route} ${theme} ${b.lang}`;
            if (b.imgs.length !== 1 || b.imgs[0].src !== want) { offenders.push(`RF-1: ${job} badge shows ${b.imgs.map((i) => i.src).join(', ') || 'no logo'}, not ${want}`); continue; }
            const img = b.imgs[0];
            if (img.alt !== '') offenders.push(`RF-1: ${job} logo alt is ${JSON.stringify(img.alt)}`);
            if (img.box.r > b.text.l + 0.5) offenders.push(`RF-1: ${job} logo is not left of the text`);
            if (img.box.w < 12 || img.box.w > 16 || Math.abs(img.box.w - img.box.h) > 0.5) offenders.push(`RF-2: ${job} logo is ${img.box.w.toFixed(1)}×${img.box.h.toFixed(1)}`);
            const mid = (x: { t: number; b: number }) => (x.t + x.b) / 2;
            if (Math.abs(mid(img.box) - mid(b.text)) > 1) offenders.push(`RF-2: ${job} logo centre is ${(mid(img.box) - mid(b.text)).toFixed(1)}px off the text`);
            if (b.h - b.bareH > 1) offenders.push(`RF-2: ${job} badge is ${b.h.toFixed(1)}px, ${b.bareH.toFixed(1)}px without its logo`);
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
}
