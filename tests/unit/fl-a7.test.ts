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
  A7_COMPLETION_VERBS,
  A7_COMPLETION_VERB_CLASSIFICATION,
  A7_CROSS_MODULE_REACH,
  A7_FUNCTIONALITIES_THE_REGISTER_DOES_NOT_CLASSIFY,
  A7_FUNCTIONALITY_TO_REGISTER_LINE,
  A7_MODULE_FILTER_MEASUREMENT,
  A7_PIN_RESET_ROLE_DIVERGENCE,
  A7_REGISTER_CLASS_TALLY,
  A7_REGISTER_ROWS,
  A7_ROWS_OUTSIDE_THE_SEVEN,
  A7_ROWS_UNDER_AC_OFF_702,
  A7_STANDINGS,
  A7_STANDING_NOT_STATED,
  A7_STATE_IDS,
  A7_STORAGE_ROW_NOT_RESTATED,
  A7_UNCLASSIFIED_FUNCTIONALITY,
  A7_VERBS_WITHOUT_ONE_CLASS,
  REGISTER_FIRST_DATA_LINE,
  TRUST_WINDOW_EXPIRY,
  a7OfflineStanding,
  a7RegisterRowsReaching,
  a7Standing,
  a7TrustWindowGoverns,
  a7VerbClasses,
  registerLineOf,
  registerRowAtLine,
  type A7Standing,
} from '@/frontline/modules/fl-a7/offline'
import { OFFLINE_CLASSIFICATION } from '@/offline/capability'
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
  // Slice 8's records join the SAME collection rather than getting a sweep
  // of their own. A second sweep is a second reach to keep in step, and the
  // reason this one is shared is that a field added later cannot escape it.
  for (const r of A7_CROSS_MODULE_REACH) push(`reach L${r.line}`, `${r.evidence} ${r.bearsOn}`)
  push('storage row', A7_STORAGE_ROW_NOT_RESTATED.whyNotRestated)
  push('module filter', A7_MODULE_FILTER_MEASUREMENT.note)
  push('pin reset divergence', A7_PIN_RESET_ROLE_DIVERGENCE.divergence)
  push(
    'unclassified functionality',
    `${A7_UNCLASSIFIED_FUNCTIONALITY.question} ${A7_UNCLASSIFIED_FUNCTIONALITY.note}`,
  )
  for (const r of A7_UNCLASSIFIED_FUNCTIONALITY.readings) push('unclassified reading', r.text)
  for (const v of A7_COMPLETION_VERB_CLASSIFICATION) push(`verb ${v.verb}`, v.basis)
  for (const trustWindow of ['valid', 'expired'] as const) {
    for (const id of A7_STATE_IDS) {
      const s = a7OfflineStanding(id, trustWindow)
      push(`${id} ${trustWindow}`, `${s.what} ${s.expiryNote}`)
    }
  }
  for (const row of a7RegisterRowsReaching()) {
    push(
      `register L${registerLineOf(row)}`,
      `${row.fn} ${row.reason} ${row.dataRequiredLocally} ${row.expiry} ${row.roleAndQualificationRestrictions} ${row.fallback} ${row.reconnectBehaviour}`,
    )
  }
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
 * SLICE 8 — §34.7's CLASSIFICATION OF THIS MODULE'S FUNCTIONS.
 *
 * Everything below parses the register out of L78766-L78819 at run time.
 * NOTHING restates a class token, a row count or a line number as a literal
 * for the shipped data to be compared against, except the two structural
 * constants the parse itself needs — and both of those are checked against
 * the source before anything reads a row.
 * ==================================================================== */

/** The ten header-keyed columns of the register, by index. Header L78766. */
const REGISTER_COLUMN = {
  fn: 0,
  module: 1,
  klass: 2,
  reason: 3,
  dataRequiredLocally: 4,
  expiry: 5,
  roles: 6,
  ai: 7,
  fallback: 8,
  reconnect: 9,
} as const

const registerCell = (line: number, column: keyof typeof REGISTER_COLUMN): string =>
  at(cellsOf(line), REGISTER_COLUMN[column], `L${line} ${column}`)

