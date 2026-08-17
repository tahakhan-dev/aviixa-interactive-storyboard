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
  FreshnessLabel,
  PermissionNotice,
  Select,
  SkeletonBlock,
  StatusPill,
  Table,
  type StatusTone,
} from '@/ui/primitives'
import { SaConsoleShell } from '../SaConsoleShell'
import {
  LADDER_EVENTS,
  LADDER_RUNGS,
  LADDER_STATES,
  LEDGER_TENANT_LABEL,
  METERING_DIMENSIONS,
  STORAGE_SERIES,
  TENANT_MONTH_USAGE,
  USAGE_ABSENT_CONTROLS,
  USAGE_AS_OF,
  USAGE_ORIGIN,
  USAGE_PLATFORM_ROLES,
  USAGE_SOURCE_CONFLICTS,
  USAGE_STALE_AS_OF,
  USAGE_UNSPECIFIED_IN_SOURCE,
  USAGE_WORKFLOWS,
  type LadderState,
} from './fixtures'

const MODULE = saModuleById('MOD-SA-12')

/** The twelve applicable states: all thirteen less the frontline-only STATE-07. */
const APPLICABLE_STATES = SCREEN_STATES.filter((s) => !s.frontlineOnly)

/** No backend, no clock — the policy layer is handed an empty seeded state. */
const FIXTURE_STATE = emptyDomainState(scenarioRunId('SA-12-USAGE-METERING'))

/**
 * What the ledger itself is doing, which is a separate axis from who is
 * looking. Driven through `evaluateAccess`'s object-state stage rather than
 * a hand-rolled `if`, so a state refusal is a typed decision like any other.
 */
type LedgerAvailability = 'available' | 'read-only' | 'unavailable'

function ledgerAvailability(state: ScreenStateId): LedgerAvailability {
  if (state === 'STATE-06') return 'read-only'
  if (state === 'STATE-12') return 'unavailable'
  return 'available'
}

/**
 * `AC-SA-01-03`: an aggregate renders with its as-of time, degrades to
 * stale-with-age or unavailable, and NEVER renders as zero or blank.
 * "Empty" is its own case and is a sentence, not the number nought.
 */
type AggregateMode = 'current' | 'stale' | 'unavailable' | 'loading' | 'empty'

function aggregateMode(state: ScreenStateId): AggregateMode {
  if (state === 'STATE-01') return 'empty'
  if (state === 'STATE-02') return 'loading'
  if (state === 'STATE-08') return 'stale'
  if (state === 'STATE-12') return 'unavailable'
  return 'current'
}

const LADDER_TONE: Record<LadderState, StatusTone> = {
  'under 80 percent': 'ok',
  'at 80 percent': 'info',
  'at 100 percent': 'attention',
  'in burst': 'attention',
  'above 125 percent flagged': 'blocked',
}

