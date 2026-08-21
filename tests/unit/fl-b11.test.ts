import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  FL_MATRIX_SHAPE,
  INVARIANT_EXCLUDED_ACTS,
  TENANT_ADMIN_OPEN_CELLS,
  controlsOnActsHeldElsewhere,
  frontlineAffordance,
} from '@/frontline/matrix'
import { FL_PLAYER_VIEWS } from '@/frontline/screens'
import { FL_COMMAND_CLASSES, effectiveOnThisDevice } from '@/frontline/commands'
import { functionalitiesNamingNoPattern } from '@/frontline/fallbacks'
import {
  B11_CARD,
  B11_CLAIMS_NEVER_MADE,
  B11_FOUR_RUN_STATES,
  B11_STATES,
  B11_STATES_ONLY_STATED,
  B11_SUPERVISOR_VISIBILITY,
  SB_FL_020,
} from '@/frontline/modules/fl-b11/charter'
import {
  B11_BARE_TOKEN_CELLS,
  B11_ELLIPTICAL_CELLS,
  B11_ELSEWHERE_PERMISSIVE_CELLS,
  B11_INVARIANT_EXCLUDED_ROWS,
  B11_TOKEN_TALLY,
  FL_B11_COLUMNS,
  FL_B11_COLUMN_HEADINGS,
  FL_B11_MATRIX,
  FL_B11_SHAPE,
  b11Row,
  type FlB11Column,
} from '@/frontline/modules/fl-b11/matrix'
import {
  B11_ACCEPTANCE_CRITERIA,
  B11_DISCLOSURES,
  B11_FUNCTIONALITIES,
  B11_FUNCTIONALITIES_NAMING_NO_PATTERN,
  B11_HANDOVER_ELEMENTS,
  B11_MAPPED_PATTERNS,
  B11_PATTERNS_NAMED_BY_FUNCTIONALITIES,
  B11_PATTERN_DIVERGENCE,
  B11_PAUSE_CAUSES,
  B11_SOURCE_FINDINGS,
  B11_SUBSTITUTE_NEVER_RECEIVES,
  B11_SUBSTITUTION_COMMAND,
  B11_VIEW_IDS,
  B11_VIEW_NAMES,
  applySubstitution,
  atStepExpiry,
  departureFlag,
  pause,
} from '@/frontline/modules/fl-b11/service'

