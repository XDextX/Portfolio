import { defineConfig, devices } from '@playwright/test';

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
    // Spec 015: the contact form's server, on its own port so it never reuses a dev server of
    // unknown configuration. CONTACT_E2E selects the stub sender, in dev only; values are fakes.
    webServer: {
        command: 'npm run dev -- --port 4329',
        url: 'http://localhost:4329',
        reuseExistingServer: false,
        timeout: 120_000,
        env: { CONTACT_E2E: '1', MAILTRAP_API_TOKEN: 'e2e-fake-token', CONTACT_FROM_EMAIL: 'form@example.test' },
    },
    projects: [
        // The installed Chrome, so no browser is downloaded (constitution 7).
        { name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
    ],
});
