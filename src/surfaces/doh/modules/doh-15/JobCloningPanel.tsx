'use client'

import { useState } from 'react'
import type { TenantRoleId } from '../../../../../app/hub/HubShell'
import { roleById, type RoleId } from '@/domain/roles'
import { Button, Checkbox, Field, StatusPill } from '@/ui/primitives'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import type { TenantWriteState } from '@/surfaces/doh/tenant-state'
import { jobOwnerVerdict } from '@/surfaces/doh/job-owner'
import type { JobRecord } from '@/surfaces/doh/objects'
import {
  CLONE_DIALOGUE_FOOTER,
  COPIED_ELEMENTS,
  MOD_DOH_15_ESCAPE,
  MOD_DOH_15_MATRIX,
  MOD_DOH_15_MOUNT,
  MOD_DOH_15_REACH,
  MOD_DOH_15_UNSPECIFIED_IN_SOURCE,
  RECURRENCE_PROMPT,
  RESET_ELEMENTS,
  doh15Affordance,
  doh15Row,
  type Doh15Affordance,
  type Doh15Context,
} from './matrix'

/**
 * `MOD-DOH-15` — the clone dialogue, `SB-DOH-027` (L29547).
 *
 * IT IS A COMPONENT AND NOT A SCREEN, because catalogue B gives it no
 * `SCR-DOH-*` row of its own: L48105 mounts it inside `SCR-DOH-11`, the Job
 * editor. So there is no route, no `page.tsx`, and no rail entry — the Job
 * editor draws it, and the Job editor is `MOD-DOH-05`'s.
 *
 * IT HOLDS NO POLICY. Every answer below comes from `doh15Affordance` in
 * `./matrix`, which asks the four questions in their settled order. This
 * file draws what it is handed and computes no permission of its own.
 *
 * WHY THE RECURRENCE OF THE SOURCE IS A CONTROL RATHER THAN A READ. The
 * whole card branches on whether the source Job recurs, and `JobRecord`
 * carries no recurrence field, so the record cannot answer it (see
 * `MOD_DOH_15_UNSPECIFIED_IN_SOURCE` entry 3). Both branches are real
 * source behaviour — L29489 raises the prompt, L29494 says a non-recurring
 * source raises none — so both render, and the reader chooses which. A
 * default that hid one branch would settle, on screen, a question this
 * build cannot read.
 */
export interface JobCloningPanelProps {
  readonly role: TenantRoleId
  /** The Job the editor has open. The clone's source. */
  readonly sourceJob: JobRecord
  /** Defaults to the state the Job editor renders under. */
  readonly tenantState?: TenantWriteState
  readonly online?: boolean
}

/** One affordance, drawn by the rule the fold returned and never by taste. */
function Affordance({ affordance, testId }: { affordance: Doh15Affordance; testId: string }) {
  if (affordance.kind === 'absent') {
    return (
      <span data-testid={testId}>
        <ProhibitionNotice rendering={{ kind: 'absent', note: affordance.reason }} />
      </span>
    )
  }
  return (
    <span data-testid={testId}>
      {affordance.blockedByTenantState !== null ? (
        <Button disabledReason={affordance.blockedByTenantState}>{affordance.label}</Button>
      ) : (
        <Button onClick={() => undefined}>{affordance.label}</Button>
      )}
      <span className="mt-1 block text-xs text-[var(--color-ink-muted)]">
        {affordance.conditions}
      </span>
    </span>
  )
}

