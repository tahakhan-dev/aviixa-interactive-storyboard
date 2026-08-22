import type { DecisionReading } from '@/disclosure/decisions'
import type { RoleId } from '@/domain/roles'
import type { SurfaceId } from '@/domain/surfaces'
import type { PermissionOutcome } from '@/policy/decision'

/**
 * `MOD-CC-10`'s SECOND TREATMENT — §36.6's permission matrix, transcribed
 * row by row and cell by cell.
 *
 * THE SOURCE SPECIFIES THIS ONE MODULE TWICE AND THE TWO TREATMENTS
 * DISAGREE. Chapter 21 carries the module's identity card (identity at
 * L38054) with an eight-row matrix at L38082-L38091. §36.6 carries a second,
 * conflicting treatment with a NINE-row matrix at L80547-L80557. Neither is a
 * draft of the other and neither is corrected against the other: this file
 * holds §36.6's, `S366_DIVERGENCES` records where the two differ with both
 * locators, and nothing here chooses.
 *
 * ── THE TRANSCRIPTION IS HEADER-KEYED, AND THAT IS THE FIRST THING ──────
 *
 * The two matrices run their persona columns in OPPOSITE orders:
 *
 *   L38082  Capability on this module | Tenant Admin | Supervisor |
 *           Quality Manager | Read-only Auditor | Worker
 *   L80547  Capability | Worker | Supervisor | Quality Manager |
 *           Tenant Admin | Read-only Auditor
 *
 * Worker is LAST in one and FIRST in the other; Tenant Admin is FIRST in one
 * and FOURTH in the other. A positional transcription swaps those two roles
 * and inverts every cell on both of them — silently, because both readings
 * are internally coherent and nothing downstream would look wrong. So every
 * cell below is keyed on its column's NAME, `cells` is a total `Record` over
 * `S366Column` so a blank is untypeable, and `cc-10-s366.test.ts` parses
 * L80547's header off the frozen source and asserts the key order against it
 * rather than against this comment.
 *
 * ── THE TOKENS ARE BACKTICKED HERE AND BARE IN CHAPTER 21 ───────────────
 *
 * L80549's Worker cell reads `` `Explicitly prohibited` — the worker never
 * sees a conflict ``; L38084's Worker cell reads `Explicitly prohibited`
 * with no backticks anywhere on the line. `verbatim` therefore carries the
 * backticks, because they are the source's own characters and they are one
 * of the two things that tell the treatments apart on sight. The component
 * renders the token in a `<code>` for the same reason.
 *
 * ── FOUR CELLS NAME A PLACE OUTSIDE THIS PANEL, AND ALL FOUR REFUSE ─────
 *
 * `pointsAt` is the trap this module was split off to avoid. The Quality
 * Manager column reads `Allowed` in five of the nine rows, and two of the
 * four rows where it does NOT also name somewhere the act is met — L80555
 * names the correction path, L80557 names "action 4 elsewhere in the Command
 * Center". A column-scanner that saw five `Allowed`s and the phrase "action
 * 4" would build a hold-release control onto this screen. THE REFUSAL IS THE
 * CELL; THE POINTER IS NOT PERMISSION. Every cell carrying `pointsAt` has
 * `outcome: 'explicitlyProhibited'`, and that is a gate rather than a
 * sentence.
 *
 * ── THREE CELLS REFUSE WITH AN "UNLESS", WHICH IS ALSO NOT A GRANT ──────
 *
 * The Tenant Admin cells on L80551, L80552 and L80554 read `` `Explicitly
 * prohibited` unless additively holding the Quality Manager role ``. The
 * backticked token is the refusal; the clause names a DIFFERENT role, and
 * what the additive-role forms mean across five non-hierarchical roles is
 * `DEC-PLUS-001`, which L80559 states this blueprint preserves rather than
 * resolves. So `outcome` is the refusal and `unlessAdditiveRole` carries the
 * clause where a gate can see it, instead of the clause quietly widening a
 * cell into a grant.
 *
 * ── THIS FILE HOLDS NO CONTROL AND DRAWS NOTHING ────────────────────────
 *
 * `AC-36-604` (L80596) — "Supervisors have no resolution control; the
 * control is absent, not disabled." Nothing in this module or its component
 * draws a resolution affordance for any role: it is a transcription and a
 * disclosure of a divergence, not the panel. The panel's route is task 12's.
 */

