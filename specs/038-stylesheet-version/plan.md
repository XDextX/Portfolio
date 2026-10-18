# Plan 038 — Versioned links to the public stylesheets

**Spec:** `specs/038-stylesheet-version/spec.md` (3 RF).
**Status:** approved
**Approved:** 2026-10-17 · approved with the spec under the same delegation · 60 lines
**Changed:** 2026-10-17 · at implementation: the first commit of the links was rejected by a flaky README check from spec 037 (a lazy image still pending read as broken), fixed apart in `5dd228a` before the links landed

## 1. Scope and coverage

| RF | Covered by |
|---|---|
| RF-1 (`?v=` on every sheet) | `stylesVersion(dir)` in `src/utils/styles-version.ts`; `astro.config.mjs` defines `import.meta.env.STYLES_VERSION` from it; `BaseLayout` appends `?v=${version}` to the eight hrefs. |
| RF-2 (changes with the content) | The hash covers every file's relative path and bytes, sorted. |
| RF-3 (order kept) | The hrefs stay written out in today's order; only the query is added. |

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `src/utils/styles-version.ts` | create | The version of a directory of sheets. |
| `astro.config.mjs` | modify | Computes it once per build or dev start; `vite.define`. |
| `src/layouts/BaseLayout.astro` | modify | The query on each sheet link. |
| `tests/styles-version.test.ts` | create | RF-2 on temporary copies. |
| `e2e/stylesheet-version.spec.ts` | create | RF-1, RF-3 on the served head. |

## 3. Pure logic

`stylesVersion(dir)`: SHA-256 over `relativePath \0 bytes \0` for each file in path order; the first
12 hex characters.

## 4. Algorithm

```js
// astro.config.mjs
import { stylesVersion } from './src/utils/styles-version.ts';
vite: { define: { 'import.meta.env.STYLES_VERSION': JSON.stringify(stylesVersion('public/styles')) } }
```

## 5. Interface

None visible.

## 6. Decisions

- **D-1 · A content hash, not a timestamp or a counter.** The same files give the same URLs, so an
  unchanged deploy keeps every cache warm. *Discarded:* `Date.now()` at build, which changes every
  deploy, and a number bumped by hand.
- **D-2 · Query string, not renamed files.** `public/` is served verbatim and the generator and
  tests read the files by name. *Discarded:* moving the sheets into the bundle (out of scope).

## 7. Test strategy

Runner from `package.json`: `npm test` and `npm run test:e2e`.

- **Unit**: identical copies give one version; a one-byte change, an added file and a renamed file
  each give another.
- **Rendered**: on `/` and `/proyectos`, every `/styles/` link has the same `v`, equal to the test's
  own hash; the paths in order.
- **Injections:** (1) one link without the query → RF-1; (2) the hash over names only → RF-2;
  (3) two links swapped → RF-3.