/** Every data line of the register, found by walking from the separator. */
function registerDataLines(): readonly number[] {
  const lines: number[] = []
  for (let n = REGISTER_FIRST_DATA_LINE; L(n).startsWith('|'); n += 1) lines.push(n)
  return lines
}

/**
 * The seven class names, PARSED out of the source's own defining table
 * (header L78721, separator L78722, body from L78723). Reading them from
 * wave 0's shipped constant instead would make the eighth-token check a
 * tautology — the shipped constant is the thing under test.
 */
const OFFLINE_CAPABILITY_CLASS_NAMES: readonly string[] = (() => {
  const names: string[] = []
  for (let n = 78_723; L(n).startsWith('|'); n += 1) names.push(at(cellsOf(n), 0, `L${n} class`))
  return names
})()

describe('the register this module’s offline classification is filtered out of', () => {
  // FAILS IF: the register's header, separator or bounds are not where this
  // module's derived locators assume. Every locator in `offline.ts` is
  // REGISTER_FIRST_DATA_LINE plus an array index, so this is the one place
  // the arithmetic touches the source and it is checked first.
  // Planted: REGISTER_FIRST_DATA_LINE moved to 78769. Went red here and in
  // four tests below.
  it('is a ten-column table with fifty-two data rows, header-keyed from L78766', () => {
    const header = cellsOf(78_766)
    expect(header).toHaveLength(Object.keys(REGISTER_COLUMN).length)
    expect(at(header, REGISTER_COLUMN.fn, 'header fn')).toBe('Function')
    expect(at(header, REGISTER_COLUMN.module, 'header module')).toBe('Module')
    expect(at(header, REGISTER_COLUMN.klass, 'header class')).toBe('Class')

    // The separator is NOT counted as a data row: `|---|---|` splits into
    // non-empty cells, which is exactly how a slice-7 shape check passed on
    // one. So it is asserted to be the separator, by shape.
    expect(L(78_767)).toMatch(/^\|(?:-+\|)+$/)
    expect(L(REGISTER_FIRST_DATA_LINE - 1)).toBe(L(78_767))

    const data = registerDataLines()
    expect(data).toHaveLength(OFFLINE_CLASSIFICATION.length)
    expect(data.at(-1)).toBe(78_819)
    expect(L(78_820).startsWith('|')).toBe(false)
  })

  // FAILS IF: a derived locator names a line that does not carry that row.
  // Checked over ALL fifty-two rows and not only this module's five, because
  // the derivation is arithmetic over the whole array and a check confined to
  // five would pass on an array that had drifted anywhere else.
  // Planted: wave 0's row order is not this task's to touch, so the plant was
  // on REGISTER_FIRST_DATA_LINE instead — see the test above.
  it('derives every row’s locator from its position, and every one lands on its own row', () => {
    for (const row of OFFLINE_CLASSIFICATION) {
      const line = registerLineOf(row)
      expect(registerCell(line, 'fn'), `L${line}`).toBe(row.fn)
      expect(registerCell(line, 'klass'), `L${line}`).toBe(row.klass)
      expect(registerRowAtLine(line)).toBe(row)
    }
    // The derivation can be wrong: a line one off carries a different row.
    expect(registerCell(78_800, 'fn')).not.toBe(registerCell(78_801, 'fn'))
  })
})

