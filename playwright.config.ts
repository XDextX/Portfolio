import { defineConfig, devices } from '@playwright/test';
import { E2E_PORT, E2E_URL } from './e2e/helpers/server';

export default defineConfig({
    testDir: './e2e',
    timeout: 30_000,
    expect: { timeout: 5_000 },
    fullyParallel: false,
    // open: 'never' — on a failure the HTML report otherwise serves on 9323 and waits,
    // which hangs the pre-commit hook instead of cancelling the commit.
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        headless: true,
        viewport: { width: 1280, height: 720 },
        actionTimeout: 10_000,
        ignoreHTTPSErrors: true,
    },
    // The suite's one server (spec 022), on its own port so it never reuses a dev server of
    // unknown configuration. CONTACT_E2E selects the stub sender, in dev only; values are fakes.
    webServer: {
        command: `npm run dev -- --port ${E2E_PORT}`,
        url: E2E_URL,
        reuseExistingServer: false,
        timeout: 120_000,
        env: { CONTACT_E2E: '1', MAILTRAP_API_TOKEN: 'e2e-fake-token', CONTACT_FROM_EMAIL: 'form@example.test' },
    },
    projects: [
        // The installed Chrome, so no browser is downloaded (constitution 7).
        { name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
    ],
});
