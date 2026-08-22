/**
 * MOD-DOH-06 — Run Scheduling and Execution Oversight. The module's own data:
 * its twelve-row control matrix, its closing-state table, its three open
 * decisions and the traps each of them sets.
 *
 * MEASURED, NOT TRANSCRIBED. §1a of the re-plan records that every span in
 * that document starts on the table HEADER, so a span "L27907-L27920, 12
 * rows" encloses header, separator and twelve data rows. Re-measured here
 * against the frozen source: the matrix header is L27907, the separator
 * L27908, and the data rows are L27909 through L27920 — TWELVE. The identity
 * card is L27888-L27903, header L27888, data L27890-L27903 — FOURTEEN. The
 * closing-state table is L27876-L27880, header L27876, data L27878-L27880 —
 * THREE. All three agree with the brief.
 *
 * WHAT THIS FILE REFUSES TO DO. Three decisions are open on this module and
 * not one of them may be settled by anything shipped here:
 *
 *   DEC-RUNSTATE-001 — what `submitted` and `complete` mean. This module's
 *   OWN closing-state table (L27876-L27880) states Reading B as if it were
 *   settled. It is transcribed verbatim below because it IS what the source
 *   says, and it is transcribed WITH the disclosure that it is one reading of
 *   three. Nothing here keys a board, a filter or a fold on `submitted` or
 *   `complete`: `closingPosition` branches on INSTANTS, which is the choice
 *   wave 0 made in `@/surfaces/doh/transitions` for exactly this reason, and
 *   undoing it here would settle the decision by shipping it.
 *
 *   DEC-STUCK-001 — what state a manually closed stuck run stands in. Row 9's
 *   condition cell is Reading A almost word for word, and copying it into a
 *   rule would settle the decision silently. `manualCloseAssertion` below
 *   carries the ONLY part AC-RUN-004 (L7128) permits this build to assert.
 *
 *   DEC-FINISH-001 — the finish window's floor and ceiling. Wave 0 built the
 *   enforcement and the disclosure; this module MOUNTS the disclosure, which
 *   is the half that had no screen.
 */
import { rolesInDomain, type RoleId } from '@/domain/roles'
import type { Clock } from '@/domain/clock'
import {
  BARE_PROHIBITION,
  cellStatus,
  rolesReachingByMatrix,
  type ControlStatus,
  type DohControlMatrixRow,
} from '@/surfaces/doh/modules'
import {
  DEC_FINISH_001,
  dueTransitions,
  finishWindowEndsAtMs,
  type RunTimingFacts,
} from '@/surfaces/doh/transitions'
import type { TenantRoleId } from '../../../../../app/hub/HubShell'

/* ==================================================================== *
 * THE TWELVE ROWS
 * ==================================================================== */

export type RunControlId =
  | 'create-a-run'
  | 'view-the-schedule'
  | 'cancel-a-run'
  | 'extend-a-run-end-time'
  | 'substitute-a-worker-mid-run'
  | 'add-or-remove-a-worker-beyond-substitution'
  | 'change-planned-quantity-in-flight'
  | 'pause-or-stop-a-run'
  | 'close-a-stuck-run-manually'
  | 'set-the-record-finish-window'
  | 'set-the-run-extension-cap'
  | 'force-a-run-to-finished-early'

/**
 * The row ordinals the brief and the plan use, so a reader can check a trap
 * against the line it cites without counting. Row n is L(27908 + n).
 */
export const MATRIX_FIRST_DATA_LINE = 27909
export const MATRIX_LAST_DATA_LINE = 27920

/** Every deferral cell's wording, once. §19.1.4 rows 4 and 5, L25879-L25880. */
const OUT_OF_V1 =
  'Explicitly prohibited — out of V1. §4.6.6 (L27872): "All other in-flight structural edits … are out of V1: they complicate the audit trail for marginal benefit." The refusal is permanent for V1 and is not a control awaiting a permission.'

/**
 * THE TENANT ADMINISTRATION AREA IS NOT THIS SCREEN, AND IT IS NOT ANOTHER
 * SURFACE EITHER. Rows 10 and 11 both send the setting to SCR-DOH-23
 * (L48117), which is a HUB screen group — `moduleId: null` in
 * `@/surfaces/doh/screens`, D2's ownerless group, carrying MOD-DOH-17 and the
 * Part IX settings register, and slice 12's to build.
 *
 * So the row classifies `screen`: `@/surfaces/doh/modules` is explicit that a
 * row "stays `screen` when the Hub screen that renders it belongs to a
 * SIBLING module". It carries NO `boundary` pointer, because the boundary
 * register is the eight acts owned by another SURFACE and this is not one of
 * them — and `inlineControlsOnAdjacentCapabilities` fails a row that points
 * at a register boundary while classified `screen`, which is the right answer
 * for a pointer that would be false.
 *
 * What the screen therefore draws is a NAMED POINTER and no control: not a
 * `CrossSurfaceStatement` (which claims a place on another surface) and not a
 * `SeamNotice` (which claims a schedule for this surface, and would need a
 * registered seam id that `@/surfaces/doh/seams` does not hold).
 */
const IN_THE_TENANT_ADMINISTRATION_AREA =
  'The setting is made in the tenant administration area — SCR-DOH-23, L48117 — which is a different Hub screen and slice 12’s to build. This screen states where the value is set and draws no control for it; the value itself is enforced here.'

const ROW_1: DohControlMatrixRow<RunControlId> = {
  id: 'create-a-run',
  control: 'Create a run',
  surface: 'screen',
  status: {
    TENANT_ADMIN: 'explicitly-prohibited',
    SUPERVISOR: 'allowed-with-conditions',
    QUALITY_MANAGER: 'explicitly-prohibited',
    READONLY_AUDITOR: 'explicitly-prohibited',
    WORKER: 'explicitly-prohibited',
  },
  detail: {
    TENANT_ADMIN:
      'Explicitly prohibited — run creation is supervisor-driven. §4.6.2 (L27862): "Run creation at V1 is manual, by supervisors."',
    SUPERVISOR:
      'Allowed with conditions — own Area scope; blocked in hard and compliance suspension. The suspension half is the evaluator’s feature-and-suspension stage, not a second rule written here.',
    QUALITY_MANAGER: BARE_PROHIBITION,
    READONLY_AUDITOR: BARE_PROHIBITION,
    WORKER: BARE_PROHIBITION,
  },
  rendering:
    'One create control, offered to the Supervisor within their own Areas and absent for the other four with the cell text as the reason. `auto_scheduled` is reserved and unreachable: `DOH_SCHEDULE_RUN.runSource` is the literal type `manual`.',
  effect: 'Writes a run record with denormalised context and no package pin — the pin lands at assignment.',
  sourceRef: 'L27909 · §4.6.2',
}

