'use client'

import { useState, type ReactNode } from 'react'
import type { RoleId } from '@/domain/roles'
import { emptyDomainState } from '@/domain/state'
import { scenarioRunId } from '@/domain/ids'
import { evaluateAccess } from '@/policy/evaluate'
import type { PermissionDecision } from '@/policy/decision'
import { saModuleById, SA_MODULES } from '@/surfaces/sa/modules'
import { SA_INVARIANTS } from '@/surfaces/sa/invariants'
import { ACCESS_CLASSES } from '@/surfaces/sa/access-classes'
import { CRITICAL_ACTIONS, CRITICAL_ACTION_COUNT_NOTE } from '@/surfaces/sa/critical-actions'
import { SCREEN_STATES, type ScreenStateId } from '@/ui/screen-state'
import { InvariantChip } from '@/ui/sa/InvariantChip'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import { SA_APPLICABLE_STATES } from '@/surfaces/sa/screen-states'
import {
  Banner,
  Button,
  FreshnessLabel,
  Select,
  SkeletonBlock,
  StatusPill,
  Table,
  type StatusTone,
} from '@/ui/primitives'
import { SaConsoleShell } from '../SaConsoleShell'
import {
  AGE_BANDS,
  APPROVAL_REQUESTS,
  APPROVAL_STATES,
  CHANGE_CLASSES,
  CONSOLE_ACCOUNTS,
  MATRIX_CONFIGURATION_VERSION,
  MATRIX_TOKEN_LABEL,
  QUEUE_AS_OF,
  QUEUE_ORIGIN,
  QUEUE_STALE_AS_OF,
  ROOT_ACCOUNT_RULE,
  ROOT_FREEZE_HEADLINE,
  ROOT_FROZEN_CAPABILITIES,
  ROOT_SELF_APPROVAL_NOTE,
  SA08_ABSENT_CONTROLS,
  SA08_PLATFORM_ROLES,
  SA08_SOURCE_CONFLICTS,
  SA08_UNSPECIFIED_IN_SOURCE,
  SA08_WORKFLOWS,
  matrixCell,
  type AgeBand,
  type ApprovalRequestFixture,
  type ApprovalState,
  type ChangeClassId,
} from './fixtures'

const MODULE = saModuleById('MOD-SA-08')

/** The twelve applicable states: all thirteen less the frontline-only STATE-07. */

/**
 * STATE-13: how far the re-read has reached (fixture). The banner, the row
 * set and the aggregate all read this one number, so the screen cannot say
 * two of eight are unrecovered while drawing all eight.
 */
const REREAD_RECORD_COUNT = 6

/** No backend, no clock — the policy layer is handed an empty seeded state. */
const FIXTURE_STATE = emptyDomainState(scenarioRunId('SA-08-CONSOLE-USERS'))

/**
 * What the SCREEN is doing, as distinct from who is looking. Both axes run
 * through `evaluateAccess`'s object-state stage rather than a hand-rolled
 * `if`, so a state refusal is a typed decision like any other.
 */
type WriteMode = 'open' | 'read-only' | 'write-failed'

function writeMode(state: ScreenStateId): WriteMode {
  if (state === 'STATE-06') return 'read-only'
  if (state === 'STATE-12') return 'write-failed'
  return 'open'
}

type AggregateMode = 'current' | 'stale' | 'unavailable' | 'loading'

function aggregateMode(state: ScreenStateId): AggregateMode {
  if (state === 'STATE-02') return 'loading'
  if (state === 'STATE-08') return 'stale'
  if (state === 'STATE-12') return 'unavailable'
  return 'current'
}

const STATE_TONE: Record<ApprovalState, StatusTone> = {
  pending: 'info',
  approved: 'ok',
  returned: 'attention',
  applied: 'ok',
  'approved-not-applied': 'attention',
  'approved-not-executed': 'attention',
}

/**
 * The named reason an inert control carries. Never a bare "denied": the
 * refusal has to say which rule refused, in words a reviewer can check
 * against the source.
 */
