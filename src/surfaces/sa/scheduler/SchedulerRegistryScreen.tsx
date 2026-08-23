import { emptyDomainState } from '@/domain/state'
import { scenarioRunId } from '@/domain/ids'
import { rolesInDomain, roleById, type RoleId } from '@/domain/roles'
import type { AccessContext } from '@/policy/evaluate'
import {
  MATRIX_A,
  SCHEDULE_OPERATIONS,
  operationEnumeratedAs,
  scheduleAttribution,
  scheduleDecision,
  scheduleRow,
  type ScheduleOperationId,
} from '@/policy/schedule-operations'
import { cellFor } from '@/policy/columns'
import { saFreshnessFor } from '@/surfaces/sa/freshness'
import { StatusPill, Table } from '@/ui/primitives'
import {
  ANSWERED_COLUMNS,
  CADENCE_CELLS_HOLDING_A_CRON_EXPRESSION,
  DEPLOYABLE_CENSUS,
  REGISTRY_COLUMNS,
  REGISTRY_ROWS,
  SCHEDULER_SCREENS,
  TELEMETRY_STATE,
  THE_NOUN,
  UNANSWERED_COLUMNS,
  healthLabel,
  healthTone,
  telemetryReading,
} from './registry'
import { SchedulerScaffold } from './SchedulerScaffold'

/**
 * `SCR-SA-SCHED-01`, the Scheduler Registry — "A table of every `SCHED-*`
 * definition on the platform" with ten named columns (L99687, whole line).
 *
 * ── WHERE THE TABLE'S DATA COMES FROM, AND WHY IT IS NOT INVENTED ──────────
 * "Every `SCHED-*` definition on the platform" has exactly one register in the
 * frozen source that is a list of definitions rather than of findings: the
 * scheduled-work definition register at §45A.17.1, twenty-four rows keyed by
 * mnemonic. `src/scheduling/registers.ts` transcribed it in wave 1 and its
 * census is the denominator, so this screen derives its rows from that
 * transcription and adds nothing.
 *
 * IT IS DELIBERATELY NOT THE THIRTY-FIVE NUMBERED FINDINGS. L102392 rules that
 * "a numbered row is a finding, a mnemonic row is a commitment", and thirteen
 * of the thirty-five findings are classified not a scheduled obligation at
 * all. A registry of definitions that listed thirteen non-definitions would be
 * a false claim about what the platform schedules, and the crosswalk in
 * `src/scheduling/crosswalk.ts` is where that reconciliation already lives.
 *
 * ── FIVE OF THE TEN COLUMNS HAVE NOTHING BEHIND THEM ───────────────────────
 * The register's own header declares seven columns and none of them is scope;
 * four more of L99687's ten are live telemetry and nothing runs here. Those
 * five are drawn as named absences with the reason for each, which is the
 * opposite of the failure the surface's own terminal safe state describes:
 * "A green indicator computed from stale data is the single most dangerous
 * rendering on this surface" (L100766, whole line).
 *
 * ── THE CONTROLS ARE THE MATRIX, NOT A HAND-WRITTEN LIST ───────────────────
 * L100761 names six governed controls and L99689 names two, all maker-checker
 * or root-approved. Every one of them is one of the twenty-two operations
 * 45A.7 governs, so the screen answers each from `MATRIX_A` through
 * `scheduleDecision` rather than restating a permission. `AC-SCHED-182`
 * (L100774) is the criterion that makes that the right source: "Every
 * schedule-affecting control follows maker-checker."
 *
 * NOT ONE CONTROL IS OPERABLE. Every affordance below is a readout of what the
 * matrix says the four platform roles may do; there is no button, no handler
 * and no state. That is what keeps this a server component and keeps the
 * boundary defect out of it, and it is honest: with no scheduler behind the
 * screen there is nothing for a control to act on.
 */

/** The seven governed controls, each mapped to the operation that governs it. */
const GOVERNED_CONTROLS: readonly {
  readonly operation: ScheduleOperationId
  readonly asTheSourceNamesIt: string
  readonly locator: string
}[] = [
  {
    operation: 'PER-SCHED-10',
    asTheSourceNamesIt: 'Propose cron change',
    locator: 'L100761',
  },
  {
    operation: 'PER-SCHED-12',
    asTheSourceNamesIt: 'Propose catch-up policy change',
    locator: 'L100761',
  },
  {
    operation: 'PER-SCHED-13',
    asTheSourceNamesIt: 'Trigger a governed manual tick — reason required, audited, rate-limited',
    locator: 'L100761',
  },
  {
    operation: 'PER-SCHED-19',
    asTheSourceNamesIt: 'Redrive a dead-letter batch — permitted with a reason, audited',
    locator: 'L100761',
  },
  {
    operation: 'PER-SCHED-07',
    asTheSourceNamesIt:
      'Pause a definition — with a reason, audited, and never where the pause would suppress a safety obligation',
    locator: 'L100761',
  },
  {
    operation: 'PER-SCHED-21',
    asTheSourceNamesIt: 'Change the maintenance-window calendar',
    locator: 'L99689',
  },
  {
    operation: 'PER-SCHED-01',
    asTheSourceNamesIt: 'View the registry itself',
    locator: 'L99687',
  },
]

