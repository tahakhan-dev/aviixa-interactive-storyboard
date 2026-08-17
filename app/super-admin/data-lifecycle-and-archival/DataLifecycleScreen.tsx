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
import { COMMAND_STATES, type CommandState } from '@/surfaces/sa/command-state'
import { SCREEN_STATES, type ScreenStateId } from '@/ui/screen-state'
import { InvariantChip } from '@/ui/sa/InvariantChip'
import { CommandStateBadge } from '@/ui/sa/CommandStateBadge'
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
  ANONYMISATION_HORIZON_LABEL,
  ARCHIVE_REACTIVATION_BANDS,
  CLOSURE_SEQUENCE,
  ERASURE_REQUESTS,
  ERASURE_STEPS,
  LEGAL_HOLDS,
  LEGAL_HOLD_STATES,
  LIFECYCLE_ABSENT_CONTROLS,
  LIFECYCLE_AREAS,
  LIFECYCLE_AS_OF,
  LIFECYCLE_ORIGIN,
  LIFECYCLE_PLATFORM_ROLES,
  LIFECYCLE_SOURCE_CONFLICTS,
  LIFECYCLE_STALE_AS_OF,
  LIFECYCLE_UNSPECIFIED_IN_SOURCE,
  LIFECYCLE_WORKFLOWS,
  RETENTION_DEFAULT_LABEL,
  RETENTION_POSTURES,
  TIERING_OUTCOMES,
  UPCOMING_ANONYMISATION,
  type LegalHoldState,
} from './fixtures'

const MODULE = saModuleById('MOD-SA-17')

/** The twelve applicable states: all thirteen less the frontline-only STATE-07. */
const APPLICABLE_STATES = SCREEN_STATES.filter((s) => !s.frontlineOnly)

/** No backend, no clock — the policy layer is handed an empty seeded state. */
const FIXTURE_STATE = emptyDomainState(scenarioRunId('SA-17-DATA-LIFECYCLE'))

/**
 * What the lifecycle surface itself is doing, which is a separate axis from
 * who is looking. Driven through `evaluateAccess`'s object-state stage rather
 * than a hand-rolled `if`, so a state refusal is a typed decision like any
 * other. STATE-11 is deliberately NOT in this list: with every model
 * unavailable the module stays fully operable (`AC-SA-000-09`), because no
 * model participates in retention, tiering, holds, anonymisation or erasure.
 */
type SurfaceAvailability = 'available' | 'read-only' | 'unavailable'

