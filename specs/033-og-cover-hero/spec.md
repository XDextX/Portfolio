# Spec 033 — The social card composed like the hero, one per locale

**Status:** implemented
**Size:** M
**Approved:** 2026-10-17 · two clarify rounds (three minor findings; then the owner chose one card per locale, adding RF-9 and the AGENTS change); approved with its plan and tasks · 121 lines
**Implemented:** 2026-10-17 · AGENTS `dc7a55a`, code `a706ab6` · 5/5 tasks, `npm test` 257/257, e2e 154/154 · 9/9 RF, NFRs and edge cases validated (both cards beside the hero in dark, two runs byte-identical, owner visual approval); 10 injections red

## Context and goal

`public/og-cover.png`, the picture every shared link and the repository's social preview show,
is the name and the role in small mono type on a flat navy ground (spec 002): nothing of the
site's face. The owner asked on 2026-10-17 to change its generator, `scripts/og-cover.ts`, so the
card reads like the hero without its action buttons. Decided with the owner the same day:

- The generator keeps drawing its own card from the sheet's tokens and `ABOUT`, now in the
  hero's composition: avatar, the name with the family in gold, the role and location, the four
  phrases. No screenshot of the running site.
- The dark theme's colours, the hero's own look on a navy page.
- The avatar is downloaded from `ABOUT.avatar` each time the card is generated, held in memory
  and never saved: `ABOUT.avatar` stays its one source (AGENTS: one source per datum).
- One card per locale, `og-cover-es.png` and `og-cover-en.png`, and each page binds the card of
  its own locale. Only the phrases differ between them; the name, role and location do not.
  Which locale is the default is a separate question the owner will take up (`.env` carries a
  `DEFAULT_LOCALE` that AGENTS records as dead config), so neither card is the unnamed one.

Every other social-card rule in AGENTS holds: the sheet's tokens at the sheet's values, `ABOUT`
imported and none of its values spelled out, static PNGs nothing renders, 1200×630 under 5 MB,
the accent clearing 4.5:1 on the ground, nothing depending on the moment it runs. The rule that
`og:image` binds `${site}/og-cover.png` changes, in AGENTS first (see below).

## Actors

- Anyone who sees a link to the site shared, or the repository's social preview.
- The owner, who runs the generator and commits the PNG.

## Requirements (EARS)

- RF-1: THE SYSTEM draws the avatar fetched from `ABOUT.avatar` on the card's left, beside the
  text, as the hero places it. — **Check:** with the fetch stubbed, the card's markup holds one
  image whose bytes are the stub's, left of the name's box; the fetch was asked for
  `ABOUT.avatar`; no file other than `og-cover.png` is written.
- RF-2: THE SYSTEM draws the given name in the dark theme's ink and the family name in the
  accent, on one line. — **Check:** the markup's given and family parts carry the colours the
  readings export for `--text-color` (dark) and `--brand-accent`, their text equals
  `ABOUT.nameParts`, and spec 002's one-line fit holds for the whole name.
- RF-3: THE SYSTEM draws the role and the location under the name. — **Check:** the markup holds
  `ABOUT.title` and `ABOUT.location`, below the name's box.
- RF-4: THE SYSTEM draws the hero's four phrases in their order, in italic, in the card's own
  locale. — **Check:** for each locale, the markup's phrases equal that locale file's values for
  `ABOUT.phraseKeys`, in order, with `font-style: italic`.
- RF-5: THE SYSTEM draws no action and no bio. — **Check:** the markup holds none of the CV,
  social or contact labels from the locale files and no part of `ABOUT.bio`.
- RF-6: THE SYSTEM takes every colour from the sheet's tokens: `00-tokens.css` and
  `themes/dark.css`, at their values; the generator spells out no colour. — **Check:** every token
  the readings export equals the value this test's own reader finds in those two files, and the
  generator's source, comments stripped, holds no hex, `rgb(` or `hsl(` literal (a source check on
  purpose, constitution 8: the AGENTS rule is about what the generator's author types).
