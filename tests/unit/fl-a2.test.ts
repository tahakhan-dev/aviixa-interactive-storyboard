import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { DecisionReading } from '@/disclosure/decisions'
import {
  FL_MATRIX_SHAPE,
  TENANT_ADMIN_OPEN_CELLS,
  controlsOnActsHeldElsewhere,
  frontlineAffordance,
} from '@/frontline/matrix'
import { FL_ACTS_HELD_ELSEWHERE } from '@/frontline/cross-surface'
import { CAPTURE_STATES, CAPTURE_STATE_LABEL, captureStateLine } from '@/frontline/capture'
import { functionalitiesNamingNoPattern, patternsForModule } from '@/frontline/fallbacks'
import { flDestinationBySlug } from '@/frontline/screens'
import {
  A2_CARD,
  A2_IDENTITY_CARD,
  A2_RUN_STATES,
  COMPLETION_CLAIM_NEVER_MADE,
  NO_PACE_NO_TIMER_NO_RANKING,
  RUN_COMPLETION_WORDS,
  SB_FL_011,
} from '@/frontline/modules/fl-a2/charter'
import {
  A2_COLUMNS,
  A2_COLUMN_HEADINGS,
  A2_MATRIX,
  A2_SHAPE,
  A2_TENANT_ADMIN_OPEN_DECISION,
  type A2Column,
} from '@/frontline/modules/fl-a2/matrix'
import {
  A2_ACCEPTANCE_CRITERIA,
  A2_DISCLOSURES,
  A2_FUNCTIONALITIES,
  A2_FUNCTIONALITIES_NAMING_NO_PATTERN,
  A2_LIST,
  A2_PATTERNS_FROM_FUNCTIONALITIES,
  A2_PATTERNS_FROM_MAP,
  A2_PATTERN_DIVERGENCE,
  A2_PENDING_FIXTURE,
  A2_SOURCE_FINDINGS,
  ARRIVING_COMMAND_BANNER,
  PACKAGE_READINESS_DETAIL,
  PARKED_RUN_REASON,
  SOURCE_QUOTED_HAZARD_WORDS,
  a2RenderedStrings,
  a2RunsInOrder,
  manualSyncOutcome,
  pendingTotal,
  runIsEnterable,
  syncSheetRows,
} from '@/frontline/modules/fl-a2/service'

/**
 * `MOD-FL-A2` — My Runs, checked against the FROZEN SOURCE rather than
 * against a brief.
 *
 * WHY EVERY CLAIM HERE OPENS THE FILE. The brief this module was built from
 * is a hypothesis, and this build has recorded ten brief-supplied assertions
 * that could not fail and eleven wrong citations. So a transcription is
 * checked by reading the line it cites and looking for the words, and a
 * locator is checked by asking whether the identifier really occurs there.
 * Nothing below asserts a string against another string this task also
 * wrote.
 *
 * EVERY GATE IN THIS FILE WAS PLANTED AND WATCHED GO RED before it was left
 * green — one defect per gate, in the thing the gate claims to protect, then
 * restored. The `FAILS IF` note on each one names the defect that was
 * actually planted, not one that would have been convenient.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')

function srcLine(n: number): string {
  const l = LINES[n - 1]
  if (l === undefined) throw new Error(`the frozen source has no line ${n}`)
  return l
}

/**
 * Both sides folded identically before comparison: markdown emphasis and
 * backticks stripped, curly quotes folded to ASCII, whitespace collapsed,
 * lowercased. Every one of those was a real mismatch first — the source
 * writes `MOD-FL-A2` in backticks and a data field cannot.
 */