describe('MOD-FL-A7’s five rows of the fifty-two', () => {
  // FAILS IF: the filter returns a row the source does not label MOD-FL-A7,
  // or misses one it does. Both directions, and the expectation is PARSED —
  // the set of lines is found by walking the Module column, never listed.
  // Planted: the containment filter narrowed to 'MOD-FL-A' — went red with
  // twelve rows against five.
  it('is exactly the rows whose Module cell names it, in the source’s order', () => {
    const fromSource = registerDataLines().filter((n) =>
      registerCell(n, 'module').includes('MOD-FL-A7'),
    )
    expect(A7_REGISTER_ROWS.map(registerLineOf)).toEqual(fromSource)
    expect(fromSource.length).toBeGreaterThan(0)
    for (const line of fromSource) {
      const row = registerRowAtLine(line)
      expect(row.fn).toBe(registerCell(line, 'fn'))
      expect(row.klass).toBe(registerCell(line, 'klass'))
      expect(row.reason).toBe(registerCell(line, 'reason'))
      expect(row.expiry).toBe(registerCell(line, 'expiry'))
      expect(row.roleAndQualificationRestrictions).toBe(registerCell(line, 'roles'))
      expect(row.fallback).toBe(registerCell(line, 'fallback'))
      expect(row.reconnectBehaviour).toBe(registerCell(line, 'reconnect'))
    }
  })

  // FAILS IF: the two filter forms are claimed to agree where the source
  // makes them differ, or the differing row is not the one the source writes
  // two module ids onto. Both numbers are computed and the difference is
  // parsed out of the Module column rather than asserted.
  // Planted: `byEquality` hard-coded to 5 — still green, so it was replaced
  // by the parsed comparison below, which went red on the same plant.
  it('measures the containment and equality filters against the parsed column', () => {
    const byContainment = registerDataLines().filter((n) =>
      registerCell(n, 'module').includes('MOD-FL-A7'),
    )
    // `strip` on the equality side and not the containment side: the source
    // writes the Module cell inside code ticks, and a tick is markup rather
    // than part of the identifier. Comparing the ticked cell to a bare id
    // returns zero and would have looked like a real measurement.
    const byEquality = registerDataLines().filter(
      (n) => strip(registerCell(n, 'module')) === 'MOD-FL-A7',
    )
    expect(A7_MODULE_FILTER_MEASUREMENT.byContainment).toBe(byContainment.length)
    expect(A7_MODULE_FILTER_MEASUREMENT.byEquality).toBe(byEquality.length)

    // And the form matters for a module the source writes differently: the
    // row that names two ids is dropped by equality and kept by containment.
    const a3Containment = registerDataLines().filter((n) =>
      registerCell(n, 'module').includes('MOD-FL-A3'),
    )
    const a3Equality = registerDataLines().filter(
      (n) => strip(registerCell(n, 'module')) === 'MOD-FL-A3',
    )
    expect(a3Containment.length).toBeGreaterThan(a3Equality.length)
    expect(A7_MODULE_FILTER_MEASUREMENT.whereTheyDiffer).toEqual(
      a3Containment.filter((n) => !a3Equality.includes(n)),
    )
  })

  // FAILS IF: this module's rows carry a class the source does not give
  // them, or the tally is counted off anything but the rows. Parsed tally,
  // built from the Class cells of the seven lines the module reaches.
  // Planted: A7_REGISTER_CLASS_TALLY reduced over A7_REGISTER_ROWS instead of
  // a7RegisterRowsReaching() — went red, missing the two Safe-stop rows.
  it('carries three of the seven classes across five rows, and two more through the cross-module pair', () => {
    const parsed: Record<string, number> = {}
    for (const row of a7RegisterRowsReaching()) {
      const klass = registerCell(registerLineOf(row), 'klass')
      parsed[klass] = (parsed[klass] ?? 0) + 1
    }
    expect(A7_REGISTER_CLASS_TALLY).toEqual(parsed)
    expect(Object.values(A7_REGISTER_CLASS_TALLY).reduce((a, b) => a + b, 0)).toBe(
      a7RegisterRowsReaching().length,
    )
  })

  // FAILS IF: an A7 row carries the eighth token, or the check for it cannot
  // see one. The eighth exists in the register and is NOT this module's, so
  // the same predicate is run against the row that does carry it.
  // Planted: the Conflict-resolution row's line added to A7_CROSS_MODULE_REACH
  // — went red on the first expectation.
  it('carries no class outside AC-OFF-701’s seven, and the check can see one that does', () => {
    expect(A7_ROWS_OUTSIDE_THE_SEVEN).toHaveLength(0)
    const eighth = registerDataLines().filter(
      (n) => !OFFLINE_CAPABILITY_CLASS_NAMES.includes(registerCell(n, 'klass')),
    )
    expect(eighth).toHaveLength(1)
    expect(A7_REGISTER_ROWS.map(registerLineOf)).not.toContain(at(eighth, 0, 'eighth'))
    expect(L(78_831)).toContain('AC-OFF-701')
  })

  // FAILS IF: AC-OFF-702's governed set is not the module's fully-available
  // rows. Its statement is read from its own line rather than paraphrased.
  // Planted: the filter changed to 'Blocked offline' — went red on the lines.
  it('names the rows AC-OFF-702 governs, from its own line', () => {
    expect(L(78_832)).toContain('AC-OFF-702')
    expect(L(78_832)).toContain('fully available offline')
    expect(A7_ROWS_UNDER_AC_OFF_702.map(registerLineOf)).toEqual(
      A7_REGISTER_ROWS.filter(
        (r) => registerCell(registerLineOf(r), 'klass') === 'Fully available offline',
      ).map(registerLineOf),
    )
  })
})

