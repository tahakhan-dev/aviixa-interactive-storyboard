import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import { OPEN_DECISIONS } from '@/disclosure/decisions'
import { CC13_EXERCISED_ON } from '@/surfaces/cc/modules/cc-13/rail'
import { CC_LINK_OUT_CELLS, cellTextOf } from '@/surfaces/cc/decisions/link-outs'
import { CC_LOCAL_DISCLOSURES } from '@/surfaces/cc/decisions/disclosure'
import { ccElementAssignment } from '@/surfaces/cc/live/model'
import {
  CC06_COLUMNS,
  CC06_LINK_OUT_CELL_ID,
  CC06_MATRIX,
  CC06_MODULE,
  CC06_ROW_HELD_ELSEWHERE,
  CC06_SCREEN,
  CC06_SHARED_SCREEN,
  CC06_SLUG,
  CC06_TOKENS,
  CC06_TOKEN_OUTCOME,
  cc06Cell,
  cc06Row,
} from '@/surfaces/cc/modules/cc-06/matrix'
import {
  CC06_AGING,
  CC06_APPROVED_NOT_PUBLISHED,
  CC06_CONFIGURATION_BOUNDARY,
  CC06_DIVERGENCES,
  CC06_GRANTING_ROW_LINE,
  CC06_LANEB_STANDING,
  CC06_LEARNING_VIEW_CONTENT,
  CC06_LEARNING_VIEW_PROSE_VARIANT,
  CC06_NO_SWITCH,
  CC06_PACKAGE_TESTS,
  CC06_PKGFIELD_DISCLOSURE,
  CC06_PROHIBITING_ROW_LINE,
  CC06_SHARED_SCREEN_BOUNDARY,
  CC06_XSURFACE_COLUMNS,
  CC06_XSURFACE_ROWS,
  ccLaneBApplication,
} from '@/surfaces/cc/modules/cc-06/lane-b'

/**
 * `MOD-CC-06` — §21.9, GATED AGAINST THE FROZEN SOURCE.
 *
 * EVERY EXPECTATION ABOUT THE SOURCE IS READ OFF THE SOURCE AT TEST TIME.
 * Nothing below compares a string this task wrote against another string this
 * task wrote, and **no count is taken from the array under test**: "eight
 * rows" is obtained by walking the source's own table from its separator to
 * the first line that is not a table row, never from `CC06_MATRIX.length` and
 * never by subtracting the ends of a span written in a dispatch — which for
 * this module ended on a blank line, 180 lines short of the section.
 *
 * EVERY GATE WAS PLANTED AND WATCHED GO RED before it was left green — the
 * defect planted into the real shipping file, the red observed, then reversed
 * and verified byte-identical against a baseline captured BEFORE the first
 * plant. Each `PLANTED` note names the defect that was actually planted,
 * never a convenient one. Where two guards cover the same defect, the removal
 * of EACH and of BOTH was planted, because redundant protections cannot be
 * verified one at a time.
 *
 * FIVE BEATEN-GATE SHAPES FROM THE RUNNING CATALOGUE ARE LIVE RISKS HERE:
 *
 *  - `Allowed` IS A PREFIX OF `Allowed with conditions`, and row 2's
 *    Supervisor cell is the cell in this matrix where it decides the module's
 *    whole point. Every comparison is an anchored equality on the cell head.
 *  - A TABLE-SHAPE CHECK SATISFIED BY THE `|---|---|` SEPARATOR, which splits
 *    into non-empty cells like any other row. Every walk starts AFTER the
 *    separator and excludes it by position, not by content.
 *  - A COUNT TRUE OF BOTH THE DEFECT AND ITS FIX. Three columns of this
 *    matrix read `Explicitly prohibited` on all eight rows, so a count of
 *    "twenty-four prohibitions" is true however those three columns are
 *    permuted. Every cell gate names its ROW and its COLUMN, read off the
 *    source's own header.
 *  - A POSITION CHECK TRUE OF BOTH A DEFECT AND ITS FIX. Every column index
 *    is resolved from its header line BY NAME at test time, in this table and
 *    in the four foreign ones.
 *  - A `page.includes('MOD-CC-06')` CHECK SATISFIED BY A QUOTATION. A file
 *    that quotes a list of identifiers contains every identifier in that
 *    list, so the route gate requires an occurrence on a line naming no OTHER
 *    `MOD-CC-*`.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')

/** 1-based, so a line number in a comment is the line number in the file. */
const srcLine = (n: number): string => LINES[n - 1] ?? ''

const isTableRow = (s: string): boolean => s.trimStart().startsWith('|')

