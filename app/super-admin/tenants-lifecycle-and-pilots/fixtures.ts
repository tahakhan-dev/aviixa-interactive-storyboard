import type { RoleId } from '@/domain/roles'
import type { CommandState } from '@/surfaces/sa/command-state'
import { saTenant } from '@/surfaces/sa/tenants'
import type { SaFreshness } from '@/surfaces/sa/freshness'

/**
 * MOD-SA-09 seeded fixture data. Spec §8: no backend — every value below is
 * a fixture the reader steps through, never a computed transition.
 *
 * Determinism: no `Date.now()`, `new Date()` or `Math.random()`. Every
 * as-of stamp is a fixed string, because an aggregate's honesty comes from
 * saying WHEN it was true.
 *
 * §6 of the spec, held here without exception: every usage figure is a
 * count of Worker-Shifts in a tenant-month — a billing unit on a commercial
 * ledger. Nothing below the tenant, nothing about a person.
 */

/**
 * The four console roles, in the source's own `ROLE-PLAT-*` spelling, paired
 * with the `RoleId` the policy evaluator already knows. A deliberate subset
 * of `RoleId` (the PLATFORM domain only), so no exhaustiveness check over
 * `RoleId` is possible or wanted — the same treatment `SUPERVISOR_AND_ABOVE`
 * gets in `@/domain/roles`.
 */
export interface TenantPlatformRole {
  readonly sourceId: string
  readonly roleId: RoleId
  readonly name: string
}

export const TENANT_PLATFORM_ROLES = [
  { sourceId: 'ROLE-PLAT-ROOT', roleId: 'ROOT_SUPER_ADMIN', name: 'Root Super Admin' },
  { sourceId: 'ROLE-PLAT-ADMIN', roleId: 'ADMIN', name: 'Admin' },
  { sourceId: 'ROLE-PLAT-ENG', roleId: 'PLATFORM_ENGINEER', name: 'Platform Engineer' },
  { sourceId: 'ROLE-PLAT-SUP', roleId: 'SUPPORT', name: 'Support' },
] as const satisfies readonly TenantPlatformRole[]

/**
 * `OBJ-SA-TENANT`'s eight lifecycle states, in the source's own order
 * (L45003). The state vocabulary at L45004 lists "active" twice — once as
 * the operating state and once as the state a released suspension returns
 * to — so the DISTINCT set is eight, which is what the object entry itself
 * states. The duplicate is a restatement, not a ninth state.
 */
export type TenantLifecycleState =
  | 'invited'
  | 'pilot'
  | 'active'
  | 'soft'
  | 'hard'
  | 'compliance'
  | 'pending downgrade'
  | 'archived'

export const TENANT_LIFECYCLE_STATES = [
  'invited',
  'pilot',
  'active',
  'soft',
  'hard',
  'compliance',
  'pending downgrade',
  'archived',
] as const satisfies readonly TenantLifecycleState[]

type MissingFromStates = Exclude<TenantLifecycleState, (typeof TENANT_LIFECYCLE_STATES)[number]>
const _statesExhaustive: MissingFromStates extends never ? true : never = true
void _statesExhaustive

/** `OBJ-SA-AGGREGATE`'s freshness, applied to the usage figure on each row
 *  (AC-SA-01-03): never a zero, never a blank. */
export type UsageFreshness = Extract<SaFreshness, 'current' | 'stale' | 'unavailable'>

export interface TenantRow {
  readonly id: string
  /** An anonymised label. No link on this console resolves to the record. */
  readonly name: string
  readonly state: TenantLifecycleState
  readonly tier: 'Starter' | 'Growth' | 'Enterprise'
  /** A count of Worker-Shifts in the tenant-month. `null` ONLY where the
   *  freshness is `unavailable`, and then the screen prints "Measure
   *  unavailable" — never the number nought (FB-SA-01, L42858). */
  readonly headlineUsage: string | null
  readonly usageFreshness: UsageFreshness
  readonly usageAsOf: string
  /** Required by `stale`: the age, in words. */
  readonly usageAge?: string
  readonly timeOnPlatform: string
  readonly pilot: boolean
  /** One plain sentence about where this record sits, for the detail page. */
  readonly note: string
}

