/**
 * MOD-FL-B8 — THE ARTIFICIAL-INTELLIGENCE DEGRADATION OVERLAY.
 *
 * The module already renders. This file adds the depth chapters 40-44 give it
 * and nothing else: which provenance class each rendered element carries, what
 * the failure chapter says this module does when the agent layer is gone, and
 * the two open questions the source asks about THIS surface and never answers.
 *
 * ── WHY THIS FILE IS MOSTLY DISCLOSURE ─────────────────────────────────────
 * This is the surface where a person acts. Both of the open questions below
 * are about what a worker sees, and in both the source contradicts itself at a
 * marking this build cannot order. Choosing quietly would put a safety claim on a
 * tablet, so neither is chosen and both are rendered with every locator.
 *
 * ── WHAT IS DERIVED RATHER THAN ASSIGNED ───────────────────────────────────
 * The identifier the §43.3.4 row names is read OUT OF the row's first cell,
 * the behaviour cell is parsed by the one parser this build has for source
 * cells, the provenance class is RESOLVED from the element's facts, and the
 * rows that may draw no control are FILTERED from the matrix. Four values that
 * would each have been a literal somebody had to keep true.
 *
 * ── WHAT THIS FILE DELIBERATELY DOES NOT HOLD ──────────────────────────────
 * No mode chip and no flag control. Building either would settle one of the
 * two questions below. No count of anything: every list here is exported and
 * whoever wants its length may take it.
 */
import { AIMODE_WORKER_DISCLOSURE_DECISION } from '@/ai/modes'
import type { ProvenanceClassId } from '@/ai/provenance/classes'
import { resolveProvenance, type GuidanceElementFacts } from '@/ai/provenance/contract'
import type { DecisionId } from '@/disclosure/decisions'
import { cellFromSource, type ColumnCell } from '@/policy/columns'
import { FL_B8_COLUMNS, FL_B8_MATRIX, type FlB8MatrixRow } from './matrix'
import type { B8LocalDisclosure } from './service'

/* ==================================================================== *
 * 1. THE §43.3.4 BEHAVIOUR ROW — TRANSCRIBED ONCE, READ THREE WAYS.
 *
 * L91188 is one row of the twelve-row Frontline behaviour matrix. It is the
 * first place in this build to exercise `cachedReadOnlyOffline`, which is one
 * of two `PermissionOutcome` members that had no rendering precedent.
 * ==================================================================== */

export interface AiFailureBehaviourRow {
  /** The `Frontline module` cell, verbatim, backticks included. */
  readonly moduleCell: string
  /** The `Behaviour during an artificial-intelligence failure` cell, verbatim. */
  readonly behaviourCell: string
  /** The `Classification` cell, verbatim. */
  readonly classificationCell: string
  readonly sourceRef: string
}

export const FL_B8_AI_FAILURE_ROW: AiFailureBehaviourRow = {
  moduleCell: '`MOD-FL-B8` Coaching Rendering',
  behaviourCell:
    'Cached read-only while offline — authored Work Instructions and packaged assets only',
  classificationCell: '`SoW Fact — §7.12`',
  sourceRef: 'MOD-FL-B8 · L91188',
}

/**
 * The identifier this row is about, READ OUT OF THE ROW. A hand-assigned
 * discriminator is wrong silently: the twelve rows of that matrix differ only
 * in their first cell, and a transcription that pasted a neighbour's behaviour
 * under this module's name would look exactly like a correct one.
 */
export const FL_B8_AI_FAILURE_ROW_MODULE: string = (() => {
  const named = /`(MOD-FL-[A-Z]?\d+)`/.exec(FL_B8_AI_FAILURE_ROW.moduleCell)?.[1]
  if (named === undefined) {
    throw new Error(
      `The §43.3.4 row transcribed here names no MOD-FL-* identifier in its first cell ` +
        `("${FL_B8_AI_FAILURE_ROW.moduleCell}"), so nothing establishes which module it governs.`,
    )
  }
  return named
})()

