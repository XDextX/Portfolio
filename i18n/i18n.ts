export type Messages = Record<string, string>;
export type LocaleMap = Record<string, Messages>;

/**
 * Mensajes cargados en memoria.
 * En el futuro se puede cambiar a carga dinámica/asincrónica.
 */
let messages: LocaleMap = {};
let currentLocale = 'en';

/**
 * Inicializa i18n con un mapa de locales.
 * Ej: init({ en: {...}, es: {...} }, 'es')
 */
export function init(locales: LocaleMap, defaultLocale = 'en') {
    messages = locales;
    currentLocale = defaultLocale;
}

/**
 * Cambia el locale actual.
 */
export function setLocale(locale: string) {
    if (!messages[locale]) {
        console.warn(`i18n: locale "${locale}" no encontrado`);
    }
    currentLocale = locale;
}

/**
 * Traduce una clave; acepta plantillas estilo {{name}}.
 */
export function t(key: string, vars?: Record<string, string>): string {
    const msg = messages[currentLocale]?.[key] ?? key;
    if (!vars) return msg;
    return msg.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? '');
}

/**
 * Lista de locales disponibles.
 */
export function availableLocales(): string[] {
    return Object.keys(messages);
}

/* TODO:
 - Añadir soporte para pluralización, formatos de fecha/número.
 - Proveer carga asíncrona de JSON (fetch/import()).
 - Integraciones específicas para React/Vue si se requiere.
*/
