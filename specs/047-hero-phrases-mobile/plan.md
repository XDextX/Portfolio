# Plan 047 — The hero's phrases read as a flow on a phone

**Spec:** `specs/047-hero-phrases-mobile/spec.md` (3 RF).
**Status:** approved
**Approved:** 2026-10-18 · owner approval · 153 lines
**Changed:** 2026-10-18 · from implementation: the es breakpoint is `32.5rem` (520 px), not `30rem`, because the viewport-minus-72 px room holds only to 480 px (3+1 at 488-512, caught by the sweep); en stays `26rem`. `e2e/helpers/pixels.ts` gained the optional `pseudo` on `PixelTarget` (T-1), as block 2 planned · 158 lines

## 1. Scope and coverage

| Item | Covered by |
|---|---|
| RF-1 (two per line, in order) | Below each locale's breakpoint, the row gets a zero-width line break after the second phrase: `.about-phrases::after` as a full-width flex item between phrases 2 and 3, placed there with `order`. |
| RF-2 (gold chevron between the pair) | The existing `li + li::before` chevron in `--accent-text` stays on phrases 2 and 4. New: its contrast over the hero's ground at the worst pixel, light and dark (the dark glow and the band included). |
| RF-3 (no line starts with a chevron) | In the same breakpoint, phrase 3's `::before` is `content: none`. |
| NFR both themes | No colour changes; every check runs in light and dark. |
| NFR 035 RF-3 untouched | The new rules live inside `max-width` queries far below the `64rem` block; `e2e/hero-layout.spec.ts` "phrases stacked on the right at 1280 (RF-3)" stays green unchanged. |
| NFR where four fit, one line | Per-locale breakpoints derived from each row's width (block 6, decision 2), held by a width sweep that reads the row's width from the page, not from a constant. |
| NFR italic, markup order, screen readers | Markup at `src/components/AboutSection.astro:59` is untouched; `order` only moves the break, and phrases keep their DOM order visually too (1, 2 at order 0; 3, 4 at order 2). `e2e/hero.spec.ts` RF-2 (one list of four, in order) and RF-3 (italic) stay green. |
| NFR 035 RF-4 still holds | `e2e/hero-layout.spec.ts:85-94` stays, with its chevron assertion widened (block 6, decision 4). |
| Edge: three would fit, four not | The breakpoint is "four do not fit", so three-fit widths pair as well; the sweep covers every width from 320 to 720. |
| Edge: a fifth phrase | The new spec asserts `ABOUT.phraseKeys.length === 4` first and names it as the finding when it is not. |

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `src/components/AboutSection.astro` | modify | Styles only (lines 166-194 region, after the `max-width: 720px` block at 343-370): two locale-scoped `max-width` queries holding the break, the reorder and the suppressed chevron. One comment, at most five lines, giving the relationship behind each number. |
| `e2e/helpers/pixels.ts` | modify | `PixelTarget` gains an optional `pseudo` (`'::before'`), read by `getComputedStyle(e, t.pseudo)` for the colour; the box stays the element's own (block 6, decision 5). |
| `e2e/hero-phrases.spec.ts` | create | RF-1, RF-2, RF-3 at 360 and 390 in both locales and themes; the NFR sweep 320-720. |
| `e2e/hero-layout.spec.ts` | modify | Line 92: "the chevrons are gone" reads every phrase that shares a line with its predecessor, not phrases 2-4 blindly. |

No locale file, no token, no data file changes.

## 3. Pure logic

None. The rule is CSS; the sweep's expectation is computed inside the test from rendered boxes:

```ts
/** Which layout a width must show, from the single-line row width read at 720 px. */
expected(contentWidth: number, rowWidth: number, slack: number): 'one' | 'pairs' | 'either'
// contentWidth >= rowWidth + slack → 'one'; contentWidth < rowWidth → 'pairs'; else 'either'
```

It lives inline in the spec file (one caller); nothing reads the clock.

## 4. Algorithm

