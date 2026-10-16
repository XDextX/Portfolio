import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { promises as fsp } from 'fs';
import path from 'path';

import { CONTACTS } from '../src/data/contacts';
import * as contactUtils from '../src/utils/contact';
import { t } from '@i18n/index';

const emails = CONTACTS.filter((c) => c.kind === 'email');
const web = CONTACTS.filter((c) => c.kind !== 'email');
const util = (name: string) => {
    const fn = (contactUtils as any)[name];
    if (fn === undefined) throw new Error(`src/utils/contact.ts exports no ${name}`);
    return fn;
};

describe('CONTACTS shape', () => {
    it('holds at least one contact, each with a unique id', () => {
        // The count is deliberately not pinned: adding a channel is not a change
        // that should be able to break the suite.
        expect(CONTACTS.length).toBeGreaterThan(0);
        expect(new Set(CONTACTS.map((c) => c.id)).size).toBe(CONTACTS.length);
    });

    it('declares every field with the right type', () => {
        for (const contact of CONTACTS as any[]) {
            expect(typeof contact.id, contact.id).toBe('string');
            expect(typeof (contact.label ?? contact.labelKey), contact.id).toBe('string');
            expect(typeof contact.value, contact.id).toBe('string');
            expect(typeof contact.kind, contact.id).toBe('string');
            expect(typeof contact.href, contact.id).toBe('string');

            if ('sameAs' in contact) {
                expect(typeof contact.sameAs, contact.id).toBe('boolean');
            }
        }
    });

    it('gives every contact a visible label and a non-empty value', () => {
        // `typeof x === 'string'` is satisfied by "", so a blank label renders an
        // empty button and still passes the shape check above.
        const contactLabel = util('contactLabel');
        for (const contact of CONTACTS) {
            const label = contactLabel(contact, t);
            expect(label.trim(), contact.id).not.toBe('');
            expect(label, `${contact.id}: an untranslated key`).not.toMatch(/^[a-z]+(\.[a-zA-Z]+)+$/);
            expect(contact.value.trim(), contact.id).not.toBe('');
        }
    });

    it('publishes at least one email channel', () => {
        // JsonLdAbout spreads `...(emailContact ? { email } : {})`, so losing the
        // email contact is not an error anywhere — it just quietly stops the
        // Person schema from carrying an address.
        expect(emails.length).toBeGreaterThan(0);
    });
});

/**
 * `value` is the text a visitor reads and `href` is where it takes them, so
 * nothing but a test stops them drifting. Derived from each contact's own
 * fields, so the suite never carries the person's details.
 */
describe('CONTACTS href agrees with its own value', () => {
    it('an email href is mailto: followed by that contact’s address', () => {
        for (const contact of emails) {
            expect(contact.value, contact.id).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
            expect(contact.href, contact.id).toBe(`mailto:${contact.value}`);
        }
    });

    it('a web href points at the site its value shows', () => {
        for (const contact of web) {
            expect(contact.href, contact.id).toMatch(/^https:\/\//);

            // `www.` is dropped from the host before comparing, so a profile
            // written either way round is accepted while a href pointing at a
            // different profile is not.
            const { host, pathname } = new URL(contact.href);
            const shown = `${host.replace(/^www\./, '')}${pathname}`;
            expect(shown, contact.id).toContain(contact.value);
        }
    });

    it('marks only browsable profiles as sameAs', () => {
        // `sameAs` feeds schema.org sameAs and rel=me. On a mailto it would
        // advertise a mail client as a profile page, so the flag may only sit on
        // something a crawler can fetch.
        for (const contact of CONTACTS.filter((c) => c.sameAs)) {
            expect(contact.href, contact.id).toMatch(/^https:\/\//);
        }
    });

    it('keeps every non-email href absolute', () => {
        // A relative href resolves against the current route, so it works on /
        // and 404s on /proyectos/<name>.
        for (const contact of web) {
            expect(/^https:\/\//.test(contact.href), `${contact.id}: ${contact.href}`).toBe(true);
        }
    });
});

describe('CONTACTS icons', () => {
    it('uses a root-absolute path that exists in public/', async () => {
        // Asserted on the data, not on markup. A relative src resolves against
        // the current route, so "icons/x.svg" 404s on any nested page.
        // NOTE: path.join, not path.resolve — a leading "/" makes resolve()
        // treat the path as absolute against the drive root.
        // Spec 018: one colour logo, or one per theme.
        for (const contact of CONTACTS) {
            const pictures: string[] = typeof contact.icon === 'object' ? [contact.icon.light, contact.icon.dark] : [contact.icon];
            for (const picture of pictures) {
                expect(picture, contact.id).toMatch(/^\//);
                const stat = await fsp.stat(path.join(process.cwd(), 'public', picture));
                expect(stat.isFile(), `${contact.id}: ${picture}`).toBe(true);
            }
        }
    });
});

describe('contact helpers (spec 018 RF-1, RF-4)', () => {
    it('holds the three linked channels, in order', () => {
        expect(CONTACTS.map((c) => c.kind), 'order').toEqual(['email', 'github', 'linkedin']);
    });

    it("copyValue: the email value, a profile's https URL", () => {
        const copyValue = util('copyValue');
        for (const c of CONTACTS) {
            const want = c.kind === 'email' || c.kind === 'phone' ? c.value : c.href;
            expect(copyValue(c), c.id).toBe(want);
        }
        expect(copyValue({ id: 'w', kind: 'website', value: 'x.test', href: 'https://x.test', label: 'W', icon: '/i.svg' })).toBe('https://x.test');
    });

    it('contactLabel: the name, or the translated key', () => {
        const contactLabel = util('contactLabel');
        expect(contactLabel({ label: 'GitHub' }, (k: string) => `<${k}>`)).toBe('GitHub');
        expect(contactLabel({ labelKey: 'a.b' }, (k: string) => `<${k}>`)).toBe('<a.b>');
    });

    it('feedback lasts 1.5 s', () => {
        expect(util('FEEDBACK_MS')).toBe(1500);
    });
});
