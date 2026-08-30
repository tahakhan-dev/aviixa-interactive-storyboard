/**
 * SLICE 10, TASK 3 — THE CLOSED VOCABULARIES THIS SLICE RENDERS.
 *
 * WHY THIS FILE IS IN `src/domain/` AND NOT IN `state.ts`. `state.ts` is the
 * SHAPE of the simulated world; these are platform-wide CLOSED SETS, the same
 * kind of thing as `roles.ts` (`RoleId`) and `surfaces.ts` (`SurfaceId`), which
 * are already their own modules beside it. Every one of these sets is read by
 * more than one surface — a notification state is written by the Hub, observed
 * by the Frontline device and rendered by the Command Center — so a
 * surface-scoped home would be the wrong one, and `src/studio/vocab/` (the
 * nineteen `SURF-STU` vocabularies) is the precedent for what a
 * surface-scoped one looks like. `state.ts` imports the three unions it needs
 * for its two untyped ledgers and nothing else.
 *
 * ── TWO OF THE SIX ARE NOT DECLARED HERE, DELIBERATELY ─────────────────────
 *
 * A second declaration of a closed set is how two lists drift apart, so
 * neither of these is copied into this file:
 *
 *   - THE THIRTEEN CAPTURE STATES — `CaptureState` / `CAPTURE_STATES` in
 *     `@/frontline/capture`, transcribed there off §22.6.1. Chapter 27 states
 *     the SAME thirteen a second time: prose at L50690 — "The thirteen states
 *     are:" — and a state diagram whose first node is at L50711.
 *     `tests/unit/slice-10-vocabularies.test.ts` transcribes chapter 27's
 *     thirteen INDEPENDENTLY and holds the two statements equal, so the
 *     agreement is measured rather than assumed.
 *   - THE FIFTEEN COMMAND LIFECYCLE STATES — `CommandState` in
 *     `@/ui/ScreenStateBoundary`, with the source's canonical ORDER in
 *     `COMMAND_STATES` at `@/surfaces/sa/command-state`. Chapter 27 states the
 *     same fifteen at L50792 — "Fifteen states are distinguished" — and its
 *     count conflict is recorded in `COMMAND_STATE_COUNT_READINGS` below
 *     rather than by minting a sixteenth list.
 *
 * Nothing here imports either module: `src/domain/` is the bottom layer and a
 * re-export would invert it. The agreement is a test, not an import.
 *
 * ── THE RULE THE WHOLE FILE EXISTS TO HOLD ─────────────────────────────────
 *
 * L51605 — "Sending is not delivery; delivery is not opening; opening is not
 * acknowledgement; acknowledgement is not the business action." Every union
 * below is CLOSED and every lookup over one is a TOTAL `Record`, so there is
 * no `default` branch a collapsed label could be printed from. `AC-CH27-02`
 * (L50596) and `AC-CH27-03` (L50597) are what that closure serves.
 */

/* ==================================================================== *
 * 1. THE NINETEEN NOTIFICATION STATES.
 *
 * MEASURED: nineteen, counted off L51605, which names them inline and calls
 * them nineteen in its own heading. `MOD-FL-B10` already holds these
 * nineteen as `B10NotificationState`, scoped to the Frontline module and
 * carrying which four the DEVICE observes; this is the platform-level
 * statement the Hub and Command Center read, and the test holds the two
 * equal member-for-member so the module copy cannot drift from it.
 * ==================================================================== */

export type NotificationState =
  | 'created'
  | 'eligible'
  | 'suppressed'
  | 'queued'
  | 'sent'
  | 'provider-accepted'
  | 'delivered'
  | 'opened'
  | 'read'
  | 'acknowledged'
  | 'claimed'
  | 'acted'
  | 'escalated'
  | 'resolved'
  | 'expired'
  | 'superseded'
  | 'cancelled'
  | 'failed'
  | 'reconciled'

