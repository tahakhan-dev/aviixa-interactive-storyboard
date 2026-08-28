'use client'

import { useState } from 'react'
import {
  AppShell,
  Chart,
  DataTable,
  FreshnessStamp,
  RequireSession,
  StatTile,
  StatusPill,
  bg,
  borderColor,
  radiusClass,
  textColor,
  useAccessContext,
  useRepositoryQuery,
  useStore,
  type ChartSeries,
  type DataTableColumn,
  type ProductSession,
  type StatTileData,
  type StatusToken,
} from '@/ui/product'
import { evaluateAccess } from '@/policy/evaluate'
import type { AccessContext, Repository, RowOf } from '@/data/repository'
import { saModuleById } from '@/surfaces/sa/modules'

/**
 * Task 9 (unit-01) — the platform-level telemetry dashboard for MOD-SA-10.
 * Replaces the previous document-style body (767 lines, 39 rendered
 * blueprint locators, a scenario-state fixture stepper) with a real
 * dashboard: every figure below is read from the repository at render time,
 * exactly as `OverviewScreen.tsx` (Task 3) and `TenantDetailScreen.tsx`
 * (Task 6) already establish for this generation of screens.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE FIFTEEN NAMED MEASURES (frozen source L45134) AND WHAT THIS BUILD
 * FOUND FOR EACH
 * ─────────────────────────────────────────────────────────────────────────
 * L45134 names exactly fifteen, in this order — the order this file's tile
 * grid keeps:
 *  1. Errors and agent-run failures
 *  2. Active workflows, published, in draft and in review
 *  3. Active agents, the enabled set with activations and gate outcomes
 *  4. Tokens consumed by router role
 *  5. Runs and capture volumes
 *  6. Deviations by severity and containment state
 *  7. Worker-Shift consumption against allocation
 *  8. Sync health — device online rates, queue depths, clock-skew events
 *  9. Hold-propagation lag per tenant against the platform-wide view
 * 10. Clearance volumes granted under the qualification machinery
 * 11. Adoption-timing lag
 * 12. Eval posture of enabled capabilities
 * 13. Learning-proposal lifecycle
 * 14. Notification and escalation health
 * 15. Override patterns (frequency and clustering, never record contents)
 *
 * This build's data model (`@/data/schemas`) has no `agents`/`atoms` and no
 * learning-proposal collection at all, so #1, most of #3, and #13 render
 * `kind: 'unknown'` — never a fabricated count. #9 and #11 also render
 * unknown: `holds` records a placement and a release, never the per-device
 * confirmation moment "propagation" means, and `workflow-definitions`
 * carries a version and a status but no publish timestamp, so no interval
 * to "in force on devices" exists to read. #12 (eval posture) is a genuine
 * source/model mismatch, not a missing collection: `evaluations` is this
 * build's real Eval Harness data, but it carries no `tenantId` at all — it
 * tests platform capabilities, not tenant-attributed work — so a PER-TENANT
 * eval-posture figure cannot be read for any tenant. Disclosed on screen
 * (see the comparative tab) rather than invented.
 *
 * The remaining nine (#2, #4, #5, #6, #7, #8 in part, #10, #14, #15) are
 * real, computed, per-tenant reads — see `readSnapshot` and the grouping
 * maps below for exactly which collection backs each.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE ANONYMISATION INVARIANT, ENFORCED IN THE SHAPE OF THE DATA
 * ─────────────────────────────────────────────────────────────────────────
 * `deviationRateBands` below takes a `readonly number[]` — plain rates,
 * already stripped of which tenant produced them — and returns
 * `{ band, tenantCount }` pairs. No tenant id, name or index EVER enters
 * that function, so no later edit to this file's render code can leak one
 * through it: there is no parameter position for identity to travel
 * through. This is `AC-SA-10-03`/`L45230`/`L45179`'s "anonymisation
 * precedes aggregation" made structural rather than a step a later
 * maintainer could quietly skip — the same enforcement style
 * `OverviewScreen.tsx` uses for `fullRecordDecision` (a decision object
 * with `allowedRoles: []`, not a comment asking nobody to add a button).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ROLE ACCESS — A THREE-WAY CONFLICT IN THE FROZEN SOURCE, RESOLVED AND
 * DISCLOSED
 * ─────────────────────────────────────────────────────────────────────────
 * Three passages state who reads this module, and they do not agree:
 *  - The Part VIII charter row (L4621) names only "Admin; Platform
 *    Engineer" — read here as a RACI-style owner summary, the same
 *    abbreviated pattern every other `§8.x` charter row uses (e.g. `§8.9`
 *    names only "Admin; Root Super Admin" while its own detailed module
 *    record grants Support a read as well).
 *  - The platform-to-module matrix `MTX-PLAT-02` (L21087) marks the
 *    Platform Engineer `Unavailable` for the WHOLE module.
 *  - MOD-SA-10's own module record and permission matrix (L45170–L45202,
 *    the most specific passage — it is the module's own dedicated
 *    specification, not a cross-module summary table) states "All four
 *    console roles, read" and its per-action matrix grants Root, Admin,
 *    Platform Engineer AND Support "Allowed" to both read the fifteen
 *    measures and read the anonymised comparative.
 * This build follows the per-module, per-action matrix (L45170–L45202)
 * over the coarser cross-module summaries, the same precedence this unit's
 * `OverviewScreen.tsx` already established as `D16` ("a module-level
 * `roles_allowed` array is authoritative nowhere") — disclosed on screen
 * below rather than silently picked. A second, narrower conflict — whether
 * Support reads the ANONYMISED COMPARATIVE specifically — is resolved the
 * other way: the isolation chapter's own principal-by-layer matrix
 * (L97155, "Cross-tenant aggregates: Unavailable" for Support, holding the
 * line it does NOT soften for Support's other reads) is treated as the
 * more specific, more deliberate statement on that one narrow question,
 * over MOD-SA-10's own generic "Allowed" cell for that same role/action
 * pair — consistent with master prompt §15.2's own boundary that Support
 * exists for narrow, session-scoped remediation, not standing cross-tenant
 * benchmarking.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHAT THIS SCREEN DOES NOT BUILD
 * ─────────────────────────────────────────────────────────────────────────
 * The previous body's "request a support session" form and "open the
 * tenant's audit log" affordance duplicated Support Access (`MOD-SA-15`,
 * already its own screen at `/super-admin/support-access/`) rather than
 * reading telemetry — out of this task's scope ("Produces: nothing later
 * tasks import"), and this rebuild does not reconstruct it. This screen
 * reads `tenants`, `workflow-definitions`, `ai-requests`, `runs`,
 * `captures`, `deviations`, `devices`, `step-executions`,
 * `qualification-grants`, `workers`, `notifications` and `entitlements` —
 * it never reads the `reports` collection, which is the tenant-facing
 * report data this module must never duplicate (`AC-SA-10-05`, L45138).
 */

