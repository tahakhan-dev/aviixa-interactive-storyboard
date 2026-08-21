import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { stripComments } from '../coverage/strip-comments'
import {
  cellStatus,
  rolesReachingByMatrix,
  titleCaseCellStatus,
  MATRIX_STATUSES,
  type ControlStatus,
  type MatrixStatus,
} from '@/surfaces/doh/modules'
import {
  adjacentAffordance,
  inlineControlsOnAdjacentCapabilities,
  DOH_BOUNDARY_REGISTER,
} from '@/surfaces/doh/boundary'
import { DOH_SEAMS, dohSeamById, dohSeamStatus } from '@/surfaces/doh/seams'
import { HUB_COMMAND_TYPES } from '@/domain/commands'
import { DOH_CATALOGUE_B_REACH_NARROWER } from '@/surfaces/doh/screens'
import {
  CONTROL_MATRIX,
  DEFERRAL_RENDERING,
  MOD_DOH_07_REACH,
  TENANT_ROLES,
  assignmentCellRendering,
  assignmentRow,
  type AssignmentMatrixRow,
} from '@/surfaces/doh/modules/doh-07/matrix'
import {
  ABSENCE_NOTES,
  CATALOGUE_B_NARROWING,
  COMMAND_CENTER_ACTION_8,
  DEC_PLUS_001,
  SEAMS_CLOSED_HERE,
} from '@/surfaces/doh/modules/doh-07/rulings'
import {
  CANDIDATE_WORKERS,
  QUALIFICATION_CHIPS,
  candidatesInScope,
  chipFailsTheGate,
  workerShiftCount,
} from '../../app/hub/worker-assignment/fixtures'
import type { TenantRoleId } from '../../app/hub/HubShell'

/* ==================================================================== *
 * THE FROZEN SOURCE. Every claim below about §19.9 is checked against
 * the file rather than against the brief that sent this task. The brief
 * for this task was right on its row ordinals and its line numbers, and
 * it was wrong about one thing that matters (see "row 6 is not a
 * deferral" below) — which is why nothing here is taken on trust.
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

/** One table row split into its cells, trimmed. Leading/trailing pipe dropped. */
const cells = (line: string): readonly string[] =>
  line
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((c) => c.trim())

const MATRIX_HEADER_LINE = 28_117
const MATRIX_FIRST_DATA_LINE = 28_119
const MATRIX_LAST_DATA_LINE = 28_126

describe('the frozen source this task read', () => {
  it('is the file the standing rules name, by hash and by length', () => {
    expect(sourceBytes.length).toBeGreaterThan(0)
    expect(createHash('sha256').update(sourceBytes).digest('hex')).toBe(SOURCE_SHA256)
    expect(sourceLines.length).toBe(SOURCE_LINE_COUNT)
  })
})

/* ==================================================================== *
 * THE ROW COUNT, MEASURED. The plan's span reads L28117-L28126, which is
 * ten lines; the rows are eight. §1a says every span in that document
 * starts on the table header, and this is one of the matrices that
 * confirms it — measured here rather than accepted from the note.
 * ==================================================================== */

describe('MOD-DOH-07’s roles-and-permissions matrix, as the source states it', () => {
  it('puts the header at L28117 and the separator at L28118 — neither is a data row', () => {
    expect(cells(L(MATRIX_HEADER_LINE))).toEqual([
      'Action',
      'Tenant Admin',
      'Supervisor',
      'Quality Manager',
      'Read-only Auditor',
      'Worker',
    ])
    expect(L(MATRIX_HEADER_LINE + 1).replace(/[|\s-]/g, '')).toBe('')
  })

  // The line after L28126 is deliberately NOT cited by number: it is blank,
  // which is exactly why the table stops there, and the locator gate is right
  // that a citation of a blank line states nothing. The assertion below reads
  // it; the title does not point at it.
  it('is a table of exactly eight data rows, and the line after the last is not a ninth', () => {
    const isRow = (n: number): boolean => /^\s*\|/.test(L(n))
    const rows: number[] = []
    for (let n = MATRIX_FIRST_DATA_LINE; isRow(n); n++) rows.push(n)
    expect(rows).toEqual([28_119, 28_120, 28_121, 28_122, 28_123, 28_124, 28_125, 28_126])
    expect(rows.length).toBe(8)
    expect(isRow(MATRIX_LAST_DATA_LINE + 1)).toBe(false)
    // And the span the plan quotes really does enclose two extra lines.
    expect(MATRIX_LAST_DATA_LINE - MATRIX_HEADER_LINE + 1).toBe(rows.length + 2)
  })

  it('this build carries one row per source row, in source order', () => {
    expect(CONTROL_MATRIX.length).toBe(8)
    const sourceControls = Array.from(
      { length: 8 },
      (_, i) => cells(L(MATRIX_FIRST_DATA_LINE + i))[0],
    )
    expect(CONTROL_MATRIX.map((r) => r.control)).toEqual(sourceControls)
  })
})

