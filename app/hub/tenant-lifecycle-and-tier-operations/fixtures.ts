import type { TenantState, WriteAction } from '@/surfaces/doh/tenant-state'
import type { ScreenStateId } from '@/ui/screen-state'
import { saTenant } from '@/surfaces/sa/tenants'
import type { TenantRoleId } from '../HubShell'

/**
 * MOD-DOH-01 — Tenant Lifecycle and Tier Operations. Seeded fixture data for
 * `SCR-DOH-03`, the tier and usage read view.
 *
 * Determinism (spec §2): no `Date.now()`, `new Date()` or `Math.random()`
 * anywhere below. Every as-of stamp is a fixed string, because a meter's
 * honesty comes from saying WHEN it was true.
 *
 * Support-not-surveillance, held here without exception: the meter counts
 * Worker-Shifts as a BILLING unit in a tenant period. No table, row or key in
 * this file is grouped by a worker identifier, and nothing here measures a
 * person. MOD-DOH-01 keys nothing on a worker at all.
 */

/** The tenant whose own position this Hub renders, from the one shared name fixture. */
export const HUB_TENANT = saTenant('TEN-BRIGHTBIKES')

/* ------------------------------------------------------------------ *
 * The tier record. Region 1 of SCR-DOH-03 quotes `meterDefinition`
 * VERBATIM from this record — the screen never paraphrases it.
 * ------------------------------------------------------------------ */

export type TierId = 'starter' | 'growth' | 'enterprise'

export const TIER_IDS = ['starter', 'growth', 'enterprise'] as const satisfies readonly TierId[]

type MissingFromTierIds = Exclude<TierId, (typeof TIER_IDS)[number]>
const _tierIdsExhaustive: MissingFromTierIds extends never ? true : never = true
void _tierIdsExhaustive

export interface TierRecord {
  readonly id: TierId
  readonly name: string
  /** Quoted verbatim into region 1. The tier record owns this wording. */
  readonly meterDefinition: string
  /** Worker-Shifts in the current period. */
  readonly ceiling: number
  readonly entitlementNote: string
}

export const TIER_RECORDS = [
  {
    id: 'starter',
    name: 'Starter',
    meterDefinition:
      'One Worker-Shift is one worker scheduled to one shift on one calendar day. It is counted once per calendar day however many Runs that worker touches, and it is the only billable unit.',
    ceiling: 250,
    entitlementNote: 'One Site. No burst band above the ceiling.',
  },
  {
    id: 'growth',
    name: 'Growth',
    meterDefinition:
      'One Worker-Shift is one worker scheduled to one shift on one calendar day. It is counted once per calendar day however many Runs that worker touches, and it is the only billable unit.',
    ceiling: 600,
    entitlementNote: 'Up to five Sites. Burst band open from the ceiling to 125 per cent of it.',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    meterDefinition:
      'One Worker-Shift is one worker scheduled to one shift on one calendar day. It is counted once per calendar day however many Runs that worker touches, and it is the only billable unit.',
    ceiling: 2000,
    entitlementNote: 'Sites unlimited. Burst band open from the ceiling to 125 per cent of it.',
  },
] as const satisfies readonly TierRecord[]

export function tierRecord(id: TierId): TierRecord {
  const found = TIER_RECORDS.find((t) => t.id === id)
  if (found === undefined) throw new Error(`No tier record for ${id}`)
  return found
}

/** The seeded tier and its next step up the ladder. The source names no tier
 *  picker on this screen, so an upgrade moves one step and says so. */
export const SEEDED_TIER: TierId = 'growth'
export const UPGRADE_TARGET_TIER: TierId = 'enterprise'
export const DOWNGRADE_TARGET_TIER: TierId = 'starter'

/** AC-DOH-01-2 (L27040), AC-GOAL-065 (L2241): consumption carries forward
 *  across a tier change and never resets. One number, seeded once. */
export const SEEDED_CONSUMPTION = 512
export const CONSUMPTION_AS_OF = '2026-08-19 06:00 tenant time'
export const CONSUMPTION_PERIOD = 'the current calendar month, 1 to 19 August 2026'

/** STATE-02, L48009: "Loading never renders a zero — a count that has not
 *  arrived is shown as a placeholder, not as '0'." This IS that placeholder. */
