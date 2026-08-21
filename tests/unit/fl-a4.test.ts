import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { stripComments } from '../coverage/strip-comments'
import { FL_MATRIX_SHAPE, controlsOnActsHeldElsewhere } from '@/frontline/matrix'
import { CAPTURE_STATES, captureStateLine } from '@/frontline/capture'
import { OPEN_DECISION_IDS } from '@/disclosure/decisions'
import { CAPTURE_TYPES } from '@/studio/vocab/authoring'
import { roleById } from '@/domain/roles'
import { FLA4_CHARTER_STATEMENTS, FLA4_CHARTER_STATEMENT_IDS } from '@/frontline/modules/fl-a4/charter'
import {
  FLA4_COLUMNS,
  FLA4_MATRIX,
  FLA4_TOKEN_TALLY,
  fla4Affordance,
  fla4Row,
  type Fla4Column,
  type Fla4Row,
} from '@/frontline/modules/fl-a4/matrix'
import {
  FLA4_CAPTURE_TYPE_RENDERING,
  FLA4_CARD_PATTERN_IDS,
  FLA4_DECISIONS_NOT_IN_THE_SHARED_CANON,
  FLA4_DECISION_IN_THE_SHARED_CANON,
  FLA4_FUNCTIONALITIES,
  FLA4_FUNCTIONALITIES_NAMING_NO_PATTERN,
  FLA4_PATTERNS,
  FLA4_RENDERED_CAPTURE_TYPES,
  FLA4_UNRENDERED_TYPE_NAMES,
  FLA4_WORKED_CAPTURE,
  FLA4_STORYBOARD_STATES,
  FLA4_WORKED_CAPTURE_WITHOUT_PROVENANCE,
  fla4CaptureLine,
  fla4PlatformHoldsTheRecord,
  fla4ProvenanceLine,
  inTheSharedCanon,
} from '@/frontline/modules/fl-a4/service'

/**
 * `MOD-FL-A4` — Data Capture and Evidence, against the frozen source.
 *
 * WRITTEN AFTER THE CODE, AGAINST THE SOURCE, NOT AGAINST THE BRIEF. Every
 * expected string below was read out of the hash-verified blueprint by the
 * assertions themselves wherever that was possible: the nine matrix rows are
 * PARSED out of L40722-L40730 and compared to the transcription rather than
 * being typed in twice, so a wrong transcription and a wrong expectation
 * cannot cancel each other out.
 *
 * EVERY GATE HERE WAS SEEN RED. Each `it` names, in its own comment, the
 * defect that was planted into the module and then restored — the plant, the
 * failure, and the restore, once per gate. A gate that cannot fail is worse
 * than no gate; four shipped tests in this build could not fail.
 */

/* ── the frozen source ─────────────────────────────────────────────────── */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA256 = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const SOURCE_LINE_COUNT = 122_241

const sourceBytes = existsSync(SOURCE_PATH) ? readFileSync(SOURCE_PATH) : Buffer.alloc(0)
const sourceLines = ((lines: string[]) => (lines.at(-1) === '' ? lines.slice(0, -1) : lines))(
  sourceBytes.toString('utf8').split('\n'),
)

/** 1-based, exactly as a citation writes it. */
const at = (line: number): string => sourceLines[line - 1] ?? ''

/**
 * Quote marks folded, markdown emphasis stripped, dashes folded, whitespace
 * collapsed, lowercased. The same normalisation `locator-fidelity.test.ts`
 * applies, for the same reason: the source writes `Run's` with an ASCII
 * apostrophe and this build's prose writes it with a curly one, and that is
 * a typography difference rather than a transcription difference.
 */