describe('the two rows a module-labelled filter does not return', () => {
  // FAILS IF: a reached row is not actually filed Cross-module, or the
  // evidence claimed for it is not in the cells named. Every clause of the
  // evidence is checked against a parsed cell, not against the prose.
  // Planted: L78817's `bearsOn` claim kept but the expiry equality dropped
  // from the check — replaced by the equality assertion below, which then
  // went red when L78804's expiry was mutated in a scratch copy.
  it('reaches them on evidence in the source’s own cells', () => {
    for (const reach of A7_CROSS_MODULE_REACH) {
      expect(registerCell(reach.line, 'module')).toBe('Cross-module')
      expect(reach.fn).toBe(registerCell(reach.line, 'fn'))
      expect(A7_REGISTER_ROWS.map(registerLineOf)).not.toContain(reach.line)
    }

    // L78817: its Reason names suspension states, and its Expiry cell is the
    // same text L78804 carries. That equality is what makes the window govern.
    expect(registerCell(78_817, 'reason')).toContain('suspension states')
    expect(registerCell(78_817, 'expiry')).toBe(registerCell(78_804, 'expiry'))
    expect(TRUST_WINDOW_EXPIRY).toBe(registerRowAtLine(78_817).expiry)

    // L78818: its Fallback is this module's fixed message and its Reconnect
    // is the dual-authorised path, which is the compliance exit A7 states.
    expect(registerCell(78_818, 'fallback')).toContain('fixed worker-facing message')
    expect(registerCell(78_818, 'reconnect')).toContain('dual-authorised path')
  })

  // FAILS IF: the storage row is restated rather than named, or a fifth
  // DEC-STORE-001 record grows here. The option sets and the owner are what
  // a restatement would carry, so their absence is what is asserted.
  // Planted: the four option letters copied into `whyNotRestated` — went red.
  it('names the third cross-module row and restates DEC-STORE-001 nowhere', () => {
    expect(A7_STORAGE_ROW_NOT_RESTATED.fn).toBe(registerCell(78_819, 'fn'))
    expect(registerCell(78_819, 'module')).toBe('Cross-module')
    expect(registerCell(78_819, 'fallback')).toContain('DEC-STORE-001')

    const OPTION_WORDS =
      /(hard stop at a reserved-capacity threshold|degrade capture fidelity|refuse only optional content|block new run entry)/i
    for (const s of renderedStrings()) {
      expect(OPTION_WORDS.test(s.text), `${s.where}: ${s.text.slice(0, 80)}`).toBe(false)
    }
    // The sweep can see one: L79469 is where the four options are stated.
    expect(OPTION_WORDS.test(L(79_469))).toBe(true)
  })
})

