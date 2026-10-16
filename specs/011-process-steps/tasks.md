# Tasks 011 — "Lo que construyo" as four process steps

**Spec:** `specs/011-process-steps/spec.md` (**approved**, 8 RF).
**Plan:** `specs/011-process-steps/plan.md` (**approved**).

**Ordering across specs.** 016, 007, 008, 017, 009 and 010 have landed. This spec
reads what they leave: `contrast`, `resolveColour(expr, ...layers)` and `styleSources()` in
`tests/helpers/colour.ts` (016); `e2e/helpers/dev-server.ts` and the theme setup (007);
`SectionTitle.astro`, `public/icons/ui/` with `NOTICE.md` and `LICENSE-tabler.txt`, the *ui
icons* guard and `e2e/helpers/rendered.ts` (`openIn`, `installHelpers` with `__toHex`, `settled`) (008); `--color-border`
on cards (017); the section glow, the in-page `__groundOf`, `composites`, `worstPoint`, `floorFor` (009);
the Plex Sans italic face, the *italic coverage* guard and `axTree`/`axQuery` (010).

**Gate, not a task here:** the constitution 7 amendment with `npm run test:e2e` in
`.husky/pre-commit` (cross-cutting, 2026-10-15). Confirm it is committed before T-4.

Injection numbers refer to the table in plan §7.

- [x] **T-1 — Write the scoped chroma exception in `AGENTS.md`**
  Covers: none (mechanical; the spec's prerequisite, constitution 3)
  Files: `AGENTS.md`
  Done when: the visual-language rules carry an exception for this section only that
  covers the tones on the step icons in both themes, the four light tints including step
  1's gold tint (the cool canvas still governs the ground), and the tints as fills beside
  the `--neutral-200` soft-fill rule; its *settled by* line is left for T-10, once the
  guards exist and have been shown red.

  First, so no code lands outside a written rule; its own `docs:` commit when you ask.

- [x] **T-2 — Measure the LCP before**
  Covers: the LCP NFR (before half)
  Files: none (scratchpad script, never committed)
  Done when: element and time recorded on `/` at 390, 958 and 1440px with 008–010 in place,
  003's method, kept for the commit message.

- [x] **T-3 — Download the four step icons**
  Covers: none (mechanical; the icons NFR's inputs)
  Files: `public/icons/ui/bulb.svg`, `code.svg`, `database.svg`, `rocket.svg`,
  `public/icons/ui/NOTICE.md`
  Done when: **each file was fetched only after your OK for that file**, given its name,
  source URL (Tabler v3.49.0, plan §2) and estimated size; the exact byte size of each is
  reported; the files are unmodified; `NOTICE.md` gains four rows as 008's. Nothing else
  changes.

  Stops four times, once per file.

- [x] **T-4 — Guard the process data and its spellings**
  Covers: RF-3, the editable-content NFR
  Files: `tests/process.test.ts` (new)
  Done when: *process data* (`stepIssues(PROCESS, ['es', 'en'])` is `[]`, icons `bulb, code,
  database, rocket` in order) and *process strings* (the 003 walk, widened to every Copy
  text, tags as whole tokens) exist and are **red on today's code** (no `PROCESS`).

- [x] **T-5 — Move the section's copy into `PROCESS`, retiring 003's data and tests**
  Covers: RF-3, the editable-content NFR
  Files: `src/data/process.ts` (new), `src/data/about.ts`, `tests/about.test.ts`
  Done when: `PROCESS` holds the Copy table in both locales with the plan §3 types;
  `about.ts:34-54` and `about.test.ts:78-151` are gone in the same change, so the section
  is never unguarded; `npm test` green; injections 1–5 shown red and restored
  byte-identical (4 and 5 against today's component).

- [x] **T-6 — Guard the colour exception's scope in source, and widen the shared guards**
  Covers: the scope-of-the-exception NFR (source half), the icons and italic NFRs
  Files: `tests/visual-language.test.ts`
  Done when: *step colour scope* passes vacuously today (no `var(--step-` read anywhere) and
  injection 6 turns it red; *ui icons* reads `PROCESS.steps[].icon` and passes on T-3's
  files; *italic coverage* reads both `note` values; `npm test` green; injections 6 and 17
  restored byte-identical. Injection 7 waits for T-8 (its rendered half needs the tokens).

- [x] **T-7 — Write the rendered process checks**
  Covers: RF-1, RF-2, RF-4–RF-8, the card-edge, silent, inert and scope NFRs
  Files: `e2e/process-steps.spec.ts` (new)
  Done when: *document order*, *tints*, *tones*, *rows*, *arrows* and *frame* are **red on
  today's code**, each message naming its RF; *floors*, *inert*, *silent* and *exception
  scope* pass today, proven by injection in T-8; RF-1's existing assertion in
  `e2e/about.spec.ts` untouched and green; the URL comes from `startDevServer()`.

- [x] **T-8 — Draw the four steps, with their tints and tones in both themes**
  Covers: RF-1–RF-8, every NFR
  Files: `src/components/ValuePropositionSection.astro`, `public/styles/themes/light.css`,
  `public/styles/themes/dark.css`
  Done when: `--step-N-tint` and `--step-N-tone` defined in both theme files with the
  Colour table's values (dark tints `var(--card-background)`), read only by
  `:nth-child(N)` in the component; markup, container query, arrow and tags (`--radius-xs`,
  2px) as plan §4 writes them, no `<script>` and no `:hover` rule; `npm test` and
  `npm run test:e2e` green; injections 7–16 shown red as plan §7 predicts and restored
  byte-identical; `tests/tokens.test.ts` green.

  Tokens and component are one commit: the tokens exist for this component only.

- [x] **T-9 — Measure the LCP after, and see it in both themes**
  Covers: RF-1–RF-8 as rendered; the LCP NFR (after half); the spec's *Done when*
  Files: none
  Done when: `npm run build` green; LCP measured as in T-2 and the section is not the LCP
  element; in a running dev server, the new rules confirmed in `document.styleSheets`
  first, `/` seen in light and dark, `es` and `en`, at 1280 and 1130px after transitions
  settle; RF-6's measured ratios recorded against the spec's Colour table; the real
  min-content of "evoluciono" re-measured (a value above 176px moves the breakpoint by
  `4 Δ / 0.92`, plan §4); forced colours looked at once. **Stop for your visual approval.**

  After approval: one commit for the section naming the 17 injections and the LCP before
  and after — only when you ask.

- [x] **T-10 — Close the paperwork: *settled by*, and 003 superseded**
  Covers: none (mechanical; constitution 3, the spec's *Done when*)
  Files: `AGENTS.md`, `specs/003-value-proposition/spec.md`
  Done when: the exception's *settled by* line names *step colour scope* in
  `tests/visual-language.test.ts` and *exception scope* in `e2e/process-steps.spec.ts`,
  both shown red in T-6 and T-8; 003's status reads `superseded` with one line naming 011.

  Last, once this spec is validated as `implemented`; the `AGENTS.md` line is its own
  `docs:` commit when you ask.
