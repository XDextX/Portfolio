import { describe, it, expect } from 'vitest';
import { targetBox, holdsSquare, intruders, type Sample } from '../e2e/helpers/targets';

// Spec 048: the guard's arithmetic, proven apart from any page. Samples sit on a 2px grid.

/** A w × h area of cells from (x0, y0), each sampled at its centre and owned by owner(x, y) of its corner. */
function grid(w: number, h: number, owner: (x: number, y: number) => number, x0 = 0, y0 = 0): Sample[] {
    const out: Sample[] = [];
    for (let y = y0; y < y0 + h; y += 2) for (let x = x0; x < x0 + w; x += 2) out.push({ x: x + 1, y: y + 1, owner: owner(x, y) });
    return out;
}

describe('the hit-grid geometry (spec 048)', () => {
    it('a full 44px square is a 44 x 44 target that holds its square', () => {
        const s = grid(60, 60, (x, y) => (x >= 8 && x < 52 && y >= 8 && y < 52 ? 0 : -1));
        const box = targetBox(s, 0)!;
        expect([box.w, box.h]).toEqual([44, 44]);
        expect(holdsSquare(s, 0, box, 44)).toBe(true);
    });

    it('a 44 x 44 control with 8px rounded corners still holds its square', () => {
        const inCorner = (x: number, y: number) => { const [u, v] = [x - 8, y - 8]; return (u < 8 || u >= 36) && (v < 8 || v >= 36) && Math.hypot(u - (u < 8 ? 8 : 36), v - (v < 8 ? 8 : 36)) > 8; };
        const s = grid(60, 60, (x, y) => (x >= 8 && x < 52 && y >= 8 && y < 52 && !inCorner(x, y) ? 0 : -1));
        const box = targetBox(s, 0)!;
        expect([box.w, box.h]).toEqual([44, 44]);
        expect(holdsSquare(s, 0, box, 44)).toBe(true);
    });

    it('a 44 x 42 strip is 42 tall: it does not hold the square', () => {
        const s = grid(60, 60, (x, y) => (x >= 8 && x < 52 && y >= 8 && y < 50 ? 0 : -1));
        const box = targetBox(s, 0)!;
        expect(box.h).toBe(42);
        expect(holdsSquare(s, 0, box, 44)).toBe(false);
    });

    it('an L shape whose bounding box is 44 x 44 does not fill the square', () => {
        const s = grid(60, 60, (x, y) => (x >= 8 && x < 52 && y >= 8 && y < 52 && (x < 30 || y >= 30) ? 0 : -1));
        const box = targetBox(s, 0)!;
        expect([box.w, box.h]).toEqual([44, 44]);
        expect(holdsSquare(s, 0, box, 44)).toBe(false);
    });

    it('a control that owns no sample has no box, and cannot hold a square', () => {
        const s = grid(20, 20, () => -1);
        expect(targetBox(s, 0)).toBeNull();
    });

    it('intruders: a foreign owner inside the drawn box is named once; outside it is not', () => {
        const s = grid(60, 60, (x, y) => (x >= 8 && x < 52 && y >= 8 && y < 52 ? 0 : -1)).map((p) => (p.x === 21 && p.y === 21 ? { ...p, owner: 3 } : p)).map((p) => (p.x === 3 && p.y === 3 ? { ...p, owner: 5 } : p));
        expect(intruders(s, 0, { x: 8, y: 8, w: 44, h: 44 })).toEqual([3]);
        expect(intruders(grid(20, 20, () => 0), 0, { x: 0, y: 0, w: 20, h: 20 })).toEqual([]);
    });
});
