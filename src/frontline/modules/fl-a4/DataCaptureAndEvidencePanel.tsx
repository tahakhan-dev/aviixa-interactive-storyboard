import { roleById } from '@/domain/roles'
import { DecisionDisclosure } from '@/disclosure/DecisionDisclosure'
import { frontlineConnectivityTreatment } from '@/frontline/access'
import {
  CrossSurfaceAct,
  NamedPlace,
  frontlineCrossSurfaceModel,
} from '@/frontline/cross-surface'
import type { FrontlineAffordance } from '@/frontline/matrix'
import { Button } from '@/ui/primitives'
import type { RunPlayerPanel } from '../../../../app/frontline/run-player/RunPlayerRoute'
import { FLA4_CHARTER_STATEMENTS } from './charter'
import {
  FLA4_COLUMNS,
  FLA4_MATRIX,
  fla4Affordance,
  type Fla4Column,
  type Fla4Row,
} from './matrix'
import {
  FLA4_CAPTURE_TYPE_RENDERING,
  FLA4_DECISIONS_NOT_IN_THE_SHARED_CANON,
  FLA4_DECISION_IN_THE_SHARED_CANON,
  FLA4_FUNCTIONALITIES,
  FLA4_FUNCTIONALITIES_NAMING_NO_PATTERN,
  FLA4_PATTERNS,
  FLA4_RENDERED_CAPTURE_TYPES,
  FLA4_STORYBOARD_STATES,
  FLA4_UNRENDERED_TYPE_NAMES,
  FLA4_WORKED_CAPTURE,
  FLA4_WORKED_CAPTURE_WITHOUT_PROVENANCE,
  fla4CaptureLine,
  fla4ProvenanceLine,
} from './service'

/**
 * `MOD-FL-A4` — Data Capture and Evidence, as a state of the Run Player.
 *
 * §22.7's Module column names this module on exactly ONE of its twenty-three
 * rows: `SCR-FL-07` (L39869), "Run Player step screen, all authored element
 * types", shared with `MOD-FL-A3`. `rendersViews` below is that row's name,
 * read off the source's own column rather than chosen — this panel does not
 * claim `SCR-FL-08` or `SCR-FL-10`, which L39870 and L39872 give to
 * `MOD-FL-A3` alone even though scan-to-identify and the correction sheet are
 * acts of this module.
 *
 * IT MOUNTS, IT DOES NOT ROUTE. The panel is a value handed to
 * `RunPlayerRoute`; nothing under `app/` is created or edited by this module,
 * and the controller wires the export in.
 *
 * EVERY CELL IS DRAWN BY `fla4Affordance`, WHICH IS `frontlineAffordance`.
 * There is no branch in this file that reads a status token. The one thing
 * this file decides is which of the six affordance members gets which
 * primitive, and `control` is the only member that draws one.
 *
 * THE OFFLINE ACCOUNT IS STATED EVEN THOUGH SLICE 7 DOES NOT SIMULATE IT.
 * L40757 in the module's own words: "Nothing about capture depends on
 * connectivity." A panel rendering only the connected path implies the
 * capture layer needs a network, which is the claim chapter 22 exists to
 * deny, so the offline treatment is read from
 * `frontlineConnectivityTreatment` and printed.
 */

const HEADING = 'Data capture and evidence'

/** The §22.7 row this panel is the state of. A name, never a route key. */
const RENDERS_VIEWS = ['Run Player step screen, all authored element types'] as const

function Locator({ children }: { readonly children: string }) {
  return (
    <span className="whitespace-nowrap text-xs text-[var(--color-ink-subtle)]"> [{children}]</span>
  )
}

/**
 * ONE CELL, DRAWN. Six affordance members, six renderings, and only the first
 * draws a control. There is no `disabled` member to reach for and no empty
 * region: every other member prints a line where the control would have sat.
 */
