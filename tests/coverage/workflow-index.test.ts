import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import { masterPromptObligation } from './master-prompt'
import { renderedText } from './rendered-text'

const OUT = join(process.cwd(), 'out')

/**
 * The one probe convention, hoisted into `tests/probe-paths.ts` — a scratch
 * probe belonging to a CONCURRENT process is skipped, so this scan is blind
 * to every probe but the ones it plants itself. That file carries the full
 * account, including why the match is EXACT and never a prefix.
 */
function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (isForeignProbe(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, acc)
    else acc.push(full)
  }
  return acc
}

const PAGES = walk(OUT).filter((f) => f.endsWith('index.html') || f.endsWith('404.html'))

/**
 * BLOCKING 2 (final review): before this fix, no page in the 25-page static
 * export linked to `/workflows/` at all, and the coverage dashboard linked
 * to `/coverage/workflows/` instead -- a second, permanently-empty page for
 * the same concept. Proven against the real build output (`out/`), which is
 * what a reviewer actually navigates.
 */
describe('workflow index is reachable from the built site', () => {
  it('at least one emitted page links to /workflows/', () => {
    const linking = PAGES.filter((f) => readFileSync(f, 'utf8').includes('href="/workflows/"'))
    expect(linking.length).toBeGreaterThan(0)
  })

  it('the coverage dashboard links to /workflows/, not just /coverage/workflows/', () => {
    const dashboard = readFileSync(join(OUT, 'coverage', 'index.html'), 'utf8')
    expect(dashboard).toMatch(/href="\/workflows\/"/)
  })

  it('/coverage/workflows/ points at /workflows/ rather than duplicating an empty page', () => {
    const legacy = readFileSync(join(OUT, 'coverage', 'workflows', 'index.html'), 'utf8')
    expect(legacy).toMatch(/href="\/workflows\/"/)
  })

  it('/workflows/ renders real rows, not an empty table', () => {
    const html = readFileSync(join(OUT, 'workflows', 'index.html'), 'utf8')
    // A stable-id-shaped row from the generated registry, not fabricated.
    // R5-Q01: the CONTENT half reads rendered text, because the flight payload
    // carries every row id as a React key; the markup half below stays raw
    // because `<tr` is markup and there is nothing to strip it from.
    expect(renderedText(html)).toMatch(/SB-001/)
    // Fix round 1 (defect 3): 724 composite-keyed rows now, not the retired
    // 432-row registry.
    expect((html.match(/<tr/g) ?? []).length).toBeGreaterThan(700)
  })

  it('the entry page links somewhere -- coverage, workflows and review', () => {
    const entry = readFileSync(join(OUT, 'index.html'), 'utf8')
    expect(entry).toMatch(/href="\/coverage\/"/)
    expect(entry).toMatch(/href="\/workflows\/"/)
    expect(entry).toMatch(/href="\/review\/"/)
  })

  // Count-scope discipline: the 725/724-adjacent sentence must sit right
  // next to the number, not paragraphs above it, and 724 must never be
  // labelled a workflow total. (Fix round 1, defect 3: was 432, before the
  // legacy id-only-deduped registry was retired in favour of Task 7's
  // composite-keyed one.)
  it('the 724 count sits directly next to the "no workflow total" disclaimer', () => {
    // R5-Q01: PROXIMITY IS A CLAIM ABOUT WHAT A READER SEES, so it is measured
    // on rendered text. Over the raw bytes, `indexOf('725')` can land in the
    // flight payload and then "the disclaimer is 400 characters away" is a
    // statement about a serialised prop, not about the page.
    const html = renderedText(readFileSync(join(OUT, 'workflows', 'index.html'), 'utf8'))
    const idx = html.indexOf('725')
    expect(idx).toBeGreaterThan(-1)
    const nearby = html.slice(idx, idx + 400)
    expect(nearby).toMatch(/MODULE count/)
    expect(nearby).toMatch(/724/)
    // The two absence claims stay on the WHOLE file deliberately: an absence
    // is only stronger for being asserted over more text.
    const raw = readFileSync(join(OUT, 'workflows', 'index.html'), 'utf8')
    expect(raw).not.toMatch(/724\s+workflows\b/i)
    expect(raw).not.toMatch(/725\s+workflows\b/i)
  })
})

