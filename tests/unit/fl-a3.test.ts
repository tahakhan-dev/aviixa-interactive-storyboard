import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  FL_MATRIX_SHAPE,
  TENANT_ADMIN_OPEN_CELLS,
  controlsOnActsHeldElsewhere,
  frontlineAffordance,
} from '@/frontline/matrix'
import { FL_PLAYER_VIEWS } from '@/frontline/screens'
import { functionalitiesNamingNoPattern, patternsForModule } from '@/frontline/fallbacks'
import {
  A3_CARD,
  A3_CARD_STATEMENTS,
  A3_IDENTIFIER,
  A3_NAME,
  A3_PLAYER_STATES,
  RUN_COMPLETION_STATES,
  completionScreenLine,
  theStateThisScreenMayName,
  type RunCompletionState,
} from '@/frontline/modules/fl-a3/charter'
import {
  A3_COLUMNS,
  A3_COLUMN_HEADINGS,
  A3_MATRIX,
  A3_SHAPE,
  A3_TENANT_ADMIN_OPEN_DECISION,
  a3CellCount,
  a3Row,
  a3TokenTally,
  type A3MatrixRow,
} from '@/frontline/modules/fl-a3/matrix'
import {
  A3_ACCEPTANCE_CRITERIA,
  A3_CARD_PATTERNS,
  A3_FUNCTIONALITIES,
  A3_SEQUENCE,
  A3_STATE_INVENTORY_KEYED_ON,
  A3_STATE_INVENTORY_READINGS,
  A3_TERMINAL_SAFE_STATE,
  A3_TERMINAL_SAFE_STATE_PATTERN_WORDING,
  A3_VIEW_IDS,
  a3FallbackReadings,
  a3FunctionalityPatterns,
  a3MappedPatterns,
  a3PatternsAllThreeReadingsAgreeOn,
  a3RenderedViews,
  renderDifficultyLevel,
  stepsThisDevicePerforms,
} from '@/frontline/modules/fl-a3/service'

/* ==================================================================== *
 * `MOD-FL-A3` — THE RUN PLAYER, AGAINST THE FROZEN SOURCE.
 *
 * Every count below is taken from the blueprint at test time rather than
 * quoted from the brief that dispatched this module. The brief is a
 * hypothesis; the file is the evidence.
 *
 * WHAT "PLANTS ITS OWN DEFECT" MEANS HERE, AND WHY IT IS NOT A FILESYSTEM
 * PROBE. Four shipped tests in this build could not fail. A gate over DATA
 * proves it can fail by running against a deliberately corrupted COPY of that
 * data in the same test — the corruption is local, the original is untouched,
 * and the proof travels with the gate forever instead of living in a
 * transcript of one session. Where a gate reads the frozen source, the copy
 * corrupted is the transcription and the source stays read-only.
 * ==================================================================== */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')

/** One line of the frozen source, by the number this build cites it as. */
function line(n: number): string {
  const found = SOURCE_LINES[n - 1]
  if (found === undefined) throw new Error(`the frozen source has no line ${n}`)
  return found
}

/** `L40529` -> 40529. Every `sourceRef` in this module starts with one. */
function firstLineOf(sourceRef: string): number {
  const m = sourceRef.match(/L(\d+)/)
  if (m === null || m[1] === undefined) throw new Error(`no line number in "${sourceRef}"`)
  return Number(m[1])
}

