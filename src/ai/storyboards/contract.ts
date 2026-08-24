import type { FallbackContractKey } from '@/ai/fallbacks/registry'
import type { ProvenanceClassId } from '@/ai/provenance/classes'
import { resolveProvenance, type GuidanceElementFacts } from '@/ai/provenance/contract'
import type { FiveSurfaceEffectRecord, JourneySurfaceCode } from '@/ui/shared/journey'

/**
 * THE §44A STORYBOARD CARD CONTRACT — ONE SHAPE FOR ALL THIRTY.
 *
 * Section 44A's own head says why this file exists, at L92648: "a rule stated
 * once is a rule interpreted differently by every reader." The chapter holds
 * thirty storyboards and the wave that builds them is three tasks of ten. The
 * shape, the fallback key and the render-time prohibitions are declared HERE,
 * once, and the three content tasks consume them. They supply data; they never
 * redeclare the shape and never reorder it.
 *
 * ── THE SCHEMA IS TAKEN FROM A CARD, NOT FROM THE READING GUIDE ─────────────
 * The head's "How to read a storyboard" list at L92660-L92669 holds TEN items.
 * It includes "The five-surface reaction", which is a separate table rather
 * than a card row, and it OMITS four fields every card carries: `Identifier`,
 * `Recovery Time Objective and Recovery Point Objective`, `Residual risk` and
 * `Source status`. A contract built from that list has the wrong field set. So
 * the schema is transcribed from the first card's header at L92791, whose rows
 * are L92793-L92811, and its classification is the chapter's own row at
 * L92766.
 *
 * Measured independently for this file, by scanning the whole chapter span:
 * all thirty cards are nineteen rows with ONE byte-identical field tuple, and
 * all thirty five-surface tables are five rows with ONE identical surface
 * tuple. Zero deviations in sixty tables. That is what makes a single contract
 * honest rather than a convenient flattening.
 *
 * ── THE FIVE-SURFACE TABLE IS NOT REBUILT ──────────────────────────────────
 * `@/ui/shared/journey` already types a five-surface record whose absent arm
 * carries a REQUIRED `reason`, and `effectStatement` already returns
 * "No direct effect — <reason>". §44A's surface tuple is that module's
 * `JOURNEY_SURFACES`, in the same order, name for name. So the surface
 * contract here is an alias of that record, not a second one. A second
 * five-surface type is how two surfaces describe one act differently.
 *
 * ── WHAT THIS FILE DELIBERATELY DOES NOT HOLD ──────────────────────────────
 * No storyboard content. Not one of the thirty. It holds no `decisionRefs`
 * either, and that is a finding rather than an omission: the decision canon in
 * `src/disclosure/decisions.ts` does not carry `DEC-AIRTO-001`,
 * `DEC-ASK-001`, `DEC-SAFETY-001`, `DEC-WIPE-001`, `DEC-SYNC-001`,
 * `DEC-AIDUP-001` or `DEC-SUSP-001`, and those are the identifiers the thirty
 * cards actually cite — `DEC-AIRTO-001` is the most-referenced decision in the
 * whole chapter-44 span. A `readonly DecisionId[]` field here would be a field
 * the content tasks cannot fill without widening a file this task is not
 * permitted to touch. The identifiers travel inside the transcribed field text
 * where the source puts them, and canon-backed disclosure waits on the canon.
 *
 * This module is types, six literal lists and one projection. It decides
 * nothing.
 */

/* ====================================================================
 * THE NINETEEN FIELDS.
 * ==================================================================== */

export type StoryboardFieldId =
  | 'identifier'
  | 'preconditions'
  | 'trigger'
  | 'actorsAndRoles'
  | 'workerVisibleExperience'
  | 'automaticFallback'
  | 'manualFallback'
  | 'fallbackOfFallback'
  | 'safeStop'
  | 'localData'
  | 'centralData'
  | 'notifications'
  | 'reconnection'
  | 'conflictResolution'
  | 'finalOfficialState'
  | 'audit'
  | 'recoveryObjectives'
  | 'residualRisk'
  | 'sourceStatus'

