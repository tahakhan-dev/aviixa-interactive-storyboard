// Task 4 hand-authored fixtures — the recurring cast's own Studio rows.
//
// Per controller ruling R10 (docs/superpowers/plans/2026-08-26-runway.md,
// "Seed authoring method"), `WFD-BB-FRAME-ASSY` and its nine-section
// screens are written by hand, not generated, because their content is the
// story Task 15's guided tours will narrate. `scripts/generate-seed.mjs`
// imports this module and emits every row here verbatim, then fills the
// surrounding population around it.
//
// This module also carries three Task-1 placeholder rows this task must
// preserve BYTE-FOR-ID (not byte-for-content) because other, not-yet-
// replaced placeholder collections point at them by id:
//   - `WF-TORQUE-001` (workflow-definitions) — referenced by
//     jobs.json (workflowDefinitionId), tours.json (workflowId),
//     step-executions.json (workflowDefinitionId).
//   - `WI-0001` (work-instructions) — referenced by
//     step-executions.json (workInstructionId).
//   - `PKG-0001` (packages) — referenced by devices.json
//     (pinnedPackageIds) and runs.json (packageId).
// Tasks 2 and 3 established this exact pattern (task-3-report.md, "Edited
// ... one-line dangling-reference repairs"): keep the id alive as a real,
// valid row rather than renaming it out from under a file this task does
// not own. Rather than leaving these as thin placeholders, they are
// rewritten here as the genuine Bright Bikes canonical example the frozen
// blueprint itself uses for OBJ-036/OBJ-038 — "Assembly — Wheel Bolt
// Torque Verification", screen 4, 44-47 N·m against `DWG-A441`
// (blueprint L1766, L8604, L11251) — so the legacy ids now carry real,
// citable content instead of throwaway placeholder text.
//
// WorkInstruction has no dedicated instruction-body field (see
// src/data/schemas/studio.ts OBJ-038 comment and L8633: the nine sections
// are "screen content with optional reference image; input type; timing;
// gate and proof; specification limits; coaching content; deviation rules
// and severity mapping; tool and equipment; qualification override" — no
// separate prose field). `title` is the only free-text field Section 1
// ("Screen Content", L4150) has to carry, so every `title` below is written
// as the complete, usable-on-the-floor instruction sentence itself, not a
// short label — that is a deliberate reading of the schema, not an
// oversight, and it is called out in the task report.