/**
 * `MOD-FL-B11` — Worker Lifecycle on Device, checked against the FROZEN SOURCE
 * rather than against a brief.
 *
 * WHY EVERY CLAIM HERE OPENS THE FILE. The brief this module was built from is
 * a hypothesis, and this build has recorded ten brief-supplied assertions that
 * could not fail and eleven wrong citations. So a transcription is checked by
 * reading the line it cites and looking for the words, and a locator is
 * checked by asking whether the identifier really occurs there. Nothing below
 * asserts a string against another string this task also wrote.
 *
 * EVERY GATE IN THIS FILE WAS PLANTED AND WATCHED GO RED before it was left
 * green — one defect per gate, in the thing the gate claims to protect, then
 * restored. The `FAILS IF` note names the defect that was actually planted,
 * not one that would have been convenient.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')

function srcLine(n: number): string {
  const l = LINES[n - 1]
  if (l === undefined) throw new Error(`the frozen source has no line ${n}`)
  return l
}

/** Both sides folded identically before comparison. */
function norm(s: string): string {
  return s
    .replace(/[`*_]/g, '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/** Every `L<number>` in a `sourceRef`, in order. */
function locatorsOf(sourceRef: string): readonly number[] {
  return [...sourceRef.matchAll(/L(\d{3,6})/g)].map((m) => Number(m[1]))
}

/**
 * The identifier a `sourceRef` anchors on, where it has one.
 *
 * THE `L`-NUMBER GUARD IS NOT COSMETIC, and `fl-b9` recorded why: a locator
 * written `L39840 · Client Decision Required — DEC-PLUS-001` matches the
 * identifier shape exactly, so without the guard the anchor check asks whether
 * line 39840 contains the string "L39840" — false for every line in the file.
 * The gate would then fire on correct citations and be "fixed" by deleting it.
 */
function anchorOf(sourceRef: string): string | null {
  const m = sourceRef.match(/^([A-Z][A-Z0-9-]{3,})\s+·/)
  const token = m?.[1] ?? null
  return token === null || /^L\d+$/.test(token) ? null : token
}

/** The cells of a source table row, by pipe, trimmed. */
function tableCells(n: number): readonly string[] {
  return srcLine(n)
    .split('|')
    .map((c) => c.trim())
}

/**
 * The seven status tokens, LONGEST FIRST. THE ORDER IS LOAD-BEARING and it is
 * not tidiness: `Allowed` is a prefix of `Allowed with conditions`, so a
 * shortest-match or first-match rule passes an `allowedWithConditions` cell
 * retyped `allowed`. This matrix has four such cells and eight `Allowed` ones,
 * so the defect is live here rather than theoretical.
 */
const TOKENS = [
  'Client Decision Required',
  'Allowed with conditions',
  'Explicitly prohibited',
  'Not applicable',
  'Unavailable',
  'Read-only',
  'Allowed',
] as const

const OUTCOME_TOKEN: Readonly<Record<string, string>> = {
  allowed: 'Allowed',
  allowedWithConditions: 'Allowed with conditions',
  readOnly: 'Read-only',
  unavailable: 'Unavailable',
  explicitlyProhibited: 'Explicitly prohibited',
  clientDecisionRequired: 'Client Decision Required',
  notApplicable: 'Not applicable',
}

function leadingToken(note: string): string | null {
  const n = norm(note)
  const hits = TOKENS.filter((t) => n.startsWith(norm(t)))
  return [...hits].sort((a, b) => b.length - a.length)[0] ?? null
}

/**
 * EVERY STRING THIS MODULE CAN PUT ON A SCREEN, in one place, because three
 * gates below walk it and a gate that walks a narrower list than the module
 * renders is a gate that passes the defect it was written for. Wave 1 recorded
 * exactly that: a sweep that read one field of a two-field return value.
 */
function renderedStrings(): readonly { where: string; text: string }[] {
  const out: { where: string; text: string }[] = []
  const push = (where: string, text: string) => out.push({ where, text })
  for (const s of B11_CARD) push(`card ${s.field}`, s.text)
  for (const s of B11_STATES) push(s.id, s.gloss ?? '')
  for (const s of B11_FOUR_RUN_STATES) push(`run state ${s.state}`, `${s.what} ${s.reachedBy}`)
  for (const c of B11_CLAIMS_NEVER_MADE) push('never-claimed', `${c.claim} ${c.instead}`)
  push(
    'supervisor visibility',
    `${B11_SUPERVISOR_VISIBILITY.what} ${B11_SUPERVISOR_VISIBILITY.why} ${B11_SUPERVISOR_VISIBILITY.mitigation}`,
  )
  push(
    'storyboard',
    `${SB_FL_020.heading} ${SB_FL_020.frame1} ${SB_FL_020.frame2} ${SB_FL_020.frame3} ${SB_FL_020.frame4}`,
  )
  for (const row of FL_B11_MATRIX) {
    push(`row ${row.id}`, `${row.control} ${row.why}`)
    for (const column of FL_B11_COLUMNS) push(`${row.id}.${column}`, row.cells[column].note)
    const met = row.metElsewhere
    if (met !== null) push(`${row.id} met elsewhere`, met.note)
    for (const column of FL_B11_COLUMNS) {
      const drawn = frontlineAffordance(row, column)
      push(`${row.id}.${column} drawn`, drawn.kind === 'stated-line' ? drawn.line : drawn.note)
    }
  }
  for (const f of B11_FUNCTIONALITIES) {
    push(
      f.id,
      `${f.statement} ${f.rolesAllowed} ${f.rolesProhibited ?? ''} ${f.connectivity} ${f.fallbackClause}`,
    )
  }
  push('pattern divergence', B11_PATTERN_DIVERGENCE.note)
  for (const ac of B11_ACCEPTANCE_CRITERIA) push(ac.id, ac.text)
  for (const f of B11_SOURCE_FINDINGS) {
    push('finding', `${f.what} ${f.evidence} ${f.notClosedBecause}`)
  }
  for (const d of B11_DISCLOSURES) {
    push(d.decisionRef, `${d.question} ${d.adopted} ${d.whyHere} ${d.canonNote}`)
    for (const r of d.readings) push(`${d.decisionRef} reading ${r.locator}`, r.text)
  }
  for (const c of B11_PAUSE_CAUSES) push(`pause ${c}`, `${pause(c).line} ${pause(c).resumeBy}`)
  for (const kind of ['step-away', 'hand-back'] as const) {
    for (const online of [true, false]) {
      const f = departureFlag(kind, online)
      push(`flag ${kind} ${String(online)}`, `${f.line} ${f.notThis} ${f.difference}`)
    }
  }
  for (const expired of [true, false]) {
    for (const gated of [true, false]) {
      push(
        `expiry ${String(expired)} ${String(gated)}`,
        atStepExpiry({ certificationExpired: expired, atAGatedStep: gated }).line,
      )
    }
  }
  for (const held of [true, false]) {
    for (const state of ['applied', 'delivered'] as const) {
      const o = applySubstitution({
        commandClass: 'CMD-FL-REASSIGN',
        commandState: state,
        deviceHoldsTheRun: held,
        previousWorker: 'Maya',
      })
      push(
        `substitution ${String(held)} ${state}`,
        o.applied ? `${o.heading} ${o.attribution} ${o.forwardControl}` : o.reason,
      )
    }
  }
  push('substitute never', B11_SUBSTITUTE_NEVER_RECEIVES)
  return out
}

/* ==================================================================== *
 * THE SHAPE, AND THE ARITHMETIC THAT CHECKS IT.
 * ==================================================================== */

describe('the shape of MOD-FL-B11’s permission matrix', () => {
  // FAILS IF: a row is dropped or added. Planted: the tenth row, "Extend a run
  // end time", deleted. Rows went to 9 and cells to 45 while the data span
  // stayed ten lines long, which is the point of holding the span apart from
  // the count.
  it('is ten rows over ten data lines, five columns, fifty cells', () => {
    expect(FL_B11_SHAPE.rows).toBe(10)
    expect(FL_B11_SHAPE.columns).toBe(5)
    expect(FL_B11_SHAPE.cells).toBe(50)
    expect(FL_B11_SHAPE.rows * FL_B11_SHAPE.columns).toBe(FL_B11_SHAPE.cells)
    expect(FL_B11_SHAPE.lastDataLine - FL_B11_SHAPE.firstDataLine + 1).toBe(FL_B11_SHAPE.rows)
    expect(FL_B11_SHAPE.separatorLine).toBe(FL_B11_SHAPE.headerLine + 1)
    expect(FL_B11_SHAPE.firstDataLine).toBe(FL_B11_SHAPE.separatorLine + 1)
  })

  // FAILS IF: this module's reading of its own span disagrees with wave 0's
  // reading of all twelve. Two independent transcriptions of one table.
  // Planted: headerLine moved to 41946. Went red on three fields.
  it('agrees with wave 0’s independent reading of the same table', () => {
    const waveZero = FL_MATRIX_SHAPE.find((m) => m.module === 'MOD-FL-B11')
    expect(waveZero).toBeDefined()
    expect(waveZero?.rows).toBe(FL_B11_SHAPE.rows)
    expect(waveZero?.columns).toBe(FL_B11_SHAPE.columns)
    expect(waveZero?.headerLine).toBe(FL_B11_SHAPE.headerLine)
    expect(waveZero?.separatorLine).toBe(FL_B11_SHAPE.separatorLine)
    expect(waveZero?.firstDataLine).toBe(FL_B11_SHAPE.firstDataLine)
    expect(waveZero?.lastDataLine).toBe(FL_B11_SHAPE.lastDataLine)
  })

  // FAILS IF: the header row is not where the shape says, or a column heading
  // is re-worded. Planted: 'Read-only Auditor' changed to 'Auditor'.
  it('reads its five column headings off the header line itself', () => {
    const header = tableCells(FL_B11_SHAPE.headerLine).filter((c) => c.length > 0)
    expect(header[0]).toBe('Action')
    expect(header.slice(1)).toEqual(FL_B11_COLUMNS.map((c) => FL_B11_COLUMN_HEADINGS[c]))
  })

  // FAILS IF: the separator line is not a separator, which is what an
  // off-by-one span looks like. Planted: separatorLine 41949, which is a real
  // data row.
  it('cites a real separator line and ten real data lines', () => {
    expect(srcLine(FL_B11_SHAPE.separatorLine).replace(/\s/g, '')).toBe('|---|---|---|---|---|---|')
    for (let n = FL_B11_SHAPE.firstDataLine; n <= FL_B11_SHAPE.lastDataLine; n += 1) {
      expect(srcLine(n).startsWith('| '), `L${n} is a data row`).toBe(true)
    }
  })
})

/* ==================================================================== *
 * THE TRANSCRIPTION, CELL BY CELL, AGAINST THE LINE IT CITES.
 * ==================================================================== */

describe('every row and every cell against its own source line', () => {
  // FAILS IF: a row cites the wrong line, or its Action text was paraphrased.
  // Planted: row 8's control shortened to 'Receive the handover state'. Went
  // red naming the row.
  it('finds each row’s action text in the line the row cites', () => {
    expect(FL_B11_MATRIX).toHaveLength(10)
    const cited = FL_B11_MATRIX.map((r) => locatorsOf(r.sourceRef)[0])
    expect(cited).toEqual([
      41949, 41950, 41951, 41952, 41953, 41954, 41955, 41956, 41957, 41958,
    ])
    for (const row of FL_B11_MATRIX) {
      const [n] = locatorsOf(row.sourceRef)
      expect(norm(tableCells(n as number)[1] ?? ''), `${row.id} action`).toBe(norm(row.control))
    }
  })

  // FAILS IF: a cell's words are not the cell's words. This catches an
  // invented note and a note quietly trimmed to its token. Planted: row 2's
  // Supervisor cell flattened to the bare token, dropping "pausing or stopping
  // a run is deliberately impossible from the Client Command Center" — which
  // is one of the two reasons the row gives for one prohibition.
  it('finds every one of the fifty cells in its row’s source line', () => {
    let counted = 0
    for (const row of FL_B11_MATRIX) {
      const [n] = locatorsOf(row.sourceRef)
      const cells = tableCells(n as number)
      FL_B11_COLUMNS.forEach((column, i) => {
        const cell = row.cells[column]
        expect(cell, `${row.id}.${column} exists`).toBeDefined()
        expect(norm(cells[i + 2] ?? ''), `${row.id}.${column}`).toBe(norm(cell.note))
        counted += 1
      })
    }
    expect(counted).toBe(50)
  })

  // FAILS IF: an outcome is mapped to a token the cell does not carry. THE
  // PREFIX TRAP IS LIVE IN THIS MATRIX: `Allowed` is a prefix of `Allowed with
  // conditions` and this matrix has eight of the first and four of the second.
  // Planted: row 6's Supervisor outcome retyped `allowed` while its note kept
  // reading "Allowed with conditions — ...". Went red; a first-match rule
  // would have passed it.
  it('maps every outcome onto the token its own cell actually leads with', () => {
    for (const row of FL_B11_MATRIX) {
      for (const column of FL_B11_COLUMNS) {
        const cell = row.cells[column]
        expect(leadingToken(cell.note), `${row.id}.${column}`).toBe(OUTCOME_TOKEN[cell.outcome])
      }
    }
  })

  // FAILS IF: the token tally and the cell count disagree — the shape a
  // silently dropped row makes. Three independent readings of one table: the
  // row list, rows × columns, and the outcomes. Planted: row 9's five cells
  // retyped `notApplicable`; the tally moved and the sum still made fifty,
  // which is why the individual counts are asserted too.
  it('counts twenty-six, twelve, eight and four, summing to fifty', () => {
    expect(B11_TOKEN_TALLY).toEqual({
      explicitlyProhibited: 26,
      notApplicable: 12,
      allowed: 8,
      allowedWithConditions: 4,
    })
    const summed = Object.values(B11_TOKEN_TALLY).reduce((a, b) => a + b, 0)
    expect(summed).toBe(FL_B11_SHAPE.cells)
    expect(summed).toBe(FL_B11_MATRIX.length * FL_B11_COLUMNS.length)
    // and the four tokens this matrix does NOT use are absent, so a fifth
    // appearing cannot hide inside a correct sum.
    for (const absent of ['readOnly', 'unavailable', 'clientDecisionRequired']) {
      expect(B11_TOKEN_TALLY[absent]).toBeUndefined()
    }
  })

  // FAILS IF: an open decision is claimed for a cell that does not defer to
  // one. No cell of this matrix carries `Client Decision Required` and wave 0
  // enumerates all eleven that do; none is this module's. Planted:
  // openDecision 'AC-FL-009-5' put on row 1's Tenant Admin cell, imitating the
  // eight modules that legitimately carry it. Went red on both halves.
  it('claims no deferred decision on any of the fifty cells', () => {
    for (const row of FL_B11_MATRIX) {
      for (const column of FL_B11_COLUMNS) {
        expect(row.cells[column].openDecision, `${row.id}.${column}`).toBeNull()
      }
    }
    expect(TENANT_ADMIN_OPEN_CELLS.map((c) => c.module)).not.toContain('MOD-FL-B11')
    for (let n = FL_B11_SHAPE.firstDataLine; n <= FL_B11_SHAPE.lastDataLine; n += 1) {
      expect(srcLine(n), `L${n}`).not.toContain('Client Decision Required')
    }
  })

  // FAILS IF: `cells` stops being total over the five columns — the one thing
  // wave 0's row type exists to make untypeable, checked at runtime as well
  // because a cast could reach past the type. Planted: row 4's TENANT_ADMIN
  // cell deleted with a cast.
  it('holds a cell for every column of every row, with no blank', () => {
    for (const row of FL_B11_MATRIX) {
      expect(Object.keys(row.cells).sort()).toEqual([...FL_B11_COLUMNS].sort())
      for (const column of FL_B11_COLUMNS) {
        expect(row.cells[column].note.trim().length, `${row.id}.${column}`).toBeGreaterThan(0)
      }
    }
  })

  // FAILS IF: a row's governing sentence is not at the line it cites, or the
  // anchor identifier is not on that line. Twenty-eight of the fifty cells say
  // nothing but their token, so this sentence is what stands where a control
  // would. Planted: row 3's whyRef moved to L42020, which is row 4's
  // functionality. Went red on the sentence match.
  it('finds each row’s governing sentence at the line and anchor it cites', () => {
    for (const row of FL_B11_MATRIX) {
      const [n] = locatorsOf(row.whyRef)
      const line = norm(srcLine(n as number))
      const anchor = anchorOf(row.whyRef)
      if (anchor !== null) {
        expect(srcLine(n as number).includes(anchor), `${row.id} anchor ${anchor} at L${n}`).toBe(
          true,
        )
      }
      for (const sentence of row.why.split(/(?<=\.)\s+/).filter((s) => s.trim().length >= 25)) {
        expect(line, `${row.id}: ${sentence.slice(0, 50)}`).toContain(norm(sentence))
      }
    }
    // and the count that makes `why` required is derived, not asserted.
    expect(B11_BARE_TOKEN_CELLS).toHaveLength(28)
  })

  // FAILS IF: a convenience pointer is added. `routedTo` is keyed on this
  // matrix's own row ids and nothing in this matrix routes anywhere: an act
  // met on another surface is a statement, never a pointer. Planted:
  // `routedTo: { WORKER: 'hand-back' }` on row 5. Went red.
  it('routes no column of any row to another row of this matrix', () => {
    for (const row of FL_B11_MATRIX) {
      expect(Object.keys(row.routedTo), `${row.id}`).toEqual([])
    }
  })
})

/* ==================================================================== *
 * THE CROSS-SURFACE BLOCK, WHICH IS THE DENSEST IN THE SLICE.
 * ==================================================================== */

describe('the four rows this device does not carry', () => {
  // FAILS IF: a row whose own cells place the act in the Delivery Operations
  // Hub is classified as this screen's.
  //
  // WAVE 0'S OWN GUARD CANNOT CATCH THIS, AND THAT IS A FINDING RATHER THAN A
  // REASON TO SKIP IT. Planted first: row 7's surface changed to 'screen',
  // which is the shape wave 0's own comment says actually ships — "the cell
  // reads `Allowed`, the row gets classified by its token, and the button
  // follows honestly from a wrong classification". `controlsOnActsHeldElse-
  // where` STAYED GREEN. Its second loop reads `if (drawn.kind !== 'control')
  // continue; if (row.surface === 'screen' || row.surface === 'chrome')
  // continue` — and `frontlineAffordance` returns `cross-surface` or
  // `named-place`, never `control`, for precisely the two surfaces that loop
  // does not skip. So the loop is unreachable by construction and the only
  // live check is the `INVARIANT_ACT_TEXT` one above it, which covers three
  // Action strings in the whole surface. Row 7 is not one of the three.
  //
  // Wave 0 is not this task's file to change, so the check is written here,
  // against the SOURCE rather than against the classification: a row is
  // `another-surface` exactly when one of its own five cells names the
  // Delivery Operations Hub. With that, the planted row 7 went red.
  it('classifies as another-surface exactly the rows whose cells name the Hub', () => {
    for (const row of FL_B11_MATRIX) {
      const [n] = locatorsOf(row.sourceRef)
      const namesTheHub = srcLine(n as number).includes('Delivery Operations Hub')
      expect(row.surface === 'another-surface', `L${n} ${row.id}`).toBe(namesTheHub)
    }
    // four of the ten, and they are the four adjacent-block rows.
    expect(FL_B11_MATRIX.filter((r) => r.surface === 'another-surface')).toHaveLength(4)
    // wave 0's guard is still asked, for the two acts it does cover.
    expect(controlsOnActsHeldElsewhere(FL_B11_MATRIX, FL_B11_COLUMNS)).toEqual([])
    // and the limitation is reported rather than worked around silently.
    const finding = B11_SOURCE_FINDINGS.find((f) => f.what.includes('controlsOnActsHeldElsewhere'))
    expect(finding, 'the wave-0 limitation is reported').toBeDefined()
  })

  // FAILS IF: an EXCL-FL-06 act is classified anything but another-surface.
  // Wave 0 matches on the ACTION TEXT, so this also fails if the Action is
  // re-worded away from the source's. Planted: row 6's surface set to
  // 'screen'. Wave 0's own guard fired, which is the point — three modules
  // meet these two acts independently and one catching it protects none of the
  // other two.
  it('classifies both invariant-excluded acts as another-surface', () => {
    expect(B11_INVARIANT_EXCLUDED_ROWS).toEqual(['cancel-a-run', 'terminally-complete-a-run'])
    const acts = INVARIANT_EXCLUDED_ACTS.map((a) => a.act)
    for (const id of B11_INVARIANT_EXCLUDED_ROWS) {
      const row = b11Row(id)
      expect(acts, `${id} is one of wave 0’s`).toContain(row.control)
      expect(row.surface, id).toBe('another-surface')
      for (const column of FL_B11_COLUMNS) {
        expect(frontlineAffordance(row, column).kind, `${id}.${column}`).toBe('cross-surface')
      }
    }
    // EXCL-FL-06 says Invariant at the line this module cites for it, and the
    // classification is what makes a control a broken guarantee rather than a
    // misplacement. The four columns are read individually so a re-worded
    // exclusion cannot pass on a substring.
    const excl = tableCells(39489)
    expect(excl[1]).toBe('`EXCL-FL-06`')
    expect(excl[2]).toBe('Worker-initiated Run cancellation or terminal completion')
    expect(excl[4]).toBe('Delivery Operations Hub')
    expect(excl[5]).toBe('Invariant')
    // wave 0 cites both of this module's rows against it.
    const refs = INVARIANT_EXCLUDED_ACTS.map((a) => a.sourceRef).join(' ')
    expect(refs).toContain('L41953')
    expect(refs).toContain('L41954')
  })

  // FAILS IF: a row that is met on another surface names nowhere to send a
  // reader, or a row met on this screen claims it is met elsewhere. Also
  // catches the `metElsewhereRef` fallback branch in the panel going live —
  // `fl-a6` recorded that the const assertion makes the `??` unreachable, so
  // the assertion here is what keeps it honest. Planted: row 10's
  // metElsewhereRef set to null. Went red.
  it('names a second, independent reading of the surface on all four', () => {
    const elsewhere = FL_B11_MATRIX.filter((r) => r.surface === 'another-surface')
    expect(elsewhere.map((r) => r.id)).toEqual([
      'cancel-a-run',
      'terminally-complete-a-run',
      'initiate-substitution',
      'extend-run-end-time',
    ])
    for (const row of FL_B11_MATRIX) {
      if (row.surface === 'another-surface') {
        expect(row.metElsewhere, row.id).not.toBeNull()
        expect(row.metElsewhere?.where).toBe('another-surface')
        expect(row.metElsewhereRef, `${row.id} names its lines`).not.toBeNull()
        // more than one locator, because one reading of a surface is an
        // assertion and two are a citation. Three of the four rows have an
        // elliptical cell naming no surface at all.
        expect(locatorsOf(row.metElsewhereRef ?? '').length, row.id).toBeGreaterThanOrEqual(2)
        for (const n of locatorsOf(row.metElsewhereRef ?? '')) {
          expect(srcLine(n).length, `${row.id} cites a real L${n}`).toBeGreaterThan(0)
        }
      } else {
        expect(row.metElsewhere, row.id).toBeNull()
        expect(row.metElsewhereRef, row.id).toBeNull()
      }
    }
    // every one of the four names the Hub, and the card says so independently.
    expect(elsewhere.every((r) => r.metElsewhere?.surface === 'SURF-DOH')).toBe(true)
    expect(srcLine(41941)).toContain('Delivery Operations Hub')
  })

  // FAILS IF: the eight permissive elsewhere-cells stop being eight, or one
  // of them is quietly downgraded to a prohibition so the block reads tidier.
  // THIS IS THE MATRIX'S DEFINING FACT — rows 5 through 7 and row 10, four
  // adjacent rows carrying eight acts this device does not have. Planted: row
  // 10's Quality Manager cell retyped `explicitlyProhibited`. Went red at
  // seven, and the cell-verbatim gate above went red too.
  it('carries eight permissive cells across four rows, and reads each off the source', () => {
    expect(B11_ELSEWHERE_PERMISSIVE_CELLS).toHaveLength(8)
    expect(new Set(B11_ELSEWHERE_PERMISSIVE_CELLS.map((c) => c.rowId)).size).toBe(4)
    expect(new Set(B11_ELSEWHERE_PERMISSIVE_CELLS.map((c) => c.column))).toEqual(
      new Set(['SUPERVISOR', 'QUALITY_MANAGER']),
    )
    for (const c of B11_ELSEWHERE_PERMISSIVE_CELLS) {
      const [n] = locatorsOf(c.sourceRef)
      expect(norm(srcLine(n as number)), `${c.rowId}.${c.column}`).toContain(norm(c.note))
    }
  })

  // FAILS IF: an elliptical cell is "helpfully" expanded to name the surface
  // its neighbour names, which would make the transcription wrong and hide the
  // exact trap wave 0 declared `surface` per-row to survive. Planted: row 7's
  // Quality Manager cell rewritten as "Allowed — initiated in the Delivery
  // Operations Hub with a reason". Went red here and on the verbatim gate.
  it('keeps the three elliptical cells elliptical, and none of them names a surface', () => {
    expect(B11_ELLIPTICAL_CELLS.map((c) => `${c.rowId}.${c.column}`)).toEqual([
      'terminally-complete-a-run.QUALITY_MANAGER',
      'initiate-substitution.QUALITY_MANAGER',
      'extend-run-end-time.QUALITY_MANAGER',
    ])
    for (const c of B11_ELLIPTICAL_CELLS) {
      expect(c.note, `${c.rowId}.${c.column}`).not.toContain('Delivery Operations Hub')
      expect(c.note, `${c.rowId}.${c.column}`).not.toContain('Hub')
    }
    // the source's own three lines, read directly: each has "— same" in the
    // fourth pipe-cell and the Hub only in the third.
    for (const n of [41954, 41955, 41958]) {
      expect(tableCells(n)[4], `L${n} QM cell`).toMatch(/— same$/)
      expect(tableCells(n)[4], `L${n} QM cell`).not.toContain('Hub')
      expect(tableCells(n)[3], `L${n} Supervisor cell`).toContain('Delivery Operations Hub')
    }
  })
})

/* ==================================================================== *
 * THE TWO UNIFORM PROHIBITIONS, AND THE EXISTENCE RULING THAT SPLITS
 * THEM.
 * ==================================================================== */

describe('what exists nowhere, and what exists and may not be done', () => {
  // FAILS IF: rows 2 and 9 are given the same existence because they look the
  // same — both prohibited in all five columns. The source separates them and
  // this gate reads its words. Planted: row 9 set to 'not-in-scope', which
  // reads plausible and says attribution is a thing that exists nowhere for
  // anyone. Went red on the row-9 half and on the drawn-kind half.
  it('reads row 2 as not-in-scope and row 9 as present, off the source’s own clauses', () => {
    expect(b11Row('pause-run-for-everybody').existence).toBe('not-in-scope')
    expect(b11Row('re-attribute-steps').existence).toBe('present')

    // row 2: the source calls it a state that does not exist.
    expect(norm(srcLine(42016))).toContain(norm('Ensure pause is not a Run state'))
    expect(norm(srcLine(42016))).toContain(
      norm('Not applicable — a state that does not exist cannot fail.'),
    )
    // row 9: the source says the attribution exists and is immutable, which is
    // the opposite of a capability that exists nowhere.
    expect(norm(srcLine(42003))).toContain(
      norm('Pre-substitution steps stay attributed to the original worker, and that attribution is immutable.'),
    )
    expect(norm(srcLine(42005))).toContain(norm('Attribution cannot be re-assigned after the fact'))

    // and the two produce different renderings, which is the whole cost of
    // getting it wrong.
    expect(frontlineAffordance(b11Row('pause-run-for-everybody'), 'WORKER').kind).toBe(
      'stated-line',
    )
    expect(frontlineAffordance(b11Row('re-attribute-steps'), 'WORKER').kind).toBe('refusal')
  })

  // FAILS IF: row 2's two different reasons are collapsed into one. The Worker
  // cell and the Supervisor cell each state a DIFFERENT ground for the same
  // prohibition, and the panel draws both because the fold is asked per
  // column. Planted: the Supervisor cell's note replaced with the Worker's, so
  // both read "pause is not a Run state". Went red.
  it('renders both of row 2’s reasons, one per column, and they are different', () => {
    const row = b11Row('pause-run-for-everybody')
    const worker = frontlineAffordance(row, 'WORKER')
    const supervisor = frontlineAffordance(row, 'SUPERVISOR')
    expect(worker.kind).toBe('stated-line')
    expect(supervisor.kind).toBe('stated-line')
    const workerLine = worker.kind === 'stated-line' ? worker.line : ''
    const supervisorLine = supervisor.kind === 'stated-line' ? supervisor.line : ''
    expect(workerLine).not.toBe(supervisorLine)
    expect(workerLine).toContain('pause is not a Run state')
    expect(supervisorLine).toContain(
      'pausing or stopping a run is deliberately impossible from the Client Command Center',
    )
    // both are the source's own words, at the row's own line.
    const cells = tableCells(41950)
    expect(cells[2]).toContain('pause is not a Run state')
    expect(cells[3]).toContain('deliberately impossible from the Client Command Center')
  })

  // FAILS IF: the four Worker controls become three or five, or one of them
  // stops being the Worker's. THE INVERSE TRAP IS WHY THIS IS ASSERTED AS A
  // LIST: this surface owns six genuine non-Worker on-device controls and NONE
  // of them is this module's, so a rule reading "Supervisor permissive means
  // elsewhere" is right here and wrong twice elsewhere. Planted: row 8's
  // SUPERVISOR cell retyped `allowed`, which reads plausible — a supervisor
  // stepping in as a substitute. Went red at five.
  it('draws exactly four controls, all four the Worker’s', () => {
    const drawn: string[] = []
    for (const row of FL_B11_MATRIX) {
      for (const column of FL_B11_COLUMNS) {
        if (frontlineAffordance(row, column).kind === 'control') drawn.push(`${row.id}.${column}`)
      }
    }
    expect(drawn).toEqual([
      'pause-own-session.WORKER',
      'step-away.WORKER',
      'hand-back.WORKER',
      'receive-handover-state.WORKER',
    ])
  })
})

/* ==================================================================== *
 * THE IDENTITY CARD.
 * ==================================================================== */

describe('the module card, against the lines it cites', () => {
  // FAILS IF: a card field cites a line it is not on, or was paraphrased.
  // Planted: the Offline behaviour field's sourceRef moved from L41981 to
  // L41979, its neighbour, which is Online behaviour and reads plausibly
  // similar. Went red on three sentences.
  it('finds every card field’s prose at the line it cites', () => {
    expect(B11_CARD).toHaveLength(22)
    for (const s of B11_CARD) {
      const [n] = locatorsOf(s.sourceRef)
      const line = norm(srcLine(n as number))
      const anchor = anchorOf(s.sourceRef)
      if (anchor !== null) {
        expect(srcLine(n as number).includes(anchor), `${s.field} anchor ${anchor}`).toBe(true)
      }
      for (const sentence of s.text.split(/(?<=\.)\s+/).filter((x) => x.trim().length >= 25)) {
        expect(line, `${s.field}: ${sentence.slice(0, 50)}`).toContain(norm(sentence))
      }
    }
  })

  // FAILS IF: a classification is asserted for a field whose card carries
  // none, or dropped from one that carries it. Counted off the cited lines
  // rather than trusting the comment beside the constant. Planted:
  // `sourceClass: 'SoW Fact'` added to the Audit field, whose line has no
  // marker. Went red naming the field.
  it('marks exactly the seven fields whose own line carries a SoW Fact marker', () => {
    // BOTH SPELLINGS, because the source uses both and picking one silently
    // inverts the gate. Chapter 22's card fields write the marker `[SoW Fact —
    // …]` with the backtick OUTSIDE the bracket; the decision cards in chapter
    // 5 write [`SoW Fact` — …] with it inside. This gate first read only the
    // second form, so every one of the seven marked fields came back unmarked
    // and the assertion fired on correct transcriptions.
    const MARKER = /\[`?SoW Fact/
    for (const s of B11_CARD) {
      const [n] = locatorsOf(s.sourceRef)
      const carries = MARKER.test(srcLine(n as number))
      expect(s.sourceClass !== null, `${s.field} at L${n}`).toBe(carries)
    }
    expect(B11_CARD.filter((s) => s.sourceClass !== null)).toHaveLength(7)
    expect(B11_CARD.filter((s) => s.sourceClass === null)).toHaveLength(15)
  })

  // FAILS IF: a state identifier is not at L41968, or a gloss is invented for
  // one of the five the source leaves bare. Planted: a gloss added to
  // STATE-B11-SUBSTITUTED reading "the substitute is working the run" — which
  // is true, and is this build's sentence rather than the source's. Went red.
  it('carries six states from L41968 and glosses only the one the source glosses', () => {
    expect(B11_STATES).toHaveLength(6)
    for (const s of B11_STATES) {
      expect(srcLine(41968).includes(s.id), `${s.id} at L41968`).toBe(true)
    }
    const glossed = B11_STATES.filter((s) => s.gloss !== null)
    expect(glossed.map((s) => s.id)).toEqual(['STATE-B11-PAUSED'])
    expect(norm(srcLine(41968))).toContain(
      norm('`STATE-B11-PAUSED` at the worker-session level only'),
    )
    // the source names six and no more: every backticked STATE-B11 token on
    // the line is one this module carries.
    const inSource = [...srcLine(41968).matchAll(/STATE-B11-[A-Z]+/g)].map((m) => m[0])
    expect([...new Set(inSource)].sort()).toEqual([...B11_STATES].map((s) => s.id).sort())
    expect(B11_STATES_ONLY_STATED.map((s) => s.id)).toEqual(['STATE-B11-EXPIRYBLOCKED'])
  })

  // FAILS IF: the four run states are collapsed, re-ordered onto one, or
  // attributed to the wrong holder. THIS IS THE CLAIM THIS MODULE IS MOST ABLE
  // TO SHIP. Planted: `complete` given reachedBy 'the worker, on this device'.
  // Went red on the holder check.
  it('holds worker-finished, submitted, complete and finished apart, each at its line', () => {
    expect(B11_FOUR_RUN_STATES.map((s) => s.state)).toEqual([
      'worker-finished',
      'submitted',
      'complete',
      'finished',
    ])
    expect(B11_FOUR_RUN_STATES.every((s) => !s.labelledOnThisPanel)).toBe(true)
    // exactly one of the four is the device's.
    expect(
      B11_FOUR_RUN_STATES.filter((s) => s.reachedBy === 'the worker, on this device'),
    ).toHaveLength(1)
    // and the source draws the same three boundaries, in three places.
    expect(norm(srcLine(39045))).toContain(
      norm('The worker declares their part finished (worker-finished), which stands the Run as `submitted`'),
    )
    expect(norm(srcLine(39046))).toContain(
      norm('when the server has received and acknowledged all of them the Run moves to `complete`'),
    )
    expect(norm(srcLine(39047))).toContain(
      norm('The Delivery Operations Hub finishes the record automatically after the tenant’s record-finish window'),
    )
    expect(norm(srcLine(40545))).toContain(
      norm('The platform states `submitted`, `complete`, and `finished` are run-record states, not player states'),
    )
    expect(norm(srcLine(39066))).toContain(norm('the completion screen, showing worker-finished'))
    // this module's own diagram narration says the exit is a declaration.
    expect(norm(srcLine(42056))).toContain(
      norm('The only exit is worker-finished, which is a declaration and not a cancellation.'),
    )
  })

  // FAILS IF: the storyboard's own strings are paraphrased, or the
  // supervisor-visibility disclosure the card explicitly asks for is dropped.
  // Planted: frame 1's line shortened to "Your supervisor will be told." Went
  // red.
  it('carries SB-FL-020 and the disclosure the Security field asks for, verbatim', () => {
    const sb = norm(srcLine(42058))
    for (const frame of [SB_FL_020.frame1, SB_FL_020.frame2, SB_FL_020.frame3, SB_FL_020.frame4]) {
      expect(sb, frame.slice(0, 40)).toContain(norm(frame))
    }
    const sec = norm(srcLine(42005))
    expect(sec).toContain(norm(B11_SUPERVISOR_VISIBILITY.what))
    expect(sec).toContain(norm(B11_SUPERVISOR_VISIBILITY.why))
    expect(sec).toContain(norm(B11_SUPERVISOR_VISIBILITY.mitigation))
    // the card does not merely permit the disclosure, it asks for it.
    expect(sec).toContain(norm('needs stating plainly'))
  })
})

/* ==================================================================== *
 * THE FUNCTIONALITIES AND THE FALLBACK OBLIGATION.
 * ==================================================================== */

describe('the eleven functionalities', () => {
  // FAILS IF: the module's functionality list and the source's disagree.
  // Counted off the source by scanning the feature block rather than by
  // trusting the brief's "11". Planted: FUNC-B11-04-1-2 deleted. Went red at
  // ten against the source's eleven.
  it('is eleven, and they are the eleven the source enumerates', () => {
    const inSource: string[] = []
    for (let n = 42011; n <= 42034; n += 1) {
      for (const m of srcLine(n).matchAll(/FUNC-B11-\d+-\d+-\d+/g)) inSource.push(m[0])
    }
    expect([...new Set(inSource)]).toHaveLength(11)
    expect(B11_FUNCTIONALITIES.map((f) => f.id)).toEqual([...new Set(inSource)])
  })

  // FAILS IF: a functionality's words are not at the line it cites. Planted:
  // FUNC-B11-03-1-2's rolesProhibited changed to "Roles prohibited: none",
  // which is what its sibling carries. Went red.
  it('finds every clause of every functionality at its own line', () => {
    for (const f of B11_FUNCTIONALITIES) {
      const [n] = locatorsOf(f.sourceRef)
      const line = norm(srcLine(n as number))
      expect(srcLine(n as number).includes(f.id), `${f.id} at L${n}`).toBe(true)
      for (const clause of [
        f.statement,
        f.rolesAllowed,
        f.rolesProhibited,
        f.connectivity,
        f.fallbackClause,
      ]) {
        if (clause === null) continue
        expect(line, `${f.id}: ${clause.slice(0, 45)}`).toContain(norm(clause))
      }
      for (const p of f.patterns) {
        expect(srcLine(n as number).includes(p), `${f.id} names ${p}`).toBe(true)
      }
    }
  })

  // FAILS IF: the AC-FL-011-1 gaps are closed by invention rather than
  // reported. Two of the eleven name no pattern and each states its own ground
  // in the same clause. Planted: FUNC-B11-02-1-3 given FB-FL-SEC-01, which is
  // plausible — suspension is nearby. Went red on both the derived list and
  // the stored one.
  it('reports the two functionalities that name no FB-FL-* pattern', () => {
    expect(functionalitiesNamingNoPattern(B11_FUNCTIONALITIES)).toEqual([
      'FUNC-B11-01-1-2',
      'FUNC-B11-02-1-3',
    ])
    expect(B11_FUNCTIONALITIES_NAMING_NO_PATTERN).toEqual([
      'FUNC-B11-01-1-2',
      'FUNC-B11-02-1-3',
    ])
    for (const [id, line] of [
      ['FUNC-B11-01-1-2', 42016],
      ['FUNC-B11-02-1-3', 42021],
    ] as const) {
      const gap = B11_FUNCTIONALITIES.find((f) => f.id === id)
      expect(norm(srcLine(line))).toContain(norm(gap?.fallbackClause ?? ''))
      expect(srcLine(line)).not.toMatch(/FB-FL-[A-Z0-9]+-\d+/)
    }
    // their neighbours prove the source supplies a pattern where it has one to
    // supply, from the same construction, so these are the source's gaps and
    // not transcription slips.
    expect(srcLine(42015)).toContain('FB-FL-AUTH-01')
    expect(srcLine(42020)).toContain('FB-FL-UP-01')
    expect(srcLine(40151)).toContain('AC-FL-011-1')
    expect(norm(srcLine(40151))).toContain(
      norm('Every functionality in this chapter names at least one'),
    )
  })

  // FAILS IF: the three readings of this module's fallback set are silently
  // reconciled to one. Four, five and six, and the two divergences are exact.
  // Planted: FB-FL-CAP-01 removed from FUNC-B11-03-1-2 and FUNC-B11-03-1-3 so
  // the functionalities agreed with the card at five. Went red on the derived
  // list.
  it('keeps three divergent readings of its fallback set apart: four, five, six', () => {
    expect(B11_MAPPED_PATTERNS.map((p) => p.id).sort()).toEqual([
      'FB-FL-AUTH-01',
      'FB-FL-CMD-01',
      'FB-FL-GATE-01',
      'FB-FL-SEC-01',
    ])
    expect([...B11_PATTERN_DIVERGENCE.fromTheCardsFallbackLine].sort()).toEqual([
      'FB-FL-AUTH-01',
      'FB-FL-CMD-01',
      'FB-FL-GATE-01',
      'FB-FL-SEC-01',
      'FB-FL-UP-01',
    ])
    expect([...B11_PATTERNS_NAMED_BY_FUNCTIONALITIES].sort()).toEqual([
      'FB-FL-AUTH-01',
      'FB-FL-CAP-01',
      'FB-FL-CMD-01',
      'FB-FL-GATE-01',
      'FB-FL-SEC-01',
      'FB-FL-UP-01',
    ])
    expect(B11_MAPPED_PATTERNS).toHaveLength(4)
    expect(B11_PATTERN_DIVERGENCE.fromTheCardsFallbackLine).toHaveLength(5)
    expect(B11_PATTERNS_NAMED_BY_FUNCTIONALITIES).toHaveLength(6)
    // the card's own line names its five, and the two divergent map rows do
    // not carry this module.
    for (const p of B11_PATTERN_DIVERGENCE.fromTheCardsFallbackLine) {
      expect(srcLine(42007), `card names ${p}`).toContain(p)
    }
    expect(srcLine(42007)).not.toContain('FB-FL-CAP-01')
    expect(srcLine(40134)).toContain('FB-FL-UP-01')
    expect(srcLine(40134)).not.toContain('MOD-FL-B11')
    expect(srcLine(40133)).toContain('FB-FL-CAP-01')
    expect(srcLine(40133)).not.toContain('MOD-FL-B11')
    for (const n of [40131, 40135, 40137, 40141]) {
      expect(srcLine(n), `map row L${n}`).toContain('MOD-FL-B11')
    }
    // and every pattern the map gives names a terminal safe state, which
    // AC-FL-011-2 turns on.
    for (const p of B11_MAPPED_PATTERNS) {
      expect(p.terminalSafeState.trim().length, p.id).toBeGreaterThan(0)
    }
  })
})

/* ==================================================================== *
 * THE ACCEPTANCE CRITERIA.
 * ==================================================================== */

describe('the seven acceptance criteria', () => {
  // FAILS IF: a criterion is transcribed from the wrong row, or one is
  // dropped. Seven criteria over the seven rows L42068-L42074. Planted:
  // AC-B11-4's text swapped with AC-B11-5's, which reads plausibly — both are
  // about substitution. Went red on both.
  it('reads all seven off their own rows', () => {
    expect(B11_ACCEPTANCE_CRITERIA).toHaveLength(7)
    B11_ACCEPTANCE_CRITERIA.forEach((ac, i) => {
      const n = 42068 + i
      const cells = tableCells(n)
      expect(cells[1], `L${n} identifier`).toBe(`\`${ac.id}\``)
      expect(norm(cells[2] ?? ''), ac.id).toBe(norm(ac.text))
      expect(locatorsOf(ac.sourceRef)[0], `${ac.id} cites its own row`).toBe(n)
    })
    expect(srcLine(42067).replace(/\s/g, '')).toBe('|---|---|')
  })
})

