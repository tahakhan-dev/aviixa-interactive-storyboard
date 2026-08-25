import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { REGISTRY_DESCRIPTORS } from '../../src/coverage/descriptors'
import { masterPromptObligation } from './master-prompt'
import { renderedText } from './rendered-text'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * R4-B09 and R4-B10 — WHAT THE FOURTEEN INDEX SCREENS SAY, AND WHERE THEY
 * LET A READER GO.
 *
 * B09: the sentence "N extracted records are listed below" printed `rawCount`
 * — the raw extraction-key count — and two of the ten registries that take
 * that branch disagreed with their own caption: notifications said 205
 * against 286 rendered rows, scheduled-work 67 against 90. Both add rows from
 * transcribed registers the raw key count never saw. The sentence now prints
 * what is listed below, and this gate holds every registry to it rather than
 * the two that were wrong.
 *
 * B10: master prompt §9.6 requires each index to drill into the item's card.
 * Measured across `out/coverage/*` index.html: ZERO in-row links on all
 * fourteen, over 5,018 rows. No per-item route exists and none may be added —
 * `tests/coverage/static-export.test.ts` refuses a second dynamic segment and
 * master prompt §4.2 requires a finite build-time route inventory. What the
 * generator CAN resolve is the route whose evidence set the row's status, and
 * it was discarding that one line after computing it.
 *
 * A LINK IS ONLY WORTH ASSERTING IF IT GOES SOMEWHERE. Every resolved route
 * is checked against `out/` on disk, so a renamed route makes this red rather
 * than shipping 300 dead links. Master prompt §13 forbids a control that does
 * nothing, and a link to nowhere is one.
 *
 * SUBJECT AND ORDERING: `out/coverage/**` (written by `build`) against the
 * generated registries, which are the page's input rather than its output.
 * ═══════════════════════════════════════════════════════════════════════
 */
const OUT = join(process.cwd(), 'out')

interface Registry {
  slug: string
  rows: { id: string; status: string; route?: string }[]
  rawCount: number
  reconciledCount: number | null
  sourceFixesNoTotal: boolean
  routeResolvedCount: number
}

const REGISTRIES: Registry[] = REGISTRY_DESCRIPTORS.map(
  (d) => JSON.parse(readFileSync(`registries/generated/${d.slug}.json`, 'utf8')) as Registry,
)

/** Raw HTML, because B10 asserts on `href` attributes rather than on prose. */
function indexHtml(slug: string): string {
  return readFileSync(join(OUT, 'coverage', slug, 'index.html'), 'utf8')
}

describe('R4-B09: the figure in the caption is what is listed below', () => {
  it('the population is all fourteen indexes, and the branch under test is occupied', () => {
    expect(REGISTRIES.length).toBe(14)
    const noTotal = REGISTRIES.filter((r) => r.sourceFixesNoTotal)
    // The defect lived on this branch. A fix that emptied it would leave the
    // assertion below running over nothing.
    expect(noTotal.length, 'registries taking the sourceFixesNoTotal branch').toBeGreaterThanOrEqual(9)
    // And the two that disagreed are still in it, so the gate still covers
    // the exact rows the finding named.
    expect(noTotal.map((r) => r.slug)).toContain('notifications')
    expect(noTotal.map((r) => r.slug)).toContain('scheduled-work')
  })

  it('every index prints its own rendered row count in that sentence', () => {
    for (const registry of REGISTRIES) {
      if (!registry.sourceFixesNoTotal) continue
      const text = renderedText(indexHtml(registry.slug))
      expect(text, `/coverage/${registry.slug}/`).toContain(
        `${registry.rows.length} records are listed below`,
      )
    }
  })

  it('the two registries whose rawCount differs from their row count still say both', () => {
    // rawCount is not deleted, only moved to where it is explained. The two
    // numbers differing is a real fact about a transcribed register, and the
    // page states both rather than hiding the smaller one.
    const divergent = REGISTRIES.filter(
      (r) => r.sourceFixesNoTotal && r.rawCount !== r.rows.length,
    )
    expect(divergent.length, 'registries whose two counts differ').toBeGreaterThan(0)
    for (const registry of divergent) {
      const text = renderedText(indexHtml(registry.slug))
      expect(text).toContain(`${registry.rows.length} records are listed below`)
      expect(text).toContain(`from ${registry.rawCount} raw extraction keys`)
    }
  })
})

describe('R4-B10: an index row links to the screen that demonstrates it', () => {
  it('the obligation is verbatim in the committed prompt artefact', () => {
    expect(masterPromptObligation('indexDrillDown')).toContain("drills into the item's card")
    expect(masterPromptObligation('registryIndexes')).toContain('per-item implementation status')
  })

  it('the resolved-route population is non-empty on most indexes and matches the artefact', () => {
    const resolvable = REGISTRIES.filter((r) => r.routeResolvedCount > 0)
    // It was zero on all fourteen. A floor of eight, not of one: a fix that
    // resolved a route on one registry would satisfy `> 0` and leave the
    // finding open.
    expect(resolvable.length, 'indexes with at least one linked row').toBeGreaterThanOrEqual(8)
    for (const registry of REGISTRIES) {
      const withRoute = registry.rows.filter((r) => r.route !== undefined)
      expect(withRoute.length, `${registry.slug}.routeResolvedCount`).toBe(registry.routeResolvedCount)
    }
    const total = REGISTRIES.reduce((n, r) => n + r.routeResolvedCount, 0)
    expect(total, 'linked rows across the fourteen').toBeGreaterThan(250)
  })

  it('every resolved route is a real page in the export — no dead links', () => {
    const routes = new Set(
      REGISTRIES.flatMap((r) => r.rows.map((row) => row.route)).filter(
        (r): r is string => r !== undefined,
      ),
    )
    expect(routes.size, 'distinct linked routes').toBeGreaterThan(20)
    const missing = [...routes].filter((route) => !existsSync(join(OUT, route, 'index.html')))
    expect(missing, 'linked routes with no page in out/').toEqual([])
  })

  it('no resolved route carries a dynamic segment', () => {
    // `app/coverage/[registry]` is one directory standing for fourteen URLs;
    // choosing one of them for a row would be a guess dressed as evidence,
    // and master prompt §4.2 forbids adding a second dynamic segment anyway.
    for (const registry of REGISTRIES) {
      for (const row of registry.rows) {
        if (row.route === undefined) continue
        expect(row.route, `${registry.slug}/${row.id}`).not.toMatch(/[[\]]/)
      }
    }
  })

  it('each index renders an anchor for every row that resolved one', () => {
    for (const registry of REGISTRIES) {
      if (registry.routeResolvedCount === 0) continue
      const html = indexHtml(registry.slug)
      const linkedRows = registry.rows.filter((r) => r.route !== undefined)
      const rendered = linkedRows.filter((r) => html.includes(`href="${r.route}"`))
      expect(rendered.length, `linked rows rendered on /coverage/${registry.slug}/`).toBe(
        linkedRows.length,
      )
    }
  })

  it('each index states how many of its rows link, so an unlinked row is explained', () => {
    for (const registry of REGISTRIES) {
      const text = renderedText(indexHtml(registry.slug))
      expect(text, `/coverage/${registry.slug}/`).toContain(
        `${registry.routeResolvedCount} of ${registry.rows.length} rows link to the screen that demonstrates them`,
      )
    }
  })
})
