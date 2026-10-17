# Spec 021 — GitHub routes serve only the owner's repositories

**Status:** implemented
**Size:** M
**Approved:** 2026-10-16 · one clarify round, one minor finding applied · 73 lines, 4 RF
**Implemented:** 2026-10-16 · commit `1cbd6a1` · 5/5 tasks, `npm test` 231/231 at the time, e2e 114/114 · 4/4 RF, NFRs and edge cases validated (owner in any case; unavailable state 6.66:1 or more, light and dark, es and en, 1280 and 360, owner visual approval); 4 injections red

## Context and goal

Three faults in how the site talks to GitHub, found by the 2026-10-16 audit:

- The README route fetches any repository on GitHub: `/api/v1/projects/readme/torvalds/linux/
  readme.json` answered 200 with Linux's README. Every such request spends the site's token
  quota (shared with the project list) and stays in a memory cache that never drops entries.
- A project page treats every failure as "this project does not exist": GitHub answering 403
  (rate limit) or 500 sends the visitor to the not-found page, and the redirect is a 302, so
  search engines see a redirect instead of a 404.
- The GitHub user is read from configuration by the project list and written as a literal by the
  project route; changing the configured user would make every project page answer not-found.

The goal: the routes serve the configured user's repositories only, tell "does not exist" apart
from "GitHub is unavailable", and name the user once.

## Actors

Visitors reading a project page; anyone calling the public routes, bots included.

## User stories

- US-1: As a visitor opening a project while GitHub is down, I want to be told it is temporarily
  unavailable so that I do not conclude it was deleted.

## Requirements (EARS)

- RF-1: IF a README is requested for an owner other than the configured GitHub user, THEN THE
  SYSTEM answers not-found without contacting GitHub. — **Check:** a test calls the README route
  for another owner with GitHub stubbed, and fails unless it answers 404 with zero requests made;
  the configured owner still gets the README, also when spelled in another case.
- RF-2: IF a requested project does not exist, THEN THE SYSTEM answers the project URL with the
  not-found page and status 404, without redirecting. — **Check:** a rendered request for an
  unknown project reads status 404, no `Location` header, and the not-found title.
- RF-3: IF a project cannot be fetched for any reason other than not existing, THEN THE SYSTEM
  answers status 503 with a page saying the project is temporarily unavailable. — **Check:** a
  test with GitHub stubbed to 403 and to 500 reads status 503 and the unavailable text in each
  locale.
- RF-4: THE SYSTEM queries GitHub for the configured user only, in every route that names one.
  — **Check:** with the configured user set to a value other than today's, a test reads the
  user in the URLs requested by the list and by the project route, and fails on any other.

## Non-functional requirements

- The unavailable text goes through `t()` in both locales and clears 4.5:1 in both themes, like
  every other page text.
- No change to what a visitor sees for a project that loads.

## Edge cases

- Owner names differing only in case (`xdextx` vs `XDextX`): GitHub logins are
  case-insensitive, so RF-1 compares them case-insensitively.
- GitHub answering 404 for the README of an existing repository keeps today's "no README" note.

## Out of scope

- Where the cache lives and pages calling their own API over HTTP — spec 023.
- Sanitising README HTML: GitHub renders it sanitised, and RF-1 limits it to the owner's repos.

## Done when

`npm test` and `npm run test:e2e` green; each new guard shown red by injection; the unavailable
state seen in both themes and both locales, stopping for the owner's visual approval.

## Open questions

None.
