import type { RoleId } from '@/domain/roles'
import { CrossSurfaceLink } from '@/ui/CrossSurfaceLink'
import { CC_LINK_OUT_CELLS, ccLinkOutModel } from '@/surfaces/cc/decisions/link-outs'
import { LiveFreshnessMarker } from '@/surfaces/cc/live/LiveFreshnessMarker'
import { ccMarkerText } from '@/surfaces/cc/live/model'
import {
  RunCompletionState,
  SyncStateChrome,
} from '@/surfaces/cc/modules/cc-02/SyncStateChrome'
import { CC02_RUN_STATES, cc02PendingText } from '@/surfaces/cc/modules/cc-02/chrome'
import {
  CC01_BOARD_ELEMENTS,
  CC01_BOARD_MARKER,
  CC01_CELL_CONTRIBUTIONS,
  CC01_DISPLAY_STATES,
  CC01_FALLBACKS,
  CC01_INFORMATION_CONTRACT,
  CC01_LANDING_REF,
  CC01_LAST_INVENTORY_READ,
  CC01_MARKER_ELEMENT,
  CC01_PER_DEVICE_ELEMENTS,
  CC01_SESSION_OFFLINE,
  CC01_STORYBOARD_DEVICES,
  cc01QuietBandText,
  cc01RenderPlan,
  type Cc01BoardCell,
} from './board'
import {
  CC01_COLUMN_ORDER,
  CC01_MATRIX,
  CC01_ROLE_COLUMNS,
  CC01_TENANT_ADMIN_CONTEST,
  cc01Row,
} from './matrix'

/* ==================================================================== *
 * `SCR-CC-02` RENDERED — `MOD-CC-01`'S BOARD WITH `MOD-CC-02`'S MARKER ON IT.
 *
 * A SERVER COMPONENT, AND IT MUST NOT ACQUIRE `'use client'`. Every table it
 * renders comes from `./board`, `./matrix` and three wave-0 data modules,
 * all of which export plain objects. The one client module in the tree below
 * it is `LiveFreshnessMarker`, which exports a component and a props type and
 * nothing else — the boundary is where it belongs.
 *
 * THIS IS THE SCREEN THAT CLOSES TWO UNREACHED WAVE-0 FILES. Before this
 * file, `src/surfaces/cc/live/LiveFreshnessMarker.tsx` and
 * `src/surfaces/cc/modules/cc-02/SyncStateChrome.tsx` were imported by no
 * page: both compiled, both passed their suites, and neither had ever
 * rendered. A component that compiles, passes its unit suite and is imported
 * by nothing is not shipped.
 *
 * `MOD-CC-02` IS MOUNTED AND NOT REBUILT. Nothing under `../cc-02/` is
 * edited by this task. Its `SyncStateChrome` wraps every element's value and
 * its `RunCompletionState` draws the three; its site-wide banner is the
 * shell's chrome slot and lives in `./BoardSyncChrome`, following L36503's
 * own split — markers to every module, the banner to the board.
 *
 * TWO MARKERS RENDER HERE AND THEY ARE DIFFERENT COMPONENTS ANSWERING
 * DIFFERENT QUESTIONS, which is why neither is a duplicate of the other:
 *
 *  - `MOD-CC-02`'s `FreshnessMarker`, inside `SyncStateChrome`, renders
 *    §21.5's card state through `HonestElement`'s three-clause test. It
 *    answers "is this element's statement honest about its origin, its age
 *    and its intent".
 *  - §21.3.2's `LiveFreshnessMarker` renders the element's CLASS ASSIGNMENT
 *    and the device expansion. It answers "by what transport does this
 *    element arrive, what must it therefore always show, and which devices
 *    are behind the number".
 *
 * L36475 settles their order — "renders the marker before the element's
 * value renders" — so the chrome's marker is above and this board's value is
 * its `children`.
 * ==================================================================== */

/**
 * The board's exception set. Every string is `SB-CC-12`'s (L36385) and the
 * quiet band's count is `SB-CC-12`'s too (L36387), so the whole fixture is
 * one storyboard rather than three numbers this build chose. It is labelled
 * as the storyboard's on screen.
 */
