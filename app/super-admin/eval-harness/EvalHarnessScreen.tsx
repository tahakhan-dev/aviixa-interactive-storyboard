'use client'

import { useState, type ReactNode } from 'react'
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
  DRIFT_CANARY,
  EVAL_ABSENT_CONTROLS,
  EVAL_GATE_ROWS,
  EVAL_PLATFORM_ROLES,
  EVAL_SCENARIOS,
  EVAL_SOURCE_CONFLICTS,
  EVAL_UNSPECIFIED_IN_SOURCE,
  EVAL_WORKFLOWS,
  POSTURE_AS_OF,
  POSTURE_ORIGIN,
  POSTURE_STALE_AS_OF,
  type EvalRunState,
  type EvalScenario,
} from './fixtures'

const MODULE = saModuleById('MOD-SA-05')

/** The twelve applicable states: all thirteen less the frontline-only STATE-07. */
const APPLICABLE_STATES = SCREEN_STATES.filter((s) => !s.frontlineOnly)

/** No backend, no clock — the policy layer is handed an empty seeded state. */
const FIXTURE_STATE = emptyDomainState(scenarioRunId('SA-05-EVAL-HARNESS'))

/**
 * What the harness itself is doing, which is a separate axis from who is
 * looking. Driven through `evaluateAccess`'s object-state stage rather than
 * a hand-rolled `if`, so a state refusal is a typed decision like any other.
 */
type HarnessAvailability = 'available' | 'read-only' | 'unavailable'

function harnessAvailability(state: ScreenStateId): HarnessAvailability {
  if (state === 'STATE-06') return 'read-only'
  if (state === 'STATE-12') return 'unavailable'
  return 'available'
}

type PostureMode = 'current' | 'stale' | 'unavailable' | 'loading' | 'empty'

function postureMode(state: ScreenStateId): PostureMode {
  if (state === 'STATE-02') return 'loading'
  if (state === 'STATE-08') return 'stale'
  if (state === 'STATE-12') return 'unavailable'
  return 'current'
}

/**
 * The ONE record set this screen reads. The aggregate, the scenario table,
 * the run-target list and the gate view all read this — an aggregate over
 * records the same screen says do not exist is a contradiction, so there is
 * no second source to disagree with.
 */
function visibleScenarios(state: ScreenStateId): readonly EvalScenario[] {
  return state === 'STATE-01' ? [] : EVAL_SCENARIOS
}

/**
 * `AC-SA-05-09` (L43807): with models unavailable, an agent-behaviour
 * scenario renders UNABLE TO RUN rather than passing, and enablement stays
 * blocked. This is the whole of STATE-11 on this module — nothing else about
 * the screen goes away, which is `AC-SA-000-09`'s "remains operable".
 */
function effectiveVerdict(scenario: EvalScenario, state: ScreenStateId): string {
  if (!scenario.agentBehaviour) return scenario.verdict
  if (state === 'STATE-11') return 'Unable to run — no model available'
  if (state === 'STATE-10') return `${scenario.verdict} (model degraded — last completed run)`
  return scenario.verdict
}

function verdictTone(verdict: string): StatusTone {
  if (verdict.startsWith('passing')) return 'ok'
  if (verdict.startsWith('failing')) return 'blocked'
  if (verdict.startsWith('Unable to run')) return 'stale'
  return 'attention'
}