/* ==================================================================== *
 * THE DISCLOSURES, AND THE STAND-IN BUILT TO EXPIRE.
 * ==================================================================== */

describe('the four decisions this module discloses', () => {
  // FAILS IF: a disclosed reading is not at the locator beside it. This is
  // where a wrong citation does the most damage, because a client follows a
  // disclosure's locator specifically. Planted: DEC-STUCK-001 Reading B's
  // locator moved to L5255, which is Reading A — one line off, both real.
  // Went red.
  it('finds every reading at its own locator', () => {
    expect(B11_DISCLOSURES).toHaveLength(4)
    for (const d of B11_DISCLOSURES) {
      expect(d.readings.length, `${d.decisionRef} carries more than one reading`).toBeGreaterThan(1)
      for (const r of d.readings) {
        const [n] = locatorsOf(r.locator)
        expect(n, `${d.decisionRef} reading names a line`).toBeDefined()
        const line = norm(srcLine(n as number))
        for (const sentence of r.text.split(/(?<=\.)\s+/).filter((s) => s.trim().length >= 25)) {
          expect(line, `${d.decisionRef} L${n}: ${sentence.slice(0, 50)}`).toContain(norm(sentence))
        }
      }
    }
  })

  // FAILS IF: a decision is disclosed that the source does not raise, or is
  // filed under the wrong identifier. Every one of the four occurs in the
  // frozen source under its own name. Planted: DEC-NOSHIFT-001 renamed
  // DEC-SHIFT-001, which does not occur anywhere. Went red.
  it('names four identifiers the source actually raises', () => {
    const wanted = ['DEC-STUCK-001', 'DEC-PARK-001', 'DEC-NOSHIFT-001', 'DEC-PLUS-001']
    expect(B11_DISCLOSURES.map((d) => d.decisionRef)).toEqual(wanted)
    const whole = LINES.join('\n')
    for (const id of wanted) {
      expect(whole.includes(id), `${id} occurs in the frozen source`).toBe(true)
    }
    // the two cards, read at their own lines.
    expect(srcLine(5253)).toContain('DEC-STUCK-001')
    expect(srcLine(14670)).toContain('DEC-PLUS-001')
  })

  // FAILS IF: a decision is filed under an identifier the canon already holds,
  // or the canon grows a record for one of these four and this module goes on
  // disclosing it locally. THE STAND-IN IS BUILT TO EXPIRE. It reads the union
  // out of the canon file rather than trusting a comment about it. Planted:
  // DEC-PARK-001 re-filed as 'DEC-CAP-001', which the canon does hold. Went
  // red. The canon file itself was NOT edited to plant the other direction —
  // it is another task's path and a concurrent agent's tree.
  it('discloses locally only because the shared canon has no record for these', () => {
    const canon = readFileSync(join(process.cwd(), 'src/disclosure/decisions.ts'), 'utf8')
    const block = canon.match(/export type DecisionId =([\s\S]*?)\n\n/)
    expect(block).not.toBeNull()
    const members = [...(block?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1])
    expect(members.length).toBeGreaterThan(20)
    for (const d of B11_DISCLOSURES) {
      expect(members, `${d.decisionRef} is absent from the canon`).not.toContain(d.decisionRef)
      expect(d.canonNote).toContain('DecisionId')
    }
  })

  // FAILS IF: this module's own section is claimed to name a decision it does
  // not. §22.20 names NO DEC-* identifier at all, which is why every one of
  // the four is reached from outside it and why `whyHere` exists. Planted: the
  // sweep's upper bound cut to L42000, so the section looked shorter than it
  // is and the claim would have been checked over half the section. Restored
  // by deriving the bounds from the two section headings instead.
  it('finds no DEC-* identifier anywhere in section 22.20', () => {
    expect(srcLine(41929)).toContain('## 22.20 Module B11 — Worker Lifecycle on Device')
    expect(srcLine(42093)).toContain('## 22.21 Module B12')
    for (let n = 41929; n < 42093; n += 1) {
      expect(srcLine(n), `L${n} names no decision`).not.toMatch(/DEC-[A-Z]+-\d+/)
    }
    const finding = B11_SOURCE_FINDINGS.find((f) => f.what.includes('names no DEC-* identifier'))
    expect(finding, 'the absence is reported').toBeDefined()
    // and each disclosure says by which sentence of THIS section it is
    // reached, so a reader is not asked to take the relevance on trust.
    for (const d of B11_DISCLOSURES) {
      expect(locatorsOf(d.whyHere).length, `${d.decisionRef} whyHere cites a line`).toBeGreaterThan(
        0,
      )
      for (const n of locatorsOf(d.whyHere)) {
        expect(srcLine(n).length, `${d.decisionRef} cites a real L${n}`).toBeGreaterThan(0)
      }
    }
  })

  // FAILS IF: row 6's adoption of one reading is presented as settled. The
  // cell says "complete at close time", which is Reading A word for word,
  // while AC-RUN-004 refuses both readings. Planted: the adopted text changed
  // to say the build follows Reading A because the cell does. Went red on the
  // refusal check.
  it('shows row 6 stating Reading A, and AC-RUN-004 refusing both', () => {
    const row = b11Row('terminally-complete-a-run')
    expect(row.openDecisionBeside).toBe('DEC-STUCK-001')
    expect(row.cells.SUPERVISOR.note).toContain(
      'a manually closed stuck run is complete at close time and finishes on the same clock',
    )
    // Reading A, at its own line, in the same words.
    expect(norm(srcLine(5255))).toContain(
      norm('A manually closed stuck run is complete at close time and finishes on the same clock.'),
    )
    // AC-RUN-004 refuses both, at its own line.
    expect(srcLine(7128)).toContain('AC-RUN-004')
    expect(norm(srcLine(7128))).toContain(norm('neither reading is adopted here'))
    // a second matrix elsewhere in the source adopts A the same way, which is
    // how one reading becomes the record without a decision being taken.
    expect(norm(srcLine(27917))).toContain(
      norm('the run is `complete` at close time and finishes on the same clock'),
    )
    // and no row of this matrix carries `openDecisionBeside` except row 6.
    expect(FL_B11_MATRIX.filter((r) => r.openDecisionBeside !== null).map((r) => r.id)).toEqual([
      'terminally-complete-a-run',
    ])
    const disclosure = B11_DISCLOSURES.find((d) => d.decisionRef === 'DEC-STUCK-001')
    expect(disclosure?.adopted).toContain('Nothing is adopted')
  })
})