export interface StoryboardFieldDefinition {
  readonly id: StoryboardFieldId
  /** The source's own field name, verbatim from the card's first column. */
  readonly label: string
}

/** The card header the field set is transcribed from. Rows L92793-L92811. */
export const STORYBOARD_CARD_SCHEMA_REF = 'L92791'

/**
 * The chapter's classification of the field set, verbatim from its own row.
 * `User-Mandated Product Extension` in its completeness, each field a
 * `Derived Clarification` of a stated behaviour.
 */
export const STORYBOARD_CARD_CLASSIFICATION_REF = 'L92766'

/**
 * THE FIELD ORDER, AS A LITERAL LIST OUTSIDE EVERY CONSUMER.
 *
 * A deletion here fails twice: the schema test in `tests/unit/` compares this
 * against its own literal list, and `StoryboardCardContent` is a mapped type
 * over `StoryboardFieldId`, so `tsc` names the missing member at every one of
 * the thirty call sites. Reordering fails once, loudly, in the same test.
 */
export const STORYBOARD_CARD_FIELDS = [
  { id: 'identifier', label: 'Identifier' },
  { id: 'preconditions', label: 'Preconditions' },
  { id: 'trigger', label: 'Trigger' },
  { id: 'actorsAndRoles', label: 'Actors and roles' },
  { id: 'workerVisibleExperience', label: 'Worker-visible experience' },
  { id: 'automaticFallback', label: 'Automatic fallback' },
  { id: 'manualFallback', label: 'Manual fallback' },
  { id: 'fallbackOfFallback', label: 'Fallback-of-fallback' },
  { id: 'safeStop', label: 'Safe stop' },
  { id: 'localData', label: 'Local data' },
  { id: 'centralData', label: 'Central data' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'reconnection', label: 'Reconnection' },
  { id: 'conflictResolution', label: 'Conflict resolution' },
  { id: 'finalOfficialState', label: 'Final official state' },
  { id: 'audit', label: 'Audit' },
  {
    id: 'recoveryObjectives',
    label: 'Recovery Time Objective and Recovery Point Objective',
  },
  { id: 'residualRisk', label: 'Residual risk' },
  { id: 'sourceStatus', label: 'Source status' },
] as const satisfies readonly StoryboardFieldDefinition[]

// Compile-time exhaustiveness, the shape `JOURNEY_SURFACES` uses: every field
// id appears in the list, and the list introduces none the union lacks.
type MissingFromCardFields = Exclude<
  StoryboardFieldId,
  (typeof STORYBOARD_CARD_FIELDS)[number]['id']
>
const _cardFieldsExhaustive: MissingFromCardFields extends never ? true : never = true
void _cardFieldsExhaustive

/** The nineteen rendered strings. Every one required; none may be blank. */
export type StoryboardCardContent = { readonly [K in StoryboardFieldId]: string }

/* ====================================================================
 * THE THIRTY, AND THE LOCATORS THEY ARE READ FROM.
 * ==================================================================== */

/**
 * There are thirty storyboards and there is no thirty-first.
 *
 * `FB-AI-31` at L95353 sits inside an `Illustrative Example` that disclaims
 * requirement status, so a thirty-first storyboard is not implementable. This
 * union makes it unrepresentable rather than discouraged.
 */
export type StoryboardNumber =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20
  | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30

/**
 * Every card header in the chapter, in storyboard order, measured by scanning
 * L92596-L95408 for the exact header line. Held as a list rather than a count
 * because the count was never the claim a reader could act on, and because
 * nine of eleven single-row locators in this slice's own re-plan were off by
 * one or two lines.
 *
 * HOW EACH ONE WAS CHECKED, so a reader can check it the same way. Every card
 * header sits exactly two lines above the card's own Identifier row, and that
 * row is where the source writes `SB-AI-NN`. So each header below is pinned by
 * an identifier rather than by a count of blank lines, and all thirty were
 * confirmed against the identifier index:
 *
 *   SB-AI-01 L92793 · SB-AI-02 L92876 · SB-AI-03 L92960 · SB-AI-04 L93041
 *   SB-AI-05 L93129 · SB-AI-06 L93221 · SB-AI-07 L93305 · SB-AI-08 L93393
 *   SB-AI-09 L93474 · SB-AI-10 L93566 · SB-AI-11 L93645 · SB-AI-12 L93730
 *   SB-AI-13 L93816 · SB-AI-14 L93901 · SB-AI-15 L93992 · SB-AI-16 L94073
 *   SB-AI-17 L94157 · SB-AI-18 L94240 · SB-AI-19 L94325 · SB-AI-20 L94405
 *   SB-AI-21 L94486 · SB-AI-22 L94568 · SB-AI-23 L94663 · SB-AI-24 L94743
 *   SB-AI-25 L94825 · SB-AI-26 L94907 · SB-AI-27 L94991 · SB-AI-28 L95076
 *   SB-AI-29 L95161 · SB-AI-30 L95251
 */
