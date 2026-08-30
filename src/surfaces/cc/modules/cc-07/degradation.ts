/**
 * MOD-CC-07 — THE ARTIFICIAL-INTELLIGENCE DEGRADATION OVERLAY.
 *
 * ── THE MEASUREMENT THIS FILE OPENS WITH, BECAUSE IT GOVERNS THE REST ──────
 * `MOD-CC-07` occurs ZERO times in L85974-L95408. Chapters 40 to 44 never name
 * this module by identifier, never give it a screen identifier, and never
 * write a row about it under its own name. Every attribution below is
 * therefore a build inference and renders as one, labelled a client-delegated
 * choice under APP-012.
 *
 * ── AND THE INFERENCE IS DERIVED, NOT ASSERTED ─────────────────────────────
 * §43.3.3's behaviour matrix keys its rows on the module's NAME rather than on
 * its identifier. One of its rows reads "Feedback signal capture", which is
 * exactly the name the Command Center module spine gives `MOD-CC-07`. So the
 * attribution is made by MATCHING the row's cell against the spine's own name
 * string at module load, and it throws if they ever stop matching. A literal
 * `'MOD-CC-07'` written beside a transcribed row would be a discriminator
 * nothing checks, and this build has shipped one of those before.
 *
 * ── WHAT ELSE IS DERIVED HERE ──────────────────────────────────────────────
 * The behaviour cell goes through `@/policy/columns` `cellFromSource`, the one
 * parser this build has for a source permission cell. The provenance class is
 * RESOLVED from the element's facts. The rows that may draw no control are
 * FILTERED from the matrix rather than listed, which independently reproduces
 * the ordinal `./matrix.ts` hand-assigns and gives the suite something that
 * can disagree with it.
 *
 * ── WHAT THIS FILE DOES NOT HOLD ───────────────────────────────────────────
 * No safety-flag item and no quarantine state. `DEC-SAFETY-001` is open on
 * three points including whether the flag exists at all, and 44A.12's Command
 * Center item is the downstream half of a control nobody has authorised.
 */
import type { ProvenanceClassId } from '@/ai/provenance/classes'
import { resolveProvenance, type GuidanceElementFacts } from '@/ai/provenance/contract'
import type { DecisionReading } from '@/disclosure/decisions'
import { cellFromSource, type ColumnCell } from '@/policy/columns'
import { CC07_COLUMNS, CC07_MATRIX, CC07_MODULE, type Cc07Row } from './matrix'

/* ==================================================================== *
 * 1. THE §43.3.3 BEHAVIOUR ROW, AND THE NAME THAT CARRIES IT.
 * ==================================================================== */

export interface CcAiFailureBehaviourRow {
  /** The `Command Center module` cell, verbatim. It is a NAME, not an id. */
  readonly moduleCell: string
  /** The `Behaviour during an artificial-intelligence failure` cell, verbatim. */
  readonly behaviourCell: string
  /** The `Classification` cell, verbatim. */
  readonly classificationCell: string
  readonly sourceRef: string
}

export const CC07_AI_FAILURE_ROW: CcAiFailureBehaviourRow = {
  moduleCell: 'Feedback signal capture',
  behaviourCell: 'Allowed',
  classificationCell: '`SoW Fact — §6.1.6`',
  sourceRef: 'L91088',
}

/**
 * The attribution, made by comparison rather than by assertion. `CC07_MODULE`
 * is the spine entry, whose `name` is read from the module inventory; if the
 * inventory's name and the chapter-43 cell ever diverge, this throws at import
 * and every consumer of the module stops, which is the correct outcome for an
 * attribution that has quietly stopped being true.
 */
export const CC07_AI_FAILURE_ROW_MATCHES_MODULE_NAME: true = (() => {
  if (CC07_AI_FAILURE_ROW.moduleCell !== CC07_MODULE.name) {
    throw new Error(
      `The §43.3.3 behaviour row transcribed here reads "${CC07_AI_FAILURE_ROW.moduleCell}" ` +
        `and the module spine names MOD-CC-07 "${CC07_MODULE.name}". The row is attributed to ` +
        `this module ONLY by that name matching, because chapters 40-44 never name the module ` +
        `by identifier. With the names different, nothing connects the row to the module.`,
    )
  }
  return true as const
})()