export function JobCloningPanel({
  role,
  sourceJob,
  tenantState = 'active',
  online = true,
}: JobCloningPanelProps) {
  const [sourceRecurs, setSourceRecurs] = useState(true)
  const roleName = roleById(role as RoleId).name
  const ctx: Doh15Context = { tenantState, online, sourceRecurs }
  const affordance = (id: Parameters<typeof doh15Row>[0]) =>
    doh15Affordance(doh15Row(id), role, ctx)

  // The clone's owner field defaults to the creator, as every Job's does
  // (L27652). Read through the shared predicate, which cannot be asked "is
  // this identity a Job Owner" — only "is it the owner of THIS Job".
  const sourceOwner = jobOwnerVerdict(
    { jobId: sourceJob.jobId, ownerId: sourceJob.ownerId },
    sourceJob.ownerId,
  )

  return (
    <section aria-label="Job cloning" className="mt-8" data-testid="mod-doh-15">
      <h2 className="text-lg font-semibold">Clone this Job — SB-DOH-027</h2>
      <p data-testid="doh-15-no-route" className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
        MOD-DOH-15 has no screen of its own. Catalogue B mounts it inside {MOD_DOH_15_MOUNT.mountedIn}{' '}
        — the {MOD_DOH_15_MOUNT.mountedInName} — at {MOD_DOH_15_MOUNT.sourceRef}, so this is a panel
        and not a route. Its own matrix admits {MOD_DOH_15_REACH.length} roles (
        {MOD_DOH_15_REACH.join(', ')}); catalogue B&rsquo;s &ldquo;Roles that can open it&rdquo; cell
        on that screen reads &ldquo;{MOD_DOH_15_MOUNT.catalogueBRoles}&rdquo;.
      </p>
      <p data-testid="doh-15-catalogue-narrowing" className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
        Narrower by: {MOD_DOH_15_MOUNT.narrowerThanTheMatrixBy.join(', ')}.{' '}
        {MOD_DOH_15_MOUNT.narrowingRef}. The narrowing is disclosed and not enforced — the catalogue
        cell is a quotation, never the reach answer, so no control below is withheld on its strength.{' '}
        {MOD_DOH_15_MOUNT.registerGap}
      </p>

      <div className="mt-4 rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4">
        <Field
          label="Name for the clone"
          description="Reset, never copied. The clone is named by the acting identity."
        >
          <input
            type="text"
            placeholder={`Copy of ${sourceJob.name}`}
            className="w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] px-3 py-2 text-sm"
          />
        </Field>

        <div className="mt-4">
          <Checkbox
            label="The source Job recurs"
            checked={sourceRecurs}
            onChange={setSourceRecurs}
          />
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
            Not a field of the Job record — handed to the fold, and both branches render.
          </p>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-medium">Copied — {COPIED_ELEMENTS.length} elements</h3>
            <ul data-testid="copied-elements" className="mt-2 space-y-2 text-sm">
              {COPIED_ELEMENTS.map((e) => (
                <li key={e.element}>
                  {e.element}
                  {e.plural ? ' (one element, two pointers)' : ''}
                  <span className="mt-0.5 block text-xs text-[var(--color-ink-muted)]">{e.note}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-medium">Reset — {RESET_ELEMENTS.length} elements</h3>
            <ul data-testid="reset-elements" className="mt-2 space-y-2 text-sm">
              {RESET_ELEMENTS.map((e) => (
                <li key={e.element}>
                  {e.element}
                  <span className="mt-0.5 block text-xs text-[var(--color-ink-muted)]">{e.to}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          data-testid="recurrence-row"
          className="mt-4 rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-3"
        >
          <StatusPill tone="attention" icon="●" label="Recurrence: reset to one-off" />
          {sourceRecurs ? (
            <p data-testid="recurrence-prompt" className="mt-2 text-sm text-[var(--color-ink)]">
              {RECURRENCE_PROMPT}
            </p>
          ) : null}
          <div className="mt-3">
            <Affordance affordance={affordance('answer-the-recurrence-prompt')} testId="row-2" />
          </div>
          <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
            Row 2&rsquo;s Tenant Admin cell is unconditional `Allowed` (L29478) for an act that can
            only occur inside a clone row 1 conditions on suspension, and only where the source
            recurs. The token is printed with both conditions named rather than drawn as an
            unconditional control. FUNC-DOH-15-2.1.1 (L29524) answers the same question differently
            — &ldquo;Roles allowed: the cloning identity&rdquo; — and that is a field of the act, not
            a role.
          </p>
        </div>

        <div className="mt-4">
          <Affordance affordance={affordance('clone-a-job')} testId="row-1" />
        </div>
        <p data-testid="clone-dialogue-footer" className="mt-3 text-sm text-[var(--color-ink)]">
          {CLONE_DIALOGUE_FOOTER}
        </p>
        <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
          The clone&rsquo;s Job Owner field defaults to the acting identity, as every Job&rsquo;s
          does. {sourceOwner.reason}
        </p>
      </div>

      <div className="mt-4 rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4">
        <h3 className="font-medium">What this panel draws nothing for</h3>
        <div data-testid="row-3-met-elsewhere" className="mt-3">
          <Affordance affordance={affordance('approve-the-cloned-job')} testId="row-3-affordance" />
          <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
            Approving a clone is met on another screen of this same surface, so no cross-surface
            statement is drawn either: a cross-surface component crosses a surface, not a module.
            The Tenant Admin cell is a prohibition carrying a permissive escape —{' '}
            &ldquo;{MOD_DOH_15_ESCAPE.clause}&rdquo; — and neither half is asserted.{' '}
            {MOD_DOH_15_ESCAPE.whyNot}
          </p>
        </div>
        <div data-testid="restatements" className="mt-4 space-y-3">
          <Affordance
            affordance={affordance('clone-a-job-into-an-active-state-directly')}
            testId="row-4"
          />
          <Affordance
            affordance={affordance('carry-the-source-jobs-approval-forward')}
            testId="row-5"
          />
          <Affordance
            affordance={affordance('carry-the-source-jobs-recurrence-forward-silently')}
            testId="row-6"
          />
        </div>
      </div>

      <div className="mt-4">
        <h3 className="font-medium">
          The whole matrix — {MOD_DOH_15_MATRIX.length} rows, viewing as {roleName}
        </h3>
        <ul data-testid="doh-15-matrix" className="mt-2 space-y-2 text-xs">
          {MOD_DOH_15_MATRIX.map((row) => (
            <li key={row.id}>
              <span className="font-medium text-[var(--color-ink)]">
                {row.ordinal}. {row.control}
              </span>{' '}
              <span className="text-[var(--color-ink-muted)]">
                ({row.sourceRef}, {row.kind}, {row.surface}) — {row.detail[role]}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <h3 className="font-medium">What the source does not say, or says twice</h3>
        <ul data-testid="doh-15-silences" className="mt-2 space-y-2 text-xs text-[var(--color-ink-muted)]">
          {MOD_DOH_15_UNSPECIFIED_IN_SOURCE.map((s) => (
            <li key={s.topic}>
              <span className="font-medium text-[var(--color-ink)]">{s.topic}</span> — {s.whatIsMissing}{' '}
              ({s.sourceRef})
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
