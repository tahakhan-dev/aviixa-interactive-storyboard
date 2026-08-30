// Task 5 hand-authored fixtures — the recurring cast's own Delivery
// Operations Hub rows.
//
// Per controller ruling R10 (docs/superpowers/plans/2026-08-26-runway.md,
// "Seed authoring method"), `JOB-BB-2026-0418`, `RUN-BB-2026-0418-03` and
// its full execution hierarchy, and `DEV-BB-SEV1-01` with its hold, are
// written by hand rather than generated, because they are the story
// Task 15's guided tours will narrate. `scripts/generate-seed.mjs` imports
// this module and emits every row here verbatim, then fills the
// surrounding run/job population around it.
//
// The 8-unit x 8-step execution grid below is written as one small,
// deterministic, argument-free-`Date`-free loop rather than 62 independent
// object literals -- ponytail's own rule applies to hand-authored fixtures
// too: the STORY (which unit, which step, which reading, which deviation)
// is fully authored below; the mechanical repetition of computing 62
// step/capture rows from it is not something a human should transcribe by
// hand without introducing exactly the transcription defects R10 warns
// about. No `Math.random()`, no `Date.now()` -- `stamp()` only ever adds a
// fixed integer offset to a fixed literal base.
//
// --- The story, cited -----------------------------------------------
// Workflow: WFD-BB-FRAME-ASSY v1.1.0 (task4-studio.mjs), eight published
// screens WI-BB-FRAME-01..08, all eight with a capture-producing input
// type (barcode, measurement x2, ok-not-ok x3, photo, text) -- so every
// step in this run defines a capture (brief pass criterion 2).
// Package: PKG-BB-FRAME-ASSY-1.1.0, acknowledged 2026-08-15T05:52:00Z
// (task4-studio.mjs) -- the run below starts only after that, and stays
// entirely inside 2026-08-15, well before platform "now" 2026-08-16T09:12Z.
//
// Severity classification (blueprint L7385-L7392, the Severity table under
// OBJ-052/OBJ-053's numbered workflow at L3789, and the authored-banding
// example at L1766/L1341: "0 to 10 per cent outside the limits maps to
// Severity 2 and beyond 10 per cent maps to Severity 1"):
//   - Chainring spec SPEC-BB-CHAINRING is 12.0-14.0 N*m (task4-studio.mjs).
//     A 10.0 N*m reading is (12.0-10.0)/12.0 = 16.7% below the lower limit,
//     beyond the 10% boundary -> Severity 1. Per the fixed platform floor
//     (L7388 row 1: "Automatic lot freeze plus escalation, platform-fixed
//     floor ... Quality Manager only, uniformly ... Critical, auto-entered
//     with the containment record attached"), this places an immediate
//     on-device hold and launches the pinned containment checklist
//     (WI-BB-FRAME-05's own `containmentChecklistId`,
//     `CHK-BB-FRAME-TORQUE-OOT`). This is `DEV-BB-SEV1-01` /
//     `HOLD-BB-SEV1-01`.
//   - Seat-clamp spec SPEC-BB-SEATCLAMP is 6.0-8.0 N*m. A 5.5 N*m reading
//     is (6.0-5.5)/6.0 = 8.3% below the lower limit, at or under the 10%
//     boundary -> Severity 2. Per L7389 row 2, Severity 2 gets "the
//     tenant's configured action bundle above the floor; escalation and
//     email in the source's example" and explicitly "Not applicable -- no
//     automatic hold is placed at this level" -- so, deliberately unlike
//     the Severity 1 row above, this deviation carries no
//     `containmentChecklistId` and produces no Hold row at all. This is
//     the "do not rank a state family and infer behaviour from the
//     ranking" trap named in the task prompt: Severity 2 is not "a weaker
//     Severity 1", it is a materially different, non-hold-bearing branch.
//     This is `DEV-BB-SEV2-01`.
//   - WI-BB-FRAME-07 (record cable housing lengths, max 90 seconds) runs
//     145 seconds on unit 7 -- a time-triggered, not a specification
//     deviation. Per L7390 ("Severity 3 and informational | Log and
//     include in the Execution Summary ... | Not applicable -- no
//     automatic hold is placed at this level | Info"), this is logged only:
//     no checklist, no hold, no escalation routing. This is
//     `DEV-BB-SEV3-01`.

