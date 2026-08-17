'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SaConsoleShell } from '../SaConsoleShell'
import { saModuleById } from '@/surfaces/sa/modules'
import { SA_INVARIANTS } from '@/surfaces/sa/invariants'
import { InvariantChip } from '@/ui/sa/InvariantChip'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import {
  Button,
  PermissionNotice,
  Select,
  StatusPill,
  type StatusTone,
} from '@/ui/primitives'
import { ScreenStateBoundary } from '@/ui/ScreenStateBoundary'
import { SCREEN_STATES, screenState, type ScreenStateId } from '@/ui/screen-state'
import { evaluateAccess } from '@/policy/evaluate'
import type { PermissionDecision } from '@/policy/decision'
import type { RoleId } from '@/domain/roles'
import { emptyDomainState } from '@/domain/state'
import { scenarioRunId } from '@/domain/ids'
import {
  AGGREGATES,
  CONNECTIVITY_LADDER,
  INCIDENTS,
  INCIDENT_STATES,
  MODULE_STATE_NOTES,
  PLATFORM_ROLES,
  READ_ONLY_CAUSE,
  READ_ONLY_CONTROL_POINTER,
  UNSPECIFIED_IN_SOURCE,
  type AggregateElement,
  type AggregateState,
  type PlatformIncident,
} from './fixtures'

const MODULE = saModuleById('MOD-SA-01')

/** The roles the source names as holding incident ownership: the close
 *  control's own allowed-roles list (L90758, L91286), never the module-level
 *  `roles_allowed` array, which D16 makes authoritative nowhere. */
const INCIDENT_CLOSE_ROLES: readonly RoleId[] = [
  'ROOT_SUPER_ADMIN',
  'ADMIN',
  'PLATFORM_ENGINEER',
]

/** Read is the module's floor: all four console roles read every element
 *  here (D16, L42742). The filter control the source defines names only the
 *  Platform Engineer (L47767); a filter narrows a read and grants nothing,
 *  so it follows the read floor, and the screen says so out loud. */
const READ_ROLES: readonly RoleId[] = PLATFORM_ROLES.map((r) => r.roleId)

const AGGREGATE_TONE: Record<AggregateState, StatusTone> = {
  current: 'ok',
  stale: 'stale',
  unavailable: 'blocked',
  reconciled: 'info',
}

const SCREEN_STATE_OPTIONS = SCREEN_STATES.filter((s) => !s.frontlineOnly).map((s) => ({
  value: s.id,
  label: `${s.id} — ${s.name}`,
}))

const FIXTURE_STATE = emptyDomainState(scenarioRunId('SA-MOD-01-STORYBOARD'))

/** How many incidents the fixture ships open. The difference between this and
 *  the live count is how many were closed ON THIS SCREEN, which is what the
 *  tile's as-of stamp names. Widened deliberately: `INCIDENTS` is `as const`,
 *  so comparing its literal states against 'closed' is a type error rather
 *  than the count this means to take. */
const SEEDED_OPEN_INCIDENTS = (INCIDENTS as readonly PlatformIncident[]).filter(
  (i) => i.state !== 'closed',
).length

function contextFor(roleId: RoleId) {
  return {
    state: FIXTURE_STATE,
    identity: {
      signedIn: true,
      role: roleId,
      // A console role holds no ambient tenant: it acts through a named
      // access class or not at all (AC-AUTH-006).
      tenant: null,
      siteScope: [],
      areaScope: [],
      qualifications: [],
      deviceId: null,
      stepUpActive: false,
      accessSessionId: null,
    },
    online: true,
    deviceTrusted: true,
    actorOfRecord: 'storyboard-viewer',
  } as const
}

function decisionFor(
  roleId: RoleId,
  incident: PlatformIncident,
): PermissionDecision {
  return evaluateAccess(
    {
      action: 'close-platform-incident',
      allowedRoles: INCIDENT_CLOSE_ROLES,
      allowedObjectStates: INCIDENT_STATES.filter((s) => s !== 'closed'),
      objectState: incident.state,
      sourceRefs: ['L90758', 'L91286', 'AC-4880 L107967'],
    },
    contextFor(roleId),
  )
}

