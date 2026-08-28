'use client'

import Link from 'next/link'
import {
  AppShell,
  DataTable,
  RequireSession,
  StatusPill,
  bg,
  borderColor,
  radiusClass,
  textColor,
  useAccessContext,
  useRepositoryQuery,
  type DataTableColumn,
  type FilterDef,
  type ProductSession,
  type StatusToken,
} from '@/ui/product'
import { evaluateAccess } from '@/policy/evaluate'
import type { RowOf } from '@/data/repository'
import { saModuleById } from '@/surfaces/sa/modules'

/**
 * Task 4 (unit-01) — the platform's tenant registry: search, filter, sort
 * and pagination over the whole tenant population. Replaces the previous
 * 1,049-line document-style body (SCR-SA-14/SCR-SA-15 combined into one
 * file, a screen-state radio group as page furniture, seven prose sections
 * of "absent by rule"/"unspecified in source" bullet lists) with a real
 * list screen. `SCR-SA-15` (tenant DETAIL) is a separate route Task 6
 * builds next (`[tenantId]/`) — this file is `SCR-SA-14`, the list, only.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * LOCATOR RELOCATION — every identifier the outgoing screen printed as page
 * text, and where the fact it named now lives. (Report carries this same
 * table for the reconciliation sweep.)
 * ─────────────────────────────────────────────────────────────────────────
 *  - D1, SCR-SA-14, SCR-SA-15 (L42806, L42807), SB-SA-09 (L44984),
 *    SB-31-01/02/05 (L75604, L75309), SB-SA-TENANT-01 (L117966), and the
 *    "second numbering scheme" note (SCR-SA-11/SCR-SA-12) — screen
 *    annotations, never route keys (D1); this route
 *    (`/super-admin/tenants-lifecycle-and-pilots/`) IS SCR-SA-14. Carried as
 *    this comment, never rendered as page text.
 *  - L52383, L57245 ("headline usage… a count of Worker-Shifts in the
 *    tenant-month, a billing unit on a commercial ledger; nothing beneath
 *    it on this console") — realised as the "Worker-Shifts this month"
 *    column below, `Tenant.workerShiftsThisMonth` read straight off the
 *    repository row, never a second derived figure.
 *  - AC-SA-01-03, FB-SA-01 ("a missing measure is never a zero or a blank")
 *    — `workerShiftsThisMonth` is `z.number().int().nonnegative()`
 *    (`@/data/schemas/platform#Tenant`) and always populated at seed time;
 *    there is no "unavailable usage" case for this column to render, unlike
 *    the outgoing screen's fixture rows which fabricated one. Noted so a
 *    reviewer can see the case was considered, not silently dropped.
 *  - L47767, D16, L42742, L42979, L42715 ("the one control the source gives
 *    to all four console roles is a filter on the tenant list") — realised
 *    as the lifecycle/tier filters below, read by whichever of the four
 *    platform roles opens this route (D16: a module-level `roles_allowed`
 *    list is authoritative nowhere; every one of the four reaches this
 *    module's nav entry, `AppShell.tsx#chromeFor`'s SURF-SA branch).
 *  - UNSPECIFIED_IN_SOURCE (old `fixtures.ts`): "No search, sort,
 *    column-chooser or saved-view control is defined for the tenant list…
 *    No bulk action of any kind is defined over the tenant list." This is
 *    the load-bearing fact for two decisions here: search/sort/pagination
 *    are NOT claimed as source-authorised controls — they are `DataTable`'s
 *    own standard affordance, the same product-wide component the Overview
 *    dashboard's "needs attention" table already uses (Task 3) and every
 *    list screen in this rebuild migrates onto (`DataTable.tsx`'s own
 *    header: "the version every list screen … migrates to"). Bulk
 *    selection, by contrast, IS something the source speaks to directly —
 *    and it says none exists — so this screen ships no `selection` prop at
 *    all rather than inventing an action to fill the affordance.
 *  - L75180, L52400, L52401 (New Tenant: allowed roles, and the Platform
 *    Engineer's explicit read-only carve-out) — realised as the "Create
 *    tenant" primary action's `evaluateAccess` gate below.
 *  - AC-SA-09-01 ("no public self-signup path exists; the client's platform
 *    team creates one from New Tenant") — realised as the empty-state copy
 *    for the (structurally present, not independently reachable against
 *    this seed's 28 real rows) "no tenants at all" state.
 *  - Everything under the outgoing screen's own "Lifecycle transitions",
 *    "Lifecycle actions", "Compliance suspension", "Suspension command
 *    channel", "Tenant detail" (tabs), and "Absent by rule" sections is
 *    DETAIL-page and lifecycle-ACTION content, not list content — carried
 *    forward, not dropped, to Task 6 (`[tenantId]/TenantDetail.tsx`), which
 *    is this unit's very next task and owns every one of those locators.
 *  - The role-switcher `<Select>` and the screen-state radio group the
 *    outgoing file rendered as page furniture are gone outright: this
 *    build reads the REAL signed-in role from `useAccessContext()`
 *    (Task 1), never a view-switcher standing in for one, and loading/
 *    empty/error states are `DataTable`'s own honest empty-state markup and
 *    `RequireSession`'s loading gate (Task 3), not a thirteen-member
 *    enumeration rendered as a dropdown.
 */

