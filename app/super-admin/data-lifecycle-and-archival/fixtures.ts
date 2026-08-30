import type { RoleId } from '@/domain/roles'
import { saTenant } from '@/surfaces/sa/tenants'

/**
 * MOD-SA-17 Data Lifecycle and Archival — the seeded fixtures this module's
 * screen steps through. No backend, no clock: every "as of" value below is a
 * fixture string, never a computed time (spec §8, and the no-ambient-Date
 * rule).
 *
 * The binding constraint on this file is `AC-SA-17-01` (L46074): "no purge
 * capability exists anywhere on the platform for any account." Nothing ages
 * out of existence: nothing in this file describes a purge, and no fixture
 * row carries a state that means "gone". The retention value is a
 * HOT-RETRIEVABILITY HORIZON — shortening it MOVES data to a colder storage
 * class and never deletes it (`AC-SA-17-02`).
 *
 * Every figure here is at tenant grain or coarser. There is no per-worker
 * row, no per-site row, no rate and no comparison between people, and none
 * can be derived from what this file carries.
 */

/* ------------------------------------------------------------------ *
 * The four platform roles. The `ROLE-PLAT-*` identifiers are the plan's
 * annotation for the same four accounts `@/domain/roles` already carries;
 * both are rendered so a reviewer can match one to the other. The
 * selector is a VIEW SWITCHER, not a login (spec §8).
 * ------------------------------------------------------------------ */

export interface LifecyclePlatformRole {
  readonly id: RoleId
  readonly name: string
  readonly roleAnnotation: string
}

export const LIFECYCLE_PLATFORM_ROLES = [
  { id: 'ROOT_SUPER_ADMIN', name: 'Root Super Admin', roleAnnotation: 'ROLE-PLAT-ROOT' },
  { id: 'ADMIN', name: 'Admin', roleAnnotation: 'ROLE-PLAT-ADMIN' },
  { id: 'PLATFORM_ENGINEER', name: 'Platform Engineer', roleAnnotation: 'ROLE-PLAT-ENG' },
  { id: 'SUPPORT', name: 'Support', roleAnnotation: 'ROLE-PLAT-SUP' },
] as const satisfies readonly LifecyclePlatformRole[]

/* ------------------------------------------------------------------ *
 * Closed vocabularies. `as const satisfies` keeps each member literal-
 * narrowed, so the exhaustiveness checks below are real rather than
 * vacuous (a plain `: readonly T[]` annotation would widen the const).
 * ------------------------------------------------------------------ */

/** SCR-SA-24's five areas, closed at five (L45997, L46001). */
export type LifecycleArea = 'Retention' | 'Tiering' | 'Legal hold' | 'Anonymisation' | 'Archival'

export const LIFECYCLE_AREAS = [
  'Retention',
  'Tiering',
  'Legal hold',
  'Anonymisation',
  'Archival',
] as const satisfies readonly LifecycleArea[]

type MissingArea = Exclude<LifecycleArea, (typeof LIFECYCLE_AREAS)[number]>
const _areasExhaustive: MissingArea extends never ? true : never = true
void _areasExhaustive

/**
 * The tenant closure sequence (L65896). Three cuts of a lifecycle machine
 * exist in the source; this is the one that is about CLOSURE, and it is the
 * one this module renders. The other two are recorded in
 * `LIFECYCLE_SOURCE_CONFLICTS` rather than merged into it.
 */
export type ClosureState = 'Active' | 'ExportProvided' | 'Archived' | 'Anonymised' | 'Tiered'

export const CLOSURE_SEQUENCE = [
  'Active',
  'ExportProvided',
  'Archived',
  'Anonymised',
  'Tiered',
] as const satisfies readonly ClosureState[]

type MissingClosureState = Exclude<ClosureState, (typeof CLOSURE_SEQUENCE)[number]>
const _closureExhaustive: MissingClosureState extends never ? true : never = true
void _closureExhaustive

/** `OBJ-SA-LEGALHOLD` (L46016) — the SURF-SA-owned object this module renders. */
export type LegalHoldState = 'placed' | 'in force' | 'released'

