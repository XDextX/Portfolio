# Spec 002 — Social preview card

**Status:** implementada

**Aprobada:** 2026-10-09 · 16 bloqueantes de /sdd-clarify corregidos, los 16; 6 RF pasaron a 8 (RF-7 contraste del acento sobre el suelo, RF-8 el nombre de ABOUT que no cabe en 1200px); RF-4 y RF-5, que no podían ponerse rojos, ahora tienen inyección real; 0 [NEEDS CLARIFICATION] abiertos tras resolver tres decisiones (fondo --brand-primary #243972, tarjeta siempre oscura, el nombre reduce hasta que cabe) · 218 líneas, 8 RF
**Aprobada:** 2026-10-09 · re-aprobación; el guard 4 se cumplió y está bien. 218 → 235 líneas por la opción C del usuario, que reformuló el check de RF-8 para que no exija un motor de fuentes — el ancho dibujado solo lo mide un navegador, `.husky/pre-commit` corre `npm test` y cancela el commit si falla, y `playwright` y `@playwright/test` no declaran `postinstall`, con los navegadores fuera del repo. El ancho pasó de afirmación a paso manual en *Done when*, y RF-8 afirma ahora una sola línea y un piso `--fs-xs` · 236 líneas, 8 RF
**Aprobada:** 2026-10-09 · re-aprobación; el guard 4 se dispara otra vez y está bien: el crecimiento son tres cambios medidos y aprobados uno por uno, no deriva. RF-4 cambia de fundamento — el generador **importa** `ABOUT` de `src/data/about.ts` en vez de parsearlo con una regex, y la razón anterior («bare `node` no carga TypeScript») era falsa: un `.mjs` importa un `.ts` sin problema. El alcance crece **un carácter** (`src/data/about.ts:1`, `./contacts` → `./contacts.ts`, medido con la línea aplicada y restaurada), así que `src/**` deja de ser *untouched* y la spec lo dice en RF-4 y en *Out of scope*. Y el check de Language se sustituye por uno que puede ponerse rojo: el anterior comparaba el valor consigo mismo, verde para cualquier implementación; el nuevo lee el fuente del generador y lo contrasta con valores salidos del módulo de datos · 256 líneas, 8 RF
**Aprobada:** 2026-10-09 · re-aprobación; el guard 4 se dispara otra vez y está bien: el crecimiento son dos cambios medidos y aprobados, no deriva. **RF-7 gana la mitad que falsifica la fórmula** antes de afirmar el umbral sobre el par exportado — `#000000` sobre `#FFFFFF` da 21, `#FFFFFF` sobre `#FFFFFF` da 1, y `#767676` sobre `#FFFFFF` da 4.5422 (los tres recomputados al firmar: 21, 1 y 4.5422 exactos): un `>= 4.5` a secas también lo cumple un `return 99`, un numerador intercambiado o una media de bytes sin expandir, y RF-7 dice *computed*. **Y un número era una truncalización**: decía `6.65:1` y el valor real es 6.6568, que redondea a **6.66** — corregido en `spec.md`, `plan.md` y `tasks.md`; el `4.48` de `--brand-accent-dark` estaba bien y no se tocó · 269 líneas, 8 RF
**Implementada:** 2026-10-10 · commit `815d67e` · 9/9 tareas, `npm test` 127/127, `npm run build` verde · los 8 RF con un check que **se puso rojo**: 17 sondas de inyección nombradas en ese commit, que es lo que constitution 1 pide como prueba («the commit names it») · los tres pasos manuales verificados **a mano**, no por el runner: el `<head>` servido leído en el DOM a 1280×900 y 390×844, la tarjeta regenerada **byte a byte idéntica** (`16377F6C…`, 14460 B), y el nombre medido en **632px dentro de 1072px de contenido, una línea, 440px de sobra**, a 52px · el PNG es reproducible —tres corridas, un hash—, así que el paso de frescura compara algo · **lo que esto no prueba:** que el PNG commiteado lo escribiera el generador, y que las etiquetas lleguen al `<head>` de una página servida. Ambos son los pasos manuales, y ningún test de `npm test` renderiza una página · 270 líneas, 8 RF

## Context and goal

`BaseLayout.astro` publishes `og:image` and `twitter:image` pointing at
`${site}/og-cover.png`. That file has never existed: `public/` contains **zero** raster
images, so every share of this site resolves a 404 and renders a broken or empty card.
`README.md:111` documents the same nonexistent file.

The goal is a real 1200×630 card in the site's own visual language, rendered from the
site's own CSS and fonts so it cannot drift from them. **The renderer travels with the
repo**: the card is produced by a committed generator, run with `node --no-warnings scripts/og-cover.ts`.
That is what turns "cannot drift from them" into something a test can see — a PNG pasted
into `public/` with no generator beside it leaves RF-4 nothing to import.

What it does **not** make automatic is freshness. A card pasted in *beside* a generator
that nobody runs satisfies every automated check in this document; see RF-5 and *Done
when*, where that is stated as a human obligation rather than papered over with a guard.

## Actors

Two, both indirect. The person sharing the link, who chooses not to share when the card
is broken; and whatever platform renders the preview, which silently drops an image it
cannot fetch. No one on the site itself sees this.

## User stories

- US-1: As someone sharing a link to this portfolio, I want the preview to show the site
  so that the link is worth clicking.

## Requirements (EARS)

Every RF check below lands in `tests/seo.test.ts`, where the rest of the SEO is guarded:
none of them touches the personal data `tests/about.test.ts` holds, so this spec and 004 do
not end up fighting over one file. The two non-functional checks land there too, and the
language one names the generator itself — `tests/visual-language.test.ts:180` walks
`src/**/*.astro|ts` only, so a generator outside `src/`, or in another extension, sits
outside the constitution-9 guard entirely.

- **RF-1: THE SYSTEM ships the card at `public/og-cover.png`.** The path is not a
  convention: `og:image` composes `${site}/og-cover.png` (`BaseLayout.astro:28`) and Astro
  serves `public/` verbatim, so that is the only pathname that can answer it.
  — **Check:** `tests/seo.test.ts` stats that path in the working tree and reads its PNG
  signature and its IHDR dimensions. **A stat proves a file is in the tree; it does not
  prove a server answers 200 for it.** The served response is a manual step, below.

- **RF-2: THE SYSTEM builds the card at 1200×630.** — **Check:** the same IHDR read in
  RF-1. 630 is the platform-recommended height for a 1.91:1 card; a square image gets
  centre-cropped by X and Slack. The dimensions are a property of the artifact here;
  publishing them again as tags is out of scope.

- **RF-3: THE SYSTEM adds no runtime and no build dependency to produce the card.**
  — **Check:** `package.json` `dependencies` and `devDependencies` grow by nothing, which
  is constitution 1 and 7 stated on the artifact instead of in a comment.

- **RF-4: THE SYSTEM draws the card from the site's own tokens and fonts, and the
  generator that draws it travels with the repo.** The generator is committed at
  `scripts/og-cover.ts` and is run directly — `node --no-warnings scripts/og-cover.ts` — with **no
  `package.json` `scripts` entry`: the eight entries there are wrappers for tools this
  project installs, and a wrapper around a file in the repo is not one of those. It adds no
  dependency; the browser comes from the `playwright` already in `devDependencies`, so RF-3
  stands. **The generator takes the name and the role by importing `ABOUT` from
  `src/data/about.ts`**, the same module the site itself imports, so the card reads the
  identity rather than restating it: no regex over the data file, and therefore no second
  reading of the identity that could drift from the first without noticing (constitution 9).
  **The generator exports, as data, every token value it read, the font file it
  loaded, and the strings it drew.**
  **One `src/` edit is required for that import to resolve, and it is one character:**
  `src/data/about.ts:1` names `./contacts` without its extension, which bare `node` does not
  resolve. This spec therefore touches `src/`, where it said it would not — stated here
  rather than contradicted further down, and the change is that character, not a rewrite.
  — **Check:** a **data** check in `tests/seo.test.ts` imports that export and compares it
  against `public/styles/00-tokens.css`: each exported token must equal the value the
  stylesheet declares, and the exported font path must be a real file under `public/fonts/`.
  Renaming `--brand-primary` makes the generator read `undefined` and turns this check red
  in a second, **without rendering anything** — which is the whole reason the generator
  exports its readings instead of the check asserting on the produced PNG. Renaming a token
  in the stylesheet does not change a PNG that was already rendered, so no check on the
  artifact could ever have caught it.
  **No substring search for a token name anywhere in this check**: a comment naming
  `--brand-primary` would satisfy a grep while the generator read nothing, which is the
  failure mode `AGENTS.md` documents in six guards.

- **RF-5: THE SYSTEM adds nothing that renders the card in the visitor's browser.** What
  the browser fetches statically is `public/` verbatim, and a route that served the card
  would live in `src/pages/`; neither may appear for this.
  — **Check:** one behaviour over two directory listings in `tests/seo.test.ts` — `public/`
  holds `og-cover.png` with **no** `og-cover.html`, stylesheet or script beside it, and
  `src/pages/` gains no route matching `og-cover`.
  **What this check does not claim:** that the committed PNG was produced by the generator
  of RF-4. Nothing in `npm test` can know that — a stale card and a fresh one are the same
  bytes to every assertion here. **Card freshness is a human obligation**, and *Done when*
  carries the step.

- **RF-6: THE SYSTEM points `og:image` and `twitter:image` at that same file.**
  — **Check:** a data check in `tests/seo.test.ts` reads `BaseLayout.astro` and settles
  three things **inside this check, deferring to nothing**: both tags bind the same
  `content` expression (`BaseLayout.astro:54` and `:62`); the pathname that expression
  composes from `site` is `og-cover.png`; and this check stats the file at that pathname
  and reads its PNG signature itself. A source reader **cannot follow the expression into a
  served `<head>`** — `npm test` is `vitest --run tests` and no test in it renders a page,
  `output: "server"` meaning `dist/` holds no HTML — so this settles what the tags bind,
  and the served `<head>` is a manual step below.

- **RF-7: THE SYSTEM draws the accent on the card's ground at a contrast ratio of at least
  4.5:1, computed from the token values rather than assumed.** The ground is
  `--brand-primary` (`#243972`), the accent is `--brand-accent` (`#E3C770`), and those give
  **6.66:1** (measured, not truncated). That number today lives only in a comment on
  `dark.css:35`, which is constitution 3 exactly: a mechanical rule with no guard.
  — **Check:** a data check in two halves. First it **falsifies the formula** against
  references whose right answer is known — black on white **21:1** (the WCAG maximum) and
  white on white **1:1** (the minimum) — so a constant or a swapped numerator cannot pass a
  check whose own wording says *computed*. Then it computes the ratio from the two values the
  generator exported (RF-4) and asserts ≥ 4.5:1.
  **From the exported pair, not from two names hardcoded here**: a card redrawn on the
  darker gold then turns this check red instead of passing unnoticed.
  **The threshold grey is in that first half for a reason of its own**: `#767676` on white is
  **4.5422:1**, the canonical grey just over 4.5, and it is the only one of the three that
  detects a **dropped sRGB transfer function** — a byte average without expanding gives a
  different number exactly there, which is where this gold lives.

- **RF-8: WHEN the name from `ABOUT` does not fit the card, THE SYSTEM draws it on one
  line, reduced until it fits.** It never wraps to a second line and never truncates.
  — **Check:** a data check on the generator's own exported fit (RF-4) asserts the two
  numbers it reports, and neither needs a font engine: the drawn name is **a single
  line**, and the **size it chose is not below `--fs-xs`**, the smallest step the type
  scale defines (`00-tokens.css:39`).
  **The drawn width is no longer asserted, and this replaces the earlier claim that it
  was.** Measuring a rendered width needs a font engine, which means a browser inside
  `npm test`; `.husky/pre-commit` runs `npm test` and cancels the commit when it fails,
  and the browsers live outside the repo in `%LOCALAPPDATA%\ms-playwright`, so on a
  machine that never ran `npx playwright install` one image assertion would block every
  commit in the project.
  **The floor is what keeps this check from being one that cannot fail**: a name that does
  not fit even at `--fs-xs` has no honest rendering at 1200px, and the check goes red rather
  than shipping a 6px name. A name that merely needs a smaller size stays green — that is
  the behaviour working, not the guard failing.
  **What this check does not claim — and this is the hole the narrower check leaves: that
  the size it chose actually fits.** The fit is driven by an injected measure, so the check
  proves the loop and the two numbers and cannot see the real font. A change that makes the
  name overflow without touching the size it reports — different padding, a different family
  or weight, a different font file — stays green here. Manual step below.

## Non-functional requirements

- Security: nothing fetched at runtime. The card is a local file, like the fonts.
  — **Check:** the `public/` listing RF-5 already reads — the card is the only file added
  there, and no script or stylesheet joins it.
- Size: under 5 MB, the platform ceiling. A 1200×630 flat-colour PNG lands far below.
  — **Check:** `tests/seo.test.ts` stats `public/og-cover.png` and asserts it is under
  5 MB.
- Language: the card shows the visitor-facing name and role from `ABOUT`, never a literal.
  Spelling either out here would be a second source for the identity (constitution 9).
  — **Check:** `tests/seo.test.ts` reads the generator's **source** and asserts it imports
  `ABOUT` from `src/data/about.ts`, and that it contains no literal spelling of `ABOUT.name`
  or `ABOUT.title` — both values read out of the data module and looked for as text, never
  typed into the test. Replacing the import with a hardcoded string goes red on the missing
  import and on the literal's presence at once.
  **The form this check used to have does not work any more, and the reason matters:** it
  compared the generator's exported strings against the `ABOUT` the test imports, and once
  the generator imports `ABOUT` too, that compares a value with itself — it passes for any
  implementation and can never go red. The generator is named explicitly in this check for
  the reason given above the requirements.

## Edge cases

- **The name is long, and the card is 1200px wide.** RF-8 settles it: one line, reduced
  until it fits, floor `--fs-xs`. The one case neither answer covers is a name too long to
  fit even at the floor, and RF-8's check is what says so — the spec does not pick a
  fallback for it, because there is none that is not a fourth answer nobody was asked for.
- Chromium is already installed for Playwright, but the cache lives in
  `%LOCALAPPDATA%\ms-playwright`. On a machine without it the card cannot be produced; that
  is a documented prerequisite, not a silent fallback to a blank card.

## Out of scope

- **Beyond that one character, `src/` is untouched.** RF-4 needs `src/data/about.ts:1` to name
  `./contacts.ts` so its `ABOUT` import resolves; nothing else in `src/` changes — no route,
  no component, no data, no behaviour. The one-character edit is named in RF-4 rather than
  hidden here, because it is the only way this spec reaches `src/` at all.
- **The avatar stays remote.** `specs/001-self-host-avatar/` was rejected on purpose and this does not
  reopen it. Note the interaction: with no local raster image other than this card, a
  platform that finds no usable `og:image` falls back to the first `<img>` on the page,
  which is the remote GitHub avatar. Removing `og:image` (the rejected alternative) would
  have handed those cards to the avatar instead.
- Multi-language cards. One card, no locale variants.
- **`README.md:110-111` is corrected in the implementation, not by removing the file
  name.** It says nothing is written by hand and that the image is `og-cover.png`, over a
  file that does not exist: the sentence is what lies, not the name. Once the card ships
  the sentence is true on its own, so deleting it would lose the claim — the line that
  needs changing is the "nothing is written by hand" one.
- **`og:image:width`, `og:image:height` and `og:image:type`.** RF-2 owns the dimensions as a
  property of the artifact, read from its IHDR. Publishing them again as tags would be three
  more assertions nothing checks.
- Video (`og:video`), `og:image:alt`, and the `summary_large_image` → `summary` card-size
  debate. Adding tags that nothing tests is how `og:image` broke in the first place.

## Done when

- `npm test` (`vitest --run tests`) and `npm run build` green.
- Every new guard proven by injection, one probe per RF — constitution 4:
  - **RF-1** — delete `public/og-cover.png` and watch it go red.
  - **RF-2** — emit a 1200×600 PNG and watch it go red on the IHDR.
  - **RF-3** — add a dependency to `package.json` and watch it go red.
  - **RF-4** — rename `--brand-primary` in `00-tokens.css` and watch it go red **on
    `undefined`**, within a second and with no render; then add a comment naming the token
    and confirm it does **not** turn the check green.
  - **RF-5** — drop an `og-cover.html` into `public/`, and separately add a route under
    `src/pages/` that serves the card; both go red.
  - **RF-6** — point `twitter:image` at a different path and watch it go red.
  - **RF-7** — three probes, each red **for its own reason**: swap the card's accent for the
    darker gold in the generator and watch it go red on the computed ratio; make
    `contrastRatio` `return 99` and watch it go red on the **21** reference, not on the
    `>= 4.5` assertion; drop the sRGB transfer function and watch it go red on **4.5422**,
    not on the gold. A check that goes red on whichever assertion it hits first has not
    proved which half it broke.
  - **RF-8** — put a name in `ABOUT` too long to fit even at `--fs-xs` and watch it go red
    on the floor; then make the generator wrap instead of reduce, and watch it go red on the
    single-line assertion. A name that only needs a smaller size stays green, and that is the
    behaviour working.
  - **Size** — pad the PNG past 5 MB and watch it go red.
  - **Language** — put a literal in place of the `ABOUT` read in the generator and watch it
    go red.
- **The three things `npm test` cannot reach, done by hand as stated manual steps:**
  - **The served `<head>`**, in a browser against a real parser: `og:image` and
    `twitter:image` present and resolving to `/og-cover.png`. A card that exists, is the
    right size, and is pointed at by a meta tag that never arrives satisfies this spec and
    reaches nobody. Spec 004 verified its reachable cases by hand in the same way.
  - **Card freshness, which is a human obligation and deliberately not a guard.** Run
    `node --no-warnings scripts/og-cover.ts` and look at what comes out against the committed PNG. No
    assertion can tell a stale card from a fresh one, and this spec does not pretend to.
  - **The drawn width of the name**, the first blind spot in this spec that needs a font
    engine. Whoever runs the generator opens `public/og-cover.png` at 1200×630 in a browser
    against a real parser and looks at the name: one line, no overflow past the content
    width, at the size the generator reported. The automated check drives the fit with an
    injected measure, so it settles the arithmetic and cannot settle this.
- The card is looked at, at 1200×630, before it is committed — a raster artifact that
  nobody has seen is not verified.

## Open questions

None open. All four design questions were answered:

- **PNG**, not SVG (2026-10-06). Facebook and X do not reliably render SVG in `og:image`,
  and those are the two platforms that matter for a portfolio.
- **Name + role** (2026-10-06): the name in the large weight, `ABOUT.title` in small mono
  underneath. The name is what someone recognises; the role says whether the click is worth
  it. Both are read from `ABOUT`, never spelled out here.
- **Ground: `--brand-primary`, `#243972`** (2026-10-09). `--bg` was discarded because it is
  the ground *behind* the sheet, not the sheet. `--main-bg` carries the same navy in dark
  but is theme-dependent — it is `#FBFCFD` in `light.css:10` — and a ground that changes
  with the theme is the variant that was not wanted.
- **A name that does not fit reduces** (2026-10-09): one line, reduced until it fits, never
  wrapped and never truncated. RF-8 guards it.

**The card is therefore always dark, and that costs nothing.** `--brand-primary` is declared
once, at `00-tokens.css:3` inside `:root`, and neither theme file redefines it — verified,
and the reason this answer needs no second file, no second accent and no per-theme decision.
A theme-varying card would have needed one, since the gold is 1.35:1 on the light ground
(note at `00-tokens.css:18`).

`Status` stayed `borrador` at the time: closing the questions is not approving the spec.
