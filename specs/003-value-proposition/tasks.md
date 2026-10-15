# Tasks 003 — Value proposition section

**Spec:** `specs/003-value-proposition/spec.md` (**approved**, 6 RF, cambio 2026-10-11).
**Plan:** `specs/003-value-proposition/plan.md` (**approved**, D-1–D-15).

**Runners, read from `package.json`:** `npm test` = `vitest --run tests` (`:11`). One file:
`npx vitest --run tests/about.test.ts`. Never bare `npx vitest --run` — without the `tests`
filter it picks up `e2e/about.spec.ts` (`AGENTS.md`). The e2e half is `npm run test:e2e` =
`playwright test` (`:12`), **run by hand**: `.husky/pre-commit` runs `npm test` and nothing else,
so **no task below is enforced by a hook**.

**The approved wording is copied, not written — and now replaced, not edited.** The
2026-10-11 proposition and three proof points live in the spec under *Approved wording*
and land in `src/data/about.ts` byte for byte (plan §2, D-15): the `es` text is the
owner's, the `en` text is the planner's translation per the owner's "tradúcela tú".
T-6 is where they go in — do not re-draft, improve or re-translate them, and the section
title stays "Lo que construyo" / "What I build" (D-8, untouched: no task here opens
either locale file).

**Every new guard below is proven by injection before it is called green** (constitution 4):
inject the violation, watch the named test go red, revert **the one path** the probe touched.
Never `git checkout -- .` — it restores from the index and destroys uncommitted work without saying
so (`AGENTS.md`), and uncommitted work is this repo's normal state.

**T-4 runs before T-5 on purpose.** `HOME_HOSTS` is the home *as it renders today*. A baseline
captured after the section is wired in absorbs the very host RF-5 exists to catch, and the
assertion then passes on the thing it was written to reject. (First-landing note, kept:
T-4 is already captured and stays valid — the rework adds no host, so the baseline is
not re-captured.)

**T-6 runs before or with T-5 on purpose.** The content (T-6) and the position (T-5) are
independent edits to different files, but landing the rewire while the old wording is
still in the data ships a half-changed section; content first, then order.

**Six tasks.** Nothing here is a checkbox that a human has to eyeball; the two obligations that
are — looking at the rendered section, and the LCP pair — are listed after T-6 as manual steps,
because turning them into a task would dress a human obligation as an automated one.

- [x] **T-1 — Add `valueProposition` and `proofPoints` to `ABOUT`, and the RF-2, RF-3 and RF-4 data
  guards to `tests/about.test.ts`**
  Cubre: RF-2, RF-3, RF-4 (primera mitad)
  Archivos: `src/data/about.ts`, `tests/about.test.ts`
  Hecho cuando: `npx vitest --run tests/about.test.ts` is green on four new `it`s in one new
  `describe`, and the eight existing tests are untouched —
  **(a)** `ABOUT.proofPoints` has length `3`; **(b)** every entry's `es` and `en`, `.trim()`ed,
  is non-empty; **(c)** per locale, `new Set(ABOUT.proofPoints.map((p) => p[l])).size === 3`;
  **(d)** `ABOUT.valueProposition.es` and `.en`, `.trim()`ed, are non-empty. **Four probes each go
  red**, reverting `src/data/about.ts` and nothing else: set `proofPoints[2].es = ''` (red on
  **(b)**, `es` only); delete the third entry (red on **(a)**); set
  `proofPoints[2].en = proofPoints[0].en` (red on **(c)**, **`en` only** — the Spanish strings still
  differ, which is exactly why that probe lives in the other locale); set
  `valueProposition.es = ''` (red on **(d)**, which is the probe for the sentence, the gap RF-2's
  own wording does not cover).

  `proofPoints` is an **array**, not an object keyed `"1" "2" "3"` (D-1): `Object.keys()` returns
  three for an object with one key, so a count assertion would pass on data that is not a list.
  Each entry carries `{ es, en }` rather than one array per locale, so a locale switch cannot
  produce a different number of points. `ABOUT` stays `as const`, and `ABOUT.bio` is not touched —
  the SSE sentence in `about.ts:29` is out of scope.