/**
 * The behaviour cell as an outcome. `@/policy/columns` `cellFromSource` is the
 * one parser this build has for a source permission cell; a second reading of
 * "Cached read-only while offline" here would be the closed-vocabulary defect
 * that has now occurred five times.
 */
export const FL_B8_AI_FAILURE_CELL: ColumnCell = cellFromSource(
  FL_B8_AI_FAILURE_ROW.behaviourCell,
)

/**
 * What the row means for this module, in the module's own terms. The fallback
 * it names is the fallback the module already renders — §22.17's authored Work
 * Instructions — so the chapter-43 row corroborates the shipped behaviour
 * rather than changing it, and this file says so rather than implying a change.
 */
export const FL_B8_AI_FAILURE_READING = {
  statement:
    'Under every catalogued artificial-intelligence failure this module is cached read-only: the ' +
    'authored Work Instructions and the packaged coaching assets are what render, and nothing ' +
    'is selected. That is the behaviour §22.17 already specifies for the offline case, restated ' +
    'by the failure chapter for every failure rather than only for a lost connection.',
  alsoBinds:
    'AC-43-344 — the worker is never shown a state implying that an unreachable platform has ' +
    'received or applied anything. This module claims no delivery and no receipt in any reach.',
  sourceRef: 'MOD-FL-B8 · L91188 · AC-43-344 · L91201 · L41498',
} as const

/* ==================================================================== *
 * 2. PROVENANCE — RESOLVED FROM THE ELEMENT'S FACTS, NEVER PINNED.
 *
 * A literal `'PROV-3'` with a test asserting the literal is a claim about
 * itself. These go through the classification tree, so a change to the tree
 * moves them and a change to the facts moves them, which is what a resolved
 * value is for.
 * ==================================================================== */

/**
 * The coaching asset and its replay. `PROV-3`'s own definition names both by
 * name — "packaged short coaching assets, and the replay of a card that was
 * previously delivered" — so the classification here is transcription, not
 * inference. The agent SELECTS the asset; it does not produce it, and the
 * distinction is the whole of the absolute rule below.
 */
export const COACHING_ASSET_FACTS: GuidanceElementFacts = {
  producedByModelThisSession: null,
  approvedContentAuthoredAndReleasedEarlier: true,
  packagedValueProducingAnOutcomeByComparison: false,
  namedPersonDecidedOrInstructed: false,
  agentRunId: null,
  decisionRecordId: null,
}

export const COACHING_ASSET_PROVENANCE: ProvenanceClassId =
  resolveProvenance(COACHING_ASSET_FACTS).classId

/** The authored Work Instruction the three absent reaches fall back to. */
export const AUTHORED_FALLBACK_FACTS: GuidanceElementFacts = COACHING_ASSET_FACTS

export const AUTHORED_FALLBACK_PROVENANCE: ProvenanceClassId =
  resolveProvenance(AUTHORED_FALLBACK_FACTS).classId

/**
 * The absence itself, when the reasoning layer does not answer. Nothing was
 * produced, nothing earlier was released for this moment, no comparison, no
 * person — every branch of the tree declines, which is what `PROV-6` is.
 */
export const NO_SELECTION_FACTS: GuidanceElementFacts = {
  producedByModelThisSession: null,
  approvedContentAuthoredAndReleasedEarlier: false,
  packagedValueProducingAnOutcomeByComparison: false,
  namedPersonDecidedOrInstructed: false,
  agentRunId: null,
  decisionRecordId: null,
}

export const NO_SELECTION_PROVENANCE: ProvenanceClassId =
  resolveProvenance(NO_SELECTION_FACTS).classId

/**
 * The absolute rule, on the one surface where breaking it is most costly.
 * L89439 is a sentence, and it is quoted as one rather than inferred from the
 * contract table's columns.
 */
export const FL_B8_NEVER_LIVE = {
  rule:
    'Cached approved guidance (`PROV-3`) and deterministic rules (`PROV-4`) are never, on any ' +
    'surface, in any locale, under any failure condition, labelled or described as live ' +
    'artificial intelligence.',
  hereItMeans:
    'The clip on the card and its replay are approved corpus content. Neither is described as ' +
    'live, selected-just-now, or agentic, and no agent badge or agent name is drawn beside them.',
  sourceRef: 'L89439 · PROV-3 · L89431',
} as const

