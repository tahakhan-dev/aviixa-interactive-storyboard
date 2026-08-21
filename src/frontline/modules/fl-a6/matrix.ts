import type { RoleId } from '@/domain/roles'
import type { FrontlineMatrixCell, FrontlineMatrixRow } from '@/frontline/matrix'

/**
 * `MOD-FL-A6`'s permission matrix, transcribed row by row and cell by cell.
 * Header L41092, separator L41093, data L41094-L41102. NINE rows, FIVE
 * columns, FORTY-FIVE cells, every one of them filled.
 *
 * `FrontlineMatrixRow` and `FrontlineMatrixCell` are wave 0's types and are
 * parameterised here, never redefined, and no second evaluator is written: the
 * verdict comes from `frontlineAffordance` in `@/frontline/matrix`.
 *
 * ── WHAT THIS MATRIX HAS, AND WHAT IT DOES NOT ─────────────────────────
 *
 * FIVE OF THE SEVEN TOKENS APPEAR, and they sum to the cell count rather than
 * being asserted beside it: `Explicitly prohibited` 33, `Not applicable` 6,
 * `Allowed with conditions` 3, `Allowed` 2, `Read-only` 1 —
 * 33 + 6 + 3 + 2 + 1 = 45 = 9 × 5.
 *
 * NO `Client Decision Required` CELL. All eleven of them across the twelve
 * matrices sit in the Tenant Admin column and every one is enumerated in wave
 * 0's `TENANT_ADMIN_OPEN_CELLS`; none of the eleven is `MOD-FL-A6`. This
 * module's four `Explicitly prohibited` and two `Allowed with conditions`
 * Tenant Admin cells carry no deferred question, so `openDecision` is `null`
 * on all forty-five and the `AC-FL-009-5` device-session question is not this
 * module's to carry. Its open decisions are elsewhere — in `service.ts`, on
 * behaviour rather than on permission.
 *
 * NO `Unavailable` CELL, so the token overload at L42114 against L42120 does
 * not arise here. This matrix does carry the single `Read-only` cell of its
 * own, and that cell is on a row this surface does not own.
 *
 * ── THE THREE ROWS THAT ARE NOT THIS SCREEN'S ──────────────────────────
 *
 * ROW 5, `Resolve a sync conflict` (L41098) — TWO CROSS-SURFACE CELLS IN ONE
 * ROW, which is why the classification could not be a property of either cell.
 * The Supervisor cell reads `Read-only` "view only, in the Client Command
 * Center conflict-review panel"; the Quality Manager cell reads `Allowed`
 * "Resolve and Resolve-All, in the Client Command Center". The act is met on
 * `SURF-CC` and `MOD-CC-10` is the module that meets it — its own identity
 * line names it the Sync-conflict review panel on the Client Command Center,
 * and its own matrix (L38084-L38091) is where the Resolve and Resolve-All
 * controls live. `FUNC-A6-08-1-4` (L41207) states the rule this row obeys:
 * "Keep conflict review on the Client Command Center, where the worker never
 * sees it." So the row is `another-surface` and every one of its five cells
 * returns a cross-surface statement.
 *
 * THE WORKER CELL IS THE LOAD-BEARING ONE AND IT IS NOT LOST. Wave 0's fold
 * returns the ROW's `metElsewhere.note` for every cell of a cross-surface row,
 * so a panel that printed only the fold's words would drop "the worker never
 * sees or resolves a conflict" — the strongest sentence in the row. The panel
 * prints the CELL's own words beside the fold's verdict for every cell of
 * every row, which is wave 0's own ruling made visible: "the token is not
 * corrected, downgraded or hidden — the matrix goes on saying `Allowed` on
 * screen with its own words and its own locator. What is refused is the
 * CONTROL."
 *
 * ROW 6, `Set the offline trust window` (L41099). The Tenant Admin cell reads
 * `Allowed with conditions` and names the Delivery Operations Hub in its own
 * words, with the 72-hour platform ceiling.
 *
 * ROW 7, `Set the clock-skew threshold` (L41100), AND THIS IS THE TRAP.
 * The Tenant Admin cell carries "tenant-set, default about 5 minutes, platform
 * ceiling 60 minutes" and NAMES NO SURFACE AT ALL. A rule that detected a
 * cross-surface act by looking for a surface name in the cell misses this one
 * precisely because the note is silent, and would then draw a Tenant Admin
 * control for setting the skew threshold on a factory tablet.
 *
 * THE SURFACE IS READ OFF THE SOURCE, NOT INFERRED FROM ROW 6's NEIGHBOURING
 * CELL. `MOD-CC-10`'s own permission matrix spells it out at L38091: changing
 * the clock-skew threshold is "a tenant setting in the Delivery Operations Hub
 * tenant administration area". The configuration-ownership table at L61256
 * gives the same answer in a fourth chapter — record-finish window, offline
 * trust window and clock-skew threshold all owned by the Delivery Operations
 * Hub tenant administration area, by the Tenant Admin, within platform floors
 * and ceilings — and L30340 carries the threshold's own registry row with its
 * default, its ceiling and `EVT-DOH-CFG-SKEW` as the event it raises. Three
 * independent readings, none of them row 6.
 *
 * ── THE FOUR UNIFORM PROHIBITIONS, AND WHY THEY CARRY A SENTENCE ───────
 *
 * ROWS 3, 4, 8 AND 9 are five-column uniform prohibitions: automatic sync is
 * never suppressed, the upload queue is never reordered or deleted from, a
 * version change is never forced onto an in-flight Run, a device timestamp is
 * never altered after capture. All twenty of those cells carry the bare token
 * and nothing else, and rule 4 of this surface says a prohibition renders as
 * no control PLUS A STATED LINE where the control would sit. A line reading
 * only "Explicitly prohibited" is the empty region wearing a token. THIRTY-FIVE
 * of the forty-five cells here carry a token and nothing else and only ten
 * carry a clause of their own, so each row carries the source sentence that
 * says WHY, with its own identifier-anchored locator, and a row added without
 * one does not compile.
 *
 * THEY ARE `present`, NOT `not-in-scope`, and the distinction is the act
 * rather than the capability. The queue exists on this device; deleting from
 * it is what is prohibited. Sync exists; suppressing it is what is prohibited.
 * Timestamps exist; altering them after capture is what is prohibited.
 * Classifying these rows `not-in-scope` would say the upload queue is a thing
 * that exists nowhere for anyone.
 *
 * ── WHAT THIS MODULE DRAWS ─────────────────────────────────────────────
 *
 * TWO CONTROLS, BOTH THE WORKER'S, AND BOTH ON THE CONNECTED PATH: view the
 * sync state, and trigger a manual sync. The second is `Allowed with
 * conditions` and the condition is in the cell's own words — "convenience
 * only, never a dependency".
 */

