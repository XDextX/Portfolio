import { CONTACTS } from "./contacts.ts";
import type { ContactItem, HeroSocial } from "../types/contact";

export type Lang = "es" | "en";

/**
 * Order the social buttons appear in on the About section, with each one's label key
 * and glyph. The ids reference `CONTACTS`; the data is not duplicated here.
 */
const SOCIAL_ORDER = [
    { id: "github", labelKey: "about.social.github", glyph: "/icons/ui/brand-github.svg" },
    { id: "linkedin", labelKey: "about.social.linkedin", glyph: "/icons/ui/brand-linkedin.svg" },
    // The email glyph is the contact card's own (spec 029): one source for it.
    { id: "email", labelKey: "about.emailButton" },
] as const;

const socials: HeroSocial[] = SOCIAL_ORDER.flatMap((entry) => {
    const contact = CONTACTS.find((c) => c.id === entry.id);
    const glyph = "glyph" in entry ? entry.glyph : contact?.glyph;
    return contact && glyph ? [{ ...contact, labelKey: entry.labelKey, glyph }] : [];
});

/** The hero's four phrases, in reading order; the words live in the locale files. */
const PHRASE_KEYS = ["about.phrases.ideas", "about.phrases.code", "about.phrases.solutions", "about.phrases.results"] as const;

const emailContact = CONTACTS.find((c) => c.kind === "email");

export type Identity = { given: string; family?: string };

// Spec 010: the hero paints the two parts in two colours, so the data states the split
// rather than anything guessing it from a space.
const IDENTITY: Identity = { given: "German", family: "Montero Ramirez" };

const assertPart = (part: string, what: string) => {
    if (!part || part !== part.trim() || /\s{2,}/.test(part)) throw new Error(`malformed ${what}: "${part}"`);
};

/**
 * The full name as the hero heading and every meta tag read it.
 * @param id the given name and, when there is one, the family name
 * @returns `given`, plus one space and `family` when present; throws on a malformed part
 */
export function fullName(id: Identity): string {
    assertPart(id.given, "given name");
    if (id.family !== undefined) assertPart(id.family, "family name");
    return id.family ? `${id.given} ${id.family}` : id.given;
}

/**
 * The name split as the data states it.
 * @param id the given name and, when there is one, the family name
 * @returns both parts, `family` null rather than empty when there is none
 */
export function nameParts(id: Identity): { given: string; family: string | null } {
    fullName(id);
    return { given: id.given, family: id.family ?? null };
}

export const ABOUT = {
    name: fullName(IDENTITY),
    nameParts: nameParts(IDENTITY),
    title: "Full-Stack Developer",
    // The location datum, spelled once: the hero and the JSON-LD below read it (spec 018 RF-2).
    location: "Costa Rica",
    avatar: "https://github.com/XDextX.png",
    // Root-absolute: a relative path breaks on /proyectos and /proyectos/[name].
    resumeUrl: "/cv/German Montero CV EN.pdf",
    socials,
    phraseKeys: PHRASE_KEYS,
    // The proposal's copy (spec 035).
    bio: {
        es: "Desarrollo soluciones de software completas, desde la arquitectura hasta su puesta en producción. Más de 6 años de experiencia trabajando con .NET, Java, TypeScript y tecnologías en la nube.",
        en: "I build complete software solutions, from the architecture to production. Over 6 years of experience working with .NET, Java, TypeScript and cloud technologies."
    }
} as const;

export const JsonLdAbout = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: ABOUT.name,
    jobTitle: ABOUT.title,
    url: "https://portfolio-dext.vercel.app",
    image: `${ABOUT.avatar}`,
    // Publishable profiles (excluding mailto:) feed sameAs / rel=me.
    // `sameAs` on the contact is the flag that marks a profile as publishable,
    // so it is read here instead of being re-derived from `kind`.
    sameAs: ABOUT.socials
        .filter((s) => s.sameAs)
        .map((s) => s.href),
    ...(emailContact ? { email: emailContact.value } : {}),
    address: { "@type": "PostalAddress", addressCountry: ABOUT.location }
};
