# Plan 002 — Social preview card

Spec: `specs/002-social-preview-card/spec.md` (**approved**, 8 RF). This plan is the
*how*; it names files, signatures and the checks that settle each RF. It changes no
requirement. Where the spec is silent and a choice had to be made, the choice is in
section 6 with its discarded alternative.

Nothing here touches `src/`, and `package.json` is not modified: no `scripts` entry, no
dependency. The generator runs as `node --no-warnings scripts/og-cover.ts`.

---

## 1. Scope and coverage

`§N` is section N of this plan · `T-S…` is the ID of a test task in §7

| RF | What has to be true | Where in this plan |
|---|---|---|
| RF-1 | `public/og-cover.png` exists with a real PNG signature | §2 (`public/og-cover.png`), §7 *T-S1* |
| RF-2 | the card is 1200×630, read from IHDR | §2, §4.5, §7 *T-S2* |
| RF-3 | `dependencies` and `devDependencies` grow by nothing | §2 (`scripts/og-cover.ts` uses `playwright`), §7 *T-S3* |
| RF-4 | the card is drawn from the site's tokens/fonts and the generator travels with the repo; it exports its readings | §2, §3.1–§3.2, §4.1–§4.3, §7 *T-S4a/T-S4b* |
| RF-5 | nothing renders the card in the visitor's browser | §2 (the two listings), §7 *T-S5a/T-S5b* |
| RF-6 | `og:image` and `twitter:image` bind the same file | §7 *T-S6* |
| RF-7 | accent over ground ≥ 4.5:1, **computed**, and the formula itself falsified against known references | §3.3 (and `palette` in `Readings`), §7 *T-S7* |
| RF-8 | the name is one line, reduced until it fits, floored at `--fs-xs` | §3.4, §4.4, §5, §7 *T-S8a/T-S8b* |
| Size | under 5 MB | §7 *T-SIZE* |
| Language | the drawn strings come from `ABOUT`, never a literal | §3.2 (`readAbout` imports it), §7 *T-LANG*, now a source-reading check — the value-comparison form it replaced was tautological once the generator imported `ABOUT` |
| Security | the card is the only file added to `public/` | §7 *T-S5a* (the same listing) |

Two things no section of this plan can cover, because `npm test` renders no Astro page
and `output: "server"` leaves `dist/` without HTML: **the served `<head>`** and **card
freshness**. Both stay manual steps from the spec's *Done when*, and neither is papered
over with a guard that cannot bite. §7 states them as such.

---

## 2. Files

| File | Status | Responsibility |
|---|---|---|
| `scripts/og-cover.ts` | **created** | Reads the site's tokens and fonts and **imports** `ABOUT`; draws the card; writes `public/og-cover.png`; **exports its readings as data**. The only file that knows what the card looks like. |
| `public/og-cover.png` | **created** (binary) | The artifact. Committed. Never edited by hand. |
| `tests/seo.test.ts` | **modified** | Gains this spec's checks. Already the home of the SEO guards; it does not touch `tests/about.test.ts`, which holds the personal data. |
| `README.md:110-111` | **modified** (implementation) | Corrects the sentence that says nothing is written by hand, over a file that does not exist. The filename stays: once the card ships the claim is true. Named in the spec's *Out of scope* as implementation work, so it appears here only for traceability. |
| `src/data/about.ts` | **modified — one character** | Line 1's specifier gains its `.ts` so `import { ABOUT }` resolves under bare node (§6-D3). Additive, no behaviour change, and the only `src/` edit in this plan. |
| `src/**` otherwise, `package.json`, `tsconfig.json` | **untouched** | No route, no component, no data, no dependency, no `scripts` entry, no config flag. |

`scripts/` does not exist today; this plan creates it with one file.

### Boundaries the generator must hold

- Reads: `public/styles/00-tokens.css`, `public/styles/05-fonts.css`, `public/fonts/*.woff2`,
  **imports** `src/data/about.ts`, and writes `public/og-cover.png`.
- Writes **nothing else**. No sidecar file, no JSON next to the PNG. §6-D2 says why.
- Imports `playwright` **dynamically inside `renderCard()`**, never at module scope, so
  importing the module in a test loads no browser driver (§6-D5). **No test calls
  `renderCard()`**: `npm test` opens no browser, before or after D2 (§6-D2).
- Never reaches the network. Chromium reads local files only; the NFR "nothing fetched at
  runtime" holds for the generator as well as the site.

