import { describe, it, expect } from 'vitest';
import { isLeaving, originKey, parseOrigin } from '../src/utils/returnOrigin';

// Spec 041 T-1: the rules deciding when a link records an origin and when a stored one is trusted.

const url = (s: string) => new URL(s, 'http://localhost:4329');

describe('isLeaving (RF-5, RF-6)', () => {
    it.each([
        ['/proyectos', '/', true],
        ['/', '/proyectos/portfolio', true],
        ['/proyectos', '/proyectos?cat=backend', false],
        ['/proyectos?cat=backend', '/proyectos', false],
        ['/', '/?lang=en', false],
        ['/proyectos', '/proyectos#top', false],
    ])('%s to %s is %s', (from, to, want) => {
        expect(isLeaving(url(from), url(to))).toBe(want);
    });

    it('another origin is not leaving this site', () => {
        expect(isLeaving(url('/'), new URL('https://example.com/other'))).toBe(false);
    });
});

describe('originKey', () => {
    it('is per path and names the feature', () => {
        expect(originKey('/proyectos')).toBe('return-origin:/proyectos');
        expect(originKey('/')).not.toBe(originKey('/proyectos'));
    });
});

describe('parseOrigin', () => {
    const ok = { href: '/proyectos', index: 1, heading: 'projects-title' };

    it('reads a valid record back', () => {
        expect(parseOrigin(JSON.stringify(ok))).toEqual(ok);
        expect(parseOrigin(JSON.stringify({ ...ok, heading: null }))).toEqual({ ...ok, heading: null });
    });

    it.each([
        ['null', null],
        ['invalid JSON', '{nope'],
        ['a non-object', '5'],
        ['no href', JSON.stringify({ index: 0, heading: null })],
        ['no index', JSON.stringify({ href: '/x', heading: null })],
        ['a negative index', JSON.stringify({ href: '/x', index: -1, heading: null })],
        ['a fractional index', JSON.stringify({ href: '/x', index: 0.5, heading: null })],
        ['a non-string heading', JSON.stringify({ href: '/x', index: 0, heading: 3 })],
    ])('rejects %s', (_n, raw) => {
        expect(parseOrigin(raw)).toBeNull();
    });
});