function norm(s: string): string {
  return s
    .replace(/[`*_]/g, '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/** Every `L<number>` in a `sourceRef`, in order. Ranges contribute both ends. */
function locatorsOf(sourceRef: string): readonly number[] {
  return [...sourceRef.matchAll(/L(\d{3,6})/g)].map((m) => Number(m[1]))
}

/** The identifier a `sourceRef` anchors on, where it has one. */
function anchorOf(sourceRef: string): string | null {
  const m = sourceRef.match(/^([A-Z][A-Z0-9-]{3,})\s+·/)
  return m?.[1] ?? null
}

/* ==================================================================== *
 * THE SHAPE, AND THE ARITHMETIC THAT CHECKS IT.
 * ==================================================================== */

describe('the shape of MOD-FL-A2’s permission matrix', () => {
  // FAILS IF: a row is dropped or added. Planted: row 5 deleted. Rows went
  // to 8 and cells to 40 while the data span stayed nine lines long, which
  // is exactly why the span is held apart from the count.
  it('is nine rows over nine data lines, five columns, forty-five cells', () => {
    expect(A2_SHAPE.rows).toBe(9)
    expect(A2_SHAPE.columns).toBe(5)
    expect(A2_SHAPE.cells).toBe(45)
    expect(A2_SHAPE.rows * A2_SHAPE.columns).toBe(A2_SHAPE.cells)
    expect(A2_SHAPE.lastDataLine - A2_SHAPE.firstDataLine + 1).toBe(A2_SHAPE.rows)
    expect(A2_SHAPE.separatorLine).toBe(A2_SHAPE.headerLine + 1)
    expect(A2_SHAPE.firstDataLine).toBe(A2_SHAPE.separatorLine + 1)
  })

  // FAILS IF: this module's reading of its own span disagrees with wave 0's
  // reading of all twelve. Two independent transcriptions of one table.
  // Planted: headerLine moved to 40358. Went red on three fields.
  it('agrees with wave 0’s independent reading of the same table', () => {
    const waveZero = FL_MATRIX_SHAPE.find((m) => m.module === 'MOD-FL-A2')
    expect(waveZero).toBeDefined()
    expect(waveZero?.rows).toBe(A2_SHAPE.rows)
    expect(waveZero?.columns).toBe(A2_SHAPE.columns)
    expect(waveZero?.headerLine).toBe(A2_SHAPE.headerLine)
    expect(waveZero?.separatorLine).toBe(A2_SHAPE.separatorLine)
    expect(waveZero?.firstDataLine).toBe(A2_SHAPE.firstDataLine)
    expect(waveZero?.lastDataLine).toBe(A2_SHAPE.lastDataLine)
  })

  // FAILS IF: the header row is not where the shape says, or a column
  // heading is re-worded. Planted: 'Quality Manager' shortened to 'Quality'.
  it('reads its five column headings off the header line itself', () => {
    const header = srcLine(A2_SHAPE.headerLine)
      .split('|')
      .map((c) => c.trim())
      .filter((c) => c.length > 0)
    expect(header[0]).toBe('Action')
    expect(header.slice(1)).toEqual(A2_COLUMNS.map((c) => A2_COLUMN_HEADINGS[c]))
  })

  // FAILS IF: the separator line is not a separator, which is what an
  // off-by-one span looks like. Planted: separatorLine 40361.
  it('cites a real separator line and nine real data lines', () => {
    expect(srcLine(A2_SHAPE.separatorLine).replace(/\s/g, '')).toBe('|---|---|---|---|---|---|')
    for (let n = A2_SHAPE.firstDataLine; n <= A2_SHAPE.lastDataLine; n += 1) {
      expect(srcLine(n).startsWith('| '), `L${n} is a data row`).toBe(true)
    }
    // and the line before the header is blank while the line after the last
    // data row is not another data row — the span is bounded on both sides.
    expect(srcLine(A2_SHAPE.headerLine - 1).trim()).toBe('')
    expect(srcLine(A2_SHAPE.lastDataLine + 1).startsWith('| ')).toBe(false)
  })
})

/* ==================================================================== *
 * THE TRANSCRIPTION, CELL BY CELL, AGAINST THE LINE IT CITES.
 * ==================================================================== */

describe('every row and every cell against its own source line', () => {
  // FAILS IF: a row cites the wrong line, or its Action text was
  // paraphrased. Planted: row 8's control shortened to 'Reorder an assigned
  // Run'.
  it('finds each row’s action text in the line the row cites', () => {
    expect(A2_MATRIX).toHaveLength(9)
    for (const row of A2_MATRIX) {
      const [n] = locatorsOf(row.sourceRef)
      expect(n, `${row.id} names a line`).toBeDefined()
      const cells = srcLine(n as number).split('|').map((c) => c.trim())
      expect(norm(cells[1] ?? ''), `${row.id} action column`).toBe(norm(row.control))
    }
  })

  // FAILS IF: a cell's words are not the cell's words. This is the check
  // that catches an invented note and a note quietly trimmed to its token.
  // Planted: row 1's Supervisor cell flattened from
  // 'Not applicable — no execution session on this surface' to the shorter
  // 'Not applicable — no execution session' its four neighbours carry, which
  // is precisely the drift a human transcription makes. Went red.
  it('finds every one of the forty-five cells in its row’s source line', () => {
    let counted = 0
    for (const row of A2_MATRIX) {
      const [n] = locatorsOf(row.sourceRef)
      const cells = srcLine(n as number).split('|').map((c) => c.trim())
      A2_COLUMNS.forEach((column, i) => {
        const fromSource = cells[i + 2] ?? ''
        const cell = row.cells[column]
        expect(cell, `${row.id}.${column} exists`).toBeDefined()
        expect(fromSource.length, `${row.id}.${column} is not blank in the source`).toBeGreaterThan(0)
        expect(norm(fromSource), `${row.id}.${column}`).toBe(norm(cell.note))
        counted += 1
      })
    }
    expect(counted).toBe(45)
  })

  // FAILS IF: an outcome is mapped to a token the cell does not carry. The
  // token is the cell's own opening words, so the outcome is derivable and
  // this is a second reading of the same cell. Planted: row 6's Worker
  // outcome set to 'allowed'.
  it('maps every outcome to the token the cell actually opens with', () => {
    const TOKEN: Readonly<Record<string, string>> = {
      allowed: 'Allowed',
      allowedWithConditions: 'Allowed with conditions',
      readOnly: 'Read-only',
      unavailable: 'Unavailable',
      explicitlyProhibited: 'Explicitly prohibited',
      clientDecisionRequired: 'Client Decision Required',
      notApplicable: 'Not applicable',
    }
    for (const row of A2_MATRIX) {
      for (const column of A2_COLUMNS) {
        const cell = row.cells[column]
        const token = TOKEN[cell.outcome]
        expect(token, `${cell.outcome} is a known token`).toBeDefined()
        // WHOLE TOKEN, NOT A PREFIX, and the difference is not pedantic:
        // `Allowed` is a prefix of `Allowed with conditions`, so a prefix
        // test passes an `allowedWithConditions` cell retyped `allowed`,
        // which is exactly the widening this gate exists to catch. Row 6's
        // Worker cell is the one cell in this matrix where that applies.
        const n = norm(cell.note)
        const t = norm(token as string)
        expect(n === t || n.startsWith(`${t} —`), `${row.id}.${column} opens with ${token}`).toBe(
          true,
        )
      }
    }
  })

  // FAILS IF: the token tally and the cell count disagree — the shape a
  // truncated transcription takes when the row count still looks right.
  // Planted: row 4's Tenant Admin cell retyped 'explicitlyProhibited'.
  it('sums its five tokens to the cell count', () => {
    const tally = new Map<string, number>()
    for (const row of A2_MATRIX) {
      for (const column of A2_COLUMNS) {
        const o = row.cells[column].outcome
        tally.set(o, (tally.get(o) ?? 0) + 1)
      }
    }
    expect(tally.get('explicitlyProhibited')).toBe(27)
    expect(tally.get('notApplicable')).toBe(11)
    expect(tally.get('allowed')).toBe(5)
    expect(tally.get('allowedWithConditions')).toBe(1)
    expect(tally.get('clientDecisionRequired')).toBe(1)
    expect([...tally.values()].reduce((a, b) => a + b, 0)).toBe(45)
    // The two tokens this matrix does not carry, stated rather than assumed:
    // no `Unavailable` cell means the overload at L42114 against L42120 does
    // not arise here, and no `Read-only` cell means nothing on this screen
    // is visible-and-unchangeable.
    expect(tally.get('unavailable')).toBeUndefined()
    expect(tally.get('readOnly')).toBeUndefined()
  })

  // FAILS IF: a row's governing sentence is not at the line it cites, or the
  // identifier it anchors on is not there. No window: an identifier's line
  // is a fact stated exactly. Planted: row 7's whyRef moved from
  // FUNC-A2-04-2-1 · L40446 to L40445, its sub-feature heading. Went red on
  // the anchor before it went red on the words.
  it('finds each row’s governing sentence, and its anchor, at the cited line', () => {
    for (const row of A2_MATRIX) {
      const [n] = locatorsOf(row.whyRef)
      const line = srcLine(n as number)
      const anchor = anchorOf(row.whyRef)
      if (anchor !== null) {
        expect(line.includes(anchor), `${row.whyRef} anchor is at L${n}`).toBe(true)
      }
      expect(norm(line).includes(norm(row.why)), `${row.id} why at L${n}`).toBe(true)
    }
  })

  // FAILS IF: `routedTo` grows an entry. Every one of the eleven
  // `Not applicable — no execution session` cells names a session this
  // matrix has no row for, so a route would have to point outside it — and
  // the type refuses that, which is what this gate records as a fact rather
  // than a hope. Planted: `routedTo: { SUPERVISOR: 'enter-a-ready-run' }` on
  // row 1, which compiles and is wrong. Went red.
  it('routes nothing, because this matrix has no session row', () => {
    for (const row of A2_MATRIX) {
      expect(Object.keys(row.routedTo), `${row.id} routes nothing`).toEqual([])
    }
    expect(A2_MATRIX.map((r) => r.id)).not.toContain('session')
  })
})

/* ==================================================================== *
 * THE ORDER OF QUESTIONS, AS THIS MATRIX ANSWERS IT.
 * ==================================================================== */

describe('what each cell draws', () => {
  // FAILS IF: this module draws a control for an act the source places on
  // another surface. Wave 0's own gate, run over this matrix. Planted: row 9
  // reclassified `screen`. Went red naming it as an EXCL-FL-06 invariant
  // exclusion classified `screen`, and a second time for the two permissive
  // cells that then drew controls.
  it('draws no control on any row whose act is held on another surface', () => {
    expect(controlsOnActsHeldElsewhere(A2_MATRIX, A2_COLUMNS)).toEqual([])
  })

  // FAILS IF: the module grows a fifth control or loses one of its four.
  // Rows 1, 4, 6 and 7 are the whole of what this screen draws, all four the
  // Worker's; every other permissive cell in the matrix is on row 9, whose
  // act is the Delivery Operations Hub's. Planted: row 8's Worker cell set
  // to `allowed`, which is the sort control this screen must never grow.
  // Went red with a fifth entry.
  it('draws exactly four controls, all of them the Worker’s', () => {
    const controls: string[] = []
    for (const row of A2_MATRIX) {
      for (const column of A2_COLUMNS) {
        if (frontlineAffordance(row, column).kind === 'control') {
          controls.push(`${row.id}.${column}`)
        }
      }
    }
    expect(controls).toEqual([
      'view-own-assigned-work.WORKER',
      'enter-a-ready-run.WORKER',
      'trigger-a-manual-sync.WORKER',
      'view-the-sync-detail-sheet.WORKER',
    ])
  })

  // FAILS IF: row 9's permissive Supervisor and Quality Manager cells draw
  // anything. Both read `Allowed` and both end "not here"; EXCL-FL-06
  // (L39489) makes the act an Invariant exclusion. Planted: metElsewhere
  // cast to null while surface stayed `another-surface` —
  // `frontlineAffordance` threw wave 0's own refusal and the gate went red.
  it('turns row 9’s two Allowed cells into cross-surface statements', () => {
    const row = A2_MATRIX.find((r) => r.id === 'cancel-a-run')
    expect(row).toBeDefined()
    if (row === undefined) throw new Error('MOD-FL-A2 has no cancel-a-run row')
    expect(row.cells.SUPERVISOR.outcome).toBe('allowed')
    expect(row.cells.QUALITY_MANAGER.outcome).toBe('allowed')
    for (const column of A2_COLUMNS) {
      const drawn = frontlineAffordance(row, column)
      expect(drawn.kind, `${column} on row 9`).toBe('cross-surface')
      expect(drawn.kind === 'cross-surface' ? drawn.surface : null).toBe('SURF-DOH')
    }
    // and both cells really do end in the words "not here", at L40369.
    const cells = srcLine(40369).split('|').map((c) => c.trim())
    expect(norm(cells[3] ?? '').endsWith('not here')).toBe(true)
    expect(norm(cells[4] ?? '').endsWith('not here')).toBe(true)
    // EXCL-FL-06 is at L39489 and its Class column reads Invariant.
    expect(srcLine(39489)).toContain('EXCL-FL-06')
    expect(srcLine(39489).split('|').map((c) => c.trim()).at(-2)).toBe('Invariant')
  })

  // FAILS IF: row 9's cross-surface wording is spelled here instead of read
  // from the surface-level register. Three modules meet this act and one
  // catching it does not protect the other two, so the wording must be the
  // register's own object. Planted: metElsewhere.note replaced with an
  // equivalent hand-written sentence. Went red on identity.
  it('reads row 9’s act from FL_ACTS_HELD_ELSEWHERE rather than re-spelling it', () => {
    const registered = FL_ACTS_HELD_ELSEWHERE.find((a) =>
      a.capability.startsWith('Cancelling a Run, and terminally completing one.'),
    )
    expect(registered).toBeDefined()
    const row = A2_MATRIX.find((r) => r.id === 'cancel-a-run')
    expect(row?.metElsewhere?.note).toBe(registered?.whatHappensThere)
    expect(row?.metElsewhere?.where === 'another-surface' ? row.metElsewhere.surface : null).toBe(
      registered?.owningSurface,
    )
  })

  // FAILS IF: row 3 stops being a cross-surface statement, or row 2 becomes
  // one. The two look identical through the exclusion register's "Where it
  // lives instead" column and they are not: EXCL-FL-04 is Placement and
  // names the Hub as where allocation lives, EXCL-FL-07 is Invariant and the
  // module's own Security line says no deep link reaches another identity's
  // work. Planted: row 2 reclassified `another-surface` to SURF-CC. Went red
  // on the row-id list.
  it('classifies exactly two rows as another surface, and both name where', () => {
    const elsewhere = A2_MATRIX.filter((r) => r.surface === 'another-surface')
    expect(elsewhere.map((r) => r.id)).toEqual(['claim-unassigned-work', 'cancel-a-run'])
    for (const row of elsewhere) {
      expect(row.metElsewhere, `${row.id} names where`).not.toBeNull()
      expect((row.metElsewhere?.note ?? '').length).toBeGreaterThan(40)
    }
    // The two exclusion-register rows this pair rests on, read at their own
    // lines rather than quoted from the brief.
    const excl04 = srcLine(39487).split('|').map((c) => c.trim())
    expect(excl04[1]).toBe('`EXCL-FL-04`')
    expect(excl04[2]).toBe('In-application work allocation')
    expect(excl04[4]).toBe('Delivery Operations Hub')
    expect(excl04[5]).toBe('Placement')
    const excl07 = srcLine(39490).split('|').map((c) => c.trim())
    expect(excl07[1]).toBe('`EXCL-FL-07`')
    expect(excl07[5]).toBe('Invariant')
    // and row 2 is a refusal for every column, with no pointer anywhere.
    const row2 = A2_MATRIX.find((r) => r.id === 'view-another-workers-work')
    if (row2 === undefined) throw new Error('MOD-FL-A2 has no view-another-workers-work row')
    for (const column of A2_COLUMNS) {
      expect(frontlineAffordance(row2, column).kind, column).toBe('refusal')
    }
  })

  // FAILS IF: the one open cell stops deferring, or a second cell starts.
  // AC-FL-009-5 (L39948) forbids resolving it in either direction, and wave
  // 0 enumerates all eleven such cells across the twelve matrices — exactly
  // one of them is this module's. Planted: openDecision set to null on row
  // 1's Tenant Admin cell.
  it('carries exactly one Client Decision Required cell, and it defers', () => {
    const open: string[] = []
    for (const row of A2_MATRIX) {
      for (const column of A2_COLUMNS) {
        const cell = row.cells[column]
        if (cell.outcome === 'clientDecisionRequired') {
          open.push(`${row.id}.${column}`)
          expect(cell.openDecision, `${row.id}.${column} defers`).toBe(
            A2_TENANT_ADMIN_OPEN_DECISION,
          )
        } else {
          expect(cell.openDecision, `${row.id}.${column} defers to nothing`).toBeNull()
        }
      }
    }
    expect(open).toEqual(['view-own-assigned-work.TENANT_ADMIN'])
    const waveZero = TENANT_ADMIN_OPEN_CELLS.filter((c) => c.module === 'MOD-FL-A2')
    expect(waveZero.map((c) => c.sourceRef)).toEqual(['L40361'])
    expect(srcLine(39948)).toContain('AC-FL-009-5')
    expect(A2_TENANT_ADMIN_OPEN_DECISION).toBe('AC-FL-009-5')
  })
})

/* ==================================================================== *
 * THE IDENTITY CARD AND THE STATE VOCABULARY.
 * ==================================================================== */

describe('the module card, transcribed', () => {
  // FAILS IF: a card statement is paraphrased, trimmed, or cites the wrong
  // line. Planted: the Purpose field's "and without allocation" dropped —
  // three words, and the whole point of the module. Went red.
  it('finds every card statement at the line it cites', () => {
    for (const s of A2_CARD) {
      const [n] = locatorsOf(s.sourceRef)
      expect(n, `${s.field} names a line`).toBeDefined()
      const line = norm(srcLine(n as number))
      // The source's own field label opens the line, so its presence is a
      // second reading of the same locator.
      expect(line.length, `${s.field} L${n} is not blank`).toBeGreaterThan(0)
      for (const sentence of s.text.split(/(?<=\.)\s+/).filter((x) => x.trim().length >= 25)) {
        expect(line.includes(norm(sentence)), `${s.field}: "${sentence.slice(0, 60)}" at L${n}`).toBe(
          true,
        )
      }
    }
  })

  // FAILS IF: the identity card is not the five statements of L40347-L40355,
  // or one of them is not on the alternating rhythm the chapter uses.
  // Planted: `onTheCard` set true on Preconditions. Went red at 6 against 5.
  it('is five statements at L40347, L40349, L40351, L40353 and L40355', () => {
    expect(A2_IDENTITY_CARD).toHaveLength(5)
    expect(A2_IDENTITY_CARD.flatMap((s) => locatorsOf(s.sourceRef))).toEqual([
      40347, 40349, 40351, 40353, 40355,
    ])
    for (const n of [40348, 40350, 40352, 40354]) {
      expect(srcLine(n).trim(), `L${n} is the blank line between two card statements`).toBe('')
    }
    expect(srcLine(40347)).toContain('`MOD-FL-A2`')
    expect(srcLine(40355)).toContain('Worker only')
  })

  // FAILS IF: a classification marker is invented for a field the source
  // leaves unmarked, or a real one is dropped. Planted: the User benefit
  // field given `sourceClass: 'SoW Fact'`, which its line does not carry.
  it('records a classification only where the field’s own line carries one', () => {
    for (const s of A2_CARD) {
      const [n] = locatorsOf(s.sourceRef)
      const line = srcLine(n as number)
      const hasMarker = /\[(SoW Fact|Derived Clarification)/.test(line)
      expect(s.sourceClass !== null, `${s.field} marker at L${n}`).toBe(hasMarker)
      if (s.sourceClass !== null) {
        expect(line, `${s.field} carries ${s.sourceClass}`).toContain(`[${s.sourceClass}`)
      }
    }
    // Seven fields carry none, and that is a counted absence rather than an
    // oversight. The first version of this module's comment said five, which
    // is the miscount this gate exists to catch: the markers are counted off
    // the lines above and this number is held against that count.
    expect(A2_CARD.filter((s) => s.sourceClass === null)).toHaveLength(7)
    expect(A2_CARD.filter((s) => s.sourceClass !== null).length).toBe(A2_CARD.length - 7)
  })
})

describe('the six per-Run states', () => {
  // FAILS IF: a state is dropped, added, or renamed. The prose at L40379 is
  // one transcription and the diagram is another; this holds them equal.
  // Planted: STATE-A2-PARKED removed. Went red at 5 against 6 and again on
  // the diagram walk.
  it('are six in the prose and six in the diagram, and they are the same six', () => {
    expect(A2_RUN_STATES).toHaveLength(6)
    const prose = srcLine(40379)
    for (const s of A2_RUN_STATES) {
      expect(prose, `${s.id} is named at L40379`).toContain(`\`${s.id}\``)
      expect(norm(prose).includes(norm(s.gloss)), `${s.id} gloss at L40379`).toBe(true)
    }
    // The diagram's own node and edge lines, read where each state says.
    for (const s of A2_RUN_STATES) {
      const n = locatorsOf(s.sourceRef).at(-1) as number
      expect(norm(srcLine(n)).includes(norm(s.diagramNode)), `${s.id} diagram at L${n}`).toBe(true)
    }
    // The diagram block itself holds exactly six distinct state names.
    const diagram = LINES.slice(40451, 40467).join('\n')
    for (const name of ['NotReady', 'Ready', 'InProgress', 'Parked', 'WorkerFinished', 'CompleteAndSynced']) {
      expect(diagram, `${name} is drawn`).toContain(name)
    }
  })

  // FAILS IF: a state other than READY becomes enterable, or READY stops
  // being. Rows 4 and 5 are the only two rows that speak to entering, so
  // exactly one state can carry it. Planted: STATE-A2-INPROGRESS marked
  // enterable, which is the plausible-looking guess the source does not make.
  it('marks exactly one state enterable, and it is the one row 4 allows', () => {
    const enterable = A2_RUN_STATES.filter((s) => s.enterable).map((s) => s.id)
    expect(enterable).toEqual(['STATE-A2-READY'])
    expect(runIsEnterable('STATE-A2-READY')).toBe(true)
    expect(runIsEnterable('STATE-A2-NOTREADY')).toBe(false)
    expect(runIsEnterable('STATE-A2-INPROGRESS')).toBe(false)
    // and the two rows that speak to it say exactly that, at their own lines.
    expect(srcLine(40364)).toContain('Enter a ready Run')
    expect(srcLine(40365)).toContain('the package has not arrived, so nothing can be rendered')
  })
})