export const LEGAL_HOLD_STATES = [
  'placed',
  'in force',
  'released',
] as const satisfies readonly LegalHoldState[]

type MissingHoldState = Exclude<LegalHoldState, (typeof LEGAL_HOLD_STATES)[number]>
const _holdStatesExhaustive: MissingHoldState extends never ? true : never = true
void _holdStatesExhaustive

/* ------------------------------------------------------------------ *
 * Freshness. Fixture strings, never a computed time.
 * ------------------------------------------------------------------ */

export const LIFECYCLE_AS_OF = 'as of 04:00, 17 August 2026'
export const LIFECYCLE_STALE_AS_OF = 'as of 22:00, 16 August 2026 — stale, 6 hours old'
export const LIFECYCLE_ORIGIN = 'the lifecycle scheduler’s last completed evaluation'

export const RETENTION_DEFAULT_LABEL = 'fifteen years'
export const ANONYMISATION_HORIZON_LABEL = 'twenty-four months'

/* ------------------------------------------------------------------ *
 * Retention — the hot-retrievability horizon, per tenant.
 * ------------------------------------------------------------------ */

export interface RetentionPosture {
  readonly tenantLabel: string
  /** The tenant's own horizon. A duration, never a count of records. */
  readonly horizonLabel: string
  /** The platform floor register's bound on that value. */
  readonly boundLabel: string
  readonly mode: 'standard commercial' | 'Regulated-Industry mode'
  readonly sourceRef: string
}

export const RETENTION_POSTURES = [
  {
    tenantLabel: saTenant('TEN-BRIGHTBIKES').name,
    horizonLabel: 'fifteen years (platform default)',
    boundLabel: 'seven to twenty-five years, per the platform floor register',
    mode: 'standard commercial',
    sourceRef: 'L4718, L46074',
  },
  {
    tenantLabel: 'Northfield Components',
    horizonLabel: 'ten years (tenant-set, inside the bound)',
    boundLabel: 'seven to twenty-five years, per the platform floor register',
    mode: 'standard commercial',
    sourceRef: 'L4718, L97327',
  },
  {
    tenantLabel: 'Caldera Medical Devices',
    horizonLabel: 'twenty-five years (tenant-set, at the upper bound)',
    boundLabel: 'seven to twenty-five years, per the platform floor register',
    mode: 'Regulated-Industry mode',
    sourceRef: 'L29724, L46074',
  },
] as const satisfies readonly RetentionPosture[]

/* ------------------------------------------------------------------ *
 * Tiering — what happens at the horizon. Nothing is deleted.
 * ------------------------------------------------------------------ */

export interface TieringOutcome {
  readonly name: string
  readonly whatHappens: string
  readonly sourceRef: string
}

export const TIERING_OUTCOMES = [
  {
    name: 'Data inside the horizon',
    whatHappens:
      'Held in the hot class and retrievable at once. No scheduler touches it while it is inside the horizon.',
    sourceRef: 'L4653, L21266',
  },
  {
    name: 'Data past the horizon',
    whatHappens:
      'Moved to a lower-cost storage class by the tiering scheduler and still retrievable. Tiering is reversible; nothing about it is terminal.',
    sourceRef: 'L102117, L104375',
  },
  {
    name: 'Data under a legal hold',
    whatHappens:
      'Skipped by the tiering scheduler for the hold’s scope, and any data already moved is brought back to the hot class. The skip is recorded as its own outcome.',
    sourceRef: 'L102158, L100968',
  },
  {
    name: 'A missed scheduler run',
    whatHappens:
      'Nothing is lost. The horizon is re-evaluated on the next run, because the boundary is evaluated on access rather than enforced by a single occurrence.',
    sourceRef: 'L117977',
  },
] as const satisfies readonly TieringOutcome[]

/* ------------------------------------------------------------------ *
 * Legal hold.
 * ------------------------------------------------------------------ */

