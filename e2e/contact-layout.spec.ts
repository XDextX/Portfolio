import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { E2E_URL } from './helpers/server';
import { THEMES, openIn, installHelpers } from './helpers/rendered';
import { contrast } from '../tests/helpers/colour';
import { CONTACTS } from '../src/data/contacts';
import { contactLabel } from '../src/utils/contact';

// Spec 029: Contact arranged like the proposal — cards and form side by side, equal cards,
// sentence-case labels, the gold mail glyph, Name and Email on one row, field names inside the
// field, a full-width send button.

const SECTION = '#Contact';
const FORM = `${SECTION} form[data-contact-form]`;
const read = (l: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'i18n', 'locales', `${l}.json`), 'utf-8'));
const tr = (l: string) => (key: string): string => key.split('.').reduce((o: any, k) => o?.[k], read(l)) ?? key;
type Box = { l: number; r: number; t: number; b: number; w: number };
const box = (page: Page, sel: string) => page.locator(sel).evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width }; }));

async function open(page: Page, width: number, theme: 'light' | 'dark' = 'light') {
    await page.setViewportSize({ width, height: 1000 });
    await openIn(page, E2E_URL, theme, '/?lang=es');
    await page.locator(SECTION).scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
}

for (const width of [1280, 390]) {
    test(`layout: side by side, equal cards, fields, wide button — ${width}px (RF-1, RF-2, RF-5, RF-7)`, async ({ page }) => {
        await open(page, width);
        const cards = await box(page, `${SECTION} .contact-card`);
        const formCard = await page.locator(FORM).evaluate((f) => { const c = f.closest('.card-frame'); if (!c) return null; const r = c.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width }; });
        const fields = Object.fromEntries(await Promise.all(['name', 'email', 'subject', 'message'].map(async (n) => [n, (await page.locator(`${FORM} [name="${n}"]`).evaluate((i) => { const r = (i.closest('label') ?? i).getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width }; }))]))) as Record<string, Box>;
        const form = await page.locator(FORM).evaluate((f) => { const r = f.getBoundingClientRect(); const cs = getComputedStyle(f); return { l: r.left + parseFloat(cs.paddingLeft), r: r.right - parseFloat(cs.paddingRight) }; });
        const button = await page.locator(`${FORM} button[type="submit"]`).evaluate((b) => { const r = b.getBoundingClientRect(); const icons = [...b.querySelectorAll('svg, [class*="icon"]')]; return { l: r.left, r: r.right, icons: icons.length, hidden: icons.every((i) => i.closest('[aria-hidden="true"]')), iconFirst: !!icons[0] && icons[0].getBoundingClientRect().right <= [...b.childNodes].filter((n) => n.nodeType === 3 && n.textContent!.trim()).map((n) => { const rg = document.createRange(); rg.selectNodeContents(n); return rg.getBoundingClientRect().left; })[0] + 0.5 }; });
        const offenders: string[] = [];
        const last = cards[cards.length - 1];
        if (!formCard) offenders.push('RF-1: the form sits in no card frame');
        else if (width === 1280) {
            if (cards.some((c) => formCard.l < c.r)) offenders.push('RF-1: the form card does not start right of every contact card');
            if (formCard.t >= last.b || formCard.b <= cards[0].t) offenders.push('RF-1: the form card is not beside the contact cards');
        } else if (formCard.t < last.b) offenders.push(`RF-1: at ${width}px the form card does not start below the last contact card`);
        // RF-2 (changed 2026-10-17): one card per row across the cards column, every value whole at 1280.
        const list = (await box(page, `${SECTION} .contact-list`))[0];
        cards.forEach((c, i) => { if (Math.abs(c.l - list.l) > 1 || Math.abs(c.r - list.r) > 1) offenders.push(`RF-2: card ${i + 1} spans ${c.l.toFixed(0)}–${c.r.toFixed(0)}, not the column ${list.l.toFixed(0)}–${list.r.toFixed(0)}`); });
        if (width === 1280) {
            const cut = await page.locator(`${SECTION} .contact-value`).evaluateAll((els) => els.filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent?.trim()));
            for (const v of cut) offenders.push(`RF-2: the value "${v}" is cut`);
        }
        if (width === 1280) {
            if (Math.abs(fields.name.t - fields.email.t) > 1 || Math.abs(fields.name.w - fields.email.w) > 1) offenders.push('RF-5: Name and Email are not one row of equal fields');
            for (const n of ['subject', 'message']) if (Math.abs(fields[n].l - form.l) > 1 || Math.abs(fields[n].r - form.r) > 1) offenders.push(`RF-5: ${n} does not span the form`);
        } else {
            for (const n of Object.keys(fields)) if (Math.abs(fields[n].l - form.l) > 1 || Math.abs(fields[n].r - form.r) > 1) offenders.push(`RF-5: ${n} does not span the form at ${width}px`);
        }
        if (Math.abs(button.l - form.l) > 1 || Math.abs(button.r - form.r) > 1) offenders.push(`RF-7: the button spans ${button.l.toFixed(0)}–${button.r.toFixed(0)}, not the form ${form.l.toFixed(0)}–${form.r.toFixed(0)}`);
        if (button.icons !== 1 || !button.hidden || !button.iconFirst) offenders.push(`RF-7: the button holds ${button.icons} icons, hidden ${button.hidden}, before the text ${button.iconFirst}`);
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
}

