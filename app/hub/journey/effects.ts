import { affected, noEffect, type JourneyStep } from '@/ui/shared/journey'
import {
  INITIAL_RUN,
  JOURNEY_INSTANTS,
  MET,
  MINUTE_MS,
  notMet,
  WINDOW_ELAPSES_AT_MS,
  type HubJourneyStepTransition,
} from './fixture'

/**
 * The nine operational steps and their five-surface effects.
 *
 * WHAT AN EFFECT ROW IS ALLOWED TO BE. An action's effect is visible on every
 * surface it touches and HONESTLY ABSENT on the ones it does not, so there is
 * no blank cell below and no empty string: a surface with no effect carries
 * `kind: 'noDirectEffect'` **and a reason**, and `effectStatement` makes an
 * empty sentence unrepresentable rather than merely discouraged.
 *
 * WHERE THE SENTENCES COME FROM. Four of the nine steps sit squarely inside a
 * `WF-` card that states its own five-surface row, and those rows are quoted
 * at their own locators — `WF-ORG-004` L52667, `WF-EXE-001` L53798,
 * `WF-AUT-010` L53679, `WF-QLT-005` L54202, plus `WF-EXE-003` L53864 for the
 * step the device performs. The remaining steps — scheduling the run, the
 * Summary computing, the window elapsing — belong to no card that states five
 * surfaces, so each cell is quoted from the module identity card or the
 * happy-path line that governs it, and cites that line. Nothing below is a
 * sentence this build composed out of nothing.
 *
 * WHAT NO STEP DOES. None of the nine branches on `submitted` or `complete`.
 * The two words appear in the prose below exactly where the source's own
 * closing-state table puts them, always attributed and always alongside the
 * statement that `DEC-RUNSTATE-001` leaves them defined three ways. Every
 * `requires` and every `produces` reads and writes INSTANTS.
 */

export type HubJourneyStep = JourneyStep & HubJourneyStepTransition

/* ── reasons that recur, quoted once ───────────────────────────────────── */

const FL_BEFORE_ASSIGNMENT = noEffect(
  'nothing reaches a device until a run is assigned — a Job’s effects reach devices only through runs and their pinned work packages',
  'L52664, L52667',
)
const CC_CANNOT_CREATE = noEffect(
  'the Client Command Center cannot create Jobs at all and cannot create runs, only reassign existing ones; it observes runs of active Jobs',
  'L52667, L53793',
)

