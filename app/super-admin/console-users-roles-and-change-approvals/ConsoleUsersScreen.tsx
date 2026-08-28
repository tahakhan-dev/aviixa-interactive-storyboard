'use client'

import { useState } from 'react'
import {
  AppShell,
  ConfirmDialog,
  DataTable,
  DetailDrawer,
  RequireSession,
  StatusPill,
  TextArea,
  TextField,
  RadioGroup,
  bg,
  borderColor,
  radiusClass,
  statusVar,
  textColor,
  useAccessContext,
  useRepository,
  useRepositoryQuery,
  useStore,
  type DataTableColumn,
  type FilterDef,
  type ProductSession,
  type StatusToken,
} from '@/ui/product'
import { LiveRegion } from '@/ui/primitives'
import { evaluateAccess } from '@/policy/evaluate'
import { roleById, rolesInDomain, type RoleId } from '@/domain/roles'
import { User } from '@/data/schemas/platform'
import type { AccessContext, Query, Repository, RowOf, WriteResult } from '@/data/repository'
import type { Store } from '@/data/store'
import { saModuleById } from '@/surfaces/sa/modules'
import { CRITICAL_ACTIONS, CRITICAL_ACTION_COUNT_NOTE } from '@/surfaces/sa/critical-actions'

/**
 * Task 7 (unit-01) — console users and the maker-checker change-approval
 * queue, `MOD-SA-08`. Replaces the previous 1,180-line document-style body
 * (`SA_INVARIANTS`, `ACCESS_CLASSES`, `APPROVAL_REQUESTS` fixtures, a
 * thirteen-state screen-state radio group) with two real regions: a
 * `DataTable` of platform-role accounts, and the approval queue built to
 * `SB-HO-004`.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * BEFORE-STATE — what the outgoing screen asserted, in its own words
 * ─────────────────────────────────────────────────────────────────────────
 * Quoted from the file this replaces (git holds it): a `WriteMode`/
 * `AggregateMode` pair driven by a thirteen-member `ScreenStateId` radio
 * group standing in for a real signed-in identity and a real repository;
 * `namedReason()` translating a `PermissionDecision` into module-local
 * prose citing `AC-SA-08-06 (L44880)`, `AC-SA-08-05 (L44879)`, and
 * `ROOT_FREEZE_HEADLINE`/`DEC-ROOTSUCC-001`; fixture arrays
 * `CONSOLE_ACCOUNTS`, `APPROVAL_REQUESTS`, `SA08_PLATFORM_ROLES`,
 * `SA08_ABSENT_CONTROLS`, `SA08_SOURCE_CONFLICTS`,
 * `SA08_UNSPECIFIED_IN_SOURCE`, `SA08_WORKFLOWS`, `MATRIX_CONFIGURATION_VERSION`/
 * `MATRIX_TOKEN_LABEL`/`matrixCell()` for a roles-matrix export, and
 * `QUEUE_AS_OF`/`QUEUE_ORIGIN`/`QUEUE_STALE_AS_OF`/`REREAD_RECORD_COUNT` for
 * a staleness-recovery narrative. None of this was a real account, a real
 * request, or a real write — every row was a fixture object picked by
 * which of the thirteen states a `<select>` held.
 *
 * WHERE EACH FACT NOW LIVES.
 *  - `CONSOLE_ACCOUNTS` → the seven real platform-role rows in
 *    `src/data/collections/users.json` (`tenantId: null`), read live below.
 *  - `APPROVAL_REQUESTS`, `APPROVAL_STATES`, `CHANGE_CLASSES`, `AGE_BANDS`,
 *    `ROOT_SELF_APPROVAL_NOTE` → `OBJ-APPROVAL-REQUEST`, a real first-class
 *    collection this task adds (`src/data/schemas/platform.ts#ApprovalRequest`,
 *    `src/data/collections/approval-requests.json`), not audit rows and not
 *    fixtures.
 *  - `namedReason()`'s citations (`AC-SA-08-05`, `AC-SA-08-06`) → the real
 *    `evaluateAccess` gates below carry the same citations as `sourceRefs`,
 *    and the SEGREGATION_OF_DUTIES/ROLE_NOT_GRANTED reason codes they
 *    produce are the evaluator's own, not a module-local re-statement.
 *  - `ROOT_ACCOUNT_RULE`, `ROOT_FREEZE_HEADLINE`, `ROOT_FROZEN_CAPABILITIES`
 *    → the root-invariant statements rendered in the Console users section
 *    below, and the reachable second-root refusal on the invite form.
 *  - `CRITICAL_ACTIONS`, `CRITICAL_ACTION_COUNT_NOTE` (`@/surfaces/sa/critical-actions`)
 *    → reused as-is (imported, not re-derived): that module's own `D12`
 *    header already resolved the "ten in words, eleven when enumerated"
 *    contradiction (L4964/L21015/L55963/L55969 say ten; L55942/L15360's own
 *    written-out lists run to eleven, with L15360 explicitly saying pause
 *    and resume are separate acts) — this task's frozen-source table read
 *    (§8.8.3, L44722-44731) shows the SAME ten-row table with "Emergency
 *    pause, and resume, separately" as one row, so the contradiction is
 *    confirmed independently here, not merely inherited. Re-deriving a
 *    second count would risk a THIRD number; the existing, reviewed
 *    resolution is reused and its count note rendered on screen.
 *  - `SA08_PLATFORM_ROLES`, `MATRIX_CONFIGURATION_VERSION`/`MATRIX_TOKEN_LABEL`/
 *    `matrixCell()` (the Roles pane's live per-module matrix, `SCR-SA-12`'s
 *    second pane) → NOT carried forward. The task brief scopes this
 *    rewrite to "Console users" and "Change approvals" only; the live
 *    per-module roles matrix is real, cited, in-scope work this task does
 *    not touch and must not claim — carried here as a gap for a future
 *    task, not silently dropped.
 *  - `SA08_ABSENT_CONTROLS`, `SA08_SOURCE_CONFLICTS`, `SA08_UNSPECIFIED_IN_SOURCE`,
 *    `SA08_WORKFLOWS`, `QUEUE_AS_OF`/`QUEUE_ORIGIN`/`QUEUE_STALE_AS_OF`,
 *    `REREAD_RECORD_COUNT`, the thirteen-state `ScreenStateId` radio group →
 *    dropped outright. These narrated a *simulation* of staleness/failure/
 *    recovery states that never produced a real write; this rebuild's
 *    write path is real (`repository.update`), so `WriteResult`'s own
 *    `denied`/`persistence-unavailable` arms carry that job now, exactly as
 *    `TenantDetailScreen.tsx`'s `writeFeedback` does — no second, narrated
 *    state machine is needed beside a door that actually opens or refuses.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * TWO STORYBOARDS DISAGREE ON ONE CONTROL — FOLLOWED, NOT SILENTLY PICKED
 * ─────────────────────────────────────────────────────────────────────────
 * The dispatch instructs: Admin, Platform Engineer and Support see "Invite
 * console user" DISABLED with the plain-language reason, never hidden.
 * `SB-SA-08` (L44777, this module's own storyboard) says the opposite —
 * "the create control is visible only to the root and absent for everyone
 * else, rather than present and disabled, because a visible-but-disabled
 * create control invites a support ticket every week" — matching
 * `AC-SA-08-02` (L44876). But a SECOND, later storyboard for the identical
 * control, `SB-31-10` (L76133, "the Users and Roles panes"), says the
 * dispatch's own reading verbatim: "The Create user control is visible to
 * every console role and enabled only for the root; for an Admin it
 * renders disabled with the reason User creation is root-only, which
 * teaches the model rather than hiding it." Both are real, cited frozen-
 * source storyboards for the SAME control, in direct conflict with each
 * other, independent of the dispatch. This build follows `SB-31-10` (the
 * dispatch's own reading, and the dominant "disabled, never hidden"
 * convention this whole rebuild already uses everywhere else —
 * `TenantsScreen.tsx`'s "Create tenant", `TenantDetailScreen.tsx`'s
 * "Activate") and records `SB-SA-08`'s disagreement here rather than
 * silently overriding it.
 */

