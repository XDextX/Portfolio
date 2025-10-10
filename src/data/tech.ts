// src/data/tech.ts
export const TECH: Array<{
    name: string;
    logo: string;
    href?: string;
    level?: "beginner" | "intermediate" | "advanced";
}> = [
        { name: "TypeScript", logo: "/tech/typescript.svg", href: "https://www.typescriptlang.org/", level: "advanced" },
        { name: ".NET", logo: "/tech/dotnet.svg", href: "https://dotnet.microsoft.com/", level: "advanced" },
        { name: "Angular", logo: "/tech/angular.svg", href: "https://angular.dev/", level: "advanced" },
        { name: "Astro", logo: "/tech/astro-icon-dark.svg", href: "https://astro.build/", level: "intermediate" },
        { name: "Java", logo: "/tech/java.svg", href: "https://www.oracle.com/java/", level: "intermediate" },
        { name: "SSE", logo: "/tech/nginx.svg", href: "https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events", level: "beginner" },
        { name: "Azure", logo: "/tech/azure.svg", href: "https://azure.microsoft.com/", level: "advanced" },
        { name: "PostgreSQL", logo: "/tech/postgresql.svg", href: "https://www.postgresql.org/", level: "advanced" },
        { name: "MongoDB", logo: "/tech/mongodb.svg", href: "https://www.mongodb.com/", level: "intermediate" },
        { name: "Docker", logo: "/tech/docker.svg", href: "https://www.docker.com/", level: "beginner" },
    ];
