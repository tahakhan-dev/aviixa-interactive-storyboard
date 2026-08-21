import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { FrontlineMatrixOutcome } from '@/frontline/access'
import {
  FL_MATRIX_SHAPE,
  TENANT_ADMIN_OPEN_CELLS,
  controlsOnActsHeldElsewhere,
  frontlineAffordance,
} from '@/frontline/matrix'
import { FL_OVERLAY_ON_ANY_DESTINATION, flDestinationBySlug } from '@/frontline/screens'
import { routeOpenDecisionFor } from '@/routes/definitions'
import {
  A1_CHARTER_STATEMENTS,
  A1_CHARTER_STATEMENT_IDS,
  A1_IDENTITY_CARD,
  a1CharterStatement,
} from '@/frontline/modules/fl-a1/charter'
import {
  A1_COLUMNS,
  A1_COLUMN_ROLE,
  A1_MATRIX_SHAPE,
  A1_ROWS,
  A1_TENANT_ADMIN_OPEN_DECISION,
  GENUINE_NON_WORKER_CONTROLS,
  GENUINE_NON_WORKER_CONTROLS_ELSEWHERE,
  a1RowById,
  a1RowsFor,
  type A1Column,
  type A1RowId,
} from '@/frontline/modules/fl-a1/matrix'
import {
  A1_DEVICE_MODES,
  A1_FUNCTIONALITIES,
  A1_FUNCTIONALITIES_NAMING_NO_PATTERN,
  A1_OPEN_DECISIONS,
  A1_PATTERNS_FROM_MAP,
  A1_PATTERN_DIVERGENCE,
  COMPLIANCE_MESSAGE_READINGS,
  a1DeviceMode,
} from '@/frontline/modules/fl-a1/service'

/* ==================================================================== *
 * THE FROZEN SOURCE, PARSED AT RUN TIME.
 *
 * THIS IS THE INDEPENDENT PIN AND IT IS STRUCTURAL RATHER THAN A SECOND
 * COPY. Nothing below re-states a cell, a token or a count as a literal for
 * the transcription to be compared against — every expectation is PARSED
 * out of L40186-L40197 when the test runs. There is therefore no second copy
 * to corrupt, and the consistent-lie plant (move the claim and its
 * corroborating copy together) has nothing to move: the corroboration is the
 * blueprint, and the blueprint is read-only input this task cannot write.
 *
 * A MISSING OR ALTERED SOURCE IS A HARD FAILURE, NEVER A VACUOUS PASS. The
 * hash and the line count are asserted before anything reads a line, so a
 * file that is absent, truncated or edited turns this suite red instead of
 * letting every parse quietly compare `undefined` to `undefined`.
 * ==================================================================== */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA256 = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const SOURCE_LINE_COUNT = 122_241

const sourceBytes = readFileSync(SOURCE_PATH)
const sourceLines = ((lines: string[]) => (lines.at(-1) === '' ? lines.slice(0, -1) : lines))(
  sourceBytes.toString('utf8').split('\n'),
)

/** 1-based, the way a citation is written. */
const L = (n: number): string => {
  const line = sourceLines[n - 1]
  if (line === undefined) throw new Error(`frozen source has no line ${n}`)
  return line
}

/** One table row split into its cells, trimmed. Leading and trailing pipe dropped. */
const cellsOf = (n: number): string[] =>
  L(n)
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((c) => c.trim())