/** Backticks are the source's own marking; §26.7 uses them and §21.9 does not. */
const bare = (s: string): string => s.replace(/`/g, '').trim()

/** The cells of a markdown table row, without the leading and trailing empties. */
function cellsOf(line: string): readonly string[] {
  const parts = line.split('|')
  return parts.slice(1, parts.length - 1).map((c) => c.trim())
}

/**
 * A table's data rows, walked from its separator forward to the first line
 * that is not a table row. The separator is excluded BY POSITION — a content
 * test would let `|---|---|` through, which is a catalogued beaten gate.
 */
function walkTable(separatorLine: number): readonly { readonly line: number; readonly text: string }[] {
  const rows: { line: number; text: string }[] = []
  for (let n = separatorLine + 1; isTableRow(srcLine(n)); n += 1) {
    rows.push({ line: n, text: srcLine(n) })
  }
  return rows
}

/** A column's index in a header line, resolved by NAME at test time. */
function columnIndex(headerLine: number, column: string): number {
  const i = cellsOf(srcLine(headerLine)).findIndex((c) => bare(c) === column)
  expect(i, `column "${column}" is not in the header at L${headerLine}`).toBeGreaterThanOrEqual(0)
  return i
}

const CC06_HEADER = 37292
const CC06_SEPARATOR = 37293
const XSURFACE_HEADER = 49574
const XSURFACE_SEPARATOR = 49575

describe('the eight rows, counted off the source rather than off the model', () => {
  // FAILS IF: the transcription gains or loses a row, or the source's table
  // changes shape. The count comes from walking the source; `CC06_MATRIX` is
  // compared TO it and never consulted for it.
  // PLANTED: deleted the ordinal-5 entry from `CC06_MATRIX` in `matrix.ts`.
  // RED — "expected 7 to be 8".
  it('has exactly as many rows as the source table, and they start where it does', () => {
    const rows = walkTable(CC06_SEPARATOR)
    expect(rows.length).toBe(CC06_MATRIX.length)
    expect(rows[0]?.line).toBe(37294)
    expect(rows[rows.length - 1]?.line).toBe(37301)
    for (const [i, row] of rows.entries()) {
      expect(CC06_MATRIX[i]?.sourceRef).toBe(`L${row.line}`)
    }
  })

  // FAILS IF: the header's own column order changes, or the transcription's
  // order drifts from it. POSITIONAL on purpose and alongside the name-keyed
  // gates below: header-keying protects the value and is blind to the layout.
  // PLANTED: swapped 'Tenant Admin' and 'Worker' in `CC06_COLUMNS`.
  // RED — "expected 'Worker' to be 'Tenant Admin'".
  it('carries the header line’s five persona columns in the header line’s order', () => {
    const header = cellsOf(srcLine(CC06_HEADER))
    expect(header[0]).toBe('Capability on this module')
    expect(header.slice(1)).toEqual([...CC06_COLUMNS])
  })

  // FAILS IF: any of the forty cells drifts from the source, or lands under
  // the wrong column. Both the capability and every cell are matched by NAME
  // against the source's own header index, so a permutation of the three
  // all-prohibited columns cannot pass on a count.
  // PLANTED: changed row 2's Supervisor cell in `matrix.ts` from
  // 'Allowed with conditions — annotation only, no decision' to plain
  // 'Allowed'. RED — the row-2 Supervisor assertion.
  it('matches every cell of every row against the source, header-keyed', () => {
    for (const row of CC06_MATRIX) {
      const line = Number(row.sourceRef.slice(1))
      const cells = cellsOf(srcLine(line))
      expect(cells[0]).toBe(row.capability)
      for (const column of CC06_COLUMNS) {
        const i = columnIndex(CC06_HEADER, column)
        expect(cells[i], `row ${row.ordinal} · ${column} · L${line}`).toBe(row.cells[column].text)
      }
    }
  })

  // FAILS IF: a cell head is classified by prefix rather than by equality.
  // `Allowed` is a prefix of `Allowed with conditions`; row 2's Supervisor
  // cell is where that decides whether a Supervisor may decide.
  // PLANTED: replaced the `CC06_TOKENS.find((t) => t === head)` in
  // `matrix.ts`'s `cell()` with `CC06_TOKENS.find((t) => head.startsWith(t))`.
  // RED — row 2's Supervisor token became 'Allowed'.
  it('splits each cell on its own em-dash and matches the head exactly', () => {
    for (const row of CC06_MATRIX) {
      for (const column of CC06_COLUMNS) {
        const c = row.cells[column]
        const head = c.text.split(' — ')[0] ?? ''
        expect(c.token).toBe(head)
        expect(CC06_TOKENS).toContain(c.token)
        expect(c.note).toBe(c.text === head ? null : c.text.slice(head.length + 3))
      }
    }
    expect(cc06Cell(2, 'Supervisor').token).toBe('Allowed with conditions')
    expect(cc06Cell(2, 'Supervisor').token).not.toBe('Allowed')
    expect(cc06Cell(3, 'Quality Manager').token).toBe('Allowed')
  })

  // FAILS IF: the four-token vocabulary is claimed and a fifth is used, or one
  // of the four is claimed and never appears. Both directions, because a
  // vocabulary that lists a token no cell uses is as wrong as one that misses
  // one. The tokens are collected FROM THE SOURCE LINES, not from the model.
  // PLANTED: added 'Unavailable' to `CC06_TOKENS`.
  // RED — the "every declared token occurs" direction.
  it('uses exactly the four tokens it declares, counted off the source', () => {
    const seen = new Set<string>()
    for (const row of walkTable(CC06_SEPARATOR)) {
      for (const c of cellsOf(row.text).slice(1)) seen.add(bare(c).split(' — ')[0] ?? '')
    }
    expect([...seen].sort()).toEqual([...CC06_TOKENS].sort())
    for (const token of CC06_TOKENS) {
      expect(CC06_TOKEN_OUTCOME[token]).toBeTruthy()
    }
  })

  // FAILS IF: `Read-only` is folded into a refusal. It is the one token this
  // matrix carries that `MOD-CC-04`'s does not, and folding it would delete
  // the Supervisor's standing on rows 1 and 5 outright.
  // PLANTED: changed `CC06_TOKEN_OUTCOME['Read-only']` to
  // 'explicitlyProhibited'. RED.
  it('reads Read-only onto readOnly and not onto a refusal', () => {
    expect(CC06_TOKEN_OUTCOME['Read-only']).toBe('readOnly')
    expect(cc06Cell(1, 'Supervisor').token).toBe('Read-only')
    expect(cc06Cell(5, 'Supervisor').token).toBe('Read-only')
    expect(cc06Cell(1, 'Supervisor').note).toBe('observe')
    expect(cc06Cell(5, 'Supervisor').note).toBeNull()
  })
})

describe('the section, and the span the dispatch gave for it', () => {
  // FAILS IF: the section moves, or the card is taken to end before its own
  // matrix. The end is found by reading FORWARD to the next section heading
  // rather than by trusting any written span.
  // PLANTED: changed `CC06_MODULE.sourceRef` in the spine — reverted
  // immediately, the spine is not this task's file — so the plant was run
  // instead on the assertion's own subject by pointing `identity` at the
  // heading line. RED.
  it('opens at its heading, carries its matrix, and closes before §21.10', () => {
    expect(srcLine(37251)).toContain('## 21.9 Module `MOD-CC-06`')
    expect(srcLine(37257)).toContain('**Identity.** Identifier `MOD-CC-06`')
    expect(CC06_MODULE.sourceRef).toBe('L37257')
    expect(srcLine(37471)).toContain('## 21.10 Module')
    expect(srcLine(37469).trim()).toBe('---')
    // The matrix sits INSIDE the section and after the dispatch's stated end.
    expect(CC06_HEADER).toBeGreaterThan(37257)
    expect(CC06_HEADER).toBeLessThan(37469)
    // Eleven acceptance criteria, counted off the source.
    const acs = LINES.slice(37440, 37451).filter((l) => l.startsWith('- `AC-CC-'))
    expect(acs).toHaveLength(11)
  })
})

