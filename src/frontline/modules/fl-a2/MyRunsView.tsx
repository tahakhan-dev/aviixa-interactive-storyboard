import {
  CrossSurfaceAct,
  NamedPlace,
  frontlineCrossSurfaceModel,
} from '@/frontline/cross-surface'
import { frontlineAffordance, type FrontlineAffordance } from '@/frontline/matrix'
import { flDestinationBySlug } from '@/frontline/screens'
import { routeOpenDecisionFor } from '@/routes/definitions'
import { Button } from '@/ui/primitives'
import {
  A2_CARD,
  A2_IDENTITY_CARD,
  A2_RUN_STATES,
  COMPLETION_CLAIM_NEVER_MADE,
  NO_PACE_NO_TIMER_NO_RANKING,
  RUN_COMPLETION_WORDS,
  SB_FL_011,
  a2RunState,
  type A2RunState,
} from './charter'
import {
  A2_COLUMNS,
  A2_COLUMN_HEADINGS,
  A2_MATRIX,
  A2_SHAPE,
  a2RowById,
  type A2Column,
  type A2RowId,
} from './matrix'
import {
  A2_ACCEPTANCE_CRITERIA,
  A2_DISCLOSURES,
  A2_FUNCTIONALITIES,
  A2_FUNCTIONALITIES_NAMING_NO_PATTERN,
  A2_MOMENTS,
  A2_PATTERNS_FROM_MAP,
  A2_PATTERN_DIVERGENCE,
  A2_PENDING_FIXTURE,
  A2_SOURCE_FINDINGS,
  ARRIVING_COMMAND_BANNER,
  PACKAGE_READINESS_DETAIL,
  PARKED_RUN_REASON,
  manualSyncOutcome,
  pendingTotal,
  runIsEnterable,
  syncSheetRows,
  type A2Job,
  type A2Moment,
  type A2Run,
} from './service'

/**
 * `SCR-FL-02` — My Runs. A PLAIN VIEW COMPONENT, NOT A `RunPlayerPanel`.
 * This module's destination is My Runs and it is not the Run Player, so it
 * exports no panel. Nothing in this module reads or writes anything under
 * `app/`.
 *
 * EVERY CELL GOES THROUGH `frontlineAffordance` AND NOTHING GOES AROUND IT,
 * INCLUDING THE ONE CONTROL THE WORK LIST ITSELF DRAWS. The "Enter this
 * Run" button on a ready Run is row 4 of the matrix asked for the Worker
 * column; the sentence on a not-yet-ready Run is row 5 asked the same way.
 * There is no branch below that reads `cell.outcome` to decide what to
 * draw, and no `disabledReason` is passed anywhere:
 * `FrontlineAffordance` has no `disabled` member, and a disabled control on
 * this axis implies a condition that could become true.
 *
 * WHAT THIS SCREEN NEVER GROWS, AND IT IS THE ONE MOST LIKELY TO. No sort
 * control, no dismiss affordance, no search field, no "available work" tab,
 * no pace figure, no elapsed time, no countdown, no "runs completed today",
 * no ranking. Row 8 (L40368) and `EXCL-FL-08` (L39491) are why, and both
 * are stated on the screen rather than left to be noticed.
 */

const CARD = 'rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-4'
const DASHED =
  'rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4'
const H2 = 'text-base font-semibold text-[var(--color-ink)]'
const MUTED = 'text-sm text-[var(--color-ink-muted)]'
const REF = 'text-xs text-[var(--color-ink-subtle)]'

/* ==================================================================== *
 * THE MATRIX CELL RENDERER, SHARED BY THE WORK LIST AND THE MATRIX
 * SECTION. One renderer, so a control drawn in the list and a control drawn
 * in the table cannot disagree about what the same row permits.
 * ==================================================================== */