const RUN_ID = 'RUN-BB-2026-0418-03'
const JOB_ID = 'JOB-BB-2026-0418'
const WFD_ID = 'WFD-BB-FRAME-ASSY'
const WFD_VERSION = '1.1.0'
const PACKAGE_ID = 'PKG-BB-FRAME-ASSY-1.1.0'
const DEVICE_ID = 'DEV-BB-TAB-014'
const SITE_ID = 'SITE-BB-RIVERSIDE'
const AREA_ID = 'AREA-BB-ASSEMBLY'
const SHIFT_ID = 'SHIFT-BB-DAY'
const LOCATION_ID = 'LOC-BB-WHEEL-2'
const ALICE = 'WRK-BB-WKR-01' // USR-BB-WKR-01, Alice Okonkwo
const BEN = 'WRK-BB-WKR-02' // USR-BB-WKR-02, Ben Castellanos

const RUN_BASE = '2026-08-15T06:05:00Z' // after the 1.1.0 package's 05:52Z acknowledgement

function stamp(minuteOffset) {
  return new Date(new Date(RUN_BASE).getTime() + minuteOffset * 60000).toISOString()
}

export const jobs = [
  // Legacy-compat: `PKG-0001` (task4-studio.mjs) carries `runId: 'RUN-0001'`
  // and is validated by RELATIONS (`packages.runId -> runs`). Task 5 owns
  // `jobs.json`/`runs.json` now, so — the same pattern task4-studio.mjs
  // itself uses for `WF-TORQUE-001`/`WI-0001` — this keeps `JOB-0001` and
  // `RUN-0001` alive as real, valid rows carrying their original Task-1
  // content, rather than deleting an id a file this task does not own
  // still points at.
  {
    id: 'JOB-0001',
    tenantId: 'TEN-BRIGHTBIKES',
    name: 'Frame assembly — Line 1',
    jobTypeId: 'JT-ASSEMBLY',
    serviceTypeTagId: null,
    siteId: SITE_ID,
    areaId: AREA_ID,
    shiftId: SHIFT_ID,
    workflowDefinitionId: 'WF-TORQUE-001',
    plannedQuantity: 120,
    qualificationRequirementIds: ['QUAL-BB-01'],
    recurrencePattern: null,
    unitMode: 'serialized',
    ownerUserId: 'USR-BB-WKR-01', // matches the Task-1 placeholder's original ownerUserId
    linkedJobId: null,
    status: 'active',
  },
  {
    id: JOB_ID,
    tenantId: 'TEN-BRIGHTBIKES',
    name: 'Frame Assembly — Main Triangle Build (Line A, Day Shift)',
    jobTypeId: 'JT-BB-ASSEMBLY',
    serviceTypeTagId: null,
    siteId: SITE_ID,
    areaId: AREA_ID,
    shiftId: SHIFT_ID,
    workflowDefinitionId: WFD_ID,
    plannedQuantity: 40,
    qualificationRequirementIds: ['QUAL-BB-01', 'QUAL-BB-14', 'QUAL-BB-19B'],
    recurrencePattern: 'every scheduled Day Shift',
    unitMode: 'serialized',
    ownerUserId: 'USR-BB-SUP-01', // Marco Ellis, Supervisor — Job Owner (OBJ-013: a field, confers no permission)
    linkedJobId: null,
    status: 'active',
  },
]

