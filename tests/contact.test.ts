import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { promises as fsp } from 'fs';
import path from 'path';

import { CONTACTS } from '../src/data/contacts';

const emails = CONTACTS.filter((c) => c.kind === 'email');
const web = CONTACTS.filter((c) => c.kind !== 'email');

describe('CONTACTS shape', () => {
    it('holds at least one contact, each with a unique id', () => {
        // The count is deliberately not pinned: adding a channel is not a change
        // that should be able to break the suite.
        expect(CONTACTS.length).toBeGreaterThan(0);
        expect(new Set(CONTACTS.map((c) => c.id)).size).toBe(CONTACTS.length);
    });

    it('declares every field with the right type', () => {
        for (const contact of CONTACTS) {
            expect(typeof contact.id, contact.id).toBe('string');
            expect(typeof contact.label, contact.id).toBe('string');
            expect(typeof contact.value, contact.id).toBe('string');
            expect(typeof contact.href, contact.id).toBe('string');
            expect(typeof contact.kind, contact.id).toBe('string');

            if ('sameAs' in contact) {
                expect(typeof contact.sameAs, contact.id).toBe('boolean');
            }
        }
    });

    it('gives every contact a visible label and a non-empty value', () => {
        // `typeof x === 'string'` is satisfied by "", so a blank label renders an
        // empty button and still passes the shape check above.
        for (const contact of CONTACTS) {
            expect(contact.label.trim(), contact.id).not.toBe('');
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
 * `value` is the text a visitor reads and `href` is where it takes them. They
 * are two fields, so nothing but a test stops them drifting apart — and a
 * mismatch ships a button that says one thing and goes somewhere else.
 *
 * The rule is derived from each contact's own fields rather than written out as
 * a list of expected addresses, so the suite never carries the person's details
 * and changing a channel is an edit to `contacts.ts` alone. That also removes
 * the contradiction with visual-language.test.ts, which holds that person
 * identity has exactly one source.
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
        for (const contact of CONTACTS) {
            expect(contact.icon, contact.id).toBeTruthy();
            expect(contact.icon, contact.id).toMatch(/^\//);

            const stat = await fsp.stat(path.join(process.cwd(), 'public', contact.icon!));
            expect(stat.isFile(), contact.id).toBe(true);
        }
    });
});