- [x] **T-2 — Add the `valueProposition.title` key to both locale files**
  Cubre: RF-6 (la mitad de la clave)
  Archivos: `i18n/locales/es.json`, `i18n/locales/en.json`
  Hecho cuando: `npm test` is green, and reading the two files shows `valueProposition.title`
  carrying **"Lo que construyo"** in `es.json` and **"What I build"** in `en.json` — a new
  top-level namespace placed at the end of each file, after `notFound`, which is the end both
  files already close with. Probe: delete the whole `valueProposition` namespace from `en.json`
  only, and `tests/i18n.test.ts:36-38` goes red, because the two files no longer share their
  top-level keys. Revert by editing that one file.

  **Both files move together** (`AGENTS.md`) — this is the whole task. Independent of T-1; it sits
  here only because T-3 needs both. Neither file is alphabetical today, so position carries no
  meaning and the end keeps the diff to one hunk per file.

- [x] **T-3 — Create `src/components/ValuePropositionSection.astro`, and the guard that its strings
  live in `ABOUT` and in no component**
  Cubre: RF-4 (segunda mitad), RF-6 (el escaneo de `t()`)
  Archivos: `src/components/ValuePropositionSection.astro`, `tests/about.test.ts`
  Hecho cuando: `npm test` is green, and four guards that already existed now read the new file the
  moment it lands — **which is what makes this task verifiable without rendering anything.**
  `tests/i18n.test.ts:40-69` resolves the file's `t('valueProposition.title')` in both locales
  (delete the key from `en.json`: red — and this is RF-6's second probe, the one that matters once
  the file calls `t()`); `tests/tokens.test.ts:97` resolves every `var()` in its `<style>`
  (write `var(--measuree)`: red, the typo `AGENTS.md` calls out by name); `tests/visual-language.test.ts:131`
  rejects a locale ternary (replace the indexed read with `locale === 'es' ? es : en`: red);
  `tests/viewtransitions.test.ts:32-36` finds no client script because the file ships none.
  The component reads `ABOUT.valueProposition[locale]` and
  `ABOUT.proofPoints.map((p) => p[locale])` — **indexed by the `locale` prop, never chosen by a
  ternary**: `t()` is for chrome, `ABOUT` is for the sentence, and the ternary is what
  `visual-language.test.ts` reads as prose living in a component. It renders
  `<section class='section' id='ValueProposition' aria-labelledby={titleId}>` with a bare `<h2>`
  (D-9) and no HTML comment (D-6), so `tests/comments.test.ts`'s sixteen-entry `ALLOWED` set stays
  as it is. `max-width: var(--measure)` goes on the `<p>` **and on each `<li>`**, never on the
  `<ul>`: `box-sizing: border-box` is global, so a cap on the `<ul>` would count the UA
  `padding-inline-start` and cap less than the text it was chosen for (D-11). Every colour is a
  token both themes already redefine, so neither theme file is touched and
  `tests/tokens.test.ts`'s dead-token check stays green.

  **And the new guard**: a second `describe` in `tests/about.test.ts` walks `src/components/*.astro`,
  **strips comments first**, and finds neither the Spanish nor the English proposition nor any of
  the three proof points in any component — plus an assertion that **the walk found files**, which
  is what stops the guard from being green because it read nothing. **Two probes**: paste the
  Spanish proposition into the new component's template (red — revert by editing that one file);
  point the walk's directory at an empty directory (red on the found-files assertion, not on the
  offender list). This is a source read and constitution 8 asks for its reason: the strings exist in
  `about.ts` and there they will keep existing, so a copy pasted into a template changes nothing any
  data assertion can see.

  The walk lands **here** and not in T-1 because until this file exists there is no component to
  hold the strings, and "no component spells them" would be true of the wrong universe.

