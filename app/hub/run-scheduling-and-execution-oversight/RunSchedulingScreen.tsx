'use client'

import { useState } from 'react'
import Link from 'next/link'
import { HubShell, type TenantRoleId } from '../HubShell'
import { CrossSurfaceStatement } from '@/ui/doh/CrossSurfaceStatement'
import { DecisionDisclosure } from '@/disclosure/DecisionDisclosure'
import { Banner, Select, StatusPill, Table, type StatusTone, type TableRow } from '@/ui/primitives'
import { ScreenStateBoundary } from '@/ui/ScreenStateBoundary'
import { evaluateAccess } from '@/policy/evaluate'
import { permitsRead, type PermissionDecision } from '@/policy/decision'
import { roleById, type RoleId } from '@/domain/roles'
import { emptyDomainState, withTenant } from '@/domain/state'
import { scenarioRunId } from '@/domain/ids'
import { crossSurfaceStatement } from '@/surfaces/doh/boundary'
import { dohScreenById } from '@/surfaces/doh/screens'
import {
  AUTO_CANCEL_AFTER_MS,
  BRIEFED_TIMER_ROWS,
  DUE_TIMERS,
  FINISH_WINDOW_CEILING_MS,
  FINISH_WINDOW_DEFAULT_MS,
  FINISH_WINDOW_FLOOR_MS,
  NO_SHOW_ALERT_AFTER_MS,
  dueTransitions,
  finishWindowEndsAtMs,
  finishWindowRejection,
  finishWindowVerdict,
  lateCaptureOutcome,
} from '@/surfaces/doh/transitions'
import {
  ACTING_STATUSES,
  CLOSING_STATE_TABLE,
  DEFERRAL_RENDERING,
  DEC_FINISH_001_MOUNTED,
  DEC_RUNSTATE_001,
  DEC_STUCK_001,
  MODULE_REGISTRY_GAP,
  MOD_DOH_06_MATRIX,
  MOD_DOH_06_ROLES_REACHING,
  READING_STATUSES,
  RUN_CONTRADICTIONS,
  TENANT_ROLE_ORDER,
  UNSPECIFIED_IN_SOURCE,
  WF_AUT_010,
  closingPosition,
  inTheContestedSpan,
  manualCloseAssertion,
  matrixRow,
  rolesWithStatus,
  runStateReadings,
  stateIsGovernedByDecStuck,
  type RunBoardRow,
  type RunControlId,
  type RunDecision,
} from '@/surfaces/doh/modules/doh-06/matrix'
import {
  BOARD_NOW_LABEL,
  HORIZON_DAYS,
  HOUR,
  HUB_TENANT_ID,
  boardClock,
  relativeToBoard,
  runsInScope,
  withinHorizon,
} from '@/surfaces/doh/modules/doh-06/fixtures'
import type { ControlStatus } from '@/surfaces/doh/modules'

/**
 * MOD-DOH-06 — Run Scheduling and Execution Oversight.
 * `SCR-DOH-13` the run schedule board, with `SCR-DOH-14` the run detail and
 * oversight as its sub-view, exactly as catalogue B mounts them (L48107,
 * L48108 — the second row's navigation entry point is "Run schedule board").
 *
 * THE ONE RULE THAT SHAPES THIS FILE. Three decisions are open on this module
 * and this screen settles none of them. In particular NOTHING here branches on
 * `submitted` or `complete`: the board reads INSTANTS through
 * `closingPosition`, which is the choice `@/surfaces/doh/transitions` made so
 * that the evaluator could not settle DEC-RUNSTATE-001, and keying a rail, a
 * filter or a badge on one of those two words would undo it one layer up.
 *
 * The second rule: a row describing another surface is never an enabled
 * control here, whatever its token reads — so every row is classified before
 * it is rendered, and row 8's Worker cell gets a `CrossSurfaceStatement`
 * rather than a disabled button.
 */
const SCREEN_13 = dohScreenById('SCR-DOH-13')
const SCREEN_14 = dohScreenById('SCR-DOH-14')

