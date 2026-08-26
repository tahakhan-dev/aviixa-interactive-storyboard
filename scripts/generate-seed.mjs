#!/usr/bin/env node
// Deterministic build-time generator for the Standards and Operations
// Studio seed collections (Task 4 of the 2026-08-26 runway plan).
//
// Per controller ruling R10 ("Seed authoring method", binding on Tasks
// 4-6, docs/superpowers/plans/2026-08-26-runway.md): the recurring cast's
// own rows (`WFD-BB-FRAME-ASSY` and its screens) stay hand-authored in
// `scripts/seed-fixtures/task4-studio.mjs`, imported and emitted verbatim
// below. This script only fills the population AROUND that cast, using a
// small seeded pseudo-random generator (mulberry32) -- never
// `Math.random()`, never `Date.now()` -- so a fixed seed produces
// byte-identical output every run. This is a build-time script; nothing
// under `src/` imports it, and it is not itself part of the application.
//
// Tasks 5 and 6 extend this shape: add a `scripts/seed-fixtures/taskN-*.mjs`
// fixtures module for their own hand-authored cast rows, and a matching
// generation section below (or a sibling script following the same
// PRNG-and-fixtures pattern) for their own collections.
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as fx from './seed-fixtures/task4-studio.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(root, 'src/data/collections')

// Fixed literal seed -- the runway plan's own date, chosen once and never
// re-derived from the clock. Changing this value changes every generated
// row; it is not meant to change between runs.
const SEED = 20260826

function mulberry32(seed) {
  let a = seed >>> 0
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rng = mulberry32(SEED)
const pick = (arr) => arr[Math.floor(rng() * arr.length)]
const int = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1))
const chance = (p) => rng() < p

// Fix round 1 (review Minor finding 2): one shared coverage-then-fill
// helper, replacing five near-identical inline implementations (an
// index-compared-to-`STATES.length` form used by the WF/TR/EVAL/PKG loops
// and a standalone incrementing-counter form used by the nested spec loop).
// Behaviour is identical to both originals: call it once per row of that
// kind and it yields every state in `states`, in order, exactly once, then
// falls back to `pick(states)` — whether "once per row" is driven directly
// by an outer loop's index (WF/TR/EVAL/PKG) or by a conditional nested
// branch that doesn't fire every outer iteration (specs, only on a
// `measurement` screen), because the counter lives in the closure rather
// than being compared against an outer loop variable that may not track
// 1:1 with "the Nth row of this kind". Tasks 5 and 6: call
// `coverageThenRandom(THEIR_STATES)` once per collection needing
// guaranteed-by-construction state coverage, the same way every call site
// below does, rather than re-copying either of the two retired patterns.
function coverageThenRandom(states) {
  let i = 0
  return () => (i < states.length ? states[i++] : pick(states))
}

// Deterministic ISO-8601 stamp: a fixed calendar baseline plus an offset,
// never the wall clock. Every stamp this script emits lands before the
// platform "now" (2026-08-16T09:12:00Z, see task-4-brief.md) by construction
// -- `dayOffset` is always bounded well under the ~223-day gap from the
// 2026-01-05 baseline.
function stamp(baseIso, dayOffset, hour, minute) {
  const base = new Date(baseIso).getTime()
  const t = base + dayOffset * 86400000 + hour * 3600000 + minute * 60000
  return new Date(t).toISOString()
}

