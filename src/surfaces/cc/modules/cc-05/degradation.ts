import { AI_ABILITY_REGISTER, aiAbility } from '@/ai/abilities/register'
import { agentDegradationContract, matrixCellProvenance } from '@/ai/agents/contracts'
import { AI_AGENT_ROSTER, aiRosterAgent } from '@/ai/agents/roster'
import { deterministicStandingUnder } from '@/ai/boundary/matrix'
import { AI_MODE_IDS, type AiModeId, type AiModeRow } from '@/ai/modes'
import type { ProvenanceClassId } from '@/ai/provenance/classes'
import { cellFromSource } from '@/policy/columns'
import type { PermissionOutcome } from '@/policy/decision'
import { CC_DECISION_REGISTER, type CcDecisionRow } from '@/surfaces/cc/decisions/register'
import { cc05Decidability, type Cc05Decidability, type Cc05GateItem } from './queue'

/**
 * `MOD-CC-05` UNDER ARTIFICIAL-INTELLIGENCE DEGRADATION.
 *
 * The queue already ships. `./matrix.ts` holds who may act, `./queue.ts` holds
 * `FB-CC-QUEUE`, the waiting clock and the two unactioned-item prohibitions,
 * and `./readings.ts` holds every place another table answers one of those
 * rows differently. This file adds one thing and nothing else: what the queue
 * is when the agent that fills it is degraded, paused or gone.
 *
 * ── THE CONSTRAINT IS `AI-07`'S OWN ATTRIBUTE ROW, AND IT IS CONSUMED ─────
 *
 * `AI-07` (L87934) is the beyond-policy containment proposal — the ability
 * whose proposals land in this queue. Its human approval, its validation
 * gate, its expiry and its safe-stop behaviour are the whole of the contract
 * this overlay has to honour, and `src/ai/abilities/register.ts` already holds
 * every one of them verbatim, re-parsed against the frozen paragraph by its
 * own suite. NOTHING BELOW RESTATES THEM. `CC05_AI07_ATTRIBUTES` is a
 * projection of the register's record, so a value clipped in transit here
 * would have to disagree with the paragraph the covering test re-reads.
 *
 * The one that decides the empty state is the expiry: the item never expires,
 * it ages and re-routes. A queue that expires a gate item contradicts the
 * register, and an empty queue explained by expiry contradicts it twice.
 *
 * ── THE ABSENCE IS MODELLED, BECAUSE AN ABSENCE IS NOT SELF-EVIDENT ──────
 *
 * "The item does not self-approve" is not demonstrated by the absence of a
 * self-approval code path. An absence that is merely not-implemented and an
 * absence that is guaranteed look identical from outside, and this build has
 * shipped the first while claiming the second. `Cc05PendingStanding` therefore
 * carries `stillInQueue: true`, `selfApproved: false`, `selfDeclined: false`
 * and `expired: false` as LITERAL TYPES, not booleans: no code path in this
 * module or in any future one can write a different value and compile, and a
 * test can read the guarantee off the returned object rather than inferring it
 * from what is missing.
 *
 * `cc05PendingStandingUnder` takes the mode, and that is the point rather than
 * an oversight — the same shape `deterministicStandingUnder` uses in
 * `src/ai/boundary/matrix.ts`. The mode reaches the function so a screen can
 * say which state it is speaking about; it reaches nothing that could change
 * the answer, and the fold over all sixteen is what makes that checkable.
 *
 * ── WHERE THE TWO SOURCE SENTENCES ARE ──────────────────────────────────
 *
 * §21.8 answers this module directly, twice, and both were opened by hand.
 *
 * L37165, the artificial-intelligence paragraph: *"Action agents create items;
 * they never decide them, never execute on timeout, and never self-approve."*
 * Three refusals, and they are the agent's, under every mode.
 *
 * L37167, the no-artificial-intelligence paragraph: *"With agents unavailable,
 * no new gate items arise, which is the correct outcome: there is nothing to
 * gate. Items already raised remain fully decidable, including during an
 * emergency pause, because the human authority does not depend on the agent
 * that raised the item. The queue states plainly that agent activity is
 * unavailable so that an empty queue is not misread as a quiet floor."*
 *
 * §40.15's emergency-pause diagram states the same division as two nodes: the
 * stop side at L87834 reads "No new agent activations" and the continue side
 * at L87839 reads "Raised gate items stay human-decidable". The Command Center
 * is named on the diagram's own honest-state node at L87848 — "Client Command
 * Center shows agents paused by the platform" — so this surface is the one
 * place the pause is required to be visible, and there is no
 * `Derived Clarification` conflict on it. The conflicting pair the slice
 * carries is about the WORKER surface and is not this module's to settle.
 *
 * ── `DEC-GATE-001` GETS NO FIFTH HOME ───────────────────────────────────
 *
 * It already has four module-local homes with their own readings, and three of
 * those disclose on screen that the shared decision canon holds no record for
 * it. A fifth reading would turn those three rendered statements into false
 * claims, which is why wave 0 checked and deliberately did not canonise it.
 * `CC05_GATE_DECISION_ROW` is the Command Center register's own row, BY
 * REFERENCE — not a copy of its fields — so this file adds no reading at all.
 */

