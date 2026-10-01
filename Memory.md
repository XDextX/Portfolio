# Memory

Contexto de trabajo actual. Solo lo que sigue vigente. Máximo 50 líneas.

## Estado (2026-10-01)
Rama `main`. Build verde, `npm test` 31/31 (5 archivos), Playwright 1/1.

## Hecho — sesión 1: limpieza estructural
- `Resume.astro` movido de `pages/` a `components/` — eliminaba la ruta duplicada `/Resume`
  (misma página que `/`, indexable, con canonical/hreflang conflictivos).
- Borrados 8 componentes muertos: Navbar, ProjectSkeleton, Profile, Pill, Section,
  UserPlaceHolder, LevelPill, Snack. Círculo sin raíz: Profile→UserPlaceHolder, LevelPill→Pill.
- `ABOUT.socials` se deriva de `CONTACTS`. Una sola fuente para email/GitHub/LinkedIn.
- `sitemap.xml.ts` arreglado: endpoint `github-list.json` (antes `/api/portfolio.json` inexistente),
  tolera fallo de API, cachea 30 min. Antes devolvía 500.
- Tokens `--clr-advanced/intermediate/beginner` definidos en `00-tokens.css`.
- `resumeUrl` raíz-absoluta (`/cv/...`); la relativa rompía en `/proyectos`.
- JSON-LD: `is:inline` + `{JSON.stringify()}` emitía el literal. Ahora `set:html`.
- `astro.config.mjs`: import muerto de `@astrojs/node` fuera, `site:` agregado,
  `@astrojs/vercel/serverless` → `@astrojs/vercel` (deprecado).

## Hecho — sesión 2: view transitions
El usuario decidió **mantener** `<ClientRouter />`. Arreglado:
- `LanguageSwitcher.astro`: era el único script con `is:inline` + `document.currentScript`.
  Se rompía en la primera navegación (el selector de idioma dejaba de responder).
  Ahora `astro:page-load` + `data-lang-switcher`.
- `ProjectsSection`/`ProjectsFooter`: `getElementById('projects-toggle')` y `id='projects-grid'`
  → `data-projects-root` / `data-projects-grid` / `data-projects-toggle`, resueltos por scope.
  Ahora varias instancias por página funcionan independientes.
- Nuevo `tests/viewtransitions.test.ts` (15 tests) que falla si alguien reintroduce el patrón.
  Verificado: reintroducirlo rompe 2 tests.

## Verificación
Comprobar de verdad con dev server: `Start-Job { npx astro dev --port 439X }` + `Invoke-WebRequest`.
Build y tests en verde NO capturan bugs de render: así se hallaron JSON-LD roto y `/Resume`.

## Pendiente
- Sin navegador de escritorio conectado: los fixes de view transitions no se probaron en
  navegador real, solo por markup/CSS servido. Falta probar navegación real.
- `.env` tiene un PAT de GitHub en texto plano. Rotar si la máquina no es de confianza.
- Falta `src/pages/404.astro`; `[name].astro` redirige a `/404`.
- `README.md` desactualizado: dice Angular 19, linkea LICENSE inexistente.
- `npm run lint` / `format` siguen rotos (eslint/prettier no instalados, sin config).
