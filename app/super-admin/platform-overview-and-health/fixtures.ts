import type { RoleId } from '@/domain/roles'
import type { ScreenStateId } from '@/ui/screen-state'
import type { SaFreshness } from '@/surfaces/sa/freshness'

/**
 * MOD-SA-01 seeded fixture data. Spec §8: no backend — every value below is
 * a fixture the reader steps through, never a computed transition, and the
 * screen carries the prototype disclosure that says so.
 *
 * Determinism: no `Date.now()`, `new Date()` or `Math.random()` anywhere.
 * As-of stamps are fixed strings, because an aggregate's honesty comes from
 * saying WHEN it was true, and a clock read at render time would make the
 * same screenshot say something different every run.
 */

/**
 * The four console roles, in the source's own `ROLE-PLAT-*` spelling, paired
 * with the `RoleId` the policy evaluator already knows. A deliberate subset
 * of `RoleId` (the PLATFORM security domain only), so — like
 * `SUPERVISOR_AND_ABOVE` in `@/domain/roles` — no exhaustiveness check over
 * `RoleId` is possible or wanted here.
 */
export interface PlatformRole {
  /** The frozen source's identifier, rendered as the annotation. */
  readonly sourceId: string
  readonly roleId: RoleId
  readonly name: string
}

export const PLATFORM_ROLES = [
  { sourceId: 'ROLE-PLAT-ROOT', roleId: 'ROOT_SUPER_ADMIN', name: 'Root Super Admin' },
  { sourceId: 'ROLE-PLAT-ADMIN', roleId: 'ADMIN', name: 'Admin' },
  { sourceId: 'ROLE-PLAT-ENG', roleId: 'PLATFORM_ENGINEER', name: 'Platform Engineer' },
  { sourceId: 'ROLE-PLAT-SUP', roleId: 'SUPPORT', name: 'Support' },
] as const satisfies readonly PlatformRole[]

/**
 * `OBJ-SA-AGGREGATE`'s four states (L42991). AC-SA-01-03: a degraded
 * aggregate renders stale-with-age, a wholly unavailable one renders
 * unavailable, and neither ever renders as zero or blank.
 */
export type AggregateState = Extract<SaFreshness, 'current' | 'stale' | 'unavailable' | 'reconciled'>

export interface AggregateElement {
  readonly id: string
  readonly name: string
  /**
   * The measure itself, already a sentence. `null` ONLY for the
   * `unavailable` state, where the screen renders "Measure unavailable" —
   * never a zero, never a blank cell (FB-SA-01, L42858).
   */
  readonly value: string | null
  readonly state: AggregateState
  /** When this was last true. Every aggregate carries one (AC-SA-000-06). */
  readonly asOf: string
  /** Required by the `stale` state: the age, in words. */
  readonly age?: string
  /** Required by the `reconciled` state: what the gap window was. */
  readonly gapWindow?: string
  readonly sourceRef: string
}

/**
 * EXACTLY EIGHT (AC-SA-01-01, L43068; the numeric fact at L42919 states the
 * count as eight elements).
 *
 * The source closes the COUNT and never enumerates WHICH eight. The eight
 * below are therefore named from the platform-level health signals the
 * source does name for this module — `SB-RISK-01`'s four panels (L115553),
 * the connectivity-loss protocol (L42923), the incident record (L42990),
 * integration health (L98229) and console availability (L55259) — and the
 * screen says out loud that the naming is provisional while the count is
 * not. Same treatment as D4 gives the audit classes: data-driven from a
 * fixture, labelled provisional, count never invented.
 *
 * Every value is a platform- or tenant-level count or status. No rate, no
 * measure below tenant-month, no series about a person.
 */
