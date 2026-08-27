// Task 6 hand-authored fixtures — the recurring cast's own cross-cutting
// rows: notifications, commands, events, audit, schedules, ai-requests.
//
// Per controller ruling R10 (docs/superpowers/plans/2026-08-26-runway.md,
// "Seed authoring method"), the recurring cast's own story stays hand-
// authored here; `scripts/generate-seed.mjs` imports this module, emits
// every row verbatim, then fills the surrounding population and the
// remaining enum coverage around it.
//
// Cast note: Tasks 2-3 built Bright Bikes' own recurring cast under
// different personal names than the frozen source's own illustrative
// Bright Bikes examples (which name "Maya", "Sam", "Elena", "Priya",
// "Omar" — `Illustrative Example` colour, not literal identifiers). This
// file maps each cited storyboard's ROLE onto the cast Tasks 2-3 and 5
// already established, never onto the source's own illustrative names:
//   - the gated Worker on TAB-014           -> Alice Okonkwo   (WRK-BB-WKR-01 / USR-BB-WKR-01)
//   - the second worker on the recurring Run -> Ben Castellanos (WRK-BB-WKR-02 / USR-BB-WKR-02)
//   - the Supervisor ("Sam"'s role)          -> Marco Ellis     (USR-BB-SUP-01), Job Owner (task5-hub.mjs)
//   - the Quality Manager ("Elena"'s role)   -> Priya Raghunathan (USR-BB-QM-01), the only role
//     that may release a hold (task5-hub.mjs `releasedBy`)
//   - the Tenant Admin ("Priya"'s role)      -> Dana Whitfield  (USR-BB-ADMIN)
// No `Math.random()`, no `Date.now()` -- `stamp()` only ever adds a fixed
// integer offset to a fixed literal base, exactly as task5-hub.mjs does.

const stamp = (baseIso, minuteOffset) => new Date(new Date(baseIso).getTime() + minuteOffset * 60000).toISOString()

const ALICE_U = 'USR-BB-WKR-01'
const MARCO = 'USR-BB-SUP-01' // Supervisor, Job Owner
const PRIYA_QM = 'USR-BB-QM-01' // Quality Manager, Release Authority
const DANA_ADMIN = 'USR-BB-ADMIN' // Tenant Admin
const TAB014 = 'DEV-BB-TAB-014'
const SITE_ID = 'SITE-BB-RIVERSIDE'
const AREA_ID = 'AREA-BB-ASSEMBLY'

