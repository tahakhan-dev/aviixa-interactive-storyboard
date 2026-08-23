/**
 * THE SIGNAL REGISTRIES — two notification registers, one event catalogue, one
 * command catalogue, and the key space two of them share.
 *
 * ── THE COLLISION, MEASURED ────────────────────────────────────────────────
 * The frozen source catalogues notifications TWICE, and both catalogues key on
 * `NOTIF-*`:
 *
 *   - Chapter 27.7's notification catalog. Header L51686, separator L51687,
 *     body L51688-L51712. TWENTY-FIVE data rows, counted by reading to where
 *     the body stops: the line after the last row is blank and the two-level
 *     configuration model opens at L51714.
 *   - Chapter 30C.2's notification-category catalog. THIRTEEN family tables
 *     between L72948 and L73096, EIGHTY-SEVEN data rows, `NOTIF-001` through
 *     `NOTIF-087`, contiguous, no gaps and no duplicates.
 *
 * Chapter 27.7 describes itself as the narrower of the two — L51609 says the
 * full architecture "is owned by Chapter 30C, Notification Architecture. This
 * section catalogues the notifications and states the contract; it does not
 * duplicate that chapter."
 *
 * IT IS NOT A SUBSET. All twenty-five of Chapter 27.7's identifiers also exist
 * in Chapter 30C.2, and NOT ONE OF THE TWENTY-FIVE CARRIES THE SAME NAME IN
 * BOTH. Measured, not assumed: the intersection is 25 and the name agreement is
 * 0. `NOTIF-001` is "Subscription or tier lifecycle change" at L51688 and
 * "Tenant workspace activated" at L72950. `NOTIF-010` is "Severity 1
 * escalation" at L51697 and "Hard suspension entered" at L72959. It is a
 * DIFFERENT ASSIGNMENT of the same key space, not a shorter version of one.
 *
 * ── WHY A BARE `NOTIF-*` LITERAL CANNOT BE USED HERE ───────────────────────
 * Because a bare identifier does not identify anything. Twenty-five of the
 * eighty-seven keys name two different notifications, so any function taking a
 * bare `'NOTIF-001'` must either guess a register or return two answers, and
 * both of those are how the wrong notification reaches a screen.
 *
 * So there is no such function. `NotificationKey` is a BRANDED string, and the
 * brand is unforgeable outside this module: the only way to obtain one is
 * `notificationKey(register, id)`, which takes the register FIRST and narrows
 * the permitted identifier to that register's own range. Every one of these is
 * a compile error, and `tests/unit/slice-10-signals.test.ts` pins each with a
 * `@ts-expect-error`:
 *
 *     resolveNotification('NOTIF-001')                    // not branded
 *     notificationKey('ch-27.7-catalog', 'NOTIF-042')     // out of range: 25
 *     lookupNotification('NOTIF-001')                     // arity: no register
 *
 * ── COUNTS: WHAT IS SAFE TO RENDER, AND WHAT MUST CARRY A LABEL ────────────
 * The eighty-seven is a `Derived Clarification`, recorded as
 * `DEC-NOTIFCOUNT-001`, and it says so itself at L72927: "The number
 * eighty-seven is `Derived Clarification`, not a source fact." L73133 extends
 * that label to the thirteen-family organisation and to the class distribution.
 * `SIGNAL_COUNTS` therefore carries the label on every row that needs it and
 * `NOTIFICATION_COUNT_LABEL` is what a screen must render beside the number.
 *
 * TWO COUNT CONTRADICTIONS ARE CARRIED, NOT RESOLVED.
 *
 * (1) The prose class distribution at L72929 does not match its own catalogue.
 * It claims 34 notifications, 9 alerts, 12 action-required, 8 approval
 * requests, 0 general tasks, 6 reminders, 15 escalations, 3 command-linked.
 * That sums to 87, which is the right total — and only two of its eight
 * figures survive a count of the rows. `NOTIFICATION_CLASS_DISTRIBUTION`
 * holds both sides. No folding of the compound class tokens reaches the prose:
 * the decisive one is command-linked, where the catalogue holds FIVE rows
 * against the prose's THREE, so no amount of folding OTHER tokens into
 * command-linked can reduce it — folding only ever adds. Escalation is the
 * mirror: 8 rows, plus the single compound "Reminder and escalation", is 9,
 * and the prose says 15.
 *
 * (2) Mandatory baselines. Chapter 27.7 has NINE rows whose Family cell reads
 * "Mandatory baseline", which is the number `TEST-27.7-03` states at L51734.
 * Chapter 30C.2 has TWENTY-THREE rows whose Mandatory cell opens
 * affirmatively — 21 bare "Yes", plus "Yes, by the Severity 1 floor" and "Yes
 * for Critical". These are two different senses of the word and are NEVER
 * summed. The 27.7 sense is membership of the three baseline FAMILIES; the
 * 30C.2 sense is per-category non-disableability.
 *
 * ── SEVERITY IS NOT A SOURCE-BACKED VALUE ──────────────────────────────────
 * Chapter 30C.2's Severity column is transcribed as `recommendedSeverity` and
 * that name is the point. L72944 states it outright: severity values "are
 * `Recommendation — R&D` in every row", recorded under `DEC-NOTIFSEV-001`
 * (L73147). NO SCREEN MAY PRESENT A NOTIFICATION SEVERITY AS SOURCE-BACKED.
 *
 * ── THE OTHER TWO CATALOGUES, AND WHY THEIR REGISTRY COUNTS ARE HIGHER ─────
 * Events: TWENTY-FIVE catalogued rows — nine capture (L51051-L51059) and
 * sixteen operational-and-server (L51177-L51192, four `EVT-OPS-*` and twelve
 * `EVT-SRV-*`). `registries/generated/events.json` holds 28 rows. The three
 * extras are real source identifiers from elsewhere and are held separately in
 * `EVENT_REGISTRY_EXTRAS` with their provenance, never merged into the
 * catalogue.
 *
 * Commands: SIXTEEN catalogued rows across two Panel A tables, eight each —
 * L51387-L51394 and L51490-L51497. Here the source states the count beside the
 * enumeration and the two AGREE: L51334 reads "Sixteen command instances are
 * catalogued across those five classes." `registries/generated/commands.json`
 * holds 17; the extra is `CMD-BB-000097`, an audit-record identifier appearing
 * inside an `Illustrative Example` at L74155, and it is held in
 * `COMMAND_REGISTRY_EXTRAS`.
 *
 * The five classes are closed and the closure is a security property, in the
 * source's own words at L51330: "A command channel with an open class list is a
 * remote-execution surface." `CMD-SUSP-005` is the one instance whose Class
 * cell refuses to name a class, and `DEC-CMDCLASS-001` (L51551) is the decision
 * that refusal raises.
 *
 * ── WHAT THIS MODULE IS NOT ────────────────────────────────────────────────
 * It is data plus two lookups. It holds no state vocabularies — the nineteen
 * notification states (L51605), the command states and the severity and
 * priority levels are `src/domain/`'s, and this module deliberately does not
 * restate them. It renders nothing. It decides nothing.
 */

/**
 * The two registers, named for the chapter that mints each. Lowercase on
 * purpose: an uppercase register token would read as a frozen-source
 * identifier to every citation gate in this tree, and neither of these is one.
 */
export const NOTIFICATION_REGISTERS = ['ch-27.7-catalog', 'ch-30c.2-categories'] as const

export type NotificationRegisterId = (typeof NOTIFICATION_REGISTERS)[number]

/** Chapter 27.7's twenty-five identifiers. Body L51688-L51712. */
export type Ch277NotificationId =
  | 'NOTIF-001'
  | 'NOTIF-002'
  | 'NOTIF-003'
  | 'NOTIF-004'
  | 'NOTIF-005'
  | 'NOTIF-006'
  | 'NOTIF-007'
  | 'NOTIF-008'
  | 'NOTIF-009'
  | 'NOTIF-010'
  | 'NOTIF-011'
  | 'NOTIF-012'
  | 'NOTIF-013'
  | 'NOTIF-014'
  | 'NOTIF-015'
  | 'NOTIF-016'
  | 'NOTIF-017'
  | 'NOTIF-018'
  | 'NOTIF-019'
  | 'NOTIF-020'
  | 'NOTIF-021'
  | 'NOTIF-022'
  | 'NOTIF-023'
  | 'NOTIF-024'
  | 'NOTIF-025'

