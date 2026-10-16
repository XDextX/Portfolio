import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { LEVEL_COLOR, LEVEL_TEXT_COLOR, LEVEL_SCALE, type TechLevel } from '../src/data/levelLabels';
import * as levelData from '../src/data/levelLabels';
import { TECH } from '../src/data/tech';
import { stripComments, luminance, contrast, toHex, resolveColour, cssRules, styleSources, hue, hueDistance, borderColourOf, parseColour, parseGradients, composites, onRamp } from './helpers/colour';

/**
 * The visual language, enforced rather than described. A rule that only lives in
 * prose quietly stops being true, so the mechanical ones become checks here.
 * The palette and the type scale are taste, and belong to a human looking at it.
 */

const ROOT = process.cwd();

function walk(dir: string, exts: string[]): string[] {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return walk(full, exts);
        return exts.includes(path.extname(entry.name)) ? [full] : [];
    });
}

const ALL_FILES = [
    ...walk(path.join(ROOT, 'src'), ['.astro', '.ts']),
    ...walk(path.join(ROOT, 'public', 'styles'), ['.css']),
];

const SKILL_LEVELS: readonly TechLevel[] = LEVEL_SCALE;

const detail = (err: unknown): string => (err instanceof Error ? err.message : String(err));

/**
 * Every distinct paint an SVG declares, as attribute or inside a style.
 * @param svg the file's text
 * @returns lower-cased fills and strokes, `none` dropped, 3-digit hex widened
 */
function svgPaints(svg: string): string[] {
    const named: Record<string, string> = { white: '#ffffff', black: '#000000' };
    const paints = [...svg.matchAll(/\b(?:fill|stroke)\s*(?:=\s*["']|:\s*)([^"';}\s]+)/gi)]
        .map((m) => m[1].toLowerCase())
        .map((p) => named[p] ?? p.replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/, '#$1$1$2$2$3$3'))
        .filter((p) => p !== 'none' && p !== 'transparent');
    return [...new Set(paints)];
}

// Background a CSS rule paints, or null. The value is resolved later, so a
// renamed token is followed; a missing rule fails the guard, never passes it.
function ruleBackground(src: string, selector: string): string | null {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rule = src.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'i'));
    if (!rule) return null;
    const bg = rule[1].match(/background(?:-color)?\s*:\s*([^;]+);/i);
    return bg ? bg[1].trim() : null;
}

// Background painted inline on the level-tag element, or null. Covers a
// badge wired through the style attribute rather than the stylesheet.
function levelTagInlineBackground(src: string): string | null {
    const tag = src.match(/<[^>]*class=['"]level-tag['"][^>]*>/i);
    if (!tag) return null;
    const inline = tag[0].match(/style=\{`([^`]*)`\}/) ?? tag[0].match(/style="([^"]*)"/);
    if (!inline) return null;
    const bg = inline[1].match(/background(?:-color)?\s*:\s*([^;`]+)/i);
    return bg ? bg[1].trim() : null;
}