/** L51605's own order, which is the order the numbered workflow walks. */
export const NOTIFICATION_STATES = [
  'created',
  'eligible',
  'suppressed',
  'queued',
  'sent',
  'provider-accepted',
  'delivered',
  'opened',
  'read',
  'acknowledged',
  'claimed',
  'acted',
  'escalated',
  'resolved',
  'expired',
  'superseded',
  'cancelled',
  'failed',
  'reconciled',
] as const satisfies readonly NotificationState[]

// Same idiom as `PERMISSION_OUTCOMES` in `@/policy/decision`, and it fails in
// BOTH directions: a twentieth member added to the union and not to the array
// makes this line stop compiling, and a string in the array that is not a
// member of the union fails the `satisfies` clause above.
type MissingFromNotificationStates = Exclude<
  NotificationState,
  (typeof NOTIFICATION_STATES)[number]
>
const _notificationStatesExhaustive: MissingFromNotificationStates extends never ? true : never =
  true
void _notificationStatesExhaustive

/**
 * The four distinctions L51605 opens with, as pairs, so a screen or a gate can
 * assert that no label folds one of them. These are the sentence's own pairs
 * and nothing beyond it — the fifteen other orderings of the nineteen are not
 * claimed here because the source does not claim them.
 */
export const NOTIFICATION_STATE_DISTINCTIONS = [
  { earlier: 'sent', later: 'delivered' },
  { earlier: 'delivered', later: 'opened' },
  { earlier: 'opened', later: 'acknowledged' },
  { earlier: 'acknowledged', later: 'acted' },
] as const satisfies readonly { earlier: NotificationState; later: NotificationState }[]

/**
 * The honesty sentence itself, verbatim, so a disclosure can render the
 * source's own words rather than a paraphrase of them. The last clause names
 * "the business action", which is `acted` in the vocabulary.
 */
export const NOTIFICATION_STATE_HONESTY_RULE = {
  text:
    'Sending is not delivery; delivery is not opening; opening is not acknowledgement; ' +
    'acknowledgement is not the business action.',
  sourceRef: 'L51605',
} as const

/* ==================================================================== *
 * 2. THE COMMAND LIFECYCLE COUNT, WHICH THE SOURCE STATES THREE WAYS.
 *
 * The VOCABULARY is fifteen and is already declared (see the header). What is
 * missing is the record of the disagreement, because three different numbers
 * are in the source and a screen that prints one of them silently picks a
 * side. MEASURED, by counting each enumeration rather than reading its
 * stated count:
 *
 *   15  the enumeration at L50792, and the acceptance criterion at L50882
 *       that requires all fifteen to be individually representable WITH
 *       `available for delivery` and `delivered` held distinct.
 *   14  the at-a-glance table row at L50583; the numbered workflow at
 *       L50796-L50809, which has fourteen numbered items because it collapses
 *       `available for delivery` and `delivered` into one `available`; the
 *       state diagram's fourteen nodes; the fourteen-row state-semantics
 *       table; and the traceability paragraph at L50893.
 *    8  the chapter's absolute-rule walk at L50547, which names eight states
 *       from `created` to `acknowledged` and calls the middle six
 *       intermediate. This is a WALK of the happy path, not a vocabulary: the
 *       six alternative endings are simply not on it.
 *
 * The acceptance criterion settles it at fifteen for anything a surface must
 * represent, which is why no list is minted here.
 * ==================================================================== */

export interface CommandStateCountReading {
  /** How many states this statement of the source accounts for. */
  readonly count: number
  /** Whether it is the closed vocabulary or a walk through part of it. */
  readonly kind: 'vocabulary' | 'walk' | 'stated count'
  readonly what: string
  readonly sourceRef: string
}

