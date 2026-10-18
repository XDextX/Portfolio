/**
 * The flat shapes behind the hero and the social cards (spec 036), in a 2000×744 box drawn with
 * `xMidYMid slice`; read by HeroBackground.astro and scripts/og-cover.ts. Each fill names a
 * `--band-*` token every theme aliases; the tiles keep to the corners (RF-3 settles where).
 */
/** `only: 'hero'` keeps a tile off the short page-header band (spec 039). */
export type HeroTile = { cx: number; cy: number; side: number; fill: string; only?: 'hero' };
export type HeroLine = { from: [number, number]; to: [number, number]; stroke: string };
export type HeroShape = HeroTile | HeroLine;

export const HERO_BOX = { width: 2000, height: 744 } as const;

/** A tile's corner radius as a share of its side, the draft's proportion. */
export const TILE_RADIUS = 0.14;

export const HERO_SHAPES: readonly HeroShape[] = [
    { cx: 40, cy: -120, side: 560, fill: '--band-mid' },
    { cx: 1160, cy: 260, side: 900, fill: '--band-soft' },
    { cx: 120, cy: 760, side: 620, fill: '--band-low', only: 'hero' },
    { cx: 2060, cy: -40, side: 320, fill: '--band-mid' },
    { cx: 1650, cy: 1100, side: 640, fill: '--band-mid' },
    { cx: 2080, cy: 860, side: 400, fill: '--band-gold' },
    { from: [1900, 300], to: [1990, 210], stroke: '--band-line-gold' },
    { from: [1880, 370], to: [1990, 262], stroke: '--band-line' },
];