describe('the four words for the end of a Run', () => {
  // FAILS IF: a completion word is attached to the wrong line, or this
  // screen starts claiming a Run is complete. Planted: `complete` marked
  // `rendersOnMyRuns: true`. Went red at 2 against 1.
  it('finds each word at its own line, and renders only worker-finished here', () => {
    expect(RUN_COMPLETION_WORDS).toHaveLength(4)
    for (const w of RUN_COMPLETION_WORDS) {
      const [n] = locatorsOf(w.sourceRef)
      expect(srcLine(n as number).toLowerCase(), `${w.word} at L${n}`).toContain(w.word)
    }
    expect(RUN_COMPLETION_WORDS.filter((w) => w.rendersOnMyRuns).map((w) => w.word)).toEqual([
      'worker-finished',
    ])
    // The two the platform lifecycle owns really are different steps of it.
    expect(srcLine(40559)).toContain('submitted')
    expect(srcLine(40560)).toContain('`complete`')
    expect(srcLine(39047)).toContain('finishes the record automatically')
  })

  // FAILS IF: the claim this module refuses to make stops being refused, or
  // the two states stop being distinct. AC-A2-6 (L40486) is the criterion.
  // Planted: COMPLETION_CLAIM_NEVER_MADE.instead rewritten to say the Run
  // "is complete once the worker declares finished". Went red.
  it('never collapses worker-finished into complete', () => {
    expect(srcLine(40486)).toContain('Worker-finished and complete-and-synced render as distinct')
    expect(COMPLETION_CLAIM_NEVER_MADE.instead).toContain('worker-finished')
    expect(COMPLETION_CLAIM_NEVER_MADE.instead).toContain('complete-and-synced')
    expect(COMPLETION_CLAIM_NEVER_MADE.instead).toMatch(
      /received and acknowledged by the server/i,
    )
    // The happy path's own step 6 says the same and is the line the screen
    // is built from.
    expect(norm(srcLine(40388))).toContain('worker-finished and, once the server acknowledges')
  })
})

