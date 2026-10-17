# Spec 023 — Pages read GitHub data without calling their own API

**Status:** implemented
**Size:** M
**Approved:** 2026-10-16 · one clarify round, one minor finding applied · 65 lines, 4 RF
**Implemented:** 2026-10-16 · commit `b67db34` · 4/4 tasks, `npm test` 240/240, e2e 114/114, build green · 4/4 RF, NFRs and edge cases validated; every route walked in both locales (sitemap 18 URLs, `torvalds/linux` 404); 4 injections red

## Context and goal

The home page, the projects page, a project page, its README and the sitemap each get GitHub
data by making an HTTP request to the site itself. On the deployed runtime every such page view
costs two function invocations, and the 30-minute cache only helps when both land on the same
instance. The sitemap fetches from the configured production address, so in local dev or a
preview deployment it lists production's repositories. The goal: pages get the same data in
process, from one cache shared with the public API routes, and the sitemap describes the
environment it runs in.

## Actors

Visitors; search engines reading the sitemap; anyone calling the public API routes.

## User stories

- US-1: As a visitor, I want a project page to load without a second round trip so that it
  appears sooner.

## Requirements (EARS)

- RF-1: WHEN a page renders GitHub data, THE SYSTEM obtains it without an HTTP request to its
  own origin. — **Check:** a test renders the home, projects and project pages with GitHub
  stubbed and fails if any request targets the site's own origin.
- RF-2: THE SYSTEM serves a repeated GitHub question from cache for 30 minutes, for pages and API
  routes alike. — **Check:** a test asks the same question twice inside the window and once past
  it, and counts one GitHub request, then two.
- RF-3: THE SYSTEM's sitemap lists the repositories of the environment it runs in. — **Check:**
  the sitemap rendered with GitHub stubbed lists the stubbed repositories and makes no request to
  the production address.
- RF-4: THE SYSTEM keeps each public API route's path, status and body. — **Check:** a test calls
  each route with GitHub stubbed and compares its answer with the shared function's result,
  including the not-found and failure cases.

## Non-functional requirements

- A GitHub failure still degrades the projects block instead of failing the page, as today.
- No visible change.

## Edge cases

- GitHub failing on the first request of a window: nothing is cached, so the next request
  retries (RF-2 counts only successful answers).
- A cached entry for a README or project the owner later deletes: served until the window ends,
  as today.

## Out of scope

- The README route's owner check and the 404/503 split — spec 021, which lands first.
- Persisting the cache across instances.

## Done when

`npm test` and `npm run test:e2e` green; each new guard shown red by injection; every route
fetched from a running dev server.

## Open questions

None.
