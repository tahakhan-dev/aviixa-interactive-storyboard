import {
  applyLaneASignal,
  reverseLaneARefinement,
  type LaneAObservation,
  type LaneARefinement,
  type SelectionWeights,
} from './lane-a'
import type { OpenProposal } from './lane-b'
import { writeOnPublication, type MemoryWrite } from './memory'

/**
 * **THE SINGLE TEST THAT DIVIDES THE WHOLE SYSTEM, AND THE ONE AUDITED
 * WRITE PATH THAT FOLLOWS IT.**
 *
 * L34164: *"Learning divides by a single test: does it alter a configured
 * operating value?"* Everything on one side of that test is applied
 * automatically; everything on the other waits for a person on another
 * surface. This file is where the test is applied — **once** — and it is the
 * only file in the module that names both lanes.
 *
 * ## WHY THE TEST LIVES HERE AND NOT ON EACH BRANCH
 *
 * The screen has two entry points into refinement — the coaching-effectiveness
 * panel and the case-relevance panel — and a third arrives with the proposal
 * queue. Applying the lane test at each of them is how one branch comes to
 * disagree with another, which this build has already paid for once: a scope
 * enforced in the read on one path and in the draw on another leaked. So
 * `routeRefinement` is the convergence point, every candidate passes through
 * it, and the branches downstream have no test of their own to get wrong.
 *
 * ## THE LANE-B ARM HAS NOWHERE TO PUT A CHANGE
 *
 * `RoutedRefinement`'s `'B'` arm carries a proposal and **no weights, no
 * write, and no audit entry**. It is not that the lane-B branch declines to
 * apply the value — it is that the value it returns has no field an applied
 * change could travel in, and `LearningAct` below has no member that could
 * carry one either. `applyLearningAct` can apply a Lane-A refinement, reverse
 * one, or write the two memory layers the Studio owns. There is no fourth
 * act, and the absence is the enforcement.
 *
 * ## THE AUDIT IS WRITTEN BEFORE THE CHANGE, ON EVERY ACT THIS MODULE OWNS
 *
 * L34320: *"Every Lane-A refinement is logged and reversible. Every Lane-B
 * proposal, decision, decider identity, decision time, publication, and
 * adoption is audited. The audit trail is what makes 'never auto-approved;
 * automatically published' a defensible statement rather than a slogan."*
 * `FB-STU-10` (L31453): an action that cannot be audited does not happen.
 *
 * Three acts, one enforcement point. An audit contract wired to one handler
 * of three is a defect this build has shipped.
 *
 * **Flagging and retiring a coaching asset is deliberately NOT one of these
 * acts.** `MOD-STU-07` already owns `retireCoachingAsset` and its own audited
 * commit; routing it through a second audit path here would write two entries
 * for one act, and re-implementing it here would be a second spelling of an
 * existing idea. `./rendering.ts` calls `MOD-STU-07`'s function and hands the
 * audit sink straight through.
 */

/* ==================================================================== *
 * THE SINGLE TEST.
 * ==================================================================== */

/**
 * What a candidate refinement would touch. Two arms, because the source's
 * test has two answers.
 *
 * The `'selection'` arm carries a Lane-A observation, whose four keys are
 * asset, language, failure pattern and screen. The `'configured-value'` arm
 * carries a proposal, which is where a current value and a proposed value
 * live. Neither arm can be read as the other.
 */
export type RefinementTarget =
  | { readonly kind: 'selection'; readonly observation: LaneAObservation }
  | { readonly kind: 'configured-value'; readonly proposal: OpenProposal }

/**
 * THE SINGLE TEST, L34164. *"Does it alter a configured operating value?"*
 *
 * L34171 names the three the source itself gives: *"a trigger percentage, a
 * routing target, checklist content"*. All three are values a person set in
 * the Studio, and all three live on a proposal. Selection and ranking are
 * *"refinements ... on top of the deterministic foundation"* (L34166) and set
 * nothing.
 */
export function altersAConfiguredOperatingValue(target: RefinementTarget): boolean {
  return target.kind === 'configured-value'
}

export type Lane = 'A' | 'B'

export function laneOf(target: RefinementTarget): Lane {
  return altersAConfiguredOperatingValue(target) ? 'B' : 'A'
}

