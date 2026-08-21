import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROLES, type RoleId } from '@/domain/roles'
import type { FrontlineMatrixOutcome } from '@/frontline/access'
import { STOP_CLASS_ITEMS_WITHOUT_A_COMMAND_CLASS } from '@/frontline/commands'
import { FL_ACTS_HELD_ELSEWHERE, frontlineCrossSurfaceModel } from '@/frontline/cross-surface'
import {
  FL_MATRIX_SHAPE,
  TENANT_ADMIN_OPEN_CELLS,
  controlsOnActsHeldElsewhere,
  frontlineAffordance,
} from '@/frontline/matrix'
import { patternsForModule } from '@/frontline/fallbacks'
import {
  A7_CHARTER_STATEMENTS,
  A7_CHARTER_STATEMENT_IDS,
  A7_IDENTITY_CARD,
  A7_STATES,
  a7CharterStatement,
} from '@/frontline/modules/fl-a7/charter'
import {
  A7_COLUMNS,
  A7_COLUMN_POINTER_ROLE,
  A7_COLUMN_ROLES,
  A7_MATRIX_SHAPE,
  A7_ROWS,
  A7_ROW_3_ALSO_TRANSCRIBED_BY,
  A7_TENANT_ADMIN_WIPE_AUTHORITY,
  A7_TOKEN_TALLY,
  PLATFORM_ROLE_IDS,
  a7RowById,
  a7RowsFor,
} from '@/frontline/modules/fl-a7/matrix'
import {
  A7_COMMAND_CLASS_GAP,
  A7_COMPLIANCE_LOCK,
  A7_DISCLOSURES,
  A7_FUNCTIONALITIES,
  A7_FUNCTIONALITIES_NAMING_NO_PATTERN,
  A7_LOCKOUT_THRESHOLD,
  A7_MESSAGE_RENDERINGS,
  A7_OFFLINE_HONESTY,
  A7_PATTERNS_FROM_MAP,
  A7_PATTERNS_NAMED_BY_FUNCTIONALITIES,
  A7_PATTERN_DIVERGENCE,
  A7_SUSPENSION_STATES,
} from '@/frontline/modules/fl-a7/service'

/* ==================================================================== *
 * THE FROZEN SOURCE, PARSED AT RUN TIME.
 *
 * NOTHING BELOW RESTATES A CELL, A TOKEN OR A COUNT AS A LITERAL FOR THE
 * TRANSCRIPTION TO BE COMPARED AGAINST. Every expectation about the matrix
 * is PARSED out of L41295-L41305 when the test runs, so there is no second
 * copy to corrupt and the consistent-lie plant — move the claim and its
 * corroborating copy together — has nothing to move: the corroboration is
 * the blueprint, and the blueprint is read-only input this task cannot
 * write.
 *
 * A MISSING OR ALTERED SOURCE IS A HARD FAILURE, NEVER A VACUOUS PASS. The
 * hash and the line count are asserted before anything reads a line.
 * ==================================================================== */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA256 = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const SOURCE_LINE_COUNT = 122_241

const sourceBytes = readFileSync(SOURCE_PATH)
const sourceLines = ((lines: string[]) => (lines.at(-1) === '' ? lines.slice(0, -1) : lines))(
  sourceBytes.toString('utf8').split('\n'),
)

/** 1-based, the way a citation is written. */
const L = (n: number): string => {
  const line = sourceLines[n - 1]
  if (line === undefined) throw new Error(`frozen source has no line ${n}`)
  return line
}

/** One table row split into its cells, trimmed. Leading and trailing pipe dropped. */
const cellsOf = (n: number): string[] =>
  L(n)
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((c) => c.trim())