const ROW_2: DohControlMatrixRow<RunControlId> = {
  id: 'view-the-schedule',
  control: 'View the schedule, today plus 7 days',
  surface: 'screen',
  status: {
    TENANT_ADMIN: 'allowed',
    SUPERVISOR: 'allowed-with-conditions',
    QUALITY_MANAGER: 'allowed',
    READONLY_AUDITOR: 'read-only',
    WORKER: 'allowed-with-conditions',
  },
  detail: {
    TENANT_ADMIN:
      'Allowed. Unconditional — and catalogue B’s "Roles that can open it" cell for SCR-DOH-13 (L48107) names only the Supervisor, the Quality Manager and the Read-only Auditor. The matrix is where reach is derived from; the narrowing is disclosed, not obeyed.',
    SUPERVISOR: 'Allowed with conditions — role-scoped.',
    QUALITY_MANAGER: 'Allowed.',
    READONLY_AUDITOR: 'Read-only.',
    WORKER:
      'Allowed with conditions — own assigned runs only. THE CELL IS A GRANT AND THE HUB IS NOT WHERE IT IS MET: the Worker holds no Hub route at all under D11, so this screen renders the route registry’s refusal and says what it costs. The worker meets their own assigned runs on the Frontline Worker Application.',
  },
  rendering:
    'The board. Horizon fixed at today plus 7 days (L27862), filterable by Job, Site, Area and Worker. The Supervisor’s scope filters the READ, not the render — slice-4 defect 7.',
  effect: 'No write. The Read-only Auditor sees the same rows and no control.',
  sourceRef: 'L27910 · §4.6.2 · catalogue B L48107',
}

const ROW_3: DohControlMatrixRow<RunControlId> = {
  id: 'cancel-a-run',
  control: 'Cancel a run',
  surface: 'screen',
  status: {
    TENANT_ADMIN: 'explicitly-prohibited',
    SUPERVISOR: 'allowed-with-conditions',
    QUALITY_MANAGER: 'allowed-with-conditions',
    READONLY_AUDITOR: 'explicitly-prohibited',
    WORKER: 'explicitly-prohibited',
  },
  detail: {
    TENANT_ADMIN: BARE_PROHIBITION,
    SUPERVISOR:
      'Allowed with conditions — own Area only, categorised reason mandatory. §4.6.5 (L27870): "A Supervisor may cancel runs in their own Area." The Area bound filters the runs the Supervisor can SELECT, not the buttons drawn over a wider list.',
    QUALITY_MANAGER:
      'Allowed with conditions — any run, categorised reason mandatory. §4.6.5 (L27870): "a Quality Manager may cancel any run."',
    READONLY_AUDITOR: BARE_PROHIBITION,
    WORKER: BARE_PROHIBITION,
  },
  rendering:
    'The reason list is a fixed categorised list plus optional free text (L27870); free text alone is refused. Cancellation is terminal only before submission — `DOH_CANCEL_RUN` declares `allowedObjectStates: [scheduled, in_progress]`.',
  effect:
    'Frees assigned workers, preserves partial step data flagged cancelled and out of the Summary, notifies the supervisor and Quality Manager, flags any paired-Job link to the paired Job Owner.',
  sourceRef: 'L27911 · §4.6.5',
}

const ROW_4: DohControlMatrixRow<RunControlId> = {
  id: 'extend-a-run-end-time',
  control: 'Extend a run end time',
  surface: 'screen',
  status: {
    TENANT_ADMIN: 'explicitly-prohibited',
    SUPERVISOR: 'allowed-with-conditions',
    QUALITY_MANAGER: 'explicitly-prohibited',
    READONLY_AUDITOR: 'explicitly-prohibited',
    WORKER: 'explicitly-prohibited',
  },
  detail: {
    TENANT_ADMIN: BARE_PROHIBITION,
    SUPERVISOR:
      'Allowed with conditions — reason required, capped at shift end plus the tenant maximum. One of exactly two in-flight modifications (L27872).',
    QUALITY_MANAGER: BARE_PROHIBITION,
    READONLY_AUDITOR: BARE_PROHIBITION,
    WORKER: BARE_PROHIBITION,
  },
  rendering:
    'The cap is READ here and SET on another Hub screen (row 11). There is no `DOH_EXTEND_RUN` command in `@/domain/commands` — wave 0 minted fifteen Hub commands and this act is not one of them, so the control renders its rule and its bound and dispatches nothing. Recorded rather than papered over.',
  effect: 'Extends the run end time, audited, within the tenant-configured cap.',
  sourceRef: 'L27912 · §4.6.6 · §2.4 Part IX',
}

const ROW_5: DohControlMatrixRow<RunControlId> = {
  id: 'substitute-a-worker-mid-run',
  control: 'Substitute a worker mid-run',
  surface: 'screen',
  status: {
    TENANT_ADMIN: 'explicitly-prohibited',
    SUPERVISOR: 'allowed-with-conditions',
    QUALITY_MANAGER: 'explicitly-prohibited',
    READONLY_AUDITOR: 'explicitly-prohibited',
    WORKER: 'explicitly-prohibited',
  },
  detail: {
    TENANT_ADMIN: BARE_PROHIBITION,
    SUPERVISOR:
      'Allowed with conditions — reason capture mandatory. The second of the exactly two in-flight modifications (L27872).',
    QUALITY_MANAGER: BARE_PROHIBITION,
    READONLY_AUDITOR: BARE_PROHIBITION,
    WORKER: BARE_PROHIBITION,
  },
  rendering:
    'Substitution is MOD-DOH-07’s screen — SCR-DOH-15, "Assignment and substitution", L48109, entered from the run detail. Still a Hub screen, so the row classifies `screen` and this module points at the sibling route rather than drawing a second substitution control for one record.',
  effect: 'Supersedes the assignment; pre-substitution steps stay attributed to the original worker.',
  sourceRef: 'L27913 · §4.6.7 · SCR-DOH-15 L48109',
}

const ROW_6: DohControlMatrixRow<RunControlId> = {
  id: 'add-or-remove-a-worker-beyond-substitution',
  control: 'Add or remove a worker beyond substitution',
  surface: 'screen',
  status: {
    TENANT_ADMIN: 'explicitly-prohibited',
    SUPERVISOR: 'explicitly-prohibited',
    QUALITY_MANAGER: 'explicitly-prohibited',
    READONLY_AUDITOR: 'explicitly-prohibited',
    WORKER: 'explicitly-prohibited',
  },
  detail: {
    TENANT_ADMIN: OUT_OF_V1,
    SUPERVISOR: OUT_OF_V1,
    QUALITY_MANAGER: OUT_OF_V1,
    READONLY_AUDITOR: BARE_PROHIBITION,
    WORKER: BARE_PROHIBITION,
  },
  rendering:
    'An explanatory line where the control would sit, and NO control — not a disabled one, and not an empty region. See DEFERRAL_RENDERING below for why the three sources on this question do not in fact disagree.',
  effect: 'None. Nothing is written and nothing is queued.',
  sourceRef: 'L27914 · §4.6.6 · deferral-rendering contradiction L25935 against L25924',
}

