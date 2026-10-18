/**
 * The categories of the projects page filters, in render order (spec 040). A repository belongs
 * to the ones whose GitHub topic it carries; `other` has no topic and takes the rest. The icon is
 * a file in /icons/ui; backend, frontend and database reuse the skills areas' glyphs.
 */
export const PROJECT_CATEGORIES = [
	{ key: 'web', topic: 'web', labelKey: 'projects.filters.web', icon: 'world' },
	{ key: 'backend', topic: 'backend', labelKey: 'projects.filters.backend', icon: 'server' },
	{ key: 'frontend', topic: 'frontend', labelKey: 'projects.filters.frontend', icon: 'layout' },
	{ key: 'mobile', topic: 'mobile', labelKey: 'projects.filters.mobile', icon: 'device-mobile' },
	{ key: 'database', topic: 'database', labelKey: 'projects.filters.database', icon: 'table' },
	{ key: 'other', topic: null, labelKey: 'projects.filters.other', icon: 'dots' },
] as const;

export type CategoryKey = (typeof PROJECT_CATEGORIES)[number]['key'];

/** The "all" filter: no category, so no key; it links to the bare route. */
export const ALL_FILTER = { labelKey: 'projects.filters.all', icon: 'layout-grid' } as const;