export const TENANTS = [
  {
    id: 'TEN-BRIGHTBIKES',
    name: saTenant('TEN-BRIGHTBIKES').name,
    state: 'active',
    tier: 'Growth',
    headlineUsage: '164 Worker-Shifts metered in the tenant-month',
    usageFreshness: 'current',
    usageAsOf: '2026-08-16 09:12 platform time',
    timeOnPlatform: '5 months',
    pilot: false,
    note: 'Pilot from 1 March 2026, converted to the Growth tier on 25 April 2026 with the tenant identifier preserved (AC-SA-09-11).',
  },
  {
    id: 'TEN-VALEWORKS',
    name: saTenant('TEN-VALEWORKS').name,
    state: 'pilot',
    tier: 'Starter',
    headlineUsage: '41 Worker-Shifts metered in the tenant-month',
    usageFreshness: 'current',
    usageAsOf: '2026-08-16 09:12 platform time',
    timeOnPlatform: '42 days of a 60-day pilot term',
    pilot: true,
    note: 'Pilot term runs 60 days, extendable to 90 at the client’s discretion (L44931).',
  },
  {
    id: 'TEN-NORTHFORGE',
    name: saTenant('TEN-NORTHFORGE').name,
    state: 'invited',
    tier: 'Starter',
    headlineUsage: null,
    usageFreshness: 'unavailable',
    usageAsOf: '2026-08-14 16:40 platform time, the last computation that completed',
    timeOnPlatform: '2 days since the record was created',
    pilot: false,
    note: 'The first Tenant Admin has not accepted the invitation, so the record sits in its safe draft state and no operating month exists yet.',
  },
  {
    id: 'TEN-CLEARWATER',
    name: saTenant('TEN-CLEARWATER').name,
    state: 'soft',
    tier: 'Growth',
    headlineUsage: 'Last-known-good: 128 Worker-Shifts metered in the tenant-month',
    usageFreshness: 'stale',
    usageAge: '95 minutes old',
    usageAsOf: '2026-08-16 07:37 platform time',
    timeOnPlatform: '14 months',
    pilot: false,
    note: 'Soft suspension blocks master-data writes while runs continue to be created, scheduled and executed (AC-SA-09-03). Only the Tenant Admin sees a banner (AC-SA-09-04).',
  },
  {
    id: 'TEN-HARBOUR',
    name: saTenant('TEN-HARBOUR').name,
    state: 'hard',
    tier: 'Growth',
    headlineUsage: '77 Worker-Shifts metered in the tenant-month',
    usageFreshness: 'current',
    usageAsOf: '2026-08-16 09:12 platform time',
    timeOnPlatform: '2 years, 1 month',
    pilot: false,
    note: 'Hard suspension permits the enumerated completion pipeline and blocks all new runs (AC-SA-09-05).',
  },
  {
    id: 'TEN-MERIDIAN',
    name: saTenant('TEN-MERIDIAN').name,
    state: 'compliance',
    tier: 'Enterprise',
    headlineUsage: '212 Worker-Shifts metered in the tenant-month',
    usageFreshness: 'current',
    usageAsOf: '2026-08-16 09:12 platform time',
    timeOnPlatform: '3 years, 4 months',
    pilot: false,
    note: 'Compliance suspension blocks all logins immediately, stops in-flight runs and locks devices at next contact with the fixed message (AC-SA-09-06). The only platform-side entry is the dual-authorised compliance-emergency path (AC-SA-09-08).',
  },
  {
    id: 'TEN-ASHFIELD',
    name: saTenant('TEN-ASHFIELD').name,
    state: 'pending downgrade',
    tier: 'Enterprise',
    headlineUsage: '188 Worker-Shifts metered in the tenant-month',
    usageFreshness: 'current',
    usageAsOf: '2026-08-16 09:12 platform time',
    timeOnPlatform: '11 months',
    pilot: false,
    note: 'A downgrade never executes mid-cycle: it carries a visible pending-downgrade status and queues behind consumption fit (AC-SA-09-12).',
  },
  {
    id: 'TEN-OLDMILL',
    name: saTenant('TEN-OLDMILL').name,
    state: 'archived',
    tier: 'Starter',
    headlineUsage: null,
    usageFreshness: 'unavailable',
    usageAsOf: '2026-05-31 23:59 platform time, the final operating month',
    timeOnPlatform: '3 years, archived 3 months ago',
    pilot: false,
    note: 'Archived with export-on-archival executed. Inside the free reactivation window of 0 to 6 months (L44950).',
  },
] as const satisfies readonly TenantRow[]

