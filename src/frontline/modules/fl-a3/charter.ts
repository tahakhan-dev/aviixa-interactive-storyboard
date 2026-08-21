/**
 * `MOD-FL-A3` — THE RUN PLAYER. THE IDENTITY CARD, TRANSCRIBED.
 *
 * Every string below is carried from the frozen source's own card lines
 * (L40510-L40545) rather than paraphrased, and every one of them renders.
 * `tests/unit/fl-a3.test.ts` opens the blueprint and asserts each `text` is a
 * substring of the line its `sourceRef` names, so a paraphrase goes red at the
 * line it paraphrased rather than at review.
 *
 * ── ONE STATEMENT IS DELIBERATELY NOT TRANSCRIBED ─────────────────────────
 *
 * `FEAT-A3-06` is the categorical prohibition on telling a worker how fast
 * they are going, and its own wording ENUMERATES the excluded displays by
 * name — which is why this comment does not quote it either. Rendering that
 * enumeration would put those words on the worker's screen, which is the one
 * thing `AC-FL-000-5` (L39100), `AC-SCR-FL-002` (L48690) and `AC-SCOPE-045`
 * (L2683) exist to prevent, and `TEST-FL-000-3` (L39108) is a scan of every
 * rendered screen for exactly them.
 *
 * So the prohibition is carried in the source's OWN plain-words sentence at
 * L40510 — "And at no point, ever, does it tell you how fast you are going." —
 * which states the whole rule and names none of the excluded displays. Where a
 * criterion or a functionality cannot be transcribed for that reason, it is
 * still LISTED, LOCATED and its omission EXPLAINED: `text: null` plus a
 * required `whyNotTranscribed`. A row silently dropped and a row disclosed as
 * untranscribable are different things, and only the second is honest.
 */

/** The module's own identifier and name, L40512. */
export const A3_IDENTIFIER = 'MOD-FL-A3'
export const A3_NAME = 'Run Player'

/**
 * How the source classifies a claim, in the source's own vocabulary. Same
 * three members `src/studio/modules/stu-01/charter.ts` uses, because it is the
 * source's vocabulary and not a per-module one.
 */
export type A3SourceClass = 'SoW Fact' | 'Derived Clarification' | 'Client Decision Required'

export type A3CardStatementId =
  | 'plain-words'
  | 'purpose'
  | 'user-benefit'
  | 'owning-surface'
  | 'roles'
  | 'preconditions'
  | 'inputs'
  | 'outputs'
  | 'objects'
  | 'states'
  | 'online'
  | 'offline'
  | 'reconnect'
  | 'no-artificial-intelligence'
  | 'fallback-identifiers'

export const A3_CARD_STATEMENT_IDS = [
  'plain-words',
  'purpose',
  'user-benefit',
  'owning-surface',
  'roles',
  'preconditions',
  'inputs',
  'outputs',
  'objects',
  'states',
  'online',
  'offline',
  'reconnect',
  'no-artificial-intelligence',
  'fallback-identifiers',
] as const satisfies readonly A3CardStatementId[]

type MissingFromCardIds = Exclude<A3CardStatementId, (typeof A3_CARD_STATEMENT_IDS)[number]>
const _cardIdsExhaustive: MissingFromCardIds extends never ? true : never = true
void _cardIdsExhaustive

export interface A3CardStatement {
  readonly id: A3CardStatementId
  /** The heading the claim renders under. This build's, not the source's. */
  readonly heading: string
  /**
   * The claim, in the frozen source's own words, or `null` where transcribing
   * it would put a categorically excluded word on a rendered screen.
   */
  readonly text: string | null
  /** Required and non-null exactly when `text` is null. Never both, never neither. */
  readonly whyNotTranscribed: string | null
  readonly sourceRef: string
  readonly sourceClass: A3SourceClass
}

