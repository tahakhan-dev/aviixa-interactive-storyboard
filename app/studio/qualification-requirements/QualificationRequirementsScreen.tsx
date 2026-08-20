'use client'

import { useState } from 'react'
import { STU_MODULES, stuModuleById, type StudioPersonaId } from '@/studio/modules'
import { DecisionDisclosure } from '@/studio/disclosure/DecisionDisclosure'
import {
  VALIDATION_POINTS,
  addOverride,
  applyRequirementChange,
  baselineFor,
  clearanceEffective,
  confirmContinuation,
  crossSurfaceStatements,
  crossWorkflowRequirements,
  editBaseline,
  parkOnGateBlock,
  postureBanner,
  qualificationControls,
  readTenantPosture,
  reapplyTag,
  stu13PublishRegister,
  stu13Scenario,
  unmaintainedOverrides,
  type Assignment,
  type QualificationControl,
  type QualificationRequirement,
} from '@/studio/modules/stu-13/qualifications'
import { evaluatePublish } from '@/studio/publish/register'
import { COMMAND_STATES, type CommandState } from '@/studio/vocab'
import { StudioSeamNotice } from '@/ui/stu/StudioSeamNotice'
import { Banner, Button, Select, StatusPill, Table, Tabs } from '@/ui/primitives'
import { StudioShell } from '../StudioShell'
import {
  BRIGHT_BIKES_ASSIGNMENTS,
  BRIGHT_BIKES_RUNS,
  BRIGHT_BIKES_TAG_MAPPING,
  MAINTAINED_CERTIFICATIONS,
  OTHER_WORKSPACE_REQUIREMENTS,
  OVERRIDE_SCREENS,
  PNEUMATIC_CERTIFICATION,
  PUBLISHED_AT,
  SEEDED_POSTURE,
  TORQUE_CERTIFICATION,
  WHEEL_BOLT_WORKFLOW,
} from './fixtures'

const MODULE = stuModuleById(STU_MODULES, 'MOD-STU-13')

const TABS = [
  { id: 'requirements', label: 'This Workflow' },
  { id: 'cross-workflow', label: 'Cross-Workflow' },
  { id: 'grandfathering', label: 'Grandfathering' },
  { id: 'elsewhere', label: 'Held elsewhere' },
] as const

const OVERRIDE_OPTIONS = [
  ...OVERRIDE_SCREENS.map((s) => ({ value: s.screenId, label: s.screenId })),
]

const CERTIFICATION_OPTIONS = [
  ...MAINTAINED_CERTIFICATIONS.map((c) => ({ value: c, label: c })),
  // Deliberately offerable: publish check 8 exists to refuse this, and a
  // reviewer who cannot reach the refusal cannot see the check work.
  { value: 'Retired Cert X', label: 'Retired Cert X — no longer maintained' },
]

/**
 * ONE rendering for one control, so the four-token rule is applied once
 * rather than four times with four chances to differ.
 *
 * `absent` draws a NOTE where a control would be and never a disabled
 * button: `Explicitly prohibited` carries no rendering anywhere in the
 * source, and a disabled button would imply a condition that could one day
 * become true. `decision-open` names the decision rather than folding into
 * the same disabled button as a stated condition.
 *
 * It decides nothing — it is handed an affordance the module computed.
 */
function ControlButton({
  control,
  children,
  variant = 'primary',
  onClick,
}: {
  readonly control: QualificationControl
  readonly children: string
  readonly variant?: 'primary' | 'secondary'
  readonly onClick: () => void
}) {
  const affordance = control.affordance
  if (affordance.kind === 'absent') {
    return (
      <p role="note" className="max-w-prose text-sm text-[var(--color-ink-muted)]">
        {affordance.note}
      </p>
    )
  }
  if (affordance.kind === 'enabled') {
    return (
      <Button variant={variant} onClick={onClick}>
        {children}
      </Button>
    )
  }
  const reason =
    affordance.kind === 'decision-open'
      ? `${affordance.openDecision} — ${affordance.note}`
      : affordance.reason
  return (
    <Button variant={variant} disabledReason={reason}>
      {children}
    </Button>
  )
}

