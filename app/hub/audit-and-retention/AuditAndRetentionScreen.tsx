'use client'

import { useState } from 'react'
import { HubShell, type TenantRoleId } from '../HubShell'
import { roleById } from '@/domain/roles'
import { dohModuleById } from '@/surfaces/doh/modules'
import { Button, StatusPill, Table, type TableRow } from '@/ui/primitives'
import { DecisionDisclosure } from '@/disclosure/DecisionDisclosure'
import {
  AUDIT_DEGRADED_BANNER,
  AUDIT_FAILURE_GRADING,
  AUDIT_HALT_CLASSES,
  AUDIT_TAXONOMY,
  CONTROL_MATRIX,
  DOH_11_READ_DURING_OUTAGE_CONFLICT,
  DOH_11_TAXONOMY_COUNT_CONFLICT,
  V1_IS_NOT_TAMPER_EVIDENT,
  doh11Row,
} from '@/surfaces/doh/modules/doh-11/matrix'
import {
  auditReadLicence,
  doh11Affordance,
  doh11RolesReaching,
  readableAuditEvents,
  type Doh11Affordance,
} from '@/surfaces/doh/modules/doh-11/rendering'
import { auditContext, SEEDED_AUDIT_EVENTS } from '@/surfaces/doh/modules/doh-11/fixtures'

/**
 * `SCR-DOH-20` — the audit log explorer, at `/hub/audit-and-retention`.
 * Catalogue B row L48114, storyboards `SB-DOH-023`, `SB-AUD-01` and
 * `SB-AUD-04`.
 *
 * ── THIS SCREEN DRAWS WHAT IT IS HANDED AND DECIDES NOTHING ───────────────
 * Every affordance comes from `doh11Affordance(row, role)`; every audit row
 * comes from `readableAuditEvents(...)`. There is no `role ===` and no status
 * comparison in this file. The one thing it adds is the audit-store state,
 * which is a simulated dependency rather than a permission.
 *
 * ── SCOPE IS ENFORCED IN WHAT THIS SCREEN READS ───────────────────────────
 * The table below cannot draw an event the selector did not return, because
 * the selector's output is the only list it has. It never receives the full
 * seeded register.
 *
 * ── THE SHELL IS GIVEN `module`, AND IT WAS GIVEN `screen` FOR ONE WAVE ───
 * `MOD-DOH-11` is a row of `DOH_MODULES` and `SCR-DOH-20` is a row of
 * `@/surfaces/doh/screens`, so the shell draws the module header, the
 * breadcrumb and the rail entry. This doc used to say the opposite — that the
 * module was still on the out-of-slice register and the rail offered nothing —
 * because that registration was another task's file; slice 10 task 12 made it,
 * and `HubShellUncataloguedScreen` is documented for a route that owns NO
 * module, so it could not stay here once the module owned one.
 */


/**
 * THE GRADED AUDIT-FAILURE STATE, and it is three answers rather than one
 * banner. `AuditStoreState` is what the reader toggles; what each act does
 * with it is read off the transcribed action-class register, never decided
 * here.
 */
type AuditStoreState = 'writable' | 'unavailable'

/**
 * The export halt, in the register's own terms. An export request, its
 * filters and its outcome are audited by this module's own Audit paragraph,
 * and an export is a governance act whose entire value is the record — the
 * register's third row. So the control disables with the audit-unavailable
 * message and unchanged state, and nothing anywhere reports a produced file.
 */
const EXPORT_HALT_REASON =
  'Paused: the record system is unavailable. An export request, its filters and its outcome are ' +
  'themselves audited, and an action that cannot be audited does not happen — so no file is ' +
  'produced, nothing is queued for later, and nothing here reports a completed export. ' +
  'The register grades this act with approvals, publications and releases: governance acts whose ' +
  'entire value is the record.'