/* ==================================================================== *
 * THE ELEVEN FUNCTIONALITIES AND `AC-FL-011-1`.
 * ==================================================================== */

describe('the eleven functionalities', () => {
  // FAILS IF: a functionality is dropped, or its statement or Fallback
  // clause is not the source's. Planted: FUNC-A2-04-1-1's fallback clause
  // shortened to 'Fallback: FB-FL-CORE-01.', which would have closed one of
  // the three AC-FL-011-1 gaps against an invented fact. Went red.
  it('finds every statement and every Fallback clause at its own line', () => {
    expect(A2_FUNCTIONALITIES).toHaveLength(11)
    for (const f of A2_FUNCTIONALITIES) {
      const [n] = locatorsOf(f.sourceRef)
      const line = norm(srcLine(n as number))
      expect(line, `${f.id} is at L${n}`).toContain(norm(f.id))
      expect(line.includes(norm(f.statement)), `${f.id} statement at L${n}`).toBe(true)
      expect(line.includes(norm(f.fallbackClause)), `${f.id} fallback clause at L${n}`).toBe(true)
      // and the patterns are the ones the clause itself names, not a set
      // chosen beside it.
      const named = [...f.fallbackClause.matchAll(/FB-FL-[A-Z0-9]+-\d+/g)].map((m) => m[0])
      expect([...f.patterns], `${f.id} patterns`).toEqual(named)
    }
    // The eleven really are the only FUNC-A2-* identifiers in the chapter.
    const inSource = LINES.flatMap((l) => [...l.matchAll(/`(FUNC-A2-[\d-]+)`/g)].map((m) => m[1]))
    expect([...new Set(inSource)].sort()).toEqual(A2_FUNCTIONALITIES.map((f) => f.id).sort())
  })

  // FAILS IF: a gap is closed by assigning a plausible pattern, or a real
  // pattern goes missing. Wave 0's `functionalitiesNamingNoPattern` is the
  // one place the rule lives. Planted: FUNC-A2-01-1-2 given
  // `patterns: ['FB-FL-CORE-01']`, which is the exact defect the common
  // brief names — an assigned pattern is indistinguishable from a real one
  // forever afterwards. Went red at 2 against 3.
  it('reports three functionalities naming no FB-FL pattern, and fills none', () => {
    expect([...A2_FUNCTIONALITIES_NAMING_NO_PATTERN]).toEqual([
      'FUNC-A2-01-1-2',
      'FUNC-A2-04-1-1',
      'FUNC-A2-04-1-2',
    ])
    expect([...functionalitiesNamingNoPattern(A2_FUNCTIONALITIES)]).toEqual([
      ...A2_FUNCTIONALITIES_NAMING_NO_PATTERN,
    ])
    // Each states its own ground, in the source's own words.
    expect(srcLine(40428)).toContain('an absent capability has no failure mode')
    expect(srcLine(40443)).toContain('the indicator is the honest rendering of failure')
    expect(srcLine(40444)).toContain('Not applicable — same reason')
    // AC-FL-011-1 is really at L40151 and really asks for one.
    expect(srcLine(40151)).toContain('AC-FL-011-1')
    expect(srcLine(40151)).toContain('names at least one')
  })

  // FAILS IF: the three readings of this module's fallback set are
  // reconciled into one, or one of them is mis-transcribed. Planted: the
  // card reading trimmed to the map's two, which is the reconciliation the
  // common brief forbids. Went red.
  it('carries three different fallback sets and reconciles none', () => {
    expect([...A2_PATTERN_DIVERGENCE.fromTheModuleMap]).toEqual(
      A2_PATTERNS_FROM_MAP.map((p) => p.id),
    )
    expect([...A2_PATTERNS_FROM_MAP.map((p) => p.id)]).toEqual(
      patternsForModule('MOD-FL-A2').map((p) => p.id),
    )
    expect([...A2_PATTERN_DIVERGENCE.fromTheFunctionalities].sort()).toEqual(
      [...A2_PATTERNS_FROM_FUNCTIONALITIES].sort(),
    )
    // Three sets, three sizes, and no two of them equal.
    const sets = [
      A2_PATTERN_DIVERGENCE.fromTheModuleMap,
      A2_PATTERN_DIVERGENCE.fromTheCardsFallbackLine,
      A2_PATTERN_DIVERGENCE.fromTheFunctionalities,
    ].map((s) => [...s].sort().join(','))
    expect(new Set(sets).size).toBe(3)
    expect(A2_PATTERN_DIVERGENCE.fromTheModuleMap).toHaveLength(2)
    expect(A2_PATTERN_DIVERGENCE.fromTheCardsFallbackLine).toHaveLength(4)
    expect(A2_PATTERN_DIVERGENCE.fromTheFunctionalities).toHaveLength(3)
    // Every reading is read back off its own source line.
    for (const id of A2_PATTERN_DIVERGENCE.fromTheCardsFallbackLine) {
      expect(srcLine(40419), `${id} is on the card's Fallback identifier line`).toContain(id)
    }
    for (const id of A2_PATTERN_DIVERGENCE.fromTheModuleMap) {
      const row = LINES.slice(40129, 40143).find((l) => l.startsWith(`| \`${id}\``))
      expect(row, `${id} has a map row`).toBeDefined()
      expect(row, `${id}'s map row lists MOD-FL-A2`).toContain('`MOD-FL-A2`')
    }
    // and the map does NOT list this module against the other two the card
    // and the functionalities reach.
    for (const id of ['FB-FL-CMD-01', 'FB-FL-GATE-01', 'FB-FL-UP-01']) {
      const row = LINES.slice(40129, 40143).find((l) => l.startsWith(`| \`${id}\``))
      expect(row, `${id} has a map row`).toBeDefined()
      expect(row, `${id}'s map row omits MOD-FL-A2`).not.toContain('`MOD-FL-A2`')
    }
  })
})