/** A cell's own words, with the source's code ticks removed and nothing else. */
const strip = (s: string): string => s.replace(/`/g, '')

/**
 * Indexing that FAILS rather than yielding `undefined`. A parse that
 * silently produced `undefined` and compared it to `undefined` is the shape
 * of a gate that cannot fail, so every index into a parsed row goes through
 * here.
 */
function at<T>(xs: readonly T[], i: number, what: string): T {
  const v = xs[i]
  if (v === undefined) throw new Error(`${what}: nothing at index ${i}`)
  return v
}

/**
 * The status token a cell opens with, mapped onto the platform's outcome
 * vocabulary. `Allowed with conditions` is tested before `Allowed` because
 * one is a prefix of the other, which is the single way this mapping can be
 * got wrong.
 */
const TOKEN_ORDER: readonly (readonly [string, FrontlineMatrixOutcome])[] = [
  ['Allowed with conditions', 'allowedWithConditions'],
  ['Allowed', 'allowed'],
  ['Explicitly prohibited', 'explicitlyProhibited'],
  ['Not applicable', 'notApplicable'],
  ['Client Decision Required', 'clientDecisionRequired'],
  ['Read-only', 'readOnly'],
  ['Unavailable', 'unavailable'],
]

function outcomeOf(cellText: string): FrontlineMatrixOutcome {
  const text = strip(cellText)
  for (const [token, outcome] of TOKEN_ORDER) {
    if (text.startsWith(token)) return outcome
  }
  throw new Error(`no status token recognised in cell: ${JSON.stringify(cellText)}`)
}

/** Markup a prose line carries that a transcribed statement does not. */
const normaliseProse = (s: string): string =>
  strip(s)
    .replace(/\*\*/g, '')
    .replace(/\[(SoW Fact|Derived Clarification|Client Decision Required)[^\]]*\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

describe('the frozen source this module was transcribed from', () => {
  // FAILS IF: the blueprint is absent, truncated, or edited by so much as a
  // byte. Every parse below trusts these two lines and nothing else.
  it('is the hash-verified blueprint at its stated length', () => {
    expect(createHash('sha256').update(sourceBytes).digest('hex')).toBe(SOURCE_SHA256)
    expect(sourceLines).toHaveLength(SOURCE_LINE_COUNT)
  })
})

/* ==================================================================== *
 * THE SHAPE AND THE ARITHMETIC.
 * ==================================================================== */

describe('the shape of MOD-FL-A1’s permission matrix', () => {
  // FAILS IF: the module transcribes a span wave 0 does not hold, or wave 0
  // moves and this module does not. Two independent records of the same four
  // line numbers, held equal.
  it('agrees with wave 0’s FL_MATRIX_SHAPE row, line for line', () => {
    const waveZero = FL_MATRIX_SHAPE.find((m) => m.module === 'MOD-FL-A1')
    expect(waveZero).toBeDefined()
    expect(A1_MATRIX_SHAPE).toEqual(waveZero)
  })

  // FAILS IF: the header line is not where the transcription says, or the
  // separator has drifted. Parsed, never assumed.
  it('finds a header, a separator and ten data rows exactly where it says', () => {
    expect(L(A1_MATRIX_SHAPE.headerLine).startsWith('| Action |')).toBe(true)
    expect(cellsOf(A1_MATRIX_SHAPE.separatorLine).every((c) => /^-+$/.test(c))).toBe(true)
    expect(A1_MATRIX_SHAPE.separatorLine).toBe(A1_MATRIX_SHAPE.headerLine + 1)
    expect(A1_MATRIX_SHAPE.firstDataLine).toBe(A1_MATRIX_SHAPE.separatorLine + 1)
    expect(A1_MATRIX_SHAPE.lastDataLine - A1_MATRIX_SHAPE.firstDataLine + 1).toBe(
      A1_MATRIX_SHAPE.rows,
    )
    // The row after the last is not another row of this table.
    expect(L(A1_MATRIX_SHAPE.lastDataLine + 1).startsWith('|')).toBe(false)
  })

  // FAILS IF: a persona column is renamed, reordered or dropped. The column
  // ids ARE the header's words, so the transcription cannot key on a name
  // the source does not use.
  it('takes its five persona columns verbatim from the header line', () => {
    const header = cellsOf(A1_MATRIX_SHAPE.headerLine)
    expect(header[0]).toBe('Action')
    expect(header.slice(1)).toEqual([...A1_COLUMNS])
    expect(A1_COLUMNS).toHaveLength(A1_MATRIX_SHAPE.columns)
  })

  // FAILS IF: a row is dropped from the transcription, or one is invented.
  // Ten rows in the file, ten in the transcription, in the same order.
  it('transcribes ten rows in the source’s own order', () => {
    expect(A1_ROWS).toHaveLength(10)
    const lines = A1_ROWS.map((r) => Number(r.sourceRef.slice(1)))
    expect(lines).toEqual([40188, 40189, 40190, 40191, 40192, 40193, 40194, 40195, 40196, 40197])
  })

  // THE CELL ARITHMETIC, THREE WAYS. Rows × columns, the transcription's own
  // cell records, and the pipes counted in the file all have to reach fifty.
  //
  // FAILS IF: a row lost its last cell — which a row count alone cannot see,
  // because ten rows is still ten rows when one of them is five cells wide.
  it('reaches fifty cells by three independent counts', () => {
    const byArithmetic = A1_MATRIX_SHAPE.rows * A1_MATRIX_SHAPE.columns
    const byTranscription = A1_ROWS.reduce((n, r) => n + Object.keys(r.cells).length, 0)
    const byParse = Array.from(
      { length: A1_MATRIX_SHAPE.rows },
      (_, i) => cellsOf(A1_MATRIX_SHAPE.firstDataLine + i).length - 1,
    ).reduce((n, c) => n + c, 0)

    expect(byArithmetic).toBe(50)
    expect(byTranscription).toBe(50)
    expect(byParse).toBe(50)
  })

  // FAILS IF: a token is transcribed as a different token in a way that
  // still sums to fifty. Each of the five tokens this matrix uses is counted
  // separately, from the file and from the transcription, and held equal.
  it('tallies its status tokens identically from the file and from the transcription', () => {
    const fromFile: Record<string, number> = {}
    const fromTranscription: Record<string, number> = {}

    for (let i = 0; i < A1_MATRIX_SHAPE.rows; i += 1) {
      for (const cell of cellsOf(A1_MATRIX_SHAPE.firstDataLine + i).slice(1)) {
        const outcome = outcomeOf(cell)
        fromFile[outcome] = (fromFile[outcome] ?? 0) + 1
      }
    }
    for (const row of A1_ROWS) {
      for (const column of A1_COLUMNS) {
        const outcome = row.cells[column].outcome
        fromTranscription[outcome] = (fromTranscription[outcome] ?? 0) + 1
      }
    }

    expect(fromTranscription).toEqual(fromFile)
    // Stated separately, so a compensating pair of edits that keeps the two
    // sides equal still fails here.
    expect(fromFile).toEqual({
      allowed: 12,
      allowedWithConditions: 3,
      clientDecisionRequired: 4,
      explicitlyProhibited: 24,
      notApplicable: 7,
    })
    expect(Object.values(fromFile).reduce((n, v) => n + v, 0)).toBe(50)
  })
})

/* ==================================================================== *
 * THE TRANSCRIPTION ITSELF, CELL BY CELL, AGAINST THE FILE.
 * ==================================================================== */

describe('every cell of MOD-FL-A1, against the line it cites', () => {
  // FAILS IF: an Action column is paraphrased, re-cased, or has a clause
  // trimmed to fit a card.
  it('carries every Action column verbatim', () => {
    for (const row of A1_ROWS) {
      const line = Number(row.sourceRef.slice(1))
      expect(row.control, row.id).toBe(strip(at(cellsOf(line), 0, `${row.id} action`)))
    }
  })

  // THE ONE THAT MATTERS MOST. Fifty comparisons against fifty parsed cells.
  //
  // FAILS IF: any note is paraphrased, any clause dropped, any dash
  // re-typed, or any cell left blank. `note` is the cell's WHOLE text with
  // the code ticks removed, which is the only reading under which the
  // twenty-four bare `Explicitly prohibited` cells are non-blank.
  it('carries all fifty cell notes verbatim, and every outcome derived from the same text', () => {
    for (const row of A1_ROWS) {
      const line = Number(row.sourceRef.slice(1))
      const parsed = cellsOf(line).slice(1)
      A1_COLUMNS.forEach((column, i) => {
        const where = `${row.id}/${column} (L${line})`
        const raw = at(parsed, i, where)
        expect(row.cells[column].note, where).toBe(strip(raw))
        expect(row.cells[column].outcome, where).toBe(outcomeOf(raw))
        expect(row.cells[column].note.length, where).toBeGreaterThan(0)
      })
    }
  })

  // FAILS IF: a cell records an open decision that is not open, or omits one
  // that is. Every `Client Decision Required` cell defers, and nothing else
  // may — the open question is a property of that token here, not a
  // decoration a row can pick up.
  it('records an open decision on exactly the Client Decision Required cells', () => {
    for (const row of A1_ROWS) {
      for (const column of A1_COLUMNS) {
        const cell = row.cells[column]
        const where = `${row.id}/${column}`
        if (cell.outcome === 'clientDecisionRequired') {
          expect(cell.openDecision, where).toBe(A1_TENANT_ADMIN_OPEN_DECISION)
          expect(column, where).toBe('Tenant Admin')
        } else {
          expect(cell.openDecision, where).toBeNull()
        }
      }
    }
  })

  // FAILS IF: this module's four open cells and wave 0's register of all
  // eleven disagree. Wave 0 counted them across the twelve matrices; this
  // counts them in one, and the four lines have to be the same four.
  it('matches wave 0’s register of the eleven Tenant Admin open cells', () => {
    const mine = A1_ROWS.filter((r) => r.cells['Tenant Admin'].outcome === 'clientDecisionRequired')
      .map((r) => r.sourceRef)
    const waveZero = TENANT_ADMIN_OPEN_CELLS.filter((c) => c.module === 'MOD-FL-A1').map(
      (c) => c.sourceRef,
    )
    expect(mine).toEqual(['L40188', 'L40189', 'L40190', 'L40192'])
    expect(mine).toEqual(waveZero)
  })

  // FAILS IF: the question gets answered. `AC-FL-009-5` (L39948) forbids
  // resolving it in either direction, and the registry records it once.
  it('reads the Tenant Admin device-session question from the route registry and answers neither way', () => {
    const open = routeOpenDecisionFor('SURF-FL', 'TENANT_ADMIN')
    expect(open).not.toBeNull()
    expect(open?.decision).toBe(A1_TENANT_ADMIN_OPEN_DECISION)
    expect(normaliseProse(L(39948))).toContain(
      'The Tenant Admin device-session question is carried as an open item and is not silently resolved in either direction by the implementation.',
    )
  })
})

/* ==================================================================== *
 * THE INVERSE TRAP — THE DEFECT THIS TASK EXISTS TO NOT SHIP.
 * ==================================================================== */

describe('the six genuine non-Worker on-device controls, three of them here', () => {
  // FAILS IF: the transcription classifies one of the three away from this
  // screen, which is what applying "a permissive Supervisor cell means the
  // act is elsewhere" uniformly would do. The permissiveness is PARSED from
  // the file, so this cannot pass by the transcription agreeing with itself.
  it('draws a real control for the Supervisor and the Quality Manager on all three rows', () => {
    const rows = a1RowsFor('sign-in')
    for (const genuine of GENUINE_NON_WORKER_CONTROLS) {
      const line = Number(genuine.sourceRef.slice(1))
      const parsed = cellsOf(line).slice(1)
      const row = rows.find((r) => r.id === genuine.rowId)
      expect(row, genuine.rowId).toBeDefined()
      if (row === undefined) continue

      for (const column of genuine.columns) {
        const where = `${genuine.rowId}/${column} (${genuine.sourceRef})`
        // The file says permissive.
        const fromFile = outcomeOf(at(parsed, A1_COLUMNS.indexOf(column), where))
        expect(['allowed', 'allowedWithConditions'], where).toContain(fromFile)
        // And the screen draws a control, not a statement about elsewhere.
        const drawn = frontlineAffordance(row, column)
        expect(drawn.kind, where).toBe('control')
      }
    }
  })

  // FAILS IF: one of the three rows is reclassified. Six cells, counted —
  // three rows times the Supervisor and the Quality Manager.
  it('holds six of them in this matrix and names the other three where they live', () => {
    const cells = GENUINE_NON_WORKER_CONTROLS.reduce((n, g) => n + g.columns.length, 0)
    expect(GENUINE_NON_WORKER_CONTROLS).toHaveLength(3)
    expect(cells).toBe(6)
    expect(GENUINE_NON_WORKER_CONTROLS_ELSEWHERE).toHaveLength(3)
    expect(GENUINE_NON_WORKER_CONTROLS.length + GENUINE_NON_WORKER_CONTROLS_ELSEWHERE.length).toBe(
      6,
    )
    // Every one of the other three is transcribed at its own line, with its
    // own Action column, and is permissive for at least one of the two
    // non-Worker columns there too.
    for (const other of GENUINE_NON_WORKER_CONTROLS_ELSEWHERE) {
      const cells = cellsOf(Number(other.sourceRef.slice(1)))
      expect(strip(at(cells, 0, other.sourceRef)), other.sourceRef).toBe(other.act)
      const permissive = [at(cells, 2, other.sourceRef), at(cells, 3, other.sourceRef)].filter(
        (c) => ['allowed', 'allowedWithConditions'].includes(outcomeOf(c)),
      )
      expect(permissive.length, other.sourceRef).toBeGreaterThan(0)
    }
  })

  // FAILS IF: the one row where the Worker is the refused party stops being
  // one. L40192 is the only row of this matrix whose Worker cell refuses
  // while a non-Worker cell grants — parsed, not asserted from memory.
  it('finds exactly one row where the Worker is refused and a non-Worker column is granted', () => {
    const inverted: string[] = []
    for (let i = 0; i < A1_MATRIX_SHAPE.rows; i += 1) {
      const line = A1_MATRIX_SHAPE.firstDataLine + i
      const parsed = cellsOf(line).slice(1)
      const workerRefused = !['allowed', 'allowedWithConditions'].includes(
        outcomeOf(at(parsed, 0, `L${line} Worker cell`)),
      )
      const nonWorkerGranted = parsed
        .slice(1)
        .some((c) => ['allowed', 'allowedWithConditions'].includes(outcomeOf(c)))
      if (workerRefused && nonWorkerGranted) inverted.push(`L${line}`)
    }
    expect(inverted).toEqual(['L40192', 'L40194'])

    // Of those two, L40192 is the one met on this screen and L40194 is the
    // Delivery Operations Hub's. The Worker cell of L40192 draws no control.
    const stepUp = a1RowsFor('sign-in').find((r) => r.id === 'step-up')
    expect(stepUp).toBeDefined()
    if (stepUp !== undefined) {
      const drawn = frontlineAffordance(stepUp, 'Worker')
      expect(drawn.kind).toBe('refusal')
      expect(drawn.kind === 'refusal' && drawn.outcome).toBe('explicitlyProhibited')
    }
  })

  // FAILS IF: this module forgets that the step-up sheet is an overlay and
  // treats it as a destination or a Run Player panel. The ruling is wave 0's
  // and is consumed rather than re-opened.
  it('treats the step-up as an overlay on any destination, on both destinations', () => {
    expect(FL_OVERLAY_ON_ANY_DESTINATION.id).toBe('SCR-FL-03')
    expect(FL_OVERLAY_ON_ANY_DESTINATION.destinationColumn).toBe('Overlay on any destination')
    expect(strip(at(cellsOf(39865), 2, 'L39865 Destination column'))).toBe(
      FL_OVERLAY_ON_ANY_DESTINATION.destinationColumn,
    )

    for (const slug of ['sign-in', 'profile-lite'] as const) {
      const row = a1RowsFor(slug).find((r) => r.id === 'step-up')
      expect(row?.surface, slug).toBe('screen')
      expect(row?.metElsewhere, slug).toBeNull()
    }
  })
})

/* ==================================================================== *
 * THE ROWS HELD ELSEWHERE, AND THE ROWS HELD ON THE OTHER DESTINATION.
 * ==================================================================== */

describe('rows this screen does not hold', () => {
  // FAILS IF: a permissive cell on a row the source places elsewhere ever
  // becomes a button. Row 7's Supervisor, Quality Manager and Tenant Admin
  // cells all read `Allowed`, and all three name the Delivery Operations Hub
  // — two of them only by saying "same path".
  it('draws no control on the two rows held on another surface, for any column', () => {
    for (const slug of ['sign-in', 'profile-lite'] as const) {
      const rows = a1RowsFor(slug)
      for (const id of ['device-mode', 'pin-reset'] as const) {
        const row = rows.find((r) => r.id === id)
        expect(row?.surface, `${slug}/${id}`).toBe('another-surface')
        for (const column of A1_COLUMNS) {
          const drawn = frontlineAffordance(row!, column)
          expect(drawn.kind, `${slug}/${id}/${column}`).toBe('cross-surface')
        }
      }
    }
    // And the file agrees that three of row 7's cells are permissive, which
    // is what makes the classification load-bearing rather than decorative.
    const pinReset = cellsOf(40194).slice(1)
    expect(pinReset.map(outcomeOf)).toEqual([
      'explicitlyProhibited',
      'allowed',
      'allowed',
      'allowed',
      'explicitlyProhibited',
    ])
  })

  // FAILS IF: a row met on the OTHER destination of this surface is dressed
  // as a surface crossing. L1598 and AC-PROD-040 cap the platform at five
  // surfaces and a cross-surface statement over a Frontline destination
  // would claim a sixth.
  it('renders Profile-lite’s rows on Login as a named place, and the reverse', () => {
    const onLogin = a1RowsFor('sign-in')
    for (const id of ['language', 'log-out'] as const) {
      const row = onLogin.find((r) => r.id === id)
      expect(row?.surface, id).toBe('another-destination')
      const drawn = frontlineAffordance(row!, 'Worker')
      expect(drawn.kind, id).toBe('named-place')
      expect(drawn.kind === 'named-place' && drawn.destination, id).toBe('profile-lite')
    }

    const onProfile = a1RowsFor('profile-lite')
    for (const id of ['session', 'sso', 'managed-pin', 'fast-switch'] as const) {
      const row = onProfile.find((r) => r.id === id)
      expect(row?.surface, id).toBe('another-destination')
      const drawn = frontlineAffordance(row!, 'Worker')
      expect(drawn.kind, id).toBe('named-place')
      expect(drawn.kind === 'named-place' && drawn.destination, id).toBe('sign-in')
    }
  })

  // FAILS IF: this module ever draws a control for an act the source holds
  // elsewhere. Wave 0's own detector, run over both destinations and all
  // five columns.
  it('passes wave 0’s controlsOnActsHeldElsewhere on both destinations', () => {
    for (const slug of ['sign-in', 'profile-lite'] as const) {
      expect(controlsOnActsHeldElsewhere(a1RowsFor(slug), A1_COLUMNS), slug).toEqual([])
    }
  })
})

/* ==================================================================== *
 * `Not applicable` IS NOT A REFUSAL.
 * ==================================================================== */

describe('the seven Not applicable cells', () => {
  // FAILS IF: a `Not applicable` cell whose own words name another row of
  // this matrix renders in the prohibition band. Six of the seven do name
  // one, and a routed pointer is what tells a Supervisor a step-up is
  // released rather than that they are forbidden from logging out.
  it('routes the six that name another row, and refuses only the one that names nothing', () => {
    const rows = a1RowsFor('profile-lite')
    const routed: string[] = []
    const refused: string[] = []

    for (const row of rows) {
      for (const column of A1_COLUMNS) {
        if (row.cells[column].outcome !== 'notApplicable') continue
        if (row.surface !== 'screen') continue
        const drawn = frontlineAffordance(row, column)
        if (drawn.kind === 'routed') routed.push(`${row.id}/${column}→${drawn.toRowId}`)
        if (drawn.kind === 'refusal') refused.push(`${row.id}/${column}`)
      }
    }

    expect(routed).toEqual([
      'language/Supervisor→session',
      'language/Quality Manager→session',
      'language/Tenant Admin→session',
      'log-out/Supervisor→step-up',
      'log-out/Quality Manager→step-up',
    ])
    expect(refused).toEqual(['log-out/Tenant Admin'])
    expect(strip(at(cellsOf(40197), 4, 'L40197 Tenant Admin cell'))).toBe('Not applicable')
  })

  // FAILS IF: a route is declared at a column whose cell does not name
  // another row, directly or by ellipsis. `routedTo` is checked before the
  // token, so a route declared where the source names nothing would hide a
  // real refusal behind a pointer.
  //
  // THE ELLIPTICAL CASE IS ALLOWED AND IS CHECKED, NOT WAVED THROUGH. Two of
  // this matrix's routed cells say only "same basis" and name nothing at
  // all — L40188's Quality Manager cell and L40197's. Wave 0 counted eleven
  // such cells across the twelve matrices and ruled that an elliptical cell
  // inherits from the cell beside it, so the test asserts the ellipsis AND
  // asserts the neighbour it inherits from names the target and routes to
  // the same row. A cell that names nothing and has no naming neighbour
  // fails here.
  it('declares a route only where the cell’s own words, or its neighbour’s, name the row it points at', () => {
    const NAMES: Readonly<Record<A1RowId, RegExp>> = {
      session: /\bsession\b/i,
      sso: /(?!)/,
      'managed-pin': /(?!)/,
      'fast-switch': /(?!)/,
      'step-up': /step-up/i,
      'device-mode': /(?!)/,
      'pin-reset': /(?!)/,
      language: /(?!)/,
      'other-identity': /(?!)/,
      'log-out': /(?!)/,
    }
    const ELLIPSIS = /^[^—]*—\s*same(\s|$)/

    const elliptical: string[] = []
    for (const row of A1_ROWS) {
      const routes: Partial<Readonly<Record<A1Column, A1RowId>>> = row.routedTo
      for (const [column, target] of Object.entries(routes) as [A1Column, A1RowId][]) {
        const where = `${row.id}/${column}`
        const note = row.cells[column].note
        if (NAMES[target].test(note)) continue

        // Elliptical. The neighbour to its left must name the target and
        // must route to the same row.
        expect(note, `${where} names nothing and is not elliptical`).toMatch(ELLIPSIS)
        const left = at(A1_COLUMNS, A1_COLUMNS.indexOf(column) - 1, `${where} neighbour`)
        expect(row.cells[left].note, `${where} inherits from ${left}`).toMatch(NAMES[target])
        expect(routes[left], `${where} inherits from ${left}`).toBe(target)
        elliptical.push(where)
      }
    }
    expect(elliptical).toEqual(['session/Quality Manager', 'log-out/Quality Manager'])
  })
})

/* ==================================================================== *
 * THE CARD, THE FUNCTIONALITIES, AND THE FALLBACK CRITERION.
 * ==================================================================== */

describe('the identity card, against L40174-L40182', () => {
  // FAILS IF: a statement is paraphrased or cited at the wrong line. Every
  // sentence of every statement has to appear in the line it names, with the
  // source's own markup removed and nothing else changed.
  it('carries every statement verbatim at the line it cites', () => {
    for (const s of A1_CHARTER_STATEMENTS) {
      const line = normaliseProse(L(Number(s.sourceRef.replace(/^L/, '').split(' ')[0])))
      for (const sentence of s.text.split(/(?<=\.)\s+/).filter((x) => x.length > 3)) {
        expect(line, `${s.id} :: ${sentence.slice(0, 48)}`).toContain(sentence)
      }
    }
  })

  // FAILS IF: a statement is added to the union and never given a record, or
  // a record is added and never rendered. The five card statements are the
  // L40174-L40182 span and the other four say so.
  it('holds the union, the records and the card span in step', () => {
    expect(A1_CHARTER_STATEMENT_IDS).toHaveLength(A1_CHARTER_STATEMENTS.length)
    expect(A1_CHARTER_STATEMENTS.map((s) => s.id)).toEqual([...A1_CHARTER_STATEMENT_IDS])
    expect(A1_IDENTITY_CARD).toHaveLength(5)
    expect(A1_IDENTITY_CARD.map((s) => s.sourceRef)).toEqual([
      'L40174',
      'L40176',
      'L40178',
      'L40180',
      'L40182',
    ])
    for (const id of A1_CHARTER_STATEMENT_IDS) {
      expect(a1CharterStatement(id).id).toBe(id)
    }
  })
})

describe('the fourteen functionalities and AC-FL-011-1', () => {
  // FAILS IF: a functionality is dropped or invented. The identifiers are
  // parsed out of the features block, so the count is the file's.
  it('enumerates exactly the FUNC-A1-* identifiers the source lists', () => {
    const fromFile: string[] = []
    for (let n = 40254; n <= 40280; n += 1) {
      const match = /`(FUNC-A1-[0-9-]+)`/.exec(L(n))
      if (match !== null) fromFile.push(at(match, 1, `FUNC id at L${n}`))
    }
    expect(fromFile).toHaveLength(14)
    expect(A1_FUNCTIONALITIES.map((f) => f.id)).toEqual(fromFile)

    // And every one is transcribed at the line it actually sits on.
    for (const f of A1_FUNCTIONALITIES) {
      expect(L(Number(f.sourceRef.slice(1))), f.id).toContain(`\`${f.id}\``)
    }
  })

  // FAILS IF: a Fallback clause is paraphrased, or a pattern is credited to
  // a functionality whose own clause does not name it.
  it('reads every pattern out of the functionality’s own Fallback clause', () => {
    for (const f of A1_FUNCTIONALITIES) {
      const line = normaliseProse(L(Number(f.sourceRef.slice(1))))
      expect(line, f.id).toContain(normaliseProse(f.fallbackClause))
      for (const p of f.patterns) expect(f.fallbackClause, f.id).toContain(p)
      const named = [...new Set(normaliseProse(f.fallbackClause).match(/FB-FL-[A-Z0-9]+-\d+/g) ?? [])]
      expect(f.patterns, f.id).toEqual(named)
    }
  })

  // FAILS IF: the gap gets papered over by assigning a plausible pattern.
  // `AC-FL-011-1` is not met by this module and the source is where it
  // fails; wave 0's own detector names the functionality.
  it('reports FUNC-A1-04-1-3 as naming no pattern, and does not close the gap', () => {
    expect(normaliseProse(L(40151))).toContain(
      'Every functionality in this chapter names at least one FB-FL-* pattern.',
    )
    expect([...A1_FUNCTIONALITIES_NAMING_NO_PATTERN]).toEqual(['FUNC-A1-04-1-3'])
    expect(L(40279)).toContain(
      'Not applicable — session preservation is a local invariant with no external dependency.',
    )
    // Its neighbour opens identically and DOES name one, which is what makes
    // this the source's gap rather than a transcription slip.
    expect(L(40271)).toContain('Not applicable —')
    expect(L(40271)).toContain('FB-FL-CORE-01')
  })

  // FAILS IF: this module quietly reconciles the module map with its own
  // card. §22.9's map names two patterns for MOD-FL-A1; the card names
  // three; the functionalities reach four. All three readings are parsed.
  it('records the divergence between §22.9’s map and §22.10’s own card', () => {
    expect(A1_PATTERNS_FROM_MAP.map((p) => p.id)).toEqual([
      ...A1_PATTERN_DIVERGENCE.fromTheModuleMap,
    ])
    expect(L(40131)).toContain('`MOD-FL-A1`')
    expect(L(40141)).toContain('`MOD-FL-A1`')
    expect(L(40130)).not.toContain('`MOD-FL-A1`')
    expect(L(40133)).not.toContain('`MOD-FL-A1`')
    for (const p of A1_PATTERN_DIVERGENCE.fromTheCardsFallbackLine) {
      expect(L(40250), p).toContain(p)
    }
    expect([...A1_PATTERN_DIVERGENCE.fromTheFunctionalities].sort()).toEqual(
      [...new Set(A1_FUNCTIONALITIES.flatMap((f) => f.patterns))].sort(),
    )
  })
})

