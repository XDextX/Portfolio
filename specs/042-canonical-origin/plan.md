# Plan 042 — One canonical origin

**Spec:** `specs/042-canonical-origin/spec.md` (6 RF).
**Status:** approved
**Approved:** 2026-10-18 · owner approval · 148 lines

## 1. Scope and coverage

| RF / item | Covered by |
|---|---|
| RF-1 (canonical, hreflang) | `BaseLayout.astro` takes its production origin from `CANONICAL_ORIGIN` instead of `Astro.site ?? Astro.url`. |
| RF-2 (sitemap) | `sitemap.xml.ts` composes every `<loc>` from `CANONICAL_ORIGIN`; its literal and its `site` read go. |
| RF-3 (robots) | A new route `robots.txt.ts` writes the file from `CANONICAL_ORIGIN`; `public/robots.txt` is deleted. |
| RF-4 (JSON-LD) | `about.ts` (person), `proyectos/index.astro` (collection) and `proyectos/[name].astro` (project) take the origin from `CANONICAL_ORIGIN`. |
| RF-5 (one source) | `src/data/site.ts` holds the one literal; `astro.config.mjs` imports it for `site`. A guard pins the value and scans for copies. |
| RF-6 (README) | Both live-site links in `README.md` move to the canonical origin. A guard reads them. |
| NFR 034 holds | `og:url` and the image tags keep `Astro.url.origin`; their guards are not touched. |
| NFR path and query | Only the origin expression changes in each place; e2e checks each path rule. |
| NFR robots directives | The route writes today's `User-agent` / `Allow` / `Disallow` lines. |
| Edge: GitHub fails | The sitemap's existing `try/catch` stays; a unit test stubs the failure. |
| P-1 regex readers | `tests/seo.test.ts:1070` and `e2e/og-cover-layout.spec.ts:16` import `CANONICAL_ORIGIN` instead of regex-matching `astro.config.mjs`. |
| P-2 `github-cache` | `tests/github-cache.test.ts` drops `PRODUCTION` and reads `CANONICAL_ORIGIN`. |
| P-3 unset `site` | No route reads `Astro.site` any more (D-2), so an unset `site` changes no identity URL. |

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `src/data/site.ts` | create | The one place the canonical origin is written: `CANONICAL_ORIGIN`. |
| `astro.config.mjs` | modify | Declares `site` from `CANONICAL_ORIGIN`, so Astro's own `site` is a derived copy rather than a second source. |
| `src/layouts/BaseLayout.astro` | modify | Decides which origin canonical and hreflang name; the social tags keep the serving origin. |
| `src/pages/sitemap.xml.ts` | modify | Decides the origin of every `<loc>`, whatever the request or `site` say. |
| `src/pages/robots.txt.ts` | create | Writes `robots.txt`: today's directives plus the sitemap line on the canonical origin. |
| `public/robots.txt` | delete | A static file would shadow the route and keep a second copy of the host. |
| `src/data/about.ts` | modify | The person's JSON-LD `url` names the canonical origin. |
| `src/pages/proyectos/index.astro` | modify | The collection's JSON-LD `url` is the canonical origin plus the request's path and query. |
| `src/pages/proyectos/[name].astro` | modify | The project's JSON-LD `url` is the canonical origin plus `/proyectos/<name>`. |
| `README.md` | modify | The badge's link and the "Live:" link name the canonical origin. |
| `tests/canonical-origin.test.ts` | create | RF-5's value and copy scan, RF-6's README links, RF-3's route output. |
| `tests/seo.test.ts` | modify | P-1, and RF-1 rendered through the Container (now possible, D-2). |
| `tests/github-cache.test.ts` | modify | P-2, RF-2 and the GitHub-fails edge case. |
| `e2e/og-cover-layout.spec.ts` | modify | P-1. |
| `e2e/canonical-origin.spec.ts` | create | RF-1 to RF-4 and the path-and-query NFR on the running dev server. |

## 3. Pure logic

```ts
/** The production origin every identity URL names (spec 042). */
export const CANONICAL_ORIGIN = 'https://www.xdextx.dev';
```

Nothing else is new logic: each consumer prefixes the path it already composes. Nothing reads the
clock; the sitemap's TTL cache is untouched.

## 4. Algorithm

```ts
// BaseLayout.astro
const production = CANONICAL_ORIGIN                         // was new URL(Astro.site ?? Astro.url).origin
// sitemap.xml.ts
const origin = CANONICAL_ORIGIN                             // was (site?.origin ?? SITE); GET no longer reads `site`
// robots.txt.ts
GET = () => new Response(
  `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${CANONICAL_ORIGIN}/sitemap.xml\n`,
  { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
// about.ts            url: CANONICAL_ORIGIN
// proyectos/index     url: `${CANONICAL_ORIGIN}${Astro.url.pathname}${Astro.url.search}`
// proyectos/[name]    url: `${CANONICAL_ORIGIN}/proyectos/${repo.name}`
// astro.config.mjs    import { CANONICAL_ORIGIN } from './src/data/site.ts';  site: CANONICAL_ORIGIN
```

The collection keeps its query, as `Astro.url.href` does today (spec out of scope). The person's
`url` stays without a trailing slash, as today. `robots.txt` drops the two Spanish comments: they
are not a directive and the NFR keeps only directives.

## 5. Interface

Nothing visible changes. On every origin — production, a preview, localhost — the head, the
sitemap, `robots.txt` and the JSON-LD name `https://www.xdextx.dev`; the social tags name the
serving origin, as in 034. With GitHub down, the sitemap lists `/` and `/proyectos` only, on the
canonical origin. Light and dark are not concerned.

## 6. Decisions

