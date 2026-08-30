import type { RoleId } from '@/domain/roles'
import {
  frontlineAffordance,
  type FrontlineAffordance,
  type FrontlineMatrixRow,
  type FrontlineMetElsewhere,
} from '@/frontline/matrix'

/**
 * `MOD-FL-A4` — Data Capture and Evidence. The permission matrix, transcribed
 * cell by cell.
 *
 * ── THE SPAN, RE-MEASURED RATHER THAN QUOTED ──────────────────────────────
 * Header L40720, separator L40721, nine data rows L40722-L40730, five persona
 * columns. 9 × 5 = 45 cells and every one is filled; `cells` is a TOTAL
 * `Record` over `Fla4Column`, so a blank one does not compile. The shape is
 * READ from `FL_MATRIX_SHAPE` rather than re-declared here — a second
 * spelling of a row count is a second thing to keep in step.
 *
 * ── COLUMNS ARE `RoleId`s, NOT STRINGS ────────────────────────────────────
 * The five headings the source writes at L40720 — Worker, Supervisor, Quality
 * Manager, Tenant Admin, Read-only Auditor — are character-for-character the
 * `name` of the five tenant roles in `@/domain/roles`. So the column key is
 * the role id and the heading is `roleById(...).name`. Nothing here spells a
 * persona name a second time.
 *
 * ── THE ONE PLACE THIS MATRIX DOES NOT FIT THE SHARED ROW TYPE ────────────
 * `FrontlineMatrixRow` declares `surface`, `existence` and `metElsewhere` PER
 * ROW, and says why: an elliptical cell ("— same") cannot be classified from
 * its own wording, so the classification was never a property of a cell's
 * text. That reasoning holds and is not disturbed here.
 *
 * ROW 6 IS A DIFFERENT SHAPE, and it is transcribed rather than inferred.
 * L40727, `View evidence on an oversight surface`, names a DIFFERENT PLACE IN
 * FOUR DIFFERENT COLUMNS, each one spelled out in full and none of them
 * elliptical: the Supervisor and the Quality Manager are `Read-only` "in the
 * Client Command Center", the Tenant Admin and the Read-only Auditor are
 * `Read-only` "in the Delivery Operations Hub record", and the Worker cell is
 * about THIS surface — a prohibition with a carve-out for "their own Run's
 * read-only review". Two surfaces and this screen, in one row. Row 7 (L40728)
 * is the same shape once: the Quality Manager cell reads `Allowed` and names
 * "Client Command Center action 7".
 *
 * `FrontlineMetElsewhere` holds ONE place, so the shared row cannot say that.
 * `placementByColumn` below records the column's own place where the source
 * states one, and `fla4Affordance` hands the projected row back to
 * `frontlineAffordance` — the order of questions is still the shared one,
 * asked once per column instead of once per row. Nothing re-implements it.
 *
 * ── WHAT IS **NOT** DONE HERE, AND WHY ────────────────────────────────────
 * Rows 3, 5, 8 and 9 are five-column uniform `Explicitly prohibited`. They
 * are classified `screen` + `present`, so `frontlineAffordance` returns a
 * `refusal` carrying the cell's own words — NOT `existence: 'not-in-scope'`.
 * The difference is the difference between "you may not" and "there is
 * nothing here for anyone": the source PROHIBITS these acts and states a
 * reason for each ("Roles prohibited: editing by anybody on any surface",
 * L40814), which is a refusal with a cause, not an absence. `existence`
 * exists to disambiguate `Unavailable`, and no cell of this matrix carries
 * that token.
 */

/* ==================================================================== *
 * THE COLUMNS.
 * ==================================================================== */

export type Fla4Column = Extract<
  RoleId,
  'WORKER' | 'SUPERVISOR' | 'QUALITY_MANAGER' | 'TENANT_ADMIN' | 'READONLY_AUDITOR'
>

/** L40720's own order, left to right. */
export const FLA4_COLUMNS = [
  'WORKER',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'TENANT_ADMIN',
  'READONLY_AUDITOR',
] as const satisfies readonly Fla4Column[]

type MissingFromColumns = Exclude<Fla4Column, (typeof FLA4_COLUMNS)[number]>
const _columnsExhaustive: MissingFromColumns extends never ? true : never = true
void _columnsExhaustive

