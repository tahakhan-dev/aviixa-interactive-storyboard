import type { ReactNode } from 'react'
import { DecisionDisclosure } from '@/studio/disclosure/DecisionDisclosure'
import { STU_OWNED_SEAMS } from '@/studio/seams'
import { STU_APPLICABLE_STATES, screenRendersState } from '@/studio/state/screen-states'
import { studioConnectivityTreatment } from '@/studio/state/connectivity'
import { Button, Select, StatusPill } from '@/ui/primitives'
import { ScreenStateBoundary } from '@/ui/ScreenStateBoundary'
import { screenState } from '@/ui/screen-state'
import type { CapabilityAffordance } from '@/studio/modules/stu-18/rendering'
import {
  DEFAULT_LABELS,
  PLATFORM_DEVIATION_CAPTURE_SCREEN,
  SETTING_LABELS,
  gateFailureTarget,
  isInheritedByScreens,
  type ForkGuidance,
  type PreviewStep,
  type StructuralFinding,
  type WorkflowDraft,
} from './workflow'
import type {
  BuilderControl,
  CanvasOpen,
  ReadableWorkflows,
  TargetOption,
  ValidationPanel,
} from './rendering'
import { SEVERITY_PROHIBITION_NOTE } from './rendering'

/**
 * `SB-STU-07` (L32144) — the canvas, as three panels.
 *
 * *"A left panel holds the four Workflow settings and the two inheritable
 * defaults, each labelled with whether it is inherited by screens. The
 * centre holds the node graph with drag-to-reorder and click-to-configure. A
 * right panel holds structural validation results as a live list … Each
 * validation item names the specific screen and is clickable. A Preview
 * Sequence control walks the graph in worker order. The panel's heading
 * states plainly: 'This drawing is also the sequence-detection reference
 * used at run time.'"*
 *
 * THE POLICY IS NOT HERE. Every affordance arrives from `builderControls`,
 * which asks task 1's evaluator once per control over that control's own
 * matrix row. This component is handed finished answers and draws them.
 *
 * DRAG IS THE ALTERNATIVE, NOT THE ROUTE. L48332 requires the canvas to be
 * *"operable without a pointing device, with branch targets selectable from
 * a list as well as by drag"*. So reordering is two buttons per node and
 * every branch target is a `<select>`; a pointer is never the only way to
 * reach anything here.
 */

export interface BuilderViewProps {
  readonly canvas: CanvasOpen
  readonly workflow: WorkflowDraft | null
  readonly controls: readonly BuilderControl[]
  readonly validation: ValidationPanel
  readonly findings: readonly StructuralFinding[]
  readonly guidance: ForkGuidance
  readonly preview: readonly PreviewStep[] | null
  readonly selectedNodeId: string | null
  readonly escalationTemplates: readonly TargetOption[]
  /** What this persona may READ in this workspace, and what it may not. */
  readonly readable: ReadableWorkflows
  readonly submissionReason: string
  readonly submissionOpen: boolean
  readonly lastMessage: string | null
  readonly onSelectNode: (nodeId: string) => void
  readonly onAct: (controlId: string, argument: string) => void
}

function controlById(
  controls: readonly BuilderControl[],
  id: string,
): BuilderControl | undefined {
  return controls.find((control) => control.id === id)
}

function Affordance({
  affordance,
  onRun,
  children,
}: {
  readonly affordance: CapabilityAffordance
  readonly onRun: () => void
  readonly children?: ReactNode
}) {
  if (affordance.kind === 'enabled') {
    return (
      <span className="inline-flex flex-wrap items-center gap-2">
        {children}
        <Button onClick={onRun}>{affordance.label}</Button>
      </span>
    )
  }
  if (affordance.kind === 'disabled') {
    return <Button disabledReason={affordance.reason}>{affordance.label}</Button>
  }
  if (affordance.kind === 'decision-open') {
    return (
      <p role="note" className="max-w-prose text-sm text-[var(--color-ink-muted)]">
        <span className="font-medium text-[var(--color-ink)]">{affordance.label}: </span>
        {affordance.note} No control is offered while {affordance.openDecision} is open — an
        offered control would assert the access the decision has not granted.
      </p>
    )
  }
  // `Explicitly prohibited` carries no rendering anywhere in the source: a
  // note sits where a control would be, never a control that refuses.
  return (
    <p role="note" className="max-w-prose text-sm text-[var(--color-ink-subtle)]">
      {affordance.note}
    </p>
  )
}