export const workflowDefinitions = [
  // Legacy-compat: the frozen source's own canonical Bright Bikes example
  // (OBJ-036 Bright Bikes example, L8604; storyboard L1766; interface
  // storyboard L11251).
  {
    id: 'WF-TORQUE-001',
    tenantId: 'TEN-BRIGHTBIKES',
    name: 'Assembly — Wheel Bolt Torque Verification',
    jobTypeId: 'JT-ASSEMBLY',
    serviceTypeTagId: null,
    localeCoverage: ['en', 'es'],
    defaultEscalationRoutingTemplateId: 'ESC-BB-TORQUE-SEV',
    defaultCoachingTriggerPercentage: 20,
    workInstructionIds: ['WI-0001'],
    qualificationBaselineIds: ['QUAL-BB-01', 'QUAL-BB-14'],
    version: '1.0.0',
    bumpClassification: 'major',
    republishDescription: null,
    laneBRoute: false,
    status: 'published',
  },

  // --- WFD-BB-FRAME-ASSY family: the recurring exemplar -------------------
  // v1.0.0 — original publish, now outdated (superseded by the 1.1.0
  // notified-class successor once its update window elapsed;
  // §7.3.3 state diagram, L7223-7259: Published --> Outdated).
  {
    id: 'WFD-BB-FRAME-ASSY-1.0.0',
    tenantId: 'TEN-BRIGHTBIKES',
    name: 'Frame Assembly — Main Triangle Build',
    jobTypeId: 'JT-ASSEMBLY',
    serviceTypeTagId: null,
    localeCoverage: ['en', 'es'],
    defaultEscalationRoutingTemplateId: 'ESC-BB-FRAME-SEV',
    defaultCoachingTriggerPercentage: 25,
    workInstructionIds: [
      'WI-BB-FRAME-1.0-01', 'WI-BB-FRAME-1.0-02', 'WI-BB-FRAME-1.0-03',
      'WI-BB-FRAME-1.0-04', 'WI-BB-FRAME-1.0-05', 'WI-BB-FRAME-1.0-06',
    ],
    // Torque Wrench Operator Certification (org/qualifications.json).
    qualificationBaselineIds: ['QUAL-BB-01', 'QUAL-BB-14'],
    version: '1.0.0',
    bumpClassification: 'major',
    // Not a republish -- the very first publish of the workflow carries no
    // mandatory republish description; that field applies to a republish
    // (§7.3.3, L7228: "Every republish requires a mandatory republish
    // description"), and a first publish is not a republish.
    republishDescription: null,
    laneBRoute: false,
    status: 'outdated',
  },
  // v1.1.0 — MINOR: two screens added (photo verification, cable-housing
  // note) and the seat-post-clamp / chainring torque specs retightened per
  // engineering change order, matching the source's own MINOR definition
  // ("changes to what the worker does ... screens added or removed",
  // §7.3.3 class table, L7269). This is the current published version and
  // the id `WFD-BB-FRAME-ASSY` (bare, no version suffix) names it, since it
  // is the row every downstream reference (jobs, tours, the pinned
  // package) means by "the workflow".
  {
    id: 'WFD-BB-FRAME-ASSY',
    tenantId: 'TEN-BRIGHTBIKES',
    name: 'Frame Assembly — Main Triangle Build',
    jobTypeId: 'JT-ASSEMBLY',
    serviceTypeTagId: null,
    localeCoverage: ['en', 'es'],
    defaultEscalationRoutingTemplateId: 'ESC-BB-FRAME-SEV',
    defaultCoachingTriggerPercentage: 25,
    workInstructionIds: [
      'WI-BB-FRAME-01', 'WI-BB-FRAME-02', 'WI-BB-FRAME-03', 'WI-BB-FRAME-04',
      'WI-BB-FRAME-05', 'WI-BB-FRAME-06', 'WI-BB-FRAME-07', 'WI-BB-FRAME-08',
    ],
    qualificationBaselineIds: ['QUAL-BB-01', 'QUAL-BB-14', 'QUAL-BB-19B'],
    version: '1.1.0',
    bumpClassification: 'minor',
    republishDescription:
      'Added derailleur hanger alignment photo capture and a cable housing '
      + 'length note; retightened the seat post clamp and chainring bolt '
      + 'torque specifications per engineering change order ECO-BB-2031.',
    laneBRoute: false,
    status: 'published',
  },
  // v2.0.0 — MAJOR restructuring draft, still with the Author, not yet
  // submitted (Draft: "freely editable, not executable", §7.3.3 diagram).
  {
    id: 'WFD-BB-FRAME-ASSY-2.0.0',
    tenantId: 'TEN-BRIGHTBIKES',
    name: 'Frame Assembly — Main Triangle Build',
    jobTypeId: 'JT-ASSEMBLY',
    serviceTypeTagId: null,
    localeCoverage: ['en', 'es'],
    defaultEscalationRoutingTemplateId: 'ESC-BB-FRAME-SEV',
    defaultCoachingTriggerPercentage: 25,
    workInstructionIds: [
      'WI-BB-FRAME-2.0-01', 'WI-BB-FRAME-2.0-02', 'WI-BB-FRAME-2.0-03',
      'WI-BB-FRAME-2.0-04', 'WI-BB-FRAME-2.0-05', 'WI-BB-FRAME-2.0-06',
    ],
    qualificationBaselineIds: ['QUAL-BB-01', 'QUAL-BB-14', 'QUAL-BB-19B'],
    version: '2.0.0',
    bumpClassification: 'major',
    // Still being drafted -- classification and the mandatory description
    // are written at submission (§7.3.3 step 4-5), which has not happened.
    republishDescription: null,
    laneBRoute: false,
    status: 'draft',
  },
]

