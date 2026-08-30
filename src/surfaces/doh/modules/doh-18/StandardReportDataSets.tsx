import type { TenantRoleId } from '../../../../../app/hub/HubShell'
import { roleById } from '@/domain/roles'
import { StatusPill, Table } from '@/ui/primitives'
import { CrossSurfaceStatement } from '@/ui/doh/CrossSurfaceStatement'
import {
  DOH_18_BLOCKED,
  DOH_18_BUILDABLE,
  DOH_18_BUILD_POSITION,
  DOH_18_DATA_SETS,
  DOH_18_DECISION_HOME,
  DOH_18_SET_COUNT,
  type Doh18DataSet,
} from './datasets'
import { MOD_DOH_18_CARD, MOD_DOH_18_HAS_NO_SCREEN } from './matrix'
import { MOD_DOH_18_MATRIX } from './matrix'
import { doh18Affordance, doh18CrossSurfaceRows, type Doh18Affordance } from './rendering'

/**
 * `MOD-DOH-18` — the five standard report data sets, §19.20.
 *
 * IT IS A COMPONENT AND NOT A SCREEN, and that is catalogue B's decision
 * rather than this task's convenience: none of its 23 rows names this module,
 * and the only cell that covers it covers `MOD-DOH-01 to MOD-DOH-19` as a
 * range. `MOD_DOH_18_HAS_NO_SCREEN` is printed rather than kept in a comment,
 * because a stated abstention and an oversight look identical from outside.
 *
 * IT HOLDS NO POLICY. Every affordance comes from `doh18Affordance`, which
 * asks the classification before the token; every set's build position comes
 * from `./datasets`, which derives it from the divergence the source records
 * and checks that against the ruling's own ordinals. This file draws what it
 * is handed.
 *
 * NO INTERACTIVE CONTROL IS DRAWN ANYWHERE BELOW, and that is a different
 * claim from "the fold never answers `control`" — it does, on exactly one row
 * for exactly three roles, because querying a standard data set is the one act
 * this surface both owns and grants. This module has no screen to offer it on,
 * and the source says where it is exercised: the requester opens the Builder,
 * and the Builder calls the Hub. So the matrix STATES each affordance and
 * offers none: no `<button>`, no field, no toggle, and no disabled control,
 * which would imply a condition that could become true. A decision-blocked set
 * carries no affordance at all — it carries its two candidate names.
 */

const ROLE_COLUMNS: readonly TenantRoleId[] = [
  'TENANT_ADMIN',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'READONLY_AUDITOR',
  'WORKER',
]

/** What a cell says, by the rule the fold returned and never by taste. */
function affordanceText(affordance: Doh18Affordance): string {
  switch (affordance.kind) {
    case 'control':
      return affordance.conditions
    case 'read-only':
      return affordance.reason
    case 'absent':
      return affordance.reason
    case 'cross-surface':
      // The row's own cell, not the boundary panel's note. The statement is
      // rendered once per boundary below; repeating it in five cells would
      // both lose the source's own wording and print it eight times.
      return affordance.reason
  }
}

/**
 * One set. A blocked set renders the same shape as a built one — same heading
 * level, same prominence, nothing collapsed and nothing greyed — because it is
 * present and identified twice, and only its identity is held.
 */
function DataSet({ set }: { set: Doh18DataSet }) {
  const blocked = set.blockedBy !== null
  return (
    <li
      data-testid={`doh-18-set-${set.ordinal}`}
      data-build={set.build}
      className="rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">Set {set.ordinal}</span>
        {blocked ? (
          <StatusPill
            tone="blocked"
            icon="⦸"
            label={`Decision-blocked — ${set.blockedBy?.decisionRef}`}
          />
        ) : (
          <StatusPill tone="info" icon="▸" label="Built by this module" />
        )}
      </div>

      {set.agreedName !== null ? (
        <p data-testid={`doh-18-set-${set.ordinal}-name`} className="mt-1 text-[var(--color-ink)]">
          {set.agreedName}
        </p>
      ) : (
        <div data-testid={`doh-18-set-${set.ordinal}-wordings`} className="mt-2 space-y-1">
          <p className="text-sm text-[var(--color-ink-muted)]">
            Two wordings, both carried, neither chosen:
          </p>
          <p data-testid={`doh-18-set-${set.ordinal}-wording-hub`} className="text-[var(--color-ink)]">
            &ldquo;{set.hubWording.text}&rdquo;{' '}
            <span className="text-xs text-[var(--color-ink-subtle)]">
              — the Delivery Operations Hub Part, {set.hubWording.locator}
            </span>
          </p>
          <p data-testid={`doh-18-set-${set.ordinal}-wording-cc`} className="text-[var(--color-ink)]">
            &ldquo;{set.commandCenterWording.text}&rdquo;{' '}
            <span className="text-xs text-[var(--color-ink-subtle)]">
              — the Client Command Center Part, {set.commandCenterWording.locator}
            </span>
          </p>
        </div>
      )}

      <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
        Computed from {set.hubSource}.
      </p>

      {set.blockedBy !== null ? (
        <p
          data-testid={`doh-18-set-${set.ordinal}-block`}
          className="mt-2 text-sm text-[var(--color-ink-muted)]"
        >
          Held, not absent and not implemented. {set.blockedBy.rulingLocator}{' '}
          {set.blockedBy.registerRowLocator} {set.blockedBy.whyHeldRatherThanRenamedLater}
        </p>
      ) : null}
    </li>
  )
}

