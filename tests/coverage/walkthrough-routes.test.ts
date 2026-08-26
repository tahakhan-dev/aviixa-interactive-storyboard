import { describe, expect, it } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { exportedRoutes } from '../e2e/exported-routes'

/**
 * EVERY ROUTE A WALKTHROUGH NAMES MUST EXIST IN THE EXPORT.
 *
 * WHY. `docs/walkthroughs.md` is a document a client is asked to follow click
 * by click, and a document is the artefact in this build with no other way to
 * go stale loudly. A renamed route leaves the walkthrough pointing at a 404,
 * every suite stays green, and the failure surfaces in front of the client —
 * the worst possible reader to discover it.
 *
 * This is the same defect shape as the hand-written route lists
 * `tests/e2e/exported-routes.ts` was written to kill: an enumeration
 * maintained by hand with no way to notice when it falls behind what it
 * covers. The fix is the same — derive the truth, compare the hand-written
 * thing against it.
 *
 * WHAT IT DOES NOT DO, AND WHAT THAT COST — R7-B13. Its subject is ROUTE
 * STRINGS. It says so above, it was honest about it, and it was still the
 * only gate over these documents: nine stale or false claims accumulated in
 * `docs/walkthroughs.md` and `docs/client-review-guide.md` under a green
 * chain, two of them Critical. All 21 routes this file checked existed the
 * whole time, while a step counted three prohibitions on a page rendering
 * six and the guide told a reviewer not to look at eleven shipped screens.
 * Round 6's shape at document scale: the gate scoped to exclude the defect
 * the artefact actually has.
 *
 * The figures are now held by `tests/coverage/client-document-figures.test.ts`
 * — every number in these documents extracted by a pattern that must match
 * exactly once and compared by EQUALITY against `exportedRoutes()`,
 * `registries/generated/**` or the screenshot manifest. This file keeps its
 * own narrow subject deliberately; the two together are the coverage.
 *
 * What still nothing does: check that a step says anything USEFUL about the
 * page it names. Prose is reviewed by people.
 */

const DOC = join(process.cwd(), 'docs', 'walkthroughs.md')

/**
 * Routes as the document writes them: a backticked absolute path with a
 * trailing slash, which is the only form `trailingSlash: true` emits. A bare
 * `/hub/` inside prose is not picked up, deliberately — the table cells are
 * the instructions, and widening this to all prose would collect every
 * mention of a directory in a sentence.
 */
function routesNamedIn(markdown: string): string[] {
  return [...new Set(markdown.match(/`(\/[a-z0-9-]+(?:\/[a-z0-9-]+)*\/)`/g) ?? [])].map((m) =>
    m.replace(/`/g, ''),
  )
}

describe('walkthrough routes', () => {
  // FAILS IF: the document is missing, or names no routes — in which case
  // every check below would pass by having nothing to compare. Planted: DOC
  // pointed at a file with the tables removed; went red here.
  it('reads a walkthrough document that names routes', () => {
    expect(existsSync(DOC), 'docs/walkthroughs.md is missing').toBe(true)
    expect(routesNamedIn(readFileSync(DOC, 'utf8')).length).toBeGreaterThan(15)
  })

  // FAILS IF: a walkthrough step names a route the export does not have.
  //
  // Planted: `/frontline/run-player/` changed to `/frontline/run-playback/`
  // in the document. Went red naming the step's route and listing it as
  // absent. Restored byte-identically.
  it('names only routes the export actually has', () => {
    const exported = new Set(exportedRoutes())
    // The floor is the same one every caller of exportedRoutes() pins: a walk
    // that returned an empty list would make the check below vacuously true.
    expect(exported.size).toBeGreaterThan(50)

    const missing = routesNamedIn(readFileSync(DOC, 'utf8')).filter((r) => !exported.has(r))
    expect(missing, 'walkthrough steps naming routes that are not in the export').toEqual([])
  })

  // FAILS IF: the walkthroughs stop covering a surface that has screens.
  //
  // Not a count and not a percentage — a surface with route directories and
  // no walkthrough step is a surface a reviewer has no path into, and that is
  // a real gap however many steps exist elsewhere. `/coverage/` and the
  // chrome routes are excluded because they are destinations rather than
  // surfaces.
  it('gives every built surface at least one walkthrough step', () => {
    const named = routesNamedIn(readFileSync(DOC, 'utf8'))
    const surfaceOf = (r: string): string => r.split('/')[1] ?? ''
    const built = new Set(
      exportedRoutes()
        .map(surfaceOf)
        .filter((s) => s !== '' && s !== '404' && s !== '_not-found'),
    )
    const covered = new Set(named.map(surfaceOf))
    const uncovered = [...built].filter((s) => !covered.has(s)).sort()
    expect(uncovered, 'built surfaces with no walkthrough step').toEqual([])
  })
})
