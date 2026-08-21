import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { decisionRecord, OPEN_DECISION_IDS } from '@/disclosure/decisions'
import { functionalitiesNamingNoPattern } from '@/frontline/fallbacks'
import { FL_MATRIX_SHAPE, controlsOnActsHeldElsewhere, frontlineAffordance } from '@/frontline/matrix'
import {
  B12_CARD,
  B12_CLAIMS_NEVER_MADE,
  B12_INVENTORY_ROW,
  B12_ONLINE_ONLY_SCOPE,
  B12_STATES,
  B12_WHERE_IT_SURFACES,
} from '@/frontline/modules/fl-b12/charter'
import {
  B12_UNAVAILABLE_SENSES,
  FL_B12_COLUMNS,
  FL_B12_COLUMN_HEADINGS,
  FL_B12_MATRIX,
  FL_B12_SHAPE,
  FL_B12_TOKEN_TALLY,
} from '@/frontline/modules/fl-b12/matrix'
import {
  B12_ACCEPTANCE_CRITERIA,
  B12_CANON_DECISIONS,
  B12_CARD_PATTERNS,
  B12_DENIAL_TESTS,
  B12_FUNCTIONALITIES,
  B12_ILLUSTRATIVE_ITEM,
  B12_MAPPED_PATTERNS,
  B12_PATTERNS_NAMED_BY_FUNCTIONALITIES,
  B12_PATTERN_GAPS,
  B12_SOURCE_FINDINGS,
  B12_UNIDENTIFIED_TENSIONS,
  SB_FL_021_FRAMES,
  libraryRendering,
} from '@/frontline/modules/fl-b12/service'

/**
 * `MOD-FL-B12` — the Training Library Viewer, checked against the FROZEN
 * SOURCE rather than against a brief.
 *
 * WHY EVERY CLAIM HERE OPENS THE FILE. The brief this module was built from is
 * a hypothesis, and this build has recorded ten brief-supplied assertions that
 * could not fail and eleven wrong citations. So a transcription is checked by
 * reading the line it cites and looking for the words, and a locator is
 * checked by asking whether the identifier really occurs there. Nothing below
 * asserts a string against another string this task also wrote, except where
 * the point IS comparing two things this build wrote — the token tally against
 * the row count, and the canon's decision records against the identifiers this
 * module cites.
 *
 * EVERY GATE IN THIS FILE WAS PLANTED AND WATCHED GO RED before it was left
 * green — one defect per gate, in the thing the gate claims to protect, then
 * restored. The `FAILS IF` note on each one names the defect that was actually
 * planted, not one that would have been convenient.
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
 * backticks stripped, curly quotes folded to ASCII, dashes folded, whitespace
 * collapsed, lowercased. Every one of those is a real mismatch in this
 * module's own transcription — the source writes `MOD-FL-B12` in backticks and
 * `**Purpose.**` in asterisks, and this file's prose uses a curly apostrophe
 * where the source uses a straight one.
 */
