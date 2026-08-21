import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { stripComments } from '../coverage/strip-comments'
import {
  FL_MATRIX_SHAPE,
  FL_TOKEN_TALLY,
  FRONTLINE_CAPABILITY_EXISTENCE,
  FRONTLINE_ROW_SURFACES,
  INVARIANT_EXCLUDED_ACTS,
  TENANT_ADMIN_OPEN_CELLS,
  controlsOnActsHeldElsewhere,
  frontlineAffordance,
  type FrontlineMatrixRow,
} from '@/frontline/matrix'
import {
  FL_FALLBACK_PATTERNS,
  fallbackPatternById,
  functionalitiesNamingNoPattern,
  patternsForModule,
} from '@/frontline/fallbacks'

/* ==================================================================== *
 * THE CELL ARITHMETIC. Three independent readings of the same tables.
 * ==================================================================== */

describe('the cell arithmetic over the twelve matrices', () => {
  // FAILS IF: a matrix is dropped, or a persona column is miscounted. Eleven
  // matrices at five columns and one at six is the source's own shape, and
  // MOD-FL-A7's sixth column ("Platform roles") is the only one.
  it('counts twelve matrices, eleven of five columns and one of six', () => {
    expect(FL_MATRIX_SHAPE).toHaveLength(12)
    expect(FL_MATRIX_SHAPE.filter((m) => m.columns === 5)).toHaveLength(11)
    const six = FL_MATRIX_SHAPE.filter((m) => m.columns === 6)
    expect(six).toHaveLength(1)
    expect(six[0]?.module).toBe('MOD-FL-A7')
  })

  // FAILS IF: a row count and its line span disagree — which is exactly what
  // a truncated transcription looks like. The span is transcribed from line
  // numbers and the count from row ordinals; a row lost from one moves only
  // one of them. Every span is n data lines for n rows, with the header one
  // line above the separator and the separator one above the first row.
  it('gives every matrix a data span exactly as long as its row count', () => {
    for (const m of FL_MATRIX_SHAPE) {
      expect(m.lastDataLine - m.firstDataLine + 1, `${m.module} data span`).toBe(m.rows)
      expect(m.separatorLine, `${m.module} separator`).toBe(m.headerLine + 1)
      expect(m.firstDataLine, `${m.module} first row`).toBe(m.separatorLine + 1)
    }
    expect(FL_MATRIX_SHAPE.reduce((n, m) => n + m.rows, 0)).toBe(106)
  })

  // THE STRONGEST COUNT CHECK IN THE BUILD, and it is a check because the
  // two sides come from different readings: `FL_MATRIX_SHAPE` is a reading
  // of the rows and `FL_TOKEN_TALLY` is a reading of the status tokens.
  //
  // FAILS IF: a row was truncated, or a cell is blank. A row count alone
  // cannot catch either — 106 rows is still 106 rows when a row lost its
  // last cell. 97 × 5 + 9 × 6 = 539, and the seven tokens sum to 539.
  it('makes rows × columns equal the token tally, exactly', () => {
    const cells = FL_MATRIX_SHAPE.reduce((n, m) => n + m.rows * m.columns, 0)
    const tokens = Object.values(FL_TOKEN_TALLY).reduce((n, v) => n + v, 0)
    expect(cells).toBe(539)
    expect(tokens).toBe(539)
    expect(cells).toBe(tokens)
  })

  // FAILS IF: the tally is edited to make the sum work. Each token's own
  // count is asserted, so a compensating pair of edits fails here even
  // though the total still reaches 539.
  it('keeps each token’s own count, so the total cannot be balanced by hand', () => {
    expect(FL_TOKEN_TALLY['Explicitly prohibited']).toBe(332)
    expect(FL_TOKEN_TALLY['Not applicable']).toBe(92)
    expect(FL_TOKEN_TALLY['Allowed']).toBe(55)
    expect(FL_TOKEN_TALLY['Allowed with conditions']).toBe(27)
    expect(FL_TOKEN_TALLY['Unavailable']).toBe(15)
    expect(FL_TOKEN_TALLY['Client Decision Required']).toBe(11)
    expect(FL_TOKEN_TALLY['Read-only']).toBe(7)
    expect(Object.keys(FL_TOKEN_TALLY)).toHaveLength(7)
  })

  // FAILS IF: the eleven open cells stop matching the eleven the tally
  // counts. Both numbers are read off the source separately — one by
  // counting `Client Decision Required` tokens, one by listing the rows —
  // and `src/routes/definitions.ts` records the question they all defer to.
  it('finds all eleven open cells, and every one of them in the Tenant Admin column', () => {
    // `.length).toBe(...)` rather than `toHaveLength(...)`: the tally lookup is
    // `number | undefined` under noUncheckedIndexedAccess. A `?? 0` would let a
    // MISSING key read as zero cells and pass quietly on a broken tally; this
    // fails loudly instead, because `undefined` is never 11.
    expect(TENANT_ADMIN_OPEN_CELLS.length).toBe(FL_TOKEN_TALLY['Client Decision Required'])
    expect(TENANT_ADMIN_OPEN_CELLS).toHaveLength(11)
    const modules = new Set(TENANT_ADMIN_OPEN_CELLS.map((c) => c.module))
    expect([...modules].sort()).toEqual([
      'MOD-FL-A1',
      'MOD-FL-A2',
      'MOD-FL-A3',
      'MOD-FL-A4',
      'MOD-FL-A7',
      'MOD-FL-B9',
    ])
    const definitions = readFileSync(join('src', 'routes', 'definitions.ts'), 'utf8')
    for (const c of TENANT_ADMIN_OPEN_CELLS) {
      expect(definitions, `${c.module} ${c.sourceRef}`).toContain(c.sourceRef)
    }
  })
})

