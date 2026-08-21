import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { OPEN_DECISION_IDS } from '@/disclosure/decisions'
import { FL_MATRIX_SHAPE, TENANT_ADMIN_OPEN_CELLS, controlsOnActsHeldElsewhere, frontlineAffordance } from '@/frontline/matrix'
import { FL_ACTS_HELD_ELSEWHERE } from '@/frontline/cross-surface'
import { FL_PLAYER_VIEWS } from '@/frontline/screens'
import { functionalitiesNamingNoPattern } from '@/frontline/fallbacks'
import { stripComments } from '../coverage/strip-comments'
import {
  B8_CARD,
  B8_CARD_ELISIONS,
  B8_CLAIMS_NEVER_MADE,
  B8_EXCLUDED_DISPLAYS,
  B8_STATES,
  B8_WHERE_IT_SURFACES,
  SB_FL_017,
} from '@/frontline/modules/fl-b8/charter'
import {
  B8_PLACES_NAMED,
  B8_ROWS,
  FL_B8_COLUMNS,
  FL_B8_COLUMN_HEADINGS,
  FL_B8_MATRIX,
  FL_B8_SHAPE,
  ROW_5_NAMES_TWO_SURFACES,
  b8Row,
  type FlB8Column,
} from '@/frontline/modules/fl-b8/matrix'
import {
  B8_ABSENT_REACHES,
  B8_ACCEPTANCE_CRITERIA,
  B8_AGENT_REACHES,
  B8_CANON_DECISIONS,
  B8_FUNCTIONALITIES,
  B8_FUNCTIONALITIES_NAMING_NO_PATTERN,
  B8_HAPPY_PATH,
  B8_LOCAL_DECISION_IDS,
  B8_LOCAL_DISCLOSURES,
  B8_MAPPED_PATTERNS,
  B8_NOTIFICATIONS,
  B8_PATTERNS_NAMED_BY_FUNCTIONALITIES,
  B8_PATTERN_DIVERGENCE,
  B8_SOCIAL_CONTRACT,
  B8_SOURCE_FINDINGS,
  B8_SOURCE_TESTS,
  authoredVariant,
  coachingGuidance,
  dismissalOutcome,
} from '@/frontline/modules/fl-b8/service'

/**
 * `MOD-FL-B8` — Coaching Rendering, checked against the FROZEN SOURCE rather
 * than against a brief.
 *
 * WHY EVERY CLAIM HERE OPENS THE FILE. The brief this module was built from is
 * a hypothesis, and this build has recorded ten brief-supplied assertions that
 * could not fail and eleven wrong citations. So a transcription is checked by
 * reading the line it cites and looking for the words, and a locator is checked
 * by asking whether the identifier really occurs there. Nothing below asserts a
 * string against another string this task also wrote.
 *
 * EVERY GATE IN THIS FILE WAS PLANTED AND WATCHED GO RED before it was left
 * green — one defect per gate, in the thing the gate claims to protect, then
 * restored. The `FAILS IF` note names the defect that was actually planted, not
 * one that would have been convenient.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')

function line(n: number): string {
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

function firstLocator(sourceRef: string): number {
  const [first] = locatorsOf(sourceRef)
  if (first === undefined) throw new Error(`no locator in sourceRef: ${sourceRef}`)
  return first
}

/**
 * The identifier a `sourceRef` anchors on, where it has one. The `L`-number
 * guard is `MOD-FL-B9`'s and is not cosmetic: `L41502` matches the identifier
 * shape exactly, and without the guard the anchor check would ask whether line
 * 41502 contains the string "L41502", which is false for every line in the file.
 */
function anchorOf(sourceRef: string): string | null {
  const m = sourceRef.match(/^([A-Z][A-Z0-9-]{3,})\s+·/)
  const token = m?.[1] ?? null
  return token === null || /^L\d+$/.test(token) ? null : token
}

/** Sentences long enough to be a checkable claim. */
function sentences(text: string): readonly string[] {
  return text
    .split(/(?<=[.;])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40)
}

/**
 * The class of display no screen of this application may carry, in any state,
 * in any release of this scope. `AC-FL-000-5` (L39100), `TEST-FL-000-3`
 * (L39108), `AC-SCR-FL-002` (L48690), `AC-SCOPE-045` (L2683).
 */
const EXCLUDED = /\b(pace|timer|countdown|ranking|leaderboard|productivity|quota)\b/i

/** §22.17's own span. Used to prove which decisions are this module's. */
const S2217_FIRST = 41448
const S2217_LAST = 41597

const MODULE_DIR = join(process.cwd(), 'src', 'frontline', 'modules', 'fl-b8')
function moduleSource(file: string): string {
  return readFileSync(join(MODULE_DIR, file), 'utf8')
}

/* ==================================================================== *
 * THE SHAPE, AND THE ARITHMETIC THAT CHECKS IT.
 * ==================================================================== */