export const CC07_AI_FAILURE_CELL: ColumnCell = cellFromSource(CC07_AI_FAILURE_ROW.behaviourCell)

export const CC07_AI_FAILURE_READING = {
  statement:
    'Under an artificial-intelligence failure this module is Allowed and unqualified: the ' +
    'feedback controls stay live because giving a signal is a Hub service call rather than an ' +
    'agent call. The classification cell files it under the deterministic-views section, which ' +
    'is the section behaviour 2 of the nine uses for everything the failure does not touch.',
  butTheThingRATEDMayBeGone:
    'What can be absent is the agent output a signal is ABOUT. This module already names that ' +
    'case as its own third fallback identifier, for the state where the outputs being rated are ' +
    'absent. The control being available and the subject being present are two different ' +
    'questions and the row answers only the first.',
  attributionCaveat:
    'The row is attributed to MOD-CC-07 by name. Chapters 40-44 name this module nowhere, so ' +
    'the attribution is a build inference and is rendered as one — a client-delegated choice ' +
    'under APP-012, not a fact read off the source.',
  sourceRef: 'L91088 · L91034 · L37584',
} as const

/**
 * The acceptance criterion that binds every rendered element of this surface
 * during a failure, quoted rather than paraphrased because what it requires is
 * two specific fields and a paraphrase loses one of them.
 */
export const CC07_AI_ELEMENT_OBLIGATION = {
  criterion:
    'No artificial-intelligence element ever renders without a produced-at time and a context ' +
    'reference.',
  hereItMeans:
    'This module renders no artificial-intelligence output. What it renders is its own source ' +
    'matrix, its two open questions, and controls for signals a person gives. The criterion ' +
    'therefore binds this module vacuously, and that is stated rather than left as a silence ' +
    'that reads the same as an oversight.',
  sourceRef: 'AC-43-332 · L91101',
} as const

/* ==================================================================== *
 * 2. PROVENANCE — RESOLVED, AND EXACTLY ONE CLASS PER ELEMENT.
 * ==================================================================== */

/**
 * What this module draws is source-table content compared against a role and a
 * module: a packaged value producing an outcome by comparison, with no model
 * anywhere in the path. That is `PROV-4`'s own definition, and it is resolved
 * from the facts rather than pinned as a literal — a literal with a test
 * asserting the literal is a claim about itself.
 */
export const CC07_RENDERED_ELEMENT_FACTS: GuidanceElementFacts = {
  producedByModelThisSession: null,
  approvedContentAuthoredAndReleasedEarlier: false,
  packagedValueProducingAnOutcomeByComparison: true,
  namedPersonDecidedOrInstructed: false,
  agentRunId: null,
  decisionRecordId: null,
}

export const CC07_RENDERED_ELEMENT_PROVENANCE: ProvenanceClassId = resolveProvenance(
  CC07_RENDERED_ELEMENT_FACTS,
).classId

/**
 * A learning signal, once a named person has given it. Attribution is to an
 * identity, which is the whole of `PROV-5`. The two classes are held apart
 * here rather than merged into "what this panel shows", because the absolute
 * rule is about exactly that kind of merge.
 */
export const CC07_SIGNAL_FACTS: GuidanceElementFacts = {
  producedByModelThisSession: null,
  approvedContentAuthoredAndReleasedEarlier: false,
  packagedValueProducingAnOutcomeByComparison: false,
  namedPersonDecidedOrInstructed: true,
  agentRunId: null,
  decisionRecordId: null,
}

export const CC07_SIGNAL_PROVENANCE: ProvenanceClassId = resolveProvenance(
  CC07_SIGNAL_FACTS,
).classId

export const CC07_NEVER_LIVE = {
  rule:
    'Cached approved guidance (`PROV-3`) and deterministic rules (`PROV-4`) are never, on any ' +
    'surface, in any locale, under any failure condition, labelled or described as live ' +
    'artificial intelligence.',
  hereItMeans:
    'A one-tap feedback control beside a rendered item does not make that item an agent output. ' +
    'Nothing this module draws is described as live, selected, or agentic, and the two classes ' +
    'it does emit are kept on separate elements.',
  sourceRef: 'L89439',
} as const

