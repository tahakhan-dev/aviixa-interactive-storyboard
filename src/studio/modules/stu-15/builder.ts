import { STU_SEAMS, stuSeamById, stuSeamStatus, type StudioSeamDefinition } from '@/studio/seams'

/**
 * `MOD-STU-15`'s composition object, its three gates, and the only service
 * that moves one.
 *
 * ### THE TWO THINGS THAT MUST NOT BE CONFLATED (L33965)
 *
 * "The first is configuring the three standard agents through the
 * nine-section panel — every tenant does this. The second is composing a new
 * agent." Configuration is `MOD-STU-02` and `MOD-STU-05`. This file is only
 * the second.
 *
 * ### THE REGISTRY BOUNDARY, AND WHY IT IS AN ABSENCE
 *
 * L33971: "**The Agent Builder composes from the registry; it never adds to
 * it.** … **A tenant enables and composes; a tenant never authors an atom.**"
 * `AC-STU-128` (L34133): "No Studio path creates, edits, or deletes an atomic
 * capability." There is therefore no `authorAtom`, no `createCapability` and
 * no atom writer of any shape in this module — `MOD-STU-01`'s
 * `studioService.defineCapability` is the surface's one universal refusal and
 * is not duplicated here.
 *
 * ### REASONING AGENTS ONLY — ALSO AN ABSENCE
 *
 * L33990: "The launch builder composes **reasoning agents only** … **Action
 * agents … ship as platform-provided templates the tenant configures rather
 * than composes, because their blast radius requires platform-authored
 * evaluations.**" `AC-STU-131` (L34136). `composeReasoningAgent` takes no
 * agent-kind parameter, so there is no argument that could ask for an action
 * agent, and there is no `composeActionAgent` to call. A refusal function
 * would be a guard a refactor can delete; a missing function cannot be called
 * at all.
 *
 * ### THE EVALUATION GATE IS HARD, AND ITS BYPASS IS ALSO AN ABSENCE
 *
 * L34015: "Explicitly prohibited — the gate binds every operator including
 * the root account." So there is no `bypassEvaluationGate`, no `force` flag,
 * and no parameter on `submitToEvaluationGate` that could skip it. The state
 * machine says the same thing structurally: there is no edge from `Composed`
 * to `Deployed` (L34087).
 *
 * ### WHAT THIS FILE MAY NEVER CLAIM
 *
 * No evaluation is run here and none is simulated as run. Where the harness
 * is unreachable "the composition holds at Evaluation pending and is never
 * advanced on an assumption" (L34050), and where a result is unknown it is
 * "displayed as unknown" (L34129). Every gate outcome below is a SEEDED
 * FIXTURE read through a declared seam, and every reader carries the seam.
 *
 * DETERMINISM: no clock, no counter, no random source. Timestamps are data.
 */

/* ==================================================================== *
 * THE STATES — L34030, six, and there is no terminal state.
 * ==================================================================== */

export type ComposedAgentState =
  | 'Composed'
  | 'Evaluation pending'
  | 'Evaluation passed'
  | 'In approval'
  | 'Platform review'
  | 'Deployed'

export const COMPOSED_AGENT_STATES = [
  'Composed',
  'Evaluation pending',
  'Evaluation passed',
  'In approval',
  'Platform review',
  'Deployed',
] as const satisfies readonly ComposedAgentState[]

type MissingFromStates = Exclude<ComposedAgentState, (typeof COMPOSED_AGENT_STATES)[number]>
const _statesExhaustive: MissingFromStates extends never ? true : never = true
void _statesExhaustive

/**
 * `DEC-AGENTLC-001` (L33994), rendered as an ABSENCE rather than filled in.
 *
 * L34030: "Deprecation, disablement, and rollback states are
 * `DEC-AGENTLC-001`." The six states above are the whole set the source
 * gives, and **none of them is terminal** — `Deployed` has an edge to `[*]`
 * in the diagram but no state means "retired". This constant states that
 * absence on screen, because `AC-STU-135` (L34140) requires exactly that:
 * "Deprecation, disablement, and rollback are not implemented silently;
 * `DEC-AGENTLC-001` is surfaced."
 */