export const LOADING_PLACEHOLDER = 'Not yet arrived'

/**
 * The write class each of the two request controls is gated on, named here
 * so the screen looks a row up in the ONE write-class table rather than
 * re-deriving a suspension rule beside the control.
 *
 * The upgrade has its own class. The downgrade REQUEST has none — the source
 * enumerates no such write class — so it is mapped onto the configuration-edit
 * class the source does name, under the same stricter reading that governs
 * every silence about tenant-state governance. The mapping is stated on
 * screen and in the unresolved panel; it adds no row to the table.
 */
export const UPGRADE_TIER: WriteAction = 'upgrade-tier'
export const DOWNGRADE_REQUEST_CLASS: WriteAction = 'edit-configuration'

/* ------------------------------------------------------------------ *
 * The ladder. `OBJ-DOH-TENSTATE` carries four ladder positions; the three
 * thresholds are marked on the bar and the burst band is shaded.
 * ------------------------------------------------------------------ */

export type LadderPosition =
  | 'below_80'
  | 'at_or_above_80'
  | 'at_or_above_100_burst'
  | 'above_125_flagged'

export const LADDER_POSITIONS = [
  'below_80',
  'at_or_above_80',
  'at_or_above_100_burst',
  'above_125_flagged',
] as const satisfies readonly LadderPosition[]

type MissingFromLadder = Exclude<LadderPosition, (typeof LADDER_POSITIONS)[number]>
const _ladderExhaustive: MissingFromLadder extends never ? true : never = true
void _ladderExhaustive

export interface LadderThreshold {
  readonly percent: number
  readonly label: string
  readonly meaning: string
}

export const LADDER_THRESHOLDS = [
  {
    percent: 80,
    label: '80 per cent of the ceiling',
    meaning: 'The first mark. Consumption is approaching the ceiling and the position changes.',
  },
  {
    percent: 100,
    label: '100 per cent of the ceiling',
    meaning: 'The ceiling itself, and the lower edge of the burst band.',
  },
  {
    percent: 125,
    label: '125 per cent of the ceiling',
    meaning: 'The upper edge of the burst band. Above it the tenant is flagged.',
  },
] as const satisfies readonly LadderThreshold[]

export const LADDER_POSITION_LABEL: Record<LadderPosition, string> = {
  below_80: 'Below 80 per cent of the ceiling',
  at_or_above_80: 'At or above 80 per cent of the ceiling',
  at_or_above_100_burst: 'At or above the ceiling, inside the burst band',
  above_125_flagged: 'Above 125 per cent of the ceiling, flagged',
}

/**
 * The one place a percentage becomes a ladder position. A pure function over
 * the four `OBJ-DOH-TENSTATE` values, unit-tested at every boundary — the
 * boundaries are inclusive-below, which is the difference between "at the
 * ceiling" reading as inside the burst band and reading as under it.
 */
export function ladderPositionFor(percentOfCeiling: number): LadderPosition {
  if (percentOfCeiling >= 125) return 'above_125_flagged'
  if (percentOfCeiling >= 100) return 'at_or_above_100_burst'
  if (percentOfCeiling >= 80) return 'at_or_above_80'
  return 'below_80'
}

/** `OBJ-DOH-TENSTATE`'s tier-change vocabulary. Two values, and no third:
 *  the Hub records a downgrade REQUEST and never executes one. */
export type TierChangeState = 'none' | 'pending_downgrade'

export const TIER_CHANGE_STATES = ['none', 'pending_downgrade'] as const satisfies
  readonly TierChangeState[]

type MissingFromTierChange = Exclude<TierChangeState, (typeof TIER_CHANGE_STATES)[number]>
const _tierChangeExhaustive: MissingFromTierChange extends never ? true : never = true
void _tierChangeExhaustive

/* ------------------------------------------------------------------ *
 * Region 4: Active Locations. SITE LEVEL ONLY — the source counts Sites
 * and nothing beneath them, and Cell, Job and worker scoping is deferred
 * beyond V1, so it renders ABSENT rather than disabled (slice gate 6).
 * ------------------------------------------------------------------ */