/* ==================================================================== *
 * THE HEADER, VERBATIM.
 * ==================================================================== */

/** All six cells of L80547, in the source's own order, verbatim. */
export const S366_HEADER_CELLS = [
  'Capability',
  'Worker',
  'Supervisor',
  'Quality Manager',
  'Tenant Admin',
  'Read-only Auditor',
] as const satisfies readonly string[]

/**
 * The five PERSONA columns — L80547's header less its first cell, which
 * labels the capability rather than a role.
 */
export const S366_COLUMNS = [
  'Worker',
  'Supervisor',
  'Quality Manager',
  'Tenant Admin',
  'Read-only Auditor',
] as const satisfies readonly string[]

export type S366Column = (typeof S366_COLUMNS)[number]

/**
 * Which platform role each column is. Every one of the five is a singleton —
 * unlike `MOD-FL-A7`'s sixth column, which is plural and needed a set — so a
 * `Record<S366Column, RoleId>` states exactly what is true and no more.
 */
export const S366_COLUMN_ROLES: Readonly<Record<S366Column, RoleId>> = {
  Worker: 'WORKER',
  Supervisor: 'SUPERVISOR',
  'Quality Manager': 'QUALITY_MANAGER',
  'Tenant Admin': 'TENANT_ADMIN',
  'Read-only Auditor': 'READONLY_AUDITOR',
}

/* ==================================================================== *
 * ONE CELL.
 * ==================================================================== */

/**
 * A place OUTSIDE this panel that a cell names. NEVER A GRANT ON THIS PANEL:
 * the cell's `outcome` still governs here, and every cell that carries one of
 * these refuses.
 */
export type S366Pointer =
  /** One of `MOD-CC-13`'s closed set of ten operational actions. */
  | {
      readonly kind: 'operational-action'
      readonly action: number
      readonly note: string
      readonly sourceRef: string
    }
  /** Another surface entirely. A statement, never a control drawn here. */
  | {
      readonly kind: 'another-surface'
      readonly surface: Exclude<SurfaceId, 'SURF-CC'>
      readonly note: string
      readonly sourceRef: string
    }
  /** Another ROW OF THIS MATRIX. The act is met on this panel, elsewhere on it. */
  | {
      readonly kind: 'this-matrix'
      readonly row: S366RowId
      readonly note: string
      readonly sourceRef: string
    }

export interface S366Cell {
  /** The closed-set token this cell backticks, read onto the platform's nine. */
  readonly outcome: PermissionOutcome
  /** The cell exactly as its line spells it, backticks and dashes included. */
  readonly verbatim: string
  /** Where the cell says the act IS met, or `null`. Never a grant here. */
  readonly pointsAt: S366Pointer | null
  /**
   * The role an `unless additively holding …` clause names, or `null`. The
   * clause qualifies WHO the person is, never what the Tenant Admin role
   * holds, and `DEC-PLUS-001` (L80559) is what it turns on.
   */
  readonly unlessAdditiveRole: RoleId | null
}

export type S366RowId =
  | 'see-panel-exists'
  | 'read-conflict-entry'
  | 'resolve-individual-conflict'
  | 'invoke-resolve-all'
  | 'include-skew-flagged-in-resolve-all'
  | 'flag-automatic-resolution-wrong'
  | 'edit-sync-result-directly'
  | 'delete-entry-or-losing-version'
  | 'release-hold-from-this-panel'

export interface S366Row {
  readonly id: S366RowId
  /** The Capability column, verbatim (L80549-L80557, first cell). */
  readonly capability: string
  /** TOTAL over the five persona columns. A blank cell is untypeable. */
  readonly cells: Readonly<Record<S366Column, S366Cell>>
  /** This row's own line in the frozen source. */
  readonly sourceRef: string
}

/** A bare `` `Explicitly prohibited` ``, which thirty of the forty-five cells are. */
const EP = (verbatim = '`Explicitly prohibited`'): S366Cell => ({
  outcome: 'explicitlyProhibited',
  verbatim,
  pointsAt: null,
  unlessAdditiveRole: null,
})

/**
 * The Tenant Admin refusal that carries an `unless`. Three cells, one
 * wording, so it is spelled once — L80551, L80552 and L80554 are
 * character-identical and a second spelling is how they would drift apart.
 */