export const runs = [
  // Legacy-compat: see the comment on `JOB-0001` above.
  {
    id: 'RUN-0001',
    tenantId: 'TEN-BRIGHTBIKES',
    siteId: SITE_ID,
    areaId: AREA_ID,
    shiftId: SHIFT_ID,
    jobId: 'JOB-0001',
    source: 'manual',
    packageId: 'PKG-0001',
    plannedStartAt: '2026-03-02T06:00:00Z',
    plannedEndAt: '2026-03-02T14:00:00Z',
    actualStartAt: '2026-03-02T06:00:00Z',
    actualEndAt: null,
    productionDate: '2026-03-02',
    cancellationReason: null,
    linkedRunId: null,
    status: 'in-progress',
  },
  {
    id: RUN_ID,
    tenantId: 'TEN-BRIGHTBIKES',
    siteId: SITE_ID,
    areaId: AREA_ID,
    shiftId: SHIFT_ID,
    jobId: JOB_ID,
    source: 'manual',
    packageId: PACKAGE_ID,
    plannedStartAt: '2026-08-15T06:00:00Z',
    plannedEndAt: '2026-08-15T14:00:00Z',
    actualStartAt: RUN_BASE,
    actualEndAt: null,
    productionDate: '2026-08-15',
    cancellationReason: null,
    linkedRunId: null,
    // In progress on purpose: brief criterion "at least one active Run
    // still pinned to 1.1.0 after 2.0.0 exists as a draft" (AC-PKG-006 --
    // a published version never rebases an in-flight run). WFD-BB-FRAME-
    // ASSY-2.0.0 already exists as a draft (task4-studio.mjs); this run
    // stays pinned to `packageId: PKG-BB-FRAME-ASSY-1.1.0` regardless.
    status: 'in-progress',
  },
]

// --- The 8-unit x 8-step (or 6-step for the abandoned unit) grid --------
// WFD-BB-FRAME-ASSY-1.1.0's eight screens, in order, with their input
// type (task4-studio.mjs).
const SCREENS = [
  { wi: 'WI-BB-FRAME-01', type: 'barcode' },
  { wi: 'WI-BB-FRAME-02', type: 'measurement', specLow: 6.0, specHigh: 8.0, unit: 'N·m' },
  { wi: 'WI-BB-FRAME-03', type: 'ok-not-ok' },
  { wi: 'WI-BB-FRAME-04', type: 'ok-not-ok' },
  { wi: 'WI-BB-FRAME-05', type: 'measurement', specLow: 12.0, specHigh: 14.0, unit: 'N·m', containmentChecklistId: 'CHK-BB-FRAME-TORQUE-OOT' },
  { wi: 'WI-BB-FRAME-06', type: 'photo' },
  { wi: 'WI-BB-FRAME-07', type: 'text', maxDurationSeconds: 90 },
  { wi: 'WI-BB-FRAME-08', type: 'ok-not-ok' },
]

const UNIT_COUNT = 8
const unitExecutions = []
const stepExecutions = []
const captures = []
const evidence = []