/** A cell's own words, with the source's code ticks removed and nothing else. */
const strip = (s: string): string => s.replace(/`/g, '')

/**
 * Indexing that FAILS rather than yielding `undefined`. A parse that
 * silently produced `undefined` and compared it to `undefined` is the shape
 * of a gate that cannot fail, so every index into a parsed row goes here.
 */
function at<T>(xs: readonly T[], i: number, what: string): T {
  const v = xs[i]
  if (v === undefined) throw new Error(`${what}: nothing at index ${i}`)
  return v
}

/**
 * The status token a cell opens with, mapped onto the platform's outcome
 * vocabulary. `Allowed with conditions` is tested BEFORE `Allowed` because
 * one is a prefix of the other, which is the single way this mapping can be
 * got wrong — and wave 1 found a gate defeated by exactly that prefix.
 */
const TOKEN_ORDER: readonly (readonly [string, FrontlineMatrixOutcome])[] = [
  ['Allowed with conditions', 'allowedWithConditions'],
  ['Allowed', 'allowed'],
  ['Explicitly prohibited', 'explicitlyProhibited'],
  ['Not applicable', 'notApplicable'],
  ['Client Decision Required', 'clientDecisionRequired'],
  ['Read-only', 'readOnly'],
  ['Unavailable', 'unavailable'],
]

function outcomeOf(cellText: string): FrontlineMatrixOutcome {
  const text = strip(cellText)
  for (const [token, outcome] of TOKEN_ORDER) {
    if (text.startsWith(token)) return outcome
  }
  throw new Error(`no status token recognised in cell: ${JSON.stringify(cellText)}`)
}

/**
 * Markup a prose line carries that a transcribed statement does not.
 *
 * THE QUOTE MARKS ARE NORMALISED AND THAT IS NOT COSMETIC. The source
 * writes the fixed compliance message inside STRAIGHT double quotes and a
 * transcription that renders it on screen writes curly ones, so a
 * comparison that did not fold them would report a divergence in the one
 * string this module is least allowed to get wrong — and, worse, would pass
 * if someone "fixed" it by changing the words instead.
 */
const normaliseProse = (s: string): string =>
  strip(s)
    .replace(/\*\*/g, '')
    .replace(/\[(SoW Fact|Derived Clarification|Client Decision Required)[^\]]*\]/g, '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    // Removing an inline classification tag leaves an orphan space before
    // the punctuation that followed it — `Reading A [SoW Fact — §4.2.3]:`
    // becomes `Reading A :`. Closing that gap is part of removing the
    // markup, not a separate liberty taken with the text.
    .replace(/ +([:;,.])/g, '$1')
    .trim()

/**
 * Whether `line` carries every sentence of `text`, VERBATIM AND IN ORDER.
 *
 * WHY NOT A PLAIN `toContain`, AND IT IS ONE STATEMENT'S FAULT. L41283
 * carries two bold headings INSIDE one statement — "**Identifier.**
 * `MOD-FL-A7`. **Name.** Security and Data Protection." — so the line reads
 * "Identifier. MOD-FL-A7. Name. Security and Data Protection." and no
 * transcription of the claim itself is a contiguous substring of it.
 *
 * A cursor that only moves forward is what keeps this as strong as
 * `toContain`: every fragment must appear, verbatim, after the previous
 * one. A dropped clause, a paraphrase or a reordering still fails.
 */
function carriesInOrder(line: string, text: string): boolean {
  let cursor = 0
  for (const fragment of text.split('. ').filter((f) => f.trim() !== '')) {
    const found = line.indexOf(fragment, cursor)
    if (found === -1) return false
    cursor = found + fragment.length
  }
  return true
}

/**
 * EVERY STRING THIS MODULE CAN PUT ON A SCREEN, in one collection, walked
 * by the categorical-absence gates at the foot of this file.
 *
 * IT IS ONE COLLECTION FOR A REASON WAVE 1 FOUND BY PLANTING: a gate whose
 * reach is narrower than the thing it protects is a gate that passes the
 * defect it was written for. Every record this module exports contributes
 * here, so a new field cannot escape the sweep by being new.
 */
function renderedStrings(): readonly { where: string; text: string }[] {
  const out: { where: string; text: string }[] = []
  const push = (where: string, text: string) => out.push({ where, text })

  for (const s of A7_CHARTER_STATEMENTS) push(`charter ${s.id}`, `${s.heading} ${s.text}`)
  for (const row of A7_ROWS) {
    push(`row ${row.id}`, row.control)
    push(`row ${row.id} home`, row.home.note)
    for (const column of A7_COLUMNS) push(`${row.id}.${column}`, row.cells[column].note)
  }
  for (const f of A7_FUNCTIONALITIES) push(f.id, `${f.statement} ${f.fallbackClause}`)
  for (const s of A7_SUSPENSION_STATES) {
    push(s.stateId, `${s.name} ${s.onTheDevice} ${s.exit}`)
  }
  for (const d of A7_DISCLOSURES) {
    push(d.decisionRef, `${d.question} ${d.adopted} ${d.whyHere} ${d.canonNote}`)
    for (const r of d.readings) push(`${d.decisionRef} reading`, r.text)
  }
  for (const r of A7_MESSAGE_RENDERINGS) push(`message rendering ${r.locator}`, r.where)
  push('lock', `${A7_COMPLIANCE_LOCK.description} ${A7_COMPLIANCE_LOCK.whyNotRenderedHere}`)
  push('offline', `${A7_OFFLINE_HONESTY.claim} ${A7_OFFLINE_HONESTY.whatStillWorks}`)
  push('lockout threshold', A7_LOCKOUT_THRESHOLD.note)
  push('pattern divergence', A7_PATTERN_DIVERGENCE.note)
  push('command class gap', A7_COMMAND_CLASS_GAP.note)
  push(
    'tenant admin wipe authority',
    `${A7_TENANT_ADMIN_WIPE_AUTHORITY.question} ${A7_TENANT_ADMIN_WIPE_AUTHORITY.distinctFrom}`,
  )
  push(
    'row 3 neighbour',
    `${A7_ROW_3_ALSO_TRANSCRIBED_BY.divergence} ${A7_ROW_3_ALSO_TRANSCRIBED_BY.whatOnlyThisMatrixHolds} ${A7_ROW_3_ALSO_TRANSCRIBED_BY.renderingNote}`,
  )
  for (const slug of ['profile-lite'] as const) {
    for (const row of a7RowsFor(slug)) {
      for (const column of A7_COLUMNS) {
        const a = frontlineAffordance(row, column)
        if ('note' in a) push(`${slug}.${row.id}.${column} affordance`, a.note)
        if ('line' in a) push(`${slug}.${row.id}.${column} line`, a.line)
      }
    }
  }
  return out
}

describe('the frozen source this module was transcribed from', () => {
  // FAILS IF: the blueprint is absent, truncated, or edited by so much as a
  // byte. Every parse below trusts these two lines and nothing else.
  // Planted: SOURCE_SHA256 last character flipped. Went red.
  it('is the hash-verified blueprint at its stated length', () => {
    expect(createHash('sha256').update(sourceBytes).digest('hex')).toBe(SOURCE_SHA256)
    expect(sourceLines).toHaveLength(SOURCE_LINE_COUNT)
  })
})

/* ==================================================================== *
 * THE SHAPE, AND THE ARITHMETIC THAT IS 9 × 6 AND NOT 9 × 5.
 * ==================================================================== */

describe('the shape of MOD-FL-A7’s permission matrix', () => {
  // FAILS IF: the module transcribes a span wave 0 does not hold, or wave 0
  // moves and this module does not. Planted: headerLine 41295 -> 41294.
  // Went red.
  it('agrees with wave 0’s FL_MATRIX_SHAPE row, line for line', () => {
    const waveZero = FL_MATRIX_SHAPE.find((m) => m.module === 'MOD-FL-A7')
    expect(waveZero).toBeDefined()
    expect(A7_MATRIX_SHAPE).toEqual(waveZero)
  })

  // FAILS IF: the header, separator or data span is not where the
  // transcription says. Planted: lastDataLine 41305 -> 41306, which makes
  // the row-count arithmetic and the "next line is not a row" check
  // disagree. Went red on both.
  it('finds a header, a separator and nine data rows exactly where it says', () => {
    expect(L(A7_MATRIX_SHAPE.headerLine).startsWith('| Action |')).toBe(true)
    expect(cellsOf(A7_MATRIX_SHAPE.separatorLine).every((c) => /^-+$/.test(c))).toBe(true)
    expect(A7_MATRIX_SHAPE.separatorLine).toBe(A7_MATRIX_SHAPE.headerLine + 1)
    expect(A7_MATRIX_SHAPE.firstDataLine).toBe(A7_MATRIX_SHAPE.separatorLine + 1)
    expect(A7_MATRIX_SHAPE.lastDataLine - A7_MATRIX_SHAPE.firstDataLine + 1).toBe(
      A7_MATRIX_SHAPE.rows,
    )
    expect(L(A7_MATRIX_SHAPE.lastDataLine + 1).startsWith('|')).toBe(false)
  })

  // THE SIXTH COLUMN, WHICH IS WHY THIS MODULE'S ARITHMETIC IS NOT THE
  // OTHER ELEVEN'S.
  //
  // FAILS IF: a persona column is renamed, reordered or dropped, or the
  // sixth is lost. Planted: 'Platform roles' removed from A7_COLUMNS —
  // went red on the header comparison AND on the column count, which is the
  // point of asserting both.
  it('takes its SIX persona columns verbatim from the header line', () => {
    const header = cellsOf(A7_MATRIX_SHAPE.headerLine)
    expect(at(header, 0, 'header')).toBe('Action')
    expect(header.slice(1)).toEqual([...A7_COLUMNS])
    expect(A7_COLUMNS).toHaveLength(A7_MATRIX_SHAPE.columns)
    expect(A7_MATRIX_SHAPE.columns).toBe(6)
  })

  // FAILS IF: this module is not, in fact, the only six-column matrix — in
  // which case the whole reason this file exists in its own shape is wrong.
  // Read off wave 0's twelve-row register rather than asserted.
  it('is the only Frontline matrix with a sixth persona column', () => {
    const six = FL_MATRIX_SHAPE.filter((m) => m.columns === 6)
    expect(six.map((m) => m.module)).toEqual(['MOD-FL-A7'])
    expect(FL_MATRIX_SHAPE.filter((m) => m.columns === 5)).toHaveLength(11)
  })

  // FAILS IF: a row is dropped from the transcription, or one is invented.
  // Planted: row 5 deleted. Went red on the length and on the line list.
  it('transcribes nine rows in the source’s own order', () => {
    expect(A7_ROWS).toHaveLength(9)
    const lines = A7_ROWS.map((r) => Number(r.sourceRef.slice(1)))
    expect(lines).toEqual([41297, 41298, 41299, 41300, 41301, 41302, 41303, 41304, 41305])
  })

  // THE CELL ARITHMETIC, THREE WAYS: rows × columns, the transcription's
  // own cell records, and the pipes counted in the file. All three must
  // reach FIFTY-FOUR.
  //
  // FAILS IF: a row lost its last cell — which a row count alone cannot
  // see, because nine rows is still nine rows when one of them is five
  // cells wide. Planted: the 'Platform roles' key deleted from row 8's
  // cells. TypeScript caught it first (the Record is total), and with the
  // key restored but the parse span shortened, `byParse` went red.
  it('reaches fifty-four cells by three independent counts', () => {
    const byArithmetic = A7_MATRIX_SHAPE.rows * A7_MATRIX_SHAPE.columns
    const byTranscription = A7_ROWS.reduce((n, r) => n + Object.keys(r.cells).length, 0)
    const byParse = Array.from(
      { length: A7_MATRIX_SHAPE.rows },
      (_, i) => cellsOf(A7_MATRIX_SHAPE.firstDataLine + i).length - 1,
    ).reduce((n, c) => n + c, 0)

    expect(byArithmetic).toBe(54)
    expect(byTranscription).toBe(54)
    expect(byParse).toBe(54)
    // And it is 9 × 6, not 9 × 5. 45 would be the five-column arithmetic
    // this module does NOT have, and naming it is what makes the gate fail
    // loudly rather than quietly agreeing with a wrong shape.
    expect(byArithmetic).not.toBe(45)
  })
})

/* ==================================================================== *
 * THE TRANSCRIPTION, CELL BY CELL, AGAINST THE PARSED SOURCE.
 * ==================================================================== */

describe('every cell of MOD-FL-A7’s matrix, against the frozen source', () => {
  // FAILS IF: any Action column is paraphrased, trimmed or smart-quoted.
  // Planted: row 9's control shortened to "Complete an in-flight Run".
  // Went red naming the row.
  it('carries every Action column verbatim', () => {
    for (const [i, row] of A7_ROWS.entries()) {
      const parsed = at(cellsOf(A7_MATRIX_SHAPE.firstDataLine + i), 0, `row ${i}`)
      expect(strip(parsed), row.id).toBe(row.control)
    }
  })

  // THE WHOLE CELL, BACKTICKS STRIPPED, AND NOTHING ELSE — the only reading
  // under which no cell is blank, because forty-one of the fifty-four are a
  // bare `Explicitly prohibited` with no words after the token.
  //
  // FAILS IF: a note is paraphrased, a clause is dropped, or a dash is
  // smart-quoted. Planted: row 9's Worker note truncated after "close;".
  // Went red naming row 9 and the column.
  it('carries all fifty-four cell notes verbatim', () => {
    let checked = 0
    for (const [i, row] of A7_ROWS.entries()) {
      const parsed = cellsOf(A7_MATRIX_SHAPE.firstDataLine + i)
      for (const [j, column] of A7_COLUMNS.entries()) {
        const cellText = strip(at(parsed, j + 1, `${row.id} ${column}`))
        expect(row.cells[column].note, `${row.id}.${column}`).toBe(cellText)
        checked += 1
      }
    }
    expect(checked).toBe(54)
  })

  // FAILS IF: a token is read as the wrong outcome. `Allowed with
  // conditions` is the trap — `Allowed` is a prefix of it, and a naive
  // startsWith in the wrong order maps all four AWC cells to `allowed`.
  // Planted: TOKEN_ORDER's first two entries swapped. Went red on rows 4,
  // 5, 6 and 9 — four cells, exactly the four the source holds.
  it('maps every cell to the outcome its own token names', () => {
    for (const [i, row] of A7_ROWS.entries()) {
      const parsed = cellsOf(A7_MATRIX_SHAPE.firstDataLine + i)
      for (const [j, column] of A7_COLUMNS.entries()) {
        expect(row.cells[column].outcome, `${row.id}.${column}`).toBe(
          outcomeOf(at(parsed, j + 1, `${row.id} ${column}`)),
        )
      }
    }
  })

  // THE TOKEN TALLY, COUNTED OFF THE SOURCE AND OFF THE TRANSCRIPTION
  // SEPARATELY. A row silently dropped moves one and not the other.
  //
  // FAILS IF: the tally and the parse disagree, or the tally does not sum
  // to the cell count. Planted: row 3's Platform-roles cell changed from
  // notApplicable to explicitlyProhibited — went red on the verbatim gate
  // above AND here, which is the corroboration working.
  it('tallies to fifty-four, and the tally matches the parsed source', () => {
    const fromSource: Record<string, number> = {}
    for (let i = 0; i < A7_MATRIX_SHAPE.rows; i += 1) {
      const parsed = cellsOf(A7_MATRIX_SHAPE.firstDataLine + i)
      for (let j = 1; j <= A7_MATRIX_SHAPE.columns; j += 1) {
        const outcome = outcomeOf(at(parsed, j, `row ${i} cell ${j}`))
        fromSource[outcome] = (fromSource[outcome] ?? 0) + 1
      }
    }
    expect(A7_TOKEN_TALLY).toEqual(fromSource)
    expect(Object.values(A7_TOKEN_TALLY).reduce((a, b) => a + b, 0)).toBe(54)
    // Five of wave 0's seven tokens appear; neither `Unavailable` nor
    // `Read-only` does, so the two opposite senses of `Unavailable`
    // (L42114 against L42120) do not arise in this module.
    expect(A7_TOKEN_TALLY.unavailable).toBeUndefined()
    expect(A7_TOKEN_TALLY.readOnly).toBeUndefined()
  })

  // FAILS IF: `openDecision` is set on a cell whose token is not `Client
  // Decision Required`, or left null on the one that is. Exactly one cell
  // in this matrix carries a decision. Planted: openDecision null on row
  // 4's Tenant Admin cell. Went red.
  it('carries an open decision on exactly the one Client Decision Required cell', () => {
    const withDecision = A7_ROWS.flatMap((r) =>
      A7_COLUMNS.filter((c) => r.cells[c].openDecision !== null).map((c) => `${r.id}.${c}`),
    )
    expect(withDecision).toEqual(['wipe-or-deauthorise.Tenant Admin'])
    expect(a7RowById('wipe-or-deauthorise').cells['Tenant Admin'].outcome).toBe(
      'clientDecisionRequired',
    )
  })
})

