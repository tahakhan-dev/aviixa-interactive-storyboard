import type { DecisionReading } from '@/disclosure/decisions'
import { frontlineConnectivityTreatment } from '@/frontline/access'
import type { UnitOrLotBinding, DeterministicResult } from '@/frontline/capture'
import {
  patternsForModule,
  type FrontlineFallbackId,
  type FrontlineFallbackPattern,
} from '@/frontline/fallbacks'

/**
 * `MOD-FL-A5`'s own logic and vocabulary. Frozen source §22.14.
 *
 * ── THE ONE STRUCTURAL RULING IN THIS FILE ─────────────────────────────
 *
 * `containmentDecision` TAKES NO CONNECTIVITY ARGUMENT. Not a defaulted one,
 * not an ignored one — there is no parameter for it and no field on its
 * result that varies with it. That absence is the module's defining property
 * made unwritable, the same device wave 0 used when it left `requiresOnline`
 * off `FrontlineAccessRequest`: a task under pressure cannot gate the
 * deterministic layer behind a check that has nowhere to be passed.
 *
 * L40948 is what it is holding: "A Severity 1 hold fires immediately, even
 * offline; the lot is protected from the moment of the breach, not from the
 * moment of sync." `AC-A5-1` (L41046) requires identical gate, detection and
 * classification results with the network interface disabled and
 * `AC-SCR-FL-004` (L48692) requires the whole deviation-to-hold path to
 * execute with no network call anywhere on it.
 *
 * ONE THING DOES DEPEND ON CONNECTIVITY, AND EXACTLY ONE. The DELIVERY of
 * the escalation. `escalationDelivery` is a separate function for that
 * reason, and its two answers are `FUNC-A5-01-2-2`'s own words: "Online:
 * delivery is immediate. Offline: delivery queues durably."
 *
 * ── WHAT IS NOT RE-DERIVED HERE ────────────────────────────────────────
 *
 * The offline treatment comes from `frontlineConnectivityTreatment` in
 * `@/frontline/access`, whose `safety-layer` row already carries
 * `degradedOffline: false` typed as the literal. The hold's target comes
 * from `UnitOrLotBinding` in `@/frontline/capture`, which already models
 * "absent by design where unit mode is none" as a MEMBER rather than a
 * missing field. The fallback patterns come from `patternsForModule`. None
 * of the three is spelled a second time in this module.
 */

/* ==================================================================== *
 * WHERE THE HOLD LANDS.
 *
 * `AC-A5-3` (L41048): "The hold lands on the Lot where one exists, otherwise
 * the Unit for serialized work, otherwise the Run." Three functionalities
 * state the same ladder one rung at a time — `FUNC-A5-02-2-1` (L40996),
 * `FUNC-A5-02-2-2` (L40997), `FUNC-A5-02-2-3` (L40998) — and the third gives
 * the reason the ladder has no fourth rung: "the platform's strongest reflex
 * always has a target."
 *
 * THE INPUT IS `UnitOrLotBinding`, NOT A STRING PAIR. Wave 0's envelope
 * models the no-unit case as `absent-by-design` carrying a reason, so the
 * third rung is reached by a MEMBER of the union rather than by two absent
 * identifiers, and there is no input to this function that could mean
 * "nothing to hold".
 * ==================================================================== */

export type HoldScope = 'lot' | 'unit' | 'run'

export const HOLD_SCOPE_RULES = [
  {
    scope: 'lot',
    rule: 'Place the hold on the breaching Lot where a lot exists.',
    why: 'A Severity 1 hold needs a real thing to hold.',
    sourceRef: 'FUNC-A5-02-2-1 · L40996',
  },
  {
    scope: 'unit',
    rule: 'Place the hold on the Unit for serialized work with no lot.',
    why: 'The no-lot rule of Part III.',
    sourceRef: 'FUNC-A5-02-2-2 · L40997',
  },
  {
    scope: 'run',
    rule: 'Place the hold on the Run itself where the work carries no unit at all, quarantining its output and blocking the run pending Quality Manager disposition.',
    why: "The platform's strongest reflex always has a target.",
    sourceRef: 'FUNC-A5-02-2-3 · L40998',
  },
] as const satisfies readonly {
  readonly scope: HoldScope
  readonly rule: string
  readonly why: string
  readonly sourceRef: string
}[]

