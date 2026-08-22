import type { RoleId } from '@/domain/roles'
import { DecisionDisclosure } from '@/disclosure/DecisionDisclosure'
import { captureStateLine } from '@/frontline/capture'
import { frontlineConnectivityTreatment } from '@/frontline/access'
import { functionalitiesNamingNoPattern } from '@/frontline/fallbacks'
import { frontlineAffordance, type FrontlineAffordance } from '@/frontline/matrix'
import { flDestinationBySlug } from '@/frontline/screens'
import {
  CrossSurfaceAct,
  NamedPlace,
  frontlineCrossSurfaceModel,
} from '@/frontline/cross-surface'
import type { RunPlayerPanel } from '../../../../app/frontline/run-player/RunPlayerRoute'
import {
  A3_CARD,
  A3_IDENTIFIER,
  A3_NAME,
  A3_PLAYER_STATES,
  RUN_COMPLETION_STATES,
  completionScreenLine,
  theStateThisScreenMayName,
} from './charter'
import {
  A3_COLUMNS,
  A3_COLUMN_HEADINGS,
  A3_MATRIX,
  A3_SHAPE,
  a3CellCount,
  a3Row,
  type A3Column,
  type A3MatrixRow,
} from './matrix'
import {
  A3_ACCEPTANCE_CRITERIA,
  A3_FUNCTIONALITIES,
  A3_MODULE_ID,
  A3_SEQUENCE,
  A3_STATE_INVENTORY_KEYED_ON,
  A3_STATE_INVENTORY_READINGS,
  A3_TERMINAL_SAFE_STATE,
  A3_TERMINAL_SAFE_STATE_PATTERN_REF,
  A3_TERMINAL_SAFE_STATE_PATTERN_WORDING,
  A3_TERMINAL_SAFE_STATE_REF,
  a3FallbackReadings,
  a3PatternsAllThreeReadingsAgreeOn,
  a3RenderedViews,
  renderDifficultyLevel,
} from './service'

/**
 * `MOD-FL-A3` — THE RUN PLAYER PANEL. The execution spine of the shared
 * `SCR-FL-03` route: the authored sequence, the screen the worker stands on,
 * and the finish declaration.
 *
 * IT MOUNTS; IT DOES NOT OWN THE ROUTE. `app/frontline/run-player/` is the
 * spine task's file and nothing here edits it. This module exports a
 * `RunPlayerPanel`-shaped value and the controller wires it in — the same
 * discipline `src/surfaces/doh/modules/*` follows against `app/hub/HubShell`,
 * where the type is imported and the route is not touched. Six modules mount
 * into this one route and a module creating the directory is the path
 * collision this build has recorded three times.
 *
 * EVERY CELL IS DRAWN BY `frontlineAffordance` AND NOTHING GOES ROUND IT.
 * There is no branch in this file that reads `cell.outcome` to decide whether
 * a control appears. Two of the ten rows are classified `another-surface` and
 * the fold returns a cross-surface statement for every column of them,
 * including the two `Allowed` cells of row 10 — which is the point, because
 * `EXCL-FL-06` (L39489) makes that act an INVARIANT exclusion and a control
 * would be a broken guarantee rather than a misplaced button.
 *
 * THE TOKEN STILL RENDERS. Wave 0's rule is that the matrix goes on saying
 * what it says: every cell shows its own token and its own words beside the
 * affordance, so a reader sees both `Allowed` and the reason no control
 * follows from it. What is refused is the CONTROL, never the transcription.
 */

const ROLE_FOR_COLUMN: Readonly<Record<A3Column, RoleId>> = {
  worker: 'WORKER',
  supervisor: 'SUPERVISOR',
  qualityManager: 'QUALITY_MANAGER',
  tenantAdmin: 'TENANT_ADMIN',
  readonlyAuditor: 'READONLY_AUDITOR',
}

const CARD = 'rounded-[var(--radius-surface)] border border-[var(--color-border)] p-4'
const MUTED = 'text-sm text-[var(--color-ink-muted)]'
const SUBTLE = 'text-xs text-[var(--color-ink-subtle)]'

function Locator({ children }: { readonly children: string }) {
  return <span className={`whitespace-nowrap ${SUBTLE}`}>[{children}]</span>
}

/**
 * ONE AFFORDANCE. Six members and none of them is `disabled` — a deferred or
 * off-surface capability draws NO CONTROL and a stated line where the control
 * would have sat. `FrontlineAffordance` has no `disabled` member, so this
 * switch could not render one even under pressure.
 */