const EP_UNLESS_QM: S366Cell = {
  outcome: 'explicitlyProhibited',
  verbatim: '`Explicitly prohibited` unless additively holding the Quality Manager role',
  pointsAt: null,
  unlessAdditiveRole: 'QUALITY_MANAGER',
}

/* ==================================================================== *
 * THE NINE ROWS. L80549 THROUGH L80557.
 * ==================================================================== */

export const S366_ROWS = [
  {
    id: 'see-panel-exists',
    capability: 'See the panel exists',
    cells: {
      Worker: EP('`Explicitly prohibited` — the worker never sees a conflict'),
      Supervisor: {
        outcome: 'allowed',
        verbatim: '`Allowed`',
        pointsAt: null,
        unlessAdditiveRole: null,
      },
      'Quality Manager': {
        outcome: 'allowed',
        verbatim: '`Allowed`',
        pointsAt: null,
        unlessAdditiveRole: null,
      },
      'Tenant Admin': {
        outcome: 'allowedWithConditions',
        verbatim:
          '`Allowed with conditions` — where the Tenant Admin also holds a Command Center-capable role; the Tenant Admin role itself is an administration role',
        pointsAt: null,
        unlessAdditiveRole: null,
      },
      'Read-only Auditor': EP('`Explicitly prohibited` — no Command Center access'),
    },
    sourceRef: 'L80549',
  },
  {
    id: 'read-conflict-entry',
    capability: 'Read a conflict entry',
    cells: {
      Worker: EP(),
      Supervisor: {
        outcome: 'readOnly',
        verbatim: '`Read-only`',
        pointsAt: null,
        unlessAdditiveRole: null,
      },
      'Quality Manager': {
        outcome: 'allowed',
        verbatim: '`Allowed`',
        pointsAt: null,
        unlessAdditiveRole: null,
      },
      'Tenant Admin': {
        outcome: 'allowedWithConditions',
        verbatim: '`Allowed with conditions` — as above',
        pointsAt: null,
        unlessAdditiveRole: null,
      },
      'Read-only Auditor': {
        outcome: 'explicitlyProhibited',
        verbatim:
          '`Explicitly prohibited` in the Command Center; `Read-only` in the Delivery Operations Hub audit log',
        pointsAt: {
          kind: 'another-surface',
          surface: 'SURF-DOH',
          note: 'The cell names TWO tokens and only one of them is this surface’s. On the Command Center the Read-only Auditor is refused; the `Read-only` belongs to the Delivery Operations Hub audit log, which is a different surface and not this panel. The section’s own rule states it without the second token: L80502 — "The Read-only Auditor has no Command Center access at all and reads conflict history from the Delivery Operations Hub audit log instead".',
          sourceRef: 'L80550 (the cell) · L80502 (the rule)',
        },
        unlessAdditiveRole: null,
      },
    },
    sourceRef: 'L80550',
  },
  {
    id: 'resolve-individual-conflict',
    capability: 'Resolve an individual conflict',
    cells: {
      Worker: EP(),
      Supervisor: EP(),
      'Quality Manager': {
        outcome: 'allowed',
        verbatim: '`Allowed`',
        pointsAt: null,
        unlessAdditiveRole: null,
      },
      'Tenant Admin': EP_UNLESS_QM,
      'Read-only Auditor': EP(),
    },
    sourceRef: 'L80551',
  },
  {
    id: 'invoke-resolve-all',
    capability: 'Invoke Resolve All',
    cells: {
      Worker: EP(),
      Supervisor: EP(),
      'Quality Manager': {
        outcome: 'allowed',
        verbatim: '`Allowed`',
        pointsAt: null,
        unlessAdditiveRole: null,
      },
      'Tenant Admin': EP_UNLESS_QM,
      'Read-only Auditor': EP(),
    },
    sourceRef: 'L80552',
  },
  {
    id: 'include-skew-flagged-in-resolve-all',
    capability: 'Include a skew-flagged entry in Resolve All',
    cells: {
      Worker: EP(),
      Supervisor: EP(),
      'Quality Manager': EP('`Explicitly prohibited` — no role may do this'),
      'Tenant Admin': EP(),
      'Read-only Auditor': EP(),
    },
    sourceRef: 'L80553',
  },
  {
    id: 'flag-automatic-resolution-wrong',
    capability: 'Flag an automatic resolution as wrong',
    cells: {
      Worker: EP(),
      Supervisor: EP(),
      'Quality Manager': {
        outcome: 'allowed',
        verbatim: '`Allowed`',
        pointsAt: null,
        unlessAdditiveRole: null,
      },
      'Tenant Admin': EP_UNLESS_QM,
      'Read-only Auditor': EP(),
    },
    sourceRef: 'L80554',
  },
  {
    id: 'edit-sync-result-directly',
    capability: 'Edit the sync result directly',
    cells: {
      Worker: EP(),
      Supervisor: EP(),
      'Quality Manager': {
        outcome: 'explicitlyProhibited',
        verbatim: '`Explicitly prohibited` — the flag opens the correction path instead',
        pointsAt: {
          kind: 'this-matrix',
          row: 'flag-automatic-resolution-wrong',
          note: 'The correction path is opened by the FLAG, which is row 6 of this same matrix and is `Allowed` to the Quality Manager there. So the act is met on this panel — by a different control, on a different row — and this row still refuses. L80516 states what the flag does: the sync result is not altered; a correction record is appended carrying who, when, and what changed.',
          sourceRef: 'L80555 (the cell) · L80516 (what the flag opens)',
        },
        unlessAdditiveRole: null,
      },
      'Tenant Admin': EP(),
      'Read-only Auditor': EP(),
    },
    sourceRef: 'L80555',
  },
  {
    id: 'delete-entry-or-losing-version',
    capability: 'Delete a conflict entry or a losing version',
    cells: {
      Worker: EP(),
      Supervisor: EP(),
      'Quality Manager': EP(),
      'Tenant Admin': EP(),
      'Read-only Auditor': EP(),
    },
    sourceRef: 'L80556',
  },
  {
    id: 'release-hold-from-this-panel',
    capability: 'Release a hold from this panel',
    cells: {
      Worker: EP(),
      Supervisor: {
        outcome: 'explicitlyProhibited',
        verbatim: '`Explicitly prohibited` — request with a note through action 4',
        pointsAt: {
          kind: 'operational-action',
          action: 4,
          note: 'Action 4 of the closed set of ten is "Release a lot hold, including automatic Severity 1 holds", and its Authority column reads "Quality Manager only — Supervisors request with a note". The request is the Supervisor’s act there, not here, and no control for it is drawn on this panel.',
          sourceRef: 'L80557 (the cell) · L38668 (action 4)',
        },
        unlessAdditiveRole: null,
      },
      'Quality Manager': {
        outcome: 'explicitlyProhibited',
        verbatim:
          '`Explicitly prohibited` from this panel; hold release is action 4 elsewhere in the Command Center',
        pointsAt: {
          kind: 'operational-action',
          action: 4,
          note: 'THE POINTER IS NOT PERMISSION. The Quality Manager holds action 4 somewhere else in the Command Center and is refused it HERE, in the same sentence. This is the one cell in the matrix where a column-scanner is most likely to go wrong: the Quality Manager column reads `Allowed` in five of the nine rows, and this is the ninth.',
          sourceRef: 'L80557 (the cell) · L38668 (action 4)',
        },
        unlessAdditiveRole: null,
      },
      'Tenant Admin': EP(),
      'Read-only Auditor': EP(),
    },
    sourceRef: 'L80557',
  },
] as const satisfies readonly S366Row[]

