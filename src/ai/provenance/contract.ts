import {
  PROVENANCE_CLASS_IDS,
  provenanceClass,
  type ContractColumn,
  type ProvenanceClassId,
} from './classes'

/**
 * THE PROVENANCE RENDERING CONTRACT — the deciding half.
 *
 * `./classes` holds the six classes and the table. This module holds the three
 * things that make the table binding rather than decorative:
 *
 *   1. `resolveProvenance` — the classification tree of L89443-L89455, with
 *      the fail-closed rule of `AC-42-403` (L89480) inside it rather than
 *      beside it;
 *   2. `contractPermits` — the one place a rendering path asks whether a class
 *      may carry a live label, a model or agent identity, a content version, a
 *      human identity, or anything at all while offline. It reads the source's
 *      own cell. A path that decides for itself is a path that will eventually
 *      decide differently from another one;
 *   3. `provenanceViolations` — the check behind `TEST-42-401` (L89485), over
 *      rendered output rather than over intentions.
 *
 * ── WHY THE FAIL-CLOSED RULE IS INSIDE THE RESOLVER ────────────────────────
 * `AC-42-403`: an element classified `PROV-1` that cannot produce an agent run
 * identifier and a decision record fails closed to `PROV-6`. Written as a
 * separate guard a caller must remember, it is a rule that holds on the paths
 * whose authors remembered it. Written inside the resolver, `PROV-1` is
 * unreachable without both identifiers, and the covering test proves that over
 * the whole input space rather than on one input.
 *
 * NOTE THE IDENTIFIER. It is `AC-42-403`, at L89480. `AC-43-403` is a
 * different criterion in a different chapter — model quarantine and provider
 * failover being beyond §8.7.1, at L91373 — and the re-plan cited it for this
 * rule. Both lines are pinned in `tests/unit/ai-provenance.test.ts` from both
 * sides, so the collision cannot be re-introduced silently.
 *
 * ── WHAT THE LINT IS AND WHAT IT IS NOT ────────────────────────────────────
 * L89474 names the failure mode as mislabelling and detection as twofold: a
 * build-time lint asserting every rendering path emits exactly one provenance
 * class, and a runtime assertion that a card carrying the agent badge has a
 * non-null agent run identifier and a decision record. The second is
 * `resolveProvenance`. The first is `provenanceViolations`, and it checks two
 * things a rendered tree can actually be wrong about:
 *
 *   - DUAL CLASSIFICATION. A mark carrying anything but exactly one known
 *     class identifier, or a mark nested inside another mark. Nesting is how
 *     an element ends up carrying two, and it cannot be seen by looking at
 *     either component alone.
 *   - UNCLASSIFIED. An element declaring itself a guidance element and
 *     carrying no class at all.
 *
 * It does NOT sweep the four surfaces. `TEST-42-401` asks for that, and it is
 * a `tests/coverage/` gate over the built tree, which is not this task's to
 * write — and writing it now would be a directory sweep with nothing yet to
 * find, which is the one shape of gate this build refuses. What ships here is
 * the checker the sweep will call, exercised against real rendered output.
 */

/**
 * The facts the classification tree asks about, one field per decision node.
 * They are questions about the element, not about the surface: the same
 * element classified on two surfaces must classify identically.
 */
export interface GuidanceElementFacts {
  /**
   * L89445 — "Was it produced by a model during this session", and where.
   * `null` is the no branch.
   */
  readonly producedByModelThisSession: 'server side' | 'on device' | null
  /** L89448 — "Is it approved content authored and released earlier". */
  readonly approvedContentAuthoredAndReleasedEarlier: boolean
  /** L89450 — "Is it a packaged value producing an outcome by comparison". */
  readonly packagedValueProducingAnOutcomeByComparison: boolean
  /** L89452 — "Did a named person decide or instruct". */
  readonly namedPersonDecidedOrInstructed: boolean
  /** `AC-42-403` (L89480): both of these, or `PROV-1` is not available. */
  readonly agentRunId: string | null
  readonly decisionRecordId: string | null
}

export interface ProvenanceResolution {
  readonly classId: ProvenanceClassId
  /**
   * True only where `AC-42-403` downgraded a server-side element, in which
   * case `classId` is `PROV-6`. It is on the resolution rather than inferred
   * by the caller because a surface must be able to say WHY it is showing an
   * absence, and an absence with no reason is the shape of an oversight.
   */
  readonly failedClosed: boolean
}

