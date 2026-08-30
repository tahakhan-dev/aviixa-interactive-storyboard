/**
 * `MOD-FL-B10` — Notifications. THE IDENTITY CARD, TRANSCRIBED.
 *
 * Frozen source §22.19, which opens at L41772. Identity card L41778-L41786;
 * the remaining card fields carry their own lines and are cited individually.
 *
 * WHAT "TRANSCRIBED" MEANS HERE — the discipline `fl-a5` settled and `fl-a6`
 * followed. Each statement's `text` is the card field's own prose with the
 * inline `[SoW Fact — §x.y]` classification markers lifted out into
 * `sourceClass`, and nothing else altered.
 *
 * ── THE ONE THING A READER OF THIS FILE HAS TO CARRY AWAY ──────────────
 *
 * THE STATES FIELD LISTS NINETEEN AND THE DEVICE OBSERVES FOUR, and the
 * narrowing sentence is the SECOND HALF OF THE SAME LINE that carries the
 * nineteen (L41808). A device inbox rendering a server-side state claims
 * knowledge no pull-based device has. `B10_NOTIFICATION_STATES` below is a
 * total record over all nineteen with the device's four marked, so a
 * rendering cannot reach a fifth.
 *
 * AND THE SOURCE'S OWN GLOSS COVERS SIX OF THE FIFTEEN, NOT FIFTEEN. L41808
 * says "the earlier states are server-side and are never inferred by the
 * device". `created`, `eligible`, `suppressed`, `queued`, `sent` and
 * `provider-accepted` are the six earlier than `delivered`. The nine that
 * follow `acknowledged` — claimed, acted, escalated, resolved, expired,
 * superseded, cancelled, failed, reconciled — are excluded from the device by
 * the first clause being exhaustive, and are NOT covered by the word
 * "earlier". `serverSideByTheEarlierClause` records which of the two grounds
 * each state is off the device on, because extending the gloss to nine states
 * the source did not gloss would be this build writing the source's sentence
 * for it.
 */

/** How the source classifies the claim, in the source's own vocabulary. */
export type B10SourceClass = 'SoW Fact'

export interface B10CardStatement {
  /** The card field's own label, verbatim. */
  readonly field: string
  readonly text: string
  readonly sourceRef: string
  /**
   * The field's own inline `[SoW Fact — §x.y]` marker, lifted out.
   *
   * `null` WHERE THE CARD CARRIES NO MARKER, and that is a recorded absence
   * rather than a default. Fifteen of the twenty-three fields carry no
   * classification marker of their own, and §22.19's Source status paragraph
   * (L41927) does not name them individually either.
   */
  readonly sourceClass: B10SourceClass | null
  /** What was left out of this field's prose, and where it went instead. */
  readonly elision: string | null
}

/**
 * TWENTY-THREE CARD FIELDS. Five of them — Identifier, Purpose, User benefit,
 * Owning surface, Roles that see and use it — are the identity card proper at
 * L41778-L41786, on the alternating text/blank-line rhythm the chapter uses
 * throughout, which is why the even lines are cited and the odd ones are not.
 *
 * THE STATES FIELD (L41808) IS NOT ONE OF THE TWENTY-THREE. It is a list of
 * nineteen identifiers plus a narrowing sentence rather than prose, and it is
 * carried in `B10_NOTIFICATION_STATES` below.
 */
