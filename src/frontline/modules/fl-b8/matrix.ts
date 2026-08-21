import type { RoleId } from '@/domain/roles'
import type {
  FrontlineMatrixCell,
  FrontlineMatrixRow,
  FrontlineMetElsewhere,
} from '@/frontline/matrix'

/**
 * `MOD-FL-B8`'s permission matrix, transcribed row by row and cell by cell.
 * Header L41466, separator L41467, data L41468-L41474. SEVEN rows, FIVE
 * columns, THIRTY-FIVE cells, every one of them filled. It is the smallest of
 * the twelve matrices.
 *
 * `FrontlineMatrixRow`, `FrontlineMatrixCell` and `FrontlineMetElsewhere` are
 * wave 0's types and are parameterised here, never redefined, and no second
 * evaluator is written: the verdict comes from `frontlineAffordance` in
 * `@/frontline/matrix`.
 *
 * ── WHAT THIS MATRIX HAS, AND WHAT IT DOES NOT ─────────────────────────
 *
 * FIVE OF THE SEVEN TOKENS APPEAR, and they sum to the cell count rather than
 * being asserted beside it: `Explicitly prohibited` 19, `Not applicable` 9,
 * `Allowed` 3, `Allowed with conditions` 3, `Read-only` 1 —
 * 19 + 9 + 3 + 3 + 1 = 35 = 7 × 5.
 *
 * NO `Client Decision Required` CELL. All eleven of them across the twelve
 * matrices sit in the Tenant Admin column and every one is enumerated in wave
 * 0's `TENANT_ADMIN_OPEN_CELLS`; none of the eleven is `MOD-FL-B8`. All five of
 * this module's Tenant Admin cells are a refusal — four `Explicitly
 * prohibited` and one `Not applicable` — so `openDecision` is `null` on all
 * thirty-five and the `AC-FL-009-5` device-session question is not this
 * module's to carry. Its open decisions are elsewhere, in `service.ts`, and
 * they are about the agent rather than about permission.
 *
 * NO `Unavailable` CELL, so the token overload at L42114 against L42120 and
 * L41797 does not arise here.
 *
 * ── ROW 5, AND THE FIRST FRONTLINE ROW WHOSE CELLS NAME TWO SURFACES ────
 *
 * `See another worker's coaching history` (L41472) carries THREE cross-surface
 * cells, and they do not all point at the same place:
 *
 *   Supervisor       `Allowed with conditions` — only the repeated-coaching
 *                    pattern signal, in the Client Command Center
 *   Quality Manager  `Allowed with conditions` — same
 *   Read-only Auditor `Read-only` — in the Delivery Operations Hub record
 *
 * WAVE 0'S ROW TYPE HOLDS ONE `metElsewhere`, AND ONE IS NOT ENOUGH HERE. The
 * fold returns the ROW's `metElsewhere` for every cell of a cross-surface row.
 * That is right where a row's permissive cells share a surface — `MOD-FL-A6`'s
 * row 5 and `MOD-FL-A7`'s suspension rows are that shape — and it is wrong for
 * this row: printing "owned by the Client Command Center" over a cell whose
 * own words read "in the Delivery Operations Hub record" would be a false
 * claim drawn by a correct fold. So this module declares `metElsewhereByColumn`
 * BESIDE the row's own field and the panel names the place from it. The fold is
 * not corrected and not routed around — it still decides that no control is
 * drawn, which is the whole of what it is for. What is added is a destination
 * the wave-0 type cannot express, and this is reported rather than patched into
 * `@/frontline/matrix`, which this module does not own.
 *
 * THE WORKER AND TENANT ADMIN CELLS OF ROW 5 NAME NO PLACE AT ALL, and that is
 * not an omission. Both read a bare `Explicitly prohibited` and the prohibition
 * is absolute rather than a misplacement: `AC-SCOPE-044` (L2683) — "no other
 * worker's data is reachable" — and §3.3's third prohibition (L2006) — "no
 * other worker's data appears in the Frontline Worker Application at all". So
 * `metElsewhereByColumn` has no entry for either, and the panel names no place
 * where there is none to name.
 *
 * THE CONDITION IS A NARROWING, AND DROPPING IT BUILDS THE FORBIDDEN SCREEN.
 * What the Supervisor and the Quality Manager reach is the repeated-coaching
 * PATTERN SIGNAL and never the history itself — L41517, "one dismissed nudge is
 * a data point, a pattern is a signal", and `FUNC-B8-01-2-3` (L41536), "no
 * per-dismissal supervisor notification". Keeping the token and dropping the
 * narrowing builds a per-worker coaching view, which §3.3's data-handling rule
 * forbids outright: the platform holds worker-level data as purpose-bound
 * aggregates, not raw per-worker behavioural feeds (L2008).
 *
 * ── ROW 6, A QUALIFIED PROHIBITION RATHER THAN AN ABSOLUTE ONE ──────────
 *
 * `Author or edit coaching content` (L41473). The Quality Manager cell ends in
 * the words "never here" and names the Standards and Operations Studio; the
 * Supervisor and Tenant Admin cells read "Explicitly prohibited **on this
 * surface**", which is a prohibition WITH A SCOPE and not the same statement as
 * the Worker's and the Auditor's bare token. Wave 0 already carries this act at
 * surface level — `FL_ACTS_HELD_ELSEWHERE`'s third entry cites L41473 by name —
 * and this row is that entry seen from the module's end rather than a second
 * ruling.
 *
 * ── ROW 4, THE ROW THIS MODULE EXISTS TO OBEY ──────────────────────────
 *
 * `Let a dismissal block or delay a step` (L41471) is `Explicitly prohibited`
 * in all five columns, and the Worker's cell carries the reason in its own
 * words: "coaching is advisory and never gates". It is classified `screen` and
 * `present`, on `MOD-FL-A6`'s distinction between the ACT and the CAPABILITY:
 * dismissal exists on this device and is a control this matrix draws two rows
 * above; letting it block is what is prohibited. Classifying it `not-in-scope`
 * would say dismissal is a thing that exists nowhere for anyone.
 *
 * ── ROW 7, PROHIBITED IN EVERY COLUMN, WITH NO WORDS OF ITS OWN ────────
 *
 * `Translate coaching content at runtime` (L41474) carries a bare token in all
 * five cells. Rule 4 of this surface says a prohibition renders as no control
 * PLUS A STATED LINE, and a line reading only "Explicitly prohibited" is the
 * empty region wearing a token — so every row here carries `why`, the source
 * sentence that says why, with its own identifier-anchored locator. TWENTY-TWO
 * of these thirty-five cells are a bare token with no clause of their own, and
 * sixteen of those are a bare `Explicitly prohibited`. The count is asserted in
 * the covering suite rather than stated here: it was written twenty-four by eye
 * and the assertion is what corrected it.
 */

