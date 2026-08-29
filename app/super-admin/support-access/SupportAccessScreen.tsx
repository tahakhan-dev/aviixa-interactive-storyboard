'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { RoleId } from '@/domain/roles'
import { emptyDomainState } from '@/domain/state'
import { scenarioRunId } from '@/domain/ids'
import { evaluateAccess } from '@/policy/evaluate'
import type { PermissionDecision } from '@/policy/decision'
import { saModuleById } from '@/surfaces/sa/modules'
import { SA_INVARIANTS } from '@/surfaces/sa/invariants'
import { ACCESS_CLASSES } from '@/surfaces/sa/access-classes'
import { CRITICAL_ACTIONS } from '@/surfaces/sa/critical-actions'
import { SCREEN_STATES, type ScreenStateId } from '@/ui/screen-state'
import { InvariantChip } from '@/ui/sa/InvariantChip'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import { SA_APPLICABLE_STATES } from '@/surfaces/sa/screen-states'
import type { SaFreshness } from '@/surfaces/sa/freshness'
import {
  Banner,
  Button,
  Field,
  FreshnessLabel,
  PermissionNotice,
  Select,
  StatusPill,
  Table,
} from '@/ui/primitives'
import { RequireSession } from '@/ui/product/RequireSession'
import { useProductSession, useRepositoryQuery } from '@/ui/product/runtime'
import type { ProductSession } from '@/ui/product/AppShell'
import type { AccessContext, Repository } from '@/data/repository'
import { SaConsoleShell } from '../SaConsoleShell'
import {
  BANNER_STATES,
  EMERGENCY_SESSION_STATES,
  EMERGENCY_TIME_BOX,
  SESSION_DETAIL,
  SESSION_LIST_AS_OF,
  SESSION_LIST_ORIGIN,
  SESSION_LIST_STALE_AS_OF,
  SESSION_STATES,
  SUPPORT_ABSENT_CONTROLS,
  SUPPORT_PLATFORM_ROLES,
  SUPPORT_SESSIONS,
  SUPPORT_SOURCE_CONFLICTS,
  SUPPORT_TIME_BOX,
  SUPPORT_UNSPECIFIED_IN_SOURCE,
  SUPPORT_WORKFLOWS,
  type SessionState,
  UNSPECIFIED_EMERGENCY_CLASS_LABEL,
  UNSPECIFIED_EMERGENCY_CLASS_VALUE,
  UNSPECIFIED_REASON_CLASS_LABEL,
  UNSPECIFIED_REASON_CLASS_VALUE,
} from './fixtures'

/**
 * Task 7 (closure sweep) — the real tenant list `TENANT_OPTIONS` (this
 * file's own former fixture, `./fixtures.ts`) is no longer used for the
 * "Open a support session" tenant selector: two of its three seeded rows
 * (`TEN-NORTHFIELD`, `TEN-HARBOUR`) are not real tenants at all
 * (`src/data/collections/tenants.json` carries neither id), which would
 * make every real `openSupportSession` call against them fail
 * `evaluateAccess`'s own tenant-isolation stage (`tenantPartition` finds no
 * such tenant). Read live instead, scoped to `lifecycle === 'active'` only —
 * live-verified (Task 7) that `'pilot'`/`'invited'` both resolve to the
 * scenario state's own `PROVISIONING` (`repository.ts`'s own lifecycle map),
 * which `evaluateAccess`'s FEATURE_AND_SUSPENSION stage refuses exactly like
 * a suspended or archived tenant (`NOT_YET_OR_NO_LONGER_ACTIVE_STATES`) — so
 * listing a pilot tenant here would offer a choice this door can never
 * actually honour. `'active'` is the one lifecycle every real
 * `openSupportSession` call against it can succeed for.
 */
function selectOpenableTenants(repository: Repository, ctx: AccessContext) {
  return repository
    .list('tenants', ctx)
    .where((t) => t.lifecycle === 'active')
    .all()
    .map((t) => ({ value: t.id, label: t.name }))
}

const MODULE = saModuleById('MOD-SA-15')

/** The twelve applicable states: all thirteen less the frontline-only STATE-07. */

/** No backend, no clock — the policy layer is handed an empty seeded state. */
const FIXTURE_STATE = emptyDomainState(scenarioRunId('SA-15-SUPPORT-ACCESS'))

/** What the module itself is doing, a separate axis from who is looking. */
type ModuleMode = 'available' | 'read-only' | 'unavailable'

function moduleMode(state: ScreenStateId): ModuleMode {
  if (state === 'STATE-06') return 'read-only'
  if (state === 'STATE-12') return 'unavailable'
  return 'available'
}

/**
 * `AC-SA-01-03`: an aggregate renders with its as-of time and degrades to
 * stale-with-age or unavailable. It never renders as zero, and never blank.
 */
type AggregateMode = Extract<SaFreshness, 'current' | 'stale' | 'unavailable' | 'loading' | 'empty'>

function aggregateMode(state: ScreenStateId): AggregateMode {
  if (state === 'STATE-01') return 'empty'
  if (state === 'STATE-02') return 'loading'
  if (state === 'STATE-08') return 'stale'
  if (state === 'STATE-12') return 'unavailable'
  return 'current'
}

const READ_ONLY_REASON = 'This module is read-only in this state.'
const UNAVAILABLE_REASON =
  'The session record cannot be read in this state, so nothing can be opened or authorised against it.'

