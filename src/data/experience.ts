export type Experience = {
    role: string;
    company: string;
    period: string;        // "2022 – 2025"
    location?: string;     // "Costa Rica (Remoto)"
    bullets: string[];     // 3–5 logros/actividades
};

export const EXPERIENCES: Experience[] = [
    {
        role: "Full Stack Developer",
        company: "SD Misiones de Costa Rica S. A.",
        period: "2022 – 2025",
        location: "Costa Rica (Remoto)",
        bullets: [
            "Desarrollo de APIs en .NET Core.",
            "Optimización de bases de datos SQL (consultas e índices).",
            "Frontend con Angular y TypeScript.",
            "Uso de SSE para comunicación en tiempo real."
        ]
    },
    {
        role: "Software Engineer",
        company: "Plantas y Flores Ornamentales S.A.",
        period: "2019 – 2020",
        location: "Costa Rica",
        bullets: [
            "Aplicaciones web y escritorio en .NET y ASP.NET.",
            "APIs con C#, Node.js y JavaScript.",
            "Desarrollo móvil con Kotlin y Java.",
            "Administración de SQL Server."
        ]
    }
];