export const NO_TERMINAL_STATE_STATEMENT =
  'There is no terminal state for a composed agent, and none is invented here. The source names ' +
  'six states and stops; deprecation, disablement and rollback are DEC-AGENTLC-001, which is open. ' +
  'A composed reasoning agent that begins producing misleading briefs has no stated off switch ' +
  'short of the platform-wide emergency pause, which is a much blunter instrument.'

/* ==================================================================== *
 * THE THREE GATES — SB-STU-18's progress track.
 * ==================================================================== */

export type GovernanceGateId = 'evaluation' | 'tenant-approval-chain' | 'platform-review'

export const GOVERNANCE_GATE_IDS = [
  'evaluation',
  'tenant-approval-chain',
  'platform-review',
] as const satisfies readonly GovernanceGateId[]

type MissingFromGateIds = Exclude<GovernanceGateId, (typeof GOVERNANCE_GATE_IDS)[number]>
const _gateIdsExhaustive: MissingFromGateIds extends never ? true : never = true
void _gateIdsExhaustive

/**
 * FOUR VALUES, and `unknown` is the one that does the work. L34129: "Evaluation
 * results are never inferred; an unknown result is displayed as unknown." A
 * three-valued outcome would have to render an unreached gate as `pending`,
 * which claims a submission that never happened.
 */
export type GateOutcome = 'not-reached' | 'unknown' | 'passed' | 'failed'

export const GATE_OUTCOMES = [
  'not-reached',
  'unknown',
  'passed',
  'failed',
] as const satisfies readonly GateOutcome[]

type MissingFromOutcomes = Exclude<GateOutcome, (typeof GATE_OUTCOMES)[number]>
const _outcomesExhaustive: MissingFromOutcomes extends never ? true : never = true
void _outcomesExhaustive

export interface GovernanceGate {
  readonly id: GovernanceGateId
  readonly name: string
  /** Who decides it, in the source's own words. */
  readonly decidedBy: string
  readonly sourceRef: string
}

/**
 * "Three independent gates stand between a composition and production, and
 * every failure path returns to Composed rather than to a partially deployed
 * state" (L34094), in the order L33988 states them.
 */
export const GOVERNANCE_GATES = [
  {
    id: 'evaluation',
    name: 'Evaluation gate',
    decidedBy: 'The platform evaluation harness — hard, platform-wide, and binding on every operator including the root account',
    sourceRef: 'L33988 · L34043 · L34015',
  },
  {
    id: 'tenant-approval-chain',
    name: 'Author, Reviewer, Release chain',
    decidedBy: 'The tenant’s own approval chain, MOD-STU-11, with separation of duties enforced',
    sourceRef: 'L33988 · L34045',
  },
  {
    id: 'platform-review',
    name: 'Platform review',
    decidedBy: 'Platform operators in the Super Admin platform console. Every tenant role is explicitly prohibited',
    sourceRef: 'L33988 · L34047 · L34017',
  },
] as const satisfies readonly GovernanceGate[]

export interface GateRecord {
  readonly gate: GovernanceGateId
  readonly outcome: GateOutcome
  /** Data, never a clock read. `null` where the gate was not reached. */
  readonly at: string | null
  readonly decider: string | null
  /** Named failing scenarios, where the evaluation gate failed. Never a count. */
  readonly failingScenarios: readonly string[]
}

/* ==================================================================== *
 * THE COMPOSITION.
 * ==================================================================== */

/**
 * One atom of the platform registry, as this surface can see it.
 *
 * READ THROUGH THE SEAM, NEVER OWNED. The registry is `MOD-SA-02` /
 * `MOD-SA-11`'s (seam `atomic-capability-registry`), and it is read-only to
 * every tenant actor (L34120). The Super Admin console holds its own atom
 * fixtures under `app/super-admin/atom-registry/`, which a file under `src/`
 * may not value-import, so this is a seeded read-through of the same idea and
 * says so rather than pretending to be the register.
 */
export interface RegistryAtom {
  readonly atomId: string
  readonly name: string
  /** Whether the capability it belongs to is enabled for this tenant. */
  readonly enabled: boolean
}

