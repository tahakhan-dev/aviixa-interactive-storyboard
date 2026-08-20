'use client'

import { useState } from 'react'
import Link from 'next/link'
import { HubShell, type TenantRoleId } from '../HubShell'
import { dohModuleById } from '@/surfaces/doh/modules'
import { SeamNotice } from '@/ui/doh/SeamNotice'
import { TENANT_STATE_OPTIONS } from '@/ui/doh/tenant-state-vocabulary'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import {
  Banner,
  Select,
  StatusPill,
  Table,
  type StatusTone,
  type TableRow,
} from '@/ui/primitives'
import { ScreenStateBoundary } from '@/ui/ScreenStateBoundary'
import { screenState } from '@/ui/screen-state'
import { evaluateAccess } from '@/policy/evaluate'
import { permitsRead, type PermissionDecision } from '@/policy/decision'
import { roleById, type RoleId } from '@/domain/roles'
import { emptyDomainState, withTenant } from '@/domain/state'
import { scenarioRunId, tenantId } from '@/domain/ids'
import { TENANT_STATES, type TenantState } from '@/surfaces/doh/tenant-state'
import type { QualificationChip } from '../worker-lifecycle-and-qualifications/fixtures'
import {
  ABSENT_BY_RULE,
  APPLICABLE_SCREEN_STATES,
  AS_OF_DATE,
  CALENDAR_AS_OF,
  CALENDAR_SCOPE_NOTE,
  CALENDAR_WEEKS,
  CALENDAR_WEEK_COUNT,
  CONTROL_MATRIX,
  DECISIONS_ON_SCREEN,
  DOH_CLEARANCES,
  DOH_QUALIFICATIONS,
  DOH_WORKERS,
  GRID_FOOTER_COPY,
  HORIZON_DAYS,
  HORIZON_END_DATE,
  INAPPLICABLE_SCREEN_STATES,
  NO_FILTERS,
  READING_STATUSES,
  SEEDED_CERTIFICATION_TYPES,
  UNRESOLVED_IN_SOURCE,
  UNSPECIFIED_IN_SOURCE,
  WORKER_RECORD_ROUTE,
  alreadyLapsedFor,
  applyFilters,
  calendarAreasFor,
  calendarEntriesFor,
  calendarScopeFor,
  cellCount,
  filtersAreActive,
  rolesWithStatus,
  type ApplicableScreenStateId,
  type CalendarControlId,
  type CalendarEntry,
  type CalendarFilterState,
  type ControlStatus,
} from './fixtures'

/**
 * MOD-DOH-14 — the Qualification Calendar, `SCR-DOH-09`.
 *
 * A 60-day read-only projection over the qualification records another module
 * owns. It owns nothing, writes nothing, and draws no control that could be
 * mistaken for a write. Every affordance is decided per control through
 * `evaluateAccess` over MOD-DOH-14's own six-row matrix — no hand-written role
 * list exists anywhere in this file.
 *
 * THE ONE RULE THAT SHAPES THIS FILE: the scope bounds the READ. The Areas a
 * persona may see are computed once, and the grid rows, the filter options and
 * the row list all read that one answer. Nothing here is scoped in what it
 * DRAWS while trusting a wider set underneath — that is the defect this slice
 * has already recorded, and on a screen naming people it would leak names.
 */
const MODULE = dohModuleById('MOD-DOH-14')

const HUB_TENANT_ID = tenantId('TEN-BRIGHTBIKES')

/**
 * The seeded domain state the evaluator reads. ACTIVE and staying ACTIVE: the
 * evaluator carries a suspension stage of its own, and MOD-DOH-14 has no write
 * for a tenant state to gate, so letting the reviewer's state control drive the
 * evaluator would put a rule in two places to no purpose.
 */
const FIXTURE_STATE = withTenant(
  emptyDomainState(scenarioRunId('DOH-MOD-14-STORYBOARD')),
  HUB_TENANT_ID,
  () => ({
    displayName: 'Bright Bikes',
    lifecycleState: 'ACTIVE' as const,
    desiredFeatureValues: {},
    tier: 'growth',
    objects: {},
  }),
)

const CHIP_TONE: Record<QualificationChip, StatusTone> = {
  Valid: 'ok',
  '14 days': 'attention',
  '7 days': 'attention',
  '1 day': 'blocked',
  Expired: 'blocked',
  Cleared: 'info',
}

const STATUS_LABEL: Record<ControlStatus, string> = {
  allowed: 'Allowed',
  'allowed-with-conditions': 'Allowed with conditions',
  'read-only': 'Read-only',
  'explicitly-prohibited': 'Explicitly prohibited',
  'not-applicable': 'Not applicable',
  unavailable: 'Unavailable',
}