export const SINGLE_TEST_STATEMENT =
  'Learning divides by a single test: does it alter a configured operating value? Lane A is ' +
  'everything that does not — refinements of selection and ranking on top of the deterministic ' +
  'foundation — and it changes no configured value by definition, so those refinements are ' +
  'applied automatically, logged, and reversible. Lane B is any refinement that would change a ' +
  'configured operating value: a trigger percentage, a routing target, checklist content. It is ' +
  'surfaced as an evidence-backed proposal and decided by a person in the Client Command Center, ' +
  'exactly once (L34164, L34170, L34171).'

/** `SB-STU-19`'s footer, verbatim (L34293). Not conditional on anything. */
export const LEARNING_FOOTER =
  'Nothing here changes a configured value without a person approving it. Lane A changes no ' +
  'configured value at all.'

/* ==================================================================== *
 * THE AUDIT CONTRACT AND THE THREE ACTS.
 * ==================================================================== */

export type LearningActId =
  | 'apply-lane-a-refinement'
  | 'reverse-lane-a-refinement'
  | 'write-memory-on-publication'

export const LEARNING_ACT_IDS = [
  'apply-lane-a-refinement',
  'reverse-lane-a-refinement',
  'write-memory-on-publication',
] as const satisfies readonly LearningActId[]

type MissingFromActIds = Exclude<LearningActId, (typeof LEARNING_ACT_IDS)[number]>
const _actIdsExhaustive: MissingFromActIds extends never ? true : never = true
void _actIdsExhaustive

export type LearningAct =
  | { readonly act: 'apply-lane-a-refinement'; readonly observation: LaneAObservation }
  | { readonly act: 'reverse-lane-a-refinement'; readonly refinement: LaneARefinement }
  | {
      readonly act: 'write-memory-on-publication'
      readonly versionNumber: string
      readonly qualificationRequirements: readonly string[]
    }

export interface LearningAuditEntry {
  /** Identity and action, never "acting as role" (L34657). */
  readonly actorIdentityId: string
  readonly act: LearningActId
  readonly detail: string
  readonly sourceRefs: readonly string[]
}

export type LearningAuditWrite = (
  entry: LearningAuditEntry,
) => { readonly ok: true } | { readonly ok: false; readonly reason: string }

export type LearningActResult =
  | { readonly outcome: 'refused'; readonly reason: string }
  | {
      readonly outcome: 'applied'
      readonly weights: SelectionWeights
      readonly writes: readonly MemoryWrite[]
      /**
       * The refinement this act produced, or `null` where the act produced
       * none. It carries the weight it replaced, which is what makes the
       * screen's Reverse control a restoration rather than a reset.
       */
      readonly refinement: LaneARefinement | null
      readonly summary: string
      readonly audited: LearningAuditEntry
    }

const ACT_REFS: Readonly<Record<LearningActId, readonly string[]>> = {
  'apply-lane-a-refinement': ['L34170', 'FUNC-STU-16-02-C-1 L34228', 'AC-STU-136 L34330'],
  'reverse-lane-a-refinement': ['L34196', 'FUNC-STU-16-02-C-1 L34228', 'AC-STU-136 L34330'],
  'write-memory-on-publication': ['FUNC-STU-16-01-A-1 L34218', 'FUNC-STU-16-01-A-2 L34219'],
}

function detailOf(act: LearningAct): string {
  switch (act.act) {
    case 'apply-lane-a-refinement':
      return `Lane-A selection weight for ${act.observation.signal.assetId} on ${act.observation.signal.screenId} (${act.observation.signal.locale}, "${act.observation.signal.failurePattern}") over ${act.observation.selections} selections`
    case 'reverse-lane-a-refinement':
      return `Reversal of ${act.refinement.id}, restoring the selection weight to ${act.refinement.priorWeight}`
    case 'write-memory-on-publication':
      return `Procedural and semantic memory written for version ${act.versionNumber}, with ${act.qualificationRequirements.length} qualification requirements`
  }
}

/**
 * **THE ONE WRITE PATH FOR EVERY ACT THIS MODULE OWNS.** The audit entry is
 * written FIRST and the act is refused outright where it cannot be written:
 * *"an action that cannot be audited does not happen"* (`FB-STU-10`,
 * L31453).
 *
 * There is no act here that changes a configured operating value. That is
 * the module's whole contract, held by there being no member of `LearningAct`
 * in which one would fit.
 */
