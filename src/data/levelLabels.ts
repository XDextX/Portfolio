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

export const LEVEL_PCT: Record<TechLevel, number> = {
	advanced: 85,
	intermediate: 55,
	beginner: 25,
};

/** Bar and dot colour: saturated, since it is a graphic element, not text. */
export const LEVEL_COLOR: Record<TechLevel, string> = {
	advanced:     'var(--clr-advanced, #22c55e)',
	intermediate: 'var(--clr-intermediate, #3b82f6)',
	beginner:     'var(--clr-beginner, #f59e0b)',
};

/**
 * Level TEXT colour. The bar tones give 1.7-3.0:1 on cream and are
 * unreadable, so the light theme defines darker variants in --clr-*-text.
 */
export const LEVEL_TEXT_COLOR: Record<TechLevel, string> = {
	advanced:     'var(--clr-advanced-text, var(--clr-advanced))',
	intermediate: 'var(--clr-intermediate-text, var(--clr-intermediate))',
	beginner:     'var(--clr-beginner-text, var(--clr-beginner))',
};