export const A3_CARD_STATEMENTS = [
  {
    id: 'plain-words',
    heading: 'In simple words',
    text: 'This is the big screen the worker looks at almost all day. It shows one step at a time, exactly as the person who wrote the instructions laid it out, and it moves forward. If the work is tracked per bicycle, it opens a fresh little folder for each bicycle. You can look back at what you already wrote, but you cannot rub it out; if you got something wrong, you add a note saying what you are changing and why, and both stay. The instructions come in three levels of detail, and you get the one that matches your experience. And at no point, ever, does it tell you how fast you are going.',
    whyNotTranscribed: null,
    sourceRef: 'L40510',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'purpose',
    heading: 'Purpose',
    text: "To be the dominant surface of the application and the engine that renders the Workflow package, driving the worker forward through Studio-authored screens with faithful rendering, per-piece Unit Executions, difficulty-appropriate instructions, and a two-stage completion that maps onto the platform's run lifecycle.",
    whyNotTranscribed: null,
    sourceRef: 'L40514',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'user-benefit',
    heading: 'User benefit',
    text: "The worker's attention stays on the step in front of them. There is no navigation, no hunting, no ambiguity about what to do next, and no possibility of accidentally altering something already recorded.",
    whyNotTranscribed: null,
    sourceRef: 'L40516',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'owning-surface',
    heading: 'Owning surface',
    text: 'Frontline Worker Application (`SURF-FL`). Screen content, sequence, branching, limits, gates, and instruction levels are owned by the Standards and Operations Studio.',
    whyNotTranscribed: null,
    sourceRef: 'L40518',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'roles',
    heading: 'Roles that see and use it',
    text: 'Worker, for execution. Supervisor and Quality Manager, momentarily, at an authored sign-off screen through the second-identity step-up.',
    whyNotTranscribed: null,
    sourceRef: 'L40520',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'preconditions',
    heading: 'Preconditions',
    text: 'A ready Run with a verified, version-pinned package. An authenticated session, with Shared-mode identity re-confirmation completed at Run start. The tenant is not under a suspension state that blocks starting new Runs.',
    whyNotTranscribed: null,
    sourceRef: 'L40537',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'inputs',
    heading: 'Inputs',
    text: "The version-pinned Workflow package: screens, specification limits, severity bands and their tenant action bundles, gate rules, deviation-capture forms, the step's Work Instructions in their authored difficulty levels, and short coaching assets. The worker profile's difficulty-level parameter and language preference. Unit or lot identification where the Job's unit mode requires it.",
    whyNotTranscribed: null,
    sourceRef: 'L40539',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'outputs',
    heading: 'Outputs',
    text: 'Step Execution records; Unit Execution records; capture events with runtime envelopes; append-only correction records; branch decisions taken; the worker-finished declaration.',
    whyNotTranscribed: null,
    sourceRef: 'L40541',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'objects',
    heading: 'Objects affected',
    text: '`OBJ-FL-UNITEXEC` Unit Execution; `OBJ-FL-STEPEXEC` Step Execution; `OBJ-FL-CAPTURE` Data Capture; `OBJ-FL-CORRECTION` the appended correction record; `OBJ-FL-RUNSTATE` the local run state.',
    whyNotTranscribed: null,
    sourceRef: 'L40543',
    sourceClass: 'Derived Clarification',
  },
  {
    id: 'states',
    heading: 'States',
    text: '`STATE-A3-OPENING` package loaded and the run opening; `STATE-A3-UNITOPEN` a Unit Execution is open for a piece; `STATE-A3-STEP` a step screen is presented; `STATE-A3-REVIEW` a prior screen is open read-only; `STATE-A3-CORRECTING` an append-only correction is being composed; `STATE-A3-BRANCHED` an authored branch has routed the worker; `STATE-A3-SIGNOFF` an authored sign-off screen is presented; `STATE-A3-WORKERFINISHED` the worker has declared their part done. The platform states `submitted`, `complete`, and `finished` are run-record states, not player states, and are named here only to map onto them.',
    whyNotTranscribed: null,
    sourceRef: 'L40545',
    sourceClass: 'Derived Clarification',
  },
  {
    id: 'online',
    heading: 'Online behaviour',
    text: 'Identical rendering and identical gate behaviour to the offline case, plus agent-selected coaching cards where the Prevention Agent fires, plus the ability to complete a forced sync before a designated high-risk action such as a sign-off.',
    whyNotTranscribed: null,
    sourceRef: 'L40565',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'offline',
    heading: 'Offline behaviour',
    text: "A full Run executes offline. Screens render offline, driven entirely by the locally held Workflow package. Gates, specification checks, and severity classification run locally as part of the native execution core. Work Instructions render from the package in their authored difficulty levels. Coaching falls back to the step's authored Work Instructions. Sign-offs requiring a forced sync do not proceed.",
    whyNotTranscribed: null,
    sourceRef: 'L40567',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'reconnect',
    heading: 'Reconnect behaviour',
    text: 'Captures upload; coaching becomes agent-selected again at subsequent steps; a version-change command becomes available but never re-bases the in-flight Run, because a Run finishes on the Workflow version it started on; a clearance unparks a parked Run.',
    whyNotTranscribed: null,
    sourceRef: 'L40569',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'no-artificial-intelligence',
    heading: 'With the reasoning layer gone',
    text: "The player renders, navigates, gates, branches, classifies, and completes identically. The only loss is the agent-selected coaching card, replaced by the step's authored Work Instructions.",
    whyNotTranscribed: null,
    sourceRef: 'L40573',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'fallback-identifiers',
    heading: 'Fallback identifier',
    text: '`FB-FL-RENDER-01` primary; `FB-FL-PKG-01` for package problems; `FB-FL-CORE-01` for connectivity; `FB-FL-GATE-01` for gate blocks; `FB-FL-AI-01` for coaching loss; `FB-FL-SCAN-01` for unit identification.',
    whyNotTranscribed: null,
    sourceRef: 'L40592',
    sourceClass: 'SoW Fact',
  },
] as const satisfies readonly A3CardStatement[]