/* ==================================================================== *
 * EVERY CELL, AGAINST THE SOURCE'S OWN TOKEN.
 *
 * THE EXPECTATION IS NOT DERIVED FROM THE FIELD UNDER TEST. `row.status`
 * is what is being checked; the expected value is parsed out of the
 * frozen source's own cell and converted by `titleCaseCellStatus`, the
 * ONE mapping the spine publishes. A second hand-written copy of that
 * mapping here would be a second thing to drift.
 * ==================================================================== */

/** The leading backticked token of a source cell, before any ` — ` qualifier. */
function sourceToken(cell: string): MatrixStatus {
  const backticked = /`([^`]+)`/.exec(cell)?.[1] ?? ''
  const token = (backticked.split(' — ')[0] ?? '').trim()
  const found = MATRIX_STATUSES.find((s) => s === token)
  if (found === undefined) throw new Error(`unreadable source cell token: ${JSON.stringify(cell)}`)
  return found
}

function sourceStatus(line: number, roleIndex: number): ControlStatus {
  const token = sourceToken(cells(L(line))[roleIndex + 1] ?? '')
  return titleCaseCellStatus(
    { byRole: Object.fromEntries(TENANT_ROLES.map((r) => [r, { status: token }])) as never },
    TENANT_ROLES[roleIndex] as TenantRoleId,
  )
}

describe('every cell agrees with the frozen source', () => {
  it('reads all forty cells off the source and finds all forty in this matrix', () => {
    let checked = 0
    CONTROL_MATRIX.forEach((row, i) => {
      TENANT_ROLES.forEach((role, r) => {
        checked++
        expect(
          cellStatus(row, role),
          `${row.id} / ${role} against L${MATRIX_FIRST_DATA_LINE + i}`,
        ).toBe(sourceStatus(MATRIX_FIRST_DATA_LINE + i, r))
      })
    })
    // Not vacuous: eight rows times five roles, every one read.
    expect(checked).toBe(40)
  })

  it('never leaves a cell’s detail blank — L10238’s rule, forty cells', () => {
    const blanks: string[] = []
    for (const row of CONTROL_MATRIX) {
      for (const role of TENANT_ROLES) {
        if (row.detail[role].trim() === '') blanks.push(`${row.id}/${role}`)
      }
    }
    expect(blanks).toEqual([])
  })

  it('carries the two all-`Not applicable` rows and no third', () => {
    const allNotApplicable = CONTROL_MATRIX.filter((row) =>
      TENANT_ROLES.every((role) => cellStatus(row, role) === 'not-applicable'),
    ).map((r) => r.id)
    expect(allNotApplicable).toEqual(['maintain-per-cell-grant', 'check-availability'])
    // Measured off the source too, so the two lists cannot agree by being
    // the same list read twice.
    const fromSource: number[] = []
    for (let n = MATRIX_FIRST_DATA_LINE; n <= MATRIX_LAST_DATA_LINE; n++) {
      const row = cells(L(n)).slice(1)
      if (row.length === 5 && row.every((c) => sourceToken(c) === 'Not applicable')) fromSource.push(n)
    }
    expect(fromSource).toEqual([28_124, 28_126])
  })
})

/* ==================================================================== *
 * THE TWO KINDS OF ABSENCE, AND THE ONE THE BRIEF CONFLATED.
 * ==================================================================== */

describe('a deferral and a non-existence are not the same promise', () => {
  it('reads twenty table rows off the out-of-V1 register and finds both cited rows', () => {
    const rows: string[] = []
    for (let n = 25_876; /^\s*\|/.test(L(n)); n++) rows.push(L(n))
    expect(rows.length, 'the out-of-V1 register’s table rows at L25876-L25895').toBe(20)
    expect(cells(rows[3] ?? '')[1]).toBe('Worker self-assignment')
    expect(cells(rows[4] ?? '')[1]).toBe('Worker availability and double-booking checks')
  })

  it('finds NO out-of-V1 register row for a per-worker-per-cell grant', () => {
    // The finding the plan's trap note does not carry: row 6 is `Not
    // applicable` for a reason that is not a deferral. If a register row
    // for it ever appears, this goes red and row 6's absence note has to
    // change kind — which is the point of asserting the absence rather
    // than only asserting the two presences above.
    let scanned = 0
    for (let n = 25_876; /^\s*\|/.test(L(n)); n++) {
      scanned++
      expect(L(n).toLowerCase()).not.toContain('per-cell')
      expect(L(n).toLowerCase()).not.toContain('per-worker')
    }
    expect(scanned).toBe(20)
    // And the source says so positively, in this module's own criterion.
    expect(L(28_228)).toContain('no per-worker-per-cell grant table exists anywhere in the platform')
  })

  it('holds every absence note to the invariant that keeps the two kinds apart', () => {
    // THREE, not two. The two all-`Not applicable` rows are the ones the
    // brief names; row 1 carries a third, because its Worker cell is a
    // PROHIBITION whose stated cause is a deferral (L28119 — "self-assignment
    // is deferred beyond V1"). Reading only the token would have dropped the
    // roadmap fact; reading only the reason would have dropped the
    // prohibition. This list was two until the invariant below found the
    // third by refusing to be satisfied with the shorter answer.
    expect(ABSENCE_NOTES.map((r) => r.id)).toEqual([
      'assign-worker',
      'maintain-per-cell-grant',
      'check-availability',
    ])
    // And the capability named is the absent thing, never the row's control
    // name: row 1's control is live for the Supervisor.
    expect(assignmentRow('assign-worker').absence?.capability).toBe('Worker self-assignment')
    expect(assignmentRow('assign-worker').control).toBe('Assign a worker to a run')
    for (const row of ABSENCE_NOTES) {
      const note = row.absence
      expect(note).not.toBeNull()
      if (note === null) continue
      expect(note.line.trim()).not.toBe('')
      if (note.kind === 'deferred-beyond-v1') {
        expect(note.registerRow, `${row.id} must name a register row`).not.toBeNull()
      } else {
        expect(note.registerRow, `${row.id} must name no register row`).toBeNull()
      }
    }
    expect(assignmentRow('maintain-per-cell-grant').absence?.kind).toBe('does-not-exist')
    expect(assignmentRow('check-availability').absence?.kind).toBe('deferred-beyond-v1')
    expect(assignmentRow('check-availability').absence?.registerRow).toBe(5)
  })

  it('catches an absence note that claims a roadmap it does not have — the plant', () => {
    // THE PLANT, and it is exactly the defect the brief's own wording
    // would have produced: row 6 relabelled as a deferral. The invariant
    // is what fires, not a hand-listed exception.
    const planted = {
      ...assignmentRow('maintain-per-cell-grant'),
      absence: {
        ...assignmentRow('maintain-per-cell-grant').absence!,
        kind: 'deferred-beyond-v1' as const,
      },
    }
    expect(planted.absence.kind).toBe('deferred-beyond-v1')
    expect(planted.absence.registerRow).toBeNull()
    // The same check the loop above runs, applied to the planted row.
    const violates =
      planted.absence.kind === 'deferred-beyond-v1' && planted.absence.registerRow === null
    expect(violates, 'the plant must violate the invariant').toBe(true)
    // And the real row does not.
    const real = assignmentRow('maintain-per-cell-grant').absence!
    expect(real.kind === 'deferred-beyond-v1' && real.registerRow === null).toBe(false)
  })

  it('states each absence in the source’s own words, at the line it cites', () => {
    expect(L(28_126)).toContain('availability and double-booking checks are deferred beyond V1')
    expect(L(28_124)).toContain(
      'no per-worker-per-cell grant table exists; cell narrowing uses the required-certification model',
    )
    expect(L(28_088)).toContain('there is no per-worker-per-cell grant table to maintain')
    expect(L(25_880)).toContain('Worker availability and double-booking checks')
  })
})