/** A markdown table row, split into its cells and stripped of backticks. */
function tableCells(n: number): readonly string[] {
  return line(n)
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim().replace(/`/g, ''))
}

describe('the frozen source is the one this module was transcribed from', () => {
  // FAILS IF: the file moved, was truncated, or is not the hash-verified
  // blueprint. Everything below reads line numbers, and a line number is
  // meaningless against a different file.
  it('has 122,241 lines and holds section 22.12 at L40506', () => {
    // The file ends in a newline, so splitting yields one more element than it
    // has lines and the last is empty. Asserting the raw array length would
    // encode that off-by-one as the line count and make every citation in this
    // build one out; this states both facts instead.
    expect(SOURCE_LINES.at(-1)).toBe('')
    expect(SOURCE_LINES.length - 1).toBe(122241)
    expect(line(40506)).toBe('## 22.12 Module A3 — The Run Player')
  })
})

/* ==================================================================== *
 * THE MATRIX. TEN ROWS, FIVE COLUMNS, FIFTY CELLS.
 * ==================================================================== */

describe('the permission matrix, rebuilt from L40524-L40535', () => {
  // FAILS IF: this module's shape drifts from wave 0's count. The span is not
  // restated here either — it is read out of `FL_MATRIX_SHAPE`, and the
  // arithmetic that a span of n lines carries n rows is wave 0's own gate.
  it('takes its shape from wave 0 and not from a second transcription', () => {
    const waveZero = FL_MATRIX_SHAPE.find((m) => m.module === 'MOD-FL-A3')
    expect(waveZero).toBeDefined()
    expect(A3_SHAPE).toBe(waveZero)
    expect(A3_SHAPE.rows).toBe(10)
    expect(A3_SHAPE.columns).toBe(5)
    expect(A3_SHAPE.headerLine).toBe(40524)
    expect(A3_SHAPE.firstDataLine).toBe(40526)
    expect(A3_SHAPE.lastDataLine).toBe(40535)
    expect(A3_MATRIX).toHaveLength(A3_SHAPE.rows)
    expect(A3_COLUMNS).toHaveLength(A3_SHAPE.columns)
  })

  // FAILS IF: a column heading is misread. The header row is five personas
  // after the Action column, in the source's own order, and the order is what
  // makes cell 3 the Quality Manager's rather than the Tenant Admin's.
  it('reads the five persona columns off the header row in the header’s order', () => {
    const header = tableCells(A3_SHAPE.headerLine)
    expect(header).toEqual([
      'Action',
      'Worker',
      'Supervisor',
      'Quality Manager',
      'Tenant Admin',
      'Read-only Auditor',
    ])
    expect(A3_COLUMNS.map((c) => A3_COLUMN_HEADINGS[c])).toEqual(header.slice(1))
  })

  // THE TRANSCRIPTION GATE. Fifty cells and ten Action strings, rebuilt from
  // the source and compared one at a time.
  //
  // FAILS IF: any note drifted by a character, any row is out of order, or a
  // cell was filled from a neighbour. The definition of `note` is mechanical —
  // the whole cell with backticks removed — which is what makes rebuilding it
  // possible at all. A definition like "the words after the token" could not
  // be checked, because six of these cells have no words after the token.
  it('matches all fifty cells and all ten Action strings, cell by cell', () => {
    A3_MATRIX.forEach((row, i) => {
      const n = A3_SHAPE.firstDataLine + i
      const cells = tableCells(n)
      expect(firstLineOf(row.sourceRef), `${row.id} sourceRef`).toBe(n)
      expect(cells[0], `${row.id} Action column`).toBe(row.control)
      A3_COLUMNS.forEach((column, c) => {
        expect(cells[c + 1], `${row.id} / ${column} at L${n}`).toBe(row.cells[column].note)
      })
    })
  })

  // THE SAME GATE, WATCHED GOING RED. One note is corrupted on a COPY and the
  // comparison must reject it. Without this the test above is a test that has
  // only ever been seen passing.
  it('rejects a transcription that drifted by one word', () => {
    const corrupted: A3MatrixRow[] = A3_MATRIX.map((row) =>
      row.id !== 'terminally-complete-or-cancel'
        ? row
        : {
            ...row,
            cells: {
              ...row.cells,
              supervisor: { ...row.cells.supervisor, note: 'Allowed — in the Hub, not here' },
            },
          },
    )
    const mismatches = corrupted.filter((row, i) => {
      const cells = tableCells(A3_SHAPE.firstDataLine + i)
      return A3_COLUMNS.some((column, c) => cells[c + 1] !== row.cells[column].note)
    })
    expect(mismatches.map((m) => m.id)).toEqual(['terminally-complete-or-cancel'])
  })

  // FAILS IF: a cell is lost. Three readings: the row count times the column
  // count, the tally counted off the cells, and a count taken from the source
  // itself. A row that lost its last cell keeps its row count and moves the
  // other two.
  it('counts fifty cells three ways and gets fifty every time', () => {
    expect(a3CellCount()).toBe(50)
    expect(A3_MATRIX.length * A3_COLUMNS.length).toBe(50)

    const tally = a3TokenTally()
    expect(Object.values(tally).reduce((n, v) => n + v, 0)).toBe(50)

    let fromSource = 0
    for (let n = A3_SHAPE.firstDataLine; n <= A3_SHAPE.lastDataLine; n += 1) {
      fromSource += tableCells(n).length - 1
    }
    expect(fromSource).toBe(50)
  })

  // FAILS IF: the tally is balanced by hand. Each token's own count is
  // asserted, so a compensating pair of edits still fails even though the
  // total reaches fifty. Counted independently off the source below.
  it('gives each token its own count, and takes the same counts off the source', () => {
    expect(a3TokenTally()).toEqual({
      explicitlyProhibited: 24,
      notApplicable: 14,
      allowed: 8,
      allowedWithConditions: 1,
      readOnly: 1,
      clientDecisionRequired: 2,
    })

    // The TOKEN is the first backticked span of the cell, which is how the
    // source marks it. Splitting on the em dash instead reads
    // "Not applicable — no execution session" as a bare "Not applicable" and
    // silently merges two distinct cell texts into one count.
    const fromSource: Record<string, number> = {}
    for (let n = A3_SHAPE.firstDataLine; n <= A3_SHAPE.lastDataLine; n += 1) {
      const raw = line(n).split('|').slice(1, -1).map((c) => c.trim())
      for (const cell of raw.slice(1)) {
        const token = cell.match(/^`([^`]+)`/)?.[1]
        expect(token, `token at L${n} in "${cell}"`).toBeDefined()
        if (token === undefined) continue
        fromSource[token] = (fromSource[token] ?? 0) + 1
      }
    }
    expect(fromSource).toEqual({
      'Explicitly prohibited': 24,
      'Not applicable': 4,
      'Not applicable — no execution session': 10,
      Allowed: 8,
      'Allowed with conditions': 1,
      'Read-only': 1,
      'Client Decision Required': 2,
    })
    // The two `Not applicable` readings sum to this module's fourteen. The
    // source writes the reason inline for the Supervisor and the Quality
    // Manager on all five rows where neither holds an execution session (ten
    // cells), and bare for the Tenant Admin on four of those five — row 1's
    // Tenant Admin cell reads `Client Decision Required` instead. This split
    // is the reason the token is read as a backticked span rather than as
    // everything before an em dash: the first draft of this assertion said
    // eleven and three, and this gate is what found it.
    expect(10 + 4).toBe(14)
    expect(Object.values(fromSource).reduce((n, v) => n + v, 0)).toBe(50)
  })

  // FAILS IF: this module answers the Tenant Admin question that AC-FL-009-5
  // (L39948) forbids answering. Wave 0 lists exactly two open cells for
  // MOD-FL-A3 and both must be the ones this module carries.
  it('carries exactly wave 0’s two open Tenant Admin cells, and answers neither', () => {
    const waveZero = TENANT_ADMIN_OPEN_CELLS.filter((c) => c.module === 'MOD-FL-A3').map(
      (c) => c.sourceRef,
    )
    expect(waveZero).toEqual(['L40526', 'L40534'])

    const open = A3_MATRIX.filter((r) => r.cells.tenantAdmin.outcome === 'clientDecisionRequired')
    expect(open.map((r) => r.sourceRef)).toEqual(waveZero)
    for (const row of open) {
      expect(row.cells.tenantAdmin.openDecision).toBe(A3_TENANT_ADMIN_OPEN_DECISION)
      expect(row.cells.tenantAdmin.openDecision).toBe('AC-FL-009-5')
    }
    // Every OTHER cell records no open decision: an open question recorded
    // where the source states none is an invented one.
    const stray = A3_MATRIX.flatMap((r) =>
      A3_COLUMNS.filter(
        (c) => r.cells[c].openDecision !== null && r.cells[c].outcome !== 'clientDecisionRequired',
      ).map((c) => `${r.id}/${c}`),
    )
    expect(stray).toEqual([])
  })
})