/**
 * The same fifteen, widened to the interface. Every statement carries a `text`
 * today, so under the literal type above `text ?? whyNotTranscribed` narrows
 * the fallback arm to `never` and a renderer cannot compile the null case —
 * which would mean the untranscribable-statement path could not be written
 * until the first one arrived, and then would be written under pressure. The
 * renderer reads this; the suite reads the literal one.
 */
export const A3_CARD: readonly A3CardStatement[] = A3_CARD_STATEMENTS

/**
 * The eight player states of L40545, split out of the card sentence so the
 * panel can list them rather than printing one long line. Derived from the
 * same sentence the card carries; the suite asserts every identifier and every
 * gloss below appears in L40545, so this is a second reading of one line
 * rather than a second source for it.
 */
export interface A3PlayerState {
  readonly id: string
  /** The state's own gloss from L40545, verbatim. */
  readonly gloss: string
}

export const A3_PLAYER_STATES = [
  { id: 'STATE-A3-OPENING', gloss: 'package loaded and the run opening' },
  { id: 'STATE-A3-UNITOPEN', gloss: 'a Unit Execution is open for a piece' },
  { id: 'STATE-A3-STEP', gloss: 'a step screen is presented' },
  { id: 'STATE-A3-REVIEW', gloss: 'a prior screen is open read-only' },
  { id: 'STATE-A3-CORRECTING', gloss: 'an append-only correction is being composed' },
  { id: 'STATE-A3-BRANCHED', gloss: 'an authored branch has routed the worker' },
  { id: 'STATE-A3-SIGNOFF', gloss: 'an authored sign-off screen is presented' },
  { id: 'STATE-A3-WORKERFINISHED', gloss: 'the worker has declared their part done' },
] as const satisfies readonly A3PlayerState[]