// --- work-instructions ------------------------------------------------
// Section-to-field mapping used throughout (OBJ-038 L8633; §5.5.2-§5.5.10,
// L4150-L4158): 1 Screen Content -> title/referenceImageUrl; 2 Input Type
// -> inputType; 3 Timing -> min/maxDurationSeconds, coachingTriggerPercentage;
// 4 Gate and Proof -> gateKind; 5 Specification Limits -> specificationId;
// 6 Coaching Content -> the applied Shared Instruction Block (no dedicated
// field: coaching assets are OBJ-041, never promoted to a §3.1 collection,
// same absence as the containment checklist); 7 Deviation Rules and
// Severity Mapping -> containmentChecklistId/escalationRoutingTemplateId;
// 8 Tool and Equipment -> requiresToolId/requiresCalibrationConfirmation;
// 9 Qualification Override -> qualificationOverrideIds.

const legacyWorkInstruction = {
  id: 'WI-0001',
  workflowDefinitionId: 'WF-TORQUE-001',
  order: 1,
  title:
    'Torque the wheel axle bolt to the value shown on the drawing, tightening '
    + 'in two even passes rather than one hard pull.',
  referenceImageUrl: null,
  inputType: 'measurement',
  minDurationSeconds: 10,
  maxDurationSeconds: 60,
  coachingTriggerPercentage: 20,
  gateKind: 'hard',
  specificationId: 'SPEC-0001',
  containmentChecklistId: 'CHK-BB-TORQUE-OOT',
  escalationRoutingTemplateId: 'ESC-BB-TORQUE-SEV',
  requiresToolId: 'TOOL-BB-TORQUE-WRENCH-04',
  requiresCalibrationConfirmation: true,
  qualificationOverrideIds: [],
  status: 'published',
}