export const JOURNEY_STEPS = [
  {
    number: 1,
    title: 'Draft the Job and submit it',
    workflowRef: 'WF-ORG-004',
    sourceRef: 'L52661 steps 1-4 · L52672',
    ownerModule: 'MOD-DOH-05 — Job Lifecycle and Approval',
    actingSurface: 'DOH',
    note: null,
    effects: {
      DOH: affected(
        'The Job record, its state machine, its approval trail and its version history. Sam opens Job Lifecycle and Approval, fills the definition and submits; the Job enters pending_approval.',
        'L52667, L52661',
      ),
      STU: affected(
        'The linkage view shows which Jobs and Runs sit on each workflow version, so a Job referencing v2.1.0 is visible against that version there.',
        'L52667',
      ),
      CC: CC_CANNOT_CREATE,
      FL: FL_BEFORE_ASSIGNMENT,
      SA: affected(
        'The tenant detail Operations tab shows active and total Jobs with each Job Owner field, read-only.',
        'L52667',
      ),
    },
    requires: (s) =>
      s.job.state === 'draft' ? MET : notMet(`the Job is already ${s.job.state}`),
    produces: (s) => ({
      ...s,
      atMs: JOURNEY_INSTANTS.draftedAtMs,
      job: { ...s.job, state: 'pending_approval' },
    }),
  },

  {
    number: 2,
    title: 'A second person approves it',
    workflowRef: 'WF-ORG-004',
    sourceRef: 'L52661 steps 5-7 · L52662 · L52670',
    ownerModule: 'MOD-DOH-05 — Job Lifecycle and Approval',
    actingSurface: 'DOH',
    note:
      'The creator is never offered an approve control on their own Job, and where the creator also holds the approver role the platform routes to a second qualified approver (L52662). Segregation of duties is absolute and does not lapse.',
    effects: {
      DOH: affected(
        'The approval trail records the approver identity and the approval with its comments; the Job becomes active and is available for run creation.',
        'L52667, L52669, L52661',
      ),
      STU: affected(
        'The linkage view now shows an ACTIVE Job sitting on that workflow version, which is what an adoption decision will later route against.',
        'L52667',
      ),
      CC: affected(
        'It cannot create Jobs at all; it observes runs of active Jobs, and this Job has just become one.',
        'L52667',
      ),
      FL: FL_BEFORE_ASSIGNMENT,
      SA: affected(
        'The tenant detail Operations tab moves this Job from total into active, with its Job Owner field, read-only.',
        'L52667',
      ),
    },
    requires: (s) =>
      s.job.state === 'pending_approval'
        ? MET
        : notMet(`a Job in ${s.job.state} is not routed to an approver`),
    produces: (s) => ({
      ...s,
      atMs: JOURNEY_INSTANTS.approvedAtMs,
      job: { ...s.job, state: 'active' },
    }),
  },

  {
    number: 3,
    title: 'Schedule the run',
    workflowRef: 'WF-EXE-001, upstream of it — the source names no workflow for run creation itself',
    sourceRef: 'L27924-L27925 · L27897',
    ownerModule: 'MOD-DOH-06 — Run Scheduling and Execution Oversight',
    actingSurface: 'DOH',
    note:
      'Run creation at V1 is manual, by supervisors; auto-scheduling is deferred beyond V1 and the auto_scheduled source value is reserved for it, so DOH_SCHEDULE_RUN cannot express any other source (L27925).',
    effects: {
      DOH: affected(
        'A run record with denormalised context, and the schedule view: today plus 7 days, role-scoped and filterable by Job, Site, Area and Worker.',
        'L27897, L27924',
      ),
      STU: noEffect(
        'creating a run pins no version — the pin is taken at assignment — so the linkage view showing runs per version has nothing to show for this run yet',
        'L53679, L27926',
      ),
      CC: CC_CANNOT_CREATE,
      FL: noEffect(
        'the run appears in My Runs when delivered, and delivery follows assignment; a run with nobody assigned reaches no device',
        'L53798',
      ),
      SA: noEffect(
        'Worker-Shift consumption begins accruing at assignment, so a scheduled run with nobody assigned moves no meter',
        'L53798',
      ),
    },
    requires: (s) =>
      s.job.state === 'active'
        ? MET
        : notMet(`runs may not be created against a Job in ${s.job.state}`),
    produces: (s) => ({
      ...s,
      atMs: JOURNEY_INSTANTS.scheduledAtMs,
      // Built FROM the state rather than from a constant, so the run cannot
      // carry a Job or a node binding the journey never approved.
      run: { ...INITIAL_RUN, jobName: s.job.name, areaId: s.job.parentNodeId },
    }),
  },

  {
    number: 4,
    title: 'Assign the workers',
    workflowRef: 'WF-EXE-001',
    sourceRef: 'L53792 · L53798 · L53803',
    ownerModule: 'MOD-DOH-07 — Worker Assignment',
    actingSurface: 'DOH',
    note:
      'Worker self-assignment is impossible at V1 and a Supervisor outside the Area’s scope is refused (L53793). Concurrency is unlimited, with attribution by individual identity (L53801).',
    effects: {
      DOH: affected(
        'Assignment record, qualification result, audit. The platform validates qualifications against the Job’s requirements under the tenant posture before it agrees.',
        'L53798, L53792',
      ),
      STU: affected('The workflow version being pinned.', 'L53798'),
      CC: affected(
        'Action 8 reassignment mid-shift, Supervisor and above — the same service with identical rules; it cannot create the run it reassigns.',
        'L53798, L53793',
      ),
      FL: affected(
        'The run appears in My Runs when delivered, at pre-sync or lazy pull.',
        'L53798, L53792',
      ),
      SA: affected('Worker-Shift consumption begins accruing.', 'L53798'),
    },
    requires: (s) =>
      s.run === null
        ? notMet('there is no run to assign anybody to')
        : s.run.facts.startedAtMs === null
          ? MET
          : notMet('the run has already started'),
    produces: (s) => ({ ...s, atMs: JOURNEY_INSTANTS.assignedAtMs }),
  },

  {
    number: 5,
    title: 'The package pins',
    workflowRef: 'WF-AUT-010',
    sourceRef: 'L53668-L53698 · L53673 · L53675 · L53684',
    ownerModule: 'MOD-DOH-06 — Run Scheduling and Execution Oversight',
    actingSurface: 'DOH',
    note:
      'The pin is a Delivery Operations Hub act. Slice 5 built the publication half in the Standards and Operations Studio and never fires a build (L33823, L53668); this is the other half. It is taken BEFORE the download, which is why a failed download is a readiness problem and never a version ambiguity (L53696).',
    effects: {
      DOH: affected(
        'The run record with its immutable pin. The package identifier is written to the run record as its pin at the moment of assignment.',
        'L53679, L53673',
      ),
      STU: affected('The linkage view showing runs per version.', 'L53679'),
      CC: affected('The run’s version is shown alongside its deviations.', 'L53679'),
      FL: affected(
        'The pinned package is what executes — but only once the device holds it. Until the download completes the run is assigned-not-ready and cannot start: a run with a pin but no package must never begin.',
        'L53679, L53675',
      ),
      SA: affected('Per-run pinned versions in the device package inventory.', 'L53679'),
    },
    requires: (s) =>
      s.run === null
        ? notMet('there is no run to pin a package to')
        : s.run.packagePin.trim() === ''
          ? notMet('an assignment with no pinnable package leaves the run not ready')
          : MET,
    produces: (s) => ({ ...s, atMs: JOURNEY_INSTANTS.pinnedAtMs }),
  },

  {
    number: 6,
    title: 'The shift runs, and the last worker hands in',
    workflowRef: 'WF-EXE-002 into WF-EXE-003 and WF-EXE-005',
    sourceRef: 'L25726 · L27928-L27929 · L53864',
    ownerModule: 'MOD-FL-A3 — the step player, on the Frontline Worker Application',
    actingSurface: 'FL',
    note:
      'Nothing on this step is an act of the Delivery Operations Hub. Step execution, data capture, offline operation and device modes are row 8 of the eight-row boundary register: the Hub files every resulting capture event as the official record and carries neither the user interface nor the decision rights (L25726, L25715). Pausing or stopping a run is deliberately impossible from any oversight surface (L27916), so this Hub screen watches and cannot intervene.',
    effects: {
      DOH: affected(
        'Step executions and data captures land as the official record.',
        'L53864, L25726',
      ),
      STU: affected('The authored content being executed.', 'L53864'),
      CC: affected(
        'The live shift board with freshness markers and the pace margin, 15 percent by default before a run shows behind.',
        'L53864',
      ),
      FL: affected('The player itself.', 'L53864'),
      SA: affected('Capture volumes and sync health as telemetry.', 'L53864'),
    },
    requires: (s) =>
      s.run === null
        ? notMet('there is no run to execute')
        : s.run.packagePin.trim() === ''
          ? notMet('a run with a pin but no package must never begin')
          : MET,
    produces: (s) => ({
      ...s,
      atMs: JOURNEY_INSTANTS.executionEndedAtMs,
      run:
        s.run === null
          ? null
          : {
              ...s.run,
              packageOnDevice: true,
              devicesSynced: s.run.workerHandoffs.length,
              workerHandoffs: s.run.workerHandoffs.map((w, i) => ({
                ...w,
                handedOffAtMs: JOURNEY_INSTANTS.executionEndedAtMs - (i === 0 ? 40 : 5) * MINUTE_MS,
              })),
              facts: { ...s.run.facts, startedAtMs: JOURNEY_INSTANTS.runScheduledStartMs },
            },
    }),
  },

  {
    number: 7,
    title: 'The Execution Summary computes and the finish window opens',
    workflowRef: null,
    sourceRef: 'L27930 · L28267 · L28288',
    ownerModule: 'MOD-DOH-08 — Execution Summary Review and Distribution',
    actingSurface: 'DOH',
    note:
      'The source’s closing-state table calls the instant this step turns on `complete` (L27879). DEC-RUNSTATE-001 leaves that word defined three different ways, so this step writes an INSTANT — the anchor the finish window runs from, which all three readings agree exists — and the run board renders all three readings and adopts none.',
    effects: {
      DOH: affected(
        'The computed Summary — a computed view, not a stored document — and the review queue with aging highlights at 24, 48 and 72 hours.',
        'L28267, L28288',
      ),
      STU: noEffect(
        'the Studio holds the authored content that was executed and nothing about the record of having executed it',
        'L53864',
      ),
      CC: noEffect(
        'the mark-evidence-reviewed and lot-release decisions are Client Command Center actions executed through Hub services, and neither of them is the computation',
        'L28285',
      ),
      FL: noEffect(
        'the device has handed its captures up; the Summary is computed from capture events server-side and no device holds one',
        'L28287',
      ),
      SA: affected('Anomaly counts reach the console as telemetry, never contents.', 'L54202'),
    },
    requires: (s) =>
      s.run === null
        ? notMet('there is no run to compute a Summary for')
        : s.run.workerHandoffs.every((w) => w.handedOffAtMs !== null)
          ? MET
          : notMet('the server does not yet hold everything from everyone assigned'),
    produces: (s) => ({
      ...s,
      atMs: JOURNEY_INSTANTS.summaryComputedAtMs,
      run:
        s.run === null
          ? null
          : {
              ...s.run,
              summaryComputedAtMs: JOURNEY_INSTANTS.summaryComputedAtMs,
              facts: { ...s.run.facts, completeAtMs: JOURNEY_INSTANTS.summaryComputedAtMs },
            },
      summary: {
        summaryId: 'SUM-2026-08-14-A',
        computedAtMs: JOURNEY_INSTANTS.summaryComputedAtMs,
        anomalies: [
          {
            anomalyId: 'ANOM-0101',
            severity: 'Concern',
            state: 'Open',
            closureNote: null,
          },
        ],
      },
    }),
  },

  {
    number: 8,
    title: 'The Quality Manager resolves the anomaly',
    workflowRef: 'WF-QLT-005',
    sourceRef: 'L28271 · L54191 · L54202',
    ownerModule: 'MOD-DOH-08 — Execution Summary Review and Distribution',
    actingSurface: 'DOH',
    note:
      'Resolution requires a brief closure note — what was done, and who did it — because auditors require evidence of resolution, not just of detection (L28271). A blank note is refused by field validation before any permission question is asked, so a reader sees a validation failure and a policy refusal as different categories.',
    effects: {
      DOH: affected('The register, the closure note, the notifications.', 'L54202'),
      STU: affected('Authoring recommendations arriving as watch items.', 'L54202'),
      CC: affected('Deviations and evidence review feed the register.', 'L54202'),
      FL: noEffect('no role — nothing about resolving an anomaly reaches a device', 'L54202'),
      SA: affected('Anomaly counts as telemetry, never contents.', 'L54202'),
    },
    requires: (s) =>
      s.summary === null
        ? notMet('no Summary has been computed, so there is no register to resolve anything in')
        : s.summary.anomalies.some((a) => a.state === 'Open')
          ? MET
          : notMet('no anomaly on this Summary is Open'),
    produces: (s) => ({
      ...s,
      atMs: JOURNEY_INSTANTS.anomalyResolvedAtMs,
      summary:
        s.summary === null
          ? null
          : {
              ...s.summary,
              anomalies: s.summary.anomalies.map((a) =>
                a.state === 'Open'
                  ? {
                      ...a,
                      state: 'Resolved' as const,
                      closureNote:
                        'Torque gauge re-zeroed against DWG-A441 and unit 41 re-checked inside the 44 to 47 Newton metre limits. Elena Diaz.',
                    }
                  : a,
              ),
            },
    }),
  },

  {
    number: 9,
    title: 'The window elapses and the record closes itself',
    workflowRef: null,
    sourceRef: 'L27933 · L27880 · L7126',
    ownerModule: 'MOD-DOH-06 — Run Scheduling and Execution Oversight',
    actingSurface: 'DOH',
    note:
      'NOBODY PERFORMS THIS STEP. The run auto-close scheduler closes the record, and AC-RUN-002 (L7126) makes it the only path into `finished`; forcing a run to `finished` early is Explicitly prohibited in all five role columns (L27920). So this step writes no instant into the run at all — it advances the journey’s clock past the window and READS the finish out of `dueTransitions`, whose `atMs` is the instant the timer fell due rather than the instant anything was called.',
    effects: {
      DOH: affected(
        'The closing state sequence completes: the finish window elapses and the platform’s run auto-close scheduler closes the record automatically.',
        'L27933, L27897',
      ),
      STU: noEffect(
        'a run finishes on the Workflow version it started on, so closing it changes nothing the Studio holds',
        'L53670',
      ),
      CC: noEffect(
        'this is a data-integrity rule, not a status change, so no in-shift decision arises from it and nothing enters the gate queue',
        'L27933',
      ),
      FL: noEffect(
        'nothing is delivered — after this point changes are exceptional and follow the audited-recompute rule',
        'L27934',
      ),
      SA: affected(
        'Per-run pinned versions stay in the device package inventory, and the Worker-Shift consumption already accrued stands.',
        'L53679, L53798',
      ),
    },
    requires: (s) =>
      s.run === null || s.run.facts.completeAtMs === null
        ? notMet('the finish window has not opened, so it cannot elapse')
        : MET,
    produces: (s) => ({ ...s, atMs: WINDOW_ELAPSES_AT_MS }),
  },
] as const satisfies readonly HubJourneyStep[]

