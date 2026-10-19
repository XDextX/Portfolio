# Plan 045 — Contact cards without their value on a phone

**Spec:** `specs/045-contact-card-values/spec.md` (6 RF).
**Status:** approved
**Approved:** 2026-10-18 · owner approval · 136 lines

**Precondition: spec 048 is merged into `main` before this branch is cut.** 048 grows the copy
and open controls to 44 px on `pointer: coarse`, in the same `ContactCard.astro`. RF-2 and RF-5
are measured at 048's sizes, so every coarse-pointer check below assumes 048 is in place; run
against today's 32 px controls they would pass on room that will not be there.

## 1. Scope and coverage

| Item | Covered by |
|---|---|
| RF-1 (no value at phone width) | One `@media (max-width: 720px)` rule in `ContactCard.astro` sets `.contact-value { display: none }`. |
| RF-2 (full value at desktop width) | Nothing outside that query changes: above 720 px the card renders as today. |
| RF-3 (name, copy, href unchanged) | The article's `aria-label`, the copy button's `data-copy` and the open control's `href` are untouched; only CSS changes. |
| RF-4 (label in the value's typography) | The same query gives `.contact-label` `font-size: var(--fs-sm)` and `color: var(--text-color)`; its `font-weight: 600` already matches the value's. |
| RF-5 (one row) | Already a flex row with `align-items: center`; with the value gone, `.contact-info` holds only the label, so the label centres on the icon and controls. No layout change. |
| RF-6 (both controls, named, one size) | `.contact-actions` and the copy script are untouched; spec 018's stacked cell keeps the size. |
| NFR one threshold | A single media query for all three cards, no per-kind rule. |
| NFR themes, locales, hover, `block-size` | Two tokens defined in both theme files (`--text-color`, and `--fs-sm` in `00-tokens.css`); hover and the controls' `block-size` are not touched. |
| Edge: "LinkedIn", Spanish, 360, coarse | RF-5's check at 360 in `es` with a coarse context. |
| Edge: LinkedIn URL at 721, coarse | RF-2's check at 721 with a coarse context. |
| Edge: landscape phone over 720 | Is desktop width by definition; RF-2's 721 check settles it. |
| Edge: reading the value at phone width | RF-3: the accessible name and the open control's `href`. |
| Edge: a new contact kind | The rules are kind-free; the RF-2 and RF-5 loops iterate `CONTACTS`, so a new entry is measured. |

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `src/components/ContactCard.astro` | modify | Decides what a card shows at phone width: no value, the label in the value's type. JSDoc line 12 ("its value as a link") gains "on a desktop". |
| `src/components/ContactSection.astro` | modify (comment only) | Lines 89–92 measure the value's ellipsis at 360 and 414 px, a state that no longer exists at those widths. The `min-width: 0` rule stays (a value can still exceed its room above 720 px); the comment is rewritten without the stale numbers (AGENTS: a stale number is worse than none). |
| `e2e/contact-cards.spec.ts` | modify | A `spec 045` describe: RF-1 to RF-6 and the threshold NFR, rendered, fine and coarse pointer. Extends the existing card spec rather than a new file. |

Not touched: `src/utils/contact.ts`, `src/data/contacts.ts`, `src/types/contact.ts`, the locale
files (no new visitor-facing text), `tests/contact.test.ts` (no data changes).

## 3. Pure logic

None. The change is one media query; nothing computes, and no clock is involved.

## 4. Algorithm

```css
/* inside ContactCard.astro's <style>, after .contact-value */
/* Spec 035's single-column line, the same literal as AboutSection's query (spec 045). */
@media (max-width: 720px) {
  .contact-value { display: none; }
  .contact-label { font-size: var(--fs-sm); color: var(--text-color); }
}
```

The test reads, per card (in-page `evaluate`):

```ts
holdsValue(el) = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.includes(value))
shown(el)      = el.checkVisibility({ visibilityProperty: true, opacityProperty: true })
                 && rect.width * rect.height > 1
RF-1: no el in card with holdsValue(el) && shown(el); icon, label, copy, open all shown
RF-2: the one el with holdsValue is shown, scrollWidth === clientWidth,
      value's vertical span overlaps copy's       // label sits above it, so centres differ
RF-4: label's computed fontSize/fontWeight/color === value's computed ones (the value still
      computes under display:none); at 1280 label is 12px / 600 / not the value's colour
RF-5: centreY of icon, label, copy, open within 1 px; label.scrollWidth <= label.clientWidth
```

`holdsValue` reads the element's own text nodes, so the article (whose `textContent` includes the
link's) is not mistaken for a visible holder.

## 5. Interface

| State | Light | Dark |
|---|---|---|
| Phone (≤ 720 px), rest | Icon, label at 13 px / 600 in `--text-color` (#16202C), copy, open, one row. | Same, label #F5F7FA. |
| Phone, copy feedback | The copy cell shows "Copiado"/"Copied" or the error at the same size (spec 018). | Same. |
| Phone, keyboard | Two tab stops per card (copy, open); the hidden value link leaves the order. | Same. |
| Desktop (≥ 721 px) | As today: small muted label above the value link, controls beside. | As today. |
| Empty | None: `CONTACTS` is never empty (`tests/contact.test.ts`), and a card always has a label and a value. | — |

## 6. Decisions

- **`display: none` on the value link at phone width.** Discarded: `.sr-only` on it. A
  visually-hidden link stays focusable, so a keyboard user would land on a focus ring around
  nothing (1 px, clipped). The value is not lost: the article's `aria-label` carries
  `${label}: ${item.value}` at every width, and the open control has the same `href`. The tab
  order loses a stop that duplicated the open control. Grep (2026-10-18): nothing else reads
  `.contact-value` except `e2e/contact-layout.spec.ts:47`, which measures it at 1280 only, where it
  still renders.
- **Keep the link in the markup, hide it with CSS.** Discarded: rendering two variants or
  dropping the link server-side. The server cannot know the width; one markup with a media query
  is the platform's answer.
- **The viewport query `(max-width: 720px)`, the exact text of `AboutSection.astro:346`.**
  Discarded: the section's `@container contact (min-width: 60rem)`. The spec rejects it (it would
  hide values from about 640 to 1150 px, where they fit). Discarded: a shared custom property,
  which a media query cannot read. Cost: the literal now lives in two components; the comment
  names spec 035 so a change to one finds the other, and the 720/721 checks pin this side.
- **Override the label's two differing properties, not a shared class with the value.**
  Discarded: giving the label `.contact-value`'s class at phone width (a class swap needs markup
  per width). `font-weight` already matches, so only `font-size` and `color` move.