export function holdScope(binding: UnitOrLotBinding): HoldScope {
  switch (binding.kind) {
    case 'lot':
      return 'lot'
    case 'unit':
      return 'unit'
    case 'absent-by-design':
      return 'run'
  }
}

/* ==================================================================== *
 * THE CONTAINMENT CHECKLIST, AND THE ACT THAT DOES NOT EXIST.
 *
 * `AC-A5-5` (L41050): the checklist "launches locally at classification and
 * cannot be skipped or dismissed". `TEST-A5-6` (L41064) is a denial test
 * that asserts "no such control exists" — not that pressing it is refused,
 * that it is not there. Storyboard frame 4 (L41036) says the same thing in
 * the worker's language: the checklist, "item by item, with no dismiss
 * control."
 *
 * SO THE UNION HAS NO DISMISS MEMBER. `ContainmentAct` is two members and
 * neither is a dismissal, a skip, a defer or a snooze; a view cannot dispatch
 * one because there is nothing to name. That is the same discipline as
 * `FrontlineAffordance` having no `disabled` member, applied to this
 * module's own act vocabulary.
 * ==================================================================== */

export const CONTAINMENT_LADDER = [
  'STATE-A5-LAUNCHED',
  'STATE-A5-INPROGRESS',
  'STATE-A5-COMPLETE',
] as const

export type ContainmentState = (typeof CONTAINMENT_LADDER)[number]

/** Two acts. Neither is a way out of the checklist. */
export type ContainmentAct = 'start-first-item' | 'complete-last-item'

export function containmentAfter(
  state: ContainmentState,
  act: ContainmentAct,
): ContainmentState {
  if (state === 'STATE-A5-LAUNCHED' && act === 'start-first-item') {
    return 'STATE-A5-INPROGRESS'
  }
  if (state === 'STATE-A5-INPROGRESS' && act === 'complete-last-item') {
    return 'STATE-A5-COMPLETE'
  }
  // Every other pairing leaves the checklist where it is. There is no act
  // that exits it early, and no act that reopens a completed containment.
  return state
}

/* ==================================================================== *
 * THE DECISION ITSELF. NO CONNECTIVITY PARAMETER.
 * ==================================================================== */

export interface ContainmentDecision {
  /** Whether a Severity 1 hold is placed. */
  readonly holdPlaced: boolean
  /** What the hold landed on, where one was placed. */
  readonly scope: HoldScope | null
  /** The containment checklist state after classification. */
  readonly containment: ContainmentState | null
  /** The line the panel prints, in the past tense the storyboard requires. */
  readonly line: string
  readonly sourceRef: string
}

/**
 * The deterministic answer, from the classification alone.
 *
 * SEVERITY 1 AND NOTHING ELSE PLACES A HOLD. Happy-path step 5 (L40938):
 * "Where the band is Severity 1, the device places the hold immediately, on
 * the breaching Lot, or on the Unit for serialized work with no lot, or on
 * the Run itself where the work carries no unit at all." The alternate paths
 * at L40944 give the other branch: "A Severity 2 or lower classification,
 * which records the deviation and continues per the action bundle without a
 * hold."
 *
 * THE CONTAINMENT CHECKLIST LAUNCHES ON A CLASSIFICATION, NOT ON A HOLD.
 * `FUNC-A5-01-2-1` (L40987) launches it "the moment a deviation is
 * classified", so a Severity 2 deviation gets containment without a hold and
 * only an in-specification value gets neither.
 *
 * `severityBand` COMES FROM THE ENVELOPE'S OWN FIELD and is `number | null`
 * there, because L39572 says a screen carrying limits always has a
 * deterministic result and a screen without limits carries no result field
 * at all. `null` here means the value was evaluated and no band was
 * classified.
 */