export function journeyStep(number: number): HubJourneyStep | null {
  return JOURNEY_STEPS.find((s) => s.number === number) ?? null
}

/* ==================================================================== *
 * THE FOUR REFUSALS, AS THE SOURCE STATES THEM.
 *
 * Only the SENTENCE lives here. Whether each refusal actually holds is
 * COMPUTED in `./composition` against the real evaluator, the real
 * validator, the real matrix and the real fold — a refusal that is
 * printed rather than demonstrated proves nothing at all.
 * ==================================================================== */

export interface JourneyRefusal {
  readonly atStep: number
  readonly refusal: string
  readonly reason: string
  readonly sourceRef: string
}

export const JOURNEY_REFUSALS = [
  {
    atStep: 2,
    refusal: 'The creator can never approve their own Job',
    reason:
      'The creator attempting to approve their own Job is refused, and where the creator also holds the approver role the platform routes to a second qualified approver.',
    sourceRef: 'L52662, AC-WF-ORG-004-01 L52670',
  },
  {
    atStep: 5,
    refusal: 'A pin is immutable for the life of the run',
    reason:
      'Re-pinning a run in flight is refused. Rebase is offered only for scheduled-not-started runs. Nothing on the Client Command Center can change a pin.',
    sourceRef: 'L53674, AC-WF-AUT-010-01 L53682',
  },
  {
    atStep: 6,
    refusal: 'A run cannot be paused or stopped from an oversight surface',
    reason:
      'Pause or stop a run is Explicitly prohibited — deliberately impossible from any oversight surface — in all four oversight columns. The Worker\u2019s cell is Not applicable rather than prohibited, because the worker ends a run by completing or abandoning it on the device: a different category, not a softer refusal.',
    sourceRef: 'L27916',
  },
  {
    atStep: 9,
    refusal: 'A run cannot be forced to finished early',
    reason:
      'Force a run to `finished` early is Explicitly prohibited in all five columns, and the finish transition occurs only through the run auto-close scheduler after the tenant’s configured window.',
    sourceRef: 'L27920, AC-RUN-002 L7126',
  },
] as const satisfies readonly JourneyRefusal[]
