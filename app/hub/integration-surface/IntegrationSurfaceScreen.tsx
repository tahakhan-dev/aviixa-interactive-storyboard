'use client'

import { useState } from 'react'
import { HubShell, type TenantRoleId } from '../HubShell'
import { dohModuleById } from '@/surfaces/doh/modules'
import { SeamNotice } from '@/ui/doh/SeamNotice'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import {
  Banner,
  Button,
  Checkbox,
  Field,
  FreshnessLabel,
  LiveRegion,
  Select,
  StatusPill,
  Table,
  type StatusTone,
  type TableRow,
} from '@/ui/primitives'
import { ScreenStateBoundary } from '@/ui/ScreenStateBoundary'
import { screenState } from '@/ui/screen-state'
import { evaluateAccess } from '@/policy/evaluate'
import { permitsAction, permitsRead, type PermissionDecision } from '@/policy/decision'
import { roleById } from '@/domain/roles'
import { TENANT_STATES, writeAllowed, type TenantState } from '@/surfaces/doh/tenant-state'
import { DEFERRED_DOH_SCOPES } from '@/surfaces/doh/scope'
import {
  SEEDED_SSO_CONNECTION,
  SSO_CONNECTION_STATES,
  SSO_PROTOCOLS,
  SSO_PROTOTYPE_NOTE,
  emailDomainOf,
  resolveSignInTrack,
  type SsoConnectionRecord,
  type SsoConnectionState,
  type SsoProtocol,
} from '@/surfaces/doh/sso-connection'
import {
  ABSENT_BY_RULE,
  ACTING_STATUSES,
  APPLICABLE_SCREEN_STATES,
  CONFIGURATION_EDIT,
  CONNECTION_LOSS_STATES,
  CONNECTION_STATE_LABEL,
  CONNECTION_STATE_MEANING,
  CONTROL_MATRIX,
  DECISIONS_ON_SCREEN,
  INAPPLICABLE_SCREEN_STATES,
  MODULE_STATE_NOTE,
  OUT_OF_SLICE_INTEGRATIONS,
  PROTOCOL_LABEL,
  PROTOCOL_TIER_RULE,
  READING_STATUSES,
  TEST_CONNECTION_LOCAL_PART,
  UNRESOLVED_IN_SOURCE,
  UNSPECIFIED_IN_SOURCE,
  fixtureContext,
  matrixRow,
  rolesReachingByMatrix,
  rolesWithStatus,
  type ApplicableScreenStateId,
  type ControlId,
} from './fixtures'

/**
 * MOD-DOH-12 — Integration Surface (tenant side), `SCR-DOH-21` Integration
 * settings, narrowed to FEAT-DOH-1201 single sign-on.
 *
 * THE ONE THING THIS SCREEN MUST NEVER IMPLY. There is no authentication
 * anywhere in this build. The connection record below is a seeded fixture: no
 * identity provider was contacted, nothing here authenticates anybody, and
 * changing a value would change no sign-in anywhere. The record and that
 * sentence both live in `@/surfaces/doh/sso-connection`, beside the two-track
 * sign-in screen that reads the same record, so two screens cannot describe
 * one fixture differently.
 *
 * WHAT MOD-DOH-12 OWNS IS A CONFIGURATION RECORD AND NOTHING ELSE. The
 * module card says it outright: configuration records for the single sign-on
 * connection and the tenant contact email, and no operational object. So this
 * screen has exactly two writes, both configuration edits, both gated by the
 * one write-class table, and both committed with their audit entry in the
 * same transaction.
 */
const MODULE = dohModuleById('MOD-DOH-12')

const TENANT_STATE_OPTIONS = TENANT_STATES.map((s) => ({ value: s, label: s }))

const SCREEN_STATE_OPTIONS = APPLICABLE_SCREEN_STATES.map((id) => ({
  value: id,
  label: `${id} — ${screenState(id).name}`,
}))

const CONNECTION_STATE_OPTIONS = SSO_CONNECTION_STATES.map((s) => ({
  value: s,
  label: CONNECTION_STATE_LABEL[s],
}))

const PROTOCOL_OPTIONS = SSO_PROTOCOLS.map((p) => ({ value: p, label: PROTOCOL_LABEL[p] }))

const CONNECTION_STATE_TONE: Readonly<Record<SsoConnectionState, StatusTone>> = {
  configured: 'ok',
  not_configured: 'neutral',
  reserved_inert: 'stale',
}

