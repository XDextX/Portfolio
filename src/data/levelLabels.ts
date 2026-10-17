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
 * Bar colour by level, the proposal's hues (spec 026): a graphic element, held to 3:1
 * against the unlit segment, not to text contrast. Every theme defines each token.
 */
export const LEVEL_COLOR: Record<TechLevel, string> = {
	advanced:     'var(--clr-blue)',
	intermediate: 'var(--clr-teal)',
	beginner:     'var(--clr-amber)',
};

/**
 * Level word colour, on the card face (spec 026): each theme's -text variant
 * clears 4.5:1 there, where the bar tones would not.
 */
export const LEVEL_TEXT_COLOR: Record<TechLevel, string> = {
	advanced:     'var(--clr-blue-text)',
	intermediate: 'var(--clr-teal-text)',
	beginner:     'var(--clr-amber-text)',
};
