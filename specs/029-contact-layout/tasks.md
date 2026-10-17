# Tasks 029 — Contact section arranged like the proposal

**Spec:** `specs/029-contact-layout/spec.md` (7 RF) · **Plan:** `plan.md`
**Status:** approved
**Approved:** 2026-10-17 · owner approval with the spec · 32 lines

Injection numbers refer to plan §7.

- [x] **T-1 — Write the data and rendered checks**
  Covers: RF-1 to RF-7
  Files: `tests/contact.test.ts`, `e2e/contact-layout.spec.ts`, `e2e/contact-cards.spec.ts`
  Done when: **red on today's section** (cards in a wrapping row, form below with labels above,
  uppercase labels, the Gmail logo, button at text width).

- [x] **T-2 — Email glyph and sentence-case cards in an equal grid**
  Covers: RF-2, RF-3, RF-4
  Files: `src/types/contact.ts`, `src/data/contacts.ts`, `src/components/ContactCard.astro`,
  `public/icons/gmail.svg` (deleted), `public/icons/NOTICE.md`
  Done when: RF-2 to RF-4 green; spec 018's guards green; injections 2, 3 and 4 red and restored.

- [x] **T-3 — Two-column section and the form's field boxes**
  Covers: RF-1, RF-5, RF-6, RF-7
  Files: `src/components/ContactSection.astro`, `src/components/ContactForm.astro`
  Done when: RF-1, RF-5 to RF-7 green; spec 015's guards green; injections 1, 5, 6 and 7 red and
  restored; `npm test` and `npm run test:e2e` green.

- [x] **T-4 — See the section**
  Covers: the spec's visual *Done when*
  Files: none
  Done when: light and dark at 1280, 800 and 390 px beside the mockup, at rest, with a field
  filled and with one invalid, stylesheet confirmed loaded. **Stop for the owner's visual
  approval.**