/* ==================================================================== *
 * THE SIXTH COLUMN IS NOT A ROLE.
 * ==================================================================== */

describe('the Platform roles column', () => {
  // FAILS IF: this module keys its columns on `RoleId` the way the
  // five-column modules do. "Platform roles" is not a member of that union
  // and typing it as one would have needed a role invented for it.
  // Planted: A7_COLUMNS' sixth entry replaced with 'Root Super Admin' —
  // went red on the header-verbatim gate, which is the pairing that makes
  // this one honest.
  it('is a set of roles, not one role, and is derived from the platform register', () => {
    const roleIds = new Set<string>(ROLES.map((r) => r.id))
    expect(roleIds.has('Platform roles')).toBe(false)
    expect(PLATFORM_ROLE_IDS).toHaveLength(4)
    expect([...PLATFORM_ROLE_IDS].sort()).toEqual(
      ROLES.filter((r) => r.domain === 'PLATFORM')
        .map((r) => r.id)
        .sort(),
    )
    expect(A7_COLUMN_ROLES['Platform roles']).toEqual(PLATFORM_ROLE_IDS)
    // The other five are singletons, and each one IS a RoleId.
    for (const column of A7_COLUMNS.filter((c) => c !== 'Platform roles')) {
      expect(A7_COLUMN_ROLES[column], column).toHaveLength(1)
      expect(roleIds.has(at(A7_COLUMN_ROLES[column], 0, column))).toBe(true)
    }
  })

  // FAILS IF: which of the four platform roles the pointer is checked
  // against changes what a reader is shown. The representative is the Root
  // Super Admin because L41300's own cell names them; this asserts the pick
  // is not load-bearing rather than trusting the comment that says so.
  //
  // Planted: A7_COLUMN_POINTER_ROLE['Platform roles'] set to 'WORKER'.
  // Went red — a Worker reaches no other surface and every cross-surface
  // row collapsed from `link` to `statement`.
  it('gives the same link state whichever of the four platform roles is asked', () => {
    const crossSurfaceRows = a7RowsFor('profile-lite').filter(
      (r) => r.surface === 'another-surface',
    )
    expect(crossSurfaceRows).toHaveLength(4)
    for (const row of crossSurfaceRows) {
      const met = row.metElsewhere
      if (met === null || met.where !== 'another-surface') throw new Error(`${row.id}: no surface`)
      const states = PLATFORM_ROLE_IDS.map(
        (role: RoleId) =>
          frontlineCrossSurfaceModel(
            {
              capability: row.control,
              owningSurface: met.surface,
              whatHappensThere: met.note,
              sourceRef: row.sourceRef,
            },
            role,
          ).linkState,
      )
      expect(new Set(states).size, `${row.id}: ${states.join(', ')}`).toBe(1)
      expect(states).toContain(
        frontlineCrossSurfaceModel(
          {
            capability: row.control,
            owningSurface: met.surface,
            whatHappensThere: met.note,
            sourceRef: row.sourceRef,
          },
          A7_COLUMN_POINTER_ROLE['Platform roles'],
        ).linkState,
      )
    }
  })
})

