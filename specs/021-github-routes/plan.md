# Plan 021 — GitHub routes serve only the owner's repositories

**Spec:** `specs/021-github-routes/spec.md` (**approved**, 4 RF).
**Status:** approved
**Approved:** 2026-10-16 · owner approval of plans and tasks 021–024 together, order 022, 024, 021, 023 · 108 lines
**Changed:** 2026-10-16 · at implementation: the rewrite carries the query (`/404${search}`), since a bare `/404` rendered the not-found page in Spanish for `?lang=en`; the page style moved to the top level because Astro does not scope a `<style>` inside an expression; `tests/notfound.test.ts` reads the rewrite target instead of the redirect

**Ordering.** Implementation order across 021–024: 022, 024, 021, 023. After 022, so its rendered check reads the e2e address from
`e2e/helpers/server.ts`. Lands before 023, which moves these routes' fetches and caches into `github.ts`;
023 carries RF-1's owner check into the shared function, so this spec's guards must keep
passing there.

## 1. Scope and coverage

| RF | Covered by |
|---|---|
| RF-1 (README only for the configured user) | §4: the README route compares `owner` with `USER`, case-insensitively, and answers 404 before any request. Data guard in §7. |
| RF-2 (unknown project → 404, no redirect) | §4: the project page rewrites to the not-found page on a 404 from the project route instead of `Astro.redirect('/404')`. Rendered guard in §7. |
| RF-3 (any other failure → 503) | §4: any other non-OK answer, or a throw, sets status 503 and renders the unavailable state. Container guard in §7. |
| RF-4 (one user) | `github.ts` exports `USER`; `ghRepo` defaults its `user` to it and the project route stops passing `"XDextX"`. Data guard in §7. |

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `src/pages/lib/github.ts` | modify | Owns the configured user (`USER`, now exported) and defaults `ghRepo`'s user to it. |
| `src/pages/api/v1/projects/readme/[owner]/[name]/readme.json.ts` | modify | Refuses any owner but the configured user, before touching GitHub or its cache. |
| `src/pages/api/v1/projects/[name].json.ts` | modify | Asks for the configured user's repository; no literal user. |
| `src/pages/proyectos/[name].astro` | modify | Decides between the project, the not-found page and the unavailable state. |
| `i18n/locales/es.json`, `en.json` | modify | `project.unavailable.{title,message}`. |
| `tests/github-routes.test.ts` | create | RF-1 and RF-4 as data; RF-3 through the Container API. |
| `e2e/github-routes.spec.ts` | create | RF-2 rendered on the e2e server. |

## 3. Pure logic

```ts
// github.ts
export const USER: string;                       // GITHUB_USERNAME || "XDextX", as today
export function isOwner(login: string): boolean; // login.toLowerCase() === USER.toLowerCase()
ghRepo({ user = USER, name })                    // default added, signature otherwise unchanged
```

No clock is read.

## 4. Algorithm

```
README route GET({ params }):
  if !owner || !name            → 400 (as today)
  if !isOwner(owner)            → 404 { error: "README not found" }, no fetch, no cache write
  … as today

project page:
  res = await fetch(`${origin}/api/v1/projects/${name}.json`)   (023 replaces this call)
  if res.status === 404          → return Astro.rewrite('/404')        (status 404, no Location)
  if !res.ok or the fetch throws → Astro.response.status = 503; render the unavailable state:
                                    BaseLayout(title = t('project.unavailable.title') - Portfolio,
                                    description = t('project.unavailable.message')),
                                    h1 + message + a link back to /proyectos
  else                           → the page as today
```

`Astro.rewrite('/404')` renders `src/pages/404.astro` under the requested URL with status 404;
T-3 confirms the status and the absent `Location` before relying on it.

## 5. Interface

| State | Light and dark, es and en |
|---|---|
| Project loads | unchanged |
| Unknown project | the existing not-found page, at the project's URL |
| GitHub unavailable | the page frame, an `h1` "Proyecto no disponible" / "Project unavailable", the message, and the existing ghost back button to `/proyectos`; no sidebar, no README |

Copy, in the locale files only: es «Proyecto no disponible» / «GitHub no responde ahora mismo.
Inténtalo de nuevo en unos minutos.»; en "Project unavailable" / "GitHub is not responding right
now. Try again in a few minutes."

## 6. Decisions

- **D-1 · The owner check lives in `github.ts` (`isOwner`), called by the route.** *Discarded:*
  comparing in the route alone — 023 moves the README fetch into the shared function, which
  must refuse the same owners.
- **D-2 · `Astro.rewrite('/404')` for an unknown project.** *Discarded:* `Astro.redirect` (a 302,
  the bug); copying the not-found markup into the project page (a second copy that drifts).
- **D-3 · 503 for every non-404 failure**, 403 included. *Discarded:* passing GitHub's status
  through — a 403 would read as "forbidden" to a crawler, and to the visitor it is the same
  outage.
- **D-4 · Case-insensitive owner comparison.** *Discarded:* exact match — GitHub logins are
  case-insensitive, and the URL carries whatever case the link was built with.

## 7. Test strategy

Runner from `package.json`: `npm test` (vitest) and `npm run test:e2e` (Playwright).

- **RF-1** (`tests/github-routes.test.ts`): call the README route's `GET` with
  `owner: 'torvalds'`, `fetch` stubbed and counting → 404 and zero calls; `owner: 'xdextx'` →
  200 with the stubbed body and one call.
- **RF-4**: `vi.stubEnv('GITHUB_USERNAME', 'someone')`, `vi.resetModules()`, import `github.ts`
  and the project route afresh; stub `fetch`; call `ghListByTopic`, `ghRepo({ name })` and the
  route's `GET` → every requested URL names `someone`, none `XDextX`.
- **RF-3**: Container `renderToResponse` of the project page, `fetch` stubbed to 403 and then
  500 for the project route → status 503 and `project.unavailable.title` in each locale.
- **RF-2** (`e2e/github-routes.spec.ts`): `request.get` an unknown project at `E2E_URL` with
  `maxRedirects: 0` → 404, no `Location`, the not-found title.
- **Injections:** (1) the route drops `isOwner` → RF-1 red; (2) the project route passes
  `"XDextX"` again → RF-4 red; (3) the page goes back to `Astro.redirect('/404')` → RF-2 red;
  (4) the page sends every failure to the rewrite → RF-3 red.
- **Visual:** the unavailable state from a dev server started with an invalid `GITHUB_TOKEN`
  (GitHub answers 401, so every project page is unavailable), both themes and locales.