/** Chapter 30C.2's eighty-seven identifiers. Thirteen tables, L72948-L73096. */
export type Ch30C2NotificationId =
  | 'NOTIF-001'
  | 'NOTIF-002'
  | 'NOTIF-003'
  | 'NOTIF-004'
  | 'NOTIF-005'
  | 'NOTIF-006'
  | 'NOTIF-007'
  | 'NOTIF-008'
  | 'NOTIF-009'
  | 'NOTIF-010'
  | 'NOTIF-011'
  | 'NOTIF-012'
  | 'NOTIF-013'
  | 'NOTIF-014'
  | 'NOTIF-015'
  | 'NOTIF-016'
  | 'NOTIF-017'
  | 'NOTIF-018'
  | 'NOTIF-019'
  | 'NOTIF-020'
  | 'NOTIF-021'
  | 'NOTIF-022'
  | 'NOTIF-023'
  | 'NOTIF-024'
  | 'NOTIF-025'
  | 'NOTIF-026'
  | 'NOTIF-027'
  | 'NOTIF-028'
  | 'NOTIF-029'
  | 'NOTIF-030'
  | 'NOTIF-031'
  | 'NOTIF-032'
  | 'NOTIF-033'
  | 'NOTIF-034'
  | 'NOTIF-035'
  | 'NOTIF-036'
  | 'NOTIF-037'
  | 'NOTIF-038'
  | 'NOTIF-039'
  | 'NOTIF-040'
  | 'NOTIF-041'
  | 'NOTIF-042'
  | 'NOTIF-043'
  | 'NOTIF-044'
  | 'NOTIF-045'
  | 'NOTIF-046'
  | 'NOTIF-047'
  | 'NOTIF-048'
  | 'NOTIF-049'
  | 'NOTIF-050'
  | 'NOTIF-051'
  | 'NOTIF-052'
  | 'NOTIF-053'
  | 'NOTIF-054'
  | 'NOTIF-055'
  | 'NOTIF-056'
  | 'NOTIF-057'
  | 'NOTIF-058'
  | 'NOTIF-059'
  | 'NOTIF-060'
  | 'NOTIF-061'
  | 'NOTIF-062'
  | 'NOTIF-063'
  | 'NOTIF-064'
  | 'NOTIF-065'
  | 'NOTIF-066'
  | 'NOTIF-067'
  | 'NOTIF-068'
  | 'NOTIF-069'
  | 'NOTIF-070'
  | 'NOTIF-071'
  | 'NOTIF-072'
  | 'NOTIF-073'
  | 'NOTIF-074'
  | 'NOTIF-075'
  | 'NOTIF-076'
  | 'NOTIF-077'
  | 'NOTIF-078'
  | 'NOTIF-079'
  | 'NOTIF-080'
  | 'NOTIF-081'
  | 'NOTIF-082'
  | 'NOTIF-083'
  | 'NOTIF-084'
  | 'NOTIF-085'
  | 'NOTIF-086'
  | 'NOTIF-087'

/** Which identifiers a register admits. `NOTIF-042` exists in one only. */
export type NotificationIdOf<R extends NotificationRegisterId> = R extends 'ch-27.7-catalog'
  ? Ch277NotificationId
  : Ch30C2NotificationId

declare const NOTIFICATION_KEY: unique symbol

/**
 * A register-qualified notification reference. It is a `string` at runtime — a
 * map key, printable, serialisable — and it is NOT a string at compile time,
 * because the brand cannot be written by hand. `notificationKey` is the only
 * producer, so no call site can supply a bare `NOTIF-*` literal in its place
 * and no register can be silently defaulted.
 */
export type NotificationKey = string & { readonly [NOTIFICATION_KEY]: 'notification' }

/** Builds the only kind of reference the resolvers accept. */
export function notificationKey<R extends NotificationRegisterId>(
  register: R,
  id: NotificationIdOf<R>,
): NotificationKey {
  return `${register}#${id}` as NotificationKey
}

/** One row of Chapter 27.7's catalog, transcribed column for column. */
export interface Ch277NotificationRow {
  readonly id: Ch277NotificationId
  readonly name: string
  /** The Family column. Nine rows read exactly `Mandatory baseline`. */
  readonly family: string
  /** The `Mandatory?` column, verbatim — it is prose, not a boolean. */
  readonly mandatory: string
  /** The Trigger event column. Often an `EVT-*` or `CMD-*` identifier. */
  readonly triggerEvent: string
  readonly sourceLine: number
}

/** One row of Chapter 30C.2's category catalog, transcribed column for column. */
export interface Ch30C2NotificationRow {
  readonly id: Ch30C2NotificationId
  readonly name: string
  /** The Class column, against the eight terms of 30C.1. Eleven distinct values occur. */
  readonly className: string
  /** The Mandatory column, verbatim. Twenty-three open affirmatively. */
  readonly mandatory: string
  readonly defaultAudience: string
  /**
   * The Severity column. `Recommendation — R&D` in every row per L72944, under
   * `DEC-NOTIFSEV-001`. Never render this as a source-backed value.
   */
  readonly recommendedSeverity: string
  /** 1..13, the family table this row sits in. See `NOTIFICATION_FAMILIES`. */
  readonly family: number
  readonly sourceLine: number
}

/** A row with its register attached. Discriminated, so neither shape leaks. */
export type NotificationRow =
  | ({ readonly register: 'ch-27.7-catalog' } & Ch277NotificationRow)
  | ({ readonly register: 'ch-30c.2-categories' } & Ch30C2NotificationRow)

export const CH_27_7_CATALOG = [
  { id: 'NOTIF-001', name: 'Subscription or tier lifecycle change', family: 'Mandatory baseline', mandatory: 'Yes, cannot be disabled', triggerEvent: 'Tenant lifecycle or tier change', sourceLine: 51688 },
  { id: 'NOTIF-002', name: 'Qualification expiry at 14 days', family: 'Mandatory baseline', mandatory: 'Yes, cannot be disabled', triggerEvent: 'EVT-SRV-006', sourceLine: 51689 },
  { id: 'NOTIF-003', name: 'Qualification expiry at 7 days', family: 'Mandatory baseline', mandatory: 'Yes, cannot be disabled', triggerEvent: 'EVT-SRV-006', sourceLine: 51690 },
  { id: 'NOTIF-004', name: 'Qualification expiry at 1 day', family: 'Mandatory baseline', mandatory: 'Yes, cannot be disabled', triggerEvent: 'EVT-SRV-006', sourceLine: 51691 },
  { id: 'NOTIF-005', name: 'Qualification expiry at 0 days, coinciding with enforcement', family: 'Mandatory baseline', mandatory: 'Yes, cannot be disabled', triggerEvent: 'EVT-SRV-006', sourceLine: 51692 },
  { id: 'NOTIF-006', name: 'Allocation ladder at 80 per cent', family: 'Mandatory baseline', mandatory: 'Yes, cannot be disabled', triggerEvent: 'EVT-SRV-007', sourceLine: 51693 },
  { id: 'NOTIF-007', name: 'Allocation ladder at 100 per cent', family: 'Mandatory baseline', mandatory: 'Yes, cannot be disabled', triggerEvent: 'EVT-SRV-007', sourceLine: 51694 },
  { id: 'NOTIF-008', name: 'Allocation ladder at 125 per cent', family: 'Mandatory baseline', mandatory: 'Yes, cannot be disabled', triggerEvent: 'EVT-SRV-007', sourceLine: 51695 },
  { id: 'NOTIF-009', name: 'Burst-band entry', family: 'Mandatory baseline', mandatory: 'Yes, cannot be disabled', triggerEvent: 'EVT-SRV-007', sourceLine: 51696 },
  { id: 'NOTIF-010', name: 'Severity 1 escalation', family: 'Configurable routing, non-suppressible severity', mandatory: 'Routing is configurable; the escalation itself follows the Severity 1 floor', triggerEvent: 'EVT-SRV-010', sourceLine: 51697 },
  { id: 'NOTIF-011', name: 'Severity 2 and below escalation', family: 'Configurable', mandatory: 'Configurable by the Tenant Admin', triggerEvent: 'EVT-SRV-010', sourceLine: 51698 },
  { id: 'NOTIF-012', name: 'Gate item awaiting decision', family: 'Configurable', mandatory: 'Configurable', triggerEvent: 'Gate queue entry', sourceLine: 51699 },
  { id: 'NOTIF-013', name: 'Lane B proposal awaiting decision', family: 'Configurable', mandatory: 'Configurable', triggerEvent: 'EVT-SRV-004', sourceLine: 51700 },
  { id: 'NOTIF-014', name: 'Lane B proposal stale at 30 days', family: 'Configurable', mandatory: 'Configurable', triggerEvent: 'EVT-SRV-011', sourceLine: 51701 },
  { id: 'NOTIF-015', name: 'Sync conflict awaiting resolution', family: 'Configurable', mandatory: 'Configurable', triggerEvent: 'EVT-SRV-003', sourceLine: 51702 },
  { id: 'NOTIF-016', name: 'Shift handoff brief available', family: 'Configurable', mandatory: 'Configurable', triggerEvent: 'EVT-SRV-005', sourceLine: 51703 },
  { id: 'NOTIF-017', name: 'Run no-show at plus 15 minutes', family: 'Configurable', mandatory: 'Configurable', triggerEvent: 'Run no-show detection', sourceLine: 51704 },
  { id: 'NOTIF-018', name: 'Run auto-cancel at plus 30 minutes', family: 'Configurable', mandatory: 'Configurable', triggerEvent: 'Run no-show auto-cancel', sourceLine: 51705 },
  { id: 'NOTIF-019', name: 'Connectivity loss at 60 minutes', family: 'Configurable default', mandatory: 'Configurable', triggerEvent: 'EVT-SRV-008', sourceLine: 51706 },
  { id: 'NOTIF-020', name: 'Per-shift digest', family: 'Configurable composition', mandatory: 'Composition configurable; the qualification-expiry content inside it is mandatory', triggerEvent: 'EVT-SRV-009', sourceLine: 51707 },
  { id: 'NOTIF-021', name: 'Version change notice, notified class', family: 'Configurable', mandatory: 'Configurable', triggerEvent: 'A MINOR or MAJOR version publishes', sourceLine: 51708 },
  { id: 'NOTIF-022', name: 'Qualification clearance granted', family: 'Configurable', mandatory: 'Configurable', triggerEvent: 'CMD-QUAL-001 created', sourceLine: 51709 },
  { id: 'NOTIF-023', name: 'Suspension state applied or lifted', family: 'Mandatory under Hard and Compliance states', mandatory: 'Mandatory notifications continue under Hard suspension', triggerEvent: 'CMD-SUSP-001 to CMD-SUSP-004', sourceLine: 51710 },
  { id: 'NOTIF-024', name: 'Platform broadcast: maintenance, incident, informational', family: 'Platform communication', mandatory: 'Not tenant-configurable; it is platform to tenant', triggerEvent: 'Super Admin broadcast composition', sourceLine: 51711 },
  { id: 'NOTIF-025', name: 'Support or compliance-emergency session opened', family: 'Mandatory transparency', mandatory: 'Yes; the tenant-visible banner cannot be suppressed', triggerEvent: 'Access-class session opening', sourceLine: 51712 },
] as const satisfies readonly Ch277NotificationRow[]

