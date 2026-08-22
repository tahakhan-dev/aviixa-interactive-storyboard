import type { RoleId } from '@/domain/roles'
import {
  CC13_ABSOLUTE_EXCLUSIONS,
  CC13_ACTIONS,
  CC13_AC_407_COVERAGE,
  CC13_COLUMNS,
  CC13_COLUMN_ROLE,
  CC13_EXCLUSION_MISCOUNT,
  CC13_OWNING_PLACES,
  type Cc13Column,
} from './action-set'
import {
  CC_WRITES_OUTSIDE_THE_TEN,
  OUTSIDE_WRITE_COUNT_STATEMENT,
} from './outside-writes'
import {
  CC_CLASSES_NOT_ORIGINATED_HERE,
  CC_COMMAND_BEARING_ACTIONS,
  CC_NO_CLIENT_SIDE_QUEUE,
  ccPropagationRollUp,
  type DeviceCommandState,
} from './propagation'

/**
 * `MOD-CC-13`'s ACTION RAIL — THE CLOSED SET OF TEN, RENDERED.
 *
 * A SERVER COMPONENT, AND IT MUST NOT ACQUIRE `'use client'`. Everything it
 * renders comes from `action-set.ts`, `outside-writes.ts` and
 * `propagation.ts`, all three of which export plain data objects. A
 * `'use client'` directive on any of the four would replace those exports
 * with client references and the strings would be gone by the time a route
 * prerenders — the defect that put an undefined module id into four built
 * pages in slice 7 while every component test stayed green, because a
 * component suite mounts the component and the client boundary only exists in
 * a build.
 *
 * IT HAS NO ROUTE, AND MOUNTING IT INSIDE ANOTHER MODULE'S SCREEN IS THE
 * PATTERN THIS SURFACE REQUIRES. `MOD-CC-13` has no row in the thirteen-screen
 * register; `src/surfaces/cc/modules.ts` records that abstention with its
 * reasons. `AC-CC-040` forbids a fourteenth module route, so this rail mounts
 * inside the twelve module screens rather than owning one. Appearing on
 * another module's screen moves that screen's mention counts and is not
 * evidence of ownership.
 *
 * IT DRAWS NO LINK ITSELF. The cockpit rule (L38657) puts every one of the
 * ten controls here and every one of the ten RECORDS somewhere else, and
 * L48437 makes the pointer an obligation: "Every action links to its Delivery
 * Operations Hub audit entry." The link component is task 5's shared
 * cross-surface link-out. `CC13_OWNING_PLACES` is this module's half of that
 * contract — the same shape `src/frontline/cross-surface.tsx` consumes on the
 * Frontline — rendered here as a named place and no anchor, so there is
 * nothing to delete when the shared component lands and no seventh spelling
 * competing with it.
 */

/** The viewer's role read onto this matrix's own column, or `null` if it names none. */
export function cc13ColumnForRole(role: RoleId): Cc13Column | null {
  const found = CC13_COLUMNS.find((c) => CC13_COLUMN_ROLE[c] === role)
  return found ?? null
}

/**
 * An ILLUSTRATION of the roll-up, and it is labelled as one on screen. The
 * source's own worked example is two devices out of two (L2100) and a
 * per-device list beside the state (L4246). Three device sets are shown
 * because `AC-PROD-054` (L1680) requires all three states to be renderable
 * and a single fixture would demonstrate one. The device names are not values
 * the source states.
 */
const ILLUSTRATIVE_DEVICE_SETS: readonly {
  readonly label: string
  readonly devices: readonly DeviceCommandState[]
}[] = [
  {
    label: 'Issued — the release exists and no device has taken a device-side step',
    devices: [
      { deviceId: 'TAB-014', state: 'queued' },
      { deviceId: 'TAB-015', state: 'available-for-delivery' },
    ],
  },
  {
    label: 'Propagating — one device has acknowledged and one has not returned',
    devices: [
      { deviceId: 'TAB-014', state: 'acknowledged' },
      { deviceId: 'TAB-015', state: 'delivered' },
    ],
  },
  {
    label: 'In force — two devices out of two, both acknowledged',
    devices: [
      { deviceId: 'TAB-014', state: 'acknowledged' },
      { deviceId: 'TAB-015', state: 'acknowledged' },
    ],
  },
]

