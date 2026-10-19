# Plan 048 — Touch targets a finger can hit

**Spec:** `specs/048-touch-targets/spec.md` (4 RF).
**Status:** approved
**Approved:** 2026-10-18 · owner approval · 175 lines
**Changed:** 2026-10-18 · as implemented: breadcrumb links 44px tall with a 44px-wide invisible ::before, offsets and gaps unchanged (owner), with its check and injection 13; li out of the exempt rule; samples 1px in and cell-centred, holdsSquare tolerates 4%; SectionTitle by padding-block; injections 5 and 9 corrected; PENDING never reached history · 185 lines

Every change is a `@media (pointer: coarse)` block beside the rule it overrides; nothing outside
those blocks moves, which is what RF-3 holds. Spec 045 is measured at these sizes (its context
and RF-5 quote 048's 44 px open control and 71.9 / 61.2 px copy control), so **048 lands first**
and 045's plan reads the boxes this one ships.

## 1. Scope and coverage

| RF / NFR / edge | Covered by |
|---|---|
| RF-1 (44 × 44 target, coarse) | One coarse block per offending component (block 2), at 44px. Measured by a hit-test grid, not by `getBoundingClientRect` (block 4). |
| RF-2 (no overlap) | Same grid: no sample inside one control's drawn box resolves to another control (block 4). Nothing grows by negative margin or a pseudo-element past its own box, except the select's 1px (D-4) and the breadcrumb links' invisible `::before` (D-5). |
| RF-3 (fine pointer unchanged) | All changes inside `@media (pointer: coarse)`; the fine pass at 1280×800 compares every table row with the spec's numbers, within 1px. |
| RF-4 (header pair same height) | `LanguageSwitcher.astro` and `ThemeSwitch.astro` each carry the literal `block-size: 44px` in their own coarse block, beside today's `30px` (AGENTS: two controls, no `--control-h`). Rendered heights compared in both passes. |
| NFR both themes, both locales | Each route's coarse pass runs in light, dark, `es` and `en`. |
| NFR hover, focus ring | No coarse block touches `border-color`, `outline` or `:hover`; the existing guards (`tests/visual-language.test.ts`, `e2e/control-borders.spec.ts`) keep settling them. |
| NFR radius by size class | A 44px control is a button: it keeps `--radius-md`, as at 30–42px. The guard reads each control's computed `border-radius` in both passes and requires them equal. |
| NFR label swap (spec 018) | The copy button's stacked cell is untouched; only `block-size` / `min-inline-size` change. Coarse check: its box is identical at rest, copied and failed. |
| Edge: tablet 1280 coarse | Same media query, no width condition; read on the dev server (block 7, visual). |
| Edge: touchscreen laptop, fine primary | `pointer` reads the primary pointer, so the fine pass is that case. |
| Edge: breadcrumb text stays small | The link grows to 44px tall with `min-block-size`, and to 44px wide through an invisible `::before`; its `font-size` and the row's offsets, widths and gaps are compared across passes. |
| Edge: contact controls | 048 only sizes them (T-6); 045 RF-5 keeps them on the card's one row, measured at these sizes (spec edge case, changed 2026-10-18). |
| Edge: filter chips, "Ver todos" | In the pass by construction (every visible `a`); fixed in T-8 and T-2. |
| Edge: hidden control | Skipped by `checkVisibility({ visibilityProperty: true, opacityProperty: true })` and a zero-area box (the honeypot input is `visibility: hidden`; the list panel is `display: none` until tapped). |
| Edge: language control, tap on the select | The hit predicate for a `select` accepts only the `select` itself, never its wrapping label (block 4). |

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `e2e/helpers/targets.ts` | create | Pure geometry over a sampled hit grid: a control's target box, whether it holds a 44px square, and which samples of a drawn box resolve elsewhere (block 3). |
| `tests/touch-targets.test.ts` | create | Unit cases for that geometry, so the guard's arithmetic is proven apart from any page. |
| `e2e/touch-targets.spec.ts` | create | Collects candidates and the hit grid in the page, applies the helpers; RF-1 to RF-4 and the NFR checks, per route, pointer, theme and locale. Carries `PENDING` while components land (D-6). |
| `public/styles/03-components.css` | modify | Coarse `.btn` and `.btn-action`: `min-block-size` / `min-inline-size: 44px`; `.btn` centres its label (`inline-flex`) on coarse only. Reaches the project page's back, Código, Demo and disabled demo, the contact submit, the 404 button, "Ver todos" and the cards' Código / Demo. |
| `src/components/LanguageSwitcher.astro` | modify | Coarse: wrapper `block-size: 44px`; the `select` stretches to the wrapper's border box and is at least 44px wide, so the tap lands on the select. |
| `src/components/ThemeSwitch.astro` | modify | Coarse: `block-size: 44px; inline-size: 44px`. |
| `public/styles/00-tokens.css` | modify | Coarse `--topbar-block: calc(44px + 2 * 0.75rem)`: the controls' height plus the topbar's padding, as `3.375rem` is `30px` plus the same. The hero band reads it (`HeroBackground.astro:32`). |
| `src/components/BreadCrumbs.astro` | modify | Coarse `.crumbs a`: `inline-flex`, `min-block-size: 44px`, vertically centred, text placed as with a fine pointer; the 44px width comes from an invisible `::before` (absolute, `inset-block: 0`, centred, `min-inline-size: 44px`, `inline-size: 100%`); font size and the row's horizontal offsets and gaps unchanged. The owner asked for left-aligned text and equal gaps, and a visible 44 × 44 box did not fit: 28px were free between the topbar and the next sibling. |
| `src/components/SkillViewToggle.astro` | modify | Coarse `.toggle-btn` 44 × 44. `.toggle-indicator`'s inset becomes `calc(50% - 0.5rem)` (half the icon), replacing `calc((2rem - 1rem) / 2)`, which hardcodes the 2rem button. |
| `src/components/ContactCard.astro` | modify | Coarse `.icon-btn`: `block-size` and `min-inline-size: 44px`. Coarse `.contact-value`: `padding-block: calc((44px - 1lh) / 2)`, keeping its ellipsis (visible at 390 until 045 hides it). |
| `src/components/AboutSection.astro` | modify | Coarse `.btn-cv`, `.btn-social`: `block-size: 44px` (today `2.5rem` = 40px). |
| `src/components/ProjectFilters.astro` | modify | Coarse `.project-filter`: `block-size: 44px`. |
| `src/components/ProjectCard.astro`, `ExperienceSection.astro`, `SkillChip.astro` | modify | Coarse block on the card's name link, the CV link and the skill chip: `inline-flex`, centred, `min-block-size` / `min-inline-size: 44px`. Text unchanged. |
| `src/components/SectionTitle.astro` | modify | Coarse block on the projects heading link: `padding-block` up to 44px, not `inline-flex`, whose whitespace text nodes would shift the heading. Text unchanged. |

The audit (T-1) may name an offender outside this list; that stops the work for a plan change,
not a silent extra file.

## 3. Pure logic

Nothing reads the clock. The page returns raw samples; Node decides. Samples are cell-centred,
starting 1px in from each control's edge, so none lands on a border shared with a neighbour.

```ts
/** One sampled point: its viewport position and the index of the candidate it resolves to, or -1. */
interface Sample { x: number; y: number; owner: number }

/** The bounding box of the samples owned by `index`, or null when it owns none. */
targetBox(samples: Sample[], index: number): { x: number; y: number; w: number; h: number } | null

/** True when the `side`-px square centred on `box` is owned by `index`, allowing 4% of its samples
 *  to resolve elsewhere (rounded corners: 2.8% measured). */
holdsSquare(samples: Sample[], index: number, box: Box, side: number): boolean

/** Owners other than `index` (and other than -1) found inside `drawn`, deduplicated. */
intruders(samples: Sample[], index: number, drawn: Box): number[]
```

## 4. Algorithm

```ts
// In the page, per route/pointer/theme/locale, after finite animations finish
// (getAnimations().filter(iterations !== Infinity).map(a => a.finished)):
candidates = [...querySelectorAll('a[href], button, select, input, textarea, summary')]
  .filter(visible && area > 0 && !exempt)
exempt(el) = el.closest('.readme-body')                      // the README's HTML
          || (el is <a> && (b = el.closest('p, dd, td, blockquote, figcaption'))  // no li: the contact controls sit in one
              && b.textContent.trim() !== el.textContent.trim())  // a link inside a sentence
owner(hit) = index of the candidate c where:
  c is <select>            → hit === c                       // spec edge case: the select itself
  c is <input>/<textarea>  → c.contains(hit) || hit.closest('label') === c.closest('label') != null
  otherwise                → c.contains(hit)
  else -1
for each candidate i:
  c.scrollIntoView({ block: 'center', behavior: 'instant' }); await a frame
  drawn = c.getBoundingClientRect()
  region = drawn inflated by 22px each side, clipped to the viewport
  samples_i = a 2px grid of cell centres, 1px in from each edge: { x, y, owner(elementFromPoint(x, y)) }
  return { name: selector path + text, drawn, samples_i }
// In Node:
RF-1: box = targetBox(samples_i, i); box.w >= 44 && box.h >= 44 && holdsSquare(samples_i, i, box, 44)
RF-2: intruders(samples_i, i, drawn) is empty
```

`owner` for an input counts its wrapping label because a tap there focuses the input, and focus is
an input's activation; a `select` focused from its label does not open (spec edge case). Every
`/` pass runs twice: as loaded and after a tap on the list button, so the skill chips are measured.

## 5. Interface

Fine pointer: nothing changes, in either theme. Coarse pointer, both themes alike (no colour
changes): the topbar is 68px with two 44px controls; the breadcrumb row, the button rows, the
filter chips, the toggle and the contact controls are 44px tall; text sizes are unchanged, so a
grown link reads as the same text with more room around it. The list view of the skills, the
project page without a demo (disabled span, also 44px by the shared `.btn` rule) and the project
page without a repository (back button only) take the same sizes. No empty state is new.

## 6. Decisions

- **D-1 · `@media (pointer: coarse)` beside each base rule.** *Discarded:* `any-pointer: coarse`,
  which a touchscreen laptop matches and would break RF-3's edge case.
- **D-2 · `44px` as a literal in each file.** *Discarded:* a `--touch-target` token; AGENTS keeps
  `--control-h` out for two controls, and these are per-component overrides, not a shared
  dimension. The literal repeats in the topbar token; that duplicate is named in its comment.
- **D-3 · One coarse rule for `.btn` and `.btn-action` in `03-components.css`.** *Discarded:*
  per-component copies in `[name].astro`, `ContactForm.astro`, `ProjectCard.astro` and
  `ProjectsSection.astro`, which would drift (AGENTS DRY). The scoped `.back-btn` and
  `.contact-form__submit` already set `inline-flex`; computed values are re-read on each consumer.
- **D-4 · The select overlays the wrapper's 1px border** (`block-size: calc(100% + 2px);
  margin-block: -1px`). *Discarded:* a 46px wrapper and theme button, which makes RF-4's pair
  2px taller than every other 44px control for a border's sake; and an absolutely positioned
  select over the whole wrapper, which moves its visible text.
- **D-5 · Grow the box, not the hit area.** *Discarded:* an invisible `::before` larger than the
  control, which keeps layouts unchanged but is exactly how a target swallows a neighbour (RF-2);
  the spec lets the layout grow on touch. One exception, the breadcrumb links (owner, 2026-10-18):
  their row keeps the fine pointer's offsets and gaps, and a centred `::before` gives them the 44px
  width, since a visible 44 × 44 box did not fit in the 28px free there; RF-2 still measures them.
- **D-6 · A shrinking `PENDING` set in the guard, in the working tree only.** The pre-commit hook
  runs the e2e suite on the working tree, so a red guard blocks every per-component commit.
  `PENDING` listed the offenders T-1 found and measured each component while it landed; each task
  deleted its entries and T-10 deleted the set. The guard itself was committed last, after the nine
  component commits, so `PENDING` never reached history. *Discarded:* no guard until the end, which
  leaves components fixed with nothing measuring them. An explicit, owner-approved exception
  (2026-10-18) to AGENTS' "never relax what a guard accepts".
- **D-7 · The two header controls ship in one commit** (owner, 2026-10-18). RF-4 makes either alone
  red. *Discarded:*
  one per commit, which the hook cannot pass.
- **D-8 · Hit-test grid at 2px.** *Discarded:* `getBoundingClientRect`, which reports the
  language wrapper (44px) where the select is the target, and 1px, which quadruples the run for
  no verdict a 2px step misses at a 44px threshold.

## 7. Test strategy

Runners from `package.json`: `npm test` (`vitest --run tests`) and `npm run test:e2e` (Playwright,
installed Chrome, server on 4329). Coarse pass: `browser.newContext({ viewport: { width: 390,
height: 844 }, isMobile: true, hasTouch: true })`, asserting `matchMedia('(pointer: coarse)')`
true; fine pass: 1280×800, asserting it false. Routes: `/`, `/proyectos`, `/proyectos/Portfolio`
(the page `readme-images.spec.ts` already uses), each in both themes via `openIn` and both locales
via `?lang=`.

- **Data:** `tests/touch-targets.test.ts` over `targetBox`, `holdsSquare`, `intruders`: a full
  44px square, a 44 × 42 strip, an L shape whose box is 44px but whose square is not filled, an
  owner absent, a drawn box with one foreign sample.
- **Rendered:** RF-1 and RF-2 per block 4; RF-3 the spec table at 1280 fine, within 1px (copy
  width per locale); RF-4 header heights equal in both passes; the breadcrumb row's offsets, widths and gaps on coarse
  equal the fine pointer's within 1px; radius equal across passes per
  control; breadcrumb `font-size` equal across passes; copy button box equal at rest, copied and
  failed on coarse; the candidate list includes the theme button, the language select and a
  breadcrumb link, so the filter cannot drop everything.
- **Injections:**
  1. A `holdsSquare` that only checks `box` → the L-shape unit case red.
  2. Delete the coarse `.btn` rule → RF-1 red on the project page's actions, back and submit.
  3. Drop D-4's stretch on the select → RF-1 red on the select while the wrapper is 44px.
  4. Let the `select` predicate accept its label → injection 3 goes green, proving the
     predicate is what bites; restore.
  5. `::before { position: absolute; inset: -24px }` on the coarse theme button → RF-2 red on the
     language select (-14px did not reach it).
  6. Theme button coarse `block-size: 46px` → RF-4 red.
  7. Remove one coarse block's media query (theme button at 44px always) → RF-3 red.
  8. `exempt()` returns true → the named-candidates assertion red.
  9. Coarse breadcrumb `font-size: 1.5rem` → the font check red (`--fs-md` is undefined, so the
     old injection was a no-op).
  10. `display: none` for the copy button's inactive labels → the label-swap check red.
  11. `--radius-pill` on the coarse theme button → the radius check red.
  12. Delete one `PENDING` entry before its fix → RF-1 red for that control.
  13. Drop the breadcrumb links' coarse `::before` → RF-1 red on every breadcrumb link.
- **Visual:** the spec's *Done when*, on the dev server with a coarse pointer at 390 px and a fine
  one at 1280 px, light and dark, plus the 1280 coarse tablet case; confirm the edited sheet is
  in `document.styleSheets` and restart the dev server after `public/styles` edits (Memory).
