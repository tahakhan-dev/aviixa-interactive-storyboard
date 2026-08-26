import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { REGISTRY_DESCRIPTORS, COVERAGE_STATUSES } from '../../src/coverage/descriptors'
import { loadReconciliation } from '../../src/registry/load'
import { masterPromptObligation } from './master-prompt'
import { renderedText } from './rendered-text'
import { isForeignProbe } from '../probe-paths'
import {
  AC_CITED_IN_PRODUCT_NOT_IN_TESTS,
  CONTRADICTIONS_DISCLOSED_ELSEWHERE,
  KNOWN_LIMITATIONS,
  contradictionIdentifier,
  contradictionsDisclosedNowhereElse,
} from '../../src/coverage/disclosure-gaps'

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
 * features, sub-features, together MORE THAN HALF the census (R7-A5: this
 * read "3,010 of the build's 5,018" and both figures were stale; the share is
 * `R4_B02_FIVE_ROWS` of `CENSUS_ROWS` below, derived from the fourteen
 * generated registries this file already opens, and printed by the assertion
 * that uses it rather than transcribed into this comment) —
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

/**
 * THE FLIGHT PAYLOAD IS NOT RENDERED TEXT (R5-B03's measurement warning).
 *
 * The local `readerText` that used to sit here — stripping <script> and
 * <style> before calling `renderedText` — is gone: R5-Q01 moved the strip
 * into the shared helper, where every caller gets it. `renderedText` IS
 * reader text now. See tests/coverage/rendered-text.ts.
 */


const DASHBOARD = renderedText(readFileSync(join(OUT, 'coverage', 'index.html'), 'utf8'))

const REPORT = loadReconciliation(
  JSON.parse(readFileSync('registries/generated/source-reconciliation.json', 'utf8')),
)
const ROWS = REPORT.reconciliation.reconciliation_rows

/**
 * The fourteen generated registries, read once. Three describe blocks below
 * opened the same fourteen files each; they share this now.
 */
const REGISTRY_ROWS: Record<string, { status: string }[]> = Object.fromEntries(
  REGISTRY_DESCRIPTORS.map((d) => [
    d.slug,
    (JSON.parse(readFileSync(`registries/generated/${d.slug}.json`, 'utf8')) as {
      rows: { status: string }[]
    }).rows,
  ]),
)

/** The whole census, derived. Never a literal — R7-A5. */
const CENSUS_ROWS = Object.values(REGISTRY_ROWS).reduce((a, rows) => a + rows.length, 0)

