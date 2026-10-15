import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { LEVEL_COLOR, LEVEL_TEXT_COLOR, type TechLevel } from '../src/data/levelLabels';
import { TECH } from '../src/data/tech';

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

/** Source with comments blanked out, so a note is not read as a rule. */
function stripComments(src: string): string {
    return src
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/^\s*\/\/.*$/gm, ' ');
}

const SKILL_LEVELS: TechLevel[] = ['beginner', 'intermediate', 'advanced'];

// WCAG luminance and contrast, hoisted beside the accent-surface check so
// every guard below reuses them. Same math, one copy, still in this file.
function luminance(hex: string): number {
    const m = hex.replace('#', '').match(/.{2}/g);
    if (!m || m.length < 3) throw new Error(`not a hex colour: ${hex}`);
    const [r, g, b] = m.map((p) => parseInt(p, 16) / 255);
    const lin = (c: number) =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: string, b: string): number {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
}

// Split var(--token, fallback?) into its parts. Null when not a var().
function parseVarRef(value: string): { token: string; fallback: string } | null {
    const m = value.trim().match(/^var\(\s*(--[A-Za-z0-9_-]+)\s*(?:,\s*(.+?))?\s*\)$/s);
    if (!m) return null;
    return { token: m[1], fallback: (m[2] ?? '').trim() };
}

