/**
 * The seven offline capability classes, the eighth token the register
 * actually uses, and the 52-row classification.
 *
 * ── THE CLOSED SET THAT IS NOT CLOSED ──────────────────────────────────────
 * This is the trap in this file and it has TWO wrong answers, not one.
 *
 * §34.7 (L78711) declares seven classes. L78715 puts it in words — every
 * function is sorted "into one of seven buckets" — and the table at
 * L78721-L78729 defines them: Fully available offline, Available offline with
 * restrictions, Cached read-only while offline, Queued for later, Requires
 * online confirmation, Blocked offline, Safe-stop required. The section's own
 * acceptance criterion `AC-OFF-701`, at L78831, requires that "Every Frontline
 * function carries exactly one of the seven classes, and no function is
 * unclassified."
 *
 * The classification register below it — header L78766, fifty-two data rows
 * L78768-L78819 — USES EIGHT. The eighth is `Explicitly prohibited on the
 * device`, on the Conflict-resolution row at L78799, and it is not one of the
 * seven.
 *
 * Wrong answer one: a seven-member exhaustiveness check over the register.
 * It rejects the source's own row.
 *
 * Wrong answer two: quietly widen the union to eight. That is how a closed set
 * stops being a check — `AC-OFF-701` then has nothing left to fail against,
 * and the contradiction disappears instead of being reported.
 *
 * So BOTH are carried and NEITHER is chosen. `OfflineCapabilityClass` stays
 * closed at the seven `AC-OFF-701` names, with a compile-time proof that it
 * was not widened. `RegisterOnlyClassToken` is the eighth, alone, named, and
 * reachable only through `RegisterClassToken` — the register's own vocabulary,
 * which is deliberately a different type from the criterion's. The
 * disagreement is recorded in `OFFLINE_CLASS_CONTRADICTION` with both locators
 * and no pick.
 *
 * ── WHAT THE REGISTER IS KEYED ON, WHICH IS NOT WHAT IT LOOKS LIKE ─────────
 * Ten columns, header-keyed from L78766: Function, Module, Class, Reason, Data
 * required locally, Expiry, Role and qualification restrictions,
 * Artificial-intelligence availability, Fallback, Reconnect behaviour.
 *
 * The register is keyed on FUNCTION, not on module id. `module` is an ordinary
 * column and it does not always hold one module id: L78782 holds two
 * (`MOD-FL-A3` and `MOD-FL-B9`) and the last three rows, L78817-L78819, hold
 * `Cross-module`. Keying a lookup on module id silently drops four of the
 * fifty-two rows, so `module` is typed as the string the source wrote and
 * `MODULE_COLUMN_IS_NOT_A_KEY` records why.
 *
 * ── CONSUMED, NOT RE-DERIVED ───────────────────────────────────────────────
 * `@/policy/decision`'s nine permission tokens already include
 * `cachedReadOnlyOffline` and `queuedOffline`, so two of these seven classes
 * already have a permission outcome in this build. Those two carry it on
 * `permissionOutcome` rather than getting a second spelling. The other five
 * carry `null`: mapping them would be a further ruling this task was not asked
 * to make, and inventing one here is exactly the second-spelling defect in the
 * other direction.
 */
import type { PermissionOutcome } from '@/policy/decision'
import type { DecisionReading } from '@/disclosure/decisions'

/**
 * The seven of `AC-OFF-701` (L78831), in the order the defining table lists
 * them at L78723-L78729. CLOSED AT SEVEN. The eighth token the register uses
 * is deliberately NOT here — see `RegisterOnlyClassToken`.
 */
export type OfflineCapabilityClass =
  | 'Fully available offline'
  | 'Available offline with restrictions'
  | 'Cached read-only while offline'
  | 'Queued for later'
  | 'Requires online confirmation'
  | 'Blocked offline'
  | 'Safe-stop required'

/**
 * The eighth token, used once, at L78799, on the Conflict-resolution row.
 * Named as its own type so that reaching it is always deliberate and always
 * visible in a signature. It is NOT added to `OfflineCapabilityClass`.
 */
export type RegisterOnlyClassToken = 'Explicitly prohibited on the device'

/** The register's actual vocabulary: the criterion's seven, plus the eighth. */
export type RegisterClassToken = OfflineCapabilityClass | RegisterOnlyClassToken

/**
 * Compile-time proof that the union above was NOT quietly widened to eight.
 * If someone adds `'Explicitly prohibited on the device'` to
 * `OfflineCapabilityClass` to make an exhaustiveness check go green, this stops
 * being `never` and the file stops compiling. This is the check that survives
 * the tidying-up instinct; a runtime `.length === 7` does not.
 */
type EighthTokenLeakedIntoTheSeven = Extract<OfflineCapabilityClass, RegisterOnlyClassToken>
const _eighthTokenIsNotOneOfTheSeven: EighthTokenLeakedIntoTheSeven extends never ? true : never =
  true
void _eighthTokenIsNotOneOfTheSeven

