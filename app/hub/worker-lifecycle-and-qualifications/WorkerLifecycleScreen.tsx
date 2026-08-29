'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AppShell,
  DataTable,
  DetailDrawer,
  FieldShell,
  Form,
  ObjectPage,
  RequireSession,
  SelectField,
  StatusPill,
  TextField,
  Toaster,
  bg,
  borderColor,
  describedByFor,
  errorIdFor,
  hintIdFor,
  radiusClass,
  statusText,
  textColor,
  useAccessContext,
  useFieldBinding,
  useRepository,
  useRepositoryQuery,
  useStore,
  type DataTableColumn,
  type ObjectPageTab,
  type ProductSession,
  type StatusToken,
  type ToastItem,
} from '@/ui/product'
import { evaluateAccess, type AccessRequest } from '@/policy/evaluate'
import { deny } from '@/policy/decision'
import { scopeReferenceMessage } from '@/data/scope-reference'
import { User } from '@/data/schemas/platform'
import { Worker, Qualification } from '@/data/schemas/org'
import type {
  AccessContext,
  CreateTenantUserResult,
  Query,
  RecordQualificationResult,
  RowOf,
  WriteResult,
} from '@/data/repository'
import { roleById } from '@/domain/roles'
import { dohModuleById } from '@/surfaces/doh/modules'

/**
 * MOD-DOH-04 — Worker Lifecycle and Qualifications. `SCR-DOH-07` (worker
 * list) and `SCR-DOH-08` (worker record and qualifications), storyboard
 * `SB-DOH-016`. Owns `OBJ-DOH-WORKER` and `OBJ-DOH-QUAL`.
 *
 * Replaces the previous 2,318-line fixture-driven body (`./fixtures.ts`,
 * left in place, untouched and now unimported — the same disposition Task 1
 * and Task 2's own headers give an outgoing fixture file) with a real
 * Worker/Qualification register over the repository:
 * `useRepository()`/`useAccessContext()`/`useRepositoryQuery()`, the same
 * runtime pattern `ShiftManagementScreen.tsx`/`PermissionsScreen.tsx`
 * establish one screen over.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * LOCATOR RELOCATION — every identifier the outgoing screen file carried
 * (`FB-QUAL-005`, `L26059`, `L27437`, `L27470-L27484`, `L27602`, `L27610`,
 * `L28112`, `L28136`, `L52800`, `L64415`, `MOD-DOH-04`, `OBJ-DOH-CLEAR`,
 * `OBJ-DOH-QUAL`, `OBJ-DOH-WORKER`, `SB-DOH-016`, `SCR-DOH-07`, `SCR-DOH-08`,
 * `SCR-DOH-23`), grouped by the fact it named:
 * ─────────────────────────────────────────────────────────────────────────
 *  - `OBJ-DOH-WORKER`/`OBJ-DOH-QUAL` (L27437, the module's own object list)
 *    → the real `Worker`/`Qualification` schemas (`@/data/schemas/org.ts`),
 *    `status` enums enforced by the schema itself, never a hand-rolled copy.
 *  - "Create or edit a worker record" (L27470, `FUNC-DOH-04-1.1.1`) → this
 *    screen's own `WORKER_WRITE_REQUEST` and `repository.ts`'s new
 *    `createWorker` door (Task 4, this task) — Tenant Admin and Supervisor
 *    only. Quality Manager is `Explicitly prohibited` here, a fact this
 *    screen's own gate gets right the first time (see this file's own
 *    corrective note below).
 *  - "View a worker record" (L27471) → `VIEW_REQUEST` below — Tenant Admin,
 *    Supervisor, Quality Manager (all tenant-wide for now, the seed-scoping
 *    gap Tasks 1-3 already disclosed) and Read-only Auditor read-only.
 *    Worker's own "own record only" cell (the `DEC-WKRVIEW-001`/
 *    `WF-WKRVIEW-001` contradiction the design spec already flags as
 *    deferred) is NOT built — Worker reaches no Hub route at all (D11,
 *    established by every sibling Hub screen in this unit).
 *  - "Enter a qualification" (L27472, `FUNC-DOH-04-2.1.1`) → this screen's
 *    `QUALIFICATION_WRITE_REQUEST` and `repository.ts`'s `recordQualification`
 *    door — same Tenant-Admin/Supervisor-only floor, Quality Manager
 *    prohibited, Worker self-attestation absolutely impossible (the control
 *    is not rendered to a role that could never reach it).
 *  - "Record a recertification" (L27473) → NOT BUILT. Recording a NEW
 *    qualification through the same door already exists; a dedicated
 *    "supersede the prior expiry" flow with its own postdate-the-old
 *    validation is a real, disclosed gap left for a later task, not
 *    silently folded into plain entry.
 *  - "Back-date an issue date" (L27475) → the entry form's own
 *    `certificationDate`/`entryDate` pair, both real, independently-set
 *    fields (`Qualification` schema) — no rule enforces one against the
 *    other here, since the source states none for the entry path itself.
 *  - "Set the instruction-difficulty profile" (L27476... see the module's
 *    own worker-record row, distinct from the qualification row of the
 *    same number one module up) → the worker-fields form's own
 *    `instructionDifficultyProfile` `SelectField`, on the SAME door as
 *    every other Worker field (`createWorker`), not a separate control —
 *    the real schema carries no rule requiring it be written independently.
 *  - "Grant a clearance..." (L27479-L27482) → NOT BUILT. Clearance-granting
 *    is `WF-DOH-04-CLEARANCE`, a Client Command Center action the design
 *    spec explicitly defers out of this task. This screen shows the
 *    Qualification record a clearance would reference; it mints no
 *    `QualificationGrant` row.
 *  - "Archive a worker" / "Reactivate a departed worker" / "Bulk import
 *    workers" (L27478, L27484, and the module's own bulk-import row) → NOT
 *    BUILT. Two-step departure, re-employment re-validation, and the
 *    canonical-template import are real, disclosed gaps — this task's own
 *    brief scopes it to create/enter/view, not the full lifecycle.
 *  - `L27602`/`L27610`/`L28112`/`L28136`/`L52800`/`L64415` (the happy-path
 *    workflow, alert cadence, escalation window and command-channel
 *    delivery narrative) → NOT CARRIED FORWARD as rendered mechanism. No
 *    scheduler, notification or command-channel infrastructure exists at
 *    this build's authority yet (matching every sibling screen's own
 *    disclosure of the same absence one module over); this screen renders
 *    the qualification record's own `status` field as stored, never a
 *    simulated four-stage alert ladder this build cannot actually run.
 *  - `SCR-DOH-23` / `OBJ-DOH-CLEAR` → the Qualification Calendar and the
 *    Clearance object belong to a different screen's own registry entry,
 *    left there rather than kept here under the wrong name (the same
 *    "rendered the wrong screen" correction `PermissionsScreen.tsx`'s own
 *    header records for its outgoing file).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE CORRECTIVE FACT THIS TASK EXISTS TO GET RIGHT THE FIRST TIME
 * ─────────────────────────────────────────────────────────────────────────
 * `repository.ts`'s generic `'hub'`-authority floor (`TENANT_OPERATIONAL_
 * WRITERS` = Tenant Admin + Supervisor + Quality Manager) is WRONG for this
 * module's two write doors. `MOD-DOH-04`'s own roles-and-permissions table
 * (L27470/L27472) states Quality Manager `Explicitly prohibited` for both
 * "Create or edit a worker record" and "Enter a qualification" — three of
 * the four prior review cycles in this unit caught exactly this class of
 * mistake (a write door given the generic floor without checking the
 * module's own action-level table; see `repository.ts`'s
 * `CREATE_AREA_UNDER_SITE_REQUEST`/`CREATE_SHIFT_REQUEST`/etc. corrective-
 * task comments). `createWorker`/`recordQualification` (`repository.ts`,
 * this task) and this screen's own `WORKER_WRITE_REQUEST`/
 * `QUALIFICATION_WRITE_REQUEST` below are BOTH `['TENANT_ADMIN',
 * 'SUPERVISOR']` from the start. Quality Manager's real standing in this
 * module is exclusively clearance-granting (deferred, see above) plus
 * ordinary VIEW access (L27471) — a case where VIEW stays broader than
 * WRITE, the same shape the corrective fix already landed on Tasks 1/2.
 */

