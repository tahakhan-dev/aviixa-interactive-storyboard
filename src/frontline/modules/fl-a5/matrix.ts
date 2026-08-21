import type { RoleId } from '@/domain/roles'
import {
  FL_ACTS_HELD_ELSEWHERE,
  type FrontlineCrossSurfaceAct,
} from '@/frontline/cross-surface'
import type { FrontlineMatrixCell, FrontlineMatrixRow } from '@/frontline/matrix'

/**
 * `MOD-FL-A5`'s permission matrix, transcribed row by row and cell by cell.
 * Header L40910, separator L40911, data L40912-L40920. NINE rows, FIVE
 * columns, FORTY-FIVE cells, every one of them filled.
 *
 * `FrontlineMatrixRow` and `FrontlineMatrixCell` are wave 0's types and are
 * parameterised here, never redefined, and no second evaluator is written:
 * the verdict comes from `frontlineAffordance` in `@/frontline/matrix`.
 *
 * ── THE COLUMNS ARE `RoleId`, NOT A NEW UNION ──────────────────────────
 * The five headers at L40910 — Worker, Supervisor, Quality Manager, Tenant
 * Admin, Read-only Auditor — are exactly five members of the platform's own
 * `RoleId`, so the column type is an `Extract` from it rather than a
 * twelfth private spelling of the same five personas. It also means a
 * column feeds `frontlineCrossSurfaceModel` directly, which takes a
 * `RoleId` and checks the pointer against `@/routes/definitions`.
 *
 * ── WHAT THIS MATRIX HAS, AND WHAT IT DOES NOT ─────────────────────────
 *
 * NO `Client Decision Required` CELL. All eleven of them across the twelve
 * matrices sit in the Tenant Admin column and every one is enumerated in
 * `TENANT_ADMIN_OPEN_CELLS`; none of the eleven is `MOD-FL-A5`. This
 * module's four Tenant Admin cells read `Not applicable` or `Explicitly
 * prohibited`, so `openDecision` is `null` on all forty-five and the
 * `AC-FL-009-5` device-session question is not this module's to carry.
 *
 * NO `Unavailable` AND NO `Read-only` CELL either, so the token overload at
 * L42114 against L42120 does not arise here. Four of the seven tokens
 * appear, and they sum to the cell count rather than being asserted beside
 * it: `Explicitly prohibited` 34, `Not applicable` 6, `Allowed` 3, `Allowed
 * with conditions` 2 — 34 + 6 + 3 + 2 = 45 = 9 × 5.
 *
 * ── THE TWO ROWS THAT ARE NOT THIS SCREEN'S ────────────────────────────
 *
 * ROW 5, `Release a held lot, unit, or run` (L40916). The Quality Manager
 * cell reads `Allowed` and names the Client Command Center, "delivered as a
 * lot-release command"; the Supervisor cell is a PROHIBITION CARRYING AN
 * ACT, "Supervisors request release with a note", and requesting is a
 * Command Center affordance too. `CMD-FL-LOTREL` is settled in
 * `@/frontline/commands` and the device is its RECIPIENT: L39670 — a lot is
 * released on a given device when that device has applied the command, not
 * because a Quality Manager created one. So the row is `another-surface`
 * and every one of its five cells returns a cross-surface statement. The
 * act is already declared once for the whole surface in
 * `FL_ACTS_HELD_ELSEWHERE` and is READ from there rather than re-spelled.
 *
 * ROW 8, `Configure severity action bundles` (L40919). Quality Manager and
 * Tenant Admin both read `Allowed with conditions` and both name the
 * Delivery Operations Hub tenant administration area. The Tenant Admin cell
 * is one of the eleven ELLIPTICAL cells wave 0 enumerates — it says only
 * "same location, same floor constraint" and names no surface of its own,
 * which is why `surface` is a property of the ROW here and never of the
 * cell's wording.
 *
 * ── THE FOUR ROWS THAT LOOK LIKE THEY BELONG ELSEWHERE AND DO NOT ──────
 *
 * ROW 3 (L40914) has a Quality Manager cell naming the Client Command
 * Center — "reclassification with a recorded reason happens at review time
 * in the Client Command Center, never on the device". It is NOT classified
 * `another-surface`, and the difference is the act. The row's act is
 * "Alter a severity classification ON THE DEVICE", which no column holds
 * anywhere; reclassification at review time is a different, narrower act
 * that the cell names as the alternative. Classifying the row
 * `another-surface` would render the Worker's own prohibition as "held on
 * the Client Command Center", which claims a Worker could reclassify there.
 * The sentence is not lost: it is the cell's own note and it renders.
 *
 * ROW 4 (L40915) — "the hold is placed automatically and is released, not
 * cancelled". Placement is not an act any column holds, and release is
 * ROW 5 OF THIS MATRIX. That is question 4 of wave 0's ordering exactly, so
 * the Quality Manager cell carries `routedTo: 'release-held-lot'` and draws
 * a pointer rather than a control. `routedTo` is keyed on this matrix's own
 * row ids, so the pointer cannot leave the matrix. The Supervisor cell
 * names no route and is given none — a bare `Explicitly prohibited` is a
 * categorical refusal, not an unstated routing.
 *
 * ROW 9's Read-only Auditor cell (L40920) states a fact about PLATFORM
 * CONSOLE ROLES, which have no column on this matrix. `NO_OFF_SWITCH` in
 * `charter.ts` is where the panel renders it from, because a per-column
 * fold puts the strongest sentence in the matrix under the narrowest
 * persona on the surface.
 *
 * ROWS 1 AND 6 ARE THE ONLY CONTROLS THIS MODULE DRAWS. Trigger a
 * deterministic evaluation by capturing a value, and complete the
 * pre-authorised containment checklist. Both are the Worker's, both are
 * `Allowed`, and every other permissive cell in the matrix is on a row
 * whose act is met on another surface.
 */

