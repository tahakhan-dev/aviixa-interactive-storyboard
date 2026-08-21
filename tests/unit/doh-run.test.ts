import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import { fixedClock } from '@/domain/clock'
import { rolesInDomain } from '@/domain/roles'
import {
  cellStatus,
  rolesReachingByMatrix,
  type ControlStatus,
} from '@/surfaces/doh/modules'
import { inlineControlsOnAdjacentCapabilities } from '@/surfaces/doh/boundary'
import { dohScreenById, DOH_CATALOGUE_B_REACH_NARROWER } from '@/surfaces/doh/screens'
import {
  DEC_FINISH_001,
  FINISH_WINDOW_CEILING_MS,
  FINISH_WINDOW_FLOOR_MS,
  dueTransitions,
  finishWindowVerdict,
  lateCaptureOutcome,
} from '@/surfaces/doh/transitions'
import {
  CLOSING_STATE_TABLE,
  DEC_FINISH_001_MOUNTED,
  DEC_RUNSTATE_001,
  DEC_STUCK_001,
  MATRIX_FIRST_DATA_LINE,
  MATRIX_LAST_DATA_LINE,
  MOD_DOH_06_MATRIX,
  MOD_DOH_06_ROLES_REACHING,
  RUN_CONTRADICTIONS,
  RUN_DECISIONS,
  TENANT_ROLE_ORDER,
  closingPosition,
  inTheContestedSpan,
  manualCloseAssertion,
  matrixRow,
  readingsDisagree,
  runStateReadings,
  stateIsGovernedByDecStuck,
} from '@/surfaces/doh/modules/doh-06/matrix'
import {
  BOARD_NOW_MS,
  HOUR,
  LOCATION_SCOPE_DEBT,
  SEEDED_RUNS,
  boardClock,
  runsInScope,
} from '@/surfaces/doh/modules/doh-06/fixtures'
/* MOD-DOH-02's own seed. A TEST may read `app/` — the constraint the block
   below enforces is on `src/`, and reading the real seed here is what stops
   this module's restatement of it drifting. */
import { DOH_AREAS, visibleAreaIds } from '../../app/hub/location-configuration/fixtures'

/* ==================================================================== *
 * THE FROZEN SOURCE.
 *
 * Every claim below about §19.8 is checked against the FILE, never against
 * the brief that sent this task and never against the field under test. The
 * brief for this module quoted a matrix cell as reading "Allowed with
 * conditions — in the tenant administration area" on both of rows 10 and 11;
 * one of them reads something longer. Only the file settles that.
 * ==================================================================== */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA256 = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const SOURCE_LINE_COUNT = 122_241

const sourceBytes = existsSync(SOURCE_PATH) ? readFileSync(SOURCE_PATH) : Buffer.alloc(0)
const sourceLines = ((lines: string[]) => (lines.at(-1) === '' ? lines.slice(0, -1) : lines))(
  sourceBytes.toString('utf8').split('\n'),
)

/** 1-based, the way a citation is written. */
const L = (n: number): string => sourceLines[n - 1] ?? ''

/** One markdown table row split into its cells, trimmed. */
const cells = (line: string): readonly string[] =>
  line
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((c) => c.trim())

/**
 * TOTAL ARRAY ACCESS, because `noUncheckedIndexedAccess` is on and this file
 * indexes the frozen source constantly. Without it every `xs[i]` is
 * `T | undefined`, and the failure mode is not a compile error somebody
 * notices — it is a test that compares `undefined` to `undefined` and passes
 * having asked nothing. The `expect` inside is what makes a missing index a
 * red test rather than a silent one.
 */
function at<T>(xs: readonly T[], i: number, what: string): T {
  const value = xs[i]
  expect(value, `${what}: index ${i} is missing`).toBeDefined()
  return value as T
}

/** Cell `i` of the markdown table row at source line `line`. */
const cellAt = (line: number, i: number): string => at(cells(L(line)), i, `L${line} cell ${i}`)

const isTableRow = (line: string): boolean => /^\s*\|/.test(line)
const isSeparator = (line: string): boolean => /^\s*\|[\s:|-]+\|\s*$/.test(line)

/**
 * The data rows of the table whose HEADER is at `headerLine` — measured by
 * walking, which is the whole point of §1a: a span quoted as n rows encloses
 * n+2, and counting from the quoted start would be off by two every time.
 */
function dataRowsFrom(headerLine: number): readonly number[] {
  expect(isTableRow(L(headerLine)), `L${headerLine} is not a table row`).toBe(true)
  expect(isSeparator(L(headerLine + 1)), `L${headerLine + 1} is not a separator`).toBe(true)
  const out: number[] = []
  for (let n = headerLine + 2; isTableRow(L(n)) && !isSeparator(L(n)); n += 1) out.push(n)
  return out
}

/**
 * The classification marker as the source actually writes it: a backtick,
 * then the bracket. Written once, because an assertion that guessed the
 * punctuation would pass on a line that carries no marker at all.
 */
const SOW_FACT_TAG = '`[SoW Fact'

