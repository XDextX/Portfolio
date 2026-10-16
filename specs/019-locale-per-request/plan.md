# Plan 019 — Locale per request

**Spec:** `specs/019-locale-per-request/spec.md` (**approved**, 3 RF).
**Status:** approved
**Approved:** 2026-10-16 · owner approval of plan and tasks together · 112 lines

## 1. Scope and coverage

| RF | Covered by |
|---|---|
| RF-1 (each page in its own locale) | §4 middleware runs the whole request inside a per-request locale scope; `t()` and `tWords()` read the scope first. Rendered guard in §7. |
| RF-2 (today's resolution order, cookie kept) | `resolveLocale` and `applyLocale` keep their logic; only `resolveLocale`'s parameter widens so the middleware can call it. Unit guard in §7. |
| RF-3 (outside a request, the last locale set) | `t()` falls back to the module locale `setLocale` writes, unchanged. The three existing suites stay untouched and green. |

Probe on 2026-10-16, reverted by path and checked by hash: a middleware running `next()` inside
an `AsyncLocalStorage` took the race from **20/40 to 0/40** mixed pages in three rounds of 40
concurrent requests, and `npm run build` stayed green with it. `enterWith` from `applyLocale`
also measured 0/40 (D-1 says why it is not the choice).

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `i18n/i18n.ts` | modify | Decides which locale a lookup reads: the request's scope when one is active, else the module locale. Owns the scope and `runInLocale`. |
| `i18n/index.ts` | modify | Re-exports `runInLocale` beside `t` and `setLocale`. |
| `src/middleware.ts` | create | Runs each request inside the locale its request resolves. The only caller of `runInLocale`. |
| `src/utils/locale.ts` | modify | `resolveLocale` takes the three fields it reads (`url`, `cookies`, `request`) instead of a whole `AstroGlobal`, so a middleware context fits. No logic change. |
| `tests/locale.test.ts` | create | RF-2 as data, and the scope's isolation and fallback as data (§7). |
| `e2e/locale-concurrency.spec.ts` | create | RF-1 rendered: concurrent GETs and plain POSTs on the e2e server. |

Untouched: every component and route (they keep calling `t()` and `applyLocale`), the locale
files, `package.json` — `node:async_hooks` is a Node built-in (constitution 1), and every `t()`
runs on the server: no client `<script>` imports i18n (checked on all six components that have
both).

## 3. Pure logic

```ts
// i18n/i18n.ts
const scope = new AsyncLocalStorage<string>();
/** Run fn with every t()/tWords() inside it, and its async continuations, reading locale. */
export function runInLocale<T>(locale: string, fn: () => T): T;  // scope.run(locale, fn)
function activeLocale(): string;                                   // scope.getStore() ?? currentLocale

// src/utils/locale.ts
export type LocaleSource = Pick<AstroGlobal, 'url' | 'cookies' | 'request'>;
export function resolveLocale(source: LocaleSource): Locale;      // order unchanged
```

No clock is read anywhere here.

## 4. Algorithm

```
middleware onRequest(ctx, next):
  return runInLocale(resolveLocale(ctx), next)

t(key, vars) / tWords(key):
  messages[activeLocale()] …   (the rest as today)

applyLocale(Astro):           unchanged — still calls setLocale (the fallback for renders with
                              no middleware, e.g. the Container API) and still writes the cookie
```

`next()` builds the response inside the scope; the stream's later chunks are continuations of
promises created there, which is what the probe measured. API routes pass through the same
middleware; the scope is harmless where nothing translates.

## 5. Interface

Nothing visible changes: same strings, same locale per request as a lone visitor sees today.
The only difference is under concurrency, where each page stops showing the other language.

## 6. Decisions

- **D-1 · A middleware running `next()` in an `AsyncLocalStorage` scope.** *Discarded:*
  `enterWith` from `applyLocale` — Node marks it experimental, and only routes that remember to
  call `applyLocale` would be protected; passing the locale into every `t()` call through
  `Astro.locals` — 21 files and every component signature change to fix one global.
- **D-2 · `t()` keeps the module locale as its fallback.** *Discarded:* throwing outside a
  scope — the unit suites, the Container renders and any script translate without a request,
  and RF-3 keeps them as they are.
- **D-3 · `applyLocale` keeps calling `setLocale`.** *Discarded:* dropping it once the
  middleware exists — Container renders run no middleware, so `?lang=en` there would render
  Spanish.
- **D-4 · The rendered guard uses the e2e server on 4329 (spec 015).** *Discarded:* a fourth
  dev server for this spec alone — another boot rewriting `.astro/`, the cause `a26db3a` fixed.

## 7. Test strategy

Runner from `package.json`: `npm test` (vitest, `tests/`) and `npm run test:e2e` (Playwright).

- **RF-1, rendered** (`e2e/locale-concurrency.spec.ts`): three rounds of 40 concurrent
  requests, alternating `es` and `en`; one in four is a plain contact POST (an empty url-encoded
  body, which renders the page with *invalid* and never reaches the sender) with its own
  `x-e2e-client` so the limiter never answers instead, and an `Origin` equal to the server's: Astro's
  origin check answers 403 to a form POST without one, a page with no strings at all. A page fails when it holds the other
  locale's `contact.tagline` or `contact.form.submit`, or lacks its own; strings are read from
  the locale files, not retyped.
- **Scope as data** (`tests/locale.test.ts`): two `runInLocale` calls run interleaved, each
  awaiting between lookups, and each sees only its own locale; outside any scope `t()` follows
  the last `setLocale`.
- **RF-2, data** (`tests/locale.test.ts`): `resolveLocale` over fakes of the three fields —
  each source alone, query over cookie, cookie over header, header over default, an unsupported
  value skipped, a region tag (`en-US`) normalised; `applyLocale` writes the cookie only when
  the query differs from it.
- **RF-3**: `tests/i18n.test.ts`, `tests/seo.test.ts`, `tests/project-card.test.ts` unchanged
  and green.
- **Injections:** (1) the middleware returns `next()` without the scope → the RF-1 guard red
  (the 20/40 the spec measured); (2) `activeLocale()` ignores the scope → the data isolation
  case red; (3) `resolveLocale` checks the cookie before the query → RF-2 red; (4) `applyLocale`
  writes the cookie on every request → the cookie case red.