/* ==================================================================== *
 * THE DEFERRAL-RENDERING RULING. Three sources, one ruling, and the two
 * readings it did not adopt are still on the page.
 * ==================================================================== */

describe('how a deferred capability renders — the ruling three module tasks follow', () => {
  it('finds all three of the disagreeing sources at the lines they are cited at', () => {
    expect(L(25_935)).toContain(
      'No deferred capability renders as a disabled control without an explanatory line',
    )
    expect(L(25_924)).toContain(
      'an explanatory line rather than a disabled control or an empty region',
    )
    expect(L(28_230)).toContain('its absence is stated on the assignment screen rather than implied')
  })

  it('names AC-DOH-07-5 as what decided it, and that criterion says "stated rather than implied"', () => {
    expect(DEFERRAL_RENDERING.decidedBy).toContain('AC-DOH-07-5')
    expect(DEFERRAL_RENDERING.decidedBy).toContain('L28230')
    expect(DEFERRAL_RENDERING.adoptedReading.ref).toBe('SB-DOH-005')
    expect(DEFERRAL_RENDERING.adoptedReading.locator).toBe('L25924')
  })

  it('keeps both unadopted readings, with their own locators — disclosed, not deleted', () => {
    expect(DEFERRAL_RENDERING.notAdopted.map((r) => r.ref)).toEqual([
      'AC-DOH-014-2',
      'the inherited slice-4/5 rule',
    ])
    for (const reading of DEFERRAL_RENDERING.notAdopted) {
      expect(reading.text.trim()).not.toBe('')
      expect(reading.locator).toMatch(/L\d{3,6}/)
    }
  })

  it('scopes the ruling to the matrix axis, so tenant-state disabling is untouched', () => {
    expect(DEFERRAL_RENDERING.scope).toContain('suspension')
    expect(DEFERRAL_RENDERING.ruling).toContain('NO CONTROL')
  })

  /**
   * THE RULING IS ENFORCED BY A TYPE, NOT BY A HABIT. `CellRendering` has
   * three members and none of them is `disabled`, so a screen cannot draw
   * a disabled control for a deferred capability — there is no value to
   * switch on. This asserts the union has not quietly grown a fourth.
   */
  it('gives every cell one of exactly three renderings, and never a disabled one', () => {
    const kinds = new Set<string>()
    let checked = 0
    for (const row of CONTROL_MATRIX) {
      for (const role of TENANT_ROLES) {
        checked++
        kinds.add(assignmentCellRendering(row, role).kind)
      }
    }
    expect(checked).toBe(40)
    expect([...kinds].sort()).toEqual(['absent-with-line', 'control', 'cross-surface'])
    const src = readFileSync(
      join(process.cwd(), 'src/surfaces/doh/modules/doh-07/matrix.ts'),
      'utf8',
    )
    expect(src).not.toMatch(/kind:\s*'disabled'/)
  })

  it('never renders a control for a `Not applicable` cell — all ten of them', () => {
    // The TWO all-`Not applicable` rows, ten cells. Row 1 also carries an
    // absence note and is deliberately not here: it is the row where a
    // control DOES render, for the Supervisor, and folding it in would have
    // made this assertion false for the right reason.
    const notApplicableRows = CONTROL_MATRIX.filter((row) =>
      TENANT_ROLES.every((role) => cellStatus(row, role) === 'not-applicable'),
    )
    expect(notApplicableRows.length).toBe(2)
    let checked = 0
    for (const row of notApplicableRows) {
      for (const role of TENANT_ROLES) {
        checked++
        const rendering = assignmentCellRendering(row, role)
        expect(rendering.kind, `${row.id}/${role}`).toBe('absent-with-line')
        if (rendering.kind === 'absent-with-line') {
          expect(rendering.line).toBe(row.absence?.line)
        }
      }
    }
    expect(checked).toBe(10)
  })

  it('catches a `Not applicable` cell promoted to a control — the plant', () => {
    const real = assignmentRow('check-availability')
    expect(assignmentCellRendering(real, 'TENANT_ADMIN').kind).toBe('absent-with-line')
    const planted: AssignmentMatrixRow = {
      ...real,
      status: { ...real.status, TENANT_ADMIN: 'allowed' },
    }
    // The plant changes exactly the thing it is meant to: this role's
    // rendering, and no other role's.
    expect(assignmentCellRendering(planted, 'TENANT_ADMIN').kind).toBe('control')
    expect(assignmentCellRendering(planted, 'SUPERVISOR').kind).toBe('absent-with-line')
  })
})