/** Loose comparison: markdown emphasis, quote marks and dashes are noise. */
const norm = (s: string): string =>
  s
    .replace(/[`*_]/g, '')
    .replace(/['‘’“”]/g, '"')
    .replace(/[–—‒]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

/** One seeded run by id, or a red test. Never `find(...)!`. */
function seededRun(runId: string) {
  const found = SEEDED_RUNS.find((r) => r.facts.runId === runId)
  expect(found, `no seeded run ${runId}`).toBeDefined()
  return found as (typeof SEEDED_RUNS)[number]
}

describe('the frozen source this task read', () => {
  it('is the file the standing rules name, by hash and by length', () => {
    expect(sourceBytes.length).toBeGreaterThan(0)
    expect(createHash('sha256').update(sourceBytes).digest('hex')).toBe(SOURCE_SHA256)
    expect(sourceLines.length).toBe(SOURCE_LINE_COUNT)
  })
})

/* ==================================================================== *
 * THE ROW COUNTS, MEASURED RATHER THAN ACCEPTED
 * ==================================================================== */

const MATRIX_HEADER = 27_907
const CARD_HEADER = 27_888
const CLOSING_TABLE_HEADER = 27_876

describe('MOD-DOH-06 — the counts, measured by walking the tables', () => {
  it('has twelve matrix data rows, and they start two lines after the quoted span', () => {
    const rows = dataRowsFrom(MATRIX_HEADER)
    expect(rows.length).toBe(12)
    expect(rows[0]).toBe(MATRIX_FIRST_DATA_LINE)
    expect(rows.at(-1)).toBe(MATRIX_LAST_DATA_LINE)
    // §1a's rule, demonstrated rather than restated: the plan quotes the span
    // as beginning at the header, so the first DATA row is header + 2.
    expect(rows[0]).toBe(MATRIX_HEADER + 2)
    expect(MOD_DOH_06_MATRIX.length).toBe(rows.length)
  })

  it('has fourteen identity-card data rows', () => {
    const rows = dataRowsFrom(CARD_HEADER)
    expect(rows.length).toBe(14)
    expect(rows[0]).toBe(27_890)
    expect(rows.at(-1)).toBe(27_903)
  })

  it('has three closing-state data rows', () => {
    const rows = dataRowsFrom(CLOSING_TABLE_HEADER)
    expect(rows.length).toBe(3)
    expect(rows[0]).toBe(27_878)
    expect(CLOSING_STATE_TABLE.length).toBe(rows.length)
  })

  it('reads the five role columns the header names, in the order it names them', () => {
    const header = cells(L(MATRIX_HEADER))
    expect(header[0]).toBe('Action')
    expect(header.slice(1)).toEqual([
      'Tenant Admin',
      'Supervisor',
      'Quality Manager',
      'Read-only Auditor',
      'Worker',
    ])
    expect(TENANT_ROLE_ORDER).toEqual(rolesInDomain('TENANT').map((r) => r.id))
  })
})

/* ==================================================================== *
 * EVERY CELL, AGAINST THE SOURCE'S OWN TOKEN
 * ==================================================================== */

const TOKEN_TO_STATUS: Readonly<Record<string, ControlStatus>> = {
  Allowed: 'allowed',
  'Allowed with conditions': 'allowed-with-conditions',
  'Read-only': 'read-only',
  Unavailable: 'unavailable',
  'Explicitly prohibited': 'explicitly-prohibited',
  'Not applicable': 'not-applicable',
}

/**
 * The status token a source cell states.
 *
 * TWO CELL SHAPES, AND THE SECOND IS THE TRAP. Most cells put the token in
 * backticks and the qualifier outside them. Row 8's Worker cell puts the
 * WHOLE sentence inside one pair of backticks, so a reader that took the
 * backticked span as the token would read a token that is not in the
 * vocabulary and either throw or silently fall back.
 */
function sourceToken(text: string): ControlStatus {
  const backticked = /^`([^`]+)`/.exec(text.trim())
  const inner = (backticked?.[1] ?? text).trim()
  const head = (inner.split(/\s+[—–-]\s+/)[0] ?? inner).trim()
  const status = TOKEN_TO_STATUS[head]
  expect(status, `unrecognised status token in cell: ${text}`).toBeDefined()
  return status as ControlStatus
}

/**
 * The clause a source cell attaches to its token, or null where it states the
 * bare token. It looks in BOTH places, for the same reason `sourceToken` does:
 * most cells put the qualifier outside the backticks and row 8's Worker cell
 * puts it inside them.
 */
function sourceQualifier(text: string): string | null {
  const trimmed = text.trim()
  const backticked = /^`([^`]+)`/.exec(trimmed)
  const inner = (backticked?.[1] ?? trimmed).trim()
  const insideParts = inner.split(/\s+—\s+/)
  const inside = insideParts.length > 1 ? insideParts.slice(1).join(' — ') : ''
  const after = backticked === null
    ? ''
    : trimmed.slice(backticked[0].length).replace(/^\s*—\s*/, '').trim()
  const qualifier = (inside || after).trim()
  return qualifier === '' ? null : qualifier
}

describe('MOD-DOH-06 — every cell carries the source’s own token', () => {
  it('matches all sixty cells against the frozen source, row by row', () => {
    const rows = dataRowsFrom(MATRIX_HEADER)
    expect(rows.length).toBe(MOD_DOH_06_MATRIX.length)

    rows.forEach((line, i) => {
      const sourceCells = cells(L(line))
      const row = at(MOD_DOH_06_MATRIX, i, 'matrix row')
      expect(norm(at(sourceCells, 0, 'control name')), `row ${i + 1} control name`).toBe(norm(row.control))
      TENANT_ROLE_ORDER.forEach((role, c) => {
        expect(
          row.status[role],
          `row ${i + 1} (L${line}) ${role}: source says ${at(sourceCells, c + 1, 'source cell')}`,
        ).toBe(sourceToken(at(sourceCells, c + 1, 'source cell')))
      })
      expect(row.sourceRef, `row ${i + 1} names its own line`).toContain(`L${line}`)
    })
  })

  /**
   * NOT A LENGTH THRESHOLD, AND IT WAS ONE FIRST. A minimum character count
   * went red on `view-the-schedule`/Quality Manager, whose detail is
   * "Allowed." — and the source cell there is the bare token `Allowed`, so
   * the short cell was right and the test was wrong. L10238 forbids a BLANK
   * cell; it does not require prose the source did not write. The rule this
   * asks instead is derived from the source: whatever the source qualifies,
   * this build must still be carrying.
   */
  it('leaves no cell blank and drops no qualifier the source states', () => {
    const rows = dataRowsFrom(MATRIX_HEADER)
    rows.forEach((line, i) => {
      const sourceCells = cells(L(line))
      const row = at(MOD_DOH_06_MATRIX, i, 'matrix row')
      TENANT_ROLE_ORDER.forEach((role, c) => {
        expect(row.detail[role].trim(), `${row.id}/${role} is blank`).not.toBe('')
        const qualifier = sourceQualifier(at(sourceCells, c + 1, 'source cell'))
        if (qualifier !== null) {
          expect(
            norm(row.detail[role]),
            `${row.id}/${role} (L${line}) drops the source's qualifier`,
          ).toContain(norm(qualifier))
        }
      })
    })
  })

  it('finds at least one qualifier on the rows the traps live on', () => {
    // Non-vacuity: if `sourceQualifier` returned null everywhere the check
    // above would pass over sixty cells having asked nothing.
    expect(sourceQualifier(cellAt(27_916, 5))).toContain('on the device')
    expect(sourceQualifier(cellAt(27_917, 2))).toContain('close time')
    expect(sourceQualifier(cellAt(27_910, 1))).toBeNull()
  })
})