// ===========================================================================
// notifications — SB-SCHED-01's own worked chain (L101659-L101682) plus the
// Severity 1 hold sequence's notification side (OBJ-052/053, task5-hub.mjs's
// DEV-BB-SEV1-01/HOLD-BB-SEV1-01) and SB-SCHED-14's critical re-notify
// (L101941-L101962). Ben Castellanos' QUAL-BB-02 (qualifications.json)
// really does expire 2026-08-28 -- 14 days out was 2026-08-14, two days
// before platform "now" (2026-08-16T09:12Z), so the 14-day warning has
// genuinely already fired and been acknowledged; the 7-day warning
// (2026-08-21) has not happened yet, so this fixture stops at the step
// that has actually occurred rather than inventing a future send.
// Notification honesty rule (master prompt §19.1 / L75551): delivery is
// not opening; opening is not acknowledgement; acknowledgement is not the
// business action -- every timestamp below is present only up to the point
// its own `status` has actually reached, never further.
// ===========================================================================
export const notifications = [
  {
    // SB-SCHED-01 step 15 (L101661): "created, eligible, queued, sent,
    // provider-accepted, delivered, opened, read, acknowledged." Marco
    // acknowledges and arranges cover -- acknowledgement is not the
    // business action itself (arranging cover is), so `status` stops at
    // `acknowledged`, never advances to `acted`.
    id: 'NOTIF-BB-QUALWARN-14D',
    tenantId: 'TEN-BRIGHTBIKES',
    eventId: null,
    severity: 'Medium',
    recipientRoleIds: ['SUPERVISOR'],
    recipientUserIds: [MARCO],
    channels: ['in-app', 'email'],
    // Fix round 1 (review Important 5): 06:00 America/Chicago on
    // 2026-08-14 is CDT (UTC-5), not a naive UTC=local reading -- these
    // four stamps are now 11:00Z/11:00:05Z/11:00:12Z/12:15Z/12:16:30Z,
    // matching `SCHEDOCC-BB-QUALWARN-14D`'s own corrected `dueAt` below.
    createdAt: '2026-08-14T11:00:00Z',
    sentAt: '2026-08-14T11:00:05Z',
    deliveredAt: '2026-08-14T11:00:12Z',
    openedAt: '2026-08-14T12:15:00Z',
    acknowledgedBy: MARCO,
    acknowledgedAt: '2026-08-14T12:16:30Z',
    resolvedBy: null,
    resolvedAt: null,
    fallbackDelivered: false,
    deduplicationGroup: 'qual-warn:WRK-BB-WKR-02:QUAL-BB-02:14d',
    status: 'acknowledged',
  },
  {
    // The Severity 1 alert to the Quality Manager: delivered and opened,
    // deliberately NOT yet acknowledged in this row -- `NOTIF-BB-SEV1-ACT`
    // below carries the acknowledged-then-acted pair, so this row
    // demonstrates `read` as its own distinct value rather than being
    // skipped past on the way to acknowledgement. Times align with
    // `HOLD-BB-SEV1-01` (task5-hub.mjs): placed 07:55:00Z.
    id: 'NOTIF-BB-SEV1-ALERT',
    tenantId: 'TEN-BRIGHTBIKES',
    eventId: null,
    severity: 'Critical',
    recipientRoleIds: ['QUALITY_MANAGER'],
    recipientUserIds: [PRIYA_QM],
    channels: ['in-app', 'email'],
    createdAt: '2026-08-15T07:55:05Z',
    sentAt: '2026-08-15T07:55:07Z',
    deliveredAt: '2026-08-15T07:55:15Z',
    openedAt: '2026-08-15T07:58:00Z',
    acknowledgedBy: null,
    acknowledgedAt: null,
    resolvedBy: null,
    resolvedAt: null,
    fallbackDelivered: false,
    deduplicationGroup: null,
    status: 'read',
  },
  {
    // The same Severity 1 alert's later moment: acknowledged, THEN acted
    // -- OBJ-052's release chain (task5-hub.mjs `releasedBy: PRIYA_QM`,
    // `releasedAt` 11:15:00Z). `acted` is the honesty ladder's own
    // separately-named state (acknowledged<acted, L51605's fourth pair)
    // for the actual business action (Priya releasing the hold), never
    // implied by acknowledgement alone.
    id: 'NOTIF-BB-SEV1-ACT',
    tenantId: 'TEN-BRIGHTBIKES',
    eventId: null,
    severity: 'Critical',
    recipientRoleIds: ['QUALITY_MANAGER'],
    recipientUserIds: [PRIYA_QM],
    channels: ['in-app', 'email'],
    createdAt: '2026-08-15T07:55:05Z',
    sentAt: '2026-08-15T07:55:07Z',
    deliveredAt: '2026-08-15T07:55:15Z',
    openedAt: '2026-08-15T07:58:00Z',
    acknowledgedBy: PRIYA_QM,
    acknowledgedAt: '2026-08-15T10:29:00Z',
    resolvedBy: null,
    resolvedAt: null,
    fallbackDelivered: false,
    deduplicationGroup: null,
    status: 'acted',
  },
  {
    // The review-queue item Priya claims before acting on it -- `claimed`
    // is distinct from `acknowledged`: claiming ownership of a queue item
    // is not itself the acknowledgement gate (§19.12 review-queue aging).
    id: 'NOTIF-BB-SEV1-REVIEW-CLAIM',
    tenantId: 'TEN-BRIGHTBIKES',
    eventId: null,
    severity: 'High',
    recipientRoleIds: ['QUALITY_MANAGER'],
    recipientUserIds: [PRIYA_QM],
    channels: ['in-app'],
    createdAt: '2026-08-15T08:05:00Z',
    sentAt: '2026-08-15T08:05:02Z',
    deliveredAt: '2026-08-15T08:05:10Z',
    openedAt: '2026-08-15T08:06:00Z',
    acknowledgedBy: null,
    acknowledgedAt: null,
    resolvedBy: null,
    resolvedAt: null,
    fallbackDelivered: false,
    deduplicationGroup: null,
    status: 'claimed',
  },
  {
    // The hold's closure, once released at 11:15:00Z -- a distinct
    // `resolved` record to Marco and Dana, not a state the alert row
    // itself advances to. Fix round 1 (review Important 4): `resolvedBy`/
    // `resolvedAt` are the required distinct evidence (L9175, [SoW Fact --
    // §3.9]) that this row is closed out, not merely acknowledged -- Marco
    // acknowledges receipt at 11:21, then separately marks the item
    // resolved on the alert feed at 11:25, a later and different act.
    id: 'NOTIF-BB-SEV1-RESOLVED',
    tenantId: 'TEN-BRIGHTBIKES',
    eventId: null,
    severity: 'High',
    recipientRoleIds: ['SUPERVISOR', 'TENANT_ADMIN'],
    recipientUserIds: [MARCO, DANA_ADMIN],
    channels: ['in-app', 'email'],
    createdAt: '2026-08-15T11:15:00Z',
    sentAt: '2026-08-15T11:15:03Z',
    deliveredAt: '2026-08-15T11:15:15Z',
    openedAt: '2026-08-15T11:20:00Z',
    acknowledgedBy: MARCO,
    acknowledgedAt: '2026-08-15T11:21:00Z',
    resolvedBy: MARCO,
    resolvedAt: '2026-08-15T11:25:00Z',
    fallbackDelivered: false,
    deduplicationGroup: null,
    status: 'resolved',
  },
  {
    // SB-SCHED-14 (L101941-L101962): the original Critical notification
    // that reached `escalated` -- delivered but unacknowledged past its
    // window, escalated automatically rather than repeated silently. Fix
    // round 1 (review Important 2): this pair's recipient is DELIBERATELY
    // unchanged, not an oversight -- L28416 (`NOTIF-DOH-08-2`) states this
    // exact case in the source's own table: "A Critical notification is
    // unacknowledged after 4 hours ... **The same audience on the same
    // channels** ... escalated, then re-delivered." The escalation here IS
    // the re-delivery itself, to the same Quality Manager, which is why
    // no target field changes. `NOTIF-BB-QUALWARN-0D-SUP`/`-ESCALATED`
    // below is the OTHER shape the source names -- a genuine recipient
    // retarget -- so both readings of "escalated" this vocabulary carries
    // are demonstrated, not just the one that happens to need no new field.
    id: 'NOTIF-BB-CRIT-ORIGINAL',
    tenantId: 'TEN-BRIGHTBIKES',
    eventId: null,
    severity: 'Critical',
    recipientRoleIds: ['QUALITY_MANAGER'],
    recipientUserIds: [PRIYA_QM],
    channels: ['in-app', 'email'],
    createdAt: '2026-08-12T14:00:00Z',
    sentAt: '2026-08-12T14:00:02Z',
    deliveredAt: '2026-08-12T14:00:10Z',
    openedAt: null,
    acknowledgedBy: null,
    acknowledgedAt: null,
    resolvedBy: null,
    resolvedAt: null,
    fallbackDelivered: false,
    deduplicationGroup: null,
    status: 'escalated',
  },
  {
    // The 4-hour re-notification, "a distinct record linked to the
    // original" (L101943) via `deduplicationGroup`, not the same row.
    id: 'NOTIF-BB-CRIT-RENOTIFY-R1',
    tenantId: 'TEN-BRIGHTBIKES',
    eventId: null,
    severity: 'Critical',
    recipientRoleIds: ['QUALITY_MANAGER'],
    recipientUserIds: [PRIYA_QM],
    channels: ['in-app', 'email'],
    createdAt: '2026-08-12T18:00:00Z',
    sentAt: '2026-08-12T18:00:02Z',
    deliveredAt: '2026-08-12T18:00:09Z',
    openedAt: null,
    acknowledgedBy: null,
    acknowledgedAt: null,
    resolvedBy: null,
    resolvedAt: null,
    fallbackDelivered: false,
    deduplicationGroup: 'crit-renotify:NOTIF-BB-CRIT-ORIGINAL',
    status: 'escalated',
  },
  {
    // Fix round 1 (review Important 2, the retargeting half): FUNC-DOH-04-
    // 2.2.2 (L27551) -- "Escalate an unacknowledged expiry notification to
    // the Quality Manager after the configurable window, default 2
    // minutes." QUAL-BB-16 (Ola Svendsen, WRK-BB-WKR-16, Paint Booth
    // Respirator Certification, AREA-BB-PAINT) expired 2026-08-10T08:00Z
    // (qualifications.json) -- the 0-day notice to Grace Adeyemi
    // (USR-BB-SUP-02, the Area's own Supervisor per QGR-BB-01's
    // `grantedBy`) goes unacknowledged for the 2-minute window, so this
    // row (Grace's own copy) never advances past `delivered`.
    id: 'NOTIF-BB-QUALWARN-0D-SUP',
    tenantId: 'TEN-BRIGHTBIKES',
    eventId: null,
    severity: 'High',
    recipientRoleIds: ['SUPERVISOR'],
    recipientUserIds: ['USR-BB-SUP-02'],
    channels: ['in-app', 'email'],
    createdAt: '2026-08-10T06:00:00Z',
    sentAt: '2026-08-10T06:00:02Z',
    deliveredAt: '2026-08-10T06:00:09Z',
    openedAt: null,
    acknowledgedBy: null,
    acknowledgedAt: null,
    resolvedBy: null,
    resolvedAt: null,
    fallbackDelivered: false,
    deduplicationGroup: 'qualwarn-0d:WRK-BB-WKR-16:QUAL-BB-16',
    status: 'delivered',
  },
  {
    // NOTIF-DOH-04-4 (L27581): "Expiry event unacknowledged for the
    // configurable window ... | Quality Manager, resolved on shift | ...
    // | created, eligible, queued, sent, delivered, escalated,
    // acknowledged." This is the ESCALATION TARGET's own row -- a
    // genuinely different `recipientRoleIds`/`recipientUserIds`
    // (QUALITY_MANAGER/Priya, not SUPERVISOR/Grace) than
    // `NOTIF-BB-QUALWARN-0D-SUP` above, linked by `deduplicationGroup`,
    // exactly the "carry the target in the data" fix the review asked
    // for: an escalation that changes who it went to, not just its label.
    id: 'NOTIF-BB-QUALWARN-0D-ESCALATED',
    tenantId: 'TEN-BRIGHTBIKES',
    eventId: null,
    severity: 'High',
    recipientRoleIds: ['QUALITY_MANAGER'],
    recipientUserIds: [PRIYA_QM],
    channels: ['in-app', 'email'],
    createdAt: '2026-08-10T06:02:00Z',
    sentAt: '2026-08-10T06:02:02Z',
    deliveredAt: '2026-08-10T06:02:08Z',
    // Reach stops at `delivered` here, matching this seed's own escalated
    // = "delivered, not yet opened/acknowledged" derivation used
    // everywhere else (`NOTIF_REACH` in the generator) -- L27581's
    // sequence lists `escalated` strictly before `acknowledged`, so this
    // row's own eventual acknowledgement would be a LATER, separate row.
    openedAt: null,
    acknowledgedBy: null,
    acknowledgedAt: null,
    resolvedBy: null,
    resolvedAt: null,
    fallbackDelivered: false,
    deduplicationGroup: 'qualwarn-0d:WRK-BB-WKR-16:QUAL-BB-16',
    status: 'escalated',
  },
  {
    // A second live invitation superseding a stale first one (L61397,
    // "the first moves to expired and only one live invitation exists")
    // -- read here as the dedup-suppressed `superseded` case: the first
    // invitation never reaches `sent` because the second one supersedes
    // it first.
    id: 'NOTIF-BB-INVITE-SUPERSEDED',
    tenantId: 'TEN-BRIGHTBIKES',
    eventId: null,
    severity: 'Informational',
    recipientRoleIds: ['TENANT_ADMIN'],
    recipientUserIds: [DANA_ADMIN],
    channels: ['email'],
    createdAt: '2026-07-20T09:00:00Z',
    sentAt: null,
    deliveredAt: null,
    openedAt: null,
    acknowledgedBy: null,
    acknowledgedAt: null,
    resolvedBy: null,
    resolvedAt: null,
    fallbackDelivered: false,
    deduplicationGroup: 'invite:USR-BB-ADMIN-02',
    status: 'superseded',
  },
]