---

## 3. Pure logic

Every function here is deterministic and takes what it needs as an argument. The clock
rule has a specific consequence for this feature, stated so it is not a silent omission:

> **This feature has no "today".** No function calls `new Date()`. The card carries no
> date, and that is the decision, not an oversight: a timestamp would make every run
> produce different bytes, so `git status` would be dirty after anyone regenerates and a
> diff of the PNG would carry no readable signal. The injectable external that does exist
> here is **the font engine**, and it is a parameter (`measure`) exactly as a clock would be.

### 3.1 Token reading — `parseTokens(css: string): Record<string, string>`

```ts
/** Every `--name: value` in the sheet, comments removed first. */
parseTokens(css: string): Record<string, string>
```

Comments go before parsing, never after: `00-tokens.css:8-12` and `:18-21` name
`--brand-primary` and the gold inside prose, and a parser that read raw text would pick up
a token name from a note explaining why a token exists. This is the brace-in-a-comment
family from `AGENTS.md`, one level up.

### 3.2 `readTokens(sheetDir: string): Readings` *(impure: reads a file)*

```ts
interface Readings {
    tokens:  Record<string, string>;   // name -> value, verbatim from the sheet
    fonts:   string[];                 // root-absolute paths under /fonts, e.g. '/fonts/IBMPlexSans-latin.woff2'
    content: { name: string; role: string };  // read from ABOUT, never typed here
    geometry: { widthPx: 1200; heightPx: 630; paddingPx: number; contentWidthPx: number };
    type:    { baseSizePx: number; floorSizePx: number; familySans: string; familyMono: string };
    palette: { accent: string; ground: string };  // the pair RF-7 feeds to contrastRatio
}
readTokens(sheetDir: string): Readings
```

`content` comes from `readAbout()`, which **imports** `src/data/about.ts` —
`import { ABOUT } from '../src/data/about.ts'` — and lifts `name` and `title`. There is no
parser, no regex and no source read of the data file: it reaches the same object the site
itself imports (§6-D3). It is a plain read of an imported value, so it is **not testable by
calling it and comparing to `ABOUT`** — that would compare a value with itself. §7 *T-LANG*
therefore checks the generator's source instead, and says what it can and cannot settle.

### 3.3 `contrastRatio(fg: string, bg: string): number`

```ts
/** WCAG 2.x relative-luminance ratio from two hex values. Pure, no I/O. */
contrastRatio(fg: string, bg: string): number
```

Two `#RGB`/`#RRGGBB` values in, a ratio out. Takes values, never names: the exported
`--brand-primary`/`--brand-accent` pair feeds it, so redrawing the card on
`--brand-accent-dark` turns the check red rather than passing unnoticed. The two names are
never written into the test.

**Where the pair is put together is a decision the implementation took, not one this plan
made.** §4.5 had the name lookup in `main()`, and the test is forbidden from naming tokens —
so the pairing could not happen there either: whatever assembled `{fg, bg}` out of token
*names* would have to be either in the generator, where the test cannot see it, or in the
test, where the names would be written down. **It lives in `readTokens`, as an exported
`palette: { accent, ground }` on `Readings`** (§3.2). That is the only shape where the pair
reaches the check as *data* without either side naming a token: the generator reads the two
tokens it draws with, and the test reads `palette` and never knows which is which.

**And `>= 4.5` on one pair is a check a constant passes.** `return 99`, a swapped numerator,
or a byte average without expanding all satisfy RF-7 as it stood, while RF-7 says
*computed*. §7 *T-S7* therefore has two halves; the second exists because of the first.

### 3.4 `fitFontSize(...)` — RF-8, the pure half

```ts
interface Measure { (text: string, sizePx: number): number }   // width in px

fitFontSize(args: {
    text: string;
    measure: Measure;             // the font engine, injected — never reached for inside
    maxWidthPx: number;           // the card's content width
    sizesPx: number[];            // descending type-scale steps, largest first
    floorPx: number;              // --fs-xs, the smallest step the scale defines
}): { sizePx: number; widthPx: number; fits: boolean; lines: 1 }
```

Returns the **largest step in `sizesPx`** at which `text` fits `maxWidthPx`, and `fits:
false` when even `floorPx` overflows. `lines` is `1` by construction — this function never
returns a wrapping size, and §4.4 is where the assertion of that lives.

