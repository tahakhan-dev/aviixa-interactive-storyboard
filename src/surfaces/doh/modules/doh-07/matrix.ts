import {
  BARE_PROHIBITION,
  cellStatus,
  rolesReachingByMatrix,
  type ControlStatus,
  type DohControlMatrixRow,
} from '@/surfaces/doh/modules'
import { rolesInDomain } from '@/domain/roles'
import type { TenantRoleId } from '../../../../../app/hub/HubShell'

/**
 * `MOD-DOH-07` Worker Assignment — the roles-and-permissions matrix of
 * §19.9, and nothing else. Screen `SCR-DOH-15` Assignment and substitution,
 * L48109; the route is keyed on the module slug `worker-assignment`, never
 * on the screen number (D1).
 *
 * EIGHT DATA ROWS, MEASURED. The table header sits at L28117 and its
 * separator at L28118, so the rows are L28119 through L28126 — eight, not
 * the ten the span L28117-L28126 would suggest if it were read as data.
 * Counted off the frozen source, then counted again; the plan's own §1a
 * correction says every span in it starts on the header, and this matrix is
 * one of the fifteen that confirmed it.
 *
 * WHAT THIS FILE DOES NOT DO. It registers no route, adds no row to
 * `DOH_MODULES` and writes nothing into
 * `registries/generated/doh/module-reach.json`. That registration is a
 * single-line edit to `src/surfaces/doh/modules.ts`, which four wave-1
 * module tasks share and none of them may hold; it is recorded as an
 * integration step in this task's report rather than raced for. The
 * consequence is stated rather than hidden: `dohScreenReach('SCR-DOH-15')`
 * answers `null` until that row lands, which is wave 0's own designed
 * meaning of `null` — "there is nothing to derive from yet" — and NOT an
 * empty role set. `MOD_DOH_07_REACH` below derives the real answer from
 * this matrix in the meantime, using the ONE implementation of the rule.
 */

export type AssignmentControlId =
  | 'assign-worker'
  | 'assign-multiple-workers'
  | 'substitute-worker'
  | 'reassign-from-command-center'
  | 'override-qualification-block'
  | 'maintain-per-cell-grant'
  | 'view-assignments'
  | 'check-availability'

/* ==================================================================== *
 * WHAT RENDERS WHERE A CAPABILITY IS NOT MET — the slice-6 ruling.
 * ==================================================================== */

/**
 * TWO KINDS OF `Not applicable`, AND THEY ARE NOT THE SAME PROMISE.
 *
 * The plan's own trap note reads rows 6 and 8 as one case — "no
 * per-worker-per-cell grant table exists and availability and
 * double-booking checks are deferred" — and the out-of-V1 register
 * disagrees with it. That register's twenty rows (L25876-L25895) contain
 * worker self-assignment at row 4 (L25879) and worker availability and
 * double-booking checks at row 5 (L25880). **It contains no row for a
 * per-worker-per-cell grant at all**, and it never could: AC-DOH-07-3
 * (L28228) states that "no per-worker-per-cell grant table exists anywhere
 * in the platform", which is a design fact about the product and not a
 * position on a roadmap.
 *
 * So the two rows render the same SHAPE and carry different SENTENCES.
 * Row 8 says "not in this release"; row 6 says "this does not exist, by
 * design, and is not on the roadmap". Telling a client that cell-level
 * grants are coming in V2 would be an invented roadmap commitment — the
 * out-of-V1 register exists precisely to stop capability expectations being
 * set by accident (L25872), and setting one it does not carry is the same
 * defect pointing the other way.
 */
export type AbsenceKind = 'deferred-beyond-v1' | 'does-not-exist'

