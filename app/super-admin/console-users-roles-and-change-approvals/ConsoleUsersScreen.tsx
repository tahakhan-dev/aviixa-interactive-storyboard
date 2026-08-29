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
import type { AccessContext, InviteConsoleUserResult, Query, Repository, RowOf } from '@/data/repository'
import type { Store } from '@/data/store'
import { saModuleById } from '@/surfaces/sa/modules'
import { CRITICAL_ACTIONS } from '@/surfaces/sa/critical-actions'

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
 *    resolution is reused for `actionTypeLabel`'s lookup; its count note
 *    itself is NOT rendered (fix round 1, unit-01 Task 7 review, IMPORTANT
 *    1 — removed from the Change approvals section intro, along with
 *    every other locator, as build-process vocabulary this screen's
 *    rendered copy must not carry).
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

  return (
    <AppShell surface="SURF-SA" session={session} title={MODULE.name} breadcrumbs={[{ label: MODULE.name }]}>
      <ConsoleUsersSection
        ctx={ctx}
        repository={repository}
        store={store}
        platformUsersQuery={platformUsersQuery}
        usersById={usersById}
        roleGrants={roleGrants}
      />
      <ApprovalsSection
        ctx={ctx}
        repository={repository}
        nowMs={nowMs}
        approvalsQuery={approvalsQuery}
        usersById={usersById}
        tenantsById={tenantsById}
        evaluationRows={evaluationRows}
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
}: {
  readonly ctx: AccessContext
  readonly repository: Repository
  readonly store: Store
  readonly platformUsersQuery: Query<PlatformUser>
  readonly usersById: ReadonlyMap<string, PlatformUser>
  readonly roleGrants: readonly RoleGrant[]
}) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [values, setValues] = useState<InviteValues>({ displayName: '', email: '', role: 'ADMIN' })
  const [attempted, setAttempted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<InviteConsoleUserResult | null>(null)

  /**
   * A screen-level DISPLAY gate only — same split `TenantsScreen.tsx`'s own
   * `createDecision` already uses beside `provisionTenant`'s door
   * authorisation: this decides whether to show the button or the disabled
   * reason; `repository.inviteConsoleUser`'s own `INVITE_CONSOLE_USER_REQUEST`
   * is the real, enforced authorisation the write goes through, and the two
   * deliberately cite the same authority (§8.8.1/§8.8.2, `SB-31-10`) rather
   * than drifting into two different reasons for one rule. `AC-SA-08-02` is
   * NOT cited here (fix round 1, unit-01 Task 7 review, IMPORTANT 7): that
   * acceptance criterion requires the control to be ABSENT for every role
   * but the root, and this gate is exactly the one that renders it DISABLED
   * instead — citing it here would be a citation for the decision this
   * build did not take. The on-screen disclosure beside the disabled
   * reason below is where that conflict is actually surfaced.
   *
   * Fix round 2 (unit-01, Task 7 re-review, IMPORTANT 3) — `WF-ROLE-037`
   * (the second-root refusal) restored here: it fell out of the generated
   * registries not because `fixtures.ts` was deleted, but because fix
   * round 1 moved the refusal ITSELF into `repository.ts#inviteConsoleUser`,
   * a file the registry's route scanner never reads (it scans route-tree
   * files under `app/` only). The refusal is still reachable through this
   * exact form; this gate governs the same act, so the citation belongs
   * here now. `UC-HO-01` (root creates a console account and assigns a
   * role type) and `WF-ROLE-005`/`006`/`007`/`008`/`009`/`010` (creating
   * and assigning each of the three delegable roles) are added for the
   * same reason: this gate is the door every one of those acts opens
   * through, and `inviteConsoleUser` genuinely performs both writes
   * (`users` row plus `role-grants` row) each one describes, for whichever
   * of the four platform roles the form's radio group selects.
   */
  const inviteGate = evaluateAccess(
    {
      action: 'invite-console-user',
      allowedRoles: ['ROOT_SUPER_ADMIN'],
      sourceRefs: [
        '§8.8.1',
        '§8.8.2',
        'SB-31-10',
        'WF-ROLE-037',
        'UC-HO-01',
        'WF-ROLE-005',
        'WF-ROLE-006',
        'WF-ROLE-007',
        'WF-ROLE-008',
        'WF-ROLE-009',
        'WF-ROLE-010',
      ],
    },
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
      render: (u) => <StatusPill tone="info" label={roleById(u.role).name} />,
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

  const issues = [
    ...fieldIssues(User.shape.displayName, values.displayName),
    ...fieldIssues(User.shape.email, values.email),
  ]

  /**
   * Fix round 1 (unit-01, Task 7 review, IMPORTANT 6) — a thin caller. The
   * second-root refusal, the grantor resolution and the two writes all now
   * live inside `repository.inviteConsoleUser` (see that method's own
   * comment in `repository.ts`); this screen builds the candidate row and
   * routes whatever the door returns, exactly the shape
   * `CreateTenantWizard.tsx` already uses for `provisionTenant`.
   */
  async function onInviteFormSubmit() {
    setAttempted(true)
    if (issues.length > 0 || pendingId === null) return
    setBusy(true)
    const outcome = await repository.inviteConsoleUser(
      {
        id: pendingId,
        tenantId: null,
        displayName: values.displayName,
        email: values.email,
        role: values.role,
        status: 'invited',
        locale: 'en',
        createdAt: new Date(store.clock.now()).toISOString(),
        lastSignInAt: null,
      },
      ctx,
    )
    setBusy(false)
    setResult(outcome)
  }

  const resultMessage: { readonly tone: StatusToken; readonly text: string } | null =
    result === null
      ? null
      : result.ok
        ? { tone: 'ok', text: `${result.user.displayName} was invited.` }
        : result.kind === 'partial'
          ? {
              tone: 'danger',
              text: `${result.user.displayName}'s account was created, but the role grant could not be recorded: ${result.grantFailure.explain}`,
            }
          : { tone: 'danger', text: result.explain }

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
          {/*
            IMPORTANT 7 (unit-01, Task 7 fix round 1): the disclosure this
            control's own conflicting specification passages need, moved
            from a header comment to product-appropriate on-screen UI — a
            native disclosure widget, not a paragraph of narrative, and
            with no locator or build-process term in the rendered text.
          */}
          <details data-control-id="console-users-invite-disclosure" className="mt-2 text-xs">
            <summary className={`cursor-pointer ${textColor('ink-muted')}`}>Why this control behaves this way</summary>
            <p className={`mt-1 max-w-prose ${textColor('ink-muted')}`}>
              This platform's own specification describes this control two different ways: one version
              says it should not appear at all for anyone but the root; the other says it should stay
              visible for every role, disabled with the reason shown, so a person learns the rule rather
              than wondering whether the feature is missing. This console follows the second description
              — a client-delegated choice under APP-012, not a position the source settled.
            </p>
          </details>
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
              User creation and role changes are reserved for the Root Super Admin.
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

          {resultMessage !== null ? (
            <LiveRegion>
              <p
                data-control-id={`console-users-invite-result-${resultMessage.tone}`}
                className={`${radiusClass('md')} border ${borderColor('border')} p-3 text-sm`}
                style={{ color: statusVar(resultMessage.tone) }}
              >
                {resultMessage.text}
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
            hint="Root Super Admin is listed here so attempting it shows the reason it cannot be granted, not because it can be."
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
}: {
  readonly ctx: AccessContext
  readonly repository: Repository
  readonly nowMs: number
  readonly approvalsQuery: Query<ApprovalRequest>
  readonly usersById: ReadonlyMap<string, PlatformUser>
  readonly tenantsById: ReadonlyMap<string, Tenant>
  readonly evaluationRows: readonly EvalRow[]
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
        /**
         * Fix round 3 (unit-01, Task 7 re-review, IMPORTANT 1) — the pill
         * used to read "Aging — re-notifying root", asserting an act this
         * build never performs. L56031's own happy path is "a
         * re-notification is created and delivered on in-app and email"
         * and its recovery line adds "re-notifications are audited" — this
         * screen creates no notification row, seeds none (every one of
         * `notifications.json`'s 65 rows was checked; none references an
         * `approval-requests` id or a console recipient), and writes no
         * audit row for it. It also cannot be built here without a schema
         * change this fix round is told not to make:
         * `Notification.tenantId` is `z.string().min(1)` with a foreign
         * key to `tenants`, so a platform-scoped console notification has
         * no representable row today. The pill now names only the
         * OBSERVABLE fact this screen actually has — the request is older
         * than the threshold and still pending — not the notification act
         * the source describes. A future unit that gives `notifications`
         * a platform-scoped shape can build the real act and cite
         * `WF-ROLE-021` honestly; this screen does not claim it.
         */
        return (
          <span className="flex items-center gap-2">
            <StatusPill tone={STATE_TONE[r.state]} label={STATE_LABEL[r.state]} />
            {aging ? <StatusPill tone="danger" label="Aging — awaiting root" /> : null}
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

  /**
   * Fix round 3 (unit-01, Task 7 re-review, IMPORTANT 2) — a thin caller,
   * matching the shape `ConsoleUsersSection.onInviteFormSubmit` already
   * uses for `inviteConsoleUser`. Segregation of duties, the critical-
   * class root-only rule, approver availability, the mandatory-reason
   * check on Return, and the approver-id resolution all now live inside
   * `repository.decideApprovalRequest` (see that method's own comment in
   * `repository.ts`) — this function builds nothing but the two arguments
   * the door needs beyond the request id, and routes whatever it returns.
   * The local `currentUser`/`approverId` resolution this function used to
   * do itself is gone: it duplicated exactly what the door now does
   * against the live store, one layer closer to the actual write.
   */
  async function commitDecision(request: ApprovalRequest, kind: 'approve' | 'return') {
    setBusy(true)
    const outcome = await repository.decideApprovalRequest(
      request.id,
      kind,
      kind === 'return' ? returnReason.trim() : null,
      ctx,
    )
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
          applies while it is pending, and nothing decides itself.
        </p>
        <details data-control-id="approvals-segregation-disclosure" className="mt-2 text-xs">
          <summary className={`cursor-pointer ${textColor('ink-muted')}`}>
            Why the root may decide its own critical-class proposals
          </summary>
          <p className={`mt-1 max-w-prose ${textColor('ink-muted')}`}>
            For every other class of change here, the person who proposes it can never also be the one
            who decides it. This platform's specification names no second decision-maker for the most
            consequential class of changes, so this console allows the root — and only the root — to
            decide a critical-class proposal it made itself, rather than leaving that class permanently
            undecidable whenever the root is the one who raised it. A client-delegated choice under
            APP-012, not a position the source settled.
          </p>
        </details>
        {/*
          Fix round 2 (unit-01, Task 7 re-review, IMPORTANT 1) — two further
          open decisions this screen was rendering as settled fact without
          disclosing that the question is open at all: how long an aging
          critical request waits before the root is notified again, and
          whether a non-root viewer sees a disabled control or no control at
          all for a critical-class request. Both are plain language, no
          locator, no build-process term.
        */}
        <details data-control-id="approvals-aging-disclosure" className="mt-2 text-xs">
          <summary className={`cursor-pointer ${textColor('ink-muted')}`}>
            Why the aging threshold is a flat seventy-two hours, and what this console does at it
          </summary>
          <p className={`mt-1 max-w-prose ${textColor('ink-muted')}`}>
            This platform's specification says a critical request that sits too long should notify the
            root again, but it does not say after how long — that interval is left open, with a
            suggestion, never a decision, that different kinds of critical requests might deserve
            different intervals. This console uses one flat interval for every critical request rather
            than guessing at that further split. It marks a request that has crossed that interval so a
            reader can see it is waiting; it does not send a further notification of its own. A
            client-delegated choice under APP-012, not a position the source settled.
          </p>
        </details>
        <details data-control-id="approvals-critical-control-disclosure" className="mt-2 text-xs">
          <summary className={`cursor-pointer ${textColor('ink-muted')}`}>
            Why a non-root viewer sees no control at all, rather than a disabled one
          </summary>
          <p className={`mt-1 max-w-prose ${textColor('ink-muted')}`}>
            This platform's specification describes a critical-class request two different ways for a
            viewer who is not the root: one version keeps the Approve and Return controls visible but
            disabled, with the reason shown, so a viewer can see the request is waiting on someone else;
            the other removes the controls entirely and shows a sentence in their place instead. This
            console follows the second description. A client-delegated choice under APP-012, not a
            position the source settled.
          </p>
        </details>
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
  /**
   * Fix round 1 (unit-01, Task 7 review, IMPORTANT 5) — `suiteId` alone is
   * not a unique key: every seeded `evaluations` row shares
   * `SUITE-CONTAINMENT`, so filtering on it alone picked the most RECENT
   * result across every subject, not the result for THIS request's own
   * object. Filtering on `subjectAtomOrAgentId === request.objectRef` too
   * is what "the evaluation scenario set that will run" (`SB-HO-004`,
   * L23707) actually means — the set governing THIS change, not the
   * platform's latest run of any change.
   */
  const lastEvalResult =
    request.evaluationSuiteId === null
      ? null
      : evaluationRows
          .filter(
            (e): e is Extract<EvalRow, { kind: 'result' }> =>
              e.kind === 'result' && e.suiteId === request.evaluationSuiteId && e.subjectAtomOrAgentId === request.objectRef,
          )
          .sort((a, b) => Date.parse(b.runAt) - Date.parse(a.runAt))[0]

  /**
   * Fix round 2 (unit-01, Task 7 re-review, IMPORTANT 4) — `evaluateAccess`'s
   * SEGREGATION_OF_DUTIES stage compares `makerCheckerOf` against
   * `ctx.actorOfRecord`, which is now the signed-in `users` row's own id
   * (`ProductSession.identityId`, threaded through `useAccessContext`), not
   * its display name. `request.proposerId` is already that same kind of id
   * — every other `makerCheckerOf` caller in this codebase
   * (`@/surfaces/doh/objects.ts`, `@/studio/access/evaluate.ts`) passes an
   * id, never a display name, and this call now matches them. Resolving
   * through `proposer?.displayName` first (fix round 1's shape) is no
   * longer needed and, worse, would silently break the comparison the
   * moment two platform accounts ever shared a display name — a latent
   * fragility fix round 1's own report flagged and this removes rather
   * than papering over.
   */

  /**
   * Fix round 1 (unit-01, Task 7 review, IMPORTANT 2) — routed through the
   * real evaluator rather than a hand-rolled `ctx.identity.role !==
   * 'ROOT_SUPER_ADMIN'` comparison living beside it. `SB-HO-004` (L23707)
   * is the storyboard this exact rule comes from ("where the viewer is not
   * the root, the action bar is replaced with the sentence..."); citing it
   * here — genuinely governing this decision — is what makes this screen's
   * claim to demonstrate `SB-HO-004` honest. Deliberately its OWN gate, not
   * a read of `decisionGate` below: this is a role-only fact ("is the
   * viewer the root"), and `decisionGate` also fails for reasons (object
   * state, approver availability) that must never be mistaken for "you are
   * not the root.
   *
   * TWO STORYBOARDS DISAGREE ON HOW THIS RENDERS (fix round 2, unit-01,
   * Task 7 re-review, IMPORTANT 1) — `SB-RBAC-05` (L21050, "the approval
   * queue") says the critical-class control renders DISABLED with its
   * reason, "because an Admin needs to know the request is waiting on
   * someone else." `SB-HO-004` (L23707, this module's own storyboard, cited
   * below) says the action bar is REPLACED WITH NO CONTROL. Both are real,
   * cited storyboards for the identical control, in direct conflict. This
   * build follows `SB-HO-004` — the storyboard written specifically for
   * this screen (`MOD-SA-08`'s console approval queue), where `SB-RBAC-05`
   * describes a differently-named queue ("the approval queue") without
   * `MOD-SA-08`'s own screen-level detail. The disclosure beside the
   * Change approvals heading is where this conflict is actually surfaced
   * on screen; this comment is where it is recorded for a future reader
   * of the code.
   */
  const criticalViewerGate =
    request.changeClass === 'critical'
      ? evaluateAccess(
          { action: 'view-critical-approval-controls', allowedRoles: ['ROOT_SUPER_ADMIN'], sourceRefs: ['SB-HO-004', 'L23707', 'AC-SA-08-06', '§8.8.3'] },
          ctx,
        )
      : null
  const isCriticalNonRootViewer = criticalViewerGate !== null && criticalViewerGate.outcome !== 'allowed'

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
            ...(request.changeClass === 'engineering' ? { makerCheckerOf: request.proposerId } : {}),
            // Fix round 1 (unit-01, Task 7 review, IMPORTANT 7): `AC-SA-08-05`
            // ("No account can approve its own submission") is cited only
            // when this request's own class actually enforces it
            // (engineering, via `makerCheckerOf` above) — citing it
            // unconditionally, including on the critical-class branch that
            // deliberately does NOT enforce it, would be a citation for a
            // rule this exact call does not apply.
            //
            // Fix round 2 (unit-01, Task 7 re-review, IMPORTANT 3) — per
            // branch, ids verified against their own source lines:
            // `UC-HO-02` (Admin deciding a submitted request, including
            // returning it with a reason) and `WF-ROLE-015`/`016` (Admin
            // approving / returning a Platform Engineer's change) all
            // describe exactly this gate's engineering branch. `WF-ROLE-019`/
            // `020` (root approving / declining a critical-class request)
            // describe this gate's critical branch.
            //
            // Fix round 3 (unit-01, Task 7 re-review, IMPORTANT 1) —
            // `WF-ROLE-021` REMOVED from this citation. L56031's own happy
            // path is "the request ages past its threshold, A
            // RE-NOTIFICATION IS CREATED AND DELIVERED on in-app and
            // email... re-notifications are audited" — this build performs
            // none of that (no notification row, no audit row), and this
            // gate governs approve/return, not aging or re-notification,
            // so it was the wrong gate for the id even if the id had
            // survived. See the pill's own comment below for why the act
            // is unbuilt rather than faked.
            // Fix round 1 (unit-01, Task 11 review): `WF-ROLE-018`/`L55961`
            // ("initiating a critical-class action belongs to the Admin
            // and the root") and `L55918` (the outgoing screen's own
            // `returnDecision` citation) were live `sourceRefs` on the
            // OUTGOING screen and had no replacement here. Both describe
            // exactly this gate: `WF-ROLE-018`/`L55961` is the source for
            // `approverAllowedRoles`'s critical-class root-only rule;
            // `L55918` is the source for the engineering-class Admin
            // return this branch also authorises.
            sourceRefs:
              request.changeClass === 'engineering'
                ? ['§8.8.3', 'AC-SA-08-04', 'AC-SA-08-05', 'AC-SA-08-06', 'UC-HO-02', 'L55918', 'WF-ROLE-015', 'WF-ROLE-016']
                : ['§8.8.3', 'AC-SA-08-04', 'AC-SA-08-06', 'WF-ROLE-018', 'L55961', 'WF-ROLE-019', 'WF-ROLE-020'],
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
              <p id="approvals-decision-reason" data-control-id="approvals-decision-reason" className={`text-xs ${textColor('ink-muted')}`}>
                {decisionGate?.explanation}
              </p>
            ) : null}
          </div>
        )
      ) : null}

    </div>
  )
}

