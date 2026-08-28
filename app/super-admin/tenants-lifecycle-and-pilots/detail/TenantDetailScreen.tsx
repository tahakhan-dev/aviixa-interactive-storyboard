'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import {
  AppShell,
  ConfirmDialog,
  DataTable,
  FreshnessStamp,
  ObjectPage,
  RequireSession,
  StatusPill,
  Timeline,
  bg,
  borderColor,
  colorVar,
  radiusClass,
  statusVar,
  textColor,
  useAccessContext,
  useRepository,
  useRepositoryQuery,
  useStore,
  type DataTableColumn,
  type ObjectPageTab,
  type ProductSession,
  type StatusToken,
  type TimelineEntry,
} from '@/ui/product'
import { LiveRegion } from '@/ui/primitives'
import { evaluateAccess } from '@/policy/evaluate'
import { roleById } from '@/domain/roles'
import type { AccessContext, Query, Repository, RowOf } from '@/data/repository'
import { saModuleById } from '@/surfaces/sa/modules'

/**
 * Task 6 (unit-01) — the tenant object page: Overview, People, Entitlements
 * and Audit tabs, plus the one lifecycle action this unit may honour
 * (`Activate`). Routing is the search-parameter shape ruled in
 * `page.tsx`'s own header, not `[tenantId]/`.
 *
 * FIX ROUND 1 (review IMPORTANT 2) — `Block` shipped in the first pass and
 * was REMOVED, not merely disabled: it wrote `lifecycle: 'archived'`, but
 * archival is a unit-10 state this unit's own brief forbids rendering.
 * See the removal's full reasoning beside `activateGate` below.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY `ObjectPage` SITS INSIDE `AppShell` WITH `AppShell`'S OWN
 * `title`/`breadcrumbs`/`actions` LEFT AT THEIR DEFAULTS
 * ─────────────────────────────────────────────────────────────────────────
 * `AppShell` renders its own `PageHeader` unconditionally
 * (`AppShell.tsx#chromeFor`'s three branches all do), and `ObjectPage` also
 * renders a `PageHeader` — this is this codebase's first real consumer of
 * `ObjectPage`, so no prior screen had to resolve what happens when both
 * wrap the same tree. Passing this screen's own title/breadcrumbs/actions
 * to `AppShell` (the pattern `TenantsScreen.tsx`/`OverviewScreen.tsx` use)
 * would print the tenant's name as an `<h1>` TWICE — once from `AppShell`,
 * once from `ObjectPage`, one nested inside the other.
 *
 * Resolution: `AppShell` is given no `title`/`breadcrumbs`/`actions` here,
 * so it falls back to its own documented default — the SURFACE's name,
 * "Super Admin Platform Console" (`src/domain/surfaces.ts`), identical on
 * every screen in this surface, functioning as stable app-level chrome.
 * `ObjectPage`'s header carries every real, page-specific fact: the
 * Module → Tenant breadcrumb, the tenant's own name as the one meaningful
 * `<h1>`, its status pill, freshness stamp, and the two lifecycle actions.
 * This is the pattern every future object-page screen in this surface
 * should reuse, not a one-off worked around here.
 */

const MODULE = saModuleById('MOD-SA-09')
const LIST_HREF = '/super-admin/tenants-lifecycle-and-pilots/'

type Tenant = RowOf<'tenants'>
type TenantLifecycle = Tenant['lifecycle']
type TenantTier = Tenant['tier']
type User = RowOf<'users'>
type UserStatus = User['status']
type AuditRow = RowOf<'audit'>
type Entitlement = RowOf<'entitlements'>
type FeatureControl = RowOf<'feature-controls'>

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

const TIER_LABEL: Readonly<Record<TenantTier, string>> = {
  starter: 'Starter',
  growth: 'Growth',
  enterprise: 'Enterprise',
}

const USER_STATUS_LABEL: Readonly<Record<UserStatus, string>> = {
  invited: 'Invited',
  active: 'Active',
  suspended: 'Suspended',
  removed: 'Removed',
}

