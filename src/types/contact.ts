export type ContactKind = "email" | "github" | "linkedin" | "phone" | "website";

export type ContactItem = {
    id: string;             // "email" | "github" ...
    label: string;          // "Email", "GitHub", "LinkedIn"
    value: string;          // visible text (e.g. an email address or a profile handle)
    href: string;           // "mailto:...", "https://...", "tel:+506..."
    kind: ContactKind;
    icon?: string;          // root-absolute path to an svg in /public/icons
    sameAs?: boolean;       // publishable profile: feeds JSON-LD sameAs / rel=me
};

/** A contact as the hero's social button draws it: a translated label beside one glyph. */
export type HeroSocial = ContactItem & {
    labelKey: string;       // locale key of the visible label
    glyph: string;          // root-absolute path to a mask glyph in /public/icons/ui
};