const ROW_7: DohControlMatrixRow<RunControlId> = {
  id: 'change-planned-quantity-in-flight',
  control: 'Change planned quantity in flight',
  surface: 'screen',
  status: {
    TENANT_ADMIN: 'explicitly-prohibited',
    SUPERVISOR: 'explicitly-prohibited',
    QUALITY_MANAGER: 'explicitly-prohibited',
    READONLY_AUDITOR: 'explicitly-prohibited',
    WORKER: 'explicitly-prohibited',
  },
  detail: {
    TENANT_ADMIN: OUT_OF_V1,
    SUPERVISOR: OUT_OF_V1,
    QUALITY_MANAGER: OUT_OF_V1,
    READONLY_AUDITOR: BARE_PROHIBITION,
    WORKER: BARE_PROHIBITION,
  },
  rendering:
    'As row 6: an explanatory line where the control would sit, and no control. The two rows ARE the same case, checked rather than assumed — both cells qualify the token with "out of V1" and §4.6.6 (L27872) names both in one sentence as edits that "are out of V1".',
  effect: 'None.',
  sourceRef: 'L27915 · §4.6.6',
}

/**
 * ROW 8 — THE TRAP, AND WHY IT IS `screen` RATHER THAN `another-surface`.
 *
 * Two different capabilities sit in one row. The oversight act — pause or
 * stop a run from a supervision screen — exists on NO surface: the Tenant
 * Admin cell says so in the source's own words, "deliberately impossible from
 * any oversight surface", and L49583 restates it from the other side, the
 * Client Command Center column reading "`Explicitly prohibited` — creating or
 * stopping runs is deliberately impossible here". `@/surfaces/doh/modules` is
 * explicit that "a capability that exists NOWHERE is a `screen` row whose
 * every cell refuses", so this is a `screen` row.
 *
 * The Worker cell names a different act — ending a run on the device — which
 * IS met, on SURF-FL, and IS boundary-register row 8,
 * `step-execution-and-capture` (L25726). That is rendered as a
 * `CrossSurfaceStatement` beside the row, NOT as a `boundary` pointer on the
 * row: the pointer field means "this row's capability is met there", and this
 * row's capability is met nowhere. `inlineControlsOnAdjacentCapabilities`
 * fails a `screen` row that carries one, which is the correct answer.
 */
const ROW_8: DohControlMatrixRow<RunControlId> = {
  id: 'pause-or-stop-a-run',
  control: 'Pause or stop a run',
  surface: 'screen',
  status: {
    TENANT_ADMIN: 'explicitly-prohibited',
    SUPERVISOR: 'explicitly-prohibited',
    QUALITY_MANAGER: 'explicitly-prohibited',
    READONLY_AUDITOR: 'explicitly-prohibited',
    WORKER: 'not-applicable',
  },
  detail: {
    TENANT_ADMIN:
      'Explicitly prohibited — deliberately impossible from any oversight surface.',
    SUPERVISOR: BARE_PROHIBITION,
    QUALITY_MANAGER: BARE_PROHIBITION,
    READONLY_AUDITOR: BARE_PROHIBITION,
    WORKER:
      'Not applicable — the worker ends a run by completing or abandoning it on the device.',
  },
  rendering:
    'No control, for anyone, in any state. The qualifier "deliberately impossible from any oversight surface" is written into ONE cell — the Tenant Admin’s — and the other three oversight cells carry the bare token; the row is rendered with the qualifier stated once and attributed to the cell it is in, rather than pasted across four cells the source left bare.',
  effect: 'None, and none is reachable. §4.6.4 (L27868): a run started and abandoned is "treated as cancelled, never complete".',
  sourceRef: 'L27916 · restated from the Command Center side at L49583 · boundary register row 8, L25726',
}

/**
 * ROW 9 — THE DEC-STUCK-001 TRAP.
 *
 * The Supervisor cell reads "the run is `complete` at close time and finishes
 * on the same clock". DEC-STUCK-001 Reading A, at L5255, reads "A manually
 * closed stuck run is complete at close time and finishes on the same clock."
 * The cell is Reading A with the subject changed. Reading B, at L5256, has the
 * run "stand submitted with the gap recorded".
 *
 * So the condition is NOT transcribed into a rule. What is transcribed is the
 * cell, verbatim, labelled as one reading; and `manualCloseAssertion` below
 * carries the part AC-RUN-004 permits.
 */
const ROW_9: DohControlMatrixRow<RunControlId> = {
  id: 'close-a-stuck-run-manually',
  control: 'Close a stuck run manually',
  surface: 'screen',
  status: {
    TENANT_ADMIN: 'explicitly-prohibited',
    SUPERVISOR: 'allowed-with-conditions',
    QUALITY_MANAGER: 'allowed-with-conditions',
    READONLY_AUDITOR: 'explicitly-prohibited',
    WORKER: 'explicitly-prohibited',
  },
  detail: {
    TENANT_ADMIN: BARE_PROHIBITION,
    SUPERVISOR:
      'Allowed with conditions — the run is `complete` at close time and finishes on the same clock. THE CONDITION IS ONE READING OF AN OPEN DECISION: it is DEC-STUCK-001 Reading A (L5255) restated, against Reading B (L5256) under which the run stands `submitted` with the gap recorded. AC-RUN-004 (L7128) refuses both. This build asserts only the finish-clock half.',
    QUALITY_MANAGER:
      'Allowed with conditions — same condition, and therefore the same open decision.',
    READONLY_AUDITOR: BARE_PROHIBITION,
    WORKER: BARE_PROHIBITION,
  },
  rendering:
    'The control renders for the Supervisor and the Quality Manager, states the clock consequence, and states NO resulting state: the two readings put the run in different states and produce different Quality Manager review queues on Monday morning (L5257). There is no `DOH_CLOSE_STUCK_RUN` command in `@/domain/commands`; there is deliberately none, because a command would have to name the state it writes.',
  effect:
    'The finish clock runs from close time. Whether the Execution Summary computes now (Reading A) or when the window elapses (Reading B) is the open decision.',
  sourceRef: 'L27917 · DEC-STUCK-001 L5253-L5261 · AC-RUN-004 L7128',
}

const ROW_10: DohControlMatrixRow<RunControlId> = {
  id: 'set-the-record-finish-window',
  control: 'Set the record-finish window',
  surface: 'screen',
  status: {
    TENANT_ADMIN: 'allowed-with-conditions',
    SUPERVISOR: 'explicitly-prohibited',
    QUALITY_MANAGER: 'explicitly-prohibited',
    READONLY_AUDITOR: 'explicitly-prohibited',
    WORKER: 'explicitly-prohibited',
  },
  detail: {
    TENANT_ADMIN: `Allowed with conditions — within the platform floor and ceiling, in the tenant administration area. ${IN_THE_TENANT_ADMINISTRATION_AREA} The floor and ceiling are themselves DEC-FINISH-001 and are disclosed on this screen.`,
    SUPERVISOR: BARE_PROHIBITION,
    QUALITY_MANAGER: BARE_PROHIBITION,
    READONLY_AUDITOR: BARE_PROHIBITION,
    WORKER: BARE_PROHIBITION,
  },
  rendering:
    'A named pointer to SCR-DOH-23 and no field. The brief quotes this cell as "Allowed with conditions — in the tenant administration area"; the cell actually reads "within the platform floor and ceiling, in the tenant administration area", and the floor-and-ceiling half is the one that carries the open decision.',
  effect: 'None here. The value is enforced here through `finishWindowVerdict` and set there.',
  sourceRef: 'L27918 · SCR-DOH-23 L48117 · DEC-FINISH-001 L27882',
}