const SCREEN_STATE_OPTIONS = APPLICABLE_SCREEN_STATES.map((id) => ({
  value: id,
  label: `${id} — ${screenState(id).name}`,
}))

const EVERY_WEEK = 'every-week'
const EVERY_AREA = 'every-area'
const EVERY_TYPE = 'every-type'

/** D7's sentence for this module: reads degrade, and there is no write to disable. */
const CONNECTION_LOST_NOTE =
  'The connection to this workspace’s own records is lost. The Calendar renders from the last successfully computed projection with a freshness marker, and it stays scope-filtered while it does. No write control disables here, because this module has none: nothing on this screen was ever going to be queued.'

function contextFor(roleId: RoleId) {
  return {
    state: FIXTURE_STATE,
    identity: {
      signedIn: true,
      role: roleId,
      tenant: HUB_TENANT_ID,
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

function decide(
  roleId: RoleId,
  action: string,
  controlId: CalendarControlId,
  statuses: readonly ControlStatus[],
  sourceRefs: readonly string[],
): PermissionDecision {
  return evaluateAccess(
    { action, allowedRoles: rolesWithStatus(controlId, statuses), sourceRefs },
    contextFor(roleId),
  )
}

export function QualificationCalendarScreen() {
  const [role, setRole] = useState<TenantRoleId>('QUALITY_MANAGER')
  const [tenantState, setTenantState] = useState<TenantState>('active')
  const [stateId, setStateId] = useState<ApplicableScreenStateId>('STATE-03')
  const [filters, setFilters] = useState<CalendarFilterState>(NO_FILTERS)
  const [expandedCell, setExpandedCell] = useState<string | null>(null)

  const roleName = roleById(role).name
  const definition = screenState(stateId)

  const loading = stateId === 'STATE-02'
  const projectionFailed = stateId === 'STATE-12'
  /** STATE-01 is driven by the reviewer picking it, and by a genuinely empty read. */
  const emptyRequested = stateId === 'STATE-01'

  const readDecision = decide(
    role,
    'open-the-qualification-calendar',
    'open-the-calendar',
    READING_STATUSES,
    ['L29345', 'L48103', 'SB-DOH-026 L29412'],
  )
  const filterDecision = decide(
    role,
    'filter-the-qualification-calendar',
    'filter-the-calendar',
    READING_STATUSES,
    ['L29346'],
  )
  const linkDecision = decide(
    role,
    'link-through-to-a-worker-record',
    'link-through-to-a-worker-record',
    READING_STATUSES,
    ['L29347'],
  )

  /* THE READ, bounded by scope, computed once. The grid, the filters and the
     row list below all read these — none of them re-derives a scope, and none
     closes over a module-load snapshot. */
  const scope = calendarScopeFor(role)
  const areas = calendarAreasFor(role)
  const allEntries = emptyRequested
    ? []
    : calendarEntriesFor(role, DOH_QUALIFICATIONS, DOH_WORKERS, DOH_CLEARANCES)
  const entries = applyFilters(allEntries, filters)
  /* ONE state fold, applied to BOTH branches. The lapsed list is a second read
     of the SAME register the projection reads, so a read that failed outright
     took both with it — leaving it populated beside a grid that says the read
     failed would be one screen contradicting itself two paragraphs apart. */
  const lapsed =
    emptyRequested || projectionFailed
      ? []
      : alreadyLapsedFor(role, DOH_QUALIFICATIONS, DOH_WORKERS, DOH_CLEARANCES)

  /* The certification types actually reachable in this reader's scope. An
     option that could only ever return nothing is not offered — the filter is
     bounded by the same read as everything else. */
  const reachableCertificationIds = [...new Set(allEntries.map((e) => e.certificationId))]

  function changeScenario(apply: () => void): void {
    apply()
    setExpandedCell(null)
  }

  /**
   * A persona change re-bounds the read, so a filter naming an Area or a
   * certification type the new persona cannot see would silently return
   * nothing and look like an empty week. Both are cleared with the persona,
   * and the week filter — which is scope-independent — is kept.
   */
  function changeRole(next: TenantRoleId): void {
    changeScenario(() => {
      setRole(next)
      setFilters((f) => ({ weekIndex: f.weekIndex, areaId: null, certificationId: null }))
    })
  }

  const annotation = (
    <p className="text-xs text-[var(--color-ink-subtle)]">
      Screen annotation only, never a route key (D1): SCR-DOH-09, the Qualification Calendar, in
      the canonical catalogue; storyboard SB-DOH-026. This route is keyed on the module slug.
      MOD-DOH-14 owns no object: everything below is a projection of records another module holds,
      read through that module&rsquo;s own readers and never copied here.
    </p>
  )

  if (!permitsRead(readDecision)) {
    return (
      <HubShell module={MODULE} role={role} onRoleChange={changeRole} tenantState={tenantState}>
        {annotation}
        <section aria-label="Permission denied" className="mt-6">
          <h2 className="text-lg font-semibold">
            The Qualification Calendar is not offered to {roleName}
          </h2>
          <div className="mt-3">
            <ScreenStateBoundary
              state="STATE-05"
              surface="SURF-DOH"
              detail={{ decision: readDecision }}
            />
          </div>
          <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
            The module rail does not offer this route to {roleName}, so this is what a deep link
            meets rather than a screen with its buttons removed. The four roles that carry the read
            are the Tenant Admin, the Supervisor within their own Areas, the Quality Manager
            tenant-wide, and the Read-only Auditor.
          </p>
          <p className="mt-2 max-w-prose text-sm text-[var(--color-ink)]">
            What that costs, stated rather than hidden: this is the screen that shows when a
            certification runs out, and a worker without a device in hand cannot check their own
            expiry. Workers meet their certification alerts on the device instead, through the
            mandatory 14, 7, 1 and 0-day ladder, which is a different mechanism with a different
            purpose (D11).
          </p>
          <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
            Nine permission tokens govern this refusal, not six (D8). This one is{' '}
            {readDecision.outcome}, stage {readDecision.stage}, and it carries an explicit reason
            rather than a blank cell. The refused attempt is written to this workspace&rsquo;s own
            audit stream in the same transaction as the refusal.
          </p>
        </section>
        <div className="mt-6">{scenarioControls()}</div>
      </HubShell>
    )
  }

  function scenarioControls() {
    return (
      <section
        aria-label="Storyboard scenario controls"
        className="rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
          Reviewer controls — not part of the product
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-6">
          <Select
            label="Screen state"
            value={stateId}
            options={SCREEN_STATE_OPTIONS}
            onChange={(value) => {
              const next = APPLICABLE_SCREEN_STATES.find((s) => s === value)
              if (next !== undefined) changeScenario(() => setStateId(next))
            }}
          />
          <Select
            label="Tenant state"
            value={tenantState}
            options={TENANT_STATE_OPTIONS}
            onChange={(value) => {
              const next = TENANT_STATES.find((s) => s === value)
              if (next !== undefined) changeScenario(() => setTenantState(next))
            }}
          />
        </div>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          These re-render seeded fixtures. They perform no product action and change no business
          state. The tenant state is offered here for completeness of the chrome and gates nothing
          on this screen: MOD-DOH-14 owns no object and has no write, so the write-class table has
          nothing to refuse. Reads are unaffected by a suspension — except the compliance
          suspension, where no user is signed in to read anything at all.
        </p>
      </section>
    )
  }

  const gridRows: readonly TableRow[] = areas.map((area) => {
    const row: TableRow = {
      area: (
        <>
          <span className="font-medium">{area.name}</span>
          <span className="block text-xs text-[var(--color-ink-subtle)]">
            {area.state === 'archived' ? 'Archived — history under it is still readable' : area.id}
          </span>
        </>
      ),
    }
    for (const week of CALENDAR_WEEKS) {
      const key = `${week.index}|${area.id}`
      const n = cellCount(entries, week.index, area.id)
      row[`w${week.index}`] =
        n === 0 ? (
          <span className="text-[var(--color-ink-subtle)]" role="img" aria-label="none expiring">
            &mdash;
          </span>
        ) : (
          <button
            type="button"
            data-cell={key}
            aria-expanded={expandedCell === key}
            className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] px-2 py-0.5 text-sm underline"
            onClick={() => setExpandedCell(expandedCell === key ? null : key)}
          >
            {n}
          </button>
        )
    }
    return row
  })

  const expandedEntries: readonly CalendarEntry[] =
    expandedCell === null
      ? []
      : entries.filter((e) => `${e.weekIndex}|${e.areaId}` === expandedCell)

  function entryRows(list: readonly CalendarEntry[]): readonly TableRow[] {
    return [...list]
      .sort((a, b) =>
        a.expiryDate === b.expiryDate
          ? a.qualificationId.localeCompare(b.qualificationId)
          : a.expiryDate.localeCompare(b.expiryDate),
      )
      .map((e) => ({
        worker: permitsRead(linkDecision) ? (
          <Link href={WORKER_RECORD_ROUTE} className="text-[var(--color-primary)] underline">
            {e.workerName}
          </Link>
        ) : (
          <span>{e.workerName}</span>
        ),
        certification: e.certificationName,
        area: e.areaName,
        expiry: e.expiryDate,
        remaining: (
          <>
            <StatusPill tone={CHIP_TONE[e.chip]} icon="●" label={e.chip} />
            <span className="block text-xs text-[var(--color-ink-subtle)]">
              {e.daysToExpiry} days from the as-of stamp
            </span>
          </>
        ),
      }))
  }

  const matrixRows: readonly TableRow[] = CONTROL_MATRIX.map((row) => ({
    control: (
      <>
        <span className="font-medium">{row.control}</span>
        <span className="block text-xs text-[var(--color-ink-subtle)]">{row.sourceRef}</span>
      </>
    ),
    admin: cell(row.status.TENANT_ADMIN, row.detail.TENANT_ADMIN),
    supervisor: cell(row.status.SUPERVISOR, row.detail.SUPERVISOR),
    quality: cell(row.status.QUALITY_MANAGER, row.detail.QUALITY_MANAGER),
    auditor: cell(row.status.READONLY_AUDITOR, row.detail.READONLY_AUDITOR),
    worker: cell(row.status.WORKER, row.detail.WORKER),
    rendering: (
      <>
        <span>{row.rendering}</span>
        <span className="block text-xs text-[var(--color-ink-subtle)]">{row.effect}</span>
      </>
    ),
  }))

  return (
    <HubShell module={MODULE} role={role} onRoleChange={changeRole} tenantState={tenantState}>
      {annotation}

      <div className="mt-6">{scenarioControls()}</div>

      <section aria-label="Screen state" className="mt-6">
        <h2 className="text-lg font-semibold">Screen state</h2>
        <p className="mt-1 text-sm font-medium">
          {definition.id} — {definition.name}
        </p>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {definition.contract}
        </p>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          On MOD-DOH-14: {MODULE_STATE_NOTE[stateId]}
        </p>
        <div className="mt-3">{stateTreatment(stateId, readDecision, roleName)}</div>
      </section>

      <section aria-label="The horizon" className="mt-6">
        <h2 className="text-lg font-semibold">The 60-day horizon</h2>
        <div className="mt-3">
          <Banner
            tone="info"
            heading="Read-only, and not because of any suspension"
            body="This screen has no write capability of any kind. The cause of the read-only state is the module itself: recertification is recorded on the worker record, where it is gated and audited, and the Calendar deliberately offers no route around that rule. No control below writes anything, for any of the five tenant roles."
          />
        </div>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink)]">
          The horizon is fixed at {HORIZON_DAYS} days and is inclusive at both ends: it runs from{' '}
          {AS_OF_DATE}, the as-of day, through {HORIZON_END_DATE}. A certificate expiring on the
          last day is in view; one expiring the day after is not, and no control anywhere moves the
          boundary.
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Data as of {CALENDAR_AS_OF}. Every row is PLACED by its recorded expiry date and its
          remaining-days chip is read from the same record, so the cell a certificate sits in and
          the chip beside it can never answer two different questions. Nothing on this screen reads
          a clock.
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          <span className="font-medium text-[var(--color-ink)]">
            Why this exists beside the alert ladder:{' '}
          </span>
          the 14, 7, 1 and 0-day alerts warn the people who must act. This is a planning view — one
          person seeing the whole workforce&rsquo;s certification horizon at once, so recertification
          is arranged against the schedule rather than discovered at the 14-day alert. Neither
          replaces the other, and the Calendar being unavailable affects no enforcement anywhere:
          enforcement lives in the worker record and on the device.
        </p>
      </section>

      <section aria-label="Scope" className="mt-6">
        <h2 className="text-lg font-semibold">What {roleName} sees</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink)]">
          {CALENDAR_SCOPE_NOTE[scope]}
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Areas in view: {areas.map((a) => a.name).join(', ')}.
        </p>
        {scope === 'tenant-wide-by-role' ? (
          <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
            The widening is observable rather than asserted: the grid below carries an Area that
            this role&rsquo;s Site scope excludes on every other screen in this workspace. The
            source says both things — Site-scoped in general, tenant-wide on the Calendar by role
            rather than by scope exception — and this screen renders the second without quietly
            editing the first.
          </p>
        ) : (
          <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
            The scope bounds the READ. An Area outside it contributes no grid row, no cell, no count
            and no worker name, and it is not an option in the Area filter either — so there is no
            path by which a filter widens this reader past their own Areas.
          </p>
        )}
      </section>

      <section aria-label="Filters" className="mt-6">
        <h2 className="text-lg font-semibold">Filters</h2>
        {permitsRead(filterDecision) ? (
          <div className="mt-3 flex flex-wrap items-end gap-6">
            <Select
              label="Week"
              value={filters.weekIndex === null ? EVERY_WEEK : String(filters.weekIndex)}
              options={[
                { value: EVERY_WEEK, label: 'Every week in the horizon' },
                ...CALENDAR_WEEKS.map((w) => ({ value: String(w.index), label: w.label })),
              ]}
              onChange={(value) =>
                changeScenario(() =>
                  setFilters((f) => ({
                    ...f,
                    weekIndex:
                      value === EVERY_WEEK
                        ? null
                        : (CALENDAR_WEEKS.find((w) => String(w.index) === value)?.index ?? null),
                  })),
                )
              }
            />
            <Select
              label="Area"
              value={filters.areaId ?? EVERY_AREA}
              options={[
                { value: EVERY_AREA, label: 'Every Area in scope' },
                ...areas.map((a) => ({ value: a.id, label: a.name })),
              ]}
              onChange={(value) =>
                changeScenario(() =>
                  setFilters((f) => ({
                    ...f,
                    areaId: areas.some((a) => a.id === value) ? value : null,
                  })),
                )
              }
            />
            <Select
              label="Certification type"
              value={filters.certificationId ?? EVERY_TYPE}
              options={[
                { value: EVERY_TYPE, label: 'Every certification type' },
                ...SEEDED_CERTIFICATION_TYPES.filter((c) =>
                  reachableCertificationIds.includes(c.id),
                ).map((c) => ({ value: c.id, label: c.name })),
              ]}
              onChange={(value) =>
                changeScenario(() =>
                  setFilters((f) => ({
                    ...f,
                    certificationId: reachableCertificationIds.includes(value) ? value : null,
                  })),
                )
              }
            />
          </div>
        ) : null}
        <div className="mt-3">
          <ProhibitionNotice
            rendering={{
              kind: 'absent',
              note: 'No worker filter is drawn. The source names four filter dimensions and this build ships three — see the absent-by-rule panel below for both reasons, and the unresolved panel for the fact that this is a deliberate divergence from a source row rather than an omission.',
            }}
          />
        </div>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          The certification-type list offers only types actually reachable in this reader&rsquo;s
          Areas, because an option that could only ever return nothing teaches a reader something
          false about their own workspace. Changing persona clears the Area and type filters for the
          same reason.
        </p>
      </section>

      <section aria-label="Qualification Calendar grid" className="mt-6">
        <h2 className="text-lg font-semibold">
          {CALENDAR_WEEK_COUNT} weeks across, Areas down the side
        </h2>
        {projectionFailed ? (
          <div className="mt-3">
            <ScreenStateBoundary
              state="STATE-12"
              surface="SURF-DOH"
              detail={{
                failureWhat: 'The 60-day expiry projection',
                wasWritten: false,
                nextStep:
                  'Nothing was written, and nothing could have been: this module has no write path at all. The worker records underneath remain reachable directly, and no enforcement anywhere is affected — enforcement lives in the worker record and on the device, never in this projection.',
              }}
            />
          </div>
        ) : allEntries.length === 0 ? (
          <div className="mt-3">
            <ScreenStateBoundary
              state="STATE-01"
              surface="SURF-DOH"
              detail={{
                objectLabel: 'a certification expiring in the next 60 days in the Areas in scope',
                whatCreatesIt:
                  'A qualification record carrying an expiry date inside the horizon. Recertification is recorded on the worker record, and a certificate renewed there moves out of this view.',
              }}
            />
          </div>
        ) : (
          <div className="mt-3">
            <Table
              caption="Certifications expiring by week and by Area, tenant-wide within the reader’s scope"
              columns={[
                { key: 'area', header: 'Area' },
                ...CALENDAR_WEEKS.map((w) => ({ key: `w${w.index}`, header: w.label })),
              ]}
              rows={gridRows}
              loading={loading}
              filtered={filtersAreActive(filters)}
              emptyState={{
                title: 'No Area is in scope for this reader.',
                whatCreatesIt: 'An Area exists on the location tree and this reader’s scope admits it.',
              }}
            />
          </div>
        )}
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink)]">{GRID_FOOTER_COPY}</p>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          A cell counts CERTIFICATIONS expiring in that Area in that week. Its key is the week and
          the Area, and nothing else: there is no per-worker count, rate, ranking or comparison on
          this screen in any state, and no function here can be asked for one. A certification
          scoped across two Areas is counted in both, because the cover it provides is real in both.
          An Area with nothing expiring keeps its row — &ldquo;nothing expires here in the next 60
          days&rdquo; is an answer a planner needs, and a missing row is not.
        </p>
        <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          The ninth week is short. Nine seven-day buckets run two days past the horizon, which is day nought through day 60
          inclusive, so the last bucket is truncated at the boundary rather than overrunning it.
        </p>
      </section>

      <section aria-label="Expanded cell" className="mt-6">
        <h2 className="text-lg font-semibold">
          {expandedCell === null
            ? 'Certifications in a cell'
            : `Certifications in ${expandedEntries[0]?.areaName ?? 'this Area'}, ${
                CALENDAR_WEEKS.find((w) => w.index === expandedEntries[0]?.weekIndex)?.label ??
                'this week'
              }`}
        </h2>
        {expandedCell === null ? (
          <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
            Choose a count in the grid above to expand it. Each certification shows the worker name,
            the certification type, the expiry date and the days remaining, and links through to the
            worker record — which is the only place a recertification is recorded.
          </p>
        ) : (
          <div className="mt-3">
            <Table
              caption="Certifications in the selected week and Area"
              columns={[
                { key: 'worker', header: 'Worker' },
                { key: 'certification', header: 'Certification type' },
                { key: 'area', header: 'Area' },
                { key: 'expiry', header: 'Expiry date' },
                { key: 'remaining', header: 'Days remaining' },
              ]}
              rows={entryRows(expandedEntries)}
              emptyState={{
                title: 'Nothing expires in this Area in this week.',
                whatCreatesIt: 'A qualification record with an expiry date inside this week.',
              }}
            />
          </div>
        )}
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          A worker is NAMED here and never MEASURED. A qualification expiry is a fact about a
          certificate; a count of how a person performs is not, and no column, chip or sort on this
          screen is one. The rows are ordered by expiry date and then by record identifier — the
          source states no sort order, so this one carries no meaning beyond putting the soonest
          first.
        </p>
      </section>

      <section aria-label="Outside the forward horizon" className="mt-6">
        <h2 className="text-lg font-semibold">Outside the forward horizon</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Two kinds of certificate do not appear in the grid above. Their absence is explained here
          rather than left as a silent omission, which is what the source asks for by name in the
          one case it addresses.
        </p>
        <h3 className="mt-3 font-medium">A certification with no expiry date</h3>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          A qualification that does not lapse never appears on the Calendar at all — a forward view
          of expiry has nothing to say about a certificate that has none. In this build the
          qualification record REQUIRES an expiry date, so the case is unrepresentable rather than
          merely unseeded: there is no such record to omit. Stated here so a reader does not mistake
          the grid for a complete list of qualifications.
        </p>
        <h3 className="mt-4 font-medium">A certification that has already lapsed</h3>
        {projectionFailed ? (
          <p className="mt-1 max-w-prose text-sm text-[var(--color-ink)]">
            Not listed, because the read that failed above is the read this list is made from.
            These records come from the same qualification register as the grid, so nothing is
            shown here rather than showing rows the screen has just said it could not fetch. They
            remain reachable directly on the worker records.
          </p>
        ) : lapsed.length === 0 ? (
          <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
            None in this reader&rsquo;s scope at the as-of stamp.
          </p>
        ) : (
          <div className="mt-2">
            <Table
              caption="Already lapsed at the as-of stamp, and therefore outside a forward horizon"
              columns={[
                { key: 'worker', header: 'Worker' },
                { key: 'certification', header: 'Certification type' },
                { key: 'area', header: 'Area' },
                { key: 'expiry', header: 'Expiry date' },
                { key: 'remaining', header: 'Days remaining' },
              ]}
              rows={entryRows(lapsed)}
              emptyState={{
                title: 'Nothing has lapsed in this reader’s scope.',
                whatCreatesIt: 'A qualification whose expiry date precedes the as-of stamp.',
              }}
            />
          </div>
        )}
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          The source defines no Calendar behaviour for a certificate that has already lapsed. A
          sixty-day FORWARD horizon excludes it by definition, and dropping it from a planning
          screen without a word would hide exactly the certificate a planner most needs — so it is
          listed here, outside the grid, with its true chip. That reading is recorded in the
          unspecified panel rather than presented as the source&rsquo;s own.
        </p>
      </section>

      <section aria-label="Route to action" className="mt-6">
        <h2 className="text-lg font-semibold">Where a recertification is actually recorded</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Every row above links to the worker record. Nothing on the Calendar itself changes a
          record: the write happens there, where it is gated by the tenant state, decided by that
          module&rsquo;s own matrix and written in the same transaction as its audit entry. That is
          what stops this screen becoming a route around the rule that a Supervisor or a Tenant
          Admin enters a qualification.
        </p>
        <p className="mt-2">
          <Link href={WORKER_RECORD_ROUTE} className="text-[var(--color-primary)] underline">
            Open the worker records
          </Link>
        </p>
        <div className="mt-4">
          <SeamNotice seamId="certification-expiry-digest" />
        </div>
      </section>

      <section aria-label="Control matrix" className="mt-6">
        <h2 className="text-lg font-semibold">What each of the five tenant roles sees</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Six controls, five roles, an explicit status in every cell — a blank cell is an unanswered
          question an implementer would answer privately. Every affordance above is driven from this
          table alone, through the shared evaluator, and never from a module-level role list.
        </p>
        <div className="mt-3">
          <Table
            caption="MOD-DOH-14 control matrix, by tenant role"
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
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          Note the inversion the source built deliberately: the Quality Manager OWNS this screen and
          cannot act on it, while the Tenant Admin and the Supervisor can act — through the linked
          record — and see less.
        </p>
      </section>

      <section aria-label="Absent by rule" className="mt-6">
        <h2 className="text-lg font-semibold">Absent by rule</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Nothing is drawn where each of these would sit — only the note saying why. An inert
          control would imply that an enabled state exists for somebody, and for these it does not.
        </p>
        <div className="mt-2 space-y-3">
          {ABSENT_BY_RULE.map((item) => (
            <div key={item.label} className="text-sm text-[var(--color-ink-muted)]">
              <p className="font-medium text-[var(--color-ink)]">{item.label}</p>
              <ProhibitionNotice rendering={{ kind: 'absent', note: item.note }} />
            </div>
          ))}
        </div>
      </section>

      <section aria-label="States that never render here" className="mt-6">
        <h2 className="text-lg font-semibold">States that never render here</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Five of the thirteen screen states cannot occur on MOD-DOH-14. They are named with their
          reason rather than quietly left out of the selector.
        </p>
        <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
          {INAPPLICABLE_SCREEN_STATES.map((s) => (
            <li key={s.id}>
              <span className="font-medium text-[var(--color-ink)]">{s.id}</span> — {s.why}
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Audit" className="mt-6">
        <h2 className="text-lg font-semibold">Audit</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The Calendar performs no write and therefore produces no business audit entry. Opening it
          is recorded as a scoped read in this workspace&rsquo;s own audit log, in the same
          transaction as the read, exactly as other scoped reads are — and a refused attempt is
          recorded too, so a reader of that stream sees who was turned away and not only who
          succeeded. Where an audit write fails, the action it accompanies did not happen; on this
          screen that sentence has no write to attach to, which is itself the honest answer rather
          than an exemption.
        </p>
      </section>

      <section aria-label="Decisions rendered on this screen" className="mt-6">
        <h2 className="text-lg font-semibold">Decisions this screen renders</h2>
        <ul className="mt-2 space-y-2 text-sm text-[var(--color-ink-muted)]">
          {DECISIONS_ON_SCREEN.map((d) => (
            <li key={d.ref}>
              <span className="font-medium text-[var(--color-ink)]">{d.ref}</span> — {d.statement}
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Unspecified in source" className="mt-6">
        <h2 className="text-lg font-semibold">Unspecified in source</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Affordances and behaviours a reader might expect here that the source does not define.
          Named rather than invented, because a plausible invented control reads back as a
          requirement.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-ink-muted)]">
          {UNSPECIFIED_IN_SOURCE.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section aria-label="Unresolved in source" className="mt-6">
        <h2 className="text-lg font-semibold">Unresolved in source</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Questions the frozen source leaves open or answers twice. None is resolved silently in
          code.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-ink-muted)]">
          {UNRESOLVED_IN_SOURCE.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </HubShell>
  )
}

function cell(status: ControlStatus, detail: string) {
  return (
    <>
      <span className="font-medium">{STATUS_LABEL[status]}</span>
      <span className="block text-xs text-[var(--color-ink-subtle)]">{detail}</span>
    </>
  )
}

const MODULE_STATE_NOTE: Record<ApplicableScreenStateId, string> = {
  'STATE-01':
    'the reader’s scope holding nothing that expires inside the horizon — a real and useful answer, and the state the source specifies by name for a certification with no expiry date.',
  'STATE-02':
    'the projection while it computes. The grid renders as a skeleton of its own layout, never as a grid of noughts: a nought in a cell reads as “nothing expires here”, which is a different and much more comfortable claim than “this has not arrived”.',
  'STATE-03': 'the grid, its cells and the expanded row list, each carrying the as-of stamp.',
  'STATE-05':
    'the Worker, refused ONE LAYER UP. The only role this matrix withholds the Calendar from is the Worker, and the surface withholds every Hub route from the Worker before any module is consulted — so the refusal a Worker meets is the surface’s, not this screen’s, and it names what the withholding costs. The module keeps its own refusal beneath that as a guard, and it is not reachable through any persona today.',
  'STATE-06':
    'the standing state of this whole screen for every role that can open it, the Quality Manager included. Its cause is named once in the banner above the horizon, and it is the module rather than any suspension.',
  'STATE-08':
    'the last successfully computed projection, with a freshness marker, an as-of time and the scope filter still applied. No write control disables, because there is none.',
  'STATE-12':
    'a projection that failed to compute, naming what failed and stating that nothing was written — which here is trivially true. The worker records underneath stay reachable and no enforcement changes.',
  'STATE-13':
    'reconnection. The projection is recomputed rather than reused from cache, because a stale planning view is a plan against a workforce that has moved on.',
}

function stateTreatment(
  stateId: ApplicableScreenStateId,
  readDecision: PermissionDecision,
  roleName: string,
) {
  switch (stateId) {
    case 'STATE-01':
      return (
        <p className="text-sm text-[var(--color-ink-muted)]">
          The empty rendering is the grid&rsquo;s own, below: it names what would appear and what
          creates it, and it is never confused with a failure.
        </p>
      )
    case 'STATE-02':
      return (
        <ScreenStateBoundary
          state="STATE-02"
          surface="SURF-DOH"
          detail={{ objectLabel: 'the 60-day expiry projection' }}
        />
      )
    case 'STATE-03':
      return (
        <p className="text-sm text-[var(--color-ink-muted)]">
          The grid below is the success rendering, carrying the moment its figures were true.
        </p>
      )
    case 'STATE-05':
      if (permitsRead(readDecision)) {
        return (
          <p role="note" className="text-sm text-[var(--color-ink-muted)]">
            {roleName} carries the read, so no refusal renders for this view. Select the Worker to
            meet the refusal — and note where it comes from: the surface withholds every Hub route
            from the Worker before this module is consulted, so what renders is the surface&rsquo;s
            refusal rather than this screen&rsquo;s. The Worker is the only role this matrix marks
            unavailable, so this module&rsquo;s own STATE-05 branch is a guard that no persona
            reaches today, and that is stated rather than dressed up as a demonstration.
          </p>
        )
      }
      return (
        <ScreenStateBoundary
          state="STATE-05"
          surface="SURF-DOH"
          detail={{ decision: readDecision }}
        />
      )
    case 'STATE-06':
      return (
        <ScreenStateBoundary
          state="STATE-06"
          surface="SURF-DOH"
          detail={{
            readOnlyCause:
              'MOD-DOH-14 has no write capability of any kind. Recertification is recorded on the worker record, where it is gated and audited; the Calendar is a projection and offers no route around that.',
          }}
        />
      )
    case 'STATE-08':
      return (
        <>
          <ScreenStateBoundary
            state="STATE-08"
            surface="SURF-DOH"
            detail={{
              asOfLabel: `as of ${CALENDAR_AS_OF}`,
              originLabel:
                'the last projection computed before the connection dropped, still scope-filtered, degraded rather than blanked',
            }}
          />
          <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
            {CONNECTION_LOST_NOTE}
          </p>
        </>
      )
    case 'STATE-12':
      return (
        <p className="text-sm text-[var(--color-ink-muted)]">
          The failure rendering is the grid&rsquo;s own, below: it names the projection as what
          failed, states that nothing was written, and names the two routes to the same facts.
        </p>
      )
    case 'STATE-13':
      return (
        <ScreenStateBoundary
          state="STATE-13"
          surface="SURF-DOH"
          detail={{
            recoveryProgress:
              'Reconnected. The projection is being recomputed rather than reused from cache. There is no write to re-enable and no tenant state to refetch before doing so, because this module writes nothing at all.',
          }}
        />
      )
    default: {
      const exhaustive: never = stateId
      throw new Error(`Unhandled screen state on MOD-DOH-14: ${String(exhaustive)}`)
    }
  }
}