for (let u = 0; u < UNIT_COUNT; u++) {
  const unitId = `UE-BB-0418-${String(u + 1).padStart(2, '0')}`
  const serial = `FRM-0418-${String(u + 1).padStart(2, '0')}`
  const worker = u % 2 === 0 ? ALICE : BEN
  const unitStartOffset = u * 45 // minutes
  const isAbandonedUnit = u === 7 // the 8th unit: interrupted mid-photo-step
  const stepsThisUnit = isAbandonedUnit ? 6 : 8 // still >= 6 for every unit
  const synced = u < 6 // units 0-5 have synced; 6 (Sev-3) and 7 (abandoned) have not yet

  for (let s = 0; s < stepsThisUnit; s++) {
    const screen = SCREENS[s]
    const stepId = `SE-BB-0418-${String(u + 1).padStart(2, '0')}-${String(s + 1).padStart(2, '0')}`
    // Fix round 2, Important 4: DEV-BB-SEQ-01's prose said screen 3 was
    // recorded before screen 2 completed, but the rows disagreed -- every
    // step below carried strictly increasing `deviceTime`. Constructed the
    // violation IN THE DATA instead of asserting it beside clean rows: on
    // unit 6 only, screen 3 (WI-BB-FRAME-03, authored order 3) is swapped
    // to record two minutes BEFORE screen 2 (WI-BB-FRAME-02, authored
    // order 2) -- the one deliberate break, nowhere else. Both swapped
    // offsets stay strictly positive (this unit's own `openedAt` is still
    // earlier than either), so "no step before its unit" is untouched --
    // a sequence violation is about the AUTHORED SCREEN ORDER, not about a
    // child record escaping its parent's time window, and the two must
    // not be conflated (re-verified below, both invariants checked
    // separately).
    let stepOffsetMinutes = s * 5
    if (u === 5 && s === 2) stepOffsetMinutes = 1 * 5 - 2 // screen 3: 2 minutes before screen 2
    else if (u === 5 && s === 1) stepOffsetMinutes = 1 * 5 // screen 2: unchanged
    const deviceTime = stamp(unitStartOffset + stepOffsetMinutes)
    const serverReceiptTime = synced ? stamp(unitStartOffset + stepOffsetMinutes + 30) : null
    const isAbandonedStep = isAbandonedUnit && s === stepsThisUnit - 1
    // Fix round 1, Important 3: append-only correction had zero rows
    // anywhere in the seed. Unit 1's cable-housing text step (WI-BB-FRAME-07)
    // is the one this run demonstrates it on: the original capture stays
    // exactly as committed (immutable at commit, per the source's own
    // "append, never overwrite" principle), and a second, later capture is
    // appended below with `correctedFromCaptureId` chaining back to it.
    const isCorrectionStep = u === 0 && s === 6

    let value, inSpecification, severityBand = null, gateOutcome = 'passed'
    let captureType = screen.type
    let capStatus // capture ladder state
    if (synced) {
      capStatus = u === 5 ? 'validated' : u <= 3 ? 'officially-recorded' : 'reflected-in-summaries'
    } else {
      capStatus = isAbandonedStep ? 'upload-interrupted' : 'queued'
    }

    if (screen.type === 'barcode') {
      value = serial
      inSpecification = null
    } else if (screen.type === 'measurement') {
      // The two deliberate out-of-spec readings driving DEV-BB-SEV1-01 and
      // DEV-BB-SEV2-01 (see the module doc comment for the arithmetic).
      if (u === 2 && s === 4) {
        value = 10.0
        inSpecification = false
        severityBand = 1
        gateOutcome = 'failed'
        capStatus = 'accepted' // a valid, fully-processed record of an out-of-spec reading
      } else if (u === 4 && s === 1) {
        value = 5.5
        inSpecification = false
        severityBand = 2
        gateOutcome = 'failed'
        capStatus = 'validated'
      } else {
        value = screen.wi === 'WI-BB-FRAME-02' ? 7.0 : 13.0
        inSpecification = true
      }
    } else if (screen.type === 'ok-not-ok') {
      value = true
      inSpecification = true
    } else if (screen.type === 'photo') {
      value = `evidence/2026-08-15/${stepId}.jpg`
      inSpecification = null
    } else if (screen.type === 'text') {
      value = '612mm front housing, 578mm rear housing'
      inSpecification = null
      // The time-triggered Severity 3, unit 7 (index 6).
      if (u === 6 && s === 6) severityBand = 3
    }

    stepExecutions.push({
      id: stepId,
      runId: RUN_ID,
      unitExecutionId: unitId,
      workflowDefinitionId: WFD_ID,
      pinnedVersion: WFD_VERSION,
      workInstructionId: screen.wi,
      workerId: worker,
      deviceId: DEVICE_ID,
      siteId: SITE_ID,
      areaId: AREA_ID,
      locationId: LOCATION_ID,
      deviceTime,
      serverReceiptTime,
      gateOutcome,
      inSpecification,
      severityBand,
      status: isAbandonedStep ? 'abandoned' : isCorrectionStep ? 'corrected-by-appended-record' : 'completed',
    })

    const captureId = `CAP-BB-0418-${String(u + 1).padStart(2, '0')}-${String(s + 1).padStart(2, '0')}`
    const evidenceIds = []
    if (screen.type === 'photo') {
      const evId = `EVD-BB-0418-${String(u + 1).padStart(2, '0')}`
      evidence.push({
        id: evId,
        stepExecutionId: stepId,
        unitExecutionId: unitId,
        workerId: worker,
        deviceId: DEVICE_ID,
        mediaType: 'photo',
        deviceTime,
        serverReceiptTime,
        storageRef: value,
        reviewedBy: u % 3 === 0 ? 'USR-BB-QM-01' : null,
        // Cycle the five Evidence states (OBJ-019, L8112-L8129) across the
        // eight photo captures so this run alone exercises the whole ladder.
        status: ['captured', 'queued', 'uploaded', 'accepted', 'reviewed'][u % 5],
      })
      evidenceIds.push(evId)
    }

    captures.push({
      id: captureId,
      stepExecutionId: stepId,
      runId: RUN_ID,
      jobId: JOB_ID,
      captureType,
      value,
      unitOrLot: { kind: 'unit', id: serial },
      workerId: worker,
      authorisingWorkerId: null,
      deviceId: DEVICE_ID,
      locationResolved: true,
      siteId: SITE_ID,
      areaId: AREA_ID,
      locationId: LOCATION_ID,
      unresolvedLocationNote: null,
      deviceTime,
      serverReceiptTime,
      inSpecification,
      severityBand,
      evidenceIds,
      lateArrival: false,
      correctedFromCaptureId: null,
      status: capStatus,
    })
  }

  unitExecutions.push({
    id: unitId,
    runId: RUN_ID,
    unitOrSerialRef: serial,
    workerId: worker,
    deviceId: DEVICE_ID,
    openedAt: stamp(unitStartOffset),
    closedAt: isAbandonedUnit
      ? stamp(unitStartOffset + (stepsThisUnit - 1) * 5 + 3)
      : u < 6
        ? stamp(unitStartOffset + 7 * 5 + 5)
        : null,
    status: isAbandonedUnit ? 'abandoned' : u < 6 ? 'complete' : 'open',
  })
}

