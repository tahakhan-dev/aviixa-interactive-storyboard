'use client'

import { useState } from 'react'
import { HubShell, type HubShellUncataloguedScreen, type TenantRoleId } from '../HubShell'
import { Button, Select, StatusPill, Table, type TableRow } from '@/ui/primitives'
import { roleById } from '@/domain/roles'
import { fallbackPattern } from '@/surfaces/doh/fallbacks'
import { MOD_DOH_16_TENANT_ADMIN_CONTRADICTION } from '@/surfaces/doh/job-owner'
import { DOH_UNCATALOGUED_SCREEN_NAMES } from '@/surfaces/doh/screens'
import {
  ABSENT_BY_RULE,
  CATALOGUE_A_PRIMARY_ROLE,
  CONTROL_MATRIX,
  DEC_AREA_001_POSITION,
  UNRESOLVED_IN_SOURCE,
} from '@/surfaces/doh/modules/doh-16/matrix'
import {
  doh16Affordance,
  doh16RolesReaching,
  type Doh16Affordance,
} from '@/surfaces/doh/modules/doh-16/rendering'
import {
  FLAG_CHIP_TEXT,
  SCOPE_PLACEHOLDER_TEXT,
  SEEDED_PAIRS,
  VIEWER_SCOPES,
  displayNameFor,
  flaggedJob,
  lanesOf,
  pairById,
  scopeVerdict,
  type PairedJobs,
} from '@/surfaces/doh/modules/doh-16/pairing'
import { SCREEN_TITLE } from './title'

/**
 * The paired scheduling view — `SB-DOH-028` (L29681), at
 * `/hub/multi-area-job-pairing`.
 *
 * ── THE ROUTE IS UNCATALOGUED, AND IT SAYS SO RATHER THAN BORROWING AN ID ──
 * Catalogue B carries no row for this view, so no catalogue-B identifier is
 * borrowed and none is minted. The registration is the storyboard NAME, held
 * in `DOH_UNCATALOGUED_SCREEN_NAMES` and read below — the same treatment
 * slice 5 gave `MOD-STU-14`'s offline package manifest, whose view is a
 * storyboard name carrying no catalogue id (`src/studio/modules.ts`,
 * `uncataloguedScreen`). The convention was followed, not re-invented.
 *
 * Catalogue A does name this view, and its identifier is a three-digit
 * literal this codebase forbids because the two catalogues collide on the
 * same numbers for different screens. So catalogue A's row is named by
 * locator throughout and its identifier is never written.
 *
 * ── THIS SCREEN DRAWS WHAT THE FOLD RETURNS, AND DECIDES NOTHING ──────────
 * Every affordance comes from `doh16Affordance(row, role, ctx)`. There is no
 * `role ===` and no `status ===` in this file. The one place the screen makes
 * a choice of its own is the disclosed member, which carries two readings and
 * no single answer — and the choice it makes is to draw BOTH.
 */

const UNCATALOGUED = DOH_UNCATALOGUED_SCREEN_NAMES.find((s) => s.moduleId === 'MOD-DOH-16')
if (UNCATALOGUED === undefined) {
  throw new Error('MOD-DOH-16 has no registered uncatalogued screen name')
}


/** Card L29595 for the name; card L29596 for the purpose, quoted. */
const SHELL_SCREEN: HubShellUncataloguedScreen = {
  title: SCREEN_TITLE,
  annotation: `MOD-DOH-16 · ${UNCATALOGUED.name} — an uncatalogued storyboard name, not a screen identifier. Catalogue B gives this view no row, so none is borrowed and none is minted; the module rail does not offer this route.`,
  purpose:
    'Represent work that spans Areas as two linked Jobs, visible together, with a human-decided change signal across the link.',
}

/**
 * ONE affordance, drawn. Four kinds, and no branch of this switch can produce
 * a disabled control — the type has no member for one.
 */