function ControlOrLine({
  affordance,
  column,
  control,
  sourceRef,
  testid,
}: {
  readonly affordance: FrontlineAffordance
  readonly column: A2Column
  readonly control: string
  readonly sourceRef: string
  readonly testid: string
}) {
  switch (affordance.kind) {
    case 'control':
      return (
        <div data-testid={`${testid}-control`}>
          <Button variant="secondary">{control}</Button>
          <p className={`mt-1 ${REF}`}>{affordance.note}</p>
        </div>
      )

    case 'read-only':
      return (
        <p data-testid={`${testid}-read-only`} className={MUTED}>
          Visible and unchangeable. {affordance.note}
        </p>
      )

    case 'cross-surface':
      return (
        <CrossSurfaceAct
          model={frontlineCrossSurfaceModel(
            {
              capability: control,
              owningSurface: affordance.surface,
              whatHappensThere: affordance.note,
              sourceRef,
            },
            column,
          )}
        />
      )

    case 'named-place':
      return (
        <NamedPlace
          capability={control}
          destination={affordance.destination}
          note={affordance.note}
          sourceRef={sourceRef}
        />
      )

    case 'routed':
      return (
        <p data-testid={`${testid}-routed`} data-to-row={affordance.toRowId} className={`${DASHED} text-sm`}>
          {affordance.note} No control is drawn here. The act this cell points at is “
          {a2RowById(affordance.toRowId as A2RowId).control}”, on this same screen.
        </p>
      )

    case 'stated-line':
      return (
        <p
          data-testid={`${testid}-stated-line`}
          data-existence={affordance.existence}
          className={`${DASHED} ${MUTED}`}
        >
          {affordance.line}
        </p>
      )

    case 'refusal':
      return (
        <div data-testid={`${testid}-refusal`} data-outcome={affordance.outcome} className={`${DASHED} text-sm`}>
          <p className="text-[var(--color-ink)]">
            {control} — no control is drawn here. {affordance.note}
          </p>
          {affordance.outcome === 'notApplicable' ? (
            <p className={`mt-1 ${REF}`}>
              This is not a refusal. The act does not arise for this role on this surface, and the
              cell states why.
            </p>
          ) : null}
          {affordance.openDecision === null ? null : (
            <OpenDeviceSessionQuestion decision={affordance.openDecision} />
          )}
        </div>
      )
  }
}

/**
 * Row 1's Tenant Admin cell defers to one unanswered question, recorded ONCE
 * as a `RouteOpenDecision` on `SURF-FL` in `src/routes/definitions.ts`. This
 * READS that record; it does not restate it, and there is no branch here
 * that could answer it in either direction — `AC-FL-009-5` (L39948) forbids
 * both, and an absence from `allowedRoles` reads as one of them.
 */
function OpenDeviceSessionQuestion({ decision }: { readonly decision: string }) {
  const open = routeOpenDecisionFor('SURF-FL', 'TENANT_ADMIN')
  return (
    <div
      data-testid="fl-a2-open-decision"
      data-decision={decision}
      className="mt-2 border-t border-dashed border-[var(--color-border-strong)] pt-2"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
        An open question, disclosed and not answered
      </p>
      <p className="mt-1 text-sm text-[var(--color-ink)]">
        {open === null
          ? `No open-decision record is registered for the Tenant Admin on this surface, and this cell defers to ${decision}. That is a defect in this build’s route registry, stated here rather than hidden.`
          : open.why}
      </p>
      <p className={`mt-1 ${REF}`}>
        {decision} · recorded once, for this cell and for every other cell on this surface that
        defers to it.
      </p>
    </div>
  )
}

/* ==================================================================== *
 * THE WORK LIST.
 * ==================================================================== */

/**
 * WHICH MATRIX ROW GOVERNS A RUN ROW. Two of the six states have a row of
 * this matrix and four do not, and that asymmetry is the source's: row 4
 * (L40364) allows entering a ready Run, row 5 (L40365) prohibits entering a
 * not-yet-ready one, and no row addresses a Run that is under way, parked,
 * worker-finished or complete-and-synced. `null` means "no row of this
 * matrix speaks to this state", which the row renders as such rather than
 * borrowing the nearest one.
 */
