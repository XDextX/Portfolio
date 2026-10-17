import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { E2E_URL } from './helpers/server';
import { THEMES, openIn, installHelpers } from './helpers/rendered';
import { contrast } from '../tests/helpers/colour';

// Spec 030: Projects arranged like the proposal — header with line and "Ver todos", four cards
// with no toggle, four per row at equal heights, badge top-right on a compact placeholder, equal
// actions with marks, the name in ink, no date.

const SECTION = 'main section:has(.projects-grid)';
const read = (l: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'i18n', 'locales', `${l}.json`), 'utf-8'));

async function open(page: Page, route: string, width: number, theme: 'light' | 'dark' = 'light', locale = 'es') {
    await page.setViewportSize({ width, height: 1000 });
    await openIn(page, E2E_URL, theme, `${route}?lang=${locale}`);
    await page.locator(SECTION).first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
}

const cardsOf = (page: Page) => page.locator(`${SECTION} .project-card`).evaluateAll((cards) => cards.filter((c) => (c as HTMLElement).offsetParent !== null).map((c) => {
    const b = (e: Element | null) => { if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height }; };
    const cs = getComputedStyle(c);
    const links = [...c.querySelectorAll('.card-actions a')];
    return {
        card: b(c), media: b(c.querySelector('.card-media')), badge: b(c.querySelector('.card-lang')),
        content: c.getBoundingClientRect().width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - parseFloat(cs.borderLeftWidth) - parseFloat(cs.borderRightWidth),
        actions: b(c.querySelector('.card-actions')), links: links.map((a) => ({ w: a.getBoundingClientRect().width, text: a.textContent?.trim(),
            marks: [...a.querySelectorAll('svg, [class*="mark"], [class*="icon"]')].map((m) => ({ hidden: !!m.closest('[aria-hidden="true"]'), mask: getComputedStyle(m).maskImage || getComputedStyle(m).webkitMaskImage || '' })) })),
        dates: c.querySelectorAll('time').length,
    };
}));