CSS, per locale `L` with breakpoint `B(L)`:

```
@media (max-width: B(L))
  .about-phrases:lang(L)                  row-gap: 0
  .about-phrases:lang(L)::after           content ''; flex-basis 100%; block-size var(--sp-2); order 1
  .about-phrases:lang(L) li:nth-child(n+3) order 2
  .about-phrases:lang(L) li:nth-child(3)::before  content none
```

The break item is the row gap: with `row-gap: 0` and its own `block-size: var(--sp-2)` the two
lines sit exactly today's `--sp-2` apart; with the row gap kept, the empty line would double it.
`:lang()` sits on the scoped `ul` itself, which inherits `lang` from `<html lang="es-CR|en-US">`
(`src/layouts/BaseLayout.astro:35,46`), so Astro's scoping attribute does not get in the way.

Sweep (per locale, one page, resized in place):

```
open /?lang=L at 720; rowWidth = last li right - first li left   // one line there
for w in 320..720 step 4:
  setViewportSize(w); wait two animation frames
  lines = li tops grouped within 1 px
  layout = 'one' if one line with chevrons on 2, 3, 4
         = 'pairs' if lines == [[1,2],[3,4]] and RF-3 holds
         = 'other'
  fail if layout == 'other', or layout != expected(ul.clientWidth, rowWidth, 16) when that is not 'either'
```

RF-3 reads the rendered start of each line: for the first phrase of a line, a `Range` over its text
node starts within 0.5 px of the `ul`'s left edge, and its `::before` computes `content: none`.

## 5. Interface

