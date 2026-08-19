'use client'

import { useState } from 'react'
import { HubShell, type TenantRoleId } from '../HubShell'
import { dohModuleById } from '@/surfaces/doh/modules'
import {
  ACCESS_CONDITIONS,
  PRECEDENCE_RULES,
  type AccessCondition,
  type PrecedenceRule,
} from '@/surfaces/doh/access-conditions'
import { DEFERRED_DOH_SCOPES, type DeferredDohScope } from '@/surfaces/doh/scope'
import {
  TENANT_STATES,
  writeAllowed,
  type TenantState,
} from '@/surfaces/doh/tenant-state'
import {
  SEEDED_SSO_CONNECTION,
  SSO_PROTOTYPE_NOTE,
  resolveSignInTrack,
  type SignInTrack,
  type SsoConnectionRecord,
  type SsoConnectionState,
  type SsoProtocol,
} from '@/surfaces/doh/sso-connection'
import { ScreenStateBoundary } from '@/ui/ScreenStateBoundary'
import { screenState } from '@/ui/screen-state'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import {
  Button,
  Field,
  FreshnessLabel,
  PermissionNotice,
  Select,
  StatusPill,
  Table,
  type StatusTone,
  type TableRow,
} from '@/ui/primitives'
import { evaluateAccess } from '@/policy/evaluate'
import { permitsAction, type PermissionDecision, type PermissionOutcome } from '@/policy/decision'
import { roleById, type RoleId } from '@/domain/roles'
import {
  ABSENT_CONTROLS,
  ACCOUNT_LIFECYCLE_RIVALS,
  APPROVER_CAPABLE_ROLES,
  CONDITION_MAPPINGS,
  CONFIGURATION_EDIT_ACTION,
  DOH09_APPLICABLE_STATES,
  DOH09_INAPPLICABLE_STATES,
  MANDATORY_ROLE_STATEMENTS,
  PERMISSION_MATRIX,
  REFUSAL_SCENARIOS,
  REGISTER_AS_OF,
  REGISTER_ORIGIN,
  REGISTER_STALE_AS_OF,
  ROLE_ASSIGNMENT_STATES,
  ROLE_CARD_BLOCK_NAMES,
  ROLE_CARD_COPY,
  ROSTER_SCENARIOS,
  SIGN_IN_STAGES,
  SOURCE_CONFLICTS,
  TENANT_ROLE_ORDER,
  UNSPECIFIED_IN_SOURCE,
  USER_ACCOUNT_STATES,
  fixtureContext,
  matrixRow,
  refusalScenario,
  renderingFor,
  standingCounters,
  type ConditionMapping,
  type Doh09StateId,
  type MatrixRow,
  type MatrixRowId,
  type RoleCardBlockName,
  type RosterScenario,
  type RosterScenarioId,
  type TenantUserFixture,
  type UserAccountState,
} from './fixtures'

/**
 * MOD-DOH-09 — Permissions, Roles and Access, pass one (Tenant scope only).
 *
 * The module that decides who exists in the tenant, what each may do, and
 * where. It owns `OBJ-DOH-USER` and is the only module anywhere that creates
 * a tenant user account; every other module that shows a person shows one
 * this screen made.
 *
 * Three screens are annotated on this one route, because the source splits
 * them and D1 forbids keying a route on a screen number: the sign-in address
 * screen, the users-roles-and-scopes register, and the role-explanation
 * family (the landing with its two views, the refusal explanation, and the
 * role definition card).
 *
 * TWO RULES BIND THIS FILE HARDER THAN ANY OTHER IN THE SLICE, and both are
 * this module's own matrix rows:
 *
 * - `AC-16-12` (L20225) — no surface renders a role selector, a session-level
 *   role context, or a banner claiming one. The view control above is the
 *   shell's, it is labelled as a view, and it changes only which seeded
 *   fixtures render. Nothing here is a session role context.
 * - Deny by default (L14476, `AC-DOH-09-9`) — an undefined permission is a
 *   refusal, and a rule that cannot be evaluated is treated as violated.
 *   Failing open is the worst defect this module could ship.
 *
 * The nine access conditions are rendered from the spine's own array, in the
 * spine's own order, with role permission first and safety controls ninth.
 * Safety wins by PRECEDENCE, not by position (L14512). This screen never
 * re-sorts that list: a reviewer reads it here as if the source said so.
 */
const MODULE = dohModuleById('MOD-DOH-09')

/* ------------------------------------------------------------------ *
 * Labels. The token stays the data; these are the interface words.
 * ------------------------------------------------------------------ */

const OUTCOME_LABEL: Readonly<Record<PermissionOutcome, string>> = {
  allowed: 'Allowed',
  allowedWithConditions: 'Allowed with conditions',
  readOnly: 'Read-only',
  cachedReadOnlyOffline: 'Read-only, from a stored copy',
  queuedOffline: 'Queued',
  explicitlyProhibited: 'Explicitly prohibited',
  unavailable: 'Unavailable',
  notApplicable: 'Not applicable',
  clientDecisionRequired: 'Client Decision Required',
}

const OUTCOME_TONE: Readonly<Record<PermissionOutcome, StatusTone>> = {
  allowed: 'ok',
  allowedWithConditions: 'info',
  readOnly: 'stale',
  cachedReadOnlyOffline: 'stale',
  queuedOffline: 'info',
  explicitlyProhibited: 'blocked',
  unavailable: 'neutral',
  notApplicable: 'neutral',
  clientDecisionRequired: 'attention',
}

const RENDERING_LABEL = {
  control: 'a live control',
  'disabled-with-reason': 'a disabled control carrying its reason',
  'read-only': 'a read-only treatment with its cause named',
  absent: 'nothing drawn, and the rule stated where it would sit',
} as const

const ACCOUNT_STATE_LABEL: Readonly<Record<UserAccountState, string>> = {
  active: 'Active',
  suspended_by_tenant_state: 'Suspended by tenant state',
  archived: 'Archived',
}

const TRACK_LABEL: Readonly<Record<SignInTrack, string>> = {
  sso: 'Single sign-on',
  managed: 'Platform-managed credential',
}

const PROTOCOL_LABEL: Readonly<Record<SsoProtocol, string>> = {
  saml: 'SAML',
  'openid-connect': 'OpenID Connect',
}

