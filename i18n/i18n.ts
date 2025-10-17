type DeepRecord<T = any> = {
    [key: string]: T | DeepRecord<T>;
};

type LocaleMap = DeepRecord<string>;
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
    let chunk = messages[currentLocale];
    for (const k of key.split('.')) {
        if (typeof chunk !== 'object' || chunk === null || chunk[k] === undefined) {
            console.warn(`i18n: key "${key}" no encontrado`);
            return key;
        }
        chunk = chunk[k];
    }
    if (!chunk) return key;
    // verify if chunk is a string
    if (typeof chunk !== 'string') {
        console.warn(`i18n: key "${key}" no es un string`);
        return key;
    }
    const msg = chunk;
    if (!vars) return msg;

    return msg.replace(/\{\{\s*(\w+)\s*\}\}/g, (_: string, k: string) => {
        if (vars[k] !== undefined) {
            return vars[k];
        } else {
            console.warn(`Missing replacement for variable: ${k}`);
            return `{{${k}}}`; // Deja el marcador si falta el valor
        }
    });
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