/**
 * ═══════════════════════════════════════════════════════════════════════
 * R4-B07 and R4-B08 — THE EIGHT §10.5 DIMENSIONS, AND THE TWO WORKFLOW
 * COUNTS THAT DID NOT CITE EACH OTHER.
 *
 * B07: master prompt §10.5 requires the index to list every workflow with its
 * ID, plain-language name, owning surface and module, initiating AND
 * participating roles, primary objects, implementation status and variant
 * coverage summary, filterable by each. It shipped four of the eight. Owning
 * module carried 0 rows, participating roles did not exist (only the single
 * `primaryActor`), primary objects did not exist, and `extractionCoverage`
 * is the composite-key collapse disclosure rather than variant coverage.
 *
 * B08: `/workflows/` published 724 rows from 725 records; the §9.6 table
 * publishes 644 against Appendix L's 642; `grep -c` for 642, 644 and 118 in
 * the built page returned zero for each. §10.5 requires the index count to
 * reconcile to the §9.6 table.
 *
 * WHAT IS ASSERTED, AND WHY THREE DIMENSIONS READ "not extracted". The
 * workflow extraction records eight fields and none of them is a module, an
 * object or a variant class. The brief's rule, and this build's doctrine, is
 * to render the column with an explicit not-extracted value and disclose why
 * — never to drop it and never to synthesise it. So this gate asserts that
 * all four columns EXIST, that the one that is derivable is derived and
 * populated, and that a fabricated value in either of the other two goes red.
 * ═══════════════════════════════════════════════════════════════════════
 */
interface WorkflowRow {
  id: string
  label?: string
  primaryActor?: string
  participatingRoles?: string[]
  exercisedBy?: string[]
  moduleId?: string
  status: string
}
const WORKFLOWS = JSON.parse(
  readFileSync('registries/generated/workflows.json', 'utf8'),
) as { rows: WorkflowRow[]; rawCount: number }
const RECONCILIATION = JSON.parse(
  readFileSync('registries/generated/source-reconciliation.json', 'utf8'),
) as {
  reconciliation: {
    reconciliation_rows: { registry_slug: string | null; extracted_count: string; delta: string }[]
  }
}
const WORKFLOWS_PAGE = renderedText(readFileSync(join(OUT, 'workflows', 'index.html'), 'utf8'))

describe('R4-B07: the Workflow Index ships all eight §10.5 dimensions', () => {
  it('the obligation is verbatim in the committed prompt artefact', () => {
    const sentence = masterPromptObligation('workflowIndexDimensions')
    for (const dimension of [
      'owning surface and module',
      'initiating and participating roles',
      'primary objects',
      'implementation status',
      'variant coverage summary',
      'filterable by each of those dimensions',
    ]) {
      expect(sentence, `master prompt §10.5 names "${dimension}"`).toContain(dimension)
    }
  })

  it('every one of the eight is a rendered column header — the HEADER ROW, by equality', () => {
    /**
     * THIS ASSERTION WAS WRITTEN AS `page.toContain('Owning module')` AND
     * THE PLANT WALKED PAST IT. Deleting the column from `WORKFLOW_COLUMNS`
     * left the page green, because "Owning module" is also the label of the
     * filter beside the table — the gate was matching the wrong element for
     * a claim about a column. It is the `<th>` row now, compared by EQUALITY
     * against the ordered list, so a removed column, a renamed one and a
     * reordered one are each red and each say which.
     */
    const html = readFileSync(join(OUT, 'workflows', 'index.html'), 'utf8')
    const thead = /<thead>.*?<\/thead>/s.exec(html)
    expect(thead, 'the workflow table has a header row at all').not.toBeNull()
    const headers = [...(thead?.[0] ?? '').matchAll(/<th\b[^>]*>(.*?)<\/th>/gs)].map((m) =>
      (m[1] ?? '').replace(/<[^>]+>/g, '').trim(),
    )
    expect(headers).toEqual([
      'Stable ID',
      'Name',
      'Primary actor',
      'Participating roles',
      'Surfaces touched',
      'Owning module',
      'Primary objects',
      'Terminal states',
      'Variant coverage summary',
      'Use cases',
      'Source line',
      'Implementation status',
      'Extraction coverage',
    ])
  })

  it('every one of the eight is a rendered filter control', () => {
    const html = readFileSync(join(OUT, 'workflows', 'index.html'), 'utf8')
    for (const label of [
      'Surface',
      'Actor',
      'Status',
      'Participating role',
      'Owning module',
      'Primary object',
      'Variant coverage',
    ]) {
      expect(html, `filter "${label}"`).toContain(`>${label}<`)
    }
  })

  it('participating roles are derived and populated, against the closed nine-role vocabulary', () => {
    const withRoles = WORKFLOWS.rows.filter((r) => (r.participatingRoles ?? []).length > 0)
    // Population floor: the field existing on zero rows is the defect, not
    // the fix. Measured at well over half the register.
    expect(WORKFLOWS.rows.length, 'workflow rows').toBeGreaterThan(700)
    expect(withRoles.length, 'rows carrying at least one participating role').toBeGreaterThan(300)
    const NINE = new Set([
      'Root Super Admin', 'Admin', 'Platform Engineer', 'Support',
      'Tenant Admin', 'Supervisor', 'Quality Manager', 'Read-only Auditor', 'Worker',
    ])
    for (const row of WORKFLOWS.rows) {
      for (const role of row.participatingRoles ?? []) {
        expect(NINE.has(role), `${row.id} names "${role}", which is not one of the nine`).toBe(true)
      }
    }
    // Multi-role rows exist -- the whole reason `primaryActor` alone was not
    // enough. A derivation that only ever found one role would be the single
    // actor under a new name.
    expect(WORKFLOWS.rows.filter((r) => (r.participatingRoles ?? []).length > 1).length).toBeGreaterThan(30)
  })

  it('"Tenant Admin" is never also counted as the platform "Admin" role', () => {
    /**
     * The longest-match-consumed rule, checked on real data by counting
     * rather than by re-running the derivation (which would be a tautology).
     *
     * A naive scan reports the platform Admin on every tenant-admin
     * workflow — a permission claim, not a formatting slip. The invariant a
     * naive scan breaks: a row may only carry the bare `Admin` role when the
     * word "Admin" occurs MORE often in its text than "Tenant Admin" and
     * "Root Super Admin" together, because those two consume one occurrence
     * each.
     */
    const textOf = (r: WorkflowRow) => `${r.primaryActor ?? ''}   ${(r as { trigger?: string }).trigger ?? ''}`
    const count = (s: string, needle: string) => s.split(needle).length - 1

    const tenantAdminRows = WORKFLOWS.rows.filter((r) =>
      (r.participatingRoles ?? []).includes('Tenant Admin'),
    )
    expect(tenantAdminRows.length, 'rows naming the Tenant Admin').toBeGreaterThan(50)

    const overcounted = tenantAdminRows.filter((r) => {
      if (!(r.participatingRoles ?? []).includes('Admin')) return false
      const text = textOf(r)
      const consumed = count(text, 'Tenant Admin') + count(text, 'Root Super Admin')
      return count(text, 'Admin') <= consumed
    })
    expect(
      overcounted.map((r) => r.id),
      'rows crediting the platform Admin off the word inside "Tenant Admin"',
    ).toEqual([])

    // And the naive rule really would break it: most tenant-admin rows name
    // Admin exactly once, so a scan without consumption would credit the
    // platform Admin on every one of them.
    const wouldBreak = tenantAdminRows.filter((r) => count(textOf(r), 'Admin') === count(textOf(r), 'Tenant Admin'))
    expect(wouldBreak.length, 'rows the naive rule would mis-credit').toBeGreaterThan(30)
    expect(wouldBreak.filter((r) => (r.participatingRoles ?? []).includes('Admin'))).toEqual([])
  })

  it('the three dimensions the extraction does not carry read "not extracted", never a value', () => {
    expect(WORKFLOWS.rows.filter((r) => r.moduleId !== undefined).length).toBe(0)
    expect(WORKFLOWS_PAGE).toContain('not extracted')
    expect(WORKFLOWS_PAGE).toContain(
      'the workflow extraction records no module field, so the column reads',
    )
    // No fabricated object or variant field anywhere on a workflow row.
    for (const row of WORKFLOWS.rows) {
      for (const key of Object.keys(row)) {
        expect(key, `${row.id} carries a synthesised ${key}`).not.toMatch(
          /^(primaryObjects|variantCoverage|controlType)$/,
        )
      }
    }
  })

  it('the use-case trace chain §9.2 requires is carried rather than dropped', () => {
    const withUseCases = WORKFLOWS.rows.filter((r) => (r.exercisedBy ?? []).length > 0)
    expect(withUseCases.length, 'rows carrying exercised_by').toBeGreaterThan(40)
    expect(WORKFLOWS_PAGE).toContain('Use cases')
  })
})