export interface AbsenceNote {
  readonly kind: AbsenceKind
  /**
   * WHAT IS ABSENT, which is not always the row's own control name. Row 1's
   * control is "Assign a worker to a run" — very much present, for the
   * Supervisor — and what is absent on it is worker SELF-assignment, in one
   * of its five cells. Naming the row would put a live capability under a
   * heading that says it is missing.
   */
  readonly capability: string
  /**
   * The line that renders where the capability would sit. Never blank, and
   * never a control's label: this is prose the reader sees in place of the
   * thing that is not there.
   */
  readonly line: string
  /**
   * The out-of-V1 register's own row number, or `null`.
   *
   * REQUIRED-AND-NULLABLE, and the invariant is the point:
   * `deferred-beyond-v1` MUST name a register row and `does-not-exist` must
   * NOT. That is what stops the two kinds collapsing back into one, and
   * `tests/unit/doh-assignment.test.ts` holds every note to it.
   */
  readonly registerRow: number | null
  readonly sourceRef: string
}

/**
 * HOW A DEFERRED CAPABILITY RENDERS — the ruling three slice-6 module tasks
 * follow, settled here because §19.1.4 says three different things and this
 * module carries two of the nine cells that depend on the answer.
 *
 * THE THREE READINGS, read rather than relayed:
 *
 * 1. `AC-DOH-014-2` (L25935) — "No deferred capability renders as a
 *    disabled control without an explanatory line stating that it is not
 *    available in this release." This is a CONSTRAINT ON disabled controls,
 *    not a licence for them. Reading it as permission is a contrapositive
 *    inference — "so a disabled control WITH a line is fine" — and the
 *    sentence never says that. It is satisfied, vacuously and completely,
 *    by drawing no disabled control at all.
 * 2. `SB-DOH-005` (L25924) — "the Hub renders an explanatory line rather
 *    than a disabled control or an empty region." POSITIVE, specific, and
 *    the only one of the three that states what to draw. It refuses two
 *    things by name, and the second one matters as much as the first.
 * 3. The inherited slice-4/5 rule — `Not applicable` maps to ABSENT with
 *    the reason in help text. It agrees with (2) on the control and
 *    differs on the PLACEMENT: a reason that lives only in help text can
 *    leave the region blank, which is exactly the "empty region" (2)
 *    refuses.
 *
 * THE RULING: **no control, and a stated line where the capability would
 * sit.** Reading (2), which subsumes reading (3)'s control half and repairs
 * its placement half, and which satisfies reading (1) by never producing
 * the thing (1) constrains.
 *
 * WHAT DECIDED IT was not a preference between three general statements but
 * this module's own acceptance criterion, which is more specific than all
 * three and points one way. `AC-DOH-07-5` (L28230): the absence of the
 * availability check "is stated on the assignment screen rather than
 * implied". A disabled control implies — that is its entire communicative
 * content, "this exists and is refused here". A line states. The same
 * chapter says it again in its own words at L25930, where the terminal safe
 * state is that "the platform says so plainly on the screen where the
 * capability would sit", and again in the delivery workflow at L25903,
 * where each register row's negative test asserts "its absence produces an
 * explanatory message rather than a broken screen".
 *
 * WHAT THIS RULING IS NOT. It is not "this build draws no disabled
 * controls". A disabled control is the right rendering on the TENANT-STATE
 * axis, where a capability the role genuinely holds is transiently closed
 * by a suspension and the reason can stop being true — every slice-4 module
 * draws them and they stay. This ruling governs the MATRIX axis only: a
 * capability that is deferred, or that does not exist, is not a thing that
 * becomes available when a state changes, and a disabled control promises
 * that it is.
 *
 * The readings not adopted are disclosed on screen beside the ruling, not
 * deleted — `DEFERRAL_RENDERING.notAdopted` below is what renders them.
 */
