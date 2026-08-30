import {
  BARE_PROHIBITION,
  cellStatus,
  rolesReachingByMatrix,
  type ControlStatus,
  type DohControlMatrixRow,
} from '@/surfaces/doh/modules'
import type { TenantRoleId } from '../../../../../app/hub/HubShell'

/**
 * `MOD-DOH-05` — Job Lifecycle and Approval. The control matrix, measured.
 *
 * FOURTEEN DATA ROWS, COUNTED RATHER THAN CARRIED. The table header sits at
 * L27692 and its separator at L27693; the rows run L27694 to L27707
 * inclusive, which is fourteen. The plan's span for this matrix reads
 * "L27692-L27707" and begins on the HEADER — §1a of the re-plan records that
 * every span in that document does, so a reader taking L27692 as row 1 lands
 * two rows short of the end and silently drops `Archive or un-archive a Job`
 * and `View Jobs`.
 *
 * The identity card is the same shape: header L27673, separator L27674, and
 * fourteen card rows L27675-L27688. `MOD-DOH-05` (L27675) is the card's own
 * Identifier row.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY ONE FILE HOLDS ROWS THIS MODULE PRINTS ON TWO DIFFERENT ROUTES
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `SCR-DOH-10` (L48104) and `SCR-DOH-11` (L48105) live at
 * `/hub/job-lifecycle-and-approval`; `SCR-DOH-12` (L48106) lives at
 * `/hub/job-approval-queue` and has its own navigation entry. Three screens,
 * two routes, ONE matrix. If the two routes had been built as two tasks each
 * would have transcribed the half of the matrix its own screen needed, and
 * the rows that bind the two halves together — row 4's approval gate and
 * row 5's restatement of it — sit exactly on the seam. Both routes import
 * from here; neither owns a row list of its own.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE THREE ROWS THAT ARE NOT WHAT THEIR TOKEN SAYS
 * ─────────────────────────────────────────────────────────────────────────
 *
 * ROW 4 IS A PROHIBITION CARRYING A PERMISSIVE ESCAPE. The Tenant Admin cell
 * at L27697 reads "`Explicitly prohibited` unless the Tenant Admin also holds
 * an approver role and did not create it". Reading the leading token alone
 * asserts a prohibition the source qualifies; reading the escape alone
 * asserts a grant the source leads away from. `escape` below carries the
 * clause and `escapeRepresentable` records why its precondition cannot be
 * driven in this build at all — see `MOD_DOH_05_ESCAPE`.
 *
 * ROW 5 IS NOT A SECOND ACT. "Approve a Job the same identity created"
 * (L27698) prohibits in all five columns, and it is the NEGATIVE
 * RESTATEMENT of the condition row 4 already carries on the Quality Manager
 * — L27697 says "`Allowed with conditions` — **never** a Job the same
 * identity created". Rendering it as a capability of its own invents an act
 * a person could hold, and then has to explain why nobody holds it. It is
 * classified `restatement`, it yields no act, and it renders as the reason
 * attached to row 4 rather than as a row anybody could act on.
 *
 * ROW 11 STATES TWO STATUSES IN ONE CELL. The Quality Manager cell at L27704
 * reads "`Explicitly prohibited` for proposing; `Allowed` for approving".
 * The shared row shape keys one `ControlStatus` per role, so a reader
 * obeying that shape must drop one of the two — and BOTH losses are silent.
 * Keep only the prohibition and the Quality Manager loses the approve
 * control the recurrence gate cannot run without; keep only the grant and a
 * propose control appears for the one role the source forbids to propose.
 * The row therefore carries a `secondAct`, and the screens draw one control
 * per ACT rather than one per row.
 *
 * ROW 8 DESCRIBES ANOTHER SCREEN. "Maintain the tag-to-qualification-set
 * mapping" (L27701) reads `Allowed with conditions` for the Tenant Admin,
 * and its condition names where: the tenant administration area. That is
 * `SCR-DOH-23` (L48117), an ownerless screen group this build serves no
 * route for, and this module's own identity card lists it as a DEPENDENCY
 * (L27685) rather than as something the Job screens hold. Classified
 * `another-surface`, so `inlineControlsOnAdjacentCapabilities` in
 * `@/surfaces/doh/boundary` refuses any control on it whatever the token
 * reads. Its `boundary` pointer is deliberately absent: the eight-row
 * boundary register is CROSS-SURFACE, and the tenant administration area is
 * a different screen of THIS surface. A register pointer there would claim a
 * boundary that does not exist.
 */

