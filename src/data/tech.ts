export type TechCategory = 'Frontend' | 'Backend' | 'Database' | 'Cloud' | 'DevOps';

/**
 * `logo` is the colour file the compact view draws; `icon` is the single-colour
 * asset the bars view masks, and `brand` the one colour its hover paints (spec 005
 * RF-8). SSE's icon is generic, so it has no brand. Sources: `/tech/mono/NOTICE.md`.
 */
export const TECH: Array<{
	name: string;
	logo: string;
	icon: string;
	brand?: string;
	href?: string;
	level?: 'beginner' | 'intermediate' | 'advanced';
	category?: TechCategory;
}> = [
	{ name: 'TypeScript',  logo: '/tech/typescript.svg',      icon: '/tech/mono/typescript.svg', brand: '#3178C6', href: 'https://www.typescriptlang.org/', level: 'advanced',     category: 'Frontend'  },
	{ name: 'Angular',     logo: '/tech/angular.svg',          icon: '/tech/mono/angular.svg',    brand: '#0F0F11', href: 'https://angular.dev/',            level: 'advanced',     category: 'Frontend'  },
	{ name: 'Astro',       logo: '/tech/astro-icon-dark.svg',  icon: '/tech/mono/astro.svg',      brand: '#BC52EE', href: 'https://astro.build/',            level: 'intermediate', category: 'Frontend'  },
	{ name: '.NET',        logo: '/tech/dotnet.svg',           icon: '/tech/mono/dot-net.svg',    brand: '#512BD4', href: 'https://dotnet.microsoft.com/',   level: 'advanced',     category: 'Backend'   },
	{ name: 'Java',        logo: '/tech/java.svg',             icon: '/tech/mono/java.svg',       brand: '#E76F00', href: 'https://www.oracle.com/java/',    level: 'intermediate', category: 'Backend'   },
	{ name: 'SSE',         logo: '/tech/nginx.svg',            icon: '/tech/mono/broadcast.svg',                    href: 'https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events', level: 'beginner', category: 'Backend' },
	{ name: 'PostgreSQL',  logo: '/tech/postgresql.svg',       icon: '/tech/mono/postgresql.svg', brand: '#4169E1', href: 'https://www.postgresql.org/',     level: 'advanced',     category: 'Database'  },
	{ name: 'MongoDB',     logo: '/tech/mongodb.svg',          icon: '/tech/mono/mongodb.svg',    brand: '#47A248', href: 'https://www.mongodb.com/',        level: 'intermediate', category: 'Database'  },
	{ name: 'Azure',       logo: '/tech/azure.svg',            icon: '/tech/mono/azure.svg',      brand: '#0078D4', href: 'https://azure.microsoft.com/',    level: 'advanced',     category: 'Cloud'     },
	{ name: 'Docker',      logo: '/tech/docker.svg',           icon: '/tech/mono/docker.svg',     brand: '#2496ED', href: 'https://www.docker.com/',         level: 'beginner',     category: 'DevOps'    },
];