const MODULE = saModuleById('MOD-SA-08')

type PlatformUser = RowOf<'users'>
type RoleGrant = RowOf<'role-grants'>
type ApprovalRequest = RowOf<'approval-requests'>
type ApprovalState = ApprovalRequest['state']
type ApprovalClass = ApprovalRequest['changeClass']
type Tenant = RowOf<'tenants'>
type EvalRow = RowOf<'evaluations'>

// Only the four platform roles ever render in this table (`platformUsersQuery`
// filters to `tenantId === null`); the tenant roles are here only because
// `RoleId` is a nine-member closed set and this map must be exhaustive over
// it. One uniform tone: the role NAME is what distinguishes Root from the
// other three, and a load-bearing colour would misstate the account as a
// data conflict, which is not what "exactly one root" means.
const ROLE_TONE: Readonly<Record<RoleId, StatusToken>> = {
  ROOT_SUPER_ADMIN: 'info',
  ADMIN: 'info',
  PLATFORM_ENGINEER: 'info',
  SUPPORT: 'info',
  TENANT_ADMIN: 'info',
  SUPERVISOR: 'info',
  QUALITY_MANAGER: 'info',
  READONLY_AUDITOR: 'info',
  WORKER: 'info',
}

const USER_STATUS_LABEL: Readonly<Record<PlatformUser['status'], string>> = {
  invited: 'Invited',
  active: 'Active',
  suspended: 'Suspended',
  removed: 'Removed',
}

const USER_STATUS_TONE: Readonly<Record<PlatformUser['status'], StatusToken>> = {
  invited: 'pending',
  active: 'ok',
  suspended: 'warn',
  removed: 'offline',
}

const CLASS_LABEL: Readonly<Record<ApprovalClass, string>> = {
  engineering: 'Engineering',
  critical: 'Critical',
}

/** SB-HO-004 (L23707): "Critical-class rows carry a red class chip." `danger` is this token layer's red. */
const CLASS_TONE: Readonly<Record<ApprovalClass, StatusToken>> = {
  engineering: 'info',
  critical: 'danger',
}

const STATE_LABEL: Readonly<Record<ApprovalState, string>> = {
  pending: 'Pending',
  approved: 'Approved',
  returned: 'Returned',
  applied: 'Applied',
}

const STATE_TONE: Readonly<Record<ApprovalState, StatusToken>> = {
  pending: 'pending',
  approved: 'info',
  returned: 'warn',
  applied: 'ok',
}

/** Engineering-class action types have no closed vocabulary in the source
 *  (unlike the eleven critical-class ids `@/surfaces/sa/critical-actions`
 *  carries) — labels for the ones this build's own seed uses. */
const ENGINEERING_ACTION_LABEL: Readonly<Record<string, string>> = {
  'atom-enablement': 'Atom enablement',
  'engineering-setting-change': 'Engineering setting change',
  'composed-agent-review': 'Composed-agent review',
}