export type Doh05RowId =
  | 'create-a-job'
  | 'edit-a-draft-job'
  | 'submit-a-job-for-approval'
  | 'approve-a-job'
  | 'approve-a-job-the-same-identity-created'
  | 'create-a-custom-job-type'
  | 'apply-a-service-type-tag'
  | 'maintain-the-tag-to-qualification-set-mapping'
  | 'reassign-the-job-owner'
  | 'decide-a-notified-class-version-adoption'
  | 'modify-recurrence-on-an-active-job'
  | 'decide-keep-or-cancel-on-affected-runs'
  | 'archive-or-un-archive-a-job'
  | 'view-jobs'

/**
 * `act` — a capability somebody could hold, which becomes zero, one or two
 * controls depending on `surface` and `secondAct`.
 * `restatement` — a row that states, negatively, a condition another row
 * already carries. It yields NO act, ever.
 */
export type Doh05RowKind = 'act' | 'restatement'

/**
 * The second half of a cell that states two statuses for one role.
 *
 * `status` is nullable PER ROLE and the null is load-bearing: L27704 states
 * the approving half for the Quality Manager and for nobody else. The Tenant
 * Admin and Supervisor cells on that row describe proposing — "passes the
 * same approval gate", "own scope, passes the gate" — and say nothing about
 * who stands at the other end of the gate. Writing `explicitly-prohibited`
 * there would assert a refusal this row never makes, and writing
 * `not-applicable` would assert the act does not apply to them, which row 4
 * contradicts for the Tenant Admin. `null` means the row is silent, the
 * screen says so, and `MOD_DOH_05_UNSPECIFIED_IN_SOURCE` records it.
 */
export interface Doh05SecondAct {
  readonly actId: Doh05ActId
  /** The half of the cell this act is, in the source's own words. */
  readonly control: string
  readonly status: Readonly<Record<TenantRoleId, ControlStatus | null>>
  readonly detail: Readonly<Record<TenantRoleId, string>>
  readonly sourceRef: string
}

/** A prohibition token whose own cell states the condition that lifts it. */
export interface Doh05Escape {
  readonly role: TenantRoleId
  /** The clause after the token, verbatim. */
  readonly clause: string
  /**
   * Whether this build can drive the escape's precondition. It cannot: the
   * clause turns on one identity holding two roles at once, and
   * `IdentitySimulationState.role` is singular. Stated rather than silently
   * rendered as a flat refusal.
   */
  readonly representable: false
  readonly whyNot: string
  readonly sourceRef: string
}

export interface Doh05Row extends DohControlMatrixRow<Doh05RowId> {
  /** 1-based, as the source's table reads top to bottom. */
  readonly ordinal: number
  readonly kind: Doh05RowKind
  /** Set on a `restatement`: the row whose condition this one restates. */
  readonly restates: Doh05RowId | null
  /** Set where one cell states two statuses for one role. */
  readonly secondAct: Doh05SecondAct | null
  /** Set where a prohibition token carries its own escape clause. */
  readonly escape: Doh05Escape | null
}

export type Doh05ActId =
  | Exclude<
      Doh05RowId,
      'approve-a-job-the-same-identity-created' | 'maintain-the-tag-to-qualification-set-mapping'
    >
  | 'approve-a-recurrence-modification'

type Cell = readonly [ControlStatus, string]
type NullableCell = readonly [ControlStatus | null, string]

const PROHIBITED: Cell = ['explicitly-prohibited', BARE_PROHIBITION]

function cells(
  admin: Cell,
  supervisor: Cell,
  quality: Cell,
  auditor: Cell,
  worker: Cell,
): {
  status: Readonly<Record<TenantRoleId, ControlStatus>>
  detail: Readonly<Record<TenantRoleId, string>>
} {
  return {
    status: {
      TENANT_ADMIN: admin[0],
      SUPERVISOR: supervisor[0],
      QUALITY_MANAGER: quality[0],
      READONLY_AUDITOR: auditor[0],
      WORKER: worker[0],
    },
    detail: {
      TENANT_ADMIN: admin[1],
      SUPERVISOR: supervisor[1],
      QUALITY_MANAGER: quality[1],
      READONLY_AUDITOR: auditor[1],
      WORKER: worker[1],
    },
  }
}

