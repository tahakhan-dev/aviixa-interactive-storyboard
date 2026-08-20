'use client'

import { useState } from 'react'
import { HubShell, endSessionRefusalFor, type TenantRoleId } from '../HubShell'
import { dohModuleById } from '@/surfaces/doh/modules'
import { SeamNotice } from '@/ui/doh/SeamNotice'
import { BannerRegion } from '@/ui/doh/BannerRegion'
import { TENANT_STATE_OPTIONS } from '@/ui/doh/tenant-state-vocabulary'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import {
  Banner,
  Button,
  Checkbox,
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
import { roleById, type RoleId } from '@/domain/roles'
import { emptyDomainState, withTenant } from '@/domain/state'
import { scenarioRunId, tenantId } from '@/domain/ids'
import { TENANT_STATES, type TenantState } from '@/surfaces/doh/tenant-state'
import type { SaAccessClassId } from '@/surfaces/sa/access-classes'
import {
  ABSENT_BY_RULE,
  ACCESS_CLASS_PANELS,
  ACTING_STATUSES,
  ANNOUNCEMENT_WINDOW,
  APPLICABLE_SCREEN_STATES,
  AUDIT_FAILURE_COPY,
  BANNER_TEXT_FORM,
  CONTROL_MATRIX,
  DECISIONS_ON_SCREEN,
  DISPUTED_ATTRIBUTIONS,
  END_SESSION_SIMULATION_COPY,
  EXTEND_TIME_BOX_REASON,
  HISTORY_INTRO_COPY,
  INAPPLICABLE_SCREEN_STATES,
  NO_HISTORY_FILTERS,
  READING_STATUSES,
  SCREEN_ANNOUNCEMENTS,
  SEEDED_ACCESS_HISTORY,
  SEEDED_POST_SESSION_REPORT,
  SESSION_STATE_LABEL,
  UNREACHABLE_FROM_THE_HUB,
  UNRESOLVED_IN_SOURCE,
  UNSPECIFIED_IN_SOURCE,
  accessClassDescription,
  filterHistory,
  historyDates,
  rolesWithStatus,
  screenAccessBanners,
  type ApplicableScreenStateId,
  type ControlStatus,
  type HistoryFilterState,
  type PlatformAdminControlId,
  type SupportSessionState,
} from './fixtures'

/**
 * MOD-DOH-13 — Tenant View of Platform Administration, `SCR-DOH-22`, plus the
 * post-session report panel `SCR-DOH-PAH-02` rendered as a REGION of this
 * screen rather than as a route of its own.
 *
 * The module owns no business object: a filtered projection of the tenant's
 * own audit records, plus exactly one command. Every affordance is decided per
 * control through `evaluateAccess` over MOD-DOH-13's own ten-row matrix, and
 * two roles this module withholds its table from still meet its banner — which
 * is the whole reason affordances here are per control and never per module.
 */
const MODULE = dohModuleById('MOD-DOH-13')

const HUB_TENANT_ID = tenantId('TEN-BRIGHTBIKES')

const FIXTURE_STATE = withTenant(
  emptyDomainState(scenarioRunId('DOH-MOD-13-STORYBOARD')),
  HUB_TENANT_ID,
  () => ({
    displayName: 'Bright Bikes',
    lifecycleState: 'ACTIVE' as const,
    desiredFeatureValues: {},
    tier: 'growth',
    objects: {},
  }),
)

const STATUS_LABEL: Record<ControlStatus, string> = {
  allowed: 'Allowed',
  'allowed-with-conditions': 'Allowed with conditions',
  'read-only': 'Read-only',
  'explicitly-prohibited': 'Explicitly prohibited',
  'not-applicable': 'Not applicable',
  unavailable: 'Unavailable',
}

const SESSION_STATE_TONE: Record<SupportSessionState, StatusTone> = {
  open: 'attention',
  ended_by_time_box: 'neutral',
  ended_by_tenant: 'ok',
  ended_by_engineer: 'neutral',
}

const SCREEN_STATE_OPTIONS = APPLICABLE_SCREEN_STATES.map((id) => ({
  value: id,
  label: `${id} — ${screenState(id).name}`,
}))

const EVERY_CLASS = 'every-class'
const EVERY_DATE = 'every-date'

/** D7's own sentence for this module's one write. */
const CONNECTION_LOST_REASON =
  'The connection to this workspace’s own records is lost. The banner still renders, from the last loaded state with a freshness marker, because visibility is the guarantee — but End session is a WRITE, so it disables rather than queues. A queued termination is a control the tenant believes it has pressed. The session’s own platform-side time box remains the bound throughout, and it expires regardless of anything this workspace can or cannot do.'

function contextFor(roleId: RoleId) {
  return {
    state: FIXTURE_STATE,
    identity: {
      signedIn: true,
      role: roleId,
      tenant: HUB_TENANT_ID,
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

function decide(
  roleId: RoleId,
  action: string,
  controlId: PlatformAdminControlId,
  statuses: readonly ControlStatus[],
  sourceRefs: readonly string[],
): PermissionDecision {
  return evaluateAccess(
    { action, allowedRoles: rolesWithStatus(controlId, statuses), sourceRefs },
    contextFor(roleId),
  )
}

export function PlatformAdministrationScreen() {
  const [role, setRole] = useState<TenantRoleId>('TENANT_ADMIN')
  const [tenantState, setTenantState] = useState<TenantState>('active')
  const [stateId, setStateId] = useState<ApplicableScreenStateId>('STATE-03')
  const [filters, setFilters] = useState<HistoryFilterState>(NO_HISTORY_FILTERS)
  const [endedClasses, setEndedClasses] = useState<readonly SaAccessClassId[]>([])
  const [auditWillFail, setAuditWillFail] = useState(false)
  const [outcome, setOutcome] = useState<'ended' | 'audit-failed' | null>(null)

  const roleName = roleById(role).name
  const definition = screenState(stateId)

  const connectionLost = stateId === 'STATE-08' || stateId === 'STATE-12' || stateId === 'STATE-13'
  const loading = stateId === 'STATE-02'
  const readFailed = stateId === 'STATE-12'
  const noAccessEverOccurred = stateId === 'STATE-01'

  const historyDecision = decide(
    role,
    'view-platform-access-history',
    'view-platform-access-history',
    READING_STATUSES,
    ['L29197', 'FUNC-DOH-13-1.1.1 L29222', 'SB-DOH-025 L29274'],
  )
  const bannerDecision = decide(
    role,
    'see-the-support-session-banner',
    'see-the-support-session-banner',
    READING_STATUSES,
    ['L29198', 'AC-DOH-13-2'],
  )
  const endSessionDecision = decide(
    role,
    'end-a-support-session-from-the-banner',
    'end-a-support-session-from-the-banner',
    ACTING_STATUSES,
    ['L29199', 'AC-DOH-13-3', 'FUNC-DOH-13-2.1.2 L29228'],
  )
  const announcementDecision = decide(
    role,
    'see-a-platform-announcement',
    'see-a-platform-announcement',
    READING_STATUSES,
    ['L29200', 'AC-DOH-13-6'],
  )
  const reportDecision = decide(
    role,
    'receive-the-post-session-report',
    'receive-the-post-session-report',
    READING_STATUSES,
    ['L29205', 'AC-DOH-13-5', 'SCR-DOH-PAH-02 L14853'],
  )

  const supportEnded = endedClasses.includes('normal-support-session')
  const supportSessionState: SupportSessionState = supportEnded ? 'ended_by_tenant' : 'open'

  const historyRowsAll = noAccessEverOccurred ? [] : SEEDED_ACCESS_HISTORY
  const historyRows = filterHistory(historyRowsAll, filters)

  /**
   * THE TENANT STATE GATE, applied BEFORE the one write control renders, then
   * D7's connection rule. One `writeAllowed` call against the ONE table; no
   * conditional here re-derives a suspension rule.
   */
  function endSessionReason(): string | null {
    /* The tenant-state half is the SHELL's, and there is one of it. Every Hub
       route inherits the same refusal for the same control from the same
       lookup in the one write-class table; this route composes its own two
       further conditions on top rather than restating the first. */
    const gated = endSessionRefusalFor(tenantState)
    if (gated !== null) return gated
    if (connectionLost) return CONNECTION_LOST_REASON
    if (supportEnded) {
      return 'This session has already ended in this storyboard run. The source defines no re-open control for a terminated session, and none is drawn.'
    }
    return null
  }

  /**
   * EXACTLY ONE End-session control exists on this screen, and which of two
   * places draws it depends on whether the gate lets it act.
   *
   * `BannerRegion` holds no policy — correctly, since a component that decided
   * who may act would be deciding something only the enforcement layer may —
   * so the End-session control it draws is always live. The banner union has
   * no arm for "support session, control disabled", and the source's own
   * offline behaviour requires exactly that: the banner still renders from the
   * last loaded state while the control disables. So when the gate refuses,
   * the support session is withheld from `BannerRegion` and its panel draws
   * the same seeded message through the same `Banner` primitive, with the
   * disabled control and its reason. The two are never both drawn.
   */
  const endSessionRefusal = endSessionReason()
  const endSessionIsLive = permitsAction(endSessionDecision) && endSessionRefusal === null
  /* ONE mechanism, not two. The banner region now takes a HANDED-IN reason, so
     the refused case is the same banner with a disabled control rather than a
     withheld banner redrawn beside it — which was a second construction of one
     rendering, and the shape this build criticises elsewhere. */
  const banners = screenAccessBanners(endedClasses, endSession).map((banner) =>
    banner.accessClass === 'normal-support-session' && endSessionRefusal !== null
      ? { ...banner, endSessionDisabledReason: endSessionRefusal }
      : banner,
  )

  function endSession(): void {
    if (auditWillFail) {
      setOutcome('audit-failed')
      return
    }
    setEndedClasses((c) => [...c, 'normal-support-session'])
    setOutcome('ended')
  }

  function changeScenario(apply: () => void): void {
    apply()
    setOutcome(null)
  }

  function changeRole(next: TenantRoleId): void {
    changeScenario(() => setRole(next))
  }

  const annotation = (
    <p className="text-xs text-[var(--color-ink-subtle)]">
      Screen annotation only, never a route key (D1): SCR-DOH-22, Platform Access History and
      announcements, in the canonical catalogue; storyboard SB-DOH-025. The post-session report
      panel below carries its own identifier, SCR-DOH-PAH-02, and is built as a REGION of this
      screen rather than a route of its own. This route is keyed on the module slug. MOD-DOH-13
      owns no business object: a filtered projection of this workspace&rsquo;s own audit records,
      plus exactly one command.
    </p>
  )

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
          label="Screen state"
          value={stateId}
          options={SCREEN_STATE_OPTIONS}
          onChange={(value) => {
            const next = APPLICABLE_SCREEN_STATES.find((s) => s === value)
            if (next !== undefined) changeScenario(() => setStateId(next))
          }}
        />
        <Select
          label="Tenant state"
          value={tenantState}
          options={TENANT_STATE_OPTIONS}
          onChange={(value) => {
            const next = TENANT_STATES.find((s) => s === value)
            if (next !== undefined) changeScenario(() => setTenantState(next))
          }}
        />
        <Checkbox
          label="Simulate an audit-write failure on the next End session"
          checked={auditWillFail}
          onChange={(next) => changeScenario(() => setAuditWillFail(next))}
        />
      </div>
      <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
        These re-render seeded fixtures. They perform no product action and change no business
        state. No tenant role holds a control that opens a platform access session or changes a
        suspension state, so nothing here stands in for a tenant act — the access classes below are
        opened on another surface entirely.
      </p>
    </section>
  )

  const matrixRows: readonly TableRow[] = CONTROL_MATRIX.map((row) => ({
    control: (
      <>
        <span className="font-medium">{row.control}</span>
        <span className="block text-xs text-[var(--color-ink-subtle)]">{row.sourceRef}</span>
      </>
    ),
    admin: cell(row.status.TENANT_ADMIN, row.detail.TENANT_ADMIN),
    supervisor: cell(row.status.SUPERVISOR, row.detail.SUPERVISOR),
    quality: cell(row.status.QUALITY_MANAGER, row.detail.QUALITY_MANAGER),
    auditor: cell(row.status.READONLY_AUDITOR, row.detail.READONLY_AUDITOR),
    worker: cell(row.status.WORKER, row.detail.WORKER),
    rendering: (
      <>
        <span>{row.rendering}</span>
        <span className="block text-xs text-[var(--color-ink-subtle)]">{row.effect}</span>
      </>
    ),
  }))

  const historyTableRows: readonly TableRow[] = historyRows.map((r) => ({
    at: (
      <>
        <span>{r.at}</span>
        <span className="block text-xs text-[var(--color-ink-subtle)]">{r.auditId}</span>
      </>
    ),
    accessClass: r.accessClass,
    identity: r.platformIdentity,
    reason: r.reason,
    ticket: r.ticketReference,
    scope: (
      <>
        <span>{r.scope}</span>
        <span className="block text-xs text-[var(--color-ink-subtle)]">{r.what}</span>
      </>
    ),
  }))

  return (
    <HubShell
      module={MODULE}
      role={role}
      onRoleChange={changeRole}
      tenantState={tenantState}
      /* CRITICAL: one session, ONE control, gated once. The chrome's banner
         slot draws an unconditionally live End-session control — `src/ui/**`
         holds no policy, so it cannot ask the tenant-state gate anything — and
         this route holds that gate. Without this the two were drawn together:
         this screen's control disabled with its reason, and the chrome's live
         beside it under a compliance suspension, an archived workspace and a
         lost connection alike. The chrome now carries the suspension slot
         only. */
      ownsPlatformBanners
    >
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
          On MOD-DOH-13: {MODULE_STATE_NOTE[stateId]}
        </p>
        <div className="mt-3">{stateTreatment(stateId, historyDecision, roleName)}</div>
      </section>

      <section aria-label="Platform access in progress" className="mt-6">
        <h2 className="text-lg font-semibold">Platform access in progress</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          All three platform-side access classes are exercised here, which is what the acceptance
          criterion asks for: every class appears, mirrored identically. The Hub&rsquo;s own banner
          slot above shows NONE of them on this route — it yields its platform slots to the screen
          that owns the session, so one session carries one control, gated once. What that slot
          seeds is shared by every Hub route and is deliberately left alone, so this screen decides
          for itself which classes it banners rather than changing what every other screen shows.
        </p>
        {permitsRead(bannerDecision) ? (
          <div className="mt-3">
            <BannerRegion banners={banners} />
          </div>
        ) : (
          <div className="mt-3">
            <ProhibitionNotice
              rendering={{
                kind: 'absent',
                note: `No banner is drawn for the ${roleName}. The banner is a Hub web element and this persona has no Hub web session at all.`,
              }}
            />
          </div>
        )}
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink)]">
          The banner text is fixed in the source and says <em>workspace</em>, never{' '}
          <em>tenant</em>: &ldquo;{BANNER_TEXT_FORM}&rdquo; (D18). It sits above all content, in a
          distinct colour, and does not scroll away.
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          <span className="font-medium text-[var(--color-ink)]">
            The banner is a hard gate, not decoration.{' '}
          </span>
          No banner means no session: the session does not open, or terminates, if the banner cannot
          be shown. No read of this workspace&rsquo;s operational content happens before the banner
          is confirmed displayed and the session-open event is committed to this workspace&rsquo;s
          audit stream.
        </p>

        <div className="mt-5 space-y-5">
          {ACCESS_CLASS_PANELS.map((panel) => (
            <div
              key={panel.accessClass}
              data-access-class={panel.accessClass}
              className="rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4"
            >
              <p className="font-medium">{panel.name}</p>
              <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
                {accessClassDescription(panel.accessClass)}
              </p>
              <p className="mt-2 text-sm text-[var(--color-ink)]">
                Engineer {panel.engineer}. Started {panel.startedAt}. Reason:{' '}
                {panel.reason}. Ticket {panel.ticketReference}. Time box: {panel.timeBox}
              </p>
              <p className="mt-1 text-sm">
                {panel.accessClass === 'normal-support-session' ? (
                  <StatusPill
                    tone={SESSION_STATE_TONE[supportSessionState]}
                    icon="●"
                    label={SESSION_STATE_LABEL[supportSessionState]}
                  />
                ) : (
                  <StatusPill tone={SESSION_STATE_TONE.open} icon="●" label={SESSION_STATE_LABEL.open} />
                )}{' '}
                <span className="text-xs text-[var(--color-ink-subtle)]">
                  {panel.writeCapable
                    ? 'This is the only class with write capability into this workspace.'
                    : 'Read-only without exception.'}
                </span>
              </p>

              {panel.tenantMayEnd ? (
                supportEnded ? (
                  <p className="mt-3 max-w-prose text-sm text-[var(--color-ink)]">
                    This session has ended in this storyboard run, so it is no longer bannered and
                    carries no control. The source defines no re-open control for a terminated
                    session, and none is drawn.
                  </p>
                ) : permitsAction(endSessionDecision) ? (
                  <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
                    {endSessionIsLive
                      ? 'End session is live on this class, in the banner above. It is drawn there rather than repeated here: the control belongs to the banner, and two controls over one session would be two ways to press the same thing.'
                      : 'End session is DISABLED on this class right now, in the banner above, carrying its reason — and the banner itself still renders, because visibility is the guarantee and it does not depend on the write path. It is never queued.'}
                  </p>
                ) : (
                  <div className="mt-3">
                    <ProhibitionNotice
                      rendering={{
                        kind: 'absent',
                        note: `No End-session control is drawn for the ${roleName}: this persona holds no Hub web session, so there is no banner for it to sit on.`,
                      }}
                    />
                  </div>
                )
              ) : (
                <div className="mt-3">
                  <ProhibitionNotice
                    rendering={{
                      kind: 'absent',
                      note: `No End-session control exists on this class, for any role, and none is disabled either — the banner type carries no such field on this arm, so it is absent by construction (D13). ${panel.insteadOfEndSession}`,
                    }}
                  />
                </div>
              )}

              {panel.accessClass === 'normal-support-session' ? (
                <>
                  <div className="mt-3">
                    <Button disabledReason={EXTEND_TIME_BOX_REASON}>Extend the time box</Button>
                  </div>
                  <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
                    This one control is DISABLED with its reason rather than absent, and that is
                    the source&rsquo;s own rendering for it rather than this build&rsquo;s
                    judgement: the same panel that says the grant-write-access and
                    hide-the-banner controls &ldquo;do not exist&rdquo; says this one is disabled
                    and quotes the reason it carries. Both renderings are the source&rsquo;s,
                    side by side, on one banner. It is drawn on THIS class alone, because the
                    panel that names it is the support-session banner&rsquo;s; the source says
                    nothing about a time-box control on the other two, and extending a source row
                    onto a class the source is silent about would be inventing a control — a
                    disabled one is still one.
                  </p>
                </>
              ) : null}
            </div>
          ))}
        </div>

        <p className="mt-4 max-w-prose text-sm text-[var(--color-ink-muted)]">
          <span className="font-medium text-[var(--color-ink)]">
            Any signed-in tenant web user may press End session (D12).{' '}
          </span>
          Tenant Admin allowed; Supervisor, Quality Manager and Read-only Auditor allowed with
          conditions — because the control belongs to the tenant, and a session must not continue
          merely because one person is away. Two of those roles cannot open the history table below
          and can still end the session, which is why every affordance on this screen is decided per
          control and never per module. The row elsewhere in the source that grants the
          platform-side Support role this control is excluded: it contradicts the premise.
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          <span className="font-medium text-[var(--color-ink)]">Audit is in the same transaction. </span>
          The termination and its audit entry commit together. If the audit write fails, the action
          fails with it and this screen says the action did not happen — the session stays open and
          stays bannered. Gated on the audit write the one write-class table already names, because
          the write-class enumerations name no End-session class at all; the mapping is recorded in
          the unresolved panel rather than added as a row to that table.
        </p>
        <LiveRegion>
          {outcome !== null ? (
            <p className="mt-2 max-w-prose rounded-[var(--radius-control)] border border-[var(--color-border)] p-3 text-sm text-[var(--color-ink)]">
              {outcome === 'audit-failed' ? AUDIT_FAILURE_COPY : END_SESSION_SIMULATION_COPY}
            </p>
          ) : null}
        </LiveRegion>
      </section>

      <section aria-label="Platform Access History" className="mt-6">
        <h2 className="text-lg font-semibold">Platform Access History</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink)]">{HISTORY_INTRO_COPY}</p>
        {permitsRead(historyDecision) ? (
          <>
            <div className="mt-3">
              <Banner
                tone="info"
                heading="Read-only"
                body="This projection is read-only for both roles that can open it, the Tenant Admin included. Its cause is the module rather than any suspension: the Hub shows the tenant its own position, read-only — nothing more. No row here can be edited, annotated, suppressed or deleted by anybody, on this surface or on any other."
              />
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-6">
              <Select
                label="Access class"
                value={filters.accessClass ?? EVERY_CLASS}
                options={[
                  { value: EVERY_CLASS, label: 'Every access class' },
                  ...ACCESS_CLASS_PANELS.map((p) => ({ value: p.accessClass, label: p.name })),
                ]}
                onChange={(value) =>
                  changeScenario(() =>
                    setFilters((f) => ({
                      ...f,
                      accessClass:
                        ACCESS_CLASS_PANELS.find((p) => p.accessClass === value)?.accessClass ??
                        null,
                    })),
                  )
                }
              />
              <Select
                label="Date"
                value={filters.onDate ?? EVERY_DATE}
                options={[
                  { value: EVERY_DATE, label: 'Every date' },
                  ...historyDates(SEEDED_ACCESS_HISTORY).map((d) => ({ value: d, label: d })),
                ]}
                onChange={(value) =>
                  changeScenario(() =>
                    setFilters((f) => ({
                      ...f,
                      onDate: historyDates(SEEDED_ACCESS_HISTORY).includes(value) ? value : null,
                    })),
                  )
                }
              />
            </div>
            <div className="mt-4">
              <Table
                caption="Platform Access History — every platform-side access against this workspace"
                columns={[
                  { key: 'at', header: 'Timestamp' },
                  { key: 'accessClass', header: 'Access class' },
                  { key: 'identity', header: 'Platform identity' },
                  { key: 'reason', header: 'Reason' },
                  { key: 'ticket', header: 'Ticket reference' },
                  { key: 'scope', header: 'Scope' },
                ]}
                rows={historyTableRows}
                loading={loading}
                filtered={filters.accessClass !== null || filters.onDate !== null}
                {...(readFailed
                  ? {
                      error:
                        'The read of this workspace’s audit records failed. Nothing was written — this view writes nothing at any time. The rows above are absent rather than stale, and no access is hidden by the failure: an access that cannot be audited does not happen, so there is nothing recorded elsewhere that this table would be missing.',
                    }
                  : {})}
                emptyState={{
                  title: 'No platform-side access has ever occurred against this workspace.',
                  whatCreatesIt:
                    'A support session, a compliance-emergency access or a delivery-partner grant being opened. This is a real and common state, and it is not a failure: it means nobody from the platform side has ever looked.',
                }}
              />
            </div>
            <div className="mt-4">
              <Button disabledReason="The storyboard for this screen puts an export control on this table, and this module’s own ten-row permission matrix carries no row for it — so no role holds it here. A different module’s matrix does carry an audit-log export row with per-role statuses, but that is another module’s authority over another object, and borrowing a status across a module boundary is how two matrices quietly become one. Recorded in the unspecified and unresolved panels rather than resolved here.">
                Export this view
              </Button>
            </div>
            <div className="mt-4">
              <SeamNotice seamId="platform-access-history-audit" />
            </div>
            <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
              One audit truth per workspace (D14). These rows are a seeded fixture of this
              workspace&rsquo;s own audit records, read through rather than copied: the audit store
              is built in a later slice, and a second store built here to make this slice
              self-contained would look identical today and would stay invisible until the two had
              to be reconciled. The refused write attempt above is a row in its own right, so a
              reader sees what was turned away and not only what succeeded.
            </p>
          </>
        ) : (
          <div className="mt-3">
            <ScreenStateBoundary
              state="STATE-05"
              surface="SURF-DOH"
              detail={{ decision: historyDecision }}
            />
            <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
              Platform Access History is not offered to the {roleName}, and the module rail does not
              offer this route either — so this is what a deep link meets. The two roles that carry
              the read are the Tenant Admin and the Read-only Auditor.
            </p>
            <p className="mt-2 max-w-prose text-sm text-[var(--color-ink)]">
              What this persona DOES hold on this module is above and is not taken away by the
              refusal: the support-session banner reaches every signed-in web user of this
              workspace, and so does the End-session control on it. The refusal is about the
              history, not about the guarantee.
            </p>
            <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
              Nine permission tokens govern this refusal, not six (D8). This one is{' '}
              {historyDecision.outcome}, stage {historyDecision.stage}. The refused attempt is
              written to this workspace&rsquo;s own audit stream in the same transaction as the
              refusal.
            </p>
          </div>
        )}
      </section>

      <section aria-label="Post-session report" className="mt-6">
        <h2 className="text-lg font-semibold">Post-session report — SCR-DOH-PAH-02</h2>
        {permitsRead(reportDecision) ? (
          <>
            <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
              Generated automatically after a compliance-emergency session, stating what was
              accessed. Nobody requests it and nobody can suppress it — that is what this workspace
              gets in exchange for the one access class it cannot end.
            </p>
            <p className="mt-2 text-sm text-[var(--color-ink)]">
              For {SEEDED_POST_SESSION_REPORT.forAuditId}, generated{' '}
              {SEEDED_POST_SESSION_REPORT.generatedAt}. Authorised by{' '}
              {SEEDED_POST_SESSION_REPORT.authorisedBy.join(' and ')}.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-ink-muted)]">
              {SEEDED_POST_SESSION_REPORT.accessedItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        ) : (
          <ProhibitionNotice
            rendering={{
              kind: 'absent',
              note: `No post-session report is drawn for the ${roleName}: this persona holds it in no scope, so nothing is drawn where it would sit and the rail does not offer this route.`,
            }}
          />
        )}
      </section>

      <section aria-label="Platform announcements" className="mt-6">
        <h2 className="text-lg font-semibold">Platform announcements</h2>
        {permitsRead(announcementDecision) ? (
          <>
            <div className="mt-3">
              <BannerRegion banners={SCREEN_ANNOUNCEMENTS} />
            </div>
            <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
              Posted by the client&rsquo;s platform team for a defined duration —{' '}
              {ANNOUNCEMENT_WINDOW} — and expiring automatically at the end of it. No tenant role
              posts, edits or schedules one, and no tenant user can mute one: the announcement
              variant carries no dismiss field at all, so there is nothing to disable.
            </p>
          </>
        ) : (
          <ProhibitionNotice
            rendering={{
              kind: 'absent',
              note: `Announcements render in the Hub, and the ${roleName} has no Hub web session for one to render in.`,
            }}
          />
        )}
      </section>

      <section aria-label="Not reachable from the Hub" className="mt-6">
        <h2 className="text-lg font-semibold">Not reachable from the Hub</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink)]">
          The Hub shows the tenant its own position, read-only — nothing more. Six things are
          unreachable from this surface, and none of them is drawn, linked to, or hinted at in the
          module rail for any of the five roles.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-ink-muted)]">
          {UNREACHABLE_FROM_THE_HUB.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section aria-label="Attributed but disputed" className="mt-6">
        <h2 className="text-lg font-semibold">Attributed to this module, and disputed</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The workflow catalogue attributes three device workflows to this module. Its own card
          says the Hub shows the tenant its own position read-only and nothing more, and a
          read-only module cannot own device enrolment. The card governs (D5). The rows are
          recorded here rather than obeyed or deleted, and the device screen this slice builds is
          uncatalogued and claims no module at all.
        </p>
        <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
          {DISPUTED_ATTRIBUTIONS.map((d) => (
            <li key={d.workflow}>
              <span className="font-medium text-[var(--color-ink)]">{d.workflow}</span> — {d.what}{' '}
              <span className="text-xs text-[var(--color-ink-subtle)]">({d.sourceRef})</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Control matrix" className="mt-6">
        <h2 className="text-lg font-semibold">What each of the five tenant roles sees</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Ten controls, five roles, an explicit status in every cell — a blank cell is an unanswered
          question an implementer would answer privately. Every affordance above is driven from this
          table alone, through the shared evaluator. The tenth row is the one that makes this screen
          a guarantee rather than a report, and the brief that commissioned this build quoted only
          nine; that is recorded in the unresolved panel as a finding.
        </p>
        <div className="mt-3">
          <Table
            caption="MOD-DOH-13 control matrix, by tenant role"
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
          Note the split this table forces. Two roles are marked Unavailable on the history and the
          report — so the rail withholds this route from them — while the same two roles are Allowed
          on the banner and on ending the session. The banner reaches them through the Hub chrome
          regardless of the rail, which is exactly why a module-level role list would have been the
          wrong shape for this module.
        </p>
      </section>

      <section aria-label="Absent by rule" className="mt-6">
        <h2 className="text-lg font-semibold">Absent by rule</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Nothing is drawn where each of these would sit — only the note saying why. The one
          exception on this screen is the time-box control above, which the source itself renders
          disabled with a named reason rather than absent.
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
          Affordances this screen might be expected to carry that the source does not define. Named
          rather than invented, because a plausible invented control reads back as a requirement.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-ink-muted)]">
          {UNSPECIFIED_IN_SOURCE.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section aria-label="Unresolved in source" className="mt-6">
        <h2 className="text-lg font-semibold">Unresolved in source</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-ink-muted)]">
          {UNRESOLVED_IN_SOURCE.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </HubShell>
  )
}

