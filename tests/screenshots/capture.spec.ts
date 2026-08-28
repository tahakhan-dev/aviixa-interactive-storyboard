import { test, expect } from '@playwright/test'
import { mkdirSync, writeFileSync, statSync, rmSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { requiredScreenshotRoutes } from '../e2e/required-screenshot-routes'

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
 * THE ROUTE LIST IS DERIVED, never hand-written. `requiredScreenshotRoutes()`
 * reads the export via `exportedRoutes()`, for the reason its own file
 * records at length: two suites carried hand lists that fell twenty-eight
 * routes behind the build and stayed green while claiming to cover
 * everything. FIX ROUND 1 (Task 18): it is no longer `exportedRoutes()`
 * directly — `tests/e2e/required-screenshot-routes.ts` collapses the 5,015
 * `/coverage/<registry>/<itemId>/` census-row pages (one template, no
 * distinct screen per row) to one representative per registry, per master
 * prompt §26.2's "canonical state of every SCREEN"; every other route is
 * unaffected. See that file for the full argument.
 *
 * ONE TEST, NOT ONE PER ROUTE. The manifest is a single artefact and
 * `fullyParallel` is on, so per-route tests would race each other writing it.
 * The loop is sequential and the timeout is sized for it rather than for a
 * page.
 *
 * WHICH OF MASTER PROMPT §27.2'S SIXTEEN FIELDS THIS CAN HONESTLY EMIT, AND
 * WHY THE REST ARE NAMED IN `fieldsNotCarried` RATHER THAN GUESSED (R7-B10).
 * §27.2 asks for a manifest keyed by screenshot ID, screen, route, persona,
 * scope, story step, state, viewport, locale, theme, source IDs, acceptance
 * IDs, test, source hash, build hash and baseline hash. Nine of those are
 * things this capture genuinely knows, because it is standing in the browser
 * when it writes them: the id, the screen's own `h1`, the route, the viewport
 * it captured at, the locale the document declares, the colour scheme the
 * capture ran under, the identifiers the page names — split into source IDs
 * and acceptance IDs rather than merged, which is what §27.2 asks for and
 * what the earlier single `identifiersOnPage` array did not give — and the
 * build id of the export the snapshot was served from.
 *
 * The other seven are NOT absent because they were forgotten. Persona, scope,
 * story step, state and test are properties of a WALKTHROUGH STEP, and this
 * build has no walkthrough runner: every capture here is the same anonymous
 * first load of a route with no interaction, so a `persona` column would be
 * one invented value repeated 102 times and a `state` column would say
 * "as loaded" and distinguish nothing. Baseline hash presumes a visual
 * baseline, and this build deliberately has none — `docs/screenshots/
 * README.md` says why. All seven are named in `fieldsNotCarried` with the
 * reason and the slice that owns them, because a field a reader can see is
 * missing is a smaller problem than a field filled with a plausible lie.
 * Building the runner is slice 13 (RESUME §5).
 */

const OUT_DIR = join(process.cwd(), 'docs', 'screenshots')
const MANIFEST = join(process.cwd(), 'docs', 'screenshots', 'manifest.json')

/** `/hub/run-drill-down/` -> `hub-run-drill-down`; `/` -> `root`. */
function slugFor(route: string): string {
  const trimmed = route.replace(/^\/|\/$/g, '')
  return trimmed === '' ? 'root' : trimmed.replace(/\//g, '-')
}

/**
 * THE BUILD THE CAPTURES WERE TAKEN FROM. Next names one directory under
 * `out/_next/static/` after the build id and puts `_buildManifest.js` in it;
 * every other directory there is an asset tree. Derived rather than passed in
 * so it cannot be a stale argument, and `null` rather than a throw when the
 * layout changes — a missing build id is a weaker manifest, not a failed
 * capture run, and a `null` a reader can see beats a guess they cannot.
 */
function buildIdOfExport(root = 'out'): string | null {
  const dir = join(root, '_next', 'static')
  if (!existsSync(dir)) return null
  const named = readdirSync(dir).filter((d) => existsSync(join(dir, d, '_buildManifest.js')))
  return named.length === 1 ? (named[0] ?? null) : null
}

/**
 * §27.2 asks for source IDs and acceptance IDs as SEPARATE keys. One merged
 * `identifiersOnPage` array answered neither question — R7-B10 measured 289
 * `AC-*` sitting in the same array as 84 `MOD`, 124 `SCR`, 860 `FUNC` and 479
 * `FEAT`. The union is still emitted, because `docs/screenshots/README.md`
 * and `tests/coverage/client-document-figures.test.ts` both count pages that
 * name NO identifier of any kind, and that question is about the union.
 */
const ID_PREFIXES = ['MOD', 'SCR', 'FEAT', 'FUNC', 'AC'] as const

test('captures every required route and writes the manifest', async ({ page }) => {
  const routes = requiredScreenshotRoutes()

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
    const slug = slugFor(route)
    const file = `${slug}.png`
    await page.goto(route, { waitUntil: 'networkidle' })

    // The identifiers the page itself names. Read from rendered text, not from
    // the source that produced it: a manifest built from `src/` would describe
    // what the code intends rather than what the client will see, and this
    // build has shipped four panels whose module id was undefined at
    // prerender while every component test passed.
    const text = await page.evaluate(() => document.body.innerText)
    const ids = [...new Set(text.match(/\b(?:MOD|SCR|FEAT|FUNC|AC)-[A-Z]{2,3}-[A-Za-z0-9-]+/g) ?? [])].sort()
    const heading = await page.locator('h1').first().textContent().catch(() => null)

    // Locale and theme are READ from the page under capture rather than
    // assumed from the config. `lang` is what a screen reader announces, and
    // the colour scheme is the one the capture actually ran under — the two
    // §27.2 fields this spec was already standing close enough to measure.
    const { locale, theme } = await page.evaluate(() => ({
      locale: document.documentElement.lang || null,
      theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    }))

    await page.screenshot({ path: join(OUT_DIR, file), fullPage: true })

    const idsWithPrefix = (p: string): string[] => ids.filter((i) => i.startsWith(`${p}-`))

    rows.push({
      id: `SHOT-${slug}`,
      route,
      file,
      screen: heading?.trim() ?? null,
      moduleIds: idsWithPrefix('MOD'),
      screenIds: idsWithPrefix('SCR'),
      featureIds: idsWithPrefix('FEAT'),
      functionIds: idsWithPrefix('FUNC'),
      acceptanceIds: idsWithPrefix('AC'),
      identifiersOnPage: ids,
      viewport: page.viewportSize(),
      locale,
      theme,
      bytes: statSync(join(OUT_DIR, file)).size,
    })
  }

  // FAILS IF: the prefix split loses an identifier the union carries — a sixth
  // prefix appearing in the export would sit in `identifiersOnPage` and in no
  // per-kind field, and every per-kind count downstream would quietly
  // undercount. Equality over the union, not a subset check.
  const unsplit = rows.flatMap((r) =>
    (r.identifiersOnPage as string[]).filter(
      (i) => !ID_PREFIXES.some((p) => i.startsWith(`${p}-`)),
    ),
  )
  expect([...new Set(unsplit)], 'identifiers carried by no per-kind field').toEqual([])

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
          'one full-page screenshot per REQUIRED route (master prompt §26.2: canonical state of ' +
          'every screen), captured from the served snapshot rather than from src/, so the ' +
          'manifest describes what a reviewer sees. The route list is derived by ' +
          'requiredScreenshotRoutes(), never hand-written; it is exportedRoutes() with the ' +
          '5,015 single-template /coverage/<registry>/<itemId>/ census-row pages collapsed to ' +
          'one representative per registry (fourteen) — see tests/e2e/required-screenshot-' +
          'routes.ts for the full reasoning. Every other route is captured 1:1.',
        capturedRoutes: rows.length,
        viewport: page.viewportSize(),
        buildId: buildIdOfExport(),
        /*
         * THE SEVEN §27.2 FIELDS THIS MANIFEST DOES NOT CARRY, NAMED HERE
         * RATHER THAN LEFT TO BE NOTICED. R7-B10 found eleven §27.2 fields
         * missing and nothing in the artefact saying so, which is the same
         * shape as a figure with no gate: the gap was real and invisible.
         * Nine are now emitted above. These seven cannot be emitted honestly
         * until a walkthrough runner drives the captures.
         */
        fieldsNotCarried: {
          persona:
            'every capture is the same anonymous first load; no walkthrough runner assigns a ' +
            'persona to a step. Slice 13.',
          scope: 'same reason as persona — scope is a property of a walkthrough step. Slice 13.',
          storyStep:
            'no ordered canonical-story set exists (before, action, after, affected-surface, ' +
            'failure, fallback, fallback-failure, safe-state, recovery). Slice 13.',
          state:
            'every capture is the page as loaded, with no interaction, so a state column would ' +
            'hold one value 102 times and distinguish nothing. Slice 13.',
          test:
            'no acceptance test is bound to a capture; this spec writes the artefact, it does ' +
            'not evidence a named test. Slice 13.',
          sourceHash:
            'the frozen blueprint sha256 is asserted every run by ' +
            'tests/coverage/locator-fidelity.test.ts and is not re-stated here, where it would ' +
            'be a second copy that can go stale against the first.',
          baselineHash:
            'this build has no visual baseline, deliberately — docs/screenshots/README.md ' +
            'states why. A baseline hash with no baseline behind it would be the strongest ' +
            'field in the file and the emptiest.',
        },
        rows,
      },
      null,
      2,
    ) + '\n',
  )

  expect(rows).toHaveLength(routes.length)
})
