/**
 * THE ARTIFICIAL-INTELLIGENCE OPERATING-MODE MACHINE — THE RULES.
 *
 * `./vocabulary` holds the sixteen modes and the sixteen transitions as data.
 * This file holds every rule that decides whether a mode may be entered, and
 * it is the ONE funnel: `applyTransition` routes through `enterMode`, so a
 * criterion enforced here is enforced on every path rather than on the one a
 * caller happened to use. There is no second entry point.
 *
 * ── `AC-42-305` IS ENFORCED BY CONFIGURATION, NOT BY A COMMENT ─────────────
 * "`AIMODE-04` cannot be entered by any device while `DEC-ONDEVICE-001`
 * remains undecided, enforced by configuration rather than by convention."
 * The configuration is the open-decision canon: `OPEN_DECISION_IDS` is the
 * set of decisions this build holds OPEN, so membership IS undecidedness.
 * `enterMode` reads that register — passed as a parameter, never a
 * module-load snapshot closed over by a filter — and refuses. Nothing here
 * restates the decision text; the canon record carries it, and a surface that
 * needs to explain the refusal calls `decisionRecord`. When the client decides
 * it, the identifier leaves the canon and the refusal lifts with no code
 * change, which is what "by configuration" has to mean if it means anything.
 *
 * ── `AC-42-304` IS A PRECONDITION, NOT A NOTE ──────────────────────────────
 * `AIMODE-16` is refused while any queued capture, queued artificial-
 * intelligence request, or unrecomputed aggregate remains outstanding for the
 * affected scope. All three are separate fields and each is checked; a guard
 * wired to one of three is a shape this build has already shipped once. The
 * refusal names which kinds are outstanding, because "recovery refused" with
 * no reason is not a state a person can act on.
 *
 * ── BOUNDED LIVENESS READS INVOCATIONS, NEVER AN INTERFACE ─────────────────
 * L89394: the mode "advances to unavailable when no agent invocation has
 * succeeded within a defined window rather than when a network interface
 * reports itself up". `LivenessEvidence` has three fields and not one of them
 * can carry a connectivity reading — the constraint is in the type, so a
 * caller cannot pass an interface state even by mistake, and `TEST-42-303`
 * asserts the behaviour rather than reading this paragraph.
 *
 * ── NO TIMING VALUE HAS A DEFAULT HERE ─────────────────────────────────────
 * The source fixes neither the liveness window nor the settling period. Both
 * are required inputs with no fallback: a caller that has no configured value
 * gets a refusal, never a number this build invented. `AIMODE-07` is the
 * terminal safe state precisely because it claims nothing, so refusing is
 * always the safe direction.
 *
 * ── WHAT THIS MODULE DOES NOT DECIDE: `DEC-AIDISCLOSE-001` ─────────────────
 * §40.15 (L87854) rules that the Frontline Worker Application surface shows
 * nothing at all about a platform pause. §42.3 requires the worker's mode chip
 * to read "Live coaching paused by the platform", explicitly not "offline",
 * because the distinction matters to a worker deciding whether to walk to a
 * better signal (L89289, corroborated at L89348 and by the matrix rows L89368
 * and L89369). BOTH are marked `Derived Clarification` and neither outranks
 * the other on provenance. This machine therefore exposes the mode and stops.
 * What a worker-facing surface renders for `AIMODE-13` and `AIMODE-14` is a
 * disclosure decision belonging to the surface task, not a thing settled here
 * — `AIMODE_WORKER_DISCLOSURE_DECISION` names the canon record so that task
 * consumes one record rather than re-deriving the conflict.
 */
import { OPEN_DECISION_IDS, type DecisionId } from '@/disclosure/decisions'
import {
  AI_MODE_TRANSITIONS,
  type AiModeId,
  type AiModeTransition,
  aiMode,
} from './vocabulary'

/**
 * The decision this machine refuses to settle. Named rather than restated:
 * the readings and their locators live in the open-decision canon, and a
 * second copy here would be a second thing to keep true.
 */
export const AIMODE_WORKER_DISCLOSURE_DECISION: DecisionId = 'DEC-AIDISCLOSE-001'

/** The decision `AC-42-305` turns on. */
const ON_DEVICE_DECISION: DecisionId = 'DEC-ONDEVICE-001'