export const B10_CARD = [
  {
    field: 'Identifier and name',
    text: 'MOD-FL-B10. Name. Notifications.',
    sourceRef: 'MOD-FL-B10 · L41778',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Purpose',
    text:
      'To provide an identity-scoped in-application inbox that back-fills on login, to carry the ' +
      'honest sync-status detail, and to deliver work-instruction change notices in two tiers, ' +
      'without operating-system push at launch.',
    sourceRef: 'L41780',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'User benefit',
    text:
      "A worker's messages follow them to whatever tablet they pick up, they are never interrupted " +
      'mid-step by an alert, and they are never surprised by a changed method.',
    sourceRef: 'L41782',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Owning surface',
    text:
      'Frontline Worker Application (SURF-FL) renders. One tenant notification model owns the ' +
      'notification records; the Delivery Operations Hub sends email and in-application ' +
      'notifications, the Client Command Center renders the live feed, and this module renders the ' +
      'Frontline inbox.',
    sourceRef: 'L41784',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Roles that see and use it',
    text: "Worker only, for their own identity's inbox.",
    sourceRef: 'L41786',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Preconditions',
    text:
      'An authenticated session. For back-fill, connectivity at some point since the notifications ' +
      'were created.',
    sourceRef: 'L41800',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Inputs',
    text:
      'Notification records addressed to the logged-in identity; sync-status detail from MOD-FL-A6; ' +
      'version-change commands and the mandatory republish description the author entered.',
    sourceRef: 'MOD-FL-A6 · L41802',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Outputs',
    text:
      'Rendered inbox items; read and acknowledgement states where the notification type carries ' +
      'them; the rendered change notice on the first screen of the next execution.',
    sourceRef: 'L41804',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Objects affected',
    text: 'OBJ-FL-INBOX the identity-scoped inbox; OBJ-FL-CHANGENOTICE.',
    sourceRef: 'OBJ-FL-INBOX · L41806',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Alternate paths',
    text:
      'A patch-level work-instruction change, which applies at the next execution without ceremony ' +
      'and forces no notification on the worker. A notified change, presented at the start of the ' +
      "next execution as a change notice built from the author's mandatory republish description, " +
      'with the affected steps flagged in situ where the worker meets them. An offline period ' +
      'during which no new notifications arrive.',
    sourceRef: 'L41817',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Online behaviour',
    text:
      'The inbox back-fills and updates; new notifications arrive on sync; read and acknowledgement ' +
      'states upload.',
    sourceRef: 'L41819',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Offline behaviour',
    text:
      'The inbox renders from the last back-fill as cached content, and the sync-status detail is ' +
      'live and local. No new notification can arrive, and no surface may imply one has.',
    sourceRef: 'L41821',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Reconnect behaviour',
    text:
      'New notifications arrive; read and acknowledgement states upload; a version-change command ' +
      'that arrived is held for the boundary of the next execution rather than interrupting an ' +
      'in-flight Run.',
    sourceRef: 'L41823',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Artificial-intelligence behaviour',
    text:
      'Not applicable — no artificial-intelligence capability composes, ranks, filters, or ' +
      'suppresses notifications on this surface. Notification routing is a structured, ' +
      'tenant-scoped record keyed by severity level, resolving roles to people on shift, and ' +
      "introducing a model into that path would make delivery non-deterministic where the " +
      "platform's escalation guarantees depend on determinism.",
    sourceRef: 'L41825',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'No-artificial-intelligence behaviour',
    text: 'Identical.',
    sourceRef: 'L41827',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Dependencies',
    text:
      "MOD-FL-A1 for identity scoping; MOD-FL-A6 for delivery and sync state; the Delivery " +
      'Operations Hub’s single tenant notification model; the Standards and Operations Studio for ' +
      'the republish description that becomes the change notice.',
    sourceRef: 'MOD-FL-A1 · L41829',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Interconnections',
    text:
      'Shares the sync detail sheet with MOD-FL-A2. Renders the change notice on the first screen ' +
      'of the next execution inside MOD-FL-A3. Carries the escalation outcomes MOD-FL-A5 and ' +
      'MOD-FL-B9 generate, as they are addressed to supervisory identities on their own surfaces ' +
      'rather than to the worker.',
    sourceRef: 'MOD-FL-A2 · L41831',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Audit',
    text:
      'Inbox back-fill, opening, reading, and acknowledgement where the type carries it are ' +
      'audited. The presentation of a notified-class change notice at the start of an execution is ' +
      "audited as part of that execution's record, because it establishes that the worker was " +
      'shown the change.',
    sourceRef: 'L41842',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Security',
    text:
      "The inbox follows the login, not the hardware, which means a shared tablet never exposes a " +
      "previous worker's messages. There is no external channel and no operating-system push " +
      'payload, which removes an entire class of information leakage to a device’s notification ' +
      'shade where a passer-by could read it.',
    sourceRef: 'L41844',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Fallback identifier',
    text:
      'FB-FL-CORE-01 primary; FB-FL-CMD-01 for version-change delivery; FB-FL-UP-01 for read-state ' +
      'upload.',
    sourceRef: 'FB-FL-CORE-01 · L41846',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Recovery and reconciliation',
    text:
      "Recovery is reconnection and back-fill. Reconciliation is the server's notification record " +
      "against the device's read and acknowledgement states, with the platform rule preserved " +
      'throughout: sending is not delivery, delivery is not opening, opening is not ' +
      'acknowledgement, and acknowledgement is not the business action.',
    sourceRef: 'L41848',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'The two grounds for no operating-system push, stated fully',
    text:
      'There is no operating-system-level push at launch, on two grounds. First, the model assumes ' +
      'the application is open during the shift, and the shared-station posture makes that ' +
      'assumption real: a worker is handed a tablet at shift start, logs in, works the shift, logs ' +
      'out, and the device returns to storage. Second, the platform makes no real-time push promise ' +
      'an offline floor cannot keep, which is the offline-honesty line applied to notifications. A ' +
      'worker sees notifications when they open the application and on sync, not as interruptive ' +
      'alerts. Operating-system push is a later addition, on the same two grounds.',
    sourceRef: 'L41850',
    sourceClass: 'SoW Fact',
    elision:
      'L41850 also carries RISK-FL-B10-1 and its mitigation, which are lifted into ' +
      'B10_RESIDUAL_RISK below so the risk renders as a risk rather than as the tail of a ' +
      'behaviour field.',
  },
  {
    field: 'Failure, first fallback, fallback failure, terminal safe state, recovery, reconciliation',
    text:
      'The failure is a notification that cannot be delivered. The first fallback is that the inbox ' +
      'back-fills at the next login, so nothing addressed to an identity is lost by a worker being ' +
      'offline or on a different tablet. The fallback failure is that a version-change command ' +
      'cannot be validated, in which case the prior version remains in force and the Run continues ' +
      'on it rather than starting against an unverified package. The terminal safe state is the ' +
      'last known good approved content, which is exactly what version pinning already guarantees. ' +
      "Recovery is redelivery. Reconciliation is the server's notification record against " +
      'device-observed states, with the honest distinction between sending, delivery, opening, and ' +
      'acknowledgement preserved.',
    sourceRef: 'L41898',
    sourceClass: null,
    elision: null,
  },
] as const satisfies readonly B10CardStatement[]