// Normalise to #rrggbb, throwing on anything else: only an opaque hex is
// measurable, so rgb() or an unresolvable construct fails the guard loudly.
function toHex(value: string): string {
    const hex = value.trim().toLowerCase();
    const short = hex.match(/^#([0-9a-f]{3})$/);
    if (short) return '#' + [...short[1]].map((c) => c + c).join('');
    if (/^#[0-9a-f]{6}$/.test(hex)) return hex;
    throw new Error(`not an opaque hex colour: ${value}`);
}

// Read a token's literal from a stylesheet, following one var() alias in
// the same file. Throws when the token is missing or points nowhere.
function themeValue(src: string, token: string): string {
    const declared = src.match(new RegExp(`${token}\\s*:\\s*([^;]+);`, 'i'));
    if (!declared) throw new Error(`${token} is not declared here`);
    const value = declared[1].trim();
    const alias = value.match(/^var\(\s*(--[A-Za-z0-9_-]+)\s*(?:,[^)]*)?\)$/i);
    if (!alias) return value;
    const target = src.match(new RegExp(`${alias[1]}\\s*:\\s*([^;]+);`, 'i'));
    if (!target) throw new Error(`${token} aliases ${alias[1]}, which resolves nowhere`);
    return target[1].trim();
}

// Resolve a component-bound colour through the theme file, then the shared
// layer, then the var() fallback chain. Throws when nothing resolves.
function resolveColour(expr: string, themeSrc: string, sharedSrc: string): string {
    const ref = parseVarRef(expr);
    if (!ref) return toHex(expr);
    for (const src of [themeSrc, sharedSrc]) {
        try {
            return toHex(themeValue(src, ref.token));
        } catch {
            continue;
        }
    }
    if (!ref.fallback) throw new Error(`${ref.token} resolves in neither theme nor shared layer`);
    return resolveColour(ref.fallback, themeSrc, sharedSrc);
}

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

    it('the person is described in one place', () => {
        // "Person identity lives in src/data/about.ts only." A literal name in
        // a component is a duplicate source even in a meta tag, and BaseLayout
        // had three: the default title, the default description and og:site_name.
        const src = fs.readFileSync(
            path.join(ROOT, 'src', 'data', 'about.ts'),
            'utf-8',
        );
        // The file uses double quotes for that field, and a single-quoted pattern
        // found nothing and threw — a guard that cannot read its own subject.
        const name = src.match(/name\s*:\s*["']([^"']+)["']/)?.[1];
        if (!name) throw new Error('no name found in src/data/about.ts');

        const parts = name.split(/\s+/).filter((p) => p.length > 2);
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

    it('a surface that white text sits on is dark in both themes', () => {
        /*
         * `--accent-surface` carried #E3C770 in dark: the theme file never set it,
         * so it inherited from 00-tokens.css and every primary button put white on
         * light gold at 1.66:1. AGENTS.md said "dark in both themes" all along.
         */
        const AA_TEXT = 4.5;

        const THEME_DIR = path.join(ROOT, 'public', 'styles', 'themes');
        const read = (file: string) =>
            stripComments(fs.readFileSync(path.join(THEME_DIR, file), 'utf-8'));

        const offenders: string[] = [];

        for (const file of ['light.css', 'dark.css']) {
            const src = read(file);
            const declared = src.match(/--accent-surface\s*:\s*([^;]+);/i);
            if (!declared) {
                offenders.push(
                    `${file} does not set --accent-surface, so it inherits whatever ` +
                    `00-tokens.css holds — and the two were written for different jobs`,
                );
                continue;
            }
            // Follow one level of var() so an alias is checked, not skipped.
            let value = declared[1].trim();
            const alias = value.match(/^var\(\s*(--[a-z0-9-]+)/i);
            if (alias) {
                const target = alias[1];
                const targetValue = src.match(
                    new RegExp(`${target}\\s*:\\s*(#[0-9a-f]{3,8})`, 'i'),
                );
                if (!targetValue) {
                    offenders.push(
                        `${file}: --accent-surface is ${value}, which does not resolve here`,
                    );
                    continue;
                }
                value = targetValue[1];
            }
            if (!/^#[0-9a-f]{3,8}$/i.test(value)) continue;

            const ratio = contrast('#FFFFFF', value);
            if (ratio < AA_TEXT) {
                offenders.push(
                    `${file}: --accent-surface is ${value}, which gives white text ` +
                    `${ratio.toFixed(2)}:1 — below ${AA_TEXT}:1`,
                );
            }
        }

        expect(
            offenders,
            `These themes put white text on --accent-surface without enough contrast.\n` +
            `Three components hardcode color: #fff on it, so the fill has to hold under\n` +
            `white rather than merely look like the accent:\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });

    it('level fills clear the track in both themes', () => {
        // RF-2: one fill colour per level, each at 3:1 or above against the
        // track, in both themes. Fill bindings come from LEVEL_COLOR, the map
        // the bar reads; T-4 owns the values, this guard only measures them.
        const MIN_FILL = 3;
        const offenders: string[] = [];
        const skillBar = stripComments(
            fs.readFileSync(path.join(ROOT, 'src', 'components', 'SkillBar.astro'), 'utf-8'),
        );
        const shared = stripComments(
            fs.readFileSync(path.join(ROOT, 'public', 'styles', '00-tokens.css'), 'utf-8'),
        );
        const trackRef = ruleBackground(skillBar, '.bar-track');

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
                offenders.push(`${theme}: no track surface found behind the fills`);
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

    it('the monochrome icon clears the card in both themes', () => {
        // RF-5: every bars-view icon sits on the area card in one colour per
        // theme, at 3:1 or above. The colour is read from the row's own rule, so
        // a renamed token moves the guard with it, and one colour per theme
        // covers all ten logos without naming one of them.
        const MIN_ICON = 3;
        const offenders: string[] = [];
        const skillBar = stripComments(
            fs.readFileSync(path.join(ROOT, 'src', 'components', 'SkillBar.astro'), 'utf-8'),
        );
        const shared = stripComments(
            fs.readFileSync(path.join(ROOT, 'public', 'styles', '00-tokens.css'), 'utf-8'),
        );
        // A shape painted in currentColor takes its colour from the slot, so
        // follow it there; anything else is measured as written.
        const painted = ruleBackground(skillBar, '.bar-logo::before');
        const slotColour = skillBar.match(/\.bar-logo\s*\{[^}]*?(?:^|[\s;{])color\s*:\s*([^;]+);/m)?.[1];
        const iconRef = painted && /^currentcolor$/i.test(painted) ? slotColour?.trim() ?? null : painted;

        for (const theme of ['light.css', 'dark.css']) {
            const themeSrc = stripComments(
                fs.readFileSync(path.join(ROOT, 'public', 'styles', 'themes', theme), 'utf-8'),
            );
            if (!iconRef) {
                offenders.push(`${theme}: no monochrome colour painted behind the icon shape`);
                continue;
            }
            let icon: string;
            let card: string;
            try {
                icon = resolveColour(iconRef, themeSrc, shared);
            } catch (err) {
                offenders.push(`${theme}: the icon colour fails to resolve (${detail(err)})`);
                continue;
            }
            try {
                card = resolveColour('var(--card-background)', themeSrc, shared);
            } catch (err) {
                offenders.push(`${theme}: the card surface fails to resolve (${detail(err)})`);
                continue;
            }
            const ratio = contrast(icon, card);
            if (ratio < MIN_ICON) {
                offenders.push(
                    `${theme}: the monochrome icon ${icon} on the card ${card} is ` +
                        `${ratio.toFixed(2)}:1 — below ${MIN_ICON}:1`,
                );
            }
        }

        expect(
            offenders,
            `These icons sit below 3:1 against the area card, so a row does not read\n` +
            `before anything is hovered. --icon-mono is the value to change:\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });

    it('every skill icon is a single-colour asset with its source on record', () => {
        // Spec 005 RF-8. The monochrome mask paints an asset's alpha, so white
        // lettering over a coloured field turns into a blob: TypeScript lost 17%
        // of its drawing, PostgreSQL 19%. One paint, no gradient, nothing white.
        const MAX_LUMINANCE = 0.85;
        const offenders: string[] = [];
        const noticePath = path.join(ROOT, 'public', 'tech', 'mono', 'NOTICE.md');
        const notice = fs.existsSync(noticePath) ? fs.readFileSync(noticePath, 'utf-8') : '';
        if (!notice) offenders.push('public/tech/mono/NOTICE.md is missing');

        const cited = [...notice.matchAll(/\bLICENSE[\w.-]*\.txt\b/g)].map((m) => m[0]);
        if (notice && cited.length === 0) offenders.push('NOTICE.md cites no licence file');
        for (const file of new Set(cited)) {
            if (!fs.existsSync(path.join(ROOT, 'public', 'tech', 'mono', file))) {
                offenders.push(`NOTICE.md cites ${file}, which does not exist`);
            }
        }

        for (const tech of TECH) {
            const { icon, brand } = tech as { icon?: string; brand?: string };
            if (!icon || !icon.startsWith('/')) {
                offenders.push(`${tech.name}: no root-absolute icon`);
                continue;
            }
            const file = path.join(ROOT, 'public', icon);
            if (!fs.existsSync(file)) {
                offenders.push(`${tech.name}: ${icon} does not exist`);
                continue;
            }
            const svg = fs.readFileSync(file, 'utf-8');
            if (/gradient/i.test(svg)) offenders.push(`${tech.name}: ${icon} declares a gradient`);

            const paints = svgPaints(svg);
            if (paints.length > 1) {
                offenders.push(`${tech.name}: ${icon} paints ${paints.length} colours — ${paints.join(', ')}`);
            }
            for (const p of paints.filter((p) => /^#[0-9a-f]{6}$/.test(p))) {
                if (luminance(p) > MAX_LUMINANCE) {
                    offenders.push(`${tech.name}: ${icon} paints ${p}, which the mask cannot tell from a hole`);
                }
            }

            if (brand !== undefined && !/^#[0-9a-fA-F]{6}$/.test(brand)) {
                offenders.push(`${tech.name}: brand ${brand} is not a #RRGGBB colour`);
            }
            if (notice && !notice.includes(path.basename(icon))) {
                offenders.push(`${tech.name}: NOTICE.md does not name ${path.basename(icon)}`);
            }
        }

        expect(
            offenders,
            `Each skill icon must be one shape in one paint, lettering cut out, so the\n` +
            `monochrome mask still shows it; and its source must be on record:\n  ` +
            offenders.join('\n  '),
        ).toEqual([]);
    });
});