export interface AgentMapping {
  readonly workflowName: string
  readonly screenId: string
  readonly trigger: string
}

export interface ComposedAgent {
  readonly id: string
  readonly name: string
  /**
   * ORDERED. "Each agent is an ordered composition of these capabilities"
   * (L33969) — an array, never a set, because the order is the composition.
   */
  readonly capabilities: readonly RegistryAtom[]
  readonly mappings: readonly AgentMapping[]
  readonly state: ComposedAgentState
  readonly gates: readonly GateRecord[]
  /** Data, never a clock read. `SB-STU-18`'s "last state change" column. */
  readonly lastStateChange: string
  readonly composedByIdentityId: string
}

export interface ComposedAgentRegister {
  readonly tenant: string
  readonly agents: readonly ComposedAgent[]
}

const NOT_REACHED = (gate: GovernanceGateId): GateRecord => ({
  gate,
  outcome: 'not-reached',
  at: null,
  decider: null,
  failingScenarios: [],
})

/**
 * The source's own illustrative composition (L34098): Elena composes
 * "Weekly Torque Trend Brief" from three enabled capabilities — retrieve
 * prior deviation cases, aggregate measurement distributions, and summarise
 * — mapped to Assembly — Wheel Bolt Torque Verification with a weekly
 * trigger.
 *
 * IT IS SEEDED AT `Composed`, NOT AT `Deployed`. The example ends deployed;
 * seeding it there would render three gate outcomes this build never
 * produced, on the surface where claiming a review happened does the most
 * damage. The gates are exercised by the service, from `Composed`, and every
 * outcome the screen shows is one the reader can watch being recorded.
 */
export const SEEDED_COMPOSED_AGENTS: ComposedAgentRegister = {
  tenant: 'TEN-BRIGHT-BIKES',
  agents: [
    {
      id: 'CMP-BB-WEEKLY-TORQUE-TREND',
      name: 'Weekly Torque Trend Brief',
      capabilities: [
        { atomId: 'ATOM-RETRIEVE-PRIOR-CASES', name: 'Retrieve prior deviation cases', enabled: true },
        {
          atomId: 'ATOM-AGGREGATE-MEASUREMENTS',
          name: 'Aggregate measurement distributions',
          enabled: true,
        },
        { atomId: 'ATOM-SUMMARISE', name: 'Summarise', enabled: true },
      ],
      mappings: [
        {
          workflowName: 'Assembly — Wheel Bolt Torque Verification',
          screenId: 'screen 3',
          trigger: 'Weekly',
        },
      ],
      state: 'Composed',
      gates: GOVERNANCE_GATE_IDS.map(NOT_REACHED),
      lastStateChange: '2026-06-21',
      composedByIdentityId: 'IDN-BB-ELENA',
    },
  ],
}

export function composedAgents(register: ComposedAgentRegister): readonly ComposedAgent[] {
  return register.agents
}

export function composedAgentById(
  register: ComposedAgentRegister,
  id: string,
): ComposedAgent | null {
  return register.agents.find((a) => a.id === id) ?? null
}

/**
 * The running validity panel `SB-STU-18` asks for: "a running validity panel
 * naming any capability that is not enabled". Names them; never counts them.
 */
export function disabledCapabilitiesOf(agent: ComposedAgent): readonly string[] {
  return agent.capabilities.filter((c) => !c.enabled).map((c) => c.name)
}

/* ==================================================================== *
 * THE DISABLEMENT HONESTY RULE.
 * ==================================================================== */

/**
 * `AC-STU-130` (L34135) restates `FUNC-STU-15-01-A-2` (L34037): "disabling
 * never alters a pinned package, so a disabled capability continues to
 * execute on in-flight Runs until they finish, **which must be stated
 * plainly rather than hidden**."
 */
export const DISABLEMENT_HONESTY_LINE =
  'Disabling a capability never alters an already-pinned package. A pinned package carries what it ' +
  'carried, so a disabled capability continues to execute on in-flight Runs until they finish. ' +
  'What disablement does change is authoring: the configuration surface is removed and publication ' +
  'of any dependent Workflow is blocked with the dependent screens named.'

/* ==================================================================== *
 * THE ONE SERVICE, AND ITS ONE AUDIT PATH.
 * ==================================================================== */

