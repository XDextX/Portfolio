- [x] **T-1 — Add the RF-2/RF-3 contrast guards, red first**
  Covers: RF-2, RF-3
  Files: `tests/visual-language.test.ts`
  Done when: `npm test` shows the two new guards failing on injected
  violations (a fill below 3:1 vs the track, a label below 4.5:1 vs the
  badge, each in one theme), then passing once reverted by explicit path.

  Guards before values: the implementation tasks must turn these red
  tests green, not the other way round.

- [x] **T-2 — Card per area with headings through `t()`**
  Covers: RF-4
  Files: grid/section components, locale files (`es`/`en`),
  `tests/i18n.test.ts`
  Done when: `npm test` green including a guard asserting one card
  container per data category (count from the data, no literal list) and
  `tests/i18n.test.ts` resolving every new heading key in both locales;
  browser record shows bordered cards with headings in both themes.

  Visual-work rule: show this component in both themes and wait for
  approval before T-3.

- [x] **T-3 — Rebuild the row to the confirmed geometry**
  Covers: RF-1
  Files: bars-view row component
  Done when: browser record at 1280px and 390px (light and dark) shows
  every row as icon / (name over track) / level with the 22px icon,
  `minmax` track floor, 0.6rem gaps, and the level kept (never hidden
  below any width); `npm test` green.

  Depends on T-2 (cards set the row's container). Show in both themes,
  wait for approval before T-4.

- [x] **T-4 — Theme the fills and track to 3:1 in both themes**
  Covers: RF-2
  Files: theme stylesheets / shared token layer
  Done when: the T-1 RF-2 guard passes unmodified in both themes and
  `tests/tokens.test.ts` is green (no undefined/single-theme/duplicate
  tokens); browser record confirms all three fills vs the track.

  Depends on T-1 (guard exists) and T-3 (track it paints against).

- [x] **T-5 — Badge the level label to 4.5:1 in both themes**
  Covers: RF-3
  Files: bars-view row component styles, theme stylesheets / token layer
  Done when: the T-1 RF-3 guard passes unmodified in both themes and
  `tests/tokens.test.ts` is green; browser record confirms the badge in
  both themes and both locales.

  Depends on T-1 and T-3 (badge lives in the rebuilt row).

- [x] **T-6 — Monochrome icon by default, brand colour on the row's hover**
  Covers: RF-5, RF-7
  Files: `src/components/SkillBar.astro`, theme stylesheets / shared token
  layer, `tests/visual-language.test.ts`, `tests/markup.test.ts`
  Done when: `npm test` green with three guards over this mount — (1) the
  monochrome icon colour against `--card-background` at 3:1 or above in both
  themes, reading the colour the component binds; (2) a structural guard that
  the at-rest layer is the monochrome mount (a `.bar-logo::before` painting
  `background-color` + `mask` off the row's own logo and not dropping it), that
  the brand `<img>` is not painted at rest and is revealed only from a `:hover`
  scoped to the row with no `:focus`/`:focus-visible`/`tabindex`/script path to
  it, and that no `:hover` rule in the row paints a border, background or
  outline, or lifts; (3) the RF-7 guard: decorative empty `alt`, 22px declared
  on the `<img>`, a 22px box reserved by the wrapper, no surface painted there.
  Each of the three is shown red on an injected violation (an icon colour below
  3:1 in one theme; the `:hover` scope removed so the brand state becomes the
  default; the gold `border-color` put back in the hover rule; `alt` filled or
  the 22px reservation dropped) and reverted by explicit path. Browser record
  shows all ten icons monochrome with no plate in both themes, and one row with
  the pointer over it showing only that row's icon in its brand colours.

  Depends on T-3 (the row it paints into). Write the guards before the
  styles so they decide what the mount is. Mechanism as built on 2026-10-11,
  after the approved one was measured and discarded: the plan's `mask` on the
  element carrying the `<img>` **does not work** — a replaced element paints
  its content after its background, so with a `#ff00ff` background and an
  active mask all ten logos still render 100% in their brand colours and zero
  magenta, and the console stays quiet. The mount is therefore a
  pseudo-element: `.bar-logo::before`, absolutely positioned with `inset: 0`,
  painting `background-color: var(--icon-mono)` clipped by
  `mask: var(--logo) center / contain no-repeat`, with `--logo` the row's own
  logo URL as an inline custom property, so the asset's alpha does the shaping.
  The wrapper, not the `<img>`, holds the 22px slot. The brand `<img>` sits at
  `opacity: 0` by default; the row's hover sets the pseudo to `opacity: 0` and
  the `<img>` to `opacity: 1`. **No gold border**: the owner dropped it on
  2026-10-11 because it made a row that is not a control read as selected, so
  the hover changes the icon and nothing else — which is also what leaves the
  two existing hover guards in `tests/visual-language.test.ts` green untouched.
  Do not touch those guards. Write `-webkit-mask` alongside `mask`; nothing in
  this build adds prefixes. Do not animate the change, or if it is animated,
  disable it under `prefers-reduced-motion: reduce`.

  Show in both themes, wait for approval. T-7 may run alongside this one.

  **Superseded in part on 2026-10-15** by T-11 and T-12: the brand `<img>` and
  its opacity swap go; the pseudo-element mask, the 22px wrapper and the hover
  gate stay.

- [x] **T-7 — Verify the level-less default without touching data**
  Covers: RF-6
  Files: `tests/i18n.test.ts` (or the guard file the plan names)
  Done when: `npm test` green with a data check that the default level's
  label resolves through the same map the component reads in both
  locales, plus a browser record of an existing beginner row proving the
  default shape; the shipped data gains no entry.

  Mechanical, no visual change: may run alongside T-6.

- [x] **T-8 — File the full measurement record and close Done when**
  Covers: RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, RF-7
  Files: none (verification only)
  Done when: records filed for 1280px and 390px × light and dark —
  row order and widths proving the three columns fit at 390px; the
  beginner-row shape; the injected broken-icon URL at both widths; and
  for RF-5 **two states of the same row at both widths and both themes**,
  the default state with every icon monochrome on the card with nothing
  painted behind it, and the hovered state in which only that row's icon
  has its brand colours and no border, background or lift appears anywhere —
  captured with the pointer over the row,
  after the state settles, at a viewport set with `emulate` rather than
  `resize_page`. Then `npm test` plus `npm run build` are green with real
  output shown.

  Depends on T-1–T-7. Last task of the 2026-10-11 round.

## Change of 2026-10-15 — single-colour icons (RF-5 hover, RF-8)

- [x] **T-9 — Add the RF-8 guard, red first**
  Covers: RF-8
  Files: `tests/visual-language.test.ts`
  Done when: `npm test` shows the new guard red on today's data (no entry
  has an `icon`), and red again on each injected violation the plan lists
  for RF-8 once T-10 is in; it reuses `luminance` rather than a copy.

  Guard before data, so the data is written to pass it and not the reverse.

- [x] **T-10 — Record each tech's icon and brand colour, with the notice**
  Covers: RF-8
  Files: `src/data/tech.ts`, the local type in `src/components/TechGrid.astro`,
  `public/tech/mono/NOTICE.md`
  Done when: the T-9 guard passes unmodified; every entry has an `icon` under
  `/tech/mono/`, every brand carries its `#RRGGBB` and SSE none; `NOTICE.md`
  names all ten files with source, version and licence file; `npm test` green.

  Data only: nothing renders differently yet, because no component reads
  `icon` or `brand`. Depends on T-9.

- [x] **T-11 — Rewrite the RF-5 and RF-7 guards for the `<img>`-less row, red first**
  Covers: RF-5, RF-7
  Files: `tests/markup.test.ts`, `tests/visual-language.test.ts`
  Done when: the guards assert the mount in the plan's 2026-10-15 section and
  are red against today's `SkillBar.astro` (it still renders the `<img>` and
  never reads `--brand`); the contrast guard follows `currentColor` to the
  wrapper's `color`; the hover gate and "paints nothing" checks are kept, not
  loosened; the background-only-hover guard is untouched.

  Reads component source only, so it does not need T-10's data; it goes after
  T-10 so only one set of guards is red at a time.

- [x] **T-12 — Draw the row from the single-colour asset, brand colour on hover**
  Covers: RF-5, RF-7, RF-8
  Files: `src/components/SkillBar.astro`, `src/components/TechGrid.astro`
  Done when: the T-11 guards pass unmodified, `npm test` and `npm run build`
  green, every RF-5/RF-7/RF-8 probe the plan lists shown red then reverted by
  explicit path; `--logo` and `--brand` confirmed in `document.styleSheets`
  and on the element in the dev server; the row shown in both themes.

  Visual-work rule: show this component in both themes and **wait for
  approval** before T-13. Depends on T-11.

- [x] **T-13 — Re-validate the whole spec, NFRs and Edge cases included**
  Covers: RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, RF-7, RF-8
  Files: none (verification only)
  Done when: records at 1280px and 390px × light and dark, and both locales
  at 390px: the RF-1–RF-7 measurements of T-8 repeated; the four former blobs
  showing interior holes in the drawn mask; hover on a brand row and on SSE;
  the compact view unchanged; then every NFR and Edge case answered one by
  one with its evidence, and `npm test` plus `npm run build` with real output.

  Depends on T-12. Last task; the verdict here decides `implementada`.