export const CH_30C_2_CATEGORIES = [
  { id: 'NOTIF-001', name: 'Tenant workspace activated', className: 'Notification', mandatory: 'Yes', defaultAudience: 'Tenant Admin', recommendedSeverity: 'Informational', family: 1, sourceLine: 72950 },
  { id: 'NOTIF-002', name: 'Tier upgrade effective', className: 'Notification', mandatory: 'Yes', defaultAudience: 'Tenant Admin', recommendedSeverity: 'Informational', family: 1, sourceLine: 72951 },
  { id: 'NOTIF-003', name: 'Tier downgrade queued as pending', className: 'Notification', mandatory: 'Yes', defaultAudience: 'Tenant Admin', recommendedSeverity: 'Medium', family: 1, sourceLine: 72952 },
  { id: 'NOTIF-004', name: 'Tier downgrade effective', className: 'Notification', mandatory: 'Yes', defaultAudience: 'Tenant Admin', recommendedSeverity: 'Medium', family: 1, sourceLine: 72953 },
  { id: 'NOTIF-005', name: 'Allocation ladder at 80 percent', className: 'Notification with in-product banner', mandatory: 'Yes', defaultAudience: 'Tenant Admin', recommendedSeverity: 'Medium', family: 1, sourceLine: 72954 },
  { id: 'NOTIF-006', name: 'Allocation ladder at 100 percent', className: 'Escalation', mandatory: 'Yes', defaultAudience: 'Tenant Admin, Quality Manager', recommendedSeverity: 'High', family: 1, sourceLine: 72955 },
  { id: 'NOTIF-007', name: 'Burst-band entry between 100 and 125 percent', className: 'Notification', mandatory: 'Yes', defaultAudience: 'Tenant Admin', recommendedSeverity: 'High', family: 1, sourceLine: 72956 },
  { id: 'NOTIF-008', name: 'Consumption above 125 percent, commercial flag', className: 'Notification', mandatory: 'Yes', defaultAudience: 'Tenant Admin, the client\'s platform team', recommendedSeverity: 'High', family: 1, sourceLine: 72957 },
  { id: 'NOTIF-009', name: 'Soft suspension entered', className: 'Action-required notification', mandatory: 'Yes', defaultAudience: 'Tenant Admin only', recommendedSeverity: 'High', family: 1, sourceLine: 72958 },
  { id: 'NOTIF-010', name: 'Hard suspension entered', className: 'Action-required notification', mandatory: 'Yes', defaultAudience: 'Tenant Admin only', recommendedSeverity: 'Critical', family: 1, sourceLine: 72959 },
  { id: 'NOTIF-011', name: 'Compliance suspension entered', className: 'Command-linked notification', mandatory: 'Yes', defaultAudience: 'Every web user, and every device with the fixed message', recommendedSeverity: 'Critical', family: 1, sourceLine: 72960 },
  { id: 'NOTIF-012', name: 'Suspension lifted, tenant reactivated', className: 'Notification', mandatory: 'Yes', defaultAudience: 'Tenant Admin', recommendedSeverity: 'High', family: 1, sourceLine: 72961 },
  { id: 'NOTIF-013', name: 'Pilot tenancy expiry approaching', className: 'Reminder', mandatory: 'No', defaultAudience: 'Tenant Admin, the client\'s platform team', recommendedSeverity: 'Medium', family: 2, sourceLine: 72967 },
  { id: 'NOTIF-014', name: 'Archival or restore window notice', className: 'Notification', mandatory: 'No', defaultAudience: 'Tenant Admin', recommendedSeverity: 'Medium', family: 2, sourceLine: 72968 },
  { id: 'NOTIF-015', name: 'Tenant setting changed', className: 'Notification', mandatory: 'No', defaultAudience: 'Tenant Admin', recommendedSeverity: 'Informational', family: 2, sourceLine: 72969 },
  { id: 'NOTIF-016', name: 'Notification policy changed', className: 'Notification', mandatory: 'No', defaultAudience: 'Tenant Admin, affected role holders', recommendedSeverity: 'Informational', family: 2, sourceLine: 72970 },
  { id: 'NOTIF-017', name: 'Shift created, edited, or archived', className: 'Notification', mandatory: 'No', defaultAudience: 'Tenant Admin, Supervisors of bound Areas', recommendedSeverity: 'Informational', family: 2, sourceLine: 72971 },
  { id: 'NOTIF-018', name: 'Site or Area soft-archived', className: 'Notification', mandatory: 'No', defaultAudience: 'Tenant Admin, Supervisors in scope', recommendedSeverity: 'Medium', family: 3, sourceLine: 72977 },
  { id: 'NOTIF-019', name: 'Hierarchy depth changed', className: 'Notification', mandatory: 'No', defaultAudience: 'Tenant Admin, Quality Manager', recommendedSeverity: 'Medium', family: 3, sourceLine: 72978 },
  { id: 'NOTIF-020', name: 'Qualification expiry warning at 14 days', className: 'Reminder', mandatory: 'Yes', defaultAudience: 'Supervisor, Tenant Admin, the worker for their own', recommendedSeverity: 'Medium', family: 4, sourceLine: 72984 },
  { id: 'NOTIF-021', name: 'Qualification expiry warning at 7 days', className: 'Reminder', mandatory: 'Yes', defaultAudience: 'Supervisor, Tenant Admin, the worker for their own', recommendedSeverity: 'Medium', family: 4, sourceLine: 72985 },
  { id: 'NOTIF-022', name: 'Qualification expiry warning at 1 day', className: 'Reminder', mandatory: 'Yes', defaultAudience: 'Supervisor, Tenant Admin, the worker for their own', recommendedSeverity: 'High', family: 4, sourceLine: 72986 },
  { id: 'NOTIF-023', name: 'Qualification expiry at 0 days', className: 'Action-required notification', mandatory: 'Yes', defaultAudience: 'Supervisor, Tenant Admin, the worker for their own', recommendedSeverity: 'High', family: 4, sourceLine: 72987 },
  { id: 'NOTIF-024', name: 'Expiry notification unacknowledged after 2 minutes', className: 'Escalation', mandatory: 'Yes', defaultAudience: 'Quality Manager', recommendedSeverity: 'High', family: 4, sourceLine: 72988 },
  { id: 'NOTIF-025', name: 'Clearance granted against an expired certification', className: 'Notification', mandatory: 'No', defaultAudience: 'Quality Manager, the worker', recommendedSeverity: 'High', family: 4, sourceLine: 72989 },
  { id: 'NOTIF-026', name: 'Never-held qualification clearance authorised', className: 'Approval request then notification', mandatory: 'No', defaultAudience: 'Quality Manager decides, Supervisor informed', recommendedSeverity: 'High', family: 4, sourceLine: 72990 },
  { id: 'NOTIF-027', name: 'Second clearance in the same Area in the same shift', className: 'Escalation', mandatory: 'No', defaultAudience: 'Quality Manager', recommendedSeverity: 'High', family: 4, sourceLine: 72991 },
  { id: 'NOTIF-028', name: 'Clearance lapsed', className: 'Notification', mandatory: 'No', defaultAudience: 'Supervisor, the worker', recommendedSeverity: 'Medium', family: 4, sourceLine: 72992 },
  { id: 'NOTIF-029', name: 'Recertification recorded and blocks lifted', className: 'Command-linked notification', mandatory: 'No', defaultAudience: 'Supervisor, the worker', recommendedSeverity: 'Medium', family: 4, sourceLine: 72993 },
  { id: 'NOTIF-030', name: 'Worker departure requires run reassignment', className: 'Action-required notification', mandatory: 'No', defaultAudience: 'Supervisor', recommendedSeverity: 'High', family: 4, sourceLine: 72994 },
  { id: 'NOTIF-031', name: 'Worker re-employment re-validation required', className: 'Action-required notification', mandatory: 'No', defaultAudience: 'Supervisor', recommendedSeverity: 'Medium', family: 4, sourceLine: 72995 },
  { id: 'NOTIF-032', name: 'Job submitted for approval', className: 'Approval request', mandatory: 'No', defaultAudience: 'Quality Manager, excluding the creator', recommendedSeverity: 'Medium', family: 5, sourceLine: 73001 },
  { id: 'NOTIF-033', name: 'Job approved', className: 'Notification', mandatory: 'No', defaultAudience: 'Creator, Job Owner', recommendedSeverity: 'Informational', family: 5, sourceLine: 73002 },
  { id: 'NOTIF-034', name: 'Job returned with a reason', className: 'Action-required notification', mandatory: 'No', defaultAudience: 'Creator', recommendedSeverity: 'Medium', family: 5, sourceLine: 73003 },
  { id: 'NOTIF-035', name: 'Recurrence change awaiting approval', className: 'Approval request', mandatory: 'No', defaultAudience: 'Quality Manager', recommendedSeverity: 'Medium', family: 5, sourceLine: 73004 },
  { id: 'NOTIF-036', name: 'Scheduled runs no longer fitting a changed recurrence', className: 'Action-required notification', mandatory: 'No', defaultAudience: 'Supervisor, Job Owner', recommendedSeverity: 'Medium', family: 5, sourceLine: 73005 },
  { id: 'NOTIF-037', name: 'Run assigned to a worker', className: 'Notification', mandatory: 'No', defaultAudience: 'The assigned worker', recommendedSeverity: 'Informational', family: 6, sourceLine: 73011 },
  { id: 'NOTIF-038', name: 'Run no-show at plus 15 minutes', className: 'Alert', mandatory: 'No', defaultAudience: 'Supervisor', recommendedSeverity: 'High', family: 6, sourceLine: 73012 },
  { id: 'NOTIF-039', name: 'Run auto-cancelled at plus 30 minutes', className: 'Notification', mandatory: 'No', defaultAudience: 'Supervisor, Job Owner', recommendedSeverity: 'High', family: 6, sourceLine: 73013 },
  { id: 'NOTIF-040', name: 'Run cancelled with a categorised reason', className: 'Notification', mandatory: 'No', defaultAudience: 'Supervisor, Quality Manager, assigned workers', recommendedSeverity: 'Medium', family: 6, sourceLine: 73014 },
  { id: 'NOTIF-041', name: 'Run end-time extension authorised', className: 'Notification', mandatory: 'No', defaultAudience: 'Assigned workers, Quality Manager', recommendedSeverity: 'Medium', family: 6, sourceLine: 73015 },
  { id: 'NOTIF-042', name: 'Worker substitution performed with handover', className: 'Command-linked notification', mandatory: 'No', defaultAudience: 'Both workers, Supervisor', recommendedSeverity: 'High', family: 6, sourceLine: 73016 },
  { id: 'NOTIF-043', name: 'Record-finish window countdown', className: 'Reminder', mandatory: 'No', defaultAudience: 'Supervisor, Quality Manager', recommendedSeverity: 'Medium', family: 6, sourceLine: 73017 },
  { id: 'NOTIF-044', name: 'Late-arriving capture folded in', className: 'Notification', mandatory: 'No', defaultAudience: 'Quality Manager', recommendedSeverity: 'Informational', family: 6, sourceLine: 73018 },
  { id: 'NOTIF-045', name: 'Audited recompute after finish', className: 'Notification', mandatory: 'No', defaultAudience: 'Quality Manager, report recipients', recommendedSeverity: 'Medium', family: 6, sourceLine: 73019 },
  { id: 'NOTIF-046', name: 'Notified-class version published, adoption decision required', className: 'Action-required notification', mandatory: 'No', defaultAudience: 'Job Owner of every affected Job', recommendedSeverity: 'High', family: 7, sourceLine: 73025 },
  { id: 'NOTIF-047', name: 'Patch version adopted and tracked', className: 'Notification', mandatory: 'No', defaultAudience: 'Job Owner', recommendedSeverity: 'Informational', family: 7, sourceLine: 73026 },
  { id: 'NOTIF-048', name: 'Studio submission awaiting Reviewer', className: 'Approval request', mandatory: 'No', defaultAudience: 'Reviewer role holders excluding the Author', recommendedSeverity: 'Medium', family: 7, sourceLine: 73027 },
  { id: 'NOTIF-049', name: 'Studio submission awaiting Release Authority', className: 'Approval request', mandatory: 'No', defaultAudience: 'Release Authority', recommendedSeverity: 'Medium', family: 7, sourceLine: 73028 },
  { id: 'NOTIF-050', name: 'Publication blocked by locale incompleteness', className: 'Action-required notification', mandatory: 'No', defaultAudience: 'Author', recommendedSeverity: 'Medium', family: 7, sourceLine: 73029 },
  { id: 'NOTIF-051', name: 'Lane B proposal raised', className: 'Approval request', mandatory: 'No', defaultAudience: 'Quality Manager and above', recommendedSeverity: 'Medium', family: 7, sourceLine: 73030 },
  { id: 'NOTIF-052', name: 'Lane B proposal stale at 30 days', className: 'Reminder', mandatory: 'No', defaultAudience: 'Quality Manager, in the digest', recommendedSeverity: 'Medium', family: 7, sourceLine: 73031 },
  { id: 'NOTIF-053', name: 'Lane B approved change auto-published and distributing', className: 'Notification', mandatory: 'No', defaultAudience: 'Quality Manager, Job Owners', recommendedSeverity: 'Medium', family: 7, sourceLine: 73032 },
  { id: 'NOTIF-054', name: 'Deviation opened at Severity 2 or below', className: 'Alert', mandatory: 'No', defaultAudience: 'Per the escalation routing template', recommendedSeverity: 'Medium', family: 8, sourceLine: 73038 },
  { id: 'NOTIF-055', name: 'Severity 1 deviation with automatic hold', className: 'Escalation', mandatory: 'Yes, by the Severity 1 floor', defaultAudience: 'Supervisor and Quality Manager per template', recommendedSeverity: 'Critical', family: 8, sourceLine: 73039 },
  { id: 'NOTIF-056', name: 'Hold propagation state change', className: 'Notification', mandatory: 'No', defaultAudience: 'Quality Manager, Supervisor', recommendedSeverity: 'High', family: 8, sourceLine: 73040 },
  { id: 'NOTIF-057', name: 'Lot release requested with a note', className: 'Action-required notification', mandatory: 'No', defaultAudience: 'Quality Manager', recommendedSeverity: 'Critical', family: 8, sourceLine: 73041 },
  { id: 'NOTIF-058', name: 'Lot release granted', className: 'Command-linked notification', mandatory: 'No', defaultAudience: 'Supervisor, affected workers', recommendedSeverity: 'High', family: 8, sourceLine: 73042 },
  { id: 'NOTIF-059', name: 'Containment checklist incomplete at sync', className: 'Alert', mandatory: 'No', defaultAudience: 'Supervisor, Quality Manager', recommendedSeverity: 'High', family: 8, sourceLine: 73043 },
  { id: 'NOTIF-060', name: 'Critical anomaly opened in the Anomaly Register', className: 'Escalation', mandatory: 'No', defaultAudience: 'Quality Manager role at tenant scope plus a configurable recipient list', recommendedSeverity: 'Critical', family: 8, sourceLine: 73044 },
  { id: 'NOTIF-061', name: 'Anomaly resolved with a closure note', className: 'Notification', mandatory: 'No', defaultAudience: 'Quality Manager, Supervisor', recommendedSeverity: 'Informational', family: 8, sourceLine: 73045 },
  { id: 'NOTIF-062', name: 'Critical notification unacknowledged after 4 hours, or 1 hour in Regulated-Industry mode', className: 'Reminder and escalation', mandatory: 'Yes for Critical', defaultAudience: 'The same audience on the same channels', recommendedSeverity: 'Critical', family: 8, sourceLine: 73046 },
  { id: 'NOTIF-063', name: 'Execution Summary ready for review', className: 'Action-required notification', mandatory: 'No', defaultAudience: 'Quality Manager', recommendedSeverity: 'Medium', family: 9, sourceLine: 73052 },
  { id: 'NOTIF-064', name: 'Review queue aging at 24, 48, and 72 hours', className: 'Reminder', mandatory: 'No', defaultAudience: 'Quality Manager, in the digest', recommendedSeverity: 'High', family: 9, sourceLine: 73053 },
  { id: 'NOTIF-065', name: 'Evidence marked reviewed', className: 'Notification', mandatory: 'No', defaultAudience: 'Supervisor', recommendedSeverity: 'Informational', family: 9, sourceLine: 73054 },
  { id: 'NOTIF-066', name: 'Material correction flagged in a scheduled report delivery', className: 'Notification', mandatory: 'No', defaultAudience: 'Report recipients', recommendedSeverity: 'Medium', family: 9, sourceLine: 73055 },
  { id: 'NOTIF-067', name: 'Sync conflict raised', className: 'Alert', mandatory: 'No', defaultAudience: 'Quality Manager, Supervisor view-only', recommendedSeverity: 'High', family: 10, sourceLine: 73061 },
  { id: 'NOTIF-068', name: 'Sync conflict resolved', className: 'Notification', mandatory: 'No', defaultAudience: 'Quality Manager, Supervisor', recommendedSeverity: 'Informational', family: 10, sourceLine: 73062 },
  { id: 'NOTIF-069', name: 'Clock skew beyond the tenant threshold', className: 'Alert', mandatory: 'No', defaultAudience: 'Tenant Admin, Supervisor', recommendedSeverity: 'Medium', family: 10, sourceLine: 73063 },
  { id: 'NOTIF-070', name: 'Site connectivity loss at 30, 60, and 120 minutes', className: 'Escalation', mandatory: 'No', defaultAudience: 'The client\'s platform operations, then Tenant Admin, then platform on-call', recommendedSeverity: 'High', family: 10, sourceLine: 73064 },
  { id: 'NOTIF-071', name: 'Device de-authorisation or wipe issued', className: 'Command-linked notification', mandatory: 'No', defaultAudience: 'Tenant Admin, the client\'s platform team', recommendedSeverity: 'Critical', family: 10, sourceLine: 73065 },
  { id: 'NOTIF-072', name: 'Device command pending beyond its expected application', className: 'Alert', mandatory: 'No', defaultAudience: 'Supervisor, Tenant Admin', recommendedSeverity: 'High', family: 10, sourceLine: 73066 },
  { id: 'NOTIF-073', name: 'Agent proposal entered the governance gate queue', className: 'Approval request', mandatory: 'No', defaultAudience: 'Quality Manager and above', recommendedSeverity: 'Medium', family: 11, sourceLine: 73072 },
  { id: 'NOTIF-074', name: 'Gate item timeout at 10 or 30 minutes', className: 'Escalation', mandatory: 'No', defaultAudience: 'Per the routing policy, fallback recipients', recommendedSeverity: 'High', family: 11, sourceLine: 73073 },
  { id: 'NOTIF-075', name: 'Agent unavailable due to emergency pause', className: 'Notification', mandatory: 'No', defaultAudience: 'Quality Manager, Supervisor, Tenant Admin', recommendedSeverity: 'High', family: 11, sourceLine: 73074 },
  { id: 'NOTIF-076', name: 'Agent failed to produce an output', className: 'Alert', mandatory: 'No', defaultAudience: 'Supervisor, Quality Manager, the client\'s platform operations', recommendedSeverity: 'High', family: 11, sourceLine: 73075 },
  { id: 'NOTIF-077', name: 'Shift handoff brief ready', className: 'Notification', mandatory: 'No', defaultAudience: 'Incoming Supervisor, optionally Quality Manager', recommendedSeverity: 'Medium', family: 11, sourceLine: 73076 },
  { id: 'NOTIF-078', name: 'Shift handoff brief unacknowledged after 30 minutes', className: 'Escalation', mandatory: 'No', defaultAudience: 'Escalation-fallback recipient per routing', recommendedSeverity: 'High', family: 11, sourceLine: 73077 },
  { id: 'NOTIF-079', name: 'Agent re-check completed', className: 'Notification', mandatory: 'No', defaultAudience: 'The requesting Supervisor', recommendedSeverity: 'Informational', family: 11, sourceLine: 73078 },
  { id: 'NOTIF-080', name: 'Maintenance notice', className: 'Notification with in-product banner', mandatory: 'No', defaultAudience: 'Targeted tenants', recommendedSeverity: 'Medium', family: 12, sourceLine: 73084 },
  { id: 'NOTIF-081', name: 'Incident communication', className: 'Alert', mandatory: 'No', defaultAudience: 'Targeted tenants', recommendedSeverity: 'High', family: 12, sourceLine: 73085 },
  { id: 'NOTIF-082', name: 'Informational announcement', className: 'Notification', mandatory: 'No', defaultAudience: 'Targeted tenants', recommendedSeverity: 'Informational', family: 12, sourceLine: 73086 },
  { id: 'NOTIF-083', name: 'Support session started and ended', className: 'Notification with persistent banner', mandatory: 'Yes', defaultAudience: 'Tenant Admin, and the banner to every session in the tenant', recommendedSeverity: 'High', family: 12, sourceLine: 73087 },
  { id: 'NOTIF-084', name: 'Compliance-emergency session post-session report', className: 'Notification', mandatory: 'Yes', defaultAudience: 'Tenant Admin', recommendedSeverity: 'Critical', family: 12, sourceLine: 73088 },
  { id: 'NOTIF-085', name: 'JBS access grant session opened', className: 'Notification', mandatory: 'Yes', defaultAudience: 'Tenant Admin', recommendedSeverity: 'High', family: 12, sourceLine: 73089 },
  { id: 'NOTIF-086', name: 'Retention change or legal hold applied', className: 'Notification', mandatory: 'Yes', defaultAudience: 'Tenant Admin', recommendedSeverity: 'High', family: 12, sourceLine: 73090 },
  { id: 'NOTIF-087', name: 'Per-shift digest', className: 'Notification', mandatory: 'No, but sections carrying mandatory content cannot be muted', defaultAudience: 'Every role holder bound to the Shift', recommendedSeverity: 'Informational', family: 13, sourceLine: 73096 },
] as const satisfies readonly Ch30C2NotificationRow[]

