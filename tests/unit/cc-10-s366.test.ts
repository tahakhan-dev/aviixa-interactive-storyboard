import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { isForeignProbe, ownProbeDir, withPlanted } from '../probe-paths'
import { OPEN_DECISION_IDS } from '@/disclosure/decisions'
import { FLA4_DECISIONS_NOT_IN_THE_SHARED_CANON } from '@/frontline/modules/fl-a4/service'
import { B9_DISCLOSURES } from '@/frontline/modules/fl-b9/service'
import { B11_DISCLOSURES } from '@/frontline/modules/fl-b11/service'
import type { PermissionOutcome } from '@/policy/decision'
import {
  DEC_PLUS_001_DISCLOSED_ELSEWHERE,
  S366_COLUMNS,
  S366_COLUMN_ROLES,
  S366_DIVERGENCES,
  S366_FINDINGS,
  S366_HEADER_CELLS,
  S366_MATRIX_SHAPE,
  S366_POINTER_CELLS,
  S366_ROWS,
  S366_TOKEN_TALLY,
  s366Row,
  type S366Column,
} from '@/surfaces/cc/modules/cc-10-s366/matrix'

/**
 * `MOD-CC-10`'s §36.6 treatment against the FROZEN SOURCE, never against the
 * brief. The dispatch brief carried one locator this file corrects: it
 * attributes "the prose says only that 'the reviewer' flags it" to L80497.
 * That sentence is at L80496; L80497 is the next rule and a different one.
 * Both lines are opened here and both are asserted, because a note is what
 * the wrong attribution already was.
 *
 * EVERY GATE IN THIS FILE WAS PLANTED AND WATCHED GO RED before it was left
 * green — one defect per gate, in the shipping files this module owns, then
 * the file restored byte-identically. The `FAILS IF` note on each names the
 * defect that was actually planted, not one that would have been convenient.
 *
 * THE COUNTS ARE COUNTED, NOT INFERRED FROM A SPAN. Every row count, column
 * count and token tally below is derived by parsing the frozen source at run
 * time and comparing; none is a literal copied from a brief, and none is a
 * `toEqual([...IMPORTED_CONSTANT])` tautology.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')
const srcLine = (n: number): string => SOURCE_LINES[n - 1] ?? ''
const isTableRow = (n: number): boolean => srcLine(n).startsWith('|')
const cellsOf = (n: number): readonly string[] =>
  srcLine(n)
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim())

/** A data line read HEADER-KEYED: column name to cell text, never by index. */
const byHeader = (headerLine: number, dataLine: number): Readonly<Record<string, string>> => {
  const keys = cellsOf(headerLine)
  const values = cellsOf(dataLine)
  expect(values, `L${dataLine} against header L${headerLine}`).toHaveLength(keys.length)
  return Object.fromEntries(keys.map((k, i) => [k, values[i] ?? '']))
}

/**
 * The closed-set token a cell declares. §36.6 backticks it and chapter 21
 * does not, so both forms are handled — and the backtick pair is what stops
 * `Allowed` from matching the first word of `Allowed with conditions`, which
 * is a trap this build has already shipped once.
 */
