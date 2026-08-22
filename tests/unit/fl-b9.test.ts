import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  FL_MATRIX_SHAPE,
  TENANT_ADMIN_OPEN_CELLS,
  controlsOnActsHeldElsewhere,
  frontlineAffordance,
} from '@/frontline/matrix'
import { FL_OVERLAY_ON_ANY_DESTINATION, FL_PLAYER_VIEWS } from '@/frontline/screens'
import { functionalitiesNamingNoPattern } from '@/frontline/fallbacks'
import { GENUINE_NON_WORKER_CONTROLS_ELSEWHERE } from '@/frontline/modules/fl-a1/matrix'
import { stripComments } from '../coverage/strip-comments'
import {
  B9_CARD,
  B9_CLAIMS_NEVER_MADE,
  B9_IDENTITY_CARD,
  B9_STATES,
  B9_STATES_SOURCE_REF,
  GATE_IS_IDENTICAL_OFFLINE,
  SAFETY_LAYER,
  SB_FL_018,
} from '@/frontline/modules/fl-b9/charter'
import {
  B9_COLUMNS,
  B9_COLUMN_HEADINGS,
  B9_GENUINE_NON_WORKER_CONTROLS,
  B9_GENUINE_NON_WORKER_CONTROLS_ELSEWHERE,
  B9_MATRIX,
  B9_SHAPE,
  b9Row,
  type B9Column,
} from '@/frontline/modules/fl-b9/matrix'
import {
  B9_ACCEPTANCE_CRITERIA,
  B9_CLEARANCE_COMMAND,
  B9_DISCLOSURES,
  B9_FUNCTIONALITIES,
  B9_FUNCTIONALITIES_NAMING_NO_PATTERN,
  B9_MAPPED_PATTERNS,
  B9_PATTERNS_NAMED_BY_FUNCTIONALITIES,
  B9_PATTERN_DIVERGENCE,
  B9_SOURCE_FINDINGS,
  CH4_AGAINST_CH22_ON_GATE_OVERRIDE,
  CLEARANCE_IS_EFFECTIVE_WHEN_APPLIED,
  clearanceApplication,
  gateEvaluation,
  signOffReadiness,
} from '@/frontline/modules/fl-b9/service'

/**
 * `MOD-FL-B9` — Gates and Sign-Off Authority, checked against the FROZEN
 * SOURCE rather than against a brief.
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
 * THE `L`-NUMBER GUARD IS NOT COSMETIC. This module writes some locators the
 * other way round — `L39840 · Client Decision Required — DEC-PLUS-001` — and
 * `L39840` matches the identifier shape exactly. Without the guard the anchor
 * check asks whether line 39840 contains the string "L39840", which is false
 * for every line in the file, so the gate fired on correct citations and
 * would have been "fixed" by deleting it.
 */
function anchorOf(sourceRef: string): string | null {
  const m = sourceRef.match(/^([A-Z][A-Z0-9-]{3,})\s+·/)
  const token = m?.[1] ?? null
  return token === null || /^L\d+$/.test(token) ? null : token
}

/** Sentences long enough to be a checkable claim. */
function checkableSentences(text: string): readonly string[] {
  return text
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 25)
}

/** The cells of a source table row, by pipe, trimmed. */
function tableCells(n: number): readonly string[] {
  return srcLine(n)
    .split('|')
    .map((c) => c.trim())
}

/**
 * The seven status tokens, longest first. THE ORDER IS LOAD-BEARING and it is
 * not tidiness: `Allowed` is a prefix of `Allowed with conditions`, so a
 * shortest-match or first-match rule passes an `allowedWithConditions` cell
 * retyped `allowed`. Longest match is the only rule that separates them, and
 * it also handles the two cells whose clause runs on WITHOUT an em dash —
 * L41619's "Explicitly prohibited on the device", which a `token + " —"` rule
 * rejects outright.
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
  for (const s of B9_CARD) push(`card ${s.field}`, s.text)
  for (const s of B9_STATES) push(s.id, s.gloss ?? '')
  push('gate offline', `${GATE_IS_IDENTICAL_OFFLINE.text} ${SAFETY_LAYER.reason}`)
  push(
    'storyboard',
    `${SB_FL_018.heading} ${SB_FL_018.requirement} ${SB_FL_018.parked} ${SB_FL_018.control} ${SB_FL_018.absent}`,
  )
  for (const c of B9_CLAIMS_NEVER_MADE) push('never-claimed', `${c.claim} ${c.instead}`)
  for (const row of B9_MATRIX) {
    push(`row ${row.id}`, `${row.control} ${row.why}`)
    for (const column of B9_COLUMNS) push(`${row.id}.${column}`, row.cells[column].note)
    const met = row.metElsewhere
    if (met !== null) push(`${row.id} met elsewhere`, met.note)
    for (const column of B9_COLUMNS) {
      const drawn = frontlineAffordance(row, column)
      push(`${row.id}.${column} drawn`, drawn.kind === 'stated-line' ? drawn.line : drawn.note)
    }
  }
  for (const g of B9_GENUINE_NON_WORKER_CONTROLS) push(g.rowId, g.why)
  for (const f of B9_FUNCTIONALITIES) {
    push(f.id, `${f.statement} ${f.rolesAllowed} ${f.connectivity} ${f.fallbackClause}`)
  }
  push('pattern divergence', B9_PATTERN_DIVERGENCE.note)
  for (const ac of B9_ACCEPTANCE_CRITERIA) push(ac.id, ac.text)
  for (const f of B9_SOURCE_FINDINGS) {
    push('finding', `${f.what} ${f.evidence} ${f.notClosedBecause}`)
  }
  for (const d of B9_DISCLOSURES) {
    push(d.decisionRef, `${d.question} ${d.adopted} ${d.whyHere} ${d.canonNote}`)
    for (const r of d.readings) push(`${d.decisionRef} reading ${r.locator}`, r.text)
  }
  const c = CH4_AGAINST_CH22_ON_GATE_OVERRIDE
  push('contradiction', `${c.title} ${c.question} ${c.whatThisBuildDraws} ${c.noDecisionIdentifier}`)
  for (const r of [...c.readings, ...c.bearsOnIt]) push(`contradiction ${r.locator}`, r.text)
  for (const current of [true, false]) {
    for (const posture of ['strict', 'lenient'] as const) {
      push(`gate ${String(current)} ${posture}`, gateEvaluation(current, posture).line)
    }
  }
  for (const expired of [true, false]) {
    push(`clearance ${String(expired)}`, clearanceApplication({ alreadyExpiredOnArrival: expired }).reason)
  }
  for (const online of [true, false]) push(`sign-off ${String(online)}`, signOffReadiness(online).line)
  return out
}

/* ==================================================================== *
 * THE SHAPE, AND THE ARITHMETIC THAT CHECKS IT.
 * ==================================================================== */