/* ==================================================================== *
 * THE ORDER OF QUESTIONS.
 * ==================================================================== */

type Col = 'worker' | 'supervisor' | 'qualityManager'
type Id = 'cancel-run' | 'advance' | 'push-alert' | 'sign-off'

const COLUMNS: readonly Col[] = ['worker', 'supervisor', 'qualityManager']

function cell(outcome: FrontlineMatrixRow<Id, Col>['cells'][Col]['outcome'], note: string) {
  return { outcome, note, openDecision: null } as const
}

/**
 * The trap, built exactly as the source writes it: a permissive token on an
 * act another surface owns. L40369 reads `Allowed` for the Supervisor and
 * the Quality Manager and its own text says "in the Delivery Operations Hub
 * ... not here".
 */
const CANCEL_RUN: FrontlineMatrixRow<Id, Col> = {
  id: 'cancel-run',
  control: 'Cancel a Run',
  surface: 'another-surface',
  existence: 'present',
  metElsewhere: {
    where: 'another-surface',
    surface: 'SURF-DOH',
    note: 'A Supervisor cancels in their own area and a Quality Manager in any area, with a categorised reason.',
  },
  routedTo: {},
  cells: {
    worker: cell('explicitlyProhibited', 'a Delivery Operations Hub governance action'),
    supervisor: cell('allowed', 'in the Delivery Operations Hub for their own area, not here'),
    qualityManager: cell('allowed', 'in the Delivery Operations Hub for any area, not here'),
  },
  sourceRef: 'L40369',
}

const ADVANCE: FrontlineMatrixRow<Id, Col> = {
  id: 'advance',
  control: 'Advance through the authored sequence',
  surface: 'screen',
  existence: 'present',
  metElsewhere: null,
  routedTo: {},
  cells: {
    worker: cell('allowed', 'the worker drives the sequence forward'),
    supervisor: cell('notApplicable', 'no execution session'),
    qualityManager: cell('notApplicable', 'no execution session'),
  },
  sourceRef: 'L40526',
}

/** L41797 — exists nowhere for anyone: there is no push at launch. */
const PUSH_ALERT: FrontlineMatrixRow<Id, Col> = {
  id: 'push-alert',
  control: 'Receive an operating-system push alert',
  surface: 'screen',
  existence: 'not-in-scope',
  metElsewhere: null,
  routedTo: {},
  cells: {
    worker: cell('unavailable', 'there is no operating-system push at launch'),
    supervisor: cell('unavailable', 'there is no operating-system push at launch'),
    qualityManager: cell('unavailable', 'there is no operating-system push at launch'),
  },
  sourceRef: 'L41797',
}

/** L40534 — a genuine on-device control for a non-Worker: the step-up. */
const SIGN_OFF: FrontlineMatrixRow<Id, Col> = {
  id: 'sign-off',
  control: 'Authorise an authored sign-off screen',
  surface: 'screen',
  existence: 'present',
  metElsewhere: null,
  routedTo: {},
  cells: {
    worker: cell('explicitlyProhibited', 'the worker never authorises their own sign-off'),
    supervisor: cell('allowed', 'by second-identity step-up'),
    qualityManager: cell('allowed', 'by second-identity step-up'),
  },
  sourceRef: 'L40534',
}

