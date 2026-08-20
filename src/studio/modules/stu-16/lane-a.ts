import {
  itemsInLibrary,
  type CoachingAssetItem,
  type LibraryRegister,
} from '@/studio/modules/stu-07/libraries'
import type { Locale } from '@/studio/vocab'

/**
 * **LANE A — selection and ranking, automatic (L34164-L34169).**
 *
 * ## THIS FILE HOLDS NO REFERENCE TO LANE B, AND THAT IS THE ENFORCEMENT
 *
 * L34164 divides the whole system by one test: *"does it alter a configured
 * operating value?"* Lane A is everything that does not, and L34169 states
 * the consequence as a definition rather than as a rule to be obeyed:
 * **"Lane A changes no configured value by definition"**.
 *
 * A definition is enforced by a structure that cannot express the thing it
 * excludes, so that is what is built here. `./lane-b.ts` owns the configured
 * operating value — the current value, the proposed value, the field. **This
 * file imports nothing from it and names none of its symbols**, and
 * `tests/unit/stu-learning.test.ts` scans both files to prove the edge is
 * absent in both directions. There is no guard to delete: a later refactor
 * cannot weaken a boundary that is drawn by there being no edge.
 *
 * The same shape holds inside the types. `LaneASignal` has **four fields**
 * and `LaneAObservation` adds two counters; not one of them can carry a
 * value a human configured, because there is no field of the right shape to
 * put one in. `applyLaneASignal` takes selection weights and returns
 * selection weights. A caller wanting to change a trigger percentage through
 * this file has nowhere to put the number.
 *
 * ## SUPPORT, NOT SURVEILLANCE — AND HERE THE HAZARD IS INDIRECT
 *
 * L34166 states the Lane-A coaching signal in full and it names four things:
 * *"the platform records that **this asset**, in **this language**, worked
 * for **this failure pattern** on **this screen**."* Asset, language,
 * pattern, screen. **Never worker.** `LaneASignal` is exactly those four, in
 * that order.
 *
 * The panel this feeds groups by ASSET (L34293: *"Coaching effectiveness
 * lists **assets** with resolution rate, sample size, screens where used"*),
 * and there is no code path here that could group by anything else, because
 * no record in this file carries a worker. That is why `PERSON_TERMS` below
 * exists as data rather than as a filter: a filter removes a worker from a
 * record that HAS one, and the fix that matters is a record that never had
 * one. The predicate is the check on the shape, not the shape's defence.
 *
 * L34179 is the hard boundary underneath it: *"Everything learned stays
 * strictly inside the tenant's own manufacturing memory: nothing is shared
 * across tenants, and nothing is exported as external training data."*
 *
 * ## LOGGED AND REVERSIBLE
 *
 * *"applied automatically, logged, and reversible"* (L34169), and
 * `FUNC-STU-16-02-C-1` (L34228): *"automatic must not mean opaque."* Every
 * refinement carries the weight it replaced, so reversing one restores the
 * prior selection rather than resetting to a default nobody chose.
 *
 * ## NOTHING HERE LEARNS
 *
 * `applyLaneASignal` is arithmetic over a seeded ledger. No model is
 * trained, no weight persists between page loads, and nothing on this
 * surface may say otherwise — see `LANE_A_SIMULATION_NOTE`, which the
 * screen renders verbatim.
 */

/* ==================================================================== *
 * THE SIGNAL — four keys, and the fifth one that must never exist.
 * ==================================================================== */

/**
 * L34166, in the source's own order: **asset, language, failure pattern,
 * screen.** `tests/unit/stu-learning.test.ts` pins `Object.keys` against
 * this list exactly, so a fifth key cannot be added quietly.
 */
export interface LaneASignal {
  readonly assetId: string
  readonly locale: Locale
  readonly failurePattern: string
  readonly screenId: string
}

export const LANE_A_SIGNAL_KEYS = [
  'assetId',
  'locale',
  'failurePattern',
  'screenId',
] as const satisfies readonly (keyof LaneASignal)[]

type MissingFromSignalKeys = Exclude<keyof LaneASignal, (typeof LANE_A_SIGNAL_KEYS)[number]>
const _signalKeysExhaustive: MissingFromSignalKeys extends never ? true : never = true
void _signalKeysExhaustive

/**
 * The words that would name a person or a person-scoped measure.
 *
 * DATA, NOT A FILTER. Nothing in this module removes one of these from a
 * record; the point is that no record here has one to remove. This list is
 * what the covering test reads to check the shape, and the test ALSO asserts
 * the list still contains each term — otherwise weakening the list would
 * quietly weaken the check that reads it, which is a defect this build has
 * shipped before.
 */
