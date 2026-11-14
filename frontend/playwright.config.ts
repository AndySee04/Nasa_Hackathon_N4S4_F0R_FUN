import { defineConfig } from '@playwright/test'

/**
 * Smoke tests: open every page in a real browser and fail on any JavaScript error.
 * They run against the dev server, where React's StrictMode adds extra checks.
 * Locally this uses your installed Google Chrome; in CI it uses Playwright's Chromium.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    channel: process.env.CI ? undefined : 'chrome',
  },
  webServer: {
    command: 'npx vite --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
