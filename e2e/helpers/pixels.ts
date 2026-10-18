import type { Page } from '@playwright/test';

export type PixelTarget = { sel: string; kind: 'text' | 'border' | 'icon'; floor: number };
export type PixelResult = PixelTarget & { fg: string; ratio: number; at: string };

/**
 * The lowest contrast of each target over a bare background (specs 036): every target's line
 * boxes and colour read first, then `hide` made invisible and `clip` captured once, so a box
 * never counts another element's pixels as its background.
 * @param page the page @param targets what to measure @param hide selector of everything in front
 * @param clip the background's selector, whose box is captured @returns one result per element
 */
export async function worstOverBackground(page: Page, targets: PixelTarget[], hide: string, clip: string): Promise<PixelResult[]> {
    const found = await page.evaluate((list) => list.flatMap((t) => [...document.querySelectorAll(t.sel)].map((e) => {
        const cs = getComputedStyle(e);
        return { ...t, fg: t.kind === 'border' ? cs.borderTopColor : cs.color, rects: [...e.getClientRects()].map((r) => ({ x: r.left, y: r.top, w: r.width, h: r.height })) };
    })), targets);
    await page.evaluate((sel) => { for (const e of document.querySelectorAll(sel)) (e as HTMLElement).style.visibility = 'hidden'; }, hide);
    const box = await page.locator(clip).first().boundingBox();
    if (!box) throw new Error(`${clip} has no box to capture`);
    const shot = await page.screenshot({ clip: box, animations: 'disabled' });
    return page.evaluate(async ({ b64, found, origin }) => {
        const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode();
        const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
        const g = c.getContext('2d')!; g.drawImage(img, 0, 0);
        const lum = (r: number, gg: number, b: number) => { const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(gg) + 0.0722 * f(b); };
        const ratio = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        return found.map((t: any) => {
            const m = t.fg.match(/\d+(\.\d+)?/g).map(Number);
            const fl = lum(m[0], m[1], m[2]);
            let low = 99, at = '';
            for (const r of t.rects) {
                const x0 = Math.max(0, Math.floor(r.x - origin.x)), y0 = Math.max(0, Math.floor(r.y - origin.y));
                const w = Math.min(c.width - x0, Math.ceil(r.w)), h = Math.min(c.height - y0, Math.ceil(r.h));
                if (w <= 0 || h <= 0) continue;
                const d = g.getImageData(x0, y0, w, h).data;
                for (let i = 0; i < d.length; i += 4) { const q = ratio(fl, lum(d[i], d[i + 1], d[i + 2])); if (q < low) { low = q; at = `rgb(${d[i]}, ${d[i + 1]}, ${d[i + 2]})`; } }
            }
            return { sel: t.sel, kind: t.kind, floor: t.floor, fg: t.fg, ratio: low, at };
        });
    }, { b64: shot.toString('base64'), found, origin: { x: box.x, y: box.y } });
}
