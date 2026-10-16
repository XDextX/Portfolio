# Spec 009 — Glows and soft gradients in the dark theme

**Status:** implemented
**Size:** M
**Approved:** 2026-10-15 · five clarify rounds, no blocker left; owner decisions: hero + home sections glow, cards flat, control borders held at 3:1 with spec 017 first, RF-7 as soft, gold only in the hero · 202 lines, 8 RF
**Implemented:** 2026-10-15 · commits `f63f5c8` (docs) and `89c51db` (feat) · 8/8 tasks, `npm test` 178/178, e2e 26/26, build green · 8/8 RF and NFRs validated; 16 injections red, 2 replaced by 2b, 7 recorded (Chromium drops gradients under forced colours unaided); seen in dark and light

## Context and goal

The owner's dark mockup puts a soft glow behind the hero and soft gradients on the
sections; today's dark theme is flat navy steps with no gradient anywhere. The owner
adopted the glows on 2026-10-15. This spec makes the dark theme show them inside the
amended "dark theme is one hue" rule — navy steps plus the gold, no new hue, never
below a contrast floor — and leaves the light theme as it is.

The dark theme has little headroom, so "soft" is a contrast question first. Flat,
today, on the sheet: secondary text 5.39:1, gold text 6.66, primary text 10.28, and
the soft-fill border 1.54 — under 3:1, which spec 017 fixes first. Any lightening
lowers all four; darkening raises them.

## Prerequisites

- The `AGENTS.md` amendment to "the dark theme is one hue", stating what a glow may
  be and naming the test that settles it, in its own `docs:` commit.
- Constitution 7 amended so the Playwright e2e suite is policy, with
  `.husky/pre-commit` running it after `npm test`. RF-1 to RF-6 and RF-8 are
  rendered checks and live there.
- Spec 016 implemented: RF-6 measures the focus ring in its dark colour, the dark
  text colour (`#F5F7FA`).
- Spec 017 implemented: control borders at 3:1 or more in both themes. Until then
  every control border sits under 3:1 flat and RF-6 admits no glow at all.

## Definitions

- **Glow:** a CSS gradient painted on a glow surface in the dark theme. The colours
  between its stops are part of it.
