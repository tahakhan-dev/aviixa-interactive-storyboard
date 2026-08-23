import { StatusPill, Table } from '@/ui/primitives'
import { saFreshnessFor } from '@/surfaces/sa/freshness'
import {
  BLOCK_REASON_CLASSES,
  OCCURRENCE_DETAIL_EXCLUDES,
  OCCURRENCE_DETAIL_FIELDS,
  OCCURRENCE_OUTCOME_VOCABULARY_CONFLICT,
  SCHEDULER_SCREENS,
  TELEMETRY_STATE,
  THE_NOUN,
  telemetryReading,
} from './registry'
import { SchedulerScaffold } from './SchedulerScaffold'

/**
 * `SCR-SA-SCHED-02`, Occurrence detail — the screen the source names once.
 *
 * ── WHAT THIS SCREEN IS AND WHAT IT REFUSES TO BE ──────────────────────────
 * L100760, whole line, is the entirety of the specification: eight fields, and
 * then "It shows **no** tenant operational content: no measurement, no worker
 * name, no evidence." The eight fields are transcribed in that order and the
 * exclusion is rendered beside them, because the exclusion is the half of that
 * line a screen is most likely to lose and losing it turns a layer-1 telemetry
 * readout into a record reader on paper.
 *
 * NOTHING IS EXTRAPOLATED FROM THE REGISTRY SCREEN. The registry screen has
 * four lines of specification, a controls block, a prohibitions block and two
 * worked examples; this screen has one line. Borrowing the registry's controls
 * or its telemetry treatment to fill the difference would manufacture a
 * specification the source does not have, and the difference is precisely
 * what this task exists to show.
 *
 * NO OCCURRENCE IS DRAWN, AND THAT IS THE HONEST RENDERING. No scheduled work
 * item runs behind this application, so no occurrence exists to detail.
 * The screen therefore renders the eight fields as the specification they are,
 * with each value stated as unrecorded rather than blank, zero or invented —
 * and an invented occurrence row here would be the worst available outcome,
 * because a plausible one is indistinguishable from a real one and would be
 * quoted back as the source's.
 *
 * ── THE ONE FIELD WITH A CLOSED SOURCE VOCABULARY, AND THE ONE WITH TWO ────
 * `the reason class for any block or failure` has one: the eight gate
 * conditions of the execution gate each name their own block reason class, in
 * a table whose body is L100972-L100979. Those eight are rendered.
 *
 * `outcome` has TWO source vocabularies and no cross-reference between them —
 * fifteen states as lifecycle-diagram nodes, twelve as an inline register — and
 * this screen names both with their locators and settles neither. It mints no
 * decision identifier for the conflict, because the source raises none.
 */

