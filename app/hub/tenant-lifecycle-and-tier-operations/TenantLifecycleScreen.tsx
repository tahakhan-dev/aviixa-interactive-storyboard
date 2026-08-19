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
import { roleById, type RoleId } from '@/domain/roles'
import { emptyDomainState, withTenant } from '@/domain/state'
import { scenarioRunId, tenantId } from '@/domain/ids'
import {
  TENANT_STATES,
  TENANT_WRITE_CLASSES,
  writeAllowed,
  type TenantState,
  type WriteAction,
} from '@/surfaces/doh/tenant-state'
import { DEFERRED_DOH_SCOPES } from '@/surfaces/doh/scope'
import {
  ABSENT_BY_RULE,
  ACTING_STATUSES,
  ACTIVE_SITE_COUNT,
  APPLICABLE_SCREEN_STATES,
  COMPLIANCE_SUSPENSION_MESSAGE,
  CONSUMPTION_AS_OF,
  CONSUMPTION_PERIOD,
  CONTROL_MATRIX,
  DECISIONS_ON_SCREEN,
  DOWNGRADE_REQUEST_CLASS,
  DOWNGRADE_TARGET_TIER,
  HUB_TENANT,
  INAPPLICABLE_SCREEN_STATES,
  LADDER_POSITION_LABEL,
  LADDER_THRESHOLDS,
  LOADING_PLACEHOLDER,
  PLATFORM_SUPPORT_ROUTE,
  READING_STATUSES,
  READ_VIEW_REGIONS,
  SEEDED_CONSUMPTION,
  SEEDED_TIER,
  SITE_COUNT,
  SUSPENSION_STATUS,
  TENANT_STATE_HISTORY,
  UNRESOLVED_IN_SOURCE,
  UNSPECIFIED_IN_SOURCE,
  UPGRADE_TARGET_TIER,
  UPGRADE_TIER,
  ladderPositionFor,
  rolesWithStatus,
  tierRecord,
  type ApplicableScreenStateId,
  type ControlId,
  type TierChangeState,
  type TierId,
} from './fixtures'

/**
 * MOD-DOH-01 — Tenant Lifecycle and Tier Operations, `SCR-DOH-03`.
 *
 * The module that gates the write classes of every other module in the Hub,
 * and renders the tenant its own commercial and compliance position,
 * read-only. MOD-DOH-01 owns exactly one object, the tenant state; every
 * other record on this screen — Tenant, Tier, Usage Ledger, Pilot — belongs
 * to the platform console and is read here and nowhere written.
 *
 * THE ONE RULE THAT SHAPES THIS FILE: the tenant state gate is one data
 * table. Every write control below asks `writeAllowed` and renders what it
 * says. No conditional anywhere in MOD-DOH-01 re-derives a suspension rule —
 * including the policy evaluator's own suspension stage, which is why the
 * seeded partition below stays ACTIVE (see `FIXTURE_STATE`).
 */
const MODULE = dohModuleById('MOD-DOH-01')

const HUB_TENANT_ID = tenantId(HUB_TENANT.id)

/**
 * The seeded domain state the policy evaluator reads. Its lifecycle state is
 * ACTIVE and stays ACTIVE deliberately: the evaluator carries a suspension
 * stage of its own, and letting the reviewer's tenant-state control drive it
 * would put the same rule in two places — the exact duplication MOD-DOH-01
 * exists to prevent. Roles are decided here; tenant state is decided by
 * `writeAllowed`, and the two never overlap.
 */
const FIXTURE_STATE = withTenant(
  emptyDomainState(scenarioRunId('DOH-MOD-01-STORYBOARD')),
  HUB_TENANT_ID,
  () => ({
    displayName: HUB_TENANT.name,
    lifecycleState: 'ACTIVE' as const,
    desiredFeatureValues: {},
    tier: SEEDED_TIER,
    objects: {},
  }),
)

const WRITE_CLASS_NOTE = new Map(TENANT_WRITE_CLASSES.map((row) => [row.state, row.note]))