/* ==================================================================== *
 * WHAT PROFILE-LITE DRAWS, THROUGH `frontlineAffordance` AND NOWHERE ELSE.
 * ==================================================================== */

describe('what MOD-FL-A7 draws on SCR-FL-06 Profile-lite', () => {
  // FAILS IF: any row of this matrix draws a control on this destination.
  // Not one does: four rows are prohibited in all six columns, four are met
  // on another surface, and the ninth is met on the Run Player.
  //
  // Planted: row 9's home changed from run-player to attempted-anywhere,
  // which makes the Worker cell's `Allowed with conditions` reach the token
  // branch. Went red naming complete-in-flight-run.Worker.
  it('draws no control at all, in any of the six columns', () => {
    const drawn: string[] = []
    for (const row of a7RowsFor('profile-lite')) {
      for (const column of A7_COLUMNS) {
        if (frontlineAffordance(row, column).kind === 'control') drawn.push(`${row.id}.${column}`)
      }
    }
    expect(drawn).toEqual([])
  })

  // FAILS IF: a row classified away from this screen draws a control
  // anyway, or an EXCL-FL-06 invariant act is classified as this screen's.
  // Wave 0's own check, run over this module's rows.
  it('passes wave 0’s controlsOnActsHeldElsewhere with nothing to report', () => {
    expect(controlsOnActsHeldElsewhere(a7RowsFor('profile-lite'), [...A7_COLUMNS])).toEqual([])
  })

  // FAILS IF: the classification of a row changes. Every affordance kind on
  // this destination, named per row so a change says which row moved.
  // Planted: row 7's home changed to another-surface SURF-SA — went red,
  // because a prohibition refused for every persona is not an elsewhere-act.
  it('resolves each row to the kind its classification requires', () => {
    const kinds = Object.fromEntries(
      a7RowsFor('profile-lite').map((row) => [
        row.id,
        frontlineAffordance(row, 'Worker').kind,
      ]),
    )
    expect(kinds).toEqual({
      'read-store-outside': 'refusal',
      'export-media': 'refusal',
      'pin-reset': 'cross-surface',
      'wipe-or-deauthorise': 'cross-surface',
      'soft-or-hard-suspension': 'cross-surface',
      'compliance-suspension': 'cross-surface',
      'dismiss-compliance-lock': 'refusal',
      'capture-under-compliance-stop': 'refusal',
      'complete-in-flight-run': 'named-place',
    })
  })

  // FAILS IF: a row that is not met on this screen names nowhere to send a
  // reader — which `frontlineAffordance` throws on — or a row met here
  // carries a pointer it should not. Planted: metElsewhere forced to null
  // for row 4. Went red with wave 0's own message.
  it('gives every row that is not this screen’s somewhere to send a reader', () => {
    for (const row of a7RowsFor('profile-lite')) {
      if (row.surface === 'screen') {
        expect(row.metElsewhere, row.id).toBeNull()
      } else {
        expect(row.metElsewhere, row.id).not.toBeNull()
        expect(row.metElsewhere?.note.length ?? 0, row.id).toBeGreaterThan(40)
      }
    }
  })

  // FAILS IF: `existence` drifts off `present` on any row and a stated line
  // replaces the source's own token. No cell in this matrix reads
  // `Unavailable`, which is the token wave 0 reserves for a capability that
  // is absent. Planted: row 7's existence set to 'not-in-scope' — went red
  // here and turned its Worker affordance from `refusal` into
  // `stated-line`, which the kinds gate above caught too.
  it('classifies every row as present, because no cell reads Unavailable', () => {
    for (const row of a7RowsFor('profile-lite')) expect(row.existence, row.id).toBe('present')
  })

  // FAILS IF: a `routedTo` appears. No cell in this matrix names another
  // row of this matrix as an alternative act — see the file header for row
  // 7's near-miss, which states a condition and not an alternative.
  it('routes no column to another row of this matrix', () => {
    for (const row of a7RowsFor('profile-lite')) {
      expect(Object.keys(row.routedTo), row.id).toEqual([])
    }
  })

  // FAILS IF: rows 5 and 6 stop reading their owning surface from wave 0's
  // surface-level declaration and start spelling it themselves. One act
  // described twice in two wordings is the defect this consumption avoids.
  // Planted: row 5's home surface hard-coded to 'SURF-DOH'. Went red.
  it('reads the suspension act’s owning surface from wave 0, never re-deriving it', () => {
    const declared = FL_ACTS_HELD_ELSEWHERE.find(
      (a) => a.capability === 'Applying a soft, hard, or compliance suspension.',
    )
    expect(declared).toBeDefined()
    for (const id of ['soft-or-hard-suspension', 'compliance-suspension'] as const) {
      const home = a7RowById(id).home
      expect(home.kind, id).toBe('another-surface')
      if (home.kind !== 'another-surface') throw new Error(id)
      expect(home.surface, id).toBe(declared?.owningSurface)
      expect(home.note, id).toBe(declared?.whatHappensThere)
    }
    // And the declaration's own sourceRef already names this matrix's lines,
    // which is why re-spelling it here would have been the second wording.
    expect(declared?.sourceRef).toContain('L41301')
    expect(declared?.sourceRef).toContain('L41302')
  })
})

/* ==================================================================== *
 * ROW 3, WHICH IS ALSO `MOD-FL-A1`'s ROW 7 — AND IS NOT THE SAME TEXT.
 * ==================================================================== */

