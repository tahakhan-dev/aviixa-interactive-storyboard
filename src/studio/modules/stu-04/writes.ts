import type { TenantId } from '@/domain/ids'
import { permitsAction } from '@/policy/decision'
import type { StudioAccessDecision } from '@/studio/access/evaluate'
import type { InheritableDefault, WorkflowSetting } from '@/studio/vocab/authoring'
import {
  PLATFORM_DEVIATION_CAPTURE_SCREEN,
  drawnOrder,
  isPackagedTarget,
  nodeById,
  structureFingerprint,
  type DrawnBranch,
  type InheritableDefaultValue,
  type StructuralFinding,
  type StructuralValidation,
  type WorkflowDraft,
  type WorkflowScreenNode,
  type WorkflowSettingValue,
} from './workflow'

/**
 * EVERY WRITE `MOD-STU-04` PERFORMS, AND THE ONE AUDIT PATH THEY ALL ROUTE
 * THROUGH.
 *
 * THREE THINGS IN ONE FIXED ORDER, on every write in this file:
 *
 *   1. DOMAIN REFUSALS — the evaluator's answer for THIS control, then the
 *      rules belonging to the act itself. The audit sink is not reached by
 *      any of them: a refused action is not an action, and appending an
 *      entry for one would put a write in the log that never happened.
 *   2. THE AUDIT APPEND — after the refusals and BEFORE the mutation.
 *   3. THE MUTATION.
 *
 * There is exactly ONE `commit` and every one of the seven writes calls it.
 * The covering test drives all seven against a recording sink and asserts
 * the entry count equals the action count — so an audit path wired to one
 * handler of seven fails there rather than being demonstrated on the one
 * handler that mutates nothing, which is how this build once shipped it.
 *
 * **The reorder is the case that matters.** Its covering test performs a
 * REAL reorder — the resulting order genuinely differs, proven on an
 * accepting sink first — and then asserts that with the audit failing the
 * drawn order is unchanged and the returned workflow is the SAME OBJECT.
 * An assertion that passed because the reorder was a no-op would prove
 * nothing.
 *
 * NOTHING IS QUEUED. `D4`/`S5`: nothing on this surface ever queues a write.
 * A failed audit fails the action with it — the entry commits in the same
 * transaction as the action.
 *
 * **AC-STU-055 IS ENFORCED BY ABSENCE HERE, NOT BY A GUARD.** There is no
 * `setDefaultSeverity` and no route that could reach one; `builderService`
 * below is the module's whole write surface and the covering test asserts
 * its key set. A guard that refused a severity write would still be a route
 * that accepts the request.
 *
 * DETERMINISM: no clock, no counter, no random source. Every identifier a
 * write produces is derived from what it was handed.
 */

export interface BuilderActor {
  readonly identityId: string
  readonly displayName: string
  readonly tenant: TenantId
}

export type BuilderWriteAction =
  | 'set-workflow-setting'
  | 'set-inheritable-default'
  | 'add-screen-node'
  | 'remove-screen-node'
  | 'reorder-screen-nodes'
  | 'draw-branch'
  | 'override-gate-failure-target'

export const BUILDER_WRITE_ACTIONS = [
  'set-workflow-setting',
  'set-inheritable-default',
  'add-screen-node',
  'remove-screen-node',
  'reorder-screen-nodes',
  'draw-branch',
  'override-gate-failure-target',
] as const satisfies readonly BuilderWriteAction[]

type MissingFromWriteActions = Exclude<BuilderWriteAction, (typeof BUILDER_WRITE_ACTIONS)[number]>
const _writeActionsExhaustive: MissingFromWriteActions extends never ? true : never = true
void _writeActionsExhaustive

export interface BuilderAuditEntry {
  /** Identity and action, never "acting as role" (L34657). */
  readonly actorIdentityId: string
  readonly action: BuilderWriteAction
  readonly workflowId: string
  /** What changed, named. A structural change nobody can name is not audited. */
  readonly element: string
  readonly tenant: TenantId
  readonly sourceRefs: readonly string[]
}

export type BuilderAuditWrite = (
  entry: BuilderAuditEntry,
) => { ok: true } | { ok: false; reason: string }

export interface BuilderWriteResult {
  readonly ok: boolean
  /** The NEW workflow on success; the ORIGINAL, untouched, on every refusal. */
  readonly workflow: WorkflowDraft
  readonly message: string
  /** The screens this result named. Never invented, may be empty. */
  readonly namedScreens: readonly string[]
}