/* ==================================================================== *
 * ROW 4 — CLASSIFY FIRST. The token reads `Allowed with conditions` for
 * two of five roles and the act is Client Command Center action 8.
 * ==================================================================== */

describe('row 4 is a place, not a control', () => {
  it('reads two permissive tokens off the source row, so the trap is real', () => {
    const row = cells(L(28_122))
    expect(row[0]).toBe('Reassign a run mid-shift from the Client Command Center')
    expect(sourceToken(row[2] ?? '')).toBe('Allowed with conditions')
    expect(sourceToken(row[3] ?? '')).toBe('Allowed with conditions')
    expect(sourceToken(row[1] ?? '')).toBe('Explicitly prohibited')
  })

  it('renders a statement for all five roles, the two permissive ones included', () => {
    const row = assignmentRow('reassign-from-command-center')
    expect(row.surface).toBe('another-surface')
    for (const role of TENANT_ROLES) {
      expect(assignmentCellRendering(row, role).kind, role).toBe('cross-surface')
      expect(adjacentAffordance(row, cellStatus(row, role)).kind, role).toBe('cross-surface')
    }
    // And the token is NOT corrected on the way past.
    expect(cellStatus(row, 'SUPERVISOR')).toBe('allowed-with-conditions')
    expect(cellStatus(row, 'QUALITY_MANAGER')).toBe('allowed-with-conditions')
  })

  it('catches the row reclassified as this screen’s own — the plant', () => {
    const real = assignmentRow('reassign-from-command-center')
    const planted: AssignmentMatrixRow = { ...real, surface: 'screen' }
    // The plant changes exactly what it should: the two permissive cells
    // become controls, and the three prohibitions stay absent.
    expect(assignmentCellRendering(planted, 'SUPERVISOR').kind).toBe('control')
    expect(assignmentCellRendering(planted, 'QUALITY_MANAGER').kind).toBe('control')
    expect(assignmentCellRendering(planted, 'TENANT_ADMIN').kind).toBe('absent-with-line')
    // And the shipped gate reports it, which is what would actually go red.
    expect(
      inlineControlsOnAdjacentCapabilities(
        [{ ...planted, boundary: 'custom-report-builder' as const }],
        TENANT_ROLES,
        cellStatus,
      ),
    ).not.toEqual([])
  })

  it('passes the shipped adjacent-capability gate, and the walk is not vacuous', () => {
    expect(
      inlineControlsOnAdjacentCapabilities(CONTROL_MATRIX, TENANT_ROLES, cellStatus),
    ).toEqual([])
    // NON-VACUITY, and this is the first matrix in the tree that can give
    // it. Wave 0 recorded its gate as passing vacuously because all
    // fourteen shipped adjacent rows were prohibitive; this one is not.
    const adjacent = CONTROL_MATRIX.filter((r) => r.surface === 'another-surface')
    expect(adjacent.length).toBe(1)
    const permissive = TENANT_ROLES.filter((role) =>
      ['allowed', 'allowed-with-conditions', 'read-only'].includes(
        cellStatus(adjacent[0] as AssignmentMatrixRow, role),
      ),
    )
    expect(permissive).toEqual(['SUPERVISOR', 'QUALITY_MANAGER'])
  })

  it('mints no routing pointer, because no fold indexes one for this act', () => {
    const registered = DOH_BOUNDARY_REGISTER.map((b) => b.capability.toLowerCase()).join(' ')
    expect(registered).not.toContain('reassign')
    expect(CONTROL_MATRIX.some((r) => 'boundary' in r)).toBe(false)
    expect(COMMAND_CENTER_ACTION_8.whyNoLink).toContain('boundary register')
  })

  it('ships no Hub command for the act, which is the guarantee', () => {
    expect(HUB_COMMAND_TYPES).not.toContain('DOH_REASSIGN_RUN')
    expect(HUB_COMMAND_TYPES).toContain('DOH_SUBSTITUTE_WORKER')
  })

  it('cross-checks the act at all three locators the plan names', () => {
    expect(L(13_421)).toContain('Command Center action 8')
    expect(L(53_791)).toContain('Client Command Center action 8 executes through the same service')
    expect(L(53_798)).toContain('action 8 reassignment mid-shift')
    expect(L(53_787)).toContain('WF-EXE-001')
  })
})