/* ------------------------------------------------------------------ *
 * The lifecycle: every legal transition, who may cause it, and what
 * cannot be undone.
 * ------------------------------------------------------------------ */

export type Reversibility = 'reversible' | 'irreversible' | 'not stated in source'

export interface LifecycleTransition {
  readonly id: string
  readonly from: string
  readonly to: string
  readonly cause: string
  readonly whoMayCause: string
  /** How this transition is offered on THIS screen, in plain words. */
  readonly rendering: string
  readonly reversibility: Reversibility
  readonly reversibilityNote: string
  readonly sourceRef: string
}

export const LIFECYCLE_TRANSITIONS = [
  {
    id: 'TRN-01',
    from: '(no record)',
    to: 'invited',
    cause: 'New Tenant opens a multi-step tenant record form and the record enters the safe draft state.',
    whoMayCause: 'Root Super Admin, Admin',
    rendering: 'Control offered below to the root and the Admin; disabled with a named reason for the Platform Engineer and Support.',
    reversibility: 'reversible',
    reversibilityNote: 'Revoke ends the outstanding invitation; a fresh one may be issued.',
    sourceRef: 'L75180, AC-SA-09-01 L45092',
  },
  {
    id: 'TRN-02',
    from: 'invited',
    to: 'invited (fresh invitation, prior record superseded)',
    cause: 'Reissue to a corrected address, or Resend on the same address.',
    whoMayCause: 'Admin',
    rendering: 'Controls offered below to the Admin alone, as the source names them; every other role sees them disabled with that reason.',
    reversibility: 'reversible',
    reversibilityNote: 'The superseded invitation is recorded rather than discarded.',
    sourceRef: 'L75604',
  },
  {
    id: 'TRN-03',
    from: 'invited',
    to: 'invited (revoked, terminal safe state)',
    cause: 'Revoke, so the invitation cannot activate an account.',
    whoMayCause: 'Admin',
    rendering: 'Control offered below to the Admin alone.',
    reversibility: 'reversible',
    reversibilityNote: 'A fresh invitation may be issued to the same or a corrected address.',
    sourceRef: 'L75604',
  },
  {
    id: 'TRN-04',
    from: 'invited',
    to: 'active',
    cause: 'The first Tenant Admin accepts the invitation and authenticates; Activate tenant then transitions the record.',
    whoMayCause: 'Root Super Admin, Admin — and only once the tenant side has accepted',
    rendering: 'Control offered below, disabled with the outstanding step named while acceptance is outstanding.',
    reversibility: 'reversible',
    reversibilityNote: 'An active tenant may be suspended or archived by the transitions below.',
    sourceRef: 'L75180, L75557',
  },
  {
    id: 'TRN-05',
    from: 'pilot',
    to: 'pilot (extended)',
    cause: 'The pilot term runs 60 days and is extendable to 90 at the client’s discretion.',
    whoMayCause: 'Root Super Admin, Admin',
    rendering: 'No control: the source names pilot extension as an operator action but defines no control entry with an allowed-roles list. Named in the unspecified-in-source panel rather than invented.',
    reversibility: 'not stated in source',
    reversibilityNote: 'The source does not say whether an extension can be withdrawn.',
    sourceRef: 'L44931, SCHED-023 L99434',
  },
  {
    id: 'TRN-06',
    from: 'pilot',
    to: 'active',
    cause: 'Pilot conversion, which preserves the tenant identifier and requires no re-onboarding.',
    whoMayCause: 'Root Super Admin, Admin',
    rendering: 'No control: named as an operator action, with no control entry defined. See the unspecified-in-source panel.',
    reversibility: 'not stated in source',
    reversibilityNote: 'Conversion preserves the tenant identifier; the source states no path back to a pilot.',
    sourceRef: 'AC-SA-09-11 L45102',
  },
  {
    id: 'TRN-07',
    from: 'pilot',
    to: 'pilot (expired)',
    cause: 'Pilot term expiry, a first-class operator action rather than a silent lapse.',
    whoMayCause: 'Admin',
    rendering: 'No control defined; the expiry is a scheduled operator action in the source (SCHED-023).',
    reversibility: 'not stated in source',
    reversibilityNote: 'The source states no reinstatement path for an expired pilot.',
    sourceRef: 'SCHED-022 L99432, SCHED-023 L99434',
  },
  {
    id: 'TRN-08',
    from: 'active',
    to: 'soft',
    cause: 'Non-payment persisting past 30 days, a threshold the client configures, or an explicit operator action.',
    whoMayCause: 'Admin (root holds it too)',
    rendering: 'No control drawn: the source defines no control entry with an allowed-roles list for applying a soft suspension. WF-PLT-004 is a workflow, not a control, so the affordance is named in the unspecified-in-source panel instead of invented.',
    reversibility: 'reversible',
    reversibilityNote: 'Released by an explicit operator signal — see the open decision DEC-SUSP-001.',
    sourceRef: 'WF-PLT-004 L55108, L44919',
  },
  {
    id: 'TRN-09',
    from: 'soft',
    to: 'active',
    cause: 'Release of the soft suspension.',
    whoMayCause: 'Admin, Root Super Admin — subject to DEC-SUSP-001',
    rendering: 'No control drawn, and none drawn inert either: the source defines no release control, so it is absent rather than disabled, with DEC-SUSP-001 named where it would sit.',
    reversibility: 'reversible',
    reversibilityNote: 'A released tenant may be suspended again.',
    sourceRef: 'DEC-SUSP-001 L44927',
  },
  {
    id: 'TRN-10',
    from: 'soft',
    to: 'hard',
    cause: 'Non-payment persisting past 60 days, or a commercial action taken by the client.',
    whoMayCause: 'Root Super Admin, Admin',
    rendering: 'Control offered below with a typed confirmation and a reason class, the confirmation weight the source asks for.',
    reversibility: 'reversible',
    reversibilityNote: 'Lifted by controlled restoration: the Admin proposes and the root approves.',
    sourceRef: 'WF-PLT-004 L55108, L44920, L44984',
  },
  {
    id: 'TRN-11',
    from: 'hard',
    to: 'active',
    cause: 'Controlled restoration after the commercial or security cause is cleared.',
    whoMayCause: 'Admin proposes, Root Super Admin approves',
    rendering: 'No control on this screen: the proposal and its approval live in the change-approval queue (MOD-SA-08).',
    reversibility: 'reversible',
    reversibilityNote: 'A restored tenant may be suspended again by the transitions above.',
    sourceRef: 'WF-PLT-005 L55147',
  },
  {
    id: 'TRN-12',
    from: 'active, soft or hard',
    to: 'compliance',
    cause: 'A security or terms-of-service cause established through the client’s own process.',
    whoMayCause: 'Admin drafts the critical-class request; the Root Super Admin approves. The Platform Engineer is explicitly prohibited.',
    rendering: 'Critical class. The control opens a request and never acts: the Admin the source names as drafter holds it, and so does the root. The Platform Engineer and Support, whom the control entry does not name, see the class badge in place of the action bar.',
    reversibility: 'reversible',
    reversibilityNote: 'Lifted only by controlled restoration under WF-PLT-005, with the root approving.',
    sourceRef: 'L44984, AC-SA-09-06 L45097, AC-SA-09-07 L45098, AC-SA-09-09 L45100, WF-PLT-005 L55147',
  },
  {
    id: 'TRN-13',
    from: 'compliance',
    to: 'active',
    cause: 'Controlled restoration after the compliance cause is closed.',
    whoMayCause: 'Admin proposes, Root Super Admin approves',
    rendering: 'No control on this screen. While the tenant is compliance-suspended, the only platform-side entry is the dual-authorised compliance-emergency path.',
    reversibility: 'reversible',
    reversibilityNote: 'Restoration returns the tenant to active; the access record of the emergency path remains in both audit streams.',
    sourceRef: 'WF-PLT-005 L55147, AC-SA-09-08 L45099',
  },
  {
    id: 'TRN-14',
    from: 'active',
    to: 'pending downgrade',
    cause: 'A tier downgrade, which never executes mid-cycle and queues behind consumption fit.',
    whoMayCause: 'Admin — the tier record itself is owned by Tiers, Entitlements and Caps',
    rendering: 'No control here: the tier record and its approval belong to MOD-SA-11. The status is shown on the list.',
    reversibility: 'reversible',
    reversibilityNote: 'A queued downgrade can be withdrawn before the cycle boundary, per the tier module.',
    sourceRef: 'AC-SA-09-12 L45103',
  },
  {
    id: 'TRN-15',
    from: 'pending downgrade',
    to: 'active (on the lower tier)',
    cause: 'The cycle boundary is reached and consumption fits the lower band.',
    whoMayCause: 'No console role — the queue clears at the cycle boundary',
    rendering: 'No control exists for any account: nothing on this console executes a downgrade mid-cycle.',
    reversibility: 'reversible',
    reversibilityNote: 'A later upgrade is a separate tier change.',
    sourceRef: 'AC-SA-09-12 L45103',
  },
  {
    id: 'TRN-16',
    from: 'active or hard',
    to: 'archived',
    cause: 'Offboarding, with export-on-archival executed before the record closes.',
    whoMayCause: 'Admin proposes; the Root Super Admin approves — erasure and archival execution is a critical-class action',
    rendering: 'No control here: archival execution belongs to Data Lifecycle and Archival (MOD-SA-17) and routes to root approval.',
    reversibility: 'reversible',
    reversibilityNote: 'Reversible only inside the reactivation windows below.',
    sourceRef: 'L55942, SB-030 L65868',
  },
  {
    id: 'TRN-17',
    from: 'archived',
    to: 'active',
    cause: 'Reactivation inside a window: free from 0 to 6 months, and for an engineering-time fee from 6 to 12 months.',
    whoMayCause: 'Root Super Admin, Admin',
    rendering: 'No control defined in the source; the window a tenant sits in is shown on its detail page.',
    reversibility: 'reversible',
    reversibilityNote: 'Inside twelve months the record returns intact.',
    sourceRef: 'L44950',
  },
  {
    id: 'TRN-18',
    from: 'archived',
    to: '(no reactivation)',
    cause: 'Beyond twelve months there is no reactivation. A fresh tenancy is onboarded and the historical data stays exportable for a retrieval fee.',
    whoMayCause: 'No account, including the root',
    rendering: 'Absent for everyone: no control reopens a record past the window.',
    reversibility: 'irreversible',
    reversibilityNote: 'Beyond twelve months the tenancy itself cannot be brought back; only an export remains.',
    sourceRef: 'L44950, L9858',
  },
  {
    id: 'TRN-19',
    from: 'archived',
    to: 'archived and anonymised',
    cause: 'Worker personal data anonymises at 24 months for standard commercial tenants, and never in Regulated-Industry mode.',
    whoMayCause: 'No account — a scheduler, and no console control triggers or suppresses it',
    rendering: 'Absent for everyone including the root. Anonymisation operates on the identity-resolution layer, never on audit rows.',
    reversibility: 'irreversible',
    reversibilityNote: 'The platform’s one irreversible act. It cannot be reversed by any account, and switching into Regulated-Industry mode later does not resurrect identities.',
    sourceRef: 'AC-SA-17-05, AC-SA-17-07 L46074',
  },
] as const satisfies readonly LifecycleTransition[]