type MissingFromRows = Exclude<S366RowId, (typeof S366_ROWS)[number]['id']>
const _rowsExhaustive: MissingFromRows extends never ? true : never = true
void _rowsExhaustive

/**
 * The header line, the separator, the first and last data lines, and the two
 * counts. COUNTED OFF THE ROWS ABOVE, not inferred from the span: a span says
 * where a table is, not how many rows it has, and the difference is the
 * header, the separator and wherever the body actually stops. The covering
 * test re-counts both off the frozen source and asserts the body ends at
 * `lastDataLine` by checking the line after it is not a table row.
 */
export const S366_MATRIX_SHAPE = {
  module: 'MOD-CC-10',
  treatment: '§36.6',
  storyboard: 'SCR-CC-CONF-01',
  rows: 9,
  columns: 6,
  personaColumns: 5,
  headerLine: 80547,
  separatorLine: 80548,
  firstDataLine: 80549,
  lastDataLine: 80557,
} as const

/**
 * The token tally, COUNTED OFF THE CELLS rather than asserted beside them.
 * Four of the platform's nine tokens appear in this matrix; five do not.
 */
export const S366_TOKEN_TALLY: Readonly<Record<string, number>> = S366_ROWS.reduce<
  Record<string, number>
>((tally, row) => {
  for (const column of S366_COLUMNS) {
    const outcome = row.cells[column].outcome
    tally[outcome] = (tally[outcome] ?? 0) + 1
  }
  return tally
}, {})