- RF-7: IF the avatar cannot be fetched, or the answer is not an image, THEN THE SYSTEM exits
  non-zero and leaves `og-cover.png` untouched. — **Check:** with the fetch stubbed to fail and to
  answer `text/html`, the generator rejects, and the PNG's bytes are unchanged.
- RF-8: THE SYSTEM draws every text colour on the ground at 4.5:1 or better: the ink and the
  secondary text, as it already does the accent. — **Check:** each text colour the readings export
  measures ≥ 4.5:1 on their ground with the generator's own `contrastRatio`, beside spec 002's
  accent check.

- RF-9: THE SYSTEM writes one card per locale the site serves, and each page binds the card of
  its locale to both `og:image` and `twitter:image`. — **Check:** `public/` holds
  `og-cover-<locale>.png` for every locale in `i18n/locales/` and no `og-cover.png`; the layout's
  two tags bind one expression composing the page's locale; served `/` with `?lang=es` and
  `?lang=en` names the matching file, and each file answers 200.

## Non-functional requirements

- Both cards are generated with this spec and committed: 1200×630, under 5 MB each, read from
  each PNG's header (spec 002's guard, run per file). One run writes both, fetching the avatar
  once.
- No `new Date()` and no other clock in the generator; two runs on the same avatar give the same
  bytes.
- The generator's run needs the network (the avatar); the tests never do.
- No new dependency (constitution 1 and 7): Playwright, already installed, stays the renderer.

## Edge cases

- The owner changes their GitHub avatar: the card keeps the old one until the generator runs
  again — RF-1 (a content change, not drift: the source is still `ABOUT.avatar`).
- A long name: spec 002's fit shrinks it down the type scale, the avatar keeps its size — RF-2.
- `ABOUT` with no family name: the whole name in ink — RF-2.
- A locale file without one of the phrase keys: the generator fails naming the key and writes
  no card — RF-4.
- A third locale added to `i18n/locales/`: the generator writes its card and RF-9 asks for it.

## Guards this changes (AGENTS: never silently)

- **AGENTS.md first, in its own `docs:` commit:** "`og:image` and `twitter:image` bind the same
  expression, composing `${site}/og-cover.png`" becomes the same expression composing
  `${site}/og-cover-<locale>.png` for the page's locale, each file existing; "the card is a static
  file" becomes one static file per locale.
- `tests/seo.test.ts` (spec 002 RF-1, RF-5, RF-6): the artifact, listing and binding checks read
  `og-cover-<locale>.png` for every locale instead of `og-cover.png`.

- `tests/seo.test.ts` (spec 002 RF-4) compares the readings with `00-tokens.css` alone; it widens
  to `themes/dark.css` for the dark tokens the card now draws.
- The same file's contrast check (spec 002 RF-7) keeps the accent on the ground and gains the ink
  and the secondary text on the ground (RF-8).
- The generator's `#FFFFFF` for the name goes: AGENTS already forbids a hex typed into it.
- Found during implementation: every card since spec 002 drew in the fallback font. A page set
  with `setContent` has no origin and Chromium refuses its `file://` fonts, so `document.fonts`
  reported every IBM Plex face as `error` and the PNG showed Segoe UI. The fonts are now inlined
  as `data:` URLs, and `e2e/og-cover-layout.spec.ts` asserts the upright and italic faces loaded.

## Out of scope

- A light-theme card.
- Which locale is the default, and whether `DEFAULT_LOCALE` gets wired (owner, later).
- Uploading the PNG as a repository's social preview (the owner does it by hand).
- The hero itself.

## Done when

`npm test` and `npm run test:e2e` green; each new guard shown red by injection; the generator
run, both cards seen beside the hero in dark, stopping for the owner's visual approval.

## Open questions

None.