- **Glow surface:** the hero (the About section) and each of the home page's other
  top-level sections (the ones spec 008's title treatment heads). A `<section>` on another
  route, or nested inside another, is not one, so glows never stack. Sections carry
  no background today and sit on the sheet, so a glow's flat colour is the sheet.
- **Navy ramp:** the steps dark surfaces use, deepest first: the ground behind the
  sheet, the chip surface, the sheet, the card, the soft fill/border. The lighter
  brand navy (`#4B69B7`) shares the hue but is lighter than every step and fills no
  surface, so it is not on the ramp. **Gold:** the brand accent.
- **Control border:** a border that marks a control's edge, as spec 017 defines it
  (today the view toggle and the hero's social buttons, among others).
- **Worst point:** for a colour drawn on a glow surface, the lowest contrast it
  reaches against any composite of the glow (each colour of the gradient over the
  sheet). Taken over the whole gradient, not where the colour sits at one width, so
  it holds at every viewport.
- **Contrast floor:** 4.5:1 for text; 3:1 for large text (24px and up, or 18.66px
  and up at weight 700), icons and control borders (WCAG 1.4.3, 1.4.11).

## Actors

One: a visitor in the dark theme, either locale, any width.

## User stories

- US-1: As a dark-theme visitor, I want a soft glow behind the hero and on the
  home sections so that the page has depth instead of flat navy.
- US-2: As a visitor reading small grey text, I want every line as legible on a glow
  as on flat navy so that the decoration costs me nothing.
- US-3: As a light-theme visitor, I want the page to look exactly as it does today.

## Requirements (EARS)

- RF-1: WHILE the dark theme is active, THE SYSTEM paints a glow on every glow
  surface and on no other element. — **Check:** an e2e test on `/` at 390, 800 and
  1280px fails on a glow surface whose computed `background-image` holds no
  gradient, or on a card, the sheet or the body that holds one; on `/proyectos`,
  a project page and the 404 it fails on any section that holds one.
- RF-2: WHILE the light theme is active, THE SYSTEM renders every section as before
  this spec. — **Check:** an e2e test fails if any section's computed
  `background-image` or `background-color` at 390, 800 or 1280px differs from the
  baseline recorded before the change.
- RF-3: WHILE forced colours are active, THE SYSTEM paints no glow. — **Check:** an
  e2e test emulating `forced-colors: active` in dark fails on any glow surface
  whose computed `background-image` is not `none`.
- RF-4: THE SYSTEM builds every glow colour from the navy ramp, alone, mixed or with
  transparency, plus the gold in the hero's glow only. — **Check:** a test reads
  every colour of every glow and fails on one outside that set; a violet, a skill
  level colour, and gold in a non-hero glow surface all fail.
- RF-5: THE SYSTEM keeps every text on a glow surface at or above its contrast floor
  at the worst point. — **Check:** an e2e test computes, for each text colour each
  glow surface shows at rest, on hover and on focus, its worst point, and fails below the
  floor.
- RF-6: THE SYSTEM keeps every icon, control border and focus ring on a glow surface
  at 3:1 or more at the worst point. — **Check:** the RF-5 test, over those colours,
  fails below 3:1.
- RF-7: THE SYSTEM keeps every composite of a glow between the chip surface and the
  card step, and never deeper than the ground nor lighter than the soft fill. —
  **Check:** a test compares each composite's relative luminance with those steps
  and fails outside them.
- RF-8: WHEN a visitor hovers, focuses or activates a glow surface or anything in it, THE
  SYSTEM leaves the glow unchanged. — **Check:** an e2e test fails if a glow surface's
  computed `background-image` under `:hover`, `:focus-visible`, `:focus-within` or
  `:active` differs from its value at rest.

**How far a glow may lighten.** Every glow surface holds a control border, the hero
included, and the worst point is taken over the whole gradient. So a glow lightens
only as far as keeps every control border at 3:1 once spec 017's values are in — a
bound RF-6 measures, not a number this spec fixes. RF-7 (gold under 7% on the sheet)
and RF-5 (secondary text: 9% gold gives 4.52) still apply; the lowest of the three
wins.

## Non-functional requirements

- **Gradients only:** no image, no filter, no fixed background (a fixed background
  repaints on every scroll frame). — **Check:** the RF-1 test fails on a glow
  surface whose `background-image` holds `url(` or whose `filter`, `backdrop-filter` or
  `background-attachment: fixed` is set.
- **Static:** no glow transitions or animates, so reduced motion needs no rule of
  its own. — **Check:** an e2e test fails if, after a theme flip settles, a glow
  surface has a running animation or transition on a background property.
- **No new element:** a glow is painted on the glow surface itself; a wrapper
  or a decorative pseudo-element needs the plan to say why the surface cannot carry it.
- **No new request or file**, and no dependency (constitution 1, 7).
- **Theme flip:** the 180ms `background-color` transition stays; a gradient does not
  interpolate, so the glow appears at once while the colour fades. Accepted.
- **Locales:** a glow carries no text; both locales render the same glow.

## Edge cases

- **Narrow viewport.** At 390px a radial glow's centre can sit behind the name and
  the bio; RF-5 and RF-6 measure the whole gradient, so position does not matter.
- **Cards on a glow.** Cards stay flat and opaque, so text inside a card is measured
  on the card, as today. A card's focus ring (2px outside the card) sits on the
  glow surface's glow and is measured there (RF-6): 10.28 on the flat sheet. A card
  border that 017 does not class as a control border is not held by RF-6.
- **Sections on other routes.** `/proyectos` (which also renders the projects
  section, inside its own wrapper), `/proyectos/<name>` and the 404 get no glow;
  RF-1's check asserts none there.
- **Process-step cards (011)** stay flat in dark; only their edges meet a glow.
- **The hero's CSS-only detail (010).** If 010 chooses a gradient, it is the hero's
  glow under this spec — one glow on the hero, not two.
- **The primary button (007)** is opaque: its text is measured on its fill, only its
  border on the glow (RF-6).
- **The sheet edge.** RF-7 keeps a glow's darkest composite at the chip step,
  above the ground (1.41:1 below the sheet), so the sheet never sinks into it.
- **No scripts.** Glows are CSS; the anti-flash script already sets the theme before
  first paint.

## Out of scope

- The light theme: tints, ornaments, gradients (011 owns its tints).
- Glows on cards, on the sheet or on the ground behind it (decision 1).
- The hero's layout and content (010); section title decorations (008); section
  ornaments in either theme.
- Animated or cursor-following glows.
- Changing a ramp value or a text colour to make room for a glow: the glow gives way.
- Raising the control borders to 3:1 (spec 017, a prerequisite).
- The focus ring's own colour, width or offset (016).
- `prefers-contrast: more` and print; a possible follow-up drops glows there too.
- Retiring a guard: none. The both-themes token guard and the hover guards stay as
  they are.

## Done when

- The prerequisites are in place.
- `npm test`, `npm run test:e2e` and `npm run build` green, every new guard shown red
  by injecting its violation and reverted by explicit path (constitution 4).
- `/`, `/proyectos`, one `/proyectos/<name>` and the 404 seen from a running dev
  server in both themes at 390, 800 and 1280px after transitions settle, and the
  owner approves the dark result before the commit.

## Open questions

None.

## Decision

- 2026-10-15 · Glow surfaces: the hero and every home section. Cards stay flat, the sheet
  and the ground are not glow surfaces. Discarded: card glows, which leave secondary
  text 0.28 of headroom (4.78 flat; 5% gold gives 4.33). Owner.
- 2026-10-15 · Control borders: held at their WCAG floor of 3:1 under any glow, with
  spec 017 as a prerequisite that gives them the headroom. Replaces the same day's
  "no lower than today's flat value" (1.54 on the sheet), which left only a 1.17:1
  darkening, sheet to chip step, and no gold anywhere. Also discarded: treating them
  as debt outside RF-6, which let any glow lower them further. Owner.
- 2026-10-15 · "Soft" is RF-7, the ramp bound: gold on the sheet stays under 7% (at
  7% the composite outshines a card). Discarded: the text floor alone, which allows
  9% (secondary text 4.52; 4.45 at 10%). Owner.
- 2026-10-15 · Gold only in the hero's glow; section glows are navy steps only.
  Discarded: gold wherever RF-5 holds (up to 9% on the sheet). Owner.

## For the plan

- **Light layer.** AGENTS: a token is declared in both theme files or neither, and
  one value never carries two names. Glows read from dark-scoped rules, or tokens
  present in both themes, must keep both token guards green without an exemption.
- **Interpolation.** Gradients interpolate in sRGB; `oklch`/`hsl` interpolation
  sweeps through hues between gold and navy and fails RF-4.
- **RF-4 reads every spelling** of a colour — `color-mix()` with `transparent`,
  relative `rgb(from …)` — not hex alone; computed values make that one format.
- **Settling.** The static check must not mistake the 180ms theme transition for a
  glow animation; filter by property and wait for it to end.
- **Baseline (RF-2)** compares computed values, not pixels: the GitHub list and the
  remote avatar make a screenshot non-deterministic.
- **Contrast function** reproduces the WCAG references already used here: 21.0000,
  1.0000, and 4.5422 for `#767676` on white.
- **Forced colours** may already drop gradients in Chromium; record that, and the RF
  still stands.