const TENANT_STATE_TONE: Record<TenantState, StatusTone> = {
  active: 'ok',
  'soft-suspended': 'attention',
  'hard-suspended': 'attention',
  'compliance-suspended': 'blocked',
  archived: 'neutral',
}

const SCREEN_STATE_OPTIONS = APPLICABLE_SCREEN_STATES.map((id) => ({
  value: id,
  label: `${id} — ${screenState(id).name}`,
}))

const TENANT_STATE_OPTIONS = TENANT_STATES.map((s) => ({ value: s, label: s }))

/** D7's own sentence for a Hub write meeting a lost connection (L27004). */
const CONNECTION_LOST_REASON =
  'The connection to this workspace’s own records is lost. The tier and usage view degrades to the last loaded figures with a freshness marker, and the upgrade and downgrade-request controls disable rather than queue. Nothing on this surface ever queues a write, because a queued write is an action with no audit entry (D7).'

/** The ladder bar runs to 150 per cent of the ceiling, so the 125 mark and
 *  the band above it both have somewhere to sit. */
const LADDER_SCALE_MAX = 150

function scalePercent(value: number): string {
  return `${Math.min(value, LADDER_SCALE_MAX) * (100 / LADDER_SCALE_MAX)}%`
}

/** Deterministic thousands separators. No `Intl`, no locale to drift. */
function formatCount(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function contextFor(roleId: RoleId) {
  return {
    state: FIXTURE_STATE,
    identity: {
      signedIn: true,
      role: roleId,
      // A tenant-domain role holds its own tenant ambiently; the Hub is
      // that tenant's own surface, and nothing here reaches another one.
      tenant: HUB_TENANT_ID,
      siteScope: SITE_COUNT.filter((s) => s.active).map((s) => s.id),
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

/**
 * Every affordance on this screen is decided per control, by the allowed
 * roles its own row of the twelve-row matrix carries — never by the module
 * card's `roles_allowed` list, which names the roles the module TOUCHES and
 * not the roles that can open the screen. One census reader read that row as
 * an access list; the erratum is recorded in the unresolved panel below.
 */
function decide(
  roleId: RoleId,
  action: string,
  controlId: ControlId,
  statuses: readonly ('Allowed' | 'Allowed with conditions' | 'Read-only')[],
  sourceRefs: readonly string[],
): PermissionDecision {
  return evaluateAccess(
    { action, allowedRoles: rolesWithStatus(controlId, statuses), sourceRefs },
    contextFor(roleId),
  )
}

export function TenantLifecycleScreen() {
  const [role, setRole] = useState<TenantRoleId>('TENANT_ADMIN')
  const [tenantState, setTenantState] = useState<TenantState>('active')
  const [stateId, setStateId] = useState<ApplicableScreenStateId>('STATE-03')
  const [pilot, setPilot] = useState(false)
  const [auditWillFail, setAuditWillFail] = useState(false)
  const [tier, setTier] = useState<TierId>(SEEDED_TIER)
  const [tierChange, setTierChange] = useState<TierChangeState>('none')
  const [outcome, setOutcome] = useState<'upgraded' | 'requested' | 'audit-failed' | null>(null)

  const roleName = roleById(role).name
  const definition = screenState(stateId)

  // D7: the three states a lost connection can leave this screen in. The
  // reviewer picks the screen state and the connection follows from it,
  // rather than the two drifting apart as separate controls.
  const connectionLost = stateId === 'STATE-08' || stateId === 'STATE-12' || stateId === 'STATE-13'
  const loading = stateId === 'STATE-02'

  const record = tierRecord(tier)
  const percentOfCeiling = (SEEDED_CONSUMPTION / record.ceiling) * 100
  const ladder = ladderPositionFor(percentOfCeiling)

  const readDecision = decide(
    role,
    'open-tier-and-usage-read-view',
    'view-tier-and-consumption',
    READING_STATUSES,
    ['L26885', 'L48097'],
  )
  const upgradeDecision = decide(role, 'request-tier-upgrade', 'request-tier-upgrade', ACTING_STATUSES, [
    'L26890',
    'AC-DOH-01-2 L27040',
  ])
  const downgradeDecision = decide(
    role,
    'request-tier-downgrade',
    'request-tier-downgrade',
    ACTING_STATUSES,
    ['L26891'],
  )
  const historyDecision = decide(
    role,
    'read-tenant-state-history',
    'read-tenant-state-history',
    READING_STATUSES,
    ['L26896'],
  )

  /**
   * The tenant state gate, applied BEFORE any write control renders, then
   * D7's connection rule. One `writeAllowed` call, one table row, no second
   * derivation.
   */
  function gateReason(action: WriteAction): string | null {
    if (!writeAllowed(tenantState, action)) {
      return `Blocked while this workspace is ${tenantState}. ${WRITE_CLASS_NOTE.get(tenantState) ?? ''} Route out: ${PLATFORM_SUPPORT_ROUTE}. The refusal is one row of the write-class table, read before this control rendered.`
    }
    if (connectionLost) return CONNECTION_LOST_REASON
    return null
  }

  function upgradeReason(): string | null {
    const gate = gateReason(UPGRADE_TIER)
    if (gate !== null) return gate
    if (tier === UPGRADE_TARGET_TIER) {
      return `This workspace is already on the ${tierRecord(UPGRADE_TARGET_TIER).name} tier, the highest the seeded ladder carries, so there is no step up to request. The source names no tier picker on this screen at all.`
    }
    return null
  }

  function downgradeReason(): string | null {
    const gate = gateReason(DOWNGRADE_REQUEST_CLASS)
    if (gate !== null) return gate
    if (tierChange === 'pending_downgrade') {
      return 'A downgrade request is already recorded against this workspace and is waiting on the client platform team. The source defines no control for cancelling or withdrawing one.'
    }
    return null
  }

  function requestUpgrade(): void {
    if (auditWillFail) {
      setOutcome('audit-failed')
      return
    }
    setTier(UPGRADE_TARGET_TIER)
    setOutcome('upgraded')
  }

  function requestDowngrade(): void {
    if (auditWillFail) {
      setOutcome('audit-failed')
      return
    }
    setTierChange('pending_downgrade')
    setOutcome('requested')
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

  const historyRows: readonly TableRow[] = TENANT_STATE_HISTORY.map((h) => ({
    at: h.at,
    from: h.from,
    to: h.to,
    cause: h.cause,
    actor: h.actor,
  }))

  /* Reviewer chrome. Not product chrome, and it says so: no tenant role
     holds a control that changes a suspension state, so this selector
     stands in for the client platform team's act, elsewhere. */
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
            if (next !== undefined) setTenantState(next)
          }}
        />
        <Select
          label="Screen state"
          value={stateId}
          options={SCREEN_STATE_OPTIONS}
          onChange={(value) => {
            const next = APPLICABLE_SCREEN_STATES.find((s) => s === value)
            if (next !== undefined) setStateId(next)
          }}
        />
        <Checkbox label="Pilot tenant" checked={pilot} onChange={setPilot} />
        <Checkbox
          label="Simulate an audit-write failure on the next request"
          checked={auditWillFail}
          onChange={setAuditWillFail}
        />
      </div>
      <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
        These four re-render seeded fixtures. They perform no product action and change no business
        state. Changing a suspension state is explicitly prohibited for all five tenant roles, so no
        product control for it exists anywhere in this workspace — this selector stands in for the
        client platform team&rsquo;s act, taken on another surface entirely.
      </p>
      {pilot ? (
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink)]">
          Pilot flag set. It is an orthogonal flag on top of whichever of the five states is
          selected, never a sixth state, and it changes no gate above: a pilot workspace is
          functionally identical to a paying one (D19).
        </p>
      ) : null}
    </section>
  )

  const annotation = (
    <p className="text-xs text-[var(--color-ink-subtle)]">
      Screen annotation only, never a route key (D1): SCR-DOH-03, the tier and usage read view, in
      the canonical catalogue. The suspension status panel below is a REGION of this screen and not
      a route of its own — the two source catalogues disagree about it, one carrying it as a screen
      and the other folding it away, so this build keys no route on either answer. Storyboard
      SB-DOH-013, control matrix L26883-L26896.
    </p>
  )

  if (!permitsRead(readDecision)) {
    return (
      <HubShell module={MODULE} role={role} onRoleChange={setRole} tenantState={tenantState}>
        {annotation}
        <section aria-label="Permission denied" className="mt-6">
          <h2 className="text-lg font-semibold">This module is not offered to {roleName}</h2>
          <div className="mt-3">
            <ScreenStateBoundary
              state="STATE-05"
              surface="SURF-DOH"
              detail={{ decision: readDecision }}
            />
          </div>
          <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
            The module rail does not offer this route to {roleName}, so nothing here is hidden
            behind a missing button — this is what a deep link meets. The roles that do carry the
            read are the Tenant Admin and the Read-only Auditor; ask a Tenant Admin, through this
            workspace&rsquo;s own users, roles and scopes screen, to be told what the tier position
            is.
          </p>
          <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
            The attempt is audited. A refused attempt is written to this workspace&rsquo;s own audit
            stream in the same transaction as the refusal, so a reader of that stream sees who tried
            and was turned away — never only who succeeded.
          </p>
          <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
            Nine permission tokens govern this refusal, not six (D8). This one is{' '}
            {readDecision.outcome}, stage {readDecision.stage}, and it carries an explicit reason
            rather than a blank cell.
          </p>
        </section>
        <div className="mt-6">{scenarioControls}</div>
      </HubShell>
    )
  }

  return (
    <HubShell module={MODULE} role={role} onRoleChange={setRole} tenantState={tenantState}>
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
          On MOD-DOH-01: {MODULE_STATE_NOTE[stateId]}
        </p>
        <div className="mt-3">{stateTreatment(stateId, readDecision, roleName)}</div>
      </section>

      <section aria-label="Tier and usage read view" className="mt-6">
        <h2 className="text-lg font-semibold">Tier and usage — {HUB_TENANT.label}</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The five regions below run in the order the source fixes them, and they are the whole of
          this screen&rsquo;s content.
        </p>
        <div className="mt-3">
          <Banner
            tone="info"
            heading="Read-only"
            body="This workspace’s own position is rendered read-only for every role that can open this screen, the Tenant Admin included. Nothing in the five regions below can be edited here, and no control changes the tier record, the ceiling, the thresholds or the suspension state. The two tier requests further down are this module’s only writes, and each is gated before it renders."
          />
        </div>

        <section aria-label={READ_VIEW_REGIONS[0]} className="mt-5">
          <h3 className="font-medium">1. {READ_VIEW_REGIONS[0]}</h3>
          <p className="mt-1 max-w-prose text-sm text-[var(--color-ink)]">
            {record.meterDefinition}
          </p>
          <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
            Quoted verbatim from the {record.name} tier record, not paraphrased — a meter a reader
            cannot check the definition of is a number they cannot argue with. {record.entitlementNote}
          </p>
          <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
            A Worker-Shift is a billing unit on a commercial ledger. Nothing in MOD-DOH-01 is grouped
            by a worker, measured against a worker, or compared between workers, in any state.
          </p>
        </section>

        <section aria-label={READ_VIEW_REGIONS[1]} className="mt-5">
          <h3 className="font-medium">2. {READ_VIEW_REGIONS[1]}</h3>
          {loading ? (
            <>
              <p className="mt-1 text-sm text-[var(--color-ink)]">
                Consumption: {LOADING_PLACEHOLDER}
              </p>
              <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
                A count that has not arrived is a placeholder, never the number nought — a bar
                painted at nought before the figure lands reads as &ldquo;you have used
                nothing&rdquo;, which is a different and much more comfortable claim than the truth.
              </p>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                Ceiling for the {record.name} tier: {formatCount(record.ceiling)} Worker-Shifts.
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm text-[var(--color-ink)]">
                {formatCount(SEEDED_CONSUMPTION)} of {formatCount(record.ceiling)} Worker-Shifts
                consumed in {CONSUMPTION_PERIOD} — {Math.round(percentOfCeiling)} per cent of the{' '}
                {record.name} ceiling.
              </p>
              <div
                className="mt-2 h-4 w-full rounded-full bg-[var(--color-surface-sunken)]"
                aria-hidden="true"
              >
                <div
                  data-consumption-bar="true"
                  className="h-4 rounded-full bg-[var(--color-primary)]"
                  style={{ width: `${Math.min(percentOfCeiling, 100)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
                Data as of {CONSUMPTION_AS_OF}. The bar draws nothing the sentence above does not
                already say, so no fact here depends on seeing it.
              </p>
            </>
          )}
          <div className="mt-3">
            <SeamNotice seamId="worker-shift-meter" />
          </div>
          <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
            MOD-DOH-01 ships the meter as a state machine over the seeded figure above. Its live
            inputs are assignment events another slice owns, named in the seam rather than stubbed
            silently inside this file.
          </p>
        </section>

        <section aria-label={READ_VIEW_REGIONS[2]} className="mt-5">
          <h3 className="font-medium">3. {READ_VIEW_REGIONS[2]}</h3>
          <p className="mt-1 text-sm text-[var(--color-ink)]">
            <StatusPill
              tone={ladder === 'above_125_flagged' ? 'blocked' : 'info'}
              icon="▲"
              label={ladder}
            />{' '}
            {LADDER_POSITION_LABEL[ladder]}
          </p>
          <div
            className="relative mt-2 h-5 w-full rounded bg-[var(--color-surface-sunken)]"
            aria-hidden="true"
          >
            <div
              data-burst-band="true"
              className="absolute inset-y-0 bg-[var(--color-status-attention)]/25"
              style={{ left: scalePercent(100), width: scalePercent(25) }}
            />
            {LADDER_THRESHOLDS.map((t) => (
              <div
                key={t.percent}
                className="absolute inset-y-0 w-px bg-[var(--color-ink)]"
                style={{ left: scalePercent(t.percent) }}
              />
            ))}
            <div
              className="absolute inset-y-0 w-1 bg-[var(--color-primary)]"
              style={{ left: scalePercent(percentOfCeiling) }}
            />
          </div>
          <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
            {LADDER_THRESHOLDS.map((t) => (
              <li key={t.percent}>
                <span className="font-medium text-[var(--color-ink)]">{t.label}</span> — {t.meaning}
              </li>
            ))}
          </ul>
          <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
            The burst band is the shaded stretch between the ceiling and 125 per cent of it. The
            three thresholds are read values: they are set per tenant on the platform console, and no
            control beside them here proposes, edits or requests a change.
          </p>
        </section>

        <section aria-label={READ_VIEW_REGIONS[3]} className="mt-5">
          <h3 className="font-medium">4. {READ_VIEW_REGIONS[3]}</h3>
          <p className="mt-1 text-sm text-[var(--color-ink)]">
            {ACTIVE_SITE_COUNT} active of {SITE_COUNT.length} recorded — Site level only.
          </p>
          <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
            {SITE_COUNT.map((s) => (
              <li key={s.id}>
                <span className="font-medium text-[var(--color-ink)]">{s.name}</span> —{' '}
                {s.active ? 'active' : 'archived'}. {s.note}
              </li>
            ))}
          </ul>
          <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
            Counted at Site level only, which is what the source counts. Cell, Job and worker
            scoping ({DEFERRED_DOH_SCOPES.join(', ')}) is deferred beyond this version and no rule
            may depend on it, so nothing for it is drawn here at all — not even disabled, because a
            disabled control implies a roadmap promise the source has not made.
          </p>
        </section>

        <section aria-label={READ_VIEW_REGIONS[4]} className="mt-5">
          <h3 className="font-medium">5. {READ_VIEW_REGIONS[4]}</h3>
          <p className="mt-1 text-sm">
            <StatusPill tone={TENANT_STATE_TONE[tenantState]} icon="●" label={tenantState} />
            {pilot ? (
              <>
                {' '}
                <StatusPill tone="info" icon="◆" label="pilot" />
              </>
            ) : null}
          </p>
          <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
            {SUSPENSION_STATUS[tenantState].whatItMeansHere}
          </p>
          <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
            Who changes it: {SUSPENSION_STATUS[tenantState].whoChangesIt}
          </p>
          {tenantState === 'compliance-suspended' ? (
            <p className="mt-2 max-w-prose text-sm text-[var(--color-ink)]">
              The message the worker meets on the device, quoted and unrewordable:{' '}
              <span className="font-medium">&ldquo;{COMPLIANCE_SUSPENSION_MESSAGE}&rdquo;</span> Its
              third sentence is the only actionable instruction in it, which is why the shorter
              wording that drops it is not an equivalent (D17).
            </p>
          ) : null}
          <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
            Five operating states, and pilot is a flag across them rather than a sixth (D19). The
            two states the platform console owns — draft and awaiting-administrator — never render
            here, because in draft no user can authenticate and so no Hub screen exists to show one.
          </p>
        </section>
      </section>

      <section aria-label="Tier requests" className="mt-6">
        <h2 className="text-lg font-semibold">Tier requests</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The module&rsquo;s only two writes. Each one asks the write-class table first, then the
          connection, then its own condition — in that order, and before the control renders.
        </p>

        <div className="mt-4 space-y-5">
          <div>
            <p className="text-sm font-medium">Request a tier upgrade</p>
            {permitsAction(upgradeDecision) ? (
              (() => {
                const reason = upgradeReason()
                return reason === null ? (
                  <Button onClick={requestUpgrade}>Request a tier upgrade</Button>
                ) : (
                  <Button disabledReason={reason}>Request a tier upgrade</Button>
                )
              })()
            ) : (
              <ProhibitionNotice
                rendering={{
                  kind: 'absent',
                  note: `No upgrade control is drawn for the ${roleName}. The source marks it explicitly prohibited for this role, and the ${roleName} is an actionless role by definition — reading tenant-wide records and taking no action at all — so the control is absent rather than inert. The competing reading, that a control the Tenant Admin holds on this same screen should render disabled with its reason, is recorded in the unresolved panel rather than settled in silence.`,
                }}
              />
            )}
            <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
              Self-service and effective immediately for the Tenant Admin. Consumption carries
              forward across the change and never resets, so an upgrade buys headroom rather than a
              fresh count. A tier upgrade is blocked under soft suspension (D15): letting a workspace
              that has not paid for thirty days self-service a higher ceiling is the riskier default,
              and the source instructs the stricter reading wherever tenant-state governance is
              ambiguous. The counter-argument is real — soft suspension leaves operations running in
              full, and an upgrade is arguably operating rather than growing — so this is a coin-flip
              the client should settle rather than inherit.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium">Request a tier downgrade</p>
            {permitsAction(downgradeDecision) ? (
              (() => {
                const reason = downgradeReason()
                return reason === null ? (
                  <Button variant="secondary" onClick={requestDowngrade}>
                    Request a tier downgrade
                  </Button>
                ) : (
                  <Button disabledReason={reason}>Request a tier downgrade</Button>
                )
              })()
            ) : (
              <ProhibitionNotice
                rendering={{
                  kind: 'absent',
                  note: `No downgrade-request control is drawn for the ${roleName}, for the same reason as the upgrade above: explicitly prohibited for this role, and the ${roleName} takes no action at all.`,
                }}
              />
            )}
            <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
              Allowed with conditions: it records a request against{' '}
              {tierRecord(DOWNGRADE_TARGET_TIER).name} and nothing more. Execution belongs to the
              client platform team, so the outcome renders as a recorded request in its true state
              and never as a completed downgrade. The write-class enumerations name no downgrade
              request at all; it is gated on the configuration-edit class the source does name, under
              the same stricter reading — a mapping stated here rather than a row added to the
              table.
            </p>
          </div>

          <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
            <span className="font-medium text-[var(--color-ink)]">Tier-change state: </span>
            <StatusPill
              tone={tierChange === 'pending_downgrade' ? 'stale' : 'neutral'}
              icon="◇"
              label={tierChange}
            />
          </p>

          <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
            Audit is written in the same transaction as the action. If the audit write fails, the
            action fails with it and this screen says the action did not happen — an accepted action
            is never rendered as done ahead of its true state.
          </p>

          {outcome !== null ? (
            <p
              role="status"
              className="max-w-prose rounded-[var(--radius-control)] border border-[var(--color-border)] p-3 text-sm text-[var(--color-ink)]"
            >
              {outcome === 'audit-failed'
                ? 'The action did not happen. The audit write failed, and because audit is in the same transaction as the action, the transaction rolled back with it: the tier record is unchanged, no request was recorded, and nothing was written. Try again once the audit path is healthy.'
                : outcome === 'upgraded'
                  ? `Upgraded to ${record.name} in this storyboard run. The consumption figure is untouched at ${formatCount(SEEDED_CONSUMPTION)} Worker-Shifts — it carries forward and never resets — and only the ceiling moved. No commercial system was contacted: this storyboard reaches nothing, and in the built platform the change and its audit entry commit together.`
                  : `Recorded as a request against the ${tierRecord(DOWNGRADE_TARGET_TIER).name} tier. It is not executed and this screen does not render it as executed: the tier-change state is pending_downgrade, and the client platform team acts on it elsewhere.`}
            </p>
          ) : null}
        </div>
      </section>

      <section aria-label="Control matrix" className="mt-6">
        <h2 className="text-lg font-semibold">What each of the five tenant roles sees</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Twelve controls, five roles, and an explicit status in every cell — a blank cell is an
          unanswered question an implementer would answer privately. Visibility above is driven from
          this table alone. The module card&rsquo;s roles-allowed row names all five roles, which
          means the roles the module touches and not the roles that can open the screen.
        </p>
        <div className="mt-3">
          <Table
            caption="MOD-DOH-01 control matrix, by tenant role"
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
      </section>

      <section aria-label="Tenant state history" className="mt-6">
        <h2 className="text-lg font-semibold">Tenant state history</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Every transition of this workspace&rsquo;s own state, read through its audit records.
          Read-only for the Tenant Admin and the Read-only Auditor, and there is no edit, annotate,
          suppress or delete control on any row for any role.
        </p>
        {permitsRead(historyDecision) ? (
          <div className="mt-3">
            <Table
              caption="tenant_state_history, read through the workspace’s own audit records"
              columns={[
                { key: 'at', header: 'When' },
                { key: 'from', header: 'From' },
                { key: 'to', header: 'To' },
                { key: 'cause', header: 'What caused it' },
                { key: 'actor', header: 'Recorded actor' },
              ]}
              rows={historyRows}
              emptyState={{
                title: 'This workspace has recorded no state transition.',
                whatCreatesIt: 'A transition is written when the client platform team makes one.',
              }}
            />
          </div>
        ) : null}
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          One audit truth per tenant (D14). These rows are a seeded fixture of the workspace&rsquo;s
          own audit records, not a second store built to make this slice self-contained; the audit
          store itself is built in a later slice, and building a private copy here would stay
          invisible until the two had to be reconciled. Every recorded actor is a team or an
          automatic trigger — a commercial transition is never a measure of a person.
        </p>
      </section>

      <section aria-label="Absent by rule" className="mt-6">
        <h2 className="text-lg font-semibold">Absent by rule</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Nothing is drawn where each of these would sit — only the note saying why. An inert control
          would imply that an enabled state exists for somebody, and for these it does not.
        </p>
        <div className="mt-2 space-y-3">
          {ABSENT_BY_RULE.map((item) => (
            <div key={item.label} className="text-sm text-[var(--color-ink-muted)]">
              <p className="font-medium text-[var(--color-ink)]">{item.label}</p>
              <ProhibitionNotice rendering={{ kind: 'absent', note: item.note }} />
            </div>
          ))}
        </div>
      </section>

      <section aria-label="States that never render here" className="mt-6">
        <h2 className="text-lg font-semibold">States that never render here</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Five of the thirteen screen states cannot occur on MOD-DOH-01. They are named with their
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
          requirement.
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

/* ------------------------------------------------------------------ *
 * The eight applicable screen states. STATE-01, 07, 09, 10 and 11 never
 * occur here and are named, with their reasons, in their own panel.
 * ------------------------------------------------------------------ */

const MODULE_STATE_NOTE: Record<ApplicableScreenStateId, string> = {
  'STATE-02':
    'the consumption figure while it is being fetched. It renders as a placeholder and never as the number nought, because a bar painted at nought reads as “you have used nothing”.',
  'STATE-03': 'the five regions above, each with the moment its figure was true.',
  'STATE-04': 'the two tier requests only. Nothing in the read view can be typed into, so nothing in it can be invalid.',
  'STATE-05':
    'a role without the read meeting this route by deep link — the Supervisor and the Quality Manager. The rail never offers it to them.',
  'STATE-06':
    'the standing state of this whole screen for every role that can open it. The one banner naming its cause sits above the five regions.',
  'STATE-08':
    'the last loaded figures with a freshness marker and an as-of time, after the connection drops. Both write controls disable rather than queue.',
  'STATE-12':
    'a read that failed outright, naming what failed and whether anything was written. Both write controls disable rather than queue.',
  'STATE-13':
    'reconnection. The tenant state is refetched before any write control is re-enabled, so a write is never re-offered against a state that may have changed while the connection was down.',
}

function stateTreatment(
  stateId: ApplicableScreenStateId,
  readDecision: PermissionDecision,
  roleName: string,
) {
  switch (stateId) {
    case 'STATE-02':
      return (
        <ScreenStateBoundary
          state="STATE-02"
          surface="SURF-DOH"
          detail={{ objectLabel: 'the current-period consumption figure' }}
        />
      )
    case 'STATE-03':
      return (
        <p className="text-sm text-[var(--color-ink-muted)]">
          The five regions above are the success rendering, each carrying the moment it was true.
        </p>
      )
    case 'STATE-04':
      return (
        <ScreenStateBoundary
          state="STATE-04"
          surface="SURF-DOH"
          detail={{
            fieldLabel: 'Tier request',
            rule: 'A tier request must name a tier this workspace is not already on.',
            permittedFormat:
              'One step up the seeded ladder for an upgrade, one step down for a downgrade request. The source names no tier picker on this screen, so no other value can be offered.',
          }}
        />
      )
    case 'STATE-05':
      if (permitsRead(readDecision)) {
        return (
          <p role="note" className="text-sm text-[var(--color-ink-muted)]">
            {roleName} carries the read, so no refusal renders for this view. Select the Supervisor
            or the Quality Manager to see the refusal named rather than hidden behind a route that
            simply is not there.
          </p>
        )
      }
      return (
        <ScreenStateBoundary state="STATE-05" surface="SURF-DOH" detail={{ decision: readDecision }} />
      )
    case 'STATE-06':
      return (
        <p className="text-sm text-[var(--color-ink-muted)]">
          This is the standing state of the screen. Its cause is named once, in the banner above the
          five regions: this workspace&rsquo;s own position is rendered read-only. One banner, one
          cause — it is not restated here.
        </p>
      )
    case 'STATE-08':
      return (
        <ScreenStateBoundary
          state="STATE-08"
          surface="SURF-DOH"
          detail={{
            asOfLabel: `as of ${CONSUMPTION_AS_OF}`,
            originLabel:
              'the last figures loaded before the connection dropped, degraded rather than blanked, with every write control disabled rather than queued',
          }}
        />
      )
    case 'STATE-12':
      return (
        <ScreenStateBoundary
          state="STATE-12"
          surface="SURF-DOH"
          detail={{
            failureWhat: 'The read of this workspace’s tier, consumption and suspension status',
            wasWritten: false,
            nextStep:
              'The figures above are the last that loaded. Both tier requests are disabled rather than queued while the connection is down, so nothing is waiting to be sent.',
          }}
        />
      )
    case 'STATE-13':
      return (
        <ScreenStateBoundary
          state="STATE-13"
          surface="SURF-DOH"
          detail={{
            recoveryProgress:
              'Reconnected. The tenant state is being refetched BEFORE any write control is re-enabled — a write offered against a stale suspension state is a write the gate never actually saw. The figures above stay marked as the last loaded until the refetch lands.',
          }}
        />
      )
    default: {
      const exhaustive: never = stateId
      throw new Error(`Unhandled screen state on MOD-DOH-01: ${String(exhaustive)}`)
    }
  }
}
