# Plan 029 — Contact section arranged like the proposal

**Spec:** `specs/029-contact-layout/spec.md` (7 RF).
**Status:** approved
**Approved:** 2026-10-17 · owner approval with the spec · 101 lines
**Changed:** 2026-10-17 · at implementation: the focus ring stays on the input (spec 016's guard pairs any outline removal with a ring on the same selector); the Name/Email threshold is a 20rem form, not 28rem (the form column is ~376px wide at 1280 px); the submit does not lift on hover (the base lift moved it out from under a resting pointer, so it never held still for a click); send.svg added from Tabler v3.49.0; the hero's email button reads the contact card's glyph; owner: RF-2 one card per row

## 1. Scope and coverage

| RF | Covered by |
|---|---|
| RF-1 (cards and form side by side) | `ContactSection`: a two-column grid from a 60rem section width; the form wrapped in `.card-frame`. |
| RF-2 (one card per row, value whole) | `.contact-list` becomes a one-column grid: each card spans the cards column. |
| RF-3 (sentence-case label) | `.contact-label` loses `text-transform` and `letter-spacing`. |
| RF-4 (gold mail glyph) | `ContactItem` gains `glyph`; the email entry uses `glyph: 'mail'`; `ContactCard` paints a glyph as a mask in `--accent-text`; `gmail.svg` and its NOTICE line are deleted. |
| RF-5 (Name and Email on one row) | The form is a two-column grid from a 28rem form width; Subject, Message, button, privacy and status span both. |
| RF-6 (label inside the field) | Each `<label>` becomes the field's box (border, radius, fill); its text span sits small at the top; the input inside is borderless. |
| RF-7 (full-width button with icon) | The button spans the form's columns and carries an inline send SVG, aria-hidden. |

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `src/types/contact.ts`, `src/data/contacts.ts` | modify | A contact's mark is either a brand logo (`icon`) or a site glyph (`glyph`). |
| `src/components/ContactCard.astro` | modify | Draws the logo or the glyph; sentence-case label. |
| `src/components/ContactSection.astro` | modify | Places cards and form in two columns; cards in an equal grid. |
| `src/components/ContactForm.astro` | modify | The field boxes with their labels inside, the two-column form, the full-width button. |
| `public/icons/gmail.svg`, `public/icons/NOTICE.md` | delete / modify | The Gmail logo leaves with its last reader. |
| `e2e/contact-layout.spec.ts` | create | RF-1 to RF-7, rendered. |
| `e2e/contact-cards.spec.ts` | modify | Its logo checks skip a card that carries a glyph (RF-4 covers it). |

## 3. Pure logic

```ts
// src/types/contact.ts
export interface ContactItem { …; icon?: string | { light: string; dark: string }; glyph?: string }
```

Exactly one of `icon` / `glyph` per contact, asserted in `tests/contact.test.ts` (data).

## 4. Algorithm

```css
/* ContactSection */
.contact-layout { display: grid; gap: var(--sp-6); }
@container contact (min-width: 60rem) { .contact-layout { grid-template-columns: 1fr minmax(20rem, 26rem); align-items: start; } }
.contact-list { display: grid; gap: var(--sp-3); }                   /* one card per row (RF-2 changed) */

/* ContactForm */
.contact-form { display: grid; gap: var(--sp-3); }                     /* inside .card-frame */
@container form (min-width: 28rem) { .contact-form { grid-template-columns: 1fr 1fr; }
  .contact-form > :not(.contact-form__field--half) { grid-column: 1 / -1; } }
.contact-form__label { position: relative; display: grid; gap: 0.1rem; padding: 0.45rem 0.75rem;
  border: 1px solid var(--control-border); border-radius: var(--radius-sm); background: var(--card-background); }
.contact-form__label:hover { border-color: var(--accent-text); }
.contact-form__label:has(:focus-visible) { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
.contact-form__label:has([aria-invalid='true']) { border: 2px solid var(--fg); }
.contact-form__label > span { font-size: var(--fs-xs); font-weight: 600; color: var(--text-secondary); }
.contact-form__control { border: 0; padding: 0; background: transparent; outline: none; }   /* the box draws the ring */
.contact-form__submit { justify-self: stretch; display: inline-flex; justify-content: center; gap: 0.5rem; }
```

Name and Email sit side by side, so their boxes state the constraint (AGENTS: two controls side
by side): an explicit `block-size` with `box-sizing: border-box`, written as a literal.

The input's `outline: none` is paired with the box's `:has(:focus-visible)` ring, as AGENTS
requires of any rule that removes an outline. Name and Email carry `--half`.

## 5. Interface

| Width | Light and dark |
|---|---|
| ≥ 60rem section | cards 2×2 grid (three cards) left; form card right: Name · Email, Subject, Message, wide button with plane icon, privacy, status |
| narrower | cards, then the form card; fields full width |
| field states | rest grey border; hover gold border; focus ring; invalid 2px ink border with its error text below |

## 6. Decisions

- **D-1 · The label is the field's box.** *Discarded:* a placeholder as the name — it disappears
  while typing and its grey sat under 4.5:1 (owner chose the visible label); an absolutely placed
  label over the input's border — fragile at 200% zoom.
- **D-2 · `glyph` beside `icon` on the contact type.** *Discarded:* a mail logo file — the site
  already owns `/icons/ui/mail.svg` for email (spec 008, one glyph, one meaning).
- **D-3 · Container queries** for both thresholds, as spec 028. *Discarded:* viewport queries —
  the section's width depends on the sheet's gutter.

## 7. Test strategy

Runner from `package.json`: `npm test` and `npm run test:e2e`.

- **Data** (`tests/contact.test.ts`): every contact has exactly one of `icon` and `glyph`; a
  glyph names a file in `public/icons/ui/`.
- **Rendered** (`e2e/contact-layout.spec.ts`): RF-1, RF-2, RF-5, RF-7 at 1280 and 390 px by box
  geometry; RF-3 text and computed `text-transform`; RF-4 mask URL, colour against
  `--accent-text` resolved on the page, contrast on the card per theme, no `gmail.svg` request;
  RF-6 after typing into every field, label box inside field box, contrast on the box's fill.
- **Kept:** spec 015's `e2e/contact-form.spec.ts` and spec 018's `e2e/contact-cards.spec.ts`
  (logo checks skip a glyph card).
- **Injections:** (1) the section grid removed → RF-1 red; (2) the cards back to a flex row →
  RF-2 red; (3) `uppercase` back → RF-3 red; (4) the glyph painted `--icon-mono` → RF-4 red;
  (5) the form back to one column → RF-5 red; (6) the label text outside the box (above it) →
  RF-6 red; (7) the button back to `justify-self: start` → RF-7 red.
