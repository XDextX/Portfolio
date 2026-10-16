export type ContactKind = "email" | "github" | "linkedin" | "phone" | "website";

/** One contact channel. The label is a proper name or a locale key (spec 018). */
export type ContactItem = {
    id: string;             // "email" | "github" ...
    label?: string;         // a proper name: "GitHub", "LinkedIn"
    labelKey?: string;      // a locale key, for labels that translate: "about.social.email"
    value: string;          // visible text (e.g. an email address or a profile handle)
    href: string;           // "mailto:...", "https://...", "tel:+506..."
    kind: ContactKind;
    icon: string | { light: string; dark: string };  // colour logo in /public/icons, or one per theme
    sameAs?: boolean;       // publishable profile: feeds JSON-LD sameAs / rel=me
};

/** A contact as the hero's social button draws it: a translated label beside one glyph. */
export type HeroSocial = ContactItem & {
    labelKey: string;       // locale key of the visible label
    glyph: string;          // root-absolute path to a mask glyph in /public/icons/ui
};
