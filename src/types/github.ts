export type GitHubRepo = {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;       // código
    homepage?: string | null; // demo (si viene en el repo)
    language?: string | null;
    topics?: string[];
    stargazers_count: number;
    forks_count: number;
    updated_at: string;     // ISO
    owner: {
        login: string;
        avatar_url: string;
    };
};