/* ==================================================================== *
 * REACH — DERIVED, NEVER HAND-WRITTEN
 * ==================================================================== */

describe('MOD-DOH-06 — who reaches the module', () => {
  it('derives reach from the matrix through the one implementation of the rule', () => {
    expect(MOD_DOH_06_ROLES_REACHING).toEqual(
      rolesReachingByMatrix(MOD_DOH_06_MATRIX, (row, role) => cellStatus(row, role)),
    )
  })

  it('returns all five roles, the Worker included, because no cell says Unavailable', () => {
    expect([...MOD_DOH_06_ROLES_REACHING]).toEqual([...TENANT_ROLE_ORDER])
    expect(MOD_DOH_06_MATRIX.flatMap((r) => Object.values(r.status))).not.toContain('unavailable')
    // The Worker's standing comes from row 2 and from nowhere else.
    expect(matrixRow('view-the-schedule').status.WORKER).toBe('allowed-with-conditions')
  })

  it('is wider than catalogue B’s own cell for the schedule board, and the gap is registered', () => {
    const screen = dohScreenById('SCR-DOH-13')
    expect(screen.catalogueBRoles).not.toContain('Tenant Admin')
    expect(sourceToken(cellAt(27_910, 1))).toBe('allowed')
    const narrowing = DOH_CATALOGUE_B_REACH_NARROWER.find((n) => n.screenId === 'SCR-DOH-13')
    expect(narrowing?.omittedRoles).toEqual(['Tenant Admin'])
  })
})

/* ==================================================================== *
 * THE STANDING RULE — CLASSIFY FIRST
 * ==================================================================== */

describe('MOD-DOH-06 — no adjacent capability carries an inline control', () => {
  it('reports no offender over this module’s twelve rows', () => {
    expect(
      inlineControlsOnAdjacentCapabilities(MOD_DOH_06_MATRIX, TENANT_ROLE_ORDER, (row, role) =>
        cellStatus(row, role),
      ),
    ).toEqual([])
  })

  it('carries no boundary pointer that its classification would make false', () => {
    for (const row of MOD_DOH_06_MATRIX) {
      // The register is the eight acts owned by another SURFACE. Rows 10 and
      // 11 point at a sibling HUB screen and row 8's Worker cell names an act
      // met on the device; none of the twelve is a register row, so none may
      // carry a pointer at one.
      expect(row).not.toHaveProperty('boundary')
    }
  })

  it('finds the gate has teeth: a boundary pointer on a screen row is reported', () => {
    const planted = [{ id: 'planted', surface: 'screen' as const, boundary: 'step-execution-and-capture' as const }]
    expect(
      inlineControlsOnAdjacentCapabilities(planted, TENANT_ROLE_ORDER, () => 'allowed'),
    ).toEqual(['planted: points at boundary `step-execution-and-capture` and is classified `screen`'])
  })
})