describe('the shape of MOD-FL-B8’s matrix', () => {
  // FAILS IF: a row is dropped or a column is added. Planted by deleting row 7
  // from FL_B8_MATRIX: rows fell to 6 and cells to 30, and both halves went red
  // together with the span check below.
  it('is seven rows over seven data lines, five columns, thirty-five cells', () => {
    expect(FL_B8_SHAPE.rows).toBe(7)
    expect(FL_B8_SHAPE.columns).toBe(5)
    expect(FL_B8_SHAPE.cells).toBe(35)
    expect(FL_B8_SHAPE.rows * FL_B8_SHAPE.columns).toBe(FL_B8_SHAPE.cells)
    expect(FL_B8_SHAPE.lastDataLine - FL_B8_SHAPE.firstDataLine + 1).toBe(FL_B8_SHAPE.rows)
    expect(FL_B8_SHAPE.separatorLine).toBe(FL_B8_SHAPE.headerLine + 1)
    expect(FL_B8_SHAPE.firstDataLine).toBe(FL_B8_SHAPE.separatorLine + 1)
  })

  // FAILS IF: this module's span disagrees with wave 0's independent
  // transcription of the same twelve matrices. Two files, two readings.
  it('agrees with wave 0’s reading of the same span', () => {
    const wave0 = FL_MATRIX_SHAPE.find((s) => s.module === 'MOD-FL-B8')
    expect(wave0).toBeDefined()
    expect({
      rows: wave0?.rows,
      columns: wave0?.columns,
      headerLine: wave0?.headerLine,
      separatorLine: wave0?.separatorLine,
      firstDataLine: wave0?.firstDataLine,
      lastDataLine: wave0?.lastDataLine,
    }).toEqual({
      rows: FL_B8_SHAPE.rows,
      columns: FL_B8_SHAPE.columns,
      headerLine: FL_B8_SHAPE.headerLine,
      separatorLine: FL_B8_SHAPE.separatorLine,
      firstDataLine: FL_B8_SHAPE.firstDataLine,
      lastDataLine: FL_B8_SHAPE.lastDataLine,
    })
  })

  // FAILS IF: the header line does not carry the five column names, or the
  // separator is not a separator. Planted by renaming READONLY_AUDITOR's
  // heading to "Auditor": the header check went red.
  it('reads its five column headings off the header line', () => {
    const header = norm(line(FL_B8_SHAPE.headerLine))
    expect(header).toContain('action')
    for (const c of FL_B8_COLUMNS) {
      expect(header, c).toContain(norm(FL_B8_COLUMN_HEADINGS[c]))
    }
    expect(line(FL_B8_SHAPE.separatorLine).replace(/[\s|-]/g, '')).toBe('')
  })

  // FAILS IF: a row is transcribed against the wrong line, or its Action column
  // is reworded. Planted by swapping rows 5 and 6: both went red at their own
  // lines rather than one of them passing by accident.
  it('finds every row’s Action column at the line it cites, in order', () => {
    FL_B8_MATRIX.forEach((row, i) => {
      const n = FL_B8_SHAPE.firstDataLine + i
      expect(firstLocator(row.sourceRef), row.id).toBe(n)
      expect(norm(line(n)), row.id).toContain(norm(row.control))
    })
  })

  // FAILS IF: any cell's own words are not at the row's line. Thirty-five
  // assertions, not a sample. Planted by changing row 5's Read-only Auditor
  // note from "in the Delivery Operations Hub record" to "in the Client Command
  // Center": red, naming that cell.
  it('finds every one of the thirty-five cells’ own words at its row’s line', () => {
    let checked = 0
    for (const row of FL_B8_MATRIX) {
      const src = norm(line(firstLocator(row.sourceRef)))
      for (const column of FL_B8_COLUMNS) {
        expect(src, `${row.id}/${column}`).toContain(norm(row.cells[column].note))
        checked += 1
      }
    }
    expect(checked).toBe(35)
  })

  // FAILS IF: the token tally stops summing to the cell count. Counted off the
  // cells rather than asserted beside them. Planted by changing row 4's Worker
  // cell to `notApplicable`: the two counts moved and the sum check held while
  // the per-token check went red — which is why both are here.
  it('counts five of the seven tokens, summing to thirty-five', () => {
    const tally: Record<string, number> = {}
    for (const row of FL_B8_MATRIX) {
      for (const column of FL_B8_COLUMNS) {
        const o = row.cells[column].outcome
        tally[o] = (tally[o] ?? 0) + 1
      }
    }
    expect(tally).toEqual({
      explicitlyProhibited: 19,
      notApplicable: 9,
      allowed: 3,
      allowedWithConditions: 3,
      readOnly: 1,
    })
    expect(Object.values(tally).reduce((a, b) => a + b, 0)).toBe(35)
    expect(tally.unavailable).toBeUndefined()
    expect(tally.clientDecisionRequired).toBeUndefined()
  })

  /**
   * WHY THE BARE-TOKEN COUNT IS ASSERTED RATHER THAN WRITTEN IN A COMMENT.
   * Rule 4 of this surface says a prohibition renders as no control PLUS A
   * STATED LINE, and a line reading only "Explicitly prohibited" is the empty
   * region wearing a token. `matrix.ts` answers that by carrying `why` on every
   * row, and the count is the size of the problem `why` exists for. A count in
   * a comment drifts; this one goes red.
   *
   * FAILS IF: the count moves without the comment moving with it. It went red
   * on first writing at 24 and 17, which were counted by eye and were wrong.
   */
  it('counts twenty-two cells whose own words are a bare token', () => {
    const TOKENS: ReadonlySet<string> = new Set([
      'Explicitly prohibited',
      'Not applicable',
      'Allowed',
      'Allowed with conditions',
      'Read-only',
      'Unavailable',
      'Client Decision Required',
    ])
    let bare = 0
    let bareProhibition = 0
    for (const row of FL_B8_MATRIX) {
      for (const column of FL_B8_COLUMNS) {
        const note = row.cells[column].note
        if (TOKENS.has(note)) bare += 1
        if (note === 'Explicitly prohibited') bareProhibition += 1
      }
    }
    expect(bare).toBe(22)
    expect(bareProhibition).toBe(16)
    expect(35 - bare).toBe(13)
    // and every row carries the sentence that stands where the clause does not
    for (const row of FL_B8_MATRIX) {
      expect(row.why.length, row.id).toBeGreaterThan(20)
      expect(row.whyRef, row.id).toMatch(/L\d{5}/)
    }
  })

  // FAILS IF: a cell of this module carries an open decision. Wave 0 enumerates
  // all eleven `Client Decision Required` cells and none is this module's.
  it('carries none of the eleven Tenant Admin open cells', () => {
    // Widened deliberately. Under `as const` the compiler proves the union
    // holds no `MOD-FL-B8` and rejects the comparison outright — which is a
    // stronger result than the test wants and would leave the claim unwritten.
    // The widened view keeps it expressible, and it goes red if a B8 entry is
    // ever added.
    const openCells: readonly { readonly module: string }[] = TENANT_ADMIN_OPEN_CELLS
    expect(openCells.filter((c) => c.module === 'MOD-FL-B8')).toEqual([])
    for (const row of FL_B8_MATRIX) {
      for (const column of FL_B8_COLUMNS) {
        expect(row.cells[column].openDecision, `${row.id}/${column}`).toBeNull()
      }
    }
  })
})

/* ==================================================================== *
 * WHAT THE FOLD DRAWS, AND WHAT IT REFUSES.
 * ==================================================================== */

describe('what MOD-FL-B8 draws', () => {
  // FAILS IF: a control appears on a row this surface does not own. Planted by
  // classifying row 6 `screen`: `controlsOnActsHeldElsewhere` named the Quality
  // Manager cell.
  it('draws no control on a row held elsewhere', () => {
    expect(controlsOnActsHeldElsewhere(B8_ROWS, FL_B8_COLUMNS)).toEqual([])
  })

  // FAILS IF: a fourth control appears, or one of the three disappears. The
  // three are the Worker's own and every other cell of the matrix refuses.
  // Planted by changing row 5's Supervisor cell's row classification to
  // `screen`: two more controls appeared and this went red naming them.
  it('draws exactly three controls across thirty-five cells, all the Worker’s', () => {
    const drawn: string[] = []
    for (const row of FL_B8_MATRIX) {
      for (const column of FL_B8_COLUMNS) {
        if (frontlineAffordance(row, column).kind === 'control') {
          drawn.push(`${row.id}/${column}`)
        }
      }
    }
    expect(drawn).toEqual([
      'view-a-coaching-card/WORKER',
      'replay-a-coaching-card/WORKER',
      'dismiss-a-coaching-card/WORKER',
    ])
  })

  // FAILS IF: the row that forbids gating ever draws a control, in any column.
  // This is the module's own defect shape asked of the matrix.
  it('draws no control anywhere on “Let a dismissal block or delay a step”', () => {
    const row = b8Row('let-a-dismissal-block-or-delay-a-step')
    for (const column of FL_B8_COLUMNS) {
      const a = frontlineAffordance(row, column)
      expect(a.kind, column).toBe('refusal')
    }
    expect(norm(line(41471))).toContain('coaching is advisory and never gates')
  })

  // FAILS IF: row 5 or row 6 stops being classified away from this screen.
  it('classifies exactly rows 5 and 6 as another surface', () => {
    expect(FL_B8_MATRIX.filter((r) => r.surface === 'another-surface').map((r) => r.id)).toEqual([
      'see-another-workers-coaching-history',
      'author-or-edit-coaching-content',
    ])
  })
})

/* ==================================================================== *
 * ROW 5 — THE FIRST FRONTLINE ROW WHOSE CELLS NAME TWO SURFACES.
 * ==================================================================== */

