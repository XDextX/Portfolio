import type { TechLevel } from "./levelLabels";

/**
 * The six skill areas, in the order the Skills section renders them, each with its
 * Tabler glyph in /icons/ui (spec 012). Headings are visitor text: `skills.areas.<key>`.
 */
export const SKILL_AREAS = [
	{ key: 'languages', glyph: 'braces' },
	{ key: 'frontend', glyph: 'layout' },
	{ key: 'backend', glyph: 'server' },
	{ key: 'databases', glyph: 'table' },
	{ key: 'cloudDevops', glyph: 'cloud' },
	{ key: 'testing', glyph: 'test-pipe' },
] as const;

export type AreaKey = (typeof SKILL_AREAS)[number]['key'];

/** A skill's original logo: one file in both themes, or one per theme. */
export type Logo = string | { light: string; dark: string };

/** One skill: its name, level, area and, when it has one, its original logo. */
export interface TechEntry {
	name: string;
	logo?: Logo;
	href?: string;
	level?: TechLevel;
	area: AreaKey;
}

/** The mark a skill with no logo of its own draws, in the monochrome icon colour. */
export const GENERIC_MARK = '/icons/ui/broadcast.svg';

// Sources and licences: /tech/NOTICE.md. SSE has no product logo, so it draws GENERIC_MARK.
export const TECH: TechEntry[] = [
	{ name: 'TypeScript', logo: '/tech/typescript.svg', href: 'https://www.typescriptlang.org/', level: 'advanced', area: 'languages' },
	{ name: 'Java', logo: '/tech/java.svg', href: 'https://www.oracle.com/java/', level: 'intermediate', area: 'languages' },
	{ name: 'Angular', logo: '/tech/angular.svg', href: 'https://angular.dev/', level: 'advanced', area: 'frontend' },
	{ name: 'Astro', logo: { light: '/tech/astro-icon-light.svg', dark: '/tech/astro-icon-dark.svg' }, href: 'https://astro.build/', level: 'intermediate', area: 'frontend' },
	{ name: '.NET', logo: '/tech/dotnet.svg', href: 'https://dotnet.microsoft.com/', level: 'advanced', area: 'backend' },
	{ name: 'SSE', href: 'https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events', level: 'beginner', area: 'backend' },
	{ name: 'PostgreSQL', logo: '/tech/postgresql.svg', href: 'https://www.postgresql.org/', level: 'advanced', area: 'databases' },
	{ name: 'MongoDB', logo: '/tech/mongodb.svg', href: 'https://www.mongodb.com/', level: 'intermediate', area: 'databases' },
	{ name: 'Azure', logo: '/tech/azure.svg', href: 'https://azure.microsoft.com/', level: 'advanced', area: 'cloudDevops' },
	{ name: 'Docker', logo: '/tech/docker.svg', href: 'https://www.docker.com/', level: 'beginner', area: 'cloudDevops' },
];

/**
 * The declared areas that hold at least one item, each with its items in data order.
 * @param areas the declared areas, in render order @param items entries naming their area
 * @returns one group per populated area, in declared order; empty areas dropped
 */
export function populatedAreas<A extends { key: string }, T extends { area: string }>(
	areas: readonly A[],
	items: readonly T[],
): (A & { items: T[] })[] {
	return areas
		.map((a) => ({ ...a, items: items.filter((i) => i.area === a.key) }))
		.filter((a) => a.items.length > 0);
}

/**
 * The file a logo draws in a theme.
 * @param logo the entry's logo, if any @param theme the active theme
 * @returns the file's path, or null when the generic mark draws
 */
export function logoFor(logo: Logo | undefined, theme: 'light' | 'dark'): string | null {
	if (logo === undefined) return null;
	return typeof logo === 'string' ? logo : logo[theme];
}

/**
 * The distinct files an entry draws across both themes.
 * @param logo the entry's logo, if any
 * @returns zero, one or two paths
 */
export function logoFiles(logo: Logo | undefined): string[] {
	if (logo === undefined) return [];
	return typeof logo === 'string' ? [logo] : [...new Set([logo.light, logo.dark])];
}