describe('the shape of MOD-FL-B9’s permission matrix', () => {
  // FAILS IF: a row is dropped or added. Planted: the ninth row deleted. Rows
  // went to 8 and cells to 40 while the data span stayed nine lines long,
  // which is the point of holding the span apart from the count.
  it('is nine rows over nine data lines, five columns, forty-five cells', () => {
    expect(B9_SHAPE.rows).toBe(9)
    expect(B9_SHAPE.columns).toBe(5)
    expect(B9_SHAPE.cells).toBe(45)
    expect(B9_SHAPE.rows * B9_SHAPE.columns).toBe(B9_SHAPE.cells)
    expect(B9_SHAPE.lastDataLine - B9_SHAPE.firstDataLine + 1).toBe(B9_SHAPE.rows)
    expect(B9_SHAPE.separatorLine).toBe(B9_SHAPE.headerLine + 1)
    expect(B9_SHAPE.firstDataLine).toBe(B9_SHAPE.separatorLine + 1)
  })

  // FAILS IF: this module's reading of its own span disagrees with wave 0's
  // reading of all twelve. Two independent transcriptions of one table.
  // Planted: headerLine moved to 41615. Went red on three fields.
  it('agrees with wave 0’s independent reading of the same table', () => {
    const waveZero = FL_MATRIX_SHAPE.find((m) => m.module === 'MOD-FL-B9')
    expect(waveZero).toBeDefined()
    expect(waveZero?.rows).toBe(B9_SHAPE.rows)
    expect(waveZero?.columns).toBe(B9_SHAPE.columns)
    expect(waveZero?.headerLine).toBe(B9_SHAPE.headerLine)
    expect(waveZero?.separatorLine).toBe(B9_SHAPE.separatorLine)
    expect(waveZero?.firstDataLine).toBe(B9_SHAPE.firstDataLine)
    expect(waveZero?.lastDataLine).toBe(B9_SHAPE.lastDataLine)
  })

  // FAILS IF: the header row is not where the shape says, or a column heading
  // is re-worded. Planted: 'Read-only Auditor' changed to 'Auditor'.
  it('reads its five column headings off the header line itself', () => {
    const header = tableCells(B9_SHAPE.headerLine).filter((c) => c.length > 0)
    expect(header[0]).toBe('Action')
    expect(header.slice(1)).toEqual(B9_COLUMNS.map((c) => B9_COLUMN_HEADINGS[c]))
  })

  // FAILS IF: the separator line is not a separator, which is what an
  // off-by-one span looks like. Planted: separatorLine 41618.
  it('cites a real separator line and nine real data lines', () => {
    expect(srcLine(B9_SHAPE.separatorLine).replace(/\s/g, '')).toBe('|---|---|---|---|---|---|')
    for (let n = B9_SHAPE.firstDataLine; n <= B9_SHAPE.lastDataLine; n += 1) {
      expect(srcLine(n).startsWith('| '), `L${n} is a data row`).toBe(true)
    }
  })
})

/* ==================================================================== *
 * THE TRANSCRIPTION, CELL BY CELL, AGAINST THE LINE IT CITES.
 * ==================================================================== */

describe('every row and every cell against its own source line', () => {
  // FAILS IF: a row cites the wrong line, or its Action text was paraphrased.
  // Planted: row 7's control shortened to 'Perform a substitute sign-off'.
  it('finds each row’s action text in the line the row cites', () => {
    expect(B9_MATRIX).toHaveLength(9)
    const cited = B9_MATRIX.map((r) => locatorsOf(r.sourceRef)[0])
    expect(cited).toEqual([41618, 41619, 41620, 41621, 41622, 41623, 41624, 41625, 41626])
    for (const row of B9_MATRIX) {
      const [n] = locatorsOf(row.sourceRef)
      expect(norm(tableCells(n as number)[1] ?? ''), `${row.id} action`).toBe(norm(row.control))
    }
  })

  // FAILS IF: a cell's words are not the cell's words. This catches an
  // invented note and a note quietly trimmed to its token. Planted: row 2's
  // Supervisor cell flattened to the bare EP default, dropping "on the
  // device" — which is the qualifier the whole Ch4.4 conflict turns on.
  it('finds every one of the forty-five cells in its row’s source line', () => {
    let counted = 0
    for (const row of B9_MATRIX) {
      const [n] = locatorsOf(row.sourceRef)
      const cells = tableCells(n as number)
      B9_COLUMNS.forEach((column, i) => {
        const cell = row.cells[column]
        expect(cell, `${row.id}.${column} exists`).toBeDefined()
        expect(norm(cells[i + 2] ?? ''), `${row.id}.${column}`).toBe(norm(cell.note))
        counted += 1
      })
    }
    expect(counted).toBe(45)
  })

  // FAILS IF: an outcome is mapped to a token the cell does not carry.
  // Planted twice, once for each half of the rule: row 7's Quality Manager
  // outcome retyped `allowed` (longest match stays `Allowed with conditions`,
  // red), and row 2's Supervisor outcome retyped `notApplicable` (longest
  // match stays `Explicitly prohibited`, red). A first-match rule passes the
  // first plant and a `token + " —"` rule rejects the correct cell outright.
  it('maps every outcome to the longest token the cell actually opens with', () => {
    for (const row of B9_MATRIX) {
      for (const column of B9_COLUMNS) {
        const cell = row.cells[column]
        const expected = OUTCOME_TOKEN[cell.outcome]
        expect(expected, `${cell.outcome} is a known token`).toBeDefined()
        expect(leadingToken(cell.note), `${row.id}.${column}`).toBe(expected)
      }
    }
  })

  // FAILS IF: the token tally and the cell count disagree — the shape a
  // truncated transcription takes when the row count still looks right.
  // Planted: row 1's Tenant Admin cell retyped `explicitlyProhibited`.
  it('sums its five tokens to the cell count', () => {
    const tally = new Map<string, number>()
    for (const row of B9_MATRIX) {
      for (const column of B9_COLUMNS) {
        const o = row.cells[column].outcome
        tally.set(o, (tally.get(o) ?? 0) + 1)
      }
    }
    expect(tally.get('explicitlyProhibited')).toBe(29)
    expect(tally.get('notApplicable')).toBe(5)
    expect(tally.get('allowedWithConditions')).toBe(5)
    expect(tally.get('allowed')).toBe(4)
    expect(tally.get('clientDecisionRequired')).toBe(2)
    expect([...tally.values()].reduce((a, b) => a + b, 0)).toBe(45)
    // The two tokens this matrix does not carry, stated rather than assumed.
    // `Unavailable` is the token overloaded across two opposite senses six
    // rows apart in MOD-FL-B12 (L42114 against L42120); it does not arise here.
    expect(tally.get('unavailable')).toBeUndefined()
    expect(tally.get('readOnly')).toBeUndefined()
  })

  // FAILS IF: an open decision is claimed for a cell that does not defer to
  // one, or is dropped from one that does. Exactly two cells, both Tenant
  // Admin, and wave 0 enumerates the same two for this module from its own
  // reading of all twelve matrices. Planted: openDecision nulled on L41624.
  it('carries the AC-FL-009-5 question on exactly the two cells wave 0 names', () => {
    const withDecision: string[] = []
    for (const row of B9_MATRIX) {
      for (const column of B9_COLUMNS) {
        if (row.cells[column].openDecision !== null) {
          expect(row.cells[column].openDecision).toBe('AC-FL-009-5')
          expect(column, `${row.id} open cell is Tenant Admin`).toBe('TENANT_ADMIN')
          withDecision.push(row.sourceRef)
        }
      }
    }
    expect(withDecision).toEqual(['L41623', 'L41624'])
    expect(
      TENANT_ADMIN_OPEN_CELLS.filter((c) => c.module === 'MOD-FL-B9').map((c) => c.sourceRef),
    ).toEqual(withDecision)
    expect(srcLine(39948).includes('AC-FL-009-5')).toBe(true)
    expect(norm(srcLine(39948))).toContain(
      norm('is carried as an open item and is not silently resolved in either direction'),
    )
  })

  // FAILS IF: a row's governing sentence is not at the line it cites, or the
  // identifier it anchors on is not there. No window: an identifier's line is
  // a fact stated exactly. Planted: the substitute row's whyRef pointed one
  // line earlier than the line that carries FUNC-B9-03-2-1. Went red on the
  // anchor before it went red on the words.
  //
  // THE PLANTED LINE NUMBER IS DELIBERATELY NOT SPELLED, here or below.
  // `tests/coverage/locator-fidelity.test.ts` lexes every L-number in this
  // tree as a citation and cannot tell a citation from an example of a wrong
  // one — it caught one written this way in this very file, a plant
  // description naming a blank line, and reported it as a blank-span
  // citation. Describing the plant costs nothing; filing a knowingly-false
  // citation to describe it costs the next reader their trust in the rest.
  it('finds each row’s governing sentence, and its anchor, at the cited line', () => {
    for (const row of B9_MATRIX) {
      const [n] = locatorsOf(row.whyRef)
      const anchor = anchorOf(row.whyRef)
      expect(anchor, `${row.id} anchors on an identifier`).not.toBeNull()
      expect(srcLine(n as number).includes(anchor as string), `${row.whyRef} anchor`).toBe(true)
      expect(norm(srcLine(n as number)).includes(norm(row.why)), `${row.id} why`).toBe(true)
    }
  })

  // FAILS IF: `cells` stops being total over the five columns — the one thing
  // a blank transcription looks like. Planted: row 4's TENANT_ADMIN key
  // removed. Typecheck caught it first; this catches a cast that got past.
  it('holds a filled cell at every one of the forty-five positions', () => {
    for (const row of B9_MATRIX) {
      for (const column of B9_COLUMNS) {
        const cell = row.cells[column] as { note?: string } | undefined
        expect(cell?.note, `${row.id}.${column}`).toBeTruthy()
      }
    }
  })
})

