'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SaConsoleShell } from '../SaConsoleShell'
import { saModuleById } from '@/surfaces/sa/modules'
import { CommandStateBadge } from '@/ui/sa/CommandStateBadge'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import {
  Button,
  Checkbox,
  Field,
  PermissionNotice,
  Select,
  StatusPill,
  Table,
  Tabs,
  type StatusTone,
  type TableRow,
} from '@/ui/primitives'
import { ScreenStateBoundary } from '@/ui/ScreenStateBoundary'
import { screenState, type ScreenStateId } from '@/ui/screen-state'
import { evaluateAccess } from '@/policy/evaluate'
import type { PermissionDecision } from '@/policy/decision'
import type { RoleId } from '@/domain/roles'
import { emptyDomainState } from '@/domain/state'
import { scenarioRunId } from '@/domain/ids'
import { RootUnavailableFreeze } from '@/ui/sa/RootUnavailableFreeze'
import { SA_APPLICABLE_STATES } from '@/surfaces/sa/screen-states'
import {
  DETAIL_TABS,
  HARD_SUSPENSION_REASON_CLASSES,
  LIFECYCLE_TRANSITIONS,
  SUSPENSION_COMMAND_SEQUENCE,
  TENANTS,
  TENANT_LIFECYCLE_STATES,
  TENANT_PLATFORM_ROLES,
  UNRESOLVED_IN_SOURCE,
  UNSPECIFIED_IN_SOURCE,
  type DetailTabId,
  type TenantLifecycleState,
  type TenantRow,
} from './fixtures'

const MODULE = saModuleById('MOD-SA-09')

const ALL_CONSOLE_ROLES: readonly RoleId[] = TENANT_PLATFORM_ROLES.map((r) => r.roleId)
const ROOT_AND_ADMIN: readonly RoleId[] = ['ROOT_SUPER_ADMIN', 'ADMIN']
const ADMIN_ONLY: readonly RoleId[] = ['ADMIN']

const SCREEN_STATE_OPTIONS = SA_APPLICABLE_STATES.map((s) => ({
  value: s.id,
  label: `${s.id} — ${s.name}`,
}))

const FIXTURE_STATE = emptyDomainState(scenarioRunId('SA-MOD-09-STORYBOARD'))

const STATE_TONE: Record<TenantLifecycleState, StatusTone> = {
  invited: 'info',
  pilot: 'info',
  active: 'ok',
  soft: 'attention',
  hard: 'attention',
  compliance: 'blocked',
  'pending downgrade': 'stale',
  archived: 'neutral',
}

