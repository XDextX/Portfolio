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
 * How much of the track a level fills: one third, two thirds, all of it.
 *
 * A level is one of three ordered values, not a measurement, so the fill is
 * quantised to thirds. It used to be 25 / 55 / 85, which claimed that an
 * intermediate skill is 55% of something measurable, and that the gap up to
 * advanced is wider than the gap up from beginner — neither of which is in the
 * data, both of which the numbers invited a reader to assume. Do not read this
 * as a percentage of proficiency. It is a fraction of the bar.
 */
export const LEVEL_FILL: Record<TechLevel, number> = {
	advanced: 100,
	intermediate: 67,
	beginner: 33,
};

/**
 * Bar and dot colour: a graphic element, so it is not held to text contrast.
 * Note this resolves through --clr-*, which the light theme lowers for label
 * legibility, so a light-theme bar is the darker tone. That is deliberate — the
 * dark tones separate from the light track by 4.1:1, where the raw saturated
 * ones would land near 1.7:1 and vanish into it.
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
