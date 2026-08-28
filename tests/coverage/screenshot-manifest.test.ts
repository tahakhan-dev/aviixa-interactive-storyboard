import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { exportedRoutes } from '../e2e/exported-routes'
import { requiredScreenshotRoutes } from '../e2e/required-screenshot-routes'

/**
 * THE SCREENSHOT MANIFEST WENT THREE SLICES STALE AND NOTHING COULD SAY SO.
 *
 * `docs/screenshots/manifest.json` is a required deliverable — master prompt
 * §27.2 — and at the slice-11 audit it held 85 rows against a 102-route export:
 * seventeen real screens with no capture, among them eleven Command Center
 * module routes and `/workflows/ai-and-its-absence/`. Audit C-23. Its last
 * write was slice 8.
 *
 * NOTHING WAS RED, AND THE REASON IS WORTH MORE THAN THE COUNT. There IS an
 * assertion that the manifest covers every route —
 * `tests/screenshots/capture.spec.ts` compares its rows against
 * `exportedRoutes()` — but it makes that comparison AFTER writing the manifest
 * itself, and it runs under `playwright test --project=screenshots`, which is
 * not in `verify`. A writer checking its own output cannot detect that it was
 * never run. That is defect shape 9 in a new costume: an assertion that cannot
 * fail for the reason anyone cares about.
 *
 * So this reads the committed artefact against the built export, in the release
 * project, where staleness is the whole question. It never writes.
 *
 * ORDERING. Its subject is `out/` (rewritten by `build`) and the committed
 * manifest (rewritten only by `pnpm screenshots`, which is not part of
 * `verify`). It runs in the release project, AFTER build, which is the only
 * order in which the comparison means anything.
 *
 * FIX ROUND 1 (Task 18): "EVERY ROUTE" NARROWED TO "EVERY REQUIRED ROUTE".
 * Task 18 added 5,015 `/coverage/<registry>/<itemId>/` pages, one Next.js
 * route/component instantiated per census row across fourteen registries —
 * not 5,015 distinct blueprint screens. Master prompt §26.2 asks for the
 * "canonical state of every SCREEN" (Tier 1), the critical states of a screen
 * (Tier 2), and representative combinations of a screen (Tier 3) — never one
 * capture per emitted URL, and this build's own established convention (724
 * `/workflows/<id>/` pages, ALSO one template, captured 1:1) shows full
 * per-route capture is a choice this project makes for real product screens,
 * not a rule that survives being applied to a generated census-row dump with
 * no distinct screen behind each row. `requiredScreenshotRoutes()`
 * (`tests/e2e/required-screenshot-routes.ts`) states the reasoning and the
 * collapse rule in full: one representative item-card capture per registry
 * (fourteen) rather than one per row (5,015) — everything else this gate
 * checked before is unchanged.
 */
const MANIFEST = join('docs', 'screenshots', 'manifest.json')
const SHOTS = join('docs', 'screenshots')

type Manifest = { capturedRoutes: number; rows: { route: string; file: string }[] }

describe('the screenshot manifest describes the export it ships beside', () => {
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as Manifest
  const routes = exportedRoutes('out')
  const required = requiredScreenshotRoutes('out')

  it('reads a non-empty export and a non-empty manifest', () => {
    // Non-vacuity for every comparison below: an empty walk would make the set
    // difference empty and the gate would pass on nothing at all.
    expect(routes.length).toBeGreaterThan(50)
    expect(required.length).toBeGreaterThan(50)
    expect(manifest.rows.length).toBeGreaterThan(50)
  })

  it('covers every required route, and claims no route the export does not have', () => {
    const captured = new Set(manifest.rows.map((r) => r.route))
    const exported = new Set(routes)
    expect([...required].filter((r) => !captured.has(r)), 'required but not captured').toEqual([])
    expect([...captured].filter((r) => !exported.has(r)), 'captured but not exported').toEqual([])
  })

  it('states its own row count correctly', () => {
    expect(manifest.capturedRoutes).toBe(manifest.rows.length)
  })

  /*
   * The PNGs are git-ignored, so a fresh clone has the manifest and none of the
   * images. That is deliberate — 102 full-page captures are not source — and it
   * means this case can only be an assertion about a LOCAL capture run, never
   * about the committed tree. Skipped rather than weakened when they are absent,
   * so it cannot pass by finding nothing.
   *
   * R2-05: the body was `if (present.length === 0) return`, which vitest reports
   * as a PASS — the docblock above claimed a skip and the report said "passed"
   * over zero PNGs, which is the same green a real check gives. `ctx.skip()`
   * makes the report say what this comment says. The note is printed with the
   * skip, so a reader who sees the line knows why it was not run.
   */
  it('every row names a file that exists, where the captures are present locally', (ctx) => {
    const present = existsSync(SHOTS) ? readdirSync(SHOTS).filter((f) => f.endsWith('.png')) : []
    if (present.length === 0) {
      ctx.skip(`no PNGs under ${SHOTS}: run \`pnpm screenshots\` to make this case meaningful`)
    }
    expect(
      manifest.rows.map((r) => r.file).filter((f) => !present.includes(f)),
      'manifest rows with no PNG beside them',
    ).toEqual([])
  })
})
