'use client'

import { useState } from 'react'
import Link from 'next/link'
import { HubShell, type TenantRoleId } from '../HubShell'
import { DecisionDisclosure } from '@/disclosure/DecisionDisclosure'
import { CrossSurfaceStatement } from '@/ui/doh/CrossSurfaceStatement'
import { crossSurfaceStatement } from '@/surfaces/doh/boundary'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import { Button, StatusPill, Table, type StatusTone, type TableRow } from '@/ui/primitives'
import { PermissionNotice } from '@/ui/primitives/PermissionNotice'
import { roleById, type RoleId } from '@/domain/roles'
import { permitsAction, type PermissionDecision } from '@/policy/decision'
import type { ControlStatus } from '@/surfaces/doh/modules'
import { dohScreenById } from '@/surfaces/doh/screens'
import {
  DEC_AREA_001_POSITION,
  DEC_TAX_002_SEEDED_COUNTS,
  MOD_DOH_05_ACTS,
  MOD_DOH_05_ESCAPE,
  MOD_DOH_05_MATRIX,
  MOD_DOH_05_REACH,
  MOD_DOH_05_UNSPECIFIED_IN_SOURCE,
  doh05Row,
  type Doh05ActId,
} from '@/surfaces/doh/modules/doh-05/matrix'
import {
  SEEDED_JOBS,
  displayNameFor,
  isPausedByArchivalCascade,
  jobStateLabel,
  type SeededJob,
} from '@/surfaces/doh/modules/doh-05/jobs'
import { actDecision, adoptVersionDecision } from '@/surfaces/doh/modules/doh-05/access'
import { APPROVAL_QUEUE_ROUTE, JOB_LIFECYCLE_ROUTE, MODULE_HEADER } from '@/surfaces/doh/modules/doh-05/routes'

/**
 * `MOD-DOH-05` — `SCR-DOH-10` Job list (L48104) with `SCR-DOH-11` Job editor
 * (L48105) as its sub-view, both at `/hub/job-lifecycle-and-approval`.
 *
 * The third screen of this module, `SCR-DOH-12` (L48106), is its own route
 * because catalogue B gives it its own navigation entry — "Operations home,
 * work group" — rather than reaching it from the Job list. It is not a
 * second module and not a second task: the matrix both routes read lives in
 * `@/surfaces/doh/modules/doh-05/matrix`, and this screen holds no row list
 * and no role list of its own.
 *
 * WHAT THIS SCREEN DOES NOT DRAW, AND WHY EACH ABSENCE IS DELIBERATE:
 *
 * - NO APPROVE CONTROL. Row 4 (L27697) is the approval queue's, and drawing
 *   an Approve button here as well would give one governed act two entry
 *   points on two routes.
 * - NO CONTROL FOR ROW 5. "Approve a Job the same identity created" (L27698)
 *   is the negative restatement of row 4's condition; it yields no act at
 *   all, so there is nothing here to disable.
 * - NO CONTROL FOR ROW 8, not even a disabled one. The tag-to-qualification-
 *   set mapping is maintained in the tenant administration area (L27701),
 *   and a disabled control would imply a condition that could become true
 *   here. It never can.
 * - NO SEEDED JOB TYPE OR SERVICE TYPE NAME. `DEC-TAX-002` (L27654) forbids
 *   inventing the sixteen, and the adopted position ships the catalogue
 *   empty; every Job Type below is a tenant-created entry.
 */

const STATUS_LABEL: Readonly<Record<ControlStatus, string>> = {
  allowed: 'Allowed',
  'allowed-with-conditions': 'Allowed with conditions',
  'read-only': 'Read-only',
  'explicitly-prohibited': 'Explicitly prohibited',
  'not-applicable': 'Not applicable',
  unavailable: 'Unavailable',
}

const STATE_TONE: Readonly<Record<string, StatusTone>> = {
  draft: 'info',
  pending_approval: 'attention',
  active: 'ok',
  archived: 'neutral',
  'paused by archival cascade': 'blocked',
}

