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

export const LEVEL_COLOR: Record<TechLevel, string> = {
	advanced:     'var(--clr-advanced, #22c55e)',
	intermediate: 'var(--clr-intermediate, #3b82f6)',
	beginner:     'var(--clr-beginner, #f59e0b)',
};