/* ==================================================================== *
 * THE SEVEN ACCEPTANCE CRITERIA.
 * ==================================================================== */

describe('the seven acceptance criteria', () => {
  // FAILS IF: a criterion is paraphrased or cites the wrong line, or the
  // anchor is not really there. Planted: AC-A2-5 given L40484.
  it('finds every criterion, and its identifier, at the line it cites', () => {
    expect(A2_ACCEPTANCE_CRITERIA).toHaveLength(7)
    for (const ac of A2_ACCEPTANCE_CRITERIA) {
      const [n] = locatorsOf(ac.sourceRef)
      const line = srcLine(n as number)
      expect(anchorOf(ac.sourceRef), `${ac.id} anchors on itself`).toBe(ac.id)
      expect(line, `${ac.id} is at L${n}`).toContain(`\`${ac.id}\``)
      expect(norm(line).includes(norm(ac.text)), `${ac.id} text at L${n}`).toBe(true)
    }
    // The seven are the only AC-A2-* identifiers in the chapter.
    const inSource = LINES.flatMap((l) => [...l.matchAll(/`(AC-A2-\d+)`/g)].map((m) => m[1]))
    expect([...new Set(inSource)].sort()).toEqual(A2_ACCEPTANCE_CRITERIA.map((a) => a.id).sort())
  })
})

/* ==================================================================== *
 * THE LIST, THE SHEET, AND THE BANNER.
 * ==================================================================== */

describe('the work list', () => {
  // FAILS IF: the fixture stops being the storyboard's, or a Run is
  // invented. TEST-A2-1 (L40493) asks for two Jobs and three Runs and
  // SB-FL-011 (L40471) shows exactly that. Planted: a fourth Run added.
  it('is the storyboard’s own two Jobs and three Runs', () => {
    expect(A2_LIST).toHaveLength(2)
    expect(a2RunsInOrder()).toHaveLength(3)
    const sb = srcLine(40471)
    for (const job of A2_LIST) {
      expect(sb, `${job.name} is in SB-FL-011`).toContain(job.name)
      for (const run of job.runs) {
        expect(norm(sb).includes(norm(run.line)), `${run.id}'s line is in SB-FL-011`).toBe(true)
      }
    }
    expect(sb).toContain('Run 2026-08-14-A')
    expect(sb).toContain('Run 2026-08-14-B')
    // and the storyboard's own last sentence, which is the absence stated as
    // a storyboard fact, is transcribed whole.
    expect(norm(SB_FL_011.text)).toContain(
      'there is no search field, no "available work" tab, and no other worker\'s name anywhere on the screen',
    )
    expect(norm(sb).includes(norm(SB_FL_011.text))).toBe(true)
  })

  // FAILS IF: a `jobAlone` card grows a run identifier the source does not
  // give it, or a `jobWithRunsBeneath` card loses its own. FUNC-A2-01-1-1
  // (L40427) is the rule. Planted: the Frame Alignment Check row given the
  // id 'Run 2026-08-14-C', which is exactly the fabrication the shape exists
  // to prevent. Went red.
  it('names a jobAlone card’s single row after the Job, never after an invented Run', () => {
    for (const job of A2_LIST) {
      if (job.shape === 'jobAlone') {
        expect(job.runs, `${job.id} has one row`).toHaveLength(1)
        expect(job.runs[0]?.id, `${job.id}'s row carries the Job's name`).toBe(job.name)
      } else {
        expect(job.runs.length, `${job.id} has runs beneath it`).toBeGreaterThan(1)
        for (const run of job.runs) expect(run.id).not.toBe(job.name)
      }
    }
    expect(srcLine(40427)).toContain('as the job alone where the job is one continuous operation')
  })

  // FAILS IF: the parked reason names something for the worker to press, or
  // stops being the storyboard's own sentence. EXCL-FL-05 (L39488) makes a
  // worker-side gate override an Invariant exclusion and FB-FL-GATE-01
  // (L40112) says "There is no on-device worker override, ever." Planted:
  // "Ask your supervisor to clear it from here." appended to `why`. Went red
  // on the imperative sweep.
  it('states the parked reason without naming anything the worker could press', () => {
    expect(srcLine(40471)).toContain(PARKED_RUN_REASON.line)
    expect(srcLine(40112)).toContain('There is no on-device worker override, ever')
    expect(norm(PARKED_RUN_REASON.why)).toContain('there is no on-device worker override, ever')
    const text = `${PARKED_RUN_REASON.line} ${PARKED_RUN_REASON.why}`
    // NO IMPERATIVE ADDRESSED TO THE WORKER. The word "override" is in the
    // text and must be — it is inside the source's own denial of one — so
    // the gate looks for an INSTRUCTION rather than for the word, which is
    // the distinction that made the first version of it go red on a correct
    // sentence.
    expect(text).not.toMatch(/\b(tap|press|select|choose|click|retry|enter your)\b/i)
    const excl05 = srcLine(39488).split('|').map((c) => c.trim())
    expect(excl05[1]).toBe('`EXCL-FL-05`')
    expect(excl05[5]).toBe('Invariant')
  })
})