export interface LegalHoldRow {
  readonly id: string
  readonly tenantLabel: string
  readonly scopeLabel: string
  readonly state: LegalHoldState
  readonly reasonLabel: string
  readonly sourceRef: string
}

export const LEGAL_HOLDS = [
  {
    id: 'HOLD-2026-004',
    tenantLabel: saTenant('TEN-BRIGHTBIKES').name,
    scopeLabel: 'Frame-weld evidence captured in the 2025 calendar year',
    state: 'in force',
    reasonLabel: 'Preservation notice from the client’s legal function',
    sourceRef: 'L46016, L117354',
  },
  {
    id: 'HOLD-2026-007',
    tenantLabel: 'Northfield Components',
    scopeLabel: 'All quality summaries for the Northfield line',
    state: 'placed',
    reasonLabel: 'Preservation notice, scope resolution still running',
    sourceRef: 'L46016, L97404',
  },
  {
    id: 'HOLD-2025-011',
    tenantLabel: 'Caldera Medical Devices',
    scopeLabel: 'Sterilisation records for the recalled batch',
    state: 'released',
    reasonLabel: 'Preservation need ended; release recorded and shown to the tenant',
    sourceRef: 'L46016, L74782',
  },
] as const satisfies readonly LegalHoldRow[]

/* ------------------------------------------------------------------ *
 * Anonymisation. The one irreversible act, and the reason the upcoming-
 * events panel exists at all (L102136).
 * ------------------------------------------------------------------ */

export interface UpcomingAnonymisationRow {
  readonly tenantLabel: string
  readonly dueLabel: string
  readonly scopeLabel: string
  readonly sourceRef: string
}

export const UPCOMING_ANONYMISATION = [
  {
    tenantLabel: saTenant('TEN-BRIGHTBIKES').name,
    dueLabel: 'September 2026',
    scopeLabel: 'Worker identities attached to records that reach twenty-four months in that month',
    sourceRef: 'L46074, L97555',
  },
  {
    tenantLabel: 'Northfield Components',
    dueLabel: 'November 2026',
    scopeLabel: 'Worker identities attached to records that reach twenty-four months in that month',
    sourceRef: 'L46074, L97544',
  },
  {
    tenantLabel: 'Caldera Medical Devices',
    dueLabel: 'Not scheduled — Regulated-Industry mode never anonymises',
    scopeLabel: 'No anonymisation event exists for this tenant, in this month or any other',
    sourceRef: 'AC-SA-17-05 L46074, L29724',
  },
] as const satisfies readonly UpcomingAnonymisationRow[]

/* ------------------------------------------------------------------ *
 * Archival.
 * ------------------------------------------------------------------ */

export interface ReactivationBand {
  readonly name: string
  readonly terms: string
  readonly sourceRef: string
}

export const ARCHIVE_REACTIVATION_BANDS = [
  {
    name: 'Free restore — zero to six months after archival',
    terms: 'The archived tenancy is brought back with no fee attached to the restore.',
    sourceRef: 'L117946, L98618',
  },
  {
    name: 'Fee-bearing — six to twelve months after archival',
    terms:
      'The restore carries an engineering-time fee. This console states the band; it holds no price field and computes no amount.',
    sourceRef: 'L117946, L71322',
  },
  {
    name: 'Fresh tenancy — beyond twelve months',
    terms:
      'A new tenancy is created. The archived data is not destroyed by the boundary passing: it remains exportable for a retrieval fee.',
    sourceRef: 'L117946, L113763',
  },
] as const satisfies readonly ReactivationBand[]

/* ------------------------------------------------------------------ *
 * The five-step guided right-to-erasure sequence (L45958, L114118).
 * ------------------------------------------------------------------ */

export interface ErasureStep {
  readonly ordinal: number
  readonly name: string
  readonly whatHappens: string
}

