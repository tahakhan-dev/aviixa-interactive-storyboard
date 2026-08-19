import type { RoleId } from '@/domain/roles'

/**
 * MOD-SA-05 Eval Harness — the seeded fixtures this module's screen steps
 * through. No backend, no clock: every "as of" value below is a fixture
 * string, never a computed time (spec §8, and the no-ambient-Date rule).
 *
 * Every entry carries the frozen-source line it came from. Nothing here was
 * invented to fill a panel: where the source defines no value, the value is
 * rendered as required-and-unset and named in `EVAL_UNSPECIFIED_IN_SOURCE`.
 */

/* ------------------------------------------------------------------ *
 * Closed vocabularies (L43726). `as const satisfies` keeps each member
 * literal-narrowed, so the exhaustiveness checks below are real rather
 * than vacuous.
 * ------------------------------------------------------------------ */

/** OBJ-SA-SCENARIO / OBJ-SA-VERDICT (L43725, L43726). */
export type ScenarioVerdict = 'pending' | 'passing' | 'failing'
export const SCENARIO_VERDICTS = ['pending', 'passing', 'failing'] as const satisfies readonly ScenarioVerdict[]
type MissingVerdict = Exclude<ScenarioVerdict, (typeof SCENARIO_VERDICTS)[number]>
const _verdictsExhaustive: MissingVerdict extends never ? true : never = true
void _verdictsExhaustive

/** OBJ-SA-EVALRUN (L43725, L43726). */
export type EvalRunState = 'queued' | 'running' | 'completed' | 'errored'
export const EVAL_RUN_STATES = ['queued', 'running', 'completed', 'errored'] as const satisfies readonly EvalRunState[]
type MissingRunState = Exclude<EvalRunState, (typeof EVAL_RUN_STATES)[number]>
const _runStatesExhaustive: MissingRunState extends never ? true : never = true
void _runStatesExhaustive

/** Drift-canary run states (L43726). */
export type CanaryRunState = 'scheduled' | 'ran' | 'misfired'
export const CANARY_RUN_STATES = ['scheduled', 'ran', 'misfired'] as const satisfies readonly CanaryRunState[]
type MissingCanaryState = Exclude<CanaryRunState, (typeof CANARY_RUN_STATES)[number]>
const _canaryStatesExhaustive: MissingCanaryState extends never ? true : never = true
void _canaryStatesExhaustive

/* ------------------------------------------------------------------ *
 * The four platform roles. The `ROLE-PLAT-*` identifiers are the plan's
 * annotation for the same four accounts `@/domain/roles` already carries;
 * both are rendered so a reviewer can match one to the other. The
 * selector is a VIEW SWITCHER, not a login (spec §8).
 * ------------------------------------------------------------------ */

export interface EvalPlatformRole {
  readonly id: RoleId
  readonly name: string
  readonly roleAnnotation: string
}

export const EVAL_PLATFORM_ROLES = [
  { id: 'ROOT_SUPER_ADMIN', name: 'Root Super Admin', roleAnnotation: 'ROLE-PLAT-ROOT' },
  { id: 'ADMIN', name: 'Admin', roleAnnotation: 'ROLE-PLAT-ADMIN' },
  { id: 'PLATFORM_ENGINEER', name: 'Platform Engineer', roleAnnotation: 'ROLE-PLAT-ENG' },
  { id: 'SUPPORT', name: 'Support', roleAnnotation: 'ROLE-PLAT-SUP' },
] as const satisfies readonly EvalPlatformRole[]

/* ------------------------------------------------------------------ *
 * Scenarios.
 * ------------------------------------------------------------------ */

export interface EvalScenario {
  readonly id: string
  readonly name: string
  readonly group: string
  readonly verdict: ScenarioVerdict
  readonly lastRunState: EvalRunState
  /**
   * Whether the scenario exercises an artificial-intelligence model, which
   * is what `AC-SA-05-09` (L43807) turns on: with models unavailable, an
   * agent-behaviour scenario renders UNABLE TO RUN rather than passing.
   * The frozen source never tags the eight named scenarios individually —
   * this split is a prototype seeding choice and is named as such in
   * `EVAL_UNSPECIFIED_IN_SOURCE`.
   */
  readonly agentBehaviour: boolean
  readonly sourceRef: string
}

/**
 * The eight named platform scenarios (L87334 — two seeds first, then six),
 * plus the severity-classification-table boundary case the source names
 * separately at L43708 and gates at `AC-SA-05-06` (L43804).
 *
 * The source's "roughly fifty scenarios" is explicitly illustrative and not
 * a committed count (L87334); no total is rendered anywhere as an inventory.
 */