/* ==================================================================== *
 * TRAP — ROW 2, THE WORKER'S GRANT
 * ==================================================================== */

describe('trap — row 2 grants the Worker a module with no Hub screen', () => {
  it('reads the grant off the source rather than off this build', () => {
    const cell = cellAt(27_910, 5)
    expect(norm(cell)).toContain('allowed with conditions')
    expect(norm(cell)).toContain('own assigned runs only')
    expect(sourceToken(cell)).toBe('allowed-with-conditions')
  })

  it('does not resolve the grant by narrowing the matrix — D11 answers it elsewhere', () => {
    // The wrong fix is to write `Unavailable` into the Worker's cell so the
    // reach derivation drops it. That would be this build editing the source.
    expect(matrixRow('view-the-schedule').status.WORKER).not.toBe('unavailable')
    expect(MOD_DOH_06_ROLES_REACHING).toContain('WORKER')
  })
})

/* ==================================================================== *
 * TRAP — ROW 8, AND THE QUOTATION THE BRIEF ASKED TO BE VERIFIED
 * ==================================================================== */

describe('trap — row 8, pause or stop a run', () => {
  it('carries the "deliberately impossible" qualifier in ONE cell, not four', () => {
    const row = cells(L(27_916))
    expect(norm(at(row, 1, 'row cell'))).toContain('deliberately impossible from any oversight surface')
    // The brief says the qualifier is the row's content "for every other
    // role". It is not written in any other cell: three of them are bare.
    expect(norm(at(row, 2, 'row cell'))).toBe('explicitly prohibited')
    expect(norm(at(row, 3, 'row cell'))).toBe('explicitly prohibited')
    expect(norm(at(row, 4, 'row cell'))).toBe('explicitly prohibited')
  })

  it('gives the Worker Not applicable, naming an act met on the device', () => {
    const worker = cellAt(27_916, 5)
    expect(sourceToken(worker)).toBe('not-applicable')
    expect(norm(worker)).toContain(
      'the worker ends a run by completing or abandoning it on the device',
    )
  })

  it('is restated from the Command Center side, which is why the row is screen and not another-surface', () => {
    // L49583's Client Command Center cell: creating or stopping runs is
    // deliberately impossible there too. An oversight pause exists on no
    // surface, so the row is this screen's own disclosure that it offers
    // nothing — not a pointer at somewhere it is met.
    expect(norm(L(49_583))).toContain('deliberately impossible here')
    expect(matrixRow('pause-or-stop-a-run').surface).toBe('screen')
  })
})

/* ==================================================================== *
 * TRAP — ROWS 10 AND 11, AND THE BRIEF'S QUOTATION
 * ==================================================================== */

describe('trap — rows 10 and 11 set values on another Hub screen', () => {
  it('reads row 10’s Tenant Admin cell in full, which is longer than the brief quoted', () => {
    const cell = cellAt(27_918, 1)
    expect(norm(cell)).toContain('within the platform floor and ceiling')
    expect(norm(cell)).toContain('in the tenant administration area')
  })

  it('reads row 11’s Tenant Admin cell, which is the shorter of the two', () => {
    const cell = cellAt(27_919, 1)
    expect(norm(cell)).toContain('in the tenant administration area')
    expect(norm(cell)).not.toContain('within the platform floor and ceiling')
  })

  it('keeps both rows classified as this surface, because SCR-DOH-23 is a Hub screen', () => {
    expect(matrixRow('set-the-record-finish-window').surface).toBe('screen')
    expect(matrixRow('set-the-run-extension-cap').surface).toBe('screen')
    expect(dohScreenById('SCR-DOH-23').name).toBe('Tenant administration area')
  })
})

/* ==================================================================== *
 * DEC-RUNSTATE-001 — ALL THREE READINGS, NONE ADOPTED
 * ==================================================================== */