export type BuilderAction = 'compose' | 'submit' | 'map' | 'deploy'

export const BUILDER_ACTIONS = [
  'compose',
  'submit',
  'map',
  'deploy',
] as const satisfies readonly BuilderAction[]

type MissingFromActions = Exclude<BuilderAction, (typeof BUILDER_ACTIONS)[number]>
const _actionsExhaustive: MissingFromActions extends never ? true : never = true
void _actionsExhaustive

export interface BuilderAuditEntry {
  /** Identity and action, never "acting as role" (L33389, L34657). */
  readonly actorIdentityId: string
  readonly action: BuilderAction
  readonly agentId: string
  readonly detail: string
  readonly sourceRefs: readonly string[]
}

export type BuilderAuditWrite = (
  entry: BuilderAuditEntry,
) => { readonly ok: true } | { readonly ok: false; readonly failure: string }

export interface BuilderResult {
  readonly ok: boolean
  /** The NEW register on success; the ORIGINAL, untouched, on every refusal. */
  readonly register: ComposedAgentRegister
  readonly message: string
  readonly agent: ComposedAgent | null
}

const AUDIT_REFS = ['L34123', 'FB-STU-10 L31453'] as const

function refuse(
  register: ComposedAgentRegister,
  message: string,
): BuilderResult {
  return { ok: false, register, message, agent: null }
}

/**
 * FB-STU-10, the strictest of the ten fallback contracts: an action that
 * cannot be audited does not happen, and there is no first fallback that
 * permits it to proceed unaudited.
 *
 * A sink that throws must not propagate: a caller catching an exception
 * around this would have to guess what happened, and "an exception escaped,
 * so the write went through" is the fail-open direction.
 */
function audited(
  writeAudit: BuilderAuditWrite,
  entry: BuilderAuditEntry,
): { readonly ok: boolean; readonly failure: string | null } {
  try {
    const result = writeAudit(entry)
    return result.ok ? { ok: true, failure: null } : { ok: false, failure: result.failure }
  } catch (error) {
    return { ok: false, failure: error instanceof Error ? error.message : String(error) }
  }
}

function replace(
  register: ComposedAgentRegister,
  next: ComposedAgent,
): ComposedAgentRegister {
  return {
    ...register,
    agents: register.agents.map((a) => (a.id === next.id ? next : a)),
  }
}

function withGate(agent: ComposedAgent, record: GateRecord): readonly GateRecord[] {
  return agent.gates.map((g) => (g.gate === record.gate ? record : g))
}

export interface ComposeInput {
  readonly register: ComposedAgentRegister
  readonly actorIdentityId: string
  readonly agentId: string
  readonly name: string
  readonly capabilities: readonly RegistryAtom[]
  /** Data, never a clock read. */
  readonly at: string
  /**
   * The evaluator's answer for the compose row, resolved by the caller.
   * `false` refuses before anything is written or audited, because a refused
   * action is not an action.
   */
  readonly permitted: boolean
  readonly refusalReason: string
}

/**
 * THERE IS NO `kind` PARAMETER AND THERE IS NO SIBLING FUNCTION. An action
 * agent cannot be asked for, because nothing in this signature can express
 * one and no other composer exists. `AC-STU-131`, structurally.
 */