function nullableCells(
  admin: NullableCell,
  supervisor: NullableCell,
  quality: NullableCell,
  auditor: NullableCell,
  worker: NullableCell,
): {
  status: Readonly<Record<TenantRoleId, ControlStatus | null>>
  detail: Readonly<Record<TenantRoleId, string>>
} {
  return {
    status: {
      TENANT_ADMIN: admin[0],
      SUPERVISOR: supervisor[0],
      QUALITY_MANAGER: quality[0],
      READONLY_AUDITOR: auditor[0],
      WORKER: worker[0],
    },
    detail: {
      TENANT_ADMIN: admin[1],
      SUPERVISOR: supervisor[1],
      QUALITY_MANAGER: quality[1],
      READONLY_AUDITOR: auditor[1],
      WORKER: worker[1],
    },
  }
}

/** The clause L27697 hangs off the Tenant Admin's prohibition token. */
export const MOD_DOH_05_ESCAPE: Doh05Escape = {
  role: 'TENANT_ADMIN',
  clause: 'unless the Tenant Admin also holds an approver role and did not create it',
  representable: false,
  whyNot:
    'The escape turns on one identity holding two tenant roles at once. `IdentitySimulationState.role` is a single role, so this build cannot construct the identity the clause describes, and no persona here can reach the permitted side of it. Rendering the Tenant Admin as flatly refused would assert the prohibition and delete the escape; rendering an approve control would assert the escape and delete the prohibition. Neither is asserted: no control is drawn, and the clause is printed.',
  sourceRef: 'L27697; the routing rule it depends on at L27656; `AC-WF-ORG-004-01` (L52670)',
}

/**
 * The fourteen rows, L27694-L27707, in source order.
 *
 * Every `detail` is the source's own cell text where the source qualifies
 * the token, and `BARE_PROHIBITION` where it states the bare token and
 * qualifies it nowhere — the shared wording from `@/surfaces/doh/modules`,
 * not a second one written here.
 */