// The appended correction itself. `CAP-BB-0418-01-07` (unit 1's original
// cable-housing-length capture, above) stays untouched; this is the linked
// correction record, timestamped well after the original's own sync so the
// "correction happens later" ordering holds by construction.
captures.push({
  id: 'CAP-BB-0418-01-07-CORR',
  stepExecutionId: 'SE-BB-0418-01-07',
  runId: RUN_ID,
  jobId: JOB_ID,
  captureType: 'text',
  value: '618mm front housing, 582mm rear housing (corrected — original measurement mis-recorded)',
  unitOrLot: { kind: 'unit', id: 'FRM-0418-01' },
  workerId: ALICE,
  authorisingWorkerId: BEN, // a second worker's sign-off on the appended correction
  deviceId: DEVICE_ID,
  locationResolved: true,
  siteId: SITE_ID,
  areaId: AREA_ID,
  locationId: LOCATION_ID,
  unresolvedLocationNote: null,
  deviceTime: stamp(150), // well after the original's own 06:35/07:05 capture+sync
  serverReceiptTime: stamp(180),
  inSpecification: null,
  severityBand: null,
  evidenceIds: [],
  lateArrival: false,
  correctedFromCaptureId: 'CAP-BB-0418-01-07',
  status: 'officially-recorded',
})

export { unitExecutions, stepExecutions, captures, evidence }