// v1.1.0 -- the eight-screen published exemplar (the id `WFD-BB-FRAME-ASSY`
// screens; brief pass criterion 2 lands here: >=6 screens, real instruction
// text, two content blocks, one training item, two specs with numeric
// bounds, one evaluation criterion).
const v11Screens = [
  {
    id: 'WI-BB-FRAME-01',
    workflowDefinitionId: 'WFD-BB-FRAME-ASSY',
    order: 1,
    title:
      'Scan the frame serial barcode on the seat tube and confirm it matches '
      + 'the build sheet before you open any packaging.',
    referenceImageUrl: null,
    inputType: 'barcode',
    minDurationSeconds: 5,
    maxDurationSeconds: 30,
    coachingTriggerPercentage: 15,
    gateKind: 'soft',
    specificationId: null,
    containmentChecklistId: null,
    escalationRoutingTemplateId: null,
    requiresToolId: null,
    requiresCalibrationConfirmation: false,
    qualificationOverrideIds: [],
    status: 'published',
  },
  {
    id: 'WI-BB-FRAME-02',
    workflowDefinitionId: 'WFD-BB-FRAME-ASSY',
    order: 2,
    title:
      'Thread the seat post clamp bolt by hand, then torque it in one smooth '
      + 'pull to the value shown — do not pulse the wrench.',
    referenceImageUrl: null,
    inputType: 'measurement',
    minDurationSeconds: 10,
    maxDurationSeconds: 90,
    coachingTriggerPercentage: 25,
    gateKind: 'hard',
    specificationId: 'SPEC-BB-SEATCLAMP',
    containmentChecklistId: 'CHK-BB-FRAME-TORQUE-OOT',
    escalationRoutingTemplateId: 'ESC-BB-FRAME-SEV',
    requiresToolId: 'TOOL-BB-TORQUE-WRENCH-08',
    requiresCalibrationConfirmation: true,
    qualificationOverrideIds: ['QUAL-BB-01'],
    status: 'published',
  },
  {
    id: 'WI-BB-FRAME-03',
    workflowDefinitionId: 'WFD-BB-FRAME-ASSY',
    order: 3,
    title:
      'Press the head tube bearing races in squarely, top and bottom, until '
      + 'each seats flush against its shoulder with no visible gap.',
    referenceImageUrl: null,
    inputType: 'ok-not-ok',
    minDurationSeconds: 15,
    maxDurationSeconds: 120,
    coachingTriggerPercentage: 30,
    gateKind: 'hard',
    specificationId: null,
    containmentChecklistId: 'CHK-BB-FRAME-FITUP',
    escalationRoutingTemplateId: 'ESC-BB-FRAME-SEV',
    requiresToolId: 'TOOL-BB-BEARING-PRESS',
    requiresCalibrationConfirmation: false,
    qualificationOverrideIds: [],
    status: 'published',
  },
  {
    id: 'WI-BB-FRAME-04',
    workflowDefinitionId: 'WFD-BB-FRAME-ASSY',
    order: 4,
    title:
      'Run a gloved fingertip around the bottom bracket shell threads and '
      + 'check for burrs or debris before you install the bottom bracket cup.',
    referenceImageUrl: null,
    inputType: 'ok-not-ok',
    minDurationSeconds: 10,
    maxDurationSeconds: 60,
    coachingTriggerPercentage: 20,
    gateKind: 'soft',
    specificationId: null,
    containmentChecklistId: null,
    escalationRoutingTemplateId: null,
    requiresToolId: null,
    requiresCalibrationConfirmation: false,
    qualificationOverrideIds: [],
    status: 'published',
  },
  {
    id: 'WI-BB-FRAME-05',
    workflowDefinitionId: 'WFD-BB-FRAME-ASSY',
    order: 5,
    title:
      'Install the crankset and torque both chainring bolts to the value '
      + 'shown in a star pattern, then recheck each bolt in the same order.',
    referenceImageUrl: null,
    inputType: 'measurement',
    minDurationSeconds: 20,
    maxDurationSeconds: 150,
    coachingTriggerPercentage: 25,
    gateKind: 'hard',
    specificationId: 'SPEC-BB-CHAINRING',
    containmentChecklistId: 'CHK-BB-FRAME-TORQUE-OOT',
    escalationRoutingTemplateId: 'ESC-BB-FRAME-SEV',
    requiresToolId: 'TOOL-BB-TORQUE-WRENCH-08',
    requiresCalibrationConfirmation: true,
    qualificationOverrideIds: ['QUAL-BB-01'],
    status: 'published',
  },
  {
    id: 'WI-BB-FRAME-06',
    workflowDefinitionId: 'WFD-BB-FRAME-ASSY',
    order: 6,
    title:
      'Photograph the derailleur hanger from directly behind the dropout to '
      + 'confirm it sits parallel to the wheel plane, not bent in or out.',
    referenceImageUrl: null,
    inputType: 'photo',
    minDurationSeconds: 10,
    maxDurationSeconds: 60,
    coachingTriggerPercentage: 20,
    gateKind: 'soft',
    specificationId: null,
    containmentChecklistId: 'CHK-BB-FRAME-FITUP',
    escalationRoutingTemplateId: 'ESC-BB-FRAME-SEV',
    requiresToolId: null,
    requiresCalibrationConfirmation: false,
    qualificationOverrideIds: [],
    status: 'published',
  },
  {
    id: 'WI-BB-FRAME-07',
    workflowDefinitionId: 'WFD-BB-FRAME-ASSY',
    order: 7,
    title:
      'Record the housing lengths you cut for the front and rear derailleur '
      + 'cables, in millimetres, before you crimp the end caps.',
    referenceImageUrl: null,
    inputType: 'text',
    minDurationSeconds: 15,
    maxDurationSeconds: 90,
    coachingTriggerPercentage: 15,
    gateKind: 'soft',
    specificationId: null,
    containmentChecklistId: null,
    escalationRoutingTemplateId: null,
    requiresToolId: null,
    requiresCalibrationConfirmation: false,
    qualificationOverrideIds: [],
    status: 'published',
  },
  {
    id: 'WI-BB-FRAME-08',
    workflowDefinitionId: 'WFD-BB-FRAME-ASSY',
    order: 8,
    title:
      'Walk the assembled frame end to end — check for paint damage and '
      + 'loose fasteners, confirm every prior step passed, then sign off for '
      + 'quality-control handoff.',
    referenceImageUrl: null,
    inputType: 'ok-not-ok',
    minDurationSeconds: 30,
    maxDurationSeconds: 180,
    coachingTriggerPercentage: 20,
    gateKind: 'hard',
    specificationId: null,
    containmentChecklistId: null,
    escalationRoutingTemplateId: 'ESC-BB-FRAME-SEV',
    requiresToolId: null,
    requiresCalibrationConfirmation: false,
    qualificationOverrideIds: ['QUAL-BB-19B'],
    status: 'published',
  },
]