describe('DEC-RUNSTATE-001', () => {
  it('renders all three readings, each pointing at the Part that states it', () => {
    expect(DEC_RUNSTATE_001.readings).toHaveLength(3)
    const locators = DEC_RUNSTATE_001.readings.map((r) => r.locator)
    expect(at(locators, 0, 'reading locator')).toContain('L5244')
    expect(at(locators, 1, 'reading locator')).toContain('L5245')
    expect(at(locators, 2, 'reading locator')).toContain('L5246')
    expect(at(locators, 0, 'reading locator')).toContain('§2.4')
    expect(at(locators, 1, 'reading locator')).toContain('§4.6.8')
    expect(at(locators, 2, 'reading locator')).toContain('§6.2.6')
  })

  it('quotes each reading’s own words from the line it cites', () => {
    expect(norm(L(5_244))).toContain('a worker has handed in their part of the work')
    expect(norm(L(5_245))).toContain('execution has ended and the run"s captures are lodged')
    expect(norm(L(5_246))).toContain('every assigned device has synced')
  })

  it('marks no reading as the answer — the record has no field one could go in', () => {
    for (const reading of DEC_RUNSTATE_001.readings) {
      expect(Object.keys(reading).sort()).toEqual(['locator', 'text'])
    }
  })

  it('finds this module’s own closing-state table stating Reading B as if settled', () => {
    // The two definitions in the table are the two Reading B gives, which is
    // exactly why the table cannot be transcribed without the flag.
    expect(norm(cellAt(27_878, 1))).toContain('execution has ended and the run"s captures are lodged')
    expect(norm(L(5_245))).toContain('execution has ended and the run"s captures are lodged')
    expect(norm(cellAt(27_879, 1))).toContain('the execution summary is computed')
    expect(norm(L(5_245))).toContain('the execution summary is computed')

    expect(at(CLOSING_STATE_TABLE, 0, 'closing-state row').disputed).toBe(true)
    expect(at(CLOSING_STATE_TABLE, 1, 'closing-state row').disputed).toBe(true)
    // `finished` is agreed: DEC-RUNSTATE-001 disputes the other two only.
    expect(at(CLOSING_STATE_TABLE, 2, 'closing-state row').disputed).toBe(false)
  })

  it('transcribes the table verbatim rather than paraphrasing it away', () => {
    const rows = dataRowsFrom(CLOSING_TABLE_HEADER)
    rows.forEach((line, i) => {
      expect(norm(cellAt(line, 0))).toBe(at(CLOSING_STATE_TABLE, i, 'closing-state row').state)
      expect(norm(cellAt(line, 1))).toBe(norm(at(CLOSING_STATE_TABLE, i, 'closing-state row').meaning))
      expect(at(CLOSING_STATE_TABLE, i, 'closing-state row').sourceRef).toBe(`L${line}`)
    })
  })
})

/* ==================================================================== *
 * THE BOARD DOES NOT KEY ON A STATE NAME
 * ==================================================================== */

describe('the board branches on instants, not on `submitted` or `complete`', () => {
  const clock = boardClock()

  it('never returns either contested word for any seeded run', () => {
    for (const run of SEEDED_RUNS) {
      const pos = closingPosition(run.facts, clock)
      if (pos.kind === 'undisputed') {
        expect(['scheduled', 'in_progress', 'cancelled', 'finished']).toContain(pos.position)
      }
    }
  })

  it('answers `disputed` for the run inside its finish window, and names no word', () => {
    const inWindow = seededRun('RUN-2026-03-03-D')
    const pos = closingPosition(inWindow.facts, clock)
    expect(pos.kind).toBe('disputed')
    expect(pos).not.toHaveProperty('position')
  })

  it('reads instants and not a stored state — a cancelled instant outranks everything', () => {
    const run = at(SEEDED_RUNS, 0, 'seeded run')
    const cancelled = { ...run.facts, cancelledAtMs: BOARD_NOW_MS - HOUR }
    expect(closingPosition(cancelled, clock)).toEqual({ kind: 'undisputed', position: 'cancelled' })
  })

  it('is the same answer whichever way the clock got there', () => {
    // The determinism contract wave 0 states: one 40-minute jump and eight
    // 5-minute steps must record the same +30 auto-cancel at the same
    // millisecond, because `atMs` is the instant the timer fell DUE.
    const noShow = seededRun('RUN-2026-03-04-B')
    const jump = fixedClock(noShow.facts.scheduledStartMs)
    jump.advance(40 * 60_000)
    const stepped = fixedClock(noShow.facts.scheduledStartMs)
    for (let i = 0; i < 8; i += 1) stepped.advance(5 * 60_000)
    expect(dueTransitions(noShow.facts, jump)).toEqual(dueTransitions(noShow.facts, stepped))
  })
})

describe('the three readings, where they actually disagree', () => {
  it('gives the three-worker run three passes through `submitted` under Reading A and one under B and C', () => {
    const three = seededRun('RUN-2026-03-04-C')
    expect(three.workerHandoffs).toHaveLength(3)
    const readings = runStateReadings(three)
    expect(readings.map((r) => r.reading)).toEqual(['A', 'B', 'C'])
    expect(at(readings, 0, 'reading').submittedReachedTimes).toBe(3)
    expect(at(readings, 1, 'reading').submittedReachedTimes).toBe(1)
    expect(at(readings, 2, 'reading').submittedReachedTimes).toBe(1)
    expect(readingsDisagree(three)).toBe(true)
  })

  it('discloses the decision on a run mid-handoff, which the timing facts alone call in_progress', () => {
    const three = seededRun('RUN-2026-03-04-C')
    const clock = boardClock()
    // The half that would be missed by asking `closingPosition` alone: wave
    // 0's shape carries no per-worker instant, so it reads in_progress while
    // Reading A already has the run submitted twice.
    expect(closingPosition(three.facts, clock)).toEqual({
      kind: 'undisputed',
      position: 'in_progress',
    })
    expect(inTheContestedSpan(three, clock)).toBe(true)
  })

  it('still disagrees about the COUNT on a run all three call `complete`', () => {
    const inWindow = seededRun('RUN-2026-03-03-D')
    const readings = runStateReadings(inWindow)
    expect(readings.every((r) => r.answer.includes('`complete`'))).toBe(true)
    expect(new Set(readings.map((r) => r.submittedReachedTimes)).size).toBe(2)
    expect(readingsDisagree(inWindow)).toBe(true)
  })

  it('leaves a finished or cancelled run out of the contested span', () => {
    const clock = boardClock()
    const finished = seededRun('RUN-2026-03-01-E')
    const noShow = seededRun('RUN-2026-03-04-B')
    expect(inTheContestedSpan(finished, clock)).toBe(false)
    expect(inTheContestedSpan(noShow, clock)).toBe(false)
  })
})