/** One row of the defining table, L78723-L78729. */
export interface OfflineCapabilityClassRecord {
  readonly className: OfflineCapabilityClass
  readonly meaning: string
  readonly governingConsequence: string
  /**
   * The existing `@/policy/decision` token for this class, or `null` where
   * this build has not ruled one. Consumed, never minted — see the header.
   */
  readonly permissionOutcome: PermissionOutcome | null
}

export const OFFLINE_CAPABILITY_CLASSES = [
  {
    className: 'Fully available offline',
    meaning: 'Behaves identically with no connectivity',
    governingConsequence: 'No degradation may be introduced by a tenant setting or a platform control',
    permissionOutcome: null,
  },
  {
    className: 'Available offline with restrictions',
    meaning: 'Works, with a stated and displayed reduction',
    governingConsequence: 'The reduction is named to the worker, never silent',
    permissionOutcome: null,
  },
  {
    className: 'Cached read-only while offline',
    meaning: 'Shows last-known data; no change possible',
    governingConsequence: 'The age of the cache is displayed',
    permissionOutcome: 'cachedReadOnlyOffline',
  },
  {
    className: 'Queued for later',
    meaning: 'The act completes locally and its effect elsewhere waits',
    governingConsequence: 'The queue is durable and the pending count is visible',
    permissionOutcome: 'queuedOffline',
  },
  {
    className: 'Requires online confirmation',
    meaning: 'Cannot complete without a successful sync first',
    governingConsequence: 'The reason is stated; a forced sync is attempted',
    permissionOutcome: null,
  },
  {
    className: 'Blocked offline',
    meaning: 'Not available at all without connectivity',
    governingConsequence: 'Absence is explained rather than shown as a dead control',
    permissionOutcome: null,
  },
  {
    className: 'Safe-stop required',
    meaning: 'Continuation would breach an invariant; the application stops that path cleanly',
    governingConsequence: 'Local data is preserved and the exit condition is displayed',
    permissionOutcome: null,
  },
] as const satisfies readonly OfflineCapabilityClassRecord[]

type MissingFromClasses = Exclude<
  OfflineCapabilityClass,
  (typeof OFFLINE_CAPABILITY_CLASSES)[number]['className']
>
const _everyClassIsDefined: MissingFromClasses extends never ? true : never = true
void _everyClassIsDefined

type ExtraInClasses = Exclude<
  (typeof OFFLINE_CAPABILITY_CLASSES)[number]['className'],
  OfflineCapabilityClass
>
const _classesInventNoMember: ExtraInClasses extends never ? true : never = true
void _classesInventNoMember

/**
 * One row of the classification register, L78768-L78819, header-keyed from the
 * ten columns at L78766. `fn` is the Function column and is the register's real
 * key; `module` is an ordinary column. Every field required — the source's rule
 * for this table is stated at L78764, "Every cell carries an explicit status."
 */
export interface OfflineClassificationRow {
  readonly fn: string
  /** The Module column verbatim. NOT a key — see `MODULE_COLUMN_IS_NOT_A_KEY`. */
  readonly module: string
  /**
   * `RegisterClassToken`, not `OfflineCapabilityClass`. One row — L78799 — is
   * outside the seven, and typing this field as the seven would make the
   * source's own register untranscribable.
   */
  readonly klass: RegisterClassToken
  readonly reason: string
  readonly dataRequiredLocally: string
  readonly expiry: string
  readonly roleAndQualificationRestrictions: string
  readonly aiAvailability: string
  readonly fallback: string
  readonly reconnectBehaviour: string
}