/* ==================================================================== *
 * DEC-PLUS-001 — quoted, never expanded.
 * ==================================================================== */

describe('DEC-PLUS-001 — the ordering the source declines to define', () => {
  it('states at L13456 that the ordering is undefined, in the words this build quotes', () => {
    expect(L(13_456)).toContain('DEC-PLUS-001')
    expect(L(13_456)).toContain('is not defined across five additive, non-hierarchical roles')
    expect(L(13_456)).toContain('does not invent an ordering')
    expect(DEC_PLUS_001.locator).toBe('L13456')
  })

  it('is carried by exactly one permission-matrix cell in the whole of slice 6', () => {
    // Measured over the seven slice-6 module sections, L27673-L30184, so
    // the claim that hoisting this into the shared canon would serve one
    // consumer is checked rather than asserted.
    const cellLines: number[] = []
    for (let n = 27_673; n <= 30_184; n++) {
      const line = L(n)
      if (!/^\s*\|/.test(line)) continue
      if (/Supervisor and above|Quality Manager and above/.test(line)) cellLines.push(n)
    }
    expect(cellLines).toEqual([28_122])
  })

  it('reads the Quality Manager’s status from its own column, never from the phrase', () => {
    const row = assignmentRow('reassign-from-command-center')
    expect(cellStatus(row, 'QUALITY_MANAGER')).toBe(sourceStatus(28_122, 2))
    // The phrase is quoted in the detail and is not what the status came from.
    expect(row.detail.QUALITY_MANAGER).toContain('Supervisor and above')
    expect(row.detail.QUALITY_MANAGER).toContain('DEC-PLUS-001')
  })

  it('defines no ordering construct over the five tenant roles anywhere in this module', () => {
    // IDENTIFIERS, not prose. The word "seniority" appears in this module's
    // rendered disclosure — "there is no rank, order or seniority relation
    // over the five tenant roles in this build to map it with" — which is
    // the sentence that STATES the rule, and a gate that matched it would
    // push somebody to delete the disclosure to go green. Sixth time in
    // this build a check has matched a token inside the term that denies it.
    // So this matches the semantic unit: something a caller could invoke.
    const files = [
      'src/surfaces/doh/modules/doh-07/matrix.ts',
      'src/surfaces/doh/modules/doh-07/rulings.ts',
      'app/hub/worker-assignment/fixtures.ts',
      'app/hub/worker-assignment/WorkerAssignmentScreen.tsx',
    ]
    for (const file of files) {
      const src = stripComments(readFileSync(join(process.cwd(), file), 'utf8'))
      expect(src, file).not.toMatch(
        /\brolesAtOrAbove\b|\broleRank\b|\broleOrder\b|\brolesAbove\b|\bseniorityOf\b/,
      )
    }
    // Non-vacuity: the stripper left the code it was handed.
    expect(stripComments(readFileSync(join(process.cwd(), files[1]!), 'utf8'))).toContain(
      'DEC_PLUS_001',
    )
  })

  it('proves the status comes from the column and not from the phrase — two plants', () => {
    const real = assignmentRow('reassign-from-command-center')
    expect(cellStatus(real, 'QUALITY_MANAGER')).toBe('allowed-with-conditions')

    // PLANT ONE: delete the phrase entirely. Nothing about the status moves,
    // because nothing reads it. If the status were derived from "Supervisor
    // and above", this would change it.
    const phraseGone: AssignmentMatrixRow = {
      ...real,
      detail: { ...real.detail, QUALITY_MANAGER: 'Allowed with conditions.' },
    }
    expect(cellStatus(phraseGone, 'QUALITY_MANAGER')).toBe('allowed-with-conditions')
    expect(assignmentCellRendering(phraseGone, 'QUALITY_MANAGER').kind).toBe('cross-surface')

    // PLANT TWO: change the COLUMN and leave the phrase alone. The status
    // moves, which is what says the column is what is read.
    const columnChanged: AssignmentMatrixRow = {
      ...real,
      status: { ...real.status, QUALITY_MANAGER: 'explicitly-prohibited' },
    }
    expect(cellStatus(columnChanged, 'QUALITY_MANAGER')).toBe('explicitly-prohibited')
    expect(columnChanged.detail.QUALITY_MANAGER).toContain('Supervisor and above')
    // And no other role's cell moved with it.
    expect(cellStatus(columnChanged, 'SUPERVISOR')).toBe('allowed-with-conditions')
  })

  it('is contradicted by its own row under any ordering, and both cells still render', () => {
    // The Tenant Admin is `Explicitly prohibited` on the row whose Quality
    // Manager cell says "Supervisor and above". No ordering makes both
    // true, which is why none is chosen.
    const row = assignmentRow('reassign-from-command-center')
    expect(cellStatus(row, 'TENANT_ADMIN')).toBe('explicitly-prohibited')
    expect(cellStatus(row, 'QUALITY_MANAGER')).toBe('allowed-with-conditions')
    expect(DEC_PLUS_001.whereItLands).toContain('Explicitly prohibited')
  })
})

