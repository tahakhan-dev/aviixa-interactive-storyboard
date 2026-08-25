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

/**
 * THE FLIGHT PAYLOAD IS NOT RENDERED TEXT (R5-B03's measurement warning).
 *
 * The local `readerText` that used to sit here — stripping <script> and
 * <style> before calling `renderedText` — is gone: R5-Q01 moved the strip
 * into the shared helper, where every caller gets it. `renderedText` IS
 * reader text now. See tests/coverage/rendered-text.ts.
 */


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

  /* ──────────────────────────────────────────────────────────────────────
   * R5-A05 — "DOES THIS STRING APPEAR ANYWHERE IN THE FILE" IS NOT "DOES THIS
   * ROW LINK".
   *
   * This asked whether each row's route STRING occurs somewhere in the page.
   * Rows share routes heavily — 110 linked rows over 49 distinct routes on one
   * index — so one surviving anchor answered for every row carrying the same
   * route. Replacing the anchor with plain text on every row whose route
   * another row already carried unlinked 61 of 110, took the anchor count from
   * 111 to 50, and the assertion still reported "110 of 110" and passed.
   *
   * Each anchor is now matched to ITS OWN ROW: the pair of (href, link text)
   * inside the index table's `<tbody>`, compared by equality against the pairs
   * the artefact says should be there. An unlinked row is a missing pair and a
   * row linked that should not be is a surplus one; both are red and both name
   * the row.
   * ────────────────────────────────────────────────────────────────────── */
  const anchorPairs = (slug: string): string[] => {
    const html = indexHtml(slug)
    const tables = [...html.matchAll(/<table\b[^>]*>.*?<\/table>/gs)]
      .map((m) => m[0])
      .filter((t) => {
        const caption = /<caption\b[^>]*>(.*?)<\/caption>/s.exec(t)
        return (
          caption !== null &&
          renderedText(caption[1] ?? '').includes(
            'index, by id, name, join/register, source line and status',
          )
        )
      })
    if (tables.length !== 1) {
      throw new Error(
        `Expected exactly one row table on /coverage/${slug}/; found ${tables.length}. ` +
          'A gate that cannot find its own table asserts nothing.',
      )
    }
    const body = /<tbody\b[^>]*>(.*?)<\/tbody>/s.exec(tables[0] as string)
    if (body === null) throw new Error(`/coverage/${slug}/ row table has no <tbody>.`)
    return [...(body[1] ?? '').matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gs)].map(
      (m) => `${m[1]} ${renderedText(m[2] ?? '').trim()}`,
    )
  }

  it('each index renders an anchor for every row that resolved one, matched row by row', () => {
    for (const registry of REGISTRIES) {
      if (registry.routeResolvedCount === 0) continue
      const linkedRows = registry.rows.filter((r) => r.route !== undefined)
      const expected = linkedRows.map((r) => `${r.route} ${r.id}`).sort()
      // The population, before the comparison: an index whose linked-row set
      // went empty would otherwise agree with a page holding no anchors.
      expect(expected.length, `${registry.slug} linked rows`).toBe(registry.routeResolvedCount)
      expect(anchorPairs(registry.slug).sort(), `anchors on /coverage/${registry.slug}/`).toEqual(
        expected,
      )
    }
  })

  it('the anchor count in the row table equals the linked-row count on every index', () => {
    // The same claim by a second, cruder route, which is what would have
    // caught the plant on its own: 111 anchors became 50 and nothing noticed.
    for (const registry of REGISTRIES) {
      const anchors = registry.routeResolvedCount === 0 ? [] : anchorPairs(registry.slug)
      expect(anchors.length, `anchors in the /coverage/${registry.slug}/ row table`).toBe(
        registry.routeResolvedCount,
      )
    }
  })

  /* ──────────────────────────────────────────────────────────────────────
   * R5-B06 — "WITH THE REASON BESIDE IT", ON ROWS THAT CARRIED NONE.
   *
   * All fourteen indexes promise a routeless row renders "its id as plain text
   * with the reason beside it, never as a link to nowhere". 4,714 rows had no
   * route and not one rendered a reason. The enumeration of reasons was also
   * incomplete: twelve actionable-control rows read demonstrated-in-storyboard
   * with NO route, because their evidence is a control matrix in a `src/`
   * module component and route resolution reads `app/` only, and none of the
   * four reasons the page listed covered that.
   * ────────────────────────────────────────────────────────────────────── */
  it('R5-B06: the fifth reason — src/-only evidence — is named in routeMeaning', () => {
    for (const registry of REGISTRIES) {
      const text = renderedText(indexHtml(registry.slug))
      expect(text, `/coverage/${registry.slug}/`).toContain(
        'when the evidence is a control matrix declared in a module component under src/',
      )
    }
    // The case is occupied, so the sentence is a disclosure rather than a
    // hypothetical: demonstrated rows that resolved no route.
    const orphans = REGISTRIES.flatMap((r) =>
      r.rows.filter((row) => row.status === 'demonstrated-in-storyboard' && row.route === undefined),
    )
    expect(orphans.length, 'demonstrated rows with no resolved route').toBeGreaterThan(0)
  })

  it('R5-B06: every routeless row renders a reason beside its id', () => {
    for (const registry of REGISTRIES) {
      const routeless = registry.rows.filter((r) => r.route === undefined)
      if (routeless.length === 0) continue
      const text = renderedText(indexHtml(registry.slug))
      // One reason per status the routeless population actually holds,
      // derived from the rows rather than from a list, so a status that
      // stops being rendered is red.
      const held = new Set(routeless.map((r) => r.status))
      expect(held.size, `${registry.slug} routeless statuses`).toBeGreaterThan(0)
      for (const status of held) {
        const phrase =
          status === 'mounted-in-another-screen'
            ? 'Mounted inside another module’s screen and owns no route of its own'
            : status === 'demonstrated-in-storyboard'
              ? 'Demonstrated by a module component under src/'
              : status === 'not-represented'
                ? 'No shipped route demonstrates this row'
                : 'Recorded as an authored'
        expect(text, `/coverage/${registry.slug}/ reason for ${status}`).toContain(phrase)
      }
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

/* ═════════════════════════════════════════════════════════════════════════
 * R6-B02 — THE COVERAGE DASHBOARD'S CLAIM ABOUT ITS OWN CLASSIFICATION
 * COVERAGE, HELD BY EQUALITY IN BOTH DIRECTIONS.
 *
 * `/coverage/` rendered "No other registry has been classified against the
 * source yet." Measured over the generated files at round 6: modules 81 of 81
 * AND notifications 56 of 286 carry a `sourceClass` — 137 rows the generator
 * itself wrote. The sentence was false about a whole registry, on the page
 * whose entire subject is what this build can honestly claim, and the
 * paragraph two blocks below it carried a comment celebrating the removal of
 * exactly this shape of stale prose.
 *
 * The page derives the set now. This gate is what stops the derivation being
 * quietly narrowed back to a literal: the set of registries the page NAMES as
 * carrying a classification is compared BY EQUALITY against the set measured
 * from the generated rows, and the per-registry figures are checked in the
 * rendered text with the flight payload stripped. A subset assertion here
 * would pass on the sentence that was wrong.
 *
 * SUBJECT AND ORDERING: `out/coverage/index.html` (written by `build`)
 * against `registries/generated/**` (also written by `build`, one step
 * earlier, and the page's INPUT rather than its output).
 * ═════════════════════════════════════════════════════════════════════════ */
describe('R6-B02: source-classification coverage is measured, not asserted', () => {
  interface ClassifiedRegistry {
    readonly slug: string
    readonly title: string
    readonly classified: number
    readonly total: number
  }

  const MEASURED: readonly ClassifiedRegistry[] = REGISTRY_DESCRIPTORS.map((d, i) => {
    const registry = REGISTRIES[i]
    if (registry === undefined) throw new Error(`no generated registry for ${d.slug}`)
    return {
      slug: d.slug,
      title: d.title,
      classified: (registry.rows as { sourceClass?: string }[]).filter(
        (r) => r.sourceClass !== undefined,
      ).length,
      total: registry.rows.length,
    }
  }).filter((r) => r.classified > 0)

  const dashboard = (): string => renderedText(readFileSync(join(OUT, 'coverage', 'index.html'), 'utf8'))

  // FAILS IF: no registry carries a classification at all, which would make
  // every assertion below pass by having nothing to compare. This is the
  // R3-shaped emptied-population check, not decoration: a generator change
  // that stopped writing `sourceClass` would otherwise turn this whole block
  // green and silent.
  it('has a classified population to measure', () => {
    expect(MEASURED.length).toBeGreaterThan(0)
    expect(MEASURED.reduce((n, r) => n + r.classified, 0)).toBeGreaterThan(0)
  })

  // FAILS IF: the page names a different set of classified registries from
  // the one the data holds, in EITHER direction — a registry that gained a
  // classification and is not named, or one named that no longer carries one.
  //
  // Planted: `CLASSIFICATION_COVERAGE` in `app/coverage/page.tsx` filtered to
  // `slug === 'modules'`, restoring the false claim in derived clothing, then
  // `pnpm build`. Went red naming notifications. Restored, rebuilt, green,
  // and the restored file checksummed against the pre-plant bytes.
  it('names exactly the registries that carry a source classification, with their figures', () => {
    const text = dashboard()
    const named = MEASURED.filter((r) =>
      text.includes(`${r.title.toLowerCase()} ${r.classified} of ${r.total}`),
    )
    expect(named.map((r) => r.slug)).toEqual(MEASURED.map((r) => r.slug))

    const unclassified = REGISTRY_DESCRIPTORS.filter(
      (d) => !MEASURED.some((m) => m.slug === d.slug),
    )
    expect(
      text,
      'the dashboard must state how many inventories carry no classification',
    ).toContain(`The remaining ${unclassified.length} carry none`)
    expect(text).toContain(
      `${MEASURED.length} of the ${REGISTRY_DESCRIPTORS.length} inventories carry a source classification`,
    )
  })

  // FAILS IF: the sentence this finding is about comes back in any form.
  // A derived sentence can still be replaced by a literal by the next author,
  // and the literal that was here is the one worth naming.
  it('no longer claims that no other registry has been classified', () => {
    expect(dashboard()).not.toContain('No other registry has been classified against the source')
  })
})