const MODULE = dohModuleById('MOD-DOH-04')

type WorkerRow = RowOf<'workers'>
type QualificationRow = RowOf<'qualifications'>
type UserRow = RowOf<'users'>
type RoleGrantRow = RowOf<'role-grants'>
type SiteRow = RowOf<'sites'>
type AreaRow = RowOf<'areas'>
type ShiftRow = RowOf<'shifts'>

const LIST_HREF = '/hub/worker-lifecycle-and-qualifications/'
const PERMISSIONS_HREF = '/hub/permissions-roles-and-access/'

const WORKER_STATUS_LABEL: Readonly<Record<WorkerRow['status'], string>> = {
  active: 'Active',
  archived: 'Archived',
  reactivated: 'Reactivated',
}
const WORKER_STATUS_TONE: Readonly<Record<WorkerRow['status'], StatusToken>> = {
  active: 'ok',
  archived: 'offline',
  reactivated: 'info',
}

const QUAL_STATUS_LABEL: Readonly<Record<QualificationRow['status'], string>> = {
  valid: 'Valid',
  expiring: 'Expiring',
  expired: 'Expired',
  recertified: 'Recertified',
}
const QUAL_STATUS_TONE: Readonly<Record<QualificationRow['status'], StatusToken>> = {
  valid: 'ok',
  expiring: 'warn',
  expired: 'danger',
  recertified: 'info',
}

/**
 * The whole screen's own view gate, matching `ShiftManagementScreen.tsx`'s
 * own `VIEW_REQUEST` shape. L27471 ("View a worker record"): Tenant Admin
 * `Allowed`, Supervisor/Quality Manager `Allowed with conditions — own
 * scope`, Read-only Auditor `Read-only`, Worker `Allowed with conditions —
 * own record only`. Worker is excluded here — no Hub route renders for that
 * role at all (D11), and the "own record only" reading belongs to a
 * Frontline-side screen this build does not construct.
 */
const VIEW_REQUEST: AccessRequest = {
  action: 'view-worker-lifecycle-and-qualifications',
  allowedRoles: ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER', 'READONLY_AUDITOR'],
  sourceRefs: ['L27471', 'MOD-DOH-04', 'repository.ts'],
}

/**
 * Screen-level display gate for "Create or edit a worker record" — matches
 * `repository.ts`'s own `CREATE_WORKER_REQUEST` exactly (this file's own
 * header explains why Quality Manager is excluded rather than the generic
 * floor).
 */
const WORKER_WRITE_REQUEST: AccessRequest = {
  action: 'create-or-edit-worker-record',
  allowedRoles: ['TENANT_ADMIN', 'SUPERVISOR'],
  sourceRefs: ['L27470', 'FUNC-DOH-04-1.1.1', 'repository.ts'],
}
const WORKER_WRITE_DENIED_REASON =
  "Only the Tenant Admin or a Supervisor may create or edit a worker record — the Worker Lifecycle and Qualifications module's own roles-and-permissions table prohibits the Quality Manager, the Read-only Auditor and the Worker alike."

/** Screen-level display gate for "Enter a qualification" — matches `repository.ts`'s own `RECORD_QUALIFICATION_REQUEST`. */
const QUALIFICATION_WRITE_REQUEST: AccessRequest = {
  action: 'enter-qualification',
  allowedRoles: ['TENANT_ADMIN', 'SUPERVISOR'],
  sourceRefs: ['L27472', 'FUNC-DOH-04-2.1.1', 'repository.ts'],
}
const QUALIFICATION_WRITE_DENIED_REASON =
  'Only the Tenant Admin or a Supervisor may enter a qualification — self-attestation is not permitted, and the Quality Manager and Read-only Auditor are prohibited by the same table.'

/**
 * The "Edit scope" link on the worker detail's scope tab does not
 * reimplement `assignTenantRole` (task brief, Step 3: "do not duplicate its
 * logic") — it navigates to `PermissionsScreen.tsx`'s own `?assign=<userId>`
 * deep link, Task 3's real control. This gate decides only whether that
 * link is shown live or with its reason, matching that screen's own
 * `WRITE_REQUEST` (`TENANT_ADMIN` alone — only a Tenant Admin may ever
 * complete a role grant under `TENANT_ROLE_GRANT_MATRIX`).
 */
const SCOPE_EDIT_REQUEST: AccessRequest = {
  action: 'edit-worker-scope',
  allowedRoles: ['TENANT_ADMIN'],
  sourceRefs: ['L18976', 'TRN-ACC-04', 'MOD-DOH-09'],
}

/**
 * §8.6.1 fixture adequacy: Bright Bikes carries 20 seeded Workers (this
 * task's own seed-volume check, see the report). `pageSize={8}` gives three
 * genuinely distinct pages — 8, 8, 4 — a first, a middle and a
 * last-partial, the same precedent `ShiftManagementScreen.tsx`'s own
 * `SHIFTS_PAGE_SIZE` sets, rather than one page holding all 20.
 */