/* ==================================================================== *
 * THE NINETEEN NOTIFICATION STATES, AND THE FOUR THE DEVICE HAS.
 *
 * The whole vocabulary and the narrowing sentence are ONE LINE, L41808. The
 * platform states the same nineteen at L51605 under the heading "The nineteen
 * notification states" and at L9175 with the honesty rule, so the count here
 * is read off the source rather than counted by this build alone.
 * ==================================================================== */

export type B10NotificationState =
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

/** The four L41808 names as observable and writable by the device, in its order. */
export type B10DeviceObservableState = Extract<
  B10NotificationState,
  'delivered' | 'opened' | 'read' | 'acknowledged'
>

export interface B10NotificationStateRow {
  readonly id: B10NotificationState
  /** Whether L41808's first clause names it as one the device observes and writes. */
  readonly deviceObservable: boolean
  /**
   * Whether L41808's own gloss — "the earlier states are server-side and are
   * never inferred by the device" — reaches this state. TRUE for the six
   * before `delivered`. FALSE for the nine after `acknowledged`, which are off
   * the device because the first clause is exhaustive and NOT because the
   * source called them earlier. `null` for the four the device holds.
   */
  readonly serverSideByTheEarlierClause: boolean | null
}

export const B10_NOTIFICATION_STATES = [
  { id: 'created', deviceObservable: false, serverSideByTheEarlierClause: true },
  { id: 'eligible', deviceObservable: false, serverSideByTheEarlierClause: true },
  { id: 'suppressed', deviceObservable: false, serverSideByTheEarlierClause: true },
  { id: 'queued', deviceObservable: false, serverSideByTheEarlierClause: true },
  { id: 'sent', deviceObservable: false, serverSideByTheEarlierClause: true },
  { id: 'provider-accepted', deviceObservable: false, serverSideByTheEarlierClause: true },
  { id: 'delivered', deviceObservable: true, serverSideByTheEarlierClause: null },
  { id: 'opened', deviceObservable: true, serverSideByTheEarlierClause: null },
  { id: 'read', deviceObservable: true, serverSideByTheEarlierClause: null },
  { id: 'acknowledged', deviceObservable: true, serverSideByTheEarlierClause: null },
  { id: 'claimed', deviceObservable: false, serverSideByTheEarlierClause: false },
  { id: 'acted', deviceObservable: false, serverSideByTheEarlierClause: false },
  { id: 'escalated', deviceObservable: false, serverSideByTheEarlierClause: false },
  { id: 'resolved', deviceObservable: false, serverSideByTheEarlierClause: false },
  { id: 'expired', deviceObservable: false, serverSideByTheEarlierClause: false },
  { id: 'superseded', deviceObservable: false, serverSideByTheEarlierClause: false },
  { id: 'cancelled', deviceObservable: false, serverSideByTheEarlierClause: false },
  { id: 'failed', deviceObservable: false, serverSideByTheEarlierClause: false },
  { id: 'reconciled', deviceObservable: false, serverSideByTheEarlierClause: false },
] as const satisfies readonly B10NotificationStateRow[]