describe('the sync detail sheet', () => {
  // FAILS IF: a capture label is composed here rather than read from wave
  // 0's total record — which is the only thing standing between this screen
  // and a bare success. Planted: `syncSheetRows` changed to build
  // `${count} synced` for the `uploaded` state. Went red on identity with
  // `captureStateLine`.
  it('renders every row through wave 0’s capture ladder and nothing else', () => {
    const rows = syncSheetRows(A2_PENDING_FIXTURE)
    expect(rows.length).toBeGreaterThan(1)
    for (const r of rows) {
      expect(r.line, `${r.state} is wave 0's sentence`).toBe(captureStateLine(r.state))
      expect(CAPTURE_STATES, `${r.state} is a ladder member`).toContain(r.state)
    }
    // The breakdown and the headline cannot disagree: the total is derived.
    expect(pendingTotal(rows)).toBe(
      Object.values(A2_PENDING_FIXTURE).reduce((a, b) => a + (b ?? 0), 0),
    )
    // Fourteen, which is SB-FL-011's own figure.
    expect(pendingTotal(rows)).toBe(14)
    expect(srcLine(40471)).toContain('"14 pending"')
  })

  // FAILS IF: any label the sheet can print reads as a settled success.
  // L39622 says there is no single state called "synced" and
  // TEST-SCR-FL-003 (L48700) forbids a bare success. The record is total
  // over thirteen members, so this walks all thirteen rather than the four
  // the fixture happens to use. Planted: CAPTURE_STATE_LABEL is wave 0's and
  // was not edited; instead a fourteenth row was appended to the sheet with
  // the label 'Synced'. Went red.
  it('has no label anywhere on the ladder that reads as a bare success', () => {
    for (const state of CAPTURE_STATES) {
      const label = CAPTURE_STATE_LABEL[state]
      expect(label, `${state} has a label`).toBeTruthy()
      expect(label, `${state} is not a bare success`).not.toMatch(
        /\b(synced|success|done|complete|sent|ok)\b/i,
      )
    }
    for (const r of syncSheetRows(A2_PENDING_FIXTURE)) {
      expect(r.line).not.toMatch(/\bsynced\b/i)
    }
    expect(srcLine(39622)).toContain('there is no single state called "synced"')
  })

  // FAILS IF: the offline manual sync appears to succeed, or the control is
  // presented as something anything depends on. TEST-A2-7 (L40499) and
  // FUNC-A2-04-2-2 (L40447). Planted: the offline line changed to "Sync
  // started." Went red on both the success sweep and the reassurance clause.
  it('reports no connection rather than appearing to succeed', () => {
    const offline = manualSyncOutcome(false)
    expect(offline.line).toContain('There is no connection')
    // "nothing was sent" contains the word "sent" and is the opposite of a
    // success claim, so the gate looks for the CLAIM rather than the word.
    expect(offline.line).not.toMatch(/\b(synced|succeeded|success|up to date|caught up)\b/i)
    expect(offline.line).toMatch(/nothing was sent/i)
    expect(offline.line).toMatch(/nothing you are doing depends on this/i)
    const online = manualSyncOutcome(true)
    expect(online.line).not.toMatch(/\b(synced|complete|success)\b/i)
    expect(srcLine(40499)).toContain('reports no connection rather than appearing to succeed')
    expect(srcLine(40447)).toContain('a convenience only, never as a dependency')
  })
})

describe('the arriving-command banner', () => {
  // FAILS IF: a constraint is dropped or paraphrased, or the banner claims a
  // fleet state this device cannot see. Planted: the third constraint —
  // "It does not appear mid-capture" — deleted. Went red at 2 against 3 and
  // on the L39709 walk.
  it('is SB-FL-007’s own banner and its own three constraints, at L39709', () => {
    expect(ARRIVING_COMMAND_BANNER.id).toBe('SB-FL-007')
    expect(locatorsOf(ARRIVING_COMMAND_BANNER.sourceRef)).toEqual([39709])
    const line = srcLine(39709)
    expect(line).toContain('SB-FL-007')
    expect(line).toContain('a command arriving')
    expect(line).toContain(ARRIVING_COMMAND_BANNER.example)
    expect(ARRIVING_COMMAND_BANNER.constraints).toHaveLength(3)
    for (const c of ARRIVING_COMMAND_BANNER.constraints) {
      expect(norm(line).includes(norm(c.text)), `"${c.text.slice(0, 40)}" at L39709`).toBe(true)
    }
    // The banner is on My Runs, which is this destination.
    expect(line).toContain('at the top of My Runs')
  })
})

describe('the package readiness detail', () => {
  // FAILS IF: the SCR-FL-05 namespace ruling is re-opened here instead of
  // consumed. Wave 0's `FL_DESTINATIONS` is the one shape that cannot record
  // a single reading as the answer. Planted: `contested` replaced with a
  // hand-written object naming only §22.7's reading. Went red on identity
  // with wave 0's record.
  it('reads both readings of SCR-FL-05 from wave 0 rather than restating one', () => {
    const waveZero = flDestinationBySlug('training-library-viewer').contested
    expect(PACKAGE_READINESS_DETAIL.contested).toBe(waveZero)
    expect(waveZero.token).toBe('SCR-FL-05')
    expect(waveZero.agreement.agree).toBe(false)
    // §22.7's row really does place the package readiness detail on My Runs
    // against this module, and §25.5 really does give the same token to the
    // Training Library.
    const s227 = srcLine(39867).split('|').map((c) => c.trim())
    expect(s227[1]).toBe('`SCR-FL-05`')
    expect(s227[2]).toBe('Package readiness detail')
    expect(s227[3]).toBe('My Runs')
    expect(s227[4]).toBe('`MOD-FL-A2`')
    expect(srcLine(48533)).toContain('Training Library')
    expect(PACKAGE_READINESS_DETAIL.isAViewOf).toBe('my-runs')
  })
})

/* ==================================================================== *
 * THE OPEN DECISIONS, AND THE STAND-IN THAT EXPIRES.
 * ==================================================================== */

describe('the three decisions this module discloses', () => {
  // FAILS IF: a reading is attached to a line that does not carry its
  // decision identifier, or the reading's words are not there. Planted:
  // DEC-PARK-001's third candidate re-pointed at a blank line inside its own
  // section. Went red on the anchor. The line number is not spelled here:
  // `tests/coverage/locator-fidelity.test.ts` lexes any `L`-number in a
  // comment as a citation, and a plant that names a blank line files a
  // knowingly-false citation to describe a test.
  it('finds every reading, and its decision identifier, at the line it cites', () => {
    expect(A2_DISCLOSURES).toHaveLength(3)
    for (const d of A2_DISCLOSURES) {
      expect(d.readings.length, `${d.decisionRef} carries readings`).toBeGreaterThan(1)
      for (const r of d.readings) {
        for (const n of locatorsOf(r.locator)) {
          const line = srcLine(n)
          const anchor = anchorOf(r.locator)
          if (anchor !== null && anchor.startsWith('DEC-')) {
            expect(line, `${r.locator} carries ${anchor}`).toContain(anchor)
          }
        }
      }
      // The decision identifier really is the source's, and really is open.
      const anywhere = LINES.some((l) => l.includes(d.decisionRef))
      expect(anywhere, `${d.decisionRef} occurs in the frozen source`).toBe(true)
    }
    // The three candidate behaviours of DEC-PARK-001 are all at L41682, and
    // that line really does state the single-assigned-Run case.
    const park = srcLine(41682)
    expect(park).toContain(
      "what happens when the parked Run is the worker's only assigned Run",
    )
    expect(park).toContain('`[Client Decision Required — DEC-PARK-001]`')
    const parkReadings = A2_DISCLOSURES.find((d) => d.decisionRef === 'DEC-PARK-001')?.readings ?? []
    for (const r of parkReadings.filter((x) => x.locator.includes('L41682'))) {
      const words = r.text.replace(/^Candidate behaviour \w+: /, '').replace(/\.$/, '')
      expect(norm(park).includes(norm(words)), `"${words.slice(0, 48)}" at L41682`).toBe(true)
    }
    expect(parkReadings.filter((x) => x.locator.includes('L41682'))).toHaveLength(3)
  })

  // FAILS IF: a decision is filed under an identifier the canon already
  // holds, or the canon grows a record for one of these three and this
  // module keeps disclosing it locally — two spellings of one decision,
  // which is exactly what the shared canon exists to prevent. It reads the
  // union out of the canon file rather than trusting a comment about it.
  //
  // Planted: DEC-STORE-001 re-filed as 'DEC-CAP-001', which the canon does
  // hold. Went red. The canon file itself was NOT edited to plant this.
  it('discloses locally only because the shared canon has no record for these', () => {
    const canon = readFileSync(join(process.cwd(), 'src/disclosure/decisions.ts'), 'utf8')
    const block = canon.match(/export type DecisionId =([\s\S]*?)\n\n/)
    expect(block, 'the canon exports a DecisionId union').not.toBeNull()
    const members = [...(block?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1])
    // A POSITIVE CONTROL, NOT A COUNT. This asserted `members.length === 29`,
    // which is a stored copy of a derived answer in a suite whose only stake in
    // the canon is that these three identifiers are absent from it — and it
    // went stale the moment slice 10 registered fourteen more records. What the
    // count was buying is that a `not.toContain` over a failed parse cannot
    // pass vacuously, and an identifier the canon does hold buys that without
    // pinning a number.
    expect(members, 'the DecisionId union parsed').toContain('DEC-LIB-001')
    for (const d of A2_DISCLOSURES) {
      expect(members, `${d.decisionRef} is absent from the canon`).not.toContain(d.decisionRef)
      expect(d.canonNote).toContain('DecisionId')
    }
  })

  // FAILS IF: a disclosure answers its question. Every one of the three is
  // Client Decision Required in the source and none of them is this build's
  // to settle.
  //
  // THE FIRST VERSION OF THIS GATE COULD NOT FAIL, AND THE PLANT IS WHAT
  // SHOWED IT. It asked for ONE OF three phrases — "nothing is resolved",
  // "settles nothing", or "the decision owner is the client" — and
  // DEC-PARK-001's adopted text ends with the third. Replacing its opening
  // "Nothing is resolved." with a chosen candidate left the third phrase
  // standing and the gate passed the answer it was written to catch. An
  // alternation over three phrases is satisfied by whichever one a wrong
  // text happens to keep.
  //
  // So the non-settlement phrase is now REQUIRED on its own, and a second
  // check asks the harder question: no adopted text may contain a reading's
  // own clause, because restating one reading IS picking it. Planted again:
  // DEC-PARK-001's `adopted` rewritten to "The worker idles with an honest
  // explanation." Went red on both.
  //
  // ITS CEILING, STATED: an answer that PARAPHRASES a reading rather than
  // quoting it passes the containment half. The required phrase is what
  // stands behind that, and neither half is the whole gate.
  it('names the readings and settles none of them', () => {
    for (const d of A2_DISCLOSURES) {
      expect(d.adopted, `${d.decisionRef} says it settles nothing`).toMatch(
        /nothing is (resolved|adopted)|settles nothing/i,
      )
      const adopted = norm(d.adopted)
      for (const r of d.readings) {
        const clause = norm(r.text)
          .replace(/^candidate behaviour \w+: /, '')
          .replace(/\.$/, '')
        if (clause.length < 25) continue
        expect(
          adopted.includes(clause),
          `${d.decisionRef} adopts the reading "${clause.slice(0, 50)}"`,
        ).toBe(false)
      }
      // No reading carries a field that could mark it the answer: the canon's
      // own `DecisionReading` has exactly two.
      for (const r of d.readings) {
        expect(Object.keys(r).sort()).toEqual(['locator', 'text'])
      }
    }
  })
})