describe('the configuration boundary — both §26.7 rows, header-keyed', () => {
  // FAILS IF: either row's Client Command Center cell drifts, or the column
  // is resolved positionally. §26.7 runs SURFACES across the top where every
  // chapter-21 matrix runs PERSONAS, so a positional read lands on a
  // different kind of thing entirely.
  // PLANTED: in `lane-b.ts`, truncated L49594's cell to
  // '`Allowed with conditions` — Quality Manager and above', which is what a
  // 230-character read of the line produces. RED — and this is the defect the
  // plant was written to catch, because it is the one that actually happened.
  it('transcribes both rows and the row between them from the source', () => {
    const header = cellsOf(srcLine(XSURFACE_HEADER))
    expect(header).toEqual([...CC06_XSURFACE_COLUMNS])
    const ccIndex = columnIndex(XSURFACE_HEADER, 'Client Command Center')
    const sotIndex = columnIndex(XSURFACE_HEADER, 'Single source of truth')
    const typeIndex = columnIndex(XSURFACE_HEADER, 'Record type')
    for (const row of CC06_XSURFACE_ROWS) {
      const cells = cellsOf(srcLine(row.line))
      expect(cells[typeIndex]).toBe(row.recordType)
      expect(cells[sotIndex]).toBe(row.singleSourceOfTruth)
      expect(cells[ccIndex], `L${row.line} Client Command Center`).toBe(row.commandCenterCell)
    }
  })

  // FAILS IF: the two rows are described as adjacent. The dispatch said the
  // prohibition sits "one row below" the grant; it sits two below, and the
  // row between is a data row of the same table on another module's subject.
  // PLANTED: set `CC06_PROHIBITING_ROW_LINE` to `CC06_GRANTING_ROW_LINE + 1`.
  // RED — both the distance assertion and the cell transcription above.
  it('places the prohibition two data rows below the grant, not one', () => {
    expect(CC06_PROHIBITING_ROW_LINE - CC06_GRANTING_ROW_LINE).toBe(2)
    const between = CC06_GRANTING_ROW_LINE + 1
    expect(isTableRow(srcLine(between))).toBe(true)
    expect(cellsOf(srcLine(between))[0]).toBe('Sync conflicts')
    const rows = walkTable(XSURFACE_SEPARATOR)
    expect(rows).toHaveLength(26)
    expect(rows.some((r) => r.line === between)).toBe(true)
  })

  // FAILS IF: the grant and the prohibition are read as the same record, or
  // the boundary is disclosed as a contradiction. The two cells are asserted
  // to carry DIFFERENT tokens on DIFFERENT record types — a check that would
  // be satisfied by neither if the rows were conflated.
  // PLANTED: set `isContradiction: true` in `lane-b.ts`. RED.
  it('is a boundary between two record types, not a contradiction', () => {
    expect(CC06_CONFIGURATION_BOUNDARY.isContradiction).toBe(false)
    const ccIndex = columnIndex(XSURFACE_HEADER, 'Client Command Center')
    const grant = bare(cellsOf(srcLine(CC06_GRANTING_ROW_LINE))[ccIndex] ?? '')
    const prohibit = bare(cellsOf(srcLine(CC06_PROHIBITING_ROW_LINE))[ccIndex] ?? '')
    expect(grant.split(' — ')[0]).toBe('Allowed with conditions')
    expect(prohibit.split(' — ')[0]).toBe('Explicitly prohibited')
    expect(cellsOf(srcLine(CC06_GRANTING_ROW_LINE))[0]).not.toBe(
      cellsOf(srcLine(CC06_PROHIBITING_ROW_LINE))[0],
    )
  })

  // FAILS IF: the criterion that reconciles them is misquoted or moves. The
  // expected text is read OFF the source line, not written down here twice.
  // PLANTED: changed `criterionLine` to 35471, which carries AC-CC-061.
  // RED — the identifier assertion.
  it('cites AC-CC-060 at the line that carries it, with its own words', () => {
    const line = srcLine(CC06_CONFIGURATION_BOUNDARY.criterionLine)
    expect(line).toContain('`AC-CC-060`')
    expect(line).toContain(CC06_CONFIGURATION_BOUNDARY.criterionText)
    for (const also of CC06_CONFIGURATION_BOUNDARY.alsoStatedAt) {
      expect(srcLine(also).toLowerCase()).toContain('configuration')
    }
    expect(srcLine(35462)).toContain('exactly one outbound arrow into configuration')
    expect(srcLine(37387)).toContain('writes the only outbound configuration path')
  })
})