function actionTypeLabel(request: ApprovalRequest): string {
  if (request.changeClass === 'critical') {
    return CRITICAL_ACTIONS.find((a) => a.id === request.actionType)?.name ?? request.actionType
  }
  return ENGINEERING_ACTION_LABEL[request.actionType] ?? request.actionType
}

/**
 * NOTIF-SA-08-04 (L44838): "The aging threshold ... is Not specified in the
 * Statement of Work ... TBD — Client Decision Required ... the
 * recommendation is scaling by class with the compliance-suspension and
 * device-wipe classes on the shortest interval." Scaling by class is a
 * further decision this build does not make; a single flat threshold for
 * every CRITICAL pending request is this build's own simplification of an
 * explicitly open decision, not a resolution of it — recorded here rather
 * than left unstated. Seventy-two hours is also the "older than three
 * days" age band below, so the aging flag and the age filter agree on one
 * number instead of two.
 */
const AGING_THRESHOLD_HOURS = 72

type AgeBand = 'today' | 'older-than-one-day' | 'older-than-three-days'

function ageBandFor(ageHours: number): AgeBand {
  if (ageHours < 24) return 'today'
  if (ageHours < AGING_THRESHOLD_HOURS) return 'older-than-one-day'
  return 'older-than-three-days'
}

const AGE_BAND_LABEL: Readonly<Record<AgeBand, string>> = {
  today: 'Today',
  'older-than-one-day': 'Older than one day',
  'older-than-three-days': 'Older than three days',
}

function ageLabel(ageHours: number): string {
  const days = Math.floor(ageHours / 24)
  if (days < 1) return 'Less than a day'
  return days === 1 ? '1 day' : `${days} days`
}

/** Platform time, never wall time — same shape every SA screen in this unit uses; no shared date-formatting module exists yet. */
function formatPlatformTime(ms: number): string {
  return `${new Date(ms).toLocaleString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })} platform time`
}

function fieldIssues<V>(schema: { safeParse: (v: V) => { success: boolean; error?: { issues: { message: string }[] } } }, value: V): string[] {
  const result = schema.safeParse(value)
  return result.success ? [] : (result.error?.issues.map((i) => i.message) ?? [])
}

/* ────────────────────────────────────────────────────────────────────── */

export function ConsoleUsersScreen() {
  return (
    <RequireSession signInHref="/super-admin/sign-in/">
      {(session) => <ConsoleUsersBody session={session} />}
    </RequireSession>
  )
}

function ConsoleUsersBody({ session }: { readonly session: ProductSession }) {
  const ctx = useAccessContext()
  const repository = useRepository()
  const store = useStore()
  const nowMs = store.clock.now()

  const usersQuery = useRepositoryQuery((r, c) => r.list('users', c))
  const roleGrants = useRepositoryQuery((r, c) => r.list('role-grants', c).all())
  const approvalsQuery = useRepositoryQuery((r, c) => r.list('approval-requests', c))
  const tenants = useRepositoryQuery((r, c) => r.list('tenants', c).all())
  const evaluationRows = useRepositoryQuery((r, c) => r.list('evaluations', c).all())

  const allUsers = usersQuery.all()
  const usersById = new Map(allUsers.map((u) => [u.id, u] as const))
  const tenantsById = new Map(tenants.map((t) => [t.id, t] as const))
  const platformUsersQuery = usersQuery.where((u) => u.tenantId === null)
  const platformUsers = platformUsersQuery.all()

  const currentUser = platformUsers.find((u) => u.displayName === ctx.actorOfRecord) ?? null

  return (
    <AppShell surface="SURF-SA" session={session} title={MODULE.name} breadcrumbs={[{ label: MODULE.name }]}>
      <ConsoleUsersSection
        ctx={ctx}
        repository={repository}
        store={store}
        platformUsersQuery={platformUsersQuery}
        usersById={usersById}
        roleGrants={roleGrants}
        currentUser={currentUser}
      />
      <ApprovalsSection
        ctx={ctx}
        repository={repository}
        nowMs={nowMs}
        approvalsQuery={approvalsQuery}
        usersById={usersById}
        tenantsById={tenantsById}
        evaluationRows={evaluationRows}
        currentUser={currentUser}
      />
    </AppShell>
  )
}

/* ────────────────────────────────────────────────────────────────────── *
 * Console users
 * ────────────────────────────────────────────────────────────────────── */

function grantedByLabel(user: PlatformUser, roleGrants: readonly RoleGrant[], usersById: ReadonlyMap<string, PlatformUser>): string {
  if (user.role === 'ROOT_SUPER_ADMIN') return 'Backend-created at platform commissioning'
  const grant = roleGrants.find((g) => g.userId === user.id && g.revokedAt === null)
  if (!grant) return 'Not recorded'
  return usersById.get(grant.grantedBy)?.displayName ?? grant.grantedBy
}

function formatLastSignIn(iso: string | null): string {
  if (iso === null) return 'Never signed in'
  const ms = Date.parse(iso)
  return Number.isNaN(ms) ? 'Unknown' : formatPlatformTime(ms)
}

interface InviteValues {
  readonly displayName: string
  readonly email: string
  readonly role: RoleId
}

