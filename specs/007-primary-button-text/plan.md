# Plan 007 — Primary button: light gold in dark, text colour per theme

**Spec:** `specs/007-primary-button-text/spec.md` (**approved**, 4 RF).
**Status:** approved
**Approved:** 2026-10-15 · owner approval; D-3 settled as var(--neutral-0) · 174 lines
**Approved:** 2026-10-15 · re-approval: aligned with spec 016's D-5 (colour maths in tests/helpers/colour.ts; no resolver cycle case here, injection 9 dropped) · 174 lines

**Ordering.** Spec 016 lands first: it moved the colour maths to
`tests/helpers/colour.ts` (016 D-5, `59eeb73`/`f00ddd2`), with `resolveColour(expr, ...layers)`
and `styleSources()`, and every vitest guard here is built on those two, not on a second
lookup. Before any code: the two prerequisites the spec lists — the `AGENTS.md`
amendment (own `docs:` commit) and the constitution 7 amendment that puts the e2e
suite in the pre-commit hook. RF-3, RF-4 and the light NFR are not checks until then.

## 1. Scope and coverage

This plan covers the four RF and every NFR.

| Requirement | Covered by |
|---|---|
| RF-1 text ≥ 4.5:1 on the fill, each theme | `--accent-surface-text` in both theme files; guard *button text contrast* (§7) |
| RF-2 dark fill lighter than its text | `dark.css`: fill `var(--brand-accent)`, text `var(--color-brand)`; guard *dark fill above ink* |
| RF-3 every consumer paints the text colour | the six `#fff` become `var(--accent-surface-text)`; unscoped `.btn--primary`; e2e *consumer ink* |
| RF-4 hovered primary ≥ 4.5:1 as composited | e2e *hover contrast* |
| NFR light unchanged except "Demo" | e2e *consumer ink*, light pass: fill `#7A5D10`, text white |
| NFR each theme declares the text colour | guard *per-theme declaration* |
| NFR no shared default for the fill | `00-tokens.css:24-28` deleted; guard *per-theme declaration* |
| NFR one hue, one value one name | guard *dark fill above ink* also asserts both dark values are `var()` aliases resolving to `--color-brand` and `--brand-accent` |
| NFR no stale count | the comment edits in §2; the retired guard takes its "three" with it |

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `AGENTS.md` | modify, prerequisite `docs:` commit | Replaces "`--accent-surface` stays dark in both themes" (line 308) with: the fill is a theme choice, the ink on it is `--accent-surface-text` per theme, settled by the guards below. |
| `public/styles/00-tokens.css` | modify | Loses the shared `--accent-surface` and its comment (24-28): no layer below the themes decides the fill. |
| `public/styles/themes/light.css` | modify | Decides the light ink: `--accent-surface-text: var(--neutral-0)` (white, D-3). Fill (54) unchanged. |
| `public/styles/themes/dark.css` | modify | Decides the dark pair: fill `var(--brand-accent)`, ink `var(--color-brand)`, 6.66:1; the 38-45 comment ("four places", "fill under hardcoded white") rewritten to the measurement. |
| `public/styles/03-components.css` | modify | Owns the primary look for every page: `.btn-action.primary` and its hover (81, 86) read the ink token; gains unscoped `.btn--primary` after `.btn:active`. |
| `src/pages/404.astro` | modify | Its scoped `.btn--primary` (54-58) goes; the shared rule now draws it. |
| `src/components/AboutSection.astro` | modify | `.btn-cv` and its hover (172, 183) read the ink token. |
| `src/components/ContactCard.astro` | modify | `.icon-btn:hover` (182) reads the ink token, so the transient label does too. |
| `tests/visual-language.test.ts` | modify | Retires "a surface that white text sits on…" (304-362); gains the three guards, importing from `tests/helpers/colour.ts` (016 already tests the resolver's two-hop, dead-end and cycle cases); the line-39 comment stops naming the retired check. |
| `e2e/helpers/dev-server.ts` | create | `startDevServer()`, moved out of `e2e/about.spec.ts` so two specs share one copy. |
| `e2e/about.spec.ts` | modify | Imports the helper; no behaviour change. |
| `e2e/primary-button.spec.ts` | create | Reads rendered colours of every consumer, at rest and hovered, in both themes. |

`src/pages/proyectos/[name].astro` is untouched: "Demo" (125) already carries
`btn btn--primary`; it starts rendering gold because the class becomes unscoped.

## 3. Pure logic

Nothing reads a clock. From `tests/helpers/colour.ts` (spec 016, D-5): `resolveColour`,
`luminance`, `contrast`, `styleSources`, imported by the vitest guards and by the e2e spec
alike; no new helper there. In the e2e spec, run in the page:

- `toHexColour(css: string): string` — `rgb()`/`rgba()` with alpha 1 to `#rrggbb`;
  throws on alpha < 1 (only opaque values are measurable).
- `composite(fg: string, bg: string, alpha: number): string` — `alpha·fg + (1−alpha)·bg`
  per channel, rounded; the colour an `opacity` element renders over its ground.
- `groundOf(el: Element): string` — the first ancestor whose computed
  `background-color` is opaque; throws if it reaches `html` without one.

## 4. Algorithm

**Layers** (016's): light `[light.css, 00-tokens.css]`; dark `[dark.css, light.css,
00-tokens.css]`, comments stripped. A dropped declaration the parser swallows is the
parse-whole guard's job (`tokens.test.ts`), not these.

**Guard *button text contrast* (RF-1).** Per theme: `ink = resolveColour('var(--accent-surface-text)', ...L)`,
`fill = resolveColour('var(--accent-surface)', ...L)`, each inside `try`; a throw is an
offender naming RF-1, the theme and the error — never a skip. `contrast(ink, fill) >= 4.5`.

**Guard *dark fill above ink* (RF-2, one hue).** Dark layers: `luminance(fill) >
luminance(ink)`. Then the declared values in `dark.css` match `^var\(--[\w-]+\)$`, and
the resolved hexes equal `resolveColour('var(--color-brand)')` and `…(--brand-accent)`.

**Guard *per-theme declaration* (NFRs).** `light.css` and `dark.css` each declare
`--accent-surface` and `--accent-surface-text` themselves; no other entry of
`styleSources()` declares either.

**Resolver.** No new case: 016's resolver cases already cover two-hop, dead-end and cycle.

**e2e *consumer ink* (RF-3, light NFR).** For each theme (`addInitScript` sets
`localStorage.theme`; `emulateMedia` the matching scheme), on `/`, the 404 and the
first project page (repos with a homepage sort first, `github.ts:80`):

```
want = computed color of a probe <span style="color: var(--accent-surface-text)">
fillHex = same probe on background-color: var(--accent-surface)
rest = every element whose computed background-color == fillHex   # discovery
assert rest ⊇ {.btn-cv, .btn-action.primary, 404 .btn--primary, Demo .btn--primary}
for el in rest: color == want
for .icon-btn: hover, settle, background == fillHex, color == want;
               click it, settle, the label (same element) color == want
light only: each primary computes fill #7a5d10 and color #ffffff
```

A missing page element (no "Demo" found) fails with the data dependency named.
**Settle** = re-read the computed values every 50 ms until two reads agree, 1 s cap.

**e2e *hover contrast* (RF-4).** For each primary in each theme: hover, settle; read
`opacity`, `background-color`, `color`, and `groundOf(el)`; `contrast(composite(color,
ground, o), composite(bg, ground, o)) >= 4.5`, `contrast` imported from the helper. "Demo" and the 404 hover by `.btn`'s lift
with opacity 1, so their check equals the rest ratio — still measured, not assumed.

## 5. Interface

| State | Light | Dark |
|---|---|---|
| Primary at rest (CV, "Ver todos", 404, "Demo") | white on `#7A5D10`, 6.18:1, unchanged | navy `#243972` on `#E3C770`, 6.66:1; was white on `#7A5D10` |
| Primary hovered, opacity 0.88 (CV, "Ver todos") | 4.75:1 over the sheet | 5.51:1 over the sheet |
| Primary hovered, `.btn` lift (404, "Demo") | rest colours, lift + shadow | rest colours, lift + shadow |
| "Demo" | was `#16202C` on navy, 1.49:1; now as the row above | was link ink on navy; now as above |
| Project with no demo | disabled span, unchanged | unchanged |
| Icon button hovered, and its 1.5 s label | white on `#7A5D10` | navy on `#E3C770`; border (`--accent-text`) equals the fill and vanishes, the fill on the card (5.90) marks hover |

## 6. Decisions

- **D-1 · Token name `--accent-surface-text`**, the spec's proposal. *Discarded:*
  `--on-accent` — a second naming scheme beside `--accent-text`/`--accent-surface`.
- **D-2 · Replace all six `#fff` one-for-one**, hovers included. *Discarded:* deleting
  the two hover copies as redundant — `.btn-action:hover` sets `--accent-text`, which
  in dark equals the new fill: 1.00:1 on "Ver todos" hovered.
- **D-3 · Light ink `var(--neutral-0)`**, the white step of the neutral scale.
  *Discarded:* a literal `#FFFFFF` — a second name for `--card-background`'s value,
  which AGENTS forbids and `tests/tokens.test.ts:219` fails; aliasing
  `--card-background` directly, which names a surface as ink. Cost accepted: the
  scale step is also the card ground. Dark overrides the ink, so its own `--neutral-0`
  (`var(--bg)`) is never read here. Owner decision, 2026-10-15.
- **D-4 · Unscoped `.btn--primary` in `03-components.css`**, after `.btn` (same
  specificity, so order decides). *Discarded:* a second scoped copy in `[name].astro`,
  the drift the file's header comment records for `.btn-action`.
- **D-5 · Vitest guards on 016's resolver and `styleSources()`.** *Discarded:* porting
  the retired guard's one-hop lookup, the second copy 016's D-3 rejected.
- **D-6 · RF-3 discovers consumers by computed fill, and asserts the known four are
  found.** *Discarded:* a hardcoded selector list only — a future primary button would
  pass unseen; discovery alone could pass on an empty page.
- **D-7 · Settle by polling.** *Discarded:* `reducedMotion: 'reduce'` — the
  reduced-motion block (`00-tokens.css:125`) does not list `.btn-cv` or `.icon-btn`.
- **D-8 · Extract `startDevServer`.** *Discarded:* copying it into the new spec (AGENTS
  DRY); folding the tests into `about.spec.ts`, whose subject is another section.

## 7. Test strategy

Runners from `package.json`: `npm test` (`vitest --run tests`) for the three data
guards; `npm run test:e2e` (`playwright test`, `@playwright/test` installed, config
`playwright.config.ts`, 1280×720 Chromium) for RF-3/RF-4 — rendered output, because a
computed colour after the cascade is what RF-3 is about (constitution 8). Written
first against today's code: *button text contrast* and *per-theme declaration* red
(no token; shared default present), e2e *consumer ink* red in dark and on "Demo".

Injections, each restored byte-identical by explicit path, the commit naming them:

| # | Injection | Expected red |
|---|---|---|
| 1 | dark ink `#FFFFFF` | text contrast (1.66), dark fill above ink |
| 2 | dark fill back to `#7A5D10` | text contrast (navy on it) |
| 3 | dark fill `var(--brand-gold)` (undeclared) | text contrast, fails not skips |
| 4 | dark ink and fill swapped | dark fill above ink only (6.66 still passes RF-1) |
| 5 | dark ink a literal `#243972` | dark fill above ink (alias rule) |
| 6 | `--accent-surface: #E3C770` back in `00-tokens.css` | per-theme declaration |
| 7 | `--accent-surface-text` in `src/styles/global.css` | per-theme declaration |
| 8 | `--accent-surface-text` deleted from `dark.css` | per-theme declaration only (dark falls to `#16233F`, 9.41) |
| 9 | (dropped: 016's resolver cases cover the cycle) | — |
| 10 | `.btn-cv` `color: #fff` restored | consumer ink, dark |
| 11 | `.icon-btn:hover` `color: #fff` restored (hover-only) | consumer ink, dark, hovered and label |
| 12 | `.btn-action.primary:hover` colour deleted | consumer ink, hover contrast (1.00 dark) |
| 13 | unscoped `.btn--primary` deleted | consumer ink: "Demo" not found as a consumer, light fill `#243972` |
| 14 | `.btn-cv:hover` opacity 0.6 | hover contrast, light |
| 15 | `.btn-social` given the accent fill | consumer ink: discovered, its ink differs |

Then `npm run build`, and the *Done when* walk: every consumer at rest and hovered,
both themes, 1280 and 390, on `/`, a project page and the 404.