// ===========================================================================
// commands — OBJ-082's own worked example (L9787): "the lot-release
// command created at 13:05:02, applied on two tablets within nine seconds
// and on TAB-014 at 13:44." `targetFleetTag` (not one device) is exactly
// what makes per-device deliveries the right shape (L9779: "children are
// the per-device delivery records"). A fourth device, DEV-BB-TAB-003, is a
// derived clarification not in the source's own sentence: it demonstrates
// brief pass criterion 2's own asymmetry ("applied on one tablet and
// pending on another") on this same command row, rather than only across
// separate rows.
// ===========================================================================
export const commands = [
  {
    id: 'CMD-BB-LOTRELEASE-01',
    tenantId: 'TEN-BRIGHTBIKES',
    class: 'lot-release',
    targetDeviceId: null,
    targetFleetTag: 'FLEET-BB-RIVERSIDE-ASSEMBLY',
    payloadRef: 'LOT-WB-2291',
    issuedBy: PRIYA_QM,
    createdAt: '2026-08-15T13:05:02Z',
    acknowledgedAt: null, // fleet-wide: no single acknowledgement instant applies; see per-device deliveries
    // Fix round 1 (review Important 3): the three devices below are now
    // literally `status: 'applied'`, matching OBJ-082's own words exactly
    // ("applied on two tablets within nine seconds and on TAB-014 at
    // 13:44") -- the source never claims acknowledgement, only
    // application, so `acknowledgedAt` on each stays null rather than
    // overstating the citation.
    deliveries: [
      { deviceId: 'DEV-BB-TAB-001', status: 'applied', deliveredAt: '2026-08-15T13:05:03Z', downloadedAt: '2026-08-15T13:05:04Z', appliedAt: '2026-08-15T13:05:09Z', acknowledgedAt: null, rejectedReason: null },
      { deviceId: 'DEV-BB-TAB-002', status: 'applied', deliveredAt: '2026-08-15T13:05:04Z', downloadedAt: '2026-08-15T13:05:05Z', appliedAt: '2026-08-15T13:05:11Z', acknowledgedAt: null, rejectedReason: null },
      { deviceId: TAB014, status: 'applied', deliveredAt: '2026-08-15T13:41:00Z', downloadedAt: '2026-08-15T13:43:10Z', appliedAt: '2026-08-15T13:44:00Z', acknowledgedAt: null, rejectedReason: null },
      // Still pending: delivered to the channel, not yet downloaded or
      // applied -- the device has not synced since the command was
      // issued (Derived Clarification, DEC-SYNC-001's own open question
      // about reconnect ordering).
      { deviceId: 'DEV-BB-TAB-003', status: 'delivered', deliveredAt: '2026-08-15T13:05:05Z', downloadedAt: null, appliedAt: null, acknowledgedAt: null, rejectedReason: null },
    ],
    status: 'applied',
  },
]