function ConsoleUsersSection({
  ctx,
  repository,
  store,
  platformUsersQuery,
  usersById,
  roleGrants,
  currentUser,
}: {
  readonly ctx: AccessContext
  readonly repository: Repository
  readonly store: Store
  readonly platformUsersQuery: Query<PlatformUser>
  readonly usersById: ReadonlyMap<string, PlatformUser>
  readonly roleGrants: readonly RoleGrant[]
  readonly currentUser: PlatformUser | null
}) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [values, setValues] = useState<InviteValues>({ displayName: '', email: '', role: 'ADMIN' })
  const [attempted, setAttempted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<WriteResult<unknown> | null>(null)

  /**
   * §8.8.1/§8.8.2: user creation and role assignment are root-only.
   * `AC-SA-08-02` (L44876). `SB-31-10` (L76133) is the storyboard this
   * file's header explains was chosen over `SB-SA-08` (L44777) for HOW
   * the other three roles see this — disabled with a stated reason, never
   * hidden — matching the dispatch and this rebuild's own convention.
   */
  const inviteGate = evaluateAccess(
    { action: 'invite-console-user', allowedRoles: ['ROOT_SUPER_ADMIN'], sourceRefs: ['§8.8.1', '§8.8.2', 'AC-SA-08-02', 'SB-31-10'] },
    ctx,
  )
  const canInvite = inviteGate.outcome === 'allowed'

  const roleOptions = rolesInDomain('PLATFORM').map((r) => ({ value: r.id, label: r.name }))

  function openInvite() {
    setPendingId(`USR-INVITE-${store.nextSequence()}`)
    setValues({ displayName: '', email: '', role: 'ADMIN' })
    setAttempted(false)
    setResult(null)
    setInviteOpen(true)
  }

  const columns: readonly DataTableColumn<PlatformUser>[] = [
    {
      key: 'name',
      header: 'Name',
      sortValue: (u) => u.displayName,
      render: (u) => <span className={textColor('ink')}>{u.displayName}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      sortValue: (u) => roleById(u.role).name,
      render: (u) => <StatusPill tone={ROLE_TONE[u.role]} label={roleById(u.role).name} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (u) => <StatusPill tone={USER_STATUS_TONE[u.status]} label={USER_STATUS_LABEL[u.status]} />,
    },
    {
      key: 'lastSignIn',
      header: 'Last sign-in',
      sortValue: (u) => (u.lastSignInAt === null ? 0 : Date.parse(u.lastSignInAt)),
      render: (u) => formatLastSignIn(u.lastSignInAt),
    },
    {
      key: 'grantedBy',
      header: 'Granted by',
      render: (u) => grantedByLabel(u, roleGrants, usersById),
    },
  ]

  const filters: readonly FilterDef<PlatformUser>[] = [
    {
      key: 'role',
      label: 'Role',
      options: rolesInDomain('PLATFORM').map((r) => ({ value: r.id, label: r.name })),
      match: (u, value) => u.role === value,
    },
  ]

  async function handleInviteSubmit(value: User): Promise<WriteResult<unknown>> {
    if (value.role === 'ROOT_SUPER_ADMIN') {
      /**
       * `WF-ROLE-037`: "Refusing creation of a second Root Super Admin."
       * §8.8.1: "there is only ever one." Reached HERE, through the real
       * form, rather than merely being described — the safety-control
       * stage (`evaluateAccess`, spec §3.4 stage 2) denies this before any
       * role check, so no role — including the root's own — can pass it.
       */
      const refusal = evaluateAccess(
        {
          action: 'create-second-root-account',
          allowedRoles: [],
          safetyControl:
            'Exactly one Root Super Admin account exists on this platform. It is created only by the backend at platform commissioning, and no console path — including this form — can create a second.',
          sourceRefs: ['§8.8.1', 'AC-SA-08-01', 'WF-ROLE-037'],
        },
        ctx,
      )
      return { ok: false, kind: 'denied', decision: refusal, reason: refusal.reasonCode, explain: refusal.explanation }
    }

    const userResult = await repository.create('users', value, ctx)
    if (!userResult.ok) return userResult

    const grantorId = currentUser?.id ?? 'USR-ROOT-01'
    const nowIso = new Date(store.clock.now()).toISOString()
    const grantResult = await repository.create(
      'role-grants',
      {
        id: `RG-INVITE-${store.nextSequence()}`,
        userId: userResult.row.id,
        role: value.role,
        siteIds: [],
        areaIds: [],
        shiftIds: [],
        grantedBy: grantorId,
        grantedAt: nowIso,
        expiresAt: null,
        revokedAt: null,
        purpose: null,
      },
      ctx,
    )
    if (!grantResult.ok) {
      return { ...grantResult, explain: `${value.displayName}'s account was created, but the role grant could not be recorded: ${grantResult.explain}` }
    }
    return userResult
  }

  const issues = [
    ...fieldIssues(User.shape.displayName, values.displayName),
    ...fieldIssues(User.shape.email, values.email),
  ]

  async function onInviteFormSubmit() {
    setAttempted(true)
    if (issues.length > 0 || pendingId === null) return
    setBusy(true)
    const outcome = await handleInviteSubmit({
      id: pendingId,
      tenantId: null,
      displayName: values.displayName,
      email: values.email,
      role: values.role,
      status: 'invited',
      locale: 'en',
      createdAt: new Date(store.clock.now()).toISOString(),
      lastSignInAt: null,
    })
    setBusy(false)
    setResult(outcome)
  }

  return (
    <section aria-labelledby="console-users-heading" className="flex flex-col gap-4">
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="console-users-heading" className={`text-lg font-semibold ${textColor('ink')}`}>
            Console users
          </h2>
          {/*
            Root invariants — statements, never editable controls.
            §8.8.1 (`AC-SA-08-01`, `WF-ROLE-037`): exactly one root exists,
            it is created only by the backend, and no console path can
            create a second. Rendered as fact, not as a toggle or a form
            field anywhere on this screen.
          */}
          <p data-control-id="console-users-root-invariant" className={`mt-1 max-w-prose text-sm ${textColor('ink-muted')}`}>
            Exactly one Root Super Admin account exists on this platform. It was created by the backend at
            platform commissioning, held in the client's custody, and no console path — including the form
            below — can create a second.
          </p>
        </div>
        {canInvite ? (
          <button
            type="button"
            data-control-id="console-users-invite"
            onClick={openInvite}
            className={`${radiusClass('md')} ${bg('accent')} px-4 py-2 text-sm font-medium text-[var(--accent-ink)]`}
          >
            Invite console user
          </button>
        ) : (
          <div className="flex max-w-xs flex-col items-end gap-1">
            <button
              type="button"
              disabled
              aria-describedby="console-users-invite-reason"
              data-control-id="console-users-invite"
              className={`cursor-not-allowed ${radiusClass('md')} border ${borderColor('border')} ${bg('sunken')} px-4 py-2 text-sm font-medium ${textColor('ink-subtle')}`}
            >
              Invite console user
            </button>
            <p id="console-users-invite-reason" className={`text-right text-xs ${textColor('ink-muted')}`}>
              User creation and role changes are reserved for the Root Super Admin (§8.8.1, §8.8.2).
            </p>
          </div>
        )}
      </div>

      <DataTable
        caption="Console users"
        columns={columns}
        query={platformUsersQuery}
        rowId={(u) => u.id}
        filters={filters}
        search={{
          placeholder: 'Search by name or email',
          match: (u, q) => {
            const needle = q.toLowerCase()
            return u.displayName.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle)
          },
        }}
        emptyState={{
          title: 'There are no console users yet.',
          whatCreatesIt: 'The root creates every console account; there is no self-registration path.',
        }}
      />

      <DetailDrawer open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite console user">
        <div className="flex flex-col gap-4">
          {attempted && issues.length > 0 ? (
            <div role="alert" className={`${radiusClass('md')} border ${borderColor('border-strong')} p-3 text-sm ${textColor('ink')}`}>
              <p className="font-medium">There is a problem</p>
              <ul className="list-disc pl-5">
                {issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {result !== null ? (
            <LiveRegion>
              <p
                data-control-id="console-users-invite-result"
                className={`${radiusClass('md')} border ${borderColor('border')} p-3 text-sm`}
                style={{ color: result.ok ? statusVar('ok') : statusVar('danger') }}
              >
                {result.ok ? `${values.displayName} was invited.` : result.explain}
              </p>
            </LiveRegion>
          ) : null}

          <TextField name="displayName" label="Full name" required value={values.displayName} onChange={(v) => setValues((p) => ({ ...p, displayName: v }))} />
          <TextField
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={values.email}
            onChange={(v) => setValues((p) => ({ ...p, email: v }))}
          />
          <RadioGroup
            name="role"
            label="Role"
            required
            options={roleOptions}
            value={values.role}
            onChange={(v) => setValues((p) => ({ ...p, role: v as RoleId }))}
            hint="Root Super Admin is listed to make the invariant it violates checkable, not because it can be granted here."
          />
          <div className="flex gap-2">
            <button
              type="button"
              data-control-id="console-users-invite-submit"
              onClick={() => void onInviteFormSubmit()}
              aria-disabled={busy ? 'true' : undefined}
              disabled={busy}
              className={`self-start ${radiusClass('md')} ${bg('accent')} px-4 py-2 text-sm font-medium text-[var(--accent-ink)] disabled:opacity-50`}
            >
              {busy ? 'Sending…' : 'Send invitation'}
            </button>
            <button
              type="button"
              data-control-id="console-users-invite-close"
              onClick={() => setInviteOpen(false)}
              className={`self-start ${radiusClass('md')} border ${borderColor('border-strong')} ${bg('surface')} px-4 py-2 text-sm ${textColor('ink')}`}
            >
              Close
            </button>
          </div>
        </div>
      </DetailDrawer>
    </section>
  )
}

/* ────────────────────────────────────────────────────────────────────── *
 * Change approvals
 * ────────────────────────────────────────────────────────────────────── */

function approverAllowedRoles(changeClass: ApprovalClass): readonly RoleId[] {
  return changeClass === 'critical' ? ['ROOT_SUPER_ADMIN'] : ['ROOT_SUPER_ADMIN', 'ADMIN']
}

function affectedTenantsLabel(request: ApprovalRequest, tenantsById: ReadonlyMap<string, Tenant>): string {
  if (request.platformWide) return 'Platform-wide'
  if (request.affectedTenantIds.length === 0) return 'Not recorded'
  return request.affectedTenantIds.map((id) => tenantsById.get(id)?.name ?? id).join(', ')
}

function diffKeys(before: Record<string, unknown>, after: Record<string, unknown>): readonly string[] {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
}

function diffCell(value: unknown): string {
  if (value === undefined) return '—'
  if (value === null) return 'None'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

function ApprovalsSection({
  ctx,
  repository,
  nowMs,
  approvalsQuery,
  usersById,
  tenantsById,
  evaluationRows,
  currentUser,
}: {
  readonly ctx: AccessContext
  readonly repository: Repository
  readonly nowMs: number
  readonly approvalsQuery: Query<ApprovalRequest>
  readonly usersById: ReadonlyMap<string, PlatformUser>
  readonly tenantsById: ReadonlyMap<string, Tenant>
  readonly evaluationRows: readonly EvalRow[]
  readonly currentUser: PlatformUser | null
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [returnReason, setReturnReason] = useState('')
  const [confirmKind, setConfirmKind] = useState<'approve' | 'return' | null>(null)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ readonly tone: StatusToken; readonly message: string } | null>(null)

  const allRequests = approvalsQuery.all()
  const selected = selectedId === null ? null : (allRequests.find((r) => r.id === selectedId) ?? null)

  function ageHoursFor(request: ApprovalRequest): number {
    return (nowMs - Date.parse(request.createdAt)) / (60 * 60 * 1000)
  }

  const columns: readonly DataTableColumn<ApprovalRequest>[] = [
    {
      key: 'class',
      header: 'Class',
      sortValue: (r) => r.changeClass,
      render: (r) => <StatusPill tone={CLASS_TONE[r.changeClass]} label={CLASS_LABEL[r.changeClass]} />,
    },
    {
      key: 'change',
      header: 'Change',
      sortValue: (r) => actionTypeLabel(r),
      render: (r) => (
        <button
          type="button"
          data-control-id={`approvals-open-${r.id}`}
          onClick={() => setSelectedId(r.id)}
          className={`flex flex-col text-left underline-offset-2 hover:underline ${textColor('ink')}`}
        >
          <span className="font-medium">{actionTypeLabel(r)}</span>
          <span className={`text-xs ${textColor('ink-subtle')}`}>{r.objectRef}</span>
        </button>
      ),
    },
    {
      key: 'proposer',
      header: 'Proposer',
      sortValue: (r) => usersById.get(r.proposerId)?.displayName ?? r.proposerId,
      render: (r) => usersById.get(r.proposerId)?.displayName ?? r.proposerId,
    },
    {
      key: 'age',
      header: 'Age',
      align: 'end',
      sortValue: (r) => Date.parse(r.createdAt),
      render: (r) => ageLabel(ageHoursFor(r)),
    },
    {
      key: 'state',
      header: 'State',
      render: (r) => {
        const aging = r.changeClass === 'critical' && r.state === 'pending' && ageHoursFor(r) >= AGING_THRESHOLD_HOURS
        return (
          <span className="flex items-center gap-2">
            <StatusPill tone={STATE_TONE[r.state]} label={STATE_LABEL[r.state]} />
            {aging ? <StatusPill tone="danger" label="Aging — re-notifying root" /> : null}
          </span>
        )
      },
    },
  ]

  const filters: readonly FilterDef<ApprovalRequest>[] = [
    {
      key: 'changeClass',
      label: 'Class',
      options: [
        { value: 'engineering', label: 'Engineering' },
        { value: 'critical', label: 'Critical' },
      ],
      match: (r, v) => r.changeClass === v,
    },
    {
      key: 'state',
      label: 'State',
      options: (['pending', 'approved', 'returned', 'applied'] as const).map((s) => ({ value: s, label: STATE_LABEL[s] })),
      match: (r, v) => r.state === v,
    },
    {
      key: 'age',
      label: 'Age',
      options: (['today', 'older-than-one-day', 'older-than-three-days'] as const).map((b) => ({ value: b, label: AGE_BAND_LABEL[b] })),
      match: (r, v) => ageBandFor(ageHoursFor(r)) === v,
    },
  ]

  function closeDrawer() {
    setSelectedId(null)
    setReturnReason('')
    setConfirmKind(null)
    setFeedback(null)
  }

  async function commitDecision(request: ApprovalRequest, kind: 'approve' | 'return') {
    setBusy(true)
    const nowIso = new Date(nowMs).toISOString()
    const approverId = currentUser?.id ?? ctx.actorOfRecord ?? 'unattributed'
    const patch =
      kind === 'approve'
        ? { state: 'applied' as const, approverId, decidedAt: nowIso }
        : { state: 'returned' as const, approverId, decidedAt: nowIso, returnReason: returnReason.trim() }
    const outcome = await repository.update('approval-requests', request.id, patch, ctx)
    setBusy(false)
    setConfirmKind(null)
    if (outcome.ok) {
      setFeedback({
        tone: 'ok',
        message: kind === 'approve' ? `${actionTypeLabel(request)} was approved and applied.` : `${actionTypeLabel(request)} was returned.`,
      })
      if (kind === 'return') setReturnReason('')
    } else {
      setFeedback({ tone: 'danger', message: outcome.explain })
    }
  }

  return (
    <section aria-labelledby="change-approvals-heading" className="mt-10 flex flex-col gap-4">
      <div>
        <h2 id="change-approvals-heading" className={`text-lg font-semibold ${textColor('ink')}`}>
          Change approvals
        </h2>
        <p className={`mt-1 max-w-prose text-sm ${textColor('ink-muted')}`}>
          Mutating platform changes wait here until a different, authorised person decides them. Nothing
          applies while it is pending, and nothing decides itself.{' '}
          <span className="block mt-1 text-xs">{CRITICAL_ACTION_COUNT_NOTE}</span>
        </p>
      </div>

      <DataTable
        caption="Change approvals"
        columns={columns}
        query={approvalsQuery}
        rowId={(r) => r.id}
        filters={filters}
        search={{
          placeholder: 'Search by proposer, action or object',
          match: (r, q) => {
            const needle = q.toLowerCase()
            return (
              (usersById.get(r.proposerId)?.displayName ?? r.proposerId).toLowerCase().includes(needle) ||
              actionTypeLabel(r).toLowerCase().includes(needle) ||
              r.objectRef.toLowerCase().includes(needle)
            )
          },
        }}
        emptyState={{
          title: 'There is nothing waiting for a platform-level decision.',
          whatCreatesIt: 'A row appears here when a Platform Engineer or Admin submits a mutating change.',
        }}
      />

      <DetailDrawer
        open={selected !== null}
        onClose={closeDrawer}
        title={selected ? actionTypeLabel(selected) : ''}
        status={
          selected ? (
            <span className="flex items-center gap-2">
              <StatusPill tone={CLASS_TONE[selected.changeClass]} label={CLASS_LABEL[selected.changeClass]} />
              <StatusPill tone={STATE_TONE[selected.state]} label={STATE_LABEL[selected.state]} />
            </span>
          ) : undefined
        }
      >
        {selected ? (
          <ApprovalDetail
            ctx={ctx}
            request={selected}
            usersById={usersById}
            tenantsById={tenantsById}
            evaluationRows={evaluationRows}
            ageHours={ageHoursFor(selected)}
            returnReason={returnReason}
            onReturnReasonChange={setReturnReason}
            onRequestConfirm={setConfirmKind}
            feedback={feedback}
          />
        ) : null}
      </DetailDrawer>

      {selected ? (
        <ConfirmDialog
          open={confirmKind !== null}
          controlId="approvals-confirm"
          title={confirmKind === 'return' ? `Return ${actionTypeLabel(selected)}` : `Approve ${actionTypeLabel(selected)}`}
          affectedObjects={[{ id: selected.id, label: `${actionTypeLabel(selected)} (${selected.objectRef})` }]}
          resultingState={{
            subject: 'Request state',
            from: STATE_LABEL[selected.state],
            to: confirmKind === 'return' ? 'Returned' : 'Applied',
          }}
          confirmLabel={confirmKind === 'return' ? 'Return' : 'Approve'}
          busy={busy}
          onConfirm={() => void commitDecision(selected, confirmKind === 'return' ? 'return' : 'approve')}
          onCancel={() => setConfirmKind(null)}
        />
      ) : null}
    </section>
  )
}

function ApprovalDetail({
  ctx,
  request,
  usersById,
  tenantsById,
  evaluationRows,
  ageHours,
  returnReason,
  onReturnReasonChange,
  onRequestConfirm,
  feedback,
}: {
  readonly ctx: AccessContext
  readonly request: ApprovalRequest
  readonly usersById: ReadonlyMap<string, PlatformUser>
  readonly tenantsById: ReadonlyMap<string, Tenant>
  readonly evaluationRows: readonly EvalRow[]
  readonly ageHours: number
  readonly returnReason: string
  readonly onReturnReasonChange: (v: string) => void
  readonly onRequestConfirm: (kind: 'approve' | 'return') => void
  readonly feedback: { readonly tone: StatusToken; readonly message: string } | null
}) {
  const proposer = usersById.get(request.proposerId)
  const keys = diffKeys(request.before, request.after)
  const lastEvalResult =
    request.evaluationSuiteId === null
      ? null
      : evaluationRows
          .filter((e): e is Extract<EvalRow, { kind: 'result' }> => e.kind === 'result' && e.suiteId === request.evaluationSuiteId)
          .sort((a, b) => Date.parse(b.runAt) - Date.parse(a.runAt))[0]

  /**
   * `evaluateAccess`'s SEGREGATION_OF_DUTIES stage compares `makerCheckerOf`
   * against `ctx.actorOfRecord`. `actorOfRecord` is the signed-in session's
   * `identity` — this build's own session state carries the DISPLAY NAME
   * there (`session.ts#sessionFor`, `identity: user.displayName`), not the
   * `USR-...` id — so the comparison must resolve the proposer's display
   * name too, never the raw `proposerId`, or two different accounts that
   * happen to share no name would always compare unequal even when they
   * are the same identity, and the real self-proposal case would never
   * compare equal at all.
   */
  const proposerDisplayName = proposer?.displayName ?? request.proposerId

  const isCriticalNonRootViewer = request.changeClass === 'critical' && ctx.identity.role !== 'ROOT_SUPER_ADMIN'

  /**
   * Master prompt §15.1 / the brief: "Missing approver blocks; nothing
   * auto-approves and a timeout is never an approval." `evaluateAccess`'s
   * `requiresApproverAvailable`/`approverAvailable` fields exist for
   * exactly this — computed here as "does at least one active account
   * holding an eligible role for THIS class exist at all", never defaulted
   * to `true`. Unreachable as `false` against today's seed (2 Admins and
   * the root are always `active`), same as `TenantDetailScreen.tsx`'s own
   * `requiresApproverAvailable`-shaped checks elsewhere in this build are
   * real, wired conditions rather than a decorative prop.
   */
  const approverAvailable = [...usersById.values()].some(
    (u) => approverAllowedRoles(request.changeClass).includes(u.role) && u.status === 'active',
  )

  const decisionGate =
    request.state === 'pending'
      ? evaluateAccess(
          {
            action: 'decide-approval-request',
            allowedRoles: approverAllowedRoles(request.changeClass),
            objectState: request.state,
            allowedObjectStates: ['pending'],
            requiresApproverAvailable: true,
            approverAvailable,
            // §8.8.3 / L55989: root approving its own critical-class
            // proposal is a documented permitted case — the root is the
            // sole critical-class approver and the source assigns no
            // second approver (recorded as `Assumption`, `DEC-ROOTSUCC-001`)
            // — so segregation of duties is checked for the engineering
            // class only, where a different approver (Admin) genuinely
            // exists.
            ...(request.changeClass === 'engineering' ? { makerCheckerOf: proposerDisplayName } : {}),
            sourceRefs: ['§8.8.3', 'AC-SA-08-04', 'AC-SA-08-05', 'AC-SA-08-06'],
          },
          ctx,
        )
      : null

  return (
    <div className="flex flex-col gap-4">
      {feedback ? (
        <LiveRegion>
          <p
            data-control-id="approvals-write-feedback"
            className={`${radiusClass('md')} border ${borderColor('border')} p-3 text-sm`}
            style={{ color: statusVar(feedback.tone) }}
          >
            {feedback.message}
          </p>
        </LiveRegion>
      ) : null}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <dt className={textColor('ink-muted')}>Proposer</dt>
        <dd className={textColor('ink')}>{proposer?.displayName ?? request.proposerId}</dd>
        <dt className={textColor('ink-muted')}>Age</dt>
        <dd className={textColor('ink')}>{ageLabel(ageHours)}</dd>
        <dt className={textColor('ink-muted')}>Affected tenants</dt>
        <dd className={textColor('ink')}>{affectedTenantsLabel(request, tenantsById)}</dd>
        {request.state !== 'pending' ? (
          <>
            <dt className={textColor('ink-muted')}>Decided by</dt>
            <dd className={textColor('ink')}>{(request.approverId && usersById.get(request.approverId)?.displayName) ?? request.approverId ?? 'Not recorded'}</dd>
          </>
        ) : null}
        {request.returnReason !== null ? (
          <>
            <dt className={textColor('ink-muted')}>Return reason</dt>
            <dd className={textColor('ink')}>{request.returnReason}</dd>
          </>
        ) : null}
      </dl>

      <div>
        <h3 className={`text-sm font-semibold ${textColor('ink')}`}>Rationale</h3>
        <p className={`mt-1 text-sm ${textColor('ink')}`}>{request.rationale}</p>
      </div>

      {request.evaluationSuiteId !== null ? (
        <div>
          <h3 className={`text-sm font-semibold ${textColor('ink')}`}>Evaluation scenario set</h3>
          <p className={`mt-1 text-sm ${textColor('ink')}`}>
            {request.evaluationSuiteId} —{' '}
            {lastEvalResult
              ? `last known result: ${lastEvalResult.outcome === 'pass' ? 'Passed' : 'Failed'} (${lastEvalResult.runAt.slice(0, 10)})`
              : 'No run recorded yet.'}
          </p>
        </div>
      ) : null}

      <div>
        <h3 className={`text-sm font-semibold ${textColor('ink')}`}>Before and after</h3>
        <div className={`mt-1 overflow-x-auto ${radiusClass('lg')} border ${borderColor('border')}`}>
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${borderColor('border')} ${bg('raised')} text-left`}>
                <th className={`p-2 font-medium ${textColor('ink-muted')}`}>Field</th>
                <th className={`p-2 font-medium ${textColor('ink-muted')}`}>Before</th>
                <th className={`p-2 font-medium ${textColor('ink-muted')}`}>After</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key} className={`border-b ${borderColor('border')} last:border-b-0`}>
                  <td className={`p-2 ${textColor('ink')}`}>{key}</td>
                  <td className={`p-2 ${textColor('ink')}`}>{diffCell(request.before[key])}</td>
                  <td className={`p-2 ${textColor('ink')}`}>{diffCell(request.after[key])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {request.state === 'pending' ? (
        isCriticalNonRootViewer ? (
          /**
           * SB-HO-004 (L23707): "where the viewer is not the root, the
           * action bar is replaced with the sentence 'Critical class —
           * root approval required', with no control that could be
           * mistaken for an approval." Not a disabled button: no control
           * renders here at all.
           */
          <p data-control-id="approvals-critical-non-root-notice" className={`text-sm font-medium ${textColor('ink')}`}>
            Critical class — root approval required
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                data-control-id="approvals-approve"
                disabled={decisionGate?.outcome !== 'allowed'}
                aria-describedby={decisionGate?.outcome !== 'allowed' ? 'approvals-decision-reason' : undefined}
                onClick={() => onRequestConfirm('approve')}
                className={
                  decisionGate?.outcome === 'allowed'
                    ? `${radiusClass('md')} ${bg('accent')} px-3 py-1.5 text-sm font-medium text-[var(--accent-ink)]`
                    : `cursor-not-allowed ${radiusClass('md')} border ${borderColor('border')} ${bg('sunken')} px-3 py-1.5 text-sm ${textColor('ink-subtle')}`
                }
              >
                Approve
              </button>
              <div className="flex flex-1 flex-col gap-1">
                <TextArea
                  name="returnReason"
                  label="Return with reason"
                  rows={2}
                  value={returnReason}
                  onChange={onReturnReasonChange}
                />
                <button
                  type="button"
                  data-control-id="approvals-return"
                  disabled={decisionGate?.outcome !== 'allowed' || returnReason.trim() === ''}
                  aria-describedby={decisionGate?.outcome !== 'allowed' ? 'approvals-decision-reason' : undefined}
                  onClick={() => onRequestConfirm('return')}
                  className={
                    decisionGate?.outcome === 'allowed' && returnReason.trim() !== ''
                      ? `self-start ${radiusClass('md')} border ${borderColor('border-strong')} ${bg('surface')} px-3 py-1.5 text-sm font-medium ${textColor('ink')}`
                      : `self-start cursor-not-allowed ${radiusClass('md')} border ${borderColor('border')} ${bg('sunken')} px-3 py-1.5 text-sm ${textColor('ink-subtle')}`
                  }
                >
                  Return
                </button>
              </div>
            </div>
            {decisionGate?.outcome !== 'allowed' ? (
              <p id="approvals-decision-reason" className={`text-xs ${textColor('ink-muted')}`}>
                {decisionGate?.explanation}
              </p>
            ) : null}
          </div>
        )
      ) : null}

    </div>
  )
}