const FIXTURE_STATE = withTenant(
  emptyDomainState(scenarioRunId('DOH-MOD-06-STORYBOARD')),
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

const STATUS_TONE: Record<ControlStatus, StatusTone> = {
  allowed: 'ok',
  'allowed-with-conditions': 'info',
  'read-only': 'neutral',
  'explicitly-prohibited': 'blocked',
  'not-applicable': 'stale',
  unavailable: 'blocked',
}

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

/**
 * Every affordance decided through `evaluateAccess` over this module's OWN
 * matrix. No hand-written role list exists anywhere in this file — the brief's
 * standing instruction, and the reason catalogue B's narrower cell for
 * SCR-DOH-13 is disclosed rather than obeyed.
 */
function decide(roleId: RoleId, control: RunControlId, statuses: readonly ControlStatus[]) {
  const row = matrixRow(control)
  return evaluateAccess(
    {
      action: control,
      allowedRoles: rolesWithStatus(control, statuses),
      sourceRefs: [row.sourceRef],
    },
    contextFor(roleId),
  )
}

function hours(ms: number): string {
  return `${Math.round(ms / HOUR)} hours`
}

/** All readings, none adopted — the same three-part shape `DecisionDisclosure` renders. */
function RunDecisionDisclosure({ decision }: { readonly decision: RunDecision }) {
  return (
    <section
      role="note"
      aria-label={`Open decision ${decision.id}`}
      data-testid={`decision-${decision.id}`}
      className="rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4 text-sm"
    >
      <p className="font-medium text-[var(--color-ink)]">Open decision {decision.id}</p>
      <p className="mt-1 text-[var(--color-ink-muted)]">{decision.question}</p>

      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
        All readings stand. None is this build&rsquo;s to settle.
      </p>
      <ul className="mt-1 space-y-2">
        {decision.readings.map((reading) => (
          <li key={reading.locator}>
            <span className="text-[var(--color-ink)]">{reading.text}</span>{' '}
            <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]">
              [{reading.locator}]
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
        This build&apos;s working position
      </p>
      <p className="mt-1 text-[var(--color-ink)]">{decision.buildPosition}</p>
      <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
        A client-delegated choice under APP-012, not a position the source settled.
      </p>

      <p
        data-testid={`decision-onscreen-${decision.id}`}
        className="mt-3 text-[var(--color-ink)]"
      >
        {decision.onScreen}
      </p>
    </section>
  )
}

export function RunSchedulingScreen() {
  const [role, setRole] = useState<TenantRoleId>('SUPERVISOR')
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [windowHours, setWindowHours] = useState<number>(48)

  const clock = boardClock()
  const roleName = roleById(role).name

  const viewDecision = decide(role, 'view-the-schedule', READING_STATUSES)
  const createDecision = decide(role, 'create-a-run', ACTING_STATUSES)
  const cancelDecision = decide(role, 'cancel-a-run', ACTING_STATUSES)
  const extendDecision = decide(role, 'extend-a-run-end-time', ACTING_STATUSES)
  const closeStuckDecision = decide(role, 'close-a-stuck-run-manually', ACTING_STATUSES)

  /* THE READ, BOUNDED BY SCOPE, COMPUTED ONCE. The board, the oversight list
     and the run detail all read this one answer — nothing below re-derives a
     scope and nothing filters at render time over a wider list. */
  const inScope = runsInScope(role)
  const boardRuns = inScope.filter(withinHorizon)
  /* Everything in scope whose scheduled start is behind the horizon, CLOSED
     RUNS INCLUDED. Filtering the closed ones out was written first and was
     wrong: it made the one `finished` run unreachable from any screen, and
     §4.7.4 keeps changes to a finished record exceptional rather than
     impossible — a record nobody can open cannot be corrected at all. */
  const behindHorizon = inScope.filter((r) => !withinHorizon(r))
  const selected = inScope.find((r) => r.facts.runId === selectedRunId) ?? null

  const annotation = (
    <div className="space-y-2">
      <p className="text-xs text-[var(--color-ink-subtle)]">
        Screen annotation only, never a route key (D1): {SCREEN_13.id}, {SCREEN_13.name}, with{' '}
        {SCREEN_14.id}, {SCREEN_14.name}, as its sub-view — catalogue B {SCREEN_13.sourceRef} and{' '}
        {SCREEN_14.sourceRef}. This route is keyed on the module slug. MOD-DOH-06, Run Scheduling
        and Execution Oversight, §19.8.
      </p>
      <p data-testid="registry-gap" className="text-xs text-[var(--color-ink-subtle)]">
        {MODULE_REGISTRY_GAP.what} {MODULE_REGISTRY_GAP.consequence} {MODULE_REGISTRY_GAP.whyNotFixedHere}{' '}
        Reach below is derived from this module&rsquo;s own matrix through the same function the
        generator would have used, so it is the same answer by the same rule:{' '}
        {MODULE_REGISTRY_GAP.reachThisModuleWouldGet.map((r) => roleById(r).name).join(', ')}.
      </p>
    </div>
  )

  /* D11. The route registry, not this screen, decides whether the Worker
     reaches SURF-DOH at all — the shell asks it first and drops the module
     content. What the shell cannot know is this module's own cost, so it is
     stated here beside the shell rather than inside it. */
  if (role === 'WORKER') {
    return (
      <>
        <HubShell screen={hubScreen()} role={role} onRoleChange={setRole}>
          {annotation}
        </HubShell>
        <section
          aria-label="What the Worker loses on this module"
          data-testid="worker-d11-cost"
          className="mx-auto mt-4 max-w-5xl px-6"
        >
          <p className="max-w-prose text-sm text-[var(--color-ink)]">
            MOD-DOH-06&rsquo;s own matrix grants the Worker this module: row 2, L27910, reads{' '}
            <em>Allowed with conditions — own assigned runs only</em>, and{' '}
            <code>rolesReachingByMatrix</code> therefore returns all five roles for this module.
            The route registry withholds the surface anyway, which is D11 and is decided in one
            place, not restated here.
          </p>
          <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
            What that costs, stated rather than hidden: a worker cannot see the schedule of their
            own assigned runs anywhere in the Hub. They meet their assigned runs on the Frontline
            Worker Application, which is also the only surface on which a run is ended at all — row
            8, L27916: <em>the worker ends a run by completing or abandoning it on the device</em>.
          </p>
          <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
            The grant in the cell and the refusal at the route are both real and they are not
            reconciled in the source. The cell is rendered in the matrix below for every persona,
            including this one.
          </p>
        </section>
      </>
    )
  }

  if (!permitsRead(viewDecision)) {
    return (
      <HubShell screen={hubScreen()} role={role} onRoleChange={setRole}>
        {annotation}
        <section aria-label="Permission denied" className="mt-6">
          <h2 className="text-lg font-semibold">
            The run schedule board is not offered to {roleName}
          </h2>
          <div className="mt-3">
            <ScreenStateBoundary
              state="STATE-05"
              surface="SURF-DOH"
              detail={{ decision: viewDecision }}
            />
          </div>
        </section>
      </HubShell>
    )
  }

  return (
    <HubShell screen={hubScreen()} role={role} onRoleChange={setRole}>
      {annotation}

      {/* ---------------- SCR-DOH-13 — the board ---------------- */}
      <section aria-label="Run schedule board" className="mt-8">
        <h2 className="text-lg font-semibold">
          Run schedule board — today plus {HORIZON_DAYS} days
        </h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          §4.6.2, L27862: the schedule view shows a visibility horizon of today plus seven days,
          role-scoped and filterable by Job, Site, Area and Worker. The board&rsquo;s instant is{' '}
          {BOARD_NOW_LABEL}, a fixture value — nothing on this screen reads ambient time.
        </p>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Scope bounds the READ. {roleName} is shown {inScope.length} of the seeded runs, and the
          runs outside that scope are not on this page at all — not listed with their controls
          removed. Taking a button off a screen does not stop anyone.
        </p>

        <div className="mt-4">
          <Table
            caption={`Runs scheduled within the horizon, as ${roleName}`}
            columns={[
              { key: 'run', header: 'Run' },
              { key: 'job', header: 'Job' },
              { key: 'area', header: 'Area' },
              { key: 'start', header: 'Scheduled start' },
              { key: 'position', header: 'Position' },
              { key: 'open', header: '' },
            ]}
            rows={boardRuns.map((r) => boardRow(r, clock, setSelectedRunId))}
            emptyState={{
              title: 'No runs scheduled in this horizon',
              whatCreatesIt: 'A Supervisor creating a run against an active Job in their own Area.',
            }}
          />
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-semibold">Runs behind the scheduling horizon</h3>
          <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-muted)]">
            The horizon bounds the SCHEDULE view (L27862). Oversight of a run already in its closing
            lifecycle is {SCREEN_14.name}&rsquo;s job, so those runs are reachable here rather than
            dropped because their production date has passed &mdash; a <code>finished</code> run
            included, because §4.7.4 keeps changes to it exceptional rather than impossible and a
            record nobody can open cannot be corrected under the audited-recompute rule.
          </p>
          <div className="mt-2">
            <Table
              caption="Runs past their scheduled start"
              columns={[
                { key: 'run', header: 'Run' },
                { key: 'job', header: 'Job' },
                { key: 'area', header: 'Area' },
                { key: 'start', header: 'Scheduled start' },
                { key: 'position', header: 'Position' },
                { key: 'open', header: '' },
              ]}
              rows={behindHorizon.map((r) => boardRow(r, clock, setSelectedRunId))}
              emptyState={{
                title: 'Nothing behind the horizon',
                whatCreatesIt: 'A run whose production date has passed.',
              }}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <WriteAffordance
            label="Create a run"
            decision={createDecision}
            control="create-a-run"
            role={role}
          />
          <WriteAffordance
            label="Cancel a run"
            decision={cancelDecision}
            control="cancel-a-run"
            role={role}
          />
        </div>
      </section>

      {/* ---------------- SCR-DOH-14 — the run detail ---------------- */}
      <section aria-label="Run detail and oversight" className="mt-10">
        <h2 className="text-lg font-semibold">
          {SCREEN_14.name} — {SCREEN_14.id}
        </h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          A sub-view of the board, not a route of its own: catalogue B&rsquo;s navigation entry
          point for {SCREEN_14.id} is &ldquo;{SCREEN_14.navigationEntry}&rdquo; ({SCREEN_14.sourceRef}).
        </p>

        {selected === null ? (
          <p className="mt-3 text-sm text-[var(--color-ink-muted)]">
            Select a run above to open its detail.
          </p>
        ) : (
          <RunDetail
            row={selected}
            clock={clock}
            role={role}
            cancelDecision={cancelDecision}
            extendDecision={extendDecision}
            closeStuckDecision={closeStuckDecision}
          />
        )}
      </section>

      {/* ---------------- the finish window, and DEC-FINISH-001 mounted ---------------- */}
      <section aria-label="The record-finish window" className="mt-10">
        <h2 className="text-lg font-semibold">The record-finish window</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          A tenant-configurable period, default {hours(FINISH_WINDOW_DEFAULT_MS)}, validated on
          entry against a floor of {hours(FINISH_WINDOW_FLOOR_MS)} and a ceiling of{' '}
          {Math.round(FINISH_WINDOW_CEILING_MS / (24 * HOUR))} days. AC-RUN-005, L7129: a looser
          value is rejected rather than logged. The value is SET on{' '}
          <span className="font-medium">SCR-DOH-23, the tenant administration area</span> (L48117,
          rows 10 and 11 of the matrix below) and is ENFORCED here.
        </p>

        <div className="mt-3 max-w-sm">
          <Select
            label="Proposed finish window (hours)"
            value={String(windowHours)}
            onChange={(v) => setWindowHours(Number(v))}
            options={[12, 24, 48, 72, 168, 240].map((h) => ({
              value: String(h),
              label: `${h} hours`,
            }))}
          />
        </div>
        <p data-testid="finish-window-verdict" className="mt-2 text-sm text-[var(--color-ink)]">
          {(() => {
            const verdict = finishWindowVerdict(windowHours * HOUR)
            const rejection = finishWindowRejection(verdict)
            return rejection === null
              ? `Accepted. ${windowHours} hours is inside the platform bounds.`
              : `Rejected. ${rejection}`
          })()}
        </p>
        <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
          This is a validator, not a setting: no value is written from this screen, and rows 10 and
          11 of the matrix are rendered with a pointer and no field.
        </p>

        {/* THE MOUNT. `DEC_FINISH_001.onScreen` had no screen until this line. */}
        <div className="mt-4">
          <RunDecisionDisclosure decision={DEC_FINISH_001_MOUNTED} />
        </div>
      </section>

      {/* ---------------- the closing-state table, verbatim and flagged ---------------- */}
      <section aria-label="The closing lifecycle" className="mt-10">
        <h2 className="text-lg font-semibold">The closing lifecycle</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          §4.6.8, L27874: the execution states — scheduled and in progress, with cancelled as the
          terminal alternative at any point before submission — are followed by the three-state
          closing sequence. The word for the final state is <code>finished</code>; nothing on this
          platform is &ldquo;sealed&rdquo;.
        </p>

        <div className="mt-3">
          <Table
            caption="The closing-state table as this module states it (L27876-L27880, three data rows)"
            columns={[
              { key: 'state', header: 'State' },
              { key: 'meaning', header: 'Meaning' },
              { key: 'standing', header: 'Standing' },
            ]}
            rows={CLOSING_STATE_TABLE.map((r) => ({
              state: <code>{r.state}</code>,
              meaning: (
                <span>
                  {r.meaning}{' '}
                  <span className="text-xs text-[var(--color-ink-subtle)]">[{r.sourceRef}]</span>
                </span>
              ),
              standing: r.disputed ? (
                <StatusPill tone="attention" icon="●" label="One reading of three" />
              ) : (
                <StatusPill tone="ok" icon="●" label="Agreed across Parts" />
              ),
            }))}
            emptyState={{ title: 'No rows', whatCreatesIt: 'Never — the table has three rows.' }}
          />
        </div>

        <p
          data-testid="closing-table-is-one-reading"
          className="mt-3 max-w-prose text-sm text-[var(--color-ink)]"
        >
          This module&rsquo;s own closing-state table states DEC-RUNSTATE-001 Reading B as if it
          were settled: the definitions at L27878 and L27879 are the same words the decision card
          records as Reading B at L5245. The table is shown verbatim because it is what the source
          says, and it is shown flagged because it is one reading of three. Nothing on this screen
          is keyed on <code>submitted</code> or <code>complete</code>.
        </p>

        <div className="mt-4">
          <RunDecisionDisclosure decision={DEC_RUNSTATE_001} />
        </div>
      </section>

      {/* ---------------- the automatic transitions ---------------- */}
      <section aria-label="Automatic transitions and their timers" className="mt-10">
        <h2 className="text-lg font-semibold">Automatic transitions</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Three clock-driven timers, of which two change run state. No actor is recorded against any
          of them, and none can be: the evaluator&rsquo;s record types its actor field as the
          literal <code>null</code>, so a caller with an identity in hand cannot put a person&rsquo;s
          name against a cancellation they did not make. The no-show alert fires at plus{' '}
          {NO_SHOW_ALERT_AFTER_MS / 60_000} minutes and the auto-cancellation at plus{' '}
          {AUTO_CANCEL_AFTER_MS / 60_000} (L27868); the auto-close fires when the finish window
          elapses (L27880).
        </p>
        <div className="mt-3">
          <Table
            caption="Every row the plan named a timer, and how each one actually reads at its own locator"
            columns={[
              { key: 'row', header: 'Row' },
              { key: 'locator', header: 'Locator' },
              { key: 'kind', header: 'What it is' },
              { key: 'finding', header: 'Finding' },
            ]}
            rows={BRIEFED_TIMER_ROWS.map((t) => ({
              row: t.row,
              locator: t.locator,
              kind: t.kind,
              finding: t.finding,
            }))}
            emptyState={{ title: 'No rows', whatCreatesIt: 'Never.' }}
          />
        </div>
        <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
          The three that fall due on a clock are {DUE_TIMERS.join(', ')}. The Summary recompute has
          no due instant — a capture ARRIVING drives it — and the review-queue aging bands are a
          display band the source explicitly refuses to make a lock.
        </p>
      </section>

      {/* ---------------- the matrix ---------------- */}
      <section aria-label="Roles and permissions" className="mt-10">
        <h2 className="text-lg font-semibold">Roles and permissions</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Twelve rows, measured at L27909 through L27920 — the header is L27907 and the separator
          L27908. Every cell carries its own text; a blank cell is an unanswered question an
          implementer would answer privately (L10238). Reach is derived from these rows and is{' '}
          {MOD_DOH_06_ROLES_REACHING.map((r) => roleById(r).name).join(', ')} — catalogue B&rsquo;s
          own cell for {SCREEN_13.id} names only &ldquo;{SCREEN_13.catalogueBRoles}&rdquo; ({SCREEN_13.sourceRef}),
          which is narrower than L27910 gives, and the narrowing is disclosed rather than obeyed.
        </p>
        <div className="mt-3">
          <Table
            caption="MOD-DOH-06 control matrix, twelve data rows"
            columns={[
              { key: 'control', header: 'Action' },
              ...TENANT_ROLE_ORDER.map((r) => ({ key: r, header: roleById(r).name })),
              { key: 'source', header: 'Source' },
            ]}
            rows={MOD_DOH_06_MATRIX.map((row) => {
              const cells: TableRow = {
                control: (
                  <span>
                    <span className="font-medium">{row.control}</span>
                    <span className="mt-1 block text-xs text-[var(--color-ink-subtle)]">
                      {row.rendering}
                    </span>
                  </span>
                ),
                source: <span className="text-xs">{row.sourceRef}</span>,
              }
              for (const r of TENANT_ROLE_ORDER) {
                cells[r] = (
                  <span data-testid={`cell-${row.id}-${r}`}>
                    <StatusPill
                      tone={STATUS_TONE[row.status[r]]}
                      icon="●"
                      label={STATUS_LABEL[row.status[r]]}
                    />
                    <span className="mt-1 block text-xs text-[var(--color-ink-muted)]">
                      {row.detail[r]}
                    </span>
                  </span>
                )
              }
              return cells
            })}
            emptyState={{ title: 'No rows', whatCreatesIt: 'Never — the matrix has twelve rows.' }}
          />
        </div>

        {/* Row 8's Worker cell names an act met on another SURFACE. A statement,
            a checked link where the persona reaches the target, and no control —
            never a disabled button, which would imply a condition that could
            become true. */}
        <div className="mt-4">
          <p className="mb-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
            Row 8, &ldquo;Pause or stop a run&rdquo;, refuses every oversight role — the Tenant
            Admin cell carries the qualifier in the source&rsquo;s own words,{' '}
            <em>deliberately impossible from any oversight surface</em>, and L49583 restates it from
            the Command Center side. The Worker cell names a different act, and that one IS met:
          </p>
          <CrossSurfaceStatement
            statement={crossSurfaceStatement('step-execution-and-capture', role)}
          />
        </div>
      </section>

      {/* ---------------- contradictions and silences ---------------- */}
      <section aria-label="Where the source disagrees with itself" className="mt-10">
        <h2 className="text-lg font-semibold">Where the source disagrees with itself</h2>
        <ul className="mt-3 space-y-4">
          {RUN_CONTRADICTIONS.map((c) => (
            <li
              key={c.id + c.claimLocators[0]}
              data-testid={`contradiction-${c.id}`}
              className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-4 text-sm"
            >
              <p className="font-medium text-[var(--color-ink)]">{c.id}</p>
              <p className="mt-1 text-[var(--color-ink)]">{c.claim}</p>
              <p className="text-xs text-[var(--color-ink-subtle)]">{c.claimLocators.join(' · ')}</p>
              <p className="mt-2 text-[var(--color-ink)]">{c.against}</p>
              <p className="text-xs text-[var(--color-ink-subtle)]">
                {c.againstLocators.join(' · ')}
              </p>
              <p className="mt-2 text-[var(--color-ink-muted)]">{c.rendered}</p>
            </li>
          ))}
        </ul>

        <div
          data-testid="deferral-rendering"
          className="mt-6 rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-4 text-sm"
        >
          <p className="font-medium text-[var(--color-ink)]">
            How a deferred capability renders here
          </p>
          <p className="mt-1 text-[var(--color-ink)]">{DEFERRAL_RENDERING.adopted}</p>
          <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
            {DEFERRAL_RENDERING.adoptedFrom} · also settled the same way at{' '}
            {DEFERRAL_RENDERING.alsoSettledBy}
          </p>
          <p className="mt-2 text-[var(--color-ink-muted)]">{DEFERRAL_RENDERING.constraint}</p>
          <p className="mt-2 text-[var(--color-ink-muted)]">
            {DEFERRAL_RENDERING.correctionToTheBrief}
          </p>
        </div>

        <h3 className="mt-6 text-sm font-semibold">What the source does not say</h3>
        <ul className="mt-2 space-y-3">
          {UNSPECIFIED_IN_SOURCE.map((s) => (
            <li key={s.topic} className="text-sm">
              <span className="font-medium text-[var(--color-ink)]">{s.topic}</span>
              <span className="block text-[var(--color-ink-muted)]">{s.whatIsMissing}</span>
              <span className="block text-xs text-[var(--color-ink-subtle)]">{s.sourceRef}</span>
            </li>
          ))}
        </ul>
      </section>
    </HubShell>
  )
}

/* ==================================================================== *
 * PARTS
 * ==================================================================== */

function hubScreen() {
  return {
    title: 'Run Scheduling and Execution Oversight',
    annotation: `MOD-DOH-06 · ${SCREEN_13.id} ${SCREEN_13.name} · ${SCREEN_14.id} ${SCREEN_14.name}`,
    purpose:
      'Create, schedule, oversee, modify within strict limits, and close the execution records that everything else on the platform hangs off.',
  }
}

function positionPill(row: RunBoardRow, clock: ReturnType<typeof boardClock>) {
  if (stateIsGovernedByDecStuck(row)) {
    return <StatusPill tone="attention" icon="●" label="Closed by hand — state open (DEC-STUCK-001)" />
  }
  const pos = closingPosition(row.facts, clock)
  if (pos.kind === 'disputed') {
    return <StatusPill tone="attention" icon="●" label="Contested — three readings" />
  }
  if (inTheContestedSpan(row, clock)) {
    return <StatusPill tone="attention" icon="●" label="Contested — three readings" />
  }
  const tone: StatusTone =
    pos.position === 'cancelled' ? 'blocked' : pos.position === 'finished' ? 'neutral' : 'info'
  return <StatusPill tone={tone} icon="●" label={pos.position.replace('_', ' ')} />
}

function boardRow(
  row: RunBoardRow,
  clock: ReturnType<typeof boardClock>,
  open: (id: string) => void,
): TableRow {
  return {
    run: <code data-testid={`run-${row.facts.runId}`}>{row.facts.runId}</code>,
    job: row.jobName,
    area: row.areaName,
    start: relativeToBoard(row.facts.scheduledStartMs),
    position: (
      <span data-testid={`position-${row.facts.runId}`}>{positionPill(row, clock)}</span>
    ),
    open: (
      <button
        type="button"
        onClick={() => open(row.facts.runId)}
        className="underline text-[var(--color-primary)]"
      >
        Open detail
      </button>
    ),
  }
}

/**
 * A write affordance, or the refusal in its place. NEVER a disabled control
 * for a capability that is refused by role: `Explicitly prohibited` on the
 * role axis means the persona meets a stated refusal, not a button it could
 * one day press.
 */
function WriteAffordance({
  label,
  decision,
  control,
  role,
}: {
  readonly label: string
  readonly decision: PermissionDecision
  readonly control: RunControlId
  readonly role: TenantRoleId
}) {
  const row = matrixRow(control)
  if (permitsRead(decision) && decision.outcome !== 'readOnly') {
    return (
      <button
        type="button"
        data-testid={`control-${control}`}
        className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] px-3 py-2 text-sm"
      >
        {label}
      </button>
    )
  }
  return (
    <p
      data-testid={`refusal-${control}`}
      className="max-w-prose rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] p-3 text-sm text-[var(--color-ink-muted)]"
    >
      <span className="font-medium text-[var(--color-ink)]">{label} — not offered here.</span>{' '}
      {row.detail[role]} <span className="text-xs">[{row.sourceRef}]</span>
    </p>
  )
}