describe('the Lane B application path itself', () => {
  // FAILS IF: the path stops existing, or an outcome stops naming its source
  // line. This is the gate the whole trap turns on: a module built from the
  // prohibition alone has no path, and every other gate here still passes.
  // PLANTED: made `ccLaneBApplication` return the not-decidable arm for every
  // input. RED — both applying arms.
  it('lands an approved change on exactly one of two paths, each with its lines', () => {
    const pkg = ccLaneBApplication('package-borne')
    const srv = ccLaneBApplication('server-only')
    expect(pkg.kind).toBe('applies')
    expect(srv.kind).toBe('applies')
    if (pkg.kind !== 'applies' || srv.kind !== 'applies') throw new Error('unreachable')
    expect(pkg.steps.length).toBeGreaterThan(0)
    expect(srv.steps.length).toBeGreaterThan(0)
    for (const outcome of [pkg, srv]) {
      for (const step of outcome.steps) {
        const line = srcLine(Number(step.sourceRef.slice(1)))
        expect(isTableRow(line)).toBe(false)
        expect(line.length).toBeGreaterThan(0)
      }
      expect(srcLine(37437)).toContain(outcome.terminalSafeState)
    }
    // The two landings differ, and they differ where the source says.
    expect(srcLine(37321)).toContain('auto-publishes a patch version')
    expect(srcLine(37322)).toContain('applies immediately')
    expect(pkg.steps.map((s) => s.sourceRef)).toContain('L37321')
    expect(srv.steps.map((s) => s.sourceRef)).toContain('L37322')
    expect(pkg.steps.map((s) => s.sourceRef)).not.toContain('L37322')
  })

  // FAILS IF: an unenumerated field is given a landing. The refusal is
  // `FUNC-CC-0604-3-1` and `AC-CC-268`, and the source calls it a deliberate
  // refusal to invent a contractual behaviour.
  // PLANTED: made the 'not-enumerated' branch fall through to the
  // server-only arm. RED — `kind` was 'applies'.
  it('refuses a landing where DEC-PKGFIELD-001 leaves the field unassigned', () => {
    const out = ccLaneBApplication('not-enumerated')
    expect(out.kind).toBe('not-decidable')
    if (out.kind !== 'not-decidable') throw new Error('unreachable')
    expect(out.openDecision).toBe('DEC-PKGFIELD-001')
    expect(out.missingElement.trim().length).toBeGreaterThan(0)
    expect(srcLine(37431)).toContain('FUNC-CC-0604-3-1')
    expect(srcLine(37431)).toContain('not decidable')
    expect(srcLine(37449)).toContain('`AC-CC-268`')
    expect(srcLine(37286)).toContain('`DEC-PKGFIELD-001`')
    // The vocabulary is closed and the third member is not a third landing.
    expect(CC06_PACKAGE_TESTS).toHaveLength(3)
    expect(CC06_PACKAGE_TESTS.filter((t) => ccLaneBApplication(t).kind === 'applies')).toHaveLength(
      2,
    )
  })

  // FAILS IF: an approval is rendered as an effect. Two source lines bind it
  // in the same direction and both are read.
  // PLANTED: changed `neverRenderedAs` to 'distributing'. RED.
  it('never promotes an approval whose publication has not completed', () => {
    // The two lines bind the same rule and do NOT use the same words: L37404
    // writes "never as in force" and L37333 writes "rather than showing the
    // change as in force". A gate asserting the first sentence across both
    // asserts a sentence one of them does not carry, and finds one.
    expect(srcLine(37404)).toContain('never as in force')
    expect(srcLine(37404)).toContain('an approval is not an effect')
    expect(srcLine(37333)).toContain('rather than showing the change as in force')
    expect(srcLine(37437)).toContain('not as an effect')
    expect(CC06_APPROVED_NOT_PUBLISHED.neverRenderedAs).toBe('in force')
    // The state is named two ways across the three lines, and both spellings
    // are carried. A gate asserting either one alone across all three finds
    // two of three — which is how the second spelling was found.
    for (const ref of CC06_APPROVED_NOT_PUBLISHED.sourceRefs) {
      const line = srcLine(Number(ref.slice(1)))
      expect(
        line.includes(CC06_APPROVED_NOT_PUBLISHED.state) ||
          line.includes(CC06_APPROVED_NOT_PUBLISHED.alsoNamed),
        ref,
      ).toBe(true)
    }
    expect(srcLine(37333)).toContain(CC06_APPROVED_NOT_PUBLISHED.alsoNamed)
    expect(srcLine(37333)).not.toContain(CC06_APPROVED_NOT_PUBLISHED.state)
    expect(srcLine(37404)).toContain(CC06_APPROVED_NOT_PUBLISHED.state)
    expect(srcLine(37437)).toContain(CC06_APPROVED_NOT_PUBLISHED.state)
  })
})

