import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { A2_RUN_STATES } from '@/frontline/modules/fl-a2/charter'
import { runIsEnterable } from '@/frontline/modules/fl-a2/service'
import {
  DELIVERY_ACCEPTANCE,
  DELIVERY_COMPARISON,
  DELIVERY_LOCATORS,
  DELIVERY_PATHS,
  DELIVERY_PATH_HEADINGS,
  DELIVERY_SHAPE,
  DELIVERY_TESTS,
  DELIVERY_WORKFLOWS,
  IN_FLIGHT_REBASE_REFUSAL,
  OFFLINE_ASSIGNMENT_GAP,
  READINESS_STATES_USED,
  deliveryComparisonRow,
  deliveryWorkflow,
  packageIsEnterable,
  packageReadiness,
  rePull,
  type PackageStaging,
} from '@/offline/package/delivery'

/**
 * THE FROZEN SOURCE IS THE GROUND TRUTH, NOT THE CONSTANT UNDER TEST. Every
 * cell of the comparison table is re-split from its own line on every run, so
 * a reworded transcription goes red against a source that still says the old
 * thing, and a column swap goes red because the assertion is keyed on the
 * header rather than on position.
 */
const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')

/** `SOURCE_LINES` is 0-based; every citation in this build is 1-based `L<n>`. */
const srcLine = (n: number): string => SOURCE_LINES[n - 1] ?? ''

const cellsOf = (n: number): readonly string[] =>
  srcLine(n)
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim())

describe('§35.4 opens where this module says it does', () => {
  it('the section heading is at the cited line and carries the section number', () => {
    expect(srcLine(DELIVERY_LOCATORS.section)).toBe(
      '## 35.4 Delivery paths, honest readiness and per-run pinning',
    )
  })

  it('the source states two complementary paths, and this module carries two', () => {
    expect(srcLine(DELIVERY_LOCATORS.businessRules)).toContain(
      'Workflow packages reach the device by two complementary paths',
    )
    expect(srcLine(DELIVERY_LOCATORS.businessRules)).toContain(
      "Until a Run's package has arrived, the Run is shown as not-yet-ready rather than silently missing",
    )
    expect(DELIVERY_PATHS).toHaveLength(2)
  })
})

/* ==================================================================== *
 * THE COMPARISON TABLE, CELL BY CELL, HEADER-KEYED.
 * ==================================================================== */