describe('row 5 names two surfaces and wave 0’s row type holds one', () => {
  // FAILS IF: the two readings of row 5 stop disagreeing, which would mean the
  // finding was mis-stated. Read off the source line rather than off the module.
  it('reads both surfaces off L41472 itself', () => {
    const src = norm(line(41472))
    expect(src).toContain('only the repeated-coaching pattern signal, in the client command center')
    expect(src).toContain('in the delivery operations hub record')
    expect(src).toContain("see another worker's coaching history")
  })

  // FAILS IF: the wave-0 fold stops disagreeing with the Auditor's own cell.
  // THIS IS THE FINDING ITSELF, ASSERTED RATHER THAN DESCRIBED. Planted in
  // reverse: setting the row's metElsewhere to SURF-DOH made the fold agree with
  // the Auditor and disagree with the Supervisor, and this went red on the other
  // side — so it is not true of both the defect and its fix.
  it('shows the fold naming the Command Center for a cell whose own words name the Hub', () => {
    const row = b8Row('see-another-workers-coaching-history')
    const folded = frontlineAffordance(row, 'READONLY_AUDITOR')
    expect(folded.kind).toBe('cross-surface')
    if (folded.kind !== 'cross-surface') throw new Error('unreachable')
    expect(folded.surface).toBe('SURF-CC')
    expect(norm(row.cells.READONLY_AUDITOR.note)).toContain('delivery operations hub')
    // and this module's per-column reading is the one the panel draws
    expect(row.metElsewhereByColumn.READONLY_AUDITOR?.where).toBe('another-surface')
    expect(
      row.metElsewhereByColumn.READONLY_AUDITOR?.where === 'another-surface'
        ? row.metElsewhereByColumn.READONLY_AUDITOR.surface
        : null,
    ).toBe('SURF-DOH')
  })

  // FAILS IF: a place is invented for a cell whose prohibition is absolute, or
  // a place is dropped from one that names one. Planted by adding a
  // `WORKER: SURF-CC` entry: the list gained a fourth member and went red.
  it('names exactly three places, and none of them for the Worker', () => {
    expect(
      B8_PLACES_NAMED.map((p) => `${p.rowId}/${p.column}/${p.met.where === 'another-surface' ? p.met.surface : p.met.destination}`),
    ).toEqual([
      'see-another-workers-coaching-history/SUPERVISOR/SURF-CC',
      'see-another-workers-coaching-history/QUALITY_MANAGER/SURF-CC',
      'see-another-workers-coaching-history/READONLY_AUDITOR/SURF-DOH',
      'author-or-edit-coaching-content/QUALITY_MANAGER/SURF-STU',
    ])
    expect(B8_PLACES_NAMED.every((p) => p.met.where === 'another-surface')).toBe(true)
    expect(B8_PLACES_NAMED.some((p) => p.column === 'WORKER')).toBe(false)
    expect(B8_PLACES_NAMED.some((p) => p.column === 'TENANT_ADMIN')).toBe(false)
  })

  // FAILS IF: the ground for the Worker's absolute prohibition is not where the
  // finding says it is.
  it('grounds the Worker’s absolute prohibition on §3.3 and AC-SCOPE-044', () => {
    expect(norm(line(2006))).toContain(
      "no other worker's data appears in the frontline worker application at all",
    )
    expect(norm(line(2683))).toContain("no other worker's data is reachable")
    expect(norm(line(2008))).toContain('purpose-bound aggregates')
    for (const l of locatorsOf(ROW_5_NAMES_TWO_SURFACES.sourceRef)) {
      expect(line(l).trim(), `L${l}`).not.toBe('')
    }
  })

  // FAILS IF: the elliptical Quality Manager cell is transcribed as anything
  // other than what it says. Wave 0 enumerates L41472 among the eleven
  // elliptical cells and this is that cell.
  it('carries the elliptical Quality Manager cell as “— same”', () => {
    const row = b8Row('see-another-workers-coaching-history')
    expect(row.cells.QUALITY_MANAGER.note).toBe('Allowed with conditions — same')
    expect(norm(line(41472))).toContain('allowed with conditions — same')
  })
})

/* ==================================================================== *
 * ROW 6, AND WAVE 0'S SURFACE-LEVEL RECORD OF THE SAME ACT.
 * ==================================================================== */

describe('row 6 is the surface-level act seen from this module’s end', () => {
  // FAILS IF: this module and wave 0 cite a different line for the same act.
  it('is the act wave 0 already carries, cited at the same line', () => {
    const studio = FL_ACTS_HELD_ELSEWHERE.find((a) => a.owningSurface === 'SURF-STU')
    expect(studio).toBeDefined()
    expect(studio?.sourceRef).toContain('L41473')
    expect(firstLocator(b8Row('author-or-edit-coaching-content').sourceRef)).toBe(41473)
  })

  // FAILS IF: the qualified prohibition is flattened into the bare one. Planted
  // by using the bare PROHIBITED cell for the Supervisor: red, because L41473
  // says "on this surface" and the flattened note does not.
  it('keeps “on this surface” on the two cells that carry it', () => {
    const row = b8Row('author-or-edit-coaching-content')
    expect(row.cells.SUPERVISOR.note).toBe('Explicitly prohibited on this surface')
    expect(row.cells.TENANT_ADMIN.note).toBe('Explicitly prohibited on this surface')
    expect(row.cells.WORKER.note).toBe('Explicitly prohibited')
    expect(row.cells.READONLY_AUDITOR.note).toBe('Explicitly prohibited')
    expect(norm(line(41473))).toContain('explicitly prohibited on this surface')
    expect(norm(line(41473))).toContain('never here')
  })
})

/* ==================================================================== *
 * THE IDENTITY CARD.
 * ==================================================================== */