export const PERSON_TERMS = [
  'worker',
  'workers',
  'operator',
  'operators',
  'employee',
  'employees',
  'person',
  'people',
  'individual',
  'identity',
  'identities',
  'badge',
  'staff',
  'technician',
  'assignee',
  'user',
  'users',
] as const satisfies readonly string[]

const PERSON_TERM_SET: ReadonlySet<string> = new Set<string>(PERSON_TERMS)

/** `assetId` -> `['asset', 'id']`. Word-wise, so `assetName` is not a `name`. */
function words(key: string): readonly string[] {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter((w) => w.length > 0)
    .map((w) => w.toLowerCase())
}

/**
 * Whether any of these keys names a person or a person-scoped measure.
 *
 * A per-worker measure has to NAME the worker to be a grouping key, so the
 * identity terms are the whole test: `workerResolutionRate` fails on
 * `worker`, and `resolutionRate` — an ASSET's measure — passes.
 */
export function namesPersonBehaviouralMeasure(keys: readonly string[]): boolean {
  return keys.some((key) => words(key).some((w) => PERSON_TERM_SET.has(w)))
}

/* ==================================================================== *
 * THE LEDGER — what Lane A has observed. Seeded, and it says so.
 * ==================================================================== */

/**
 * One asset's record against one signal. Two counters and nothing else: no
 * timestamp, no run, no device, and no person.
 */
export interface LaneAObservation {
  readonly signal: LaneASignal
  /** How many times the Prevention Agent selected this asset for this signal. */
  readonly selections: number
  /** Of those, how many ended with the screen completed successfully (L34166). */
  readonly resolutions: number
}

export const LANE_A_SIMULATION_NOTE =
  'Nothing on this screen learned anything. The figures below are read from a seeded ledger of ' +
  'observations, and the weighting is arithmetic over that ledger computed on this page load. No ' +
  'model is trained here, no weight persists between page loads, and no figure here was derived ' +
  'from work anybody actually did.'

/**
 * The seed. Bright Bikes, the card's own illustrative tenant, over the
 * coaching assets `MOD-STU-07`'s seeded corpus already holds — so the two
 * screens describe one corpus rather than two.
 *
 * The rates reproduce the corpus's own stored `resolutionRate` figures
 * (`AST-TORQUE-ANGLE-EN` 0.81, `AST-STALE-CLIP-EN` 0.12) so a reader
 * comparing the two screens is not shown two different numbers for one
 * asset. This module computes the rate from the ledger rather than reading
 * the stored field, because the ledger is what Lane A actually observes and
 * one derivation is better than two figures that can drift.
 */
export const SEEDED_LANE_A_LEDGER = [
  {
    signal: {
      assetId: 'AST-TORQUE-ANGLE-EN',
      locale: 'English',
      failurePattern: 'photograph rejected for camera angle',
      screenId: 'SCREEN-06-TORQUE-PHOTOGRAPH',
    },
    selections: 100,
    resolutions: 81,
  },
  {
    signal: {
      assetId: 'AST-TORQUE-ANGLE-ES',
      locale: 'Spanish',
      failurePattern: 'photograph rejected for camera angle',
      screenId: 'SCREEN-06-TORQUE-PHOTOGRAPH',
    },
    selections: 4,
    resolutions: 3,
  },
  {
    signal: {
      assetId: 'AST-STALE-CLIP-EN',
      locale: 'English',
      failurePattern: 'fastener seated short',
      screenId: 'SCREEN-06-TORQUE-PHOTOGRAPH',
    },
    selections: 50,
    resolutions: 6,
  },
  {
    signal: {
      assetId: 'AST-STALE-CLIP-EN',
      locale: 'English',
      failurePattern: 'fastener seated short',
      screenId: 'SCREEN-09-FINAL-INSPECTION',
    },
    selections: 25,
    resolutions: 3,
  },
] as const satisfies readonly LaneAObservation[]

/** The card's own worked signal, for a reader and for the covering test. */
export function laneASignal(): LaneASignal {
  return { ...SEEDED_LANE_A_LEDGER[0].signal }
}

/* ==================================================================== *
 * COACHING EFFECTIVENESS — SB-STU-19's first panel, grouped by ASSET.
 * ==================================================================== */

/**
 * The low-resolution-rate threshold, and it is a **Derived Clarification**.
 *
 * L34179 says assets "with a low resolution rate are flagged for review or
 * retirement" and `MOD-STU-07` L32666 says an asset is flagged "when it
 * consistently fails to resolve difficulties". **Neither states a number**,
 * and no number is presented here as a source fact: `LOW_PERFORMER_NOTE`
 * renders beside every flag.
 *
 * The minimum sample size is the same clarification's other half, and it is
 * the one that stops the flag being noise: a rate over four selections is
 * not evidence of anything, and `AST-TORQUE-ANGLE-ES` in the seed is exactly
 * that case — 3 of 4, a high rate on a sample too small to read.
 */