export function containmentDecision(
  result: DeterministicResult,
  binding: UnitOrLotBinding,
): ContainmentDecision {
  if (result.inSpecification || result.severityBand === null) {
    return {
      holdPlaced: false,
      scope: null,
      containment: null,
      line: 'The value was evaluated against the authored limits and recorded in specification.',
      sourceRef: 'L41021',
    }
  }
  if (result.severityBand !== 1) {
    return {
      holdPlaced: false,
      scope: null,
      containment: 'STATE-A5-LAUNCHED',
      line: `Severity ${result.severityBand} was classified on this device. The deviation was recorded and the action bundle applied. No hold was placed, and the pre-authorised containment checklist has launched.`,
      sourceRef: 'L40944',
    }
  }
  const scope = holdScope(binding)
  return {
    holdPlaced: true,
    scope,
    containment: 'STATE-A5-LAUNCHED',
    line: `Severity 1 was classified on this device and the ${scope} has been placed on hold. It happened at the moment of the breach. The pre-authorised containment checklist has launched.`,
    sourceRef: 'L40938',
  }
}

/* ==================================================================== *
 * THE ONE THING CONNECTIVITY DECIDES.
 * ==================================================================== */

export interface EscalationDelivery {
  readonly delivered: boolean
  /** `FUNC-A5-01-2-2`'s own words for this half. */
  readonly clause: string
  /** What the worker is told, and it never claims a notification happened. */
  readonly line: string
  readonly sourceRef: string
}

/**
 * `FUNC-A5-01-2-2` (L40988): "Defer escalation delivery to connectivity while
 * the containment itself does not wait." Storyboard frame 3 (L41036) is the
 * honest line in the worker's own language: "Your supervisor and the quality
 * manager will be notified when this tablet reconnects."
 *
 * `TEST-A5-7` (L41065) asserts "queued escalation, and no claim of
 * notification", which is why the offline line names a future rather than a
 * past.
 */
export function escalationDelivery(online: boolean): EscalationDelivery {
  return online
    ? {
        delivered: true,
        clause: 'Online: delivery is immediate.',
        line: 'The escalation has been delivered to the quality manager and your supervisor.',
        sourceRef: 'FUNC-A5-01-2-2 · L40988',
      }
    : {
        delivered: false,
        clause: 'Offline: delivery queues durably.',
        line: 'Your supervisor and the quality manager will be notified when this tablet reconnects.',
        sourceRef: 'FUNC-A5-01-2-2 · L40988',
      }
}

/**
 * The offline statement the panel leads with, READ from wave 0's register
 * rather than written again. Its `degradedOffline` is typed as the literal
 * `false`, so this module could not state a degraded safety layer even if it
 * tried to.
 */
export const SAFETY_LAYER_OFFLINE = frontlineConnectivityTreatment({ kind: 'safety-layer' })

/* ==================================================================== *
 * THE TWENTY-ONE FUNCTIONALITIES, AND THE FALLBACK OBLIGATION.
 * ==================================================================== */

export interface A5Functionality {
  readonly id: string
  /** The functionality's own opening sentence, verbatim. */
  readonly statement: string
  /**
   * The `Roles prohibited:` clause, verbatim. `null` where the source states
   * none.
   *
   * TWO OF THE TWENTY-ONE, AND THE SECOND WAS FOUND BY THE GATE RATHER THAN
   * BY READING. `FUNC-A5-04-2-1` (L41012) and `FUNC-A5-04-2-2` (L41013) both
   * give a `Roles allowed:` clause and no `Roles prohibited:` clause at all —
   * "none may relax" and "none may bypass, including the root account". The
   * first transcription of this file carried L41013's allowed-clause under
   * the prohibited field, which reads as faithful and is not, and
   * `tests/unit/fl-a5.test.ts` caught it by asking the line. The absence is
   * recorded rather than filled with a plausible sentence.
   */
  readonly rolesProhibited: string | null
  /** The online-and-offline clause, verbatim. */
  readonly connectivity: string
  readonly patterns: readonly FrontlineFallbackId[]
  /** Why `patterns` is empty, in the source's own words. `null` otherwise. */
  readonly patternsNote: string | null
  readonly sourceRef: string
}