function RunDetail({
  row,
  clock,
  role,
  cancelDecision,
  extendDecision,
  closeStuckDecision,
}: {
  readonly row: RunBoardRow
  readonly clock: ReturnType<typeof boardClock>
  readonly role: TenantRoleId
  readonly cancelDecision: PermissionDecision
  readonly extendDecision: PermissionDecision
  readonly closeStuckDecision: PermissionDecision
}) {
  const due = dueTransitions(row.facts, clock)
  const windowEnd = finishWindowEndsAtMs(row.facts)
  const lateNow = lateCaptureOutcome(row.facts, clock.now(), false)
  const contested = inTheContestedSpan(row, clock) && !stateIsGovernedByDecStuck(row)

  return (
    <div className="mt-4 space-y-6" data-testid={`detail-${row.facts.runId}`}>
      <div>
        <h3 className="font-semibold">
          {row.facts.runId} — {row.jobName}
        </h3>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          {row.areaName} · {row.shiftName} shift · planned quantity {row.plannedQuantity} ·
          scheduled {relativeToBoard(row.facts.scheduledStartMs)}
        </p>
        <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
          §4.6.2, L27864: <code>production_date</code> is the Shift&rsquo;s nominal date, not the
          actual start or end timestamp, so a run crossing midnight still reports coherently.
        </p>
      </div>

      {/* WF-AUT-010 — the pin */}
      <section
        aria-label="Pinned work package"
        data-testid="pin-panel"
        className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-4"
      >
        <h4 className="font-medium">Pinned work package — {WF_AUT_010.id}</h4>
        <p className="mt-1 text-sm text-[var(--color-ink)]">
          <code>{row.packagePin}</code>
        </p>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {WF_AUT_010.whenItHappens} It is immutable for the life of the run. {WF_AUT_010.deniedPath}
        </p>
        {row.packageOnDevice ? null : (
          <div className="mt-3">
            <Banner
              tone="blocked"
              heading="Assigned and not ready"
              body={WF_AUT_010.notReady}
            />
          </div>
        )}
        <ul className="mt-3 space-y-1 text-xs text-[var(--color-ink-subtle)]">
          {WF_AUT_010.acceptance.map((a) => (
            <li key={a}>{a}</li>
          ))}
          <li>{WF_AUT_010.sourceRef}</li>
        </ul>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          This is the only screen on which the pin and the library-pointer rule are both visible at
          once, which is why the decision below renders here — the identical component, wording and
          locator set the Studio screen renders, because there is only one of each.
        </p>
        <div className="mt-3">
          <DecisionDisclosure id="DEC-LIB-001" />
        </div>
      </section>

      {/* DEC-RUNSTATE-001, where it bites */}
      {contested ? (
        <section
          aria-label="What this run is called"
          data-testid="runstate-readings"
          className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-4"
        >
          <h4 className="font-medium">What this run is called, right now</h4>
          <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
            Three Parts of the source answer this differently and the client has not chosen. All
            three answers are shown; the board is not keyed on any of them.
          </p>
          <ul className="mt-3 space-y-3">
            {runStateReadings(row).map((r) => (
              <li key={r.reading} data-testid={`reading-${r.reading}`} className="text-sm">
                <span className="font-medium text-[var(--color-ink)]">Reading {r.reading}</span>{' '}
                <span className="text-[var(--color-ink)]">{r.answer}</span>
                <span className="block text-xs text-[var(--color-ink-subtle)]">
                  {r.locator} · under this reading the run passes through <code>submitted</code>{' '}
                  {r.submittedReachedTimes} time{r.submittedReachedTimes === 1 ? '' : 's'}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <RunDecisionDisclosure decision={DEC_RUNSTATE_001} />
          </div>
        </section>
      ) : null}

      {/* DEC-STUCK-001, where it bites */}
      {stateIsGovernedByDecStuck(row) ? (
        <section
          aria-label="Closed by hand"
          data-testid="stuck-close-panel"
          className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-4"
        >
          <h4 className="font-medium">This run was closed by hand</h4>
          <p className="mt-1 max-w-prose text-sm text-[var(--color-ink)]">
            Closed at {relativeToBoard(row.manuallyClosedAtMs ?? 0)}.{' '}
            <span data-testid="stuck-asserted">{manualCloseAssertion.asserted}</span> The window
            ends {windowEnd === null ? 'never' : relativeToBoard(windowEnd)}.
          </p>
          <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
            <span data-testid="stuck-not-asserted">
              Not asserted: {manualCloseAssertion.notAsserted}
            </span>{' '}
            [{manualCloseAssertion.sourceRef}] Row 9 of the matrix below states one of the two
            readings as its condition; it is rendered as the source&rsquo;s cell, not as this
            build&rsquo;s rule.
          </p>
          <div className="mt-4">
            <RunDecisionDisclosure decision={DEC_STUCK_001} />
          </div>
        </section>
      ) : null}

      {/* the timers on this run */}
      <section
        aria-label="Timers on this run"
        data-testid="run-timers"
        className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-4"
      >
        <h4 className="font-medium">Timers</h4>
        {due.length === 0 ? (
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Nothing has fallen due on this run at the board&rsquo;s instant.
          </p>
        ) : (
          <ul className="mt-1 space-y-1 text-sm">
            {due.map((t) => (
              <li key={t.id} data-testid={`due-${t.id}`}>
                <code>{t.id}</code> fell due at {relativeToBoard(t.atMs)}
                {t.toState === null
                  ? ' and moves no run state'
                  : ` and moves the run to ${t.toState}`}
                . No actor is recorded, and none can be.
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Late-arriving capture, tested at the board&rsquo;s instant:{' '}
          <span data-testid="late-capture-outcome">
            {lateNow.accepted
              ? lateNow.flags.length === 0
                ? 'accepted as an ordinary capture — the run has not completed, so there is nothing to recompute.'
                : `accepted and flagged ${lateNow.flags.join(', ')}; the Summary recomputes and the recompute is logged.`
              : 'rejected — the finish window has elapsed. It may only enter as an append-only correction (AC-RUN-003, L7127).'}
          </span>
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <WriteAffordance
          label="Cancel this run"
          decision={cancelDecision}
          control="cancel-a-run"
          role={role}
        />
        <WriteAffordance
          label="Extend the end time"
          decision={extendDecision}
          control="extend-a-run-end-time"
          role={role}
        />
        <WriteAffordance
          label="Close this stuck run"
          decision={closeStuckDecision}
          control="close-a-stuck-run-manually"
          role={role}
        />
      </div>

      <p className="text-sm text-[var(--color-ink-muted)]">
        Worker assignment and mid-run substitution are{' '}
        <Link href="/hub/worker-assignment/" className="underline">
          MOD-DOH-07&rsquo;s screen
        </Link>{' '}
        — SCR-DOH-15, L48109, entered from this run detail. This module points at it rather than
        drawing a second substitution control for one record.
      </p>
    </div>
  )
}