export interface SiteCountRow {
  readonly id: string
  readonly name: string
  readonly active: boolean
  readonly note: string
}

export const SITE_COUNT = [
  {
    id: 'SITE-ASHFIELD-ROAD',
    name: 'Ashfield Road plant',
    active: true,
    note: 'The default Site created at provisioning, since renamed (D25).',
  },
  {
    id: 'SITE-CANAL-WORKS',
    name: 'Canal Works',
    active: true,
    note: 'Added by the Tenant Admin in April 2026.',
  },
  {
    id: 'SITE-OLD-DEPOT',
    name: 'Old Depot',
    active: false,
    note: 'Archived in June 2026. Archived Sites leave the active count and stay on the record.',
  },
] as const satisfies readonly SiteCountRow[]

export const ACTIVE_SITE_COUNT = SITE_COUNT.filter((s) => s.active).length

/* ------------------------------------------------------------------ *
 * Region 5: suspension status, one row per operating state. `pilot` is
 * NOT here: it is an orthogonal flag, never a sixth state (D19).
 * ------------------------------------------------------------------ */

export interface SuspensionStatusRow {
  readonly whatItMeansHere: string
  readonly whoChangesIt: string
}

export const SUSPENSION_STATUS: Record<TenantState, SuspensionStatusRow> = {
  active: {
    whatItMeansHere: 'Normal operation. No write class is restricted by tenant state.',
    whoChangesIt:
      'Nobody in this workspace. A transition into a suspension is the client platform team’s act, made on the Super Admin console.',
  },
  'soft-suspended': {
    whatItMeansHere:
      'Operations continue in full. New Jobs, Workers, locations, shifts and parts stop, all configuration edits stop, and a tier upgrade stops with them (D15). Recertification and clearances deliberately keep working — the workspace keeps operating rather than growing.',
    whoChangesIt:
      'The client platform team. The default trigger is 30 days of non-payment; release is the operator’s signal.',
  },
  'hard-suspended': {
    whatItMeansHere:
      'Read-only except the enumerated completion pipeline: in-flight Runs finish, steps execute, data captures and syncs, a substitution may complete an in-flight Run, summaries compute and close, mandatory notifications go, audit is written. No new Run starts.',
    whoChangesIt: 'The client platform team, at 60 days of non-payment by default.',
  },
  'compliance-suspended': {
    whatItMeansHere:
      'All logins are blocked immediately, so no signed-in user remains in this workspace to write anything. The worker on the device meets the fixed three-sentence message (D17).',
    whoChangesIt:
      'The client platform team, through the dual-authorised compliance path. No control in this workspace touches it.',
  },
  archived: {
    whatItMeansHere:
      'The workspace is closed. The source states no open write class for a closed tenant, and in that silence the stricter interpretation applies (L26547).',
    whoChangesIt: 'The client platform team.',
  },
}

/* ------------------------------------------------------------------ *
 * `tenant_state_history`, read through the tenant's own audit records
 * (matrix row 12). Read-only for the Tenant Admin and the Auditor.
 * Every actor here is a team or an automatic trigger. No row keys on a
 * worker, because no transition of a tenant's commercial state is a
 * behavioural measure of a person.
 * ------------------------------------------------------------------ */

export interface TenantStateHistoryRow {
  readonly sequence: number
  readonly at: string
  readonly from: string
  readonly to: string
  readonly cause: string
  readonly actor: string
}

export const TENANT_STATE_HISTORY = [
  {
    sequence: 1,
    at: '2026-03-01 09:14 tenant time',
    from: 'awaiting_administrator',
    to: 'active',
    cause: 'The first Tenant Admin accepted the invitation and authenticated.',
    actor: 'Client platform team',
  },
  {
    sequence: 2,
    at: '2026-04-25 11:02 tenant time',
    from: 'active',
    to: 'active',
    cause: 'Pilot term converted to a paying subscription. The tenant identifier was preserved.',
    actor: 'Client platform team',
  },
  {
    sequence: 3,
    at: '2026-06-18 00:05 tenant time',
    from: 'active',
    to: 'soft-suspended',
    cause: 'Non-payment reached 30 days.',
    actor: 'Automatic trigger, recorded against the client platform team',
  },
  {
    sequence: 4,
    at: '2026-06-24 15:41 tenant time',
    from: 'soft-suspended',
    to: 'active',
    cause: 'The operator signalled that the account was settled.',
    actor: 'Client platform team',
  },
] as const satisfies readonly TenantStateHistoryRow[]