// v1.0.0 -- the pre-ECO six-screen set (no hanger photo, no housing note;
// looser torque specs, since 1.1.0's republish description is exactly
// "retightened ... per engineering change order").
const v10Screens = [
  { ...v11Screens[0], id: 'WI-BB-FRAME-1.0-01', workflowDefinitionId: 'WFD-BB-FRAME-ASSY-1.0.0' },
  {
    ...v11Screens[1],
    id: 'WI-BB-FRAME-1.0-02',
    workflowDefinitionId: 'WFD-BB-FRAME-ASSY-1.0.0',
    specificationId: 'SPEC-BB-SEATCLAMP-1.0.0',
  },
  { ...v11Screens[2], id: 'WI-BB-FRAME-1.0-03', workflowDefinitionId: 'WFD-BB-FRAME-ASSY-1.0.0' },
  { ...v11Screens[3], id: 'WI-BB-FRAME-1.0-04', workflowDefinitionId: 'WFD-BB-FRAME-ASSY-1.0.0' },
  {
    ...v11Screens[4],
    id: 'WI-BB-FRAME-1.0-05',
    workflowDefinitionId: 'WFD-BB-FRAME-ASSY-1.0.0',
    order: 5,
    specificationId: 'SPEC-BB-CHAINRING-1.0.0',
  },
  { ...v11Screens[7], id: 'WI-BB-FRAME-1.0-06', workflowDefinitionId: 'WFD-BB-FRAME-ASSY-1.0.0', order: 6 },
]

// v2.0.0 -- the MAJOR restructuring draft, still being authored (draft
// status; two fitup checks folded into one combined check).
const v20Screens = [
  { ...v11Screens[0], id: 'WI-BB-FRAME-2.0-01', workflowDefinitionId: 'WFD-BB-FRAME-ASSY-2.0.0', status: 'draft' },
  {
    ...v11Screens[1],
    id: 'WI-BB-FRAME-2.0-02',
    workflowDefinitionId: 'WFD-BB-FRAME-ASSY-2.0.0',
    specificationId: 'SPEC-BB-SEATCLAMP',
    status: 'draft',
  },
  {
    id: 'WI-BB-FRAME-2.0-03',
    workflowDefinitionId: 'WFD-BB-FRAME-ASSY-2.0.0',
    order: 3,
    title:
      'Press both head tube bearing races and the bottom bracket cup, then '
      + 'confirm all three seat flush with no visible gap in one combined check.',
    referenceImageUrl: null,
    inputType: 'ok-not-ok',
    minDurationSeconds: 20,
    maxDurationSeconds: 150,
    coachingTriggerPercentage: 30,
    gateKind: 'hard',
    specificationId: null,
    containmentChecklistId: 'CHK-BB-FRAME-FITUP',
    escalationRoutingTemplateId: 'ESC-BB-FRAME-SEV',
    requiresToolId: 'TOOL-BB-BEARING-PRESS',
    requiresCalibrationConfirmation: false,
    qualificationOverrideIds: [],
    status: 'draft',
  },
  {
    ...v11Screens[4],
    id: 'WI-BB-FRAME-2.0-04',
    workflowDefinitionId: 'WFD-BB-FRAME-ASSY-2.0.0',
    order: 4,
    specificationId: 'SPEC-BB-CHAINRING',
    status: 'draft',
  },
  { ...v11Screens[5], id: 'WI-BB-FRAME-2.0-05', workflowDefinitionId: 'WFD-BB-FRAME-ASSY-2.0.0', order: 5, status: 'draft' },
  { ...v11Screens[7], id: 'WI-BB-FRAME-2.0-06', workflowDefinitionId: 'WFD-BB-FRAME-ASSY-2.0.0', order: 6, status: 'draft' },
]

export const workInstructions = [legacyWorkInstruction, ...v10Screens, ...v11Screens, ...v20Screens]

