export type ContactKind = "email" | "github" | "linkedin" | "phone" | "website";

export type ContactItem = {
    id: string;             // "email" | "github" ...
    label: string;          // "Email", "GitHub", "LinkedIn"
    value: string;          // visible text (e.g. germonram@gmail.com)
    href: string;           // "mailto:...", "https://...", "tel:+506..."
    kind: ContactKind;
    icon?: string;          // path to an svg in /public/icons
    sameAs?: boolean;       // marks links for JSON-LD / rel=me
};
