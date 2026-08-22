import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { SURFACES, type SurfaceId } from '@/domain/surfaces'
import {
  CONVERGENCE_COLUMNS,
  CONVERGENCE_LOCATORS,
  CONVERGENCE_OBLIGATIONS,
  CONVERGENCE_VERDICTS,
  type ObservedDifference,
  classifyDifference,
  compareSession,
  convergenceObligation,
  expectsNoDivergence,
} from '@/offline/convergence'

/**
 * THE FROZEN SOURCE IS THE GROUND TRUTH, not the constant under test. The
 * obligation table is re-read and re-split from L80670-L80674 on every run, and
 * the rule the third verdict turns on is re-read from L80658, so a rewording in
 * `@/offline/convergence` goes red against a source that still says the old
 * thing.
 */
const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')

/** `SOURCE_LINES` is 0-based; every citation in this build is 1-based `L<n>`. */
const sourceLine = (n: number): string => SOURCE_LINES[n - 1] ?? ''

const cellsOf = (n: number): readonly string[] =>
  sourceLine(n)
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim())

/** One cell by its column index in the header, never `undefined` in a check. */
const cell = (n: number, column: number): string => cellsOf(n)[column] ?? ''

const TABLE_FIRST_ROW = 80670
const TABLE_LAST_ROW = 80674

describe('the convergence obligation table, against the frozen source', () => {
  it('the header this build transcribed carries the four columns, in order', () => {
    // The header line comes from the module, so a wrong locator there is red.
    expect(cellsOf(CONVERGENCE_LOCATORS.obligationHeader)).toEqual([...CONVERGENCE_COLUMNS])
    expect(cellsOf(CONVERGENCE_LOCATORS.obligationHeader)).toEqual([
      'Surface',
      'What it must agree on',
      'Expected divergence, displayed',
      'Unexplained divergence, a defect',
    ])
  })

  it('the body is five data rows, not three, and the separator is not one of them', () => {
    const header = CONVERGENCE_LOCATORS.obligationHeader
    expect(sourceLine(header + 1)).toMatch(/^\|(?:---\|){4}$/)
    expect(TABLE_FIRST_ROW).toBe(header + 2)
    expect(TABLE_LAST_ROW - TABLE_FIRST_ROW + 1).toBe(5)
    expect(CONVERGENCE_OBLIGATIONS).toHaveLength(5)
    expect(sourceLine(TABLE_LAST_ROW + 1).startsWith('|')).toBe(false)
    // The two rows a three-surface reading would have dropped.
    expect(cell(80673, 0)).toBe('Frontline Worker Application')
    expect(cell(80674, 0)).toBe('Super Admin platform console')
    // And the step itself is named for five.
    expect(sourceLine(79965)).toContain('Five-surface convergence validation')
  })

  it('every shipped row matches its source line cell for cell', () => {
    expect(CONVERGENCE_OBLIGATIONS.map((o) => o.line)).toEqual([80670, 80671, 80672, 80673, 80674])
    for (const shipped of CONVERGENCE_OBLIGATIONS) {
      expect(CONVERGENCE_COLUMNS.map((c) => shipped.cells[c])).toEqual(cellsOf(shipped.line))
    }
  })

  it('the five rows key onto the five surface ids already settled, one each', () => {
    const ids = CONVERGENCE_OBLIGATIONS.map((o) => o.surface)
    expect(new Set(ids).size).toBe(5)
    expect([...ids].sort()).toEqual(SURFACES.map((s) => s.id).sort())
    // Keyed by the source's own name in the row, never by row position: the
    // table's order is not `SURFACES`' order and reading it positionally would
    // give the Hub the console's obligations.
    for (const shipped of CONVERGENCE_OBLIGATIONS) {
      expect(shipped.cells.Surface).toBe(cell(shipped.line, 0))
    }
    expect(convergenceObligation('SURF-SA').cells.Surface).toBe('Super Admin platform console')
    expect(convergenceObligation('SURF-DOH').cells.Surface).toBe('Delivery Operations Hub')
  })
})