/**
 * The thirteen family names, read from each `**Family N, …**` heading between
 * L72946 and L73092. The thirteen and the eighty-seven are the two counts that
 * reconcile: 12 + 5 + 2 + 12 + 5 + 9 + 8 + 9 + 4 + 6 + 7 + 7 + 1 = 87.
 */
export const NOTIFICATION_FAMILIES: Readonly<Record<number, string>> = {
  1: 'tenant and commercial lifecycle',
  2: 'tenant configuration and administration',
  3: 'location and hierarchy',
  4: 'worker and qualification',
  5: 'Job and approval',
  6: 'run and execution oversight',
  7: 'workflow, version, and learning',
  8: 'deviation, containment, and hold',
  9: 'summary, evidence, and review',
  10: 'sync, device, and connectivity',
  11: 'agent, gate, and handoff',
  12: 'platform-to-tenant communication and access',
  13: 'the digest',
}

const REGISTER_ROWS = new Map<NotificationRegisterId, readonly NotificationRow[]>([
  [
    'ch-27.7-catalog',
    CH_27_7_CATALOG.map((row) => ({ register: 'ch-27.7-catalog' as const, ...row })),
  ],
  [
    'ch-30c.2-categories',
    CH_30C_2_CATEGORIES.map((row) => ({ register: 'ch-30c.2-categories' as const, ...row })),
  ],
])