export function s366Row(id: S366RowId): S366Row {
  const found = S366_ROWS.find((r) => r.id === id)
  if (found === undefined) throw new Error(`no MOD-CC-10 §36.6 matrix row: ${id}`)
  return found
}

/** Every cell that names a place outside its own row. Four of the forty-five. */
export const S366_POINTER_CELLS: readonly {
  readonly row: S366RowId
  readonly column: S366Column
  readonly pointer: S366Pointer
}[] = S366_ROWS.flatMap((row) =>
  S366_COLUMNS.flatMap((column) => {
    const pointer = row.cells[column].pointsAt
    return pointer === null ? [] : [{ row: row.id, column, pointer }]
  }),
)

/* ==================================================================== *
 * WHERE THE TWO TREATMENTS DISAGREE. BOTH READINGS, BOTH LOCATORS,
 * NEITHER CHOSEN.
 * ==================================================================== */

/**
 * `DecisionReading` is the decision canon's own type, IMPORTED rather than
 * redeclared, so a reading carries exactly two fields and there is no field
 * in which one could be marked the answer. `chosen` is typed `null` — not
 * "nullable", `null` — so no later edit can pick a winner without changing
 * the type, which is the whole reason the two treatments were built by two
 * implementers who never read each other's transcription.
 */
export interface S366Divergence {
  readonly id: string
  readonly question: string
  /** The column the two treatments answer differently. */
  readonly column: S366Column
  /** §36.6's reading — this file's. */
  readonly here: DecisionReading
  /** Chapter 21's reading, read off the frozen source, not off task 12's file. */
  readonly chapter21: DecisionReading
  /**
   * The Capability cell, verbatim, of each row `here.locator` cites — in the
   * order the locator names them.
   *
   * IT IS HERE BECAUSE THE TOKEN ALONE CANNOT PIN A ROW, and that was found by
   * planting rather than by review: moving this divergence's chapter-21
   * locator from L38084 to L38085 left the gate GREEN, because both rows give
   * the Tenant Admin the same token and the gate had nothing else to check.
   * The capability wording is the thing that differs between neighbouring
   * rows, so it is what makes a locator provable.
   */
  readonly hereCapabilities: readonly string[]
  /** The same for each chapter-21 row `chapter21.locator` cites. */
  readonly chapter21Capabilities: readonly string[]
  readonly chosen: null
  readonly whyNeitherIsChosen: string
  /**
   * `true` where the dispatch brief named the divergence; `false` where it
   * was found by comparing the two matrices header-keyed, row by row.
   */
  readonly namedByTheBrief: boolean
}