const ROW_11: DohControlMatrixRow<RunControlId> = {
  id: 'set-the-run-extension-cap',
  control: 'Set the run-extension cap',
  surface: 'screen',
  status: {
    TENANT_ADMIN: 'allowed-with-conditions',
    SUPERVISOR: 'explicitly-prohibited',
    QUALITY_MANAGER: 'explicitly-prohibited',
    READONLY_AUDITOR: 'explicitly-prohibited',
    WORKER: 'explicitly-prohibited',
  },
  detail: {
    TENANT_ADMIN: `Allowed with conditions — in the tenant administration area. ${IN_THE_TENANT_ADMINISTRATION_AREA}`,
    SUPERVISOR: BARE_PROHIBITION,
    QUALITY_MANAGER: BARE_PROHIBITION,
    READONLY_AUDITOR: BARE_PROHIBITION,
    WORKER: BARE_PROHIBITION,
  },
  rendering: 'A named pointer to SCR-DOH-23 and no field. Row 4 READS this cap; nothing here sets it.',
  effect: 'None here.',
  sourceRef: 'L27919 · SCR-DOH-23 L48117',
}

const ROW_12: DohControlMatrixRow<RunControlId> = {
  id: 'force-a-run-to-finished-early',
  control: 'Force a run to `finished` early',
  surface: 'screen',
  status: {
    TENANT_ADMIN: 'explicitly-prohibited',
    SUPERVISOR: 'explicitly-prohibited',
    QUALITY_MANAGER: 'explicitly-prohibited',
    READONLY_AUDITOR: 'explicitly-prohibited',
    WORKER: 'explicitly-prohibited',
  },
  detail: {
    TENANT_ADMIN: BARE_PROHIBITION,
    SUPERVISOR: BARE_PROHIBITION,
    QUALITY_MANAGER: BARE_PROHIBITION,
    READONLY_AUDITOR: BARE_PROHIBITION,
    WORKER: BARE_PROHIBITION,
  },
  rendering:
    'Refused in all five columns, so `finished` has exactly one path into it: the run auto-close scheduler, which AC-RUN-002 (L7126) makes the only one. This row is why the auto-close owner question below matters — it refuses every TENANT role and says nothing about who owns the scheduler.',
  effect: 'None. There is no command for it and no role that could dispatch one.',
  sourceRef: 'L27920 · AC-RUN-002 L7126',
}

export const MOD_DOH_06_MATRIX = [
  ROW_1,
  ROW_2,
  ROW_3,
  ROW_4,
  ROW_5,
  ROW_6,
  ROW_7,
  ROW_8,
  ROW_9,
  ROW_10,
  ROW_11,
  ROW_12,
] as const satisfies readonly DohControlMatrixRow<RunControlId>[]

type MissingRow = Exclude<RunControlId, (typeof MOD_DOH_06_MATRIX)[number]['id']>
const _rowsExhaustive: MissingRow extends never ? true : never = true
void _rowsExhaustive

/** Registry order, read from the role registry rather than typed a second time. */
export const TENANT_ROLE_ORDER: readonly TenantRoleId[] = rolesInDomain('TENANT').map(
  (r) => r.id as TenantRoleId,
)

/**
 * WHO REACHES THIS MODULE, derived by the one implementation of the rule and
 * never hand-written — the brief's standing instruction, and the reason
 * catalogue B's narrower cell for SCR-DOH-13 (L48107, three roles) is
 * disclosed rather than obeyed.
 *
 * It returns ALL FIVE, the Worker included, because L27910 gives the Worker
 * `Allowed with conditions` and no row in the matrix marks any role
 * `Unavailable`. That is not a defect and it is not this rule's business to
 * fix: whether a persona reaches SURF-DOH at all is D11, answered by the
 * route registry in `app/hub/HubShell.tsx`, and MOD-DOH-03 already has this
 * exact shape. The Worker reaches this module BY MATRIX and lands on no Hub
 * route, and the screen says so and says what it costs.
 */
export const MOD_DOH_06_ROLES_REACHING: readonly TenantRoleId[] = rolesReachingByMatrix(
  MOD_DOH_06_MATRIX,
  (row, role) => cellStatus(row, role),
)

/** The rows a given role holds something on — what the screen offers it. */
export function rolesWithStatus(
  id: RunControlId,
  statuses: readonly ControlStatus[],
): readonly RoleId[] {
  const row = matrixRow(id)
  return TENANT_ROLE_ORDER.filter((role) => statuses.includes(row.status[role]))
}

export function matrixRow(id: RunControlId): DohControlMatrixRow<RunControlId> {
  const found = MOD_DOH_06_MATRIX.find((r) => r.id === id)
  if (!found) throw new Error(`Unknown MOD-DOH-06 control: ${id}`)
  return found
}

/** The statuses that let a persona read a control's region. */
export const READING_STATUSES = [
  'allowed',
  'allowed-with-conditions',
  'read-only',
] as const satisfies readonly ControlStatus[]

/** The statuses that let a persona ACT. `read-only` is not one of them. */
export const ACTING_STATUSES = [
  'allowed',
  'allowed-with-conditions',
] as const satisfies readonly ControlStatus[]

/* ==================================================================== *
 * THE CLOSING-STATE TABLE — L27876-L27880, THREE DATA ROWS, VERBATIM
 * ==================================================================== */

export interface ClosingStateRow {
  readonly state: 'submitted' | 'complete' | 'finished'
  /** Column 2, verbatim from the frozen source. */
  readonly meaning: string
  readonly sourceRef: string
  /**
   * Whether this row's meaning is one reading of DEC-RUNSTATE-001 or is
   * agreed across all three Parts. `finished` is agreed — L27874 calls the
   * three-state closing sequence "settled" and DEC-RUNSTATE-001's card
   * disputes only `submitted` and `complete`.
   */
  readonly disputed: boolean
}

/**
 * THE TABLE STATES ONE READING AS IF SETTLED, AND IT IS TRANSCRIBED ANYWAY.
 *
 * Every meaning below is DEC-RUNSTATE-001 Reading B (§4.6.8, L5245): the same
 * words appear in the decision card as reading B and in this table as the
 * definition. Deleting the table would hide what the source says; copying it
 * without the flag would settle the decision. Both rows carry `disputed`.
 */
