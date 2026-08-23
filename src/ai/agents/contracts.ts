import {
  FALLBACK_CONTRACT_OWNERS,
  type FallbackContractOwner,
} from '@/ai/fallbacks/registry'
import { resolveProvenance, type GuidanceElementFacts } from '@/ai/provenance/contract'
import type { ProvenanceClassId } from '@/ai/provenance/classes'
import { CHAPTER_44_MATRICES, type MatrixedAgentId } from './matrices'
import { AI_AGENT_ROSTER, aiRosterAgent, type AiAgentId, type AiRosterAgent } from './roster'

/**
 * THE FOUR AGENT DEGRADATION CONTRACTS — chapter 44, one section per agent.
 *
 * Each section says what happens when its agent fails: three named fallback
 * contracts, a terminal safe state per contract, and a role matrix saying who
 * may do what while it is degraded. Three sections carry a matrix; the fourth
 * carries none, and that is the point of this file existing rather than four
 * separate ones — the absence is only legible beside the three presences.
 *
 * ── WHAT IS NOT HERE, DELIBERATELY ─────────────────────────────────────────
 * The twelve `FB-AGT-*` contracts, their names and their locators are ALREADY
 * in `@/ai/fallbacks/registry`, registered by wave-0 task 6 from the register
 * at L95359-L95370. They are not written again here. Each contract below
 * DERIVES its three by filtering that registry on the section number, so
 * there is one copy of the twelve in the tree and a drift between two copies
 * is not a thing that can happen.
 *
 * The agents' identities, kinds, governance bindings and the Vision agent's
 * three stated absences are in `./roster` for the same reason, and each
 * contract holds an `agentId` rather than a second transcription.
 *
 * The three role matrices are in `./matrices`. What this file adds is the
 * binding from an agent to its matrix, and the statement of the fourth
 * agent's absence of one.
 *
 * ── WHAT IS HERE THAT IS NOWHERE ELSE ──────────────────────────────────────
 * The cross-matrix contradictions. Two acts are answered differently by
 * chapter 44 and by the Command Center module that owns the panel, and one of
 * them is answered four ways across four locations. `APP-012` delegated the
 * decision to the client, not the pretence that the source settled it, so
 * every reading renders and none is adopted. There is no field below in which
 * a reading could be marked "the answer".
 *
 * This module is data and two lookups. It decides nothing.
 */

/* ==================================================================== *
 * THE CONTRACTS.
 * ==================================================================== */

/** The four sections, in the source's order. */
export type AgentSection = '44.1' | '44.2' | '44.3' | '44.4'

export const AGENT_SECTIONS = ['44.1', '44.2', '44.3', '44.4'] as const satisfies readonly AgentSection[]

type MissingFromSections = Exclude<AgentSection, (typeof AGENT_SECTIONS)[number]>
const _sectionsExhaustive: MissingFromSections extends never ? true : never = true
void _sectionsExhaustive

/**
 * Whether the agent's section carries a role matrix. The absent arm carries
 * the reason AND how the absence was established, because a stated abstention
 * and an oversight look identical from outside.
 */
export type AgentRoleMatrixBinding =
  | { readonly kind: 'present'; readonly agentId: MatrixedAgentId; readonly headerRef: string }
  | {
      readonly kind: 'absent'
      readonly reason: string
      /** What was swept, and what the sweep found. Re-measured in the test. */
      readonly measurement: string
    }

export interface AgentDegradationContract {
  readonly agentId: AiAgentId
  readonly section: AgentSection
  /** The section heading's own line. */
  readonly sectionRef: string
  readonly roleMatrix: AgentRoleMatrixBinding
  /**
   * The provenance class a rendered degradation state for this agent emits.
   * Stated here because every task touching a rendered artificial-intelligence
   * element owes it, and RESOLVED rather than asserted — see
   * `degradationStateProvenance` below.
   */
  readonly degradationStateProvenance: ProvenanceClassId
}

