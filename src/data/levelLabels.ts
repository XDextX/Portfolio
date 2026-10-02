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

/** Color de la barra y del punto: saturado, es un elemento gráfico, no texto. */
export const LEVEL_COLOR: Record<TechLevel, string> = {
	advanced:     'var(--clr-advanced, #22c55e)',
	intermediate: 'var(--clr-intermediate, #3b82f6)',
	beginner:     'var(--clr-beginner, #f59e0b)',
};

/**
 * Color del TEXTO del nivel. Los tonos de barra dan 1.7-3.0:1 sobre crema y
 * son ilegibles, asi que el tema claro define variantes oscuras en --clr-*-text.
 */
export const LEVEL_TEXT_COLOR: Record<TechLevel, string> = {
	advanced:     'var(--clr-advanced-text, var(--clr-advanced))',
	intermediate: 'var(--clr-intermediate-text, var(--clr-intermediate))',
	beginner:     'var(--clr-beginner-text, var(--clr-beginner))',
};