export const EVAL_SCENARIOS = [
  {
    id: 'EVS-01',
    name: 'Tact-time variance coaching',
    group: 'Named platform scenarios — seed',
    verdict: 'passing',
    lastRunState: 'completed',
    agentBehaviour: true,
    sourceRef: 'L87334',
  },
  {
    id: 'EVS-02',
    name: 'Torque out-of-specification at 51 Newton metres against a 47 Newton metre upper specification limit',
    group: 'Named platform scenarios — seed',
    verdict: 'passing',
    lastRunState: 'completed',
    agentBehaviour: false,
    sourceRef: 'L87334',
  },
  {
    id: 'EVS-03',
    name: 'Lot hold on a failing part',
    group: 'Named platform scenarios',
    verdict: 'passing',
    lastRunState: 'completed',
    agentBehaviour: false,
    sourceRef: 'L87334',
  },
  {
    id: 'EVS-04',
    name: 'Supervisor-brief generation',
    group: 'Named platform scenarios',
    verdict: 'passing',
    lastRunState: 'completed',
    agentBehaviour: true,
    sourceRef: 'L87334',
  },
  {
    id: 'EVS-05',
    name: 'Worker offline mid-coaching leading to a replan',
    group: 'Named platform scenarios',
    verdict: 'pending',
    lastRunState: 'queued',
    agentBehaviour: true,
    sourceRef: 'L87334',
  },
  {
    id: 'EVS-06',
    name: 'Missing coaching asset leading to default fallback',
    group: 'Named platform scenarios',
    verdict: 'passing',
    lastRunState: 'completed',
    agentBehaviour: true,
    sourceRef: 'L87334',
  },
  {
    id: 'EVS-07',
    name: 'Multi-worker run attribution',
    group: 'Named platform scenarios',
    verdict: 'passing',
    lastRunState: 'completed',
    agentBehaviour: false,
    sourceRef: 'L87334',
  },
  {
    id: 'EVS-08',
    name: 'Deviation leading to containment gate',
    group: 'Named platform scenarios',
    verdict: 'pending',
    lastRunState: 'queued',
    agentBehaviour: false,
    sourceRef: 'L87334',
  },
  {
    id: 'EVS-09',
    name: 'Severity banding boundary — exactly 10 percent departure',
    group: 'Severity-classification table version',
    verdict: 'failing',
    lastRunState: 'completed',
    agentBehaviour: false,
    sourceRef: 'L43708, AC-SA-05-06 L43804',
  },
] as const satisfies readonly EvalScenario[]

/* ------------------------------------------------------------------ *
 * The gate view: a BLOCKING LIST naming the failing scenario that blocks
 * each capability, never a score (L108982).
 * ------------------------------------------------------------------ */

export interface GateRow {
  readonly capability: string
  readonly kind: string
  /** The scenario id that blocks it, or null when nothing blocks it. */
  readonly blockedBy: string | null
  readonly sourceRef: string
}

export const EVAL_GATE_ROWS = [
  {
    capability: 'On-device severity-classification table, version 4',
    kind: 'Classification table version',
    blockedBy: 'EVS-09',
    sourceRef: 'AC-AI-011-4 L87421, AC-SA-05-06 L43804',
  },
  {
    capability: 'Composed agent — Deviation and Containment',
    kind: 'Composed agent',
    blockedBy: 'EVS-08',
    sourceRef: 'AC-AI-011-1 L87418',
  },
  {
    capability: 'Agent behaviour — mid-coaching replan',
    kind: 'Agent',
    blockedBy: 'EVS-05',
    sourceRef: 'AC-AI-011-1 L87418',
  },
  {
    capability: 'Read atom — torque specification lookup',
    kind: 'Atom',
    blockedBy: null,
    sourceRef: 'AC-AI-011-1 L87418, L43669',
  },
] as const satisfies readonly GateRow[]

/* ------------------------------------------------------------------ *
 * The drift canary panel.
 * ------------------------------------------------------------------ */

