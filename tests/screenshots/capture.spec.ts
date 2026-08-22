import { test, expect } from '@playwright/test'
import { mkdirSync, writeFileSync, statSync, rmSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { exportedRoutes } from '../e2e/exported-routes'

/**
 * THE SCREENSHOT MANIFEST — one full-page capture of every exported route,
 * and a manifest that says what each one shows.
 *
 * WHY IT EXISTS. The master prompt requires a screenshot manifest among the
 * final deliverables and, until this file, the build had **zero screenshots**.
 * A client review of a storyboard is conducted by looking at it; a manifest
 * that exists only as a promise is the deliverable most likely to be reported
 * complete without being checked, because nothing in the suite goes red when
 * it is absent.
 *
 * WHAT IT IS NOT. It is not a visual-regression gate. Nothing here compares a
 * capture with a baseline, and adding that would make every legitimate copy
 * change a red run in a build whose copy is still being written. What it
 * asserts is that **every exported route was reached, rendered, and captured**
 * — which is the claim the manifest makes on the deliverable's behalf.
 *
 * THE ROUTE LIST IS DERIVED, never hand-written. `exportedRoutes()` reads the
 * export, for the reason its own file records at length: two suites carried
 * hand lists that fell twenty-eight routes behind the build and stayed green
 * while claiming to cover everything.
 *
 * ONE TEST, NOT ONE PER ROUTE. The manifest is a single artefact and
 * `fullyParallel` is on, so per-route tests would race each other writing it.
 * The loop is sequential and the timeout is sized for it rather than for a
 * page.
 */

const OUT_DIR = join(process.cwd(), 'docs', 'screenshots')
const MANIFEST = join(process.cwd(), 'docs', 'screenshots', 'manifest.json')

/** `/hub/run-drill-down/` -> `hub-run-drill-down`; `/` -> `root`. */
function fileNameFor(route: string): string {
  const trimmed = route.replace(/^\/|\/$/g, '')
  return trimmed === '' ? 'root' : trimmed.replace(/\//g, '-')
}

test('captures every exported route and writes the manifest', async ({ page }) => {
  const routes = exportedRoutes()

  // FAILS IF: the export is missing or empty, in which case the loop below
  // would write an empty manifest and report success. Planted: OUT pointed at
  // an empty directory; went red here rather than shipping a manifest of
  // nothing. The floor is deliberately well below the current count — this
  // asserts "the export is real", not "the export has not changed".
  expect(routes.length).toBeGreaterThan(50)

  test.setTimeout(routes.length * 4_000 + 60_000)

  /**
   * DELETE THE CAPTURES, NOT THE DIRECTORY. The first form of this was
   * `rmSync(OUT_DIR, { recursive: true })` and it deleted `README.md` — a
   * committed file explaining what this directory is — along with the PNGs it
   * meant to clear. A cleanup step that removes a directory removes everything
   * anyone else put in it, and the only reason it was noticed is that `git
   * status` showed the deletion before the next commit.
   */
  mkdirSync(OUT_DIR, { recursive: true })
  for (const entry of readdirSync(OUT_DIR)) {
    if (entry.endsWith('.png')) rmSync(join(OUT_DIR, entry), { force: true })
  }

  const rows: Record<string, unknown>[] = []

  for (const route of routes) {
    const file = `${fileNameFor(route)}.png`
    await page.goto(route, { waitUntil: 'networkidle' })

    // The identifiers the page itself names. Read from rendered text, not from
    // the source that produced it: a manifest built from `src/` would describe
    // what the code intends rather than what the client will see, and this
    // build has shipped four panels whose module id was undefined at
    // prerender while every component test passed.
    const text = await page.evaluate(() => document.body.innerText)
    const ids = [...new Set(text.match(/\b(?:MOD|SCR|FEAT|FUNC|AC)-[A-Z]{2,3}-[A-Za-z0-9-]+/g) ?? [])].sort()
    const heading = await page.locator('h1').first().textContent().catch(() => null)

    await page.screenshot({ path: join(OUT_DIR, file), fullPage: true })

    rows.push({
      route,
      file,
      heading: heading?.trim() ?? null,
      identifiersOnPage: ids,
      bytes: statSync(join(OUT_DIR, file)).size,
    })
  }

  // FAILS IF: a route rendered nothing worth capturing. A zero-byte or
  // near-empty PNG is a page that failed to paint, and it would otherwise sit
  // in the manifest looking like coverage.
  const tiny = rows.filter((r) => (r.bytes as number) < 3_000)
  expect(tiny.map((r) => `${r.route} -> ${r.bytes} bytes`)).toEqual([])

  writeFileSync(
    MANIFEST,
    JSON.stringify(
      {
        countedThing:
          'one full-page screenshot per route in the static export, captured from the served ' +
          'snapshot rather than from src/, so the manifest describes what a reviewer sees. The ' +
          'route list is derived from the export by exportedRoutes(); it is never hand-written.',
        capturedRoutes: rows.length,
        viewport: page.viewportSize(),
        rows,
      },
      null,
      2,
    ) + '\n',
  )

  expect(rows).toHaveLength(routes.length)
})