export const A5_FUNCTIONALITIES = [
  {
    id: 'FUNC-A5-01-1-1',
    statement: 'Enforce a hard gate that blocks advance without valid proof.',
    rolesProhibited: 'Roles prohibited: no role may override it on the device.',
    connectivity: 'Online and offline: identical.',
    patterns: ['FB-FL-CAP-01'],
    patternsNote: null,
    sourceRef: 'FUNC-A5-01-1-1 · L40983',
  },
  {
    id: 'FUNC-A5-01-1-2',
    statement: 'Detect time, sequence, specification, and evidence deviations deterministically.',
    rolesProhibited: 'Roles prohibited: no role may suppress a detection.',
    connectivity: 'Online and offline: identical.',
    patterns: ['FB-FL-PKG-01'],
    patternsNote: null,
    sourceRef: 'FUNC-A5-01-1-2 · L40984',
  },
  {
    id: 'FUNC-A5-01-1-3',
    statement:
      'Classify a detected deviation into a severity band using the authored mapping in the pinned package.',
    rolesProhibited: 'Roles prohibited: no role, and no artificial intelligence, may classify.',
    connectivity: 'Online and offline: identical.',
    patterns: ['FB-FL-SEV1-01'],
    patternsNote: null,
    sourceRef: 'FUNC-A5-01-1-3 · L40985',
  },
  {
    id: 'FUNC-A5-01-2-1',
    statement:
      'Launch the configured containment checklist locally the moment a deviation is classified, so the worker is guided through the correct response immediately, offline.',
    rolesProhibited: 'Roles prohibited: nobody may skip or dismiss it.',
    connectivity: 'Online and offline: identical launch.',
    patterns: ['FB-FL-SEV1-01'],
    patternsNote: null,
    sourceRef: 'FUNC-A5-01-2-1 · L40987',
  },
  {
    id: 'FUNC-A5-01-2-2',
    statement:
      'Defer escalation delivery to connectivity while the containment itself does not wait.',
    rolesProhibited: 'Roles prohibited: no configuration may make containment wait for delivery.',
    connectivity: 'Online: delivery is immediate. Offline: delivery queues durably.',
    patterns: ['FB-FL-SEV1-01'],
    patternsNote: null,
    sourceRef: 'FUNC-A5-01-2-2 · L40988',
  },
  {
    id: 'FUNC-A5-01-3-1',
    statement:
      'Perform coaching selection, prior-case interpretation, and Shift Handoff brief generation on the server.',
    rolesProhibited: 'Roles prohibited: it may never trigger, classify, hold, or release.',
    connectivity:
      "Online: available. Offline: absent, with the step's authored Work Instructions as the fallback.",
    patterns: ['FB-FL-AI-01'],
    patternsNote: null,
    sourceRef: 'FUNC-A5-01-3-1 · L40990',
  },
  {
    id: 'FUNC-A5-02-1-1',
    statement:
      'Classify locally the instant the value is captured, mandatory and uniform for every tenant, with only escalation delivery deferring to sync.',
    rolesProhibited: 'Roles prohibited: every role and every model.',
    connectivity: 'Online and offline: identical.',
    patterns: ['FB-FL-SEV1-01'],
    patternsNote: null,
    sourceRef: 'FUNC-A5-02-1-1 · L40993',
  },
  {
    id: 'FUNC-A5-02-1-2',
    statement:
      'Treat server-side detection atoms as the mirror and confirmation path, never the trigger.',
    rolesProhibited:
      'Roles prohibited: the server may not re-trigger or re-classify without a recorded human reclassification at review time.',
    connectivity: 'Online: mirrors. Offline: no mirror exists yet.',
    patterns: ['FB-FL-SEV1-01'],
    patternsNote: null,
    sourceRef: 'FUNC-A5-02-1-2 · L40994',
  },
  {
    id: 'FUNC-A5-02-2-1',
    statement: 'Place the hold on the breaching Lot where a lot exists.',
    rolesProhibited: 'Roles prohibited: nobody may prevent it.',
    connectivity: 'Online and offline: identical.',
    patterns: ['FB-FL-SEV1-01'],
    patternsNote: null,
    sourceRef: 'FUNC-A5-02-2-1 · L40996',
  },
  {
    id: 'FUNC-A5-02-2-2',
    statement: 'Place the hold on the Unit for serialized work with no lot.',
    rolesProhibited: 'Roles prohibited: nobody.',
    connectivity: 'Online and offline: identical.',
    patterns: ['FB-FL-SEV1-01'],
    patternsNote: null,
    sourceRef: 'FUNC-A5-02-2-2 · L40997',
  },
  {
    id: 'FUNC-A5-02-2-3',
    statement:
      'Place the hold on the Run itself where the work carries no unit at all, quarantining its output and blocking the run pending Quality Manager disposition.',
    rolesProhibited: 'Roles prohibited: nobody.',
    connectivity: 'Online and offline: identical.',
    patterns: ['FB-FL-SEV1-01'],
    patternsNote: null,
    sourceRef: 'FUNC-A5-02-2-3 · L40998',
  },
  {
    id: 'FUNC-A5-02-3-1',
    statement:
      'Enforce automatic freeze of the breaching scope plus release reserved to the Quality Manager, only and uniformly, arriving at the device as a lot-release command.',
    rolesProhibited: 'Roles prohibited: every other role and every configuration.',
    connectivity:
      'Online and offline: the freeze is identical; the release requires connectivity because it is a command.',
    patterns: ['FB-FL-SEV1-01'],
    patternsNote: null,
    sourceRef: 'FUNC-A5-02-3-1 · L41000',
  },
  {
    id: 'FUNC-A5-02-3-2',
    statement:
      "Execute the tenant's configured action bundle's device-side actions immediately on classification, above the floor.",
    rolesProhibited:
      'Roles prohibited: no bundle may subtract from the floor; the platform rejects a looser-than-floor value rather than logging it.',
    connectivity:
      'Online and offline: device-side actions identical; server-side actions defer.',
    patterns: ['FB-FL-SEV1-01'],
    patternsNote: null,
    sourceRef: 'FUNC-A5-02-3-2 · L41001',
  },
  {
    id: 'FUNC-A5-03-1-1',
    statement:
      'Put the hold in force locally at once while making no claim that it has teleported.',
    rolesProhibited: 'Roles prohibited: no surface may present a local hold as a global one.',
    connectivity: 'Online and offline: identical local force.',
    patterns: ['FB-FL-SEV1-01'],
    patternsNote: null,
    sourceRef: 'FUNC-A5-03-1-1 · L41004',
  },
  {
    id: 'FUNC-A5-03-1-2',
    statement: 'Deliver the hold to sibling devices working the same lot at their next sync.',
    rolesProhibited: 'Roles prohibited: nobody may accelerate it by pretending.',
    connectivity:
      'Online: fast. Offline for the sibling: the sibling learns nothing until it syncs.',
    patterns: ['FB-FL-CMD-01'],
    patternsNote: null,
    sourceRef: 'FUNC-A5-03-1-2 · L41005',
  },
  {
    id: 'FUNC-A5-03-1-3',
    statement: 'Emit hold-propagation lag as platform telemetry.',
    rolesProhibited:
      'Roles prohibited: it contains no operational content, only metadata and timings.',
    connectivity: 'Online: emitted. Offline: buffered.',
    patterns: ['FB-FL-UP-01'],
    patternsNote: null,
    sourceRef: 'FUNC-A5-03-1-3 · L41006',
  },
  {
    id: 'FUNC-A5-04-1-1',
    statement:
      'Behave identically for every tenant across deterministic specification gates, deviation detection, severity classification, and the Severity 1 hold, with no tenant setting, authoring choice, or platform control reaching them.',
    rolesProhibited: 'Roles prohibited: all, including the root account of the platform console.',
    connectivity: 'Online and offline: identical.',
    patterns: [],
    patternsNote:
      'Not applicable — a non-configurable invariant has no fallback; its violation is a defect.',
    sourceRef: 'FUNC-A5-04-1-1 · L41009',
  },
  {
    id: 'FUNC-A5-04-1-2',
    statement: 'Ensure no platform-level pause of the agentic layer suppresses layer (a).',
    rolesProhibited:
      'Roles prohibited: nobody may pause the deterministic backbone, which has no off switch.',
    connectivity: 'Online and offline: identical.',
    patterns: ['FB-FL-AI-01'],
    patternsNote: 'FB-FL-AI-01 covers the coaching loss only.',
    sourceRef: 'FUNC-A5-04-1-2 · L41010',
  },
  {
    id: 'FUNC-A5-04-2-1',
    statement: 'Treat specification gates as hard and platform-fixed.',
    rolesProhibited: null,
    connectivity: 'Online and offline: identical.',
    patterns: ['FB-FL-CAP-01'],
    patternsNote: null,
    sourceRef: 'FUNC-A5-04-2-1 · L41012',
  },
  {
    id: 'FUNC-A5-04-2-2',
    statement:
      'Treat the evaluation gate on agent output as hard and server-side, so nothing an agent proposes reaches a worker or changes a record without passing it, beyond pre-authorised policy.',
    rolesProhibited: null,
    connectivity:
      'Online: enforced server-side. Offline: Not applicable — no agent output reaches an offline device, so there is nothing to gate.',
    patterns: ['FB-FL-AI-01'],
    patternsNote: null,
    sourceRef: 'FUNC-A5-04-2-2 · L41013',
  },
  {
    id: 'FUNC-A5-04-2-3',
    statement:
      'Treat the qualification gate as the only gate whose enforcement posture a tenant governs — a people-governance choice, never a safety one.',
    rolesProhibited: 'Roles prohibited: no worker override on the device.',
    connectivity: 'Online and offline: enforced locally under either posture.',
    patterns: ['FB-FL-GATE-01'],
    patternsNote: null,
    sourceRef: 'FUNC-A5-04-2-3 · L41014',
  },
] as const satisfies readonly A5Functionality[]