const USER_STATUS_TONE: Readonly<Record<UserStatus, StatusToken>> = {
  invited: 'pending',
  active: 'ok',
  suspended: 'warn',
  removed: 'offline',
}

const FEATURE_LABEL: Readonly<Record<string, string>> = {
  'agent-builder': 'Agent Builder',
  'custom-report-builder': 'Custom Report Builder',
  'training-library': 'Training Library',
  'worker-shift-allocation': 'Worker-Shift allocation',
}

/** The `entitlements` featureKey the Overview tab's usage meter reads its ceiling from — the tier's real, seeded cap, never a hand-typed 99/199. */
const USAGE_FEATURE_KEY = 'worker-shift-allocation'

/**
 * Frozen source L2195 (tier framework, `[SoW Fact — §4.2.1, §1.7]`: three
 * Worker-Shift bands, Starter below 100, Growth 100–199, Enterprise 200 and
 * above) and L2197 (usage ladder, `[SoW Fact — §4.2.1]`: an 80% banner, a
 * 100% escalation, a burst tolerance to 125%, and a commercial-conversation
 * flag above 125%). A real, consumed `const` rather than a comment-only
 * citation — Task 4's own fix-round ruling is that `build-registries.mjs`
 * strips every comment before its identifier scan, so a citation that lives
 * only in a header comment is invisible to the coverage census. Every
 * branch of `usageBandFor` below reads these three numbers; nothing
 * hand-types 0.8/1/1.25 beside the logic they govern.
 */
const USAGE_LADDER = { banner: 0.8, escalation: 1, burstCeiling: 1.25 } as const

type UsageBand = 'below-banner' | 'banner' | 'escalation-burst' | 'commercial-flag'

function usageBandFor(ratio: number): UsageBand {
  if (ratio < USAGE_LADDER.banner) return 'below-banner'
  if (ratio < USAGE_LADDER.escalation) return 'banner'
  if (ratio < USAGE_LADDER.burstCeiling) return 'escalation-burst'
  return 'commercial-flag'
}

const USAGE_BAND_TONE: Readonly<Record<UsageBand, StatusToken>> = {
  'below-banner': 'ok',
  banner: 'warn',
  'escalation-burst': 'danger',
  'commercial-flag': 'conflict',
}

const USAGE_BAND_LABEL: Readonly<Record<UsageBand, string>> = {
  'below-banner': 'Below the 80% usage banner threshold.',
  banner: 'Past 80% of the ceiling — the in-product usage banner is active.',
  'escalation-burst':
    'Past 100% of the ceiling — in the burst band. The floor keeps running; usage is not blocked.',
  'commercial-flag':
    'Past 125% of the ceiling — flagged for the client’s commercial conversation, held outside the platform.',
}