/* ==================================================================== *
 * THE MODULE'S OWN BEHAVIOUR.
 * ==================================================================== */

describe('pause, departure, substitution and expiry', () => {
  // FAILS IF: a pause changes the Run's state. `runStateChanged` is the
  // literal `false`, so the compiler refuses the direct defect; this asserts
  // the SENTENCE too, because a screen that said "Run paused" while the field
  // read false would be the same lie in the only place a reader looks.
  // Planted: the line rewritten to "Paused by device lock. The Run is paused
  // until you return." Typecheck stayed green and this went red.
  it('pauses one session and never the Run, in the field and in the sentence', () => {
    for (const cause of B11_PAUSE_CAUSES) {
      const p = pause(cause)
      expect(p.runStateChanged, cause).toBe(false)
      expect(p.onDeviceProgress).toBe('preserved')
      expect(p.line, cause).toContain('the Run is not paused')
      expect(p.line, cause).not.toMatch(/\bRun is paused\b/)
    }
    expect(B11_PAUSE_CAUSES).toEqual(['device lock', 'log-out', 'timeout'])
    // the three causes and the rule are the source's, at its own lines.
    expect(norm(srcLine(42015))).toContain(
      norm('a device lock, a log-out, or a timeout — that preserves on-device progress'),
    )
    expect(norm(srcLine(41974))).toContain(
      norm('Pause preserves on-device progress and does not pause the Run, because other workers may still be active on the same Run.'),
    )
    expect(norm(srcLine(42068))).toContain(
      norm('Pausing one worker’s session never changes the Run’s state for any other worker.'),
    )
  })

  // FAILS IF: an offline departure flag claims the supervisor knows. L41981 is
  // explicit that no surface may imply otherwise, and TEST-B11-6 is the test
  // that says so. Planted: the offline line changed to "Your supervisor has
  // been told." Went red on both the delivered flag and the wording.
  it('never claims the supervisor knows while the flag is queued', () => {
    for (const kind of ['step-away', 'hand-back'] as const) {
      const offline = departureFlag(kind, false)
      expect(offline.delivered, kind).toBe(false)
      expect(offline.line, kind).toContain('when this tablet reconnects')
      expect(offline.line, kind).not.toMatch(/\b(has been sent|has been told|knows)\b/)
      const online = departureFlag(kind, true)
      expect(online.delivered, kind).toBe(true)
      expect(online.line).not.toBe(offline.line)
      // neither cancels nor completes anything, which is AC-B11-2's other half.
      expect(offline.notThis).toContain('cancels nothing and completes nothing')
    }
    // the two are different acts and say how they differ.
    expect(departureFlag('hand-back', true).difference).not.toBe(
      departureFlag('step-away', true).difference,
    )
    expect(norm(srcLine(42020))).toContain(
      norm('hand-back signals that the worker does not intend to return to this part, which is what tells the supervisor a substitution may be needed'),
    )
    expect(norm(srcLine(41981))).toContain(
      norm('the supervisor is not notified until sync, and no surface may imply otherwise'),
    )
    expect(norm(srcLine(42085))).toContain(norm('no surface claims the supervisor knows'))
    expect(norm(srcLine(42069))).toContain(norm('neither cancels nor completes anything'))
  })

  // FAILS IF: a handover renders before the command has been applied, or a
  // command for a Run this device no longer holds changes anything. Both are
  // the source's own rules and both refusals carry acknowledgement. Planted:
  // `effectiveOnThisDevice` replaced with a check for 'delivered', so a
  // delivered-but-unapplied command drew the handover. Went red.
  it('presents the handover only once the command is applied on this device', () => {
    const base = {
      commandClass: 'CMD-FL-REASSIGN',
      deviceHoldsTheRun: true,
      previousWorker: 'Maya',
    } as const
    expect(applySubstitution({ ...base, commandState: 'applied' }).applied).toBe(true)
    expect(applySubstitution({ ...base, commandState: 'acknowledged' }).applied).toBe(true)
    for (const state of ['delivered', 'downloaded', 'validated', 'queued', 'rejected'] as const) {
      const o = applySubstitution({ ...base, commandState: state })
      expect(o.applied, state).toBe(false)
      expect(o.applied ? null : o.acknowledged, state).toBe(true)
      expect(o.applied ? null : o.stateChanged, state).toBe(false)
      expect(effectiveOnThisDevice(state), state).toBe(false)
    }
    // the Run the device no longer holds: typed rejection, acknowledged, no
    // state change — TEST-B11-8's three requirements, each asserted.
    const gone = applySubstitution({ ...base, deviceHoldsTheRun: false, commandState: 'applied' })
    expect(gone.applied).toBe(false)
    expect(gone.applied ? null : gone.acknowledged).toBe(true)
    expect(gone.applied ? null : gone.stateChanged).toBe(false)
    expect(norm(srcLine(42087))).toContain(
      norm('assert typed rejection with acknowledgement and no state change'),
    )
    // a class the device does not accept is refused with the channel's own
    // typed reason rather than a private one.
    const wrong = applySubstitution({ ...base, commandClass: 'CMD-FL-PAUSE', commandState: 'applied' })
    expect(wrong.applied).toBe(false)
    expect(wrong.applied ? '' : wrong.reason).toContain('not one of the five command classes')
  })

  // FAILS IF: the handover presents fewer than the three elements the source
  // names, or presents the previous worker's credentials. AC-B11-4 requires
  // all three before the substitute's first capture. Planted: 'The open flags'
  // removed from the element list. Went red at two.
  it('presents all three handover elements, and never a session or credentials', () => {
    expect(B11_HANDOVER_ELEMENTS).toHaveLength(3)
    const applied = applySubstitution({
      commandClass: 'CMD-FL-REASSIGN',
      commandState: 'applied',
      deviceHoldsTheRun: true,
      previousWorker: 'Maya',
    })
    expect(applied.applied).toBe(true)
    expect(applied.applied ? applied.elements : []).toEqual([
      'The last completed step',
      'The open flags',
      'The current state',
    ])
    for (const e of B11_HANDOVER_ELEMENTS) {
      expect(norm(srcLine(42025)), e.element).toContain(norm(e.element.toLowerCase()))
      expect(norm(srcLine(41962)), e.element).toContain(norm(e.element.toLowerCase()))
    }
    expect(norm(srcLine(42071))).toContain(
      norm('the last completed step, the open flags, and the current state before their first capture'),
    )
    expect(norm(srcLine(42005))).toContain(norm(B11_SUBSTITUTE_NEVER_RECEIVES))
    // and the command class is wave 0's, not a second spelling.
    expect(B11_SUBSTITUTION_COMMAND?.id).toBe('CMD-FL-REASSIGN')
    expect(FL_COMMAND_CLASSES.map((c) => c.id)).toContain('CMD-FL-REASSIGN')
    expect(srcLine(39663)).toContain('Supervisor and above')
  })

  // FAILS IF: a connectivity argument reaches the expiry evaluation, or the
  // current Run stops being allowed to complete. L41979 and L41981 both say
  // the evaluation is local and identical, and gating it would be the shape
  // L40948 forbids. THE ARITY CHECK IS NOT ENOUGH ON ITS OWN — wave 1 recorded
  // an arity gate defeated by a defaulted parameter — so this reads the
  // function's own parameter names out of its source instead. Planted:
  // `online = true` added as a third destructured key and used to gate the
  // block. Arity stayed at 1; this went red on the key list.
  it('decides an expiry block from the certification and the step, and nothing else', () => {
    // READ THE PROPERTY ACCESSES, NOT THE PARAMETER LIST. The first version of
    // this gate matched the first brace group of `toString()`, which for a
    // non-destructuring signature is the FUNCTION BODY — so it compared four
    // fragments of source text against two names and fired on correct code. An
    // arity check alone is no better: wave 1 recorded one defeated by a
    // defaulted parameter, and a defaulted `online` would leave `length` at 1
    // here too. What actually catches the defect is the set of inputs the body
    // reads, because a connectivity gate has to read one.
    const reads = new Set(
      [...atStepExpiry.toString().matchAll(/input\.(\w+)/g)].map((m) => m[1]),
    )
    expect(reads.size, 'the body was readable').toBeGreaterThan(0)
    expect([...reads].sort()).toEqual(['atAGatedStep', 'certificationExpired'])
    expect(atStepExpiry.length).toBe(1)

    expect(atStepExpiry({ certificationExpired: false, atAGatedStep: true }).blocked).toBe(false)
    expect(atStepExpiry({ certificationExpired: false, atAGatedStep: false }).blocked).toBe(false)
    // the current Run completes; the block lands at the NEXT gated step.
    const midRun = atStepExpiry({ certificationExpired: true, atAGatedStep: false })
    expect(midRun.blocked).toBe(false)
    expect(midRun.line).toContain('The current Run may be completed')
    expect(atStepExpiry({ certificationExpired: true, atAGatedStep: true }).blocked).toBe(true)
    // no override, in every one of the four combinations.
    for (const a of [true, false]) {
      for (const b of [true, false]) {
        expect(
          atStepExpiry({ certificationExpired: a, atAGatedStep: b }).workerMayOverride,
        ).toBe(false)
      }
    }
    expect(norm(srcLine(42073))).toContain(
      norm('A certification expiring mid-Run allows the current Run to complete and blocks at the next gated step under the tenant’s posture.'),
    )
    expect(norm(srcLine(41979))).toContain(
      norm('Expiry evaluation is identical to offline, because it is local.'),
    )
    expect(norm(srcLine(42029))).toContain(norm('Roles prohibited: no worker override.'))
  })
})