export const ERASURE_STEPS = [
  {
    ordinal: 1,
    name: 'Request',
    whatHappens:
      'A request naming the data subject and stating the legal basis is drafted by the Admin. Nothing executes from this step.',
  },
  {
    ordinal: 2,
    name: 'Scope',
    whatHappens:
      'The records the request reaches are resolved and summarised, so the request is decided against a known scope rather than a description.',
  },
  {
    ordinal: 3,
    name: 'Legal-hold check',
    whatHappens:
      'The scope is checked against every hold in force. A hold halts the request. This step cannot be skipped by any account, including the root.',
  },
  {
    ordinal: 4,
    name: 'Execution',
    whatHappens:
      'Runs only after the root approves and only where a named compliance standard requires the removal. Where no standard requires it, the outcome is a transformation and the outcome is recorded honestly as such.',
  },
  {
    ordinal: 5,
    name: 'Erasure certificate',
    whatHappens:
      'A certificate is written to both audit trails wherever removal actually occurred, in the same transaction as the outcome it records.',
  },
] as const satisfies readonly ErasureStep[]

export interface ErasureRequestRow {
  readonly id: string
  readonly tenantLabel: string
  readonly state: string
  readonly subjectReference: string
  readonly basis: string
  readonly scopeSummary: string
  readonly outcome: string
}

export const ERASURE_REQUESTS = [
  {
    id: 'ER-2026-018',
    tenantLabel: saTenant('TEN-BRIGHTBIKES').name,
    state: 'halted',
    subjectReference: 'SUBJ-BB-4471',
    basis: 'Data-subject request under the client’s stated standard',
    scopeSummary: 'Records inside the 2025 frame-weld evidence set',
    outcome: 'Halted at the legal-hold check — HOLD-2026-004 is in force over the scope',
  },
  {
    id: 'ER-2026-021',
    tenantLabel: 'Northfield Components',
    state: 'scope resolved',
    subjectReference: 'SUBJ-NF-0912',
    basis: 'Data-subject request under the client’s stated standard',
    scopeSummary: 'Training records and capture attributions, 2024 to date',
    outcome: 'Awaiting the root decision — no execution has occurred',
  },
  {
    id: 'ER-2025-092',
    tenantLabel: 'Caldera Medical Devices',
    state: 'outcome recorded',
    subjectReference: 'SUBJ-CM-2210',
    basis: 'Data-subject request under the client’s stated standard',
    scopeSummary: 'Capture attributions on the sterilisation line',
    outcome:
      'Transformation rather than removal — the retained record has no identity resolving from it, and the certificate says so',
  },
] as const satisfies readonly ErasureRequestRow[]

/* ------------------------------------------------------------------ *
 * Prohibitions. Each ABSENT, for every account including the root.
 * ------------------------------------------------------------------ */

export interface AbsentControl {
  readonly label: string
  readonly note: string
}

export const LIFECYCLE_ABSENT_CONTROLS = [
  {
    label: 'Purge',
    note:
      'No purge capability exists anywhere on the platform, for any account including the root; nothing ages out of existence (AC-SA-17-01, L46074). No control is drawn here, greyed or otherwise, because a greyed control would imply an account somewhere holds it.',
  },
  {
    label: 'Delete tenant data from the archival area',
    note:
      'No delete-tenant-data control exists on the archival area for any account (L65941). Archival moves a tenancy into a closed, still-retrievable state; it does not destroy it.',
  },
  {
    label: 'Reverse an anonymisation',
    note:
      'No undo, no restore and no reversal of an anonymisation exists for any account (L97560, AC-SA-17-07). Switching a tenant into Regulated-Industry mode afterwards does not bring an identity back either — the upcoming-events area exists precisely because there is no safe state to return to.',
  },
  {
    label: 'A general deletion path',
    note:
      'Removal happens only where a named compliance standard requires it. The list of standards is owed by the client under DEC-DELETE-001, and until it lands no deletion path is built here and none is promised.',
  },
  {
    label: 'Cancel or skip a scheduled tiering or anonymisation run',
    note:
      'The source defines no control that cancels or skips a scheduled run. A legal hold is what suspends a run for a scope, and it is the only mechanism the source gives.',
  },
] as const satisfies readonly AbsentControl[]