const DEFERRED_SCOPE_LABEL: Readonly<Record<DeferredDohScope, string>> = {
  cell: 'Cell',
  job: 'Job',
  worker: 'worker',
}

const CONNECTION_STATE_LABEL: Readonly<Record<SsoConnectionState, string>> = {
  configured: 'Configured',
  not_configured: 'Not configured',
  reserved_inert: 'Reserved, and inert',
}

/** Never a bare token in the interface — the token stays the data. */
const TENANT_STATE_LABEL: Readonly<Record<TenantState, string>> = {
  active: 'Active',
  'soft-suspended': 'Suspended — billing (soft)',
  'hard-suspended': 'Suspended — read-only (hard)',
  'compliance-suspended': 'Suspended — compliance',
  archived: 'Closed — archived',
}

/**
 * The two rules that sit ABOVE the nine-condition intersection (L14512),
 * rendered from the spine's own array. Titles only — the spine holds the
 * order and the tokens, and this map holds the words a reader sees.
 */
const PRECEDENCE_COPY: Readonly<Record<PrecedenceRule, { title: string; detail: string }>> = {
  'explicit-deny-wins': {
    title: 'Explicit deny wins',
    detail:
      'Where any condition produces an explicit deny, the request is refused regardless of how many conditions allowed. It matters most for a multi-role identity, whose permissions are otherwise additive.',
  },
  'safety-controls-win': {
    title: 'Safety controls win',
    detail:
      'Where a safety control conflicts with any other condition — including a root-level allow — the safety control decides. That is why the most privileged role in the tenant still cannot remove the last Tenant Admin.',
  },
}

/** Written as words so no rendered number can be mistaken for a live count. */
const ORDINALS = [
  'First',
  'Second',
  'Third',
  'Fourth',
  'Fifth',
  'Sixth',
  'Seventh',
  'Eighth',
  'Ninth',
] as const

/* ------------------------------------------------------------------ *
 * Connection loss (D7). Nothing on this surface ever queues a write.
 * ------------------------------------------------------------------ */

const CONNECTION_LOSS_STATES: ReadonlySet<Doh09StateId> = new Set([
  'STATE-08',
  'STATE-12',
  'STATE-13',
])

const NEVER_QUEUED_REASON =
  'The connection to the tenant record is not confirmed, so this write control is disabled and never queued — a queued clearance would be a safety control with no audit entry (D7, L27568). Tenant state is re-read before any write control is offered again.'

const TENANT_GATE_REASON =
  'Blocked by the tenant state gate, which is read before this control renders rather than after it is pressed. Creating an account, assigning a role or scope, resetting a credential and editing the connection are all a configuration edit, and the write-class table closes every configuration edit while the tenant is suspended or closed (L26919, L28522).'

const READ_ONLY_REASON =
  'Read-only — the whole module is in its read-only state, and the cause is named once rather than scattered across each control (L48013).'

const REGISTER_EMPTY = {
  title: 'No user account is on the register.',
  whatCreatesIt:
    'A Tenant Admin creates one here. This is the only control anywhere that creates a tenant user account.',
}

const NO_ACTION_YET =
  'No control has been used in this view yet. Every write on this screen reports what it did and, just as plainly, what it did not do.'

const ACCEPTED_ADDRESS_FORM =
  'That address cannot be read. The accepted form is name@domain.example — exactly one @ sign, something either side of it, and at least one dot in the domain. Nothing was submitted anywhere.'

/* ------------------------------------------------------------------ *
 * Small lookups over the fixtures, each failing loudly rather than
 * silently rendering a hole.
 * ------------------------------------------------------------------ */

function rosterScenario(id: RosterScenarioId): RosterScenario {
  const found = ROSTER_SCENARIOS.find((s) => s.id === id)
  if (!found) throw new Error(`Unknown MOD-DOH-09 roster scenario: ${id}`)
  return found
}

function conditionMapping(condition: AccessCondition): ConditionMapping {
  const found = CONDITION_MAPPINGS.find((m) => m.condition === condition)
  if (!found) throw new Error(`No MOD-DOH-09 mapping for access condition: ${condition}`)
  return found
}

/** The roles a matrix row lets write. Read out of the matrix, never retyped. */
function writersOf(row: MatrixRow): readonly RoleId[] {
  return TENANT_ROLE_ORDER.filter((r) => {
    const outcome = row.cells[r].outcome
    return outcome === 'allowed' || outcome === 'allowedWithConditions'
  })
}

/**
 * Per-control, through the ONE evaluator. The matrix says what the source
 * says; the evaluator says what this identity gets, and the screen renders
 * the two together rather than trusting either alone.
 */
function controlDecision(row: MatrixRow, role: TenantRoleId): PermissionDecision {
  return evaluateAccess(
    {
      action: `MOD-DOH-09:${row.id}`,
      allowedRoles: writersOf(row),
      sourceRefs: [row.sourceRef],
    },
    fixtureContext(role),
  )
}

export interface PermissionsScreenProps {
  /** Which seeded persona this view opens on. The screen owns it from here. */
  readonly role?: TenantRoleId
  readonly tenantState?: TenantState
  readonly screenState?: Doh09StateId
  readonly roster?: RosterScenarioId
  readonly refusalScenarioId?: string
  /** Whether the audit write in the same transaction succeeds or fails. */
  readonly auditPath?: 'commits' | 'write-fails'
}

