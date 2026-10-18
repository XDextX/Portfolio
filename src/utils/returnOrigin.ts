/** What a stored origin holds: the link followed, which of its twins, and its section's heading id. */
export interface OriginRecord {
	href: string;
	index: number;
	heading: string | null;
}

/**
 * Whether a link leaves the page: another path on this site; a query or hash change does not.
 * @param from the page the visitor is on
 * @param to the page the link reaches
 */
export function isLeaving(from: URL, to: URL): boolean {
	return from.origin === to.origin && from.pathname !== to.pathname;
}

/**
 * The sessionStorage key a page's origin lives under.
 * @param pathname the page's path
 */
export function originKey(pathname: string): string {
	return `return-origin:${pathname}`;
}

/**
 * A stored record read back without trusting it.
 * @param raw the stored string, or null
 * @returns the record, or null when it is missing, malformed or the wrong shape
 */
export function parseOrigin(raw: string | null): OriginRecord | null {
	if (!raw) return null;
	try {
		const r = JSON.parse(raw);
		const ok = r && typeof r.href === 'string' && Number.isInteger(r.index) && r.index >= 0
			&& (r.heading === null || typeof r.heading === 'string');
		return ok ? { href: r.href, index: r.index, heading: r.heading } : null;
	} catch {
		return null;
	}
}
