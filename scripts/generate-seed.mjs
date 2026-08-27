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
import { writeFileSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as fx from './seed-fixtures/task4-studio.mjs'
import * as fx5 from './seed-fixtures/task5-hub.mjs'
import * as fx6 from './seed-fixtures/task6-crosscutting.mjs'
// The capture-state ladder is the platform's own closed vocabulary (frozen
// source §22.6.1, L39584-L39619) -- reused directly rather than
// re-declared, so this generator can never drift from
// `src/data/schemas/operations.ts`'s own `Capture.status` (which itself
// imports the same `CAPTURE_STATES`, per controller ruling R2). Node 24
// strips the TypeScript types at load time; `capture.ts` has no import of
// its own, so this resolves with no bundler involved.
import { CAPTURE_STATES } from '../src/frontline/capture.ts'
// Task 6's own reused vocabularies, same pattern: the schema module and
// this generator both import the one closed set, so neither can drift
// from the other (controller ruling R2).
import { NOTIFICATION_STATES, SCHEDULE_DEFINITION_STATES, SCHEDULE_OCCURRENCE_STATES } from '../src/domain/vocabularies.ts'
import { COMMAND_STATES } from '../src/surfaces/sa/command-state.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(root, 'src/data/collections')
// Tasks 2-3's already-committed org/people collections -- static JSON on
// disk, read once at generate time. This introduces no non-determinism
// (the files do not change between generator runs); it lets Task 5 place
// every generated Job/Run/execution row against a real Site, Area, Shift,
// Worker and Device rather than inventing a second, disconnected org model.
const readCollection = (file) => JSON.parse(readFileSync(join(OUT, file), 'utf8'))

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
// (review Important finding), four values proposed by blueprint §35.6
// (L79517-L79530) for a deployed package's failure paths: expired,
// revoked, corrupt, incompatible-version. Fix round 2: those four are NOT
// uniformly Recommendation-R&D -- `expired` is entirely Client Decision
// Required (DEC-PKGEXP-001) and `corrupt`/`revoked` are MIXED (a proposed
// handling shape plus a still-undecided value/resolution folded into
// DEC-PKGMAN-001); see `PACKAGE_SOURCE_STATUS` in
// `scripts/seed-fixtures/task4-studio.mjs` for the row-by-row citations.
// The first ten generated rows are forced one per state, in enum order,
// the same coverage-by-construction pattern as WF_STATES above -- brief
// pass criterion 4 (at least one expired/revoked/corrupt row, plus
// incompatible-version) is satisfied by this forced prefix, not by chance.
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

// ===========================================================================
// Task 5 — Delivery Operations Hub: Job -> Run -> Unit Execution -> Step
// Execution -> Data Capture, plus Evidence, Deviations, Holds, Summaries
// and Reports (docs/superpowers/plans/2026-08-26-runway.md, Task 5).
// ===========================================================================

const sitesAll = readCollection('sites.json')
const areasAll = readCollection('areas.json')
const locationsAll = readCollection('locations.json')
const shiftsAll = readCollection('shifts.json')
const workersAll = readCollection('workers.json')
const devicesAll = readCollection('devices.json')
const usersAll = readCollection('users.json')

// TEN-VANTAGE (archived, legal hold) and TEN-IRONCLAD (invited, never
// onboarded) carry zero Site rows from Task 3 -- verified by reading
// sites.json, not assumed. There is no Site, Area, Shift, Worker or
// Device to bind a Job or Run to for either tenant, so neither gets
// operational rows here; inventing an org substrate Task 3 did not seed
// would make this script a second, disconnected source of truth for org
// data Tasks 2-3 already own. Brief pass criterion 1 asks for >=120 runs
// across tenants and >=60 at Bright Bikes, not full-tenant coverage, so
// the exclusion does not weaken it.
const OPERATIONAL_TENANTS = TENANTS.filter((t) => t.id !== 'TEN-VANTAGE' && t.id !== 'TEN-IRONCLAD')

const allWfDefs = [...fx.workflowDefinitions, ...generatedWorkflowDefinitions]
const allWorkInstructions = [...fx.workInstructions, ...generatedWorkInstructions]
const workInstructionsByWfd = new Map()
for (const wi of allWorkInstructions) {
  const list = workInstructionsByWfd.get(wi.workflowDefinitionId) ?? []
  list.push(wi)
  workInstructionsByWfd.set(wi.workflowDefinitionId, list)
}

// One Site, Area and Shift per operational tenant -- every one of the
// twelve was checked by inspection to have at least one active row of
// each (task-5-report.md carries the count table); `owner` deliberately
// ignores user `status` (Meridian's Tenant Admin is `locked` under its
// `compliance-suspended` lifecycle but is still the correct historical
// Job Owner attribution -- ownership is a fact about who the record names,
// not about who can sign in today).
const orgByTenant = new Map()
for (const t of OPERATIONAL_TENANTS) {
  const site = sitesAll.find((s) => s.tenantId === t.id && s.status === 'active')
  const area = areasAll.find((a) => a.siteId === site.id && a.status === 'active')
  const shift =
    shiftsAll.find((s) => s.siteId === site.id && s.status === 'active' && s.areaIds.includes(area.id)) ??
    shiftsAll.find((s) => s.siteId === site.id && s.status === 'active')
  const locations = locationsAll.filter((l) => l.areaId === area.id && l.status === 'active')
  const workers = workersAll.filter((w) => w.tenantId === t.id && w.status === 'active')
  const devices = devicesAll.filter((d) => d.tenantId === t.id && d.status === 'active')
  const owner =
    usersAll.find((u) => u.tenantId === t.id && (u.role === 'SUPERVISOR' || u.role === 'TENANT_ADMIN')) ??
    usersAll.find((u) => u.tenantId === t.id)
  const tenantWfDefs = allWfDefs.filter((w) => w.tenantId === t.id)
  const publishedWfDefs = tenantWfDefs.filter((w) => w.status === 'published')
  orgByTenant.set(t.id, {
    site, area, shift, locations, workers, devices, owner,
    wfDefs: publishedWfDefs.length ? publishedWfDefs : tenantWfDefs,
  })
}

// --- jobs -------------------------------------------------------------
// Job.status is the five-state machine of §7.3.2 (draft, pending-approval,
// active, paused, archived -- operations.ts). Job 1 per tenant is always
// forced `active` so every operational tenant has at least one run-eligible
// Job; the rest cycle the full lifecycle via `coverageThenRandom` for
// texture, the same pattern as every other coverage loop in this script.
const JOB_STATES = ['draft', 'pending-approval', 'active', 'paused', 'archived']
const nextJobState = coverageThenRandom(JOB_STATES)
const JOBS_PER_TENANT = 4
const generatedJobs = []
for (const t of OPERATIONAL_TENANTS) {
  const org = orgByTenant.get(t.id)
  if (!org.wfDefs.length) continue // no workflow to bind a Job to for this tenant (does not occur among the 12 operational tenants; guarded anyway)
  for (let j = 0; j < JOBS_PER_TENANT; j++) {
    const wf = org.wfDefs[j % org.wfDefs.length]
    generatedJobs.push({
      id: `JOB-GEN-${t.code}-${j + 1}`,
      tenantId: t.id,
      name: `${wf.name} — standing job ${j + 1}`,
      jobTypeId: `JT-${t.code}-OPS`,
      serviceTypeTagId: null,
      siteId: org.site.id,
      areaId: org.area.id,
      shiftId: org.shift.id,
      workflowDefinitionId: wf.id,
      plannedQuantity: int(10, 150),
      qualificationRequirementIds: t.quals.length ? [pick(t.quals)] : [],
      recurrencePattern: chance(0.4) ? 'every scheduled shift' : null,
      unitMode: pick(['serialized', 'lot', 'none']),
      ownerUserId: org.owner.id,
      linkedJobId: null,
      status: j === 0 ? 'active' : nextJobState(),
    })
  }
}
const activeJobsByTenant = new Map()
for (const j of [...fx5.jobs, ...generatedJobs]) {
  if (j.status !== 'active') continue
  const list = activeJobsByTenant.get(j.tenantId) ?? []
  list.push(j)
  activeJobsByTenant.set(j.tenantId, list)
}

// --- runs, and everything the run state machine says should exist beneath them ---
const RUN_STATES = ['scheduled', 'in-progress', 'cancelled', 'submitted', 'complete', 'finished']
const nextRunState = coverageThenRandom(RUN_STATES)
// Deviation.status, the seven-state machine of OBJ-052 (L8978-L8993):
// Detected, Classified, Contained, Escalated, Dispositioned, Bridged, Resolved.
const DEVIATION_STATES = ['detected', 'classified', 'contained', 'escalated', 'dispositioned', 'bridged', 'resolved']
const nextDeviationState = coverageThenRandom(DEVIATION_STATES)
// Hold.status, the six-state machine of OBJ-053 (L8997-L9013): Issued,
// Propagating, In force, Release requested, Released, Release propagating.
const HOLD_STATES = ['issued', 'propagating', 'in-force', 'release-requested', 'released', 'release-propagating']
const nextHoldState = coverageThenRandom(HOLD_STATES)
// Evidence.status, the five-state machine of OBJ-019 (L8112-L8129):
// captured, queued, uploaded, accepted, reviewed.
const EVIDENCE_STATES = ['captured', 'queued', 'uploaded', 'accepted', 'reviewed']
const nextEvidenceState = coverageThenRandom(EVIDENCE_STATES)
// Severity 1 is the rare, fixed-floor case (automatic hold); 2 and 3 are
// the common cases the tenant's own action bundle or the execution summary
// absorbs (blueprint L7385-L7392) -- weighting the pick this way keeps
// that asymmetry visible in the generated population instead of a flat
// one-in-three split implying the three are interchangeable.
const SEVERITIES = [1, 2, 2, 3, 3]

// Every population Capture funnels through ONE shared coverage sequence so
// brief pass criterion 3 (all thirteen capture states, at least one row
// each) is satisfied by construction -- exactly what `coverageThenRandom`
// exists for (see its doc comment above). `CAPTURE_STATES` is imported
// from `@/frontline/capture`, never re-typed, so this can never drift from
// `Capture.status` in `src/data/schemas/operations.ts`.
const nextCaptureState = coverageThenRandom(CAPTURE_STATES)

const RUN_BASELINE = '2026-06-01T00:00:00Z' // day offset below tops out at 75 -> 2026-08-15, always before platform "now" 2026-08-16T09:12Z
const GEN_RUN_COUNT = 145

const generatedRuns = []
const generatedUnitExecutions = []
const generatedStepExecutions = []
const generatedCaptures = []
const generatedEvidence = []
const generatedDeviations = []
const generatedHolds = []
const generatedSummaries = []

const nonBB = OPERATIONAL_TENANTS.filter((t) => t.id !== 'TEN-BRIGHTBIKES')

// Fix round 1, Important 2: a Hold was only ever minted opportunistically,
// off the same 8%-chance x 1-in-5-severities roll that drives Deviations --
// no forced coverage at all, unlike every other required vocabulary in this
// generator. `Hold.targetKind` has three genuine V1 values (OBJ-053, L9003:
// "the Lot where one exists, the Unit where work is serialized, otherwise
// the Run") and this tracker forces at least two Severity-1 events for each,
// coherently -- a run's targetKind is never chosen independently of its
// Job's `unitMode`, it is exactly what `unitMode` already determines below.
// `Hold.status` coverage still comes from `nextHoldState()` (unchanged) --
// forcing enough total Hold-creation events is what lets that six-state
// cycle actually complete instead of firing zero or one time.
const holdTargetKindCoverage = { lot: 0, unit: 0, run: 0 }

for (let i = 0; i < GEN_RUN_COUNT; i++) {
  // Every other generated run goes to Bright Bikes (>=60 required, >=73
  // land here); the rest round-robin the eleven other operational tenants.
  const tenant = i % 2 === 0 ? OPERATIONAL_TENANTS[0] : nonBB[i % nonBB.length]
  const org = orgByTenant.get(tenant.id)
  const eligibleJobs = activeJobsByTenant.get(tenant.id)
  if (!eligibleJobs || !eligibleJobs.length) continue // no active Job for this tenant to run against (does not occur; guarded anyway)
  const job = pick(eligibleJobs)
  const status = nextRunState()

  const day = int(0, 75)
  const startHour = int(5, 10)
  const plannedStartAt = stamp(RUN_BASELINE, day, startHour, 0)
  const plannedEndAt = stamp(RUN_BASELINE, day, startHour + 8, 0)
  const started = status !== 'scheduled'
  const ended = status === 'submitted' || status === 'complete' || status === 'finished'
  // The run's own start offset, minutes past `startHour`. Every timestamp
  // nested inside this run (unit open, step device time) is DERIVED from
  // this value below rather than drawn as its own independent `int(...)`
  // call -- fix round 1, Important 1: independent draws for parent and
  // child left ~39% of generated Step Executions timestamped before their
  // own parent Unit Execution. Deriving the child's window from inside the
  // parent's makes "no step before its unit" true by construction, not by
  // luck of the draw -- checked at every nesting level this generator has
  // (run -> unit -> step; Job carries no timestamps to nest under).
  const runStartOffset = int(0, 20)
  const actualStartAt = started ? stamp(RUN_BASELINE, day, startHour, runStartOffset) : null
  const actualEndAt = ended ? stamp(RUN_BASELINE, day, startHour + 8, int(0, 40)) : null

  const runId = `RUN-GEN-${tenant.code}-${i + 1}`
  generatedRuns.push({
    id: runId,
    tenantId: tenant.id,
    siteId: org.site.id,
    areaId: org.area.id,
    shiftId: org.shift.id,
    jobId: job.id,
    source: 'manual',
    packageId: null,
    plannedStartAt,
    plannedEndAt,
    actualStartAt,
    actualEndAt,
    productionDate: plannedStartAt.slice(0, 10),
    cancellationReason:
      status === 'cancelled'
        ? pick(['no-show past 30 minutes', 'material shortage', 'equipment fault', 'schedule conflict'])
        : null,
    linkedRunId: null,
    status,
  })

  // Execution hierarchy only where the run state machine says work
  // actually happened (§7.3.1): Scheduled and Cancelled runs correctly
  // carry none -- this is the same "does the state have somewhere to
  // exist" discipline as the task brief's first trap, read in the
  // direction of NOT inventing rows a state forbids.
  if (!['in-progress', 'submitted', 'complete', 'finished'].includes(status)) continue
  if (!org.workers.length || !org.devices.length) continue
  const instructions = (workInstructionsByWfd.get(job.workflowDefinitionId) ?? []).slice(0, 4)
  if (!instructions.length) continue
  const wfVersion = (allWfDefs.find((w) => w.id === job.workflowDefinitionId) ?? { version: '1.0.0' }).version

  // OBJ-014's own card: "children are ... Unit Executions, Step Executions
  // where unit mode is none" -- when the Job declares unit mode `none`,
  // Step Executions attach directly to the Run with no Unit Execution at
  // all, rather than a Unit Execution being invented to hold them.
  const unitCount = job.unitMode === 'none' ? 0 : 1
  const units = []
  for (let u = 0; u < unitCount; u++) {
    const unitId = `UE-GEN-${tenant.code}-${i + 1}-${u + 1}`
    const worker = pick(org.workers)
    const device = pick(org.devices)
    const ref =
      job.unitMode === 'lot' ? `LOT-${tenant.code}-${int(1000, 9999)}` : `SN-${tenant.code}-${int(10000, 99999)}`
    // Derived from `runStartOffset`, always strictly after it (the added
    // band is >= 1 minute) -- never an independent draw off `startHour`.
    const unitOpenOffset = runStartOffset + int(1, 10) + u * 15
    const openedAt = stamp(RUN_BASELINE, day, startHour, unitOpenOffset)
    const unitComplete = status !== 'in-progress' || chance(0.5)
    generatedUnitExecutions.push({
      id: unitId,
      runId,
      unitOrSerialRef: ref,
      workerId: worker.id,
      deviceId: device.id,
      openedAt,
      // `int(40, 90)` comfortably exceeds the largest step offset any step
      // on this unit can reach below (`int(2,8) + 3*6` = 26 at most, for
      // the 4th of at most 4 sliced instructions), so a completed unit
      // always closes after every one of its own steps' `deviceTime`, too.
      closedAt: unitComplete ? stamp(RUN_BASELINE, day, startHour, unitOpenOffset + int(40, 90)) : null,
      status: unitComplete ? 'complete' : 'open',
    })
    units.push({ id: unitId, worker, device, ref, openOffset: unitOpenOffset })
  }

  // This run's Hold target kind, matching OBJ-053's own rule exactly:
  // Lot where the Job's unit mode is `lot`, Unit where it is `serialized`,
  // otherwise (unit mode `none`) the Run itself. Computed once so the
  // forcing check below and the Hold's own `targetKind` field (further
  // down) can never disagree.
  const runHoldTargetKind = unitCount ? (job.unitMode === 'lot' ? 'lot' : 'unit') : 'run'
  let holdForcedThisRun = false

  for (let s = 0; s < instructions.length; s++) {
    const wi = instructions[s]
    const unit = unitCount ? units[0] : null
    const worker = unit ? unit.worker : pick(org.workers)
    const device = unit ? unit.device : pick(org.devices)
    const stepId = `SE-GEN-${tenant.code}-${i + 1}-${s + 1}`
    // Derived from the parent's own offset (the Unit's `openOffset`, or
    // the Run's own `runStartOffset` when unit mode is `none` and steps
    // attach directly to the Run) -- same derivation-not-independent-draw
    // fix as the Unit block above.
    const baseOffset = unit ? unit.openOffset : runStartOffset
    const stepOffset = baseOffset + int(2, 8) + s * 6
    const deviceTime = stamp(RUN_BASELINE, day, startHour, stepOffset)
    const stepSynced = status !== 'in-progress' || chance(0.6)
    const serverReceiptTime = stepSynced ? stamp(RUN_BASELINE, day, startHour, stepOffset + int(15, 30)) : null

    let inSpecification = null
    let severityBand = null
    let gateOutcome = 'not-applicable'
    if (wi.inputType === 'measurement' || wi.inputType === 'ok-not-ok') {
      gateOutcome = 'passed'
      inSpecification = true
      // Force at most one Severity-1 event per run, on the first eligible
      // step, until every `targetKind` has at least two Hold rows -- see
      // `holdTargetKindCoverage` above. Falls back to the original organic
      // 8%-chance roll (still weighted toward 2/3 via `SEVERITIES`) once
      // coverage is satisfied, so the population stays mostly organic.
      const forceHold = !holdForcedThisRun && holdTargetKindCoverage[runHoldTargetKind] < 2
      if (forceHold || chance(0.08)) {
        inSpecification = false
        severityBand = forceHold ? 1 : pick(SEVERITIES)
        gateOutcome = 'failed'
        if (forceHold) {
          holdTargetKindCoverage[runHoldTargetKind]++
          holdForcedThisRun = true
        }
      }
    }

    generatedStepExecutions.push({
      id: stepId,
      runId,
      unitExecutionId: unit ? unit.id : null,
      workflowDefinitionId: job.workflowDefinitionId,
      pinnedVersion: wfVersion,
      workInstructionId: wi.id,
      workerId: worker.id,
      deviceId: device.id,
      siteId: org.site.id,
      areaId: org.area.id,
      locationId: org.locations.length ? pick(org.locations).id : null,
      deviceTime,
      serverReceiptTime,
      gateOutcome,
      inSpecification,
      severityBand,
      status: status === 'in-progress' && s === instructions.length - 1 && chance(0.3) ? 'started' : 'completed',
    })

    if (wi.inputType === 'none') continue // this screen defines no capture -- none is created, per brief pass criterion 2's own wording

    let value
    if (wi.inputType === 'measurement') value = int(1, 200) / 2
    else if (wi.inputType === 'ok-not-ok') value = inSpecification !== false
    else if (wi.inputType === 'photo') value = `evidence/${plannedStartAt.slice(0, 10)}/${stepId}.jpg`
    else if (wi.inputType === 'barcode') value = `SCAN-${int(100000, 999999)}`
    else value = 'recorded on device'

    const evidenceIds = []
    if (wi.inputType === 'photo') {
      const evId = `EVD-GEN-${tenant.code}-${i + 1}-${s + 1}`
      generatedEvidence.push({
        id: evId,
        stepExecutionId: stepId,
        unitExecutionId: unit ? unit.id : null,
        workerId: worker.id,
        deviceId: device.id,
        mediaType: 'photo',
        deviceTime,
        serverReceiptTime,
        storageRef: value,
        reviewedBy: null,
        status: nextEvidenceState(),
      })
      evidenceIds.push(evId)
    }

    const unitOrLot = unit
      ? { kind: job.unitMode === 'lot' ? 'lot' : 'unit', id: unit.ref }
      : { kind: 'absent-by-design', reason: "Job.unitMode is 'none' for this Job" }

    const captureId = `CAP-GEN-${tenant.code}-${i + 1}-${s + 1}`
    generatedCaptures.push({
      id: captureId,
      stepExecutionId: stepId,
      runId,
      jobId: job.id,
      captureType: wi.inputType,
      value,
      unitOrLot,
      workerId: worker.id,
      authorisingWorkerId: null,
      deviceId: device.id,
      locationResolved: true,
      siteId: org.site.id,
      areaId: org.area.id,
      locationId: org.locations.length ? pick(org.locations).id : null,
      unresolvedLocationNote: null,
      deviceTime,
      serverReceiptTime,
      inSpecification,
      severityBand,
      evidenceIds,
      lateArrival: chance(0.03),
      correctedFromCaptureId: null,
      status: nextCaptureState(),
    })

    if (severityBand !== null) {
      const devId = `DEV-GEN-${tenant.code}-${i + 1}-${s + 1}`
      generatedDeviations.push({
        id: devId,
        tenantId: tenant.id,
        triggerMechanism: 'specification-and-evidence',
        stepExecutionId: stepId,
        workerId: worker.id,
        runId,
        lotOrUnitRef: unit ? unit.ref : null,
        workflowVersion: wfVersion,
        severityBand,
        agentInterpretation: `Reading outside the pinned specification window, classified Severity ${severityBand}.`,
        // Only Severity 1 auto-launches a containment checklist (L7388) --
        // Severity 2/3 deliberately carry none here, the same asymmetry
        // DEV-BB-SEV2-01 documents in scripts/seed-fixtures/task5-hub.mjs.
        containmentChecklistId: severityBand === 1 ? (wi.containmentChecklistId ?? null) : null,
        escalationRoutingState: severityBand === 3 ? null : 'escalated',
        hasEvidenceGaps: false,
        status: nextDeviationState(),
      })
      if (severityBand === 1) {
        // Fix round 2, deferred items 1-2: the release fields are DERIVED
        // from `holdStatus`, not drawn independently beside it. Independent
        // `chance()` draws previously let `releasedAt` equal `placedAt`
        // exactly on an unsynced step (fell back to the same `deviceTime`
        // on both sides) and let `releasedAt` be set while `status` stayed
        // `issued` -- a row that says released and says not, the same
        // independent-offsets class as Finding 1, one level up. Every
        // release-bearing field now exists if and only if `holdStatus`
        // implies it, and every offset is strictly positive off the one
        // before it, so a duration a screen renders is never zero and a
        // status never contradicts its own timestamps.
        const holdStatus = nextHoldState()
        const hasRequest = ['release-requested', 'released', 'release-propagating'].includes(holdStatus)
        const hasRelease = ['released', 'release-propagating'].includes(holdStatus)
        const requestOffset = stepOffset + int(60, 180)
        const releaseOffset = requestOffset + int(30, 120)
        generatedHolds.push({
          id: `HOLD-GEN-${tenant.code}-${i + 1}-${s + 1}`,
          targetKind: runHoldTargetKind,
          targetId: unitCount ? units[0].ref : runId,
          originatingDeviationId: devId,
          placedAt: deviceTime,
          placedByDeviceId: device.id,
          releaseRequestedAt: hasRequest ? stamp(RUN_BASELINE, day, startHour, requestOffset) : null,
          releaseRequestNote: hasRequest ? 'Requesting release with a note.' : null,
          releasedBy: hasRelease ? org.owner.id : null,
          releasedAt: hasRelease ? stamp(RUN_BASELINE, day, startHour, releaseOffset) : null,
          status: holdStatus,
        })
      }
    }
  }

  if (status === 'complete' || status === 'finished') {
    generatedSummaries.push({
      id: `SUM-GEN-${tenant.code}-${i + 1}`,
      runId,
      asOf: actualEndAt ?? plannedEndAt,
      deviationCountBySeverity: { '1': 0, '2': 0, '3': 0 },
      evidenceCompletenessPercent: int(70, 100),
      anomalyCount: int(0, 2),
      lateData: chance(0.15),
      reviewedBy: chance(0.4) ? org.owner.id : null,
      status:
        status === 'finished'
          ? pick(['closed', 'recomputed-after-finish'])
          : pick(['computed', 'recomputing', 'under-review']),
    })
  }
}

// --- reports ------------------------------------------------------------
// Report.dataSet is the closed five-set enumeration of OBJ-063
// (L9260-L9277); one report per operational tenant, cycling the five sets.
const REPORT_DATASETS = [
  'worker-utilisation-by-area',
  'run-completion-rate-by-job',
  'workflow-version-usage',
  'qualification-override-frequency-by-role',
  'tier-allocation-consumption-trend',
]
const nextReportDataset = coverageThenRandom(REPORT_DATASETS)
const generatedReports = []
for (const t of OPERATIONAL_TENANTS) {
  const org = orgByTenant.get(t.id)
  const dataSet = nextReportDataset()
  const tenantActiveJob = activeJobsByTenant.get(t.id)?.[0]
  const rows =
    dataSet === 'worker-utilisation-by-area'
      ? [{ areaId: org.area.id, utilisationPercent: int(40, 95) }]
      : dataSet === 'run-completion-rate-by-job'
        ? [{ jobId: tenantActiveJob ? tenantActiveJob.id : 'JOB-UNKNOWN', completionRate: int(60, 100) / 100 }]
        : dataSet === 'workflow-version-usage'
          ? [{ workflowDefinitionId: org.wfDefs[0].id, runCount: int(1, 40) }]
          : dataSet === 'qualification-override-frequency-by-role'
            ? [{ role: 'SUPERVISOR', overrideCount: int(0, 5) }]
            : [{ month: '2026-08', percentOfAllocation: int(50, 140) }]
  generatedReports.push({
    id: `RPT-GEN-${t.code}-1`,
    tenantId: t.id,
    dataSet,
    generatedVia: chance(0.5) ? 'on-request' : 'scheduled',
    generatedAt: '2026-08-16T06:00:00Z',
    asOf: '2026-08-16T00:00:00Z',
    rows,
  })
}

// ===========================================================================
// Task 6 — cross-cutting collections: notifications, commands, events,
// audit, schedules, ai-requests (docs/superpowers/plans/2026-08-26-runway.md,
// Task 6). Runs after Tasks 4-5's sections above, in the same script, so it
// can place every generated row against real tenants, users, runs,
// deviations, holds, jobs, devices, role-grants, qualification-grants,
// workflow-definitions and step-executions already built above -- never a
// second, disconnected population.
// ===========================================================================
const addMin = (iso, minutes) => new Date(new Date(iso).getTime() + minutes * 60000).toISOString()
const qualificationGrantsAll = readCollection('qualification-grants.json')
const roleGrantsAll = readCollection('role-grants.json')
const tenantsAll = readCollection('tenants.json')
const tenantLifecycle = new Map(tenantsAll.map((t) => [t.id, t.lifecycle]))
const allRuns = [...fx5.runs, ...generatedRuns]
const allDeviations = [...fx5.deviations, ...generatedDeviations]
const allHolds = [...fx5.holds, ...generatedHolds]
const allJobs = [...fx5.jobs, ...generatedJobs]
const workerUserId = new Map(workersAll.map((w) => [w.id, w.userId]))
const userRole = (userId) => usersAll.find((u) => u.id === userId)?.role ?? 'WORKER'
const runById = new Map(allRuns.map((r) => [r.id, r]))

// --- notifications ---------------------------------------------------------
// Notification.status is the nineteen-state ladder (L51605/NOTIFICATION_STATES).
// Only sent/delivered/opened/acknowledged fields exist on the row -- every
// field below is DERIVED from `status`, never drawn independently beside it
// (the task prompt's own Task 5 lesson), and the four honesty pairs
// (sent<delivered<opened<acknowledged<acted) are the only ordering assumed;
// the remaining twelve states are NOT ranked against each other or against
// that chain (NOTIFICATION_STATE_DISTINCTIONS is exactly these four pairs
// and no more).
const NOTIF_REACH = { // how far along the sent->delivered->opened->acknowledged chain each status implies, or 'none'
  created: 'none', eligible: 'none', queued: 'none', suppressed: 'none', cancelled: 'none', superseded: 'none',
  sent: 'sent', 'provider-accepted': 'sent', failed: 'sent',
  delivered: 'delivered', escalated: 'delivered', expired: 'delivered',
  opened: 'opened', read: 'opened', claimed: 'opened',
  acknowledged: 'acknowledged', acted: 'acknowledged', resolved: 'acknowledged', reconciled: 'acknowledged',
}
function notificationTiming(status, createdAt, recipientId) {
  const reach = NOTIF_REACH[status] ?? 'none'
  let t = createdAt
  let sentAt = null, deliveredAt = null, openedAt = null, acknowledgedAt = null, acknowledgedBy = null
  let resolvedBy = null, resolvedAt = null
  const withResolution = () => {
    // Fix round 1 (review Important 4): `resolved` needs its own distinct
    // evidence, not just its own label -- L9175 ([SoW Fact -- §3.9]) requires
    // acknowledge and resolve be distinct, timestamped states. Filled ONLY
    // when the row's own status is literally 'resolved', never inferred
    // from 'acted'/'reconciled' sharing the same acknowledged reach.
    if (status !== 'resolved') return
    t = addMin(t, int(1, 30)); resolvedBy = recipientId; resolvedAt = t
  }
  if (reach === 'none') return { sentAt, deliveredAt, openedAt, acknowledgedAt, acknowledgedBy, resolvedBy, resolvedAt }
  t = addMin(t, int(1, 5)); sentAt = t
  if (reach === 'sent') return { sentAt, deliveredAt, openedAt, acknowledgedAt, acknowledgedBy, resolvedBy, resolvedAt }
  t = addMin(t, int(1, 10)); deliveredAt = t
  if (reach === 'delivered') return { sentAt, deliveredAt, openedAt, acknowledgedAt, acknowledgedBy, resolvedBy, resolvedAt }
  t = addMin(t, int(1, 120)); openedAt = t
  if (reach === 'opened') return { sentAt, deliveredAt, openedAt, acknowledgedAt, acknowledgedBy, resolvedBy, resolvedAt }
  t = addMin(t, int(1, 60)); acknowledgedAt = t; acknowledgedBy = recipientId
  withResolution()
  return { sentAt, deliveredAt, openedAt, acknowledgedAt, acknowledgedBy, resolvedBy, resolvedAt }
}
const nextNotifState = coverageThenRandom(NOTIFICATION_STATES)
const generatedNotifications = []
const GEN_NOTIF_COUNT = 55
for (let i = 0; i < GEN_NOTIF_COUNT; i++) {
  const tenant = TENANTS[i % TENANTS.length]
  const candidates = usersAll.filter((u) => u.tenantId === tenant.id)
  if (!candidates.length) continue
  const recipient = pick(candidates)
  const status = nextNotifState()
  const day = int(0, 220)
  const createdAt = stamp('2026-01-05T00:00:00Z', day, int(0, 20), int(0, 59))
  const timing = notificationTiming(status, createdAt, recipient.id)
  generatedNotifications.push({
    id: `NOTIF-GEN-${tenant.code}-${i + 1}`,
    tenantId: tenant.id,
    eventId: null,
    severity: pick(['Critical', 'High', 'Medium', 'Informational']),
    recipientRoleIds: [recipient.role],
    recipientUserIds: [recipient.id],
    channels: pick([['in-app'], ['email'], ['in-app', 'email']]),
    createdAt,
    ...timing,
    fallbackDelivered: timing.deliveredAt !== null && chance(0.05),
    deduplicationGroup: (status === 'superseded' || status === 'suppressed') ? `dedup:${tenant.code}:${i}` : null,
    status,
  })
}

// --- commands ----------------------------------------------------------
// Command.status is the fifteen-state COMMAND_STATES ladder; per-device
// `deliveries[].status` is the DeviceDeliveryState subset (crosscutting.ts).
// Every delivery timestamp is derived from that row's own `status`, never
// independently drawn -- same lesson as notifications above.
const CENTRAL_ONLY_COMMAND_STATES = new Set(['created', 'authorized', 'cancelled', 'superseded', 'reconciled'])
const DEVICE_DELIVERY_STATES = COMMAND_STATES.filter((s) => !CENTRAL_ONLY_COMMAND_STATES.has(s))
const DEVICE_PROGRESS = ['delivered', 'downloaded', 'validated', 'applied', 'acknowledged']
function deviceDeliveryFields(devStatus, baseIso) {
  let t = baseIso
  let deliveredAt = null, downloadedAt = null, appliedAt = null, acknowledgedAt = null, rejectedReason = null
  const reach = DEVICE_PROGRESS.indexOf(devStatus)
  if (reach >= 0) {
    t = addMin(t, int(1, 5)); deliveredAt = t
    if (reach >= DEVICE_PROGRESS.indexOf('downloaded')) { t = addMin(t, int(1, 5)); downloadedAt = t }
    if (reach >= DEVICE_PROGRESS.indexOf('applied')) { t = addMin(t, int(1, 5)); appliedAt = t }
    if (reach >= DEVICE_PROGRESS.indexOf('acknowledged')) { t = addMin(t, int(1, 5)); acknowledgedAt = t }
  } else if (devStatus === 'rejected') {
    deliveredAt = addMin(t, int(1, 5)); downloadedAt = addMin(deliveredAt, int(1, 5))
    rejectedReason = 'Device policy validation failed against the delivered payload version.'
  } else if (devStatus === 'failed') {
    deliveredAt = addMin(t, int(1, 5))
  } else if (devStatus === 'expired') {
    deliveredAt = addMin(t, int(1, 5)) // reached the channel, never picked up before expiry
  }
  return { deliveredAt, downloadedAt, appliedAt, acknowledgedAt, rejectedReason }
}
function deviceStatusFor(commandStatus, isFirst) {
  switch (commandStatus) {
    case 'delivered': return pick(['queued', 'available for delivery', 'delivered'])
    case 'downloaded': return pick(['delivered', 'downloaded'])
    case 'validated': return pick(['downloaded', 'validated'])
    case 'applied': return isFirst ? 'applied' : pick(['queued', 'delivered', 'downloaded', 'validated', 'applied'])
    case 'acknowledged': return isFirst ? 'acknowledged' : pick(['delivered', 'downloaded', 'validated', 'applied', 'acknowledged'])
    case 'rejected': return isFirst ? 'rejected' : 'delivered'
    case 'failed': return isFirst ? 'failed' : 'queued'
    case 'expired': return isFirst ? 'expired' : 'queued'
    default: return 'queued' // 'available for delivery' central state: nothing device-side yet
  }
}
const nextCommandState = coverageThenRandom(COMMAND_STATES)
const generatedCommands = []
const GEN_CMD_COUNT = 40
for (let i = 0; i < GEN_CMD_COUNT; i++) {
  const tenant = OPERATIONAL_TENANTS[i % OPERATIONAL_TENANTS.length]
  const org = orgByTenant.get(tenant.id)
  if (!org.devices.length) continue
  const status = nextCommandState()
  const cls = pick(['lot-release', 'reassignment-or-substitution', 'qualification-clearance', 'suspension', 'version-change'])
  const day = int(0, 220)
  const createdAt = stamp('2026-01-05T00:00:00Z', day, int(0, 20), int(0, 59))
  const single = cls === 'qualification-clearance' || cls === 'suspension' || org.devices.length === 1
  const deviceCount = CENTRAL_ONLY_COMMAND_STATES.has(status) ? 0 : single ? 1 : int(1, Math.min(3, org.devices.length))
  const deliveries = []
  for (let d = 0; d < deviceCount; d++) {
    const device = org.devices[d % org.devices.length]
    const devStatus = deviceStatusFor(status, d === 0)
    deliveries.push({ deviceId: device.id, status: devStatus, ...deviceDeliveryFields(devStatus, createdAt) })
  }
  generatedCommands.push({
    id: `CMD-GEN-${tenant.code}-${i + 1}`,
    tenantId: tenant.id,
    class: cls,
    targetDeviceId: deviceCount === 1 ? deliveries[0].deviceId : null,
    targetFleetTag: deviceCount > 1 ? `FLEET-${tenant.code}-${org.area.id}` : null,
    payloadRef: `CMD-PAYLOAD-GEN-${tenant.code}-${i + 1}`,
    issuedBy: org.owner.id,
    createdAt,
    acknowledgedAt: deviceCount === 1 ? (deliveries[0].acknowledgedAt ?? null) : null,
    deliveries,
    status,
  })
}
// Full per-device DeviceDeliveryState coverage, forced by construction
// rather than left to `deviceStatusFor`'s own random pick (fix: the ten
// device-facing states were reachable but not guaranteed reachable — the
// exact "state permitted, seed never constructs it" trap the task brief
// itself names). One coverage-only command, one device per state.
{
  const tenant = OPERATIONAL_TENANTS[0]
  const org = orgByTenant.get(tenant.id)
  const createdAt = stamp('2026-01-05T00:00:00Z', 210, 8, 0)
  const deliveries = DEVICE_DELIVERY_STATES.map((devStatus, idx) => ({
    deviceId: org.devices[idx % org.devices.length].id,
    status: devStatus,
    ...deviceDeliveryFields(devStatus, createdAt),
  }))
  generatedCommands.push({
    id: 'CMD-GEN-DEVICE-COVERAGE',
    tenantId: tenant.id,
    class: 'version-change',
    targetDeviceId: null,
    targetFleetTag: `FLEET-${tenant.code}-DEVICE-COVERAGE`,
    payloadRef: 'CMD-PAYLOAD-GEN-DEVICE-COVERAGE',
    issuedBy: org.owner.id,
    createdAt,
    acknowledgedAt: null,
    deliveries,
    status: 'applied',
  })
}

// --- events --------------------------------------------------------------
const OP_EVENT_STATES = ['recorded', 'uploaded', 'accepted']
const nextOpEventState = coverageThenRandom(OP_EVENT_STATES)
const SYNC_EVENT_STATES = ['attempted', 'partial', 'complete', 'failed']
const nextSyncEventState = coverageThenRandom(SYNC_EVENT_STATES)
const generatedEvents = []
const stepSample = generatedStepExecutions.filter((_, i) => i % 7 === 0)
for (const se of stepSample) {
  const run = runById.get(se.runId)
  if (!run) continue
  const status = nextOpEventState()
  generatedEvents.push({
    id: `EVT-GEN-OP-${se.id}`,
    kind: 'operational',
    tenantId: run.tenantId,
    actorId: workerUserId.get(se.workerId) ?? usersAll.find((u) => u.tenantId === run.tenantId)?.id ?? 'USR-ROOT-01',
    siteId: se.siteId,
    areaId: se.areaId,
    occurredAt: se.deviceTime,
    signalType: pick(['step-execution-completed', 'gate-evaluation', 'device-sync-marker']),
    runId: run.id,
    stepExecutionId: se.id,
    status,
  })
}
for (const device of devicesAll) {
  const status = nextSyncEventState()
  const day = int(0, 220)
  generatedEvents.push({
    id: `EVT-GEN-SYNC-${device.id}`,
    kind: 'sync',
    deviceId: device.id,
    attemptedAt: stamp('2026-01-05T00:00:00Z', day, int(0, 20), int(0, 59)),
    capturesUploaded: status === 'failed' ? 0 : int(0, 3),
    commandsDownloaded: status === 'failed' ? 0 : int(0, 2),
    commandsApplied: status === 'failed' || status === 'partial' ? 0 : int(0, 2),
    queueDepthRemaining: status === 'complete' ? 0 : int(0, 3),
    clockSkewSeconds: status === 'failed' ? null : int(0, 8),
    status,
  })
}

// --- schedules -------------------------------------------------------------
// The seven end-to-end examples (fx6.schedules) are hand-authored; this
// fills the remaining SCHEDULE_DEFINITION_STATES (ten) and
// SCHEDULE_OCCURRENCE_STATES (fifteen) coverage across the rest of the
// tenant population, per master prompt §19.2's own scheduled-work classes
// (digest, storage tiering, anonymisation, drift canary, usage ladder).
const GEN_SCHED_DEF_NAMES = [
  'digest.shift-summary', 'platform.storage-tiering', 'platform.anonymisation-sweep',
  'platform.drift-canary', 'platform.usage-ladder-check', 'qualification.clearance-expiry-reblock',
  'tenant.pilot-expiry-check', 'device.fleet-heartbeat-sweep', 'report.custom-export-retry',
  'notification.digest-resend',
]
const nextSchedDefState = coverageThenRandom(SCHEDULE_DEFINITION_STATES)
const generatedScheduleDefs = []
for (let i = 0; i < GEN_SCHED_DEF_NAMES.length; i++) {
  const tenant = TENANTS[i % TENANTS.length]
  const state = nextSchedDefState()
  generatedScheduleDefs.push({
    id: `SCHED-GEN-${i + 1}`,
    kind: 'definition',
    workIdentity: GEN_SCHED_DEF_NAMES[i],
    cadenceExpression: pick(['daily at 03:00 tenant-local', 'hourly', 'weekly on Sunday at 02:00 tenant-local', 'continuous']),
    timezone: tenant.locale === 'es' ? 'America/Mexico_City' : 'America/Chicago',
    misfirePolicy: pick(['fire-once-on-recovery', 'catch-up-next-tick-mark-late', 'durable-redrive-preserve-due-time']),
    overlapPolicy: pick(['skip', 'queue']),
    retryPolicy: pick(['retry-3x-backoff', 'redrive-until-succeeded', 'none']),
    idempotencyKeyTemplate: `${GEN_SCHED_DEF_NAMES[i]}+tenant+date`,
    blastRadiusBounds: pick(['tenant-wide', 'single-site', 'all-tenants']),
    enabled: state !== 'retired' && state !== 'archived',
    status: state,
  })
}
const allScheduleDefs = [...fx6.schedules.filter((s) => s.kind === 'definition'), ...generatedScheduleDefs]
const nextSchedOccState = coverageThenRandom(SCHEDULE_OCCURRENCE_STATES)
const generatedScheduleOccs = []
const GEN_OCC_COUNT = 40
for (let i = 0; i < GEN_OCC_COUNT; i++) {
  const def = allScheduleDefs[i % allScheduleDefs.length]
  const state = nextSchedOccState()
  const day = int(0, 220)
  const dueAt = stamp('2026-01-05T00:00:00Z', day, int(0, 20), int(0, 59))
  const claimed = ['claimed', 'executing', 'partially-executed', 'succeeded', 'failed-retryable', 'dead-lettered'].includes(state)
  generatedScheduleOccs.push({
    id: `SCHEDOCC-GEN-${i + 1}`,
    kind: 'occurrence',
    definitionId: def.id,
    dueAt,
    timezone: def.timezone,
    idempotencyKey: `${def.workIdentity}+${dueAt.slice(0, 10)}+${i}`,
    claimedBy: claimed ? 'SYSTEM' : null,
    outcomeRef: state === 'succeeded' ? `OUTCOME-GEN-${i + 1}` : null,
    status: state,
  })
}

// --- ai-requests -----------------------------------------------------------
const AI_STATES = ['issued', 'routed', 'failed-over', 'completed', 'cached']
const AI_ROUTER_ROLES = ['primary', 'fallback', 'lightweight', 'embedding']
const nextAiState = coverageThenRandom(AI_STATES)
const nextAiRouter = coverageThenRandom(AI_ROUTER_ROLES)
const generatedAiRequests = []
const GEN_AI_COUNT = 36
for (let i = 0; i < GEN_AI_COUNT; i++) {
  const tenant = TENANTS[i % TENANTS.length]
  const status = nextAiState()
  const routerRole = nextAiRouter()
  const day = int(0, 220)
  generatedAiRequests.push({
    id: `AI-GEN-${tenant.code}-${i + 1}`,
    tenantId: tenant.id,
    routerRole,
    promptTokens: int(80, 3000),
    completionTokens: status === 'failed-over' || status === 'issued' || status === 'routed' ? 0 : int(10, 800),
    latencyMs: status === 'cached' ? int(20, 150) : int(200, 12000),
    deterministic: chance(0.3),
    semanticCacheHit: status === 'cached',
    createdAt: stamp('2026-01-05T00:00:00Z', day, int(0, 20), int(0, 59)),
    status,
  })
}

// --- audit -------------------------------------------------------------
// >= 400 rows drawn from every other collection already generated above,
// each carrying actor/effectiveRole/scope/correlationId/causationId
// (crosscutting.ts). Causation is only chained where a real upstream
// audit row is in scope (run -> deviation -> hold); everywhere else a null
// causationId is the honest statement that no upstream action is modelled,
// not a gap. See scripts/seed-fixtures/task6-crosscutting.mjs for the four
// named categories (denial, fallback entry, scoped support action,
// compliance-emergency access), already hand-authored.
const generatedAudit = []
let auditSeq = 0
const nextAuditId = () => `AUD-GEN-${String(++auditSeq).padStart(4, '0')}`
function pushAudit(row) { generatedAudit.push({ id: nextAuditId(), ...row }); return generatedAudit[generatedAudit.length - 1].id }

const runAuditId = new Map()
for (const run of allRuns) {
  const job = allJobs.find((j) => j.id === run.jobId)
  const actorId = job?.ownerUserId ?? usersAll.find((u) => u.tenantId === run.tenantId)?.id ?? 'USR-ROOT-01'
  const id = pushAudit({
    tenantId: run.tenantId,
    actorId,
    effectiveRole: userRole(actorId),
    scope: { siteIds: [run.siteId], areaIds: [run.areaId] },
    action: 'run.status-transition',
    result: 'success',
    denialReason: null,
    subjectRef: run.id,
    occurredAt: run.actualStartAt ?? run.plannedStartAt,
    before: null,
    after: { status: run.status },
    auditClass: 'run-state-transition',
    correlationId: `COR-RUN-${run.id}`,
    causationId: null,
  })
  runAuditId.set(run.id, id)
}

const deviationAuditId = new Map()
for (const dev of allDeviations) {
  const run = runById.get(dev.runId)
  const actorId = workerUserId.get(dev.workerId) ?? usersAll.find((u) => u.tenantId === dev.tenantId)?.id ?? 'USR-ROOT-01'
  const id = pushAudit({
    tenantId: dev.tenantId,
    actorId,
    effectiveRole: 'WORKER',
    scope: { siteIds: run ? [run.siteId] : [], areaIds: run ? [run.areaId] : [] },
    action: 'deviation.classified',
    result: 'success',
    denialReason: null,
    subjectRef: dev.id,
    occurredAt: run?.actualStartAt ?? '2026-01-05T00:00:00Z',
    before: null,
    after: { severityBand: dev.severityBand, status: dev.status },
    auditClass: 'run-state-transition',
    correlationId: `COR-DEV-${dev.id}`,
    causationId: runAuditId.get(dev.runId) ?? null,
  })
  deviationAuditId.set(dev.id, id)
}

for (const hold of allHolds) {
  const dev = allDeviations.find((d) => d.id === hold.originatingDeviationId)
  const placedId = pushAudit({
    tenantId: dev?.tenantId ?? 'TEN-BRIGHTBIKES',
    actorId: workerUserId.get(dev?.workerId) ?? 'USR-ROOT-01',
    effectiveRole: 'WORKER',
    scope: { siteIds: [], areaIds: [] },
    action: 'hold.placed',
    result: 'success',
    denialReason: null,
    subjectRef: hold.id,
    occurredAt: hold.placedAt,
    before: null,
    after: { status: 'issued', targetKind: hold.targetKind },
    auditClass: 'run-state-transition',
    correlationId: `COR-HOLD-${hold.id}`,
    causationId: deviationAuditId.get(hold.originatingDeviationId) ?? null,
  })
  if (hold.releasedAt) {
    pushAudit({
      tenantId: dev?.tenantId ?? 'TEN-BRIGHTBIKES',
      actorId: hold.releasedBy,
      effectiveRole: userRole(hold.releasedBy),
      scope: { siteIds: [], areaIds: [] },
      action: 'hold.released',
      result: 'success',
      denialReason: null,
      subjectRef: hold.id,
      occurredAt: hold.releasedAt,
      before: { status: 'release-requested' },
      after: { status: hold.status },
      auditClass: 'run-state-transition',
      correlationId: `COR-HOLD-${hold.id}`,
      causationId: placedId,
    })
  }
}

for (const job of allJobs) {
  pushAudit({
    tenantId: job.tenantId,
    actorId: job.ownerUserId,
    effectiveRole: userRole(job.ownerUserId),
    scope: { siteIds: [job.siteId], areaIds: [job.areaId] },
    action: 'job.status-transition',
    result: 'success',
    denialReason: null,
    subjectRef: job.id,
    occurredAt: '2026-01-05T00:00:00Z',
    before: null,
    after: { status: job.status },
    auditClass: 'run-state-transition',
    correlationId: `COR-JOB-${job.id}`,
    causationId: null,
  })
}

for (const grant of qualificationGrantsAll) {
  const worker = workersAll.find((w) => w.id === grant.workerId)
  pushAudit({
    tenantId: worker?.tenantId ?? null,
    actorId: grant.grantedBy,
    effectiveRole: userRole(grant.grantedBy),
    scope: { siteIds: [], areaIds: grant.areaId ? [grant.areaId] : [] },
    action: 'clearance.granted',
    result: 'success',
    denialReason: null,
    subjectRef: grant.id,
    occurredAt: grant.grantedAt,
    before: null,
    after: { status: grant.status, reasonCategory: grant.reasonCategory },
    auditClass: 'clearance-grant-use-lapse',
    correlationId: `COR-QGR-${grant.id}`,
    causationId: null,
  })
  if (grant.lapsedAt) {
    pushAudit({
      tenantId: worker?.tenantId ?? null,
      actorId: 'USR-ROOT-01', // automated platform action; attributed to the backend-created root identity, per L8356's own framing of provisioning/system events as audited under a real identity
      effectiveRole: userRole(grant.grantedBy),
      scope: { siteIds: [], areaIds: grant.areaId ? [grant.areaId] : [] },
      action: 'clearance.lapsed',
      result: 'success',
      denialReason: null,
      subjectRef: grant.id,
      occurredAt: grant.lapsedAt,
      before: { status: 'in-force' },
      after: { status: 'lapsed' },
      auditClass: 'clearance-grant-use-lapse',
      correlationId: `COR-QGR-${grant.id}`,
      causationId: null,
    })
  }
}

for (const wfd of allWfDefs) {
  if (!['published', 'superseded', 'rolled-back', 'archived'].includes(wfd.status)) continue
  const author = usersAll.find((u) => u.tenantId === wfd.tenantId && u.role === 'QUALITY_MANAGER')
    ?? usersAll.find((u) => u.tenantId === wfd.tenantId)
  if (!author) continue
  pushAudit({
    tenantId: wfd.tenantId,
    actorId: author.id,
    effectiveRole: userRole(author.id),
    scope: { siteIds: [], areaIds: [] },
    action: 'workflow-definition.published',
    result: 'success',
    denialReason: null,
    subjectRef: wfd.id,
    occurredAt: '2026-01-05T00:00:00Z',
    before: null,
    after: { version: wfd.version, status: wfd.status },
    auditClass: 'work-instruction-or-media-version-published',
    correlationId: `COR-WFD-${wfd.id}`,
    causationId: null,
  })
}

for (const tenant of TENANTS) {
  pushAudit({
    tenantId: tenant.id,
    actorId: 'USR-PLAT-ADM-01',
    effectiveRole: 'ADMIN',
    scope: { siteIds: [], areaIds: [] },
    action: 'tenant.state-transition',
    result: 'success',
    denialReason: null,
    subjectRef: tenant.id,
    occurredAt: '2026-01-05T00:00:00Z',
    before: null,
    after: { lifecycle: tenantLifecycle.get(tenant.id) ?? 'active' },
    auditClass: 'tenant-state-transition',
    correlationId: `COR-TEN-${tenant.id}`,
    causationId: null,
  })
}

for (const grant of roleGrantsAll) {
  pushAudit({
    tenantId: usersAll.find((u) => u.id === grant.userId)?.tenantId ?? null,
    actorId: grant.grantedBy,
    effectiveRole: userRole(grant.grantedBy),
    scope: { siteIds: grant.siteIds ?? [], areaIds: grant.areaIds ?? [] },
    action: 'permission-change.role-granted',
    result: 'success',
    denialReason: null,
    subjectRef: grant.id,
    occurredAt: grant.grantedAt,
    before: null,
    after: { role: grant.role },
    auditClass: 'permission-change',
    correlationId: `COR-RG-${grant.id}`,
    causationId: null,
  })
}

for (const device of devicesAll) {
  pushAudit({
    tenantId: device.tenantId,
    actorId: device.enrolledBy,
    effectiveRole: userRole(device.enrolledBy),
    scope: { siteIds: [], areaIds: [] },
    action: 'device.enrollment',
    result: 'success',
    denialReason: null,
    subjectRef: device.id,
    occurredAt: device.enrolledAt,
    before: null,
    after: { status: device.status, mode: device.mode },
    auditClass: 'configuration-change',
    correlationId: `COR-DEVICE-${device.id}`,
    causationId: null,
  })
}

const captureSample = generatedCaptures.filter((_, i) => i % 6 === 0)
for (const cap of captureSample) {
  pushAudit({
    tenantId: runById.get(cap.runId)?.tenantId ?? null,
    actorId: workerUserId.get(cap.workerId) ?? 'USR-ROOT-01',
    effectiveRole: 'WORKER',
    scope: { siteIds: cap.siteId ? [cap.siteId] : [], areaIds: cap.areaId ? [cap.areaId] : [] },
    action: 'capture.accepted',
    result: 'success',
    denialReason: null,
    subjectRef: cap.id,
    occurredAt: cap.deviceTime,
    before: null,
    after: { status: cap.status, inSpecification: cap.inSpecification },
    auditClass: 'data-capture',
    correlationId: `COR-CAP-${cap.id}`,
    causationId: null,
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
  'jobs.json': [...fx5.jobs, ...generatedJobs],
  'runs.json': [...fx5.runs, ...generatedRuns],
  'unit-executions.json': [...fx5.unitExecutions, ...generatedUnitExecutions],
  'step-executions.json': [...fx5.stepExecutions, ...generatedStepExecutions],
  'captures.json': [...fx5.captures, ...generatedCaptures],
  'evidence.json': [...fx5.evidence, ...generatedEvidence],
  'deviations.json': [...fx5.deviations, ...generatedDeviations],
  'holds.json': [...fx5.holds, ...generatedHolds],
  'summaries.json': generatedSummaries,
  'reports.json': generatedReports,
  'notifications.json': [...fx6.notifications, ...generatedNotifications],
  'commands.json': [...fx6.commands, ...generatedCommands],
  'events.json': [...fx6.events, ...generatedEvents],
  'audit.json': [...fx6.audit, ...generatedAudit],
  'schedules.json': [...fx6.schedules, ...generatedScheduleDefs, ...generatedScheduleOccs],
  'ai-requests.json': [...fx6.aiRequests, ...generatedAiRequests],
}

for (const [file, rows] of Object.entries(collections)) {
  writeFileSync(join(OUT, file), JSON.stringify(rows, null, 2) + '\n')
  console.log(`wrote ${file.padEnd(28)} ${String(rows.length).padStart(4)} rows`)
}
console.log(`\nseed ${SEED} — deterministic, no Math.random(), no Date.now()`)