// --- content-blocks -----------------------------------------------------
export const contentBlocks = [
  {
    id: 'CB-BB-FRAME-TORQUE-ZERO',
    tenantId: 'TEN-BRIGHTBIKES',
    title: 'Torque Wrench Zero and Calibration Check',
    text:
      'Zero the torque wrench on the calibration stand before your first '
      + 'reading of the shift. If the needle does not return to zero within '
      + 'one graduation, tag the wrench out of service and swap it at the '
      + 'tool crib — do not adjust it yourself.',
    imageUrls: [],
    appliedToWorkInstructionIds: ['WI-BB-FRAME-02', 'WI-BB-FRAME-05'],
    status: 'published',
  },
  {
    id: 'CB-BB-FRAME-HANDLING',
    tenantId: 'TEN-BRIGHTBIKES',
    title: 'Frame Handling and PPE Reminder',
    text:
      'Wear cut-resistant gloves whenever you handle an unpainted frame — '
      + 'the tube edges at the head tube and bottom bracket shell stay sharp '
      + 'until deburred. Support the frame at the bottom bracket shell, '
      + 'never by the derailleur hanger; the hanger bends under a fraction '
      + 'of the frame’s weight.',
    imageUrls: [],
    appliedToWorkInstructionIds: [
      'WI-BB-FRAME-01', 'WI-BB-FRAME-03', 'WI-BB-FRAME-04',
      'WI-BB-FRAME-06', 'WI-BB-FRAME-07', 'WI-BB-FRAME-08',
    ],
    status: 'published',
  },
]

// --- training -------------------------------------------------------------
export const training = [
  {
    id: 'TR-BB-FRAME-TORQUE-SEQ',
    tenantId: 'TEN-BRIGHTBIKES',
    title: 'Torque Sequencing for Multi-Bolt Fasteners',
    bodyText:
      'A chainring or any multi-bolt fastener is torqued in a star or '
      + 'criss-cross pattern, never straight around the circle. Bring every '
      + 'bolt to roughly half the target value on the first pass, then '
      + 'complete each bolt to full value on the second pass in the same '
      + 'star sequence. This spreads clamping force evenly and keeps the '
      + 'component from cocking on its seat.',
    videoUrl: null,
    locale: 'en',
    version: '1.0.0',
    status: 'published',
  },
]

// --- specifications -------------------------------------------------------
export const specifications = [
  // Legacy-compat: OBJ-036/038 Bright Bikes example, L8604/L11251.
  {
    id: 'SPEC-0001',
    tenantId: 'TEN-BRIGHTBIKES',
    lowerLimit: 44.0,
    upperLimit: 47.0,
    unit: 'N·m',
    drawingReference: 'DWG-A441',
    status: 'published',
  },
  {
    id: 'SPEC-BB-SEATCLAMP-1.0.0',
    tenantId: 'TEN-BRIGHTBIKES',
    lowerLimit: 5.0,
    upperLimit: 7.0,
    unit: 'N·m',
    drawingReference: 'DWG-BB-SEAT-CLAMP-06',
    status: 'superseded',
  },
  {
    id: 'SPEC-BB-CHAINRING-1.0.0',
    tenantId: 'TEN-BRIGHTBIKES',
    lowerLimit: 11.0,
    upperLimit: 13.0,
    unit: 'N·m',
    drawingReference: 'DWG-BB-CRANK-21',
    status: 'superseded',
  },
  {
    id: 'SPEC-BB-SEATCLAMP',
    tenantId: 'TEN-BRIGHTBIKES',
    lowerLimit: 6.0,
    upperLimit: 8.0,
    unit: 'N·m',
    drawingReference: 'DWG-BB-SEAT-CLAMP-07',
    status: 'published',
  },
  {
    id: 'SPEC-BB-CHAINRING',
    tenantId: 'TEN-BRIGHTBIKES',
    lowerLimit: 12.0,
    upperLimit: 14.0,
    unit: 'N·m',
    drawingReference: 'DWG-BB-CRANK-22',
    status: 'published',
  },
]

// --- evaluations ------------------------------------------------------
export const evaluations = [
  {
    id: 'EVAL-BB-FRAME-CHAINRING-SEV',
    kind: 'scenario',
    subjectAtomOrAgentId: 'ATOM-FRAME-CHAINRING-CLASSIFY',
    inputs: { reading: 15.6, upperLimit: 14 },
    expectedBehaviour:
      'Classify a 15.6 N·m chainring bolt reading against the 14 N·m '
      + 'upper limit as out of specification and open a deviation.',
    passCriteria: 'Severity band assigned matches the platform floor table for the percentage over limit.',
    suiteId: 'SUITE-CONTAINMENT',
    status: 'active',
  },
  {
    id: 'EVAL-BB-FRAME-CHAINRING-SEV-R1',
    kind: 'result',
    scenarioId: 'EVAL-BB-FRAME-CHAINRING-SEV',
    subjectAtomOrAgentId: 'ATOM-FRAME-CHAINRING-CLASSIFY',
    runAt: '2026-08-10T14:05:00Z',
    outcome: 'pass',
    failureDetail: null,
    suiteId: 'SUITE-CONTAINMENT',
    canaryOrOnDemand: 'canary',
  },
]