/** The one control the source defines (L47767), decided the same way every
 *  other affordance is — through the evaluator, never a hand-rolled role
 *  check. */
function filterDecision(roleId: RoleId): PermissionDecision {
  return evaluateAccess(
    {
      action: 'filter-platform-overview',
      allowedRoles: READ_ROLES,
      sourceRefs: ['L47767', 'L42742', 'D16'],
    },
    contextFor(roleId),
  )
}

/** L90767 / AC-4883: what still blocks the close, in the order the source
 *  puts it — the screen state first, because STATE-06 disables every input
 *  this module owns and STATE-12 lets nothing be submitted, then
 *  reconciliation, then positive evidence for every checklist item. `null`
 *  means nothing blocks it.
 *
 *  STATE-06 returns the POINTER, never the cause: three incident cards each
 *  restating the cause would be the scatter STATE-06 exists to forbid. The
 *  control is still drawn inert with a named reason (§3, DISABLED WITH A
 *  NAMED REASON) — the reason names the state and says where its one cause
 *  is written. */
function closeBlocker(incident: PlatformIncident, stateId: ScreenStateId): string | null {
  if (stateId === 'STATE-06') {
    return READ_ONLY_CONTROL_POINTER
  }
  if (stateId === 'STATE-12') {
    return 'Nothing can be submitted while the platform audit write is failing. The close and its audit record commit in one transaction, so a close that could not be audited does not happen at all (FB-SA-03).'
  }
  if (stateId === 'STATE-13') {
    return 'Re-aggregation after the telemetry gap is still running. An incident cannot close while any dependent view is behind (STATE-13).'
  }
  if (incident.reconciliationOutstanding !== null) {
    return `Disabled while a reconciliation item is outstanding: ${incident.reconciliationOutstanding} (L90758, L90767).`
  }
  const missing = incident.checklist.filter((c) => c.evidence === null)
  if (missing.length > 0) {
    return `Unavailable until the verification checklist is complete with positive evidence for every item. Outstanding: ${missing
      .map((m) => m.label)
      .join(', ')} (AC-4880, AC-4883).`
  }
  return null
}

/** The incident-count tile reads the SAME records the incident list below
 *  reads. Closing one on this screen must not leave a count above it saying
 *  otherwise — an aggregate over records the screen says are closed is a
 *  contradiction. Never a zero: the empty case is a sentence (AC-SA-01-03). */
function openIncidentsMeasure(count: number): string {
  if (count === 0) {
    return 'No platform incident is open. Every incident on this screen is closed.'
  }
  return count === 1
    ? '1 platform incident not yet closed'
    : `${count} platform incidents not yet closed`
}

/** An aggregate's honesty is its as-of stamp (AC-SA-000-06, fixtures.ts): it
 *  says WHEN the value was true. This one tile is recomputed from the incident
 *  records on this screen, so a close made here moves the value AND the stamp
 *  — the aggregation layer's 09:12 snapshot is no longer when the count was
 *  true. No clock is read: the recomputation is named by what caused it, so
 *  the same run always renders the same words. */
function openIncidentsAsOf(fixtureAsOf: string, closedHere: number): string {
  if (closedHere === 0) return fixtureAsOf
  return closedHere === 1
    ? 'the incident closed on this screen, recomputed from the records below'
    : `the ${closedHere} incidents closed on this screen, recomputed from the records below`
}

function AggregateTile({ element }: { readonly element: AggregateElement }) {
  return (
    <li className="rounded-[var(--radius-control)] border border-[var(--color-border)] p-3">
      <p className="font-medium text-[var(--color-ink)]">{element.name}</p>
      <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
        {element.value ?? 'Measure unavailable'}
      </p>
      <div className="mt-2">
        <StatusPill
          tone={AGGREGATE_TONE[element.state]}
          icon="●"
          label={`Aggregate state: ${element.state}`}
        />
      </div>
      <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
        as of {element.asOf}
        {element.age !== undefined ? ` — stale, ${element.age}` : ''}
        {element.gapWindow !== undefined ? ` — reconciled, ${element.gapWindow}` : ''}
      </p>
      <p className="text-xs text-[var(--color-ink-subtle)]">{element.sourceRef}</p>
    </li>
  )
}