/**
 * What this screen refuses, transcribed from the two prohibition bullets:
 * L99690 and L100762, each read whole.
 */
const PROHIBITED = [
  {
    text: 'No "run now against tenant X" button that touches operational content without an access class.',
    locator: 'L99690',
  },
  {
    text: 'No pause of the deterministic on-device layer — it has no off switch.',
    locator: 'L99690',
  },
  {
    text: 'No control reads a capture, a measurement, a worker identity or an evidence item.',
    locator: 'L100762',
  },
  {
    text: 'No control decides a tenant gate item, releases a hold or performs any of the ten operational actions — "visibility, not intervention".',
    locator: 'L100762',
  },
] as const

const PLATFORM_ROLES = rolesInDomain('PLATFORM')

/**
 * The console operator's evaluation context. `actorOfRecord` is a NAMED
 * storyboard operator rather than `null`, because rule two of 45A.7 requires
 * an audit row to name an identity and never a role, and
 * `scheduleAttribution` refuses a role column whose actor is null for exactly
 * that reason (L99197). A platform-domain role holds no ambient tenant.
 */
function contextFor(role: RoleId): AccessContext {
  return {
    state: emptyDomainState(scenarioRunId('RUN-SA-SCHED-01-STORYBOARD')),
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
    actorOfRecord: 'console-operator-storyboard',
  }
}

/**
 * The Matrix A column for a platform role. A throw rather than a fallback:
 * every one of the four platform roles is a column of that matrix by
 * transcription, so a miss is a transcription defect and a silent default
 * would answer a permission question from the wrong column.
 */
function platformColumn(role: RoleId) {
  const column = MATRIX_A.columns.find((c) => c.kind === 'role' && c.role === role)
  if (column === undefined) {
    throw new Error(`Matrix A has no column for ${role}; its header declares four platform roles`)
  }
  return column
}

function liveFor(role: RoleId, operation: ScheduleOperationId) {
  return {
    req: {
      action: `SCHEDULE/${operation}`,
      sourceRefs: [scheduleRow(MATRIX_A, operation).sourceRef],
    },
    ctx: contextFor(role),
  }
}

/**
 * The cell's answer for one role, in the source's own words wherever it is
 * not a plain allow. A conditional cell renders its condition rather than the
 * word "Allowed": dropping the condition is the cell silently widened.
 */
function answerFor(operation: ScheduleOperationId, role: RoleId): string {
  const column = platformColumn(role)
  const decision = scheduleDecision(operation, column, liveFor(role, operation))
  return decision.outcome === 'allowed'
    ? 'Allowed'
    : cellFor(scheduleRow(MATRIX_A, operation), column).detail
}

