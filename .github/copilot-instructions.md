<!-- .github/copilot-instructions.md - Guidance for AI coding agents -->

This repository is an Astro-based personal portfolio site that surfaces GitHub projects, experience and contact details. The file references and examples below are intended to help AI coding agents be productive quickly and avoid changes that break the build or behavior.

- Project type: Astro (v5), TypeScript, with server-side API routes under `src/pages/api` and client-side components in `src/components`.
- Dev scripts: `npm install`, `npm run dev`, `npm run build`, `npm run preview`. Tests: `npm run test` (Vitest) and `npm run test:e2e` (Playwright).

Key architectural notes
- `src/layouts/BaseLayout.astro` contains the global head/meta and loads global CSS tokens and themes. Prefer changing meta/OG in this file.
- Dynamic data flow: GitHub data is fetched server-side using `src/pages/lib/github.ts` and exposed via routes:
  - `src/pages/api/github-list.json.ts` (cached list by topic)
  - `src/pages/api/v1/projects/[name].json.ts` (single repo details)
- Pages consume these APIs server-side (see `src/pages/Resume.astro` and `src/pages/proyectos/[name].astro`) using `fetch` against `Astro.url` to keep origin-correct URLs.

Project conventions and patterns (do not change without preserving behavior)
- Environment variables are read via `import.meta.env`: `GITHUB_TOKEN`, `GITHUB_USERNAME`, `GITHUB_TOPIC`. Keep this pattern; do not switch to process.env.
- API helpers (`ghListByTopic`, `ghRepo`, `ghSearch`) in `src/pages/lib/github.ts` use `fetch` with a shared `baseHeaders` object. If adding headers or retry logic, preserve default Accept/User-Agent and optional Authorization behavior.
- Caching: `src/pages/api/github-list.json.ts` implements an in-memory TTL (30 minutes). If you change caching, ensure GET remains idempotent and returns JSON with Content-Type header.
- Components are Astro components (.astro). Props are passed via `Astro.props` and typed where used (`src/components/ProjectCard.astro` references `GitHubRepo` in `src/types`). Follow existing prop patterns and preserve accessibility attributes (aria-label, id patterns like `p-{repo.id}-title`).

Testing and CI
- Unit tests are run with Vitest: `npm run test`. E2E: Playwright (`npm run test:e2e`). Be careful changing network calls in tests: mocks must replicate `fetch` shape used in `src/pages/lib/github.ts`.
- Lint/format: `npm run lint`, `npm run format` (ESLint + Prettier). Avoid broad formatting changes in PRs.

Files of interest (quick references)
- `src/layouts/BaseLayout.astro` — global head/meta, stylesheet includes, theme handling.
- `src/pages/lib/github.ts` — GitHub API helper functions; keep header and error behavior consistent.
- `src/pages/api/github-list.json.ts` — list API with TTL cache.
- `src/pages/api/v1/projects/[name].json.ts` — project detail API used by dynamic project pages.
- `src/components/ProjectCard.astro`, `src/components/ProjectsSection.astro` — examples of rendering shape for `GitHubRepo` objects and UI conventions (buttons, links, Live Demo logic).
- `src/pages/Resume.astro` — server-side fetching of `/api/github-list.json` and composition of page sections.

When editing or adding features
- Keep server-side fetches anchored to `Astro.url` or absolute origins derived from it; this ensures internal API fetches work both in dev and preview builds.
- Prefer server-side data fetching for GitHub API calls to avoid exposing tokens; if you must fetch client-side, do not include `GITHUB_TOKEN` in client bundles.
- Use existing CSS tokens and theme files in `public/styles/themes` and `src/styles/global.css`. Small visual tweaks are fine; major CSS refactors should be split into focused PRs.

DRY (Don't Repeat Yourself) guidance
 - The project favors small, reusable Astro components and shared helpers. When you find duplicated markup, logic or styles, prefer extracting:
   - Component extraction: create a new `.astro` component under `src/components/` (example: move repeated project card fragments into `ProjectCard.astro`). See `src/components/ProjectCard.astro` and `src/components/ProjectsSection.astro` for patterns.
   - Shared logic: put fetch/transform helpers in `src/pages/lib/github.ts` or a new helper module; tests and API routes should import these helpers instead of reimplementing fetch logic.
   - Shared styles/tokens: add variables to `public/styles/00-tokens.css` or create utility classes in `src/styles/global.css` rather than copying values across files.
   - Tests/mocks: centralize `fetch` mocks for GitHub calls to a test helper to avoid repeating mock shapes across Vitest specs.

 Examples:
 - If two pages call the same GitHub endpoint and then map/format results, extract the mapping into `src/pages/lib/github.ts` and call it from both places.
 - If the same UI fragment appears in multiple pages (e.g., repo metrics, topic chips), extract to `src/components/` and pass props via `Astro.props`.

JSDoc documentation
- Use JSDoc comments on public helpers and components to keep inline documentation consistent and machine-readable. Prefer short one-line descriptions and param/return annotations on helpers.

Example (helper):
```ts
/**
 * Fetch repositories by topic for the configured user.
 * @param {{topic?: string, per_page?: number}} opts
 * @returns {Promise<GitHubRepo[]>} list of repos
 */
export async function ghListByTopic(opts) { /* ... */ }
```

Example (component):
```ts
/**
 * ProjectCard component props
 * @typedef {{repo: import('../../src/types/github').GitHubRepo}} Props
 */
```

Examples to reference in edits
- To add a new API route follow: `src/pages/api/v1/projects/[name].json.ts` — returns JSON Response with headers and proper 404 handling.
- To list repos by topic: `ghListByTopic({ topic: import.meta.env.GITHUB_TOPIC })` as used in `src/pages/api/github-list.json.ts` and `src/pages/Resume.astro`.

Merge guidance
- If this file already exists, merge by preserving any project-specific notes and add missing references above. Keep the file short (20–50 lines) and code-referential.

If anything in this guidance is unclear or you want me to include more file-level examples or tests, tell me which parts to expand and I will iterate.