/* ==================================================================== *
 * THE ORDER OF QUESTIONS, AS THIS MATRIX ANSWERS IT.
 * ==================================================================== */

describe('what each cell draws', () => {
  // FAILS IF: this module draws a control for an act the source places on
  // another surface. Wave 0's own gate, run over this matrix. Planted: row 3
  // reclassified `screen`, which let both its permissive cells draw controls.
  it('draws no control on any row whose act is held on another surface', () => {
    expect(controlsOnActsHeldElsewhere(B9_MATRIX, B9_COLUMNS)).toEqual([])
  })

  // FAILS IF: a control is added or lost. THE INVERSE TRAP IS THE WHOLE POINT
  // OF THIS GATE: three of the four controls are NOT the Worker's, and the
  // uniform rule "a permissive Supervisor cell means the act is elsewhere"
  // would delete all three and leave the sign-off with no way to be
  // authorised. Planted: row 6 reclassified `another-surface` with SURF-CC.
  // Went red having lost two of the four.
  it('draws exactly four controls, and three of them are not the Worker’s', () => {
    const controls: string[] = []
    for (const row of B9_MATRIX) {
      for (const column of B9_COLUMNS) {
        if (frontlineAffordance(row, column).kind === 'control') {
          controls.push(`${row.id}.${column}`)
        }
      }
    }
    expect(controls).toEqual([
      'be-blocked-at-gate.WORKER',
      'authorise-sign-off.SUPERVISOR',
      'authorise-sign-off.QUALITY_MANAGER',
      'substitute-sign-off.QUALITY_MANAGER',
    ])
    expect(controls.filter((c) => !c.endsWith('.WORKER'))).toHaveLength(3)
  })

  // FAILS IF: a row that is met on another surface names nowhere, or a row
  // that is met here claims to be met elsewhere. Planted: row 8's
  // metElsewhere cast to null while its surface stayed `another-surface`.
  // `frontlineAffordance` threw — wave 0's own refusal for a row that
  // classifies itself away from this screen and names nowhere to send a
  // reader — and the gate went red.
  it('classifies exactly three rows as another surface, and all three name where', () => {
    const elsewhere = B9_MATRIX.filter((r) => r.surface === 'another-surface')
    expect(elsewhere.map((r) => r.id)).toEqual([
      'grant-clearance',
      'set-enforcement-posture',
      'enable-step-level-reconfirmation',
    ])
    for (const row of elsewhere) {
      expect(row.metElsewhere, `${row.id} names where`).not.toBeNull()
      for (const column of B9_COLUMNS) {
        expect(frontlineAffordance(row, column).kind, `${row.id}.${column}`).toBe('cross-surface')
      }
      // The note is the row's OWN words and is really in the row's own line.
      expect(norm(srcLine(locatorsOf(row.sourceRef)[0] as number))).toContain(
        norm(row.metElsewhere?.note ?? ''),
      )
    }
    expect(
      elsewhere.map((r) =>
        r.metElsewhere?.where === 'another-surface' ? r.metElsewhere.surface : null,
      ),
    ).toEqual(['SURF-CC', 'SURF-DOH', 'SURF-STU'])
  })

  // FAILS IF: row 5 is given the surface the source withholds, or is allowed
  // to draw a configuration control on this device. THE TRAP: a rule that
  // finds a cross-surface act by looking for a surface name misses this row
  // PRECISELY BECAUSE the note is silent, and its neighbour row 4 is the
  // control — same shape of cell, same column, one names the Hub and one
  // names nothing. Planted twice: row 5 reclassified `another-surface` with
  // SURF-DOH (red on the silence assertion below, because the Hub is not in
  // L41622), and row 5 set to `existence: 'present'` (red, because the Tenant
  // Admin cell then drew a control).
  it('draws a stated line for row 5, whose cell names a condition and no surface', () => {
    const SURFACES = [
      'Delivery Operations Hub',
      'Client Command Center',
      'Standards and Operations Studio',
      'Super Admin',
      'Frontline',
    ]
    // The neighbour names one. This row names none. Both read off the source.
    expect(SURFACES.filter((s) => srcLine(41621).includes(s))).toEqual([
      'Delivery Operations Hub',
    ])
    expect(SURFACES.filter((s) => srcLine(41622).includes(s))).toEqual([])

    const row = b9Row('set-clearance-duration')
    expect(row.sourceRef).toBe('L41622')
    expect(row.metElsewhere).toBeNull()
    expect(row.existence).toBe('not-in-scope')
    for (const column of B9_COLUMNS) {
      const drawn = frontlineAffordance(row, column)
      expect(drawn.kind, `${column}`).toBe('stated-line')
      if (drawn.kind === 'stated-line') expect(drawn.line).toContain(row.control)
    }
    // and it is the ONLY row of the nine that renders one.
    expect(B9_MATRIX.filter((r) => r.existence !== 'present').map((r) => r.id)).toEqual([
      'set-clearance-duration',
    ])
    // The ground the row stands on is real and at the line it cites.
    expect(srcLine(2683).includes('AC-SCOPE-040')).toBe(true)
    expect(norm(srcLine(2683))).toContain(
      norm('the Frontline Worker Application exposes no authoring or configuration control'),
    )
  })

  // FAILS IF: a convenience pointer is added. `routedTo` is declared only
  // where a cell's OWN WORDS name another row of this matrix, and no cell
  // here does: row 9's five are a bare Explicitly prohibited. The clearance
  // that would unpark row 9's Run IS row 3 of this matrix, which is exactly
  // why the temptation exists. Planted: row 9 routed to grant-clearance for
  // every column. Went red, and the cells drew pointers instead of refusals.
  it('routes no cell anywhere, because no cell’s own words name a row', () => {
    for (const row of B9_MATRIX) {
      expect(Object.keys(row.routedTo), `${row.id}`).toEqual([])
      for (const column of B9_COLUMNS) {
        expect(frontlineAffordance(row, column).kind, `${row.id}.${column}`).not.toBe('routed')
      }
    }
    expect(tableCells(41626).slice(2, 7).every((c) => c === '`Explicitly prohibited`')).toBe(true)
  })
})

/* ==================================================================== *
 * THE INVERSE TRAP, AND THE OVERLAY THIS MODULE DOES NOT OWN.
 * ==================================================================== */