export function composeReasoningAgent(
  input: ComposeInput,
  writeAudit: BuilderAuditWrite,
): BuilderResult {
  const unchanged = input.register
  if (!input.permitted) return refuse(unchanged, input.refusalReason)

  const disabled = input.capabilities.filter((c) => !c.enabled).map((c) => c.name)
  if (disabled.length > 0) {
    return refuse(
      unchanged,
      `“${input.name}” cannot be composed: ${disabled.join(', ')} ${
        disabled.length === 1 ? 'is' : 'are'
      } not enabled for this tenant. The running validity panel names every capability that is not ` +
        'enabled rather than reporting a count. Nothing was written.',
    )
  }

  const attempt = audited(writeAudit, {
    actorIdentityId: input.actorIdentityId,
    action: 'compose',
    agentId: input.agentId,
    detail: `compose reasoning agent “${input.name}” from ${input.capabilities
      .map((c) => c.atomId)
      .join(' → ')}`,
    sourceRefs: [...AUDIT_REFS, 'L34043'],
  })
  if (!attempt.ok) {
    return refuse(
      unchanged,
      `The audit entry could not be written (${attempt.failure ?? 'no reason given'}), so the ` +
        'composition did not happen. FB-STU-10: an action that cannot be audited does not happen, ' +
        'and there is no first fallback that permits it to proceed unaudited.',
    )
  }

  const agent: ComposedAgent = {
    id: input.agentId,
    name: input.name,
    capabilities: input.capabilities,
    mappings: [],
    state: 'Composed',
    gates: GOVERNANCE_GATE_IDS.map(NOT_REACHED),
    lastStateChange: input.at,
    composedByIdentityId: input.actorIdentityId,
  }
  return {
    ok: true,
    register: { ...unchanged, agents: [...unchanged.agents, agent] },
    message: `“${input.name}” is Composed. It reaches production only after the evaluation gate, the tenant approval chain, and platform review, in that order.`,
    agent,
  }
}

/** Whether the platform evaluation harness can be reached at all. */
export type HarnessReachability = 'reachable' | 'unreachable'

export interface SubmitInput {
  readonly register: ComposedAgentRegister
  readonly actorIdentityId: string
  readonly agentId: string
  readonly at: string
  readonly permitted: boolean
  readonly refusalReason: string
  readonly harness: HarnessReachability
  /**
   * The harness's seeded verdict, read through the `evaluation-harness` seam.
   * Consulted ONLY where the harness is reachable — an unreachable harness
   * has no verdict, and taking one from a fixture anyway is precisely
   * "advanced on an assumption".
   */
  readonly verdict?: { readonly passed: boolean; readonly failingScenarios: readonly string[] }
}

/**
 * L34050's `FB-STU-08` difference, verbatim: "where the harness is
 * unreachable, the composition holds at Evaluation pending and is never
 * advanced on an assumption."
 *
 * So an unreachable harness produces `Evaluation pending` with a gate record
 * of `unknown` — not `failed`, which would be a verdict nobody gave, and not
 * `passed`, which would be the fail-open direction.
 */
export function submitToEvaluationGate(
  input: SubmitInput,
  writeAudit: BuilderAuditWrite,
): BuilderResult {
  const unchanged = input.register
  if (!input.permitted) return refuse(unchanged, input.refusalReason)

  const agent = composedAgentById(unchanged, input.agentId)
  if (agent === null) {
    return refuse(unchanged, `No composed agent “${input.agentId}” exists in this workspace.`)
  }
  if (agent.state !== 'Composed') {
    return refuse(
      unchanged,
      `“${agent.name}” is at ${agent.state}. Submission to the evaluation gate is an act on a composition at Composed; nothing was written.`,
    )
  }

  const attempt = audited(writeAudit, {
    actorIdentityId: input.actorIdentityId,
    action: 'submit',
    agentId: agent.id,
    detail: `submit “${agent.name}” to the evaluation harness (${input.harness})`,
    sourceRefs: [...AUDIT_REFS, 'L34050'],
  })
  if (!attempt.ok) {
    return refuse(
      unchanged,
      `The audit entry could not be written (${attempt.failure ?? 'no reason given'}), so the submission did not happen. FB-STU-10.`,
    )
  }

  if (input.harness === 'unreachable') {
    const held: ComposedAgent = {
      ...agent,
      state: 'Evaluation pending',
      lastStateChange: input.at,
      gates: withGate(agent, {
        gate: 'evaluation',
        outcome: 'unknown',
        at: input.at,
        decider: null,
        failingScenarios: [],
      }),
    }
    return {
      ok: true,
      register: replace(unchanged, held),
      message: `The evaluation harness is unreachable, so “${agent.name}” holds at Evaluation pending and is never advanced on an assumption. The result is displayed as unknown rather than inferred.`,
      agent: held,
    }
  }

  const verdict = input.verdict
  if (verdict === undefined) {
    return refuse(
      unchanged,
      `The harness reported no verdict for “${agent.name}”. An unknown result is displayed as unknown and never inferred, so nothing advanced.`,
    )
  }

  const next: ComposedAgent = verdict.passed
    ? {
        ...agent,
        state: 'Evaluation passed',
        lastStateChange: input.at,
        gates: withGate(agent, {
          gate: 'evaluation',
          outcome: 'passed',
          at: input.at,
          decider: 'The platform evaluation harness',
          failingScenarios: [],
        }),
      }
    : {
        // "Failure at the evaluation gate returns the composition to Composed
        // with the failing scenarios named" (L34030). Back to Composed, never
        // to a partially deployed state.
        ...agent,
        state: 'Composed',
        lastStateChange: input.at,
        gates: withGate(agent, {
          gate: 'evaluation',
          outcome: 'failed',
          at: input.at,
          decider: 'The platform evaluation harness',
          failingScenarios: verdict.failingScenarios,
        }),
      }

  return {
    ok: true,
    register: replace(unchanged, next),
    message: verdict.passed
      ? `“${agent.name}” passed the evaluation gate and enters the tenant approval chain.`
      : `“${agent.name}” failed the evaluation gate and returns to Composed. Failing scenarios: ${verdict.failingScenarios.join(', ')}. No partial deployment occurred.`,
    agent: next,
  }
}