/* ==================================================================== *
 * DEC-MSG-001, AND THE OTHER DISCLOSURES.
 * ==================================================================== */

describe('the decisions this module discloses', () => {
  // FAILS IF: either wording drifts by a character. Both are fixed strings
  // the source states verbatim, and `AC-CMD-007`-class gates forbid
  // rewording them.
  it('carries both DEC-MSG-001 wordings exactly as L5265 and L5266 state them', () => {
    expect(COMPLIANCE_MESSAGE_READINGS).toHaveLength(2)
    expect(L(5265)).toContain(`"${COMPLIANCE_MESSAGE_READINGS[0].text}"`)
    expect(L(5266)).toContain(`"${COMPLIANCE_MESSAGE_READINGS[1].text}"`)
    expect(L(5263)).toContain('`DEC-MSG-001`')
    expect(normaliseProse(L(48703))).toContain(
      'both source wordings are preserved under DEC-MSG-001',
    )
  })

  // FAILS IF: a reading is marked as the answer. There is no field that
  // could hold one, and this asserts the shape as well as the content.
  it('gives no reading of any decision a field that could mark it canonical', () => {
    for (const d of A1_OPEN_DECISIONS) {
      expect(d.readings.length, d.id).toBeGreaterThanOrEqual(2)
      for (const r of d.readings) {
        expect(Object.keys(r).sort(), d.id).toEqual(['locator', 'text'])
      }
      expect(d.adopted.length, d.id).toBeGreaterThan(0)
      expect(d.bearingHere.length, d.id).toBeGreaterThan(0)
    }
  })

  // FAILS IF: a decision is cited at a line that does not name it. Every
  // line below is asserted to carry the identifier as a whole token.
  it('names each decision at a line the frozen source actually names it on', () => {
    const AT: Readonly<Record<string, readonly number[]>> = {
      'DEC-MSG-001': [5263, 48703],
      'DEC-WIPELOGOUT-001': [41357, 41414, 41429, 41446],
      'DEC-SUSP-001': [41353, 41379, 41446, 44927],
      'DEC-DEVICE-001': [42506, 42561, 42571, 42573, 42593, 42644, 42655, 60839],
    }
    for (const d of A1_OPEN_DECISIONS) {
      const lines = AT[d.id]
      if (lines === undefined) throw new Error(`no locators recorded for ${d.id}`)
      for (const n of lines) expect(L(n), `${d.id} at L${n}`).toContain(d.id)
    }
  })

  // A FINDING, HELD AS AN ASSERTION SO IT CANNOT QUIETLY STOP BEING TRUE.
  //
  // The brief this module was built from cites L44923 as `DEC-MSG-001`'s
  // "divergence note". The line IS the divergence note — it states both
  // wordings and calls the difference a drafting inconsistency — but it does
  // NOT name `DEC-MSG-001`, or any other decision identifier. The nearest
  // identifiers on either side belong to `DEC-SUSP-001` (L44919, L44927).
  //
  // FAILS IF: the characterisation is wrong in either direction — if the
  // line stops carrying the divergence, or if it turns out to name the
  // decision after all.
  it('records that L44923 carries the divergence but names no decision identifier', () => {
    const line = L(44923)
    expect(line).toContain(COMPLIANCE_MESSAGE_READINGS[0].text)
    expect(line).toContain(COMPLIANCE_MESSAGE_READINGS[1].text)
    expect(line).toContain('drafting inconsistency')
    expect(line).not.toMatch(/DEC-[A-Z]+-\d+/)
    // The neighbours that do carry an identifier carry a different one.
    expect(L(44919)).toContain('DEC-SUSP-001')
    expect(L(44927)).toContain('DEC-SUSP-001')
  })

  // FAILS IF: this module's four are quietly assumed to be in the canon
  // `DecisionDisclosure` renders. They are not, and the report says so;
  // this holds that statement true rather than leaving it a comment.
  it('confirms none of the four is in the shared decision canon', async () => {
    const { OPEN_DECISIONS } = await import('@/disclosure/decisions')
    const canon = new Set(OPEN_DECISIONS.map((d) => d.id as string))
    for (const d of A1_OPEN_DECISIONS) {
      expect(canon.has(d.id), `${d.id} unexpectedly in the canon`).toBe(false)
    }
  })
})