/**
 * L32175: *"Structural changes — screens added, removed, reordered, branches
 * drawn or retargeted, defaults changed — are captured in the draft revision
 * history and surface in the screen-level diff at publication."*
 */
const AUDIT_REFS = ['L32175', 'L34657'] as const

interface WriteInputBase {
  readonly workflow: WorkflowDraft
  readonly actor: BuilderActor
  /** The evaluator's answer for THIS control. Never a role list. */
  readonly decision: StudioAccessDecision
  readonly writeAudit: BuilderAuditWrite
}

function refuse(
  workflow: WorkflowDraft,
  message: string,
  namedScreens: readonly string[] = [],
): BuilderWriteResult {
  return { ok: false, workflow, message, namedScreens }
}

/** The evaluator's answer for one control, never re-derived here. */
function authorisationRefusal(decision: StudioAccessDecision): string | null {
  if (permitsAction(decision.decision)) return null
  return (
    `Refused before anything was written: ${decision.reason} Nothing was written, and no audit ` +
    'entry was appended, because a refused action is not an action.'
  )
}

/* ==================================================================== *
 * THE ONE AUDIT PATH.
 * ==================================================================== */

interface CommitInput extends WriteInputBase {
  readonly action: BuilderWriteAction
  readonly element: string
  readonly sourceRefs: readonly string[]
  readonly namedScreens?: readonly string[]
}

function commit(
  input: CommitInput,
  apply: (workflow: WorkflowDraft) => WorkflowDraft,
  successMessage: string,
): BuilderWriteResult {
  const named = input.namedScreens ?? []
  const audit = input.writeAudit({
    actorIdentityId: input.actor.identityId,
    action: input.action,
    workflowId: input.workflow.id,
    element: input.element,
    tenant: input.actor.tenant,
    sourceRefs: [...input.sourceRefs, ...AUDIT_REFS],
  })
  if (!audit.ok) {
    return refuse(
      input.workflow,
      `The audit write failed, so the action did not happen: ${audit.reason}. ` +
        `${input.element} is unchanged, the drawn order is exactly as it was, nothing is left ` +
        'half-applied, and nothing was queued for later — the audit entry commits in the same ' +
        'transaction as the action, so a failed audit fails the action with it.',
      named,
    )
  }
  return {
    ok: true,
    workflow: apply(input.workflow),
    message: successMessage,
    namedScreens: named,
  }
}

/* ==================================================================== *
 * ROW 3 — the four Workflow settings.
 * ==================================================================== */

export interface SetWorkflowSettingInput extends WriteInputBase {
  readonly setting: WorkflowSetting
  readonly value: WorkflowSettingValue
}

export function setWorkflowSetting(input: SetWorkflowSettingInput): BuilderWriteResult {
  const refusal = authorisationRefusal(input.decision)
  if (refusal !== null) return refuse(input.workflow, refusal)

  // FUNC-STU-04-01-A-2: exactly one Job Type, and AC-STU-050 says every
  // Workflow carries one. Clearing it is refused rather than silently
  // producing a Workflow the Hub cannot filter.
  if (input.setting === 'Job Type' && (input.value === null || input.value === '')) {
    return refuse(
      input.workflow,
      'Every Workflow carries exactly one Job Type (AC-STU-050), and it drives selection ' +
        'filtering in the Delivery Operations Hub. It cannot be cleared.',
    )
  }
  if (input.setting === 'locale coverage' && Array.isArray(input.value) && input.value.length === 0) {
    return refuse(
      input.workflow,
      'Locale coverage defines what the publish-time completeness check must verify ' +
        '(FUNC-STU-04-01-A-4). A Workflow with no declared locale has nothing to check and ' +
        'nothing to publish.',
    )
  }

  return commit(
    { ...input, action: 'set-workflow-setting', element: input.setting, sourceRefs: ['L32062', 'L32086'] },
    (workflow) => ({
      ...workflow,
      settings: { ...workflow.settings, [input.setting]: input.value },
    }),
    `${input.setting} set. It is a Workflow setting, not inherited by screens.`,
  )
}

/* ==================================================================== *
 * ROWS 4 AND 5 — the exactly two inheritable defaults.
 * ==================================================================== */

export interface SetInheritableDefaultInput extends WriteInputBase {
  readonly default: InheritableDefault
  readonly value: InheritableDefaultValue
  /**
   * The escalation routing templates that exist, passed in from
   * `MOD-STU-07`'s register — never a module-load snapshot and never a list
   * maintained here. Empty is the alternate path at L32120.
   */
  readonly escalationTemplates: readonly string[]
}

