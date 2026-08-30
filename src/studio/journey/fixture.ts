/**
 * The `SEQ-011` journey fixture — the spine the Workflow Builder walkthrough
 * (Task 23) walks, and the shared scenario every Studio module screen shows
 * its own slice of.
 *
 * Two properties this file is built to hold:
 *
 * 1. **Every step is reachable from the one before it, with the object and
 *    version it actually produced.** The states are not a list of convenient
 *    snapshots: they are FOLDED from the steps by `journeyStates`, and each
 *    step states a precondition that is checked against the state its
 *    predecessor produced. A walkthrough that reached around the interface
 *    would prove nothing about the path a reviewer can walk.
 * 2. **Determinism.** No ambient clock and no randomness. Every date derives
 *    from `JOURNEY_AS_OF`, and every identifier is fixed.
 *
 * Frozen-source anchors: `SEQ-010`…`SEQ-013` at L67873–L68478, the eleven
 * `WF-AUT-0NN` member workflows at L53338–L53730, and the object cards at
 * L8585 and L8595.
 */

/** The four sequence states, in the order the source hands them on. */
export type SequenceStateId =
  | 'STATE-STU-PREPARED'
  | 'STATE-WF-DRAFT-SUBMITTED'
  | 'STATE-WF-RELEASE-APPROVED'
  | 'STATE-WF-PUBLISHED-V210'

export const SEQUENCE_STATES = [
  'STATE-STU-PREPARED',
  'STATE-WF-DRAFT-SUBMITTED',
  'STATE-WF-RELEASE-APPROVED',
  'STATE-WF-PUBLISHED-V210',
] as const satisfies readonly SequenceStateId[]

// Compile-time exhaustiveness check, same shape as `PERMISSION_OUTCOMES` in
// `@/policy/decision.ts`.
type MissingFromSequenceStates = Exclude<SequenceStateId, (typeof SEQUENCE_STATES)[number]>
const _sequenceStatesExhaustive: MissingFromSequenceStates extends never ? true : never = true
void _sequenceStatesExhaustive

/**
 * `MOD-STU-03`'s vocabularies are Task 3's to close; these are the narrow
 * literal types this fixture needs and are deliberately NOT a second closed
 * set competing with `src/studio/vocab/`.
 */
export type DifficultyLevel = 'simple' | 'standard' | 'expanded'
export type Locale = 'English' | 'Spanish'
export type SubmissionStatus =
  | 'Submitted'
  | 'Returned with comments'
  | 'Advanced'
  | 'Released'
  | 'Withdrawn'
export type VersionStatus = 'Published' | 'Superseded' | 'Archived'
export type PackageStatus = 'Defined' | 'Built' | 'Delivered' | 'Pinned' | 'Superseded'
export type BumpClass = 'PATCH' | 'MINOR' | 'MAJOR'

/**
 * The fixed as-of stamp. `SEQ-011` carries illustrative dates 2026-06-15 to
 * 2026-06-21 (L68030); nothing here reads a real clock.
 */
export const JOURNEY_AS_OF = '2026-06-21' as const

/**
 * `SEQ-011`'s ending state (L68040), as data. This is the most complete
 * single statement of a finished draft anywhere in the source and is the
 * target state the fixture builds toward.
 */