export interface StandardReportDataSetsProps {
  /** The viewer. Decides what each matrix cell says and whether a link is drawn. */
  readonly role: TenantRoleId
}

export function StandardReportDataSets({ role }: StandardReportDataSetsProps) {
  const columns = [
    { key: 'control', header: 'Action' },
    ...ROLE_COLUMNS.map((r) => ({ key: r, header: roleById(r).name })),
  ]
  const rows = MOD_DOH_18_MATRIX.map((row) => {
    const cells: Record<string, string> = { control: row.control }
    for (const column of ROLE_COLUMNS) {
      cells[column] = affordanceText(doh18Affordance(row, column))
    }
    return cells
  })

  return (
    <section
      data-testid="doh-18"
      data-module={MOD_DOH_18_CARD.id}
      aria-labelledby="doh-18-heading"
      className="space-y-4"
    >
      <div>
        <h2 id="doh-18-heading" className="text-lg font-medium text-[var(--color-ink)]">
          {MOD_DOH_18_CARD.name}
        </h2>
        <p className="text-sm text-[var(--color-ink-muted)]">
          {MOD_DOH_18_CARD.id} · {MOD_DOH_18_CARD.owningSurface}{' '}
          {MOD_DOH_18_CARD.objectsAffected}
        </p>
      </div>

      <p
        data-testid="doh-18-no-screen"
        className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4 text-sm text-[var(--color-ink-muted)]"
      >
        {MOD_DOH_18_HAS_NO_SCREEN.statement} {MOD_DOH_18_HAS_NO_SCREEN.rendersElsewhere}
      </p>

      <p data-testid="doh-18-build-position" className="text-sm text-[var(--color-ink)]">
        {DOH_18_BUILD_POSITION}
      </p>

      <p data-testid="doh-18-decision-home" className="text-xs text-[var(--color-ink-subtle)]">
        {DOH_18_DECISION_HOME.decisionRef} is recorded once, at{' '}
        {DOH_18_DECISION_HOME.disclosedAt}, with all three of the source&rsquo;s cards
        ({DOH_18_DECISION_HOME.cardSpan}) and their three option lists. It is not restated here.{' '}
        {DOH_18_DECISION_HOME.whatThisModuleAdds}
      </p>

      <ul data-testid="doh-18-sets" className="space-y-3">
        {DOH_18_DATA_SETS.map((set) => (
          <DataSet key={set.ordinal} set={set} />
        ))}
      </ul>

      <p data-testid="doh-18-set-tally" className="text-sm text-[var(--color-ink-muted)]">
        {DOH_18_SET_COUNT} sets · {DOH_18_BUILDABLE.length} built ·{' '}
        {DOH_18_BLOCKED.length} decision-blocked and counted as implemented nowhere. A set&rsquo;s
        lifecycle is {MOD_DOH_18_CARD.states.join(', ')}, and no set is ever presented as
        real-time.
      </p>

      <Table
        caption="Roles and permissions on MOD-DOH-18"
        columns={columns}
        rows={rows}
        emptyState={{
          title: 'No rows',
          whatCreatesIt:
            'The matrix is transcribed from the frozen source and is never empty; an empty table here is a load failure.',
        }}
      />

      <div data-testid="doh-18-cross-surface" className="space-y-3">
        {doh18CrossSurfaceRows().map((row) => {
          const affordance = doh18Affordance(row, role)
          if (affordance.kind !== 'cross-surface') return null
          return <CrossSurfaceStatement key={row.id} statement={affordance.statement} />
        })}
      </div>
    </section>
  )
}
