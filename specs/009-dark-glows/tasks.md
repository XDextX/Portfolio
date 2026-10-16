# Tasks 009 — Glows and soft gradients in the dark theme

**Spec:** `specs/009-dark-glows/spec.md` (**approved**, 8 RF).
**Plan:** `specs/009-dark-glows/plan.md` (**approved**).
**Approved:** 2026-10-15 · owner approval

**Ordering across specs.** 016, 007, 008 and 017 land first; then 009, 010, 011. This spec
reads what they leave: `tests/helpers/colour.ts` with `luminance`, `contrast`,
`resolveColour(expr, ...layers)` and `styleSources()` (016); `e2e/helpers/dev-server.ts`, the
theme setup and `groundOf`/`composite` in `primary-button.spec.ts` (007);
`e2e/helpers/rendered.ts` with `toHexColour` and `settle`, and 008's WCAG reference case (008);
the control border colour, read as rendered and never written here (017). If any of them is
not in place at T-1, stop: RF-6 has no 3:1 border to hold and the helpers below do not exist.

**Gate, not a task here:** the constitution 7 amendment with `npm run test:e2e` in
`.husky/pre-commit` (cross-cutting, 2026-10-15). Confirm it is committed before T-2.

Injection numbers refer to the table in plan §7.

- [x] **T-1 — Amend "the dark theme is one hue" in `AGENTS.md`**
  Covers: none (mechanical; the spec's prerequisite, constitution 3)
  Files: `AGENTS.md`
  Done when: the rule (today `AGENTS.md:305-307`) states that a glow is a gradient of navy
  steps, gold in the hero only, on a home section, held by RF-5–7, and names
  `e2e/dark-glows.spec.ts`; nothing else in the file changes.

  First, so the code commit points at a rule that already exists; its own `docs:` commit
  when you ask for one.

- [x] **T-2 — Add the gradient maths to the colour helper, with its cases**
  Covers: support for RF-4, RF-5, RF-6, RF-7 (plan §3, D-5, D-7)
  Files: `tests/helpers/colour.ts`, `tests/visual-language.test.ts`
  Done when: `parseColour`, `parseGradients`, `composites`, `worstPoint`, `onRamp` and
  `floorFor` exist with the signatures in plan §3; the three helper cases (`color(srgb … /
  .05)`, `onRamp` rejecting `#7C3AED`, a two-stop `composites` fixture) pass; 008's WCAG
  reference case still passes through the helper; `npm test` green; injection 17 shown red
  and restored byte-identical.

- [x] **T-3 — Teach the rendered helper's ground lookup to stop at a glow**
  Covers: support for RF-5, RF-6 (`composite` and `__ground` already moved in 008)
  Files: `e2e/helpers/rendered.ts`, `e2e/primary-button.spec.ts`
  Done when: `groundOf(el, isGlow)` returns the glow surface when it is reached before an opaque
  ground and throws "not measurable" on `opacity < 1` on the way; `npm run test:e2e` green
  with the primary-button spec unchanged in what it asserts.

- [x] **T-4 — Record the light baseline from today's code**
  Covers: RF-2
  Files: `e2e/dark-glows.spec.ts` (new, *light baseline* only)
  Done when: the constant holds each `section`'s `background-image` and
  `background-color` on `/`, `/proyectos`, one project page and the 404 at 390, 800 and
  1280px, keyed as plan §4 says and dated; it was recorded before any CSS of this spec
  exists; the test passes; injection 6 cannot run yet and is proven in T-7.

  Before T-7 by construction: a baseline recorded after the change compares the change
  with itself.

- [x] **T-5 — Write the rendered glow checks**
  Covers: RF-1, RF-3, RF-4, RF-5, RF-6, RF-7, RF-8, the gradients-only, static and locales NFRs
  Files: `e2e/dark-glows.spec.ts`
  Done when: *glow placement*, *forced colours*, *glow palette*, *worst point*, *ramp
  bound* and *glow at rest* exist as plan §4 describes; *glow placement* is **red on
  today's code** (no surface holds a gradient), its message naming RF-1; the other five
  pass vacuously until T-7, which proves each by injection;
  `.btn-social`, `.view-toggle` and the show-more toggle are found by *worst point*.

- [x] **T-6 — Guard the ramp order and the gradient interpolation**
  Covers: RF-4, RF-7 (data halves)
  Files: `tests/visual-language.test.ts`
  Done when: *ramp order* passes on today's dark ramp and injection 16 turns it red;
  *glow interpolation* passes vacuously (no dark gradient yet) and is proven by injection
  10 in T-7; `npm test` green; injection 16 restored byte-identical.

- [x] **T-7 — Paint the hero and section glows in dark**
  Covers: RF-1–RF-8
  Files: `public/styles/themes/dark.css`, `src/components/AboutSection.astro`
  Done when: line 28 carries `section--hero`; the two rules and the forced-colours reset of
  plan §4 are appended to `dark.css` with a comment of at most five lines on `in srgb`;
  `npm test` and `npm run test:e2e` green; injections 1–15 shown red as plan §7 predicts
  (7 recorded either way: whether Chromium drops the gradient unaided) and restored
  byte-identical; `tests/tokens.test.ts` green; no token added, `light.css` untouched.

- [x] **T-8 — See it in both themes**
  Covers: RF-1–RF-8 as rendered; the spec's *Done when*
  Files: none
  Done when: `npm run build` green; in a running dev server, the new rules confirmed in
  `document.styleSheets` first, then `/`, `/proyectos`, one `/proyectos/<name>` and the 404
  seen in light and dark at 390, 800 and 1280px after transitions settle; the hero and the
  home sections glow in dark only, the other routes stay flat; the brightest-composite
  ratios read against plan §5 (hero secondary 4.90, sections 5.08). **Stop for your visual
  approval of the dark result.**

  After approval: one commit for the glows naming the 17 injections and the forced-colours
  finding, and the spec to `implemented` once validated — both only when you ask.