export const S366_DIVERGENCES = [
  {
    id: 'supervisor-may-flag-an-automatic-resolution',
    question: 'May a Supervisor flag an automatic resolution as wrong?',
    column: 'Supervisor',
    here: {
      text: 'Explicitly prohibited. The Supervisor may not flag; only the Quality Manager may.',
      locator: 'MOD-CC-10 §36.6 matrix row 6 · L80554',
    },
    chapter21: {
      text: 'Allowed. The Supervisor may flag an automatic resolution as wrong, alongside the Quality Manager.',
      locator: 'MOD-CC-10 chapter-21 matrix row 6 · L38089',
    },
    hereCapabilities: ['Flag an automatic resolution as wrong'],
    chapter21Capabilities: ['Flag an automatic resolution as wrong'],
    chosen: null,
    whyNeitherIsChosen:
      'The section’s own prose settles neither. L80496 says only that "A reviewer who judges an automatic resolution wrong flags it" — it names a reviewer, not a role — and L80497, the very next rule, says "Supervisors view the panel; resolution, including Resolve All, is Quality Manager and above", which governs RESOLUTION and does not mention flagging at all. Whether flagging is resolution is the question, and neither line answers it. Both cells are `SoW Fact` in their own sections.',
    namedByTheBrief: true,
  },
  {
    id: 'tenant-admin-may-see-the-panel',
    question: 'May a Tenant Admin see the sync-conflict review panel at all?',
    column: 'Tenant Admin',
    here: {
      text: 'Allowed with conditions — where the Tenant Admin also holds a Command Center-capable role; the Tenant Admin role itself is an administration role.',
      locator: 'MOD-CC-10 §36.6 matrix row 1 · L80549',
    },
    chapter21: {
      text: 'Explicitly prohibited. The Tenant Admin does not view the conflict panel.',
      locator: 'MOD-CC-10 chapter-21 matrix row 1 · L38084',
    },
    hereCapabilities: ['See the panel exists'],
    chapter21Capabilities: ['View the conflict panel'],
    chosen: null,
    whyNeitherIsChosen:
      'The §36.6 reading turns entirely on what an additively held role does to an administration role, which is `DEC-PLUS-001`. L80559 states in terms that this blueprint preserves both readings of the additive forms rather than resolving them, and L80601 repeats it as the section’s own source classification: rendering the plus forms as explicit role lists "preserves `DEC-PLUS-001` rather than resolving it". A build that picked either cell would have answered `DEC-PLUS-001` on one screen.',
    namedByTheBrief: true,
  },
  {
    id: 'tenant-admin-may-read-a-conflict-entry',
    question:
      'May a Tenant Admin read a conflict entry? The same disagreement as the row above, on a second row — so it is two rows wide, not one.',
    column: 'Tenant Admin',
    here: {
      text: 'Allowed with conditions — as above, the "as above" carrying L80549’s Command Center-capable-role condition forward.',
      locator: 'MOD-CC-10 §36.6 matrix row 2 · L80550',
    },
    chapter21: {
      text: 'Explicitly prohibited. The Tenant Admin does not see both versions, both timestamps and both workers.',
      locator: 'MOD-CC-10 chapter-21 matrix row 2 · L38085',
    },
    hereCapabilities: ['Read a conflict entry'],
    chapter21Capabilities: ['See both versions, both timestamps and both workers'],
    chosen: null,
    whyNeitherIsChosen:
      'Same question, same open decision, second row. Recorded separately rather than folded into the row above because a reader checking whether the divergence had been carried would otherwise find one row and conclude the rest of the Tenant Admin column agreed. It does not: two of its nine cells diverge and the other seven do not.',
    namedByTheBrief: false,
  },
  {
    id: 'supervisor-panel-visibility-token',
    question:
      'Is a Supervisor’s sight of the panel `Allowed` or `Read-only`? The two treatments use different tokens where their capability wordings also differ.',
    column: 'Supervisor',
    here: {
      text: '`Allowed` to see the panel exists, and `Read-only` to read a conflict entry — §36.6 splits the act across two rows and gives each its own token.',
      locator: 'MOD-CC-10 §36.6 matrix rows 1 and 2 · L80549, L80550',
    },
    chapter21: {
      text: '`Read-only` to view the conflict panel, and `Read-only` to see both versions, both timestamps and both workers — chapter 21 gives the same token to both.',
      locator: 'MOD-CC-10 chapter-21 matrix rows 1 and 2 · L38084, L38085',
    },
    hereCapabilities: ['See the panel exists', 'Read a conflict entry'],
    chapter21Capabilities: [
      'View the conflict panel',
      'See both versions, both timestamps and both workers',
    ],
    chosen: null,
    whyNeitherIsChosen:
      'This one may be a DECOMPOSITION rather than a contradiction, and saying which would be the choice. §36.6’s row 1 asks whether the panel EXISTS for this role and row 2 asks what reading it yields; chapter 21’s row 1 asks about viewing the panel and collapses both. Under that reading `Allowed` and `Read-only` answer two different questions and no cell contradicts another. Under the other reading the same act carries two tokens. The section’s own prose leans to neither: L80497 says "Supervisors view the panel", which is the word both tokens are trying to render. Recorded because a later reconciliation that quietly aligned the tokens would have destroyed the evidence for both readings.',
    namedByTheBrief: false,
  },
] as const satisfies readonly S366Divergence[]

/* ==================================================================== *
 * `DEC-PLUS-001` IS POINTED AT, NOT RESPELLED.
 * ==================================================================== */

