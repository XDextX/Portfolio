import { getViteConfig } from 'astro/config';

// Spec 014 D-1: Astro's Vite config, so vitest compiles .astro for the Container API
// cases. `npm test` passes `tests`; the include keeps the Playwright spec out either way.
export default getViteConfig({ test: { include: ['tests/**/*.test.ts'] } });