export const DEFERRAL_RENDERING = {
  id: 'CONTRADICTION-DEFERRAL-RENDERING',
  grade: 'C2',
  ruling:
    'A capability that is deferred, or that does not exist, renders as NO CONTROL and a stated line where the capability would sit. Not a disabled control, and not an empty region.',
  decidedBy:
    'AC-DOH-07-5 (L28230), this module’s own acceptance criterion and the most specific statement available: the absence "is stated on the assignment screen rather than implied". A disabled control implies; a line states.',
  adoptedReading: {
    ref: 'SB-DOH-005',
    text: 'Where a deferred capability has a natural place in a screen, the Hub renders "an explanatory line rather than a disabled control or an empty region".',
    locator: 'L25924',
  },
  notAdopted: [
    {
      ref: 'AC-DOH-014-2',
      text: '"No deferred capability renders as a disabled control without an explanatory line stating that it is not available in this release." Read by the task brief as permitting a disabled control that carries a line. Not adopted, and not contradicted either: the criterion constrains disabled controls rather than licensing them, and drawing none satisfies it outright. The reading stands on the page; this build simply produces nothing for it to govern.',
      locator: 'L25935',
    },
    {
      ref: 'the inherited slice-4/5 rule',
      text: '`Not applicable` renders ABSENT with the reason in help text. Adopted in its control half — ABSENT — and not in its placement half: a reason carried only in help text can leave the region blank, and SB-DOH-005 refuses an empty region by name alongside the disabled control. Where the two agree, this build follows both.',
      locator: 'L25924 against the slice-4 module fixtures',
    },
  ],
  alsoStatedBy: [
    'L25930 — the terminal safe state is that "the platform says so plainly on the screen where the capability would sit".',
    'L25903 — every register row carries a negative test asserting "its absence produces an explanatory message rather than a broken screen".',
  ],
  scope:
    'The matrix axis only. A capability a role holds and a suspension transiently closes still renders as a disabled control with its write class named — that reason can stop being true, and this one cannot.',
} as const

/**
 * WHAT ONE CELL DRAWS, for one row and one viewer. Three members, and the
 * fourth is deliberately not typeable.
 *
 * THERE IS NO `disabled` MEMBER. The ruling above is enforced by the shape
 * of this union rather than by a rule somebody has to remember: a screen
 * cannot draw a disabled control for a deferred capability here because
 * there is no value it could switch on to do so. That is the same move
 * wave 0's Job-Owner predicate makes — the defect is made unspeakable
 * rather than forbidden — and it is why this fold exists at all instead of
 * each section of the screen deciding for itself.
 */
export type CellRendering =
  /** A live control for this role. What it looks like is the screen's business. */
  | { readonly kind: 'control' }
  /** No control, and this line where the control would be. */
  | { readonly kind: 'absent-with-line'; readonly line: string }
  /** Met on another surface. A statement, never a control, whatever the token reads. */
  | { readonly kind: 'cross-surface'; readonly line: string }

/** A role holds a capability when the cell lets it read or act — the spine's own list. */
const HOLDING: readonly ControlStatus[] = ['allowed', 'allowed-with-conditions', 'read-only']

/**
 * AN ORDER OF QUESTIONS, NOT A BRANCH PER TRAP — the shape MOD-DOH-08
 * settled and this module adopts, because five traps that each get their
 * own conditional are five things to remember and one ordering is one.
 *
 * The questions, in the order they are asked, and each returns before the
 * next is reached:
 *
 * 1. **Does this persona reach the surface at all?** D11, answered by the
 *    route registry in `app/hub/HubShell.tsx` BEFORE this function is
 *    called. It is not asked here and must not be: restating it would give
 *    one rule two owners. It is what disposes of row 7's Worker cell —
 *    `Allowed with conditions — own assignments only` at L28125, honoured
 *    on the device, and this fold is never reached for that persona.
 * 2. **Where is this capability met?** The classification. `another-surface`
 *    returns a statement without the token ever being consulted, which is
 *    the whole of the standing rule: row 4 reads `Allowed with conditions`
 *    for the Supervisor and the Quality Manager (L28122) and the act is
 *    Client Command Center action number 8. A fold that reached the token
 *    first would draw two of the five columns a reassign button.
 * 3. **Only now, the token.** A holding status is a control; anything else
 *    is an absence with the row's stated line.
 *
 * NO ROUTING POINTER IS PRODUCED AT ANY STEP, and for rows 6 and 8 there
 * could not be one: where the alternative to a refusal is off-matrix
 * entirely — a grant table that does not exist, a check that is deferred —
 * there is nothing to point at, and a pointer would have to invent its own
 * target. `routedTo` is a Studio mechanism and no Hub counterpart is built
 * here.
 */