| State | Light | Dark |
|---|---|---|
| ≤ breakpoint (360, 390) | "Ideas › Código" / "Soluciones › Resultados" (en: "Ideas › Code" / "Solutions › Results"), italic, `--text-secondary`, chevrons `--accent-text`, lines `--sp-2` apart | same, over the band and the hero's gold glow |
| breakpoint < width ≤ 720 | today's single line, three chevrons | same |
| > 720 | untouched (two-column grid, then 035 RF-3's stacked flow from 64rem) | same |

Empty state: none — `ABOUT.phraseKeys` is static data; an empty list renders an empty `ul` today and still would.

## 6. Decisions

1. **A forced break after phrase 2, via an ordered `::after` flex item.** Discarded: a two-column
   grid (`repeat(2, max-content)`) — column 1 takes the width of "Soluciones", so line one renders
   "Ideas", a hole, then "› Código"; wrapping pairs in their own element — changes the `ul/li`
   markup screen readers read; `display: inline` items with a single breakable space — relies on
   how browsers treat the boundary between two `nowrap` boxes, unverified.
2. **One breakpoint per locale, in rem: the first width where the locale's row fits, rounded up to
   the next half rem.** en: 338 + 72 = 410 → `26rem` (416). es: `32.5rem` (520), not the 474 → `30rem`
   first planned (changed 2026-10-18, from implementation). The 72 px between viewport and content
   (360 → 288, 390 → 318) holds only up to 480: above it the page gutter joins (the main column
   loses 40 px at 484) and the sheet's 4vw padding grows after 500, so the room drops from 408 px
   at 480 to 372 at 484 and reaches the Spanish row's 402 again only at about 516; `30rem` showed
   3+1 from 488 to 512, which the 320-720 sweep caught. At 520 the room is 406. The rounding leaves
   a band (es about 516-520, en 410-416) where four would fit and two per line show; the sweep's
   16 px slack tolerates that and nothing wider. Discarded: one
   `32.5rem` for both — English would pair from 416 to 520 with room for four, breaking the NFR;
   an intrinsic layout — CSS cannot detect a wrap, and no CSS mechanism hides the separator that
   lands at a line's start without clipping tricks that would also clip the italic's overhang;
   a client script measuring the row — a resize-bound script under `<ClientRouter />` for what a
   media query states. A media query cannot read a custom property, so the number is unavoidable
   here: AGENTS' "write the relationship" is honoured by the comment and enforced by the sweep,
   which goes red on a 3+1 wrap the moment a wording change outgrows its breakpoint.
3. **The four rules are written twice, once per locale query.** Three short rules; the alternatives
   (style queries, an override band) cost more than the duplicate. A third locale has no rule and
   the sweep, which iterates `i18n/locales/*.json`, goes red for it.
4. **Widen 035's chevron assertion, do not keep it.** `e2e/hero-layout.spec.ts:92` asserts a
   `::before` on phrases 2-4; RF-3 removes phrase 3's at 390 by design, so it would go red. The
   guard is right in intent ("chevrons drawn", 035 RF-4) and wrong in what it reads. New reading:
   every phrase sharing a line with its predecessor carries the chevron, and at least one does.
   Injection 5 proves it still bites.
5. **The chevron's contrast is measured over its phrase's whole box.** A pseudo-element has no
   client rect; the `li`'s rects contain the chevron, so the worst pixel under the `li` is never
   better than the worst under the chevron — stricter, never laxer. Discarded: computing the
   pseudo's box from its width and margins — a second layout model in the test.

## 7. Test strategy

Runners from `package.json`: `npm test` (`vitest --run tests`) and `npm run test:e2e`
(Playwright, server on 4329 from `e2e/helpers/server.ts`). No new dependency.

`e2e/hero-phrases.spec.ts`, opened with `openIn` from `e2e/helpers/rendered.ts`, viewport
`W×844`, after a 400 ms settle and a check that the new rule is in `document.styleSheets`:

- **RF-1** — at 360 and 390, es and en, light: li tops form exactly two groups, `[1,2]` and `[3,4]`.
- **RF-3** — same widths and locales: the first phrase of each line starts its text at the `ul`'s
  left edge (Range box) and computes `::before` `content: none`.
- **RF-2** — at 360 and 390, light and dark, es: `worstOverBackground` with
  `{ sel: '.about-phrases li:nth-child(2n)', pseudo: '::before', kind: 'border', floor: 3 }`,
  hide `.layout-topbar, .section--hero > :not(.hero-band)`, clip `section.section--hero` (the
  pattern of `e2e/hero-background.spec.ts:72-90`), returns an `fg` equal to a probe of
  `--accent-text` for both, and clears 3:1.
- **NFR sweep** — es and en, 320 to 720 step 4, as in block 4.
- Precondition: `ABOUT.phraseKeys.length === 4`, failing with "a fifth phrase is a finding for that change (spec 047 edge case)".

Existing guards that must stay green: `e2e/hero-layout.spec.ts` (RF-3 stacked at 1280; RF-4 at
390, widened; RF-7 avatar beside the name), `e2e/hero.spec.ts` (RF-2 one list of four in order,
RF-3 italic), `e2e/hero-background.spec.ts` (RF-3 phrases text over the band at 390/800/1280, RF-5
same layout with and without the band), `e2e/dark-glows.spec.ts` (RF-5/RF-6 floors),
`tests/comments.test.ts` (the new comment), `tests/tokens.test.ts` (no token invented),
`tests/seo.test.ts` (the og-cover's phrases, untouched).

Injections (each made, seen red, reverted by explicit path):

1. Delete both new media queries (today's wrap) → RF-1 and RF-3 red at 360 and 390 in both locales; the sweep red.
2. Keep the break, drop `li:nth-child(3)::before { content: none }` → RF-3 red.
3. Chevron `border-color: var(--color-border)` inside the new queries → RF-2 red (colour and ratio).
4. es breakpoint `25rem`, then en breakpoint `30rem` → the sweep red each time (3+1 between 400 and 520 for es; pairs with room for four for en).
5. In the widened `e2e/hero-layout.spec.ts` RF-4: `li:nth-child(2)::before { content: none }` → RF-4 red.
6. `e2e/helpers/pixels.ts` ignoring `pseudo` → RF-2 red (the colour read is the text's, not the accent).