test('labels read as written, in sentence case (RF-3)', async ({ page }) => {
    await open(page, 1280);
    const t = tr('es');
    const labels = await page.locator(`${SECTION} .contact-label`).evaluateAll((els) => els.map((e) => ({ text: (e as HTMLElement).innerText.trim(), transform: getComputedStyle(e).textTransform })));
    const offenders: string[] = [];
    CONTACTS.forEach((c, i) => {
        const want = contactLabel(c, t);
        if (labels[i]?.text !== want) offenders.push(`RF-3: card ${i + 1} reads "${labels[i]?.text}", not "${want}"`);
        if (labels[i]?.transform !== 'none') offenders.push(`RF-3: card ${i + 1} label is text-transform ${labels[i]?.transform}`);
    });
    expect(offenders, offenders.join('\n')).toEqual([]);
});

for (const theme of THEMES) {
    test(`email glyph in gold, field names inside their fields — ${theme} (RF-4, RF-6)`, async ({ page }) => {
        const requests: string[] = [];
        page.on('request', (r) => requests.push(r.url()));
        await open(page, 1280, theme);
        await installHelpers(page);
        const offenders: string[] = [];
        const email = await page.locator(`${SECTION} .contact-card`).first().evaluate((card) => {
            const w = window as any;
            const g = card.querySelector('.contact-glyph') as HTMLElement | null;
            const probe = document.createElement('i'); probe.style.color = 'var(--accent-text)'; document.body.append(probe);
            const gold = w.__toHex(getComputedStyle(probe).color); probe.remove();
            return g ? { mask: getComputedStyle(g).maskImage || getComputedStyle(g).webkitMaskImage, fill: w.__toHex(getComputedStyle(g).backgroundColor), card: w.__toHex(getComputedStyle(card).backgroundColor), gold } : null;
        });
        if (!email) offenders.push('RF-4: the email card draws no glyph');
        else {
            if (!email.mask.includes('/icons/ui/mail.svg')) offenders.push(`RF-4: the email glyph masks ${email.mask}`);
            if (email.fill !== email.gold) offenders.push(`RF-4: the email glyph paints ${email.fill}, not the accent ${email.gold}`);
            if (contrast(email.fill, email.card) < 3) offenders.push(`RF-4: the email glyph is ${contrast(email.fill, email.card).toFixed(2)}:1 on its card`);
        }
        if (requests.some((u) => u.includes('gmail.svg'))) offenders.push('RF-4: the page still loads gmail.svg');
        for (const [n, v] of [['name', 'Ana'], ['email', 'ana@example.com'], ['subject', 'Hola'], ['message', 'Texto']]) await page.locator(`${FORM} [name="${n}"]`).fill(v);
        const fields = await page.locator(`${FORM} .contact-form__label`).evaluateAll((labels) => labels.map((label) => {
            const w = window as any;
            const input = label.querySelector('input, textarea') as HTMLElement;
            const drawn = (e: Element) => { const cs = getComputedStyle(e); return parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none'; };
            const field = drawn(label) ? label : input;
            const text = label.querySelector('span') as HTMLElement;
            const f = field.getBoundingClientRect(); const s = text.getBoundingClientRect();
            const cs = getComputedStyle(text);
            return { name: input.getAttribute('name'), inside: s.left >= f.left - 0.5 && s.right <= f.right + 0.5 && s.top >= f.top - 0.5 && s.bottom <= f.bottom + 0.5,
                topLeft: s.top <= (f.top + f.bottom) / 2 && s.left <= f.left + 24, visible: cs.visibility === 'visible' && cs.opacity === '1' && s.height > 0,
                fg: w.__toHex(cs.color), ground: w.__groundOf(text, 'none').colour };
        }));
        for (const f of fields) {
            if (!f.inside) offenders.push(`RF-6: the ${f.name} label sits outside its field`);
            if (!f.topLeft) offenders.push(`RF-6: the ${f.name} label is not at the field's top left`);
            if (!f.visible) offenders.push(`RF-6: the ${f.name} label is hidden once the field holds text`);
            if (contrast(f.fg, f.ground) < 4.5) offenders.push(`RF-6: the ${f.name} label is ${contrast(f.fg, f.ground).toFixed(2)}:1 on its field`);
        }
        if (fields.length !== 4) offenders.push(`RF-6: ${fields.length} labelled fields, not 4`);
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
}
