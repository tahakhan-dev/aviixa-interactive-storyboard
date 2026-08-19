'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
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
import { RootUnavailableFreeze } from '@/ui/sa/RootUnavailableFreeze'
import {
  Banner,
  Button,
  Field,
  FreshnessLabel,
  Select,
  SkeletonBlock,
  StatusPill,
  Table,
} from '@/ui/primitives'
import { SaConsoleShell } from '../SaConsoleShell'
import {
  BROADCAST_TARGETS,
  NOTIF_ABSENT_CONTROLS,
  NOTIF_CHANNELS,
  NOTIF_PLATFORM_ROLES,
  NOTIF_SOURCE_CONFLICTS,
  NOTIF_UNSPECIFIED_IN_SOURCE,
  NOTIF_WORKFLOWS,
  RECONCILIATION,
  RECONCILIATION_AS_OF,
  RECONCILIATION_ORIGIN,
  RECONCILIATION_STALE_AS_OF,
  SEND_HISTORY,
  type BroadcastTarget,
} from './fixtures'

const MODULE = saModuleById('MOD-SA-14')

/** The twelve applicable states: all thirteen less the frontline-only STATE-07. */
const APPLICABLE_STATES = SCREEN_STATES.filter((s) => !s.frontlineOnly)

/** No backend, no clock — the policy layer is handed an empty seeded state. */
const FIXTURE_STATE = emptyDomainState(scenarioRunId('SA-14-NOTIFICATIONS'))

/**
 * `all-tenant-broadcast` is one of the eleven entries the spec's D12 keeps in
 * `CRITICAL_ACTIONS`. Looked up rather than restated, so this screen cannot
 * drift from the registry that drives the approval routing.
 */
const ALL_TENANT_BROADCAST = CRITICAL_ACTIONS.find((a) => a.id === 'all-tenant-broadcast')

/** The one invariant this module actually carries. */
const AUDIT_INVARIANT = SA_INVARIANTS.find((i) => i.id === 'one-transaction-audit-guarantee')

type ComposerAvailability = 'available' | 'read-only' | 'unavailable'

function composerAvailability(state: ScreenStateId): ComposerAvailability {
  if (state === 'STATE-06') return 'read-only'
  if (state === 'STATE-12') return 'unavailable'
  return 'available'
}

type AggregateMode = 'current' | 'stale' | 'unavailable' | 'loading'

function aggregateMode(state: ScreenStateId): AggregateMode {
  if (state === 'STATE-02') return 'loading'
  if (state === 'STATE-08') return 'stale'
  if (state === 'STATE-12') return 'unavailable'
  return 'current'
}

/**
 * The named reason a drawn-but-inert control carries, written here rather
 * than taken from `decision.explanation`.
 *
 * The spine's own `ROLE_NOT_GRANTED` text ("The current role does not carry a
 * grant for this action.") is correct but generic: it names no holder. D10's
 * named-reason rendering has to say WHO carries the control instead, and the
 * source names a different holder per control here — the channel selector's
 * pair (L45614) is not the Admin's submission control. The decision object
 * still drives WHETHER the control acts; only the sentence is ours.
 */