export function OccurrenceDetailScreen() {
  const [, screen] = SCHEDULER_SCREENS
  const reading = telemetryReading()
  const freshness = saFreshnessFor(TELEMETRY_STATE)
  const conflict = OCCURRENCE_OUTCOME_VOCABULARY_CONFLICT

  return (
    <SchedulerScaffold
      screen={screen}
      purpose="One occurrence of one scheduled-work definition, shown as identifier, definition, intended time, actual time, duration, outcome, attempt count and the reason class for any block or failure. It shows no tenant operational content."
    >
      <section className="mt-10">
        <h2 className="text-lg font-semibold">
          The eight fields the source names — and what each one holds here
        </h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Transcribed in the source&rsquo;s own order and its own words, from the one line that
          specifies this screen. Every value reads {reading.toLowerCase()}: no {THE_NOUN} has run,
          so there is no occurrence to detail, and an unrecorded value is never drawn as a zero, a
          blank or a placeholder date.
        </p>
        <div className="mt-3 overflow-x-auto">
          <Table
            caption="Occurrence detail fields, and what the source says about each"
            columns={[
              { key: 'field', header: 'Field' },
              { key: 'value', header: 'Value' },
              { key: 'note', header: 'What the source says about it' },
            ]}
            rows={OCCURRENCE_DETAIL_FIELDS.map((f) => ({
              field: f.label,
              value: (
                <StatusPill
                  tone={freshness === 'current' ? 'ok' : 'neutral'}
                  icon="○"
                  label={reading}
                />
              ),
              note: (
                <span>
                  {f.definedAt === null ? (
                    <span className="text-xs text-[var(--color-ink-subtle)]">
                      Nothing beyond L100760 —{' '}
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--color-ink-subtle)]">
                      L{f.definedAt} —{' '}
                    </span>
                  )}
                  {f.note}
                </span>
              ),
            }))}
            emptyState={{
              title: 'No field is specified for this screen',
              whatCreatesIt: 'A field appears when the storyboard line names it.',
            }}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">What this screen shows no part of</h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The second half of the same line, and it is not a softening of the first: this screen
          shows <span className="font-semibold text-[var(--color-ink)]">no</span> tenant operational
          content.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {OCCURRENCE_DETAIL_EXCLUDES.map((x) => (
            <li key={x}>
              <StatusPill tone="blocked" icon="✕" label={x} />
            </li>
          ))}
        </ul>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Reaching any of those three needs one of the three named access classes — a reason-linked,
          ticket-linked, time-boxed support session, the compliance-emergency path, or a JBS access
          grant — and none of them is a control on this screen.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">
          The reason class for a block — the one field with a closed vocabulary
        </h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Before any occurrence executes, eight things must be establishable from current data. Each
          one, when it cannot be established, names its own reason class — so a blocked occurrence
          always says which of the eight stopped it, and never simply fails.
        </p>
        <div className="mt-3 overflow-x-auto">
          <Table
            caption="The eight gate conditions and the reason class each blocks under"
            columns={[
              { key: 'n', header: '#' },
              { key: 'condition', header: 'Condition' },
              { key: 'reason', header: 'Reason class' },
              { key: 'locator', header: 'Line' },
            ]}
            rows={BLOCK_REASON_CLASSES.map((c) => ({
              n: String(c.condition),
              condition: c.name,
              reason: <code className="text-xs">{c.reasonClass}</code>,
              locator: `L${c.line}`,
            }))}
            emptyState={{
              title: 'No gate condition is named',
              whatCreatesIt: 'A condition appears when the execution gate table names it.',
            }}
          />
        </div>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          A block is not a failure and neither is a hold. Where a legal hold excludes an object, the
          registry shows it as held rather than as failed — the two are different outcomes and
          collapsing them would report a governed refusal as a fault.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">
          The outcome field has two source vocabularies, and neither is preferred here
        </h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Measured: the occurrence lifecycle declares{' '}
          {conflict.lifecycleDiagram.countedStates} states as diagram nodes at L
          {conflict.lifecycleDiagram.firstNodeLine}&ndash;L
          {conflict.lifecycleDiagram.lastNodeLine}, and the occurrence state register declares{' '}
          {conflict.stateRegister.countedStates} inline at L{conflict.stateRegister.line}, saying
          none of them may be collapsed into a single done. Only{' '}
          {conflict.common.length} names appear in both. They are two sets, not two spellings of
          one, and the register&rsquo;s set carries distinctions the lifecycle set has no state for
          at all.
        </p>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">
              The lifecycle set — {conflict.lifecycleDiagram.shippedCount} states, and the set this
              build shipped
            </h3>
            <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
              L{conflict.lifecycleDiagram.firstNodeLine}&ndash;L
              {conflict.lifecycleDiagram.lastNodeLine}. Carried in{' '}
              <code>{conflict.lifecycleDiagram.shippedAs}</code>.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">
              The register set — {conflict.stateRegister.countedStates} states
            </h3>
            <ul className="mt-1 flex flex-wrap gap-1">
              {conflict.stateRegister.states.map((s) => (
                <li key={s}>
                  <code className="text-xs text-[var(--color-ink-muted)]">{s}</code>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Why it matters rather than being a naming quibble: the chapter&rsquo;s own acceptance
          criterion at L{conflict.criterionThatFavoursTheRegister} requires that no state outside
          the four registers appears in any code path or user interface string, which read strictly
          excludes the set this build shipped. Both readings are the source&rsquo;s. This screen
          settles neither, renders no occurrence outcome at all, and mints no decision identifier —
          the source raises none, and a build-minted one would be an identifier a client searches
          the source for and does not find.
        </p>
      </section>
    </SchedulerScaffold>
  )
}
