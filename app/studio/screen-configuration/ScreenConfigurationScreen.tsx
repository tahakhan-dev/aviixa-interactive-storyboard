'use client'

import { useState } from 'react'
import { STU_MODULES, stuModuleById, type StudioPersonaId } from '@/studio/modules'
import { CAPABILITY_REGISTER, capabilitiesForTenant } from '@/studio/modules/stu-01/capabilities'
import { ConfigurationPanel } from '@/studio/modules/stu-05/ConfigurationPanel'
import { SCREEN_PARTS_DRAFT, stu05Scenario } from '@/studio/modules/stu-05/rendering'
import {
  WHEEL_BOLT_CONFIGURATION,
  configuredScreen,
  sectionStates,
  setGate,
  setInputType,
  type ConfigurationDraft,
  type ScreenAuditWrite,
} from '@/studio/modules/stu-05/sections'
import { inlineAddPart, type PartsAuditWrite } from '@/studio/modules/stu-10/seam'
import { confirmedPartsRegistry } from '@/studio/seams/parts/registry'
import type { AuthoringDraft } from '@/studio/modules/stu-10/seam'
import { CAPTURE_TYPES, type CaptureType } from '@/studio/vocab'
import { Checkbox, Select } from '@/ui/primitives'
import { StudioShell } from '../StudioShell'

const MODULE = stuModuleById(STU_MODULES, 'MOD-STU-05')

const SCREEN_OPTIONS = WHEEL_BOLT_CONFIGURATION.screens.map((s) => ({
  value: s.screenId,
  label: s.name,
}))

const CAPTURE_OPTIONS = CAPTURE_TYPES.map((t) => ({ value: t, label: t }))

const GATE_OPTIONS = [
  { value: 'hard', label: 'Hard gate — blocks advance until valid proof is captured' },
  { value: 'soft', label: 'Soft gate — permits advance, recording an evidence gap' },
]

function isCaptureType(value: string): value is CaptureType {
  return (CAPTURE_TYPES as readonly string[]).includes(value)
}

/**
 * `MOD-STU-05`'s route — `SCR-STU-04`, the screen configuration panel, keyed
 * on the module slug `screen-configuration`. The `SCR-STU-04` id is an
 * annotation the shell renders, never a route key (D1).
 *
 * THE STATE LIVES HERE, ONE COPY OF EACH PIECE. The shell's reviewer persona
 * switcher and this screen's content must never disagree about who is being
 * viewed as, and two independent pieces of state is how they would.
 *
 * THE WRITES ARE REAL. Every control runs the module's own write function
 * against this draft, with the evaluator's decision for that control and the
 * audit sink handed in. What the write returns, including every refusal, is
 * what the screen prints — a control that renders enabled and does nothing is
 * the first defect this build shipped.
 *
 * THE PANEL DERIVES NOTHING. `sectionStates` runs once, here, and the result
 * is handed to `ConfigurationPanel`. Nine sections is nine chances for one
 * branch to fold a state the others read raw.
 */
export function ScreenConfigurationScreen() {
  const [persona, setPersona] = useState<StudioPersonaId>('quality-manager')
  const [screenId, setScreenId] = useState<string>('screen 3')
  const [draft, setDraft] = useState<ConfigurationDraft>(WHEEL_BOLT_CONFIGURATION)
  const [partsDraft, setPartsDraft] = useState<AuthoringDraft>(SCREEN_PARTS_DRAFT)
  const [partName, setPartName] = useState('')
  const [auditReachable, setAuditReachable] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  const capabilityRows = capabilitiesForTenant([CAPABILITY_REGISTER], CAPABILITY_REGISTER.tenant)
  const screen = configuredScreen(draft, screenId)
  const sections = sectionStates(screen, capabilityRows)
  const scenario = stu05Scenario({ persona })

  const writeAudit: ScreenAuditWrite = () =>
    auditReachable
      ? { ok: true }
      : { ok: false, reason: 'the tenant audit log did not accept the entry' }

  const partsAudit: PartsAuditWrite = () =>
    auditReachable
      ? { ok: true }
      : { ok: false, reason: 'the tenant audit log did not accept the entry' }

  return (
    <StudioShell
      module={MODULE}
      screenId="SCR-STU-04"
      persona={persona}
      onPersonaChange={setPersona}
    >
      <div className="space-y-6">
        <section
          aria-label="Screen selection and authoring controls"
          className="space-y-3 rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4"
        >
          <Select
            label="Screen"
            value={screenId}
            options={SCREEN_OPTIONS}
            onChange={(value) => {
              setScreenId(value)
              setMessage(null)
            }}
          />
          <Select
            label="Section 2 — input type"
            value={screen.inputType}
            options={CAPTURE_OPTIONS}
            onChange={(value) => {
              if (!isCaptureType(value)) return
              const result = setInputType({
                draft,
                screenId,
                persona,
                ctx: scenario,
                inputType: value,
                writeAudit,
              })
              setDraft(result.draft)
              setMessage(result.ok ? result.message : result.reason)
            }}
          />
          <Select
            label="Section 4 — proof gate"
            value={screen.gate}
            options={GATE_OPTIONS}
            onChange={(value) => {
              if (value !== 'hard' && value !== 'soft') return
              const result = setGate({
                draft,
                screenId,
                persona,
                ctx: scenario,
                gate: value,
                writeAudit,
              })
              setDraft(result.draft)
              setMessage(result.ok ? result.message : result.reason)
            }}
          />
          <Checkbox
            label="The tenant audit log accepts entries"
            checked={auditReachable}
            onChange={setAuditReachable}
          />
          <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
            Turning the audit log off is a reviewer control, not a product one. Every section write
            appends its audit entry after the domain refusals and before the mutation, so a failed
            audit fails the write with it: nothing is left half-applied and nothing is queued,
            because this surface never queues a write.
          </p>
          {message === null ? null : (
            <p role="status" className="max-w-prose text-sm">
              {message}
            </p>
          )}
        </section>

        <ConfigurationPanel
          screen={screen}
          sections={sections}
          persona={persona}
          capabilityRows={capabilityRows}
          partsDraft={partsDraft}
          partsRegistry={confirmedPartsRegistry}
          onOpenLevel={(level, locale) =>
            setMessage(
              `The ${level} rendering in ${locale} opens in the work-instruction editor. Difficulty ` +
                'levels change explanation depth only.',
            )
          }
          onAddPart={(name) => {
            const result = inlineAddPart({
              draft: partsDraft,
              stepId: screen.stepId,
              persona,
              name: name === '' ? partName : name,
              registry: confirmedPartsRegistry,
              writeAudit: partsAudit,
            })
            setPartsDraft(result.draft)
            setPartName('')
            setMessage(result.ok ? result.message : result.reason)
          }}
          onCancelPart={() => {
            setPartName('')
            setMessage('The part mini-form was cancelled. Nothing was written.')
          }}
        />
      </div>
    </StudioShell>
  )
}