`measure` is why this function is testable at all. In `main()` it is backed by Chromium's
text measurement; in the check it is a plain function of the text and the size. The
algorithm never learns where the number came from — which is the whole of D2, and the reason
RF-8 can be guarded at all without a browser in `npm test`.

---

## 4. Algorithm

Pseudocode for the four parts that are not obvious. Names match §3.

### 4.1 Reading the sheet — `readTokens`

```
tokens := parseTokens(readFile('public/styles/00-tokens.css'))
stripComments runs INSIDE parseTokens, before any match

required := ['--brand-primary', '--brand-accent', '--font-sans', '--font-mono', '--fs-xs']
for name in required:
    if name not in tokens:            # absent, not empty: '' is not a value
        fail(`${name} is not declared in 00-tokens.css`)

fonts := ['/fonts/IBMPlexSans-latin.woff2', '/fonts/IBMPlexMono-latin-400.woff2']
for f in fonts:
    if not isFile('public' + f): fail(`missing font ${f}`)
    # latin only. The -latin-ext face exists and is never named here; the card draws
    # the name and the role, both in the basic Latin block.

floorSizePx := pxFromRem(tokens['--fs-xs'], rootPx=16)      # 0.75rem -> 12
baseSizePx  := pxFromRem(tokens['--fs-4xl'], rootPx=16)      # 3.25rem -> 52
```

`required` is a **subset** of the sheet's tokens, not the sheet. The generator reads what
it draws with and exports those; it does not re-export the whole `:root`, because a token
it does not draw with has no business in its readings.

### 4.2 Building the card's HTML — `cardHtml(readings)`

```
html := '<!doctype html><html><head><meta charset="utf-8"><style>'
       + '@font-face for each font in readings.fonts   # file:// url, NOT a /fonts path
       + 'body { margin:0; width:1200px; height:630px; background:' + ground + '; ... }'
       + '.name { font-size:' + fitted + 'px; white-space:nowrap; }'
       + '</style></head><body>'
       + '<h1 class="name">' + escape(name) + '</h1>'
       + '<p class="role">' + escape(role) + '</p>'      # --font-mono, small
       + '</body></html>'
```

Two details that are load-bearing:

- **`white-space: nowrap` is what makes "one line" a property of the markup** rather than
  a hope about the text. RF-8 says the name never wraps; this is where that is decided,
  and the injection that proves it is *removing this declaration*, not editing the text.
- **`@font-face` points at a `file://` URL**, because the page is `setContent`d, not
  served. A `/fonts/...` path here resolves against nothing and silently falls back to
  Times — the exact failure `05-fonts.css:1-5` exists to prevent.

### 4.3 Screenshotting — `renderCard(readings)`

```
async renderCard(readings):
    { chromium } := await import('playwright')       # dynamic, so importing the
                                                    # module in a test costs nothing
    browser := await chromium.launch()
    try:
        page := await browser.newPage({
            viewport: { width: readings.geometry.widthPx,
                        height: readings.geometry.heightPx },
            deviceScaleFactor: 1,                   # 1200x630 in the IHDR, not 2400x1260
        })
        await page.setContent(cardHtml(readings), { waitUntil: 'load' })
        await page.evaluate(() => document.fonts.ready)   # measure before drawing

        measure := (text, sizePx) => page.evaluate(
            ([t, s]) => {
                probe := document.createElement('span')
                probe.textContent = t
                probe.style.cssText = 'position:absolute;visibility:hidden;' +
                    'white-space:nowrap;font-size:' + s + 'px'
                document.body.append(probe)
                w := probe.getBoundingClientRect().width
                probe.remove()
                return w
            }, [text, sizePx])

        fit := fitFontSize({ text: name, measure,
                             maxWidthPx: contentWidthPx,
                             sizesPx: [52, 40, 32, 24, 20, 16, 13, 12],
                             floorPx: floorSizePx })
        if not fit.fits:
            fail(`the name does not fit even at --fs-xs (${floorPx}px): ` +
                 `${fit.widthPx}px in ${contentWidthPx}px. Nothing is written.`)

        await page.setContent(cardHtml(readings, fit.sizePx), { waitUntil: 'load' })
        await page.evaluate(() => document.fonts.ready)   # fonts again: the size changed

        buffer := await page.screenshot({ type: 'png' })
        writeFile('public/og-cover.png', buffer)
        return { ...readings, fit }         # the export: what was read AND what was drawn
    finally:
        await browser.close()
```

