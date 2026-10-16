# Spec 010 — Hero redesign

**Status:** implemented
**Size:** M
**Approved:** 2026-10-15 · two clarify rounds, no blocker left; seven owner decisions recorded · 207 lines, 8 RF
**Implemented:** 2026-10-15 · commits `57dbc96` (docs) and `68ece8e` (feat) · 9/9 tasks, `npm test` 182/182, e2e 41/41, build green · 8/8 RF, NFRs and edge cases validated; 17 injections red, 2 replaced by 2b; LCP 172/164/164 ms, same elements; seen in light and dark, es and en

**Depends on:** spec 007 (primary button), which owns the CV button's fill and text colour;
spec 016 (focus ring), which owns every focus ring the hero draws; spec 009 (dark glows),
whose hero glow is the hero's only decoration in dark. Not on spec 008: the hero carries the
page's `h1`, not a section title (008, "Out of scope").

**Prerequisites** (each its own change, before this spec's code):

- Constitution 7 amended, AGENTS.md Commands/Git updated, and the pre-commit hook running
  the e2e suite after `npm test` (cross-cutting decision 2026-10-15). Seven of the eight RFs
  are settled on a rendered page.
- Spec 009 implemented, so the dark hero ground RF-6 measures against is the final one.
- The owner's OK, at the moment of download, for the italic font file and for each of the
  three icon files (file, source, size).

## Context and goal

The owner's design proposal of 2026-10-15 redraws the home page's first screen: a desk
photo behind the name, handwritten phrases "Ideas / Código / Soluciones / Resultados", the
name in two colours, and contact buttons with icons. Today the hero is the avatar, a
one-colour gold name, the role, the location, the bio and four buttons: the CV download,
which already carries a download icon, and three text-only social buttons.

Owner decisions (`bloque/redesign-2026-10.md`):

- **No photo.** The mockups are 859px wide with UI baked in; there is no usable asset. "No
  photo" means no desk photo: **the avatar stays**, and constitution 2's exception keeps its
  one user.
- **The handwriting becomes IBM Plex Sans italic**, a real italic face added to the existing
  family. No third family.
- **The two-tone name and the button icons are adopted.** The light-gold CV button is
  spec 007's change; this spec only keeps the CV button as 007's primary button.

The goal is the proposal's first impression — a short arc from idea to result and a name in
two colours — without a second palette, a third font, a remote asset or a second copy of the
owner's identity.

## Definitions

- **Hero**: the home page's first section, the one carrying the `h1`.
- **Phrases**: "Ideas", "Código", "Soluciones", "Resultados" in Spanish, "Ideas", "Code",
  "Solutions", "Results" in English, in that order. Visitor-facing, so they go through `t()`.
- **Real italic**: glyphs from an italic font file, not an oblique the browser synthesises.
- **Given name / family name**: the two fields the identity data states — today "German" and
  "Montero Ramirez". The full name is computed from them, given + one space + family, and is
  written nowhere else (constitution 9, one source per datum).
- **Image**: a raster file or a `url()` background. Inline SVG and icons painted through a
  CSS mask are not images here.
- **Gold**: `--accent-text` (cross-cutting decision); the brand gold is 1.61:1 on the light
  sheet.
- **Hero ground**: the page sheet, `--main-bg`, in light; the sheet plus spec 009's hero
  glow in dark.

## Actors

The visitor arriving from a shared link; a screen-reader user, who hears the name once.

## User stories

- US-1: As a visitor, I want four words that say how the work goes from idea to result, so
  that I know what this person does before reading the bio.
- US-2: As a visitor, I want the name drawn in two colours, so that it is memorable.
- US-3: As a visitor, I want icons on the contact buttons, so that I find GitHub, LinkedIn
  and Email without reading each label.
- US-4: As a screen-reader user, I want the heading announced as one full name and the
  phrases as a list of four.

## Requirements (EARS)

- RF-1: THE SYSTEM renders the hero with no image besides the avatar. — **Check:** an e2e
  test on `/` fails if any hero element fetches a raster file other than the avatar URL or
  carries a `url()` background; inline SVG and mask-painted icons pass.
- RF-2: WHEN the page renders in a locale, THE SYSTEM exposes that locale's four phrases as
  a four-item list, in order. — **Check:** an e2e test on `es` and `en` fails unless the
  accessibility tree holds one list of four items whose text equals the locale file's values
  in order; `tests/i18n.test.ts` resolves every phrase key in both locales.
- RF-3: THE SYSTEM draws the phrases with a loaded italic face of IBM Plex Sans. —
  **Check:** an e2e test, after the fonts settle, fails unless each phrase computes
  `font-style: italic` and `document.fonts` holds a loaded IBM Plex Sans face with
  `style` italic.
- RF-4: THE SYSTEM draws the given name in the text colour. — **Check:** an e2e test fails
  unless its computed colour equals `--text-color` in both themes.
- RF-5: THE SYSTEM draws the family name in gold. — **Check:** an e2e test fails unless its
  computed colour equals `--accent-text` in both themes.
- RF-6: THE SYSTEM keeps the family name at 4.5:1 or more on the hero ground. — **Check:**
  an e2e test fails below 4.5:1 against the sheet in light and the lightest glow point behind
  the name in dark (on the bare sheet today: 6.01 light, 6.66 dark).
- RF-7: THE SYSTEM gives the hero heading an accessible name equal to the computed full
  name. — **Check:** an e2e test fails unless the `h1`'s accessible name equals the full
  name as computed from the identity data, with single spaces.
- RF-8: WHEN the page renders in a locale, THE SYSTEM labels each social button with that
  locale's label beside one icon hidden from assistive technology. — **Check:** an e2e test
  fails unless the visible label and accessible name are "GitHub", "LinkedIn", "Correo" on
  `es` and "GitHub", "LinkedIn", "Email" on `en`, each button holding exactly one icon with
  no accessible name.

## Non-functional requirements

- **Two families, no third** (constitution 2). — **Check:** a data test fails unless the set
  of `@font-face` families is exactly IBM Plex Sans and IBM Plex Mono, each `src`
  root-absolute under `/fonts/` and naming an existing file.
- **Weight.** One file added to `/`: the latin italic, 50 184 B
  (`@fontsource-variable/ibm-plex-sans@5.2.8`, OFL 1.1, the package of today's 45 712 B
  roman), declared over 100–700 like the roman; no latin-ext italic. — **Check:** a data test
  fails if any code point of a phrase, in either locale, falls outside the italic face's
  declared `unicode-range`.
- **LCP.** Today `p.about-bio`, 116 / 124 / 116 ms at 390×844, 958×888 and 1440×900, the
  after-measurement recorded in commit `a6f1297` (spec 003's own before-figures were
  88 / 152 / 84). After this change, measured the same way, at most 200 ms at each viewport,
  with the element named. Absolute, because a percentage of ~100 ms is noise.
- **Icons**: three Tabler files (GitHub, LinkedIn, mail) in the project's UI icon folder,
  with its notice and licence, painted by a CSS mask in `currentColor` so they follow the
  gold hover; one glyph, one meaning across the page. — **Check:** a data test fails if a
  hero icon path is not root-absolute, names a missing file, or the folder lacks its licence.
- **Equal height.** The CV button and the social buttons sit side by side. — **Check:** an
  e2e test fails if their rendered heights differ by more than 0.5px.
- **Both themes.** Every hero colour is a token defined in both theme files. — **Check:**
  `tests/tokens.test.ts` stays green over the hero's styles.
- No new dependency (constitution 1); no new remote host (constitution 2).

## Edge cases

- **No family name** (a one-word name; the family field is optional and left out): the
  full name equals the given name with no trailing space, and the gold piece is not rendered (RF-5, RF-7). — **Check:** a data test feeds a
  given name with no family and fails on a trailing space or a non-empty gold piece; today's
  data cannot render the case.
- **Compound names** ("María José" + family): split exactly where the data states it, so
  nothing is guessed (RF-4, RF-5).
- **Dark glow behind the name**: the glow is spec 009's; RF-6 measures the name against it.
  In light the hero sits on the bare sheet.
- **390px wide**: the name may wrap; the phrases wrap at word boundaries, separators never
  start a line alone, and nothing causes horizontal scroll (`scrollWidth <= innerWidth`),
  checked in the visual review.
- **Locales**: "Soluciones" and "Resultados" tie as the longest Spanish phrase (10 letters);
  the longest English one is "Solutions" (9). The layout is reviewed in `es`.
- **Italic not yet loaded**: with `font-display: swap`, the first frame draws the phrases in
  the fallback family's italic, then swaps. RF-3 asserts the settled state.

## Out of scope

- The bio, role and location: wording and place unchanged.
- The avatar: source, size, shape and `preconnect` unchanged (spec 001, rejected).
- The CV button's colours (spec 007), every focus ring (spec 016), the glow itself (009).
- The JSON-LD `Person`: keeps `name` (the computed full name); no `givenName`/`familyName`.
- The contact cards, which read the same contact label (`ContactCard.astro:24`, `:33`):
  whether they switch to the translated label is spec 015's. Until then "Email" can show in
  a card while the hero says "Correo".
- Section titles and the other sections (specs 008, 011–015).

## Guards this spec changes

- **Widened, not relaxed:** the identity guard (`tests/visual-language.test.ts:279`) reads a
  literal `name:` from the identity data and throws once the name is computed; it must read
  the given and family fields instead, and still fail on any part of either outside the
  identity data.
- **Widened:** `e2e/about.spec.ts:123` matches the same literal and skips its avatar-alt
  assertion silently when nothing matches; it must compare against the computed name.
- **Retired: none.** `tests/about.test.ts` (socials from `ABOUT`) stays as it is.

## Done when

- `npm test`, `npm run test:e2e` and the build green.
- Each new guard shown red by injecting its violation, reverted by explicit path, and named
  in the commit (constitution 4).
- The hero seen at 390×844, 958×888 and 1440×900, in light and dark, in `es` and `en`, and
  approved by the owner before the commit.
- LCP before and after, with the element, in the commit message.

## Decision

Owner, 2026-10-15:

- **Name split: the identity data states the given and the family name; the full name is
  computed.** Discarded: deriving the split from the first space of today's `name` — no data
  change, but "María José" would paint "José" gold, a guess the data can avoid.
- **English phrases: "Ideas / Code / Solutions / Results".** Discarded: leaving them to the
  plan; visitor-facing copy is the owner's to approve, as in spec 003.
- **The phrases are content, read as a four-item list in order.** Discarded: hiding them as
  decoration because the bio says the same — it would make the first screen differ by
  channel.
- **Between phrases: a CSS-only separator, no file.** Discarded: the mockup's arrows as an
  icon file — one more download for a decoration CSS can draw.
- **No CSS-only detail beyond spec 009's hero glow in dark; light sits on the bare sheet.**
  Discarded: a gold hairline under the name or a second gradient — 009 already makes any
  gradient on the hero its glow, and two would compete.
- **Social icons: three new Tabler files, monochrome, mask in `currentColor`.** Discarded:
  reusing `public/icons/` — one set and no download, but brand colours cannot follow the gold
  hover and the white-filled GitHub mark vanishes on the light button's `#FFFFFF`.
- **Social labels go through `t()`: "Correo" in `es`, "Email" in `en`; GitHub and LinkedIn
  the same in both.** Discarded: keeping the `contacts.ts` literals, which ship English to
  Spanish readers past `t()` (constitution 10).

## For the plan

- RF-1 and RF-5 are green today; their red comes from injection, not from today's hero.
- The `05-fonts.css` comment ("4 files, ~105 KB") goes stale: 5 files, 157 188 B after.
- Preloading the italic is decided after the LCP measurement, only if the LCP moves to the
  phrases.
- The e2e server must not collide with a dev server already on 4321 (cross-cutting).
- Every reader of the name keeps getting the computed full name: `AboutSection.astro:37,46`,
  `BaseLayout.astro:21,22,31`, `about.ts:60`. `about.ts:24` repeats the name inside
  `resumeUrl`, a second copy the identity guard skips (it exempts `about.ts`).
