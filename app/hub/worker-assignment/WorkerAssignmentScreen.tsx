'use client'

import { useState } from 'react'
import { HubShell, type TenantRoleId } from '../HubShell'
import { roleById } from '@/domain/roles'
import { CrossSurfaceStatement } from '@/ui/doh/CrossSurfaceStatement'
import { crossSurfaceStatement } from '@/surfaces/doh/boundary'
import { dohSeamById, dohSeamStatus } from '@/surfaces/doh/seams'
import { GATE_POSTURES } from '../worker-lifecycle-and-qualifications/fixtures'
import {
  Banner,
  LiveRegion,
  Select,
  StatusPill,
  Table,
  type StatusTone,
  type TableRow,
} from '@/ui/primitives'
import {
  CONTROL_MATRIX,
  DEFERRAL_RENDERING,
  MOD_DOH_07_REACH,
  assignmentCellRendering,
  assignmentRow,
  type AssignmentMatrixRow,
} from '@/surfaces/doh/modules/doh-07/matrix'
import {
  ABSENT_BY_RULE,
  ABSENCE_NOTES,
  CATALOGUE_B_NARROWING,
  COMMAND_CENTER_ACTION_8,
  DEC_PLUS_001,
  SEAMS_CLOSED_HERE,
  UNRESOLVED_IN_SOURCE,
  UNSPECIFIED_IN_SOURCE,
} from '@/surfaces/doh/modules/doh-07/rulings'
import {
  CANDIDATE_WORKERS,
  CONCURRENCY_FOOTER,
  HANDOVER_PAYLOAD,
  POSTURE_COPY,
  SEEDED_RUN,
  SUPERVISOR_AREA_IDS,
  candidatesInScope,
  chipFailsTheGate,
  workerShiftCount,
  type GatePosture,
} from './fixtures'

/**
 * `MOD-DOH-07` Worker Assignment — `SCR-DOH-15` Assignment and substitution,
 * at `/hub/worker-assignment`.
 *
 * THE ROUTE IS PROMOTED, AND THE CATALOGUE SAYS SO. Catalogue B's navigation
 * entry for this screen is "Run detail" (L48109); it becomes a route of its
 * own because this module owns a matrix and the slice-4 convention is one
 * route per module. The catalogue's own cell is rendered beside the reach,
 * not overwritten by it.
 *
 * WHY THE SHELL IS IN ITS `screen` MODE RATHER THAN ITS `module` MODE. NOT
 * a registration gap any more: `MOD-DOH-07` has its row in `DOH_MODULES`,
 * `dohScreenReach` answers for `SCR-DOH-15`, and every other Hub module
 * route's rail now links here. "The module rail does not yet offer it",
 * which stood here, is false, and so is the promise that the generator would
 * read this module's matrix from `app/hub/worker-assignment/fixtures.ts` —
 * it reads `src/surfaces/doh/modules/doh-07/matrix.ts` directly.
 *
 * What is still true is narrower and is the whole reason: the annotation slot
 * below carries the catalogue's own entry point and the promotion that
 * overrode it, and the shell's `module` header has nowhere to put either.
 * The cost, disclosed rather than hidden: the shell draws its rail only in
 * `module` mode, so THIS route draws none. That is `HubShell`'s shape and
 * not this module's to change.
 *
 * WHAT THIS SCREEN DRAWS NO CONTROL FOR, WHATEVER ITS TOKEN READS. Row 4
 * reads `Allowed with conditions` for two of the five roles and is Client
 * Command Center action number 8. Classification decides; the token is
 * rendered and disregarded, which is `assignmentCellRendering`'s first
 * branch and the reason this screen asks it rather than reading `status`.
 */


const POSTURE_OPTIONS = GATE_POSTURES.map((p) => ({
  value: p,
  label: p === 'strict' ? 'Strict blocking (the platform default)' : 'Notify-only',
}))

const STATUS_TONE: Readonly<Record<AssignmentMatrixRow['status'][TenantRoleId], StatusTone>> = {
  allowed: 'ok',
  'allowed-with-conditions': 'ok',
  'read-only': 'neutral',
  'explicitly-prohibited': 'blocked',
  'not-applicable': 'neutral',
  unavailable: 'blocked',
}

const CHIP_TONE = (chip: string): StatusTone =>
  chip === 'Qualified' ? 'ok' : chip === 'Expires in 3 days' ? 'stale' : 'blocked'

