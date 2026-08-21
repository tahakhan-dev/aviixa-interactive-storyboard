import type { RoleId } from '@/domain/roles'
import {
  FL_ACTS_HELD_ELSEWHERE,
  type FrontlineCrossSurfaceAct,
} from '@/frontline/cross-surface'
import type { FrontlineMatrixCell, FrontlineMatrixRow } from '@/frontline/matrix'

/**
 * `MOD-FL-A2`'s PERMISSION MATRIX, TRANSCRIBED ROW BY ROW AND CELL BY CELL.
 * Header L40359, separator L40360, data L40361-L40369. NINE rows, FIVE
 * persona columns, FORTY-FIVE cells, every one of them filled.
 *
 * `FrontlineMatrixRow` and `FrontlineMatrixCell` are wave 0's types and are
 * parameterised here, never redefined; the verdict comes from
 * `frontlineAffordance` in `@/frontline/matrix` and from nothing else.
 *
 * `note` IS THE CELL'S WHOLE TEXT, BACKTICKS STRIPPED, AND NOTHING ELSE.
 * Thirty-one of the forty-five cells are a bare token with no words after
 * it, so a transcription that stored "the words after the token" would
 * leave thirty-one notes empty — which is exactly the blank the total
 * `Record` exists to forbid. Storing the whole cell also makes the
 * transcription mechanically checkable: the covering suite splits L40361 to
 * L40369 on the pipe, strips backticks, and compares.
 *
 * ── THE COLUMNS ARE `RoleId`, NOT A NEW UNION ──────────────────────────
 *
 * The five headers at L40359 are exactly five members of the platform's own
 * `RoleId`, so the column type is an `Extract` from it rather than a
 * thirteenth private spelling of the same five personas. It also lets a
 * column feed `frontlineCrossSurfaceModel` directly, which takes a `RoleId`
 * and checks its pointer against `@/routes/definitions`.
 *
 * ── THE TWO ROWS THAT ARE NOT THIS SCREEN'S, AND THE ONE THAT LOOKS LIKE
 *    IT SHOULD BE AND IS NOT ─────────────────────────────────────────────
 *
 * ROW 9, `Cancel a Run` (L40369). Supervisor and Quality Manager both read
 * `Allowed` and both end in the words "not here": "in the Delivery
 * Operations Hub for their own area, not here" and "in the Delivery
 * Operations Hub for any area, not here". The Worker cell states the same
 * fact from the other side — "a Delivery Operations Hub governance action".
 * `EXCL-FL-06` (L39489) classifies worker-initiated Run cancellation and
 * terminal completion as an **Invariant** exclusion, so a control here is a
 * broken guarantee rather than a misplaced button. Wave 0 refuses this row
 * classified anything but `another-surface`
 * (`controlsOnActsHeldElsewhere`), and the act's wording is READ from
 * `FL_ACTS_HELD_ELSEWHERE` rather than spelled a second time: three modules
 * meet this act independently and one catching it does not protect the
 * other two.
 *
 * ROW 3, `Claim or pick up unassigned work` (L40363). All five cells are a
 * bare `Explicitly prohibited` naming no surface at all, which is precisely
 * the case wave 0 warns a surface-name test misses. The classification is
 * the exclusion register's: `EXCL-FL-04` (L39487) excludes "In-application
 * work allocation" on the ground that "Assignment authority sits with the
 * Supervisor", names the **Delivery Operations Hub** as where it lives
 * instead, and classes it **Placement**. The module card says the same
 * (L40353, "Assignment is owned by the Delivery Operations Hub") and
 * `FUNC-A2-01-1-2` (L40428) prohibits it "including Supervisors on this
 * surface" — which places the authority off this surface rather than
 * nowhere. So the row is `another-surface`, and every one of its five cells
 * returns a cross-surface statement.
 *
 * ROW 2, `View another worker's assigned work` (L40362), IS NOT. Its act is
 * `EXCL-FL-07` (L39490), whose "Where it lives instead" column reads
 * "Client Command Center, scoped to authorised roles" — so a mechanical
 * reading of the same column that classified row 3 would classify this one
 * `another-surface` too. It must not. `MOD-FL-A1` met the same act at
 * L40196 and ruled it stated wherever it could be attempted rather than
 * pointed somewhere else, and the ground is this module's own Security line
 * (L40417): "No search, filter, or deep link can reach another identity's
 * work." A cross-surface statement reads as "you could do this over there",
 * and for a Worker holding an execution session and no other session
 * (`AC-FL-009-2`, L39945) that is false. `EXCL-FL-07` is an Invariant and
 * `AC-SCOPE-044` (L2683) says no other worker's data is reachable. Row 2
 * stays on this screen as a categorical refusal, and re-deciding it here
 * would be a second spelling of `MOD-FL-A1`'s ruling.
 *
 * ── NOTHING IN THIS MATRIX IS ROUTED ───────────────────────────────────
 *
 * `routedTo` is empty on all nine rows and that is a fact about this
 * matrix rather than an omission. Eleven cells read `Not applicable — no
 * execution session` or `— no execution session on this surface`, and in
 * `MOD-FL-A1` the identical wording routes to that matrix's `session` row
 * (L40188). THIS matrix has no session row: establishing a session is
 * `MOD-FL-A1`'s act on the Login destination, not one of these nine. A
 * pointer at a row this matrix does not hold does not compile, which is the
 * point of `routedTo` being keyed on `A2RowId`.
 *
 * ── WHAT THIS MATRIX HAS, AND WHAT IT DOES NOT ─────────────────────────
 *
 * SIX of the seven tokens appear. `Unavailable` and `Read-only` do not, so
 * the token overload at L42114 against L42120 does not arise here. The six
 * sum to the cell count rather than being asserted beside it:
 * `Explicitly prohibited` 27, `Not applicable` 11, `Allowed` 5, `Allowed
 * with conditions` 1, `Client Decision Required` 1 — 27 + 11 + 5 + 1 + 1 =
 * 45 = 9 × 5.
 *
 * ONE `Client Decision Required` CELL: row 1's Tenant Admin (L40361), which
 * is one of the eleven wave 0 enumerates in `TENANT_ADMIN_OPEN_CELLS` and
 * the only one this module carries. It defers to the same unanswered
 * device-session question every one of the eleven defers to, recorded ONCE
 * as a `RouteOpenDecision` in `src/routes/definitions.ts`. `AC-FL-009-5`
 * (L39948) forbids resolving it in either direction, so `openDecision`
 * names the criterion and this file holds no answer.
 */