function contextFor(roleId: RoleId) {
  return {
    state: FIXTURE_STATE,
    identity: {
      signedIn: true,
      role: roleId,
      // A console role holds no ambient tenant: it acts through a named
      // access class or not at all (AC-AUTH-006, L10429).
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
    actorOfRecord: 'storyboard-viewer',
  } as const
}

/** Every affordance on this screen is decided here, by its own control
 *  entry's allowed-roles — never by the module-level `roles_allowed` list,
 *  which differs across seven extraction chunks and is authoritative
 *  nowhere (D16). */
function decide(
  roleId: RoleId,
  action: string,
  allowedRoles: readonly RoleId[],
  sourceRefs: readonly string[],
  openDecision?: string,
): PermissionDecision {
  return evaluateAccess(
    {
      action,
      allowedRoles,
      sourceRefs,
      ...(openDecision !== undefined ? { openDecision } : {}),
    },
    contextFor(roleId),
  )
}

export function TenantsScreen() {
  const [sourceRoleId, setSourceRoleId] = useState<string>('ROLE-PLAT-ROOT')
  const [stateId, setStateId] = useState<ScreenStateId>('STATE-03')
  const [statusFilter, setStatusFilter] = useState('')
  const [tierFilter, setTierFilter] = useState('')
  const [pilotFilter, setPilotFilter] = useState('')
  const [tenants, setTenants] = useState<readonly TenantRow[]>(TENANTS)
  const [detailTenantId, setDetailTenantId] = useState<string>('TEN-BRIGHTBIKES')
  const [activeTab, setActiveTab] = useState<DetailTabId>('overview')
  const [createPanelOpen, setCreatePanelOpen] = useState(false)
  const [regulatedMode, setRegulatedMode] = useState(false)
  const [typedConfirmation, setTypedConfirmation] = useState('')
  const [reasonClass, setReasonClass] = useState('')
  const [commandIndex, setCommandIndex] = useState(0)
  const [complianceRequestOpened, setComplianceRequestOpened] = useState(false)

  const role = TENANT_PLATFORM_ROLES.find((r) => r.sourceId === sourceRoleId) ?? TENANT_PLATFORM_ROLES[0]
  const roleId = role.roleId
  const definition = screenState(stateId)

  const visible = tenants.filter(
    (t) =>
      (statusFilter === '' || t.state === statusFilter) &&
      (tierFilter === '' || t.tier === tierFilter) &&
      (pilotFilter === '' || (pilotFilter === 'pilot-only' ? t.pilot : !t.pilot)),
  )

  // `TENANTS[0]`, not `tenants[0]`: the seeded tuple's first element is
  // statically known to exist, where the state array's is not under
  // noUncheckedIndexedAccess. The fallback is unreachable in practice —
  // the selector only ever offers ids that are in the list.
  const detailTenant: TenantRow = tenants.find((t) => t.id === detailTenantId) ?? TENANTS[0]

  // The suspension target the source's own storyboard uses: the
  // soft-suspended tenant escalating at sixty days.
  const HARD_TARGET = 'TEN-CLEARWATER'
  const confirmationMatches = typedConfirmation === HARD_TARGET
  const confirmationWrong = typedConfirmation !== '' && !confirmationMatches

  const createDecision = decide(roleId, 'create-tenant', ROOT_AND_ADMIN, ['L75180', 'L52400'])
  const activateDecision = decide(roleId, 'activate-tenant', ROOT_AND_ADMIN, ['L75180'])
  const invitationDecision = decide(roleId, 'manage-invitation', ADMIN_ONLY, ['L75604'])
  const hardDecision = decide(roleId, 'apply-hard-suspension', ROOT_AND_ADMIN, ['L44984'])
  // The compliance-suspension control entry names both roles: the Admin
  // drafts and the root approves (CHK-014 controls[5], L44984). Its effect is
  // "opens a critical-class request rather than acting", so drafting it is
  // not the critical act — approval is, and approval lives in MOD-SA-08. The
  // two roles the entry does not name see the class badge in place of the
  // action bar.
  const complianceDecision = decide(roleId, 'open-compliance-suspension-request', ROOT_AND_ADMIN, [
    'L44984',
    'L55942',
  ])
  const regulatedDecision = decide(roleId, 'set-regulated-industry-mode', ADMIN_ONLY, ['L52383'])
  const filterDecision = decide(roleId, 'filter-tenant-list', ALL_CONSOLE_ROLES, [
    'L44984',
    'D16 L42742',
  ])

  function applyHardSuspension(): void {
    setTenants((current) =>
      current.map((t) => (t.id === HARD_TARGET ? { ...t, state: 'hard' } : t)),
    )
    setTypedConfirmation('')
    setReasonClass('')
  }

  const currentCommandState =
    SUSPENSION_COMMAND_SEQUENCE[commandIndex] ?? SUSPENSION_COMMAND_SEQUENCE[0]
  const nextCommandState = SUSPENSION_COMMAND_SEQUENCE[commandIndex + 1]
  // AC-SA-09-10 / AC-SA-000-08: `applied` is the state the command reached,
  // not evidence the device took it. Only the device's own acknowledgement —
  // and the reconciliation that follows it — lets this console say the lock
  // took effect on that device.
  const deviceAcknowledged =
    currentCommandState === 'acknowledged' || currentCommandState === 'reconciled'

  const listRows: readonly TableRow[] = visible.map((t) => ({
    tenant: (
      <>
        <span className="font-medium">{t.name}</span>{' '}
        <span className="text-xs text-[var(--color-ink-subtle)]">{t.id}</span>
      </>
    ),
    status: <StatusPill tone={STATE_TONE[t.state]} icon="●" label={t.state} />,
    tier: t.tier,
    usage: (
      <>
        <span>{t.headlineUsage ?? 'Measure unavailable'}</span>
        <span className="block text-xs text-[var(--color-ink-subtle)]">
          as of {t.usageAsOf}
          {t.usageFreshness === 'stale' ? ` — stale, ${t.usageAge ?? 'age not recorded'}` : ''}
          {t.usageFreshness === 'unavailable'
            ? ' — unavailable, and never rendered as a count it does not have'
            : ''}
        </span>
      </>
    ),
    time: t.timeOnPlatform,
  }))

  const transitionRows: readonly TableRow[] = LIFECYCLE_TRANSITIONS.map((t) => ({
    from: t.from,
    to: t.to,
    cause: t.cause,
    who: t.whoMayCause,
    rendering: t.rendering,
    reversibility: (
      <>
        <span className="font-medium">{t.reversibility}</span>
        <span className="block text-xs text-[var(--color-ink-subtle)]">
          {t.reversibilityNote} ({t.sourceRef})
        </span>
      </>
    ),
  }))

  return (
    <SaConsoleShell module={MODULE}>
      <p className="text-xs text-[var(--color-ink-subtle)]">
        Screen annotations only, never route keys (D1): SCR-SA-14 tenant list and SCR-SA-15 tenant
        detail (L42806, L42807), SB-SA-09 (L44984), SB-31-01, SB-31-02 and SB-31-05 (L75180,
        L75309, L75604), SB-SA-TENANT-01 (L117966). A second numbering scheme calls the same two
        screens SCR-SA-11 and SCR-SA-12; the route is named, and neither number keys anything.
      </p>

      <section aria-label="View controls" className="mt-6 flex flex-wrap gap-4">
        <Select
          label="View as platform role"
          value={sourceRoleId}
          onChange={setSourceRoleId}
          options={TENANT_PLATFORM_ROLES.map((r) => ({
            value: r.sourceId,
            label: `${r.name} (${r.sourceId})`,
          }))}
        />
        <Select
          label="Screen state"
          value={stateId}
          onChange={(v) => setStateId(v as ScreenStateId)}
          options={SCREEN_STATE_OPTIONS}
        />
      </section>
      <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
        The role selector is a view switcher, not a sign-in. Every affordance below is decided by
        its own control entry&rsquo;s allowed-roles through the policy evaluator. All four console
        roles read every screen here; the Platform Engineer and Support see the tenant list
        read-only.
      </p>

      <section aria-label="Screen state" className="mt-6">
        <h2 className="text-lg font-semibold">Screen state</h2>
        <p className="mt-1 text-sm font-medium">
          {definition.id} — {definition.name}
        </p>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {definition.contract}
        </p>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          On this module: {MODULE_STATE_NOTE[stateId]}
        </p>
        <div className="mt-3">{stateTreatment(stateId, roleId, role.name, hardDecision)}</div>
      </section>

      <section aria-label="Tenant list" className="mt-6">
        <h2 className="text-lg font-semibold">Tenant list</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Status, tier, headline usage and time on platform (L52383, L57245). Headline usage is a
          count of Worker-Shifts in the tenant-month — a billing unit on a commercial ledger. There
          is nothing beneath it on this console.
        </p>
        {filterDecision.outcome !== 'allowed' ? (
          <PermissionNotice decision={filterDecision} />
        ) : null}
        <div className="mt-3 flex flex-wrap gap-4">
          <Select
            label="Status filter"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: '', label: 'All lifecycle states' },
              ...TENANT_LIFECYCLE_STATES.map((s) => ({ value: s, label: s })),
            ]}
          />
          <Select
            label="Tier filter"
            value={tierFilter}
            onChange={setTierFilter}
            options={[
              { value: '', label: 'All tiers' },
              { value: 'Starter', label: 'Starter' },
              { value: 'Growth', label: 'Growth' },
              { value: 'Enterprise', label: 'Enterprise' },
            ]}
          />
          <Select
            label="Pilot filter"
            value={pilotFilter}
            onChange={setPilotFilter}
            options={[
              { value: '', label: 'Pilots and non-pilots' },
              { value: 'pilot-only', label: 'Pilots only' },
              { value: 'non-pilot', label: 'Non-pilots only' },
            ]}
          />
        </div>
        <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          The filters are the one control the source gives to all four console roles (L44984). A
          filter narrows a read and grants nothing.
        </p>
        <div className="mt-3">
          <Table
            caption="Tenants by lifecycle state, tier and headline usage"
            columns={[
              { key: 'tenant', header: 'Tenant' },
              { key: 'status', header: 'Lifecycle state' },
              { key: 'tier', header: 'Tier' },
              { key: 'usage', header: 'Headline usage (tenant-month)' },
              { key: 'time', header: 'Time on platform' },
            ]}
            rows={listRows}
            filtered={visible.length !== tenants.length}
            emptyState={{
              title: 'There are no tenants yet.',
              whatCreatesIt:
                'The client’s platform team creates one from New Tenant. No public self-signup path exists.',
            }}
          />
        </div>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          Every usage figure carries the moment it was true. A degraded one renders stale with its
          age, a wholly unavailable one renders unavailable, and neither renders as a zero or a
          blank (AC-SA-01-03, FB-SA-01).
        </p>
      </section>

      <section aria-label="Lifecycle transitions" className="mt-6">
        <h2 className="text-lg font-semibold">Lifecycle transitions</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Every legal transition of `OBJ-SA-TENANT`&rsquo;s eight states, who may cause it, how it
          is offered on this screen, and whether it can be undone. Suspension is a three-state
          machine of graded restraint, not an on-off switch (L44917).
        </p>
        <div className="mt-3">
          <Table
            caption="Tenant lifecycle transitions, their causers and their reversibility"
            columns={[
              { key: 'from', header: 'From' },
              { key: 'to', header: 'To' },
              { key: 'cause', header: 'What causes it' },
              { key: 'who', header: 'Who may cause it' },
              { key: 'rendering', header: 'How it is offered here' },
              { key: 'reversibility', header: 'Reversible?' },
            ]}
            rows={transitionRows}
            emptyState={{
              title: 'No transition is defined.',
              whatCreatesIt: 'The frozen source defines the lifecycle.',
            }}
          />
        </div>
      </section>

      <section aria-label="Lifecycle actions" className="mt-6">
        <h2 className="text-lg font-semibold">Lifecycle actions</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The controls the frozen source defines for this module, each decided by its own
          allowed-roles. A control a role does not hold is drawn inert with the reason named, never
          hidden behind a missing button.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <p className="text-sm font-medium">New Tenant</p>
            {createDecision.outcome === 'allowed' ? (
              <Button onClick={() => setCreatePanelOpen(true)}>New Tenant</Button>
            ) : (
              <Button
                disabledReason={`${createDecision.explanation} Tenant creation is held by the Root Super Admin and the Admin; the Platform Engineer sees the tenant list read-only and may not create a tenant (L52401), and Support holds read access for support work alone. Viewing as ${role.name}.`}
              >
                New Tenant
              </Button>
            )}
            <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
              The record enters a safe draft state; nothing is provisioned until the tenant side
              accepts (L75180).
            </p>
          </div>

          {createPanelOpen ? (
            <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] p-4">
              <p className="font-medium">Create tenant panel</p>
              <div className="mt-3 space-y-3">
                <Field label="Organisation name">
                  <input
                    type="text"
                    className="w-full rounded-[var(--radius-control)] border border-[var(--color-border)] px-2 py-1 text-sm"
                  />
                </Field>
                <Select
                  label="Tier at creation"
                  value="Starter"
                  onChange={() => undefined}
                  options={[
                    { value: 'Starter', label: 'Starter' },
                    { value: 'Growth', label: 'Growth' },
                    { value: 'Enterprise', label: 'Enterprise' },
                  ]}
                />
                <Select
                  label="Region posture"
                  value="platform-default"
                  onChange={() => undefined}
                  options={[{ value: 'platform-default', label: 'Platform default' }]}
                />
                {regulatedDecision.outcome === 'allowed' ? (
                  <Checkbox
                    label="Regulated-Industry mode"
                    checked={regulatedMode}
                    onChange={setRegulatedMode}
                  />
                ) : (
                  <ProhibitionNotice
                    rendering={{
                      kind: 'disabled-with-reason',
                      label: 'Regulated-Industry mode',
                      reason: `The source names the platform Admin alone on this toggle (L52383), and it is set at creation. Viewing as ${role.name}.`,
                    }}
                  />
                )}
              </div>
              <ProhibitionNotice
                rendering={{
                  kind: 'absent',
                  note: 'Per-tenant region control is absent for every account including the root (L97239). The posture shown is the platform default and is not settable here.',
                }}
              />
            </div>
          ) : null}

          <div>
            <p className="text-sm font-medium">Activate tenant</p>
            <Button
              disabledReason={
                activateDecision.outcome !== 'allowed'
                  ? `${activateDecision.explanation} Activation is held by the Root Super Admin and the Admin. Viewing as ${role.name}.`
                  : 'Outstanding step: the first Tenant Admin has not accepted the invitation and authenticated, so North Forge (TEN-NORTHFORGE) cannot leave its safe draft state (L75557).'
              }
            >
              Activate tenant
            </Button>
          </div>

          <div>
            <p className="text-sm font-medium">Invitation</p>
            <div className="flex flex-wrap items-start gap-3">
              {(['Resend', 'Reissue to a corrected address', 'Revoke'] as const).map((label) =>
                invitationDecision.outcome === 'allowed' ? (
                  <Button key={label} variant="secondary">
                    {label}
                  </Button>
                ) : (
                  <Button
                    key={label}
                    disabledReason={`${invitationDecision.explanation} The source names the Admin alone on the invitation controls (L75604). Viewing as ${role.name}.`}
                  >
                    {label}
                  </Button>
                ),
              )}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">Soft suspension</p>
            <ProhibitionNotice
              rendering={{
                kind: 'absent',
                note: 'Nothing is drawn here for any role, the root included: the frozen source defines no control entry with an allowed-roles list either for applying a soft suspension — WF-PLT-004 (L55108) is a workflow and names no control — or for releasing one, where the release path itself is the open decision DEC-SUSP-001 (§4.2.4 lifts it on the operator’s signal, §8.9.2 and Part IX clear it on payment, §4.2.1 and §8.12 state there is no payment integration). Both are named in the unspecified-in-source panel below rather than drawn, because an inert control implies an enabled state exists for someone and reads back as a requirement to build one.',
              }}
            />
          </div>

          <div>
            <p className="text-sm font-medium">Hard suspension</p>
            <p className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
              Confirmation weight proportional to consequence (L44984): the tenant identifier is
              typed out and a reason class is chosen before the control acts. Target for this
              storyboard: Clearwater Tooling (TEN-CLEARWATER), the soft-suspended tenant escalating
              at sixty days.
            </p>
            <div className="mt-2 space-y-3">
              <Field
                label="Type the tenant identifier to confirm"
                {...(confirmationWrong
                  ? {
                      error:
                        'What was typed does not match the tenant identifier TEN-CLEARWATER. Nothing has been applied.',
                    }
                  : {})}
              >
                <input
                  type="text"
                  value={typedConfirmation}
                  onChange={(e) => setTypedConfirmation(e.target.value)}
                  className="w-full rounded-[var(--radius-control)] border border-[var(--color-border)] px-2 py-1 text-sm"
                />
              </Field>
              <Select
                label="Reason class"
                value={reasonClass}
                onChange={setReasonClass}
                options={[
                  { value: '', label: 'Choose a reason class' },
                  ...HARD_SUSPENSION_REASON_CLASSES.map((r) => ({
                    value: r.value,
                    label: r.label,
                  })),
                ]}
              />
              {hardDecision.outcome !== 'allowed' ? (
                <Button
                  disabledReason={`${hardDecision.explanation} Hard suspension is held by the Root Super Admin and the Admin (L44984). Viewing as ${role.name}.`}
                >
                  Apply hard suspension
                </Button>
              ) : !confirmationMatches || reasonClass === '' ? (
                <Button disabledReason="The typed confirmation must match the tenant identifier and a reason class must be chosen before this control acts.">
                  Apply hard suspension
                </Button>
              ) : (
                <Button onClick={applyHardSuspension}>Apply hard suspension</Button>
              )}
            </div>
            <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
              A Band B routine change: it applies and is audited, with the transition and its audit
              record committing in one transaction. It is not the critical class, and it is not the
              compliance suspension below.
            </p>
          </div>
        </div>
      </section>

      <section aria-label="Compliance suspension" className="mt-6">
        <h2 className="text-lg font-semibold">Compliance suspension</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Critical class. The Admin drafts the request and the Root Super Admin approves — the
          control entry names both (L44984) — and the control opens a request rather than acting,
          so drafting it is not the critical act. Approval is. The Platform Engineer is explicitly
          prohibited from applying one at all, and Support is not named on the control; both see
          the class badge in place of the action bar.
        </p>
        {complianceDecision.outcome === 'allowed' ? (
          <>
            <Button onClick={() => setComplianceRequestOpened(true)}>
              Open the critical-class request
            </Button>
            {complianceRequestOpened ? (
              <p role="status" className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
                Nothing was sent and no tenant changed: this storyboard holds no request queue, and
                the panel below is a fixture rendering of what the built platform would draft.
                Request SA-REQ-0091 would sit awaiting root approval, and this control would not
                approve it — approval is given in Console Users, Roles and Change Approvals, and a
                blocked attempt is itself an audit event (AC-SA-000-04). Exactly one root account
                exists, so no second approver is available; the approval queue renders that openly.
              </p>
            ) : null}
          </>
        ) : (
          <ProhibitionNotice rendering={{ kind: 'class-badge' }} />
        )}
        <p role="note" className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          Compliance suspension blocks all logins immediately, stops in-flight runs and locks
          devices at next contact with the fixed worker-facing message (AC-SA-09-06). Two wordings
          of that message survive in the source; neither is rendered here as canonical
          (DEC-MSG-001).
        </p>
      </section>

      <section aria-label="Suspension command channel" className="mt-6">
        <h2 className="text-lg font-semibold">Suspension command channel</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          AC-SA-09-10 · A device lock is never rendered as having taken effect on a device before
          that device acknowledges it. The command below advances only when the reader steps the
          fixture, and its true state is always named.
        </p>
        <div className="mt-3">
          <CommandStateBadge state={currentCommandState} />
        </div>
        <p role="note" className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {deviceAcknowledged
            ? `The device has acknowledged this command (${currentCommandState}), and only now does this console render the lock as having taken effect on that device (AC-SA-09-10).`
            : `The device has not acknowledged this command. Its true state is ${currentCommandState}, which is what is named above, and the lock is not rendered as having taken effect on the device (AC-SA-09-10).`}
        </p>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          {nextCommandState !== undefined
            ? `Next state in the sequence for a command reaching an offline device: ${nextCommandState} (L46708).`
            : 'The command has reached the end of the sequence the source gives for an offline device (L46708).'}
        </p>
        <div className="mt-2">
          {nextCommandState !== undefined ? (
            <Button variant="secondary" onClick={() => setCommandIndex(commandIndex + 1)}>
              Advance the fixture one state
            </Button>
          ) : (
            <Button disabledReason="The fixture has reached the last state in the sequence; there is nothing further to step.">
              Advance the fixture one state
            </Button>
          )}
        </div>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          The stepper simulates the device&rsquo;s own next contact. It is a storyboard fixture
          control, not a console action against a tenant, and no channel exists behind it. Two
          tablets remain unreached, TAB-033 and TAB-041, at four hours and eleven hours since last
          contact — the platform-side block is fully in force while those devices stay unreached
          (FB-SA-04, L45052).
        </p>
      </section>

      <section aria-label="Tenant detail" className="mt-6">
        <h2 className="text-lg font-semibold">Tenant detail</h2>
        <div className="mt-2 max-w-sm">
          <Select
            label="Open a tenant detail page"
            value={detailTenant.id}
            onChange={setDetailTenantId}
            options={tenants.map((t) => ({ value: t.id, label: `${t.name} (${t.id})` }))}
          />
        </div>
        <p className="mt-2 max-w-prose text-sm font-medium text-[var(--color-ink)]">
          {detailTenant.name} · {detailTenant.id} · {detailTenant.state} · {detailTenant.tier} tier
        </p>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {detailTenant.note}
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          AC-SA-09-14 · No operational action of any kind can be taken from this page by any
          console role, the root included — visibility, not intervention. Every tab below is a
          read, and each one names the action a reader might expect it to carry.
        </p>

        <div className="mt-3">
          <Tabs
            tabs={DETAIL_TABS.map((t) => ({ id: t.id, label: t.label }))}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as DetailTabId)}
          />
        </div>
        <div className="mt-3">{tabContent(activeTab, detailTenant)}</div>

        <p role="note" className="mt-4 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          The eighth tab is unresolved (D20). The source asserts eight tabs on this page and
          enumerates seven groupings; the seven named are built and the eighth is left unnamed
          rather than guessed, because a guessed tab reads back as a requirement.
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Reaching record-level tenant content needs a named access class. The session-request form
          lives in{' '}
          <Link href="/super-admin/support-access/" className="text-[var(--color-primary)] underline">
            Support Access
          </Link>
          , and there is no ambient browsing anywhere on this console.
        </p>
      </section>

      <section aria-label="Absent by rule" className="mt-6">
        <h2 className="text-lg font-semibold">Absent by rule</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          These actions do not exist on this platform for any account, the root included. Nothing
          is drawn where each would sit — only the note saying why.
        </p>
        <div className="mt-2 space-y-2 text-sm text-[var(--color-ink-muted)]">
          <ProhibitionNotice
            rendering={{
              kind: 'absent',
              note: 'No public self-signup path exists. Every tenant is created by the client’s platform team, and onboarding is invitation-driven (AC-SA-09-01).',
            }}
          />
          <ProhibitionNotice
            rendering={{
              kind: 'absent',
              note: 'No Boolean blocked field exists on the tenant record. Blocking is expressed only through the three defined suspension states (AC-SA-20-3-01), so there is no block toggle to draw.',
            }}
          />
          <ProhibitionNotice
            rendering={{
              kind: 'absent',
              note: 'No delete or purge control exists on this or any storage surface: nothing is purged, and the retention value is a hot-retrievability horizon (MOD-SA-17).',
            }}
          />
          <ProhibitionNotice
            rendering={{
              kind: 'absent',
              note: 'Anonymisation cannot be reversed by any account, and switching a tenant into Regulated-Industry mode later does not resurrect identities (AC-SA-17-07). It touches the identity-resolution layer, never audit rows.',
            }}
          />
          <ProhibitionNotice
            rendering={{
              kind: 'absent',
              note: 'No entry into a compliance-suspended tenant exists outside the dual-authorised compliance-emergency path (AC-SA-09-08) — not for Support, not for the Admin, not for the root.',
            }}
          />
          <ProhibitionNotice
            rendering={{
              kind: 'absent',
              note: 'No control here reaches inside a tenant to release a hold, reassign a run, manage a tenant user or touch an audit entry. The console roles are bound by the same sixteen prohibited acts, and the root account is bound identically (L46451).',
            }}
          />
        </div>
      </section>

      <section aria-label="Unspecified in source" className="mt-6">
        <h2 className="text-lg font-semibold">Unspecified in source</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Ten controls carry this module&rsquo;s identifier in the frozen source, and all ten are
          built above. Everything below is an affordance a reader might expect and the source does
          not define. It is named here rather than invented, because a plausible invented control
          reads back as a requirement.
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
      <RootUnavailableFreeze actions={['compliance-suspension']} />
    </SaConsoleShell>
  )
}

