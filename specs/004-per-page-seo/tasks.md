# Tasks 004 — Per-page titles, descriptions and project JSON-LD

**Spec:** `specs/004-per-page-seo/spec.md` (aprobada). **Plan:** `specs/004-per-page-seo/plan.md` (aprobada).
**Runner:** `npm test` = `vitest --run tests` (`package.json:11`). One file: `npx vitest --run tests/seo.test.ts`.
Never bare `npx vitest --run` — without the `tests` filter it picks up `e2e/about.spec.ts` (AGENTS.md).

**Every guard below is proven by injection before it is called green**: inject the violation,
watch the named test go red, revert the one path the probe touched. Never `git checkout -- .`
(AGENTS.md). T-6 and T-7 are the only two tasks with no probe, because neither writes a guard.

- [x] **T-1 — Add `homeDescriptionDraft()` and `homeDescription()` to `src/utils/seo.ts`**
  Cubre: RF-3
  Archivos: `src/utils/seo.ts`, `tests/seo.test.ts`
  Hecho cuando: `npx vitest --run tests/seo.test.ts` is green on RF-3's two assertions — the
  result is at most 160 characters, and it is a whole-word prefix of the untruncated draft —
  and the probe bites: replace the return with `homeDescriptionDraft(template).slice(0, 150)`
  and the suite goes red **on the boundary half while the length half still passes**; revert by
  editing `src/utils/seo.ts`.

- [x] **T-2 — Add `projectEntity()`, returning a `SoftwareSourceCode` object**
  Cubre: RF-4, RF-5, RF-7, RF-8
  Archivos: `src/utils/seo.ts`, `tests/seo.test.ts`
  Hecho cuando: `npx vitest --run tests/seo.test.ts` is green on `@type === 'SoftwareSourceCode'`,
  `codeRepository === repo.html_url`, `'programmingLanguage' in entity === false` on the
  no-language fixture, and both `applicationCategory` and `operatingSystem` absent — and four
  probes each go red: set `@type` back to `SoftwareApplication`; delete `codeRepository`; write
  `programmingLanguage: repo.language ?? 'N/A'` (the only probe that proves RF-7 bites on
  **absence**); re-add `applicationCategory`. Revert each by editing `src/utils/seo.ts`.

- [x] **T-3 — Add `projectDescription()` and check the entity against it on both branches**
  Cubre: RF-6
  Archivos: `src/utils/seo.ts`, `tests/seo.test.ts`
  Hecho cuando: `npx vitest --run tests/seo.test.ts` is green with two calls on the builder — a
  repo carrying its own text yields `entity.description` verbatim, a repo with
  `description: null` yields the translated fallback verbatim — and the probe goes red: feed the
  entity `repo.description` instead of the resolved value and the no-description fixture returns
  `undefined` where the page shows the fallback. Revert by editing `src/utils/seo.ts`.

  RF-6's check calls the builder, so the builder has to exist first — the reverse of the order the
  route reads them in.

- [x] **T-4 — Add the `seo.home.*` keys to both locales, and check the generated description against them**
  Cubre: RF-2
  Archivos: `i18n/locales/es.json`, `i18n/locales/en.json`, `tests/seo.test.ts`
  Hecho cuando: `npm test` is green, `tests/i18n.test.ts` included, and RF-2's check asserts —
  every name in `seo.home.techs` in **both** locales (split on D-4's rule) is a member of `TECH`
  imported from `src/data/tech.ts`; at least two names; `seo.home.description` contains the
  literal `{{techs}}`; the interpolated description contains `ABOUT.title` and at least two of the
  names. Four probes each go red: put `Vue.js` in the list; put `C#` back (**Q-4's own probe**);
  cut the list to one name; cut `TECH` to one entry. Revert each by the one file it touched.

  Both files move together (AGENTS.md). The wording is **provisional** (D-6): show the two
  rendered strings before closing. `tests/i18n.test.ts` already resolves every `t()` key in
  `src/`, so a key missing from one locale turns that file red without anything new written for it.

- [x] **T-5 — Supply the home route's own title and description**
  Cubre: RF-1
  Archivos: `src/pages/index.astro`, `tests/seo.test.ts`
  Hecho cuando: the source read — strip `<!-- … -->` **first**, then match
  `/<BaseLayout\b[^>]*>/s` — finds `title=` and `description=` on the home's layout tag, and two
  probes go red: delete `title={…}` from that tag; misspell `{{role}}` as `{{rol}}` in `es.json`
  (`t()` prints an unmatched placeholder silently, `i18n/i18n.ts:53`). Revert both by path.

  The check resolves the template from the locale JSON itself: `@i18n/index` runs `init()` at
  import time and the runner has no alias (D-2), so a test must not reach for it.

- [x] **T-6 — Guard the other three routes' metadata against a well-intended change**
  Cubre: RF-9
  Archivos: `tests/seo.test.ts`
  Hecho cuando: `npx vitest --run tests/seo.test.ts` is green reading `proyectos/index.astro`,
  `proyectos/[name].astro` and `404.astro`, each asserted to carry `title=` and `description=` on
  its `<BaseLayout>` tag — and the probe goes red: drop `description={…}` from the tag in
  `src/pages/proyectos/index.astro`. Revert by that one path.

  Written **before** T-7 on purpose: a guard proven against the change it exists to catch, not
  after it. `proyectos/index.astro`'s tag spans several lines, which is why the match needs `s`.

- [x] **T-7 — Wire the project route to the two new functions**
  Cubre: RF-4, RF-5, RF-6, RF-7, RF-8
  Archivos: `src/pages/proyectos/[name].astro`
  Hecho cuando: `npm test` is green **with T-6's guard still passing over the rewritten route**,
  `npm run build` is green, the hand-built `jsonLd` literal is gone from the file, the route
  resolves the description once and hands that one value to the paragraph, the layout's
  `description` and the entity, and `lang = repo.language ?? 'N/A'` still feeds `LanguageBadge`
  and reaches nothing else (that `N/A` must not reach the entity — RF-7).

- [x] **T-8 — *(mecánica)* Paste the served JSON-LD into a parser, once, and close the build**
  Cubre: ninguno — no RF covers this, and none can; it is the spec's stated limit, not an omission
  Archivos: ninguno (verificación manual)
  Hecho cuando: with `npx astro dev --port 439X` running, the `ld+json` block served from
  `/proyectos/<repo>` pastes into a JSON parser with no error, the paragraph on that page shows the
  same text the entity carries, and `npm test` and `npm run build` are green.

  No test in `npm test` renders a page or parses a block: a malformed one satisfies every
  assertion in this spec and tells a search engine nothing. This is the spec's one manual step —
  do not close it on a green suite alone.