export function OverviewScreen() {
  const [sourceRoleId, setSourceRoleId] = useState<string>('ROLE-PLAT-ROOT')
  const [stateId, setStateId] = useState<ScreenStateId>('STATE-03')
  const [tenantFilter, setTenantFilter] = useState('')
  const [capabilityFilter, setCapabilityFilter] = useState('')
  const [incidentFilter, setIncidentFilter] = useState('')
  const [incidents, setIncidents] = useState<readonly PlatformIncident[]>(INCIDENTS)

  const role = PLATFORM_ROLES.find((r) => r.sourceId === sourceRoleId) ?? PLATFORM_ROLES[0]
  const isRoot = role.roleId === 'ROOT_SUPER_ADMIN'
  const definition = screenState(stateId)
  // STATE-06 disables every input this module owns. The two selects at the top
  // of the page are the storyboard's own view switchers, not module inputs —
  // disabling the state switcher would leave no way out of the state — and the
  // banner says exactly that, so copy and render agree.
  const readOnly = stateId === 'STATE-06'

  const tenants = [...new Set(INCIDENTS.flatMap((i) => i.tenants))].sort()
  const capabilities = [...new Set(INCIDENTS.map((i) => i.capability))].sort()

  // The tile above the list and the list itself read the SAME records, and the
  // tile's as-of stamp moves with them.
  const openCount = incidents.filter((i) => i.state !== 'closed').length
  const closedHere = SEEDED_OPEN_INCIDENTS - openCount

  const visible = incidents.filter(
    (i) =>
      (tenantFilter === '' || i.tenants.includes(tenantFilter)) &&
      (capabilityFilter === '' || i.capability === capabilityFilter) &&
      (incidentFilter === '' || i.state === incidentFilter),
  )

  function close(id: string): void {
    setIncidents((current) =>
      current.map((i) => (i.id === id ? { ...i, state: 'closed' } : i)),
    )
  }

  return (
    <SaConsoleShell module={MODULE}>
      <p className="text-xs text-[var(--color-ink-subtle)]">
        Screen annotations only, never route keys (D1): SCR-SA-01 Overview and health landing
        (L42793), SB-SA-01 (L42971), SB-RISK-01 (L115553), SCR-SA-OVERVIEW-01 (L100758). The
        route is named, and the two competing numbering schemes disagree about the number.
      </p>

      <section aria-label="View controls" className="mt-6 flex flex-wrap gap-4">
        <Select
          label="View as platform role"
          value={sourceRoleId}
          onChange={setSourceRoleId}
          options={PLATFORM_ROLES.map((r) => ({
            value: r.sourceId,
            label: `${r.name} (${r.sourceId})`,
          }))}
        />
        <Select
          label="Screen state"
          value={stateId}
          onChange={(v) => setStateId(v as ScreenStateId)}
          options={SCREEN_STATE_OPTIONS}
        />
      </section>
      <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
        The role selector is a view switcher, not a sign-in. Every affordance below is decided by
        that control&rsquo;s own allowed-roles through the policy evaluator; the module-level
        roles list is authoritative nowhere (D16), and all four console roles read every element
        on this screen.
      </p>

      <section aria-label="Screen state" className="mt-6">
        <h2 className="text-lg font-semibold">Screen state</h2>
        <p className="mt-1 text-sm font-medium">
          {definition.id} — {definition.name}
        </p>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {definition.contract}
        </p>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          On this module: {MODULE_STATE_NOTES[stateId]}
        </p>
        <div className="mt-3">{stateTreatment(stateId, role.roleId, role.name)}</div>
      </section>

      <section aria-label="Platform aggregates" className="mt-6">
        <h2 className="text-lg font-semibold">Platform aggregates</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Eight aggregate elements (AC-SA-01-01, L43068). Each carries an as-of stamp; a degraded
          one renders stale with its age, a wholly unavailable one renders unavailable, and
          neither ever renders as zero or blank (AC-SA-01-03, FB-SA-01). The incident count reads
          the same records as the incident list below, so closing one here moves the count and its
          as-of stamp together — a recomputed value never keeps the stamp of the one it replaced.
        </p>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {AGGREGATES.map((a) => (
            <AggregateTile
              key={a.id}
              element={
                a.id === 'AGG-OPEN-INCIDENTS'
                  ? {
                      ...a,
                      value: openIncidentsMeasure(openCount),
                      asOf: openIncidentsAsOf(a.asOf, closedHere),
                    }
                  : a
              }
            />
          ))}
        </ul>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          Provisional naming, stated so a reviewer can see it: the frozen source closes the COUNT
          at eight and never enumerates which eight. These are named from the platform-level
          signals the source does name for this module; the count is not invented, the labels are
          provisional.
        </p>
        <ProhibitionNotice
          rendering={{
            kind: 'absent',
            note: 'No drill-through from a measure to record-level tenant content exists here, for any role including the root (AC-SA-000-07, AC-SEC-801). No metric, alert or dashboard is accepted as audit evidence anywhere (AC-4803).',
          }}
        />
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Reaching tenant content needs a named access class. The session-request form lives in{' '}
          <Link href="/super-admin/support-access/" className="text-[var(--color-primary)] underline">
            Support Access
          </Link>
          , and there is no ambient browsing anywhere on this console.
        </p>
      </section>

      <section aria-label="Connectivity-loss protocol" className="mt-6">
        <h2 className="text-lg font-semibold">Connectivity-loss protocol</h2>
        <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
          {CONNECTIVITY_LADDER.map((rung) => (
            <li key={rung.signal}>
              {rung.at} — {rung.signal} — {rung.consequence}
            </li>
          ))}
        </ul>
        <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          Normal, Loss30, Loss60, Loss120, Recovered (L102009). The thresholds are fixed by
          AC-WF-PLT-008-03 and are not settable from this console; the threshold proposal cycle
          belongs to Platform Settings.
        </p>
      </section>

      <section aria-label="Agent health" className="mt-6">
        <h2 className="text-lg font-semibold">
          Agent health and artificial-intelligence availability
        </h2>
        <div className="mt-2">
          {stateId === 'STATE-11' || stateId === 'STATE-10' ? (
            <ScreenStateBoundary
              state={stateId}
              surface="SURF-SA"
              detail={{
                unavailableCause:
                  'Every platform artificial-intelligence model is unavailable. Agents are unavailable and are said to be unavailable (WF-PLT-009).',
                degradedMissing: 'Agent-run quality has crossed the alert threshold.',
                degradedRemaining:
                  'The deterministic layer, including on-device severity classification, is untouched.',
              }}
            />
          ) : (
            <p className="text-sm text-[var(--color-ink-muted)]">
              Agents reporting normally against the platform health view.
            </p>
          )}
        </div>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          WF-PLT-009, the artificial-intelligence outage, has its console home here (D6): agent-run
          failures crossing the alert threshold open one platform incident on this view, and the
          agent registry module renders agent state, not incident ownership. This module stays
          fully operable with every model unavailable (AC-SA-000-09) — the aggregates, the
          incident records and the close control all act unchanged.
        </p>
        <div className="mt-3">
          <p className="text-sm font-medium">Emergency pause — critical class</p>
          {isRoot ? (
            <Link
              href="/super-admin/platform-settings/"
              className="text-[var(--color-primary)] underline"
            >
              Emergency pause in Platform Settings
            </Link>
          ) : (
            <ProhibitionNotice rendering={{ kind: 'class-badge' }} />
          )}
          <p role="note" className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
            No control on this module performs the pause. It is proposed by an Admin and approved
            by the root in Platform Settings (D8), and it stays exercisable there with every model
            unavailable.
          </p>
        </div>
      </section>

      <section aria-label="Platform incidents" className="mt-6">
        <h2 className="text-lg font-semibold">Platform incidents</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          One agent degrading across two or more tenants is recorded as one platform incident, not
          one incident per tenant (AC-SA-01-05). States: open, acknowledged, investigating,
          mitigated, resolved, closed. Incident levels are not rendered — the source marks them
          proposed (D5).
        </p>

        {filterDecision(role.roleId).outcome !== 'allowed' ? (
          <PermissionNotice decision={filterDecision(role.roleId)} />
        ) : null}
        <div className="mt-3 flex flex-wrap gap-4">
          <Select
            label="Tenant filter"
            value={tenantFilter}
            onChange={setTenantFilter}
            disabled={readOnly}
            options={[
              { value: '', label: 'All tenants' },
              ...tenants.map((t) => ({ value: t, label: t })),
            ]}
          />
          <Select
            label="Capability filter"
            value={capabilityFilter}
            onChange={setCapabilityFilter}
            disabled={readOnly}
            options={[
              { value: '', label: 'All capabilities' },
              ...capabilities.map((c) => ({ value: c, label: c })),
            ]}
          />
          <Select
            label="Incident filter"
            value={incidentFilter}
            onChange={setIncidentFilter}
            disabled={readOnly}
            options={[
              { value: '', label: 'All incident states' },
              ...INCIDENT_STATES.map((s) => ({ value: s, label: s })),
            ]}
          />
        </div>
        <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          The one control the frozen source defines for this module (L47767). Its own entry names
          the Platform Engineer alone, while the module card names all four console roles
          (L42979); resolved per D16 — a filter narrows a read and grants nothing, so all four
          roles hold it. Tenants are named by their anonymised labels only.
        </p>

        <div className="mt-4 space-y-4">
          {visible.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-muted)]">
              No platform incident matches the current filters.
            </p>
          ) : (
            visible.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                roleId={role.roleId}
                roleName={role.name}
                stateId={stateId}
                onClose={close}
              />
            ))
          )}
        </div>
      </section>

      <section aria-label="Cross-tenant comparative" className="mt-6">
        <h2 className="text-lg font-semibold">Cross-tenant comparative</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Anonymisation precedes aggregation, and every cross-tenant comparative on this console is
          anonymised (AC-SA-01-06). Tenants appear as Tenant A, Tenant B, Tenant C — labels, never
          identities, and never a link to a record.
        </p>
        <ProhibitionNotice
          rendering={{
            kind: 'absent',
            note: 'No control to disable anonymisation exists on this console, for any account including the root (AC-SA-01-06, L97560). There is no off position, no approval path and no configuration key.',
          }}
        />
        <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          Nothing here is measured below the tenant, and no measure compares one person with
          another.
        </p>
      </section>

      <section aria-label="Security posture" className="mt-6">
        <h2 className="text-lg font-semibold">Security posture</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The six ENFORCED invariants, as this module&rsquo;s security-posture panel renders them
          (SB-SEC-013-S1, L105076). Status chips, not controls: no off position exists for any
          account including the root, so nothing here is pressable, focusable or approvable.
        </p>
        <div className="mt-3 space-y-3">
          {SA_INVARIANTS.map((invariant) => (
            <InvariantChip key={invariant.id} invariant={invariant} />
          ))}
        </div>
      </section>

      <section aria-label="Unspecified in source" className="mt-6">
        <h2 className="text-lg font-semibold">Unspecified in source</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The frozen source defines exactly one control for this module. Everything below is an
          affordance a reader might expect and the source does not define. It is named here rather
          than invented, because a plausible invented control reads back as a requirement.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-ink-muted)]">
          {UNSPECIFIED_IN_SOURCE.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </SaConsoleShell>
  )
}