export const STORYBOARD_CARD_HEADER_REFS = [
  'L92791', 'L92874', 'L92958', 'L93039', 'L93127', 'L93219', 'L93303', 'L93391',
  'L93472', 'L93564', 'L93643', 'L93728', 'L93814', 'L93899', 'L93990', 'L94071',
  'L94155', 'L94238', 'L94323', 'L94403', 'L94484', 'L94566', 'L94661', 'L94741',
  'L94823', 'L94905', 'L94989', 'L95074', 'L95159', 'L95249',
] as const

/** The five-surface table header that follows each card, in the same order. */
export const STORYBOARD_SURFACE_TABLE_REFS = [
  'L92815', 'L92898', 'L92982', 'L93063', 'L93151', 'L93243', 'L93327', 'L93415',
  'L93496', 'L93588', 'L93667', 'L93752', 'L93838', 'L93923', 'L94014', 'L94095',
  'L94179', 'L94262', 'L94347', 'L94427', 'L94508', 'L94590', 'L94685', 'L94765',
  'L94847', 'L94929', 'L95013', 'L95098', 'L95183', 'L95273',
] as const

/* ====================================================================
 * WHAT A CARD EMITS BESIDES ITS PROSE.
 * ==================================================================== */

/**
 * One audit record the storyboard produces. `AC-44A-004` (L92746-L92750's
 * fourth row) requires the final official state to be derivable from the
 * audit log ALONE, so the audit is a list of identified events rather than one
 * sentence, and the final state names the events it is reconstructed from.
 * Prose cannot be reconstructed from; identified events can.
 */
export interface StoryboardAuditEvent {
  /** Stable within one storyboard. The final state refers to these. */
  readonly id: string
  readonly statement: string
  readonly sourceRef: string
}

export interface StoryboardFinalOfficialState {
  readonly name: string
  /** `AC-44A-004`: the audit event ids this state is reconstructed from. */
  readonly derivedFrom: readonly string[]
}

/**
 * A worker-facing message whose wording the source fixes.
 *
 * `spanish` is `string | null` and the null case is a stated absence rather
 * than a gap this build fills: `TEST-44A-004` (L92757) requires every
 * storyboard's worker-facing message set complete in both English and
 * Spanish, and the frozen source contains no Spanish anywhere — measured, zero
 * occurrences. So the English is pinned against the source and the Spanish is
 * checked for presence only. Inventing a Spanish string and asserting it would
 * be a test asserting this build's own invention.
 */
export interface StoryboardFixedMessage {
  /** The screen identifier the source names, e.g. `SCR-FL-LOCK-01`. */
  readonly screen: string
  readonly english: string
  readonly spanish: string | null
  readonly sourceRef: string
}

/**
 * The four deterministic controls `AC-44A-002` names at L92747, and nothing
 * else. Adding a fifth is a change to the source's own enumeration and turns
 * the membership gate red, which is the point of holding them as a list.
 */
export type DeterministicControlId =
  | 'specificationGate'
  | 'evaluationGate'
  | 'qualificationGate'
  | 'severityOneHold'

export interface DeterministicControlDefinition {
  readonly id: DeterministicControlId
  /** The control's name in `AC-44A-002`'s own words. */
  readonly label: string
}

