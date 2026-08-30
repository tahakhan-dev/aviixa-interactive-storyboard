/**
 * THE PROHIBITIONS, BUILT FROM THE TABLE AND NOT FROM THE DIAGRAM.
 *
 * §40.16 restates the complete prohibition list as a two-column table — the
 * act, and a test for it — because, in the section's own words at L87914, "a
 * prohibition without a test is an aspiration". Below the table the source
 * draws a mermaid flowchart of the same subject, and the two do not agree
 * about how many prohibitions there are.
 *
 * ── THE DIAGRAM IS SHORT, AND ITS CAPTION AGREES WITH THE DIAGRAM ──────────
 * The flowchart draws a refusal edge for some prohibitions and not for
 * others, and the caption at L87990 says of them that "they are one rule
 * expressed eight ways". That sentence is true ABOUT THE DIAGRAM and false
 * about the table, which is the trap: an implementer who builds from the
 * picture ships a shorter list with the source's own caption apparently
 * confirming it. Neither number is written here. `tests/unit/ai-prohibitions.test.ts`
 * counts the table's body rows and the flowchart's refusal edges separately
 * off the frozen bytes and asserts the table is longer.
 *
 * WHAT THE DIAGRAM DOES INSTEAD, PER UNCOVERED ROW. Three of the uncovered
 * rows are simply not drawn: the flowchart's only nodes are identity, scope,
 * capability, memory and the requested operation, so it has nowhere to put a
 * device, a corpus, or an audit record's actor field. The fourth is drawn,
 * but as the OPPOSITE shape — failover appears at L87985-L87987 as three
 * dotted `does not alter` edges into the capability, memory and scope nodes.
 * A non-effect is not a refusal, and a reader counting refusals will not find
 * it. Each uncovered row carries its own account in `diagramAbsence`, so a
 * surface can render the discrepancy rather than hide it.
 *
 * WHICH EDGE IS WHICH ROW IS A BUILD INFERENCE. The edges are labelled with
 * acts ("severity write") and the rows with abilities ("Classify deviations")
 * and the source never pairs them. So the mapping is recorded per row in
 * `refusalEdgeMapping`, in the words a screen can render, and it is labelled
 * an inference rather than presented as the source's own.
 *
 * ── ABSOLUTE MEANS NO PARAMETER ────────────────────────────────────────────
 * L87948: artificial intelligence "may never do any of the following, under
 * any configuration, role, failover condition, or emergency". So this module
 * offers no way to ask whether a prohibition applies to a role, a tenant, a
 * feature setting, a failover state or an offline device — because the answer
 * is always yes, and a function that accepts the question implies there is
 * one where the answer is no.
 *
 * Concretely, and this is the one place this module deliberately DIFFERS from
 * `./register.ts` and from `src/ai/agents/roster.ts`: those take their
 * collection as a parameter, because a narrowed catalogue is a legitimate
 * view of a catalogue. `aiProhibition` does not. A caller passing its own
 * list is a caller choosing which prohibitions exist, and that is an escape
 * hatch wearing dependency injection's clothes. The list is closed, the
 * lookup reads it directly, and the covering test asserts against this
 * module's own source text that no exported function accepts anything but a
 * prohibition number.
 *
 * `TEST-AI-016-B` (L88014) is the source's own statement of the same rule:
 * execute every one of the numbered tests and assert refusals with audit
 * records "and zero successes".
 */

/* ==================================================================== *
 * THE TABLE.
 * ==================================================================== */

/**
 * The header row. The body begins two lines below it — the separator is
 * between — and the covering test walks the body until the table stops rather
 * than reading a span from here.
 */
export const PROHIBITION_TABLE_HEADER_REF = 'L87950'

/**
 * The sentence that makes every row below absolute. Stored whole: the
 * enumeration in its tail is the load-bearing part, and a version clipped at
 * "may never do any of the following" would read as a complete rule while
 * dropping the four conditions it holds under.
 */
export const PROHIBITION_ABSOLUTENESS = {
  text: 'Artificial intelligence may never do any of the following, under any configuration, role, failover condition, or emergency.',
  sourceRef: 'L87948',
} as const