export type FlA6Column = Extract<
  RoleId,
  'WORKER' | 'SUPERVISOR' | 'QUALITY_MANAGER' | 'TENANT_ADMIN' | 'READONLY_AUDITOR'
>

export const FL_A6_COLUMNS = [
  'WORKER',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'TENANT_ADMIN',
  'READONLY_AUDITOR',
] as const satisfies readonly FlA6Column[]

type MissingFromColumns = Exclude<FlA6Column, (typeof FL_A6_COLUMNS)[number]>
const _columnsExhaustive: MissingFromColumns extends never ? true : never = true
void _columnsExhaustive

/** The header row's own words, L41092. Never re-worded for a table heading. */
export const FL_A6_COLUMN_HEADINGS = {
  WORKER: 'Worker',
  SUPERVISOR: 'Supervisor',
  QUALITY_MANAGER: 'Quality Manager',
  TENANT_ADMIN: 'Tenant Admin',
  READONLY_AUDITOR: 'Read-only Auditor',
} as const satisfies Readonly<Record<FlA6Column, string>>

export type FlA6RowId =
  | 'view-sync-state'
  | 'trigger-manual-sync'
  | 'suppress-automatic-sync'
  | 'delete-or-reorder-queue'
  | 'resolve-sync-conflict'
  | 'set-offline-trust-window'
  | 'set-clock-skew-threshold'
  | 'force-version-change-in-flight'
  | 'alter-device-timestamp'

/**
 * One row, plus the two things wave 0's row type deliberately does not carry.
 *
 * `why` / `whyRef` — the source sentence that governs the row. Required on all
 * nine rather than optional on the prohibitions, for the reason above: thirty
 * of the forty-five cells in this matrix are a bare token with no words of
 * their own.
 *
 * `metElsewhereRef` — the line the row's cross-surface statement is read from,
 * which is NOT always the row's own line. Row 7's is L38091, four chapters
 * away, because row 7's own cell names no surface. A `metElsewhere` note with
 * no locator of its own would be this build asserting a surface rather than
 * citing one, which is exactly the shape of the defect the row is a trap for.
 */
export interface FlA6MatrixRow extends FrontlineMatrixRow<FlA6RowId, FlA6Column> {
  readonly why: string
  readonly whyRef: string
  readonly metElsewhereRef: string | null
}

function cell(outcome: FrontlineMatrixCell['outcome'], note: string): FrontlineMatrixCell {
  return { outcome, note, openDecision: null }
}

/** The bare token, as the cell's own and only words. Thirty-two cells carry it. */
const PROHIBITED = cell('explicitlyProhibited', 'Explicitly prohibited')
const NA_BARE = cell('notApplicable', 'Not applicable')
const NA_NO_SESSION = cell('notApplicable', 'Not applicable — no execution session')