/**
 * Three modules already disclose `DEC-PLUS-001` locally and this makes four
 * places that need it — which is exactly when a fourth spelling gets written.
 * It is not written here. `MOD-FL-A4`, `MOD-FL-B9` and `MOD-FL-B11` each
 * carry the readings; this module POINTS at them, in the idiom
 * `src/offline/conflict.ts` set for `DEC-CLOCKWIN-001`, and
 * `cc-10-s366.test.ts` asserts this file contains no copy of their reading
 * text.
 *
 * WHAT THIS SECTION ADDS, WHICH IS WHY THE POINTER CARRIES ITS OWN LOCATOR.
 * The three Frontline disclosures cite L39840 and L14670 — the decision's own
 * cards and the general statement of the plus forms. §36.6 states it a third
 * time, about THIS matrix, at L80559, and the sentence is specific to what
 * this file transcribes: the plus forms are rendered as explicit role lists
 * here because their meaning across five additive, non-hierarchical roles is
 * itself the open contradiction. L80601 files that as the section's own
 * source classification. Neither line is in the three Frontline records,
 * because neither is about a Frontline matrix.
 */
export const DEC_PLUS_001_DISCLOSED_ELSEWHERE = {
  decisionRef: 'DEC-PLUS-001',
  disclosedBy: [
    'src/frontline/modules/fl-a4/service.ts',
    'src/frontline/modules/fl-b9/service.ts',
    'src/frontline/modules/fl-b11/service.ts',
  ],
  whyItBitesHere:
    'Two of this matrix’s cells and three more are decided by it. L80549 and L80550 let a Tenant Admin see and read the panel only "where the Tenant Admin also holds a Command Center-capable role"; L80551, L80552 and L80554 refuse the Tenant Admin "unless additively holding the Quality Manager role". Every one of the five is a statement about what an ADDITIVELY held role does, and chapter 21’s treatment of the same module answers the first two the other way.',
  whyNotDisclosedHere:
    'Three modules already carry the readings and a fourth stand-in would be a fourth spelling of one decision, which is the defect this build records most often. This module points at them and adds only what they cannot hold: this section’s own statement of the decision, at its own line.',
  thisSectionsOwnStatement:
    'L80559 — the plus forms are rendered as explicit role lists because the meaning of the plus form across five additive, non-hierarchical roles is itself an open contradiction, and both readings are preserved. L80601 files that as §36.6’s source classification: the rendering "preserves `DEC-PLUS-001` rather than resolving it".',
  sourceRef: 'DEC-PLUS-001 · L80559 (this section) · L80601 (this section’s classification)',
} as const

/* ==================================================================== *
 * FINDINGS AGAINST THE SOURCE — RECORDED, NOT CLOSED.
 * ==================================================================== */

export interface S366Finding {
  readonly what: string
  readonly evidence: string
  readonly notClosedBecause: string
  readonly sourceRef: string
}

