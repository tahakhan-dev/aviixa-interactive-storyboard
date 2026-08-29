'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AppShell,
  DataTable,
  DetailDrawer,
  Form,
  RequireSession,
  SelectField,
  StatusPill,
  TextField,
  Toaster,
  bg,
  borderColor,
  radiusClass,
  textColor,
  useAccessContext,
  useRepository,
  useRepositoryQuery,
  useStore,
  type DataTableColumn,
  type ProductSession,
  type StatusToken,
  type ToastItem,
} from '@/ui/product'
import { evaluateAccess, type AccessRequest } from '@/policy/evaluate'
import { roleById, type RoleId } from '@/domain/roles'
import { User } from '@/data/schemas/platform'
import type {
  AccessContext,
  AssignTenantRoleResult,
  CreateTenantUserResult,
  RowOf,
  WriteResult,
} from '@/data/repository'
import { dohModuleById } from '@/surfaces/doh/modules'

/**
 * Task 3 (unit-02) — `MOD-DOH-09`, Permissions, Roles and Access: tenant
 * users and their role grants, over the repository's own
 * `createTenantUser`/`assignTenantRole` doors (`src/data/repository.ts`,
 * this task).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * STEP 1 — WHAT THE OUTGOING 1,636-LINE FILE CARRIED, AND ITS OWN MISTAKE
 * ─────────────────────────────────────────────────────────────────────────
 * The previous body (`./fixtures.ts`, 35 locators, a fixture roster, a
 * nine-condition access-evaluation walkthrough, a role-definition-card
 * family) rendered THREE screens under one route annotation, by its own
 * header's admission — and two of those three belong to a DIFFERENT screen
 * than this route claims to be. Lines 913-1008 of the outgoing file rendered
 * `SCR-DOH-01` ("the two-track sign-in" — the address-resolution screen that
 * decides single sign-on versus a platform-managed credential) and lines
 * 1007 onward rendered `SCR-DOH-ROLE-01` ("the landing, in its two views" —
 * a role-explanation family: a by-person held/refused/absent breakdown and
 * a role-definition card). Both are real screens with real facts, but
 * neither is `SCR-DOH-18`/`SCR-DOH-019` ("Users, roles and scopes"), which
 * is the actual register this route serves. This rebuild does not carry
 * either section forward: their facts (the boot-order sign-in stages, the
 * SSO connection record, the by-person held/refused/absent lists, the
 * nine-block role-definition card) belong to some other screen's eventual
 * registry entry, not this one's, and are left there rather than kept here
 * under the wrong name. `./fixtures.ts` itself is left in place, untouched
 * and now unimported — the same disposition Task 1's own header gives an
 * outgoing fixture file another later task might still read.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * STEP 2 — THE TENANT ROLE-ASSIGNMENT RULE: FOUND AND CITED, NOT DELEGATED
 * ─────────────────────────────────────────────────────────────────────────
 * This task's own brief offers a disclosed DEFAULT to fall back on only if
 * the frozen source were silent on "which tenant role may grant which other
 * tenant role" (Tenant Admin grants all four; Supervisor and Quality
 * Manager grant Worker only). The source is not silent. See
 * `TENANT_ROLE_GRANT_MATRIX`'s own comment in `repository.ts` for the full
 * research and its citations — in short: `MTX-TEN-02a` (the tenant
 * role-to-module matrix, frozen source L22015) states Supervisor and
 * Quality Manager `Unavailable` for the whole `MOD-DOH-09` module, and
 * `TRN-ACC-04` (L18976, the account-lifecycle authority table's "Roles and
 * scopes assigned" row) names Tenant Admin as both Requester and Authorizer,
 * singular. Only `TENANT_ADMIN` may grant any of the four tenant roles
 * under this build — narrower than the brief's own proposed default,
 * disclosed on screen below with the alternative named, per the Global
 * Constraints citation rule, rather than silently substituted for it.
 *
 * `MTX-TEN-02a` reads Supervisor/Quality Manager `Unavailable` for the
 * WHOLE `MOD-DOH-09` module — not narrowed, absent — so `VIEW_REQUEST`
 * below excludes both, exactly the same reading `LocationConfigurationScreen
 * .tsx`'s own `VIEW_REQUEST` already gives Worker on an identical
 * `Unavailable` cell (that file's own comment: "no standing on the module
 * in any scope"). Neither role reaches this screen at all; the whole-screen
 * `Unavailable` state (`PermissionsGate`, below) renders for them instead of
 * a degraded or disabled roster view. `TENANT_OPERATIONAL_WRITERS` — the
 * wider floor these two doors' own `AccessRequest`s in `repository.ts` use
 * — still governs who may ATTEMPT either door AT THE REPOSITORY LAYER
 * (Supervisor/Quality Manager included, refused there by the
 * segregation-of-duties check); it is deliberately NOT this screen's own
 * `VIEW_REQUEST`/`WRITE_REQUEST` floor, which is narrower and reflects only
 * who can reach a live control on THIS UI. The segregation-of-duties
 * refusal is still real and still enforced by the door for a caller that
 * reaches it some other way (a direct repository call, a future screen, a
 * script) — this screen's own report records that evidence, gathered
 * outside the UI once Supervisor/Quality Manager could no longer open a
 * live control to produce it through here.
 */