/* ------------------------------------------------------------------ *
 * The twelve-row control matrix, verified at L26883-L26896. "Every cell
 * carries an explicit status" (L26881) — so every cell below carries one,
 * and the screen renders all five columns for every row.
 * ------------------------------------------------------------------ */

export type MatrixStatus =
  | 'Allowed'
  | 'Allowed with conditions'
  | 'Read-only'
  | 'Unavailable'
  | 'Explicitly prohibited'
  | 'Not applicable'

export type ControlId =
  | 'view-tier-and-consumption'
  | 'view-ladder-position'
  | 'view-suspension-status'
  | 'see-suspension-banner'
  | 'see-compliance-message'
  | 'request-tier-upgrade'
  | 'request-tier-downgrade'
  | 'execute-downgrade'
  | 'change-suspension-state'
  | 'change-ladder-thresholds'
  | 'view-tenant-group-membership'
  | 'read-tenant-state-history'

export interface MatrixCell {
  readonly status: MatrixStatus
  /** Never blank: a blank cell is an unanswered question (L10238). */
  readonly detail: string
}

export interface ControlMatrixRow {
  readonly id: ControlId
  readonly control: string
  readonly byRole: Readonly<Record<TenantRoleId, MatrixCell>>
  /** How this row renders on SCR-DOH-03, by the three-rendering rule. */
  readonly rendering: string
  readonly effect: string
  readonly sourceRef: string
}

const READ_ONLY_FOR_ADMIN_AND_AUDITOR: Readonly<Record<TenantRoleId, MatrixCell>> = {
  TENANT_ADMIN: { status: 'Read-only', detail: 'Reads the tenant’s own position.' },
  SUPERVISOR: { status: 'Unavailable', detail: 'Holds it in no scope; the route is not offered.' },
  QUALITY_MANAGER: {
    status: 'Unavailable',
    detail: 'Holds it in no scope; the route is not offered.',
  },
  READONLY_AUDITOR: { status: 'Read-only', detail: 'Reads the tenant’s own position.' },
  WORKER: { status: 'Unavailable', detail: 'Holds no Hub screen at all (D11).' },
}

const PROHIBITED_FOR_THE_OTHER_FOUR = {
  SUPERVISOR: {
    status: 'Explicitly prohibited',
    detail: 'The commercial relationship is not the Supervisor’s.',
  },
  QUALITY_MANAGER: {
    status: 'Explicitly prohibited',
    detail: 'The commercial relationship is not the Quality Manager’s.',
  },
  READONLY_AUDITOR: {
    status: 'Explicitly prohibited',
    detail: 'Reads tenant-wide records and takes no action at all.',
  },
  WORKER: { status: 'Explicitly prohibited', detail: 'Holds no Hub screen at all (D11).' },
} as const satisfies Readonly<Record<Exclude<TenantRoleId, 'TENANT_ADMIN'>, MatrixCell>>

function prohibitedForAllFive(detail: string): Readonly<Record<TenantRoleId, MatrixCell>> {
  return {
    TENANT_ADMIN: { status: 'Explicitly prohibited', detail },
    SUPERVISOR: { status: 'Explicitly prohibited', detail },
    QUALITY_MANAGER: { status: 'Explicitly prohibited', detail },
    READONLY_AUDITOR: { status: 'Explicitly prohibited', detail },
    WORKER: { status: 'Explicitly prohibited', detail },
  }
}

