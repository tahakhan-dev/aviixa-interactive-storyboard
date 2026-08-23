/**
 * THE AGENT ROSTER, FOR EVERY SURFACE.
 *
 * Chapter 44 rosters the agents this platform governs. Its table's data rows
 * are L91463-L91466; L91461 is the header and L91462 the separator, and the
 * distinction is not pedantry — the dispatch brief for this file cited
 * L91461-L91464 for a four-agent roster, which is header, separator and two
 * agents, and puts the fourth agent outside the span cited for it. The rows
 * are counted, never inferred from a span, and `tests/unit/ai-roster.test.ts`
 * re-derives their positions from the frozen bytes rather than trusting the
 * numbers written here.
 *
 * ── WHY THIS LIVES OUTSIDE THE STUDIO ──────────────────────────────────────
 * `src/studio/modules/stu-02/agents.ts` held the agent identities and the
 * governance-binding vocabulary inside a Studio module directory. Both are
 * cross-surface truths: the Command Center renders agent health, the platform
 * console renders agent records, the Frontline surface renders what an agent
 * did or could not do. The Studio's own view — which parameters `MOD-STU-02`
 * must supply for each agent, and where each is authored — stays where it is,
 * because that IS Studio-specific. What moved here is the identity set, the
 * kind, and the governance-binding vocabulary.
 *
 * ── THE ROSTER IS FOUR, AND THE STUDIO'S TABLE IS THREE ────────────────────
 * They are two different tables about overlapping subjects, not one table
 * transcribed twice. Chapter 20's table (rows L31707-L31709) has columns for
 * what the Studio must supply and where it is configured; chapter 44's has
 * columns for governance, availability and failure impact. L91459 states the
 * relation plainly: three pre-built agents at V1 and one later. The later one
 * is the Vision Reasoning Agent, and it is here because a surface that renders
 * agent state must be able to say what it is NOT rendering.
 *
 * ── THE VISION AGENT IS THREE ABSENCES, ALL STATED ─────────────────────────
 * Its governance cell says the governance is not specified beyond the roster
 * entry. Its availability cell puts it in a later release. And it has no role
 * matrix anywhere in the source: section 44.4 is the only one of the four
 * agent sections carrying no permission table at all, which is swept and
 * measured in the covering test rather than asserted here. `SB-AI-006`
 * (L86781) rules that the platform must not display a greyed-out coming-soon
 * agent, so the record renders as a stated absence with its reason and never
 * as an empty matrix or a disabled row.
 *
 * This module is data and one lookup. It computes nothing and decides nothing.
 */

export type AiAgentId =
  | 'prevention'
  | 'deviation-and-containment'
  | 'shift-handoff'
  | 'vision-reasoning'

export const AI_AGENT_IDS = [
  'prevention',
  'deviation-and-containment',
  'shift-handoff',
  'vision-reasoning',
] as const satisfies readonly AiAgentId[]

type MissingFromAgentIds = Exclude<AiAgentId, (typeof AI_AGENT_IDS)[number]>
const _agentIdsExhaustive: MissingFromAgentIds extends never ? true : never = true
void _agentIdsExhaustive

/**
 * L31690: a reasoning agent produces an analytical artifact and changes no
 * state, so it carries no per-event approval gate; an action agent changes
 * state or reaches a worker, and acts only under governance.
 */
export type AgentKind = 'action agent' | 'reasoning agent'

/* ==================================================================== *
 * THE GOVERNANCE-BINDING VOCABULARY, AND ITS ALIAS PAIR.
 * ==================================================================== */

/**
 * The governance-binding field's three declared values. L88109 declares them
 * as a set, and it is the strongest statement of the vocabulary in the source:
 * which of pre-authorised policy and a runtime gate an action agent is bound
 * to is declared on the agent record itself, in the governance-binding field.
 *
 * The three-valued field is not a convenience. L31692 forbids the Studio to
 * present pre-authorised policy as though it were a runtime human gate, and a
 * boolean `gated` would render the Prevention Agent's authoring-time approval
 * and the Deviation and Containment Agent's runtime gate identically — which
 * is exactly the misrepresentation that sentence forbids.
 */
export type GovernanceBinding =
  | 'authoring-time policy'
  | 'runtime human gate'
  | 'none — reasoning agent'