describe('the classification decides, not the token', () => {
  // FAILS IF: a permissive token on an off-surface row draws a control. This
  // is the trap the whole ordering exists for, and the token is deliberately
  // `Allowed`.
  it('draws a cross-surface statement for a permissive cell whose act is elsewhere', () => {
    for (const col of ['supervisor', 'qualityManager'] as const) {
      const a = frontlineAffordance(CANCEL_RUN, col)
      expect(a.kind, col).toBe('cross-surface')
      if (a.kind === 'cross-surface') expect(a.surface).toBe('SURF-DOH')
    }
  })

  // FAILS IF: the token is corrected or hidden. The matrix goes on saying
  // `Allowed` with its own words; what is refused is the control.
  it('leaves the token and the cell’s own words untouched', () => {
    expect(CANCEL_RUN.cells.supervisor.outcome).toBe('allowed')
    expect(CANCEL_RUN.cells.supervisor.note).toContain('not here')
  })

  // FAILS IF: the inverse trap fires — the six genuine on-device step-up
  // cells deleted by a rule that reads "Supervisor permissive means
  // elsewhere". Without these the sign-off screen has no way to be
  // authorised at all.
  it('keeps the one non-Worker control this surface really owns', () => {
    const a = frontlineAffordance(SIGN_OFF, 'supervisor')
    expect(a.kind).toBe('control')
    if (a.kind === 'control') expect(a.note).toContain('step-up')
  })

  // FAILS IF: a capability that exists nowhere renders as a disabled control
  // or as an empty region. The stated line names WHAT would sit here and WHY
  // it does not, and says there is nothing to come back to.
  it('renders a capability that exists nowhere as a stated line, not a control', () => {
    const a = frontlineAffordance(PUSH_ALERT, 'worker')
    expect(a.kind).toBe('stated-line')
    if (a.kind === 'stated-line') {
      expect(a.existence).toBe('not-in-scope')
      expect(a.line).toContain('no control is drawn here')
      expect(a.line).toContain('nothing to come back to')
      expect(a.line).toContain('Receive an operating-system push alert')
    }
  })

  // FAILS IF: the two senses of `Unavailable` are collapsed. L42114 and
  // L42120 are six rows apart in one matrix and render oppositely — one has
  // a route back at the next sync and the other never will.
  it('tells the two senses of Unavailable apart by existence, not by token', () => {
    const offlineOnly = { ...PUSH_ALERT, existence: 'absent-under-condition' as const }
    const a = frontlineAffordance(offlineOnly, 'worker')
    const b = frontlineAffordance(PUSH_ALERT, 'worker')
    expect(a.kind).toBe('stated-line')
    expect(b.kind).toBe('stated-line')
    if (a.kind === 'stated-line' && b.kind === 'stated-line') {
      expect(a.line).toContain('returns when that condition lifts')
      expect(b.line).not.toContain('returns when that condition lifts')
    }
    expect(offlineOnly.cells.worker.outcome).toBe(PUSH_ALERT.cells.worker.outcome)
  })

  // FAILS IF: a row is classified away from this screen and names nowhere to
  // send a reader. A cross-surface claim with no surface is a dead end
  // dressed as a disclosure.
  it('refuses a row that leaves this screen and names nowhere to go', () => {
    const orphan = { ...CANCEL_RUN, metElsewhere: null }
    expect(() => frontlineAffordance(orphan, 'supervisor')).toThrow(/names nowhere/)
  })

  // FAILS IF: the ordinary case stops working. A Worker's own act on this
  // screen is a control and nothing above intercepts it.
  it('draws the worker’s own act as a control', () => {
    const a = frontlineAffordance(ADVANCE, 'worker')
    expect(a.kind).toBe('control')
    expect(frontlineAffordance(ADVANCE, 'supervisor').kind).toBe('refusal')
  })
})

describe('the gate over the whole matrix', () => {
  // FAILS IF: a control lands on a row whose act is held elsewhere. Both
  // defect shapes are covered: the off-surface row that draws one, and the
  // invariant-excluded act classified onto this screen — which is the shape
  // that actually ships, because the button follows honestly from a wrong
  // classification.
  it('finds no control on an act held elsewhere, and names one when it is planted', () => {
    expect(controlsOnActsHeldElsewhere([CANCEL_RUN, ADVANCE, SIGN_OFF], COLUMNS)).toEqual([])

    const misclassified = { ...CANCEL_RUN, surface: 'screen' as const, metElsewhere: null }
    const offenders = controlsOnActsHeldElsewhere([misclassified], COLUMNS)
    expect(offenders.length).toBeGreaterThan(0)
    expect(offenders[0]).toContain('EXCL-FL-06')
    expect(offenders[0]).toContain('cancel-run')
  })

  // FAILS IF: the invariant list stops covering the three acts the source
  // makes invariant exclusions. Six cells across three matrices carry a
  // permissive token for these.
  it('names the three invariant-excluded acts with their lines', () => {
    expect(INVARIANT_EXCLUDED_ACTS).toHaveLength(3)
    for (const a of INVARIANT_EXCLUDED_ACTS) {
      expect(a.sourceRef, a.act).toContain('EXCL-FL-06 L39489')
    }
  })
})