export const CLOSING_STATE_TABLE = [
  {
    state: 'submitted',
    meaning:
      'Execution has ended and the run’s captures are lodged; device sync may still be landing residual data.',
    sourceRef: 'L27878',
    disputed: true,
  },
  {
    state: 'complete',
    meaning:
      'The Execution Summary is computed and the run enters its finish window — a tenant-configurable period, default 48 hours, bounded by a platform floor of 24 hours and a ceiling of 7 days. Within the window, late-arriving data is accepted and the Summary recomputes; Quality Manager review proceeds here.',
    sourceRef: 'L27879',
    disputed: true,
  },
  {
    state: 'finished',
    meaning:
      'The finish window has elapsed and the platform’s run auto-close scheduler closes the record automatically. After this point, changes are exceptional and follow the audited-recompute rule.',
    sourceRef: 'L27880',
    disputed: false,
  },
] as const satisfies readonly ClosingStateRow[]

/* ==================================================================== *
 * THE THREE OPEN DECISIONS
 * ==================================================================== */

/**
 * The record shape, matched field for field to `DEC_FINISH_001` in
 * `@/surfaces/doh/transitions` so that record passes straight through this
 * module's renderer with no adapter and no second copy of its wording.
 *
 * TWO FIELDS ON A READING, and deliberately no third: no `preferred`, no
 * `settled`, no `isCanonical`. That is `@/disclosure/decisions`' rule and the
 * reason for it is exactly this module — a field like that is how a
 * disclosure quietly becomes an assertion.
 */
export interface RunDecisionReading {
  readonly text: string
  readonly locator: string
}

export interface RunDecision {
  readonly id: string
  readonly question: string
  readonly readings: readonly RunDecisionReading[]
  /** What this build does. Never presented as the source's ruling. */
  readonly buildPosition: string
  /** The sentence the screen must render. */
  readonly onScreen: string
}

/**
 * DEC-RUNSTATE-001 — card L5242-L5251. Three readings, three Parts.
 *
 * The stake, in the card's own words at L5247: "A board, a report, and a
 * meter that each pick a different reading will disagree about the same run
 * at the same moment, and the disagreement will look like a defect rather
 * than an ambiguity." Every board, report and meter in slices 7 through 13
 * keys off these two words.
 */
export const DEC_RUNSTATE_001: RunDecision = {
  id: 'DEC-RUNSTATE-001',
  question: 'What `submitted` and `complete` mean. Three Parts define them differently.',
  readings: [
    {
      text: 'Reading A — "Submitted — a worker has handed in their part of the work (device event, per worker). Complete — the server holds everything from everyone assigned." `submitted` is a PER-WORKER device event, so a three-worker run passes through it three times.',
      locator: 'DEC-RUNSTATE-001 Reading A (§2.4) · L5244',
    },
    {
      text: 'Reading B — submitted means "Execution has ended and the run’s captures are lodged"; complete means "The Execution Summary is computed and the run enters its finish window." Run-level, reached once, and `complete` is tied to SUMMARY COMPUTATION.',
      locator: 'DEC-RUNSTATE-001 Reading B (§4.6.8) · L5245',
    },
    {
      text: 'Reading C — submitted means "every assignment on the run is finished as known to the server"; complete means "every assigned device has synced; no capture remains pending on any device." Run-level, reached once, and `complete` is tied to DEVICE SYNCHRONISATION.',
      locator: 'DEC-RUNSTATE-001 Reading C (§6.2.6) · L5246',
    },
  ],
  buildPosition:
    'No reading is adopted and nothing on this screen is keyed on either word. The board branches on INSTANTS — the same choice `@/surfaces/doh/transitions` made — so a run between "execution ended" and "the window elapsed" renders what each of the three readings would call it, side by side, rather than one word. This module’s own closing-state table at L27876-L27880 states Reading B as if it were settled; the table is transcribed verbatim and flagged, because deleting it would hide the source and copying it plainly would settle the decision.',
  onScreen:
    'This run is between the end of execution and the close of its finish window. The source defines `submitted` and `complete` three different ways in three different Parts, and has not chosen. All three answers are shown; none of them is the platform’s answer yet.',
}

/**
 * DEC-STUCK-001 — card L5253-L5261. Row 9's condition cell IS Reading A.
 */
export const DEC_STUCK_001: RunDecision = {
  id: 'DEC-STUCK-001',
  question: 'The state a manually closed stuck run stands in.',
  readings: [
    {
      text: 'Reading A — "A manually closed stuck run is complete at close time and finishes on the same clock." Its Execution Summary is computed and the Quality Manager review queue receives it immediately.',
      locator: 'DEC-STUCK-001 Reading A (§2.4) · L5255',
    },
    {
      text: 'Reading B — "a Supervisor can close a stuck run … the run then stands submitted with the gap recorded, and the finish window still guarantees it finishes even if the device never returns." The Summary is not yet computed and the review queue does not receive it.',
      locator: 'DEC-STUCK-001 Reading B (§6.2.6) · L5256',
    },
  ],
  buildPosition:
    'Neither reading is adopted, and the module’s own matrix cell is not treated as the answer: MOD-DOH-06 row 9 (L27917) states Reading A’s condition almost word for word, and copying it into a rule would settle the decision silently. AC-RUN-004 (L7128) refuses both readings in as many words. The ONLY thing this build asserts is the half both readings share — the finish-window clock runs from close time.',
  onScreen:
    'A manually closed stuck run finishes on the same clock, which both readings of the source agree on. What state it stands in until then is unanswered: under one reading its Execution Summary is computed and the review queue receives it immediately, under the other it is not. A lost device on a Friday afternoon therefore produces a different Monday-morning queue depending on which answer is given.',
}

/**
 * AC-RUN-004's own words at L7128 — "The finish-window clock behaviour is
 * common to both readings and is what this criterion asserts." This is the
 * whole of what this module may claim about a manual close, and it is
 * asserted here rather than restated in prose on the screen.
 */
export const manualCloseAssertion = {
  asserted: 'The finish-window clock runs from close time.',
  notAsserted: 'The state the run stands in at close time.',
  sourceRef: 'AC-RUN-004 · L7128',
} as const

/**
 * DEC-FINISH-001 — READ FROM WAVE 0, NEVER RE-DECLARED.
 *
 * `@/surfaces/doh/transitions` built the enforcement (`finishWindowVerdict`
 * against a 24-hour floor and a 7-day ceiling) and carried both readings with
 * the sentence a screen must render, and then said outright: "This task owns
 * no screen; MOD-DOH-06 (task 7) mounts it." A disclosure that exists and
 * renders nowhere is the false-comfort case — the record says it was
 * disclosed and the client never saw it. This is the mount.
 */
export const DEC_FINISH_001_MOUNTED: RunDecision = DEC_FINISH_001

export const RUN_DECISIONS = [
  DEC_RUNSTATE_001,
  DEC_STUCK_001,
  DEC_FINISH_001_MOUNTED,
] as const satisfies readonly RunDecision[]

/* ==================================================================== *
 * THE BOARD, KEYED ON INSTANTS
 * ==================================================================== */

/**
 * The four positions no reading disputes. DEC-RUNSTATE-001's card disputes
 * `submitted` and `complete` and nothing else; L27874 calls the closing
 * sequence itself settled and fixes the final word as `finished`.
 */
export type UndisputedRunPosition = 'scheduled' | 'in_progress' | 'cancelled' | 'finished'