type MissingFromStates = Exclude<
  B10NotificationState,
  (typeof B10_NOTIFICATION_STATES)[number]['id']
>
const _statesExhaustive: MissingFromStates extends never ? true : never = true
void _statesExhaustive

export const B10_STATES_SOURCE_REF = 'L41808 (§22.19), L51605 (the platform’s own count)'

/** Derived, never listed twice. Four. */
export const B10_DEVICE_OBSERVABLE_STATES: readonly B10DeviceObservableState[] =
  B10_NOTIFICATION_STATES.filter((s) => s.deviceObservable).map(
    (s) => s.id as B10DeviceObservableState,
  )

/**
 * The states this device may never render as its own. Derived from the same
 * table, so the two directions cannot disagree and a state cannot be dropped
 * from one list by being forgotten in the other. Fifteen.
 */
export const B10_SERVER_SIDE_STATES: readonly B10NotificationState[] =
  B10_NOTIFICATION_STATES.filter((s) => !s.deviceObservable).map((s) => s.id)

/**
 * The gap in L41808's own gloss, held as data so it renders. Nine of the
 * fifteen off-device states are excluded from the device by the first clause
 * being exhaustive and are not reached by the word "earlier".
 */
export const B10_STATES_NOT_COVERED_BY_THE_EARLIER_CLAUSE: readonly B10NotificationState[] =
  B10_NOTIFICATION_STATES.filter((s) => s.serverSideByTheEarlierClause === false).map((s) => s.id)

/* ==================================================================== *
 * THE CLAIMS THIS MODULE MUST NEVER MAKE, HELD AS DATA SO THEY RENDER.
 * ==================================================================== */

export interface B10NeverClaimed {
  readonly claim: string
  readonly instead: string
  readonly sourceRef: string
}