const BY_KEY: ReadonlyMap<string, NotificationRow> = new Map(
  [...REGISTER_ROWS.values()].flat().map((row) => [`${row.register}#${row.id}`, row]),
)

/**
 * Resolves a branded key. Throws on a miss rather than returning `undefined`,
 * because a key can only have been built by `notificationKey`, so a miss is a
 * registry defect and not a caller's bad input.
 */
export function resolveNotification(key: NotificationKey): NotificationRow {
  const row = BY_KEY.get(key)
  if (row === undefined) throw new Error(`No notification registered for key ${key}`)
  return row
}

/** The register-first lookup. There is deliberately no register-less overload. */
export function lookupNotification<R extends NotificationRegisterId>(
  register: R,
  id: NotificationIdOf<R>,
): NotificationRow {
  return resolveNotification(notificationKey(register, id))
}

/** Every row of one register, in source order. */
export function notificationsIn(register: NotificationRegisterId): readonly NotificationRow[] {
  return REGISTER_ROWS.get(register) ?? []
}

/**
 * The disclosure. One entry per identifier the two registers both claim, with
 * both names and both lines, so a screen can show the reader that the key is
 * ambiguous instead of picking a winner. Twenty-five entries, and no entry has
 * matching names — that is the whole finding.
 */
export interface NotificationCollision {
  readonly id: Ch277NotificationId & Ch30C2NotificationId
  readonly ch277Name: string
  readonly ch277Line: number
  readonly ch30c2Name: string
  readonly ch30c2Line: number
}

