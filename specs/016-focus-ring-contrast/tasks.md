# Tasks 016 — Focus ring contrast

**Spec:** `specs/016-focus-ring-contrast/spec.md` (**approved**, 7 RF).
**Plan:** `specs/016-focus-ring-contrast/plan.md` (**approved**).
**Approved:** 2026-10-15 · owner approval, with T-2 updated for the shared colour helper

Injection numbers refer to the table in plan §7.

- [x] **T-1 — Add the focus-ring rule to `AGENTS.md`**
  Covers: none (mechanical; the spec's *Done when*, constitution 3)
  Files: `AGENTS.md`
  Done when: `AGENTS.md` states that every outline is drawn in `--focus-ring`,
  defined in each theme file as an alias, and names `tests/visual-language.test.ts`.

  First, so the code commit can point at a rule that already exists; its own
  `docs:` commit when you ask for one.

- [x] **T-2 — Move the colour maths to a helper, widen the resolver, add its cases**
  Covers: support for RF-3, RF-5, RF-6 (plan §3, D-5)
  Files: `tests/helpers/colour.ts` (new), `tests/visual-language.test.ts`
  Done when: `resolveColour(expr, ...layers)` follows any chain and throws on a dead
  end or a cycle; the two resolver cases pass; `npm test` green (the seven existing
  callers unchanged); injections 14 and 15 shown red and restored byte-identical.

- [x] **T-3 — Guard the outlines: colour, removal, avatar border**
  Covers: RF-1, RF-4, RF-7, the avatar-border NFR
  Files: `tests/visual-language.test.ts`
  Done when: `cssRules` and `styleSources` exist; *outline colour* is **red on
  today's code**, naming `01-base.css` and `AvatarCircle.astro`; *outline removal*
  and *avatar border* green, and injections 10–13 shown red and restored.

- [x] **T-4 — Guard the focus token and its contrast**
  Covers: RF-2, RF-3, RF-5, RF-6
  Files: `tests/visual-language.test.ts`
  Done when: *focus token* and *focus contrast* are **red on today's code** (no
  `--focus-ring` anywhere), each failure message naming its RF.

- [x] **T-5 — Draw every ring in `--focus-ring`**
  Covers: RF-1–RF-7
  Files: `public/styles/themes/light.css`, `public/styles/themes/dark.css`,
  `public/styles/01-base.css`, `src/components/AvatarCircle.astro`
  Done when: `npm test` green; injections 1–9 shown red as plan §7 predicts and
  restored byte-identical; `tests/tokens.test.ts` green.

- [x] **T-6 — See it in both themes**
  Covers: RF-3, RF-5, RF-6 as rendered; the spec's *Done when*
  Files: none
  Done when: `npm run build` green; in a running dev server, light and dark, the
  ring visible when tabbing to the language selector, the theme toggle and the CV
  button on `/`, and the home button on the 404; computed `outline-color` read in
  the browser equals `#243972` in light and `#f5f7fa` in dark. **Stop for your
  visual approval.**

  After approval: the spec goes to `implemented` once validated, and the code
  commit names the 15 injections — both only when you ask.