export function assignmentCellRendering(
  row: AssignmentMatrixRow,
  role: TenantRoleId,
): CellRendering {
  if (row.surface === 'another-surface') {
    return { kind: 'cross-surface', line: row.detail[role] }
  }
  if (HOLDING.includes(cellStatus(row, role))) return { kind: 'control' }
  return { kind: 'absent-with-line', line: row.absence?.line ?? row.detail[role] }
}

/**
 * This module's row shape: the spine's shared row plus the absence note.
 *
 * `absence` is REQUIRED and nullable rather than optional, for the reason
 * the spine gives `detail` the same treatment — an optional field is a
 * field a row can forget to answer, and "no note" and "nobody wrote a note"
 * then look identical.
 */
export interface AssignmentMatrixRow extends DohControlMatrixRow<AssignmentControlId> {
  readonly absence: AbsenceNote | null
}

const PROHIBITED_FOR_ALL_FIVE = {
  TENANT_ADMIN: 'explicitly-prohibited',
  SUPERVISOR: 'explicitly-prohibited',
  QUALITY_MANAGER: 'explicitly-prohibited',
  READONLY_AUDITOR: 'explicitly-prohibited',
  WORKER: 'explicitly-prohibited',
} as const satisfies Readonly<Record<TenantRoleId, ControlStatus>>

const NOT_APPLICABLE_FOR_ALL_FIVE = {
  TENANT_ADMIN: 'not-applicable',
  SUPERVISOR: 'not-applicable',
  QUALITY_MANAGER: 'not-applicable',
  READONLY_AUDITOR: 'not-applicable',
  WORKER: 'not-applicable',
} as const satisfies Readonly<Record<TenantRoleId, ControlStatus>>

/**
 * The source's own wording for the four columns that read the bare
 * `Not applicable — same reason` back at the first column. Quoted, not
 * paraphrased: the cell really does say "same reason", and expanding it
 * into five copies of the first cell's sentence would put words in four
 * cells that do not carry them.
 */
const SAME_REASON = 'Not applicable — same reason. The cell states exactly this and nothing more; the reason is the first column’s, quoted in the row’s absence note.'

