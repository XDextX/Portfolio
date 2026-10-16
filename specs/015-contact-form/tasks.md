# Tasks 015 — Contact form, sent from the server

**Spec:** `specs/015-contact-form/spec.md` (**approved**, 24 RF).
**Plan:** `specs/015-contact-form/plan.md` (**approved**).

**Cross-spec order.** 016, 007, 008, 017, 009, 010–014 and 018 have landed; 015 is last.
This spec reuses, and does not recreate: `tests/helpers/colour.ts` (`contrast`, 016/009),
`e2e/helpers/dev-server.ts`, the theme setup and the unscoped `.btn--primary` (007),
`e2e/helpers/rendered.ts` (`openIn`, `installHelpers` with `__groundOf`, `settled`), the section title (008),
`--control-border` (017), the focus ring (016), `about.social.email` (010), 018's rewritten
cards (three, no location card) and the local HTML-aware stripper in `tests/about.test.ts`,
which T-2 moves to `tests/helpers/source.ts`.

**Size.** Ten tasks for 24 RF, at the skill's limit. If any task here needs two sittings, split
the spec at the seam the tasks already follow: server (RF-4–RF-14, T-2–T-5) and form
(RF-1–RF-3, RF-15–RF-24, T-6–T-8).

**Configuration** is named, never valued: `MAILTRAP_API_TOKEN`, `CONTACT_FROM_EMAIL`, optional
`MAILTRAP_ENDPOINT`. No automated test touches the network; addresses only on reserved domains.

Injection numbers refer to the table in plan §7.

- [x] **T-1 — Amend constitution 6 and confirm constitution 7**
  Covers: none (mechanical; spec *Prerequisites* 2–3)
  Files: `docs/constitution.md`; `.husky/pre-commit` (read)
  Done when: constitution 6 reads "every secret has one reader" (RF-13 has a rule behind it);
  constitution 7 names the e2e suite and `.husky/pre-commit` runs it (landed with 007/009, or
  written here). Its own `docs:` commit, when you ask for one.

  First, so the code commit points at rules that already exist.

- [x] **T-2 — Add the test helpers and the handler's data cases**
  Covers: RF-4–RF-8, RF-10–RF-12, RF-14 (tests)
  Files: `tests/helpers/source.ts` (new), `tests/helpers/contact-mocks.ts` (new),
  `tests/about.test.ts`, `tests/contact-form.test.ts` (new)
  Done when: the HTML-aware `stripComments` lives in `source.ts` and `about.test.ts` imports it with no
  behaviour change (green); *recipient*, *rules*, *gate*, *honeypot*, *limit*, *failure*,
  *silence* and *plain text* exist over a recording sender, a fake schedule and a captured
  console, and are **red on today's code** (no `contact.ts`); `grep -rn "gmail\.com" tests/`
  empty.

- [x] **T-3 — Write the pure handler**
  Covers: RF-4–RF-8, RF-10–RF-12, RF-14
  Files: `src/pages/lib/contact.ts` (new)
  Done when: T-2's cases green; nothing in the file reads the env, a clock or the network;
  injections 1–9 shown red as plan §7 predicts and restored byte-identical.

- [x] **T-4 — Write the sender, seam and secret-scan cases**
  Covers: RF-9, RF-13, RF-14 (tests)
  Files: `tests/contact-form.test.ts`
  Done when: *config* (each variable missing, `fetchImpl` never called), *payload* (`<b>`
  verbatim, no `html`, Bearer, `User-Agent`), *seam* (`dev: false` never selects the stub or
  the header key) and *one reader* (comment-stripped `src/**`, `MAILTRAP_API_TOKEN` and
  `GITHUB_TOKEN` each only in its reader, plan D-9) exist and are **red on today's code**.

- [x] **T-5 — Write the Mailtrap reader, the runtime wiring and the e2e stub**
  Covers: RF-9, RF-13, RF-14
  Files: `src/pages/lib/mailtrap.ts` (new), `src/pages/lib/contact-runtime.ts` (new),
  `e2e/helpers/stub-sender.ts` (new)
  Done when: T-4's cases green; the real sender runs only against a fake `fetchImpl`;
  injections 10–12 shown red and restored byte-identical.

- [x] **T-6 — Write the rendered checks and the e2e server**
  Covers: RF-1–RF-3, RF-13, RF-15–RF-24; NFR contrast, honeypot, 360px
  Files: `e2e/contact-form.spec.ts` (new), `playwright.config.ts`
  Done when: the `webServer` entry on port 4329 with `CONTACT_E2E` and fake values only is in
  place (`channel: 'chrome'` already is, 007); *names*, *privacy*, *limits*, *trap*, *plain*,
  *enhanced*, *client assets*, *contrast* and *360* exist, both locales and themes, a fresh
  `x-e2e-client` per test; all **red on today's code**; the existing e2e specs still pass on
  their own server.

- [x] **T-7 — Render the form and answer the plain POST**
  Covers: RF-1–RF-3, RF-15–RF-17, RF-23 (scripts off)
  Files: `src/components/ContactForm.astro` (new, markup and styles),
  `src/components/ContactSection.astro`, `src/pages/index.astro`, `src/env.d.ts` (new),
  `i18n/locales/es.json`, `i18n/locales/en.json`
  Done when: *names*, *privacy*, *limits*, *trap* and *plain* green (valid, `a@b`, fourth
  valid → limited, the fail subject → failed: status, values, URL, descriptions); the privacy
  line equals spec Decision 6 in each locale; injections 13–15 and 19 shown red and restored
  byte-identical; `tests/i18n.test.ts` and `tests/tokens.test.ts` green.

- [x] **T-8 — Add the API route and the enhanced submit**
  Covers: RF-18–RF-24
  Files: `src/pages/api/contact.ts` (new), `src/components/ContactForm.astro` (script)
  Done when: `npm test` and `npm run test:e2e` green, *enhanced* and *client assets*
  included; injections 16–18 shown red and restored byte-identical; `npm run build` green
  and its output holds neither the stub's fail subject nor `e2e-fake-token`.

- [x] **T-9 — See every outcome in both themes**
  Covers: RF-1–RF-24 as rendered; the spec's *Done when* (walk)
  Files: none
  Done when: from the e2e-configured dev server, `document.styleSheets` checked first, at
  1280×800 and 360×800, light and dark, es and en: rest, *sent*, *invalid*, *limited* and
  *failed*, each with scripts on and off; values kept where RF-16/RF-20 say, errors under
  their fields, no page scroll at 360px. **Stop for your visual approval** (the one stop of
  the implementation, owner 2026-10-16; T-10's manual send also needs you).

  After approval: one code commit naming the 19 injections, only when you ask.

- [ ] **T-10 — One manual send to the Mailtrap sandbox, with your configuration**
  Covers: the spec's *Done when* (manual send); spec *Prerequisites* 1
  Files: none (your local server-side configuration; never read or echoed by the agent)
  Done when: **stop for you**: you set the sandbox token, `MAILTRAP_ENDPOINT` and
  `CONTACT_FROM_EMAIL` locally, send one message from the form, and confirm it arrived in the
  sandbox; then you set `MAILTRAP_API_TOKEN` and `CONTACT_FROM_EMAIL` in production. No
  automated test does this.

  Last, because nothing automated depends on it; the spec goes to `implemented` once
  validated, when you ask.