const MODULE = saModuleById('MOD-SA-09')

type Tenant = RowOf<'tenants'>
type TenantLifecycle = Tenant['lifecycle']
type TenantTier = Tenant['tier']

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

const LIFECYCLE_ORDER: readonly TenantLifecycle[] = [
  'invited',
  'pilot',
  'active',
  'soft-suspended',
  'hard-suspended',
  'compliance-suspended',
  'pending-downgrade',
  'archived',
]
const TIER_ORDER: readonly TenantTier[] = ['starter', 'growth', 'enterprise']

/** Platform time, never wall time — reused verbatim from `OverviewScreen`'s
 *  own helper of the same name/shape rather than redeclared with different
 *  formatting; kept local (not exported from either file) because Task 9's
 *  brief has no shared `src/ui/product/**` date-formatting module yet — the
 *  same "no shared helper exists so each screen declares its own" state
 *  `OverviewScreen.tsx`'s header comment already accepts for this build. */
function formatOnboarded(iso: string): string {
  const ms = Date.parse(iso)
  if (Number.isNaN(ms)) return 'Unknown'
  return new Date(ms).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' })
}

/**
 * §8.6.1's fixture-adequacy rule needs three genuinely distinct pages
 * (first, middle, last-partial) over a REALISTIC tenant population.
 * `DataTable`'s own default (`pageSize = 20`) would give this 28-row
 * population exactly two pages (20 + 8) — a first and a last, no middle —
 * which cannot exercise a middle page at all. Raising the tenant count
 * further to force a third page at the default size would recreate exactly
 * the unrealistic population the seed ruling rejected (one row per
 * CUSTOMER; a real platform at this stage has dozens, not hundreds, of
 * tenants). `pageSize` is a per-screen prop `DataTable` already exposes for
 * precisely this kind of call; 10 turns 28 rows into three real pages
 * (10 + 10 + 8) without inflating the seed.
 */
const TENANT_LIST_PAGE_SIZE = 10

export function TenantsScreen() {
  return (
    <RequireSession signInHref="/super-admin/sign-in/">
      {(session) => <TenantRegistry session={session} />}
    </RequireSession>
  )
}