export const OFFLINE_CLASSIFICATION = [
  {
    fn: 'Username and personal identification number login',
    module: '`MOD-FL-A1`',
    klass: 'Available offline with restrictions',
    reason: 'Cached credentials are trusted within the offline trust window',
    dataRequiredLocally: 'Cached credential material in the encrypted store',
    expiry: 'Tenant-set, default approximately 24 hours, ceiling 72 hours',
    roleAndQualificationRestrictions: 'Worker role; no qualification gate at login',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: 'Safe stop once the window expires',
    reconnectBehaviour: 'Forced re-sync refreshes credential trust',
  },
  {
    fn: 'Single sign-on login',
    module: '`MOD-FL-A1`',
    klass: 'Blocked offline',
    reason: 'Federation to the tenant identity provider requires connectivity',
    dataRequiredLocally: '`Not applicable — no local artefact exists`',
    expiry: '`Not applicable — no offline validity`',
    roleAndQualificationRestrictions: 'Staff and admin roles',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: 'Personal identification number path where the worker holds one',
    reconnectBehaviour: 'Available immediately on reconnection',
  },
  {
    fn: 'Shared-mode fast switching and auto-logout',
    module: '`MOD-FL-A1`',
    klass: 'Fully available offline',
    reason: 'Session posture is a local behaviour',
    dataRequiredLocally: 'Device mode set at enrollment',
    expiry: '`Not applicable — a device setting, not a credential`',
    roleAndQualificationRestrictions: 'All roles using the device',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: '`Not applicable — no failure mode requiring one`',
    reconnectBehaviour: 'Unchanged',
  },
  {
    fn: 'Second-identity step-up for approval',
    module: '`MOD-FL-A1`',
    klass: 'Requires online confirmation',
    reason: 'The identities and authority recorded must be fresh, not stale cache',
    dataRequiredLocally: 'Cached authorising identity only within the trust window',
    expiry: 'Trust window bounds any cached use',
    roleAndQualificationRestrictions: 'Supervisor and above; qualification not applicable',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: 'Sign-off cannot proceed; the run holds at that step',
    reconnectBehaviour: 'Forced sync then step-up proceeds',
  },
  {
    fn: 'My Runs list of assigned work',
    module: '`MOD-FL-A2`',
    klass: 'Cached read-only while offline',
    reason: 'Assignment is made in the Delivery Operations Hub and delivered',
    dataRequiredLocally: 'The assignment set as at last sync',
    expiry: 'Bounded by the trust window for authority-bearing fields',
    roleAndQualificationRestrictions: 'Worker\'s own assignments only',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: 'Displays the last-known assignment set with its age',
    reconnectBehaviour: 'Refreshed on sync',
  },
  {
    fn: 'Package readiness display',
    module: '`MOD-FL-A2`',
    klass: 'Fully available offline',
    reason: 'Readiness is a local fact about local files',
    dataRequiredLocally: 'Package inventory and integrity state',
    expiry: 'Package expiry is undefined in the source',
    roleAndQualificationRestrictions: '`Not applicable — display only`',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: 'Shows not-yet-ready rather than silently missing',
    reconnectBehaviour: 'Lazy pull completes on reconnection',
  },
  {
    fn: 'Lazy pull of a mid-shift assignment',
    module: '`MOD-FL-A2`',
    klass: 'Blocked offline',
    reason: 'The package must be downloaded',
    dataRequiredLocally: '`Not applicable — the artefact is absent`',
    expiry: '`Not applicable`',
    roleAndQualificationRestrictions: 'Worker\'s own assignments only',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: 'The run shows as not-yet-ready',
    reconnectBehaviour: 'Pull completes on reconnection',
  },
  {
    fn: 'Run Player rendering of authored screens',
    module: '`MOD-FL-A3`',
    klass: 'Fully available offline',
    reason: 'All screen content ships in the package',
    dataRequiredLocally: 'All screen content in the run\'s locale',
    expiry: 'Pinned to the run\'s package version',
    roleAndQualificationRestrictions: 'Qualification gates apply at gated steps',
    aiAvailability: '`Unavailable` — no agent involvement in rendering',
    fallback: '`Not applicable — content is present by design`',
    reconnectBehaviour: 'Unchanged',
  },
  {
    fn: 'Work-instruction difficulty level selection',
    module: '`MOD-FL-A3`',
    klass: 'Fully available offline',
    reason: 'The authored levels travel in the package',
    dataRequiredLocally: 'The levels the package carries',
    expiry: 'Pinned to the package version',
    roleAndQualificationRestrictions: 'Selected by a worker-profile field',
    aiAvailability: 'Artificial intelligence drafted the unwritten levels at authoring time, all reviewed before publication',
    fallback: 'Falls back to the level present where the assigned level is absent',
    reconnectBehaviour: 'Resolved by `DEC-WIDIFF-001`',
  },
  {
    fn: 'Unit Execution open and unit binding',
    module: '`MOD-FL-A3`',
    klass: 'Fully available offline',
    reason: 'Scanning and binding are local acts',
    dataRequiredLocally: 'Unit mode and any expected values',
    expiry: 'Pinned to the package version',
    roleAndQualificationRestrictions: 'Worker role',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: 'Platform-assigned identity where the operation creates identity on the line',
    reconnectBehaviour: 'Bindings upload with their captures',
  },
  {
    fn: 'Forward navigation and read-only review',
    module: '`MOD-FL-A3`',
    klass: 'Fully available offline',
    reason: 'Navigation is local',
    dataRequiredLocally: 'The package and local execution state',
    expiry: '`Not applicable — no expiry applies`',
    roleAndQualificationRestrictions: 'Worker role',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: '`Not applicable — no failure mode requiring one`',
    reconnectBehaviour: 'Unchanged',
  },
  {
    fn: 'Append-only correction after commit',
    module: '`MOD-FL-A3`',
    klass: 'Fully available offline',
    reason: 'Correction is an appended local record',
    dataRequiredLocally: 'Local execution state',
    expiry: '`Not applicable — no expiry applies`',
    roleAndQualificationRestrictions: 'Worker role; the original is never altered',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: '`Not applicable — the model has no failure path that alters an original`',
    reconnectBehaviour: 'Correction uploads as its own record',
  },
  {
    fn: 'Worker-finished declaration',
    module: '`MOD-FL-A3`',
    klass: 'Fully available offline',
    reason: 'Worker-finished is a device event',
    dataRequiredLocally: 'Local execution state',
    expiry: '`Not applicable — no expiry applies`',
    roleAndQualificationRestrictions: 'Worker role',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: '`Not applicable — the act is purely local`',
    reconnectBehaviour: 'Run stands `submitted` on receipt',
  },
  {
    fn: 'Complete-and-synced state',
    module: '`MOD-FL-A3`',
    klass: 'Requires online confirmation',
    reason: 'Defined as server receipt and acknowledgement of every capture',
    dataRequiredLocally: '`Not applicable — the state is server-derived`',
    expiry: '`Not applicable`',
    roleAndQualificationRestrictions: '`Not applicable — a system state, not a user action`',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: 'The run displays as submitted with data owed',
    reconnectBehaviour: 'Reached when every capture is acknowledged',
  },
  {
    fn: 'Supervisor sign-off screen',
    module: '`MOD-FL-A3` and `MOD-FL-B9`',
    klass: 'Requires online confirmation',
    reason: 'A sync is forced before designated high-risk actions, sign-offs foremost',
    dataRequiredLocally: 'Cached authority only within the trust window',
    expiry: 'Trust window bounds cached authority',
    roleAndQualificationRestrictions: 'Supervisor and above through the second-identity step-up',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: 'The run holds at the sign-off step; other runs continue',
    reconnectBehaviour: 'Forced sync then sign-off proceeds',
  },
  {
    fn: 'Measurement, scan, photo, checkbox confirmation of one item or many, dropdown selection and free-text capture',
    module: '`MOD-FL-A4`',
    klass: 'Fully available offline',
    reason: 'Capture is the device\'s own act',
    dataRequiredLocally: 'Screen definitions and any expected values',
    expiry: 'Pinned to the package version',
    roleAndQualificationRestrictions: 'Qualification gates apply where authored',
    aiAvailability: '`Unavailable` — capture is deterministic',
    fallback: '`Not applicable — capture never depends on the network`',
    reconnectBehaviour: 'Captures upload in order',
  },
  {
    fn: 'Electronic signature and acknowledgement capture',
    module: '`MOD-FL-A4`',
    klass: 'Available offline with restrictions',
    reason: 'Capture is local, but where it constitutes a designated high-risk sign-off a sync is forced',
    dataRequiredLocally: 'Screen definitions',
    expiry: 'Trust window where authority is involved',
    roleAndQualificationRestrictions: 'Per authored screen configuration',
    aiAvailability: '`Unavailable` — deterministic',
    fallback: 'Where a forced sync is required and unavailable, the step holds',
    reconnectBehaviour: 'Uploads with its envelope',
  },
  {
    fn: 'Live in and out-of-specification feedback',
    module: '`MOD-FL-A4`',
    klass: 'Fully available offline',
    reason: 'Deterministic and on-device against packaged limits',
    dataRequiredLocally: 'Specification limits',
    expiry: 'Pinned to the package version',
    roleAndQualificationRestrictions: '`Not applicable — feedback is not role-gated`',
    aiAvailability: '`Unavailable` — deterministic by design',
    fallback: '`Not applicable — no network dependency exists`',
    reconnectBehaviour: 'Unchanged',
  },
  {
    fn: 'Named-location provenance stamping',
    module: '`MOD-FL-A4`',
    klass: 'Fully available offline',
    reason: 'Resolved from station and assignment context, never a coordinate',
    dataRequiredLocally: 'Location context from the assignment',
    expiry: '`Not applicable`',
    roleAndQualificationRestrictions: '`Not applicable — never a gate`',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: 'Where context cannot supply a location the record notes that plainly',
    reconnectBehaviour: 'Uploads with the capture',
  },
  {
    fn: 'Evidence media storage',
    module: '`MOD-FL-A4`',
    klass: 'Fully available offline',
    reason: 'The encrypted on-device store is app-managed',
    dataRequiredLocally: 'Storage capacity',
    expiry: '`Client Decision Required — DEC-STORE-001` for the full case',
    roleAndQualificationRestrictions: '`Not applicable — storage is not role-gated`',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: 'Media never touches the device gallery in any state',
    reconnectBehaviour: 'Evicted only after confirmed receipt plus integrity check',
  },
  {
    fn: 'Deterministic gate enforcement',
    module: '`MOD-FL-A5`',
    klass: 'Fully available offline',
    reason: 'Mandatory safety layer; a network-dependent gate could be worked past',
    dataRequiredLocally: 'Gate rules from the package',
    expiry: 'Pinned to the package version',
    roleAndQualificationRestrictions: 'Qualification gates carry the tenant\'s posture',
    aiAvailability: '`Unavailable` — no model sits in the triggering path',
    fallback: '`Not applicable — the layer has no off switch`',
    reconnectBehaviour: 'Unchanged',
  },
  {
    fn: 'Deviation detection',
    module: '`MOD-FL-A5`',
    klass: 'Fully available offline',
    reason: 'Mandatory safety layer, rule-based',
    dataRequiredLocally: 'Timing, sequence, specification and evidence rules',
    expiry: 'Pinned to the package version',
    roleAndQualificationRestrictions: '`Not applicable — detection is not role-gated`',
    aiAvailability: '`Unavailable` — deterministic',
    fallback: '`Not applicable — the layer has no off switch`',
    reconnectBehaviour: 'Mirrored server-side on arrival',
  },
  {
    fn: 'Severity-band classification',
    module: '`MOD-FL-A5`',
    klass: 'Fully available offline',
    reason: 'Mandatory, uniform for every tenant, at the instant of capture',
    dataRequiredLocally: 'Severity mappings, catalog definitions and tenant action bundles',
    expiry: 'Pinned to the package version',
    roleAndQualificationRestrictions: '`Not applicable — classification is not role-gated`',
    aiAvailability: '`Explicitly prohibited` — deterministic logic owns classification',
    fallback: '`Not applicable — the layer has no off switch`',
    reconnectBehaviour: 'Server atoms mirror, never trigger',
  },
  {
    fn: 'Immediate Severity 1 hold',
    module: '`MOD-FL-A5`',
    klass: 'Fully available offline',
    reason: 'The lot is protected from the moment of breach',
    dataRequiredLocally: 'Lot, unit or run scope resolution',
    expiry: 'Held until a Quality Manager release command arrives',
    roleAndQualificationRestrictions: 'Release is Quality Manager only, uniformly',
    aiAvailability: '`Explicitly prohibited` — no agent may release a hold',
    fallback: '`Not applicable — the hold is the fallback`',
    reconnectBehaviour: 'Release arrives as a lot-release command',
  },
  {
    fn: 'Pre-authorised containment checklist',
    module: '`MOD-FL-A5`',
    klass: 'Fully available offline',
    reason: 'Launches locally at classification',
    dataRequiredLocally: 'The authored containment checklist in the package',
    expiry: 'Pinned to the package version',
    roleAndQualificationRestrictions: 'Worker executes; Quality Manager dispositions',
    aiAvailability: '`Unavailable` offline — proposals beyond pre-authorised policy are human-gated',
    fallback: 'Escalation delivery deferred to sync',
    reconnectBehaviour: 'Containment record uploads with the deviation',
  },
  {
    fn: 'Escalation delivery',
    module: '`MOD-FL-A5`',
    klass: 'Queued for later',
    reason: 'Escalation routing resolves server-side to people on shift',
    dataRequiredLocally: '`Not applicable — routing is server-side`',
    expiry: '`Not applicable`',
    roleAndQualificationRestrictions: 'Routed to roles, never individuals',
    aiAvailability: '`Unavailable` — routing is deterministic',
    fallback: 'Local containment proceeds regardless',
    reconnectBehaviour: 'Delivered at sync with the nobody-on-shift fallback',
  },
  {
    fn: 'Hold propagation to sibling devices',
    module: '`MOD-FL-A5`',
    klass: 'Queued for later',
    reason: 'Siblings learn at their own next sync',
    dataRequiredLocally: '`Not applicable — propagation is server-mediated`',
    expiry: '`Not applicable`',
    roleAndQualificationRestrictions: '`Not applicable — a system behaviour`',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: 'The breach point is protected immediately and locally',
    reconnectBehaviour: 'Propagation lag recorded as telemetry',
  },
  {
    fn: 'Capture upload queue',
    module: '`MOD-FL-A6`',
    klass: 'Queued for later',
    reason: 'Durable and resumable across a mid-sync drop',
    dataRequiredLocally: 'Queue storage',
    expiry: '`Client Decision Required` — no queue depth limit is stated',
    roleAndQualificationRestrictions: '`Not applicable — a system behaviour`',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: 'Nothing is lost if connectivity fails partway',
    reconnectBehaviour: 'Resumes where it left off',
  },
  {
    fn: 'Command channel pull',
    module: '`MOD-FL-A6`',
    klass: 'Blocked offline',
    reason: 'Pull-based by design',
    dataRequiredLocally: '`Not applicable — the backlog is server-held`',
    expiry: '`Not applicable`',
    roleAndQualificationRestrictions: '`Not applicable — a system behaviour`',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: 'Local state persists unchanged',
    reconnectBehaviour: 'Pulled and applied in order',
  },
  {
    fn: 'Version pinning of an in-flight run',
    module: '`MOD-FL-A6`',
    klass: 'Fully available offline',
    reason: 'The run finishes on the version it started on',
    dataRequiredLocally: 'The pinned package',
    expiry: 'For the life of the run',
    roleAndQualificationRestrictions: '`Not applicable — a system behaviour`',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: '`Not applicable — pinning is the protection`',
    reconnectBehaviour: 'Version-change notices appear at the next execution boundary',
  },
  {
    fn: 'Clock-skew detection',
    module: '`MOD-FL-A6`',
    klass: 'Fully available offline',
    reason: 'Detected locally against the tenant threshold',
    dataRequiredLocally: 'The threshold value from configuration',
    expiry: 'Threshold is tenant-set, default approximately 5 minutes, ceiling 60 minutes',
    roleAndQualificationRestrictions: '`Not applicable — a system behaviour`',
    aiAvailability: '`Unavailable` — deterministic',
    fallback: 'Device timestamps are not trusted to decide alone',
    reconnectBehaviour: 'Flagged conflicts route to human review',
  },
  {
    fn: 'Conflict resolution',
    module: '`MOD-FL-A6`',
    klass: 'Explicitly prohibited on the device',
    reason: 'The worker never sees or resolves a conflict',
    dataRequiredLocally: '`Not applicable`',
    expiry: '`Not applicable`',
    roleAndQualificationRestrictions: 'Quality Manager and above resolve; Supervisors view',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: 'Resolution is a Client Command Center surface',
    reconnectBehaviour: 'Resolved by a Quality Manager after sync',
  },
  {
    fn: 'Encrypted on-device store',
    module: '`MOD-FL-A7`',
    klass: 'Fully available offline',
    reason: 'App-managed regardless of device management',
    dataRequiredLocally: 'Encryption keys held by the application',
    expiry: '`Not applicable`',
    roleAndQualificationRestrictions: '`Not applicable — a platform invariant`',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: '`Not applicable — encryption at rest is an enforced invariant`',
    reconnectBehaviour: 'Unchanged',
  },
  {
    fn: 'Personal identification number lockout',
    module: '`MOD-FL-A7`',
    klass: 'Fully available offline',
    reason: 'Lockout is a local control',
    dataRequiredLocally: 'Local attempt counter',
    expiry: '`Not applicable`',
    roleAndQualificationRestrictions: 'Worker role',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: 'Reset requires the managed-credential path',
    reconnectBehaviour: 'Reset available on reconnection',
  },
  {
    fn: 'Personal identification number reset',
    module: '`MOD-FL-A7`',
    klass: 'Blocked offline',
    reason: 'Reset is owned by the Delivery Operations Hub managed-credential path',
    dataRequiredLocally: '`Not applicable`',
    expiry: '`Not applicable`',
    roleAndQualificationRestrictions: 'Tenant Admin or Supervisor per Hub rules',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: 'The worker uses another conformant device or waits',
    reconnectBehaviour: 'Available on reconnection',
  },
  {
    fn: 'Remote wipe execution',
    module: '`MOD-FL-A7`',
    klass: 'Blocked offline',
    reason: 'A final sync attempt must precede erasure',
    dataRequiredLocally: '`Not applicable`',
    expiry: '`Client Decision Required — DEC-WIPE-001`',
    roleAndQualificationRestrictions: 'Root Super Admin approves; critical class',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: 'Nothing is erased; unsynced work is preserved',
    reconnectBehaviour: 'Final sync attempted then erasure',
  },
  {
    fn: 'Suspension state honouring',
    module: '`MOD-FL-A7`',
    klass: 'Available offline with restrictions',
    reason: 'Cached suspension state is trusted only within the cache-validity rule',
    dataRequiredLocally: 'Cached suspension state',
    expiry: 'Default approximately 24 hours, ceiling 72 hours',
    roleAndQualificationRestrictions: 'All tenant roles',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: 'Safe stop once the trust window expires',
    reconnectBehaviour: 'Applied at next contact; compliance stop locks immediately on receipt',
  },
  {
    fn: 'Agent-selected coaching card',
    module: '`MOD-FL-B8`',
    klass: 'Blocked offline',
    reason: 'The reasoning layer is server-side and online-only',
    dataRequiredLocally: '`Not applicable`',
    expiry: '`Not applicable`',
    roleAndQualificationRestrictions: 'Worker role',
    aiAvailability: '`Unavailable` — this is the defining offline reduction',
    fallback: 'The step\'s authored Work Instructions render instead',
    reconnectBehaviour: 'Agent selection resumes on reconnection',
  },
  {
    fn: 'Coaching dismissal signal',
    module: '`MOD-FL-B8`',
    klass: 'Queued for later',
    reason: 'Dismissals are learning and supervisor-visibility signals',
    dataRequiredLocally: 'Local signal store',
    expiry: '`Not applicable`',
    roleAndQualificationRestrictions: 'Worker role',
    aiAvailability: '`Unavailable` — the signal is deterministic',
    fallback: 'Dismissal still works locally',
    reconnectBehaviour: 'Delivered at sync; a pattern, not one dismissal, becomes a signal',
  },
  {
    fn: 'Qualification gate evaluation',
    module: '`MOD-FL-B9`',
    klass: 'Fully available offline',
    reason: 'Enforced locally at step level',
    dataRequiredLocally: 'Cached qualification state and the tenant posture',
    expiry: 'Bounded by the offline trust window',
    roleAndQualificationRestrictions: 'Worker\'s own qualifications',
    aiAvailability: '`Unavailable` — deterministic',
    fallback: 'The parked run',
    reconnectBehaviour: 'Clearance arrives on the command channel',
  },
  {
    fn: 'Qualification clearance receipt',
    module: '`MOD-FL-B9`',
    klass: 'Blocked offline',
    reason: 'The clearance rides the command channel',
    dataRequiredLocally: '`Not applicable`',
    expiry: 'Clearance duration is tenant-defined and uniform',
    roleAndQualificationRestrictions: 'Supervisor grants as action 10',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: 'The parked run continues to park',
    reconnectBehaviour: 'Applied at next sync; the parked run resumes',
  },
  {
    fn: 'Step-level identity re-confirmation',
    module: '`MOD-FL-B9`',
    klass: 'Available offline with restrictions',
    reason: 'A local re-confirmation of the logged-in identity',
    dataRequiredLocally: 'Cached credential material',
    expiry: 'Bounded by the trust window',
    roleAndQualificationRestrictions: 'Per authored screen; off by default',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: 'Where the trust window has expired, safe stop applies',
    reconnectBehaviour: 'Refreshed on sync',
  },
  {
    fn: 'In-app notification inbox',
    module: '`MOD-FL-B10`',
    klass: 'Cached read-only while offline',
    reason: 'The inbox back-fills on login and sync',
    dataRequiredLocally: 'The inbox as at last sync',
    expiry: '`Not applicable`',
    roleAndQualificationRestrictions: 'Identity-scoped to the logged-in worker',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: 'General notifications carry no read obligation',
    reconnectBehaviour: 'Back-fills on reconnection',
  },
  {
    fn: 'Notified-class change notice at execution start',
    module: '`MOD-FL-B10`',
    klass: 'Cached read-only while offline',
    reason: 'The notice is built from the package the device holds',
    dataRequiredLocally: 'The republish description in the package',
    expiry: 'Pinned to the package version',
    roleAndQualificationRestrictions: '`Not applicable — presented to the executing worker`',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: 'Where the new version has not arrived, the prior pinned version executes',
    reconnectBehaviour: 'The notice appears at the next execution after arrival',
  },
  {
    fn: 'Pause and session idle',
    module: '`MOD-FL-B11`',
    klass: 'Fully available offline',
    reason: 'A per-worker session-level local behaviour',
    dataRequiredLocally: 'Local session state',
    expiry: 'Auto-logout is a device-mode setting',
    roleAndQualificationRestrictions: 'Worker role',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: '`Not applicable — pausing never pauses the run`',
    reconnectBehaviour: 'Unchanged',
  },
  {
    fn: 'Step-away and hand-back flag',
    module: '`MOD-FL-B11`',
    klass: 'Queued for later',
    reason: 'The flag is an operational event delivered at sync',
    dataRequiredLocally: 'Local flag store',
    expiry: '`Not applicable`',
    roleAndQualificationRestrictions: 'Worker raises; Supervisor receives',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: 'The flag is preserved, never dropped',
    reconnectBehaviour: 'Delivered at sync',
  },
  {
    fn: 'Substitution handover receipt',
    module: '`MOD-FL-B11`',
    klass: 'Blocked offline',
    reason: 'Substitution is a command-channel action',
    dataRequiredLocally: '`Not applicable`',
    expiry: '`Not applicable`',
    roleAndQualificationRestrictions: 'Supervisor initiates',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: 'The original assignment stands locally',
    reconnectBehaviour: 'Handover state presented once the command lands',
  },
  {
    fn: 'At-step certification-expiry enforcement',
    module: '`MOD-FL-B11`',
    klass: 'Fully available offline',
    reason: 'Enforced on the device at step level',
    dataRequiredLocally: 'Cached qualification state',
    expiry: 'Bounded by the trust window',
    roleAndQualificationRestrictions: 'Worker\'s own qualifications; tenant posture applies',
    aiAvailability: '`Unavailable` — deterministic',
    fallback: 'The worker completes the current run; the next assignment is blocked',
    reconnectBehaviour: 'Refreshed on sync',
  },
  {
    fn: 'Training Library viewer',
    module: '`MOD-FL-B12`',
    klass: 'Blocked offline',
    reason: 'Deliberately excluded from the offline bundle to keep bundles lean',
    dataRequiredLocally: '`Not applicable — content is not packaged`',
    expiry: '`Not applicable`',
    roleAndQualificationRestrictions: 'Scoped to the worker\'s tenant',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: 'Nothing in a run depends on the library; it is never required mid-run',
    reconnectBehaviour: 'Available when connected',
  },
  {
    fn: 'Trust-window expiry with no sync',
    module: 'Cross-module',
    klass: 'Safe-stop required',
    reason: 'Cached credentials, qualifications and suspension states may not be trusted beyond the window',
    dataRequiredLocally: '`Not applicable`',
    expiry: 'Default approximately 24 hours, ceiling 72 hours',
    roleAndQualificationRestrictions: 'All roles',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: 'The application stops the affected path and preserves all local data',
    reconnectBehaviour: 'Forced re-sync restores capability',
  },
  {
    fn: 'Compliance suspension received',
    module: 'Cross-module',
    klass: 'Safe-stop required',
    reason: 'The application locks immediately and preserves all local data',
    dataRequiredLocally: 'Local data preserved intact',
    expiry: 'Until the compliance-emergency path restores the tenant',
    roleAndQualificationRestrictions: 'All tenant roles',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: 'The fixed worker-facing message is displayed',
    reconnectBehaviour: 'Restoration through the dual-authorised path',
  },
  {
    fn: 'Device storage exhausted',
    module: 'Cross-module',
    klass: 'Safe-stop required',
    reason: 'Behaviour is deferred to the Frontline Functional Specification',
    dataRequiredLocally: '`Client Decision Required`',
    expiry: '`Client Decision Required`',
    roleAndQualificationRestrictions: '`Client Decision Required`',
    aiAvailability: '`Unavailable` — no agent involvement',
    fallback: '`Client Decision Required — DEC-STORE-001`; no behaviour is invented',
    reconnectBehaviour: '`Client Decision Required — DEC-STORE-001`',
  },
] as const satisfies readonly OfflineClassificationRow[]

