'use client'

import { useMemo, useRef, useState, type KeyboardEvent } from 'react'
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
 * FIX ROUND 1 (review) — the round-1 review caught that the first pass's
 * "does not exist in the source" claims about `L107350`/`L107315`/`L107244`
 * were produced by `grep -n "107350\|107315\|107244"` — searching a
 * 122,241-line file for those digits AS TEXT, which trivially fails to find
 * a genuine line 107,350. `sed -n '107350p'` (the only reliable way to read
 * a cited line number) shows all three are real, and two govern real
 * content this file was missing. This header, the tile captions, the period
 * filter, the role-conflict disclosure, the anonymisation-boundary fix and
 * measure 1's `partial` treatment all trace back to that one lesson.
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
 * `L107244` restates the same fifteen-plus-Overview aggregation fact as
 * L45134 ("aggregation produces the eight elements of the Super Admin
 * Overview screen plus the fifteen named per-tenant measures") — real, on
 * topic, genuinely redundant with L45134 for THIS purpose, so it is named
 * here rather than cited a second time on a call it does not additionally
 * govern.
 *
 * This build's data model (`@/data/schemas`) has no `agents`/`atoms` and no
 * learning-proposal collection at all, so most of #3 and all of #13 render
 * `kind: 'unknown'`/`'partial'` — never a fabricated count. #1 is `partial`,
 * not `unknown`: `ai-requests.status` carries `failed-over` (tenant-scoped,
 * already read for measure 4) and `evaluations` result rows carry
 * `outcome: 'fail'` (already read for the comparative tab's eval-pass-rate)
 * — both real, related reads named in the tile's own reason, the same
 * treatment measure 3 already gets. #9 and #11 also render unknown: `holds`
 * records a placement and a release, never the per-device confirmation
 * moment "propagation" means, and `workflow-definitions` carries a version
 * and a status but no publish timestamp, so no interval to "in force on
 * devices" exists to read. #12 (eval posture) is a genuine source/model
 * mismatch, not a missing collection: `evaluations` is this build's real
 * Eval Harness data, but it carries no `tenantId` at all — it tests
 * platform capabilities, not tenant-attributed work — so a PER-TENANT
 * eval-posture figure cannot be read for any tenant. Disclosed on screen
 * (see the comparative tab) rather than invented.
 *
 * The remaining measures (#2, #4, #5, #6, #7, #8 in part, #10, #14, #15) are
 * real, computed, per-tenant reads — see `readSnapshot` and the grouping
 * maps below for exactly which collection backs each.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE SCREEN'S OWN STORYBOARD (L45160, L107350) — RESTORED, NOT JUST NAMED
 * ─────────────────────────────────────────────────────────────────────────
 * L45160 (`SB-SA-10`): "the per-tenant tab renders the fifteen measures as
 * a grid of small charts with as-of stamps, filterable by period." L107350
 * (the observability chapter's own telemetry-drill-down storyboard, on this
 * exact screen): "each tile carries the value, the comparison window, and a
 * completeness indicator." Fix round 1 restores all three, honestly:
 *  - As-of stamps: `FreshnessStamp` on every one of the eight per-tenant
 *    panels (fix round 1 found seven of eight were missing one).
 *  - A comparison window on every tile — `windowFor()` below — either the
 *    selected period's label or a stated reason a given measure is a
 *    current-state snapshot rather than a windowed count.
 *  - A completeness indicator on every tile — "Complete" for a `value` tile
 *    (this build's telemetry pipeline has no simulated collection-gap
 *    event, so every computed value genuinely is complete); the tile's own
 *    `Unknown`/`Partial` headline IS the completeness indicator for the
 *    other two kinds, so no redundant second word is added there.
 *  - Filterable by period: a real `<select>` driven by the tenant's own
 *    recorded run months (`productionDate`), filtering every measure that
 *    has a natural per-event timestamp (tokens, runs, captures, deviations,
 *    gated step executions, clearances, override groups, notifications) and
 *    stating plainly, per tile, which measures are current-state snapshots
 *    the period control cannot narrow (active workflows, sync health,
 *    Worker-Shift consumption, and the four structurally `unknown` tiles).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE ANONYMISATION INVARIANT
 * ─────────────────────────────────────────────────────────────────────────
 * `ComparativeAnalytics` receives `deviationRates: readonly number[]` and
 * two plain counts — never `tenants`, never a tenant-keyed map. Fix round 1
 * moved the rate computation up into `TenantMetricsDashboard`, because the
 * review correctly found that the previous version handed the component
 * full tenant identity (`tenants`, `runsByTenant`, `deviationsByTenant`) and
 * only ITS OWN CHOICE not to call `tenants.map(t => t.name)` kept the tab
 * anonymised — a convention, not a guarantee. With this fix, there is no
 * parameter position in `ComparativeAnalytics` a later edit could read a
 * tenant name from, because the component is never given one.
 *
 * Disclosed rather than hidden: the review also found that this tab's
 * anonymity is defeated by cross-reference, not by a defect. The band is
 * deviations ÷ runs, and the per-tenant tab (same module, same roles)
 * publishes both raw numbers for every tenant by name — a reader willing to
 * open all twenty-nine per-tenant views can reconstruct every tenant's own
 * band. Both layers are individually source-granted (L45134's per-tenant
 * measures, L45136's comparative), so this is largely inherited rather than
 * a defect this screen introduces, but the CHOICE of deviation rate as the
 * one comparative measure this build's data can actually back is this
 * screen's, so the comparative section says so in plain language rather
 * than silently relying on nobody doing the cross-reference.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ROLE ACCESS — A FOUR-WAY CONFLICT, RESOLVED AND DISCLOSED WHERE EVERY
 * AFFECTED ROLE CAN ACTUALLY SEE IT
 * ─────────────────────────────────────────────────────────────────────────
 * Four passages state who reads this module's comparative, and fix round 1
 * re-reads all four rather than three:
 *  - L4621 (Part VIII charter row): names only "Admin; Platform Engineer"
 *    for the whole module — read as a RACI-style owner summary, the same
 *    abbreviated pattern every other `§8.x` charter row uses.
 *  - L21087 (`MTX-PLAT-02`, platform-to-module matrix): marks the Platform
 *    Engineer `Unavailable` for the WHOLE module, and Support `Read-only
 *    [M13]`.
 *  - L21098's `[M13]` footnote — the condition attached to THAT SAME
 *    Support cell — reads: "Cross-tenant comparative analytics are
 *    anonymised aggregates enforced as an invariant; no role, including the
 *    root, reads them de-anonymised." Fix round 1's own error, corrected:
 *    the first pass's report said no fourth passage existed; this one was
 *    sitting on the very line it already cited. Read plainly, `[M13]`
 *    qualifies what Support's "Read-only" already means for this module —
 *    anonymised, the same universal qualifier that governs the root — not
 *    an exclusion of Support from the comparative specifically.
 *  - MOD-SA-10's own module record and permission matrix (L45170–L45202,
 *    the most specific, dedicated passage): "Roles that see and use it |
 *    All four console roles, read" (the role-grant row is L45173, not
 *    L45170 — L45170 is the `Purpose` row one line above it; fix round 1's
 *    citation error, corrected) and its own action-level table grants Root,
 *    Admin, Platform Engineer AND Support "Allowed" to both read the
 *    fifteen measures and read the anonymised comparative.
 *  - L97154/L97155 (the isolation chapter's own principal-by-layer matrix):
 *    Platform Engineer's "Cross-tenant aggregates" cell reads "Read-only,
 *    anonymised"; Support's reads "Unavailable," not softened.
 *
 * Three of four passages (L45170–L45202's own table, L21098's own `[M13]`
 * read plainly, and — for the Platform Engineer half of this — L97154) point
 * toward every one of the four console roles reading the anonymised
 * comparative; only L97155's narrower isolation-chapter line, about
 * Support's normal working mode specifically, points the other way. Fix
 * round 1 changes the resolution on the merits: all four platform roles now
 * read the fifteen measures AND the anonymised comparative, the same as
 * they already read the measures. This is disclosed on screen inside a
 * `<details>` widget ON THE COMPARATIVE TAB ITSELF — reachable by every role
 * that can open the tab, including Support, which fix round 1's own review
 * found was the one role shut out of the previous round's disclosure by
 * construction (it lived inside the tab Support could not open).
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
 * `qualification-grants`, `workers`, `areas`, `notifications` and
 * `entitlements` — it never reads the `reports` collection, which is the
 * tenant-facing report data this module must never duplicate (`AC-SA-10-05`,
 * L45138).
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
type GateOutcome = StepExecution['gateOutcome']
type QualificationGrant = RowOf<'qualification-grants'>
type Worker = RowOf<'workers'>
type Area = RowOf<'areas'>
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

const ALL_TIME = 'all'
const CURRENT_STATE_WINDOW = 'Current state — not filtered by period'

/** Platform time, never wall time — same shape as `OverviewScreen.tsx`'s own helper (its header records the same gap: no shared date-formatting module exists yet for `src/ui/product/**`). */
function formatPlatformTime(ms: number): string {
  const formatted = new Date(ms).toLocaleString('en-US', {
    timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  return `${formatted} platform time`
}

/** `'2026-03'` → `'March 2026'`. Used only for the period `<select>`'s own labels and each tile's comparison-window caption. */
function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  if (year === undefined || month === undefined) return monthKey
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long' })
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
  readonly areas: readonly Area[]
  readonly notifications: readonly Notification[]
  readonly aiRequests: readonly AiRequest[]
  readonly entitlements: readonly Entitlement[]
  readonly evaluations: readonly Evaluation[]
}

/**
 * CONTRACT (see `useRepositoryQuery`'s own header, and `OverviewScreen.tsx`'s
 * identical framing): a pure function of `(repository, ctx)` alone. WHICH
 * tenant is under inspection, and which period is selected, are client-side
 * selection state, not part of either argument, so both are applied in
 * plain render code below, never folded in here — the same reasoning
 * `TenantDetailScreen.tsx#readSnapshot` gives for why its own tenant filter
 * lives outside its selector. The `ai-requests` clock filter ("to date") is
 * the one genuinely time-dependent read on this screen and is likewise
 * applied AFTER this snapshot, in `nowMs`-aware render code, never inside
 * this cached selector — `OverviewScreen.tsx`'s own header explains why in
 * full.
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
    areas: repository.list('areas', ctx).all(),
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
 * `readSnapshot` itself.
 */
function tenantIdOfRun(runs: readonly Run[]): ReadonlyMap<string, string> {
  return new Map(runs.map((r) => [r.id, r.tenantId] as const))
}

function anonymisedRatioBands(ratios: readonly number[]): readonly { readonly band: string; readonly tenantCount: number }[] {
  const bands = [
    { band: '0%', test: (r: number) => r === 0 },
    { band: '>0–5%', test: (r: number) => r > 0 && r <= 0.05 },
    { band: '>5–15%', test: (r: number) => r > 0.05 && r <= 0.15 },
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
   * `MOD-SA-10`'s own permission matrix (L45173, L45201): all four console
   * roles read the fifteen measures. See this file's header for the
   * conflict this resolves and why L45170 (the `Purpose` row, not the role
   * row) was the wrong citation fix round 1 corrects.
   */
  const readDecision = evaluateAccess(
    {
      action: 'MOD-SA-10:read-per-tenant-measures',
      allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN', 'PLATFORM_ENGINEER', 'SUPPORT'],
      sourceRefs: ['L45134', 'L45173', 'L45201'],
    },
    ctx,
  )
  // Fix round 1: Support now reads this too. Three of the four passages
  // that speak to this (L45202's own table, L21098's `[M13]` read plainly,
  // and — for the Platform Engineer half — L97154) grant it; only L97155,
  // narrower and about Support's ordinary working mode, denies it. See this
  // file's header for the full four-way reading.
  const comparativeDecision = evaluateAccess(
    {
      action: 'MOD-SA-10:read-anonymised-comparative',
      allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN', 'PLATFORM_ENGINEER', 'SUPPORT'],
      sourceRefs: ['L45136', 'L45202', 'L21098', 'L97154', 'L97155'],
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
  const areaNameById = new Map(snapshot.areas.map((a) => [a.id, a.name] as const))

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
    // `Date.now()`. At the seed's pristine clock this excludes the requests
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

  // Anonymisation boundary (see this file's header): computed here, in the
  // dashboard, as plain numbers with no tenant identity attached, and
  // handed to `ComparativeAnalytics` as `readonly number[]` plus two counts
  // — never as `tenants`/`runsByTenant`/`deviationsByTenant`, so there is no
  // parameter position in that component a later edit could read a tenant
  // name from.
  const deviationRates = snapshot.tenants
    .map((t) => {
      const runCount = runsByTenant.get(t.id)?.length ?? 0
      if (runCount === 0) return null
      return (deviationsByTenant.get(t.id)?.length ?? 0) / runCount
    })
    .filter((r): r is number => r !== null)

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

      <TabBar
        tabs={[
          { id: 'per-tenant', label: 'Per tenant' },
          { id: 'comparative', label: 'Anonymised comparative' },
        ]}
        activeId={tab}
        onChange={(id) => setTab(id as 'per-tenant' | 'comparative')}
      />

      {/* `role="tabpanel"` per tab, matching `ObjectPage.tsx`'s own contract
          (see `TabBar` above) — only the active one is rendered, so there is
          exactly one tabpanel in the DOM at a time, named by the active tab. */}
      <div
        role="tabpanel"
        id={`tenant-metrics-panel-${tab}`}
        aria-labelledby={`tenant-metrics-tab-${tab}`}
        tabIndex={0}
        className="mt-4"
      >
        {tab === 'per-tenant' ? (
          tenant === null ? (
            <div className={`${radiusClass('lg')} border ${borderColor('border')} ${bg('raised')} p-6`}>
              <p className={`text-sm ${textColor('ink')}`}>No tenant is selected.</p>
            </div>
          ) : (
            <PerTenantMeasures
              key={tenant.id}
              tenant={tenant}
              asOfLabel={asOfLabel}
              runs={runsByTenant.get(tenant.id) ?? []}
              captures={capturesByTenant.get(tenant.id) ?? []}
              deviations={deviationsByTenant.get(tenant.id) ?? []}
              devices={devicesByTenant.get(tenant.id) ?? []}
              workflows={workflowsByTenant.get(tenant.id) ?? []}
              stepExecutions={stepExecutionsByTenant.get(tenant.id) ?? []}
              grants={grantsByTenant.get(tenant.id) ?? []}
              areaNameById={areaNameById}
              notifications={notificationsByTenant.get(tenant.id) ?? []}
              aiRequestsToDate={aiRequestsToDateByTenant.get(tenant.id) ?? []}
              entitlements={snapshot.entitlements}
            />
          )
        ) : (
          <ComparativeAnalytics
            decision={comparativeDecision}
            asOfLabel={asOfLabel}
            deviationRates={deviationRates}
            totalTenantCount={snapshot.tenants.length}
            evaluations={snapshot.evaluations}
          />
        )}
      </div>
    </AppShell>
  )
}

/* ────────────────────────────────────────────────────────────────────── *
 * Accessible tab bar — the roving-tabindex/arrow-key/tabpanel contract
 * `src/ui/product/ObjectPage.tsx` already implements and documents (Task 6
 * of this unit fixed exactly this defect there: a wrapper `role="tablist"`
 * whose children were not real tab buttons, no `aria-controls`, no roving
 * `tabIndex`, no arrow keys, no `role="tabpanel"`). Copied rather than
 * imported: `ObjectPage` also renders its own `PageHeader`, which this
 * screen does not want (see `TenantDetailScreen.tsx`'s header for why
 * `AppShell` + `ObjectPage` together would double-print a title) — only the
 * tab-bar/tabpanel logic is reused here, at the same size `ObjectPage.tsx`
 * carries it.
 * ────────────────────────────────────────────────────────────────────── */

interface TabDef {
  readonly id: string
  readonly label: string
}

function TabBar({
  tabs,
  activeId,
  onChange,
}: {
  readonly tabs: readonly TabDef[]
  readonly activeId: string
  readonly onChange: (id: string) => void
}) {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  function activate(id: string): void {
    onChange(id)
    tabRefs.current[id]?.focus()
  }

  function moveFrom(id: string, delta: number): void {
    const idx = tabs.findIndex((t) => t.id === id)
    if (idx === -1) return
    const next = tabs[(idx + delta + tabs.length) % tabs.length]
    if (next) activate(next.id)
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, id: string): void {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      moveFrom(id, 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      moveFrom(id, -1)
    } else if (e.key === 'Home') {
      e.preventDefault()
      const first = tabs[0]
      if (first) activate(first.id)
    } else if (e.key === 'End') {
      e.preventDefault()
      const last = tabs[tabs.length - 1]
      if (last) activate(last.id)
    }
  }

  return (
    <div role="tablist" aria-label="Telemetry view" className={`mt-6 flex gap-1 border-b ${borderColor('border')}`}>
      {tabs.map((t) => {
        const selected = t.id === activeId
        return (
          <button
            key={t.id}
            ref={(el) => {
              tabRefs.current[t.id] = el
            }}
            type="button"
            role="tab"
            id={`tenant-metrics-tab-${t.id}`}
            aria-selected={selected}
            aria-controls={`tenant-metrics-panel-${t.id}`}
            tabIndex={selected ? 0 : -1}
            data-control-id={`tenant-metrics-tab-${t.id}`}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => onKeyDown(e, t.id)}
            className={`px-3 py-2 text-sm font-medium ${
              selected ? `border-b-2 ${borderColor('accent')} ${textColor('ink')}` : textColor('ink-muted')
            }`}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────── *
 * Per-tenant measures
 * ────────────────────────────────────────────────────────────────────── */

interface MeasureTile {
  readonly id: string
  readonly label: string
  readonly data: StatTileData
  readonly window: string
}

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
  areaNameById,
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
  readonly areaNameById: ReadonlyMap<string, string>
  readonly notifications: readonly Notification[]
  readonly aiRequestsToDate: readonly AiRequest[]
  readonly entitlements: readonly Entitlement[]
}) {
  // L45160 (`SB-SA-10`): "filterable by period." Periods are the tenant's
  // own recorded run months (`productionDate`, already `YYYY-MM-DD`) — the
  // one natural per-tenant period axis this data model carries; a tenant
  // with no runs offers no period beyond "All recorded history."
  const availablePeriods = useMemo(
    () => [...new Set(runs.map((r) => r.productionDate.slice(0, 7)))].sort().reverse(),
    [runs],
  )
  const [period, setPeriod] = useState<string>(ALL_TIME)
  const windowLabel = period === ALL_TIME ? 'All recorded history' : monthLabel(period)
  const inPeriod = (monthKey: string) => period === ALL_TIME || monthKey === period

  const periodRuns = runs.filter((r) => inPeriod(r.productionDate.slice(0, 7)))
  const periodRunIds = new Set(periodRuns.map((r) => r.id))
  const periodCaptures = captures.filter((c) => periodRunIds.has(c.runId))
  const periodDeviations = deviations.filter((d) => periodRunIds.has(d.runId))
  const periodStepExecutions = stepExecutions.filter((se) => periodRunIds.has(se.runId))
  const periodAiRequests = aiRequestsToDate.filter((a) => inPeriod(a.createdAt.slice(0, 7)))
  const periodNotifications = notifications.filter((n) => inPeriod(n.createdAt.slice(0, 7)))
  const periodGrants = grants.filter((g) => inPeriod(g.grantedAt.slice(0, 7)))

  // M1 — errors and agent-run failures. No `agents`/platform-agent-run
  // collection exists in this build (see this file's header), but two
  // real, tenant-relevant reads DO exist and are already read elsewhere on
  // this screen: `ai-requests.status === 'failed-over'` (tenant-scoped,
  // period-filterable) and `evaluations` result rows with
  // `outcome === 'fail'` (platform-wide, not tenant-attributed — see
  // measure 12). `partial`, not `unknown`, the same treatment measure 3
  // gets for the same reason: a real, named, related read exists.
  const aiFailoverCount = periodAiRequests.filter((a) => a.status === 'failed-over').length

  // M2 — active workflows, published/in draft/in review (L45134). Not
  // period-filterable: `workflow-definitions` carries a status, not a
  // per-event timestamp (see this file's header on `adoption-timing lag`
  // for the same gap).
  const workflowCounts = new Map<WorkflowStatus, number>()
  for (const w of workflows) workflowCounts.set(w.status, (workflowCounts.get(w.status) ?? 0) + 1)
  const activeWorkflowCount = (workflowCounts.get('draft') ?? 0) + (workflowCounts.get('in-review') ?? 0) + (workflowCounts.get('published') ?? 0)

  // M3 — active agents / gate outcomes. No `agents` collection exists in
  // this build; `gateOutcome` on `step-executions` is a real, related read
  // this build DOES have, shown as supporting detail rather than folded
  // into the tile's own number. `?? 0` guards a schema growing a fourth
  // outcome this object literal does not yet enumerate — the same
  // never-NaN discipline `StatTileData` itself enforces for its `value`
  // slot, applied here to a plain accumulator.
  const gateOutcomeCounts: Partial<Record<GateOutcome, number>> = {}
  for (const se of periodStepExecutions) gateOutcomeCounts[se.gateOutcome] = (gateOutcomeCounts[se.gateOutcome] ?? 0) + 1
  const gatedStepCount = (gateOutcomeCounts.passed ?? 0) + (gateOutcomeCounts.failed ?? 0)

  // M4 — tokens consumed by router role, to date and within the selected period.
  const tokensByRole = new Map<RouterRole, number>()
  let totalTokens = 0
  for (const a of periodAiRequests) {
    const tokens = a.promptTokens + a.completionTokens
    tokensByRole.set(a.routerRole, (tokensByRole.get(a.routerRole) ?? 0) + tokens)
    totalTokens += tokens
  }

  // M6 — deviations by severity and containment state.
  const severities = [...new Set(periodDeviations.map((d) => d.severityBand))].sort((a, b) => a - b)
  const deviationSeries: readonly ChartSeries[] = DEVIATION_STATUS_ORDER.filter((status) =>
    periodDeviations.some((d) => d.status === status),
  ).map((status) => ({
    id: status,
    label: DEVIATION_STATUS_LABEL[status],
    values: severities.map((sev) => periodDeviations.filter((d) => d.severityBand === sev && d.status === status).length),
  }))

  // M7 — Worker-Shift consumption against allocation (same ceiling
  // `TenantDetailScreen.tsx#renderOverviewTab` reads — the real, seeded
  // per-tier cap, never a hand-typed number). Not period-filterable:
  // `workerShiftsThisMonth` is a fixed "this month" running total, not a
  // per-event series this screen can re-window.
  const tierEntitlement = entitlements.find((e) => e.tier === tenant.tier && e.featureKey === USAGE_FEATURE_KEY)
  const cap = tierEntitlement?.cap ?? null
  const shiftRatio = cap !== null && cap > 0 ? tenant.workerShiftsThisMonth / cap : null

  // M8 — sync health. Zero devices means no rate exists (unknown, not
  // 0%); one or more devices means a real rate, with queue depth disclosed
  // as absent from this build's device telemetry (partial). Not
  // period-filterable: device state is current, not a re-windowable series
  // (the source's own "offline behaviour" row: these measures freeze at
  // last contact).
  const syncHealthyCount = devices.filter((d) => d.syncHealthy).length
  const clockSkewTotal = devices.reduce((sum, d) => sum + d.clockSkewEventCount, 0)
  const lastDeviceContactMs = devices.reduce<number | null>((latest, d) => {
    if (d.lastSeenAt === null) return latest
    const ms = Date.parse(d.lastSeenAt)
    return latest === null || ms > latest ? ms : latest
  }, null)

  // M10/M15 — clearance volumes and override patterns are the SAME
  // underlying object (`qualification-grants`, OBJ-032 "Clearance"): the
  // frozen source's own illustrative example (L45162 — "two qualification
  // clearances granted by Sam in the same area in the same shift") ties the
  // two together directly. M10 is the plain volume; M15 is that same
  // volume clustered by dimension, never by who. The dimensions kept here
  // — `reasonCategory` and the area's own name — and the ones deliberately
  // never read (`workerId`, `grantedBy`, `reasonNote`, `qualificationId`,
  // `gateReference`) are exactly the permitted/prohibited split the
  // observability cardinality rule draws (L107315): tenant, Site and Area
  // are permitted dimensions; worker identity and free-text reason strings
  // are prohibited, because — the rule's own words — "a per-worker metric
  // series is worker surveillance by another name."
  const groupsByReasonAndArea = groupBy(periodGrants, (g) => `${g.reasonCategory}::${g.areaId ?? 'unscoped'}`)
  const clusterRows = [...groupsByReasonAndArea.entries()].map(([key, rows]) => {
    const [reasonCategory, areaId] = key.split('::')
    const areaName = areaId !== undefined ? (areaNameById.get(areaId) ?? areaId) : 'Unscoped'
    return { reasonCategory: reasonCategory ?? 'Unknown', areaName, count: rows.length }
  })

  // M14 — notification and escalation health: fallbacks fired and
  // timeouts (the `expired` notification state) are both real fields.
  const fallbacksFiredCount = periodNotifications.filter((n) => n.fallbackDelivered).length
  const timeoutCount = periodNotifications.filter((n) => n.status === 'expired').length

  const tiles: readonly MeasureTile[] = [
    {
      id: 'errors-agent-run-failures',
      label: 'Errors and agent-run failures',
      data: {
        kind: 'partial',
        reason:
          `No collection in this build models a platform agent run itself. ${aiFailoverCount} of this tenant's AI requests failed over to a fallback route in this window; evaluation failures are shown platform-wide on the comparative tab.`,
      },
      window: windowLabel,
    },
    {
      id: 'active-workflows',
      label: 'Active workflows',
      data: { kind: 'value', value: activeWorkflowCount, unit: 'workflows' },
      window: CURRENT_STATE_WINDOW,
    },
    {
      id: 'active-agents',
      label: 'Active agents',
      data: {
        kind: 'partial',
        reason:
          gatedStepCount > 0
            ? `No agent-registry collection exists in this build; ${gatedStepCount} gated step executions are shown below as a related read.`
            : 'No agent-registry collection exists in this build, and this tenant has no gated step executions recorded in this window either.',
      },
      window: windowLabel,
    },
    {
      id: 'tokens-consumed',
      label: 'Tokens consumed, to date',
      data: { kind: 'value', value: totalTokens, unit: 'tokens' },
      window: windowLabel,
    },
    {
      id: 'runs',
      label: 'Runs',
      data: { kind: 'value', value: periodRuns.length, unit: 'runs' },
      window: windowLabel,
    },
    {
      id: 'deviations',
      label: 'Deviations',
      data: { kind: 'value', value: periodDeviations.length, unit: 'deviations' },
      window: windowLabel,
    },
    {
      id: 'worker-shift-consumption',
      label: 'Worker-Shift consumption',
      data: { kind: 'value', value: tenant.workerShiftsThisMonth, unit: 'shifts this month' },
      window: 'This month',
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
      window: CURRENT_STATE_WINDOW,
    },
    {
      id: 'hold-propagation-lag',
      label: 'Hold-propagation lag',
      data: {
        kind: 'unknown',
        reason: 'Holds record when they were placed and released, never the per-device confirmation moment propagation means.',
      },
      window: 'Not applicable',
    },
    {
      id: 'clearance-volumes',
      label: 'Clearance volumes',
      data: { kind: 'value', value: periodGrants.length, unit: 'clearances' },
      window: windowLabel,
    },
    {
      id: 'adoption-timing-lag',
      label: 'Adoption-timing lag',
      data: {
        kind: 'unknown',
        reason: 'Workflow versions carry a status but no publish timestamp in this build, so no interval to in-force can be read.',
      },
      window: 'Not applicable',
    },
    {
      id: 'eval-posture',
      label: 'Eval posture',
      data: {
        kind: 'unknown',
        reason: "This build's eval-harness records are not attributed to a tenant. A platform-wide figure is shown on the comparative tab.",
      },
      window: 'Not applicable — not tenant-attributed',
    },
    {
      id: 'learning-proposal-lifecycle',
      label: 'Learning-proposal lifecycle',
      data: {
        kind: 'unknown',
        reason: 'No collection in this build models a Lane-B learning-proposal queue.',
      },
      window: 'Not applicable',
    },
    {
      id: 'notification-escalation-health',
      label: 'Notification and escalation health',
      data: { kind: 'value', value: fallbacksFiredCount, unit: 'fallbacks fired' },
      window: windowLabel,
    },
    {
      id: 'override-patterns',
      label: 'Override patterns',
      data: { kind: 'value', value: clusterRows.length, unit: 'clustering groups' },
      window: windowLabel,
    },
  ]

  const workflowChartSeries: readonly ChartSeries[] = [
    { id: 'workflows', label: 'Workflow definitions', values: WORKFLOW_STATUS_ORDER.map((s) => workflowCounts.get(s) ?? 0) },
  ]
  const tokensChartSeries: readonly ChartSeries[] = [
    { id: 'tokens', label: 'Tokens (prompt + completion)', values: ROUTER_ROLE_ORDER.map((r) => tokensByRole.get(r) ?? 0) },
  ]
  const volumeChartSeries: readonly ChartSeries[] = [
    { id: 'volume', label: `${tenant.name}`, values: [periodRuns.length, periodCaptures.length] },
  ]

  return (
    <>
      <section aria-labelledby="tenant-metrics-period-heading" className="mt-6 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="tenant-metrics-period-select" className={`block text-xs font-medium uppercase tracking-wide ${textColor('ink-muted')}`} id="tenant-metrics-period-heading">
            Period
          </label>
          <select
            id="tenant-metrics-period-select"
            data-control-id="tenant-metrics-period-select"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className={`mt-1 ${radiusClass('md')} border ${borderColor('border-strong')} ${bg('surface')} px-2 py-1.5 text-sm ${textColor('ink')}`}
          >
            <option value={ALL_TIME}>All recorded history</option>
            {availablePeriods.map((p) => (
              <option key={p} value={p}>
                {monthLabel(p)}
              </option>
            ))}
          </select>
        </div>
        <p className={`max-w-prose text-xs ${textColor('ink-muted')}`}>
          Narrows every measure with its own per-event timestamp (runs, captures, deviations, tokens, gated
          steps, clearances, override groups, notifications). Active workflows, sync health and Worker-Shift
          consumption are current-state snapshots this control cannot narrow — each tile's own window says so.
        </p>
      </section>

      <section aria-labelledby="tenant-metrics-tiles-heading" className="mt-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="tenant-metrics-tiles-heading" className={`text-lg font-semibold ${textColor('ink')}`}>
            {tenant.name} — the fifteen named measures
          </h2>
          <FreshnessStamp asOfLabel={asOfLabel} />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {tiles.map((t) => (
            <div key={t.id} className="flex flex-col gap-1">
              <StatTile controlId={`tenant-metrics-tile-${t.id}`} label={t.label} data={t.data} />
              <p className={`text-xs ${textColor('ink-subtle')}`}>
                Window: {t.window}
                {t.data.kind === 'value' ? ' · Complete' : ''}
              </p>
            </div>
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
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 id="tenant-metrics-workflows-heading" className={`text-base font-semibold ${textColor('ink')}`}>
            Active workflows, by status
          </h3>
          <FreshnessStamp asOfLabel={asOfLabel} />
        </div>
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
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 id="tenant-metrics-runs-heading" className={`text-base font-semibold ${textColor('ink')}`}>
            Runs and capture volumes
          </h3>
          <FreshnessStamp asOfLabel={asOfLabel} />
        </div>
        <Chart
          controlId="tenant-metrics-chart-runs-captures"
          kind="bar"
          title={`${tenant.name} — runs and capture volumes`}
          categories={['Runs', 'Captures']}
          series={volumeChartSeries}
        />
      </section>

      <section aria-labelledby="tenant-metrics-deviations-heading" className="mt-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 id="tenant-metrics-deviations-heading" className={`text-base font-semibold ${textColor('ink')}`}>
            Deviations, by severity and containment state
          </h3>
          <FreshnessStamp asOfLabel={asOfLabel} />
        </div>
        {periodDeviations.length === 0 ? (
          <p className={`text-sm ${textColor('ink-muted')}`}>No deviation has been recorded for this tenant in this window.</p>
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
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 id="tenant-metrics-tokens-heading" className={`text-base font-semibold ${textColor('ink')}`}>
            Tokens consumed, by router role
          </h3>
          <FreshnessStamp asOfLabel={asOfLabel} />
        </div>
        {periodAiRequests.length === 0 ? (
          <p className={`text-sm ${textColor('ink-muted')}`}>No AI request for this tenant falls inside this window.</p>
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
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 id="tenant-metrics-override-heading" className={`text-base font-semibold ${textColor('ink')}`}>
            Override patterns — frequency and clustering
          </h3>
          <FreshnessStamp asOfLabel={asOfLabel} />
        </div>
        <p className={`max-w-prose text-sm ${textColor('ink-muted')}`}>
          Grouped by reason and area; never by who granted it or who received it — this table never reads
          who was involved or why, in their own words, only how often and where.
        </p>
        {clusterRows.length === 0 ? (
          <p className={`text-sm ${textColor('ink-muted')}`}>No clearance override has been recorded for this tenant in this window.</p>
        ) : (
          <div className={`overflow-x-auto ${radiusClass('lg')} border ${borderColor('border')}`}>
            <table className="w-full text-sm">
              <caption className="sr-only">{`${tenant.name} — override clustering by reason and area`}</caption>
              <thead>
                <tr className={`border-b ${borderColor('border')} ${bg('raised')} text-left`}>
                  <th scope="col" className={`p-2 font-medium ${textColor('ink-muted')}`}>Reason category</th>
                  <th scope="col" className={`p-2 font-medium ${textColor('ink-muted')}`}>Area</th>
                  <th scope="col" className={`p-2 text-right font-medium ${textColor('ink-muted')}`}>Count in this window</th>
                </tr>
              </thead>
              <tbody>
                {clusterRows.map((row) => (
                  <tr key={`${row.reasonCategory}::${row.areaName}`} className={`border-b ${borderColor('border')} last:border-b-0`}>
                    <td className={`p-2 ${textColor('ink')}`}>{row.reasonCategory}</td>
                    <td className={`p-2 ${textColor('ink')}`}>{row.areaName}</td>
                    <td className={`p-2 text-right ${textColor('ink')}`}>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="tenant-metrics-shift-heading" className="mt-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 id="tenant-metrics-shift-heading" className={`text-base font-semibold ${textColor('ink')}`}>
            Worker-Shift consumption against allocation
          </h3>
          <FreshnessStamp asOfLabel={asOfLabel} />
        </div>
        <p className={`text-sm ${textColor('ink')}`}>
          {tenant.workerShiftsThisMonth.toLocaleString()} Worker-Shifts this month
          {cap !== null ? ` of a ${cap.toLocaleString()} ceiling` : ' — this tier carries no consumption ceiling'}
          {shiftRatio !== null ? ` (${Math.round(shiftRatio * 100)}% of the ceiling).` : '.'}
        </p>
      </section>

      <section aria-labelledby="tenant-metrics-notif-heading" className="mt-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 id="tenant-metrics-notif-heading" className={`text-base font-semibold ${textColor('ink')}`}>
            Notification and escalation health
          </h3>
          <FreshnessStamp asOfLabel={asOfLabel} />
        </div>
        <p className={`text-sm ${textColor('ink')}`}>
          {periodNotifications.length === 0
            ? 'No notification has been recorded for this tenant in this window.'
            : `${fallbacksFiredCount} of ${periodNotifications.length} notifications fired a fallback delivery; ${timeoutCount} timed out without acknowledgement.`}
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
  deviationRates,
  totalTenantCount,
  evaluations,
}: {
  readonly decision: ReturnType<typeof evaluateAccess>
  readonly asOfLabel: string
  readonly deviationRates: readonly number[]
  readonly totalTenantCount: number
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
        <p className={`max-w-prose text-xs ${textColor('ink-subtle')}`}>
          This anonymity is presentational rather than informational: the per-tenant tab, open to the same
          roles, already publishes each tenant's own deviation count and run count by name, so a reader
          willing to open every tenant's own view can work out which band each one falls into. Nothing below
          is confidential on its own; what this tab withholds is the convenience of the name attached.
        </p>
        <details data-control-id="tenant-metrics-role-disclosure" className="text-xs">
          <summary className={`cursor-pointer ${textColor('ink-muted')}`}>Why every console role sees this tab</summary>
          <p className={`mt-1 max-w-prose ${textColor('ink-muted')}`}>
            This platform's own specification describes who reads this comparative in more than one place.
            A cross-module summary marks the Platform Engineer unavailable for this whole module, while this
            module's own detailed permission table — and the very condition footnoted onto that summary's
            own row — both point to the Platform Engineer and Support reading it, anonymised, on the same
            terms as the root and the Admin. A separate, narrower passage about Support's normal working
            mode says cross-tenant aggregates are unavailable to it. This console follows the module's own
            table and its own footnoted condition over that narrower passage, and grants all four platform
            roles this read — a client-delegated choice under APP-012, not a position the source settled.
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
              {tenantsWithHistory} of {totalTenantCount} tenants have a recorded run and a deviation rate to
              place in a band; the rest have no operational history yet and are counted in neither band —
              a tenant with no runs has no deviation rate, not a deviation rate of zero.
            </p>
          </>
        )}
      </section>
    </>
  )
}
