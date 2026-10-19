import type { Lang } from "./about";

export type Experience = {
    role: Record<Lang, string>;
    company: string;
    period: Record<Lang, string>;
    location?: Record<Lang, string>;
    bullets: Record<Lang, string[]>;
    /** Company glyph in /icons/ui; decoration, the name beside it says who (spec 013). */
    glyph?: 'building' | 'plant';
    /** Technologies the job used, shown as chips in this order; free strings, not skills. */
    tech?: string[];
};

export const EXPERIENCES: Experience[] = [
    {
        role: {
            es: "Desarrollador Full Stack",
            en: "Full Stack Developer",
        },
        company: "SD Misiones de Costa Rica S. A.",
        glyph: "building",
        tech: [".NET", "Angular", "TypeScript", "SQL Server", "Azure Functions", "SSE", "CI/CD"],
        period: {
            es: "2022 - 2025",
            en: "2022 - 2025",
        },
        location: {
            es: "Costa Rica (Remoto)",
            en: "Costa Rica (Remote)",
        },
        bullets: {
            es: [
                "Desarrollo de APIs y servicios con .NET Core.",
                "Optimización de consultas e índices SQL.",
                "Frontend en Angular y TypeScript.",
                "Implementación de SSE para actualizaciones en tiempo real.",
            ],
            en: [
                "Built APIs and services with .NET Core.",
                "Optimised SQL queries and indexes.",
                "Frontend development with Angular and TypeScript.",
                "Implemented SSE for real-time updates.",
            ],
        },
    },
    {
        role: {
            es: "Ingeniero de Software",
            en: "Software Engineer",
        },
        company: "Plantas y Flores Ornamentales S.A.",
        glyph: "plant",
        tech: [".NET", "ASP.NET", "Java", "Kotlin", "JavaScript", "SQL Server"],
        period: {
            es: "2019 - 2020",
            en: "2019 - 2020",
        },
        location: {
            es: "Costa Rica",
            en: "Costa Rica",
        },
        bullets: {
            es: [
                "Desarrollo de aplicaciones web y escritorio con .NET y ASP.NET.",
                "Diseño de APIs con C#, Node.js y JavaScript.",
                "Apps móviles con Kotlin y Java.",
                "Administración de bases de datos SQL Server.",
            ],
            en: [
                "Developed web and desktop apps with .NET and ASP.NET.",
                "Designed APIs with C#, Node.js, and JavaScript.",
                "Built mobile apps using Kotlin and Java.",
                "Managed SQL Server databases.",
            ],
        },
    },
];
