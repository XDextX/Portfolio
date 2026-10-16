import type { ContactItem } from "../types/contact";

export const CONTACTS: ContactItem[] = [
    {
        id: "email",
        labelKey: "about.social.email",
        value: "germonram@gmail.com",
        href: "mailto:germonram@gmail.com",
        kind: "email",
        // Root-absolute: a relative path resolves against the current route,
        // so it 404s on any nested page such as /proyectos/<name>.
        icon: "/icons/gmail.svg"
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