export const FL_A6_MATRIX = [
  {
    id: 'view-sync-state',
    control: 'View sync state',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    metElsewhereRef: null,
    routedTo: {},
    cells: {
      WORKER: cell('allowed', 'Allowed'),
      SUPERVISOR: cell(
        'notApplicable',
        'Not applicable — no execution session; equivalent state is in the Client Command Center',
      ),
      QUALITY_MANAGER: cell('notApplicable', 'Not applicable — same basis'),
      TENANT_ADMIN: NA_BARE,
      READONLY_AUDITOR: PROHIBITED,
    },
    why: 'Worker, who sees only the honest sync indicator and the optional manual sync convenience.',
    whyRef: 'L41088',
    sourceRef: 'L41094',
  },
  {
    id: 'trigger-manual-sync',
    control: 'Trigger a manual sync',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    metElsewhereRef: null,
    routedTo: {},
    cells: {
      WORKER: cell(
        'allowedWithConditions',
        'Allowed with conditions — convenience only, never a dependency',
      ),
      SUPERVISOR: NA_NO_SESSION,
      QUALITY_MANAGER: NA_NO_SESSION,
      TENANT_ADMIN: NA_BARE,
      READONLY_AUDITOR: PROHIBITED,
    },
    why: 'Offer a manual sync control as a convenience only, never as a dependency.',
    whyRef: 'FUNC-A6-02-2-3 · L41171',
    sourceRef: 'L41095',
  },
  {
    id: 'suppress-automatic-sync',
    control: 'Suppress, pause, or disable automatic sync',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    metElsewhereRef: null,
    routedTo: {},
    cells: {
      WORKER: PROHIBITED,
      SUPERVISOR: PROHIBITED,
      QUALITY_MANAGER: PROHIBITED,
      TENANT_ADMIN: PROHIBITED,
      READONLY_AUDITOR: PROHIBITED,
    },
    why:
      'Sync continuously when connected, resume automatically on reconnection, and never make sync ' +
      'a worker action.',
    whyRef: 'FUNC-A6-02-1-1 · L41167',
    sourceRef: 'L41096',
  },
  {
    id: 'delete-or-reorder-queue',
    control: 'Delete or reorder items in the upload queue',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    metElsewhereRef: null,
    routedTo: {},
    cells: {
      WORKER: PROHIBITED,
      SUPERVISOR: PROHIBITED,
      QUALITY_MANAGER: PROHIBITED,
      TENANT_ADMIN: PROHIBITED,
      READONLY_AUDITOR: PROHIBITED,
    },
    why: 'Roles prohibited: nobody may clear it.',
    whyRef: 'FUNC-A6-02-2-1 · L41169',
    sourceRef: 'L41097',
  },
  {
    id: 'resolve-sync-conflict',
    control: 'Resolve a sync conflict',
    surface: 'another-surface',
    existence: 'present',
    metElsewhere: {
      where: 'another-surface',
      surface: 'SURF-CC',
      note:
        "where a true conflict occurred, the Client Command Center's conflict-review panel, where a " +
        'Quality Manager resolves and Supervisors view only',
    },
    metElsewhereRef: 'L41156',
    routedTo: {},
    cells: {
      WORKER: cell(
        'explicitlyProhibited',
        'Explicitly prohibited — the worker never sees or resolves a conflict',
      ),
      SUPERVISOR: cell(
        'readOnly',
        'Read-only — view only, in the Client Command Center conflict-review panel',
      ),
      QUALITY_MANAGER: cell(
        'allowed',
        'Allowed — Resolve and Resolve-All, in the Client Command Center',
      ),
      TENANT_ADMIN: PROHIBITED,
      READONLY_AUDITOR: PROHIBITED,
    },
    why: 'Keep conflict review on the Client Command Center, where the worker never sees it.',
    whyRef: 'FUNC-A6-08-1-4 · L41207',
    sourceRef: 'L41098',
  },
  {
    id: 'set-offline-trust-window',
    control: 'Set the offline trust window',
    surface: 'another-surface',
    existence: 'present',
    metElsewhere: {
      where: 'another-surface',
      surface: 'SURF-DOH',
      note:
        'tenant-set, may shorten below the default, may never exceed the 72-hour platform ceiling, ' +
        'in the Delivery Operations Hub',
    },
    metElsewhereRef: 'L41099',
    routedTo: {},
    cells: {
      WORKER: PROHIBITED,
      SUPERVISOR: PROHIBITED,
      QUALITY_MANAGER: PROHIBITED,
      TENANT_ADMIN: cell(
        'allowedWithConditions',
        'Allowed with conditions — tenant-set, may shorten below the default, may never exceed the ' +
          '72-hour platform ceiling, in the Delivery Operations Hub',
      ),
      READONLY_AUDITOR: PROHIBITED,
    },
    why:
      'Roles allowed: Tenant Admin configures within bounds. Roles prohibited: no tenant may exceed ' +
      'the ceiling; the platform rejects a looser value.',
    whyRef: 'FUNC-A6-05-1-1 · L41185',
    sourceRef: 'L41099',
  },
  {
    id: 'set-clock-skew-threshold',
    control: 'Set the clock-skew threshold',
    surface: 'another-surface',
    existence: 'present',
    metElsewhere: {
      where: 'another-surface',
      surface: 'SURF-DOH',
      note: 'a tenant setting in the Delivery Operations Hub tenant administration area',
    },
    metElsewhereRef: 'L38091',
    routedTo: {},
    cells: {
      WORKER: PROHIBITED,
      SUPERVISOR: PROHIBITED,
      QUALITY_MANAGER: PROHIBITED,
      TENANT_ADMIN: cell(
        'allowedWithConditions',
        'Allowed with conditions — tenant-set, default about 5 minutes, platform ceiling 60 minutes',
      ),
      READONLY_AUDITOR: PROHIBITED,
    },
    why:
      'Flag clock skew beyond the tenant-set threshold, default about 5 minutes with a platform ' +
      'ceiling of 60 minutes, as an operational event.',
    whyRef: 'FUNC-A6-04-2-1 · L41181',
    sourceRef: 'L41100',
  },
  {
    id: 'force-version-change-in-flight',
    control: 'Force a package version change onto an in-flight Run',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    metElsewhereRef: null,
    routedTo: {},
    cells: {
      WORKER: PROHIBITED,
      SUPERVISOR: PROHIBITED,
      QUALITY_MANAGER: PROHIBITED,
      TENANT_ADMIN: PROHIBITED,
      READONLY_AUDITOR: PROHIBITED,
    },
    why:
      'Finish a Run on the Workflow version it started on, never re-basing an in-flight Run under ' +
      "the worker's feet.",
    whyRef: 'FUNC-A6-06-1-1 · L41193',
    sourceRef: 'L41101',
  },
  {
    id: 'alter-device-timestamp',
    control: 'Alter a device timestamp after capture',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    metElsewhereRef: null,
    routedTo: {},
    cells: {
      WORKER: PROHIBITED,
      SUPERVISOR: PROHIBITED,
      QUALITY_MANAGER: PROHIBITED,
      TENANT_ADMIN: PROHIBITED,
      READONLY_AUDITOR: PROHIBITED,
    },
    why: 'Roles prohibited: nobody may alter either after capture.',
    whyRef: 'FUNC-A6-04-1-1 · L41178',
    sourceRef: 'L41102',
  },
] as const satisfies readonly FlA6MatrixRow[]

