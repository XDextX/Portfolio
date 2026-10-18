# Plan 035 — Hero arranged like the proposal

**Spec:** `specs/035-hero-layout/spec.md` (7 RF).
**Status:** approved
**Approved:** 2026-10-17 · owner approval with the spec · 79 lines
**Changed:** 2026-10-17 · at implementation and review: the name spans text and phrases columns (meta row 'avatar meta meta'), so it stays on one line at 1024px; the last grid row takes the phrases column's surplus (44px between bio and buttons without it); owner at the visual review: a gold circle-check per phrase joined by segments (hollow checks, so no continuous line), and the tile beside the name on a phone; an injection that only changed grid-template-columns stayed green (the areas make the column) and was replaced by one that moves the tile above the name

## 1. Scope and coverage

| RF | Covered by |
|---|---|
| RF-1 (framed tile, top-aligned) | `.about-avatar` becomes the tile: `--card-background` fill, 1px `--color-border`, `--radius-md`, padding `--sp-3`; 160px outside, so the image is 160 − 2 × padding − 2px; the grid aligns to `start`. |
| RF-2 (role and location at `--fs-base`) | `.about-job`, `.about-location` font-size. |
| RF-3 (phrases stacked on the right) | `.about-grid` gains a third column and named areas; `.about-content` becomes `display: contents` from the three-column width so meta, phrases, bio and actions are grid items; the phrases take the right column, `flex-direction: column`; the list's `::before` draws the gold line and each item's `::before` (the chevron below the breakpoint) becomes a gold dot. |
| RF-4 (row under the name below that width) | Below the breakpoint the grid keeps today's two columns and the phrases' row styles, chevrons included. |
| RF-5 (bio) | `ABOUT.bio.es` and `.en` in `src/data/about.ts`. |
| RF-6 (hero «Email») | The hero's email social reads a new key, `about.emailButton` (es «Email», en «Email»); `about.social.email` stays for the contact card and the form. |

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `src/components/AboutSection.astro` | modify | Tile, sizes, three-column grid with the phrases on the right. |
| `src/data/about.ts` | modify | Bio copy; the email social's label key. |
| `i18n/locales/es.json`, `en.json` | modify | `about.emailButton`. |
| `e2e/hero-layout.spec.ts` | create | RF-1 to RF-6, rendered. |

## 3. Pure logic

None.

## 4. Algorithm

```css
.about-grid { grid-template-columns: 160px 1fr; align-items: start; }
@media (min-width: 64rem) {             /* the sheet holds tile + text + a phrases column */
  .about-grid    { grid-template-columns: 160px minmax(0, 1fr) max-content;
                   grid-template-areas: 'avatar meta phrases' 'avatar bio phrases' 'avatar actions phrases'; }
  .about-content { display: contents; }
  .about-phrases { grid-area: phrases; flex-direction: column; align-self: center; }
  .about-phrases li + li::before { content: none; }
}
```

The breakpoint is checked against the sheet's real content width at 1024 px (AGENTS: grid
arithmetic): 160 + gaps + the bio's measure + the longest phrase must fit, or the column collapses.

Bio, en: "I build complete software solutions, from the architecture to production. Over 6 years
of experience working with .NET, Java, TypeScript and cloud technologies."

## 5. Interface

| Width | Light and dark |
|---|---|
| 1280 | tile · name / role · location / bio / actions · phrases stacked on the right |
| 800 | two columns: tile · text, phrases in a row under the role |
| 390 | stacked as today, phrases in a row under the role |

## 6. Decisions

- **D-1 · `display: contents` on the content column.** Lets the phrases leave the text column
  without moving them in the markup, so the reading order (name, role, phrases, bio, actions)
  stays the same at every width. *Discarded:* duplicating the list for the wide layout.
- **D-2 · A new label key for the hero button.** «Correo» stays the right word for the card and
  the field. *Discarded:* changing `about.social.email`, which would rename both.

## 7. Test strategy

Runner from `package.json`: `npm test` and `npm run test:e2e`.

- **Rendered** (`e2e/hero-layout.spec.ts`): RF-1 tile border, padding, top alignment and image
  size at 1280; RF-2 computed sizes against the token per theme; RF-3 at 1280 the phrases' boxes
  stacked and right of the bio, italic, `::before` content `none`; RF-4 at 390 a shared line and
  chevrons; RF-5 the bio's text per locale against `ABOUT.bio`; RF-6 the hero button's text and
  the contact card's label per locale.
- **Kept:** `e2e/hero.spec.ts` (spec 010) green.
- **Injections:** (1) tile border removed → RF-1; (2) role back to `--fs-sm` → RF-2;
  (3) `display: contents` removed → RF-3; (4) the breakpoint applied at every width → RF-4;
  (5) the old bio back → RF-5; (6) the email social back on `about.social.email` → RF-6.