// --- tenant population (from Tasks 2-3's committed collections) --------
// TEN-VANTAGE and TEN-IRONCLAD carry zero qualification rows in
// qualifications.json (verified by inspection) -- `quals: []` reflects
// that rather than inventing one; WorkflowDefinition.qualificationBaselineIds
// is a plain array and an empty one is schema-valid.
const TENANTS = [
  { id: 'TEN-BRIGHTBIKES', code: 'BB', locale: 'en', quals: ['QUAL-BB-01', 'QUAL-BB-02', 'QUAL-BB-03', 'QUAL-BB-05', 'QUAL-BB-06', 'QUAL-BB-07', 'QUAL-BB-11', 'QUAL-BB-14', 'QUAL-BB-15', 'QUAL-BB-17', 'QUAL-BB-19B', 'QUAL-BB-20'] },
  { id: 'TEN-NORTHFORGE', code: 'NF', locale: 'en', quals: ['QUAL-NF-01', 'QUAL-NF-03'] },
  { id: 'TEN-CEDARWORKS', code: 'CW', locale: 'en', quals: ['QUAL-CW-01'] },
  { id: 'TEN-HALLIDAY', code: 'HD', locale: 'en', quals: ['QUAL-HD-01', 'QUAL-HD-03'] },
  { id: 'TEN-VANTAGE', code: 'VG', locale: 'en', quals: [] },
  { id: 'TEN-IRONCLAD', code: 'IC', locale: 'en', quals: [] },
  { id: 'TEN-SUMMITGEAR', code: 'SG', locale: 'en', quals: ['QUAL-SG-01'] },
  { id: 'TEN-MERIDIAN', code: 'MR', locale: 'en', quals: ['QUAL-MR-01'] },
  { id: 'TEN-DELTAWORKS', code: 'DW', locale: 'en', quals: ['QUAL-DW-01'] },
  { id: 'TEN-PRAIRIEWORKS', code: 'PW', locale: 'en', quals: ['QUAL-PW-01'] },
  { id: 'TEN-SOLMETAL', code: 'SM', locale: 'es', quals: ['QUAL-SM-01'] },
  { id: 'TEN-HARBORWORKS', code: 'HW', locale: 'en', quals: ['QUAL-HW-01'] },
  { id: 'TEN-AZURACOMP', code: 'AC', locale: 'es', quals: ['QUAL-AC-01'] },
  { id: 'TEN-KESTRELDYN', code: 'KD', locale: 'en', quals: ['QUAL-KD-01'] },
]

// --- workflow-definitions -----------------------------------------------
// WorkflowDefinition.status is a five-member enum (draft, in-review,
// published, outdated, archived -- src/data/schemas/studio.ts, itself
// drawn from the §7.3.3 state diagram). The first five generated rows are
// forced one per state, in enum order, so coverage is guaranteed by
// construction rather than by luck; the remaining rows draw from the same
// five at random.
const WF_STATES = ['draft', 'in-review', 'published', 'outdated', 'archived']
const WF_NAME_TEMPLATES = [
  'Weld Seam Inspection', 'CNC Bore Tolerance Check', 'Paint Thickness Verification',
  'Final Pack Quality Check', 'Bearing Press-Fit Verification', 'Cable Harness Continuity Check',
  'Surface Finish Inspection', 'Hydraulic Fitting Torque Check', 'Gearbox Assembly Verification',
  'Control Panel Wiring Check', 'Coolant System Leak Test', 'Drive Shaft Alignment Check',
  'Fastener Torque Verification', 'Sensor Bracket Install Check',
]
const SCREEN_TEMPLATES = [
  { inputType: 'measurement', gateKind: 'hard', make: (s) => `Torque the ${s} to the value shown, tightening in two even passes rather than one.` },
  { inputType: 'measurement', gateKind: 'hard', make: (s) => `Measure the ${s} clearance with the calibrated gauge and record the reading before you move on.` },
  { inputType: 'ok-not-ok', gateKind: 'hard', make: (s) => `Inspect the ${s} for cracks, burrs, or discoloration and confirm it passes before proceeding.` },
  { inputType: 'ok-not-ok', gateKind: 'soft', make: (s) => `Check that the ${s} is seated and secure, with no visible play when gently pushed.` },
  { inputType: 'photo', gateKind: 'soft', make: (s) => `Photograph the ${s} from a straight-on angle so the reviewer can confirm alignment.` },
  { inputType: 'barcode', gateKind: 'soft', make: (s) => `Scan the ${s} barcode and confirm it matches the traveler before you continue.` },
  { inputType: 'text', gateKind: 'soft', make: (s) => `Record the ${s} reading in the field provided before you close out this step.` },
  { inputType: 'none', gateKind: 'soft', make: (s) => `Confirm the work area is clear and the ${s} is staged for the next operator.` },
]
const SUBJECTS = [
  'mounting bracket bolt', 'weld seam', 'bearing race', 'hydraulic fitting', 'gear housing cover',
  'control panel latch', 'pressure relief fitting', 'cable harness connector', 'drive shaft coupling',
  'frame rail joint', 'access panel fastener', 'sensor bracket', 'output shaft key', 'coolant hose clamp',
]