export const AGGREGATES = [
  {
    id: 'AGG-PLATFORM-HEALTH',
    name: 'Platform health',
    value: '12 of 12 platform services reporting normally',
    state: 'current',
    asOf: '2026-08-16 09:12 platform time',
    sourceRef: 'SB-RISK-01 panel 1, L115553',
  },
  {
    id: 'AGG-FLEET-TELEMETRY',
    name: 'Fleet telemetry',
    value: 'Last-known-good: 340 devices reporting',
    state: 'stale',
    age: '42 minutes old',
    asOf: '2026-08-16 08:30 platform time',
    sourceRef: 'SB-RISK-01 panel 2, L115553; FB-SA-01, L42858',
  },
  {
    id: 'AGG-AGENT-HEALTH',
    name: 'Agent health',
    value: null,
    state: 'unavailable',
    asOf: '2026-08-16 07:55 platform time, the last computation that completed',
    sourceRef: 'SB-RISK-01 panel 3, L115553; FB-SA-01, L42858',
  },
  {
    id: 'AGG-REVIEW-CADENCE',
    name: 'Review cadence',
    value: '3 composed-agent reviews awaiting the platform team',
    state: 'current',
    asOf: '2026-08-16 09:12 platform time',
    sourceRef: 'SB-RISK-01 panel 4, L115553',
  },
  {
    id: 'AGG-TENANT-CONNECTIVITY',
    name: 'Tenant connectivity',
    value: '11 of 12 tenants at Normal, 1 at Loss60',
    state: 'current',
    asOf: '2026-08-16 09:12 platform time',
    sourceRef: 'Connectivity ladder, L102009; timers L42923',
  },
  {
    id: 'AGG-OPEN-INCIDENTS',
    name: 'Platform incidents not yet closed',
    value: '3 platform incidents not yet closed',
    state: 'current',
    asOf: '2026-08-16 09:12 platform time',
    sourceRef: 'OBJ-SA-INCIDENT, L42990',
  },
  {
    id: 'AGG-INTEGRATION-HEALTH',
    name: 'Integration health',
    value: '9 of 9 integration identifiers in agreement',
    state: 'reconciled',
    gapWindow: 'gap window 11:05 to 11:58 recorded',
    asOf: '2026-08-16 12:30 platform time',
    sourceRef: 'Integration health per identifier, L98229; L96758',
  },
  {
    id: 'AGG-CONSOLE-AVAILABILITY',
    name: 'Console availability',
    value: 'Console available. No administrative pause in force.',
    state: 'current',
    asOf: '2026-08-16 09:12 platform time',
    sourceRef: 'Console availability, L55259; FB-SA-09, L42866',
  },
] as const satisfies readonly AggregateElement[]

/** `OBJ-SA-INCIDENT` (L42991). D5: the only vocabulary anchored to a MOD-SA-01
 *  object card, and incident LEVELS are not rendered at all — they are marked
 *  *proposed* in the source (L107904). */
export type IncidentState =
  | 'open'
  | 'acknowledged'
  | 'investigating'
  | 'mitigated'
  | 'resolved'
  | 'closed'

export const INCIDENT_STATES = [
  'open',
  'acknowledged',
  'investigating',
  'mitigated',
  'resolved',
  'closed',
] as const satisfies readonly IncidentState[]

type MissingFromIncidentStates = Exclude<IncidentState, (typeof INCIDENT_STATES)[number]>
const _incidentStatesExhaustive: MissingFromIncidentStates extends never ? true : never = true
void _incidentStatesExhaustive

/** AC-4883 (L107970): closure needs positive evidence for each item — an
 *  incident cannot close on the absence of alerts alone. */
export interface ChecklistItem {
  readonly label: string
  /** `null` means no positive evidence yet, which blocks the close. */
  readonly evidence: string | null
}

export interface PlatformIncident {
  readonly id: string
  readonly title: string
  readonly state: IncidentState
  /**
   * AC-SA-01-05: one agent degrading across two or more tenants is ONE
   * platform incident, never one incident per tenant. Tenants are carried
   * anonymised (AC-SA-01-06) and are never links — no console screen outside
   * a named access session reaches record-level tenant content
   * (AC-SA-000-07).
   */
  readonly tenants: readonly string[]
  readonly capability: string
  /** The five attributes AC-4880 (L107967) requires before any close. */
  readonly classification: string
  readonly roleOwner: string
  readonly detectionSource: string
  readonly communicationDecision: string
  readonly checklist: readonly ChecklistItem[]
  /** L90758 / L90767: the close is disabled while any reconciliation item is
   *  outstanding — an incident closes when the records agree, not when the
   *  dependency returns (L96758). */
  readonly reconciliationOutstanding: string | null
  readonly sourceRef: string
}