// --- packages ---------------------------------------------------------
// --- Package.sourceStatus lookup -----------------------------------------
// Task 4 fix round 1: one classification string per `Package.status` value,
// shared by every hand-authored row below AND by `generate-seed.mjs`'s
// generated packages (imported from here) so the citation text lives in
// exactly one place. See the doc comment on `Package` in
// `src/data/schemas/studio.ts` for the full reasoning; this is its data.
export const PACKAGE_SOURCE_STATUS = {
  assembled: 'SoW Fact — OBJ-045 L8768, OBJ-046 L8788 (work-package/manifest lifecycle union)',
  delivered: 'SoW Fact — OBJ-045 L8768, OBJ-046 L8788 (work-package/manifest lifecycle union)',
  validated: 'SoW Fact — OBJ-045 L8768, OBJ-046 L8788 (work-package/manifest lifecycle union)',
  pinned: 'SoW Fact — OBJ-045 L8768, OBJ-046 L8788 (work-package/manifest lifecycle union)',
  'in-use': 'SoW Fact — OBJ-045 L8768, OBJ-046 L8788 (work-package/manifest lifecycle union)',
  superseded: 'SoW Fact — OBJ-045 L8768, OBJ-046 L8788 (work-package/manifest lifecycle union)',
  // Fix round 2 (review finding): tier-by-tier from the §35.6 "Supporting
  // matrix -- failure classes and their handling" (L79570-79597) and its
  // closing "Source classification and traceability" paragraph (L79614),
  // not swept to one tier. Corrupt and revoked are genuinely MIXED --
  // the handling rule is proposed (Recommendation -- R&D) but a specific
  // value/resolution inside it stays undecided (Client Decision Required)
  // -- while expired is entirely undecided and incompatible-version is
  // entirely proposed. Flattening any of these back to one tier would
  // silently resolve an open decision as a product requirement (master
  // prompt §2) or hide the proposed/open split a reviewer needs (§21.2).
  corrupt:
    'MIXED: the handling rule (bounded re-pull) is Recommendation — R&D (blueprint §35.6 '
    + 'Rule 1 / matrix row "Accidental corruption", L79581); the re-pull retry bound itself '
    + 'is Client Decision Required — DEC-PKGMAN-001 (same row, and L79614), not yet decided.',
  expired:
    'Client Decision Required — DEC-PKGEXP-001, for the whole failure class, not mixed '
    + '(blueprint §35.6 matrix row "Expiry", L79585: "Client Decision Required — '
    + 'DEC-PKGEXP-001" is the row’s entire Source status, no Recommendation — R&D component) '
    + '— this row demonstrates the state’s shape only; no validity-horizon value is decided '
    + 'or implemented.',
  revoked:
    'MIXED: the general revocation shape (rides the command channel; shown pending until '
    + 'acknowledged; a mid-run revocation stops the run at its current step and quarantines '
    + 'captured work for Quality Manager disposition) is Recommendation — R&D (blueprint '
    + '§35.6 Rules 3-4 / matrix rows "Revocation before staging", "... run not started", '
    + '"... run in flight", L79586-L79588 — all three rows read literally '
    + '"Recommendation — R&D"); but the mid-run RESOLUTION specifically — i.e. whether '
    + 'stopping and quarantining an in-flight run is the accepted final policy for the '
    + 'conflict with version pinning — is separately named Client Decision Required under '
    + 'DEC-PKGMAN-001 in the closing paragraph (L79614: "the retry bound, expiry value and '
    + 'mid-run revocation resolution are Client Decision Required").',
  'incompatible-version':
    'Recommendation — R&D, entirely, not mixed (blueprint §35.6 Rule 6 / matrix row '
    + '"Incompatible application version", L79584: "Recommendation — R&D grounded in '
    + '§8.13.1" is the row’s entire Source status, no Client-Decision-Required component '
    + 'anywhere in the matrix or the closing paragraph) — grounded in SoW Fact §8.13.1 (the '
    + 'application-version floor is platform-owned release-channel policy).',
}