describe('row 3 against MOD-FL-A1’s row 7', () => {
  // FAILS IF: the two lines stop diverging, or start diverging somewhere
  // else. Both are PARSED; nothing here restates either wording.
  //
  // Planted: `divergence` reworded to say the two cells agree — the string
  // assertions below went red because they check the recorded claim against
  // the parsed fact rather than against another sentence.
  it('names the same act, and the Supervisor cells are not the same words', () => {
    const a1 = cellsOf(40194)
    const a7 = cellsOf(41299)
    expect(a1).toHaveLength(6)
    expect(a7).toHaveLength(7)

    // Same Action, same five shared tokens.
    expect(strip(at(a1, 0, 'a1 action'))).toBe(strip(at(a7, 0, 'a7 action')))
    expect(strip(at(a1, 0, 'a1 action'))).toBe(a7RowById('pin-reset').control)
    for (let j = 1; j <= 5; j += 1) {
      expect(outcomeOf(at(a1, j, `a1 ${j}`)), `column ${j}`).toBe(
        outcomeOf(at(a7, j, `a7 ${j}`)),
      )
    }

    // And the Supervisor cell's WORDS differ, in one direction: A1's is the
    // longer, and the extra clause is the one this build must not silently
    // adopt into A7's line or drop from A1's.
    const a1Supervisor = strip(at(a1, 2, 'a1 supervisor'))
    const a7Supervisor = strip(at(a7, 2, 'a7 supervisor'))
    expect(a1Supervisor).not.toBe(a7Supervisor)
    expect(a1Supervisor.startsWith(a7Supervisor)).toBe(true)
    const extra = a1Supervisor.slice(a7Supervisor.length)
    expect(extra).toBe(', not on the device')

    // THE RECORDED CLAIM, HELD AGAINST THE PARSED FACT. The first version of
    // this gate asserted only that the sentence contained "not on the device"
    // — and the sentence still contained it after being reworded to say the
    // two cells AGREE, because the clause it quotes is what they disagree
    // about. Planted exactly that: "The Supervisor cell differs between the
    // two lines" -> "The Supervisor cells agree between the two lines". It
    // stayed green. It goes red now.
    const claim = A7_ROW_3_ALSO_TRANSCRIBED_BY.divergence
    expect(claim).toContain(extra.replace(/^, /, ''))
    expect(claim, 'the record must say the two lines differ').toMatch(/\bdiffers?\b/i)
    expect(claim, 'the record must not say they agree').not.toMatch(/\bagree/i)
    expect(claim, 'the record must quote both endings').toContain('managed-credential path')
    expect(A7_ROW_3_ALSO_TRANSCRIBED_BY.theirSourceRef).toBe('L40194')
    expect(A7_ROW_3_ALSO_TRANSCRIBED_BY.ourSourceRef).toBe('L41299')
  })

  // FAILS IF: this module transcribes A1's wording instead of its own. The
  // note it carries must be L41299's, byte for byte.
  it('transcribes its own line and not the neighbour’s', () => {
    expect(a7RowById('pin-reset').cells.Supervisor.note).toBe(strip(at(cellsOf(41299), 2, 'sup')))
    expect(a7RowById('pin-reset').cells.Supervisor.note).not.toBe(
      strip(at(cellsOf(40194), 2, 'sup')),
    )
  })

  // FAILS IF: the sixth-column reading this matrix uniquely holds is lost.
  // MOD-FL-A1's matrix has five columns and no place to record it, which is
  // why deferring the STATEMENT to that module must not defer the CELL.
  it('holds the Platform-roles reading MOD-FL-A1 cannot', () => {
    const cell = a7RowById('pin-reset').cells['Platform roles']
    expect(cell.outcome).toBe('notApplicable')
    expect(cell.note).toBe(strip(at(cellsOf(41299), 6, 'platform')))
    expect(cellsOf(40194)).toHaveLength(6)
    expect(A7_ROW_3_ALSO_TRANSCRIBED_BY.whatOnlyThisMatrixHolds).toContain('Platform-roles')
  })
})

/* ==================================================================== *
 * ROW 4's TENANT ADMIN CELL IS ITS OWN QUESTION.
 * ==================================================================== */

describe('the one Client Decision Required cell, and which question it defers to', () => {
  // FAILS IF: this cell's own reason is read as the device-session
  // question. The two reasons are parsed out of their own lines and
  // compared; nothing here quotes either.
  //
  // Planted: openDecision on row 4 set to 'AC-FL-009-5'. Went red on the
  // identity assertion below.
  it('argues its own reasoning, which is not the device-session question’s', () => {
    const deviceSessionReason = strip(at(cellsOf(39837), 1, 'L39837'))
    const wipeReason = a7RowById('wipe-or-deauthorise').cells['Tenant Admin'].note
    expect(wipeReason).toBe(strip(at(cellsOf(41300), 4, 'L41300')))
    expect(deviceSessionReason).toContain('device session')
    expect(wipeReason).toContain('critical class')
    expect(wipeReason).not.toContain('device session')
    expect(wipeReason).not.toBe(deviceSessionReason)
    expect(A7_TENANT_ADMIN_WIPE_AUTHORITY.id).not.toBe('AC-FL-009-5')
    expect(A7_TENANT_ADMIN_WIPE_AUTHORITY.distinctFrom).toContain('AC-FL-009-5')
  })

  // FAILS IF: the section's own source status stops filing Tenant Admin
  // wipe authority as a separate Client Decision Required. This is the
  // corroboration that the cell's argument is a second question rather than
  // a differently-worded restatement of the first.
  it('is filed separately by the section’s own source status', () => {
    expect(L(41446)).toContain('Tenant Admin wipe authority is `Client Decision Required`')
    expect(L(41368)).toContain('Tenant Admin authority here is `Client Decision Required`')
  })

  // FAILS IF: wave 0's enumeration stops listing this cell, or this module
  // stops recording that the enumeration's blanket claim does not fit it.
  // The enumeration is NOT edited from here — it is another task's file.
  it('is enumerated by wave 0, whose blanket reason does not fit it', () => {
    expect(
      TENANT_ADMIN_OPEN_CELLS.filter((c) => c.module === 'MOD-FL-A7').map((c) => c.sourceRef),
    ).toEqual(['L41300'])
  })
})

/* ==================================================================== *
 * THE IDENTITY CARD.
 * ==================================================================== */

describe('MOD-FL-A7’s identity card', () => {
  // FAILS IF: the id list and the records drift apart, which is what makes
  // `a7CharterStatement`'s placeholder unreachable.
  it('holds one record per declared id, in the declared order', () => {
    expect(A7_CHARTER_STATEMENTS.map((s) => s.id)).toEqual([...A7_CHARTER_STATEMENT_IDS])
    for (const id of A7_CHARTER_STATEMENT_IDS) expect(a7CharterStatement(id).id).toBe(id)
    expect(a7CharterStatement('purpose').heading).not.toBe('Missing charter statement')
  })

  // FAILS IF: a card statement is paraphrased, or one that is not on the
  // card is marked as though it were. Parsed from each statement's own
  // line. Planted: the purpose statement's trailing clause dropped. Went
  // red naming `purpose`.
  it('transcribes every statement from its own line, verbatim', () => {
    for (const s of A7_CHARTER_STATEMENTS) {
      const line = normaliseProse(L(Number(s.sourceRef.slice(1))))
      const text = normaliseProse(s.text)
      expect(carriesInOrder(line, text), `${s.id} @ ${s.sourceRef}: ${text}`).toBe(true)
    }
    // The ordering half of `carriesInOrder` is what makes it as strong as a
    // plain `toContain`, so it is proved here rather than asserted: the same
    // sentences in the wrong order do NOT pass.
    const line = normaliseProse(L(41283))
    expect(carriesInOrder(line, 'MOD-FL-A7. Security and Data Protection.')).toBe(true)
    expect(carriesInOrder(line, 'Security and Data Protection. MOD-FL-A7.')).toBe(false)
    expect(carriesInOrder(line, 'MOD-FL-A8. Security and Data Protection.')).toBe(false)
  })

  // FAILS IF: the card grows or loses a statement, or a statement moves on
  // or off it. The card is L41283-L41291 odd, five statements; the other
  // six carry their own lines outside that span.
  it('marks exactly the five L41283-L41291 statements as on the card', () => {
    expect(A7_IDENTITY_CARD.map((s) => s.sourceRef)).toEqual([
      'L41283',
      'L41285',
      'L41287',
      'L41289',
      'L41291',
    ])
    for (const s of A7_CHARTER_STATEMENTS) {
      const line = Number(s.sourceRef.slice(1))
      expect(s.onTheCard, s.id).toBe(line >= 41283 && line <= 41291)
    }
    // The even lines inside the span are blank, which is why the card is
    // five statements over nine lines rather than nine statements.
    for (const n of [41284, 41286, 41288, 41290]) expect(L(n).trim()).toBe('')
  })

  // FAILS IF: the seven state identifiers drift from L41315. Derived from
  // the charter statement, compared against the parsed line.
  // Planted: STATE-A7-WIPED dropped from the charter text. Went red.
  it('derives the seven state identifiers from L41315 itself', () => {
    const fromSource = strip(L(41315))
      .replace(/^\*\*States\.\*\*\s*/, '')
      .replace(/\.$/, '')
      .split(';')
      .map((s) => s.trim())
    expect(A7_STATES).toEqual(fromSource)
    expect(A7_STATES).toHaveLength(7)
  })

  // FAILS IF: this module transcribes the build plan's `C1` grade, or the
  // source's Band value, as though either were a property of the module.
  // The source's own inventory row for this module is L39852 and its Band
  // column reads `A`; neither value belongs in the module.
  it('transcribes neither the build-plan grade nor the source’s Band', () => {
    expect(strip(at(cellsOf(39852), 0, 'inventory id'))).toBe('MOD-FL-A7')
    expect(at(cellsOf(39852), 2, 'inventory band')).toBe('A')
    const everyString = renderedStrings()
      .map((s) => s.text)
      .join(' ')
    expect(everyString).not.toMatch(/\bC1\b/)
    expect(everyString).not.toMatch(/\bC2\b/)
  })
})

