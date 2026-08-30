import type { StudioPersonaColumn } from '@/studio/access/evaluate'
import { STU_SEAMS, stuSeamById, type StudioSeamDefinition } from '@/studio/seams'
import { DEC_PARTSTUB_001, type PartsRegistrySeam } from '@/studio/seams/parts/registry'
import { screenRendersState } from '@/studio/state/screen-states'
import { Banner, Button, Field, StatusPill } from '@/ui/primitives'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import { ScreenStateBoundary } from '@/ui/ScreenStateBoundary'
import { StudioSeamNotice } from '@/ui/stu/StudioSeamNotice'
import type { TenantWriteState } from '@/surfaces/doh/tenant-state'
import { STU_10_CROSS_SURFACE } from './matrix'
import {
  partsAffordance,
  STU10_DEFAULT_CONTEXT,
  type PartReference,
  type PartsContext,
  type PartsControlRendering,
} from './seam'

/**
 * `SB-STU-13`, the name-only mini-form (L33176) — "a small inline panel
 * inside the work-instruction step editor with a single field labelled
 * 'Part name' and two controls, Add and Cancel."
 *
 * ONE FIELD AND TWO CONTROLS. Nothing else is drawn, and nothing else is
 * invented: there is no identifier field (`AC-STU-092`, L33216 — "no author
 * input influences it"), no supplier field, no unit-of-measure field, no
 * edit control and no delete control (L33207 — "exactly one writable
 * field ... It cannot be used to edit or delete an existing registry
 * record"). The covering test counts the controls this panel renders.
 *
 * THIS MODULE OWNS NO ROUTE. L33107's own no-route reason is that "leaving
 * the authoring context is the thing it exists to avoid", so this is a
 * COMPONENT with a frozen prop contract that `SCR-STU-04` mounts in one
 * line — catalogue A's `SCR-STU-PARTADD` (L31088) is a sub-view of
 * `SCR-STU-04`, never a screen id of its own (D1).
 *
 * THE PROP CONTRACT IS FROZEN AGAINST TASK 15. Task 13's brief asks for the
 * props to be frozen but supplies no signature, so this is the signature and
 * the report states it verbatim. `persona` is required for the same reason
 * it is on `DifficultyCoverage`: every control takes its affordance from the
 * evaluator over a matrix row and a persona column, and a defaulted persona
 * would be a policy default living inside a component.
 *
 * THE FAR SIDE DOES NOT EXIST YET, AND THE PANEL SAYS SO. `MOD-DOH-19` is
 * registered `not-represented`, was excluded from slice 4 and is in no later
 * slice's stated scope, so the seam notice renders "Owner stated, no slice
 * assigned" — never a borrowed slice number.
 */

/** The field label `SB-STU-13` names, verbatim. */
export const PART_NAME_FIELD_LABEL = 'Part name'

/** The line `SB-STU-13` requires below the field, verbatim (L33176). */
export const MINI_FORM_NOTE =
  'This creates a skeletal record in the parts registry. Complete it in the Delivery Operations ' +
  'Hub. The platform assigns the identifier.'

export interface PartsMiniFormProps {
  /** The work-instruction step this mini-form is open inside. */
  readonly stepId: string
  /** The matrix column this reader resolves to. See the contract note above. */
  readonly persona: StudioPersonaColumn
  /** The references this step already carries. Empty is the ordinary case. */
  readonly references: readonly PartReference[]
  /** The seam. `reachable: false` is `FB-STU-07`'s first fallback. */
  readonly registry: PartsRegistrySeam
  /** Slice 4's own tenant write state. Never a second copy of the table. */
  readonly tenantState: TenantWriteState
  /** The ONE writable field leaves through here. There is no identifier arm. */
  readonly onAdd: (name: string) => void
  readonly onCancel: () => void
  /** The name currently typed, if the mounting screen is holding it. */
  readonly draftName?: string
  readonly ctx?: PartsContext
  /** The seam register, passed in. Never a module-load snapshot. */
  readonly seams?: readonly StudioSeamDefinition[]
}