export const WHEEL_BOLT_DRAFT_CONTENT = {
  workflowName: 'Assembly — Wheel Bolt Torque Verification',
  /**
   * Job Type "Assembly" is a Bright Bikes TENANT-CREATED entry, not a
   * starter-taxonomy name: "it is not a starter-taxonomy name and none is
   * named anywhere in this blueprint" (L7908). Under `DEC-TAX-002` the
   * seeded catalogue ships empty, so no fixture may name a seeded type.
   */
  jobType: 'Assembly',
  jobTypeOrigin: 'tenant-created; the platform-seeded catalogue is empty under DEC-TAX-002',
  serviceTypeTag: null,
  locales: ['English', 'Spanish'] as readonly Locale[],
  /** Exactly two, and there is no third (L32040, L8595). */
  inheritableDefaults: [
    'default escalation routing template — Assembly Line A',
    'default coaching trigger percentage — 80 per cent',
  ] as readonly string[],
  /** Eleven screens (L8585, L33907). Screens 3 to 10 are the eight bolt screens. */
  screenCount: 11,
  measurementScreens: [3, 4, 5, 6, 7, 8, 9, 10] as readonly number[],
  sharedInstructionBlock: {
    title: 'Bolt Torque Procedure',
    appliedToScreens: [3, 4, 5, 6, 7, 8, 9, 10] as readonly number[],
    sourceRef: 'L32525',
  },
  specification: {
    lowerLimit: 44,
    upperLimit: 47,
    unit: 'Newton metres',
    drawingReference: 'DWG-A441',
  },
  severityBands: [
    { departureFromPercent: 0, departureToPercent: 10, severity: 2 },
    { departureFromPercent: 10, departureToPercent: null, severity: 1 },
  ],
  /** Selected per severity level from configured policy, never invented (L68092). */
  containmentChecklists: [
    { severity: 2, checklist: 'Torque Out-of-Tolerance' },
    { severity: 1, checklist: 'Torque Out-of-Tolerance' },
  ],
  coachingDefaultsDesignated: true,
  qualificationBaseline: 'Torque Wrench Operator Certification',
  screenLevelQualificationAddition: {
    certification: 'Pneumatic Tool Certification',
    screens: [3, 4, 5, 6, 7, 8, 9, 10] as readonly number[],
    sourceRef: 'L68094',
  },
  difficultyLevels: ['simple', 'standard', 'expanded'] as readonly DifficultyLevel[],
  /** The level the author writes; the aid drafts the other two (L68095). */
  authoredLevel: 'standard' as DifficultyLevel,
  auditBlock: { from: 'AUD-BB-000213', to: 'AUD-BB-000268' },
  endingStateSourceRef: 'L68040',
  /**
   * A tension the source leaves standing and this fixture does not settle:
   * `SEQ-010` ends with "no workflow exists and nothing is published"
   * (L67889) yet `SEQ-013` publishes this workflow's first version as
   * `v2.1.0` "with … its permanently readable prior-version history"
   * (L68344). The version number is carried exactly as the source states it,
   * and the oddity renders rather than being renumbered to `v1.0.0`.
   */
  firstPublishedVersionNote:
    'The first publication of this workflow is v2.1.0, not v1.0.0 — carried verbatim from L68344; SEQ-010 states no workflow existed beforehand (L67889).',
} as const

export interface DraftRecord {
  readonly id: string
  readonly name: string | null
  readonly jobType: string | null
  readonly locales: readonly Locale[]
  readonly inheritableDefaults: readonly string[]
  readonly screenOrder: readonly number[]
  readonly branchesDrawn: boolean
  readonly gateFailureBranchTarget: string | null
  readonly sectionsConfigured: boolean
  readonly difficultyLevels: readonly DifficultyLevel[]
  readonly localesComplete: readonly Locale[]
  readonly validation: 'not-run' | 'blocked' | 'passed'
  readonly savedAt: string | null
  readonly previewWalkedScreens: readonly number[]
  readonly lastDiff: { readonly against: string | null; readonly changedScreens: number } | null
  /** The published version this draft was created from, where there is one. */
  readonly basedOn: string | null
}

export interface SubmissionRecord {
  readonly id: string
  readonly status: SubmissionStatus
  readonly authorOfRecord: string
  readonly reviewerOfRecord: string | null
  readonly releaseAuthorityOfRecord: string | null
  readonly comments: readonly string[]
  /** D21 — the flag that makes `DEC-RELAUTH-001`'s deadlock visible. */
  readonly stalled: boolean
}

export interface VersionRecord {
  readonly number: string
  readonly status: VersionStatus
  readonly supersededBy: string | null
  /**
   * D21 — `Versioned` and `Distributable` are different states, "so a
   * version can exist in history without ever having been safe to run"
   * (L68465). A published version is not distributable until the package
   * completeness check has passed.
   */
  readonly distributable: boolean
  readonly bumpClass: BumpClass | null
  readonly republishDescription: string | null
}

export interface PackageRecord {
  readonly version: string
  readonly status: PackageStatus
  /** D21 — the state that stops a bad package reaching a device. */
  readonly quarantined: boolean
}

export interface HubPinRecord {
  readonly runId: string
  readonly version: string
  /**
   * The pin is written before the download (L53696). Until the download
   * completes the run "must show as assigned-not-ready" (L53677) — a pin is
   * not a delivery, and a delivery is not an application.
   */
  readonly deviceReadiness: 'assigned-not-ready' | 'ready'
  /** The pin act belongs to `MOD-DOH-06`, slice 6. The Studio states it, never offers it. */
  readonly ownedBy: 'MOD-DOH-06, slice 6'
}

export interface JourneyState {
  readonly sequenceState: SequenceStateId
  readonly draft: DraftRecord | null
  readonly submission: SubmissionRecord | null
  readonly versions: readonly VersionRecord[]
  readonly workPackages: readonly PackageRecord[]
  readonly hubPin: HubPinRecord | null
  /** What an agent evaluation did to THIS workflow. Never blank. */
  readonly agentEvaluationNote: string | null
}

