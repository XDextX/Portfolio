// Spec 048: the geometry of a hit-test grid. The page returns raw samples; these functions decide.
// A sample stands for the STEP × STEP cell centred on it; the page aligns the grid to each
// control's own edge, so a box of w px owns exactly w / STEP samples across (no rounding up).

/** One sampled point: its viewport position and the index of the control it resolves to, or -1. */
export interface Sample { x: number; y: number; owner: number }
export interface Box { x: number; y: number; w: number; h: number }

/** The samples' grid step in px. */
export const STEP = 2;

/**
 * The bounding box of the samples a control owns.
 * @param samples the grid around the control @param index the control's index
 * @returns the box, or null when the control owns none
 */
export function targetBox(samples: Sample[], index: number): Box | null {
    const own = samples.filter((s) => s.owner === index);
    if (!own.length) return null;
    const xs = own.map((s) => s.x), ys = own.map((s) => s.y);
    const [x, y] = [Math.min(...xs) - STEP / 2, Math.min(...ys) - STEP / 2];
    return { x, y, w: Math.max(...xs) - Math.min(...xs) + STEP, h: Math.max(...ys) - Math.min(...ys) + STEP };
}

/**
 * Whether the `side`-px square centred on `box` belongs to the control, rounded corners aside.
 * @param samples the grid @param index the control @param box its target box @param side the square's side in px
 */
export function holdsSquare(samples: Sample[], index: number, box: Box, side: number): boolean {
    const left = box.x + box.w / 2 - side / 2, top = box.y + box.h / 2 - side / 2;
    const inside = samples.filter((s) => s.x - STEP / 2 >= left && s.x + STEP / 2 <= left + side && s.y - STEP / 2 >= top && s.y + STEP / 2 <= top + side);
    // One cell of slack per axis: the grid and the square's centre need not be aligned.
    const need = (side / STEP - 1) ** 2;
    // 4% of the square may be elsewhere: the corners of a rounded control (8px radius is 2.8%) hit the
    // page behind them, and that is not a gap in the target.
    const owned = inside.filter((s) => s.owner === index).length;
    return box.w >= side && box.h >= side && inside.length >= need && owned >= inside.length * 0.96;
}

/**
 * The other controls found inside the control's drawn box.
 * @param samples the grid @param index the control @param drawn its drawn box
 * @returns the foreign owners, deduplicated
 */
export function intruders(samples: Sample[], index: number, drawn: Box): number[] {
    const found = samples.filter((s) => s.owner !== index && s.owner !== -1 && s.x >= drawn.x && s.x < drawn.x + drawn.w && s.y >= drawn.y && s.y < drawn.y + drawn.h);
    return [...new Set(found.map((s) => s.owner))];
}
