import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import {
  EXPIRY_HORIZON,
  QUEUED_REQUEST_STATES,
  QUEUED_REQUEST_STATE_IDS,
  stateRecord,
  type QueuedRequestStateId,
} from '@/ai/requests/states'
import {
  QUEUED_REQUEST_TRANSITIONS,
  STATE_SET_RULES,
  matchState,
  observeState,
  transitionsFrom,
  transitionsInto,
} from '@/ai/requests/machine'
import {
  QUEUED_REQUEST_SURFACE_COLUMNS,
  QUEUED_REQUEST_SURFACE_IDS,
  QUEUED_REQUEST_SURFACE_MATRIX,
  SURFACE_COLUMN_HEADINGS,
  cellAt,
  cellText,
} from '@/ai/requests/surface-matrix'
import { SURFACES, surfaceById } from '@/domain/surfaces'
import * as statesModule from '@/ai/requests/states'
import * as machineModule from '@/ai/requests/machine'
import * as matrixModule from '@/ai/requests/surface-matrix'
import { decisionRecord } from '@/disclosure/decisions'

/**
 * Slice 11, wave 0, task 5 — the queued artificial-intelligence request state
 * machine and its state-to-surface matrix.
 *
 * WHAT THIS FILE IS FOR. Section 42.6 of the frozen source defines a state set
 * whose whole point is that its vocabulary must not collapse: "sent" and
 * "answered" are not the same thing, and a worker told the wrong one makes the
 * wrong decision. So nothing here is asserted against the brief. Every string,
 * every terminal flag, every matrix cell and every transition is re-derived
 * from the frozen bytes at run time and compared with what the modules ship.
 *
 * THE ROW COUNTS ARE COUNTED, NEVER INFERRED FROM A SPAN. Both dispatch briefs
 * gave the matrix rows as L89698-L89709. Measured, the contiguous data rows run
 * L89697-L89708: L89695 is the header, L89696 the separator, and the brief's
 * span runs one line past the last row onto a blank. Every span below is
 * re-measured by walking pipe-prefixed lines under a header rather than by
 * trusting a number.
 *
 * THE ONE THE BRIEFS BOTH GOT WRONG ABOUT CONTENT. Both say the Studio column
 * reads `Not applicable — authoring surface` on every row. It does not: the
 * `saved locally` row reads `Not applicable — the Studio authors content,
 * it does not observe runtime requests`. A gate asserting one uniform string
 * would have forced the shipped data to carry the wrong reason for that row, so
 * the Studio check asserts per-row equality with the source cell instead of
 * uniformity.
 */

const SOURCE_PATH =
  join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const SOURCE_BYTES = readFileSync(SOURCE_PATH)
const LINES: readonly string[] = [
  '',
  ...SOURCE_BYTES.toString('utf8').replace(/\n$/, '').split('\n'),
]
const L = (n: number): string => LINES[n] ?? ''

/** The contiguous run of data rows under a header line, separator excluded. */
const dataRowsUnder = (header: number): readonly number[] => {
  const rows: number[] = []
  for (let n = header + 1; L(n).startsWith('|'); n += 1) {
    if (/^\|[\s|:-]+\|$/.test(L(n))) continue
    rows.push(n)
  }
  return rows
}

/** The cells of one markdown table row, trimmed, outer pipes discarded. */
const cellsOf = (n: number): readonly string[] =>
  L(n)
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim())

const STATES_HEADER = 89624
const MATRIX_HEADER = 89695
const RULES_FIRST = 89641
const MERMAID_OPEN = 89648
const MERMAID_CLOSE = 89683

it('reads the frozen source these measurements were taken against', () => {
  expect(createHash('sha256').update(SOURCE_BYTES).digest('hex')).toBe(SOURCE_SHA)
  expect(LINES.length - 1).toBe(122241)
})

/* ==================================================================== *
 * THE STATE SET.
 * ==================================================================== */