/* ------------------------------------------------------------------ *
 * Silences and conflicts, both stated rather than filled in.
 * ------------------------------------------------------------------ */

export interface UnspecifiedAffordance {
  readonly affordance: string
  readonly note: string
}

export const LIFECYCLE_UNSPECIFIED_IN_SOURCE = [
  {
    affordance: 'The role that drafts a retention-value change',
    note:
      'The change is a critical-class action the root approves (L55942, L4718), and a retention change is described end to end at L97327 — but no role is named as its drafter. This screen therefore offers the root its own action bar and offers every other role the class badge, and names the gap rather than assigning the draft to a role the source never names.',
  },
  {
    affordance: 'The second approver on a legal hold',
    note:
      'AC-SA-17-04 calls place and release "dual-approved" while the control extract names the Root Super Admin as the sole holder (L117354), and exactly one root account exists. Who the second approver is, is not stated anywhere. No second-approver control is invented here.',
  },
  {
    affordance: 'The fields of the erasure-request draft form',
    note:
      'The list columns are named — state, subject reference, basis, scope summary and outcome (L97663) — but no input, format or permitted value is defined for drafting one. No form fields are invented.',
  },
  {
    affordance: 'Any control on the lifecycle scheduler dashboard',
    note:
      'DASH-SCHED-06 is named as a screen (L101244) and no control on it is defined: no run-now, no pause, no retry, no re-run of a skipped occurrence. The scheduler is rendered here as an outcome record only.',
  },
  {
    affordance: 'Who triggers export-on-archival',
    note:
      'AC-SA-17-09 requires the export to run at no charge before archival, and the offboarding storyboard SB-030 puts it in the sequence — but no control and no holder is named for the step itself.',
  },
] as const satisfies readonly UnspecifiedAffordance[]

export interface SourceConflict {
  readonly topic: string
  readonly conflict: string
  readonly resolution: string
}

export const LIFECYCLE_SOURCE_CONFLICTS = [
  {
    topic: 'Anonymisation against audit immutability',
    conflict:
      'DEC-ANON-001 and DEC-ERASEAUD-001 still read open (L97689, L74786), while L8368 and AC-30D-1302 (L74842) assert the resolution as fact.',
    resolution:
      'Decision D11 — anonymisation operates on the identity-resolution layer and never rewrites an audit row. It is the only reading that keeps AC-SA-17-06 and AC-SA-18-04 both true, and it is stated on this screen rather than resolved in code.',
  },
  {
    topic: 'The legal-hold state vocabulary',
    conflict:
      'Three cuts exist: placed / in force / released (OBJ-SA-LEGALHOLD, L46016), placed / released (L1917), and a six-state managed-object machine — Requested, PendingApproval, InForce, Declined, PendingRelease, Released (L97404).',
    resolution:
      'The three-state OBJ-SA-LEGALHOLD cut is rendered, because it is the object this module owns. The six-state cut is recorded here and not merged in.',
  },
  {
    topic: 'The erasure workflow’s length',
    conflict:
      'The control and the numeric fact both say five steps (L45958, L45997, L114118); OBJ-ErasureRequest names seven states, adding "halted" and "outcome recorded" (L97614).',
    resolution:
      'Five guided steps are rendered, because that is what the source calls the control. Halted and outcome-recorded appear as outcomes of steps three and five, which is where the seven-state cut puts them.',
  },
  {
    topic: 'Which lifecycle machine closes a tenancy',
    conflict:
      'Active / ExportProvided / Archived / Anonymised / Tiered (L65896) against the record machine Created / Hot / Anonymised / Tiered / Held / Erased (L104375) and the eight-state SEQ-033 machine (L71529).',
    resolution:
      'The closure sequence at L65896 is rendered, because this screen is about closing a tenancy. The record-level machine belongs to a record, not a tenancy, and is named here rather than blended into it.',
  },
  {
    topic: 'The critical-class count',
    conflict:
      'The source titles the list "the ten critical-class actions" and states the value as ten, then enumerates eleven items (L55942).',
    resolution:
      'Decision D12 — the shared registry carries the eleven the source actually enumerates. Three of them land on this module: erasure and archival execution, retention-value changes, and legal-hold place and release.',
  },
] as const satisfies readonly SourceConflict[]