/* ==================================================================== *
 * THE CATEGORICAL ABSENCES, AND THE MODULE'S OWN VOCABULARY.
 * ==================================================================== */

describe('what this module never says', () => {
  const RENDERED_STRINGS: readonly string[] = [
    ...A1_CHARTER_STATEMENTS.flatMap((s) => [s.heading, s.text, s.sourceClass]),
    ...A1_ROWS.flatMap((r) => [
      r.control,
      r.home.note,
      ...A1_COLUMNS.map((c) => r.cells[c].note),
    ]),
    ...A1_FUNCTIONALITIES.flatMap((f) => [f.statement, f.fallbackClause]),
    ...A1_OPEN_DECISIONS.flatMap((d) => [
      d.question,
      d.adopted,
      d.bearingHere,
      ...d.readings.map((r) => r.text),
    ]),
    ...A1_DEVICE_MODES.flatMap((m) => [m.name, m.posture, m.loginBehaviour]),
    ...COMPLIANCE_MESSAGE_READINGS.map((r) => r.text),
    ...GENUINE_NON_WORKER_CONTROLS.map((g) => g.why),
    A1_PATTERN_DIVERGENCE.note,
  ]

  // FAILS IF: a pace figure, a countdown, a timer, a ranking or a
  // productivity comparison reaches any string this module renders.
  // AC-FL-000-5 (L39100), TEST-FL-000-3 (L39108), AC-SCR-FL-002 (L48690) and
  // AC-SCOPE-045 (L2683).
  it('says no pace, no timer, no countdown, no ranking, no productivity comparison', () => {
    const banned = /\b(pace|timer|countdown|ranking|leaderboard|productivity|quota)\b/i
    const offenders = RENDERED_STRINGS.filter((s) => banned.test(s))
    expect(offenders).toEqual([])
    expect(normaliseProse(L(39100))).toContain(
      'displays a pace figure, a countdown against expectation, or a comparison to another worker',
    )
  })

  // FAILS IF: the word "synced" is ever written as a state. L39622 says
  // there is no such state and no bare success.
  it('never writes “synced” as a state', () => {
    const offenders = RENDERED_STRINGS.filter((s) => /\bsynced\b/i.test(s))
    expect(offenders).toEqual([])
  })

  // FAILS IF: an auto-logout value is invented. FUNC-A1-03-1-2 records that
  // the source names none, so there is no number to render.
  it('renders no auto-logout value, because the source names none', () => {
    expect(L(40270)).toContain('names no default value')
    expect(L(40270)).toContain('TBD — Client Decision Required')
    // A duration, not any digit: `STATE-A1-*` carries a digit and is not a
    // value. What is forbidden is a number attached to a unit of time.
    const duration = /\b\d+(\.\d+)?\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?|days?)\b/i
    const withDurations = RENDERED_STRINGS.filter(
      (s) => /auto-logout/i.test(s) && duration.test(s),
    )
    expect(withDurations).toEqual([])
  })
})