const WORKERS_PAGE_SIZE = 8
const QUALIFICATIONS_PAGE_SIZE = 5

export function WorkerLifecycleScreen() {
  return (
    <RequireSession signInHref="/super-admin/sign-in/">
      {(session) => <WorkerLifecycleGate session={session} />}
    </RequireSession>
  )
}

function WorkerLifecycleGate({ session }: { readonly session: ProductSession }) {
  const ctx = useAccessContext()
  const viewGate = evaluateAccess(VIEW_REQUEST, ctx)
  if (viewGate.outcome !== 'allowed') {
    return (
      <AppShell surface="SURF-DOH" session={session} title={MODULE.name} breadcrumbs={[{ label: MODULE.name }]}>
        <p data-control-id="worker-lifecycle-unavailable" className={`text-sm ${textColor('ink-muted')}`}>
          {viewGate.explanation}
        </p>
      </AppShell>
    )
  }
  if (ctx.identity.tenant === null) {
    return (
      <AppShell surface="SURF-DOH" session={session} title={MODULE.name} breadcrumbs={[{ label: MODULE.name }]}>
        <p data-control-id="worker-lifecycle-no-tenant" className={`text-sm ${textColor('ink-muted')}`}>
          No live tenant is attached to this identity, so no worker register can be shown.
        </p>
      </AppShell>
    )
  }
  return <WorkerLifecycleRouter session={session} ctx={ctx} tenantId={ctx.identity.tenant} />
}

/**
 * `?worker=<id>` names the object dimension on this ONE static route — the
 * same shape `TenantDetailScreen.tsx`'s own `?tenant=<id>` uses, required
 * under `output: "export"` (see that file's own `page.tsx` comment): a
 * dynamic `[workerId]/` segment can only ever pre-render the ids known at
 * build time, and a worker created in a live session would 404. This
 * screen's own `page.tsx` wraps it in the matching `<Suspense>` boundary
 * `useSearchParams()` requires under static export.
 */
function WorkerLifecycleRouter({
  session,
  ctx,
  tenantId,
}: {
  readonly session: ProductSession
  readonly ctx: AccessContext
  readonly tenantId: string
}) {
  const searchParams = useSearchParams()
  const workerIdParam = searchParams.get('worker')

  const workersQuery = useRepositoryQuery((r, c) => r.list('workers', c))
  const usersQuery = useRepositoryQuery((r, c) => r.list('users', c))
  const roleGrantsQuery = useRepositoryQuery((r, c) => r.list('role-grants', c))
  const qualificationsQuery = useRepositoryQuery((r, c) => r.list('qualifications', c))
  const sitesQuery = useRepositoryQuery((r, c) => r.list('sites', c))
  const areasQuery = useRepositoryQuery((r, c) => r.list('areas', c))
  const shiftsQuery = useRepositoryQuery((r, c) => r.list('shifts', c))

  const tenantWorkers = workersQuery.all().filter((w) => w.tenantId === tenantId)
  const allUsers = usersQuery.all()
  const usersById = new Map<string, UserRow>(allUsers.map((u) => [u.id, u]))
  const activeGrants = roleGrantsQuery.all().filter((g) => g.revokedAt === null)
  const allQualifications = qualificationsQuery.all()
  const tenantSites = sitesQuery.all().filter((s) => s.tenantId === tenantId)
  const siteById = new Map<string, SiteRow>(tenantSites.map((s) => [s.id, s]))
  const tenantAreas = areasQuery.all().filter((a) => siteById.has(a.siteId))
  const areaById = new Map<string, AreaRow>(tenantAreas.map((a) => [a.id, a]))
  const tenantShifts = shiftsQuery.all().filter((s) => s.siteId !== undefined && siteById.has(s.siteId))
  const shiftById = new Map<string, ShiftRow>(tenantShifts.map((s) => [s.id, s]))

  if (workerIdParam === null) {
    return (
      <WorkerListBody
        session={session}
        ctx={ctx}
        tenantId={tenantId}
        workersQuery={workersQuery}
        workers={tenantWorkers}
        usersById={usersById}
        activeGrants={activeGrants}
        allQualifications={allQualifications}
        siteById={siteById}
        areaById={areaById}
        allUsers={allUsers}
      />
    )
  }

  const worker = tenantWorkers.find((w) => w.id === workerIdParam)
  if (worker === undefined) {
    return (
      <AppShell surface="SURF-DOH" session={session}>
        <div className={`${radiusClass('lg')} border ${borderColor('border')} ${bg('raised')} p-6`}>
          <h2 className={`text-lg font-semibold ${textColor('ink')}`}>No such worker</h2>
          <p className={`mt-2 text-sm ${textColor('ink-muted')}`}>
            {`"${workerIdParam}" does not match any worker record this tenant can read — it may belong to a different tenant, or not exist at all.`}
          </p>
          <Link
            href={LIST_HREF}
            data-control-id="worker-lifecycle-not-found-back"
            className={`mt-4 inline-block ${radiusClass('md')} ${bg('accent')} px-4 py-2 text-sm font-medium text-[var(--accent-ink)]`}
          >
            Back to the worker list
          </Link>
        </div>
      </AppShell>
    )
  }

  return (
    <WorkerDetailBody
      session={session}
      ctx={ctx}
      worker={worker}
      linkedUser={usersById.get(worker.userId)}
      grants={activeGrants.filter((g) => g.userId === worker.userId)}
      qualificationsQuery={qualificationsQuery}
      qualifications={allQualifications.filter((q) => q.workerId === worker.id)}
      siteById={siteById}
      areaById={areaById}
      shiftById={shiftById}
      tenantAreas={tenantAreas}
    />
  )
}

/* ────────────────────────────────────────────────────────────────────── *
 * List view — the Worker `DataTable`, plus the two-door "Add worker" flow.
 * ────────────────────────────────────────────────────────────────────── */

type AddWorkerState =
  | { readonly step: 'choose' }
  | { readonly step: 'new-user'; readonly pendingUserId: string }
  | { readonly step: 'existing-user' }
  | { readonly step: 'worker-fields'; readonly userId: string; readonly userLabel: string; readonly pendingWorkerId: string }
  | null