export const INCIDENTS = [
  {
    id: 'INC-PLT-01',
    title: 'Composed-agent degradation observed in more than one tenant',
    state: 'investigating',
    tenants: ['Tenant A', 'Tenant B'],
    capability: 'composed-agent review',
    classification: 'Agent degradation',
    roleOwner: 'Platform Engineer',
    detectionSource: 'Evaluation drift canary re-running the scenario suite on cadence',
    communicationDecision: 'Tenant Admin banner raised at the 60-minute threshold',
    checklist: [
      { label: 'Degraded window bounded', evidence: 'Window recorded, 08:12 to 08:54' },
      { label: 'Dependent aggregates recomputed', evidence: null },
      { label: 'Tenant communication delivered', evidence: 'Banner delivery recorded' },
    ],
    reconciliationOutstanding: 'Fleet telemetry aggregate has not recomputed since the gap',
    sourceRef: 'AC-SA-01-05, L43072; AC-4880, L107967',
  },
  {
    id: 'INC-PLT-02',
    title: 'Site-wide connectivity loss crossed the 120-minute threshold',
    state: 'mitigated',
    tenants: ['Tenant C'],
    capability: 'connectivity protocol',
    classification: 'Connectivity loss',
    roleOwner: 'Admin',
    detectionSource: 'Connectivity-loss protocol timer at 120 minutes',
    communicationDecision: 'Platform on-call escalation raised; tenant informed on the board',
    checklist: [
      { label: 'Devices reconnected and queues drained', evidence: 'Queue drain recorded in order' },
      { label: 'Aggregates recomputed', evidence: 'Recompute completed, re-stamped' },
      { label: 'Outage duration recorded', evidence: 'Duration 134 minutes recorded' },
    ],
    reconciliationOutstanding: null,
    sourceRef: 'SB-SCHED-17, L102004; L90758',
  },
  {
    id: 'INC-PLT-03',
    title: 'Telemetry gap on the fleet measure',
    state: 'open',
    tenants: ['Tenant A'],
    capability: 'telemetry aggregation',
    classification: 'Aggregation gap',
    roleOwner: 'Platform Engineer',
    detectionSource: 'Freshness alert on the aggregation layer',
    communicationDecision: 'Internal alert only at the 30-minute threshold',
    checklist: [
      { label: 'Gap window bounded', evidence: 'Window recorded, 08:30 onward' },
      { label: 'Re-aggregation completed', evidence: null },
      { label: 'Stale stamp cleared', evidence: null },
    ],
    reconciliationOutstanding: 'Re-aggregation for the gap window has not run',
    sourceRef: 'FB-SA-01, L42858; L45140',
  },
] as const satisfies readonly PlatformIncident[]

/** The connectivity ladder, fixed by AC-WF-PLT-008-03 (L55273) and the timer
 *  fact at L42923. Rendered as a statement of the protocol, not as a
 *  control — nothing on this console sets these values. */
export const CONNECTIVITY_LADDER = [
  { at: '30 minutes', signal: 'Loss30', consequence: 'Internal platform alert' },
  { at: '60 minutes', signal: 'Loss60', consequence: 'Tenant Admin banner' },
  { at: '120 minutes', signal: 'Loss120', consequence: 'Platform on-call escalation' },
] as const

/**
 * D15 / R7: the affordances the frozen source does NOT define for this
 * module. Named rather than built. A plausible invented control ships a
 * fiction that reads back as a requirement — this list is the finding.
 */