function TenantRegistry({ session }: { readonly session: ProductSession }) {
  const ctx = useAccessContext()
  // Pure `(repository, ctx)` selector per `useRepositoryQuery`'s contract —
  // `DataTable` runs its own `.where()`/sort/page over this `Query<Tenant>`,
  // so nothing time-dependent or component-state-dependent belongs inside
  // this selector (see `OverviewScreen.tsx`'s header for why that matters:
  // the cache keys on `(repository, ctx, version)`, never on anything a
  // caller closes over).
  const tenantsQuery = useRepositoryQuery((r, c) => r.list('tenants', c))

  /**
   * L75180, L52400: New Tenant is held by the Root Super Admin and the
   * Admin. L52401: the Platform Engineer sees the tenant list read-only and
   * may not create a tenant; Support holds read access for support work
   * alone and is not named on the control either. `allowedRoles` below is
   * the real evaluator, not a hand-written `role === 'ADMIN'` check — see
   * `OverviewScreen.tsx`'s identical pattern for the "open full record"
   * control and the same reasoning (a hand-rolled check is the thing this
   * build's own policy layer exists to replace).
   */
  const createDecision = evaluateAccess(
    { action: 'create-tenant', allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN'], sourceRefs: ['L75180', 'L52400'] },
    ctx,
  )

  const columns: readonly DataTableColumn<Tenant>[] = [
    {
      key: 'name',
      header: 'Tenant',
      sortValue: (t) => t.name,
      render: (t) => (
        <span className="flex flex-col">
          <span className={`font-medium ${textColor('ink')}`}>{t.name}</span>
          <span className={`text-xs ${textColor('ink-subtle')}`}>{t.id}</span>
        </span>
      ),
    },
    {
      key: 'lifecycle',
      header: 'Lifecycle',
      render: (t) => <StatusPill tone={LIFECYCLE_TONE[t.lifecycle]} label={LIFECYCLE_LABEL[t.lifecycle]} />,
    },
    {
      key: 'tier',
      header: 'Tier',
      render: (t) => TIER_LABEL[t.tier],
    },
    {
      key: 'pilot',
      header: 'Pilot',
      render: (t) => (t.isPilot ? 'Yes' : 'No'),
    },
    {
      key: 'regulated',
      header: 'Regulated mode',
      render: (t) => (t.regulatedMode ? 'On' : 'Off'),
      hideBelow: 'lg',
    },
    {
      key: 'usage',
      header: 'Worker-Shifts this month',
      align: 'end',
      sortValue: (t) => t.workerShiftsThisMonth,
      render: (t) => t.workerShiftsThisMonth.toLocaleString(),
    },
    {
      key: 'onboarded',
      header: 'Onboarded',
      align: 'end',
      sortValue: (t) => Date.parse(t.onboardedAt),
      render: (t) => formatOnboarded(t.onboardedAt),
      hideBelow: 'lg',
    },
  ]

  const filters: readonly FilterDef<Tenant>[] = [
    {
      key: 'lifecycle',
      label: 'Lifecycle',
      options: LIFECYCLE_ORDER.map((l) => ({ value: l, label: LIFECYCLE_LABEL[l] })),
      match: (t, value) => t.lifecycle === value,
    },
    {
      key: 'tier',
      label: 'Tier',
      options: TIER_ORDER.map((tier) => ({ value: tier, label: TIER_LABEL[tier] })),
      match: (t, value) => t.tier === value,
    },
  ]

  return (
    <AppShell
      surface="SURF-SA"
      session={session}
      title={MODULE.name}
      breadcrumbs={[{ label: MODULE.name }]}
      actions={
        createDecision.outcome === 'allowed' ? (
          <Link
            href="/super-admin/tenants-lifecycle-and-pilots/create/"
            data-control-id="tenants-create"
            className={`${radiusClass('md')} ${bg('accent')} px-4 py-2 text-sm font-medium ${textColor('accent-ink')}`}
          >
            Create tenant
          </Link>
        ) : (
          <div className="flex max-w-xs flex-col items-end gap-1">
            <button
              type="button"
              disabled
              aria-describedby="tenants-create-reason"
              data-control-id="tenants-create"
              className={`cursor-not-allowed ${radiusClass('md')} border ${borderColor('border')} ${bg('sunken')} px-4 py-2 text-sm font-medium ${textColor('ink-subtle')}`}
            >
              Create tenant
            </button>
            <p id="tenants-create-reason" className={`text-right text-xs ${textColor('ink-muted')}`}>
              {createDecision.explanation} Tenant creation is held by the Root Super Admin and the
              Admin. The Platform Engineer sees the tenant list read-only and may not create a
              tenant; Support holds read access for support work alone.
            </p>
          </div>
        )
      }
    >
      <DataTable
        caption="Tenants"
        columns={columns}
        query={tenantsQuery}
        rowId={(t) => t.id}
        rowHref={(t) => `/super-admin/tenants-lifecycle-and-pilots/${t.id}`}
        search={{
          placeholder: 'Search by name or id',
          match: (t, q) => {
            const needle = q.toLowerCase()
            return t.name.toLowerCase().includes(needle) || t.id.toLowerCase().includes(needle)
          },
        }}
        filters={filters}
        pageSize={TENANT_LIST_PAGE_SIZE}
        emptyState={{
          title: 'There are no tenants yet.',
          whatCreatesIt:
            "The platform team creates one from Create tenant. No public self-signup path exists (AC-SA-09-01).",
        }}
      />
    </AppShell>
  )
}