export function PermissionsScreen({
  role: initialRole,
  tenantState: initialTenantState,
  screenState: initialScreenState,
  roster: initialRoster,
  refusalScenarioId: initialRefusal,
  auditPath: initialAuditPath,
}: PermissionsScreenProps = {}) {
  /* STATE OWNERSHIP (task-2 decision): the screen owns `role` and
     `tenantState`; the shell renders its switcher as a controlled component
     from them. The props above seed the first render so a test — or a
     reviewer following a link — can open any combination directly. */
  const [role, setRole] = useState<TenantRoleId>(initialRole ?? 'TENANT_ADMIN')
  const [tenantState, setTenantState] = useState<TenantState>(initialTenantState ?? 'active')
  const [stateId, setStateId] = useState<Doh09StateId>(initialScreenState ?? 'STATE-03')
  const [rosterId, setRosterId] = useState<RosterScenarioId>(initialRoster ?? 'seeded')
  const [refusalId, setRefusalId] = useState<string>(initialRefusal ?? 'role-permission')
  const [auditPath, setAuditPath] = useState<'commits' | 'write-fails'>(
    initialAuditPath ?? 'commits',
  )

  const seededRoster = rosterScenario(rosterId)
  const [users, setUsers] = useState<readonly TenantUserFixture[]>(seededRoster.users)
  const [selectedUserId, setSelectedUserId] = useState<string>(seededRoster.users[0]?.id ?? '')
  const [roleToAssign, setRoleToAssign] = useState<TenantRoleId>('SUPERVISOR')
  const [registerMessage, setRegisterMessage] = useState<string>(NO_ACTION_YET)

  const [connection, setConnection] = useState<SsoConnectionRecord>(SEEDED_SSO_CONNECTION)
  const [address, setAddress] = useState('')
  const [resolvedTrack, setResolvedTrack] = useState<SignInTrack | 'unreadable' | null>(null)
  const [connectionNote, setConnectionNote] = useState<string | null>(null)

  const [cardExportNote, setCardExportNote] = useState<string | null>(null)

  const roleName = roleById(role).name
  const counters = standingCounters(users, seededRoster.jobExists)
  const scenario = refusalScenario(refusalId)
  const connectionLost = CONNECTION_LOSS_STATES.has(stateId)
  const tenantGateOpen = writeAllowed(tenantState, CONFIGURATION_EDIT_ACTION)

  /**
   * The one place a write control asks whether it may act, in the order the
   * contract gates it: the role's own prohibition rendering first, then the
   * tenant state gate (S2, one data table), then connection loss (D7), then
   * the evaluator's own answer for this identity. `null` means the control
   * is live and its handler changes something observable.
   */
  function writeBlockReason(row: MatrixRow): string | null {
    if (renderingFor(row, role) === 'disabled-with-reason') return row.cells[role].cause
    if (!tenantGateOpen) return TENANT_GATE_REASON
    if (connectionLost) return NEVER_QUEUED_REASON
    if (stateId === 'STATE-06') return READ_ONLY_REASON
    const decision = controlDecision(row, role)
    if (!permitsAction(decision)) {
      return decision.conditionToEnable === null
        ? decision.explanation
        : `${decision.explanation} ${decision.conditionToEnable}`
    }
    return null
  }

  /**
   * A write control, gated. Written as a function returning an element rather
   * than as a nested component, so React does not remount a fresh `Button`
   * (and a fresh generated id for its reason) on every keystroke elsewhere on
   * the screen. The disabled arm cannot be constructed without a reason —
   * `Button`'s own contract makes that a type error, not a review note.
   */
  function gatedButton(rowId: MatrixRowId, label: string, onAct: () => void) {
    const reason = writeBlockReason(matrixRow(rowId))
    return reason === null ? (
      <Button variant="secondary" onClick={onAct}>
        {label}
      </Button>
    ) : (
      <Button variant="secondary" disabledReason={reason}>
        {label}
      </Button>
    )
  }

  function selectedUser(): TenantUserFixture | undefined {
    return users.find((u) => u.id === selectedUserId)
  }

  function switchRoster(next: RosterScenarioId) {
    const scenarioNext = rosterScenario(next)
    setRosterId(next)
    setUsers(scenarioNext.users)
    setSelectedUserId(scenarioNext.users[0]?.id ?? '')
    setRegisterMessage(NO_ACTION_YET)
  }

  /* -------------------------------------------------------------- *
   * Handlers. Every one of them says what it did NOT do.
   * -------------------------------------------------------------- */

  function createAccount() {
    if (auditPath === 'write-fails') {
      setRegisterMessage(
        'The audit write failed, so the action did not happen. No account was created, the register is unchanged, and nothing is left half-applied — audit commits in the same transaction as the action, so a failed audit fails the action with it.',
      )
      return
    }
    setRegisterMessage(
      'Recorded in this storyboard: an intent to create a user account, attributed to the identity in view, with its audit entry in the same transaction. No account was created — the source names the workflow and never the fields of its form, so no form is drawn here and nothing was invented to fill one.',
    )
  }

  function assignRole() {
    const target = selectedUser()
    if (target === undefined) return
    if (target.roles.includes(roleToAssign)) {
      setRegisterMessage(
        `${target.displayName} already holds the ${roleById(roleToAssign).name} role. Roles are additive and an assignment is recorded once; nothing was written a second time.`,
      )
      return
    }
    setUsers(
      users.map((u) =>
        u.id === target.id ? { ...u, roles: [...u.roles, roleToAssign] } : u,
      ),
    )
    setRegisterMessage(
      `Assigned the ${roleById(roleToAssign).name} role to ${target.displayName}, at tenant scope, with its audit entry in the same transaction. Permissions are additive and take effect on the web surfaces at once; a device would see them at its next sync.`,
    )
  }

  function removeRole() {
    const target = selectedUser()
    if (target === undefined) return
    if (!target.roles.includes(roleToAssign)) {
      setRegisterMessage(
        `${target.displayName} does not hold the ${roleById(roleToAssign).name} role, so there is nothing to remove and nothing was written.`,
      )
      return
    }
    const after = users.map((u) =>
      u.id === target.id ? { ...u, roles: u.roles.filter((r) => r !== roleToAssign) } : u,
    )
    const wouldBe = standingCounters(after, seededRoster.jobExists)
    if (wouldBe.tenantAdmins === 0) {
      setRegisterMessage(
        `Refused, and the rule is named rather than hinted at: ${MANDATORY_ROLE_STATEMENTS.tenantAdmin} No override exists on any surface, including within support sessions (AC-16-39, L20658). Nothing was written.`,
      )
      return
    }
    if (wouldBe.approverCapable === 0 && seededRoster.jobExists) {
      setRegisterMessage(
        `Refused, and the rule is named rather than hinted at: ${MANDATORY_ROLE_STATEMENTS.approver} Assign the role to a second person first. Nothing was written.`,
      )
      return
    }
    setUsers(after)
    setRegisterMessage(
      `Removed the ${roleById(roleToAssign).name} role from ${target.displayName}, with its audit entry in the same transaction. Both mandatory-role rules were checked at the moment of removal, which is the only moment either can be violated.`,
    )
  }

  function issuePin() {
    const target = selectedUser()
    if (target === undefined) return
    if (role === 'SUPERVISOR' && !target.roles.includes('WORKER')) {
      setRegisterMessage(
        `Refused by the condition stated on this row: a Supervisor may issue or reset a managed personal identification number within own scope and for workers only (L28531). ${target.displayName} holds no Worker role, so nothing was written.`,
      )
      return
    }
    setUsers(users.map((u) => (u.id === target.id ? { ...u, managedPinIssued: true } : u)))
    setRegisterMessage(
      `Recorded a managed personal identification number issued for ${target.displayName}, with its audit entry in the same transaction. No number is shown, no length is implied and no delivery channel is claimed: the source names the control and never the value, so this screen records the act and stops there.`,
    )
  }

  function toggleConnection() {
    const nextState = connection.state === 'configured' ? 'not_configured' : 'configured'
    setConnection({ ...connection, state: nextState })
    setResolvedTrack(null)
    setConnectionNote(
      nextState === 'configured'
        ? 'Connection record set to configured in this storyboard. The seeded email domain resolves onto the federated branch again. Nothing was reconfigured anywhere, because there is nothing on the other end of this record.'
        : 'Connection record set to not configured in this storyboard. Every address now resolves onto the platform-held credential path, which is the branch this control exists to show. Nothing was reconfigured anywhere.',
    )
  }

  function submitAddress() {
    const track = resolveSignInTrack(address, connection)
    setResolvedTrack(track ?? 'unreadable')
  }

  /* -------------------------------------------------------------- *
   * The screen-state treatment, rendered once at the top. The body
   * below always renders: the states this module reaches are about
   * what a reader may TRUST and what a control may DO, and hiding the
   * body would hide the very controls whose disabled reasons carry
   * the answer.
   * -------------------------------------------------------------- */
  const stateTreatment = (
    <ScreenStateBoundary
      state={stateId}
      surface="SURF-DOH"
      detail={{
        objectLabel: 'user accounts',
        whatCreatesIt: REGISTER_EMPTY.whatCreatesIt,
        fieldLabel: 'Work email address',
        rule: 'An address that cannot be read as one is refused rather than guessed at.',
        permittedFormat: 'The accepted form is name@domain.example.',
        decision: controlDecision(matrixRow('create-or-edit-user-account'), role),
        readOnlyCause: `Read-only for the ${roleName} view: the register is readable and no write row on it is held. The cause is named here once, and never shown as the bare words.`,
        asOfLabel: REGISTER_STALE_AS_OF,
        originLabel: REGISTER_ORIGIN,
        failureWhat: 'The read of the user and role register failed.',
        wasWritten: false,
        nextStep:
          'No write was attempted and none was queued. Reconnect, and tenant state is re-read before any write control is offered again.',
        recoveryProgress:
          'Tenant state is being re-read before any write control is re-enabled, so nothing is offered on the strength of a stale gate (D7).',
      }}
    />
  )

  const scenarioDecision = evaluateAccess(scenario.request, fixtureContext(role, scenario))
  const scenarioRefused = !permitsAction(scenarioDecision)
  const scenarioOrder = ACCESS_CONDITIONS.indexOf(scenario.condition)

  const conditionRows: TableRow[] = ACCESS_CONDITIONS.map((condition, index) => {
    const mapping = conditionMapping(condition)
    return {
      order: ORDINALS[index] ?? '',
      condition: mapping.name,
      carriedBy: mapping.carriedBy,
      // L14267: a refusal names who can change the condition that refused.
      // The column header is deliberately worded apart from that sentence
      // below, so a reader meets the answer once, not twice.
      changedBy: mapping.whoCanChangeIt,
      request:
        scenarioRefused && condition === scenario.condition
          ? 'Refused here'
          : '—',
    }
  })

  const matrixRows: TableRow[] = PERMISSION_MATRIX.map((row) => {
    const cells: TableRow = { control: row.label }
    for (const r of TENANT_ROLE_ORDER) {
      cells[r] = (
        <StatusPill
          tone={OUTCOME_TONE[row.cells[r].outcome]}
          icon="●"
          label={OUTCOME_LABEL[row.cells[r].outcome]}
        />
      )
    }
    return cells
  })

  const registerRows: TableRow[] = users.map((u) => ({
    person: u.displayName,
    roles: u.roles.map((r) => roleById(r).name).join(', '),
    scope: 'Tenant',
    account: ACCOUNT_STATE_LABEL[u.accountState],
    track: TRACK_LABEL[u.loginTrack],
    credential: u.managedPinIssued ? 'Issued' : 'None issued',
  }))

  const heldRows = PERMISSION_MATRIX.filter((r) => {
    const rendering = renderingFor(r, role)
    return rendering === 'control' || rendering === 'read-only'
  })
  const refusedRows = PERMISSION_MATRIX.filter(
    (r) => renderingFor(r, role) === 'disabled-with-reason',
  )
  const absentRows = PERMISSION_MATRIX.filter((r) => renderingFor(r, role) === 'absent')

  function cardBody(block: RoleCardBlockName): string {
    const copy = ROLE_CARD_COPY[role]
    switch (block) {
      case 'Identity':
        return `${roleName} — one of the five fixed tenant role types. There is no sixth, and no surface creates one.`
      case 'Reach':
        return 'The tenant, and nothing outside it. Site and Area arrive with the second pass of this module; Cell, Job and worker scoping are deferred beyond the first version and no rule may depend on them.'
      case 'Visibility':
        return copy.visibility
      case 'Rights':
        return copy.rights
      case 'Prohibition':
        return copy.prohibition
      case 'Governance':
        return 'The five role types are platform-defined and fixed. No create-role, edit-role or clone-role control exists on any surface (L17662), and temporary delegation is deferred beyond the first version.'
      case 'Traceability':
        return 'Every action is attributed to the identity that performed it, and no audit entry carries a role-substitution field (L17546). Multi-role identities are additive and still resolve to one named person.'
      default: {
        const exhaustive: never = block
        throw new Error(`Unhandled role-definition-card block: ${String(exhaustive)}`)
      }
    }
  }

  const exportBlocked =
    role === 'READONLY_AUDITOR'
      ? 'Refused with the open decision named rather than guessed at: DEC-AUDEXPORT-001 (L14355) leaves the contents of a role definition card export open, and a separate restatement renders the Auditor export as Client Decision Required in every cell (L16893). Inventing a file here would answer a question the client has not answered.'
      : null

  return (
    <HubShell
      module={MODULE}
      role={role}
      onRoleChange={setRole}
      tenantState={tenantState}
    >
      <div className="space-y-8">
        {/* ---------------------------------------------------------- *
            Reviewer chrome. Separated from the product, like the
            shell's own switcher, and it performs no product action.
         * ---------------------------------------------------------- */}
        <section
          aria-label="Storyboard scenario controls"
          className="rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
            Reviewer controls — not part of the product
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-6">
            <Select
              label="Tenant state"
              value={tenantState}
              options={TENANT_STATES.map((s) => ({ value: s, label: TENANT_STATE_LABEL[s] }))}
              onChange={(value) => {
                const next = TENANT_STATES.find((s) => s === value)
                if (next !== undefined) setTenantState(next)
              }}
            />
            <Select
              label="Screen state"
              value={stateId}
              options={DOH09_APPLICABLE_STATES.map((s) => ({
                value: s,
                label: `${s} ${screenState(s).name}`,
              }))}
              onChange={(value) => {
                const next = DOH09_APPLICABLE_STATES.find((s) => s === value)
                if (next !== undefined) setStateId(next)
              }}
            />
            <Select
              label="Seeded roster"
              value={rosterId}
              options={ROSTER_SCENARIOS.map((s) => ({ value: s.id, label: s.label }))}
              onChange={(value) => {
                const next = ROSTER_SCENARIOS.find((s) => s.id === value)
                if (next !== undefined) switchRoster(next.id)
              }}
            />
            <Select
              label="Refusal to explain"
              value={refusalId}
              options={REFUSAL_SCENARIOS.map((s) => ({ value: s.id, label: s.label }))}
              onChange={setRefusalId}
            />
            <Select
              label="Audit write"
              value={auditPath}
              options={[
                { value: 'commits', label: 'Commits with the action' },
                { value: 'write-fails', label: 'Fails, so the action fails with it' },
              ]}
              onChange={(value) => setAuditPath(value === 'write-fails' ? 'write-fails' : 'commits')}
            />
          </div>
          <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
            {seededRoster.note}
          </p>
        </section>

        {stateTreatment}

        {/* ---------------------------------------------------------- *
            SCR-DOH-01 — the two-track sign-in.
         * ---------------------------------------------------------- */}
        <section aria-label="Two-track sign-in" className="space-y-3">
          <h2 className="text-lg font-semibold">Two-track sign-in — SCR-DOH-01</h2>
          <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
            The boot order is a visible resolution sequence, not an invisible branch. Nothing
            renders first and asks permission afterwards.
          </p>

          <ol className="space-y-3">
            {SIGN_IN_STAGES.map((stage) => (
              <li
                key={stage.id}
                className="rounded-[var(--radius-surface)] border border-[var(--color-border)] p-3"
              >
                <p className="font-medium text-[var(--color-ink)]">{stage.name}</p>
                <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
                  {stage.detail}
                </p>
              </li>
            ))}
          </ol>

          <div className="rounded-[var(--radius-surface)] border border-[var(--color-border)] p-3">
            <p className="font-medium text-[var(--color-ink)]">
              {connection.providerLabel}
            </p>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              Connection state: {CONNECTION_STATE_LABEL[connection.state]}. Protocol:{' '}
              {connection.protocol === null ? 'none chosen' : PROTOCOL_LABEL[connection.protocol]}.
              Domains resolved onto it: {connection.emailDomains.join(', ')}.
            </p>
            <FreshnessLabel
              asOfLabel={connection.configuredAsOfLabel}
              originLabel={connection.originLabel}
            />
            <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
              {SSO_PROTOTYPE_NOTE}
            </p>
            <div className="mt-3">
              {gatedButton('configure-single-sign-on', 'Configure single sign-on', toggleConnection)}
            </div>
            {connectionNote === null ? null : (
              <p className="mt-2 max-w-prose text-sm text-[var(--color-ink)]">{connectionNote}</p>
            )}
          </div>

          <div className="rounded-[var(--radius-surface)] border border-[var(--color-border)] p-3">
            <Field
              label="Work email address"
              description="The address screen resolves the domain against the connection record. It verifies nothing and reaches nowhere."
              {...(resolvedTrack === 'unreadable' ? { error: ACCEPTED_ADDRESS_FORM } : {})}
            >
              <input
                type="email"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-2 text-sm text-[var(--color-ink)]"
              />
            </Field>
            <div className="mt-3">
              <Button onClick={submitAddress}>Continue</Button>
            </div>
            {resolvedTrack === 'sso' ? (
              <p className="mt-3 max-w-prose text-sm text-[var(--color-ink)]">
                This address resolves onto the single sign-on track. In production the platform
                would hand off to the tenant directory; here the branch is the whole of it.
              </p>
            ) : null}
            {resolvedTrack === 'managed' ? (
              <p className="mt-3 max-w-prose text-sm text-[var(--color-ink)]">
                This address resolves onto the platform-managed credential track, the secondary
                path for staff whose organisation has no directory to federate with. It fails
                toward the platform-held credential, never toward the federated one.
              </p>
            ) : null}
          </div>

          <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
            Authentication is not authorization. A group or role claim carried in an assertion is
            untrusted input: it is logged and ignored, and it grants nothing (AC-RBAC-203, L20993).
            Role assignment happens on the register below, and nowhere else.
          </p>
          <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
            There is also no just-in-time provisioning at the first version. An asserted subject
            with no existing user record is refused sign-in, and no account is created to receive
            it. DEC-SSO-001 (L95907) is the open client decision that governs this.
          </p>
          <p className="max-w-prose text-sm text-[var(--color-ink-subtle)]">
            Who may reach the address screen is unstated in the source. The shape is rendered; the
            roles are not assigned. See the panel naming what the source leaves undefined.
          </p>
        </section>

        {/* ---------------------------------------------------------- *
            SCR-DOH-ROLE-01 — the landing, in its two views.
         * ---------------------------------------------------------- */}
        <section aria-label="By person — what this view holds" className="space-y-3">
          <h2 className="text-lg font-semibold">
            By person — what the {roleName} view holds here (SCR-DOH-ROLE-01)
          </h2>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
              Held
            </h3>
            <ul className="mt-2 space-y-2">
              {heldRows.map((row) => (
                <li key={row.id} className="max-w-prose text-sm">
                  <span className="font-medium text-[var(--color-ink)]">{row.label}</span>
                  <span className="text-[var(--color-ink-muted)]">
                    {' '}
                    — {row.cells[role].cause} Drawn as {RENDERING_LABEL[renderingFor(row, role)]}.
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
              Refused, and the control still shown so the rule is taught where it binds
            </h3>
            <ul className="mt-2 space-y-2">
              {refusedRows.map((row) => (
                <li key={row.id} className="max-w-prose text-sm">
                  <span className="font-medium text-[var(--color-ink)]">{row.label}</span>
                  <span className="text-[var(--color-ink-muted)]">
                    {' '}
                    — {row.cells[role].cause} Drawn as {RENDERING_LABEL[renderingFor(row, role)]}.
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
              Drawn nowhere at all
            </h3>
            <ul className="mt-2 space-y-2">
              {absentRows.map((row) => (
                <li key={row.id} className="max-w-prose text-sm">
                  <span className="font-medium text-[var(--color-ink)]">{row.label}</span>
                  <span className="text-[var(--color-ink-muted)]">
                    {' '}
                    — rendered as {RENDERING_LABEL.absent}.
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-label="By capability — the twelve-row control matrix" className="space-y-3">
          <h2 className="text-lg font-semibold">
            By capability — every control against all five roles (SCR-DOH-ROLE-01)
          </h2>
          <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
            Unavailable and Explicitly prohibited are different statuses and are never merged: the
            first means the role cannot hold the capability in any scope, the second means a rule
            forbids it. Every cell carries one token from the closed set and a stated cause; a
            blank cell would be a build-blocking defect.
          </p>
          <div className="overflow-x-auto">
            <Table
              caption="The control matrix for this module, as the source states it"
              columns={[
                { key: 'control', header: 'Control' },
                ...TENANT_ROLE_ORDER.map((r) => ({ key: r, header: roleById(r).name })),
              ]}
              rows={matrixRows}
              emptyState={{
                title: 'The matrix is empty.',
                whatCreatesIt: 'The source enumerates it; an empty matrix would be a defect.',
              }}
            />
          </div>
        </section>

        {/* ---------------------------------------------------------- *
            SCR-DOH-18 — users, roles and scopes.
         * ---------------------------------------------------------- */}
        <section aria-label="Users, roles and scopes" className="space-y-3">
          <h2 className="text-lg font-semibold">Users, roles and scopes — SCR-DOH-18</h2>
          <FreshnessLabel
            asOfLabel={connectionLost ? REGISTER_STALE_AS_OF : REGISTER_AS_OF}
            originLabel={REGISTER_ORIGIN}
          />
          <div className="overflow-x-auto">
            <Table
              caption={`The user and role register, as the ${roleName} view sees it`}
              columns={[
                { key: 'person', header: 'Person' },
                { key: 'roles', header: 'Roles held' },
                { key: 'scope', header: 'Scope' },
                { key: 'account', header: 'Account state' },
                { key: 'track', header: 'Sign-in track' },
                { key: 'credential', header: 'Managed credential' },
              ]}
              rows={registerRows}
              emptyState={REGISTER_EMPTY}
              // STATE-12: a read that failed outright renders its failure,
              // never the rows it failed to fetch. Stale rows under a failure
              // banner would be the surface claiming to know something it
              // does not (D7).
              {...(stateId === 'STATE-12'
                ? {
                    error:
                      'The read of the user and role register failed. Nothing was written, and no write was attempted.',
                  }
                : {})}
            />
          </div>

          <div className="flex flex-wrap items-end gap-6">
            <Select
              label="User to change"
              value={selectedUserId}
              options={users.map((u) => ({ value: u.id, label: u.displayName }))}
              onChange={setSelectedUserId}
            />
            <Select
              label="Role to assign"
              value={roleToAssign}
              options={TENANT_ROLE_ORDER.map((r) => ({ value: r, label: roleById(r).name }))}
              onChange={(value) => {
                const next = TENANT_ROLE_ORDER.find((r) => r === value)
                if (next !== undefined) setRoleToAssign(next)
              }}
            />
            {/* One option, because pass one has one dimension. The handler is
                a no-op because a native select with a single option cannot
                change: this is not a dead control so much as a dimension with
                nothing yet to choose between, and Site and Area are added to
                it — not un-greyed — by the module's second pass. */}
            <Select
              label="Scope to assign"
              value="tenant"
              options={[{ value: 'tenant', label: 'Tenant — the whole workspace' }]}
              onChange={() => undefined}
            />
          </div>

          <p className="max-w-prose text-sm text-[var(--color-ink-subtle)]">
            The five role types are fixed and platform-defined. Custom roles are deferred beyond
            the first version and carry this static footnote rather than a disabled button, because
            a disabled button would imply a roadmap promise the source has not made (L23918).
          </p>
          <p className="max-w-prose text-sm text-[var(--color-ink-subtle)]">
            Scope in this pass: {role === 'TENANT_ADMIN'
              ? 'scope assignment is yours, and the tenant dimension is the only one this pass offers.'
              : matrixRow('assign-or-remove-scope').cells[role].cause}
          </p>

          <div className="flex flex-wrap gap-3">
            {gatedButton('create-or-edit-user-account', 'Create a user account', createAccount)}
            {gatedButton('assign-or-remove-role', 'Assign the role', assignRole)}
            {gatedButton('assign-or-remove-role', 'Remove the role', removeRole)}
            {gatedButton(
              'issue-or-reset-managed-pin',
              'Issue or reset a managed personal identification number',
              issuePin,
            )}
          </div>

          {/* `role="status"` IS a live region on its own; wrapping it in the
              LiveRegion primitive would announce the same sentence twice. */}
          <p
            role="status"
            aria-atomic="true"
            className="max-w-prose rounded-[var(--radius-surface)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-3 text-sm text-[var(--color-ink)]"
          >
            {registerMessage}
          </p>
        </section>

        {/* ---------------------------------------------------------- *
            The standing mandatory-role panel (L23918).
         * ---------------------------------------------------------- */}
        <section aria-label="Mandatory-role guard" className="space-y-3">
          <h2 className="text-lg font-semibold">Mandatory-role guard</h2>
          <div className="flex flex-wrap gap-6">
            <p className="font-medium text-[var(--color-ink)]">
              Tenant Admins: {counters.tenantAdmins}
            </p>
            <p className="font-medium text-[var(--color-ink)]">
              Approver-capable holders: {counters.approverCapable}
            </p>
          </div>
          <p className="max-w-prose text-sm text-[var(--color-ink-subtle)]">
            Approver-capable is counted against a named, declared set:{' '}
            {APPROVER_CAPABLE_ROLES.map((r) => roleById(r).name).join(' and ')}. The source states
            the mandatory-role rule three times without ever enumerating that set, so the
            assumption is printed next to the number rather than inherited quietly.
          </p>
          {counters.warnings.length === 0 ? (
            <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
              Neither counter is at nought. A nought is never rendered quietly: the warning is
              produced next to the count, so no caller can draw one without the other.
            </p>
          ) : (
            <div
              role="alert"
              className="rounded-[var(--radius-surface)] border-l-4 border-[var(--color-status-blocked)] bg-[var(--color-surface)] p-4"
            >
              <p className="font-semibold text-[var(--color-ink)]">
                A mandatory-role rule is breached
              </p>
              <ul className="mt-2 space-y-1">
                {counters.warnings.map((warning) => (
                  <li key={warning} className="text-sm text-[var(--color-ink)]">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <ProhibitionNotice
            rendering={{
              kind: 'absent',
              note: matrixRow('remove-last-tenant-admin').cells.TENANT_ADMIN.cause,
            }}
          />
          <ProhibitionNotice
            rendering={{
              kind: 'absent',
              note: matrixRow('remove-last-approver-capable-role').cells.TENANT_ADMIN.cause,
            }}
          />
          <p className="max-w-prose text-sm text-[var(--color-ink-subtle)]">
            Whether a Job exists in the tenant is a declared input, not a fact this module owns.
            The seeded roster states it; no Job record exists in this build.
          </p>
        </section>

        {/* ---------------------------------------------------------- *
            SCR-DOH-ROLE-04 — why was I refused.
         * ---------------------------------------------------------- */}
        <section aria-label="Why was I refused" className="space-y-3">
          <h2 className="text-lg font-semibold">Why was I refused — SCR-DOH-ROLE-04</h2>

          <div className="space-y-3">
            {PRECEDENCE_RULES.map((rule) => (
              <div
                key={rule}
                className="rounded-[var(--radius-surface)] border border-[var(--color-border)] p-3"
              >
                <p className="font-medium text-[var(--color-ink)]">{PRECEDENCE_COPY[rule].title}</p>
                <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
                  {PRECEDENCE_COPY[rule].detail}
                </p>
              </div>
            ))}
          </div>
          <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
            Those two rules sit ABOVE the nine-condition intersection rather than reordering it.
            Safety wins by precedence, not by position: the list below is the order the source
            itself enumerates, role permission first and safety controls ninth, and this screen
            renders that array without ever re-sorting it.
          </p>

          <div className="overflow-x-auto">
            <Table
              caption="The nine intersecting access conditions, in the order the source enumerates them"
              columns={[
                { key: 'order', header: 'Order' },
                { key: 'condition', header: 'Condition' },
                { key: 'carriedBy', header: 'Where the evaluator carries it' },
                { key: 'changedBy', header: 'Who changes it' },
                { key: 'request', header: 'This request' },
              ]}
              rows={conditionRows}
              emptyState={{
                title: 'No access condition is registered.',
                whatCreatesIt: 'The spine enumerates them; an empty list would be a defect.',
              }}
            />
          </div>

          <div className="rounded-[var(--radius-surface)] border border-[var(--color-border)] p-3">
            <p className="font-medium text-[var(--color-ink)]">{scenario.label}</p>
            {scenarioRefused ? (
              <>
                <p className="mt-1 text-sm text-[var(--color-ink)]">
                  Refused at the {(ORDINALS[scenarioOrder] ?? '').toLowerCase()} of the nine
                  conditions — {conditionMapping(scenario.condition).name}.
                </p>
                <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
                  {scenario.narrative}
                </p>
                <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
                  Who can change it — {scenario.whoCanChangeIt}
                </p>
                <PermissionNotice decision={scenarioDecision} />
              </>
            ) : (
              <p className="mt-1 max-w-prose text-sm text-[var(--color-ink)]">
                No condition refused: every one of the nine passed for the {roleName} view, so the
                action proceeds. The explanation screen is not only for denials — it is the same
                screen either way, which is what stops a refusal being a missing button.
              </p>
            )}
          </div>

          <p className="max-w-prose text-sm text-[var(--color-ink-subtle)]">
            Deny by default: an undefined permission is a refusal and never a grant (L14476), and a
            rule the platform cannot evaluate is refused with that as the stated reason rather than
            waved through. A refusal never reveals anything outside the caller&apos;s own scope.
          </p>
        </section>

        {/* ---------------------------------------------------------- *
            SCR-DOH-ROLE-05 — the role definition card.
         * ---------------------------------------------------------- */}
        <section aria-label="Role definition card" className="space-y-3">
          <h2 className="text-lg font-semibold">
            Role definition card — SCR-DOH-ROLE-05, the {roleName}
          </h2>
          <dl className="space-y-3">
            {ROLE_CARD_BLOCK_NAMES.map((block) => (
              <div key={block}>
                <dt className="text-sm font-semibold text-[var(--color-ink)]">{block}</dt>
                <dd className="max-w-prose text-sm text-[var(--color-ink-muted)]">
                  {cardBody(block)}
                </dd>
              </div>
            ))}
          </dl>
          {exportBlocked === null ? (
            <Button
              variant="secondary"
              onClick={() =>
                setCardExportNote(
                  'The card is rendered in place above rather than written to a file. What an export would contain is an open client decision, so nothing was produced and nothing was downloaded.',
                )
              }
            >
              Save as document
            </Button>
          ) : (
            <Button variant="secondary" disabledReason={exportBlocked}>
              Save as document
            </Button>
          )}
          {cardExportNote === null ? null : (
            <p className="max-w-prose text-sm text-[var(--color-ink)]">{cardExportNote}</p>
          )}
        </section>

        {/* ---------------------------------------------------------- *
            Prohibitions rendered by rule.
         * ---------------------------------------------------------- */}
        <section aria-label="Controls that do not exist here" className="space-y-3">
          <h2 className="text-lg font-semibold">Controls that do not exist here</h2>
          <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
            Each of these is refused by a rule that binds every role, so nothing is drawn where the
            control would sit and the rule is stated in its place. A disabled control would imply a
            roadmap promise; an absent one states a decision.
          </p>
          <dl className="space-y-3">
            {ABSENT_CONTROLS.map((control) => (
              <div key={control.label}>
                <dt className="text-sm font-semibold text-[var(--color-ink)]">{control.label}</dt>
                <dd className="max-w-prose text-sm text-[var(--color-ink-muted)]">
                  {control.note}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-label="Scope in this pass" className="space-y-3">
          <h2 className="text-lg font-semibold">Scope in this pass</h2>
          <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
            Pass one of this module offers the tenant dimension and nothing else. Site and Area are
            a later pass of this same module and are not stubbed here, because an option that does
            nothing is a promise.
          </p>
          <ul className="space-y-2">
            {DEFERRED_DOH_SCOPES.map((deferred) => (
              <li key={deferred} className="max-w-prose text-sm text-[var(--color-ink-muted)]">
                {DEFERRED_SCOPE_LABEL[deferred]} — deferred beyond the first version, and no rule
                may depend on it (L14515). It is held outside the live scope type in the spine, so
                no picker on this surface can offer one by accident: absent by construction rather
                than by a filter somebody must remember to write.
              </li>
            ))}
          </ul>
        </section>

        {/* ---------------------------------------------------------- *
            OBJ-DOH-USER and its rivals (D21).
         * ---------------------------------------------------------- */}
        <section aria-label="Object states and their rivals" className="space-y-3">
          <h2 className="text-lg font-semibold">The user account, and its four rival lifecycles</h2>
          <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
            Account states: {USER_ACCOUNT_STATES.map((s) => ACCOUNT_STATE_LABEL[s]).join(', ')}. A
            role assignment carries its own pair: {ROLE_ASSIGNMENT_STATES.join(' and ')}. Under D21
            the module identity card governs the vocabulary — the names are renameable, the
            behaviours behind them are not — and the rivals are recorded rather than discarded.
          </p>
          <dl className="space-y-3">
            {ACCOUNT_LIFECYCLE_RIVALS.map((rival) => (
              <div key={rival.sourceRef}>
                <dt className="text-sm font-semibold text-[var(--color-ink)]">
                  {rival.label} ({rival.sourceRef}){rival.adopted ? ' — adopted' : ''}
                </dt>
                <dd className="max-w-prose text-sm text-[var(--color-ink-muted)]">
                  {rival.states.join(', ')}. {rival.note}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-label="Audit, in the same transaction" className="space-y-3">
          <h2 className="text-lg font-semibold">Audit</h2>
          <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
            Every write on this screen commits its audit entry in the same transaction as the
            action itself.
          </p>
          <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
            When that write fails, the action did not happen: nothing is half-applied, the register
            is unchanged, and the screen says so instead of showing an accepted action as done.
          </p>
          <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
            Every entry names the identity that performed the action. No entry carries a
            role-substitution field, and no surface renders a session-level role context at all
            (L17546, AC-16-12 L20225). Choosing a persona in the reviewer controls re-renders
            seeded fixtures; it alters no audit actor.
          </p>
        </section>

        <section aria-label="Screen states this module reaches" className="space-y-3">
          <h2 className="text-lg font-semibold">Screen states</h2>
          <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
            Reached here: {DOH09_APPLICABLE_STATES.join(', ')}. Connection loss splits three ways
            (D7) — content already loaded degrades with its age and origin, a read that fails
            outright names what failed and whether anything was written, and every write control
            disables with its reason rather than queueing.
          </p>
          <dl className="space-y-3">
            {DOH09_INAPPLICABLE_STATES.map((state) => (
              <div key={state.id}>
                <dt className="text-sm font-semibold text-[var(--color-ink)]">
                  {state.id} does not apply
                </dt>
                <dd className="max-w-prose text-sm text-[var(--color-ink-muted)]">
                  {state.reason}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-label="Cross-slice position" className="space-y-3">
          <h2 className="text-lg font-semibold">Cross-slice position</h2>
          <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
            This module registers no cross-slice seam of its own. It owns the tenant user account
            outright, and every fact rendered above is seeded inside this slice, so there is no
            missing half to name and no inline stub standing in for one.
          </p>
          <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
            One declared input does cross a boundary without being a seam: whether a Job exists in
            the tenant. The mandatory-role counter reads it, no Job record exists in this build,
            and the value is stated on the roster scenario rather than invented where it is used.
          </p>
        </section>

        <section aria-label="Unspecified in source" className="space-y-3">
          <h2 className="text-lg font-semibold">Unspecified in source</h2>
          <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
            Each of these is an affordance the source names without defining. No control was
            invented to fill any of them: an invented control reads back as a requirement.
          </p>
          <ul className="space-y-3">
            {UNSPECIFIED_IN_SOURCE.map((entry) => (
              <li key={entry.affordance}>
                <p className="text-sm font-semibold text-[var(--color-ink)]">{entry.affordance}</p>
                <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">{entry.note}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Conflicts in the source" className="space-y-3">
          <h2 className="text-lg font-semibold">Conflicts in the source, and how each was resolved</h2>
          <dl className="space-y-3">
            {SOURCE_CONFLICTS.map((conflict) => (
              <div key={conflict.topic}>
                <dt className="text-sm font-semibold text-[var(--color-ink)]">{conflict.topic}</dt>
                <dd className="max-w-prose text-sm text-[var(--color-ink-muted)]">
                  {conflict.conflict}
                </dd>
                <dd className="max-w-prose text-sm text-[var(--color-ink)]">
                  {conflict.resolution}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </HubShell>
  )
}
