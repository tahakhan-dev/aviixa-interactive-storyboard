'use client'

import { useState } from 'react'
import { STU_MODULES, stuModuleById, type StudioPersonaId } from '@/studio/modules'
import { ContentLibrariesView } from '@/studio/modules/stu-07/ContentLibrariesView'
import {
  LIBRARY_IDS,
  LIBRARY_NAMES,
  SEEDED_LIBRARY_REGISTER,
  itemById,
  reuseImpact,
  type LibraryId,
  type LibraryRegister,
} from '@/studio/modules/stu-07/libraries'
import { SEEDED_TENANT, decisionForRow, scenario } from '@/studio/modules/stu-07/rendering'
import { stu07Row, type Stu07CapabilityId } from '@/studio/modules/stu-07/matrix'
import {
  approveCoachingAsset,
  archiveLibraryItem,
  createLibraryItem,
  editLibraryItem,
  proposeLibraryChange,
  retireCoachingAsset,
  type LibraryActor,
  type LibraryAuditWrite,
  type LibraryWriteResult,
} from '@/studio/modules/stu-07/writes'
import { studioIdentityFor } from '@/studio/modules/stu-18/rendering'
import { Checkbox, Tabs } from '@/ui/primitives'
import { StudioShell } from '../StudioShell'

const MODULE = stuModuleById(STU_MODULES, 'MOD-STU-07')

const TABS = LIBRARY_IDS.map((id) => ({ id, label: LIBRARY_NAMES[id] }))

function isLibraryId(value: string): value is LibraryId {
  return (LIBRARY_IDS as readonly string[]).includes(value)
}

/**
 * `MOD-STU-07`'s route — the three Content Libraries as three tabs of ONE
 * route, keyed on the module slug `content-libraries`. `SCR-STU-06`,
 * `SCR-STU-07` and `SCR-STU-08` are annotations the shell renders, never
 * route keys (D1); no `screenId` is passed, so all three are annotated.
 *
 * THE STATE LIVES HERE, and there is one copy of each piece. The shell's
 * reviewer persona switcher and this screen's content must never disagree
 * about who is being viewed as, and two independent pieces of state is how
 * they would.
 *
 * THE WRITES ARE REAL. Every control below runs the module's own write
 * function against this register, with the evaluator's decision for that
 * control and the audit sink handed in — a control that renders enabled and
 * does nothing is the first defect this build shipped. What the write
 * returns, including every refusal, is what the screen prints.
 */
export function ContentLibrariesScreen() {
  const [persona, setPersona] = useState<StudioPersonaId>('quality-manager')
  const [tab, setTab] = useState<LibraryId>('containment-checklists')
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(undefined)
  const [register, setRegister] = useState<LibraryRegister>(SEEDED_LIBRARY_REGISTER)
  const [auditReachable, setAuditReachable] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  const s = scenario({ persona })

  const writeAudit: LibraryAuditWrite = () =>
    auditReachable
      ? { ok: true }
      : { ok: false, reason: 'the tenant audit log did not accept the entry' }

  // The seeded identity for the persona in view. `tenant` is nullable on
  // `StudioIdentity` because the identity layer can fail to report one; a
  // write against an unreported tenant is refused by tenant isolation before
  // it reaches this screen, and the seeded personas all carry one.
  const identity = studioIdentityFor(persona)
  const actor: LibraryActor = {
    identityId: identity.identityId,
    displayName: persona,
    tenant: identity.tenant ?? SEEDED_TENANT,
  }

  function act(control: Stu07CapabilityId, itemId: string) {
    const item = itemById(register, itemId)
    if (item === undefined) return
    const decision = decisionForRow(stu07Row(control), s)
    const shared = { register, itemId, actor, decision, writeAudit }
    let result: LibraryWriteResult
    switch (control) {
      case 'create-a-library-item':
        result = createLibraryItem({
          register,
          actor,
          decision,
          writeAudit,
          draft:
            tab === 'containment-checklists'
              ? {
                  library: 'containment-checklists',
                  name: 'New containment checklist',
                  severityBands: ['Severity 2'],
                  serviceTypeTag: null,
                  steps: [
                    { id: 'STEP-1', text: 'Stop the line and quarantine the unit', serverLookup: null },
                  ],
                }
              : tab === 'coaching-corpus'
                ? {
                    library: 'coaching-corpus',
                    name: 'New coaching asset',
                    locale: 'English',
                    mediaKind: 'image',
                    screenTag: 'torque-photograph',
                    classificationTag: 'evidence-quality',
                    curatedDefault: false,
                    containsIdentifiableWorkers: false,
                  }
                : {
                    library: 'escalation-routing',
                    name: 'New routing template',
                    rules: [],
                  },
        })
        break
      case 'edit-a-library-item':
        result = editLibraryItem({
          ...shared,
          // The impact the author was just shown, read from the same
          // register the panel above rendered from. `editLibraryItem`
          // refuses if it no longer matches.
          shownImpact: reuseImpact(register, itemId),
          change: { name: `${item.name} (revised)` },
        })
        break
      case 'archive-a-library-item':
        result = archiveLibraryItem(shared)
        break
      case 'approve-a-coaching-asset':
        result = approveCoachingAsset(shared)
        break
      case 'retire-a-flagged-coaching-asset':
        result = retireCoachingAsset(shared)
        break
      case 'propose-a-change':
        result = proposeLibraryChange({
          ...shared,
          proposal: `Proposed a revision to ${item.name}.`,
        })
        break
      default:
        return
    }
    setRegister(result.register)
    setMessage(result.message)
  }

  return (
    <StudioShell module={MODULE} persona={persona} onPersonaChange={setPersona}>
      <div className="space-y-6">
        <section
          className="rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4"
          aria-label="Storyboard failure switch"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
            Reviewer control — not part of the product
          </p>
          <div className="mt-2">
            <Checkbox
              label="Simulate the tenant audit log being unreachable"
              checked={!auditReachable}
              onChange={(checked) => setAuditReachable(!checked)}
            />
          </div>
          <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
            The Studio keeps no audit log of its own — it is the Delivery Operations Hub’s, and
            slice 10 owns it. With this on, every write below is refused and the item is left
            exactly as it was: the audit entry commits in the same transaction as the action, so a
            failed audit fails the action with it, and nothing is queued for later.
          </p>
        </section>

        <Tabs
          tabs={TABS}
          activeId={tab}
          onChange={(id) => {
            if (!isLibraryId(id)) return
            setTab(id)
            setSelectedItemId(undefined)
            setMessage(null)
          }}
        />

        <ContentLibrariesView
          scenario={s}
          activeTab={tab}
          register={register}
          selectedItemId={selectedItemId}
          onSelect={(itemId) => {
            setSelectedItemId(itemId)
            setMessage(null)
          }}
          onAct={act}
          lastMessage={message}
        />
      </div>
    </StudioShell>
  )
}