// --- The three deviations, and the one Severity-1 hold -------------------
export const deviations = [
  {
    id: 'DEV-BB-SEV1-01',
    tenantId: 'TEN-BRIGHTBIKES',
    triggerMechanism: 'specification-and-evidence',
    stepExecutionId: 'SE-BB-0418-03-05',
    workerId: ALICE,
    runId: RUN_ID,
    lotOrUnitRef: 'FRM-0418-03',
    workflowVersion: WFD_VERSION,
    severityBand: 1,
    agentInterpretation:
      'Chainring bolt torque reading of 10.0 N·m is 16.7% below the 12.0 N·m lower '
      + 'specification limit, beyond the authored 10% Severity 1 threshold. Automatic lot '
      + 'freeze and escalation applied per the platform-fixed Severity 1 floor.',
    containmentChecklistId: 'CHK-BB-FRAME-TORQUE-OOT',
    escalationRoutingState: 'escalated-to-quality-manager',
    hasEvidenceGaps: false,
    status: 'resolved',
  },
  {
    id: 'DEV-BB-SEV2-01',
    tenantId: 'TEN-BRIGHTBIKES',
    triggerMechanism: 'specification-and-evidence',
    stepExecutionId: 'SE-BB-0418-05-02',
    workerId: ALICE,
    runId: RUN_ID,
    lotOrUnitRef: 'FRM-0418-05',
    workflowVersion: WFD_VERSION,
    severityBand: 2,
    agentInterpretation:
      'Seat post clamp torque reading of 5.5 N·m is 8.3% below the 6.0 N·m lower '
      + 'specification limit, within the 10% Severity 2 band. Tenant action bundle above the '
      + 'floor applied (escalation and email); no automatic hold — Severity 2 places no hold '
      + 'at this level (blueprint L7390).',
    // Deliberately null, unlike DEV-BB-SEV1-01 above: only Severity 1 auto-launches a
    // containment checklist. Folding Severity 2 onto the same behaviour by "it's close to
    // Severity 1" is exactly the ranking-inference trap the task brief warns against.
    containmentChecklistId: null,
    escalationRoutingState: 'escalated-to-supervisor-and-quality-manager',
    hasEvidenceGaps: false,
    status: 'dispositioned',
  },
  {
    id: 'DEV-BB-SEV3-01',
    tenantId: 'TEN-BRIGHTBIKES',
    triggerMechanism: 'time',
    stepExecutionId: 'SE-BB-0418-07-07',
    workerId: BEN,
    runId: RUN_ID,
    lotOrUnitRef: 'FRM-0418-07',
    workflowVersion: WFD_VERSION,
    severityBand: 3,
    agentInterpretation:
      'Cable housing length recording ran 145 seconds against an authored maximum of 90 '
      + 'seconds. Severity 3 and informational: logged for inclusion in the Execution Summary '
      + 'only — no automatic hold or escalation is placed at this level (blueprint L7390).',
    containmentChecklistId: null,
    escalationRoutingState: null,
    hasEvidenceGaps: false,
    status: 'resolved',
  },
  // Fix round 1, Important 4: `triggerMechanism: 'sequence'` had zero rows
  // anywhere in the seed, though the source names it as one of three
  // deterministic detection mechanisms in the same breath as `time` and
  // `specification-and-evidence` (§5.2.2). A genuine sequence violation —
  // a screen reached out of its authored order — is a different thing
  // from a reading outside limits, so this is written as one: on unit 6,
  // WI-BB-FRAME-03 (head tube bearing race fit-up) was recorded before
  // WI-BB-FRAME-02 (seat post clamp torque) had a completed record for
  // this unit, violating the authored screen order 01 -> 02 -> 03 -> ...
  // Fix round 2: the underlying SE-BB-0418-06-02/-03 rows now genuinely
  // carry that order (see the `stepOffsetMinutes` override above) -- this
  // deviation is derivable from the rows, not a narrative beside clean data.
  {
    id: 'DEV-BB-SEQ-01',
    tenantId: 'TEN-BRIGHTBIKES',
    triggerMechanism: 'sequence',
    stepExecutionId: 'SE-BB-0418-06-03',
    workerId: BEN,
    runId: RUN_ID,
    lotOrUnitRef: 'FRM-0418-06',
    workflowVersion: WFD_VERSION,
    severityBand: 2,
    agentInterpretation:
      'Screen 3 (head tube bearing race fit-up) was recorded before screen 2 (seat post '
      + 'clamp torque) had a completed Step Execution on this unit — a violation of the '
      + 'authored screen order, detected deterministically on device, not a reading outside '
      + 'a specification limit.',
    containmentChecklistId: null,
    escalationRoutingState: 'escalated',
    hasEvidenceGaps: false,
    status: 'contained',
  },
]

export const holds = [
  {
    id: 'HOLD-BB-SEV1-01',
    targetKind: 'unit',
    targetId: 'FRM-0418-03',
    originatingDeviationId: 'DEV-BB-SEV1-01',
    placedAt: stamp(2 * 45 + 4 * 5), // the instant of the SE-BB-0418-03-05 capture
    placedByDeviceId: DEVICE_ID,
    releaseRequestedAt: stamp(2 * 45 + 4 * 5 + 155), // Marco requests release, ~2h35m later
    releaseRequestNote:
      'Requesting release — rework not viable on this unit; escalating disposition to Quality Manager.',
    releasedBy: 'USR-BB-QM-01', // Priya Raghunathan, Quality Manager — the only role that may release
    releasedAt: stamp(2 * 45 + 4 * 5 + 200), // Priya releases ~3h20m after placement
    status: 'released',
  },
]
