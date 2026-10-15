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
    projects: [
        // The installed Chrome, so no browser is downloaded (constitution 7).
        { name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
    ],
});