function Control({
  rendering,
  onClick,
}: {
  readonly rendering: PartsControlRendering
  readonly onClick: () => void
}) {
  if (rendering.kind === 'absent') {
    return <ProhibitionNotice rendering={{ kind: 'absent', note: rendering.note }} />
  }
  if (rendering.kind === 'disabled') {
    return (
      <Button variant="primary" disabledReason={rendering.reason}>
        {rendering.label}
      </Button>
    )
  }
  return (
    <Button variant="primary" onClick={onClick}>
      {rendering.label}
    </Button>
  )
}

export function PartsMiniForm({
  stepId,
  persona,
  references,
  registry,
  tenantState,
  onAdd,
  onCancel,
  draftName = '',
  ctx = STU10_DEFAULT_CONTEXT,
  seams = STU_SEAMS,
}: PartsMiniFormProps) {
  const add = partsAffordance('inline-add-a-part-through-the-mini-form', persona, 'Add', {
    ctx,
    tenantState,
    registryReachable: registry.reachable,
  })

  const seam = stuSeamById(seams, 'parts-registry')

  // FB-STU-07's first fallback is a DEGRADED seam, not a failed screen: the
  // author continues without a reference. STATE-06 is the applicable state
  // for a surface region that has gone read-only, and the applicability
  // table is the authority on whether it renders here — not a literal.
  const readOnly = add.kind === 'disabled' && screenRendersState('SCR-STU-04', 'STATE-06')

  return (
    <section aria-label={`Add a part to ${stepId}`} className="space-y-3">
      <h4 className="text-sm font-semibold text-[var(--color-ink)]">Add a part — {stepId}</h4>

      {readOnly ? (
        <ScreenStateBoundary
          state="STATE-06"
          surface="SURF-STU"
          detail={{ readOnlyCause: add.reason }}
        />
      ) : null}

      <Field label={PART_NAME_FIELD_LABEL} description={MINI_FORM_NOTE}>
        <input
          type="text"
          name="partName"
          defaultValue={draftName}
          aria-label={PART_NAME_FIELD_LABEL}
          readOnly={add.kind !== 'enabled'}
          className="w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] px-2 py-1 text-sm"
        />
      </Field>

      <div className="flex items-center gap-2">
        <Control rendering={add} onClick={() => onAdd(draftName)} />
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {/* Once added, the step shows the part name with a Skeletal badge that
          clears when the registry record is completed (L33176). */}
      {references.length > 0 ? (
        <ul aria-label={`Part references on ${stepId}`} className="space-y-1">
          {references.map((reference) => (
            <li key={reference.partId} className="flex items-center gap-2 text-sm">
              <span className="text-[var(--color-ink)]">{reference.name}</span>
              {reference.state === 'Skeletal' ? (
                <StatusPill tone="attention" icon="🧩" label="Skeletal" />
              ) : null}
              <span className="text-xs text-[var(--color-ink-subtle)]">{reference.partId}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p data-testid="no-references" className="text-sm text-[var(--color-ink-muted)]">
          {stepId} carries no part reference, and nothing requires it to. A part reference is
          optional per part; a step is never forced to carry one.
        </p>
      )}

      {/* ROW 4 — a cross-surface statement, never a control. */}
      <p data-testid="completion-cross-surface" className="text-sm text-[var(--color-ink)]">
        {STU_10_CROSS_SURFACE[0].statement}
      </p>

      {/* The seam, declared. Owner stated, no slice assigned. */}
      <StudioSeamNotice seam={seam} />

      {/* DEC-PARTSTUB-001 — unspecified in source, rendered as such. */}
      <Banner
        tone="info"
        heading={`${DEC_PARTSTUB_001.id} — ${DEC_PARTSTUB_001.status}`}
        body={
          `${DEC_PARTSTUB_001.question} ${DEC_PARTSTUB_001.whyItMatters} Options: ` +
          `${DEC_PARTSTUB_001.options.join(' ')} Recommendation: ${DEC_PARTSTUB_001.recommendation} ` +
          `${DEC_PARTSTUB_001.tradeOffs} Decision owner: ${DEC_PARTSTUB_001.decisionOwner}. ` +
          'No interval is applied by this build, because the source states none.'
        }
      />
    </section>
  )
}
