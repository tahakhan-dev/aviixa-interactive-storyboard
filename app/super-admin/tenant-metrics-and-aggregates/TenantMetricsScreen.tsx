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
import { SCREEN_STATES, type ScreenStateId } from '@/ui/screen-state'
import { InvariantChip } from '@/ui/sa/InvariantChip'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'
import {
  Banner,
  Button,
  EmptyState,
  FreshnessLabel,
  Select,
  SkeletonBlock,
  StatusPill,
  Table,
  Tabs,
  Field,
  type StatusTone,
} from '@/ui/primitives'
import { SaConsoleShell } from '../SaConsoleShell'
import {
  SA10_ABSENT_CONTROLS,
  SA10_CONFLICTS,
  SA10_DISTRIBUTION,
  SA10_DISTRIBUTION_AS_OF,
  SA10_DISTRIBUTION_ORIGIN,
  SA10_MEASURES,
  SA10_OVERRIDE_CLUSTERS,
  SA10_PERMITTED_DIMENSIONS,
  SA10_PLATFORM_ROLES,
  SA10_PROHIBITED_DIMENSIONS,
  SA10_STALE_AS_OF,
  SA10_STALE_ORIGIN,
  SA10_TENANT_MONTHS,
  SA10_TENANTS,
  SA10_UNSPECIFIED_IN_SOURCE,
  SA10_WORKFLOWS,
  type MetricState,
} from './fixtures'

const MODULE = saModuleById('MOD-SA-10')

/** The twelve applicable states: all thirteen less the frontline-only STATE-07. */
const APPLICABLE_STATES = SCREEN_STATES.filter((s) => !s.frontlineOnly)

/** No backend, no clock — the policy layer is handed an empty seeded state. */
const FIXTURE_STATE = emptyDomainState(scenarioRunId('SA-10-TENANT-METRICS'))

const ANONYMISATION_INVARIANT = SA_INVARIANTS.find(
  (i) => i.id === 'cross-tenant-analytics-anonymisation',
)

/**
 * `OBJ-SA-METRIC`'s four states (L45180), driven off the seeded screen state
 * rather than computed. FB-SA-01 (L45228) is the whole of the ladder: stale
 * with its age, then narrowed, then "measure unavailable" — and a zero is
 * never rendered for a missing measure.
 */
function metricState(state: ScreenStateId): MetricState {
  if (state === 'STATE-08') return 'stale'
  if (state === 'STATE-12') return 'unavailable'
  if (state === 'STATE-13') return 'reconciled'
  return 'current'
}

function metricTone(state: MetricState): StatusTone {
  if (state === 'stale') return 'stale'
  if (state === 'unavailable') return 'blocked'
  if (state === 'reconciled') return 'info'
  return 'ok'
}

/**
 * The named reason a drawn-but-inert control carries. Never a bare "denied",
 * and never a reason that implies an approval path exists where none does.
 */