/**
 * Why the register is not indexed by module id. Four of the fifty-two rows
 * carry something that is not one: L78782 names two modules on one row, and
 * L78817, L78818 and L78819 each name `Cross-module`. A module-keyed lookup
 * drops them and nothing says so.
 */
export const MODULE_COLUMN_IS_NOT_A_KEY =
  'The register is keyed on Function. The Module column holds two module ids on one row (L78782) ' +
  'and `Cross-module` on three (L78817-L78819), so it is not a key and is never used as one here.'

/** Rows whose class is one of the seven `AC-OFF-701` names. */
export function rowsInClass(klass: OfflineCapabilityClass): readonly OfflineClassificationRow[] {
  return OFFLINE_CLASSIFICATION.filter((r) => r.klass === klass)
}

/**
 * The rows the criterion cannot account for. Derived from the shipped rows
 * rather than listed, so it cannot drift from them, and it is a `filter` over
 * the register rather than a hard-coded `[L78799]` so that a second such row
 * appearing in a later transcription shows up here instead of hiding.
 */
export const ROWS_OUTSIDE_THE_SEVEN: readonly OfflineClassificationRow[] =
  OFFLINE_CLASSIFICATION.filter((r) => !isOneOfTheSeven(r.klass))

/**
 * A `RegisterClassToken` narrowing that is driven by the shipped seven rather
 * than by a hand-written list. Written as a `.some` over
 * `OFFLINE_CAPABILITY_CLASSES` deliberately: a hard-coded array here would be
 * a SECOND spelling of the seven, and the two would drift.
 */