export const COMMAND_STATE_COUNT_READINGS = [
  {
    count: 15,
    kind: 'vocabulary',
    what: 'The enumeration in the business rules of the command channel section.',
    sourceRef: 'L50792 — "Fifteen states are distinguished"',
  },
  {
    count: 15,
    kind: 'vocabulary',
    what:
      'The acceptance criterion, which requires the two the other statements fold together to ' +
      'be held distinct. This is what settles the vocabulary at fifteen.',
    sourceRef:
      'L50882 — "All fifteen command states are individually representable and queryable per device"',
  },
  {
    count: 14,
    kind: 'stated count',
    what: 'The chapter at-a-glance table.',
    sourceRef: 'L50583 — "Command lifecycle states"',
  },
  {
    count: 14,
    kind: 'walk',
    what:
      'The numbered workflow of the command lifecycle, fourteen numbered items, which collapses ' +
      'the two states the acceptance criterion holds distinct into one.',
    sourceRef: 'L50796-L50809',
  },
  {
    count: 14,
    kind: 'stated count',
    what: 'The source-classification paragraph of the same section.',
    sourceRef: 'L50893 — "The fourteen-state enumeration"',
  },
  {
    count: 8,
    kind: 'walk',
    what:
      'The absolute rule of the chapter, which walks the happy path only and names the middle ' +
      'six intermediate. None of the six alternative endings is on it.',
    sourceRef: 'L50547 — "there are six intermediate truths"',
  },
] as const satisfies readonly CommandStateCountReading[]

/* ==================================================================== *
 * 3. NOTIFICATION SEVERITY AND PRIORITY — SEVEN ROWS IN ONE TABLE, AND
 *    NOT A FACT.
 *
 * MEASURED: the table at L73149 has one header row, one separator, and SEVEN
 * data rows at L73151-L73157 — four severity levels then three priority
 * levels, in one table.
 *
 * NO SCREEN MAY PRESENT ANY OF THIS AS A SOURCE-BACKED VALUE. L73186 — "The
 * four severity levels, the three priority levels, the assignment table, and
 * the unclassified fallback are" `Recommendation — R&D`. The only notification
 * severity the Statement of Work names at all is Critical, and only in the
 * re-notification rule.
 *
 * THAT BAR IS HELD BY THE TYPE, NOT BY A CONVENTION. `sourceClass` is the
 * single literal `'Recommendation — R&D'`, so a row asserting `'SoW Fact'`
 * does not compile; and the level's name is reachable only THROUGH a row, so
 * a caller cannot obtain a severity label without also holding the
 * classification and the decision that owns it.
 *
 * AND IT IS A THIRD VOCABULARY, NOT ONE OF THE TWO THAT ALREADY EXIST.
 * L73143 — "keeps the three vocabularies separate in every data structure and
 * every screen label". Deviation severity (Severity 1, Severity 2, Severity 3
 * and below) is the platform catalogue that `PlatformPartition.severityCatalog`
 * holds; anomaly severity at review time is Info, Concern, Critical. Neither
 * is this, and a Severity 1 deviation producing a Critical notification and a
 * Critical anomaly is what makes the three look identical at the top.
 * ==================================================================== */

export type NotificationSeverity = 'Critical' | 'High' | 'Medium' | 'Informational'
export type NotificationPriority = 'Immediate' | 'Standard' | 'Deferred'

/** The one classification any row of the L73149 table may carry. */
export type RecommendationOnly = 'Recommendation — R&D'

export interface NotificationLevelRow {
  /** The source's own level label, e.g. `Severity 1 of 4`. */
  readonly level: string
  readonly name: NotificationSeverity | NotificationPriority
  readonly axis: 'severity' | 'priority'
  readonly meaning: string
  readonly deliveryBehaviour: string
  readonly reNotification: string
  readonly digestEligible: string
  /** Not widenable. A row claiming to be a fact does not compile. */
  readonly sourceClass: RecommendationOnly
  /** The open decision that owns this row. Required, never inferred. */
  readonly decision: 'DEC-NOTIFSEV-001' | 'DEC-NOTIFPRI-001'
}