/** The named reason a drawn-but-inert control carries. Never a bare "denied". */
function namedReason(decision: PermissionDecision, mode: ModuleMode, roleReason: string): string {
  if (decision.outcome === 'allowed') return ''
  if (decision.reasonCode === 'ROLE_NOT_GRANTED') return roleReason
  if (decision.reasonCode === 'OBJECT_STATE_INVALID') {
    return mode === 'unavailable' ? UNAVAILABLE_REASON : READ_ONLY_REASON
  }
  return decision.explanation
}

function Section({
  id,
  heading,
  children,
}: {
  readonly id: string
  readonly heading: string
  readonly children: ReactNode
}) {
  return (
    <section aria-labelledby={id} className="mt-8">
      <h2 id={id} className="text-lg font-semibold">
        {heading}
      </h2>
      {children}
    </section>
  )
}

export interface SupportAccessScreenProps {
  /** View-switcher seed, not a login (spec §8). */
  readonly role?: RoleId
  readonly screenState?: ScreenStateId
}

/**
 * Task 7 (closure sweep) — gated behind a real sign-in
 * (`/super-admin/sign-in/`), matching every other Super Admin module this
 * build has migrated off local-state-only fixtures (`OverviewScreen.tsx`,
 * `TenantsScreen.tsx`, `ConsoleUsersScreen.tsx`). Before this task this
 * screen ran with zero `repository.*` calls and no sign-in requirement at
 * all — "Open a support session" could not open anything real, so it
 * needed no real identity either. It does now.
 */
export function SupportAccessScreen(props: SupportAccessScreenProps = {}) {
  return (
    <RequireSession signInHref="/super-admin/sign-in/">
      {(session) => <SupportAccessConsole {...props} session={session} />}
    </RequireSession>
  )
}