/* ==================================================================== *
 * THE ROWS.
 * ==================================================================== */

export type Fla4RowId =
  | 'create-a-capture'
  | 'edit-before-commit'
  | 'edit-or-delete-after-capture'
  | 'append-a-correction'
  | 'export-captured-media'
  | 'view-evidence-on-an-oversight-surface'
  | 'mark-evidence-reviewed'
  | 'override-an-out-of-specification-result'
  | 'suppress-the-provenance-stamp'

/**
 * Where ONE COLUMN's act is met, where the source names a place for that
 * column and not for the row. `this-screen` is a member rather than an
 * absence, because on row 6 the Worker's cell is the exception to a row that
 * is otherwise held elsewhere, and an absent override would read as
 * "unclassified" instead of "classified as this screen".
 */
export type Fla4ColumnPlacement = { readonly where: 'this-screen' } | FrontlineMetElsewhere

export interface Fla4Row extends FrontlineMatrixRow<Fla4RowId, Fla4Column> {
  /**
   * The columns whose place the source states in the cell itself. Empty on
   * the seven rows that are column-uniform; five entries on row 6 and one on
   * row 7. `Partial`, exactly as `routedTo` is: an absent column is not
   * "unclassified", it is "classified by the row".
   */
  readonly placementByColumn: Partial<Readonly<Record<Fla4Column, Fla4ColumnPlacement>>>
}

type Cell = Fla4Row['cells'][Fla4Column]

const cell = (
  outcome: Cell['outcome'],
  note: string,
  openDecision: string | null = null,
): Cell => ({ outcome, note, openDecision })

/**
 * Rows 3, 5, 8 and 9 write the identical token in all five columns. The NOTE
 * is not the token — it is the reason, and the reason is the same for every
 * column because the source states one reason for the row. Spelling it five
 * times by hand is how four of the five drift; spelling it once here keeps
 * every cell filled with the same stated cause.
 */
const uniform = (outcome: Cell['outcome'], note: string): Readonly<Record<Fla4Column, Cell>> => ({
  WORKER: cell(outcome, note),
  SUPERVISOR: cell(outcome, note),
  QUALITY_MANAGER: cell(outcome, note),
  TENANT_ADMIN: cell(outcome, note),
  READONLY_AUDITOR: cell(outcome, note),
})

/**
 * The Supervisor and Quality Manager cells of rows 1, 2 and 4 all read
 * `Not applicable — no execution session`. That is the source's own words and
 * it is NOT a refusal: `Not applicable` says the act does not arise for that
 * role here, and the reason it does not arise is that neither role holds an
 * execution session on this device. Rendering it in the prohibition band
 * would tell a Supervisor they are forbidden from capturing when the truth is
 * that there is no session for a capture to belong to.
 */
const NO_EXECUTION_SESSION = 'Not applicable — no execution session'

/**
 * The one open cell of this matrix, and it is the Tenant Admin's. It defers
 * to the same unanswered question all eleven `Client Decision Required` cells
 * of the twelve matrices defer to, recorded once in `src/routes/definitions.ts`
 * and named there by its criterion rather than by an invented `DEC-*`:
 * `AC-FL-009-5` (L39948) forbids resolving it in either direction.
 */
const TENANT_ADMIN_OPEN = 'AC-FL-009-5'

