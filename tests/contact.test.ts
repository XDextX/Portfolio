import { describe, it, expect } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';

import { CONTACTS } from '../src/data/contacts';


describe('CONTACTS array', () => {
    it('should have at least one contact with a unique id', () => {
        // We do not pin the count: adding a channel must not break the suite.
        expect(CONTACTS.length).toBeGreaterThan(0);
        expect(new Set(CONTACTS.map((c) => c.id)).size).toBe(CONTACTS.length);
    });

    it('should contain valid contact objects', () => {
        CONTACTS.forEach(contact => {
            expect(typeof contact.id).toBe('string');
            expect(typeof contact.label).toBe('string');
            expect(typeof contact.value).toBe('string');
            expect(typeof contact.href).toBe('string');
            expect(typeof contact.kind).toBe('string');
            expect(typeof contact.icon).toBe('string');

            if ('sameAs' in contact) {
                expect(typeof contact.sameAs).toBe('boolean');
            }
        });
    });

    it('should have correct email contact', () => {
        const emailContact = CONTACTS.find(contact => contact.id === 'email');
        expect(emailContact).toBeDefined();
        expect(emailContact?.value).toBe('germonram@gmail.com');
        expect(emailContact?.href).toBe('mailto:germonram@gmail.com');
    });

    it('should have correct GitHub contact', () => {
        const githubContact = CONTACTS.find(contact => contact.id === 'github');
        expect(githubContact).toBeDefined();
        expect(githubContact?.value).toBe('github.com/XDextX');
        expect(githubContact?.href).toBe('https://github.com/XDextX');
        expect(githubContact?.sameAs).toBe(true);
    });

    it('should have correct LinkedIn contact', () => {
        const linkedinContact = CONTACTS.find(contact => contact.id === 'linkedin');
        expect(linkedinContact).toBeDefined();
        expect(linkedinContact?.value).toBe('linkedin.com/in/german-montero-ramirez/');
        expect(linkedinContact?.href).toBe('https://www.linkedin.com/in/german-montero-ramirez/');
        expect(linkedinContact?.sameAs).toBe(true);
    });
});

describe('CONTACTS svgs', () => {
    it('every icon path is root-absolute and exists in public/', async () => {
        // A relative src resolves against the current route, so "icons/x.svg"
        // 404s on /proyectos/<name>. Asserted on data, not on markup.
        // NOTE: path.join, not path.resolve — a leading "/" makes resolve()
        // treat the path as absolute against the drive root.
        for (const contact of CONTACTS) {
            expect(contact.icon, contact.id).toBeTruthy();
            expect(contact.icon, contact.id).toMatch(/^\//);
            const iconPath = path.join(process.cwd(), 'public', contact.icon!);
            const stat = await fs.stat(iconPath);
            expect(stat.isFile(), contact.id).toBe(true);
        }
    });
});