export type FlB8Column = Extract<
  RoleId,
  'WORKER' | 'SUPERVISOR' | 'QUALITY_MANAGER' | 'TENANT_ADMIN' | 'READONLY_AUDITOR'
>

export const FL_B8_COLUMNS = [
  'WORKER',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'TENANT_ADMIN',
  'READONLY_AUDITOR',
] as const satisfies readonly FlB8Column[]

type MissingFromColumns = Exclude<FlB8Column, (typeof FL_B8_COLUMNS)[number]>
const _columnsExhaustive: MissingFromColumns extends never ? true : never = true
void _columnsExhaustive

/** The header row's own words, L41466. Never re-worded for a table heading. */
export const FL_B8_COLUMN_HEADINGS = {
  WORKER: 'Worker',
  SUPERVISOR: 'Supervisor',
  QUALITY_MANAGER: 'Quality Manager',
  TENANT_ADMIN: 'Tenant Admin',
  READONLY_AUDITOR: 'Read-only Auditor',
} as const satisfies Readonly<Record<FlB8Column, string>>

export type FlB8RowId =
  | 'view-a-coaching-card'
  | 'replay-a-coaching-card'
  | 'dismiss-a-coaching-card'
  | 'let-a-dismissal-block-or-delay-a-step'
  | 'see-another-workers-coaching-history'
  | 'author-or-edit-coaching-content'
  | 'translate-coaching-content-at-runtime'

