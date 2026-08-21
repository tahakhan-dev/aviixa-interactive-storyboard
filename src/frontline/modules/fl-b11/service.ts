import type { DecisionReading } from '@/disclosure/decisions'
import {
  FL_COMMAND_CLASSES,
  admitCommandClass,
  effectiveOnThisDevice,
  type CommandState,
} from '@/frontline/commands'
import {
  functionalitiesNamingNoPattern,
  patternsForModule,
  type FrontlineFallbackId,
  type FrontlineFallbackPattern,
} from '@/frontline/fallbacks'
import { FL_PLAYER_VIEWS } from '@/frontline/screens'

/**
 * `MOD-FL-B11` — Worker Lifecycle on Device. The module's own logic and
 * vocabulary.
 *
 * ── THE FALLBACK OBLIGATION, AND THE TWO GAPS IT FINDS ─────────────────
 *
 * `AC-FL-011-1` (L40151): "Every functionality in this chapter names at least
 * one `FB-FL-*` pattern." Eleven `FUNC-B11-*` identifiers are enumerated at
 * L42015-L42033 under five features, and each one's own Fallback clause is
 * transcribed below verbatim, so the criterion is asked of the source's words
 * rather than of a summary of them. TWO of the eleven name no pattern and each
 * gives its own ground in the same clause. THEY ARE REPORTED, NOT FILLED — an
 * assigned pattern is indistinguishable from a real one forever afterwards,
 * and the criterion then reads clean because nobody looked.
 *
 * ── THREE READINGS OF THIS MODULE'S FALLBACK SET, AND NONE RECONCILED ──
 *
 * The §22.9 map gives FOUR, the card's own Fallback identifier line gives
 * FIVE, and the functionalities name SIX. The two divergences are exact and
 * both are checkable: `FB-FL-UP-01`'s map row (L40134) lists `MOD-FL-A4` and
 * `MOD-FL-A6` and not this module, while the card names it for flag delivery;
 * and `FB-FL-CAP-01`'s map row (L40133) lists `MOD-FL-A4` and `MOD-FL-A5` and
 * not this module, while two functionalities name it. All three readings are
 * carried and none is reconciled — no `DEC-*` identifier is attached to this
 * anywhere in the frozen source.
 */

/* ==================================================================== *
 * WHERE THIS MODULE SURFACES.
 *
 * §22.7 gives this module exactly two of its twenty-three rows, and its own
 * Module column is what says so: `SCR-FL-22`, the step-away and hand-back
 * sheet (L39884), and `SCR-FL-23`, the substitution handover state (L39885).
 * Both carry "Run Player" in their Destination column, so both are STATES of
 * that one route and neither is a destination — `AC-FL-010-2` (L40046) and
 * `TEST-FL-010-2` (L40056).
 *
 * DERIVED FROM THE REGISTER, AND NAMED RATHER THAN TOKENISED. The names come
 * out of wave 0's transcription of §22.7 rather than being spelled again here,
 * and the identifiers stay under `src/` for the reason `@/frontline/screens`
 * records: `scripts/build-registries.mjs` counts an identifier a screen names
 * as a citation whether the screen renders it or merely mentions it.
 *
 * IT LIVES HERE RATHER THAN IN THE PANEL BECAUSE A TEST HAS TO READ IT. The
 * first version of this list sat in the view file and the unit suite re-derived
 * the same filter to check it — which asserted the test's own expression
 * against the source and never looked at the module at all. Adding `SCR-FL-16`,
 * the worker-finished completion screen, to the module's list left that gate
 * green. Exported from here, the suite reads the value the panel actually
 * mounts.
 * ==================================================================== */

export const B11_VIEW_IDS = ['SCR-FL-22', 'SCR-FL-23'] as const

export const B11_VIEW_NAMES: readonly string[] = FL_PLAYER_VIEWS.filter((v) =>
  (B11_VIEW_IDS as readonly string[]).includes(v.id),
).map((v) => v.name)

/* ==================================================================== *
 * THE ELEVEN FUNCTIONALITIES.
 * ==================================================================== */

export interface B11Functionality {
  readonly id: string
  /** The functionality's own opening sentence, verbatim. */
  readonly statement: string
  /** Its Roles-allowed clause, verbatim. */
  readonly rolesAllowed: string
  /** Its Roles-prohibited clause, verbatim. `null` where it states none. */
  readonly rolesProhibited: string | null
  /** Its connectivity clause, verbatim. */
  readonly connectivity: string
  /** Its Fallback clause, verbatim, backticks stripped. */
  readonly fallbackClause: string
  /** The `FB-FL-*` identifiers that clause names. Empty where it names none. */
  readonly patterns: readonly FrontlineFallbackId[]
  readonly sourceRef: string
}

