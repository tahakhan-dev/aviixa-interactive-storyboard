import type { ReactNode } from 'react'
import type { StudioPersonaColumn } from '@/studio/access/evaluate'
import { DecisionDisclosure } from '@/studio/disclosure/DecisionDisclosure'
import type { AtomicCapabilityRow } from '@/studio/modules/stu-01/capabilities'
import { NotAvailableLine } from '@/studio/modules/stu-01/NotAvailableLine'
import {
  DifficultyCoverage,
  type DraftingAidState,
} from '@/studio/modules/stu-09/DifficultyCoverage'
import { WHEEL_BOLT_SCREENS, cellsFor } from '@/studio/modules/stu-09/levels'
import {
  SEEDED_LIBRARY_REGISTER,
  itemById,
  resolvePointer,
  type LibraryRegister,
} from '@/studio/modules/stu-07/libraries'
import { PartsMiniForm } from '@/studio/modules/stu-10/PartsMiniForm'
import { stepReferences, type AuthoringDraft } from '@/studio/modules/stu-10/seam'
import type { PartsRegistrySeam } from '@/studio/seams/parts/registry'
import { STU_SEAMS, stuSeamById, type StudioSeamDefinition } from '@/studio/seams'
import type { TenantWriteState } from '@/surfaces/doh/tenant-state'
import { Button, LiveRegion, StatusPill } from '@/ui/primitives'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import { StudioSeamNotice } from '@/ui/stu/StudioSeamNotice'
import type { DifficultyLevel, Locale } from '@/studio/vocab'
import { actionBundlePreview, screenControls, stu05Scenario } from './rendering'
import {
  ARMING_PANEL_HEADING,
  ARMING_PANEL_STATEMENTS,
  SECTION_DEFINITIONS,
  blockingElements,
  screenConfigurationState,
  sectionDefinition,
  type ScreenConfiguration,
  type ScreenContext,
  type SectionState,
} from './sections'

/**
 * `SB-STU-08` (L32379), the configuration panel: "A vertical accordion with
 * nine numbered sections, each showing a completion indicator: complete,
 * incomplete with the missing element named, or not applicable with the
 * reason. Section 5 is absent unless measurement entry is selected. Sections
 * 8 and 9 are collapsed by default and labelled optional. Section 7 shows,
 * beneath the band editor, a live consequence preview … A footer states the
 * screen's state and, where Incomplete, lists every blocking element."
 *
 * ### IT COMPUTES NOTHING. IT IS HANDED `sections`.
 *
 * Nine sections is nine chances for a state fold applied to one render branch
 * while the others read the raw value — the shape that made one card
 * contradict itself two paragraphs apart. So this component cannot derive a
 * section's state at all: `sectionStates` runs ONCE in `./sections.ts`, the
 * result arrives as a prop, and the section list, the announcement, the
 * completion indicators and the footer all read that one array. A
 * contradiction between two branches is not prevented by care here; it is
 * unrepresentable.
 *
 * ### THE TWO MOUNTS
 *
 * `DifficultyCoverage` (`MOD-STU-09`) and `PartsMiniForm` (`MOD-STU-10`) are
 * FROZEN components with frozen prop contracts. Both are mounted, neither is
 * re-implemented, and both take the `persona` their contract requires — a
 * defaulted persona would be a policy default living inside a component.
 *
 * NO POLICY LIVES HERE. This file is under `src/studio/`, not `src/ui/`, and
 * every decision it renders was computed in `./rendering.ts`.
 */

/** The line the live region announces when Section 5 appears. */
export const SECTION_FIVE_ANNOUNCEMENT =
  'Section 5, Specification limits, is now shown: this screen captures a measurement.'

export interface ConfigurationPanelProps {
  readonly screen: ScreenConfiguration
  /** Derived ONCE by `sectionStates`. This component never re-derives it. */
  readonly sections: readonly SectionState[]
  /** The matrix column this reader resolves to. */
  readonly persona: StudioPersonaColumn
  /** The capability register, passed in. Never a module-load snapshot. */
  readonly capabilityRows: readonly AtomicCapabilityRow[]
  /** `MOD-STU-10`'s draft, holding the work-instruction steps. */
  readonly partsDraft: AuthoringDraft
  readonly partsRegistry: PartsRegistrySeam
  readonly onOpenLevel: (level: DifficultyLevel, locale: Locale) => void
  readonly onAddPart: (name: string) => void
  readonly onCancelPart: () => void
  readonly draftingAid?: DraftingAidState
  readonly tenantState?: TenantWriteState
  readonly ctx?: ScreenContext
  /** The seam register, passed in. Never a module-load snapshot. */
  readonly seams?: readonly StudioSeamDefinition[]
  /**
   * `MOD-STU-07`'s register, passed in. Sections 6 and 7 hold POINTERS, never
   * copies, so the name an author reads here is resolved from the library at
   * render time — which is the whole point of a pointer.
   */
  readonly register?: LibraryRegister
  /** The route to the Atomic Capabilities view, where this reader may reach it. */
  readonly capabilitiesHref?: string | null
}