/**
 * A degraded agent's state line is produced by no model, carries no approved
 * content, compares no packaged value and records no person's instruction.
 * `resolveProvenance` returns `PROV-6` for exactly those facts, which is the
 * class named "Artificial intelligence unavailable". The class is COMPUTED
 * from the facts rather than written down, so a change to the contract's
 * resolution order shows up here instead of leaving a stale literal behind.
 */
export const DEGRADED_AGENT_STATE_FACTS: GuidanceElementFacts = {
  producedByModelThisSession: null,
  approvedContentAuthoredAndReleasedEarlier: false,
  packagedValueProducingAnOutcomeByComparison: false,
  namedPersonDecidedOrInstructed: false,
  agentRunId: null,
  decisionRecordId: null,
}

export function degradationStateProvenance(): ProvenanceClassId {
  return resolveProvenance(DEGRADED_AGENT_STATE_FACTS).classId
}

/**
 * A MATRIX CELL IS NOT AN ARTIFICIAL-INTELLIGENCE OUTPUT AND MUST NOT BE
 * LABELLED ONE.
 *
 * Every cell rendered from `./matrices` is a packaged value producing an
 * outcome by comparison — the source's own table, compared against a role.
 * That resolves to `PROV-4`, "Deterministic rules". The absolute rule in the
 * common brief binds here in terms: a deterministic rule is never labelled
 * live artificial intelligence, in any locale, under any failure condition —
 * including a cell that happens to be describing an agent.
 */
export const MATRIX_CELL_FACTS: GuidanceElementFacts = {
  producedByModelThisSession: null,
  approvedContentAuthoredAndReleasedEarlier: false,
  packagedValueProducingAnOutcomeByComparison: true,
  namedPersonDecidedOrInstructed: false,
  agentRunId: null,
  decisionRecordId: null,
}

export function matrixCellProvenance(): ProvenanceClassId {
  return resolveProvenance(MATRIX_CELL_FACTS).classId
}

export const AGENT_DEGRADATION_CONTRACTS = [
  {
    agentId: 'prevention',
    section: '44.1',
    sectionRef: 'L91587',
    roleMatrix: { kind: 'present', agentId: 'prevention', headerRef: 'L91761' },
    degradationStateProvenance: 'PROV-6',
  },
  {
    agentId: 'deviation-and-containment',
    section: '44.2',
    sectionRef: 'L91821',
    roleMatrix: {
      kind: 'present',
      agentId: 'deviation-and-containment',
      headerRef: 'L92028',
    },
    degradationStateProvenance: 'PROV-6',
  },
  {
    agentId: 'shift-handoff',
    section: '44.3',
    sectionRef: 'L92087',
    roleMatrix: { kind: 'present', agentId: 'shift-handoff', headerRef: 'L92300' },
    degradationStateProvenance: 'PROV-6',
  },
  {
    agentId: 'vision-reasoning',
    section: '44.4',
    sectionRef: 'L92368',
    roleMatrix: {
      kind: 'absent',
      reason:
        'Section 44.4 carries no role matrix. It is the only one of the four agent sections ' +
        'with no permission table at all, and the absence is the source\'s, not an omission ' +
        'here. `SB-AI-006` (L86781) rules that a tenant sees nothing at all before the release ' +
        '— no entry in the Command Center agent activity panel, no Studio configuration ' +
        'surface, no capability in the Atomic Capability area — so this renders as the stated ' +
        'absence it is, never as an empty matrix and never as a greyed-out coming-soon agent.',
      measurement:
        'The whole of section 44.4 was swept, L92368 to the blank line before section 44A at '  +
        'L92596; its last line carrying anything is L92594. It carries sixty pipe-table lines and not one ' +
        'of them is a role header; `Explicitly prohibited`, `Allowed with conditions`, ' +
        '`Read-only` and `Not applicable` occur zero times in the span. The occurrences of ' +
        '`Allowed`, `Unavailable` and `Client Decision Required` that DO fall inside it belong ' +
        'to tables with no role axis — an Element/Content fallback card, a mermaid state ' +
        'diagram, and the six `DEC-VISION-*` status rows. The sweep is re-run against the ' +
        'frozen bytes in `tests/unit/ai-agent-contracts.test.ts` rather than trusted from here.',
    },
    degradationStateProvenance: 'PROV-6',
  },
] as const satisfies readonly AgentDegradationContract[]