/** R4-B02's five: the inventories the reconciliation table had no row for. */
const R4_B02_FIVE = [
  'functions',
  'actionable-controls',
  'business-use-cases',
  'features',
  'sub-features',
] as const
const R4_B02_FIVE_ROWS = R4_B02_FIVE.reduce((a, slug) => a + (REGISTRY_ROWS[slug]?.length ?? 0), 0)

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

  /**
   * R7-A5 — THE REASON EQUALITY IS THE RIGHT CONTROL, MEASURED RATHER THAN
   * TRANSCRIBED. A containment check passes on a table missing R4-B02's five,
   * and those five are not a fifth of the census: they are the larger half of
   * it, so a table missing them reads complete while being mostly incomplete.
   * Both figures are derived and both are in the failure message, which is why
   * neither can go stale the way the two literals in this file's header did.
   */
  it("R4-B02's five carry more than half the census — the derivation, not a literal", () => {
    expect(Object.keys(REGISTRY_ROWS).length, 'registries read').toBe(14)
    expect(CENSUS_ROWS, 'the whole census').toBeGreaterThanOrEqual(5000)
    for (const slug of R4_B02_FIVE) {
      expect(REGISTRY_ROWS[slug], `${slug} is one of the fourteen`).toBeDefined()
      expect(REGISTRY_ROWS[slug]!.length, `${slug} rows`).toBeGreaterThan(0)
    }
    expect(
      R4_B02_FIVE_ROWS * 2,
      `R4-B02's five hold ${R4_B02_FIVE_ROWS} of the census's ${CENSUS_ROWS} rows. If this ever `
        + 'falls below half, the argument in this file\'s header for equality-over-containment '
        + 'has to be re-made rather than inherited.',
    ).toBeGreaterThan(CENSUS_ROWS)
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

  /* ──────────────────────────────────────────────────────────────────────
   * R5-A04 — THE SUBSTRING THAT WAS NEVER ABOUT THIS TABLE.
   *
   * This check read `DASHBOARD.includes(r.inventory)` and reasoned, in its own
   * comment, that "each inventory name is unique in the artefact, so one
   * occurrence per row in the table body". Unique in the artefact and NOT on
   * the page: every inventory name is also a REGISTRY name in the fourteen-row
   * table above, so each occurs two or four times. Deleting the Events row
   * from the reconciliation body — 1,869 bytes, 1,409 characters of rendered
   * text — left every assertion passing and the page still reading "18 rows,
   * covering all 14 registries". Thirteen of the eighteen were droppable that
   * way.
   *
   * It is the reconciliation table's OWN `<tbody>` now, found by its own
   * caption, counted by equality and matched row by row in order. Transcribed
   * rather than shared with the sibling gate that does the same thing, for the
   * same reason every scan in this directory is transcribed.
   * ────────────────────────────────────────────────────────────────────── */
  const reconciliationBody = (): string[] => {
    const html = readFileSync(join(OUT, 'coverage', 'index.html'), 'utf8')
    const tables = [...html.matchAll(/<table\b[^>]*>.*?<\/table>/gs)]
      .map((m) => m[0])
      .filter((t) => {
        const caption = /<caption\b[^>]*>(.*?)<\/caption>/s.exec(t)
        return (
          caption !== null &&
          renderedText(caption[1] ?? '').includes(
            'reconciliation rows, each with the master prompt candidate',
          )
        )
      })
    if (tables.length !== 1) {
      throw new Error(
        `Expected exactly one reconciliation table on /coverage/; found ${tables.length}. ` +
          'A gate that cannot find its own table asserts nothing.',
      )
    }
    const body = /<tbody\b[^>]*>(.*?)<\/tbody>/s.exec(tables[0] as string)
    if (body === null) throw new Error('The reconciliation table has no <tbody>.')
    return [...(body[1] ?? '').matchAll(/<tr\b[^>]*>(.*?)<\/tr>/gs)].map((m) => {
      const cell = /<t[dh]\b[^>]*>(.*?)<\/t[dh]>/s.exec(m[1] ?? '')
      return renderedText(cell?.[1] ?? '').trim()
    })
  }

  it('the dashboard renders every reconciliation row — count by EQUALITY, inside the table', () => {
    const inventories = reconciliationBody()
    expect(ROWS.length, 'the authored population').toBeGreaterThanOrEqual(18)
    expect(inventories.length, '<tr> elements in the reconciliation tbody').toBe(ROWS.length)
    // Row by row and in order, so a deleted row, a duplicated one and a
    // reordered one are each red and each say which.
    inventories.forEach((cell, i) => {
      expect(cell, `reconciliation row ${i}`).toContain(ROWS[i]!.inventory)
    })
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
  const registries = REGISTRY_DESCRIPTORS.map((d) => ({ rows: REGISTRY_ROWS[d.slug]! }))
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

describe('R4-B12 / R5-B05: the statuses no registry holds are named on the page — all of them', () => {
  /**
   * R4-B12 named THREE statuses that never appear in the registry column and
   * the fix explained two, so the page read "Two of the five statuses" three
   * inches below a legend showing three at 0 of 14. The count is now the
   * derived list's own length.
   *
   * WHICH statuses are unheld is recomputed here from the same fourteen
   * registries the page reads, so this gate does not transcribe the answer
   * — it transcribes the RULE (`registryStatus`'s precedence) and derives.
   */
  const registries = REGISTRY_DESCRIPTORS.map((d) => ({ rows: REGISTRY_ROWS[d.slug]! }))
  const PRECEDENCE =['demonstrated-in-storyboard', 'mounted-in-another-screen', 'not-represented']
  const registryStatuses = registries.map((r) => {
    const held = new Set(r.rows.map((row) => row.status))
    return PRECEDENCE.find((s) => held.has(s)) ?? 'not-represented'
  })
  const unheld = COVERAGE_STATUSES.filter((s) => !registryStatuses.includes(s))

  it('the count in the sentence equals the number of statuses no registry holds', () => {
    expect(registries.length).toBe(14)
    expect(unheld.length, 'statuses at 0 of 14').toBeGreaterThan(0)
    expect(DASHBOARD).toContain(
      `${unheld.length} of the ${COVERAGE_STATUSES.length} statuses never appear in the registry column above`,
    )
  })

  it('every unheld status is named with a reason — none is left for a reader to account for', () => {
    // Named by their rendered LABEL, which is what a reader sees.
    const LABELS: Record<string, string> = {
      'decision-blocked': 'Decision blocked',
      'not-applicable': 'Not applicable',
      'mounted-in-another-screen': 'Mounted in another module',
      'demonstrated-in-storyboard': 'Demonstrated in storyboard',
      'not-represented': 'Not represented',
    }
    for (const status of unheld) {
      expect(DASHBOARD, `${status} named in the unassignable paragraph`).toContain(LABELS[status]!)
    }
    // The third one R4-B12's fix missed, asserted by name so a regression to
    // "two of the five" cannot pass by dropping it again.
    expect(unheld, 'mounted-in-another-screen is unheld at registry level').toContain(
      'mounted-in-another-screen',
    )
    expect(DASHBOARD).toContain('Reachable in the rule and unreachable in this data')
    // No unheld status may be left without a written reason.
    expect(DASHBOARD).not.toContain('no reason has been written for this one yet')
  })

  it('mounted-in-another-screen is held at ITEM level, which is why it is in the legend at all', () => {
    const modules = JSON.parse(readFileSync('registries/generated/modules.json', 'utf8')) as {
      rows: { status: string }[]
    }
    const mounted = modules.rows.filter((r) => r.status === 'mounted-in-another-screen')
    expect(mounted.length, 'mounted module rows').toBeGreaterThan(0)
    expect(DASHBOARD).toContain('Mounted in another module')
  })
})

describe('R5-B02: the row that settles the 81/81 conflation states a method that reproduces', () => {
  /**
   * Clause (a) of the Workflows row read: "The source states NO workflow count
   * anywhere — grep for any numeral-plus-'workflows' phrase returns nothing."
   * It returns twelve, and the row's own clause (c) cites one of them ("8
   * critical workflows"). The CONCLUSION was sound and reproduces
   * independently; only the stated method was false, and a reader who runs the
   * grep the row names stops trusting a conclusion that is correct.
   *
   * The non-conflation gate elsewhere in this suite does not read this clause,
   * which is why a false method survived inside the one row master prompt §9.6
   * singles out. This one reads it, and it re-derives BOTH halves against the
   * frozen source rather than transcribing the answer.
   */
  const SOURCE = readFileSync('../AVIIXA_Production_Product_Blueprint.md', 'utf8')
  const WORKFLOWS_ROW = ROWS.find((r) => r.registry_slug === 'workflows')!

  it('no numeral is attached to a TOTAL of the WF-* namespace', () => {
    expect((SOURCE.match(/eighty-one workflows/gi) ?? []).length).toBe(0)
    expect((SOURCE.match(/\b81 workflows/gi) ?? []).length).toBe(0)
  })

  it('numeral-plus-workflows phrases DO occur, and the row says so with their lines', () => {
    const lines = SOURCE.split('\n')
    const NUMERAL_WORKFLOWS =
      /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d+)[- ](critical )?workflows\b/i
    const hits = lines
      .map((line, i) => (NUMERAL_WORKFLOWS.test(line) ? i + 1 : 0))
      .filter((n) => n > 0)
    // The population, asserted before it is used: the old clause claimed this
    // set is empty, so a gate that let it be empty would restate the defect.
    expect(hits.length, 'numeral-plus-workflows phrases in the frozen source').toBeGreaterThan(0)
    expect(WORKFLOWS_ROW.count_scope).not.toContain('returns nothing')
    for (const line of hits) {
      expect(WORKFLOWS_ROW.count_scope, `line ${line} is named in clause (a)`).toContain(String(line))
    }
  })

  it('the corrected clause is on the dashboard, where the row renders', () => {
    expect(DASHBOARD).toContain('The source attaches NO numeral to a TOTAL of the WF-* namespace')
  })
})

describe('R5-B09: the sentence about rows outside the fourteen is a sentence, and true', () => {
  it('it has a verb and does not claim those rows render nowhere', () => {
    const unslugged = ROWS.filter((r) => r.registry_slug === null)
    expect(unslugged.length, 'rows with no registry slug').toBeGreaterThan(0)
    expect(DASHBOARD).toContain(
      `${unslugged.length} further rows carry no registry slug of their own`,
    )
    expect(DASHBOARD).toContain('or its rows render inside another index as a sub-register')
    // The truncated original, gone.
    expect(DASHBOARD).not.toContain('reconcile counts that none of the fourteen indexes,')
  })

  it('the row it was wrong about still says its 22 rows render, and they do', () => {
    const dnc = ROWS.find((r) => r.inventory === 'Do-not-use-cron controls')!
    expect(dnc.registry_slug).toBeNull()
    expect(dnc.whyNoRegistrySlug).toContain('/coverage/actionable-controls/')
    const controls = JSON.parse(
      readFileSync('registries/generated/actionable-controls.json', 'utf8'),
    ) as { rows: { id: string }[] }
    const dncRows = controls.rows.filter((r) => /^DNC-\d\d$/.test(r.id))
    expect(dncRows.length, 'DNC rows on the actionable-controls index').toBe(22)
    const page = renderedText(
      readFileSync(join(OUT, 'coverage', 'actionable-controls', 'index.html'), 'utf8'),
    )
    for (const row of dncRows) expect(page, `${row.id} renders`).toContain(row.id)
  })
})

describe('R5-B01: the registry table never tells a reader the source is silent where it is not', () => {
  /**
   * `out/coverage/index.html` rendered "Commands — No single closed count in
   * the frozen source — Not represented". The source fixes the count in ten
   * places, Appendix L publishes it, and row 6 of the reconciliation table on
   * the same page and three columns to the right reads "5, closed", delta 0,
   * CONFIRMED. One generic sentence stood for ten different situations and was
   * false of one of them.
   *
   * The cell now renders the descriptor's own `sourceNote`, which is a
   * statement about the DESCRIPTOR — "5 classes, 16 instances and 57
   * identifiers are three registers and this descriptor asserts no count
   * across them" — rather than about the document.
   */
  const NULL_COUNT = REGISTRY_DESCRIPTORS.filter((d) => d.expectedCount === null)

  it('the population is occupied and the generic sentence is gone from the page', () => {
    expect(NULL_COUNT.length, 'registries with no closed source count').toBeGreaterThan(5)
    expect(DASHBOARD).not.toContain('No single closed count in the frozen source')
  })

  it('every null-count registry renders its own source note in that cell', () => {
    for (const d of NULL_COUNT) {
      // A distinctive opening slice, so this cannot be satisfied by the note
      // appearing somewhere else in a different wording.
      expect(DASHBOARD, `${d.slug} source note on /coverage/`).toContain(d.sourceNote.slice(0, 60))
    }
  })

  it('the row the source refutes now says what the source actually fixes', () => {
    const commands = REGISTRY_DESCRIPTORS.find((d) => d.slug === 'commands')!
    expect(commands.expectedCount).toBeNull()
    expect(commands.sourceNote).toContain('The source fixes 5 command classes')
    expect(DASHBOARD).toContain('The source fixes 5 command classes')
    // And the reconciliation row that contradicted it is still there, so the
    // two statements are now consistent rather than one having been deleted.
    const row = ROWS.find((r) => r.registry_slug === 'commands')!
    expect(row.extracted_count).toContain('5')
    expect(row.delta).toContain('0')
  })
})

describe('R5-B07 / R5-B08: every locator the reconciliation table cites is a real, non-blank line', () => {
  /**
   * Row 15 cited Appendix L's preamble at a line that is EMPTY — the
   * quotation is one line further down — and row 13 cited the
   * acceptance-criteria row for the definition of "Assembled", which is five
   * lines further down. Two more `L`-prefixed numbers in the same file pointed
   * at the blank line after Appendix L's last table row.
   *
   * NONE of them was reachable by `tests/coverage/locator-fidelity.test.ts`
   * when they shipped: its `SCAN_ROOTS` were `src`, `app`, `tests`, `scripts`
   * and `docs`, and `registries/` was not among them, so the one authored
   * artefact in this build dense with frozen-source locators — and that
   * renders every one of them on the coverage dashboard — sat outside the gate
   * written to police exactly this.
   *
   * THAT GAP IS CLOSED (R5-Q02). `locator-fidelity` now scans `registries/`,
   * excluding `registries/raw/**` and the committed identifier index, and it
   * asserts the surviving file list by name. IT DID NOT REPLACE THIS BLOCK,
   * and the reason is the width of the net rather than territory:
   *
   *   - its lexer reads `L\d{3,6}`; this reads `L\d{1,6}`, so a two-digit
   *     locator in this artefact is caught here and nowhere else;
   *   - it exempts a locator marked as quoted-in-order-to-correct; this
   *     artefact is not a correction record and gets no exemption here;
   *   - it grades a FILE. The first three cases below grade the eighteen
   *     RENDERED rows, field by field, and name the row and the field —
   *     which is what a reader meets, and what R5-B07 and R5-B08 were.
   *
   * The fourth case is the whole-file one and is the true duplicate of the
   * shared gate. It stays as the narrower-regex half of the pair; if it ever
   * disagrees with `locator-fidelity`, the disagreement is the finding.
   */
  const SOURCE_LINES = readFileSync('../AVIIXA_Production_Product_Blueprint.md', 'utf8').split('\n')

  const citations = ROWS.flatMap((row) =>
    (['prompt_candidate', 'extracted_count', 'count_scope', 'dedup_rule', 'delta', 'resolution'] as const).flatMap(
      (field) =>
        [...row[field].matchAll(/\bL(\d{1,6})\b/g)].map((m) => ({
          where: `${row.inventory}.${field}`,
          line: Number(m[1]),
        })),
    ),
  )

  it('the population is the whole cited set, and it is large', () => {
    expect(citations.length, 'L-prefixed locators in the eighteen rows').toBeGreaterThan(80)
    expect(new Set(citations.map((c) => c.line)).size, 'distinct lines cited').toBeGreaterThan(50)
  })

  it('no citation is out of range', () => {
    const out = citations.filter((c) => c.line < 1 || c.line > SOURCE_LINES.length)
    expect(out.map((c) => `${c.where} L${c.line}`)).toEqual([])
  })

  it('no citation names a blank line', () => {
    const blank = citations.filter((c) => (SOURCE_LINES[c.line - 1] ?? '').trim() === '')
    expect(blank.map((c) => `${c.where} L${c.line}`), 'blank-line citations').toEqual([])
  })

  it('and the same holds for every locator in the artefact, not only the rendered rows', () => {
    // The eighteen rows are what a reader sees; the file also carries risk and
    // implementation-note arrays, and two of ITS blank-line citations were
    // found only by reading the whole file. Same rule, wider population.
    const whole = readFileSync('registries/generated/source-reconciliation.json', 'utf8')
    const all = [...whole.matchAll(/\bL(\d{1,6})\b/g)].map((m) => Number(m[1]))
    expect(all.length, 'L-prefixed locators in the whole artefact').toBeGreaterThan(citations.length)
    const bad = all.filter(
      (n) => n < 1 || n > SOURCE_LINES.length || (SOURCE_LINES[n - 1] ?? '').trim() === '',
    )
    expect([...new Set(bad)].map((n) => `L${n}`), 'blank or out-of-range locators').toEqual([])
  })

  it('the two corrected locators carry the words the row quotes', () => {
    // Opened and read before the correction was written, which is why both
    // are asserted against the words rather than against a number.
    expect(SOURCE_LINES[119293 - 1]).toContain('where the recount disagrees with this table, the recount wins')
    expect(SOURCE_LINES[119339 - 1]).toContain(
      'a count of what this blueprint publishes, not a claim that the Statement of Work fixes that number',
    )
    /*
      THE WRONG LOCATORS ARE BUILT FROM PARTS, NEVER SPELLED.

      An `L`-prefixed number is a citation to `locator-fidelity` WHEREVER it
      appears, including inside a negative assertion about it — this build's
      controller wrote a blank-line locator into prose while correcting that
      same blank-line locator and was convicted twice for it. So each suspect
      is an `id`/`line` pair and the string is assembled at the point of use.
    */
    const SUPERSEDED = [
      { id: 'functions.resolution', line: 119292, why: 'blank separator above the preamble' },
      { id: 'features.count_scope', line: 119334, why: 'the acceptance-criteria row, not the definition' },
    ] as const
    for (const s of SUPERSEDED) {
      expect((SOURCE_LINES[s.line - 1] ?? '').trim(), `${s.id}: ${s.why}`).not.toContain(
        'where the recount disagrees',
      )
    }
    const functions = ROWS.find((r) => r.registry_slug === 'functions')!
    expect(functions.resolution).toContain('L119293')
    expect(functions.resolution).not.toContain(`L${SUPERSEDED[0].line}`)
    const features = ROWS.find((r) => r.registry_slug === 'features')!
    expect(features.count_scope).toContain('L119339')
    expect(features.count_scope).not.toContain(`L${SUPERSEDED[1].line}`)
  })

  it('R5-B10: the eight registers that must never be summed are eight, and each is located', () => {
    const roles = ROWS.find((r) => r.inventory === 'Human security role types')!
    const registers = [...roles.resolution.matchAll(/Register (\d), (L(\d+))/g)].map((m) => ({
      n: Number(m[1]),
      line: Number(m[3]),
    }))
    expect(registers.map((r) => r.n), 'all eight registers named').toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    for (const r of registers) {
      expect(SOURCE_LINES[r.line - 1], `Register ${r.n} at L${r.line}`).toContain(`**Register ${r.n} —`)
    }
    expect(DASHBOARD).toContain('this sentence used to name seven of them')
  })
})

/* ═════════════════════════════════════════════════════════════════════════
 * R6-B03 item 1 — THE 66 SOURCE INVARIANTS, AND WHERE EACH ONE IS CITED.
 *
 * `source-reconciliation.json` carries five registers beyond the
 * reconciliation rows — 66 invariants, 32 closed action sets, 42 state
 * vocabularies, 45 residual contradictions, 25 implementation risks, 210
 * records in all. Exactly one thing in the tree read any of them: the zod
 * schema in `@/registry/schemas`, which validates their shape and asks
 * nothing about their content. Verbatim presence in the payload-stripped
 * export: 2 of the 66 invariants, 0 of the other 144.
 *
 * Master prompt §29.1's bullet that no source rule is weakened by role,
 * feature control, offline, artificial intelligence, notification, schedule,
 * fallback or failure is the bullet these 66 exist to answer, and NOTHING IN
 * THE TREE FAILED IF A RULE STOPPED BEING HONOURED.
 *
 * ── WHAT THIS GATE ASSERTS, AND WHAT IT DELIBERATELY DOES NOT ────────────
 * It asserts that each invariant's own source line is cited somewhere under
 * `src/` or `app/`, OR appears in `INVARIANT_CITATION_EXEMPT` — compared BY
 * EQUALITY, so the exemption list cannot quietly grow and cannot quietly
 * shrink either. Measured when it landed: 15 of 66 cited, 51 exempt.
 *
 * IT DOES NOT ASSERT THAT A RULE IS HONOURED. No gate can: "no artificial-
 * intelligence model sits in the deviation-triggering path" is a claim about
 * a system, not about a string. What this gate buys is that the fifty-one
 * become a LIST A READER CAN ARGUE WITH instead of fifty-one records nothing
 * opens. That is the whole of the claim being made here.
 *
 * ── THE THREE EXEMPTION KINDS, AND WHY ONE OF THEM IS MACHINE-CHECKED ────
 *  `restated`  the same rule is stated by ANOTHER invariant in this same
 *              register whose line IS cited. Twelve entries, and each names
 *              that sibling in `alsoAt`. THE GATE CHECKS `alsoAt` IS IN THE
 *              CITED SET — an excuse that stops being true goes red, which
 *              is the difference between an exemption and a shrug.
 *  `backend`   the rule governs a transaction, an append-only store or a
 *              retention job. A browser-only static export has no such path,
 *              so there is no product line at which to cite it. Five entries.
 *  `uncited`   THE OPEN BUCKET, and the honest one. The rule has product
 *              screens, and no file under `src/` or `app/` cites this line at
 *              any of them. Thirty-four entries. This number falling is the
 *              only way this finding actually closes, and it is published
 *              rather than absorbed into the other two.
 *
 * ── LINE NUMBERS ARE NUMBERS HERE, NOT `L`-PREFIXED CITATIONS ────────────
 * Deliberate. An `L`-prefixed number is a citation to `locator-fidelity`
 * wherever it appears, and minting fifty-one new bare weak citations to
 * restate locators the register already carries would move that gate's
 * measured bands for no gain. The keys below are parsed from the register's
 * own `(Lnnnnn)` and compared as integers.
 *
 * SUBJECT AND ORDERING: `registries/generated/source-reconciliation.json`
 * (rewritten by `build:registries`, which `build` chains) against `src/**`
 * and `app/**` as authored, which no verify step writes.
 * ═════════════════════════════════════════════════════════════════════════ */
describe('R6-B03: the 66 source invariants each reach a product citation or a stated exemption', () => {
  type ExemptKind = 'restated' | 'backend' | 'uncited'

  interface InvariantExemption {
    /** The invariant's own source line, as the register writes it. */
    readonly line: number
    readonly kind: ExemptKind
    /**
     * For `restated` only: the line of the sibling invariant stating the same
     * rule, which must itself be cited. Asserted, not asserted-about.
     */
    readonly alsoAt?: number
    readonly why: string
  }

  const INVARIANT_CITATION_EXEMPT: readonly InvariantExemption[] = [
    {
      line: 42883,
      kind: 'restated',
      alsoAt: 2143,
      why: 'An attempt on a locked setting fails and is written to the platform audit log. The rendered half of that rule — the six settings drawn locked with no off position — is the sibling invariant, which is cited.',
    },
    {
      line: 10805,
      kind: 'backend',
      why: 'One-transaction audit guarantee: a change and its audit event commit together. A browser-only export has no transaction to bind them in, so there is no product line at which to cite it.',
    },
    {
      line: 13565,
      kind: 'backend',
      why: 'The audit log is immutable and append-only and no surface may mutate it. An append-only store is a property of a store this build does not have.',
    },
    {
      line: 18111,
      kind: 'backend',
      why: 'The same one-transaction guarantee for non-human identities. Same absent transaction, same absent product line.',
    },
    {
      line: 16726,
      kind: 'uncited',
      why: 'Lot release is Quality Manager only with no exception by work type, risk class or tag. The rule has shipped screens; no file under src/ or app/ cites this line, and none of the register’s four statements of it is cited anywhere.',
    },
    {
      line: 3798,
      kind: 'uncited',
      why: 'The same rule with the Supervisor request-with-a-note branch. The branch is shipped; this line is cited nowhere.',
    },
    {
      line: 14945,
      kind: 'uncited',
      why: 'Absolute rule 12, the Severity 1 form of the same rule: no platform role, no Tenant Admin and no agent may release a Severity 1 hold. Cited nowhere.',
    },
    {
      line: 10428,
      kind: 'uncited',
      why: 'The fourth statement of the same rule, this one about how every matrix, card and interface must resolve it. Cited nowhere.',
    },
    {
      line: 3797,
      kind: 'uncited',
      why: 'The platform-fixed Severity 1 floor: automatic freeze, Quality-Manager-only release, escalation, on-device classification including offline. Cited nowhere.',
    },
    {
      line: 8833,
      kind: 'uncited',
      why: 'The same floor with the tenant rule beside it — tenants may add and may never weaken, and the platform rejects rather than logs a weakening bundle. Cited nowhere.',
    },
    {
      line: 7311,
      kind: 'uncited',
      why: 'A Severity 1 deviation always produces both a Deviation and a Hold; a Severity 2 produces a Deviation and no Hold. Cited nowhere.',
    },
    {
      line: 3795,
      kind: 'uncited',
      why: 'Specification gates hard and always, the evaluation gate hard including for the root, the qualification gate the only configurable one. Cited nowhere.',
    },
    {
      line: 9660,
      kind: 'uncited',
      why: 'No atom or agent may be enabled while a gating scenario is pending or failing, for any account including the root. Cited nowhere.',
    },
    {
      line: 4616,
      kind: 'uncited',
      why: 'Enabling a capability with pending or failing evaluation scenarios is Explicitly prohibited for every account. Cited nowhere.',
    },
    {
      line: 1307,
      kind: 'uncited',
      why: 'The creator of a Job cannot approve that same Job. Cited nowhere, and neither is either of the register’s two other statements of it.',
    },
    {
      line: 3962,
      kind: 'uncited',
      why: 'The same segregation of duties, with the second-approver routing rule beside it. Cited nowhere.',
    },
    {
      line: 52513,
      kind: 'uncited',
      why: 'The same rule with the Job Owner clarification — a field, not a role. Cited nowhere.',
    },
    {
      line: 7382,
      kind: 'uncited',
      why: 'No worker may override a gate that blocks them, and the worker never sees a release control. Cited nowhere.',
    },
    {
      line: 25188,
      kind: 'uncited',
      why: 'No timer, escalation tier, fallback delivery, agent, scheduled job, tenant configuration, tier entitlement, platform setting or account may cause an approval, release, adoption, publication or clearance; the permitted chain is escalation, controlled hold, safe stop, and there is no fourth step. Cited nowhere.',
    },
    {
      line: 117930,
      kind: 'uncited',
      why: 'A timed-out gate item remains open and human-decidable and never auto-approves, auto-declines or auto-adjusts. Cited nowhere.',
    },
    {
      line: 12810,
      kind: 'uncited',
      why: 'A notification is never the sole mechanism enforcing a hold, qualification, authorisation, approval, suspension or device command. Cited nowhere, and neither is the register’s restatement of it.',
    },
    {
      line: 22823,
      kind: 'uncited',
      why: 'The restatement of the same rule over holds, gates, approvals, suspensions and device commands. Cited nowhere.',
    },
    {
      line: 3796,
      kind: 'uncited',
      why: 'No artificial-intelligence model sits in the deviation-triggering path; detection is rule-based and runs on the worker’s device against packaged limits. Cited nowhere.',
    },
    {
      line: 18672,
      kind: 'uncited',
      why: 'The same rule stated as detection deterministic, interpretation agentic, agents activating only after a deterministic trigger. Cited nowhere.',
    },
    {
      line: 4511,
      kind: 'uncited',
      why: 'Evidence is immutable at creation and bound to step, unit, identity, device and both timestamps, and media never touches the device gallery. Cited nowhere.',
    },
    {
      line: 16739,
      kind: 'uncited',
      why: 'Evidence immutability with the append-only correction rule beside it. Cited nowhere.',
    },
    {
      line: 1500,
      kind: 'uncited',
      why: 'A tenant cannot reach another tenant’s data by any route and the control has no off position for any account. Cited nowhere.',
    },
    {
      line: 35737,
      kind: 'uncited',
      why: 'Tenant isolation absolute, nothing becomes external training data, encryption at rest and in transit enforced with no off position. Cited nowhere. Its encryption half is also a backend property, and it is filed here rather than under `backend` because its isolation half is not.',
    },
    {
      line: 16421,
      kind: 'restated',
      alsoAt: 3606,
      why: 'The tenant-configuration registry rejects a looser-than-floor value at point of entry and stores nothing. The sibling invariant states the same rejection-rather-than-logging rule and is cited.',
    },
    {
      line: 20755,
      kind: 'restated',
      alsoAt: 14476,
      why: 'Deny by default, never fail open, never authorise from a stale cached decision. The sibling deny-by-default invariant is cited.',
    },
    {
      line: 1357,
      kind: 'restated',
      alsoAt: 78442,
      why: 'No surface displays an action as applied on a device that has not acknowledged it. The sibling invariant states the same rule over the twenty-two enumerated artefacts and is cited.',
    },
    {
      line: 7515,
      kind: 'restated',
      alsoAt: 78442,
      why: 'The same no-false-applied rule with the expiry clause beside it. Same cited sibling.',
    },
    {
      line: 6984,
      kind: 'uncited',
      why: 'The hold lifecycle renders as issued, propagating and in force per device, never as a single released state, with each device’s confirmation timestamp listed. Cited nowhere, and neither is the register’s restatement.',
    },
    {
      line: 52025,
      kind: 'uncited',
      why: 'The restatement of the per-device hold rendering rule. Cited nowhere.',
    },
    {
      line: 7430,
      kind: 'restated',
      alsoAt: 1680,
      why: 'No real-time remote control of a worker mid-run, and a command channel closed at five classes. The sibling invariant states the no-remote-control half and is cited.',
    },
    {
      line: 6732,
      kind: 'uncited',
      why: 'Rule one, one producer per record: exactly one surface creates each record type and every other surface commands a change through the owning service. Cited nowhere.',
    },
    {
      line: 2312,
      kind: 'uncited',
      why: 'The one-producer rule restated against the seam map. Cited nowhere.',
    },
    {
      line: 6734,
      kind: 'uncited',
      why: 'Rule two, definition pinned and execution bound: a run pins its work package at assignment and the pin is immutable. Cited nowhere.',
    },
    {
      line: 4522,
      kind: 'uncited',
      why: 'Package pinning stated as an outcome — a run finishes on the version it started on and in-flight runs are never re-based. Cited nowhere.',
    },
    {
      line: 4531,
      kind: 'uncited',
      why: 'Interrupting an in-flight run with a work-instruction change notice is Explicitly prohibited; the notified tier waits for the next execution. Cited nowhere.',
    },
    {
      line: 3973,
      kind: 'uncited',
      why: 'Exactly two in-flight run modifications are permitted: worker substitution and capped end-time extension. Cited nowhere.',
    },
    {
      line: 11707,
      kind: 'restated',
      alsoAt: 44875,
      why: 'Exactly one Root Super Admin account exists and no user interface creates a second. The sibling invariant states the same rule and is cited.',
    },
    {
      line: 23771,
      kind: 'restated',
      alsoAt: 9966,
      why: 'A support session is read-only without exception and a data repair goes through the compliance-emergency path. The sibling read-only invariant is cited.',
    },
    {
      line: 9965,
      kind: 'restated',
      alsoAt: 4612,
      why: 'Exactly three platform access classes and no ambient browsing. The sibling invariant names the three and is cited.',
    },
    {
      line: 4800,
      kind: 'backend',
      why: 'Nothing is purged; the retention value is a hot-retrievability horizon. Retention and tiering are jobs against a store this build does not have.',
    },
    {
      line: 10650,
      kind: 'backend',
      why: 'Every retention row resolves to tiering, supersession, anonymisation or a named-standard exception. Same absent store, same absent product line.',
    },
    {
      line: 4801,
      kind: 'restated',
      alsoAt: 8368,
      why: 'Anonymisation is the platform’s one irreversible act, at twenty-four months and never in Regulated-Industry mode. The sibling invariant states what anonymisation does and does not touch and is cited.',
    },
    {
      line: 2044,
      kind: 'restated',
      alsoAt: 8368,
      why: 'The twenty-four-month anonymisation rule restated. Same cited sibling.',
    },
    {
      line: 3052,
      kind: 'uncited',
      why: 'Emergency pause never suppresses gates, specification checks, severity classification or the Severity 1 hold. Cited nowhere.',
    },
    {
      line: 3255,
      kind: 'restated',
      alsoAt: 856,
      why: 'No cell in any coverage table is blank; a non-applicable cell carries a specific reason. The sibling invariant states the same rule for permission-matrix cells and is cited.',
    },
    {
      line: 852,
      kind: 'uncited',
      why: 'Every material claim carries exactly one classification from the closed set of seven. A rule about how the frozen source classifies itself; this build honours it in `SOURCE_CLASSIFICATIONS` and cites the legend rather than this line.',
    },
  ]

  const INVARIANTS = REPORT.reconciliation.invariants

  /** Every `Lnnnnn` written in any `.ts`/`.tsx` under `src/` or `app/`. */
  const CITED_LINES: ReadonlySet<number> = (() => {
    const cited = new Set<number>()
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry)
        if (statSync(full).isDirectory()) walk(full)
        else if (/\.tsx?$/.test(entry)) {
          for (const m of readFileSync(full, 'utf8').matchAll(/\bL(\d{2,6})\b/g)) {
            cited.add(Number(m[1]))
          }
        }
      }
    }
    walk(join(process.cwd(), 'src'))
    walk(join(process.cwd(), 'app'))
    return cited
  })()

  const lineOf = (invariant: string): number => {
    const m = invariant.match(/\bL(\d{2,6})\b/)
    if (m?.[1] === undefined) throw new Error(`invariant carries no locator: ${invariant.slice(0, 80)}`)
    return Number(m[1])
  }

  // FAILS IF: the register empties, shrinks, or starts carrying an invariant
  // with no locator — any of which would make the partition below pass by
  // having nothing to partition. Round 3's shape was a correct fix elsewhere
  // emptying a gate's population and the suite going green with less to say.
  it('reads all 66 invariants, each carrying exactly one distinct locator', () => {
    expect(INVARIANTS.length).toBe(66)
    const lines = INVARIANTS.map(lineOf)
    expect(new Set(lines).size).toBe(66)
    for (const line of lines) expect(line).toBeLessThanOrEqual(122241)
    expect(CITED_LINES.size).toBeGreaterThan(500)
  })

  // FAILS IF: an invariant is neither cited under src//app/ nor exempt, or an
  // exemption names a line that IS cited and so no longer needs one.
  // Equality, in both directions, over a named literal list — the shape round
  // 2 named and round 4 caught by a plant.
  //
  // Planted: `{ line: 4511, kind: 'uncited', ... }` (evidence immutability)
  // removed from the array. Went red naming 4511 as uncovered. Restored, and
  // the file checksummed against the pre-plant bytes.
  it('partitions all 66 into cited and exempt, by equality over a named list', () => {
    const uncovered = INVARIANTS.map(lineOf).filter((line) => !CITED_LINES.has(line))
    expect(uncovered.sort((a, b) => a - b)).toEqual(
      INVARIANT_CITATION_EXEMPT.map((e) => e.line).sort((a, b) => a - b),
    )
  })

  // FAILS IF: a `restated` exemption's sibling stops being cited. This is the
  // half that makes the excuse checkable rather than decorative: twelve
  // entries claim "the same rule is cited at another line", and if that stops
  // being true the entry has to move to the open bucket.
  it('holds every restatement excuse to a sibling that is actually cited', () => {
    const restated = INVARIANT_CITATION_EXEMPT.filter((e) => e.kind === 'restated')
    expect(restated.length).toBeGreaterThan(0)
    const registerLines = new Set(INVARIANTS.map(lineOf))
    for (const e of restated) {
      expect(e.alsoAt, `restated exemption L${e.line} must name its sibling`).toBeDefined()
      expect(registerLines.has(e.alsoAt!), `L${e.alsoAt} must be an invariant in this register`).toBe(true)
      expect(CITED_LINES.has(e.alsoAt!), `L${e.alsoAt}, cited sibling of L${e.line}`).toBe(true)
    }
    for (const e of INVARIANT_CITATION_EXEMPT) {
      if (e.kind !== 'restated') expect(e.alsoAt, `L${e.line} is ${e.kind} and needs no sibling`).toBeUndefined()
      expect(e.why.length, `L${e.line} needs a reason`).toBeGreaterThan(60)
    }
  })

  // FAILS IF: the open bucket is quietly reclassified. `uncited` is the only
  // bucket whose entries represent work still owed, so its size is published
  // here as a CEILING: an entry moved out of it because a citation landed is
  // an improvement and passes; entries moved into `backend` or `restated` to
  // make the number look better cannot happen without editing this literal,
  // which is the deliberate act the brief asked for.
  it('publishes the open bucket as a ceiling that can only be lowered deliberately', () => {
    const byKind = (k: ExemptKind): number => INVARIANT_CITATION_EXEMPT.filter((e) => e.kind === k).length
    expect(byKind('uncited')).toBeLessThanOrEqual(34)
    expect(byKind('backend')).toBeLessThanOrEqual(5)
    expect(byKind('restated') + byKind('backend') + byKind('uncited')).toBe(
      INVARIANT_CITATION_EXEMPT.length,
    )
  })
})