export type A2Column = Extract<
  RoleId,
  'WORKER' | 'SUPERVISOR' | 'QUALITY_MANAGER' | 'TENANT_ADMIN' | 'READONLY_AUDITOR'
>

export const A2_COLUMNS = [
  'WORKER',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'TENANT_ADMIN',
  'READONLY_AUDITOR',
] as const satisfies readonly A2Column[]

type MissingFromColumns = Exclude<A2Column, (typeof A2_COLUMNS)[number]>
const _columnsExhaustive: MissingFromColumns extends never ? true : never = true
void _columnsExhaustive

/** The header row's own words, L40359. Never re-worded for a table heading. */
export const A2_COLUMN_HEADINGS = {
  WORKER: 'Worker',
  SUPERVISOR: 'Supervisor',
  QUALITY_MANAGER: 'Quality Manager',
  TENANT_ADMIN: 'Tenant Admin',
  READONLY_AUDITOR: 'Read-only Auditor',
} as const satisfies Readonly<Record<A2Column, string>>

export type A2RowId =
  | 'view-own-assigned-work'
  | 'view-another-workers-work'
  | 'claim-unassigned-work'
  | 'enter-a-ready-run'
  | 'enter-a-not-yet-ready-run'
  | 'trigger-a-manual-sync'
  | 'view-the-sync-detail-sheet'
  | 'reorder-hide-or-dismiss'
  | 'cancel-a-run'

/**
 * The criterion row 1's Tenant Admin cell defers to. It is a CITATION KEY
 * and never a second answer: the question itself is recorded once, as a
 * `RouteOpenDecision` on `SURF-FL` in `src/routes/definitions.ts`.
 */
export const A2_TENANT_ADMIN_OPEN_DECISION = 'AC-FL-009-5'

/**
 * One row, plus the one thing wave 0's row type deliberately does not
 * carry: the source sentence that governs the row.
 *
 * WHY IT IS REQUIRED ON ALL NINE RATHER THAN OPTIONAL ON THE PROHIBITIONS.
 * Thirty-one of the forty-five cells carry a bare token and no words of
 * their own, and rule 4 of this surface says a prohibition renders as no
 * control PLUS A STATED LINE where the control would sit. A line reading
 * only "Explicitly prohibited" is the empty region wearing a token. So each
 * row carries the sentence that says why, from the source, with its own
 * identifier-anchored locator — and a row added without one does not
 * compile.
 */
export interface A2MatrixRow extends FrontlineMatrixRow<A2RowId, A2Column> {
  readonly why: string
  readonly whyRef: string
}