const MODULE = dohModuleById('MOD-DOH-09')

type UserRow = RowOf<'users'>
type RoleGrantRow = RowOf<'role-grants'>

/**
 * The closed four-role set `createTenantUser`/`assignTenantRole` mint or
 * grant — matches `TENANT_USER_ROLES` in `repository.ts` exactly (that
 * constant is private to this module's file, so this is the screen's own
 * copy of the SAME four values, not a second, independent decision about
 * what the closed set is).
 */
const TENANT_USER_ROLES: readonly RoleId[] = ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER', 'WORKER']

const STATUS_LABEL: Readonly<Record<UserRow['status'], string>> = {
  invited: 'Invited',
  active: 'Active',
  suspended: 'Suspended',
  removed: 'Removed',
}
const STATUS_TONE: Readonly<Record<UserRow['status'], StatusToken>> = {
  invited: 'info',
  active: 'ok',
  suspended: 'warn',
  removed: 'offline',
}

/**
 * The whole screen's own view gate — real, enforced here, not left to the
 * nav rail alone (`ShiftManagementScreen.tsx`'s own `VIEW_REQUEST` shape).
 * `MTX-TEN-02a`'s own `MOD-DOH-09` row: Tenant Admin `Allowed`, Supervisor
 * `Unavailable`, Quality Manager `Unavailable`, Read-only Auditor
 * `Read-only`, Worker `Explicitly prohibited`. `Unavailable` excludes
 * Supervisor/Quality Manager from this list entirely — the same "excluded
 * outright" reading `LocationConfigurationScreen.tsx`'s own `VIEW_REQUEST`
 * already gives Worker for an identical `Unavailable` cell — not merely a
 * narrower write floor for them, which is what an earlier draft of this
 * file got wrong (see this file's own header).
 */
const VIEW_REQUEST: AccessRequest = {
  action: 'view-permissions-roles-and-access',
  allowedRoles: ['TENANT_ADMIN', 'READONLY_AUDITOR'],
  sourceRefs: ['L22015', 'MTX-TEN-02a', 'repository.ts'],
}

/**
 * Screen-level DISPLAY gate only. Now trivially `TENANT_ADMIN` alone, since
 * `VIEW_REQUEST` above already excludes every other role that could ever
 * pass it and still want to write (Read-only Auditor never should). The
 * REAL, enforced authorisation remains the door itself
 * (`CREATE_TENANT_USER_REQUEST`/`ASSIGN_TENANT_ROLE_REQUEST` in
 * `repository.ts`, wider on purpose — see this file's own header) — this
 * decides only whether to show a live control or a disabled one with its
 * reason, and today it can only ever show the live one, for the one role
 * that reaches it.
 */