describe('what this surface cannot express', () => {
  // FAILS IF: a `disabled` rendering is added to the matrix axis. A deferred
  // or non-existent capability renders as no control plus a stated line —
  // not a disabled control, not an empty region. A disabled control is
  // legitimate elsewhere in this build; here it is untypeable.
  it('has no disabled member anywhere in the rendering union', () => {
    const src = readFileSync(join('src', 'frontline', 'matrix.ts'), 'utf8')
    // Comment-stripped, for the reason `tests/coverage/contract-gates.test.ts`
    // strips: the union's own doc comment NAMES the disabled control in order
    // to forbid it, and a gate written against raw source would fail on
    // correct code.
    const stripped = stripComments(src)
    const start = stripped.indexOf('export type FrontlineAffordance')
    const union = stripped.slice(start, stripped.indexOf('export function', start))
    expect(union.length).toBeGreaterThan(200)
    expect(union).not.toMatch(/disabled/i)
  })

  // FAILS IF: a fourth classification is added without a rendering, or the
  // vocabulary of existence is widened silently.
  it('closes both classification vocabularies', () => {
    expect(FRONTLINE_ROW_SURFACES).toHaveLength(4)
    expect(FRONTLINE_CAPABILITY_EXISTENCE).toHaveLength(4)
    expect([...FRONTLINE_ROW_SURFACES]).toContain('another-destination')
  })
})

/* ==================================================================== *
 * THE FB-FL-* LIBRARY.
 * ==================================================================== */

describe('the fallback pattern library', () => {
  // FAILS IF: a pattern is dropped. Fourteen patterns at L40098-L40124 and a
  // fourteen-row module map at L40130-L40143 — two readings of one library.
  it('carries fourteen patterns, each mapped to at least one module', () => {
    expect(FL_FALLBACK_PATTERNS).toHaveLength(14)
    for (const p of FL_FALLBACK_PATTERNS) {
      expect(p.primaryModules.length, p.id).toBeGreaterThan(0)
      expect(p.sourceRef, p.id).toMatch(/^L40\d{3} \(pattern\), L401\d{2} \(map\)$/)
    }
  })

  // FAILS IF: a pattern loses its terminal safe state. AC-FL-011-2 (L40152)
  // requires "a bounded exit into a named terminal safe state" on every
  // retry path — the plan said these tails could not be quoted because the
  // source truncates them, and the source does not truncate them.
  it('names a terminal safe state on every pattern', () => {
    for (const p of FL_FALLBACK_PATTERNS) {
      expect(p.terminalSafeState.length, p.id).toBeGreaterThan(40)
      expect(p.criticality.length, p.id).toBeGreaterThan(3)
    }
  })

  // FAILS IF: the map is read one way only. `patternsForModule` is derived
  // from the pattern rows rather than transcribed a second time, so the two
  // directions cannot disagree.
  it('reads the module map in both directions consistently', () => {
    for (const p of FL_FALLBACK_PATTERNS) {
      for (const m of p.primaryModules) {
        expect(patternsForModule(m).map((x) => x.id), `${p.id}/${m}`).toContain(p.id)
      }
    }
    expect(patternsForModule('MOD-FL-A6')).toHaveLength(8)
    expect(patternsForModule('MOD-FL-A5').map((p) => p.id)).toContain('FB-FL-SEV1-01')
    expect(fallbackPatternById('FB-FL-SEV1-01').criticality).toBe('maximum')
  })

  // FAILS IF: AC-FL-011-1's rule stops being checkable. 181 functionalities
  // are counted in this chapter, so a rule a reviewer checks by eye is a
  // rule nobody checks.
  it('reports a functionality that names no pattern', () => {
    expect(
      functionalitiesNamingNoPattern([
        { id: 'FUNC-FL-A5-001', patterns: ['FB-FL-SEV1-01'] },
        { id: 'FUNC-FL-A5-002', patterns: [] },
      ]),
    ).toEqual(['FUNC-FL-A5-002'])
  })
})