/* ==================================================================== *
 * THE CATEGORICAL ABSENCE, AND THE ONE QUOTED EXCEPTION.
 * ==================================================================== */

describe('no pace, no timer, no countdown, no ranking', () => {
  const HAZARD = /\b(pace|timers?|countdowns?|rankings?)\b/i

  // FAILS IF: any string this module can render carries one of the four
  // words without standing on a source line that carries the same word.
  // That is the whole rule: the module may QUOTE the source's own sentence
  // about pace and ranking, and may not compose one of its own.
  //
  // Planted: a string reading "3 runs completed today, ahead of the usual
  // pace." pushed into `a2RenderedStrings` with sourceRef ''. Went red
  // naming it. Planted a second time WITH sourceRef 'L40471', which does not
  // carry the word "pace" — went red again, which is the half that matters,
  // because a plausible-looking locator is how this gate would otherwise be
  // defeated.
  it('quotes the four words only where the cited source line carries them', () => {
    const offenders: string[] = []
    for (const s of a2RenderedStrings()) {
      const hit = s.text.match(HAZARD)
      if (hit === null) continue
      const word = hit[0].toLowerCase()
      const lines = locatorsOf(s.sourceRef)
      if (lines.length === 0) {
        offenders.push(`${s.where}: "${word}" with no locator at all`)
        continue
      }
      const proved = lines.some((n) => srcLine(n).toLowerCase().includes(word))
      if (!proved) {
        offenders.push(`${s.where}: "${word}" is at none of ${s.sourceRef}`)
      }
    }
    expect(offenders).toEqual([])
  })

  // FAILS IF: the module composes a hazard word anywhere outside the places
  // it has recorded. The gate above proves each occurrence is quoted; this
  // one proves the SET of places is the set the module declared, so a new
  // quotation cannot slip in unrecorded even if it happens to be genuine.
  // Planted: a fifth entry added to NO_PACE_NO_TIMER_NO_RANKING quoting
  // L39108. Went red at 6 against 5.
  it('carries the four words in exactly the places it has declared', () => {
    const places = a2RenderedStrings()
      .filter((s) => HAZARD.test(s.text))
      .map((s) => s.where)
      .sort()
    expect(places).toEqual([
      'DEC-PARK-001 reading',
      'absence',
      'absence',
      'absence',
      'absence',
      'card Artificial-intelligence behaviour',
    ])
  })

  // FAILS IF: the one composed-looking occurrence is not really the source's
  // sentence. DEC-PARK-001's third candidate contains the word "timers" and
  // describes a Supervisor-side notification path, not anything this screen
  // draws. Planted: the quotation altered to "the run no-show timers at plus
  // 10 and plus 20 minutes take over". Went red.
  it('proves the one quoted hazard word is the source’s own sentence', () => {
    expect(SOURCE_QUOTED_HAZARD_WORDS).toHaveLength(1)
    for (const q of SOURCE_QUOTED_HAZARD_WORDS) {
      const [n] = locatorsOf(q.sourceRef)
      expect(norm(srcLine(n as number)).includes(norm(q.quotation)), `${q.word} at L${n}`).toBe(true)
      const allReadings: readonly DecisionReading[] = A2_DISCLOSURES.flatMap(
        (d) => [...d.readings] as DecisionReading[],
      )
      const reading = allReadings.find((r) => norm(r.text).includes(norm(q.quotation)))
      expect(reading, `${q.word} is really a disclosed reading`).toBeDefined()
    }
    // The two Supervisor-side notifications that sentence names are the
    // recipients the source gives them, and neither reaches the worker.
    expect(srcLine(40412)).toContain('Run no-show at plus 15 minutes')
    expect(srcLine(40412).split('|').map((c) => c.trim())[2]).toBe('The Supervisor')
    expect(srcLine(40413)).toContain('Auto-cancel at plus 30 minutes')
    expect(srcLine(40413).split('|').map((c) => c.trim())[2]).toBe('The Supervisor')
  })

  // FAILS IF: an exclusion or criterion this module rests on is not at the
  // line it names. Planted: EXCL-FL-08 cited at L39492, which is
  // EXCL-FL-09 — the off-by-one this transcription actually made and this
  // gate actually caught.
  it('finds every categorical absence at the line it cites', () => {
    expect(NO_PACE_NO_TIMER_NO_RANKING).toHaveLength(4)
    for (const a of NO_PACE_NO_TIMER_NO_RANKING) {
      const [n] = locatorsOf(a.sourceRef)
      const line = srcLine(n as number)
      const anchor = anchorOf(a.sourceRef)
      if (anchor !== null) expect(line, `${a.sourceRef} anchor`).toContain(anchor)
      // A table cell lifted into prose gains a full stop the cell does not
      // carry, so the trailing one is dropped before comparison. Nothing
      // else is: the words themselves have to be the source's.
      for (const sentence of a.text.split(/(?<=\.)\s+/).filter((x) => x.trim().length >= 20)) {
        const words = norm(sentence).replace(/\.$/, '')
        expect(norm(line).includes(words), `${a.sourceRef}: "${words.slice(0, 60)}"`).toBe(true)
      }
    }
    // EXCL-FL-08's Class column reads Invariant, so a pace display here
    // would be a broken guarantee rather than a misplacement.
    expect(srcLine(39491).split('|').map((c) => c.trim()).at(-2)).toBe('Invariant')
    expect(srcLine(39108)).toContain('TEST-FL-000-3')
  })
})

/* ==================================================================== *
 * THE FINDINGS, AND THE ONE THE BRIEF GOT WRONG.
 * ==================================================================== */