/* ═════════════════════════════════════════════════════════════════════════
 * R6-B03 item 2, R6-B07 and R6-B05 — THE THREE GAPS THE DASHBOARD PUBLISHES.
 *
 * All three are the same shape: a claim about something a Server Component
 * cannot measure — what `tests/` contains, what other pages render, what the
 * suite does not do — held as a named literal in `@/coverage/disclosure-gaps`
 * and checked here against a fresh measurement BY EQUALITY.
 *
 * Equality in BOTH directions is the load-bearing part. R6-B07 can be
 * "closed" by narrowing what counts as a citation, or by sprinkling
 * identifiers into test names; a floor on a count would reward both. A list
 * compared by equality rewards neither: dropping a product citation removes
 * an entry and reds, adding a bare identifier to a `describe` string removes
 * an entry and reds. The only edit that goes green is a deliberate one to the
 * literal, which is what "a floor that can only be lowered deliberately"
 * means.
 *
 * SUBJECT AND ORDERING: `out/coverage/index.html` and `out/**` (written by
 * `build`) against `src/**`, `app/**` and `tests/**` as authored, none of
 * which any verify step writes.
 * ═════════════════════════════════════════════════════════════════════════ */
describe('R6-B03/B05/B07: the gaps the coverage dashboard publishes about itself', () => {
  const AC_TOKEN = /(?<![A-Za-z0-9-])AC-[A-Z0-9]+(?:-[A-Z0-9]+)*(?![A-Za-z0-9-])/g

  function sourceFiles(dir: string, acc: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
      if (isForeignProbe(entry)) continue
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) sourceFiles(full, acc)
      else if (/\.tsx?$/.test(entry)) acc.push(full)
    }
    return acc
  }

  const tokensIn = (dirs: readonly string[]): ReadonlySet<string> => {
    const found = new Set<string>()
    for (const dir of dirs) {
      for (const file of sourceFiles(join(process.cwd(), dir))) {
        for (const m of readFileSync(file, 'utf8').matchAll(AC_TOKEN)) found.add(m[0])
      }
    }
    return found
  }

  // ── R6-B07 ────────────────────────────────────────────────────────────

  // FAILS IF: either population empties, which would make the equality below
  // pass on two empty sets — vacuous-subset shape number 9 in RESUME §7.
  it('has both acceptance-criterion populations to compare', () => {
    expect(tokensIn(['src', 'app']).size).toBeGreaterThan(500)
    expect(tokensIn(['tests']).size).toBeGreaterThan(200)
    expect(AC_CITED_IN_PRODUCT_NOT_IN_TESTS.length).toBeGreaterThan(0)
  })

  // FAILS IF: the published list disagrees with a fresh measurement in either
  // direction — a criterion that gained a test naming it, or a newly cited
  // criterion with no test.
  //
  // Planted: `'AC-DOC-002'` appended to `AC_CITED_IN_PRODUCT_NOT_IN_TESTS`.
  // Went red naming it as listed-but-not-measured. Removed; file checksummed
  // against the pre-plant bytes.
  it('R6-B07: the published untested list equals the measured one, both ways', () => {
    const product = tokensIn(['src', 'app'])
    const tested = tokensIn(['tests'])
    const measured = [...product].filter((id) => !tested.has(id)).sort()
    expect([...AC_CITED_IN_PRODUCT_NOT_IN_TESTS].sort()).toEqual(measured)
  })

  // FAILS IF: the dashboard stops publishing the figure, or publishes one
  // that disagrees with the list behind it. The finding is that the ratio
  // reaches no reader; a green list with an unrendered figure would not close
  // it.
  it('R6-B07: the dashboard renders the figure the list holds', () => {
    expect(DASHBOARD).toContain(
      `${AC_CITED_IN_PRODUCT_NOT_IN_TESTS.length} distinct acceptance-criterion identifiers are cited`,
    )
    // The escape hatch this finding must not be closed through, named on the
    // page so a reader can hold the build to it.
    expect(DASHBOARD).toContain('no traceability chain')
  })

  // ── R6-B03 item 2 ─────────────────────────────────────────────────────

  const RESIDUAL = REPORT.reconciliation.residual_contradictions

  /** Every built page's reader text, payload stripped. */
  const EXPORT_PAGES: readonly { readonly page: string; readonly text: string }[] = (() => {
    const acc: string[] = []
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir)) {
        if (entry === '_next' || isForeignProbe(entry)) continue
        const full = join(dir, entry)
        if (statSync(full).isDirectory()) walk(full)
        else if (entry.endsWith('.html')) acc.push(full)
      }
    }
    walk(OUT)
    return acc.map((page) => ({ page, text: renderedText(readFileSync(page, 'utf8')) }))
  })()

  const COVERAGE_INDEX = join(OUT, 'coverage', 'index.html')

  it('reads all 45 residual contradictions and a built export to compare them against', () => {
    expect(RESIDUAL.length).toBe(45)
    expect(EXPORT_PAGES.length).toBeGreaterThanOrEqual(100)
  })

  // FAILS IF: a contradiction the build claims is disclosed elsewhere is
  // rendered on no page but the coverage dashboard, or one this page renders
  // was already disclosed elsewhere and is therefore duplication.
  //
  // The split is derived from `out/` here and from a named literal in
  // `@/coverage/disclosure-gaps` at render time; this gate is what keeps the
  // two honest. Measured when it landed: 32 elsewhere, 13 here.
  //
  // Planted: `'DEC-STORE-001'` removed from
  // `CONTRADICTIONS_DISCLOSED_ELSEWHERE`, then `pnpm build`. Went red — the
  // record became a fourteenth entry on the page while still being disclosed
  // on seven other pages. Restored, rebuilt, green, file checksummed.
  it('R6-B03: renders exactly the contradictions no other page discloses', () => {
    const elsewhere = (record: string): boolean => {
      const id = contradictionIdentifier(record)
      if (id === null) return false
      return EXPORT_PAGES.some((p) => p.page !== COVERAGE_INDEX && p.text.includes(id))
    }
    const measuredHere = RESIDUAL.filter((r) => !elsewhere(r))
    expect(contradictionsDisclosedNowhereElse(RESIDUAL)).toEqual(measuredHere)

    // And every one of them is on the page a reader can open, in full.
    for (const record of measuredHere) {
      expect(DASHBOARD, `contradiction not rendered: ${record.slice(0, 60)}`).toContain(
        record.slice(0, 120),
      )
    }
    expect(DASHBOARD).toContain(
      `${RESIDUAL.length - measuredHere.length} of them are already disclosed in full`,
    )
  })

  // FAILS IF: an identifier on the disclosed-elsewhere list stops being
  // rendered anywhere. Without this the list is an unchecked excuse for not
  // rendering thirty-two records.
  it('R6-B03: every identifier claimed disclosed elsewhere is actually rendered somewhere else', () => {
    expect(CONTRADICTIONS_DISCLOSED_ELSEWHERE.length).toBeGreaterThan(0)
    const unrendered = CONTRADICTIONS_DISCLOSED_ELSEWHERE.filter(
      (id) => !EXPORT_PAGES.some((p) => p.page !== COVERAGE_INDEX && p.text.includes(id)),
    )
    expect(unrendered).toEqual([])
  })

  // ── R6-B05 ────────────────────────────────────────────────────────────

  // FAILS IF: the visual-regression limitation stops being reachable by a
  // reader, or the absence it records stops being true.
  //
  // The second half matters more than it looks. This build is required by
  // master prompt §29.4 not to claim a capability it only simulates; it is
  // equally required not to keep declaring an absence it has since filled.
  // R5-A01's whole shape was a screen asserting an absence the build
  // contradicted, so the assertion runs in both directions: the record is on
  // the page AND the four screenshot-comparison APIs are still absent from
  // the suite. Build one and this goes red, which is the correct time to
  // rewrite the record.
  it('R6-B05: the visual-regression limitation is on a page and is still true', () => {
    const limitation = KNOWN_LIMITATIONS.find((l) => l.id === 'LIM-VISUAL-01')
    expect(limitation, 'LIM-VISUAL-01 must exist').toBeDefined()
    expect(DASHBOARD).toContain('LIM-VISUAL-01')
    expect(DASHBOARD).toContain('No visual-regression capability exists')
    expect(DASHBOARD).toContain('no baseline exists to regenerate')

    const suite = [
      ...sourceFiles(join(process.cwd(), 'tests')),
      join(process.cwd(), 'playwright.config.ts'),
    ]
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n')
    // The four APIs the audit measured at zero. A hit here means the
    // capability now partly exists and the record is stale.
    for (const api of ['toHaveScreenshot', 'toMatchSnapshot', 'pixelmatch', 'maxDiffPixel']) {
      // `sourceFiles` skips this file's own quoted names by reading `tests/`
      // wholesale, so the strings above appear here too -- compare against
      // the count this file contributes rather than against zero.
      const occurrences = suite.split(api).length - 1
      const inThisFile = readFileSync(__filename, 'utf8').split(api).length - 1
      expect(occurrences - inThisFile, `${api} now exists; LIM-VISUAL-01 is stale`).toBe(0)
    }
  })
})