function governingRow(state: A2RunState): A2RowId | null {
  if (state === 'STATE-A2-READY') return 'enter-a-ready-run'
  if (state === 'STATE-A2-NOTREADY') return 'enter-a-not-yet-ready-run'
  return null
}

function RunRow({ run, column }: { readonly run: A2Run; readonly column: A2Column }) {
  const state = a2RunState(run.state)
  const rowId = governingRow(run.state)
  const row = rowId === null ? null : a2RowById(rowId)

  return (
    <li
      data-testid="fl-a2-run"
      data-run={run.id}
      data-state={run.state}
      data-enterable={String(runIsEnterable(run.state))}
      className={`${CARD} space-y-2`}
    >
      <p className="text-sm font-medium text-[var(--color-ink)]">
        {run.id} — <span data-testid="fl-a2-run-line">{run.line}</span>
      </p>
      <p className={REF}>
        {state.id} — {state.gloss}. [{state.sourceRef}] · [{run.sourceRef}]
      </p>
      {run.state === 'STATE-A2-PARKED' ? (
        <p data-testid="fl-a2-parked-reason" className={MUTED}>
          {PARKED_RUN_REASON.why}{' '}
          <span className={REF}>[{PARKED_RUN_REASON.sourceRef}]</span>
        </p>
      ) : null}
      {row === null ? (
        <p data-testid="fl-a2-no-governing-row" className={`${DASHED} ${MUTED}`}>
          No row of this module’s permission matrix speaks to entering a Run in this state. Rows 4
          and 5 (L40364, L40365) cover a ready Run and a not-yet-ready one and nothing else, so no
          control is drawn and none is refused: what happens here is unrecorded in the frozen source
          rather than decided by this build.
        </p>
      ) : (
        <ControlOrLine
          affordance={frontlineAffordance(row, column)}
          column={column}
          control={run.state === 'STATE-A2-READY' ? `Enter ${run.id}` : row.control}
          sourceRef={row.sourceRef}
          testid="fl-a2-run"
        />
      )}
    </li>
  )
}

function JobCard({ job, column }: { readonly job: A2Job; readonly column: A2Column }) {
  return (
    <section
      data-testid="fl-a2-job"
      data-job={job.id}
      data-shape={job.shape}
      aria-label={job.name}
      className="space-y-3"
    >
      <h3 className="text-sm font-semibold text-[var(--color-ink)]">{job.name}</h3>
      <ul className="space-y-3">
        {job.runs.map((run) => (
          <RunRow key={run.id} run={run} column={column} />
        ))}
      </ul>
    </section>
  )
}

/* ==================================================================== *
 * THE VIEW.
 * ==================================================================== */

export interface MyRunsViewProps {
  /** The persona column the reader is standing in. */
  readonly column?: A2Column
  /**
   * Whether the device has a connection. The list renders fully either way
   * (L40394); what changes is what the manual sync control reports.
   */
  readonly online?: boolean
  /**
   * Which of the two moments the source describes this list is at. Both are
   * the source's own — the illustrative example's 06:05 (L40473) and the
   * storyboard's later state (L40471) — and neither is a state this build
   * invented to have something to show.
   */
  readonly moment?: A2Moment
}

