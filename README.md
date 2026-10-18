# Portfolio

[![Astro](https://img.shields.io/badge/Astro-5-blueviolet?style=flat-square&logo=astro)](https://astro.build)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel)](https://portfolio-dext.vercel.app)

A full-stack developer's portfolio, in Spanish and English, rendered per request on Vercel.

**Live:** [portfolio-dext.vercel.app](https://portfolio-dext.vercel.app)

## Features

- Projects loaded from the GitHub API by topic and cached in memory for 30 minutes, filterable by
  category, each with its own page that renders the repository's README.
- Spanish and English, resolved per request.
- Light and dark themes.
- Contact form that sends through Mailtrap.
- Per-route title, description and JSON-LD, plus a social card per locale.
- Downloadable CV.

## Getting started

```bash
npm install
npm run dev
```

| Command            | What it does                         |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Dev server                           |
| `npm run build`    | Production build (Vercel adapter)    |
| `npm run preview`  | Serve the build                      |
| `npm test`         | Unit and source checks (Vitest)      |
| `npm run test:e2e` | Rendered checks (Playwright)         |

The pre-commit hook runs both test suites and cancels the commit if either fails.

## Environment variables

Put them in `.env` locally and in the Vercel project for production. They are read server-side
only and never reach the client.

| Variable             | Purpose                                                        |
| -------------------- | -------------------------------------------------------------- |
| `GITHUB_TOKEN`       | Read-only token; optional, but avoids the anonymous rate limit |
| `GITHUB_USERNAME`    | Whose repositories to list                                     |
| `GITHUB_TOPIC`       | Only repositories carrying this topic are shown                |
| `MAILTRAP_API_TOKEN` | Contact form: Mailtrap sending token                           |
| `CONTACT_FROM_EMAIL` | Contact form: verified sender address                          |
| `MAILTRAP_ENDPOINT`  | Optional; overrides the send URL (e.g. the Mailtrap sandbox)   |

The category filters read the repositories' GitHub topics (`web`, `backend`, `frontend`,
`mobile`, `database`); a repository without one of them shows under no category.

## Where things live

| Path                 | Contents                                                       |
| -------------------- | -------------------------------------------------------------- |
| `src/data/`          | Site content: identity, contacts, skills, experience           |
| `src/components/`    | Astro components                                               |
| `src/pages/`         | Routes and API endpoints; GitHub and contact helpers in `lib/` |
| `i18n/locales/`      | Spanish and English strings                                    |
| `public/styles/`     | Design tokens, themes and shared component styles              |
| `scripts/og-cover.ts`| Generates `public/og-cover-<locale>.png`                       |
| `tests/`, `e2e/`     | Vitest and Playwright suites                                   |

Regenerate the social cards after changing the identity, the hero or the tokens:

```bash
node --no-warnings scripts/og-cover.ts
```

## Contributing

Read [`docs/constitution.md`](docs/constitution.md) and [`AGENTS.md`](AGENTS.md) first. Features
and refactors start with a spec in [`specs/`](specs/).
