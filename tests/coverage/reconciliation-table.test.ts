import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { REGISTRY_DESCRIPTORS, COVERAGE_STATUSES } from '../../src/coverage/descriptors'
import { loadReconciliation } from '../../src/registry/load'
import { masterPromptObligation } from './master-prompt'
import { renderedText } from './rendered-text'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * R4-B01, R4-B02, R4-B11, R4-B12 — THE §9.6 RECONCILIATION TABLE, AND THE
 * TWO DENOMINATORS BESIDE IT.
 *
 * Master prompt §9.6 requires one reconciliation table — candidate, extracted
 * count, count scope, deduplication rule, delta, resolution — published in
 * the coverage dashboard and the review package. The artefact held thirteen
 * well-formed rows with all six columns and reached NO reader:
 * `grep -rl "prompt_candidate" --include='*.html' out/` returned zero files,
 * and `app/coverage/page.tsx` did not import it. Its only consumer was the
 * Workflow Index, reading one scalar for a sentence.
 *
 * WHY EQUALITY AND NOT CONTAINMENT (R4-B02). Five of the client's fourteen
 * named inventories — functions, actionable controls, business use cases,
 * features, sub-features, together 3,010 of the build's 5,018 census rows —
 * had no row at all, and a table headed "reconciliation" reads as complete.
 * A containment check ("every row names a real registry") passes on a table
 * missing five of them. This gate compares the SET of non-null
 * `registry_slug` values against `REGISTRY_DESCRIPTORS` by equality, in both
 * directions, so a fifteenth registry and a dropped row both go red.
 *
 * POPULATION, NOT ONLY OFFENDERS. Round 3's shape was a correct fix that
 * emptied a gate's population to zero — 20 ids named, 0 matched, no
 * assertion run, suite green. Every population below is asserted non-empty
 * and at its measured size before anything is checked against it.
 *
 * SUBJECT AND ORDERING: this gate reads `out/coverage/index.html`, which
 * `build` writes, against `registries/generated/source-reconciliation.json`
 * and `src/coverage/descriptors.ts`. Both of those are inputs to the page
 * rather than products of it, so the build cannot satisfy the gate by
 * rewriting what the gate compares against. See the entry in
 * `scripts/check-gate-ordering.mjs`.
 * ═══════════════════════════════════════════════════════════════════════
 */
const OUT = join(process.cwd(), 'out')

const DASHBOARD = renderedText(readFileSync(join(OUT, 'coverage', 'index.html'), 'utf8'))

const REPORT = loadReconciliation(
  JSON.parse(readFileSync('registries/generated/source-reconciliation.json', 'utf8')),
)
const ROWS = REPORT.reconciliation.reconciliation_rows

/** The six column names master prompt §9.6 itself uses, in its own words. */
const SIX_COLUMNS = [
  'Candidate',
  'Extracted count',
  'Count scope',
  'Deduplication rule',
  'Delta',
  'Resolution',
] as const

describe('the master prompt §9.6 reconciliation table reaches a reader', () => {
  it('the obligation this gate enforces is verbatim in the committed prompt artefact', () => {
    const sentence = masterPromptObligation('reconciliationTable')
    // Not a tautology: `masterPromptObligation` throws when the artefact does
    // not contain the sentence, and this asserts the two halves the gate
    // below actually acts on -- the six column names and the two places.
    expect(sentence).toContain('coverage dashboard')
    expect(sentence).toContain('review package')
    for (const column of ['candidate', 'extracted count', 'count scope', 'deduplication rule', 'delta', 'resolution']) {
      expect(sentence, `master prompt §9.6 names the ${column} column`).toContain(column)
    }
  })

  it('the population is the whole authored table, not a sample of it', () => {
    expect(ROWS.length, 'reconciliation_rows').toBeGreaterThanOrEqual(18)
    // Every row is well formed on all six columns plus the slug. A row with
    // an empty column would render as a blank cell and read as "nothing to
    // reconcile" rather than as a missing analysis.
    for (const row of ROWS) {
      // Every one of the six is present and non-empty. `delta` is held to
      // that and no more, deliberately: "0" is the right answer for a
      // candidate that matches, and a minimum length would push an author
      // into padding it.
      for (const field of ['prompt_candidate', 'extracted_count', 'count_scope', 'dedup_rule', 'delta', 'resolution'] as const) {
        expect(row[field].trim().length, `${row.inventory}.${field} is present`).toBeGreaterThan(0)
      }
      for (const field of ['extracted_count', 'count_scope', 'dedup_rule', 'resolution'] as const) {
        expect(row[field].trim().length, `${row.inventory}.${field} is an analysis`).toBeGreaterThan(20)
      }
    }
  })

  it('every one of the fourteen registries has a reconciliation row — by EQUALITY', () => {
    const slugged = ROWS.map((r) => r.registry_slug).filter((s): s is string => s !== null)
    const descriptors = REGISTRY_DESCRIPTORS.map((d) => d.slug)
    expect(descriptors.length, 'REGISTRY_DESCRIPTORS').toBe(14)
    expect(new Set(slugged).size, 'no registry is reconciled twice').toBe(slugged.length)
    expect([...slugged].sort()).toEqual([...descriptors].sort())
  })

  it('a row that reconciles none of the fourteen says why', () => {
    const unslugged = ROWS.filter((r) => r.registry_slug === null)
    expect(unslugged.length, 'rows outside the fourteen').toBeGreaterThan(0)
    for (const row of unslugged) {
      expect(row.whyNoRegistrySlug, `${row.inventory}`).toBeTypeOf('string')
    }
  })

  it('the dashboard renders all six §9.6 column names', () => {
    for (const column of SIX_COLUMNS) {
      expect(DASHBOARD, `column "${column}" on /coverage/`).toContain(column)
    }
  })

  it('the dashboard renders every reconciliation row — count by EQUALITY', () => {
    // Counted off the `inventory` cell of each row rather than off `<tr`,
    // which the page's other five tables also emit. Each inventory name is
    // unique in the artefact, so one occurrence per row in the table body.
    const rendered = ROWS.filter((r) => DASHBOARD.includes(r.inventory))
    expect(rendered.length, 'reconciliation rows rendered on /coverage/').toBe(ROWS.length)
    // And the page states the row count it rendered, so a silently truncated
    // table is caught by the number as well as by the names.
    expect(DASHBOARD).toContain(`${ROWS.length} rows, covering all 14 registries`)
  })

  it('a distinctive cell of a row that used to be missing renders verbatim', () => {
    // R4-B02's five. Their `delta` text is unique in the tree, so a table
    // rendering only headers cannot pass this.
    const five = ['Features', 'Sub-features', 'Functions', 'Business use cases', 'Actionable controls']
    for (const inventory of five) {
      const row = ROWS.find((r) => r.inventory === inventory)
      expect(row, `${inventory} reconciliation row`).toBeDefined()
      expect(DASHBOARD, `${inventory} delta cell`).toContain(row!.delta.slice(0, 40))
    }
  })
})