type MissingContract = Exclude<AiAgentId, (typeof AGENT_DEGRADATION_CONTRACTS)[number]['agentId']>
const _everyAgentHasAContract: MissingContract extends never ? true : never = true
void _everyAgentHasAContract
type MissingSectionCovered = Exclude<
  AgentSection,
  (typeof AGENT_DEGRADATION_CONTRACTS)[number]['section']
>
const _everySectionCovered: MissingSectionCovered extends never ? true : never = true
void _everySectionCovered

export function agentDegradationContract(agentId: AiAgentId): AgentDegradationContract {
  const found = AGENT_DEGRADATION_CONTRACTS.find((c) => c.agentId === agentId)
  if (found === undefined) throw new Error(`No degradation contract for agent "${agentId}".`)
  return found
}

/** The roster record this contract is about. Never a second transcription. */
export function agentOf(contract: AgentDegradationContract): AiRosterAgent {
  return aiRosterAgent(AI_AGENT_ROSTER, contract.agentId)
}

/**
 * The three `FB-AGT-*` contracts this section owns, DERIVED from the wave-0
 * fallback registry on the section number. Nothing here restates an
 * identifier, a contract name or a locator.
 */
export function fallbackContractsOf(
  contract: AgentDegradationContract,
): readonly FallbackContractOwner[] {
  return FALLBACK_CONTRACT_OWNERS.filter((o) => o.chapter === contract.section)
}

/**
 * The matrix bound to this contract, or `null` where the section carries
 * none. `null` rather than an empty array: an empty array of rows is exactly
 * the empty matrix `SB-AI-006` forbids, and a caller that must distinguish
 * "no matrix" from "a matrix with nothing in it" cannot do it against `[]`.
 */
export function matrixOf(
  contract: AgentDegradationContract,
): (typeof CHAPTER_44_MATRICES)[number] | null {
  if (contract.roleMatrix.kind === 'absent') return null
  const binding = contract.roleMatrix
  return CHAPTER_44_MATRICES.find((m) => m.agentId === binding.agentId) ?? null
}

/* ==================================================================== *
 * THE CONTRADICTIONS, RENDERED RATHER THAN RESOLVED.
 * ==================================================================== */

export interface ContradictoryReading {
  /** Where this reading comes from, in the source's own naming. */
  readonly where: string
  /** The status token or the statement, verbatim. */
  readonly reading: string
  readonly sourceRef: string
  /**
   * WHICH CELL, BY COLUMN NAME AND THE HEADER THAT ORDERS IT. `null` for a
   * reading quoted from prose rather than from a matrix.
   *
   * THIS FIELD EXISTS BECAUSE TWO WEAKER VERSIONS OF IT WERE CAUGHT BY THEIR
   * OWN PLANTED DEFECTS, in that order:
   *
   *  - Checking only that the cited LINE contains the reading is nearly
   *    vacuous. Three readings here are the bare word `Allowed`, and L91767
   *    contains `Allowed` in the Worker column of a different row — so
   *    re-shipping both briefs' L91767-for-L91768 off-by-one walked straight
   *    past it.
   *  - Checking a bare column INDEX then hid a second error. `MOD-CC-08`'s
   *    axis runs Tenant Admin first and chapter 44's runs Worker first, and
   *    the Tenant Admin cell of L37669 was indexed as if it were chapter
   *    44's — position five instead of position two. Both cells happen to
   *    read `Explicitly prohibited`, so the index check passed on a
   *    coincidence of tokens.
   *
   * Naming the column and deriving the index from that matrix's OWN header
   * removes both. A column that the cited header does not carry is an error,
   * and the two orders can no longer be confused for each other.
   */
  readonly cell: { readonly headerRef: string; readonly column: string } | null
}