/* ==================================================================== *
 * THE ORDER OF QUESTIONS. THE CLASSIFICATION DECIDES, NOT THE TOKEN.
 * ==================================================================== */

describe('what each cell draws', () => {
  // FAILS IF: row 10 draws a control anywhere. EXCL-FL-06 (L39489) is an
  // INVARIANT exclusion, so a control here is a broken guarantee. Both
  // permissive cells are asserted by name, because those are the two that
  // would follow honestly from a wrong classification.
  it('draws no control for terminal completion or cancellation, on any column', () => {
    expect(line(39489)).toContain('Worker-initiated Run cancellation or terminal completion')
    expect(line(39489)).toContain('Invariant')

    const row = a3Row('terminally-complete-or-cancel')
    expect(row.cells.supervisor.outcome).toBe('allowed')
    expect(row.cells.qualityManager.outcome).toBe('allowed')
    for (const column of A3_COLUMNS) {
      const drawn = frontlineAffordance(row, column)
      expect(drawn.kind, `${column} on row 10`).toBe('cross-surface')
    }
  })

  // FAILS IF: row 7 is classified by its majority token. Three of its five
  // cells read `Explicitly prohibited`, so a row read by token becomes four
  // refusals — telling a Supervisor they are forbidden from an act they
  // perform in the Delivery Operations Hub daily.
  it('sends the difficulty-level row to the surface its own cells name', () => {
    const row = a3Row('difficulty-level')
    expect(row.surface).toBe('another-surface')
    expect(row.metElsewhere?.where).toBe('another-surface')
    expect(line(40532)).toContain('the profile field is maintained in the Delivery Operations Hub')
    expect(line(40622)).toContain(
      'the Tenant Admin or Supervisor maintains the profile field in the Delivery Operations Hub',
    )
    for (const column of A3_COLUMNS) {
      expect(frontlineAffordance(row, column).kind, `${column} on row 7`).toBe('cross-surface')
    }
  })

  // THE INVERSE TRAP, AND IT IS THE ONE THAT DELETES A REAL CONTROL. L40534
  // reads `Allowed` for the Supervisor and the Quality Manager and is a
  // GENUINE on-device act: L40520 puts both roles on this screen at an
  // authored sign-off, through the step-up.
  it('keeps the one non-Worker control this module owns', () => {
    expect(line(40520)).toContain(
      'Supervisor and Quality Manager, momentarily, at an authored sign-off screen through the second-identity step-up',
    )
    const row = a3Row('authorise-sign-off')
    expect(row.surface).toBe('screen')
    for (const column of ['supervisor', 'qualityManager'] as const) {
      const drawn = frontlineAffordance(row, column)
      expect(drawn.kind, column).toBe('control')
    }
    expect(frontlineAffordance(row, 'worker').kind).toBe('refusal')
  })

  // FAILS IF: row 4 renders as a flat refusal for the Worker. It is the same
  // field as row 5 and the opposite act, and STATE-06 (L48666) states the
  // route out in the source's own words.
  it('routes the Worker from “alter in place” to the append-only correction', () => {
    expect(line(48666)).toContain('a correction is recorded as a new entry')
    const row = a3Row('alter-committed-value')
    const drawn = frontlineAffordance(row, 'worker')
    expect(drawn.kind).toBe('routed')
    if (drawn.kind === 'routed') expect(drawn.toRowId).toBe('append-correction')
    for (const column of ['supervisor', 'qualityManager', 'tenantAdmin', 'readonlyAuditor'] as const) {
      expect(frontlineAffordance(row, column).kind, column).toBe('refusal')
    }
    expect(frontlineAffordance(a3Row('append-correction'), 'worker').kind).toBe('control')
  })

  // FAILS IF: any row draws a control it should not. Wave 0's own check, run
  // over this module's rows.
  it('draws no control on an act the source holds elsewhere', () => {
    expect(controlsOnActsHeldElsewhere(A3_MATRIX, A3_COLUMNS)).toEqual([])
  })

  // THE SAME GATE, WATCHED GOING RED. Row 10 is reclassified `screen` on a
  // COPY — which is exactly what reading it by its token produces — and the
  // check must name it twice: once for the invariant act, once for each
  // control the wrong classification then draws.
  it('reports row 10 by name when it is classified as this screen’s', () => {
    const broken = A3_MATRIX.map((row) =>
      row.id === 'terminally-complete-or-cancel'
        ? ({ ...row, surface: 'screen', metElsewhere: null } as A3MatrixRow)
        : row,
    )
    const offenders = controlsOnActsHeldElsewhere(broken, A3_COLUMNS)
    expect(offenders.length).toBeGreaterThan(0)
    expect(offenders[0]).toContain('terminally-complete-or-cancel')
    expect(offenders[0]).toContain('EXCL-FL-06')
    // And the two permissive cells now draw controls, which is the defect as
    // it would actually ship.
    for (const column of ['supervisor', 'qualityManager'] as const) {
      const row = broken.find((r) => r.id === 'terminally-complete-or-cancel')
      expect(row).toBeDefined()
      if (row !== undefined) expect(frontlineAffordance(row, column).kind).toBe('control')
    }
  })

  // FAILS IF: a column that holds no execution session is given one. The
  // Read-only Auditor is prohibited on all ten rows and must draw nothing
  // anywhere.
  it('draws no control at all for the Read-only Auditor', () => {
    const drawn = A3_MATRIX.map((row) => frontlineAffordance(row, 'readonlyAuditor'))
    expect(drawn.filter((d) => d.kind === 'control')).toEqual([])
    expect(A3_MATRIX.every((r) => r.cells.readonlyAuditor.outcome === 'explicitlyProhibited')).toBe(
      true,
    )
  })
})