const tokenOf = (cell: string): string => {
  const ticked = /^`([^`]+)`/.exec(cell)
  if (ticked !== null) return ticked[1] ?? ''
  return (cell.split(' — ')[0] ?? '').trim()
}

/** THE TEST'S OWN table, not the module's. Importing the module's would be circular. */
const TOKEN_TO_OUTCOME: Readonly<Record<string, PermissionOutcome>> = {
  Allowed: 'allowed',
  'Allowed with conditions': 'allowedWithConditions',
  'Read-only': 'readOnly',
  'Explicitly prohibited': 'explicitlyProhibited',
}

const S366_HEADER = 80547
const S366_SEPARATOR = 80548
const S366_FIRST = 80549
const S366_LAST = 80557

/** The OTHER treatment's matrix, read off the source — never off task 12's file. */
const CH21_HEADER = 38082
const CH21_FIRST = 38084
const CH21_LAST = 38091

const MODULE_DIR = join(process.cwd(), 'src', 'surfaces', 'cc', 'modules', 'cc-10-s366')
const MATRIX_PATH = join(MODULE_DIR, 'matrix.ts')
const COMPONENT_PATH = join(MODULE_DIR, 'SecondTreatmentDisclosure.tsx')
const MATRIX_TEXT = readFileSync(MATRIX_PATH, 'utf8')
const COMPONENT_TEXT = readFileSync(COMPONENT_PATH, 'utf8')

/**
 * Letters and digits only, lower-cased. Prose pasted from one TypeScript file
 * into another arrives split across lines, wrapped in quotes and joined with
 * `+`, so a plain substring search cannot find it. Squashing removes every one
 * of those seams and leaves the words, which is the thing that must not be
 * duplicated.
 */
const squash = (s: string): string => s.replace(/[^a-z0-9]+/gi, '').toLowerCase()

/* ==================================================================== *
 * THE MATRIX'S SHAPE, COUNTED OFF THE SOURCE.
 * ==================================================================== */

describe('the §36.6 matrix shape', () => {
  // FAILS IF: a row is gained or lost, or the body is read from a span rather
  // than counted. Planted: a tenth row appended to S366_ROWS, duplicating row
  // 9 under a source reference one line past the end of the body. Went red on
  // the count, on the per-row source walk, and on the tally.
  it('is six columns and nine data rows at L80547-L80557, counted', () => {
    expect(cellsOf(S366_HEADER)).toHaveLength(6)
    expect(srcLine(S366_SEPARATOR)).toBe('|---|---|---|---|---|---|')
    expect(isTableRow(S366_LAST)).toBe(true)
    // where the body actually stops, which is what a span does not say
    expect(isTableRow(S366_LAST + 1)).toBe(false)
    // and where it actually starts
    expect(isTableRow(S366_HEADER - 1)).toBe(false)

    let counted = 0
    for (let n = S366_FIRST; isTableRow(n); n += 1) counted += 1
    expect(counted).toBe(9)

    expect(S366_ROWS).toHaveLength(counted)
    expect(S366_MATRIX_SHAPE.rows).toBe(counted)
    expect(S366_MATRIX_SHAPE.columns).toBe(cellsOf(S366_HEADER).length)
    expect(S366_MATRIX_SHAPE.personaColumns).toBe(cellsOf(S366_HEADER).length - 1)
    expect(S366_MATRIX_SHAPE.firstDataLine).toBe(S366_FIRST)
    expect(S366_MATRIX_SHAPE.lastDataLine).toBe(S366_LAST)
  })

  // FAILS IF: the header is transcribed in the wrong order, or a persona
  // column is invented or dropped. Planted: 'Tenant Admin' and 'Worker' swapped
  // in S366_HEADER_CELLS. Went red on the first assertion.
  it('carries L80547’s six header cells in the source’s own order', () => {
    const parsed = cellsOf(S366_HEADER)
    expect([...S366_HEADER_CELLS]).toEqual(parsed)
    expect([...S366_COLUMNS]).toEqual(parsed.slice(1))
    expect(parsed[0]).toBe('Capability')
    // the five persona columns each name exactly one platform role
    expect(Object.keys(S366_COLUMN_ROLES).sort()).toEqual([...S366_COLUMNS].sort())
    expect(new Set(Object.values(S366_COLUMN_ROLES)).size).toBe(5)
  })

  // FAILS IF: the two treatments are assumed to share a column order. This is
  // the assertion the whole task turns on and it is made against BOTH source
  // lines rather than against either transcription. Planted: S366_COLUMNS
  // reordered to chapter 21's order. Went red on the module assertions at the
  // foot of this test and on the per-cell walk below.
  it('runs Worker first and Tenant Admin fourth, opposite to chapter 21', () => {
    const mine = cellsOf(S366_HEADER)
    const theirs = cellsOf(CH21_HEADER)
    expect(mine.indexOf('Worker')).toBe(1)
    expect(mine.indexOf('Tenant Admin')).toBe(4)
    expect(theirs.indexOf('Tenant Admin')).toBe(1)
    expect(theirs.indexOf('Worker')).toBe(5)
    // the same five personas, in orders that are each other's inverse on those two
    expect([...mine].slice(1).sort()).toEqual([...theirs].slice(1).sort())
    // and the capability column is not even worded the same
    expect(theirs[0]).toBe('Capability on this module')
    expect(mine[0]).not.toBe(theirs[0])

    // THE MODULE ITSELF, so the gate can fail on a transcription defect and
    // not only on the source turning out to be other than assumed. A source-
    // only assertion cannot go red for anything this task could get wrong.
    expect(S366_COLUMNS.indexOf('Worker')).toBe(0)
    expect(S366_COLUMNS.indexOf('Tenant Admin')).toBe(3)
    expect(S366_COLUMNS.indexOf('Read-only Auditor')).toBe(4)
  })
})

/* ==================================================================== *
 * EVERY CELL, HEADER-KEYED, AGAINST ITS OWN LINE.
 * ==================================================================== */

describe('the forty-five cells', () => {
  // FAILS IF: any cell is transposed, paraphrased, or loses the source's
  // backticks. Planted: row 1's Worker and Tenant Admin cells exchanged —
  // exactly the defect a positional transcription of the opposite column order
  // produces. Went red on both cells.
  it('are each verbatim from their own line, looked up by column NAME', () => {
    expect(S366_ROWS).toHaveLength(S366_LAST - S366_FIRST + 1)
    S366_ROWS.forEach((row, i) => {
      const line = S366_FIRST + i
      expect(row.sourceRef, row.id).toBe(`L${line}`)
      const parsed = byHeader(S366_HEADER, line)
      expect(row.capability, row.id).toBe(parsed['Capability'])
      for (const column of S366_COLUMNS) {
        expect(row.cells[column].verbatim, `${row.id} · ${column} · L${line}`).toBe(parsed[column])
      }
    })
  })

  // FAILS IF: a token is read onto the wrong member of the closed nine, or
  // `Allowed` is matched as a prefix of `Allowed with conditions`. Planted:
  // row 1's Tenant Admin outcome changed from allowedWithConditions to
  // allowed, leaving the verbatim untouched. Went red — the token between the
  // backticks is `Allowed with conditions`, not `Allowed`.
  it('read their token onto the closed nine, exactly and not by prefix', () => {
    for (const row of S366_ROWS) {
      for (const column of S366_COLUMNS) {
        const cell = row.cells[column]
        const token = tokenOf(cell.verbatim)
        expect(TOKEN_TO_OUTCOME[token], `${row.id} · ${column} · token "${token}"`).toBe(
          cell.outcome,
        )
      }
    }
    // the prefix trap, stated: the two tokens are distinct and one contains the other
    expect('Allowed with conditions'.startsWith('Allowed')).toBe(true)
    expect(TOKEN_TO_OUTCOME['Allowed']).not.toBe(TOKEN_TO_OUTCOME['Allowed with conditions'])
    expect(tokenOf('`Allowed with conditions` — as above')).toBe('Allowed with conditions')
  })

  // FAILS IF: the tally is asserted beside the cells rather than counted off
  // them. The expected numbers are derived HERE by parsing the frozen source,
  // so a wrong transcription and a wrong tally cannot agree with each other.
  // Planted: one Read-only Auditor cell on L80556 changed to 'allowed'. Went
  // red on explicitlyProhibited 36→35 and allowed 6→7.
  it('tally four of the platform’s nine tokens: 36 · 6 · 2 · 1', () => {
    const fromSource: Record<string, number> = {}
    for (let line = S366_FIRST; line <= S366_LAST; line += 1) {
      const parsed = byHeader(S366_HEADER, line)
      for (const column of S366_COLUMNS) {
        const outcome = TOKEN_TO_OUTCOME[tokenOf(parsed[column] ?? '')]
        expect(outcome, `L${line} · ${column}`).toBeDefined()
        if (outcome !== undefined) fromSource[outcome] = (fromSource[outcome] ?? 0) + 1
      }
    }
    expect(S366_TOKEN_TALLY).toEqual(fromSource)
    // and the arithmetic is stated, so a silent halving of both sides is visible
    expect(fromSource['explicitlyProhibited']).toBe(36)
    expect(fromSource['allowed']).toBe(6)
    expect(fromSource['allowedWithConditions']).toBe(2)
    expect(fromSource['readOnly']).toBe(1)
    expect(Object.values(fromSource).reduce((a, b) => a + b, 0)).toBe(45)
    // five of the nine tokens do not appear at all
    expect(Object.keys(fromSource)).toHaveLength(4)
  })

  // FAILS IF: an `unless additively holding …` clause is read as a grant. The
  // token stays the refusal; the clause names a different role. Planted: the
  // shared EP_UNLESS_QM outcome changed to allowedWithConditions. Went red
  // here and on the token gate above.
  it('keep the three "unless additively holding" cells as refusals', () => {
    const unless = S366_ROWS.flatMap((row) =>
      S366_COLUMNS.flatMap((column) =>
        row.cells[column].unlessAdditiveRole === null ? [] : [{ row: row.id, column }],
      ),
    )
    expect(unless).toHaveLength(3)
    for (const { row, column } of unless) {
      expect(column).toBe('Tenant Admin')
      const cell = s366Row(row).cells[column as S366Column]
      expect(cell.outcome, row).toBe('explicitlyProhibited')
      expect(cell.unlessAdditiveRole).toBe('QUALITY_MANAGER')
      expect(cell.verbatim).toContain('unless additively holding the Quality Manager role')
    }
    expect(unless.map((u) => u.row)).toEqual([
      'resolve-individual-conflict',
      'invoke-resolve-all',
      'flag-automatic-resolution-wrong',
    ])
    // and the source really does word all three identically
    const wordings = new Set(
      [80551, 80552, 80554].map((n) => byHeader(S366_HEADER, n)['Tenant Admin']),
    )
    expect(wordings.size).toBe(1)
  })
})

/* ==================================================================== *
 * THE POINTER IS NOT PERMISSION.
 * ==================================================================== */

describe('the cells that name a place outside this panel', () => {
  // FAILS IF: a cell that names where an act IS met is read as permitting it
  // here. This is the trap the task was split off to avoid. Planted: L80557's
  // Quality Manager outcome changed to 'allowed' with its verbatim untouched.
  // Went red here AND on the token gate, which is the belt-and-braces the
  // plant was run to confirm.
  it('are four, and every one of them refuses', () => {
    expect(S366_POINTER_CELLS).toHaveLength(4)
    for (const { row, column, pointer } of S366_POINTER_CELLS) {
      const cell = s366Row(row).cells[column]
      expect(cell.outcome, `${row} · ${column}`).toBe('explicitlyProhibited')
      expect(pointer.note.length).toBeGreaterThan(40)
      expect(pointer.sourceRef).toMatch(/L\d{5}/)
    }
    expect(S366_POINTER_CELLS.map((p) => `${p.row}·${p.column}`)).toEqual([
      'read-conflict-entry·Read-only Auditor',
      'edit-sync-result-directly·Quality Manager',
      'release-hold-from-this-panel·Supervisor',
      'release-hold-from-this-panel·Quality Manager',
    ])
  })

  // FAILS IF: "action 4" is cited without action 4 being hold release, or the
  // Quality Manager's five `Allowed` rows are miscounted so the collision the
  // trap turns on stops being real. Planted: the Quality Manager cell on
  // L80557 given the pointer of a different action number (5). Went red on the
  // action-4 assertion.
  it('point at action 4, which is hold release and is the Quality Manager’s elsewhere', () => {
    const action4 = srcLine(38668)
    expect(action4).toContain('Release a lot hold, including automatic Severity 1 holds')
    expect(action4).toContain('Quality Manager only — Supervisors request with a note')
    // action 5, the neighbouring row, is this panel's own act and not hold release
    expect(srcLine(38669)).toContain('Resolve or Resolve All sync conflicts')
    expect(srcLine(38669)).not.toContain('hold')

    const pointedActions = S366_POINTER_CELLS.flatMap((p) =>
      p.pointer.kind === 'operational-action' ? [p.pointer.action] : [],
    )
    expect(pointedActions).toEqual([4, 4])

    // and the collision: five `Allowed`s in the Quality Manager column, and the
    // phrase "action 4" living in one of the four rows that refuse it.
    const qmAllowed = S366_ROWS.filter((r) => r.cells['Quality Manager'].outcome === 'allowed')
    expect(qmAllowed).toHaveLength(5)
    expect(S366_ROWS).toHaveLength(9)
    expect(srcLine(80557)).toContain('action 4')
    expect(s366Row('release-hold-from-this-panel').cells['Quality Manager'].outcome).toBe(
      'explicitlyProhibited',
    )
  })

  // FAILS IF: the Read-only Auditor cell's SECOND token is read as this
  // surface's. L80550 carries two tokens; only the first is the Command
  // Center's. Planted: that cell's outcome changed to 'readOnly'. Went red
  // here and on the token gate.
  it('do not let the audit-log `Read-only` become a Command Center reading', () => {
    const cell = s366Row('read-conflict-entry').cells['Read-only Auditor']
    expect(cell.verbatim).toContain('`Read-only` in the Delivery Operations Hub audit log')
    expect(cell.outcome).toBe('explicitlyProhibited')
    expect(cell.pointsAt?.kind).toBe('another-surface')
    // the section's own rule says it without the second token
    expect(srcLine(80502)).toContain('The Read-only Auditor has no Command Center access at all')
    expect(srcLine(80502)).toContain('reads conflict history from the Delivery Operations Hub')
  })
})

/* ==================================================================== *
 * THE DIVERGENCES. BOTH LOCATORS PROVED, NEITHER CHOSEN.
 * ==================================================================== */

describe('where the two treatments disagree', () => {
  // FAILS IF: either side of a divergence cites a line that does not carry the
  // reading it is cited for — the failure mode this build has recorded eleven
  // times. Every locator is opened and read HEADER-KEYED against its OWN
  // matrix's header, so a chapter-21 locator is never read against §36.6's
  // column order.
  //
  // THE CAPABILITY CHECK IS HERE BECAUSE THE TOKEN CHECK ALONE WAS NOT A
  // GATE, and that was found by planting rather than by reading it. The first
  // version asserted only that the cited line's TOKEN appeared in the reading
  // text. Planted: the second divergence's chapter-21 locator moved from
  // L38084 to L38085 — and it stayed GREEN, because both rows refuse the
  // Tenant Admin with the same token and the gate had nothing else to compare.
  // Thirty-six of this matrix's forty-five cells carry one token, so a token
  // pins almost nothing. Re-planted with the capability assertion below: went
  // red on 'View the conflict panel' against 'See both versions, both
  // timestamps and both workers'.
  it('cite lines that really carry both readings, on both sides', () => {
    expect(S366_DIVERGENCES.length).toBeGreaterThan(0)
    for (const d of S366_DIVERGENCES) {
      const mine = [...d.here.locator.matchAll(/L(\d+)/g)].map((m) => Number(m[1]))
      const theirs = [...d.chapter21.locator.matchAll(/L(\d+)/g)].map((m) => Number(m[1]))
      expect(mine.length, d.id).toBeGreaterThan(0)
      expect(theirs.length, d.id).toBe(mine.length)
      expect(d.hereCapabilities, d.id).toHaveLength(mine.length)
      expect(d.chapter21Capabilities, d.id).toHaveLength(theirs.length)

      mine.forEach((line, i) => {
        expect(line, `${d.id} · here`).toBeGreaterThanOrEqual(S366_FIRST)
        expect(line, `${d.id} · here`).toBeLessThanOrEqual(S366_LAST)
        const row = byHeader(S366_HEADER, line)
        // WHICH ROW, and not merely which token
        expect(row['Capability'], `${d.id} · L${line}`).toBe(d.hereCapabilities[i])
        expect(d.here.text, `${d.id} · L${line} · ${d.column}`).toContain(
          tokenOf(row[d.column] ?? ''),
        )
      })
      theirs.forEach((line, i) => {
        expect(line, `${d.id} · chapter 21`).toBeGreaterThanOrEqual(CH21_FIRST)
        expect(line, `${d.id} · chapter 21`).toBeLessThanOrEqual(CH21_LAST)
        const row = byHeader(CH21_HEADER, line)
        expect(row['Capability on this module'], `${d.id} · L${line}`).toBe(
          d.chapter21Capabilities[i],
        )
        expect(d.chapter21.text, `${d.id} · L${line} · ${d.column}`).toContain(
          tokenOf(row[d.column] ?? ''),
        )
      })

      // and the two readings really are different readings
      const myTokens = mine.map((l) => tokenOf(byHeader(S366_HEADER, l)[d.column] ?? ''))
      const theirTokens = theirs.map((l) => tokenOf(byHeader(CH21_HEADER, l)[d.column] ?? ''))
      expect(myTokens, d.id).not.toEqual(theirTokens)
    }
  })

  // FAILS IF: a divergence acquires an answer. `chosen` is typed `null`, so
  // this gate is what catches a "pick" smuggled into the prose instead.
  // Planted: `whyNeitherIsChosen` on the first divergence rewritten to
  // "This build follows §36.6." Went red on the forbidden-word sweep.
  it('choose neither, in the type and in the words', () => {
    for (const d of S366_DIVERGENCES) {
      expect(d.chosen, d.id).toBeNull()
      expect(d.whyNeitherIsChosen.length, d.id).toBeGreaterThan(80)
      // the sweep's allowed strings are the test's own, never taken from the
      // value under test — a slice-7 gate shortened itself into silence that way
      for (const verdict of ['this build follows', 'we adopt', 'the correct reading is']) {
        expect(d.whyNeitherIsChosen.toLowerCase(), `${d.id} · ${verdict}`).not.toContain(verdict)
      }
    }
  })

  // FAILS IF: only the two divergences the brief named are carried, or a found
  // one is quietly relabelled as the brief's. Planted: the third divergence's
  // `namedByTheBrief` flipped to true. Went red — the brief named two and the
  // list then claimed three.
  it('are four — the brief’s two, and two more found by comparing header-keyed', () => {
    expect(S366_DIVERGENCES).toHaveLength(4)
    const named = S366_DIVERGENCES.filter((d) => d.namedByTheBrief)
    expect(named.map((d) => d.id)).toEqual([
      'supervisor-may-flag-an-automatic-resolution',
      'tenant-admin-may-see-the-panel',
    ])
    expect(S366_DIVERGENCES.filter((d) => !d.namedByTheBrief)).toHaveLength(2)

    // THE TENANT ADMIN DIVERGENCE IS TWO ROWS WIDE, and each matrix is swept
    // on its own — no row of one is paired with a row of the other, because
    // the two carry different capabilities from row 5 down and a positional
    // pairing there would be inventing correspondences. What is counted is
    // simply: in which rows is the Tenant Admin NOT refused?
    const notRefused = (header: number, first: number, last: number): number[] => {
      const lines: number[] = []
      for (let n = first; n <= last; n += 1) {
        if (tokenOf(byHeader(header, n)['Tenant Admin'] ?? '') !== 'Explicitly prohibited') {
          lines.push(n)
        }
      }
      return lines
    }
    expect(notRefused(S366_HEADER, S366_FIRST, S366_LAST)).toEqual([80549, 80550])
    expect(notRefused(CH21_HEADER, CH21_FIRST, CH21_LAST)).toEqual([])
  })

  // FAILS IF: the source's own prose is quoted from the brief rather than from
  // the line. THE BRIEF PUTS "the reviewer flags it" AT L80497 AND IT IS AT
  // L80496. Both lines are opened and both are asserted, so the correction
  // cannot be lost. Planted: this test's L80496 expectation pointed at L80497.
  // Went red — L80497 does not contain the word "reviewer" at all.
  it('record that neither line of the section’s prose settles the flag question', () => {
    expect(srcLine(80496)).toContain('A reviewer who judges an automatic resolution wrong flags it')
    expect(srcLine(80496)).not.toContain('Supervisor')
    expect(srcLine(80497)).toContain(
      'Supervisors view the panel; resolution, including Resolve All, is Quality Manager and above',
    )
    expect(srcLine(80497)).not.toContain('reviewer')
    expect(srcLine(80497)).not.toContain('flag')

    const flagDivergence = S366_DIVERGENCES.find(
      (d) => d.id === 'supervisor-may-flag-an-automatic-resolution',
    )
    expect(flagDivergence?.whyNeitherIsChosen).toContain('L80496')
    expect(flagDivergence?.whyNeitherIsChosen).toContain('L80497')
  })

  // FAILS IF: the skew rows are filed as a fifth divergence. They are not one:
  // read on their own capability wordings the two treatments agree exactly.
  // Planted: a fifth divergence added for the skew rows. Went red on the
  // length above and on this sweep.
  it('do not file the skew rows, which are a decomposition and not a conflict', () => {
    expect(byHeader(CH21_HEADER, 38088)['Capability on this module']).toBe(
      'Resolve a skew-flagged conflict',
    )
    expect(byHeader(CH21_HEADER, 38088)['Quality Manager']).toBe(
      'Allowed with conditions — individually only; never through Resolve All',
    )
    expect(byHeader(S366_HEADER, 80553)['Capability']).toBe(
      'Include a skew-flagged entry in Resolve All',
    )
    expect(byHeader(S366_HEADER, 80553)['Quality Manager']).toBe(
      '`Explicitly prohibited` — no role may do this',
    )
    // read positionally as row 5 against row 5 the two tokens contradict; read
    // on their own capability wordings they agree, because chapter 21 forbids
    // the bulk act inside its own permissive cell.
    expect(tokenOf(byHeader(CH21_HEADER, 38088)['Quality Manager'] ?? '')).toBe(
      'Allowed with conditions',
    )
    expect(tokenOf(byHeader(S366_HEADER, 80553)['Quality Manager'] ?? '')).toBe(
      'Explicitly prohibited',
    )
    for (const d of S366_DIVERGENCES) expect(d.id).not.toContain('skew')
    // and it is recorded as checked-and-not-a-divergence rather than left out
    expect(S366_FINDINGS.some((f) => f.what.includes('NOT a third disagreement'))).toBe(true)
  })
})

/* ==================================================================== *
 * `DEC-PLUS-001` IS POINTED AT, NOT RESPELLED.
 * ==================================================================== */

describe('the DEC-PLUS-001 pointer', () => {
  // FAILS IF: this module grows a fourth spelling of a decision three modules
  // already carry. The comparison squashes both sides to letters and digits,
  // so a paste split across lines, quotes and `+` is still found. Planted:
  // MOD-FL-B11's Reading A pasted into matrix.ts as a string literal. Went red.
  it('contains no copy of the readings three Frontline modules already carry', () => {
    // Their record shapes differ — MOD-FL-A4 keys on `id`, the other two on
    // `decisionRef` — so the three are read on their own field names and
    // reduced to the two this gate needs.
    const theirs = [
      ...FLA4_DECISIONS_NOT_IN_THE_SHARED_CANON.filter((d) => d.id === 'DEC-PLUS-001'),
      ...B9_DISCLOSURES.filter((d) => d.decisionRef === 'DEC-PLUS-001'),
      ...B11_DISCLOSURES.filter((d) => d.decisionRef === 'DEC-PLUS-001'),
    ].map((d) => ({ question: d.question, readings: d.readings }))
    expect(theirs).toHaveLength(3)
    const squashedMine = squash(MATRIX_TEXT)
    for (const record of theirs) {
      expect(record.readings.length).toBeGreaterThan(1)
      for (const reading of record.readings) {
        expect(squashedMine, reading.locator).not.toContain(squash(reading.text))
      }
      expect(squashedMine, record.question.slice(0, 48)).not.toContain(squash(record.question))
    }
  })

  // FAILS IF: the pointer points at nothing. A pointer naming a file that does
  // not disclose the decision is worse than no pointer. Planted: one
  // `disclosedBy` path changed to src/frontline/modules/fl-a6/service.ts,
  // which carries four disclosures and not this one. Went red.
  it('names three files that really do disclose it', () => {
    expect(DEC_PLUS_001_DISCLOSED_ELSEWHERE.disclosedBy).toHaveLength(3)
    for (const rel of DEC_PLUS_001_DISCLOSED_ELSEWHERE.disclosedBy) {
      const text = readFileSync(join(process.cwd(), rel), 'utf8')
      expect(text, rel).toContain('DEC-PLUS-001')
      expect(text, rel).toContain('readings:')
    }
  })

  // FAILS IF: this section's own statement of the decision is dropped, which
  // is the one thing the three Frontline records cannot hold. Planted: the
  // `sourceRef` moved off L80559 onto the blank line after the matrix body,
  // which is named here by description rather than by number because a
  // number in a comment is lexed as a citation and a blank line cannot
  // carry one. Went red.
  it('adds this section’s own two lines, both opened', () => {
    expect(srcLine(80559)).toContain('DEC-PLUS-001')
    expect(srcLine(80559)).toContain('five additive, non-hierarchical roles')
    expect(srcLine(80559)).toContain('Both readings are preserved')
    expect(srcLine(80601)).toContain('preserves `DEC-PLUS-001` rather than resolving it')
    expect(DEC_PLUS_001_DISCLOSED_ELSEWHERE.sourceRef).toContain('L80559')
    expect(DEC_PLUS_001_DISCLOSED_ELSEWHERE.sourceRef).toContain('L80601')
    // the lines the Frontline records cite are OTHER lines, and both are real
    expect(srcLine(39840)).toContain('DEC-PLUS-001')
    expect(srcLine(14670)).toContain('DEC-PLUS-001')
  })

  // FAILS IF: the canon absorbs DEC-PLUS-001 and this pointer outlives the gap
  // it was declared for. Built to expire. The absence is asserted of the
  // identifier THE MODULE declares, so the plant lands in a shipping file this
  // task owns rather than in decisions.ts, which is another task's. Planted:
  // `decisionRef` changed to 'DEC-LIB-001', which the canon does carry. Went red.
  it('is still absent from the decision canon', () => {
    const canon = OPEN_DECISION_IDS as readonly string[]
    expect(canon.length).toBeGreaterThan(20)
    expect(canon).not.toContain(DEC_PLUS_001_DISCLOSED_ELSEWHERE.decisionRef)
    expect(canon).not.toContain('DEC-PLUS-001')
  })
})

/* ==================================================================== *
 * THE COMPONENT HOLDS NO PROSE AND NO ROUTE.
 * ==================================================================== */

describe('the module’s own files', () => {
  // FAILS IF: a cell's words are re-spelled in the component, where a later
  // edit would "fix the wording" in the rendering and leave the transcription
  // behind. Only cells longer than forty squashed characters are used as
  // needles — a short token like `Allowed` would collide with ordinary prose
  // and make the gate fire on nothing. Planted: L80557's Quality Manager cell
  // pasted into the component as a literal. Went red.
  it('keep every cell’s words in the transcription and none in the component', () => {
    const needles = S366_ROWS.flatMap((row) =>
      S366_COLUMNS.map((c) => row.cells[c].verbatim).filter((v) => squash(v).length > 40),
    )
    expect(needles.length).toBeGreaterThanOrEqual(6)
    const squashedComponent = squash(COMPONENT_TEXT)
    for (const needle of needles) {
      expect(squashedComponent, needle.slice(0, 48)).not.toContain(squash(needle))
    }
    // and it really does read them from the transcription
    expect(COMPONENT_TEXT).toContain("from './matrix'")
  })

  // FAILS IF: the data this module exports is declared in a client module. A
  // plain object exported from a `'use client'` file and imported by a server
  // component does not cross the boundary as data — four Run Player panels
  // shipped `fl-panel-undefined` that way while every component test passed.
  // Planted: `'use client'` added at the top of the component. Went red.
  //
  // The needle is the DIRECTIVE, anchored at the start of a line, and not the
  // words: a bare substring search matched this module's own comment
  // explaining why there is no boundary, which is a gate that fires on
  // documentation rather than on a defect. The directive must be the first
  // statement of the file, so line-anchored is the whole of it.
  it('declare no client boundary anywhere in the module', () => {
    const DIRECTIVE = /^['"]use client['"]/m
    expect(DIRECTIVE.test(MATRIX_TEXT)).toBe(false)
    expect(DIRECTIVE.test(COMPONENT_TEXT)).toBe(false)
    // and the needle really does find one where one exists
    expect(DIRECTIVE.test("'use client'\n\nexport function X() {}\n")).toBe(true)
    expect(
      DIRECTIVE.test(readFileSync(join(process.cwd(), 'src/surfaces/doh/modules/doh-15/JobCloningPanel.tsx'), 'utf8')),
    ).toBe(true)
  })

  // FAILS IF: this module creates a route. `app/command-center/
  // sync-conflict-review/` is task 12's and MOD-CC-10 already claims exactly
  // one slug on the spine. The walk routes every entry through
  // `isForeignProbe` so a sibling suite's live probe is never mistaken for a
  // finding of mine, and passes its OWN probe name so the scan cannot skip the
  // very thing it plants.
  //
  // THE PLANT IS PERMANENT AND INLINE, which is what makes this gate provably
  // able to fail on every run rather than on the one afternoon it was written.
  it('build no route file, and the walk that says so really reaches', () => {
    const own = ownProbeDir('cc10s366')
    const walk = (dir: string): readonly string[] =>
      readdirSync(dir).flatMap((entry) => {
        if (isForeignProbe(entry, own)) return []
        const full = join(dir, entry)
        return statSync(full).isDirectory() ? walk(full) : [full]
      })

    const isRoute = (p: string): boolean => /[/\\](page|route|layout)\.tsx?$/.test(p)

    const files = walk(MODULE_DIR)
    expect(files.map((f) => f.slice(MODULE_DIR.length + 1)).sort()).toEqual([
      'SecondTreatmentDisclosure.tsx',
      'matrix.ts',
    ])
    expect(files.filter(isRoute)).toEqual([])

    withPlanted(
      MODULE_DIR,
      'page.tsx',
      'export default function Planted() {\n  return null\n}\n',
      (probe) => {
        expect(walk(MODULE_DIR)).toContain(probe)
        expect(walk(MODULE_DIR).filter(isRoute)).toEqual([probe])
      },
      own,
    )

    // and after the probe is gone the answer is the original one again
    expect(walk(MODULE_DIR).filter(isRoute)).toEqual([])
  })

  // FAILS IF: a closed vocabulary is declared with a leading type annotation,
  // which wins over `as const` and throws the literal members away — the exact
  // thing that lets a gate assert which rows a table holds rather than how
  // many. Planted: S366_ROWS re-declared as
  // `export const S366_ROWS: readonly S366Row[] = [`. Went red here and turned
  // the per-cell walk into a check of nothing.
  it('declare every closed vocabulary as `as const satisfies`', () => {
    for (const name of ['S366_HEADER_CELLS', 'S366_COLUMNS', 'S366_ROWS', 'S366_DIVERGENCES']) {
      expect(MATRIX_TEXT, name).toContain(`export const ${name} = [`)
      expect(MATRIX_TEXT, name).not.toContain(`export const ${name}:`)
    }
    expect(MATRIX_TEXT.match(/] as const satisfies readonly /g)?.length).toBeGreaterThanOrEqual(5)
  })
})