function Affordance({ id, affordance }: { id: string; affordance: Doh11Affordance }) {
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
    /* THE ROUTING BRANCH. Visible, inoperable, and the reason is the cell's
       own named permission — not a generic refusal and not nothing at all. */
    case 'disabled':
      return (
        <div data-testid={`affordance-${id}`} data-kind="disabled">
          <Button
            variant="secondary"
            disabledReason={`Not available to this role: ${affordance.namedReason}. What is available instead is “${affordance.insteadLabel}” (${affordance.insteadRef}), on this same screen and on the row immediately below — which is why this control is shown and disabled rather than removed. Whether this scope is extended is open under ${affordance.decisionRef}.`}
          >
            {affordance.label}
          </Button>
        </div>
      )
    case 'absent':
      return (
        <div data-testid={`affordance-${id}`} data-kind="absent">
          <p className="text-xs text-[var(--color-ink-muted)]">{affordance.reason}</p>
        </div>
      )
  }
}

/** The browser. Its rows are the selector's output and nothing else. */
function AuditBrowser({ role }: { role: TenantRoleId }) {
  const licence = auditReadLicence(role)
  const visible = readableAuditEvents(SEEDED_AUDIT_EVENTS, role, auditContext(role))

  /* STATE-05, and its contract is two halves rather than one: the plain
     statement that this identity does not carry the read, AND the name of the
     roles that do — derived from the matrix, never a list typed here. Without
     the second half the refusal is hidden behind a missing table. */
  if (licence.kind === 'none') {
    return (
      <div role="note" data-testid="audit-read-absent" className="text-sm">
        <p className="text-[var(--color-ink-muted)]">{licence.statement}</p>
        <p className="mt-1 text-[var(--color-ink-muted)]">
          The roles that do carry an audit read on this module are{' '}
          {doh11RolesReaching()
            .map((r) => roleById(r).name)
            .join(', ')}
          .
        </p>
        <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">{licence.rowRef}</p>
      </div>
    )
  }

  const rows: TableRow[] = visible.map((event) => ({
    event: <code className="text-xs">{event.eventId}</code>,
    sentence: event.sentence,
    eventClass: event.eventClass,
  }))

  return (
    <>
      <p data-testid="scope-line" data-licence={licence.kind} className="text-sm font-medium">
        {licence.statement}
      </p>
      <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
        Your own row of this module’s matrix is what said so ({licence.rowRef}). The query is bounded
        to this workspace and to {licence.classes.length} of {AUDIT_TAXONOMY.length} event classes
        before it runs, so a class you may not read is never retrieved and then hidden.
      </p>
      <div className="mt-3">
        <Table
          caption="Audit events readable by this role"
          columns={[
            { key: 'event', header: 'Entry' },
            { key: 'sentence', header: 'What happened' },
            { key: 'eventClass', header: 'Class' },
          ]}
          rows={rows}
          emptyState={{
            title: 'No audit event is readable here',
            whatCreatesIt:
              'Every consequential action in every module writes one entry, in the same transaction as the action itself.',
          }}
        />
      </div>
      <p data-testid="object-authorisation" className="mt-2 text-xs text-[var(--color-ink-subtle)]">
        Each reference resolves through its own authorisation before it is read, so reading the log
        never becomes a way to read something this role is not entitled to see. References belonging
        to another tenant are not fetched, not counted and not listed — {visible.length} of{' '}
        {SEEDED_AUDIT_EVENTS.length} seeded entries reached this query.
      </p>
    </>
  )
}

/** The export control: the row's own affordance, then the audit-store gate. */
function ExportControl({ role, store }: { role: TenantRoleId; store: AuditStoreState }) {
  const affordance = doh11Affordance(doh11Row('export-audit'), role)
  if (affordance.kind !== 'control') {
    return <Affordance id="export-gate" affordance={affordance} />
  }
  return (
    <div data-testid="export-gate" data-kind={store === 'writable' ? 'control' : 'halted'}>
      {store === 'writable' ? (
        <Button variant="secondary">{affordance.label}</Button>
      ) : (
        <Button variant="secondary" disabledReason={EXPORT_HALT_REASON}>
          {affordance.label}
        </Button>
      )}
      <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{affordance.conditions}</p>
    </div>
  )
}