`setContent` runs **twice**: once to measure, once to draw. The single-page alternative —
measure, then set one `font-size` on the live element — is the discarded option in §6-D4,
and the reason is that `document.fonts.ready` after a size change is a second layout the
single-pass version silently races.

This is the **only** code path in the plan that launches a browser, and `main()` is its only
caller. The check never reaches it: it drives `fitFontSize` (§3.4) directly with its own
measure, which is what D2 buys — the algorithm is separated from the engine precisely so the
suite can settle it without one.

### 4.4 Reading the artifact — the test's `pngInfo`

```
function pngInfo(file: string): { width: number; height: number; bytes: number }
    buf := readFile(file)
    assert signature is 89 50 4E 47 0D 0A 1A 0A        # PNG magic
    assert buf[12..15] == 'IHDR'                        # first chunk is IHDR
    width  := buf.readUInt32BE(16)
    height := buf.readUInt32BE(20)
```

Twelve bytes in, no dependency, and it reads the **file's own header** rather than a
constant repeated in the test — which is what makes RF-2 able to fail on a 1200×600 card.

### 4.5 `main()`

```
main():
    readings := readTokens(join(repoRoot, 'public', 'styles'))
    result   := await renderCard(readings)
    console.log(`og-cover.png written · ${result.fit.sizePx}px name · ` +
                `${contrastRatio(tokens['--brand-accent'],
                                 tokens['--brand-primary']).toFixed(2)}:1`)
```

Every failure in §5 exits **non-zero from `main()` before `writeFile` is reached**. The
committed card is never truncated or half-written by a failed run.

---

## 5. Interface

The card's states. **1** and **2** are the only ones a visitor ever sees; **3**–**7** are
states of the *generator*, and each one fails loudly rather than producing a card that
looks like a decision.

| # | State | What the visitor gets | What the run does |
|---|---|---|---|
| 1 | The name fits at `--fs-4xl` (52px) | 1200×630, navy ground, name in white at 52px, role in Plex Mono underneath in the gold | writes the PNG, exits 0 |
| 2 | The name does not fit at 52px but fits lower | **The same card, name reduced to the largest scale step that fits, still one line** — RF-8's working behaviour, not a fallback | writes the PNG, exits 0, logs the chosen size |
| 3 | The name does not fit even at `--fs-xs` (12px) | **the previously committed card, untouched** | prints the measured width, the content width and the floor, exits 1, **writes nothing**. Not a 6px name, not an ellipsis, not a second line — the spec names no fallback because there is none to name |
| 4 | A required token is missing or empty in `00-tokens.css` | the previously committed card | prints the token name, exits 1, writes nothing |
| 5 | A font file named by `05-fonts.css` is absent | the previously committed card | prints the path, exits 1, writes nothing |
| 6 | The Playwright browser cache is missing | the previously committed card | prints `%LOCALAPPDATA%\ms-playwright`, exits 1, writes nothing. This is the spec's documented prerequisite, **not** a silent blank card |
| 7 | `ABOUT.name` or `ABOUT.title` is empty | the previously committed card | prints which field is empty, exits 1, writes nothing — a card with a blank headline is not a card |

Two properties of that table are decisions rather than defaults:

- **A failed run leaves the tree alone.** Every state from 3 to 7 exits before
  `writeFile`, so the committed PNG is either current or untouched. There is no state in
  which it is half a card.
- **States 3–7 are loud on stdout and silent to the visitor.** A visitor never sees a
  placeholder, because a placeholder is indistinguishable from a design decision, and that
  is how the previous 404 got shipped in the first place.

The **empty states are the interesting ones here**, and the spec's edge-case section is
explicit that state 3 has no fallback. The plan's answer is that the check in §7 turns it
red and the run turns it into an error: the case is reported, not designed around.

---

## 6. Decisions

**D1 — The generator ships in the repo; a pasted PNG does not.**
*Discarded:* generating the card once and committing only `og-cover.png`.
*Why:* with only the PNG there is nothing for RF-4 to import, so "cannot drift from the
tokens" becomes a comment. RF-4 says it outright: renaming a token changes nothing in an
already-rendered PNG, so no check on the artifact could catch it.