/* ==================================================================== *
 * FOUR STATES, NOT ONE.
 * ==================================================================== */

describe('worker-finished, submitted, complete and finished are four things', () => {
  // FAILS IF: the four collapse. The source separates them three times over
  // and each separation is asserted at its own line.
  it('finds all four separated in the source, at three independent places', () => {
    expect(line(40545)).toContain(
      'The platform states `submitted`, `complete`, and `finished` are run-record states, not player states',
    )
    expect(line(40559)).toContain('declares worker-finished, which stands the Run as `submitted`')
    expect(line(40560)).toContain('the Run moves to `complete`')
    expect(line(40561)).toContain('is a Delivery Operations Hub concern, not a device event')
    expect(line(39045)).toContain('worker-finished')
    expect(line(39047)).toContain('finishes the record automatically')
    expect(line(40679)).toContain('`finished` is never set by the device')
    expect(line(39066)).toContain('the completion screen, showing worker-finished')

    expect(RUN_COMPLETION_STATES.map((s) => s.name)).toEqual([
      'worker-finished',
      'submitted',
      'complete',
      'finished',
    ])
  })

  // FAILS IF: a completion screen could name a state the device does not hold.
  it('lets the completion screen name exactly one state, and it is the device’s', () => {
    expect(theStateThisScreenMayName().name).toBe('worker-finished')
    const held = RUN_COMPLETION_STATES.filter((s) => s.heldBy === 'device')
    expect(held).toHaveLength(1)

    const linePrinted = completionScreenLine()
    expect(linePrinted).toContain('worker-finished')
    expect(linePrinted).not.toContain('Run complete')
    for (const other of ['submitted', 'complete', 'finished']) {
      expect(linePrinted, other).toContain(other)
    }
  })

  // THE GATE, WATCHED GOING RED. A second device-held state is planted on a
  // COPY — the shape of the defect where `submitted` gets treated as something
  // the device holds — and the function must refuse rather than pick one.
  it('refuses to choose when a second device-held state is planted', () => {
    const planted: RunCompletionState[] = RUN_COMPLETION_STATES.map((s) =>
      s.name === 'submitted' ? { ...s, heldBy: 'device' } : s,
    )
    expect(() => theStateThisScreenMayName(planted)).toThrow(/exactly one device-held state/)
    expect(() => completionScreenLine(planted)).toThrow()
  })
})