describe('the eleven functionalities against the register’s Function column', () => {
  // FAILS IF: a functionality is mapped to a line that is not one of this
  // module's register rows, or the map stops being total over the eleven.
  // Planted: 'FUNC-A7-04-1-1' mapped to 78_800 — went red on the count of
  // unclassified functionalities and on the reading below.
  it('maps ten onto this module’s own rows and one onto nothing', () => {
    const ours = A7_REGISTER_ROWS.map(registerLineOf)
    for (const f of A7_FUNCTIONALITIES) {
      const line = A7_FUNCTIONALITY_TO_REGISTER_LINE[f.id]
      if (line !== null) expect(ours, f.id).toContain(line)
    }
    expect(Object.keys(A7_FUNCTIONALITY_TO_REGISTER_LINE).sort()).toEqual(
      A7_FUNCTIONALITIES.map((f) => f.id)
        .slice()
        .sort(),
    )
    expect(A7_FUNCTIONALITIES_THE_REGISTER_DOES_NOT_CLASSIFY).toEqual(['FUNC-A7-04-1-1'])
  })

  // FAILS IF: the register does in fact name the minimal-data-scope function
  // and this build claimed otherwise. Measured over all fifty-two Function
  // cells, not over this module's five.
  // Planted: the word list narrowed to a term the register does carry
  // ("storage") — went red, because L78787 and L78819 both name it.
  it('finds no Function cell naming minimal on-device data scope, over all fifty-two', () => {
    const SCOPE = /\b(minimal|data scope|blast radius)\b/i
    const naming = registerDataLines().filter((n) => SCOPE.test(registerCell(n, 'fn')))
    expect(naming).toEqual([])
    // The sweep can see a Function cell: a term the register does carry.
    expect(registerDataLines().filter((n) => /storage/i.test(registerCell(n, 'fn')))).not.toEqual(
      [],
    )
    // And the functionality states its own offline position on its own line,
    // which is the second reading this build carries and does not choose.
    expect(L(41_376)).toContain('FUNC-A7-04-1-1')
    expect(L(41_376)).toContain('Online and offline: identical')
    expect(A7_UNCLASSIFIED_FUNCTIONALITY.adopted).toBeNull()
    expect(A7_UNCLASSIFIED_FUNCTIONALITY.readings).toHaveLength(2)
  })
})

describe('row 9 as a behaviour: the five verbs and their classes', () => {
  // FAILS IF: the five verbs are not L41305's own, in its own order. Parsed
  // out of the Worker cell rather than compared to a list written here.
  // Planted twice. Singularising 'compute summaries' went red, but by
  // THROWING at module load — `a7VerbClasses` has no record for an unknown
  // verb — which is a real red and not this assertion's. So it was planted
  // again by swapping 'capture' and 'sync' in the tuple, which changes only
  // the order, and this went red on the cursor.
  it('takes its five verbs from L41305’s Worker cell, in order', () => {
    const worker = strip(at(cellsOf(41_305), 1, 'L41305 Worker'))
    let cursor = 0
    for (const verb of A7_COMPLETION_VERBS) {
      const found = worker.indexOf(verb, cursor)
      expect(found, `${verb} in ${worker}`).toBeGreaterThan(-1)
      cursor = found + verb.length
    }
    expect(worker).toContain('no new Runs start')
    // AC-A7-6 requires the same five, so the two lines are held together.
    for (const verb of A7_COMPLETION_VERBS) expect(strip(L(41_427))).toContain(verb)
  })

  // FAILS IF: the classes are claimed to differ where the register agrees, or
  // to agree where it differs. Every class is READ from the source line the
  // verb is mapped to, so the divergence is the register's and not this file's.
  // Planted: 'complete' mapped to [78_780] alone — went red, because
  // A7_VERBS_WITHOUT_ONE_CLASS then held one member instead of two.
  it('reads each verb’s class off the register, and two of the five carry no single one', () => {
    for (const v of A7_COMPLETION_VERB_CLASSIFICATION) {
      expect(a7VerbClasses(v.verb)).toEqual(
        v.registerLines.map((line) => registerCell(line, 'klass')),
      )
    }
    expect(A7_VERBS_WITHOUT_ONE_CLASS).toEqual(['complete', 'compute summaries'])

    // The `complete` divergence is two different classes on two source lines.
    const completeClasses = a7VerbClasses('complete')
    expect(completeClasses).toHaveLength(2)
    expect(at(completeClasses, 0, 'first')).not.toBe(at(completeClasses, 1, 'second'))

    // And no verb is silently given a class the register does not carry.
    expect(a7VerbClasses('compute summaries')).toEqual([])
  })

  // FAILS IF: this module prints the Function cell of L78781, which names a
  // state L39622 says does not exist. The row is cited by line and class and
  // its own words never reach a screen — checked over the shared collection,
  // so a new field cannot let it in.
  // Planted: L78781's Function cell pushed into a verb's `basis` — went red
  // on the existing "never writes synced as a state" gate AND here.
  it('cites L78781 by line and class and never prints its Function cell', () => {
    const forbidden = registerCell(78_781, 'fn')
    expect(forbidden).toMatch(/\bsynced\b/i)
    for (const s of renderedStrings()) {
      expect(s.text, s.where).not.toContain(forbidden)
    }
    expect(
      A7_COMPLETION_VERB_CLASSIFICATION.find((v) => v.verb === 'complete')?.registerLines,
    ).toContain(78_781)
  })
})