describe('aging, and the freshness obligation it is read from', () => {
  // FAILS IF: the stale horizon or the never-expire rule drifts, or the
  // marker obligation is restated locally instead of read from §21.3's table.
  // PLANTED: changed `staleAfterDays` to 60. RED.
  it('flags stale at thirty days and never expires, off the source', () => {
    expect(srcLine(37273)).toContain(`after ${CC06_AGING.staleAfterDays} days`)
    expect(srcLine(37273)).toContain('never silently expire')
    expect(CC06_AGING.expires).toBe(false)
    expect(srcLine(37423)).toContain('Never expire a proposal')
    expect(srcLine(37444)).toContain('`AC-CC-263`')
  })

  // FAILS IF: the element assignment is copied rather than consumed, so a
  // change to §21.3's table would not reach this module.
  // PLANTED: changed `CC06_AGING.elementName` to 'Gate item arrival', which
  // is a real row of the same table belonging to another module.
  // RED — the module-ownership assertion.
  it('reads its marker obligation from the assignment table, not from itself', () => {
    const a = ccElementAssignment(CC06_AGING.elementName)
    expect(a.modules).toEqual([CC06_MODULE.id])
    expect(a.freshnessClass).toBe('pushed')
    const line = srcLine(Number(a.sourceRef.slice(1)))
    expect(cellsOf(line)[0]).toBe(a.element)
    expect(line).toContain(String(CC06_AGING.staleAfterDays))
  })
})

describe('where another table answers one of these rows differently', () => {
  // FAILS IF: a divergence's statements stop matching the foreign tables, or
  // a reading is quietly adopted. Every statement is re-read at its own line
  // rather than trusted from the record's own text — an allowance taking its
  // allowed string from the value under test is a catalogued beaten gate.
  // PLANTED: changed the L48446 statement's text in `lane-b.ts` from
  // 'Read-only' to 'Explicitly prohibited'. RED.
  it('reads every statement back off its own line', () => {
    expect(CC06_DIVERGENCES.length).toBeGreaterThan(0)
    for (const d of CC06_DIVERGENCES) {
      expect(d.readings).toHaveLength(2)
      for (const s of d.statements) {
        expect(bare(srcLine(s.line)), `L${s.line}`).toContain(s.text)
      }
      for (const r of d.readings) {
        expect(r.locator).toMatch(/L\d{4,6}/)
        expect(r).not.toHaveProperty('adopted')
        expect(r).not.toHaveProperty('preferred')
      }
    }
  })

  // FAILS IF: the Supervisor's four §21.9 rows are read as one, or the
  // decomposition is reconciled into a verdict. §21.1.2's single cell carries
  // BOTH halves and §21.16's carries neither; the two action-keyed tables
  // disagree with each other. All four are asserted at their own lines,
  // header-keyed on each table's own header.
  // PLANTED: deleted the second reading from the decomposition record,
  // leaving a one-element array. RED — the `toHaveLength(2)` above and the
  // type error the fixed-length tuple raises.
  it('carries all four statements of the Supervisor’s standing, none chosen', () => {
    const sup21_1_2 = cellsOf(srcLine(35009))[columnIndex(35002, 'Supervisor')]
    const sup21_16 = cellsOf(srcLine(38684))[columnIndex(38680, 'Supervisor')]
    const sup25_4 = cellsOf(srcLine(48446))[columnIndex(48442, 'Supervisor')]
    expect(sup21_1_2).toBe('Read-only — observe and annotate')
    expect(sup21_16).toBe('Explicitly prohibited')
    expect(sup25_4).toBe('Read-only')
    // Not the same string, so the two `Read-only` statements are not a repeat.
    expect(sup21_1_2).not.toBe(sup25_4)
    // And §21.9 decomposes the same act across four of its own rows.
    expect(cc06Row(1).cells.Supervisor.token).toBe('Read-only')
    expect(cc06Row(2).cells.Supervisor.token).toBe('Allowed with conditions')
    expect(cc06Row(3).cells.Supervisor.token).toBe('Explicitly prohibited')
    expect(cc06Row(4).cells.Supervisor.token).toBe('Explicitly prohibited')
    expect(srcLine(37271)).toContain('Supervisors observe and annotate')
  })
})