/** Platform time, never wall time — same shape as `OverviewScreen.tsx`'s own helper; no shared date-formatting module exists yet for `src/ui/product/**` to reuse (that file's own header records the same gap). */
function formatPlatformTime(ms: number): string {
  const formatted = new Date(ms).toLocaleString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${formatted} platform time`
}

function formatDate(iso: string): string {
  const ms = Date.parse(iso)
  if (Number.isNaN(ms)) return 'Unknown'
  return new Date(ms).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' })
}

interface TenantDetailSnapshot {
  readonly tenants: readonly Tenant[]
  readonly roleGrants: readonly RowOf<'role-grants'>[]
  readonly auditRows: readonly AuditRow[]
  readonly entitlements: readonly Entitlement[]
  readonly featureControls: readonly FeatureControl[]
}

/**
 * CONTRACT (see `useRepositoryQuery`'s own header, and `OverviewScreen.tsx`'s
 * identical framing): a pure function of `(repository, ctx)` alone. The
 * tenant this screen is ABOUT comes from a client-side search parameter,
 * which is not part of either argument — so this selector fetches every
 * collection's FULL contents, and every tenant-scoped filter below (which
 * tenant, which users, which audit rows) runs in plain render code, outside
 * this cached selector, exactly as `sinceByTenantId`/`selectedTenant` do in
 * `OverviewScreen.tsx`. Folding the tenant id into the selector itself would
 * cache stale, wrong-tenant data the moment a reader followed a second
 * `?tenant=` link without a full page reload — the cache keys on
 * `(repository, ctx, version)`, never on a value this hook's caller closes
 * over. `users` is deliberately NOT part of this combined snapshot — it is
 * fetched as its own `useRepositoryQuery` call below (`usersQuery`) so the
 * People tab can hand `DataTable` a genuine, live `Query<User>` (via
 * `.where()`) rather than a hand-rolled stand-in that would have to
 * reimplement `QueryImpl`'s filter-then-page ordering itself.
 */
function readSnapshot(repository: Repository, ctx: AccessContext): TenantDetailSnapshot {
  return {
    tenants: repository.list('tenants', ctx).all(),
    roleGrants: repository.list('role-grants', ctx).all(),
    auditRows: repository.list('audit', ctx).all(),
    entitlements: repository.list('entitlements', ctx).all(),
    featureControls: repository.list('feature-controls', ctx).all(),
  }
}

export function TenantDetailScreen() {
  return (
    <RequireSession signInHref="/super-admin/sign-in/">
      {(session) => <TenantDetailGate session={session} />}
    </RequireSession>
  )
}

/**
 * Reads the `tenant` search parameter and resolves it against the
 * repository. A missing parameter and an unknown id take the SAME honest
 * "no such tenant" branch — neither crashes, neither blanks the page, and
 * neither redirects away without saying what happened (brief's own
 * requirement, and the same "say what happened" standard `TenantsScreen.tsx`
 * applies to its own empty state).
 */
function TenantDetailGate({ session }: { readonly session: ProductSession }) {
  const searchParams = useSearchParams()
  const tenantIdParam = searchParams.get('tenant')
  const snapshot = useRepositoryQuery(readSnapshot)
  // A separate call, same reasoning as `OverviewScreen.tsx`'s own
  // `attentionQuery`: `DataTable` needs a live `Query<User>` to run its own
  // sort/page over, and this selector stays a pure `(r, ctx)` function —
  // the tenant-scoping `.where()` happens outside it, in `TenantDetailBody`.
  const usersQuery = useRepositoryQuery((r, c) => r.list('users', c))

  const tenant = tenantIdParam === null ? null : (snapshot.tenants.find((t) => t.id === tenantIdParam) ?? null)

  if (tenant === null) {
    return <TenantNotFound session={session} requestedId={tenantIdParam} />
  }

  return <TenantDetailBody session={session} tenant={tenant} snapshot={snapshot} usersQuery={usersQuery} />
}

function TenantNotFound({
  session,
  requestedId,
}: {
  readonly session: ProductSession
  readonly requestedId: string | null
}) {
  return (
    <AppShell surface="SURF-SA" session={session}>
      <div className={`${radiusClass('lg')} border ${borderColor('border')} ${bg('raised')} p-6`}>
        <h2 className={`text-lg font-semibold ${textColor('ink')}`}>No such tenant</h2>
        <p className={`mt-2 text-sm ${textColor('ink-muted')}`}>
          {requestedId === null
            ? 'This page needs a tenant to show and none was named in the address.'
            : `"${requestedId}" does not match any tenant this session can read.`}
        </p>
        <Link
          href={LIST_HREF}
          data-control-id="tenant-detail-not-found-back"
          className={`mt-4 inline-block ${radiusClass('md')} ${bg('accent')} px-4 py-2 text-sm font-medium text-[var(--accent-ink)]`}
        >
          Back to the tenant list
        </Link>
      </div>
    </AppShell>
  )
}

function TenantDetailBody({
  session,
  tenant,
  snapshot,
  usersQuery,
}: {
  readonly session: ProductSession
  readonly tenant: Tenant
  readonly snapshot: TenantDetailSnapshot
  readonly usersQuery: Query<User>
}) {
  const ctx = useAccessContext()
  const repository = useRepository()
  const store = useStore()
  const nowMs = store.clock.now()

  const [activeTabId, setActiveTabId] = useState('overview')
  const [confirmingActivate, setConfirmingActivate] = useState(false)
  const [writeBusy, setWriteBusy] = useState(false)
  const [writeFeedback, setWriteFeedback] = useState<{ readonly tone: StatusToken; readonly message: string } | null>(
    null,
  )

  const allUsers = usersQuery.all()
  const tenantUsersQuery = usersQuery.where((u) => u.tenantId === tenant.id)
  const tenantUsers = tenantUsersQuery.all()
  const usersById = new Map(allUsers.map((u) => [u.id, u] as const))
  const roleGrantByUserId = new Map(snapshot.roleGrants.map((rg) => [rg.userId, rg] as const))

  const tenantAdmins = tenantUsers
    .filter((u) => u.role === 'TENANT_ADMIN')
    .slice()
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
  const firstTenantAdmin = tenantAdmins[0] ?? null
  const administratorAccepted = firstTenantAdmin !== null && firstTenantAdmin.status === 'active'

  /**
   * `SB-SA-09` (frozen source L44984): "`SCR-SA-15` is the tenant detail
   * page with its eight tabs. The Overview tab carries the lifecycle
   * actions as clearly separated controls with confirmation weight
   * proportional to consequence" — a tier assignment is a single
   * confirmation; `Activate` sits at that same, lightest weight (unit 10's
   * suspensions are the heavier, typed-confirmation and critical-class
   * actions this unit does not build). `allowedObjectStates` is the
   * evaluator's own object-state stage (spec §3.4 stage 7) — "valid only
   * from invited" is enforced by the real evaluator, not a hand-written
   * `tenant.lifecycle === 'invited'` check.
   *
   * `resourceTenant` is deliberately NOT declared below. `evaluateAccess`'s
   * feature-and-suspension stage refuses any action naming a resource
   * tenant that is `PROVISIONING` (which `invited` maps to,
   * `repository.ts#TENANT_LIFECYCLE_MAP`) or `ARCHIVED` — exactly the state
   * `Activate` exists to act ON. Declaring `resourceTenant` here would make
   * `Activate` permanently unreachable for the only tenants it is for, the
   * same trap `TenantsScreen.tsx`'s `create-tenant` decision avoids for the
   * identical reason (no tenant resource exists yet to name). This is a
   * platform-level decision about the tenant's OWN record, not an operation
   * reaching INTO an already-provisioned tenant.
   *
   * FIX ROUND 1 (review IMPORTANT 2) — `Block` is REMOVED, not merely
   * disabled. It shipped writing `lifecycle: 'archived'`, but archival is
   * unit 10's state to introduce, and this unit's own brief says a reader
   * must not meet a control it cannot honour. The closed, eight-state
   * `TenantLifecycle` enum has no "declined"/"blocked" value distinct from
   * `archived` — that gap is real, not a naming choice this fix can paper
   * over, so the honest answer is that this unit cannot ship the action at
   * all, not that it should reuse the wrong state. Blocking, unblocking and
   * controlled restoration are one source workflow (`FEAT-SA-09-02`) and
   * belong together in unit 10, where the suspension states they actually
   * use are already in scope. Recorded here for unit 10 rather than left
   * for that unit to rediscover the same enum gap.
   */
  const activateGate = evaluateAccess(
    {
      action: 'activate-tenant',
      allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN'],
      objectState: tenant.lifecycle,
      allowedObjectStates: ['invited'],
      sourceRefs: ['SB-SA-09', 'SB-31-05'],
    },
    ctx,
  )

  /**
   * `invited -> pilot OR active` (frozen source L45004's state diagram; the
   * numbered onboarding workflow's step 7, L75565, is the `active` arm:
   * "The platform activates the account and transitions the tenant record
   * to active, committing both with their audit events in the same
   * transaction"). `Tenant.isPilot` is the real, seeded field this build
   * already carries for exactly this fork (`FEAT-SA-09-04`: "invitation-only
   * pilots, functionally identical to paying tenants") — never a second,
   * independently-typed guess at which arm a given tenant takes.
   */
  const nextLifecycleOnActivate: TenantLifecycle = tenant.isPilot ? 'pilot' : 'active'

  const canActivate = activateGate.outcome === 'allowed' && administratorAccepted
  // Plain language only in every rendered reason below — no requirement
  // identifier or line locator as page text (global constraint); the
  // sources that govern this condition are cited in this function's own
  // comments and in `activateGate`'s `sourceRefs`, not on screen.
  const activateDisabledReason =
    activateGate.outcome !== 'allowed'
      ? activateGate.explanation
      : administratorAccepted
        ? null
        : firstTenantAdmin === null
          ? 'This tenant has no administrator yet, so there is no invitation to accept.'
          : `Activation is not available until ${firstTenantAdmin.displayName} accepts the invitation and completes identity proof.`

  async function handleConfirmedActivate() {
    setWriteBusy(true)
    const result = await repository.update('tenants', tenant.id, { lifecycle: nextLifecycleOnActivate }, ctx)
    setWriteBusy(false)
    setConfirmingActivate(false)
    if (result.ok) {
      setWriteFeedback({ tone: 'ok', message: `${tenant.name} is now ${LIFECYCLE_LABEL[nextLifecycleOnActivate]}.` })
    } else {
      setWriteFeedback({ tone: 'danger', message: result.explain })
    }
  }

  const overviewTab = renderOverviewTab({ tenant, snapshot })
  const peopleTab = renderPeopleTab({ tenant, tenantUsersQuery, roleGrantByUserId, firstTenantAdmin })
  const entitlementsTab = renderEntitlementsTab({ tenant, snapshot })
  const auditTab = renderAuditTab({ tenant, snapshot, usersById })

  const tabs: readonly ObjectPageTab[] = [
    { id: 'overview', label: 'Overview', content: overviewTab },
    { id: 'people', label: 'People', content: peopleTab },
    { id: 'entitlements', label: 'Entitlements', content: entitlementsTab },
    { id: 'audit', label: 'Audit', content: auditTab },
  ]

  return (
    <AppShell surface="SURF-SA" session={session}>
      {writeFeedback ? (
        <LiveRegion>
          <p
            data-control-id="tenant-detail-write-feedback"
            className={`mb-4 ${radiusClass('md')} border ${borderColor('border')} p-3 text-sm`}
            style={{ color: statusVar(writeFeedback.tone) }}
          >
            {writeFeedback.message}
          </p>
        </LiveRegion>
      ) : null}

      <ObjectPage
        breadcrumbs={[{ label: MODULE.name, href: LIST_HREF }, { label: tenant.name }]}
        title={tenant.name}
        status={<StatusPill tone={LIFECYCLE_TONE[tenant.lifecycle]} label={LIFECYCLE_LABEL[tenant.lifecycle]} />}
        freshness={<FreshnessStamp asOfLabel={formatPlatformTime(nowMs)} />}
        actions={
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              data-control-id="tenant-detail-activate"
              disabled={!canActivate}
              aria-describedby={activateDisabledReason ? 'tenant-detail-activate-reason' : undefined}
              onClick={() => setConfirmingActivate(true)}
              className={
                canActivate
                  ? `${radiusClass('md')} ${bg('accent')} px-4 py-2 text-sm font-medium text-[var(--accent-ink)]`
                  : `cursor-not-allowed ${radiusClass('md')} border ${borderColor('border')} ${bg('sunken')} px-4 py-2 text-sm font-medium ${textColor('ink-subtle')}`
              }
            >
              Activate
            </button>
            {activateDisabledReason ? (
              <p id="tenant-detail-activate-reason" className={`max-w-xs text-right text-xs ${textColor('ink-muted')}`}>
                {activateDisabledReason}
              </p>
            ) : null}
          </div>
        }
        tabs={tabs}
        activeTabId={activeTabId}
        onTabChange={setActiveTabId}
      />

      <ConfirmDialog
        open={confirmingActivate}
        controlId="tenant-detail-lifecycle-confirm"
        title={`Activate ${tenant.name}`}
        affectedObjects={[{ id: tenant.id, label: tenant.name }]}
        resultingState={{
          subject: 'Tenant lifecycle',
          from: LIFECYCLE_LABEL[tenant.lifecycle],
          to: LIFECYCLE_LABEL[nextLifecycleOnActivate],
        }}
        confirmLabel="Activate"
        busy={writeBusy}
        onConfirm={handleConfirmedActivate}
        onCancel={() => setConfirmingActivate(false)}
      />
    </AppShell>
  )
}