export type ClosingPosition =
  | { readonly kind: 'undisputed'; readonly position: UndisputedRunPosition }
  /** Execution has ended and the window has not closed. Three answers, no winner. */
  | { readonly kind: 'disputed' }

/**
 * A run's position, DERIVED FROM INSTANTS AND FROM NOTHING ELSE.
 *
 * Read the order carefully — it is the whole of the no-settlement guarantee.
 * Every branch tests a TIMESTAMP, and the one span where the source's three
 * Parts disagree returns `disputed` rather than a word. There is nowhere in
 * this function to put `submitted` or `complete`, which is what stops a later
 * consumer growing one.
 *
 * `finished` is read from the evaluator, not recomputed: a run whose window
 * has elapsed is finished whether or not a sweep has committed the record
 * yet, and asking `dueTransitions` is how the board and the audit trail stay
 * on the same millisecond (its `atMs` is the instant the timer fell DUE, not
 * the instant anything was called).
 */
export function closingPosition(facts: RunTimingFacts, clock: Clock): ClosingPosition {
  if (facts.cancelledAtMs !== null) return { kind: 'undisputed', position: 'cancelled' }
  if (facts.finishedAtMs !== null) return { kind: 'undisputed', position: 'finished' }
  if (dueTransitions(facts, clock).some((t) => t.id === 'run-auto-close')) {
    return { kind: 'undisputed', position: 'finished' }
  }
  if (dueTransitions(facts, clock).some((t) => t.id === 'auto-cancel')) {
    return { kind: 'undisputed', position: 'cancelled' }
  }
  if (facts.completeAtMs !== null) return { kind: 'disputed' }
  if (facts.startedAtMs !== null) return { kind: 'undisputed', position: 'in_progress' }
  return { kind: 'undisputed', position: 'scheduled' }
}

/**
 * One worker's handoff instant.
 *
 * DELIBERATELY NOT A FIELD ON `RunTimingFacts`. Wave 0's shape carries no
 * per-worker instant, and that absence is load-bearing: Reading A needs one
 * and Readings B and C do not, so putting it in the shared shape would tilt
 * the decision. It lives on the BOARD ROW instead — a rendering input, which
 * is what it is — so Reading A can be shown without being shipped.
 */
export interface WorkerHandoff {
  readonly workerId: string
  readonly name: string
  readonly handedOffAtMs: number | null
}

export interface RunBoardRow {
  readonly facts: RunTimingFacts
  readonly jobName: string
  readonly areaId: string
  readonly areaName: string
  readonly shiftName: string
  readonly plannedQuantity: number
  /** WF-AUT-010: the package pinned at assignment, immutable for the run's life. */
  readonly packagePin: string
  /** L53675: a pin with no package on the device is assigned-not-ready and cannot start. */
  readonly packageOnDevice: boolean
  readonly workerHandoffs: readonly WorkerHandoff[]
  /** Reading C's test: "every assigned device has synced". */
  readonly devicesSynced: number
  /** Reading B's test: "the Execution Summary is computed". */
  readonly summaryComputedAtMs: number | null
  /** Whether this run was closed by a person rather than by execution ending. */
  readonly manuallyClosedAtMs: number | null
}

export interface RunStateReadingAnswer {
  readonly reading: 'A' | 'B' | 'C'
  readonly locator: string
  /** What this reading calls the run right now. */
  readonly answer: string
  /** How many times this reading has the run pass through `submitted`. */
  readonly submittedReachedTimes: number
}

/**
 * WHAT EACH READING WOULD CALL THIS RUN. Three answers, in card order, and
 * the function has no way to return a winner.
 *
 * `submittedReachedTimes` is the concrete consequence the card names at
 * L5247 and the brief restates: Reading A makes `submitted` reachable once
 * per assigned worker — three times on a three-worker run — while B and C
 * make it run-level and reached once.
 */
export function runStateReadings(row: RunBoardRow): readonly RunStateReadingAnswer[] {
  const handedOff = row.workerHandoffs.filter((w) => w.handedOffAtMs !== null).length
  const workers = row.workerHandoffs.length
  const allHandedOff = workers > 0 && handedOff === workers
  const allSynced = row.devicesSynced >= workers && workers > 0
  const summaryComputed = row.summaryComputedAtMs !== null

  return [
    {
      reading: 'A',
      locator: 'DEC-RUNSTATE-001 Reading A (§2.4) · L5244',
      answer: allHandedOff
        ? `\`submitted\` ${workers} times — every one of the ${workers} assigned workers has handed in their part. \`complete\` ${
            allSynced ? 'holds: the server holds everything from everyone assigned.' : 'does not hold yet: the server does not hold everything from everyone assigned.'
          }`
        : `\`submitted\` ${handedOff} of ${workers} times so far — it is a per-worker device event and ${
            workers - handedOff
          } worker(s) have not handed in.`,
      submittedReachedTimes: workers,
    },
    {
      reading: 'B',
      locator: 'DEC-RUNSTATE-001 Reading B (§4.6.8) · L5245',
      answer: summaryComputed
        ? '`complete` — the Execution Summary is computed and the run has entered its finish window.'
        : '`submitted` — execution has ended and the captures are lodged; the Summary is not computed, so `complete` has not been reached.',
      submittedReachedTimes: 1,
    },
    {
      reading: 'C',
      locator: 'DEC-RUNSTATE-001 Reading C (§6.2.6) · L5246',
      answer: allSynced
        ? '`complete` — every assigned device has synced and no capture remains pending.'
        : `\`submitted\` — every assignment is finished as known to the server, but ${
            workers - row.devicesSynced
          } device(s) have not synced, so \`complete\` has not been reached.`,
      submittedReachedTimes: 1,
    },
  ]
}

/**
 * A MANUALLY CLOSED RUN'S STATE IS DEC-STUCK-001'S, NOT THIS BUILD'S TO
 * COMPUTE — so such a row is never handed to `runStateReadings` at all.
 *
 * The guard is here rather than in the screen because the screen is not the
 * only consumer: task 13's operational journey and three later slices compose
 * this module, and a helper that returned a state for a manually closed run
 * would hand each of them Reading A by accident.
 */
export function stateIsGovernedByDecStuck(row: RunBoardRow): boolean {
  return row.manuallyClosedAtMs !== null
}

/**
 * Whether this run is inside the span where the source's three Parts disagree
 * about what to call it — between the first worker handing in their part and
 * the window closing.
 *
 * Both halves are needed. `closingPosition` sees only wave 0's timing facts,
 * which carry no per-worker instant (deliberately — see `WorkerHandoff`), so
 * a three-worker run mid-handoff still reads `in_progress` there while
 * Reading A already has it `submitted` twice. That run is exactly the case
 * DEC-RUNSTATE-001 exists for, and a check that missed it would disclose the
 * decision everywhere except where it bites.
 */
export function inTheContestedSpan(row: RunBoardRow, clock: Clock): boolean {
  const pos = closingPosition(row.facts, clock)
  if (pos.kind === 'disputed') return true
  if (pos.position === 'cancelled' || pos.position === 'finished') return false
  return row.workerHandoffs.some((w) => w.handedOffAtMs !== null)
}

