/**
 * Source with block, line and HTML comments blanked: a note quoting removed code is not a use.
 * @param src a .ts, .astro or .json file's text
 * @returns the text with comments blanked
 */
export function stripComments(src: string): string {
    return src
        .replace(/<!--[\s\S]*?-->/g, ' ')
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/^\s*\/\/.*$/gm, ' ');
}