// ===========================================================================
// events — OBJ-083's own Bright Bikes example (L9799-L9805, "TAB-014
// records fourteen sync events across the shift, three of them failed
// attempts during the offline window, and the freshness marker shows the
// last successful one at 09:58") plus two operational events from the
// Severity 1 sequence (OBJ-024, L8207-L8222).
// ===========================================================================
const SYNC_BASE = '2026-08-15T06:00:00Z'
function* syncOffsets() {
  // Fourteen attempts across the shift, ending at the source's own
  // freshness mark: "the freshness marker shows the last successful one
  // at 09:58" (L9805) -- offset 238 is exactly 06:00 + 3:58 = 09:58. The
  // three offsets after it are real attempts (queue-draining continues)
  // but deliberately never marked a clean `complete` success, so nothing
  // here contradicts the source's own stated freshness mark. Offsets are
  // fixed literals, not drawn -- deterministic by construction. This is a
  // separate illustrative beat from the lot-release command's own 13:05-
  // 13:44 timing (OBJ-082's own example); the two are not forced onto one
  // shared timeline where the source does not link them.
  const offsets = [0, 25, 55, 90, 105, 130, 155, 178, 195, 220, 238, 265, 295, 330]
  for (const o of offsets) yield o
}
const FAIL_OFFSETS = new Set([105, 130, 155]) // the three failed attempts inside the offline window
const PARTIAL_OFFSETS = new Set([265, 295, 330]) // draining the queue after the freshness mark, not a new clean success
export const events = [
  ...[...syncOffsets()].map((offset, i) => ({
    id: `EVT-BB-TAB014-SYNC-${String(i + 1).padStart(2, '0')}`,
    kind: 'sync',
    deviceId: TAB014,
    attemptedAt: stamp(SYNC_BASE, offset),
    capturesUploaded: FAIL_OFFSETS.has(offset) ? 0 : i % 3 === 0 ? 2 : 1,
    commandsDownloaded: 0,
    commandsApplied: 0,
    queueDepthRemaining: FAIL_OFFSETS.has(offset) ? 2 : PARTIAL_OFFSETS.has(offset) ? 1 : 0,
    clockSkewSeconds: FAIL_OFFSETS.has(offset) ? null : 3,
    status: FAIL_OFFSETS.has(offset) ? 'failed' : PARTIAL_OFFSETS.has(offset) ? 'partial' : 'complete',
  })),
  {
    id: 'EVT-BB-SEV1-CAPTURE',
    kind: 'operational',
    tenantId: 'TEN-BRIGHTBIKES',
    actorId: ALICE_U,
    siteId: SITE_ID,
    areaId: AREA_ID,
    occurredAt: '2026-08-15T07:55:00Z',
    signalType: 'severity-1-deviation-detected',
    runId: 'RUN-BB-2026-0418-03',
    stepExecutionId: 'SE-BB-0418-03-05',
    status: 'accepted',
  },
  {
    id: 'EVT-BB-SEV1-HOLD',
    kind: 'operational',
    tenantId: 'TEN-BRIGHTBIKES',
    actorId: ALICE_U,
    siteId: SITE_ID,
    areaId: AREA_ID,
    occurredAt: '2026-08-15T07:55:05Z',
    signalType: 'automatic-hold-placed',
    runId: 'RUN-BB-2026-0418-03',
    stepExecutionId: 'SE-BB-0418-03-05',
    status: 'accepted',
  },
]

