# Tasks 002 — Social preview card

**Spec:** `specs/002-social-preview-card/spec.md` (**approved**, 8 RF). **Plan:**
`plan.md` (§1–§7, decisions D1–D8). **Runner:** `npm test` = `vitest --run tests`
(`package.json`). One file: `npx vitest --run tests/seo.test.ts`. Never bare
`npx vitest --run` — without the `tests` filter it picks up `e2e/about.spec.ts` (`AGENTS.md`).

**`package.json` is not touched by any task below.** No `scripts` entry, no dependency, one
file added to `devDependencies` that was already there: none. The generator runs as
`node --no-warnings scripts/og-cover.ts`.

**Nothing in this list opens a browser, and that is D2, not an accident.** `playwright` is
imported **dynamically inside `renderCard()`**, `renderCard()` is reachable only from
`main()`, and **no test calls it**. `.husky/pre-commit` runs `npm test` and **cancels the
commit on failure**, `playwright` and `@playwright/test` declare no `postinstall`, and the
browsers live outside the repo in `%LOCALAPPDATA%\ms-playwright`. A task that turns any of
this into a test that launches Chromium puts one image assertion between a fresh clone and
every commit in the project.

**Every guard below is proven by injection before it is called green** (constitution 4):
inject the violation, watch the named test go red, revert **the one path** the probe
touched. Never `git checkout -- .` — it restores from the index and throws away
uncommitted work without saying so (`AGENTS.md`).

**Three obligations are manual steps, not checkboxes** — the served `<head>`, card
freshness, and the drawn width of the name. They are listed after T-9 and must stay out of
this list: writing any of them as a task dresses a human obligation as an automated one.

- [x] **T-1 — Add `.ts` to the specifier in `src/data/about.ts:1`, then create
  `scripts/og-cover.ts` with `parseTokens()`, `readAbout()` and `readTokens()`, and export
  the readings as data**
  Cubre: RF-4; Language (non-functional)
  Archivos: `src/data/about.ts`, `scripts/og-cover.ts`, `tests/seo.test.ts`
  Hecho cuando: `npx vitest --run tests/seo.test.ts` is green on T-S4a, T-S4b and T-LANG —
  every exported token **equals the value the sheet declares, parsed by the test's own
  reader** (never the generator's `parseTokens`, or the check compares the generator against
  itself), comments stripped before that parse, the exported font paths are real files under
  `public/fonts/`, and T-LANG reads the generator's **source**: it imports `ABOUT` from
  `src/data/about.ts`, and contains no literal spelling of `ABOUT.name` or `ABOUT.title` —
  those two values read out of the data module and looked for as text, never typed into the
  test — and four probes each go red: rename `--brand-primary` in `public/styles/00-tokens.css`
  (red **on `undefined`**, under a second, no render); then add a comment naming that token
  and confirm it is **still red**, which is the six-guard failure mode reproduced on purpose;
  delete `scripts/og-cover.ts` (T-S4b fails by name, not by a stack trace); replace the
  `ABOUT` **import** with a hardcoded string (T-LANG red on both halves) — **and `npm run
  build` is green.** The pre-commit hook runs `npm test`, not the build, so this is the only
  thing that ever looks at `src/data/about.ts`; a change that breaks the Astro build would
  otherwise pass every hook in this repo. Revert each by the one file it touched.

  **Start with the one character, and it is the first line of the task, not an afterthought:**
  `src/data/about.ts:1` goes from `"./contacts"` to `"./contacts.ts"`. Node's resolver does
  not guess extensions, and without it `import { ABOUT }` dies on `ERR_MODULE_NOT_FOUND`
  before any type is stripped — type stripping was never the obstacle. The chain stops there:
  `about.ts:2` and `contacts.ts:1` are `import type`, which is erased. No `tsconfig.json`
  flag: `astro/tsconfigs/base` already sets `allowImportingTsExtensions: true` with
  `noEmit: true`. Restore the line afterwards by hand if a probe touched it — do not use
  `git checkout -- .`.

  **`readAbout()` imports, it does not parse** (plan D3): `import { ABOUT } from
  '../src/data/about.ts'`. A regex over that file would be a **second reading of a datum**,
  which is constitution 9, and one that could drift from the object it parses without
  knowing it. Do not write one.

  Every later guard imports these readings, so the module exists before anything checks it.
  The check settles RF-4 on **data** precisely because no check on an already-rendered PNG
  could ever see a token renamed.

  **`.ts` here buys editor support, not verification** (plan D8): node's type stripping
  *erases* types, so a wrong annotation runs without complaint, and nothing in this repo
  type-checks in any case. Write the annotations because a reader gets them — not because
  anything will enforce them.