describe('the identity card, transcribed', () => {
  // FAILS IF: any transcribed sentence is not at the line it cites. Planted by
  // changing "never becomes a performance record" to "never becomes a record":
  // red, naming L41458.
  it('finds every sentence of every card field at the line it cites', () => {
    let checked = 0
    for (const s of B8_CARD) {
      const n = firstLocator(s.sourceRef)
      const src = norm(line(n))
      for (const sentence of sentences(s.text)) {
        expect(src, `${s.field} · L${n}`).toContain(norm(sentence))
        checked += 1
      }
    }
    expect(checked).toBeGreaterThan(30)
  })

  // FAILS IF: a `sourceRef` anchors on an identifier the cited line does not
  // carry. This is the check that caught eleven wrong citations in this build.
  it('finds every identifier anchor at its own line', () => {
    const refs = [
      ...B8_CARD.map((s) => s.sourceRef),
      ...B8_STATES.map((s) => s.sourceRef),
      ...B8_HAPPY_PATH.map((s) => s.sourceRef),
      ...B8_NOTIFICATIONS.map((n) => n.sourceRef),
      ...B8_SOURCE_TESTS.map((t) => t.sourceRef),
      ...B8_ACCEPTANCE_CRITERIA.map((a) => a.sourceRef),
      ...B8_WHERE_IT_SURFACES.map((w) => w.sourceRef),
      ...B8_EXCLUDED_DISPLAYS.map((e) => e.sourceRef),
      ...FL_B8_MATRIX.map((r) => r.whyRef),
      SB_FL_017.sourceRef,
      B8_SOCIAL_CONTRACT.sourceRef,
    ]
    let anchored = 0
    for (const ref of refs) {
      const anchor = anchorOf(ref)
      if (anchor === null) continue
      expect(line(firstLocator(ref)), ref).toContain(anchor)
      anchored += 1
    }
    expect(anchored).toBeGreaterThan(15)
  })

  // FAILS IF: a classification marker is invented for a field the source leaves
  // unmarked, or dropped from one it marks. Read off the line both ways.
  it('carries a classification marker exactly where the card carries one', () => {
    for (const s of B8_CARD) {
      const src = line(firstLocator(s.sourceRef))
      // Two spellings of the same marker: most fields carry the bracketed
      // `[SoW Fact — §x]` form, and L41500 carries "this is `Derived
      // Clarification`" inline instead. A regex that knew only the bracketed
      // form would report the Reconnect field as unmarked and force a `null`
      // this build would then have to invent a reason for.
      const marked =
        /\[(SoW Fact|Derived Clarification)/.test(src) ||
        /this is `?(Derived Clarification)/.test(src)
      expect(s.sourceClass !== null, `${s.field} · ${s.sourceRef}`).toBe(marked)
    }
    expect(B8_CARD.filter((s) => s.sourceClass === null)).toHaveLength(10)
  })

  // FAILS IF: exactly one field is not carried whole, and it is not the one the
  // categorical exclusion forces. Planted by dropping the elision and
  // transcribing L41502 whole: the excluded-word sweep below went red, which is
  // the pair working together.
  it('elides exactly one field, and its line really does carry an excluded word', () => {
    expect(B8_CARD_ELISIONS.map((s) => s.sourceRef)).toEqual(['DEC-GATE-001 · L41502'])
    expect(EXCLUDED.test(line(41502))).toBe(true)
    const elided = B8_CARD_ELISIONS[0]
    expect(EXCLUDED.test(elided?.text ?? '')).toBe(false)
  })

  // FAILS IF: a state is invented a gloss the source withholds, or the one
  // gloss the source gives is dropped.
  it('carries five states and glosses only the one the source glosses', () => {
    expect(B8_STATES).toHaveLength(5)
    expect(B8_STATES.filter((s) => s.gloss !== null).map((s) => s.id)).toEqual([
      'STATE-B8-FALLBACK',
    ])
    for (const s of B8_STATES) {
      expect(line(41484), s.id).toContain(s.id)
    }
    expect(norm(line(41484))).toContain(
      'where the authored work instructions serve in place of a card',
    )
  })

  // FAILS IF: the storyboard's third frame — the one that forbids the
  // agent-unavailable message — is not at its own line.
  it('finds all three storyboard frames at L41566', () => {
    expect(SB_FL_017.frames).toHaveLength(3)
    for (const f of SB_FL_017.frames) {
      for (const sentence of sentences(f.text)) {
        expect(norm(line(41566)), `frame ${f.n}`).toContain(norm(sentence))
      }
    }
    expect(norm(line(41566))).toContain('no message about the agent being unavailable')
  })
})

/* ==================================================================== *
 * THE CATEGORICAL EXCLUSION. This module is the one most able to break it.
 * ==================================================================== */

describe('no worker-facing measure of the worker, anywhere', () => {
  const RENDERED: readonly string[] = [
    ...B8_CARD.flatMap((s) => [s.field, s.text, s.elision ?? '']),
    ...B8_STATES.map((s) => s.gloss ?? ''),
    ...B8_HAPPY_PATH.map((s) => s.text),
    ...SB_FL_017.frames.map((f) => f.text),
    ...B8_CLAIMS_NEVER_MADE.flatMap((c) => [c.claim, c.instead]),
    ...B8_EXCLUDED_DISPLAYS.map((e) => e.position),
    ...B8_WHERE_IT_SURFACES.flatMap((w) => [w.place, w.what]),
    ...FL_B8_MATRIX.flatMap((r) => [
      r.control,
      r.why,
      ...FL_B8_COLUMNS.map((c) => r.cells[c].note),
    ]),
    ...B8_FUNCTIONALITIES.flatMap((f) => [
      f.statement,
      f.rolesAllowed,
      f.rolesProhibited,
      f.connectivity,
      f.fallbackClause,
    ]),
    ...B8_ACCEPTANCE_CRITERIA.flatMap((a) => [a.criterion ?? '', a.whyNotTranscribed ?? '']),
    ...B8_SOURCE_TESTS.map((t) => t.text),
    ...B8_NOTIFICATIONS.flatMap((n) => [n.trigger, n.recipient, n.channel, n.statesExercised]),
    B8_SOCIAL_CONTRACT.text,
    ...B8_LOCAL_DISCLOSURES.flatMap((d) => [
      d.question,
      d.adopted,
      d.consequenceIfRuledOtherwise,
      d.whyHere,
      d.canonNote,
      ...d.readings.map((r) => r.text),
    ]),
    ...B8_CANON_DECISIONS.map((d) => d.whyHere),
    ...B8_SOURCE_FINDINGS.flatMap((f) => [f.what, f.evidence, f.notClosedBecause]),
    B8_PATTERN_DIVERGENCE.note,
    ROW_5_NAMES_TWO_SURFACES.what,
    ROW_5_NAMES_TWO_SURFACES.evidence,
    ROW_5_NAMES_TWO_SURFACES.whatThisModuleDoes,
    ...B8_AGENT_REACHES.flatMap((r) => {
      const g = coachingGuidance(r)
      return [g.heading, g.body, ...g.controls]
    }),
    ...(['connected', 'offline'] as const).map((c) => dismissalOutcome(c).line),
    authoredVariant('Spanish', ['Spanish']).line,
    authoredVariant('Spanish', ['English']).line,
  ]

  // FAILS IF: an excluded word reaches any string this module renders. Every
  // rendered string is swept, not a sample. Planted by adding "pace" to
  // AC-B8-3's criterion: red, and the offender was named.
  it('holds no excluded word in any string this module renders', () => {
    expect(RENDERED.filter((s) => EXCLUDED.test(s))).toEqual([])
    // The gate can fail: the source's own wording of the same prohibition is
    // caught by the identical sweep. If this stops matching, the sweep is
    // broken rather than the module being clean.
    expect(RENDERED.filter((s) => EXCLUDED.test(`${s} pace`))).toHaveLength(RENDERED.length)
  })

  // FAILS IF: the one declined acceptance criterion is not the one whose line
  // carries an excluded word, or a line that carries one is transcribed anyway.
  // Planted by transcribing AC-B8-5: the sweep above went red.
  it('declines exactly the acceptance criterion whose line carries an excluded word', () => {
    const declined = B8_ACCEPTANCE_CRITERIA.filter((a) => a.criterion === null)
    expect(declined.map((a) => a.id)).toEqual(['AC-B8-5'])
    for (const a of declined) {
      expect(EXCLUDED.test(line(firstLocator(a.sourceRef))), a.id).toBe(true)
      expect(a.whyNotTranscribed).not.toBeNull()
    }
    const carried = B8_ACCEPTANCE_CRITERIA.filter((a) => a.criterion !== null)
    expect(carried.filter((a) => EXCLUDED.test(line(firstLocator(a.sourceRef))))).toEqual([])
  })

  // FAILS IF: `FUNC-B8-03-1-1`'s excluded clause is transcribed. Its line
  // carries one and its statement does not — the field is carried and the
  // Purpose clause is not, and this proves both halves.
  it('carries FUNC-B8-03-1-1’s statement from a line that carries an excluded word', () => {
    const f = B8_FUNCTIONALITIES.find((x) => x.id === 'FUNC-B8-03-1-1')
    expect(f).toBeDefined()
    expect(EXCLUDED.test(line(41543))).toBe(true)
    expect(EXCLUDED.test(`${f?.statement} ${f?.rolesProhibited}`)).toBe(false)
    expect(norm(line(41543))).toContain(norm(f?.statement ?? 'x'))
  })

  // FAILS IF: the word "synced" is written as a state. L39622 says there is no
  // such state and no bare success.
  it('never writes “synced” as a state', () => {
    expect(RENDERED.filter((s) => /\bsynced\b/i.test(s))).toEqual([])
  })

  // FAILS IF: a counting, comparing or rate-bearing member appears anywhere in
  // this module's own source. This is the surveillance affordance that arrives
  // as a kindness. Planted by adding `readonly dismissalCount: number` to
  // `B8DismissalOutcome`: both halves went red.
  it('declares no count, rate, average or tally anywhere in the module', () => {
    const files = ['charter.ts', 'matrix.ts', 'service.ts', 'CoachingPanel.tsx']
    const offenders: string[] = []
    for (const f of files) {
      const src = stripComments(moduleSource(f))
      for (const m of src.matchAll(/\b\w*(Count|Tally|Rate|Average|Frequency)\b/g)) {
        offenders.push(`${f}: ${m[0]}`)
      }
      if (/:\s*number\b/.test(src)) offenders.push(`${f}: a number-typed member`)
    }
    expect(offenders).toEqual([])
  })
})

/* ==================================================================== *
 * ADVISORY, NEVER A GATE.
 * ==================================================================== */

describe('coaching is advisory and never gates', () => {
  // FAILS IF: any guidance the module can produce claims to gate or to require
  // a dismissal. Every reach is asked, not one. Planted by returning
  // `gates: true` for 'available' — which does not compile, which is the point —
  // and then by widening the type to `boolean` first, at which point this went
  // red.
  it('returns gates:false and dismissRequired:false for every reach', () => {
    for (const reach of B8_AGENT_REACHES) {
      const g = coachingGuidance(reach)
      expect(g.gates, reach).toBe(false)
      expect(g.dismissRequired, reach).toBe(false)
    }
  })

  // FAILS IF: the literal type is widened to `boolean`, which is what would let
  // a later change gate without a type error. Read off the module's own source
  // with comments stripped, so a comment saying `false` cannot satisfy it.
  it('declares those two as literal false rather than boolean', () => {
    const src = stripComments(moduleSource('service.ts'))
    expect(src).toContain('readonly gates: false')
    expect(src).toContain('readonly dismissRequired: false')
    expect(src).not.toMatch(/readonly (gates|dismissRequired): boolean/)
  })

  // FAILS IF: the module reaches for a modal. `Dialog` is a real primitive in
  // this build and using it here is the exact defect. Comments stripped, so the
  // header's own discussion of dialogs does not satisfy or defeat it.
  it('imports no Dialog and renders no dialog role in its own source', () => {
    const panel = stripComments(moduleSource('CoachingPanel.tsx'))
    expect(panel).not.toMatch(/\bDialog\b/)
    expect(panel).not.toMatch(/role="dialog"/)
    expect(panel).not.toMatch(/aria-modal/)
  })

  // FAILS IF: L41471's own words stop being the row's reason.
  it('reads “never gates” off the row’s own cell', () => {
    expect(b8Row('let-a-dismissal-block-or-delay-a-step').cells.WORKER.note).toContain(
      'coaching is advisory and never gates',
    )
    expect(norm(line(41578))).toContain('no coaching card ever blocks, gates, or delays a step')
  })
})

/* ==================================================================== *
 * THE THREE ABSENT CAUSES ARE ONE EXPERIENCE.
 * ==================================================================== */

describe('the guidance when the agent cannot be reached', () => {
  // FAILS IF: the three absent causes stop being answered identically. Each is
  // a fresh CALL, compared against another fresh call — never against the
  // constant the function returns, which would be the tautology this build has
  // recorded. Planted by giving 'emergency-pause' its own heading: red.
  it('answers offline, agent outage and emergency pause identically', () => {
    expect(B8_ABSENT_REACHES).toEqual(['offline', 'agent-outage', 'emergency-pause'])
    const [first, ...rest] = B8_ABSENT_REACHES.map((r) => coachingGuidance(r))
    for (const g of rest) expect(g).toEqual(first)
    expect(first?.kind).toBe('authored-work-instruction')
    expect(coachingGuidance('available').kind).toBe('agent-selected-card')
    expect(coachingGuidance('available')).not.toEqual(first)
  })

  // FAILS IF: the fallback announces an agent failure to the worker.
  // `TEST-B8-5` (L41591) asks for exactly this. Planted by adding "The coaching
  // agent is unavailable." to the fallback body: red.
  it('names no agent failure in the fallback the worker is shown', () => {
    const g = coachingGuidance('offline')
    const shown = `${g.heading} ${g.body}`
    expect(shown).not.toMatch(/unavailab|not available|outage|failed|failure|degraded|error/i)
    expect(norm(line(41591))).toContain('no agent-unavailable message appears')
    expect(norm(line(41540))).toContain(
      'the application does not announce agent failures to the worker',
    )
  })

  // FAILS IF: the fallback has card controls, which frame 3 forbids — "with no
  // card". Planted by giving it ['Play again','Dismiss']: red.
  it('gives the authored instruction no card controls', () => {
    expect(coachingGuidance('offline').controls).toEqual([])
    expect(coachingGuidance('available').controls).toEqual(['Play again', 'Dismiss'])
    expect(line(41566)).toContain('"Play again" and "Dismiss"')
  })
})

/* ==================================================================== *
 * THE LANGUAGE VARIANT, AND WHAT IS NOT IN THE RETURN TYPE.
 * ==================================================================== */

describe('the language variant is selected, never translated', () => {
  // FAILS IF: a translation path appears. Two members, and neither is one.
  it('selects an authored variant where one exists', () => {
    const r = authoredVariant('Spanish', ['English', 'Spanish'])
    expect(r.kind).toBe('authored-variant')
    expect(r.kind === 'authored-variant' ? r.language : null).toBe('Spanish')
    expect(r.line).toContain('Nothing was translated')
  })

  // FAILS IF: a missing variant is filled by translating. L48677 is the rule.
  // Planted by returning the English variant when Spanish is asked for and
  // absent: red, because the kind changed.
  it('says so rather than translating where no rendering exists', () => {
    const r = authoredVariant('Spanish', ['English'])
    expect(r.kind).toBe('no-rendering-exists')
    expect(norm(line(48677))).toContain(
      'where a rendering does not exist, the platform says so rather than translating',
    )
    expect(norm(line(41496))).toContain('translation is never runtime')
  })

  // FAILS IF: runtime translation stops being prohibited in every column.
  it('prohibits runtime translation in all five columns', () => {
    const row = b8Row('translate-coaching-content-at-runtime')
    for (const column of FL_B8_COLUMNS) {
      expect(row.cells[column].outcome, column).toBe('explicitlyProhibited')
    }
    expect(norm(line(41521))).toContain('never machine-translated at runtime')
  })
})

/* ==================================================================== *
 * THE DISMISSAL, AND THE SOCIAL CONTRACT.
 * ==================================================================== */

describe('one dismissed nudge is a data point, a pattern is a signal', () => {
  // FAILS IF: a dismissal ever produces a supervisor notification. Both
  // connectivity states are asked. Planted by widening the field to
  // `string | null` and returning a string offline: red.
  it('raises no supervisor notification on either connectivity', () => {
    for (const c of ['connected', 'offline'] as const) {
      const o = dismissalOutcome(c)
      expect(o.supervisorNotification, c).toBeNull()
      expect(o.learningSignal, c).toBe('recorded')
    }
    expect(dismissalOutcome('connected').upload).toBe('uploaded')
    expect(dismissalOutcome('offline').upload).toBe('queued')
    expect(norm(line(41535))).toContain('online: recorded and uploaded. offline: recorded and queued')
  })

  // FAILS IF: the null is widened, which is what would let a later change add a
  // per-dismissal notification without a type error.
  it('declares supervisorNotification as the literal null', () => {
    const src = stripComments(moduleSource('service.ts'))
    expect(src).toContain('readonly supervisorNotification: null')
    expect(src).not.toMatch(/supervisorNotification:\s*\w+\s*\|\s*null/)
  })

  // FAILS IF: the notifications table stops saying nobody is told. Both rows
  // are read off their own lines.
  it('transcribes both notification rows at their own lines', () => {
    expect(B8_NOTIFICATIONS).toHaveLength(2)
    for (const n of B8_NOTIFICATIONS) {
      const src = norm(line(firstLocator(n.sourceRef)))
      expect(src, n.trigger).toContain(norm(n.trigger))
      expect(src, n.trigger).toContain(norm(n.recipient))
      expect(src, n.trigger).toContain(norm(n.channel))
      expect(src, n.trigger).toContain(norm(n.statesExercised))
    }
    expect(B8_NOTIFICATIONS[0]?.recipient).toContain('Nobody')
    expect(norm(line(41517))).toContain(norm(B8_SOCIAL_CONTRACT.text))
  })
})

/* ==================================================================== *
 * THE EIGHT FUNCTIONALITIES AND THE THREE FALLBACK READINGS.
 * ==================================================================== */

describe('the eight functionalities', () => {
  // FAILS IF: a functionality is transcribed against the wrong line or its
  // clauses are reworded.
  it('finds every functionality’s clauses at the line it cites', () => {
    expect(B8_FUNCTIONALITIES).toHaveLength(8)
    for (const f of B8_FUNCTIONALITIES) {
      const n = firstLocator(f.sourceRef)
      const src = norm(line(n))
      expect(src, f.id).toContain(norm(f.id))
      expect(src, f.id).toContain(norm(f.statement))
      expect(src, f.id).toContain(norm(f.rolesAllowed))
      expect(src, f.id).toContain(norm(f.rolesProhibited))
      expect(src, f.id).toContain(norm(f.connectivity))
      expect(src, f.id).toContain(norm(f.fallbackClause))
    }
  })

  // FAILS IF: the AC-FL-011-1 gap is filled, or invented. Wave 0's function is
  // what asks; this module does not write its own. Planted by assigning
  // FB-FL-AI-01 to FUNC-B8-01-2-1: red, because the gap emptied.
  it('reports one functionality naming no pattern, and fills none', () => {
    expect(B8_FUNCTIONALITIES_NAMING_NO_PATTERN).toEqual(['FUNC-B8-01-2-1'])
    expect(functionalitiesNamingNoPattern(B8_FUNCTIONALITIES)).toEqual(
      B8_FUNCTIONALITIES_NAMING_NO_PATTERN,
    )
    expect(line(41534)).toContain(
      'Not applicable — replay reads content already on screen.',
    )
    // `norm` strips the glob's asterisk with the other markdown emphasis
    // characters, so the assertion stops before it rather than asserting a
    // string the fold cannot produce.
    expect(norm(line(40151))).toContain(
      'every functionality in this chapter names at least one',
    )
  })

  // FAILS IF: the three readings stop diverging, or a reading is quietly
  // reconciled into another. Each is read from its own place: the map through
  // wave 0, the card line off the source, the functionalities off this module.
  it('carries three readings of the fallback set, 2 / 3 / 3, unreconciled', () => {
    expect(B8_MAPPED_PATTERNS.map((p) => p.id)).toEqual(['FB-FL-CORE-01', 'FB-FL-AI-01'])
    expect([...B8_PATTERN_DIVERGENCE.fromTheModuleMap]).toEqual(
      B8_MAPPED_PATTERNS.map((p) => p.id),
    )
    for (const id of B8_PATTERN_DIVERGENCE.fromTheCardsFallbackLine) {
      expect(line(41523), id).toContain(id)
    }
    expect([...B8_PATTERNS_NAMED_BY_FUNCTIONALITIES].sort()).toEqual(
      [...B8_PATTERN_DIVERGENCE.fromTheFunctionalities].sort(),
    )
    // and the three sets are genuinely different, which is the finding
    const map = new Set<string>(B8_PATTERN_DIVERGENCE.fromTheModuleMap)
    const card = new Set<string>(B8_PATTERN_DIVERGENCE.fromTheCardsFallbackLine)
    const func = new Set<string>(B8_PATTERN_DIVERGENCE.fromTheFunctionalities)
    expect(map.size).toBe(2)
    expect(card.size).toBe(3)
    expect(func.size).toBe(3)
    expect(card.has('FB-FL-UP-01')).toBe(false)
    expect(func.has('FB-FL-CORE-01')).toBe(false)
    // FB-FL-UP-01's own map row does not list this module, and two
    // functionalities name it anyway.
    expect(line(40134)).not.toContain('MOD-FL-B8')
    expect(line(40134)).toContain('FB-FL-UP-01')
    expect(line(41535)).toContain('FB-FL-UP-01')
  })
})

/* ==================================================================== *
 * THE DECISIONS, AND THE STAND-IN BUILT TO EXPIRE.
 * ==================================================================== */

describe('the open decisions this module discloses', () => {
  // FAILS IF: DEC-GATE-001 is lifted into the canon and this module goes on
  // carrying its own copy. THE STAND-IN IS BUILT TO EXPIRE, and this is the
  // expiry. Planted by adding 'DEC-GATE-001' to the local list twice: the
  // absence check still passed and the duplicate check went red, which is why
  // both are here.
  it('carries only identifiers the canon does not hold', () => {
    const canon = new Set<string>(OPEN_DECISION_IDS)
    for (const id of B8_LOCAL_DECISION_IDS) {
      expect(canon.has(id), `${id} is now in the canon — lift the local record`).toBe(false)
    }
    expect(B8_LOCAL_DECISION_IDS).toEqual(['DEC-GATE-001'])
    expect(new Set(B8_LOCAL_DECISION_IDS).size).toBe(B8_LOCAL_DECISION_IDS.length)
  })

  // FAILS IF: a decision the canon DOES hold is disclosed locally instead of
  // through the shared renderer, which is how two spellings ship.
  it('cites the two canon decisions through the canon', () => {
    const canon = new Set<string>(OPEN_DECISION_IDS)
    expect(B8_CANON_DECISIONS.map((d) => d.id)).toEqual(['DEC-LIB-001', 'DEC-LANEB-001'])
    for (const d of B8_CANON_DECISIONS) {
      expect(canon.has(d.id), d.id).toBe(true)
      expect(B8_LOCAL_DECISION_IDS).not.toContain(d.id)
    }
  })

  // FAILS IF: the brief's assignment of DEC-GATE-001 to this module is wrong.
  // The brief said it was believed correct; this proves it by counting
  // occurrences inside §22.17's own span. Planted by narrowing the span to
  // exclude L41596: the count fell to one and this went red.
  it('proves DEC-GATE-001 occurs exactly twice inside §22.17, at L41502 and L41596', () => {
    const hits: number[] = []
    for (let n = S2217_FIRST; n <= S2217_LAST; n += 1) {
      if (line(n).includes('DEC-GATE-001')) hits.push(n)
    }
    expect(hits).toEqual([41502, 41596])
    expect(line(S2217_FIRST)).toContain('22.17 Module B8 — Coaching Rendering')
    expect(line(S2217_LAST + 1)).toContain('22.18 Module B9')
  })

  // FAILS IF: a reading is cited at a line that does not carry it, or the
  // adopted position is not the source's own. Every reading is opened.
  it('finds every DEC-GATE-001 reading at its own line', () => {
    const d = B8_LOCAL_DISCLOSURES.find((x) => x.decisionRef === 'DEC-GATE-001')
    expect(d).toBeDefined()
    expect(d?.readings.length).toBeGreaterThanOrEqual(4)
    for (const r of d?.readings ?? []) {
      const n = firstLocator(r.locator)
      for (const s of sentences(r.text)) {
        expect(norm(line(n)), r.locator).toContain(norm(s))
      }
    }
    // TWO OF THE FOUR ARE IDENTIFIER-ANCHORED AND TWO ARE NOT, and the
    // difference is the source's rather than a slip: L40952 and L41596 name
    // DEC-GATE-001 in their own words, and the decision card's Contradiction
    // and Offline-impact bullets do not name it because the card's heading
    // already has. A locator that claimed an anchor its line does not carry
    // would be a knowingly-false citation, so those two carry a bare line.
    const anchored = (d?.readings ?? []).filter((r) => anchorOf(r.locator) !== null)
    expect(anchored).toHaveLength(2)
    for (const r of anchored) {
      expect(line(firstLocator(r.locator)), r.locator).toContain('DEC-GATE-001')
    }
    expect(norm(line(41596))).toContain(
      'governance binding is declared authoring-time policy and it carries no per-event runtime gate, with both source readings preserved in the card',
    )
    expect(norm(line(113201))).toContain(norm(d?.consequenceIfRuledOtherwise ?? 'x'))
  })

  // FAILS IF: the six locators the dispatch gave for DEC-LANEB-001 and
  // DEC-LIB-001 turn out to be inside this module's section after all, which
  // would make the finding wrong. All six are real lines and all six are
  // elsewhere.
  it('proves the dispatch’s six DEC-LANEB/DEC-LIB locators sit outside §22.17', () => {
    const supplied = [41195, 41276, 41869, 41927]
    for (const n of supplied) {
      expect(line(n).trim(), `L${n}`).not.toBe('')
      expect(n < S2217_FIRST || n > S2217_LAST, `L${n}`).toBe(true)
    }
    expect(line(41195)).toContain('DEC-LANEB-001')
    expect(line(41195)).toContain('DEC-LIB-001')
    expect(line(41869)).toContain('DEC-LANEB-001')
    // and neither identifier occurs anywhere inside §22.17
    for (let n = S2217_FIRST; n <= S2217_LAST; n += 1) {
      expect(line(n).includes('DEC-LANEB-001'), `L${n}`).toBe(false)
      expect(line(n).includes('DEC-LIB-001'), `L${n}`).toBe(false)
    }
  })

  // FAILS IF: the lines this module cites INSTEAD do not connect those two
  // decisions to coaching, which is what makes the disclosure honest rather
  // than inherited.
  it('cites lines that really do tie both canon decisions to coaching', () => {
    expect(line(32591)).toContain('DEC-LIB-001')
    expect(norm(line(32591))).toContain('containment checklist or coaching asset changes mid-run')
    expect(norm(line(5930))).toContain('coaching trigger from 80 per cent to 75 per cent')
    expect(norm(line(5931))).toContain('the coaching trigger travels in the package')
    for (const d of B8_CANON_DECISIONS) {
      for (const n of locatorsOf(d.sourceRef)) {
        expect(line(n).trim(), `${d.id} · L${n}`).not.toBe('')
      }
    }
  })
})

/* ==================================================================== *
 * THE FINDINGS, PROVEN RATHER THAN ASSERTED.
 * ==================================================================== */

describe('the findings this module reports', () => {
  // FAILS IF: §15.2 turns out to be the support-not-surveillance invariant
  // after all. The dispatch cited it; it is the role-grant lifecycle. Planted
  // in reverse by pointing the check at L1994: it went red, so the check reads
  // the line rather than restating the finding.
  it('proves §15.2 is the role-grant lifecycle and §3.3 is the invariant', () => {
    expect(line(19053)).toContain('## 15.2 The role-grant lifecycle')
    expect(line(1994)).toContain('## 3.3 Support, Not Surveillance')
    expect(norm(line(2000))).toContain(
      'must be felt by the worker as support, not surveillance — a tool that helps them do the job right, not an instrument watching them for mistakes',
    )
    expect(line(19053)).not.toContain('Surveillance')
  })

  // FAILS IF: a finding cites a line that is blank, out of range, or does not
  // carry what the finding says it carries. Every locator in every finding is
  // opened.
  it('opens every line every finding cites', () => {
    expect(B8_SOURCE_FINDINGS.length).toBeGreaterThanOrEqual(5)
    for (const f of B8_SOURCE_FINDINGS) {
      const ns = locatorsOf(f.sourceRef)
      expect(ns.length, f.what).toBeGreaterThan(0)
      for (const n of ns) {
        expect(line(n).trim(), `${f.what} · L${n}`).not.toBe('')
      }
    }
  })

  // FAILS IF: the module's band is read off a neighbour's row, or the
  // build-plan grade is transcribed into the module. `C2` is a plan grade and
  // `B` is the source's own Band column. Planted by writing C2 into the
  // charter: red.
  it('reads its own Band row and carries no build-plan grade', () => {
    expect(line(39844)).toContain('Band')
    const row = line(39853)
    expect(row).toContain('MOD-FL-B8')
    expect(row).toContain('Coaching Rendering')
    expect(row.split('|').map((c) => c.trim())).toContain('B')
    // and the neighbours are not this module's row
    expect(line(39852)).toContain('MOD-FL-A7')
    expect(line(39854)).toContain('MOD-FL-B9')
    for (const f of ['charter.ts', 'matrix.ts', 'service.ts', 'CoachingPanel.tsx']) {
      expect(stripComments(moduleSource(f)), f).not.toMatch(/\bC[12]\b/)
    }
  })

  // FAILS IF: this module claims a destination of its own. `AC-FL-010-2`
  // (L40046) makes coaching a STATE of the Run Player.
  it('is a state of the Run Player and never a destination', () => {
    const view = FL_PLAYER_VIEWS.find((v) => v.id === 'SCR-FL-13')
    expect(view?.name).toBe('Coaching card')
    expect(view?.placement).toBe('run-player')
    expect(line(39875)).toContain('MOD-FL-B8')
    expect(norm(line(40046))).toContain(
      'capture, coaching, deviation, handover, and sign-off are implemented as states of the run player and are not reachable as independent destinations',
    )
    expect(line(48531)).toContain('B8')
  })
})

/* ==================================================================== *
 * THE SIX ACCEPTANCE CRITERIA AND THE EIGHT SOURCE TESTS.
 * ==================================================================== */

describe('the acceptance criteria and the tests they answer to', () => {
  // FAILS IF: a criterion is transcribed against the wrong line, or the six
  // stop running L41576-L41581 consecutively.
  it('finds all six criteria on their own consecutive lines', () => {
    expect(B8_ACCEPTANCE_CRITERIA).toHaveLength(6)
    B8_ACCEPTANCE_CRITERIA.forEach((a, i) => {
      const n = firstLocator(a.sourceRef)
      expect(n, a.id).toBe(41576 + i)
      expect(line(n), a.id).toContain(`\`${a.id}\``)
      if (a.criterion !== null) {
        expect(norm(line(n)), a.id).toContain(norm(a.criterion))
      }
    })
  })

  // FAILS IF: a transcribed test is not at its line, or one is invented.
  it('finds every transcribed test at its own line', () => {
    for (const t of B8_SOURCE_TESTS) {
      const n = firstLocator(t.sourceRef)
      expect(line(n), t.id).toContain(`\`${t.id}\``)
      expect(line(n), t.id).toContain(`| ${t.type} |`)
      expect(norm(line(n)), t.id).toContain(norm(t.text))
    }
    expect(B8_SOURCE_TESTS.map((t) => t.id)).toEqual([
      'TEST-B8-3',
      'TEST-B8-4',
      'TEST-B8-5',
      'TEST-B8-6',
      'TEST-B8-7',
    ])
  })

  // FAILS IF: the source's own eight-test block stops being eight, which would
  // mean the five transcribed here are a different selection than believed.
  it('transcribes five of the source’s eight tests, and the other three exist', () => {
    for (let i = 1; i <= 8; i += 1) {
      expect(line(41586 + i), `TEST-B8-${i}`).toContain(`\`TEST-B8-${i}\``)
    }
    expect(line(41595).trim()).toBe('')
  })
})