describe('the state set is transcribed from the frozen table, row by row', () => {
  const rows = dataRowsUnder(STATES_HEADER)

  it('finds the table where section 42.6 puts it, and counts its rows', () => {
    // L89614 — "## 42.6 The Queued Artificial-Intelligence Request State Set"
    expect(L(89614)).toContain('42.6 The Queued Artificial-Intelligence Request State Set')
    expect(cellsOf(STATES_HEADER)).toEqual([
      'State',
      'Meaning',
      'Worker-visible text',
      'Terminal',
      'Classification',
    ])
    // Counted by walking the rows, not taken from the brief's span.
    expect(rows[0]).toBe(89626)
    expect(rows[rows.length - 1]).toBe(89637)
    expect(QUEUED_REQUEST_STATE_IDS.length).toBe(rows.length)
    expect(QUEUED_REQUEST_STATES.length).toBe(rows.length)
  })

  it('ships the state names in the source order the table gives them', () => {
    const fromSource = rows.map((n) => cellsOf(n)[0]?.replace(/`/g, '') ?? '')
    expect([...QUEUED_REQUEST_STATE_IDS]).toEqual(fromSource)
  })

  it('ships every meaning, terminal cell and classification cell verbatim', () => {
    for (const [index, line] of rows.entries()) {
      const cells = cellsOf(line)
      const record = QUEUED_REQUEST_STATES[index]
      expect(record, `no record for source row ${line}`).toBeDefined()
      expect(record?.locator).toBe(`L${line}`)
      expect(record?.meaning).toBe(cells[1])
      expect(record?.terminal.cell).toBe(cells[3])
      expect(record?.classification).toBe(cells[4])
    }
  })

  it('ships every worker-visible cell verbatim, and reconciled is not worker-visible', () => {
    for (const [index, line] of rows.entries()) {
      const cells = cellsOf(line)
      const record = QUEUED_REQUEST_STATES[index]
      const visibility = record?.workerVisibility
      expect(visibility?.cell, `worker-visible cell for source row ${line}`).toBe(cells[2])
    }
    // L89637 — "Not worker-visible; appears in the record". The cell in the
    // worker-visible column says the state is NOT worker-visible, so a reader
    // that renders `.cell` as a status chip would print that sentence to a
    // worker. The union forces the case to be handled.
    const reconciled = stateRecord('reconciled').workerVisibility
    expect(reconciled.kind).toBe('not-worker-visible')
    expect(reconciled.cell).toBe('Not worker-visible; appears in the record')
    const others = QUEUED_REQUEST_STATES.filter((s) => s.id !== 'reconciled')
    expect(others.every((s) => s.workerVisibility.kind === 'worker-visible')).toBe(true)
    expect(others.length).toBeGreaterThan(0)
  })

  it('holds the terminal boolean and the terminal cell in agreement, exceptions included', () => {
    for (const record of QUEUED_REQUEST_STATES) {
      expect(record.terminal.terminal).toBe(record.terminal.cell.startsWith('Yes'))
    }
    // L89633 — "Yes, with the answer retained": terminal, and the answer is
    // kept, which rule 2 at L89642 is the reason for.
    expect(stateRecord('stale').terminal).toEqual({
      terminal: true,
      cell: 'Yes, with the answer retained',
    })
    expect(stateRecord('expired').terminal).toEqual({ terminal: true, cell: 'Yes' })
    expect(stateRecord('uploaded').terminal).toEqual({ terminal: false, cell: 'No' })
  })
})

describe('the expiry horizon is unset and carries its decision instead of a number', () => {
  it('names DEC-AISTALE-001 on the expired row and nowhere else', () => {
    // L89634 — "`Client Decision Required` — horizon is `DEC-AISTALE-001`"
    expect(stateRecord('expired').classification).toBe(
      '`Client Decision Required` — horizon is `DEC-AISTALE-001`',
    )
    const carriers = QUEUED_REQUEST_STATES.filter((s) => s.horizonDecision !== null)
    expect(carriers.map((s) => s.id)).toEqual(['expired'])
    expect(stateRecord('expired').horizonDecision).toBe('DEC-AISTALE-001')
  })

  it('seeds no value, and defers to the canon rather than restating it', () => {
    expect(EXPIRY_HORIZON.set).toBe(false)
    expect(EXPIRY_HORIZON.decision).toBe('DEC-AISTALE-001')
    // AC-43-112 at L90039 — no governing value gets a code-level default that
    // would apply silently. The refusal text is the canon's, not a copy.
    expect(EXPIRY_HORIZON.disclosure).toBe(decisionRecord('DEC-AISTALE-001').adopted)
    expect(EXPIRY_HORIZON.disclosure).toContain('Not yet set — client decision DEC-AISTALE-001')
  })

  it('holds no numeric literal anywhere in the state module that could be read as a horizon', () => {
    const text = readFileSync('src/ai/requests/states.ts', 'utf8')
    const code = text
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
      .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    expect(code).not.toMatch(/\b\d+\b/)
  })
})

/* ==================================================================== *
 * RULE 4 AS AN API CONSTRAINT, NOT A COMMENT.
 * ==================================================================== */

describe('no state may be inferred from the absence of another', () => {
  it('quotes the rule from the frozen source', () => {
    // L89644 — "No state may be inferred from the absence of another. A request
    // that is `uploaded` is not `processing` until the server says so."
    expect(L(89644)).toContain('No state may be inferred from the absence of another')
  })

  it('exports no predicate a reader could negate to name a state', () => {
    const exported = [
      ...Object.keys(statesModule),
      ...Object.keys(machineModule),
      ...Object.keys(matrixModule),
    ]
    expect(exported.length).toBeGreaterThan(0)
    // A membership check over a literal list of forbidden shapes, proved by
    // ADDING to it: `isUploaded`, `hasAnswer`, `notYetUploaded` and friends are
    // exactly how "not uploaded" quietly becomes "waiting for connection".
    const forbidden = exported.filter((name) =>
      /^(is|has|was|not|no|awaiting|pending)[A-Z]/.test(name),
    )
    expect(forbidden).toEqual([])
  })

  it('exposes no nameable field on an observed state', () => {
    const state = observeState('uploaded')
    // The state id is keyed by a `unique symbol` the machine module does not
    // export, so there is no name for it outside. `pnpm typecheck` is the
    // assertion: remove the directive below and the build stops.
    // @ts-expect-error an observed state carries no readable property
    expect(state.id).toBeUndefined()
    expect(Object.keys(state)).toEqual([])
    expect(observeState('uploaded')).toBe(state)
  })

  it('gives an observed state exactly one reader, and it must name every state', () => {
    const seen: QueuedRequestStateId[] = []
    for (const id of QUEUED_REQUEST_STATE_IDS) {
      const named = matchState(observeState(id), {
        'saved locally': (r) => r.id,
        'waiting for connection': (r) => r.id,
        uploaded: (r) => r.id,
        revalidating: (r) => r.id,
        processing: (r) => r.id,
        'pending human review': (r) => r.id,
        'answer available': (r) => r.id,
        stale: (r) => r.id,
        expired: (r) => r.id,
        cancelled: (r) => r.id,
        failed: (r) => r.id,
        reconciled: (r) => r.id,
      })
      expect(named).toBe(id)
      seen.push(named)
    }
    expect(seen).toEqual([...QUEUED_REQUEST_STATE_IDS])
  })

  it('rejects a handler map that leaves a state unnamed', () => {
    const partial = {
      'saved locally': () => 'x',
      'waiting for connection': () => 'x',
      uploaded: () => 'x',
      revalidating: () => 'x',
      processing: () => 'x',
      'pending human review': () => 'x',
      'answer available': () => 'x',
      stale: () => 'x',
      expired: () => 'x',
      cancelled: () => 'x',
      failed: () => 'x',
      // `reconciled` deliberately absent. `pnpm typecheck` is the assertion:
      // remove the directive below and the build stops.
    }
    // @ts-expect-error a handler map missing a state is not a total match
    expect(() => matchState(observeState('reconciled'), partial)).toThrow()
  })

  it('hands each branch the record, so a branch cannot invent its own wording', () => {
    const text = matchState(observeState('uploaded'), {
      'saved locally': (r) => r.workerVisibility.cell,
      'waiting for connection': (r) => r.workerVisibility.cell,
      uploaded: (r) => r.workerVisibility.cell,
      revalidating: (r) => r.workerVisibility.cell,
      processing: (r) => r.workerVisibility.cell,
      'pending human review': (r) => r.workerVisibility.cell,
      'answer available': (r) => r.workerVisibility.cell,
      stale: (r) => r.workerVisibility.cell,
      expired: (r) => r.workerVisibility.cell,
      cancelled: (r) => r.workerVisibility.cell,
      failed: (r) => r.workerVisibility.cell,
      reconciled: (r) => r.workerVisibility.cell,
    })
    // L89628 — "Sent to the platform". Never "answered": AC-42-602 at L89715.
    expect(text).toBe('Sent to the platform')
    expect(text).not.toContain('Answer')
  })
})

/* ==================================================================== *
 * THE SIX RULES AND THE TRANSITION GRAPH.
 * ==================================================================== */

describe('the rules that bind the state set', () => {
  const ruleLines: number[] = []
  for (let n = RULES_FIRST; /^\d+\. /.test(L(n)); n += 1) ruleLines.push(n)

  it('ships every rule verbatim at the line it is written on', () => {
    expect(ruleLines[0]).toBe(89641)
    expect(STATE_SET_RULES.length).toBe(ruleLines.length)
    for (const [index, line] of ruleLines.entries()) {
      const rule = STATE_SET_RULES[index]
      expect(rule?.locator).toBe(`L${line}`)
      expect(rule?.text).toBe(L(line).replace(/^\d+\. /, ''))
    }
  })
})

describe('the transition graph is the diagram, edge for edge', () => {
  const edges = (() => {
    const out: { from: string; to: string; trigger: string }[] = []
    for (let n = MERMAID_OPEN + 1; n < MERMAID_CLOSE; n += 1) {
      const m = /^\s*(\w+) --> (\w+) : (.+)$/.exec(L(n))
      if (m) out.push({ from: m[1]!, to: m[2]!, trigger: m[3]! })
    }
    return out
  })()

  it('finds the diagram fence where section 42.6 puts it', () => {
    expect(L(MERMAID_OPEN)).toBe('```mermaid')
    expect(L(MERMAID_CLOSE)).toBe('```')
    expect(edges.length).toBeGreaterThan(0)
  })

  it('ships every labelled edge and invents none', () => {
    const shipped = QUEUED_REQUEST_TRANSITIONS.map((t) => `${t.from}|${t.to}|${t.trigger}`)
    const pascal = (id: string): string =>
      id
        .split(' ')
        .map((w) => w[0]!.toUpperCase() + w.slice(1))
        .join('')
    const measured = edges.map((e) => `${e.from}|${e.to}|${e.trigger}`)
    expect(
      QUEUED_REQUEST_TRANSITIONS.map((t) => `${pascal(t.from)}|${pascal(t.to)}|${t.trigger}`),
    ).toEqual(measured)
    expect(shipped.length).toBe(measured.length)
    for (const t of QUEUED_REQUEST_TRANSITIONS) {
      expect(L(Number(t.locator.slice(1)))).toContain(t.trigger)
    }
  })

  it('makes rule 5 structural: every other terminal state transitions into reconciled', () => {
    // L89645 — "`reconciled` is the only state that guarantees the request
    // appears in the execution record; every other terminal state must
    // transition into it."
    const terminalsBesidesReconciled = QUEUED_REQUEST_STATES.filter(
      (s) => s.terminal.terminal && s.id !== 'reconciled',
    ).map((s) => s.id)
    expect(terminalsBesidesReconciled.length).toBeGreaterThan(0)
    for (const id of terminalsBesidesReconciled) {
      expect(transitionsFrom(id).map((t) => t.to)).toContain('reconciled')
    }
    expect(transitionsFrom('reconciled')).toEqual([])
    // `answer available` is not terminal and still folds into the record, so
    // the predecessors of `reconciled` are a superset of the terminals.
    expect(transitionsInto('reconciled').map((t) => t.from)).toContain('answer available')
  })

  it('reaches every state from the entry state, so no state is stranded', () => {
    const reached = new Set<QueuedRequestStateId>(['saved locally'])
    for (let pass = 0; pass < QUEUED_REQUEST_STATE_IDS.length; pass += 1) {
      for (const t of QUEUED_REQUEST_TRANSITIONS) {
        if (reached.has(t.from)) reached.add(t.to)
      }
    }
    expect([...reached].sort()).toEqual([...QUEUED_REQUEST_STATE_IDS].sort())
  })
})

/* ==================================================================== *
 * THE STATE-TO-SURFACE MATRIX.
 * ==================================================================== */

describe('the state-to-surface matrix is transcribed cell by cell', () => {
  const rows = dataRowsUnder(MATRIX_HEADER)

  it('counts the matrix rows rather than taking the brief span', () => {
    // Both briefs give L89698-L89709. Measured, the rows are L89697-L89708.
    expect(rows[0]).toBe(89697)
    expect(rows[rows.length - 1]).toBe(89708)
    expect(L(89696)).toMatch(/^\|[\s|:-]+\|$/)
    expect(L(89709).trim()).toBe('')
    expect(QUEUED_REQUEST_SURFACE_MATRIX.length).toBe(rows.length)
  })

  it('ships the column headings the source writes', () => {
    expect([...SURFACE_COLUMN_HEADINGS]).toEqual(cellsOf(MATRIX_HEADER).slice(1))
    expect(QUEUED_REQUEST_SURFACE_IDS.length).toBe(SURFACE_COLUMN_HEADINGS.length)
  })

  /**
   * THE FIVE COLUMNS ARE THE FIVE SURFACES, NOT FIVE STRINGS THAT MATCH THEM.
   * The matrix used to declare its own five-value axis from scratch, which
   * made it the third such vocabulary in the repo after `SurfaceId` and
   * `JOURNEY_SURFACES`. It now carries the canonical identifier per column,
   * with the same two compile-time exhaustiveness checks `journey.ts` uses;
   * this is the runtime half — the binding is a bijection onto `SURFACES`, so
   * neither a duplicate nor a missing surface can hide behind five columns.
   *
   * The HEADING is deliberately not asserted equal to the canonical surface
   * name: the source writes `Super Admin platform console` where `SURFACES`
   * writes `Super Admin Platform Console`, and the transcription wins.
   */
  it('binds each column to a platform surface, one column per surface', () => {
    const bound = QUEUED_REQUEST_SURFACE_COLUMNS.map((c) => c.surfaceId)
    expect(new Set(bound).size).toBe(bound.length)
    expect([...bound].sort()).toEqual(SURFACES.map((s) => s.id).sort())
    expect(QUEUED_REQUEST_SURFACE_COLUMNS.map((c) => c.id)).toEqual([
      ...QUEUED_REQUEST_SURFACE_IDS,
    ])
    for (const column of QUEUED_REQUEST_SURFACE_COLUMNS) {
      expect(surfaceById(column.surfaceId).id, column.id).toBe(column.surfaceId)
    }
  })

  it('renders every cell back to the exact source text', () => {
    for (const [index, line] of rows.entries()) {
      const cells = cellsOf(line)
      const row = QUEUED_REQUEST_SURFACE_MATRIX[index]
      expect(row?.state).toBe(cells[0]?.replace(/`/g, ''))
      expect(row?.locator).toBe(`L${line}`)
      for (const [column, surface] of QUEUED_REQUEST_SURFACE_IDS.entries()) {
        expect(
          cellText(cellAt(row!.state, surface)),
          `${row!.state} / ${surface} at L${line}`,
        ).toBe(cells[column + 1])
      }
    }
  })

  it('renders the Studio absence with its own reason on every row, never empty', () => {
    for (const [index, line] of rows.entries()) {
      const cell = cellAt(QUEUED_REQUEST_SURFACE_MATRIX[index]!.state, 'studio')
      expect(cell.disposition).toBe('not applicable')
      if (cell.disposition !== 'not applicable') throw new Error('unreachable')
      expect(cell.reason.length, `empty Studio reason at L${line}`).toBeGreaterThan(0)
      expect(cellText(cell)).toBe(cellsOf(line)[4])
    }
    // Both briefs say the column is uniform. It is not: the first row carries a
    // longer reason of its own, and asserting uniformity would have shipped the
    // wrong reason there.
    const reasons = new Set(
      QUEUED_REQUEST_SURFACE_MATRIX.map((r) => {
        const c = cellAt(r.state, 'studio')
        return c.disposition === 'not applicable' ? c.reason : ''
      }),
    )
    expect(reasons.size).toBeGreaterThan(1)
    expect(reasons.has('the Studio authors content, it does not observe runtime requests')).toBe(
      true,
    )
    expect(reasons.has('authoring surface')).toBe(true)
  })

  it('keeps every platform-console condition distinct instead of collapsing them', () => {
    for (const [index, line] of rows.entries()) {
      const cell = cellAt(QUEUED_REQUEST_SURFACE_MATRIX[index]!.state, 'super-admin')
      expect(cellText(cell), `super-admin cell at L${line}`).toBe(cellsOf(line)[5])
    }
    // AC-42-605 at L89718 — counts, rates and latencies without content. The
    // conditions the source writes are not one sentence repeated; a build that
    // collapsed them to "aggregate only" would lose the boundary each one draws.
    const conditions = QUEUED_REQUEST_SURFACE_MATRIX.map((r) => {
      const c = cellAt(r.state, 'super-admin')
      return c.disposition === 'allowed with conditions' ? c.condition : null
    }).filter((c): c is string => c !== null)
    expect(new Set(conditions).size).toBeGreaterThan(1)
    expect(conditions).toContain('visible only as device queue depth, never content')
    // L89702 — "gate mechanism observed, never the decision". The task brief
    // quotes this as "never the content"; the source says "never the decision".
    expect(conditions).toContain('gate mechanism observed, never the decision')
    expect(conditions).not.toContain('gate mechanism observed, never the content')
  })

  it('leaves the gate, the cancellation and the reconciliation off the device', () => {
    // The three cells that put another surface's act into this machine.
    // L89702 — "Allowed — the gate is exercised here"
    expect(cellText(cellAt('pending human review', 'command-center'))).toBe(
      'Allowed — the gate is exercised here',
    )
    // L89706 — "Allowed — a Supervisor or Quality Manager may cancel with a reason"
    expect(cellText(cellAt('cancelled', 'command-center'))).toBe(
      'Allowed — a Supervisor or Quality Manager may cancel with a reason',
    )
    // L89708 — "Allowed — the record of truth holds it"
    expect(cellText(cellAt('reconciled', 'hub'))).toBe('Allowed — the record of truth holds it')

    // The Frontline column carries none of those acts. `pending human review`
    // and `cancelled` are bare `Allowed` there — the worker sees the state, and
    // the act lives elsewhere — and `reconciled` is not shown to the worker at
    // all. A Frontline renderer reading this matrix cannot find an act to build.
    for (const state of ['pending human review', 'cancelled'] as const) {
      expect(cellAt(state, 'frontline')).toEqual({ disposition: 'allowed', note: null })
    }
    // L89708 — "Unavailable — the worker sees the outcome, not the bookkeeping"
    expect(cellAt('reconciled', 'frontline')).toEqual({
      disposition: 'unavailable',
      reason: 'the worker sees the outcome, not the bookkeeping',
    })
    const frontlineActs = QUEUED_REQUEST_SURFACE_MATRIX.filter((r) => {
      const c = cellAt(r.state, 'frontline')
      return c.disposition === 'allowed' && c.note !== null
    })
    // L89697 — "Allowed — shown in the request list" is the only annotated
    // Frontline cell, and it annotates a listing, not an act.
    expect(frontlineActs.map((r) => r.state)).toEqual(['saved locally'])
    expect(cellText(cellAt('saved locally', 'frontline'))).toBe(
      'Allowed — shown in the request list',
    )
  })
})