function namedReason(decision: PermissionDecision, mode: WriteMode): string {
  switch (decision.reasonCode) {
    case 'ROLE_NOT_GRANTED':
      return 'This role does not carry the decision on this class. Engineering class is the Admin’s (the root may also approve); critical class is the root’s alone (AC-SA-08-06, L44880).'
    case 'SEGREGATION_OF_DUTIES':
      return 'This identity proposed this change, and no account approves its own submission — the same person cannot both make and approve it (AC-SA-08-05, L44879). The refusal is recorded.'
    case 'APPROVER_UNAVAILABLE':
      return `${ROOT_FREEZE_HEADLINE} (DEC-ROOTSUCC-001). The request stays pending and visible rather than expiring.`
    case 'OBJECT_STATE_INVALID':
      if (mode === 'read-only') return 'This screen is read-only in this state, so no decision can be taken from it.'
      if (mode === 'write-failed')
        return 'The approval write failed. The object is unchanged and the request is still pending, so nothing here is treated as decided (FB-SA-02).'
      return 'Only a pending request can be decided. This one has already been decided.'
    default:
      // Deliberately NOT `decision.explanation`. Three strings in the
      // shared REASON_CODES table (`src/policy/decision.ts` lines 157, 161
      // and 165) spell one of the four words D10 bans from every word of
      // SURF-SA copy. Rendering a shared explanation verbatim puts that
      // word on screen for any role the decision refuses, so every reason
      // this module shows is written here instead. Reproduced against the
      // already-committed MOD-SA-05 as well, viewed as Support.
      return `${decision.reasonCode}: this control is not available in the current combination of role and state. ${decision.conditionToEnable ?? ''}`.trim()
  }
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

export interface ConsoleUsersScreenProps {
  /** View-switcher seed, not a login (spec §8). */
  readonly role?: RoleId
  readonly screenState?: ScreenStateId
  /** D13: root-unavailable is a first-class, visible screen state. */
  readonly rootAvailable?: boolean
}

export function ConsoleUsersScreen({
  role: initialRole = 'ADMIN',
  screenState: initialScreenState = 'STATE-03',
  rootAvailable: initialRootAvailable = true,
}: ConsoleUsersScreenProps = {}) {
  const [role, setRole] = useState<RoleId>(initialRole)
  const [screenState, setScreenState] = useState<ScreenStateId>(initialScreenState)
  const [rootAvailable, setRootAvailable] = useState<boolean>(initialRootAvailable)
  const [classFilter, setClassFilter] = useState<string>('any')
  const [stateFilter, setStateFilter] = useState<string>('any')
  const [ageFilter, setAgeFilter] = useState<string>('any')
  const [proposerFilter, setProposerFilter] = useState<string>('any')
  const [exportShown, setExportShown] = useState<boolean>(false)
  const [criticalTarget, setCriticalTarget] = useState<string>(CRITICAL_ACTIONS[0].id)
  const [criticalAttempt, setCriticalAttempt] = useState<boolean>(false)
  // Decisions the reader has taken in this fixture session. A decision moves
  // a request to `approved`, never to `applied`: application is a separate
  // step this console does not perform (AC-SA-08-08, WF-ROLE-015).
  const [decided, setDecided] = useState<Record<string, ApprovalState>>({})
  // Declines are held apart from `decided` on purpose. The source closes the
  // approval-state set at six and no member of it means "declined", so this
  // screen records the act and refuses to mint a seventh state name.
  const [declined, setDeclined] = useState<readonly string[]>([])
  const [usersPaneNotice, setUsersPaneNotice] = useState<string>('')

  /**
   * Interaction state records what THIS reader did in THIS role, state and
   * root-availability. A recorded click never outranks a role or a screen
   * state, so moving any switcher clears it: no decision taken as the root
   * survives into a role that never held the control, and no "approved"
   * note survives into a state whose banner says nothing was decided.
   */
  const resetInteraction = () => {
    setUsersPaneNotice('')
    setDecided({})
    setDeclined([])
    setCriticalAttempt(false)
  }

  const mode = writeMode(screenState)
  const aggregate = aggregateMode(screenState)
  const stateDefinition = SCREEN_STATES.find((s) => s.id === screenState) ?? SCREEN_STATES[0]
  const actorOfRecord =
    SA08_PLATFORM_ROLES.find((r) => r.id === role)?.actorOfRecord ?? 'ACT-UNATTRIBUTED'
  const isRoot = role === 'ROOT_SUPER_ADMIN'

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
    actorOfRecord,
  }

  /* ---------------- Users pane: root-only administration ---------------- */

  /** The accounts this screen HAS in this state; the table below reads the same list. */
  // STATE-01 has no accounts; STATE-02 has not read them yet. Both leave the
  // table drawing no rows, so both must leave this list empty -- otherwise the
  // controls and notices above the table describe five accounts it does not
  // draw, which is the aggregate-and-table divergence this module already
  // fixed once for the queue.
  const accountsUnread = screenState === 'STATE-02'
  const accountRecords =
    screenState === 'STATE-01' || accountsUnread ? [] : CONSOLE_ACCOUNTS

  /**
   * Three of the four Users-pane controls act ON an existing account. Under
   * STATE-01 there is none, so they refuse for that cause instead of
   * printing a notice about accounts the same screen says do not exist.
   * Creation is the exception: STATE-01 keeps the creating action.
   */
  const accountObjectState = accountsUnread
    ? 'not-yet-read'
    : accountRecords.length === 0
      ? 'no-account-exists'
      : mode

  const rootOnly = (
    action: string,
    refs: readonly string[],
    objectState: string = mode,
  ): PermissionDecision =>
    evaluateAccess(
      {
        action,
        allowedRoles: ['ROOT_SUPER_ADMIN'],
        allowedObjectStates: ['open'],
        objectState,
        sourceRefs: refs,
      },
      context,
    )

  const createDecision = rootOnly('MOD-SA-08:create-console-account', ['L44774', 'L55552', 'L76133'])
  const roleAssignmentDecision = rootOnly('MOD-SA-08:role-assignment', ['L55552'], accountObjectState)
  const disableDecision = rootOnly('MOD-SA-08:disable-console-account', ['L55552'], accountObjectState)
  const lastActivityDecision = rootOnly('MOD-SA-08:last-activity-review', ['L55552'], accountObjectState)

  const rootOnlyReason =
    'Console account administration is a root-only administrative action, and no proposal path exists around it (L21026, L55552).'

  /**
   * One reason per cause, chosen by the code the decision actually carries —
   * not one fixed string. A role refusal says root-only; an empty pane says
   * the pane is empty; a read-only or failed-write screen repeats the one
   * cause its banner already names, rather than printing a second one.
   */
  const usersPaneReason = (decision: PermissionDecision): string =>
    decision.reasonCode === 'ROLE_NOT_GRANTED'
      ? rootOnlyReason
      : accountsUnread
        ? 'The console accounts have not been read yet in this state, so there is nothing on screen to act on. The table below draws no row until they are.'
        : accountRecords.length === 0
          ? 'No console account exists yet, so there is nothing to act on. The root creates the first account from this pane, and this control acts once one exists.'
          : mode === 'write-failed'
            ? // NOT namedReason's write-failed string: that one says "the request
              // is still pending", and these three controls have no request
              // behind them. The account pane writes directly.
              'The last write on this console failed, so this pane takes no further account action until it is retried. No account changed.'
            : namedReason(decision, mode)

  const inertProps = (decision: PermissionDecision, reason: string) =>
    decision.outcome === 'allowed' ? {} : { disabledReason: reason }

  /* ---------------------------- The queue ------------------------------ */

  /**
   * The records this screen HAS in this state. The queue table, the account
   * table and the Queue-standing aggregate all read from here, so no
   * aggregate can count records the tables on the same screen say do not
   * exist (STATE-01), and no row can be drawn that STATE-13 says has not
   * been re-read yet.
   */
  const queueRecords: readonly ApprovalRequestFixture[] =
    screenState === 'STATE-01'
      ? []
      : screenState === 'STATE-13'
        ? APPROVAL_REQUESTS.slice(0, REREAD_RECORD_COUNT)
        : APPROVAL_REQUESTS
  const unrereadRecords: readonly ApprovalRequestFixture[] =
    APPROVAL_REQUESTS.slice(REREAD_RECORD_COUNT)

  const rows = queueRecords.filter((r) => {
    if (classFilter !== 'any' && r.changeClass !== classFilter) return false
    if (stateFilter !== 'any' && r.state !== stateFilter) return false
    if (proposerFilter !== 'any' && r.proposerLabel !== proposerFilter) return false
    if (ageFilter === 'any') return true
    if (ageFilter === 'today') return r.ageBand === 'today'
    if (ageFilter === 'older than one day') return r.ageBand !== 'today'
    return r.ageBand === 'older than three days'
  })

  /**
   * AC-SA-08-05 is a hard gate — except for one case the source creates and
   * then leaves open: the root deciding its own CRITICAL request, because
   * DEC-ROOTSUCC-001 assigns no second critical approver (the extraction
   * records the clash itself at L55989). The exception is narrow, explicit,
   * and rendered on the row rather than resolved quietly here.
   */
  function selfApprovalApplies(request: ApprovalRequestFixture): boolean {
    return !(isRoot && request.changeClass === 'critical')
  }

  function effectiveState(request: ApprovalRequestFixture): ApprovalState {
    return decided[request.id] ?? request.state
  }

  function approveDecision(request: ApprovalRequestFixture): PermissionDecision {
    const critical = request.changeClass === 'critical'
    return evaluateAccess(
      {
        action: `MOD-SA-08:approve:${request.id}`,
        allowedRoles: critical ? ['ROOT_SUPER_ADMIN'] : ['ADMIN', 'ROOT_SUPER_ADMIN'],
        allowedObjectStates: ['pending'],
        objectState: mode === 'open' ? effectiveState(request) : mode,
        ...(selfApprovalApplies(request) ? { makerCheckerOf: request.proposerActor } : {}),
        ...(critical ? { requiresApproverAvailable: true, approverAvailable: rootAvailable } : {}),
        sourceRefs: ['L21050', 'L23707', 'L44880', 'L55895', 'AC-SA-08-05 L44879'],
      },
      context,
    )
  }

  function returnDecision(request: ApprovalRequestFixture): PermissionDecision {
    return evaluateAccess(
      {
        action: `MOD-SA-08:return:${request.id}`,
        allowedRoles: ['ADMIN'],
        allowedObjectStates: ['pending'],
        objectState: mode === 'open' ? effectiveState(request) : mode,
        makerCheckerOf: request.proposerActor,
        sourceRefs: ['L23707', 'L55918'],
      },
      context,
    )
  }

  function declineDecision(request: ApprovalRequestFixture): PermissionDecision {
    return evaluateAccess(
      {
        action: `MOD-SA-08:decline:${request.id}`,
        allowedRoles: ['ROOT_SUPER_ADMIN'],
        allowedObjectStates: ['pending'],
        objectState: mode === 'open' ? effectiveState(request) : mode,
        sourceRefs: ['L56011'],
      },
      context,
    )
  }

  function decisionCell(request: ApprovalRequestFixture): ReactNode {
    // Spec §3, third rendering: a critical-class action seen by a non-root
    // role replaces the whole action bar, so no control on the row can be
    // mistaken for an approval path (L23707).
    if (request.changeClass === 'critical' && !isRoot) {
      return (
        <div className="space-y-1">
          <ProhibitionNotice rendering={{ kind: 'class-badge' }} />
          {!rootAvailable ? (
            <p className="text-xs text-[var(--color-ink-subtle)]">
              Frozen while the root is unavailable. It stays pending; it does not expire.
            </p>
          ) : null}
        </div>
      )
    }

    if (declined.includes(request.id)) {
      return (
        <p role="note" className="text-xs text-[var(--color-ink-subtle)]">
          Declined: nothing executed, the current state stands (WF-ROLE-020, L56008). The source
          demands a mandatory reason (L56011) and never says what a reason may contain, so no
          reason field is drawn and none was collected — this row records the act without
          claiming compliance it did not obtain. The source also closes the approval-state set
          without a declined member, so no state name is invented for this row — see
          “Unspecified in source”.
        </p>
      )
    }

    const approve = approveDecision(request)
    const decline = declineDecision(request)
    const returnIt = returnDecision(request)
    const selfSuspended = isRoot && request.changeClass === 'critical' && request.proposerActor === actorOfRecord

    return (
      <div className="space-y-2">
        <Button
          {...inertProps(approve, namedReason(approve, mode))}
          onClick={() => setDecided((d) => ({ ...d, [request.id]: 'approved' }))}
        >
          Approve
        </Button>
        {request.changeClass === 'critical' ? (
          <Button
            {...inertProps(decline, namedReason(decline, mode))}
            onClick={() => setDeclined((d) => [...d, request.id])}
          >
            Decline
          </Button>
        ) : (
          <Button
            {...inertProps(returnIt, namedReason(returnIt, mode))}
            onClick={() => setDecided((d) => ({ ...d, [request.id]: 'returned' }))}
          >
            Return with a categorised reason
          </Button>
        )}
        {decided[request.id] === 'approved' ? (
          <p className="text-xs text-[var(--color-ink-subtle)]">
            Approved as request {request.id}, with its audit event committed in the same
            transaction. Application is a separate step and has not happened: nothing here applies
            silently (AC-SA-08-08, L44882).
          </p>
        ) : null}
        {decided[request.id] === 'returned' ? (
          <p className="text-xs text-[var(--color-ink-subtle)]">
            Returned to {request.proposerLabel}. Nothing was applied and the current configuration
            stands; the proposer may resubmit (WF-ROLE-016).
          </p>
        ) : null}
        {approve.outcome === 'allowed' ? null : (
          <p role="note" className="text-xs text-[var(--color-ink-subtle)]">
            {namedReason(approve, mode)}
          </p>
        )}
        {selfSuspended ? (
          <p className="text-xs text-[var(--color-ink-subtle)]">{ROOT_SELF_APPROVAL_NOTE}</p>
        ) : null}
      </div>
    )
  }

  /* ------------------------- Queue standing ---------------------------- */

  const counts: ReadonlyArray<readonly [string, number, StatusTone]> = (
    [
      ['pending engineering-class requests', queueRecords.filter((r) => r.state === 'pending' && r.changeClass === 'engineering').length, 'info'],
      ['pending critical-class requests', queueRecords.filter((r) => r.state === 'pending' && r.changeClass === 'critical').length, 'blocked'],
      ['of them aging', queueRecords.filter((r) => r.aging).length, 'attention'],
      ['approved-not-applied', queueRecords.filter((r) => r.state === 'approved-not-applied').length, 'attention'],
      ['approved-not-executed', queueRecords.filter((r) => r.state === 'approved-not-executed').length, 'attention'],
      ['returned', queueRecords.filter((r) => r.state === 'returned').length, 'neutral'],
      ['applied', queueRecords.filter((r) => r.state === 'applied').length, 'ok'],
    ] as const
    // AC-SA-01-03: a category with nothing in it is not reported as the
    // number nought. It is not reported at all.
  ).filter((entry) => entry[1] > 0)

  /* --------------------- Critical-class initiation --------------------- */

  const initiateDecision = evaluateAccess(
    {
      action: 'MOD-SA-08:initiate-critical-action',
      allowedRoles: ['ADMIN', 'ROOT_SUPER_ADMIN'],
      allowedObjectStates: ['open'],
      objectState: mode,
      sourceRefs: ['L55961', 'AC-SA-000-04 L42882'],
    },
    context,
  )
  const initiateReason =
    initiateDecision.reasonCode === 'ROLE_NOT_GRANTED'
      ? 'Initiating a critical-class action belongs to the Admin and the root (WF-ROLE-018, L55961). This role proposes Band A changes and reads the queue; it does not open a critical request.'
      : namedReason(initiateDecision, mode)
  const criticalTargetName =
    CRITICAL_ACTIONS.find((a) => a.id === criticalTarget)?.name ?? CRITICAL_ACTIONS[0].name

  /* ------------------------------ Export ------------------------------- */

  const matrixCsv = [
    ['Module', ...SA08_PLATFORM_ROLES.map((r) => r.name)].join(','),
    ...SA_MODULES.map((m) =>
      [m.name, ...SA08_PLATFORM_ROLES.map((r) => MATRIX_TOKEN_LABEL[matrixCell(m.id, r.id).outcome])].join(','),
    ),
  ].join('\n')

  return (
    <SaConsoleShell module={MODULE}>
      <p className="text-xs text-[var(--color-ink-subtle)]">
        Screens annotated SCR-SA-12 (Users pane and Roles pane, L42804) and SCR-SA-13 (approval
        queue, L42805), with storyboards SB-RBAC-01 (L20728), SB-RBAC-05 (L21050), SB-SA-08 (L44774)
        and SB-31-10 (L76133). Names are canonical; the numbers are annotations only, and this route
        is keyed on the module slug.
      </p>

      <div className="mt-6 flex flex-wrap gap-6 rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4">
        <Select
          label="Console role (fixture)"
          value={role}
          onChange={(v) => {
            setRole(v as RoleId)
            resetInteraction()
          }}
          options={SA08_PLATFORM_ROLES.map((r) => ({
            value: r.id,
            label: `${r.name} — ${r.roleAnnotation}`,
          }))}
        />
        <Select
          label="Screen state (fixture)"
          value={screenState}
          onChange={(v) => {
            setScreenState(v as ScreenStateId)
            resetInteraction()
          }}
          options={SA_APPLICABLE_STATES.map((s) => ({ value: s.id, label: `${s.id} — ${s.name}` }))}
        />
        <Select
          label="Root availability (fixture)"
          value={rootAvailable ? 'available' : 'unavailable'}
          onChange={(v) => {
            setRootAvailable(v === 'available')
            resetInteraction()
          }}
          options={[
            { value: 'available', label: 'The root is available' },
            { value: 'unavailable', label: 'The root is unavailable — DEC-ROOTSUCC-001' },
          ]}
        />
        <p className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
          The role control is a view switcher, not a login. Nothing here authenticates anybody, and
          no state below is computed — each is a seeded fixture the reader steps through.
        </p>
      </div>

      <div className="mt-4 rounded-[var(--radius-surface)] bg-[var(--color-surface-sunken)] p-4 text-sm">
        <p className="font-medium">
          {stateDefinition.id} — {stateDefinition.name}
        </p>
        <p className="mt-1 text-[var(--color-ink-muted)]">{stateDefinition.contract}</p>
        <p className="mt-1 text-[var(--color-ink-muted)]">{stateDefinition.neverDo}</p>
      </div>

      {mode === 'read-only' ? (
        <div className="mt-4">
          <Banner
            tone="attention"
            heading="Read-only"
            body="This fixture puts the console into a read-only state, and every input the console itself carries — the four queue filters, the critical-action selector and every decision control — is disabled by it. A control this role would not hold anyway still names its own role reason, which is a separate fact about the role rather than a second cause of the read-only state. The three fixture switchers above belong to the harness, not the console, so they keep working. Every panel still reads."
          />
        </div>
      ) : null}

      {mode === 'write-failed' ? (
        <div className="mt-4">
          <Banner
            tone="blocked"
            heading="The approval write failed"
            body="FB-SA-02: the object is unchanged and the request is still visibly pending. Nothing was decided, and nothing is shown as decided."
          />
        </div>
      ) : null}

      {screenState === 'STATE-10' || screenState === 'STATE-11' ? (
        <div className="mt-4">
          <Banner
            tone="info"
            heading={
              screenState === 'STATE-11'
                ? 'Every model is unavailable'
                : 'Models are degraded'
            }
            body="No agent contributes to any decision on this screen. Approval routing, the roles matrix and the Users pane are deterministic, so this module is unchanged and remains fully operable (AC-SA-000-09)."
          />
        </div>
      ) : null}

      {screenState === 'STATE-13' ? (
        <div className="mt-4">
          <Banner
            tone="stale"
            heading="Recovering"
            body={`The queue is being re-read after a failure. ${REREAD_RECORD_COUNT} of the ${APPROVAL_REQUESTS.length} request records have been re-read, and they are the only rows drawn below. ${unrereadRecords
              .map((r) => r.id)
              .join(' and ')} are not drawn at all until they have been re-read, because nothing is presented as recovered until it is. The queue standing counts the same ${REREAD_RECORD_COUNT} records.`}
          />
        </div>
      ) : null}

      <Section id="sa08-invariants" heading="Enforced invariants and the approval that cannot exist">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The six render locked with no off position for any account including the root. They are
          status readouts on this screen, not rows in the queue: a change that would breach one is
          rejected regardless of approver, the root included (L21021).
        </p>
        <div className="mt-3 space-y-3">
          {SA_INVARIANTS.map((i) => (
            <InvariantChip key={i.id} invariant={i} />
          ))}
        </div>
        <div className="mt-3">
          <ProhibitionNotice
            rendering={{
              kind: 'absent',
              note: 'Nothing is drawn here: no approval path exists for any account, including the root, for anything touching the six enforced invariants (AC-SA-INV-003, L47849).',
            }}
          />
        </div>
      </Section>

      <Section id="sa08-users" heading="Users pane">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">{ROOT_ACCOUNT_RULE}</p>

        <div className="mt-3 flex flex-wrap items-start gap-4">
          {role === 'ROOT_SUPER_ADMIN' || role === 'ADMIN' ? (
            <Button
              {...inertProps(
                createDecision,
                createDecision.reasonCode === 'ROLE_NOT_GRANTED'
                  ? 'User creation is root-only (L76133).'
                  : namedReason(createDecision, mode),
              )}
              onClick={() =>
                setUsersPaneNotice(
                  'Recorded as a create-account request in this prototype only. No account was created: this console writes nothing, and the table below is a fixture that does not change. In the product a new account holds no role, and therefore no capability, until the root assigns one — role assignment is a separate act (WF-ROLE-005).',
                )
              }
            >
              Create user
            </Button>
          ) : (
            <ProhibitionNotice
              rendering={{
                kind: 'absent',
                note: 'No account-creation control exists for this role — L44774 makes it absent for everyone but the root, and nothing is drawn where it would sit.',
              }}
            />
          )}
          <Button
            {...inertProps(roleAssignmentDecision, usersPaneReason(roleAssignmentDecision))}
            onClick={() =>
              setUsersPaneNotice(
                'Recorded as a role-assignment act against account CA-04 in this prototype only. Nothing on this screen changed: the matrix below is keyed on module and role with no account dimension, and CA-04 still holds no role. In the product the account is re-evaluated at its next access (WF-ROLE-006).',
              )
            }
          >
            Role assignment
          </Button>
          <Button
            {...inertProps(disableDecision, usersPaneReason(disableDecision))}
            onClick={() =>
              setUsersPaneNotice(
                'Recorded as a disable-account act against CA-03 in this prototype only. No account was disabled and no session was ended — this console ends none — and CA-03 still reads active in the table below. In the product the account is disabled and never deleted: nothing on this platform is purged.',
              )
            }
          >
            Disable account
          </Button>
          <Button
            {...inertProps(lastActivityDecision, usersPaneReason(lastActivityDecision))}
            onClick={() =>
              setUsersPaneNotice(
                `Last-activity review opened over the ${accountRecords.length} accounts listed below — a read, and nothing else was changed. No account is marked dormant, because the source defines no dormancy threshold — see “Unspecified in source”.`,
              )
            }
          >
            Last-activity review
          </Button>
        </div>
        {usersPaneNotice !== '' ? (
          <p role="status" className="mt-3 text-sm text-[var(--color-ink-muted)]">
            {usersPaneNotice}
          </p>
        ) : null}

        <div className="mt-4">
          <Table
            caption="Console accounts, their role and their last activity"
            columns={[
              { key: 'id', header: 'Account' },
              { key: 'roleHeld', header: 'Role held' },
              { key: 'state', header: 'State' },
              { key: 'lastActivity', header: 'Last activity' },
            ]}
            loading={screenState === 'STATE-02'}
            rows={accountRecords.map((a) => ({
              id: a.id,
              roleHeld: a.roleHeld,
              state: <StatusPill tone={a.state === 'disabled' ? 'neutral' : 'ok'} icon="•" label={a.state} />,
              lastActivity: a.lastActivity,
            }))}
            emptyState={{
              title: 'No console account exists yet',
              whatCreatesIt:
                'The root creates console accounts from this pane. Role assignment is a separate act, so a new account holds no capability until the root grants it one (WF-ROLE-005).',
            }}
          />
        </div>
      </Section>

      <Section id="sa08-roles" heading="Roles pane">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The four-role matrix, per module — the reference an auditor reads (L55552). Every cell
          carries an explicit status from the closed set of nine (L10238): a blank cell is an
          unanswered question an implementer would answer privately.
        </p>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          How a cell is filled: all four console roles read every module (D16, L42742), so the
          default is <em>read only</em>. A cell departs from that default only where the source or a
          numbered decision names the departure — this module’s own root-only administration, the
          Trace Viewer’s absence at V1 (D9), the Platform Engineer’s pause control pending
          DEC-PAUSE-001 (D8), and the Platform Engineer’s exclusion from support sessions (D17).
          Nothing else is coloured in.
        </p>

        <div className="mt-3 overflow-x-auto">
          <Table
            caption="Four-role matrix, one row per module"
            columns={[
              { key: 'module', header: 'Module' },
              ...SA08_PLATFORM_ROLES.map((r) => ({ key: r.id, header: r.name })),
            ]}
            rows={SA_MODULES.map((m) => {
              const cells: Record<string, ReactNode> = { module: `${m.name} (${m.id})` }
              for (const r of SA08_PLATFORM_ROLES) {
                const cell = matrixCell(m.id, r.id)
                cells[r.id] = `${MATRIX_TOKEN_LABEL[cell.outcome]} — ${cell.cause}`
              }
              return cells
            })}
            emptyState={{
              title: 'No module is registered',
              whatCreatesIt: 'The module registry populates this matrix.',
            }}
          />
        </div>

        <div className="mt-3">
          <Button onClick={() => setExportShown((v) => !v)}>
            Export as comma-separated values
          </Button>
          <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
            All four console roles export the matrix, stamped with the configuration version it was
            true for (L20728). This prototype writes no file: the export is shown below so a reader
            can see exactly what would leave the console.
          </p>
          {exportShown ? (
            <div className="mt-2">
              <p className="text-xs font-medium">{MATRIX_CONFIGURATION_VERSION}</p>
              <pre className="mt-1 overflow-x-auto rounded-[var(--radius-surface)] bg-[var(--color-surface-sunken)] p-3 text-xs">
                {matrixCsv}
              </pre>
            </div>
          ) : null}
        </div>
      </Section>

      <Section id="sa08-classes" heading="Change classes">
        <Table
          caption="The four change classes and where each is decided"
          columns={[
            { key: 'name', header: 'Class' },
            { key: 'approver', header: 'Approver' },
            { key: 'queue', header: 'Enters the queue' },
            { key: 'note', header: 'What that means' },
            { key: 'source', header: 'Source' },
          ]}
          rows={CHANGE_CLASSES.map((c) => ({
            name: c.name,
            approver: c.approver,
            queue: c.entersQueue ? 'Yes' : 'No',
            note: c.note,
            source: c.sourceRef,
          }))}
          emptyState={{
            title: 'No change class is defined',
            whatCreatesIt: 'The maker-checker spine defines the classes.',
          }}
        />
      </Section>

      <Section id="sa08-standing" heading="Queue standing">
        {aggregate === 'loading' ? (
          <SkeletonBlock lines={3} label="Loading the queue standing" />
        ) : aggregate === 'unavailable' ? (
          <p className="mt-2 text-sm">
            Unavailable — the queue standing could not be read in this state. An unavailable
            aggregate is never rendered as a count, and never left blank.
          </p>
        ) : (
          <>
            {counts.length === 0 ? (
              <p className="mt-2 max-w-prose text-sm">
                Nothing is waiting for a platform-level decision. This aggregate reads the same
                records the queue below reads, so it reports no category rather than a row of
                noughts, and it still carries the time it was true for.
              </p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-2">
                {counts.map(([label, n, tone]) => (
                  <li key={label}>
                    <StatusPill tone={tone} icon="•" label={`${n} ${label}`} />
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-2">
              <FreshnessLabel
                asOfLabel={aggregate === 'stale' ? QUEUE_STALE_AS_OF : QUEUE_AS_OF}
                originLabel={QUEUE_ORIGIN}
              />
            </div>
          </>
        )}
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          Counts of requests waiting for a platform decision, each with the time it was true. A
          category with nothing in it is left out rather than reported as nought (AC-SA-01-03).
        </p>
      </Section>

      <Section id="sa08-root" heading="Root availability and the critical-class freeze">
        {rootAvailable ? (
          <Banner
            tone="info"
            heading="The root is available"
            body="Critical-class requests can be decided. Switch the root-availability control above to see what this console looks like when it cannot."
          />
        ) : (
          <Banner
            tone="blocked"
            heading={ROOT_FREEZE_HEADLINE}
            body="DEC-ROOTSUCC-001 is open: how root custody is recovered is a client decision, and a standby root is refused because exactly one root exists at all times. Until the root returns, every critical-class request stays pending and visible. Nothing expires, and nothing is decided on the root’s behalf."
          />
        )}
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Root loss freezes these seven capabilities at once — the decision’s own impact statement,
          not an inference:
        </p>
        <ul className="mt-2 list-disc pl-5 text-sm text-[var(--color-ink-muted)]">
          {ROOT_FROZEN_CAPABILITIES.map((c) => (
            <li key={c.id}>{c.name}</li>
          ))}
        </ul>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The root approves its own critical requests, because the source assigns no second critical
          approver. That is a single point of concentration this prototype shows rather than
          smooths over: it is why the freeze reaches seven capabilities at once, and it is why this
          queue does not always drain.
        </p>
      </Section>

      <Section id="sa08-queue" heading="Approval queue">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          One queue answers “what is waiting for a platform-level decision”. Composed-agent reviews
          and tier publications sit in it under their own classes, and no parallel decision queue
          exists (AC-SA-08-09, L44883). Every request carries the nine fields below and commits with
          its audit event in the same transaction (AC-SA-08-07, L44881).
        </p>

        <div className="mt-3 flex flex-wrap gap-4">
          <Select
            label="Filter by class"
            value={classFilter}
            onChange={setClassFilter}
            disabled={mode === 'read-only'}
            options={[
              { value: 'any', label: 'Any class' },
              ...CHANGE_CLASSES.filter((c) => c.entersQueue).map((c) => ({
                value: c.id satisfies ChangeClassId,
                label: c.name,
              })),
            ]}
          />
          <Select
            label="Filter by state"
            value={stateFilter}
            onChange={setStateFilter}
            disabled={mode === 'read-only'}
            options={[
              { value: 'any', label: 'Any state' },
              ...APPROVAL_STATES.map((s) => ({ value: s, label: s })),
            ]}
          />
          <Select
            label="Filter by age"
            value={ageFilter}
            onChange={setAgeFilter}
            disabled={mode === 'read-only'}
            options={[
              { value: 'any', label: 'Any age' },
              ...AGE_BANDS.map((b) => ({ value: b satisfies AgeBand, label: b })),
            ]}
          />
          <Select
            label="Filter by proposer"
            value={proposerFilter}
            onChange={setProposerFilter}
            disabled={mode === 'read-only'}
            options={[
              { value: 'any', label: 'Any proposer' },
              ...Array.from(new Set(APPROVAL_REQUESTS.map((r) => r.proposerLabel))).map((p) => ({
                value: p,
                label: p,
              })),
            ]}
          />
        </div>

        {screenState === 'STATE-04' ? (
          <p role="alert" className="mt-3 text-sm text-[var(--color-status-blocked)]">
            A returned request needs a categorised reason before it goes back to its proposer
            (L23707). The rule is stated; the category list is not — the source never enumerates the
            categories, so this screen names the gap rather than offering a guess. See “Unspecified
            in source” below.
          </p>
        ) : null}

        <div className="mt-3 overflow-x-auto">
          <Table
            caption="Requests waiting for a platform-level decision"
            columns={[
              { key: 'request', header: 'Request and timestamps' },
              { key: 'class', header: 'Change class' },
              { key: 'object', header: 'Object reference and diff' },
              { key: 'rationale', header: 'Rationale' },
              { key: 'state', header: 'State' },
              { key: 'proposer', header: 'Proposer' },
              { key: 'approver', header: 'Approver' },
              { key: 'audit', header: 'Audit reference' },
              { key: 'decision', header: 'Decision' },
            ]}
            loading={screenState === 'STATE-02'}
            filtered={
              classFilter !== 'any' ||
              stateFilter !== 'any' ||
              ageFilter !== 'any' ||
              proposerFilter !== 'any'
            }
            rows={rows.map((r) => ({
                request: (
                  <>
                    <span className="block font-medium">{r.id}</span>
                    <span className="block text-xs text-[var(--color-ink-subtle)]">
                      {r.timestamps}
                    </span>
                    <span className="block text-xs text-[var(--color-ink-subtle)]">
                      {r.ageBand}
                    </span>
                  </>
                ),
                class: CHANGE_CLASSES.find((c) => c.id === r.changeClass)?.name ?? r.changeClass,
                object: (
                  <>
                    <span className="block">{r.objectReference}</span>
                    <span className="block text-xs text-[var(--color-ink-subtle)]">{r.diff}</span>
                  </>
                ),
                rationale: r.rationale,
                state: (
                  <>
                    <StatusPill
                      tone={STATE_TONE[effectiveState(r)]}
                      icon="•"
                      label={effectiveState(r)}
                    />
                    {r.aging ? (
                      <span className="mt-1 block">
                        <StatusPill tone="attention" icon="⚠" label="aging — the root is re-notified" />
                      </span>
                    ) : null}
                  </>
                ),
                proposer: r.proposerLabel,
                approver: r.approver,
                audit: r.auditReference,
                decision: decisionCell(r),
            }))}
            emptyState={{
              title: 'Nothing is waiting for a platform-level decision',
              whatCreatesIt:
                'A Platform Engineer submitting a Band A change, or an Admin initiating a critical-class action, puts a request here. Band B routine actions never appear: they auto-apply and are audited.',
            }}
          />
        </div>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          A request that has been approved but whose application or execution did not happen keeps
          its own state — approved-not-applied and approved-not-executed (L55897, L55985) — because
          calling either one “applied” would be the single most misleading word this screen could
          print.
        </p>
      </Section>

      <Section id="sa08-critical" heading="Critical-class routing">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Every critical-class action is blocked until the root approves, and the blocked attempt is
          itself an audit event (AC-SA-000-04, L42882). The class cannot be downgraded.
        </p>

        <Table
          caption="The critical-class actions and where each one routes"
          columns={[
            { key: 'name', header: 'Action' },
            { key: 'approver', header: 'Approver' },
            { key: 'source', header: 'Source' },
          ]}
          rows={CRITICAL_ACTIONS.map((a) => ({
            name: a.name,
            approver: 'Root Super Admin',
            source: a.sourceRef,
          }))}
          emptyState={{
            title: 'No critical-class action is registered',
            whatCreatesIt: 'The critical-action registry populates this table.',
          }}
        />
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          {CRITICAL_ACTION_COUNT_NOTE}
        </p>

        <div className="mt-4 max-w-md">
          <Select
            label="Critical-class action to initiate"
            value={criticalTarget}
            onChange={setCriticalTarget}
            disabled={mode === 'read-only'}
            options={CRITICAL_ACTIONS.map((a) => ({ value: a.id, label: a.name }))}
          />
        </div>
        <div className="mt-3">
          <Button
            {...inertProps(initiateDecision, initiateReason)}
            onClick={() => setCriticalAttempt(true)}
          >
            Submit for root approval
          </Button>
          {initiateDecision.outcome === 'allowed' ? null : (
            <p role="note" className="mt-1 text-xs text-[var(--color-ink-subtle)]">
              {initiateReason}
            </p>
          )}
        </div>
        {criticalAttempt && initiateDecision.outcome === 'allowed' ? (
          <div className="mt-3 rounded-[var(--radius-surface)] border border-[var(--color-border)] p-3 text-sm">
            <p className="font-medium">Blocked until the root approves</p>
            <p className="mt-1 text-[var(--color-ink-muted)]">
              {criticalTargetName} is not done. It is visibly pending as request CR-4475, and a
              critical action is never performed for convenience (WF-ROLE-018).
            </p>
            <p className="mt-1 text-[var(--color-ink-muted)]">
              The blocked attempt is itself an audit event: AUD-SA-88120, committed in the same
              transaction as the refusal.
            </p>
            {!rootAvailable ? (
              <p className="mt-1 text-[var(--color-ink-muted)]">
                And it will stay there: {ROOT_FREEZE_HEADLINE.toLowerCase()}.
              </p>
            ) : null}
          </div>
        ) : null}
      </Section>

      <Section id="sa08-absent" heading="Controls that do not exist here">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Each of these is drawn as a note in the place a control would sit. None is a disabled
          control, because a disabled control implies an enabled state exists somewhere.
        </p>
        <ul className="mt-3 space-y-3">
          {SA08_ABSENT_CONTROLS.map((c) => (
            <li key={c.label}>
              <p className="text-sm font-medium">{c.label}</p>
              <ProhibitionNotice rendering={{ kind: 'absent', note: c.note }} />
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sa08-workflows" heading="Workflows this module renders">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The extraction carries no module identifier on workflow entries, so each was matched to
          this module by name and by line proximity to its own controls and screens. The matching
          method is printed against every row, so a reviewer can check it rather than trust it.
        </p>
        <ul className="mt-3 space-y-3 text-sm">
          {SA08_WORKFLOWS.map((w) => (
            <li key={w.id}>
              <p className="font-medium">
                {w.name} <span className="text-[var(--color-ink-subtle)]">({w.id})</span>
              </p>
              <p className="text-[var(--color-ink-muted)]">Actor: {w.actor}</p>
              <p className="text-[var(--color-ink-muted)]">Ends at: {w.terminalStates.join('; ')}.</p>
              <p className="text-[var(--color-ink-muted)]">Rendered by: {w.rendersAs}</p>
              <p className="text-xs text-[var(--color-ink-subtle)]">Matched by {w.matchedBy}.</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sa08-access" heading="Reaching tenant content from here">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          A request in this queue names tenant-scoped objects — a tier record, a compliance
          suspension, a device. No link on this console resolves to that content. It is reachable
          only by requesting a session under a named access class, and there is no ambient browsing
          anywhere on this surface (AC-SA-000-07, AC-SEC-801).
        </p>
        <ul className="mt-2 list-disc pl-5 text-sm text-[var(--color-ink-muted)]">
          {ACCESS_CLASSES.map((c) => (
            <li key={c.id}>{c.name}</li>
          ))}
        </ul>
        <p className="mt-2">
          <a className="text-[var(--color-primary)] underline" href="/super-admin/support-access/">
            Request a session under a named access class
          </a>
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The implementation authoring role is the one console-owned grant that lives inside a
          tenant workspace: it can author and submit there, never approve or release, and its
          provisioning and revocation appear in both audit streams (AC-SA-08-10, L44884). The source
          names no console control for it, so this screen states the rule and draws none.
        </p>
      </Section>

      <Section id="sa08-unspecified" heading="Unspecified in source">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Each affordance below is one the source does not define. It is named rather than invented:
          a plausible invented control reads back as a requirement.
        </p>
        <ul className="mt-3 space-y-3 text-sm">
          {SA08_UNSPECIFIED_IN_SOURCE.map((u) => (
            <li key={u.affordance}>
              <p className="font-medium">{u.affordance}</p>
              <p className="text-[var(--color-ink-muted)]">{u.note}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sa08-conflicts" heading="Conflicts in the source">
        <ul className="mt-3 space-y-3 text-sm">
          {SA08_SOURCE_CONFLICTS.map((c) => (
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