export const FLA4_MATRIX = [
  {
    id: 'create-a-capture',
    control: 'Create a capture of any authored type',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    placementByColumn: {},
    cells: {
      WORKER: cell('allowed', 'Allowed'),
      SUPERVISOR: cell('notApplicable', NO_EXECUTION_SESSION),
      QUALITY_MANAGER: cell('notApplicable', NO_EXECUTION_SESSION),
      TENANT_ADMIN: cell('clientDecisionRequired', 'Client Decision Required', TENANT_ADMIN_OPEN),
      READONLY_AUDITOR: cell('explicitlyProhibited', 'Explicitly prohibited'),
    },
    sourceRef: 'L40722',
  },
  {
    id: 'edit-before-commit',
    control: 'Edit a value before commit',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    placementByColumn: {},
    cells: {
      WORKER: cell('allowed', 'Allowed'),
      SUPERVISOR: cell('notApplicable', NO_EXECUTION_SESSION),
      QUALITY_MANAGER: cell('notApplicable', NO_EXECUTION_SESSION),
      TENANT_ADMIN: cell('notApplicable', 'Not applicable'),
      READONLY_AUDITOR: cell('explicitlyProhibited', 'Explicitly prohibited'),
    },
    sourceRef: 'L40723',
  },
  {
    id: 'edit-or-delete-after-capture',
    control: 'Edit or delete evidence after capture',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    placementByColumn: {},
    cells: uniform(
      'explicitlyProhibited',
      'Explicitly prohibited. Evidence is immutable from creation, and the prohibition holds for every role on every surface, not only for this one.',
    ),
    sourceRef: 'L40724',
  },
  {
    id: 'append-a-correction',
    control: 'Append a correction to a committed capture',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    placementByColumn: {},
    cells: {
      WORKER: cell('allowed', 'Allowed'),
      SUPERVISOR: cell('notApplicable', NO_EXECUTION_SESSION),
      QUALITY_MANAGER: cell('notApplicable', NO_EXECUTION_SESSION),
      TENANT_ADMIN: cell('notApplicable', 'Not applicable'),
      READONLY_AUDITOR: cell('explicitlyProhibited', 'Explicitly prohibited'),
    },
    sourceRef: 'L40725',
  },
  {
    id: 'export-captured-media',
    control: 'Export captured media to the device gallery or any external application',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    placementByColumn: {},
    cells: uniform(
      'explicitlyProhibited',
      'Explicitly prohibited. Captured media stays in the application’s encrypted store and never touches the device gallery, so there is no export path for any role to hold.',
    ),
    sourceRef: 'L40726',
  },
  {
    /**
     * ROW 6 — the highest cross-surface density in the slice. Four of five
     * cells name a place that is not this screen, and they name TWO different
     * surfaces. Every cell's place is transcribed into `placementByColumn`.
     */
    id: 'view-evidence-on-an-oversight-surface',
    control: 'View evidence on an oversight surface',
    surface: 'another-surface',
    existence: 'present',
    metElsewhere: {
      where: 'another-surface',
      surface: 'SURF-CC',
      note: 'Read-only — in the Client Command Center',
    },
    routedTo: {},
    placementByColumn: {
      WORKER: { where: 'this-screen' },
      SUPERVISOR: {
        where: 'another-surface',
        surface: 'SURF-CC',
        note: 'Read-only — in the Client Command Center',
      },
      QUALITY_MANAGER: {
        where: 'another-surface',
        surface: 'SURF-CC',
        note: 'Read-only — in the Client Command Center, plus mark evidence reviewed',
      },
      TENANT_ADMIN: {
        where: 'another-surface',
        surface: 'SURF-DOH',
        note: 'Read-only — in the Delivery Operations Hub record',
      },
      READONLY_AUDITOR: {
        where: 'another-surface',
        surface: 'SURF-DOH',
        note: 'Read-only — in the Delivery Operations Hub record',
      },
    },
    cells: {
      WORKER: cell(
        'explicitlyProhibited',
        'Explicitly prohibited on this surface beyond their own Run’s read-only review',
      ),
      SUPERVISOR: cell('readOnly', 'Read-only — in the Client Command Center'),
      QUALITY_MANAGER: cell(
        'readOnly',
        'Read-only — in the Client Command Center, plus mark evidence reviewed',
      ),
      TENANT_ADMIN: cell('readOnly', 'Read-only — in the Delivery Operations Hub record'),
      READONLY_AUDITOR: cell('readOnly', 'Read-only — in the Delivery Operations Hub record'),
    },
    sourceRef: 'L40727',
  },
  {
    /**
     * ROW 7. The Quality Manager cell reads `Allowed` and its own words place
     * the act on the Client Command Center — one of that surface's ten closed
     * actions, built by a later slice. A control here would be the token read
     * without the sentence beside it.
     *
     * The Supervisor cell prohibits it with the phrase "Quality Manager and
     * above". `DEC-PLUS-001` (L39840) is what that phrase is carried as, and
     * `AC-MTX-004` (L10296) says no matrix invents a role ordering. The cell
     * reproduces the source's phrasing and names the decision; it does not
     * resolve it.
     */
    id: 'mark-evidence-reviewed',
    control: 'Mark evidence reviewed',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    placementByColumn: {
      QUALITY_MANAGER: {
        where: 'another-surface',
        surface: 'SURF-CC',
        note: 'Allowed — Client Command Center action 7',
      },
    },
    cells: {
      WORKER: cell('explicitlyProhibited', 'Explicitly prohibited'),
      SUPERVISOR: cell(
        'explicitlyProhibited',
        'Explicitly prohibited — Quality Manager and above',
        'DEC-PLUS-001',
      ),
      QUALITY_MANAGER: cell('allowed', 'Allowed — Client Command Center action 7'),
      TENANT_ADMIN: cell('explicitlyProhibited', 'Explicitly prohibited'),
      READONLY_AUDITOR: cell('explicitlyProhibited', 'Explicitly prohibited'),
    },
    sourceRef: 'L40728',
  },
  {
    id: 'override-an-out-of-specification-result',
    control: 'Override an out-of-specification result',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    placementByColumn: {},
    cells: uniform(
      'explicitlyProhibited',
      'Explicitly prohibited. The device’s classification is the act of record and no role overrides it here; specification gates are hard, always, for every tenant.',
    ),
    sourceRef: 'L40729',
  },
  {
    id: 'suppress-the-provenance-stamp',
    control: 'Suppress the named-location provenance stamp',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    placementByColumn: {},
    cells: uniform(
      'explicitlyProhibited',
      'Explicitly prohibited. The stamp is disclosed plainly to the worker as part of the record they are creating and it cannot be hidden by configuration.',
    ),
    sourceRef: 'L40730',
  },
] as const satisfies readonly Fla4Row[]