describe('the two decisions, and how they stand to the shared canon', () => {
  // FAILS IF: DEC-PKGFIELD-001 is lifted into the canon and this module keeps
  // a second spelling of it. The absence is the whole reason for a local
  // disclosure, so the gate asserts the absence rather than the presence.
  // PLANTED: changed `CC06_PKGFIELD_DISCLOSURE.decisionRef` to
  // 'DEC-LANEB-001', which IS in the canon. RED.
  it('discloses DEC-PKGFIELD-001 locally because the canon has no record', () => {
    const canonIds = OPEN_DECISIONS.map((d) => String(d.id))
    expect(canonIds).not.toContain(CC06_PKGFIELD_DISCLOSURE.decisionRef)
    expect(CC06_PKGFIELD_DISCLOSURE.readings).toHaveLength(2)
    // And this surface's own local register is not extended by this module.
    expect(CC_LOCAL_DISCLOSURES.map((d) => String(d.decisionRef))).not.toContain(
      CC06_PKGFIELD_DISCLOSURE.decisionRef,
    )
    for (const ref of CC06_PKGFIELD_DISCLOSURE.sourceRefs) {
      expect(srcLine(Number(ref.slice(1))).length).toBeGreaterThan(0)
    }
    expect(srcLine(37286)).toContain('does not enumerate it')
  })

  // FAILS IF: DEC-LANEB-001 is respelled here instead of pointed at, or the
  // canon record's adopted text is imported as §21.9's. The canon's record
  // names a third value class that §21.9's own option (c) does not, and the
  // difference is read off both lines at test time.
  // PLANTED: removed the `chapter21Line` field's use by pointing it at
  // L33253, the Studio card. RED — the "gate rule" asymmetry.
  it('points at the canon for DEC-LANEB-001 and records what §21.9 states differently', () => {
    const canonIds = OPEN_DECISIONS.map((d) => String(d.id))
    expect(canonIds).toContain(CC06_LANEB_STANDING.decisionRef)
    expect(CC06_LANEB_STANDING.inSharedCanon).toBe(true)
    const ch21 = srcLine(CC06_LANEB_STANDING.chapter21Line)
    const studio = srcLine(CC06_LANEB_STANDING.studioCardLine)
    expect(ch21).toContain('`DEC-LANEB-001`')
    expect(studio).toContain('`DEC-LANEB-001`')
    expect(ch21).toContain(`Recommendation: ${CC06_LANEB_STANDING.chapter21Recommendation}`)
    expect(ch21).toContain(CC06_LANEB_STANDING.chapter21Owner)
    // The asymmetry itself: one line names a gate rule and the other does not.
    expect(studio).toContain('gate rule')
    expect(ch21).not.toContain('gate rule')
    // §21.9 leaves it open; a recommendation is not an adoption.
    expect(srcLine(37467)).toContain('`DEC-LANEB-001` (`Client Decision Required`)')
  })
})

