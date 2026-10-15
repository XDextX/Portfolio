/** The levels in order, lowest first: the one place that order is stated (spec 006). */
export const LEVEL_SCALE = ['beginner', 'intermediate', 'advanced'] as const;

export type TechLevel = (typeof LEVEL_SCALE)[number];

/**
 * A level's position in the scale, counting from one.
 * @param level the level to place
 * @returns 1 for the lowest level, the scale's length for the highest
 */
export function levelStep(level: TechLevel): number {
	return LEVEL_SCALE.indexOf(level) + 1;
}

/**
 * Which segments of a health bar a level lights: one per level, the leftmost lit.
 * @param level the row's level
 * @returns one flag per level in the scale, true for the first levelStep(level)
 */
export function segmentsFor(level: TechLevel): boolean[] {
	return LEVEL_SCALE.map((_, i) => i < levelStep(level));
}
export type Locale = 'es' | 'en';

export const levelLabelMap: Record<Locale, Record<TechLevel, string>> = {
	en: {
		beginner: 'Beginner',
		intermediate: 'Intermediate',
		advanced: 'Advanced',
	},
	es: {
		beginner: 'Principiante',
		intermediate: 'Intermedio',
		advanced: 'Avanzado',
	},
} as const;

export const levelVariantMap: Record<TechLevel, 'warning' | 'info' | 'success'> = {
	beginner: 'warning',
	intermediate: 'info',
	advanced: 'success',
} as const;

/**
 * Bar and dot colour: a graphic element, so not held to text contrast. This
 * resolves through --clr-*, which light lowers for label legibility, so a light
 * bar is the darker tone: the raw tones land near 1.7:1 against the light track.
 */
export const LEVEL_COLOR: Record<TechLevel, string> = {
	advanced:     'var(--clr-advanced, #22c55e)',
	intermediate: 'var(--clr-intermediate, #3b82f6)',
	beginner:     'var(--clr-beginner, #f59e0b)',
};

/**
 * Level TEXT colour. The bar tones give 1.7-3.0:1 as text on a light ground and
 * are unreadable, so the light theme defines darker variants in --clr-*-text.
 */
export const LEVEL_TEXT_COLOR: Record<TechLevel, string> = {
	advanced:     'var(--clr-advanced-text, var(--clr-advanced))',
	intermediate: 'var(--clr-intermediate-text, var(--clr-intermediate))',
	beginner:     'var(--clr-beginner-text, var(--clr-beginner))',
};