describe('the dashboard publishes the item-level position beside the registry-level one', () => {
  /**
   * R4-B11. "Demonstrated in storyboard: 11 of 14" reads as about 79 per cent
   * to a client; the item-level figure is a small fraction of that, and
   * `grep -c` for 5018, 4706 and 302 in the built page returned zero for each.
   */
  const registries = REGISTRY_DESCRIPTORS.map((d) =>
    JSON.parse(readFileSync(`registries/generated/${d.slug}.json`, 'utf8')) as {
      rows: { status: string }[]
    },
  )
  const allRows = registries.flatMap((r) => r.rows)
  const byStatus = Object.fromEntries(
    COVERAGE_STATUSES.map((s) => [s, allRows.filter((r) => r.status === s).length]),
  )

  it('the item population is the whole census, not one registry', () => {
    expect(registries.length).toBe(14)
    expect(allRows.length, 'total census rows').toBeGreaterThanOrEqual(5000)
    expect(
      Object.values(byStatus).reduce((a, b) => a + b, 0),
      'every row falls in exactly one of the five statuses',
    ).toBe(allRows.length)
  })

  it('the total and every per-status item figure appear on /coverage/', () => {
    expect(DASHBOARD, `total ${allRows.length}`).toContain(String(allRows.length))
    for (const status of COVERAGE_STATUSES) {
      const n = byStatus[status] as number
      expect(
        DASHBOARD,
        `item-level count for ${status} (${n}) is published`,
      ).toContain(`${n} of ${allRows.length} items`)
    }
  })

  it('the not-represented figure is published rather than buried', () => {
    // The number this section exists to stop anyone rounding away. It is
    // large and it is the honest position; if it ever becomes small, it must
    // be because rows moved, not because the sentence did.
    const notRepresented = byStatus['not-represented'] as number
    expect(notRepresented).toBeGreaterThan(0)
    expect(DASHBOARD).toContain(`${notRepresented} are not represented`)
  })
})

describe('R4-B12: the statuses no registry can hold are named on the page', () => {
  it('decision-blocked and not-applicable are declared unassignable at registry level', () => {
    expect(DASHBOARD).toContain('Two of the five statuses never appear in the registry column')
    expect(DASHBOARD).toContain('Decision blocked')
    expect(DASHBOARD).toContain('Not applicable')
  })

  it('mounted-in-another-screen is now reachable, and reached', () => {
    // It was unreachable: `registryStatus` returned demonstrated for any row
    // that was not not-represented. Ten rows carry the status, so a registry
    // whose only evidence is a mounted module must be able to report it.
    const modules = JSON.parse(readFileSync('registries/generated/modules.json', 'utf8')) as {
      rows: { status: string }[]
    }
    const mounted = modules.rows.filter((r) => r.status === 'mounted-in-another-screen')
    expect(mounted.length, 'mounted module rows').toBeGreaterThan(0)
    expect(DASHBOARD).toContain('Mounted in another module')
  })
})