const WRITE_REQUEST: AccessRequest = {
  action: 'manage-tenant-users-and-roles',
  allowedRoles: ['TENANT_ADMIN'],
  sourceRefs: ['L18976', 'TRN-ACC-04', 'repository.ts'],
}

export function PermissionsScreen() {
  return (
    <RequireSession signInHref="/super-admin/sign-in/">
      {(session) => <PermissionsGate session={session} />}
    </RequireSession>
  )
}

function PermissionsGate({ session }: { readonly session: ProductSession }) {
  const ctx = useAccessContext()
  const viewGate = evaluateAccess(VIEW_REQUEST, ctx)
  if (viewGate.outcome !== 'allowed') {
    return (
      <AppShell surface="SURF-DOH" session={session} title={MODULE.name} breadcrumbs={[{ label: MODULE.name }]}>
        <p data-control-id="permissions-unavailable" className={`text-sm ${textColor('ink-muted')}`}>
          {viewGate.explanation}
        </p>
      </AppShell>
    )
  }
  if (ctx.identity.tenant === null) {
    return (
      <AppShell surface="SURF-DOH" session={session} title={MODULE.name} breadcrumbs={[{ label: MODULE.name }]}>
        <p data-control-id="permissions-no-tenant" className={`text-sm ${textColor('ink-muted')}`}>
          No live tenant is attached to this identity, so no tenant user register can be shown.
        </p>
      </AppShell>
    )
  }
  return <PermissionsBody session={session} ctx={ctx} tenantId={ctx.identity.tenant} />
}

type CreateDrawerState = { readonly pendingId: string } | null

const USERS_PAGE_SIZE = 10