const MODULE = saModuleById('MOD-SA-10')
const USAGE_FEATURE_KEY = 'worker-shift-allocation'

type Tenant = RowOf<'tenants'>
type TenantLifecycle = Tenant['lifecycle']
type WorkflowDefinition = RowOf<'workflow-definitions'>
type WorkflowStatus = WorkflowDefinition['status']
type Run = RowOf<'runs'>
type Capture = RowOf<'captures'>
type Deviation = RowOf<'deviations'>
type DeviationStatus = Deviation['status']
type Device = RowOf<'devices'>
type StepExecution = RowOf<'step-executions'>
type QualificationGrant = RowOf<'qualification-grants'>
type Worker = RowOf<'workers'>
type Notification = RowOf<'notifications'>
type AiRequest = RowOf<'ai-requests'>
type RouterRole = AiRequest['routerRole']
type Entitlement = RowOf<'entitlements'>
type Evaluation = RowOf<'evaluations'>

const LIFECYCLE_LABEL: Readonly<Record<TenantLifecycle, string>> = {
  invited: 'Invited',
  pilot: 'Pilot',
  active: 'Active',
  'soft-suspended': 'Soft suspended',
  'hard-suspended': 'Hard suspended',
  'compliance-suspended': 'Compliance suspended',
  'pending-downgrade': 'Pending downgrade',
  archived: 'Archived',
}

const LIFECYCLE_TONE: Readonly<Record<TenantLifecycle, StatusToken>> = {
  invited: 'pending',
  pilot: 'info',
  active: 'ok',
  'soft-suspended': 'warn',
  'hard-suspended': 'danger',
  'compliance-suspended': 'danger',
  'pending-downgrade': 'warn',
  archived: 'offline',
}

const WORKFLOW_STATUS_ORDER: readonly WorkflowStatus[] = ['draft', 'in-review', 'published', 'outdated', 'archived']
const WORKFLOW_STATUS_LABEL: Readonly<Record<WorkflowStatus, string>> = {
  draft: 'Draft',
  'in-review': 'In review',
  published: 'Published',
  outdated: 'Outdated',
  archived: 'Archived',
}

const DEVIATION_STATUS_ORDER: readonly DeviationStatus[] = [
  'detected', 'classified', 'contained', 'escalated', 'dispositioned', 'bridged', 'resolved',
]
const DEVIATION_STATUS_LABEL: Readonly<Record<DeviationStatus, string>> = {
  detected: 'Detected',
  classified: 'Classified',
  contained: 'Contained',
  escalated: 'Escalated',
  dispositioned: 'Dispositioned',
  bridged: 'Bridged',
  resolved: 'Resolved',
}

const ROUTER_ROLE_ORDER: readonly RouterRole[] = ['primary', 'fallback', 'lightweight', 'embedding']
const ROUTER_ROLE_LABEL: Readonly<Record<RouterRole, string>> = {
  primary: 'Primary',
  fallback: 'Fallback',
  lightweight: 'Lightweight',
  embedding: 'Embedding',
}