const normalise = (s: string): string =>
  s
    .replace(/['‘’“”]/g, '"')
    .replace(/[`*_]/g, '')
    .replace(/[–—‒]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

/** The pipe-delimited cells of a markdown table row, outer pipes dropped. */
function tableCells(line: string): readonly string[] {
  const parts = line.split('|')
  return parts.slice(1, parts.length - 1).map((c) => c.trim())
}

describe('the frozen source this suite reads', () => {
  // FAILS IF: the file is missing, truncated, or edited. Everything below is
  // a claim ABOUT this file, so a claim proved against a different file is
  // not proved at all.
  it('is the hash-verified blueprint, at its stated length', () => {
    expect(sourceBytes.length).toBeGreaterThan(0)
    expect(createHash('sha256').update(sourceBytes).digest('hex')).toBe(SOURCE_SHA256)
    expect(sourceLines).toHaveLength(SOURCE_LINE_COUNT)
  })
})

/* ==================================================================== *
 * THE SPAN AND THE ARITHMETIC.
 * ==================================================================== */

const SHAPE = FL_MATRIX_SHAPE.find((m) => m.module === 'MOD-FL-A4')

describe('the span of the MOD-FL-A4 matrix', () => {
  // PLANTED: `firstDataLine` in the module's own row-ordering assumption was
  // moved by one (row 1's `sourceRef` set to 'L40721'). RED: this gate named
  // the row and the two line numbers. RESTORED.
  //
  // FAILS IF: a row is dropped, added, or transcribed against the wrong
  // line. The span comes from the shared register and the ordinals come from
  // this transcription, so a lost row moves one and not the other.
  it('runs nine data rows from L40722 to L40730, and the transcription sits on them', () => {
    expect(SHAPE).toBeDefined()
    expect(SHAPE?.rows).toBe(9)
    expect(SHAPE?.columns).toBe(5)
    expect(SHAPE?.headerLine).toBe(40720)
    expect(SHAPE?.separatorLine).toBe(40721)
    expect(SHAPE?.firstDataLine).toBe(40722)
    expect(SHAPE?.lastDataLine).toBe(40730)

    expect(FLA4_MATRIX).toHaveLength(SHAPE?.rows ?? -1)
    expect(FLA4_COLUMNS).toHaveLength(SHAPE?.columns ?? -1)
    expect(FLA4_MATRIX.map((r) => r.sourceRef)).toEqual([
      'L40722',
      'L40723',
      'L40724',
      'L40725',
      'L40726',
      'L40727',
      'L40728',
      'L40729',
      'L40730',
    ])
  })

  // PLANTED: `READONLY_AUDITOR` renamed in `FLA4_COLUMNS` only. RED: the
  // heading comparison named the column. RESTORED.
  //
  // FAILS IF: a column key stops being the role whose name heads that column
  // in the source. The five headings at L40720 are character-for-character
  // the five tenant roles' own names, which is why this matrix keys on
  // `RoleId` and spells no persona name of its own.
  it('keys its five columns on the roles the header line names, in the header’s order', () => {
    const headings = tableCells(at(40720)).slice(1)
    expect(headings).toEqual([
      'Worker',
      'Supervisor',
      'Quality Manager',
      'Tenant Admin',
      'Read-only Auditor',
    ])
    expect(FLA4_COLUMNS.map((c) => roleById(c).name)).toEqual(headings)
  })

  // PLANTED: `FLA4_TOKEN_TALLY['Read-only']` changed from 4 to 3 and
  // `Allowed` from 4 to 5, so the total still reached 45. RED on the
  // per-token comparison, green on the total — which is the whole reason the
  // per-token check exists beside the sum. RESTORED.
  //
  // FAILS IF: a cell's token is transcribed wrongly. The tally is a hand
  // count of the cells and the derived side is a fold over the rows; a
  // compensating pair of edits fails here even though 45 still reaches 45.
  it('holds forty-five cells whose tokens match a hand count, token by token', () => {
    const TOKEN_OF: Readonly<Record<string, string>> = {
      allowed: 'Allowed',
      allowedWithConditions: 'Allowed with conditions',
      readOnly: 'Read-only',
      unavailable: 'Unavailable',
      explicitlyProhibited: 'Explicitly prohibited',
      clientDecisionRequired: 'Client Decision Required',
      notApplicable: 'Not applicable',
    }
    const derived: Record<string, number> = {}
    let cells = 0
    for (const row of FLA4_MATRIX) {
      for (const column of FLA4_COLUMNS) {
        const token = TOKEN_OF[row.cells[column].outcome] ?? row.cells[column].outcome
        derived[token] = (derived[token] ?? 0) + 1
        cells += 1
      }
    }
    expect(cells).toBe(45)
    expect(FLA4_MATRIX.length * FLA4_COLUMNS.length).toBe(45)
    expect(Object.values(FLA4_TOKEN_TALLY).reduce((n, v) => n + v, 0)).toBe(45)
    expect(derived).toEqual(FLA4_TOKEN_TALLY)
    expect(FLA4_TOKEN_TALLY['Allowed']).toBe(4)
    expect(FLA4_TOKEN_TALLY['Not applicable']).toBe(8)
    expect(FLA4_TOKEN_TALLY['Client Decision Required']).toBe(1)
    expect(FLA4_TOKEN_TALLY['Explicitly prohibited']).toBe(28)
    expect(FLA4_TOKEN_TALLY['Read-only']).toBe(4)
  })
})

/* ==================================================================== *
 * THE TRANSCRIPTION, PARSED OUT OF THE SOURCE.
 * ==================================================================== */

/** The source's own token spelling, read off the front of a cell. */
const TOKEN_TO_OUTCOME: readonly (readonly [string, string])[] = [
  ['Client Decision Required', 'clientDecisionRequired'],
  ['Allowed with conditions', 'allowedWithConditions'],
  ['Explicitly prohibited', 'explicitlyProhibited'],
  ['Not applicable', 'notApplicable'],
  ['Read-only', 'readOnly'],
  ['Unavailable', 'unavailable'],
  ['Allowed', 'allowed'],
]

function outcomeOf(sourceCell: string): string {
  const bare = normalise(sourceCell)
  for (const [token, outcome] of TOKEN_TO_OUTCOME) {
    if (bare.startsWith(normalise(token))) return outcome
  }
  return `UNRECOGNISED TOKEN: ${sourceCell}`
}

describe('the nine rows, cell by cell, against L40722-L40730', () => {
  // PLANTED: row 6's Quality Manager note lost its ", plus mark evidence
  // reviewed" tail. RED, naming the row and the column. RESTORED.
  //
  // FAILS IF: any of the forty-five cells drifts from the source. The
  // expectation is PARSED from the blueprint line rather than typed here, so
  // there is no second copy of the answer for a wrong transcription to agree
  // with. Every note must BEGIN with the source's own cell text; a row may
  // add the stated reason §22.13 gives it, and may not replace the words.
  it('transcribes every action and every cell from the line it cites', () => {
    for (const row of FLA4_MATRIX) {
      const line = Number(row.sourceRef.slice(1))
      const cells = tableCells(at(line))
      expect(cells, `${row.id} at ${row.sourceRef}`).toHaveLength(6)
      expect(normalise(cells[0] ?? ''), `${row.id} action`).toBe(normalise(row.control))

      FLA4_COLUMNS.forEach((column, index) => {
        const sourceCell = cells[index + 1] ?? ''
        const where = `${row.id} · ${column} · ${row.sourceRef}`
        expect(row.cells[column].outcome, `${where} token`).toBe(outcomeOf(sourceCell))
        expect(normalise(row.cells[column].note), `${where} note`).toContain(
          normalise(sourceCell),
        )
        expect(normalise(row.cells[column].note).startsWith(normalise(sourceCell)), where).toBe(
          true,
        )
      })
    }
  })

  // PLANTED: the `uniform` helper on row 8 was given the row-9 reason. RED —
  // the reason no longer appeared on L40729's row. RESTORED.
  //
  // FAILS IF: a five-column uniform prohibition loses its stated reason and
  // becomes a bare token. Those four rows are where the interesting content
  // is the reason, and a note equal to the token alone is the blank cell
  // wearing a word.
  it('gives each of the four uniform prohibitions a reason beyond its token', () => {
    const uniformRows = [
      'edit-or-delete-after-capture',
      'export-captured-media',
      'override-an-out-of-specification-result',
      'suppress-the-provenance-stamp',
    ] as const
    for (const id of uniformRows) {
      const row = fla4Row(id)
      for (const column of FLA4_COLUMNS) {
        const note = row.cells[column].note
        expect(row.cells[column].outcome, id).toBe('explicitlyProhibited')
        expect(note.length, `${id} · ${column}`).toBeGreaterThan(
          'Explicitly prohibited'.length + 20,
        )
      }
    }
  })
})

/* ==================================================================== *
 * THE ORDER OF QUESTIONS — THE CLASSIFICATION, NOT THE TOKEN.
 * ==================================================================== */

describe('what each cell draws', () => {
  // PLANTED: row 6's `placementByColumn` emptied, so the row fell back to its
  // single row-level place. RED — the Tenant Admin and the Read-only Auditor
  // were sent to the Client Command Center, which is not what L40727 says.
  // RESTORED.
  //
  // FAILS IF: four of the five cells of the highest-density cross-surface row
  // in the slice stop naming their own surface. Two surfaces and this screen
  // appear in one row, and `FrontlineMetElsewhere` holds one place — this is
  // the assertion that keeps the per-column transcription honest.
  it('sends row 6 to the surface each column’s own cell names', () => {
    const row = fla4Row('view-evidence-on-an-oversight-surface')

    const worker = fla4Affordance(row, 'WORKER')
    expect(worker.kind).toBe('refusal')

    const expected: Readonly<Record<Exclude<Fla4Column, 'WORKER'>, string>> = {
      SUPERVISOR: 'SURF-CC',
      QUALITY_MANAGER: 'SURF-CC',
      TENANT_ADMIN: 'SURF-DOH',
      READONLY_AUDITOR: 'SURF-DOH',
    }
    for (const [column, surface] of Object.entries(expected) as readonly [
      Exclude<Fla4Column, 'WORKER'>,
      string,
    ][]) {
      const drawn = fla4Affordance(row, column)
      expect(drawn.kind, column).toBe('cross-surface')
      if (drawn.kind !== 'cross-surface') throw new Error('unreachable')
      expect(drawn.surface, column).toBe(surface)
      expect(normalise(drawn.note), column).toBe(normalise(row.cells[column].note))
    }
  })

  // PLANTED: row 7's `placementByColumn` emptied. RED — the Quality Manager
  // cell drew a control, because its token reads `Allowed`. RESTORED.
  //
  // FAILS IF: the token is read without the sentence beside it. L40728 reads
  // `Allowed` for the Quality Manager and names "Client Command Center action
  // 7" in the same cell; a control here would be this surface claiming one of
  // that surface's ten closed actions.
  it('never draws a control for the Quality Manager on row 7', () => {
    const row = fla4Row('mark-evidence-reviewed')
    expect(row.cells.QUALITY_MANAGER.outcome).toBe('allowed')
    const drawn = fla4Affordance(row, 'QUALITY_MANAGER')
    expect(drawn.kind).toBe('cross-surface')
    if (drawn.kind !== 'cross-surface') throw new Error('unreachable')
    expect(drawn.surface).toBe('SURF-CC')
  })

  // PLANTED: row 7's Supervisor cell had its `openDecision` set to `null`.
  // RED. RESTORED.
  //
  // FAILS IF: an "and above" cell stops naming the decision that phrase is
  // carried as. `AC-MTX-004` (L10296) states that no matrix invents a role
  // ordering and that every "and above" reproduces the source's phrasing
  // under `DEC-PLUS-001`, and `TEST-MTX-004` (L10303) is a grep for exactly
  // this. This asserts the coupling rather than the sentence: every cell
  // whose note carries the phrase must name the decision.
  it('names DEC-PLUS-001 on every cell whose note says "and above"', () => {
    const carrying = FLA4_MATRIX.flatMap((row) =>
      FLA4_COLUMNS.filter((c) => /and above/i.test(row.cells[c].note)).map(
        (c) => [row, c] as const,
      ),
    )
    expect(carrying.length).toBeGreaterThan(0)
    for (const [row, column] of carrying) {
      expect(row.cells[column].openDecision, `${row.id} · ${column}`).toBe('DEC-PLUS-001')
    }
    expect(normalise(at(39840))).toContain(normalise('DEC-PLUS-001'))
  })

  // PLANTED: row 1's Tenant Admin `openDecision` set to `null`. RED.
  // RESTORED.
  //
  // FAILS IF: the one open cell of this matrix stops disclosing that it is
  // open. `AC-FL-009-5` (L39948) forbids resolving the Tenant Admin device-
  // session question in either direction, and `src/routes/definitions.ts`
  // records it once for all eleven cells that defer to it — this one being
  // MOD-FL-A4's, at L40722.
  it('carries the one Client Decision Required cell as open, and it is the Tenant Admin’s', () => {
    const open = FLA4_MATRIX.flatMap((row) =>
      FLA4_COLUMNS.filter((c) => row.cells[c].outcome === 'clientDecisionRequired').map(
        (c) => `${row.id} · ${c}`,
      ),
    )
    expect(open).toEqual(['create-a-capture · TENANT_ADMIN'])
    expect(fla4Row('create-a-capture').cells.TENANT_ADMIN.openDecision).toBe('AC-FL-009-5')

    const definitions = readFileSync(join('src', 'routes', 'definitions.ts'), 'utf8')
    expect(definitions).toContain('L40722')
    expect(definitions).toContain('AC-FL-009-5')
  })

  // PLANTED: row 7's Quality Manager placement changed from another-surface
  // to `this-screen`. RED — a fourth control appeared and the set comparison
  // named it. RESTORED.
  //
  // FAILS IF: any cell of this matrix draws a control that is not one of the
  // Worker's three on-device acts. This is the single strongest assertion in
  // the file, because it is a claim about all forty-five cells rather than
  // about the three the module meant to draw: four cells carry a permissive
  // token and only three of them are controls here.
  it('draws exactly three controls across all forty-five cells, all of them the Worker’s', () => {
    const controls = FLA4_MATRIX.flatMap((row) =>
      FLA4_COLUMNS.filter((c) => fla4Affordance(row, c).kind === 'control').map(
        (c) => `${row.id} · ${c}`,
      ),
    )
    expect(controls.sort()).toEqual([
      'append-a-correction · WORKER',
      'create-a-capture · WORKER',
      'edit-before-commit · WORKER',
    ])

    const permissive = FLA4_MATRIX.flatMap((row) =>
      FLA4_COLUMNS.filter((c) =>
        ['allowed', 'allowedWithConditions'].includes(row.cells[c].outcome),
      ).map((c) => `${row.id} · ${c}`),
    )
    expect(permissive).toHaveLength(4)
  })

  // FAILS IF: a row of this matrix carries an act `EXCL-FL-06` (L39489)
  // classifies as an invariant exclusion and classifies it as this screen's.
  // None of MOD-FL-A4's nine is one of those three acts, and asserting the
  // empty result is what keeps that true if a row is ever re-worded.
  //
  // THE RESOLVER IS PASSED BECAUSE THIS MATRIX PLACES PER COLUMN, AND THE
  // GUARD FOUND THAT OUT THE HARD WAY. `controlsOnActsHeldElsewhere` had an
  // unreachable second loop until `MOD-FL-B11` planted a misclassified row
  // and watched it stay green. Repaired, it reads each cell's own words —
  // and immediately reported this matrix's row 7, whose Quality Manager cell
  // says "Allowed — Client Command Center action 7" on a row classified
  // `screen`. THAT REPORT WAS RIGHT ABOUT THE ROW AND WRONG ABOUT THE SCREEN:
  // this module resolves placement per column and folds through
  // `fla4Affordance`, so it draws a cross-surface statement, not a control.
  // What the guard could not see was a field private to this module.
  //
  // So the private knowledge is handed over rather than the check weakened.
  // Passing nothing here would restore exactly the blindness B11 found.
  it('holds no EXCL-FL-06 invariant-excluded act, and the shared gate agrees', () => {
    expect(
      controlsOnActsHeldElsewhere([...FLA4_MATRIX], [...FLA4_COLUMNS], (row, column) => {
        const placed = (row as Fla4Row).placementByColumn[column]
        return placed !== undefined && placed.where !== 'this-screen' ? 'elsewhere' : 'this-screen'
      }),
    ).toEqual([])
  })

  // FAILS IF: the resolver above is silently doing all the work, which would
  // make the case above pass for a reason that has nothing to do with this
  // matrix being correct. Without the resolver the guard MUST report row 7 —
  // that is the measure of how much the private field is carrying, and it is
  // exactly one cell.
  it('reports row 7 to a caller that cannot see this module’s per-column placement', () => {
    const blind = controlsOnActsHeldElsewhere([...FLA4_MATRIX], [...FLA4_COLUMNS])
    expect(blind).toHaveLength(1)
    expect(blind[0]).toContain('mark-evidence-reviewed')
    expect(blind[0]).toContain('Client Command Center')
  })
})

/* ==================================================================== *
 * THE CAPTURE-TYPE CONTRACT.
 * ==================================================================== */

describe('the seven-type contract, plus none', () => {
  // PLANTED: `FLA4_RENDERED_CAPTURE_TYPES` re-declared as a local literal
  // with 'checklist' in place of 'checkbox confirmation'. RED on both the
  // identity check and the eighth-type check. RESTORED.
  //
  // FAILS IF: this module spells a second capture-type list. The contract is
  // settled in `@/studio/vocab/authoring` from `AC-STU-065` (L32421), and
  // `TEST-WF-AUT-002-04` (L53401) makes divergence between that list and the
  // Frontline renderer list a build failure — so the renderer list must BE
  // that list, by identity and not by agreement.
  it('renders the shared contract itself, never a copy of it', () => {
    expect(FLA4_RENDERED_CAPTURE_TYPES).toBe(CAPTURE_TYPES)
    expect(FLA4_RENDERED_CAPTURE_TYPES).toHaveLength(8)
    expect(Object.keys(FLA4_CAPTURE_TYPE_RENDERING).sort()).toEqual([...CAPTURE_TYPES].sort())
  })

  // PLANTED: 'checklist' added to `FLA4_UNRENDERED_TYPE_NAMES[0].rendersAs`
  // as a type name rather than a rendering. Would not compile — `rendersAs`
  // is typed `CaptureType`. The runtime plant used instead was adding
  // 'boolean' to the rendered list, which went RED here. RESTORED.
  //
  // FAILS IF: a name the adopted contract does not carry reaches the
  // renderer. `AC-A4-3` (L40867) says the application renders exactly the
  // seven plus none "and renders no eighth type"; §1.7's and §7.8.3's
  // `checklist` and `boolean` are carried as renderings of checkbox
  // confirmation and never as members.
  it('renders no type the contract does not name', () => {
    const rendered = FLA4_RENDERED_CAPTURE_TYPES.map(normalise)
    for (const t of FLA4_UNRENDERED_TYPE_NAMES) {
      expect(rendered, t.name).not.toContain(normalise(t.name))
      expect(rendered, t.rendersAs).toContain(normalise(t.rendersAs))
    }
    expect(normalise(at(40867))).toContain(normalise('and renders no eighth type'))
  })

  // PLANTED: `FUNC-A4-03-1-5`'s cited line changed from L40807 to L40806.
  // RED, naming the type, the identifier and the two lines. RESTORED.
  //
  // FAILS IF: a per-type citation points at the wrong line. Seven of the
  // eight name a functionality of §22.13, and the identifier's line is a
  // fact the source states exactly — no window is allowed on it.
  it('cites each type’s functionality at a line that identifier really occurs at', () => {
    for (const type of CAPTURE_TYPES) {
      const rendering = FLA4_CAPTURE_TYPE_RENDERING[type]
      if (rendering.funcId === 'none') {
        expect(normalise(at(40769)), type).toContain(normalise('dropdown selection'))
        continue
      }
      expect(rendering.sourceRef, type).toBe(
        `${rendering.funcId} L${rendering.sourceRef.split(' L')[1] ?? ''}`,
      )
      const line = Number(rendering.sourceRef.split(' L')[1])
      expect(at(line), `${type} · ${rendering.funcId}`).toContain(rendering.funcId)
    }
  })
})

/* ==================================================================== *
 * THE CAPTURE STATE LADDER — NO "SYNCED", NO BARE SUCCESS.
 * ==================================================================== */

describe('the state a capture is shown in', () => {
  // PLANTED: `fla4CaptureLine` rewritten to return 'Synced.' for
  // 'reflected-in-summaries'. RED on all three assertions. RESTORED.
  //
  // FAILS IF: this module invents a state. L39622 says in its own words that
  // "there is no single state called "synced"", `AC-FL-006-3` (L39636)
  // forbids rendering a capture as synced without naming its actual state,
  // and `TEST-SCR-FL-003` (L48700) requires the label to be one of the
  // ladder's own and "never a bare success".
  it('prints a ladder state for every one of the thirteen, and never a success', () => {
    for (const state of CAPTURE_STATES) {
      const line = fla4CaptureLine(state)
      expect(line, state).toBe(captureStateLine(state))
      expect(line.toLowerCase(), state).not.toContain('synced')
      expect(line.toLowerCase(), state).not.toMatch(/\b(success|succeeded|done|complete)\b/)
    }
    expect(CAPTURE_STATES).not.toContain('synced')
    expect(normalise(at(39622))).toContain(normalise('there is no single state called "synced"'))
  })

  // PLANTED: `FLA4_STORYBOARD_STATES` extended with 'accepted'. The FIRST
  // version of this gate walked a hardcoded pair instead of the constant and
  // stayed GREEN with the plant in place — a gate that could not fail,
  // which is the exact shape four shipped tests in this build already had.
  // It now walks the constant, went RED on the same plant, and was RESTORED.
  //
  // FAILS IF: this module shows a capture as recorded by the platform while
  // it sits on the device. `STATE-09` (L48669): "A capture is never shown as
  // recorded by the platform while it sits on the device."
  it('says the platform does not hold the record, for every state its storyboard walks', () => {
    expect(FLA4_STORYBOARD_STATES.length).toBeGreaterThan(0)
    for (const state of FLA4_STORYBOARD_STATES) {
      expect(fla4PlatformHoldsTheRecord(state), state).toBe(false)
      expect(fla4CaptureLine(state), state).toContain(
        'The platform does not hold this record yet.',
      )
    }
    expect(normalise(at(48669))).toContain(
      normalise('A capture is never shown as recorded by the platform while it sits on the device'),
    )
  })

  // PLANTED: the unresolved envelope's `note` emptied to ''. Would not
  // compile as a missing field; the runtime plant set it to a single space,
  // and this gate went RED on the length check. RESTORED.
  //
  // FAILS IF: unresolved provenance degrades into an empty value.
  // `AC-FL-006-1` (L39634) requires "unresolved provenance recorded as an
  // explicit unresolved marker rather than an empty value", and
  // `TEST-A4-10` (L40887) is the test that removes the context and asserts
  // the capture proceeds.
  it('records unresolved provenance as a marker carrying a note, never as a blank', () => {
    expect(fla4ProvenanceLine(FLA4_WORKED_CAPTURE)).toBeNull()
    const line = fla4ProvenanceLine(FLA4_WORKED_CAPTURE_WITHOUT_PROVENANCE)
    expect(line).not.toBeNull()
    expect(line ?? '').toContain('provenance never blocks a capture')
    expect(FLA4_WORKED_CAPTURE_WITHOUT_PROVENANCE.namedLocation.resolved).toBe(false)
    if (FLA4_WORKED_CAPTURE_WITHOUT_PROVENANCE.namedLocation.resolved) throw new Error('unreachable')
    expect(FLA4_WORKED_CAPTURE_WITHOUT_PROVENANCE.namedLocation.note.trim().length).toBeGreaterThan(
      10,
    )
    expect(normalise(at(39634))).toContain(
      normalise('rather than an empty value'),
    )
  })

  // PLANTED: `deviceIdentity` changed from 'TAB-014' to 'TAB-015'. RED,
  // naming the value. RESTORED.
  //
  // FAILS IF: the worked capture stops being the source's own. ONE capture is
  // described TWICE — the storyboard `SB-FL-013` at L40855 gives the identity,
  // the device and the device time in the record line it prints on screen, and
  // the Illustrative Example at L40857 gives the identity, the pinned version
  // and the three location elements. Neither line carries all of it, which is
  // why both are cited and each value is checked against the line that
  // actually holds it rather than against a union that would let a wrong
  // citation pass.
  it('fills the envelope with the source’s own illustrative capture', () => {
    const storyboard = normalise(at(40855))
    const example = normalise(at(40857))

    for (const value of [
      FLA4_WORKED_CAPTURE.workerIdentity,
      FLA4_WORKED_CAPTURE.deviceIdentity,
      FLA4_WORKED_CAPTURE.deviceTime,
    ]) {
      expect(storyboard, `${value} at SB-FL-013 L40855`).toContain(normalise(value))
    }

    expect(FLA4_WORKED_CAPTURE.namedLocation.resolved).toBe(true)
    if (!FLA4_WORKED_CAPTURE.namedLocation.resolved) throw new Error('unreachable')
    for (const value of [
      FLA4_WORKED_CAPTURE.workerIdentity,
      FLA4_WORKED_CAPTURE.stepDefinition.pinnedVersion,
      FLA4_WORKED_CAPTURE.namedLocation.site,
      FLA4_WORKED_CAPTURE.namedLocation.area,
      FLA4_WORKED_CAPTURE.namedLocation.cell,
      FLA4_WORKED_CAPTURE.runId.replace('RUN-', ''),
    ]) {
      expect(example, `${value} at L40857`).toContain(normalise(value))
    }
    expect(FLA4_WORKED_CAPTURE.serverReceiptTime.received).toBe(false)
    // The narrowing is the envelope's own discriminant, not a cast. L39572:
    // a screen with no limits carries NO result field rather than a null one,
    // so `deterministicResult` is reachable only through
    // `screenCarriesLimits`, and a torque screen carries limits.
    expect(FLA4_WORKED_CAPTURE.screenCarriesLimits).toBe(true)
    if (!FLA4_WORKED_CAPTURE.screenCarriesLimits) throw new Error('unreachable')
    expect(FLA4_WORKED_CAPTURE.deterministicResult.inSpecification).toBe(false)
    expect(FLA4_WORKED_CAPTURE.deterministicResult.severityBand).toBe(2)
    expect(example).toContain(normalise('as Severity 2'))
  })
})

/* ==================================================================== *
 * THE IDENTITY CARD.
 * ==================================================================== */

describe('the identity card, transcribed from L40708-L40716', () => {
  // PLANTED: the Owning-surface statement had its second sentence removed —
  // "The Client Command Center and the Delivery Operations Hub display
  // evidence; they never edit it." RED, because the remaining text no longer
  // matched the cited line. RESTORED.
  //
  // FAILS IF: a card statement is paraphrased, trimmed or cited wrongly.
  // Every statement's own words must appear at its own line, which is a
  // claim about the SOURCE and not about this transcription's tidiness.
  it('carries every statement verbatim at the line it cites', () => {
    expect(FLA4_CHARTER_STATEMENTS).toHaveLength(FLA4_CHARTER_STATEMENT_IDS.length)
    expect(FLA4_CHARTER_STATEMENTS.map((s) => s.id)).toEqual([...FLA4_CHARTER_STATEMENT_IDS])
    for (const s of FLA4_CHARTER_STATEMENTS) {
      const line = Number(s.sourceRef.slice(1))
      expect(line, s.id).toBeGreaterThan(0)
      // The Identifier statement is the one that joins two of the source's
      // own bolded fields into one sentence, so it is checked in halves.
      const parts = s.id === 'identifier' ? ['MOD-FL-A4', 'Data Capture and Evidence'] : [s.text]
      for (const part of parts) {
        expect(normalise(at(line)), `${s.id} at ${s.sourceRef}`).toContain(normalise(part))
      }
    }
  })

  // FAILS IF: the offline account stops being stated. L40757's own words are
  // "Nothing about capture depends on connectivity." A card that renders only
  // the connected path implies the capture layer needs a network, which is
  // the one claim chapter 22 exists to deny.
  it('states the offline account in the module’s own words', () => {
    const offline = FLA4_CHARTER_STATEMENTS.find((s) => s.id === 'offline-behaviour')
    expect(offline).toBeDefined()
    expect(offline?.text).toContain('Nothing about capture depends on connectivity.')
    expect(offline?.sourceRef).toBe('L40757')
  })
})

/* ==================================================================== *
 * THE FALLBACK OBLIGATION.
 * ==================================================================== */

describe('the twenty-four functionalities and their patterns', () => {
  // PLANTED: `FUNC-A4-05-2-2` deleted from the list. RED on both the count
  // and the set comparison against the source. RESTORED.
  //
  // FAILS IF: a functionality is dropped or invented. The expected set is
  // GREPPED out of the frozen source rather than typed here, so a missing
  // entry cannot be matched by a missing expectation.
  it('holds exactly the FUNC-A4-* identifiers the frozen source defines', () => {
    const identifiersFor = (module: string): ReadonlySet<string> => {
      const found = new Set<string>()
      const pattern = new RegExp('`(FUNC-' + module + '-[0-9-]+)`', 'g')
      for (const line of sourceLines) for (const m of line.matchAll(pattern)) found.add(m[1] ?? '')
      return found
    }
    const a4 = identifiersFor('A4')
    expect(a4.size).toBe(24)
    expect(FLA4_FUNCTIONALITIES).toHaveLength(24)
    expect(FLA4_FUNCTIONALITIES.map((f) => f.id).sort()).toEqual([...a4].sort())

    // THE BRIEF'S SUPERLATIVE, CHECKED AND CORRECTED. It calls 24 "the
    // largest built in this slice". `MOD-FL-A6` carries 28, so A4 is the
    // SECOND largest of the twelve. Counted here rather than believed.
    expect(identifiersFor('A6').size).toBe(28)
    expect(a4.size).toBeLessThan(identifiersFor('A6').size)
  })

  // PLANTED: `FUNC-A4-01-1-1`'s `sourceRef` line changed to L40792. RED,
  // naming the identifier and the line. RESTORED.
  //
  // FAILS IF: a functionality's citation names a line that identifier does
  // not occur at. Every `sourceRef` here is written as `<identifier> L<line>`
  // precisely so it is a checkable claim rather than a bare number.
  it('cites every functionality at a line that identifier really occurs at', () => {
    for (const f of FLA4_FUNCTIONALITIES) {
      expect(f.sourceRef, f.id).toMatch(new RegExp(`^${f.id} L\\d+$`))
      const line = Number(f.sourceRef.split(' L')[1])
      expect(at(line), f.sourceRef).toContain(f.id)
    }
  })

  // PLANTED: `FUNC-A4-05-1-3` given `patterns: ['FB-FL-CAP-01']` to make
  // `AC-FL-011-1` come out clean. RED — the list of eight became a list of
  // seven and the comparison named it. RESTORED.
  //
  // FAILS IF: a functionality naming no pattern is quietly given one, or one
  // that names a pattern loses it. `AC-FL-011-1` (L40151) requires every
  // functionality to name at least one `FB-FL-*` pattern and eight of this
  // module's twenty-four do not — each on a stated ground. The finding is
  // recorded rather than smoothed away, so this asserts the eight BY NAME.
  it('reports the eight functionalities that name no pattern, by name', () => {
    expect([...FLA4_FUNCTIONALITIES_NAMING_NO_PATTERN].sort()).toEqual([
      'FUNC-A4-03-2-1',
      'FUNC-A4-04-3-1',
      'FUNC-A4-05-1-1',
      'FUNC-A4-05-1-2',
      'FUNC-A4-05-1-3',
      'FUNC-A4-05-2-1',
      'FUNC-A4-05-2-2',
      'FUNC-A4-05-3-1',
    ])
    for (const f of FLA4_FUNCTIONALITIES) {
      const namesNone = f.patterns.length === 0
      expect(f.noPatternReason === null, `${f.id} reason`).toBe(!namesNone)
      if (namesNone) expect(f.noPatternReason ?? '', f.id).toContain('Not applicable')
    }
    expect(normalise(at(40151))).toContain(
      normalise('Every functionality in this chapter names at least one'),
    )
  })

  // PLANTED: `FB-FL-CORE-01` removed from `FLA4_CARD_PATTERN_IDS`. RED — the
  // card reading and the map reading stopped agreeing. RESTORED.
  //
  // FAILS IF: the module's own Fallback-identifier line (L40785) and the
  // §22.9 module map stop naming the same five patterns. Two independent
  // readings of one fact; comparing them is a check, and deriving one from
  // the other would not be.
  it('agrees with the §22.9 map on which five patterns are this module’s', () => {
    expect([...FLA4_PATTERNS.map((p) => p.id)].sort()).toEqual([...FLA4_CARD_PATTERN_IDS].sort())
    expect(FLA4_PATTERNS).toHaveLength(5)
    const card = normalise(at(40785))
    for (const id of FLA4_CARD_PATTERN_IDS) expect(card, id).toContain(normalise(id))
  })

  // FAILS IF: a pattern this module leans on has no named terminal safe
  // state. `AC-FL-011-2` (L40152) requires every retry path to have a
  // bounded exit into one.
  it('gives every one of its five patterns a named terminal safe state', () => {
    for (const p of FLA4_PATTERNS) {
      expect(p.terminalSafeState.trim().length, p.id).toBeGreaterThan(20)
    }
    expect(normalise(at(40152))).toContain(
      normalise('every retry path has a bounded exit into a named terminal safe state'),
    )
  })
})

/* ==================================================================== *
 * THE DECISIONS.
 * ==================================================================== */

describe('the decisions this module discloses', () => {
  // PLANTED: `DEC-CAP-001` added to `FLA4_DECISIONS_NOT_IN_THE_SHARED_CANON`.
  // RED, naming it. RESTORED.
  //
  // FAILS IF: a module-local disclosure outlives the reason it exists. The
  // five carried here are exactly the ones the shared canon has no record
  // for; the moment the controller lifts one into
  // `src/disclosure/decisions.ts` this goes red and forces the switch, which
  // is what stops a local copy becoming a second spelling.
  it('carries locally only what the shared canon does not carry', () => {
    expect(inTheSharedCanon(FLA4_DECISION_IN_THE_SHARED_CANON)).toBe(true)
    expect(OPEN_DECISION_IDS).toContain(FLA4_DECISION_IN_THE_SHARED_CANON)
    expect(FLA4_DECISIONS_NOT_IN_THE_SHARED_CANON).toHaveLength(5)
    for (const d of FLA4_DECISIONS_NOT_IN_THE_SHARED_CANON) {
      expect(inTheSharedCanon(d.id), d.id).toBe(false)
    }
    expect(FLA4_DECISIONS_NOT_IN_THE_SHARED_CANON.map((d) => d.id)).toEqual([
      'DEC-STORE-001',
      'DEC-AREA-001',
      'DEC-SITE-001',
      'DEC-PLUS-001',
      'DEC-SCAN-001',
    ])
  })

  // PLANTED: `DEC-STORE-001`'s third reading deleted. RED on the count.
  // RESTORED.
  //
  // FAILS IF: a reading is dropped, or a locator names a line the identifier
  // does not occur at. Every reading must carry its own locator and every
  // locator must resolve — a disclosure that names one of three candidate
  // behaviours has quietly answered the question.
  it('carries every reading with a locator that resolves', () => {
    for (const d of FLA4_DECISIONS_NOT_IN_THE_SHARED_CANON) {
      expect(d.readings.length, d.id).toBeGreaterThanOrEqual(2)
      expect(d.adopted.trim().length, d.id).toBeGreaterThan(40)
      expect(d.whereItBites.trim().length, d.id).toBeGreaterThan(20)
      for (const r of d.readings) {
        expect(r.locator, `${d.id} locator`).toMatch(/^DEC-[A-Z]+-001 L\d+$/)
        const [id, line] = r.locator.split(' L')
        expect(at(Number(line)), r.locator).toContain(id ?? '')
      }
    }
    expect(FLA4_DECISIONS_NOT_IN_THE_SHARED_CANON[0]?.readings).toHaveLength(3)
  })

  // FAILS IF: `DEC-STORE-001` stops being carried as an explicit absence.
  // `AC-FL-011-5` (L40155) requires it to "remain visibly open" and
  // `TEST-FL-011-5` (L40165) tests for an explicit marker where the
  // behaviour would otherwise be assumed. The one thing this module may not
  // do is pick one of the three.
  it('adopts no storage-full behaviour, and says so', () => {
    const store = FLA4_DECISIONS_NOT_IN_THE_SHARED_CANON.find((d) => d.id === 'DEC-STORE-001')
    expect(store?.adopted.startsWith('None.')).toBe(true)
    expect(normalise(at(40155))).toContain(normalise('remain visibly open'))
    expect(normalise(at(40116))).toContain(normalise('no behaviour may be invented here'))
  })
})

/* ==================================================================== *
 * THE CATEGORICAL ABSENCES — SWEPT, NOT ASSERTED.
 * ==================================================================== */

const MODULE_DIR = join('src', 'frontline', 'modules', 'fl-a4')

function moduleSourceWithoutComments(): readonly (readonly [string, string])[] {
  return readdirSync(MODULE_DIR).map(
    (name) => [name, stripComments(readFileSync(join(MODULE_DIR, name), 'utf8'))] as const,
  )
}

describe('what this module never says', () => {
  // PLANTED: the string 'countdown to the next step' added to the panel's
  // capture-type paragraph. RED, naming the file and the word. RESTORED.
  //
  // FAILS IF: a pace figure, a countdown, a ranking or a productivity
  // comparison reaches any string of this module, in any state.
  // `AC-FL-000-5` (L39100) is categorical — "No screen in any module, in any
  // state, in any release of this scope displays a pace figure, a countdown
  // against expectation, or a comparison to another worker" — and
  // `AC-SCOPE-045` (L2683) says the same at scope level. Comments are
  // stripped first: a doc comment DENYING these words would otherwise match
  // itself.
  it('carries no pace, timer, countdown, ranking or productivity comparison', () => {
    const forbidden = /\b(pace|timer|countdown|ranking|rankings|productivity)\b/i
    for (const [name, text] of moduleSourceWithoutComments()) {
      expect(forbidden.test(text), `${name} names a forbidden measure`).toBe(false)
    }
    expect(normalise(at(39100))).toContain(normalise('displays a pace figure, a countdown against expectation'))
  })

  // PLANTED: `CAPTURE_STATE_LABEL` shadowed in the module with a record
  // mapping 'reflected-in-summaries' to 'Synced'. RED. RESTORED.
  //
  // FAILS IF: the word reaches any file of this module as a state. The type
  // has no such member, so this catches the string arriving some other way —
  // a heading, a label, a data attribute.
  it('never writes the word this platform has no state for', () => {
    for (const [name, text] of moduleSourceWithoutComments()) {
      expect(/synced/i.test(text), `${name} writes a state the ladder has no member for`).toBe(
        false,
      )
    }
  })

  // FAILS IF: this module reaches into `app/`. Six modules mount into one
  // Run Player route and the route directory is a spine task's file; the only
  // thing this module may take from it is the panel TYPE.
  it('imports nothing from app/ but the RunPlayerPanel type', () => {
    for (const [name, text] of moduleSourceWithoutComments()) {
      const appImports = [...text.matchAll(/from '([^']*app\/[^']*)'/g)].map((m) => m[1] ?? '')
      for (const path of appImports) {
        expect(path, `${name} imports ${path}`).toContain('app/frontline/run-player/RunPlayerRoute')
      }
      expect(/from '[^']*app\/frontline\/run-player\/RunPlayerRoute'/.test(text)
        ? /import type \{[^}]*RunPlayerPanel[^}]*\} from/.test(text)
        : true, `${name} must import the panel type only`).toBe(true)
    }
  })
})