export const NOTIFICATION_LEVEL_ROWS = [
  {
    level: 'Severity 1 of 4',
    name: 'Critical',
    axis: 'severity',
    meaning: 'Safety, security, a hold, a suspension, or a compliance event',
    deliveryBehaviour: 'Immediate on both channels, acknowledgement required',
    reNotification: '4 hours, 1 hour in Regulated-Industry mode',
    digestEligible: 'No, never digest-only',
    sourceClass: 'Recommendation — R&D',
    decision: 'DEC-NOTIFSEV-001',
  },
  {
    level: 'Severity 2 of 4',
    name: 'High',
    axis: 'severity',
    meaning: 'Blocks work, or a governance decision is waiting',
    deliveryBehaviour:
      'Immediate on both channels, acknowledgement required where the category defines one',
    reNotification: 'Per the routing template',
    digestEligible: 'No, never digest-only',
    sourceClass: 'Recommendation — R&D',
    decision: 'DEC-NOTIFSEV-001',
  },
  {
    level: 'Severity 3 of 4',
    name: 'Medium',
    axis: 'severity',
    meaning: 'Needs attention this shift or this day',
    deliveryBehaviour: 'Immediate in-app, email per user preference',
    reNotification: 'None',
    digestEligible: 'Yes, in addition to immediate delivery',
    sourceClass: 'Recommendation — R&D',
    decision: 'DEC-NOTIFSEV-001',
  },
  {
    level: 'Severity 4 of 4',
    name: 'Informational',
    axis: 'severity',
    meaning: 'Record of something that happened',
    deliveryBehaviour: 'In-app, email per user preference',
    reNotification: 'None',
    digestEligible: 'Yes, may be digest-only',
    sourceClass: 'Recommendation — R&D',
    decision: 'DEC-NOTIFSEV-001',
  },
  {
    level: 'Priority 1 of 3',
    name: 'Immediate',
    axis: 'priority',
    meaning: 'Interrupt the current view with a banner or sheet',
    deliveryBehaviour: 'Not applicable — priority governs presentation, not channel',
    reNotification: 'Not applicable',
    digestEligible: 'Not applicable',
    sourceClass: 'Recommendation — R&D',
    decision: 'DEC-NOTIFPRI-001',
  },
  {
    level: 'Priority 2 of 3',
    name: 'Standard',
    axis: 'priority',
    meaning: 'Appear in the feed and inbox on arrival',
    deliveryBehaviour: 'Not applicable — priority governs presentation, not channel',
    reNotification: 'Not applicable',
    digestEligible: 'Not applicable',
    sourceClass: 'Recommendation — R&D',
    decision: 'DEC-NOTIFPRI-001',
  },
  {
    level: 'Priority 3 of 3',
    name: 'Deferred',
    axis: 'priority',
    meaning: 'Appear in the inbox and the next digest',
    deliveryBehaviour: 'Not applicable — priority governs presentation, not channel',
    reNotification: 'Not applicable',
    digestEligible: 'Not applicable',
    sourceClass: 'Recommendation — R&D',
    decision: 'DEC-NOTIFPRI-001',
  },
] as const satisfies readonly NotificationLevelRow[]

/**
 * TOTAL over the union, so every severity has a row and no severity can be
 * looked up through a fallback. The `Exclude` pair below is what makes a fifth
 * severity or a fourth priority a compile error rather than a missing row.
 */
type MissingSeverityRow = Exclude<
  NotificationSeverity,
  (typeof NOTIFICATION_LEVEL_ROWS)[number]['name']
>
const _severityRowsExhaustive: MissingSeverityRow extends never ? true : never = true
void _severityRowsExhaustive

type MissingPriorityRow = Exclude<
  NotificationPriority,
  (typeof NOTIFICATION_LEVEL_ROWS)[number]['name']
>
const _priorityRowsExhaustive: MissingPriorityRow extends never ? true : never = true
void _priorityRowsExhaustive

/**
 * The ONLY way to reach a level's label, and it hands back the classification
 * with it. A screen that wants to print "Critical" gets `sourceClass` in the
 * same object, so presenting it as a source-backed value takes a deliberate
 * discard rather than an oversight.
 */
export function notificationLevel(
  name: NotificationSeverity | NotificationPriority,
): NotificationLevelRow {
  const row = NOTIFICATION_LEVEL_ROWS.find((r) => r.name === name)
  // Unreachable while the two `Exclude` checks above compile: every member of
  // both unions has a row. Thrown rather than defaulted, because a plausible
  // default is exactly the collapse this file exists to prevent.
  if (!row) throw new Error(`No notification level row for ${name}`)
  return row
}