/**
 * AND A COLLISION THE SOURCE LEAVES STANDING, RECORDED RATHER THAN CLOSED.
 * SB-42-401 gives `PROV-1` an agent badge and "the agent's name in full", and
 * SB-AI-003 rules the worker's card carries no agent name. They do not in fact
 * collide on this module, because the asset is `PROV-3` and never `PROV-1` —
 * but they would the moment anything on this card were classified `PROV-1`,
 * and the one candidate is the line of explanation, below.
 */
export const FL_B8_EXPLANATION_LINE_SEAM = {
  element:
    'The one line stating why the card appeared, in the worker’s locale. SB-AI-003 requires it; ' +
    'the activation diagram shows the agent returning it alongside the asset.',
  unestablished:
    'The source never classifies it. If it is produced by the model in this session it is ' +
    'PROV-1, and PROV-1’s rendering treatment is an agent badge and the agent’s name in full — ' +
    'which SB-AI-003 forbids on this very card. If it is a packaged per-trigger sentence it is ' +
    'PROV-3 and there is no collision. No line of the frozen source decides between them.',
  notResolvedHere:
    'This module renders the line as part of the PROV-3 asset panel and draws no agent badge ' +
    'and no agent name, which is the only reading consistent with SB-AI-003 either way. That is ' +
    'a rendering choice made to avoid a prohibited outcome, not a classification of the element.',
  owner:
    'Whoever holds the provenance contract. The seam is a missing classification in §42.4, not a ' +
    'gap in this module.',
  sourceRef: 'SB-AI-003 · L86398 · SB-42-401 · L89459 · L86390',
} as const

/* ==================================================================== *
 * 3. THE ROWS THAT MAY DRAW NO CONTROL — FILTERED, NOT LISTED.
 *
 * The named capability in these rows is itself a negative, so a prohibition
 * means the BEHAVIOUR must not occur. A greyed-out control invents the
 * affordance: it tells a worker that a sufficiently privileged account could
 * make a dismissal block the step.
 *
 * The discriminator is the cells, not a hand-kept list. A row every column
 * prohibits cannot be a per-role affordance question, because there is no role
 * for whom the answer differs. Whether more than one row qualifies is not
 * written here — the filter answers it, and the covering suite plants a sixth
 * permissive cell into a qualifying row to prove the filter can drop one.
 * ==================================================================== */

export function uniformlyProhibitedRows(
  rows: readonly FlB8MatrixRow[] = FL_B8_MATRIX,
): readonly FlB8MatrixRow[] {
  return rows.filter((row) =>
    FL_B8_COLUMNS.every((column) => row.cells[column].outcome === 'explicitlyProhibited'),
  )
}

export const FL_B8_NO_CONTROL_RULE = {
  rule:
    'Where every column of a row prohibits, no control is drawn for anybody — not an enabled ' +
    'one and not a disabled one. The row states a property of the system and the panel states ' +
    'it as one.',
  why:
    'The capability these rows name is a negative. A disabled toggle beside "Let a dismissal ' +
    'block or delay a step" asserts that the behaviour is a thing the product could do and is ' +
    'currently switched off, which is the opposite of what the row says.',
  sourceRef: 'L41471 · FUNC-B8-01-2-2 · L41535 · L41474 · L41496',
} as const

