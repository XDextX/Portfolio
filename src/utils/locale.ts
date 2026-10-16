import type { AstroGlobal } from 'astro';
import { setLocale } from '@i18n/index';

const SUPPORTED = ['es', 'en'] as const;
export type Locale = (typeof SUPPORTED)[number];
/** What resolveLocale reads; a page's Astro global and a middleware context both fit. */
export type LocaleSource = Pick<AstroGlobal, 'url' | 'cookies' | 'request'>;

const DEFAULT_LOCALE: Locale = 'es';
const COOKIE_NAME = 'lang';
const ONE_YEAR = 60 * 60 * 24 * 365;

function normalizeLocale(value: string | null | undefined): Locale | null {
	if (!value) return null;
	const clean = value.toLowerCase().split('-')[0];
	return SUPPORTED.includes(clean as Locale) ? (clean as Locale) : null;
}

function fromQuery(Astro: LocaleSource): Locale | null {
	return normalizeLocale(Astro.url.searchParams.get('lang'));
}

function fromCookie(Astro: LocaleSource): Locale | null {
	return normalizeLocale(Astro.cookies.get(COOKIE_NAME)?.value);
}

function fromHeader(Astro: LocaleSource): Locale | null {
	const header = Astro.request?.headers?.get('accept-language');
	if (!header) return null;
	const [first] = header.split(',');
	return normalizeLocale(first);
}

export function resolveLocale(Astro: LocaleSource): Locale {
	return fromQuery(Astro) ?? fromCookie(Astro) ?? fromHeader(Astro) ?? DEFAULT_LOCALE;
}

export function applyLocale(Astro: AstroGlobal): Locale {
	const locale = resolveLocale(Astro);
	setLocale(locale);

	const queryLocale = fromQuery(Astro);
	const cookieLocale = fromCookie(Astro);
	if (queryLocale && queryLocale !== cookieLocale) {
		Astro.cookies.set(COOKIE_NAME, queryLocale, {
			path: '/',
			maxAge: ONE_YEAR,
		});
	}

	return locale;
}

export function isSupportedLocale(value: string): value is Locale {
	return SUPPORTED.includes(value as Locale);
}