describe('the boundary with SCR-CC-13, which is another module’s route', () => {
  // FAILS IF: this module claims the shared screen's route, or the register
  // row it appears on stops naming it. The owning module is read from the
  // spine and the register row from the source.
  // PLANTED: set `routeBuiltHere: true` in `lane-b.ts` and created
  // `app/command-center/learning-read-view/page.tsx` — reverted, and the
  // directory removed. RED on the route-ownership assertion.
  it('appears on SCR-CC-13 and builds no route for it', () => {
    expect(CC06_SHARED_SCREEN_BOUNDARY.routeBuiltHere).toBe(false)
    expect(CC06_SHARED_SCREEN.owningModule).toBe(CC06_SHARED_SCREEN_BOUNDARY.routeOwnedBy)
    expect(CC06_SHARED_SCREEN.owningModule).not.toBe(CC06_MODULE.id)
    const register = srcLine(CC06_SHARED_SCREEN_BOUNDARY.registerLine)
    expect(cellsOf(register)[0]).toBe(CC06_SHARED_SCREEN.id)
    expect(register).toContain(CC06_SHARED_SCREEN_BOUNDARY.registerModulesShown)
    // And this task built no directory under that slug.
    const built = readdirSync(join(process.cwd(), 'app', 'command-center'), {
      withFileTypes: true,
    })
      // `isForeignProbe` is required in every directory walk in this build:
      // concurrent suites plant scratch probes on the real filesystem to prove
      // their own gates can fail, and a walk that lists one either counts it as
      // a route or ENOENTs on it the moment its owner's `finally` removes it.
      // `tests/coverage/prohibited-patterns.test.ts` caught this walk.
      .filter((e) => !isForeignProbe(e.name))
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
    expect(built).toContain(CC06_SLUG)
    // NOTHING HERE ASSERTS THE ABSENCE OF `learning-read-view`. A first
    // draft did, and it went red the moment the task that owns MOD-CC-07
    // landed it — correctly, and it was this suite that was wrong. A gate
    // over another task's directory fails on their success; what this module
    // owes is that ITS route is built under ITS slug and that the shared
    // screen's owner is not this module, both of which are asserted above.
  })

  // FAILS IF: the abstention stops being declared. `Cc06LearningReadView`
  // reaches no route TODAY, on purpose, and that is the exact position
  // `src/surfaces/cc/modules/cc-10-s366/` was left in for a whole slice — the
  // difference between a stated abstention and an oversight is that the
  // statement names the mounting module and the import path, so the task that
  // owns the route can act on it without reading this file. Both are checked
  // here so the declaration cannot rot into prose.
  // PLANTED: emptied `whatThisModuleSupplies` to 'A component.'. RED.
  it('declares who mounts the learning read view, and by what path', () => {
    const declared = CC06_SHARED_SCREEN_BOUNDARY.whatThisModuleSupplies
    expect(declared).toContain('Cc06LearningReadView')
    expect(declared).toContain(CC06_SHARED_SCREEN_BOUNDARY.routeOwnedBy)
    expect(declared).toContain('app/command-center/learning-read-view/')
    const header = readFileSync(
      join(process.cwd(), 'src', 'surfaces', 'cc', 'modules', 'cc-06', 'LearningReadView.tsx'),
      'utf8',
    )
    expect(header).toContain('@/surfaces/cc/modules/cc-06/LearningReadView')
    expect(header).toContain('cc-10-s366')
  })

  // FAILS IF: the register's feature reference is silently reconciled with
  // the card's feature list. The register names FEAT-CC-0603; §21.9's feature
  // list calls that Aging, and the learning read view is FEAT-CC-0605. Both
  // headings are read at their own lines.
  // PLANTED: changed the second feature reading's locator to name L37420 as
  // the learning read view's heading. RED.
  it('records both readings of which feature the register names', () => {
    expect(CC06_SHARED_SCREEN_BOUNDARY.featureReadings).toHaveLength(2)
    expect(srcLine(37420)).toContain('`FEAT-CC-0603` — Aging')
    expect(srcLine(37432)).toContain('`FEAT-CC-0605` — The learning read view')
    expect(srcLine(CC06_SHARED_SCREEN_BOUNDARY.registerLine)).toContain('FEAT-CC-0603')
    expect(srcLine(CC06_SHARED_SCREEN_BOUNDARY.registerLine)).not.toContain('FEAT-CC-0605')
    // The screen's own purpose is FUNC-CC-0605-1-1's own words.
    expect(srcLine(37434)).toContain('what the platform has learned, changing nothing')
    expect(CC06_SHARED_SCREEN.purpose).toContain('what the platform has learned, changing nothing')
    // And the four things the view renders are the source's four, matched
    // against the FUNCTIONALITY line rather than the prose — the two state
    // the same four in different words and a check written against the prose
    // finds three of four on the line a screen actually renders from.
    expect(CC06_LEARNING_VIEW_CONTENT).toHaveLength(4)
    for (const item of CC06_LEARNING_VIEW_CONTENT) {
      const words = item.replace(/^The /, '').toLowerCase()
      expect(srcLine(CC06_LEARNING_VIEW_PROSE_VARIANT.functionalityLine).toLowerCase()).toContain(
        words,
      )
    }
    // The variant is recorded, not normalised: the prose carries the other
    // wording and does not carry the functionality's.
    const prose = srcLine(CC06_LEARNING_VIEW_PROSE_VARIANT.proseLine).toLowerCase()
    expect(prose).toContain(CC06_LEARNING_VIEW_PROSE_VARIANT.proseWording)
    expect(prose).not.toContain(CC06_LEARNING_VIEW_PROSE_VARIANT.differingItem.toLowerCase())
  })

  // FAILS IF: a learning on-off switch is ever offered. Roles prohibited:
  // every role, which is what makes this a functionality rather than a note.
  // PLANTED: set `CC06_NO_SWITCH.exists` to true. RED.
  it('offers no learning on-off switch and says why', () => {
    expect(CC06_NO_SWITCH.exists).toBe(false)
    expect(srcLine(37435)).toContain('Offer no learning on-off switch anywhere')
    expect(srcLine(37450)).toContain('No learning on-off switch exists on this surface')
    expect(cc06Cell(6, 'Tenant Admin').note).toBe('no such switch exists')
    for (const column of CC06_COLUMNS) {
      expect(cc06Cell(6, column).token).toBe('Explicitly prohibited')
    }
  })
})

describe('row 7 renders a link and not an absence', () => {
  // FAILS IF: the link-out cell this module depends on stops existing or
  // stops matching the source row. Task 5 owns the cell; this asserts the
  // dependency rather than re-spelling it.
  // PLANTED: changed `CC06_LINK_OUT_CELL_ID` to 'cc-05-gate-policy', a real
  // cell of another module. RED — the module-id assertion.
  it('depends on the registered cell, and that cell matches its source row', () => {
    const cell = CC_LINK_OUT_CELLS.find((c) => c.id === CC06_LINK_OUT_CELL_ID)
    expect(cell, `${CC06_LINK_OUT_CELL_ID} is not registered`).toBeTruthy()
    if (cell === undefined) throw new Error('unreachable')
    expect(cell.moduleId).toBe(CC06_MODULE.id)
    expect(cell.line).toBe(Number(cc06Row(CC06_ROW_HELD_ELSEWHERE).sourceRef.slice(1)))
    expect(cell.rowText).toBe(srcLine(cell.line))
    expect(cellTextOf(cell)).toBe(cc06Cell(CC06_ROW_HELD_ELSEWHERE, 'Tenant Admin').text)
    expect(cell.sourceRequires).toBe('link')
    expect(cell.writeControlWouldDraw).toBe('absent')
  })

  // FAILS IF: a row whose note names no destination is treated as a link-out.
  // Rows 6 and 8 carry notes too and neither names a place a person may go.
  // PLANTED: set `CC06_ROW_HELD_ELSEWHERE` to 6. RED — the cell lookup.
  it('names row 7 alone, though three rows carry a Tenant Admin note', () => {
    const noted = CC06_MATRIX.filter((r) => r.cells['Tenant Admin'].note !== null)
    expect(noted.map((r) => r.ordinal)).toEqual([6, 7, 8])
    const registered = CC_LINK_OUT_CELLS.filter((c) => c.moduleId === CC06_MODULE.id)
    expect(registered.map((c) => c.line)).toEqual([
      Number(cc06Row(CC06_ROW_HELD_ELSEWHERE).sourceRef.slice(1)),
    ])
  })
})