export const MOD_DOH_05_MATRIX = [
  {
    id: 'create-a-job',
    ordinal: 1,
    control: 'Create a Job',
    surface: 'screen',
    kind: 'act',
    restates: null,
    secondAct: null,
    escape: null,
    ...cells(
      [
        'allowed-with-conditions',
        '`Allowed with conditions` — blocked in soft, hard and compliance suspension',
      ],
      [
        'allowed-with-conditions',
        '`Allowed with conditions` — own Area scope; blocked in suspension',
      ],
      PROHIBITED,
      PROHIBITED,
      PROHIBITED,
    ),
    rendering:
      'A New Job control on the Job list, gated through `evaluateAccess`; the suspension halves of both conditions are the evaluator’s own feature-and-suspension stage rather than a second gate here.',
    effect: 'A Job record in `draft`, with the Job Owner field defaulted to the creator.',
    sourceRef: 'L27694',
  },
  {
    id: 'edit-a-draft-job',
    ordinal: 2,
    control: 'Edit a draft Job',
    surface: 'screen',
    kind: 'act',
    restates: null,
    secondAct: null,
    escape: null,
    ...cells(
      ['allowed', '`Allowed`'],
      ['allowed-with-conditions', '`Allowed with conditions` — own scope'],
      PROHIBITED,
      PROHIBITED,
      PROHIBITED,
    ),
    rendering:
      'The Job editor’s own fields, `SCR-DOH-11` (L48105). This is the row catalogue B is narrower than: its cell names the Supervisor alone and this one gives the Tenant Admin unconditional `Allowed`.',
    effect: 'The draft Job record changes. No state transition.',
    sourceRef: 'L27695',
  },
  {
    id: 'submit-a-job-for-approval',
    ordinal: 3,
    control: 'Submit a Job for approval',
    surface: 'screen',
    kind: 'act',
    restates: null,
    secondAct: null,
    escape: null,
    ...cells(
      ['allowed', '`Allowed`'],
      ['allowed-with-conditions', '`Allowed with conditions` — own scope'],
      PROHIBITED,
      PROHIBITED,
      PROHIBITED,
    ),
    rendering: 'A Submit control on the Job editor, live only while the Job is in `draft`.',
    effect: '`draft` → `pending_approval`, and the approval routes to somebody who is not the submitter.',
    sourceRef: 'L27696',
  },
  {
    id: 'approve-a-job',
    ordinal: 4,
    control: 'Approve a Job',
    surface: 'screen',
    kind: 'act',
    restates: null,
    secondAct: null,
    escape: MOD_DOH_05_ESCAPE,
    ...cells(
      [
        'explicitly-prohibited',
        '`Explicitly prohibited` unless the Tenant Admin also holds an approver role and did not create it',
      ],
      PROHIBITED,
      [
        'allowed-with-conditions',
        '`Allowed with conditions` — **never** a Job the same identity created',
      ],
      PROHIBITED,
      PROHIBITED,
    ),
    rendering:
      'The Approve control on `SCR-DOH-12` (L48106). The Quality Manager’s condition is the EXISTING `makerCheckerOf` field of `evaluateAccess`, supplied per Job by `hubAccessRequest`; this module adds no second maker-checker. The Tenant Admin cell draws nothing and prints its escape clause.',
    effect: '`pending_approval` → `active`, with the approval and its audit entry in one transaction.',
    sourceRef: 'L27697',
  },
  {
    id: 'approve-a-job-the-same-identity-created',
    ordinal: 5,
    control: 'Approve a Job the same identity created',
    surface: 'screen',
    kind: 'restatement',
    restates: 'approve-a-job',
    secondAct: null,
    escape: null,
    ...cells(
      PROHIBITED,
      PROHIBITED,
      [
        'explicitly-prohibited',
        '`Explicitly prohibited` — routed to a second qualified approver',
      ],
      PROHIBITED,
      PROHIBITED,
    ),
    rendering:
      'NOT A CONTROL, on any screen, for any role. It restates row 4’s condition negatively and yields no act — see `actsOfRow`. Its Quality Manager cell is where the source states the ROUTING that replaces the refused control, and the approval queue prints that beside row 4.',
    effect:
      'None of its own. The state change is row 4’s, taken by a different identity; L27656: "If the creator also holds the approver role, the platform routes approval to a second qualified approver."',
    sourceRef: 'L27698',
  },
  {
    id: 'create-a-custom-job-type',
    ordinal: 6,
    control: 'Create a custom Job Type',
    surface: 'screen',
    kind: 'act',
    restates: null,
    secondAct: null,
    escape: null,
    ...cells(
      ['allowed', '`Allowed` — all tiers, immediate, no platform approval step'],
      PROHIBITED,
      PROHIBITED,
      PROHIBITED,
      PROHIBITED,
    ),
    rendering:
      'A create control beside the Job Type field on the Job editor. No tier gate and no platform approval step are drawn, because the cell rules both out.',
    effect:
      'A tenant-created Job Type, available immediately. The PLATFORM-SEEDED catalogue is untouched and stays empty under `DEC-TAX-002` (L27654).',
    sourceRef: 'L27699',
  },
  {
    id: 'apply-a-service-type-tag',
    ordinal: 7,
    control: 'Apply a Service Type tag',
    surface: 'screen',
    kind: 'act',
    restates: null,
    secondAct: null,
    escape: null,
    ...cells(
      ['allowed', '`Allowed`'],
      ['allowed-with-conditions', '`Allowed with conditions` — own scope'],
      PROHIBITED,
      PROHIBITED,
      PROHIBITED,
    ),
    rendering:
      'A tag selector on the Job editor. Applying one PRE-POPULATES the qualification requirements and never fixes them — `AC-DOH-05-5` (L27819): "A Service Type tag pre-populates qualification requirements and never enforces them".',
    effect:
      'The Job’s qualification requirements are suggested from the tenant mapping and stay fully editable.',
    sourceRef: 'L27700',
  },
  {
    id: 'maintain-the-tag-to-qualification-set-mapping',
    ordinal: 8,
    control: 'Maintain the tag-to-qualification-set mapping',
    // MET ON ANOTHER SCREEN, NOT THIS ONE. The classification decides what is
    // drawn; the token does not. Deliberately no `boundary` pointer — the
    // eight-row register is cross-SURFACE and this target is a screen of this
    // same surface.
    surface: 'another-surface',
    kind: 'act',
    restates: null,
    secondAct: null,
    escape: null,
    ...cells(
      [
        'allowed-with-conditions',
        '`Allowed with conditions` — in the tenant administration area',
      ],
      PROHIBITED,
      PROHIBITED,
      PROHIBITED,
      PROHIBITED,
    ),
    rendering:
      'A statement naming where the mapping is maintained, and no control of any kind — not even a disabled one. The tenant administration area is `SCR-DOH-23` (L48117), an ownerless screen group with no route in this build, so no link is drawn either: a link to a route that does not exist is a pointer a reviewer would read as verified.',
    effect:
      'None here. The mapping this screen READS when a Service Type tag pre-populates requirements is written there.',
    sourceRef: 'L27701; the dependency stated on this module’s own card at L27685',
  },
  {
    id: 'reassign-the-job-owner',
    ordinal: 9,
    control: 'Reassign the Job Owner',
    surface: 'screen',
    kind: 'act',
    restates: null,
    secondAct: null,
    escape: null,
    ...cells(
      ['allowed', '`Allowed`'],
      ['allowed-with-conditions', '`Allowed with conditions` — own scope'],
      PROHIBITED,
      PROHIBITED,
      PROHIBITED,
    ),
    rendering:
      'A reassign control on the Job editor. It changes a FIELD on the Job record and grants nothing — `AC-DOH-05-11` (L27825): "Job Owner confers no permission of any kind."',
    effect:
      'Version-adoption decisions and paired-Job change flags route to a different identity. No permission moves with it.',
    sourceRef: 'L27702',
  },
  {
    id: 'decide-a-notified-class-version-adoption',
    ordinal: 10,
    control: 'Decide a notified-class version adoption',
    surface: 'screen',
    kind: 'act',
    restates: null,
    secondAct: null,
    escape: null,
    ...cells(
      [
        'allowed-with-conditions',
        '`Allowed with conditions` — only where the Tenant Admin is the Job Owner',
      ],
      [
        'allowed-with-conditions',
        '`Allowed with conditions` — only where the Supervisor is the Job Owner',
      ],
      [
        'allowed-with-conditions',
        '`Allowed with conditions` — only where the Quality Manager is the Job Owner',
      ],
      PROHIBITED,
      PROHIBITED,
    ),
    rendering:
      'An Adopt control on the Job editor’s version panel, gated by the SHARED Job-Owner-of-record predicate in `@/surfaces/doh/job-owner` through `hubAccessRequest`. Where the Job’s owner field does not name the viewer, the row grants the act to NO role and the refusal is `ROLE_NOT_GRANTED` — there is no `JOB_OWNER` in any role list, because Job Owner is a field on the Job record and not a role.',
    effect:
      'The notified-class version binds to this Job. A patch never reaches this control: patches apply directly with no Job-Owner decision.',
    sourceRef: 'L27703; `AC-DOH-05-11` (L27825); the field statement at L27652',
  },
  {
    id: 'modify-recurrence-on-an-active-job',
    ordinal: 11,
    control: 'Modify recurrence on an active Job — propose',
    surface: 'screen',
    kind: 'act',
    restates: null,
    escape: null,
    secondAct: {
      actId: 'approve-a-recurrence-modification',
      control: 'Modify recurrence on an active Job — approve',
      ...nullableCells(
        [
          null,
          'This row states the Tenant Admin’s PROPOSING half only. It is silent on who stands at the other end of the gate for this role, and row 4 (L27697) is where the Tenant Admin’s approval standing is stated — as a prohibition carrying an escape this build cannot drive.',
        ],
        [
          null,
          'This row states the Supervisor’s PROPOSING half only. Row 4 (L27697) states the Supervisor `Explicitly prohibited` on approving a Job; whether "the same approval gate" carries that across to a recurrence proposal is not said here.',
        ],
        ['allowed', '`Allowed` for approving'],
        [
          'explicitly-prohibited',
          'The Read-only Auditor cell on this row carries no "for proposing" qualifier, so its prohibition covers both halves; `FUNC-DOH-05-2.2.1` (L27768) restates it — "Tenant Admin and Supervisor to propose; Quality Manager to decide."',
        ],
        [
          'explicitly-prohibited',
          'The Worker cell on this row carries no "for proposing" qualifier, so its prohibition covers both halves; `FUNC-DOH-05-2.2.1` (L27768) names the Read-only Auditor and the Worker as the two prohibited roles.',
        ],
      ),
      sourceRef: 'L27704, second half of the Quality Manager cell; `FUNC-DOH-05-2.2.1` (L27768)',
    },
    ...cells(
      [
        'allowed-with-conditions',
        '`Allowed with conditions` — passes the same approval gate',
      ],
      [
        'allowed-with-conditions',
        '`Allowed with conditions` — own scope, passes the gate',
      ],
      ['explicitly-prohibited', '`Explicitly prohibited` for proposing'],
      PROHIBITED,
      PROHIBITED,
    ),
    rendering:
      'TWO controls, not one. The propose control uses the cells above; the approve control uses `secondAct`. A one-status-per-role reading of this cell either draws a propose control for the Quality Manager, who may not propose, or drops the approve control the gate cannot run without — and neither failure announces itself.',
    effect:
      'A proposal leaves the Job running on its current schedule until it is approved; on approval the new pattern takes effect from the next cycle and the runs it no longer fits are flagged for row 12.',
    sourceRef: 'L27704',
  },
  {
    id: 'decide-keep-or-cancel-on-affected-runs',
    ordinal: 12,
    control: 'Decide keep-or-cancel on runs no longer fitting a new pattern',
    surface: 'screen',
    kind: 'act',
    restates: null,
    secondAct: null,
    escape: null,
    ...cells(
      ['allowed', '`Allowed`'],
      ['allowed-with-conditions', '`Allowed with conditions` — own scope'],
      ['allowed', '`Allowed`'],
      PROHIBITED,
      PROHIBITED,
    ),
    rendering:
      'A keep-or-cancel decision per flagged run on the Job editor. The flag itself is raised by row 11’s approve act; nothing here drops a run silently.',
    effect:
      'Each affected scheduled run is kept or cancelled by an explicit decision. The cancellation half reaches the devices holding those runs.',
    sourceRef: 'L27705',
  },
  {
    id: 'archive-or-un-archive-a-job',
    ordinal: 13,
    control: 'Archive or un-archive a Job',
    surface: 'screen',
    kind: 'act',
    restates: null,
    secondAct: null,
    escape: null,
    ...cells(
      ['allowed', '`Allowed`'],
      ['allowed-with-conditions', '`Allowed with conditions` — own scope'],
      ['allowed', '`Allowed`'],
      PROHIBITED,
      PROHIBITED,
    ),
    rendering:
      'Archive and Un-archive on the Job list. Archival is soft in both directions, so neither control is destructive and neither is one-way.',
    effect:
      'L27727: "Soft archive; historical runs retained; un-archive supported." Nothing is purged and the state is reversible.',
    sourceRef: 'L27706',
  },
  {
    id: 'view-jobs',
    ordinal: 14,
    control: 'View Jobs',
    surface: 'screen',
    kind: 'act',
    restates: null,
    secondAct: null,
    escape: null,
    ...cells(
      ['allowed', '`Allowed`'],
      ['allowed-with-conditions', '`Allowed with conditions` — own scope'],
      ['allowed', '`Allowed`'],
      ['read-only', '`Read-only`'],
      ['unavailable', '`Unavailable`'],
    ),
    rendering:
      'The Job list itself. The Worker cell is the WITHHOLDING token: `Unavailable` means no standing on this module in any scope, so the route is not offered rather than offered and then refused. Whether a Worker reaches SURF-DOH at all is answered one layer up by the route registry (D11), before this matrix is consulted.',
    effect: 'The list renders, scope-filtered for the Supervisor by the selector and not by the render.',
    sourceRef: 'L27707',
  },
] as const satisfies readonly Doh05Row[]

