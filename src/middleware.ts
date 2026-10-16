import { defineMiddleware } from 'astro:middleware';
import { runInLocale } from '@i18n/index';
import { resolveLocale } from '@utils/locale';

// Spec 019: every request renders inside the locale it resolves. t() read one locale shared by
// all requests in flight, and 20/40 concurrent pages came back in the other language.
export const onRequest = defineMiddleware((context, next) => runInLocale(resolveLocale(context), next));