const MATRIX_COLUMNS = [
  { key: 'control', header: 'Action' },
  { key: 'admin', header: 'Tenant Admin' },
  { key: 'supervisor', header: 'Supervisor' },
  { key: 'quality', header: 'Quality Manager' },
  { key: 'auditor', header: 'Read-only Auditor' },
  { key: 'worker', header: 'Worker' },
  { key: 'rendering', header: 'What this screen draws' },
]

export function WorkerAssignmentScreen() {
  const [role, setRole] = useState<TenantRoleId>('SUPERVISOR')
  const [posture, setPosture] = useState<GatePosture>('strict')
  const [assigned, setAssigned] = useState<readonly string[]>([])
  const [substitution, setSubstitution] = useState<string | null>(null)

  /* THE SELECTOR FILTERS, NOT THE RENDER. The Supervisor's candidate list is
     BUILT from their own Areas; nothing outside them is assembled and then
     hidden. Every other reaching role reads the whole register — row 7 gives
     the Tenant Admin and the Quality Manager an unconditional `Allowed` and
     the Read-only Auditor `Read-only` (L28125), none of them scoped. */
  const candidates =
    role === 'SUPERVISOR' ? candidatesInScope(SUPERVISOR_AREA_IDS) : CANDIDATE_WORKERS

  const assignRow = assignmentRow('assign-worker')
  const substituteRow = assignmentRow('substitute-worker')
  const reassignRow = assignmentRow('reassign-from-command-center')
  const overrideRow = assignmentRow('override-qualification-block')

  const mayAssign = assignmentCellRendering(assignRow, role).kind === 'control'
  const maySubstitute = assignmentCellRendering(substituteRow, role).kind === 'control'
  const reassignHere = assignmentCellRendering(reassignRow, role)

  const pinned = assigned.length > 0

  const shifts = workerShiftCount([
    ...assigned.map((workerId) => ({ workerId, workedAtAll: true })),
    ...(substitution === null ? [] : [{ workerId: substitution, workedAtAll: true }]),
  ])

  const matrixRows: readonly TableRow[] = CONTROL_MATRIX.map((row) => ({
    control: (
      <>
        <span className="font-medium">{row.control}</span>
        <span className="block text-xs text-[var(--color-ink-subtle)]">{row.sourceRef}</span>
        {row.surface === 'another-surface' ? (
          <span className="block text-xs font-medium text-[var(--color-ink)]">
            Met on another surface — no control here for any role.
          </span>
        ) : null}
      </>
    ),
    ...Object.fromEntries(
      (
        [
          ['admin', 'TENANT_ADMIN'],
          ['supervisor', 'SUPERVISOR'],
          ['quality', 'QUALITY_MANAGER'],
          ['auditor', 'READONLY_AUDITOR'],
          ['worker', 'WORKER'],
        ] as const
      ).map(([key, roleId]) => [
        key,
        <>
          <StatusPill tone={STATUS_TONE[row.status[roleId]]} icon="●" label={row.status[roleId]} />
          <span className="mt-1 block text-xs text-[var(--color-ink-subtle)]">
            {row.detail[roleId]}
          </span>
        </>,
      ]),
    ),
    rendering: (
      <>
        <span>{row.rendering}</span>
        <span className="mt-1 block text-xs text-[var(--color-ink-subtle)]">{row.effect}</span>
      </>
    ),
  }))

  return (
    <HubShell
      screen={{
        title: 'Assignment and substitution',
        annotation:
          'MOD-DOH-07 · SCR-DOH-15 — annotations, never route keys; this route is keyed on the module slug worker-assignment (D1). Catalogue B mounts this screen under Run detail (L48109); it is promoted to a route because this module owns a matrix.',
        purpose:
          'Bind people to runs under a qualification check, fix the run’s version contract, and provide a safe, attributed handover when a person changes mid-run.',
      }}
      role={role}
      onRoleChange={setRole}
    >
      <div className="space-y-8">
        {/* ---------------------------------------------------------- *
            Reach, derived — and the catalogue cell that disagrees.
         * ---------------------------------------------------------- */}
        <section aria-labelledby="reach-heading">
          <h2 id="reach-heading" className="text-lg font-semibold">
            Who this screen is for
          </h2>
          <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
            Derived from this module’s own control matrix by the one rule the whole surface uses,
            never hand-written and never read from the screen catalogue:{' '}
            <span className="font-medium text-[var(--color-ink)]">
              {MOD_DOH_07_REACH.map((r) => roleById(r).name).join(', ')}
            </span>
            .
          </p>
          <div
            role="note"
            data-testid="catalogue-narrowing"
            className="mt-3 rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4 text-sm"
          >
            <p className="font-medium text-[var(--color-ink)]">
              The screen catalogue is narrower than the matrix, and both render
            </p>
            <p className="mt-1 text-[var(--color-ink-muted)]">
              Catalogue B’s &ldquo;Roles that can open it&rdquo; cell for this screen reads
              &ldquo;{CATALOGUE_B_NARROWING.catalogueBCell}&rdquo; ({CATALOGUE_B_NARROWING.catalogueBRef}). The
              matrix admits {CATALOGUE_B_NARROWING.omittedRoles.join(', ')} as well:{' '}
              {CATALOGUE_B_NARROWING.matrixRef}. Reach comes from the matrix; the catalogue cell is
              quoted rather than corrected.
            </p>
            <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
              {CATALOGUE_B_NARROWING.workerNote}
            </p>
            <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
              {CATALOGUE_B_NARROWING.entryPointNote}
            </p>
          </div>
        </section>

        {/* ---------------------------------------------------------- *
            Reviewer controls for this screen's own scenario.
         * ---------------------------------------------------------- */}
        <section
          aria-label="Storyboard scenario controls"
          className="rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
            Reviewer controls — not part of the product
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-6">
            <Select
              label="Tenant gate posture"
              value={posture}
              options={POSTURE_OPTIONS}
              onChange={(value) => {
                const next = GATE_POSTURES.find((p) => p === value)
                if (next !== undefined) setPosture(next)
              }}
            />
          </div>
          {/* NO SECOND ROLE SWITCHER. The shell already draws one and this
              screen owns its state as a controlled prop; a second control
              with the same label is two ways to set one value, and the
              component suite found it by tripping over the duplicate. */}
          <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
            The posture is set by the Tenant Admin in the tenant administration area and is owned by{' '}
            <span className="font-medium text-[var(--color-ink)]">MOD-DOH-04</span>, not here. It
            re-renders seeded fixtures and configures nothing.
          </p>
        </section>

        {/* ---------------------------------------------------------- *
            SB-DOH-019 — the assignment panel.
         * ---------------------------------------------------------- */}
        <section aria-labelledby="panel-heading">
          <h2 id="panel-heading" className="text-lg font-semibold">
            Assignment panel — {SEEDED_RUN.runId}
          </h2>
          <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
            {SEEDED_RUN.jobName}, production date {SEEDED_RUN.productionDate}. SB-DOH-019, L28216.
          </p>

          <ul className="mt-4 space-y-3">
            {candidates.map((worker) => {
              const blocked = posture === 'strict' && chipFailsTheGate(worker.chip)
              const isAssigned = assigned.includes(worker.workerId)
              return (
                <li
                  key={worker.workerId}
                  data-testid={`candidate-${worker.workerId}`}
                  className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-4"
                >
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-medium text-[var(--color-ink)]">{worker.name}</span>
                    <span className="text-xs text-[var(--color-ink-subtle)]">{worker.workerId}</span>
                    <StatusPill tone={CHIP_TONE(worker.chip)} icon="●" label={worker.chip} />
                    <span className="text-xs text-[var(--color-ink-subtle)]">
                      {worker.certification}
                    </span>
                  </div>

                  {/* THE ASSIGN CONTROL IS ABSENT UNDER A STRICT BLOCK, never
                      disabled. AC-DOH-07-10 (L28235) requires the blocked row
                      to offer the clearance path "and never an inline
                      override", and a disabled assign button beside a
                      clearance line is the inline override wearing a
                      different hat. */}
                  {!mayAssign ? (
                    <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
                      {assignmentCellRendering(assignRow, role).kind === 'absent-with-line'
                        ? assignRow.detail[role]
                        : null}
                    </p>
                  ) : blocked ? (
                    <p
                      data-testid={`blocked-${worker.workerId}`}
                      className="mt-2 text-sm text-[var(--color-ink)]"
                    >
                      {POSTURE_COPY.strict}
                    </p>
                  ) : (
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] px-3 py-1 text-sm text-[var(--color-ink)]"
                        onClick={() =>
                          setAssigned((prev) =>
                            prev.includes(worker.workerId) ? prev : [...prev, worker.workerId],
                          )
                        }
                      >
                        {isAssigned ? 'Assigned' : 'Assign to this run'}
                      </button>
                      {posture === 'notify-only' && chipFailsTheGate(worker.chip) ? (
                        <span
                          data-testid={`notify-only-${worker.workerId}`}
                          className="text-sm text-[var(--color-ink)]"
                        >
                          {POSTURE_COPY['notify-only']}
                        </span>
                      ) : null}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>

          <p className="mt-4 max-w-prose text-sm text-[var(--color-ink-muted)]">
            {CONCURRENCY_FOOTER}
          </p>

          {/* The clearance is a REGISTERED boundary, so it gets the checked
              component and its checked link — the pointer is verified against
              the route registry before it is drawn, or it collapses to a
              plain statement. */}
          <div className="mt-4">
            <CrossSurfaceStatement
              statement={crossSurfaceStatement('qualification-clearance-granting', role)}
            />
          </div>
          <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
            {overrideRow.detail.SUPERVISOR}
          </p>

          <LiveRegion>
            {pinned ? (
              <p data-testid="package-pin" className="mt-4 max-w-prose text-sm text-[var(--color-ink)]">
                Work package pinned: {SEEDED_RUN.packageRef}. The pin is set at the first successful
                assignment and is immutable for the life of the run (L28133), so assignment is the
                moment this run’s version contract is fixed. {shifts} Worker-Shift
                {shifts === 1 ? '' : 's'} consumed.
              </p>
            ) : null}
          </LiveRegion>
        </section>

        {/* ---------------------------------------------------------- *
            Substitution and the structured handover.
         * ---------------------------------------------------------- */}
        <section aria-labelledby="substitution-heading">
          <h2 id="substitution-heading" className="text-lg font-semibold">
            Mid-run substitution
          </h2>
          {maySubstitute ? (
            <>
              <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
                {substituteRow.detail.SUPERVISOR}
              </p>
              <button
                type="button"
                data-testid="substitute"
                className="mt-2 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] px-3 py-1 text-sm text-[var(--color-ink)]"
                onClick={() => setSubstitution('WKR-0188')}
              >
                Substitute with a captured reason
              </button>
            </>
          ) : (
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
              {substituteRow.detail[role]}
            </p>
          )}

          {substitution === null ? null : (
            <div
              data-testid="handover"
              className="mt-3 rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-4 text-sm"
            >
              <p className="font-medium text-[var(--color-ink)]">
                Structured handover — delivered with the reassignment command
              </p>
              <p className="mt-1 text-[var(--color-ink-muted)]">
                Last completed step: {HANDOVER_PAYLOAD.lastCompletedStep}
              </p>
              <p className="text-[var(--color-ink-muted)]">
                Open flags: {HANDOVER_PAYLOAD.openFlags.join('; ')}
              </p>
              <p className="text-[var(--color-ink-muted)]">
                Current state: {HANDOVER_PAYLOAD.currentState}
              </p>
              <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
                Rendered as queued, not applied, until a device acknowledges (L28142). Pre-substitution
                captures stay attributed to the outgoing worker permanently and no role can
                re-attribute one (AC-DOH-07-7, L28232).
              </p>
            </div>
          )}
        </section>

        {/* ---------------------------------------------------------- *
            Row 4 — a place, stated. No control, no minted pointer.
         * ---------------------------------------------------------- */}
        <section aria-labelledby="cc8-heading">
          <h2 id="cc8-heading" className="text-lg font-semibold">
            Reassigning a run mid-shift
          </h2>
          <div
            role="note"
            data-testid="command-center-action-8"
            data-rendering={reassignHere.kind}
            className="mt-2 rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4 text-sm"
          >
            <p className="font-medium text-[var(--color-ink)]">
              Cross-surface — owned by the {COMMAND_CENTER_ACTION_8.owningSurfaceName}, action number{' '}
              {COMMAND_CENTER_ACTION_8.actionNumber}
            </p>
            <p className="mt-1 text-[var(--color-ink-muted)]">
              {COMMAND_CENTER_ACTION_8.statement}
            </p>
            {/* The narrowing is the assertion. `kind` can only be
                `cross-surface` here because the row is classified
                `another-surface`, and if a later edit reclassified it this
                branch would stop rendering the cell text rather than
                silently drawing a control — the classification is what
                decides, so it is what is read. */}
            {reassignHere.kind === 'cross-surface' ? (
              <p className="mt-1 text-[var(--color-ink-muted)]">{reassignHere.line}</p>
            ) : null}
            <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
              {COMMAND_CENTER_ACTION_8.whyNoLink}
            </p>
            <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
              {COMMAND_CENTER_ACTION_8.noCommandExists}
            </p>
            <ul className="mt-2 space-y-1 text-xs text-[var(--color-ink-subtle)]">
              {COMMAND_CENTER_ACTION_8.sourceRefs.map((ref) => (
                <li key={ref}>{ref}</li>
              ))}
            </ul>
          </div>

          {/* DEC-PLUS-001 — quoted, never expanded into a role set. */}
          <div
            role="note"
            aria-label={`Open question ${DEC_PLUS_001.ref}`}
            data-testid="dec-plus-001"
            className="mt-3 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4 text-sm"
          >
            <p className="font-medium text-[var(--color-ink)]">
              {DEC_PLUS_001.ref} — {DEC_PLUS_001.question}
            </p>
            <p className="mt-1 text-[var(--color-ink-muted)]">{DEC_PLUS_001.statement}</p>
            <p className="mt-2 text-[var(--color-ink-muted)]">{DEC_PLUS_001.whereItLands}</p>
            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
              What this build does
            </p>
            <p className="mt-1 text-[var(--color-ink)]">{DEC_PLUS_001.whatThisBuildDoes}</p>
            <p className="mt-1 text-[var(--color-ink-muted)]">
              {DEC_PLUS_001.whatThisBuildDoesNotDo}
            </p>
            <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
              {DEC_PLUS_001.locator}. {DEC_PLUS_001.alsoRecordedAt}
            </p>
          </div>
        </section>

        {/* ---------------------------------------------------------- *
            The two capabilities that are not here, and the ruling.
         * ---------------------------------------------------------- */}
        <section aria-labelledby="absences-heading">
          <h2 id="absences-heading" className="text-lg font-semibold">
            What this release does not do
          </h2>
          <ul className="mt-3 space-y-3">
            {ABSENCE_NOTES.map((row) => (
              <li
                key={row.id}
                data-testid={`absence-${row.id}`}
                data-absence-kind={row.absence?.kind}
                className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-4 text-sm"
              >
                {/* The CAPABILITY, not the row's control name. Row 1's
                    control is "Assign a worker to a run", which is live for
                    the Supervisor; what is absent on it is worker
                    self-assignment, in one of its five cells. */}
                <p className="font-medium text-[var(--color-ink)]">{row.absence?.capability}</p>
                <p className="mt-1 text-[var(--color-ink-muted)]">{row.absence?.line}</p>
                <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
                  Matrix row: {row.control} ({row.sourceRef}).
                </p>
                <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
                  {row.absence?.kind === 'deferred-beyond-v1'
                    ? `Deferred beyond V1 — out-of-V1 register row ${row.absence.registerRow} of the twenty table rows at L25876-L25895. AC-DOH-014-1 (L25934) counts twenty plus three further deferrals stated in prose at L25897, an effective twenty-three; this row is one of the twenty.`
                    : 'Not a deferral, and not on the out-of-V1 register at all. This capability does not exist in the platform and none is planned.'}
                </p>
                <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
                  {row.absence?.sourceRef}
                </p>
              </li>
            ))}
          </ul>

          <Banner
            tone="info"
            heading="How an absent capability renders here — the slice-6 ruling"
            body={`${DEFERRAL_RENDERING.ruling} ${DEFERRAL_RENDERING.decidedBy} ${DEFERRAL_RENDERING.scope}`}
          />
          <div
            role="note"
            data-testid="deferral-ruling"
            className="mt-3 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4 text-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
              Adopted — {DEFERRAL_RENDERING.adoptedReading.ref} ({DEFERRAL_RENDERING.adoptedReading.locator})
            </p>
            <p className="mt-1 text-[var(--color-ink)]">{DEFERRAL_RENDERING.adoptedReading.text}</p>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
              Read and not adopted. Both stand; neither is deleted.
            </p>
            <ul className="mt-1 space-y-2">
              {DEFERRAL_RENDERING.notAdopted.map((reading) => (
                <li key={reading.ref}>
                  <span className="font-medium text-[var(--color-ink)]">{reading.ref}</span>{' '}
                  <span className="text-[var(--color-ink-muted)]">{reading.text}</span>{' '}
                  <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
                    [{reading.locator}]
                  </span>
                </li>
              ))}
            </ul>
            <ul className="mt-3 space-y-1 text-xs text-[var(--color-ink-subtle)]">
              {DEFERRAL_RENDERING.alsoStatedBy.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          <h3 className="mt-6 text-base font-semibold">Absent by rule</h3>
          <ul className="mt-2 space-y-2">
            {ABSENT_BY_RULE.map((entry) => (
              <li key={entry.label} className="max-w-prose text-sm">
                <span className="font-medium text-[var(--color-ink)]">{entry.label}. </span>
                <span className="text-[var(--color-ink-muted)]">{entry.note}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------------------------------------------------------- *
            The two seams this module closes.
         * ---------------------------------------------------------- */}
        <section aria-labelledby="seams-heading">
          <h2 id="seams-heading" className="text-lg font-semibold">
            Cross-slice seams closed here
          </h2>
          <ul className="mt-2 space-y-3">
            {SEAMS_CLOSED_HERE.map((closure) => {
              const seam = dohSeamById(closure.seamId)
              return (
                <li
                  key={closure.seamId}
                  data-testid={`seam-${closure.seamId}`}
                  data-seam-status={dohSeamStatus(seam)}
                  className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-4 text-sm"
                >
                  <p className="font-medium text-[var(--color-ink)]">
                    {closure.seamId} — {dohSeamStatus(seam)}
                  </p>
                  <p className="mt-1 text-[var(--color-ink-muted)]">{seam.description}</p>
                  <p className="mt-1 text-[var(--color-ink)]">{closure.whatItNowCarries}</p>
                  <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">{closure.sourceRef}</p>
                </li>
              )
            })}
          </ul>
        </section>

        {/* ---------------------------------------------------------- *
            The matrix, verbatim.
         * ---------------------------------------------------------- */}
        <section aria-labelledby="matrix-heading">
          <h2 id="matrix-heading" className="text-lg font-semibold">
            Roles and permissions
          </h2>
          <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
            Eight data rows, L28119-L28126. The table header is at L28117 and its separator at
            L28118, so a span quoted as L28117-L28126 encloses the header and the separator as well
            as the rows.
          </p>
          {/* A horizontally scrollable region with no focusable content inside
              cannot be reached or scrolled by keyboard, which axe reports as a
              serious violation. Every other matrix table in this build carries a
              control that takes focus; this one is read-only in every cell, so
              the region itself must be focusable. Same shape as the coverage
              route's table, which solved this first. */}
          <div
            className="mt-3 overflow-x-auto"
            tabIndex={0}
            role="region"
            aria-label="MOD-DOH-07 roles and permissions table, scrollable horizontally"
          >
            <Table
              caption="MOD-DOH-07 roles and permissions, L28119-L28126"
              columns={MATRIX_COLUMNS}
              rows={matrixRows}
              emptyState={{
                title: 'No matrix rows',
                whatCreatesIt: 'The frozen source’s own table at L28119-L28126.',
              }}
            />
          </div>
        </section>

        {/* ---------------------------------------------------------- *
            What the source does not settle.
         * ---------------------------------------------------------- */}
        <section aria-labelledby="silence-heading">
          <h2 id="silence-heading" className="text-lg font-semibold">
            What the source does not settle
          </h2>
          <h3 className="mt-3 text-base font-semibold">Unspecified in the source</h3>
          <ul className="mt-1 space-y-2">
            {UNSPECIFIED_IN_SOURCE.map((note) => (
              <li key={note} className="max-w-prose text-sm text-[var(--color-ink-muted)]">
                {note}
              </li>
            ))}
          </ul>
          <h3 className="mt-4 text-base font-semibold">Unresolved in the source</h3>
          <ul className="mt-1 space-y-2">
            {UNRESOLVED_IN_SOURCE.map((note) => (
              <li key={note} className="max-w-prose text-sm text-[var(--color-ink-muted)]">
                {note}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </HubShell>
  )
}