function WorkerListBody({
  session,
  ctx,
  tenantId,
  workersQuery,
  workers,
  usersById,
  activeGrants,
  allQualifications,
  siteById,
  areaById,
  allUsers,
}: {
  readonly session: ProductSession
  readonly ctx: AccessContext
  readonly tenantId: string
  readonly workersQuery: Query<WorkerRow>
  readonly workers: readonly WorkerRow[]
  readonly usersById: ReadonlyMap<string, UserRow>
  readonly activeGrants: readonly RoleGrantRow[]
  readonly allQualifications: readonly QualificationRow[]
  readonly siteById: ReadonlyMap<string, SiteRow>
  readonly areaById: ReadonlyMap<string, AreaRow>
  readonly allUsers: readonly UserRow[]
}) {
  const repository = useRepository()
  const store = useStore()
  const router = useRouter()

  const [addWorker, setAddWorker] = useState<AddWorkerState>(null)
  const [toasts, setToasts] = useState<readonly ToastItem[]>([])

  const writeGate = evaluateAccess(WORKER_WRITE_REQUEST, ctx)
  const canWrite = writeGate.outcome === 'allowed'

  function pushToast(tone: StatusToken, label: string): void {
    setToasts((prev) => [...prev, { id: `${store.nextSequence()}`, tone, label }])
  }
  function dismissToast(id: string): void {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  function closeAddWorker(): void {
    setAddWorker(null)
  }

  function scopeLabelFor(userId: string): string {
    const grant = activeGrants.find((g) => g.userId === userId)
    if (grant === undefined) return 'No active grant'
    const siteNames = grant.siteIds.map((id) => siteById.get(id)?.name ?? id)
    const areaNames = grant.areaIds.map((id) => areaById.get(id)?.name ?? id)
    if (siteNames.length === 0 && areaNames.length === 0) return 'Tenant-wide'
    return [...siteNames, ...areaNames].join(', ')
  }

  /** Same-tenant, `WORKER`-role Users with no Worker row of their own yet — the "attach an existing account" picker's own eligible set. */
  const unassignedWorkerUsers = allUsers.filter(
    (u) => u.tenantId === tenantId && u.role === 'WORKER' && !workers.some((w) => w.userId === u.id),
  )

  /**
   * `createTenantUser`'s THIRD result shape (`partial`) has no home in
   * `Form`'s own generic renderer — same translation idiom
   * `PermissionsScreen.tsx`'s own `toFormResult` uses for the same door.
   */
  function newUserResult(result: CreateTenantUserResult): WriteResult<unknown> {
    if (result.ok) {
      setAddWorker({
        step: 'worker-fields',
        userId: result.user.id,
        userLabel: result.user.displayName,
        pendingWorkerId: `WRK-${store.nextSequence()}`,
      })
      pushToast('ok', `${result.user.displayName}'s account was created. Now add their worker record.`)
      return { ok: true, row: result.user, events: [], audit: [], affectedSurfaces: [] }
    }
    if (result.kind === 'partial') {
      const explain = `${result.user.displayName}'s account was created, but the role grant could not be recorded: ${result.grantFailure.explain}`
      return {
        ok: false,
        kind: 'denied',
        decision: deny('explicitlyProhibited', 'OBJECT_STATE_INVALID', explain, {
          stage: 'COMMAND_VALIDATION',
          sourceRefs: ['repository.ts'],
        }),
        reason: 'OBJECT_STATE_INVALID',
        explain,
      }
    }
    return result
  }

  async function onNewUserSubmit(value: UserRow): Promise<WriteResult<unknown>> {
    const outcome = await repository.createTenantUser(value, ctx)
    return newUserResult(outcome)
  }

  async function onWorkerFieldsSubmit(userId: string, value: WorkerRow): Promise<WriteResult<unknown>> {
    const outcome = await repository.createWorker(userId, value, ctx)
    if (outcome.ok) {
      pushToast('ok', 'The worker record was created.')
      setAddWorker(null)
      router.push(`${LIST_HREF}?worker=${encodeURIComponent(outcome.row.id)}`)
    }
    return outcome
  }

  const columns: readonly DataTableColumn<WorkerRow>[] = [
    {
      key: 'name',
      header: 'Name',
      sortValue: (w) => usersById.get(w.userId)?.displayName ?? w.userId,
      render: (w) => {
        const user = usersById.get(w.userId)
        return (
          <span className="flex flex-col" data-control-id={`worker-lifecycle-row-${w.id}`}>
            <span className={`font-medium ${textColor('ink')}`}>{user?.displayName ?? w.userId}</span>
            <span className={`text-xs ${textColor('ink-subtle')}`}>{w.id}</span>
            {user?.status === 'invited' ? (
              <span className="mt-1 w-fit" data-control-id={`worker-lifecycle-invited-badge-${w.id}`}>
                <StatusPill tone="info" label="Invited — not yet activated" />
              </span>
            ) : null}
          </span>
        )
      },
    },
    {
      key: 'email',
      header: 'Email',
      sortValue: (w) => usersById.get(w.userId)?.email ?? '',
      render: (w) => usersById.get(w.userId)?.email ?? '—',
    },
    {
      key: 'role',
      header: 'Role',
      render: (w) => roleById(usersById.get(w.userId)?.role ?? 'WORKER').name,
    },
    {
      key: 'scope',
      header: 'Site / Area scope',
      render: (w) => scopeLabelFor(w.userId),
    },
    {
      key: 'qualifications',
      header: 'Qualifications',
      align: 'end',
      sortValue: (w) => allQualifications.filter((q) => q.workerId === w.id).length,
      render: (w) => allQualifications.filter((q) => q.workerId === w.id).length,
    },
    {
      key: 'status',
      header: 'Status',
      render: (w) => (
        <span data-control-id={`worker-lifecycle-status-${w.id}-${w.status}`}>
          <StatusPill tone={WORKER_STATUS_TONE[w.status]} label={WORKER_STATUS_LABEL[w.status]} />
        </span>
      ),
    },
  ]

  return (
    <AppShell
      surface="SURF-DOH"
      session={session}
      title={MODULE.name}
      breadcrumbs={[{ label: MODULE.name }]}
      actions={<AddWorkerAction canWrite={canWrite} onOpen={() => setAddWorker({ step: 'choose' })} />}
    >
      <section aria-labelledby="worker-lifecycle-heading" className="mt-6 flex flex-col gap-4">
        <h2 id="worker-lifecycle-heading" className={`text-lg font-semibold ${textColor('ink')}`}>
          Workers
        </h2>
        <DataTable
          caption="Workers"
          columns={columns}
          query={workersQuery.where((w) => w.tenantId === tenantId)}
          rowId={(w) => w.id}
          rowHref={(w) => `${LIST_HREF}?worker=${encodeURIComponent(w.id)}`}
          search={{
            placeholder: 'Search by name, email or id',
            match: (w, q) => {
              const needle = q.toLowerCase()
              const user = usersById.get(w.userId)
              return (
                w.id.toLowerCase().includes(needle) ||
                (user?.displayName.toLowerCase().includes(needle) ?? false) ||
                (user?.email.toLowerCase().includes(needle) ?? false)
              )
            },
          }}
          pageSize={WORKERS_PAGE_SIZE}
          emptyState={{
            title: 'There are no workers yet.',
            whatCreatesIt: 'A Tenant Admin or Supervisor creates the first one from Add worker.',
          }}
        />
      </section>

      <DetailDrawer
        open={addWorker !== null}
        onClose={closeAddWorker}
        title={
          addWorker?.step === 'worker-fields'
            ? `Add worker record for ${addWorker.userLabel}`
            : addWorker?.step === 'new-user'
              ? 'Invite a new worker'
              : addWorker?.step === 'existing-user'
                ? 'Attach an existing account'
                : 'Add worker'
        }
      >
        {addWorker?.step === 'choose' ? (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              data-control-id="worker-lifecycle-add-choose-new-user"
              onClick={() => setAddWorker({ step: 'new-user', pendingUserId: `USR-${tenantId}-${store.nextSequence()}` })}
              className={`${radiusClass('md')} border ${borderColor('border-strong')} ${bg('surface')} px-4 py-3 text-left text-sm font-medium ${textColor('ink')}`}
            >
              Invite a new worker
              <span className={`block text-xs font-normal ${textColor('ink-muted')}`}>
                Creates their account first (Task 3&apos;s own door), then their worker record.
              </span>
            </button>
            <button
              type="button"
              data-control-id="worker-lifecycle-add-choose-existing"
              onClick={() => setAddWorker({ step: 'existing-user' })}
              className={`${radiusClass('md')} border ${borderColor('border-strong')} ${bg('surface')} px-4 py-3 text-left text-sm font-medium ${textColor('ink')}`}
            >
              Attach an existing account
              <span className={`block text-xs font-normal ${textColor('ink-muted')}`}>
                For a Worker-role account already invited that has no worker record yet.
              </span>
            </button>
          </div>
        ) : null}

        {addWorker?.step === 'new-user' ? (
          <Form
            key={addWorker.pendingUserId}
            schema={User}
            initial={{
              id: addWorker.pendingUserId,
              tenantId,
              role: 'WORKER',
              status: 'invited',
              locale: 'en',
              createdAt: new Date(store.clock.now()).toISOString(),
              lastSignInAt: null,
            }}
            onSubmit={onNewUserSubmit}
            submitLabel="Create account and continue"
          >
            <TextField name="displayName" label="Full name" required />
            <TextField name="email" label="Email" type="email" autoComplete="email" required />
          </Form>
        ) : null}

        {addWorker?.step === 'existing-user' ? (
          <ExistingUserPicker
            eligible={unassignedWorkerUsers}
            onPick={(u) =>
              setAddWorker({
                step: 'worker-fields',
                userId: u.id,
                userLabel: u.displayName,
                pendingWorkerId: `WRK-${store.nextSequence()}`,
              })
            }
            onPickById={(userId) =>
              setAddWorker({
                step: 'worker-fields',
                userId,
                userLabel: userId,
                pendingWorkerId: `WRK-${store.nextSequence()}`,
              })
            }
          />
        ) : null}

        {addWorker?.step === 'worker-fields' ? (
          <Form
            key={addWorker.pendingWorkerId}
            schema={Worker}
            initial={{
              id: addWorker.pendingWorkerId,
              userId: addWorker.userId,
              tenantId,
              workerType: 'employee',
              instructionDifficultyProfile: 'standard',
              locale: 'en',
              qualificationIds: [],
              status: 'active',
            }}
            onSubmit={(value) => onWorkerFieldsSubmit(addWorker.userId, value)}
            submitLabel="Create worker record"
          >
            <SelectField
              name="workerType"
              label="Worker type"
              required
              options={[
                { value: 'employee', label: 'Employee' },
                { value: 'contractor', label: 'Contractor' },
              ]}
              hint="No operational difference at V1."
            />
            <SelectField
              name="instructionDifficultyProfile"
              label="Instruction difficulty"
              required
              options={[
                { value: 'simple', label: 'Simple' },
                { value: 'standard', label: 'Standard' },
                { value: 'expanded', label: 'Expanded' },
              ]}
            />
            <SelectField
              name="locale"
              label="Locale"
              required
              options={[
                { value: 'en', label: 'English' },
                { value: 'es', label: 'Spanish' },
              ]}
            />
          </Form>
        ) : null}
      </DetailDrawer>

      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </AppShell>
  )
}

function ExistingUserPicker({
  eligible,
  onPick,
  onPickById,
}: {
  readonly eligible: readonly UserRow[]
  readonly onPick: (user: UserRow) => void
  readonly onPickById: (userId: string) => void
}) {
  const [manualId, setManualId] = useState('')
  return (
    <div className="flex flex-col gap-4">
      {eligible.length === 0 ? (
        <p className={`text-sm ${textColor('ink-muted')}`}>
          No unassigned Worker-role accounts exist in this tenant right now — invite a new one instead.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {eligible.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                data-control-id={`worker-lifecycle-pick-user-${u.id}`}
                onClick={() => onPick(u)}
                className={`w-full ${radiusClass('md')} border ${borderColor('border-strong')} ${bg('surface')} px-3 py-2 text-left text-sm ${textColor('ink')}`}
              >
                <span className="font-medium">{u.displayName}</span>{' '}
                <span className={textColor('ink-subtle')}>{u.email}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={`${radiusClass('lg')} border ${borderColor('border')} p-3`}>
        <label htmlFor="worker-lifecycle-manual-user-id" className={`text-sm font-medium ${textColor('ink')}`}>
          Or enter a user id directly
        </label>
        <p className={`mt-1 text-xs ${textColor('ink-muted')}`}>
          Not looked up or shown before you continue — the next screen sends it to the door as-is, and its
          refusal (never a foreign tenant&apos;s real data) is what renders if the id does not resolve inside
          this tenant.
        </p>
        <div className="mt-2 flex gap-2">
          <input
            id="worker-lifecycle-manual-user-id"
            data-control-id="worker-lifecycle-manual-user-id"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            className={`flex-1 ${radiusClass('md')} border ${borderColor('border-strong')} ${bg('surface')} px-3 py-2 text-sm ${textColor('ink')}`}
          />
          <button
            type="button"
            data-control-id="worker-lifecycle-manual-user-id-continue"
            disabled={manualId.trim().length === 0}
            onClick={() => onPickById(manualId.trim())}
            className={`${radiusClass('md')} ${bg('accent')} px-3 py-2 text-sm font-medium text-[var(--accent-ink)] disabled:opacity-50`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}

function AddWorkerAction({ canWrite, onOpen }: { readonly canWrite: boolean; readonly onOpen: () => void }) {
  const controlId = 'worker-lifecycle-add-worker'
  if (canWrite) {
    return (
      <button
        type="button"
        data-control-id={controlId}
        onClick={onOpen}
        className={`${radiusClass('md')} ${bg('accent')} px-4 py-2 text-sm font-medium text-[var(--accent-ink)]`}
      >
        Add worker
      </button>
    )
  }
  return (
    <div className="flex max-w-xs flex-col items-end gap-1">
      <button
        type="button"
        disabled
        aria-describedby={`${controlId}-reason`}
        data-control-id={controlId}
        className={`cursor-not-allowed ${radiusClass('md')} border ${borderColor('border-strong')} ${bg('sunken')} px-4 py-2 text-sm font-medium ${textColor('ink-subtle')}`}
      >
        Add worker
      </button>
      <p id={`${controlId}-reason`} className={`text-right text-xs ${textColor('ink-muted')}`}>
        {WORKER_WRITE_DENIED_REASON}
      </p>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────── *
 * Detail view — identity / scope / qualifications tabs.
 * ────────────────────────────────────────────────────────────────────── */

function WorkerDetailBody({
  session,
  ctx,
  worker,
  linkedUser,
  grants,
  qualificationsQuery,
  qualifications,
  siteById,
  areaById,
  shiftById,
  tenantAreas,
}: {
  readonly session: ProductSession
  readonly ctx: AccessContext
  readonly worker: WorkerRow
  readonly linkedUser: UserRow | undefined
  readonly grants: readonly RoleGrantRow[]
  readonly qualificationsQuery: Query<QualificationRow>
  readonly qualifications: readonly QualificationRow[]
  readonly siteById: ReadonlyMap<string, SiteRow>
  readonly areaById: ReadonlyMap<string, AreaRow>
  readonly shiftById: ReadonlyMap<string, ShiftRow>
  readonly tenantAreas: readonly AreaRow[]
}) {
  const repository = useRepository()
  const store = useStore()
  const [activeTabId, setActiveTabId] = useState('identity')
  const [qualDrawerOpen, setQualDrawerOpen] = useState(false)
  const [pendingQualId, setPendingQualId] = useState<string | null>(null)
  const [toasts, setToasts] = useState<readonly ToastItem[]>([])

  const workerWriteGate = evaluateAccess(WORKER_WRITE_REQUEST, ctx)
  const canEditWorker = workerWriteGate.outcome === 'allowed'
  const qualificationWriteGate = evaluateAccess(QUALIFICATION_WRITE_REQUEST, ctx)
  const canEnterQualification = qualificationWriteGate.outcome === 'allowed'
  const scopeEditGate = evaluateAccess(SCOPE_EDIT_REQUEST, ctx)
  const canEditScope = scopeEditGate.outcome === 'allowed'

  function pushToast(tone: StatusToken, label: string): void {
    setToasts((prev) => [...prev, { id: `${store.nextSequence()}`, tone, label }])
  }
  function dismissToast(id: string): void {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  function openQualDrawer(): void {
    setPendingQualId(`QUAL-${store.nextSequence()}`)
    setQualDrawerOpen(true)
  }
  function closeQualDrawer(): void {
    setQualDrawerOpen(false)
    setPendingQualId(null)
  }

  /**
   * `recordQualification`'s `'invalid-reference'`/`'partial'` arms have no
   * home in `Form`'s own generic renderer — same translation idiom
   * `ShiftManagementScreen.tsx`'s own `toFormResult` uses for
   * `createShift`'s equivalent extra arms.
   */
  function toFormResult(result: RecordQualificationResult): WriteResult<unknown> {
    if (result.ok) {
      pushToast('ok', `${result.qualification.certificationType} was recorded.`)
      return { ok: true, row: result.qualification, events: [], audit: [], affectedSurfaces: [] }
    }
    if (result.kind === 'invalid-reference') {
      const explain = scopeReferenceMessage(result.problem)
      return {
        ok: false,
        kind: 'denied',
        decision: deny('explicitlyProhibited', 'OBJECT_STATE_INVALID', explain, {
          stage: 'COMMAND_VALIDATION',
          sourceRefs: ['repository.ts'],
        }),
        reason: 'OBJECT_STATE_INVALID',
        explain,
      }
    }
    if (result.kind === 'partial') {
      const explain = `The qualification was recorded, but the worker's own record could not be updated to reference it: ${result.workerUpdateFailure.explain}`
      return {
        ok: false,
        kind: 'denied',
        decision: deny('explicitlyProhibited', 'OBJECT_STATE_INVALID', explain, {
          stage: 'COMMAND_VALIDATION',
          sourceRefs: ['repository.ts'],
        }),
        reason: 'OBJECT_STATE_INVALID',
        explain,
      }
    }
    return result
  }

  async function onQualificationSubmit(value: QualificationRow): Promise<WriteResult<unknown>> {
    const outcome = await repository.recordQualification(value, ctx)
    const formResult = toFormResult(outcome)
    if (outcome.ok) closeQualDrawer()
    return formResult
  }

  const areaOptions = tenantAreas
    .filter((a) => a.status === 'active')
    .map((a) => ({ value: a.id, label: `${a.name} (${siteById.get(a.siteId)?.name ?? a.siteId})` }))

  const identityTab = (
    <div className="flex flex-col gap-4">
      {linkedUser?.status === 'invited' ? (
        <div
          role="note"
          data-control-id={`worker-lifecycle-detail-invited-badge-${worker.id}`}
          className={`${radiusClass('lg')} border ${borderColor('border-strong')} ${bg('raised')} p-3`}
        >
          <StatusPill tone="info" label="Invited — not yet activated" />
          <p className={`mt-2 text-sm ${textColor('ink-muted')}`}>
            {linkedUser.displayName} has not yet activated a device. Device activation is Frontline&apos;s own
            flow, built in a later unit — this record only shows the state.
          </p>
        </div>
      ) : null}

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DetailField label="Worker id" value={worker.id} />
        <DetailField label="Linked user id" value={worker.userId} />
        <DetailField label="Full name" value={linkedUser?.displayName ?? '—'} />
        <DetailField label="Email" value={linkedUser?.email ?? '—'} />
        <DetailField label="Worker type" value={worker.workerType === 'employee' ? 'Employee' : 'Contractor'} />
        <DetailField
          label="Instruction difficulty"
          value={
            worker.instructionDifficultyProfile.charAt(0).toUpperCase() + worker.instructionDifficultyProfile.slice(1)
          }
        />
        <DetailField label="Locale" value={worker.locale === 'en' ? 'English' : 'Spanish'} />
        <DetailField label="Account status" value={linkedUser?.status ?? '—'} />
      </dl>
    </div>
  )

  const scopeTab = (
    <div className="flex flex-col gap-4">
      {grants.length === 0 ? (
        <p className={`text-sm ${textColor('ink-muted')}`}>No active role grant exists for this worker&apos;s account.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {grants.map((g) => (
            <li
              key={g.id}
              data-control-id={`worker-lifecycle-scope-grant-${g.id}`}
              className={`${radiusClass('lg')} border ${borderColor('border')} p-3`}
            >
              <p className={`text-sm font-medium ${textColor('ink')}`}>{roleById(g.role).name}</p>
              <p className={`mt-1 text-xs ${textColor('ink-muted')}`}>
                Sites: {g.siteIds.length === 0 ? 'Tenant-wide' : g.siteIds.map((id) => siteById.get(id)?.name ?? id).join(', ')}
              </p>
              <p className={`text-xs ${textColor('ink-muted')}`}>
                Areas: {g.areaIds.length === 0 ? 'Tenant-wide' : g.areaIds.map((id) => areaById.get(id)?.name ?? id).join(', ')}
              </p>
              <p className={`text-xs ${textColor('ink-muted')}`}>
                Shifts: {g.shiftIds.length === 0 ? 'Any' : g.shiftIds.map((id) => shiftById.get(id)?.name ?? id).join(', ')}
              </p>
            </li>
          ))}
        </ul>
      )}
      <p className={`text-xs ${textColor('ink-muted')}`}>
        A grant with no Site/Area named reads as tenant-wide, not narrowed — no signed-in session in this build
        yet populates a real site/area scope on sign-in (a pre-existing, previously-disclosed gap in
        session-construction wiring, not this screen&apos;s own).
      </p>
      {canEditScope ? (
        <Link
          href={`${PERMISSIONS_HREF}?assign=${encodeURIComponent(worker.userId)}`}
          data-control-id={`worker-lifecycle-edit-scope-${worker.id}`}
          className={`w-fit ${radiusClass('md')} border ${borderColor('border-strong')} ${bg('surface')} px-3 py-2 text-sm font-medium ${textColor('ink')}`}
        >
          Edit scope in Permissions, Roles and Access
        </Link>
      ) : (
        <div className="flex flex-col gap-1">
          <button
            type="button"
            disabled
            aria-describedby="worker-lifecycle-edit-scope-reason"
            data-control-id={`worker-lifecycle-edit-scope-${worker.id}`}
            className={`w-fit cursor-not-allowed ${radiusClass('md')} border ${borderColor('border')} ${bg('sunken')} px-3 py-2 text-sm ${textColor('ink-subtle')}`}
          >
            Edit scope in Permissions, Roles and Access
          </button>
          <p id="worker-lifecycle-edit-scope-reason" className={`text-xs ${textColor('ink-muted')}`}>
            {scopeEditGate.explanation}
          </p>
        </div>
      )}
    </div>
  )

  const qualColumns: readonly DataTableColumn<QualificationRow>[] = [
    {
      key: 'type',
      header: 'Certification type',
      sortValue: (q) => q.certificationType,
      render: (q) => (
        <span data-control-id={`worker-lifecycle-qual-row-${q.id}`} className={`font-medium ${textColor('ink')}`}>
          {q.certificationType}
        </span>
      ),
    },
    {
      key: 'areas',
      header: 'Areas',
      render: (q) => (q.areaIds.length === 0 ? '—' : q.areaIds.map((id) => areaById.get(id)?.name ?? id).join(', ')),
    },
    { key: 'certificationDate', header: 'Certification date', sortValue: (q) => q.certificationDate, render: (q) => q.certificationDate.slice(0, 10) },
    { key: 'entryDate', header: 'Entry date', sortValue: (q) => q.entryDate, render: (q) => q.entryDate.slice(0, 10) },
    {
      key: 'expiryDate',
      header: 'Expiry date',
      sortValue: (q) => q.expiryDate ?? '',
      render: (q) => (q.expiryDate === null ? 'No expiry' : q.expiryDate.slice(0, 10)),
    },
    {
      key: 'status',
      header: 'Status',
      render: (q) => (
        <span data-control-id={`worker-lifecycle-qual-status-${q.id}-${q.status}`}>
          <StatusPill tone={QUAL_STATUS_TONE[q.status]} label={QUAL_STATUS_LABEL[q.status]} />
        </span>
      ),
    },
  ]

  const qualificationsTab = (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className={`text-sm ${textColor('ink-muted')}`}>{qualifications.length} qualification(s) on record.</p>
        <EnterQualificationAction canWrite={canEnterQualification} onOpen={openQualDrawer} />
      </div>
      <DataTable
        caption={`Qualifications for ${linkedUser?.displayName ?? worker.id}`}
        columns={qualColumns}
        query={qualificationsQuery.where((q) => q.workerId === worker.id)}
        rowId={(q) => q.id}
        pageSize={QUALIFICATIONS_PAGE_SIZE}
        emptyState={{
          title: 'No qualifications recorded yet.',
          whatCreatesIt: 'A Tenant Admin or Supervisor enters the first one from Enter qualification.',
        }}
      />

      <DetailDrawer open={qualDrawerOpen} onClose={closeQualDrawer} title="Enter qualification">
        {qualDrawerOpen && pendingQualId !== null ? (
          <Form
            key={pendingQualId}
            schema={Qualification}
            initial={{
              id: pendingQualId,
              workerId: worker.id,
              areaIds: [],
              recertifiedFromId: null,
              status: 'valid',
            }}
            onSubmit={onQualificationSubmit}
            submitLabel="Enter qualification"
          >
            <TextField
              name="certificationType"
              label="Certification type"
              required
              hint="Free text — the source states no closed set of certification types."
            />
            <AreaMultiSelect name="areaIds" label="Areas" options={areaOptions} required />
            <DateFieldLocal name="certificationDate" label="Certification date" required />
            <DateFieldLocal
              name="entryDate"
              label="Entry date"
              required
              hint="May postdate the certification date — a back-dated issue is recorded as both dates, never as a gap."
            />
            <DateFieldLocal name="expiryDate" label="Expiry date" required />
          </Form>
        ) : null}
      </DetailDrawer>
    </div>
  )

  const tabs: readonly ObjectPageTab[] = [
    { id: 'identity', label: 'Identity', content: identityTab },
    { id: 'scope', label: 'Scope', content: scopeTab },
    { id: 'qualifications', label: 'Qualifications', content: qualificationsTab },
  ]

  return (
    <AppShell surface="SURF-DOH" session={session}>
      <Toaster toasts={toasts} onDismiss={dismissToast} />
      <ObjectPage
        breadcrumbs={[{ label: MODULE.name, href: LIST_HREF }, { label: linkedUser?.displayName ?? worker.id }]}
        title={linkedUser?.displayName ?? worker.id}
        status={<StatusPill tone={WORKER_STATUS_TONE[worker.status]} label={WORKER_STATUS_LABEL[worker.status]} />}
        actions={canEditWorker ? undefined : (
          <p className={`max-w-xs text-right text-xs ${textColor('ink-muted')}`}>{WORKER_WRITE_DENIED_REASON}</p>
        )}
        tabs={tabs}
        activeTabId={activeTabId}
        onTabChange={setActiveTabId}
      />
    </AppShell>
  )
}

function DetailField({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <dt className={`text-xs font-medium ${textColor('ink-muted')}`}>{label}</dt>
      <dd className={`text-sm ${textColor('ink')}`}>{value}</dd>
    </div>
  )
}

function EnterQualificationAction({ canWrite, onOpen }: { readonly canWrite: boolean; readonly onOpen: () => void }) {
  const controlId = 'worker-lifecycle-enter-qualification'
  if (canWrite) {
    return (
      <button
        type="button"
        data-control-id={controlId}
        onClick={onOpen}
        className={`${radiusClass('md')} ${bg('accent')} px-3 py-2 text-sm font-medium text-[var(--accent-ink)]`}
      >
        Enter qualification
      </button>
    )
  }
  return (
    <div className="flex max-w-xs flex-col items-end gap-1">
      <button
        type="button"
        disabled
        aria-describedby={`${controlId}-reason`}
        data-control-id={controlId}
        className={`cursor-not-allowed ${radiusClass('md')} border ${borderColor('border-strong')} ${bg('sunken')} px-3 py-2 text-sm font-medium ${textColor('ink-subtle')}`}
      >
        Enter qualification
      </button>
      <p id={`${controlId}-reason`} className={`text-right text-xs ${textColor('ink-muted')}`}>
        {QUALIFICATION_WRITE_DENIED_REASON}
      </p>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────── *
 * Two small local field components — no multi-select or nullable-date
 * primitive exists in `src/ui/product/fields/*` yet (Task 11's own set is
 * `TextField`/`NumberField`/`SelectField`/`DateField`/`CheckboxField`/
 * `RadioGroup`/`TextArea`, none of them array- or null-valued). Built on the
 * same `useFieldBinding`/`FieldShell` join point every field in that
 * directory uses, own layout — the same "own layout, not `FieldShell`"
 * choice `CheckboxField.tsx` makes for the identical reason (a checkbox
 * group's chrome does not fit a single-`<label htmlFor>` shell).
 * ────────────────────────────────────────────────────────────────────── */

function AreaMultiSelect({
  name,
  label,
  hint,
  required,
  options,
}: {
  readonly name: string
  readonly label: string
  readonly hint?: string
  readonly required?: boolean
  readonly options: readonly { readonly value: string; readonly label: string }[]
}) {
  const bound = useFieldBinding<string[]>(name, undefined, undefined, undefined, [])
  const invalid = bound.error !== undefined
  const selected = new Set(bound.value ?? [])
  function toggle(id: string): void {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    bound.onChange([...next])
  }
  return (
    <fieldset
      className="flex flex-col gap-1"
      aria-describedby={describedByFor(bound.controlId, hint !== undefined, invalid)}
      aria-invalid={invalid ? 'true' : undefined}
    >
      <legend className={`text-sm font-medium ${textColor('ink')}`}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </legend>
      <div className="flex flex-col gap-1">
        {options.length === 0 ? (
          <p className={`text-xs ${textColor('ink-muted')}`}>No active Areas exist yet in this tenant.</p>
        ) : (
          options.map((opt) => {
            const id = `${bound.controlId}-${opt.value}`
            return (
              <div key={opt.value} className="flex items-center gap-2">
                <input
                  id={id}
                  type="checkbox"
                  checked={selected.has(opt.value)}
                  onChange={() => toggle(opt.value)}
                  data-control-id={id}
                  className="h-4 w-4"
                />
                <label htmlFor={id} className={`text-sm ${textColor('ink')}`}>
                  {opt.label}
                </label>
              </div>
            )
          })
        )}
      </div>
      {hint !== undefined ? (
        <p id={hintIdFor(bound.controlId)} className={`text-xs ${textColor('ink-muted')}`}>
          {hint}
        </p>
      ) : null}
      {bound.error !== undefined ? (
        <p id={errorIdFor(bound.controlId)} className={`text-xs font-medium ${statusText('danger')}`}>
          {bound.error}
        </p>
      ) : null}
    </fieldset>
  )
}

/**
 * A required `Stamp` date field — `DateField` (`@/ui/product`) exists but
 * this build's own copy is required-only (`Qualification.expiryDate` is
 * `nullable()` in the schema, for a future recertification-lineage case;
 * this entry form's own happy path — L27602: "Sam ... enters a qualification
 * with its type, its per-Area scope, its certification date and its expiry
 * date" — always supplies one, so no "no expiry" toggle is built here; add
 * one if a real permanent-certification case surfaces).
 */
function DateFieldLocal({
  name,
  label,
  hint,
  required,
}: {
  readonly name: string
  readonly label: string
  readonly hint?: string
  readonly required?: boolean
}) {
  const bound = useFieldBinding<string>(name, undefined, undefined, undefined)
  const invalid = bound.error !== undefined
  const dateOnly = bound.value !== undefined && bound.value !== null ? bound.value.slice(0, 10) : ''
  return (
    <FieldShell label={label} controlId={bound.controlId} hint={hint} error={bound.error} required={required}>
      <input
        id={bound.controlId}
        name={name}
        type="date"
        value={dateOnly}
        required={required}
        onChange={(e) => bound.onChange(e.target.value === '' ? '' : `${e.target.value}T00:00:00Z`)}
        aria-describedby={describedByFor(bound.controlId, hint !== undefined, invalid)}
        aria-invalid={invalid ? 'true' : undefined}
        data-control-id={bound.controlId}
        className={`${radiusClass('md')} border ${invalid ? 'border-[var(--status-danger)]' : borderColor('border-strong')} ${bg('surface')} px-3 py-2 text-sm ${textColor('ink')}`}
      />
    </FieldShell>
  )
}