export const B11_FUNCTIONALITIES = [
  {
    id: 'FUNC-B11-01-1-1',
    statement:
      'Treat pause as a per-worker, session-level idle — a device lock, a log-out, or a timeout — that preserves on-device progress.',
    rolesAllowed: 'Roles allowed: Worker.',
    rolesProhibited: 'Roles prohibited: none.',
    connectivity: 'Online and offline: identical.',
    fallbackClause: 'Fallback: FB-FL-AUTH-01.',
    patterns: ['FB-FL-AUTH-01'],
    sourceRef: 'L42015',
  },
  {
    id: 'FUNC-B11-01-1-2',
    statement:
      'Ensure pause is not a Run state, so pausing one worker’s session does not pause the Run while other workers may still be active on it.',
    rolesAllowed: 'Roles allowed: automatic.',
    rolesProhibited:
      'Roles prohibited: nobody may pause a Run from any surface; pausing or stopping a run is deliberately impossible from the Client Command Center.',
    connectivity: 'Online and offline: identical.',
    fallbackClause: 'Fallback: Not applicable — a state that does not exist cannot fail.',
    patterns: [],
    sourceRef: 'L42016',
  },
  {
    id: 'FUNC-B11-02-1-1',
    statement:
      'Let a worker step away from their part of a Run, raising a flag to the supervisor.',
    rolesAllowed: 'Roles allowed: Worker.',
    rolesProhibited: 'Roles prohibited: nobody may suppress the flag.',
    connectivity:
      'Online: the flag delivers. Offline: it queues, and no surface claims the supervisor knows.',
    fallbackClause: 'Fallback: FB-FL-UP-01.',
    patterns: ['FB-FL-UP-01'],
    sourceRef: 'L42019',
  },
  {
    id: 'FUNC-B11-02-1-2',
    statement: 'Let a worker hand back their part of a Run, raising a flag to the supervisor.',
    rolesAllowed: 'Roles allowed: Worker.',
    rolesProhibited: 'Roles prohibited: none.',
    connectivity: 'Online and offline: as above.',
    fallbackClause: 'Fallback: FB-FL-UP-01.',
    patterns: ['FB-FL-UP-01'],
    sourceRef: 'L42020',
  },
  {
    id: 'FUNC-B11-02-1-3',
    statement: 'Prevent a worker from cancelling or terminally completing a Run.',
    rolesAllowed: 'Roles allowed: nobody on this surface.',
    rolesProhibited: 'Roles prohibited: Worker, categorically.',
    connectivity: 'Online and offline: identical absence.',
    fallbackClause: 'Fallback: Not applicable — an excluded capability has no failure mode.',
    patterns: [],
    sourceRef: 'L42021',
  },
  {
    id: 'FUNC-B11-03-1-1',
    statement:
      'Apply a supervisor-initiated substitution, initiated in the Delivery Operations Hub with a reason and delivered via the command channel.',
    rolesAllowed: 'Roles allowed: Supervisor and above initiate; the device applies.',
    rolesProhibited: 'Roles prohibited: no worker initiates it.',
    connectivity: 'Online: applies at the next sync. Offline: cannot arrive.',
    fallbackClause: 'Fallback: FB-FL-CMD-01.',
    patterns: ['FB-FL-CMD-01'],
    sourceRef: 'L42024',
  },
  {
    id: 'FUNC-B11-03-1-2',
    statement:
      'Present the substitute with the structured handover state: the last completed step, the open flags, and the current state, and let them work forward from there.',
    rolesAllowed: 'Roles allowed: the substitute worker.',
    rolesProhibited:
      'Roles prohibited: the substitute cannot see the prior worker’s session or credentials.',
    connectivity:
      'Online and offline: the handover state is composed locally from the run record and renders offline once the command has been applied.',
    fallbackClause: 'Fallback: FB-FL-CAP-01.',
    patterns: ['FB-FL-CAP-01'],
    sourceRef: 'L42025',
  },
  {
    id: 'FUNC-B11-03-1-3',
    statement: 'Keep pre-substitution steps attributed to the original worker.',
    rolesAllowed: 'Roles allowed: automatic.',
    rolesProhibited: 'Roles prohibited: nobody may re-attribute.',
    connectivity: 'Online and offline: identical.',
    fallbackClause: 'Fallback: FB-FL-CAP-01.',
    patterns: ['FB-FL-CAP-01'],
    sourceRef: 'L42026',
  },
  {
    id: 'FUNC-B11-04-1-1',
    statement:
      'Enforce on the device, at step level, the Delivery Operations Hub rule that a worker may complete the current Run before an at-expiry block applies.',
    rolesAllowed: 'Roles allowed: automatic.',
    rolesProhibited: 'Roles prohibited: no worker override.',
    connectivity:
      'Online and offline: identical, because expiry dates travel with cached qualification data.',
    fallbackClause: 'Fallback: FB-FL-GATE-01.',
    patterns: ['FB-FL-GATE-01'],
    sourceRef: 'L42029',
  },
  {
    id: 'FUNC-B11-04-1-2',
    statement: 'Apply whichever enforcement posture the tenant has configured.',
    rolesAllowed: 'Roles allowed: Tenant Admin configures.',
    rolesProhibited: 'Roles prohibited: no device-side variation.',
    connectivity: 'Online and offline: identical.',
    fallbackClause: 'Fallback: FB-FL-GATE-01.',
    patterns: ['FB-FL-GATE-01'],
    sourceRef: 'L42030',
  },
  {
    id: 'FUNC-B11-05-1-1',
    statement:
      'Honour suspension states as MOD-FL-A7 defines them, including the immediate compliance stop.',
    rolesAllowed: 'Roles allowed: nobody may act on the device under a compliance stop.',
    rolesProhibited: 'Roles prohibited: all.',
    connectivity: 'Online: applies on receipt. Offline: devices lock at next contact.',
    fallbackClause: 'Fallback: FB-FL-SEC-01.',
    patterns: ['FB-FL-SEC-01'],
    sourceRef: 'L42033',
  },
] as const satisfies readonly B11Functionality[]

/**
 * `AC-FL-011-1`'s question, asked through wave 0's own predicate rather than a
 * private copy of it. REPORTED, NOT FILLED.
 */