export const GOVERNANCE_BINDINGS = [
  'authoring-time policy',
  'runtime human gate',
  'none — reasoning agent',
] as const satisfies readonly GovernanceBinding[]

type MissingFromBindings = Exclude<GovernanceBinding, (typeof GOVERNANCE_BINDINGS)[number]>
const _bindingsExhaustive: MissingFromBindings extends never ? true : never = true
void _bindingsExhaustive

/**
 * THE THIRD VALUE IS SPELLED TWO WAYS AND BOTH ARE THE SOURCE'S.
 *
 * Measured whole-file: the canonical spelling occurs on twenty-one lines and
 * the alias spelling on four. Neither is a typo and neither is a correction of
 * the other — the alias is how chapter 20's own table writes the Shift Handoff
 * Agent's type cell (L31709), and the canonical is how the field's declaration
 * writes its declared values (L88109). So this is an alias pair on the pattern
 * `src/disclosure/decisions.ts` already uses for a decision asked under two
 * identifiers: register one canonical, keep the other, render both, pin both
 * locator sets.
 *
 * AND THE ALIAS IS LOAD-BEARING IN THIS TREE, which was checked rather than
 * assumed. `src/studio/modules/stu-02/agents.ts` ships the alias spelling and
 * `tests/unit/stu-agents.test.ts` asserts it verbatim; `app/super-admin/`'s
 * core-agents screen independently declares the canonical spelling. Two files
 * that do not know about each other ship one value under two literals, and a
 * verbatim-string check written against either fails on the other. Deleting
 * the alias would have gone red somewhere no reader of this file was looking.
 *
 * The locator sets are exhaustive, not illustrative: they are every line in
 * the frozen source carrying each spelling, and the covering test asserts that
 * each line carries the spelling it is pinned for and not the other.
 */
export interface GovernanceBindingAliasPair {
  readonly canonical: GovernanceBinding
  readonly alias: string
  /** Every frozen-source line carrying the canonical spelling. */
  readonly canonicalLocators: readonly string[]
  /** Every frozen-source line carrying the alias spelling. */
  readonly aliasLocators: readonly string[]
  /** Why one is canonical, in the words a screen can render. */
  readonly criterion: string
}

export const GOVERNANCE_BINDING_ALIAS = {
  canonical: 'none — reasoning agent',
  alias: 'no governance gate',
  canonicalLocators: [
    'L9678',
    'L21514',
    'L21616',
    'L22650',
    'L22678',
    'L22721',
    'L25280',
    'L37041',
    'L43293',
    'L43339',
    'L47790',
    'L69406',
    'L86588',
    'L87235',
    'L88109',
    'L88125',
    'L89490',
    'L91465',
    'L91468',
    'L110541',
    'L113201',
  ],
  aliasLocators: ['L9244', 'L31709', 'L86584', 'L92123'],
  criterion:
    'Both spellings are the frozen source’s own words for one value. The canonical is the ' +
    'spelling the governance-binding field’s own declaration uses and the spelling the source ' +
    'uses on far more lines; the alias is the spelling chapter 20’s agent table uses and the ' +
    'spelling this build already shipped. Neither is corrected, because a check written against ' +
    'one literal fails on the other, and a client searching on the discarded spelling would find ' +
    'nothing.',
} as const satisfies GovernanceBindingAliasPair

/**
 * The one value either spelling names, or `null` for a string that is neither.
 *
 * `null` rather than a thrown error or a fallback member: a resolver that maps
 * an unknown spelling onto some member invents a governance position, and this
 * is the field the source forbids misrepresenting.
 */
export function canonicalGovernanceBinding(spelling: string): GovernanceBinding | null {
  if (spelling === GOVERNANCE_BINDING_ALIAS.alias) return GOVERNANCE_BINDING_ALIAS.canonical
  return (GOVERNANCE_BINDINGS as readonly string[]).includes(spelling)
    ? (spelling as GovernanceBinding)
    : null
}

/* ==================================================================== *
 * THE ROSTER — chapter 44's four data rows, L91463-L91466.
 * ==================================================================== */