/** The §22.9 map's answer for this module, read rather than transcribed. */
export const A5_MAPPED_PATTERNS: readonly FrontlineFallbackPattern[] =
  patternsForModule('MOD-FL-A5')

/**
 * Every pattern this module's own functionalities name, derived from the
 * list above. A second reading of the same obligation, so the two can be
 * compared instead of one being trusted.
 */
export const A5_PATTERNS_NAMED_BY_FUNCTIONALITIES = [
  ...new Set(A5_FUNCTIONALITIES.flatMap((f) => f.patterns as readonly FrontlineFallbackId[])),
] as const satisfies readonly FrontlineFallbackId[]

/* ==================================================================== *
 * TWO FINDINGS AGAINST THE FROZEN SOURCE, RECORDED RATHER THAN CLOSED.
 *
 * Both are about the SAME obligation read three ways, and neither is closed
 * here by picking a reading — filling either gap would be this build writing
 * a fallback assignment the source did not make.
 * ==================================================================== */

export interface A5SourceFinding {
  readonly what: string
  readonly evidence: string
  readonly notClosedBecause: string
  readonly sourceRef: string
}

export const A5_SOURCE_FINDINGS = [
  {
    what: 'One of this module’s twenty-one functionalities names no FB-FL-* pattern at all.',
    evidence:
      'AC-FL-011-1 (L40151) requires every functionality in chapter 22 to name at least one FB-FL-* ' +
      'pattern. FUNC-A5-04-1-1 (L41009) gives its Fallback field as "Not applicable — a ' +
      'non-configurable invariant has no fallback; its violation is a defect." That is a stated ' +
      'non-applicability rather than a pattern, so the criterion is not met by this functionality in ' +
      'the frozen source.',
    notClosedBecause:
      'Assigning FB-FL-SEV1-01 to it because its neighbours carry one would manufacture the evidence ' +
      'the criterion asks for. The functionality is carried with an empty pattern list and its own ' +
      'sentence, and functionalitiesNamingNoPattern in @/frontline/fallbacks returns it.',
    sourceRef: 'AC-FL-011-1 · L40151',
  },
  {
    what: 'Three parts of the source give this module three different fallback-pattern sets.',
    evidence:
      'The §22.9 module map lists MOD-FL-A5 against FB-FL-CAP-01 (L40133), FB-FL-AI-01 (L40136) and ' +
      'FB-FL-SEV1-01 (L40138) — three. The module card’s own Fallback identifier field (L40975) ' +
      'names four, adding FB-FL-PKG-01. This module’s twenty-one functionalities between them ' +
      'name seven, adding FB-FL-CMD-01, FB-FL-UP-01 and FB-FL-GATE-01. FB-FL-PKG-01’s own map ' +
      'row (L40132) lists A2, A3 and A6 and does not list A5.',
    notClosedBecause:
      'The map is the table patternsForModule reads and it is not this task’s file to edit; the ' +
      'card and the functionalities are the source’s own words and are not this task’s to ' +
      'correct. All three readings are carried and the divergence renders on the panel.',
    sourceRef: 'FB-FL-PKG-01 · L40132',
  },
] as const satisfies readonly A5SourceFinding[]