export type FlA5Column = Extract<
  RoleId,
  'WORKER' | 'SUPERVISOR' | 'QUALITY_MANAGER' | 'TENANT_ADMIN' | 'READONLY_AUDITOR'
>

export const FL_A5_COLUMNS = [
  'WORKER',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'TENANT_ADMIN',
  'READONLY_AUDITOR',
] as const satisfies readonly FlA5Column[]

type MissingFromColumns = Exclude<FlA5Column, (typeof FL_A5_COLUMNS)[number]>
const _columnsExhaustive: MissingFromColumns extends never ? true : never = true
void _columnsExhaustive

/** The header row's own words, L40910. Never re-worded for a table heading. */
export const FL_A5_COLUMN_HEADINGS = {
  WORKER: 'Worker',
  SUPERVISOR: 'Supervisor',
  QUALITY_MANAGER: 'Quality Manager',
  TENANT_ADMIN: 'Tenant Admin',
  READONLY_AUDITOR: 'Read-only Auditor',
} as const satisfies Readonly<Record<FlA5Column, string>>

export type FlA5RowId =
  | 'trigger-deterministic-evaluation'
  | 'override-specification-gate'
  | 'alter-severity-classification'
  | 'prevent-or-cancel-hold'
  | 'release-held-lot'
  | 'complete-containment-checklist'
  | 'skip-or-dismiss-checklist'
  | 'configure-severity-action-bundles'
  | 'disable-pause-or-weaken'

/**
 * One row, plus the one thing wave 0's row type deliberately does not carry:
 * the source sentence that governs the row.
 *
 * WHY IT IS REQUIRED ON ALL NINE RATHER THAN OPTIONAL ON THE PROHIBITIONS.
 * Thirty of the forty-five cells are a bare `Explicitly prohibited` with no
 * words of their own — four of the thirty-four prohibitions carry a clause,
 * the rest carry the token and nothing else — and rule 4 of this surface
 * says a prohibition
 * renders as no control PLUS A STATED LINE where the control would sit. A
 * line reading only "Explicitly prohibited" is the empty region wearing a
 * token. So each row carries the functionality sentence that says why, from
 * the source, with its own identifier-anchored locator — and a row added
 * without one does not compile.
 */
export interface FlA5MatrixRow extends FrontlineMatrixRow<FlA5RowId, FlA5Column> {
  readonly why: string
  readonly whyRef: string
}

function cell(
  outcome: FrontlineMatrixCell['outcome'],
  note: string,
): FrontlineMatrixCell {
  return { outcome, note, openDecision: null }
}