export const B11_FUNCTIONALITIES_NAMING_NO_PATTERN =
  functionalitiesNamingNoPattern(B11_FUNCTIONALITIES)

/** Reading one: the §22.9 module map, read through wave 0. FOUR patterns. */
export const B11_MAPPED_PATTERNS: readonly FrontlineFallbackPattern[] =
  patternsForModule('MOD-FL-B11')

/** Reading three: what the eleven functionalities actually name. SIX patterns. */
export const B11_PATTERNS_NAMED_BY_FUNCTIONALITIES = [
  ...new Set(B11_FUNCTIONALITIES.flatMap((f) => f.patterns)),
] as const satisfies readonly FrontlineFallbackId[]

/**
 * THE THREE READINGS, CARRIED APART. Reading two is transcribed from the
 * card's own Fallback identifier line (L42007) and the other two are DERIVED,
 * so a divergence cannot be closed by editing one of the three quietly.
 */
export const B11_PATTERN_DIVERGENCE = {
  fromTheCardsFallbackLine: [
    'FB-FL-CMD-01',
    'FB-FL-AUTH-01',
    'FB-FL-GATE-01',
    'FB-FL-SEC-01',
    'FB-FL-UP-01',
  ] as readonly FrontlineFallbackId[],
  cardRef: 'L42007',
  note:
    'Three parts of the source give three different fallback sets for this module and this build ' +
    'reconciles none of them. The section 22.9 map gives four; the module card’s own Fallback ' +
    'identifier line gives five, adding FB-FL-UP-01 for flag delivery; the eleven functionalities ' +
    'name six, adding FB-FL-CAP-01 as well. The two divergences are exact: FB-FL-UP-01’s map row ' +
    'lists MOD-FL-A4 and MOD-FL-A6 and not this module, and FB-FL-CAP-01’s map row lists MOD-FL-A4 ' +
    'and MOD-FL-A5 and not this module. No DEC-* identifier is attached to the disagreement ' +
    'anywhere in the frozen source, so there is nothing to disclose it under and nothing that ' +
    'settles it.',
  divergenceRefs: 'map L40130-L40143; FB-FL-UP-01 row L40134; FB-FL-CAP-01 row L40133',
} as const

/* ==================================================================== *
 * PAUSE — THE MODULE'S CENTRAL RULE, HELD BY THE TYPE.
 *
 * `AC-B11-1` (L42068): "Pausing one worker's session never changes the Run's
 * state for any other worker." L41974 gives the reason in the happy path
 * itself: "Pause preserves on-device progress and does not pause the Run,
 * because other workers may still be active on the same Run."
 *
 * `runStateChanged` IS THE LITERAL `false`, not a boolean, so a branch that
 * paused the Run would not compile. This is the same discipline wave 0 used
 * for `degradedOffline: false` on the safety layer, applied to the one rule
 * this module's own state diagram exists to make visible.
 * ==================================================================== */

export interface B11Pause {
  readonly cause: 'device lock' | 'log-out' | 'timeout'
  readonly scope: 'this worker’s session'
  /** Always `false`. Typed as the literal so no branch can pause the Run. */
  readonly runStateChanged: false
  readonly onDeviceProgress: 'preserved'
  readonly resumeBy: string
  readonly line: string
  readonly sourceRef: string
}

export const B11_PAUSE_CAUSES = ['device lock', 'log-out', 'timeout'] as const

export function pause(cause: B11Pause['cause']): B11Pause {
  return {
    cause,
    scope: 'this worker’s session',
    runStateChanged: false,
    onDeviceProgress: 'preserved',
    resumeBy: 'The worker returns, re-authenticates, and continues where they left off.',
    line:
      `Paused by ${cause}. This is a per-worker, session-level idle. On-device progress is ` +
      'preserved and the Run is not paused, because other workers may still be active on the same ' +
      'Run.',
    sourceRef: 'L41974, L41975, AC-B11-1 L42068',
  }
}

/* ==================================================================== *
 * STEP-AWAY AND HAND-BACK — THE TWO ACTS THIS SCREEN OWNS, AND THE ONE
 * CLAIM NEITHER OF THEM MAY MAKE.
 *
 * L41981: "Step-away and hand-back flags are recorded and queued; the
 * supervisor is not notified until sync, and no surface may imply otherwise."
 * `TEST-B11-6` (L42085) is the test that says so.
 *
 * `supervisorNotified` IS `false` WHEN THE DEVICE IS OFFLINE AND THAT IS NOT
 * A DEFAULT — it is the whole of the rule. The flag is a notification raised
 * to the Supervisor, never a control on this surface, which is why nothing
 * here returns an affordance.
 * ==================================================================== */

export type B11DepartureKind = 'step-away' | 'hand-back'

export interface B11DepartureFlag {
  readonly kind: B11DepartureKind
  readonly delivered: boolean
  /**
   * What the worker is told. `SB-FL-020` frame 1 gives the offline wording in
   * the source's own words: "Your supervisor will be told when this tablet
   * reconnects."
   */
  readonly line: string
  /** What this act is NOT, said on its face. */
  readonly notThis: string
  /** How the two differ, in the source's words. */
  readonly difference: string
  readonly sourceRef: string
}

const NEITHER_CANCELS_NOR_COMPLETES =
  'This raises a flag to the supervisor. It cancels nothing and completes nothing, and no run state ' +
  'changes for anyone because of it.'

