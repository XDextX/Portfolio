# Plan 023 — Pages read GitHub data without calling their own API

**Spec:** `specs/023-pages-without-self-fetch/spec.md` (**approved**, 4 RF).
**Status:** approved
**Approved:** 2026-10-16 · owner approval of plans and tasks 021–024 together, order 022, 024, 021, 023 · 93 lines
**Changed:** 2026-10-16 · at implementation: `cached` sweeps expired entries on every write, so cached not-found answers cannot grow memory past one window; the README route drops `X-Cache`, meaningless without its own cache

**Ordering.** Implementation order across 021–024: 022, 024, 021, 023. After 021: it moves 021's README owner check and 404/503 split into the shared
functions, and 021's guards must stay green through the move.

## 1. Scope and coverage

| RF | Covered by |
|---|---|
| RF-1 (no request to its own origin) | §4: `Resume`, `/proyectos`, `/proyectos/[name]`, `Readme` and the sitemap call `listRepos`, `getRepo` and `getReadme` from `github.ts` instead of `fetch`ing `/api/...`. Container guard in §7. |
| RF-2 (one 30-minute cache for pages and routes) | §3: one memo in `github.ts` behind the three functions; the routes call the same functions, so their own `cache` variables go. Data guard in §7. |
| RF-3 (sitemap of its own environment) | The sitemap calls `listRepos()`; no `fetch` to `site`. Guard in §7. |
| RF-4 (routes unchanged) | Each route becomes a thin wrapper over the shared function, keeping its path, statuses and bodies. Data guard in §7. |

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `src/pages/lib/github.ts` | modify | Owns the GitHub cache and the three cached reads; decides what a missing repository or README returns. The raw `gh*` functions stay, uncached. |
| `src/pages/api/github-list.json.ts`, `api/v1/projects/[name].json.ts`, `api/v1/projects/readme/…/readme.json.ts` | modify | Turn a shared function's answer into HTTP; no cache of their own. |
| `src/components/Resume.astro`, `src/pages/proyectos/index.astro`, `src/pages/proyectos/[name].astro`, `src/components/Readme.astro` | modify | Call the shared functions; keep today's failure handling. |
| `src/pages/sitemap.xml.ts` | modify | Lists `listRepos()`; keeps its own XML cache. |
| `tests/github-cache.test.ts` | create | RF-1 to RF-4. |
| `tests/project-card.test.ts` | modify | Its `fetch` stub answers GitHub's URLs instead of `/api/v1/projects/`, and it clears the cache between renders. |

## 3. Pure logic

```ts
// github.ts
const TTL_MS = 30 * 60 * 1000;
const memo = new Map<string, { at: number; value: unknown }>();
async function cached<T>(key: string, now: number, read: () => Promise<T>): Promise<T>;
  // hit when now - at < TTL_MS; stores only a successful read (a throw stores nothing)
export function listRepos(now = Date.now()): Promise<GitHubRepo[]>;         // key "list:<topic>"
export function getRepo(name: string, now = Date.now()): Promise<GitHubRepo | null>;   // "repo:<name>"
export function getReadme(owner: string, name: string, now = Date.now()): Promise<string | null>;
  // !isOwner(owner) → null before any read (021's rule, now shared); key "readme:<lower owner>/<name>"
export function clearGitHubCache(): void;   // for tests: memo.clear()
```

`now` is a parameter, never read inside `cached` (skill rule). `null` answers (not found) are
cached like any value, as the routes do today for found ones only — D-3 says why that changes.

## 4. Algorithm

```
Resume / proyectos:   try { repos = sortRepos(await listRepos()) } catch { fetchError … }   (as today)
project page:         repo = await getRepo(name)                       (throw → 503, null → rewrite 404)
Readme:               html = await getReadme(repo.owner.login, repo.name)  (null → missing note)
sitemap:              try { repos = await listRepos() } catch { static routes only }
github-list route:    200 listRepos() | 500 on throw
project route:        200 getRepo() | 404 on null | 500 on throw
README route:         400 missing params | 200 getReadme() as text/html | 404 on null | 500 on throw
```

## 5. Interface

No visible change.

## 6. Decisions

- **D-1 · Cached functions beside the raw ones.** *Discarded:* caching inside `ghListByTopic`
  and friends — their tests stub `fetch` per case and would read each other's cached answers.
- **D-2 · `clearGitHubCache()` exported for tests.** *Discarded:* `vi.resetModules()` before
  every render — it reloads the i18n module too, losing the locale the test just set.
- **D-3 · A not-found answer is cached for the window.** *Discarded:* caching only hits, as the
  routes do — a bot asking for absent names would reach GitHub on every request; 021 already
  limits README owners, and a project name is a single segment.
- **D-4 · Keep the public routes.** *Discarded:* deleting them once no page calls them — they
  are public URLs, and RF-4 keeps them.

## 7. Test strategy

Runner from `package.json`: `npm test` (vitest) and `npm run test:e2e` (Playwright).

- **RF-1** (`tests/github-cache.test.ts`, Container API): render the home page, `/proyectos` and
  a project page with `fetch` stubbed to answer GitHub; record every URL; fail on any whose
  origin is the request's (`https://example.test`).
- **RF-2**: `listRepos(t)`, `listRepos(t + 1)`, `listRepos(t + TTL_MS)` → GitHub stub called once,
  then twice; a first read that throws leaves the next one calling again; the same for `getRepo`.
- **RF-3**: render the sitemap with GitHub stubbed → the stubbed names are listed and no URL
  requested starts with the production address.
- **RF-4**: call each route's `GET` with GitHub stubbed for found, not-found and failing
  answers → status, content type and body equal the shared function's result.
- **021 carried over:** `tests/github-routes.test.ts` and `e2e/github-routes.spec.ts` unchanged
  and green.
- **Injections:** (1) `Resume` back to `fetch('/api/github-list.json')` → RF-1 red; (2) `cached`
  ignores the memo → RF-2 red; (3) the sitemap back to fetching `site` → RF-3 red; (4) the
  project route answers 200 with `null` for a missing repository → RF-4 red.