/* ==================================================================== *
 * `AI-07`, CONSUMED.
 * ==================================================================== */

/** The ability whose proposals land in this queue. Read, never respelled. */
export const CC05_AI07 = aiAbility(AI_ABILITY_REGISTER, 'AI-07')

/**
 * The attributes this overlay renders, in the register's own order.
 *
 * Selected by name rather than sliced by position, and the array is the
 * register's own `AbilityAttributeValue` objects rather than reshaped copies:
 * label and value travel together, so a screen cannot print one attribute's
 * label above another's value.
 */
const CONSUMED_ATTRIBUTES = ['humanApproval', 'validationGates', 'expiry', 'safeStop'] as const

export const CC05_AI07_ATTRIBUTES = CONSUMED_ATTRIBUTES.map((name) => {
  const found = CC05_AI07.attributes.find((a) => a.attribute === name)
  if (found === undefined) {
    throw new Error(
      `MOD-CC-05's degradation overlay needs AI-07's "${name}" attribute and the register ` +
        'carries none. The overlay renders the ability register rather than a transcription ' +
        'of it, so there is no local value to fall back to and none may be invented.',
    )
  }
  return found
})

const attributeValue = (name: (typeof CONSUMED_ATTRIBUTES)[number]): string => {
  const found = CC05_AI07_ATTRIBUTES.find((a) => a.attribute === name)
  if (found === undefined) throw new Error(`AI-07 carries no attribute named "${name}".`)
  return found.value
}

/**
 * The agent that raises these items. `SB-CC-16`'s card names it in prose and
 * `./queue.ts` carries that wording; the roster row is the record, and its
 * governance binding — a runtime human gate where it proposes beyond policy —
 * is the same fact `AI-07`'s human-approval attribute states from the other
 * side. Both are rendered; neither is derived from the other.
 */
export const CC05_PROPOSING_AGENT = aiRosterAgent(AI_AGENT_ROSTER, 'deviation-and-containment')

/** Its wave-1 degradation contract, including the class a degraded state emits. */
export const CC05_AGENT_CONTRACT = agentDegradationContract(CC05_PROPOSING_AGENT.id)

/* ==================================================================== *
 * WHETHER A NEW ITEM ARISES — DERIVED FROM THE MODE'S OWN CELL.
 * ==================================================================== */

/**
 * The agent-invocation column read through the tree's own source-cell parser,
 * and the arm is the PARSER'S VERDICT rather than a discriminator assigned by
 * hand. `src/policy/columns.ts` `cellFromSource` knows the nine tokens of the
 * permission vocabulary, the separator rule that stops `Allowed` swallowing
 * `Allowed with conditions`, and it throws on anything else. Five of this
 * column's six values are nine-token values; the sixth is not, and the
 * refusal is how this file finds that out rather than by a list of its own.
 *
 * A hand-written `newItemsArise: false` on a row would be wrong silently the
 * first time a cell changed. This one cannot be: it is recomputed from the
 * cell every call, and the covering test recomputes it a second time from the
 * FROZEN matrix row rather than from the vocabulary module.
 */
export type Cc05InvocationReading =
  | {
      readonly kind: 'nine-token'
      /** The cell verbatim, in the matrix's own spelling. */
      readonly cell: AiModeRow['agentInvocation']
      readonly outcome: PermissionOutcome
    }
  | {
      readonly kind: 'outside-the-nine'
      readonly cell: AiModeRow['agentInvocation']
      /** Why the shared parser refuses it, in its own terms. */
      readonly refusal: string
      /** The source's own answer for this value, so this build states none. */
      readonly answer: string
      readonly answerLine: number
    }

/**
 * `AIMODE-08`'s cell is `Explicitly prohibited for new conversations`, which is
 * a value of this column's own and not a shade of `Explicitly prohibited` —
 * folding it into the shorter token would silently claim the mode blocks a
 * conversation already under way. The source answers the gate-item question
 * for it directly, so nothing is derived here: `AIMODE-08` (L89279) blocks
 * "starting a new agent conversation, because a request that cannot complete
 * is worse than one that was never started". A gate item is raised by a new
 * agent activation, so no new item arises and the sentence saying so is the
 * source's rather than this build's.
 */
const OUTSIDE_THE_NINE_ANSWER =
  'starting a new agent conversation, because a request that cannot complete is worse than ' +
  'one that was never started'
const OUTSIDE_THE_NINE_ANSWER_LINE = 89279