export const CONTROL_MATRIX = [
  {
    id: 'view-tier-and-consumption',
    control: 'View tier, entitlements, caps and consumption',
    byRole: READ_ONLY_FOR_ADMIN_AND_AUDITOR,
    rendering:
      'Regions 1 and 2 render for the two reading roles. For the other three the route is ABSENT, and a deep link meets STATE-05.',
    effect: 'A read. Nothing on this screen changes the tier record.',
    sourceRef: 'L26885',
  },
  {
    id: 'view-ladder-position',
    control: 'View ladder position and burst-band status',
    byRole: READ_ONLY_FOR_ADMIN_AND_AUDITOR,
    rendering: 'Region 3, with the three thresholds marked and the burst band shaded.',
    effect: 'A read.',
    sourceRef: 'L26886',
  },
  {
    id: 'view-suspension-status',
    control: 'View suspension status',
    byRole: READ_ONLY_FOR_ADMIN_AND_AUDITOR,
    rendering:
      'Region 5. Catalogue A carries this as a screen of its own and catalogue B has no row for it, so it is built as a region of SCR-DOH-03 and not as a route (D1).',
    effect: 'A read.',
    sourceRef: 'L26887',
  },
  {
    id: 'see-suspension-banner',
    control: 'See the suspension banner in soft or hard',
    byRole: {
      TENANT_ADMIN: { status: 'Allowed', detail: 'Sees the banner in the Hub chrome.' },
      SUPERVISOR: {
        status: 'Not applicable',
        detail: 'No other user sees anything in soft or hard state.',
      },
      QUALITY_MANAGER: {
        status: 'Not applicable',
        detail: 'No other user sees anything in soft or hard state.',
      },
      READONLY_AUDITOR: {
        status: 'Not applicable',
        detail: 'No other user sees anything in soft or hard state.',
      },
      WORKER: {
        status: 'Not applicable',
        detail: 'No other user sees anything in soft or hard state.',
      },
    },
    rendering:
      'The Hub chrome’s own banner slot, not a control. It says workspace, never tenant (D18).',
    effect: 'A message. It carries no action.',
    sourceRef: 'L26888',
  },
  {
    id: 'see-compliance-message',
    control: 'See the compliance-suspension message',
    byRole: {
      TENANT_ADMIN: { status: 'Allowed', detail: 'The fixed message, unrewordable.' },
      SUPERVISOR: { status: 'Allowed', detail: 'The fixed message, unrewordable.' },
      QUALITY_MANAGER: { status: 'Allowed', detail: 'The fixed message, unrewordable.' },
      READONLY_AUDITOR: { status: 'Allowed', detail: 'The fixed message, unrewordable.' },
      WORKER: { status: 'Allowed', detail: 'The fixed message, on the device.' },
    },
    rendering:
      'Quoted in region 5 when the state is compliance-suspended. AC-CMD-007 forbids rewording it, so it is quoted rather than paraphrased (D17).',
    effect: 'A message. It carries no action.',
    sourceRef: 'L26889',
  },
  {
    id: 'request-tier-upgrade',
    control: 'Request a tier upgrade',
    byRole: {
      TENANT_ADMIN: {
        status: 'Allowed',
        detail: 'Self-service, effective immediately.',
      },
      ...PROHIBITED_FOR_THE_OTHER_FOUR,
    },
    rendering:
      'A live control for the Tenant Admin, gated by the write-class table first. ABSENT for the Auditor, whose whole role takes no action.',
    effect: 'Consumption carries forward and never resets (AC-DOH-01-2, AC-GOAL-065).',
    sourceRef: 'L26890',
  },
  {
    id: 'request-tier-downgrade',
    control: 'Request a tier downgrade',
    byRole: {
      TENANT_ADMIN: {
        status: 'Allowed with conditions',
        detail: 'Records a request only. Execution is the client platform team’s.',
      },
      ...PROHIBITED_FOR_THE_OTHER_FOUR,
    },
    rendering:
      'A live control for the Tenant Admin. Its outcome renders as a recorded request, never as a completed downgrade.',
    effect: 'Sets the tier-change state to pending_downgrade. Nothing is executed here.',
    sourceRef: 'L26891',
  },
  {
    id: 'execute-downgrade',
    control: 'Execute a downgrade',
    byRole: prohibitedForAllFive('Prohibited for every tenant role, the Tenant Admin included.'),
    rendering: 'ABSENT for all five. Nothing is drawn where it would sit — only the note saying why.',
    effect: 'None here. The client platform team executes a recorded request.',
    sourceRef: 'L26892',
  },
  {
    id: 'change-suspension-state',
    control: 'Change a suspension state',
    byRole: prohibitedForAllFive('Prohibited for every tenant role, the Tenant Admin included.'),
    rendering: 'ABSENT for all five. A workspace cannot lift its own suspension.',
    effect: 'None here.',
    sourceRef: 'L26893',
  },
  {
    id: 'change-ladder-thresholds',
    control: 'Change ladder thresholds',
    byRole: prohibitedForAllFive('Set per tenant in the Super Admin console, not here.'),
    rendering: 'ABSENT for all five. The thresholds render as read values with no control beside them.',
    effect: 'None here.',
    sourceRef: 'L26894',
  },
  {
    id: 'view-tenant-group-membership',
    control: 'View tenant-group membership',
    byRole: {
      TENANT_ADMIN: {
        status: 'Not applicable',
        detail: 'Groups are an internal label of the client’s team.',
      },
      SUPERVISOR: {
        status: 'Not applicable',
        detail: 'Groups are an internal label of the client’s team.',
      },
      QUALITY_MANAGER: {
        status: 'Not applicable',
        detail: 'Groups are an internal label of the client’s team.',
      },
      READONLY_AUDITOR: {
        status: 'Not applicable',
        detail: 'Groups are an internal label of the client’s team.',
      },
      WORKER: {
        status: 'Not applicable',
        detail: 'Groups are an internal label of the client’s team.',
      },
    },
    rendering:
      'ABSENT, with the reason in the note. AC-DOH-01-10 makes the absence testable: no group name reaches any tenant’s Hub.',
    effect: 'None. No group name appears anywhere on this surface.',
    sourceRef: 'L26895, AC-DOH-01-10 L27048',
  },
  {
    id: 'read-tenant-state-history',
    control: 'Read tenant_state_history via audit',
    byRole: READ_ONLY_FOR_ADMIN_AND_AUDITOR,
    rendering: 'A read-only table below the five regions, with no edit, annotate or delete control.',
    effect: 'A read of the tenant’s own audit records.',
    sourceRef: 'L26896',
  },
] as const satisfies readonly ControlMatrixRow[]