export interface CrossMatrixContradiction {
  readonly id: string
  /** The one act every reading is about, in plain words. */
  readonly question: string
  readonly readings: readonly ContradictoryReading[]
  /**
   * ALWAYS `null`. There is no field in which a reading could be marked the
   * answer, and this one is typed `null` rather than omitted so that a later
   * edit adding an answer is a type error rather than a quiet adoption.
   */
  readonly adopted: null
  /** What a screen says instead of choosing. */
  readonly disclosure: string
}

export const CROSS_MATRIX_CONTRADICTIONS = [
  {
    id: 'switch-an-agent-on-or-off',
    question:
      'May the Quality Manager switch an agent on or off, and where is the act performed?',
    readings: [
      {
        where: '§44.1, the Prevention Agent degradation matrix, Quality Manager column',
        reading: 'Allowed with conditions — a Studio action under authoring grants [SoW Fact — §6.9.1, §5.18]',
        sourceRef: 'L91769',
        cell: { headerRef: 'L91761', column: 'Quality Manager' },
      },
      {
        where:
          "MOD-CC-08's own matrix, Quality Manager column — worded \"Switch AN agent on or off\", and note the axis runs Tenant Admin first where chapter 44 runs Worker first",
        reading: 'Explicitly prohibited',
        sourceRef: 'L37671',
        cell: { headerRef: 'L37664', column: 'Quality Manager' },
      },
      {
        where: "MOD-CC-08's card prose, per-agent live status",
        reading:
          'switching an agent is a Standards and Operations Studio action, linked from here, never performed here',
        sourceRef: 'L37646',
        cell: null,
      },
    ],
    adopted: null,
    disclosure:
      'Two matrices answer one act with opposite tokens and the card prose answers a third ' +
      'question — WHERE, not WHETHER. Read together they are not in fact irreconcilable: both ' +
      'matrices agree the act is not performed on the Command Center panel. What they disagree ' +
      'about is whether the Quality Manager holds the grant at all. This build settles neither ' +
      'and renders all three, and the §44.1 cell draws a checked link to the Studio rather than ' +
      'a switch, which is the one rendering both readings and the prose permit.',
  },
  {
    id: 'tenant-admin-and-the-ai-degradation-state',
    question:
      'May the Tenant Admin see the artificial-intelligence degradation state, and on which surface?',
    readings: [
      {
        where: "MOD-CC-08's matrix, \"See agent health flags\", Tenant Admin column",
        reading: 'Explicitly prohibited',
        sourceRef: 'L37669',
        cell: { headerRef: 'L37664', column: 'Tenant Admin' },
      },
      {
        where:
          '§44.1, "See the honest degradation state", Tenant Admin column — and this is L91768, NOT the L91767 both briefs for this task give, which is "Dismiss guidance" and reads "Not applicable — dismissal is a run-player action" in that column',
        reading: 'Allowed',
        sourceRef: 'L91768',
        cell: { headerRef: 'L91761', column: 'Tenant Admin' },
      },
      {
        where:
          'SB-42-301, which names a FOURTH surface neither matrix mentions — the tenant administration area',
        reading:
          'Priya, as Tenant Admin, sees the same banner in the tenant administration area with the incident reference',
        sourceRef: 'L89348',
        cell: null,
      },
      {
        where:
          '§44.3, "See the brief\'s absence honestly stated", Tenant Admin column, against MOD-CC-12\'s "Read the current brief" which is `Explicitly prohibited` for the same role at L38483',
        reading: 'Allowed',
        sourceRef: 'L92309',
        cell: { headerRef: 'L92300', column: 'Tenant Admin' },
      },
    ],
    adopted: null,
    disclosure:
      'Four readings, one role, no reconciliation anywhere in the source. The role is not ' +
      'excluded from the surface — `@/routes/definitions` gives `SURF-CC` allowed roles ' +
      'including `TENANT_ADMIN` — so the question is per-capability rather than per-surface, ' +
      'and answering it by surface access would answer a question nobody asked. All four ' +
      'render, with their locators, as a client-delegated choice under `APP-012`.',
  },
] as const satisfies readonly CrossMatrixContradiction[]