function Affordance({
  drawn,
  row,
  column,
}: {
  readonly drawn: FrontlineAffordance
  readonly row: A3MatrixRow
  readonly column: A3Column
}) {
  switch (drawn.kind) {
    case 'control':
      return (
        <button
          type="button"
          data-testid="fl-a3-control"
          data-outcome={drawn.outcome}
          className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] px-3 py-1.5 text-sm text-[var(--color-ink)]"
        >
          {row.control}
        </button>
      )
    case 'read-only':
      return (
        <p data-testid="fl-a3-read-only" className={MUTED}>
          {row.control} — visible and unchangeable. {drawn.note}
        </p>
      )
    case 'cross-surface':
      return (
        <CrossSurfaceAct
          model={frontlineCrossSurfaceModel(
            {
              capability: row.control,
              owningSurface: drawn.surface,
              whatHappensThere: drawn.note,
              sourceRef: row.sourceRef,
            },
            ROLE_FOR_COLUMN[column],
          )}
        />
      )
    case 'named-place':
      return (
        <NamedPlace
          capability={row.control}
          destination={drawn.destination}
          note={drawn.note}
          sourceRef={row.sourceRef}
        />
      )
    case 'routed':
      return (
        <p data-testid="fl-a3-routed" className={MUTED}>
          {row.control} — {drawn.note}. The act this row refuses is met by{' '}
          <strong className="font-medium text-[var(--color-ink)]">
            {a3Row(drawn.toRowId as A3MatrixRow['id']).control}
          </strong>
          , the next row of this same matrix. The original record stays and the correction
          is a new entry. <Locator>{a3Row(drawn.toRowId as A3MatrixRow['id']).sourceRef}</Locator>
        </p>
      )
    case 'stated-line':
      return (
        <p data-testid="fl-a3-stated-line" className={MUTED}>
          {drawn.line}
        </p>
      )
    case 'refusal':
      return (
        <p data-testid="fl-a3-refusal" data-outcome={drawn.outcome} className={MUTED}>
          {row.control} — no control is drawn here. {drawn.note}.
          {drawn.openDecision === null ? null : (
            <>
              {' '}
              This cell defers to an open question and this build does not answer it in
              either direction: {drawn.openDecision}.
            </>
          )}
        </p>
      )
  }
}

function MatrixRow({ row, column }: { readonly row: A3MatrixRow; readonly column: A3Column }) {
  return (
    <li data-testid="fl-a3-matrix-row" data-row={row.id} className={`${CARD} space-y-2`}>
      <p className="text-sm font-medium text-[var(--color-ink)]">
        {row.control} <Locator>{row.sourceRef}</Locator>
      </p>
      <Affordance drawn={frontlineAffordance(row, column)} row={row} column={column} />
      <ul className={`flex flex-wrap gap-x-4 gap-y-1 ${SUBTLE}`}>
        {A3_COLUMNS.map((c) => (
          <li key={c} data-testid="fl-a3-cell" data-column={c}>
            <span className="text-[var(--color-ink-muted)]">{A3_COLUMN_HEADINGS[c]}:</span>{' '}
            {row.cells[c].note}
          </li>
        ))}
      </ul>
    </li>
  )
}