- **Extend `e2e/contact-cards.spec.ts`.** Discarded: a new `contact-values.spec.ts`; the card's
  helpers (`tr`, `openContact`, `buttonState`) already live there.

## 7. Test strategy

Runner: `npm run test:e2e` (Playwright, installed Chrome, server on 4329). `npm test` gains
nothing: no data or pure logic changes, and constitution 8 rules out a source grep for the media
query. Coarse pointer: a `test.describe` with `test.use({ isMobile: true, hasTouch: true,
viewport })`. Each width's test asserts the stylesheet carries the rule before measuring
(`document.styleSheets` holds a `max-width: 720px` rule naming `.contact-value`) and waits 500 ms
for the theme transition to settle, as `contact-layout.spec.ts` does.

| Check | Widths | Pointer | Locales / themes |
|---|---|---|---|
| RF-1: no visible value; icon, label, both controls shown | 360, 390, 720 | fine, and coarse at 390 | es, en / light |
| RF-2 + NFR: every value shown, unclipped, on the controls' row | 721, 1280 | fine and coarse | es, en / light |
| RF-3: `toHaveAccessibleName('<label>: <value>')` on each article; clipboard text equals `copyValue`; open `href` equals `item.href` | 360, 1280 | fine | es / light (name in both locales) |
| RF-4: label type equals the value's; 1280 keeps the muted style | 360, 390, 1280 | fine | es / light and dark |
| RF-5: one row, label unclipped | 360, 390 | coarse | es, en / light |
| RF-6: both controls shown and named `contact.actions.copyAria` / `openAria`; copy box equal across rest, `copy-btn--ok`, `copy-btn--err` (classes set in-page) | 360, 390, 1280 | fine and coarse | es, en / light |

The existing clipboard test (spec 018 RF-4) gains a 360 px run for RF-3 instead of a copy.

Injections, each reverted by explicit path:

1. RF-1: change the rule to `.contact-card:not(:has(a[href^="mailto:"])) .contact-value` — the
   email's value shows at 390; the RF-1 test goes red for the email card only.
2. RF-2: add `.contact-card:has(a[href^="mailto:"]) .contact-value { display: none }` outside the
   query — the RF-2 test goes red at 1280 for the email card.
3. NFR: change the query to `(max-width: 721px)` — RF-2 at 721 goes red for every card.
4. RF-4: delete the `.contact-label` line inside the query — the RF-4 test goes red at 360 and 390
   (12 px against 13, muted colour) in both themes.
5. RF-5: add `.contact-info { align-self: flex-start }` inside the query — the label's centre
   leaves the controls' by more than 1 px; RF-5 goes red.