export function ActionRail({ viewerRole }: { readonly viewerRole: RoleId }) {
  const column = cc13ColumnForRole(viewerRole)

  return (
    <section data-testid="cc13-action-rail" data-module-id="MOD-CC-13" className="mt-10">
      <h2 className="text-2xl font-semibold" data-testid="cc13-name">
        Operational actions, the closed set of ten
      </h2>
      <p className="mt-1 text-sm text-[var(--color-ink-subtle)]" data-testid="cc13-module-id">
        MOD-CC-13 · §6.14 · specified in section 21.16 · no route of its own
      </p>
      <p className="mt-3 max-w-prose text-[var(--color-ink-muted)]" data-testid="cc13-discipline">
        The Command Center is the cockpit, never the engine. Every action is a command against a
        Delivery Operations Hub-owned record, executed through the owning Delivery Operations Hub
        service, and written to the Delivery Operations Hub audit trail. The set is a closed list of
        ten: adding an action is a scope decision, never a drift.
      </p>

      {/* ── The ten, their authority, and where each executes ──────────── */}
      <h3 className="mt-8 text-lg font-semibold">
        The ten actions, their authority and their executing service
      </h3>
      <div className="mt-3 overflow-x-auto">
        <table data-testid="cc13-authority-table" className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th scope="col">#</th>
              <th scope="col">Action</th>
              <th scope="col">Authority</th>
              <th scope="col">Executes via</th>
            </tr>
          </thead>
          <tbody>
            {CC13_ACTIONS.map((a) => (
              <tr key={a.ordinal} data-testid={`cc13-authority-row-${a.ordinal}`}>
                <td>{a.ordinal}</td>
                <td>{a.authorityAction}</td>
                <td>{a.authority}</td>
                <td>{a.executesVia}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── The permission matrix, header-keyed ────────────────────────── */}
      <h3 className="mt-8 text-lg font-semibold">The action permission matrix</h3>
      <p className="mt-1 text-sm text-[var(--color-ink-subtle)]">
        Columns in the source&rsquo;s own order: Tenant Admin first, Worker last.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table data-testid="cc13-permission-matrix" className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th scope="col">#</th>
              <th scope="col">Action</th>
              {CC13_COLUMNS.map((c) => (
                <th scope="col" key={c} data-testid={`cc13-matrix-col-${c}`}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CC13_ACTIONS.map((a) => (
              <tr key={a.ordinal} data-testid={`cc13-matrix-row-${a.ordinal}`}>
                <td>{a.ordinal}</td>
                <td>{a.matrixAction}</td>
                {CC13_COLUMNS.map((c) => (
                  <td key={c} data-testid={`cc13-cell-${a.ordinal}-${c}`}>
                    {a.cells[c].text}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── What the viewer's own role may do ──────────────────────────── */}
      <h3 className="mt-8 text-lg font-semibold">What your role may do here</h3>
      {column === null ? (
        <p data-testid="cc13-viewer-no-column" className="mt-2 text-sm">
          Your role names no column of this matrix.
        </p>
      ) : (
        <ul data-testid="cc13-viewer-verdicts" className="mt-2 space-y-1 text-sm">
          {CC13_ACTIONS.map((a) => (
            <li key={a.ordinal} data-testid={`cc13-viewer-${a.ordinal}`}>
              <span className="font-medium">{a.matrixAction}</span>
              {' — '}
              <span data-testid={`cc13-viewer-token-${a.ordinal}`}>{a.cells[column].token}</span>
              {a.cells[column].note === null ? null : (
                <span data-testid={`cc13-viewer-note-${a.ordinal}`}>
                  {' — '}
                  {a.cells[column].note}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* ── Where each act's record actually lives ─────────────────────── */}
      <h3 className="mt-8 text-lg font-semibold">
        This surface owns no operational record
      </h3>
      <ul data-testid="cc13-owning-places" className="mt-2 space-y-2 text-sm">
        {CC13_OWNING_PLACES.map((p) => (
          <li
            key={p.ordinal}
            role="note"
            data-testid={`cc13-owning-place-${p.ordinal}`}
            data-has-named-owner={p.owningPlace === null ? 'no' : 'yes'}
            className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-3"
          >
            <span className="font-medium">{p.capability}</span>
            <span className="block text-[var(--color-ink-muted)]">
              {p.owningPlace === null
                ? `The Executes via column names no owning record for this action. ${p.owningPlaceElsewhere ?? ''}`
                : `Owned there, not here — ${p.owningPlace}. The control is here; the record and its audit entry are not.`}
            </span>
            <span className="block text-xs text-[var(--color-ink-subtle)]">{p.sourceRef}</span>
          </li>
        ))}
      </ul>

      {/* ── The four absolute exclusions, and the statement saying three ─ */}
      <h3 className="mt-8 text-lg font-semibold">The four absolute exclusions</h3>
      <ul data-testid="cc13-exclusions" className="mt-2 space-y-2 text-sm">
        {CC13_ABSOLUTE_EXCLUSIONS.map((e) => (
          <li key={e.ordinal} data-testid={`cc13-exclusion-${e.ordinal}`}>
            <span className="font-medium">{e.rule}</span>{' '}
            <span className="text-[var(--color-ink-muted)]">{e.reason}</span>{' '}
            <span className="text-xs text-[var(--color-ink-subtle)]">{e.sourceRef}</span>
          </li>
        ))}
      </ul>
      <p
        role="note"
        data-testid="cc13-exclusion-miscount"
        className="mt-3 max-w-prose rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-3 text-sm"
      >
        {CC13_EXCLUSION_MISCOUNT.finding}
      </p>
      <p
        role="note"
        data-testid="cc13-ac407-gap"
        className="mt-3 max-w-prose rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-3 text-sm"
      >
        {CC13_AC_407_COVERAGE.finding}
      </p>

      {/* ── The writes outside the ten ─────────────────────────────────── */}
      <h3 className="mt-8 text-lg font-semibold">Writes outside the closed set of ten</h3>
      <p
        data-testid="cc13-outside-write-count"
        className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]"
      >
        {OUTSIDE_WRITE_COUNT_STATEMENT}
      </p>
      <div className="mt-3 overflow-x-auto">
        <table data-testid="cc13-outside-writes" className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th scope="col">Write</th>
              <th scope="col">Named by DEC-CCWRITE-001</th>
              <th scope="col">Section</th>
              <th scope="col">Standing</th>
            </tr>
          </thead>
          <tbody>
            {CC_WRITES_OUTSIDE_THE_TEN.map((w) => (
              <tr
                key={w.act}
                data-testid={`cc13-outside-write-${w.namedByDecCcWrite001 ? 'source' : 'found'}`}
                data-named-by-source={w.namedByDecCcWrite001 ? 'yes' : 'no'}
              >
                <td>{w.act}</td>
                <td>{w.namedByDecCcWrite001 ? 'Yes' : 'No — found in a chapter-21 matrix'}</td>
                <td>{w.section}</td>
                <td>{w.standing}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Per-device propagation ─────────────────────────────────────── */}
      <h3 className="mt-8 text-lg font-semibold">Per-device command propagation</h3>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        Three of the ten ride the command channel. A command is rendered as issued, then
        propagating, then in force per device, and it is never in force until every relevant device
        has acknowledged application. A device that never returns holds it at propagating
        indefinitely; nothing here promotes it on a timer.
      </p>
      <ul data-testid="cc13-command-bearing" className="mt-2 space-y-1 text-sm">
        {CC_COMMAND_BEARING_ACTIONS.map((a) => (
          <li key={a.ordinal} data-testid={`cc13-command-bearing-${a.ordinal}`}>
            Action {a.ordinal} — {a.action} — rides {a.commandClassName} ({a.commandClass})
          </li>
        ))}
      </ul>
      <ul data-testid="cc13-classes-not-here" className="mt-2 space-y-1 text-sm">
        {CC_CLASSES_NOT_ORIGINATED_HERE.map((c) => (
          <li key={c.commandClass} data-testid={`cc13-not-here-${c.commandClass}`}>
            {c.commandClassName} is not originated here. {c.whyNotHere}
          </li>
        ))}
      </ul>

      <p className="mt-4 text-sm text-[var(--color-ink-subtle)]">
        Illustration of the roll-up. The device names below are not values the source states.
      </p>
      <ul data-testid="cc13-rollup-illustrations" className="mt-2 space-y-2 text-sm">
        {ILLUSTRATIVE_DEVICE_SETS.map((set) => {
          const rollUp = ccPropagationRollUp(set.devices)
          return (
            <li
              key={set.label}
              data-testid={`cc13-rollup-${rollUp.state.replace(' ', '-')}`}
              data-rollup-state={rollUp.state}
              className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-3"
            >
              <span className="font-medium">{rollUp.state}</span>
              <span className="block text-[var(--color-ink-muted)]">{rollUp.why}</span>
              <span className="block text-xs text-[var(--color-ink-subtle)]">
                Confirmed: {rollUp.confirmed.length === 0 ? 'none' : rollUp.confirmed.join(', ')} ·
                Unconfirmed: {rollUp.unconfirmed.length === 0 ? 'none' : rollUp.unconfirmed.join(', ')}
              </span>
            </li>
          )
        })}
      </ul>

      <p
        role="note"
        data-testid="cc13-no-client-queue"
        className="mt-4 max-w-prose rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-3 text-sm"
      >
        {CC_NO_CLIENT_SIDE_QUEUE.criterion} — {CC_NO_CLIENT_SIDE_QUEUE.statement}{' '}
        {CC_NO_CLIENT_SIDE_QUEUE.enforcement}
      </p>
    </section>
  )
}