describe('the route, the slug and this module’s own reachability', () => {
  const ROUTE = join(process.cwd(), 'app', 'command-center', CC06_SLUG, 'page.tsx')
  const routeText = (): string => readFileSync(ROUTE, 'utf8')

  // FAILS IF: the directory name drifts from the spine's slug, which is what
  // "declared, not built" means when it goes wrong.
  // PLANTED: renamed the route directory to `learned-change-approval`.
  // RED — ENOENT on the read.
  it('is built under the slug the spine declares', () => {
    expect(CC06_MODULE.slug).toBe(CC06_SLUG)
    expect(statSync(ROUTE).isFile()).toBe(true)
    expect(CC06_SCREEN.owningModule).toBe(CC06_MODULE.id)
    expect(srcLine(Number(CC06_SCREEN.registerRef.slice(1)))).toContain('MOD-CC-06 all features')
  })

  // FAILS IF: the page never says what module it is. A module demonstrated by
  // its slug claim alone can ship without ever naming itself, and a check for
  // the identifier anywhere in the file is satisfied by any quotation that
  // lists it — so the occurrence must sit on a line naming no OTHER
  // `MOD-CC-*`.
  // PLANTED: deleted every line of the route naming MOD-CC-06 except one
  // reading "L38793 names MOD-CC-03 MOD-CC-04 MOD-CC-05 MOD-CC-06 …".
  // RED — no qualifying line remained.
  it('names MOD-CC-06 on a line naming no other Command Center module', () => {
    const qualifying = routeText()
      .split('\n')
      .filter((l) => l.includes('MOD-CC-06'))
      .filter((l) => (l.match(/MOD-CC-\d+/g) ?? []).every((m) => m === 'MOD-CC-06'))
    expect(qualifying.length).toBeGreaterThan(0)
  })

  // FAILS IF: this module's components reach no page — the `cc-10-s366`
  // shape, which shipped slice 8's best disclosure to nothing at all. The
  // scan reads `import` statements over multiple lines: a regex requiring
  // `from` on the `import` line cannot see a multi-line import and a
  // reachability check that under-reports goes green on a broken chain.
  // PLANTED: replaced the `LearnedChangeApprovals` import in the route with a
  // local stub. RED.
  it('is imported by a page under app/', () => {
    const files: string[] = []
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (isForeignProbe(entry.name)) continue
        const p = join(dir, entry.name)
        if (entry.isDirectory()) walk(p)
        else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) files.push(p)
      }
    }
    walk(join(process.cwd(), 'app'))
    const appText = files.map((f) => readFileSync(f, 'utf8')).join('\n')
    const imported = new Set(
      [...appText.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1] as string),
    )
    expect(imported).toContain('@/surfaces/cc/modules/cc-06/LearnedChangeApprovals')
    expect(imported).toContain('@/surfaces/cc/modules/cc-06/matrix')
  })

  // FAILS IF: the rail is not mounted, or the wrong rail is. Two rails exist
  // deliberately; L38793 names this module's screen among those that exercise
  // one or more of the ten, and gives it action 3.
  // PLANTED: swapped `Cc13ActionRail` for `ActionRail` from
  // `src/surfaces/cc/actions/ActionRail.tsx`. RED.
  it('mounts MOD-CC-13’s control rail, and the source names this screen', () => {
    const text = routeText()
    expect(text).toContain('@/surfaces/cc/modules/cc-13/Cc13ActionRail')
    expect(text).not.toContain('@/surfaces/cc/actions/ActionRail')
    expect(text).toContain('actionRail=')
    expect(srcLine(38793)).toContain('`MOD-CC-06` for 3')
    const here = CC13_EXERCISED_ON.find((s) => s.module === CC06_MODULE.id)
    expect(here, 'L38793 names this module and the rail model does not').toBeTruthy()
    expect(here?.ordinals).toEqual([3])
    expect(srcLine(37387)).toContain('exercises action 3 of `MOD-CC-13`')
  })

  // FAILS IF: a closed vocabulary in this module loses its `as const
  // satisfies`, which the release gate has caught eighteen times across two
  // slices. Asserted over this module's own files rather than trusted.
  // PLANTED: changed `CC06_TOKENS`'s tail to `: readonly string[]` with a
  // leading annotation. RED.
  it('closes every vocabulary with `as const satisfies`', () => {
    const dir = join(process.cwd(), 'src', 'surfaces', 'cc', 'modules', 'cc-06')
    for (const name of readdirSync(dir)) {
      if (!name.endsWith('.ts') && !name.endsWith('.tsx')) continue
      const text = readFileSync(join(dir, name), 'utf8')
      for (const m of text.matchAll(/^export const (CC06_[A-Z0-9_]+)(:[^=]*)?=/gm)) {
        const annotation = m[2] ?? ''
        expect(annotation, `${name} · ${m[1] as string}`).not.toMatch(/readonly\s+\w+\[\]/)
      }
    }
  })
})
