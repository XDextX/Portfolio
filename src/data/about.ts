export type Lang = "es" | "en";

export const ABOUT = {
    name: "German Montero Ramirez",
    title: "Full-Stack Developer",
    location: "Costa Rica",
    avatar: "https://github.com/XDextX.png",
    resumeUrl: "/cv/German-Montero-Ramirez.pdf",
    socials: [
        { label: "GitHub", href: "https://github.com/XDextX" },
        { label: "LinkedIn", href: "https://www.linkedin.com/in/german-montero-ramirez/" },
        { label: "Email", href: "mailto:germonram@gmail.com" }
    ],
    bio: {
        es: `Soy desarrollador de software con más de 6 años de experiencia, especializado en desarrollo Full Stack...
A lo largo de mi carrera he trabajado con .NET Core, Azure Functions y Angular, con experiencia en Java, TypeScript, C# y SQL...
Actualmente profundizo en Server-Sent Events (SSE), Jasmine y Selenium.`,
        en: `I’m a software engineer with 6+ years of experience, focused on Full-Stack development...
Experienced with .NET Core, Azure Functions, Angular, plus Java, TypeScript, C#, and SQL...
Currently sharpening Server-Sent Events (SSE), Jasmine, and Selenium.`
    }
} as const;
