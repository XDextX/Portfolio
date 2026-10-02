# Memory

Estado de trabajo actual. Solo lo que sigue vigente. Máximo 50 líneas.

**Las reglas van en `AGENTS.md`, no aquí.** Este archivo es solo contexto y estado.

## Estado (2026-10-01)
Rama `main`. Build verde, `npm test` 31/31 (5 archivos), Playwright 1/1.
10 commits locales, nada pusheado. Hay cambios SIN commitear en `AGENTS.md`, `Memory.md`,
comentarios de `src/`, `i18n/`, `tests/`, `public/styles/` y el borrado de `.github/copilot-instructions.md`.

## Regla de idioma (del usuario)
- `AGENTS.md` **debe estar en inglés**. No reintroducir español ahí.
- `Memory.md` queda a mi discreción — el usuario lo dejó explícitamente.
- Código, comentarios y JSDoc en inglés. Contenido del sitio en español a propósito
  (`es.json`, `ABOUT.bio.es`, strings visibles como `'Ver más'`): NO traducir.

## Hecho — sesión 4: idioma, MCP y contraste
- Comentarios y JSDoc traducidos a inglés en 19 archivos. **No** se tocó contenido bilingüe:
  `i18n/locales/es.json`, `ABOUT.bio.es` y strings visibles siguen en español a propósito.
- Borrado `.github/copilot-instructions.md` (77 líneas, desactualizado: citaba `Resume.astro`
  en `pages/`, y `npm run lint`/format que no funcionan). Sus ideas útiles se movieron a AGENTS.md.
- `.gitignore` tiene `.github/` → `grep` NO ve esa carpeta. Usar `Get-ChildItem -Force` para buscarla.
- `opencode.json` simplificado a `npx chrome-devtools-mcp@latest` sin flags; Chrome instalado lo encuentra solo.
- Contraste: 0 fallos WCAG AA en ambos temas (261 elementos). Token partido en
  `--accent-text` / `--accent-surface` / `--clr-*-text`.

## Husky
- `husky@9.1.7` + `"prepare": "husky"`. `.husky/pre-commit` corre `npm test` y aborta si falla.
- Verificado en ambas direcciones: aprueba en árbol limpio, bloquea con test roto.
- NO invoca lint/format: están rotos (eslint/prettier no instalados, sin config).
- Escape: `git commit --no-verify`. `.husky/_` se auto-ignora.

## Hecho — sesión 1: limpieza estructural
- `Resume.astro` de `pages/` a `components/` — eliminaba `/Resume` duplicada (indexable, canonical
  y hreflang conflictivos). Borrados 8 componentes muertos (círculo sin raíz).
- `ABOUT.socials` se deriva de `CONTACTS`. `resumeUrl` raíz-absoluta (`/cv/...`).
- `sitemap.xml.ts`: endpoint `github-list.json` (antes inexistente), tolera fallo de API, cachea.
  Antes daba 500.
- JSON-LD: `is:inline` + `{JSON.stringify()}` emitía el literal. Ahora `set:html`.
- Tokens `--clr-*` definidos. `astro.config.mjs`: import muerto fuera, `site:` agregado.

## Hecho — sesión 2: view transitions
El usuario decidió **mantener** `<ClientRouter />`.
- `LanguageSwitcher.astro`: era el único con `is:inline` + `currentScript`; se rompía en la primera
  navegación. Ahora `astro:page-load` + `data-lang-switcher`.
- `ProjectsSection`/`ProjectsFooter`: IDs globales → `data-projects-*` resueltos por scope.
- `tests/viewtransitions.test.ts` (15 tests) falla si reintroducen el patrón.

## Verificación
Build y tests en verde NO capturan bugs de render. Levantar dev server y pegar:
`Start-Job { npx astro dev --port 439X }` + `Invoke-WebRequest`. Así se hallaron JSON-LD y `/Resume`.

## Pendiente
- Sin navegador conectado: los fixes de view transitions no se probaron en navegación real.
- `.env` tiene un PAT de GitHub en texto plano. Rotar si la máquina no es de confianza.
- Falta `src/pages/404.astro`; `[name].astro` redirige a `/404`.
- `README.md` desactualizado: dice Angular 19, linkea LICENSE inexistente.
- `npm run lint` / `format` rotos.
- AGENTS.md perdió i18n-singleton, aliases de Vitest y convención de indentación (decisión del
  usuario al recortar). Reconsiderar si agents tropieza.