export function AuditAndRetentionScreen() {
  const [role, setRole] = useState<TenantRoleId>('TENANT_ADMIN')
  const [store, setStore] = useState<AuditStoreState>('writable')

  const reach = doh11RolesReaching()

  return (
    <HubShell
      module={dohModuleById('MOD-DOH-11')}
      role={role}
      onRoleChange={setRole}
    >
      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold">The audit browser</h2>
        <div className="flex items-center gap-3 text-sm">
          <label htmlFor="audit-store-select" className="text-[var(--color-ink-muted)]">
            Audit store
          </label>
          <select
            id="audit-store-select"
            data-testid="audit-store-select"
            value={store}
            onChange={(e) => setStore(e.target.value as AuditStoreState)}
            className="rounded border border-[var(--color-border-strong)] px-2 py-1"
          >
            <option value="writable">writable</option>
            <option value="unavailable">unavailable</option>
          </select>
        </div>
        <AuditBrowser role={role} />
      </section>

      {/* THREE STATEMENTS, NOT ONE BANNER. The register's own words decide
          which acts halt; the read continues on its own row of the same
          register; and the invariant is stated separately from both. */}
      {store === 'unavailable' ? (
        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold">The record system is unavailable</h2>
          <p data-testid="degraded-banner" className="text-sm font-medium">
            {AUDIT_DEGRADED_BANNER.text}
          </p>
          <p data-testid="graded-read" className="text-sm text-[var(--color-ink-muted)]">
            <StatusPill tone="ok" icon="●" label="Reading continues" /> {' '}
            {DOH_11_READ_DURING_OUTAGE_CONFLICT.continues}
          </p>
          <p data-testid="graded-export" className="text-sm text-[var(--color-ink-muted)]">
            <StatusPill tone="blocked" icon="■" label="Export halts" /> {' '}
            Export is refused with the audit-unavailable message and unchanged state. It is not
            deferred and it is not queued: no action is held for later application during an audit
            outage, so on restoration there is no backlog to apply.
          </p>
          <p data-testid="no-unaudited-success" className="text-sm text-[var(--color-ink-muted)]">
            Nothing on this screen reports a completed action whose audit could not commit. The
            classes that stop are the ones the register grades as halting —{' '}
            {AUDIT_HALT_CLASSES.join(', ')} — and they stop rather than succeeding quietly.
          </p>
          <p data-testid="read-conflict" className="text-sm text-[var(--color-ink-muted)]">
            {DOH_11_READ_DURING_OUTAGE_CONFLICT.wouldHalt}{' '}
            {DOH_11_READ_DURING_OUTAGE_CONFLICT.position}
          </p>
        </section>
      ) : null}

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold">Export</h2>
        <ExportControl role={role} store={store} />
        <p className="text-xs text-[var(--color-ink-subtle)]">
          Comma-separated values and JavaScript Object Notation, with date and entity filters. Bulk
          export to tenant-owned storage is not available in this release.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-lg font-semibold">What this role may do</h2>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Ten rows, transcribed from the permission matrix at L28865–L28874 — counted by reading to
          where the body stops, not taken from the span. One cell on this card is a prohibition that
          names a permission in the same words, and it is drawn disabled with that reason rather
          than removed.
        </p>
        <ul className="space-y-4">
          {CONTROL_MATRIX.map((row) => (
            <li
              key={row.id}
              data-testid={`row-${row.id}`}
              className="border-t border-[var(--color-border)] pt-3"
            >
              <p className="text-sm font-medium text-[var(--color-ink)]">{row.control}</p>
              <p className="text-xs text-[var(--color-ink-subtle)]">{row.sourceRef}</p>
              <div className="mt-2">
                <Affordance id={row.id} affordance={doh11Affordance(row, role)} />
              </div>
              <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">{row.rendering}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 space-y-2">
        <h2 className="text-lg font-semibold">Who reaches this screen</h2>
        <p data-testid="derived-reach" className="text-sm text-[var(--color-ink-muted)]">
          Derived from this module’s own matrix: {reach.join(', ')}.
        </p>
        <p data-testid="catalogue-b-agrees" className="text-sm text-[var(--color-ink-muted)]">
          Catalogue B’s row for this screen names the Read-only Auditor, the Tenant Admin and the
          Quality Manager (L48114) and the Supervisor is absent from both. The absence is a fourth
          locator of DEC-AUDITSUP-001 rather than a restatement of the matrix, and this build settles
          nothing with it.
        </p>
      </section>

      <section className="mt-10 space-y-2">
        <h2 className="text-lg font-semibold">What V1 is not</h2>
        <p data-testid="v1-limits" className="text-sm text-[var(--color-ink-muted)]">
          {V1_IS_NOT_TAMPER_EVIDENT.statement}
        </p>
        <p className="text-xs text-[var(--color-ink-subtle)]">
          {V1_IS_NOT_TAMPER_EVIDENT.sourceRefs.join(' · ')}
        </p>
      </section>

      <section className="mt-10 space-y-2">
        <h2 className="text-lg font-semibold">The audited taxonomy</h2>
        <p data-testid="taxonomy-counts" className="text-sm text-[var(--color-ink-muted)]">
          The taxonomy enumerates {DOH_11_TAXONOMY_COUNT_CONFLICT.enumerated} classes and the source
          calls it a {DOH_11_TAXONOMY_COUNT_CONFLICT.stated}-class taxonomy. Both numbers are shown
          because they disagree. {DOH_11_TAXONOMY_COUNT_CONFLICT.where}
        </p>
        <p className="text-sm text-[var(--color-ink-muted)]">
          {DOH_11_TAXONOMY_COUNT_CONFLICT.notSettled}
        </p>
        <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
          {AUDIT_TAXONOMY.map((c) => (
            <li key={c.id} data-testid={`taxonomy-${c.id}`}>
              {c.stated}
              {c.inQualityManagerScope ? ' — inside the Quality Manager’s scope' : ''}
            </li>
          ))}
        </ul>
        <p className="text-xs text-[var(--color-ink-subtle)]">
          {DOH_11_TAXONOMY_COUNT_CONFLICT.sourceRefs.join(' · ')}
        </p>
      </section>

      <section className="mt-10 space-y-2">
        <h2 className="text-lg font-semibold">Audit failure is graded</h2>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Nine action classes, transcribed at L74867–L74875. Two of them continue and they continue
          because they have their own audit path, not because the rule was relaxed.
        </p>
        <Table
          caption="What happens to each action class while the audit store is unavailable"
          columns={[
            { key: 'actionClass', header: 'Action class' },
            { key: 'behaviour', header: 'Behaviour' },
            { key: 'rationale', header: 'Rationale' },
            { key: 'sourceRef', header: 'Line' },
          ]}
          rows={AUDIT_FAILURE_GRADING.map((g) => ({
            actionClass: g.actionClass,
            behaviour: g.behaviour,
            rationale: g.rationale,
            sourceRef: g.sourceRef,
          }))}
          emptyState={{
            title: 'No action class is graded',
            whatCreatesIt:
              'The register is transcribed from the frozen source and fails at module load if it is empty.',
          }}
        />
      </section>

      <section className="mt-10 space-y-2">
        <h2 className="text-lg font-semibold">Retention</h2>
        <p data-testid="retention" className="text-sm text-[var(--color-ink-muted)]">
          Nothing is purged. The tenant-set retention value is the hot-retrievability horizon,
          default fifteen years, configured per tenant in the Super Admin platform console with
          maker-checker; past the horizon data tiers to lower-cost storage and remains retrievable.
          A legal hold suspends tiering and compliance-driven deletion for a named scope. Worker
          personal data anonymises at twenty-four months for standard commercial tenants and never in
          Regulated-Industry mode, and that is the platform’s one irreversible act. Retention is
          uniform across tiers and never tier-gated. (L28840)
        </p>
        <p data-testid="retention-open-items" className="text-sm text-[var(--color-ink-muted)]">
          Three items on that paragraph are marked Client Decision Required in the source and this
          build’s decision canon holds none of them: DEC-RETRIEVE-001 for the archived-data retrieval
          expectation, DEC-DELETE-001 for the list of applicable compliance standards, and
          DEC-ANON-001. They are named here without alternatives because inventing readings for them
          on this screen would create a second home for a record that belongs in one place. The gap
          is reported.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-lg font-semibold">Open decisions on this screen</h2>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Each is rendered from the one decision canon, with every reading and its locator. This
          screen states none of them in its own words.
        </p>
        <DecisionDisclosure id="DEC-AUDITQM-001" />
        <DecisionDisclosure id="DEC-AUDITSUP-001" />
        <DecisionDisclosure id="DEC-AUDITHASH-001" />
        <DecisionDisclosure id="DEC-AUDITOFF-001" />
      </section>
    </HubShell>
  )
}