describe('the two genuine non-Worker controls', () => {
  // FAILS IF: this module's record of the trap and MOD-FL-A1's disagree.
  // A1 names these two rows from the other end and this reads that list
  // rather than restating it. Planted: L41624 dropped from this module's
  // list. Went red against A1's two entries for MOD-FL-B9.
  //
  // THIS GATE COULD NOT FAIL WHEN IT WAS FIRST WRITTEN, and the plant that
  // found it is the second one below. It read `sourceRef` alone, so a record
  // whose `rowId` named a DIFFERENT row while citing the right line passed
  // untouched — which is the exact defect a record like this takes, because
  // the identifier and the line are written at different moments. Planted:
  // the substitute-sign-off record's rowId changed to
  // 'enable-step-level-reconfirmation' with its L41624 unchanged. GREEN. The
  // two assertions binding rowId to the row, and the named columns to the
  // controls they claim, are what close it, and the plant then went red.
  it('names the same two rows MOD-FL-A1 names for this module', () => {
    expect(B9_GENUINE_NON_WORKER_CONTROLS.map((g) => g.sourceRef)).toEqual(['L41623', 'L41624'])
    for (const g of B9_GENUINE_NON_WORKER_CONTROLS) {
      // the row the record NAMES is the row it CITES.
      expect(b9Row(g.rowId).sourceRef, `${g.rowId} cites its own row`).toBe(g.sourceRef)
      // and every column it claims really draws a control there.
      for (const column of g.columns) {
        expect(frontlineAffordance(b9Row(g.rowId), column).kind, `${g.rowId}.${column}`).toBe(
          'control',
        )
      }
    }
    expect(
      GENUINE_NON_WORKER_CONTROLS_ELSEWHERE.filter((g) => g.module === 'MOD-FL-B9').map(
        (g) => g.sourceRef,
      ),
    ).toEqual(['L41623', 'L41624'])
    // and the acts A1 names for them are these rows' own action text.
    for (const g of GENUINE_NON_WORKER_CONTROLS_ELSEWHERE.filter((x) => x.module === 'MOD-FL-B9')) {
      const row = B9_MATRIX.find((r) => r.sourceRef === g.sourceRef)
      expect(norm(row?.control ?? ''), g.sourceRef).toBe(norm(g.act))
    }
    // The other four of the six, from this end. Six is the whole trap.
    expect(B9_GENUINE_NON_WORKER_CONTROLS_ELSEWHERE).toHaveLength(4)
    expect(
      B9_GENUINE_NON_WORKER_CONTROLS.length + B9_GENUINE_NON_WORKER_CONTROLS_ELSEWHERE.length,
    ).toBe(6)
  })

  // FAILS IF: the module re-spells the overlay instead of reading it. The
  // step-up sheet is MOD-FL-A1's and its own Destination column reads
  // "Overlay on any destination", so it is raised over this destination
  // rather than belonging to it.
  //
  // THE PLANTABLE HALF IS THE LAST ASSERTION AND THAT IS WHY IT IS THERE. The
  // first four read wave 0 and the frozen source, which this task may not
  // edit, so they are a WATCH on a consumed ruling rather than a gate on this
  // module — they go red if wave 0 drifts, and nothing in this module can
  // make them go red. The sweep of the panel file is the gate: it fails if a
  // task writes the overlay's words as a literal here instead of reading
  // them. Planted: the destination-column wording hard-coded into the
  // panel's step-up paragraph. Went red.
  it('points at MOD-FL-A1’s overlay and does not re-spell it', () => {
    expect(FL_OVERLAY_ON_ANY_DESTINATION.id).toBe('SCR-FL-03')
    expect(FL_OVERLAY_ON_ANY_DESTINATION.destinationColumn).toBe('Overlay on any destination')
    const [n] = locatorsOf(FL_OVERLAY_ON_ANY_DESTINATION.sourceRef)
    expect(tableCells(n as number)[2]).toBe('Second-identity step-up sheet')
    expect(tableCells(n as number)[3]).toBe('Overlay on any destination')
    // and this module's own two views are Run Player states, not overlays.
    const mine = FL_PLAYER_VIEWS.filter((v) => v.id === 'SCR-FL-14' || v.id === 'SCR-FL-15')
    expect(mine.map((v) => v.placement)).toEqual(['run-player', 'run-player'])
    for (const v of mine) {
      expect(srcLine(locatorsOf(v.sourceRef)[0] as number)).toContain('`MOD-FL-B9`')
    }
    // COMMENTS STRIPPED FIRST. The panel's doc comment QUOTES the overlay's
    // destination column in order to explain why the module does not own it,
    // and a raw sweep matches that sentence — the shape
    // `tests/coverage/strip-comments.ts` was written for, where prose that
    // names a thing in order to deny it fails a gate on correct code.
    const panel = stripComments(
      readFileSync(
        join(process.cwd(), 'src/frontline/modules/fl-b9/GatesAndSignOffPanel.tsx'),
        'utf8',
      ),
    )
    expect(panel).toContain('FL_OVERLAY_ON_ANY_DESTINATION.destinationColumn')
    expect(panel).not.toContain(`'${FL_OVERLAY_ON_ANY_DESTINATION.destinationColumn}'`)
    expect(panel).not.toContain(`"${FL_OVERLAY_ON_ANY_DESTINATION.destinationColumn}"`)
  })
})

/* ==================================================================== *
 * CHAPTER 4.4 AGAINST CHAPTER 22.18.
 * ==================================================================== */

describe('the gate-override contradiction, disclosed rather than settled', () => {
  // FAILS IF: either reading is not at the line beside it, or one of them is
  // quietly corrected to agree with the other. Planted: the Ch4.4 reading's
  // two `Allowed with conditions` tokens rewritten to `Explicitly
  // prohibited`, which is the reconciliation this disclosure exists to
  // refuse. Went red.
  it('finds both readings, verbatim, at their own lines', () => {
    for (const r of [
      ...CH4_AGAINST_CH22_ON_GATE_OVERRIDE.readings,
      ...CH4_AGAINST_CH22_ON_GATE_OVERRIDE.bearsOnIt,
    ]) {
      const [n] = locatorsOf(r.locator)
      expect(n, `${r.locator} names a line`).toBeDefined()
      expect(norm(srcLine(n as number)).includes(norm(r.text)), r.locator).toBe(true)
    }
    // Ch4.4 grants both roles a permissive token with NO surface qualifier.
    expect(tableCells(2671).slice(1, 6)).toEqual([
      'Override a gate that blocks the worker',
      'Explicitly prohibited',
      'Allowed with conditions',
      'Allowed with conditions',
      'Explicitly prohibited',
    ])
    // Ch22.18 refuses both, qualified on the device.
    expect(tableCells(41619).slice(3, 5)).toEqual([
      '`Explicitly prohibited` on the device',
      '`Explicitly prohibited` on the device',
    ])
  })

  // FAILS IF: EXCL-FL-05 is read as closing the conflict. It excludes a
  // WORKER-INITIATED override and names neither the Supervisor nor the
  // Quality Manager, so it settles one column of five. Planted: the
  // bears-on-it text changed to say the exclusion covers all roles. Went red
  // on the verbatim check above and on the two assertions here.
  it('reads EXCL-FL-05 as worker-initiated, which settles one column and not this', () => {
    expect(srcLine(39488)).toContain('EXCL-FL-05')
    expect(tableCells(39488)[2]).toBe('Worker-initiated gate override')
    expect(tableCells(39488)[5]).toBe('Invariant')
    expect(srcLine(39488)).not.toContain('Supervisor')
    expect(srcLine(39488)).not.toContain('Quality Manager')
    // and this module's own record says so, rather than leaving a reader to
    // infer from the row that the exclusion settles all five columns.
    const entry = CH4_AGAINST_CH22_ON_GATE_OVERRIDE.bearsOnIt.find((b) =>
      b.locator.startsWith('L39488'),
    )
    expect(entry, 'the exclusion is carried as bearing on it').toBeDefined()
    expect(entry?.locator).toContain('worker-initiated')
    expect(entry?.locator).toContain('does not close this')
  })

  // FAILS IF: the contradiction is filed under a decision identifier. There
  // is none: no `DEC-` token appears on Chapter 4.4's matrix or its own
  // conditions paragraph, nor on Chapter 22.18's row. Filing it under a
  // neighbouring identifier that happens to exist is the defect this asserts
  // against. Planted: `decisionRef: 'DEC-GATE-001'` added to the record —
  // typecheck refused it, because `B9Contradiction` has no such field, which
  // is the shape holding the ruling rather than a convention.
  it('carries no decision identifier, because the source attaches none', () => {
    for (let n = 2668; n <= 2680; n += 1) {
      expect(srcLine(n).includes('DEC-'), `L${n} carries no DEC identifier`).toBe(false)
    }
    expect(srcLine(41619).includes('DEC-')).toBe(false)
    expect(CH4_AGAINST_CH22_ON_GATE_OVERRIDE.noDecisionIdentifier).toContain('DEC-*')
    expect(Object.keys(CH4_AGAINST_CH22_ON_GATE_OVERRIDE)).not.toContain('decisionRef')
  })
})