export function departureFlag(kind: B11DepartureKind, online: boolean): B11DepartureFlag {
  const what = kind === 'step-away' ? 'stepped away from' : 'handed back'
  return {
    kind,
    delivered: online,
    line: online
      ? `You have ${what} your part of this Run. The flag has been sent to your supervisor.`
      : `You have ${what} your part of this Run. Your supervisor will be told when this tablet ` +
        'reconnects. The flag is recorded and queued on this device until then.',
    notThis: NEITHER_CANCELS_NOR_COMPLETES,
    difference:
      kind === 'hand-back'
        ? 'Hand-back signals that the worker does not intend to return to this part, which is what ' +
          'tells the supervisor a substitution may be needed.'
        : 'Step-away signals a break in the work, and the worker may return to it.',
    sourceRef:
      kind === 'hand-back'
        ? 'FUNC-B11-02-1-2 · L42020; L41981; AC-B11-2 L42069'
        : 'FUNC-B11-02-1-1 · L42019; L41981; AC-B11-2 L42069',
  }
}

/* ==================================================================== *
 * THE SUBSTITUTION HANDOVER — THE DEVICE END OF SOMEBODY ELSE'S ACT.
 * ==================================================================== */

/** The command class that carries it. Read from wave 0, never re-spelled. */
export const B11_SUBSTITUTION_COMMAND = FL_COMMAND_CLASSES.find(
  (c) => c.id === 'CMD-FL-REASSIGN',
)

/**
 * THE THREE ELEMENTS OF THE STRUCTURED HANDOVER STATE, and there are exactly
 * three. The card's Inputs line (L41962) and `FUNC-B11-03-1-2` (L42025) both
 * enumerate them, and `AC-B11-4` (L42071) requires all three before the
 * substitute's first capture — so a handover panel showing two of them is a
 * criterion failure rather than a thin screen.
 */
export const B11_HANDOVER_ELEMENTS = [
  { element: 'The last completed step', sourceRef: 'L41962, L42025' },
  { element: 'The open flags', sourceRef: 'L41962, L42025' },
  { element: 'The current state', sourceRef: 'L41962, L42025' },
] as const

/** What a substitute never receives. L42005 and `FUNC-B11-03-1-2`'s own clause. */
export const B11_SUBSTITUTE_NEVER_RECEIVES =
  'A substitute receives the handover state and the forward path, not the previous worker’s session ' +
  'or credentials.'

export type B11SubstitutionOutcome =
  | {
      readonly applied: true
      readonly heading: string
      readonly elements: readonly string[]
      readonly forwardControl: string
      readonly attribution: string
      readonly sourceRef: string
    }
  | {
      readonly applied: false
      readonly reason: string
      readonly acknowledged: true
      readonly stateChanged: false
      readonly sourceRef: string
    }

/**
 * The device end of `CMD-FL-REASSIGN`, as one fold.
 *
 * TWO REFUSAL PATHS, AND BOTH ARE THE SOURCE'S. `AC-FL-007-3` (L39721) — no
 * surface represents a command as effective on a device before that device has
 * acknowledged application — so a command that has not reached `applied` or
 * `acknowledged` presents no handover, and `effectiveOnThisDevice` in
 * `@/frontline/commands` is the one predicate that answers it. `TEST-B11-8`
 * (L42087) is the other: a substitution delivered for a Run the device no
 * longer holds is a TYPED REJECTION with acknowledgement and no state change,
 * which is why the refusal branch carries `acknowledged` and `stateChanged` as
 * literals rather than as a bare reason string.
 */
export function applySubstitution(input: {
  readonly commandClass: string
  readonly commandState: CommandState
  readonly deviceHoldsTheRun: boolean
  readonly previousWorker: string
}): B11SubstitutionOutcome {
  const ruling = admitCommandClass(input.commandClass)
  if (!ruling.accepted) {
    return {
      applied: false,
      reason: ruling.reason,
      acknowledged: true,
      stateChanged: false,
      sourceRef: 'AC-FL-007-1 · L39719',
    }
  }
  if (!input.deviceHoldsTheRun) {
    return {
      applied: false,
      reason:
        'This device no longer holds the Run the substitution names, so nothing is applied. The ' +
        'rejection is acknowledged back to the server and no state on this device changes.',
      acknowledged: true,
      stateChanged: false,
      sourceRef: 'TEST-B11-8 · L42087',
    }
  }
  if (!effectiveOnThisDevice(input.commandState)) {
    return {
      applied: false,
      reason:
        `The substitution command is ${input.commandState} and has not been applied on this device. ` +
        'No handover is presented, because no surface represents a command as effective on a device ' +
        'before that device has acknowledged application.',
      acknowledged: true,
      stateChanged: false,
      sourceRef: 'AC-FL-007-3 · L39721',
    }
  }
  return {
    applied: true,
    heading: `Picking up from ${input.previousWorker}`,
    elements: B11_HANDOVER_ELEMENTS.map((e) => e.element),
    forwardControl: 'Continue',
    attribution:
      `Every step ${input.previousWorker} completed stays attributed to ${input.previousWorker}, and ` +
      'that attribution is immutable. Your first capture is attributed to you.',
    sourceRef: 'FUNC-B11-03-1-2 · L42025; SB-FL-020 L42058; AC-B11-5 L42072',
  }
}

