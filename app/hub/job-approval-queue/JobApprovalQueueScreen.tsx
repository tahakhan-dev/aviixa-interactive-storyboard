'use client'

import { useState } from 'react'
import Link from 'next/link'
import { HubShell, type TenantRoleId } from '../HubShell'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import { Button, StatusPill, Table, type TableRow } from '@/ui/primitives'
import { PermissionNotice } from '@/ui/primitives/PermissionNotice'
import { roleById, type RoleId } from '@/domain/roles'
import { permitsAction, type PermissionDecision } from '@/policy/decision'
import { dohScreenById } from '@/surfaces/doh/screens'
import {
  MOD_DOH_05_ESCAPE,
  MOD_DOH_05_REACH,
  doh05Row,
} from '@/surfaces/doh/modules/doh-05/matrix'
import {
  approvalQueueFor,
  displayNameFor,
  identityFor,
  type SeededJob,
} from '@/surfaces/doh/modules/doh-05/jobs'
import { approveDecision } from '@/surfaces/doh/modules/doh-05/access'
import { APPROVAL_QUEUE_ROUTE, JOB_LIFECYCLE_ROUTE, QUEUE_HEADER } from '@/surfaces/doh/modules/doh-05/routes'

/**
 * `MOD-DOH-05` — `SCR-DOH-12`, the Job approval queue (L48106), at
 * `/hub/job-approval-queue`.
 *
 * A SECOND ROUTE OF THE SAME MODULE, NOT A SECOND MODULE. Catalogue B gives
 * this screen its own navigation entry — "Operations home, work group" —
 * rather than reaching it from the Job list, which is why it is a route. It
 * reads the same fourteen-row matrix the Job list reads, from
 * `@/surfaces/doh/modules/doh-05/matrix`, and transcribes none of it: the
 * matrix renders in full on the other route and is linked from here.
 *
 * THE PANEL WITH NO DECISION CONTROL IS THE POINT OF THIS SCREEN.
 * `SB-DOH-017` (L27805) describes the queue and then describes what is NOT
 * in it: "A Job she created herself does not appear in her queue at all" —
 * it appears in a separate panel headed "Awaiting another approver — you
 * created these", carrying no decision control. A list of items the viewer
 * may not act on reads as an oversight until the alternatives are named.
 * Hiding those Jobs leaves the submitter unable to see that their own Job is
 * queued at all. Showing them with a disabled Approve button implies a
 * condition that could become true, and for this viewer on this Job it never
 * can — segregation of duties is absolute and does not lapse.
 *
 * WHICH LIST A JOB IS IN AND WHETHER THE CONTROL RENDERS ARE TWO QUESTIONS,
 * AND THEY ARE ANSWERED BY DIFFERENT THINGS ON PURPOSE. The partition is
 * `approvalQueueFor`, on the Job's `createdBy` field. The control is
 * `approveDecision`, which builds a `DOH_APPROVE_JOB` command and lets
 * `hubAccessRequest` supply the EXISTING `makerCheckerOf` field of
 * `evaluateAccess`. Nothing in this module compares a creator against a
 * viewer: a second spelling of maker-checker is a defect on this build even
 * when both spellings agree, and `tests/unit/doh-job.test.ts` asserts the
 * two answers agree on every Job rather than assuming it.
 */

/**
 * ABSENT WHEN THE ROLE NEVER HOLDS THE ACT, DISABLED WHEN A CONDITION COULD
 * CHANGE, and the test is the STAGE rather than the reason code — the same
 * rule the sibling route applies, and it matters most here.
 *
 * Row 4 produces BOTH `BASE_ROLE` spellings on one row. The Supervisor is
 * named in the command spec's `deniedRoles` and is refused `EXPLICIT_DENY`;
 * the Tenant Admin is named in neither list — deliberately, so that neither
 * half of its prohibition-with-an-escape is asserted — and is refused
 * `ROLE_NOT_GRANTED`. Keying on the reason code drew a disabled Approve
 * button for the Supervisor, whose cell is categorical and never lifts, and
 * nothing at all for the Tenant Admin, whose cell carries an escape. The
 * stage asks the question both spellings actually answer.
 *
 * A refusal from a LATER stage stays a disabled control with its reason:
 * segregation of duties is a statement about this Job and this person, not
 * about the role, and this screen shows one only where the queue partition
 * has already put the Job in the decidable list.
 */
