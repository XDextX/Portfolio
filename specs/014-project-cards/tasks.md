# Tasks 014 — Project cards in the mockup's design

**Spec:** `specs/014-project-cards/spec.md` (**approved**, 8 RF).
**Plan:** `specs/014-project-cards/plan.md` (**approved**).

**Cross-spec order.** 016, 007, 008, 017, 009 and 010–013 have landed; then 014, 018, 015.
This spec reuses, and does not recreate: `tests/helpers/colour.ts` (`contrast`, 016),
`e2e/helpers/dev-server.ts` and the theme setup (007), `public/icons/ui/` with `NOTICE.md`,
the Tabler licence, the *ui icons* guard and `e2e/helpers/rendered.ts` (`openIn`,
`installHelpers` with `__groundOf`, `settled`), `.btn-action` in `--control-border` (017), and 012's `SkillLogo`, `Logo`,
`logoFor`, `logoFiles`, `GENERIC_MARK` and Devicon colour logos. If any of these is missing
when T-1 starts, stop: the spec it belongs to has not landed.

Injection numbers refer to the table in plan §7.

- [x] **T-1 — Confirm the two prerequisite amendments are in force**
  Covers: none (mechanical; spec *Depends on*)
  Files: `docs/constitution.md`, `AGENTS.md`, `.husky/pre-commit` (read; written only if missing)
  Done when: constitution 7 names the e2e suite as policy and `.husky/pre-commit` runs it;
  `AGENTS.md` states that brand logos are content, outside the navy-and-gold rule. If 007/012
  did not land either, it is written here as its own `docs:` commit, when you ask for one.

- [x] **T-2 — Add `vitest.config.ts`, neutral by an unchanged suite**
  Covers: none (mechanical; plan D-1)
  Files: `vitest.config.ts` (new), `tests/seo.test.ts` (comment 22-24 only)
  Done when: `npm test` reports the same test-file and test counts, all green, as the run
  recorded just before the change; the Playwright spec is still not collected; the stale
  alias comment in `tests/seo.test.ts` is rewritten. If the count or a result moves, stop and
  ask (plan D-1). Its own commit, when you ask for one.

  Before any container case, because those need vitest to compile `.astro`.

- [x] **T-3 — Move `buildRepo` to the mocks and add the *language* and *demo URL* cases**
  Covers: support for RF-4, RF-5, RF-7, RF-8 (plan §7)
  Files: `tests/helpers/github-mocks.ts`, `tests/github-helpers.test.ts`
  Done when: `buildRepo` lives in `github-mocks.ts` and the existing cases pass through the
  import unchanged; *language* and *demo URL* are **red on today's code** (no `repoLanguage`,
  no `demoUrl`).

- [x] **T-4 — Add `repoLanguage` and `demoUrl` to `github.ts`**
  Covers: RF-4, RF-5, RF-7, RF-8 (helper half)
  Files: `src/pages/lib/github.ts`
  Done when: *language* and *demo URL* green; `sortRepos` byte-identical; injections 1, 6
  and 8 shown red on the helper cases and restored byte-identical.

- [x] **T-5 — Write the card's data and container cases**
  Covers: RF-2, RF-3, RF-5, RF-6, RF-7, RF-8
  Files: `tests/project-card.test.ts` (new), `tests/visual-language.test.ts`
  Done when: *logo files*, *generic*, *no badge*, *unknown*, *description*, *demo* and *no
  demo* exist, rendering `ProjectCard` and `[name].astro` through the Container API in both
  locales; 008's *ui icons* reads `PROJECT_MARK`; all are **red on today's code** (no
  `languageLogo`, the card prints `N/A` and links the raw homepage).

- [x] **T-6 — Download the `file-code` mark**
  Covers: RF-3 (asset)
  Files: `public/icons/ui/file-code.svg` (download), `public/icons/ui/NOTICE.md`
  Done when: fetched under the owner's standing OK for icons (plan §2: Tabler v3.49.0, outline,
  MIT, 518 B); after it, the file is unmodified, its byte count reported, and
  `NOTICE.md` carries its row beside the existing licence.

- [x] **T-7 — Add the known-language table and `languageLogo` to `tech.ts`**
  Covers: RF-2, RF-3 (data)
  Files: `src/data/tech.ts`
  Done when: *logo files*, *generic* and *ui icons* green, the logo read from the `TECH`
  entry and not restated; `tests/tokens.test.ts` green; injections 2, 3, 12 and 18 shown red
  and restored byte-identical. The container cases stay red until T-9.

- [x] **T-8 — Write the rendered checks**
  Covers: RF-1–RF-4; NFR themes, badge palette, no project image, kept preview
  Files: `e2e/project-cards.spec.ts` (new)
  Done when: *placeholder*, *logo*, *mark*, *badge*, *badge contrast*, *fill*, *no project
  image* and *preview* exist over `/` (after "Ver más proyectos" and `settled`) and
  `/proyectos`, both themes, expectations from `/api/github-list.json` (plan D-8); the run
  fails unless a known-language and a no-language card render; **red on today's code**.

- [x] **T-9 — Rebuild `ProjectCard` around the placeholder**
  Covers: RF-1–RF-8
  Files: `src/components/ProjectCard.astro`
  Done when: `npm test` and `npm run test:e2e` green; injections 4, 5, 7, 9, 10, 11, 13–17
  and 19 shown red as plan §7 predicts and restored byte-identical (11 reported unproven if
  no live Astro card exists); `tests/viewtransitions.test.ts` and `tests/tokens.test.ts`
  green; `LanguageBadge.astro` still used by the detail page.

- [x] **T-10 — See every card state in both themes**
  Covers: RF-1–RF-8 as rendered; the spec's *Done when*
  Files: none
  Done when: `npm run build` green; from a running dev server, `document.styleSheets` checked
  first, `/` and `/proyectos` at 1280 and 390px in light and dark show every plan §5 state:
  known language, Astro's per-theme logo, unknown language, README-only card ("Código" at its
  natural width), "Demo" present, long name. **Stop for your visual approval.**

  After approval: one commit — the card with its helpers, data and asset — naming the 19
  injections, and the spec to `implemented` once validated; both only when you ask.