/* ==================================================================== *
 * AT-STEP CERTIFICATION-EXPIRY ENFORCEMENT.
 *
 * `AC-B11-6` (L42073): "A certification expiring mid-Run allows the current
 * Run to complete and blocks at the next gated step under the tenant's
 * posture."
 *
 * NO CONNECTIVITY PARAMETER, AND THAT IS THE POINT. L41979 — "Expiry
 * evaluation is identical to offline, because it is local" — and L41981 —
 * "At-step expiry enforcement operates locally, because expiry dates travel
 * with the cached qualification data". A connectivity argument on this
 * function is how the deterministic layer gets gated behind a network check,
 * which L40948 exists to forbid, so the signature has no room for one.
 *
 * THE POSTURE IS `MOD-FL-B9`'s AND IS NOT RE-DECIDED HERE. L41989 names B9 as
 * the dependency "for the enforcement posture that governs expiry blocks", and
 * `FUNC-B11-04-1-2` (L42030) says only "Apply whichever enforcement posture
 * the tenant has configured. Roles prohibited: no device-side variation." So
 * the posture arrives as an input and nothing here chooses it.
 * ==================================================================== */

export interface B11ExpiryOutcome {
  readonly blocked: boolean
  readonly line: string
  /** Always `false`. There is no on-device worker override, ever. */
  readonly workerMayOverride: false
  readonly sourceRef: string
}

export function atStepExpiry(input: {
  readonly certificationExpired: boolean
  readonly atAGatedStep: boolean
}): B11ExpiryOutcome {
  if (!input.certificationExpired) {
    return {
      blocked: false,
      line: 'The certification this step requires is current.',
      workerMayOverride: false,
      sourceRef: 'FUNC-B11-04-1-1 · L42029',
    }
  }
  if (!input.atAGatedStep) {
    return {
      blocked: false,
      line:
        'A certification expired during this Run. The current Run may be completed; the block ' +
        'applies at the next gated step, under whichever enforcement posture the tenant has ' +
        'configured.',
      workerMayOverride: false,
      sourceRef: 'AC-B11-6 · L42073; FUNC-B11-04-1-1 L42029',
    }
  }
  return {
    blocked: true,
    line:
      'This step is gated and the certification it requires has expired, so the step is blocked ' +
      'here. The evaluation is local and is the same with or without a connection, because expiry ' +
      'dates travel with the cached qualification data. There is no override on this device.',
    workerMayOverride: false,
    sourceRef: 'AC-B11-6 · L42073; L41981',
  }
}

/* ==================================================================== *
 * THE SEVEN ACCEPTANCE CRITERIA. Table header L42066, separator L42067,
 * data L42068-L42074.
 * ==================================================================== */

export interface B11AcceptanceCriterion {
  readonly id: string
  readonly text: string
  readonly sourceRef: string
}

export const B11_ACCEPTANCE_CRITERIA = [
  {
    id: 'AC-B11-1',
    text: 'Pausing one worker’s session never changes the Run’s state for any other worker.',
    sourceRef: 'AC-B11-1 · L42068',
  },
  {
    id: 'AC-B11-2',
    text: 'Step-away and hand-back each raise a supervisor flag and neither cancels nor completes anything.',
    sourceRef: 'AC-B11-2 · L42069',
  },
  {
    id: 'AC-B11-3',
    text: 'No interface permits a worker to cancel or terminally complete a Run.',
    sourceRef: 'AC-B11-3 · L42070',
  },
  {
    id: 'AC-B11-4',
    text: 'A substitute is presented with the last completed step, the open flags, and the current state before their first capture.',
    sourceRef: 'AC-B11-4 · L42071',
  },
  {
    id: 'AC-B11-5',
    text: 'Pre-substitution steps remain attributed to the original worker and cannot be re-attributed on any surface.',
    sourceRef: 'AC-B11-5 · L42072',
  },
  {
    id: 'AC-B11-6',
    text: 'A certification expiring mid-Run allows the current Run to complete and blocks at the next gated step under the tenant’s posture.',
    sourceRef: 'AC-B11-6 · L42073',
  },
  {
    id: 'AC-B11-7',
    text: 'Worker-Shift attribution counts each worker who actually performed work exactly once per calendar shift.',
    sourceRef: 'AC-B11-7 · L42074',
  },
] as const satisfies readonly B11AcceptanceCriterion[]

/* ==================================================================== *
 * THE FOUR DECISIONS THIS MODULE DISCLOSES.
 *
 * WHY THEY ARE DISCLOSED HERE AND NOT THROUGH `DecisionDisclosure`.
 * `@/disclosure/DecisionDisclosure` is the only place an open decision is
 * rendered on any surface, and it takes a `DecisionId`. That union has
 * twenty-nine members and none of them is `DEC-STUCK-001`, `DEC-PARK-001`,
 * `DEC-NOSHIFT-001` or `DEC-PLUS-001`; the canon file is not this task's to
 * edit. `Stu14LocalDisclosure` in `@/studio/modules/stu-14/rendering` met
 * exactly this and set the idiom followed here: disclose locally IN THE
 * CANON'S OWN SHAPE, declare the gap on `canonNote`, and never file the
 * decision under a neighbouring identifier — because a client searching the
 * canon for one of these would then find someone else's decision instead.
 *
 * `readings` is the canon's own `DecisionReading` type, IMPORTED rather than
 * redeclared, so it carries exactly two fields and there is no field in which
 * a reading could be marked the answer.
 *
 * THE STAND-IN IS BUILT TO EXPIRE. The unit suite reads the canon's exported
 * union out of the file and asserts each of these four is still absent from
 * it. The moment one is lifted, the suite goes red and forces the switch.
 *
 * A FINDING ABOUT ALL FOUR, RECORDED RATHER THAN ROUTED AROUND: §22.20 names
 * NO `DEC-*` identifier anywhere between L41929 and L42091 — zero occurrences.
 * Every one of these four is reached from outside the section, and `whyHere`
 * says by which sentence. Row 6 is the sharpest case: it states one reading of
 * `DEC-STUCK-001` as settled fact without ever naming the decision.
 * ==================================================================== */