export const INITIAL_JOURNEY_STATE: JourneyState = {
  sequenceState: 'STATE-STU-PREPARED',
  draft: null,
  submission: null,
  versions: [],
  workPackages: [],
  hubPin: null,
  agentEvaluationNote: null,
}

/** A Job can link only to a published version that is safe to run (L68465). */
export function linkableVersions(state: JourneyState): readonly VersionRecord[] {
  return state.versions.filter((v) => v.status === 'Published' && v.distributable)
}

export function versionByNumber(state: JourneyState, number: string): VersionRecord | null {
  return state.versions.find((v) => v.number === number) ?? null
}

export type JourneyPrecondition = { readonly met: true } | { readonly met: false; readonly reason: string }

export const MET: JourneyPrecondition = { met: true }
export const notMet = (reason: string): JourneyPrecondition => ({ met: false, reason })

/**
 * The transition half of a journey step. `@/studio/journey/effects` adds the
 * five-surface effects on top of this and holds the twenty-two records.
 */
export interface JourneyStepTransition {
  readonly number: number
  /** Checked against the state the PREVIOUS step produced. */
  readonly requires: (state: JourneyState) => JourneyPrecondition
  readonly produces: (state: JourneyState) => JourneyState
}

export type JourneyFold =
  | { readonly ok: true; readonly states: readonly JourneyState[] }
  | { readonly ok: false; readonly atStep: number; readonly reason: string }

/**
 * Folds the steps over an initial state and returns every intermediate
 * state — index 0 is the state before step 1, index n the state after step
 * n. A step whose precondition is unmet stops the fold with a typed failure:
 * the journey never jumps to a convenient state.
 */
export function journeyStates(
  steps: readonly JourneyStepTransition[],
  initial: JourneyState = INITIAL_JOURNEY_STATE,
): JourneyFold {
  const states: JourneyState[] = [initial]
  for (const step of steps) {
    const current = states[states.length - 1]!
    const precondition = step.requires(current)
    if (!precondition.met) return { ok: false, atStep: step.number, reason: precondition.reason }
    states.push(step.produces(current))
  }
  return { ok: true, states }
}

export type JourneyStateLookup =
  | { readonly ok: true; readonly state: JourneyState }
  | { readonly ok: false; readonly reason: string }

/** Reads a folded state by step number. Takes the states as a PARAMETER. */
export function journeyStateAfterStep(
  states: readonly JourneyState[],
  stepNumber: number,
): JourneyStateLookup {
  if (!Number.isInteger(stepNumber) || stepNumber < 0 || stepNumber >= states.length)
    return { ok: false, reason: `Step ${stepNumber} is outside this journey's 0..${states.length - 1}` }
  return { ok: true, state: states[stepNumber]! }
}

/**
 * `FB-SEQ-012` (L68262) — the one-person quality team, as a first-class
 * fixture state rather than a paragraph. It branches from the state step 12
 * produces: the submission exists and there is nobody who may review it.
 *
 * L68291 states the answer plainly: "work does not get published faster, it
 * does not get published at all."
 */
export const FB_SEQ_012 = {
  id: 'FB-SEQ-012',
  sourceRef: 'L68262, L68291',
  branchesFromStep: 12,
  primaryFailure:
    'no eligible Reviewer exists because the only other grant-holder authored the submission',
  detection: 'the queue offers no eligible reviewer',
  firstFallback:
    'the Tenant Admin layers an authoring grant on a second qualified person, since cover is handled by manually adding a role or grant',
  fallbackFailure: 'no second person is available at all',
  terminalSafeState:
    'the submission stays submitted and unpublished, no version exists, no package can be built, and no Job can link to it',
  recovery: 'a second grant-holder is provisioned and the review proceeds',
  whatItProves: 'work does not get published faster, it does not get published at all',
  /** It is the staffability check, publish check 11, made operational. */
  publishCheckId: 'chain-staffable',
} as const

/**
 * The terminal safe state, derived from the state the submit step produced
 * rather than hand-written — so it cannot drift from the journey it branches
 * out of.
 */
export function fbSeq012TerminalState(afterSubmit: JourneyState): JourneyState {
  const submission = afterSubmit.submission
  return {
    ...afterSubmit,
    submission:
      submission === null
        ? null
        : { ...submission, status: 'Submitted', reviewerOfRecord: null, stalled: true },
    versions: [],
    workPackages: [],
    hubPin: null,
  }
}