type MissingFromMatrix = Exclude<FlA6RowId, (typeof FL_A6_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

/**
 * The shape the brief asserts, DERIVED here rather than quoted, so the
 * arithmetic is a check on the transcription instead of a restatement of it.
 * Nine rows over the nine data lines L41094-L41102, five columns, forty-five
 * cells.
 */
export const FL_A6_SHAPE = {
  module: 'MOD-FL-A6',
  rows: FL_A6_MATRIX.length,
  columns: FL_A6_COLUMNS.length,
  cells: FL_A6_MATRIX.length * FL_A6_COLUMNS.length,
  headerLine: 41092,
  separatorLine: 41093,
  firstDataLine: 41094,
  lastDataLine: 41102,
} as const

/**
 * THE THIRD AND FOURTH READINGS OF ROW 7's SURFACE, carried because one
 * reading of a silent cell is an assertion and three are a finding.
 *
 * Row 7's own cell names no surface. `metElsewhere` above cites one line; the
 * two below are the independent corroborations, in two further chapters, and
 * they are rendered on the panel rather than left in a commit message. Neither
 * is row 6 — reading row 7's surface off its neighbouring row would be the
 * inference this whole record exists to avoid.
 */
export const CLOCK_SKEW_SURFACE_CORROBORATION = [
  {
    reading:
      'Record-finish window, offline trust window, clock-skew threshold | Delivery Operations Hub, ' +
      'tenant administration area | Tenant Admin | Yes, within platform floors and ceilings',
    what: 'The configuration-ownership table, which names the owning surface and the owning role in its own columns.',
    sourceRef: 'L61256',
  },
  {
    reading:
      'The threshold is tenant-set: default approximately 5 minutes, platform ceiling 60 minutes',
    what: "The clock-skew guard's own rule list, which states the bound the cell states and leaves the surface to the tables above.",
    sourceRef: 'L80257',
  },
] as const satisfies readonly {
  readonly reading: string
  readonly what: string
  readonly sourceRef: string
}[]