type MissingFromMatrix = Exclude<Fla4RowId, (typeof FLA4_MATRIX)[number]['id']>
const _rowsExhaustive: MissingFromMatrix extends never ? true : never = true
void _rowsExhaustive

/**
 * THE SHAPE IS NOT RESTATED HERE. The row count, the column count and the
 * four line numbers all live in `FL_MATRIX_SHAPE`'s `MOD-FL-A4` row, and this
 * module writes no second copy of any of them — a second spelling of a row
 * count is a second thing to keep in step. `tests/unit/fl-a4.test.ts` is
 * where the shared row's nine and this transcription's nine are held equal.
 *
 * The forty-five tokens, counted off the cells by hand and written down as a
 * literal so the derived count has something INDEPENDENT to be checked
 * against. Deriving both sides from `FLA4_MATRIX` would give a sum that
 * cannot disagree with itself.
 *
 * 4 + 8 + 1 + 28 + 4 = 45, and 9 rows × 5 columns = 45.
 */
export const FLA4_TOKEN_TALLY: Readonly<Record<string, number>> = {
  Allowed: 4,
  'Not applicable': 8,
  'Client Decision Required': 1,
  'Explicitly prohibited': 28,
  'Read-only': 4,
}

/* ==================================================================== *
 * THE ORDER OF QUESTIONS, ASKED PER COLUMN.
 * ==================================================================== */

/**
 * `frontlineAffordance` decides everything; this only chooses WHICH
 * classification to hand it. Where the source states the column's own place,
 * the row is projected onto that place first — which is what lets row 6 send
 * a Supervisor to the Client Command Center and a Tenant Admin to the
 * Delivery Operations Hub without either of them being told the other's.
 */
export function fla4Affordance(row: Fla4Row, column: Fla4Column): FrontlineAffordance {
  const placement = row.placementByColumn[column]
  if (placement === undefined) return frontlineAffordance(row, column)
  if (placement.where === 'this-screen') {
    return frontlineAffordance({ ...row, surface: 'screen', metElsewhere: null }, column)
  }
  return frontlineAffordance({ ...row, surface: placement.where, metElsewhere: placement }, column)
}

export function fla4Row(id: Fla4RowId): Fla4Row {
  const found = FLA4_MATRIX.find((r) => r.id === id)
  if (found === undefined) throw new Error(`no MOD-FL-A4 matrix row: ${id}`)
  return found
}