/* ------------------------------------------------------------------ *
 * The tenant detail page. D20: SEVEN named tabs; the eighth is flagged
 * unresolved and never guessed.
 * ------------------------------------------------------------------ */

export type DetailTabId =
  | 'overview'
  | 'operations'
  | 'agents'
  | 'memory'
  | 'devices'
  | 'metrics'
  | 'logs-and-audit'

export interface DetailTab {
  readonly id: DetailTabId
  readonly label: string
  /** What this tab shows, and the one operational action a designer would
   *  reach for here — named so it stays absent (risk R3). */
  readonly absentAction: string
}

export const DETAIL_TABS = [
  {
    id: 'overview',
    label: 'Overview',
    absentAction:
      'No suspend, activate or tier control is drawn here. Every lifecycle action lives on the list above, where its own confirmation and approval class apply.',
  },
  {
    id: 'operations',
    label: 'Operations (read-only)',
    absentAction:
      'No run, job, hold or reassignment control exists here for any console role. Record-level operational content is reached only through a named access class.',
  },
  {
    id: 'agents',
    label: 'Agents',
    absentAction:
      'No enable, disable, pause or re-run control is drawn here. The per-tenant emergency pause is proposed by an Admin and approved by the root in Platform Settings.',
  },
  {
    id: 'memory',
    label: 'Memory',
    absentAction:
      'No browse, search or export of tenant memory exists for any account including the root, and no individual-level profile record can be created.',
  },
  {
    id: 'devices',
    label: 'Devices',
    absentAction:
      'No lock, wipe or de-authorisation control is drawn here. Device wipe is a critical-class action owned by Devices and Fleet.',
  },
  {
    id: 'metrics',
    label: 'Metrics',
    absentAction:
      'No drill-through from a measure to record-level content, and no export. Nothing here is measured below the tenant-month.',
  },
  {
    id: 'logs-and-audit',
    label: 'Logs and Audit',
    absentAction:
      'No edit, delete, suppress or annotate control exists on an audit entry for any account. Export of a tenant’s own stream is the tenant’s action, not the console’s.',
  },
] as const satisfies readonly DetailTab[]

