import { test, expect, type Page } from '@playwright/test';
import { E2E_URL as DEV_URL } from './helpers/server';
import { THEMES, openIn, gotoPastOverlay, installHelpers, settled, axQuery, type Theme } from './helpers/rendered';
import { contrast, parseColour, parseGradients, composites, worstPoint } from '../tests/helpers/colour';
import { EXPERIENCES } from '../src/data/experience';

// Spec 013: Experience as a vertical timeline. RF-1 dots and rail, RF-2 period, RF-3 company
// icon, RF-4/5 chips, RF-6 contrast, RF-7 CV link, RF-8 at 390px; no spine, hover gold.

const SECTION = '#Experience';
const LOCALES = ['es', 'en'] as const;
const ITEMS = `${SECTION} .exp-list > li`;
const jobs = EXPERIENCES as any[];

const probe = (page: Page, token: string) =>
    page.evaluate((v) => {
        const s = document.createElement('span');
        s.style.color = `var(${v})`;
        document.body.append(s);
        const c = (window as any).__toHex(getComputedStyle(s).color);
        s.remove();
        return c as string;
    }, token);

// Boxes of every dot, rail segment and card, in item order.
const geometry = (page: Page) =>
    settled(() => page.locator(ITEMS).evaluateAll((lis) => lis.map((li) => {
        const box = (e: Element | null) => { if (!e) return null; const b = e.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom, cy: b.top + b.height / 2 }; };
        const dot = li.querySelector(':scope > .exp-dot');
        const rail = li.querySelector(':scope > .exp-rail');
        const period = li.querySelector('.exp-period');
        return {
            dot: box(dot), rail: box(rail), card: box(li.querySelector('.exp-card')), period: box(period),
            hidden: [dot, rail].filter(Boolean).every((e) => e!.getAttribute('aria-hidden') === 'true'),
        };
    })));