/** The named reason a drawn-but-inert control carries. Never a bare "denied". */
function namedReason(
  decision: PermissionDecision,
  role: RoleId,
  ledger: LedgerAvailability,
  action: 'export' | 'thresholds',
): string {
  if (decision.outcome === 'allowed') return ''
  if (decision.reasonCode === 'ROLE_NOT_GRANTED') {
    if (role === 'PLATFORM_ENGINEER') {
      return action === 'export'
        ? 'The ledger extract is a Band B commercial action. The source names its holders as the root and the Admin (L45385); the Platform Engineer carries Band A engineering work (L42713).'
        : 'Threshold-setting is a Band B operation. The source names the platform Admin as its holder (L57277), and the root operates the console in full (L1347).'
    }
    return 'Support is read-only on this console and makes no configuration change (L42715).'
  }
  if (ledger === 'unavailable') {
    return 'The usage ledger cannot be read in this state, so nothing can be drawn from it.'
  }
  if (ledger === 'read-only') return 'This screen is read-only in this state.'
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

export interface UsageMeteringScreenProps {
  /** View-switcher seed, not a login (spec §8). */
  readonly role?: RoleId
  readonly screenState?: ScreenStateId
}

export function UsageMeteringScreen({
  role: initialRole = 'ADMIN',
  screenState: initialScreenState = 'STATE-03',
}: UsageMeteringScreenProps = {}) {
  const [role, setRole] = useState<RoleId>(initialRole)
  const [screenState, setScreenState] = useState<ScreenStateId>(initialScreenState)
  const [exportRequested, setExportRequested] = useState(false)
  const [thresholdsSubmitted, setThresholdsSubmitted] = useState(false)

  const ledger = ledgerAvailability(screenState)
  const mode = aggregateMode(screenState)
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

  // Per-control allowed roles — never the module-level `roles_allowed`,
  // which D16 makes authoritative nowhere and which this module's own
  // extraction states seven different ways.
  const exportDecision = evaluateAccess(
    {
      action: 'MOD-SA-12:export-usage-ledger',
      allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN'],
      allowedObjectStates: ['available'],
      objectState: ledger,
      sourceRefs: ['L45385', 'L42713', 'L42715'],
    },
    context,
  )
  const thresholdDecision = evaluateAccess(
    {
      action: 'MOD-SA-12:set-ladder-thresholds',
      allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN'],
      allowedObjectStates: ['available'],
      objectState: ledger,
      sourceRefs: ['L57277', 'L1347', 'L42715'],
    },
    context,
  )
  // All four roles read every panel on this module (D16, L42742).
  const readDecision = evaluateAccess(
    {
      action: 'MOD-SA-12:read-usage',
      allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN', 'PLATFORM_ENGINEER', 'SUPPORT'],
      sourceRefs: ['L42746', 'L45389', 'L42742'],
    },
    context,
  )

  const exportProps =
    exportDecision.outcome === 'allowed'
      ? {}
      : { disabledReason: namedReason(exportDecision, role, ledger, 'export') }
  const thresholdProps =
    thresholdDecision.outcome === 'allowed'
      ? {}
      : { disabledReason: namedReason(thresholdDecision, role, ledger, 'thresholds') }

  const asOfLabel = mode === 'stale' ? USAGE_STALE_AS_OF : USAGE_AS_OF
  const showExportRequest = exportRequested || screenState === 'STATE-09'

  /** Shared degradation rendering for every aggregate on this screen. */
  function Aggregate({ label, children }: { readonly label: string; readonly children: ReactNode }) {
    if (mode === 'loading') return <SkeletonBlock lines={3} label={`Loading ${label}`} />
    if (mode === 'unavailable') {
      return (
        <p className="mt-2 text-sm">
          Unavailable — {label} could not be read. An aggregate that could not be read is never
          rendered as a count, and never left blank.
        </p>
      )
    }
    return (
      <>
        {children}
        <div className="mt-2">
          <FreshnessLabel asOfLabel={asOfLabel} originLabel={USAGE_ORIGIN} />
        </div>
      </>
    )
  }

  return (
    <SaConsoleShell module={MODULE}>
      <p className="text-xs text-[var(--color-ink-subtle)]">
        Screens annotated SCR-SA-18 (L42810, L45385), SCR-SA-15 in the second numbering scheme
        (L48744), and storyboards SB-SA-12, SB-45-08-01, SB-45-12-01 and SB-SA-USAGE-01. Names are
        canonical; the numbers are annotations only, and this route is keyed on the module slug.
      </p>

      <div className="mt-6 flex flex-wrap gap-6 rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4">
        <Select
          label="Console role (fixture)"
          value={role}
          onChange={(v) => setRole(v as RoleId)}
          options={USAGE_PLATFORM_ROLES.map((r) => ({
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
          no figure below is computed — each is a seeded fixture.
        </p>
      </div>

      <div className="mt-4 rounded-[var(--radius-surface)] bg-[var(--color-surface-sunken)] p-4 text-sm">
        <p className="font-medium">
          {stateDefinition.id} — {stateDefinition.name}
        </p>
        <p className="mt-1 text-[var(--color-ink-muted)]">{stateDefinition.contract}</p>
        <p className="mt-1 text-[var(--color-ink-muted)]">{stateDefinition.neverDo}</p>
      </div>

      {ledger === 'read-only' ? (
        <div className="mt-4">
          <Banner
            tone="attention"
            heading="Read-only"
            body="One cause: this fixture puts the usage ledger into a read-only state, so no extract and no threshold change can be submitted from it. Every panel below still reads."
          />
        </div>
      ) : null}

      <Section id="sa12-invariants" heading="Enforced invariants on this module">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Both render locked, with no off position for any account including the root. They are
          status readouts. There is no switch here, and no approval path around one.
        </p>
        <div className="mt-3 space-y-3">
          {SA_INVARIANTS.filter(
            (i) =>
              i.id === 'cross-tenant-analytics-anonymisation' ||
              i.id === 'one-transaction-audit-guarantee',
          ).map((i) => (
            <InvariantChip key={i.id} invariant={i} />
          ))}
        </div>
        <p className="mt-3 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          A distinction worth stating: the anonymisation invariant governs cross-tenant comparative
          analytics, which Tenant Metrics and Aggregates renders. A commercial ledger names the
          tenant because the tenant is the billed party. What it never names is anything inside the
          tenant — no worker, no site, no area, no calendar shift, no run.
        </p>
      </Section>

      <Section id="sa12-unit" heading="The Worker-Shift billing unit">
        <p className="mt-2 max-w-prose text-sm">
          A worker attached to work in one calendar shift meters exactly one Worker-Shift,
          regardless of run count (AC-GOAL-060, L2241).
        </p>
        <p className="mt-2 max-w-prose text-sm">
          Where a substitution occurs, each worker who actually performed work meters one
          (AC-GOAL-061, L2241). The source’s own worked example is arithmetic: three runs across two
          jobs in one calendar shift meter one; a substitution in that same shift meters two.
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          That example is stated in words and is deliberately not rendered as a row. A Worker-Shift
          is a unit on a commercial ledger — a count of what a tenant owes against its allocation.
          Rendered any finer, the same number becomes a measure of a named person, and that is not
          what this ledger is for. The allocation period is the calendar month (L2195), and the
          month is the finest grain this module holds.
        </p>
      </Section>

      <Section id="sa12-cross-tenant" heading="Cross-tenant usage table">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          One row per tenant per calendar month, against the allocation the published tier record
          carries. Consumption is a count, and the per-cent figure is a position on the usage
          ladder, not a rate: it has no time in its denominator.
        </p>
        <Aggregate label="the cross-tenant usage table">
          <Table
            caption="Worker-Shifts metered, by tenant and calendar month"
            columns={[
              { key: 'tenant', header: 'Tenant' },
              { key: 'month', header: 'Month' },
              { key: 'tier', header: 'Tier band' },
              { key: 'consumed', header: 'Worker-Shifts metered against allocation' },
              { key: 'ladder', header: 'Ladder state' },
              { key: 'source', header: 'Source' },
            ]}
            rows={
              mode === 'empty'
                ? []
                : TENANT_MONTH_USAGE.map((row) => ({
                    tenant: row.tenantLabel,
                    month: row.monthLabel,
                    tier: row.tierBand,
                    consumed: `${row.workerShifts} of ${row.allocationCeiling}`,
                    ladder: (
                      <StatusPill
                        tone={LADDER_TONE[row.ladderState]}
                        icon="•"
                        label={row.ladderState}
                      />
                    ),
                    source: row.sourceRef,
                  }))
            }
            emptyState={{
              title: 'No Worker-Shift has metered for any tenant in this period yet',
              whatCreatesIt:
                'A Worker-Shift meters when a worker attached to work completes work in a calendar shift on the Frontline Worker Application. Nothing on this console creates one.',
            }}
          />
        </Aggregate>
        <p className="mt-3 max-w-prose text-sm">
          A tenant name here is not a route into that tenant.{' '}
          <Link href="/super-admin/support-access/" className="text-[var(--color-primary)] underline">
            Request a named access session in Support Access
          </Link>{' '}
          — that session-request form is the only route to tenant content from this console.
        </p>
      </Section>

      <Section id="sa12-ledger" heading={`Per-tenant ledger — ${LEDGER_TENANT_LABEL}, July 2026`}>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The five metering dimensions of the event-sourced usage ledger (L45352, L45404). Late
          events are attributed to their event time, not their arrival time (AC-SA-12-07, L45456),
          which is why a month’s figures can still move after the month ends.
        </p>
        <Aggregate label="the per-tenant ledger">
          <Table
            caption="Metering dimensions for one tenant-month"
            columns={[
              { key: 'dimension', header: 'Dimension' },
              { key: 'count', header: 'Count for the tenant-month' },
              { key: 'note', header: 'What the count is' },
            ]}
            rows={METERING_DIMENSIONS.map((d) => ({
              dimension: d.name,
              count: d.countLabel,
              note: d.note,
            }))}
            emptyState={{
              title: 'Nothing has metered for this tenant in this month yet',
              whatCreatesIt: 'Operational events on the tenant’s own surfaces fold into the ledger.',
            }}
          />
        </Aggregate>
      </Section>

      <Section id="sa12-storage" heading="Storage dimensions">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Storage is metered across four dimensions (L96973, storyboard SB-45-12-01), each as a
          volume for the tenant-month.
        </p>
        <Aggregate label="the storage dimension series">
          <Table
            caption="Metered storage volume by dimension, for one tenant-month"
            columns={[
              { key: 'dimension', header: 'Dimension' },
              { key: 'month', header: 'Month' },
              { key: 'volume', header: 'Volume' },
            ]}
            rows={STORAGE_SERIES.map((s) => ({
              dimension: s.dimension,
              month: s.monthLabel,
              volume:
                screenState === 'STATE-10' && s.driftsUnderDegradation
                  ? 'Unreliable — the measured volume diverges from the stored volume, so the figure is withheld rather than shown wrong. A corrected meter and a re-derivation of the affected periods restore it (L97055).'
                  : s.volumeLabel,
            }))}
            emptyState={{
              title: 'No storage volume has metered for this tenant-month yet',
              whatCreatesIt: 'Evidence, packages, parts and training content accrue volume as they are stored.',
            }}
          />
        </Aggregate>
      </Section>

      <Section id="sa12-ladder" heading="Usage ladder">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Four rungs against the monthly Worker-Shift allocation. Every rung is a status. No ladder
          threshold blocks work; the strongest outcome is a flag (AC-SA-12-03, L45456).
        </p>
        <ol className="mt-3 space-y-3">
          {LADDER_RUNGS.map((rung) => (
            <li
              key={rung.threshold}
              className="rounded-[var(--radius-surface)] border border-[var(--color-border)] p-3"
            >
              <p className="text-sm font-medium">{rung.threshold}</p>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{rung.whatHappens}</p>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{rung.outcome}</p>
              <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">{rung.sourceRef}</p>
            </li>
          ))}
        </ol>
        <p className="mt-3 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          The five ladder states this module renders are {LADDER_STATES.join(', ')}
          {' '}(OBJ-SA-LADDERSTATE, L45404).
        </p>
      </Section>

      <Section id="sa12-events" heading="Ladder events">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          A threshold event fires once per crossing, not once per evaluation (WF-USAGE-LADDER,
          L117965), and burst entry is recorded as its own event (AC-SA-12-04, L45456).
        </p>
        <Table
          caption="Ladder events recorded in this period"
          columns={[
            { key: 'tenant', header: 'Tenant' },
            { key: 'month', header: 'Month' },
            { key: 'event', header: 'Event' },
            { key: 'source', header: 'Source' },
          ]}
          {...(mode === 'unavailable'
            ? { error: 'The ladder event list could not be read in this state. Nothing is treated as un-crossed while it cannot be read.' }
            : {})}
          rows={LADDER_EVENTS.map((e) => ({
            tenant: e.tenantLabel,
            month: e.monthLabel,
            event: e.event,
            source: e.sourceRef,
          }))}
          emptyState={{
            title: 'No ladder threshold has been crossed in this period',
            whatCreatesIt: 'A crossing of the 80, 100 or 125 per cent threshold records one event.',
          }}
        />
      </Section>

      <Section id="sa12-ceiling" heading="Allocation ceiling">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The ceiling every figure above is measured against comes from the published tier record,
          which this module reads and does not author. Changing it means publishing a tier version,
          and tier publication is a critical-class action.
        </p>
        <div className="mt-3">
          {role === 'ROOT_SUPER_ADMIN' ? (
            <ProhibitionNotice
              rendering={{
                kind: 'absent',
                note: 'No tier-publication control is offered on this module, for any account including the root. The submission and its root approval belong to Tiers, Entitlements and Caps (L56912, L55942).',
              }}
            />
          ) : (
            <ProhibitionNotice rendering={{ kind: 'class-badge' }} />
          )}
        </div>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          For every role but the root, the action bar here is the class badge and nothing else, so
          no control on this screen can be mistaken for an approval path (L23707).
        </p>
      </Section>

      <Section id="sa12-thresholds" heading="Ladder thresholds">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The ladder is tunable per tenant (L2197). The source names the platform Admin as the
          holder of threshold-setting (L57277, FUNC-SA-SET-THRESHOLDS); the root operates the
          console in full (L1347). The three defaults are 80, 100 and 125 per cent.
        </p>
        {screenState === 'STATE-04' ? (
          <p role="alert" className="mt-2 max-w-prose text-sm text-[var(--color-status-blocked)]">
            A threshold is a per cent of the monthly allocation. The source fixes the defaults at
            80, 100 and 125 and calls the ladder tunable, but states no permitted range and no
            ordering rule — so this fixture accepts only those three values, and the gap is named
            below rather than filled with an invented range.
          </p>
        ) : null}
        <div className="mt-3">
          <Button {...thresholdProps} onClick={() => setThresholdsSubmitted(true)}>
            Set the ladder thresholds
          </Button>
        </div>
        <div className="mt-2">
          <PermissionNotice decision={thresholdDecision} />
        </div>
        {thresholdsSubmitted ? (
          <p className="mt-2 text-sm">
            <StatusPill tone="info" icon="•" label="threshold change recorded" />
          </p>
        ) : null}
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          The three events always fire and cannot be switched off (L50334, L67322), so no mute, no
          suppress and no opt-out control is drawn for them.
        </p>
      </Section>

      <Section id="sa12-export" heading="Ledger export">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Produces the ledger extract for the client’s commercial systems, and the extract is itself
          an audited event (L45385). Its holders are the root and the Admin.
        </p>
        <div className="mt-3">
          <Button {...exportProps} onClick={() => setExportRequested(true)}>
            Export the usage ledger
          </Button>
        </div>
        <div className="mt-2">
          <PermissionNotice decision={exportDecision} />
        </div>
        {showExportRequest ? (
          <div className="mt-3">
            <StatusPill tone="info" icon="•" label="extract requested" />
            <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
              A request is shown in its own state. Nothing here claims the extract has reached a
              commercial system: no such system is connected to this storyboard.
            </p>
          </div>
        ) : null}
        {screenState === 'STATE-13' ? (
          <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
            Recovering: because the ledger is event-sourced, the affected periods are being
            re-derived from their events. Two of five dimensions have been re-derived so far, and
            nothing is presented as reconciled until all five are.
          </p>
        ) : null}
      </Section>

      <Section id="sa12-absent" heading="Controls that do not exist here">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Each of these is drawn as a note in the place a control would sit. None is a disabled
          control, because a disabled control implies an enabled state exists somewhere.
        </p>
        <ul className="mt-3 space-y-3">
          {USAGE_ABSENT_CONTROLS.map((c) => (
            <li key={c.label}>
              <p className="text-sm font-medium">{c.label}</p>
              <ProhibitionNotice rendering={{ kind: 'absent', note: c.note }} />
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sa12-workflows" heading="Workflows this module renders">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The extraction attaches no module identifier to any workflow, so each row states how it
          was matched to this module.
        </p>
        <ul className="mt-3 space-y-3 text-sm">
          {USAGE_WORKFLOWS.map((w) => (
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

      <Section id="sa12-access" heading="Reaching tenant content from here">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Every figure on this screen has a tenant behind it, and none of them opens. There is no
          ambient browsing anywhere on this console (AC-SA-000-07, AC-SEC-801): tenant content is
          reachable only by requesting a session under one of the three named access classes.
        </p>
        <ul className="mt-2 list-disc pl-5 text-sm text-[var(--color-ink-muted)]">
          {ACCESS_CLASSES.map((c) => (
            <li key={c.id}>{c.name}</li>
          ))}
        </ul>
        <div className="mt-2">
          <PermissionNotice decision={readDecision} />
        </div>
      </Section>

      <Section id="sa12-unspecified" heading="Unspecified in source">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Each affordance below is one the source does not define. It is named rather than invented:
          a plausible invented control reads back as a requirement.
        </p>
        <ul className="mt-3 space-y-3 text-sm">
          {USAGE_UNSPECIFIED_IN_SOURCE.map((u) => (
            <li key={u.affordance}>
              <p className="font-medium">{u.affordance}</p>
              <p className="text-[var(--color-ink-muted)]">{u.note}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sa12-conflicts" heading="Conflicts in the source">
        <ul className="mt-3 space-y-3 text-sm">
          {USAGE_SOURCE_CONFLICTS.map((c) => (
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