function SupportAccessConsole({
  role: explicitRole,
  screenState: initialScreenState = 'STATE-03',
  session,
}: SupportAccessScreenProps & { readonly session: ProductSession }) {
  const router = useRouter()
  const { openSupportSession } = useProductSession()
  const tenantOptions = useRepositoryQuery(selectOpenableTenants)
  const [openPending, setOpenPending] = useState(false)
  const [openError, setOpenError] = useState<string | null>(null)

  // Task 7 (closure sweep) — the switcher's own role still drives every
  // OTHER decision on this page (the whole D16/D17 demonstration this file
  // already carries, unchanged by this task) — but the "Open a support
  // session" control below always acts as the REAL signed-in identity
  // (`session.role`, via `openSupportSession`), never as whatever role the
  // switcher happens to be showing. Defaulting the switcher to the real
  // role keeps the common case (previewing your own account) identical to
  // before; the honesty note beside the control covers the one case they
  // can diverge — switching the viewer to a DIFFERENT role than the one you
  // are actually signed in as.
  const [role, setRole] = useState<RoleId>(explicitRole ?? session.role)
  const [screenState, setScreenState] = useState<ScreenStateId>(initialScreenState)

  const [reasonClass, setReasonClass] = useState('')
  const [tenant, setTenant] = useState('')
  const [ticketRef, setTicketRef] = useState('')
  const [sessionRequested, setSessionRequested] = useState(false)
  const [closureRecorded, setClosureRecorded] = useState(false)
  const [escalationRecorded, setEscalationRecorded] = useState(false)

  const [emergencyClass, setEmergencyClass] = useState('')
  const [declaredScope, setDeclaredScope] = useState('')
  const [rootAuthorised, setRootAuthorised] = useState(false)
  const [adminAuthorised, setAdminAuthorised] = useState(false)

  const mode = moduleMode(screenState)
  /** STATE-06 says every input is disabled, so every input of this module is. */
  const readOnly = mode === 'read-only'
  const aggregate = aggregateMode(screenState)
  const stateDefinition = SCREEN_STATES.find((s) => s.id === screenState) ?? SCREEN_STATES[0]

  const context = {
    state: FIXTURE_STATE,
    identity: {
      signedIn: true,
      role,
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
    actorOfRecord: 'FIXTURE-CONSOLE-OPERATOR',
  }

  // Per-control allowed roles (D16), never the module-level `roles_allowed`,
  // which this module's own extraction states three different ways.
  const readDecision = evaluateAccess(
    {
      action: 'MOD-SA-15:read-session-list',
      allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN', 'PLATFORM_ENGINEER', 'SUPPORT'],
      sourceRefs: ['L42742', 'L54979', 'L58038'],
    },
    context,
  )
  const openDecision = evaluateAccess(
    {
      action: 'MOD-SA-15:open-support-session',
      // D17: the Platform Engineer is absent from this list, and the control
      // is not drawn for it at all — see the absence below.
      allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN', 'SUPPORT'],
      allowedObjectStates: ['available'],
      objectState: mode,
      sourceRefs: ['L45753', 'L103270', 'L16099', 'L55560'],
    },
    context,
  )
  const closeDecision = evaluateAccess(
    {
      action: 'MOD-SA-15:close-own-session',
      allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN', 'SUPPORT'],
      allowedObjectStates: ['available'],
      objectState: mode,
      sourceRefs: ['L16111', 'L16099'],
    },
    context,
  )
  const escalateDecision = evaluateAccess(
    {
      action: 'MOD-SA-15:escalate-to-emergency-path',
      allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN', 'SUPPORT'],
      allowedObjectStates: ['available'],
      objectState: mode,
      sourceRefs: ['L16111', 'L16022'],
    },
    context,
  )
  // The tenant's own control, mirrored here so the reader can see it exists.
  // Its holder is the Tenant Admin, so every console role is refused it.
  const endSessionDecision = evaluateAccess(
    {
      action: 'MOD-SA-15:end-session-from-tenant-banner',
      allowedRoles: ['TENANT_ADMIN'],
      sourceRefs: ['L45700', 'L9966', 'L44272'],
    },
    context,
  )
  const rootAuthDecision = evaluateAccess(
    {
      action: 'MOD-SA-15:authorise-emergency-as-root',
      allowedRoles: ['ROOT_SUPER_ADMIN'],
      allowedObjectStates: ['available'],
      objectState: mode,
      sourceRefs: ['L9737', 'L45832', 'L104252'],
    },
    context,
  )
  const adminAuthDecision = evaluateAccess(
    {
      action: 'MOD-SA-15:authorise-emergency-as-admin',
      allowedRoles: ['ADMIN'],
      allowedObjectStates: ['available'],
      objectState: mode,
      sourceRefs: ['L9737', 'L45832', 'L104252'],
    },
    context,
  )
  // D19: the emergency time box has no source value, so a required field of
  // this form is permanently unset and the control can never activate. The
  // open decision is carried by the policy layer as `clientDecisionRequired`
  // rather than by an `if` in this file.
  const emergencyOpenDecision = evaluateAccess(
    {
      action: 'MOD-SA-15:open-emergency-session',
      allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN'],
      allowedObjectStates: ['available'],
      objectState: mode,
      openDecision: 'DEC-SEC-017',
      sourceRefs: ['L104252', 'L104216', 'L19760'],
    },
    context,
  )

  const engineer = role === 'PLATFORM_ENGINEER'

  const supportRoleReason =
    'Opening a support session is held by the root, the platform Admin and Support (L55560, L16099). This role does not hold it.'
  const emergencyRootReason =
    'The first authorisation on the compliance-emergency path is the Root Super Admin’s alone (L9737). No other role can supply it, and the root cannot supply both.'
  // The mirrored control's holder, named. A disabled control whose reason is a
  // placeholder states no reason at all, which is the rendering the
  // three-rendering rule exists to forbid.
  const endSessionReason =
    'This control belongs to the Tenant Admin, on the tenant’s own banner in the Delivery Operations Hub (L45700, L9966). No console role holds it, including the root — the tenant ends platform access, and the platform cannot end it on the tenant’s behalf.'
  const emergencyAdminReason =
    'The second authorisation is a platform Admin’s alone (L9737). No other role can supply it, and one person can never fill both slots (AC-SA-15-07).'

  const openFormComplete =
    reasonClass !== '' && tenant !== '' && ticketRef.trim() !== '' && mode === 'available'
  const openBlockedReason =
    namedReason(openDecision, mode, supportRoleReason) ||
    (openFormComplete
      ? ''
      : 'A ticket-linked reason class, a tenant and a ticket reference must all be supplied first (AC-SA-15-02, L45832).')
  const openProps = openBlockedReason === '' ? {} : { disabledReason: openBlockedReason }

  // A closure or an escalation leaves the session in a terminal state, so
  // neither control acts on it a second time. The escalation closes this
  // session as it hands the finding on, which is why it sets both.
  const alreadyTerminalReason =
    'This session is already recorded as closed in this prototype run, and a closed session is not closed or escalated again.'

  /**
   * A recorded click never outranks a refusal. The role and screen-state
   * decision is read FIRST, so a role that never held the control is told it
   * does not hold it — not that somebody else's click already used it up.
   * The recorded click is also cleared whenever either switcher moves
   * (`resetRecordedClicks`), so it can never describe a different role's run.
   */
  function recordedOrRefused(
    decision: PermissionDecision,
    roleReason: string,
    recorded: boolean,
    recordedReason: string,
  ): { readonly disabledReason?: string } {
    if (decision.outcome !== 'allowed') {
      return { disabledReason: namedReason(decision, mode, roleReason) }
    }
    return recorded ? { disabledReason: recordedReason } : {}
  }

  const closeProps = recordedOrRefused(
    closeDecision,
    'Closing a session is held by its own operator — the root, the platform Admin or Support (L16111). This role does not hold it.',
    closureRecorded,
    alreadyTerminalReason,
  )
  const escalateProps = recordedOrRefused(
    escalateDecision,
    'Escalation is raised by the operator of the session — the root, the platform Admin or Support (L16111). This role does not hold it.',
    closureRecorded,
    alreadyTerminalReason,
  )
  const rootAuthProps = recordedOrRefused(
    rootAuthDecision,
    emergencyRootReason,
    rootAuthorised,
    'This authorisation is already recorded for this request.',
  )
  const adminAuthProps = recordedOrRefused(
    adminAuthDecision,
    emergencyAdminReason,
    adminAuthorised,
    'This authorisation is already recorded for this request.',
  )

  const emergencyOpenReason =
    emergencyOpenDecision.reasonCode === 'ROLE_NOT_GRANTED'
      ? 'The compliance-emergency path is opened by the Root Super Admin together with one platform Admin (L9737). This role holds neither authorisation.'
      : `Inactive until a named emergency class, a declared scope and a time box are supplied (L104252), and until both authorisation slots are filled (L19760). The time box has no value in the frozen source: ${EMERGENCY_TIME_BOX}.`

  const authorisationCount = (rootAuthorised ? 1 : 0) + (adminAuthorised ? 1 : 0)

  /**
   * One recorded closure, one rendering of it. The detail list, the row for
   * the same session in the table above and the post-click note all read
   * these two values, so no two renderings of this session can disagree.
   * A closed session shows the tenant no banner at all, which is an absence
   * rather than a fourth member of the three-state banner vocabulary.
   */
  const detailState: SessionState = closureRecorded ? 'closed by operator' : SESSION_DETAIL.state
  const detailBanner: string = closureRecorded
    ? 'None — a closed session shows the tenant no banner'
    : SESSION_DETAIL.bannerState

  const sessionRows = SUPPORT_SESSIONS.map((s) => ({
    session: s.id,
    who: s.operator,
    tenant: s.tenantLabel,
    reason: `${s.ticketRef} — ${s.reasonClassLabel}`,
    scope: s.scopeLabel,
    expiry: s.expiryLabel,
    actions: s.actionCountLabel,
    state: (
      <StatusPill tone="info" icon="•" label={s.id === SESSION_DETAIL.id ? detailState : s.state} />
    ),
    banner: s.id === SESSION_DETAIL.id ? detailBanner : s.bannerState,
  }))

  /**
   * The switchers change WHO is looking or WHAT state the module is in. A
   * click recorded under the previous role or state describes neither, so it
   * is dropped rather than carried across.
   */
  function resetRecordedClicks() {
    setSessionRequested(false)
    setClosureRecorded(false)
    setEscalationRecorded(false)
    setRootAuthorised(false)
    setAdminAuthorised(false)
  }

  /**
   * Task 7 (closure sweep) — LV-0010's own door, landed. Calls
   * `repository.ts#openSupportSession` (through `useProductSession()`,
   * which acts as the REAL signed-in identity — see this component's own
   * header comment for why that is never the role switcher above) and, on
   * success, navigates into the read-only Hub view this session now grants
   * — the soft client-side navigation `ProductRuntime` was already
   * confirmed (unit 1's own final review) to preserve state across.
   */
  async function handleOpenSupportSession() {
    setOpenError(null)
    setOpenPending(true)
    const reasonLabel = reasonClass === UNSPECIFIED_REASON_CLASS_VALUE ? UNSPECIFIED_REASON_CLASS_LABEL : reasonClass
    const result = await openSupportSession(tenant, `${ticketRef.trim()} — ${reasonLabel}`)
    setOpenPending(false)
    if (result.kind === 'opened') {
      setSessionRequested(true)
      router.push('/hub/support-session/')
      return
    }
    if (result.kind === 'denied') {
      // `ROLE_NOT_GRANTED`'s own generic default (`policy/decision.ts
      // #REASON_CODES`) carries no citation — substituted with this file's
      // own citation-backed `supportRoleReason`, the same text `namedReason`
      // already renders for the DEMO decision this door parallels, so a
      // denied role is never told only "the current role does not carry a
      // grant for this action."
      setOpenError(result.reason === 'ROLE_NOT_GRANTED' ? supportRoleReason : result.explain)
    } else if (result.kind === 'persistence-unavailable') {
      setOpenError(result.explain)
    } else {
      setOpenError('Sign in to open a support session.')
    }
  }

  return (
    <SaConsoleShell module={MODULE}>
      <p className="text-xs text-[var(--color-ink-subtle)]">
        Screens annotated SCR-SA-21 (support session list and per-session detail, L42813, L45753)
        and SCR-SA-22 (compliance-emergency initiation and post-session report, L42814), with
        storyboards SB-SA-15 (L45753) and SB-BG-01 (L74622). Names are canonical; the numbers are
        annotations only, and this route is keyed on the module slug.
      </p>

      <div className="mt-6 flex flex-wrap gap-6 rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4">
        <Select
          label="View as platform role"
          value={role}
          onChange={(v) => {
            setRole(v as RoleId)
            resetRecordedClicks()
          }}
          options={SUPPORT_PLATFORM_ROLES.map((r) => ({
            value: r.id,
            label: `${r.name} — ${r.roleAnnotation}`,
          }))}
        />
        <Select
          label="Screen state (fixture)"
          value={screenState}
          onChange={(v) => {
            setScreenState(v as ScreenStateId)
            resetRecordedClicks()
          }}
          options={SA_APPLICABLE_STATES.map((s) => ({ value: s.id, label: `${s.id} — ${s.name}` }))}
        />
        <p className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
          The role control is a view switcher, not a login. Nothing here authenticates anybody, no
          session below is real, and no tenant workspace is connected to this storyboard.
        </p>
      </div>

      <div className="mt-4 rounded-[var(--radius-surface)] bg-[var(--color-surface-sunken)] p-4 text-sm">
        <p className="font-medium">
          {stateDefinition.id} — {stateDefinition.name}
        </p>
        <p className="mt-1 text-[var(--color-ink-muted)]">{stateDefinition.contract}</p>
        <p className="mt-1 text-[var(--color-ink-muted)]">{stateDefinition.neverDo}</p>
      </div>

      {readOnly ? (
        <div className="mt-4">
          <Banner
            tone="attention"
            heading="Read-only"
            body="One cause: this fixture puts the module into a read-only state, so every input below is disabled and no session can be opened, closed or authorised from it. Every panel below still reads."
          />
        </div>
      ) : null}

      {screenState === 'STATE-11' || screenState === 'STATE-10' ? (
        <div className="mt-4">
          <Banner
            tone="info"
            heading={
              screenState === 'STATE-11'
                ? 'Every artificial-intelligence model is unavailable'
                : 'Artificial intelligence is degraded'
            }
            body="This module remains fully operable: no part of this module depends on a model. A support session is opened, mirrored, time-boxed and ended by deterministic machinery, and every refusal on this screen is a policy decision rather than a generated one (AC-SA-000-09, L42887)."
          />
        </div>
      ) : null}

      <Section id="sa15-invariant" heading="Enforced invariant on this module">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          It renders locked, with no off position for any account including the root. It is a status
          readout. There is no switch here, and no approval path around one.
        </p>
        <div className="mt-3">
          {SA_INVARIANTS.filter((i) => i.id === 'one-transaction-audit-guarantee').map((i) => (
            <InvariantChip key={i.id} invariant={i} />
          ))}
        </div>
        <p className="mt-3 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          This is the invariant that makes the read accountable rather than merely permitted. Every
          cross-boundary access is written twice in one transaction — once in the platform stream and
          once in the tenant’s own — and a mirror write that fails refuses the read (L14886). A
          session that cannot be mirrored cannot open.
        </p>
      </Section>

      <Section id="sa15-classes" heading="The access classes this module owns">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Two of the three named access classes live here. Nothing else reaches record-level tenant
          content, on any screen (AC-SA-000-07, AC-SEC-801). There is no ambient browsing anywhere on
          this console, and this module is where the absence of it is most visible: a tenant name
          below opens nothing at all.
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {ACCESS_CLASSES.map((c) => (
            <li key={c.id}>
              <span className="font-medium">{c.name}</span>{' '}
              <span className="text-[var(--color-ink-muted)]">{c.description}</span>{' '}
              {c.id === 'jbs-access-grant' ? (
                <Link
                  href="/super-admin/jbs-access/"
                  className="text-[var(--color-primary)] underline"
                >
                  Held in JBS Access
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sa15-list" heading="Support session list">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Active and historical sessions: who, tenant, reason, scope, expiry and action count
          (L54979, L58038). The action count is a count of the platform operator’s own reads inside
          one session — the figure the two audit streams are reconciled against (L14880). It measures
          nobody inside the tenant.
        </p>
        <div className="mt-3">
          {aggregate === 'unavailable' ? (
            <p className="text-sm">
              Unavailable — the session list could not be read in this state. A list that could not
              be read is never rendered as a count and never left blank.
            </p>
          ) : (
            <>
              <Table
                caption="Support sessions"
                columns={[
                  { key: 'session', header: 'Session' },
                  { key: 'who', header: 'Who' },
                  { key: 'tenant', header: 'Tenant' },
                  { key: 'reason', header: 'Ticket and reason class' },
                  { key: 'scope', header: 'Scope' },
                  { key: 'expiry', header: 'Expiry' },
                  { key: 'actions', header: 'Action count' },
                  { key: 'state', header: 'State' },
                  { key: 'banner', header: 'Tenant banner' },
                ]}
                loading={aggregate === 'loading'}
                rows={aggregate === 'empty' ? [] : sessionRows}
                emptyState={{
                  title: 'No support session has been opened against any tenant yet',
                  whatCreatesIt:
                    'A session is created by the open form below, against a ticket-linked reason class. Nothing else on this console creates one.',
                }}
              />
              {aggregate === 'loading' ? null : (
                <div className="mt-2">
                  <FreshnessLabel
                    asOfLabel={aggregate === 'stale' ? SESSION_LIST_STALE_AS_OF : SESSION_LIST_AS_OF}
                    originLabel={SESSION_LIST_ORIGIN}
                  />
                </div>
              )}
            </>
          )}
        </div>
        <p className="mt-3 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          The eight states of OBJ-SA-SESSION (L45772): {SESSION_STATES.join(', ')}. An expired
          session records any period beyond its box as an overrun for investigation (L56107).
        </p>
        <div className="mt-2">
          {/* The read is granted to all four console roles (D16, L42742), so this
              renders nothing today. It stays because a future narrowing of the
              read must surface as a stated refusal rather than a vanished panel.
              The refusal on every OTHER control is carried by the control's own
              named reason instead of a second notice: one cause, one message. */}
          <PermissionNotice decision={readDecision} />
        </div>
      </Section>

      <Section id="sa15-detail" heading={`Session detail — ${SESSION_DETAIL.id}`}>
        <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium">Who</dt>
            <dd className="text-[var(--color-ink-muted)]">{SESSION_DETAIL.operator}</dd>
          </div>
          <div>
            <dt className="font-medium">Tenant</dt>
            <dd className="text-[var(--color-ink-muted)]">{SESSION_DETAIL.tenantLabel}</dd>
          </div>
          <div>
            <dt className="font-medium">Ticket and reason class</dt>
            <dd className="text-[var(--color-ink-muted)]">
              {SESSION_DETAIL.ticketRef} — {SESSION_DETAIL.reasonClassLabel}
            </dd>
          </div>
          <div>
            <dt className="font-medium">Declared scope</dt>
            <dd className="text-[var(--color-ink-muted)]">{SESSION_DETAIL.scopeLabel}</dd>
          </div>
          <div>
            <dt className="font-medium">Time box</dt>
            <dd className="text-[var(--color-ink-muted)]">{SUPPORT_TIME_BOX}</dd>
          </div>
          <div>
            <dt className="font-medium">Capability inside the session</dt>
            <dd className="text-[var(--color-ink-muted)]">
              Read-only without exception, for every account including the root (AC-SA-15-01,
              L45832).
            </dd>
          </div>
          <div>
            <dt className="font-medium">Tenant banner</dt>
            <dd className="text-[var(--color-ink-muted)]">{detailBanner}</dd>
          </div>
          <div>
            <dt className="font-medium">Session state</dt>
            <dd className="text-[var(--color-ink-muted)]">{detailState}</dd>
          </div>
        </dl>

        <p className="mt-3 max-w-prose text-sm">
          No banner means no session: no read of tenant content is served before the tenant banner is
          confirmed on screen and the session-open event is committed to the tenant’s own stream
          (AC-4870, L107883). A missed banner heartbeat suspends the session and no further read is
          served until the banner is confirmed again (L14887). The three banner states a live session
          carries are {BANNER_STATES.join('; ')}. A closed session carries none of them, because it
          shows the tenant no banner at all.
        </p>

        <div className="mt-4 flex flex-wrap items-start gap-4">
          <div>
            <Button {...closeProps} variant="secondary" onClick={() => setClosureRecorded(true)}>
              Close this session
            </Button>
          </div>
          <div>
            <Button
              {...escalateProps}
              variant="secondary"
              onClick={() => {
                setEscalationRecorded(true)
                setClosureRecorded(true)
              }}
            >
              Escalate to the compliance-emergency path
            </Button>
          </div>
          <div>
            <Button {...{ disabledReason: namedReason(endSessionDecision, mode, endSessionReason) }}>
              End session (tenant control)
            </Button>
          </div>
        </div>
        {closureRecorded ? (
          <div className="mt-3">
            <StatusPill
              tone="info"
              icon="•"
              label={escalationRecorded ? 'escalation noted in this run' : 'closure noted in this run'}
            />
            <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
              What the prototype did: it re-rendered this fixture session as{' '}
              <span className="font-medium">{detailState}</span> — in the list above and in the
              session detail alike — and nothing else.{' '}
              {escalationRecorded
                ? 'No compliance-emergency session was initiated — that path still needs its two authorisations and a time box the source does not fix.'
                : 'No tenant access was withdrawn.'}{' '}
              No tenant workspace is connected to this storyboard, so no access was cut off, no
              tenant saw a banner appear or disappear, no post-session report was raised and nothing
              was written to either audit stream. Reload the page, or move either switcher above, and
              the fixture session is back as it was.
            </p>
          </div>
        ) : null}
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The End-session control belongs to the tenant, on its own banner in the Delivery Operations
          Hub (L45700, L9966). It is mirrored into this detail so a reader can see it exists; no
          console role can press it, and on the tenant side it terminates platform access immediately
          (AC-SA-15-05). No support session ever becomes a write session: an escalation hands the
          finding to the compliance-emergency path and closes this one.
        </p>
      </Section>

      {engineer ? (
        <Section id="sa15-engineer" heading="The Platform Engineer and tenant context (D17)">
          <ProhibitionNotice
            rendering={{
              kind: 'absent',
              note: 'No session-open form and no compliance-emergency form is drawn for the Platform Engineer. Four matrices answer this act for that role and they disagree: L21166 refuses FUNC-SA-015 "Open a read-only support session" as `Explicitly prohibited`, L48810 gives the same act `Unavailable` in that column, L65407 grants it `Allowed with conditions`, and this module’s own matrix at L45794 grants it bare `Allowed`. The compliance-emergency path is separately refused to this role at L45798. Derived Clarification, not a stated rule: no line of the frozen source says this role may not enter tenant context under any access class, and nothing here quotes one as though it did — D17 reads it that way from the Band A and Band B separation and holds the prohibition, the narrower grant being the safer prototype. Nothing is drawn here — not a disabled control, because a disabled control would imply an enabled state exists somewhere for this role.',
            }}
          />
          <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
            The read of the session list above is unaffected. Reading who accessed which tenant, and
            when, is not entering tenant context.
          </p>
        </Section>
      ) : (
        <>
          <Section id="sa15-open" heading="Open a support session">
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
              The ticket-linked reason class is selected first, and the tenant selector stays inert
              until it is (L45753). That ordering is the control: it prevents browse-first,
              justify-later. A session cannot open without a ticket-linked reason class at all
              (AC-SA-15-02).
            </p>

            <div className="mt-4 max-w-xl space-y-4">
              <Field
                label="Ticket-linked reason class"
                required
                description="Selected before anything else. The closed list this field draws from is never enumerated in the frozen source — see Unspecified in source."
              >
                <select
                  value={reasonClass}
                  disabled={readOnly}
                  onChange={(e) => setReasonClass(e.target.value)}
                  className="w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-2 text-sm text-[var(--color-ink)]"
                >
                  <option value="">— not selected —</option>
                  <option value={UNSPECIFIED_REASON_CLASS_VALUE}>
                    {UNSPECIFIED_REASON_CLASS_LABEL}
                  </option>
                </select>
              </Field>

              <Field
                label="Tenant"
                required
                // In read-only the single cause is the banner's, so this field
                // never adds the ordering rule as a second cause of inertness.
                description={
                  !readOnly && reasonClass === ''
                    ? 'Inert until a ticket-linked reason class is selected (L45753). The reason exists before the tenant is named, never after.'
                    : 'One tenant per session. Naming a tenant here requests a session; it opens nothing by itself.'
                }
              >
                <select
                  value={tenant}
                  disabled={readOnly || reasonClass === ''}
                  onChange={(e) => setTenant(e.target.value)}
                  className="w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-2 text-sm text-[var(--color-ink)] disabled:opacity-50"
                >
                  <option value="">— not selected —</option>
                  {tenantOptions.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Ticket reference"
                required
                description="Mandatory (L103270). The source names no format, so this field is required and otherwise unvalidated."
                {...(screenState === 'STATE-04' && ticketRef.trim() === ''
                  ? { error: 'A ticket reference is required. Any non-empty reference is accepted, because the source fixes no format for one.' }
                  : {})}
              >
                <input
                  type="text"
                  value={ticketRef}
                  disabled={readOnly}
                  onChange={(e) => setTicketRef(e.target.value)}
                  className="w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-2 text-sm text-[var(--color-ink)]"
                />
              </Field>

              <div>
                <p className="text-sm font-medium">Time box</p>
                <p className="text-sm text-[var(--color-ink-muted)]">{SUPPORT_TIME_BOX}</p>
              </div>

              <div>
                <Button {...openProps} loading={openPending} onClick={() => void handleOpenSupportSession()}>
                  Open a support session
                </Button>
                <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
                  This control acts as your real signed-in account ({session.identity},{' '}
                  {session.role === role ? 'currently previewed above' : 'not the role currently previewed above'}
                  ), never as the &ldquo;View as platform role&rdquo; selector, which is a reviewer aid
                  only and performs no real action.
                </p>
              </div>
              {openError !== null ? (
                <p
                  data-control-id="support-access-open-error"
                  className="max-w-prose text-sm text-[var(--color-status-blocked)]"
                >
                  {openError}
                </p>
              ) : null}
              {screenState === 'STATE-09' ? (
                <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
                  Queued: a request that has been accepted is shown in its true state —{' '}
                  <span className="font-medium">requested</span>, one of the eight states of
                  OBJ-SA-SESSION — and never as an open session. Nothing is read until the state is
                  active and the tenant’s banner is confirmed on screen.
                </p>
              ) : null}
              {sessionRequested ? (
                <div>
                  <StatusPill tone="info" icon="•" label="session requested" />
                  <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
                    A request is shown in its own state. Nothing here has reached a tenant workspace:
                    none is connected to this storyboard, and no read is served until the tenant’s
                    banner is confirmed on screen.
                  </p>
                </div>
              ) : null}
            </div>
          </Section>

          <Section id="sa15-emergency" heading="Compliance-emergency initiation (SCR-SA-22)">
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
              The only path with write capability into tenant data, and the only entry into a
              compliance-suspended tenant (AC-SA-15-10). It is a scope-declaration form before it is
              anything else: the scope is declared before the session opens and can never be widened
              during it (AC-SA-15-08). Two distinct people authorise it — the Root Super Admin and one
              platform Admin — and it cannot be initiated by one person (AC-SA-15-07).
            </p>

            <div className="mt-4 max-w-xl space-y-4">
              <Field
                label="Named emergency class"
                required
                description="Required before the Open control activates (L104252). The list of classes is never enumerated in the frozen source — see Unspecified in source."
              >
                <select
                  value={emergencyClass}
                  disabled={readOnly}
                  onChange={(e) => setEmergencyClass(e.target.value)}
                  className="w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-2 text-sm text-[var(--color-ink)]"
                >
                  <option value="">— not selected —</option>
                  <option value={UNSPECIFIED_EMERGENCY_CLASS_VALUE}>
                    {UNSPECIFIED_EMERGENCY_CLASS_LABEL}
                  </option>
                </select>
              </Field>

              <Field
                label="Declared scope"
                required
                description="Declared before the session opens and never widened during it (AC-SA-15-08). The source states no vocabulary for a scope, so this is free text."
              >
                <input
                  type="text"
                  value={declaredScope}
                  disabled={readOnly}
                  onChange={(e) => setDeclaredScope(e.target.value)}
                  className="w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-2 text-sm text-[var(--color-ink)]"
                />
              </Field>

              <div>
                <p className="text-sm font-medium">Time box (required)</p>
                <p className="text-sm text-[var(--color-status-blocked)]">{EMERGENCY_TIME_BOX}</p>
                <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
                  D19: the two-hour default belongs to normal support sessions only (L103270).
                  DEC-SEC-017 records that this path’s own default is undecided, so the field renders
                  required-and-unset rather than borrowing a number nobody chose. A required field
                  with no value is why the Open control below can never activate in this prototype —
                  which is the honest rendering of an undecided bound on break-glass access.
                </p>
              </div>

              <div className="flex flex-wrap items-start gap-4">
                <div>
                  <Button {...rootAuthProps} onClick={() => setRootAuthorised(true)}>
                    Authorise as the Root Super Admin
                  </Button>
                </div>
                <div>
                  <Button {...adminAuthProps} onClick={() => setAdminAuthorised(true)}>
                    Authorise as the platform Admin
                  </Button>
                </div>
              </div>

              <p className="text-sm">
                {authorisationCount === 0
                  ? 'No authorisation recorded. Two distinct people are needed before this path can open.'
                  : authorisationCount === 1
                    ? 'One of two authorisations recorded. A second, different person holding the other role must supply the remaining one; no single person can fill both slots.'
                    : 'Both authorisations recorded. The remaining required field is the time box, which the source does not fix.'}
              </p>

              <div>
                <Button disabledReason={emergencyOpenReason}>
                  Open the compliance-emergency session
                </Button>
              </div>

              <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
                At closure the tenant receives an automatic post-session report stating what was
                accessed, retained even if its delivery fails (OBJ-SA-POSTREPORT, L45772). An
                outstanding report is a tracked, visible obligation in both streams (L56144). The
                seven states of OBJ-SA-EMERGENCYSESSION: {EMERGENCY_SESSION_STATES.join(', ')}.
              </p>
            </div>
          </Section>
        </>
      )}

      <Section id="sa15-mirror" heading="Mirrored into the tenant’s own record">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Every platform-side access event against a tenant appears in that tenant’s own audit stream
          and on its Platform Access History screen (L6983). That is a tenant right, not a platform
          courtesy: no unmirrored platform-side act against a tenant persists (L55946), and a mirror
          write that fails refuses the action outright (L14886).
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Platform Access History is the tenant’s own screen, on the Delivery Operations Hub, and it
          is not reachable from this console — reaching it would be the ambient browsing this surface
          forbids. The platform-side half of the same record is here:{' '}
          <Link href="/super-admin/platform-audit/" className="text-[var(--color-primary)] underline">
            Platform Audit
          </Link>
          .
        </p>
        {screenState === 'STATE-13' ? (
          <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
            Recovering: the action counts held in the platform stream and in the tenant’s own stream
            are being compared, session by session, and a discrepancy is raised as a finding rather
            than reconciled away (FB-SUP-001, L16125). Two of the three sessions above have been
            compared so far. Nothing is presented as reconciled until all three are.
          </p>
        ) : null}
      </Section>

      <Section id="sa15-critical" heading="The critical class on this module">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The class badge that replaces an action bar is for a critical-class action seen by a
          non-root role, and none of the eleven critical-class actions is held by this module: tier
          publication, compliance suspension, all-tenant broadcast, device wipe, emergency pause,
          emergency resume, erasure and archival execution, retention-value changes, legal-hold place
          and release, severity-catalog changes, floor-register changes. So no badge is drawn here.
          Drawing one anyway would be rendering a prohibition by taste rather than by rule, and it
          would misdescribe the two-authorisation rule — which is not a root approval of somebody
          else’s request but two people acting together, one of whom is the root.
        </p>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          Compliance suspension is on that list and belongs to Tenants, Lifecycle and Pilots. This
          module holds only the re-entry path into an already-suspended tenant.{' '}
          {CRITICAL_ACTIONS.length} actions carry the class.
        </p>
      </Section>

      <Section id="sa15-absent" heading="Controls that do not exist here">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Each is drawn as a note in the place a control would sit. None is a disabled control,
          because a disabled control implies an enabled state exists somewhere — and for these, for
          every account including the root, it does not.
        </p>
        <ul className="mt-3 space-y-3">
          {SUPPORT_ABSENT_CONTROLS.map((c) => (
            <li key={c.label}>
              <p className="text-sm font-medium">{c.label}</p>
              <ProhibitionNotice rendering={{ kind: 'absent', note: c.note }} />
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sa15-workflows" heading="Workflows this module renders">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The extraction attaches no module identifier to any workflow, so each row states how it was
          matched to this module — by name, by the module row that lists it as a key function, or by
          line proximity to this module’s own passage.
        </p>
        <ul className="mt-3 space-y-3 text-sm">
          {SUPPORT_WORKFLOWS.map((w) => (
            <li key={w.id}>
              <p className="font-medium">{w.name}</p>
              <p className="text-xs text-[var(--color-ink-subtle)]">{w.id}</p>
              <p className="text-[var(--color-ink-muted)]">
                {w.actor} · {w.trigger}
              </p>
              <p className="text-[var(--color-ink-muted)]">Ends at: {w.terminalStates.join('; ')}.</p>
              <p className="text-xs text-[var(--color-ink-subtle)]">Matched by {w.matchedBy}.</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sa15-unspecified" heading="Unspecified in source">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Each affordance below is one the source does not define. It is named rather than invented: a
          plausible invented control reads back as a requirement.
        </p>
        <ul className="mt-3 space-y-3 text-sm">
          {SUPPORT_UNSPECIFIED_IN_SOURCE.map((u) => (
            <li key={u.affordance}>
              <p className="font-medium">{u.affordance}</p>
              <p className="text-[var(--color-ink-muted)]">{u.note}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sa15-conflicts" heading="Conflicts in the source">
        <ul className="mt-3 space-y-3 text-sm">
          {SUPPORT_SOURCE_CONFLICTS.map((c) => (
            <li key={c.topic}>
              <p className="font-medium">{c.topic}</p>
              <p className="text-[var(--color-ink-muted)]">{c.conflict}</p>
              <p className="text-[var(--color-ink-muted)]">Resolved as: {c.resolution}</p>
            </li>
          ))}
        </ul>
      </Section>
    </SaConsoleShell>
  )
}
