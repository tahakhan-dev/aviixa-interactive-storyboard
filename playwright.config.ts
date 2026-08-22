import { defineConfig, devices } from '@playwright/test'

// Tests run against the SERVED STATIC EXPORT, never the dev server.
// Spec section 5.1 and master prompt section 4.2.
export default defineConfig({
  testDir: './tests',
  // Top-level testMatch is the union of every project's, because a file no
  // project matches is silently not run. Per-project `testMatch` below is what
  // decides which project runs which — the screenshot capture is deliberately
  // NOT part of `pnpm test:e2e`, because it writes a deliverable rather than
  // proving a property, and coupling a 90-second artefact build to the gate
  // that must stay fast is how a gate stops being run.
  testMatch: ['e2e/**/*.spec.ts', 'accessibility/**/*.spec.ts', 'screenshots/**/*.spec.ts'],
  fullyParallel: true,
  // Slice 3. Playwright's 30s default is sized for a page, not for an axe
  // sweep of a 724-row table under four parallel workers alongside nineteen
  // new Super Admin routes. /workflows/ crossed it at 35.9s and reported as a
  // WCAG failure when nothing was wrong with the page -- the most misleading
  // shape a red test can take, because it names the wrong cause.
  //
  // This IS a blanket -- it applies to all 95 e2e cases, and the first version
  // of this comment called it "a budget, not a blanket", which the code did not
  // support. Axe scanning 724 real rows is genuinely the work; the honest cost
  // is that a real hang now burns 90s before failing. Accepted deliberately: a
  // suite that goes red on contention teaches people to re-run it, and a
  // re-run suite is one nobody reads.
  timeout: 90_000,
  forbidOnly: !!process.env.CI,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['e2e/**/*.spec.ts', 'accessibility/**/*.spec.ts'],
    },
    {
      name: 'screenshots',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['screenshots/**/*.spec.ts'],
    },
  ],
  /**
   * SERVED FROM A SNAPSHOT, NOT FROM `out/`, AND THAT IS A CONCURRENCY FIX.
   *
   * `pnpm build` begins `rm -rf out`, which was added to stop stale artefacts
   * surviving a rebuild — a real defect, and the right fix for it. It created
   * a second one: this suite served from the very directory the build
   * deletes, so a build starting while a suite was running pulled the tree
   * out from under the server. It happened twice, and once it produced 106
   * wholly false failures — the most expensive shape a red run can take,
   * because every one of them names the wrong cause and none of them is a
   * defect in the thing under test.
   *
   * `serve:out` now copies `out/` to `.serve-snapshot/` and serves THAT, so
   * what a suite reads is fixed at the moment the suite started. Measured
   * before choosing it: 24MB, 485 files, 0.11s to copy — against a rebuild
   * of the whole export, that is free.
   *
   * WHY HERE AND NOT IN THE BUILD. Making the build atomic instead — build
   * aside, then swap — means fighting the exporter over its output path, and
   * it would still leave every other reader of `out/` racing a delete. One
   * copy at the reader is smaller than an atomic writer, and it puts the
   * guarantee where the guarantee is needed: this suite reads one tree, and
   * nothing outside this process can change it mid-run.
   *
   * The snapshot is re-copied on every start, so it can never serve a stale
   * export; `reuseExistingServer` keeps a second suite on the first suite's
   * snapshot, which is the same sharing the fixed port already implies.
   */
  webServer: {
    command: 'pnpm serve:out',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
