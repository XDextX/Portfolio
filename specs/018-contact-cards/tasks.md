# Tasks 018 — Contact cards: location card and copy controls

**Spec:** `specs/018-contact-cards/spec.md` (**approved**, 6 RF).
**Plan:** `specs/018-contact-cards/plan.md` (**approved**).

**Cross-spec order.** 016, 007, 008, 017, 009 and 010–014 have landed; then 018, 015.
This spec reuses, and does not recreate: `tests/helpers/colour.ts` (`contrast`, 016/009),
`e2e/helpers/dev-server.ts` and the theme setup (007), `.icon-btn:hover` on
`--accent-surface-text` (007), `public/icons/ui/` with `NOTICE.md`, the Tabler licence and the
*ui icons* guard (008), `e2e/helpers/rendered.ts` (`openIn`, `installHelpers` with `__groundOf`, `settled`), the
`.icon-btn` border in `--control-border` (017), brand logos as colour files (012) and the
`about.social.email` key (010). Re-read `ContactCard.astro` after 007 and 017: the plan's line
numbers are from before them. 015 depends on this spec's lifted `stripComments`.

Injection numbers refer to the table in plan §7. No personal value is written here or in a
test: the location is "the location datum".

- [x] **T-1 — Confirm the two prerequisite amendments are in force**
  Covers: none (mechanical; spec *Prerequisites* 1–2)
  Files: `docs/constitution.md`, `AGENTS.md`, `.husky/pre-commit` (read; written only if missing)
  Done when: constitution 7 names the e2e suite as policy and `.husky/pre-commit` runs it;
  `AGENTS.md` states that brand logos are content. If either is missing, it is written here
  as its own `docs:` commit, when you ask for one.

- [x] **T-2 — Download the `map-pin` glyph**
  Covers: RF-1 (asset); NFR icons
  Files: `public/icons/ui/map-pin.svg` (download), `public/icons/ui/NOTICE.md`
  Done when: fetched under the owner's standing OK for icons (plan §2: Tabler v3.49.0,
  outline, MIT, 475 B); after it, the file is unmodified, its byte count reported, and
  `NOTICE.md` carries its row.

- [x] **T-3 — Write the data cases and the *location once* scan**
  Covers: RF-2, support for RF-1 and RF-4
  Files: `tests/contact.test.ts`, `tests/about.test.ts`, `tests/visual-language.test.ts`
  Done when: the shape, href and icon checks read the union; `copyValue` and `contactLabel`
  cases and "exactly one location entry" exist; `stripComments`/`componentFiles` sit at
  module scope in `about.test.ts`, with `<!-- -->` stripping; *location once* and the glyph
  read in *ui icons* exist; the new cases are **red on today's code** (the literal appears
  twice, no location entry, no helpers) and the existing ones still pass.

- [x] **T-4 — One location datum: type, helpers, data, About**
  Covers: RF-2, RF-4 (helper half)
  Files: `src/types/contact.ts`, `src/utils/contact.ts` (new), `src/data/contacts.ts`,
  `src/data/about.ts`, `src/components/AboutSection.astro`
  Done when: T-3's cases green; `about.ts` still imports `contacts.ts` one way (no cycle);
  the About section's socials keep their `t(labelKey)` text (010) and its location span
  renders only when the datum exists;
  injections 1–4 shown red and restored byte-identical.

- [x] **T-5 — Write the rendered checks**
  Covers: RF-1–RF-6; NFR glyph contrast, 360px; edge cases denied clipboard, second click
  Files: `e2e/contact-cards.spec.ts` (new)
  Done when: *four cards*, *one location*, *plain card*, *clipboard*, *feedback box* (both
  outcomes), *announce*, *second click*, *glyph contrast* and *360* exist over `/?lang=es` and
  `/?lang=en`, both themes, with `page.clock` and a rejecting `writeText` stub (plan D-9);
  *four cards*, *clipboard*, *feedback box* and *announce* are **red on today's code**.

- [x] **T-6 — Rebuild `ContactCard`: plain location card, stacked copy label, live region**
  Covers: RF-1, RF-3–RF-6
  Files: `src/components/ContactCard.astro`, `i18n/locales/es.json`, `i18n/locales/en.json`
  Done when: `npm test` and `npm run test:e2e` green; injections 5–15 shown red as plan §7
  predicts and restored byte-identical; `data-copied`/`data-error` gone (grep empty);
  `tests/tokens.test.ts` green.

- [x] **T-7 — See the section in both themes and both locales**
  Covers: RF-1–RF-6 as rendered; the spec's *Done when*
  Files: none
  Done when: `npm run build` green; from a running dev server, `document.styleSheets` checked
  first and animations settled, at 1280×800 and 360×800, light and dark, es and en: four
  cards, one copy that succeeds and one that fails, the control's box unchanged through the
  label, no page scroll at 360px. **Stop for your visual approval.**

  After approval: one commit naming the 15 injections, and the spec to `implemented` once
  validated; both only when you ask.