/* ==================================================================== *
 * DEC-STUCK-001 — ROW 9'S CELL IS READING A
 * ==================================================================== */

describe('DEC-STUCK-001', () => {
  it('finds row 9’s condition IS Reading A, measured against both lines of the source', () => {
    const supervisorCell = norm(cellAt(27_917, 2))
    const readingA = norm(L(5_255))
    // Reading A: "A manually closed stuck run is complete at close time and
    // finishes on the same clock." The cell states the same condition with
    // the subject changed, which is what makes copying it a silent ruling.
    expect(readingA).toContain('complete at close time and finishes on the same clock')
    expect(supervisorCell).toContain('the run is complete at close time and finishes on the same clock')
  })

  it('finds Reading B saying something the cell does not', () => {
    expect(norm(L(5_256))).toContain('the run then stands submitted with the gap recorded')
    expect(norm(cellAt(27_917, 2))).not.toContain('stands submitted')
  })

  it('renders both readings and adopts neither', () => {
    expect(DEC_STUCK_001.readings).toHaveLength(2)
    expect(at(DEC_STUCK_001.readings, 0, 'DEC-STUCK-001 reading').locator).toContain('L5255')
    expect(at(DEC_STUCK_001.readings, 1, 'DEC-STUCK-001 reading').locator).toContain('L5256')
    expect(DEC_STUCK_001.buildPosition).toContain('Neither reading is adopted')
  })

  it('asserts only the finish clock, which is the half AC-RUN-004 permits', () => {
    expect(norm(L(7_128))).toContain('the finish-window clock behaviour is common to both readings')
    expect(norm(L(7_128))).toContain('neither reading is adopted here')
    expect(manualCloseAssertion.asserted).toBe('The finish-window clock runs from close time.')
    expect(manualCloseAssertion.notAsserted).toBe('The state the run stands in at close time.')
    expect(manualCloseAssertion.sourceRef).toContain('L7128')
  })

  it('never computes a state for a manually closed run', () => {
    const stuck = seededRun('RUN-2026-03-02-F')
    expect(stateIsGovernedByDecStuck(stuck)).toBe(true)
    expect(SEEDED_RUNS.filter(stateIsGovernedByDecStuck)).toHaveLength(1)
  })

  it('still runs the finish clock from close time, which both readings share', () => {
    const stuck = seededRun('RUN-2026-03-02-F')
    expect(stuck.facts.completeAtMs).toBe(stuck.manuallyClosedAtMs)
    expect(dueTransitions(stuck.facts, fixedClock(BOARD_NOW_MS)).map((t) => t.id)).toEqual([])
    const later = fixedClock(stuck.manuallyClosedAtMs! + stuck.facts.finishWindowMs)
    expect(dueTransitions(stuck.facts, later).map((t) => t.id)).toEqual(['run-auto-close'])
  })
})

/* ==================================================================== *
 * DEC-FINISH-001 — THE MOUNT
 * ==================================================================== */

describe('DEC-FINISH-001', () => {
  it('mounts wave 0’s record itself, not a second copy of its wording', () => {
    expect(DEC_FINISH_001_MOUNTED).toBe(DEC_FINISH_001)
    expect(RUN_DECISIONS).toContain(DEC_FINISH_001)
  })

  it('carries both readings and a sentence for a screen to render', () => {
    expect(DEC_FINISH_001.readings).toHaveLength(2)
    expect(DEC_FINISH_001.onScreen.length).toBeGreaterThan(80)
    expect(DEC_FINISH_001.onScreen).toContain('24 hours')
    expect(DEC_FINISH_001.onScreen).toContain('7 days')
    expect(DEC_FINISH_001.onScreen.toLowerCase()).toContain('unanswered')
  })

  it('reads both readings off the card at the line it cites', () => {
    expect(norm(L(27_882))).toContain('state the bounds as settled at a floor of 24 hours')
    expect(norm(L(27_882))).toContain('marks the bounds as an open drafting item')
  })

  it('enforces the bound it discloses, at the exact boundary', () => {
    expect(finishWindowVerdict(FINISH_WINDOW_FLOOR_MS)).toBe('accepted')
    expect(finishWindowVerdict(FINISH_WINDOW_FLOOR_MS - 1)).toBe('below-floor')
    expect(finishWindowVerdict(FINISH_WINDOW_CEILING_MS)).toBe('accepted')
    expect(finishWindowVerdict(FINISH_WINDOW_CEILING_MS + 1)).toBe('above-ceiling')
    expect(finishWindowVerdict(12 * HOUR)).toBe('below-floor')
  })
})