function cell(status: ControlStatus, detail: string) {
  return (
    <>
      <span className="font-medium">{STATUS_LABEL[status]}</span>
      <span className="block text-xs text-[var(--color-ink-subtle)]">{detail}</span>
    </>
  )
}

const MODULE_STATE_NOTE: Record<ApplicableScreenStateId, string> = {
  'STATE-01':
    'a workspace no platform-side access has ever touched. A real and common state, and not a failure: it means nobody from the platform side has ever looked.',
  'STATE-02':
    'the history while it is fetched. A skeleton of the table, never a zero-row grid — an empty table reads as "nobody has ever looked", which is a very different claim from "this has not arrived".',
  'STATE-03': 'the banner, the history table and the report panel, each carrying its own moment.',
  'STATE-05':
    'a Supervisor or Quality Manager meeting this route by deep link. They are refused the history and the report, and they keep the banner and the End-session control — the refusal is about the table, not about the guarantee.',
  'STATE-06':
    'the standing state of the history and the report for both roles that can open them. Its cause is the module: the Hub shows the tenant its own position, read-only — nothing more.',
  'STATE-08':
    'the banner rendering from the last loaded state with a freshness marker, while End session disables rather than queues. The session’s own time box remains the bound.',
  'STATE-12':
    'a read of the audit records that failed outright, naming what failed and stating that nothing was written. No access is hidden by the failure, because an access that cannot be audited does not happen.',
  'STATE-13':
    'reconnection. The banner state is refetched BEFORE End session is re-enabled, so a session that ended during the outage no longer shows as open and the control is not offered against a session that is already gone.',
}

