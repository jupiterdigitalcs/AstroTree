import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config for AstroDig.
 *
 * Runs against `next dev` on localhost:3000 by default. To run against a
 * deployed Vercel preview, set PLAYWRIGHT_BASE_URL to the preview URL.
 *
 * Projects:
 *   - desktop-chrome  (Chromium engine, desktop viewport)
 *   - desktop-safari  (WebKit engine, desktop viewport — catches Safari ITP bugs)
 *   - mobile-chrome   (Pixel 7 — Android, touch, mobile viewport)
 *   - mobile-safari   (iPhone 14 — WebKit, touch, mobile viewport, cosmic mode)
 *
 * NOTE: WebKit projects (desktop-safari, mobile-safari) require macOS 15+ to
 * run locally. On older macOS, Playwright ships a frozen WebKit build that
 * crashes (Bus error). Use `npm run test:e2e` for the Chromium-only matrix
 * locally; WebKit runs cleanly in Linux CI.
 *
 * Run a single project: `npx playwright test --project=mobile-safari`
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // 2 workers — `next dev` chokes when more than 2-3 concurrent test pages
  // hammer it (chunks fail to compile in time, tests time out waiting on
  // /_next/ requests). Sequential single-worker takes ~27s for 19 tests,
  // 2 workers takes ~15s. Don't go higher without switching to next start.
  workers: 2,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',

  use: {
    // Use port 3001 — port 3000 is taken by the Jupiter Digital site dev server.
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'desktop-safari',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'] },
    },
  ],

  // Auto-start the dev server when running locally. Skip if PLAYWRIGHT_BASE_URL
  // is set (i.e. running against a deployed preview in CI).
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'next dev -p 3001',
        url: 'http://localhost:3001',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