// ===========================================================================
// audit — a slice of the Bright Bikes Severity 1 audit chain (L9825:
// "the Bright Bikes audit chain runs from AUD-BB-000001 upward ... the 14
// August Severity 1 sequence occupies a contiguous block covering the
// capture, the hold, the containment completions, the escalation, the
// release request, and Elena's release") plus the four categories brief
// pass criterion 3 names by name: a denial, a fallback entry, a scoped
// support action, and a compliance-emergency access. The generator adds
// the remaining ~390+ rows programmatically from every other collection
// already in scope by the time this section runs.
// ===========================================================================
export const audit = [
  {
    id: 'AUD-BB-SEV1-001',
    tenantId: 'TEN-BRIGHTBIKES',
    actorId: ALICE_U,
    effectiveRole: 'WORKER',
    scope: { siteIds: [SITE_ID], areaIds: [AREA_ID] },
    action: 'capture.accepted',
    result: 'success',
    denialReason: null,
    subjectRef: 'SE-BB-0418-03-05',
    occurredAt: '2026-08-15T07:55:00Z',
    before: null,
    after: { inSpecification: false, severityBand: 1 },
    auditClass: 'data-capture',
    correlationId: 'COR-BB-SEV1-2026-08-15',
    causationId: null,
  },
  {
    id: 'AUD-BB-SEV1-002',
    tenantId: 'TEN-BRIGHTBIKES',
    actorId: ALICE_U,
    effectiveRole: 'WORKER',
    scope: { siteIds: [SITE_ID], areaIds: [AREA_ID] },
    action: 'hold.placed',
    result: 'success',
    denialReason: null,
    subjectRef: 'HOLD-BB-SEV1-01',
    occurredAt: '2026-08-15T07:55:05Z',
    before: null,
    after: { status: 'issued', targetKind: 'unit' },
    auditClass: 'run-state-transition',
    correlationId: 'COR-BB-SEV1-2026-08-15',
    causationId: 'AUD-BB-SEV1-001',
  },
  {
    id: 'AUD-BB-SEV1-003',
    tenantId: 'TEN-BRIGHTBIKES',
    actorId: ALICE_U,
    effectiveRole: 'WORKER',
    scope: { siteIds: [SITE_ID], areaIds: [AREA_ID] },
    action: 'containment-checklist.completed',
    result: 'success',
    denialReason: null,
    subjectRef: 'CHK-BB-FRAME-TORQUE-OOT',
    occurredAt: '2026-08-15T08:02:00Z',
    before: null,
    after: { completed: true },
    auditClass: 'run-state-transition',
    correlationId: 'COR-BB-SEV1-2026-08-15',
    causationId: 'AUD-BB-SEV1-002',
  },
  {
    id: 'AUD-BB-SEV1-004',
    tenantId: 'TEN-BRIGHTBIKES',
    actorId: 'USR-ROOT-01',
    effectiveRole: 'QUALITY_MANAGER',
    scope: { siteIds: [SITE_ID], areaIds: [AREA_ID] },
    action: 'notification.escalated',
    result: 'success',
    denialReason: null,
    subjectRef: 'NOTIF-BB-SEV1-ALERT',
    occurredAt: '2026-08-15T07:55:07Z',
    before: null,
    after: { severity: 'Critical' },
    auditClass: 'lane-b-auto-publish', // reusing the taxonomy's own "its own audit class" naming (L9817) for a distinctly-classed automatic system action
    correlationId: 'COR-BB-SEV1-2026-08-15',
    causationId: 'AUD-BB-SEV1-002',
  },
  {
    id: 'AUD-BB-SEV1-005',
    tenantId: 'TEN-BRIGHTBIKES',
    actorId: MARCO,
    effectiveRole: 'SUPERVISOR',
    scope: { siteIds: [SITE_ID], areaIds: [AREA_ID] },
    action: 'hold.release-requested',
    result: 'success',
    denialReason: null,
    subjectRef: 'HOLD-BB-SEV1-01',
    occurredAt: '2026-08-15T10:30:00Z',
    before: { status: 'in-force' },
    after: { status: 'release-requested' },
    auditClass: 'run-state-transition',
    correlationId: 'COR-BB-SEV1-2026-08-15',
    causationId: 'AUD-BB-SEV1-004',
  },
  {
    id: 'AUD-BB-SEV1-006',
    tenantId: 'TEN-BRIGHTBIKES',
    actorId: PRIYA_QM,
    effectiveRole: 'QUALITY_MANAGER',
    scope: { siteIds: [SITE_ID], areaIds: [AREA_ID] },
    action: 'hold.released',
    result: 'success',
    denialReason: null,
    subjectRef: 'HOLD-BB-SEV1-01',
    occurredAt: '2026-08-15T11:15:00Z',
    before: { status: 'release-requested' },
    after: { status: 'released' },
    auditClass: 'run-state-transition',
    correlationId: 'COR-BB-SEV1-2026-08-15',
    causationId: 'AUD-BB-SEV1-005',
  },
  // --- the four named categories -----------------------------------------
  {
    // A denial: Dana attempts a 96-hour offline trust window (L11787's
    // own worked example, "the platform rejects the value, states the
    // ceiling of 72 hours, and does not write it").
    id: 'AUD-BB-DENIAL-001',
    tenantId: 'TEN-BRIGHTBIKES',
    actorId: DANA_ADMIN,
    effectiveRole: 'TENANT_ADMIN',
    scope: { siteIds: [], areaIds: [] },
    action: 'tenant-settings.offline-trust-window.change',
    result: 'denied',
    denialReason: 'Requested value 96 hours exceeds the platform ceiling of 72 hours (L11787, L11845).',
    subjectRef: 'TEN-BRIGHTBIKES',
    occurredAt: '2026-08-11T10:12:00Z',
    before: { offlineTrustWindowHours: 24 },
    after: null,
    auditClass: 'configuration-change',
    correlationId: 'COR-BB-DENIAL-2026-08-11',
    causationId: null,
  },
  {
    // A fallback entry: the run auto-close scheduler misfire record
    // (L44433/`AC-SA-07-10-01`: "every platform scheduler records a
    // misfire with its window rather than skipping silently").
    id: 'AUD-BB-FALLBACK-001',
    tenantId: 'TEN-BRIGHTBIKES',
    actorId: 'USR-ROOT-01',
    effectiveRole: 'PLATFORM_ENGINEER',
    scope: { siteIds: [SITE_ID], areaIds: [] },
    action: 'schedule.occurrence.misfired',
    result: 'failed',
    denialReason: null,
    subjectRef: 'SCHEDOCC-BB-RUNFINISH-MISFIRE-01',
    occurredAt: '2026-08-09T14:06:00Z',
    before: null,
    after: { misfireWindow: 'SCHEDRUN-PM-0007' },
    auditClass: 'fallback-entry',
    correlationId: 'COR-BB-RUNFINISH-2026-08-09',
    causationId: null,
  },
  {
    // A scoped support action, mirrored from AS-0001 (access-sessions.json).
    id: 'AUD-BB-SUPPORT-001',
    tenantId: 'TEN-BRIGHTBIKES',
    actorId: 'USR-PLAT-SUP-01',
    effectiveRole: 'SUPPORT',
    scope: { siteIds: [], areaIds: [] },
    action: 'platform-access.support-session-opened',
    result: 'success',
    denialReason: null,
    subjectRef: 'AS-0001',
    occurredAt: '2026-08-16T08:30:00Z',
    before: null,
    after: { ticket: 'BB-4471', readOnly: true },
    auditClass: 'scoped-support-action',
    correlationId: 'COR-AS-0001',
    causationId: null,
  },
  {
    // A compliance-emergency access, mirrored from AS-0003 -- the only
    // path with write capability into tenant data (L6275). Its
    // effectiveRole is ROOT_SUPER_ADMIN: the account acts here (and is
    // itself audited, L8356) without ever appearing on a role-grants row
    // (see check-enum-coverage.mjs's own decision on that gap).
    id: 'AUD-MR-COMPLIANCE-001',
    tenantId: 'TEN-MERIDIAN',
    actorId: 'USR-ROOT-01',
    effectiveRole: 'ROOT_SUPER_ADMIN',
    scope: { siteIds: [], areaIds: [] },
    action: 'platform-access.compliance-emergency-opened',
    result: 'success',
    denialReason: null,
    subjectRef: 'AS-0003',
    occurredAt: '2026-08-07T10:00:00Z',
    before: null,
    after: { dualAuthorisedBy: 'USR-PLAT-ADM-01', readOnly: false },
    auditClass: 'compliance-emergency-access',
    correlationId: 'COR-AS-0003',
    causationId: null,
  },
  {
    // The Read-only Auditor's own audit-access action (OBJ-084 Audit
    // event, L9814: "the Read-only Auditor has the same read-only
    // access" as the Tenant Admin, over the full tenant log) -- also what gives `effectiveRole`
    // its READONLY_AUDITOR coverage; nothing else in this seed's audit
    // rows is authored by that role.
    id: 'AUD-BB-AUDITOR-001',
    tenantId: 'TEN-BRIGHTBIKES',
    actorId: 'USR-BB-AUD-01',
    effectiveRole: 'READONLY_AUDITOR',
    scope: { siteIds: [], areaIds: [] },
    action: 'audit.export',
    result: 'success',
    denialReason: null,
    subjectRef: 'TEN-BRIGHTBIKES',
    occurredAt: '2026-08-15T16:00:00Z',
    before: null,
    after: { format: 'csv', dateRange: '2026-08-01..2026-08-15' },
    auditClass: 'audit-access',
    correlationId: 'COR-BB-AUDITOR-2026-08-15',
    causationId: null,
  },
  {
    id: 'AUD-MR-COMPLIANCE-002',
    tenantId: 'TEN-MERIDIAN',
    actorId: 'USR-ROOT-01',
    effectiveRole: 'ROOT_SUPER_ADMIN',
    scope: { siteIds: [], areaIds: [] },
    action: 'platform-access.compliance-emergency-closed',
    result: 'success',
    denialReason: null,
    subjectRef: 'AS-0003',
    occurredAt: '2026-08-07T11:40:00Z',
    before: { closedAt: null },
    after: { closedAt: '2026-08-07T11:40:00Z' },
    auditClass: 'compliance-emergency-access',
    correlationId: 'COR-AS-0003',
    causationId: 'AUD-MR-COMPLIANCE-001',
  },
]