export const NOTIFICATION_COLLISIONS = [
  {
    id: 'NOTIF-001',
    ch277Name: 'Subscription or tier lifecycle change',
    ch277Line: 51688,
    ch30c2Name: 'Tenant workspace activated',
    ch30c2Line: 72950,
  },
  {
    id: 'NOTIF-002',
    ch277Name: 'Qualification expiry at 14 days',
    ch277Line: 51689,
    ch30c2Name: 'Tier upgrade effective',
    ch30c2Line: 72951,
  },
  {
    id: 'NOTIF-003',
    ch277Name: 'Qualification expiry at 7 days',
    ch277Line: 51690,
    ch30c2Name: 'Tier downgrade queued as pending',
    ch30c2Line: 72952,
  },
  {
    id: 'NOTIF-004',
    ch277Name: 'Qualification expiry at 1 day',
    ch277Line: 51691,
    ch30c2Name: 'Tier downgrade effective',
    ch30c2Line: 72953,
  },
  {
    id: 'NOTIF-005',
    ch277Name: 'Qualification expiry at 0 days, coinciding with enforcement',
    ch277Line: 51692,
    ch30c2Name: 'Allocation ladder at 80 percent',
    ch30c2Line: 72954,
  },
  {
    id: 'NOTIF-006',
    ch277Name: 'Allocation ladder at 80 per cent',
    ch277Line: 51693,
    ch30c2Name: 'Allocation ladder at 100 percent',
    ch30c2Line: 72955,
  },
  {
    id: 'NOTIF-007',
    ch277Name: 'Allocation ladder at 100 per cent',
    ch277Line: 51694,
    ch30c2Name: 'Burst-band entry between 100 and 125 percent',
    ch30c2Line: 72956,
  },
  {
    id: 'NOTIF-008',
    ch277Name: 'Allocation ladder at 125 per cent',
    ch277Line: 51695,
    ch30c2Name: 'Consumption above 125 percent, commercial flag',
    ch30c2Line: 72957,
  },
  {
    id: 'NOTIF-009',
    ch277Name: 'Burst-band entry',
    ch277Line: 51696,
    ch30c2Name: 'Soft suspension entered',
    ch30c2Line: 72958,
  },
  {
    id: 'NOTIF-010',
    ch277Name: 'Severity 1 escalation',
    ch277Line: 51697,
    ch30c2Name: 'Hard suspension entered',
    ch30c2Line: 72959,
  },
  {
    id: 'NOTIF-011',
    ch277Name: 'Severity 2 and below escalation',
    ch277Line: 51698,
    ch30c2Name: 'Compliance suspension entered',
    ch30c2Line: 72960,
  },
  {
    id: 'NOTIF-012',
    ch277Name: 'Gate item awaiting decision',
    ch277Line: 51699,
    ch30c2Name: 'Suspension lifted, tenant reactivated',
    ch30c2Line: 72961,
  },
  {
    id: 'NOTIF-013',
    ch277Name: 'Lane B proposal awaiting decision',
    ch277Line: 51700,
    ch30c2Name: 'Pilot tenancy expiry approaching',
    ch30c2Line: 72967,
  },
  {
    id: 'NOTIF-014',
    ch277Name: 'Lane B proposal stale at 30 days',
    ch277Line: 51701,
    ch30c2Name: 'Archival or restore window notice',
    ch30c2Line: 72968,
  },
  {
    id: 'NOTIF-015',
    ch277Name: 'Sync conflict awaiting resolution',
    ch277Line: 51702,
    ch30c2Name: 'Tenant setting changed',
    ch30c2Line: 72969,
  },
  {
    id: 'NOTIF-016',
    ch277Name: 'Shift handoff brief available',
    ch277Line: 51703,
    ch30c2Name: 'Notification policy changed',
    ch30c2Line: 72970,
  },
  {
    id: 'NOTIF-017',
    ch277Name: 'Run no-show at plus 15 minutes',
    ch277Line: 51704,
    ch30c2Name: 'Shift created, edited, or archived',
    ch30c2Line: 72971,
  },
  {
    id: 'NOTIF-018',
    ch277Name: 'Run auto-cancel at plus 30 minutes',
    ch277Line: 51705,
    ch30c2Name: 'Site or Area soft-archived',
    ch30c2Line: 72977,
  },
  {
    id: 'NOTIF-019',
    ch277Name: 'Connectivity loss at 60 minutes',
    ch277Line: 51706,
    ch30c2Name: 'Hierarchy depth changed',
    ch30c2Line: 72978,
  },
  {
    id: 'NOTIF-020',
    ch277Name: 'Per-shift digest',
    ch277Line: 51707,
    ch30c2Name: 'Qualification expiry warning at 14 days',
    ch30c2Line: 72984,
  },
  {
    id: 'NOTIF-021',
    ch277Name: 'Version change notice, notified class',
    ch277Line: 51708,
    ch30c2Name: 'Qualification expiry warning at 7 days',
    ch30c2Line: 72985,
  },
  {
    id: 'NOTIF-022',
    ch277Name: 'Qualification clearance granted',
    ch277Line: 51709,
    ch30c2Name: 'Qualification expiry warning at 1 day',
    ch30c2Line: 72986,
  },
  {
    id: 'NOTIF-023',
    ch277Name: 'Suspension state applied or lifted',
    ch277Line: 51710,
    ch30c2Name: 'Qualification expiry at 0 days',
    ch30c2Line: 72987,
  },
  {
    id: 'NOTIF-024',
    ch277Name: 'Platform broadcast: maintenance, incident, informational',
    ch277Line: 51711,
    ch30c2Name: 'Expiry notification unacknowledged after 2 minutes',
    ch30c2Line: 72988,
  },
  {
    id: 'NOTIF-025',
    ch277Name: 'Support or compliance-emergency session opened',
    ch277Line: 51712,
    ch30c2Name: 'Clearance granted against an expired certification',
    ch30c2Line: 72989,
  },
] as const satisfies readonly NotificationCollision[]

/**
 * The class distribution, both sides. `stated` is the prose at L72929; `counted`
 * is a tally of the eighty-seven Class cells. Both are `Derived Clarification`
 * per L73133, and they disagree on six of the eight prose terms.
 *
 * `foldingCannotReconcile` records why this is not a compound-token artefact
 * and is the one assertion a reader is most likely to doubt.
 */
