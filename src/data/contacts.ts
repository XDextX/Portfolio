import type { ContactItem } from "../types/contact";

export const CONTACTS: ContactItem[] = [
    {
        id: "email",
        label: "Email",
        value: "germonram@gmail.com",
        href: "mailto:germonram@gmail.com",
        kind: "email",
        icon: "icons/gmail.svg"
    },
    {
        id: "github",
        label: "GitHub",
        value: "github.com/XDextX",
        href: "https://github.com/XDextX",
        kind: "github",
        icon: "icons/github.svg",
        sameAs: true
    },
    {
        id: "linkedin",
        label: "LinkedIn",
        value: "linkedin.com/in/german-montero-ramirez/",
        href: "https://www.linkedin.com/in/german-montero-ramirez/",
        kind: "linkedin",
        icon: "icons/linkedin.svg",
        sameAs: true
    },
];