function namedReason(
  decision: PermissionDecision,
  role: RoleId,
  availability: ComposerAvailability,
  control: 'send' | 'submit' | 'resend' | 'channels' | 'session',
): string {
  if (decision.outcome === 'allowed') return ''
  if (control === 'session') {
    return availability === 'read-only'
      ? 'This screen is read-only in this state, so no session request is submitted from it.'
      : 'This screen could not be read in this state, so no session request is submitted from it.'
  }
  if (decision.reasonCode === 'ROLE_NOT_GRANTED') {
    if (control === 'submit') {
      return 'Submitting an all-tenant broadcast for root approval is the Admin’s control (L45614). This role does not hold it.'
    }
    const who =
      role === 'PLATFORM_ENGINEER'
        ? 'The Platform Engineer holds no platform-to-tenant communication control on this module.'
        : 'Composing and sending a tenant communication sits outside Support’s grants on this console.'
    return `Composing and sending is carried by the Root Super Admin and the Admin (L45614). ${who}`
  }
  if (availability === 'unavailable') {
    return 'The broadcast composer cannot be reached in this state, so nothing can be sent from it.'
  }
  if (availability === 'read-only') {
    return 'This screen is read-only in this state, so no send is accepted from it.'
  }
  return 'This role does not hold this control on this module.'
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

export interface NotificationsScreenProps {
  /** View-switcher seed, not a login (spec §8). */
  readonly role?: RoleId
  readonly screenState?: ScreenStateId
  readonly target?: BroadcastTarget
}

export function NotificationsScreen({
  role: initialRole = 'ADMIN',
  screenState: initialScreenState = 'STATE-03',
  target: initialTarget = 'single-tenant',
}: NotificationsScreenProps = {}) {
  const [role, setRole] = useState<RoleId>(initialRole)
  const [screenState, setScreenState] = useState<ScreenStateId>(initialScreenState)
  const [target, setTarget] = useState<BroadcastTarget>(initialTarget)
  const [channelChoice, setChannelChoice] = useState<string>('both')
  const [announcementType, setAnnouncementType] = useState<string>('')
  const [severity, setSeverity] = useState<string>('')
  const [body, setBody] = useState<string>('')
  const [submittedState, setSubmittedState] = useState<string | null>(null)
  const [resent, setResent] = useState<boolean>(false)
  const [sessionOpen, setSessionOpen] = useState<boolean>(false)

  const availability = composerAvailability(screenState)
  const aggregate = aggregateMode(screenState)
  const stateDefinition = SCREEN_STATES.find((s) => s.id === screenState) ?? SCREEN_STATES[0]
  const isAllTenant = target === 'all-tenant'
  const isRoot = role === 'ROOT_SUPER_ADMIN'

  // STATE-06 disables EVERY input this screen owns, and STATE-12 accepts no
  // submission — the state contract is printed a few lines below, so a live
  // field here would contradict the sentence beside it.
  //
  // The two fixture switchers above are deliberately not among them: they are
  // the storyboard's stepping controls, not inputs of the screen under
  // annotation, and freezing them would strand a reader inside the very state
  // they stepped into.
  const inputsDisabled = availability !== 'available'
  const inputReason =
    availability === 'read-only'
      ? 'This screen is read-only in this state: this field accepts no entry, and nothing is submitted from it.'
      : 'This screen could not be read in this state: this field accepts no entry, and nothing is submitted from it.'
  const describe = (base: string): string => (inputsDisabled ? `${base} ${inputReason}` : base)
  const INPUT_CLASS =
    'w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-2 text-sm text-[var(--color-ink)] disabled:opacity-50'

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

  // Per-control allowed roles from L45614 — never the module-level
  // `roles_allowed`, which differs in all seven extractions of this module
  // and which D16 makes authoritative nowhere.
  const channelDecision = evaluateAccess(
    {
      action: 'MOD-SA-14:choose-channels',
      allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN'],
      sourceRefs: ['L45614', 'AC-SA-14-01 L45684'],
    },
    context,
  )
  const sendDecision = evaluateAccess(
    {
      action: 'MOD-SA-14:send-notice',
      allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN'],
      allowedObjectStates: ['available'],
      objectState: availability,
      sourceRefs: ['L45614', 'AC-SA-14-03 L45684'],
    },
    context,
  )
  const submitDecision = evaluateAccess(
    {
      action: 'MOD-SA-14:submit-for-root-approval',
      allowedRoles: ['ADMIN'],
      allowedObjectStates: ['available'],
      objectState: availability,
      sourceRefs: ['L45614', 'AC-SA-14-03 L45684'],
    },
    context,
  )
  const resendDecision = evaluateAccess(
    {
      action: 'MOD-SA-14:re-send-against-stored-snapshot',
      allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN'],
      allowedObjectStates: ['available'],
      objectState: availability,
      sourceRefs: ['AC-SA-14-07 L45684', 'FB-SA-07 L45682'],
    },
    context,
  )
  // Every console role may raise a session request; the screen state is the
  // only thing that stops one, and it stops it through the same evaluator
  // rather than through a raw boolean on the button.
  const sessionDecision = evaluateAccess(
    {
      action: 'MOD-SA-14:request-support-session',
      allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN', 'PLATFORM_ENGINEER', 'SUPPORT'],
      allowedObjectStates: ['available'],
      objectState: availability,
      sourceRefs: ['L16022', 'D18 L56107'],
    },
    context,
  )

  const sendProps =
    sendDecision.outcome === 'allowed'
      ? {}
      : { disabledReason: namedReason(sendDecision, role, availability, 'send') }
  const submitProps =
    submitDecision.outcome === 'allowed'
      ? {}
      : { disabledReason: namedReason(submitDecision, role, availability, 'submit') }
  const resendProps =
    resendDecision.outcome === 'allowed'
      ? {}
      : { disabledReason: namedReason(resendDecision, role, availability, 'resend') }
  const sessionProps =
    sessionDecision.outcome === 'allowed'
      ? {}
      : { disabledReason: namedReason(sessionDecision, role, availability, 'session') }

  // AC-SA-01-03: a count is only rendered when there is something to count.
  // A category with nothing in it is not reported as the number nought.
  const allCounts: readonly (readonly [string, number, string])[] = [
    ['Audience snapshot', RECONCILIATION.snapshotTenants, 'tenants in the stored snapshot'],
    ['Delivered to', RECONCILIATION.deliveredTenants, 'tenants'],
    ['Opened by', RECONCILIATION.openedTenants, 'tenants'],
    ['Acknowledged by', RECONCILIATION.acknowledgedTenants, 'tenants'],
    ['Delivery failed for', RECONCILIATION.failedTenants, 'tenants'],
  ]
  const counts = allCounts.filter(([, n]) => n > 0)

  const displayedSendState =
    submittedState ?? (screenState === 'STATE-09' ? 'snapshot taken' : null)

  return (
    <SaConsoleShell module={MODULE}>
      <p className="text-xs text-[var(--color-ink-subtle)]">
        Screen annotated SCR-SA-20 (L42812, L45614), storyboard SB-SA-14 (L45614). Names are
        canonical; the numbers are annotations only, and this route is keyed on the module slug.
      </p>
      <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
        This is a browser-only storyboard: nothing is composed against a notification service and no
        telemetry leaves the browser.
      </p>

      <div className="mt-6 flex flex-wrap gap-6 rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4">
        <Select
          label="Console role (fixture)"
          value={role}
          onChange={(v) => setRole(v as RoleId)}
          options={NOTIF_PLATFORM_ROLES.map((r) => ({
            value: r.id,
            label: `${r.name} — ${r.roleAnnotation}`,
          }))}
        />
        <Select
          label="Screen state (fixture)"
          value={screenState}
          onChange={(v) => setScreenState(v as ScreenStateId)}
          options={APPLICABLE_STATES.map((s) => ({ value: s.id, label: `${s.id} — ${s.name}` }))}
        />
        <p className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
          The role control is a view switcher, not a login. Nothing here authenticates anybody, and
          no state below is computed — each is a seeded fixture.
        </p>
      </div>

      <div className="mt-4 rounded-[var(--radius-surface)] bg-[var(--color-surface-sunken)] p-4 text-sm">
        <p className="font-medium">
          {stateDefinition.id} — {stateDefinition.name}
        </p>
        <p className="mt-1 text-[var(--color-ink-muted)]">{stateDefinition.contract}</p>
        <p className="mt-1 text-[var(--color-ink-muted)]">{stateDefinition.neverDo}</p>
      </div>

      {availability === 'read-only' ? (
        <div className="mt-4">
          <Banner
            tone="attention"
            heading="Read-only"
            body="One cause: this fixture puts the composer into a read-only state, so no send is accepted from it. Every panel below still reads."
          />
        </div>
      ) : null}

      <p className="mt-4 max-w-prose text-sm text-[var(--color-ink-muted)]">
        No part of this module depends on a model. Composing, targeting, snapshotting, sending and
        reconciling are deterministic, so with every artificial-intelligence model unavailable this
        module is unchanged and remains fully operable (AC-SA-000-09, L42887).
      </p>

      <Section id="sa14-invariant" heading="Enforced invariant on this module">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          A send and its audit record commit together, and a notification that cannot be audited is
          not sent (AC-30C-1204, L73841). This is a status readout. There is no switch here, no
          approval path around one, and no configuration key for it on any screen.
        </p>
        <div className="mt-3">
          {AUDIT_INVARIANT === undefined ? null : <InvariantChip invariant={AUDIT_INVARIANT} />}
        </div>
      </Section>

      <Section id="sa14-channels" heading="Channels">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Two fixed options, and no others exist at V1 (L45614). The set is closed by AC-SA-14-01
          (L45684) and corroborated platform-wide at every tier by AC-SA-07-06-01 (L44281).
        </p>
        <ul className="mt-3 space-y-3">
          {NOTIF_CHANNELS.map((channel) => (
            <li key={channel.id}>
              <StatusPill tone="info" icon="•" label={channel.name} />
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{channel.description}</p>
              <p className="text-xs text-[var(--color-ink-subtle)]">{channel.sourceRef}</p>
            </li>
          ))}
        </ul>
        {channelDecision.outcome === 'allowed' ? (
          <div className="mt-3 max-w-md">
            <Field
              label="Channels for this send"
              description={describe('Either channel alone, or both together.')}
            >
              <select
                value={channelChoice}
                disabled={inputsDisabled}
                onChange={(e) => setChannelChoice(e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="in-app">In-app only</option>
                <option value="email">Email only</option>
                <option value="both">In-app and email</option>
              </select>
            </Field>
          </div>
        ) : (
          <p role="note" className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
            {namedReason(channelDecision, role, availability, 'channels')} Both channels are still
            read here, because every console role reads this screen.
          </p>
        )}
      </Section>

      <Section id="sa14-composer" heading="Broadcast composer">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          An announcement carries a type, a severity, a body and an optional action link (L45586).
          The source names the channel selector’s roles — Root Super Admin and Admin, L45614 — and
          the Admin’s submission control, but never names who holds the send control separately.
          This prototype applies the channel selector’s set to it and says so rather than choosing
          quietly.
        </p>
        <div className="mt-3 max-w-md">
          <Field label="Target" description={describe('One named tenant, or every tenant.')}>
            <select
              value={target}
              disabled={inputsDisabled}
              onChange={(e) => setTarget(e.target.value as BroadcastTarget)}
              className={INPUT_CLASS}
            >
              {BROADCAST_TARGETS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-3 max-w-xl space-y-3">
          <Field
            label="Announcement type"
            description={describe(
              'Free text: the source names the field but enumerates no closed set of types.',
            )}
          >
            <input
              value={announcementType}
              disabled={inputsDisabled}
              onChange={(e) => setAnnouncementType(e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field
            label="Severity"
            description={describe(
              'Free text: no broadcast-severity value set is enumerated for this module.',
            )}
          >
            <input
              value={severity}
              disabled={inputsDisabled}
              onChange={(e) => setSeverity(e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field
            label="Body"
            required
            {...(inputsDisabled ? { description: inputReason } : {})}
          >
            <textarea
              value={body}
              disabled={inputsDisabled}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className={INPUT_CLASS}
            />
          </Field>
        </div>
        {screenState === 'STATE-04' ? (
          <p role="alert" className="mt-2 max-w-prose text-sm text-[var(--color-status-blocked)]">
            The body is empty. The rule: an announcement carries a body, and a broadcast with an
            empty body is not accepted. The source states no field-level validation rule for this
            composer, so that one rule is a prototype rendering of the STATE-04 contract and is
            named as such below.
          </p>
        ) : null}

        {isAllTenant && !isRoot ? (
          <div className="mt-4 space-y-3">
            {/* CLASS BADGE REPLACING THE ACTION BAR (spec §3): an all-tenant
                broadcast is critical class, so the send control is not drawn
                at all for a non-root role and nothing here can be mistaken
                for an approval. */}
            <ProhibitionNotice rendering={{ kind: 'class-badge' }} />
            <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
              All-tenant broadcasts require root approval; single-tenant notices do not
              (AC-SA-14-03, L45684).
              {ALL_TENANT_BROADCAST === undefined
                ? ''
                : ` ${ALL_TENANT_BROADCAST.name} is one of the eleven critical-class actions (${ALL_TENANT_BROADCAST.sourceRef}).`}{' '}
              The send control is replaced, not disabled — the only control offered here is the
              Admin’s submission (L45614).
            </p>
            <Button {...submitProps} onClick={() => setSubmittedState('pending root approval')}>
              Submit for root approval
            </Button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <Button {...sendProps} onClick={() => setSubmittedState('snapshot taken')}>
              Send notice
            </Button>
            {isAllTenant && isRoot ? (
              <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
                An all-tenant broadcast is critical class and requires root approval (AC-SA-14-03).
                The root approves its own critical-class actions, and no second approver exists —
                DEC-ROOTSUCC-001, spec D13. That is stated here rather than a second approval step
                being invented.
              </p>
            ) : (
              <p className="max-w-prose text-sm text-[var(--color-ink-muted)]">
                A single-tenant notice needs no root approval (AC-SA-14-03, L45684).
              </p>
            )}
          </div>
        )}

        {displayedSendState !== null ? (
          <div className="mt-3">
            <StatusPill tone="info" icon="•" label={displayedSendState} />
            <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
              An accepted action is shown in its own broadcast state and is never rendered as sent,
              delivered or acknowledged.
            </p>
          </div>
        ) : null}
      </Section>

      <Section id="sa14-snapshot" heading="Audience snapshot">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Every send stores an audience snapshot taken at send time (AC-SA-14-04, L45684). The
          snapshot is stored with the record, so the set of tenants a message was addressed to
          cannot change afterwards. The source’s own illustrative all-tenant audience is 47 tenants
          (L45616).
        </p>
      </Section>

      <Section id="sa14-reconciliation" heading="Reconciliation against the audience snapshot">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Delivery, opening and acknowledgement are tracked as three distinct states and are never
          conflated into one number (AC-SA-14-06, L45684). Every count below is a count of tenants:
          nothing on this module counts below the tenant, and no proportion is rendered.
        </p>
        {aggregate === 'loading' ? (
          <div className="mt-3">
            <SkeletonBlock lines={3} label="Loading the reconciliation for BC-2201" />
          </div>
        ) : aggregate === 'unavailable' ? (
          <p className="mt-3 max-w-prose text-sm">
            Unavailable — the reconciliation for BC-2201 could not be read in this state. An
            unavailable aggregate is never rendered as a count and never left blank.
          </p>
        ) : (
          <>
            {aggregate === 'stale' ? (
              <div className="mt-3">
                <StatusPill
                  tone="stale"
                  icon="•"
                  label="Stale — this reconciliation is not current"
                />
              </div>
            ) : null}
            <dl className="mt-3 grid max-w-xl grid-cols-[14rem_1fr] gap-x-4 gap-y-2 text-sm">
              {counts.map(([label, n, unit]) => (
                <div key={label} className="contents">
                  <dt className="font-medium">{label}</dt>
                  <dd>
                    {n} {unit}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-2">
              <FreshnessLabel
                asOfLabel={aggregate === 'stale' ? RECONCILIATION_STALE_AS_OF : RECONCILIATION_AS_OF}
                originLabel={RECONCILIATION_ORIGIN}
              />
            </div>
          </>
        )}
      </Section>

      <Section id="sa14-history" heading="Send history">
        <Table
          caption="Send history — every broadcast in its own state, against its stored snapshot"
          columns={[
            { key: 'subject', header: 'Subject' },
            { key: 'target', header: 'Target' },
            { key: 'channels', header: 'Channels' },
            { key: 'state', header: 'State' },
            { key: 'snapshot', header: 'Stored snapshot' },
          ]}
          loading={screenState === 'STATE-02'}
          {...(screenState === 'STATE-12'
            ? {
                error:
                  'The send history could not be read in this state. Nothing is treated as delivered while it cannot be read.',
              }
            : {})}
          rows={
            screenState === 'STATE-01'
              ? []
              : SEND_HISTORY.map((row) => ({
                  subject: row.subject,
                  target: row.target === 'all-tenant' ? 'Every tenant' : 'A single tenant',
                  channels: row.channels
                    .map((c) => NOTIF_CHANNELS.find((ch) => ch.id === c)?.name ?? c)
                    .join(' and '),
                  state: <StatusPill tone="neutral" icon="•" label={row.state} />,
                  snapshot: `${row.snapshotTenants} tenants · ${row.snapshotTakenAt}`,
                }))
          }
          emptyState={{
            title: 'No platform communication has been sent yet',
            whatCreatesIt:
              'A send from the composer above creates the first record. Nothing else on this console writes one.',
          }}
        />
        {screenState === 'STATE-13' ? (
          <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
            Recovering: per-recipient outcomes for BC-2202 are being reconciled against its stored
            snapshot again after a failure. Nothing is presented as reconciled until the whole
            audience has been read back.
          </p>
        ) : null}
      </Section>

      <Section id="sa14-resend" heading="Re-send after a partial failure">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          BC-2204 failed on the email channel. The in-app banner stayed present, the failure was
          recorded rather than hidden, and there is no second email vendor (FB-SA-07, L45682). A
          re-send goes against the snapshot already stored with the record.
        </p>
        <div className="mt-3">
          <Button {...resendProps} onClick={() => setResent(true)}>
            Re-send BC-2204
          </Button>
        </div>
        {resent ? (
          <p className="mt-3 max-w-prose text-sm">
            Re-sent against the stored audience snapshot for BC-2204 — 1 tenant. No new snapshot was
            created, per AC-SA-14-07 (L45684).
          </p>
        ) : null}
      </Section>

      <Section id="sa14-absent" heading="Controls that do not exist here">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Each of these is drawn as a note in the place a control would sit. None is a disabled
          control, because a disabled control implies an enabled state exists somewhere.
        </p>
        <ul className="mt-3 space-y-3">
          {NOTIF_ABSENT_CONTROLS.map((c) => (
            <li key={c.label}>
              <p className="text-sm font-medium">{c.label}</p>
              <ProhibitionNotice rendering={{ kind: 'absent', note: c.note }} />
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sa14-access" heading="Reaching tenant content from here">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Every row above names a tenant, and none of them opens one. Record-level tenant content is
          reachable only by requesting a session under a named access class, and every platform-side
          access appears in that tenant’s own audit stream and its Platform Access History screen.
        </p>
        <ul className="mt-2 list-disc pl-5 text-sm text-[var(--color-ink-muted)]">
          {ACCESS_CLASSES.map((c) => (
            <li key={c.id}>{c.name}</li>
          ))}
        </ul>
        <div className="mt-3">
          <Button onClick={() => setSessionOpen(true)}>Request a support session</Button>
        </div>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          A session is raised and held in{' '}
          <Link
            href="/super-admin/support-access/"
            className="text-[var(--color-primary)] underline"
          >
            Support Access
          </Link>
          .
        </p>
      </Section>

      {sessionOpen ? (
        <Section id="sa14-session" heading="Session request">
          <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
            This form requests a session; it does not open one, and this prototype opens nothing at
            all. A normal support session is read-only without exception, reason-required and
            ticket-linked, and the tenant ends it from its own banner (L16022, L9966). There is no
            extension control — a longer look is a new request with a fresh reason (D18, L56107).
          </p>
          <div className="mt-3 max-w-xl space-y-3">
            <Field
              label="Reason for the session"
              required
              {...(inputsDisabled ? { description: inputReason } : {})}
            >
              <textarea rows={2} disabled={inputsDisabled} className={INPUT_CLASS} />
            </Field>
            <Field
              label="Ticket reference"
              required
              {...(inputsDisabled ? { description: inputReason } : {})}
            >
              <input disabled={inputsDisabled} className={INPUT_CLASS} />
            </Field>
            <Button {...sessionProps} onClick={() => setSessionOpen(false)}>
              Submit session request
            </Button>
          </div>
        </Section>
      ) : null}

      <Section id="sa14-workflows" heading="Workflows this module renders">
        <ul className="mt-2 space-y-3 text-sm">
          {NOTIF_WORKFLOWS.map((w) => (
            <li key={w.id}>
              <p className="font-medium">
                {w.name} <span className="text-[var(--color-ink-subtle)]">({w.id})</span>
              </p>
              <p className="text-[var(--color-ink-muted)]">
                {w.actor} · {w.trigger}
              </p>
              <p className="text-[var(--color-ink-muted)]">Ends at: {w.terminalStates.join('; ')}.</p>
              <p className="text-xs text-[var(--color-ink-subtle)]">Matched by {w.matchedBy}.</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sa14-unspecified" heading="Unspecified in source">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Each affordance below is one the source does not define. It is named rather than invented:
          a plausible invented control reads back as a requirement.
        </p>
        <ul className="mt-3 space-y-3 text-sm">
          {NOTIF_UNSPECIFIED_IN_SOURCE.map((u) => (
            <li key={u.affordance}>
              <p className="font-medium">{u.affordance}</p>
              <p className="text-[var(--color-ink-muted)]">{u.note}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sa14-conflicts" heading="Conflicts in the source">
        <ul className="mt-3 space-y-3 text-sm">
          {NOTIF_SOURCE_CONFLICTS.map((c) => (
            <li key={c.topic}>
              <p className="font-medium">{c.topic}</p>
              <p className="text-[var(--color-ink-muted)]">{c.conflict}</p>
              <p className="text-[var(--color-ink-muted)]">Resolved as: {c.resolution}</p>
            </li>
          ))}
        </ul>
      </Section>
      <RootUnavailableFreeze actions={['all-tenant-broadcast']} />
    </SaConsoleShell>
  )
}