export const NOTIFICATION_CLASS_DISTRIBUTION = {
  statedAt: 72929,
  stated: {
    Notification: 34,
    Alert: 9,
    'Action-required notification': 12,
    'Approval request': 8,
    'General task': 0,
    Reminder: 6,
    Escalation: 15,
    'Command-linked notification': 3,
  },
  counted: {
    Notification: 37,
    'Action-required notification': 11,
    Escalation: 8,
    Alert: 8,
    Reminder: 7,
    'Approval request': 6,
    'Command-linked notification': 5,
    'Notification with in-product banner': 2,
    'Notification with persistent banner': 1,
    'Reminder and escalation': 1,
    'Approval request then notification': 1,
  },
  foldingCannotReconcile:
    'Folding a compound token into a simple one only ever increases the simple ' +
    'count. The catalogue holds five command-linked rows and the prose claims ' +
    'three, so no folding reaches the prose figure. Escalation fails in the ' +
    'other direction: eight rows plus the one compound "Reminder and ' +
    'escalation" is nine against a claimed fifteen.',
  safeToRender: 'the total of 87 and the thirteen families; no per-class figure',
} as const

/** What must appear beside the eighty-seven wherever it renders. */
export const NOTIFICATION_COUNT_LABEL = {
  decision: 'DEC-NOTIFCOUNT-001',
  classification: 'Derived Clarification',
  statedAt: 72927,
  covers: 'the count of 87, the thirteen-family organisation, and the class distribution',
} as const

/** One row of an event Panel A table. */
export interface EventCatalogueRow {
  readonly id: string
  readonly name: string
  readonly originatingSurface: string
  readonly originatingRole: string
  readonly sourceLine: number
}

/**
 * The twenty-five catalogued events: nine `EVT-CAP-*` (L51051-L51059), four
 * `EVT-OPS-*` and twelve `EVT-SRV-*` (L51177-L51192).
 */
export const EVENT_CATALOGUE = [
  { id: 'EVT-CAP-001', name: 'Step execution completed', originatingSurface: 'Frontline Worker Application', originatingRole: 'Worker', sourceLine: 51051 },
  { id: 'EVT-CAP-002', name: 'Measurement captured with deterministic result', originatingSurface: 'Frontline Worker Application', originatingRole: 'Worker', sourceLine: 51052 },
  { id: 'EVT-CAP-003', name: 'Evidence media captured', originatingSurface: 'Frontline Worker Application', originatingRole: 'Worker', sourceLine: 51053 },
  { id: 'EVT-CAP-004', name: 'Unit or lot binding captured', originatingSurface: 'Frontline Worker Application', originatingRole: 'Worker', sourceLine: 51054 },
  { id: 'EVT-CAP-005', name: 'Deviation classified on device', originatingSurface: 'Frontline Worker Application', originatingRole: 'Worker action, deterministic rule', sourceLine: 51055 },
  { id: 'EVT-CAP-006', name: 'Severity 1 local hold placed', originatingSurface: 'Frontline Worker Application', originatingRole: 'Worker action, platform-fixed rule', sourceLine: 51056 },
  { id: 'EVT-CAP-007', name: 'Containment checklist completed', originatingSurface: 'Frontline Worker Application', originatingRole: 'Worker', sourceLine: 51057 },
  { id: 'EVT-CAP-008', name: 'Sign-off with second-identity step-up', originatingSurface: 'Frontline Worker Application', originatingRole: 'Worker plus authorising Supervisor or Quality Manager', sourceLine: 51058 },
  { id: 'EVT-CAP-009', name: 'Run submitted by worker', originatingSurface: 'Frontline Worker Application', originatingRole: 'Worker', sourceLine: 51059 },
  { id: 'EVT-OPS-001', name: 'Step-away flag', originatingSurface: 'Frontline Worker Application', originatingRole: 'Worker', sourceLine: 51177 },
  { id: 'EVT-OPS-002', name: 'Coaching dismissal', originatingSurface: 'Frontline Worker Application', originatingRole: 'Worker', sourceLine: 51178 },
  { id: 'EVT-OPS-003', name: 'Clock-skew detection', originatingSurface: 'Frontline Worker Application', originatingRole: 'Device condition, no human', sourceLine: 51179 },
  { id: 'EVT-OPS-004', name: 'Device heartbeat and last successful sync', originatingSurface: 'Frontline Worker Application', originatingRole: 'Device condition, no human', sourceLine: 51180 },
  { id: 'EVT-SRV-001', name: 'Run reached complete', originatingSurface: 'Delivery Operations Hub', originatingRole: 'Platform policy', sourceLine: 51181 },
  { id: 'EVT-SRV-002', name: 'Run automatically finished', originatingSurface: 'Delivery Operations Hub', originatingRole: 'Platform policy', sourceLine: 51182 },
  { id: 'EVT-SRV-003', name: 'Sync conflict raised', originatingSurface: 'Delivery Operations Hub', originatingRole: 'Platform policy', sourceLine: 51183 },
  { id: 'EVT-SRV-004', name: 'Lane B proposal raised', originatingSurface: 'Platform agents', originatingRole: 'Agent policy', sourceLine: 51184 },
  { id: 'EVT-SRV-005', name: 'Shift handoff brief produced', originatingSurface: 'Platform agents, Shift Handoff Agent', originatingRole: 'Agent policy on Studio-configured timing', sourceLine: 51185 },
  { id: 'EVT-SRV-006', name: 'Qualification expiry warning', originatingSurface: 'Delivery Operations Hub', originatingRole: 'Platform policy, mandatory baseline', sourceLine: 51186 },
  { id: 'EVT-SRV-007', name: 'Allocation ladder threshold crossed', originatingSurface: 'Super Admin platform console', originatingRole: 'Platform policy, mandatory baseline', sourceLine: 51187 },
  { id: 'EVT-SRV-008', name: 'Connectivity-loss threshold reached', originatingSurface: 'Delivery Operations Hub and Super Admin platform console', originatingRole: 'Platform policy', sourceLine: 51188 },
  { id: 'EVT-SRV-009', name: 'Per-shift digest assembled and delivered', originatingSurface: 'Delivery Operations Hub', originatingRole: 'Platform policy', sourceLine: 51189 },
  { id: 'EVT-SRV-010', name: 'Escalation raised', originatingSurface: 'Delivery Operations Hub', originatingRole: 'Studio-authored routing policy', sourceLine: 51190 },
  { id: 'EVT-SRV-011', name: 'Learning proposal stale flag', originatingSurface: 'Delivery Operations Hub', originatingRole: 'Platform policy', sourceLine: 51191 },
  { id: 'EVT-SRV-012', name: 'Lane A preference tuning applied', originatingSurface: 'Platform agents', originatingRole: 'Agent policy', sourceLine: 51192 },
] as const satisfies readonly EventCatalogueRow[]

/**
 * The three `EVT-*` identifiers `registries/generated/events.json` holds that
 * the two Panel A tables do not, with the provenance of each. All three are
 * real frozen-source tokens; none is a catalogue row, and the difference
 * between 25 and 28 is exactly these.
 *
 * `EVT-DOH-NOSHOW-15` and `EVT-DOH-NOSHOW-30` are two rows of a TEN-row
 * `EVT-DOH-*` emission table at L26171-L26180 — so the generated registry is
 * not a census of that family either, and reporting 28 as "the events" would
 * overstate both catalogues at once.
 */
export const EVENT_REGISTRY_EXTRAS: readonly {
  readonly id: string
  readonly sourceLine: number
  readonly provenance: string
}[] = [
  {
    id: 'EVT-CONN-30MIN',
    sourceLine: 62503,
    provenance:
      'A state-transition cell in a walkthrough table, not a catalogue row. Recurs at L63482.',
  },
  {
    id: 'EVT-DOH-NOSHOW-15',
    sourceLine: 26177,
    provenance: 'Row 7 of the ten-row EVT-DOH-* emission table at L26171-L26180.',
  },
  {
    id: 'EVT-DOH-NOSHOW-30',
    sourceLine: 26178,
    provenance: 'Row 8 of the same ten-row table; the other eight rows are in no registry.',
  },
]

/** One row of a command Panel A table. */
export interface CommandCatalogueRow {
  readonly id: string
  readonly name: string
  /** The Class column. `CMD-SUSP-005` refuses to name one; see `DEC-CMDCLASS-001`. */
  readonly className: string
  readonly originatingSurface: string
  readonly sourceLine: number
}

/**
 * The sixteen catalogued command instances, eight per Panel A table —
 * L51387-L51394 and L51490-L51497. The source states this count beside the
 * enumeration and the two agree, which is rare enough in this document to be
 * worth saying: L51334 reads "Sixteen command instances are catalogued across
 * those five classes."
 */
