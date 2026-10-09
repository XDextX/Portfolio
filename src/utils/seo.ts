import type { GitHubRepo } from '@type/github';

const DESCRIPTION_MAX_LENGTH = 160;

/** Cuts to at most `max`, never inside a word. */
function truncateAtWord(text: string, max: number): string {
    const words = text.split(/\s+/).filter((word) => word !== '');
    const kept: string[] = [];

    for (const word of words) {
        if ([...kept, word].join(' ').length > max) break;
        kept.push(word);
    }

    // A first word longer than `max` is kept whole: word integrity outranks the
    // length, so the caller's length check guards the data, not this function.
    return kept.length > 0 ? kept.join(' ') : (words[0] ?? '');
}

/**
 * The home description before truncation: the draft RF-3 compares against.
 * @param template - translated, already interpolated; no placeholder is spliced here
 * @returns the template with every run of whitespace collapsed to one space
 */
export function homeDescriptionDraft(template: string): string {
    return template.replace(/\s+/g, ' ').trim();
}

/**
 * The home description, cut at a word boundary. @param template translated and
 * already interpolated. @param maxLength characters to keep. @returns the
 * longest whole-word prefix of the draft; can exceed maxLength if one word does.
 */
export function homeDescription(template: string, maxLength = DESCRIPTION_MAX_LENGTH): string {
    return truncateAtWord(homeDescriptionDraft(template), maxLength);
}

/**
 * The description a project page shows, and hands to the entity. @param fallback
 * translated text for a repo with none, read by the route: this module imports
 * nothing from i18n (D-2). @returns the repo's own text trimmed, or the fallback.
 */
export function projectDescription(repo: GitHubRepo, fallback: string): string {
    const text = (repo.description ?? '').trim();
    return text === '' ? fallback : text;
}

type ProjectEntity = {
    '@context': string;
    '@type': string;
    name: string;
    url: string;
    description: string;
    codeRepository: string;
    programmingLanguage?: string;
};

/**
 * The `SoftwareSourceCode` entity for one repository. @param args.repo the repo,
 * @param args.url this page's absolute URL, @param args.description what the page
 * shows. @returns the entity, with no `programmingLanguage` key when none is given.
 */
export function projectEntity({
    repo,
    url,
    description,
}: {
    repo: GitHubRepo;
    url: string;
    description: string;
}): ProjectEntity {
    const entity: ProjectEntity = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareSourceCode',
        name: repo.name,
        url,
        description,
        codeRepository: repo.html_url,
    };

    // The route's `repo.language ?? 'N/A'` badge value must not reach the
    // entity: the key is left absent rather than carrying a placeholder (RF-7).
    if (repo.language) entity.programmingLanguage = repo.language;

    return entity;
}