/** One matrix cell, printed with its status token and the source's own text. */
function cell(status: ControlStatus | null, detail: string) {
  return (
    <>
      {status === null ? (
        <span className="font-medium text-[var(--color-ink-subtle)]">Not stated on this row</span>
      ) : (
        <span className="font-medium">{STATUS_LABEL[status]}</span>
      )}
      <span className="mt-1 block text-xs text-[var(--color-ink-muted)]">{detail}</span>
    </>
  )
}

/**
 * The Quality Manager cell of row 11 is printed as BOTH halves, in one cell,
 * because that is what the source wrote there. Every other cell has one.
 */
function matrixCellFor(rowIndex: number, role: TenantRoleId) {
  const row = MOD_DOH_05_MATRIX[rowIndex]!
  const second = row.secondAct
  if (second === null) return cell(row.status[role], row.detail[role])
  return (
    <div data-testid={`two-status-cell-${role}`}>
      {cell(row.status[role], row.detail[role])}
      <span className="mt-2 block border-t border-[var(--color-border)] pt-2">
        {cell(second.status[role], second.detail[role])}
      </span>
    </div>
  )
}

/**
 * ABSENT WHEN THE ROLE NEVER HOLDS THE ACT, DISABLED WHEN A CONDITION COULD
 * CHANGE — and the test is the STAGE, not the reason code.
 *
 * `evaluateAccess` refuses at `BASE_ROLE` in two spellings: `EXPLICIT_DENY`
 * where the request names the role in `deniedRoles`, and `ROLE_NOT_GRANTED`
 * where it names it in neither list. Both mean the same thing to a reader —
 * no role on this row grants you this — and on row 4 this module meets both
 * on one row: the Supervisor's flat `Explicitly prohibited` produces the
 * first and the Tenant Admin's prohibition-with-an-escape produces the
 * second, because wave 0 deliberately put the Tenant Admin in neither list
 * rather than assert either half of its cell.
 *
 * Keying on `ROLE_NOT_GRANTED` alone therefore drew NOTHING for the Tenant
 * Admin, whose cell carries an escape, and a DISABLED Approve button for the
 * Supervisor, whose cell is categorical and never lifts — the inversion of
 * what each cell says. Found by this module's component suite rather than by
 * reading, and fixed by asking the stage: a `BASE_ROLE` refusal is a
 * statement about the role, and a later stage's refusal (segregation of
 * duties, object state, suspension) is a statement about this Job right now,
 * which is what a disabled control with its reason is for.
 */
function isCategoricalRoleRefusal(decision: PermissionDecision): boolean {
  return decision.outcome === 'explicitlyProhibited' && decision.stage === 'BASE_ROLE'
}

/** A control whose act is refused renders by the same rule everywhere here. */
function Act({
  label,
  decision,
  roleName,
  absentNote,
}: {
  readonly label: string
  readonly decision: PermissionDecision
  readonly roleName: string
  readonly absentNote: string
}) {
  if (isCategoricalRoleRefusal(decision)) {
    return <ProhibitionNotice rendering={{ kind: 'absent', note: absentNote }} />
  }
  if (!permitsAction(decision)) {
    return (
      <Button
        disabledReason={`${decision.explanation}${
          decision.conditionToEnable !== null ? ` ${decision.conditionToEnable}` : ''
        } Viewing as ${roleName}.`}
      >
        {label}
      </Button>
    )
  }
  // Storyboard: every control is inert by construction. Nothing here writes.
  return <Button onClick={() => undefined}>{label}</Button>
}