describe('this module’s own vocabulary', () => {
  // FAILS IF: a persona column is mapped to a role nobody assigned, or the
  // map stops being total over the five.
  it('maps all five persona columns onto platform roles, and only those five', () => {
    expect(Object.keys(A1_COLUMN_ROLE).sort()).toEqual([...A1_COLUMNS].sort())
    expect(new Set(Object.values(A1_COLUMN_ROLE)).size).toBe(5)
  })

  // FAILS IF: this module claims a destination the source does not give it.
  // §25.5 gives MOD-FL-A1 exactly two: SCR-FL-01 and SCR-FL-06.
  it('claims exactly the two destinations §25.5 gives it', () => {
    expect(L(48529)).toContain('MOD-FL-A1')
    expect(L(48534)).toContain('MOD-FL-A1')
    expect(flDestinationBySlug('sign-in').modulesShown).toContain('MOD-FL-A1')
    expect(flDestinationBySlug('profile-lite').modulesShown).toContain('MOD-FL-A1')

    const homes = new Set(
      A1_ROWS.map((r) => (r.home.kind === 'destination' ? r.home.destination : r.home.kind)),
    )
    expect([...homes].sort()).toEqual(['another-surface', 'overlay', 'profile-lite', 'sign-in'])
  })

  // FAILS IF: a device mode is invented, or the lookup stops being total.
  it('holds the two device modes the source names and no third', () => {
    expect(A1_DEVICE_MODES.map((m) => m.id)).toEqual(['shared', 'personal'])
    expect(a1DeviceMode('shared').name).toBe('Shared mode')
    expect(a1DeviceMode('personal').name).toBe('Personal or assigned mode')
    expect(() => a1DeviceMode('assigned' as 'shared')).toThrow()
  })

  // FAILS IF: a row id is looked up that this matrix does not hold.
  it('refuses a row id this matrix does not hold', () => {
    expect(() => a1RowById('sign-off' as A1RowId)).toThrow()
    for (const row of A1_ROWS) expect(a1RowById(row.id).sourceRef).toBe(row.sourceRef)
  })
})