export interface B11Disclosure {
  readonly decisionRef: 'DEC-STUCK-001' | 'DEC-PARK-001' | 'DEC-NOSHIFT-001' | 'DEC-PLUS-001'
  readonly question: string
  readonly readings: readonly DecisionReading[]
  /** What this build does. Never presented as the source's ruling. */
  readonly adopted: string
  /** Why MOD-FL-B11 is a place this decision has to be disclosed. */
  readonly whyHere: string
  /** Why it is disclosed here rather than through the shared renderer. */
  readonly canonNote: string
}

const CANON_NOTE =
  'The shared decision canon at @/disclosure/decisions carries no record keyed to this identifier — ' +
  'its DecisionId union has twenty-nine members and this is not one of them — and that file is ' +
  'another task’s path. Disclosed here in the canon’s own record shape so it can be absorbed ' +
  'without a rewrite, and declared as a gap rather than filed under a neighbouring identifier. ' +
  'This module’s unit suite asserts the absence, so the disclosure moves to the canon the moment ' +
  'the canon holds it.'

export const B11_DISCLOSURES = [
  {
    decisionRef: 'DEC-STUCK-001',
    question:
      'What state a manually closed stuck run is in. This matrix’s sixth row states one of the two readings as settled fact, in its own words, without naming the decision.',
    readings: [
      {
        text: '"A manually closed stuck run is complete at close time and finishes on the same clock."',
        locator: 'DEC-STUCK-001 Reading A · L5255 (§2.4)',
      },
      {
        text: '"a Supervisor can close a stuck run … the run then stands submitted with the gap recorded, and the finish window still guarantees it finishes even if the device never returns."',
        locator: 'DEC-STUCK-001 Reading B · L5256 (§6.2.6)',
      },
      {
        text: 'The source disagrees with itself on which state that is — §6.2.6 says the run "stands submitted with the gap recorded", §2.4 says it "is complete at close time" — so the state is governed by DEC-STUCK-001 and neither reading is adopted here. The finish-window clock behaviour is common to both readings and is what this criterion asserts.',
        locator: 'AC-RUN-004 · L7128',
      },
      {
        text: 'Option 3, because §6.2.6 requires the gap to be recorded and §2.4 requires the finish clock to run from close time, and Option 3 satisfies both.',
        locator: 'DEC-STUCK-001 recommendation · L5259',
      },
      {
        text: 'Options. (1) Complete at close, per Reading A. (2) Submitted at close, per Reading B, with the summary computed when the finish window elapses. (3) Complete at close but flagged as manually closed with a recorded gap, which carries both intentions.',
        locator: 'DEC-STUCK-001 options · L5258',
      },
    ],
    adopted:
      'Nothing is adopted, because there is nothing here to adopt it on. Row 6 is an act this ' +
      'surface does not carry — EXCL-FL-06 makes worker-initiated terminal completion an Invariant ' +
      'exclusion — so this panel draws no control whose behaviour would turn on the answer. What ' +
      'this build does is refuse to let the cell’s wording pass as the source’s settled position: ' +
      'the cell is transcribed verbatim, and the decision is disclosed beside it with both readings ' +
      'and with AC-RUN-004’s refusal of both. A second matrix at L27917 states Reading A the same ' +
      'way, which is how one reading becomes the record without a decision ever being taken.',
    whyHere:
      'The Supervisor cell of row 6 (L41954) reads "Allowed with conditions — a manually closed ' +
      'stuck run is complete at close time and finishes on the same clock, in the Delivery ' +
      'Operations Hub". That clause is Reading A word for word. The Quality Manager cell reads only ' +
      '"— same" and inherits it. Section 22.20 names no DEC-* identifier anywhere, so a reader of ' +
      'this matrix alone would take the condition for a fact.',
    canonNote: CANON_NOTE,
  },
  {
    decisionRef: 'DEC-PARK-001',
    question:
      'What happens when a Run parked at a qualification gate is the worker’s only assigned Run. This module’s at-step expiry block is one of the two things that park it.',
    readings: [
      {
        text: 'Open item: what happens when the parked Run is the worker’s only assigned Run is Not specified in the Statement of Work and is proposed as DEC-PARK-001; the candidate behaviours are that the worker idles with an honest explanation, that the Supervisor is escalated to immediately rather than through the ordinary path, or that the run no-show timers at plus 15 and plus 30 minutes take over.',
        locator: 'DEC-PARK-001 · L41682',
      },
      {
        text: 'Terminal safe state: the parked Run, with all prior captures preserved and queued. There is no on-device worker override, ever. Open item: what happens when the parked Run is the worker’s only assigned Run is Not specified in the Statement of Work and is proposed as DEC-PARK-001.',
        locator: 'FB-FL-GATE-01, this module’s named pattern · L40112',
      },
      {
        text: 'DEC-PARK-001 is proposed as new.',
        locator: 'L40167 · §22.9 source classification',
      },
    ],
    adopted:
      'No behaviour is chosen. The panel states the block and states that the answer to what a ' +
      'worker with no other assigned Run does next is not in the Statement of Work, with all three ' +
      'candidate behaviours on the record. Choosing one here would answer a question the source ' +
      'left to the client, on the screen where the worker would live with it.',
    whyHere:
      'FUNC-B11-04-1-1 (L42029) and FUNC-B11-04-1-2 (L42030) both name FB-FL-GATE-01 as their ' +
      'fallback, the card’s Fallback identifier line (L42007) names it for the expiry block, and ' +
      'FB-FL-GATE-01’s terminal safe state IS the parked Run. The open item is recorded on that ' +
      'pattern’s own line. This module supplies the block; the unanswered question is what the ' +
      'block leaves the worker doing.',
    canonNote: CANON_NOTE,
  },
  {
    decisionRef: 'DEC-NOSHIFT-001',
    question:
      'Where an escalation goes when nobody holding the target role is on shift. This module’s at-step expiry block escalates on exactly that path.',
    readings: [
      {
        text: 'Nobody holding the target role is on shift | The tenant’s Quality Manager role irrespective of shift, marked visibly as a fallback delivery | in-app and email | created, eligible, queued, sent, delivered, read, acknowledged — carried as DEC-NOSHIFT-001',
        locator: 'DEC-NOSHIFT-001, the routing row itself · L40967',
      },
      {
        text: 'Fallback failure: no holder of the target role is on shift. Terminal safe state: the platform default escalates to the tenant’s Quality Manager role irrespective of shift, marked as a fallback delivery — carried as DEC-NOSHIFT-001 and not treated as settled',
        locator: 'L2681 · the platform-level statement of the same failure',
      },
      {
        text: 'DEC-NOSHIFT-001 is preserved unresolved.',
        locator: 'L2687 · §7.1.5 source classification',
      },
    ],
    adopted:
      'Nothing is resolved. This module renders the escalation path its own notification table ' +
      'states — the Supervisor through the standard path, escalating to the Quality Manager after ' +
      'two minutes unacknowledged — and states that where nobody holding the target role is on ' +
      'shift the destination is unresolved. The device raises the event; it never decides who ' +
      'receives it.',
    whyHere:
      'This module’s notification table (L42001) routes an at-step expiry block to "The Supervisor, ' +
      'through the standard escalation path", escalating to the Quality Manager after 2 minutes ' +
      'unacknowledged. That is the path DEC-NOSHIFT-001 sits at the end of, and the expiry block ' +
      'this module enforces is what puts a worker on it.',
    canonNote: CANON_NOTE,
  },
  {
    decisionRef: 'DEC-PLUS-001',
    question:
      'What "Supervisor and above" means across five roles the platform states are additive and non-hierarchical. This module’s substitution authority is written in exactly that form.',
    readings: [
      {
        text: 'Reading A: the plus form is a shorthand for an ordering across the five roles, in which a Quality Manager can do everything a Supervisor can do and more.',
        locator: 'DEC-PLUS-001 Reading A · L14670',
      },
      {
        text: 'Reading B: the plus form is a shorthand for an enumerated set, and the roles remain unordered and purely additive, so "Supervisor+" means "the enumerated set of role types that hold this action", which the matrices happen to abbreviate.',
        locator: 'DEC-PLUS-001 Reading B · L14670',
      },
      {
        text: 'This chapter therefore reads Supervisor and above as "any identity holding the Supervisor role or the Quality Manager role", and never as a rank comparison, and preserves the ambiguity as DEC-PLUS-001.',
        locator: 'L39840 · Client Decision Required — DEC-PLUS-001',
      },
    ],
    adopted:
      'The chapter’s reading is carried and labelled as the chapter’s: an identity holding the ' +
      'Supervisor role or the Quality Manager role, never a rank comparison. It costs this module ' +
      'nothing to carry, because the matrix rows it governs are both on the far side of the ' +
      'surface boundary and neither draws a control here. Nothing on this screen orders the five ' +
      'roles, and no cell is widened or narrowed by the reading.',
    whyHere:
      'FUNC-B11-03-1-1 (L42024) reads "Roles allowed: Supervisor and above initiate; the device ' +
      'applies", and the command class that carries the act gives its authority as "Supervisor and ' +
      'above" too (CMD-FL-REASSIGN, L39663). Row 7 of this matrix is that act. Which identities the ' +
      'phrase admits is the question DEC-PLUS-001 leaves open.',
    canonNote: CANON_NOTE,
  },
] as const satisfies readonly B11Disclosure[]