/* ==================================================================== *
 * THE ELEVEN FUNCTIONALITIES AND `AC-FL-011-1`.
 * ==================================================================== */

describe('MOD-FL-A7’s functionalities', () => {
  // FAILS IF: a functionality is dropped, invented, or renumbered. Eleven
  // FUNC-A7-* identifiers appear in the section; the transcription holds
  // eleven and they are the same eleven, in the source's own order.
  // Planted: FUNC-A7-05-3-2 removed. Went red on both the count and the
  // identifier list.
  it('transcribes all eleven, and the source holds exactly eleven', () => {
    const fromSource: string[] = []
    for (let n = 41359; n <= 41385; n += 1) {
      const m = L(n).match(/`(FUNC-A7-[0-9-]+)`/)
      if (m?.[1] !== undefined) fromSource.push(m[1])
    }
    expect(fromSource).toHaveLength(11)
    expect(A7_FUNCTIONALITIES.map((f) => f.id)).toEqual(fromSource)
  })

  // FAILS IF: a statement or a Fallback clause is paraphrased. Both are
  // checked against the functionality's own line.
  // Planted: FUNC-A7-03-2-1's fallback clause changed to FB-FL-SEC-01.
  // Went red on the clause AND on the pattern-set gate below.
  it('carries every statement and every Fallback clause verbatim', () => {
    for (const f of A7_FUNCTIONALITIES) {
      const line = normaliseProse(L(Number(f.sourceRef.slice(1))))
      expect(line, `${f.id} statement`).toContain(normaliseProse(f.statement))
      expect(line, `${f.id} fallback`).toContain(normaliseProse(f.fallbackClause))
      expect(line, `${f.id} identifier`).toContain(f.id)
    }
  })

  // FAILS IF: a functionality names no pattern and the module goes on
  // saying the criterion is met. Wave 0's implementation of the rule, run
  // over this module's eleven.
  //
  // THIS MODULE HAS NO GAP, and the gate has to be able to see one anyway.
  // Planted: FUNC-A7-04-1-1's patterns emptied. Went red naming it, which
  // is the proof this is not a vacuous `toEqual([])`.
  it('meets AC-FL-011-1 with no gap, and the check can see one', () => {
    expect(A7_FUNCTIONALITIES_NAMING_NO_PATTERN).toEqual([])
    expect(A7_FUNCTIONALITIES).toHaveLength(11)
    // Every declared pattern is actually named in the clause it came from.
    for (const f of A7_FUNCTIONALITIES) {
      expect(f.patterns.length, f.id).toBeGreaterThan(0)
      for (const p of f.patterns) expect(f.fallbackClause, f.id).toContain(p)
    }
  })

  // FAILS IF: a lockout attempt count or duration is invented. L41371 says
  // both are Not specified in the Statement of Work.
  it('names no lockout attempt count and no lockout duration', () => {
    expect(A7_LOCKOUT_THRESHOLD.attempts).toBeNull()
    expect(A7_LOCKOUT_THRESHOLD.duration).toBeNull()
    expect(L(41371)).toContain('Not specified in the Statement of Work')
    expect(L(41446)).toContain('Lockout thresholds are `TBD — Client Decision Required`')
  })
})

/* ==================================================================== *
 * THE THREE FALLBACK READINGS, RECONCILED NOWHERE.
 * ==================================================================== */

describe('the three readings of this module’s fallback set', () => {
  // FAILS IF: the map reading is restated rather than read, or the three
  // readings stop disagreeing. Every one of the three is derived or parsed.
  //
  // Planted: FB-FL-AUTH-01 added to `fromTheModuleMap`. Went red, because
  // that list is compared against `patternsForModule`, which reads §22.9.
  it('measures 3 from the map, 4 from the card, 4 from the functionalities', () => {
    expect(A7_PATTERNS_FROM_MAP).toEqual(patternsForModule('MOD-FL-A7'))
    expect(A7_PATTERN_DIVERGENCE.fromTheModuleMap).toHaveLength(3)
    expect([...A7_PATTERN_DIVERGENCE.fromTheModuleMap].sort()).toEqual(
      A7_PATTERNS_FROM_MAP.map((p) => p.id).sort(),
    )

    // The card's own Fallback identifier line, parsed.
    const fromCard = [...L(41351).matchAll(/`(FB-FL-[A-Z0-9-]+)`/g)].map((m) => m[1])
    expect(fromCard).toHaveLength(4)
    expect([...A7_PATTERN_DIVERGENCE.fromTheCardsFallbackLine].sort()).toEqual(
      [...fromCard].sort(),
    )

    // The functionalities' own clauses, derived.
    expect([...A7_PATTERNS_NAMED_BY_FUNCTIONALITIES].sort()).toEqual(
      [...A7_PATTERN_DIVERGENCE.fromTheFunctionalities].sort(),
    )
    expect(A7_PATTERNS_NAMED_BY_FUNCTIONALITIES).toHaveLength(4)

    // And the three do not agree, which is the finding.
    expect(A7_PATTERN_DIVERGENCE.fromTheModuleMap.length).not.toBe(
      A7_PATTERN_DIVERGENCE.fromTheCardsFallbackLine.length,
    )
  })

  // FAILS IF: `FB-FL-AUTH-01`'s map row starts listing this module, or
  // stops being the pattern the card adds. That row is the whole substance
  // of the divergence. Planted: the assertion's module id changed to
  // MOD-FL-A6, which the row DOES list. Went red.
  it('is a divergence about FB-FL-AUTH-01, whose map row omits this module', () => {
    expect(L(40131)).toContain('FB-FL-AUTH-01')
    expect(L(40131)).not.toContain('MOD-FL-A7')
    expect(L(41351)).toContain('FB-FL-AUTH-01')
    expect(L(41373)).toContain('FB-FL-AUTH-01')
    expect(A7_PATTERN_DIVERGENCE.fromTheModuleMap).not.toContain('FB-FL-AUTH-01')
    expect(A7_PATTERN_DIVERGENCE.fromTheCardsFallbackLine).toContain('FB-FL-AUTH-01')
  })
})

