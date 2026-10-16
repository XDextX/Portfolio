import type { Lang } from "./about";

type Text = Record<Lang, string>;

/** One step of the "Lo que construyo" process; its number, tint and tone come from its position. */
export interface ProcessStep {
    icon: "bulb" | "code" | "database" | "rocket";
    title: Text;
    description: Text;
    tags: Record<Lang, readonly string[]>;
}

// Spec 011: the owner's Spanish, from the mockup; the English is the planner's translation,
// approved by the owner. Editable content lives here and nowhere else (constitution 5).
export const PROCESS: { intro: Text; note: Text; steps: readonly ProcessStep[] } = {
    intro: {
        es: "Desarrollo soluciones web completas, combinando diseño, arquitectura y buenas prácticas para crear productos escalables y de alto impacto.",
        en: "I build complete web solutions, combining design, architecture and good practices to create scalable, high-impact products."
    },
    note: {
        es: "De la idea a producción",
        en: "From idea to production"
    },
    steps: [
        {
            icon: "bulb",
            title: { es: "Analizo y diseño", en: "I analyze and design" },
            description: {
                es: "Comprendo el problema, defino la solución y diseño la arquitectura adecuada.",
                en: "I understand the problem, define the solution and design the right architecture."
            },
            tags: { es: ["Planificación", "Arquitectura"], en: ["Planning", "Architecture"] }
        },
        {
            icon: "code",
            title: { es: "Desarrollo", en: "I develop" },
            description: {
                es: "Implemento soluciones robustas con buenas prácticas y código mantenible.",
                en: "I implement robust solutions with good practices and maintainable code."
            },
            tags: { es: ["Backend", "Frontend", "APIs"], en: ["Backend", "Frontend", "APIs"] }
        },
        {
            icon: "database",
            title: { es: "Integro y optimizo", en: "I integrate and optimize" },
            description: {
                es: "Conecto con bases de datos, servicios en la nube y terceros. Optimizo rendimiento y seguridad.",
                en: "I connect to databases, cloud services and third parties. I optimize performance and security."
            },
            tags: { es: ["Bases de datos", "Cloud", "DevOps"], en: ["Databases", "Cloud", "DevOps"] }
        },
        {
            icon: "rocket",
            title: { es: "Despliego y evoluciono", en: "I deploy and evolve" },
            description: {
                es: "Llevo las soluciones a producción y las mantengo en constante mejora.",
                en: "I take solutions to production and keep improving them."
            },
            tags: { es: ["CI/CD", "Monitoreo", "Escalabilidad"], en: ["CI/CD", "Monitoring", "Scalability"] }
        }
    ]
};
