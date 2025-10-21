import en from './locales/en.json';
import es from './locales/es.json';
import { init } from './i18n';
export const messages = {
    en,
    es
};
init(messages, 'es');
export { t, availableLocales, setLocale } from './i18n';