for (const width of [1280, 390]) {
    for (const locale of width === 1280 ? ['es', 'en'] : ['es']) {
        test(`header: title, line and Ver todos — ${width}px, ${locale} (RF-1)`, async ({ page }) => {
            await open(page, '/', width, 'light', locale);
            const r = await page.locator(SECTION).first().evaluate((s) => {
                const b = (e: Element | null) => { if (!e) return null; const x = e.getBoundingClientRect(); return { l: x.left, r: x.right, t: x.top, b: x.bottom }; };
                const link = s.querySelector('.projects-head .projects-all');
                return { title: b(s.querySelector('.projects-head h2')), lead: b(s.querySelector('.projects-head .projects-lead')), link: b(link), leadText: s.querySelector('.projects-lead')?.textContent?.trim(), linkText: link?.textContent?.trim(), href: link?.getAttribute('href'), grid: b(s.querySelector('.projects-grid')) };
            });
            const offenders: string[] = [];
            const want = read(locale).projects;
            if (!r.title || !r.lead || !r.link) offenders.push(`RF-1: the header lacks ${['title', 'lead', 'link'].filter((k) => !(r as any)[k]).join(', ')}`);
            else {
                if (r.leadText !== want.lead) offenders.push(`RF-1: the line reads "${r.leadText}", not "${want.lead}"`);
                if (r.linkText !== want.viewAll) offenders.push(`RF-1: the link reads "${r.linkText}"`);
                if (r.href !== '/proyectos') offenders.push(`RF-1: the link points to ${r.href}`);
                if (width === 1280) {
                    const top = Math.max(r.title.t, r.lead.t, r.link.t), bottom = Math.min(r.title.b, r.lead.b, r.link.b);
                    if (top >= bottom) offenders.push('RF-1: title, line and link are not one row');
                    if (Math.abs(r.link.r - r.grid!.r) > 1) offenders.push(`RF-1: the link ends at ${r.link.r.toFixed(0)}, not the content edge ${r.grid!.r.toFixed(0)}`);
                } else if (!(r.title.b <= r.lead.t + 0.5 && r.lead.b <= r.link.t + 0.5)) offenders.push('RF-1: at 390px the header does not stack title, line, link');
            }
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }
}

test('home: at most four projects and no show-more control (RF-2)', async ({ page }) => {
    await open(page, '/', 1280);
    const r = await page.locator(SECTION).first().evaluate((s) => ({ cards: s.querySelectorAll('.project-card').length, toggles: s.querySelectorAll('button[aria-expanded], [data-projects-toggle]').length }));
    const offenders: string[] = [];
    if (r.cards > 4) offenders.push(`RF-2: the home renders ${r.cards} cards`);
    if (r.toggles) offenders.push('RF-2: the home still has a show-more control');
    expect(offenders, offenders.join('\n')).toEqual([]);
});

for (const route of ['/', '/proyectos']) {
    test(`cards: four per row, equal heights, badge, placeholder, actions, no date — ${route} (RF-3, RF-4, RF-5, RF-7)`, async ({ page }) => {
        await open(page, route, 1280);
        const cards = await cardsOf(page);
        const offenders: string[] = [];
        const rows = new Map<number, typeof cards>();
        for (const c of cards) { const k = Math.round(c.card!.t); rows.set(k, [...(rows.get(k) ?? []), c]); }
        const first = [...rows.values()][0] ?? [];
        if (first.length !== Math.min(4, cards.length)) offenders.push(`RF-3: the first row holds ${first.length} cards, not ${Math.min(4, cards.length)}`);
        for (const row of rows.values()) { const h = row.map((c) => c.card!.h); if (Math.max(...h) - Math.min(...h) > 1) offenders.push(`RF-3: a row's heights are ${h.map((x) => x.toFixed(0)).join(', ')}`); }
        cards.forEach((c, i) => {
            const job = `card ${i + 1}`;
            if (c.badge && (c.media!.r - c.badge.r > 12 || c.badge.t - c.media!.t > 12)) offenders.push(`RF-4: ${job} badge is not in the top-right corner`);
            if (c.media!.h > 96) offenders.push(`RF-4: ${job} placeholder is ${c.media!.h.toFixed(0)}px tall`);
            const ws = c.links.map((l) => l.w);
            if (Math.max(...ws) - Math.min(...ws) > 1) offenders.push(`RF-5: ${job} actions are ${ws.map((w) => w.toFixed(0)).join(', ')} wide`);
            if (Math.abs(c.actions!.w - c.content) > 2) offenders.push(`RF-5: ${job} actions span ${c.actions!.w.toFixed(0)}, not the content ${c.content.toFixed(0)}`);
            const code = c.links[0];
            if (!code?.marks.some((m) => m.mask.includes('brand-github.svg'))) offenders.push(`RF-5: ${job} "Código" carries no GitHub mark`);
            for (const l of c.links) if (!l.marks.length || l.marks.some((m) => !m.hidden)) offenders.push(`RF-5: ${job} "${l.text}" mark is missing or not aria-hidden`);
            if (c.dates) offenders.push(`RF-7: ${job} shows a date`);
        });
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
}

for (const theme of THEMES) {
    test(`names in ink — ${theme} (RF-6)`, async ({ page }) => {
        await open(page, '/', 1280, theme);
        await installHelpers(page);
        const r = await page.locator(`${SECTION} .project-card`).evaluateAll((cards) => {
            const w = window as any;
            const probe = document.createElement('i'); probe.style.color = 'var(--text-color)'; document.body.append(probe);
            const ink = w.__toHex(getComputedStyle(probe).color); probe.remove();
            return cards.filter((c) => (c as HTMLElement).offsetParent !== null).map((c) => ({ fg: w.__toHex(getComputedStyle(c.querySelector('.card-title a')!).color), bg: w.__toHex(getComputedStyle(c).backgroundColor), ink }));
        });
        const offenders: string[] = [];
        r.forEach((c, i) => {
            if (c.fg !== c.ink) offenders.push(`RF-6: card ${i + 1} name is ${c.fg}, not the ink ${c.ink}`);
            if (contrast(c.fg, c.bg) < 4.5) offenders.push(`RF-6: card ${i + 1} name is ${contrast(c.fg, c.bg).toFixed(2)}:1`);
        });
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
}