export function applyLearningAct(
  weights: SelectionWeights,
  act: LearningAct,
  identityId: string,
  writeAudit: LearningAuditWrite,
): LearningActResult {
  const audited: LearningAuditEntry = {
    actorIdentityId: identityId,
    act: act.act,
    detail: detailOf(act),
    sourceRefs: ACT_REFS[act.act],
  }

  const written = writeAudit(audited)
  if (!written.ok) {
    return {
      outcome: 'refused',
      reason:
        `Refused: the audit entry could not be written (${written.reason}), so the change was ` +
        'not made. An action that cannot be audited does not happen (FB-STU-10, L31453), and ' +
        'automatic must not mean opaque (L34228).',
    }
  }

  switch (act.act) {
    case 'apply-lane-a-refinement': {
      const applied = applyLaneASignal(weights, act.observation)
      return {
        outcome: 'applied',
        weights: applied.weights,
        writes: [],
        refinement: applied.refinement,
        summary: applied.refinement.summary,
        audited,
      }
    }
    case 'reverse-lane-a-refinement': {
      const reversed = reverseLaneARefinement(weights, act.refinement)
      return {
        outcome: 'applied',
        weights: reversed.weights,
        writes: [],
        refinement: null,
        summary: reversed.summary,
        audited,
      }
    }
    case 'write-memory-on-publication': {
      const writes = writeOnPublication(act.versionNumber, act.qualificationRequirements)
      return {
        outcome: 'applied',
        weights,
        writes,
        refinement: null,
        summary: `Version ${act.versionNumber} written into procedural and semantic memory. The other three stores are not the Studio’s to write.`,
        audited,
      }
    }
  }
}

/* ==================================================================== *
 * THE ROUTER — every candidate passes through here, and only here.
 * ==================================================================== */

/**
 * Where a candidate went. The `'B'` arm has no `weights`, no `writes` and no
 * `audited` — see the file note. It cannot report a change because it cannot
 * hold one.
 */
export type RoutedRefinement =
  | { readonly lane: 'A'; readonly result: LearningActResult }
  | {
      readonly lane: 'B'
      readonly proposal: OpenProposal
      /** Why nothing happened here, in the source's own terms. */
      readonly note: string
    }

/**
 * Apply the single test and route accordingly. **The only caller of
 * `applyLearningAct` for a refinement**, so there is one place where the
 * question is asked and one place where a Lane-A change is committed.
 *
 * A Lane-B candidate reaches no write path at all. The audit sink is not
 * even invoked for it, because nothing happened that there would be an
 * entry for: the proposal already exists and its decision is another
 * surface's act.
 */
export function routeRefinement(
  weights: SelectionWeights,
  target: RefinementTarget,
  identityId: string,
  writeAudit: LearningAuditWrite,
): RoutedRefinement {
  if (target.kind === 'configured-value') {
    return {
      lane: 'B',
      proposal: target.proposal,
      note:
        `“${target.proposal.summary}” would change a configured operating value — ` +
        `${target.proposal.field}, from ${target.proposal.currentValue} to ` +
        `${target.proposal.proposedValue} — so it is Lane B. It is surfaced as a proposal and ` +
        'nothing here applies it. A proposal is never auto-approved: the decision is always ' +
        'human, made exactly once, in the Client Command Center (L34171).',
    }
  }

  return {
    lane: 'A',
    result: applyLearningAct(
      weights,
      { act: 'apply-lane-a-refinement', observation: target.observation },
      identityId,
      writeAudit,
    ),
  }
}

/**
 * What Lane A has already done, unattended, by the time somebody opens the
 * screen — the backlog of observations, each routed through the single test
 * and committed through the one audited path.
 *
 * This is the whole of what "applied automatically" means in this build, and
 * it is arithmetic over a seeded ledger on this page load. Nothing persisted
 * and nothing learned; `LANE_A_SIMULATION_NOTE` says so on screen.
 */
export function applyLaneABacklog(
  weights: SelectionWeights,
  ledger: readonly LaneAObservation[],
  identityId: string,
  writeAudit: LearningAuditWrite,
): {
  readonly weights: SelectionWeights
  readonly refinements: readonly LaneARefinement[]
  readonly refusals: readonly string[]
} {
  let current = weights
  const refinements: LaneARefinement[] = []
  const refusals: string[] = []

  for (const observation of ledger) {
    const routed = routeRefinement(current, { kind: 'selection', observation }, identityId, writeAudit)
    // Unreachable for a `'selection'` target and left as a real branch: if
    // the single test ever routes one of these to Lane B, the screen shows
    // nothing rather than silently applying it, which is the safe direction.
    if (routed.lane !== 'A') continue
    if (routed.result.outcome === 'refused') {
      refusals.push(routed.result.reason)
      continue
    }
    current = routed.result.weights
    if (routed.result.refinement !== null) refinements.push(routed.result.refinement)
  }

  return { weights: current, refinements, refusals }
}