export function setInheritableDefault(input: SetInheritableDefaultInput): BuilderWriteResult {
  const refusal = authorisationRefusal(input.decision)
  if (refusal !== null) return refuse(input.workflow, refusal)

  if (input.default === 'default-escalation-routing-template') {
    if (input.escalationTemplates.length === 0) {
      return refuse(
        input.workflow,
        'There is no escalation routing template to point at, so the workflow default cannot be ' +
          'set. Where the containment response capability is enabled, publication is blocked with ' +
          'this missing default named (L32120). Create a routing template in the Content ' +
          'Libraries first.',
      )
    }
    if (typeof input.value !== 'string' || !input.escalationTemplates.includes(input.value)) {
      return refuse(
        input.workflow,
        `“${String(input.value)}” is not one of the escalation routing templates this tenant ` +
          'holds. The picker reads the Content Libraries; a pointer is never typed in.',
      )
    }
  }

  if (input.default === 'default-coaching-trigger-percentage') {
    const value = input.value
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) {
      return refuse(
        input.workflow,
        'The coaching trigger is a percentage between 0 and 100. It is one place to tune when ' +
          'help appears across a Workflow (FUNC-STU-04-01-B-2), and the resulting per-screen ' +
          'value executes on the device from the package.',
      )
    }
  }

  return commit(
    {
      ...input,
      action: 'set-inheritable-default',
      element: input.default,
      sourceRefs: ['L32063', 'L32064', 'L32040'],
    },
    (workflow) => ({
      ...workflow,
      defaults: { ...workflow.defaults, [input.default]: input.value },
    }),
    `${input.default} set. Every screen inherits it unless it overrides it.`,
  )
}

/* ==================================================================== *
 * ROW 7 — add, remove and reorder screen nodes.
 * ==================================================================== */

export interface AddScreenNodeInput extends WriteInputBase {
  readonly node: WorkflowScreenNode
  /** Where in the drawn order. Appended where omitted. */
  readonly position?: number
}

export function addScreenNode(input: AddScreenNodeInput): BuilderWriteResult {
  const refusal = authorisationRefusal(input.decision)
  if (refusal !== null) return refuse(input.workflow, refusal)
  if (nodeById(input.workflow, input.node.id) !== null) {
    return refuse(
      input.workflow,
      `${input.node.id} is already a screen in this Workflow. One node is one screen the worker ` +
        'meets; two nodes with one id would make the sequence reference ambiguous.',
      [input.node.id],
    )
  }

  const at = input.position ?? input.workflow.nodes.length
  return commit(
    {
      ...input,
      action: 'add-screen-node',
      element: `screen ${input.node.id}`,
      sourceRefs: ['L32066', 'L32099'],
      namedScreens: [input.node.id],
    },
    (workflow) => ({
      ...workflow,
      nodes: [...workflow.nodes.slice(0, at), input.node, ...workflow.nodes.slice(at)],
    }),
    `${input.node.name} added at position ${at + 1}. The drawn order is the sequence-detection reference.`,
  )
}

export interface RemoveScreenNodeInput extends WriteInputBase {
  readonly nodeId: string
}

/**
 * THE PLATFORM DOES NOT SILENTLY REROUTE (L32120).
 *
 * Arrows drawn FROM the removed screen go with it — there is no screen left
 * to draw them from. Arrows drawn AT it are KEPT, which is what makes the
 * branch dangle and the Workflow structurally invalid until the author
 * supplies a target. Dropping them would be the silent reroute the source
 * forbids, wearing a tidier name.
 */
export function removeScreenNode(input: RemoveScreenNodeInput): BuilderWriteResult {
  const refusal = authorisationRefusal(input.decision)
  if (refusal !== null) return refuse(input.workflow, refusal)
  const node = nodeById(input.workflow, input.nodeId)
  if (node === null) {
    return refuse(input.workflow, `${input.nodeId} is not a screen in this Workflow.`)
  }

  const incoming = input.workflow.branches.filter((branch) => branch.to === input.nodeId)
  return commit(
    {
      ...input,
      action: 'remove-screen-node',
      element: `screen ${input.nodeId}`,
      sourceRefs: ['L32066', 'L32120'],
      namedScreens: [input.nodeId, ...incoming.map((branch) => branch.from)],
    },
    (workflow) => ({
      ...workflow,
      nodes: workflow.nodes.filter((n) => n.id !== input.nodeId),
      branches: workflow.branches.filter((branch) => branch.from !== input.nodeId),
    }),
    incoming.length === 0
      ? `${node.name} removed.`
      : `${node.name} removed. ${incoming.length} branch target(s) now dangle and the Workflow is ` +
        'structurally invalid until a target is supplied — nothing has been rerouted for you.',
  )
}