/* ==================================================================== *
 * 4. THE THIRTEEN TIMING CLASSIFICATIONS, TC-01 TO TC-13.
 *
 * MEASURED: the table at L98082 has one header row, one separator, and
 * THIRTEEN data rows at L98084-L98096. L98080 states thirteen — "The
 * commission fixes thirteen." — and the enumeration agrees with its own
 * stated count, which is not true of the command lifecycle above.
 *
 * THE CODES ARE NOT TITLES. L98080 — the codes "are never reader-facing
 * titles". A screen renders `classification`; `code` is for the registers.
 * ==================================================================== */

export type TimingClassificationCode =
  | 'TC-01'
  | 'TC-02'
  | 'TC-03'
  | 'TC-04'
  | 'TC-05'
  | 'TC-06'
  | 'TC-07'
  | 'TC-08'
  | 'TC-09'
  | 'TC-10'
  | 'TC-11'
  | 'TC-12'
  | 'TC-13'

export interface TimingClassificationRow {
  readonly code: TimingClassificationCode
  /** The reader-facing title. This is what a screen prints. */
  readonly classification: string
  readonly owner: string
  readonly calendarRuleAppropriate: string
}

export const TIMING_CLASSIFICATIONS = [
  {
    code: 'TC-01',
    classification: 'No time-based behaviour',
    owner: 'Not applicable — no execution occurs',
    calendarRuleAppropriate: 'No — nothing to schedule',
  },
  {
    code: 'TC-02',
    classification: 'Event-driven',
    owner: 'The service that owns the originating event',
    calendarRuleAppropriate: 'No — a calendar rule would introduce delay and duplication',
  },
  {
    code: 'TC-03',
    classification: 'Action-time deterministic validation',
    owner: 'The service handling the attempted action, or the device for local gates',
    calendarRuleAppropriate: 'No — and a sweeper must never be the only check',
  },
  {
    code: 'TC-04',
    classification: 'Frontline local signed timer or offline-expiry check',
    owner: 'The Frontline Worker Application',
    calendarRuleAppropriate: 'No — a server calendar cannot reach an offline device',
  },
  {
    code: 'TC-05',
    classification: 'Durable one-time business deadline',
    owner: 'Scheduled Execution Worker acting on that record',
    calendarRuleAppropriate: 'Partly — a sweeper finds due records, but the deadline lives on the record',
  },
  {
    code: 'TC-06',
    classification: 'Recurring business schedule',
    owner: 'Scheduled Execution Worker under a tenant-scoped identity',
    calendarRuleAppropriate: 'Yes — this is the natural home of a calendar rule',
  },
  {
    code: 'TC-07',
    classification: 'Delayed queue item, retry or escalation',
    owner: 'The queue and escalation services',
    calendarRuleAppropriate: 'Partly — a delay queue is the right tool; a fixed calendar rule is not',
  },
  {
    code: 'TC-08',
    classification: 'Data-pipeline or analytical schedule',
    owner: 'Data-pipeline identity',
    calendarRuleAppropriate: 'Yes, with as-of stamping',
  },
  {
    code: 'TC-09',
    classification: 'Artificial-intelligence evaluation or maintenance schedule',
    owner: 'Artificial-intelligence scheduler identity',
    calendarRuleAppropriate: 'Yes, and never as a gate substitute',
  },
  {
    code: 'TC-10',
    classification: 'Platform or infrastructure maintenance schedule',
    owner: 'Platform operations identity',
    calendarRuleAppropriate: 'Yes, with a calendar and notices',
  },
  {
    code: 'TC-11',
    classification: 'Storage or retention lifecycle policy',
    owner: 'Data-lifecycle scheduler identity',
    calendarRuleAppropriate: 'Yes, and never as an unconditional deletion',
  },
  {
    code: 'TC-12',
    classification: 'Manual governed operation',
    owner: 'A named human identity',
    calendarRuleAppropriate: 'No — automating it would remove the control',
  },
  {
    code: 'TC-13',
    classification: 'Client Decision Required',
    owner: 'Undetermined until the decision lands',
    calendarRuleAppropriate: 'Undetermined',
  },
] as const satisfies readonly TimingClassificationRow[]