describe('the two-path comparison table, against the frozen source', () => {
  it('the header carries Property and both path names, in source order', () => {
    expect(cellsOf(DELIVERY_LOCATORS.comparisonHeader)).toEqual([
      'Property',
      'Shift-start pre-sync',
      'Lazy pull',
    ])
    // And the headings this module keys on ARE those two, in that order.
    expect(DELIVERY_PATHS.map((p) => DELIVERY_PATH_HEADINGS[p])).toEqual(
      cellsOf(DELIVERY_LOCATORS.comparisonHeader).slice(1),
    )
  })

  it('the separator is a separator and is not counted as a row', () => {
    expect(srcLine(DELIVERY_LOCATORS.comparisonHeader + 1)).toMatch(/^\|(?:---\|){3}$/)
    expect(DELIVERY_LOCATORS.comparisonFirstRow).toBe(DELIVERY_LOCATORS.comparisonHeader + 2)
  })

  it('the body is ten data rows and the line after the last is not one', () => {
    expect(DELIVERY_LOCATORS.comparisonLastRow - DELIVERY_LOCATORS.comparisonFirstRow + 1).toBe(10)
    expect(DELIVERY_COMPARISON).toHaveLength(10)
    expect(DELIVERY_SHAPE.comparisonRows).toBe(10)
    expect(srcLine(DELIVERY_LOCATORS.comparisonLastRow + 1).startsWith('|')).toBe(false)
  })

  it('every row sits on its own consecutive line, in source order', () => {
    expect(DELIVERY_COMPARISON.map((r) => r.sourceRef)).toEqual(
      Array.from({ length: 10 }, (_, i) => DELIVERY_LOCATORS.comparisonFirstRow + i),
    )
  })

  it.each(DELIVERY_COMPARISON.map((r) => [r.id, r] as const))(
    'row %s: the property and BOTH cells match the source line, keyed on the header',
    (_id, row) => {
      const cells = cellsOf(row.sourceRef)
      expect(cells).toHaveLength(3)
      expect(cells[0]).toBe(row.property)
      // Keyed, not positional: swapping the two path keys in the module
      // inverts every asymmetric row and this goes red on it.
      expect(cells[1]).toBe(row.cells['shift-start-pre-sync'])
      expect(cells[2]).toBe(row.cells['lazy-pull'])
    },
  )

  it('the readiness row is the asymmetric one, and its pre-sync cell states its reason', () => {
    const row = deliveryComparisonRow('readiness-display-before-arrival')
    expect(row.cells['shift-start-pre-sync']).not.toBe(row.cells['lazy-pull'])
    // `Not applicable` carries a REQUIRED stated reason; a bare token would be
    // a blank cell wearing a label.
    expect(row.cells['shift-start-pre-sync']).toBe(
      '`Not applicable — packages are present before the shift begins`',
    )
    expect(row.cells['lazy-pull']).toBe('Not-yet-ready with a stated reason')
  })

  it('the worker-action row prohibits it on BOTH paths, matched as a whole token', () => {
    const row = deliveryComparisonRow('worker-action-required')
    for (const path of DELIVERY_PATHS) {
      // `Allowed` is a prefix of `Allowed with conditions`, so the whole
      // backticked token is matched rather than a leading substring.
      expect(row.cells[path].startsWith('`Explicitly prohibited` —')).toBe(true)
      expect(row.cells[path]).toContain('never a worker action')
    }
  })

  it('only the lazy-pull column names the offline-assignment gap', () => {
    const row = deliveryComparisonRow('source-status')
    expect(row.cells['lazy-pull']).toContain('DEC-OFFASSIGN-001')
    expect(row.cells['shift-start-pre-sync']).not.toContain('DEC-OFFASSIGN-001')
  })

  it('every row id is distinct', () => {
    const ids = DELIVERY_COMPARISON.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

/* ==================================================================== *
 * THE TWO WORKFLOWS.
 * ==================================================================== */

describe('the two numbered workflows', () => {
  it('each has six steps and the headings sit where cited', () => {
    expect(srcLine(DELIVERY_LOCATORS.preSyncWorkflowHeading)).toContain(
      'Numbered chronological workflow — shift-start pre-sync',
    )
    expect(srcLine(DELIVERY_LOCATORS.lazyPullWorkflowHeading)).toContain(
      'Numbered chronological workflow — lazy pull for a mid-shift assignment',
    )
    expect(DELIVERY_SHAPE.workflowSteps).toEqual([6, 6])
  })

  it.each(DELIVERY_WORKFLOWS.flatMap((w) => w.steps.map((s) => [w.path, s.n, s] as const)))(
    '%s step %d is transcribed from its own numbered source line',
    (_path, n, step) => {
      const line = srcLine(step.sourceRef)
      expect(line.startsWith(`${n}. `)).toBe(true)
      expect(line).toContain(step.text)
    },
  )

  it('the last two lazy-pull steps are pin-then-enterable, in that order', () => {
    const steps = deliveryWorkflow('lazy-pull').steps
    expect(steps[4]?.text).toContain('verifies, stores, activates and pins')
    expect(steps[5]?.text).toBe('The run becomes enterable.')
    expect(steps[4]?.sourceRef).toBeLessThan(steps[5]?.sourceRef ?? 0)
  })
})

/* ==================================================================== *
 * HONEST READINESS — DELEGATED TO `MOD-FL-A2`, NOT RESPELLED.
 * ==================================================================== */

describe('honest readiness', () => {
  const notArrived: PackageStaging = { kind: 'not-arrived', reason: 'no connectivity yet' }
  const arriving: PackageStaging = { kind: 'arriving' }
  const staged: PackageStaging = { kind: 'staged', pinnedVersion: 'v3' }

  it('a package still arriving is NOT ready — AC-PKG-403 says so in the source', () => {
    expect(srcLine(79415)).toContain('before the package pull completes')
    expect(packageReadiness(arriving)).toBe('STATE-A2-NOTREADY')
    expect(packageIsEnterable(arriving)).toBe(false)
  })

  it('only a fully staged package is ready and enterable', () => {
    expect(packageIsEnterable(notArrived)).toBe(false)
    expect(packageIsEnterable(staged)).toBe(true)
  })

  it('every readiness this module returns is one of MOD-FL-A2 own states', () => {
    const a2Ids = A2_RUN_STATES.map((s) => s.id)
    for (const staging of [notArrived, arriving, staged]) {
      expect(a2Ids).toContain(packageReadiness(staging))
    }
    expect(READINESS_STATES_USED.every((id) => a2Ids.includes(id))).toBe(true)
  })

  it('enterability is MOD-FL-A2 ruling, true on exactly one of its six states', () => {
    expect(A2_RUN_STATES.filter((s) => runIsEnterable(s.id))).toHaveLength(1)
    // The source's own reason for the prohibition, at row 5 of that matrix.
    expect(srcLine(40365)).toContain('the package has not arrived, so nothing can be rendered')
  })
})

/* ==================================================================== *
 * PER-RUN PINNING.
 * ==================================================================== */

describe('per-run pinning and the supervisor re-pull', () => {
  it('MOD-FL-A6 row 8 prohibits a forced version change in ALL FIVE columns', () => {
    const cells = cellsOf(41101)
    expect(cells[0]).toBe('Force a package version change onto an in-flight Run')
    expect(cells.slice(1)).toHaveLength(5)
    for (const c of cells.slice(1)) {
      // Whole-token equality: `Explicitly prohibited` here, never a prefix of
      // something longer that would mean the opposite.
      expect(c).toBe('`Explicitly prohibited`')
    }
    expect(IN_FLIGHT_REBASE_REFUSAL.sourceRef).toBe('L41101')
    expect(IN_FLIGHT_REBASE_REFUSAL.control).toBe(cells[0])
  })

  it('a re-pull on an in-flight run changes nothing and states why', () => {
    const current: PackageStaging = { kind: 'staged', pinnedVersion: 'v3' }
    const out = rePull(current, 'v4', true)
    expect(out.restaged).toBe(false)
    expect(out.staging).toBe(current)
    expect(out.refusedBecause).toBe(IN_FLIGHT_REBASE_REFUSAL.why)
    expect(out.refusedBecause).toContain('never re-basing an in-flight Run')
  })

  it('a re-pull on a run not under way restages and re-pins it', () => {
    const out = rePull({ kind: 'not-arrived', reason: 'never arrived' }, 'v4', false)
    expect(out.restaged).toBe(true)
    expect(out.staging).toEqual({ kind: 'staged', pinnedVersion: 'v4' })
    expect(out.refusedBecause).toBeNull()
  })

  it('runInFlight is a required parameter, not a defaulted one', () => {
    // A defaulted `runInFlight = false` does not count toward
    // `Function.length`, and an omitted argument would then silently rebase a
    // run under way.
    expect(rePull.length).toBe(3)
  })

  it('the pinning consequence is stated at the line this module cites', () => {
    expect(srcLine(DELIVERY_LOCATORS.pinningRestated)).toContain(
      'a mid-shift publication cannot change the limits a worker is being judged against',
    )
  })
})

/* ==================================================================== *
 * THE GAP, REFERENCED AND NOT CARDED HERE.
 * ==================================================================== */

describe('DEC-OFFASSIGN-001 is referenced, and its card is another section’s', () => {
  it('the gap and the recommendation are both on the cited line', () => {
    const line = srcLine(DELIVERY_LOCATORS.offlineAssignmentGap)
    expect(line).toContain('raised as `DEC-OFFASSIGN-001` in Section 35.7')
    expect(line).toContain(OFFLINE_ASSIGNMENT_GAP.gap)
    expect(line).toContain(OFFLINE_ASSIGNMENT_GAP.recommendation)
  })

  it('the card itself is at L79654, outside §35.4 and §35.5', () => {
    expect(srcLine(79654)).toContain(
      '**`DEC-OFFASSIGN-001` — visibility of a run assigned while the device is offline.**',
    )
    expect(79654).toBeGreaterThan(DELIVERY_LOCATORS.section)
    expect(srcLine(79616)).toBe('## 35.7 The open decisions this architecture cannot resolve')
  })
})

/* ==================================================================== *
 * ACCEPTANCE CRITERIA AND TESTS, AND THE COUNT THAT DOES NOT PAIR.
 * ==================================================================== */

describe('§35.4 acceptance criteria and tests', () => {
  it('five criteria on five consecutive lines', () => {
    expect(DELIVERY_ACCEPTANCE).toHaveLength(5)
    expect(cellsOf(DELIVERY_LOCATORS.acceptanceHeader)).toEqual([
      'Identifier',
      'Statement',
      'Source status',
    ])
    expect(DELIVERY_ACCEPTANCE.map((a) => a.sourceRef)).toEqual([
      79413, 79414, 79415, 79416, 79417,
    ])
  })

  it.each(DELIVERY_ACCEPTANCE.map((a) => [a.id, a] as const))(
    '%s matches its source row cell for cell',
    (_id, a) => {
      const cells = cellsOf(a.sourceRef)
      expect(cells[0]).toBe(`\`${a.id}\``)
      expect(cells[1]).toBe(a.statement)
      expect(cells[2]).toBe(a.sourceStatus)
    },
  )

  it.each(DELIVERY_TESTS.map((t) => [t.id, t] as const))(
    '%s matches its source row cell for cell',
    (_id, t) => {
      const cells = cellsOf(t.sourceRef)
      expect(cells[0]).toBe(`\`${t.id}\``)
      expect(cells[1]).toBe(t.test)
      expect(cells[2]).toBe(t.method)
    },
  )

  it('FOUR tests against FIVE criteria — the source pairs them unevenly here', () => {
    expect(DELIVERY_TESTS).toHaveLength(4)
    expect(DELIVERY_SHAPE.acceptanceCriteria).toBe(5)
    expect(DELIVERY_SHAPE.tests).toBe(4)
    // Not a truncated transcription: the line after the last test row is not
    // a table row, so there is no `TEST-PKG-405` in the source to have missed.
    expect(srcLine(DELIVERY_LOCATORS.testLastRow + 1).startsWith('|')).toBe(false)
    expect(SOURCE_LINES.filter((l) => l.includes('TEST-PKG-405'))).toHaveLength(0)
  })
})