// ===========================================================================
// schedules — the seven master-prompt §19.2 (L1535, doc/process/master-
// prompt) end-to-end examples: qualification expiry, Run finish, platform
// maintenance, notification escalation, device offline-trust expiry,
// report delivery, and shift handoff. Each definition cites its own
// frozen-source storyboard by SB-SCHED id and line range.
// ===========================================================================
export const schedules = [
  // 1. Qualification expiry — SB-SCHED-01 (L101659-L101682), trigger
  // `SCHED-QUAL-WARN` (L101661: "a daily occurrence evaluating every
  // worker's qualification expiry dates against the fixed schedule").
  {
    id: 'SCHED-QUAL-WARN',
    kind: 'definition',
    workIdentity: 'qualification.expiry-warning',
    cadenceExpression: 'daily at 06:00 tenant-local',
    timezone: 'America/Chicago',
    misfirePolicy: 'catch-up-next-tick-mark-late',
    overlapPolicy: 'skip',
    retryPolicy: 'retry-3x-backoff',
    idempotencyKeyTemplate: 'tenant+worker+qualification+warning_step',
    blastRadiusBounds: 'tenant-wide',
    enabled: true,
    status: 'active',
  },
  {
    // Fix round 1 (review Important 5): the naive UTC=local conversion
    // this occurrence originally carried is now corrected -- 06:00
    // America/Chicago on 2026-08-14 is CDT (UTC-5) = 11:00Z, not 06:00Z.
    id: 'SCHEDOCC-BB-QUALWARN-14D',
    kind: 'occurrence',
    definitionId: 'SCHED-QUAL-WARN',
    dueAt: '2026-08-14T11:00:00Z',
    timezone: 'America/Chicago',
    idempotencyKey: 'TEN-BRIGHTBIKES+WRK-BB-WKR-02+QUAL-BB-02+14d',
    claimedBy: null,
    outcomeRef: 'NOTIF-BB-QUALWARN-14D',
    status: 'succeeded',
  },
  // 2. Run finish — SB-SCHED-08 (L101814-L101835), trigger
  // `SCHED-RUN-AUTOCLOSE`, and the misfire narrative at L70548
  // ("IDENT-SCHED-FIN misfires ... because the platform maintenance
  // window SCHEDRUN-PM-0007 was running ... re-drives ... finishes with
  // the 66-minute delay recorded"). Attached to a real generated `finished`
  // Run rather than the illustrative chapter's own 16 August timestamps,
  // which land after platform "now" (09:12Z that day) -- see
  // `generate-seed.mjs`'s Task 6 section for the id it fills in.
  {
    id: 'SCHED-RUN-AUTOCLOSE',
    kind: 'definition',
    workIdentity: 'run.finish-window-autoclose',
    cadenceExpression: 'continuous, fires per Run at complete + finish window (default 48h)',
    timezone: 'America/Chicago',
    misfirePolicy: 'durable-redrive-preserve-due-time',
    overlapPolicy: 'skip',
    retryPolicy: 'redrive-until-succeeded',
    idempotencyKeyTemplate: 'run+finish',
    blastRadiusBounds: 'single-run',
    enabled: true,
    status: 'active',
  },
  // 3. Platform maintenance — `SCHED-PLATMAINT-001` (L66412: "Platform
  // maintenance windows and the maintenance notices that announce
  // them ... operator-maintained calendar window"), the same window
  // (`SCHEDRUN-PM-0007`) that causes the run-autoclose misfire above.
  {
    id: 'SCHED-PLATMAINT-001',
    kind: 'definition',
    workIdentity: 'platform.maintenance-window',
    cadenceExpression: 'operator-scheduled, ad hoc',
    timezone: 'UTC',
    misfirePolicy: 'not-applicable-operator-maintained',
    overlapPolicy: 'queue',
    retryPolicy: 'none',
    idempotencyKeyTemplate: 'maintenance-window+date',
    blastRadiusBounds: 'all-tenants',
    enabled: true,
    status: 'active',
  },
  {
    id: 'SCHEDOCC-BB-PLATMAINT-0007',
    kind: 'occurrence',
    definitionId: 'SCHED-PLATMAINT-001',
    dueAt: '2026-08-09T13:00:00Z',
    timezone: 'UTC',
    idempotencyKey: 'maintenance-window+2026-08-09',
    claimedBy: 'USR-PLAT-ADM-01',
    outcomeRef: 'SCHEDRUN-PM-0007',
    status: 'succeeded',
  },
  // 4. Notification escalation — SB-SCHED-14 (L101941-L101962), trigger
  // `SCHED-CRIT-RENOTIFY` at 4 hours (L101943).
  {
    id: 'SCHED-CRIT-RENOTIFY',
    kind: 'definition',
    workIdentity: 'notification.critical-renotify',
    cadenceExpression: 'every 4 hours per unacknowledged Critical notification (1 hour in Regulated-Industry mode)',
    timezone: 'UTC',
    misfirePolicy: 'fire-once-on-recovery',
    overlapPolicy: 'skip',
    retryPolicy: 'none',
    idempotencyKeyTemplate: 'notification+renotify_round',
    blastRadiusBounds: 'single-notification',
    enabled: true,
    status: 'active',
  },
  {
    id: 'SCHEDOCC-BB-CRIT-RENOTIFY-R1',
    kind: 'occurrence',
    definitionId: 'SCHED-CRIT-RENOTIFY',
    dueAt: '2026-08-12T18:00:00Z',
    timezone: 'UTC',
    idempotencyKey: 'NOTIF-BB-CRIT-ORIGINAL+round1',
    claimedBy: null,
    outcomeRef: 'NOTIF-BB-CRIT-RENOTIFY-R1',
    status: 'succeeded',
  },
  // 5. Device offline-trust expiry — the offline trust window's own
  // device-local timer (L2085 "Offline --> TrustExpired : offline trust
  // window exceeded"; §7.10.5, L4521 "The offline trust window, forced
  // sync, and clearance expiry"; L9903 "a 24-hour offline trust window
  // against a 72-hour ceiling"). Modelled as a device-local scheduled work
  // class per master prompt §19.2's own "device-local timers" bucket
  // (L1535), distinct from a server-side cadence.
  {
    id: 'SCHED-DEVICE-TRUST-WINDOW',
    kind: 'definition',
    workIdentity: 'device.offline-trust-window-expiry',
    cadenceExpression: 'device-local timer, fires at tenant offline-trust-window elapsed (default 24h, ceiling 72h)',
    timezone: 'device-local',
    misfirePolicy: 'restrictive-resolution-on-uncertainty',
    overlapPolicy: 'not-applicable-per-device',
    retryPolicy: 'none',
    idempotencyKeyTemplate: 'device+trust_window_instant',
    blastRadiusBounds: 'single-device',
    enabled: true,
    status: 'active',
  },
  {
    id: 'SCHEDOCC-BB-DEVICETRUST-TAB003',
    kind: 'occurrence',
    definitionId: 'SCHED-DEVICE-TRUST-WINDOW',
    dueAt: '2026-08-14T13:05:05Z', // 24h after DEV-BB-TAB-003's last delivered command sync above
    timezone: 'device-local',
    idempotencyKey: 'DEV-BB-TAB-003+trust-window-2026-08-14',
    claimedBy: null,
    outcomeRef: null,
    status: 'succeeded',
  },
  // 6. Report delivery — SB-SCHED-26 (L102199-L102222), trigger
  // `SCHED-REPORT-DELIVERY` at the tenant's chosen time, default 06:00.
  {
    id: 'SCHED-REPORT-DELIVERY',
    kind: 'definition',
    workIdentity: 'report.scheduled-delivery',
    cadenceExpression: 'daily at 06:00 tenant-local',
    timezone: 'America/Chicago',
    misfirePolicy: 'catch-up-next-tick',
    overlapPolicy: 'skip',
    retryPolicy: 'retry-3x-backoff',
    idempotencyKeyTemplate: 'report+delivery_date',
    blastRadiusBounds: 'tenant-wide',
    enabled: true,
    status: 'active',
  },
  // 7. Shift handoff — SB-SCHED-11 (L101875-L101897), trigger
  // `SCHED-HANDOFF`, default 30 minutes before shift end.
  {
    id: 'SCHED-HANDOFF',
    kind: 'definition',
    workIdentity: 'shift.handoff-agent-run',
    cadenceExpression: '30 minutes before each Shift end',
    timezone: 'America/Chicago',
    misfirePolicy: 'late-marker-never-backdated',
    overlapPolicy: 'skip',
    retryPolicy: 'none',
    idempotencyKeyTemplate: 'shift+production_date',
    blastRadiusBounds: 'single-shift',
    enabled: true,
    status: 'active',
  },
  {
    id: 'SCHEDOCC-BB-HANDOFF-0815',
    kind: 'occurrence',
    definitionId: 'SCHED-HANDOFF',
    dueAt: '2026-08-15T18:30:00Z', // SHIFT-BB-DAY ends 14:00 America/Chicago (UTC-5, CDT) = 19:00Z; 30 min before = 18:30Z
    timezone: 'America/Chicago',
    idempotencyKey: 'SHIFT-BB-DAY+2026-08-15',
    claimedBy: MARCO,
    outcomeRef: 'AI-BB-HANDOFF-0815',
    status: 'succeeded',
  },
  // Daylight-saving boundary occurrence (master prompt §19.2, L1535:
  // "daylight-saving fold/gap rule"). America/Chicago springs forward on
  // 2026-03-08 at 02:00 local (clocks jump to 03:00) -- SCHED-QUAL-WARN's
  // daily 06:00 local tick is unaffected in wall-clock terms, but its
  // instant-in-UTC shifts from UTC-6 (CST, 12:00Z) to UTC-5 (CDT, 11:00Z)
  // on this exact day, which is the fold/gap boundary case a naive
  // fixed-UTC-offset scheduler gets wrong. Dated safely before platform
  // "now" (2026-08-16T09:12Z).
  {
    id: 'SCHEDOCC-BB-QUALWARN-DST-SPRINGFORWARD',
    kind: 'occurrence',
    definitionId: 'SCHED-QUAL-WARN',
    dueAt: '2026-03-08T11:00:00Z', // 06:00 America/Chicago resolved correctly to CDT (UTC-5), not the prior day's CST (UTC-6) offset
    timezone: 'America/Chicago',
    idempotencyKey: 'TEN-BRIGHTBIKES+daily+2026-03-08+dst-spring-forward',
    claimedBy: null,
    outcomeRef: null,
    status: 'reconciled',
  },
]