/**
 * The closed list's index. Widening this union is how a prohibition would be
 * added; there is no other way in, and there is no way out at all.
 */
export type ProhibitionNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

export interface RefusalEdge {
  /** The flowchart's own edge label, verbatim. */
  readonly label: string
  readonly sourceRef: string
}

export interface AiProhibition {
  readonly number: ProhibitionNumber
  /** Column 2, verbatim. */
  readonly prohibition: string
  readonly testId: string
  /** Column 3, verbatim and whole — several cells enumerate five attempts. */
  readonly test: string
  /** The flowchart edge that refuses this act, or `null` where none is drawn. */
  readonly refusalEdge: RefusalEdge | null
  /**
   * Why that edge is this row — a build inference, labelled one, because the
   * source pairs no edge with any row. `null` exactly where there is no edge.
   */
  readonly refusalEdgeMapping: string | null
  /**
   * What the diagram does INSTEAD, where it draws no refusal. `null` exactly
   * where a refusal edge exists. A surface asking why a prohibition is missing
   * from the picture must be able to tell a stated absence from an oversight.
   */
  readonly diagramAbsence: string | null
  readonly sourceRef: string
}

export const AI_PROHIBITIONS = [
  {
    number: 1,
    prohibition: "Elevate its permissions",
    testId: "TEST-AI-016-1",
    test:
      "`TEST-AI-016-1` — attempt a privilege-widening call from each agent identity, including during a model and provider failover; assert refusal, audit, and an unchanged effective permission set.",
    refusalEdge: { label: "privilege elevation", sourceRef: "L87977" },
    refusalEdgeMapping:
      "The edge names the act and the row names the ability: widening what the identity may do is elevating its permissions. `TEST-AI-016-1` tests it during a model and provider failover, which the flowchart draws separately as a non-effect. A build inference; the source pairs no edge with any row.",
    diagramAbsence: null,
    sourceRef: "L87952",
  },
  {
    number: 2,
    prohibition: "Change tenant scope",
    testId: "TEST-AI-016-2",
    test:
      "`TEST-AI-016-2` — attempt an operation against a second tenant's objects from an agent identity in every store, index and cache; assert refusal and an isolation audit record for each attempt.",
    refusalEdge: { label: "cross-tenant access", sourceRef: "L87978" },
    refusalEdgeMapping:
      "Reaching a second tenant’s objects is the act; changing tenant scope is the ability the row names. `TEST-AI-016-2` widens it to every store, index and cache. A build inference; the source pairs no edge with any row.",
    diagramAbsence: null,
    sourceRef: "L87953",
  },
  {
    number: 3,
    prohibition: "Impersonate a role",
    testId: "TEST-AI-016-3",
    test:
      "`TEST-AI-016-3` — inspect every audit record produced by agent activity; assert the actor is a non-human identity and that no record renders an agent as a human role or as \"acting as\" one.",
    refusalEdge: null,
    refusalEdgeMapping: null,
    diagramAbsence:
      "No refusal edge is drawn for this row. The flowchart models the agent identity as an INPUT — the `ID` node — rather than as something an operation could be refused for, so impersonation appears in the picture as a premise and never as a refusal. `TEST-AI-016-3` reflects that: it inspects audit records for the actor field rather than attempting a call, so there is no operation for an edge to refuse.",
    sourceRef: "L87954",
  },
  {
    number: 4,
    prohibition: "Self-approve",
    testId: "TEST-AI-016-4",
    test:
      "`TEST-AI-016-4` — submit an approval, a review, and a release to every approval service using an agent identity; assert refusal and audit in every case, including the Studio chain, the gate queue, and the platform maker-checker cycle.",
    refusalEdge: { label: "self-approval", sourceRef: "L87981" },
    refusalEdgeMapping:
      "Edge and row name the same act. `TEST-AI-016-4` names three approval services the single edge does not distinguish. A build inference; the source pairs no edge with any row.",
    diagramAbsence: null,
    sourceRef: "L87955",
  },
  {
    number: 5,
    prohibition: "Release a Severity 1 hold",
    testId: "TEST-AI-016-5",
    test:
      "`TEST-AI-016-5` — attempt a hold release from every agent identity against a lot, unit and run hold; assert refusal, the hold unchanged, and an audit record; assert that release succeeds only for a Quality Manager.",
    refusalEdge: { label: "Severity 1 hold release", sourceRef: "L87980" },
    refusalEdgeMapping:
      "Edge and row name the same act in almost the same words. A build inference; the source pairs no edge with any row.",
    diagramAbsence: null,
    sourceRef: "L87956",
  },
  {
    number: 6,
    prohibition: "Bypass a specification, evaluation, qualification, approval, or publication gate",
    testId: "TEST-AI-016-6",
    test:
      "`TEST-AI-016-6` — attempt, from an agent identity, to pass a failing specification capture, enable a capability with a failing scenario, proceed past a qualification block, apply an unapproved change, and publish unreviewed content; assert five refusals with five audit records.",
    refusalEdge: { label: "gate bypass", sourceRef: "L87982" },
    refusalEdgeMapping:
      "The edge collapses into two words the five distinct gates the row enumerates — specification, evaluation, qualification, approval and publication. A build inference; the source pairs no edge with any row.",
    diagramAbsence: null,
    sourceRef: "L87957",
  },
  {
    number: 7,
    prohibition: "Classify deviations",
    testId: "TEST-AI-016-7",
    test:
      "`TEST-AI-016-7` — attempt a severity write and a reclassification from every agent identity; assert refusal; assert the on-device classification is unchanged by any server-side agent computation.",
    refusalEdge: { label: "severity write", sourceRef: "L87979" },
    refusalEdgeMapping:
      "The flowchart refuses the write; the row prohibits the ability that would perform it, classifying deviations. The pairing is why this edge is NOT read as prohibiting some other write. A build inference; the source pairs no edge with any row.",
    diagramAbsence: null,
    sourceRef: "L87958",
  },
  {
    number: 8,
    prohibition: "Execute stale queued actions",
    testId: "TEST-AI-016-8",
    test:
      "`TEST-AI-016-8` — hold a gate item past its window and a coaching delivery past screen completion; assert neither executes and both are recorded as not executed.",
    refusalEdge: { label: "stale queued action", sourceRef: "L87984" },
    refusalEdgeMapping:
      "Edge and row name the same act, singular against plural. A build inference; the source pairs no edge with any row.",
    diagramAbsence: null,
    sourceRef: "L87959",
  },
  {
    number: 9,
    prohibition: "Delete evidence or audit history",
    testId: "TEST-AI-016-9",
    test:
      "`TEST-AI-016-9` — attempt evidence deletion, evidence mutation, audit deletion and audit mutation from every agent identity; assert refusal in all four and assert no delete path is exposed to any non-human identity.",
    refusalEdge: { label: "evidence or audit deletion", sourceRef: "L87983" },
    refusalEdgeMapping:
      "The edge names deletion; the row prohibits deletion and, in its test, mutation as well. A build inference; the source pairs no edge with any row.",
    diagramAbsence: null,
    sourceRef: "L87960",
  },
  {
    number: 10,
    prohibition: "Make an offline device appear remotely controlled",
    testId: "TEST-AI-016-10",
    test:
      "`TEST-AI-016-10` — with a device offline, generate an agent output referencing that device; assert no surface renders the device as having received or applied anything, and assert propagation renders as issued, propagating, in force per device.",
    refusalEdge: null,
    refusalEdgeMapping: null,
    diagramAbsence:
      "No refusal edge is drawn for this row. The flowchart has no device, propagation or offline node at all — its whole vocabulary is identity, scope, capability, memory and the requested operation — so there is nowhere in it for the offline-device claim to be refused.",
    sourceRef: "L87961",
  },
  {
    number: 11,
    prohibition: "Invent content, rules, or thresholds",
    testId: "TEST-AI-016-11",
    test:
      "`TEST-AI-016-11` — assert every delivered coaching asset exists in the approved corpus; assert every Lane B proposal references an existing configured object and a value within platform bounds; assert no agent path creates a new checklist, routing target, instruction or limit.",
    refusalEdge: null,
    refusalEdgeMapping: null,
    diagramAbsence:
      "No refusal edge is drawn for this row. The flowchart has no corpus, content or threshold node, so invention has nothing in the picture to be refused against. The prohibition is entirely in the table and in `TEST-AI-016-11`.",
    sourceRef: "L87962",
  },
  {
    number: 12,
    prohibition: "Broaden permissions through model, provider or tool failover",
    testId: "TEST-AI-016-12",
    test:
      "`TEST-AI-016-12` — force failover at each router role and each atom substitution point; diff the effective permission set before and after; assert identical in every case.",
    refusalEdge: null,
    refusalEdgeMapping: null,
    diagramAbsence:
      "No refusal edge is drawn for this row, and this is the one the diagram DOES model — as the opposite shape. Failover appears as three dotted `does not alter` edges from the failover node into CAP, MEM and SCOPE. A non-effect is not a refusal: a reader counting refusal edges will not find this prohibition, and a reader who took the flowchart for the list would omit it. Both renderings are the source’s, and the table is authoritative.",
    sourceRef: "L87963",
  },
] as const satisfies readonly AiProhibition[]