type MissingFromTabs = Exclude<DetailTabId, (typeof DETAIL_TABS)[number]['id']>
const _tabsExhaustive: MissingFromTabs extends never ? true : never = true
void _tabsExhaustive

/* ------------------------------------------------------------------ *
 * The suspension command reaching an offline device (L46708). Ten of the
 * fifteen states, in the source's own order for this sequence.
 * ------------------------------------------------------------------ */

export const SUSPENSION_COMMAND_SEQUENCE = [
  'created',
  'authorized',
  'queued',
  'available for delivery',
  'delivered',
  'downloaded',
  'validated',
  'applied',
  'acknowledged',
  'reconciled',
] as const satisfies readonly CommandState[]

/** The reason classes the hard-suspension control asks for. The source
 *  names the two causes it recognises and no others. */
export const HARD_SUSPENSION_REASON_CLASSES = [
  { value: 'non-payment-60-days', label: 'Non-payment persisting past 60 days' },
  { value: 'commercial-action', label: 'Commercial action taken by the client' },
] as const

/* ------------------------------------------------------------------ *
 * What the source does not define, and what it leaves unresolved.
 * ------------------------------------------------------------------ */

export const UNSPECIFIED_IN_SOURCE = [
  'Pilot conversion, pilot extension and pilot expiry are named as operator actions (SUB-SA-PILOT-CONVERT, SCHED-022, SCHED-023) but no control entry with an allowed-roles list exists for any of them.',
  'No control entry with an allowed-roles list is defined for applying a soft suspension. WF-PLT-004 (L55108) describes the suspension workflow and names no control, and the only nearby entry, Set suspension state (L61338), carries no module identifier and an empty allowed-roles list.',
  'No control is defined for releasing a soft suspension; the release path itself is the open decision DEC-SUSP-001.',
  'No control is defined for archiving a tenant from this module, or for reactivating one inside a reactivation window.',
  'No control is defined for creating, assigning or dissolving a tenant group; the group carries no operational behaviour at all.',
  'No search, sort, column-chooser or saved-view control is defined for the tenant list.',
  'No export of the tenant list is defined, and no per-tenant note or annotation control is defined.',
  'No bulk action of any kind is defined over the tenant list.',
] as const