export function BuilderView(props: BuilderViewProps) {
  const {
    canvas,
    workflow,
    controls,
    validation,
    findings,
    guidance,
    preview,
    selectedNodeId,
    escalationTemplates,
    readable,
    submissionReason,
    submissionOpen,
    lastMessage,
    onSelectNode,
    onAct,
  } = props

  if (!canvas.ok || workflow === null) {
    return (
      <div className="space-y-6">
        <section
          role="note"
          aria-label="Canvas not opened"
          className="rounded-[var(--radius-surface)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-4"
        >
          <h2 className="text-base font-semibold text-[var(--color-ink)]">
            This canvas is not open to you
          </h2>
          <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">{canvas.cause}</p>
          <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-subtle)]">
            Nothing was loaded. Draft and in-review Workflows are invisible to roles without the
            authoring grant and outside the approval chain (AC-STU-048, AC-STU-151), so this is a
            read that did not happen rather than an editor that was disabled.
          </p>
        </section>
        <ReadableScope readable={readable} />
        <DecisionDisclosure id="D3" />
      </div>
    )
  }

  const readOnly = !canvas.editable

  return (
    <div className="space-y-6">
      <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
        {canvas.cause}
      </p>

      <ReadableScope readable={readable} />

      {readOnly ? (
        <p
          role="note"
          className="max-w-prose rounded-[var(--radius-surface)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-3 text-sm text-[var(--color-ink-muted)]"
        >
          This is the rendered published version, with no editing affordances — not a disabled
          editor. A read-only user cannot construct an edit request from this client (L32171).
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)_minmax(0,22rem)]">
        {/* ---------------- LEFT: settings and the two defaults ---------------- */}
        <section aria-labelledby="stu04-settings" className="space-y-4">
          <h2 id="stu04-settings" className="text-base font-semibold text-[var(--color-ink)]">
            Workflow settings and defaults
          </h2>
          <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
            Four settings and <strong>exactly two</strong> inheritable defaults. Deviation severity
            is never a workflow default.
          </p>

          <ul className="space-y-4">
            {controls
              .filter((control) => control.setting !== null)
              .map((control) => (
                <li key={control.id}>
                  <p className="text-sm font-medium text-[var(--color-ink)]">
                    {SETTING_LABELS[control.setting!]}
                  </p>
                  <p className="text-sm text-[var(--color-ink)]">
                    {formatSetting(workflow.settings[control.setting!])}
                  </p>
                  <p className="text-xs text-[var(--color-ink-subtle)]">
                    {isInheritedByScreens(control.setting!)
                      ? 'Inherited by screens'
                      : 'Not inherited by screens — Workflow identity and scope'}
                  </p>
                  <Affordance
                    affordance={control.affordance}
                    onRun={() => onAct(control.id, '')}
                  />
                </li>
              ))}

            {controls
              .filter((control) => control.inheritableDefault !== null)
              .map((control) => (
                <li key={control.id}>
                  <p className="text-sm font-medium text-[var(--color-ink)]">
                    {DEFAULT_LABELS[control.inheritableDefault!]}
                  </p>
                  <p className="text-xs text-[var(--color-ink-subtle)]">
                    Inherited by screens unless a screen overrides it
                  </p>
                  {control.inheritableDefault === 'default-escalation-routing-template' &&
                  control.affordance.kind === 'enabled' ? (
                    <Select
                      label="Escalation routing template"
                      options={escalationTemplates.map((option) => ({
                        value: option.id,
                        label: option.label,
                      }))}
                      value={String(workflow.defaults[control.inheritableDefault] ?? '')}
                      onChange={(value) => onAct(control.id, value)}
                    />
                  ) : (
                    <p className="text-sm text-[var(--color-ink)]">
                      {String(workflow.defaults[control.inheritableDefault!] ?? 'Not set')}
                    </p>
                  )}
                  <Affordance
                    affordance={control.affordance}
                    onRun={() => onAct(control.id, defaultArgumentFor(control, escalationTemplates))}
                  />
                </li>
              ))}
          </ul>

          <p
            role="note"
            data-testid="stu04-severity-prohibition"
            className="max-w-prose rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] p-3 text-sm text-[var(--color-ink-subtle)]"
          >
            {SEVERITY_PROHIBITION_NOTE}
          </p>
        </section>

        {/* ---------------- CENTRE: the node graph ---------------- */}
        <section aria-labelledby="stu04-canvas" className="space-y-4">
          <h2 id="stu04-canvas" className="text-base font-semibold text-[var(--color-ink)]">
            The canvas — {workflow.nodes.length} screens in worker order
          </h2>
          <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
            {validation.heading} The drawing is not documentation. It is the rule.
          </p>

          <ol className="space-y-3">
            {workflow.nodes.map((node, index) => {
              const branches = workflow.branches.filter((branch) => branch.from === node.id)
              const gate = gateFailureTarget(workflow, node.id)
              return (
                <li
                  key={node.id}
                  className={`rounded-[var(--radius-surface)] border p-3 ${
                    node.id === selectedNodeId
                      ? 'border-[var(--color-primary)]'
                      : 'border-[var(--color-border)]'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectNode(node.id)}
                      className="text-sm font-medium text-[var(--color-ink)] underline"
                    >
                      {index + 1}. {node.name}
                    </button>
                    <StatusPill tone="neutral" icon="▢" label={node.kind} />
                    <span className="text-xs text-[var(--color-ink-subtle)]">{node.id}</span>
                  </div>

                  <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                    {branches.length === 0
                      ? 'No branch drawn — the worker continues to the next screen in this order.'
                      : branches
                          .map((branch) => `${branch.condition} → ${branch.to}`)
                          .join(' · ')}
                    {gate === null
                      ? ' No gate on this screen.'
                      : ` Gate failure → ${gate}${
                          gate === PLATFORM_DEVIATION_CAPTURE_SCREEN
                            ? ' (platform standard, carried in the offline package)'
                            : ' (per-screen override)'
                        }.`}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Affordance
                      affordance={controlById(controls, 'canvas:move-earlier')!.affordance}
                      onRun={() => onAct('canvas:move-earlier', node.id)}
                    />
                    <Affordance
                      affordance={controlById(controls, 'canvas:move-later')!.affordance}
                      onRun={() => onAct('canvas:move-later', node.id)}
                    />
                    <Affordance
                      affordance={controlById(controls, 'canvas:remove')!.affordance}
                      onRun={() => onAct('canvas:remove', node.id)}
                    />
                  </div>

                  {controlById(controls, 'canvas:branch')!.affordance.kind === 'enabled' ? (
                    <div className="mt-2">
                      <Select
                        label={`Branch target from ${node.id}`}
                        options={[
                          { value: '', label: 'Select a branch target…' },
                          ...controlById(controls, 'canvas:branch')!
                            .targetOptions(workflow)
                            .filter((option) => option.id !== node.id)
                            .map((option) => ({ value: option.id, label: option.label })),
                        ]}
                        value=""
                        onChange={(value) => {
                          if (value === '') return
                          onSelectNode(node.id)
                          onAct('canvas:branch', `${node.id}|${value}`)
                        }}
                      />
                    </div>
                  ) : null}

                  {node.gated &&
                  controlById(controls, 'canvas:gate-failure')!.affordance.kind === 'enabled' ? (
                    <div className="mt-2">
                      <Select
                        label={`Gate-failure target on ${node.id}`}
                        options={controlById(controls, 'canvas:gate-failure')!
                          .targetOptions(workflow)
                          .filter((option) => option.id !== node.id)
                          .map((option) => ({ value: option.id, label: option.label }))}
                        value={gate ?? PLATFORM_DEVIATION_CAPTURE_SCREEN}
                        onChange={(value) => onAct('canvas:gate-failure', `${node.id}|${value}`)}
                      />
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ol>

          <div className="flex flex-wrap items-center gap-2">
            <Affordance
              affordance={controlById(controls, 'canvas:add')!.affordance}
              onRun={() => onAct('canvas:add', '')}
            />
            <Affordance
              affordance={controlById(controls, 'canvas:preview')!.affordance}
              onRun={() => onAct('canvas:preview', '')}
            />
          </div>

          {preview === null ? null : (
            <ol
              data-testid="stu04-preview"
              className="space-y-1 rounded-[var(--radius-surface)] border border-[var(--color-border)] p-3 text-sm"
            >
              {preview.map((step) => (
                <li key={step.nodeId}>
                  <span className="font-medium text-[var(--color-ink)]">
                    {step.position}. {step.name}
                  </span>{' '}
                  <span className="text-xs text-[var(--color-ink-subtle)]">
                    arrives via {step.arrivedVia}
                  </span>
                </li>
              ))}
            </ol>
          )}

          <p
            role="note"
            className="max-w-prose rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] p-3 text-sm text-[var(--color-ink-subtle)]"
          >
            {guidance.message} The depth this build treats as reasonable is {guidance.threshold};
            the source says only &ldquo;a reasonable branch depth&rdquo; and names no number, so
            that figure is a client-delegated choice under APP-012 and never blocks.
          </p>

          {lastMessage === null ? null : (
            <p
              data-testid="write-outcome"
              role="status"
              className="max-w-prose rounded-[var(--radius-surface)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-3 text-sm"
            >
              {lastMessage}
            </p>
          )}
        </section>

        {/* ---------------- RIGHT: the live validation list ---------------- */}
        <section aria-labelledby="stu04-validation" className="space-y-4">
          <h2 id="stu04-validation" className="text-base font-semibold text-[var(--color-ink)]">
            {validation.heading}
          </h2>

          <ul className="space-y-2">
            {findings.map((finding) => (
              <li key={`${finding.kind}:${finding.element}`}>
                {finding.screenId === null ? (
                  <p className="text-sm text-[var(--color-ink-muted)]">{finding.message}</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectNode(finding.screenId!)}
                    className="text-left text-sm text-[var(--color-ink)] underline"
                  >
                    {finding.element} — {finding.message}
                  </button>
                )}
              </li>
            ))}
            {findings.length === 0 ? (
              <li className="text-sm text-[var(--color-ink-muted)]">
                Structurally valid: every node reachable, every branch target resolvable, exactly
                one entry point.
              </li>
            ) : null}
          </ul>

          <h3 className="text-sm font-semibold text-[var(--color-ink)]">
            The eleven publish-time checks
          </h3>
          <ul className="space-y-2 text-sm">
            {validation.items.map((item) => (
              <li key={item.checkId}>
                <span className="font-medium text-[var(--color-ink)]">
                  {item.ordinal}. {item.name}
                </span>{' '}
                <StatusPill
                  tone={item.kind === 'passed' ? 'ok' : 'blocked'}
                  icon={item.kind === 'passed' ? '✓' : '✕'}
                  label={item.kind}
                />
                <span className="block text-xs text-[var(--color-ink-subtle)]">
                  {item.implementedHere
                    ? `Implemented here. ${item.element}`
                    : `Owned by ${item.ownerModules.join(', ')} — not implemented on this surface yet, so it cannot run and publication stays blocked. ${item.sourceRef}`}
                </span>
              </li>
            ))}
          </ul>

          <p
            role="status"
            data-testid="stu04-submission"
            className="max-w-prose rounded-[var(--radius-surface)] border border-[var(--color-border)] p-3 text-sm text-[var(--color-ink-muted)]"
          >
            {submissionOpen ? 'Submission is open. ' : 'Submission is refused. '}
            {submissionReason}
          </p>
        </section>
      </div>

      <PackagedFailurePath />
      <ScreenStatePanel />
      <DecisionDisclosure id="D3" />
    </div>
  )
}

/**
 * SCOPE, AS WHAT THIS VIEW READ — not as what it drew.
 *
 * The count is of the Workflows that actually reached this component, and
 * the withheld count is of the ones that never did. A list that loaded every
 * draft and then hid some would already have put them in the response, which
 * is the difference `AC-STU-048` and `AC-STU-151` are about.
 */
function ReadableScope({ readable }: { readonly readable: ReadableWorkflows }) {
  return (
    <p
      role="status"
      data-testid="stu04-readable-scope"
      className="max-w-prose text-sm text-[var(--color-ink-subtle)]"
    >
      {readable.workflows.length} Workflow
      {readable.workflows.length === 1 ? '' : 's'} were read into this view.{' '}
      {readable.withheldReason === null
        ? 'Nothing in this workspace was withheld from it.'
        : `${readable.withheldCount} was not read at all: ${readable.withheldReason}`}
    </p>
  )
}

/**
 * `AC-STU-057`'s second half — *"and that form is present in the offline
 * package"*. The package manifest is a seam this slice OWNS and slice 8
 * consumes; the sentence below is derived from that registry row rather than
 * from a duplicated list of package contents, so a rename or a removal over
 * there goes red here rather than leaving this screen pointing at nothing.
 */
function PackagedFailurePath() {
  const manifest = STU_OWNED_SEAMS.find((seam) => seam.id === 'work-package-definition-and-manifest')
  return (
    <section
      aria-labelledby="stu04-package"
      className="rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4"
    >
      <h2 id="stu04-package" className="text-base font-semibold text-[var(--color-ink)]">
        The default failure path works with no connectivity
      </h2>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        A gated screen with no drawn failure path routes to the {PLATFORM_DEVIATION_CAPTURE_SCREEN},
        and the platform deviation-capture forms travel inside the work package — which is why the
        author does not draw a failure path on every gated screen.
      </p>
      {manifest === undefined ? (
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-subtle)]">
          The work-package manifest contract is not registered on this build, so nothing here can
          claim the form is packaged.
        </p>
      ) : (
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-subtle)]">
          {manifest.name} — {manifest.contract} Owned in this slice; consumed by slices{' '}
          {manifest.consumingSlices.join(' and ')} ({manifest.sourceRef}).
        </p>
      )}
    </section>
  )
}

/**
 * Task 2's applicability table, read rather than restated. `SCR-STU-03`
 * renders the contract defaults and none of L48330's four departures: the
 * source attaches the queued-publication state and both drafting-aid states
 * to `SCR-STU-04` and `SCR-STU-11`, not to the canvas. That is the source's
 * own assignment and it is rendered as it stands.
 */
function ScreenStatePanel() {
  const reconnect = studioConnectivityTreatment({ kind: 'reconnect' })
  return (
    <section
      aria-labelledby="stu04-states"
      className="rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4"
    >
      <h2 id="stu04-states" className="text-base font-semibold text-[var(--color-ink)]">
        Screen states this canvas renders
      </h2>
      <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
        {STU_APPLICABLE_STATES.filter((row) => screenRendersState('SCR-STU-03', row.id)).map(
          (row) => (
            <li key={row.id}>
              <span className="font-medium text-[var(--color-ink)]">
                {row.id} {screenState(row.id).name}
              </span>
              {row.departure === null ? '' : ` — ${row.departure}`}
            </li>
          ),
        )}
      </ul>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-subtle)]">
        {reconnect.reason} Nothing on this surface queues a write, so a lost connection disables
        submission rather than holding it for later.
      </p>
      <div className="mt-3">
        <ScreenStateBoundary
          state="STATE-08"
          surface="SURF-STU"
          detail={{
            asOfLabel: 'as at the last successful read of this drawing',
            originLabel: 'the tenant workspace, read through the Studio',
          }}
        />
      </div>
    </section>
  )
}

function formatSetting(value: unknown): string {
  if (value === null || value === undefined) return 'Not set'
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

function defaultArgumentFor(
  control: BuilderControl,
  templates: readonly TargetOption[],
): string {
  if (control.inheritableDefault === 'default-escalation-routing-template') {
    return templates[0]?.id ?? ''
  }
  return ''
}
