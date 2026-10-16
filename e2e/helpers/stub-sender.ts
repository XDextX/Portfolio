import type { Sender } from '../../src/pages/lib/contact';

/** The subject that makes the e2e stub throw, so a running server can answer failed. */
export const STUB_FAIL_SUBJECT = 'e2e-stub-fail';

/**
 * The e2e stand-in for Mailtrap: answers 200, throws on the fail subject. Reachable only
 * through contact-runtime's seam, on a dev server started with CONTACT_E2E=1.
 */
export const stub: Sender = async (m) => {
    if (m.subject === STUB_FAIL_SUBJECT) throw new Error('stub failure');
    return { status: 200 };
};