/** The bare token, as the cell's own and only words. */
const PROHIBITED = cell('explicitlyProhibited', 'Explicitly prohibited')
const NA_NO_SESSION = cell('notApplicable', 'Not applicable — no execution session')
const NA_BARE = cell('notApplicable', 'Not applicable')

/**
 * Row 5's act, READ from the surface-level register rather than transcribed
 * a second time. `FL_ACTS_HELD_ELSEWHERE` exists so that the twelve module
 * tasks do not each write their own wording for the four acts this whole
 * surface never carries; a module that re-spells one has created the second
 * spelling of a ruling.
 */
function actHeldElsewhere(startsWith: string): FrontlineCrossSurfaceAct {
  const found = FL_ACTS_HELD_ELSEWHERE.find((a) => a.capability.startsWith(startsWith))
  if (found === undefined) {
    throw new Error(
      `MOD-FL-A5 expected FL_ACTS_HELD_ELSEWHERE to declare an act beginning "${startsWith}". ` +
        'It does not, so the surface-level register and this matrix have drifted apart and ' +
        'the row must be re-read against L40916 rather than re-worded here.',
    )
  }
  return found
}

const RELEASE_ACT = actHeldElsewhere('Releasing a held lot, unit, or run')

export const FL_A5_MATRIX = [
  {
    id: 'trigger-deterministic-evaluation',
    control: 'Trigger a deterministic evaluation by capturing a value',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    cells: {
      WORKER: cell('allowed', 'Allowed'),
      SUPERVISOR: NA_NO_SESSION,
      QUALITY_MANAGER: NA_NO_SESSION,
      TENANT_ADMIN: NA_BARE,
      READONLY_AUDITOR: PROHIBITED,
    },
    why: 'The deterministic layer evaluates the value against those limits, locally, with no network involvement.',
    whyRef: 'L40935',
    sourceRef: 'L40912',
  },
  {
    id: 'override-specification-gate',
    control: 'Override a specification gate',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    cells: {
      WORKER: PROHIBITED,
      SUPERVISOR: PROHIBITED,
      QUALITY_MANAGER: PROHIBITED,
      TENANT_ADMIN: PROHIBITED,
      READONLY_AUDITOR: PROHIBITED,
    },
    why: 'Roles prohibited: no role may override it on the device.',
    whyRef: 'FUNC-A5-01-1-1 · L40983',
    sourceRef: 'L40913',
  },
  {
    id: 'alter-severity-classification',
    control: 'Alter a severity classification on the device',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    cells: {
      WORKER: PROHIBITED,
      SUPERVISOR: PROHIBITED,
      QUALITY_MANAGER: cell(
        'explicitlyProhibited',
        'Explicitly prohibited — reclassification with a recorded reason happens at review time in the Client Command Center, never on the device',
      ),
      TENANT_ADMIN: PROHIBITED,
      READONLY_AUDITOR: PROHIBITED,
    },
    why: 'Roles prohibited: no role, and no artificial intelligence, may classify.',
    whyRef: 'FUNC-A5-01-1-3 · L40985',
    sourceRef: 'L40914',
  },
  {
    id: 'prevent-or-cancel-hold',
    control: 'Prevent or cancel an automatic Severity 1 hold',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: { QUALITY_MANAGER: 'release-held-lot' },
    cells: {
      WORKER: PROHIBITED,
      SUPERVISOR: PROHIBITED,
      QUALITY_MANAGER: cell(
        'explicitlyProhibited',
        'Explicitly prohibited — the hold is placed automatically and is released, not cancelled',
      ),
      TENANT_ADMIN: PROHIBITED,
      READONLY_AUDITOR: PROHIBITED,
    },
    why: 'Roles prohibited: nobody may prevent it.',
    whyRef: 'FUNC-A5-02-2-1 · L40996',
    sourceRef: 'L40915',
  },
  {
    id: 'release-held-lot',
    control: 'Release a held lot, unit, or run',
    surface: 'another-surface',
    existence: 'present',
    metElsewhere: {
      where: 'another-surface',
      surface: RELEASE_ACT.owningSurface,
      note: RELEASE_ACT.whatHappensThere,
    },
    routedTo: {},
    cells: {
      WORKER: PROHIBITED,
      SUPERVISOR: cell(
        'explicitlyProhibited',
        'Explicitly prohibited — Supervisors request release with a note',
      ),
      QUALITY_MANAGER: cell(
        'allowed',
        'Allowed — from the Client Command Center, delivered as a lot-release command',
      ),
      TENANT_ADMIN: PROHIBITED,
      READONLY_AUDITOR: PROHIBITED,
    },
    why: 'Roles allowed: Quality Manager releases; Supervisors request with a note.',
    whyRef: 'FUNC-A5-02-3-1 · L41000',
    sourceRef: 'L40916',
  },
  {
    id: 'complete-containment-checklist',
    control: 'Complete the pre-authorised containment checklist',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    cells: {
      WORKER: cell('allowed', 'Allowed'),
      SUPERVISOR: NA_NO_SESSION,
      QUALITY_MANAGER: NA_NO_SESSION,
      TENANT_ADMIN: NA_BARE,
      READONLY_AUDITOR: PROHIBITED,
    },
    why: 'Roles allowed: Worker executes it. Roles prohibited: nobody may skip or dismiss it.',
    whyRef: 'FUNC-A5-01-2-1 · L40987',
    sourceRef: 'L40917',
  },
  {
    id: 'skip-or-dismiss-checklist',
    control: 'Skip or dismiss the containment checklist',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    cells: {
      WORKER: PROHIBITED,
      SUPERVISOR: PROHIBITED,
      QUALITY_MANAGER: PROHIBITED,
      TENANT_ADMIN: PROHIBITED,
      READONLY_AUDITOR: PROHIBITED,
    },
    why: 'Roles prohibited: nobody may skip or dismiss it.',
    whyRef: 'FUNC-A5-01-2-1 · L40987',
    sourceRef: 'L40918',
  },
  {
    id: 'configure-severity-action-bundles',
    control: 'Configure severity action bundles',
    surface: 'another-surface',
    existence: 'present',
    metElsewhere: {
      where: 'another-surface',
      surface: 'SURF-DOH',
      note: 'in the Delivery Operations Hub tenant administration area, above the platform floor only, never on the device',
    },
    routedTo: {},
    cells: {
      WORKER: PROHIBITED,
      SUPERVISOR: PROHIBITED,
      QUALITY_MANAGER: cell(
        'allowedWithConditions',
        'Allowed with conditions — in the Delivery Operations Hub tenant administration area, above the platform floor only, never on the device',
      ),
      TENANT_ADMIN: cell(
        'allowedWithConditions',
        'Allowed with conditions — same location, same floor constraint',
      ),
      READONLY_AUDITOR: PROHIBITED,
    },
    why: 'Roles prohibited: no bundle may subtract from the floor; the platform rejects a looser-than-floor value rather than logging it.',
    whyRef: 'FUNC-A5-02-3-2 · L41001',
    sourceRef: 'L40919',
  },
  {
    id: 'disable-pause-or-weaken',
    control: 'Disable, pause, or weaken the deterministic layer',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    cells: {
      WORKER: PROHIBITED,
      SUPERVISOR: PROHIBITED,
      QUALITY_MANAGER: PROHIBITED,
      TENANT_ADMIN: PROHIBITED,
      READONLY_AUDITOR: cell(
        'explicitlyProhibited',
        'Explicitly prohibited — and no platform console role can do it either; the deterministic backbone has no off switch',
      ),
    },
    why: 'Roles prohibited: nobody may pause the deterministic backbone, which has no off switch.',
    whyRef: 'FUNC-A5-04-1-2 · L41010',
    sourceRef: 'L40920',
  },
] as const satisfies readonly FlA5MatrixRow[]

type MissingFromMatrix = Exclude<FlA5RowId, (typeof FL_A5_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

/**
 * The shape the brief asserts, DERIVED here rather than quoted, so the
 * arithmetic is a check on the transcription instead of a restatement of it.
 * Nine rows over the nine data lines L40912-L40920, five columns, forty-five
 * cells.
 */
export const FL_A5_SHAPE = {
  module: 'MOD-FL-A5',
  rows: FL_A5_MATRIX.length,
  columns: FL_A5_COLUMNS.length,
  cells: FL_A5_MATRIX.length * FL_A5_COLUMNS.length,
  headerLine: 40910,
  separatorLine: 40911,
  firstDataLine: 40912,
  lastDataLine: 40920,
} as const