export function crossMatrixContradiction(id: string): CrossMatrixContradiction {
  const found = CROSS_MATRIX_CONTRADICTIONS.find((c) => c.id === id)
  if (found === undefined) throw new Error(`No cross-matrix contradiction registered as "${id}".`)
  return found
}

/* ==================================================================== *
 * SEAMS THIS TASK LEAVES OPEN, AND WHO MUST CLOSE THEM.
 * ==================================================================== */

/**
 * A DECLARED SEAM NOBODY PICKS UP IS A DEFECT, so each one names its owner.
 *
 * These are not aspirations. Each is a thing this task established, could not
 * do inside its own path list, and would otherwise be discovered by a
 * reviewer instead of read here.
 */
export interface OpenSeam {
  readonly id: string
  readonly what: string
  /** The file or task that must close it. Never "someone". */
  readonly owner: string
}

export const OPEN_SEAMS = [
  {
    id: 'dec-handoff-not-in-the-canon',
    what:
      '`DEC-HANDOFF-001` and `DEC-HANDOFF-002` are carried in §44.3 matrix cells (L92306, ' +
      'L92307) and are NOT in `@/disclosure/decisions`. Their readings are held in ' +
      '`./matrices` as `CHAPTER_44_CELL_DECISIONS` so the two cells can render disabled with ' +
      'the identifier and every option, but a cell disclosure and a canon record are not the ' +
      'same thing and only the canon is surface-neutral. Adding them also means adding both ' +
      "ids to `tests/unit/surface-neutral.test.ts`'s literal lists, which is a membership gate " +
      'proved by adding. There is a second reason to be careful: `DEC-HANDOFF-001` asks two ' +
      'different questions under one identifier, chapter 30\'s at L61210 and chapter 44\'s at ' +
      'L92360, and the whole-document index at L115416 attributes it to chapter 30 alone — so ' +
      'a single canon record keyed on the bare identifier would answer §44.3 with chapter 30.',
    owner:
      '`src/disclosure/decisions.ts` and `tests/unit/surface-neutral.test.ts`, neither of which ' +
      'is on this task\'s path list. Wave 5 task 20 (registry closure) is the natural place.',
  },
  {
    id: 'affordance-fold-is-not-shared',
    what:
      '`chapter44Affordance` in `./matrices` is a second fold over the same question ' +
      '`frontlineAffordance` in `@/frontline/matrix` answers. It is separate because that one ' +
      'is scoped to one surface IN ITS TYPES (`Exclude<SurfaceId, \'SURF-FL\'>` on the ' +
      'cross-surface arm, `FrontlineSlug` on the named-place arm) while chapter 44\'s acts land ' +
      'on four surfaces, and because it carries neither the inverted-polarity nor the ' +
      'absence-of-control shape. Two folds over one question is how a rule gets fixed in one ' +
      'and not the other.',
    owner:
      '`src/frontline/matrix.ts`, not on this task\'s path list. Widening it to a ' +
      'surface-neutral fold that both consume is the right shape; until then the divergence is ' +
      'stated here rather than discovered.',
  },
  {
    id: 'nothing-renders-this-yet',
    what:
      'Neither module on this task\'s path list is reachable from `app/`. Both are data and ' +
      'folds with no component and no route, and this task may not add one — its path list ' +
      'holds two source files and two unit tests. This is an ABSTENTION, stated, because an ' +
      'abstention and an oversight look identical from outside.',
    owner:
      'Slice 11 wave 1 task 8 (`src/ui/shared/DeterministicBoundary.tsx`) and wave 2 task 10 ' +
      '(the `MOD-CC-08` overlay) are the declared consumers. If neither imports these modules, ' +
      'this object graph ships unreachable and wave 5 task 21 should catch it.',
  },
] as const satisfies readonly OpenSeam[]