/* ==================================================================== *
 * 3. THE ROW THAT MAY DRAW NO CONTROL — FILTERED, NOT LISTED.
 *
 * The capability the row names is a negative: having feedback required before
 * proceeding. A prohibition on a negative means the BEHAVIOUR must not occur,
 * and a disabled control invents the affordance — it says the product could
 * require feedback and is currently choosing not to, which is the opposite of
 * "no such gating exists for any role".
 *
 * `./matrix.ts` reaches the same place by a hand-assigned ordinal whose
 * comment argues the case. This filter derives it from the cells, so the two
 * can disagree and the suite asks whether they do. Nothing here writes how
 * many rows qualify.
 * ==================================================================== */

export function uniformlyProhibitedRows(
  rows: readonly Cc07Row[] = CC07_MATRIX,
): readonly Cc07Row[] {
  return rows.filter((row) =>
    CC07_COLUMNS.every((column) => row.cells[column].token === 'Explicitly prohibited'),
  )
}

export const CC07_NO_CONTROL_RULE = {
  rule:
    'Where every column of a row prohibits, no control is drawn for anybody — not an enabled ' +
    'one and not a disabled one. The row states a property of the system and the panel states ' +
    'it as one.',
  whyThisRow:
    'The Tenant Admin cell of the qualifying row carries the reason in the source’s own words: ' +
    'no such gating exists for any role. A greyed-out control beside "Have feedback required ' +
    'before proceeding" would assert that such gating exists and is switched off.',
  andItIsAlreadyHeld:
    'The panel already draws no control for it and says why. This overlay does not change that ' +
    'rendering; it derives the same conclusion from the cells so the conclusion has a check ' +
    'under it rather than a comment.',
  sourceRef: 'L37511 · L37499 · FUNC-CC-0703-1-1 · L37604',
} as const

/* ==================================================================== *
 * 4. DEC-SAFETY-001 — THIS SURFACE'S HALF OF A CONTROL THE WORKER
 *    SURFACE IS TOLD BOTH TO OMIT AND TO OFFER.
 *
 * The conflict is between two statements about the FRONTLINE card, and
 * `MOD-FL-B8`'s panel carries the worker-side readings in full. What is this
 * module's is the other end: storyboard 44A.12 sends the flag here, and it
 * says the item must be distinct from the learning signals this module owns.
 * The readings below are the ones about THIS surface. They are not a second
 * copy of the worker-side record and they do not restate it.
 * ==================================================================== */

export const CC07_SAFETY_FLAG_DECISION = 'DEC-SAFETY-001'

export interface Cc07LocalDisclosure {
  readonly decisionRef: string
  readonly question: string
  readonly readings: readonly DecisionReading[]
  readonly adopted: string
  readonly whyHere: string
  /** The module carrying the other end of the same decision. */
  readonly coDiscloser: string
  readonly canonNote: string
}