/* ==================================================================== *
 * 4. DEC-SAFETY-001 — THE CONTROL THIS SURFACE IS TOLD BOTH TO OMIT AND
 *    TO OFFER.
 *
 * The canon holds no record for this identifier, so it is disclosed here in
 * the canon's own shape, on the slice-8 pattern this module already uses for
 * `DEC-GATE-001`. The covering suite asserts the absence, so the disclosure
 * moves the moment the canon holds it.
 *
 * THE PROVENANCE IS MEASURED RATHER THAN ASSUMED, and it is not the shape the
 * dispatch described. SB-AI-003's sentence carries TWO markings: the clause
 * making feedback optional, one-tap and never gating is `[SoW Fact — §6.8.2]`,
 * and the clause saying the worker-facing surface carries no feedback control
 * AT ALL is `Derived Clarification`. So the Statement of Work half constrains
 * a control it presupposes exists, and the half that abolishes it is derived.
 * 44A.12's flag is `User-Mandated Product Extension`. Neither side of the
 * question is a Statement of Work fact.
 * ==================================================================== */

export const FL_B8_SAFETY_FLAG_DECISION = 'DEC-SAFETY-001'

export const FL_B8_SAFETY_FLAG_DISCLOSURE: B8LocalDisclosure = {
  decisionRef: FL_B8_SAFETY_FLAG_DECISION,
  question:
    'May a worker flag agent-delivered content as unsafe from the coaching card, and does one ' +
    'flag quarantine the asset tenant-wide? The card this module draws is the card the control ' +
    'would sit on.',
  readings: [
    {
      text:
        'Reading one. The coaching card carries the asset, one line stating why it appeared, a ' +
        'replay control, a dismiss control, "and nothing else — no rating request, no confidence ' +
        'figure, no agent name", and "the worker-facing surface carries no feedback control at ' +
        'all". The abolishing clause is marked Derived Clarification; the clause in the same ' +
        'sentence making feedback optional, one-tap and never gating is marked SoW Fact — §6.8.2 ' +
        'and presupposes a control rather than removing one.',
      locator: 'SB-AI-003 · L86398',
    },
    {
      text:
        'Reading two. A storyboard of precisely that control: the worker taps a flag on the ' +
        'coaching card, picks a categorised reason, the flag is committed to the device before ' +
        'any network attempt, the asset is suppressed on that device immediately and the ' +
        'fallback guidance renders. Its first acceptance criterion requires the flag control to ' +
        'be visually and functionally distinct from the dismiss control, and its Frontline panel ' +
        'draws the card with two controls, "Dismiss" and "Report a problem".',
      locator: 'L93707-L93792 · AC-44A-12-1 · L93786 · SCR-FL-COACH-07 · L93780',
    },
    {
      text:
        'Reading two states its own reason for existing against reading one: dismissal is ' +
        'deliberately low-cost and low-signal, "which is exactly what a safety report must not ' +
        'be". It is classified User-Mandated Product Extension, so it is a proposal rather than ' +
        'a ruling — but the thing it proposes is the thing reading one forbids.',
      locator: 'L93713 · DEC-SAFETY-001 · L93790',
    },
    {
      text:
        'The decision card itself, with three options and none taken. (a) no flag, a categorised ' +
        'dismissal reason is the only channel; (b) recommended, a flag that suppresses locally ' +
        'and creates a review item, without tenant-wide quarantine; (c) a flag that also ' +
        'quarantines the asset tenant-wide pending review. Owner: the client’s product owner, ' +
        'with the tenant’s Quality Manager holding the per-tenant choice. Three points are open, ' +
        'not one: whether the flag exists at all, whether one report quarantines tenant-wide, ' +
        'and what review response time is committed.',
      locator: 'DEC-SAFETY-001 · L93792',
    },
    {
      text:
        'And it is carried as open in two registers rather than raised once in prose: the ' +
        'storyboard table names it as storyboard 12’s decision, and the chapter’s own decision ' +
        'register carries it as Client Decision Required.',
      locator: 'DEC-SAFETY-001 · L92704 · L95394',
    },
  ],
  adopted:
    'Neither reading is adopted and no flag control is built. What this build DEMONSTRATES is ' +
    'reading one — the card carries a replay control and a dismiss control and nothing else — ' +
    'and the reason is stated rather than left to be inferred: reading two is classified a ' +
    'User-Mandated Product Extension whose own card says the client has not decided whether the ' +
    'control exists, and building it would enact option (b) or (c) of a decision about a safety ' +
    'channel. Demonstrating reading one changes nothing a worker can do today; demonstrating ' +
    'reading two would put a safety-reporting affordance on a tablet that the platform behind ' +
    'it has no committed response time for. That asymmetry is a reason to wait, not evidence ' +
    'that reading one is right, and this panel says so on screen beside the card. A ' +
    'client-delegated choice under APP-012.',
  consequenceIfRuledOtherwise:
    'If the client rules for the flag, this card gains a second control that must be visually ' +
    'and functionally distinct from Dismiss, a durable local suppression that survives restart ' +
    'and needs no network, a high-priority queued event, a distinct Command Center item on ' +
    'MOD-CC-07’s side, and a committed review response time. None of those exists here and none ' +
    'is stubbed, because a stub of a safety channel is worse than its absence.',
  whyHere:
    'Both readings are about this card. Reading one names the card’s contents; reading two ' +
    'storyboards a control on it and gives that control its own Frontline screen identifier. ' +
    'The identifier is quoted where the source uses it and is not registered as one of this ' +
    'build’s screens: it occurs exactly once in the frozen source and no screen register holds ' +
    'it.',
  canonNote:
    'The shared decision canon’s DecisionId union does not hold this identifier. It is disclosed ' +
    'here in the canon’s own record shape, and this module’s unit suite asserts the absence, so ' +
    'the disclosure moves to the canon the moment the canon holds it.',
}