const SB_CC_12_CELLS: readonly Cc01BoardCell[] = [
  {
    cellId: 'Wheel Station 2 · Severity 1',
    exception:
      'LOT-WB-2291 frozen · origin 10:07 device time · received 10:22:14 · hold propagating, 3 of 4 devices confirmed',
  },
  {
    cellId: 'Wheel Station 2 · Severity 2',
    exception:
      'RB-0007 41.0 Newton metres against 44 to 47 · origin 09:41 · received 10:22:14 · acknowledged by Sam 10:23:11',
  },
  {
    cellId: 'Frame Station 1',
    exception: '1 run behind pace · 22 percent over expected timing at screen 9 of 14',
  },
  { cellId: 'quiet-1', exception: null },
  { cellId: 'quiet-2', exception: null },
  { cellId: 'quiet-3', exception: null },
  { cellId: 'quiet-4', exception: null },
  { cellId: 'quiet-5', exception: null },
]

const BOARD_RANKING_CELL = (() => {
  const found = CC_LINK_OUT_CELLS.find((c) => c.id === 'cc-01-board-ranking')
  if (found === undefined) {
    throw new Error(
      'CC_LINK_OUT_CELLS no longer carries cc-01-board-ranking. That row (L36270) is this ' +
        "module's only population-B cell: prohibited, and naming the Standards and Operations " +
        'Studio as the place the act lives. Without it the cell renders as nothing at all, which ' +
        'is what AC-CC-301 forbids.',
    )
  }
  return found
})()

/** Looked up by id, never by index: a positional read is true of both a
 * transcription and its reordering, and this row is the card's one trap. */
const PACE_ROW = cc01Row('see-pace-state')

