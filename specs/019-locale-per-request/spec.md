# Spec 019 — Locale per request

**Status:** implemented
**Size:** S
**Approved:** 2026-10-16 · one clarify round, one blocker fixed (an RF-3 check that could not fail) and two minor · 74 lines, 3 RF
**Implemented:** 2026-10-16 · commit `87aff2a` · 4/4 tasks, `npm test` 225/225, e2e 110/110, build green · 3/3 RF, NFRs and edge cases validated (no-signal requests beside English ones: 0/40 in three rounds); 4 injections red, the rendered guard fixed to send POSTs in both locales

## Context and goal

A page's strings come from whichever locale was resolved last on the server, not from the
request being rendered. Rendering waits (the projects list is fetched mid-render), so two
visitors arriving together in different languages get each other's strings. Measured on
2026-10-16 against the dev server: 40 concurrent requests alternating `?lang=es` and `?lang=en`,
three rounds, **20/40 pages carried the other locale's strings in every round**, while `<html
lang>` was right on 40/40, because it travels with the request. Any warm production instance
serving both languages at once does the same. The goal: every response is in the language its
own request asked for, whatever else is being rendered at the same time.

## Actors

Visitors, in either language. Nobody configures anything.

## User stories

- US-1: As a visitor reading in English, I want every string on the page in English even when
  someone else is loading the site in Spanish at the same moment, so that the page is readable.

## Requirements (EARS)

- RF-1: WHILE requests in different locales are being rendered at the same time, THE SYSTEM
  renders each page entirely in the locale its own request resolved. — **Check:** a rendered
  test fires at least 40 concurrent requests alternating the two locales, plain contact-form
  POSTs among them, over several rounds, and fails if any page carries a string of the other
  locale or lacks one of its own.
- RF-2: THE SYSTEM resolves a request's locale in today's order — query, then cookie, then
  `Accept-Language`, then Spanish — and still stores a locale chosen by query in the cookie. —
  **Check:** a test resolves each source alone and each pair in conflict, and reads the cookie
  written for a query that differs from it.
- RF-3: IF a string is translated outside any request, THEN THE SYSTEM uses the locale last set
  for that context, as today. — **Check:** the existing unit tests that set a locale and then
  translate (`tests/i18n.test.ts`, `tests/seo.test.ts`, `tests/project-card.test.ts`) pass with
  no change to them.

## Non-functional requirements

- No runtime dependency is added (constitution 1).
- No visitor-facing string, key or locale file changes: the fix is in where the locale lives, not
  in what is translated.
- The deployed runtime and local dev both keep working; nothing assumes a long-lived process
  beyond one request.

## Edge cases

- A request with no locale signal at all renders in Spanish, alone or concurrent with English
  ones — RF-1 and RF-2.
- A request still streaming its body while another starts — RF-1 (the concurrent check covers
  pages whose render spans another request's start).
- The plain contact form POST (spec 015) renders the page in the locale of its own URL — RF-1,
  whose check includes those POSTs.

## Out of scope

- Client-side translation: there is none; every string is rendered on the server.
- Adding a third locale, pluralisation or number formats.
- The `<html lang>` attribute, which is already per request.

## Done when

`npm test` and `npm run test:e2e` green; the RF-1 guard shown red against today's code (the
20/40 above) and green after; the RF-2 guard shown red by injecting a swapped resolution order;
`npm run build` green.

## Open questions

None.