/* ==================================================================== *
 * THE GATE IS LOCAL, AND ITS ARITY IS THE RULING.
 * ==================================================================== */

describe('the gate does not depend on connectivity', () => {
  // FAILS IF: a connectivity parameter is added to the gate evaluation.
  // Planted: a third `online = true` parameter. A DEFAULTED parameter does
  // not count towards `Function.length`, so the arity assertion alone passed
  // it — which is wave 1's own recorded failure and is why the function's
  // text is read as well. Went red on the text.
  it('gives the gate evaluation no connectivity parameter at all', () => {
    const src = gateEvaluation.toString()
    const params = src.slice(src.indexOf('(') + 1, src.indexOf(')'))
    expect(params.split(',').filter((p) => p.trim().length > 0)).toHaveLength(2)
    expect(params).not.toMatch(/online|offline|connect|network|navigator|sync/i)
    expect(src).not.toMatch(/\b(online|offline|navigator|connectivity|isConnected)\b/i)
    expect(gateEvaluation.length).toBe(2)
    expect(norm(srcLine(41652))).toContain(norm(GATE_IS_IDENTICAL_OFFLINE.text))
    expect(SAFETY_LAYER.kind).toBe('safety-layer')
    expect(SAFETY_LAYER.degradedOffline).toBe(false)
  })

  // FAILS IF: the lenient posture starts blocking, or the strict posture
  // stops parking. AC-B9-2 (L41747) is the criterion. Planted: the lenient
  // branch given `parks: 'STATE-B9-PARKED'`, which would tell a worker their
  // Run was set aside under a posture that does not block. Went red.
  it('blocks and parks under strict, notifies without blocking under lenient', () => {
    expect(gateEvaluation(true, 'strict').state).toBe('STATE-B9-PASSED')
    expect(gateEvaluation(true, 'lenient').state).toBe('STATE-B9-PASSED')
    expect(gateEvaluation(true, 'strict').parks).toBeNull()

    const strict = gateEvaluation(false, 'strict')
    expect(strict.state).toBe('STATE-B9-BLOCKED')
    expect(strict.parks).toBe('STATE-B9-PARKED')

    const lenient = gateEvaluation(false, 'lenient')
    expect(lenient.state).toBe('STATE-B9-NOTIFIED')
    expect(lenient.parks).toBeNull()

    expect(srcLine(41747).includes('AC-B9-2')).toBe(true)
    expect(norm(srcLine(41747))).toContain(
      norm(
        'The strict posture is the platform default, and the lenient posture records and surfaces the lapse rather than hiding it.',
      ),
    )
    // the strict posture is the platform default, in the cell's own words.
    expect(srcLine(41618)).toContain('under the strict posture, which is the platform default')
  })

  // FAILS IF: an already-expired clearance is applied, or a rejection is
  // returned without a stated reason. L41654 asks for a typed reason rather
  // than a bare failure. Planted: the expired branch returning
  // `applied: true` with STATE-B9-CLEARED. Went red on both.
  it('rejects an already-expired clearance with a typed reason, and keeps the Run parked', () => {
    const expired = clearanceApplication({ alreadyExpiredOnArrival: true })
    expect(expired.applied).toBe(false)
    expect(expired.state).toBe('STATE-B9-CLEARANCEEXPIRED')
    expect(expired.reason).toContain('Run stays parked')
    const applied = clearanceApplication({ alreadyExpiredOnArrival: false })
    expect(applied.applied).toBe(true)
    expect(applied.state).toBe('STATE-B9-CLEARED')
    expect(norm(srcLine(41654))).toContain(
      norm(
        'A clearance that has already expired by the time it arrives is rejected with a typed reason rather than applied.',
      ),
    )
    expect(srcLine(41766).includes('TEST-B9-8')).toBe(true)
  })

  // FAILS IF: this module mints a sixth command class, or forgets that the
  // device is the clearance's recipient rather than its origin. Both are read
  // from wave 0's settled channel. Planted: B9_CLEARANCE_COMMAND replaced
  // with a locally written object. Went red — the assertion is the identity
  // of wave 0's row, not the shape of a copy.
  it('reads CMD-FL-CLEAR from the settled command channel and applies rather than originates', () => {
    expect(B9_CLEARANCE_COMMAND?.id).toBe('CMD-FL-CLEAR')
    expect(B9_CLEARANCE_COMMAND?.origin).toBe('Client Command Center, action 10')
    expect(B9_CLEARANCE_COMMAND?.authority).toBe('Supervisor and above')
    const [n] = locatorsOf(B9_CLEARANCE_COMMAND?.sourceRef ?? '')
    // The identifier is the table's SECOND column, not its first: the header
    // at L39660 reads Command class, Identifier, Origin, Authority, Effect on
    // the device. Reading column 1 gets the human name and silently passes a
    // row that names a different class.
    expect(tableCells(39660).slice(1, 7)).toEqual([
      'Command class',
      'Identifier',
      'Origin',
      'Authority',
      'Effect on the device',
      '',
    ])
    expect(tableCells(n as number)[2]).toBe('`CMD-FL-CLEAR`')
    expect(tableCells(n as number)[1]).toBe(B9_CLEARANCE_COMMAND?.name)
    expect(CLEARANCE_IS_EFFECTIVE_WHEN_APPLIED).toBe(true)
  })
})

/* ==================================================================== *
 * THE SIGN-OFF, AND WHY IT IS NOT ROUTED THROUGH THE SHARED EVALUATOR.
 * ==================================================================== */

