import en from '../../i18n/locales/en.json';
import es from '../../i18n/locales/es.json';

const locales: Record<string, Record<string, any>> = {
    en,
    es,
};

export type Locale = 'en' | 'es';

/**
 * Simple translation helper usable in server-side code and .astro files.
 * @param key translation key like 'project.actions.liveDemo'
 * @param opts optional object { locale?: 'en'|'es', vars?: Record<string,string> }
 */
export function t(key: string, opts?: { locale?: Locale; vars?: Record<string, string> }) {
    const locale = opts?.locale ?? (process.env.DEFAULT_LOCALE as Locale) ?? 'en';
    const dict = locales[locale] ?? locales.en;
    const raw = key.split('.').reduce((o: any, k) => (o && o[k] ? o[k] : undefined), dict);
    if (typeof raw === 'string') {
        let out = raw;
        if (opts?.vars) {
            for (const [k, v] of Object.entries(opts.vars)) {
                out = out.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
            }
        }
        return out;
    }
    return key; // fallback to key when missing
}