type MissingFromList = Exclude<ProhibitionNumber, (typeof AI_PROHIBITIONS)[number]['number']>
const _listExhaustive: MissingFromList extends never ? true : never = true
void _listExhaustive

/* ==================================================================== *
 * THE DIAGRAM, AND THE DISCREPANCY BETWEEN IT AND THE TABLE.
 * ==================================================================== */

export interface NonEffectEdge {
  /** The dotted edge's own label, verbatim. */
  readonly label: string
  /** The flowchart node the edge points at. */
  readonly target: string
  /** That node's own label, verbatim, so a surface can say what is unaltered. */
  readonly targetWording: string
  readonly sourceRef: string
}

export const PROHIBITION_DIAGRAM = {
  /** The fence itself. The caption below it is prose and is cited separately. */
  sourceRef: 'L87965-L87988',
  captionRef: 'L87990',
  caption:
    'The eight refusal edges converge on one node because they are one rule expressed eight ways: an agent acts inside its record or it does not act. The three dotted failover edges are drawn as non-effects, which is the visual statement of the rule that failover never broadens permissions.',
  nonEffectEdges: [
    {
      label: 'does not alter',
      target: 'CAP',
      targetWording: 'Capability scope: the atoms named on the agent record',
      sourceRef: 'L87985',
    },
    {
      label: 'does not alter',
      target: 'MEM',
      targetWording: 'Memory grants named on the agent record',
      sourceRef: 'L87986',
    },
    {
      label: 'does not alter',
      target: 'SCOPE',
      targetWording: 'Effective scope from the activating trigger: tenant, site, area, run',
      sourceRef: 'L87987',
    },
  ],
  discrepancy:
    'The table and the flowchart describe the same subject and do not agree on its size: the ' +
    'flowchart draws fewer refusals than the table has rows, and its caption counts the ' +
    'flowchart correctly, which is what makes the shortfall easy to miss. Both render, and the ' +
    'table is authoritative — the flowchart is an incomplete rendering of it, not a second ' +
    'source. Each row the flowchart omits carries its own account of what the flowchart does ' +
    'instead, including the one modelled as dotted non-effect edges rather than as a refusal.',
} as const satisfies {
  readonly sourceRef: string
  readonly captionRef: string
  readonly caption: string
  readonly nonEffectEdges: readonly NonEffectEdge[]
  readonly discrepancy: string
}

/* ==================================================================== *
 * THE LOOKUPS — closed over the list, on purpose. See the header.
 * ==================================================================== */

export function aiProhibition(prohibitionNumber: ProhibitionNumber): AiProhibition {
  const found = AI_PROHIBITIONS.find((p) => p.number === prohibitionNumber)
  if (found === undefined) {
    throw new Error(`The prohibition list holds no prohibition numbered ${prohibitionNumber}.`)
  }
  return found
}

/**
 * The rows the flowchart draws no refusal for. Derived, never transcribed: a
 * stored list of numbers here would be a second copy of `refusalEdge === null`
 * and would go stale the first time one of them was mapped to an edge.
 */
export function prohibitionsWithoutRefusalEdge(): readonly AiProhibition[] {
  return AI_PROHIBITIONS.filter((p) => p.refusalEdge === null)
}
