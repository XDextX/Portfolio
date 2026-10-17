import { test, expect, type Page } from '@playwright/test';
import { E2E_URL } from './helpers/server';
import { THEMES, openIn, type Theme } from './helpers/rendered';

// Spec 032: a preview fills its card's placeholder under the badge. No repository carries one
// yet, so the first card gets the element the component emits for one (class and Astro scope
// attribute copied from its badge), drawn from a canvas: what is checked is the site's CSS.

async function withPreview(page: Page) {
    return page.locator('.project-card').first().evaluate((card) => {
        const media = card.querySelector('.card-media')!;
        const badge = card.querySelector('.card-lang')!;
        media.querySelectorAll(':scope > img, :scope > .card-mark').forEach((e) => e.remove());
        const canvas = Object.assign(document.createElement('canvas'), { width: 1280, height: 640 });
        const g = canvas.getContext('2d')!;
        g.fillStyle = '#2f6f8f';
        g.fillRect(0, 0, 1280, 640);
        const img = Object.assign(document.createElement('img'), { className: 'card-preview', src: canvas.toDataURL(), alt: '' });
        for (const a of badge.getAttributeNames()) if (a.startsWith('data-astro-cid')) img.setAttribute(a, '');
        media.append(img);
        return new Promise<void>((done) => (img.complete ? done() : img.addEventListener('load', () => done())));
    });
}

const readPreview = (page: Page) => page.locator('.project-card').first().evaluate((card) => {
    const box = (e: Element | null) => { if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom }; };
    const img = card.querySelector('.card-preview');
    const badge = card.querySelector('.card-lang');
    const bb = box(badge);
    const hit = bb ? document.elementFromPoint((bb.l + bb.r) / 2, (bb.t + bb.b) / 2) : null;
    return {
        media: box(card.querySelector('.card-media')), img: box(img), fit: img ? getComputedStyle(img).objectFit : null,
        badge: bb, badgeOnTop: !!hit && !!badge && badge.contains(hit),
    };
});

for (const theme of THEMES) for (const route of ['/', '/proyectos']) for (const width of [1280, 390]) {
    test(`preview: fills the placeholder under the badge — ${route}, ${theme}, ${width}px (RF-1, RF-2)`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 });
        await openIn(page, E2E_URL, theme as Theme, `${route}?lang=es`);
        await page.locator('.project-card').first().scrollIntoViewIfNeeded();
        await withPreview(page);
        await page.waitForTimeout(300);
        const r = await readPreview(page);
        const offenders: string[] = [];
        const m = r.media!, i = r.img!;
        if (['l', 'r', 't', 'b'].some((k) => Math.abs((i as any)[k] - (m as any)[k]) > 1)) offenders.push(`RF-1: the preview does not cover the placeholder (${JSON.stringify(i)} vs ${JSON.stringify(m)})`);
        if (r.fit !== 'cover') offenders.push(`RF-1: object-fit is ${r.fit}`);
        if (!r.badge) offenders.push('RF-2: the badge is gone');
        else {
            if (m.r - r.badge.r > 12 || r.badge.t - m.t > 12) offenders.push('RF-2: the badge left the top-right corner');
            if (!r.badgeOnTop) offenders.push('RF-2: the image is drawn over the badge');
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
}