export const DETERMINISTIC_CONTROLS = [
  { id: 'specificationGate', label: 'specification gate' },
  { id: 'evaluationGate', label: 'evaluation gate' },
  { id: 'qualificationGate', label: 'qualification gate' },
  { id: 'severityOneHold', label: 'Severity 1 hold' },
] as const satisfies readonly DeterministicControlDefinition[]

type MissingFromControls = Exclude<
  DeterministicControlId,
  (typeof DETERMINISTIC_CONTROLS)[number]['id']
>
const _controlsExhaustive: MissingFromControls extends never ? true : never = true
void _controlsExhaustive

/**
 * `relaxed` is representable ON PURPOSE. A one-member union would make the
 * invariant unfalsifiable, and a gate that cannot go red is worse than no
 * gate: the illegal value has to be writable for the check to be a check.
 */
export type DeterministicStandingClaim = 'unchanged' | 'relaxed'

export type DeterministicControlStandings = {
  readonly [K in DeterministicControlId]: DeterministicStandingClaim
}

/**
 * The five acts L92653 reserves from artificial intelligence: it "never
 * classifies, never releases a hold, never bypasses a gate, never
 * self-approves, and never executes a stale queued action". Storyboard 21
 * restates the last at L94545.
 */
export type ReservedAiActId =
  | 'classifies'
  | 'releasesAHold'
  | 'bypassesAGate'
  | 'selfApproves'
  | 'executesAStaleQueuedAction'

export interface ReservedAiActDefinition {
  readonly id: ReservedAiActId
  /** The act in L92653's own words. */
  readonly label: string
}

export const RESERVED_AI_ACTS = [
  { id: 'classifies', label: 'classifies' },
  { id: 'releasesAHold', label: 'releases a hold' },
  { id: 'bypassesAGate', label: 'bypasses a gate' },
  { id: 'selfApproves', label: 'self-approves' },
  { id: 'executesAStaleQueuedAction', label: 'executes a stale queued action' },
] as const satisfies readonly ReservedAiActDefinition[]

type MissingFromReservedActs = Exclude<
  ReservedAiActId,
  (typeof RESERVED_AI_ACTS)[number]['id']
>
const _reservedActsExhaustive: MissingFromReservedActs extends never ? true : never = true
void _reservedActsExhaustive

/**
 * An act this storyboard has artificial intelligence perform, with the line
 * granting the authority — or `null` where the source grants none, which is
 * the case the invariant exists to catch. Artificial intelligence is advisory
 * unless the source grants execution authority (L92653).
 */
export interface StoryboardAiAct {
  readonly act: ReservedAiActId
  readonly executionAuthorityRef: string | null
}

/**
 * THE FACTS THE SIX RENDER-TIME PROHIBITIONS ARE CHECKED AGAINST.
 *
 * Every one of these is a fact about the storyboard's WORLD or about what its
 * surfaces SHOW, supplied independently of the other. That is deliberate: the
 * prohibitions are cross-checks between two independently-motivated facts, not
 * self-certifying booleans. `deviceAcknowledgement: 'notAcknowledged'` beside
 * `surfacesShowingApplied: ['CC']` is a violation neither field states on its
 * own.
 *
 * They are NOT scanned out of the field prose. The cards legitimately contain
 * the sentences "It must not draw a tick and pretend the job moved" (L93457)
 * and "never shows a completion tick on creation" (L93500), so a substring
 * scan for a prohibited rendering flags the honest description of the
 * prohibition. That failure mode has already shipped in this build once, in a
 * gate that stripped every quoted string before scanning for the literal it
 * existed to police.
 */
export interface StoryboardRenderFacts {
  /**
   * Whether the device has acknowledged, at the storyboard's final official
   * state. `noDeviceCommand` where the storyboard issues none — an honest
   * third value rather than a false negative. L93459, `AC-44A-003` (L92748).
   */
  readonly deviceAcknowledgement: 'acknowledged' | 'notAcknowledged' | 'noDeviceCommand'
  /**
   * The surfaces whose reaction shows the act as received, applied or
   * complete. Empty where none does, which is the usual case in this chapter.
   */
  readonly surfacesShowingApplied: readonly JourneySurfaceCode[]