/** The named reason a drawn-but-inert control carries. Never a bare "denied". */
function namedReason(decision: PermissionDecision, role: RoleId, harness: HarnessAvailability): string {
  if (decision.outcome === 'allowed') return ''
  if (decision.reasonCode === 'ROLE_NOT_GRANTED') {
    if (role === 'ADMIN') {
      return 'Band A execution is engineering work — the suite runner is carried by the Platform Engineer (L42713, L108982).'
    }
    return 'Running evaluation scenarios sits in Support’s may-not list (L42715).'
  }
  if (harness === 'unavailable') return 'The evaluation harness is unavailable in this state.'
  if (harness === 'read-only') return 'This screen is read-only in this state.'
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

export interface EvalHarnessScreenProps {
  /** View-switcher seed, not a login (spec §8). */
  readonly role?: RoleId
  readonly screenState?: ScreenStateId
}

export function EvalHarnessScreen({
  role: initialRole = 'PLATFORM_ENGINEER',
  screenState: initialScreenState = 'STATE-03',
}: EvalHarnessScreenProps = {}) {
  const [role, setRole] = useState<RoleId>(initialRole)
  const [screenState, setScreenState] = useState<ScreenStateId>(initialScreenState)
  const [runTarget, setRunTarget] = useState<string>('whole-suite')
  const [submittedRun, setSubmittedRun] = useState<EvalRunState | null>(null)

  const harness = harnessAvailability(screenState)
  const scenarios = visibleScenarios(screenState)
  // ONE fact, read by every panel that renders scenario records: the posture
  // aggregate, the scenario table, the gate table AND the run-target
  // selector. A panel that names a scenario while another says the records
  // are still being read is the same defect as an aggregate over records the
  // screen says do not exist.
  const scenariosLoading = screenState === 'STATE-02'
  // With no scenario records there is nothing to aggregate: the posture says
  // so in words rather than reporting nought verdicts.
  const posture: PostureMode = scenarios.length === 0 ? 'empty' : postureMode(screenState)
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

  // Per-control allowed roles (L43706, L108748, L108982) — never the
  // module-level `roles_allowed`, which D16 makes authoritative nowhere.
  const runDecision = evaluateAccess(
    {
      action: 'MOD-SA-05:run-evaluation',
      allowedRoles: ['PLATFORM_ENGINEER', 'ROOT_SUPER_ADMIN'],
      allowedObjectStates: ['available'],
      objectState: harness,
      sourceRefs: ['L43706', 'L108748', 'L108982', 'L42713', 'L42715'],
    },
    context,
  )
  const canaryDecision = evaluateAccess(
    {
      action: 'MOD-SA-05:read-drift-canary',
      allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN', 'PLATFORM_ENGINEER'],
      sourceRefs: ['L108982', 'AC-4853 L107719'],
    },
    context,
  )
  const gateViewDecision = evaluateAccess(
    {
      action: 'MOD-SA-05:read-gate-view',
      allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN', 'PLATFORM_ENGINEER', 'SUPPORT'],
      sourceRefs: ['L108982'],
    },
    context,
  )

  const runReason = namedReason(runDecision, role, harness)
  // A run needs a target, and in STATE-02 the scenario list has not arrived --
  // the selector says exactly that. Gating the run on the DECISION alone left
  // the buttons live beside it, so one click produced "No run target can be
  // named until they arrive" and "queued / Run target: the whole suite" on the
  // same screen. The selector and the buttons read one fact, so they read it
  // from one place.
  const runDisabled = runDecision.outcome !== 'allowed' || scenariosLoading
  const runProps = runDisabled
    ? {
        disabledReason: scenariosLoading
          ? 'The scenario list has not arrived in this state, so no run target can be named yet.'
          : runReason,
      }
    : {}

  const verdicts = scenarios.map((s) => effectiveVerdict(s, screenState))
  const counts = [
    ['passing', verdicts.filter((v) => v.startsWith('passing')).length],
    ['pending', verdicts.filter((v) => v.startsWith('pending')).length],
    ['failing', verdicts.filter((v) => v.startsWith('failing')).length],
    ['unable to run', verdicts.filter((v) => v.startsWith('Unable to run')).length],
    // An aggregate never renders a zero (AC-SA-01-03): a category with
    // nothing in it is not reported as the number nought.
  ].filter((entry): entry is [string, number] => typeof entry[1] === 'number' && entry[1] > 0)

  // The gate view reads the SAME scenario records as the list and the
  // aggregate. A capability reaches this blocking list because a scenario
  // blocks it, so a blocked row exists exactly while its blocking scenario
  // does: with none authored (STATE-01) the list names none, rather than
  // giving a second account of records the list says were never authored.
  const gateRows = EVAL_GATE_ROWS.flatMap((row) => {
    const blocker = row.blockedBy === null ? null : scenarios.find((s) => s.id === row.blockedBy)
    if (blocker === undefined) return []
    return [
      {
        capability: row.capability,
        kind: row.kind,
        blocked:
          blocker === null
            ? 'Nothing blocks it. Enablement is submitted and approved in the Atom Registry, and is not offered on this screen.'
            : `${blocker.name} — ${effectiveVerdict(blocker, screenState)}`,
        source: row.sourceRef,
      },
    ]
  })

  const displayedRun: EvalRunState | null =
    submittedRun ?? (screenState === 'STATE-09' ? 'queued' : null)
  const runTargetLabel = scenarios.find((s) => s.id === runTarget)?.name ?? 'the whole suite'

  return (
    <SaConsoleShell module={MODULE}>
      <p className="text-xs text-[var(--color-ink-subtle)]">
        Screens annotated SCR-SA-06 (L42798), SCR-SA-EVALS and SCR-SA-EVALGATE (L87376). Names are
        canonical; the numbers are annotations only, and this route is keyed on the module slug.
      </p>

      <div className="mt-6 flex flex-wrap gap-6 rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4">
        <Select
          label="Console role (fixture)"
          value={role}
          // A recorded click must not outlive the role that made it, or a role
          // that never held the runner is told the run is already queued
          // instead of that it lacks the capability.
          onChange={(v) => {
            setRole(v as RoleId)
            setSubmittedRun(null)
          }}
          options={EVAL_PLATFORM_ROLES.map((r) => ({
            value: r.id,
            label: `${r.name} — ${r.roleAnnotation}`,
          }))}
        />
        <Select
          label="Screen state (fixture)"
          value={screenState}
          // Same for the state switcher, and the chosen target goes with it:
          // the record it named may not be among the records the new state
          // shows.
          onChange={(v) => {
            setScreenState(v as ScreenStateId)
            setSubmittedRun(null)
            setRunTarget('whole-suite')
          }}
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

      {harness === 'read-only' ? (
        <div className="mt-4">
          <Banner
            tone="attention"
            heading="Read-only"
            body="One cause: this fixture puts the evaluation harness into a read-only state, so no run can be submitted from it. Every other panel still reads."
          />
        </div>
      ) : null}

      <Section id="sa05-invariants" heading="Enforced invariants on this module">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Both render locked, with no off position for any account including the root (AC-SA-05-01,
          L43799). They are status readouts. There is no switch here, and no approval path around
          one.
        </p>
        <div className="mt-3 space-y-3">
          {SA_INVARIANTS.filter(
            (i) => i.id === 'evaluation-gate' || i.id === 'sandbox-before-publish',
          ).map((i) => (
            <InvariantChip key={i.id} invariant={i} />
          ))}
        </div>
      </Section>

      <Section id="sa05-posture" heading="Harness posture">
        {posture === 'loading' ? (
          <SkeletonBlock lines={3} label="Loading the evaluation harness posture" />
        ) : posture === 'unavailable' ? (
          <p className="mt-2 text-sm">
            Unavailable — the harness posture could not be read. An unavailable aggregate is never
            rendered as a count, and never left blank.
          </p>
        ) : posture === 'empty' ? (
          <p className="mt-2 text-sm">
            No verdict to report — no scenario has been authored yet, so there is nothing to
            aggregate. The scenario list below says the same thing: this screen never counts records
            it also says do not exist, and never reports that absence as the number nought.
          </p>
        ) : (
          <>
            <ul className="mt-2 flex flex-wrap gap-2">
              {counts.map(([label, n]) => (
                <li key={label}>
                  <StatusPill tone={verdictTone(label)} icon="•" label={`${n} ${label}`} />
                </li>
              ))}
            </ul>
            <div className="mt-2">
              <FreshnessLabel
                asOfLabel={posture === 'stale' ? POSTURE_STALE_AS_OF : POSTURE_AS_OF}
                originLabel={POSTURE_ORIGIN}
              />
            </div>
          </>
        )}
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          Counts by verdict, each with the time it was true. No score and no proportion is rendered
          anywhere on this module (L108982, AC-4853 L107719).
        </p>
      </Section>

      <Section id="sa05-scenarios" heading="Scenario list">
        <Table
          caption="Scenario list — pass and fail history per atom and per agent"
          columns={[
            { key: 'name', header: 'Scenario' },
            { key: 'kind', header: 'Kind' },
            { key: 'verdict', header: 'Verdict' },
            { key: 'run', header: 'Last run' },
            { key: 'source', header: 'Source' },
          ]}
          loading={scenariosLoading}
          rows={scenarios.map((s) => {
            const verdict = effectiveVerdict(s, screenState)
            return {
              name: s.name,
              kind: s.agentBehaviour ? 'Agent behaviour' : 'Deterministic',
              verdict: <StatusPill tone={verdictTone(verdict)} icon="•" label={verdict} />,
              run: s.lastRunState,
              source: s.sourceRef,
            }
          })}
          emptyState={{
            title: 'No evaluation scenario has been authored yet',
            whatCreatesIt:
              'A scenario is authored before the capability it will gate (L43669). The frozen source defines no authoring affordance on this console, so none is drawn here.',
          }}
        />
        <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          Eight platform scenarios are named in the source (L87334), two of them seeds, plus the
          severity-classification boundary case at L43708. The source’s “roughly fifty scenarios” is
          explicitly illustrative and not a committed count, so no total is shown as an inventory.
        </p>
      </Section>

      <Section id="sa05-runner" heading="Suite runner">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Runs one scenario or the whole suite on demand, recorded as an evaluation run (L108982).
          No override control exists (L108748).
        </p>
        {harness === 'unavailable' ? (
          <div className="mt-3">
            <Banner
              tone="blocked"
              heading="The evaluation harness cannot be reached"
              body="Harness unavailability blocks enablement and never permits it. Failure to evaluate is failure to enable, never a bypass (AC-AI-011-8, L87425)."
            />
          </div>
        ) : null}
        <div className="mt-3 max-w-md">
          {/* The selector reads the SAME records as the scenario table and the
              gate table. While those are still being read it cannot already
              have them named, so it offers no scenario and says why — the
              placeholder STATE-02 requires, not a fully-read list. */}
          <Select
            label="Run target"
            value={scenariosLoading ? 'loading' : runTarget}
            onChange={setRunTarget}
            disabled={scenariosLoading}
            options={
              scenariosLoading
                ? [{ value: 'loading', label: 'Loading the scenario list — no run target yet' }]
                : [
                    { value: 'whole-suite', label: 'The whole suite' },
                    ...scenarios.map((s) => ({ value: s.id, label: `${s.id} · ${s.name}` })),
                  ]
            }
          />
          {scenariosLoading ? (
            <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
              One cause: the scenario records are still being read. No run target can be named
              until they arrive.
            </p>
          ) : null}
        </div>
        {screenState === 'STATE-04' ? (
          <p role="alert" className="mt-2 text-sm text-[var(--color-status-blocked)]">
            Choose a run target. The rule: a run names either the whole suite or exactly one
            scenario from the list above — nothing else is accepted.
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-start gap-4">
          <Button {...runProps} onClick={() => setSubmittedRun('queued')}>
            Run scenario
          </Button>
          <Button {...runProps} onClick={() => setSubmittedRun('queued')}>
            Run suite
          </Button>
        </div>
        <div className="mt-2">
          <PermissionNotice decision={runDecision} />
        </div>
        {displayedRun !== null ? (
          <div className="mt-3">
            <StatusPill tone="info" icon="•" label={displayedRun} />
            <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
              Run target: {runTargetLabel}. An accepted run is shown in its own state and is never
              rendered as complete.
            </p>
          </div>
        ) : null}
        {screenState === 'STATE-13' ? (
          <p className="mt-3 text-sm text-[var(--color-ink-muted)]">
            Recovering: the suite is being re-read after a failure. Two of nine scenario records
            have been re-read so far, and nothing is presented as recovered until all nine are.
          </p>
        ) : null}
      </Section>

      <Section id="sa05-gate" heading="Gate view">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          A blocking list naming the scenario that blocks each capability, never a score (L108982).
          All four platform roles read it.
        </p>
        <PermissionNotice decision={gateViewDecision} />
        <Table
          caption="Capabilities the evaluation gate is holding"
          columns={[
            { key: 'capability', header: 'Capability' },
            { key: 'kind', header: 'Kind' },
            { key: 'blocked', header: 'Blocked by' },
            { key: 'source', header: 'Source' },
          ]}
          // Same records, same fetch: while the scenario list is still
          // loading, the blocking list cannot already have read them.
          loading={scenariosLoading}
          {...(harness === 'unavailable'
            ? {
                error:
                  'The gate view could not be read in this state. Nothing is treated as unblocked while it cannot be read.',
              }
            : {})}
          rows={gateRows}
          emptyState={{
            title: 'No capability is currently held by the gate',
            whatCreatesIt: 'A pending or failing scenario places a capability on this list.',
          }}
        />
        <div className="mt-3">
          <ProhibitionNotice
            rendering={{
              kind: 'absent',
              note: 'No enablement control is offered here while any referenced scenario is pending or failing — none exists for any account, including the root (L65361, AC-AI-011-1 L87418).',
            }}
          />
        </div>
      </Section>

      <Section id="sa05-canary" heading="Drift canary panel">
        {canaryDecision.outcome === 'allowed' ? (
          <>
            <dl className="mt-2 grid max-w-2xl grid-cols-[10rem_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="font-medium">Cadence</dt>
              <dd>{DRIFT_CANARY.cadence}</dd>
              <dt className="font-medium">Last run</dt>
              <dd>
                {DRIFT_CANARY.lastRunAsOf} · {DRIFT_CANARY.lastRunState}
              </dd>
              <dt className="font-medium">Verdict</dt>
              <dd>{DRIFT_CANARY.verdict}</dd>
              <dt className="font-medium">Named owner</dt>
              <dd>{DRIFT_CANARY.namedOwner}</dd>
              <dt className="font-medium">On a detection</dt>
              <dd>{DRIFT_CANARY.effect}</dd>
            </dl>
            <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
              The last result and the owner’s name are always displayed (AC-4853, L107719). No
              control is drawn for the action on a detection, because the source names none.
            </p>
          </>
        ) : (
          <PermissionNotice decision={canaryDecision} />
        )}
      </Section>

      <Section id="sa05-absent" heading="Controls that do not exist here">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Each of these is drawn as a note in the place a control would sit. None is a disabled
          control, because a disabled control implies an enabled state exists somewhere.
        </p>
        <ul className="mt-3 space-y-3">
          {EVAL_ABSENT_CONTROLS.map((c) => (
            <li key={c.label}>
              <p className="text-sm font-medium">{c.label}</p>
              <ProhibitionNotice rendering={{ kind: 'absent', note: c.note }} />
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sa05-workflows" heading="Workflows this module renders">
        <ul className="mt-2 space-y-3 text-sm">
          {EVAL_WORKFLOWS.map((w) => (
            <li key={w.id}>
              <p className="font-medium">
                {w.name} <span className="text-[var(--color-ink-subtle)]">({w.id})</span>
              </p>
              <p className="text-[var(--color-ink-muted)]">
                {w.actor} · {w.trigger}
              </p>
              <p className="text-[var(--color-ink-muted)]">
                Ends at: {w.terminalStates.join('; ')}.
              </p>
              <p className="text-xs text-[var(--color-ink-subtle)]">Matched by {w.matchedBy}.</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sa05-access" heading="Reaching tenant content from here">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          A scenario’s evidence sits inside a tenant’s own records. No link on this console resolves
          to that content: it is reachable only by requesting a session under a named access class,
          and there is no ambient browsing anywhere on this surface (AC-SA-000-07, AC-SEC-801).
        </p>
        <ul className="mt-2 list-disc pl-5 text-sm text-[var(--color-ink-muted)]">
          {ACCESS_CLASSES.map((c) => (
            <li key={c.id}>{c.name}</li>
          ))}
        </ul>
      </Section>

      <Section id="sa05-unspecified" heading="Unspecified in source">
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Each affordance below is one the source does not define. It is named rather than invented:
          a plausible invented control reads back as a requirement.
        </p>
        <ul className="mt-3 space-y-3 text-sm">
          {EVAL_UNSPECIFIED_IN_SOURCE.map((u) => (
            <li key={u.affordance}>
              <p className="font-medium">{u.affordance}</p>
              <p className="text-[var(--color-ink-muted)]">{u.note}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sa05-conflicts" heading="Conflicts in the source">
        <ul className="mt-3 space-y-3 text-sm">
          {EVAL_SOURCE_CONFLICTS.map((c) => (
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