export const DRIFT_CANARY = {
  /** DEC-CANARY-001 is open (L87340, L102180) — rendered, never guessed. */
  cadence: 'Not yet set — DEC-CANARY-001',
  lastRunAsOf: '2026-08-16 02:00 UTC',
  lastRunState: 'ran',
  verdict:
    'Regression detected — Severity banding boundary — exactly 10 percent departure moved from passing to failing.',
  /**
   * `AC-4853` (L107719) requires the canary's last result AND its named
   * owner to be displayed always. The frozen source never names an owner,
   * so this renders required-and-unset rather than carrying an invented
   * name — the same idiom the source itself uses at L90030.
   */
  namedOwner: 'Not yet set — required by AC-4853 (L107719); the source names no owner.',
  effect:
    'Enablement freezes; existing enabled capabilities continue (SB-SCHED-25, L102180).',
} as const

/* ------------------------------------------------------------------ *
 * The prohibitions that render ABSENT: the action exists for no account,
 * including the root. Nothing is drawn — a one-line note sits where a
 * control would be (spec §3).
 * ------------------------------------------------------------------ */

export interface AbsentControl {
  readonly label: string
  readonly note: string
}

export const EVAL_ABSENT_CONTROLS = [
  {
    label: 'A control that disables the evaluation gate',
    note: 'No interface, application programming interface, configuration file or database state disables the evaluation gate (AC-AI-011-2, L87419). Nothing is drawn here, for any account including the root.',
  },
  {
    label: 'A control that weakens a verdict or marks a failing scenario as accepted',
    note: 'There is no control anywhere on this screen that would weaken a scenario verdict or accept a failure, because none exists in the platform (L108982).',
  },
  {
    label: 'Edit or delete a verdict, or its history',
    note: 'Verdicts and their history cannot be edited or deleted by any account (AC-SA-05-04, L43802).',
  },
  {
    label: 'Enablement of a capability whose scenarios are pending or failing',
    note: 'The enablement control is not offered at all while a referenced scenario is pending or failing, for any account including the root (L65361, AC-AI-011-1 L87418).',
  },
  {
    label: 'Open the trace viewer for a scenario run',
    note: 'The source names this control at L65489, but no trace-viewer screen is built at V1 (decision D9). DEC-SEC-020 (L104506) warns that an unqualified viewer becomes the ambient-browsing path the source forbids.',
  },
] as const satisfies readonly AbsentControl[]

/* ------------------------------------------------------------------ *
 * What the source does not define. Named, never invented (contract 8).
 * ------------------------------------------------------------------ */

export interface UnspecifiedAffordance {
  readonly affordance: string
  readonly note: string
}

export const EVAL_UNSPECIFIED_IN_SOURCE = [
  {
    affordance: 'The drift-canary cadence',
    note: 'DEC-CANARY-001 is open (L87340, L102180). Rendered as required-and-unset rather than hard-coded to the recommended option.',
  },
  {
    affordance: "The drift canary's named owner",
    note: 'AC-4853 (L107719) requires it to be displayed always; the frozen source never names one. Rendered as required-and-unset.',
  },
  {
    affordance: 'The action taken when the canary detects a drift',
    note: 'The second half of DEC-CANARY-001. The source states the outcome — enablement freezes while enabled capabilities continue (L102180) — but names no console control that performs it, so none is drawn.',
  },
  {
    affordance: 'Authoring, editing or retiring an evaluation scenario',
    note: 'The source says a scenario is authored before the capability it will gate (L43669) but defines no authoring affordance on this console. No create, edit or retire control is drawn.',
  },
  {
    affordance: 'Filtering or searching the scenario list',
    note: 'No filter, sort or search control is defined for this module in the frozen source.',
  },
  {
    affordance: 'Exporting verdict history',
    note: 'AC-SA-05-04 forbids editing and deleting a verdict; the source says nothing about exporting one, so no export control is drawn.',
  },
  {
    affordance: 'Which scenarios exercise an artificial-intelligence model',
    note: 'AC-SA-05-09 (L43807) turns on this distinction, but the source never tags the eight named scenarios individually. The tagging on this screen is a prototype seeding choice, not a source fact.',
  },
  {
    affordance: 'The committed scenario set',
    note: 'The source names eight platform scenarios (L87334) and describes roughly fifty as illustrative and explicitly not a committed count. No total is rendered here as an inventory.',
  },
] as const satisfies readonly UnspecifiedAffordance[]

/* ------------------------------------------------------------------ *
 * Conflicts the source leaves open. Stated on screen, never resolved
 * silently in code (spec §4 preamble).
 * ------------------------------------------------------------------ */

export interface SourceConflict {
  readonly topic: string
  readonly conflict: string
  readonly resolution: string
}