export const CC07_SAFETY_FLAG_DISCLOSURE: Cc07LocalDisclosure = {
  decisionRef: CC07_SAFETY_FLAG_DECISION,
  question:
    'If a worker may flag agent-delivered content as unsafe, this surface receives the flag. Is ' +
    'that item one of this module’s learning signals, or a different kind of object with a ' +
    'different review obligation — and does one report quarantine the asset tenant-wide?',
  readings: [
    {
      text:
        'The storyboard’s five-surface reaction places on this surface "A distinct safety-flag ' +
        'item, visually separate from learning signals and from gate items, with the reporter, ' +
        'the asset, and the context". Distinct from learning signals is a statement about this ' +
        'module specifically: learning signals are what it owns.',
      locator: 'L93756',
    },
    {
      text:
        'And the storyboard’s own acceptance criterion says the same thing as a requirement ' +
        'rather than as a panel description: the flag creates a distinct Command Center item, ' +
        'not a learning signal. So the object 44A.12 sends here is defined by not being the ' +
        'object this module handles.',
      locator: 'AC-44A-12-4 · L93786',
    },
    {
      text:
        'This module’s own optionality rule is the Statement of Work clause that reappears ' +
        'inside the worker-side storyboard: feedback on agent outputs is always optional and ' +
        'one tap, never required, never gating. It constrains how a feedback control behaves ' +
        'and says nothing about whether a safety report is a feedback control at all — which is ' +
        'why quoting it settles neither side.',
      locator: 'L37497',
    },
    {
      text:
        'The Command Center screen the storyboard draws for the item has its own identifier and ' +
        'is not this module’s screen. It occurs exactly once in the frozen source and no screen ' +
        'register holds it, so it is quoted where the source uses it and is not minted here.',
      locator: 'SCR-CC-SAFETY-01 · L93782',
    },
    {
      text:
        'The decision card leaves three points open — whether the flag exists, whether one ' +
        'report quarantines tenant-wide, and what review response time is committed — and the ' +
        'chapter register carries it as Client Decision Required.',
      locator: 'DEC-SAFETY-001 · L93792 · L95394',
    },
  ],
  adopted:
    'No safety-flag item is built here, no quarantine state is modelled, and no review ' +
    'obligation is stubbed. The item’s defining property in the source is that it is NOT a ' +
    'learning signal, so adding one to this module would misfile it on its first appearance; ' +
    'and the whole object is contingent on a decision whose first open point is whether the ' +
    'control that produces it exists. A client-delegated choice under APP-012.',
  whyHere:
    'The worker-side conflict is disclosed on MOD-FL-B8’s panel, where the card is. This module ' +
    'is where the flag would land, so the question of what kind of object it is, and whether it ' +
    'sits beside or apart from the signals this module owns, is asked here.',
  coDiscloser:
    'MOD-FL-B8 carries the same identifier with the worker-side readings — SB-AI-003 against ' +
    'storyboard 44A.12. Two modules disclose one decision because the decision names both ' +
    'surfaces; neither restates the other’s readings, and both say the canon holds no record.',
  canonNote:
    'The shared decision canon’s DecisionId union does not hold this identifier. It is disclosed ' +
    'here in the canon’s own record shape, and this module’s unit suite asserts the absence, so ' +
    'the disclosure moves to the canon the moment the canon holds it.',
}

/* ==================================================================== *
 * 5. WHAT COULD NOT BE ESTABLISHED. Measured, and left open.
 * ==================================================================== */

export interface Cc07DegradationGap {
  readonly what: string
  readonly measured: string
  readonly notRepaired: string
  readonly sourceRefs: readonly string[]
}

export const CC07_DEGRADATION_GAPS = [
  {
    what:
      'Chapters 40 to 44 never name this module. Everything the artificial-intelligence chapters ' +
      'say about it is said about a name, not an identifier.',
    measured:
      'The identifier MOD-CC-07 occurs zero times in the span L85974-L95408. The behaviour ' +
      'matrix of §43.3.3 keys its thirteen rows on module names; one of them is this module’s ' +
      'registered name and that string match is the entire attribution.',
    notRepaired:
      'No identifier is minted into the chapter and no row is rewritten. The attribution is ' +
      'rendered as a build inference under APP-012, and the match is made in code so it fails ' +
      'loudly rather than drifting.',
    sourceRefs: ['L85974-L95408', 'L91080', 'L91088'],
  },
  {
    what:
      'Nothing in chapters 40 to 44 gives this module a screen identifier, and the field is left ' +
      'unrecorded rather than filled.',
    measured:
      'The one Command Center screen those chapters introduce in this area is the safety-flag ' +
      'screen of storyboard 44A.12, which belongs to a control the client has not authorised. ' +
      'The module’s own screen is declared in §21.10 and is unaffected by any of this.',
    notRepaired:
      'A screen identifier invented to fill a field is a screen this build does not draw. The ' +
      'field stays unrecorded and this record says why.',
    sourceRefs: ['L93782'],
  },
] as const satisfies readonly Cc07DegradationGap[]