export function cc05InvocationReading(mode: AiModeId): Cc05InvocationReading {
  const cell = deterministicStandingUnder(mode).agentInvocation
  try {
    return { kind: 'nine-token', cell, outcome: cellFromSource(cell).outcome }
  } catch (error) {
    return {
      kind: 'outside-the-nine',
      cell,
      refusal: error instanceof Error ? error.message : String(error),
      answer: OUTSIDE_THE_NINE_ANSWER,
      answerLine: OUTSIDE_THE_NINE_ANSWER_LINE,
    }
  }
}

/**
 * Whether the agent can raise a new gate item while the platform is in `mode`.
 *
 * The switch is total over `PermissionOutcome` and the compiler proves it, on
 * the pattern `availabilityOfOutcome` established in `src/studio/modules/
 * stu-18/rendering.ts`: one mapping, not a second permissive set beside the
 * one `@/policy/decision` already owns. The four outcomes that cannot occur in
 * this column throw rather than guess — an offline or not-applicable cell
 * reaching here is a defect in the matrix, not a case to answer.
 */
function outcomeRaisesItems(outcome: PermissionOutcome): boolean {
  switch (outcome) {
    case 'allowed':
    case 'allowedWithConditions':
      return true
    case 'unavailable':
    case 'explicitlyProhibited':
    case 'clientDecisionRequired':
      return false
    case 'readOnly':
    case 'notApplicable':
    case 'queuedOffline':
    case 'cachedReadOnlyOffline':
      throw new Error(
        `The agent-invocation cell resolved to "${outcome}", which section 42.3's column does ` +
          'not use. Whether an agent may be invoked is not a read grant and not an offline ' +
          'deferral, so there is no answer here to give.',
      )
    default: {
      const exhaustive: never = outcome
      throw new Error(`Unhandled agent-invocation outcome ${JSON.stringify(exhaustive)}`)
    }
  }
}

export function cc05NewItemsArise(mode: AiModeId): boolean {
  const reading = cc05InvocationReading(mode)
  return reading.kind === 'nine-token' ? outcomeRaisesItems(reading.outcome) : false
}

/* ==================================================================== *
 * THE PENDING ITEM, WHOSE PERSISTENCE IS THE WHOLE OVERLAY.
 * ==================================================================== */

export interface Cc05PendingStanding {
  readonly itemId: string
  readonly mode: AiModeId
  /** Section 42.3's own name for the mode, so a screen can say which state. */
  readonly modeName: string
  /** The mode's own agent-invocation cell, verbatim. The only column that varies. */
  readonly agentInvocation: AiModeRow['agentInvocation']
  /** Carried through from the boundary matrix. There is no weaker value in the type. */
  readonly deterministicSafety: 'Allowed'
  /** Whether the agent can raise anything NEW. Never whether this item survives. */
  readonly newItemsArise: boolean

  /* ── The four guarantees, as literal types rather than as booleans. ──── */

  /** No failure state removes a raised item from the queue. */
  readonly stillInQueue: true
  /** No failure state approves it. */
  readonly selfApproved: false
  /** No failure state declines it. */
  readonly selfDeclined: false
  /** No failure state expires it. AI-07's expiry attribute is the authority. */
  readonly expired: false

  /* ── AI-07's own words, consumed. ─────────────────────────────────────── */

  readonly humanApproval: string
  readonly validationGates: string
  readonly expiry: string
  readonly safeStop: string

  /**
   * The item's own decidability, unchanged by the mode. `FB-CC-QUEUE` decides
   * this from the item's unresolved elements and from nothing else, so a
   * degraded platform can neither rescue a stuck item nor stick a sound one.
   */
  readonly decidability: Cc05Decidability
}

/**
 * What a raised gate item is while the platform is in `mode`.
 *
 * Every field that could vary is read from somewhere that owns it; every field
 * that must not vary is a literal type. The mode is an input and reaches
 * exactly two things: the mode's own name and cell, which are labels, and
 * `newItemsArise`, which is about future items rather than about this one.
 */
export function cc05PendingStandingUnder(
  item: Cc05GateItem,
  mode: AiModeId,
): Cc05PendingStanding {
  const standing = deterministicStandingUnder(mode)
  return {
    itemId: item.id,
    mode,
    modeName: standing.modeName,
    agentInvocation: standing.agentInvocation,
    deterministicSafety: standing.deterministicSafety,
    newItemsArise: cc05NewItemsArise(mode),
    stillInQueue: true,
    selfApproved: false,
    selfDeclined: false,
    expired: false,
    humanApproval: attributeValue('humanApproval'),
    validationGates: attributeValue('validationGates'),
    expiry: attributeValue('expiry'),
    safeStop: attributeValue('safeStop'),
    decidability: cc05Decidability(item),
  }
}