/**
 * Whether the three readings disagree about THIS run at THIS instant. When
 * they agree there is nothing to disclose and the screen says the word; when
 * they disagree the screen says all three and none.
 */
export function readingsDisagree(row: RunBoardRow): boolean {
  const answers = runStateReadings(row)
  const words = answers.map((a) => (a.answer.includes('`complete`') ? 'complete' : 'submitted'))
  const times = answers.map((a) => a.submittedReachedTimes)
  return new Set(words).size > 1 || new Set(times).size > 1
}

/* ==================================================================== *
 * WF-AUT-010 — THE PIN, AND ITS ONE OPEN QUESTION
 * ==================================================================== */

/**
 * L53668-L53698. Surface: Delivery Operations Hub, module MOD-DOH-06 — the
 * pin is a HUB act at run assignment. Slice 5 built the publication half in
 * the Studio and never fires a build; this is where the other half lands.
 *
 * `DEC-LIB-001` is cited at L53676 and renders on the run detail pin panel,
 * which the plan names as "the only screen where both facts are visible at
 * once". It is in the shared canon at `@/disclosure/decisions`, so it renders
 * through `DecisionDisclosure` with the identical wording and the identical
 * locator set the Studio screen renders — not a second wording of it.
 */
export const WF_AUT_010 = {
  id: 'WF-AUT-010',
  title: 'Pinning a version to a run',
  surface: 'Delivery Operations Hub',
  moduleId: 'MOD-DOH-06',
  whenItHappens:
    'At assignment. "The Supervisor assigns a worker to a run … the package identifier is written to the run record as its pin."',
  acceptance: [
    'AC-WF-AUT-010-01 — A pin is immutable for the life of the run.',
    'AC-WF-AUT-010-02 — A run cannot start without its pinned package on the device.',
    'AC-WF-AUT-010-03 — Rebase is offered only before start.',
    'AC-WF-AUT-010-04 — The pin is visible on every surface that shows the run.',
  ],
  deniedPath:
    'Re-pinning a run in flight is refused. Rebase is offered only for scheduled-not-started runs. Nothing on the Client Command Center can change a pin.',
  notReady:
    'A pin written with the package download failed leaves the run assigned-not-ready: it cannot start, because "a run with a pin but no package must never begin".',
  sourceRef: 'L53668-L53698 · L53673 · L53675 · L53678 · L53682',
} as const

/* ==================================================================== *
 * WHAT THE SOURCE DOES NOT SAY, AND WHERE IT CONTRADICTS ITSELF
 * ==================================================================== */

/**
 * HOW A DEFERRED CAPABILITY RENDERS, AND A CORRECTION TO WHAT THIS TASK WAS
 * TOLD.
 *
 * The brief for this module said three sources disagree, and named
 * `AC-DOH-014-2` as the one that PERMITS a disabled control carrying an
 * explanatory line. Read at its own line, it does not:
 *
 *   L25935 — "No deferred capability renders as a disabled control without an
 *   explanatory line stating that it is not available in this release."
 *
 * "No X without Y" forbids X-without-Y. It does not license X-with-Y — that
 * is the converse, and the sentence never makes it. So the criterion
 * CONSTRAINS disabled controls; it does not authorise one. Nothing in the
 * three sources actually asks for a disabled control, and the "three
 * positions" framing was an artefact of that misreading.
 *
 * What the sources say, each at its own line:
 *
 * - `SB-DOH-005` (L25924) — "the Hub renders an explanatory line rather than
 *   a disabled control or an empty region." Positive, and adopted.
 * - `AC-DOH-014-2` (L25935) — the constraint above. Compatible with adopting
 *   SB-DOH-005, and vacuously satisfied by rendering no disabled control at
 *   all.
 * - `AC-DOH-07-5` (L28230), the sibling module's own criterion, which settles
 *   the same question in the same direction: the absence "is stated on the
 *   assignment screen rather than implied".
 * - The inherited slice-4/5 rule: `Not applicable` maps to ABSENT with the
 *   reason in help text.
 *
 * THE ENFORCEMENT IS INEXPRESSIBILITY, NOT VIGILANCE. There is no `disabled`
 * anywhere in this module's rendering vocabulary and no prop through which a
 * matrix row could acquire one — `WriteAffordance` returns either a live
 * control or a stated refusal, and has no third branch. This is scoped to the
 * MATRIX axis: a control disabled because the tenant is suspended is a
 * different mechanism and is untouched.
 */
export const DEFERRAL_RENDERING = {
  adopted:
    'No control, and an explanatory line where the control would sit. Never a disabled control, and never an empty region.',
  adoptedFrom: 'SB-DOH-005 · L25924',
  alsoSettledBy: 'AC-DOH-07-5 · L28230',
  constraint:
    'AC-DOH-014-2 (L25935) forbids a deferred capability rendering as a disabled control WITHOUT an explanatory line. It constrains disabled controls; it does not license one, and reading it as permission is the converse the sentence never states.',
  correctionToTheBrief:
    'This task was briefed that AC-DOH-014-2 permits a disabled control with a line, and that the three sources therefore disagree three ways. Measured at L25935, it does not, and they do not.',
} as const

export interface SourceSilence {
  readonly topic: string
  readonly whatIsMissing: string
  readonly sourceRef: string
}

export const UNSPECIFIED_IN_SOURCE = [
  {
    topic: 'The bare `Explicitly prohibited` cells',
    whatIsMissing:
      'Thirty-eight of the sixty cells carry the token with no qualifying clause. The screen renders the token and states the silence rather than inventing a cause — a blank cell is "an unanswered question that an implementer will answer privately and inconsistently" (L10238).',
    sourceRef: 'L27909-L27920',
  },
  {
    topic: 'The pause/stop qualifier',
    whatIsMissing:
      'Row 8 attaches "deliberately impossible from any oversight surface" to the Tenant Admin cell alone. The Supervisor, Quality Manager and Read-only Auditor cells carry the bare token, and the source nowhere restates the qualifier for them. It is rendered once, attributed to the cell that carries it.',
    sourceRef: 'L27916',
  },
  {
    topic: 'No catalogued workflow for run creation, cancellation or a stuck close',
    whatIsMissing:
      'The chapter-28 catalog names WF-AUT-010 for the pin and nothing for creating a run, cancelling one, or closing a stuck one. The gap is recorded; no workflow identifier is minted for it.',
    sourceRef: 'Chapter 28, L52216-L56690, searched by workflow title',
  },
  {
    topic: 'No command for row 4 or row 9',
    whatIsMissing:
      'Wave 0 minted fifteen Hub commands and neither an extend-run nor a close-stuck-run act is among them. For row 9 the absence is load-bearing rather than incidental — a command would have to name the state it writes, and that state is DEC-STUCK-001.',
    sourceRef: '`@/domain/commands` HUB_COMMAND_TYPES',
  },
] as const satisfies readonly SourceSilence[]

export interface RunContradiction {
  readonly id: string
  readonly claim: string
  readonly claimLocators: readonly string[]
  readonly against: string
  readonly againstLocators: readonly string[]
  readonly rendered: string
}