- [x] **T-2 — Add `contrastRatio(fg, bg)` to the generator**
  Cubre: RF-7
  Archivos: `scripts/og-cover.ts`, `tests/seo.test.ts`
  Hecho cuando: `npx vitest --run tests/seo.test.ts` is green on T-S7, **both halves** —
  **(a)** `contrastRatio` reproduces three references whose correct answer is known, measured:
  black on white `21.0000`, white on white `1.0000`, `#767676` on white `4.5422`;
  **(b)** the ratio over the **exported** `palette: { accent, ground }` is asserted `>= 4.5`
  (6.66:1 today), and neither token **name** is written into the test — and **three probes,
  each red for its own reason**: draw on `--brand-accent-dark` instead (red on the ratio,
  4.4788); make the function `return 99` (red on **`21.0000`**, not on the `>= 4.5` it
  satisfies); drop the sRGB transfer function and average the bytes (red on **`4.5422`**, the
  one reference where the unexpanded average first disagrees). Revert by editing
  `scripts/og-cover.ts`.

  Takes values, never names. The number this replaces lived only in a comment on
  `themes/dark.css:35`, which is constitution 3 exactly.

  **Half (a) is not padding: a lone `>= 4.5` on the gold is satisfied by `return 99`, by a
  swapped numerator and by an unexpanded byte average alike**, while RF-7 says *computed*. The
  references are what make that word true, and each probe has to go red on its **own**
  reference — a check that fails on whichever assertion it reaches first has not shown which
  half broke.

  **`palette` was the implementation's call, not the plan's** (§3.3): the test may not name
  tokens, so the pair has to reach it as data. `readTokens` reads the two tokens the card
  draws with and exports them; the test reads `palette` and never learns which is which.

- [x] **T-3 — Add `fitFontSize(args)` to the generator, and drive it with an injected measure**
  Cubre: RF-8
  Archivos: `scripts/og-cover.ts`, `tests/seo.test.ts`
  Hecho cuando: `npx vitest --run tests/seo.test.ts` is green on T-S8a and T-S8b, and the
  guard **bites both ways**: T-S8a drives `fitFontSize` over `ABOUT.name` with a measure
  **that is a function of the text and the size** — it must report different widths for a
  different `text` or a different `sizePx` — and asserts `fit.lines === 1` and
  `fit.sizePx >= floorPx`, with the floor **read from `--fs-xs` in the sheet, not typed as
  `12` in the test**; T-S8b asserts `fits: false` under a measure that reports everything as
  too wide and the **largest** step under one that reports everything as narrow, both
  without editing `ABOUT`. Probes: make `fitFontSize` always return `sizesPx[0]`, and make it
  always return `floorPx` — **both go red on T-S8a**, and that pair is the reason the
  injected measure has to be a function of the text. A third probe wraps instead of reducing
  and reports `lines: 2`, which turns T-S8a red on the single-line assertion. Revert by
  editing `scripts/og-cover.ts`.

  **`measure` is a parameter, and the font engine is the injectable external here** — the
  same rule as a clock, and no function in this feature calls `new Date()`: a timestamp would
  make every run produce different bytes, so the diff of the PNG would carry no signal.

- [x] **T-4 — Add `cardHtml()`, `renderCard()` and `main()`: the one code path that launches a browser**
  Cubre: RF-4, RF-8
  Archivos: `scripts/og-cover.ts`
  Hecho cuando: `node --no-warnings scripts/og-cover.ts` exits 0, writes `public/og-cover.png`, and prints
  the chosen name size and the ratio; `git diff -- package.json` is empty afterwards;
  `cardHtml()` emits `white-space: nowrap` on the name rule (D6) and a `file://` URL in both
  `@font-face` `src` (a `/fonts/...` path here resolves against nothing and silently falls
  back to Times); `playwright` is imported **inside** `renderCard()` and nowhere at module
  scope (D5); `document.fonts.ready` is awaited after **both** `setContent` passes (D4); and
  the seven states of plan §5 behave — a missing token, a missing font file, an absent
  browser cache, an empty `ABOUT` field and a name too long for the floor each print and
  **exit non-zero before `writeFile`**, leaving the committed PNG untouched. Revert by editing
  `scripts/og-cover.ts`.

  **Two probes here are red-for-a-human, and saying otherwise would be the defect:** removing
  `white-space: nowrap` and pointing `@font-face` at `/fonts/...` turn **no automated test**
  red under D2 — only the drawn-width manual step below sees either. What *is* probed: replace
  `renderCard()`'s body with `throw new Error('browser reached')` and `npm test` **stays
  green**, which is what proves no test path reaches the browser.