describe('what the device does under each state, on its last known state alone', () => {
  // FAILS IF: the state vocabulary here is not L41315's seven. `A7_STATES` is
  // charter.ts's derivation from that line, so the two are held equal rather
  // than the union being a second transcription.
  // Planted: 'STATE-A7-WIPED' dropped from A7_STATE_IDS — the tuple stopped
  // satisfying the exhaustiveness type AND this went red.
  it('is total over L41315’s seven states, and holds them equal to the charter’s', () => {
    expect([...A7_STATE_IDS]).toEqual([...A7_STATES])
    expect(A7_STANDINGS.map((s) => s.state)).toEqual([...A7_STATE_IDS])
    for (const id of A7_STATE_IDS) expect(strip(L(41_315))).toContain(id)
  })

  // FAILS IF: the trust window is applied blanket rather than read off each
  // state's own register row. The boundary is PARSED: a state is governed
  // exactly where its row's Expiry cell equals L78817's.
  // Planted: a7TrustWindowGoverns changed to return true always — went red on
  // the three states whose rows carry a different expiry.
  it('lets the trust window govern exactly the states whose register row carries it', () => {
    for (const id of A7_STATE_IDS) {
      const line = a7Standing(id).registerLine
      expect(a7TrustWindowGoverns(id), id).toBe(
        registerCell(line, 'expiry') === registerCell(78_817, 'expiry'),
      )
    }
    const governed = A7_STATE_IDS.filter(a7TrustWindowGoverns)
    expect(governed.length).toBeGreaterThan(0)
    expect(governed.length).toBeLessThan(A7_STATE_IDS.length)
    // And the states it does not govern carry a different expiry, from the source.
    for (const id of A7_STATE_IDS.filter((s) => !a7TrustWindowGoverns(s))) {
      expect(registerCell(a7Standing(id).registerLine, 'expiry'), id).not.toBe(
        registerCell(78_817, 'expiry'),
      )
    }
  })

  // FAILS IF: an expired trust window safe-stops a state the register does
  // not put the window on, or fails to safe-stop one it does. The safe stop's
  // own words come from L78817's Fallback and Reason cells, parsed.
  // Planted: `safeStop` computed as `trustWindow === 'expired'` without the
  // `governed` conjunct — went red on STATE-A7-PINLOCK.
  it('safe-stops on an expired window only where the register puts the window', () => {
    for (const id of A7_STATE_IDS) {
      expect(a7OfflineStanding(id, 'valid').safeStop, id).toBe(false)
      expect(a7OfflineStanding(id, 'expired').safeStop, id).toBe(a7TrustWindowGoverns(id))
    }
    const stopped = a7OfflineStanding('STATE-A7-HARDSUSP', 'expired')
    expect(stopped.newRunsStart).toBe('no')
    expect(stopped.inFlightRunsContinue).toBe('no')
    expect(stopped.what).toContain(strip(registerCell(78_817, 'fallback')))
    expect(registerCell(78_817, 'klass')).toBe('Safe-stop required')
  })

  // FAILS IF: hard suspension stops work already running, which is the
  // inversion this whole task exists against. L41305 and AC-A7-6 both say
  // otherwise and both are read.
  // Planted: STATE-A7-HARDSUSP's inFlightRunsContinue set to 'no' — went red.
  it('lets in-flight Runs continue under hard suspension and starts no new one', () => {
    const hard = a7OfflineStanding('STATE-A7-HARDSUSP')
    expect(hard.newRunsStart).toBe('no')
    expect(hard.inFlightRunsContinue).toBe('yes')
    // Soft suspension is the opposite pair, and compliance stops both, so the
    // three are genuinely different rather than one severity number.
    expect(a7OfflineStanding('STATE-A7-SOFTSUSP').newRunsStart).toBe('yes')
    expect(a7OfflineStanding('STATE-A7-SOFTSUSP').inFlightRunsContinue).toBe('yes')
    expect(a7OfflineStanding('STATE-A7-COMPLIANCELOCK').newRunsStart).toBe('no')
    expect(a7OfflineStanding('STATE-A7-COMPLIANCELOCK').inFlightRunsContinue).toBe('no')
    expect(strip(L(41_305))).toContain('no new Runs start')
  })

  // FAILS IF: an answer the source does not state is filled in, or a stated
  // one is marked unstated. Six of fourteen, computed, and the three states
  // that carry them are the three the register gives no completion answer for.
  // Planted: STATE-A7-WIPED's pair changed to 'no'/'no' — went red on the
  // count, which is why the count is computed rather than written.
  it('marks six of the fourteen answers not-stated rather than inventing them', () => {
    expect(A7_STANDING_NOT_STATED).toHaveLength(6)
    expect(A7_STANDINGS).toHaveLength(A7_STATE_IDS.length)
    // Widened to `A7Standing` deliberately. `A7_STANDINGS` is a literal
    // tuple, so the `||` narrows the second operand's row away and TypeScript
    // calls the comparison unreachable — which is the same consequence the
    // `as const` idiom's own note warns about for `.includes()`.
    const unstated = new Set(
      A7_STANDINGS.filter(
        (s: A7Standing) =>
          s.newRunsStart === 'not-stated' || s.inFlightRunsContinue === 'not-stated',
      ).map((s) => s.state),
    )
    expect([...unstated].sort()).toEqual(
      ['STATE-A7-PINLOCK', 'STATE-A7-WIPEPENDING', 'STATE-A7-WIPED'].sort(),
    )
    // Every one of the three is a state whose register row is not the
    // suspension-honouring row, so the source classifies it under a different
    // function and states no Run answer for it.
    for (const state of unstated) expect(a7Standing(state).registerLine).not.toBe(78_804)
    // The wipe row's Expiry cell IS the open decision, in one line.
    expect(registerCell(78_803, 'expiry')).toContain('DEC-WIPE-001')
  })
})