/**
 * One row, plus the three things wave 0's row type deliberately does not carry.
 *
 * `why` / `whyRef` — the source sentence that governs the row. Required on all
 * seven rather than optional on the prohibitions, for the reason above:
 * twenty-two of the thirty-five cells are a bare token.
 *
 * `metElsewhereByColumn` — the per-column destination. Empty for the five rows
 * that need none. See the header: row 5 is the first Frontline row whose cells
 * name two different owning surfaces, and the row-level field can hold one.
 */
export interface FlB8MatrixRow extends FrontlineMatrixRow<FlB8RowId, FlB8Column> {
  readonly why: string
  readonly whyRef: string
  readonly metElsewhereByColumn: Partial<Readonly<Record<FlB8Column, FrontlineMetElsewhere>>>
}

function cell(outcome: FrontlineMatrixCell['outcome'], note: string): FrontlineMatrixCell {
  return { outcome, note, openDecision: null }
}

/** The bare token, as the cell's own and only words. Sixteen cells carry it. */
const PROHIBITED = cell('explicitlyProhibited', 'Explicitly prohibited')
const PROHIBITED_ON_THIS_SURFACE = cell(
  'explicitlyProhibited',
  'Explicitly prohibited on this surface',
)
const NA_BARE = cell('notApplicable', 'Not applicable')
const NA_NO_SESSION = cell('notApplicable', 'Not applicable — no execution session')
const ALLOWED = cell('allowed', 'Allowed')

/**
 * The three interaction rows are one row shape said three times, and the source
 * says it three times too — L41468, L41469 and L41470 differ only in their
 * Action column. The cells are shared rather than retyped so a divergence
 * between them would have to be written on purpose.
 */
const INTERACTION_CELLS: Readonly<Record<FlB8Column, FrontlineMatrixCell>> = {
  WORKER: ALLOWED,
  SUPERVISOR: NA_NO_SESSION,
  QUALITY_MANAGER: NA_NO_SESSION,
  TENANT_ADMIN: NA_BARE,
  READONLY_AUDITOR: PROHIBITED,
}

/** L41472's own words for the two permissive cells. Quoted once, used twice. */
const PATTERN_SIGNAL_IN_THE_COMMAND_CENTER: FrontlineMetElsewhere = {
  where: 'another-surface',
  surface: 'SURF-CC',
  note: 'only the repeated-coaching pattern signal, in the Client Command Center',
}

