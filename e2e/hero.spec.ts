import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { E2E_URL as DEV_URL } from './helpers/server';
import { THEMES, openIn, installHelpers, settled, axQuery } from './helpers/rendered';
import { parseColour, parseGradients, composites, worstPoint, contrast } from '../tests/helpers/colour';
import { ABOUT } from '../src/data/about';

// Spec 010: the hero. RF-1 images, RF-2 phrases, RF-3 italic, RF-4/5 name colours,
// RF-6 family contrast, RF-7 heading name, RF-8 social buttons, NFR equal height.

const HERO = 'section.section--hero';
const LOCALES = ['es', 'en'] as const;
const MIN_FAMILY = 4.5;
const value = (locale: string, key: string): string => {
    const json = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'i18n', 'locales', `${locale}.json`), 'utf-8'));
    return key.split('.').reduce((o: any, k) => o?.[k], json);
};
const phraseKeys: string[] = (ABOUT as any).phraseKeys ?? [];
const labelKeys: string[] = ABOUT.socials.map((s: any) => s.labelKey);

// A token's rendered colour, read through a probe so the theme files stay the source.
const probe = (page: Page, token: string) =>
    page.evaluate((v) => {
        const s = document.createElement('span');
        s.style.color = `var(${v})`;
        document.body.append(s);
        const c = (window as any).__toHex(getComputedStyle(s).color);
        s.remove();
        return c as string;
    }, token);