export function LiveShiftBoard({ viewerRole }: { readonly viewerRole: RoleId }) {
  const plan = cc01RenderPlan(SB_CC_12_CELLS)
  const syncStateText = ccMarkerText(CC01_BOARD_MARKER)
  const offline = CC01_BOARD_MARKER.devices.filter((d) => d.pendingCaptures !== 0).length
  // Named off the data, so a fixture whose unknown moved to another device
  // renames the sentence instead of leaving it pointing at the wrong tablet.
  const unknownPendingDevices = CC01_STORYBOARD_DEVICES.filter(
    (d) => d.pendingCaptures === 'unknown',
  )
    .map((d) => d.deviceId)
    .join(', ')

  return (
    <section data-testid="cc01-board" data-module-id="MOD-CC-01" className="mt-10">
      <h2 className="text-2xl font-semibold" data-testid="cc01-name">
        Live shift board
      </h2>
      <p className="mt-1 text-sm text-[var(--color-ink-subtle)]" data-testid="cc01-module-id">
        MOD-CC-01 · §6.3 · specified in section 21.4 · shares SCR-CC-02 with MOD-CC-02, which owns
        no route of its own
      </p>
      <ol className="mt-3 max-w-prose space-y-1 text-sm" data-testid="cc01-contract">
        {CC01_INFORMATION_CONTRACT.map((c) => (
          <li key={c.part} data-testid={`cc01-contract-part-${c.part}`}>
            <span className="font-medium">({c.part})</span>{' '}
            <span className="text-[var(--color-ink-muted)]">{c.obligation}</span>
          </li>
        ))}
      </ol>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        Each of the four is a testable obligation, not a design aspiration. Part three is the one
        most often dropped in implementation and is the one this platform cannot drop: a board that
        shows attention and normality but not sync state is a board that lies by omission.
      </p>

      {/* ── PART 3, AND IT COMES FIRST DELIBERATELY ─────────────────────
          L36233 makes the sync state the part most often dropped. Putting it
          above the attention region is this screen's answer to that, and
          L36475's ordering rule agrees: the marker renders before the value. */}
      <div data-testid="cc01-sync-state" className="mt-8">
        <h3 className="text-lg font-semibold">What the platform cannot currently see</h3>
        <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
          Storyboard SB-CC-08, L35963-L35971. Three devices, one dark since 09:11:47. Every figure
          on this screen is the source&rsquo;s own; none is live telemetry and none is invented.
        </p>
        <div className="mt-3">
          <LiveFreshnessMarker
            element={CC01_MARKER_ELEMENT.element}
            marker={CC01_BOARD_MARKER}
            lastInventoryRead={CC01_LAST_INVENTORY_READ}
          />
        </div>
        <p className="mt-2 text-xs text-[var(--color-ink-subtle)]" data-testid="cc01-never-zero">
          {unknownPendingDevices} is offline and its pending-capture count is not known, so the
          marker reads &ldquo;{cc02PendingText('unknown')}&rdquo; rather than a zero.
          A zero would be read as &ldquo;nothing is waiting&rdquo;, and the source&rsquo;s own
          worked example has 14 captures landing from a cell that had been dark.
        </p>
        <p className="mt-2 text-xs text-[var(--color-ink-subtle)]" data-testid="cc01-per-device">
          Per-device obligation on this screen: {CC01_PER_DEVICE_ELEMENTS.join(', ')}. The other
          per-device row of the eighteen-row assignment — hold per-device confirmation state — is
          MOD-CC-04&rsquo;s and does not appear here.
        </p>
      </div>

      {/* ── PART 1 ──────────────────────────────────────────────────────── */}
      <div data-testid="cc01-attention" className="mt-8">
        <h3 className="text-lg font-semibold">Where attention is needed</h3>
        <ul className="mt-3 space-y-2">
          {plan.tiles.map((t) => (
            <li key={t.cellId} data-testid={`cc01-tile-${t.cellId}`} className="text-sm">
              <span className="font-medium">{t.cellId}</span>{' '}
              <span className="text-[var(--color-ink-muted)]">{t.exception}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── PART 2, AND THE COUNT IS THE AGGREGATION ────────────────────
          `cc01RenderPlan` returns the exceptions and a COUNT. There is no
          field holding the quiet cells, because a field holding them is the
          failure the scale requirement names: 120 tiles rendered and 113
          de-emphasised has met the design intent and failed the requirement. */}
      <div data-testid="cc01-quiet-band" className="mt-8">
        <h3 className="text-lg font-semibold">What is running normally</h3>
        <p className="mt-1 text-sm" data-testid="cc01-quiet-band-text">
          {cc01QuietBandText(plan.quietCount, syncStateText)}
        </p>
        <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
          {plan.quietCount} quiet cells are aggregated into that one line and are not rendered as
          tiles. The band&rsquo;s sync half is the marker&rsquo;s own text, so it can never claim
          &ldquo;all synced&rdquo; while {offline} of {CC01_BOARD_MARKER.devices.length} devices are
          dark — a cell showing normal while offline is showing a remembered normal.
        </p>
      </div>

      {/* ── PART 4 ──────────────────────────────────────────────────────── */}
      <p className="mt-6 max-w-prose text-sm text-[var(--color-ink-muted)]" data-testid="cc01-drill">
        Selecting an attention item reaches its full context in one gesture, on SCR-CC-03 and
        SCR-CC-04. Neither route is built yet, so no link is offered here rather than an anchor
        pointing at a page that does not exist.
      </p>

      {/* ── EVERY ELEMENT CARRIES ITS CLASS AND ITS OBLIGATION ──────────
          AC-CC-111 (L35908) — no element renders a value without the marker
          obligation its class requires. The obligations are not uniform: five
          of these six read `As-of time` and the sixth reads `Per-device
          last-seen time`, which is why a class enum alone cannot express
          this and the assignment is looked up per element. */}
      <h3 className="mt-10 text-lg font-semibold">Every element, with its class and its obligation</h3>
      <ul className="mt-3 space-y-4" data-testid="cc01-elements">
        {CC01_BOARD_ELEMENTS.map((el) => (
          <li key={el.element} data-testid={`cc01-element-${el.sourceRef}`}>
            <SyncStateChrome
              marker={{
                state: 'partially-synced',
                lastSyncLabel: CC01_BOARD_MARKER.lastSyncInScope,
                devicesOffline: offline,
                devicesTotal: CC01_BOARD_MARKER.devices.length,
                pending: 'unknown',
                // The board writes nothing and issues no command, so no
                // element here describes an intent aimed at a device. Passing
                // a CommandState would claim one.
                commandState: null,
              }}
            >
              <p className="text-sm">
                <span className="font-medium">{el.element}</span> ·{' '}
                <span className="text-[var(--color-ink-muted)]">{el.classCell}</span> ·{' '}
                <span className="text-[var(--color-ink-muted)]">{el.markerObligation}</span>{' '}
                <span className="text-xs text-[var(--color-ink-subtle)]">{el.sourceRef}</span>
              </p>
            </SyncStateChrome>
          </li>
        ))}
      </ul>

      {/* ── RUN COMPLETION, THREE STATES AND NEVER COLLAPSED ────────────
          L36503 — MOD-CC-02 "supplies run states to `MOD-CC-01`". Rendered
          through that module's own component so the three are never
          collapsed into "done", which is its business rule 6.

          NO MANUAL-CLOSE LINK IS DRAWN HERE, and that is a placement rather
          than an omission: `MOD-CC-02`'s own row for it reads "reached by a
          link from the drill" (L36459), and the drill is SCR-CC-04's, which
          MOD-CC-03 owns. A link on the board would put the act one screen
          earlier than the source places it. */}
      <div className="mt-8" data-testid="cc01-run-states">
        <h3 className="text-lg font-semibold">Run completion, in three distinct states</h3>
        <div className="mt-3 space-y-2">
          {CC02_RUN_STATES.map((s) => (
            <RunCompletionState key={s} state={s} />
          ))}
        </div>
      </div>

      {/* ── WHAT EACH CELL CONTRIBUTES ──────────────────────────────────── */}
      <h3 className="mt-10 text-lg font-semibold">What each cell contributes, and its source</h3>
      <div className="mt-3 overflow-x-auto">
        <table data-testid="cc01-contributions" className="w-full text-left text-sm">
          <thead>
            <tr>
              <th scope="col">Board element</th>
              <th scope="col">Source</th>
              <th scope="col">Freshness class</th>
              <th scope="col">Line</th>
            </tr>
          </thead>
          <tbody>
            {CC01_CELL_CONTRIBUTIONS.map((c) => (
              <tr key={c.sourceRef} data-testid={`cc01-contribution-${c.sourceRef}`}>
                <th scope="row" className="font-normal">
                  {c.element}
                </th>
                <td>{c.source}</td>
                <td>{c.classCell}</td>
                <td className="text-[var(--color-ink-subtle)]">{c.sourceRef}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── THE PERMISSION MATRIX, HEADER-KEYED ─────────────────────────── */}
      <h3 className="mt-10 text-lg font-semibold">Roles that see and use it, and their permissions</h3>
      <div className="mt-3 overflow-x-auto">
        <table data-testid="cc01-matrix" className="w-full text-left text-sm">
          <thead>
            <tr>
              {CC01_COLUMN_ORDER.map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
              <th scope="col">Line</th>
            </tr>
          </thead>
          <tbody>
            {CC01_MATRIX.map((row) => (
              <tr key={row.id} data-testid={`cc01-row-${row.id}`}>
                <th scope="row" className="font-normal">
                  {row.capability}
                </th>
                {CC01_ROLE_COLUMNS.map((col) => (
                  <td key={col} data-testid={`cc01-cell-${row.id}-${col}`}>
                    {row.cells[col].verbatim}
                  </td>
                ))}
                <td className="text-[var(--color-ink-subtle)]">{row.sourceRef}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
        Every Supervisor and Quality Manager entry above is an enumerated grant under DEC-PLUS-001,
        not an inference from a rank order.
      </p>

      {/* ── THE TRAP: A PROHIBITION HELD IN ANOTHER SURFACE'S PAYLOAD ──── */}
      <div className="mt-8" data-testid="cc01-pace-containment">
        <h3 className="text-lg font-semibold">
          One prohibition on this card is not this surface&rsquo;s to enforce
        </h3>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The Worker cell of &ldquo;See pace state&rdquo; reads{' '}
          <span data-testid="cc01-pace-worker-cell">{PACE_ROW.cells.WORKER.verbatim}</span>
          . Read the whole clause and not its head token: the thing prohibited is not an act a
          person performs here.
        </p>
        <p
          className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]"
          data-testid="cc01-pace-enforced-by"
        >
          {PACE_ROW.enforcedBy}
        </p>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          No control is drawn for that cell. A cell in this surface&rsquo;s matrix cannot enforce
          the absence of a field in another surface&rsquo;s payload, and drawing a disabled
          affordance would assert that this surface is where the rule lives.
        </p>
      </div>

      {/* ── POPULATION B: PROHIBITED, AND NAMING A DESTINATION ──────────── */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold">One cell needs a link, not a control</h3>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The board adds no rules of its own. Changing what it ranks or how it flags is configured
          elsewhere, and the write control renders an explicitly prohibited cell as nothing at all —
          so a faithful transcription would produce an empty cell where the source names a place.
        </p>
        <div className="mt-3">
          <CrossSurfaceLink model={ccLinkOutModel(BOARD_RANKING_CELL, viewerRole)} />
        </div>
      </div>

      {/* ── THE TENANT ADMIN, READ TWO WAYS ─────────────────────────────── */}
      <div className="mt-8" data-testid="cc01-tenant-admin-contest">
        <h3 className="text-lg font-semibold">
          The same role renders with two different permission sets
        </h3>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          {CC01_TENANT_ADMIN_CONTEST.question}
        </p>
        <ul className="mt-3 space-y-3">
          {CC01_TENANT_ADMIN_CONTEST.readings.map((r) => (
            <li key={r.locator} data-testid={`cc01-reading-${r.locator}`} className="text-sm">
              <span className="text-[var(--color-ink-muted)]">{r.text}</span>{' '}
              <span className="text-xs text-[var(--color-ink-subtle)]">{r.locator}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 max-w-prose text-xs text-[var(--color-ink-subtle)]">
          {CC01_TENANT_ADMIN_CONTEST.noDecisionIdentifier} Neither reading is chosen here, and the
          row that reads consistently with both — the scoped board, reached only via the
          connectivity banner context — is the only one of the seven that does.
        </p>
      </div>

      {/* ── STATES AND FALLBACKS ────────────────────────────────────────── */}
      <div className="mt-8" data-testid="cc01-fallbacks">
        <h3 className="text-lg font-semibold">Display states and fallbacks</h3>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          {CC01_DISPLAY_STATES.map((s) => `${s.id} — ${s.meaning}`).join(' · ')}
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          {CC01_FALLBACKS.map((f) => (
            <li key={f.id} data-testid={`cc01-fallback-${f.id}`}>
              <span className="font-mono">{f.id}</span>{' '}
              <span className="text-[var(--color-ink-muted)]">
                {f.triggeringCondition} → {f.terminalSafeState}
              </span>{' '}
              <span className="text-xs text-[var(--color-ink-subtle)]">{f.sourceRef}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-ink-muted)]" data-testid="cc01-session-offline">
          When this session is offline: {CC01_SESSION_OFFLINE.behaviour} (
          {CC01_SESSION_OFFLINE.sourceRef}) {CC01_SESSION_OFFLINE.whyNoWriteControl}
        </p>
      </div>

      <p className="mt-8 max-w-prose text-xs text-[var(--color-ink-subtle)]">
        This screen is the Supervisor&rsquo;s landing view ({CC01_LANDING_REF}), which is why the
        freshness marker mounts here rather than somewhere quieter: the first screen a Supervisor
        sees must be honest about its own freshness before it is useful.
      </p>
    </section>
  )
}
