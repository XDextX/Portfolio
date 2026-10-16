import { AsyncLocalStorage } from 'node:async_hooks';

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
// Spec 019: the module locale is shared by every request in flight; rendering awaits, so 20/40
// concurrent pages rendered in the other request's language. A request's scope wins over it.
const scope = new AsyncLocalStorage<string>();

/**
 * Run fn, and every async continuation it starts, with lookups reading the given locale.
 * @param locale the request's locale @param fn the work to run, typically the request
 * @returns whatever fn returns
 */
export function runInLocale<T>(locale: string, fn: () => T): T {
    return scope.run(locale, fn);
}

/** The locale a lookup reads: the request's scope, else the last setLocale (spec 019 RF-3). */
function activeLocale(): string {
    return scope.getStore() ?? currentLocale;
}

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
    currentLocale = locale;
}

/**
 * Traduce una clave; acepta plantillas estilo {{name}}.
 */
export function t(key: string, vars?: Record<string, string>): string {
    let chunk = messages[activeLocale()];
    for (const k of key.split('.')) {
        if (typeof chunk !== 'object' || chunk === null || chunk[k] === undefined) {
            return key;
        }
        chunk = chunk[k];
    }

    if (!chunk) return key;
    // verify if chunk is a string
    if (typeof chunk !== 'string') {
        return key;
    }
    const msg = plainText(chunk);
    if (!vars) return msg;

    return msg.replace(/\{\{\s*(\w+)\s*\}\}/g, (_: string, k: string) => {
        if (vars[k] !== undefined) {
            return vars[k];
        } else {
            return `{{${k}}}`; // Leave the placeholder when the value is missing
        }
    });
}

/**
 * Lista de locales disponibles.
 */
export function availableLocales(): string[] {
    return Object.keys(messages);
}

/**
 * Drop the `*word*` marker a section title carries for its gold word (spec 008).
 * @param raw a locale string, marked or not
 * @returns the plain text every reader of the key sees
 */
export function plainText(raw: string): string {
    return raw.replace(/\*([^*\s]+)\*/g, '$1');
}

/**
 * Split a marked section title into its words, flagging the one gold word.
 * @param raw a title with exactly one `*word*` marker
 * @returns the words in order; throws on no marker, two, a marker inside a word, or stray spaces
 */
export function titleWords(raw: string): { text: string; gold: boolean }[] {
    if (/^\s|\s$|\s{2}/.test(raw)) throw new Error(`"${raw}" has a doubled or edge space`);
    const words = raw.split(' ').map((w) => {
        const m = w.match(/^\*(\p{L}+)\*$/u);
        if (!m && w.includes('*')) throw new Error(`"${raw}" marks part of a word`);
        return m ? { text: m[1], gold: true } : { text: w, gold: false };
    });
    const gold = words.filter((w) => w.gold).length;
    if (gold !== 1) throw new Error(`"${raw}" marks ${gold} gold words, not one`);
    return words;
}

/**
 * The current locale's section title for a key, split into words.
 * @param key a locale key holding a marked title
 * @returns the words with the gold one flagged; throws on a missing key, where t() would return it
 */
export function tWords(key: string): { text: string; gold: boolean }[] {
    let chunk: unknown = messages[activeLocale()];
    for (const k of key.split('.')) chunk = (chunk as Record<string, unknown> | undefined)?.[k];
    if (typeof chunk !== 'string') throw new Error(`${key} is missing in ${activeLocale()}`);
    return titleWords(chunk);
}

/* TODO:
 - Añadir soporte para pluralización, formatos de fecha/número.
 - Proveer carga asíncrona de JSON (fetch/import()).
 - Integraciones específicas para React/Vue si se requiere.
*/