export const COMMAND_CATALOGUE = [
  { id: 'CMD-REL-001', name: 'Release a Severity 1 automatic lot hold', className: 'Lot release', originatingSurface: 'Client Command Center', sourceLine: 51387 },
  { id: 'CMD-REL-002', name: 'Release a hold on a serialized unit', className: 'Lot release', originatingSurface: 'Client Command Center', sourceLine: 51388 },
  { id: 'CMD-REL-003', name: 'Release a run-level quarantine', className: 'Lot release', originatingSurface: 'Client Command Center', sourceLine: 51389 },
  { id: 'CMD-ASG-001', name: 'Reassign a run mid-shift', className: 'Reassignment or substitution', originatingSurface: 'Client Command Center or Delivery Operations Hub', sourceLine: 51390 },
  { id: 'CMD-ASG-002', name: 'Substitute a worker mid-run', className: 'Reassignment or substitution', originatingSurface: 'Client Command Center or Delivery Operations Hub', sourceLine: 51391 },
  { id: 'CMD-ASG-003', name: 'Withdraw assignments on worker departure', className: 'Reassignment or substitution', originatingSurface: 'Delivery Operations Hub', sourceLine: 51392 },
  { id: 'CMD-QUAL-001', name: 'Grant a qualification clearance', className: 'Qualification clearance', originatingSurface: 'Client Command Center', sourceLine: 51393 },
  { id: 'CMD-QUAL-002', name: 'Revoke a clearance before expiry', className: 'Qualification clearance', originatingSurface: 'Client Command Center', sourceLine: 51394 },
  { id: 'CMD-SUSP-001', name: 'Apply soft suspension', className: 'Suspension', originatingSurface: 'Delivery Operations Hub lifecycle or Super Admin platform console', sourceLine: 51490 },
  { id: 'CMD-SUSP-002', name: 'Apply hard suspension', className: 'Suspension', originatingSurface: 'Delivery Operations Hub lifecycle or Super Admin platform console', sourceLine: 51491 },
  { id: 'CMD-SUSP-003', name: 'Apply compliance suspension', className: 'Suspension', originatingSurface: 'Super Admin platform console', sourceLine: 51492 },
  { id: 'CMD-SUSP-004', name: 'Lift a suspension', className: 'Suspension', originatingSurface: 'Delivery Operations Hub or Super Admin platform console', sourceLine: 51493 },
  { id: 'CMD-SUSP-005', name: 'Device wipe and de-authorisation', className: 'Client Decision Required — reaches the device but is not one of the five named classes', originatingSurface: 'Super Admin platform console', sourceLine: 51494 },
  { id: 'CMD-VER-001', name: 'Distribute a notified version after Job Owner adoption', className: 'Version change', originatingSurface: 'Standards and Operations Studio or the platform', sourceLine: 51495 },
  { id: 'CMD-VER-002', name: 'Distribute a patch version', className: 'Version change', originatingSurface: 'Standards and Operations Studio or the platform', sourceLine: 51496 },
  { id: 'CMD-VER-003', name: 'Distribute a Lane B auto-published patch', className: 'Version change', originatingSurface: 'Standards and Operations Studio or the platform', sourceLine: 51497 },
] as const satisfies readonly CommandCatalogueRow[]

/**
 * The one `CMD-*` identifier `registries/generated/commands.json` holds that no
 * Panel A table does. It is not a command instance: it appears inside an
 * `Illustrative Example` at L74155 alongside `AUD-BB-000412`, as a worked audit
 * record. The difference between 16 and 17 is exactly this row.
 */
export const COMMAND_REGISTRY_EXTRAS: readonly {
  readonly id: string
  readonly sourceLine: number
  readonly provenance: string
}[] = [
  {
    id: 'CMD-BB-000097',
    sourceLine: 74155,
    provenance: 'An illustrative instance inside an Illustrative Example, not a catalogued class member.',
  },
]

/**
 * Every count this task measured, against the hypothesis it was given and
 * against what the generated registry holds. `classification` is the frozen
 * source's own label where the source states one, verbatim.
 *
 * The field stays a plain string, and the reason has changed. It was a plain
 * string because `SOURCE_CLASSIFICATIONS` in `./schemas` did not list
 * `User-Mandated Product Extension`, a label the source uses on 391 lines;
 * slice 10 task 13 measured that omission against the source's own
 * classification legend and added it, so that reason is gone. It remains a
 * plain string because the legend is a vocabulary for MATERIAL STATEMENTS and
 * these rows classify COUNTS — a count is not a statement the legend was
 * written to label, and typing it as `SourceClassification` would assert an
 * equivalence the source does not make.
 */
export interface SignalCount {
  readonly of: string
  /** What the rows were counted by reading to where the body stops. */
  readonly measured: number
  /** What the source states beside the enumeration, where it states one. */
  readonly statedInSource: number | null
  /** Where that stated count is, or `null` when the source states none. */
  readonly statedAt: number | null
  /** What `registries/generated/*.json` holds for the same family. */
  readonly inGeneratedRegistry: number | null
  readonly classification: string
  readonly note: string
}

export const SIGNAL_COUNTS = [
  {
    of: 'Chapter 27.7 notification catalog rows',
    measured: 25,
    statedInSource: null,
    statedAt: null,
    inGeneratedRegistry: null,
    classification: 'User-Mandated Product Extension',
    note: 'Header L51686, separator L51687, body L51688-L51712. The source states no count for this table. The identifiers are a User-Mandated Product Extension per L51740.',
  },
  {
    of: 'Chapter 30C.2 notification categories',
    measured: 87,
    statedInSource: 87,
    statedAt: 72923,
    inGeneratedRegistry: 87,
    classification: 'Derived Clarification',
    note: 'Thirteen family tables, L72948-L73096. NOTIF-001 to NOTIF-087, contiguous. The generated registry now holds these 87 as their own register: slice 10 task 13 keyed it on (register, identifier), where it used to hold 87 plain rows that were a BLEND of the two registers and reported this register as complete while missing its first twenty-five.',
  },
  {
    of: 'Chapter 30C.2 family tables',
    measured: 13,
    statedInSource: 13,
    statedAt: 72929,
    inGeneratedRegistry: null,
    classification: 'Derived Clarification',
    note: 'Family row counts 12, 5, 2, 12, 5, 9, 8, 9, 4, 6, 7, 7, 1. They sum to 87, so the two counts reconcile.',
  },
  {
    of: 'identifiers claimed by both registers',
    measured: 25,
    statedInSource: null,
    statedAt: null,
    inGeneratedRegistry: null,
    classification: 'Derived Clarification',
    note: 'The whole of Chapter 27.7. Name agreement across the twenty-five is zero, so the overlap is a different assignment rather than a subset.',
  },
  {
    of: 'union of both registers, keyed by register and identifier',
    measured: 112,
    statedInSource: null,
    statedAt: null,
    inGeneratedRegistry: 112,
    classification: 'Derived Clarification',
    note: '25 + 87. The generated registry agreed at 87 until slice 10 task 13, because it deduplicated on the identifier alone and lost twenty-five rows; it is now keyed on (register, identifier) and the two figures agree. The fifty rows for the twenty-five shared identifiers carry the composite key NOTIF-NNN@L<line>.',
  },
  {
    of: 'Chapter 27.7 mandatory-baseline rows',
    measured: 9,
    statedInSource: 9,
    statedAt: 51734,
    inGeneratedRegistry: null,
    classification: 'SoW Fact',
    note: 'Family cell reads Mandatory baseline. TEST-27.7-03 states nine and the enumeration agrees. Membership of the three baseline families, per L51603.',
  },
  {
    of: 'Chapter 30C.2 affirmative-mandatory cells',
    measured: 23,
    statedInSource: null,
    statedAt: null,
    inGeneratedRegistry: null,
    classification: 'Derived Clarification',
    note: '21 bare Yes, plus Yes, by the Severity 1 floor and Yes for Critical. A different sense of the word from the nine; never summed with it.',
  },
  {
    of: 'catalogued events',
    measured: 25,
    statedInSource: 9,
    statedAt: 51045,
    inGeneratedRegistry: 28,
    classification: 'User-Mandated Product Extension',
    note: 'Nine capture plus sixteen operational-and-server. The stated nine at L51045 is the capture family alone, not the catalogue. The three extra registry rows are in EVENT_REGISTRY_EXTRAS.',
  },
  {
    of: 'catalogued command instances',
    measured: 16,
    statedInSource: 16,
    statedAt: 51334,
    inGeneratedRegistry: 17,
    classification: 'User-Mandated Product Extension',
    note: 'Eight rows per Panel A table. Source count and enumeration agree. The extra registry row is CMD-BB-000097, in COMMAND_REGISTRY_EXTRAS.',
  },
] as const satisfies readonly SignalCount[]
