import { CONTACTS } from "./contacts";
import type { ContactItem } from "../types/contact";

export type Lang = "es" | "en";

/**
 * Orden en que se muestran los botones sociales en la sección About.
 * Los ids referencian `CONTACTS`; los datos no se duplican aquí.
 */
const SOCIAL_ORDER = ["github", "linkedin", "email"] as const;

const socials: ContactItem[] = SOCIAL_ORDER.map(
    (id) => CONTACTS.find((c) => c.id === id)
).filter((c): c is ContactItem => Boolean(c));

const emailContact = CONTACTS.find((c) => c.kind === "email");

export const ABOUT = {
    name: "German Montero Ramirez",
    title: "Full-Stack Developer",
    location: "Costa Rica",
    avatar: "https://github.com/XDextX.png",
    // Raíz-absoluta: una ruta relativa rompería en /proyectos y /proyectos/[name].
    resumeUrl: "/cv/German Montero CV EN.pdf",
    socials,
    bio: {
        es: `Soy desarrollador de software con más de 6 años de experiencia, especializado en desarrollo Full Stack...
A lo largo de mi carrera he trabajado con .NET Core, Azure Functions y Angular, con experiencia en Java, TypeScript, C# y SQL...
Actualmente profundizo en Server-Sent Events (SSE), Jasmine y Selenium.`,
        en: `I’m a software engineer with 6+ years of experience, focused on Full-Stack development...
Experienced with .NET Core, Azure Functions, Angular, plus Java, TypeScript, C#, and SQL...
Currently sharpening Server-Sent Events (SSE), Jasmine, and Selenium.`
    }
} as const;

export const JsonLdAbout = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: ABOUT.name,
    jobTitle: ABOUT.title,
    url: "https://portfolio-dext.vercel.app",
    image: `${ABOUT.avatar}`,
    // Los perfiles publicables (sin mailto:) alimentan sameAs / rel=me.
    sameAs: ABOUT.socials
        .filter((s) => s.kind !== "email")
        .map((s) => s.href),
    ...(emailContact ? { email: emailContact.value } : {}),
    address: { "@type": "PostalAddress", addressCountry: "Costa Rica" }
};