export function JobLifecycleScreen() {
  const [role, setRole] = useState<TenantRoleId>('SUPERVISOR')
  const [selectedJobId, setSelectedJobId] = useState<string>('JOB-BRAKECHECK')

  const roleName = roleById(role as RoleId).name
  const selected: SeededJob =
    SEEDED_JOBS.find((j) => j.record.jobId === selectedJobId) ?? SEEDED_JOBS[0]!

  const act = (id: Doh05ActId) => actDecision(role, id)
  const absent = (what: string) =>
    `${what} is not offered to the ${roleName} on this screen. The matrix below states the refusal for this row and this role, and a disabled control would imply a condition that could become true.`

  const listRows: readonly TableRow[] = SEEDED_JOBS.map((job) => ({
    job: (
      <>
        <button
          type="button"
          className="text-left font-medium underline"
          onClick={() => setSelectedJobId(job.record.jobId)}
        >
          {job.record.name}
        </button>
        <span className="block text-xs text-[var(--color-ink-subtle)]">{job.record.jobId}</span>
      </>
    ),
    state: (
      <>
        <StatusPill
          tone={STATE_TONE[jobStateLabel(job)] ?? 'neutral'}
          icon="●"
          label={jobStateLabel(job)}
        />
        {isPausedByArchivalCascade(job) ? (
          <span
            data-testid="derived-cascade-pause"
            className="mt-1 block text-xs text-[var(--color-ink-muted)]"
          >
            Derived, not stored. The Job&rsquo;s own state is still {job.record.state}; the pause is
            read from the bound node being archived, which is why it lifts by itself if that
            archival is abandoned.
          </span>
        ) : null}
      </>
    ),
    node: (
      <>
        <span>{job.record.parentNodeId}</span>
        <span className="block text-xs text-[var(--color-ink-subtle)]">
          One parent node, at the tenant&rsquo;s configured depth.
        </span>
      </>
    ),
    owner: displayNameFor(job.record.ownerId),
    creator: displayNameFor(job.record.createdBy),
  }))

  const matrixRows: readonly TableRow[] = MOD_DOH_05_MATRIX.map((row, index) => ({
    control: (
      <>
        <span className="font-medium">
          {row.ordinal}. {row.control}
        </span>
        <span className="block text-xs text-[var(--color-ink-subtle)]">{row.sourceRef}</span>
        {row.kind === 'restatement' ? (
          <span
            data-testid="restatement-not-an-act"
            className="mt-1 block text-xs text-[var(--color-ink-muted)]"
          >
            A restatement, not a second act: it states negatively the condition row{' '}
            {doh05Row(row.restates!).ordinal} already carries. It yields no control anywhere in this
            module.
          </span>
        ) : null}
        {row.surface === 'another-surface' ? (
          <span
            data-testid="met-on-another-screen"
            className="mt-1 block text-xs text-[var(--color-ink-muted)]"
          >
            Met on another screen. Classified before the token is read, so no control follows from
            the permissive cell beside it.
          </span>
        ) : null}
      </>
    ),
    admin: matrixCellFor(index, 'TENANT_ADMIN'),
    supervisor: matrixCellFor(index, 'SUPERVISOR'),
    quality: matrixCellFor(index, 'QUALITY_MANAGER'),
    auditor: matrixCellFor(index, 'READONLY_AUDITOR'),
    worker: matrixCellFor(index, 'WORKER'),
    rendering: (
      <>
        <span>{row.rendering}</span>
        <span className="mt-1 block text-xs text-[var(--color-ink-subtle)]">{row.effect}</span>
      </>
    ),
  }))

  return (
    <HubShell screen={MODULE_HEADER} role={role} onRoleChange={setRole}>
      <section aria-label="Where this module's screens are" className="mt-6">
        <h2 className="text-lg font-semibold">One module, three screens, two routes</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {dohScreenById('SCR-DOH-10').name} and {dohScreenById('SCR-DOH-11').name} are this route;{' '}
          {dohScreenById('SCR-DOH-12').name} is{' '}
          <Link href={APPROVAL_QUEUE_ROUTE} className="underline">
            its own route
          </Link>
          , because catalogue B gives it its own navigation entry rather than reaching it from the
          Job list. The Approve control lives there and nowhere else: one governed act, one entry
          point.
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Who is offered this module is derived from the fourteen rows below by the one shared rule,
          not hand-written here: {MOD_DOH_05_REACH.map((r) => roleById(r as RoleId).name).join(', ')}.
          The Worker is withheld because row 14 marks the Worker <em>Unavailable</em> — no standing
          in any scope — and the route registry withholds every Hub route from the Worker one layer
          above that anyway.
        </p>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          Catalogue B&rsquo;s &ldquo;roles that can open it&rdquo; cell for the Job editor names the
          Supervisor alone, and row 2 gives the Tenant Admin unconditional{' '}
          <em>Allowed</em> on the very capability that screen is. The rail is derived from the
          matrix; the catalogue cell is quoted and not obeyed.
        </p>
      </section>

      <section aria-label="Job list" className="mt-6">
        <h2 className="text-lg font-semibold">Jobs</h2>
        <div className="mt-3">
          <Table
            caption="Jobs in this tenant, with their state, parent-node binding, owner and creator"
            columns={[
              { key: 'job', header: 'Job' },
              { key: 'state', header: 'State' },
              { key: 'node', header: 'Parent node' },
              { key: 'owner', header: 'Job Owner (a field)' },
              { key: 'creator', header: 'Created by' },
            ]}
            rows={listRows}
            emptyState={{
              title: 'No Job has been defined in this tenant.',
              whatCreatesIt: 'A Tenant Admin or a Supervisor creates the first Job in draft.',
            }}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-start gap-4">
          <Act
            label="New Job"
            decision={act('create-a-job')}
            roleName={roleName}
            absentNote={absent('Creating a Job')}
          />
          <Act
            label="Archive or un-archive this Job"
            decision={act('archive-or-un-archive-a-job')}
            roleName={roleName}
            absentNote={absent('Archiving a Job')}
          />
        </div>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          Archival is soft in both directions — historical runs are retained and un-archive is
          supported — so neither control is destructive and neither is one-way.
        </p>
      </section>

      <section aria-label="Job editor" className="mt-8">
        <h2 className="text-lg font-semibold">
          {dohScreenById('SCR-DOH-11').name} — {selected.record.name}
        </h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          A sub-view of this route, not a route of its own. Catalogue B mounts Job cloning and
          multi-Area pairing inside it; both are other tasks&rsquo; modules and neither is drawn
          here.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4">
            <h3 className="font-medium">Binding</h3>
            <p className="mt-1 text-sm text-[var(--color-ink)]">
              Parent node: {selected.record.parentNodeId}
            </p>
            <p
              data-testid="dec-area-001-position"
              className="mt-2 text-xs text-[var(--color-ink-muted)]"
            >
              {DEC_AREA_001_POSITION.id} — {DEC_AREA_001_POSITION.classification}, never{' '}
              {DEC_AREA_001_POSITION.neverClassifiedAs}. Ratification: {DEC_AREA_001_POSITION.ratification}{' '}
              {DEC_AREA_001_POSITION.position} {DEC_AREA_001_POSITION.consequence}{' '}
              {DEC_AREA_001_POSITION.ifReversed}
            </p>
          </div>

          <div className="rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4">
            <h3 className="font-medium">Job Owner</h3>
            <p className="mt-1 text-sm text-[var(--color-ink)]">
              {displayNameFor(selected.record.ownerId)}
            </p>
            <p className="mt-2 text-xs text-[var(--color-ink-muted)]">
              A field on the Job record, not a role. It routes version-adoption decisions and
              paired-Job change flags to an accountable person and confers no permission of any
              kind, so no role list anywhere in this build contains it.
            </p>
            <div className="mt-3">
              <Act
                label="Reassign the Job Owner"
                decision={act('reassign-the-job-owner')}
                roleName={roleName}
                absentNote={absent('Reassigning the Job Owner')}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4">
          <h3 className="font-medium">Definition</h3>
          <p className="mt-1 text-sm text-[var(--color-ink)]">
            Job Type: {selected.record.jobTypeId} — a tenant-created entry.
          </p>
          <p data-testid="seeded-catalogue-empty" className="mt-2 text-xs text-[var(--color-ink-muted)]">
            The platform-seeded catalogue holds {DEC_TAX_002_SEEDED_COUNTS.shippedAtV1} Job Types and{' '}
            {DEC_TAX_002_SEEDED_COUNTS.shippedAtV1} Service Type tags at version 1. The counts of{' '}
            {DEC_TAX_002_SEEDED_COUNTS.jobTypes} and {DEC_TAX_002_SEEDED_COUNTS.serviceTypes} are
            source-confirmed; the sixteen names are owed by the client and are never invented here,
            so no seeded name appears on this screen or in this build&rsquo;s state.
          </p>
          <div className="mt-3 flex flex-wrap gap-4">
            <Act
              label="Edit this draft Job"
              decision={act('edit-a-draft-job')}
              roleName={roleName}
              absentNote={absent('Editing a draft Job')}
            />
            <Act
              label="Submit for approval"
              decision={act('submit-a-job-for-approval')}
              roleName={roleName}
              absentNote={absent('Submitting a Job for approval')}
            />
            <Act
              label="Create a custom Job Type"
              decision={act('create-a-custom-job-type')}
              roleName={roleName}
              absentNote={absent('Creating a custom Job Type')}
            />
            <Act
              label="Apply a Service Type tag"
              decision={act('apply-a-service-type-tag')}
              roleName={roleName}
              absentNote={absent('Applying a Service Type tag')}
            />
          </div>
          <p className="mt-3 max-w-prose text-xs text-[var(--color-ink-subtle)]">
            A Service Type tag pre-populates the qualification requirements from the tenant mapping
            and never enforces them; the pre-populated set stays fully editable. The tag suggests, it
            never decides.
          </p>
          <div className="mt-3">
            <DecisionDisclosure id="DEC-TAX-002" />
          </div>
        </div>

        <div
          data-testid="row-8-met-elsewhere"
          role="note"
          className="mt-4 rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4 text-sm"
        >
          <p className="font-medium text-[var(--color-ink)]">
            {doh05Row('maintain-the-tag-to-qualification-set-mapping').control} — maintained
            elsewhere
          </p>
          <p className="mt-1 text-[var(--color-ink-muted)]">
            The mapping this screen reads when a Service Type tag pre-populates requirements is
            maintained in the tenant administration area, which is a different screen of this
            surface and an ownerless screen group this build serves no route for. There is no
            control here — not an enabled one, and not a disabled one — and no link, because a link
            to a route that does not exist reads as a verified pointer.
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
            The row&rsquo;s Tenant Admin cell reads <em>Allowed with conditions</em>. The
            classification decides what is drawn here; the token does not.
          </p>
        </div>

        <div className="mt-4 rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4">
          <h3 className="font-medium">Workflow version</h3>
          {selected.notifiedClassVersionAwaitingAdoption === null ? (
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              No notified-class version is awaiting a decision on this Job. Patch versions apply
              directly, with no Job-Owner decision and no prompt — they never reach this panel.
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-[var(--color-ink)]">
                {selected.notifiedClassVersionAwaitingAdoption}
              </p>
              <div className="mt-3">
                <Act
                  label="Adopt this version on this Job"
                  decision={adoptVersionDecision(role, selected, '2.1.0')}
                  roleName={roleName}
                  absentNote={`Adopting a notified-class version on ${selected.record.jobId} is not offered to you. Every cell on that row is conditional on being the Job Owner of this Job, so where the Job's owner field names somebody else the row grants the act to no role at all — and there is no JOB_OWNER in any role list, because Job Owner is a field on the Job record.`}
                />
                <PermissionNotice decision={adoptVersionDecision(role, selected, '2.1.0')} />
              </div>
            </>
          )}
          <div className="mt-4">
            <CrossSurfaceStatement
              statement={crossSurfaceStatement('workflow-and-instruction-authoring', role as RoleId)}
            />
          </div>
        </div>

        <div className="mt-4 rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4">
          <h3 className="font-medium">Recurrence</h3>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            {selected.pendingRecurrenceProposal ??
              'No recurrence change is proposed on this Job. Modifying the recurrence of an active Job passes the same Quality-Manager approval gate as the Job itself.'}
          </p>
          <p
            data-testid="two-acts-one-cell"
            className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]"
          >
            This row&rsquo;s Quality Manager cell states two statuses in one cell — prohibited for
            proposing, allowed for approving — so it is drawn as two controls rather than one. A
            single control would either offer a propose action to the one role forbidden to propose,
            or remove the approve action the gate cannot run without, and neither loss would
            announce itself.
          </p>
          <div className="mt-3 flex flex-wrap gap-4">
            <Act
              label="Propose a recurrence change"
              decision={act('modify-recurrence-on-an-active-job')}
              roleName={roleName}
              absentNote={absent('Proposing a recurrence change')}
            />
            <Act
              label="Approve the proposed recurrence"
              decision={act('approve-a-recurrence-modification')}
              roleName={roleName}
              absentNote={`Approving a proposed recurrence change is not offered to the ${roleName}. This row states the approving half for the Quality Manager and is silent about this role, so nothing is drawn and the silence is recorded rather than filled in.`}
            />
            <Act
              label="Keep or cancel the affected runs"
              decision={act('decide-keep-or-cancel-on-affected-runs')}
              roleName={roleName}
              absentNote={absent('Deciding keep-or-cancel on affected runs')}
            />
          </div>
          <p className="mt-3 max-w-prose text-xs text-[var(--color-ink-subtle)]">
            While a change awaits approval the Job keeps running on its current schedule. On
            approval the new pattern takes effect from the next cycle, and already-scheduled runs
            that no longer fit it are flagged for an explicit keep-or-cancel decision rather than
            being silently dropped.
          </p>
        </div>
      </section>

      <section aria-label="Control matrix" className="mt-8">
        <h2 className="text-lg font-semibold">
          The whole matrix — {MOD_DOH_05_MATRIX.length} rows, {MOD_DOH_05_ACTS.length} acts
        </h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Fourteen rows, five roles, an explicit status in every cell. It renders here in full and
          once: the approval queue is a second route of this same module and reads these same rows
          rather than transcribing the half it needs. Thirteen acts, not fourteen — one row is a
          restatement and yields none, one row is met on another screen and yields none here, and
          one row states two acts in a single cell.
        </p>
        <div className="mt-3">
          <Table
            caption="MOD-DOH-05 control matrix, by tenant role"
            columns={[
              { key: 'control', header: 'Control' },
              { key: 'admin', header: 'Tenant Admin' },
              { key: 'supervisor', header: 'Supervisor' },
              { key: 'quality', header: 'Quality Manager' },
              { key: 'auditor', header: 'Read-only Auditor' },
              { key: 'worker', header: 'Worker' },
              { key: 'rendering', header: 'How it renders here' },
            ]}
            rows={matrixRows}
            emptyState={{
              title: 'No control is defined for this module.',
              whatCreatesIt: 'The frozen source defines the matrix.',
            }}
          />
        </div>
        <p
          data-testid="escape-on-the-list"
          className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]"
        >
          Row 4&rsquo;s Tenant Admin cell is a prohibition carrying a permissive escape —{' '}
          {MOD_DOH_05_ESCAPE.clause}. {MOD_DOH_05_ESCAPE.whyNot}
        </p>
      </section>

      <section aria-label="What the source does not say" className="mt-8">
        <h2 className="text-lg font-semibold">What the source does not say</h2>
        <ul className="mt-2 space-y-3">
          {MOD_DOH_05_UNSPECIFIED_IN_SOURCE.map((silence) => (
            <li key={silence.about} className="max-w-prose text-sm text-[var(--color-ink-muted)]">
              <span className="font-medium text-[var(--color-ink)]">{silence.about}: </span>
              {silence.what}
              <span className="block text-xs text-[var(--color-ink-subtle)]">
                {silence.sourceRef}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 text-sm">
        <Link href={JOB_LIFECYCLE_ROUTE} className="underline">
          This route
        </Link>{' '}
        holds the Job list and the Job editor.{' '}
        <Link href={APPROVAL_QUEUE_ROUTE} className="underline">
          The Job approval queue
        </Link>{' '}
        holds the approval decision.
      </p>
    </HubShell>
  )
}