const generatedWorkflowDefinitions = []
const generatedWorkInstructions = []
const generatedSpecifications = []

const SPEC_STATES = ['authored', 'published', 'superseded']
const nextSpecState = coverageThenRandom(SPEC_STATES)
const nextWfState = coverageThenRandom(WF_STATES)

const GEN_WF_COUNT = 26
for (let i = 0; i < GEN_WF_COUNT; i++) {
  const tenant = TENANTS[i % TENANTS.length]
  const state = nextWfState()
  const id = `WFD-${tenant.code}-GEN-${String(i + 1).padStart(2, '0')}`
  const name = pick(WF_NAME_TEMPLATES)
  const screenCount = int(1, 3)
  const workInstructionIds = []
  const wiStatus = state === 'draft' ? 'draft' : state === 'in-review' ? 'in-review' : 'published'

  for (let j = 0; j < screenCount; j++) {
    const wiId = `${id}-WI-${j + 1}`
    const tmpl = pick(SCREEN_TEMPLATES)
    const subject = pick(SUBJECTS)
    let specId = null
    if (tmpl.inputType === 'measurement') {
      specId = `SPEC-${tenant.code}-GEN-${i + 1}-${j + 1}`
      const lower = int(5, 80)
      const upper = lower + int(2, 10)
      const specStatus = nextSpecState()
      generatedSpecifications.push({
        id: specId,
        tenantId: tenant.id,
        lowerLimit: lower,
        upperLimit: upper,
        unit: pick(['N·m', 'mm', 'psi', 'kg']),
        drawingReference: chance(0.6) ? `DWG-${tenant.code}-${int(100, 999)}` : null,
        status: specStatus,
      })
    }
    generatedWorkInstructions.push({
      id: wiId,
      workflowDefinitionId: id,
      order: j + 1,
      title: tmpl.make(subject),
      referenceImageUrl: null,
      inputType: tmpl.inputType,
      minDurationSeconds: int(5, 20),
      maxDurationSeconds: int(30, 180),
      coachingTriggerPercentage: int(10, 40),
      gateKind: tmpl.gateKind,
      specificationId: specId,
      containmentChecklistId: null,
      escalationRoutingTemplateId: null,
      requiresToolId: null,
      requiresCalibrationConfirmation: tmpl.inputType === 'measurement' ? chance(0.5) : false,
      qualificationOverrideIds: tenant.quals.length && chance(0.2) ? [pick(tenant.quals)] : [],
      status: wiStatus,
    })
    workInstructionIds.push(wiId)
  }

  const bump = pick(['major', 'minor', 'patch'])
  const isPublishedLike = state === 'published' || state === 'outdated' || state === 'archived'
  generatedWorkflowDefinitions.push({
    id,
    tenantId: tenant.id,
    name: `${name} — ${tenant.code}`,
    jobTypeId: `JT-${tenant.code}-${pick(['ASSEMBLY', 'FAB', 'MACH', 'INSPECT'])}`,
    serviceTypeTagId: null,
    localeCoverage: tenant.locale === 'es' ? (chance(0.4) ? ['en', 'es'] : ['es']) : ['en'],
    defaultEscalationRoutingTemplateId: chance(0.3) ? `ESC-${tenant.code}-${int(1, 9)}` : null,
    defaultCoachingTriggerPercentage: int(10, 40),
    workInstructionIds,
    qualificationBaselineIds: tenant.quals.length ? [pick(tenant.quals)] : [],
    version: `${int(1, 3)}.${int(0, 4)}.${int(0, 3)}`,
    bumpClassification: bump,
    republishDescription: isPublishedLike ? `Republished after review adjustments to ${name.toLowerCase()}.` : null,
    laneBRoute: bump === 'patch' && state === 'published' && chance(0.2),
    status: state,
  })
}