/* ==================================================================== *
 * FINDINGS AGAINST THE SOURCE — RECORDED, NOT CLOSED.
 * ==================================================================== */

export interface B11SourceFinding {
  readonly what: string
  readonly evidence: string
  readonly notClosedBecause: string
  readonly sourceRef: string
}

export const B11_SOURCE_FINDINGS = [
  {
    what: 'Section 22.20 names no DEC-* identifier anywhere, and it carries four open questions all the same.',
    evidence:
      'A sweep of every line from L41929 to L42091 finds zero occurrences of any DEC-* token. Yet ' +
      'row 6 states Reading A of DEC-STUCK-001 as its own condition, FUNC-B11-03-1-1 uses the ' +
      '"Supervisor and above" form DEC-PLUS-001 governs, the expiry block’s named fallback pattern ' +
      'carries DEC-PARK-001 on its own line, and the module’s notification table routes onto the ' +
      'escalation path DEC-NOSHIFT-001 sits at the end of.',
    notClosedBecause:
      'A section that names no decision reads settled, and this one is not. Each of the four is ' +
      'disclosed with the sentence in this module that reaches it, so a reader can see why it ' +
      'applies here rather than being asked to take it on trust.',
    sourceRef: 'L41929-L42091, swept; L41954, L42024, L42007, L42001',
  },
  {
    what: 'Row 6 states one reading of an open decision as settled fact, and a second matrix elsewhere in the source does the same.',
    evidence:
      'L41954’s Supervisor cell reads "a manually closed stuck run is complete at close time and ' +
      'finishes on the same clock", which is DEC-STUCK-001 Reading A (L5255) word for word. L27917 ' +
      'carries the same adoption in another matrix: "Allowed with conditions — the run is complete ' +
      'at close time and finishes on the same clock". AC-RUN-004 (L7128) refuses both readings ' +
      'explicitly.',
    notClosedBecause:
      'Correcting the cell would be this build editing the source; leaving it alone would let one ' +
      'reading pass as the answer. The cell is transcribed exactly as written and the decision is ' +
      'disclosed beside it, which is the only move that does neither.',
    sourceRef: 'L41954 against L5255, L5256, L7128, L27917',
  },
  {
    what: 'Three parts of the source give three different fallback sets for this module: four, five and six patterns.',
    evidence:
      'The §22.9 map (L40130-L40143) lists MOD-FL-B11 against FB-FL-AUTH-01, FB-FL-CMD-01, ' +
      'FB-FL-GATE-01 and FB-FL-SEC-01 — four. The card’s Fallback identifier line (L42007) names ' +
      'those four plus FB-FL-UP-01 — five. The eleven functionalities name those five plus ' +
      'FB-FL-CAP-01 — six. FB-FL-UP-01’s map row (L40134) does not carry this module and ' +
      'FB-FL-CAP-01’s (L40133) does not either.',
    notClosedBecause:
      'No DEC-* identifier is attached to the disagreement anywhere in the frozen source, so there ' +
      'is nothing to disclose it under. All three readings are carried apart and none is ' +
      'reconciled. Reconciling them would produce a fallback set no part of the source states.',
    sourceRef: 'L40130-L40143; L42007; L42015-L42033',
  },
  {
    what: 'Two of the eleven functionalities name no FB-FL-* pattern, and each gives its own ground.',
    evidence:
      'FUNC-B11-01-1-2 (L42016) ends "Fallback: Not applicable — a state that does not exist cannot ' +
      'fail." FUNC-B11-02-1-3 (L42021) ends "Fallback: Not applicable — an excluded capability has ' +
      'no failure mode." AC-FL-011-1 (L40151) asks every functionality in the chapter to name at ' +
      'least one.',
    notClosedBecause:
      'Reported, not filled. An assigned pattern is indistinguishable from a real one forever ' +
      'afterwards, and the criterion would then read clean because nobody looked. Both grounds are ' +
      'the source’s own words and both are coherent: a state that does not exist and a capability ' +
      'excluded by invariant genuinely have no failure mode.',
    sourceRef: 'L42016, L42021 against AC-FL-011-1 L40151',
  },
  {
    what: 'Wave 0’s controlsOnActsHeldElsewhere cannot catch the defect shape its own comment says actually ships.',
    evidence:
      'Its second loop reads: if the drawn affordance is not a control, skip; if the row’s surface ' +
      'is screen or chrome, skip. But frontlineAffordance returns cross-surface or named-place — ' +
      'never control — for exactly the two surfaces that loop does not skip, so the loop is ' +
      'unreachable by construction. The only live check is the INVARIANT_ACT_TEXT one above it, ' +
      'which matches three Action strings across the whole surface. Misclassifying this module’s ' +
      'row 7, Initiate a mid-Run substitution, as this screen’s was planted and the guard stayed ' +
      'green; it draws a Supervisor and a Quality Manager control for an act the Delivery ' +
      'Operations Hub owns.',
    notClosedBecause:
      'Wave 0 is not this task’s file to change, and a second spelling of the ruling in this module ' +
      'would be the defect shape this build has recorded most. This module’s own suite instead ' +
      'checks the classification against the SOURCE — a row is another-surface exactly when one of ' +
      'its own five cells names the Delivery Operations Hub — which is a stronger question than ' +
      'the one wave 0 asks and does not depend on an act being one of the three named ones.',
    sourceRef: 'src/frontline/matrix.ts controlsOnActsHeldElsewhere, against L41955',
  },
  {
    what: 'The rigour grade this module was dispatched with is a build-plan value, not a source one.',
    evidence:
      'The frozen source’s module inventory carries a Band column — header L39844 — and this ' +
      'module’s own row is L39856, which reads B. A1 through A7 read A and B8 through B12 read B, ' +
      'which is what the letter in the module identifier means. The dispatch’s grade is neither of ' +
      'those letters and comes from the re-plan rather than from the source.',
    notClosedBecause:
      'Recorded so the re-plan’s rigour grade is not mistaken for a product fact. Neither the ' +
      'grade nor the band is rendered anywhere in this module — the grade is not spelled even ' +
      'here, because a reader of this panel has no use for a build-plan token, and the band is the ' +
      'source’s own and says nothing they need either.',
    sourceRef: 'Band header L39844; MOD-FL-B11 row L39856',
  },
] as const satisfies readonly B11SourceFinding[]