/* ------------------------------------------------------------------ *
 * Workflows. The extraction attaches NO module identifier to any workflow,
 * so each row states how it was matched to MOD-SA-17.
 * ------------------------------------------------------------------ */

export interface LifecycleWorkflow {
  readonly id: string
  readonly name: string
  readonly actor: string
  readonly trigger: string
  readonly terminalStates: readonly string[]
  readonly matchedBy: string
}

export const LIFECYCLE_WORKFLOWS = [
  {
    id: 'unnumbered (L97327)',
    name: 'A retention change, end to end',
    actor: 'Super Admin operator',
    trigger: 'A tenant asks the client to change its hot-retrievability horizon',
    terminalStates: [
      'approved and written to both audit trails, and the tiering scheduler applies it on its next run',
      'rejected as outside the platform bounds',
    ],
    matchedBy: 'name and line proximity to §8.17 — the retention area of SCR-SA-24 at L45997',
  },
  {
    id: 'unnumbered (L97437)',
    name: 'Placing and releasing a legal hold',
    actor: 'The client’s legal function, through a Super Admin operator',
    trigger: 'A preservation need arises',
    terminalStates: ['InForce', 'Declined', 'Released'],
    matchedBy: 'name and line proximity to the legal-hold area and OBJ-SA-LEGALHOLD',
  },
  {
    id: 'unnumbered (L97649)',
    name: 'A right-to-erasure request end to end',
    actor: 'A Super Admin operator acting for a data subject',
    trigger: 'A request naming a data subject and stating a basis',
    terminalStates: [
      'halted by a legal hold',
      'a transformation rather than a removal, with the outcome recorded honestly',
      'removal executed and an erasure certificate written to both audit trails',
    ],
    matchedBy: 'name and line proximity to the erasure control at L45997 and the list at L97663',
  },
  {
    id: 'unnumbered (L97544)',
    name: 'An anonymisation event',
    actor: 'The anonymisation scheduler',
    trigger: 'Records reach twenty-four months for a standard commercial tenant',
    terminalStates: [
      'identities replaced with a stable opaque worker identifier, and the event audited',
      'no anonymisation for a Regulated-Industry mode tenant, ever',
    ],
    matchedBy: 'name and line proximity to the anonymisation area and AC-SA-17-05',
  },
  {
    id: 'SB-SCHED-22 (L102117)',
    name: 'The storage tiering scheduler runs at the retention horizon',
    actor: 'The SCHED-TIERING occurrence',
    trigger: 'Data past its hot-retrievability horizon, fifteen years by default',
    terminalStates: [
      'data remains retrievable',
      'objects wrongly expired are brought back from backup',
    ],
    matchedBy: 'scheduled-work identifier and its named surface SURF-SA',
  },
  {
    id: 'SB-SCHED-24 (L102158)',
    name: 'A legal hold suspends a scheduled tiering or anonymisation run',
    actor: 'The occurrence, with the Root Super Admin approving the hold',
    trigger: 'An occurrence encountering a hold, and the hold’s own placement',
    terminalStates: ['held data returned to the hot class and the incident recorded'],
    matchedBy: 'scheduled-work identifier and the hold object this module owns',
  },
  {
    id: 'SB-030 (L65868)',
    name: 'A tenant is offboarded, exported and archived',
    actor: 'The platform Admin and the Root Super Admin, with the Tenant Admin',
    trigger: 'The commercial relationship ends through the client’s own process',
    terminalStates: [
      'tenant archived',
      'anonymised at twenty-four months',
      'tiered beyond the hot-retrievability horizon and still retrievable',
    ],
    matchedBy:
      'storyboard identifier, and the closure sequence at L65896 that sits inside the same storyboard',
  },
] as const satisfies readonly LifecycleWorkflow[]