/* ==================================================================== *
 * FOUR STATES, NOT ONE. THE CLAIM THIS SURFACE MUST NEVER MAKE.
 *
 * `worker-finished`, `submitted`, `complete` and `finished` are four
 * different things and L40545 says so in the card itself: "The platform
 * states `submitted`, `complete`, and `finished` are run-record states, not
 * player states." The chapter workflow separates them across three numbered
 * steps (L39045-L39047), the module's own happy path across three more
 * (L40559-L40561), and `AC-A3-7` (L40679) makes the separation testable:
 * "Worker-finished and complete-and-synced are distinct, and `finished` is
 * never set by the device."
 *
 * WHY THIS IS A LIST WITH A `heldBy` FIELD AND NOT FOUR CONSTANTS. The defect
 * is a completion screen reading "Run complete" when the worker has declared
 * finished — it tells the worker the platform holds a record it does not hold.
 * A screen picking a name from a flat list of four would reproduce it. So the
 * panel does not pick: it asks `theStateThisScreenMayName()`, which reads the
 * `heldBy` field and returns the single member the DEVICE holds. Adding a
 * second device-held member makes that function throw, and the suite proves
 * it, so a fifth state cannot arrive quietly and be rendered.
 * ==================================================================== */

export type RunStateHolder =
  /** The device declared it. The only kind a Run Player screen may name. */
  | 'device'
  /** The platform's run record holds it. The device observes it, never sets it. */
  | 'platform-run-record'
  /** The Delivery Operations Hub sets it, with no device involvement at all. */
  | 'delivery-operations-hub'

export interface RunCompletionState {
  /** The state's name as the source writes it. */
  readonly name: string
  readonly heldBy: RunStateHolder
  /** What it actually means, from the source's own sentence. */
  readonly what: string
  readonly sourceRef: string
}

export const RUN_COMPLETION_STATES = [
  {
    name: 'worker-finished',
    heldBy: 'device',
    what: 'The worker declares their part of the Run done. The declaration is a local event and happens offline.',
    sourceRef: 'L40533 (row 8), L40559, L39045, FUNC-A3-05-1-1 L40626',
  },
  {
    name: 'submitted',
    heldBy: 'platform-run-record',
    what: 'The platform run-lifecycle state the declaration stands the Run as. It is a run-record state, not a player state.',
    sourceRef: 'L40545, L40559, L39045',
  },
  {
    name: 'complete',
    heldBy: 'platform-run-record',
    what: 'Reached only when every capture and evidence object for the Run has been received and acknowledged by the server. No worker action can force it, and offline it is unreachable.',
    sourceRef: 'L40560, L39046, FUNC-A3-05-2-1 L40628',
  },
  {
    name: 'finished',
    heldBy: 'delivery-operations-hub',
    what: "Follows automatically after the tenant's record-finish window, default 48 hours, and is a Delivery Operations Hub concern, not a device event.",
    sourceRef: 'L40561, L39047, AC-A3-7 L40679',
  },
] as const satisfies readonly RunCompletionState[]

/**
 * The one state a Run Player screen may put on a completion screen. DERIVED
 * from `heldBy`, never chosen: a second device-held state would make this
 * throw rather than let a screen pick one of two.
 */
export function theStateThisScreenMayName(
  states: readonly RunCompletionState[] = RUN_COMPLETION_STATES,
): RunCompletionState {
  const held = states.filter((s) => s.heldBy === 'device')
  if (held.length !== 1 || held[0] === undefined) {
    throw new Error(
      `The Run Player completion screen may name exactly one device-held state and this ` +
        `register holds ${held.length}. L40545 makes submitted, complete and finished ` +
        'run-record states; a screen naming one of them claims a record the device does not hold.',
    )
  }
  return held[0]
}

/**
 * `SB-FL-000` frame 6 (L39066) and `SCR-FL-16` (L39878) both name the same
 * screen, and both name it by the declaration rather than by completion. This
 * is the sentence the completion screen prints, built from the register above
 * so the wording cannot drift from the ruling.
 */
export function completionScreenLine(
  states: readonly RunCompletionState[] = RUN_COMPLETION_STATES,
): string {
  const held = theStateThisScreenMayName(states)
  const elsewhere = states.filter((s) => s.heldBy !== 'device').map((s) => s.name)
  return (
    `You have declared ${held.name}. That is what this device holds. ` +
    `${elsewhere.join(', ')} are run-record states the platform sets, and this screen ` +
    'does not claim any of them on the platform’s behalf.'
  )
}