export const UNSPECIFIED_IN_SOURCE = [
  'Acknowledge an incident (open → acknowledged). The state exists in OBJ-SA-INCIDENT; no control that performs the transition is defined anywhere for this module.',
  'Assign an incident owner. AC-4880 requires a named role owner as an ATTRIBUTE of the record; no assignment control is defined.',
  'Escalate an incident, or set an incident level. The four platform incident levels at L107904 are marked *proposed*, so nothing is rendered for them (D5).',
  'Annotate an incident. Named as a Support permission at L43014 ("no state change past acknowledged") but never defined as a control on any screen, so none is built.',
  'Change an observability threshold. The threshold proposal and approval cycle belongs to MOD-SA-07, not here (L107742).',
  'Refresh or recompute an aggregate on demand. OBJ-SA-AGGREGATE carries a refresh floor as a relationship (L42990); no user-facing refresh control is defined.',
  'Export the overview. No export affordance is defined for this module, and no dashboard is accepted as audit evidence anywhere (AC-4803, L107299).',
  'Recovery Time Objective (DEC-RTO-001) and agent-output display (DEC-AIOUT-001) are open client decisions referenced on this module (L60828, L60856). Nothing is rendered for either.',
] as const

/**
 * STATE-06 has exactly ONE cause on this module, written down exactly once so
 * no second wording of it can drift into existence. It is rendered in one
 * place — the screen-state banner — and every control the state disables
 * points back at it with `READ_ONLY_CONTROL_POINTER` instead of restating it
 * ("Never scatter the cause across several messages. One banner, one cause.",
 * `@/ui/screen-state` STATE-06).
 *
 * It is the same cause for all four console roles. A role that holds no
 * incident ownership is a different fact, it belongs to that record's own
 * ABSENT notice, and printing it here as a second read-only cause would be two
 * causes for one condition.
 *
 * Every claim in it is checked by `tests/component/sa-overview.test.tsx`:
 * the three filters really carry the native `disabled` attribute, the close
 * really renders inert, and the two view switchers really do not.
 */
export const READ_ONLY_CAUSE =
  'The module is read-only while STATE-06 holds. Every input this module owns is disabled for every console role: the tenant, capability and incident filters, and the incident close wherever it is drawn. The role and screen-state selects above are storyboard view switchers rather than module inputs, so they stay live — they are how a reader leaves this state.'

/** What a control disabled by STATE-06 says INSTEAD of repeating the cause. */
export const READ_ONLY_CONTROL_POINTER =
  'Disabled by STATE-06. The cause is named once, in the screen-state banner above.'

/**
 * One honest sentence per applicable screen state, saying what on THIS
 * module reaches it. STATE-07 is frontline-only and is not offered.
 *
 * Lives here, beside the other fixture data, so `tests/component/sa-overview.test.tsx`
 * can assert that the module-specific sentence — not just the shared
 * `SCREEN_STATES` contract paragraph — actually renders for every state.
 */
export const MODULE_STATE_NOTES: Record<ScreenStateId, string> = {
  'STATE-01':
    'the incident list, when no platform incident is open. No control on this console creates one — a detector, a protocol timer, an invariant alert or a tenant report does.',
  'STATE-02':
    'the aggregates and the incident list while they are being fetched. A count that has not arrived renders as a placeholder, never as the number nought.',
  'STATE-03':
    'the aggregates and incidents below, each carrying the as-of stamp that says when it was true.',
  'STATE-04':
    'a close refused because the verification checklist is not complete with positive evidence for every item.',
  'STATE-05': 'a role without incident ownership meeting the close control.',
  'STATE-06':
    'the whole module, whose only write is the incident close. The banner below names the one cause, and the controls the state disables point back at it rather than restate it.',
  'STATE-07': 'nothing. Only the Frontline Worker Application has a true offline state.',
  'STATE-08':
    'a degraded aggregate, served last-known-good and stamped stale with its age (FB-SA-01).',
  'STATE-09':
    'nothing. This module issues no device command, and its only write — an incident close — commits with its audit record in one transaction, so it is never rendered as queued.',
  'STATE-10': 'the agent-health panel, while agent quality is degraded.',
  'STATE-11':
    'the agent-health panel, with every artificial-intelligence model unavailable. The module stays operable and the emergency pause stays exercisable (AC-SA-000-09).',
  'STATE-12':
    'a platform audit write that failed. FB-SA-03: the action does not happen — the incident is unchanged, and nothing can be submitted while the state holds.',
  'STATE-13':
    're-aggregation after a telemetry gap. An incident cannot close while any dependent view is behind.',
}