describe('visual language', () => {
    it('no hover lifts an element', () => {
        // "Hover means the border turns gold, and nothing lifts." Three rules
        // said translateY(-1px): the hero's download and social buttons, which
        // also changed the border, and .btn, which only lifted. `.btn` is allowed
        // to lift: a standalone 404 call to action with no hover of its own.
        const LIFT_ALLOWED = new Set(['.btn']);

        const offenders: string[] = [];

        for (const file of ALL_FILES) {
            const src = stripComments(fs.readFileSync(file, 'utf-8'));
            const where = path.relative(ROOT, file);

            for (const m of src.matchAll(
                /([^{}]+)\{([^{}]*transform\s*:\s*translateY[^{}]*)\}/gi,
            )) {
                const selector = m[1].trim().split('\n').pop()?.trim() ?? '';
                if (!selector.includes(':hover')) continue;
                const base = selector.replace(/:hover\b.*$/, '').trim();
                if (LIFT_ALLOWED.has(base)) continue;
                offenders.push(`${where}  ${selector}`);
            }
        }

        expect(
            offenders,
            `These hover rules translate an element. The site's hover signal is the\n` +
            `border turning gold; lifting is a second, different signal, and a\n` +
            `component that does both is inconsistent with one that does either.\n` +
            `Remove the transform, or add the selector to LIFT_ALLOWED with a reason:\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });

    it('no font weight outside the variable font range', () => {
        // IBM Plex Sans is served as a variable font declaring 100 700. A
        // font-weight of 800 is clamped to 700 while the CSS still claims
        // otherwise, so the declaration and the rendering quietly disagree. This
        // shipped on the hero name and is still on the 404 code.
        const MAX = 700;
        const offenders: string[] = [];

        for (const file of ALL_FILES) {
            const src = stripComments(fs.readFileSync(file, 'utf-8'));
            const where = path.relative(ROOT, file);

            for (const m of src.matchAll(/font-weight\s*:\s*(\d{3})/gi)) {
                const weight = Number(m[1]);
                if (weight <= MAX) continue;
                offenders.push(`${where}  font-weight: ${weight}`);
            }
        }

        expect(
            offenders,
            `The self-hosted variable font declares 100-${MAX}. A weight above that is\n` +
            `clamped by the browser while the CSS still claims it, so the rule and the\n` +
            `rendering disagree with nothing in the console to say so:\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });

    it('no hover rule sets a background and nothing else', () => {
        // "Never signal hover with a background change alone." A surface shift
        // is the weakest channel and it lowers the contrast of whatever sits on
        // it: the theme toggle went 16.44 → 14.11 in light, 8.31 → 6.08 in dark.
        //
        // Narrow on purpose — the rule must contain a background declaration.
        const offenders: string[] = [];

        for (const file of ALL_FILES) {
            const src = stripComments(fs.readFileSync(file, 'utf-8'));
            const where = path.relative(ROOT, file);

            // Innermost rules only, so a hover nested in @media is read with its
            // own selector rather than the @media prelude.
            for (const m of src.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
                const selector = m[1].trim().split('\n').pop()?.trim() ?? '';
                if (!selector.includes(':hover')) continue;
                const body = m[2];
                if (!/(?:^|[;\s])background[a-z-]*\s*:/i.test(body)) continue;
                const movesColour =
                    /(?:^|[;{\s])(?:color|border-color|border-[a-z]+-color)\s*:/i.test(body);
                if (movesColour) continue;
                offenders.push(`${where}  ${selector}`);
            }
        }

        expect(
            offenders,
            `These hover rules change only a background. That lowers the contrast of\n` +
            `whatever sits on the surface and is a weaker signal than a colour change;\n` +
            `the site's convention is the border turning gold:\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });

    it('translations go through t(), not inline ternaries', () => {
        // "Inline `lang === 'es' ? … : …` survives a locale switch and ships
        // Spanish to English readers." AboutSection held three of them.
        //
        // A BCP 47 tag is not a translation and is allowed: 'es-CR' picks a
        // region for Intl and the html lang attribute.
        const isLanguageTag = (s: string) => /^[a-z]{2,3}-[A-Za-z]{2,4}$/.test(s);
        const offenders: string[] = [];

        for (const file of walk(path.join(ROOT, 'src'), ['.astro'])) {
            const src = fs.readFileSync(file, 'utf-8');
            const where = path.relative(ROOT, file);
            const withoutComments = src.replace(/\/\*[\s\S]*?\*\//g, ' ');

            for (const m of withoutComments.matchAll(
                /(?:lang|locale)\s*===\s*'es'\s*\?\s*'([^']*)'\s*:\s*'([^']*)'/g,
            )) {
                const [, es, en] = m;
                if (isLanguageTag(es) && isLanguageTag(en)) continue;
                offenders.push(`${where}  '${es}' | '${en}'`);
            }
        }

        expect(
            offenders,
            `These strings are chosen with a locale ternary, so they live in the\n` +
            `component instead of i18n/locales and a translator cannot find them.\n` +
            `A BCP 47 tag like 'es-CR' is fine — it selects a region, not prose — but\n` +
            `anything a reader sees belongs in t():\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });

    it('the person is described in one place', async () => {
        // "Person identity lives in src/data/about.ts only." A literal name in
        // a component is a duplicate source even in a meta tag, and BaseLayout
        // had three: the default title, the default description and og:site_name.
        const { ABOUT } = await import('../src/data/about');
        const name = ABOUT.name;
        const parts = [ABOUT.nameParts.given, ABOUT.nameParts.family ?? '']
            .flatMap((p) => p.split(/\s+/))
            .filter((p) => p.length > 2);
        if (!parts.length) throw new Error('no name part found in src/data/about.ts');
        const offenders: string[] = [];

        for (const file of walk(path.join(ROOT, 'src'), ['.astro', '.ts'])) {
            if (path.basename(file) === 'about.ts') continue;
            const text = stripComments(fs.readFileSync(file, 'utf-8'));
            const where = path.relative(ROOT, file);
            for (const part of parts) {
                if (text.includes(part)) {
                    offenders.push(`${where}  contains "${part}"`);
                }
            }
        }

        expect(
            offenders,
            `The name is "${name}" in src/data/about.ts. These files repeat part of\n` +
            `it, which means renaming the person needs editing every one of them:\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });

    it('level fills clear the track in both themes', () => {
        // Spec 006 RF-3 (was 005 RF-2): each level's lit segment at 3:1 or above
        // against an unlit segment, in both themes. Lit colours come from
        // LEVEL_COLOR, the map the bar reads; the unlit one from the segment rule.
        const MIN_FILL = 3;
        const offenders: string[] = [];
        const skillBar = stripComments(
            fs.readFileSync(path.join(ROOT, 'src', 'components', 'SkillBar.astro'), 'utf-8'),
        );
        const shared = stripComments(
            fs.readFileSync(path.join(ROOT, 'public', 'styles', '00-tokens.css'), 'utf-8'),
        );
        const trackRef = ruleBackground(skillBar, '.bar-seg');

        for (const theme of ['light.css', 'dark.css']) {
            const themeSrc = stripComments(
                fs.readFileSync(path.join(ROOT, 'public', 'styles', 'themes', theme), 'utf-8'),
            );
            let track: string | null = null;
            if (trackRef) {
                try {
                    track = resolveColour(trackRef, themeSrc, shared);
                } catch (err) {
                    offenders.push(`${theme}: the track surface fails to resolve (${detail(err)})`);
                }
            } else {
                offenders.push(`${theme}: no unlit segment colour found on .bar-seg`);
            }
            if (!track) continue;
            for (const level of SKILL_LEVELS) {
                let fill: string;
                try {
                    fill = resolveColour(LEVEL_COLOR[level], themeSrc, shared);
                } catch (err) {
                    offenders.push(`${theme}: the ${level} fill fails to resolve (${detail(err)})`);
                    continue;
                }
                const ratio = contrast(fill, track);
                if (ratio < MIN_FILL) {
                    offenders.push(
                        `${theme}: the ${level} fill ${fill} vs the track ${track} is ` +
                            `${ratio.toFixed(2)}:1 — below ${MIN_FILL}:1`,
                    );
                }
            }
        }

        expect(
            offenders,
            `These fills sit below 3:1 against the track, so the bar's strength\n` +
            `reads as inferred rather than visible. T-4 owns the values:\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });

    it('level labels clear their badge in both themes', () => {
        // RF-3: every level word label on its own badge at 4.5:1 or above, in
        // both themes. Label colours come from LEVEL_TEXT_COLOR; the badge is
        // whatever surface .level-tag paints behind the label, and T-5 owns
        // it — this guard only measures the pair.
        const MIN_LABEL = 4.5;
        const offenders: string[] = [];
        const skillBar = stripComments(
            fs.readFileSync(path.join(ROOT, 'src', 'components', 'SkillBar.astro'), 'utf-8'),
        );
        const shared = stripComments(
            fs.readFileSync(path.join(ROOT, 'public', 'styles', '00-tokens.css'), 'utf-8'),
        );
        const badgeRef =
            ruleBackground(skillBar, '.level-tag') ?? levelTagInlineBackground(skillBar);

        for (const theme of ['light.css', 'dark.css']) {
            const themeSrc = stripComments(
                fs.readFileSync(path.join(ROOT, 'public', 'styles', 'themes', theme), 'utf-8'),
            );
            if (!badgeRef) {
                offenders.push(`${theme}: no badge surface painted behind the level label`);
                continue;
            }
            let badge: string;
            try {
                badge = resolveColour(badgeRef, themeSrc, shared);
            } catch (err) {
                offenders.push(`${theme}: the badge surface fails to resolve (${detail(err)})`);
                continue;
            }
            for (const level of SKILL_LEVELS) {
                let label: string;
                try {
                    label = resolveColour(LEVEL_TEXT_COLOR[level], themeSrc, shared);
                } catch (err) {
                    offenders.push(`${theme}: the ${level} label fails to resolve (${detail(err)})`);
                    continue;
                }
                const ratio = contrast(label, badge);
                if (ratio < MIN_LABEL) {
                    offenders.push(
                        `${theme}: the ${level} label ${label} vs the badge ${badge} is ` +
                            `${ratio.toFixed(2)}:1 — below ${MIN_LABEL}:1`,
                    );
                }
            }
        }

        expect(
            offenders,
            `These labels sit below 4.5:1 against their badge, so the level\n` +
            `word is decoration rather than text. T-5 owns the badge:\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });

    it('each level lights its leftmost segments, one segment per level', () => {
        // Spec 006 RF-1/RF-2, as data: the scale is stated once, and what a
        // level lights is derived from its position in it, not from a
        // percentage. Read through the namespace so a missing export is named.
        const { LEVEL_SCALE, levelStep, segmentsFor } = levelData as Record<string, unknown>;
        const offenders: string[] = [];
        if (!Array.isArray(LEVEL_SCALE)) offenders.push('the data exports no LEVEL_SCALE');
        if (typeof levelStep !== 'function') offenders.push('the data exports no levelStep');
        if (typeof segmentsFor !== 'function') offenders.push('the data exports no segmentsFor');

        if (offenders.length === 0) {
            const scale = LEVEL_SCALE as string[];
            const step = levelStep as (level: string) => number;
            const segments = segmentsFor as (level: string) => boolean[];
            const labelled = Object.keys(levelData.levelLabelMap.en).sort();
            if (JSON.stringify([...scale].sort()) !== JSON.stringify(labelled)) {
                offenders.push(`the scale [${scale}] is not the set of labelled levels [${labelled}]`);
            }
            scale.forEach((level, i) => {
                if (step(level) !== i + 1) offenders.push(`${level}: step ${step(level)}, expected ${i + 1}`);
                const lit = segments(level);
                if (lit.length !== scale.length) {
                    offenders.push(`${level}: ${lit.length} segments for a ${scale.length}-level scale`);
                }
                const expected = scale.map((_, j) => j <= i);
                if (JSON.stringify(lit) !== JSON.stringify(expected)) {
                    offenders.push(`${level}: lights [${lit}], expected the leftmost ${i + 1} — [${expected}]`);
                }
            });
        }

        expect(
            offenders,
            `A bar is one segment per level, and a level lights the leftmost segments\n` +
            `up to its own position in the scale — never a percentage:\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });

    it('the health bar frame clears the card in both themes', () => {
        // Spec 006 RF-4: the frame is drawn in the colour the component binds
        // on .bar-track's 2px border, at 3:1 or above against the area card.
        const MIN_FRAME = 3;
        const offenders: string[] = [];
        const skillBar = stripComments(
            fs.readFileSync(path.join(ROOT, 'src', 'components', 'SkillBar.astro'), 'utf-8'),
        );
        const shared = stripComments(
            fs.readFileSync(path.join(ROOT, 'public', 'styles', '00-tokens.css'), 'utf-8'),
        );
        const track = skillBar.match(/\.bar-track\s*\{([^}]*)\}/)?.[1] ?? '';
        const frameRef = track.match(/border\s*:\s*2px\s+solid\s+([^;]+);/i)?.[1]?.trim();
        if (!frameRef) offenders.push('.bar-track draws no 2px solid frame');

        for (const theme of frameRef ? ['light.css', 'dark.css'] : []) {
            const themeSrc = stripComments(
                fs.readFileSync(path.join(ROOT, 'public', 'styles', 'themes', theme), 'utf-8'),
            );
            try {
                const frame = resolveColour(frameRef as string, themeSrc, shared);
                const card = resolveColour('var(--card-background)', themeSrc, shared);
                const ratio = contrast(frame, card);
                if (ratio < MIN_FRAME) {
                    offenders.push(`${theme}: frame ${frame} on card ${card} is ${ratio.toFixed(2)}:1`);
                }
            } catch (err) {
                offenders.push(`${theme}: the frame or the card fails to resolve (${detail(err)})`);
            }
        }

        expect(
            offenders,
            `The health bar's frame must outline the bar against the card at 3:1:\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });

    it('no fill percentage survives beside the level scale', () => {
        // Spec 006 RF-2: what a level lights comes from its step in the scale;
        // a per-level percentage beside it would be a second source for that.
        expect(
            'LEVEL_FILL' in levelData,
            'levelLabels still exports LEVEL_FILL, a percentage for what segmentsFor states',
        ).toBe(false);
    });
});

describe('colour resolver (spec 016)', () => {
    // Two layers stand in for a theme file and the shared token layer.
    const theme = ':root { --ring: var(--brand); --loop-a: var(--loop-b); --loop-b: var(--loop-a); }';
    const shared = ':root { --brand: var(--brand-primary); --brand-primary: #243972; }';

    it('follows an alias chain across layers to its hex', () => {
        expect(resolveColour('var(--ring)', theme, shared)).toBe('#243972');
    });

    it('throws on a chain that ends nowhere, or loops', () => {
        expect(() => resolveColour('var(--missing)', theme, shared)).toThrow();
        expect(() => resolveColour('var(--loop-a)', theme, shared)).toThrow();
    });
});

describe('focus ring (spec 016)', () => {
    const FOCUS = 'var(--focus-ring)';
    const KEYWORD = /^(?:\d[\w.]*|thin|medium|thick|none|hidden|solid|dashed|dotted|double|groove|ridge|inset|outset)$/i;
    const decls = (body: string) =>
        [...body.matchAll(/(outline(?:-color|-style|-width)?)\s*:\s*([^;]+)/gi)].map((m) => ({
            prop: m[1].toLowerCase(),
            value: m[2].trim(),
        }));
    const isRemoval = (d: { prop: string; value: string }) =>
        (d.prop === 'outline' && /^(?:none|0)$/i.test(d.value)) ||
        (d.prop === 'outline-style' && /^none$/i.test(d.value)) ||
        (d.prop === 'outline-width' && /^0$/.test(d.value));
    // The colour an outline rule draws in: its outline-color, else the shorthand's non-keyword part.
    const drawnColour = (ds: { prop: string; value: string }[]) => {
        const explicit = ds.find((d) => d.prop === 'outline-color');
        if (explicit) return explicit.value;
        const short = ds.find((d) => d.prop === 'outline');
        const parts = short ? short.value.split(/\s+(?![^(]*\))/).filter((t) => !KEYWORD.test(t)) : [];
        return parts.join(' ') || '(none: currentColor)';
    };
    const rel = (file: string) => path.relative(ROOT, file);
    const sources = styleSources(ROOT);

    it('every outline is drawn in the focus colour (RF-1, RF-4)', () => {
        const offenders: string[] = [];
        for (const { file, css } of sources) {
            for (const rule of cssRules(css)) {
                const ds = decls(rule.body);
                if (!ds.length || ds.every(isRemoval)) continue;
                const colour = drawnColour(ds);
                if (colour !== FOCUS) offenders.push(`RF-1: ${rel(file)} ${rule.selectors.join(', ')} draws in ${colour}`);
            }
        }
        expect(offenders, `Every outline must be drawn in ${FOCUS}, with no fallback:\n  ${offenders.join('\n  ')}`).toEqual([]);
    });

    it('a rule that removes the outline is paired with a focus ring (RF-7)', () => {
        const offenders: string[] = [];
        for (const { file, css } of sources) {
            const rules = cssRules(css);
            for (const rule of rules.filter((r) => decls(r.body).some(isRemoval))) {
                for (const sel of rule.selectors) {
                    if (sel.includes(':focus-visible')) {
                        offenders.push(`RF-7: ${rel(file)} ${sel} removes the focus ring itself`);
                        continue;
                    }
                    const paired = rules.some(
                        (r) => r.media === rule.media && r.selectors.includes(`${sel}:focus-visible`) &&
                            drawnColour(decls(r.body)) === FOCUS,
                    );
                    if (!paired) offenders.push(`RF-7: ${rel(file)} ${sel} removes the outline with no ${FOCUS} ring`);
                }
            }
        }
        expect(offenders, `An outline removal needs a :focus-visible ring for the same selector:\n  ${offenders.join('\n  ')}`).toEqual([]);
    });

    it('the avatar ring border keeps its override (spec 016 NFR)', () => {
        const avatar = sources.find((s) => s.file.endsWith('AvatarCircle.astro'));
        const rule = avatar && cssRules(avatar.css).find((r) => r.selectors.includes('.avatar.has-border'));
        expect(rule?.body ?? '', 'the opt-in ring border must still read --avatar-ring').toMatch(/border\s*:[^;]*var\(--avatar-ring/);
    });
});

describe('focus colour per theme (spec 016)', () => {
    const STYLES = path.join(ROOT, 'public', 'styles');
    const read = (...p: string[]) => stripComments(fs.readFileSync(path.join(STYLES, ...p), 'utf-8'));
    const light = read('themes', 'light.css');
    const dark = read('themes', 'dark.css');
    const shared = read('00-tokens.css');
    // Cascade order: dark overrides light's :root, both over the shared layer.
    const LAYERS = { light: [light, shared], dark: [dark, light, shared] } as const;
    const GROUNDS = ['--bg', '--main-bg', '--card-background', '--neutral-50', '--neutral-200'];
    const DECL = /(?<![\w-])--focus-ring\s*:\s*([^;]+);/;

    it('each theme file declares the focus colour as an alias, and nothing else does (RF-2)', () => {
        const offenders: string[] = [];
        for (const [name, src] of [['light.css', light], ['dark.css', dark]] as const) {
            const m = src.match(DECL);
            if (!m) offenders.push(`RF-2: ${name} does not declare --focus-ring`);
            else if (!/^var\(--[\w-]+\)$/.test(m[1].trim())) offenders.push(`RF-2: ${name} sets --focus-ring to ${m[1].trim()}, not a var() alias`);
        }
        for (const { file, css } of styleSources(ROOT)) {
            if (path.basename(path.dirname(file)) === 'themes' && /^(light|dark)\.css$/.test(path.basename(file))) continue;
            if (DECL.test(css)) offenders.push(`RF-2: ${path.relative(ROOT, file)} declares --focus-ring`);
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    it('the focus colour clears 3:1 on every ground, navy in light and text white in dark (RF-3, RF-5, RF-6)', () => {
        const offenders: string[] = [];
        for (const [theme, layers] of Object.entries(LAYERS)) {
            let ring: string;
            try {
                ring = resolveColour('var(--focus-ring)', ...layers);
            } catch (err) {
                offenders.push(`RF-3: ${theme}: ${detail(err)}`);
                continue;
            }
            for (const ground of GROUNDS) {
                const ratio = contrast(ring, resolveColour(`var(${ground})`, ...layers));
                if (ratio < 3) offenders.push(`RF-3: ${theme}: ${ring} on ${ground} is ${ratio.toFixed(2)}:1`);
            }
            const expected = theme === 'light' ? ['RF-5', 'var(--color-brand)'] : ['RF-6', 'var(--text-color)'];
            const want = resolveColour(expected[1], ...layers);
            if (ring !== want) offenders.push(`${expected[0]}: ${theme} ring is ${ring}, expected ${expected[1]} (${want})`);
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
});

describe('primary button ink (spec 007)', () => {
    const STYLES = path.join(ROOT, 'public', 'styles');
    const read = (...p: string[]) => stripComments(fs.readFileSync(path.join(STYLES, ...p), 'utf-8'));
    const light = read('themes', 'light.css');
    const dark = read('themes', 'dark.css');
    const shared = read('00-tokens.css');
    const LAYERS = { light: [light, shared], dark: [dark, light, shared] } as const;
    const decl = (token: string) => new RegExp(`(?<![\w-])${token}\s*:\s*([^;]+);`);
    const TOKENS = ['--accent-surface', '--accent-surface-text'];

    it('the button text clears 4.5:1 on the accent surface in each theme (RF-1)', () => {
        const offenders: string[] = [];
        for (const [theme, layers] of Object.entries(LAYERS)) {
            try {
                const ink = resolveColour('var(--accent-surface-text)', ...layers);
                const fill = resolveColour('var(--accent-surface)', ...layers);
                const ratio = contrast(ink, fill);
                if (ratio < 4.5) offenders.push(`RF-1: ${theme}: ${ink} on ${fill} is ${ratio.toFixed(2)}:1`);
            } catch (err) {
                offenders.push(`RF-1: ${theme}: ${detail(err)}`);
            }
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    it('in dark the fill is the brand gold, lighter than its brand-navy ink (RF-2, one hue)', () => {
        const offenders: string[] = [];
        try {
            const ink = resolveColour('var(--accent-surface-text)', ...LAYERS.dark);
            const fill = resolveColour('var(--accent-surface)', ...LAYERS.dark);
            if (luminance(fill) <= luminance(ink)) offenders.push(`RF-2: dark fill ${fill} is not lighter than its ink ${ink}`);
            if (ink !== resolveColour('var(--color-brand)', ...LAYERS.dark)) offenders.push(`RF-2: dark ink ${ink} is not the brand navy`);
            if (fill !== resolveColour('var(--brand-accent)', ...LAYERS.dark)) offenders.push(`RF-2: dark fill ${fill} is not the brand gold`);
        } catch (err) {
            offenders.push(`RF-2: dark: ${detail(err)}`);
        }
        for (const token of TOKENS) {
            const m = dark.match(decl(token));
            if (m && !/^var\(--[\w-]+\)$/.test(m[1].trim())) offenders.push(`RF-2: dark.css sets ${token} to ${m[1].trim()}, not an alias`);
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    it('each theme declares the fill and its ink itself, and nothing else does (NFR)', () => {
        const offenders: string[] = [];
        for (const token of TOKENS) {
            for (const [name, src] of [['light.css', light], ['dark.css', dark]] as const) {
                if (!decl(token).test(src)) offenders.push(`NFR: ${name} does not declare ${token}`);
            }
            for (const { file, css } of styleSources(ROOT)) {
                if (path.basename(path.dirname(file)) === 'themes') continue;
                if (decl(token).test(css)) offenders.push(`NFR: ${path.relative(ROOT, file)} declares ${token}`);
            }
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
});

describe('section title gold (spec 008 RF-5)', () => {
    const STYLES = path.join(ROOT, 'public', 'styles');
    const read = (...p: string[]) => stripComments(fs.readFileSync(path.join(STYLES, ...p), 'utf-8'));
    const light = read('themes', 'light.css');
    const dark = read('themes', 'dark.css');
    const shared = read('00-tokens.css');
    const LAYERS = { light: [light, shared], dark: [dark, light, shared] } as const;

    it('the contrast function reproduces the WCAG references', () => {
        expect(contrast('#000000', '#ffffff').toFixed(4)).toBe('21.0000');
        expect(contrast('#ffffff', '#ffffff').toFixed(4)).toBe('1.0000');
        expect(contrast('#767676', '#ffffff').toFixed(4)).toBe('4.5422');
    });

    it('the title gold clears 4.5:1 on the sheet in each theme', () => {
        const offenders: string[] = [];
        for (const [theme, layers] of Object.entries(LAYERS)) {
            try {
                const ratio = contrast(resolveColour('var(--accent-text)', ...layers), resolveColour('var(--main-bg)', ...layers));
                if (ratio < 4.5) offenders.push(`RF-5: ${theme}: the gold is ${ratio.toFixed(2)}:1 on the sheet`);
            } catch (err) {
                offenders.push(`RF-5: ${theme}: ${detail(err)}`);
            }
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
});

describe('UI icons (spec 008)', () => {
    it('each section, hero, step, skills and company glyph is a distinct, self-hosted, currentColor-only file on record', async () => {
        const { SECTION_TITLES } = await import('../src/data/sectionTitles');
        const UI = path.join(ROOT, 'public', 'icons', 'ui');
        const icons = Object.values(SECTION_TITLES).map((e) => e.icon);
        const offenders: string[] = [];
        // Spec 010: the hero's social glyphs, root-absolute; email shares the contact title's file.
        const { ABOUT } = (await import('../src/data/about')) as any;
        const heroGlyphs: { id: string; glyph?: string }[] = ABOUT.socials;
        const heroIcons: string[] = [];
        for (const s of heroGlyphs) {
            const m = s.glyph?.match(/^\/icons\/ui\/([\w-]+)\.svg$/);
            if (!m) { offenders.push(`hero ${s.id}: glyph ${s.glyph} is not /icons/ui/<name>.svg`); continue; }
            heroIcons.push(m[1]);
        }
        if (new Set(heroIcons).size !== heroIcons.length) offenders.push(`one glyph, one meaning: hero glyphs ${heroIcons.join(', ')} repeat one`);
        const email = heroGlyphs.find((s) => s.id === 'email');
        if (email?.glyph !== `/icons/ui/${SECTION_TITLES.contact.icon}.svg`) offenders.push('the email button does not share the contact title glyph');
        if (new Set(icons).size !== icons.length) offenders.push(`one glyph, one meaning: ${icons.join(', ')} repeats one`);
        const notice = fs.existsSync(path.join(UI, 'NOTICE.md')) ? fs.readFileSync(path.join(UI, 'NOTICE.md'), 'utf-8') : '';
        if (!fs.existsSync(path.join(UI, 'LICENSE-tabler.txt'))) offenders.push('public/icons/ui/LICENSE-tabler.txt is missing');
        // Spec 011: the process steps' glyphs, one meaning each, shared with no other section.
        const { PROCESS } = await import('../src/data/process');
        const stepIcons: string[] = PROCESS.steps.map((s) => s.icon);
        if (new Set(stepIcons).size !== stepIcons.length) offenders.push(`one glyph, one meaning: step glyphs ${stepIcons.join(', ')} repeat one`);
        for (const icon of stepIcons) if (icons.includes(icon) || heroIcons.includes(icon)) offenders.push(`one glyph, one meaning: ${icon} is a step glyph and another section's`);
        // Spec 012: the skills area glyphs and the generic mark, one meaning each.
        const tech = (await import('../src/data/tech')) as any;
        const areaIcons: string[] = (tech.SKILL_AREAS ?? []).map((a: any) => a.glyph);
        if (!areaIcons.length) offenders.push('src/data/tech.ts exports no SKILL_AREAS');
        const mark = String(tech.GENERIC_MARK ?? '').match(/^\/icons\/ui\/([\w-]+)\.svg$/)?.[1];
        if (!mark) offenders.push(`GENERIC_MARK ${tech.GENERIC_MARK} is not /icons/ui/<name>.svg`);
        const skillIcons = mark ? [...areaIcons, mark] : areaIcons;
        if (new Set(skillIcons).size !== skillIcons.length) offenders.push(`one glyph, one meaning: skills glyphs ${skillIcons.join(', ')} repeat one`);
        for (const icon of skillIcons) if (icons.includes(icon) || heroIcons.includes(icon) || stepIcons.includes(icon)) offenders.push(`one glyph, one meaning: ${icon} is a skills glyph and another section's`);
        // Spec 013: company glyphs may repeat within Experience, never mean something elsewhere.
        const { EXPERIENCES } = await import('../src/data/experience');
        const companyIcons: string[] = [...new Set(EXPERIENCES.map((e: any) => e.glyph).filter(Boolean) as string[])];
        for (const icon of companyIcons) if ([...icons, ...heroIcons, ...stepIcons, ...skillIcons].includes(icon)) offenders.push(`one glyph, one meaning: ${icon} is a company glyph and another section's`);
        for (const icon of new Set([...icons, ...heroIcons, ...stepIcons, ...skillIcons, ...companyIcons])) {
            const file = path.join(UI, `${icon}.svg`);
            if (!fs.existsSync(file)) {
                offenders.push(`public/icons/ui/${icon}.svg is missing`);
                continue;
            }
            const paints = svgPaints(fs.readFileSync(file, 'utf-8')).filter((p) => p !== 'currentcolor');
            if (paints.length) offenders.push(`${icon}.svg paints ${paints.join(', ')}, not only currentColor`);
            if (!notice.includes(`\`${icon}.svg\``)) offenders.push(`NOTICE.md does not name ${icon}.svg`);
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
});

describe('colour helper: hue and border colour (spec 017)', () => {
    it('measures hue and circular hue distance', () => {
        expect(hue('#FF0000')).toBe(0);
        expect(hue('#0000FF')).toBe(240);
        expect(hueDistance(350, 10)).toBe(20);
    });

    it('reads the colour term of a border', () => {
        expect(borderColourOf(new Map([['border-color', 'var(--x)']]))).toBe('var(--x)');
        expect(borderColourOf(new Map([['border', '1px solid var(--x)']]))).toBe('var(--x)');
        expect(borderColourOf(new Map([['border', 'none']]))).toBeNull();
    });
});

describe('control borders (spec 017)', () => {
    const CONTROLS: [string, string][] = [
        ['LanguageSwitcher.astro', '.language-switcher'],
        ['ThemeSwitch.astro', '.theme-btn'],
        ['AboutSection.astro', '.btn-social'],
        ['SkillViewToggle.astro', '.view-toggle'],
        ['SkillChip.astro', '.chip'],
        ['03-components.css', '.btn-action'],
        ['ContactCard.astro', '.icon-btn'],
    ];
    const WANT = 'var(--control-border)';
    const declsOf = (body: string) =>
        new Map([...body.matchAll(/([\w-]+)\s*:\s*([^;]+)/g)].map((m) => [m[1].toLowerCase(), m[2].trim()] as [string, string]));
    const sources = styleSources(ROOT);

    it('every bordered control rests in the control border colour (RF-1)', () => {
        const offenders: string[] = [];
        for (const [file, selector] of CONTROLS) {
            const src = sources.filter((s) => path.basename(s.file) === file);
            const rule = src.flatMap((s) => cssRules(s.css)).find((r) => r.selectors.includes(selector) && !r.media);
            const colour = rule ? borderColourOf(declsOf(rule.body)) : null;
            if (colour !== WANT) offenders.push(`RF-1: ${file} ${selector} rests in ${colour ?? 'no border colour'}`);
        }
        const names = new Set(CONTROLS.map(([, s]) => s));
        for (const { file, css } of sources) {
            for (const rule of cssRules(css)) {
                for (const sel of rule.selectors) {
                    const bare = sel.replace(/^:root(\[data-theme="dark"\])?\s+/, '');
                    if (!names.has(bare) || bare === sel && !/themes/.test(file)) continue;
                    const colour = borderColourOf(declsOf(rule.body));
                    if (colour && colour !== WANT) offenders.push(`RF-1: ${path.relative(ROOT, file)} ${sel} overrides the border with ${colour}`);
                }
            }
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    it('the control border clears 3:1 on sheet and card, stays 1.5:1 from the hover gold, and keeps the hue (RF-2, RF-4)', () => {
        const STYLES = path.join(ROOT, 'public', 'styles');
        const read = (...p: string[]) => stripComments(fs.readFileSync(path.join(STYLES, ...p), 'utf-8'));
        const light = read('themes', 'light.css');
        const dark = read('themes', 'dark.css');
        const shared = read('00-tokens.css');
        const LAYERS = { light: [light, shared], dark: [dark, light, shared] } as const;
        const offenders: string[] = [];
        for (const [theme, layers] of Object.entries(LAYERS)) {
            try {
                const c = resolveColour('var(--control-border)', ...layers);
                for (const ground of ['--main-bg', '--card-background']) {
                    const r = contrast(c, resolveColour(`var(${ground})`, ...layers));
                    if (r < 3) offenders.push(`RF-2: ${theme}: ${c} on ${ground} is ${r.toFixed(2)}:1`);
                }
                const g = contrast(c, resolveColour('var(--accent-text)', ...layers));
                if (g < 1.5) offenders.push(`RF-4: ${theme}: ${c} is ${g.toFixed(2)}:1 from the hover gold`);
                const d = hueDistance(hue(c), hue(resolveColour('var(--neutral-200)', ...layers)));
                if (d > 10) offenders.push(`NFR: ${theme}: ${c} is ${d.toFixed(1)}° from the neutral hue`);
            } catch (err) {
                offenders.push(`RF-2: ${theme}: ${detail(err)}`);
            }
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
});

describe('colour helper: gradients (spec 009)', () => {
    it('parses a computed colour, including color(srgb …) with alpha', () => {
        expect(parseColour('color(srgb 0.1 0.2 0.3 / 0.05)')).toEqual({ r: 25.5, g: 51, b: 76.5, a: 0.05 });
        expect(parseColour('rgba(36, 57, 114, 0.5)')).toEqual({ r: 36, g: 57, b: 114, a: 0.5 });
        expect(() => parseColour('oklch(0.5 0.1 250)')).toThrow();
    });

    it('rejects a colour off the navy ramp', () => {
        const ramp = ['#16233F', '#1F3059', '#243972', '#2B4372', '#3A578F'].map((h) => parseColour(h));
        expect(onRamp(parseColour('#7C3AED'), ramp)).toBe(false);
        expect(onRamp(parseColour('#243972'), ramp)).toBe(true);
    });

    it('samples a two-stop gradient over the sheet', () => {
        const [g] = parseGradients('linear-gradient(rgb(0, 0, 0), rgb(255, 255, 255))');
        const s = composites(g, parseColour('rgb(0, 0, 0)'), 2).map((c) => c.r);
        expect(s).toEqual([0, 127.5, 255]);
        expect(g.srgb).toBe(true);
        expect(() => parseGradients('url(/x.png)')).toThrow();
    });
});

describe('dark glow data (spec 009)', () => {
    const STYLES = path.join(ROOT, 'public', 'styles');
    const read = (...p: string[]) => stripComments(fs.readFileSync(path.join(STYLES, ...p), 'utf-8'));

    it('the dark ramp rises strictly from the ground to the soft fill (RF-7 data)', () => {
        const layers = [read('themes', 'dark.css'), read('themes', 'light.css'), read('00-tokens.css')];
        const ramp = ['--bg', '--neutral-50', '--main-bg', '--neutral-100', '--neutral-200'];
        const L = ramp.map((t) => luminance(resolveColour(`var(${t})`, ...layers)));
        const offenders = L.slice(1).map((l, i) => (l <= L[i] ? `RF-7: ${ramp[i + 1]} (${l.toFixed(4)}) is not lighter than ${ramp[i]} (${L[i].toFixed(4)})` : '')).filter(Boolean);
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    it('every dark-theme gradient interpolates in sRGB (RF-4 data)', () => {
        const offenders: string[] = [];
        for (const { file, css } of styleSources(ROOT)) {
            for (const rule of cssRules(css)) {
                if (!rule.selectors.some((s) => s.includes('[data-theme="dark"]'))) continue;
                for (const m of rule.body.matchAll(/[\w-]*gradient\(([^;]*)/g)) {
                    // The gradient's own method is in its first argument; a color-mix() stop's
                    // "in srgb" further on says nothing about how the gradient interpolates.
                    const head = m[1].split(/,(?![^(]*\))/)[0];
                    if (!/\bin srgb\b/.test(head)) offenders.push(`RF-4: ${path.relative(ROOT, file)} ${rule.selectors.join(', ')} has a gradient without "in srgb"`);
                }
            }
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
});

describe('name cases (spec 010 RF-7)', () => {
    it('joins the parts the data states, and refuses malformed ones', async () => {
        const { fullName, nameParts } = await import('../src/data/about');
        expect(fullName({ given: 'Ana' })).toBe('Ana');
        expect(nameParts({ given: 'Ana' }).family).toBeNull();
        expect(fullName({ given: 'María José', family: 'Ruiz' })).toBe('María José Ruiz');
        expect(nameParts({ given: 'María José', family: 'Ruiz' })).toEqual({ given: 'María José', family: 'Ruiz' });
        for (const bad of [{ given: '' }, { given: ' Ana' }, { given: 'Ana  María' }, { given: 'Ana', family: 'Ruiz ' }]) {
            expect(() => fullName(bad), JSON.stringify(bad)).toThrow();
        }
    });
});

// Spec 010: the @font-face blocks of a sheet, `unicode-range` parsed to [lo, hi] pairs.
function fontFaces(css: string): { family: string; style: string; src: string[]; ranges: [number, number][] }[] {
    return [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(([, body]) => {
        const prop = (p: string) => body.match(new RegExp(`(?:^|;)\\s*${p}\\s*:\\s*([^;]+)`))?.[1].trim() ?? '';
        const ranges = prop('unicode-range').split(',').filter(Boolean).map((r) => {
            const [lo, hi = lo] = r.trim().replace(/^U\+/i, '').split('-').map((h) => parseInt(h, 16));
            return [lo, hi] as [number, number];
        });
        return {
            family: prop('font-family').replace(/['"]/g, ''),
            style: prop('font-style') || 'normal',
            src: [...prop('src').matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].map((m) => m[1]),
            ranges,
        };
    });
}

const inRanges = (cp: number, ranges: [number, number][]) => ranges.some(([lo, hi]) => cp >= lo && cp <= hi);

describe('hero type (spec 010)', () => {
    const faces = () => styleSources(ROOT).flatMap(({ css }) => fontFaces(css));

    it('font families: two self-hosted families, one Sans face italic', () => {
        const offenders: string[] = [];
        const all = faces();
        const families = [...new Set(all.map((f) => f.family))].sort();
        if (JSON.stringify(families) !== JSON.stringify(['IBM Plex Mono', 'IBM Plex Sans'])) offenders.push(`families are ${families.join(', ')}`);
        for (const f of all) for (const src of f.src) {
            if (!/^\/fonts\/[^/]+\.woff2$/.test(src)) offenders.push(`${f.family}: ${src} is not a root-absolute /fonts/*.woff2`);
            else if (!fs.existsSync(path.join(ROOT, 'public', src))) offenders.push(`${f.family}: public${src} is missing`);
        }
        if (!all.some((f) => f.family === 'IBM Plex Sans' && f.style === 'italic')) offenders.push('no IBM Plex Sans face is italic');
        expect(offenders, offenders.join('\n')).toEqual([]);
    });

    it('italic coverage: the italic face covers every phrase and the process note, both locales (RF-3)', async () => {
        const { ABOUT } = (await import('../src/data/about')) as any;
        const { PROCESS } = await import('../src/data/process');
        const italic = faces().filter((f) => f.family === 'IBM Plex Sans' && f.style === 'italic');
        const keys: string[] = ABOUT.phraseKeys ?? [];
        const offenders: string[] = [];
        if (!italic.length) offenders.push('RF-3: no italic IBM Plex Sans face');
        if (keys.length !== 4) offenders.push(`RF-3: ABOUT.phraseKeys holds ${keys.length} keys, not 4`);
        for (const lang of ['es', 'en']) {
            const json = JSON.parse(fs.readFileSync(path.join(ROOT, 'i18n', 'locales', `${lang}.json`), 'utf-8'));
            for (const key of keys) {
                const value: unknown = key.split('.').reduce((o: any, k) => o?.[k], json);
                if (typeof value !== 'string') { offenders.push(`RF-3: ${key} has no ${lang} value`); continue; }
                for (const ch of value) {
                    const cp = ch.codePointAt(0)!;
                    if (!italic.some((f) => inRanges(cp, f.ranges))) offenders.push(`RF-3: ${lang} ${key} "${ch}" U+${cp.toString(16).toUpperCase()} is outside the italic face`);
                }
            }
            for (const ch of PROCESS.note[lang as 'es' | 'en']) {
                const cp = ch.codePointAt(0)!;
                if (!italic.some((f) => inRanges(cp, f.ranges))) offenders.push(`spec 011: ${lang} note "${ch}" U+${cp.toString(16).toUpperCase()} is outside the italic face`);
            }
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
});

describe('step colour scope (spec 011)', () => {
    it('only the process section reads a step tint or tone', () => {
        // Source, not rendering: the aliased tones render like their existing uses (spec 011 NFR).
        const offenders: string[] = [];
        for (const { file, css } of styleSources(ROOT)) {
            const n = [...css.matchAll(/var\(\s*--step-\d+-(?:tint|tone)\b/g)].length;
            if (n && path.basename(file) !== 'ValuePropositionSection.astro') {
                offenders.push(`${path.relative(ROOT, file)} reads a step colour ${n} time(s)`);
            }
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
});

describe('experience contrast (spec 013 RF-6)', () => {
    const STYLES = path.join(ROOT, 'public', 'styles');
    const read = (...p: string[]) => stripComments(fs.readFileSync(path.join(STYLES, ...p), 'utf-8'));
    const light = read('themes', 'light.css');
    const dark = read('themes', 'dark.css');
    const shared = read('00-tokens.css');
    const LAYERS = { light: [light, shared], dark: [dark, light, shared] } as const;
    // Chip text on its fill; the dot on the sheet (the glow is the e2e's); the company icon on the card.
    const PAIRS: [string, string, number, string][] = [
        ['var(--text-secondary)', 'var(--tag-surface)', 4.5, 'chip text on the chip fill'],
        ['var(--accent-text)', 'var(--main-bg)', 3, 'timeline dot on the sheet'],
        ['var(--icon-mono)', 'var(--card-background)', 3, 'company icon on the card'],
    ];

    it('chips, dots and company icons clear their floors in each theme', () => {
        const offenders: string[] = [];
        for (const [theme, layers] of Object.entries(LAYERS)) {
            for (const [fg, bg, floor, what] of PAIRS) {
                try {
                    const ratio = contrast(resolveColour(fg, ...layers), resolveColour(bg, ...layers));
                    if (ratio < floor) offenders.push(`RF-6: ${theme}: ${what} is ${ratio.toFixed(2)}:1, under ${floor}`);
                } catch (err) {
                    offenders.push(`RF-6: ${theme}: ${what} does not resolve (${detail(err)})`);
                }
            }
        }
        expect(offenders, offenders.join('\n')).toEqual([]);
    });
});