export interface ReorderScreenNodesInput extends WriteInputBase {
  /** The complete new order, by node id. A partial order is refused. */
  readonly order: readonly string[]
}

export function reorderScreenNodes(input: ReorderScreenNodesInput): BuilderWriteResult {
  const refusal = authorisationRefusal(input.decision)
  if (refusal !== null) return refuse(input.workflow, refusal)

  const current = drawnOrder(input.workflow)
  const sameMembers =
    input.order.length === current.length && [...input.order].sort().join() === [...current].sort().join()
  if (!sameMembers) {
    return refuse(
      input.workflow,
      'A reorder names every screen exactly once. A partial order would silently drop or ' +
        'duplicate a screen in the sequence-detection reference.',
    )
  }

  return commit(
    {
      ...input,
      action: 'reorder-screen-nodes',
      element: `drawn order ${input.order.join(' → ')}`,
      sourceRefs: ['L32066', 'L32098', 'AC-STU-056 L32181'],
      namedScreens: input.order,
    },
    (workflow) => ({
      ...workflow,
      nodes: input.order.map((id) => nodeById(workflow, id)!),
    }),
    `Order set to ${input.order.join(' → ')}. This is also the sequence-detection reference: an ` +
      'out-of-order or skipped screen is now a deterministic sequence deviation against it.',
  )
}

/* ==================================================================== *
 * ROW 8 — draw a conditional branch.
 * ==================================================================== */

export interface DrawBranchInput extends WriteInputBase {
  readonly branch: DrawnBranch
}

export function drawBranch(input: DrawBranchInput): BuilderWriteResult {
  const refusal = authorisationRefusal(input.decision)
  if (refusal !== null) return refuse(input.workflow, refusal)
  const { from, to, condition } = input.branch
  if (nodeById(input.workflow, from) === null) {
    return refuse(input.workflow, `${from} is not a screen in this Workflow, so no arrow starts there.`)
  }
  if (condition.trim() === '') {
    return refuse(
      input.workflow,
      'A conditional branch carries the condition it routes on. An arrow with no condition is a ' +
        'route nobody can read and the detector cannot evaluate.',
    )
  }

  return commit(
    {
      ...input,
      action: 'draw-branch',
      element: `branch ${from} -> ${to} on “${condition}”`,
      sourceRefs: ['L32067', 'L32042'],
      namedScreens: [from, to],
    },
    (workflow) => ({
      ...workflow,
      // Keyed on (from, condition): drawing again under the same condition
      // RETARGETS the arrow, which is how an author supplies a target for a
      // dangling branch.
      branches: [
        ...workflow.branches.filter((b) => !(b.from === from && b.condition === condition)),
        input.branch,
      ],
    }),
    `Branch drawn from ${from} to ${to} on “${condition}”. The drawing is the rule, not documentation.`,
  )
}

/* ==================================================================== *
 * ROW 9 — override the platform-standard gate-failure target.
 * ==================================================================== */

export interface OverrideGateFailureTargetInput extends WriteInputBase {
  readonly nodeId: string
  /** A screen id, or `null` to return to the platform-standard target. */
  readonly target: string | null
}