function Affordance({
  drawn,
  row,
  column,
}: {
  readonly drawn: FrontlineAffordance
  readonly row: Fla4Row
  readonly column: Fla4Column
}) {
  switch (drawn.kind) {
    case 'control':
      return (
        <div data-testid="fla4-control">
          <Button variant="primary">{row.control}</Button>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{drawn.note}</p>
        </div>
      )
    case 'read-only':
      return (
        <p data-testid="fla4-read-only" role="note" className="text-sm text-[var(--color-ink-muted)]">
          {row.control} — visible and unchangeable here. {drawn.note}
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
            column,
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
        <p data-testid="fla4-routed" className="text-sm text-[var(--color-ink-muted)]">
          {row.control} — met by another row of this matrix, {drawn.toRowId}. {drawn.note}
        </p>
      )
    case 'stated-line':
      return (
        <p data-testid="fla4-stated-line" className="text-sm text-[var(--color-ink-muted)]">
          {drawn.line}
        </p>
      )
    case 'refusal':
      return (
        <div data-testid="fla4-refusal">
          <p className="text-sm text-[var(--color-ink-muted)]">
            {row.control} — no control is drawn here. {drawn.note}
          </p>
          {drawn.openDecision === null ? null : (
            <p
              data-testid="fla4-open-decision-marker"
              className="mt-1 text-xs text-[var(--color-ink-subtle)]"
            >
              This cell defers to an unresolved question, carried as {drawn.openDecision}. It is
              disclosed below and is not answered here.
            </p>
          )}
        </div>
      )
  }
}

export interface DataCaptureAndEvidencePanelProps {
  /**
   * Whose column of the matrix is drawn. Required in spirit and defaulted to
   * the Worker because §25.5 gives this destination to "Worker; Supervisor
   * within a step-up" and the Worker is the only identity that captures.
   */
  readonly persona?: Fla4Column
  /** Whether the device has a connection. The offline account is stated either way. */
  readonly online?: boolean
}