test.describe('experience timeline (spec 013)', () => {
    test.describe.configure({ mode: 'default' });

    for (const [w, h] of [[1280, 800], [390, 844]] as const) {
        for (const js of [true, false]) {
            test(`timeline: one dot per job on a contiguous rail — ${w}px${js ? '' : ', scripts off'} (RF-1)`, async ({ browser }) => {
                const ctx = await browser.newContext({ javaScriptEnabled: js, viewport: { width: w, height: h } });
                const page = await ctx.newPage();
                await gotoPastOverlay(page, DEV_URL + '/?lang=es');
                const g = await geometry(page);
                // The rail must not paint over a dot: the topmost element at each dot's centre is the dot.
                const covered = await page.locator(`${ITEMS} > .exp-dot`).evaluateAll((dots) => dots.map((d) => {
                    // Instant: html:focus-within makes scrolling smooth, and a mid-scroll read hit the wrong element.
                    d.scrollIntoView({ block: 'center', behavior: 'instant' });
                    const b = d.getBoundingClientRect();
                    return document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2) === d;
                }));
                await ctx.close();
                const offenders: string[] = [];
                const dots = g.filter((x) => x.dot);
                covered.forEach((onTop, i) => { if (!onTop) offenders.push(`RF-1: something paints over dot ${i + 1}`); });
                if (dots.length !== jobs.length) offenders.push(`RF-1: ${dots.length} dots for ${jobs.length} jobs`);
                g.forEach((x, i) => {
                    if (!x.dot || !x.card) return;
                    if (x.dot.cy < x.card.t || x.dot.cy > x.card.b) offenders.push(`RF-1: dot ${i + 1} is not level with its card`);
                    if (!x.hidden) offenders.push(`RF-1: item ${i + 1}'s dot or rail is not aria-hidden`);
                });
                const rails = g.map((x) => x.rail);
                if (rails.filter(Boolean).length !== Math.max(jobs.length - 1, 0)) offenders.push(`RF-1: ${rails.filter(Boolean).length} rail segments for ${jobs.length} jobs`);
                for (let i = 0; i < g.length - 1; i++) {
                    const r = rails[i], d = g[i].dot, next = g[i + 1].dot;
                    if (!r || !d || !next) continue;
                    if (Math.abs(r.t - d.cy) > 1) offenders.push(`RF-1: segment ${i + 1} starts ${(r.t - d.cy).toFixed(1)}px off dot ${i + 1}'s centre`);
                    if (Math.abs(r.b - next.cy) > 1) offenders.push(`RF-1: segment ${i + 1} ends ${(r.b - next.cy).toFixed(1)}px off dot ${i + 2}'s centre`);
                }
                expect(offenders, offenders.join('\n')).toEqual([]);
            });
        }
    }

    for (const locale of LOCALES) {
        test(`period, icon and chips: read in order, named, in data order — ${locale} (RF-2, RF-3, RF-4, RF-5)`, async ({ page }) => {
            await openIn(page, DEV_URL, 'light', `/?lang=${locale}`);
            const items = await page.locator(ITEMS).evaluateAll((lis) => lis.map((li) => {
                const card = li.querySelector('.exp-card')!;
                const texts = [...card.querySelectorAll('.exp-period, h3, .exp-company')].map((e) => (e.tagName === 'H3' ? 'h3' : e.className.split(' ')[0]));
                const icon = card.querySelector('.exp-company__icon') as HTMLElement | null;
                const name = card.querySelector('.exp-company');
                const nameText = name ? [...name.childNodes].find((n) => n.nodeType === 3 && (n.textContent ?? '').trim()) : null;
                let nameLeft = Infinity;
                if (nameText) { const r = document.createRange(); const i = nameText.textContent!.search(/\S/); r.setStart(nameText, i); r.setEnd(nameText, i + 1); nameLeft = r.getBoundingClientRect().left; }
                const list = card.querySelector('ul.exp-tech');
                return {
                    order: texts,
                    period: card.querySelector('.exp-period')?.textContent?.trim(),
                    text: card.textContent ?? '',
                    icons: card.querySelectorAll('.exp-company__icon').length,
                    iconHidden: icon?.getAttribute('aria-hidden') === 'true',
                    mask: icon ? getComputedStyle(icon).maskImage || getComputedStyle(icon).webkitMaskImage : '',
                    iconRight: icon ? icon.getBoundingClientRect().right : 0, nameLeft,
                    chips: list ? [...list.querySelectorAll(':scope > li')].map((c) => c.textContent?.trim()) : null,
                    label: list?.getAttribute('aria-label') ?? null,
                };
            }));
            const offenders: string[] = [];
            items.forEach((it, i) => {
                const job = jobs[i];
                const where = `job ${i + 1}`;
                if (it.order[0] !== 'exp-period' || it.order[1] !== 'h3') offenders.push(`RF-2: ${where} reads ${it.order.join(', ')}, not period before role`);
                if (it.period !== job.period[locale]) offenders.push(`RF-2: ${where} period "${it.period}", not "${job.period[locale]}"`);
                if (it.text.split(job.period[locale]).length !== 2) offenders.push(`RF-2: ${where} shows its period ${it.text.split(job.period[locale]).length - 1} times`);
                if (job.glyph) {
                    if (it.icons !== 1) offenders.push(`RF-3: ${where} has ${it.icons} company icons, not 1`);
                    else {
                        if (!it.mask.includes(`/icons/ui/${job.glyph}.svg`)) offenders.push(`RF-3: ${where} icon masks ${it.mask}`);
                        if (!it.iconHidden) offenders.push(`RF-3: ${where} icon is not aria-hidden`);
                        if (it.iconRight > it.nameLeft + 0.5) offenders.push(`RF-3: ${where} icon is not before the company name`);
                    }
                }
                if (job.tech?.length) {
                    if (JSON.stringify(it.chips) !== JSON.stringify(job.tech)) offenders.push(`RF-4: ${where} chips ${JSON.stringify(it.chips)}, not ${JSON.stringify(job.tech)}`);
                    if (!it.label || !it.label.includes(job.company) || !it.label.includes(job.period[locale]) || it.label.includes('{{')) offenders.push(`RF-5: ${where} chip list is named "${it.label}"`);
                }
            });
            const labels = items.map((it) => it.label);
            if (new Set(labels).size !== labels.length) offenders.push(`RF-5: chip lists share a name: ${labels.join(' | ')}`);
            const exposed = (await axQuery(page, SECTION, 'image')).filter((n) => !n.ignored);
            if (exposed.length) offenders.push(`RF-3: ${exposed.length} image node(s) in the section's AX tree`);
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }

    for (const theme of THEMES) {
        test(`contrast: chips, company icons and dots clear their floors, also after a toggle — ${theme} (RF-6)`, async ({ page }) => {
            await openIn(page, DEV_URL, theme === 'light' ? 'dark' : 'light', '/?lang=es');
            await page.locator('[data-theme-toggle]').first().click();
            await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute('data-theme') ?? 'light')).toBe(theme);
            await installHelpers(page);
            const r = await settled(() => page.locator(SECTION).evaluate((s) => {
                const w = window as any;
                const bg = (e: Element) => w.__toHex(getComputedStyle(e).backgroundColor);
                return {
                    chips: [...s.querySelectorAll('.exp-tech > li')].map((c) => ({ fg: w.__toHex(getComputedStyle(c).color), bg: bg(c) })),
                    icons: [...s.querySelectorAll('.exp-company__icon')].map((i) => ({ fg: bg(i), bg: bg(i.closest('.exp-card')!) })),
                    dots: [...s.querySelectorAll('.exp-dot')].map((d) => ({ fg: bg(d), ground: w.__groundOf(d.parentElement!, 'main > section.section') })),
                    image: getComputedStyle(s).backgroundImage,
                    sheet: getComputedStyle(document.querySelector('main')!).backgroundColor,
                };
            }));
            const offenders: string[] = [];
            if (!r.chips.length || !r.icons.length || !r.dots.length) offenders.push(`RF-6: measured ${r.chips.length} chips, ${r.icons.length} icons, ${r.dots.length} dots`);
            for (const c of r.chips) { const x = contrast(c.fg, c.bg); if (x < 4.5) offenders.push(`RF-6: chip ${c.fg} on ${c.bg} is ${x.toFixed(2)}:1`); }
            for (const c of r.icons) { const x = contrast(c.fg, c.bg); if (x < 3) offenders.push(`RF-6: icon ${c.fg} on ${c.bg} is ${x.toFixed(2)}:1`); }
            for (const d of r.dots) {
                const x = d.ground.glow
                    ? worstPoint(parseColour(d.fg), parseGradients(r.image).flatMap((g) => composites(g, parseColour(r.sheet))))
                    : contrast(d.fg, d.ground.colour);
                if (x < 3) offenders.push(`RF-6: dot ${d.fg} on ${d.ground.glow ? 'the glow' : d.ground.colour} is ${x.toFixed(2)}:1`);
            }
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }

    test('cv link: one link after the list, the hero CV, no download (RF-7)', async ({ page, request }) => {
        await openIn(page, DEV_URL, 'light', '/?lang=es');
        const r = await page.locator(SECTION).evaluate((s) => {
            const links = [...s.querySelectorAll('a.exp-cv')];
            const list = s.querySelector('.exp-list');
            const link = links[0] as HTMLAnchorElement | undefined;
            return {
                count: links.length,
                after: !!link && !!list && !!(list.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING),
                href: link?.getAttribute('href') ?? null,
                hero: document.querySelector('.btn-cv')?.getAttribute('href') ?? null,
                download: link?.hasAttribute('download') ?? false,
            };
        });
        const offenders: string[] = [];
        if (r.count !== 1) offenders.push(`RF-7: ${r.count} CV links in the section`);
        if (!r.after) offenders.push('RF-7: the CV link does not follow the list');
        if (r.href !== r.hero) offenders.push(`RF-7: the link points at ${r.href}, the hero at ${r.hero}`);
        if (r.download) offenders.push('RF-7: the link downloads the CV');
        if (r.href) { const res = await request.get(new URL(r.href, DEV_URL).href); if (res.status() !== 200) offenders.push(`RF-7: ${r.href} answers ${res.status()}`); }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    test('narrow: at 390px the rail sits left of every card, each period inside its card (RF-8)', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await openIn(page, DEV_URL, 'light', '/?lang=es');
        const g = await geometry(page);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        const offenders: string[] = [];
        const cardLeft = Math.min(...g.map((x) => x.card?.l ?? Infinity));
        g.forEach((x, i) => {
            for (const [name, b] of [['dot', x.dot], ['segment', x.rail]] as const) if (b && b.r > cardLeft + 0.5) offenders.push(`RF-8: item ${i + 1}'s ${name} reaches into the cards`);
            if (!x.dot) offenders.push(`RF-8: item ${i + 1} has no dot`);
            if (x.period && x.card && (x.period.l < x.card.l - 0.5 || x.period.r > x.card.r + 0.5 || x.period.t < x.card.t - 0.5 || x.period.b > x.card.b + 0.5)) offenders.push(`RF-8: item ${i + 1}'s period sits outside its card`);
        });
        if (overflow) offenders.push(`RF-8: the page scrolls ${overflow}px sideways`);
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    for (const theme of THEMES) {
        test(`spine and hover: one border all round, gold on hover, nothing lifts — ${theme} (NFR)`, async ({ page }) => {
            await page.setViewportSize({ width: 1280, height: 900 });
            await openIn(page, DEV_URL, theme, '/?lang=es');
            await installHelpers(page);
            const gold = await probe(page, '--accent-text');
            const snap = () => page.locator(`${SECTION} .exp-card`).first().evaluate((c) => {
                const cs = getComputedStyle(c);
                return { widths: [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth], top: (window as any).__toHex(cs.borderTopColor), shadow: cs.boxShadow, transform: cs.transform };
            });
            await page.mouse.move(0, 0);
            const rest = await settled(snap);
            await page.locator(`${SECTION} .exp-card`).first().hover();
            const hovered = await settled(snap);
            const offenders: string[] = [];
            if (new Set(rest.widths).size !== 1) offenders.push(`NFR: the card's borders are ${rest.widths.join(' ')} — a spine is left`);
            if (hovered.top !== gold) offenders.push(`NFR: the hovered border is ${hovered.top}, not ${gold}`);
            if (hovered.shadow !== rest.shadow) offenders.push(`NFR: hover adds a shadow (${hovered.shadow})`);
            if (hovered.transform !== rest.transform) offenders.push(`NFR: hover moves the card (${hovered.transform})`);
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }
});