function Affordance({ id, affordance }: { id: string; affordance: Doh16Affordance }) {
  switch (affordance.kind) {
    case 'control':
      return (
        <div data-testid={`affordance-${id}`} data-kind="control">
          <Button variant="secondary">{affordance.label}</Button>
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{affordance.conditions}</p>
        </div>
      )
    case 'read-only':
      return (
        <div data-testid={`affordance-${id}`} data-kind="read-only">
          <p className="font-medium text-[var(--color-ink)]">{affordance.label}</p>
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{affordance.reason}</p>
        </div>
      )
    case 'absent':
      return (
        <div data-testid={`affordance-${id}`} data-kind="absent">
          <p className="text-xs text-[var(--color-ink-muted)]">{affordance.reason}</p>
        </div>
      )
    case 'disclosed':
      // BOTH readings, neither preferred. There is no `affordance.label` to
      // draw instead, which is what stops this branch collapsing into one.
      return (
        <div data-testid={`affordance-${id}`} data-kind="disclosed">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
            The source answers this cell twice
          </p>
          <ul className="mt-1 space-y-1">
            {affordance.contradiction.readings.map((reading) => (
              <li key={reading.rowId} className="text-xs text-[var(--color-ink-muted)]">
                <span className="font-medium text-[var(--color-ink)]">{reading.sourceLine}</span>{' '}
                {reading.cell}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{affordance.verdict.reason}</p>
        </div>
      )
  }
}

/** One lane of the paired view. Out of scope, it names existence and nothing else. */
function Lane({
  pair,
  role,
  side,
}: {
  pair: PairedJobs
  role: TenantRoleId
  side: 'a' | 'b'
}) {
  const [a, b] = lanesOf(pair)
  const job = side === 'a' ? a : b
  const verdict = scopeVerdict(job.record, VIEWER_SCOPES[role])
  const flagged = flaggedJob(pair)
  const carriesFlag = flagged !== null && flagged.record.jobId === job.record.jobId

  if (!verdict.held) {
    return (
      <div
        data-testid={`lane-${side}`}
        data-scope="placeholder"
        className="flex-1 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4"
      >
        <p className="text-sm text-[var(--color-ink-muted)]">{SCOPE_PLACEHOLDER_TEXT}</p>
        <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">{verdict.reason}</p>
      </div>
    )
  }

  return (
    <div
      data-testid={`lane-${side}`}
      data-scope="in-scope"
      className="flex-1 rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-4"
    >
      <p className="font-medium text-[var(--color-ink)]">{job.record.name}</p>
      <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
        {job.record.jobId} · parent node {job.record.parentNodeId} · resolves to Area{' '}
        {verdict.area ?? 'none'} · Job Owner field names{' '}
        {displayNameFor(job.record.ownerId)}
      </p>
      {carriesFlag ? (
        <div className="mt-2" data-testid={`flag-chip-${side}`}>
          <StatusPill tone="attention" icon="⚑" label={FLAG_CHIP_TEXT} />
        </div>
      ) : null}
    </div>
  )
}

export function PairedSchedulingScreen() {
  const [role, setRole] = useState<TenantRoleId>('SUPERVISOR')
  const [pairId, setPairId] = useState<string>(SEEDED_PAIRS[0]?.pairId ?? '')

  const pair = pairById(pairId)
  const ctx = { pair, scope: VIEWER_SCOPES[role] }
  const flagged = flaggedJob(pair)
  const reaching = doh16RolesReaching()

  const matrixRows: readonly TableRow[] = CONTROL_MATRIX.map((row) => ({
    control: row.control,
    source: row.sourceRef,
    affordance: <Affordance id={row.id} affordance={doh16Affordance(row, role, ctx)} />,
  }))

  return (
    <HubShell screen={SHELL_SCREEN} role={role} onRoleChange={setRole}>
      <section className="mt-6 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">The paired scheduling view</h2>
        <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
          Work spanning Areas is modelled as paired Jobs joined by an optional linked-Job
          reference, and paired Jobs render together here. Cancelling or materially changing one
          paired Job flags the paired Job&apos;s Owner for review — flagging only; no automated
          behaviour propagates across the link at V1.
        </p>

        <Select
          label="Paired Jobs"
          value={pairId}
          options={SEEDED_PAIRS.map((p) => ({ value: p.pairId, label: p.pairId }))}
          onChange={setPairId}
        />

        <p data-testid="pair-note" className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
          {pair.note}
        </p>

        <div className="flex items-center gap-3">
          <Lane pair={pair} role={role} side="a" />
          <span aria-hidden className="text-2xl text-[var(--color-ink-subtle)]">
            ⇄
          </span>
          <Lane pair={pair} role={role} side="b" />
        </div>

        <p data-testid="flag-routing" className="max-w-prose text-sm text-[var(--color-ink-muted)]">
          {flagged === null
            ? 'No paired Job on this pair has been cancelled or materially changed, so no review flag has been raised.'
            : `The flag routes to the Job Owner field on ${flagged.record.jobId}, which names ${displayNameFor(flagged.record.ownerId)}. Job Owner is a field on the Job record and not a role: it routes this act and confers no permissions.`}
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">
          Roles and permissions — six rows, L29611 to L29618
        </h2>
        <Table
          caption="MOD-DOH-16 roles and permissions, as this screen renders them for the selected persona"
          columns={[
            { key: 'control', header: 'Action' },
            { key: 'affordance', header: 'What renders here' },
            { key: 'source', header: 'Source' },
          ]}
          rows={matrixRows}
          emptyState={{
            title: 'No rows',
            whatCreatesIt: 'The matrix is fixed at six rows and cannot be empty.',
          }}
        />
        <p data-testid="reach" className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
          Derived from this matrix by the one shared rule, never hand-written: this module&apos;s
          route is offered to {reaching.join(', ')}. The Worker is withheld because row 3 (L29615)
          marks it Unavailable. The module is not yet registered in the Hub module registry, so the
          rail offers this route to nobody; that is recorded debt and not a permission answer.
        </p>
      </section>

      {/* ---------------- the Tenant Admin contradiction, mounted at page level ----------------
       *
       * THE DEFECT THIS CLOSES. `MOD_DOH_16_TENANT_ADMIN_CONTRADICTION` shipped
       * with a bite site and no page mount: `jobOwnerGate` returns the
       * `disclosed` kind only when the viewer is the Tenant Admin, and this
       * screen opens as the Supervisor, so the record's own `statement` and its
       * two readings appeared in the client chunk and in NO `index.html`. That
       * is the false-comfort shape — the ledger reads disclosed and the static
       * artefact carries nothing.
       *
       * THE FIX IS THE PATTERN THIS TREE ALREADY PROVED, not a change of
       * opening persona. `DEC-STUCK-001` had the same shape on
       * `RunSchedulingScreen` and was given a page-level mount that renders
       * unconditionally, with the per-run bite site left exactly as it was.
       * Nothing below relaxes `jobOwnerGate`: the matrix table above still
       * decides, per persona and per Job, what the CELL says.
       *
       * IT RENDERS UNCONDITIONALLY, and that is the point. The source answers
       * the Tenant Admin column twice whoever is looking at the screen; gating
       * the disclosure on the viewer is what made it invisible in the first
       * place. The only thing derived from state is the sentence naming which
       * column it bites, and that is read off the record.
       *
       * IT SETTLES NOTHING. Both readings are rendered as the source's cells,
       * in the record's own order, with no `adopted`, `winner` or `effective`
       * field to read — `JobOwnerContradiction` has nowhere to put one.
       * ------------------------------------------------------------------- */}
      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">
          The source answers the {roleById(MOD_DOH_16_TENANT_ADMIN_CONTRADICTION.column).name} column
          twice
        </h2>
        <p
          data-testid="tenant-admin-contradiction-statement"
          className="max-w-prose text-sm text-[var(--color-ink-muted)]"
        >
          {MOD_DOH_16_TENANT_ADMIN_CONTRADICTION.statement}
        </p>
        <ul className="space-y-1">
          {MOD_DOH_16_TENANT_ADMIN_CONTRADICTION.readings.map((reading) => (
            <li
              key={reading.rowId}
              data-testid="tenant-admin-contradiction-reading"
              className="max-w-prose text-xs text-[var(--color-ink-muted)]"
            >
              <span className="font-medium text-[var(--color-ink)]">{reading.sourceLine}</span>{' '}
              {reading.cell}
            </li>
          ))}
        </ul>
        <p
          data-testid="tenant-admin-contradiction-bites"
          className="max-w-prose text-xs text-[var(--color-ink-subtle)]"
        >
          Where it bites: the table above draws both readings in place of one cell whenever the
          selected persona is the {roleById(MOD_DOH_16_TENANT_ADMIN_CONTRADICTION.column).name}. It
          is disclosed here whoever is selected, because the source contradicts itself whether or
          not anyone is looking at that column.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">
          Catalogue A gives this view a &ldquo;Primary role&rdquo; that is not a role
        </h2>
        <p data-testid="job-owner-not-a-role" className="max-w-prose text-sm text-[var(--color-ink-muted)]">
          Catalogue A&apos;s row for this view names {CATALOGUE_A_PRIMARY_ROLE.cell} as its primary
          role. {CATALOGUE_A_PRIMARY_ROLE.readAsAudiences} Read as a role list instead, it mints a
          sixth tenant role, and that reading is closed three times over — {' '}
          {CATALOGUE_A_PRIMARY_ROLE.closedBy}. The row is named by locator here because its own
          identifier is one of the three-digit literals the two catalogues collide on:{' '}
          {CATALOGUE_A_PRIMARY_ROLE.sourceRef}.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">
          What this screen deliberately does not draw
        </h2>
        <ul className="space-y-2">
          {ABSENT_BY_RULE.map((entry) => (
            <li key={entry.label} data-testid="absent-by-rule" className="max-w-prose">
              <p className="text-sm font-medium text-[var(--color-ink)]">{entry.label}</p>
              <p className="text-xs text-[var(--color-ink-muted)]">{entry.note}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">
          What the source does not settle
        </h2>
        <ul className="space-y-2">
          {UNRESOLVED_IN_SOURCE.map((entry) => (
            <li
              key={entry.slice(0, 40)}
              data-testid="unresolved"
              className="max-w-prose text-xs text-[var(--color-ink-muted)]"
            >
              {entry}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">
          {DEC_AREA_001_POSITION.id} — {DEC_AREA_001_POSITION.classification}
        </h2>
        <p data-testid="dec-area-001" className="max-w-prose text-sm text-[var(--color-ink-muted)]">
          {DEC_AREA_001_POSITION.position} {DEC_AREA_001_POSITION.consequence} Ratification:{' '}
          {DEC_AREA_001_POSITION.ratification} It is never classified as{' '}
          {DEC_AREA_001_POSITION.neverClassifiedAs}.
        </p>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">If this fails</h2>
        <p data-testid="fallback" className="max-w-prose text-sm text-[var(--color-ink-muted)]">
          {fallbackPattern('FB-DOH-NOTIF-004').firstFallback} The second fallback is the
          flag&apos;s persistent presence on the Job record itself, which is reachable without any
          notification at all — the design decision that makes the flag safe (L29685). The pairing
          act itself is governed by {fallbackPattern('FB-DOH-WRITE-002').id}.
        </p>
      </section>
    </HubShell>
  )
}