export function overrideGateFailureTarget(
  input: OverrideGateFailureTargetInput,
): BuilderWriteResult {
  const refusal = authorisationRefusal(input.decision)
  if (refusal !== null) return refuse(input.workflow, refusal)
  const node = nodeById(input.workflow, input.nodeId)
  if (node === null) {
    return refuse(input.workflow, `${input.nodeId} is not a screen in this Workflow.`)
  }
  if (!node.gated) {
    return refuse(
      input.workflow,
      `${node.name} carries no gate, so it has no failure path to override.`,
      [input.nodeId],
    )
  }

  // FUNC-STU-04-02-C-1: "no role may remove the default without supplying an
  // override target". An empty target is a removal wearing a blank.
  if (input.target !== null && input.target.trim() === '') {
    return refuse(
      input.workflow,
      'No role may remove the gate-failure default without supplying an override target. Clear ' +
        'the override to return to the platform-standard deviation-capture screen, which is ' +
        'carried in the offline package and works with no connectivity.',
      [input.nodeId],
    )
  }
  if (input.target !== null && !isPackagedTarget(input.workflow, input.target)) {
    return refuse(
      input.workflow,
      `${input.target} is not carried in this Workflow’s package, and an override target must ` +
        'itself be packaged or the override is rejected at publication (L32107). The ' +
        `platform-standard ${PLATFORM_DEVIATION_CAPTURE_SCREEN} is always packaged.`,
      [input.nodeId],
    )
  }

  return commit(
    {
      ...input,
      action: 'override-gate-failure-target',
      element: `gate-failure target on ${input.nodeId}`,
      sourceRefs: ['L32068', 'L32107', 'AC-STU-057 L32182'],
      namedScreens: [input.nodeId, ...(input.target === null ? [] : [input.target])],
    },
    (workflow) => ({
      ...workflow,
      nodes: workflow.nodes.map((n) =>
        n.id === input.nodeId ? { ...n, gateFailureOverride: input.target } : n,
      ),
    }),
    input.target === null
      ? `${node.name} returns to the platform-standard deviation-capture screen.`
      : `${node.name} routes gate failures to ${input.target}.`,
  )
}

/**
 * THE MODULE'S WHOLE WRITE SURFACE. Seven entries, one per action, and there
 * is no eighth: `AC-STU-055` closes the application programming interface
 * route as well as the control, so a severity write is absent rather than
 * refused. The covering test asserts this key SET, which is what makes the
 * absence checkable instead of merely true today.
 */
export const builderService = {
  setWorkflowSetting,
  setInheritableDefault,
  addScreenNode,
  removeScreenNode,
  reorderScreenNodes,
  drawBranch,
  overrideGateFailureTarget,
} as const

/* ==================================================================== *
 * RECONNECT, AND WHY SUBMISSION STAYS DISABLED UNTIL A FULL RE-RUN.
 * ==================================================================== */

/**
 * L32152: *"Structural validation re-runs **in full** on reconnection before
 * submission is re-enabled, because a validation result computed before a
 * dependency changed is stale data … an example is a branch target that
 * validated successfully before another author deleted the target screen."*
 *
 * So the reconnection DISCARDS the last result rather than carrying it
 * forward. The parameter exists so that the discard is a decision this
 * function makes about a real value, not a signature that could not have
 * done otherwise.
 */
export function onReconnect(_lastRun: StructuralValidation | null): StructuralValidation | null {
  void _lastRun
  return null
}

export interface SubmissionEligibility {
  readonly ok: boolean
  readonly blockers: readonly StructuralFinding[]
  /** Never blank. Why submission is refused, or why it is open. */
  readonly reason: string
}

/**
 * `AC-STU-058` — *"A Workflow with an unreachable node or a dangling branch
 * target cannot be submitted."* A REFUSAL, not a warning: there is no
 * argument that lets a caller past it and no second entry point that
 * returns advice.
 *
 * Submitting is `MOD-STU-11`'s act. This module owns the refusal, which is
 * what the states line at L32080 makes it own: *"a structurally invalid
 * Workflow cannot be submitted."*
 */
export function submissionEligibility(
  workflow: WorkflowDraft,
  lastRun: StructuralValidation | null,
): SubmissionEligibility {
  if (lastRun === null) {
    return {
      ok: false,
      blockers: [],
      reason:
        'Structural validation has not run, or was discarded on reconnection. It re-runs in full ' +
        'before submission is re-enabled, because a validation result computed before a ' +
        'dependency changed is stale data.',
    }
  }
  if (lastRun.computedOver !== structureFingerprint(workflow)) {
    return {
      ok: false,
      blockers: [],
      reason:
        'The last structural validation is stale: the drawing has changed since it ran. A branch ' +
        'target that validated successfully before another author deleted the target screen is ' +
        'the example the source gives, and acting on that result would silently produce a wrong ' +
        'answer. Re-run structural validation in full.',
    }
  }
  if (!lastRun.valid) {
    return {
      ok: false,
      blockers: lastRun.blockers,
      reason:
        `This Workflow is structurally invalid and cannot be submitted: ${lastRun.blockers
          .map((b) => b.element)
          .join('; ')}.`,
    }
  }
  return {
    ok: true,
    blockers: [],
    reason:
      'Structurally valid against the current drawing: every node reachable, every branch target ' +
      'resolvable, exactly one entry point.',
  }
}