type MissingFromMatrix = Exclude<Doh05RowId, (typeof MOD_DOH_05_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

const ROW_BY_ID = new Map<Doh05RowId, Doh05Row>(MOD_DOH_05_MATRIX.map((r) => [r.id, r]))

export function doh05Row(id: Doh05RowId): Doh05Row {
  const found = ROW_BY_ID.get(id)
  if (!found) throw new Error(`Unknown MOD-DOH-05 matrix row: ${id}`)
  return found
}

/* ==================================================================== *
 * ACTS — WHAT A SCREEN MAY DRAW A CONTROL FOR
 * ==================================================================== */

/**
 * An act is a capability a screen may offer. It is NOT the same thing as a
 * matrix row, and the difference is the whole point of this file:
 *
 * - a `restatement` row yields ZERO acts (row 5);
 * - an `another-surface` row yields ZERO acts here, whatever its token reads
 *   (row 8) — the capability is real, it is simply met elsewhere;
 * - a row whose cell states two statuses for one role yields TWO (row 11).
 *
 * Twelve rows survive the first two rules and row 11 contributes twice, so
 * there are thirteen acts against fourteen rows. Derived, never listed: plant
 * a wrong `kind` or `surface` on a row and the act list moves with it, which
 * is what the unit suite drives.
 */
export interface Doh05Act {
  readonly id: Doh05ActId
  readonly rowId: Doh05RowId
  readonly control: string
  /** `null` for a role this act's own cell is silent about. */
  readonly status: Readonly<Record<TenantRoleId, ControlStatus | null>>
  readonly detail: Readonly<Record<TenantRoleId, string>>
  readonly sourceRef: string
  /** True for the second half of a two-status cell. */
  readonly fromSecondHalfOfCell: boolean
}

/**
 * AN ORDER OF QUESTIONS, NOT A SPECIAL CASE PER ROW — and the order is the
 * mechanism. Six traps on this matrix would otherwise be six branches, each
 * naming the row it was written for, and a seventh trap would need a seventh
 * branch that nobody writes.
 *
 *   1. IS THIS ROW EVEN A CAPABILITY? A restatement states another row's
 *      condition negatively. Nothing follows from it.
 *   2. IS IT MET HERE? A row whose capability lives on another screen or
 *      another surface yields no control here, whatever its token reads.
 *      Asked BEFORE the token, which is the whole rule.
 *   3. DOES ONE CELL STATE MORE THAN ONE ACT? Then it is more than one
 *      control.
 *   4. ONLY THEN, THE TOKEN — and the token is read per role, by
 *      `rolesGranted`, and handed to the evaluator rather than acted on here.
 *
 * The D11 question — does this persona reach the surface at all — is asked
 * one layer above any of this, by the route registry through `HubShell`, so
 * it is deliberately not a step here. Restating it would give one rule two
 * owners, and this module has no Worker act for it to catch in any case.
 */
export function actsOfRow(row: Doh05Row): readonly Doh05Act[] {
  if (row.kind === 'restatement') return []
  if (row.surface !== 'screen') return []
  const primary: Doh05Act = {
    // Safe by construction: `Doh05ActId` excludes exactly the two row ids the
    // two guards above have already returned on.
    id: row.id as Doh05ActId,
    rowId: row.id,
    control: row.control,
    status: row.status,
    detail: row.detail,
    sourceRef: row.sourceRef,
    fromSecondHalfOfCell: false,
  }
  if (row.secondAct === null) return [primary]
  return [
    primary,
    {
      id: row.secondAct.actId,
      rowId: row.id,
      control: row.secondAct.control,
      status: row.secondAct.status,
      detail: row.secondAct.detail,
      sourceRef: row.secondAct.sourceRef,
      fromSecondHalfOfCell: true,
    },
  ]
}

export const MOD_DOH_05_ACTS: readonly Doh05Act[] = MOD_DOH_05_MATRIX.flatMap(actsOfRow)

const ACT_BY_ID = new Map<Doh05ActId, Doh05Act>(MOD_DOH_05_ACTS.map((a) => [a.id, a]))

export function doh05Act(id: Doh05ActId): Doh05Act {
  const found = ACT_BY_ID.get(id)
  if (!found) throw new Error(`Unknown MOD-DOH-05 act: ${id}`)
  return found
}

/**
 * The roles an act's own cell grants something to, in registry order.
 *
 * A `null` cell is NOT a grant and NOT a refusal — it is the row saying
 * nothing — so it is excluded here and named on screen instead. Handing a
 * silent cell to `evaluateAccess` as either an allow or a deny would settle,
 * inside a role list nobody reads, a question the source left open.
 */
export function rolesGranted(act: Doh05Act): readonly TenantRoleId[] {
  return TENANT_ROLE_ORDER.filter((role) => {
    const status = act.status[role]
    return status === 'allowed' || status === 'allowed-with-conditions' || status === 'read-only'
  })
}

/** Registry order, so every derived list comes out in one order. */
const TENANT_ROLE_ORDER = [
  'TENANT_ADMIN',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'READONLY_AUDITOR',
  'WORKER',
] as const satisfies readonly TenantRoleId[]

/* ==================================================================== *
 * REACH
 * ==================================================================== */

/**
 * Who is offered this module's routes — the ONE implementation of the rule,
 * `rolesReachingByMatrix` from `@/surfaces/doh/modules`, applied to the real
 * fourteen rows. Not a hand-written rail, and not catalogue B's cell.
 *
 * CATALOGUE B IS NARROWER, AND MEASURABLY. `SCR-DOH-11`'s "Roles that can
 * open it" cell (L48105) names the Supervisor alone, while row 2 (L27695)
 * gives the Tenant Admin unconditional `Allowed` on the very capability that
 * screen is. Wave 0 already registered that narrowing in
 * `DOH_CATALOGUE_B_REACH_NARROWER`; this module reads the matrix and the
 * screen registry keeps the quotation, so neither has to be trusted twice.
 *
 * REGISTERED NOW, AND IT WAS A SHARED-FILE CONSTRAINT RATHER THAN A RULING.
 * `MOD-DOH-05` was listed in `DOH_OUT_OF_SLICE_MODULES` for the wave in
 * which this module was built, so `dohModulesReachedBy` offered these routes
 * to nobody and `dohScreenReach('SCR-DOH-10')` answered `null`. Registering
 * meant editing `src/surfaces/doh/modules.ts`, which three sibling module
 * tasks were consuming concurrently, so it belonged to the task that could
 * make it once for all seven. It has been made. The reach below is still
 * computed here rather than read from the spine, and that is deliberate:
 * `tests/unit/doh-job.test.ts` compares this value against the generated one,
 * and a wrapper that just re-read the generated field would make the
 * comparison vacuous.
 */
export const MOD_DOH_05_REACH: readonly TenantRoleId[] = rolesReachingByMatrix(
  MOD_DOH_05_MATRIX,
  cellStatus,
)

/* ==================================================================== *
 * WHAT THE SOURCE DOES NOT SAY
 * ==================================================================== */

export interface Doh05Silence {
  readonly about: string
  readonly what: string
  readonly sourceRef: string
}

/**
 * Recorded rather than filled in. A cell this build invented a cause for
 * would read back as the source's own.
 */
export const MOD_DOH_05_UNSPECIFIED_IN_SOURCE = [
  {
    about: 'Row 11, approving half — Tenant Admin and Supervisor',
    what: 'L27704 states the approving half of this cell for the Quality Manager and for nobody else. Both other cells describe proposing. Whether "the same approval gate" carries row 4’s standings across to a recurrence proposal is not stated, so those two cells are rendered as silent rather than as a refusal or a grant.',
    sourceRef: 'L27704; `FUNC-DOH-05-2.2.1` (L27768)',
  },
  {
    about: 'Row 4, Tenant Admin — the escape’s precondition',
    what: 'The escape needs an identity holding both the Tenant Admin role and an approver role. The source states the clause and never states how such an identity is held or displayed, and this build models one role per identity, so no persona can reach the permitted side of it.',
    sourceRef: 'L27697',
  },
  {
    about: 'Rows 1-14 — where a custom Job Type is created',
    what: 'Row 6 gives the Tenant Admin `Allowed` on creating a custom Job Type and names no screen. Row 8 names the tenant administration area explicitly for the tag mapping, and this module’s card lists that area as a dependency for the MAPPING and the learning-adoption timing only (L27685). Row 6 is therefore classified as this module’s own screen rather than moved elsewhere on the strength of a neighbouring row.',
    sourceRef: 'L27699; L27685',
  },
] as const satisfies readonly Doh05Silence[]

/* ==================================================================== *
 * DEC-AREA-001 — CONSUMED, NOT RE-DERIVED
 * ==================================================================== */

/**
 * `DEC-AREA-001` (L27650) is NOT an open decision in the disclosure canon's
 * sense and is deliberately not registered there. It is an ADOPTED WORKING
 * POSITION whose client ratification is still owed, and the distinction is
 * the whole classification: the canon's component renders every reading with
 * none preferred, while this decision HAS a position taken on the
 * instruction of the party commissioning the blueprint. Rendering it as an
 * unsettled question would understate what has been decided; rendering it as
 * settled would overstate it. It renders as what it is.
 */
export const DEC_AREA_001_POSITION = {
  id: 'DEC-AREA-001',
  classification: 'Derived Clarification — adopted working position',
  neverClassifiedAs: 'SoW Fact',
  ratification: 'Outstanding. The client’s product owner ratifies or reverses it.',
  position:
    'A Job binds to exactly one parent node, at the deepest hierarchy level its tenant configured — an Area where the tenant configured no deeper level, a Location (Cell) where it did.',
  consequence:
    'Every Area-keyed rule — Area scoping, per-Area certification scope, Area-level clearance escalation — resolves from the Job’s parent node by WALKING UP the node path, never by reading a stored Area field. This module stores `parentNodeId` and no Area.',
  ifReversed:
    'If the client rules one Area per Job hard, tenants that configured the Location (Cell) level cannot anchor Jobs there and the Part II platform-wide contract has to be amended.',
  sourceRef: 'L27650; `AC-DOH-05-4` (L27818); `AC-WF-ORG-004-04` (L52670)',
} as const

/**
 * `DEC-TAX-002` (L27654) IS in the shared canon, so the screens render
 * `<DecisionDisclosure id="DEC-TAX-002" />` — the identical wording and
 * locator set the Studio screens render, because there is only one record.
 * What belongs to this module is the consequence, and it is a NEGATIVE one:
 * `seededJobTypes` and `seededServiceTypes` in `@/domain/state` are empty
 * and must stay empty. Eight and eight are source-confirmed COUNTS; the
 * sixteen names are owed by the client and are never invented.
 */
export const DEC_TAX_002_SEEDED_COUNTS = {
  jobTypes: 8,
  serviceTypes: 8,
  shippedAtV1: 0,
  sourceRef: 'L27654',
} as const