/* ==================================================================== *
 * THE CARD, THE STATES, THE SEQUENCE.
 * ==================================================================== */

describe('the identity card is transcribed, not paraphrased', () => {
  // FAILS IF: any statement was reworded. Each is asserted as a substring of
  // the single line its `sourceRef` names.
  it('finds every transcribed card statement at the line it cites', () => {
    for (const s of A3_CARD_STATEMENTS) {
      if (s.text === null) continue
      expect(line(firstLineOf(s.sourceRef)), `${s.id} at ${s.sourceRef}`).toContain(s.text)
    }
    expect(line(40512)).toContain(`\`${A3_IDENTIFIER}\``)
    expect(line(40512)).toContain(`**Name.** ${A3_NAME}.`)
    expect(A3_CARD_STATEMENTS).toHaveLength(15)
  })

  // THE SAME GATE, WATCHED GOING RED. One statement is paraphrased on a COPY.
  it('rejects a card statement that was paraphrased', () => {
    const paraphrased = A3_CARD_STATEMENTS.map((s) =>
      s.id === 'purpose' ? { ...s, text: 'To be the main screen of the application.' } : s,
    )
    const bad = paraphrased.filter(
      (s) => s.text !== null && !line(firstLineOf(s.sourceRef)).includes(s.text),
    )
    expect(bad.map((s) => s.id)).toEqual(['purpose'])
  })

  // FAILS IF: a statement is dropped instead of being disclosed as
  // untranscribable. `text` and `whyNotTranscribed` are exclusive and one of
  // them is always present, so there is no row with nothing to render.
  it('always has exactly one of text and a stated reason, never both, never neither', () => {
    for (const s of A3_CARD_STATEMENTS) {
      expect((s.text === null) !== (s.whyNotTranscribed === null), s.id).toBe(true)
    }
    for (const f of A3_FUNCTIONALITIES) {
      expect((f.statement === null) !== (f.whyNotTranscribed === null), f.id).toBe(true)
    }
    for (const ac of A3_ACCEPTANCE_CRITERIA) {
      expect((ac.criterion === null) !== (ac.whyNotTranscribed === null), ac.id).toBe(true)
    }
  })

  // FAILS IF: the eight player states drift from L40545's own sentence.
  it('reads all eight player states off L40545', () => {
    expect(A3_PLAYER_STATES).toHaveLength(8)
    for (const s of A3_PLAYER_STATES) {
      expect(line(40545), s.id).toContain(`\`${s.id}\` ${s.gloss}`)
    }
  })

  // FAILS IF: the forward drive gains a step, loses one, or claims one the
  // device does not perform. Eleven of the thirteen are the device's; L40560
  // is the server's and L40561 is the Hub's, and the source says so.
  it('walks all thirteen happy-path steps and claims only the eleven that are the device’s', () => {
    expect(A3_SEQUENCE).toHaveLength(13)
    A3_SEQUENCE.forEach((s, i) => {
      expect(s.n).toBe(i + 1)
      expect(line(firstLineOf(s.sourceRef)), `step ${s.n}`).toContain(s.text)
    })
    expect(stepsThisDevicePerforms()).toHaveLength(11)
    expect(A3_SEQUENCE.filter((s) => s.actor !== 'device').map((s) => s.sourceRef)).toEqual([
      'L40560',
      'L40561',
    ])
  })
})

/* ==================================================================== *
 * THE FUNCTIONALITIES AND THE FALLBACK OBLIGATION.
 * ==================================================================== */

