# Plan 018 — Contact cards: location card and copy controls

**Spec:** `specs/018-contact-cards/spec.md` (**approved**, 6 RF).
**Status:** approved
**Approved:** 2026-10-15 · owner approval · 187 lines
**Changed:** 2026-10-16 · ordering, helper names and line numbers aligned with what 016–014 landed; the hero socials already translate (010); exact glyph size; download under the standing OK · 188 lines · pre-approved by the owner 2026-10-16
**Changed:** 2026-10-16 · owner decisions at the visual review: the location card, its plain variant, glyph and `map-pin.svg` go; the datum moves back to `about.ts`, once; GitHub draws one file per theme through `SkillLogo`. Injections 4, 6, 8 and 14 left with the card

**Ordering.** Specs 016, 007, 008, 017, 009 and 010–014 have landed: 016/009 leave `contrast` in
`tests/helpers/colour.ts`; 007 creates `e2e/helpers/dev-server.ts` and the theme setup, and
points `.icon-btn:hover` (`ContactCard.astro:182`) at `--accent-surface-text`, which the
feedback label inherits; 008 creates `public/icons/ui/` (NOTICE, Tabler licence, *ui icons*)
and `e2e/helpers/rendered.ts` (`openIn`, `installHelpers` with in-page `__groundOf`, `settled`); 017 moves
the `.icon-btn` border to `--control-border`; 012 settles brand logos as colour files; 010 gives
the hero socials `labelKey` and `glyph` (`HeroSocial`) and renders them through `t()`. Both
prerequisite amendments are in force (012); the one download goes under the owner's standing OK
for icons (2026-10-16). Line numbers re-read 2026-10-16 after 007, 010 and 017. No personal value
appears here: the location is "the location datum".

## 1. Scope and coverage