export const LOW_RESOLUTION_RATE_THRESHOLD = 0.4
export const MINIMUM_FLAGGING_SAMPLE_SIZE = 20

export const LOW_PERFORMER_NOTE =
  `Derived Clarification. The source flags "a low resolution rate" (L34179) and an asset that ` +
  '"consistently fails to resolve difficulties" (L32666) without stating a number. This build ' +
  `uses below ${Math.round(LOW_RESOLUTION_RATE_THRESHOLD * 100)} per cent over at least ` +
  `${MINIMUM_FLAGGING_SAMPLE_SIZE} selections, and states so rather than presenting either ` +
  'figure as a source fact.'

/**
 * ONE ROW OF THE COACHING-EFFECTIVENESS PANEL. Every field is a property of
 * the ASSET or of the ledger; not one names a person, and there is no field
 * in which one could be carried.
 */
export interface CoachingEffectivenessRow {
  readonly assetId: string
  readonly assetName: string
  readonly locale: Locale
  readonly assetState: CoachingAssetItem['assetState']
  /** L34293 — "screens where used". */
  readonly screensWhereUsed: readonly string[]
  readonly failurePatterns: readonly string[]
  /** L34293 — "sample size". */
  readonly sampleSize: number
  /** L34293 — "resolution rate". `null` where nothing has been observed. */
  readonly resolutionRate: number | null
  /** L34293 — "a flag badge for low performers". */
  readonly flagged: boolean
  /** Why this row is or is not flagged, in plain words. Never a bare badge. */
  readonly flagNote: string
}

/**
 * `SB-STU-19`'s first panel. **Grouped by asset**, over the live register, so
 * retiring an asset changes what the panel says on the next render.
 *
 * Assets with no observation are still listed with a `null` rate — cold
 * start is a real state (L34177) and an asset that has never been selected
 * must not read as an asset that failed.
 */
export function coachingEffectiveness(
  register: LibraryRegister,
  ledger: readonly LaneAObservation[],
): readonly CoachingEffectivenessRow[] {
  const assets = itemsInLibrary(register, 'coaching-corpus').filter(
    (item): item is CoachingAssetItem => item.library === 'coaching-corpus',
  )

  return assets.map((asset) => {
    const observations = ledger.filter((o) => o.signal.assetId === asset.id)
    const sampleSize = observations.reduce((n, o) => n + o.selections, 0)
    const resolved = observations.reduce((n, o) => n + o.resolutions, 0)
    const resolutionRate = sampleSize === 0 ? null : resolved / sampleSize
    const flagged =
      resolutionRate !== null &&
      sampleSize >= MINIMUM_FLAGGING_SAMPLE_SIZE &&
      resolutionRate < LOW_RESOLUTION_RATE_THRESHOLD

    return {
      assetId: asset.id,
      assetName: asset.name,
      locale: asset.locale,
      assetState: asset.assetState,
      screensWhereUsed: [...new Set(observations.map((o) => o.signal.screenId))],
      failurePatterns: [...new Set(observations.map((o) => o.signal.failurePattern))],
      sampleSize,
      resolutionRate,
      flagged,
      flagNote: flagNoteFor(resolutionRate, sampleSize, flagged),
    }
  })
}

function flagNoteFor(rate: number | null, sampleSize: number, flagged: boolean): string {
  if (rate === null) {
    return 'No selections observed yet. At go-live the platform has no history and operates purely on configured values (L34177); an asset nothing has used has not failed.'
  }
  if (sampleSize < MINIMUM_FLAGGING_SAMPLE_SIZE) {
    return `${sampleSize} selections is below the ${MINIMUM_FLAGGING_SAMPLE_SIZE} this build reads a rate over, so no flag is raised either way. ${LOW_PERFORMER_NOTE}`
  }
  if (flagged) {
    return `Flagged for review: ${Math.round(rate * 100)} per cent over ${sampleSize} selections. ${LOW_PERFORMER_NOTE}`
  }
  return `Resolving at ${Math.round(rate * 100)} per cent over ${sampleSize} selections. ${LOW_PERFORMER_NOTE}`
}

/* ==================================================================== *
 * PRIOR-CASE RELEVANCE — SB-STU-19's third panel.
 * ==================================================================== */

/**
 * L34167: *"When a supervisor marks a surfaced prior case as genuinely
 * relevant, or not, that feedback adjusts which prior cases surface next
 * time."* `SB-STU-19` (L34293): *"Prior-case relevance shows the feedback the
 * operation has given and how similarity has shifted."*
 *
 * The feedback is attributed to THE OPERATION, never to the supervisor who
 * gave it — the source's own words are "the feedback the operation has
 * given". `FUNC-STU-16-02-B-1` (L34226) allows "feedback from Supervisor and
 * above" and prohibits "any agent marking its own case relevant"; who gave
 * which piece of feedback is not what this panel is for and there is no
 * field for it.
 */