/**
 * CONTRADICTION-AUTOCLOSE-OWNER. The identity card lists "the run auto-close
 * scheduler" as a Hub DEPENDENCY (L27900) and the closing-state table calls
 * it "the platform's run auto-close scheduler" (L27880), while the
 * source-of-truth matrix puts it in the SUPER ADMIN column (L49583).
 *
 * Note what the matrix does NOT say: its "single source of truth" cell for
 * the run record and lifecycle is the Delivery Operations Hub, and the Hub
 * column reads `Allowed`. So the disagreement is narrower than "who owns the
 * run" — it is about who runs the SCHEDULER, and the Hub matrix has already
 * refused "Force a run to `finished` early" to all five tenant roles at
 * L27920, which means no tenant role is on either side of it.
 */
export const CONTRADICTION_AUTOCLOSE_OWNER: RunContradiction = {
  id: 'CONTRADICTION-AUTOCLOSE-OWNER',
  claim:
    'The run auto-close scheduler is a Delivery Operations Hub dependency, and the platform’s own scheduler closes the record.',
  claimLocators: ['L27900 (identity card, Dependencies)', 'L27880 (closing-state table)'],
  against:
    'The source-of-truth matrix row for "Run record and lifecycle" places the scheduler in the Super Admin platform console column: "`Allowed with conditions` — the run auto-close scheduler runs platform-side." The same row names the Delivery Operations Hub as the single source of truth for the record itself and gives the Hub `Allowed`.',
  againstLocators: ['L49583'],
  rendered:
    'Both are shown. No tenant role is on either side of it: L27920 refuses "Force a run to `finished` early" in all five columns, so wherever the scheduler runs, nobody on this screen can stand in for it.',
}

/**
 * CONTRADICTION-AUTOCLOSE-ONLY, raised by wave 0 and rendered here because
 * this screen surfaces the timers.
 *
 * ONE CORRECTION TO WAVE 0'S RECORD, MEASURED. Wave 0's comment and the brief
 * both say the "one automatic transition" claim is marked `SoW Fact` at
 * L27854 and L7078. L7078 is: `[SoW Fact — §2.4, §8.7.1]`. L27854 is NOT —
 * it is the section's untagged "In simple words" paragraph and carries no
 * classification at all. The `SoW Fact`-tagged restatement inside §19.8 is at
 * L27933, step 10 of the happy path: "This is **the one automatic transition
 * on the platform** … `[SoW Fact — §2.4, §4.6.8]`". The contradiction stands
 * exactly as wave 0 stated it; only one of its two locators was wrong, and
 * this module cites the corrected pair.
 */
export const CONTRADICTION_AUTOMATIC_TRANSITION_COUNT_CORRECTED: RunContradiction = {
  id: 'CONTRADICTION-AUTOCLOSE-ONLY',
  claim: 'This is the platform’s one automatic transition.',
  claimLocators: [
    'L27933 (`SoW Fact` — §2.4, §4.6.8)',
    'L7078 (`SoW Fact` — §2.4, §8.7.1)',
    'L27854 (the same claim in plain words, carrying NO classification)',
  ],
  against:
    'L27868 gives a supervisor alert at plus 15 minutes and an auto-cancellation at plus 30 minutes, and no person decides either. The plus-30 auto-cancel is unambiguously a run-state change with no actor, so the count cannot be literally true as written. Restated at L7072.',
  againstLocators: ['L27868', 'L7072'],
  rendered:
    'This screen shows three clock-driven timers and implements what L27868 and L27880 SPECIFY. The count claim is displayed as contradicted rather than implemented — implementing it would mean deleting a cancellation rule the source states twice, or inventing an actor for it.',
}

/**
 * CONTRADICTION-CATALOGUE-REACH for this module's screen. Catalogue B's
 * "Roles that can open it" cell for SCR-DOH-13 names three roles; L27910
 * gives the Tenant Admin `Allowed`. Reach is derived from the matrix.
 */
export const CONTRADICTION_SCR_DOH_13_REACH: RunContradiction = {
  id: 'CONTRADICTION-CATALOGUES',
  claim:
    'Catalogue B, SCR-DOH-13, "Roles that can open it": Supervisor, Quality Manager, Read-only Auditor.',
  claimLocators: ['L48107'],
  against:
    'MOD-DOH-06 row 2, "View the schedule, today plus 7 days", gives the Tenant Admin an unconditional `Allowed`.',
  againstLocators: ['L27910'],
  rendered:
    'Reach is derived from the matrix by `rolesReachingByMatrix`, the one implementation of the rule, and the catalogue cell is quoted beside it. No rail is hand-written.',
}

export const RUN_CONTRADICTIONS = [
  CONTRADICTION_AUTOCLOSE_OWNER,
  CONTRADICTION_AUTOMATIC_TRANSITION_COUNT_CORRECTED,
  CONTRADICTION_SCR_DOH_13_REACH,
] as const satisfies readonly RunContradiction[]

/**
 * MOD-DOH-06 IS IN `DOH_MODULES`, AND THIS RECORDS WHAT IT COST TO GET THERE.
 *
 * `@/surfaces/doh/screens` says of `dohScreenReach`: "the moment a module
 * task adds its fixture and `DOH_MODULES` row, the generator produces its
 * reach and this function starts answering". Wave 0 task 5 landed the
 * catalogue-B screen rows — SCR-DOH-13 and SCR-DOH-14 are both registered —
 * but left every slice-6 module in `DOH_OUT_OF_SLICE_MODULES`, so for a
 * whole wave `DohModuleId` had no `MOD-DOH-06` member, the reach JSON had no
 * entry, and `dohScreenReach('SCR-DOH-13')` answered null while this screen
 * shipped. The registry task closed all seven at once.
 *
 * THE GAP IS KEPT AS A RENDERED DISCLOSURE RATHER THAN DELETED, because the
 * screen printed it while it was true and a reader who saw it deserves to
 * see it resolved rather than to find it silently gone. What it now says is
 * what actually happened.
 */
export const MODULE_REGISTRY_GAP = {
  what: 'MOD-DOH-06 was absent from `DohModuleId`, `DOH_MODULES` and `registries/generated/doh/module-reach.json` for the wave in which this screen was built. It is registered now.',
  consequence:
    'While it was absent the Hub module rail offered no link to /hub/run-scheduling-and-execution-oversight and `dohScreenReach(\'SCR-DOH-13\')` returned null rather than this module’s reach. Both now answer.',
  whyNotFixedHere:
    'The fix was in `src/surfaces/doh/modules.ts` and the reach generator — a shared spine file and a generated file that MOD-DOH-05, MOD-DOH-07 and MOD-DOH-08 needed identically and were editing concurrently, so it belonged to the one task that could make it once for all seven. It has been made, and the value below is now the generated value rather than a preview of it.',
  reachThisModuleWouldGet: MOD_DOH_06_ROLES_REACHING,
} as const

/** Convenience for the screen and the tests: the finish window's end, or null. */
export { finishWindowEndsAtMs }