export const EVAL_SOURCE_CONFLICTS = [
  {
    topic: 'Who may run a scenario or a suite',
    conflict:
      'L43706 names Platform Engineer and root; L87338 adds Admin; L108748 and L108982 name Platform Engineer alone.',
    resolution:
      'Platform Engineer and root act. Admin is drawn and inert with the reason that Band A execution is engineering work (L42713); Support is drawn and inert because running evaluation scenarios sits in Support’s may-not list (L42715).',
  },
  {
    topic: 'Who may read the drift canary panel',
    conflict:
      'L108982 lists root, Admin and Platform Engineer for the canary panel and omits Support, while the same passage gives Support the gate view.',
    resolution:
      'The per-control allowed roles at L108982 govern: Support reads the gate view and is refused the canary panel detail, with the refusal stated rather than hidden.',
  },
  {
    topic: 'A proportion as a posture measure',
    conflict:
      'L56974 describes a posture view carrying the proportion of scenarios that pass; L108982 says the gate view reads as a blocking list rather than a score, and AC-4853 (L107719) forbids a confidence value used as a gate.',
    resolution:
      'No score and no proportion is rendered. Counts by verdict only, each with the time they were true.',
  },
  {
    topic: 'The drift-canary cadence, and what happens on a canary failure',
    conflict:
      'DEC-CANARY-001 (L87340, L102180) is open: three incompatible cadence options, no adopted position, and no named console action on a failure.',
    resolution:
      'Rendered as required-and-unset — "Not yet set — DEC-CANARY-001" — never hard-coded to the recommended option, and no control is drawn for an action the source does not define.',
  },
  {
    topic: 'This module’s screen numbers',
    conflict:
      'The numbered screen at L42798 against SCR-SA-EVALS and SCR-SA-EVALGATE (L87376), plus an unnumbered posture view (L56974).',
    resolution:
      'Decision D1 — names are canonical, numbers are annotations. The route is keyed on the module slug, never on a number.',
  },
  {
    topic: 'Module-level allowed roles',
    conflict:
      'L108748 records roles_allowed as Platform Engineer alone; L108982 records all four platform roles.',
    resolution:
      'Decision D16 — module-level roles_allowed is authoritative nowhere. Every affordance on this screen is driven by its own allowed roles through evaluateAccess.',
  },
] as const satisfies readonly SourceConflict[]

/* ------------------------------------------------------------------ *
 * The workflows this module renders. Matched to MOD-SA-05 by NAME and by
 * LINE PROXIMITY: the extract carries no `module_id` on any workflow, so
 * `Scenario to gate verdict` (L43669) was matched by proximity to the
 * §8.5 block (L43706-L43807), and `Run an evaluation suite` (L15967) and
 * `The drift canary re-runs the evaluation suite on cadence` (L102180)
 * were matched by name.
 * ------------------------------------------------------------------ */

export interface EvalWorkflow {
  readonly id: string
  readonly name: string
  readonly actor: string
  readonly trigger: string
  readonly terminalStates: readonly string[]
  readonly matchedBy: string
}

export const EVAL_WORKFLOWS = [
  {
    id: 'L43669',
    name: 'Scenario to gate verdict',
    actor: 'Platform Engineer',
    trigger: 'A scenario is authored before the capability it will gate.',
    terminalStates: [
      'enablement submittable, and still requiring approval',
      'capability flagged immediately on a regression',
      'classification table version held back from distribution',
    ],
    matchedBy: 'line proximity to the §8.5 block (L43706–L43807)',
  },
  {
    id: 'WF-SA-RUN-EVAL',
    name: 'Run an evaluation suite',
    actor: 'Platform Engineer',
    trigger: 'An agent-affecting change is prepared.',
    terminalStates: ['scenarios pass', 'scenarios fail and the change stops'],
    matchedBy: 'name (L15967)',
  },
  {
    id: 'SB-SCHED-25',
    name: 'The drift canary re-runs the evaluation suite on cadence',
    actor: 'The scheduled drift-canary occurrence, and its named owner',
    trigger: 'Cadence — value open, DEC-CANARY-001.',
    terminalStates: ['enablement freezes; existing enabled capabilities continue'],
    matchedBy: 'name (L102180)',
  },
] as const satisfies readonly EvalWorkflow[]

/** Fixture "as of" strings. No clock is read anywhere in this module. */
export const POSTURE_AS_OF = 'As of 2026-08-16 09:12 UTC'
export const POSTURE_STALE_AS_OF = 'As of 2026-08-16 08:25 UTC — stale, 47 minutes old'
export const POSTURE_ORIGIN = 'from the last completed suite run, fixture data'