test.describe('hero (spec 010)', () => {
    test.describe.configure({ mode: 'default' });

    for (const theme of THEMES) {
        test(`hero images: the avatar is the only picture — ${theme} (RF-1)`, async ({ page }) => {
            await openIn(page, DEV_URL, theme, '/?lang=es');
            const found = await page.locator(HERO).evaluate((hero) => {
                const out: string[] = [];
                const imgs = [...hero.querySelectorAll('img')].map((i) => i.getAttribute('src'));
                for (const tag of ['picture', 'video', 'object', 'embed', 'iframe', 'canvas', 'image']) {
                    if (hero.querySelector(tag)) out.push(`a <${tag}>`);
                }
                for (const el of [hero, ...hero.querySelectorAll('*')]) {
                    for (const pseudo of [null, '::before', '::after']) {
                        const cs = getComputedStyle(el, pseudo);
                        for (const p of ['background-image', 'border-image-source', 'list-style-image', 'content']) {
                            const v = cs.getPropertyValue(p);
                            if (/url\(/i.test(v)) out.push(`${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).split(' ')[0] : ''}${pseudo ?? ''} ${p}: ${v.slice(0, 60)}`);
                        }
                    }
                }
                return { imgs, out };
            });
            const offenders = found.out.map((o) => `RF-1: ${o}`);
            if (found.imgs.length !== 1 || found.imgs[0] !== ABOUT.avatar) offenders.push(`RF-1: images are ${found.imgs.join(', ')}, not the avatar alone`);
            expect(offenders, offenders.join('\n')).toEqual([]);
        });

        test(`name colours: given in the text colour, family in gold — ${theme} (RF-4, RF-5)`, async ({ page }) => {
            await openIn(page, DEV_URL, theme, '/?lang=es');
            await installHelpers(page);
            const [text, gold] = [await probe(page, '--text-color'), await probe(page, '--accent-text')];
            const read = (sel: string) => page.locator(`${HERO} ${sel}`).evaluateAll((els) => els.map((e) => (window as any).__toHex(getComputedStyle(e).color)));
            const given = await read('h1 .about-name__given');
            const family = await read('h1 .about-name__family');
            const offenders: string[] = [];
            if (given.length !== 1 || given[0] !== text) offenders.push(`RF-4: the given name is ${given.join(', ') || 'missing'}, not the text colour ${text}`);
            if (ABOUT.nameParts.family && (family.length !== 1 || family[0] !== gold)) offenders.push(`RF-5: the family name is ${family.join(', ') || 'missing'}, not the gold ${gold}`);
            expect(offenders, offenders.join('\n')).toEqual([]);
        });

        test(`name contrast: the family clears ${MIN_FAMILY}:1 on the hero ground — ${theme} (RF-6)`, async ({ page }) => {
            await openIn(page, DEV_URL, theme, '/?lang=es');
            await installHelpers(page);
            const fam = page.locator(`${HERO} h1 .about-name__family`);
            expect(await fam.count(), 'RF-6: no family span to measure').toBe(1);
            const r = await fam.evaluate((el, hero) => {
                const w = window as any;
                return {
                    colour: w.__toHex(getComputedStyle(el).color),
                    ground: w.__groundOf(el, hero),
                    image: getComputedStyle(document.querySelector(hero)!).backgroundImage,
                    sheet: getComputedStyle(document.querySelector('main')!).backgroundColor,
                };
            }, HERO);
            const ratio = r.ground.glow
                ? worstPoint(parseColour(r.colour), parseGradients(r.image).flatMap((g) => composites(g, parseColour(r.sheet))))
                : contrast(r.colour, r.ground.colour);
            expect(ratio, `RF-6: the family ${r.colour} reads ${ratio.toFixed(2)}:1 at the ground's worst point`).toBeGreaterThanOrEqual(MIN_FAMILY);
        });
    }

    for (const locale of LOCALES) {
        test(`phrases: one list of four, in order — ${locale} (RF-2)`, async ({ page }) => {
            await openIn(page, DEV_URL, 'light', `/?lang=${locale}`);
            const lists = await axQuery(page, HERO, 'list');
            const items = await axQuery(page, `${HERO} ul`, 'listitem').catch(() => []);
            const texts = await page.locator(`${HERO} ul > li`).allTextContents();
            const expected = phraseKeys.map((k) => value(locale, k));
            const offenders: string[] = [];
            if (lists.length !== 1) offenders.push(`RF-2: the hero exposes ${lists.length} lists, not 1`);
            if (items.length !== 4) offenders.push(`RF-2: the list exposes ${items.length} list items, not 4`);
            if (expected.length !== 4 || JSON.stringify(texts.map((t) => t.trim())) !== JSON.stringify(expected)) offenders.push(`RF-2: items read ${texts.join(' | ')}, not ${expected.join(' | ')}`);
            expect(offenders, offenders.join('\n')).toEqual([]);
        });

        test(`heading name: the h1 is named by the full name — ${locale} (RF-7)`, async ({ page }) => {
            await openIn(page, DEV_URL, 'light', `/?lang=${locale}`);
            const h1 = await axQuery(page, HERO, 'heading');
            const names = h1.map((n) => n.name?.value);
            expect(names[0], `RF-7: the hero heading is named "${names[0]}"`).toBe(ABOUT.name);
        });

        test(`social buttons: a translated label and one hidden icon — ${locale} (RF-8)`, async ({ page }) => {
            await openIn(page, DEV_URL, 'light', `/?lang=${locale}`);
            const expected = labelKeys.map((k) => (k ? value(locale, k) : '(no labelKey)'));
            const links = await axQuery(page, `${HERO} .about-actions`, 'link');
            const axNames = links.map((n) => n.name?.value).slice(1);
            const dom = await page.locator(`${HERO} .btn-social`).evaluateAll((els) => els.map((a) => {
                const icons = [...a.querySelectorAll('.btn-social__icon')];
                return { text: (a.textContent ?? '').trim(), icons: icons.length, hidden: icons.every((i) => i.getAttribute('aria-hidden') === 'true') };
            }));
            const offenders: string[] = [];
            if (JSON.stringify(dom.map((d) => d.text)) !== JSON.stringify(expected)) offenders.push(`RF-8: visible labels ${dom.map((d) => d.text).join(' | ')}, not ${expected.join(' | ')}`);
            if (JSON.stringify(axNames) !== JSON.stringify(expected)) offenders.push(`RF-8: accessible names ${axNames.join(' | ')}, not ${expected.join(' | ')}`);
            dom.forEach((d, i) => {
                if (d.icons !== 1) offenders.push(`RF-8: button ${i + 1} carries ${d.icons} icons, not 1`);
                else if (!d.hidden) offenders.push(`RF-8: button ${i + 1}'s icon is not aria-hidden`);
            });
            expect(offenders, offenders.join('\n')).toEqual([]);
        });
    }

    test('italic: each phrase renders in the loaded Plex Sans italic (RF-3)', async ({ page }) => {
        await openIn(page, DEV_URL, 'light', '/?lang=es');
        await page.evaluate(() => document.fonts.ready);
        const r = await settled(() => page.evaluate((hero) => ({
            styles: [...document.querySelectorAll(`${hero} ul > li`)].map((li) => getComputedStyle(li).fontStyle),
            loaded: [...document.fonts].some((f) => /IBM Plex Sans/.test(f.family) && f.style === 'italic' && f.status === 'loaded'),
        }), HERO));
        const offenders: string[] = [];
        if (!r.styles.length || r.styles.some((s) => s !== 'italic')) offenders.push(`RF-3: phrases compute ${r.styles.join(', ') || 'nothing'}, not italic`);
        if (!r.loaded) offenders.push('RF-3: no IBM Plex Sans italic face is loaded');
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    for (const width of [1280, 390]) {
        test(`button heights: the CV and social buttons match at ${width}px (NFR)`, async ({ page }) => {
            await page.setViewportSize({ width, height: 900 });
            await openIn(page, DEV_URL, 'light', '/?lang=es');
            const hs = await page.locator(`${HERO} .btn-cv, ${HERO} .btn-social`).evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
            const spread = Math.max(...hs) - Math.min(...hs);
            expect(spread, `NFR: heights ${hs.map((h) => h.toFixed(1)).join(', ')} differ by ${spread.toFixed(2)}px`).toBeLessThanOrEqual(0.5);
        });
    }
});