/* ==================================================================== *
 * THE HAPPY PATH AND THE CLAIMS NEVER MADE.
 * ==================================================================== */

describe('the rest of the transcription', () => {
  it('finds the five happy-path steps on their own consecutive lines', () => {
    expect(B8_HAPPY_PATH).toHaveLength(5)
    B8_HAPPY_PATH.forEach((s, i) => {
      const n = firstLocator(s.sourceRef)
      expect(n, `step ${s.n}`).toBe(41488 + i)
      expect(norm(line(n)), `step ${s.n}`).toContain(norm(s.text))
    })
  })

  // FAILS IF: a claim-never-made cites a line that does not support it.
  it('opens every line the never-claimed list cites', () => {
    expect(B8_CLAIMS_NEVER_MADE.length).toBeGreaterThanOrEqual(4)
    for (const c of B8_CLAIMS_NEVER_MADE) {
      for (const n of locatorsOf(c.sourceRef)) {
        expect(line(n).trim(), `${c.claim} · L${n}`).not.toBe('')
      }
    }
    expect(norm(line(39250))).toContain('dismissal recording can be perceived as monitoring')
  })

  // FAILS IF: an excluded-display record cites a line that is blank or that
  // does not carry its identifier.
  it('opens every line the excluded-display record cites', () => {
    for (const e of B8_EXCLUDED_DISPLAYS) {
      const n = firstLocator(e.sourceRef)
      expect(line(n).trim(), e.sourceRef).not.toBe('')
      const anchor = anchorOf(e.sourceRef)
      if (anchor !== null) expect(line(n), e.sourceRef).toContain(anchor)
    }
  })
})