**D2 — The generator exports only what needs no font engine; `npm test` opens no browser
ever.** The fit is a pure function taking an injected `measure` (§3.4). The check calls it
with its own measure and asserts the two numbers it returns — `lines` and `sizePx`. The one
thing that genuinely needs a font engine, the drawn width, goes to a manual step.
*Discarded — **A**, measure live inside `npm test* (correct, and a time bomb).* It renders
during the suite, so the check is exact. But `.husky/pre-commit` runs `npm test` and
cancels the commit when it fails; measured today, `playwright` and `@playwright/test`
declare **no `postinstall`**, and the browsers live **outside the repo** in
`%LOCALAPPDATA%\ms-playwright`. A fresh clone on another machine has no browser until
someone runs `npx playwright install`, and then **one image assertion blocks committing
anything in the project.**
*Discarded — **B**, record the measured width in the PNG (`tEXt`) or a sidecar file.* Fast,
and it makes every check a statement about **the last run** rather than about the current
code: change the fit algorithm, do not regenerate, and the record still says the name fit —
**green and false**, the exact shape of the six blind guards `AGENTS.md` documents. It also
puts a second artifact in the tree that can go stale independently of the PNG, turning one
human obligation into two.
*Accepted cost, stated plainly:* **C cannot catch a change that makes the name overflow
without touching the size it reports** — different padding, a different family or weight, a
different font file. The check drives the fit with an injected measure, so it proves the
loop and the two numbers and never sees the real font. That is a manual step, named in §7
and in the spec's *Done when*.

**D3 — the generator IMPORTS `ABOUT`; it does not parse the file. The old reason for a text
read was false, and the correction is measured.**

The previous version of this decision discarded the import because "bare `node` cannot load
TypeScript". **That is false.** Node's type stripping imports TypeScript from TypeScript and
from `.mjs`, both without a dependency. Measured, with both files present:

```
main.ts      import { ABOUT } from './about.ts'   →  Nombre
from-mjs.mjs import { ABOUT } from './about.ts'   →  Nombre
```

So the generator reads `import { ABOUT } from '../src/data/about.ts'` and there is no regex
over a data file anywhere in it. **That is not cosmetic.** A regex over `src/data/about.ts` is
a **second reading of a datum** — a parser that can drift from the object it parses and does
not know it — which is what constitution 9 is against. One import, one source, no way to
disagree with itself.

*Discarded:* a text read with a regex (this was the previous choice). Its reason is gone, and
so is the pattern `tests/visual-language.test.ts:174` offered as precedent for it: matching
that file is a legitimate guard on an **identity** the test must not import (it holds
personal data), while matching `about.ts` here would be manufacturing a second reading on
purpose.
*Discarded:* adding a JSON mirror of the identity — a **second source for the name**,
constitution 9, refused outright.
*Discarded:* TypeScript with a compile step, to make an import resolvable. That is the
dependency D8 already rules out and RF-3 forbids.

**What the import needed, measured: one character.** `about.ts:1` named `./contacts` without
its extension, and node's resolver does not guess extensions, so the import died on
`ERR_MODULE_NOT_FOUND` before any type was stripped.
`--experimental-specifier-resolution=node` fails the same way — type stripping was never the
obstacle. Adding `.ts` to that one specifier is the whole fix, and the chain stops there:
`about.ts:2` and `contacts.ts:1` are both `import type`, which type stripping erases.

```
import { CONTACTS } from "./contacts";    →   import { CONTACTS } from "./contacts.ts";
node scripts/probe.mjs   →   OK  name: <nombre>  | title: Full-Stack Developer
```

That character is the only `src/` edit in this plan, it is **additive** (a specifier the
resolver needs, not behaviour), and no `tsconfig.json` flag is involved —
`astro/tsconfigs/base` already sets `allowImportingTsExtensions: true` with `noEmit: true`.
The spec names it in RF-4 and in *Out of scope*, so the document does not claim to leave
`src/` alone and quietly not do so.

**D4 — Two `setContent` passes, not one measure-then-mutate pass.**
*Discarded:* load once, measure, then set `font-size` on the live heading and screenshot.
*Why discarded:* the second layout after the size change races `document.fonts.ready`. The
measure-only page is throwaway and costs nothing; a screenshot taken against a font that
has not settled is the same silent-fallback failure as D3's font URL, one layer down.

**D5 — `playwright` is imported dynamically inside `renderCard()`.**
*Discarded:* `import { chromium } from 'playwright'` at module scope.
*Why discarded:* `tests/seo.test.ts` imports this module, and a module-scope bare import is
pulled in at import time — loading the whole driver for checks that only parse CSS and read
a file's bytes. Under D2 that is the only thing standing between importing the module and
dragging the browser toolchain into `npm test`, so it is load-bearing rather than tidy.

**D6 — `white-space: nowrap` on the name, rather than trusting the text.**
*Discarded:* asserting single-line-ness from the exported fit alone.
*Why discarded:* the export records the size the algorithm chose; if the markup allowed a
wrap, a name at a chosen size could still have drawn on two lines and every exported number
would agree. The declaration is what makes the RF-8 assertion about the output rather than
about the arithmetic, and removing it is the injection that proves it.

**D7 — `--fs-4xl` (52px) as the starting step, walking the scale down to `--fs-xs`.**
*Discarded:* one fixed size with a hardcoded fallback; a percentage-based reduction.
*Why discarded:* a fixed size is the shape RF-8 exists to prevent, and a percentage steps
off the scale into sizes `--fs-xs` does not define, which is the floor's meaning. Walking
the declared steps keeps every size a real step of a 1.25 scale.

**D8 — `.ts`, run directly by node's type stripping. Not `.mjs`, not a compile step.**

Measured on this machine, and every line of it is why the old reason is gone:

```
node v23.11.0                      bare `node file.ts` runs
engines / .nvmrc / .node-version   do not exist — nothing pins the version
tsc in any script                  no
@astrojs/check                     not installed
tsconfig.json                      present
typescript in node_modules         yes — transitively via astro, not in package.json

