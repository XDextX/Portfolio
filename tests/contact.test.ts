import { describe, it, expect } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';

import { CONTACTS } from '../src/data/contacts';


describe('CONTACTS array', () => {
    it('should have the correct number of contacts', () => {
        expect(CONTACTS.length).toBe(3);
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
    it('should have valid contact svgs', async () => {
        let contact = CONTACTS.find(contact => contact.id === 'email');
        if (!contact?.icon) return;
        expect(contact.icon.length).toBeGreaterThan(0);
        const iconPath = path.resolve(process.cwd(), 'public', contact.icon);
        const stat = await fs.stat(iconPath);

        expect(stat.isFile()).toBe(true);
    });

});