export function resolveProvenance(facts: GuidanceElementFacts): ProvenanceResolution {
  if (facts.producedByModelThisSession === 'server side') {
    const identified = facts.agentRunId !== null && facts.decisionRecordId !== null
    return identified
      ? { classId: 'PROV-1', failedClosed: false }
      : { classId: 'PROV-6', failedClosed: true }
  }
  if (facts.producedByModelThisSession === 'on device') {
    return { classId: 'PROV-2', failedClosed: false }
  }
  if (facts.approvedContentAuthoredAndReleasedEarlier) {
    return { classId: 'PROV-3', failedClosed: false }
  }
  if (facts.packagedValueProducingAnOutcomeByComparison) {
    return { classId: 'PROV-4', failedClosed: false }
  }
  if (facts.namedPersonDecidedOrInstructed) {
    return { classId: 'PROV-5', failedClosed: false }
  }
  return { classId: 'PROV-6', failedClosed: false }
}

/**
 * Whether the contract's cell for this class and column permits the thing.
 *
 * `Allowed` and `Allowed with conditions` permit; everything else does not.
 * The three that do not are distinct refusals and none of them is a yes:
 * `Explicitly prohibited` (offered nowhere), `Not applicable` (there is
 * nothing to render), and `Client Decision Required` (undecided, so rendering
 * it would settle a question this build has no authority over).
 */
export function contractPermits(id: ProvenanceClassId, column: ContractColumn): boolean {
  const cell = provenanceClass(id)[column]
  return cell === 'Allowed' || cell.startsWith('Allowed with conditions')
}

/** The attribute a rendered provenance mark carries its class in. */
export const PROVENANCE_CLASS_ATTRIBUTE = 'data-provenance-class'

/**
 * The attribute an element declares itself a guidance element with. A caller
 * that marks a region as guidance and puts no class inside it is caught by
 * `provenanceViolations`; a caller that marks nothing is caught by nobody,
 * which is why `ProvenanceMark` is the only rendering path for a class.
 */
export const GUIDANCE_ELEMENT_ATTRIBUTE = 'data-guidance-element'

/**
 * Every way the rendered tree under `root` breaks `AC-42-401`, as sentences.
 * Empty means it holds. Sentences rather than a boolean because a lint that
 * says only "something is wrong" is a lint someone disables.
 */
export function provenanceViolations(root: ParentNode): readonly string[] {
  const violations: string[] = []
  const known: readonly string[] = PROVENANCE_CLASS_IDS
  const marks = [...root.querySelectorAll(`[${PROVENANCE_CLASS_ATTRIBUTE}]`)]

  for (const mark of marks) {
    const raw = mark.getAttribute(PROVENANCE_CLASS_ATTRIBUTE) ?? ''
    const declared = raw.split(/\s+/).filter(Boolean)
    if (declared.length !== 1 || !known.includes(declared[0]!)) {
      violations.push(
        `A guidance element declares "${raw}" as its provenance class. `
          + `AC-42-401's contract needs exactly one of ${known.join(', ')}.`,
      )
      continue
    }
    const nested = mark.querySelector(`[${PROVENANCE_CLASS_ATTRIBUTE}]`)
    if (nested !== null) {
      violations.push(
        `A ${declared[0]!} element contains a `
          + `${nested.getAttribute(PROVENANCE_CLASS_ATTRIBUTE) ?? '(none)'} element, so one `
          + 'guidance element carries two provenance classes.',
      )
    }
  }

  for (const element of root.querySelectorAll(`[${GUIDANCE_ELEMENT_ATTRIBUTE}]`)) {
    const carries =
      element.hasAttribute(PROVENANCE_CLASS_ATTRIBUTE)
      || element.querySelector(`[${PROVENANCE_CLASS_ATTRIBUTE}]`) !== null
    if (!carries) {
      violations.push(
        `A guidance element named "${element.getAttribute(GUIDANCE_ELEMENT_ATTRIBUTE) ?? ''}" `
          + 'carries no provenance class at all.',
      )
    }
  }

  return violations
}