describe('the sign-off and the forced sync', () => {
  // FAILS IF: an offline sign-off is presented as anything other than not
  // proceeding. TEST-B9-7 (L41765) asks for a test asserting the forced sync
  // blocks it and NO PARTIAL SIGN-OFF RECORD IS CREATED. Planted: the offline
  // line changed to "Held until this tablet reconnects", which is the queued
  // reading. Went red on `proceeds` and on the queue words.
  it('does not proceed offline, and never says the sign-off was queued or held', () => {
    const offline = signOffReadiness(false)
    expect(offline.proceeds).toBe(false)
    expect(offline.line).toMatch(/does not proceed/i)
    expect(offline.line).not.toMatch(/\b(queued|queue|held|pending|will be recorded)\b/i)
    expect(signOffReadiness(true).proceeds).toBe(true)
    expect(norm(srcLine(41706))).toContain(norm('Online: completes. Offline: blocks the sign-off.'))
    expect(norm(srcLine(41652))).toContain(
      norm('A sign-off requiring a forced sync does not proceed.'),
    )
    expect(srcLine(41765).includes('TEST-B9-7')).toBe(true)
    expect(norm(srcLine(41765))).toContain(norm('no partial sign-off record is created'))
  })

  // FAILS IF: `evaluateFrontlineAccess` decides a forced-sync act from the
  // connectivity branches instead of before them.
  //
  // THIS GATE COULD NOT FAIL WHEN IT WAS FIRST WRITTEN, AND THAT IS WHY IT
  // READS THE WAY IT DOES NOW. Its first version located the string
  // `req.forcesSyncFirst === true` and asserted it appeared BEFORE the
  // `// OFFLINE, AND PERMITTED` comment. That was true of the defect — the
  // check sat inside `if (ctx.online) { … }`, which is itself above the
  // offline block — and it stayed true of the repair, which lifted the check
  // above `if (ctx.online)` entirely. One assertion, both arrangements,
  // no signal. The module reported the defect correctly and then pinned a
  // property that could not distinguish it from its own fix.
  //
  // WHAT IT ASSERTS NOW is the thing the source actually requires: the
  // forced-sync question is answered BEFORE connectivity is consulted, so
  // both connectivity states reach it. L40224 — "Step-up for a forced-sync
  // action does not proceed offline"; L40307 — "the sign-off does not
  // proceed on stale cache; the step waits"; `TEST-B9-7` (L41765) — no
  // partial sign-off record is created, and a queued sign-off is one.
  //
  // Planted twice against the repaired file: the check moved back inside the
  // online branch (red on the ordering), and the offline arm's
  // `allowedWithConditions` swapped for a fall-through to the queue (red on
  // the behavioural assertions below). Restored after each.
  it('answers the forced-sync question before it consults connectivity', () => {
    const access = readFileSync(join(process.cwd(), 'src/frontline/access.ts'), 'utf8')
    const forcesSync = access.indexOf('req.forcesSyncFirst === true')
    const connectivity = access.indexOf('if (ctx.online)')
    const offlineComment = access.indexOf('// OFFLINE, AND PERMITTED')
    expect(forcesSync).toBeGreaterThan(0)
    expect(connectivity).toBeGreaterThan(0)
    expect(offlineComment).toBeGreaterThan(0)
    // The ordering the first version could not see: BEFORE the connectivity
    // branch, not merely before the offline block inside it.
    expect(forcesSync).toBeLessThan(connectivity)
    expect(access.slice(offlineComment)).not.toContain('forcesSyncFirst')

    // The BEHAVIOURAL half of this check lives in `tests/unit/fl-access.test.ts`,
    // beside the evaluator it tests, because that suite already builds the
    // scenario and identity fixtures the context needs. Importing them here to
    // re-answer the same question would be a second spelling of one gate. This
    // file keeps the ordering, which is what this module depends on.
    // The finding is still recorded, and it now describes a CLOSED defect. This
    // assertion asked only that a row mentioning `queuedOffline` exist, which
    // meant it pinned the wording in place: after the controller fixed the
    // evaluator, the module went on rendering "returns queuedOffline" as a live
    // finding and this gate REQUIRED it to. An independent review found it.
    //
    // So it now asserts the row exists AND that it reads as an account rather
    // than a live report — the two together are what stop it going stale in
    // either direction.
    const finding = B9_SOURCE_FINDINGS.find((f) => f.what.includes('queuedOffline'))
    expect(finding, 'the finding is recorded').toBeDefined()
    expect(finding?.notClosedBecause ?? '', 'the finding reads as closed').toMatch(
      /^IT IS CLOSED\./,
    )
    expect(finding?.what ?? '', 'the finding is written in the past tense').toContain('fixed by')
  })
})

/* ==================================================================== *
 * THE CARD AND THE STATES.
 * ==================================================================== */