/** D7's own sentence, applied to a Hub write that meets a lost connection. */
const NEVER_QUEUED_REASON =
  'The connection to this workspace’s own records is lost. The connection record above degrades to the last figures loaded, with a freshness marker, and both writes on this screen disable rather than queue. Nothing on this surface ever queues a write, because a queued write is an action with no audit entry (D7).'

const LOADING_REASON =
  'The connection record has not arrived yet. A write offered against a record nobody has read would overwrite whatever is actually stored, so both writes wait for the read rather than racing it.'

const READ_ONLY_REASON =
  'This screen is in its read-only state. The cause is named once, above, and never shown as the bare words.'

const PLATFORM_SUPPORT_ROUTE = 'platform support, through the client’s own support channel'

/** The two rows of the matrix that produce a control on this screen. */
const WRITE_ROWS = [
  'configure-single-sign-on-metadata',
  'provide-tenant-contact-email',
] as const satisfies readonly ControlId[]

type Outcome =
  | { readonly kind: 'audit-failed'; readonly attempted: string }
  | { readonly kind: 'saved'; readonly message: string }

function decideFor(role: TenantRoleId, id: ControlId): PermissionDecision {
  const row = matrixRow(id)
  return evaluateAccess(
    {
      action: id,
      allowedRoles: rolesWithStatus(id, ACTING_STATUSES),
      sourceRefs: [row.sourceRef],
    },
    fixtureContext(role),
  )
}

export interface IntegrationSurfaceScreenProps {
  /** Which seeded persona this view opens on. The screen owns it from here. */
  readonly role?: TenantRoleId
  readonly tenantState?: TenantState
  readonly screenState?: ApplicableScreenStateId
}