function surfaceAvailability(state: ScreenStateId): SurfaceAvailability {
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

const HOLD_TONE: Record<LegalHoldState, StatusTone> = {
  placed: 'info',
  'in force': 'attention',
  released: 'neutral',
}

/** The named reason a drawn-but-inert control carries. Never a bare "denied". */
function namedReason(
  decision: PermissionDecision,
  role: RoleId,
  surface: SurfaceAvailability,
): string {
  if (decision.outcome === 'allowed') return ''
  if (decision.reasonCode === 'ROLE_NOT_GRANTED') {
    if (role === 'PLATFORM_ENGINEER') {
      return 'The erasure draft is a Band B compliance action. The source names the Admin as its drafter and the Root Super Admin as its approver (L45997); the Platform Engineer carries Band A engineering work (L42713).'
    }
    return 'Support is read-only on this console and drafts no compliance action (L42715). The Admin drafts an erasure request and the Root Super Admin approves it (L45997).'
  }
  if (surface === 'unavailable') {
    return 'The lifecycle surface cannot be read in this state, so nothing can be drafted against it.'
  }
  if (surface === 'read-only') return 'This screen is read-only in this state.'
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

export interface DataLifecycleScreenProps {
  /** View-switcher seed, not a login (spec §8). */
  readonly role?: RoleId
  readonly screenState?: ScreenStateId
}

export function DataLifecycleScreen({
  role: initialRole = 'ADMIN',
  screenState: initialScreenState = 'STATE-03',
}: DataLifecycleScreenProps = {}) {
  const [role, setRole] = useState<RoleId>(initialRole)
  const [screenState, setScreenState] = useState<ScreenStateId>(initialScreenState)
  const [erasureDrafted, setErasureDrafted] = useState(false)
  const [holdPlaced, setHoldPlaced] = useState(false)
  const [retentionSubmitted, setRetentionSubmitted] = useState(false)
  const [commandIndex, setCommandIndex] = useState(0)

  const surface = surfaceAvailability(screenState)
  const mode = aggregateMode(screenState)
  const stateDefinition = SCREEN_STATES.find((s) => s.id === screenState) ?? SCREEN_STATES[0]
  const isRoot = role === 'ROOT_SUPER_ADMIN'
  const commandState: CommandState = COMMAND_STATES[commandIndex] ?? COMMAND_STATES[0]

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

  // Per-control allowed roles — never the module-level `roles_allowed`, which
  // D16 makes authoritative nowhere.
  const erasureDraftDecision = evaluateAccess(
    {
      action: 'MOD-SA-17:draft-erasure-request',
      allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN'],
      allowedObjectStates: ['available'],
      objectState: surface,
      sourceRefs: ['L45997', 'L97663', 'L42713', 'L42715'],
    },
    context,
  )
  const holdDecision = evaluateAccess(
    {
      action: 'MOD-SA-17:place-or-release-legal-hold',
      allowedRoles: ['ROOT_SUPER_ADMIN'],
      allowedObjectStates: ['available'],
      objectState: surface,
      sourceRefs: ['L117354', 'L46016', 'L55942'],
    },
    context,
  )
  const retentionDecision = evaluateAccess(
    {
      action: 'MOD-SA-17:change-retention-value',
      allowedRoles: ['ROOT_SUPER_ADMIN'],
      allowedObjectStates: ['available'],
      objectState: surface,
      sourceRefs: ['L4718', 'L97327', 'L55942'],
    },
    context,
  )
  // All four roles read every panel on this module (D16, L42742).
  const readDecision = evaluateAccess(
    {
      action: 'MOD-SA-17:read-data-lifecycle',
      allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN', 'PLATFORM_ENGINEER', 'SUPPORT'],
      sourceRefs: ['L42742', 'L45997', 'L74820'],
    },
    context,
  )

  const draftProps =
    erasureDraftDecision.outcome === 'allowed'
      ? {}
      : { disabledReason: namedReason(erasureDraftDecision, role, surface) }
  const holdProps =
    holdDecision.outcome === 'allowed'
      ? {}
      : {
          disabledReason:
            surface === 'read-only'
              ? 'This screen is read-only in this state, so no hold can be placed or released from it.'
              : 'The legal-hold surface cannot be read in this state, so no hold can be placed or released against it.',
        }
  const retentionProps =
    retentionDecision.outcome === 'allowed'
      ? {}
      : {
          disabledReason:
            surface === 'read-only'
              ? 'This screen is read-only in this state, so the horizon cannot be changed from it.'
              : 'The retention posture cannot be read in this state, so it cannot be changed against it.',
        }

  const asOfLabel = mode === 'stale' ? LIFECYCLE_STALE_AS_OF : LIFECYCLE_AS_OF

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
          <FreshnessLabel asOfLabel={asOfLabel} originLabel={LIFECYCLE_ORIGIN} />
        </div>
      </>
    )
  }

  return (
    <SaConsoleShell module={MODULE}>
      <p className="text-xs text-[var(--color-ink-subtle)]">
        Screen annotated SCR-SA-24 (L42816, L45997), with storyboards SB-SA-17, SB-RET-01 (L74820),
        SB-45-15-01, SB-45-16-01, SB-45-17-01, SB-45-18-01, SB-SA-RETENTION-01 and the lifecycle
        scheduler dashboard DASH-SCHED-06 (L101244). Names are canonical; the numbers are
        annotations only, and this route is keyed on the module slug.
      </p>
      <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
        The five areas this screen is closed at: {LIFECYCLE_AREAS.join(', ')} (L45997, L46001).
      </p>

      <div className="mt-6 flex flex-wrap gap-6 rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4">
        <Select
          label="Console role (fixture)"
          value={role}
          onChange={(v) => setRole(v as RoleId)}
          options={LIFECYCLE_PLATFORM_ROLES.map((r) => ({
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
          The role control is a view switcher, not a login. Nothing here authenticates anybody, no
          scheduler is connected, and no row below is computed — each is a seeded fixture.
        </p>
      </div>

      <div className="mt-4 rounded-[var(--radius-surface)] bg-[var(--color-surface-sunken)] p-4 text-sm">
        <p className="font-medium">
          {stateDefinition.id} — {stateDefinition.name}
        </p>
        <p className="mt-1 text-[var(--color-ink-muted)]">{stateDefinition.contract}</p>
        <p className="mt-1 text-[var(--color-ink-muted)]">{stateDefinition.neverDo}</p>
      </div>

      {surface === 'read-only' ? (
        <div className="mt-4">
          <Banner
            tone="attention"
            heading="Read-only"
            body="One cause: this fixture puts the lifecycle surface into a read-only state, so no hold, no horizon change and no erasure draft can be submitted from it. Every area below still reads."
          />
        </div>
      ) : null}

      {screenState === 'STATE-11' ? (
        <p className="mt-4 max-w-prose text-sm">
          Every artificial-intelligence model is unavailable, and no model participates in this
          module: retention, tiering, legal hold, anonymisation and erasure are all deterministic
          scheduler behaviour. Every area below reads and every control this role holds still acts
          (AC-SA-000-09, L42887).
        </p>
      ) : null}

      {screenState === 'STATE-10' ? (
        <p className="mt-4 max-w-prose text-sm">
          An agent elsewhere on the platform is degraded. Nothing on this screen changes, because
          every behaviour it renders is deterministic and none of it consults a model.
        </p>
      ) : null}

      {screenState === 'STATE-13' ? (
        <p className="mt-4 max-w-prose text-sm">
          Recovering: the last scheduler occurrence did not complete. Nothing is lost by that and
          nothing is treated as settled — each horizon is re-evaluated on the next scheduler run,
          and the areas below show what was true at the last completed evaluation, not what is
          assumed since.
        </p>
      ) : null}

      <Section id="sa17-invariants" heading="Enforced invariants on this module">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          All three render locked, with no off position for any account including the root. They are
          status readouts. There is no switch here, no approval path around one, and no
          configuration key behind one.
        </p>
        <div className="mt-3 space-y-3">
          {SA_INVARIANTS.filter(
            (i) =>
              i.id === 'encryption-at-rest' ||
              i.id === 'encryption-in-transit' ||
              i.id === 'cross-tenant-analytics-anonymisation',
          ).map((i) => (
            <InvariantChip key={i.id} invariant={i} />
          ))}
        </div>
      </Section>

      <Section id="sa17-retention" heading="Retention — the hot-retrievability horizon">
        <p className="mt-2 max-w-prose text-sm">
          Nothing is purged. No purge capability exists anywhere on the platform for any account,
          and nothing ages out of existence (AC-SA-17-01, L46074). The retention value is not a
          delete-after date: it is a hot-retrievability horizon, defaulting to {RETENTION_DEFAULT_LABEL},
          and shortening it moves data rather than deleting it (AC-SA-17-02, L46074).
        </p>
        <div className="mt-3">
          <Aggregate label="the retention posture of each tenant">
            <Table
              caption="Hot-retrievability horizon by tenant, against the platform floor register bound"
              columns={[
                { key: 'tenant', header: 'Tenant' },
                { key: 'horizon', header: 'Horizon' },
                { key: 'bound', header: 'Platform bound' },
                { key: 'mode', header: 'Mode' },
                { key: 'source', header: 'Source' },
              ]}
              rows={
                mode === 'empty'
                  ? []
                  : RETENTION_POSTURES.map((row) => ({
                      tenant: row.tenantLabel,
                      horizon: row.horizonLabel,
                      bound: row.boundLabel,
                      mode: row.mode,
                      source: row.sourceRef,
                    }))
              }
              emptyState={{
                title: 'No tenant carries a retention posture yet',
                whatCreatesIt:
                  'A posture exists as soon as a tenant record does: every tenant inherits the platform default horizon until a change is approved against it.',
              }}
            />
          </Aggregate>
        </div>
        {screenState === 'STATE-04' ? (
          <p role="alert" className="mt-3 max-w-prose text-sm text-[var(--color-status-blocked)]">
            A retention horizon must sit inside the bound the platform floor register carries —
            seven to twenty-five years. A value outside it is rejected rather than clamped, and the
            rejection is what the retention workflow’s second terminal state records (L97327).
          </p>
        ) : null}
        <div className="mt-3">
          {isRoot ? (
            <>
              <Button {...retentionProps} onClick={() => setRetentionSubmitted(true)}>
                Change the retention horizon
              </Button>
              <div className="mt-2">
                <PermissionNotice decision={retentionDecision} />
              </div>
              {retentionSubmitted ? (
                <p className="mt-2">
                  <StatusPill tone="info" icon="•" label="horizon change recorded — applies on the next tiering run" />
                </p>
              ) : null}
            </>
          ) : (
            <ProhibitionNotice rendering={{ kind: 'class-badge' }} />
          )}
        </div>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          A retention-value change is one of the eleven critical-class actions (L55942). For every
          role but the root the action bar here is the class badge and nothing else, so no control on
          this screen can be mistaken for an approval path (L23707).
        </p>
      </Section>

      <Section id="sa17-tiering" heading="Tiering at the horizon">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          What the tiering scheduler does at each boundary. Tiering is reversible in every case
          below; none of it is terminal, and none of it removes anything.
        </p>
        <ul className="mt-3 space-y-3">
          {TIERING_OUTCOMES.map((outcome) => (
            <li
              key={outcome.name}
              className="rounded-[var(--radius-surface)] border border-[var(--color-border)] p-3"
            >
              <p className="text-sm font-medium">{outcome.name}</p>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{outcome.whatHappens}</p>
              <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">{outcome.sourceRef}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sa17-legal-hold" heading="Legal hold">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          A hold suspends tiering and compliance-driven deletion for its named scope, and both
          placing and releasing it are shown to the tenant (AC-SA-17-04, L46074). The three states
          this module renders are {LEGAL_HOLD_STATES.join(', ')} (OBJ-SA-LEGALHOLD, L46016).
        </p>
        <div className="mt-3">
          <Table
            caption="Legal holds and their scopes"
            columns={[
              { key: 'id', header: 'Hold' },
              { key: 'tenant', header: 'Tenant' },
              { key: 'scope', header: 'Scope' },
              { key: 'state', header: 'State' },
              { key: 'reason', header: 'Reason' },
            ]}
            {...(mode === 'unavailable'
              ? {
                  error:
                    'The legal-hold list could not be read in this state. No scope is treated as unheld while it cannot be read — the tiering scheduler skips rather than proceeds.',
                }
              : {})}
            rows={LEGAL_HOLDS.map((hold) => ({
              id: hold.id,
              tenant: hold.tenantLabel,
              scope: hold.scopeLabel,
              state: <StatusPill tone={HOLD_TONE[hold.state]} icon="•" label={hold.state} />,
              reason: hold.reasonLabel,
            }))}
            emptyState={{
              title: 'No legal hold is on record',
              whatCreatesIt:
                'A preservation need raised by the client’s legal function, placed by the Root Super Admin against a named scope.',
            }}
          />
        </div>
        <div className="mt-3">
          {isRoot ? (
            <>
              <div className="flex flex-wrap gap-3">
                <Button {...holdProps} onClick={() => setHoldPlaced(true)}>
                  Place a legal hold
                </Button>
                <Button {...holdProps} variant="secondary" onClick={() => setHoldPlaced(true)}>
                  Release a legal hold
                </Button>
              </div>
              <div className="mt-2">
                <PermissionNotice decision={holdDecision} />
              </div>
              {holdPlaced || screenState === 'STATE-09' ? (
                <p className="mt-2">
                  <StatusPill tone="info" icon="•" label="placed — scope resolution still running" />
                  <span className="ml-2 text-xs text-[var(--color-ink-subtle)]">
                    An accepted hold is shown in its own state. It is not in force until its scope
                    resolves, and nothing here presents it as though it already were.
                  </span>
                </p>
              ) : null}
            </>
          ) : (
            <ProhibitionNotice rendering={{ kind: 'class-badge' }} />
          )}
        </div>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          Placing and releasing a hold is a critical-class action held by the Root Super Admin
          (L117354, L55942).
        </p>
      </Section>

      <Section id="sa17-anonymisation" heading="Anonymisation">
        <p className="mt-2 max-w-prose text-sm">
          Anonymisation runs at {ANONYMISATION_HORIZON_LABEL} for standard commercial tenants, and
          never in Regulated-Industry mode (AC-SA-17-05, L46074). It preserves the measurement, the
          result and the evidence, and replaces only the identity (AC-SA-17-06).
        </p>
        <p className="mt-2 max-w-prose text-sm">
          It operates on the identity-resolution layer and never rewrites an audit row (D11, L8368,
          AC-30D-1302 at L74842). The audit event keeps the same worker identifier it always
          carried; what changes is that the identifier stops resolving to a person. That is the only
          reading on which AC-SA-17-06 and AC-SA-18-04 are both true at once, and it is stated here
          rather than settled quietly in code.
        </p>
        <p className="mt-2 max-w-prose text-sm">
          It cannot be reversed by any account, and switching a tenant into Regulated-Industry mode
          afterwards does not bring an identity back (AC-SA-17-07). This is the platform’s one
          irreversible act, which is why the upcoming list below exists at all: there is no terminal
          safe state that restores an identity, so the only safe state is prevention (L102136).
        </p>
        <div className="mt-3">
          <Aggregate label="the upcoming anonymisation events">
            <Table
              caption="Upcoming anonymisation events, surfaced before they execute (AC-SA-17-08)"
              columns={[
                { key: 'tenant', header: 'Tenant' },
                { key: 'due', header: 'Due' },
                { key: 'scope', header: 'Scope' },
                { key: 'source', header: 'Source' },
              ]}
              rows={
                mode === 'empty'
                  ? []
                  : UPCOMING_ANONYMISATION.map((row) => ({
                      tenant: row.tenantLabel,
                      due: row.dueLabel,
                      scope: row.scopeLabel,
                      source: row.sourceRef,
                    }))
              }
              emptyState={{
                title: 'No anonymisation event is upcoming',
                whatCreatesIt:
                  'Records reaching twenty-four months for a standard commercial tenant. A Regulated-Industry mode tenant never produces one.',
              }}
            />
          </Aggregate>
        </div>
        <div className="mt-3">
          <ProhibitionNotice
            rendering={{
              kind: 'absent',
              note: 'No undo, no restore and no reversal control is drawn here for any account including the root (L97560). The absence is the control: this area lists what is coming precisely because nothing can act on it afterwards.',
            }}
          />
        </div>
        <p className="mt-3 max-w-prose text-sm">
          A tenant name here is not a route into that tenant.{' '}
          <Link
            href="/super-admin/support-access/"
            className="text-[var(--color-primary)] underline"
          >
            Request a named access session in Support Access
          </Link>{' '}
          — that session-request form is the only route to tenant content from this console.
        </p>
      </Section>

      <Section id="sa17-archival" heading="Archival and closure">
        <p className="mt-2 max-w-prose text-sm">
          Offboarding executes export-on-archival at no charge before archival (AC-SA-17-09,
          L46074). Archival closes a tenancy; it does not destroy it.
        </p>
        <p className="mt-3 text-sm" data-testid="closure-sequence">
          The closure sequence (L65896): {CLOSURE_SEQUENCE.join(' → ')}.
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The last two are not an ending. Anonymised means identities no longer resolve; Tiered means
          the data sits in a colder storage class and is still retrievable. Nothing in the sequence
          means gone.
        </p>
        <ul className="mt-3 space-y-3">
          {ARCHIVE_REACTIVATION_BANDS.map((band) => (
            <li
              key={band.name}
              className="rounded-[var(--radius-surface)] border border-[var(--color-border)] p-3"
            >
              <p className="text-sm font-medium">{band.name}</p>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{band.terms}</p>
              <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">{band.sourceRef}</p>
            </li>
          ))}
        </ul>
        <div className="mt-3">
          <ProhibitionNotice
            rendering={{
              kind: 'absent',
              note: 'No delete-tenant-data control sits on this area for any account (L65941). Archival is a state a tenancy reaches, not an act that empties it.',
            }}
          />
        </div>
      </Section>

      <Section id="sa17-device" heading="Device de-authorisation at offboarding">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Offboarding de-authorises the tenant’s devices, and that command is rendered in its own
          true state, never collapsed into one word. The fifteen states, in source order (L42846):{' '}
          {COMMAND_STATES.join(', ')}.
        </p>
        <p className="mt-3" data-testid="command-state">
          <CommandStateBadge state={commandState} />
        </p>
        <div className="mt-3">
          <Button
            variant="secondary"
            {...(commandIndex >= COMMAND_STATES.length - 1
              ? { disabledReason: 'The fixture is at the last state in the sequence.' }
              : {})}
            onClick={() => setCommandIndex((i) => Math.min(i + 1, COMMAND_STATES.length - 1))}
          >
            Advance the fixture to the next command state
          </Button>
        </div>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          This stepper is a fixture control, not a platform control: it advances a seeded example so
          a reviewer can read each state in turn. A device that has not been reached is shown in the
          state it actually reached and in no other (AC-SA-13-05, L45570). Synchronisation precedes
          de-authorisation, and this console never presents an unreached device as having completed
          either.
        </p>
      </Section>

      <Section id="sa17-erasure" heading="Erasure requests">
        <p className="mt-2 max-w-prose text-sm">
          The five-step guided right-to-erasure sequence (L45997, L114118). The Admin drafts it and
          the Root Super Admin approves it. The legal-hold check cannot be skipped by any account,
          and a certificate is written to both audit trails wherever removal actually occurs
          (AC-SA-17-11, L46074).
        </p>
        <ol className="mt-3 space-y-3">
          {ERASURE_STEPS.map((step) => (
            <li
              key={step.ordinal}
              className="rounded-[var(--radius-surface)] border border-[var(--color-border)] p-3"
            >
              <p className="text-sm font-medium">
                Step {step.ordinal} — {step.name}
              </p>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{step.whatHappens}</p>
            </li>
          ))}
        </ol>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Removal happens only where a named compliance standard requires it. That list of standards
          is owed by the client under DEC-DELETE-001, so this prototype builds no deletion path and
          promises none: step four’s honest outcome, today, is a transformation.
        </p>
        <div className="mt-3">
          <Table
            caption="Erasure requests on record"
            columns={[
              { key: 'id', header: 'Request' },
              { key: 'state', header: 'State' },
              { key: 'subject', header: 'Subject reference' },
              { key: 'basis', header: 'Basis' },
              { key: 'scope', header: 'Scope summary' },
              { key: 'outcome', header: 'Outcome' },
            ]}
            {...(mode === 'unavailable'
              ? {
                  error:
                    'The erasure request list could not be read in this state. No request is treated as concluded while it cannot be read.',
                }
              : {})}
            rows={ERASURE_REQUESTS.map((request) => ({
              id: request.id,
              state: request.state,
              subject: request.subjectReference,
              basis: request.basis,
              scope: request.scopeSummary,
              outcome: request.outcome,
            }))}
            emptyState={{
              title: 'No erasure request is on record',
              whatCreatesIt:
                'A request naming a data subject and stating a legal basis, drafted by the Admin.',
            }}
          />
        </div>
        <div className="mt-3">
          <Button {...draftProps} onClick={() => setErasureDrafted(true)}>
            Draft an erasure request
          </Button>
          <div className="mt-2">
            <PermissionNotice decision={erasureDraftDecision} />
          </div>
          {erasureDrafted ? (
            <p className="mt-2">
              <StatusPill tone="info" icon="•" label="draft recorded — awaiting the legal-hold check" />
            </p>
          ) : null}
        </div>
        <div className="mt-4">
          {isRoot ? (
            <Button {...holdProps} onClick={() => setErasureDrafted(true)}>
              Approve the erasure execution
            </Button>
          ) : (
            <ProhibitionNotice rendering={{ kind: 'class-badge' }} />
          )}
        </div>
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          Execution is a critical-class action, and the Root Super Admin is its only approver
          (L55942, L45997). For every other role the action bar here is the class badge and nothing
          else.
        </p>
      </Section>

      <Section id="sa17-absent" heading="Controls that do not exist here">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Each of these is drawn as a note in the place a control would sit. None is a disabled
          control, because a disabled control implies an enabled state exists somewhere.
        </p>
        <ul className="mt-3 space-y-3">
          {LIFECYCLE_ABSENT_CONTROLS.map((control) => (
            <li key={control.label}>
              <p className="text-sm font-medium">{control.label}</p>
              <ProhibitionNotice rendering={{ kind: 'absent', note: control.note }} />
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sa17-workflows" heading="Workflows this module renders">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The extraction attaches no module identifier to any workflow, so each row states how it was
          matched to this module.
        </p>
        <ul className="mt-3 space-y-3 text-sm">
          {LIFECYCLE_WORKFLOWS.map((workflow) => (
            <li key={workflow.id}>
              <p className="font-medium">{workflow.name}</p>
              <p className="text-xs text-[var(--color-ink-subtle)]">{workflow.id}</p>
              <p className="text-[var(--color-ink-muted)]">
                {workflow.actor} · {workflow.trigger}
              </p>
              <p className="text-[var(--color-ink-muted)]">
                Ends at: {workflow.terminalStates.join('; ')}.
              </p>
              <p className="text-xs text-[var(--color-ink-subtle)]">
                Matched by {workflow.matchedBy}.
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sa17-access" heading="Reaching tenant content from here">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Every row on this screen has a tenant behind it, and none of them opens. There is no
          ambient browsing anywhere on this console (AC-SA-000-07, AC-SEC-801): tenant content is
          reachable only by requesting a session under one of the three named access classes.
        </p>
        <ul className="mt-2 list-disc pl-5 text-sm text-[var(--color-ink-muted)]">
          {ACCESS_CLASSES.map((accessClass) => (
            <li key={accessClass.id}>{accessClass.name}</li>
          ))}
        </ul>
        <div className="mt-2">
          <PermissionNotice decision={readDecision} />
        </div>
      </Section>

      <Section id="sa17-unspecified" heading="Unspecified in source">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Each affordance below is one the source does not define. It is named rather than invented:
          a plausible invented control reads back as a requirement.
        </p>
        <ul className="mt-3 space-y-3 text-sm">
          {LIFECYCLE_UNSPECIFIED_IN_SOURCE.map((item) => (
            <li key={item.affordance}>
              <p className="font-medium">{item.affordance}</p>
              <p className="text-[var(--color-ink-muted)]">{item.note}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sa17-conflicts" heading="Conflicts in the source">
        <ul className="mt-3 space-y-3 text-sm">
          {LIFECYCLE_SOURCE_CONFLICTS.map((conflict) => (
            <li key={conflict.topic}>
              <p className="font-medium">{conflict.topic}</p>
              <p className="text-[var(--color-ink-muted)]">{conflict.conflict}</p>
              <p className="text-[var(--color-ink-muted)]">Resolved as: {conflict.resolution}</p>
            </li>
          ))}
        </ul>
      </Section>
    </SaConsoleShell>
  )
}