function norm(s: string): string {
  return s
    .replace(/[`*_]/g, '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/** The `L#####` a `sourceRef` names, and the identifier beside it if any. */
function refLine(sourceRef: string): number {
  const m = /L(\d{3,6})/.exec(sourceRef)
  if (m === null) throw new Error(`no line number in sourceRef: ${sourceRef}`)
  return Number(m[1])
}

function refIdentifier(sourceRef: string): string | null {
  const m = /^([A-Z][A-Z0-9-]{3,})\s*·/.exec(sourceRef)
  return m === null ? null : (m[1] ?? null)
}

const MODULE_DIR = join(process.cwd(), 'src', 'frontline', 'modules', 'fl-b12')
const MODULE_FILES = readdirSync(MODULE_DIR).map((f) => ({
  name: f,
  text: readFileSync(join(MODULE_DIR, f), 'utf8'),
}))

/* ==================================================================== *
 * THE MATRIX SPAN, AGAINST THE TABLE ITSELF.
 * ==================================================================== */

describe('the matrix span in the frozen source', () => {
  // FAILS IF: the header, separator or data lines this module claims are not
  // the table the source actually holds. Checked by parsing the lines rather
  // than by comparing them to wave 0's constant, which would only prove two
  // transcriptions agree.
  //
  // THE FIRST VERSION OF THIS GATE COULD NOT FAIL, and the plant is what
  // showed it. `firstDataLine` was moved to 42112 — the separator — and the
  // gate stayed green: a separator row splits into six cells, every one of
  // them `---`, so "six cells, none of them empty" is true of it. The
  // separator is the ONE line that a non-empty check cannot distinguish from a
  // row. So every data line is now required to carry a real cell rather than a
  // rule, and every one is required to carry a backticked status token. With
  // that added, the same plant went red at L42112.
  it('names a real table at L42111 to L42120', () => {
    expect(srcLine(FL_B12_SHAPE.headerLine)).toContain('| Action | Worker | Supervisor |')
    expect(srcLine(FL_B12_SHAPE.separatorLine).replace(/[|\s]/g, '')).toMatch(/^-+$/)
    // Every data line is a table row with the Action column plus five personas.
    for (let n = FL_B12_SHAPE.firstDataLine; n <= FL_B12_SHAPE.lastDataLine; n += 1) {
      const cells = srcLine(n).trim().replace(/^\||\|$/g, '').split('|')
      expect(cells, `L${n}`).toHaveLength(FL_B12_COLUMNS.length + 1)
      expect(cells.every((c) => c.trim().length > 0), `L${n}`).toBe(true)
      // and it is a row rather than a rule: an Action in words, and a
      // backticked status token in each of the five persona cells.
      expect((cells[0] ?? '').trim(), `L${n} action`).toMatch(/[A-Za-z]/)
      for (const c of cells.slice(1)) expect(c, `L${n}`).toMatch(/`[A-Z][a-z]/)
    }
    // The line after the last data line is NOT a row of this table, which is
    // what makes "eight rows" a boundary rather than a count that could run on.
    expect(srcLine(FL_B12_SHAPE.lastDataLine + 1).trim()).not.toMatch(/^\|/)
  })

  // FAILS IF: the header's five persona columns are not the five this module
  // types, or are in a different order. Read off the source's header line,
  // position by position. Planted: TENANT_ADMIN and QUALITY_MANAGER swapped in
  // FL_B12_COLUMNS. Went red at index 2.
  it('column headings are the header row’s own words, in its own order', () => {
    const headings = srcLine(FL_B12_SHAPE.headerLine)
      .trim()
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((c) => c.trim())
      .slice(1)
    expect(headings).toHaveLength(FL_B12_COLUMNS.length)
    FL_B12_COLUMNS.forEach((c, i) => {
      expect(FL_B12_COLUMN_HEADINGS[c], `column ${i}`).toBe(headings[i])
    })
  })

  // FAILS IF: this module's shape and wave 0's row of FL_MATRIX_SHAPE disagree.
  // Two transcriptions of one table, held equal. Planted: rows changed to 9 in
  // this module by duplicating a row id. Went red on rows and on cells both.
  it('agrees with wave 0’s counted shape for this module', () => {
    const wave0 = FL_MATRIX_SHAPE.find((s) => s.module === 'MOD-FL-B12')
    expect(wave0).toBeDefined()
    expect(FL_B12_SHAPE.rows).toBe(wave0?.rows)
    expect(FL_B12_SHAPE.columns).toBe(wave0?.columns)
    expect(FL_B12_SHAPE.headerLine).toBe(wave0?.headerLine)
    expect(FL_B12_SHAPE.separatorLine).toBe(wave0?.separatorLine)
    expect(FL_B12_SHAPE.firstDataLine).toBe(wave0?.firstDataLine)
    expect(FL_B12_SHAPE.lastDataLine).toBe(wave0?.lastDataLine)
  })

  // FAILS IF: rows x columns and the token tally disagree. The tally is
  // reduced from the cells and the row count from the array, so a row dropped
  // from the transcription moves both — which is why the third check, the span
  // length, is here: it is a reading of the LINE NUMBERS and moves when the
  // other two do not. Planted: one row deleted. Went red on the span length
  // with 7 rows against 8 lines.
  it('eight rows, five columns, forty cells, and the span is eight lines long', () => {
    expect(FL_B12_MATRIX).toHaveLength(8)
    expect(FL_B12_COLUMNS).toHaveLength(5)
    expect(FL_B12_SHAPE.cells).toBe(40)
    expect(FL_B12_SHAPE.lastDataLine - FL_B12_SHAPE.firstDataLine + 1).toBe(FL_B12_MATRIX.length)
    const tallied = Object.values(FL_B12_TOKEN_TALLY).reduce((a, b) => a + b, 0)
    expect(tallied).toBe(FL_B12_SHAPE.cells)
    // Each row is on its own line, in the source's order.
    FL_B12_MATRIX.forEach((row, i) => {
      expect(refLine(row.sourceRef), row.id).toBe(FL_B12_SHAPE.firstDataLine + i)
    })
  })
})

/* ==================================================================== *
 * THE TRANSCRIPTION, CELL BY CELL.
 * ==================================================================== */

describe('the forty cells, against the eight lines they came from', () => {
  // FAILS IF: any cell's note is not the words the source writes in that
  // cell's own position. Position by position rather than "appears somewhere
  // on the line", because every uniform prohibition row writes the same token
  // five times and a substring check cannot tell column four from column two.
  // Planted: row 4's Worker note changed to the Supervisor's bare token. Went
  // red naming download-to-device/WORKER.
  it('every cell carries its own position’s words, verbatim', () => {
    for (const row of FL_B12_MATRIX) {
      const cells = srcLine(refLine(row.sourceRef))
        .trim()
        .replace(/^\||\|$/g, '')
        .split('|')
        .map((c) => c.trim())
      expect(norm(cells[0] ?? ''), row.id).toBe(norm(row.control))
      FL_B12_COLUMNS.forEach((column, i) => {
        expect(norm(row.cells[column].note), `${row.id}/${column}`).toBe(norm(cells[i + 1] ?? ''))
      })
    }
  })

  // FAILS IF: any cell records a deferred question this matrix does not carry.
  // None of the eleven Client Decision Required cells on this surface is in
  // this matrix, so all forty openDecision fields are null. Planted:
  // openDecision set to 'tenant-admin-device-session' on row 1's Tenant Admin
  // cell. Went red naming that cell.
  it('carries no open decision on any cell, and no Client Decision Required token', () => {
    for (const row of FL_B12_MATRIX) {
      for (const column of FL_B12_COLUMNS) {
        expect(row.cells[column].openDecision, `${row.id}/${column}`).toBeNull()
        expect(row.cells[column].outcome, `${row.id}/${column}`).not.toBe('clientDecisionRequired')
      }
    }
    expect(FL_B12_TOKEN_TALLY['clientDecisionRequired']).toBeUndefined()
  })

  // FAILS IF: the tally this module derives is not the tally the source's own
  // lines hold. Counted a second time off the RAW text of the eight lines, so
  // the two readings are independent: this one counts backticked tokens in the
  // markdown, that one counts typed outcomes in the transcription. Planted:
  // row 3's Supervisor cell retyped as notApplicable. Went red on both
  // explicitlyProhibited and notApplicable.
  it('the token tally matches a second count taken off the raw markdown', () => {
    const raw: Record<string, number> = {}
    for (let n = FL_B12_SHAPE.firstDataLine; n <= FL_B12_SHAPE.lastDataLine; n += 1) {
      const cells = srcLine(n).trim().replace(/^\||\|$/g, '').split('|').slice(1)
      for (const c of cells) {
        // The token is the first backticked group, cut at its own em dash.
        // The source puts the qualifier OUTSIDE the backticks on Unavailable
        // and Explicitly prohibited, and INSIDE them on Not applicable, so a
        // reader that took the backticked span whole would count three
        // different Not applicable tokens where the source has one.
        const token = ((/`([^`]+)`/.exec(c)?.[1] ?? '').split(' — ')[0] ?? '').trim()
        raw[token] = (raw[token] ?? 0) + 1
      }
    }
    expect(raw).toEqual({
      'Explicitly prohibited': 25,
      Unavailable: 10,
      'Not applicable': 3,
      Allowed: 1,
      'Allowed with conditions': 1,
    })
    expect(FL_B12_TOKEN_TALLY).toEqual({
      explicitlyProhibited: 25,
      unavailable: 10,
      notApplicable: 3,
      allowed: 1,
      allowedWithConditions: 1,
    })
  })

  // FAILS IF: row 1's Supervisor cell loses the qualifier "on this surface",
  // or its Tenant Admin cell grows a reason the source does not give. Asserted
  // as INEQUALITY between the three Not applicable cells as well as equality
  // with the source, because "Not applicable" is a prefix of "Not applicable —
  // no execution session on this surface" and a containment check would pass
  // all three against any one of them. Planted: the Supervisor cell's
  // qualifier dropped. Went red on the inequality before it went red on the
  // source comparison.
  it('row 1’s three Not applicable cells are three different statements', () => {
    const row = FL_B12_MATRIX[0]
    const sup = row.cells.SUPERVISOR.note
    const qm = row.cells.QUALITY_MANAGER.note
    const ta = row.cells.TENANT_ADMIN.note
    expect(new Set([sup, qm, ta]).size).toBe(3)
    expect(sup).toBe('Not applicable — no execution session on this surface')
    expect(qm).toBe('Not applicable — same basis')
    expect(ta).toBe('Not applicable')
    expect(srcLine(42113)).toContain('`Not applicable — no execution session on this surface`')
    expect(srcLine(42113)).toContain('`Not applicable — same basis`')
    // and the bare cell really is bare in the source: no em dash after it.
    const cells = srcLine(42113).trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim())
    expect(cells[4]).toBe('`Not applicable`')
  })
})

/* ==================================================================== *
 * THE OVERLOAD. THIS IS THE MATRIX WHERE BOTH SENSES SIT TOGETHER.
 * ==================================================================== */

describe('`Unavailable` in its two opposite senses', () => {
  // FAILS IF: the two rows stop being indistinguishable by their token. This
  // is the premise of everything below — if the source separated them, nothing
  // would need separating. Read off the raw lines. Planted: nothing could be
  // planted in this build to break it, so it is asserted against the SOURCE
  // and its failure mode is a source change, which is what it is for.
  it('rows 2 and 8 carry the same token, six rows apart, in every column', () => {
    for (const n of [42114, 42120]) {
      const cells = srcLine(n).trim().replace(/^\||\|$/g, '').split('|').slice(1)
      expect(cells, `L${n}`).toHaveLength(5)
      for (const c of cells) expect(/`Unavailable`/.test(c), `L${n}: ${c}`).toBe(true)
    }
    expect(FL_B12_MATRIX[7].sourceRef).toBe('L42120')
    expect(FL_B12_MATRIX[1].sourceRef).toBe('L42114')
    // six rows apart, which is the whole hazard.
    expect(refLine(FL_B12_MATRIX[7].sourceRef) - refLine(FL_B12_MATRIX[1].sourceRef)).toBe(6)
  })

  // FAILS IF: the two rows classify the same, or the fold renders them the
  // same. THE GATE OF THIS TASK. Asserted on the CLOSING SENTENCE each
  // existence produces, in both directions — row 2 has the returning sentence
  // and NOT the permanent one, row 8 has the permanent one and NOT the
  // returning one. A one-directional check passes when both rows say both
  // things. Planted: row 8's existence set to 'absent-under-condition'. Went
  // red on all five of its columns for the missing permanent sentence AND for
  // the present returning one.
  it('renders the two senses apart, in every one of their ten cells', () => {
    const conditional = FL_B12_MATRIX[1]
    const permanent = FL_B12_MATRIX[7]
    expect(conditional.existence).toBe('absent-under-condition')
    expect(permanent.existence).toBe('not-in-scope')
    expect(conditional.existence).not.toBe(permanent.existence)

    const RETURNS = 'It returns when that condition lifts.'
    const NEVER = 'It exists nowhere for anyone in this scope, so there is nothing to come back to.'

    for (const column of FL_B12_COLUMNS) {
      const a = frontlineAffordance(conditional, column)
      const b = frontlineAffordance(permanent, column)
      expect(a.kind, column).toBe('stated-line')
      expect(b.kind, column).toBe('stated-line')
      if (a.kind !== 'stated-line' || b.kind !== 'stated-line') throw new Error('unreachable')
      expect(a.existence, column).toBe('absent-under-condition')
      expect(b.existence, column).toBe('not-in-scope')
      expect(a.line, column).toContain(RETURNS)
      expect(a.line, column).not.toContain(NEVER)
      expect(b.line, column).toContain(NEVER)
      expect(b.line, column).not.toContain(RETURNS)
      expect(a.line, column).not.toBe(b.line)
    }
  })

  // FAILS IF: the ten Unavailable cells this module holds are not ten of the
  // fifteen the surface holds, or the other five stop being MOD-FL-B10's. The
  // twelve matrix spans are wave 0's; the counting is done here against the
  // frozen source. Planted: FL_MATRIX_SHAPE's B12 span is wave 0's and cannot
  // be edited from here, so the defect was planted in the expectation — 10
  // changed to 9 — and the gate went red naming MOD-FL-B12.
  it('holds ten of the surface’s fifteen Unavailable cells; B10 holds the other five', () => {
    const perModule = FL_MATRIX_SHAPE.map((s) => {
      let n = 0
      for (let line = s.firstDataLine; line <= s.lastDataLine; line += 1) {
        n += (srcLine(line).match(/`Unavailable`/g) ?? []).length
      }
      return { module: s.module, n }
    })
    const nonZero = perModule.filter((m) => m.n > 0)
    expect(nonZero).toEqual([
      { module: 'MOD-FL-B10', n: 5 },
      { module: 'MOD-FL-B12', n: 10 },
    ])
    expect(perModule.reduce((a, m) => a + m.n, 0)).toBe(15)
    expect(FL_B12_TOKEN_TALLY['unavailable']).toBe(10)
  })

  // FAILS IF: a sense record loses its route-back answer or points at the
  // wrong row. `routeBack` is required by the type, so the falsifiable claim
  // is that the two answers are OPPOSITE — one names a return and the other
  // denies one. Planted: the permanent sense's routeBack replaced with the
  // conditional one's. Went red on the "never" assertion.
  it('each sense answers whether it comes back, and the answers are opposite', () => {
    expect(B12_UNAVAILABLE_SENSES).toHaveLength(2)
    const [conditional, permanent] = B12_UNAVAILABLE_SENSES
    expect(conditional.rowId).toBe('view-offline')
    expect(permanent.rowId).toBe('practice-mode')
    expect(conditional.routeBack).toMatch(/comes back at the next connection/i)
    expect(permanent.routeBack).toMatch(/There is none, and there never will be/i)
    expect(conditional.routeBack).not.toBe(permanent.routeBack)
    // and each names its own row's existence, which is what the fold reads.
    for (const s of B12_UNAVAILABLE_SENSES) {
      const row = FL_B12_MATRIX.find((r) => r.id === s.rowId)
      expect(row?.existence, s.rowId).toBe(s.existence)
      // the cell words are the source's own, on the sense's own line.
      expect(norm(srcLine(refLine(s.sourceRef)))).toContain(norm(s.cellWords))
    }
  })

  // FAILS IF: a corroborating locator does not carry what the record says it
  // carries. Each is opened and read. Planted: L41797 changed to L41796 on the
  // permanent sense. Went red — L41796 is the row about dismissing a
  // notified-class change notice and says nothing about operating-system
  // push.
  it('every corroborating locator carries the sense it is cited for', () => {
    expect(norm(srcLine(40036))).toContain(norm('online-only by design, excluded from the offline bundle'))
    expect(norm(srcLine(42145))).toContain(norm('The destination becomes available again'))
    expect(norm(srcLine(2726))).toContain(norm('practice mode is cut, not deferred'))
    expect(norm(srcLine(4807))).toContain(norm('returning only as a change request'))
    expect(norm(srcLine(41797))).toContain(norm('there is no operating-system push at launch'))
    // every locator the sense records is one of the five opened above.
    const cited = B12_UNAVAILABLE_SENSES.flatMap((s) => s.corroboration.map((c) => refLine(c.sourceRef)))
    expect(cited.sort((a, b) => a - b)).toEqual([2726, 4807, 40036, 41797, 42145])
  })
})

/* ==================================================================== *
 * THE ROWS THAT ARE NOT THIS SCREEN'S, AND THE ONE CONTROL THAT IS.
 * ==================================================================== */

describe('what this matrix draws and refuses', () => {
  // FAILS IF: any column of row 3 draws a control, or the row stops naming the
  // Studio. The cell reads `Allowed with conditions` and ends "never here";
  // the row is the surface boundary this whole module sits against. Planted:
  // metElsewhere.surface changed to SURF-DOH. Went red on the surface check —
  // the cell's own words name the Studio.
  it('row 3 is the Studio’s, in all five columns', () => {
    const row = FL_B12_MATRIX[2]
    expect(row.id).toBe('upload-or-version')
    expect(row.surface).toBe('another-surface')
    expect(row.metElsewhere?.where).toBe('another-surface')
    expect(row.metElsewhere?.surface).toBe('SURF-STU')
    for (const column of FL_B12_COLUMNS) {
      const drawn = frontlineAffordance(row, column)
      expect(drawn.kind, column).toBe('cross-surface')
    }
    // the cell's own words carry "never here", and so does the source.
    expect(row.cells.QUALITY_MANAGER.note).toContain('never here')
    expect(srcLine(42115)).toContain('never here')
  })

  // FAILS IF: this screen draws a control for anyone other than the Worker, or
  // for the Worker on more than the one row the source permits. Asserted over
  // every role and every row — five roles by eight rows is forty verdicts, and
  // exactly one of them is a control. Planted: row 5's Worker cell retyped as
  // `allowed`. Went red with 2 controls.
  it('exactly one of the forty verdicts is a control, and it is the Worker’s', () => {
    const controls: string[] = []
    for (const row of FL_B12_MATRIX) {
      for (const column of FL_B12_COLUMNS) {
        if (frontlineAffordance(row, column).kind === 'control') {
          controls.push(`${row.id}/${column}`)
        }
      }
    }
    expect(controls).toEqual(['view-connected/WORKER'])

    // WAVE 0's `controlsOnActsHeldElsewhere` IS CALLED HERE AND IS NOT THE
    // GATE, AND SAYING SO IS THE POINT. It was written as its own test first
    // and could not fail on this matrix: its first branch fires only for the
    // three EXCL-FL-06 invariant acts, none of which this module holds, and
    // its second branch asks whether a non-`screen` row drew a control — which
    // `frontlineAffordance` cannot produce, because an `another-surface` row
    // returns `cross-surface` and an `another-destination` row returns
    // `named-place` before the token is ever read. So it is asserted alongside
    // the count above, where the count is what actually goes red: planting
    // `surface: 'screen'` on row 3 makes the Quality Manager's `Allowed with
    // conditions` draw a button, and the count went to two while wave 0's
    // helper stayed empty.
    expect(controlsOnActsHeldElsewhere(FL_B12_MATRIX, FL_B12_COLUMNS)).toEqual([])
  })

  // FAILS IF: a prohibition renders as a bare token with no sentence saying
  // why. Thirty-four of the forty cells are a bare token in the source, so
  // every row carries a `why` with its own locator, and the locator is opened.
  // Planted: row 7's whyRef changed to L42178, which is FUNC-B12-02-1-1 and
  // says nothing about mid-Run requirement. Went red on the identifier check.
  it('every row names the source sentence that governs it, at a line that carries it', () => {
    for (const row of FL_B12_MATRIX) {
      expect(row.why.length, row.id).toBeGreaterThan(30)
      const line = srcLine(refLine(row.whyRef))
      const identifier = refIdentifier(row.whyRef)
      if (identifier !== null) expect(line, row.whyRef).toContain(identifier)
      // the row's own governing sentence really is on the line it cites.
      expect(norm(line), row.id).toContain(norm(row.why.split('.')[0] ?? ''))
    }
  })
})

/* ==================================================================== *
 * THE CARD, AGAINST THE LINES IT CITES.
 * ==================================================================== */

describe('the identity card, transcribed', () => {
  // FAILS IF: any card statement's prose is not on the line it cites. Field by
  // field, with the field's own label checked on the same line, so a statement
  // moved onto a neighbour's locator is caught by the label rather than
  // slipping through a +/- window. Planted: the Purpose field's sourceRef
  // moved to L42103, its neighbour. Went red on the label check.
  it('every field is on its own line, under its own label', () => {
    for (const s of B12_CARD) {
      const line = srcLine(refLine(s.sourceRef))
      const identifier = refIdentifier(s.sourceRef)
      if (identifier !== null) expect(line, s.sourceRef).toContain(identifier)
      // The Happy path field is the source's four numbered steps joined, and
      // its elision says so; every other field is one line.
      if (s.field === 'Happy path') {
        const joined = [42134, 42135, 42136, 42137].map((n) => srcLine(n).replace(/^\d+\.\s*/, '')).join(' ')
        expect(norm(joined)).toBe(norm(s.text))
        continue
      }
      const label = s.field === 'Identifier and name' ? 'Identifier' : s.field.split(',')[0]
      expect(line, s.field).toContain(`**${label}`)
      for (const sentence of norm(s.text).split('. ')) {
        if (sentence.length < 25) continue
        expect(norm(line), `${s.field}: ${sentence.slice(0, 50)}`).toContain(sentence)
      }
    }
  })

  // FAILS IF: a field is given a classification the source does not print on
  // it. Read off the line's own inline marker rather than off a list this task
  // also wrote. Planted: the User benefit field given sourceClass 'SoW Fact'.
  // Went red — L42103 carries no marker.
  it('a classification marker is recorded only where the card prints one', () => {
    for (const s of B12_CARD) {
      if (s.field === 'Happy path') continue
      const line = srcLine(refLine(s.sourceRef))
      const hasMarker = /\[SoW Fact/.test(line)
      expect(s.sourceClass !== null, `${s.field} (${s.sourceRef})`).toBe(hasMarker)
    }
    // fourteen of the twenty-two carry none, and that is a counted absence.
    expect(B12_CARD.filter((s) => s.sourceClass === null)).toHaveLength(14)
    expect(B12_CARD).toHaveLength(22)
  })

  // FAILS IF: the three states are not the three the source names, or a clause
  // is invented for the one it leaves bare. Planted: STATE-B12-VIEWING given
  // the clause 'while playing'. Went red — L42130 gives it none.
  it('names the three states the source names, with only the clauses it gives', () => {
    const line = srcLine(42130)
    expect(B12_STATES).toHaveLength(3)
    for (const s of B12_STATES) {
      expect(line, s.id).toContain(s.id)
      if (s.clause === null) {
        // no clause follows it: the identifier runs straight into the
        // sentence's own punctuation.
        expect(line, s.id).toMatch(new RegExp(`\`${s.id}\`[.;]`))
      } else {
        expect(line, s.id).toContain(`\`${s.id}\` ${s.clause}`)
      }
    }
  })

  // FAILS IF: this module transcribes a build-plan grade instead of the
  // source's Band. The inventory has a Band column and this module's own row
  // carries B. Planted: band changed to 'C2'. Went red against L39857.
  it('carries the Band its own inventory row gives it, not a build-plan grade', () => {
    const header = srcLine(39844)
    expect(header).toContain('| Band |')
    const cells = srcLine(refLine(B12_INVENTORY_ROW.sourceRef))
      .trim()
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((c) => c.trim())
    expect(cells[0]).toBe('`MOD-FL-B12`')
    expect(cells[1]).toBe(B12_INVENTORY_ROW.module)
    expect(cells[2]).toBe(B12_INVENTORY_ROW.band)
    expect(cells[3]).toBe(B12_INVENTORY_ROW.oneLineScope)
    // and A1's row reads A, which is what makes the letter the band rather
    // than a constant.
    expect(srcLine(39846).split('|')[3]?.trim()).toBe('A')
    expect(B12_INVENTORY_ROW.band).not.toBe(srcLine(39846).split('|')[3]?.trim())
  })

  // FAILS IF: the online-only statement stops carrying the half that does not
  // generalise. This module is the one screen whose honest offline answer is
  // "come back later", and a card that said only that would teach a reader the
  // safety layer needs a network. Planted: whatDoesNotGeneralise emptied. Went
  // red on the length and on the L40948 comparison.
  it('says what online-only does NOT mean, in the safety layer’s own words', () => {
    expect(norm(srcLine(refLine(B12_ONLINE_ONLY_SCOPE.whatIsOnlineOnlyRef)))).toContain(
      norm('The library is deliberately excluded from the offline Run bundle'),
    )
    const safety = srcLine(refLine(B12_ONLINE_ONLY_SCOPE.whatDoesNotGeneraliseRef))
    expect(safety).toContain('A Severity 1 hold fires immediately, even offline')
    expect(norm(B12_ONLINE_ONLY_SCOPE.whatDoesNotGeneralise)).toContain(
      norm('a Severity 1 hold fires immediately, even offline'),
    )
    expect(norm(B12_ONLINE_ONLY_SCOPE.whatDoesNotGeneralise)).toContain(
      norm('from the moment of the breach'),
    )
  })

  // FAILS IF: a claim-never-made cites an acceptance criterion that does not
  // say what the claim says. Each one is opened. Planted: the practice-mode
  // claim pointed at AC-B12-6. Went red — L42224 is the offline-message
  // criterion and carries no practice mode.
  it('every claim this module never makes cites a criterion that forbids it', () => {
    expect(B12_CLAIMS_NEVER_MADE).toHaveLength(4)
    const expected: readonly (readonly [string, RegExp])[] = [
      ['AC-B12-5', /no Step Execution, Data Capture, or other production record/],
      ['AC-B12-1', /No training material is included in any Run package/],
      ['AC-B12-2', /no Run blocks on it/],
      ['AC-B12-7', /No practice or rehearsal mode exists in the build/],
    ]
    expect(B12_CLAIMS_NEVER_MADE).toHaveLength(expected.length)
    B12_CLAIMS_NEVER_MADE.forEach((c, i) => {
      const [id, pattern] = expected[i] ?? ['', /$^/]
      expect(c.sourceRef, c.claim).toContain(id)
      const line = srcLine(refLine(c.sourceRef))
      expect(line, c.sourceRef).toContain(id)
      expect(line, c.sourceRef).toMatch(pattern)
    })
  })

  // FAILS IF: a place this module says it surfaces does not name it there.
  // Planted: the SCR-FL-19 entry's locator changed to L39880, its neighbour.
  // Went red — L39880 is the notifications inbox row and names MOD-FL-B10.
  it('every place it says it surfaces really names this module', () => {
    for (const w of B12_WHERE_IT_SURFACES) {
      const line = srcLine(refLine(w.sourceRef))
      const identifier = refIdentifier(w.sourceRef)
      if (identifier !== null) expect(line, w.sourceRef).toContain(identifier)
      expect(
        line.includes('MOD-FL-B12') || line.includes('Training Library'),
        w.sourceRef,
      ).toBe(true)
    }
  })
})

/* ==================================================================== *
 * FUNCTIONALITIES, FALLBACKS, AND THE THREE READINGS.
 * ==================================================================== */

describe('the nine functionalities and their fallback obligation', () => {
  // FAILS IF: a functionality's statement, purpose, prohibition or
  // connectivity clause is not on the line its identifier occurs at. All four
  // clauses per functionality, so a record assembled from the wrong
  // functionality fails on the clause rather than on the identifier. Planted:
  // FUNC-B12-03-1-2's connectivity clause replaced with 03-1-1's. Went red.
  it('every functionality is transcribed from the line its identifier occurs at', () => {
    expect(B12_FUNCTIONALITIES).toHaveLength(9)
    for (const f of B12_FUNCTIONALITIES) {
      const line = srcLine(refLine(f.sourceRef))
      expect(line, f.id).toContain(f.id)
      expect(norm(line), f.id).toContain(norm(f.statement))
      expect(norm(line), `${f.id} purpose`).toContain(norm(`Purpose: ${f.purpose}`))
      expect(norm(line), `${f.id} prohibited`).toContain(
        norm(`Roles prohibited: ${f.rolesProhibited}`),
      )
      expect(norm(line), `${f.id} connectivity`).toContain(norm(f.connectivity))
    }
  })

  // FAILS IF: a pattern is assigned to a functionality that names none, or a
  // named pattern is dropped. Read off the source's own Fallback clause.
  // Planted: FUNC-B12-05-1-1 given FB-FL-CORE-01. Went red — L42191's Fallback
  // clause reads Not applicable.
  it('names exactly the patterns the source’s own Fallback clauses name', () => {
    for (const f of B12_FUNCTIONALITIES) {
      const line = srcLine(refLine(f.sourceRef))
      const named = [...line.matchAll(/`(FB-FL-[A-Z0-9-]+)`/g)].map((m) => m[1])
      expect([...f.patterns], f.id).toEqual(named)
      if (named.length === 0) {
        expect(f.patternsNote, f.id).not.toBeNull()
        expect(norm(line), f.id).toContain(norm(f.patternsNote ?? ''))
      } else {
        expect(f.patternsNote, f.id).toBeNull()
      }
    }
  })

  // FAILS IF: a gap is filled. Three of the nine name none, and the gap list
  // is derived, so filling one shrinks the list. Cross-checked against wave
  // 0's own function, which is the one place the rule lives. Planted:
  // FUNC-B12-04-1-2 given FB-FL-CORE-01. Went red with 2 gaps against 3.
  it('reports three AC-FL-011-1 gaps and fills none of them', () => {
    expect(B12_PATTERN_GAPS.map((f) => f.id)).toEqual([
      'FUNC-B12-02-1-2',
      'FUNC-B12-04-1-2',
      'FUNC-B12-05-1-1',
    ])
    expect(functionalitiesNamingNoPattern(B12_FUNCTIONALITIES)).toEqual(
      B12_PATTERN_GAPS.map((f) => f.id),
    )
    expect(srcLine(40151)).toContain('AC-FL-011-1')
    expect(srcLine(40151)).toContain('names at least one')
  })

  // FAILS IF: the three readings of the fallback set are reconciled into one.
  // The map and the card give one pattern; the functionalities give two, and
  // the second's own map row does not list this module. Asserted as an
  // INEQUALITY, because a gate that only checked each reading separately would
  // pass a build that had quietly made them agree. Planted: FB-FL-SEC-01
  // removed from FUNC-B12-04-1-1. Went red on the inequality.
  it('carries three readings of its fallback set and reconciles none', () => {
    expect(B12_MAPPED_PATTERNS.map((p) => p.id)).toEqual(['FB-FL-CORE-01'])
    expect([...B12_CARD_PATTERNS]).toEqual(['FB-FL-CORE-01'])
    expect([...B12_PATTERNS_NAMED_BY_FUNCTIONALITIES]).toEqual(['FB-FL-CORE-01', 'FB-FL-SEC-01'])
    expect([...B12_PATTERNS_NAMED_BY_FUNCTIONALITIES]).not.toEqual([...B12_CARD_PATTERNS])
    // the source's own two map rows, opened.
    expect(srcLine(40130)).toContain('`FB-FL-CORE-01`')
    expect(srcLine(40130)).toContain('`MOD-FL-B12`')
    expect(srcLine(40141)).toContain('`FB-FL-SEC-01`')
    expect(srcLine(40141)).not.toContain('MOD-FL-B12')
    // and the card's own field names only the first.
    expect(srcLine(42167)).toContain('`FB-FL-CORE-01` primary')
    expect(srcLine(42167)).not.toContain('FB-FL-SEC-01')
  })
})

/* ==================================================================== *
 * ACCEPTANCE CRITERIA, TESTS, STORYBOARD, EXAMPLE.
 * ==================================================================== */

describe('criteria, tests, storyboard and the example', () => {
  // FAILS IF: a criterion's text is not the criterion at that line. Planted:
  // AC-B12-3's text swapped with AC-B12-4's. Went red on both.
  it('the seven acceptance criteria are the seven at L42219 to L42225', () => {
    expect(B12_ACCEPTANCE_CRITERIA).toHaveLength(7)
    B12_ACCEPTANCE_CRITERIA.forEach((a, i) => {
      const line = srcLine(42219 + i)
      expect(line, a.id).toContain(`\`${a.id}\``)
      expect(norm(line), a.id).toContain(norm(a.text))
      expect(refLine(a.sourceRef), a.id).toBe(42219 + i)
    })
  })

  // FAILS IF: a test record is not the test at that line, or carries the wrong
  // type. Planted: TEST-B12-6's type changed to 'Denial'. Went red — L42236
  // reads Offline.
  it('the four tests the refusals answer to are transcribed with their own types', () => {
    for (const t of B12_DENIAL_TESTS) {
      const line = srcLine(refLine(t.sourceRef))
      expect(line, t.id).toContain(`\`${t.id}\``)
      expect(line, t.id).toContain(`| ${t.type} |`)
      expect(norm(line), t.id).toContain(norm(t.text))
    }
  })

  // FAILS IF: a storyboard frame's description is not on L42209, or frame 3's
  // line is not the line the source puts in quotation marks. Planted: frame
  // 3's line changed to "The Training Library is unavailable." Went red.
  it('SB-FL-021’s three frames come from L42209, including its quoted line', () => {
    const line = srcLine(42209)
    expect(line).toContain('`SB-FL-021`')
    expect(SB_FL_021_FRAMES).toHaveLength(3)
    for (const f of SB_FL_021_FRAMES) {
      expect(norm(line), `frame ${f.n}`).toContain(norm(f.description.split(' — ')[0] ?? ''))
      if (f.line !== '') expect(line, `frame ${f.n}`).toContain(f.line)
    }
    expect(SB_FL_021_FRAMES[2].line).toBe(
      'The Training Library needs a connection. It is not needed for any of your runs.',
    )
  })

  // FAILS IF: a field of the illustrative item is not a fact L42211 states.
  // Every field opened against that one line, so an invented detail fails.
  // Planted: version changed to 'its fourth version'. Went red.
  it('every field of the one item is a fact the Illustrative Example states', () => {
    const line = srcLine(refLine(B12_ILLUSTRATIVE_ITEM.sourceRef))
    expect(line).toContain('`Illustrative Example`')
    for (const key of ['subject', 'length', 'language', 'uploadedBy', 'version', 'station', 'device'] as const) {
      expect(norm(line), key).toContain(norm(B12_ILLUSTRATIVE_ITEM[key]))
    }
    expect(norm(line)).toContain(norm(B12_ILLUSTRATIVE_ITEM.whatItIsNot))
  })

  // FAILS IF: the two connectivity renderings become one, or the offline one
  // stops being the honest line. Asserted as inequality of the state AND of
  // the text, because a rendering that returned the same sentence with a
  // different state field would pass a state-only check. Planted: the offline
  // branch made to return the connected line. Went red on both.
  it('renders connected and disconnected differently, and never as an empty list', () => {
    const on = libraryRendering(true)
    const off = libraryRendering(false)
    expect(on.state).toBe('STATE-B12-AVAILABLE')
    expect(off.state).toBe('STATE-B12-UNAVAILABLE')
    expect(on.line).not.toBe(off.line)
    expect(off.line).toContain('The Training Library needs a connection.')
    expect(off.line).toContain('It is not needed for any of your runs.')
    expect(on.line).not.toContain('needs a connection')
    // and neither of them is empty, which is the thing the source forbids.
    expect(on.line.length).toBeGreaterThan(40)
    expect(off.line.length).toBeGreaterThan(40)
  })
})

/* ==================================================================== *
 * THE SURFACE BOUNDARY, HELD BY THE FILES THEMSELVES.
 * ==================================================================== */

describe('the boundary against the Studio’s authoring half', () => {
  // FAILS IF: any file of this module imports anything that can author. The
  // Studio's Training Library ships in this build with `trainingControls` and
  // `uploadStatement`; importing one would carry upload and versioning across
  // the boundary L42115 draws. Read off the files, so it is a fact about the
  // module rather than a promise. Planted: `import { TRAINING_BANNER } from
  // '@/studio/modules/stu-08/training'` added to service.ts. Went red naming
  // service.ts.
  it('imports nothing from the Studio, and nothing from app/', () => {
    expect(MODULE_FILES.length).toBeGreaterThan(0)
    for (const f of MODULE_FILES) {
      const imports = [...f.text.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1] ?? '')
      expect(imports.length, f.name).toBeGreaterThan(0)
      for (const spec of imports) {
        expect(spec.startsWith('@/studio'), `${f.name} imports ${spec}`).toBe(false)
        expect(spec.includes('app/'), `${f.name} imports ${spec}`).toBe(false)
        expect(/stu-\d/.test(spec), `${f.name} imports ${spec}`).toBe(false)
      }
    }
  })

  // FAILS IF: any string this module can render carries a figure about the
  // worker. This screen is the one most likely to grow a completion count or a
  // progress percentage, and row 6 already forbids the record one would be
  // computed from. Walked over every exported constant rather than over the
  // rendered page, so a string added to data is caught before a view ever
  // draws it. Planted: 'Progress: 40% of your modules watched.' added to the
  // card's User benefit field. Went red naming that string.
  it('holds no string that could become a pace, progress or completion figure', () => {
    // `watched` and `completed` are NOT banned, and that is measured rather
    // than lenient: the source's own Illustrative Example writes "no run
    // depends on his having watched it" about ONE viewing, and wave 0's
    // FB-FL-CORE-01 terminal safe state writes "the worker completes assigned
    // Runs offline". Banning either word would fail on the source's own prose
    // and teach the next reader to weaken the gate rather than to keep it.
    // What is banned is the FIGURE: a percentage, or a word that only appears
    // when one is being displayed.
    const BANNED = /%|\bprogress\b|\bcountdown\b|\branking\b|\bpace\b|\btimer\b|\bpercent/i
    const seen: string[] = []
    const walk = (v: unknown): void => {
      if (typeof v === 'string') {
        seen.push(v)
        expect(v, v.slice(0, 80)).not.toMatch(BANNED)
        return
      }
      if (Array.isArray(v)) return v.forEach(walk)
      if (v !== null && typeof v === 'object') return Object.values(v).forEach(walk)
    }
    walk([
      B12_CARD,
      B12_STATES,
      B12_CLAIMS_NEVER_MADE,
      B12_WHERE_IT_SURFACES,
      B12_ONLINE_ONLY_SCOPE,
      B12_INVENTORY_ROW,
      FL_B12_MATRIX,
      B12_UNAVAILABLE_SENSES,
      B12_FUNCTIONALITIES,
      B12_ACCEPTANCE_CRITERIA,
      B12_DENIAL_TESTS,
      SB_FL_021_FRAMES,
      B12_ILLUSTRATIVE_ITEM,
      B12_SOURCE_FINDINGS,
      B12_UNIDENTIFIED_TENSIONS,
      B12_CANON_DECISIONS,
    ])
    // the walk really reached the strings, rather than passing on an empty set.
    expect(seen.length).toBeGreaterThan(200)
  })
})

/* ==================================================================== *
 * THE DECISIONS, AND WHICH KIND EACH ONE IS.
 * ==================================================================== */

describe('decisions and tensions', () => {
  // FAILS IF: this module writes its own prose for a decision the shared canon
  // already holds. Both identifiers are members of the canon's union with full
  // records — unlike the thirteen Frontline decisions wave 1 found absent — so
  // they are rendered through the one shared component. THIS IS THE EXPIRY
  // GATE IN THE OTHER DIRECTION: if a later task removes either record from
  // the canon, this goes red and forces a stand-in rather than leaving a
  // screen citing a decision nobody can look up. Planted: 'DEC-LIB-001'
  // replaced with 'DEC-LIBREV-001' in B12_CANON_DECISIONS. Went red — its
  // question is about library review, not about pinning.
  it('cites two decisions the canon holds, and re-words neither', () => {
    expect(B12_CANON_DECISIONS.map((d) => d.id)).toEqual(['DEC-LIB-001', 'DEC-LANEB-001'])
    for (const d of B12_CANON_DECISIONS) {
      expect(OPEN_DECISION_IDS, d.id).toContain(d.id)
      const record = decisionRecord(d.id)
      expect(record.decisionRef, d.id).toBe(d.id)
      expect(record.readings.length, d.id).toBeGreaterThan(1)
    }
    expect(decisionRecord('DEC-LIB-001').question).toContain('in-flight Run')
    expect(decisionRecord('DEC-LANEB-001').question).toContain('three-stage approval chain')
    // and this module holds no readings of its own for either.
    for (const d of B12_CANON_DECISIONS) {
      expect(Object.keys(d).sort()).toEqual(['id', 'whereTheSourceAttachesIt', 'whyHere'])
    }
  })

  // FAILS IF: this module claims the source filed either decision against it,
  // or claims the absence over a span that is not its section. Section 22.21
  // names no DEC-* identifier on any of its lines, and that is a measured
  // absence rather than an assumption. Planted: the finding's own span widened
  // past the end of its section, reaching into section 22.22. Went red at
  // L42257, DEC-UNIT-001 — and it went red because the span is read out of the
  // FINDING
  // rather than written here, so a finding claiming the wrong span fails
  // instead of being checked against a span this test chose to agree with.
  it('records that its own section names no decision identifier at all', () => {
    // THE RANGE IS READ OUT OF THE FINDING, not written here, so a finding
    // that claimed the absence over the wrong span goes red rather than being
    // checked against a span this test chose to agree with it.
    const finding = B12_SOURCE_FINDINGS.find((f) => f.what.includes('names no open decision'))
    expect(finding).toBeDefined()
    const span = /Section 22\.21 runs from L(\d+) to L(\d+)/.exec(finding?.evidence ?? '')
    expect(span, finding?.evidence.slice(0, 60)).not.toBeNull()
    const [from, to] = [Number(span?.[1]), Number(span?.[2])]
    const section: string[] = []
    for (let n = from; n <= to; n += 1) section.push(srcLine(n))
    expect(section.join('\n')).not.toMatch(/DEC-[A-Z]+-\d/)
    // and the span really is the whole of this module's section, at both ends:
    // its own heading, and the next section's heading one line past it.
    expect(srcLine(from)).toContain('22.21 Module B12')
    expect(srcLine(to + 1)).toContain('22.22')
    // and the lines this module cites instead really carry the identifiers.
    expect(srcLine(41195)).toContain('DEC-LIB-001')
    expect(srcLine(41195)).toContain('DEC-LANEB-001')
    expect(srcLine(41276)).toContain('DEC-LIB-001')
    expect(srcLine(41276)).toContain('DEC-LANEB-001')
    expect(srcLine(41869)).toContain('DEC-LANEB-001')
    expect(srcLine(41927)).toContain('DEC-LANEB-001')
  })

  // FAILS IF: a tension carrying no identifier is filed under one, or its
  // readings lose a locator. `DecisionReading` is imported from the canon and
  // has exactly two fields, so there is no field in which one could be marked
  // the answer — asserted here rather than assumed. Planted: a third field
  // `preferred: true` added to a reading. Went red on the key check.
  it('the two unidentified tensions carry both readings and no identifier', () => {
    expect(B12_UNIDENTIFIED_TENSIONS).toHaveLength(2)
    for (const t of B12_UNIDENTIFIED_TENSIONS) {
      expect(t.key, t.key).not.toMatch(/^DEC-/)
      expect(t.readings.length, t.key).toBe(2)
      for (const r of t.readings) {
        expect(Object.keys(r).sort(), t.key).toEqual(['locator', 'text'])
        for (const n of [...r.locator.matchAll(/L(\d{3,6})/g)].map((m) => Number(m[1]))) {
          expect(srcLine(n).trim().length, `${t.key} cites blank L${n}`).toBeGreaterThan(0)
        }
      }
      expect(t.noIdentifierNote, t.key).toContain('no DEC-* identifier')
    }
    // the notification tension's own two lines really say what it says.
    expect(srcLine(42159)).toContain('TBD — Client Decision Required')
    expect(srcLine(42161)).toContain('Decision owner: the client')
    expect(srcLine(42161)).toContain('no-read-obligation position of `MOD-FL-B10`')
  })

  // FAILS IF: a finding cites a line that does not carry the evidence it
  // claims. Planted: the three-readings finding's locator list lost L40141,
  // which is the only line proving FB-FL-SEC-01's map row omits this module.
  // Went red on the line-count check.
  it('every finding cites at least one line, and every line is non-blank', () => {
    expect(B12_SOURCE_FINDINGS).toHaveLength(5)
    for (const f of B12_SOURCE_FINDINGS) {
      const lines = [...f.sourceRef.matchAll(/L(\d{3,6})/g)].map((m) => Number(m[1]))
      expect(lines.length, f.what).toBeGreaterThan(0)
      for (const n of lines) expect(srcLine(n).trim().length, `L${n}`).toBeGreaterThan(0)
    }
    const threeReadings = B12_SOURCE_FINDINGS.find((f) => f.what.includes('fallback set'))
    expect(threeReadings?.sourceRef).toContain('L40141')
  })
})
