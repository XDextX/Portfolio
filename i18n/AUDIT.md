# i18n Audit

Branch: feature/i18n-28-audit

This audit lists files that contain hard-coded UI strings and proposes translation keys for an initial migration. The goal is to produce a small, reviewable PR that replaces literals with `t('key')` calls and fills `i18n/locales/{en,es}.json` with the corresponding translations.

## Scope
- `src/pages` (pages and dynamic pages)
- `src/components` (UI components)
- `src/data` (static content used in pages)

## Findings & suggested keys

### src/components/ProjectCard.astro
- Buttons / actions:
  - Live Demo -> `project.actions.liveDemo`
  - Code -> `project.actions.code`
  - Detail -> `project.actions.detail`
- Labels / small text:
  - "Stack:" -> `project.label.stack`
  - "Actualizado:" -> `project.meta.updated`

### src/components/ProjectsSection.astro
- Title: default "Proyectos" -> `projects.title`
- Empty message: 'No hay proyectos para mostrar. Agrega el topic <code>{topic}</code> a tus repos en GitHub.' -> `projects.empty.message`

### src/pages/proyectos/[name].astro
- Breadcrumb labels already use `t('nav.home')` and `t('nav.projects')` in some places — good.
- Static labels to migrate:
  - "Métricas" aria-label -> `project.section.metrics`
  - Actions: `actions.code`, `actions.liveDemo`, `actions.noDemo`
  - Sections: `section.repo`, `section.demo`, `section.license`

### src/components/AboutSection.astro
- Heading and paragraph text -> `about.heading`, `about.summary`.

### src/components/ContactSection.astro / ContactCard.astro
- Contact method labels and CTA text: `contact.email`, `contact.cv`, `contact.github`, `contact.linkedIn`, etc.

### src/pages/Resume.astro
- Page-level headings used directly in layout -> migrate to `resume.title`, `resume.sections.*` where needed.

### src/data/*.ts (about.ts, contacts.ts, experience.ts, tech.ts)
- These files contain structured content (experience entries, contact labels, tech names). For labels and UI-facing strings (period labels, role titles), move to locales or keep data but reference translation keys where appropriate.

## Recommended process (small PRs)
1. Core: add `src/i18n/translate.ts` and `i18n/locales/en.json`, `i18n/locales/es.json` skeletons.
2. Replace simple UI strings in components with `t('...')` and add translations to the locales (start with ProjectCard + ProjectsSection).
3. Update pages (`proyectos/[name].astro`, `Resume.astro`) and data references.
4. Update tests and add locale mocks.

## Acceptance criteria for audit PR
- A `i18n/AUDIT.md` file (this) is added to the audit branch with an initial list of files and proposed keys.
- PR contains at least 10 suggested keys and maps them to file/line references.
- CI/tests still pass (if changes are only documentation, tests should remain green).

## Next steps (if approved)
- I'll implement the `core` PR (translate helper + locales) on `feature/i18n-28-core` once you confirm.
- After core is merged, we can proceed component-by-component.