export const CONTROL_MATRIX = [
  /* Row 1, L28119. */
  {
    id: 'assign-worker',
    control: 'Assign a worker to a run',
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
        'Allowed with conditions — L28119 — "own Area scope, qualification check applies". Both halves are enforced: the selector filters candidates to the Supervisor’s own Areas, and the qualification gate runs server-side before the package pin.',
      QUALITY_MANAGER: BARE_PROHIBITION,
      READONLY_AUDITOR: BARE_PROHIBITION,
      /* A DEFERRAL WEARING A PROHIBITION TOKEN, and the reason is inside
       * the token rather than beside it. The cell is `Explicitly
       * prohibited` and its stated cause is that L28119 — "self-assignment
       * is deferred beyond V1". Reading only the token would render the
       * refusal without the roadmap fact the out-of-V1 register carries at
       * row 4 (L25879), and reading only the reason would render a
       * deferral where the source states a prohibition. Both render. */
      WORKER:
        'Explicitly prohibited — L28119 — "self-assignment is deferred beyond V1". The token is a prohibition and its stated cause is a deferral; out-of-V1 register row 4 (L25879) carries the same fact as scope. AC-DOH-07-1 (L28226) makes the prohibition structural rather than configured: "no worker-role path can produce a self-assignment".',
    },
    rendering:
      'Live for the Supervisor, scoped to their own Areas, and gated by the qualification check under the tenant’s posture. ABSENT for the other four: three carry the bare prohibition, and the Worker’s is a prohibition whose stated cause is a deferral — both facts render, neither is dropped for the other.',
    effect:
      'Writes the assignment record and its audit entry in one transaction, and on the first successful assignment pins the run’s work package immutably (L28133). Dispatched as `DOH_ASSIGN_WORKER`.',
    absence: {
      kind: 'deferred-beyond-v1',
      capability: 'Worker self-assignment',
      line: 'Workers do not assign themselves in this release. Self-assignment is deferred beyond V1 and there is no worker-role path to the assignment service at all, so nothing is drawn here for a Worker — not a control, and not a disabled one.',
      registerRow: 4,
      sourceRef: 'L28119; out-of-V1 register row 4 L25879; AC-DOH-07-1 L28226',
    },
    sourceRef: 'L28119, FUNC-DOH-07-1.1.1 L28178, §4.6.3',
  },

  /* Row 2, L28120. */
  {
    id: 'assign-multiple-workers',
    control: 'Assign multiple workers to one run',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'explicitly-prohibited',
      SUPERVISOR: 'allowed',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN: BARE_PROHIBITION,
      SUPERVISOR:
        'Allowed — L28120 — "concurrency is unlimited". No cap is drawn, because the source states none and a number invented here would read back as a requirement.',
      QUALITY_MANAGER: BARE_PROHIBITION,
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    rendering:
      'A multi-select for the Supervisor with no ceiling and no warning threshold. ABSENT for the other four.',
    effect:
      'One assignment record per worker, each on their own identity. Step attribution is by individual and never by device (AC-DOH-07-4, L28229).',
    absence: null,
    sourceRef: 'L28120, FUNC-DOH-07-1.1.3 L28180, §4.4.1',
  },

  /* Row 3, L28121. The same act MOD-DOH-06 states at L27913 with identical
   * cells; `DOH_SUBSTITUTE_WORKER` carries both locators. */
  {
    id: 'substitute-worker',
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
        'Allowed with conditions — L28121 — "reason capture mandatory". The reason is a required field on the command and a blank one is a validation failure, not a permission refusal.',
      QUALITY_MANAGER: BARE_PROHIBITION,
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    rendering:
      'Live for the Supervisor with the reason field required before the control acts. ABSENT for the other four.',
    effect:
      'Marks the outgoing assignment superseded, writes the incoming one against the SAME pinned package, and creates a reassignment command carrying the structured handover payload. Pre-substitution steps stay attributed to the original worker permanently (AC-DOH-07-7, L28232).',
    absence: null,
    sourceRef: 'L28121, MOD-DOH-06 row 5 L27913, FUNC-DOH-07-2.1.1 L28185, §4.6.7',
  },

  /* Row 4, L28122. THE CROSS-SURFACE ROW, and the only one in this matrix.
   * Two of its five cells carry a PERMISSIVE token on an act that happens
   * somewhere else, which is the shape wave 0's boundary gate was built for
   * and could not exercise on the slice-4 tree. */
  {
    id: 'reassign-from-command-center',
    control: 'Reassign a run mid-shift from the Client Command Center',
    surface: 'another-surface',
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
        'Allowed with conditions — L28122 — "executed through this module’s services with identical rules". The permission is real and it is met in the Client Command Center as action number 8; this screen states where and draws no control.',
      QUALITY_MANAGER:
        'Allowed with conditions — L28122 states the condition as "Supervisor and above", and DEC-PLUS-001 records that that ordering is undefined. The cell is quoted, the status is read from this column and never from the phrase, and no ordering is invented. See `DEC_PLUS_001` below.',
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    rendering:
      'A statement of place for every role, and a control for none. The two permissive cells are permissions held on the Client Command Center, not on this screen: the act is Command Center action number 8 (L13421, WF-EXE-001 L53791 and L53798), and a Hub button for it would be a second entry point for one act with one service behind it.',
    effect:
      'None here. The Command Center calls this module’s substitution service and receives identical validation and identical errors (L28193); the resulting records and audit entries are this module’s, written on the Hub side of the call.',
    absence: null,
    sourceRef: 'L28122; L13421; WF-EXE-001 L53791, L53798; L28185',
  },

  /* Row 5, L28123. Prohibited in all five columns, and the act exists
   * NOWHERE — which is why it stays a `screen` row rather than becoming a
   * cross-surface one. The CLEARANCE is the adjacent capability, and it is
   * a different act with its own boundary-register row; it is rendered as a
   * `CrossSurfaceStatement` in the assignment panel, not as a matrix row. */
  {
    id: 'override-qualification-block',
    control: 'Override a qualification block at assignment',
    surface: 'screen',
    status: PROHIBITED_FOR_ALL_FIVE,
    detail: {
      TENANT_ADMIN: BARE_PROHIBITION,
      SUPERVISOR:
        'Explicitly prohibited — L28123 — "the sanctioned path is a clearance, not an override". The clearance is Client Command Center action number 10 and is a registered boundary (L25724); the override is not a capability of any surface.',
      QUALITY_MANAGER: BARE_PROHIBITION,
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    rendering:
      'ABSENT for all five, and stated. AC-DOH-07-10 (L28235) requires that a blocked assignment "offers the clearance path and never an inline override", so the blocked row carries the clearance statement and no override affordance of any kind.',
    effect:
      'None. There is no command for this act in the Hub command set, which is the guarantee rather than a check that could be relaxed.',
    absence: null,
    sourceRef: 'L28123, AC-DOH-07-10 L28235, §4.4.6, boundary register row 6 L25724',
  },

  /* Row 6, L28124. `Not applicable` in all five columns. */
  {
    id: 'maintain-per-cell-grant',
    control: 'Maintain a per-worker-per-cell grant',
    surface: 'screen',
    status: NOT_APPLICABLE_FOR_ALL_FIVE,
    detail: {
      TENANT_ADMIN:
        'Not applicable — L28124 — "no per-worker-per-cell grant table exists; cell narrowing uses the required-certification model".',
      SUPERVISOR: SAME_REASON,
      QUALITY_MANAGER: SAME_REASON,
      READONLY_AUDITOR: SAME_REASON,
      WORKER: SAME_REASON,
    },
    rendering:
      'No table, no grant editor, no disabled table, and a stated line where such a table would sit. Rendering a disabled grant table would invent two entities the source says do not exist — a grant, and a table of them — and a disabled control is a promise that the capability exists and is merely refused here.',
    effect:
      'None, and none is coming. Cell narrowing is met entirely by the Location’s required certification: any holder of it is assignable (FUNC-DOH-07-1.1.2, L28179).',
    absence: {
      kind: 'does-not-exist',
      capability: 'A per-worker-per-cell grant table',
      line: 'There is no per-worker-per-cell grant to maintain. A Location (Cell) may require a certification, and any holder of that certification may be assigned — so cell access is administered by certification rather than by a table of workers against benches. This is not a deferral and it is not on the out-of-V1 register: AC-DOH-07-3 states that no such table "exists anywhere in the platform".',
      registerRow: null,
      sourceRef:
        'L28124; L28088 — "there is no per-worker-per-cell grant table to maintain"; AC-DOH-07-3 L28228; §4.6.3',
    },
    sourceRef: 'L28124, L28088, AC-DOH-07-3 L28228, FUNC-DOH-07-1.1.2 L28179',
  },

  /* Row 7, L28125. The only row anybody but the Supervisor holds — and the
   * row that makes catalogue B's "Supervisor" cell measurably narrow. */
  {
    id: 'view-assignments',
    control: 'View assignments',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'allowed',
      SUPERVISOR: 'allowed-with-conditions',
      QUALITY_MANAGER: 'allowed',
      READONLY_AUDITOR: 'read-only',
      WORKER: 'allowed-with-conditions',
    },
    detail: {
      TENANT_ADMIN: 'Allowed — L28125, unconditional. Catalogue B’s cell for this screen omits this role; the matrix is what reach is derived from.',
      SUPERVISOR: 'Allowed with conditions — L28125 — "own scope". The scope filters the SELECTOR, not the render: a Supervisor reads the assignments in their own Areas and the list is built from that set, rather than a full list drawn and then hidden.',
      QUALITY_MANAGER:
        'Allowed — L28125, unconditional, and the module’s purpose line (L28103) says why: quality managers "can prove who did which step". Catalogue B’s cell omits this role.',
      READONLY_AUDITOR:
        'Read-only — L28125. Reads everything and writes nothing anywhere on this screen. Catalogue B’s cell omits this role.',
      /* D11. The grant is real and it is not met here. */
      WORKER:
        'Allowed with conditions — L28125 — "own assignments only". The Worker reaches no Hub screen at all under D11, so this grant renders nowhere in the Hub and is met on the device: L28135 — "Each assigned worker sees the run on their own device under their own identity". The cell keeps its token; what changes is where it is honoured.',
    },
    rendering:
      'The assignment list, scoped by the selector for the Supervisor and unscoped for the Tenant Admin, the Quality Manager and the Read-only Auditor. Nothing for the Worker, because the route registry refuses the Worker the surface before this matrix is consulted.',
    effect:
      'Reads assignment records and their substitution history. No write of any kind for any role on this row.',
    absence: null,
    sourceRef: 'L28125, L28135, L28103',
  },

  /* Row 8, L28126. `Not applicable` in all five columns. */
  {
    id: 'check-availability',
    control: 'Check worker availability or double-booking',
    surface: 'screen',
    status: NOT_APPLICABLE_FOR_ALL_FIVE,
    detail: {
      TENANT_ADMIN:
        'Not applicable — L28126 — "availability and double-booking checks are deferred beyond V1".',
      SUPERVISOR: SAME_REASON,
      QUALITY_MANAGER: SAME_REASON,
      READONLY_AUDITOR: SAME_REASON,
      WORKER: SAME_REASON,
    },
    rendering:
      'No availability panel, no conflict warning, no disabled "check availability" button, and a stated line where the check would sit. AC-DOH-07-5 (L28230) requires exactly this and says which of the two it wants: the absence "is stated on the assignment screen rather than implied".',
    effect:
      'None. The qualification check is the only check that runs at assignment (L28086), so a supervisor may assign a worker who is already on another run and the platform will not say so.',
    absence: {
      kind: 'deferred-beyond-v1',
      capability: 'An availability or double-booking check',
      line: 'This release runs no availability or double-booking check. The qualification check is the only check at assignment, so a worker already assigned elsewhere can be assigned again here and nothing will warn you. Deferred beyond V1 — out-of-V1 register row 5.',
      registerRow: 5,
      sourceRef: 'L28126; out-of-V1 register row 5 L25880; AC-DOH-07-5 L28230; L28086',
    },
    sourceRef: 'L28126, L25880, AC-DOH-07-5 L28230',
  },
] as const satisfies readonly AssignmentMatrixRow[]