/**
 * The same item under all sixteen modes, in the vocabulary's own order.
 *
 * The fold is built FROM `AI_MODE_IDS`, so a test asserting it covers every
 * mode would be asserting a fact about itself. The covering suite therefore
 * compares these identifiers against the ones it walks out of the frozen
 * matrix rows, which is a claim that can fail.
 */
export function cc05DegradationFold(item: Cc05GateItem): readonly Cc05PendingStanding[] {
  return AI_MODE_IDS.map((mode) => cc05PendingStandingUnder(item, mode))
}

/* ==================================================================== *
 * THE EMPTY QUEUE, WHICH IS THE STATE MOST EASILY MISREAD.
 * ==================================================================== */

/**
 * An empty queue has two entirely different meanings and the source names
 * both. With agents unavailable it means nothing is being raised, and L37167
 * requires the queue to say so "so that an empty queue is not misread as a
 * quiet floor". With agents running it means the floor really is quiet. A
 * single empty state serving both is a screen that lies half the time, and the
 * arm is derived from item creation rather than chosen.
 *
 * Both arms carry the refusal of expiry, because a reader looking at an empty
 * queue is being invited to wonder where the items went, and the register's
 * answer is that none of them went anywhere.
 */
export type Cc05EmptyQueueReading = {
  readonly kind: 'agents-unavailable' | 'agents-active'
  readonly mode: AiModeId
  readonly statement: string
}

export function cc05EmptyQueueReading(mode: AiModeId): Cc05EmptyQueueReading {
  const standing = deterministicStandingUnder(mode)
  const neverExpires =
    `No item left this queue: ${attributeValue('expiry')} ` +
    'An empty queue is never the record of a decision that was not taken.'

  return cc05NewItemsArise(mode)
    ? {
        kind: 'agents-active',
        mode,
        statement:
          `Agent activity is available in ${standing.modeName} (agent invocation: ` +
          `${standing.agentInvocation}). An empty queue here means no proposal has been ` +
          `raised. ${neverExpires}`,
      }
    : {
        kind: 'agents-unavailable',
        mode,
        statement:
          `Agent activity is unavailable in ${standing.modeName} (agent invocation: ` +
          `${standing.agentInvocation}), so no new gate items arise. An empty queue here is ` +
          `not a quiet floor. ${neverExpires}`,
      }
}

/* ==================================================================== *
 * `DEC-GATE-001`, BY REFERENCE.
 * ==================================================================== */

/**
 * The Command Center register's own row for `DEC-GATE-001`, looked up rather
 * than copied. Returning the register's object by reference is what makes "no
 * fifth home" checkable: a covering test can assert IDENTITY, which a copy
 * carrying the same fields would fail.
 */
export const CC05_GATE_DECISION_ROW: CcDecisionRow = (() => {
  const found = CC_DECISION_REGISTER.find((row) => row.id === 'DEC-GATE-001')
  if (found === undefined) {
    throw new Error(
      "The Command Center decision register no longer carries DEC-GATE-001. This module renders " +
        'that surface-level row and holds no reading of its own, because a fifth module-local ' +
        'reading would turn three already-rendered statements into false claims.',
    )
  }
  return found
})()

export const CC05_GATE_DECISION_NOTE =
  'DEC-GATE-001 is disclosed here through the Command Center decision register above, not ' +
  'through a reading written on this module. It already has four module-local homes and three ' +
  'of them state on screen that the shared decision canon holds no record for it; a fifth ' +
  'reading would make those three statements false. What binds this queue is the working ' +
  'position that row already records, and the governance binding the agent roster already ' +
  'declares for the agent that raises these items.'

/* ==================================================================== *
 * PROVENANCE — TWO ELEMENTS, TWO CLASSES, BOTH RESOLVED.
 * ==================================================================== */

/**
 * The degraded-state line — "agent activity is unavailable" — is produced by
 * no model, is not approved content, compares no packaged value and records no
 * person's instruction. Wave 1 already resolved exactly those facts through
 * the classification tree for every agent's degradation state, so this reads
 * that answer rather than resolving it a second time.
 */
export const CC05_STATE_PROVENANCE: ProvenanceClassId =
  CC05_AGENT_CONTRACT.degradationStateProvenance

/**
 * The persistence table is the source's own tables compared against a mode —
 * a packaged value producing an outcome by comparison, with no model in the
 * path. RESOLVED by the contract module rather than pinned as a literal, so a
 * change to the classification order shows up here instead of leaving a stale
 * string standing behind a green assertion.
 *
 * The absolute rule of this slice binds in terms: a deterministic rule is
 * never labelled live artificial intelligence, in any locale, under any
 * failure condition — including a rule that is describing an agent.
 */
export const CC05_PERSISTENCE_PROVENANCE: ProvenanceClassId = matrixCellProvenance()