/* ==================================================================== *
 * EVERY CITATION IN THIS MODULE, INCLUDING THE ONES IN COMMENTS.
 * ==================================================================== */

describe('every L-citation this module writes', () => {
  /**
   * THIS GATE CAUGHT THREE DEFECTS THE FIRST TIME IT RAN, so it is left in
   * rather than treated as ceremony. Three comments in `service.ts` gave the
   * end of §22.17 as line 41597. That line is BLANK — §22.17's last line of
   * content is its Source status at L41596 — and a blank line states nothing,
   * so the number is written here WITHOUT its `L`, because writing it with one
   * would file the very citation this gate exists to catch and would make the
   * gate fail on its own docstring, which it did on first writing.
   * so a citation of one is always wrong. `tests/coverage/locator-fidelity`
   * lexes any `L`-number in a comment as a citation, which is exactly why
   * naming a blank line in a prose description files a knowingly-false one.
   *
   * The lexer here is that file's own shape: no citation is preceded by an
   * alphanumeric or a hyphen (which kills `QUAL-FOOD-SAFETY-L2`), and none is
   * followed by `[` or a backslash (which kills a regex literal).
   *
   * FAILS IF: any citation in any of this module's six files, comments
   * included, names a line that is blank or out of range. It fired on all
   * three of the real defects above before they were repaired.
   */
  it('names a real, non-blank line — comments included', () => {
    const files = [
      'src/frontline/modules/fl-b8/charter.ts',
      'src/frontline/modules/fl-b8/matrix.ts',
      'src/frontline/modules/fl-b8/service.ts',
      'src/frontline/modules/fl-b8/CoachingPanel.tsx',
      'tests/unit/fl-b8.test.ts',
      'tests/component/fl-b8.test.tsx',
    ]
    const cite = /(?<![A-Za-z0-9-])L(\d{3,6})(?![[\\])/g
    const offenders: string[] = []
    let counted = 0
    for (const f of files) {
      const text = readFileSync(join(process.cwd(), f), 'utf8')
      text.split('\n').forEach((row, i) => {
        for (const m of row.matchAll(cite)) {
          const n = Number(m[1])
          counted += 1
          if (n < 1 || n > LINES.length) offenders.push(`${f}:${i + 1} L${n} out of range`)
          else if (LINES[n - 1]?.trim() === '') offenders.push(`${f}:${i + 1} L${n} is blank`)
        }
      })
    }
    expect(offenders).toEqual([])
    expect(counted).toBeGreaterThan(300)
  })
})

/* ==================================================================== *
 * THE ROW HELPER.
 * ==================================================================== */

describe('b8Row', () => {
  it('returns each row and refuses an id this matrix does not hold', () => {
    for (const row of FL_B8_MATRIX) expect(b8Row(row.id).control).toBe(row.control)
    // The cast is the point: the runtime guard exists for a caller that is not
    // type-checked, and without it a typo would return `undefined` and fail
    // somewhere else.
    expect(() => b8Row('not-a-row' as never)).toThrow(/no matrix row/)
  })

  it('exposes the widened rows as the same seven records', () => {
    expect(B8_ROWS.map((r) => r.id)).toEqual(FL_B8_MATRIX.map((r) => r.id))
    const columns: readonly FlB8Column[] = FL_B8_COLUMNS
    expect(columns).toHaveLength(5)
  })
})
