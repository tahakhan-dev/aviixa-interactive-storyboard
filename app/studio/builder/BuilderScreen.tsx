'use client'

import { useState } from 'react'
import { Checkbox } from '@/ui/primitives'
import { STU_MODULES, stuModuleById, type StudioPersonaId } from '@/studio/modules'
import { SEEDED_LIBRARY_REGISTER } from '@/studio/modules/stu-07/libraries'
import { BuilderView } from '@/studio/modules/stu-04/BuilderView'
import { stu04Row } from '@/studio/modules/stu-04/matrix'
import {
  BUILDER_CONTROLS,
  builderCheckRegister,
  builderControls,
  decisionForRow,
  draftCanvasFor,
  escalationTemplateOptions,
  publishedCanvasFor,
  readableWorkflows,
  scenario,
  validationPanel,
} from '@/studio/modules/stu-04/rendering'
import {
  SEEDED_CANVAS_REGISTER,
  drawnOrder,
  forkGuidance,
  previewSequence,
  validateStructure,
  type PreviewStep,
  type StructuralValidation,
  type WorkflowDraft,
} from '@/studio/modules/stu-04/workflow'
import {
  addScreenNode,
  drawBranch,
  onReconnect,
  overrideGateFailureTarget,
  removeScreenNode,
  reorderScreenNodes,
  setInheritableDefault,
  setWorkflowSetting,
  submissionEligibility,
  type BuilderActor,
  type BuilderAuditWrite,
  type BuilderWriteResult,
} from '@/studio/modules/stu-04/writes'
import { studioIdentityFor, SEEDED_TENANT } from '@/studio/modules/stu-18/rendering'
import { StudioShell } from '../StudioShell'

const MODULE = stuModuleById(STU_MODULES, 'MOD-STU-04')

/**
 * `MOD-STU-04`'s route, keyed on the module slug `builder`. `SCR-STU-03` is
 * an annotation the shell renders, never a route key (D1) —
 * `SCR-STU-BUILDER` (L68164) is uncatalogued and becomes no route at all.
 *
 * THE STATE LIVES HERE, and there is one copy of each piece: the shell's
 * reviewer persona switcher and this screen's content must never disagree
 * about who is being viewed as.
 *
 * THE WRITES ARE REAL. Every control runs the module's own write function
 * against this workflow, with the evaluator's decision for that control and
 * the audit sink handed in. What the write returns, refusals included, is
 * what the screen prints — a control that renders enabled and does nothing
 * is the first defect this build shipped.
 *
 * WHICH CANVAS OPENS IS A READ, NOT A FLAG. The draft canvas is asked for
 * first; where the persona is refused it, nothing about the draft is loaded
 * and the published canvas is asked for instead. That is two reads over two
 * collections, which is why a Supervisor without the grant never has a draft
 * in this component's state at all.
 */
