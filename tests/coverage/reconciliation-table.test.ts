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
  const registries = REGISTRY_DESCRIPTORS.map(
    (d) =>
      JSON.parse(readFileSync(`registries/generated/${d.slug}.json`, 'utf8')) as {
        rows: { status: string }[]
      },
  )
  const PRECEDENCE = ['demonstrated-in-storyboard', 'mounted-in-another-screen', 'not-represented']
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
