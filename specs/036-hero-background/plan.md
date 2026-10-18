# Plan 036 — A flat-shape background behind the hero and the social card

**Spec:** `specs/036-hero-background/spec.md` (5 RF).
**Status:** approved
**Approved:** 2026-10-17 · owner approval with the spec · 87 lines
**Changed:** 2026-10-17 · at implementation: per-theme fills became --band-* aliases in each theme file instead of per-shape light/dark pairs, so a shape names one token and the generator resolves it like any other; the sheet's padding, radius and the topbar's height became tokens (--sheet-pad-block, --sheet-pad-inline, --sheet-radius, --topbar-block) so the band reaches past them without copying them; the pixel check moved to e2e/helpers/pixels.ts, shared by the hero and the card; the first pixel check counted a wrapped name's other words as background and was rebuilt to measure line boxes over the bare band; tuning: light centre tile = the sheet, light corners one step down, the right gold and bottom tiles moved into the corners; the card anchors the band right (xMaxYMid)

## 1. Scope and coverage

| RF | Covered by |
|---|---|
| RF-1 (band from the sheet's top to the hero's bottom) | `HeroBackground.astro`, rendered first inside the hero, absolutely positioned with negative insets equal to the sheet's padding and the topbar's height; `overflow: clip` and the sheet's radius on its top corners. |
| RF-2 (token fills, theme-aware) | `src/data/heroShapes.ts` lists each shape (centre, side, corner ratio, fill as a token name or a two-token mix); the component writes `fill: var(--x)` or `color-mix(in srgb, var(--a) N%, var(--b))` per shape. |
| RF-3 (contrast floors over the shapes) | Shape placement tuned to the corners, away from the text; settled by a pixel check. |
| RF-4 (the cards draw the same shapes) | `scripts/og-cover.ts` imports `heroShapes` and draws them as SVG in `cardHtml`, resolving each token from its readings (dark theme). |
| RF-5 (layout unchanged) | The band is absolute and `pointer-events: none`; nothing in the flow moves. |

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `src/data/heroShapes.ts` | create | The one definition of the shapes. |
| `src/components/HeroBackground.astro` | create | The band: inline SVG from the definition. |
| `src/components/AboutSection.astro` | modify | Renders the band; the hero becomes `position: relative`, content above it. |
| `public/styles/00-tokens.css`, `src/styles/global.css` | modify | `--sheet-pad-block` and `--sheet-pad-inline` declared once and read by `main` and the band, so the inset is the padding, not a copy of it. |
| `scripts/og-cover.ts` | modify | Shapes behind the card. |
| `tests/seo.test.ts` | modify | RF-4: the generator imports the definition, the markup holds its shapes in dark values. |
| `e2e/hero-background.spec.ts` | create | RF-1, RF-2, RF-3, RF-5. |
| `e2e/og-cover-layout.spec.ts` | modify | RF-4 contrast over the shapes. |
| `public/og-cover-es.png`, `-en.png` | regenerate | The cards with the shapes. |

## 3. Pure logic

- `shapeFill(entry)`: a CSS colour expression from a shape's fill (token or mix). Shared by the
  component and the generator; tested for both forms.

## 4. Algorithm

```ts
// heroShapes.ts — in a 2000×744 box, the draft the owner accepted
export const HERO_SHAPES = [
  { cx: 40,   cy: -120, side: 560, fill: { token: '--neutral-200' } },
  { cx: 120,  cy: 760,  side: 620, fill: { light: { mix: ['--brand-accent', '--main-bg', 45] }, dark: { token: '--neutral-100' } } },
  …
  { line: [1868, 340, 1992, 216], stroke: { token: '--brand-accent' } },
  { line: [1816, 424, 1984, 268], stroke: { token: '--brand-primary-light' } },
] as const;
```

A fill that differs per theme names both; the component emits a class per theme switch through
`:root[data-theme='dark']`, as the theme files already do. The SVG uses
`preserveAspectRatio="xMidYMid slice"` so the corners stay corners at every width.

**Pixel check (RF-3):** for each element, hide it (`visibility: hidden`), take
`page.screenshot({ clip: box })`, decode it in the page through an `<img>` and a canvas, and
measure each pixel against the element's colour with `tests/helpers/colour.ts`.

## 5. Interface

| Width | Light / dark |
|---|---|
| 1280 | pale tiles in the corners and a pale gold tile low left; navy-step tiles and two diagonals top right / the same in navy steps, gold tile right |
| 390 | the corners only; the text sits on the plain sheet |

## 6. Decisions

- **D-1 · Inline SVG with token fills.** Theme-aware for free, no request, about a kilobyte.
  *Discarded:* the WebP (345 KB, texture, a third hue) and two SVG files (a light and a dark copy
  with literal colours, AGENTS' second palette).
- **D-2 · One definition for the hero and the cards.** *Discarded:* redrawing the shapes in the
  generator — fixed-size decorative markup duplicated is the drift AGENTS warns about.
- **D-3 · The band inside the hero, reaching out with the sheet's padding.** Only the home page has
  a hero, so the band needs no layout change. *Discarded:* a slot in `BaseLayout`.

## 7. Test strategy

Runner from `package.json`: `npm test` and `npm run test:e2e`.

- **Unit** (`tests/seo.test.ts`): `shapeFill` for a token and a mix; the generator source imports
  `heroShapes`; the card markup holds one shape per entry with the dark values.
- **Rendered** (`e2e/hero-background.spec.ts`): RF-1 box and radius at 1280 and 390, no band on
  /proyectos; RF-2 fills per theme and after a toggle; RF-3 the pixel check, both themes, three
  widths; RF-5 boxes with the band and with it removed.
- **Rendered** (`e2e/og-cover-layout.spec.ts`): RF-4 pixel check of the card's text.
- **Injections:** (1) the band without its negative insets → RF-1; (2) a literal hex fill → RF-2;
  (3) the gold tile moved behind the phrases → RF-3; (4) the generator without the shapes → RF-4;
  (5) the band in the flow (`position: static`) → RF-5.