/* ==================================================================== *
 * 5. DEC-AIDISCLOSE-001 — CONSUMED, NOT RE-DERIVED.
 *
 * Wave 0 measured this conflict, weighed its provenance, found it NOT
 * symmetric, and adopted neither side. The record holds every reading with its
 * marking. Restating any of that here would be a second copy to keep true, so
 * this file names the record and adds only what is this module's own: that the
 * module ALREADY carries a statement which is one side of it, and where that
 * statement comes from.
 * ==================================================================== */

export const FL_B8_PAUSE_DECISION: DecisionId = AIMODE_WORKER_DISCLOSURE_DECISION

export const FL_B8_PAUSE_DISCLOSURE = {
  id: FL_B8_PAUSE_DECISION,
  whyHere:
    'The question is whether the worker’s own surface discloses that artificial intelligence is ' +
    'paused or unavailable. This module is the worker-facing element that goes quiet when it ' +
    'is, so the question is answered here or nowhere on this surface.',
  thisModuleAlreadySaysSomething:
    'This panel already states that the application does not announce agent failures to the ' +
    'worker and that the oversight surfaces carry the pause state instead. That statement is a ' +
    'true transcription of this module’s own card — FUNC-B8-02-1-2 gives "the application does ' +
    'not announce agent failures to the worker, because the worker’s guidance is unchanged" as ' +
    'the row’s prohibited-roles clause — but it is also, read across chapters, one side of an ' +
    'open decision. It is therefore rendered with the decision beside it rather than on its own.',
  andTheGapInIt:
    'FUNC-B8-02-1-2 speaks of agent FAILURES. A platform pause is the case the source treats ' +
    'separately, and it is the case where the two chapters disagree. This module’s own card ' +
    'never mentions a pause, so the sentence it does carry does not settle the pause question ' +
    'and is not offered as settling it.',
  notResolvedHere:
    'Neither side is adopted, no mode chip is drawn, and the existing sentence is neither ' +
    'removed nor strengthened. The canon record carries every reading with its marking, ' +
    'including the measured asymmetry — the two opposing rulings are Derived Clarification ' +
    'while two of the corroborating matrix rows are a Statement of Work fact — and this module ' +
    'renders that record rather than a second copy of it.',
  sourceRef: 'FUNC-B8-02-1-2 · L41540 · L41498',
} as const