describe('what this module found', () => {
  // FAILS IF: a finding stands on a line that does not exist or carries no
  // locator. Planted: the third finding's sourceRef emptied.
  it('gives every finding at least one real line', () => {
    expect(A2_SOURCE_FINDINGS.length).toBeGreaterThan(0)
    for (const f of A2_SOURCE_FINDINGS) {
      const lines = locatorsOf(f.sourceRef)
      expect(lines.length, `"${f.what.slice(0, 40)}" names a line`).toBeGreaterThan(0)
      // Every line is a line the frozen source has — `srcLine` throws where
      // it does not — and at least one of them carries text. A blank line is
      // a legitimate member of a range, so this asks for one real line
      // rather than for all of them.
      for (const n of lines) expect(typeof srcLine(n)).toBe('string')
      expect(lines.some((n) => srcLine(n).trim().length > 0), f.sourceRef).toBe(true)
    }
  })

  // FAILS IF: the module inventory's grade column is read as the brief read
  // it. The brief said the source's own grade column is "at L39848"; that
  // line is MOD-FL-A3's row, and this module's row is L39847. Both carry
  // Band `A`, and neither carries C1 or C2. Planted: nothing — this gate was
  // written after the transcription already disagreed with the brief, and it
  // was watched red by asserting L39848 held `MOD-FL-A2`, which it does not.
  it('reads the module inventory’s Band column at this module’s own row', () => {
    expect(srcLine(39844).split('|').map((c) => c.trim()).slice(1, 5)).toEqual([
      'Identifier',
      'Module',
      'Band',
      'One-line scope',
    ])
    const a2 = srcLine(39847).split('|').map((c) => c.trim())
    expect(a2[1]).toBe('`MOD-FL-A2`')
    expect(a2[2]).toBe('My Runs')
    expect(a2[3]).toBe('A')
    const a3 = srcLine(39848).split('|').map((c) => c.trim())
    expect(a3[1]).toBe('`MOD-FL-A3`')
    // C1 AND C2 REACH EXACTLY ONE PLACE: the finding that reports them as a
    // build-plan grade rather than a source value. Anywhere else would be
    // this build transcribing its own plan into the product.
    //
    // Planted: 'grade: C1' pushed onto the card walk. Went red with a second
    // entry.
    const withGrade = a2RenderedStrings().filter((s) => /\bC[12]\b/.test(s.text))
    expect(withGrade.map((s) => s.where)).toEqual(['finding what'])
    expect(withGrade[0]?.text).toContain('not a source value')
  })

  // FAILS IF: the in-progress case is answered in either direction. The
  // source describes entering a ready Run and refuses a not-yet-ready one
  // and says nothing about an in-progress one, so this module says nothing
  // either. Planted: STATE-A2-INPROGRESS marked enterable — the finding then
  // contradicted the data and this went red.
  it('leaves the in-progress case unrecorded rather than filling it', () => {
    const finding = A2_SOURCE_FINDINGS.find((f) => f.what.includes('in-progress'))
    expect(finding, 'the in-progress case is recorded as a finding').toBeDefined()
    expect(finding?.what).toContain('UNRECORDED')
    expect(runIsEnterable('STATE-A2-INPROGRESS')).toBe(false)
    // and no row of the matrix mentions an in-progress Run at all.
    for (const row of A2_MATRIX) {
      expect(row.control.toLowerCase(), row.id).not.toContain('in progress')
      expect(row.control.toLowerCase(), row.id).not.toContain('in-progress')
    }
  })
})

/* ==================================================================== *
 * ONE WALK OVER EVERY STRING THE MODULE CAN RENDER.
 * ==================================================================== */

describe('every string this module can render', () => {
  // FAILS IF: a rendered string is blank, or the walk stops reaching what
  // the module actually renders — which is how a sweeping gate passes the
  // defect it was written for. Planted: the `for (const row of A2_MATRIX)`
  // block removed from `a2RenderedStrings`. Went red on the count floor and
  // on the cell-note spot check.
  it('is non-empty, and reaches the card, the matrix, the list and the disclosures', () => {
    const all = a2RenderedStrings()
    expect(all.length).toBeGreaterThan(120)
    for (const s of all) {
      expect(s.text.trim().length, `${s.where} is not blank`).toBeGreaterThan(0)
    }
    const wheres = new Set(all.map((s) => s.where))
    expect(wheres.has('card Purpose')).toBe(true)
    expect(wheres.has('cancel-a-run.SUPERVISOR')).toBe(true)
    expect(wheres.has('run Run 2026-08-14-B')).toBe(true)
    expect(wheres.has('DEC-PARK-001 reading')).toBe(true)
    expect(wheres.has('FUNC-A2-04-2-2')).toBe(true)
    // Every one of the forty-five cell notes is in the walk.
    const cellNotes = all.filter((s) => /^[a-z-]+\.[A-Z_]+$/.test(s.where))
    expect(cellNotes).toHaveLength(45)
  })

  // FAILS IF: this module ever renders a capture as synced, or composes the
  // word without standing on a source line that carries it. The Run-level
  // state keeps the source's own name and the capture ladder has no member
  // of that name; this gate is what keeps the two apart.
  //
  // Planted: the sync sheet's heading string added to the walk reading
  // "All 14 items synced." with sourceRef 'L40446'. L40446 does carry the
  // word, so the gate PASSED — which is the ceiling, and it is why the gate
  // above asserts the sheet's rows are `captureStateLine`'s output by
  // identity rather than by inspection. Planted again with sourceRef '', it
  // went red.
  it('carries the word "synced" only where the cited source line carries it', () => {
    const offenders: string[] = []
    for (const s of a2RenderedStrings()) {
      if (!/\bsynced\b/i.test(s.text)) continue
      const lines = locatorsOf(s.sourceRef)
      const proved = lines.some((n) => /\bsynced\b/i.test(srcLine(n)))
      if (!proved) offenders.push(`${s.where}: "synced" is at none of "${s.sourceRef}"`)
    }
    expect(offenders).toEqual([])
  })
})

/* ==================================================================== *
 * A COLUMN OTHER THAN THE WORKER'S.
 * ==================================================================== */

describe('the four columns that are not the Worker’s', () => {
  // FAILS IF: a non-Worker column draws a control anywhere. AC-FL-009-2
  // (L39945) says no tenant role other than Worker holds an execution
  // session, and this matrix's only permissive non-Worker cells are row 9's
  // two, whose act is the Hub's. Planted: row 7's Supervisor cell set to
  // `allowed`. Went red.
  it('draws no control at all', () => {
    const others: readonly A2Column[] = A2_COLUMNS.filter((c) => c !== 'WORKER')
    for (const column of others) {
      for (const row of A2_MATRIX) {
        expect(frontlineAffordance(row, column).kind, `${row.id}.${column}`).not.toBe('control')
      }
    }
    expect(srcLine(39945)).toContain('No tenant role other than Worker holds an execution session')
  })

  // FAILS IF: `Not applicable` is rendered as a refusal without saying it is
  // not one. Eleven of this matrix's cells carry it and every one of them
  // states a reason; wave 0's fold returns them as `refusal` with the
  // outcome preserved, which is what lets the view say so. Planted: the
  // eleven retyped `explicitlyProhibited` — the tally gate went red first,
  // then this one on the outcome walk.
  it('keeps Not applicable distinguishable from a prohibition', () => {
    const na: string[] = []
    for (const row of A2_MATRIX) {
      for (const column of A2_COLUMNS) {
        if (row.cells[column].outcome !== 'notApplicable') continue
        na.push(`${row.id}.${column}`)
        const drawn = frontlineAffordance(row, column)
        expect(drawn.kind, `${row.id}.${column}`).toBe('refusal')
        expect(drawn.kind === 'refusal' ? drawn.outcome : null).toBe('notApplicable')
      }
    }
    expect(na).toHaveLength(11)
    // Nine of the eleven state a reason after the token; two are a bare
    // `Not applicable` and that asymmetry is the source's, at L40364,
    // L40366 and L40367.
    const withReason = na.filter((k) => {
      const [rowId, column] = k.split('.') as [string, A2Column]
      return A2_MATRIX.find((r) => r.id === rowId)?.cells[column].note.includes('—')
    })
    expect(withReason).toHaveLength(8)
  })
})