/* ------------------------------------------------------------------ *
 * The seven tabs. Every one of them is a read, and every one names the
 * operational action it deliberately does not carry (risk R3).
 * ------------------------------------------------------------------ */

function tabContent(tabId: DetailTabId, tenant: TenantRow) {
  const tab = DETAIL_TABS.find((t) => t.id === tabId) ?? DETAIL_TABS[0]
  return (
    <div>
      <p className="text-sm font-medium">{tab.label}</p>
      <div className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
        {tabBody(tabId, tenant)}
      </div>
      <ProhibitionNotice rendering={{ kind: 'absent', note: tab.absentAction }} />
      <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
        Visibility, not intervention (AC-SA-09-14).
      </p>
    </div>
  )
}

function tabBody(tabId: DetailTabId, tenant: TenantRow) {
  switch (tabId) {
    case 'overview':
      return (
        <p>
          Lifecycle state {tenant.state}, {tenant.tier} tier, {tenant.timeOnPlatform}. Per-tenant
          feature overrides are flags on this record and never edits to the tier record itself
          (AC-SA-11-04); the tier record and its overrides live in Tiers, Entitlements and Caps.
          Regulated-Industry mode is set at creation and shown here as configuration truth read
          from the tenant-configuration registry.
        </p>
      )
    case 'operations':
      return (
        <p>
          Counts and statuses only — the layer-one telemetry view: runs open, runs closed in the
          tenant-month, and devices reporting. No record-level operational content appears here for
          any console role, inside or outside a session, because this page is not a session
          (AC-SA-000-07, AC-SEC-801).
        </p>
      )
    case 'agents':
      return (
        <p>
          Agent posture for this tenant: how many agent definitions are enabled, how many are
          disabled, and whether an emergency pause is in force. Agent runs and their traces are not
          reachable from here; no trace-viewer screen exists at V1 (D9, DEC-SEC-020).
        </p>
      )
    case 'memory':
      return (
        <p>
          Unavailable — counts and volume only. Tenant memory content reads this way for every
          console role including the root (L97152). Memory has no export path, and an
          individual-level profile record cannot be created (AC-SA-04-05).
        </p>
      )
    case 'devices':
      return (
        <p>
          Enrolled devices and the state of any command outstanding against them, each named by its
          own state from the fifteen-state vocabulary. A device that has not been reached is shown
          as unreached with its age, never as having taken the command (AC-SA-09-10, AC-SA-13-05).
        </p>
      )
    case 'metrics':
      return (
        <p>
          {tenant.headlineUsage ?? 'Measure unavailable'} — as of {tenant.usageAsOf}. Worker-Shifts
          in the tenant-month, and nothing beneath the tenant. A missing measure is never a zero
          (FB-SA-01).
        </p>
      )
    case 'logs-and-audit':
      return (
        <p>
          The platform-side access history for this tenant: which named access class was used, when,
          by whom and against what reason. Every platform-side access also appears in the
          tenant&rsquo;s own audit stream. Entry state is committed alone (D3), and no other state
          exists by construction.
        </p>
      )
    default: {
      const exhaustive: never = tabId
      throw new Error(`Unhandled tenant detail tab: ${String(exhaustive)}`)
    }
  }
}