/* ==================================================================== *
 * CATEGORICAL ABSENCES.
 * ==================================================================== */

describe('what nothing in this module may contain', () => {
  // FAILS IF: a pace figure, a timing widget, a countdown or a ranking reaches
  // this module's rendered text. AC-FL-000-5 (L39100), TEST-FL-000-3 (L39108),
  // AC-SCR-FL-002 (L48690), AC-SCOPE-045 (L2683).
  //
  // ONE STRING IS ALLOWED AND IT IS NAMED, NOT EXEMPTED. DEC-PARK-001's third
  // candidate behaviour is the source's own proposal and contains the word;
  // quoting a proposed escalation inside a disclosure is not a display. It is
  // permitted by NAME and asserted verbatim against L41682, so a defect cannot
  // hide behind the allowance: any other occurrence anywhere fails, and
  // altering that one string fails the verbatim check.
  //
  // Planted three times, because pluralisation is how this gate dies:
  // "countdown" in the departure flag's offline line, "timer" in the pause
  // sentence, and "timers" in a card field. All three went red naming the
  // field — the third is the one a `\btimer\b` pattern would have passed.
  it('carries no pace, timing, countdown or ranking word in any rendered string', () => {
    const FORBIDDEN = /\b(pace|timers?|countdowns?|rankings?|leaderboards?|productivity)\b/i
    const ALLOWED_WHERE = 'DEC-PARK-001 reading DEC-PARK-001 · L41682'
    const strings = renderedStrings()
    expect(strings.length).toBeGreaterThan(150)
    const offenders = strings.filter((s) => FORBIDDEN.test(s.text) && s.where !== ALLOWED_WHERE)
    expect(offenders.map((o) => `${o.where}: ${o.text.slice(0, 60)}`)).toEqual([])
    // the one allowed string exists, is the source's own words, and is at the
    // line it cites. Without this the allowance would be a hole.
    const allowed = strings.find((s) => s.where === ALLOWED_WHERE)
    expect(allowed, 'the allowed string is present').toBeDefined()
    expect(FORBIDDEN.test(allowed?.text ?? '')).toBe(true)
    expect(norm(srcLine(41682))).toContain(norm(allowed?.text ?? ''))
    // the four criteria are where this module says they are.
    expect(srcLine(39100)).toContain('AC-FL-000-5')
    expect(srcLine(39108)).toContain('TEST-FL-000-3')
    expect(srcLine(48690)).toContain('AC-SCR-FL-002')
    expect(srcLine(2683)).toContain('AC-SCOPE-045')
  })

  // FAILS IF: the word "synced" is written as a state anywhere in this module.
  // L39622 says there is no such state and no bare success. Planted: the
  // offline departure flag's line changed to "The flag is synced when this
  // tablet reconnects." Went red.
  it('never writes synced as a state', () => {
    for (const s of renderedStrings()) {
      expect(s.text, s.where).not.toMatch(/\bsynced\b/i)
    }
    expect(norm(srcLine(39622))).toContain(norm('there is no single state called "synced"'))
  })

  // FAILS IF: the build plan's rigour grade reaches the module. The dispatch
  // grades this module C2; the frozen source's own module-inventory column is
  // Band (header L39844) and this module's row (L39856) reads B. Neither is
  // rendered as a product fact. Planted: `grade: 'C2'` added to the card and
  // rendered. Went red.
  it('transcribes no build-plan grade, and states the source’s own band nowhere', () => {
    for (const s of renderedStrings()) {
      expect(s.text, s.where).not.toMatch(/\b(C1|C2)\b/)
    }
    // the source's own column, so the claim about it is checked rather than
    // asserted, and this module's own row is read rather than a neighbour's.
    expect(tableCells(39844).slice(1, 5)).toEqual([
      'Identifier',
      'Module',
      'Band',
      'One-line scope',
    ])
    expect(tableCells(39856)[1]).toBe('`MOD-FL-B11`')
    expect(tableCells(39856)[2]).toBe('Worker Lifecycle on Device')
    expect(tableCells(39856)[3]).toBe('B')
    // and the finding that records it names the right row. It does NOT spell
    // the grade: this gate first went red on the finding's own text, which is
    // the correct answer rather than a case for an allowance — a reader of
    // this panel has no use for a build-plan token, so the finding says the
    // grade is not a source value without printing it.
    const finding = B11_SOURCE_FINDINGS.find((f) => f.what.includes('rigour grade'))
    expect(finding, 'the misreading is reported').toBeDefined()
    expect(finding?.sourceRef).toContain('L39856')
    expect(finding?.what).not.toMatch(/\b(C1|C2)\b/)
  })
})