export const packages = [
  // Legacy-compat: RUN-0001 (Task 1 placeholder, runs.json) and
  // DEV-BB-TAB-014 (devices.json pinnedPackageIds) both reference this id.
  {
    id: 'PKG-0001',
    runId: 'RUN-0001',
    workflowDefinitionId: 'WF-TORQUE-001',
    workflowVersion: '1.0.0',
    contentItemIds: ['WI-0001'],
    localeSet: ['en'],
    difficultyLevelsIncluded: ['standard'],
    assembledAt: '2026-03-02T05:50:00Z',
    deliveredAt: '2026-03-02T05:55:00Z',
    acknowledgedAt: '2026-03-02T05:56:00Z',
    status: 'in-use',
    sourceStatus: PACKAGE_SOURCE_STATUS['in-use'],
  },
  // The superseded package RUN-BB-2026-0418-03's earlier runs held before
  // 1.1.0 republished (superseded lifecycle state, OBJ-045 L8768).
  {
    id: 'PKG-BB-FRAME-ASSY-1.0.0',
    runId: null,
    workflowDefinitionId: 'WFD-BB-FRAME-ASSY-1.0.0',
    workflowVersion: '1.0.0',
    contentItemIds: ['WI-BB-FRAME-1.0-01', 'WI-BB-FRAME-1.0-02', 'WI-BB-FRAME-1.0-03', 'WI-BB-FRAME-1.0-04', 'WI-BB-FRAME-1.0-05', 'WI-BB-FRAME-1.0-06'],
    localeSet: ['en', 'es'],
    difficultyLevelsIncluded: ['simple', 'standard', 'expanded'],
    assembledAt: '2026-05-04T05:30:00Z',
    deliveredAt: '2026-05-04T05:40:00Z',
    acknowledgedAt: '2026-05-04T05:42:00Z',
    status: 'superseded',
    sourceStatus: PACKAGE_SOURCE_STATUS.superseded,
  },
  // Task 5 claims this package with the recurring cast's Run
  // (`JOB-BB-2026-0418` / `RUN-BB-2026-0418-03`, scripts/seed-fixtures/
  // task5-hub.mjs). OBJ-045 records the pin on both sides -- the pin is
  // recorded on the Delivery Operations Hub run record (L8762) and this
  // row's own `runId` field exists precisely to carry it back -- so
  // `runs[...].packageId = 'PKG-BB-FRAME-ASSY-1.1.0'` (task5-hub.mjs) and
  // this row's `runId` now resolve to each other. This is the debt Task 4
  // left, and the demonstration AC-PKG-006 needs: a published version
  // (`WFD-BB-FRAME-ASSY-2.0.0`, still `draft` above) never rebases an
  // in-flight run -- RUN-BB-2026-0418-03 stays `in-progress`, pinned here
  // at 1.1.0, for the entire life of this seed.
  {
    id: 'PKG-BB-FRAME-ASSY-1.1.0',
    runId: 'RUN-BB-2026-0418-03',
    workflowDefinitionId: 'WFD-BB-FRAME-ASSY',
    workflowVersion: '1.1.0',
    contentItemIds: [
      'WI-BB-FRAME-01', 'WI-BB-FRAME-02', 'WI-BB-FRAME-03', 'WI-BB-FRAME-04',
      'WI-BB-FRAME-05', 'WI-BB-FRAME-06', 'WI-BB-FRAME-07', 'WI-BB-FRAME-08',
      'CB-BB-FRAME-TORQUE-ZERO', 'CB-BB-FRAME-HANDLING',
    ],
    localeSet: ['en', 'es'],
    difficultyLevelsIncluded: ['simple', 'standard', 'expanded'],
    assembledAt: '2026-08-15T05:40:00Z',
    deliveredAt: '2026-08-15T05:50:00Z',
    acknowledgedAt: '2026-08-15T05:52:00Z',
    status: 'pinned',
    sourceStatus: PACKAGE_SOURCE_STATUS.pinned,
  },
]