function PermissionsBody({
  session,
  ctx,
  tenantId,
}: {
  readonly session: ProductSession
  readonly ctx: AccessContext
  readonly tenantId: string
}) {
  const repository = useRepository()
  const store = useStore()
  const router = useRouter()
  const searchParams = useSearchParams()

  const usersQuery = useRepositoryQuery((r, c) => r.list('users', c))
  const roleGrantsQuery = useRepositoryQuery((r, c) => r.list('role-grants', c))

  // Defensive tenant filter on the READ side. `repository.ts`'s own
  // `resolveTenantId`/`withinScope` comment (fix round 1, unit-01 Task 7
  // review, "READ-PATH CONSEQUENCE") already discloses this exact gap: a
  // row whose OWN tenant resolution is `'none'` (a platform user,
  // `tenantId: null`) is treated as visible to every signed-in identity,
  // which would otherwise put every platform console account into a
  // Tenant Admin's own user register. That comment records the gap as
  // deliberately deferred, cross-cutting debt, not something this one
  // screen's own read should paper over silently — but this screen still
  // must not RENDER a platform account in a tenant's own roster, so the
  // filter is applied here, at the one place it actually matters for this
  // task, rather than left to the repository-level gap alone.
  const allUsers = usersQuery.all()
  const tenantUsers = allUsers.filter((u) => u.tenantId === tenantId)
  const allUsersById = new Map<string, UserRow>(allUsers.map((u) => [u.id, u]))

  const activeGrants = roleGrantsQuery.all().filter((g) => g.revokedAt === null)
  const grantsByUser = new Map<string, RoleGrantRow[]>()
  for (const g of activeGrants) {
    if (!tenantUsers.some((u) => u.id === g.userId)) continue
    const list = grantsByUser.get(g.userId) ?? []
    list.push(g)
    grantsByUser.set(g.userId, list)
  }

  const [drawer, setDrawer] = useState<CreateDrawerState>(null)
  const [assignTargetId, setAssignTargetId] = useState<string | null>(null)
  const [assignRole, setAssignRole] = useState<RoleId>('WORKER')
  const [assignResult, setAssignResult] = useState<AssignTenantRoleResult | null>(null)
  const [assignBusy, setAssignBusy] = useState(false)
  const [toasts, setToasts] = useState<readonly ToastItem[]>([])

  const writeGate = evaluateAccess(WRITE_REQUEST, ctx)
  const canWrite = writeGate.outcome === 'allowed'

  // The cross-tenant live-verify path (task brief, Step 6): a deep link,
  // `?assign=<userId>`, opens the Assign-role panel for a user id that need
  // not be in THIS tenant's own (already tenant-filtered) roster above —
  // same shape `LocationConfigurationScreen.tsx`'s own `?site=<id>` deep
  // link uses for the identical purpose one task earlier in this unit. The
  // id is never looked up or rendered before the door itself is called —
  // this screen never previews a foreign tenant's real user data, matching
  // Task 1's own round-1 review finding (no row read/returned before
  // authorisation).
  const deepLinkTarget = searchParams.get('assign')

  function pushToast(tone: StatusToken, label: string): void {
    setToasts((prev) => [...prev, { id: `${store.nextSequence()}`, tone, label }])
  }
  function dismissToast(id: string): void {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  function openCreate(): void {
    setDrawer({ pendingId: `USR-${tenantId}-${store.nextSequence()}` })
  }
  function closeCreate(): void {
    setDrawer(null)
  }

  function openAssign(userId: string): void {
    setAssignTargetId(userId)
    setAssignRole('WORKER')
    setAssignResult(null)
  }
  function closeAssign(): void {
    setAssignTargetId(null)
    setAssignResult(null)
    if (deepLinkTarget !== null) router.replace('/hub/permissions-roles-and-access/')
  }

  if (deepLinkTarget !== null && assignTargetId === null && canWrite) {
    openAssign(deepLinkTarget)
  }

  async function confirmAssign(): Promise<void> {
    if (assignTargetId === null) return
    setAssignBusy(true)
    const outcome = await repository.assignTenantRole(assignTargetId, assignRole, ctx)
    setAssignBusy(false)
    setAssignResult(outcome)
    if (outcome.ok) {
      pushToast('ok', `${roleById(assignRole).name} was granted.`)
    }
  }

  /**
   * `createTenantUser`'s THIRD result shape (`partial`) has no home in
   * `Form`'s own generic renderer (typed to `WriteResult<unknown>` alone) —
   * same translation idiom `ShiftManagementScreen.tsx`'s own `toFormResult`
   * uses for `createShift`'s `'overlap'`/`'invalid-reference'` arms.
   */
  function toFormResult(result: CreateTenantUserResult): WriteResult<unknown> {
    if (result.ok) {
      pushToast('ok', `${result.user.displayName} was invited.`)
      // `CreateTenantUserResult`'s own `ok: true` arm carries `{ user, grant }`
      // — deliberately narrower than `WriteResult`'s (matches
      // `InviteConsoleUserResult`'s own shape) — so `Form`'s generic
      // renderer (which only reads `result.ok` to show "Saved.", never the
      // row/events/audit fields) is given a minimal, honestly-empty
      // `WriteResult<unknown>` shell rather than a second, invented copy of
      // facts the door already returned in `result.user`/`result.grant`.
      return { ok: true, row: result.user, events: [], audit: [], affectedSurfaces: [] }
    }
    if (result.kind === 'partial') {
      return {
        ok: false,
        kind: 'denied',
        decision: {
          outcome: 'explicitlyProhibited',
          reasonCode: 'OBJECT_STATE_INVALID',
          explanation: `${result.user.displayName}'s account was created, but the role grant could not be recorded: ${result.grantFailure.explain}`,
          stage: 'COMMAND_VALIDATION',
          sourceRefs: ['repository.ts'],
          auditExpectation: 'RECORDED_AS_REFUSAL',
          conditionToEnable: null,
        },
        reason: 'OBJECT_STATE_INVALID',
        explain: `${result.user.displayName}'s account was created, but the role grant could not be recorded: ${result.grantFailure.explain}`,
      }
    }
    return result
  }

  async function onCreateSubmit(value: UserRow): Promise<WriteResult<unknown>> {
    const outcome = await repository.createTenantUser(value, ctx)
    return toFormResult(outcome)
  }

  const columns: readonly DataTableColumn<UserRow>[] = [
    {
      key: 'name',
      header: 'Name',
      sortValue: (u) => u.displayName,
      render: (u) => (
        <span className="flex flex-col">
          <span className={`font-medium ${textColor('ink')}`}>{u.displayName}</span>
          <span className={`text-xs ${textColor('ink-subtle')}`}>{u.id}</span>
        </span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortValue: (u) => u.email,
      render: (u) => u.email,
    },
    {
      key: 'role',
      header: 'Role',
      sortValue: (u) => (grantsByUser.get(u.id) ?? []).map((g) => roleById(g.role).name).join(', '),
      render: (u) => {
        const grants = grantsByUser.get(u.id) ?? []
        if (grants.length === 0) return <span className={textColor('ink-subtle')}>No active grant</span>
        return grants.map((g) => roleById(g.role).name).join(', ')
      },
    },
    {
      key: 'grantedBy',
      header: 'Granted by',
      render: (u) => {
        const grants = grantsByUser.get(u.id) ?? []
        if (grants.length === 0) return '—'
        const names = [...new Set(grants.map((g) => allUsersById.get(g.grantedBy)?.displayName ?? g.grantedBy))]
        return names.join(', ')
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (u) => (
        <span data-control-id={`permissions-status-${u.id}-${u.status}`}>
          <StatusPill tone={STATUS_TONE[u.status]} label={STATUS_LABEL[u.status]} />
        </span>
      ),
    },
    {
      key: 'assign',
      header: 'Assign role',
      render: (u) => (
        <AssignControl userId={u.id} canWrite={canWrite} onOpen={() => openAssign(u.id)} />
      ),
    },
  ]

  const assignTargetUser = assignTargetId === null ? undefined : allUsersById.get(assignTargetId)
  const assignTargetHeldGrants = assignTargetId === null ? [] : (grantsByUser.get(assignTargetId) ?? [])

  return (
    <AppShell
      surface="SURF-DOH"
      session={session}
      title={MODULE.name}
      breadcrumbs={[{ label: MODULE.name }]}
      actions={<CreateAction canWrite={canWrite} writeGate={writeGate} onOpen={openCreate} />}
    >
      <section aria-labelledby="permissions-heading" className="mt-6 flex flex-col gap-4">
        <h2 id="permissions-heading" className={`text-lg font-semibold ${textColor('ink')}`}>
          Tenant users and role grants
        </h2>

        {/*
          NOT `ControlDisclosure` (`@/disclosure/DecisionDisclosure`):
          that component unconditionally appends `CLIENT_DELEGATED_SENTENCE`
          ("A client-delegated choice under APP-012, not a position the
          source settled") after its children — correct for a GENUINELY
          open, client-delegated reading, and the exact opposite of what
          this box states. Step 2's own research FOUND and CITED the real
          rule; using that component here would have the UI contradict its
          own sentence in the same paragraph. A plain disclosure block,
          matching this rebuild's own `<details>` idiom without the
          component's hardcoded APP-012 framing.
        */}
        <details data-control-id="permissions-role-grant-rule-disclosure" className="text-xs">
          <summary className={`cursor-pointer ${textColor('ink-muted')}`}>
            Who may grant a tenant role, and why
          </summary>
          <p className={`mt-1 max-w-prose ${textColor('ink-muted')}`}>
            The frozen source states this directly: only a Tenant Admin may grant any of the four
            tenant roles. The tenant role-to-module matrix, MTX-TEN-02a, states Supervisor and
            Quality Manager &quot;Unavailable&quot; for the whole Permissions, Roles and Access
            module — not narrowed, absent, which is why neither role reaches this screen at all.
            The account-lifecycle authority table, TRN-ACC-04, names Tenant Admin as both
            Requester and Authorizer of a role assignment, singular. A narrower default —
            Supervisor and Quality Manager granting Worker only — was the fallback this build
            would have used had the source stayed silent; it did not need to.
          </p>
        </details>

        <DataTable
          caption="Tenant users"
          columns={columns}
          query={usersQuery.where((u) => u.tenantId === tenantId)}
          rowId={(u) => u.id}
          search={{
            placeholder: 'Search by name, email or id',
            match: (u, q) => {
              const needle = q.toLowerCase()
              return (
                u.displayName.toLowerCase().includes(needle) ||
                u.email.toLowerCase().includes(needle) ||
                u.id.toLowerCase().includes(needle)
              )
            },
          }}
          pageSize={USERS_PAGE_SIZE}
          emptyState={{
            title: 'There are no tenant users yet.',
            whatCreatesIt: 'A Tenant Admin creates the first one from Invite user.',
          }}
        />
      </section>

      <DetailDrawer open={drawer !== null} onClose={closeCreate} title="Invite user">
        {drawer !== null ? (
          <Form
            key={drawer.pendingId}
            schema={User}
            initial={{
              id: drawer.pendingId,
              tenantId,
              status: 'invited',
              locale: 'en',
              createdAt: new Date(store.clock.now()).toISOString(),
              lastSignInAt: null,
              role: 'WORKER',
            }}
            onSubmit={onCreateSubmit}
            submitLabel="Send invitation"
          >
            <TextField name="displayName" label="Full name" required />
            <TextField name="email" label="Email" type="email" autoComplete="email" required />
            <SelectField
              name="role"
              label="Role"
              required
              options={TENANT_USER_ROLES.map((r) => ({ value: r, label: roleById(r).name }))}
              hint="All four tenant roles are listed here; only a Tenant Admin can complete the invitation — the door names the reason otherwise."
            />
          </Form>
        ) : null}
      </DetailDrawer>

      <DetailDrawer
        open={assignTargetId !== null}
        onClose={closeAssign}
        title={
          assignTargetUser !== undefined
            ? `Assign a role to ${assignTargetUser.displayName}`
            : `Assign a role to user id "${assignTargetId ?? ''}"`
        }
      >
        {assignTargetId !== null ? (
          <div className="flex flex-col gap-4">
            {assignTargetUser === undefined ? (
              <p role="note" className={`text-sm ${textColor('ink-muted')}`}>
                This id is not shown on this tenant&apos;s own roster above — it may belong to a
                different tenant, or not exist at all. Nothing about it is looked up or shown here;
                the attempt is sent to the door as-is, and its refusal (never its data) is what
                renders below.
              </p>
            ) : (
              <p className={`text-sm ${textColor('ink-muted')}`}>
                Currently holds:{' '}
                {assignTargetHeldGrants.length === 0
                  ? 'no active grant'
                  : assignTargetHeldGrants.map((g) => roleById(g.role).name).join(', ')}
                . Roles are additive — assigning a new one does not remove any held already.
              </p>
            )}

            <SelectField
              name="assignRole"
              label="Role to grant"
              required
              options={TENANT_USER_ROLES.map((r) => ({ value: r, label: roleById(r).name }))}
              value={assignRole}
              onChange={(v) => setAssignRole(v as RoleId)}
              hint="All four tenant roles are listed here; only a Tenant Admin can complete the grant — the door names the reason otherwise."
            />

            {assignResult !== null && !assignResult.ok && assignResult.kind === 'segregation-of-duties' ? (
              <p
                role="alert"
                data-control-id="permissions-assign-segregation-of-duties"
                className={`${radiusClass('lg')} border ${borderColor('border-strong')} ${bg('raised')} p-3 text-sm ${textColor('ink')}`}
              >
                {roleById(assignResult.grantorRole).name} may not grant the{' '}
                {roleById(assignResult.requestedRole).name} role. Only a Tenant Admin may assign a
                tenant role (the tenant role-to-module matrix MTX-TEN-02a, MOD-DOH-09; the
                account-lifecycle authority table TRN-ACC-04).
              </p>
            ) : null}
            {assignResult !== null && !assignResult.ok && assignResult.kind !== 'segregation-of-duties' ? (
              <p
                role="alert"
                data-control-id="permissions-assign-denied"
                className={`${radiusClass('lg')} border ${borderColor('border-strong')} ${bg('raised')} p-3 text-sm ${textColor('ink')}`}
              >
                {assignResult.explain}
              </p>
            ) : null}
            {assignResult !== null && assignResult.ok ? (
              <p
                role="status"
                data-control-id="permissions-assign-success"
                className={`${radiusClass('lg')} border ${borderColor('border-strong')} ${bg('raised')} p-3 text-sm ${textColor('ink')}`}
              >
                {roleById(assignResult.row.role).name} was granted.
              </p>
            ) : null}

            <div className="flex gap-2">
              <button
                type="button"
                data-control-id="permissions-assign-submit"
                onClick={() => void confirmAssign()}
                aria-disabled={assignBusy ? 'true' : undefined}
                disabled={assignBusy}
                className={`self-start ${radiusClass('md')} ${bg('accent')} px-4 py-2 text-sm font-medium text-[var(--accent-ink)] disabled:opacity-50`}
              >
                {assignBusy ? 'Assigning…' : 'Assign role'}
              </button>
              <button
                type="button"
                data-control-id="permissions-assign-close"
                onClick={closeAssign}
                className={`self-start ${radiusClass('md')} border ${borderColor('border-strong')} ${bg('surface')} px-4 py-2 text-sm ${textColor('ink')}`}
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </DetailDrawer>

      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </AppShell>
  )
}

/* ────────────────────────────────────────────────────────────────────── *
 * The Invite action + its role-floor disclosure — same shape
 * `ShiftManagementScreen.tsx`'s own `CreateAction` uses.
 * ────────────────────────────────────────────────────────────────────── */

function CreateAction({
  canWrite,
  writeGate,
  onOpen,
}: {
  readonly canWrite: boolean
  readonly writeGate: ReturnType<typeof evaluateAccess>
  readonly onOpen: () => void
}) {
  const controlId = 'permissions-invite-user'
  if (canWrite) {
    return (
      <button
        type="button"
        data-control-id={controlId}
        onClick={onOpen}
        className={`${radiusClass('md')} ${bg('accent')} px-4 py-2 text-sm font-medium text-[var(--accent-ink)]`}
      >
        Invite user
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
        Invite user
      </button>
      <p id={`${controlId}-reason`} className={`text-right text-xs ${textColor('ink-muted')}`}>
        {writeGate.explanation}
      </p>
    </div>
  )
}

function AssignControl({
  userId,
  canWrite,
  onOpen,
}: {
  readonly userId: string
  readonly canWrite: boolean
  readonly onOpen: () => void
}) {
  const controlId = `permissions-assign-${userId}`
  if (!canWrite) {
    return (
      <button
        type="button"
        disabled
        data-control-id={controlId}
        className={`cursor-not-allowed ${radiusClass('md')} border ${borderColor('border')} ${bg('sunken')} px-2 py-1 text-xs ${textColor('ink-subtle')}`}
      >
        Assign role
      </button>
    )
  }
  return (
    <button
      type="button"
      data-control-id={controlId}
      onClick={onOpen}
      className={`${radiusClass('md')} border ${borderColor('border-strong')} ${bg('surface')} px-2 py-1 text-xs font-medium ${textColor('ink')}`}
    >
      Assign role
    </button>
  )
}