type MissingTimingRow = Exclude<
  TimingClassificationCode,
  (typeof TIMING_CLASSIFICATIONS)[number]['code']
>
const _timingRowsExhaustive: MissingTimingRow extends never ? true : never = true
void _timingRowsExhaustive

/* ==================================================================== *
 * 5. THE TWO SCHEDULING LIFECYCLES — THE DEFINITION AND THE OCCURRENCE.
 *
 * They are separate machines on purpose, and this file keeps them separate
 * types for the same reason: a rule that is paused has not deleted the
 * moments it already planned, and a moment that failed does not mean the rule
 * is broken.
 *
 * MEASURED. Definition: TEN states (diagram nodes L99022-L99031) and
 * FOURTEEN transitions (table header L99054, separator L99055, body
 * L99056-L99069). Occurrence: FIFTEEN states (diagram nodes L99091-L99105)
 * and NINETEEN transitions (header L99137, separator L99138, body
 * L99139-L99157).
 *
 * EVERY TRANSITION NAMES ITS CAUSER, AND THAT IS THE POINT. L99004 — "every
 * transition names a causing identity, human or non-human, and writes an
 * audit event in the same transaction as the transition". `causerClass`
 * distinguishes the two shapes of non-human the source itself distinguishes:
 * a NAMED non-human identity, and no human on this console at all.
 * ==================================================================== */

/**
 * Which kind of actor may cause a transition.
 *
 * `noHumanOnThisConsole` is not a synonym for `nonHumanIdentity`. Two
 * definition transitions read L99062 — "No human on this console; the tenant
 * lifecycle causes it" — which is a statement about WHERE the cause lives,
 * not about which identity performs it, and the scheduling console must
 * therefore offer no control for them at all.
 */
export type TransitionCauserClass = 'human' | 'nonHumanIdentity' | 'noHumanOnThisConsole'

export type ScheduleDefinitionState =
  | 'draft'
  | 'pending-approval'
  | 'approved'
  | 'active'
  | 'paused'
  | 'suspended-by-tenant-state'
  | 'held-by-maintenance-window'
  | 'superseded'
  | 'retired'
  | 'archived'

export const SCHEDULE_DEFINITION_STATES = [
  'draft',
  'pending-approval',
  'approved',
  'active',
  'paused',
  'suspended-by-tenant-state',
  'held-by-maintenance-window',
  'superseded',
  'retired',
  'archived',
] as const satisfies readonly ScheduleDefinitionState[]

type MissingDefinitionState = Exclude<
  ScheduleDefinitionState,
  (typeof SCHEDULE_DEFINITION_STATES)[number]
>
const _definitionStatesExhaustive: MissingDefinitionState extends never ? true : never = true
void _definitionStatesExhaustive

export type ScheduleOccurrenceState =
  | 'planned'
  | 'due'
  | 'suppressed'
  | 'misfired'
  | 'claimed'
  | 'executing'
  | 'partially-executed'
  | 'skipped'
  | 'succeeded'
  | 'failed-retryable'
  | 'dead-lettered'
  | 'quarantined'
  | 'cancelled'
  | 'expired'
  | 'reconciled'

export const SCHEDULE_OCCURRENCE_STATES = [
  'planned',
  'due',
  'suppressed',
  'misfired',
  'claimed',
  'executing',
  'partially-executed',
  'skipped',
  'succeeded',
  'failed-retryable',
  'dead-lettered',
  'quarantined',
  'cancelled',
  'expired',
  'reconciled',
] as const satisfies readonly ScheduleOccurrenceState[]

type MissingOccurrenceState = Exclude<
  ScheduleOccurrenceState,
  (typeof SCHEDULE_OCCURRENCE_STATES)[number]
>
const _occurrenceStatesExhaustive: MissingOccurrenceState extends never ? true : never = true
void _occurrenceStatesExhaustive

export interface ScheduleTransition<TState extends string> {
  /** The transition's own label in the source's table. */
  readonly label: string
  /**
   * Every state the transition may leave. More than one where the table's row
   * names more than one, e.g. "Active or Paused to Retired".
   */
  readonly from: readonly TState[]
  readonly to: TState
  /** The causer column, as the source words it. */
  readonly causer: string
  readonly causerClass: TransitionCauserClass
}