export function MyRunsView({
  column = 'WORKER',
  online = false,
  moment = 'mid-shift',
}: MyRunsViewProps) {
  const at = A2_MOMENTS[moment]
  const destination = flDestinationBySlug('my-runs')
  const contested = destination.contested
  const sheet = syncSheetRows(A2_PENDING_FIXTURE)
  const sync = manualSyncOutcome(online)
  const syncRow = a2RowById('trigger-a-manual-sync')
  const sheetRow = a2RowById('view-the-sync-detail-sheet')

  return (
    <div
      data-testid="fl-a2-my-runs"
      data-column={column}
      data-online={String(online)}
      data-moment={moment}
      className="space-y-8"
    >
      <header className="space-y-1">
        <h2 className={H2}>My Runs — MOD-FL-A2</h2>
        <p className={MUTED}>
          The work somebody has given this identity today, and nothing else. There is no search
          field, no “available work” tab, and no other worker’s name anywhere on this screen.{' '}
          <span className={REF}>[L40345, L40471]</span>
        </p>
      </header>

      {/* ── The destination, and both readings of its identifier ── */}
      <section
        data-testid="fl-a2-destination"
        aria-label="My Runs — destination and screen identifier"
        className={`${CARD} space-y-2`}
      >
        <h3 className={H2}>{destination.name}</h3>
        <p className={MUTED}>{destination.purpose}.</p>
        <p className={MUTED}>
          Roles that can open it: {destination.rolesThatCanOpen}. Modules and features shown:{' '}
          {destination.modulesShown}. Navigation entry point: {destination.navigationEntryPoint}.
        </p>
        <div data-testid="fl-a2-contested-token" data-token={contested.token} className="pt-2 text-sm">
          <p className="font-medium text-[var(--color-ink)]">
            The identifier {contested.token}, in both registers
          </p>
          <p className={MUTED}>
            The six-destination register calls it “{contested.registerA}” [{contested.registerARef}].
            The twenty-three-row register calls it “{contested.registerB}” [{contested.registerBRef}
            ].
          </p>
          <p className={MUTED}>
            {contested.agreement.agree
              ? contested.agreement.why
              : contested.agreement.whatEachNames}
          </p>
          <p className={REF}>
            No screen identifier is used as a route key on this surface; this destination is keyed on
            the plain name “{destination.slug}”. A client-delegated choice.
          </p>
        </div>
      </section>

      {/* ── The module card ── */}
      <section data-testid="fl-a2-card" aria-label="The module card" className={`${CARD} space-y-3`}>
        <h3 className={H2}>The module card</h3>
        <p className={REF}>
          The five statements of the identity card are L40347 to L40355; the rest of the card carries
          its own lines.
        </p>
        <dl className="space-y-3">
          {A2_CARD.map((s) => (
            <div key={s.field} data-testid="fl-a2-card-statement" data-field={s.field} data-on-the-card={String(s.onTheCard)}>
              <dt className="text-sm font-medium text-[var(--color-ink)]">{s.field}</dt>
              <dd data-testid="fl-a2-card-text" className={MUTED}>
                {s.text}
              </dd>
              <dd className={REF}>
                {s.sourceRef}
                {s.sourceClass === null
                  ? ' · the source gives this field no classification marker of its own'
                  : ` · ${s.sourceClass}`}
              </dd>
            </div>
          ))}
        </dl>
        <p className={REF}>
          {A2_IDENTITY_CARD.length} of these {A2_CARD.length} statements are the identity card
          itself.
        </p>
      </section>

      {/* ── The arriving-command banner ── */}
      <section
        role="note"
        data-testid="fl-a2-command-banner"
        aria-label="A command has arrived"
        className={`${CARD} space-y-2`}
      >
        <h3 className={H2}>{ARRIVING_COMMAND_BANNER.example}</h3>
        <ul className="space-y-1">
          {ARRIVING_COMMAND_BANNER.constraints.map((c) => (
            <li key={c.sourceRef + c.text.slice(0, 16)} className={MUTED}>
              {c.text} <span className={REF}>[{c.sourceRef}]</span>
            </li>
          ))}
        </ul>
        <p className={REF}>
          A lot is released on this tablet when this tablet has applied the release command, not
          because someone created one. [L39670]
        </p>
      </section>

      {/* ── The list ── */}
      <section data-testid="fl-a2-list" aria-label="Your assigned work" className="space-y-4">
        <h3 className={H2}>Your assigned work</h3>
        <p className={MUTED}>
          Jobs with their Runs beneath them where runs exist, and the job alone where the job is one
          continuous operation. The list orders and presents what the Delivery Operations Hub
          assigned; there is no sort control and no way to hide or dismiss a Run.{' '}
          <span className={REF}>[L40427, L40368]</span>
        </p>
        <p data-testid="fl-a2-moment" className={REF}>
          {at.label} — [{at.sourceRef}]
        </p>
        {at.list.map((job) => (
          <JobCard key={job.id} job={job} column={column} />
        ))}
        <p data-testid="fl-a2-storyboard" className={REF}>
          {SB_FL_011.id} — {SB_FL_011.title}. {SB_FL_011.text} [{SB_FL_011.sourceRef}]
        </p>
      </section>

      {/* ── The sync detail sheet ── */}
      <section
        data-testid="fl-a2-sync-sheet"
        aria-label="The sync detail sheet"
        className={`${CARD} space-y-3`}
      >
        <h3 className={H2}>What is still waiting to be sent</h3>
        <p className={MUTED}>
          {pendingTotal(sheet)} items are held on this tablet, listed by the state each one is
          actually in. There is no single state called “synced”, so there is no single figure here
          either. <span className={REF}>[L40446, L39622]</span>
        </p>
        <ul className="space-y-1">
          {sheet.map((r) => (
            <li key={r.state} data-testid="fl-a2-sheet-row" data-capture-state={r.state} className={MUTED}>
              {r.count} — {r.line}
            </li>
          ))}
        </ul>
        <p className={REF}>
          Nothing on this sheet is yours to resolve; it is informational. [L40446, L40485]
        </p>

        <div className="border-t border-dashed border-[var(--color-border-strong)] pt-3">
          <ControlOrLine
            affordance={frontlineAffordance(syncRow, column)}
            column={column}
            control="Sync now"
            sourceRef={syncRow.sourceRef}
            testid="fl-a2-manual-sync"
          />
          <p data-testid="fl-a2-manual-sync-result" className={`mt-2 ${MUTED}`}>
            {sync.line} <span className={REF}>[{sync.sourceRef}]</span>
          </p>
        </div>

        <p className={REF}>
          The sheet itself: {frontlineAffordance(sheetRow, column).kind === 'control' ? 'open' : 'not drawn'} for the{' '}
          {A2_COLUMN_HEADINGS[column]} column. [{sheetRow.sourceRef}]
        </p>
      </section>

      {/* ── Two words for the end of a Run, and four in the source ── */}
      <section
        data-testid="fl-a2-completion"
        aria-label="Worker-finished and complete-and-synced"
        className={`${CARD} space-y-3`}
      >
        <h3 className={H2}>What the end of a Run is called, and by whom</h3>
        <ul className="space-y-2">
          {RUN_COMPLETION_WORDS.map((w) => (
            <li key={w.word} data-testid="fl-a2-completion-word" data-word={w.word} data-renders={String(w.rendersOnMyRuns)} className="text-sm">
              <span className="font-medium text-[var(--color-ink)]">{w.word}</span>{' '}
              <span className={MUTED}>— {w.meaning}</span>{' '}
              <span className={REF}>[{w.sourceRef}]</span>
            </li>
          ))}
        </ul>
        <p data-testid="fl-a2-completion-claim" className={MUTED}>
          This screen never claims: {COMPLETION_CLAIM_NEVER_MADE.claim} Instead:{' '}
          {COMPLETION_CLAIM_NEVER_MADE.instead}{' '}
          <span className={REF}>[{COMPLETION_CLAIM_NEVER_MADE.sourceRef}]</span>
        </p>
        <ul className="space-y-1">
          {A2_RUN_STATES.map((s) => (
            <li key={s.id} data-testid="fl-a2-run-state" data-state={s.id} className={REF}>
              {s.id} — {s.gloss}. Diagram: “{s.diagramNode}”. [{s.sourceRef}]
            </li>
          ))}
        </ul>
      </section>

      {/* ── The categorical absence ── */}
      <section
        data-testid="fl-a2-no-pace"
        aria-label="What this screen never displays"
        className={`${DASHED} space-y-2`}
      >
        <h3 className={H2}>What this screen never displays</h3>
        <ul className="space-y-2">
          {NO_PACE_NO_TIMER_NO_RANKING.map((a) => (
            <li key={a.sourceRef} data-testid="fl-a2-absence" className={MUTED}>
              <span data-testid="fl-a2-absence-quote">{a.text}</span>{' '}
              <span className={REF}>[{a.sourceRef}]</span>
              <br />
              {a.gloss}
            </li>
          ))}
        </ul>
      </section>

      {/* ── The package readiness detail ── */}
      <section
        data-testid="fl-a2-package-readiness"
        aria-label="Package readiness detail"
        className={`${CARD} space-y-2`}
      >
        <h3 className={H2}>{PACKAGE_READINESS_DETAIL.name}</h3>
        <p className={MUTED}>{PACKAGE_READINESS_DETAIL.note}</p>
        <p className={REF}>{PACKAGE_READINESS_DETAIL.sourceRef}</p>
      </section>

      {/* ── The matrix ── */}
      <section
        data-testid="fl-a2-matrix"
        data-column={column}
        aria-label={`What My Runs draws for the ${A2_COLUMN_HEADINGS[column]} column`}
        className="space-y-4"
      >
        <h3 className={H2}>
          What My Runs draws for the {A2_COLUMN_HEADINGS[column]} column
        </h3>
        <p className={MUTED}>
          {A2_SHAPE.rows} rows and {A2_SHAPE.columns} persona columns — {A2_SHAPE.cells} cells —
          transcribed from the frozen source at L{A2_SHAPE.firstDataLine} to L
          {A2_SHAPE.lastDataLine}. Every cell below shows the source’s own token and words, and what
          this screen draws beside it.
        </p>
        <ul className="space-y-4">
          {A2_MATRIX.map((row) => {
            const affordance = frontlineAffordance(row, column)
            const cell = row.cells[column]
            return (
              <li
                key={row.id}
                data-testid="fl-a2-matrix-row"
                data-row={row.id}
                data-affordance={affordance.kind}
                data-row-surface={row.surface}
                className={CARD}
              >
                <h4 className="text-sm font-medium text-[var(--color-ink)]">{row.control}</h4>
                <p data-testid="fl-a2-cell-note" className={`mt-1 ${MUTED}`}>
                  {A2_COLUMN_HEADINGS[column]}: {cell.note}
                </p>
                <p data-testid="fl-a2-row-why" className={`mt-1 ${REF}`}>
                  {row.why} [{row.whyRef}] · row at {row.sourceRef}
                </p>
                <div className="mt-3">
                  <ControlOrLine
                    affordance={affordance}
                    column={column}
                    control={row.control}
                    sourceRef={row.sourceRef}
                    testid="fl-a2-matrix"
                  />
                </div>
              </li>
            )
          })}
        </ul>
        <p className={REF}>
          The other four columns are {A2_COLUMNS.filter((c) => c !== column).map((c) => A2_COLUMN_HEADINGS[c]).join(', ')}.
        </p>
      </section>

      {/* ── Fallbacks and AC-FL-011-1 ── */}
      <section
        data-testid="fl-a2-fallbacks"
        aria-label="Fallback patterns and AC-FL-011-1"
        className={`${CARD} space-y-3`}
      >
        <h3 className={H2}>Fallback patterns, and the criterion that every functionality names one</h3>
        <ul className="space-y-2">
          {A2_PATTERNS_FROM_MAP.map((p) => (
            <li key={p.id} data-testid="fl-a2-pattern" data-pattern={p.id} className="text-sm">
              <span className="font-medium text-[var(--color-ink)]">
                {p.id} — {p.title}
              </span>
              <br />
              <span className={MUTED}>
                Criticality: {p.criticality}. Terminal safe state: {p.terminalSafeState}.
              </span>{' '}
              <span className={REF}>[{p.sourceRef}]</span>
            </li>
          ))}
        </ul>
        <p data-testid="fl-a2-pattern-divergence" className={MUTED}>
          {A2_PATTERN_DIVERGENCE.note} <span className={REF}>[{A2_PATTERN_DIVERGENCE.sourceRef}]</span>
        </p>
        <p data-testid="fl-a2-ac-fl-011-1" className="text-sm text-[var(--color-ink)]">
          {A2_FUNCTIONALITIES_NAMING_NO_PATTERN.length === 0
            ? `All ${A2_FUNCTIONALITIES.length} functionalities of this module name at least one FB-FL-* pattern, which is what AC-FL-011-1 (L40151) requires.`
            : `AC-FL-011-1 (L40151) requires every functionality to name at least one FB-FL-* pattern. ${A2_FUNCTIONALITIES_NAMING_NO_PATTERN.length} of this module’s ${A2_FUNCTIONALITIES.length} name none: ${A2_FUNCTIONALITIES_NAMING_NO_PATTERN.join(', ')}. Each states its own ground — an absent capability has no failure mode, and the indicator is the honest rendering of failure so it has no fallback of its own. Nothing is assigned here to close the gap, because an assigned pattern is indistinguishable from a real one forever afterwards and the criterion would then read clean because nobody looked.`}
        </p>
        <ul className="space-y-1">
          {A2_FUNCTIONALITIES.map((f) => (
            <li key={f.id} data-testid="fl-a2-functionality" data-func={f.id} data-patterns={f.patterns.length} className={REF}>
              {f.id} — {f.statement} {f.fallbackClause} [{f.sourceRef}] · {f.feature}
            </li>
          ))}
        </ul>
      </section>

      {/* ── Acceptance criteria ── */}
      <section
        data-testid="fl-a2-acceptance"
        aria-label="Acceptance criteria"
        className={`${CARD} space-y-2`}
      >
        <h3 className={H2}>What this module is held to</h3>
        <ul className="space-y-1">
          {A2_ACCEPTANCE_CRITERIA.map((ac) => (
            <li key={ac.id} data-testid="fl-a2-ac" data-ac={ac.id} className={MUTED}>
              {ac.id} — {ac.text} <span className={REF}>[{ac.sourceRef}]</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Open decisions ── */}
      <section
        data-testid="fl-a2-decisions"
        aria-label="Open decisions this screen discloses"
        className="space-y-4"
      >
        <h3 className={H2}>Open decisions this screen discloses and does not settle</h3>
        {A2_DISCLOSURES.map((d) => (
          <div key={d.decisionRef} role="note" data-testid="fl-a2-decision" data-decision={d.decisionRef} className={DASHED}>
            <p className="font-medium text-[var(--color-ink)]">Open decision {d.decisionRef}</p>
            <p className={`mt-1 ${MUTED}`}>{d.question}</p>

            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
              All readings stand. None is this build’s to settle.
            </p>
            <ul className="mt-1 space-y-2">
              {d.readings.map((r) => (
                <li key={r.locator + r.text.slice(0, 24)} data-testid="fl-a2-decision-reading" className="text-sm">
                  <span data-testid="fl-a2-reading-text" className="text-[var(--color-ink)]">
                    {r.text}
                  </span>{' '}
                  <span className={`whitespace-nowrap ${REF}`}>[{r.locator}]</span>
                </li>
              ))}
            </ul>

            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
              This build’s working position
            </p>
            <p className="mt-1 text-sm text-[var(--color-ink)]">{d.adopted}</p>
            <p className={`mt-1 ${REF}`}>
              A client-delegated choice under APP-012, not a position the source settled.
            </p>

            <p className={`mt-2 ${MUTED}`}>Why it bears on this screen: {d.whyHere}</p>
            <p className={`mt-1 ${REF}`}>{d.canonNote}</p>
          </div>
        ))}
      </section>

      {/* ── Findings ── */}
      <section
        data-testid="fl-a2-findings"
        aria-label="What this module found and did not close"
        className={`${DASHED} space-y-3`}
      >
        <h3 className={H2}>What this module found and did not close</h3>
        {A2_SOURCE_FINDINGS.map((f) => (
          <div key={f.what.slice(0, 32)} data-testid="fl-a2-finding" className="text-sm">
            <p className="text-[var(--color-ink)]">{f.what}</p>
            <p className={MUTED}>{f.evidence}</p>
            <p className={MUTED}>{f.notClosedBecause}</p>
            <p className={REF}>[{f.sourceRef}]</p>
          </div>
        ))}
      </section>
    </div>
  )
}
