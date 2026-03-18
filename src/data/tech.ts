export type TechCategory = 'Frontend' | 'Backend' | 'Database' | 'Cloud' | 'DevOps';

export const TECH: Array<{
	name: string;
	logo: string;
	href?: string;
	level?: 'beginner' | 'intermediate' | 'advanced';
	category?: TechCategory;
}> = [
	{ name: 'TypeScript',  logo: '/tech/typescript.svg',      href: 'https://www.typescriptlang.org/', level: 'advanced',     category: 'Frontend'  },
	{ name: 'Angular',     logo: '/tech/angular.svg',          href: 'https://angular.dev/',            level: 'advanced',     category: 'Frontend'  },
	{ name: 'Astro',       logo: '/tech/astro-icon-dark.svg',  href: 'https://astro.build/',            level: 'intermediate', category: 'Frontend'  },
	{ name: '.NET',        logo: '/tech/dotnet.svg',           href: 'https://dotnet.microsoft.com/',   level: 'advanced',     category: 'Backend'   },
	{ name: 'Java',        logo: '/tech/java.svg',             href: 'https://www.oracle.com/java/',    level: 'intermediate', category: 'Backend'   },
	{ name: 'SSE',         logo: '/tech/nginx.svg',            href: 'https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events', level: 'beginner', category: 'Backend' },
	{ name: 'PostgreSQL',  logo: '/tech/postgresql.svg',       href: 'https://www.postgresql.org/',     level: 'advanced',     category: 'Database'  },
	{ name: 'MongoDB',     logo: '/tech/mongodb.svg',          href: 'https://www.mongodb.com/',        level: 'intermediate', category: 'Database'  },
	{ name: 'Azure',       logo: '/tech/azure.svg',            href: 'https://azure.microsoft.com/',    level: 'advanced',     category: 'Cloud'     },
	{ name: 'Docker',      logo: '/tech/docker.svg',           href: 'https://www.docker.com/',         level: 'beginner',     category: 'DevOps'    },
];