interface Ghost { n: number }
const g: Ghost = { n: 'not a number' }
node g.ts   →   n is: not a number        (no error)
```

Three consequences, none of them optional:

- **Type stripping erases types; it does not check them.** The `Ghost` above holds a string
  and node prints it without complaining. So `.ts` buys **editor support and a file that
  matches its 32 `.ts` neighbours — not verification**, and nothing in this repo verifies
  types in any case: no `tsc` in a script, no `@astrojs/check`. Do not let this decision
  imply the extension checks anything.
- **RF-3 stays green.** Type stripping needs no dependency. `package.json` is untouched: no
  `scripts` entry, no `engines`, nothing added to either dependency set.
- **The floor is Node ≥ 22.18**, where type stripping stopped being behind a flag. Node 20
  went EOL in April 2026, so every line supported today carries it. **And nothing in this
  repo pins the version** — no `engines`, no `.nvmrc`, no `.node-version` — so that is the
  real and only cost of the decision, written as a cost rather than smoothed over. An older
  node does not run the generator, and it says so on stdout.

*Discarded — **`.mjs`**, the previous choice.* The reason it was chosen — that `.ts` could not
run — was false on this machine. The reason that survives: it loses editor support and leaves
one orphaned file among 32 `.ts`, against `AGENTS.md`'s TypeScript-by-default rule. That rule
is the reason, and it did not exist when this decision was first written.
*Discarded — **TypeScript with a compile step** (or a loader).* This one is real: `tsc` is a
dependency, `typescript` is not in `devDependencies`, and `astro check` already prompts to
install it. **This is the alternative RF-3 forbids**, and D8's whole point is that the chosen
option needs none of it.

One invocation detail, not a `package.json` entry: node emits an `ExperimentalWarning` on
every run ("Type Stripping is an experimental feature and might change at any time"). The run
is therefore `node --no-warnings scripts/og-cover.ts`. That is a flag on the command line, and
it is the most visible noise this decision produces.

---

## 7. Test strategy

**Runner, read from `package.json`:** `test` → `vitest --run tests`, `test:e2e` →
`playwright test`. Every check below is a `vitest` test in **`tests/seo.test.ts`**, the
file spec 004 created and the spec puts them in — not in `tests/about.test.ts`, which holds
the personal data.

**No vitest config exists**, so the runner runs on its defaults with the working directory
as root. `tests/seo.test.ts` reaches the generator with a **relative** import,
`../scripts/og-cover.ts` — inside the root, so Vite transforms and runs it as ESM, and
`package.json` already carries `"type": "module"`. The positional `tests` filter scopes the
glob, and `scripts/` matches no test glob, so the generator is never collected as a suite.

### What is asserted as data, and what is asserted on the artifact

| | |
|---|---|
| **Data** (the bulk) | token values vs `00-tokens.css`; exported strings vs `ABOUT`; the computed contrast ratio; the fit result; the two directory listings; `BaseLayout.astro`'s tag bindings; `package.json`'s dependency sets |
| **Artifact** (two tests only) | the PNG signature, its IHDR dimensions and its byte size |
| **Rendered output** | **none.** No test fetches a served page, because `output: "server"` means there is no HTML in `dist/` to fetch |

### The checks

- **T-S1** — `public/og-cover.png` stats, and `pngInfo` reads a PNG signature.
- **T-S2** — the same IHDR read: `width === 1200 && height === 630`.
- **T-S3** — `package.json` `dependencies` and `devDependencies` equal the current sets
  exactly, by value. Not "did not grow": a **removal** is as much a dependency change as
  an addition, and only equality settles both.
- **T-S4a** — RF-4's data check. Imports `readTokens` from `../scripts/og-cover.ts` and
  asserts each exported token **equals the value `00-tokens.css` declares** — parsed by
  the test's own reader, not by importing the generator's `parseTokens`, or the check would
  be comparing the generator against itself and would agree with any wrong value. The
  exported font paths are real files under `public/fonts/`. **No substring search for a
  token name anywhere in this check.**
- **T-S4b** — asserts the generator **file exists** and the exported readings came from it
  (a non-empty `tokens` object). Without this, a deleted generator makes the import throw
  at collection time with a stack trace instead of a named failure.
- **T-S5a** — `public/` holds `og-cover.png` and **no** `og-cover.html`, `.css` or `.js`
  beside it. This is the Security NFR too: the card is the only file added.
- **T-S5b** — `src/pages/` gains no route matching `og-cover`. Two listings, one
  `describe`, because it is one behaviour.
- **T-S6** — reads `BaseLayout.astro`, comments stripped first, and settles all three
  things inside the check: both tags bind the same `content` expression; the pathname that
  expression composes from `site` is `og-cover.png`; and it stats that path and reads the
  PNG signature itself. It defers to nothing.
- **T-S7** — two halves, and the first is the reason the second means anything.
  **(a) Falsify the formula** against references whose correct answer is known, measured with
  the function in the repo: black on white `→ 21.0000` (the WCAG maximum), white on white
  `→ 1.0000` (the minimum), and `#767676` on white `→ 4.5422` (the canonical threshold grey).
  **(b)** `contrastRatio` over the **exported** `palette: { accent, ground }` (§3.3), asserted
  `>= 4.5`. Today 6.66:1.
  **`21` is the one that bites against a constant**, and `4.5422` is the one that bites against
  a missing sRGB transfer function — a byte average without expanding gives a different number
  there. A lone `>= 4.5` over the gold is satisfied by `return 99`, by a swapped numerator and
  by the unexpanded average alike, while RF-7 says *computed*: half (a) is what makes that
  wording true.