/* ==================================================================== *
 * ROW 7, D11, AND REACH.
 * ==================================================================== */

describe('reach is derived from the matrix, and catalogue B is narrower', () => {
  it('derives all five roles, the Worker included, and derives it from the source’s cells', () => {
    // THE EXPECTATION IS BUILT FROM THE SOURCE, not from `CONTROL_MATRIX`.
    // A matrix row is `screen` unless it is row 4, and the source's own
    // tokens decide the rest — so this is the rule applied to the frozen
    // table rather than to the field under test.
    const fromSource = TENANT_ROLES.filter((role, r) => {
      const column: ControlStatus[] = []
      for (let n = MATRIX_FIRST_DATA_LINE; n <= MATRIX_LAST_DATA_LINE; n++) {
        if (n === 28_122) continue // the one `another-surface` row
        column.push(sourceStatus(n, r))
      }
      void role
      return (
        column.some((s) => ['allowed', 'allowed-with-conditions', 'read-only'].includes(s)) &&
        !column.includes('unavailable')
      )
    })
    expect(fromSource).toEqual([
      'TENANT_ADMIN',
      'SUPERVISOR',
      'QUALITY_MANAGER',
      'READONLY_AUDITOR',
      'WORKER',
    ])
    expect(MOD_DOH_07_REACH).toEqual(fromSource)
    expect(rolesReachingByMatrix(CONTROL_MATRIX, cellStatus)).toEqual(fromSource)
  })

  it('keeps the Worker’s row-7 grant and states where it is honoured instead', () => {
    const row = assignmentRow('view-assignments')
    expect(cellStatus(row, 'WORKER')).toBe('allowed-with-conditions')
    expect(L(28_125)).toContain('own assignments only')
    expect(row.detail.WORKER).toContain('D11')
    expect(row.detail.WORKER).toContain('own assignments only')
    expect(L(28_135)).toContain(
      'Each assigned worker sees the run on their own device under their own identity',
    )
  })

  it('measures the catalogue-B narrowing off both source lines rather than restating it', () => {
    const catalogueCell = cells(L(48_109))[3]
    expect(catalogueCell).toBe('Supervisor')
    expect(cells(L(48_109))[1]).toBe('Assignment and substitution')

    const NAMES: Readonly<Record<TenantRoleId, string>> = {
      TENANT_ADMIN: 'Tenant Admin',
      SUPERVISOR: 'Supervisor',
      QUALITY_MANAGER: 'Quality Manager',
      READONLY_AUDITOR: 'Read-only Auditor',
      WORKER: 'Worker',
    }
    const admittedByMatrix = TENANT_ROLES.filter((_, r) =>
      ['allowed', 'allowed-with-conditions', 'read-only'].includes(sourceStatus(28_125, r)),
    )
    const omitted = admittedByMatrix
      .filter((role) => !(catalogueCell ?? '').includes(NAMES[role]))
      // The Worker is not a narrowing: D11 and the catalogue agree there.
      .filter((role) => role !== 'WORKER')
      .map((role) => NAMES[role])

    expect(omitted).toEqual(['Tenant Admin', 'Quality Manager', 'Read-only Auditor'])
    expect(CATALOGUE_B_NARROWING.omittedRoles).toEqual(omitted)
    // And wave 0's own record of the same finding agrees, independently.
    const waveZero = DOH_CATALOGUE_B_REACH_NARROWER.find((n) => n.screenId === 'SCR-DOH-15')
    expect(waveZero?.omittedRoles).toEqual(omitted)
  })

  it('records the catalogue’s own navigation entry rather than overwriting it', () => {
    expect(cells(L(48_109))[5]).toBe('Run detail')
    expect(CATALOGUE_B_NARROWING.entryPointNote).toContain('Run detail')
  })
})