/**
 * The fourteen definition transitions, in table order. MEASURED across the
 * `causerClass` column: NINE human, THREE a named non-human identity, TWO no
 * human on this console.
 */
export const SCHEDULE_DEFINITION_TRANSITIONS = [
  {
    label: 'Draft to Pending approval',
    from: ['draft'],
    to: 'pending-approval',
    causer:
      'Platform Engineer for engineering-class definitions; Admin for operational-class definitions',
    causerClass: 'human',
  },
  {
    label: 'Pending approval to Draft',
    from: ['pending-approval'],
    to: 'draft',
    causer: 'Admin, or the Root Super Admin for critical-class definitions',
    causerClass: 'human',
  },
  {
    label: 'Pending approval to Approved',
    from: ['pending-approval'],
    to: 'approved',
    causer: 'Admin for Platform Engineer submissions; Root Super Admin for critical-class definitions',
    causerClass: 'human',
  },
  {
    label: 'Approved to Active',
    from: ['approved'],
    to: 'active',
    causer: 'Admin',
    causerClass: 'human',
  },
  {
    label: 'Active to Paused',
    from: ['active'],
    to: 'paused',
    causer: 'Admin, or Platform Engineer with Admin approval',
    causerClass: 'human',
  },
  {
    label: 'Paused to Active',
    from: ['paused'],
    to: 'active',
    causer: 'Admin',
    causerClass: 'human',
  },
  {
    label: 'Active to Suspended by tenant state',
    from: ['active'],
    to: 'suspended-by-tenant-state',
    causer: 'No human on this console; the tenant lifecycle causes it',
    causerClass: 'noHumanOnThisConsole',
  },
  {
    label: 'Suspended by tenant state to Active',
    from: ['suspended-by-tenant-state'],
    to: 'active',
    causer: 'No human on this console; the tenant lifecycle causes it',
    causerClass: 'noHumanOnThisConsole',
  },
  {
    label: 'Active to Held by a maintenance window',
    from: ['active'],
    to: 'held-by-maintenance-window',
    causer: 'The maintenance calendar, non-human',
    causerClass: 'nonHumanIdentity',
  },
  {
    label: 'Held by a maintenance window to Active',
    from: ['held-by-maintenance-window'],
    to: 'active',
    causer: 'The maintenance calendar, non-human',
    causerClass: 'nonHumanIdentity',
  },
  {
    label: 'Active to Superseded',
    from: ['active'],
    to: 'superseded',
    causer: 'Admin, on activation of the new revision',
    causerClass: 'human',
  },
  {
    label: 'Superseded to Active',
    from: ['superseded'],
    to: 'active',
    causer: 'Admin, with the same approval path as a change',
    causerClass: 'human',
  },
  {
    label: 'Active or Paused to Retired',
    from: ['active', 'paused'],
    to: 'retired',
    causer: 'Admin; Root Super Admin where the definition is critical-class',
    causerClass: 'human',
  },
  {
    label: 'Retired to Archived',
    from: ['retired'],
    to: 'archived',
    causer: 'Data-lifecycle scheduler identity',
    causerClass: 'nonHumanIdentity',
  },
] as const satisfies readonly ScheduleTransition<ScheduleDefinitionState>[]

/**
 * The nineteen occurrence transitions, in table order. MEASURED across the
 * `causerClass` column: SIXTEEN a named non-human identity, THREE human. The
 * scheduling machinery moves an occurrence; a person may only cancel a future
 * one, release a quarantined one, or write one off.
 *
 * ONE `from` LIST IS DERIVED RATHER THAN TRANSCRIBED. The last row's label is
 * "Any terminal state to Reconciled" and names no states, so its four are
 * read off the diagram's own edges into `Reconciled` at L99126-L99129:
 * succeeded, skipped, expired, cancelled.
 */
