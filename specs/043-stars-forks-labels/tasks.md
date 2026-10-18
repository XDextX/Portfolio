# Tasks 043 — Project labels in the visitor's language

**Spec:** `specs/043-stars-forks-labels/spec.md` (3 RF) · **Plan:** `plan.md`
**Status:** approved
**Approved:** 2026-10-18 · owner approval · 44 lines

Injection numbers refer to block 7 of the plan.

- [x] **T-1 — The locale strings, pinned as data**
  Covers: RF-1
  Files: `tests/project-card.test.ts`, `i18n/locales/es.json`, `i18n/locales/en.json`
  Done when: the RF-1 data test red on today's `es.json`, then green under `npm test` with
  `starsLabel` "Estrellas: {{count}}" and the keys `project.meta.tags` / `project.readme.label` in
  both locales (`tests/i18n.test.ts` green); injection 1 red and reverted.

- [x] **T-2 — The card's counts: tooltip and announced text from the key**
  Covers: RF-2
  Files: `tests/project-card.test.ts`, `src/components/ProjectCard.astro`
  Done when: the card render test red first, then green in both locales under `npm test`;
  injections 2 (render half) and 5 red and reverted.

- [x] **T-3 — The page's counts, topics and README section through `t()`**
  Covers: RF-2, RF-3
  Files: `tests/project-card.test.ts`, `src/pages/proyectos/[name].astro`
  Done when: the page render test red first, then green in both locales under `npm test`;
  injections 3 (render half), 4 (render half) and 6 red and reverted.

  Spec 044 edits these sidebar lines next; this lands first.

- [x] **T-4 — Widen the `t()` guard to literal `title` / `aria-label`**
  Covers: RF-2, RF-3 (the repo-wide rule behind them)
  Files: `tests/visual-language.test.ts`
  Done when: green on the tree T-2 and T-3 left; injections 2, 3 and 4 each turn it red, naming
  the file and the literal; `npm test` and `npm run test:e2e` green.

  After T-2 and T-3: written first it is red on the six literals they remove, and the pre-commit
  hook would refuse every commit in between.

- [x] **T-5 — Read it on the dev server**
  Covers: the spec's visual *Done when*, both NFRs
  Files: none
  Done when: a project page and a card in `?lang=es` and `?lang=en`, light and dark, at 390×844:
  the page reads "Estrellas" / "Stars", a count's tooltip shows its label, nothing else moved.
  **Stop for the owner's visual approval.**