/* ────────────────────────────────────────────────────────────────────── *
 * Overview tab
 * ────────────────────────────────────────────────────────────────────── */

function renderOverviewTab({
  tenant,
  snapshot,
}: {
  readonly tenant: Tenant
  readonly snapshot: TenantDetailSnapshot
}) {
  const tierEntitlement = snapshot.entitlements.find(
    (e) => e.tier === tenant.tier && e.featureKey === USAGE_FEATURE_KEY,
  )
  const cap = tierEntitlement?.cap ?? null
  const ratio = cap !== null && cap > 0 ? tenant.workerShiftsThisMonth / cap : null
  const band = ratio === null ? null : usageBandFor(ratio)
  // Visual domain is 0%-150% of the ceiling: the highest named threshold
  // (125%) plus headroom, so the fill never looks maxed-out at exactly the
  // commercial-flag line.
  const fillPercent = ratio === null ? 0 : Math.min(ratio / 1.5, 1) * 100

  return (
    <div className="flex flex-col gap-6">
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        <div>
          <dt className={textColor('ink-muted')}>Lifecycle</dt>
          <dd className={textColor('ink')}>
            <StatusPill tone={LIFECYCLE_TONE[tenant.lifecycle]} label={LIFECYCLE_LABEL[tenant.lifecycle]} />
          </dd>
        </div>
        <div>
          <dt className={textColor('ink-muted')}>Tier</dt>
          <dd className={textColor('ink')}>{TIER_LABEL[tenant.tier]}</dd>
        </div>
        <div>
          <dt className={textColor('ink-muted')}>Pilot</dt>
          <dd className={textColor('ink')}>
            {tenant.isPilot ? 'Yes' : 'No'}
            {tenant.isPilot ? (
              // FEAT-SA-09-04 names 60/90-day pilots, but `Tenant` carries no
              // expiry field and no separate pilot record exists in this
              // repository — an honest "not tracked" note, not a fabricated
              // date, and never a requirement identifier printed as page
              // text (global constraint).
              <span className={`ml-2 text-xs ${textColor('ink-subtle')}`}>Pilot expiry is not tracked.</span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className={textColor('ink-muted')}>Regulated mode</dt>
          <dd className={textColor('ink')}>{tenant.regulatedMode ? 'On' : 'Off'}</dd>
        </div>
        <div>
          <dt className={textColor('ink-muted')}>Locale</dt>
          <dd className={textColor('ink')}>{tenant.primaryLocale === 'en' ? 'English' : 'Español'}</dd>
        </div>
        <div>
          <dt className={textColor('ink-muted')}>Onboarded</dt>
          <dd className={textColor('ink')}>{formatDate(tenant.onboardedAt)}</dd>
        </div>
        <div>
          <dt className={textColor('ink-muted')}>Legal hold</dt>
          <dd className={textColor('ink')}>{tenant.legalHold ? 'Yes' : 'No'}</dd>
        </div>
        {tenant.archivedAt !== null ? (
          <div>
            <dt className={textColor('ink-muted')}>Archived</dt>
            <dd className={textColor('ink')}>{formatDate(tenant.archivedAt)}</dd>
          </div>
        ) : null}
      </dl>

      <div>
        <h3 className={`text-sm font-semibold ${textColor('ink')}`}>Usage against the tier ceiling</h3>
        <p className={`mt-1 text-sm ${textColor('ink')}`}>
          {tenant.workerShiftsThisMonth.toLocaleString()} Worker-Shifts this month
          {cap !== null ? ` of a ${cap.toLocaleString()} ceiling (${TIER_LABEL[tenant.tier]})` : ''}
        </p>
        {cap === null ? (
          <p className={`mt-1 text-sm ${textColor('ink-muted')}`}>
            {TIER_LABEL[tenant.tier]} carries no consumption ceiling in this tier's entitlement record — usage is
            tracked without a percentage threshold.
          </p>
        ) : (
          <>
            <div
              role="progressbar"
              data-control-id="tenant-detail-usage-meter"
              aria-label={`Worker-Shift usage against the ${TIER_LABEL[tenant.tier]} ceiling`}
              // `aria-valuemax` matches the visible "X% of the ceiling" text
              // (a percentage of 100), not the 150%-wide VISUAL domain the
              // fill bar draws against — those are two different scales,
              // and a screen reader announcing the percentage against a
              // silent 150 would contradict the text sighted readers see.
              aria-valuenow={Math.round((ratio ?? 0) * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              className="mt-2 h-2.5 w-full max-w-md overflow-hidden rounded-full"
              style={{ backgroundColor: colorVar('sunken') }}
            >
              <div
                className="h-full rounded-full transition-[width]"
                style={{ width: `${fillPercent}%`, backgroundColor: statusVar(band ? USAGE_BAND_TONE[band] : 'ok') }}
              />
            </div>
            <p className={`mt-1 text-sm ${textColor('ink')}`}>
              {Math.round((ratio ?? 0) * 100)}% of the {TIER_LABEL[tenant.tier]} ceiling. {band ? USAGE_BAND_LABEL[band] : ''}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────── *
 * People tab
 * ────────────────────────────────────────────────────────────────────── */

function renderPeopleTab({
  tenant,
  tenantUsersQuery,
  roleGrantByUserId,
  firstTenantAdmin,
}: {
  readonly tenant: Tenant
  readonly tenantUsersQuery: Query<User>
  readonly roleGrantByUserId: ReadonlyMap<string, RowOf<'role-grants'>>
  readonly firstTenantAdmin: User | null
}) {
  const columns: readonly DataTableColumn<User>[] = [
    {
      key: 'name',
      header: 'Name',
      sortValue: (u) => u.displayName,
      render: (u) => <span className={textColor('ink')}>{u.displayName}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      // "their roles from role-grants" (brief) — the role-grant is the
      // authoritative source when one exists; `user.role` is the fallback
      // for the handful of seeded users (mostly the four platform roles,
      // which carry no site/area scope to grant) with no matching row.
      render: (u) => roleById(roleGrantByUserId.get(u.id)?.role ?? u.role).name,
    },
    {
      key: 'status',
      header: 'Status',
      render: (u) => <StatusPill tone={USER_STATUS_TONE[u.status]} label={USER_STATUS_LABEL[u.status]} />,
    },
    // No productivity, ranking or pace figure of any kind against a worker
    // row — master prompt §15.2. There is deliberately no fifth column here.
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className={`${radiusClass('lg')} border ${borderColor('border')} ${bg('raised')} p-3`}>
        <h3 className={`text-sm font-semibold ${textColor('ink')}`}>First Tenant Admin</h3>
        {firstTenantAdmin === null ? (
          <p className={`mt-1 text-sm ${textColor('ink-muted')}`}>This tenant has no administrator yet.</p>
        ) : (
          <p className={`mt-1 text-sm ${textColor('ink')}`}>
            {firstTenantAdmin.displayName} —{' '}
            {firstTenantAdmin.status === 'active' ? (
              <span>accepted the invitation</span>
            ) : (
              <span>invitation sent, not yet accepted</span>
            )}
          </p>
        )}
      </div>

      <DataTable
        caption={`${tenant.name}'s users`}
        columns={columns}
        query={tenantUsersQuery}
        rowId={(u) => u.id}
        emptyState={{
          title: 'This tenant has no users yet.',
          whatCreatesIt: 'A user appears here once the platform team seeds the first Tenant Admin, or once that admin adds more accounts.',
        }}
      />
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────── *
 * Entitlements tab
 * ────────────────────────────────────────────────────────────────────── */

function renderEntitlementsTab({
  tenant,
  snapshot,
}: {
  readonly tenant: Tenant
  readonly snapshot: TenantDetailSnapshot
}) {
  const tierEntitlements = snapshot.entitlements.filter((e) => e.tier === tenant.tier)
  const featureControlByKey = new Map(snapshot.featureControls.map((fc) => [fc.featureKey, fc] as const))

  return (
    <div className="flex flex-col gap-4">
      <p className={`text-sm ${textColor('ink-muted')}`}>
        Entitlements are read-only here. The platform floor is what the tier and the platform-wide default
        allow; the tenant's desired value is this specific tenant's recorded opt-in or opt-out, where one has
        been recorded.
      </p>
      <div className={`overflow-x-auto ${radiusClass('lg')} border ${borderColor('border')}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className={`border-b ${borderColor('border')} ${bg('raised')} text-left`}>
              <th className={`p-2 font-medium ${textColor('ink-muted')}`}>Feature</th>
              <th className={`p-2 font-medium ${textColor('ink-muted')}`}>Platform floor</th>
              <th className={`p-2 font-medium ${textColor('ink-muted')}`}>Tenant's desired value</th>
            </tr>
          </thead>
          <tbody>
            {tierEntitlements.map((e) => {
              const featureControl = featureControlByKey.get(e.featureKey)
              const desired = featureControl?.tenantDesired[tenant.id]
              return (
                <tr key={e.id} className={`border-b ${borderColor('border')} last:border-b-0`}>
                  <td className={`p-2 ${textColor('ink')}`}>{FEATURE_LABEL[e.featureKey] ?? e.featureKey}</td>
                  <td className={`p-2 ${textColor('ink')}`}>
                    {e.included ? 'Included' : 'Not included'}
                    {e.cap !== null ? ` — cap ${e.cap.toLocaleString()}` : ''}
                    {featureControl ? (
                      <span className={`block text-xs ${textColor('ink-subtle')}`}>
                        Platform default: {featureControl.platformDefault ? 'On' : 'Off'}
                        {featureControl.globallyDisabled ? ' — globally disabled, no tenant can re-enable it' : ''}
                      </span>
                    ) : null}
                  </td>
                  <td className={`p-2 ${textColor('ink')}`}>
                    {featureControl === undefined
                      ? 'Not applicable — no per-tenant toggle exists for this feature.'
                      : desired === undefined
                        ? 'Not recorded — the platform default applies.'
                        : desired
                          ? 'On'
                          : 'Off'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────── *
 * Audit tab
 * ────────────────────────────────────────────────────────────────────── */

function renderAuditTab({
  tenant,
  snapshot,
  usersById,
}: {
  readonly tenant: Tenant
  readonly snapshot: TenantDetailSnapshot
  readonly usersById: ReadonlyMap<string, User>
}) {
  const tenantAuditRows = snapshot.auditRows
    .filter((a) => a.tenantId === tenant.id)
    .slice()
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))

  if (tenantAuditRows.length === 0) {
    return (
      <div className={`${radiusClass('lg')} border ${borderColor('border')} ${bg('raised')} p-6`}>
        <p className={`text-sm ${textColor('ink')}`}>No activity has been recorded for this tenant yet.</p>
        <p className={`mt-1 text-sm ${textColor('ink-muted')}`}>
          An entry appears here the first time an action is taken for this tenant.
        </p>
      </div>
    )
  }

  // Actor, effective role, action, result and denial reason are the five
  // facts the brief names. `Timeline`'s own `TimelineEntry` shape carries
  // actor/action/result as distinct fields; effective role is folded into
  // the actor label and the denial reason into the action text (both
  // stated explicitly, never left for a reader to infer) rather than
  // widening a shared, five-surface component's type for one screen.
  const entries: readonly TimelineEntry[] = tenantAuditRows.map((a) => {
    const actorUser = usersById.get(a.actorId)
    const actorLabel = actorUser ? actorUser.displayName : a.actorId
    const roleLabel = roleById(a.effectiveRole).name
    return {
      id: a.id,
      correlationId: a.correlationId,
      kind: 'audit',
      actor: `${actorLabel} — ${roleLabel}`,
      action: a.denialReason ? `${a.action} — denied: ${a.denialReason}` : a.action,
      result: a.result,
      occurredAtLabel: formatPlatformTime(Date.parse(a.occurredAt)),
    }
  })

  return <Timeline controlId="tenant-detail-audit-timeline" entries={entries} />
}