/* ==================================================================== *
 * THE EIGHT ACCEPTANCE CRITERIA, TRANSCRIBED.
 * Table header L41044, separator L41045, data L41046-L41053.
 * ==================================================================== */

export const A5_ACCEPTANCE_CRITERIA = [
  {
    id: 'AC-A5-1',
    text: 'Gate evaluation, deviation detection, and severity classification produce identical results with the network interface disabled.',
    sourceRef: 'AC-A5-1 · L41046',
  },
  {
    id: 'AC-A5-2',
    text: 'A Severity 1 classification places a local hold within the same local transaction as the capture that triggered it.',
    sourceRef: 'AC-A5-2 · L41047',
  },
  {
    id: 'AC-A5-3',
    text: 'The hold lands on the Lot where one exists, otherwise the Unit for serialized work, otherwise the Run.',
    sourceRef: 'AC-A5-3 · L41048',
  },
  {
    id: 'AC-A5-4',
    text: 'Only a Quality Manager can release a Severity 1 hold, and release reaches a device only as a validated lot-release command.',
    sourceRef: 'AC-A5-4 · L41049',
  },
  {
    id: 'AC-A5-5',
    text: 'The pre-authorised containment checklist launches locally at classification and cannot be skipped or dismissed.',
    sourceRef: 'AC-A5-5 · L41050',
  },
  {
    id: 'AC-A5-6',
    text: 'No tenant configuration can weaken any element of the deterministic layer, and the platform rejects a looser-than-floor value rather than logging it.',
    sourceRef: 'AC-A5-6 · L41051',
  },
  {
    id: 'AC-A5-7',
    text: 'An emergency pause of the agentic layer leaves gates, detection, classification, the Severity 1 hold, and containment launch fully operational.',
    sourceRef: 'AC-A5-7 · L41052',
  },
  {
    id: 'AC-A5-8',
    text: 'No artificial-intelligence component appears anywhere in the detection or classification code path.',
    sourceRef: 'AC-A5-8 · L41053',
  },
] as const satisfies readonly {
  readonly id: string
  readonly text: string
  readonly sourceRef: string
}[]