/* ==================================================================== *
 * THE TWO SEAMS THIS MODULE CLOSES.
 * ==================================================================== */

describe('the seams MOD-DOH-07 owns are closed by shipping their content', () => {
  it('closes exactly the seams whose owner names this module, and no others', () => {
    const mine = DOH_SEAMS.filter((s) => s.ownerModule.includes('MOD-DOH-07')).map((s) => s.id)
    expect(mine.sort()).toEqual(['qualification-gate', 'worker-shift-meter'])
    expect(SEAMS_CLOSED_HERE.map((c) => c.seamId).sort()).toEqual(mine.sort())
    for (const closure of SEAMS_CLOSED_HERE) {
      expect(dohSeamStatus(dohSeamById(closure.seamId))).toBe('closed')
      expect(closure.whatItNowCarries.trim()).not.toBe('')
    }
  })

  it('counts a Worker-Shift per worker who actually worked, never per assignment', () => {
    expect(L(27_039)).toContain('one per worker per calendar shift regardless of run count')
    expect(L(28_233)).toContain('counts one Worker-Shift')
    // One worker on three runs is one shift.
    expect(
      workerShiftCount([
        { workerId: 'W1', workedAtAll: true },
        { workerId: 'W1', workedAtAll: true },
        { workerId: 'W1', workedAtAll: true },
      ]),
    ).toBe(1)
    // A substitution where both worked is two.
    expect(
      workerShiftCount([
        { workerId: 'W1', workedAtAll: true },
        { workerId: 'W2', workedAtAll: true },
      ]),
    ).toBe(2)
    // A substitute whose command never landed did not work, and is not billed.
    expect(
      workerShiftCount([
        { workerId: 'W1', workedAtAll: true },
        { workerId: 'W2', workedAtAll: false },
      ]),
    ).toBe(1)
  })

  it('enforces the qualification gate at assignment under the tenant’s posture', () => {
    expect(L(28_132)).toContain('Under the strict posture a failing check blocks the assignment')
    expect(QUALIFICATION_CHIPS).toEqual([
      'Qualified',
      'Expires in 3 days',
      'Expired',
      'Not held',
    ])
    expect(L(28_216)).toContain('Qualified, Expires in 3 days, Expired or Not held')
    // Two of the four fail; the warning-ladder chip does not, because the
    // certification is still held.
    expect(QUALIFICATION_CHIPS.filter(chipFailsTheGate)).toEqual(['Expired', 'Not held'])
  })
})