describe('the register and this module’s own matrix row disagree about who may reset', () => {
  // FAILS IF: the divergence is smoothed away in either direction. Both lines
  // are parsed and the disagreement itself is asserted, so aligning them goes
  // red rather than going quiet.
  // Planted: A7_PIN_RESET_ROLE_DIVERGENCE.fromTheRegister rewritten to add the
  // Quality Manager — went red on the equality with the parsed cell.
  it('holds L78802’s two roles against L41299’s three, and corrects neither', () => {
    const registerRoles = strip(registerCell(A7_PIN_RESET_ROLE_DIVERGENCE.registerLine, 'roles'))
    expect(registerRoles).toBe(A7_PIN_RESET_ROLE_DIVERGENCE.fromTheRegister)
    expect(registerRoles).toContain('Supervisor')
    expect(registerRoles).toContain('Tenant Admin')
    expect(registerRoles).not.toContain('Quality Manager')

    // The matrix row grants three, and this module's transcription of it is
    // unchanged: the row is read through the shipped cells, not re-parsed.
    const row = a7RowById('pin-reset')
    for (const column of ['Supervisor', 'Quality Manager', 'Tenant Admin'] as const) {
      expect(row.cells[column].outcome, column).toBe('allowed')
    }
    const matrixCells = cellsOf(A7_PIN_RESET_ROLE_DIVERGENCE.matrixLine)
    for (const index of [2, 3, 4]) {
      expect(outcomeOf(at(matrixCells, index, `L41299 cell ${index}`))).toBe('allowed')
    }
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