/* ==================================================================== *
 * THE DECISIONS, AND THE EXPIRY GATE ON THE STAND-IN.
 * ==================================================================== */

describe('the decisions this module discloses locally', () => {
  // FAILS IF: a decision is filed under an identifier the canon already
  // holds, or the canon grows a record for one of these six and this module
  // goes on disclosing it locally. Two wordings of one decision is exactly
  // what the shared canon exists to prevent. It reads the union out of the
  // canon file rather than trusting a comment about it.
  //
  // Planted: DEC-WIPE-001 re-filed as 'DEC-CAP-001', which the canon does
  // hold. Went red. The canon file itself was NOT edited to plant the other
  // direction — it is another task's path and a concurrent agent's tree —
  // so that half is held by the same assertion read the other way.
  it('discloses locally only because the shared canon has no record for these', () => {
    const canon = readFileSync(join(process.cwd(), 'src/disclosure/decisions.ts'), 'utf8')
    const block = canon.match(/export type DecisionId =([\s\S]*?)\n\n/)
    expect(block).not.toBeNull()
    const members = [...(block?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1])
    expect(members.length).toBeGreaterThan(20)
    expect(A7_DISCLOSURES).toHaveLength(6)
    for (const d of A7_DISCLOSURES) {
      expect(members, `${d.decisionRef} is absent from the canon`).not.toContain(d.decisionRef)
      expect(d.canonNote).toContain('DecisionId')
    }
    // And the gate can see the other direction: an identifier the canon DOES
    // hold would be caught. This proves the assertion is not vacuous.
    expect(members).toContain('DEC-CAP-001')
  })

  // FAILS IF: a decision is disclosed with no reading, or with a reading
  // whose locator does not name a line of the frozen source that actually
  // carries the identifier or the reading's own words.
  //
  // Planted: DEC-SUSP-001's first reading re-located to a blank line in this
  // module's own section. Went red naming the reading. The line number is not
  // spelled here: `tests/coverage/locator-fidelity.test.ts` lexes any
  // `L`-number in a comment as a citation, so naming it files a knowingly-false
  // citation to describe a test.
  it('gives every reading a locator that names a line carrying it', () => {
    for (const d of A7_DISCLOSURES) {
      expect(d.readings.length, d.decisionRef).toBeGreaterThan(1)
      for (const r of d.readings) {
        // A locator may name more than one line — DEC-WIPE-001's diagram
        // reading is at L41406 and L41410 both. EVERY line it names is
        // parsed and at least one has to carry the reading; a locator
        // naming no line at all fails on the length check rather than
        // quietly parsing to `NaN` and comparing nothing.
        const lines = [...r.locator.matchAll(/L(\d+)/g)].map((m) => Number(m[1]))
        expect(lines.length, `${d.decisionRef}: ${r.locator}`).toBeGreaterThan(0)
        // A reading is either at a line naming its decision, or at a line
        // carrying a distinctive run of its own words. Twelve words is long
        // enough that a coincidental match is not a thing.
        const words = normaliseProse(r.text).split(' ')
        const probe = words.slice(Math.max(0, words.length - 12)).join(' ')
        const carried = lines.some((n) => {
          const line = normaliseProse(L(n))
          return line.includes(d.decisionRef) || line.includes(probe)
        })
        expect(carried, `${d.decisionRef} @ ${r.locator}: ${probe}`).toBe(true)
      }
    }
  })

  // FAILS IF: any reading is marked as the answer. The canon's own
  // `DecisionReading` is two fields and imported rather than redeclared, so
  // there is no field in which one could be — this asserts the shape stayed
  // that way rather than growing a third field locally.
  it('carries readings in the canon’s two-field shape and marks none the answer', () => {
    for (const d of A7_DISCLOSURES) {
      for (const r of d.readings) {
        expect(Object.keys(r).sort(), d.decisionRef).toEqual(['locator', 'text'])
      }
      expect(d.adopted.length, d.decisionRef).toBeGreaterThan(40)
    }
  })

  // FAILS IF: DEC-SUSP-001 renders a payment path. The adopted position is
  // release by an explicit operator signal with no payment event observed,
  // because there is no payment integration to observe one.
  // Planted: "automatic on payment" written into `adopted`. Went red.
  it('renders no payment path for DEC-SUSP-001', () => {
    const susp = A7_DISCLOSURES.find((d) => d.decisionRef === 'DEC-SUSP-001')
    expect(susp).toBeDefined()
    expect(susp?.adopted).toContain('explicit operator signal')
    expect(susp?.adopted).toContain('NO PAYMENT EVENT OBSERVED')
    expect(L(41353)).toContain('adopted 2026-08-14')
    const soft = A7_SUSPENSION_STATES.find((s) => s.stateId === 'STATE-A7-SOFTSUSP')
    expect(soft?.exit).toContain('no payment event observed')
    expect(soft?.exit).not.toMatch(/automatic(ally)? on payment/i)
  })

  // FAILS IF: both wordings of the fixed compliance message stop standing
  // together. TEST-SCR-FL-006 (L48703) requires both preserved, and every
  // Frontline occurrence quotes Reading A alone — which is precisely why
  // Reading B has to be carried deliberately.
  //
  // Planted: Reading B dropped from the DEC-MSG-001 readings. Went red.
  it('carries both wordings of the fixed compliance message, from their own lines', () => {
    const readingA = strip(L(5265)).replace(/^.*?: "/, '').replace(/"$/, '')
    const readingB = strip(L(5266)).replace(/^.*?: "/, '').replace(/"$/, '')
    expect(readingA).not.toBe(readingB)
    const msg = A7_DISCLOSURES.find((d) => d.decisionRef === 'DEC-MSG-001')
    const all = (msg?.readings ?? []).map((r) => r.text).join(' ')
    expect(all).toContain(readingA)
    expect(all).toContain(readingB)
    expect(L(48703)).toContain('DEC-MSG-001')
    expect(L(44923)).toContain('drafting inconsistency')
  })

  // FAILS IF: a recorded rendering claims a wording the line does not
  // carry. Every row is checked against the line it names.
  // Planted: L40321 recorded as quoting Reading A. Went red — that line is
  // AC-A1-7 and quotes neither.
  it('records, per line, which wording each Frontline rendering quotes', () => {
    const readingA = strip(L(5265)).replace(/^.*?: "/, '').replace(/"$/, '')
    const readingB = strip(L(5266)).replace(/^.*?: "/, '').replace(/"$/, '')
    for (const r of A7_MESSAGE_RENDERINGS) {
      const line = strip(L(Number(r.locator.slice(1))))
      if (r.quotes === 'Reading A') {
        expect(line.includes(readingA), r.locator).toBe(true)
      } else {
        expect(line.includes(readingA) || line.includes(readingB), r.locator).toBe(false)
      }
    }
    // READING B IS QUOTED BY NO FRONTLINE RENDERING, which is the measured
    // fact this record exists to hold — and it is asserted at run time over
    // widened values rather than as a literal comparison, because the union
    // of `quotes` has already narrowed to "Reading A" | "neither" and a
    // direct comparison would be a compile error rather than a check that
    // could see the record change.
    const quoted: string[] = A7_MESSAGE_RENDERINGS.map((r) => r.quotes)
    expect(quoted).not.toContain('Reading B')
    expect(quoted).toContain('Reading A')
    expect(quoted).toContain('neither')
  })

  // FAILS IF: this module stops recording that wave 0's commands file files
  // the wipe/de-authorisation channel gap under DEC-WIPE-001 while the
  // source raises it as DEC-CMDCLASS-001 — or wave 0 is corrected and this
  // note is not withdrawn with it. That file is NOT edited from here.
  //
  // Planted: theSourcesIdentifier set to 'DEC-WIPE-001'. Went red on the
  // inequality below.
  it('records the command-class gap under the identifier the source raises', () => {
    expect(L(51551)).toContain('DEC-CMDCLASS-001')
    expect(L(51551)).toContain('not one of the five named command-channel classes')
    expect(L(51551)).toContain('`DEC-WIPE-001` remains separate and unresolved')
    expect(A7_COMMAND_CLASS_GAP.theSourcesIdentifier).toBe('DEC-CMDCLASS-001')
    // THIS ASSERTION USED TO PIN A MISMATCH AND NOW PINS THE AGREEMENT.
    // `filedUnder` reads `@/frontline/commands`'s own field at run time. It
    // read `DEC-WIPE-001` when this module was written, the mismatch was
    // reported, and the controller refiled it — at which point this went red,
    // which is what it was for. It now asserts the two agree, so refiling it
    // back under the neighbouring identifier goes red from the other side.
    expect(new Set(A7_COMMAND_CLASS_GAP.filedUnder)).toEqual(new Set(['DEC-CMDCLASS-001']))
    expect(A7_COMMAND_CLASS_GAP.filedUnder.length).toBe(2)
    // And read wave 0's constant directly rather than only through this
    // module's mapped copy, so a mapping that stopped reflecting the source
    // of truth could not hide behind its own snapshot.
    for (const g of STOP_CLASS_ITEMS_WITHOUT_A_COMMAND_CLASS) {
      expect(g.openDecision, g.item).toBe('DEC-CMDCLASS-001')
    }
  })
})