/**
 * `AC-42-304`'s three kinds, each its own field. Counts rather than flags,
 * because "how much is outstanding" is what a reconciliation report shows and
 * a boolean cannot be reconciled against one.
 */
export interface OutstandingWork {
  readonly queuedCaptures: number
  readonly queuedAiRequests: number
  readonly unrecomputedAggregates: number
}

export interface AiModeContext {
  /** The mode in force. It remains in force on every refusal. */
  readonly current: AiModeId
  /**
   * The mode recorded before a pause, for the one transition row whose To
   * cell reads `Prior mode`. `null` where none was recorded, which is a
   * refusal rather than a guess.
   */
  readonly priorMode: AiModeId | null
  /** For the affected scope, not for the device. `AC-42-304` says scope. */
  readonly outstanding: OutstandingWork
  /** Milliseconds the connection has been lost, or `null` if not measured. */
  readonly connectionLostForMs: number | null
  /**
   * The device-side hysteresis policy's settling period. The source names the
   * period and fixes no value for it, so this module holds no default: `null`
   * refuses the one transition that depends on it.
   */
  readonly settlingPeriodMs: number | null
}

/**
 * A typed failure, never a throw. A refused mode change is an expected path —
 * it is most of what `AC-42-304` and `AC-42-305` are for — and `mode` names
 * the mode that remains in force so a caller always has one to render.
 */
export type AiModeRuling =
  | { readonly entered: true; readonly mode: AiModeId; readonly via: string }
  | {
      readonly entered: false
      readonly mode: AiModeId
      readonly refusal: string
      /** The open decision the refusal rests on, or `null` where it rests on
       *  state rather than on an undecided question. */
      readonly decisionRef: DecisionId | null
    }

const outstandingKinds = (work: OutstandingWork): readonly string[] =>
  (Object.keys(work) as readonly (keyof OutstandingWork)[]).filter((key) => work[key] !== 0)

/**
 * THE ONE ENTRY GATE. Every path that puts a device or a surface into a mode
 * comes through here, including `applyTransition` below. Both acceptance
 * criteria that constrain entry are enforced in this function and nowhere
 * else, so there is one place to read and one place to change.
 *
 * `openDecisionIds` is a parameter with the canon as its default rather than
 * a module-load snapshot: a filter closing over a snapshot is the first of
 * this build's ten defect shapes.
 */
export function enterMode(
  target: AiModeId,
  context: AiModeContext,
  openDecisionIds: readonly DecisionId[] = OPEN_DECISION_IDS,
): AiModeRuling {
  // `AC-42-305`. Membership in the open canon IS the undecided state.
  if (target === 'AIMODE-04' && openDecisionIds.includes(ON_DEVICE_DECISION)) {
    return {
      entered: false,
      mode: context.current,
      refusal:
        'AIMODE-04 is defined but never entered while DEC-ONDEVICE-001 is undecided. No device ' +
        'may enter it and no configuration enables it; every offline device enters AIMODE-05.',
      decisionRef: ON_DEVICE_DECISION,
    }
  }

  // `AC-42-304`.
  if (target === 'AIMODE-16') {
    const outstanding = outstandingKinds(context.outstanding)
    if (outstanding.length > 0) {
      return {
        entered: false,
        mode: context.current,
        refusal:
          'AIMODE-16 cannot be entered while work remains outstanding for the affected scope: ' +
          `${outstanding.join(', ')}. Technical recovery with stale dashboards is itself a ` +
          'failure mode.',
        decisionRef: null,
      }
    }
  }

  return { entered: true, mode: target, via: aiMode(target).matrixLocator }
}

/** Every transition row whose From cell covers this mode, `Any` rows included. */
export function transitionsFrom(
  mode: AiModeId,
  register: readonly AiModeTransition[] = AI_MODE_TRANSITIONS,
): readonly AiModeTransition[] {
  return register.filter(
    (row) => row.from.kind === 'any' || row.from.modes.includes(mode),
  )
}

/**
 * Applies one row of the transition-condition table. Adds the table's own
 * constraints — the From cell, the settling-period guard, the `Prior mode`
 * target — and then routes through `enterMode`, which is where the two
 * acceptance criteria live.
 */