function namedReason(decision: PermissionDecision, role: RoleId): string {
  if (decision.outcome === 'allowed') return ''
  if (role === 'PLATFORM_ENGINEER') {
    return 'Not available to the Platform Engineer. D17 records the direct conflict — L20740 forbids this role a support session, L65401 allows one — and resolves it by holding the prohibition, while L97154 puts tenant operational content in this role’s may-not list on this surface. L107350 attributes the onward action to this role; that attribution is not honoured here, and the conflict is stated in full below.'
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

export interface TenantMetricsScreenProps {
  /** View-switcher seed, not a login (spec §8). */
  readonly role?: RoleId
  readonly screenState?: ScreenStateId
}

export function TenantMetricsScreen({
  role: initialRole = 'ADMIN',
  screenState: initialScreenState = 'STATE-03',
}: TenantMetricsScreenProps = {}) {
  const [role, setRole] = useState<RoleId>(initialRole)
  const [screenState, setScreenState] = useState<ScreenStateId>(initialScreenState)
  const [tab, setTab] = useState<'per-tenant' | 'comparative'>('per-tenant')
  const [tenant, setTenant] = useState<string>(SA10_TENANTS[0].id)
  const [period, setPeriod] = useState<string>(SA10_TENANT_MONTHS[2].id)
  const [requestOpen, setRequestOpen] = useState(false)
  // STATE-04 is the seeded validation step: the reason arrives unset, and the
  // submit names the rule rather than refusing silently.
  const [reason, setReason] = useState<string>(
    initialScreenState === 'STATE-04' ? '' : 'Ticket TCK-4471 — tenant reports a measure they cannot reconcile',
  )
  const [ticket, setTicket] = useState<string>('TCK-4471')
  const [requestSubmitted, setRequestSubmitted] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)

  const measures = metricState(screenState)
  const stateDefinition = SCREEN_STATES.find((s) => s.id === screenState) ?? SCREEN_STATES[0]
  const tenantName = SA10_TENANTS.find((t) => t.id === tenant)?.name ?? tenant
  const periodLabel = SA10_TENANT_MONTHS.find((p) => p.id === period)?.label ?? period

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

  // Per-control allowed roles, never the module-level `roles_allowed` (D16).
  //
  // The two onward actions L107350 names are the ONLY controls the source
  // defines for this module beyond the tenant and period filters. L107350
  // attributes both to the Platform Engineer; L97154 and D17 put that role
  // outside a support session, and the roles that may reach tenant content
  // through a named, audited access class are the root (L97152), the Admin
  // (L97153) and Support (L97155). That is the list used here, and the
  // conflict is stated on screen rather than resolved silently.
  const ONWARD_ROLES: readonly RoleId[] = ['ROOT_SUPER_ADMIN', 'ADMIN', 'SUPPORT']
  const sessionDecision = evaluateAccess(
    {
      action: 'MOD-SA-10:request-support-session',
      allowedRoles: ONWARD_ROLES,
      sourceRefs: ['L107350', 'L97152', 'L97153', 'L97155', 'DEC — D17', 'L20740', 'L65401'],
    },
    context,
  )
  const auditViewDecision = evaluateAccess(
    {
      action: 'MOD-SA-10:open-tenant-audit-log-view',
      allowedRoles: ONWARD_ROLES,
      sourceRefs: ['L107350', 'AC-SA-000-07 L42885', 'AC-SEC-801 L104316', 'L97154'],
    },
    context,
  )
  const readDecision = evaluateAccess(
    {
      action: 'MOD-SA-10:read-measures',
      allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN', 'PLATFORM_ENGINEER', 'SUPPORT'],
      sourceRefs: ['L45164', 'L97152', 'L97153', 'L97154', 'L97155'],
    },
    context,
  )

  const sessionDisabled = sessionDecision.outcome !== 'allowed'
  const sessionProps = sessionDisabled ? { disabledReason: namedReason(sessionDecision, role) } : {}
  const auditDisabled = auditViewDecision.outcome !== 'allowed'
  const auditProps = auditDisabled ? { disabledReason: namedReason(auditViewDecision, role) } : {}

  /**
   * L97152–L97155: for every console role tenant memory content reads
   * "Unavailable — counts and volume only", and for Support the source does
   * not soften it at all. This is a READOUT for all four roles; no control
   * exists behind it for any of them.
   */
  const memoryReadout = role === 'SUPPORT' ? 'Unavailable' : 'Unavailable — counts and volume only'

  function submitRequest() {
    if (reason.trim() === '') {
      setRequestError(
        'A session request states its reason. The rule: every platform-side access is reason-required and ticket-linked (L97155), so a request with an empty reason is not accepted. A sentence naming what the session is for is accepted.',
      )
      setRequestSubmitted(false)
      return
    }
    setRequestError(null)
    setRequestSubmitted(true)
  }

  return (
    <SaConsoleShell module={MODULE}>
      <p className="text-xs text-[var(--color-ink-subtle)]">
        Screen annotated SCR-SA-16, with storyboard SB-SA-10 (L42808, L45160). Names are canonical;
        the numbers are annotations only, and this route is keyed on the module slug.
      </p>

      <div className="mt-6 flex flex-wrap gap-6 rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4">
        <Select
          label="Console role (fixture)"
          value={role}
          onChange={(v) => setRole(v as RoleId)}
          options={SA10_PLATFORM_ROLES.map((r) => ({
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
        <Select
          label="Tenant"
          value={tenant}
          onChange={setTenant}
          options={SA10_TENANTS.map((t) => ({ value: t.id, label: t.name }))}
        />
        <Select
          label="Period (tenant-month)"
          value={period}
          onChange={setPeriod}
          options={SA10_TENANT_MONTHS.map((p) => ({ value: p.id, label: p.label }))}
        />
        <p className="max-w-prose text-xs text-[var(--color-ink-subtle)]">
          The role control is a view switcher, not a login. The period control offers whole
          tenant-months and nothing finer: a grain offered once is a grain someone asks to break
          down, and the line on this surface holds at the tenant.
        </p>
      </div>

      <div className="mt-4 rounded-[var(--radius-surface)] bg-[var(--color-surface-sunken)] p-4 text-sm">
        <p className="font-medium">
          {stateDefinition.id} — {stateDefinition.name}
        </p>
        <p className="mt-1 text-[var(--color-ink-muted)]">{stateDefinition.contract}</p>
        <p className="mt-1 text-[var(--color-ink-muted)]">{stateDefinition.neverDo}</p>
      </div>

      {screenState === 'STATE-06' ? (
        <div className="mt-4">
          <Banner
            tone="attention"
            heading="Read-only"
            body="One cause: every object on this module is derived and never authored, so nothing here is writable by any role in any state. This banner names that cause once."
          />
        </div>
      ) : null}

      {screenState === 'STATE-05' ? (
        <div className="mt-4">
          {/*
            The refusal is stated, never hidden behind a missing control. It
            is written here rather than passed through `PermissionNotice`
            because that primitive renders the shared policy explanation
            verbatim, and one of those strings contains the word "signed" in
            the sense of being logged in — a word D10 bans on this surface in
            an entirely different sense (an audit-integrity claim). Rendering
            it would defeat the forbidden-word gate on a word form the gate is
            not written to catch, which is worse than restating the refusal in
            this module's own words.
          */}
          <Banner
            tone="attention"
            heading="This role does not carry the action"
            body={
              readDecision.outcome === 'allowed'
                ? 'Every one of the four console roles reads every measure and every comparative on this module. The only refusals here are the two onward actions from a measure, and each is drawn inert with its own reason beside it — naming the roles that do carry it: the root, the Admin and Support.'
                : readDecision.explanation
            }
          />
        </div>
      ) : null}

      {screenState === 'STATE-10' || screenState === 'STATE-11' ? (
        <div className="mt-4">
          <Banner
            tone="info"
            heading={
              screenState === 'STATE-11'
                ? 'Every artificial-intelligence model is unavailable'
                : 'Artificial intelligence is degraded'
            }
            body="This module continues unchanged. Every measure and every comparative on this screen is derived from telemetry, not from a model, so nothing here is cached guidance and nothing here is presented as live artificial intelligence."
          />
        </div>
      ) : null}

      <Section id="sa10-invariant" heading="Enforced invariant on this module">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Anonymisation precedes aggregation, and cannot be disabled by any account including the
          root (AC-SA-10-03, L45230; L45179). It is a status readout. There is no switch here, no
          configuration key and no approval path around one.
        </p>
        <div className="mt-3">
          {ANONYMISATION_INVARIANT === undefined ? null : (
            <InvariantChip invariant={ANONYMISATION_INVARIANT} />
          )}
        </div>
      </Section>

      <div className="mt-8">
        <Tabs
          tabs={[
            { id: 'per-tenant', label: 'Per tenant' },
            { id: 'comparative', label: 'Anonymised comparative' },
          ]}
          activeId={tab}
          onChange={(id) => setTab(id === 'comparative' ? 'comparative' : 'per-tenant')}
        />
      </div>

      {tab === 'per-tenant' ? (
        <Section id="sa10-measures" heading="Per-tenant measures">
          <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
            {tenantName}, {periodLabel}. The source fixes fifteen named per-tenant measures at
            L45134 and L107244 and names one of them — the override-patterns measure AC-SA-10-04
            governs. The other fourteen are named as unspecified below rather than invented. No
            measure exposes operational content, and that boundary sits in the pipeline rather than
            in this screen (AC-SA-10-02, L45230).
          </p>

          {screenState === 'STATE-02' ? (
            <div className="mt-3">
              <SkeletonBlock lines={3} label="Loading the per-tenant measures for this tenant-month" />
            </div>
          ) : screenState === 'STATE-01' ? (
            <div className="mt-3">
              <EmptyState
                title="No tenant-month has closed for this tenant yet"
                whatCreatesIt="Tenant operations generate events; the telemetry pipeline aggregates them into layer-one measures once a tenant-month closes. Nothing on this console authors a measure, so no creating control is offered here."
              />
            </div>
          ) : measures === 'unavailable' ? (
            <div className="mt-3">
              <p role="note" className="text-sm">
                Measure unavailable — the aggregation for this tenant-month could not be read. An
                unavailable measure is never rendered as a count and never left blank (FB-SA-01,
                L45228).
              </p>
            </div>
          ) : (
            <ul className="mt-3 space-y-4">
              {SA10_MEASURES.map((m) => (
                <li
                  key={m.id}
                  className="rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4"
                >
                  <p className="font-medium">{m.name}</p>
                  <p className="mt-1 text-2xl" data-measure-value={m.id}>
                    {m.value}
                  </p>
                  <StatusPill tone={metricTone(measures)} icon="•" label={measures} />
                  <dl className="mt-2 grid max-w-2xl grid-cols-[12rem_1fr] gap-x-4 gap-y-1 text-sm">
                    <dt className="font-medium">Comparison window</dt>
                    <dd>{m.comparisonWindow}</dd>
                    <dt className="font-medium">Completeness</dt>
                    <dd>
                      {measures === 'reconciled'
                        ? 'Re-aggregated over the gap window; the degraded window is recorded and this figure is being reconciled against what was previously reported.'
                        : m.completeness}
                    </dd>
                  </dl>
                  <div className="mt-2">
                    <FreshnessLabel
                      asOfLabel={measures === 'stale' ? SA10_STALE_AS_OF : m.asOf}
                      originLabel={measures === 'stale' ? SA10_STALE_ORIGIN : m.origin}
                    />
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">Source: {m.sourceRef}</p>
                </li>
              ))}
            </ul>
          )}

          {measures === 'stale' ? (
            <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
              Last-known-good, stamped with its age. The ladder is stale-with-age, then per-tenant
              primaries without roll-up, then measure unavailable — a missing measure never becomes
              a zero (FB-SA-01, L45228).
            </p>
          ) : null}

          {measures !== 'unavailable' && screenState !== 'STATE-01' && screenState !== 'STATE-02' ? (
            <div className="mt-4">
              <Table
                caption="Override clustering for this tenant-month — counts only, never record contents"
                columns={[
                  { key: 'dimension', header: 'Dimension' },
                  { key: 'count', header: 'Count in the month' },
                ]}
                rows={SA10_OVERRIDE_CLUSTERS.map((c) => ({
                  dimension: c.dimension,
                  count: c.count,
                }))}
                emptyState={{
                  title: 'No override was recorded for this tenant-month',
                  whatCreatesIt:
                    'An override recorded inside a tenant’s own operations raises the count. Nothing on this console creates one.',
                }}
              />
              <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
                The override audit answers frequency and clustering and never returns record
                contents (AC-SA-10-04, L45230). Every figure is a count within one tenant-month.
              </p>
            </div>
          ) : null}
        </Section>
      ) : (
        <Section id="sa10-comparative" heading="Anonymised comparative">
          <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
            A distribution, derived and never authored (L45179). No tenant is named in a comparative
            view for any role including the root, and the anonymisation happens before the
            aggregation rather than after it, so there is no earlier state any account could return
            to.
          </p>
          {screenState === 'STATE-02' ? (
            <div className="mt-3">
              <SkeletonBlock lines={3} label="Loading the anonymised comparative distribution" />
            </div>
          ) : measures === 'unavailable' ? (
            <div className="mt-3">
              <Banner
                tone="blocked"
                heading="Comparative unavailable"
                body="Where anonymisation cannot be guaranteed for a comparative view, the view renders unavailable rather than degrading to named data (FB-SA-01, L45228). Nothing is shown narrowed, nothing is shown as a zero, and no tenant is named as a substitute."
              />
            </div>
          ) : (
            <>
              <ul className="mt-3 space-y-2">
                {SA10_DISTRIBUTION.map((band) => (
                  <li
                    key={band.id}
                    data-distribution-band={band.id}
                    className="flex items-baseline justify-between rounded-[var(--radius-surface)] border border-[var(--color-border)] p-3 text-sm"
                  >
                    <span>{band.band}</span>
                    <span>{band.tenantCount}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2">
                <FreshnessLabel
                  asOfLabel={measures === 'stale' ? SA10_STALE_AS_OF : SA10_DISTRIBUTION_AS_OF}
                  originLabel={measures === 'stale' ? SA10_STALE_ORIGIN : SA10_DISTRIBUTION_ORIGIN}
                />
              </div>
              <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
                Each band carries a count of tenants and nothing else — no ranking, no position, no
                identifier. The distribution object carries no states at all in the source, because
                it is derived on every read.
              </p>
            </>
          )}
        </Section>
      )}

      <Section id="sa10-onward" heading="Onward actions from a measure">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The source names exactly two onward actions from a measure (L107350), and neither of them
          opens tenant content from this console. Both resolve to a session request under a named
          access class. There is no ambient browsing anywhere on this surface (AC-SA-000-07,
          AC-SEC-801).
        </p>
        <div className="mt-3 flex flex-wrap items-start gap-4">
          <Button {...sessionProps} onClick={() => setRequestOpen(true)}>
            Request a support session
          </Button>
          <Button {...auditProps} onClick={() => setRequestOpen(true)}>
            Open the tenant’s own audit log view
          </Button>
        </div>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The second action opens the same session-request form as the first. A tenant’s own audit
          log is tenant content, so it is reachable only inside a named session, and it is that
          tenant’s own record — the platform audit stream is a separate view in MOD-SA-18.
        </p>
        <ul className="mt-3 list-disc pl-5 text-sm text-[var(--color-ink-muted)]">
          {ACCESS_CLASSES.map((c) => (
            <li key={c.id}>{c.name}</li>
          ))}
        </ul>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          A session is raised and held in{' '}
          <Link href="/super-admin/support-access/" className="text-[var(--color-primary)] underline">
            Support Access
          </Link>
          . Every platform-side access appears in that tenant’s own audit stream and its Platform
          Access History screen.
        </p>
      </Section>

      {requestOpen && !sessionDisabled ? (
        <Section id="sa10-session-request" heading="Session request">
          <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
            This form requests a session; it does not open one, and this prototype opens nothing at
            all. A normal support session is read-only without exception, reason-required and
            ticket-linked, carries a default two-hour time box, and the tenant ends it from its own
            banner (L97155, L16022, L9966).
          </p>
          <div className="mt-3 max-w-xl space-y-3">
            <Field
              label="Reason for the session"
              required
              {...(requestError !== null ? { error: requestError } : {})}
            >
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-2 text-sm"
              />
            </Field>
            <Field label="Ticket reference" required>
              <input
                value={ticket}
                onChange={(e) => setTicket(e.target.value)}
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-2 text-sm"
              />
            </Field>
            <p className="text-sm">
              Tenant: {tenantName}. Time box: the stated default of two hours. There is no extension
              control — a longer look is a new request with a fresh reason (D18, L56107).
            </p>
            <Button onClick={submitRequest}>Submit session request</Button>
          </div>
          {requestError !== null ? (
            <p role="alert" className="mt-2 text-sm text-[var(--color-status-blocked)]">
              {requestError}
            </p>
          ) : null}
          {requestSubmitted ? (
            <div className="mt-3">
              <StatusPill tone="info" icon="•" label="Request pending — nothing has been opened" />
              <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-subtle)]">
                An accepted request is shown in its own state and never as a granted session. In
                this storyboard no session exists to grant, and no tenant record is reachable from
                this screen in any state.
              </p>
            </div>
          ) : null}
          <div className="mt-3">
            <ProhibitionNotice
              rendering={{
                kind: 'absent',
                note: 'No export exists from inside a session, and no extension exists for one (D18). Neither is drawn here as a disabled control, because neither exists for any account.',
              }}
            />
          </div>
        </Section>
      ) : null}

      <Section id="sa10-memory" heading="Tenant memory content">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          What this console can read of a tenant’s memory, for the role selected above (L97152 to
          L97155).
        </p>
        <p className="mt-2 text-sm font-medium">{memoryReadout}</p>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The readout is the same for the root as for every other console role. Profile memory holds
          aggregates only, and an individual-level profile record cannot be created (AC-SA-04-05,
          L43627). No control sits behind this readout for any role, because there is nothing behind
          it to reach.
        </p>
      </Section>

      <Section id="sa10-dimensions" heading="What a measure may be dimensioned by">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The cardinality allow-list is validated at emission, and an emission carrying a prohibited
          dimension fails the build rather than being dropped at runtime (L107315, AC-4810 L107368).
          This console renders the tenant grain and the tenant-month period only; the finer
          dimensions the pipeline permits are not offered as a breakdown anywhere on this screen.
        </p>
        <p className="mt-3 text-sm font-medium">Permitted at emission</p>
        <ul className="mt-1 list-disc pl-5 text-sm text-[var(--color-ink-muted)]">
          {SA10_PERMITTED_DIMENSIONS.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm font-medium">Refused at emission</p>
        <ul className="mt-1 list-disc pl-5 text-sm text-[var(--color-ink-muted)]">
          {SA10_PROHIBITED_DIMENSIONS.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </Section>

      <Section id="sa10-absent" heading="Controls that do not exist here">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Each of these is drawn as a note in the place a control would sit. None is a disabled
          control, because a disabled control implies an enabled state exists somewhere.
        </p>
        <ul className="mt-3 space-y-3">
          {SA10_ABSENT_CONTROLS.map((c) => (
            <li key={c.label}>
              <p className="text-sm font-medium">{c.label}</p>
              <ProhibitionNotice rendering={{ kind: 'absent', note: c.note }} />
            </li>
          ))}
        </ul>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          No critical-class action originates on this module. Every object it renders is derived and
          never authored, so none of the eleven actions that escalate to the root is reachable from
          this screen and no class badge replaces an action bar here. The eleven live in the modules
          that originate them.
        </p>
      </Section>

      <Section id="sa10-workflows" heading="Workflows this module renders">
        <ul className="mt-2 space-y-3 text-sm">
          {SA10_WORKFLOWS.map((w) => (
            <li key={w.id}>
              <p className="font-medium">{w.name}</p>
              <p className="text-[var(--color-ink-subtle)]">{w.id}</p>
              <p className="text-[var(--color-ink-muted)]">
                {w.actor} · {w.trigger}
              </p>
              <p className="text-[var(--color-ink-muted)]">Ends at: {w.terminalStates.join('; ')}.</p>
              <p className="text-xs text-[var(--color-ink-subtle)]">Matched by {w.matchedBy}.</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sa10-unspecified" heading="Unspecified in source">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Each affordance below is one the source does not define. It is named rather than invented:
          a plausible invented control reads back as a requirement.
        </p>
        <ul className="mt-3 space-y-3 text-sm">
          {SA10_UNSPECIFIED_IN_SOURCE.map((u) => (
            <li key={u.affordance}>
              <p className="font-medium">{u.affordance}</p>
              <p className="text-[var(--color-ink-muted)]">{u.note}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sa10-conflicts" heading="Conflicts in the source">
        <ul className="mt-3 space-y-3 text-sm">
          {SA10_CONFLICTS.map((c) => (
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