/**
 * `SB-STU-08`'s three completion indicators. The icon is decorative and the
 * label carries the meaning, so the indicator never communicates by colour
 * alone.
 */
const COMPLETION_TONE = {
  complete: 'ok',
  incomplete: 'blocked',
  'not-applicable': 'neutral',
} as const

const COMPLETION_ICON = {
  complete: '✓',
  incomplete: '!',
  'not-applicable': '–',
} as const

const COMPLETION_LABEL = {
  complete: 'Complete',
  incomplete: 'Incomplete',
  'not-applicable': 'Not applicable',
} as const

/**
 * `SB-STU-04`'s who-to-ask sentence. Rendered ALWAYS, because nobody in this
 * build is established as permitted to enable a capability —
 * `DEC-CAPAUTH-001` is open — so the question is genuinely unanswered.
 */
const WHO_TO_ASK =
  'Ask your Tenant Admin. Who may enable a capability is DEC-CAPAUTH-001, which the source leaves open.'

function Control({ affordance }: { readonly affordance: ReturnType<typeof screenControls>[number]['affordance'] }) {
  switch (affordance.kind) {
    case 'enabled':
      return <Button variant="secondary">{affordance.label}</Button>
    case 'disabled':
      return (
        <ProhibitionNotice
          rendering={{ kind: 'disabled-with-reason', label: affordance.label, reason: affordance.reason }}
        />
      )
    case 'decision-open':
      return (
        <p role="note">
          {affordance.label} — {affordance.openDecision}. {affordance.note}
        </p>
      )
    default:
      // `Explicitly prohibited` carries no rendering: a note where a control
      // would be, never a disabled button that implies a condition could
      // one day become true.
      return <ProhibitionNotice rendering={{ kind: 'absent', note: affordance.note }} />
  }
}

function SectionShell({
  state,
  children,
}: {
  readonly state: SectionState
  readonly children?: ReactNode
}) {
  const definition = sectionDefinition(state.section)
  return (
    <section
      data-section-ordinal={state.ordinal}
      data-testid={`section-${state.ordinal}`}
      aria-label={`Section ${state.ordinal} — ${state.section}`}
      className="border-t border-[var(--color-border)] py-4"
    >
      <div className="flex flex-wrap items-baseline gap-3">
        <h3 className="text-base font-semibold">
          {state.ordinal}. {state.section}
        </h3>
        <StatusPill
          tone={COMPLETION_TONE[state.completion]}
          icon={COMPLETION_ICON[state.completion]}
          label={COMPLETION_LABEL[state.completion]}
        />
        {state.optional ? (
          <span className="text-xs uppercase tracking-wide text-[var(--color-ink-subtle)]">
            Optional — collapsed by default
          </span>
        ) : null}
      </div>
      <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
        {definition.configures} — serves {definition.capabilityServed}.
      </p>
      {state.missingElements.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm text-[var(--color-status-blocked)]">
          {state.missingElements.map((element) => (
            <li key={element}>Missing: {element}</li>
          ))}
        </ul>
      ) : null}
      {state.visibility === 'frozen-read-only' ? (
        <p role="note" className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {state.reason}
        </p>
      ) : null}
      {state.visibility === 'rendered' || state.visibility === 'frozen-read-only' ? (
        <div className="mt-3 space-y-3">{children}</div>
      ) : null}
    </section>
  )
}