// --- content-blocks -------------------------------------------------------
const CB_TITLES = ['Safety and PPE Reminder', 'Tool Calibration Note', 'Material Handling Advisory', 'Pre-Op Checklist Reminder', 'Housekeeping Standard']
const CB_TEXTS = [
  'Wear the required personal protective equipment for this station before you begin, and flag your supervisor if any guard or interlock looks disabled.',
  'Confirm the tool or gauge at this station carries a current calibration sticker before you rely on its reading.',
  'Stage parts on the marked tray only; mixed or unmarked parts get pulled and quarantined rather than guessed at.',
  'Complete the pre-operation walk-around before the first cycle of the shift and note anything unusual on the shift log.',
  'Return tools to their marked shadow-board position at the end of each cycle so the next operator finds a clean station.',
]
const generatedContentBlocks = []
const GEN_CB_COUNT = 14
for (let i = 0; i < GEN_CB_COUNT; i++) {
  const tenant = TENANTS[i % TENANTS.length]
  const tenantWis = generatedWorkInstructions.filter((w) => w.workflowDefinitionId.startsWith(`WFD-${tenant.code}-GEN-`))
  const applied = tenantWis.length ? [pick(tenantWis).id] : []
  generatedContentBlocks.push({
    id: `CB-${tenant.code}-GEN-${i + 1}`,
    tenantId: tenant.id,
    title: pick(CB_TITLES),
    text: pick(CB_TEXTS),
    imageUrls: [],
    appliedToWorkInstructionIds: applied,
    // ContentBlock.status is a two-member enum (draft, published --
    // src/data/schemas/studio.ts, L8654); alternating guarantees both
    // appear regardless of GEN_CB_COUNT's parity.
    status: i % 2 === 0 ? 'published' : 'draft',
  })
}

// --- training ---------------------------------------------------------
const TR_TITLES = ['Tool Calibration Basics', 'Reading a Vernier Caliper', 'Safe Lifting Technique', 'Lockout-Tagout Refresher', 'Reading a Torque Wrench Scale', 'Weld Inspection Fundamentals']
const TR_STATES = ['draft', 'in-review', 'published', 'archived']
const nextTrState = coverageThenRandom(TR_STATES)
const generatedTraining = []
const GEN_TR_COUNT = 12
for (let i = 0; i < GEN_TR_COUNT; i++) {
  const tenant = TENANTS[i % TENANTS.length]
  const state = nextTrState()
  generatedTraining.push({
    id: `TR-${tenant.code}-GEN-${i + 1}`,
    tenantId: tenant.id,
    title: pick(TR_TITLES),
    bodyText: 'Review this module before your first shift at this station, and ask your supervisor if a step here does not match what you see on the floor.',
    videoUrl: null,
    locale: tenant.locale,
    version: '1.0.0',
    status: state,
  })
}

// --- evaluations ------------------------------------------------------
const EVAL_STATES = ['authored', 'active', 'superseded']
const nextEvalState = coverageThenRandom(EVAL_STATES)
const generatedEvaluations = []
const GEN_EVAL_COUNT = 9
for (let i = 0; i < GEN_EVAL_COUNT; i++) {
  const tenant = TENANTS[i % TENANTS.length]
  const state = nextEvalState()
  const id = `EVAL-${tenant.code}-GEN-${i + 1}`
  generatedEvaluations.push({
    id,
    kind: 'scenario',
    subjectAtomOrAgentId: `ATOM-${tenant.code}-CLASSIFY-${i + 1}`,
    inputs: { reading: int(1, 100), upperLimit: int(50, 100) },
    expectedBehaviour: 'Classify the captured reading against its configured limit and assign the correct severity band.',
    passCriteria: 'Severity band assigned matches the platform floor table.',
    suiteId: 'SUITE-CONTAINMENT',
    status: state,
  })
  if (chance(0.6)) {
    const outcome = chance(0.8) ? 'pass' : 'fail'
    generatedEvaluations.push({
      id: `${id}-R1`,
      kind: 'result',
      scenarioId: id,
      subjectAtomOrAgentId: `ATOM-${tenant.code}-CLASSIFY-${i + 1}`,
      runAt: stamp('2026-08-01T00:00:00Z', int(0, 10), int(0, 23), int(0, 59)),
      outcome,
      failureDetail: outcome === 'fail' ? 'Severity band assigned did not match the floor table for this input.' : null,
      suiteId: 'SUITE-CONTAINMENT',
      canaryOrOnDemand: chance(0.5) ? 'canary' : 'on-demand',
    })
  }
}

