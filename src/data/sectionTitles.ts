/** One home section's title: its locale key, heading id, UI glyph, link and transition name. */
export interface SectionTitleEntry {
    key: string;
    id: string;
    icon: string;
    href?: string;
    transitionName?: string;
}

/**
 * The five home section titles, in page order (spec 008). The glyph names a file in
 * public/icons/ui/; each title's gold word is marked in its locale string.
 */
export const SECTION_TITLES = {
    valueProposition: { key: 'valueProposition.title', id: 'value-prop-title', icon: 'tool' },
    skills: { key: 'skills.title', id: 'skills-title', icon: 'chart-bar' },
    experience: { key: 'experience.title', id: 'work-exp-title', icon: 'briefcase' },
    projects: {
        key: 'projects.title',
        id: 'projects-title',
        icon: 'folder',
        href: '/proyectos',
        transitionName: 'p-projects-title-title',
    },
    contact: { key: 'contact.title', id: 'contact-title', icon: 'mail' },
} satisfies Record<string, SectionTitleEntry>;