/* ==================================================================== *
 * THE THREE SUSPENSION STATES, AND THE OFFLINE HONESTY RULE.
 * ==================================================================== */

describe('the suspension states this module honours', () => {
  // FAILS IF: the three are collapsed into one, or a fourth appears. L41410
  // states in terms that they are genuinely different on the device.
  it('keeps soft, hard and compliance genuinely different', () => {
    expect(A7_SUSPENSION_STATES.map((s) => s.stateId)).toEqual([
      'STATE-A7-SOFTSUSP',
      'STATE-A7-HARDSUSP',
      'STATE-A7-COMPLIANCELOCK',
    ])
    for (const s of A7_SUSPENSION_STATES) expect(A7_STATES).toContain(s.stateId)
    expect(L(41410)).toContain('genuinely different on the device')
    const behaviours = A7_SUSPENSION_STATES.map((s) => s.onTheDevice)
    expect(new Set(behaviours).size).toBe(3)
  })

  // FAILS IF: hard suspension is rendered as a stop for work already
  // running. Row 9's Worker cell is the source's own sentence and it is the
  // most consequential in the matrix.
  // Planted: the enumeration shortened to "complete and close". Went red on
  // the five-verb check.
  it('lets in-flight Runs complete under hard suspension, all five verbs', () => {
    const worker = a7RowById('complete-in-flight-run').cells.Worker
    expect(worker.outcome).toBe('allowedWithConditions')
    for (const verb of ['complete', 'capture', 'sync', 'compute summaries', 'close']) {
      expect(worker.note, verb).toContain(verb)
    }
    expect(worker.note).toContain('no new Runs start')
    const hard = A7_SUSPENSION_STATES.find((s) => s.stateId === 'STATE-A7-HARDSUSP')
    for (const verb of ['complete', 'capture', 'sync', 'compute summaries', 'close']) {
      expect(hard?.onTheDevice, verb).toContain(verb)
    }
    expect(L(41427)).toContain('no new Run starts')
  })

  // FAILS IF: the module implies a security command can reach a dark
  // device, or gates the deterministic safety layer behind connectivity.
  // Two opposite errors, one gate — L41323 forbids the first and L40948
  // forbids the second, and reading either as the other is the inversion.
  it('states that no security command arrives offline, and does not gate the safety layer', () => {
    expect(normaliseProse(L(41323))).toContain(
      'No suspension, de-authorisation, or wipe command can arrive, and no surface may imply otherwise',
    )
    expect(A7_OFFLINE_HONESTY.claim).toContain('no surface may imply otherwise')
    expect(A7_OFFLINE_HONESTY.claim).toContain('last known state')
    expect(A7_OFFLINE_HONESTY.whatStillWorks).toContain('identical offline')
    expect(A7_OFFLINE_HONESTY.whatStillWorks).toContain('counter is local')
    // The safety layer is not degraded offline, read from wave 0's table.
    expect(L(40948)).toContain('even offline')
  })
})

/* ==================================================================== *
 * THE COMPLIANCE LOCK — DESCRIBED, NEVER DISMISSIBLE.
 * ==================================================================== */

describe('the compliance lock screen', () => {
  // FAILS IF: row 7 grows a permissive cell in any of the six columns, or
  // this module offers a dismissal by any name. TEST-A7-4 (L41438) is the
  // source's own test for it.
  //
  // Planted: the Platform-roles cell of row 7 changed to `Allowed with
  // conditions`. Went red on the outcome sweep AND on the drawn-control
  // gate above, which is the corroboration working.
  it('is dismissible by nobody, in any of the six columns', () => {
    const row = a7RowById('dismiss-compliance-lock')
    for (const column of A7_COLUMNS) {
      expect(row.cells[column].outcome, column).toBe('explicitlyProhibited')
    }
    expect(row.cells['Platform roles'].note).toContain('it lifts only when the suspension lifts')
    expect(L(41438)).toContain('assert no control exists')
    expect(L(41412)).toContain('no dismiss')
  })

  // FAILS IF: this module renders the lock as a route, or prints either
  // wording as the fixed message. SCR-FL-21's Destination column reads
  // "Full-screen interrupt" (L39883), so it is not one of the six.
  it('describes SCR-FL-21 rather than routing to it', () => {
    expect(A7_COMPLIANCE_LOCK.screenId).toBe('SCR-FL-21')
    expect(cellsOf(39883).map(strip)).toEqual([
      'SCR-FL-21',
      'Suspension lock screen with the fixed compliance message',
      'Full-screen interrupt',
      'MOD-FL-A7',
    ])
    expect(A7_COMPLIANCE_LOCK.whyNotRenderedHere).toContain('Full-screen interrupt')
    expect(A7_COMPLIANCE_LOCK.description).toContain('The sync indicator is not shown')
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
  // Planted twice, in two shapes of field: "countdown" in the wipe
  // disclosure's `adopted`, and "timer" in a suspension state's
  // `onTheDevice`. Both went red naming the field — which is why the sweep
  // walks one shared collection rather than a list of fields chosen by hand.
  it('carries no pace, timing, countdown or ranking word in any rendered string', () => {
    const FORBIDDEN = /\b(pace|timer|countdown|ranking|leaderboard|productivity)\b/i
    const strings = renderedStrings()
    expect(strings.length).toBeGreaterThan(120)
    for (const s of strings) {
      expect(FORBIDDEN.test(s.text), `${s.where}: ${s.text.slice(0, 80)}`).toBe(false)
    }
    // The sweep can see one: this is the same predicate on a planted string,
    // so the gate above is not passing because the regex never matches.
    expect(FORBIDDEN.test('a countdown against expectation')).toBe(true)
  })

  // FAILS IF: the word "synced" is written as a state anywhere in this
  // module. L39622 says there is no such state and no bare success.
  // Planted: "synced" written into the offline claim. Went red.
  it('never writes synced as a state', () => {
    for (const s of renderedStrings()) {
      expect(s.text, s.where).not.toMatch(/\bsynced\b/i)
    }
    expect(L(39622)).toContain('there is no single state called "synced"')
  })
})