- **D-1 · A TypeScript module is the source, and `astro.config.mjs` imports it.** The config
  already imports `src/utils/styles-version.ts`. *Discarded:* the config's `site` as the source,
  read through `Astro.site` or `import.meta.env.SITE` — `about.ts` has no `Astro` context, the
  Container leaves `Astro.site` empty (`tests/seo.test.ts:1080`), and vitest does not load the
  config, so every unit test would need its own copy.
- **D-2 · Consumers import `CANONICAL_ORIGIN`; none reads `Astro.site`.** This settles P-3: an
  unset `site` reaches no identity URL, and the Container can now check canonical too. *Discarded:*
  keeping `Astro.site ?? CANONICAL_ORIGIN`, which is two paths to one value, and the old
  `?? Astro.url` fallback, which turned an unset `site` into a preview claiming to be canonical.
- **D-3 · Keep `site` in the config.** *Discarded:* deleting it, since nothing in this repo reads
  it after D-2 — but `Astro.site` and any future integration would then be `undefined` without
  a sound.
- **D-4 · `src/data/`, a file of its own.** *Discarded:* `about.ts`, which would make the config
  import the whole identity and its contacts to read one string.
- **D-5 · `robots.txt` as a route, `public/robots.txt` deleted** (owner, clarify 3.1). *Discarded:*
  a build script writing the static file, which is a second copy on disk that drifts until rerun.
- **D-6 · The README badge is checked on its `href` only.** Its visible content is an image whose
  alt is "Vercel"; the spec puts the badge image out of scope apart from its link. The text check
  applies to the "Live:" link. *Discarded:* changing the alt to the host, which misdescribes the
  image.

## 7. Test strategy

Runners from `package.json`: `npm test` (`vitest --run tests`) and `npm run test:e2e`
(Playwright on the installed Chrome).

- **Unit, `tests/canonical-origin.test.ts`:** `CANONICAL_ORIGIN === 'https://www.xdextx.dev'`
  (the one literal of the host in `tests/`, clarify 7.2), and the imported `astro.config.mjs`
  default export's `site` equals it. RF-5 scan: text files under `src/`, `public/`, `scripts/`
  plus `astro.config.mjs`, comments stripped; the files containing `www.xdextx.dev` are exactly
  `src/data/site.ts`; none of those nor `tests/`, `e2e/` contains `portfolio-dext.vercel.app`
  (this file excluded from its own scan by path). RF-6: the README contains no old host; its "Live:"
  link's `href` starts with the canonical origin and its text names the canonical host; every other
  link to either host has its `href` on the canonical origin. RF-3 and the robots NFR: `GET()`
  returns exactly one `Sitemap:` line equal to `${CANONICAL_ORIGIN}/sitemap.xml`, plus
  `User-agent: *`, `Allow: /` and `Disallow: /api/`.
- **Unit, `tests/seo.test.ts`:** `CONFIGURED_SITE` becomes the imported constant (P-1); the 034
  block gains RF-1: the layout rendered for `https://preview.example.test/proyectos?lang=es` carries
  `canonical`, `es-CR`, `x-default` equal to `${CANONICAL_ORIGIN}/proyectos` and `en-US` to the same
  plus `?lang=en`. The comment at :1079–1080 is rewritten: the Container still leaves `Astro.site`
  empty, but nothing reads it.
- **Unit, `tests/github-cache.test.ts`:** `PRODUCTION` goes (P-2). The sitemap test calls `GET`
  with no `site` and with `site: new URL(PREVIEW)`; both list only `<loc>` on `CANONICAL_ORIGIN`
  and never fetch it. Edge case: with `github('fail')` the sitemap answers 200 with `/` and
  `/proyectos` on the canonical origin. Each case runs after `vi.resetModules()`, so the module's
  TTL cache does not serve a previous case.
- **Rendered, `e2e/canonical-origin.spec.ts`**, on the e2e server (`E2E_URL`, a preview-like
  origin): `/`, `/proyectos?cat=backend&lang=en`, the first project card's page and
  `/proyectos/__missing__` (the 404) carry `canonical` and the three alternates on the canonical
  origin with the NFR's path rules (RF-1); `og:url` starts with `E2E_URL` (034 holds). The JSON-LD of
  `/`, `/proyectos?cat=backend&lang=en` and that project page has every `url` on the canonical
  origin, the collection's with `/proyectos?cat=backend&lang=en` and the project's with
  `/proyectos/<name>` (RF-4). `/sitemap.xml` lists only canonical `<loc>`s (RF-2); `/robots.txt`
  has its one `Sitemap:` line (RF-3, served by the route since the static file is gone).
- **`e2e/og-cover-layout.spec.ts`:** imports `CANONICAL_ORIGIN` (P-1); a missing export then
  fails the import instead of crashing on `![1]`.
- **Injections**, each reverted by explicit path: (1) layout `production = Astro.url.origin` → RF-1
  red in seo and e2e; (2) sitemap origin from the request → RF-2 red; (3) `public/robots.txt`
  restored → RF-5 red, and e2e RF-3 red; (4) robots line built from the request origin → RF-3
  red in e2e; (5) `[name].astro` back to `Astro.url.origin` → RF-4 red; (6) collection `url` drops
  `search` → the path NFR red; (7) `about.ts` old literal → RF-4 and RF-5 red; (8) `site.ts` set to
  `https://www.xdextz.dev` → RF-5 value red; (9) a host literal back in `astro.config.mjs` → RF-5
  scan red; (10) README "Live:" text on the old host → RF-6 red; (11) the sitemap's `try/catch`
  removed → the GitHub-fails case red; (12) `Disallow: /api/` dropped → robots NFR red.