export const FL_B8_MATRIX = [
  {
    id: 'view-a-coaching-card',
    control: 'View a coaching card',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    metElsewhereByColumn: {},
    routedTo: {},
    cells: INTERACTION_CELLS,
    why: 'Worker, who sees and interacts with cards.',
    whyRef: 'L41462',
    sourceRef: 'L41468',
  },
  {
    id: 'replay-a-coaching-card',
    control: 'Replay a coaching card',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    metElsewhereByColumn: {},
    routedTo: {},
    cells: INTERACTION_CELLS,
    why: 'A worker who missed it can see it again without leaving the step.',
    whyRef: 'FUNC-B8-01-2-1 · L41534',
    sourceRef: 'L41469',
  },
  {
    id: 'dismiss-a-coaching-card',
    control: 'Dismiss a coaching card',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    metElsewhereByColumn: {},
    routedTo: {},
    cells: INTERACTION_CELLS,
    why: 'A worker is never trapped by advisory content.',
    whyRef: 'FUNC-B8-01-2-2 · L41535',
    sourceRef: 'L41470',
  },
  {
    id: 'let-a-dismissal-block-or-delay-a-step',
    control: 'Let a dismissal block or delay a step',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    metElsewhereByColumn: {},
    routedTo: {},
    cells: {
      WORKER: cell(
        'explicitlyProhibited',
        'Explicitly prohibited — coaching is advisory and never gates',
      ),
      SUPERVISOR: PROHIBITED,
      QUALITY_MANAGER: PROHIBITED,
      TENANT_ADMIN: PROHIBITED,
      READONLY_AUDITOR: PROHIBITED,
    },
    why: 'Roles prohibited: no dismissal may block or delay the step.',
    whyRef: 'FUNC-B8-01-2-2 · L41535',
    sourceRef: 'L41471',
  },
  {
    id: 'see-another-workers-coaching-history',
    control: "See another worker's coaching history",
    surface: 'another-surface',
    existence: 'present',
    // The row-level field the fold reads. It carries the surface the two
    // PERMISSIVE cells name; the Read-only Auditor's different surface and the
    // two cells that name none are in `metElsewhereByColumn` below.
    metElsewhere: PATTERN_SIGNAL_IN_THE_COMMAND_CENTER,
    metElsewhereByColumn: {
      SUPERVISOR: PATTERN_SIGNAL_IN_THE_COMMAND_CENTER,
      // "— same". One of the eleven elliptical Frontline cells wave 0
      // enumerates, and L41472 is named in that list. It inherits the
      // Supervisor's condition because the classification was never a property
      // of the cell's own wording.
      QUALITY_MANAGER: PATTERN_SIGNAL_IN_THE_COMMAND_CENTER,
      READONLY_AUDITOR: {
        where: 'another-surface',
        surface: 'SURF-DOH',
        note: 'in the Delivery Operations Hub record',
      },
    },
    routedTo: {},
    cells: {
      WORKER: PROHIBITED,
      SUPERVISOR: cell(
        'allowedWithConditions',
        'Allowed with conditions — only the repeated-coaching pattern signal, in the Client Command Center',
      ),
      QUALITY_MANAGER: cell('allowedWithConditions', 'Allowed with conditions — same'),
      TENANT_ADMIN: PROHIBITED,
      READONLY_AUDITOR: cell('readOnly', 'Read-only — in the Delivery Operations Hub record'),
    },
    why:
      'Keep interventions silent to the supervisor by default, escalating to an actionable signal ' +
      'only on the repeated-coaching pattern the Standards and Operations Studio defines.',
    whyRef: 'FUNC-B8-01-2-3 · L41536',
    sourceRef: 'L41472',
  },
  {
    id: 'author-or-edit-coaching-content',
    control: 'Author or edit coaching content',
    surface: 'another-surface',
    existence: 'present',
    metElsewhere: {
      where: 'another-surface',
      surface: 'SURF-STU',
      note: 'in the Standards and Operations Studio with an authoring grant, never here',
    },
    metElsewhereByColumn: {
      QUALITY_MANAGER: {
        where: 'another-surface',
        surface: 'SURF-STU',
        note: 'in the Standards and Operations Studio with an authoring grant, never here',
      },
    },
    routedTo: {},
    cells: {
      WORKER: PROHIBITED,
      SUPERVISOR: PROHIBITED_ON_THIS_SURFACE,
      QUALITY_MANAGER: cell(
        'allowedWithConditions',
        'Allowed with conditions — in the Standards and Operations Studio with an authoring grant, never here',
      ),
      TENANT_ADMIN: PROHIBITED_ON_THIS_SURFACE,
      READONLY_AUDITOR: PROHIBITED,
    },
    why:
      'The Standards and Operations Studio authors and approves coaching content and the ' +
      'repeated-coaching pattern definition.',
    whyRef: 'L41460',
    sourceRef: 'L41473',
  },
  {
    id: 'translate-coaching-content-at-runtime',
    control: 'Translate coaching content at runtime',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    metElsewhereByColumn: {},
    routedTo: {},
    cells: {
      WORKER: PROHIBITED,
      SUPERVISOR: PROHIBITED,
      QUALITY_MANAGER: PROHIBITED,
      TENANT_ADMIN: PROHIBITED,
      READONLY_AUDITOR: PROHIBITED,
    },
    why: 'Roles prohibited: no runtime translation by anybody.',
    whyRef: 'FUNC-B8-01-1-2 · L41532',
    sourceRef: 'L41474',
  },
] as const satisfies readonly FlB8MatrixRow[]