  /**
   * Where the guidance, rule or threshold the storyboard renders came from.
   * `modelGenerated` is representable so the invariant can catch it; L93026
   * calls the prohibition absolute — "the platform never invents content,
   * rules, or thresholds" [SoW Fact — §3.7] — under every failure condition in
   * this chapter. `statedAbsence` is the honest fourth case: nothing was
   * rendered because nothing was authored.
   */
  readonly contentOrigin:
    | 'authored'
    | 'packaged'
    | 'humanDecided'
    | 'modelGenerated'
    | 'statedAbsence'

  /** The inference outcome, where the storyboard has one. L94553. */
  readonly inference: 'passed' | 'failed' | 'inconclusive' | 'noInference'
  /** The deterministic gate's own outcome at the final official state. */
  readonly gateOutcome: 'passed' | 'unpassed' | 'held' | 'noGate'

  /**
   * The state names the storyboard's surfaces show, as names rather than
   * prose. L92652 forbids collapsing capture, command and notification states
   * into "synced", "sent" or "done".
   */
  readonly stateNamesShown: readonly string[]
  /** Whether the outcome is partial. L93313: partial is displayed as partial. */
  readonly outcomeIsPartial: boolean
  /** Whether the rendering says so. The cross-check, not a restatement. */
  readonly partialLabelledPartial: boolean

  /**
   * Connectivity at the moment the surface renders. L92843 forbids a spinner
   * or a retry control against a KNOWN-offline state, "because a retry against
   * a known-offline state would be theatre". `unknown` is not knownOffline and
   * the invariant does not treat it as such.
   */
  readonly connectivity: 'online' | 'knownOffline' | 'unknown'
  readonly showsSpinner: boolean
  readonly showsRetryControl: boolean

  /** Worker-facing messages whose wording the source fixes. L94876. */
  readonly fixedMessages: readonly StoryboardFixedMessage[]

  /** L92650 and `AC-44A-002` (L92747). Every named control, every storyboard. */
  readonly deterministicStandings: DeterministicControlStandings

  /** Acts the storyboard has artificial intelligence perform. L92653. */
  readonly aiActs: readonly StoryboardAiAct[]
}

/**
 * `AC-44A-005` (L92750): a storyboard presuming a capability absent from the
 * Statement of Work says so IN ITS OWN TEXT, BEFORE describing behaviour. The
 * ordering is the requirement, so it is a rendered element placed above the
 * field table rather than a nineteenth-field footnote.
 */
export interface StoryboardAbsentCapability {
  readonly statement: string
  readonly sourceRef: string
}

/**
 * One storyboard. Tasks 16, 17 and 18 build thirty of these and nothing else.
 */
export interface Storyboard {
  readonly number: StoryboardNumber
  /** `SB-AI-NN`, as the card's own identifier row names it. */
  readonly identifier: string
  /**
   * The compound fallback key. Chapter AND identifier, because sixteen
   * `FB-AI-*` literals name two different contracts each.
   */
  readonly fallback: FallbackContractKey
  /** This storyboard's card header, from `STORYBOARD_CARD_HEADER_REFS`. */
  readonly cardHeaderRef: string
  /** Its surface table, from `STORYBOARD_SURFACE_TABLE_REFS`. */
  readonly surfaceTableRef: string
  readonly content: StoryboardCardContent
  readonly surfaces: FiveSurfaceEffectRecord
  readonly audit: readonly StoryboardAuditEvent[]
  readonly finalOfficialState: StoryboardFinalOfficialState
  readonly facts: StoryboardRenderFacts
  /** `null` where the storyboard presumes nothing absent from the source. */
  readonly absentCapability: StoryboardAbsentCapability | null
}

/* ====================================================================
 * THE CHAPTER-LEVEL CRITERIA, L92746-L92750 AND L92754-L92757.
 * ==================================================================== */

export interface ChapterCriterion {
  readonly id: string
  /** The row's text, verbatim. */
  readonly text: string
  readonly sourceRef: string
}