export function IntegrationSurfaceScreen({
  role: initialRole,
  tenantState: initialTenantState,
  screenState: initialScreenState,
}: IntegrationSurfaceScreenProps = {}) {
  /* STATE OWNERSHIP: this screen owns `role` and `tenantState`, and
     `HubShell` renders the switcher as a controlled component from them. The
     screen is the shell's parent, never its child. */
  const [role, setRole] = useState<TenantRoleId>(initialRole ?? 'TENANT_ADMIN')
  const [tenantState, setTenantState] = useState<TenantState>(initialTenantState ?? 'active')
  const [stateId, setStateId] = useState<ApplicableScreenStateId>(initialScreenState ?? 'STATE-03')

  const [connection, setConnection] = useState<SsoConnectionRecord>(SEEDED_SSO_CONNECTION)
  const [draftProtocol, setDraftProtocol] = useState<SsoProtocol>(
    SEEDED_SSO_CONNECTION.protocol ?? 'saml',
  )
  const [draftEmail, setDraftEmail] = useState(SEEDED_SSO_CONNECTION.tenantContactEmail)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [auditWillFail, setAuditWillFail] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [testResult, setTestResult] = useState<string | null>(null)

  const roleName = roleById(role).name
  const definition = screenState(stateId)

  const connectionLost = (CONNECTION_LOSS_STATES as readonly string[]).includes(stateId)

  /**
   * ONE DERIVED RECORD, AND EVERY BRANCH THAT RENDERS OR READS THE
   * CONNECTION READS IT.
   *
   * Two drivers say whether a record is in force: the record's own state, and
   * the empty screen state a reviewer can select. STATE-01 IS "no connection
   * record in force", so it is folded in HERE, once, by coercing the state on
   * a derived copy — not by a boolean each rendering branch has to remember
   * to consult.
   *
   * Fix round 1 found exactly that defect: the fold lived on a `configured`
   * boolean that one of four branches read, so the status pill and the state
   * meaning rendered straight off the raw record and the card said
   * "Configured — a connection record exists" two paragraphs above "no
   * protocol is in force and no domain resolves onto this record". Four
   * branches reading one derived value cannot disagree; four branches each
   * remembering to check cannot be relied on.
   *
   * The WRITES below deliberately still spread `connection`, never this: a
   * write must persist onto the real record, or saving the contact email
   * while STATE-01 is selected would quietly persist the coercion with it.
   */
  const connectionShown: SsoConnectionRecord =
    stateId === 'STATE-01' ? { ...connection, state: 'not_configured' } : connection

  const configured = connectionShown.state === 'configured'

  /**
   * May this persona open the screen at all? Derived from the matrix by the
   * one rule the surface uses, never from a role list written beside the
   * question.
   */
  const openDecision = evaluateAccess(
    {
      action: 'open-integration-settings',
      allowedRoles: rolesReachingByMatrix(),
      sourceRefs: ['L29049', 'L48115'],
    },
    fixtureContext(role),
  )

  /**
   * A persona that opens the screen and holds an acting status on no row of
   * it. Read out of the matrix rather than named as a role, so a status
   * change in the table moves this with it.
   */
  const holdsNoWriteHere = !WRITE_ROWS.some((id) =>
    rolesWithStatus(id, ACTING_STATUSES).includes(role),
  )

  /**
   * THE ONE GATE, asked in one order and asked before either control
   * renders. `null` means the control is live and its handler changes
   * something observable on this screen.
   */
  function writeBlockReason(id: ControlId): string | null {
    const cell = matrixRow(id).byRole[role]
    if (cell.status === 'Explicitly prohibited') {
      return `Not held by the ${roleName}. ${cell.detail} The control exists on this screen for the Tenant Admin, so it renders here disabled with its reason rather than absent — the rule is taught at the moment it binds.`
    }
    if (!writeAllowed(tenantState, CONFIGURATION_EDIT)) {
      return `Blocked while this workspace is ${tenantState}. A single sign-on change and a contact-email change are both configuration edits, and configuration edits are one of the write classes this state closes. Route out: ${PLATFORM_SUPPORT_ROUTE}. The refusal is one row of the write-class table, read before this control rendered.`
    }
    if (connectionLost) return NEVER_QUEUED_REASON
    if (stateId === 'STATE-02') return LOADING_REASON
    if (stateId === 'STATE-06') return READ_ONLY_REASON
    const decision = decideFor(role, id)
    if (!permitsAction(decision)) {
      return decision.conditionToEnable === null
        ? decision.explanation
        : `${decision.explanation} ${decision.conditionToEnable}`
    }
    return null
  }

  const metadataBlockReason = writeBlockReason('configure-single-sign-on-metadata')
  const emailBlockReason = writeBlockReason('provide-tenant-contact-email')

  /**
   * The test-connection check is a READ, and it gates like one. It borrowed
   * the metadata write's reason until fix round 1, which meant a control that
   * edits no configuration announced "configuration edits are one of the
   * write classes this state closes" under a suspension, and "both writes on
   * this screen disable rather than queue" under a lost connection. The rule
   * was met — a disabled control carried a reason — but the reason was false
   * of the control carrying it, which is a dead control that has learned to
   * talk. So: the role's own cell, because validating metadata is part of
   * configuring it; and the freshness of the record it would resolve against.
   * The write-class table never sees this control, because it writes nothing.
   */
  function testBlockReason(): string | null {
    const cell = matrixRow('configure-single-sign-on-metadata').byRole[role]
    if (cell.status === 'Explicitly prohibited') {
      return `Not held by the ${roleName}. ${cell.detail} Validating single sign-on metadata is part of configuring it, so this check carries the same authority as the control above — and the same refusal.`
    }
    if (connectionLost || stateId === 'STATE-02') {
      return 'The connection record on this screen is the last one loaded, or has not arrived at all, so a check against it would report on a record that may already have changed. Nothing is queued and nothing is waiting: this control writes nothing, so there is no action to hold.'
    }
    return null
  }

  const testBlockedBecause = testBlockReason()

  /**
   * An outcome sentence describes ONE write, made against the persona, the
   * tenant state, the screen state and the record that were on screen when it
   * was made. Move any of those and the sentence stops being true of what a
   * reader is looking at, so every scenario change clears it.
   */
  function changeScenario(apply: () => void): void {
    apply()
    setOutcome(null)
    setTestResult(null)
    // Fix round 1: the validation message was the one piece of feedback that
    // survived a scenario change, so a refusal written against one persona
    // stayed on screen under the next. Same staleness the two lines above
    // exist to prevent, so it clears in the same place.
    setEmailError(null)
  }

  function changeRole(next: TenantRoleId): void {
    changeScenario(() => setRole(next))
  }

  /**
   * BOTH writes go through here, and neither has any other path. Audit is in
   * the same transaction as the action: when the audit write fails, the
   * transaction rolls back with it and NOTHING is applied — which is why
   * `apply` is called only on the far side of the check.
   */
  function commitWithAudit(attempted: string, apply: () => void, message: string): void {
    if (auditWillFail) {
      setOutcome({ kind: 'audit-failed', attempted })
      return
    }
    apply()
    setOutcome({ kind: 'saved', message })
  }

  function saveMetadata(): void {
    setTestResult(null)
    commitWithAudit(
      'the single sign-on metadata change',
      () => {
        setConnection({ ...connection, protocol: draftProtocol, state: 'configured' })
        // STATE-01 is "there is no connection record". Creating one is what
        // STATE-01's own `whatCreatesIt` says ends it, so a successful create
        // leaves the empty state rather than announcing a configured record
        // over a card still rendering the empty shape.
        if (stateId === 'STATE-01') setStateId('STATE-03')
      },
      `Single sign-on metadata saved in this storyboard: the connection record now names ${PROTOCOL_LABEL[draftProtocol]} and reads as configured. No identity provider was contacted, no metadata was exchanged, and nobody’s sign-in changed — there is nothing on the other end of this record.`,
    )
  }

  function saveContactEmail(): void {
    setTestResult(null)
    if (emailDomainOf(draftEmail) === null) {
      // Refused BEFORE the audit path: nothing was attempted, so there is no
      // transaction to roll back and no audit entry to fail.
      setEmailError(
        'The tenant contact email must be readable as one address — a single name, one @, and a domain carrying a dot. It is refused rather than guessed at, because the platform may direct email to this address and to no other outside the workspace’s own user records.',
      )
      setOutcome(null)
      return
    }
    setEmailError(null)
    commitWithAudit(
      'the tenant contact email change',
      () => setConnection({ ...connection, tenantContactEmail: draftEmail.trim() }),
      `Tenant contact email saved in this storyboard as ${draftEmail.trim()}. No message was sent, queued or scheduled: delivery belongs to the Notifications module in a later slice, and this screen only records the address.`,
    )
  }

  /**
   * A CHECK, NOT A HANDSHAKE, and it says so where it renders. It resolves an
   * address against the record on this screen using the same resolver the
   * sign-in screen uses, so the two can never disagree about which track an
   * address lands on. It writes nothing, which is why it does not go through
   * the audit path above: there is no transaction here to fail.
   */
  function testConnection(): void {
    const domain = connectionShown.emailDomains[0]
    if (domain === undefined) {
      setTestResult(
        'The connection record carries no email domain, so there is no address to resolve against it. Nothing was contacted.',
      )
      return
    }
    const probe = `${TEST_CONNECTION_LOCAL_PART}@${domain}`
    const track = resolveSignInTrack(probe, connectionShown)
    setTestResult(
      track === 'sso'
        ? `${probe} resolves onto the single sign-on track against the record above. Resolved against the seeded fixture: no directory was contacted and none answered.`
        : `${probe} resolves onto the platform-held credential track, because the record above is not in force. Resolved against the seeded fixture: no directory was contacted and none answered.`,
    )
  }

  const matrixRows: readonly TableRow[] = CONTROL_MATRIX.map((row) => ({
    control: (
      <>
        <span className="font-medium">{row.control}</span>
        <span className="block text-xs text-[var(--color-ink-subtle)]">{row.sourceRef}</span>
      </>
    ),
    admin: cell(row.byRole.TENANT_ADMIN.status, row.byRole.TENANT_ADMIN.detail),
    supervisor: cell(row.byRole.SUPERVISOR.status, row.byRole.SUPERVISOR.detail),
    quality: cell(row.byRole.QUALITY_MANAGER.status, row.byRole.QUALITY_MANAGER.detail),
    auditor: cell(row.byRole.READONLY_AUDITOR.status, row.byRole.READONLY_AUDITOR.detail),
    worker: cell(row.byRole.WORKER.status, row.byRole.WORKER.detail),
    rendering: (
      <>
        <span>{row.rendering}</span>
        <span className="block text-xs text-[var(--color-ink-subtle)]">{row.effect}</span>
      </>
    ),
  }))

  /* Reviewer chrome, kept visibly apart from the product. The connection
     record's own state is here rather than beside the card because no tenant
     role holds a control that sets it to anything but configured — the
     source names configuring a connection and nothing that unsets one. */
  const scenarioControls = (
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
          options={TENANT_STATE_OPTIONS}
          onChange={(value) => {
            const next = TENANT_STATES.find((s) => s === value)
            if (next !== undefined) changeScenario(() => setTenantState(next))
          }}
        />
        <Select
          label="Screen state"
          value={stateId}
          options={SCREEN_STATE_OPTIONS}
          onChange={(value) => {
            const next = APPLICABLE_SCREEN_STATES.find((s) => s === value)
            if (next !== undefined) changeScenario(() => setStateId(next))
          }}
        />
        <Select
          label="Connection record state"
          value={connectionShown.state}
          options={CONNECTION_STATE_OPTIONS}
          onChange={(value) => {
            const next = SSO_CONNECTION_STATES.find((s) => s === value)
            if (next !== undefined) changeScenario(() => setConnection({ ...connection, state: next }))
          }}
        />
        <Checkbox
          label="Simulate an audit-write failure on the next write"
          checked={auditWillFail}
          onChange={setAuditWillFail}
        />
      </div>
      <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
        These four re-render seeded fixtures. They perform no product action and change no business
        state. The connection-record state is here rather than beside the card because the source
        names a control that configures a connection and none that unsets one — so this selector
        stands in for a record arriving in a state, not for a control anybody presses.
      </p>
    </section>
  )

  const annotation = (
    <p className="text-xs text-[var(--color-ink-subtle)]">
      Screen annotation only, never a route key (D1): SCR-DOH-21, the integration settings screen,
      in the canonical catalogue. The other catalogue carries the same screen under a three-digit
      identifier which names a different screen in the canonical one, so this codebase writes that
      form nowhere. Storyboard SB-DOH-024; module-card control matrix L29041-L29050.
    </p>
  )

  if (!permitsRead(openDecision)) {
    return (
      <HubShell module={MODULE} role={role} onRoleChange={changeRole} tenantState={tenantState}>
        {annotation}
        <section aria-label="Permission denied" className="mt-6">
          <h2 className="text-lg font-semibold">This module is not offered to {roleName}</h2>
          <div className="mt-3">
            <ScreenStateBoundary
              state="STATE-05"
              surface="SURF-DOH"
              detail={{ decision: openDecision }}
            />
          </div>
          <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
            The module rail does not offer this route to {roleName}, so nothing here is hidden
            behind a missing button — this is what a deep link meets. Every row of this module’s
            matrix that {roleName} touches reads Unavailable, which means held in no scope at all
            rather than held by somebody else: there is no version of this screen for this persona
            to be shown a narrower copy of.
          </p>
          <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
            The attempt is audited. A refused attempt is written to this workspace’s own audit
            stream in the same transaction as the refusal, so a reader of that stream sees who tried
            and was turned away — never only who succeeded.
          </p>
          <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
            Nine permission tokens govern this refusal, not six (D8). This one is{' '}
            {openDecision.outcome}, stage {openDecision.stage}, and it carries an explicit reason
            rather than a blank cell.
          </p>
        </section>
        <div className="mt-6">{scenarioControls}</div>
      </HubShell>
    )
  }

  return (
    <HubShell module={MODULE} role={role} onRoleChange={changeRole} tenantState={tenantState}>
      {annotation}

      <div className="mt-6">{scenarioControls}</div>

      <section aria-label="Screen state" className="mt-6">
        <h2 className="text-lg font-semibold">Screen state</h2>
        <p className="mt-1 text-sm font-medium">
          {definition.id} — {definition.name}
        </p>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {definition.contract}
        </p>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          On MOD-DOH-12: {MODULE_STATE_NOTE[stateId]}
        </p>
        <div className="mt-3">
          <ScreenStateBoundary
            state={stateId}
            surface="SURF-DOH"
            detail={{
              objectLabel: 'single sign-on connection records',
              whatCreatesIt:
                'A Tenant Admin configures single sign-on metadata on this screen. Nothing else creates one, and no connection is provisioned automatically.',
              fieldLabel: 'Tenant contact email',
              rule: 'An address that cannot be read as one address is refused rather than guessed at.',
              permittedFormat: 'The accepted form is name@domain.example.',
              decision: decideFor(role, 'configure-single-sign-on-metadata'),
              readOnlyCause: holdsNoWriteHere
                ? `Read-only for the ${roleName} view: both write rows of this module’s matrix mark this persona Explicitly prohibited, so the record is readable and neither control acts.`
                : 'Read-only while the reviewer holds this screen in its read-only state; the two writes below name it as the reason they do not act.',
              asOfLabel: connectionShown.configuredAsOfLabel,
              originLabel:
                'the last connection record loaded before the connection dropped, degraded rather than blanked, with both writes disabled rather than queued',
              failureWhat: 'The read of this workspace’s single sign-on connection record failed.',
              wasWritten: false,
              nextStep:
                'The record above is the last that loaded. Both writes are disabled rather than queued while the connection is down, so nothing is waiting to be sent and no half-written change exists.',
              recoveryProgress:
                'Reconnected. The tenant state is being refetched BEFORE either write is re-enabled — a write offered against a stale suspension state is a write the gate never actually saw.',
            }}
          />
        </div>
      </section>

      {holdsNoWriteHere && stateId !== 'STATE-06' ? (
        <div className="mt-6">
          <Banner
            tone="info"
            heading="Read-only"
            body={`Both write rows of this module’s matrix mark the ${roleName} Explicitly prohibited — not Unavailable — so this persona opens the screen, reads the connection record, and meets a refusal it can read on each control rather than a control that is simply not there. The cause is named here once; the two controls below carry it as their stated reason.`}
          />
        </div>
      ) : null}

      <section aria-label="Single sign-on" className="mt-6">
        <h2 className="text-lg font-semibold">Single sign-on</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The whole of FEAT-DOH-1201, and the whole of what this slice builds on MOD-DOH-12: one
          connection record for the workspace, and the contact address the same record carries.
        </p>

        <div className="mt-4 rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4">
          <p className="font-medium text-[var(--color-ink)]">{connectionShown.providerLabel}</p>
          <p className="mt-2 text-sm">
            <StatusPill
              tone={CONNECTION_STATE_TONE[connectionShown.state]}
              icon="●"
              label={CONNECTION_STATE_LABEL[connectionShown.state]}
            />
          </p>
          <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
            {CONNECTION_STATE_MEANING[connectionShown.state]}
          </p>

          {configured ? (
            <>
              <p className="mt-3 text-sm text-[var(--color-ink)]">
                Protocol: {connectionShown.protocol === null ? 'none chosen' : PROTOCOL_LABEL[connectionShown.protocol]}
              </p>
              <p className="mt-1 text-sm text-[var(--color-ink)]">
                Email domains resolved onto this record: {connectionShown.emailDomains.join(', ')}
              </p>
            </>
          ) : (
            <p className="mt-3 max-w-prose text-sm text-[var(--color-ink)]">
              No protocol is in force and no domain resolves onto this record, so every address
              reaching the sign-in screen lands on the platform-held credential path instead. That
              is the secondary track by design, not a failure state: it is the door for staff whose
              organisation has no directory to federate with.
            </p>
          )}

          <p className="mt-3 text-sm text-[var(--color-ink)]">
            Tenant contact email: {connectionShown.tenantContactEmail}
          </p>

          <div className="mt-2">
            <FreshnessLabel
              asOfLabel={connectionShown.configuredAsOfLabel}
              originLabel={connectionShown.originLabel}
            />
          </div>

          <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
            {SSO_PROTOTYPE_NOTE}
          </p>
        </div>

        <div className="mt-5 space-y-6">
          <div>
            <p className="text-sm font-medium">Configure single sign-on metadata</p>
            <div className="mt-2 max-w-sm">
              <Select
                label="Single sign-on protocol"
                value={draftProtocol}
                options={PROTOCOL_OPTIONS}
                disabled={metadataBlockReason !== null}
                onChange={(value) => {
                  const next = SSO_PROTOCOLS.find((p) => p === value)
                  if (next !== undefined) setDraftProtocol(next)
                }}
              />
            </div>
            <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
              {PROTOCOL_TIER_RULE}
            </p>
            <div className="mt-3">
              {metadataBlockReason === null ? (
                <Button onClick={saveMetadata}>Save single sign-on metadata</Button>
              ) : (
                <Button disabledReason={metadataBlockReason}>Save single sign-on metadata</Button>
              )}
            </div>
            <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
              The choice above is a draft until it is saved: the record at the top of this screen
              keeps whatever it already carried, so a reader can always tell what is stored from
              what is merely typed. No metadata FIELD is enumerated in the source for either
              protocol, so none is drawn under this choice — see the unspecified panel below.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium">Provide the tenant contact email</p>
            <div className="mt-2 max-w-md">
              <Field
                label="Tenant contact email"
                description="The one address AVIIXA email may be directed to outside this workspace’s own user records. Recording it sends nothing."
                {...(emailError === null ? {} : { error: emailError })}
              >
                <input
                  type="email"
                  value={draftEmail}
                  disabled={emailBlockReason !== null}
                  onChange={(e) => setDraftEmail(e.target.value)}
                  className="w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-2 text-sm text-[var(--color-ink)]"
                />
              </Field>
            </div>
            <div className="mt-3">
              {emailBlockReason === null ? (
                <Button variant="secondary" onClick={saveContactEmail}>
                  Save the tenant contact email
                </Button>
              ) : (
                <Button variant="secondary" disabledReason={emailBlockReason}>
                  Save the tenant contact email
                </Button>
              )}
            </div>
            <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
              External notification recipients and quiet hours are outside this version: a workspace
              cannot direct AVIIXA email to a distribution list beyond its own user records, except
              this one named address.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium">Test connection</p>
            <div className="mt-2">
              {testBlockedBecause === null ? (
                <Button variant="secondary" onClick={testConnection}>
                  Test connection
                </Button>
              ) : (
                <Button variant="secondary" disabledReason={testBlockedBecause}>
                  Test connection
                </Button>
              )}
            </div>
            <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
              A check against the seeded record, never a handshake. It resolves a test address
              through the same resolver the sign-in screen uses, so the two can never disagree about
              which track an address lands on — and it reaches nothing, writes nothing, and
              therefore has no audit entry to fail. It carries the same authority as the metadata
              control above, because validating metadata is part of configuring it — but not the
              same gate: a control that writes nothing is never gated on a write class, and it has
              nothing to queue.
            </p>
            {testResult === null ? null : (
              <p className="mt-2 max-w-prose text-sm text-[var(--color-ink)]">{testResult}</p>
            )}
          </div>

          <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
            Audit is written in the same transaction as the action, for both writes above. If the
            audit write fails, the action fails with it and this screen says the action did not
            happen — an accepted action is never rendered as done ahead of its true state.
          </p>

          {/* Mounted BEFORE there is anything to announce. A live region
              inserted at the same moment as its content is not reliably
              announced, and "the action did not happen" is the one sentence
              on this screen a reader must not miss. */}
          <LiveRegion>
            {outcome === null ? null : (
              <p className="max-w-prose rounded-[var(--radius-control)] border border-[var(--color-border)] p-3 text-sm text-[var(--color-ink)]">
                {outcome.kind === 'audit-failed'
                  ? `The action did not happen. The audit write failed on ${outcome.attempted}, and because audit is in the same transaction as the action, the transaction rolled back with it: the connection record above is exactly as it was, nothing was written, and nothing is waiting to be retried. Try again once the audit path is healthy.`
                  : outcome.message}
              </p>
            )}
          </LiveRegion>
        </div>

        <div className="mt-6 space-y-3">
          <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
            <span className="font-medium text-[var(--color-ink)]">
              Authentication is not authorization.{' '}
            </span>
            Role assignment stays inside the platform. An assertion carrying a group or a role claim
            is untrusted input: it is logged and ignored, and it grants nothing (AC-RBAC-203,
            L20993). That is why there is no claim-to-role mapping table on this screen to
            configure — there is no mapping to make.
          </p>
          <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
            <span className="font-medium text-[var(--color-ink)]">
              No just-in-time provisioning at this version.{' '}
            </span>
            The platform maps an asserted subject to exactly one existing user record within exactly
            one workspace; where no such record exists, sign-in is refused and no account is created
            to receive it. {connectionShown.openDecision ?? 'No open decision'} is the open client
            decision that governs it, and the adopted interim position is refusal.
          </p>
          <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
            <span className="font-medium text-[var(--color-ink)]">
              Platform and tenant roles are separate security domains.{' '}
            </span>
            A Tenant Admin holds no platform authority, and a workspace-federated identity provider
            can never yield a platform console session.
          </p>
        </div>
      </section>

      <section aria-label="Cross-slice dependency" className="mt-6">
        <h2 className="text-lg font-semibold">Cross-slice dependency</h2>
        <div className="mt-2">
          <SeamNotice seamId="tenant-contact-email-delivery" />
        </div>
      </section>

      <section aria-label="Control matrix" className="mt-6">
        <h2 className="text-lg font-semibold">What each of the five tenant roles sees</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Nine controls, five roles, and an explicit status in every cell — a blank cell is an
          unanswered question an implementer would answer privately. Visibility above is driven from
          this table alone. Two of the nine rows draw a control on this screen and the other seven
          draw none — six because nobody holds them, and one because this slice renders it on another
          module’s screen. All seven stay in the table, because a matrix with its inconvenient rows
          removed is a matrix a reader cannot check.
        </p>
        <div className="mt-3">
          <Table
            caption="MOD-DOH-12 control matrix, by tenant role"
            columns={[
              { key: 'control', header: 'Control' },
              { key: 'admin', header: 'Tenant Admin' },
              { key: 'supervisor', header: 'Supervisor' },
              { key: 'quality', header: 'Quality Manager' },
              { key: 'auditor', header: 'Read-only Auditor' },
              { key: 'worker', header: 'Worker' },
              { key: 'rendering', header: 'How it renders here' },
            ]}
            rows={matrixRows}
            emptyState={{
              title: 'No control is defined for this module.',
              whatCreatesIt: 'The frozen source defines the matrix.',
            }}
          />
        </div>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          The Worker column is answered rather than blank, and its answer is that the Worker holds no
          Hub screen at all (D11). What that costs is stated rather than hidden: a worker without a
          device in hand cannot check their own certification expiry.
        </p>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          One row of the nine carries Unavailable — the tier and usage read view — and that row
          alone decides which personas the module rail offers this route to. Unavailable and
          Explicitly prohibited are never merged: the Supervisor and the Quality Manager are not
          offered the route at all, while the Read-only Auditor opens the screen and reads why each
          control does not act.
        </p>
      </section>

      <section aria-label="Absent by rule" className="mt-6">
        <h2 className="text-lg font-semibold">Absent by rule</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Nothing is drawn where each of these would sit — only the note saying why, and the source
          token that produced the rendering. An inert control would imply an enabled state exists
          for somebody, and for these it does not. Deferred scoping ({DEFERRED_DOH_SCOPES.join(', ')})
          is in the list for the same reason.
        </p>
        <div className="mt-3 space-y-4">
          {ABSENT_BY_RULE.map((item) => (
            <div key={item.label} className="text-sm text-[var(--color-ink-muted)]">
              <p className="font-medium text-[var(--color-ink)]">{item.label}</p>
              <p className="text-xs text-[var(--color-ink-subtle)]">{item.token}</p>
              <ProhibitionNotice rendering={{ kind: 'absent', note: item.note }} />
            </div>
          ))}
        </div>
      </section>

      <section aria-label="The rest of the integration surface" className="mt-6">
        <h2 className="text-lg font-semibold">The rest of the integration surface</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The module card carries four features and this slice builds one of them. The other three
          are named here with what the source says about each and where it stands — never as a
          disabled control, because a disabled control is a promise and none of these has been made.
        </p>
        <ul className="mt-3 space-y-4">
          {OUT_OF_SLICE_INTEGRATIONS.map((item) => (
            <li key={item.name}>
              <p className="font-medium text-[var(--color-ink)]">{item.name}</p>
              <p className="mt-1 max-w-prose text-sm text-[var(--color-ink)]">
                {item.whatTheSourceSays}
              </p>
              <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
                {item.whereItStands}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="States that never render here" className="mt-6">
        <h2 className="text-lg font-semibold">States that never render here</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Four of the thirteen screen states cannot occur on MOD-DOH-12. They are named with their
          reason rather than quietly left out of the selector.
        </p>
        <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
          {INAPPLICABLE_SCREEN_STATES.map((s) => (
            <li key={s.id}>
              <span className="font-medium text-[var(--color-ink)]">{s.id}</span> — {s.why}
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Decisions rendered on this screen" className="mt-6">
        <h2 className="text-lg font-semibold">Decisions this screen renders</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Each one is a judgement made against the frozen source, visible here rather than buried in
          a comment a reviewer would never read.
        </p>
        <ul className="mt-2 space-y-2 text-sm text-[var(--color-ink-muted)]">
          {DECISIONS_ON_SCREEN.map((d) => (
            <li key={d.ref}>
              <span className="font-medium text-[var(--color-ink)]">{d.ref}</span> — {d.statement}
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Unspecified in source" className="mt-6">
        <h2 className="text-lg font-semibold">Unspecified in source</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Affordances a reader might expect on this screen that the source does not define. Named
          here rather than invented, because a plausible invented control reads back as a
          requirement — and on a sign-on screen an invented field reads back as a security
          commitment.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-ink-muted)]">
          {UNSPECIFIED_IN_SOURCE.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section aria-label="Unresolved in source" className="mt-6">
        <h2 className="text-lg font-semibold">Unresolved in source</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Questions the frozen source leaves open or answers twice. None is resolved silently in
          code.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-ink-muted)]">
          {UNRESOLVED_IN_SOURCE.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </HubShell>
  )
}

function cell(status: string, detail: string) {
  return (
    <>
      <span className="font-medium">{status}</span>
      <span className="block text-xs text-[var(--color-ink-subtle)]">{detail}</span>
    </>
  )
}