export function isOneOfTheSeven(token: RegisterClassToken): token is OfflineCapabilityClass {
  return OFFLINE_CAPABILITY_CLASSES.some((c) => c.className === token)
}

/**
 * The contradiction, recorded with both locators and NEITHER READING CHOSEN.
 *
 * This is a source contradiction rather than an open client decision: the
 * source states both positions itself. It is disclosed here in the canon's own
 * `DecisionReading` shape — imported, not redeclared — under this build's key
 * `DEC-OFFCLASS-001`, because the source names no `DEC-*` for it.
 * `tests/unit/offline-capability.test.ts` asserts that key is absent from both
 * the frozen source and `@/disclosure/decisions`, so the moment a later task
 * lifts it into the canon this suite goes red and forces the switch.
 */
export interface OfflineClassContradiction {
  readonly decisionRef: 'DEC-OFFCLASS-001'
  readonly keyIsThisBuilds: true
  readonly question: string
  readonly readings: readonly DecisionReading[]
  /**
   * Typed `null`, not `string`. There is no adopted position and a `string`
   * here would invite one; the whole ruling is that neither reading is chosen.
   */
  readonly adopted: null
  readonly howThisBuildCarriesBoth: string
  readonly canonNote: string
}

export const OFFLINE_CLASS_CONTRADICTION: OfflineClassContradiction = {
  decisionRef: 'DEC-OFFCLASS-001',
  keyIsThisBuilds: true,
  question:
    'Is the offline capability classification a closed set of seven, or of eight? The source ' +
    'declares seven and classifies one of its own fifty-two rows with a token that is not among ' +
    'them.',
  readings: [
    {
      text:
        'Seven. §34.7 sorts every function "into one of seven buckets", the defining table lists ' +
        'exactly seven, and `AC-OFF-701` requires that every Frontline function "carries exactly ' +
        'one of the seven classes, and no function is unclassified".',
      locator: 'AC-OFF-701 · L78831 · prose L78715 · table L78721-L78729',
    },
    {
      text:
        'Eight. The classification register the section itself supplies classifies Conflict ' +
        'resolution as `Explicitly prohibited on the device`, which is not one of the seven. On ' +
        'this reading `AC-OFF-701` is unsatisfiable against the source’s own register, because ' +
        'one function is classified outside the seven rather than left unclassified.',
      locator: 'L78799 · register L78766 header, rows L78768-L78819',
    },
  ],
  adopted: null,
  howThisBuildCarriesBoth:
    '`OfflineCapabilityClass` stays closed at the seven the criterion names, with a compile-time ' +
    'proof that the eighth was not folded into it. `RegisterOnlyClassToken` carries the eighth ' +
    'alone, and the register is typed on `RegisterClassToken`, the union of both, so the ' +
    'source’s own row is transcribable without the criterion’s closed set ceasing to be a check. ' +
    '`ROWS_OUTSIDE_THE_SEVEN` names the row `AC-OFF-701` cannot account for.',
  canonNote:
    'The frozen source names no `DEC-*` identifier for this contradiction, so `DEC-OFFCLASS-001` ' +
    'is this build’s key rather than the source’s, declared as a gap for the decision canon ' +
    'rather than filed under a neighbouring identifier. `@/disclosure/decisions` is another ' +
    'task’s file and is read here, never written.',
}
