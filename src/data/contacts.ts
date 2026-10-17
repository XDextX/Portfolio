import type { ContactItem } from "../types/contact";

export const CONTACTS: ContactItem[] = [
    {
        id: "email",
        labelKey: "about.social.email",
        value: "germonram@gmail.com",
        href: "mailto:germonram@gmail.com",
        kind: "email",
        // The site's own mail glyph in gold, as the proposal draws it (spec 029); root-absolute,
        // since a relative path 404s on nested routes. The hero's email button reads it too.
        glyph: "/icons/ui/mail.svg"
    },
    {
        id: "github",
        label: "GitHub",
        value: "github.com/XDextX",
        href: "https://github.com/XDextX",
        kind: "github",
        // The mark is white: one file per theme, or it vanishes on the light card (1.00:1).
        icon: { light: "/icons/github-light.svg", dark: "/icons/github.svg" },
        sameAs: true
    },
    {
        id: "linkedin",
        label: "LinkedIn",
        value: "linkedin.com/in/german-montero-ramirez/",
        href: "https://www.linkedin.com/in/german-montero-ramirez/",
        kind: "linkedin",
        icon: "/icons/linkedin.svg",
        sameAs: true
    },
];