export const UNRESOLVED_IN_SOURCE = [
  'The eighth tab is unresolved. The source asserts eight tabs on the tenant detail page (L44935) and enumerates seven groupings (L45070). Decision D20 builds the seven named and refuses to guess the eighth; the extraction records the same contradiction, noting that splitting Logs and Audit into two tabs is one way the number reaches eight, and the source never says so.',
  'DEC-SUSP-001 — soft-suspension exit. §4.2.4 lifts it on the operator’s signal; §8.9.2 and Part IX say it clears automatically on payment; §4.2.1 and §8.12 state there is no payment integration on the platform. The adopted working position is the operator signal. No release control is drawn here at all — the source defines none — and the decision is named where one would sit.',
  'DEC-MSG-001 — the worker-facing compliance-suspension message. §4.2.3 and §8.9.2 give two wordings; both are preserved and neither is rendered as canonical on this console.',
  'The screen numbering. This module’s screens appear as SCR-SA-14 and SCR-SA-15 in one scheme and as SCR-SA-11 and SCR-SA-12 in another. Per D1 the names are canonical and the numbers are annotations; no route is keyed on either.',
  'The module’s own roles_allowed list differs across seven separate extraction chunks, from the two-role list to all four. Per D16 the module-level list is authoritative nowhere; every affordance below is decided by its own control entry.',
] as const