- **T-S8a** — drives `fitFontSize` with **an injected `measure`** — a plain function of the
  text and the size, no font engine, no browser — over `ABOUT.name` read by the test, and
  asserts the two numbers the generator reports: `fit.lines === 1`, and `fit.sizePx >=
  12` where `12` is `--fs-xs` **read from the sheet, not typed as a literal here**. Nothing
  in this check can reach `renderCard()`.
- **T-S8b** — the floor can be reached *and* the floor can be missed, both without touching
  `ABOUT`. Under an injected `measure` that reports everything as too wide, `fitFontSize`
  must return `fits: false` rather than a size below the floor; under one that reports
  everything as narrow, it must return the **largest** step. Two pure calls with two stubs.
  This is what makes T-S8a able to fail: without it, a `fitFontSize` that always returned
  `--fs-4xl` and one that always returned `--fs-xs` would both pass T-S8a.
- **T-SIZE** — the artifact is under 5 MB.
- **T-LANG — replaced, and the replacement is not a check.** The old form compared
  `readings.content` against the `ABOUT` the test imports. Once the generator **imports**
  `ABOUT`, both sides are the same object: it compares a value with itself, passes for any
  implementation, and **cannot go red** — a guard born blind, which is the shape `AGENTS.md`
  documents six times over. So it goes, and what replaces it is a reading of the source, not
  a second assertion: `tests/seo.test.ts` asserts the generator's file **imports** `ABOUT` from
  `src/data/about.ts`, and that the file **contains no literal spelling of `ABOUT.name` or
  `ABOUT.title`** — a value read out of the data module and looked for as text, never typed
  into the test, so no one has to update the test when the name changes. That check bites:
  replace the import with a hardcoded string and it goes red, on the absence of the import and
  on the presence of the literal at once. It cannot tell you the import *resolves* — that is
  the generator's own first line, and running it — `node --no-warnings scripts/og-cover.ts`,
  which prints the name it read — is T-4's done-when.