/* ==================================================================== *
 * THE TIMERS, AND THE COUNT THE SOURCE CONTRADICTS
 * ==================================================================== */

describe('the automatic transitions on the seeded runs', () => {
  const clock = boardClock()

  it('fires both no-show timers on a run left unstarted for an hour', () => {
    const noShow = seededRun('RUN-2026-03-04-B')
    const due = dueTransitions(noShow.facts, clock)
    expect(due.map((t) => t.id)).toEqual(['no-show-alert', 'auto-cancel'])
    expect(at(due, 0, 'due transition').toState).toBeNull()
    expect(at(due, 1, 'due transition').toState).toBe('cancelled')
    expect(due.every((t) => t.actor === null)).toBe(true)
  })

  it('fires the auto-close, and only the auto-close, on the run past its window', () => {
    const finished = seededRun('RUN-2026-03-01-E')
    const due = dueTransitions(finished.facts, clock)
    expect(due.map((t) => t.id)).toEqual(['run-auto-close'])
    expect(at(due, 0, 'due transition').toState).toBe('finished')
    expect(closingPosition(finished.facts, clock)).toEqual({
      kind: 'undisputed',
      position: 'finished',
    })
  })

  it('accepts a late capture inside the window and rejects one after it', () => {
    const inWindow = seededRun('RUN-2026-03-03-D')
    const inside = lateCaptureOutcome(inWindow.facts, BOARD_NOW_MS, false)
    expect(inside.accepted).toBe(true)
    expect(inside.flags).toEqual(['late_arrival'])
    expect(inside.recompute?.actor).toBeNull()

    const finished = seededRun('RUN-2026-03-01-E')
    const after = lateCaptureOutcome(finished.facts, BOARD_NOW_MS, false)
    expect(after.accepted).toBe(false)
  })

  it('corrects one of wave 0’s two locators for the "one automatic transition" claim', () => {
    // L7078 IS tagged. L27854 is the section's untagged "In simple words"
    // paragraph — it states the claim and carries no classification at all.
    // The `SoW Fact` restatement inside §19.8 is at L27933.
    expect(L(7_078)).toContain(SOW_FACT_TAG)
    expect(norm(L(7_078))).toContain('this is the platform"s one automatic transition')
    expect(norm(L(27_854))).toContain('the only thing on this platform that happens without a person deciding it')
    expect(L(27_854)).not.toContain('SoW Fact')
    expect(L(27_933)).toContain(SOW_FACT_TAG)
    expect(norm(L(27_933))).toContain('the one automatic transition on the platform')

    const record = RUN_CONTRADICTIONS.find((c) => c.id === 'CONTRADICTION-AUTOCLOSE-ONLY')!
    expect(record.claimLocators.join(' ')).toContain('L27933')
    expect(record.claimLocators.join(' ')).toContain('L7078')
  })

  it('keeps the contradiction the count runs into, and does not implement the count', () => {
    expect(norm(L(27_868))).toContain('supervisor alert at plus 15 minutes')
    expect(norm(L(27_868))).toContain('auto-cancelled at plus 30 minutes')
    const noShow = seededRun('RUN-2026-03-04-B')
    // Two actorless effects on one run at one instant, which is what the
    // count claim cannot accommodate.
    expect(dueTransitions(noShow.facts, boardClock())).toHaveLength(2)
  })
})

/* ==================================================================== *
 * THE AUTO-CLOSE OWNER, AND WHAT THE MATRIX ALREADY REFUSES
 * ==================================================================== */

describe('CONTRADICTION-AUTOCLOSE-OWNER', () => {
  it('reads the Hub-dependency claim off the identity card', () => {
    expect(norm(L(27_900))).toContain('the run auto-close scheduler')
    expect(norm(L(27_880))).toContain('the platform"s run auto-close scheduler')
  })

  it('reads the Super Admin placement off the source-of-truth matrix', () => {
    const row = cells(L(49_583))
    expect(at(row, 0, 'row cell')).toBe('Run record and lifecycle')
    expect(norm(at(row, row.length - 1, 'last cell'))).toContain('the run auto-close scheduler runs platform-side')
    // The same row still names the Hub as the single source of truth for the
    // record, which is why the disagreement is about the scheduler alone.
    expect(at(row, 1, 'row cell')).toBe('Delivery Operations Hub')
  })

  it('finds the matrix already refusing an early finish to all five roles', () => {
    const row = cells(L(27_920))
    expect(norm(at(row, 0, 'row cell'))).toContain('force a run to finished early')
    for (let c = 1; c <= 5; c += 1) expect(sourceToken(at(row, c, 'row cell'))).toBe('explicitly-prohibited')
    expect(
      Object.values(matrixRow('force-a-run-to-finished-early').status).every(
        (s) => s === 'explicitly-prohibited',
      ),
    ).toBe(true)
  })
})

/* ==================================================================== *
 * SCOPE BOUNDS THE READ
 * ==================================================================== */