export function DataCaptureAndEvidencePanel({
  persona = 'WORKER',
  online = true,
}: DataCaptureAndEvidencePanelProps) {
  const personaName = roleById(persona).name
  const write = frontlineConnectivityTreatment({ kind: 'write' })
  const safety = frontlineConnectivityTreatment({ kind: 'safety-layer' })
  const unresolved = fla4ProvenanceLine(FLA4_WORKED_CAPTURE_WITHOUT_PROVENANCE)

  return (
    <div className="space-y-8">
      <section aria-label="What this module is">
        <dl className="space-y-3">
          {FLA4_CHARTER_STATEMENTS.map((s) => (
            <div key={s.id} data-testid="fla4-charter-statement">
              <dt className="text-sm font-medium text-[var(--color-ink)]">{s.heading}</dt>
              <dd className="text-sm text-[var(--color-ink-muted)]">
                {s.text}
                <Locator>{`${s.sourceRef} · ${s.sourceClass}`}</Locator>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-label="The capture types this player renders">
        <h4 className="text-sm font-semibold text-[var(--color-ink)]">
          The capture types this player renders
        </h4>
        <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
          {FLA4_RENDERED_CAPTURE_TYPES.map((type) => (
            <li key={type} data-testid="fla4-capture-type">
              <span className="text-[var(--color-ink)]">{type}</span> — {' '}
              {FLA4_CAPTURE_TYPE_RENDERING[type].purpose}
              <Locator>{FLA4_CAPTURE_TYPE_RENDERING[type].sourceRef}</Locator>
            </li>
          ))}
        </ul>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          A type the contract does not name cannot render, so the two names the platform canon
          uses that this contract does not are shown as what they render as, never as members:{' '}
          {FLA4_UNRENDERED_TYPE_NAMES.map((t) => `${t.name} renders as ${t.rendersAs} (${t.why})`).join(
            '; ',
          )}
          .
        </p>
        <div className="mt-3">
          <DecisionDisclosure id={FLA4_DECISION_IN_THE_SHARED_CANON} />
        </div>
      </section>

      <section aria-label="One capture, end to end">
        <h4 className="text-sm font-semibold text-[var(--color-ink)]">One capture, end to end</h4>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          This record includes: {FLA4_WORKED_CAPTURE.workerIdentity},{' '}
          {FLA4_WORKED_CAPTURE.deviceIdentity},{' '}
          {FLA4_WORKED_CAPTURE.namedLocation.resolved
            ? `${FLA4_WORKED_CAPTURE.namedLocation.site} / ${FLA4_WORKED_CAPTURE.namedLocation.area} / ${FLA4_WORKED_CAPTURE.namedLocation.cell}`
            : FLA4_WORKED_CAPTURE.namedLocation.note}
          , {FLA4_WORKED_CAPTURE.deviceTime}. The named place is a name, never a coordinate, and it
          never blocks a capture.
          <Locator>SB-FL-013 L40855</Locator>
        </p>
        <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
          {FLA4_STORYBOARD_STATES.map((state) => (
            <li key={state} data-testid="fla4-capture-state">
              {fla4CaptureLine(state)}
            </li>
          ))}
        </ul>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {write.reason}
          <Locator>{write.sourceRef}</Locator>
        </p>
        {unresolved === null ? null : (
          <p
            data-testid="fla4-unresolved-provenance"
            className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]"
          >
            {unresolved}
          </p>
        )}
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {online ? 'The device has a connection now, and it changes none of the above. ' : ''}
          {safety.reason}
          <Locator>{safety.sourceRef}</Locator>
        </p>
      </section>

      <section aria-label={`What this screen draws for the ${personaName}`}>
        <h4 className="text-sm font-semibold text-[var(--color-ink)]">
          What this screen draws for the {personaName}
        </h4>
        <ul className="mt-2 space-y-3">
          {FLA4_MATRIX.map((row) => (
            <li key={row.id} data-testid={`fla4-matrix-row-${row.id}`} data-row-id={row.id}>
              <Affordance drawn={fla4Affordance(row, persona)} row={row} column={persona} />
              <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
                {row.control} · {row.cells[persona].note}
                <Locator>{row.sourceRef}</Locator>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Fallback patterns">
        <h4 className="text-sm font-semibold text-[var(--color-ink)]">
          What happens when this fails
        </h4>
        <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)]">
          {FLA4_PATTERNS.map((p) => (
            <li key={p.id} data-testid="fla4-fallback-pattern">
              <span className="text-[var(--color-ink)]">{p.id}</span> — {p.title}. Terminal safe
              state: {p.terminalSafeState}.<Locator>{p.sourceRef}</Locator>
            </li>
          ))}
        </ul>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {FLA4_FUNCTIONALITIES.length} functionalities are recorded for this module and{' '}
          {FLA4_FUNCTIONALITIES_NAMING_NO_PATTERN.length} of them name no fallback pattern at all.
          Each of those states its own reason for not naming one, and none has been given a pattern
          here to make the count come out clean:{' '}
          {FLA4_FUNCTIONALITIES_NAMING_NO_PATTERN.join(', ')}.
          <Locator>AC-FL-011-1 L40151</Locator>
        </p>
      </section>

      <section aria-label="Open decisions">
        <h4 className="text-sm font-semibold text-[var(--color-ink)]">
          Questions this build does not answer
        </h4>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The shared decision canon holds a record for {FLA4_DECISION_IN_THE_SHARED_CANON} and for
          none of the five below, so these are disclosed here with their own locators until that
          canon carries them. Every reading stands; none of them is this build&rsquo;s to settle.
        </p>
        <ul className="mt-2 space-y-4">
          {FLA4_DECISIONS_NOT_IN_THE_SHARED_CANON.map((d) => (
            <li
              key={d.id}
              data-testid="fla4-open-decision"
              role="note"
              className="rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] p-3 text-sm"
            >
              <p className="font-medium text-[var(--color-ink)]">Open decision {d.id}</p>
              <p className="mt-1 text-[var(--color-ink-muted)]">{d.question}</p>
              <ul className="mt-2 space-y-1">
                {d.readings.map((r) => (
                  <li key={r.text} className="text-[var(--color-ink-muted)]">
                    {r.text}
                    <Locator>{r.locator}</Locator>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[var(--color-ink)]">{d.adopted}</p>
              <p className="mt-1 text-[var(--color-ink-muted)]">{d.whereItBites}</p>
              <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
                A client-delegated choice under APP-012, not a position the source settled.
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

/**
 * The value the controller wires into `RunPlayerRoute`. A factory, because
 * the persona is a property of the reader and not of the module — and a
 * ready-made Worker panel beside it, which is the case §25.5 names first.
 */
export function fla4RunPlayerPanel(persona: Fla4Column = 'WORKER'): RunPlayerPanel {
  return {
    module: 'MOD-FL-A4',
    heading: HEADING,
    rendersViews: RENDERS_VIEWS,
    body: <DataCaptureAndEvidencePanel persona={persona} />,
  }
}

export const FLA4_RUN_PLAYER_PANEL: RunPlayerPanel = fla4RunPlayerPanel()

/** Re-exported so a caller can walk the columns without importing the matrix. */
export { FLA4_COLUMNS }