export const SCHEDULE_OCCURRENCE_TRANSITIONS = [
  {
    label: 'Planned to Due',
    from: ['planned'],
    to: 'due',
    causer: 'Scheduler Controller identity',
    causerClass: 'nonHumanIdentity',
  },
  {
    label: 'Planned to Suppressed',
    from: ['planned'],
    to: 'suppressed',
    causer: 'Scheduler Controller identity, following the definition state',
    causerClass: 'nonHumanIdentity',
  },
  {
    label: 'Planned to Cancelled',
    from: ['planned'],
    to: 'cancelled',
    causer: 'Admin; Platform Engineer with Admin approval',
    causerClass: 'human',
  },
  {
    label: 'Due to Misfired',
    from: ['due'],
    to: 'misfired',
    causer: 'Scheduler Controller identity',
    causerClass: 'nonHumanIdentity',
  },
  {
    label: 'Due to Claimed',
    from: ['due'],
    to: 'claimed',
    causer: 'Scheduled Execution Worker identity',
    causerClass: 'nonHumanIdentity',
  },
  {
    label: 'Claimed to Executing',
    from: ['claimed'],
    to: 'executing',
    causer: 'Scheduled Execution Worker identity',
    causerClass: 'nonHumanIdentity',
  },
  {
    label: 'Claimed to Skipped',
    from: ['claimed'],
    to: 'skipped',
    causer: "Scheduled Execution Worker identity, on the owning service's refusal",
    causerClass: 'nonHumanIdentity',
  },
  {
    label: 'Executing to Succeeded',
    from: ['executing'],
    to: 'succeeded',
    causer: 'Owning business service, recorded by the worker',
    causerClass: 'nonHumanIdentity',
  },
  {
    label: 'Executing to Partially executed',
    from: ['executing'],
    to: 'partially-executed',
    causer: 'Scheduled Execution Worker identity',
    causerClass: 'nonHumanIdentity',
  },
  {
    label: 'Executing to Failed retryable',
    from: ['executing'],
    to: 'failed-retryable',
    causer: 'Scheduled Execution Worker identity',
    causerClass: 'nonHumanIdentity',
  },
  {
    label: 'Failed retryable to Due',
    from: ['failed-retryable'],
    to: 'due',
    causer: 'Scheduler Controller identity',
    causerClass: 'nonHumanIdentity',
  },
  {
    label: 'Failed retryable to Dead lettered',
    from: ['failed-retryable'],
    to: 'dead-lettered',
    causer: 'Scheduler Controller identity',
    causerClass: 'nonHumanIdentity',
  },
  {
    label: 'Executing to Quarantined',
    from: ['executing'],
    to: 'quarantined',
    causer: 'Scheduled Execution Worker identity',
    causerClass: 'nonHumanIdentity',
  },
  {
    label: 'Misfired to Due',
    from: ['misfired'],
    to: 'due',
    causer: 'Scheduler Controller identity',
    causerClass: 'nonHumanIdentity',
  },
  {
    label: 'Misfired to Expired',
    from: ['misfired'],
    to: 'expired',
    causer: 'Scheduler Controller identity',
    causerClass: 'nonHumanIdentity',
  },
  {
    label: 'Quarantined to Due',
    from: ['quarantined'],
    to: 'due',
    causer: 'Admin; Root Super Admin where the underlying work is critical-class',
    causerClass: 'human',
  },
  {
    label: 'Quarantined or Dead lettered to Cancelled',
    from: ['quarantined', 'dead-lettered'],
    to: 'cancelled',
    causer: 'Admin; Root Super Admin for critical-class work',
    causerClass: 'human',
  },
  {
    label: 'Partially executed to Succeeded',
    from: ['partially-executed'],
    to: 'succeeded',
    causer: 'Scheduled Execution Worker identity',
    causerClass: 'nonHumanIdentity',
  },
  {
    label: 'Any terminal state to Reconciled',
    from: ['succeeded', 'skipped', 'expired', 'cancelled'],
    to: 'reconciled',
    causer: 'Reconciliation pass, non-human',
    causerClass: 'nonHumanIdentity',
  },
] as const satisfies readonly ScheduleTransition<ScheduleOccurrenceState>[]