export const S366_FINDINGS = [
  {
    what: 'The two treatments of MOD-CC-10 run their persona columns in opposite orders, and one has a ninth row.',
    evidence:
      'L80547 runs Worker first and Tenant Admin fourth; L38082 runs Tenant Admin first and Worker last. Both are five persona columns and both are internally coherent, so a positional transcription of either produces a matrix in which every Worker cell holds the Tenant Admin’s ruling and every Tenant Admin cell holds the Worker’s — with nothing downstream to notice. §36.6 also carries nine data rows against chapter 21’s eight, and the extra rows are not a suffix: delete an entry (L80556) and release a hold (L80557) are §36.6’s alone, and change the clock-skew threshold (L38091) is chapter 21’s alone.',
    notClosedBecause:
      'Neither order is wrong and neither is the other’s draft. This file is keyed on the column NAME and its covering test parses L80547 off the frozen source and asserts the key order against the parse, so the safety is a gate rather than a convention.',
    sourceRef: 'L80547 · L38082 · L80556 · L80557 · L38091',
  },
  {
    what: 'The §36.6 tokens are backticked and chapter 21’s are bare, on the same nine tokens of the same closed set.',
    evidence:
      'L80549 reads `` `Explicitly prohibited` — the worker never sees a conflict ``. L38084’s Worker cell reads Explicitly prohibited with no backtick anywhere on the line. The difference runs through every cell of both matrices.',
    notClosedBecause:
      'It is the second of the two things that tell the treatments apart on sight, after the column order, and a transcription that normalised it away would remove the evidence that there are two treatments at all. `verbatim` keeps the source’s characters and the covering test compares them to the parsed line.',
    sourceRef: 'L80549 · L38084',
  },
  {
    what: 'The skew rows are NOT a third disagreement, and the near-miss is worth recording because it looks like one.',
    evidence:
      'L38088 gives the Quality Manager "Allowed with conditions — individually only; never through Resolve All" on "Resolve a skew-flagged conflict". L80553 gives the Quality Manager "`Explicitly prohibited` — no role may do this" on "Include a skew-flagged entry in Resolve All". Read positionally as row 5 against row 5 they contradict; read on their own capability wordings they agree exactly — chapter 21 permits the individual resolution and forbids the bulk one in a single cell, and §36.6 asks only about the bulk one and forbids it.',
    notClosedBecause:
      'Recording only the real divergences would leave the next reader to rediscover this and, plausibly, to file it as a fifth. It is filed here as checked and NOT a divergence, with both lines named so the check can be repeated.',
    sourceRef: 'L38088 · L80553 · AC-36-603 at L80595',
  },
  {
    what: 'The screen carries two identifiers, and the register’s is the one this build keys on.',
    evidence:
      '§36.6’s storyboard names it `SCR-CC-CONF-01` (L80541), and §36.4 and §36.5 use that identifier too (L80200, L80300). The §25.5 screen register names the same screen `SCR-CC-10` (L48395) — "Sync-conflict review panel", roles "Supervisor for viewing, Quality Manager for resolution", modules "MOD-CC-10 all features". `src/surfaces/cc/screens.ts` is keyed on the register.',
    notClosedBecause:
      'Not this module’s to settle: the route is task 12’s and the register is the spine’s. Recorded so the controller wiring the two treatments onto one route knows the second treatment’s storyboard identifier is not a fourteenth screen.',
    sourceRef: 'L80541 · L80200 · L80300 · L48395',
  },
  {
    what: 'The Quality Manager column is `Allowed` in five of nine rows, and two of the four refusals name a place where the act IS met.',
    evidence:
      'Allowed on L80549, L80550, L80551, L80552 and L80554. Refused on L80553, L80555, L80556 and L80557. Of the four refusals, L80555 names the correction path and L80557 names "action 4 elsewhere in the Command Center" — action 4 being "Release a lot hold, including automatic Severity 1 holds", L38668, whose authority column reads "Quality Manager only".',
    notClosedBecause:
      'Nothing is wrong with the source here; the finding is about what a reader does with it. A scan of the column plus the phrase "action 4" builds a hold-release control onto this screen, and the cell that supplies the phrase is the cell that forbids it. `S366_POINTER_CELLS` and the gate over it are what make the refusal outrank the pointer in code rather than in a comment.',
    sourceRef: 'L80549-L80557 · L38668',
  },
] as const satisfies readonly S366Finding[]

/* ==================================================================== *
 * WHAT THIS TREATMENT DOES NOT BUILD.
 * ==================================================================== */

/**
 * `SCR-CC-CONF-01`'s panel body — the capped list, the comparison cards, the
 * Resolve, Resolve All and Flag controls, `DEC-SYNC-006`'s cap value, and the
 * empty and overflow states at L80541 — is NOT built here. This module is the
 * second treatment of the permission matrix and the disclosure of where it
 * disagrees with the first; the route under `app/command-center/` and
 * everything on it belongs to the chapter-21 task.
 *
 * The consequence worth stating rather than assuming: because nothing here
 * draws a control for any role, `AC-36-604` (L80596) — "Supervisors have no
 * resolution control; the control is absent, not disabled" — is satisfied by
 * this module trivially and is NOT evidence that the panel satisfies it. The
 * criterion belongs to whoever draws the action region.
 */
export const S366_OUT_OF_SCOPE = {
  panelBody: 'L80541 — header, list, comparison cards, action region, empty and overflow states.',
  capValue: 'DEC-SYNC-006, raised at L80504 and classified at L80587. Not disclosed by this module.',
  route:
    'app/command-center/sync-conflict-review-panel/ — the chapter-21 task’s, and the spine’s own ' +
    'slug. This field named the shorter sync-conflict-review until slice 9; no directory of that ' +
    'name was ever built, and the registry generator reads a declared slug with no directory of ' +
    'that name as "declared, not built".',
  ac36604Note:
    'AC-36-604 (L80596) is trivially true of this module because it draws no control for any role. That is not evidence about the panel.',
} as const
