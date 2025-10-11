export type ContactKind = "email" | "github" | "linkedin" | "phone" | "website";

export type ContactItem = {
    id: string;             // "email" | "github" ...
    label: string;          // "Email", "GitHub", "LinkedIn"
    value: string;          // texto visible (ej: germonram@gmail.com)
    href: string;           // "mailto:...", "https://...", "tel:+506..."
    kind: ContactKind;
    icon?: string;          // ruta a svg en /public/icons
    sameAs?: boolean;       // marca enlaces para JSON-LD / rel=me
};