/* ==================================================================== *
 * THE THREE DECISIONS THIS MODULE DISCLOSES.
 *
 * WHY THEY ARE DISCLOSED HERE AND NOT THROUGH `DecisionDisclosure`, AND WHY
 * THAT IS A FINDING RATHER THAN A PREFERENCE. `@/disclosure/DecisionDisclosure`
 * is the only place an open decision is rendered on any surface, and it takes
 * a `DecisionId`. That union contains none of `DEC-GATE-001`,
 * `DEC-NOSHIFT-001` or `DEC-CLOCKWIN-001`; the canon file is
 * not this task's to edit. `Stu14LocalDisclosure` in
 * `@/studio/modules/stu-14/rendering` met exactly this and set the idiom
 * followed here: disclose locally IN THE CANON'S OWN SHAPE, declare the gap
 * on `canonNote`, and never file the decision under a neighbouring
 * identifier — because a client searching the canon for one of these would
 * then find someone else's decision instead.
 *
 * `readings` is the canon's own `DecisionReading` type, imported rather than
 * redeclared, so it carries exactly two fields and there is no field in which
 * a reading could be marked the answer.
 * ==================================================================== */

export interface FlA5LocalDisclosure {
  readonly decisionRef: 'DEC-GATE-001' | 'DEC-NOSHIFT-001' | 'DEC-CLOCKWIN-001'
  readonly question: string
  readonly readings: readonly DecisionReading[]
  readonly adopted: string
  /** Why this module is the one that discloses it. */
  readonly whyHere: string
  /** Why it is disclosed locally rather than through the shared canon. */
  readonly canonNote: string
}

const CANON_NOTE =
  'The shared decision canon at @/disclosure/decisions carries no record keyed to this identifier — ' +
  'it is not a member of that file’s DecisionId union — and that file is ' +
  'another task’s path. Disclosed here in the canon’s own shape so it can be absorbed ' +
  'without a rewrite, and declared as a gap rather than filed under a neighbouring identifier.'