type MissingFromMatrix = Exclude<ControlId, (typeof CONTROL_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

export function controlRow(id: ControlId): ControlMatrixRow {
  const found = CONTROL_MATRIX.find((r) => r.id === id)
  if (found === undefined) throw new Error(`No control matrix row for ${id}`)
  return found
}

/**
 * The allowed-roles list every `evaluateAccess` call on this screen passes,
 * derived from the matrix ABOVE rather than typed a second time beside the
 * control. A status change in the table moves the affordance with it.
 */
export function rolesWithStatus(
  id: ControlId,
  statuses: readonly MatrixStatus[],
): readonly TenantRoleId[] {
  const row = controlRow(id)
  return (Object.keys(row.byRole) as readonly TenantRoleId[]).filter((role) => {
    const cell = row.byRole[role]
    return statuses.includes(cell.status)
  })
}

/**
 * These two are never the full `MatrixStatus` union — `Unavailable`,
 * `Explicitly prohibited` and `Not applicable` are prohibition tokens, not
 * acting or reading tokens, and no role holding one of those ever reaches
 * `decide()` below. An explicit `readonly MatrixStatus[]` annotation here
 * would widen away that fact and let `Unavailable` typecheck as an acting or
 * reading status it can never actually be — `as const satisfies` keeps the
 * literal tuple type instead, so the two stay the true, narrower closed sets
 * they are (matches the `as const satisfies readonly T[]` convention used
 * for every closed vocabulary in this file).
 */
export const ACTING_STATUSES = [
  'Allowed',
  'Allowed with conditions',
] as const satisfies readonly MatrixStatus[]
export const READING_STATUSES = [
  'Allowed',
  'Allowed with conditions',
  'Read-only',
] as const satisfies readonly MatrixStatus[]

/* ------------------------------------------------------------------ *
 * The five regions of SCR-DOH-03, in the fixed order the source states
 * three times (L27029, FUNC-DOH-12-3.2.1 L29100, AC-DOH-12-6 L29136).
 * ------------------------------------------------------------------ */

export const READ_VIEW_REGIONS = [
  'Meter definition',
  'Current-period consumption against ceiling',
  'Ladder position',
  'Active Locations',
  'Suspension status',
] as const satisfies readonly string[]

/* ------------------------------------------------------------------ *
 * Screen states. STATE-01 never applies — a tenant always has a tier.
 * ------------------------------------------------------------------ */

export const APPLICABLE_SCREEN_STATES = [
  'STATE-02',
  'STATE-03',
  'STATE-04',
  'STATE-05',
  'STATE-06',
  'STATE-08',
  'STATE-12',
  'STATE-13',
] as const satisfies readonly ScreenStateId[]

export type ApplicableScreenStateId = (typeof APPLICABLE_SCREEN_STATES)[number]

export interface InapplicableScreenState {
  readonly id: ScreenStateId
  readonly why: string
}

export const INAPPLICABLE_SCREEN_STATES = [
  {
    id: 'STATE-01',
    why: 'Never. A tenant always has a tier, so there is no empty tier and usage view to render.',
  },
  {
    id: 'STATE-07',
    why: 'Never. Only the Frontline Worker Application has a true offline state; the Hub is a web surface, and connection loss splits three ways instead (D7).',
  },
  {
    id: 'STATE-09',
    why: 'Never. Nothing on this screen is device-facing, so no command travels and nothing is ever queued.',
  },
  {
    id: 'STATE-10',
    why: 'Never in this slice. No agent creates, edits or proposes anything here, and the module is fully functional with all agents paused.',
  },
  {
    id: 'STATE-11',
    why: 'Never in this slice, for the same reason: nothing here depends on a model.',
  },
] as const satisfies readonly InapplicableScreenState[]

/* ------------------------------------------------------------------ *
 * Absent by rule. Nothing is drawn where each would sit.
 * ------------------------------------------------------------------ */

export interface AbsentByRule {
  readonly label: string
  readonly note: string
}

export const ABSENT_BY_RULE = [
  {
    label: 'Execute a downgrade',
    note: 'Explicitly prohibited for all five tenant roles. The Hub records a downgrade request; the client platform team executes it. Nothing here can be mistaken for the execution.',
  },
  {
    label: 'Change a suspension state',
    note: 'Explicitly prohibited for all five tenant roles, the Tenant Admin included. A workspace cannot suspend, escalate or release itself, and a disabled control here would imply that someone one day might.',
  },
  {
    label: 'Change ladder thresholds',
    note: 'Explicitly prohibited for all five tenant roles: the thresholds are set per tenant in the Super Admin console. They render above as read values with no control beside them.',
  },
  {
    label: 'View tenant-group membership',
    note: 'Not applicable for all five: groups are an internal label of the client’s team and are not visible in any tenant’s Hub. No group name appears anywhere on this surface, which AC-DOH-01-10 makes testable.',
  },
  {
    label: 'Deferred scoping',
    note: 'Cell, Job and worker scoping is deferred beyond V1 and no rule may depend on it, so it renders ABSENT rather than disabled — a disabled scope picker would imply a roadmap promise the source has not made.',
  },
] as const satisfies readonly AbsentByRule[]

/* ------------------------------------------------------------------ *
 * The decisions this screen renders. Each appears on screen where a
 * reviewer can see it, not only in a comment.
 * ------------------------------------------------------------------ */

export interface RenderedDecision {
  readonly ref: string
  readonly statement: string
}

export const DECISIONS_ON_SCREEN = [
  {
    ref: 'D1',
    statement:
      'Screen catalogue B is canonical. SCR-DOH-03 is an annotation on this module, never a route key, and the suspension status panel — which only catalogue A carries as a screen of its own — is built here as a region rather than as a second route.',
  },
  {
    ref: 'D7',
    statement:
      'Connection loss splits three ways: loaded content degrades to the last figures with a freshness marker and an as-of time, a read that fails outright names what failed and whether anything was written, and every write control disables rather than queues. Reconnection refetches the tenant state before any write is re-enabled.',
  },
  {
    ref: 'D8',
    statement:
      'Nine permission tokens, not six. Every refusal on this screen is one of the nine, produced by the shared evaluator, and none of them is a blank cell.',
  },
  {
    ref: 'D11',
    statement:
      'The Worker holds no Hub screen. The cost is stated rather than hidden: a worker without a device in hand cannot check their own certification expiry.',
  },
  {
    ref: 'D14',
    statement:
      'One audit truth per tenant. The state history below is a seeded fixture of the tenant’s own audit records, not a second store built to make this slice self-contained; the audit store itself is built in slice 10.',
  },
  {
    ref: 'D15',
    statement:
      'A tier upgrade is blocked under soft suspension, because letting a workspace that has not paid for 30 days self-service a higher ceiling is the riskier default. The counter-argument is recorded: operations continue in full under soft suspension, and an upgrade is arguably an operation rather than growth. This is a coin-flip the client should settle.',
  },
  {
    ref: 'D19',
    statement:
      'Five operating states here, and pilot is an orthogonal flag rather than a sixth state — a pilot tenant is functionally identical to a paying tenant. Draft and awaiting-administrator belong to the platform console and never render in the Hub, because in draft no user can authenticate.',
  },
  {
    ref: 'D21',
    statement:
      'The module identity card governs this object’s state vocabulary: the state NAMES are a derived clarification and renameable, while the behaviours behind them are fact.',
  },
] as const satisfies readonly RenderedDecision[]

/* ------------------------------------------------------------------ *
 * What the source does not define, and what it answers twice.
 * ------------------------------------------------------------------ */

export const UNSPECIFIED_IN_SOURCE = [
  'No tier picker is defined for the upgrade control. The matrix names "request a tier upgrade" and nothing states which tier it goes to, so this storyboard moves one step up the seeded ladder and says so rather than drawing a chooser the source never described.',
  'No control is defined for cancelling or withdrawing a recorded downgrade request, and no expiry is stated for one.',
  'No effective date, proration, price, invoice or payment affordance is defined anywhere in this module.',
  'No refresh control is defined for the consumption figure, and no polling interval is stated. The as-of stamp is the only freshness the source gives a reader.',
  'No notification is defined for crossing a ladder threshold from inside the Hub.',
  'No export of the consumption figure or of the tenant state history is defined for any tenant role.',
  'No control is defined for a tenant to see, propose or set its own ladder thresholds; only the platform console sets them.',
] as const

export const UNRESOLVED_IN_SOURCE = [
  'Two screen catalogues collide on the same-looking identifier. Catalogue B, which carries roles-that-can-open, module-and-feature and navigation entry point, is canonical here; the three-digit form is forbidden anywhere in this codebase because the two catalogues disagree about which screen it names.',
  'The suspension status panel exists as a screen in catalogue A only, and catalogue B folds it away. It is built as a region of this screen rather than as a route, so no route is keyed on a number the two catalogues disagree about.',
  'Whether a tier upgrade should be blocked under soft suspension is a coin-flip. The stricter reading blocks it and the source instructs the stricter reading where tenant-state governance is ambiguous; the counter-argument is that soft suspension leaves operations running in full. Recorded rather than silently settled.',
  'The write-class enumerations name no downgrade REQUEST. This screen maps it onto the configuration-edit class the source does name, under the same stricter reading, and states the mapping rather than adding a row to the write-class table.',
  'The module card’s roles-allowed row lists all five tenant roles, which means roles the module TOUCHES, not roles that can open the screen. Visibility here is driven only by the twelve-row control matrix; one census reader took the roles-allowed row for an access list, and that reading is recorded as an erratum.',
  'The Read-only Auditor’s two request controls are rendered ABSENT rather than disabled. The census states the Auditor sees the identical screen minus the two request buttons, and the Auditor is categorically an actionless role; the competing reading — that a control another role holds on the same screen should render disabled with its reason — is recorded here rather than resolved in silence.',
] as const

/* ------------------------------------------------------------------ *
 * Wording the source forbids rewording. Quoted, never paraphrased.
 * ------------------------------------------------------------------ */

/** D17, the Part IV three-sentence form. AC-CMD-007 forbids rewording it. */
export const COMPLIANCE_SUSPENSION_MESSAGE =
  'Operation suspended. Contact your supervisor. Your work has been saved.'

/** Where a blocked upgrade sends the reader. Not a link: this storyboard
 *  reaches nothing, and a dead link would claim a route it does not have. */
export const PLATFORM_SUPPORT_ROUTE =
  'platform support, through the client’s own support channel'