// Same exhaustiveness shape the eight slice-4 matrices use: a ninth control
// id added to the union above and not to the matrix fails to compile here.
type MissingFromMatrix = Exclude<AssignmentControlId, (typeof CONTROL_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

export function assignmentRow(id: AssignmentControlId): AssignmentMatrixRow {
  const found = CONTROL_MATRIX.find((r) => r.id === id)
  if (found === undefined) throw new Error(`Unknown MOD-DOH-07 control: ${id}`)
  return found
}

/**
 * WHO REACHES `SCR-DOH-15` — derived from the matrix above by the ONE
 * implementation of the rule, exactly as `MOD-DOH-12`'s screen derives its
 * own at runtime (`app/hub/integration-surface/fixtures.ts`).
 *
 * It is not hand-written and it is not read from catalogue B, whose cell
 * for this screen names the Supervisor alone (L48109) while L28125 admits
 * the Tenant Admin and the Quality Manager unconditionally and the
 * Read-only Auditor as a reader. Wave 0 measured that narrowing and
 * recorded it as `DOH_CATALOGUE_B_REACH_NARROWER`; this is the other half
 * of the same finding, and the screen renders both.
 *
 * ALL FIVE ROLES COME BACK, THE WORKER INCLUDED, and that is correct rather
 * than a bug: the Worker holds row 7 and no cell in the Worker column
 * carries the `Unavailable` withholding token. It is the shape `MOD-DOH-03`
 * already ships and the spine already documents — whether the Worker
 * reaches SURF-DOH at all is D11's answer, given first by the route
 * registry, and this derivation is never consulted for a persona the
 * surface has already refused.
 */
export const MOD_DOH_07_REACH: readonly TenantRoleId[] = rolesReachingByMatrix(
  CONTROL_MATRIX,
  cellStatus,
)

/**
 * The five tenant roles in registry order, for the screen's column headers
 * and for every walk in this module's suite. Read from `@/domain/roles`
 * rather than typed here again.
 */
export const TENANT_ROLES: readonly TenantRoleId[] = rolesInDomain('TENANT').map(
  (r) => r.id as TenantRoleId,
)