export function RunPlayerSpine({ column = 'worker' }: { readonly column?: A3Column }) {
  const destination = flDestinationBySlug('run-player')
  const held = theStateThisScreenMayName()
  const queued = frontlineConnectivityTreatment({ kind: 'write' })
  const substitution = renderDifficultyLevel('expanded', ['standard'])
  const withoutPattern = functionalitiesNamingNoPattern(A3_FUNCTIONALITIES)
  const agreed = a3PatternsAllThreeReadingsAgreeOn()

  return (
    <div className="space-y-6" data-testid="fl-a3-panel" data-column={column}>
      <p className={MUTED}>
        {A3_IDENTIFIER} {A3_NAME} is the host of {destination.name}. {destination.purpose}.{' '}
        Five further modules mount panels into this same route; this one renders the spine
        they interrupt and return to, and none of their material.{' '}
        <Locator>L48531</Locator>
      </p>

      {/* THE IDENTITY CARD. */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-[var(--color-ink)]">The module card</h4>
        <dl className="space-y-3">
          {A3_CARD.map((s) => (
            <div key={s.id} data-testid="fl-a3-card-statement" data-statement={s.id}>
              <dt className="text-sm font-medium text-[var(--color-ink)]">
                {s.heading} <Locator>{s.sourceRef}</Locator>
              </dt>
              <dd className={MUTED}>
                {s.text ?? s.whyNotTranscribed}
                <span className={`ml-2 ${SUBTLE}`}>{s.sourceClass}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* THE PLAYER STATES AND THE TWO INVENTORIES. */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-[var(--color-ink)]">
          The eight player states <Locator>L40545</Locator>
        </h4>
        <ul className={`space-y-1 ${MUTED}`}>
          {A3_PLAYER_STATES.map((s) => (
            <li key={s.id} data-testid="fl-a3-player-state">
              <span className="text-[var(--color-ink)]">{s.id}</span> — {s.gloss}
            </li>
          ))}
        </ul>
        <div className={`${CARD} space-y-2`} data-testid="fl-a3-state-inventories">
          <p className={MUTED}>
            Section 25.5 carries two state inventories for this destination. They count
            fifteen and thirteen, both counts are internally correct, and they inventory
            different things. Neither is corrected into the other. This module keys on{' '}
            <strong className="font-medium text-[var(--color-ink)]">
              {A3_STATE_INVENTORY_KEYED_ON}
            </strong>
            , because it is the inventory of execution and every one of the eight player
            states above maps onto a node of it; the thirteen are keyed on the route, which
            six modules share.
          </p>
          <ul className={`space-y-1 ${MUTED}`}>
            {A3_STATE_INVENTORY_READINGS.map((r) => (
              <li key={r.label} data-testid="fl-a3-state-inventory">
                <span className="text-[var(--color-ink)]">{r.label}</span> — {r.count}{' '}
                {r.inventoryOf}. <Locator>{r.locator}</Locator>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* THE FORWARD DRIVE. */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-[var(--color-ink)]">
          The forward drive <Locator>L40549-L40561</Locator>
        </h4>
        <ol className={`space-y-1 ${MUTED}`}>
          {A3_SEQUENCE.map((s) => (
            <li key={s.n} data-testid="fl-a3-sequence-step" data-actor={s.actor}>
              {s.n}. {s.text}{' '}
              {s.actor === 'device' ? null : (
                <span className="text-[var(--color-ink)]">
                  Not a device event — this one happens{' '}
                  {s.actor === 'server' ? 'on the server' : 'in the Delivery Operations Hub'}.
                </span>
              )}{' '}
              <Locator>{s.sourceRef}</Locator>
            </li>
          ))}
        </ol>
      </div>

      {/* THE MATRIX, THROUGH THE FOLD. */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-[var(--color-ink)]">
          What this screen draws for {A3_COLUMN_HEADINGS[column]}{' '}
          <Locator>{`header L${A3_SHAPE.headerLine} · rows L${A3_SHAPE.firstDataLine}-L${A3_SHAPE.lastDataLine}`}</Locator>
        </h4>
        <p className={MUTED}>
          {A3_SHAPE.rows} rows, {A3_SHAPE.columns} persona columns, {a3CellCount()} cells,
          every one of them filled. Two rows are met on another surface and draw no control
          here whatever their token reads; every cell still shows its own words.
        </p>
        <ul className="space-y-3">
          {A3_MATRIX.map((row) => (
            <MatrixRow key={row.id} row={row} column={column} />
          ))}
        </ul>
      </div>

      {/* THE FINISH DECLARATION. */}
      <div className={`${CARD} space-y-2`}>
        <h4 className="text-sm font-semibold text-[var(--color-ink)]">
          The finish declaration <Locator>SCR-FL-16 L39878</Locator>
        </h4>
        <p className="text-sm text-[var(--color-ink)]" data-testid="fl-a3-completion-line">
          {completionScreenLine()}
        </p>
        <ul className={`space-y-1 ${MUTED}`}>
          {RUN_COMPLETION_STATES.map((s) => (
            <li key={s.name} data-testid="fl-a3-completion-state" data-held-by={s.heldBy}>
              <span className="text-[var(--color-ink)]">{s.name}</span> — {s.what}{' '}
              <Locator>{s.sourceRef}</Locator>
            </li>
          ))}
        </ul>
        <p className={MUTED} data-testid="fl-a3-queued-line">
          {held.name} is a local event and happens with the network gone.{' '}
          {captureStateLine('queued')} {queued.reason} <Locator>{queued.sourceRef}</Locator>
        </p>
      </div>

      {/* THE DIFFICULTY LEVEL AND ITS SUBSTITUTION NOTICE. */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-[var(--color-ink)]">
          The rendered difficulty level <Locator>FUNC-A3-04-1-1 L40622</Locator>
        </h4>
        <p className={MUTED} data-testid="fl-a3-substitution-notice">
          {substitution.substitutionNotice ??
            'The level on this worker’s profile is the level this package carries, so nothing is substituted.'}
        </p>
        <DecisionDisclosure id="DEC-WIDIFF-001" />
        <div className={`${CARD} space-y-1`} data-testid="fl-a3-pkgfield">
          <p className="text-sm font-medium text-[var(--color-ink)]">
            Open decision DEC-PKGFIELD-001 — recorded by the source, and absent from this
            build’s decision canon
          </p>
          <p className={MUTED}>
            Section 6.7.4 states that the authoritative field-by-field assignment of
            package-borne against server-only values lives in Part VII’s package contract,
            and Part VII does not enumerate it. The source names the gap and gives no
            reading on either side. It is disclosed here rather than answered, and it has no
            record in <code>src/disclosure/decisions.ts</code> — a file this module does not
            own and has not edited — so it renders as a stated gap rather than through the
            canon’s renderer. <Locator>L39889 · L39960 · L41162 · L41276</Locator>
          </p>
        </div>
      </div>

      {/* THE CAPTURE-BEARING STEP. */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-[var(--color-ink)]">
          The capture-bearing step <Locator>L40553 · FUNC-A3-01-1-1 L40600</Locator>
        </h4>
        <p className={MUTED}>
          Step five of the sequence is where the worker commits, so a capture-bearing screen
          stands inside this module’s spine. What is captured, and which of the types the
          screen may carry, is <code>MOD-FL-A4</code>’s and is not rendered here — a type the
          contract does not name cannot render, and the contract is settled in{' '}
          <code>src/frontline/capture.ts</code>, not in this file. The set itself is an
          adopted position rather than a source ruling, and it is disclosed as one.
        </p>
        <DecisionDisclosure id="DEC-CAP-001" />
      </div>

      {/* THE FALLBACK OBLIGATION. */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-[var(--color-ink)]">
          Fallback patterns <Locator>AC-FL-011-1 L40151</Locator>
        </h4>
        <p className={MUTED} data-testid="fl-a3-fallback-divergence">
          Three places in the frozen source say which patterns belong to {A3_MODULE_ID}, and
          no two of them agree. All three are carried with their own locators; none is
          corrected into another. {agreed.length} patterns appear in all three:{' '}
          {agreed.join(', ')}.
        </p>
        <ul className={`space-y-1 ${MUTED}`}>
          {a3FallbackReadings().map((r) => (
            <li key={r.label} data-testid="fl-a3-fallback-reading">
              <span className="text-[var(--color-ink)]">{r.label}</span> —{' '}
              {r.patterns.join(', ')}. <Locator>{r.locator}</Locator>
            </li>
          ))}
        </ul>
        <p className={MUTED} data-testid="fl-a3-terminal-safe-state">
          The terminal safe state, which AC-FL-011-2 (L40152) requires every retry path to
          exit into, is {A3_TERMINAL_SAFE_STATE}. <Locator>{A3_TERMINAL_SAFE_STATE_REF}</Locator>{' '}
          The pattern library states the same safe state one connective apart —{' '}
          {A3_TERMINAL_SAFE_STATE_PATTERN_WORDING}.{' '}
          <Locator>{A3_TERMINAL_SAFE_STATE_PATTERN_REF}</Locator>
        </p>
        <p className={MUTED} data-testid="fl-a3-functionalities-without-pattern">
          {withoutPattern.length} of this module’s {A3_FUNCTIONALITIES.length} functionalities
          name no FB-FL pattern at all: {withoutPattern.join(', ')}. Each states a reason
          instead — one because pre-commit editing touches no persisted record, one because a
          prohibition has no failure mode. AC-FL-011-1 asks every functionality to name at
          least one pattern, so this is reported rather than resolved by assigning them one.
        </p>
      </div>

      {/* THE EIGHTEEN FUNCTIONALITIES. */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-[var(--color-ink)]">
          The {A3_FUNCTIONALITIES.length} functionalities <Locator>L40598-L40634</Locator>
        </h4>
        <ul className={`space-y-2 ${MUTED}`}>
          {A3_FUNCTIONALITIES.map((f) => (
            <li key={f.id} data-testid="fl-a3-functionality">
              <span className="text-[var(--color-ink)]">{f.id}</span> —{' '}
              {f.statement ?? f.whyNotTranscribed} Fallback: {f.fallbackClause}{' '}
              <Locator>{f.sourceRef}</Locator>
            </li>
          ))}
        </ul>
      </div>

      {/* THE ACCEPTANCE CRITERIA. */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-[var(--color-ink)]">
          Acceptance criteria <Locator>L40673-L40681</Locator>
        </h4>
        <ul className={`space-y-1 ${MUTED}`}>
          {A3_ACCEPTANCE_CRITERIA.map((ac) => (
            <li key={ac.id} data-testid="fl-a3-acceptance-criterion">
              <span className="text-[var(--color-ink)]">{ac.id}</span> —{' '}
              {ac.criterion ?? ac.whyNotTranscribed} <Locator>{ac.sourceRef}</Locator>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/**
 * The mounting value. `rendersViews` carries NAMES and never route keys —
 * `SCR-FL-*` identifiers name two different screens across the source's two
 * screen registers, so an identifier used as a key would be wrong for one of
 * the two readings, silently. Wave 0's ruling, consumed rather than restated.
 */
export function runPlayerPanelA3(column: A3Column = 'worker'): RunPlayerPanel {
  return {
    module: A3_MODULE_ID,
    heading: `${A3_NAME} — the execution spine`,
    rendersViews: a3RenderedViews().map((v) => v.name),
    body: <RunPlayerSpine column={column} />,
  }
}