describe('scope filters the read, not the render', () => {
  it('gives the Supervisor a genuinely shorter list than the Quality Manager', () => {
    const supervisor = runsInScope('SUPERVISOR').map((r) => r.facts.runId)
    const qualityManager = runsInScope('QUALITY_MANAGER').map((r) => r.facts.runId)
    expect(supervisor.length).toBeLessThan(qualityManager.length)
    // The packing-line run is outside the Supervisor's two Areas, so it is
    // not in their list at all — not listed with its controls removed.
    expect(supervisor).not.toContain('RUN-2026-03-04-C')
    expect(qualityManager).toContain('RUN-2026-03-04-C')
  })

  it('gives the Tenant Admin every seeded run, being tenant-scoped', () => {
    expect(runsInScope('TENANT_ADMIN')).toHaveLength(SEEDED_RUNS.length)
  })
})

/* ==================================================================== *
 * WHAT THE SOURCE SAYS ABOUT THE PIN
 * ==================================================================== */

describe('WF-AUT-010 — the pin is a Hub act at assignment', () => {
  it('is owned by this module on this surface', () => {
    expect(L(53_668)).toContain('WF-AUT-010')
    expect(L(53_668)).toContain('Delivery Operations Hub')
    expect(L(53_668)).toContain('MOD-DOH-06')
  })

  it('names DEC-LIB-001 on the line the pin panel renders it from', () => {
    expect(L(53_676)).toContain('DEC-LIB-001')
  })

  it('refuses a run that has a pin and no package', () => {
    expect(norm(L(53_678))).toContain(
      'a run with a pin but no package must never begin',
    )
    expect(SEEDED_RUNS.some((r) => !r.packageOnDevice)).toBe(true)
  })
})

/* ==================================================================== *
 * THE DEPENDENCY DIRECTION, AND THE RESTATEMENT IT FORCED
 *
 * `src/` may not value-import from `app/`. This module's fixture did, and
 * it broke both reach generators and `pnpm build:registries` for every agent
 * in the wave until it was removed. The scan below is the root fix: it asks
 * the question of the whole of `src/` rather than of the one file that got
 * it wrong, because a rule enforced only where it was already broken is a
 * rule that will be broken somewhere else next.
 * ==================================================================== */

describe('src never value-imports from app', () => {
  const SRC = join(process.cwd(), 'src')

  /**
   * PROBE-AWARE, because a concurrent gate plants `src/.zz-probe-<pid>/` on
   * the real filesystem and deletes it again. A walk that listed one would
   * either ENOENT on it mid-read or report another process's scratch file as
   * a finding of mine. `isForeignProbe` is the one predicate for that, and
   * `own` is omitted deliberately: this walk plants nothing, so it should
   * see no probe at all.
   */
  function tsFiles(dir: string): readonly string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      if (isForeignProbe(e.name)) return []
      const full = join(dir, e.name)
      if (e.isDirectory()) return e.name.startsWith('.') ? [] : tsFiles(full)
      return /\.tsx?$/.test(e.name) ? [full] : []
    })
  }

  const files = tsFiles(SRC)

  it('scans a real tree, so a green result means something', () => {
    expect(files.length).toBeGreaterThan(40)
  })

  it('finds no value import of app/ anywhere under src/', () => {
    const offenders: string[] = []
    for (const file of files) {
      const text = readFileSync(file, 'utf8')
      for (const line of text.split('\n')) {
        // `import type { X } from '.../app/...'` is fine: a type is erased and
        // reaches no bundler and no generator. A value import is not.
        if (!/\bfrom\s+'[^']*app\//.test(line)) continue
        if (/^\s*import\s+type\b/.test(line)) continue
        offenders.push(`${file.slice(SRC.length + 1)}: ${line.trim()}`)
      }
    }
    expect(offenders).toEqual([])
  })
})

describe('the restated location scope agrees with the module that owns it', () => {
  it('names every Area this module uses exactly as MOD-DOH-02 names it', () => {
    const used = [...new Set(SEEDED_RUNS.map((r) => r.areaId))]
    expect(used.length).toBeGreaterThan(1)
    for (const areaId of used) {
      const owned = DOH_AREAS.find((a) => a.id === areaId)
      expect(owned, `${areaId} is not an Area MOD-DOH-02 seeds`).toBeDefined()
      const mine = SEEDED_RUNS.find((r) => r.areaId === areaId)
      expect(mine?.areaName).toBe(owned?.name)
    }
  })

  it('scopes every role exactly as MOD-DOH-02 scopes it, over this module’s runs', () => {
    for (const role of TENANT_ROLE_ORDER) {
      const byOwner = SEEDED_RUNS.filter((r) => visibleAreaIds(role).includes(r.areaId))
      expect(
        runsInScope(role).map((r) => r.facts.runId),
        `${role} scope has drifted from MOD-DOH-02`,
      ).toEqual(byOwner.map((r) => r.facts.runId))
    }
  })

  it('records the restatement as debt rather than leaving it to be found', () => {
    expect(LOCATION_SCOPE_DEBT.why).toContain('may not value-import')
    expect(LOCATION_SCOPE_DEBT.fix).toContain('src')
  })
})