export function applyTransition(
  row: AiModeTransition,
  context: AiModeContext,
  openDecisionIds: readonly DecisionId[] = OPEN_DECISION_IDS,
): AiModeRuling {
  if (row.from.kind === 'modes' && !row.from.modes.includes(context.current)) {
    return {
      entered: false,
      mode: context.current,
      refusal:
        `${context.current} is not a source state for the transition at ${row.locator}, whose ` +
        `From cell names ${row.from.modes.join(' or ')}.`,
      decisionRef: null,
    }
  }

  if (row.guard === 'settling-period') {
    if (context.settlingPeriodMs === null) {
      return {
        entered: false,
        mode: context.current,
        refusal:
          `The transition at ${row.locator} happens only beyond the settling period, and no ` +
          'settling period is configured. The source names the period and fixes no value for ' +
          'it, so none is assumed.',
        decisionRef: null,
      }
    }
    if (context.connectionLostForMs === null || context.connectionLostForMs < context.settlingPeriodMs) {
      return {
        entered: false,
        mode: context.current,
        refusal:
          `The connection has not been lost beyond the settling period, so the mode holds at ` +
          `${context.current}. The chip applies hysteresis and does not oscillate with the radio.`,
        decisionRef: null,
      }
    }
  }

  if (row.to.kind === 'prior-mode') {
    if (context.priorMode === null) {
      return {
        entered: false,
        mode: context.current,
        refusal:
          `Resume returns to the prior mode and no prior mode was recorded, so there is nothing ` +
          `to return to. Resume is a separate audited act (${row.locator}) and is not completed ` +
          'by guessing its target.',
        decisionRef: null,
      }
    }
    return enterMode(context.priorMode, context, openDecisionIds)
  }

  return enterMode(row.to.mode, context, openDecisionIds)
}

/* ==================================================================== *
 * BOUNDED LIVENESS — `TEST-42-303`.
 * ==================================================================== */

/**
 * Three fields, and not one of them is a network interface. That is the whole
 * design: L89394 says the machine advances "when no agent invocation has
 * succeeded within a defined window rather than when a network interface
 * reports itself up", so a type that cannot carry an interface reading is a
 * stronger statement of the rule than any check could be.
 */
export interface LivenessEvidence {
  /** When an agent invocation last SUCCEEDED. `null` means none ever has. */
  readonly lastSuccessfulInvocationAt: number | null
  readonly now: number
  /** No default anywhere in this module — the source fixes no window. */
  readonly windowMs: number
}

export type LivenessRuling =
  | { readonly advanced: false; readonly mode: AiModeId }
  | { readonly advanced: true; readonly mode: 'AIMODE-03'; readonly reason: string }

/**
 * Advances to `AIMODE-03` — online and unavailable, "the device has a network
 * but the reasoning layer cannot be reached or is refusing work" — when the
 * window has passed with no successful invocation.
 *
 * WHICH MODES THIS APPLIES TO IS DERIVED FROM THE MATRIX, not from a list
 * written here. A mode is exposed to the check when its own row both permits
 * invocation (`Allowed` or `Allowed with conditions`) and delivers escalation
 * normally rather than queueing it while offline — that pair is how the matrix
 * separates the online family from the offline one. Every other mode already
 * claims no live capability, so there is nothing for this check to withdraw,
 * and it never advances a mode that claims less into one that claims more.
 */
export function boundedLiveness(current: AiModeId, evidence: LivenessEvidence): LivenessRuling {
  const row = aiMode(current)
  const permitsInvocation =
    row.agentInvocation === 'Allowed' || row.agentInvocation === 'Allowed with conditions'
  const online = row.escalationDelivery === 'Allowed'
  if (!permitsInvocation || !online) return { advanced: false, mode: current }

  const succeededInWindow =
    evidence.lastSuccessfulInvocationAt !== null &&
    evidence.now - evidence.lastSuccessfulInvocationAt < evidence.windowMs
  if (succeededInWindow) return { advanced: false, mode: current }

  return {
    advanced: true,
    mode: 'AIMODE-03',
    reason:
      `No agent invocation has succeeded within the configured window, so ${current} is not a ` +
      'state this device can honestly claim. The reasoning layer is unreachable or refusing ' +
      'work; the network interface was not consulted.',
  }
}