function cell(outcome: FrontlineMatrixCell['outcome'], note: string): FrontlineMatrixCell {
  return { outcome, note, openDecision: null }
}

/** The bare tokens, as a cell's own and only words. */
const PROHIBITED = cell('explicitlyProhibited', 'Explicitly prohibited')
const NA_NO_SESSION = cell('notApplicable', 'Not applicable — no execution session')
const NA_NO_SESSION_HERE = cell(
  'notApplicable',
  'Not applicable — no execution session on this surface',
)
const NA_BARE = cell('notApplicable', 'Not applicable')
const ALLOWED = cell('allowed', 'Allowed')

/**
 * Row 9's act, READ from the surface-level register rather than transcribed
 * a second time. `FL_ACTS_HELD_ELSEWHERE` exists so the twelve module tasks
 * do not each write their own wording for the four acts this whole surface
 * never carries; a module that re-spells one has created the second
 * spelling of a ruling, which is the defect shape this build has recorded
 * most.
 */
function actHeldElsewhere(startsWith: string): FrontlineCrossSurfaceAct {
  const found = FL_ACTS_HELD_ELSEWHERE.find((a) => a.capability.startsWith(startsWith))
  if (found === undefined) {
    throw new Error(
      `MOD-FL-A2 expected FL_ACTS_HELD_ELSEWHERE to declare an act beginning "${startsWith}". ` +
        'It does not, so the surface-level register and this matrix have drifted apart and the ' +
        'row must be re-read against L40369 rather than re-worded here.',
    )
  }
  return found
}

const CANCEL_ACT = actHeldElsewhere('Cancelling a Run, and terminally completing one.')