export const B10_CLAIMS_NEVER_MADE = [
  {
    claim: 'That any notification state proves a business action happened.',
    instead:
      'Sending is not delivery, delivery is not opening, opening is not acknowledgement, and ' +
      'acknowledgement is not the business action. This is a platform invariant rather than a ' +
      'device-local nicety, and it is the rule reconciliation is required to preserve throughout. ' +
      'Nothing on this screen collapses two of those four into one word.',
    sourceRef: 'L41848',
  },
  {
    claim: 'That the device knows a state only the server holds.',
    instead:
      'The states the device can observe and write are delivered, opened, read, and acknowledged; ' +
      'the earlier states are server-side and are never inferred by the device. The inbox reads a ' +
      'total record over all nineteen with the four marked, so there is no branch through which a ' +
      'server-side state could be printed as this device’s own.',
    sourceRef: 'L41808',
  },
  {
    claim: 'That an alert reached the worker.',
    instead:
      'There is no operating-system push at launch and the platform makes no real-time push promise ' +
      'an offline floor cannot keep. A worker sees notifications when they open the application and ' +
      'on sync, not as interruptive alerts. The permission row for a push alert is rendered as a ' +
      'capability that exists nowhere for anyone rather than as one that is temporarily off.',
    sourceRef: 'L41850, L41797',
  },
  {
    claim: 'That a new notification arrived while the device was offline.',
    instead:
      'The inbox renders from the last back-fill as cached content and the sync-status detail is ' +
      'live and local. No new notification can arrive, and no surface may imply one has.',
    sourceRef: 'L41821',
  },
  {
    claim: 'That the worker owes the inbox anything.',
    instead:
      'General notifications carry no read obligation, so a worker may leave them unread and nothing ' +
      'gates on having opened the inbox. The single exception is the notified-class change notice, ' +
      'which is part of starting the work rather than an inbox item, and it is not in the inbox ' +
      'list at all — it is the first screen of the next execution.',
    sourceRef: 'L41795, L41796',
  },
] as const satisfies readonly B10NeverClaimed[]

/**
 * L41850's residual risk and its mitigation, lifted out of the card field so
 * the risk renders as a risk. The mitigation is structural rather than
 * notificational, which is the whole argument for shipping without push.
 */
export const B10_RESIDUAL_RISK = {
  id: 'RISK-FL-B10-1',
  risk:
    'awareness of a change or an escalation reaching the worker later than it would with push',
  mitigation:
    'The mitigation is structural rather than notificational — anything that must act immediately ' +
    'acts locally in the safety layer, and anything that changes the work is presented as part of ' +
    'starting the work.',
  sourceRef: 'RISK-FL-B10-1 · L41850',
} as const

/* ==================================================================== *
 * WHERE THIS MODULE SURFACES, AND WHOSE SHEET SHARES THE DESTINATION.
 * ==================================================================== */

export const B10_WHERE_IT_SURFACES = [
  {
    place: 'The Notifications and sync inbox, SCR-FL-04.',
    what: 'MOD-FL-B10 all features. Opened from persistent navigation, at depth 2 from login.',
    sourceRef: 'SCR-FL-04 · L48532',
  },
  {
    place: 'The same destination in the offline property table, where it is not alone.',
    what:
      'Cached read-only while offline — back-filled content from the last sync plus live local sync ' +
      'detail. The row lists MOD-FL-B10 and MOD-FL-A6 together.',
    sourceRef: 'MOD-FL-B10 · L40035',
  },
  {
    place: 'The sync detail sheet on this destination is MOD-FL-A6’s, not this module’s.',
    what:
      'The twenty-three-row register places the sync detail sheet across My Runs and Notifications ' +
      'and names MOD-FL-A2 and MOD-FL-A6 against it. This module carries the honest sync-status ' +
      'detail in its own card and renders none of that sheet.',
    sourceRef: 'SCR-FL-06 · L39868',
  },
] as const satisfies readonly {
  readonly place: string
  readonly what: string
  readonly sourceRef: string
}[]