export const STORYBOARD_ACCEPTANCE_CRITERIA = [
  {
    id: 'AC-44A-001',
    text:
      'All thirty storyboards are implemented, testable, and traceable to a named fallback '
      + 'contract.',
    sourceRef: 'L92746',
  },
  {
    id: 'AC-44A-002',
    text:
      'In no storyboard does a failure of artificial intelligence cause a specification gate, '
      + 'evaluation gate, qualification gate, or Severity 1 hold to relax.',
    sourceRef: 'L92747',
  },
  {
    id: 'AC-44A-003',
    text:
      'In no storyboard does a surface display a command as applied before the device '
      + 'acknowledged it.',
    sourceRef: 'L92748',
  },
  {
    id: 'AC-44A-004',
    text:
      'Every storyboard terminates in a named final official state, and that state is derivable '
      + 'from the audit log alone.',
    sourceRef: 'L92749',
  },
  {
    id: 'AC-44A-005',
    text:
      'Every storyboard that presumes a capability absent from the Statement of Work says so, in '
      + 'its own text, before describing behaviour.',
    sourceRef: 'L92750',
  },
] as const satisfies readonly ChapterCriterion[]

export const STORYBOARD_TESTS = [
  {
    id: 'TEST-44A-001',
    text:
      'Execute all thirty storyboards as scripted scenarios against a seeded Bright Bikes tenant '
      + 'and assert each named final official state.',
    sourceRef: 'L92754',
  },
  {
    id: 'TEST-44A-002',
    text:
      'Assert across all thirty that no gate outcome, severity band, or hold state differs from '
      + 'the equivalent run with agents healthy.',
    sourceRef: 'L92755',
  },
  {
    id: 'TEST-44A-003',
    text:
      "Reconstruct each storyboard's final official state from the audit log alone and assert "
      + 'equality with the observed state.',
    sourceRef: 'L92756',
  },
  {
    id: 'TEST-44A-004',
    text:
      "Assert that every storyboard's worker-facing message set exists complete in both English "
      + 'and Spanish locale files before release.',
    sourceRef: 'L92757',
  },
] as const satisfies readonly ChapterCriterion[]

/* ====================================================================
 * THE ONE PROVENANCE CLASS A CARD EMITS.
 * ==================================================================== */

/**
 * What a storyboard card IS, in section 42.4's own classification questions.
 *
 * RESOLVED, NOT PINNED, for the reason `@/ai/boundary/matrix` records: a
 * pinned literal with a test asserting the literal is a claim about itself, and
 * a change to the classification order at L89445-L89452 would leave both
 * standing. So the facts are declared and the class is whatever the shared
 * resolver answers for them.
 *
 * The facts: nothing on a card was produced by a model in this session — every
 * one of the nineteen fields is prose transcribed from a frozen document that
 * was authored, approved and released long before the render. That is the
 * `PROV-3` branch, "Approved content authored and released earlier", and it is
 * emphatically not `PROV-1`. The absolute rule of the provenance contract is
 * that cached approved guidance and deterministic rules are never labelled
 * live artificial intelligence, in any locale, under any failure condition —
 * and a chapter whose entire subject is artificial-intelligence failure is the
 * last place to blur it.
 */
export const STORYBOARD_CARD_FACTS: GuidanceElementFacts = {
  producedByModelThisSession: null,
  approvedContentAuthoredAndReleasedEarlier: true,
  packagedValueProducingAnOutcomeByComparison: false,
  namedPersonDecidedOrInstructed: false,
  agentRunId: null,
  decisionRecordId: null,
}

export function storyboardCardProvenance(): ProvenanceClassId {
  return resolveProvenance(STORYBOARD_CARD_FACTS).classId
}

/* ====================================================================
 * THE ONE PROJECTION.
 * ==================================================================== */

export interface StoryboardCardRow {
  readonly id: StoryboardFieldId
  readonly label: string
  readonly content: string
}

/**
 * The nineteen rows a card renders, in schema order, every time.
 *
 * There is no filtering and no conditional: a card renders every one of the
 * nineteen fields, so a field with nothing to say says that, in words, in its
 * own row. An omitted row is the defect this projection exists to prevent.
 */
export function storyboardCardRows(storyboard: Storyboard): readonly StoryboardCardRow[] {
  return STORYBOARD_CARD_FIELDS.map((field) => ({
    id: field.id,
    label: field.label,
    content: storyboard.content[field.id],
  }))
}