### The cost, stated rather than buried

### `npm test` opens no browser

**Not one check above launches a browser, and that is a decision, not a side effect (D2).**
`renderCard()` is reachable only from `main()`. The fit is settled by driving `fitFontSize`
with an injected measure, the tokens by parsing a stylesheet, the artifact by reading eight
bytes of IHDR. `npm test` stays pure Node, which is what `.husky/pre-commit` needs: it runs
`npm test` and cancels the commit on failure, `playwright` and `@playwright/test` declare no
`postinstall`, and the browsers live outside the repo. Option A would have put one image
assertion between a fresh clone and every commit in the project.

The three things this buys and does not: **the drawn width of the name is unasserted**, and
a change that overflows the card without touching the reported size stays green. That is the
hole D2 accepts, and it has a manual step of its own below.

### Proving each guard bites

One injection per guard, before any of them is called green — constitution 4. All ten are
the spec's own list:

| Probe | Must go red |
|---|---|
| delete `public/og-cover.png` | T-S1 |
| emit a 1200×600 PNG | T-S2 |
| add a dependency to `package.json` | T-S3 |
| rename `--brand-primary` in `00-tokens.css` → red **on `undefined`**, under a second, no render | T-S4a |
| then add a comment naming `--brand-primary` → still red | T-S4a (a grep would go green here) |
| delete `scripts/og-cover.ts` | T-S4b, by name rather than by stack trace |
| drop an `og-cover.html` into `public/` | T-S5a |
| add a route under `src/pages/` serving the card | T-S5b |
| point `twitter:image` at a different path | T-S6 |
| swap the accent for `--brand-accent-dark` in the generator | T-S7, on the computed ratio (4.4788, under 4.5) |
| make `contrastRatio` `return 99` | T-S7 half (a), **on `21.0000`** — not on the `>= 4.5` assertion, which 99 satisfies |
| drop the sRGB transfer function, average the bytes | T-S7 half (a), **on `4.5422`** — that reference is where the unexpanded average first disagrees |
| a name in `ABOUT` too long even at `--fs-xs` → the floor cannot be honoured | T-S8a, on the floor; T-S8b is the same violation with a stub measure and no edit to `ABOUT` |
| make the generator wrap instead of reduce → it reports `lines: 2` | T-S8a, on the single-line assertion |
| pad the PNG past 5 MB | T-SIZE |
| replace the `ABOUT` **import** in the generator with a hardcoded string | T-LANG, on the missing import and the literal's presence |

Three probes deserve their own line, because each is the one that could pass for the wrong
reason: **T-S4a with a comment naming the token** is the six-guard failure mode reproduced
on purpose; **T-S8a's second probe** proves a name needing a smaller size stays green, which
is the behaviour working, not the guard failing; and **neither RF-8 probe opens a browser**,
because both ride on the injected measure rather than on a render.

**What no probe here can prove, and is the cost of D2:** a change that makes the name
overflow while leaving the reported size alone — different padding, a different family or
weight, a different font file. The suite is blind to it and the manual step below is the
only thing that sees it.

### What `npm test` cannot reach, and does not pretend to

- **The served `<head>`** — `og:image` and `twitter:image` present and resolving to
  `/og-cover.png` in a browser against a real parser. Manual, from the spec.
- **Card freshness** — run `node --no-warnings scripts/og-cover.ts` and look at the result against the
  committed PNG. **No assertion can distinguish a stale card from a fresh one**, and no
  version of the check changes that: it settles the generator, not whether anyone ran it.
  A human obligation, deliberately not a guard.
- **The drawn width of the name** — the first blind spot here that needs a font engine.
  Whoever runs the generator opens `public/og-cover.png` at 1200×630 in a browser against a
  real parser and looks: one line, no overflow past the content width, at the size the
  generator reported. **Not a test task** — it is the manual step of the spec's *Done when*,
  and writing it as `T-S8c` would dress a human obligation as an automated one.
- **The card seen at 1200×630** before it is committed. A raster artifact nobody has
  looked at is not verified.