export function BuilderScreen() {
  const [persona, setPersona] = useState<StudioPersonaId>('quality-manager')
  const [workflow, setWorkflow] = useState<WorkflowDraft>(SEEDED_CANVAS_REGISTER.drafts[0]!)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [preview, setPreview] = useState<readonly PreviewStep[] | null>(null)
  const [auditReachable, setAuditReachable] = useState(true)
  const [reconnected, setReconnected] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const s = scenario({ persona })

  // The two reads. The draft is asked for first and, where it is refused,
  // `register.drafts` is never touched.
  const register = { ...SEEDED_CANVAS_REGISTER, drafts: [workflow] }
  const draft = draftCanvasFor(s, register, workflow.id)
  const canvas = draft.ok ? draft : publishedCanvasFor(s, register, workflow.id)
  const shown = canvas.ok ? canvas.workflow : null

  const structural: StructuralValidation | null =
    shown === null ? null : reconnected ? onReconnect(validateStructure(shown)) : validateStructure(shown)
  const eligibility = shown === null ? null : submissionEligibility(shown, structural)

  const writeAudit: BuilderAuditWrite = () =>
    auditReachable
      ? { ok: true }
      : { ok: false, reason: 'the tenant audit log did not accept the entry' }

  const identity = studioIdentityFor(persona)
  const actor: BuilderActor = {
    identityId: identity.identityId,
    displayName: persona,
    tenant: identity.tenant ?? SEEDED_TENANT,
  }

  const templates = escalationTemplateOptions(SEEDED_LIBRARY_REGISTER)
  // Scope, applied to the DATA this screen holds rather than to its markup.
  const readable = readableWorkflows(s, register)

  function act(controlId: string, argument: string): void {
    const control = BUILDER_CONTROLS.find((c) => c.id === controlId)
    if (control === undefined) return
    const decision = decisionForRow(stu04Row(control.capabilityId), s)
    const base = { workflow, actor, decision, writeAudit }
    const order = drawnOrder(workflow)
    let result: BuilderWriteResult

    switch (control.id) {
      case 'canvas:preview':
        setPreview(previewSequence(workflow))
        setMessage('Preview walked the graph in worker order, from the entry point.')
        return
      case 'canvas:add': {
        const ordinal = workflow.nodes.length + 1
        result = addScreenNode({
          ...base,
          node: {
            id: `S${ordinal}`,
            ordinal,
            name: `Screen ${ordinal}`,
            kind: 'standard',
            gated: false,
            gateFailureOverride: null,
          },
        })
        break
      }
      case 'canvas:remove':
        result = removeScreenNode({ ...base, nodeId: argument })
        break
      case 'canvas:move-earlier':
      case 'canvas:move-later': {
        const at = order.indexOf(argument)
        const to = control.id === 'canvas:move-earlier' ? at - 1 : at + 1
        if (at < 0 || to < 0 || to >= order.length) return
        const next = [...order]
        next[at] = order[to]!
        next[to] = order[at]!
        result = reorderScreenNodes({ ...base, order: next })
        break
      }
      case 'canvas:branch': {
        const [from, to] = argument.split('|')
        if (from === undefined || to === undefined) return
        result = drawBranch({
          ...base,
          branch: { from, to, condition: `routed from ${from} on the author’s condition` },
        })
        break
      }
      case 'canvas:gate-failure': {
        const [nodeId, target] = argument.split('|')
        if (nodeId === undefined || target === undefined) return
        result = overrideGateFailureTarget({ ...base, nodeId, target })
        break
      }
      default:
        if (control.setting !== null) {
          result = setWorkflowSetting({
            ...base,
            setting: control.setting,
            value:
              control.setting === 'locale coverage'
                ? ['English', 'Spanish']
                : control.setting === 'optional Service Type tag'
                  ? 'Wheel assembly'
                  : control.setting === 'Job Type'
                    ? 'Assembly'
                    : 'Assembly — Wheel Bolt Torque Verification (revised)',
          })
          break
        }
        if (control.inheritableDefault !== null) {
          result = setInheritableDefault({
            ...base,
            default: control.inheritableDefault,
            value:
              control.inheritableDefault === 'default-escalation-routing-template'
                ? argument
                : 80,
            escalationTemplates: templates.map((t) => t.id),
          })
          break
        }
        return
    }

    setWorkflow(result.workflow)
    setMessage(result.message)
    // Any accepted structural change invalidates a preview walked over the
    // previous drawing, rather than leaving a stale route on screen.
    if (result.ok) setPreview(null)
  }

  return (
    <StudioShell module={MODULE} screenId="SCR-STU-03" persona={persona} onPersonaChange={setPersona}>
      <div className="space-y-6">
        <div
          className="rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4"
          aria-label="Storyboard failure switches"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
            Reviewer controls — not part of the product
          </p>
          <div className="mt-2 space-y-2">
            <Checkbox
              label="Simulate the tenant audit log being unreachable"
              checked={!auditReachable}
              onChange={(checked) => setAuditReachable(!checked)}
            />
            <Checkbox
              label="Simulate the connection having just returned"
              checked={reconnected}
              onChange={setReconnected}
            />
          </div>
          <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
            With the first on, every write below is refused and the drawing is left exactly as it
            was: the audit entry commits in the same transaction as the action, so a failed audit
            fails the action with it and nothing is queued. With the second on, the last structural
            validation is discarded and submission stays refused until it re-runs in full — a
            result computed before a dependency changed is stale data (L32152).
          </p>
        </div>

        <BuilderView
          canvas={canvas}
          workflow={shown}
          controls={builderControls(s)}
          validation={validationPanel(shown ?? workflow, builderCheckRegister())}
          findings={structural?.blockers ?? []}
          guidance={forkGuidance(shown ?? workflow)}
          preview={preview}
          selectedNodeId={selectedNodeId}
          escalationTemplates={templates}
          readable={readable}
          submissionReason={
            eligibility?.reason ??
            'Nothing is loaded on this canvas, so there is nothing to submit.'
          }
          submissionOpen={eligibility?.ok ?? false}
          lastMessage={message}
          onSelectNode={setSelectedNodeId}
          onAct={act}
        />
      </div>
    </StudioShell>
  )
}