- [x] **T-5 — Read the artifact in `tests/seo.test.ts` with `pngInfo()`, and assert the signature, the IHDR and the byte size**
  Cubre: RF-1, RF-2; Size (non-functional)
  Archivos: `tests/seo.test.ts`
  Hecho cuando: `npx vitest --run tests/seo.test.ts` is green on T-S1, T-S2 and T-SIZE —
  `public/og-cover.png` stats, bytes `89 50 4E 47 0D 0A 1A 0A`, first chunk `IHDR`,
  `width === 1200 && height === 630`, and under 5 MB — and three probes each go red: delete
  `public/og-cover.png`; emit a 1200×600 PNG; pad the file past 5 MB. Revert each by the one
  path it touched, `public/og-cover.png` included.

  Twelve bytes in, no dependency, and it reads **the file's own header** rather than a
  constant repeated in the test — which is the only reason RF-2 can fail on a 1200×600 card.

- [x] **T-6 — Settle all three of RF-6's claims inside one check on `BaseLayout.astro`**
  Cubre: RF-6
  Archivos: `tests/seo.test.ts`
  Hecho cuando: `npx vitest --run tests/seo.test.ts` is green on T-S6 — with comments stripped
  **first**, the check settles that `og:image` and `twitter:image` bind the same `content`
  expression, that the pathname that expression composes from `site` is `og-cover.png`, **and**
  that this same check stats that path and reads the PNG signature itself, **deferring to
  nothing** — and the probe goes red: point `twitter:image` at a different path. Revert by
  editing `src/layouts/BaseLayout.astro`.

  A source reader cannot follow the expression into a served `<head>`: `npm test` is
  `vitest --run tests`, no test in it renders a page, and `output: "server"` leaves `dist/`
  without HTML. This settles what the tags bind; the served `<head>` is a manual step below.

- [x] **T-7 — Guard both directory listings RF-5 names**
  Cubre: RF-5; Security (non-functional)
  Archivos: `tests/seo.test.ts`
  Hecho cuando: `npx vitest --run tests/seo.test.ts` is green on T-S5a and T-S5b in **one
  `describe`**, because it is one behaviour — `public/` holds `og-cover.png` and **no**
  `og-cover.html`, `.css` or `.js` beside it, and `src/pages/` gains no route matching
  `og-cover` — and two probes each go red: drop an `og-cover.html` into `public/`; add a
  route under `src/pages/` that serves the card. Revert each by the one path it added.

  The same listing settles the Security NFR: the card is the only file added to `public/`.
  **What this does not claim:** that the committed PNG was produced by the generator. Nothing
  in `npm test` can know that.

- [x] **T-8 — Assert `package.json`'s two dependency sets equal today's, by value**
  Cubre: RF-3
  Archivos: `tests/seo.test.ts`
  Hecho cuando: `npx vitest --run tests/seo.test.ts` is green on T-S3 — `dependencies` and
  `devDependencies` are asserted **equal to the current sets**, not "did not grow", because a
  removal is as much a dependency change as an addition — and the probe goes red: add any
  entry to either set in `package.json`. Revert by editing `package.json`.

  Constitution 1 and 7 stated on the artifact instead of in a comment. It sits after T-4
  because that is the task the claim is about.

- [x] **T-9 — *(mecánica)* Correct the README sentence that says nothing is written by hand**
  Cubre: ninguno — no RF covers a README line; the spec names it under *Out of scope* as
  implementation work
  Archivos: `README.md` (`README.md:110-111`)
  Hecho cuando: `npm test` and `npm run build` are green, and the sentence no longer claims
  `og-cover.png` is written by hand while it is generated — **the file name stays**: once the
  card ships, "nothing is written by hand" is true on its own, so deleting the line would lose
  the claim rather than fix the lie. Revert by editing that one file.

---

## Manual steps — obligations, **not** tasks

No checkbox here. Each is stated in the spec's *Done when* and in plan §7 as something
`npm test` cannot reach, and turning any of them into `T-S8c` would dress a human obligation
as an automated one.

1. **The served `<head>`.** With a dev server up, open a page in a browser against a real
   parser: `og:image` and `twitter:image` present and resolving to `/og-cover.png`. A card that
   exists, is the right size, and is pointed at by a meta tag that never arrives satisfies
   every automated check in this spec and reaches nobody.
2. **Card freshness.** Run `node --no-warnings scripts/og-cover.ts` and look at what comes out against the
   committed PNG — and **look at the card at 1200×630 before it is committed**, because a
   raster artifact nobody has seen is not verified. No assertion can distinguish a stale card
   from a fresh one; this is a human obligation by design, not a guard nobody wrote.
3. **The drawn width of the name.** Open `public/og-cover.png` at 1200×630 in a browser
   against a real parser: one line, no overflow past the content width, at the size the
   generator reported. This is the blind spot D2 accepts — it needs a font engine, and T-3's
   measure is injected, so the suite settles the arithmetic and never sees the real font.