/* ------------------------------------------------------------------ *
 * The twelve applicable screen states. STATE-07 is frontline-only.
 * ------------------------------------------------------------------ */

const MODULE_STATE_NOTE: Record<ScreenStateId, string> = {
  'STATE-01':
    'the tenant list before the client’s platform team has created a record. No public self-signup path creates one.',
  'STATE-02':
    'the tenant list and the usage figures while they are being fetched. A count that has not arrived renders as a placeholder, never as the number nought.',
  'STATE-03': 'the list, the lifecycle table and the detail tabs below, each with its as-of stamp.',
  'STATE-04':
    'the hard-suspension confirmation, when what was typed does not match the tenant identifier.',
  'STATE-05':
    'a role without the lifecycle action meeting its control — Support meeting New Tenant, for instance.',
  'STATE-06':
    'the whole module for the Platform Engineer and Support, who see the tenant list read-only with no lifecycle control at all.',
  'STATE-07': 'nothing. Only the Frontline Worker Application has a true offline state.',
  'STATE-08':
    'a degraded usage figure, served last-known-good and stamped stale with its age (FB-SA-01).',
  'STATE-09':
    'a suspension or lock command travelling to a device, rendered by its own true state and never as having taken effect early (AC-SA-09-10).',
  'STATE-10':
    'the agent posture on a tenant’s detail page, while agent quality is degraded. Every lifecycle control is untouched.',
  'STATE-11':
    'the agent posture with every artificial-intelligence model unavailable. The module stays fully operable — the list, the lifecycle actions and the detail tabs all behave unchanged (AC-SA-000-09).',
  'STATE-12':
    'a platform audit write that failed. FB-SA-03: the action does not happen — the tenant record is unchanged.',
  'STATE-13':
    're-aggregation after a telemetry gap, with the degraded window recorded rather than smoothed over.',
}