function IncidentCard({
  incident,
  roleId,
  roleName,
  stateId,
  onClose,
}: {
  readonly incident: PlatformIncident
  readonly roleId: RoleId
  readonly roleName: string
  readonly stateId: ScreenStateId
  readonly onClose: (id: string) => void
}) {
  const decision = decisionFor(roleId, incident)
  const blocker = closeBlocker(incident, stateId)

  return (
    <article
      aria-label={`Incident ${incident.id}`}
      className="rounded-[var(--radius-control)] border border-[var(--color-border)] p-4"
    >
      <p className="font-medium">
        {incident.id} — {incident.title}
      </p>
      <div className="mt-2">
        <StatusPill tone="info" icon="●" label={`Incident state: ${incident.state}`} />
      </div>
      <dl className="mt-3 grid gap-1 text-sm text-[var(--color-ink-muted)] sm:grid-cols-2">
        <div>
          <dt className="inline font-medium">Classification: </dt>
          <dd className="inline">{incident.classification}</dd>
        </div>
        <div>
          <dt className="inline font-medium">Named role owner: </dt>
          <dd className="inline">{incident.roleOwner}</dd>
        </div>
        <div>
          <dt className="inline font-medium">Detection source: </dt>
          <dd className="inline">{incident.detectionSource}</dd>
        </div>
        <div>
          <dt className="inline font-medium">Communication decision: </dt>
          <dd className="inline">{incident.communicationDecision}</dd>
        </div>
        <div>
          <dt className="inline font-medium">Tenants affected: </dt>
          <dd className="inline">
            {incident.tenants.join(', ')}
            {incident.tenants.length > 1
              ? ' — recorded as one platform incident, not one incident per tenant'
              : ''}
          </dd>
        </div>
        <div>
          <dt className="inline font-medium">Capability: </dt>
          <dd className="inline">{incident.capability}</dd>
        </div>
      </dl>
      <p className="mt-2 text-sm font-medium">Verification checklist</p>
      <ul className="mt-1 space-y-1 text-sm text-[var(--color-ink-muted)]">
        {incident.checklist.map((item) => (
          <li key={item.label}>
            {item.label} — {item.evidence ?? 'no positive evidence recorded yet'}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">{incident.sourceRef}</p>

      <div className="mt-3">
        {incident.state === 'closed' ? (
          <p className="text-sm text-[var(--color-ink-muted)]">
            Closed. The transition and its platform audit record commit in the same transaction
            (AC-SA-01-08, L43075), and no console screen offers a path back out of a closed
            incident.
          </p>
        ) : decision.outcome !== 'allowed' ? (
          // ABSENT, by rule, not by taste (spec §3). A role the evaluator
          // refuses on the ROLE test holds no incident ownership anywhere in
          // the source, so no control is drawn — a disabled control would
          // imply an enabled state exists somewhere for this role, and the
          // build map records this exact control as absent for Support.
          <ProhibitionNotice
            rendering={{
              kind: 'absent',
              note: `No close control is drawn here for ${roleName}. ${decision.explanation} Incident ownership on this console is held by the Root Super Admin, Admin and Platform Engineer alone, and Support holds none anywhere in the source (L42715) — so nothing is drawn, not a disabled control, because a disabled control would imply an enabled state exists somewhere for this role.`,
            }}
          />
        ) : blocker !== null ? (
          <Button disabledReason={blocker}>Close incident</Button>
        ) : (
          <Button onClick={() => onClose(incident.id)}>Close incident</Button>
        )}
      </div>
    </article>
  )
}

function stateTreatment(stateId: ScreenStateId, roleId: RoleId, roleName: string) {
  const firstIncident = INCIDENTS[0]
  switch (stateId) {
    case 'STATE-01':
      return (
        <ScreenStateBoundary
          state="STATE-01"
          surface="SURF-SA"
          detail={{
            objectLabel: 'platform incidents',
            whatCreatesIt:
              'A detector, a protocol timer, an invariant alert, a freshness alert or a tenant report opens one. No console control creates an incident.',
          }}
        />
      )
    case 'STATE-02':
      return (
        <ScreenStateBoundary
          state="STATE-02"
          surface="SURF-SA"
          detail={{ objectLabel: 'the platform aggregates' }}
        />
      )
    case 'STATE-04':
      return (
        <ScreenStateBoundary
          state="STATE-04"
          surface="SURF-SA"
          detail={{
            fieldLabel: 'Verification checklist',
            rule: 'Recovery verification requires positive evidence for each item, and an incident cannot be closed on the absence of alerts alone (AC-4883).',
            permittedFormat:
              'Every checklist item must carry recorded evidence before the close control acts.',
          }}
        />
      )
    case 'STATE-05': {
      const decision =
        firstIncident !== undefined ? decisionFor(roleId, firstIncident) : undefined
      if (decision === undefined || decision.outcome === 'allowed') {
        return (
          <p role="note" className="text-sm text-[var(--color-ink-muted)]">
            {roleName} holds the incident close, so no refusal renders for this role. Select
            Support (ROLE-PLAT-SUP) to see the refusal named rather than hidden behind a missing
            control.
          </p>
        )
      }
      return (
        <ScreenStateBoundary state="STATE-05" surface="SURF-SA" detail={{ decision }} />
      )
    }
    case 'STATE-06':
      // ONE cause, and the same one for all four roles. Branching the cause on
      // the role printed two different "single causes" for one condition;
      // Support's lack of incident ownership is a role fact, it is stated on
      // the record where the control is ABSENT, and it is not what makes this
      // screen read-only.
      return (
        <ScreenStateBoundary
          state="STATE-06"
          surface="SURF-SA"
          detail={{ readOnlyCause: READ_ONLY_CAUSE }}
        />
      )
    case 'STATE-08':
      return (
        <ScreenStateBoundary
          state="STATE-08"
          surface="SURF-SA"
          detail={{
            asOfLabel: 'as of 2026-08-16 08:30 platform time, 42 minutes old',
            originLabel: 'served last-known-good from the aggregation layer (FB-SA-01)',
          }}
        />
      )
    case 'STATE-09':
      return (
        <ProhibitionNotice
          rendering={{
            kind: 'absent',
            note: 'Nothing on this module enters the queued state: it issues no device command, and its only write commits with its audit record in one transaction. No element here is drawn as queued.',
          }}
        />
      )
    case 'STATE-10':
    case 'STATE-11':
      return (
        <p className="text-sm text-[var(--color-ink-muted)]">
          Rendered in the agent-health panel below. Everything else on this module keeps working.
        </p>
      )
    case 'STATE-12':
      return (
        <ScreenStateBoundary
          state="STATE-12"
          surface="SURF-SA"
          detail={{
            failureWhat: 'The platform audit write accompanying an incident close',
            wasWritten: false,
            nextStep:
              'FB-SA-03: the action does not happen. The incident record is unchanged; the close can be attempted again.',
          }}
        />
      )
    case 'STATE-13':
      return (
        <ScreenStateBoundary
          state="STATE-13"
          surface="SURF-SA"
          detail={{
            recoveryProgress:
              'Re-aggregating the telemetry gap window: two of three dependent views recomputed. The incident cannot close while any dependent view is behind.',
          }}
        />
      )
    case 'STATE-03':
      return (
        <p className="text-sm text-[var(--color-ink-muted)]">
          The aggregates and incident records below are the success rendering, each with its
          as-of stamp.
        </p>
      )
    case 'STATE-07':
      // Unreachable: STATE-07 is frontline-only and is not offered by the
      // selector. Handled so the switch is exhaustive over ScreenStateId
      // rather than falling through to a default that would silently
      // swallow a state added later.
      return (
        <p className="text-sm text-[var(--color-ink-muted)]">
          Only the Frontline Worker Application has a true offline state.
        </p>
      )
    default: {
      const exhaustive: never = stateId
      throw new Error(`Unhandled screen state: ${String(exhaustive)}`)
    }
  }
}