/* ==================================================================== *
 * THE COLUMNS AND THE ROUTE.
 * ==================================================================== */

describe('the columns, and where this module mounts', () => {
  // FAILS IF: a column becomes a private twelfth spelling of the platform's
  // five tenant roles. They are an `Extract` from `RoleId`, so a rename over
  // there fails to compile here rather than splitting the vocabulary. Planted:
  // 'READONLY_AUDITOR' replaced with 'AUDITOR'. Typecheck refused it, and this
  // went red on the heading map.
  it('are five members of the platform role union, in the header’s order', () => {
    const columns: readonly FlB11Column[] = FL_B11_COLUMNS
    expect(columns).toHaveLength(5)
    expect(Object.keys(FL_B11_COLUMN_HEADINGS)).toEqual([...FL_B11_COLUMNS])
    expect(FL_B11_COLUMNS.map((c) => FL_B11_COLUMN_HEADINGS[c])).toEqual([
      'Worker',
      'Supervisor',
      'Quality Manager',
      'Tenant Admin',
      'Read-only Auditor',
    ])
  })

  // FAILS IF: this module claims a §22.7 row that is not its own, or a row it
  // owns is dropped. The register's Module column is what decides.
  //
  // THIS GATE COULD NOT FAIL AS FIRST WRITTEN, and the reason is worth the
  // note. It re-derived `FL_PLAYER_VIEWS.filter(v => ['SCR-FL-22',
  // 'SCR-FL-23'].includes(v.id))` inside the test and checked THAT against the
  // source — asserting the test's own expression, never the module's. Planted:
  // SCR-FL-16, the worker-finished completion screen, added to the module's
  // list, which is exactly the screen this module must not own. It stayed
  // green. The list now lives in `service.ts` and is IMPORTED, so the value
  // under test is the one the panel mounts; the same plant then went red.
  it('renders the two §22.7 rows the register gives this module, and no others', () => {
    expect(B11_VIEW_IDS).toEqual(['SCR-FL-22', 'SCR-FL-23'])
    expect(B11_VIEW_NAMES).toEqual([
      'Step-away and hand-back sheet',
      'Substitution handover state',
    ])
    const mine = FL_PLAYER_VIEWS.filter((v) =>
      (B11_VIEW_IDS as readonly string[]).includes(v.id),
    )
    expect(mine.map((v) => v.name)).toEqual([...B11_VIEW_NAMES])
    expect(mine.every((v) => v.placement === 'run-player')).toBe(true)
    // the register's own Module column, read off the source.
    for (const v of mine) {
      const [n] = locatorsOf(v.sourceRef)
      expect(tableCells(n as number)[4], `L${n} module column`).toBe('`MOD-FL-B11`')
      expect(tableCells(n as number)[3], `L${n} destination`).toBe('Run Player')
    }
    // and no other row of the register names this module.
    const others = FL_PLAYER_VIEWS.filter(
      (v) => !(B11_VIEW_IDS as readonly string[]).includes(v.id),
    )
    for (const v of others) {
      const [n] = locatorsOf(v.sourceRef)
      expect(tableCells(n as number)[4], `L${n} is not this module’s`).not.toBe('`MOD-FL-B11`')
    }
  })
})
