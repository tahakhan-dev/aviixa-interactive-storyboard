'use client'

import { useState } from 'react'
import { STU_MODULES, stuModuleById, type StudioPersonaId } from '@/studio/modules'
import { BlockEditorView } from '@/studio/modules/stu-06/BlockEditorView'
import {
  SEEDED_BLOCK_REGISTER,
  WF_TORQUE,
  blockIn,
  scopeOf,
  type BlockRegister,
} from '@/studio/modules/stu-06/blocks'
import { stu06Row, type Stu06CapabilityId } from '@/studio/modules/stu-06/matrix'
import {
  decisionForRow,
  deleteControlDecision,
  scenario,
} from '@/studio/modules/stu-06/rendering'
import {
  applyBlockToScreen,
  createBlock,
  deleteBlock,
  editBlock,
  removeBlockFromScreen,
  type BlockActor,
  type BlockAuditWrite,
  type BlockWriteResult,
} from '@/studio/modules/stu-06/writes'
import { studioIdentityFor } from '@/studio/modules/stu-18/rendering'
import { Checkbox, Select } from '@/ui/primitives'
import { StudioShell } from '../StudioShell'

const MODULE = stuModuleById(STU_MODULES, 'MOD-STU-06')

/**
 * `MOD-STU-06`'s route — `SCR-STU-05`, keyed on the module slug
 * `instruction-blocks`. The screen id is an annotation the shell renders,
 * never a route key (D1).
 *
 * THE WORKFLOW IS PART OF THE ROUTE'S STATE, and that is R11 showing through
 * to the surface: there is no "all blocks" view to render, because there is
 * no shape in this module that holds two Workflows' blocks at once. The
 * picker below switches which Workflow is open; it does not filter one list.
 *
 * THE WRITES ARE REAL. Every control runs the module's own write function
 * against this register, with the evaluator's decision for that control and
 * the audit sink handed in — a control that renders enabled and does nothing
 * is the first defect this build shipped. What the write returns, including
 * every refusal, is what the screen prints.
 */
export function InstructionBlocksScreen() {
  const [persona, setPersona] = useState<StudioPersonaId>('quality-manager')
  const [workflowId, setWorkflowId] = useState<string>(WF_TORQUE)
  const [selectedBlockId, setSelectedBlockId] = useState<string | undefined>(undefined)
  const [register, setRegister] = useState<BlockRegister>(SEEDED_BLOCK_REGISTER)
  const [auditReachable, setAuditReachable] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  const s = scenario({ persona })

  const writeAudit: BlockAuditWrite = () =>
    auditReachable
      ? { ok: true }
      : { ok: false, reason: 'the tenant audit log did not accept the entry' }

  const identity = studioIdentityFor(persona)
  const actor: BlockActor = { identityId: identity.identityId, displayName: persona }

  const workflowOptions = Object.keys(register).map((id) => ({
    value: id,
    label: scopeOf(register, id)?.workflowName ?? id,
  }))

  function record(result: BlockWriteResult) {
    setRegister(result.register)
    setMessage(
      result.diffEntries.length === 0
        ? result.message
        : `${result.message} The draft revision history carries ${result.diffEntries.length} ` +
          `changed screen${result.diffEntries.length === 1 ? '' : 's'}: ` +
          `${result.diffEntries.map((entry) => entry.screenName).join(', ')}.`,
    )
  }

  function act(control: Stu06CapabilityId, blockId: string) {
    const scope = scopeOf(register, workflowId)
    if (scope === undefined) return
    const decision = decisionForRow(stu06Row(control), s)
    const block = blockIn(register, workflowId, blockId)
    const common = { register, workflowId, actor, writeAudit }

    switch (control) {
      case 'create-a-block-within-a-workflow': {
        // The one control that is both create and delete: the delete button
        // hands this id back for a block that exists, and the panel's own
        // create hands it back for one that does not. `deleteControlDecision`
        // reads the same row, so the two cannot diverge.
        if (block !== undefined) {
          record(deleteBlock({ ...common, blockId, decision: deleteControlDecision(s) }))
          setSelectedBlockId(undefined)
          return
        }
        record(createBlock({ ...common, title: 'New shared instruction block', decision }))
        return
      }
      case 'apply-a-block-to-a-screen': {
        const target = scope.screens.find(
          (screen) => block !== undefined && !block.appliesToScreenIds.includes(screen.id),
        )
        if (target === undefined) {
          setMessage('Every screen in this Workflow already applies this block.')
          return
        }
        record(applyBlockToScreen({ ...common, blockId, screenId: target.id, decision }))
        return
      }
      case 'edit-a-block-propagating-to-every-applying-screen': {
        record(
          editBlock({
            ...common,
            blockId,
            locale: scope.declaredLocales[0] ?? 'English',
            level: 'standard',
            text: 'Torque to 45 Nm in the revised star sequence, in two passes.',
            decision,
          }),
        )
        return
      }
      case 'remove-a-block-from-a-screen': {
        const target = block?.appliesToScreenIds[0]
        if (target === undefined) {
          setMessage('This block applies to no screen, so there is nothing to remove.')
          return
        }
        record(removeBlockFromScreen({ ...common, blockId, screenId: target, decision }))
        return
      }
      // Neither of the remaining two rows is a control. Row 5 is refused in
      // all eight columns with no alternative anywhere; row 6 is what the
      // panel IS. Handled here so the switch stays total rather than
      // falling through to a silent no-op.
      case 'reuse-a-block-in-another-workflow':
      case 'read-a-block-on-published-content':
        return
      default: {
        const exhaustive: never = control
        throw new Error(`MOD-STU-06: unhandled control ${JSON.stringify(exhaustive)}`)
      }
    }
  }

  return (
    <StudioShell module={MODULE} screenId="SCR-STU-05" persona={persona} onPersonaChange={setPersona}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end gap-6">
          <Select
            label="Workflow"
            value={workflowId}
            options={workflowOptions}
            onChange={(next) => {
              setWorkflowId(next)
              setSelectedBlockId(undefined)
              setMessage(null)
            }}
          />
          <Checkbox
            label="Tenant audit log reachable"
            checked={auditReachable}
            onChange={setAuditReachable}
          />
        </div>
        <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
          Blocks are reached through their Workflow. Switching Workflow opens that Workflow’s own
          blocks; it does not filter one list, because there is no list holding two Workflows’
          blocks to filter. Clearing the audit checkbox shows a write refused because its entry
          could not be appended — the entry commits with the action, so a failed audit fails the
          action and every applying screen stays unchanged.
        </p>

        <BlockEditorView
          scenario={s}
          register={register}
          workflowId={workflowId}
          selectedBlockId={selectedBlockId}
          onSelect={setSelectedBlockId}
          onAct={act}
          lastMessage={message}
        />
      </div>
    </StudioShell>
  )
}