export interface MapInput {
  readonly register: ComposedAgentRegister
  readonly actorIdentityId: string
  readonly agentId: string
  readonly mapping: AgentMapping
  readonly at: string
  readonly permitted: boolean
  readonly refusalReason: string
}

/**
 * `FUNC-STU-15-02-A-3` (L34045) — map the agent to Workflows, screens and
 * triggers.
 *
 * THE AUDIT APPEND IS BEFORE THE MUTATION, AND THIS HANDLER ACTUALLY
 * MUTATES. That ordering is demonstrated here rather than on a handler that
 * changes nothing, because this build has shipped an audit path wired to the
 * one handler of four that mutated nothing — proving the contract exactly
 * where it cost nothing.
 */
export function mapComposedAgent(input: MapInput, writeAudit: BuilderAuditWrite): BuilderResult {
  const unchanged = input.register
  if (!input.permitted) return refuse(unchanged, input.refusalReason)

  const agent = composedAgentById(unchanged, input.agentId)
  if (agent === null) {
    return refuse(unchanged, `No composed agent “${input.agentId}” exists in this workspace.`)
  }

  const attempt = audited(writeAudit, {
    actorIdentityId: input.actorIdentityId,
    action: 'map',
    agentId: agent.id,
    detail: `map “${agent.name}” to ${input.mapping.workflowName} / ${input.mapping.screenId} on ${input.mapping.trigger}`,
    sourceRefs: [...AUDIT_REFS, 'L34045'],
  })
  if (!attempt.ok) {
    return refuse(
      unchanged,
      `The audit entry could not be written (${attempt.failure ?? 'no reason given'}), so the mapping did not happen and “${agent.name}” carries no new mapping. FB-STU-10: an action that cannot be audited does not happen.`,
    )
  }

  const next: ComposedAgent = {
    ...agent,
    mappings: [...agent.mappings, input.mapping],
    lastStateChange: input.at,
  }
  return {
    ok: true,
    register: replace(unchanged, next),
    message: `“${agent.name}” is mapped to ${input.mapping.workflowName} / ${input.mapping.screenId} on ${input.mapping.trigger}.`,
    agent: next,
  }
}

export interface DeployInput {
  readonly register: ComposedAgentRegister
  readonly actorIdentityId: string
  readonly agentId: string
  readonly at: string
  readonly permitted: boolean
  readonly refusalReason: string
}

/**
 * `AC-STU-132` (L34137): "A composed agent reaches production only after the
 * evaluation gate, the tenant approval chain, and platform review, in that
 * order."
 *
 * THE ORDER IS CHECKED OVER THE GATE RECORDS, NOT OVER THE STATE NAME. A
 * state name can be set; a gate record has to have been written by the gate
 * that owns it. `TEST-STU-132` attempts deployment of a composition that
 * failed the evaluation gate, and this is where it is refused.
 */