export interface CaseRelevanceRow {
  readonly caseId: string
  readonly caseSummary: string
  readonly operation: string
  readonly markedRelevant: number
  readonly markedNotRelevant: number
  /** How the similarity weight has shifted, and from what. */
  readonly priorSimilarityWeight: number
  readonly similarityWeight: number
}

export const SEEDED_CASE_RELEVANCE = [
  {
    caseId: 'CASE-2025-11-0184',
    caseSummary: 'Fastener seated short on the same part number, resolved by re-torque',
    operation: 'Wheel bolt torque, assembly line 2',
    markedRelevant: 14,
    markedNotRelevant: 2,
    priorSimilarityWeight: 1,
    similarityWeight: 1.4,
  },
  {
    caseId: 'CASE-2025-09-0042',
    caseSummary: 'Coolant overflow on an adjacent cell, unrelated part family',
    operation: 'Wheel bolt torque, assembly line 2',
    markedRelevant: 1,
    markedNotRelevant: 11,
    priorSimilarityWeight: 1,
    similarityWeight: 0.6,
  },
] as const satisfies readonly CaseRelevanceRow[]

/* ==================================================================== *
 * SELECTION WEIGHTS — applied automatically, logged, REVERSIBLE.
 * ==================================================================== */

/** A signal's key. Derived from the four fields, never stored beside them. */
export function laneASignalKey(signal: LaneASignal): string {
  return `${signal.assetId}|${signal.locale}|${signal.failurePattern}|${signal.screenId}`
}

/**
 * The selection weights. A map from a signal key to a number, and nothing
 * else: there is no branch of this type that could hold a trigger
 * percentage, a routing target or checklist content.
 */
export type SelectionWeights = Readonly<Record<string, number>>

/**
 * ONE applied Lane-A refinement, carrying the weight it replaced. `priorWeight`
 * is what makes `reverseLaneARefinement` a restoration rather than a reset:
 * a reversal that dropped back to a default nobody chose would be a second
 * automatic change dressed as an undo.
 */
export interface LaneARefinement {
  readonly id: string
  readonly signal: LaneASignal
  readonly priorWeight: number
  readonly weight: number
  readonly sampleSize: number
  /** Plain words, for the log and for the screen. */
  readonly summary: string
}

/** The weight a signal carries before anything is observed for it. */
export const DEFAULT_SELECTION_WEIGHT = 1

/**
 * *"Over time selection weights toward what has actually resolved
 * difficulties — always choosing among the approved assets the engineer
 * curated"* (L34166).
 *
 * Weight is the observed resolution rate scaled around the default, so an
 * asset that resolves nothing sinks and one that resolves everything rises,
 * and neither leaves the set the engineer approved.
 */
export function applyLaneASignal(
  weights: SelectionWeights,
  observation: LaneAObservation,
): { readonly weights: SelectionWeights; readonly refinement: LaneARefinement } {
  const key = laneASignalKey(observation.signal)
  const priorWeight = weights[key] ?? DEFAULT_SELECTION_WEIGHT
  const rate = observation.selections === 0 ? 0 : observation.resolutions / observation.selections
  const weight = Number((rate * 2).toFixed(4))

  return {
    weights: { ...weights, [key]: weight },
    refinement: {
      id: `LANEA-${key}`,
      signal: { ...observation.signal },
      priorWeight,
      weight,
      sampleSize: observation.selections,
      summary:
        `Selection weight for ${observation.signal.assetId} on ${observation.signal.screenId} ` +
        `(${observation.signal.locale}, "${observation.signal.failurePattern}") moved from ` +
        `${priorWeight} to ${weight} over ${observation.selections} selections. No configured ` +
        'value changed: Lane A changes none by definition (L34169).',
    },
  }
}

/**
 * *"Allowed — Lane A is reversible"* (L34196). Restores the weight the
 * refinement replaced, exactly.
 */
export function reverseLaneARefinement(
  weights: SelectionWeights,
  refinement: LaneARefinement,
): { readonly weights: SelectionWeights; readonly summary: string } {
  const key = laneASignalKey(refinement.signal)
  return {
    weights: { ...weights, [key]: refinement.priorWeight },
    summary:
      `Reversed ${refinement.id}: the selection weight for ${refinement.signal.assetId} is back ` +
      `at ${refinement.priorWeight}, the value it held before the refinement. Reversing a Lane-A ` +
      'refinement restores the prior selection; it does not reset to a default nobody chose.',
  }
}
