# Plan 009 — Glows and soft gradients in the dark theme

**Spec:** `specs/009-dark-glows/spec.md` (**approved**, 8 RF).
**Status:** approved
**Approved:** 2026-10-15 · owner approval; colour maths in tests/helpers/colour.ts (016 D-5 changed to match) · 197 lines
**Approved:** 2026-10-15 · re-approval: ordering, file table and T-3 aligned with what 016, 007, 008 and 017 landed · 197 lines

**Ordering.** Specs 016, 007, 008 and 017 have landed. 016 put `resolveColour(expr,
...layers)`, `styleSources()`, `luminance` and `contrast` in `tests/helpers/colour.ts`; 007
created `e2e/helpers/dev-server.ts` (it resolves with its own server's URL); 008 put
`openIn`, `installHelpers` (in-page `__toHex`, `__ground`), `settled` and `composite` in
`e2e/helpers/rendered.ts`; 017 landed `--control-border` (#848F9F / #7D93C2). Before any code, the spec's prerequisites: the "dark theme is one hue"
amendment (`AGENTS.md:305-307`, own `docs:` commit) and the constitution 7 amendment that
puts `npm run test:e2e` in `.husky/pre-commit`. No value from 017 is written here: RF-6
reads whatever border colour renders.

## 1. Scope and coverage

| Requirement | Covered by |
|---|---|
| RF-1 glow on every glow surface, nowhere else | two dark-scoped rules in `dark.css` (§4); e2e *glow placement* |
| RF-2 light unchanged | no light rule touched; e2e *light baseline* |
| RF-3 no glow under forced colours | `@media (forced-colors: active)` reset; e2e *forced colours* |
| RF-4 ramp colours, gold in the hero only | `color-mix()` of ramp tokens and `--brand-accent`; e2e *glow palette*; guard *glow interpolation* |
| RF-5 / RF-6 text, icons, control borders, focus rings at the worst point | e2e *worst point* |
| RF-7 composites between chip and card | e2e *ramp bound*; guard *ramp order* |
| RF-8 glow unchanged on interaction | e2e *glow at rest* |
| NFR gradients only, no new element, locales | e2e *glow placement* (`url(`, filters, `fixed`, pseudo-elements, `es` = `en`) |
| NFR static; theme flip | e2e *glow at rest*; `00-tokens.css:107-123` untouched |
| NFR no new request, file or dependency | two CSS rules in an existing file; `devDependencies` unchanged |

Every RF is covered. No guard retires: the both-themes token guard (`tokens.test.ts:190`)
and the hover guards stay as they are.

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `AGENTS.md` | modify, prerequisite `docs:` commit | Amends "the dark theme is one hue": a glow is a gradient of navy steps, gold in the hero only, on a home section, held by RF-5–7; names `e2e/dark-glows.spec.ts`. |
| `public/styles/themes/dark.css` | modify | Decides where a glow paints and how bright it may be: hero rule, section rule, forced-colours reset, appended after line 117. |
| `src/components/AboutSection.astro` | modify | Line 28 gains `section--hero`: the hero is named by what it is, not by its id or position. |
| `tests/helpers/colour.ts` | modify | Already the one copy of the colour maths (016); gains §3. |
| `tests/visual-language.test.ts` | modify | Imports them; keeps 008's WCAG reference case; gains *ramp order*, *glow interpolation*, the §3 cases. |
| `e2e/helpers/rendered.ts` | modify | `composite` and the in-page `__ground` already live here (008); `__ground` becomes `groundOf(el, isGlow)`, which stops at a glow surface. |
| `e2e/dark-glows.spec.ts` | create | The rendered checks in §4. |

`light.css`, `00-tokens.css` and `04-layouts.css` are untouched; no token is added (D-2).

## 3. Pure logic

Nothing reads a clock. In `tests/helpers/colour.ts`, Node-side, fed computed strings:

- `parseColour(css: string): Rgba` — `rgb()`, `rgba()`, `color(srgb r g b / a)` to
  `{ r, g, b, a }` (0–255 floats); throws on anything else, so an `oklch()` stop fails loudly.
- `parseGradients(image: string): { srgb: boolean; stops: Rgba[] }[]` — `srgb` is true when
  `in srgb` is present or every stop is a legacy `rgb()`/`rgba()`. Throws on `url(`; `none` → `[]`.
- `composites(g, sheet: Rgba, steps = 64): Rgba[]` — each stop over the opaque sheet, every
  segment between neighbours sampled at `steps`. Premultiplied interpolation over an opaque
  ground is linear in the composites, so the samples are the gradient.
- `worstPoint(colour: Rgba, samples: Rgba[]): number` — the lowest `contrast()` over them.
- `onRamp(c: Rgba, allowed: Rgba[], tol = 1): boolean` — `a === 0`, or `c`'s RGB within `tol`
  per channel of a segment between two allowed colours (one colour is a segment).
- `floorFor(px: number, weight: number): 3 | 4.5` — 3 at ≥ 24px, or ≥ 18.66px at ≥ 700.

## 4. Algorithm

**The rules**, appended to `dark.css` (values are the proposal, D-4):

```
:root[data-theme="dark"] main > .section {
  background-image: radial-gradient(ellipse closest-side at 20% 40% in srgb,
    color-mix(in srgb, var(--neutral-100) 50%, var(--main-bg)), var(--main-bg)) }
:root[data-theme="dark"] main > .section--hero {
  background-image: radial-gradient(ellipse closest-side at 50% 35% in srgb,
    color-mix(in srgb, var(--brand-accent) 5%, var(--main-bg)), var(--main-bg)) }
@media (forced-colors: active) { :root[data-theme="dark"] main > .section { background-image: none } }
```

`main > .section` matches the six home sections, children of `main` (`BaseLayout.astro:90-96`,
`Resume.astro:45-57`). On `/proyectos` the projects section sits inside `section.wrap`
(`proyectos/index.astro:70`, `95`); the 404 (`404.astro:10`) and a project page
(`[name].astro:57`) carry no `.section`. `closest-side` ends each glow at the sheet on every
edge, so no seam meets the next section. A comment of at most five lines says why `in srgb`.

**In the page.** Dark set before load (007's setup). Sheet = `main`'s computed
`background-color`; ramp = probes painting `var(--bg | --neutral-50 | --main-bg |
--neutral-100 | --neutral-200)` and gold `var(--brand-accent)`, read and removed; surfaces =
`main > section.section`, at least six, the hero `.section--hero`. **`groundOf(el, isGlow)`**:
the first ancestor with an opaque `background-color` is a flat ground; a surface reached
first is its glow; `opacity < 1` on the way to a glow throws "not measurable", never a skip.

- *glow placement* (RF-1, NFRs): `/` at 390, 800, 1280, `es` and `en`. Each surface holds a
  gradient, no `url(`, `filter`/`backdrop-filter` `none`, no `fixed` attachment; `es` equals
  `en`. `body`, `main`, every `.card`, every nested section and every `::before`/`::after` in a
  surface hold none. `/proyectos`, its first project page (data dependency named on failure)
  and `/no-such-page`: no element holds one.
- *light baseline* (RF-2): light, the four routes, three widths; each `section`'s
  `background-image` and `background-color`, keyed by route, width and `id || class` + index,
  equal a constant recorded from today's code before the CSS changes, dated as `about.spec.ts`
  dates `HOME_HOSTS`. The CSS predicts `none` and transparent; the constant is the recording.
- *forced colours* (RF-3): `emulateMedia({ forcedColors: 'active' })`, dark; every surface
  computes `none`. Whether Chromium drops gradients there unaided is recorded in the commit.
- *glow palette* (RF-4): each gradient is `srgb`; each stop `onRamp` of the ramp, gold added
  for the hero only.
- *worst point* (RF-5, RF-6): per surface, `samples = composites(...)`. At rest, then with each
  focusable hovered: visible text nodes whose ground is this glow (`color`, `floorFor`); `svg`
  and masked icons on it (`color`, 3); bordered elements on it that are focusable or
  `role="group"` (border colours, 3). Then Tab through the page: each active element inside the
  surface gives its `outline-color`, 3, measured on the glow even where the ring falls on a card
  (conservative). `worstPoint >= floor`, the message naming RF, surface, element, colour and
  ratio. `.btn-social`, `.view-toggle` and the show-more toggle must be found; the list view is
  switched on so the skill chips are measured too.
- *ramp bound* (RF-7): every sample has `luminance(neutral-50) <= L <= luminance(neutral-100)`.
- *glow at rest* (RF-8, static): each surface's `background-image` at rest; hover the surface,
  hover, focus and `mouse.down` each descendant control (released off it, so nothing navigates),
  `settle`, re-read: equal. Then flip the theme twice, poll until no `background-color`
  transition runs (50 ms, 1 s cap): no running animation on a surface, `animation-name: none`,
  and no `background-image`, `-position`, `-size`, `background` or `all` in `transition-property`.

**Guard *ramp order*** (vitest): 016's dark layers `[dark.css, light.css, 00-tokens.css]`,
`resolveColour` of the five ramp tokens; luminance rises strictly `--bg`, `--neutral-50`,
`--main-bg`, `--neutral-100`, `--neutral-200`, or RF-7's bound means nothing.
**Guard *glow interpolation*** (vitest): every `*-gradient(` in a `[data-theme="dark"]` rule of
`styleSources()` declares `in srgb`.

## 5. Interface

Ratios at the brightest composite of the proposed values.

| State | Light | Dark |
|---|---|---|
| Hero at rest | unchanged, flat sheet | gold 5% at its centre (`#2E4072`), fading to the sheet at every edge; L 0.0546, card 0.0574 |
| Hero text on the glow | unchanged | secondary 4.90 (5.39 flat), primary 9.35, gold 6.06 |
| Other home sections | unchanged | card step 50% at 20%/40%; secondary 5.08, gold 6.27, primary 9.69 |
| Control border, focus ring on a glow | unchanged | 017's colour, measured; ring `#F5F7FA` ≥ 9.35 |
| Cards, primary button, chips; hover, focus | unchanged | flat and opaque, measured on their fill; glow identical, borders turn gold as today |
| Theme flip / forced colours | unchanged / system colours | glow at once, colour fades 180ms / no glow |
| `/proyectos`, project page, 404 | unchanged | flat sheet |
| GitHub fetch failed | unchanged | projects section keeps its glow; the alert is measured on it |

## 6. Decisions

- **D-1 · `main > .section` plus a `section--hero` class.** *Discarded:* `.section`, which
  paints the nested projects section on `/proyectos`; `#About`, styling an anchor id;
  `:first-of-type`, which a reordered home silently re-targets.
- **D-2 · No glow token: dark-scoped rules over existing tokens.** *Discarded:* `--glow-*` in
  `dark.css` only, red on the both-themes guard; declared in both with a light `none`, a token
  that exists to satisfy a guard.
- **D-3 · `in srgb` on each gradient and each `color-mix()`.** *Discarded:* the default, which
  is Oklab once a stop is a `color-mix()` result (not a legacy colour), so RF-4's segment test
  would misread every in-between colour.
- **D-4 · Hero 5% gold, sections 50% of the card step, `closest-side`.** *Discarded:* 6% gold,
  L 0.0567 against the card's 0.0574, inside RF-7's rounding; linear gradients from each top, a
  seam against the previous section's sheet-coloured bottom.
- **D-5 · Colour maths in `tests/helpers/colour.ts`.** *Discarded:* a copy in the e2e spec (a
  second formula, AGENTS DRY); `og-cover.ts`'s `contrastRatio`, rejected by 008's D-10.
- **D-6 · RF-6 discovers control borders in the render.** *Discarded:* 017's controls or colour
  written here — the colour is undecided and a list goes stale.
- **D-7 · 64 samples per segment.** *Discarded:* stop colours only — a segment's luminance is
  convex, so its minimum (RF-7's lower bound) can sit between stops.
- **D-8 · An explicit forced-colours reset.** *Discarded:* relying on Chromium — another engine
  may keep the gradient, and RF-3 stands either way.

## 7. Test strategy

Runners from `package.json`: `npm test` (`vitest --run tests`) for the two data guards and the
helper cases; `npm run test:e2e` (`playwright test`, `@playwright/test` installed, Chromium) for
the rest — computed backgrounds, colours and rings are what those RFs are about (constitution
8). *Glow interpolation* reads source because Chromium may omit a default method when it
serialises. Red first against today: *glow placement*; RF-2, 3, 5–8 pass vacuously until the
rules land, so each is proven by injection. Helper cases: `parseColour` of `color(srgb … /
.05)`, `onRamp` rejecting `#7C3AED`, `composites` of a two-stop fixture.

Each injection restored byte-identical by explicit path, the commit naming them:

| # | Injection | Expected red |
|---|---|---|
| 1 | section rule deleted | glow placement |
| 2 | the glow on `:root[data-theme="dark"] .card` | glow placement |
| 3 | `.section` instead of `main > .section` | glow placement, `/proyectos` |
| 4 | the glow moved to `.section::before` | glow placement (pseudo-element) |
| 5 | `url(/og-cover.png)` layered on the hero | glow placement, `parseGradients` |
| 6 | the rules unscoped from `[data-theme="dark"]` | light baseline |
| 7 | forced-colours reset deleted | forced colours, if Chromium keeps the gradient; else recorded |
| 8 | section stop mixed with `#7C3AED` | glow palette |
| 9 | gold 5% in the section rule | glow palette (gold outside the hero) |
| 10 | `in oklch` on the hero gradient | glow palette, glow interpolation |
| 11 | hero gold 10% | worst point (secondary 4.45), ramp bound |
| 12 | section stop `var(--neutral-200)` alone | worst point (secondary 3.49), ramp bound |
| 13 | section stop `var(--bg)` alone | ramp bound (below the chip step) |
| 14 | `.section:focus-within` swaps the glow | glow at rest |
| 15 | `transition: background-position 2s` on the section | glow at rest |
| 16 | `--neutral-50` and `--neutral-100` swapped in `dark.css` | ramp order |
| 17 | `luminance()` without the sRGB transfer | 008's reference case, through the moved helper |

Then `npm run build`, and the *Done when* walk: `/`, `/proyectos`, one project page and the 404,
both themes at 390, 800 and 1280px after transitions settle, `document.styleSheets` checked for
the new rules first; the owner approves the dark result before the commit.