/** Platform time, never wall time — same shape as `OverviewScreen.tsx`'s own helper (its header records the same gap: no shared date-formatting module exists yet for `src/ui/product/**`). */
function formatPlatformTime(ms: number): string {
  const formatted = new Date(ms).toLocaleString('en-US', {
    timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  return `${formatted} platform time`
}

function groupBy<T>(rows: readonly T[], key: (row: T) => string): ReadonlyMap<string, readonly T[]> {
  const map = new Map<string, T[]>()
  for (const row of rows) {
    const k = key(row)
    const bucket = map.get(k)
    if (bucket) bucket.push(row)
    else map.set(k, [row])
  }
  return map
}

interface TenantMetricsSnapshot {
  readonly tenants: readonly Tenant[]
  readonly workflowDefinitions: readonly WorkflowDefinition[]
  readonly runs: readonly Run[]
  readonly captures: readonly Capture[]
  readonly deviations: readonly Deviation[]
  readonly devices: readonly Device[]
  readonly stepExecutions: readonly StepExecution[]
  readonly qualificationGrants: readonly QualificationGrant[]
  readonly workers: readonly Worker[]
  readonly notifications: readonly Notification[]
  readonly aiRequests: readonly AiRequest[]
  readonly entitlements: readonly Entitlement[]
  readonly evaluations: readonly Evaluation[]
}

/**
 * CONTRACT (see `useRepositoryQuery`'s own header, and `OverviewScreen.tsx`'s
 * identical framing): a pure function of `(repository, ctx)` alone. WHICH
 * tenant is under inspection is client-side selection state, not part of
 * either argument, so it is applied in plain render code below, never
 * folded in here — the same reasoning `TenantDetailScreen.tsx#readSnapshot`
 * gives for why its own tenant filter lives outside its selector. The
 * `ai-requests` clock filter ("to date") is the one genuinely time-
 * dependent read on this screen and is likewise applied AFTER this
 * snapshot, in `nowMs`-aware render code, never inside this cached
 * selector — `OverviewScreen.tsx`'s own header explains why in full.
 */
function readSnapshot(repository: Repository, ctx: AccessContext): TenantMetricsSnapshot {
  return {
    tenants: repository.list('tenants', ctx).all(),
    workflowDefinitions: repository.list('workflow-definitions', ctx).all(),
    runs: repository.list('runs', ctx).all(),
    captures: repository.list('captures', ctx).all(),
    deviations: repository.list('deviations', ctx).all(),
    devices: repository.list('devices', ctx).all(),
    stepExecutions: repository.list('step-executions', ctx).all(),
    qualificationGrants: repository.list('qualification-grants', ctx).all(),
    workers: repository.list('workers', ctx).all(),
    notifications: repository.list('notifications', ctx).all(),
    aiRequests: repository.list('ai-requests', ctx).all(),
    entitlements: repository.list('entitlements', ctx).all(),
    evaluations: repository.list('evaluations', ctx).all(),
  }
}

/**
 * `deviations`/`captures`/`qualification-grants` are not `tenantId`-scoped
 * directly (see the schema comments beside each collection's own type) —
 * `captures` joins through `runId → runs.tenantId`, `qualification-grants`
 * through `workerId → workers.tenantId`. Built once per render from the
 * snapshot; see this file's header for why this stays outside
 * `readSnapshot` itself (it is a pure function of the snapshot alone, so it
 * would be safe there too, but keeping every join beside the render code
 * that consumes it — the same shape `TenantDetailScreen.tsx` uses for
 * `usersById`/`roleGrantByUserId` — keeps this file's one contract, "no
 * clock or selection state inside `readSnapshot`", visibly obvious rather
 * than requiring a reader to check).
 */
function tenantIdOfRun(runs: readonly Run[]): ReadonlyMap<string, string> {
  return new Map(runs.map((r) => [r.id, r.tenantId] as const))
}

function anonymisedRatioBands(ratios: readonly number[]): readonly { readonly band: string; readonly tenantCount: number }[] {
  const bands = [
    { band: '0%', test: (r: number) => r === 0 },
    { band: '>0–5%', test: (r: number) => r > 0 && r <= 0.05 },
    { band: '5–15%', test: (r: number) => r > 0.05 && r <= 0.15 },
    { band: '>15%', test: (r: number) => r > 0.15 },
  ]
  return bands.map((b) => ({ band: b.band, tenantCount: ratios.filter(b.test).length }))
}

export function TenantMetricsScreen() {
  return (
    <RequireSession signInHref="/super-admin/sign-in/">
      {(session) => <TenantMetricsDashboard session={session} />}
    </RequireSession>
  )
}

function TenantMetricsDashboard({ session }: { readonly session: ProductSession }) {
  const store = useStore()
  const ctx = useAccessContext()
  const nowMs = store.clock.now()
  const asOfLabel = formatPlatformTime(nowMs)

  const snapshot = useRepositoryQuery(readSnapshot)
  // A separate call, same reasoning as `OverviewScreen.tsx`'s own
  // `attentionQuery`: `DataTable` needs a live `Query<Tenant>` of its own to
  // sort/filter/page over.
  const tenantsQuery = useRepositoryQuery((r, c) => r.list('tenants', c))

  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null)
  const [tab, setTab] = useState<'per-tenant' | 'comparative'>('per-tenant')

  /**
   * `MOD-SA-10`'s own permission matrix (L45201–L45202): all four console
   * roles read the fifteen measures. See this file's header for the
   * three-way conflict this resolves and why.
   */
  const readDecision = evaluateAccess(
    {
      action: 'MOD-SA-10:read-per-tenant-measures',
      allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN', 'PLATFORM_ENGINEER', 'SUPPORT'],
      sourceRefs: ['L45134', 'L45170', 'L45201'],
    },
    ctx,
  )
  // Support reads the per-tenant measures above but not this: L97155 puts
  // "Cross-tenant aggregates: Unavailable" in Support's own row and does
  // not soften it, the narrower and more deliberate of the two conflicting
  // statements — see this file's header.
  const comparativeDecision = evaluateAccess(
    {
      action: 'MOD-SA-10:read-anonymised-comparative',
      allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN', 'PLATFORM_ENGINEER'],
      sourceRefs: ['L45136', 'L45202', 'L97154', 'L97155'],
    },
    ctx,
  )

  if (readDecision.outcome !== 'allowed') {
    return (
      <AppShell surface="SURF-SA" session={session} title={MODULE.name} breadcrumbs={[{ label: MODULE.name }]}>
        <div className={`${radiusClass('lg')} border ${borderColor('border')} ${bg('raised')} p-6`}>
          <h2 className={`text-lg font-semibold ${textColor('ink')}`}>This role does not read telemetry here</h2>
          <p className={`mt-2 max-w-prose text-sm ${textColor('ink-muted')}`}>{readDecision.explanation}</p>
        </div>
      </AppShell>
    )
  }

  const runTenantId = tenantIdOfRun(snapshot.runs)
  const workerTenantId = new Map(snapshot.workers.map((w) => [w.id, w.tenantId] as const))

  const runsByTenant = groupBy(snapshot.runs, (r) => r.tenantId)
  const capturesByTenant = groupBy(
    snapshot.captures.filter((c) => runTenantId.has(c.runId)),
    (c) => runTenantId.get(c.runId) as string,
  )
  const deviationsByTenant = groupBy(snapshot.deviations, (d) => d.tenantId)
  const devicesByTenant = groupBy(snapshot.devices, (d) => d.tenantId)
  const workflowsByTenant = groupBy(snapshot.workflowDefinitions, (w) => w.tenantId)
  const stepExecutionsByTenant = groupBy(
    snapshot.stepExecutions.filter((se) => runTenantId.has(se.runId)),
    (se) => runTenantId.get(se.runId) as string,
  )
  const grantsByTenant = groupBy(
    snapshot.qualificationGrants.filter((g) => workerTenantId.has(g.workerId)),
    (g) => workerTenantId.get(g.workerId) as string,
  )
  const notificationsByTenant = groupBy(snapshot.notifications, (n) => n.tenantId)
  const aiRequestsToDateByTenant = groupBy(
    // "to date" per `OverviewScreen.tsx`'s own `aiRequestsToDate` reasoning:
    // a cumulative ledger read through the simulated clock, never
    // `Date.now()`. At the seed's pristine clock this exclude the requests
    // whose `createdAt` has not "happened" yet from the platform's own
    // simulated point of view.
    snapshot.aiRequests.filter((a) => Date.parse(a.createdAt) <= nowMs),
    (a) => a.tenantId,
  )

  const hasOperationalHistory = (t: Tenant) => (runsByTenant.get(t.id)?.length ?? 0) > 0

  const defaultTenantId =
    snapshot.tenants.find(hasOperationalHistory)?.id ?? snapshot.tenants[0]?.id ?? null
  const tenantId = selectedTenantId ?? defaultTenantId
  const tenant = tenantId === null ? null : (snapshot.tenants.find((t) => t.id === tenantId) ?? null)

  const tenantColumns: readonly DataTableColumn<Tenant>[] = [
    {
      key: 'name',
      header: 'Tenant',
      sortValue: (t) => t.name,
      render: (t) => (
        <button
          type="button"
          data-control-id={`tenant-metrics-select-${t.id}`}
          onClick={() => setSelectedTenantId(t.id)}
          aria-pressed={t.id === tenantId}
          className={`text-left underline-offset-2 hover:underline ${t.id === tenantId ? 'font-semibold' : ''} ${textColor('ink')}`}
        >
          {t.name}
        </button>
      ),
    },
    {
      key: 'lifecycle',
      header: 'Lifecycle',
      sortValue: (t) => t.lifecycle,
      render: (t) => <StatusPill tone={LIFECYCLE_TONE[t.lifecycle]} label={LIFECYCLE_LABEL[t.lifecycle]} />,
    },
    {
      key: 'history',
      header: 'Operational history',
      sortValue: (t) => (hasOperationalHistory(t) ? 1 : 0),
      render: (t) =>
        hasOperationalHistory(t) ? (
          <StatusPill tone="ok" label="Recorded" />
        ) : (
          <StatusPill tone="offline" label="None yet" />
        ),
    },
  ]

  return (
    <AppShell surface="SURF-SA" session={session} title={MODULE.name} breadcrumbs={[{ label: MODULE.name }]}>
      <p className={`max-w-prose text-sm ${textColor('ink-muted')}`}>
        Counts, rates and statuses for every tenant on the platform — never the underlying operational
        record. Opening one of those records takes a named, audited session; this module cannot open one
        itself.
      </p>

      <section aria-labelledby="tenant-metrics-picker-heading" className="mt-6 flex flex-col gap-3">
        <h2 id="tenant-metrics-picker-heading" className={`text-lg font-semibold ${textColor('ink')}`}>
          Choose a tenant
        </h2>
        <DataTable
          caption="Tenants"
          columns={tenantColumns}
          query={tenantsQuery}
          rowId={(t) => t.id}
          emptyState={{ title: 'No tenant exists yet', whatCreatesIt: 'A tenant appears here once it is provisioned.' }}
        />
      </section>

      <div className="mt-6" role="tablist" aria-label="Telemetry view">
        <div className="flex gap-2 border-b" style={{ borderColor: 'var(--border)' }}>
          {(['per-tenant', 'comparative'] as const).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              data-control-id={`tenant-metrics-tab-${id}`}
              onClick={() => setTab(id)}
              className={`px-3 py-2 text-sm font-medium ${
                tab === id ? `border-b-2 ${textColor('ink')}` : textColor('ink-muted')
              }`}
              style={tab === id ? { borderColor: 'var(--accent)' } : undefined}
            >
              {id === 'per-tenant' ? 'Per tenant' : 'Anonymised comparative'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'per-tenant' ? (
        tenant === null ? (
          <div className={`mt-6 ${radiusClass('lg')} border ${borderColor('border')} ${bg('raised')} p-6`}>
            <p className={`text-sm ${textColor('ink')}`}>No tenant is selected.</p>
          </div>
        ) : (
          <PerTenantMeasures
            tenant={tenant}
            asOfLabel={asOfLabel}
            runs={runsByTenant.get(tenant.id) ?? []}
            captures={capturesByTenant.get(tenant.id) ?? []}
            deviations={deviationsByTenant.get(tenant.id) ?? []}
            devices={devicesByTenant.get(tenant.id) ?? []}
            workflows={workflowsByTenant.get(tenant.id) ?? []}
            stepExecutions={stepExecutionsByTenant.get(tenant.id) ?? []}
            grants={grantsByTenant.get(tenant.id) ?? []}
            notifications={notificationsByTenant.get(tenant.id) ?? []}
            aiRequestsToDate={aiRequestsToDateByTenant.get(tenant.id) ?? []}
            entitlements={snapshot.entitlements}
          />
        )
      ) : (
        <ComparativeAnalytics
          decision={comparativeDecision}
          asOfLabel={asOfLabel}
          tenants={snapshot.tenants}
          runsByTenant={runsByTenant}
          deviationsByTenant={deviationsByTenant}
          evaluations={snapshot.evaluations}
        />
      )}
    </AppShell>
  )
}

/* ────────────────────────────────────────────────────────────────────── *
 * Per-tenant measures
 * ────────────────────────────────────────────────────────────────────── */

function PerTenantMeasures({
  tenant,
  asOfLabel,
  runs,
  captures,
  deviations,
  devices,
  workflows,
  stepExecutions,
  grants,
  notifications,
  aiRequestsToDate,
  entitlements,
}: {
  readonly tenant: Tenant
  readonly asOfLabel: string
  readonly runs: readonly Run[]
  readonly captures: readonly Capture[]
  readonly deviations: readonly Deviation[]
  readonly devices: readonly Device[]
  readonly workflows: readonly WorkflowDefinition[]
  readonly stepExecutions: readonly StepExecution[]
  readonly grants: readonly QualificationGrant[]
  readonly notifications: readonly Notification[]
  readonly aiRequestsToDate: readonly AiRequest[]
  readonly entitlements: readonly Entitlement[]
}) {
  // M2 — active workflows, published/in draft/in review (L45134).
  const workflowCounts = new Map<WorkflowStatus, number>()
  for (const w of workflows) workflowCounts.set(w.status, (workflowCounts.get(w.status) ?? 0) + 1)
  const activeWorkflowCount = (workflowCounts.get('draft') ?? 0) + (workflowCounts.get('in-review') ?? 0) + (workflowCounts.get('published') ?? 0)

  // M3 — active agents / gate outcomes. No `agents` collection exists in
  // this build (see this file's header); `gateOutcome` on `step-executions`
  // is a real, related read this build DOES have, shown as supporting
  // detail rather than folded into the tile's own number.
  const gateOutcomeCounts = { passed: 0, failed: 0, 'not-applicable': 0 } as Record<StepExecution['gateOutcome'], number>
  for (const se of stepExecutions) gateOutcomeCounts[se.gateOutcome] += 1
  const gatedStepCount = gateOutcomeCounts.passed + gateOutcomeCounts.failed

  // M4 — tokens consumed by router role, to date.
  const tokensByRole = new Map<RouterRole, number>()
  let totalTokens = 0
  for (const a of aiRequestsToDate) {
    const tokens = a.promptTokens + a.completionTokens
    tokensByRole.set(a.routerRole, (tokensByRole.get(a.routerRole) ?? 0) + tokens)
    totalTokens += tokens
  }

  // M6 — deviations by severity and containment state.
  const severities = [...new Set(deviations.map((d) => d.severityBand))].sort((a, b) => a - b)
  const deviationSeries: readonly ChartSeries[] = DEVIATION_STATUS_ORDER.filter((status) =>
    deviations.some((d) => d.status === status),
  ).map((status) => ({
    id: status,
    label: DEVIATION_STATUS_LABEL[status],
    values: severities.map((sev) => deviations.filter((d) => d.severityBand === sev && d.status === status).length),
  }))

  // M7 — Worker-Shift consumption against allocation (same ceiling
  // `TenantDetailScreen.tsx#renderOverviewTab` reads — the real, seeded
  // per-tier cap, never a hand-typed number).
  const tierEntitlement = entitlements.find((e) => e.tier === tenant.tier && e.featureKey === USAGE_FEATURE_KEY)
  const cap = tierEntitlement?.cap ?? null
  const shiftRatio = cap !== null && cap > 0 ? tenant.workerShiftsThisMonth / cap : null

  // M8 — sync health. Zero devices means no rate exists (unknown, not
  // 0%); one or more devices means a real rate, with queue depth
  // disclosed as absent from this build's device telemetry (partial).
  const syncHealthyCount = devices.filter((d) => d.syncHealthy).length
  const clockSkewTotal = devices.reduce((sum, d) => sum + d.clockSkewEventCount, 0)
  const lastDeviceContactMs = devices.reduce<number | null>((latest, d) => {
    if (d.lastSeenAt === null) return latest
    const ms = Date.parse(d.lastSeenAt)
    return latest === null || ms > latest ? ms : latest
  }, null)

  // M10/M15 — clearance volumes and override patterns are the SAME
  // underlying object (`qualification-grants`, OBJ-032 "Clearance"): the
  // frozen source's own illustrative example (L45183 area — "two
  // qualification clearances granted by Sam in the same area in the same
  // shift") ties the two together directly. M10 is the plain volume; M15
  // is that same volume clustered by dimension, never by who.
  const groupsByReasonAndArea = groupBy(grants, (g) => `${g.reasonCategory}::${g.areaId ?? 'unscoped'}`)
  const clusterRows = [...groupsByReasonAndArea.entries()].map(([key, rows]) => {
    const [reasonCategory, areaId] = key.split('::')
    return { reasonCategory, areaId, count: rows.length }
  })

  // M14 — notification and escalation health: fallbacks fired and
  // timeouts (the `expired` notification state) are both real fields.
  const fallbacksFiredCount = notifications.filter((n) => n.fallbackDelivered).length
  const timeoutCount = notifications.filter((n) => n.status === 'expired').length

  const tiles: readonly { readonly id: string; readonly label: string; readonly data: StatTileData }[] = [
    {
      id: 'errors-agent-run-failures',
      label: 'Errors and agent-run failures',
      data: {
        kind: 'unknown',
        reason: 'No collection in this build models a platform agent run or its failures.',
      },
    },
    {
      id: 'active-workflows',
      label: 'Active workflows',
      data: { kind: 'value', value: activeWorkflowCount, unit: 'workflows' },
    },
    {
      id: 'active-agents',
      label: 'Active agents',
      data: {
        kind: 'partial',
        reason:
          gatedStepCount > 0
            ? `No agent-registry collection exists in this build; ${gatedStepCount} gated step executions are shown below as a related read.`
            : 'No agent-registry collection exists in this build, and this tenant has no gated step executions recorded either.',
      },
    },
    {
      id: 'tokens-consumed',
      label: 'Tokens consumed, to date',
      data: { kind: 'value', value: totalTokens, unit: 'tokens' },
    },
    {
      id: 'runs',
      label: 'Runs',
      data: { kind: 'value', value: runs.length, unit: 'runs' },
    },
    {
      id: 'deviations',
      label: 'Deviations',
      data: { kind: 'value', value: deviations.length, unit: 'deviations' },
    },
    {
      id: 'worker-shift-consumption',
      label: 'Worker-Shift consumption',
      data: { kind: 'value', value: tenant.workerShiftsThisMonth, unit: 'shifts this month' },
    },
    {
      id: 'sync-health',
      label: 'Sync health',
      data:
        devices.length === 0
          ? { kind: 'unknown', reason: 'No devices are enrolled for this tenant.' }
          : {
              kind: 'partial',
              reason: `Queue depth is not part of this build's device telemetry. ${syncHealthyCount} of ${devices.length} devices report healthy sync; ${clockSkewTotal} clock-skew events recorded.`,
            },
    },
    {
      id: 'hold-propagation-lag',
      label: 'Hold-propagation lag',
      data: {
        kind: 'unknown',
        reason: 'Holds record when they were placed and released, never the per-device confirmation moment propagation means.',
      },
    },
    {
      id: 'clearance-volumes',
      label: 'Clearance volumes',
      data: { kind: 'value', value: grants.length, unit: 'clearances' },
    },
    {
      id: 'adoption-timing-lag',
      label: 'Adoption-timing lag',
      data: {
        kind: 'unknown',
        reason: 'Workflow versions carry a status but no publish timestamp in this build, so no interval to in-force can be read.',
      },
    },
    {
      id: 'eval-posture',
      label: 'Eval posture',
      data: {
        kind: 'unknown',
        reason: "This build's eval-harness records are not attributed to a tenant. A platform-wide figure is shown on the comparative tab.",
      },
    },
    {
      id: 'learning-proposal-lifecycle',
      label: 'Learning-proposal lifecycle',
      data: {
        kind: 'unknown',
        reason: 'No collection in this build models a Lane-B learning-proposal queue.',
      },
    },
    {
      id: 'notification-escalation-health',
      label: 'Notification and escalation health',
      data: { kind: 'value', value: fallbacksFiredCount, unit: 'fallbacks fired' },
    },
    {
      id: 'override-patterns',
      label: 'Override patterns',
      data: { kind: 'value', value: clusterRows.length, unit: 'clustering groups' },
    },
  ]

  const workflowChartSeries: readonly ChartSeries[] = [
    { id: 'workflows', label: 'Workflow definitions', values: WORKFLOW_STATUS_ORDER.map((s) => workflowCounts.get(s) ?? 0) },
  ]
  const tokensChartSeries: readonly ChartSeries[] = [
    { id: 'tokens', label: 'Tokens (prompt + completion)', values: ROUTER_ROLE_ORDER.map((r) => tokensByRole.get(r) ?? 0) },
  ]
  const volumeChartSeries: readonly ChartSeries[] = [
    { id: 'volume', label: `${tenant.name}`, values: [runs.length, captures.length] },
  ]

  return (
    <>
      <section aria-labelledby="tenant-metrics-tiles-heading" className="mt-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="tenant-metrics-tiles-heading" className={`text-lg font-semibold ${textColor('ink')}`}>
            {tenant.name} — the fifteen named measures
          </h2>
          <FreshnessStamp asOfLabel={asOfLabel} />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {tiles.map((t) => (
            <StatTile key={t.id} controlId={`tenant-metrics-tile-${t.id}`} label={t.label} data={t.data} />
          ))}
        </div>
        {devices.length > 0 ? (
          <p className={`text-xs ${textColor('ink-subtle')}`}>
            Sync health and clock-skew figures are as of this tenant's own last device contact
            {lastDeviceContactMs !== null ? `, ${formatPlatformTime(lastDeviceContactMs)}` : ''} — device-derived
            measures freeze at last contact rather than at the platform's own clock.
          </p>
        ) : null}
      </section>

      <section aria-labelledby="tenant-metrics-workflows-heading" className="mt-8 flex flex-col gap-3">
        <h3 id="tenant-metrics-workflows-heading" className={`text-base font-semibold ${textColor('ink')}`}>
          Active workflows, by status
        </h3>
        <Chart
          controlId="tenant-metrics-chart-workflows"
          kind="bar"
          title={`${tenant.name} — workflow definitions by status`}
          categories={WORKFLOW_STATUS_ORDER.map((s) => WORKFLOW_STATUS_LABEL[s])}
          series={workflowChartSeries}
          unit="workflows"
        />
      </section>

      <section aria-labelledby="tenant-metrics-runs-heading" className="mt-8 flex flex-col gap-3">
        <h3 id="tenant-metrics-runs-heading" className={`text-base font-semibold ${textColor('ink')}`}>
          Runs and capture volumes
        </h3>
        <Chart
          controlId="tenant-metrics-chart-runs-captures"
          kind="bar"
          title={`${tenant.name} — runs and capture volumes`}
          categories={['Runs', 'Captures']}
          series={volumeChartSeries}
        />
      </section>

      <section aria-labelledby="tenant-metrics-deviations-heading" className="mt-8 flex flex-col gap-3">
        <h3 id="tenant-metrics-deviations-heading" className={`text-base font-semibold ${textColor('ink')}`}>
          Deviations, by severity and containment state
        </h3>
        {deviations.length === 0 ? (
          <p className={`text-sm ${textColor('ink-muted')}`}>No deviation has been recorded for this tenant.</p>
        ) : (
          <Chart
            controlId="tenant-metrics-chart-deviations"
            kind="bar"
            title={`${tenant.name} — deviations by severity and containment state`}
            categories={severities.map((s) => `Severity ${s}`)}
            series={deviationSeries}
            unit="deviations"
          />
        )}
      </section>

      <section aria-labelledby="tenant-metrics-tokens-heading" className="mt-8 flex flex-col gap-3">
        <h3 id="tenant-metrics-tokens-heading" className={`text-base font-semibold ${textColor('ink')}`}>
          Tokens consumed, by router role
        </h3>
        {totalTokens === 0 ? (
          <p className={`text-sm ${textColor('ink-muted')}`}>No AI request for this tenant falls inside the current window.</p>
        ) : (
          <Chart
            controlId="tenant-metrics-chart-tokens"
            kind="bar"
            title={`${tenant.name} — tokens consumed by router role`}
            categories={ROUTER_ROLE_ORDER.map((r) => ROUTER_ROLE_LABEL[r])}
            series={tokensChartSeries}
            unit="tokens"
          />
        )}
      </section>

      <section aria-labelledby="tenant-metrics-override-heading" className="mt-8 flex flex-col gap-3">
        <h3 id="tenant-metrics-override-heading" className={`text-base font-semibold ${textColor('ink')}`}>
          Override patterns — frequency and clustering
        </h3>
        <p className={`max-w-prose text-sm ${textColor('ink-muted')}`}>
          Grouped by reason and area; never by who granted it or who received it — this table never reads
          who was involved or why, in their own words, only how often and where.
        </p>
        {clusterRows.length === 0 ? (
          <p className={`text-sm ${textColor('ink-muted')}`}>No clearance override has been recorded for this tenant.</p>
        ) : (
          <div className={`overflow-x-auto ${radiusClass('lg')} border ${borderColor('border')}`}>
            <table className="w-full text-sm">
              <caption className="sr-only">{`${tenant.name} — override clustering by reason and area`}</caption>
              <thead>
                <tr className={`border-b ${borderColor('border')} ${bg('raised')} text-left`}>
                  <th scope="col" className={`p-2 font-medium ${textColor('ink-muted')}`}>Reason category</th>
                  <th scope="col" className={`p-2 font-medium ${textColor('ink-muted')}`}>Area</th>
                  <th scope="col" className={`p-2 text-right font-medium ${textColor('ink-muted')}`}>Count in this tenant's history</th>
                </tr>
              </thead>
              <tbody>
                {clusterRows.map((row) => (
                  <tr key={`${row.reasonCategory}::${row.areaId}`} className={`border-b ${borderColor('border')} last:border-b-0`}>
                    <td className={`p-2 ${textColor('ink')}`}>{row.reasonCategory}</td>
                    <td className={`p-2 ${textColor('ink')}`}>{row.areaId}</td>
                    <td className={`p-2 text-right ${textColor('ink')}`}>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="tenant-metrics-shift-heading" className="mt-8 flex flex-col gap-3">
        <h3 id="tenant-metrics-shift-heading" className={`text-base font-semibold ${textColor('ink')}`}>
          Worker-Shift consumption against allocation
        </h3>
        <p className={`text-sm ${textColor('ink')}`}>
          {tenant.workerShiftsThisMonth.toLocaleString()} Worker-Shifts this month
          {cap !== null ? ` of a ${cap.toLocaleString()} ceiling` : ' — this tier carries no consumption ceiling'}
          {shiftRatio !== null ? ` (${Math.round(shiftRatio * 100)}% of the ceiling).` : '.'}
        </p>
      </section>

      <section aria-labelledby="tenant-metrics-notif-heading" className="mt-8 flex flex-col gap-3">
        <h3 id="tenant-metrics-notif-heading" className={`text-base font-semibold ${textColor('ink')}`}>
          Notification and escalation health
        </h3>
        <p className={`text-sm ${textColor('ink')}`}>
          {notifications.length === 0
            ? 'No notification has been recorded for this tenant.'
            : `${fallbacksFiredCount} of ${notifications.length} notifications fired a fallback delivery; ${timeoutCount} timed out without acknowledgement.`}
        </p>
      </section>
    </>
  )
}

/* ────────────────────────────────────────────────────────────────────── *
 * Anonymised comparative
 * ────────────────────────────────────────────────────────────────────── */

function ComparativeAnalytics({
  decision,
  asOfLabel,
  tenants,
  runsByTenant,
  deviationsByTenant,
  evaluations,
}: {
  readonly decision: ReturnType<typeof evaluateAccess>
  readonly asOfLabel: string
  readonly tenants: readonly Tenant[]
  readonly runsByTenant: ReadonlyMap<string, readonly Run[]>
  readonly deviationsByTenant: ReadonlyMap<string, readonly Deviation[]>
  readonly evaluations: readonly Evaluation[]
}) {
  if (decision.outcome !== 'allowed') {
    return (
      <section aria-labelledby="tenant-metrics-comparative-denied-heading" className="mt-8">
        <div className={`${radiusClass('lg')} border ${borderColor('border')} ${bg('raised')} p-6`}>
          <h2 id="tenant-metrics-comparative-denied-heading" className={`text-lg font-semibold ${textColor('ink')}`}>
            Not available to this role
          </h2>
          <p className={`mt-2 max-w-prose text-sm ${textColor('ink-muted')}`}>{decision.explanation}</p>
        </div>
      </section>
    )
  }

  // Deviation rate — the one comparative band this build's data model
  // actually supports. Only tenants with at least one run have a rate at
  // all; a tenant with none is excluded from every band, never counted
  // into the "0%" band (that would misstate "never had a deviation" as
  // "no history to judge from" — two different facts).
  const deviationRates = tenants
    .map((t) => {
      const runCount = runsByTenant.get(t.id)?.length ?? 0
      if (runCount === 0) return null
      return (deviationsByTenant.get(t.id)?.length ?? 0) / runCount
    })
    .filter((r): r is number => r !== null)
  const deviationBands = anonymisedRatioBands(deviationRates)
  const tenantsWithHistory = deviationRates.length

  // Eval pass rate — platform-wide, not per-tenant: `evaluations` carries
  // no tenant attribution at all (see this file's header). Shown here,
  // disclosed as platform-wide, rather than invented as a per-tenant
  // distribution the source names but this build's data model cannot back.
  const results = evaluations.filter((e) => e.kind === 'result')
  const passCount = results.filter((r) => r.kind === 'result' && r.outcome === 'pass').length
  const evalPassRatePercent = results.length > 0 ? Math.round((passCount / results.length) * 100) : null

  return (
    <>
      <section aria-labelledby="tenant-metrics-invariant-heading" className="mt-8 flex flex-col gap-3">
        <h2 id="tenant-metrics-invariant-heading" className={`text-lg font-semibold ${textColor('ink')}`}>
          Anonymised comparative analytics
        </h2>
        <p className={`max-w-prose text-sm ${textColor('ink-muted')}`}>
          No tenant is named anywhere below, for any role including the root. Anonymisation happens before
          these numbers are computed — there is no earlier, named version of this view for any account to
          fall back to, and no setting anywhere turns it off.
        </p>
        <details data-control-id="tenant-metrics-role-disclosure" className="text-xs">
          <summary className={`cursor-pointer ${textColor('ink-muted')}`}>Why the Platform Engineer sees this tab</summary>
          <p className={`mt-1 max-w-prose ${textColor('ink-muted')}`}>
            This platform's own specification describes this role's access two different ways: a
            cross-module summary marks the Platform Engineer unavailable for this whole module; this
            module's own, more detailed permission table grants the Platform Engineer a read of both the
            fifteen measures and this anonymised comparative, the same as the root and the Admin. This
            console follows the module's own, more specific table — a client-delegated choice under
            APP-012, not a position the source settled.
          </p>
        </details>
      </section>

      <section aria-labelledby="tenant-metrics-eval-heading" className="mt-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 id="tenant-metrics-eval-heading" className={`text-base font-semibold ${textColor('ink')}`}>
            Eval pass rate
          </h3>
          <FreshnessStamp asOfLabel={asOfLabel} />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatTile
            controlId="tenant-metrics-comparative-eval-pass-rate"
            label="Eval pass rate — platform-wide"
            data={
              evalPassRatePercent === null
                ? { kind: 'unknown', reason: 'No eval result has been recorded.' }
                : { kind: 'value', value: evalPassRatePercent, unit: '% pass, all tenants combined' }
            }
          />
          <StatTile
            controlId="tenant-metrics-comparative-gate-latency"
            label="Gate-decision latencies"
            data={{ kind: 'unknown', reason: 'No gate-decision latency is recorded in this build’s data model.' }}
          />
          <StatTile
            controlId="tenant-metrics-comparative-coaching"
            label="Coaching resolution"
            data={{ kind: 'unknown', reason: 'No coaching collection exists in this build.' }}
          />
        </div>
        <p className={`max-w-prose text-xs ${textColor('ink-subtle')}`}>
          This build's eval-harness records are not attributed to a tenant, so the figure above is
          platform-wide rather than a per-tenant distribution — disclosed here rather than shown as
          fifteen invented tenant numbers.
        </p>
      </section>

      <section aria-labelledby="tenant-metrics-deviation-rate-heading" className="mt-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 id="tenant-metrics-deviation-rate-heading" className={`text-base font-semibold ${textColor('ink')}`}>
            Deviation rate, anonymised distribution
          </h3>
          <FreshnessStamp asOfLabel={asOfLabel} />
        </div>
        {tenantsWithHistory === 0 ? (
          <p className={`text-sm ${textColor('ink-muted')}`}>
            No tenant has a recorded run yet, so no deviation-rate distribution exists.
          </p>
        ) : (
          <>
            <Chart
              controlId="tenant-metrics-chart-deviation-rate-distribution"
              kind="donut"
              title="Tenants by deviation-rate band"
              categories={deviationBands.map((b) => b.band)}
              series={[{ id: 'tenants', label: 'Tenants', values: deviationBands.map((b) => b.tenantCount) }]}
              unit="tenants"
            />
            <p className={`max-w-prose text-xs ${textColor('ink-subtle')}`}>
              {tenantsWithHistory} of {tenants.length} tenants have a recorded run and a deviation rate to
              place in a band; the rest have no operational history yet and are counted in neither band —
              a tenant with no runs has no deviation rate, not a deviation rate of zero.
            </p>
          </>
        )}
      </section>
    </>
  )
}