describe('the module card, transcribed', () => {
  // FAILS IF: a card field cites a line it is not on, or was paraphrased.
  // Planted: the Purpose field's locator moved one line forward, onto the
  // blank line that follows it — the off-by-one class. Went red. Planted
  // second: "with no worker
  // override" softened to "with limited override" and the locator left
  // correct. Went red on the sentence rather than the line, which is the half
  // a locator check alone would miss.
  it('finds every card field’s sentences in the line it cites', () => {
    expect(B9_CARD).toHaveLength(18)
    expect(B9_IDENTITY_CARD.map((s) => s.sourceRef)).toEqual([
      'L41604',
      'L41606',
      'L41608',
      'L41610',
      'L41612',
    ])
    let checked = 0
    for (const s of B9_CARD) {
      const [n] = locatorsOf(s.sourceRef)
      expect(n, `${s.field} names a line`).toBeDefined()
      const line = norm(srcLine(n as number))
      const sentences = checkableSentences(s.text)
      expect(sentences.length, `${s.field} has a checkable sentence`).toBeGreaterThan(0)
      for (const sentence of sentences) {
        expect(line.includes(norm(sentence)), `${s.field}: ${sentence.slice(0, 48)}`).toBe(true)
        checked += 1
      }
    }
    expect(checked).toBeGreaterThan(40)
    // the identifier field names both halves of L41604's own two labels.
    expect(srcLine(41604)).toContain('`MOD-FL-B9`')
    expect(srcLine(41604)).toContain('Gates and Sign-Off Authority')
  })

  // FAILS IF: a classification is asserted for a field whose card carries
  // none. Fourteen of the eighteen carry no bracketed marker. Planted: the Audit
  // field given `sourceClass: 'SoW Fact'`. Went red — L41676 has no marker.
  it('claims a source classification only where the card states one', () => {
    for (const s of B9_CARD) {
      const [n] = locatorsOf(s.sourceRef)
      const hasMarker = /\[(SoW Fact|Derived Clarification|Client Decision Required)/.test(
        srcLine(n as number),
      )
      expect(s.sourceClass !== null, `${s.field} marker at L${n}`).toBe(hasMarker)
      if (s.sourceClass !== null) {
        expect(norm(srcLine(n as number)), s.field).toContain(norm(s.sourceClass))
      }
    }
    expect(B9_CARD.filter((s) => s.sourceClass === null)).toHaveLength(14)
  })

  // FAILS IF: a state identifier is not at L41636, or a gloss is invented for
  // one of the seven the source leaves bare. Planted twice:
  // STATE-B9-CLEARANCEEXPIRED renamed STATE-B9-CLEARANCE-EXPIRED, and
  // STATE-B9-PARKED given a written-here gloss. Both went red.
  it('finds all eight state identifiers and the one gloss at L41636', () => {
    const line = srcLine(41636)
    expect(B9_STATES).toHaveLength(8)
    for (const s of B9_STATES) {
      expect(line.includes(s.id), `${s.id} at L41636`).toBe(true)
      if (s.gloss !== null) expect(norm(line)).toContain(norm(`${s.id}\` ${s.gloss}`))
    }
    expect(B9_STATES.filter((s) => s.gloss !== null).map((s) => s.id)).toEqual([
      'STATE-B9-NOTIFIED',
    ])
    // and the source really names eight and no more on that line.
    expect(line.match(/STATE-B9-[A-Z]+/g)).toHaveLength(8)
    expect(B9_STATES_SOURCE_REF).toBe('L41636')
  })

  // FAILS IF: the storyboard's own strings are paraphrased, or its single
  // control grows a sibling. SB-FL-018 is explicit that there is no code
  // field, no "proceed anyway" and no supervisor password box on the worker's
  // path. Planted: the control re-worded to "Go to my other runs" without the
  // full stop. Went red.
  it('renders SB-FL-018’s own words and its one control, from L41736', () => {
    const line = norm(srcLine(41736))
    for (const [key, text] of Object.entries(SB_FL_018)) {
      if (key === 'id' || key === 'sourceRef') continue
      expect(line.includes(norm(text)), `SB-FL-018.${key}`).toBe(true)
    }
    expect(srcLine(41736)).toContain('SB-FL-018')
    expect(SB_FL_018.control).toBe('Go to my other runs.')
  })
})

/* ==================================================================== *
 * THE THIRTEEN FUNCTIONALITIES AND THE FALLBACK OBLIGATION.
 * ==================================================================== */

describe('the functionalities, and AC-FL-011-1', () => {
  // FAILS IF: the module's functionality list and the source's disagree.
  // Counted off the source between the Features heading and the Mermaid
  // block, not off the brief. Planted: FUNC-B9-01-3-3 deleted from the list.
  // Went red at 12 against 13.
  it('carries every FUNC-B9-* the source states, and no other', () => {
    const fromSource = new Set<string>()
    for (let n = 41688; n <= 41712; n += 1) {
      for (const m of srcLine(n).matchAll(/FUNC-B9-[0-9-]+/g)) fromSource.add(m[0])
    }
    expect(fromSource.size).toBe(13)
    expect(B9_FUNCTIONALITIES).toHaveLength(13)
    expect(new Set(B9_FUNCTIONALITIES.map((f) => f.id))).toEqual(fromSource)
  })

  // FAILS IF: a functionality's words are not at the line it cites.
  // Statement, roles-allowed clause, connectivity clause and fallback clause
  // are four separate claims about the same line. Planted: FUNC-B9-01-3-1's
  // connectivity clause changed to "Online and offline: identical", which is
  // the opposite of what a clearance does. Went red.
  it('finds each functionality’s four clauses at its own line', () => {
    for (const f of B9_FUNCTIONALITIES) {
      const [n] = locatorsOf(f.sourceRef)
      const raw = srcLine(n as number)
      expect(raw.includes(f.id), `${f.id} is at L${n}`).toBe(true)
      const line = norm(raw)
      expect(line.includes(norm(f.statement)), `${f.id} statement`).toBe(true)
      expect(line.includes(norm(f.rolesAllowed)), `${f.id} roles allowed`).toBe(true)
      expect(line.includes(norm(f.connectivity)), `${f.id} connectivity`).toBe(true)
      expect(line.includes(norm(f.fallbackClause)), `${f.id} fallback clause`).toBe(true)
    }
  })

  // FAILS IF: a fallback pattern is assigned to a functionality that does not
  // name it, which is how a gap gets papered over. Planted: FB-FL-CMD-01
  // added to FUNC-B9-01-2-2. Went red at L41693, and the gap gate below went
  // red at the same time.
  it('assigns a pattern only where the functionality’s own line names it', () => {
    for (const f of B9_FUNCTIONALITIES) {
      const [n] = locatorsOf(f.sourceRef)
      for (const p of f.patterns) {
        expect(srcLine(n as number).includes(p), `${f.id} names ${p}`).toBe(true)
      }
    }
  })

  // FAILS IF: the AC-FL-011-1 gap is closed by invention rather than
  // reported. One of the thirteen names no pattern and the source states the
  // ground in the clause before it. Planted: the finding "fixed" by giving
  // FUNC-B9-01-2-2 FB-FL-CMD-01. Went red.
  it('reports the one functionality that names no FB-FL-* pattern', () => {
    expect(functionalitiesNamingNoPattern(B9_FUNCTIONALITIES)).toEqual(['FUNC-B9-01-2-2'])
    expect(B9_FUNCTIONALITIES_NAMING_NO_PATTERN).toEqual(['FUNC-B9-01-2-2'])
    const gap = B9_FUNCTIONALITIES.find((f) => f.id === 'FUNC-B9-01-2-2')
    expect(gap?.fallbackClause).toBe('Fallback: Not applicable — same reason.')
    expect(norm(srcLine(41693))).toContain(norm(gap?.fallbackClause ?? ''))
    expect(srcLine(41693)).not.toMatch(/FB-FL-[A-Z0-9]+-\d+/)
    // its neighbour proves the source supplies a pattern where it has one to
    // supply, from the same construction, so this is the source's gap and not
    // a transcription slip.
    expect(srcLine(41692)).toContain('FB-FL-GATE-01')
    expect(srcLine(40151).includes('AC-FL-011-1')).toBe(true)
    expect(norm(srcLine(40151))).toContain(
      norm('Every functionality in this chapter names at least one'),
    )
  })

  // FAILS IF: the three readings of this module's fallback set are silently
  // reconciled. This is the first module MEASURED SO FAR where two of the
  // three agree, which is exactly when a reader stops looking at the third.
  // MOD-FL-A4 is unrecorded — it ships no comparison — so "first" here means
  // first of the four that carry one.
  // Planted: FB-FL-PKG-01 removed from FUNC-B9-01-3-3's patterns so all three
  // readings agreed at three. Went red on the derived list.
  it('keeps the three divergent readings of its fallback set apart', () => {
    expect(B9_MAPPED_PATTERNS.map((p) => p.id).sort()).toEqual([
      'FB-FL-AUTH-01',
      'FB-FL-CMD-01',
      'FB-FL-GATE-01',
    ])
    expect([...B9_PATTERNS_NAMED_BY_FUNCTIONALITIES].sort()).toEqual([
      'FB-FL-AUTH-01',
      'FB-FL-CMD-01',
      'FB-FL-GATE-01',
      'FB-FL-PKG-01',
    ])
    expect([...B9_PATTERN_DIVERGENCE.fromTheCardsFallbackLine].sort()).toEqual([
      'FB-FL-AUTH-01',
      'FB-FL-CMD-01',
      'FB-FL-GATE-01',
    ])
    // the card's own Fallback identifier line names its three, and the map's
    // FB-FL-PKG-01 row does not carry this module.
    for (const p of B9_PATTERN_DIVERGENCE.fromTheCardsFallbackLine) {
      expect(srcLine(41680), `card names ${p}`).toContain(p)
    }
    expect(srcLine(41680)).not.toContain('FB-FL-PKG-01')
    expect(srcLine(41697)).toContain('FB-FL-PKG-01')
    expect(srcLine(40132)).toContain('FB-FL-PKG-01')
    expect(srcLine(40132)).not.toContain('MOD-FL-B9')
    for (const n of [40131, 40135, 40137]) {
      expect(srcLine(n), `map row L${n}`).toContain('MOD-FL-B9')
    }
  })
})

/* ==================================================================== *
 * THE ACCEPTANCE CRITERIA.
 * ==================================================================== */

describe('the acceptance criteria', () => {
  // FAILS IF: an AC is transcribed from the wrong row. Eight criteria over
  // eight consecutive lines, each anchored on its own identifier. Planted:
  // AC-B9-6 given AC-B9-7's text — the shape a transcription takes when a
  // reader's eye drops a row. Went red.
  it('finds all eight at their own lines', () => {
    expect(B9_ACCEPTANCE_CRITERIA).toHaveLength(8)
    expect(B9_ACCEPTANCE_CRITERIA.map((a) => locatorsOf(a.sourceRef)[0])).toEqual([
      41746, 41747, 41748, 41749, 41750, 41751, 41752, 41753,
    ])
    for (const ac of B9_ACCEPTANCE_CRITERIA) {
      const [n] = locatorsOf(ac.sourceRef)
      const raw = srcLine(n as number)
      expect(raw.includes(ac.id), `${ac.id} at L${n}`).toBe(true)
      expect(norm(raw).includes(norm(ac.text)), `${ac.id} text`).toBe(true)
    }
  })
})

/* ==================================================================== *
 * THE THREE DISCLOSURES, AND THE DECISION THAT IS NOT THIS MODULE'S.
 * ==================================================================== */

describe('the open decisions', () => {
  // FAILS IF: a disclosed reading is not at the locator beside it. This is
  // the disclosure's whole contract — every reading carries its own line.
  // Planted: DEC-PARK-001's second reading pointed one line earlier than the
  // line that carries it. Went red.
  //
  // The line numbers of the planted defects are deliberately NOT spelled
  // here. `tests/coverage/locator-fidelity.test.ts` lexes every L-number in
  // this tree as a citation and cannot tell a citation from an example of a
  // wrong one, so writing them would file knowingly-false citations against
  // this file to describe a test.
  it('finds every reading at its own locator, with its identifier there', () => {
    expect(B9_DISCLOSURES.map((d) => d.decisionRef)).toEqual([
      'DEC-PLUS-001',
      'DEC-SUBAUTH-001',
      'DEC-PARK-001',
    ])
    for (const d of B9_DISCLOSURES) {
      expect(d.readings.length, d.decisionRef).toBeGreaterThanOrEqual(2)
      for (const r of d.readings) {
        const [n] = locatorsOf(r.locator)
        const raw = srcLine(n as number)
        const anchor = anchorOf(r.locator)
        if (anchor !== null) expect(raw.includes(anchor), `${r.locator} anchor`).toBe(true)
        expect(norm(raw).includes(norm(r.text)), `${d.decisionRef}: ${r.text.slice(0, 48)}`).toBe(
          true,
        )
      }
      // every disclosure names at least one line that carries its own identifier
      const carriesId = d.readings.some((r) =>
        srcLine(locatorsOf(r.locator)[0] as number).includes(d.decisionRef),
      )
      expect(carriesId, `${d.decisionRef} appears in the source`).toBe(true)
    }
  })

  // FAILS IF: a decision is filed under an identifier the canon already
  // holds, or the canon grows a record for one of these three and this module
  // goes on disclosing it locally. THE STAND-IN IS BUILT TO EXPIRE. It reads
  // the union out of the canon file rather than trusting a comment about it.
  // Planted: DEC-PARK-001 re-filed as 'DEC-CAP-001', which the canon does
  // hold. Went red. The canon file itself was NOT edited to plant the other
  // direction — it is another task's path and a concurrent agent's tree.
  it('discloses locally only because the shared canon has no record for these', () => {
    const canon = readFileSync(join(process.cwd(), 'src/disclosure/decisions.ts'), 'utf8')
    const block = canon.match(/export type DecisionId =([\s\S]*?)\n\n/)
    expect(block).not.toBeNull()
    const members = [...(block?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1])
    expect(members.length).toBeGreaterThan(20)
    for (const d of B9_DISCLOSURES) {
      expect(members, `${d.decisionRef} is absent from the canon`).not.toContain(d.decisionRef)
      expect(d.canonNote).toContain('DecisionId')
    }
  })

  // FAILS IF: DEC-GATE-001 is disclosed on this screen. The dispatch assigned
  // it to this module and named four locators; all four are real DEC-GATE-001
  // occurrences and NONE is in section 22.18. It is action-agent gating — the
  // Prevention Agent's governance binding — and shares a word with a
  // qualification gate and nothing else. Planted: a fourth disclosure added
  // for it. Went red on the identifier sweep below.
  it('does not disclose DEC-GATE-001, which occurs nowhere in section 22.18', () => {
    for (let n = 41598; n <= 41771; n += 1) {
      expect(srcLine(n).includes('DEC-GATE-001'), `L${n}`).toBe(false)
    }
    expect(B9_DISCLOSURES.map((d) => d.decisionRef)).not.toContain('DEC-GATE-001')
    // the four locators the dispatch gave are real, and each names an agent
    // rather than a qualification gate.
    for (const n of [40952, 41072, 41502, 41596]) {
      expect(srcLine(n).includes('DEC-GATE-001'), `L${n} carries it`).toBe(true)
      expect(srcLine(n)).toMatch(/Prevention Agent/)
    }
    const finding = B9_SOURCE_FINDINGS.find((f) => f.what.includes('DEC-GATE-001'))
    expect(finding, 'the misassignment is reported').toBeDefined()
  })
})

/* ==================================================================== *
 * CATEGORICAL ABSENCES.
 * ==================================================================== */

describe('what nothing in this module may contain', () => {
  // FAILS IF: a pace figure, a timing widget, a countdown or a ranking
  // reaches this module's rendered text. AC-FL-000-5 (L39100),
  // TEST-FL-000-3 (L39108), AC-SCR-FL-002 (L48690), AC-SCOPE-045 (L2683).
  //
  // ONE STRING IS ALLOWED AND IT IS NAMED, NOT EXEMPTED. DEC-PARK-001's third
  // candidate behaviour is the source's own proposal and contains the word;
  // quoting a proposed escalation inside a disclosure is not a display. It is
  // permitted by NAME and asserted verbatim against L41682, so a defect
  // cannot hide behind the allowance: any other occurrence anywhere fails,
  // and altering that one string fails the verbatim check.
  //
  // Planted three times, because pluralisation is how this gate dies:
  // "countdown" in the storyboard's parked line, "timer" in a card field, and
  // "timers" in an acceptance criterion. All three went red naming the field
  // — the third is the one a `\btimer\b` pattern would have passed.
  it('carries no pace, timing, countdown or ranking word in any rendered string', () => {
    const FORBIDDEN = /\b(pace|timers?|countdowns?|rankings?|leaderboards?|productivity)\b/i
    const ALLOWED_WHERE = 'DEC-PARK-001 reading L41682 · Client Decision Required — DEC-PARK-001'
    const strings = renderedStrings()
    expect(strings.length).toBeGreaterThan(120)
    const offenders = strings.filter((s) => FORBIDDEN.test(s.text) && s.where !== ALLOWED_WHERE)
    expect(offenders.map((o) => `${o.where}: ${o.text.slice(0, 60)}`)).toEqual([])
    // the one allowed string exists, is the source's own words, and is at the
    // line it cites. Without this the allowance would be a hole.
    const allowed = strings.find((s) => s.where === ALLOWED_WHERE)
    expect(allowed, 'the allowed string is present').toBeDefined()
    expect(FORBIDDEN.test(allowed?.text ?? '')).toBe(true)
    expect(norm(srcLine(41682))).toContain(norm(allowed?.text ?? ''))
  })

  // FAILS IF: the word "synced" is written as a state anywhere in this
  // module. L39622 says there is no such state and no bare success. Planted:
  // the applied-clearance reason changed to "Synced and applied." Went red.
  it('never writes synced as a state', () => {
    for (const s of renderedStrings()) {
      expect(s.text, s.where).not.toMatch(/\bsynced\b/i)
    }
    expect(norm(srcLine(39622))).toContain(norm('there is no single state called "synced"'))
  })

  // FAILS IF: the build plan's rigour grade reaches the module. The dispatch
  // grades this module C1; the frozen source's own module-inventory column is
  // Band (header L39844) and this module's row (L39854) reads B. Neither is
  // rendered as a product fact. Planted: `grade: 'C1'` added to the card and
  // rendered. Went red.
  it('transcribes no build-plan grade, and states the source’s own band nowhere', () => {
    for (const s of renderedStrings()) {
      expect(s.text, s.where).not.toMatch(/\b(C1|C2)\b/)
    }
    // the source's own column, so the claim about it is checked rather than asserted.
    expect(tableCells(39844).slice(1, 5)).toEqual([
      'Identifier',
      'Module',
      'Band',
      'One-line scope',
    ])
    expect(tableCells(39854)[1]).toBe('`MOD-FL-B9`')
    expect(tableCells(39854)[3]).toBe('B')
  })
})

/* ==================================================================== *
 * THE COLUMN TYPE.
 * ==================================================================== */

describe('the five persona columns', () => {
  // FAILS IF: a column becomes a private twelfth spelling of the platform's
  // five tenant roles. They are an `Extract` from `RoleId`, so a rename over
  // there fails to compile here rather than splitting the vocabulary.
  // Planted: 'READONLY_AUDITOR' replaced with 'AUDITOR'. Typecheck refused
  // it, and this went red on the heading map.
  it('are five members of the platform role union, in the header’s order', () => {
    const columns: readonly B9Column[] = B9_COLUMNS
    expect(columns).toHaveLength(5)
    expect(Object.keys(B9_COLUMN_HEADINGS)).toEqual([...B9_COLUMNS])
    expect(B9_COLUMNS.map((c) => B9_COLUMN_HEADINGS[c])).toEqual([
      'Worker',
      'Supervisor',
      'Quality Manager',
      'Tenant Admin',
      'Read-only Auditor',
    ])
  })
})