/**
 * `MOD-STU-13`'s route — `SCR-STU-10`, keyed on the module slug
 * `qualification-requirements`. The `SCR-STU-10` id is an annotation the
 * shell renders, never a route key (D1).
 *
 * `SB-STU-16` (L33725) is a two-panel view: the baseline certifications with
 * a source badge reading either "Pre-populated from tag" or "Authored", the
 * screens carrying overrides, a cross-Workflow tab grouped by certification
 * with the count of Workflows and screens, and a banner stating the tenant's
 * posture and clearance duration READ-ONLY.
 *
 * THE STATE LIVES HERE, ONE COPY OF EACH PIECE. The shell's persona switcher
 * and this screen's content must never disagree about who is being viewed as.
 *
 * THIS SCREEN DECIDES NOTHING. Every affordance comes from
 * `qualificationControls`, every posture from `postureBanner`, every
 * publication verdict from `evaluatePublish` over this module's own register.
 * No policy lives under `src/ui/`, and none lives in the markup here either.
 */
export function QualificationRequirementsScreen() {
  const [persona, setPersona] = useState<StudioPersonaId>('quality-manager')
  const [tab, setTab] = useState<string>('requirements')
  const [postureReadable, setPostureReadable] = useState(true)
  const [mappingReadable, setMappingReadable] = useState(true)
  const [requirement, setRequirement] = useState<QualificationRequirement>(() =>
    baselineFor(WHEEL_BOLT_WORKFLOW, BRIGHT_BIKES_TAG_MAPPING),
  )
  const [overrideScreen, setOverrideScreen] = useState('screen 3')
  const [overrideCertification, setOverrideCertification] = useState(PNEUMATIC_CERTIFICATION)
  const [assignments, setAssignments] = useState<readonly Assignment[]>(
    () => applyRequirementChange(BRIGHT_BIKES_ASSIGNMENTS, PUBLISHED_AT).grandfathered,
  )
  const [continuationReason, setContinuationReason] = useState('Emergency cover')
  const [clearanceState, setClearanceState] = useState('delivered')
  const [message, setMessage] = useState<string | null>(null)

  const scenario = stu13Scenario({ persona })
  const controls = qualificationControls(scenario)
  const controlById = (id: string) => controls.find((c) => c.id === id)!

  const mapping = mappingReadable
    ? BRIGHT_BIKES_TAG_MAPPING
    : ({ ok: false, reason: 'the tag-to-qualification-set mapping could not be read' } as const)
  const postureRead = readTenantPosture(postureReadable ? SEEDED_POSTURE : null)
  const banner = postureBanner(postureRead)

  const change = applyRequirementChange(BRIGHT_BIKES_ASSIGNMENTS, PUBLISHED_AT)
  const publish = evaluatePublish(stu13PublishRegister(MAINTAINED_CERTIFICATIONS), requirement)
  const ownBlocker = publish.blockers.find((b) => b.checkId === 'certification-maintained')
  const unmaintained = unmaintainedOverrides(requirement, MAINTAINED_CERTIFICATIONS)

  // A reviewer control, so the value is validated against the vocabulary
  // rather than cast into it: an unrecognised state is the indeterminate case
  // L33579 legislates, and `renderAdoption` already answers it honestly.
  const reportedState: CommandState | null = (COMMAND_STATES as readonly string[]).includes(
    clearanceState,
  )
    ? (clearanceState as CommandState)
    : null
  const clearance = clearanceEffective({
    deviceId: 'TAB-014',
    commandState: reportedState,
    lastKnown: { state: 'queued', at: '2026-08-14T06:04:00Z' },
  })

  const parked = parkOnGateBlock(BRIGHT_BIKES_RUNS, 'RUN-2026-08-14-A', PNEUMATIC_CERTIFICATION)
  const crossWorkflow = crossWorkflowRequirements([requirement, ...OTHER_WORKSPACE_REQUIREMENTS])
  const statements = crossSurfaceStatements()

  const run = (
    id: string,
    apply: () => QualificationRequirement,
    success: string,
  ): void => {
    const control = controlById(id)
    if (control.affordance.kind !== 'enabled') {
      setMessage(
        control.affordance.kind === 'absent'
          ? control.affordance.note
          : control.affordance.kind === 'disabled'
            ? control.affordance.reason
            : control.affordance.note,
      )
      return
    }
    setRequirement(apply())
    setMessage(success)
  }

  return (
    <StudioShell
      module={MODULE}
      screenId="SCR-STU-10"
      persona={persona}
      onPersonaChange={setPersona}
    >
      <div className="space-y-6">
        {/* SB-STU-16's banner. Read-only here, and it says so. */}
        <Banner
          tone={banner.posture === 'hard-block' ? 'attention' : 'info'}
          heading={`Enforcement posture: ${banner.posture} · clearance duration ${banner.clearanceDuration}`}
          body={`${banner.statedAs} Owned by ${banner.owner}. Read-only on this surface — the qualification gate is the only tenant-configurable gate on the platform, and the Tenant Admin sets it there.`}
        />

        <section
          aria-label="Reviewer controls"
          className="space-y-3 rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4"
        >
          <p className="text-sm text-[var(--color-ink-muted)]">
            Reviewer controls, not product ones. Each turns off a register this screen READS, so
            the stated fallback can be reached rather than described.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button
              variant="secondary"
              onClick={() => {
                setPostureReadable((v) => !v)
                setMessage(null)
              }}
            >
              {postureReadable
                ? 'Make the tenant posture unreadable'
                : 'Restore the tenant posture'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setMappingReadable((v) => !v)
                setMessage(null)
              }}
            >
              {mappingReadable ? 'Make the tag mapping unreadable' : 'Restore the tag mapping'}
            </Button>
          </div>
          {message === null ? null : (
            <p role="status" className="max-w-prose text-sm">
              {message}
            </p>
          )}
        </section>

        <Tabs tabs={TABS} activeId={tab} onChange={setTab} />

        {tab !== 'requirements' ? null : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* LEFT PANEL — the Workflow baseline, with its source badge. */}
            <section
              aria-label="Workflow baseline certifications"
              className="space-y-3 rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4"
            >
              <div className="flex items-center gap-3">
                <h2 className="font-semibold text-[var(--color-ink)]">Baseline certifications</h2>
                <StatusPill
                  tone={requirement.baseline.source === 'Authored' ? 'ok' : 'info'}
                  icon={requirement.baseline.source === 'Authored' ? '✎' : '◆'}
                  label={requirement.baseline.source}
                />
              </div>
              <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
                Stated authoritatively on {requirement.workflowName}, and therefore on any Job or
                Run linked to it. Where a Service Type tag is applied the tenant’s mapping
                pre-populates this list as a starting convenience — the tag never decides the
                requirement, and an edit made here is never overwritten by re-applying the tag.
              </p>
              <Table
                caption="Baseline certifications on this Workflow"
                columns={[
                  { key: 'certification', header: 'Certification' },
                  { key: 'level', header: 'Level' },
                ]}
                rows={requirement.baseline.certifications.map((c) => ({
                  certification: c,
                  level: 'Workflow baseline',
                }))}
                emptyState={{
                  title: 'No baseline certification is stated yet',
                  whatCreatesIt:
                    'Stating the baseline creates it. Where the tag mapping cannot be read the author states it manually, and publication is not blocked — the mapping is a convenience, not a requirement.',
                }}
              />
              <div className="flex flex-wrap gap-3">
                <ControlButton
                  control={controlById('state-the-workflow-qualification-baseline')}
                  onClick={() =>
                    run(
                      'state-the-workflow-qualification-baseline',
                      () => editBaseline(requirement, [TORQUE_CERTIFICATION]),
                      `The baseline is now stated as ${TORQUE_CERTIFICATION}. The badge reads Authored: what is stated on the Workflow is authoritative from here on.`,
                    )
                  }
                >
                  {`State the baseline as ${TORQUE_CERTIFICATION}`}
                </ControlButton>
                <ControlButton
                  control={controlById('edit-over-a-tag-driven-pre-population')}
                  variant="secondary"
                  onClick={() =>
                    run(
                      'edit-over-a-tag-driven-pre-population',
                      () => reapplyTag(requirement, mapping),
                      requirement.baseline.source === 'Authored'
                        ? 'Nothing changed. The baseline is authored, and the tag never decides the requirement — re-applying it does not overwrite what the author stated.'
                        : 'The tag pre-population was re-applied over a baseline the author has not edited.',
                    )
                  }
                >
                  Re-apply the tag pre-population
                </ControlButton>
              </div>
              <StudioSeamNotice seam={statements[0]!.seam} />
            </section>

            {/* RIGHT PANEL — screens carrying overrides. */}
            <section
              aria-label="Screens carrying a qualification override"
              className="space-y-3 rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4"
            >
              <h2 className="font-semibold text-[var(--color-ink)]">Screens with an override</h2>
              <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
                A screen-level override requires an additional certification above the baseline,
                so a genuinely higher-risk step is gated without raising the whole Workflow.
              </p>
              <Table
                caption="Screens carrying an additional certification requirement"
                columns={[
                  { key: 'screen', header: 'Screen' },
                  { key: 'certification', header: 'Additional certification' },
                  { key: 'maintained', header: 'Maintained by the tenant' },
                ]}
                rows={requirement.overrides.map((o) => ({
                  screen: `${o.screenId} — ${o.screenName}`,
                  certification: o.certification,
                  maintained: (MAINTAINED_CERTIFICATIONS as readonly string[]).includes(o.certification)
                    ? 'Yes'
                    : 'No — publication is blocked with this certification named',
                }))}
                emptyState={{
                  title: 'No screen on this Workflow carries an override',
                  whatCreatesIt:
                    'Adding a screen-level override creates one. The baseline alone then governs every screen.',
                }}
              />
              <Select
                label="Screen"
                value={overrideScreen}
                options={OVERRIDE_OPTIONS}
                onChange={setOverrideScreen}
              />
              <Select
                label="Additional certification"
                value={overrideCertification}
                options={CERTIFICATION_OPTIONS}
                onChange={setOverrideCertification}
              />
              <ControlButton
                control={controlById('add-a-screen-level-override')}
                onClick={() =>
                  run(
                    'add-a-screen-level-override',
                    () =>
                      addOverride(requirement, {
                        screenId: overrideScreen,
                        screenName: 'Wheel Bolt Torque Verification',
                        certification: overrideCertification,
                      }),
                    `${overrideScreen} now additionally requires ${overrideCertification}.`,
                  )
                }
              >
                Add the override
              </ControlButton>

              <div className="rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] p-3 text-sm">
                <p className="font-medium text-[var(--color-ink)]">
                  Publish check 8 — every named certification still maintained
                </p>
                {ownBlocker === undefined ? (
                  <p className="mt-1 text-[var(--color-ink-muted)]">
                    Passed. Every certification named on this Workflow is maintained by the tenant.
                  </p>
                ) : (
                  <p role="alert" className="mt-1 text-[var(--color-ink)]">
                    Publication is blocked: {ownBlocker.blockingElement}. The Studio cannot create,
                    edit or delete a certification record — certifications are Delivery Operations
                    Hub master data, supervisor-entered, with no self-attestation.
                  </p>
                )}
                <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
                  {unmaintained.length} of {requirement.overrides.length} overrides name a
                  certification the tenant does not maintain. Source: {ownBlocker?.sourceRef ??
                    'L33664, AC-STU-119 L33770'}
                  .
                </p>
              </div>
              <StudioSeamNotice seam={statements[1]!.seam} />
            </section>
          </div>
        )}

        {tab !== 'cross-workflow' ? null : (
          <section
            aria-label="Cross-Workflow requirement view"
            className="space-y-3 rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4"
          >
            <h2 className="font-semibold text-[var(--color-ink)]">
              Every certification requirement in the workspace
            </h2>
            <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
              Grouped by certification, with the count of Workflows and of screens requiring it. A
              baseline requirement is stated on the Workflow and counts no screen, because it
              applies to all of them. The Shift Handoff Agent cross-references this same list
              against the incoming shift plan; it changes no requirement and grants no clearance.
            </p>
            <Table
              caption="Certification requirements across the workspace"
              columns={[
                { key: 'certification', header: 'Certification' },
                { key: 'workflows', header: 'Workflows' },
                { key: 'screens', header: 'Screens with an override' },
                { key: 'named', header: 'Named on' },
              ]}
              rows={crossWorkflow.map((r) => ({
                certification: r.certification,
                workflows: String(r.workflowCount),
                screens: String(r.screenCount),
                named: r.workflows.join(', '),
              }))}
              emptyState={{
                title: 'No certification is required anywhere in the workspace',
                whatCreatesIt:
                  'Stating a Workflow baseline or adding a screen-level override creates a row here.',
              }}
            />
            {controlById('view-the-cross-workflow-requirement-view').affordance.kind ===
            'decision-open' ? (
              <DecisionDisclosure id="D3" />
            ) : null}
          </section>
        )}

        {tab !== 'grandfathering' ? null : (
          <section
            aria-label="Grandfathered assignments"
            className="space-y-3 rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4"
          >
            <h2 className="font-semibold text-[var(--color-ink)]">
              Grandfathered and flagged — awaiting supervisor confirmation
            </h2>
            <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
              A certification-requirement change applies to Runs scheduled after the version
              carrying it is published. Active assignments are grandfathered <em>and flagged</em>:
              the worker is not stranded mid-assignment, and the change does not pass silently
              either. The supervisor confirms continuation with a recorded reason, and no role may
              clear the flag without one.
            </p>
            <Table
              caption="Active assignments carried through the requirement change"
              columns={[
                { key: 'worker', header: 'Worker' },
                { key: 'run', header: 'Run scheduled' },
                { key: 'state', header: 'Evaluation' },
                { key: 'flag', header: 'Flag' },
                { key: 'reason', header: 'Recorded reason' },
              ]}
              rows={assignments.map((a) => ({
                worker: a.workerName,
                run: a.runScheduledAt,
                state: a.evaluation,
                flag: a.flagged ? 'Raised' : 'Cleared on confirmation',
                reason:
                  a.continuation === null
                    ? 'Not yet confirmed'
                    : `${a.continuation.reason} — ${a.continuation.confirmedBy}`,
              }))}
              emptyState={{
                title: 'No assignment was active when the change published',
                whatCreatesIt:
                  'A certification-requirement change publishing while an assignment is live creates one.',
              }}
            />
            <p className="text-sm text-[var(--color-ink-muted)]">
              {change.appliesTo.length} later Run
              {change.appliesTo.length === 1 ? '' : 's'} take the new requirement outright:{' '}
              {change.appliesTo.join(', ') || 'none'}.
            </p>
            <Select
              label="Recorded reason"
              value={continuationReason}
              options={[
                { value: 'Emergency cover', label: 'Emergency cover' },
                { value: 'Renewal already booked', label: 'Renewal already booked' },
                { value: '', label: '— no reason given —' },
              ]}
              onChange={setContinuationReason}
            />
            <ControlButton
              control={controlById('confirm-continuation-of-a-grandfathered-assignment')}
              onClick={() => {
                const control = controlById(
                  'confirm-continuation-of-a-grandfathered-assignment',
                )
                if (control.affordance.kind !== 'enabled') return
                // COMPUTED OUTSIDE `setAssignments`, DELIBERATELY. A refusal
                // collected inside the updater is read before the updater has
                // run — and under StrictMode the updater runs twice — so the
                // message would have been the wrong one, every time. The
                // module's own function is called once, here, and both the
                // next state and the message come out of the same answer.
                const results = assignments.map((a) =>
                  a.flagged
                    ? confirmContinuation(a, {
                        confirmedBy: 'IDN-BB-SAM',
                        reason: continuationReason,
                        at: '2026-08-14T07:15:00Z',
                      })
                    : ({ ok: true, assignment: a } as const),
                )
                const refusal = results.find((r) => !r.ok)
                setAssignments(results.map((r, i) => (r.ok ? r.assignment : assignments[i]!)))
                setMessage(
                  refusal !== undefined && !refusal.ok
                    ? refusal.reason
                    : 'Continuation confirmed with a recorded reason. The flag is cleared and the reason is auditable.',
                )
              }}
            >
              Confirm continuation for every flagged assignment
            </ControlButton>

            <div className="rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] p-3 text-sm">
              <p className="font-medium text-[var(--color-ink)]">
                Offline: a gate block parks the run, and only that run
              </p>
              <ul className="mt-1 space-y-1 text-[var(--color-ink-muted)]">
                {parked.map((r) => (
                  <li key={r.runId}>
                    {r.runId} — {r.state}
                    {r.parkedReason === null ? '' : `. ${r.parkedReason}`}
                  </li>
                ))}
              </ul>
              <p className="mt-2 font-medium text-[var(--color-ink)]">
                The clearance on TAB-014
              </p>
              <Select
                label="Command state reported by the Delivery Operations Hub"
                value={clearanceState}
                options={[
                  { value: 'queued', label: 'queued' },
                  { value: 'delivered', label: 'delivered' },
                  { value: 'applied', label: 'applied' },
                  { value: 'acknowledged', label: 'acknowledged' },
                  { value: 'unknown', label: 'indeterminate' },
                ]}
                onChange={setClearanceState}
              />
              <p className="mt-1 text-[var(--color-ink-muted)]">
                {clearance.rendering.label} —{' '}
                {clearance.effective
                  ? 'the clearance is in effect on the device and the parked run resumes.'
                  : 'the clearance is not in effect. No surface shows a clearance as effective before its command reaches applied on the device, so the run stays parked.'}
              </p>
            </div>
          </section>
        )}

        {tab !== 'elsewhere' ? null : (
          <section
            aria-label="Capabilities held on another surface"
            className="space-y-4 rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4"
          >
            <h2 className="font-semibold text-[var(--color-ink)]">
              Stated here, done somewhere else
            </h2>
            {statements.map((statement) => (
              <div key={statement.id} className="space-y-2">
                <p className="font-medium text-[var(--color-ink)]">
                  {statement.capability} — held on {statement.heldOn}
                </p>
                <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
                  {statement.statement}
                </p>
                <Table
                  caption={`${statement.capability} — the source’s own six cells`}
                  columns={[
                    { key: 'column', header: 'Role' },
                    { key: 'text', header: 'Permission, verbatim' },
                  ]}
                  rows={statement.cells.map((c) => ({ column: c.column, text: c.text }))}
                  emptyState={{
                    title: 'No cell is transcribed',
                    whatCreatesIt: 'Transcribing the source row creates them.',
                  }}
                />
                <StudioSeamNotice seam={statement.seam} />
              </div>
            ))}

            <div className="space-y-2">
              <p className="font-medium text-[var(--color-ink)]">
                Validation runs three times, and none of them here
              </p>
              <ul className="space-y-2 text-sm text-[var(--color-ink-muted)]">
                {VALIDATION_POINTS.map((point) => (
                  <li key={point.id}>
                    <span className="text-[var(--color-ink)]">{point.name}</span> — {point.statement}{' '}
                    <span className="text-xs">[{point.sourceRef}]</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-[var(--color-ink)]">
                Every capability this card answers for
              </p>
              <ul className="space-y-2 text-sm">
                {controls.map((control) => (
                  <li key={control.id}>
                    <span className="text-[var(--color-ink)]">{control.label}</span>{' '}
                    <span className="text-[var(--color-ink-muted)]">
                      {control.affordance.kind === 'enabled'
                        ? `Available — ${control.affordance.note}`
                        : control.affordance.kind === 'disabled'
                          ? `Unavailable — ${control.affordance.reason}`
                          : control.affordance.kind === 'decision-open'
                            ? `Client Decision Required (${control.affordance.openDecision}) — ${control.affordance.note}`
                            : `No control — ${control.affordance.note}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <DecisionDisclosure id="D11" />
          </section>
        )}
      </div>
    </StudioShell>
  )
}