export function SchedulerRegistryScreen() {
  const [screen] = SCHEDULER_SCREENS
  const freshness = saFreshnessFor(TELEMETRY_STATE)
  const reading = telemetryReading()
  const engineerAttribution = scheduleAttribution(
    platformColumn('PLATFORM_ENGINEER'),
    liveFor('PLATFORM_ENGINEER', 'PER-SCHED-13'),
    null,
  )

  return (
    <SchedulerScaffold
      screen={screen}
      purpose="A table of every scheduled-work definition on the platform, with its owning surface, its authority class, its mechanism class and its trigger description. Everything shown is layer-1 named administration and telemetry: no tenant operational content appears here."
    >
      <section className="mt-10">
        <h2 className="text-lg font-semibold">The ten columns the source names</h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Transcribed in the source&rsquo;s own order and its own words. Five of the ten have data
          behind them and five do not, and which is which is stated rather than left to a reader to
          infer from an empty cell.
        </p>
        <ol className="mt-3 grid gap-1 text-sm md:grid-cols-2">
          {REGISTRY_COLUMNS.map((c, i) => (
            <li key={c.label} className="flex items-baseline gap-2">
              <span className="text-[var(--color-ink-subtle)]">{i + 1}.</span>
              <span className="text-[var(--color-ink)]">{c.label}</span>
              {c.answerability === 'definitionRegister' ? null : (
                <span className="text-xs text-[var(--color-ink-subtle)]">— no data</span>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">
          The definitions — {REGISTRY_ROWS.length} scheduled work items
        </h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          One row per commitment in the scheduled-work definition register. The count is the
          register&rsquo;s own, counted by reading to where its body stops
          {DEPLOYABLE_CENSUS === undefined
            ? '.'
            : `: ${DEPLOYABLE_CENSUS.counted} rows in section ${DEPLOYABLE_CENSUS.section}, and the source states the same figure beside them.`}
        </p>
        <div className="mt-3 overflow-x-auto">
          <Table
            caption="Scheduled-work definitions on the platform"
            columns={[
              { key: 'id', header: 'identifier' },
              ...ANSWERED_COLUMNS.map((c) => ({ key: c.label, header: c.label })),
            ]}
            rows={REGISTRY_ROWS.map((row) => ({
              id: row.id,
              ...Object.fromEntries(ANSWERED_COLUMNS.map((c, i) => [c.label, row.cells[i] ?? ''])),
            }))}
            emptyState={{
              title: 'No scheduled-work definition is registered',
              whatCreatesIt:
                'A definition enters the register when the deliverable register names it.',
            }}
          />
        </div>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Measured across those {REGISTRY_ROWS.length} rows:{' '}
          {CADENCE_CELLS_HOLDING_A_CRON_EXPRESSION} of them state a cron expression. The
          register&rsquo;s corresponding column is a due rule in words, so the fifth column above
          is answered by its trigger-description half alone, and the expressions the first half
          names exist nowhere in the source.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">The five columns with nothing behind them</h2>
        <div className="mt-3 space-y-4">
          {UNANSWERED_COLUMNS.map((c) => (
            <div key={c.label}>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-sm font-medium text-[var(--color-ink)]">{c.label}</span>
                <StatusPill
                  tone={c.answerability === 'telemetry' ? 'neutral' : 'attention'}
                  icon={c.answerability === 'telemetry' ? '○' : '◇'}
                  label={c.answerability === 'telemetry' ? reading : 'Not carried by any register'}
                />
              </div>
              <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">{c.whyNot}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <StatusPill
            tone={healthTone(freshness)}
            icon="◔"
            label={healthLabel(freshness)}
          />
          <span className="text-xs text-[var(--color-ink-subtle)]">
            The health chip is derived from the three readings above it, so it reads unknown for as
            long as they do. It never reads healthy from an absent or a stale figure.
          </span>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">
          Governed controls — what the matrix says, for each platform role
        </h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Each control is one of the {SCHEDULE_OPERATIONS.length} governed scheduling operations,
          and each answer below is that operation&rsquo;s own cell for that role, read from the
          transcribed matrix. Nothing here is operable: this screen has no scheduler to act on and
          therefore offers no control that would pretend otherwise.
        </p>
        <div className="mt-3 overflow-x-auto">
          <Table
            caption="Governed scheduling controls and the platform roles that hold them"
            columns={[
              { key: 'control', header: 'Control, as the source names it' },
              { key: 'operation', header: 'Governing operation' },
              ...PLATFORM_ROLES.map((r) => ({ key: r.id, header: r.name })),
            ]}
            rows={GOVERNED_CONTROLS.map((control) => ({
              control: (
                <span>
                  {control.asTheSourceNamesIt}{' '}
                  <span className="text-xs text-[var(--color-ink-subtle)]">
                    {control.locator}
                  </span>
                </span>
              ),
              operation: (
                <span>
                  {control.operation}{' '}
                  <span className="text-xs text-[var(--color-ink-subtle)]">
                    {operationEnumeratedAs(control.operation)}
                  </span>
                </span>
              ),
              ...Object.fromEntries(
                PLATFORM_ROLES.map((r) => [r.id, answerFor(control.operation, r.id)]),
              ),
            }))}
            emptyState={{
              title: 'No governed control is named for this screen',
              whatCreatesIt: 'A control appears when the storyboard names it.',
            }}
          />
        </div>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Who an audit row would name, if one of these were exercised: the actor is the console
          operator&rsquo;s own identity and the authority is their role, and the two are never
          written into one field.
          For the Platform Engineer proposing a manual tick that reads actor &ldquo;
          {engineerAttribution.actor}&rdquo;, authority &ldquo;{engineerAttribution.authority}
          &rdquo; — and {roleById('PLATFORM_ENGINEER').name} is the authority field, never the
          actor field.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Prohibited on this screen</h2>
        <ul className="mt-3 space-y-2 text-sm text-[var(--color-ink-muted)]">
          {PROHIBITED.map((p) => (
            <li key={p.text}>
              {p.text}{' '}
              <span className="text-xs text-[var(--color-ink-subtle)]">{p.locator}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The per-tenant backlog drill the console storyboard adds names the tenant and shows counts
          only, because naming a tenant is layer 1. It is not drawn here: with no {THE_NOUN} running
          there is no backlog to drill into, and drawing an empty drill would suggest the count it
          would show is zero rather than unrecorded.
        </p>
      </section>
    </SchedulerScaffold>
  )
}