export const A2_MATRIX = [
  {
    id: 'view-own-assigned-work',
    control: 'View own assigned work',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    cells: {
      WORKER: ALLOWED,
      SUPERVISOR: NA_NO_SESSION_HERE,
      QUALITY_MANAGER: NA_NO_SESSION_HERE,
      TENANT_ADMIN: {
        outcome: 'clientDecisionRequired',
        note: 'Client Decision Required',
        openDecision: A2_TENANT_ADMIN_OPEN_DECISION,
      },
      READONLY_AUDITOR: PROHIBITED,
    },
    why: 'Roles allowed: Worker, for their own work. Roles prohibited: all others.',
    whyRef: 'FUNC-A2-01-1-1 · L40427',
    sourceRef: 'L40361',
  },
  {
    id: 'view-another-workers-work',
    control: "View another worker's assigned work",
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
    why: 'No search, filter, or deep link can reach another identity\'s work.',
    whyRef: 'L40417',
    sourceRef: 'L40362',
  },
  {
    id: 'claim-unassigned-work',
    control: 'Claim or pick up unassigned work',
    surface: 'another-surface',
    existence: 'present',
    metElsewhere: {
      where: 'another-surface',
      surface: 'SURF-DOH',
      note:
        'EXCL-FL-04 excludes in-application work allocation from this surface on the ground that ' +
        'assignment authority sits with the Supervisor, names the Delivery Operations Hub as where ' +
        'it lives instead, and classes the exclusion Placement (L39487). The module card says the ' +
        'same: assignment is owned by the Delivery Operations Hub (L40353). FUNC-A2-01-1-2 (L40428) ' +
        'prohibits the act for everybody "including Supervisors on this surface", which places the ' +
        'authority off this surface rather than nowhere. There is nothing to claim here, so there ' +
        'is nothing to claim improperly.',
    },
    routedTo: {},
    cells: {
      WORKER: PROHIBITED,
      SUPERVISOR: PROHIBITED,
      QUALITY_MANAGER: PROHIBITED,
      TENANT_ADMIN: PROHIBITED,
      READONLY_AUDITOR: PROHIBITED,
    },
    why: 'Roles allowed: nobody. Roles prohibited: everybody, including Supervisors on this surface.',
    whyRef: 'FUNC-A2-01-1-2 · L40428',
    sourceRef: 'L40363',
  },
  {
    id: 'enter-a-ready-run',
    control: 'Enter a ready Run',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    cells: {
      WORKER: ALLOWED,
      SUPERVISOR: NA_NO_SESSION,
      QUALITY_MANAGER: NA_NO_SESSION,
      TENANT_ADMIN: NA_BARE,
      READONLY_AUDITOR: PROHIBITED,
    },
    why: 'Roles allowed: Worker. Roles prohibited: all others.',
    whyRef: 'FUNC-A2-03-1-1 · L40438',
    sourceRef: 'L40364',
  },
  {
    id: 'enter-a-not-yet-ready-run',
    control: 'Enter a not-yet-ready Run',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    cells: {
      WORKER: cell(
        'explicitlyProhibited',
        'Explicitly prohibited — the package has not arrived, so nothing can be rendered',
      ),
      SUPERVISOR: PROHIBITED,
      QUALITY_MANAGER: PROHIBITED,
      TENANT_ADMIN: PROHIBITED,
      READONLY_AUDITOR: PROHIBITED,
    },
    why: 'Roles prohibited: nobody may enter a not-yet-ready Run.',
    whyRef: 'FUNC-A2-02-3-1 · L40435',
    sourceRef: 'L40365',
  },
  {
    id: 'trigger-a-manual-sync',
    control: 'Trigger a manual sync',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    cells: {
      WORKER: cell(
        'allowedWithConditions',
        'Allowed with conditions — a convenience only, never a dependency',
      ),
      SUPERVISOR: NA_NO_SESSION,
      QUALITY_MANAGER: NA_NO_SESSION,
      TENANT_ADMIN: NA_BARE,
      READONLY_AUDITOR: PROHIBITED,
    },
    why: 'Roles prohibited: nothing in the application may require it.',
    whyRef: 'FUNC-A2-04-2-2 · L40447',
    sourceRef: 'L40366',
  },
  {
    id: 'view-the-sync-detail-sheet',
    control: 'View the sync detail sheet',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    cells: {
      WORKER: ALLOWED,
      SUPERVISOR: NA_NO_SESSION,
      QUALITY_MANAGER: NA_NO_SESSION,
      TENANT_ADMIN: NA_BARE,
      READONLY_AUDITOR: PROHIBITED,
    },
    why: 'Roles prohibited: no worker action resolves anything here; the sheet is informational.',
    whyRef: 'FUNC-A2-04-2-1 · L40446',
    sourceRef: 'L40367',
  },
  {
    id: 'reorder-hide-or-dismiss',
    control: 'Reorder, hide, or dismiss an assigned Run',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    cells: {
      WORKER: cell(
        'explicitlyProhibited',
        'Explicitly prohibited — the list orders and presents what the Delivery Operations Hub assigned',
      ),
      SUPERVISOR: PROHIBITED,
      QUALITY_MANAGER: PROHIBITED,
      TENANT_ADMIN: PROHIBITED,
      READONLY_AUDITOR: PROHIBITED,
    },
    why:
      'Roles prohibited: the application never allocates; it orders and presents what the Delivery ' +
      'Operations Hub assigned.',
    whyRef: 'FUNC-A2-03-2-1 · L40440',
    sourceRef: 'L40368',
  },
  {
    id: 'cancel-a-run',
    control: 'Cancel a Run',
    surface: 'another-surface',
    existence: 'present',
    metElsewhere: {
      where: 'another-surface',
      surface: CANCEL_ACT.owningSurface,
      note: CANCEL_ACT.whatHappensThere,
    },
    routedTo: {},
    cells: {
      WORKER: cell(
        'explicitlyProhibited',
        'Explicitly prohibited — a Delivery Operations Hub governance action',
      ),
      SUPERVISOR: cell(
        'allowed',
        'Allowed — in the Delivery Operations Hub for their own area, not here',
      ),
      QUALITY_MANAGER: cell(
        'allowed',
        'Allowed — in the Delivery Operations Hub for any area, not here',
      ),
      TENANT_ADMIN: PROHIBITED,
      READONLY_AUDITOR: PROHIBITED,
    },
    why: 'Worker-initiated Run cancellation or terminal completion',
    whyRef: 'EXCL-FL-06 · L39489',
    sourceRef: 'L40369',
  },
] as const satisfies readonly A2MatrixRow[]

type MissingFromMatrix = Exclude<A2RowId, (typeof A2_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

export function a2RowById(id: A2RowId): A2MatrixRow {
  const found = A2_MATRIX.find((r) => r.id === id)
  if (found === undefined) throw new Error(`no MOD-FL-A2 matrix row: ${id}`)
  return found
}

/**
 * The shape, DERIVED here rather than quoted, so the arithmetic is a check
 * on the transcription instead of a restatement of it. Nine rows over the
 * nine data lines L40361-L40369, five columns, forty-five cells.
 */
export const A2_SHAPE = {
  module: 'MOD-FL-A2',
  rows: A2_MATRIX.length,
  columns: A2_COLUMNS.length,
  cells: A2_MATRIX.length * A2_COLUMNS.length,
  headerLine: 40359,
  separatorLine: 40360,
  firstDataLine: 40361,
  lastDataLine: 40369,
} as const