describe('the rule the third verdict turns on', () => {
  it('the line this module names as the rule really carries the rule', () => {
    expect(sourceLine(CONVERGENCE_LOCATORS.displayRule)).toContain(
      'a difference that is expected but not shown is an unexplained difference for this purpose',
    )
    expect(sourceLine(CONVERGENCE_LOCATORS.displayRule)).toContain(
      'the honesty rule is about what the user sees, not about what the platform knows',
    )
  })

  it('the three verdicts are the three the source names, distinct and whole', () => {
    expect(sourceLine(CONVERGENCE_LOCATORS.threeOutcomes)).toContain(
      'It shows three outcomes rather than two: agreement, honest divergence, and unexplained divergence.',
    )
    expect([...CONVERGENCE_VERDICTS]).toEqual([
      'converged',
      'honest divergence',
      'unexplained divergence',
    ])
    // `honest divergence` and `unexplained divergence` share a word, so every
    // assertion in this file compares whole strings with `toBe`. Asserted, not
    // just intended: neither is a substring of the other.
    expect('unexplained divergence'.includes('honest divergence')).toBe(false)
    expect('honest divergence'.includes('unexplained divergence')).toBe(false)
  })

  it('expected AND displayed is the only honest divergence', () => {
    const base = { surface: 'SURF-CC' as const, what: 'three devices shown offline' }
    expect(classifyDifference({ ...base, expected: true, displayed: true })).toBe(
      'honest divergence',
    )
    // THE RULE. A stated divergence the surface is quietly not showing is a
    // failure, not a pass, and it is the full failure verdict rather than a
    // lesser one.
    expect(classifyDifference({ ...base, expected: true, displayed: false })).toBe(
      'unexplained divergence',
    )
    expect(classifyDifference({ ...base, expected: false, displayed: true })).toBe(
      'unexplained divergence',
    )
    expect(classifyDifference({ ...base, expected: false, displayed: false })).toBe(
      'unexplained divergence',
    )
  })

  it('the Hub admits no expected divergence, so its own row overrules the claim', () => {
    expect(cell(80670, 2)).toContain('Not applicable')
    expect(expectsNoDivergence('SURF-DOH')).toBe(true)
    for (const other of ['SURF-STU', 'SURF-CC', 'SURF-FL', 'SURF-SA'] as const) {
      expect(expectsNoDivergence(other)).toBe(false)
    }
    // Claimed expected AND displayed, and still unexplained, because the table
    // says the Hub has nothing to be excused for: it is the reference.
    expect(
      classifyDifference({
        surface: 'SURF-DOH',
        expected: true,
        displayed: true,
        what: 'an accepted capture absent from the record',
      }),
    ).toBe('unexplained divergence')
  })
})

describe('the session outcome', () => {
  const honest = (surface: SurfaceId, what: string): ObservedDifference => ({
    surface,
    expected: true,
    displayed: true,
    what,
  })

  it('no differences at all is converged', () => {
    const outcome = compareSession([])
    expect(outcome.verdict).toBe('converged')
    expect(outcome.converged).toBe(true)
    expect(outcome.exceptions).toEqual([])
    expect(outcome.exceptionOwner).toBeNull()
  })

  it('honest divergence is a pass, and the session still converges', () => {
    expect(sourceLine(CONVERGENCE_LOCATORS.sessionConverged)).toContain(
      'All five obligations satisfied or divergence honestly displayed; session marked converged',
    )
    const outcome = compareSession([
      honest('SURF-CC', 'two of nine devices offline with pending counts'),
      honest('SURF-STU', 'a version published after the run started'),
      honest('SURF-FL', 'commands not yet delivered because the device was offline'),
    ])
    expect(outcome.verdict).toBe('honest divergence')
    expect(outcome.converged).toBe(true)
    expect(outcome.exceptions).toEqual([])
    expect(outcome.exceptionOwner).toBeNull()
  })

  it('one quiet expected difference among honest ones fails the whole session', () => {
    expect(sourceLine(CONVERGENCE_LOCATORS.sessionNotConverged)).toContain(
      'Session marked not converged; no surface claims otherwise',
    )
    expect(sourceLine(CONVERGENCE_LOCATORS.exceptionRaised)).toContain(
      "Unexplained differences raise a convergence exception to the client's platform team, and the session is marked not converged.",
    )
    const quiet: ObservedDifference = {
      surface: 'SURF-CC',
      expected: true,
      displayed: false,
      what: 'a tile still showing 13:58 at 14:56',
    }
    const outcome = compareSession([
      honest('SURF-STU', 'a version published after the run started'),
      quiet,
      honest('SURF-FL', 'commands not yet delivered because the device was offline'),
    ])
    expect(outcome.verdict).toBe('unexplained divergence')
    expect(outcome.converged).toBe(false)
    // Only the quiet one is an exception; the honest two are not swept in.
    expect(outcome.exceptions).toEqual([quiet])
    expect(outcome.exceptionOwner).toBe("the client's platform team")
  })

  it('the fallback contract states the same invariant this comparator enforces', () => {
    // `FB-SYNC-06` (L80676) lists it among the invariants of convergence.
    expect(sourceLine(CONVERGENCE_LOCATORS.fallbackInvariant)).toContain(
      'every expected divergence is actually displayed',
    )
  })
})