/* ==================================================================== *
 * SCOPE FILTERS THE SELECTOR — slice-4 defect 7.
 * ==================================================================== */

describe('own-Area scope filters what is read, not what is drawn', () => {
  it('builds the Supervisor’s candidate list from their own Areas, and it excludes somebody', () => {
    const inScope = candidatesInScope(['AREA-RIVERSIDE-ASSY'])
    expect(inScope.length).toBeLessThan(CANDIDATE_WORKERS.length)
    expect(inScope.map((w) => w.workerId)).not.toContain('WKR-0407')
    // A filter with nothing to remove proves nothing.
    expect(CANDIDATE_WORKERS.some((w) => w.areaId !== 'AREA-RIVERSIDE-ASSY')).toBe(true)
    expect(L(28_119)).toContain('own Area scope, qualification check applies')
  })

  it('never reads the double-booking field the deferred check would have read', () => {
    // The seed carries it so the absence can be proved. If a later edit
    // starts reading it, the deferred capability has been half-built and
    // the screen's stated absence has become false.
    expect(CANDIDATE_WORKERS.some((w) => w.alreadyOnAnotherRunAt !== null)).toBe(true)
    for (const file of [
      'app/hub/worker-assignment/WorkerAssignmentScreen.tsx',
      'src/surfaces/doh/modules/doh-07/matrix.ts',
    ]) {
      expect(readFileSync(join(process.cwd(), file), 'utf8'), file).not.toContain(
        'alreadyOnAnotherRunAt',
      )
    }
  })
})
