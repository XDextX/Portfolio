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
                    // Hidden itself or inside a hidden subtree (spec 028's tile): no accessible name either way.
                    iconHidden: !!icon?.closest('[aria-hidden="true"]'),
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
                    // Spec 028: the icon sits on its tile, so the tile is its ground (same 3:1 floor).
                    icons: [...s.querySelectorAll('.exp-company__icon')].map((i) => ({ fg: bg(i), bg: bg(i.closest('.exp-tile') ?? i.closest('.exp-card')!) })),
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

// Spec 027: from 40rem the rail and dots run down the left edge, as in the proposal, with each
// period beside its dot and the card after it (spec 013 had the period left of the rail).
test.describe('timeline rail on the left (spec 027)', () => {
    for (const width of [1280, 800]) {
        test(`rail, then period, then card, the period level with its dot — ${width}px (RF-1, RF-2)`, async ({ page }) => {
            await page.setViewportSize({ width, height: 900 });
            await openIn(page, DEV_URL, 'light', '/?lang=es');
            await page.locator('#Experience').scrollIntoViewIfNeeded();
            const items = await page.locator('#Experience .exp-item').evaluateAll((els) => els.map((li) => {
                const b = (s: string) => { const r = li.querySelector(s)!.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom }; };
                return { dot: b('.exp-dot'), period: b('.exp-period'), card: b('.exp-card') };
            }));
            const offenders: string[] = [];
            items.forEach(({ dot, period, card }, i) => {
                if (dot.r > period.l) offenders.push(`RF-1: job ${i + 1}: the dot ends at ${dot.r.toFixed(0)}, past the period's start ${period.l.toFixed(0)}`);
                if (period.r > card.l) offenders.push(`RF-1: job ${i + 1}: the period ends at ${period.r.toFixed(0)}, past the card's start ${card.l.toFixed(0)}`);
                const cy = (dot.t + dot.b) / 2;
                if (cy < period.t || cy > period.b) offenders.push(`RF-2: job ${i + 1}: the dot's centre ${cy.toFixed(0)} is outside the period ${period.t.toFixed(0)}–${period.b.toFixed(0)}`);
            });
            if (!items.length) offenders.push('RF-1: no timeline items found');
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }
});

// Spec 028: the card arranged like the proposal — the company icon in a square tile before role
// and company, the location at the header's end, the chips in a column right of the bullets.
test.describe('experience card layout (spec 028)', () => {
    const measure = (page: Page) => page.locator('#Experience .exp-card').evaluateAll((cards) => cards.map((c) => {
        const b = (s: string) => { const e = c.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height }; };
        const cs = getComputedStyle(c);
        const content = c.getBoundingClientRect().right - parseFloat(cs.paddingRight) - parseFloat(cs.borderRightWidth);
        const tile = c.querySelector('.exp-tile');
        return {
            tile: b('.exp-tile'), tiles: c.querySelectorAll('.exp-tile').length,
            tileHoldsIcon: !!tile?.querySelector('.exp-company__icon'), tileHidden: tile?.getAttribute('aria-hidden') === 'true',
            role: b('.exp-role'), company: b('.exp-company'), location: b('.exp-location'),
            bullets: b('.exp-bullets'), chips: b('.exp-tech'), content,
        };
    }));

    for (const width of [1280, 390]) {
        test(`tile, location and chips placed as in the proposal — ${width}px (RF-1, RF-3, RF-4)`, async ({ page }) => {
            await page.setViewportSize({ width, height: 900 });
            await openIn(page, DEV_URL, 'light', '/?lang=es');
            await page.locator('#Experience').scrollIntoViewIfNeeded();
            const cards = await measure(page);
            const offenders: string[] = [];
            cards.forEach((c, i) => {
                const job = `job ${i + 1}`;
                if (c.tiles !== 1 || !c.tile) offenders.push(`RF-1: ${job} has ${c.tiles} icon tiles, not 1`);
                else if (Math.abs(c.tile.w - c.tile.h) > 1 || c.tile.w < 40) offenders.push(`RF-1: ${job} tile is ${c.tile.w.toFixed(0)}×${c.tile.h.toFixed(0)}, not a square of 40px or more`);
                if (c.tile && !c.tileHoldsIcon) offenders.push(`RF-1: ${job} tile holds no company icon`);
                if (c.tile && !c.tileHidden) offenders.push(`RF-1: ${job} tile is not aria-hidden`);
                // Below 40rem spec 046 RF-1 puts the tile on the period's row, above the title (plan D-5).
                if (width === 1280 && c.tile && (c.tile.r > c.role!.l || c.tile.r > c.company!.l)) offenders.push(`RF-1: ${job} tile does not end before the role and the company`);
                if (width === 1280) {
                    if (c.location && Math.abs(c.location.r - c.content) > 1) offenders.push(`RF-3: ${job} location ends at ${c.location.r.toFixed(0)}, not the content edge ${c.content.toFixed(0)}`);
                    if (c.location && (c.location.t >= c.role!.b || c.location.b <= c.role!.t)) offenders.push(`RF-3: ${job} location is not level with the role`);
                    if (c.chips!.l < c.bullets!.r) offenders.push(`RF-4: ${job} chips start at ${c.chips!.l.toFixed(0)}, inside the bullets (end ${c.bullets!.r.toFixed(0)})`);
                    if (c.chips!.t >= c.bullets!.b || c.chips!.b <= c.bullets!.t) offenders.push(`RF-4: ${job} chips are not beside the bullets`);
                } else {
                    if (c.location && c.location.t < c.company!.b - 0.5) offenders.push(`RF-3: ${job} location is not below the company at ${width}px`);
                    if (c.chips!.t < c.bullets!.b - 0.5) offenders.push(`RF-4: ${job} chips are not below the bullets at ${width}px`);
                }
            });
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }

    for (const width of [800, 1024]) {
        test(`nothing in a card overlaps — ${width}px (NFR)`, async ({ page }) => {
            await page.setViewportSize({ width, height: 900 });
            await openIn(page, DEV_URL, 'light', '/?lang=es');
            await page.locator('#Experience').scrollIntoViewIfNeeded();
            const cards = await measure(page);
            const offenders: string[] = [];
            cards.forEach((c, i) => {
                const parts = Object.entries({ tile: c.tile, role: c.role, company: c.company, location: c.location, bullets: c.bullets, chips: c.chips })
                    .filter(([, v]) => v) as [string, { l: number; r: number; t: number; b: number }][];
                for (let a = 0; a < parts.length; a++) for (let z = a + 1; z < parts.length; z++) {
                    const [na, A] = parts[a]; const [nz, Z] = parts[z];
                    if (A.l < Z.r - 0.5 && Z.l < A.r - 0.5 && A.t < Z.b - 0.5 && Z.t < A.b - 0.5) offenders.push(`NFR: job ${i + 1}: ${na} overlaps ${nz}`);
                }
            });
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }
});

// Spec 046: the experience section on a phone. The tile moves onto the period's row below 40rem
// (RF-1), the role holds one line from 390px (RF-2), a wrapped role or company never ends alone
// or on its legal suffix (RF-3), and 800 and 1280 keep today's layout.
test.describe('experience on a phone (spec 046)', () => {
    const SUFFIXES = ['S.A.', 'S. A.', 'A.'];

    async function open(page: Page, width: number, locale: string) {
        await page.setViewportSize({ width, height: 844 });
        await openIn(page, DEV_URL, 'light', `/?lang=${locale}`);
        await page.locator('#Experience').scrollIntoViewIfNeeded();
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(500);
    }

    // The words of an element's text grouped by line box, top to bottom (plan block 4).
    const lineWords = (page: Page, selector: string) => page.locator(selector).evaluateAll((els) => els.map((el) => {
        const lines: { top: number; words: string[] }[] = [];
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            for (const m of (n.textContent ?? '').matchAll(/\S+/g)) {
                const r = document.createRange();
                r.setStart(n, m.index!); r.setEnd(n, m.index! + m[0].length);
                const top = r.getClientRects()[0]?.top ?? 0;
                const line = lines.find((l) => Math.abs(l.top - top) <= 4);
                if (line) line.words.push(m[0]); else lines.push({ top, words: [m[0]] });
            }
        }
        return lines.sort((a, b) => a.top - b.top).map((l) => l.words);
    }));

    const geometry = (page: Page) => page.locator('#Experience .exp-card').evaluateAll((cards) => cards.map((c) => {
        const b = (s: string) => { const e = c.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom }; };
        const item = c.closest('li');
        const dot = item?.querySelector(':scope > .exp-dot')?.getBoundingClientRect();
        return { tile: b('.exp-tile'), period: b('.exp-period'), title: b('.exp-title'), header: b('.exp-header'), dotY: dot ? dot.top + dot.height / 2 : null };
    }));

    for (const width of [360, 390]) {
        test(`the tile sits on the period row and the title takes the header width — ${width}px (RF-1)`, async ({ page }) => {
            await open(page, width, 'es');
            const offenders: string[] = [];
            (await geometry(page)).forEach((g, i) => {
                const job = `job ${i + 1}`;
                if (!g.tile || !g.period || !g.title || !g.header) { offenders.push(`RF-1: ${job} lacks a part`); return; }
                if (g.tile.t < g.period.t - 1 || g.tile.t > g.period.b + 1) offenders.push(`RF-1: ${job} tile top ${g.tile.t.toFixed(1)} is off the period row (${g.period.t.toFixed(1)}-${g.period.b.toFixed(1)})`);
                if (Math.abs(g.title.l - g.header.l) > 1) offenders.push(`RF-1: ${job} title starts ${g.title.l.toFixed(1)}, the header ${g.header.l.toFixed(1)}`);
                if (g.dotY !== null && (g.dotY < g.period.t - 1 || g.dotY > g.period.b + 1)) offenders.push(`RF-1: ${job} rail dot at ${g.dotY.toFixed(1)} is off the period`);
            });
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }

    for (const locale of LOCALES) {
        test(`each role holds one line at 390px — ${locale} (RF-2)`, async ({ page }) => {
            await open(page, 390, locale);
            const lines = await lineWords(page, '#Experience .exp-role');
            expect(lines.length, 'roles measured').toBeGreaterThan(0);
            expect(lines.map((l) => l.map((w) => w.join(' '))).filter((l) => l.length !== 1)).toEqual([]);
        });
    }

    for (const width of [360, 390]) for (const locale of LOCALES) {
        test(`a wrapped role or company never ends alone or on its suffix — ${width}px, ${locale} (RF-3)`, async ({ page }) => {
            await open(page, width, locale);
            const offenders: string[] = [];
            for (const sel of ['#Experience .exp-role', '#Experience .exp-company']) {
                for (const lines of await lineWords(page, sel)) {
                    if (lines.length < 2) continue;
                    const last = lines[lines.length - 1];
                    if (last.length < 2 || SUFFIXES.includes(last.join(' '))) offenders.push(`RF-3: ${sel.split(' ')[1]} ends on "${last.join(' ')}" (${lines.map((l) => l.join(' ')).join(' / ')})`);
                }
            }
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }

    test('RF-3 reads something: at 360 es at least one heading wraps', async ({ page }) => {
        await open(page, 360, 'es');
        const all = [...(await lineWords(page, '#Experience .exp-role')), ...(await lineWords(page, '#Experience .exp-company'))];
        expect(all.some((l) => l.length >= 2), 'no role or company wraps at 360 es').toBe(true);
    });

    test('the 360 es role breaks as Desarrollador / Full Stack (RF-3)', async ({ page }) => {
        await open(page, 360, 'es');
        const [first] = await lineWords(page, '#Experience .exp-role');
        expect(first.map((l) => l.join(' '))).toEqual(['Desarrollador', 'Full Stack']);
    });

    for (const width of [800, 1280]) {
        test(`from 40rem the tile still sits beside the title — ${width}px (NFR)`, async ({ page }) => {
            await open(page, width, 'es');
            const offenders: string[] = [];
            (await geometry(page)).forEach((g, i) => {
                if (!g.tile || !g.title) { offenders.push(`job ${i + 1} lacks a part`); return; }
                if (g.tile.r > g.title.l + 0.5) offenders.push(`job ${i + 1}: tile ends ${g.tile.r.toFixed(1)}, after the title starts ${g.title.l.toFixed(1)}`);
                if (g.tile.t >= g.title.b) offenders.push(`job ${i + 1}: tile is below the title`);
            });
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }
});