type MissingFromMatrix = Exclude<FlB8RowId, (typeof FL_B8_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

/**
 * The same seven rows, WIDENED. Under `as const` every row carries literal
 * types, so `metElsewhereByColumn` on the five rows that declare `{}` has no
 * key at all and asking about one column will not compile. The widened view is
 * the same seven records and keeps the per-column question expressible, which
 * is the whole reason this export exists — the same reason `fl-a3`'s
 * `A3_CARD` does.
 */
export const B8_ROWS: readonly FlB8MatrixRow[] = FL_B8_MATRIX

export function b8Row(id: FlB8RowId): FlB8MatrixRow {
  const found = FL_B8_MATRIX.find((r) => r.id === id)
  if (found === undefined) throw new Error(`MOD-FL-B8 has no matrix row: ${id}`)
  return found
}

/**
 * The shape the brief asserts, DERIVED here rather than quoted, so the
 * arithmetic is a check on the transcription instead of a restatement of it.
 * Seven rows over the seven data lines L41468-L41474, five columns, thirty-five
 * cells.
 */
export const FL_B8_SHAPE = {
  module: 'MOD-FL-B8',
  rows: FL_B8_MATRIX.length,
  columns: FL_B8_COLUMNS.length,
  cells: FL_B8_MATRIX.length * FL_B8_COLUMNS.length,
  headerLine: 41466,
  separatorLine: 41467,
  firstDataLine: 41468,
  lastDataLine: 41474,
} as const

/**
 * Every distinct place a cell of this matrix names, DERIVED from
 * `metElsewhereByColumn` rather than listed a second time. Three of them across
 * two rows, and two of the three are one row's.
 */
export const B8_PLACES_NAMED: readonly {
  readonly rowId: FlB8RowId
  readonly column: FlB8Column
  readonly met: FrontlineMetElsewhere
}[] = FL_B8_MATRIX.flatMap((row) =>
  FL_B8_COLUMNS.flatMap((column) => {
    const met = (row.metElsewhereByColumn as Partial<Record<FlB8Column, FrontlineMetElsewhere>>)[
      column
    ]
    return met === undefined ? [] : [{ rowId: row.id, column, met }]
  }),
)

/**
 * THE WAVE-0 LIMITATION THIS MODULE MET, RECORDED SO IT RENDERS.
 *
 * It is a finding about the shared representation and not a defect in the
 * source, and it is reported rather than repaired here: `@/frontline/matrix` is
 * wave 0's file and a local edit would be a second spelling of one ruling.
 */
export const ROW_5_NAMES_TWO_SURFACES = {
  what:
    "Row 5's cells name two different owning surfaces, and wave 0's row type holds one. " +
    'FrontlineMatrixRow.metElsewhere is declared PER ROW — correctly, because eleven Frontline cells ' +
    'are elliptical and inherit their classification from the row — and frontlineAffordance returns ' +
    "that one value for every cell of a cross-surface row. This module's row 5 is the first Frontline " +
    'row measured where that produces a wrong destination on screen.',
  evidence:
    'L41472 gives Supervisor and Quality Manager "in the Client Command Center" and the Read-only ' +
    'Auditor "in the Delivery Operations Hub record". Its Worker and Tenant Admin cells name no place ' +
    'at all, and their prohibition is absolute rather than a misplacement — AC-SCOPE-044 (L2683) and ' +
    '§3.3’s third prohibition (L2006).',
  whatThisModuleDoes:
    'The fold still decides that no control is drawn, which is what it is for. The PLACE the panel ' +
    'names comes from this module’s own metElsewhereByColumn, and where a column names none the ' +
    'panel names none. Nothing in @/frontline/matrix is edited and no second evaluator is written.',
  sourceRef: 'L41472; AC-SCOPE-044 L2683; L2006',
} as const
