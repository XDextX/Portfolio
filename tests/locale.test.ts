import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { runInLocale, setLocale, t, tWords } from '@i18n/index';
import { applyLocale, resolveLocale } from '@utils/locale';

// Spec 019: each request translates in its own locale (RF-1 as data), the resolution order
// stays query → cookie → Accept-Language → Spanish (RF-2), and outside any request t() still
// follows the last setLocale (RF-3).

const locale = (l: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'i18n', 'locales', `${l}.json`), 'utf-8'));
const MESSAGES = { es: locale('es'), en: locale('en') };
const tick = () => new Promise((r) => setTimeout(r, 5));

/** A fake of the three fields resolveLocale reads, with a spy on cookies.set. */
function source({ query, cookie, header }: { query?: string; cookie?: string; header?: string }) {
    const url = new URL(`https://example.test/${query === undefined ? '' : `?lang=${query}`}`);
    const set = vi.fn();
    return {
        set,
        ctx: {
            url,
            cookies: { get: (name: string) => (name === 'lang' && cookie !== undefined ? { value: cookie } : undefined), set },
            request: new Request(url, { headers: header ? { 'accept-language': header } : {} }),
        } as any,
    };
}

describe('locale scope (spec 019)', () => {
    it('two interleaved requests each translate only in their own locale (RF-1)', async () => {
        const seen: Record<'es' | 'en', string[]> = { es: [], en: [] };
        const render = (l: 'es' | 'en') => runInLocale(l, async () => {
            for (let i = 0; i < 5; i++) {
                seen[l].push(t('contact.form.submit'), tWords('contact.title').map((w) => w.text).join(' '));
                await tick();
            }
        });
        setLocale('es');
        await Promise.all([render('es'), render('en')]);
        for (const l of ['es', 'en'] as const) {
            const title = MESSAGES[l].contact.title.replace(/\*/g, '');
            expect([...new Set(seen[l])].sort(), `${l} saw another locale`).toEqual([MESSAGES[l].contact.form.submit, title].sort());
        }
    });

    it('outside any request, t() follows the last setLocale, and a finished scope leaves no trace (RF-3)', async () => {
        setLocale('en');
        expect(t('contact.form.submit')).toBe(MESSAGES.en.contact.form.submit);
        setLocale('es');
        await runInLocale('en', async () => { await tick(); });
        expect(t('contact.form.submit')).toBe(MESSAGES.es.contact.form.submit);
    });
});

describe('locale resolution (spec 019 RF-2)', () => {
    const cases: [string, Parameters<typeof source>[0], 'es' | 'en'][] = [
        ['query alone', { query: 'en' }, 'en'],
        ['cookie alone', { cookie: 'en' }, 'en'],
        ['Accept-Language alone', { header: 'en-US,en;q=0.9' }, 'en'],
        ['nothing: Spanish', {}, 'es'],
        ['query over cookie', { query: 'en', cookie: 'es' }, 'en'],
        ['cookie over Accept-Language', { cookie: 'en', header: 'es-CR' }, 'en'],
        ['Accept-Language over the default', { header: 'en' }, 'en'],
        ['an unsupported query is skipped', { query: 'fr', cookie: 'en' }, 'en'],
        ['a region tag is normalised', { query: 'EN-us' }, 'en'],
    ];
    for (const [name, input, expected] of cases) {
        it(name, () => expect(resolveLocale(source(input).ctx)).toBe(expected));
    }

    it('stores a query locale in the cookie only when it differs from the cookie', () => {
        const differs = source({ query: 'en', cookie: 'es' });
        applyLocale(differs.ctx);
        expect(differs.set).toHaveBeenCalledWith('lang', 'en', expect.objectContaining({ path: '/' }));
        for (const input of [{ query: 'en', cookie: 'en' }, { cookie: 'en' }, {}]) {
            const same = source(input);
            applyLocale(same.ctx);
            expect(same.set, JSON.stringify(input)).not.toHaveBeenCalled();
        }
    });
});
