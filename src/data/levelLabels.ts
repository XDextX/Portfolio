export type TechLevel = 'beginner' | 'intermediate' | 'advanced';
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
 * How much of the track a level fills: one third, two thirds, all of it. A level
 * is one of three ordered values, not a measurement, so the fill is quantised.
 * It was 25 / 55 / 85, which claimed a measurable 55% that is not in the data.
 */
export const LEVEL_FILL: Record<TechLevel, number> = {
	advanced: 100,
	intermediate: 67,
	beginner: 33,
};

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