- [x] **T-4 — Capture `HOME_HOSTS` from `/` as it renders now, and write RF-5's request-set check in
  `e2e/about.spec.ts`**
  Cubre: RF-5
  Archivos: `e2e/about.spec.ts`
  Hecho cuando: `npm run test:e2e` is green, and the literal `HOME_HOSTS` set in the file equals the
  hosts the home actually requests today — **captured by running it, not written from memory and
  not widened until it accepts anything** (plan §4.2.1). Reading the source only suggests what it
  should contain: `ABOUT.avatar` is a `github.com` URL (`src/data/about.ts:22`) and
  `BaseLayout.astro:70` preconnects `avatars.githubusercontent.com`, so a redirect is expected — but
  a reading is not a measurement, and that is the reason the baseline exists. The listener is
  attached **before** `page.goto`, `about:blank` and `data:` URLs (`host === ''`) are filtered out,
  and the guard asserts the captured set is **non-empty** before it filters. **Two probes**:
  `<img src='https://cdn.example.com/probe.png' alt=''>` inside `AboutSection.astro` — the failure
  message names `cdn.example.com`; move `page.on('request')` to **after** `goto` — red on the
  non-empty assertion. That second probe is the one that matters: without it the guard would be
  **green having observed nothing**, which is the same vacuous-read failure
  `tests/i18n.test.ts:71-76` and `tests/viewtransitions.test.ts:32-36` each carry an assertion for.

  Both `test()`s go inside the existing `test.describe.serial('About section e2e')`
  (`e2e/about.spec.ts:56`), which already spawns `npm run dev` and waits on `http://localhost:4321`
  (`DEV_URL`, `:5`; `:7-8`, `:59-65`). **No new spec file** (D-2): `fullyParallel: false`
  (`playwright.config.ts:7`) orders tests within a file, not between files, and a second
  `beforeAll` binds the same port. **Do not rename the `describe`** — it now covers the home's second
  section too, and the rename is a separate edit (D-2, *Recorded, not fixed*).

  RF-5's source clause — "the source names no new host" — gets **no guard and no scanner** (D-7):
  only what the served home *requests* is settled. Nothing in this task scans `src/` for hosts.

- [x] **T-5 — Move the section below `AboutSection` in `Resume.astro`, and move RF-1's order check from `ids[0]` to `ids[1]`**
  Cubre: RF-1
  Archivos: `src/components/Resume.astro`, `e2e/about.spec.ts`
  Hecho cuando: `npm run test:e2e` is green — `main > section` ids collected with `$$eval`, and
  `ids[1] === 'ValueProposition'` — and `npm test` and `npm run build` are green. **The check
  is updated before the element moves and watched red** (`ids[1]` is `skills` while the section
  still renders first), then `<ValuePropositionSection locale={locale} />` moves **below** the
  `<AboutSection … />`, keeping its import in the block. Nothing else in that file changes,
  and the four sections below keep their order: RF-1 moves nothing but itself. **Two probes**:
  move the element back **above** `<AboutSection>` — red with `ids[1] === 'About'` **while the
  section still renders**, which is the probe that proves the assertion reads **order** and not
  presence; delete the element — red, `main > section` no longer carries `ValueProposition` at all.
  Revert each by editing `Resume.astro`.

  `'main > section'`, not `'section'`: `<main>` also holds the topbar `<header>` and the slot
  (`BaseLayout.astro:90-96`). `<main>` is a plain block (`src/styles/global.css:35-42`) — no
  flex, no grid, no `order` — so document order **is** visual order, which is what makes a
  DOM-order assertion a fair proxy for "the second section on the page" here.

  **`npm run test:e2e` is a manual step**: `.husky/pre-commit` runs `npm test` and nothing else.
  Run it by hand and say so when reporting the task green.