function isCategoricalRoleRefusal(decision: PermissionDecision): boolean {
  return decision.outcome === 'explicitlyProhibited' && decision.stage === 'BASE_ROLE'
}

function QueueRow({ job }: { readonly job: SeededJob }) {
  return (
    <>
      <span className="font-medium">{job.record.name}</span>
      <span className="block text-xs text-[var(--color-ink-subtle)]">{job.record.jobId}</span>
    </>
  )
}

export function JobApprovalQueueScreen() {
  const [role, setRole] = useState<TenantRoleId>('QUALITY_MANAGER')

  const roleName = roleById(role as RoleId).name
  const viewer = identityFor(role)
  const queue = approvalQueueFor(viewer)
  const approveRow = doh05Row('approve-a-job')
  const restatementRow = doh05Row('approve-a-job-the-same-identity-created')

  const decidableRows: readonly TableRow[] = queue.decidable.map((job) => {
    const decision = approveDecision(role, job)
    return {
      job: <QueueRow job={job} />,
      creator: (
        <>
          <span className="font-medium">{displayNameFor(job.record.createdBy)}</span>
          <span className="block text-xs text-[var(--color-ink-subtle)]">
            Shown prominently, because the creator&rsquo;s identity is the governance fact that
            matters most on this screen.
          </span>
        </>
      ),
      decision: (
        <div className="flex flex-col gap-2">
          {isCategoricalRoleRefusal(decision) ? (
            <ProhibitionNotice
              rendering={{
                kind: 'absent',
                note: `No approval control is drawn for the ${roleName} on this Job. Row ${approveRow.ordinal} grants this act to the Quality Manager alone, under a condition; the Tenant Admin cell is a prohibition carrying an escape this build cannot construct, and nothing is asserted in either direction.`,
              }}
            />
          ) : !permitsAction(decision) ? (
            <Button
              disabledReason={`${decision.explanation}${
                decision.conditionToEnable !== null ? ` ${decision.conditionToEnable}` : ''
              } Viewing as ${roleName}.`}
            >
              Approve
            </Button>
          ) : (
            <Button onClick={() => undefined}>Approve</Button>
          )}
          <PermissionNotice decision={decision} />
        </div>
      ),
    }
  })

  return (
    <HubShell screen={QUEUE_HEADER} role={role} onRoleChange={setRole}>
      <section aria-label="What this queue is" className="mt-6">
        <h2 className="text-lg font-semibold">{dohScreenById('SCR-DOH-12').name}</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Jobs in <em>pending approval</em>, with the creator&rsquo;s name shown prominently. In
          practice this screen belongs to the Quality Manager: row {approveRow.ordinal} of the
          matrix grants the approval to that role alone, under a condition. The other three roles
          that reach this module —{' '}
          {MOD_DOH_05_REACH.filter((r) => r !== 'QUALITY_MANAGER')
            .map((r) => roleById(r as RoleId).name)
            .join(', ')}{' '}
          — open the route and meet a refusal they can read, because no cell on that row marks any
          of them <em>Unavailable</em>; a role marked Unavailable would not be offered the route at
          all.
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The full fourteen-row matrix renders once, on{' '}
          <Link href={JOB_LIFECYCLE_ROUTE} className="underline">
            the Job list and editor
          </Link>
          . This screen reads the same rows rather than restating the half it needs.
        </p>
      </section>

      <section aria-label="Awaiting your decision" className="mt-6">
        <h2 className="text-lg font-semibold">Awaiting your decision</h2>
        <div className="mt-3">
          <Table
            caption="Jobs in pending approval that this viewer did not create"
            columns={[
              { key: 'job', header: 'Job' },
              { key: 'creator', header: 'Created by' },
              { key: 'decision', header: 'Decision' },
            ]}
            rows={decidableRows}
            emptyState={{
              title: 'Nothing is waiting on your decision.',
              whatCreatesIt:
                'A Tenant Admin or a Supervisor submits a Job for approval, and it routes to an approver who is not its creator.',
            }}
          />
        </div>
      </section>

      <section
        aria-label="Awaiting another approver — you created these"
        data-testid="awaiting-another-approver"
        className="mt-8"
      >
        <h2 className="text-lg font-semibold">Awaiting another approver — you created these</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          These Jobs are in <em>pending approval</em> and you submitted them, so they are not in the
          queue above and they carry no decision control here. That is the design and not an
          oversight: hiding them would leave you unable to see that your own Job is queued at all,
          and a disabled Approve button would imply a condition that could one day become true.
          Segregation of duties is absolute — the person who creates a Job can never approve that
          same Job, including where the creator holds the approver role — so approval routes to a
          second qualified approver rather than being offered to you and then refused.
        </p>
        <div className="mt-3">
          <Table
            caption="Jobs in pending approval that this viewer created — no decision control"
            columns={[
              { key: 'job', header: 'Job' },
              { key: 'creator', header: 'Created by' },
              { key: 'routing', header: 'What happens instead' },
            ]}
            rows={queue.awaitingAnotherApprover.map((job) => ({
              job: <QueueRow job={job} />,
              creator: displayNameFor(job.record.createdBy),
              routing: (
                <span data-testid="no-decision-control">
                  Routed to a second qualified approver. Nothing to press here — not an enabled
                  control and not a disabled one.
                </span>
              ),
            }))}
            emptyState={{
              title: 'You have no Job of your own awaiting another approver.',
              whatCreatesIt:
                'Submitting a Job you created puts it here rather than in the queue above.',
            }}
          />
        </div>
      </section>

      <section aria-label="The two rows this screen turns on" className="mt-8">
        <h2 className="text-lg font-semibold">The two rows this screen turns on</h2>

        <div className="mt-3 rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4">
          <h3 className="font-medium">
            Row {approveRow.ordinal}. {approveRow.control} — {approveRow.sourceRef}
          </h3>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Quality Manager: {approveRow.detail.QUALITY_MANAGER}
          </p>
          <p
            data-testid="prohibition-with-an-escape"
            className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]"
          >
            <span className="font-medium text-[var(--color-ink)]">
              The Tenant Admin cell is a prohibition carrying a permissive escape.{' '}
            </span>
            It reads {approveRow.detail.TENANT_ADMIN}. Reading the leading token alone would assert
            a flat prohibition the source qualifies; reading the escape alone would assert a grant
            the source leads away from. {MOD_DOH_05_ESCAPE.whyNot}
          </p>
        </div>

        <div className="mt-3 rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4">
          <h3 className="font-medium">
            Row {restatementRow.ordinal}. {restatementRow.control} — {restatementRow.sourceRef}
          </h3>
          <p
            data-testid="row-5-is-a-restatement"
            className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]"
          >
            Prohibited in all five columns, and it is not a second act. It states negatively the
            condition row {approveRow.ordinal} already carries on the Quality Manager — never a Job
            the same identity created. Rendering it as a capability of its own would invent an act
            somebody could hold and then have to explain why nobody holds it, so it yields no
            control anywhere in this module and appears here only as the reason attached to row{' '}
            {approveRow.ordinal}.
          </p>
          <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
            Its Quality Manager cell is where the source states what replaces the refused control:{' '}
            {restatementRow.detail.QUALITY_MANAGER}
          </p>
          <p className="mt-2">
            <StatusPill tone="info" icon="●" label="Restatement — yields no act" />
          </p>
        </div>
      </section>

      <p className="mt-8 text-sm">
        <Link href={APPROVAL_QUEUE_ROUTE} className="underline">
          This route
        </Link>{' '}
        holds the approval decision.{' '}
        <Link href={JOB_LIFECYCLE_ROUTE} className="underline">
          The Job list and editor
        </Link>{' '}
        hold the definition, the version panel, the recurrence gate and the whole matrix.
      </p>
    </HubShell>
  )
}