// --- packages -----------------------------------------------------------
// Package.status is a ten-member enum (src/data/schemas/studio.ts): the six
// SoW Fact values (assembled, delivered, validated, pinned, in-use,
// superseded -- the OBJ-045/OBJ-046 fold) plus, as of Task 4 fix round 1
// (review Important finding), four Recommendation-R&D values proposed by
// blueprint §35.6 (L79517-L79530) for a deployed package's failure paths:
// expired, revoked, corrupt, incompatible-version. The first ten generated
// rows are forced one per state, in enum order, the same coverage-by-
// construction pattern as WF_STATES above -- brief pass criterion 4 (at
// least one expired/revoked/corrupt row, plus incompatible-version) is
// satisfied by this forced prefix, not by chance.
const PKG_STATES = [
  'assembled', 'delivered', 'validated', 'pinned', 'in-use', 'superseded',
  'expired', 'revoked', 'corrupt', 'incompatible-version',
]
const nextPkgState = coverageThenRandom(PKG_STATES)
const allWorkflowRefs = [...fx.workflowDefinitions, ...generatedWorkflowDefinitions].map((w) => ({ id: w.id, version: w.version }))
const generatedPackages = []
const GEN_PKG_COUNT = 24
for (let i = 0; i < GEN_PKG_COUNT; i++) {
  const wf = allWorkflowRefs[i % allWorkflowRefs.length]
  const state = nextPkgState()
  const day = int(0, 200)
  // `corrupt` and `incompatible-version` are rejected during the §35.6
  // verification gauntlet, before a package would ever reach the
  // `Trusted`/acknowledged step (RejectCorrupt and RejectVersion both
  // branch off before ValidityCheck) -- so both are delivered (bytes
  // arrived, that's how the failure is detected) but never acknowledged.
  // `expired` and `revoked` describe a package that was already good
  // (delivered, acknowledged, in productive use) before something later
  // withdrew trust from it, so both keep their acknowledgement.
  const hasDelivered = state !== 'assembled'
  const hasAcknowledged = ['validated', 'pinned', 'in-use', 'superseded', 'expired', 'revoked'].includes(state)
  generatedPackages.push({
    id: `PKG-GEN-${i + 1}`,
    runId: null,
    workflowDefinitionId: wf.id,
    workflowVersion: wf.version,
    contentItemIds: [],
    localeSet: ['en'],
    difficultyLevelsIncluded: [pick(['simple', 'standard', 'expanded'])],
    assembledAt: stamp('2026-01-05T00:00:00Z', day, int(0, 12), int(0, 59)),
    deliveredAt: hasDelivered ? stamp('2026-01-05T00:00:00Z', day, int(13, 20), int(0, 59)) : null,
    acknowledgedAt: hasAcknowledged ? stamp('2026-01-05T00:00:00Z', day, int(21, 23), int(0, 59)) : null,
    status: state,
    sourceStatus: fx.PACKAGE_SOURCE_STATUS[state],
  })
}

// --- assemble and write --------------------------------------------------
const collections = {
  'workflow-definitions.json': [...fx.workflowDefinitions, ...generatedWorkflowDefinitions],
  'work-instructions.json': [...fx.workInstructions, ...generatedWorkInstructions],
  'content-blocks.json': [...fx.contentBlocks, ...generatedContentBlocks],
  'training.json': [...fx.training, ...generatedTraining],
  'specifications.json': [...fx.specifications, ...generatedSpecifications],
  'evaluations.json': [...fx.evaluations, ...generatedEvaluations],
  'packages.json': [...fx.packages, ...generatedPackages],
}

for (const [file, rows] of Object.entries(collections)) {
  writeFileSync(join(OUT, file), JSON.stringify(rows, null, 2) + '\n')
  console.log(`wrote ${file.padEnd(28)} ${String(rows.length).padStart(4)} rows`)
}
console.log(`\nseed ${SEED} — deterministic, no Math.random(), no Date.now()`)