| Requirement | Covered by |
|---|---|
| RF-1 four cards in order, each with its icon | a fourth `CONTACTS` entry, kind `location`; e2e *four cards* |
| RF-2 one location datum, three readers | datum in `contacts.ts`; `ABOUT.location` and JSON-LD read it; guard *location once*; e2e *one location* |
| RF-3 plain location card | `href`-less union member, `--plain` skips hover; e2e *plain card* |
| RF-4 copy writes the value, profiles the `https://` URL | `copyValue()`; data case; e2e *clipboard* |
| RF-5 label 1.5 s at the resting size | stacked grid cell, `FEEDBACK_MS`; e2e *feedback box* |
| RF-6 polite live region | one `.sr-only` region per copy card (`02-utilities.css:107`); e2e *announce* |
| NFR language | email reuses `about.social.email` (spec 010's key, one value one name); location reuses `about.location`; two live strings |
| NFR glyph ≥ 3:1; 360px; edges | masked glyph in the label colour; `min-width: 0` kept (`ContactSection.astro:67-69`); e2e *glyph contrast*, *360*, *second click*; denied clipboard in *feedback box* |
| NFR icons, root-absolute | `map-pin.svg` + NOTICE; *ui icons* and `contact.test.ts:94-107` widened |

Every RF is covered. No guard retires; `data-copied`/`data-error` (45-46) go with their reader.

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `public/icons/ui/map-pin.svg` | create, download | The location glyph. |
| `public/icons/ui/NOTICE.md` | modify | Records it: Tabler v3.49.0, outline, MIT, licence beside. |
| `src/types/contact.ts` | modify | Union: linked kinds require `href` (7); `location` has neither `href` nor `sameAs`; a label is a name or a locale key; a picture is a colour `icon` or a masked `glyph`. |
| `src/utils/contact.ts` | create | Decides a card's label, what a copy writes and how long feedback lasts. |
| `src/data/contacts.ts` | modify | States the location datum once, fourth; email takes `labelKey` for its label (6). |
| `src/data/about.ts` | modify | `location` (21) and `addressCountry` (71) read the entry; import direction (1) unchanged, no cycle. |
| `src/components/ContactCard.astro` | modify | Per item: link or plain value, control or none, `<img>` or glyph; owns the stacked label and the live region; script (74-92) rewritten. |
| `src/components/AboutSection.astro` | modify | The location span (50-53) only when the datum exists. The socials already render `t(s.labelKey)` since 010, so they are untouched. |
| `i18n/locales/es.json`, `en.json` | modify | `contact.actions.copiedLive`, `errorLive`. |
| `tests/contact.test.ts` | modify | Shape, href (9) and icon checks read the union; `copyValue`/`contactLabel` cases; exactly one location entry. |
| `tests/about.test.ts` | modify | Social label via `contactLabel` (46-50); `stripComments`/`componentFiles` (118-129) lifted to module scope; *location once*. |
| `tests/visual-language.test.ts` | modify | 008's *ui icons* also reads each `glyph` in `CONTACTS`. |
| `e2e/contact-cards.spec.ts` | create | Rendered checks of RF-1–6 and three NFRs. |

`ContactSection.astro` is unchanged: it maps `CONTACTS` (29-33). Download, under the standing OK:
`https://cdn.jsdelivr.net/npm/@tabler/icons@3.49.0/icons/outline/map-pin.svg`, unmodified,
MIT, 475 B (jsDelivr's package index, 2026-10-16).

## 3. Pure logic

Nothing reads a clock. In `src/utils/contact.ts`:

- `contactLabel(item: ContactItem, translate: (key: string) => string): string` — the name, or
  `translate(item.labelKey)`.
- `copyValue(item: ContactItem): string | null` — `null` for `location`; `value` for `email` and
  `phone`; `href` otherwise (the spec's Decision).
- `FEEDBACK_MS = 1500` — read by the client script and the e2e spec.

## 4. Algorithm

**Type.** `ContactItem = { id; value } & ({ label } | { labelKey }) & ({ icon } | { glyph }) &
({ kind: 'email'|'github'|'linkedin'|'phone'|'website'; href; sameAs? } | { kind: 'location' })`.
Location entry: `id 'location'`, `labelKey 'about.location'`, `glyph '/icons/ui/map-pin.svg'`.
`about.ts`: `location: CONTACTS.find(kind location)?.value`; JSON-LD spreads `address` only when
it exists, as `email` does (70).

**Card.**

```
label = contactLabel(item, t); copy = copyValue(item); linked = 'href' in item
<article class="contact-card {!linked && 'contact-card--plain'}" aria-label="{label}: {value}">
  'icon' in item ? <img class=contact-icon …> : <span class=contact-glyph aria-hidden style=--glyph:url(glyph)>
  label span; linked ? <a class=contact-value href …> : <span class=contact-value>
  linked && actions: copy && <button class="icon-btn copy-btn" data-copy={copy} aria-label=copyAria title=copyAria>
                       <svg class=copy-btn__icon/><span class=copy-btn__ok aria-hidden>{copied}</span>
                       <span class=copy-btn__err aria-hidden>{error}</span></button>; open link (58-70)
  copy && <p class=sr-only aria-live=polite data-copy-live data-live-ok={copiedLive} data-live-err={errorLive}>
```

**Styles.** `.icon-btn`: `display: inline-grid; grid-template-areas: 'stack'; place-items:
center; block-size: 2rem; min-inline-size: 2rem; box-sizing: border-box; padding-inline:
var(--sp-2)`; `width`/`height` (164-165) go. Children `grid-area: stack`; both labels
`visibility: hidden`, swapped with the icon by `.copy-btn--ok` / `--err`, so the cell is
max-content of all three per locale. `.contact-card:not(.contact-card--plain):hover` replaces
112. `.contact-glyph`: 28px, `background-color: currentColor`, `color: var(--neutral-600)` (the
label's, 135), `mask`/`-webkit-mask: var(--glyph) center / contain no-repeat`, as 008.

**Script** (`astro:page-load`, per `button[data-copy]`, timer in a closure):

```
live = btn.closest('article').querySelector('[data-copy-live]')
click: clearTimeout(timer); ok = true
  try { await navigator.clipboard.writeText(btn.dataset.copy) } catch { ok = false }
  toggle copy-btn--ok (ok), copy-btn--err (!ok)
  live.textContent = ''; next frame: live.textContent = ok ? liveOk : liveErr
  timer = setTimeout(remove both classes, FEEDBACK_MS)
```

A missing `navigator.clipboard` throws inside the `try`: an insecure context is the error
outcome. Clearing first makes an identical second announcement read again.

**Guard *location once* (RF-2).** `v` = the location entry's value, non-empty. Over
`src/data/*.ts` except `experience.ts`, `src/components`, `src/layouts`, `src/pages` (`.astro`)
and `i18n/locales/*.json`, comment-stripped (`<!-- -->` added to the stripper): occurrences of
`v` sum to 1, in `contacts.ts`; offenders name file and count. A source read (constitution 8).

**e2e.** `/?lang=es` and `/?lang=en`, light and dark (`openIn`), `#Contact`, after `settled`. Clipboard:
`grantPermissions(['clipboard-read', 'clipboard-write'])`; failure: `addInitScript` swaps
`writeText` for a rejecting stub. Time: `page.clock.install()` before `goto`.

- *four cards* (RF-1): four cards whose aria-labels equal `contactLabel(c): value` over
  `CONTACTS`, in order; each icon or glyph box non-zero.
- *one location* (RF-2): the card value, `.about-location` and JSON-LD `addressCountry` equal.
- *plain card* (RF-3): zero `a, button`; `border-top-color` equal at rest and hovered.
- *clipboard* (RF-4): click each control; `readText()` equals `copyValue(c)`, `https://` for profiles.
- *feedback box* (RF-5), both outcomes: label visible (`checkVisibility({ visibilityProperty:
  true })`), its `scrollWidth <= clientWidth` of the button, box equal to rest to the pixel;
  `runFor(FEEDBACK_MS - 1)` still the label, `runFor(1)` the icon.
- *announce* (RF-6): one frame on, the region's text equals the locale's live string with `label`.
- *second click*: click, `runFor(1000)`, click; `runFor(1000)` label, `runFor(500)` icon.
- *glyph contrast*: `contrast(glyph background-color, __groundOf(card))) >= 3`, both themes.
- *360*: 360×800, `html` `scrollWidth <= clientWidth`, at rest and mid-feedback.

## 5. Interface

| State | Light and dark |
|---|---|
| Linked / location card | as today, gold border on hover (112-115) / glyph in the label colour, no hover change |
| Copy control at rest | icon centred in a box as wide as the longer label plus padding, wider than today's 32px; open link stays 32px square |
| Copy control hovered | 007's fill and ink, 017's gold border |
| Copied / failed, 1.5 s | "¡Copiado!" / "Error" (es), "Copied!" / "Error" (en), same box; region speaks the live string |
| Second click within 1.5 s; 360px | new outcome, timer restarts; values ellipsize, no page scroll |
| No location entry | three cards; About omits its span; JSON-LD omits `address` |

Control widths and the 360px value width are measured at the walk, not estimated here.

## 6. Decisions

- **D-1 · Location as a `CONTACTS` entry**, read one way by `about.ts`. *Discarded:* a card
  appended from `ABOUT` in `ContactSection` — two sources, the order in a template.
- **D-2 · An `href`-less union member.** *Discarded:* `href: ''`, a focusable reloading link.
- **D-3 · Location label reuses `about.location`.** *Discarded:* a second key for one word.
- **D-4 · `glyph` and `icon` as two fields.** *Discarded:* masking by the `/icons/ui/` path.
- **D-5 · Profiles copy `href`** (spec Decision). *Discarded:* the displayed `value`.
- **D-6 · One grid cell, class toggles.** *Discarded:* the `innerHTML` swap (81-88), a fixed width.
- **D-7 · A live region per card.** *Discarded:* one in `ContactSection`, reached across components.
- **D-8 · Linked cards keep their colour logos** (content, prerequisite 2). *Discarded:* Tabler
  `mail`/`brand-*`, monochrome UI glyphs for the same channels — three icons nobody asked to change.
- **D-9 · `page.clock`, stubbed `writeText`.** *Discarded:* real 1.5 s waits; a denied permission,
  which headless Chromium may not enforce on a gesture write.
- **D-10 · The scan reuses the lifted stripper.** *Discarded:* a fourth copy (`seo.test.ts:405`,
  `tokens.test.ts:18`).

## 7. Test strategy

Runners from `package.json`: `npm test` (`vitest --run tests`) for data cases and the scan;
`npm run test:e2e` (`playwright test`, 1.56, Chromium) for clipboard, boxes, live text and
colour (constitution 8). Red first today: *location once*, *four cards*, *one location*,
*clipboard*, *feedback box* (es label overflows 32px), *announce*. Each injection restored
byte-identical by explicit path, the commit naming them:

| # | Injection | Expected red |
|---|---|---|
| 1 | `about.ts` `location`, then `addressCountry`, back to the literal | location once (two runs) |
| 2 | `copyValue` returns `value` for GitHub | contact data case; clipboard |
| 3 | `contactLabel` returns the raw key | contact data case; four cards |
| 4 | location `glyph` without its `/`; then `map-pin.svg` renamed | contact icons; ui icons |
| 5 | `ContactSection` maps `CONTACTS.slice(0, 3)` | four cards |
| 6 | `.contact-glyph { display: none }` | four cards (zero box) |
| 7 | JSON-LD `addressCountry` a different string | one location |
| 8 | location card with an `<a>`; then hover back on `.contact-card:hover` | plain card (two runs) |
| 9 | inactive labels `display: none` | feedback box (rest box) |
| 10 | `width: 2rem` restored | feedback box (scroll width, es) |
| 11 | `setTimeout(…, 3000)` | feedback box (icon return) |
| 12 | `aria-live` removed | announce |
| 13 | `clearTimeout` dropped | second click |
| 14 | glyph `color: var(--neutral-200)` | glyph contrast |
| 15 | `.contact-list > li { min-width: 0 }` removed | 360 |

Then `npm run build` and the *Done when* walk: 1280×800 and 360×800, both themes and locales,
a success and a failure, `document.styleSheets` checked first, after animations settle.