- [x] **T-6 — Replace `ABOUT.valueProposition` and `proofPoints` with the 2026-10-11 wording, and re-prove the data guards against the new text**
  Cubre: RF-2, RF-3, RF-4 (primera mitad; la segunda mitad — el walk de T-3 — sigue valiendo porque lee desde `ABOUT`)
  Archivos: `src/data/about.ts` (los guards de `tests/about.test.ts` no cambian: leen `ABOUT`, así que el texto nuevo fluye por ellos)
  Hecho cuando: `npx vitest --run tests/about.test.ts` is green, and the same **four probes as T-1 go
  red again against the new text**, reverting `src/data/about.ts` and nothing else: set
  `proofPoints[2].es = ''` (red on **(b)**, `es` only); delete the third entry (red on **(a)**); set
  `proofPoints[2].en = proofPoints[0].en` (red on **(c)**, **`en` only**); set
  `valueProposition.es = ''` (red on **(d)**, the sentence RF-2 does not cover).

  Copy byte for byte from the spec's *Approved wording* (plan §2, D-15): the `es` text is the
  owner's, the `en` text is the planner's translation per the owner's "tradúcela tú" — **do not
  re-translate**. T-1 stays checked as the first landing's history; its data is superseded here.
  Before calling this green, confirm T-3's component walk reads the strings from `ABOUT`
  (then it follows the new text alone); if it carries the old texts as literals, replace them
  with the new ones in this same task — still RF-4, still one file touched plus the data.

---

## Manual steps — obligations, **not** tasks

No checkbox here. Each is in the spec's *Done when* and outside anything `npm test` reaches:
`output: "server"` (`astro.config.mjs:5`) means `dist/` holds no HTML, so **a green build proves
nothing about what a visitor sees**.

1. **Look at the section, both locales, both themes, at 390×844 and at ≥1280px — in second
   place.** The heading, the sentence, three gold-marker bullets, and the cap stopping the paragraph and each bullet at
   `--measure` from 1280px up. Then look at the one visible consequence of the move:
   `04-layouts.css:12` is `.section + .section`, which matches **every** adjacent pair, so the added
   hairline now sits between `About` and the value proposition and **moves none** of the three existing ones
   — `skills`, `Experience` and `Projects` keep theirs, and `About`, first again, has lost the top border it had gained
   (measured before the first landing, plan §5). It is a thing to look at, not a rule to move in CSS.
   Also confirm `/proyectos` and `/proyectos/<name>` show **no** section: those routes compose
   `ProjectsSection` directly (`src/pages/proyectos/index.astro:4`) and never render `Resume`.
   And confirm the decayed outline cost D-4 records: the hero's `h1` is first again, the section's
   `h2` sits among its siblings — nothing to fix.

2. **Measure the LCP *after*, and put both numbers in the commit message.** The *before* already
   exists and is **not** measured again: `p.about-bio`, 2026-10-10, 390×844 **88 ms**, 958×888
   **152 ms**, 1440×900 **84 ms**. Measure the after at the same three viewports against
   `npm run dev`, through the chrome-devtools MCP — `emulate({ viewport: "390x844" })`, then the
   trace — and **record which element it was**: with the section below the hero, the after run
   confirms `p.about-bio` was **not** displaced. `resize_page` does not move `innerWidth`, and a width read
   mid-transition is a value that was never rendered (`AGENTS.md`).

   This is a **commit-message obligation, not a task**: it produces no artifact in the repo, no
   test asserts it, and no threshold is committed on purpose (D-13). Carry the caveat from plan
   §4.3 — if `main` has moved since 2026-10-10 the pair is not a clean A/B, and the message should
   say so rather than present two numbers as a controlled comparison.

---

## What no check settles, once

Straight from plan §7, so it is not rediscovered during validation: RF-5's *source* clause (D-7);
that a reader can verify a proof point (the author's judgement, per the spec's own *Definitions*);
that the section is **visible** — RF-1 asserts DOM order, not paint; the LCP delta; the line
measure (no guard in this repo measures a rendered line); the formerly-`h2`-first outline (D-4, a
decayed design cost, kept as record); and where the hairline lands (now between About and the
section; About borderless-first again). The `package.json` clause of RF-5 is unguarded
too, but `tests/seo.test.ts` already asserts `dependencies` and `devDependencies` by value, so it
is covered by an existing guard without a task.