describe('R4-B08: the index count reconciles to the §9.6 table', () => {
  const row = RECONCILIATION.reconciliation.reconciliation_rows.find(
    (r) => r.registry_slug === 'workflows',
  )

  it('a workflows reconciliation row exists to reconcile against', () => {
    expect(row, 'the §9.6 Workflows row').toBeDefined()
    // The three figures the finding named. Asserted on the ARTEFACT, so the
    // page cannot be judged against a sentence nothing authored.
    for (const figure of ['644', '642', '118']) {
      expect(row!.extracted_count, `the §9.6 row names ${figure}`).toContain(figure)
    }
  })

  it('the page prints both counts and says what each one counts', () => {
    for (const figure of ['644', '642', '118']) {
      expect(WORKFLOWS_PAGE, `/workflows/ names ${figure}`).toContain(figure)
    }
    expect(WORKFLOWS_PAGE).toContain('PASSAGE-RECORD set')
    expect(WORKFLOWS_PAGE).toContain('How ' + WORKFLOWS.rows.length + ' reconciles to the §9.6 table')
  })

  it('the WF- prefixed subset is measured, not asserted', () => {
    const wfPrefixed = WORKFLOWS.rows.filter((r) => r.id.startsWith('WF-')).length
    expect(wfPrefixed, 'WF- prefixed rows').toBeGreaterThan(0)
    expect(wfPrefixed, 'and they are a minority of the passage records').toBeLessThan(
      WORKFLOWS.rows.length,
    )
    expect(WORKFLOWS_PAGE).toContain(`only ${wfPrefixed} of the rows below carry a`)
  })
})