/**
 * A GUARD ON THE MOUNT, PUT HERE BECAUSE THE MOUNT ALREADY BROKE ONCE.
 *
 * This module is the first Frontline consumer of the shared decision canon's
 * `DEC-AIDISCLOSE-001` record. `tests/coverage/slice-07-absence-sweep.test.ts`
 * forbids nine word families anywhere in the Frontline export — `ranks?` among
 * them, because §3.3 rules that the application never ranks workers against
 * each other — and it reads the built export, so a word in a shared record
 * only fails at build time, on the route that mounts it, in the release suite.
 *
 * That is exactly what happened while this task ran: the record's position
 * paragraph described the two contradicting rulings as being of equal rank —
 * provenance markings of equal standing, nothing to do with workers — and
 * mounting it on the run player turned the sweep red. The record's own wording
 * changed outside this task's path list before it landed, so no workaround
 * ships. What ships is the guard, in the module's own unit suite, so the next
 * time a shared record picks up one of those words the failure arrives in
 * seconds against the record rather than minutes later against a built page.
 *
 * The word families are NOT re-declared here. The sweep owns that list and a
 * second copy would be the closed-vocabulary defect; the covering test reads
 * this constant only to know WHICH record to check.
 */
export const FL_B8_CANON_RECORDS_RENDERED_ON_THIS_SURFACE = [
  AIMODE_WORKER_DISCLOSURE_DECISION,
  // `as const satisfies`, never an annotation: `readonly DecisionId[]` widens
  // every member to the union and `slice-2c-gates` gate 2 refuses it, which is
  // how this line was corrected rather than reviewed.
] as const satisfies readonly DecisionId[]

/* ==================================================================== *
 * 6. FINDINGS AND SEAMS. Recorded, owned, and not closed here.
 * ==================================================================== */

export interface B8DegradationFinding {
  readonly what: string
  readonly evidence: string
  readonly owner: string
  readonly sourceRef: string
}

export const FL_B8_DEGRADATION_FINDINGS = [
  {
    what:
      'A third corroboration of the disclosure side of DEC-AIDISCLOSE-001 that the canon record ' +
      'does not carry, offered to that record rather than used here.',
    evidence:
      'SB-42-401 fixes PROV-6’s rendering treatment as "a muted panel with a single sentence ' +
      'naming the current mode from section 42.3 and what the worker may do instead". A muted ' +
      'panel naming the current mode is a worker-facing disclosure of the mode, which is what ' +
      'the other side rules the Frontline surface shows nothing of. The provenance-contract ' +
      'chapter is a third voice in a two-sided record.',
    owner:
      'Whoever holds src/disclosure/decisions.ts. This module adds no reading to the record and ' +
      'draws no muted mode panel; adding a locator to an open decision is the canon’s act.',
    sourceRef: 'SB-42-401 · L89459',
  },
  {
    what:
      'Both screen identifiers storyboard 44A.12 introduces occur exactly once each in the ' +
      'frozen source and neither is in any screen register.',
    evidence:
      'SCR-FL-COACH-07 occurs once, at its own panel line inside 44A.12; SCR-CC-SAFETY-01 occurs ' +
      'once, two lines later. They are quoted where the source uses them and no register row is ' +
      'minted for either, because a screen this build does not draw is not a screen it has.',
    owner: 'Nobody. It is recorded so the next reader does not mint them.',
    sourceRef: 'SCR-FL-COACH-07 · L93780 · SCR-CC-SAFETY-01 · L93782',
  },
  {
    what:
      'The dispatch described SB-AI-003 as ruling against a feedback control. It does, and the ' +
      'ruling is marked Derived Clarification, while the Statement of Work clause in the same ' +
      'sentence points the other way.',
    evidence:
      'L86398 reads "Feedback on agent outputs is always optional and one tap, never required, ' +
      'never gating [SoW Fact — §6.8.2], and Derived Clarification the worker-facing surface ' +
      'carries no feedback control at all". A rule about how a control must behave is not a ' +
      'rule that no control exists, and the marking sits on the second clause alone. The same ' +
      'SoW Fact is transcribed on the Command Center side at L37497.',
    owner:
      'Recorded in this module’s disclosure and in MOD-CC-07’s. Not closed: it sharpens the ' +
      'conflict rather than settling it.',
    sourceRef: 'SB-AI-003 · L86398 · L37497',
  },
] as const satisfies readonly B8DegradationFinding[]
