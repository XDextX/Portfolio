# Tasks 045 — Contact cards without their value on a phone

**Spec:** `specs/045-contact-card-values/spec.md` (6 RF) · **Plan:** `plan.md`
**Status:** approved
**Approved:** 2026-10-18 · owner approval · 38 lines

Injection numbers refer to block 7 of the plan.

Precondition for every task: spec 048 is merged into `main` and `spec/045-contact-card-values` is
cut after it, so the coarse-pointer checks measure 44 px controls (plan, precondition).

- [x] **T-1 — Write the spec 045 guards, red first**
  Covers: RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, the threshold NFR
  Files: `e2e/contact-cards.spec.ts`
  Done when: `npx playwright test e2e/contact-cards.spec.ts` runs the new describe; RF-1 and RF-4
  fail against today's code (values visible at 360, label at 12 px muted); RF-2, RF-3 and RF-6
  pass, since they describe what must not change.

- [x] **T-2 — Hide the value and restyle the label at phone width**
  Covers: RF-1, RF-4, RF-5 (RF-2, RF-3, RF-6 held)
  Files: `src/components/ContactCard.astro`, `src/components/ContactSection.astro` (comment at
  lines 89–92 only)
  Done when: the T-1 describe is green; injections 1 to 5 each turn their check red and are
  reverted by explicit path; the ContactSection comment carries no measurement of the value's
  ellipsis at 360 or 414 px.

- [x] **T-3 — Run both suites**
  Covers: none (mechanical: regression)
  Files: none
  Done when: `npm test` and `npm run test:e2e` green, `e2e/contact-layout.spec.ts` and
  `e2e/hero-layout.spec.ts` included (both read `.contact-value` or `.contact-label`).

- [x] **T-4 — Read the section on the dev server**
  Covers: the spec's visual *Done when*
  Files: none
  Done when: `#Contact` read at 360, 390, 720, 721 and 1280 px in light and dark, after a restart
  of the dev server and with the 720 px rule confirmed in `document.styleSheets`; 390 also with a
  coarse pointer. **Stop for the owner's visual approval.**
