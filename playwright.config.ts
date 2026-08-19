import { defineConfig, devices } from '@playwright/test'

// Tests run against the SERVED STATIC EXPORT, never the dev server.
// Spec section 5.1 and master prompt section 4.2.
export default defineConfig({
  testDir: './tests',
  testMatch: ['e2e/**/*.spec.ts', 'accessibility/**/*.spec.ts'],
  fullyParallel: true,
  // Slice 3. Playwright's 30s default is sized for a page, not for an axe
  // sweep of a 724-row table under four parallel workers alongside nineteen
  // new Super Admin routes. /workflows/ crossed it at 35.9s and reported as a
  // WCAG failure when nothing was wrong with the page -- the most misleading
  // shape a red test can take, because it names the wrong cause.
  //
  // A budget, not a blanket: axe scanning 724 real rows is the work. If a case
  // ever needs more than this, the case is the problem.
  timeout: 90_000,
  forbidOnly: !!process.env.CI,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm serve:out',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