// ===========================================================================
// ai-requests — OBJ-077 (L9600-L9615). The Shift Handoff Agent's own run
// (SB-SCHED-11, L101875: "a reasoning agent ... it produces an artifact,
// it changes no state") plus master prompt §18.5's named failure modes:
// a provider failover and a semantic-cache hit.
// ===========================================================================
export const aiRequests = [
  {
    id: 'AI-BB-HANDOFF-0815',
    tenantId: 'TEN-BRIGHTBIKES',
    routerRole: 'primary',
    promptTokens: 2840,
    completionTokens: 610,
    latencyMs: 4200,
    deterministic: false,
    semanticCacheHit: false,
    createdAt: '2026-08-15T18:30:00Z',
    status: 'completed',
  },
  {
    // §18.5's "provider/endpoint down" failure: the primary router fails
    // over to the fallback router mid-request.
    id: 'AI-BB-FAILOVER-001',
    tenantId: 'TEN-BRIGHTBIKES',
    routerRole: 'fallback',
    promptTokens: 1120,
    completionTokens: 0,
    latencyMs: 9800,
    deterministic: false,
    semanticCacheHit: false,
    createdAt: '2026-08-13T11:02:00Z',
    status: 'failed-over',
  },
  {
    // A semantic-cache hit on the lightweight router (classification-shaped work).
    id: 'AI-BB-CLASSIFY-CACHED',
    tenantId: 'TEN-BRIGHTBIKES',
    routerRole: 'lightweight',
    promptTokens: 340,
    completionTokens: 40,
    latencyMs: 85,
    deterministic: true,
    semanticCacheHit: true,
    createdAt: '2026-08-15T09:41:15Z',
    status: 'cached',
  },
]