function stateTreatment(
  stateId: ApplicableScreenStateId,
  historyDecision: PermissionDecision,
  roleName: string,
) {
  switch (stateId) {
    case 'STATE-01':
      return (
        <p className="text-sm text-[var(--color-ink-muted)]">
          The empty rendering is the table&rsquo;s own, below: it names what would appear and what
          creates it, and says plainly that an empty history is not a failure.
        </p>
      )
    case 'STATE-02':
      return (
        <ScreenStateBoundary
          state="STATE-02"
          surface="SURF-DOH"
          detail={{ objectLabel: 'this workspace’s platform access history' }}
        />
      )
    case 'STATE-03':
      return (
        <p className="text-sm text-[var(--color-ink-muted)]">
          The regions below are the success rendering, each carrying the moment it was true.
        </p>
      )
    case 'STATE-05':
      if (permitsRead(historyDecision)) {
        return (
          <p role="note" className="text-sm text-[var(--color-ink-muted)]">
            {roleName} carries the read, so no refusal renders for this view. Select the Supervisor
            or the Quality Manager to meet it — and note what they keep: the banner and the
            End-session control, which this module grants them even though it withholds its table.
          </p>
        )
      }
      return (
        <ScreenStateBoundary
          state="STATE-05"
          surface="SURF-DOH"
          detail={{ decision: historyDecision }}
        />
      )
    case 'STATE-06':
      return (
        <ScreenStateBoundary
          state="STATE-06"
          surface="SURF-DOH"
          detail={{
            readOnlyCause:
              'The Hub shows the tenant its own position, read-only — nothing more. This projection carries no edit, annotate, suppress or delete control on any row, for any role, and the one command on this screen acts on a platform session rather than on a record.',
          }}
        />
      )
    case 'STATE-08':
      return (
        <>
          <ScreenStateBoundary
            state="STATE-08"
            surface="SURF-DOH"
            detail={{
              asOfLabel: 'as of the last state loaded before the connection dropped',
              originLabel:
                'the last loaded banner and history, degraded rather than blanked, with End session disabled rather than queued',
            }}
          />
          <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
            {CONNECTION_LOST_REASON}
          </p>
        </>
      )
    case 'STATE-12':
      return (
        <ScreenStateBoundary
          state="STATE-12"
          surface="SURF-DOH"
          detail={{
            failureWhat: 'The read of this workspace’s own audit records',
            wasWritten: false,
            nextStep:
              'The banner still renders, because visibility is the guarantee and it does not depend on this read. End session is disabled rather than queued while the connection is down, so nothing is waiting to be sent, and the session’s platform-side time box still bounds it.',
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
              'Reconnected. The banner state is being refetched BEFORE End session is re-enabled, so a session ended during the outage no longer shows as open — and the control is never offered against a session that has already gone.',
          }}
        />
      )
    default: {
      const exhaustive: never = stateId
      throw new Error(`Unhandled screen state on MOD-DOH-13: ${String(exhaustive)}`)
    }
  }
}