export const A5_DISCLOSURES = [
  {
    decisionRef: 'DEC-GATE-001',
    question:
      'Does every action agent route through a per-event human gate before any effect, or is pre-authorised Studio-authored policy a form of gating in itself?',
    readings: [
      {
        text:
          'The gating position for the Prevention Agent carries a contradiction: §3.7 and §6.6.1 say ' +
          'it operates entirely under pre-authorised, Studio-authored policy with the runtime gate ' +
          'existing only for proposals beyond that policy',
        locator: 'DEC-GATE-001 · L40952',
      },
      {
        text:
          'while §8.3.2 says every action agent routes through a human gate before any effect and ' +
          '§8.3.3 labels the Prevention Agent "action, gated"',
        locator: 'DEC-GATE-001 · L40952',
      },
    ],
    adopted:
      'Both readings stay on the record. This build carries the position the source records at ' +
      'Option C — gating declared per agent in the agent record’s governance-binding field, which ' +
      'binds the Prevention Agent to authoring-time policy and the Deviation and Containment Agent ' +
      'to a runtime human gate for proposals beyond pre-authorised containment — and this module ' +
      'renders the pre-authorised half of it and nothing else.',
    whyHere:
      'The Deviation and Containment Agent is this module’s agent, and row 6 of this matrix is ' +
      'the pre-authorised half of it: completing the configured containment checklist needs no gate ' +
      'because it was authorised at authoring time. What the runtime gate covers is a proposal beyond ' +
      'that checklist, and nothing on this device proposes one. Artificial intelligence never ' +
      'triggers or classifies a deviation here: the deterministic evaluation does, at capture, before ' +
      'any model runs.',
    canonNote: CANON_NOTE,
  },
  {
    decisionRef: 'DEC-NOSHIFT-001',
    question:
      'Where escalation routing resolves to nobody on shift, who receives a Severity 1 escalation?',
    readings: [
      {
        text:
          'Where no holder of the target role is on shift, the platform default escalates to the ' +
          "tenant's Quality Manager role irrespective of shift, marked as a fallback delivery; that " +
          'default is carried as DEC-NOSHIFT-001.',
        locator: 'FB-FL-SEV1-01 · L40114',
      },
      {
        text: 'DEC-NOSHIFT-001 is preserved unresolved.',
        locator: 'DEC-NOSHIFT-001 · L2687',
      },
    ],
    adopted:
      'This panel states the platform default and marks the fallback delivery visibly as one. It ' +
      'settles nothing about whether that default is what a tenant wants, and the source keeps the ' +
      'decision unresolved; the decision owner is the client.',
    whyHere:
      'It is the fallback-of-fallback of FB-FL-SEV1-01, which is this module’s primary pattern, ' +
      'and it is named three times inside this module’s own section: in the notifications table ' +
      '(L40967), in FUNC-A5-01-2-2 (L40988), and in the failure paragraph (L41040). The hold does not ' +
      'depend on any of it — a notification is never the only mechanism enforcing a hold.',
    canonNote: CANON_NOTE,
  },
  {
    decisionRef: 'DEC-CLOCKWIN-001',
    question:
      'Which ordering settles an ordinary conflict — the device timestamp that last-write-wins uses, or the server-receipt time the time-discipline rule makes authoritative?',
    readings: [
      {
        text:
          'The conflict rule is last-write-wins by device timestamp, while the time-discipline rule ' +
          'makes server-receipt time authoritative for ordering at sync.',
        locator: 'DEC-CLOCKWIN-001 · L42598',
      },
      {
        text:
          '§7.10.4 reconciles the two only for the skew-flagged case, routing those conflicts to ' +
          'review. It does not address the ordinary case: a device whose clock is fast but within ' +
          "the tenant's skew threshold — up to five minutes by default — can win a last-write-wins " +
          'conflict against a capture that actually happened later in real time.',
        locator: 'DEC-CLOCKWIN-001 · L42598',
      },
    ],
    adopted:
      'Nothing is resolved here. The source records three candidate resolutions and recommends the ' +
      'second — keep device time but route any conflict where the two orderings disagree to the ' +
      'Client Command Center conflict-and-skew review — and names the decision owner as the client, ' +
      'through the Frontline Functional Specification.',
    whyHere:
      'This module writes the classification as the act of record, and the envelope carries both a ' +
      'device time and a server-receipt time for it. Where two devices work the same lot, which ' +
      'capture wins a conflict decides which classification is the record, so the unstated window ' +
      'sits directly underneath a Severity 1 hold.',
    canonNote: CANON_NOTE,
  },
] as const satisfies readonly FlA5LocalDisclosure[]