export function deployComposedAgent(
  input: DeployInput,
  writeAudit: BuilderAuditWrite,
): BuilderResult {
  const unchanged = input.register
  if (!input.permitted) return refuse(unchanged, input.refusalReason)

  const agent = composedAgentById(unchanged, input.agentId)
  if (agent === null) {
    return refuse(unchanged, `No composed agent “${input.agentId}” exists in this workspace.`)
  }

  const unpassed = GOVERNANCE_GATE_IDS.filter(
    (id) => agent.gates.find((g) => g.gate === id)?.outcome !== 'passed',
  )
  if (unpassed.length > 0) {
    const names = unpassed
      .map((id) => GOVERNANCE_GATES.find((g) => g.id === id)?.name ?? id)
      .join(', ')
    return refuse(
      unchanged,
      `“${agent.name}” cannot be deployed: ${names} ${unpassed.length === 1 ? 'has' : 'have'} not ` +
        'been passed. A composed agent reaches production only after the evaluation gate, the ' +
        'tenant approval chain, and platform review, in that order, and there is no edge from ' +
        'Composed to Deployed for any operator including the root account. Nothing was written.',
    )
  }

  const attempt = audited(writeAudit, {
    actorIdentityId: input.actorIdentityId,
    action: 'deploy',
    agentId: agent.id,
    detail: `deploy “${agent.name}” in the tenant workspace`,
    sourceRefs: [...AUDIT_REFS, 'L34137'],
  })
  if (!attempt.ok) {
    return refuse(
      unchanged,
      `The audit entry could not be written (${attempt.failure ?? 'no reason given'}), so the deployment did not happen. FB-STU-10.`,
    )
  }

  const next: ComposedAgent = { ...agent, state: 'Deployed', lastStateChange: input.at }
  return {
    ok: true,
    register: replace(unchanged, next),
    message: `“${agent.name}” is Deployed in the tenant workspace. It produces an artifact and changes no state, which is why it was composable at all.`,
    agent: next,
  }
}

/**
 * The whole service, as one object, so that "there is no bypass" is a
 * property a test can read off the export rather than a claim in a comment.
 *
 * FOUR KEYS. Anything a reader might expect and not find here — an action
 * agent composer, a gate bypass, an atom author, a platform reviewer, a
 * disable switch — is absent on purpose, and each absence has a locator in
 * this file's header or in `DEC-AGENTLC-001`.
 */
export const agentBuilderService = {
  composeReasoningAgent,
  submitToEvaluationGate,
  mapComposedAgent,
  deployComposedAgent,
} as const

/* ==================================================================== *
 * THE SEAMS THIS MODULE READS.
 * ==================================================================== */

export interface BuilderSeamReading {
  readonly seam: StudioSeamDefinition
  readonly status: ReturnType<typeof stuSeamStatus>
  /** What this screen does while the far side cannot answer. */
  readonly whileUnanswered: string
}

/**
 * Three, and the third is the one that matters. The composed-agent platform
 * review QUEUE is named in the source (L67927) with **no `MOD-SA-*`
 * identifier attached to it anywhere**, so its seam carries no owning slice
 * and renders "owner stated, no slice assigned". The REVIEW itself is
 * scheduled to `SURF-SA` in slice 12; the two are separate rows precisely so
 * the queue does not inherit the review's slice.
 */
export function builderSeams(
  seams: readonly StudioSeamDefinition[] = STU_SEAMS,
): readonly BuilderSeamReading[] {
  return [
    {
      seam: stuSeamById(seams, 'atomic-capability-registry'),
      whileUnanswered:
        'Capabilities outside entitlement are shown as unavailable with a stated reason, never silently absent. No atom is authored here by any path.',
    },
    {
      seam: stuSeamById(seams, 'evaluation-harness'),
      whileUnanswered:
        'The composition holds at Evaluation pending, the gate outcome displays as unknown, and nothing is advanced on an assumption.',
    },
    {
      seam: stuSeamById(seams, 'composed-agent-platform-review-queue'),
      whileUnanswered:
        'The composition holds at Platform review. No Studio route performs the review, and no outcome is inferred while the queue cannot answer.',
    },
  ].map((r) => ({ ...r, status: stuSeamStatus(r.seam) }))
}