export interface AiRosterAgent {
  readonly id: AiAgentId
  /** Column 1, verbatim. */
  readonly name: string
  /** Column 2, verbatim. */
  readonly typeWording: string
  readonly kind: AgentKind
  /** Column 3, verbatim. */
  readonly governanceWording: string
  /**
   * The vocabulary member the governance cell declares, or `null` where the
   * source declares none. `null` is the Vision agent and is rendered as the
   * stated absence it is; inventing a binding here would read as a contract.
   */
  readonly governanceBinding: GovernanceBinding | null
  /** The source's own words for the absence, or `null` where there is none. */
  readonly governanceAbsence: string | null
  /** Column 4, verbatim. */
  readonly availabilityAtV1: string
  readonly availableAtV1: boolean
  /** Column 5, verbatim. */
  readonly failureImpactClass: string
  /**
   * Why this agent has no role matrix, or `null` where it has one. A surface
   * asking for a matrix and finding nothing must be able to tell a stated
   * absence from an oversight, and from outside they look identical.
   */
  readonly roleMatrixAbsence: string | null
  /** The roster row this record transcribes. */
  readonly sourceRef: string
}

export const AI_AGENT_ROSTER = [
  {
    id: 'prevention',
    name: 'Prevention Agent',
    typeWording: 'Action',
    kind: 'action agent',
    governanceWording:
      'Governance binding `authoring-time policy` — pre-authorised, Studio-authored policy (§3.7), recorded in the console as "action, gated" (§8.3.3); no per-event runtime gate, adopted under `DEC-GATE-001`',
    governanceBinding: 'authoring-time policy',
    governanceAbsence: null,
    availabilityAtV1: 'Available',
    availableAtV1: true,
    failureImpactClass: 'Guidance quality degrades; the authored Work Instructions remain',
    roleMatrixAbsence: null,
    sourceRef: 'L91463',
  },
  {
    id: 'deviation-and-containment',
    name: 'Deviation and Containment Agent',
    typeWording: 'Action',
    kind: 'action agent',
    governanceWording:
      'Governance binding `runtime human gate` — pre-authorised containment needs none; human-gated where it proposes beyond policy (§3.7, §6.6.1)',
    governanceBinding: 'runtime human gate',
    governanceAbsence: null,
    availabilityAtV1: 'Available',
    availableAtV1: true,
    failureImpactClass:
      'Brief assembly degrades; detection, classification, hold and containment checklist are untouched',
    roleMatrixAbsence: null,
    sourceRef: 'L91464',
  },
  {
    id: 'shift-handoff',
    name: 'Shift Handoff Agent',
    typeWording: 'Reasoning',
    kind: 'reasoning agent',
    governanceWording:
      'Governance binding `none — reasoning agent`; produces an artifact and changes no state (§3.7, §5.2.3)',
    governanceBinding: 'none — reasoning agent',
    governanceAbsence: null,
    availabilityAtV1: 'Available',
    availableAtV1: true,
    failureImpactClass: 'The brief is absent or partial; no operational state is affected',
    roleMatrixAbsence: null,
    sourceRef: 'L91465',
  },
  {
    id: 'vision-reasoning',
    name: 'Vision Reasoning Agent',
    typeWording: 'Reasoning at the roster level (§8.3.3)',
    kind: 'reasoning agent',
    governanceWording: 'Not specified beyond the roster entry',
    governanceBinding: null,
    governanceAbsence: 'Not specified beyond the roster entry',
    availabilityAtV1: 'Later release, with the vision atoms',
    availableAtV1: false,
    failureImpactClass:
      'Inspection reverts to human inspection; a failed inference is never a pass',
    roleMatrixAbsence:
      'No role matrix exists for this agent anywhere in the frozen source. Section 44.4 is the ' +
      'only one of the four agent sections with no permission table at all, and the whole of it ' +
      'was swept for permission tokens and carries none. This renders as the stated absence it ' +
      'is: never as an empty matrix, and never as a greyed-out coming-soon agent, which SB-AI-006 ' +
      '(L86781) forbids in terms because a placeholder pollutes a surface whose value is that ' +
      'everything on it is real.',
    sourceRef: 'L91466',
  },
] as const satisfies readonly AiRosterAgent[]

type MissingFromRoster = Exclude<AiAgentId, (typeof AI_AGENT_ROSTER)[number]['id']>
const _rosterExhaustive: MissingFromRoster extends never ? true : never = true
void _rosterExhaustive

export function aiRosterAgent(
  roster: readonly AiRosterAgent[],
  id: AiAgentId,
): AiRosterAgent {
  const found = roster.find((a) => a.id === id)
  if (found === undefined) throw new Error(`The agent roster holds no agent named "${id}".`)
  return found
}