describe('the eighteen functionalities and AC-FL-011-1', () => {
  // FAILS IF: a functionality was invented, lost, or renumbered. The count and
  // the identifiers both come off the source's own lines.
  it('finds exactly eighteen FUNC-A3 identifiers in section 22.12', () => {
    const found: string[] = []
    for (let n = 40596; n <= 40635; n += 1) {
      const m = line(n).match(/`(FUNC-A3-[0-9-]+)`/)
      if (m !== null && m[1] !== undefined) found.push(m[1])
    }
    expect(found).toHaveLength(18)
    expect(A3_FUNCTIONALITIES.map((f) => f.id)).toEqual(found)
  })

  // THE PATTERN GATE, AND IT IS A COUNT RATHER THAN AN ASSERTION. Every
  // `FB-FL-*` identifier is re-extracted from each functionality's own line
  // and compared with what this module declared.
  it('re-extracts every FB-FL identifier from the source and matches all eighteen sets', () => {
    for (const f of A3_FUNCTIONALITIES) {
      const inSource = [...new Set(line(firstLineOf(f.sourceRef)).match(/FB-FL-[A-Z0-9]+-\d+/g) ?? [])]
      expect([...f.patterns], `${f.id} at ${f.sourceRef}`).toEqual(inSource)
      // Backticks stripped on both sides: the clause is transcribed the same
      // way the matrix notes are, so the comparison is against the same text
      // the source holds rather than against its markup.
      expect(
        line(firstLineOf(f.sourceRef)).replace(/`/g, ''),
        `${f.id} fallback clause`,
      ).toContain(f.fallbackClause)
    }
  })

  // THE FINDING, MEASURED. AC-FL-011-1 (L40151) asks every functionality to
  // name at least one pattern. Two of this module's eighteen name none, each
  // with a stated reason instead. That is reported, not resolved by assigning
  // them one.
  it('reports the two functionalities that name no pattern at all', () => {
    expect(line(40151)).toContain('Every functionality in this chapter names at least one')
    expect(functionalitiesNamingNoPattern(A3_FUNCTIONALITIES)).toEqual([
      'FUNC-A3-03-3-1',
      'FUNC-A3-06-1-1',
    ])
    // And the third "Not applicable" clause is NOT one of them: it names
    // FB-FL-CAP-01 inside its own sentence, so it satisfies the criterion.
    expect(line(40614)).toContain('which is FB-FL-CAP-01 territory')
  })

  // THE SAME GATE, WATCHED GOING RED. A pattern is stripped from a COPY of a
  // functionality that has one, and the reporter must find three rather than
  // two.
  it('finds a third when a functionality loses its only pattern', () => {
    const stripped = A3_FUNCTIONALITIES.map((f) =>
      f.id === 'FUNC-A3-05-2-1' ? { ...f, patterns: [] } : f,
    )
    expect(functionalitiesNamingNoPattern(stripped)).toEqual([
      'FUNC-A3-03-3-1',
      'FUNC-A3-05-2-1',
      'FUNC-A3-06-1-1',
    ])
  })

  // FAILS IF: the three readings are quietly reconciled. They are three
  // different statements in the source and none may be corrected into another.
  it('keeps all three readings of this module’s fallback patterns, all different', () => {
    const readings = a3FallbackReadings()
    expect(readings).toHaveLength(3)

    expect([...a3MappedPatterns().map((p) => p.id)].sort()).toEqual([
      'FB-FL-CORE-01',
      'FB-FL-PKG-01',
      'FB-FL-RENDER-01',
      'FB-FL-SCAN-01',
    ])
    expect(a3MappedPatterns()).toEqual(patternsForModule('MOD-FL-A3'))
    expect(A3_CARD_PATTERNS).toHaveLength(6)
    expect([...a3FunctionalityPatterns()].sort()).toEqual([
      'FB-FL-AI-01',
      'FB-FL-AUTH-01',
      'FB-FL-CAP-01',
      'FB-FL-PKG-01',
      'FB-FL-RENDER-01',
      'FB-FL-SCAN-01',
      'FB-FL-UP-01',
    ])

    // No two readings are the same set. If a later edit made them equal, the
    // divergence this module discloses would have stopped being true.
    const asKeys = readings.map((r) => [...r.patterns].sort().join('|'))
    expect(new Set(asKeys).size).toBe(3)

    expect([...a3PatternsAllThreeReadingsAgreeOn()].sort()).toEqual([
      'FB-FL-PKG-01',
      'FB-FL-RENDER-01',
      'FB-FL-SCAN-01',
    ])
  })

  // FAILS IF: the module card's six were misread. Each is asserted present in
  // L40592 itself.
  it('reads the card’s own six fallback identifiers off L40592', () => {
    for (const id of A3_CARD_PATTERNS) expect(line(40592), id).toContain(`\`${id}\``)
  })

  // FAILS IF: a terminal safe state is quoted from the line it was not read
  // from. The two statements differ by one connective and each is checked
  // against its own line.
  it('checks each of the two terminal-safe-state wordings against its own line', () => {
    expect(line(40667)).toContain(A3_TERMINAL_SAFE_STATE)
    expect(line(40122)).toContain(A3_TERMINAL_SAFE_STATE_PATTERN_WORDING)
    expect(A3_TERMINAL_SAFE_STATE).not.toBe(A3_TERMINAL_SAFE_STATE_PATTERN_WORDING)
    expect(line(40122)).not.toContain(A3_TERMINAL_SAFE_STATE)
    expect(line(40152)).toContain('bounded exit into a named terminal safe state')
  })
})

/* ==================================================================== *
 * THE ACCEPTANCE CRITERIA, AND THE TWO ROWS DELIBERATELY NOT TRANSCRIBED.
 * ==================================================================== */

describe('the nine acceptance criteria', () => {
  it('finds every transcribed criterion at the line it cites, all nine present', () => {
    expect(A3_ACCEPTANCE_CRITERIA).toHaveLength(9)
    A3_ACCEPTANCE_CRITERIA.forEach((ac, i) => {
      expect(firstLineOf(ac.sourceRef)).toBe(40673 + i)
      expect(line(firstLineOf(ac.sourceRef))).toContain(`\`${ac.id}\``)
      if (ac.criterion !== null) {
        expect(line(firstLineOf(ac.sourceRef)), ac.id).toContain(ac.criterion)
      }
    })
  })

  // THE OMISSION IS JUSTIFIED, NOT ASSERTED. The two rows this module declines
  // to transcribe are exactly the two whose own lines carry a categorically
  // excluded word, and this proves it by looking. If a later edit made either
  // line safe to quote, this goes red and the omission must be revisited
  // rather than left standing on a stale reason.
  it('declines to transcribe exactly the lines that carry an excluded word', () => {
    const EXCLUDED = /\b(pace|timer|countdown|ranking|productivity)\b/i

    const untranscribed = [
      ...A3_ACCEPTANCE_CRITERIA.filter((ac) => ac.criterion === null).map((ac) => ac.sourceRef),
      ...A3_FUNCTIONALITIES.filter((f) => f.statement === null).map((f) => f.sourceRef),
      // `A3_CARD` rather than the literal array: under the `as const` type
      // every statement's `text` is a string literal, so `text === null`
      // narrows the element to `never` and `.sourceRef` will not compile. The
      // widened view is the same fifteen records and keeps the null case
      // expressible, which is the whole reason charter.ts exports it.
      ...A3_CARD.filter((s) => s.text === null).map((s) => s.sourceRef),
    ]
    expect(untranscribed).toEqual(['L40680', 'L40633'])
    for (const ref of untranscribed) {
      expect(EXCLUDED.test(line(firstLineOf(ref))), `${ref} should carry an excluded word`).toBe(
        true,
      )
    }

    // And every line this module DOES transcribe from is clean, which is what
    // makes the two omissions a rule rather than a preference.
    const transcribedRefs = [
      ...A3_CARD_STATEMENTS.filter((s) => s.text !== null).map((s) => s.sourceRef),
      ...A3_FUNCTIONALITIES.filter((f) => f.statement !== null).map((f) => f.sourceRef),
      ...A3_ACCEPTANCE_CRITERIA.filter((ac) => ac.criterion !== null).map((ac) => ac.sourceRef),
      ...A3_SEQUENCE.map((s) => s.sourceRef),
    ]
    const dirty = transcribedRefs.filter((ref) => EXCLUDED.test(line(firstLineOf(ref))))
    expect(dirty).toEqual([])
  })

  // FAILS IF: an excluded word reaches a string this module renders. Every
  // rendered string is swept, not a sample of them.
  it('holds no excluded word in any string this module renders', () => {
    const EXCLUDED = /\b(pace|timer|countdown|ranking|productivity)\b/i
    const rendered: string[] = [
      ...A3_CARD_STATEMENTS.flatMap((s) => [s.text, s.whyNotTranscribed, s.heading]),
      ...A3_FUNCTIONALITIES.flatMap((f) => [f.statement, f.whyNotTranscribed, f.fallbackClause]),
      ...A3_ACCEPTANCE_CRITERIA.flatMap((ac) => [ac.criterion, ac.whyNotTranscribed]),
      ...A3_SEQUENCE.map((s) => s.text),
      ...A3_PLAYER_STATES.map((s) => s.gloss),
      ...RUN_COMPLETION_STATES.map((s) => s.what),
      ...A3_MATRIX.flatMap((r) => [r.control, ...A3_COLUMNS.map((c) => r.cells[c].note)]),
      completionScreenLine(),
    ].filter((s): s is string => s !== null)

    expect(rendered.filter((s) => EXCLUDED.test(s))).toEqual([])
    // The gate can fail: the excluded wording the source itself uses is
    // caught when it is put through the same sweep.
    expect(EXCLUDED.test(line(40680))).toBe(true)
  })
})

/* ==================================================================== *
 * DEC-WIDIFF-001 — THE SUBSTITUTION NOTICE.
 * ==================================================================== */

describe('the work-instruction difficulty level', () => {
  it('renders the worker’s own level with no notice when the package carries it', () => {
    expect(line(39889)).toContain('until it resolves, the package definition carries all levels')
    const r = renderDifficultyLevel('expanded', ['simple', 'standard', 'expanded'])
    expect(r.rendered).toBe('expanded')
    expect(r.substitutionNotice).toBeNull()
  })

  // FAILS IF: the downgrade goes silent. L40622 requires the substitution to
  // be RECORDED, and a caller cannot obtain the substituted level without also
  // obtaining the sentence that says it happened.
  it('never substitutes silently, and names both levels when it does', () => {
    expect(line(40622)).toContain(
      "where the package does not carry the worker's level, rendering falls back to the standard level and records the substitution",
    )
    const r = renderDifficultyLevel('expanded', ['standard'])
    expect(r.rendered).toBe('standard')
    expect(r.substitutionNotice).not.toBeNull()
    expect(r.substitutionNotice).toContain('expanded')
    expect(r.substitutionNotice).toContain('standard')
    expect(r.substitutionNotice).toContain('DEC-WIDIFF-001')

    // Every level that is not carried substitutes AND says so. Not one case.
    for (const level of ['simple', 'expanded'] as const) {
      expect(renderDifficultyLevel(level, ['standard']).substitutionNotice).not.toBeNull()
    }
  })
})

/* ==================================================================== *
 * THE TWO §25.5 STATE INVENTORIES, AND THE SIX §22.7 ROWS.
 * ==================================================================== */

describe('the two state inventories section 25.5 holds for this destination', () => {
  // FAILS IF: either count was quoted rather than counted. Both are taken off
  // the source here: the diagram's state declarations and the table's rows.
  it('counts fifteen execution states and thirteen screen conditions, from the source', () => {
    expect(line(48553)).toContain('the diagram below is the authoritative model')
    let diagramStates = 0
    for (let n = 48558; n <= 48572; n += 1) {
      if (/^\s{4}\w+ : /.test(line(n))) diagramStates += 1
    }
    expect(diagramStates).toBe(15)

    expect(line(48657)).toContain('every one of the thirteen states')
    let tableRows = 0
    for (let n = 48661; n <= 48673; n += 1) {
      if (/^\| `STATE-\d{2}`/.test(line(n))) tableRows += 1
    }
    expect(tableRows).toBe(13)

    expect(A3_STATE_INVENTORY_READINGS.map((r) => r.count)).toEqual([15, 13])
    expect(A3_STATE_INVENTORY_KEYED_ON).toBe('The execution stateDiagram')
    expect(A3_STATE_INVENTORY_READINGS[0]?.label).toBe(A3_STATE_INVENTORY_KEYED_ON)
  })
})

describe('the section 22.7 rows this panel is the state of', () => {
  // FAILS IF: this module claims a row that is not a state of this route, or
  // one another mounting module owns. The `run-player` predicate is the
  // route's own and is not re-derived — it is read off `FL_PLAYER_VIEWS`.
  // THE SOURCE'S OWN MODULE COLUMN IS THE CHECK, NOT THIS MODULE'S LIST.
  // `expect(views.map(v => v.id)).toEqual([...A3_VIEW_IDS])` is a tautology:
  // both sides are the same constant, so adding an id moves both. Watched
  // going red, that assertion stayed green while this module claimed
  // `SCR-FL-15`, which is `MOD-FL-B9`'s.
  //
  // §22.7 carries a MODULE column, so the claim is checkable rather than
  // arguable. The rows read out of it here are the rows whose Destination is
  // "Run Player" and whose Module column names `MOD-FL-A3`. That is what
  // caught this module claiming `SCR-FL-17`, whose Module column reads
  // `MOD-FL-B10`.
  it('claims exactly the Run Player rows section 22.7 gives MOD-FL-A3', () => {
    const fromSource: string[] = []
    for (let n = 39863; n <= 39885; n += 1) {
      const c = line(n)
        .split('|')
        .slice(1, -1)
        .map((s) => s.trim().replace(/`/g, ''))
      if (c[2] === 'Run Player' && (c[3] ?? '').split(', ').includes('MOD-FL-A3')) {
        const id = c[0]
        if (id !== undefined) fromSource.push(id)
      }
    }
    expect(fromSource).toEqual([
      'SCR-FL-07',
      'SCR-FL-08',
      'SCR-FL-09',
      'SCR-FL-10',
      'SCR-FL-16',
    ])
    expect([...A3_VIEW_IDS]).toEqual(fromSource)

    const views = a3RenderedViews()
    expect(views.map((v) => v.id)).toEqual(fromSource)
    for (const v of views) {
      expect(v.placement, v.id).toBe('run-player')
      expect(v.destinationColumn, v.id).toBe('Run Player')
      expect(line(firstLineOf(v.sourceRef)), v.id).toContain(v.name)
    }

    // And the eight left over, each named against the module the source gives
    // it, so a row moving in either direction fails here.
    const routeViews = FL_PLAYER_VIEWS.filter((v) => v.placement === 'run-player')
    expect(routeViews).toHaveLength(13)
    const claimed = new Set<string>(fromSource)
    expect(routeViews.filter((v) => !claimed.has(v.id)).map((v) => v.id)).toEqual([
      'SCR-FL-11',
      'SCR-FL-12',
      'SCR-FL-13',
      'SCR-FL-14',
      'SCR-FL-15',
      'SCR-FL-17',
      'SCR-FL-22',
      'SCR-FL-23',
    ])
    expect(line(40575)).toContain('`MOD-FL-B9` for gates and sign-off')
    // The correction this gate produced, held on the record: the no-re-basing
    // RULE is this module's and the version-change NOTICE is MOD-FL-B10's.
    expect(line(40681)).toContain('An in-flight Run is never re-based onto a new workflow version')
    expect(line(39879)).toContain('`MOD-FL-B10`')
    expect(line(39855)).toContain('two-tier work-instruction change notices')
  })

  // THE GATE, WATCHED GOING RED. A row that section 22.7 does not hold must
  // throw rather than be dropped from the list quietly.
  it('throws on a row section 22.7 does not hold', () => {
    expect(() => a3RenderedViews(FL_PLAYER_VIEWS.filter((v) => v.id !== 'SCR-FL-16'))).toThrow(
      /SCR-FL-16/,
    )
  })
})