export function ConfigurationPanel({
  screen,
  sections,
  persona,
  capabilityRows,
  partsDraft,
  partsRegistry,
  onOpenLevel,
  onAddPart,
  onCancelPart,
  draftingAid = 'available',
  tenantState = 'active',
  ctx,
  seams = STU_SEAMS,
  register = SEEDED_LIBRARY_REGISTER,
  capabilitiesHref = '/studio/capabilities/',
}: ConfigurationPanelProps) {
  const scenario = stu05Scenario({ ...(ctx ?? {}), persona })
  const controls = screenControls(scenario)
  const blocking = blockingElements(sections)
  const state = screenConfigurationState(sections)
  const bundleSeam = stuSeamById(seams, 'severity-action-bundle-editor')

  // The difficulty model seeds the eight measurement screens of L32525. A
  // screen it does not seed renders a stated absence rather than an empty
  // strip — and the covering test pins the strip on a screen it DOES seed, so
  // a fixture that stopped seeding them turns that test red rather than
  // quietly drawing this line everywhere.
  const difficultyModel = WHEEL_BOLT_SCREENS.find((s) => s.screenId === screen.screenId)

  // A PARTIAL LIST IS REFUSED RATHER THAN DRAWN. All nine states are derived
  // together; a shorter array would let this panel draw a screen whose
  // sections and whose footer disagree, which is the shape that made one card
  // contradict itself two paragraphs apart.
  if (sections.length !== SECTION_DEFINITIONS.length) {
    throw new Error(
      `MOD-STU-05: the panel was handed ${sections.length} section states, not ` +
        `${SECTION_DEFINITIONS.length}. Every branch of this panel reads that one array, so a ` +
        'partial list is a contradiction waiting to render rather than a smaller panel.',
    )
  }

  const controlFor = (id: (typeof controls)[number]['id']) => controls.find((c) => c.id === id)

  return (
    <div data-testid="configuration-panel" className="space-y-2">
      <header>
        <h2 className="text-xl font-semibold">{screen.name}</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          One screen in the Builder corresponds to exactly one screen on the worker&rsquo;s device
          and one unit of execution telemetry. There is no intermediate sub-screen construct
          (L32201).
        </p>
      </header>

      {/* The announcement, not a silent appearance. */}
      <LiveRegion politeness="polite">
        {sections.some((s) => s.announced && s.visibility === 'rendered')
          ? SECTION_FIVE_ANNOUNCEMENT
          : ''}
      </LiveRegion>

      {sections.map((section) => {
        if (section.visibility === 'not-available') {
          return (
            <NotAvailableLine
              key={section.ordinal}
              section={section.section}
              reason={section.reason ?? ''}
              viewHref={capabilitiesHref}
              whoToAsk={WHO_TO_ASK}
            />
          )
        }
        if (section.visibility === 'absent-for-input-type') {
          // ABSENT means absent. No region, no controls, no blocking element —
          // and the reason is stated once, where the section would have been.
          return (
            <p
              key={section.ordinal}
              role="note"
              data-testid={`absent-${section.ordinal}`}
              className="border-l-2 border-[var(--color-border-strong)] py-1 pl-3 text-sm text-[var(--color-ink-muted)]"
            >
              <span className="font-medium text-[var(--color-ink)]">{section.section}</span>
              {' — '}
              {section.reason}
            </p>
          )
        }

        return (
          <SectionShell key={section.ordinal} state={section}>
            {section.ordinal === 1 ? (
              <>
                <p className="text-sm">
                  {screen.content.blockTitle === null ? null : (
                    <span className="font-medium">
                      Shared Instruction Block: {screen.content.blockTitle} —{' '}
                    </span>
                  )}
                  {screen.content.note}
                </p>
                {difficultyModel === undefined ? (
                  <p role="note" className="text-sm text-[var(--color-ink-muted)]">
                    No difficulty renderings are seeded for this screen, so the coverage strip has
                    nothing to report. It is stated rather than drawn empty.
                  </p>
                ) : (
                  <DifficultyCoverage
                    screenId={screen.screenId}
                    declaredLocales={['English', 'Spanish']}
                    cells={cellsFor(difficultyModel)}
                    onOpen={onOpenLevel}
                    persona={persona}
                    draftingAid={draftingAid}
                    seams={seams}
                  />
                )}
                <PartsMiniForm
                  stepId={screen.stepId}
                  persona={persona}
                  references={stepReferences(partsDraft, screen.stepId)}
                  registry={partsRegistry}
                  tenantState={tenantState}
                  onAdd={onAddPart}
                  onCancel={onCancelPart}
                  seams={seams}
                />
                <Control affordance={controlFor('author-sections-one-through-nine')!.affordance} />
              </>
            ) : null}

            {section.ordinal === 2 ? (
              <>
                <p className="text-sm">Capture type: {screen.inputType}</p>
                <Control affordance={controlFor('choose-the-input-type')!.affordance} />
                <DecisionDisclosure id="D19" />
              </>
            ) : null}

            {section.ordinal === 3 ? (
              <p className="text-sm">
                Maximum {screen.timing.maximumSeconds} seconds, minimum{' '}
                {screen.timing.minimumSeconds} seconds, coaching trigger at{' '}
                {screen.timing.triggerPercent} per cent
                {screen.timing.triggerInherited ? ', inherited from the Workflow default' : ''}.
              </p>
            ) : null}

            {section.ordinal === 4 ? (
              <>
                <p className="text-sm">
                  {screen.gate === 'hard' ? 'Hard gate' : 'Soft gate'} — this authored choice
                  governs proof capture only. A soft proof gate never softens the specification
                  gate, which is hard platform-wide (L32236).
                </p>
                <Control affordance={controlFor('set-a-hard-or-soft-proof-gate')!.affordance} />
                <Control
                  affordance={controlFor('soften-the-platform-specification-gate')!.affordance}
                />
              </>
            ) : null}

            {section.ordinal === 5 && screen.limits !== null ? (
              <p className="text-sm">
                Lower {screen.limits.lower}, upper {screen.limits.upper}, unit{' '}
                {screen.limits.unit}, drawing {screen.limits.drawingReference}.
              </p>
            ) : null}

            {section.ordinal === 6 ? (
              <ul className="space-y-1 text-sm">
                {screen.coachingDefaults.map((designation) => {
                  // The screen holds a POINTER, never a copy, so the name is
                  // resolved from the corpus here. An unresolvable pointer is
                  // NAMED rather than falling back to the raw identifier — a
                  // silent fallback is how a rotted pointer keeps looking fine.
                  const item = itemById(register, designation.itemId)
                  return (
                    <li key={designation.locale}>
                      {designation.locale}:{' '}
                      {item === undefined
                        ? `${designation.itemId} — unresolvable in the approved corpus`
                        : item.name}
                    </li>
                  )
                })}
              </ul>
            ) : null}

            {section.ordinal === 7 ? (
              <>
                <ul className="space-y-2 text-sm">
                  {screen.severityBands.map((band) => {
                    const preview = actionBundlePreview(band.level, seams)
                    const checklist = resolvePointer(register, screen.screenId, 'containment-checklist')
                    return (
                      <li key={band.band}>
                        <span className="font-medium">{band.band}</span> → {band.level}.{' '}
                        {preview.platformFloor}
                        {checklist === null ? '' : ` Containment: ${checklist.name}.`}
                      </li>
                    )
                  })}
                </ul>
                <div
                  role="note"
                  data-testid="arming-panel"
                  className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-3 text-sm"
                >
                  <p className="font-semibold">{ARMING_PANEL_HEADING}</p>
                  <ul className="mt-1 space-y-1">
                    {ARMING_PANEL_STATEMENTS.map((statement) => (
                      <li key={statement}>{statement}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[var(--color-ink-muted)]">
                    The author confirms explicitly and the confirmation is recorded with the
                    authored band. If it cannot be recorded, the mapping is not saved
                    (FUNC-STU-05-08-C-1, L32313).
                  </p>
                </div>
                <Control affordance={controlFor('map-a-band-to-a-catalog-level')!.affordance} />
                <Control affordance={controlFor('define-a-new-severity-level')!.affordance} />
                <StudioSeamNotice seam={bundleSeam} />
                <DecisionDisclosure id="D23" />
              </>
            ) : null}

            {section.ordinal === 8 ? (
              <>
                <p className="text-sm">
                  {screen.tool === null
                    ? 'No tool is required on this screen.'
                    : `${screen.tool.tool}${screen.tool.barcodeScanRequired ? ', barcode scan required to unlock' : ''}${screen.tool.calibrationConfirmationRequired ? ', calibration confirmation required' : ''}.`}
                </p>
                <div
                  role="note"
                  data-testid="unspecified-in-source"
                  className="rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] p-3 text-sm"
                >
                  <p className="font-medium">Unspecified in source — DEC-SCAN-001</p>
                  <p className="mt-1 text-[var(--color-ink-muted)]">
                    The scanner hardware list the target floors actually use is owed by the client
                    (L32251). This build applies no scanner list, because the source states none: a
                    tool-barcode requirement can be authored here and whether a deployed scanner can
                    read it is an open dependency that must be confirmed before go-live. An
                    authored requirement no scanner can read would block a screen on the floor,
                    which is why the dependency is material rather than incidental.
                  </p>
                </div>
              </>
            ) : null}

            {section.ordinal === 9 ? (
              <>
                <p className="text-sm">
                  {screen.qualificationOverride === null
                    ? 'No screen-level certification above the Workflow baseline.'
                    : `${screen.qualificationOverride.certification}, above the Workflow baseline.`}
                </p>
                <Control
                  affordance={controlFor('add-a-screen-level-qualification-override')!.affordance}
                />
              </>
            ) : null}
          </SectionShell>
        )
      })}

      <footer
        data-testid="panel-footer"
        className="border-t border-[var(--color-border-strong)] pt-4"
      >
        <p className="text-sm font-medium">Screen state: {state}</p>
        {blocking.length === 0 ? (
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Every mandatory element for this input type is present.
          </p>
        ) : (
          <ul className="mt-1 space-y-1 text-sm text-[var(--color-status-blocked)]">
            {blocking.map((element) => (
              <li key={element}>{element}</li>
            ))}
          </ul>
        )}
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          Publication is blocked while any screen in the Workflow is Incomplete (L32277). Validation
          on this surface refuses rather than warns.
        </p>
      </footer>

      <p className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
        {capabilityRows.length} atomic capabilities were read to decide which sections appear.
        Configuration follows capability: no section exists for its own sake, and disabling a
        capability removes exactly the sections whose arrows point at it (L32377).
      </p>
    </div>
  )
}