function stateTreatment(
  stateId: ScreenStateId,
  roleId: RoleId,
  roleName: string,
  hardDecision: PermissionDecision,
) {
  switch (stateId) {
    case 'STATE-01':
      return (
        <ScreenStateBoundary
          state="STATE-01"
          surface="SURF-SA"
          detail={{
            objectLabel: 'tenants',
            whatCreatesIt:
              'The client’s platform team creates a tenant record from New Tenant, and the record enters a safe draft state. No public self-signup path exists (AC-SA-09-01).',
          }}
        />
      )
    case 'STATE-02':
      return (
        <ScreenStateBoundary
          state="STATE-02"
          surface="SURF-SA"
          detail={{ objectLabel: 'the tenant list' }}
        />
      )
    case 'STATE-03':
      return (
        <p className="text-sm text-[var(--color-ink-muted)]">
          The tenant list, the lifecycle table and the detail tabs below are the success rendering.
        </p>
      )
    case 'STATE-04':
      return (
        <ScreenStateBoundary
          state="STATE-04"
          surface="SURF-SA"
          detail={{
            fieldLabel: 'Type the tenant identifier to confirm',
            rule: 'A hard suspension carries confirmation weight proportional to its consequence: the tenant identifier is typed out in full and a reason class is chosen.',
            permittedFormat:
              'The exact tenant identifier, for example TEN-CLEARWATER, and one of the two reason classes the source recognises.',
          }}
        />
      )
    case 'STATE-05':
      if (hardDecision.outcome === 'allowed') {
        return (
          <p role="note" className="text-sm text-[var(--color-ink-muted)]">
            {roleName} holds the suspension controls, so no refusal renders for this role. Select
            the Platform Engineer or Support to see the refusal named rather than hidden behind a
            missing control.
          </p>
        )
      }
      return <ScreenStateBoundary state="STATE-05" surface="SURF-SA" detail={{ decision: hardDecision }} />
    case 'STATE-06':
      return (
        <ScreenStateBoundary
          state="STATE-06"
          surface="SURF-SA"
          detail={{
            readOnlyCause:
              roleId === 'PLATFORM_ENGINEER' || roleId === 'SUPPORT'
                ? 'The Platform Engineer sees the tenant list read-only and may not create a tenant (L52401); Support sees it read-only with no lifecycle control at all.'
                : 'The tenant detail page is read-only for every console role including the root — visibility, not intervention (AC-SA-09-14).',
          }}
        />
      )
    case 'STATE-08':
      return (
        <ScreenStateBoundary
          state="STATE-08"
          surface="SURF-SA"
          detail={{
            asOfLabel: 'as of 2026-08-16 07:37 platform time, 95 minutes old',
            originLabel: 'served last-known-good from the aggregation layer (FB-SA-01)',
          }}
        />
      )
    case 'STATE-09':
      return (
        <ScreenStateBoundary
          state="STATE-09"
          surface="SURF-SA"
          detail={{ commandState: 'queued' }}
        />
      )
    case 'STATE-10':
      return (
        <ScreenStateBoundary
          state="STATE-10"
          surface="SURF-SA"
          detail={{
            degradedMissing: 'Agent-run quality for this tenant has crossed the alert threshold.',
            degradedRemaining:
              'Every lifecycle control, the tenant list and the detail tabs behave unchanged.',
          }}
        />
      )
    case 'STATE-11':
      return (
        <ScreenStateBoundary
          state="STATE-11"
          surface="SURF-SA"
          detail={{
            unavailableCause:
              'Every platform artificial-intelligence model is unavailable. Agents are unavailable and are said to be unavailable; nothing on this module depends on a model, so the list, the lifecycle actions and the detail tabs all stay operable (AC-SA-000-09).',
          }}
        />
      )
    case 'STATE-12':
      return (
        <ScreenStateBoundary
          state="STATE-12"
          surface="SURF-SA"
          detail={{
            failureWhat: 'The platform audit write accompanying a lifecycle transition',
            wasWritten: false,
            nextStep:
              'FB-SA-03: the action does not happen. The tenant record is unchanged and the transition can be attempted again.',
          }}
        />
      )
    case 'STATE-13':
      return (
        <ScreenStateBoundary
          state="STATE-13"
          surface="SURF-SA"
          detail={{
            recoveryProgress:
              'Re-aggregating the usage window after a telemetry gap: two of three tenant-month figures recomputed, with the degraded window recorded rather than smoothed over.',
          }}
        />
      )
    case 'STATE-07':
      // Unreachable: STATE-07 is frontline-only and the selector never offers
      // it. Handled so the switch stays exhaustive over ScreenStateId rather
      // than falling through to a default that would swallow a later state.
      return (
        <p className="text-sm text-[var(--color-ink-muted)]">
          Only the Frontline Worker Application has a true offline state.
        </p>
      )
    default: {
      const exhaustive: never = stateId
      throw new Error(`Unhandled screen state: ${String(exhaustive)}`)
    }
  }
}
