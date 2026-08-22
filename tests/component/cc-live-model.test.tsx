import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { LiveFreshnessMarker } from '@/surfaces/cc/live/LiveFreshnessMarker'
import {
  CC_MARKER_DEVICE_COLUMNS,
  ccElementAssignment,
  type CcMarkerDevice,
  type CcMarkerState,
} from '@/surfaces/cc/live/model'

/**
 * §21.3.2 — THE MARKER, AS A RENDERING.
 *
 * The unit suite next door asks whether the transcription matches the frozen
 * source. This one asks whether what the source says REACHES THE SCREEN,
 * because a rule held in data and never drawn is a code comment.
 *
 * THREE BEATEN-GATE SHAPES FROM THE RUNNING CATALOGUE ARE LIVE HERE:
 *
 *  - `textContent` WELDS ADJACENT ELEMENTS. Reading a row's `textContent` to
 *    check the pending cell yields `TAB-01409:11:4709:11:47Unknown while
 *    offline`, in which `not.toMatch(/\b0\b/)` is satisfied by nothing and
 *    broken by the timestamps. Every cell below is read as its OWN cell,
 *    through `within(row).getAllByRole('cell')` indexed by the column's
 *    position in `CC_MARKER_DEVICE_COLUMNS`.
 *  - AN ALLOWANCE TAKING ITS ALLOWED STRING FROM THE VALUE UNDER TEST. The
 *    zero check does not ask "does the cell equal what the model said" — it
 *    asserts the rendered digit `0` is ABSENT from the unknown device's cell
 *    and PRESENT in a synced device's, in the same render. Both directions in
 *    one assertion pair, so neither can pass vacuously.
 *  - A `hidden` ATTRIBUTE DEFEATING THE SAME READ. The expansion is mounted
 *    conditionally rather than hidden, and the collapsed case asserts the
 *    device table is ABSENT from the accessibility tree rather than merely
 *    not visible.
 *
 * EVERY GATE WAS PLANTED AND WATCHED GO RED, in the real shipping file, then
 * restored byte-identically and checksum-verified.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')
const srcLine = (n: number): string => LINES[n - 1]!

const device = (over: Partial<CcMarkerDevice> = {}): CcMarkerDevice => ({
  deviceId: 'TAB-015',
  cell: 'Wheel Station 2',
  lastSeen: '10:21:58',
  lastSync: '10:21:58',
  pendingCaptures: 0,
  ...over,
})

/** The storyboard's own three devices, `SB-CC-08` at L35967-L35969. */
const storyboardState: CcMarkerState = {
  scope: 'cell',
  devices: [
    device({
      deviceId: 'TAB-014',
      lastSeen: '09:11:47',
      lastSync: '09:11:47',
      pendingCaptures: 'unknown',
    }),
    device({ deviceId: 'TAB-015' }),
    device({ deviceId: 'TAB-016', lastSeen: '10:21:12', lastSync: '10:21:12' }),
  ],
  lastSyncInScope: '09:11',
  inventoryAvailable: true,
}

const pendingCellIndex = CC_MARKER_DEVICE_COLUMNS.indexOf('Pending captures')
const lastSeenCellIndex = CC_MARKER_DEVICE_COLUMNS.indexOf('Last seen')

function cellOf(deviceId: string, index: number): string {
  const row = screen.getByTestId(`cc-freshness-device-${deviceId}`)
  return within(row).getAllByRole('cell')[index]!.textContent ?? ''
}

describe('the marker on screen', () => {
  // FAILS IF: the marker disappears in the healthy case. `AC-CC-120` (L35979)
  // requires it in every state, and L35943 says why: showing it when
  // everything is fine is what makes it trustworthy when something is not.
  // PLANTED: made `LiveFreshnessMarker` return `null` when the form is
  //   'live-all-synced'.
  // RED: Unable to find an element by: [data-testid="cc-freshness-marker"]
  it('renders in the fully healthy state (AC-CC-120, L35979)', () => {
    render(
      <LiveFreshnessMarker
        element="Cell and line status"
        marker={{ ...storyboardState, devices: [device()] }}
        lastInventoryRead="10:20:03"
      />,
    )
    expect(screen.getByTestId('cc-freshness-marker')).toHaveProperty(
      'dataset.markerForm',
      'live-all-synced',
    )
    expect(screen.getByTestId('cc-freshness-marker-summary').textContent).toBe(
      'Live · all devices synced',
    )
  })

  // FAILS IF: the class assignment or the per-element obligation stops
  // reaching the screen. `AC-CC-111` (L35908) — no element renders a value
  // without the marker obligation its class requires — and this is the thing
  // `FreshnessLabel` cannot do, so it is the reason this component exists.
  // BOTH FIELDS ARE ASSERTED SEPARATELY: rendering only the class would still
  // contain the class string, and a single `toContain` on the joined line
  // passes for either half alone.
  // PLANTED: removed `{assignment.markerObligation}` from the class line.
  // RED: expected 'Hold per-device confirmation state · Refreshed · ' to contain
  //      'Per-device timestamps'
  it('renders the class AND the per-element obligation (AC-CC-111, L35908)', () => {
    const a = ccElementAssignment('Hold per-device confirmation state')
    render(
      <LiveFreshnessMarker
        element={a.element}
        marker={storyboardState}
        lastInventoryRead="10:20:03"
      />,
    )
    const line = screen.getByTestId('cc-freshness-class').textContent ?? ''
    expect(line).toContain(a.classCell)
    expect(line).toContain(a.markerObligation)
    expect(line).toContain('Per-device timestamps')
  })

  // FAILS IF: the class-plus-qualifier cell is flattened on the way to the
  // screen. L35900's Class cell is `Refreshed with an explicit data-as-of
  // stamp`, and rendering `Refreshed` there loses the whole finding — while
  // still passing a `toContain('Refreshed')` check, which is why the bare
  // token is asserted ABSENT as the whole cell.
  // PLANTED: rendered `assignment.freshnessClass` instead of
  //   `assignment.classCell`.
  // RED: expected 'Report figures · refreshed · Data-as-of timestamp on the file
  //      itself' to contain 'Refreshed with an explicit data-as-of stamp'
  it('renders the class-plus-qualifier cell whole (L35900)', () => {
    render(
      <LiveFreshnessMarker
        element="Report figures"
        marker={storyboardState}
        lastInventoryRead="10:20:03"
      />,
    )
    const line = screen.getByTestId('cc-freshness-class').textContent ?? ''
    expect(line).toContain('Refreshed with an explicit data-as-of stamp')
    expect(line).toContain('Data-as-of timestamp on the file itself')
  })

  // FAILS IF: an element with no class assignment renders anyway. `AC-CC-110`
  // (L35907). A component that swallowed the throw would render an unmarked
  // element, which `AC-CC-111` makes a failure — and a component test that
  // only mounted assigned elements would never see it.
  // PLANTED: wrapped the `ccElementAssignment` call in a try/catch returning
  //   a placeholder assignment.
  // RED: expected [Function] to throw an error
  it('refuses to render an unassigned element (AC-CC-110, L35907)', () => {
    expect(() =>
      render(
        <LiveFreshnessMarker
          element="An element nobody classified"
          marker={storyboardState}
          lastInventoryRead="10:20:03"
        />,
      ),
    ).toThrow(/L35907/)
  })
})

describe('the expansion (AC-CC-121, L35980)', () => {
  // FAILS IF: the expansion appears without being selected, or the collapsed
  // form merely hides it. A `hidden` attribute defeats a visibility read while
  // leaving the nodes in the tree, so the collapsed case asserts ABSENCE from
  // the accessibility tree.
  // PLANTED: replaced `expanded &&` with `true &&`, mounting the expansion
  //   unconditionally.
  // RED: expected <table><thead>…(1)</thead> … to be null
  it('opens only on selection and states its expanded-ness', async () => {
    const user = userEvent.setup()
    render(
      <LiveFreshnessMarker
        element="Device heartbeat and last sync"
        marker={storyboardState}
        lastInventoryRead="10:20:03"
      />,
    )
    const summary = screen.getByTestId('cc-freshness-marker-summary')
    expect(summary).toHaveProperty('ariaExpanded', 'false')
    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.queryByTestId('cc-freshness-expansion')).toBeNull()

    await user.click(summary)
    expect(summary).toHaveProperty('ariaExpanded', 'true')
    expect(screen.getByRole('table')).not.toBeNull()
  })

  // FAILS IF: the expansion drops a column or stops listing a device with its
  // last-seen time. `AC-CC-121` (L35980) names the last-seen time
  // specifically, so it is asserted as its OWN cell rather than anywhere in
  // the row.
  // PLANTED: removed the `Last successful sync` `<td>` from the row.
  // RED: expected [ <td></td>, <td></td>, …(2) ] to have a length of 5 but got 4
  it('lists every device with its own last-seen cell', async () => {
    const user = userEvent.setup()
    expect(srcLine(35980)).toContain("each device's last-seen time")
    render(
      <LiveFreshnessMarker
        element="Device heartbeat and last sync"
        marker={storyboardState}
        lastInventoryRead="10:20:03"
      />,
    )
    await user.click(screen.getByTestId('cc-freshness-marker-summary'))

    const headers = screen.getAllByRole('columnheader').map((h) => h.textContent)
    expect(headers).toEqual([...CC_MARKER_DEVICE_COLUMNS])

    for (const d of storyboardState.devices) {
      const row = screen.getByTestId(`cc-freshness-device-${d.deviceId}`)
      expect(within(row).getAllByRole('cell')).toHaveLength(CC_MARKER_DEVICE_COLUMNS.length)
      expect(cellOf(d.deviceId, lastSeenCellIndex)).toBe(d.lastSeen)
    }
  })

  // FAILS IF: an unknown pending count renders as a zero — the section's named
  // lie. `AC-CC-122` (L35981), and L35945: "a zero would be read as 'nothing
  // is waiting'."
  //
  // READ AS ITS OWN CELL, NEVER OFF THE ROW. `row.textContent` welds the four
  // preceding cells onto it — `TAB-01409:11:4709:11:47Unknown while offline` —
  // and the timestamps alone break a `\b0\b` read in BOTH directions, so the
  // gate would be measuring the clock rather than the count.
  //
  // BOTH DIRECTIONS IN ONE RENDER: the digit is absent from the unknown
  // device's cell and present in the synced devices', so an implementation
  // that rendered every cell as a word would also go red.
  // PLANTED: changed `ccPendingCapturesText` to `String(pending) + ' captures
  //   pending'`, which renders 'unknown captures pending' — still no zero.
  // RED: expected 'unknown captures pending' to be 'pending captures unknown'
  // PLANTED (2): changed the `<td>` to render `{d.pendingCaptures === 'unknown'
  //   ? 0 : d.pendingCaptures}`, the exact defect the criterion names.
  // RED: expected '0' to be 'pending captures unknown' // Object.is equality
  // PLANTED (1+2): both at once. Red on (2)'s cell read, which fires first.
  it('never renders a zero for an unknown count (AC-CC-122, L35981)', async () => {
    const user = userEvent.setup()
    expect(srcLine(35981)).toContain('never reports a pending-capture count of zero')
    render(
      <LiveFreshnessMarker
        element="Device heartbeat and last sync"
        marker={storyboardState}
        lastInventoryRead="10:20:03"
      />,
    )
    await user.click(screen.getByTestId('cc-freshness-marker-summary'))

    const unknown = cellOf('TAB-014', pendingCellIndex)
    expect(unknown).toBe('pending captures unknown')
    expect(unknown).not.toMatch(/\b0\b/)
    // …and the two devices that ARE at zero say so, in the same render.
    expect(cellOf('TAB-015', pendingCellIndex)).toBe('0 captures pending')
    expect(cellOf('TAB-016', pendingCellIndex)).toMatch(/\b0\b/)
  })

  // FAILS IF: the inventory note stops naming the platform side. L35971.
  // PLANTED: deleted the `cc-freshness-inventory-note` paragraph.
  // RED: Unable to find an element by: [data-testid="cc-freshness-inventory-note"]
  it('renders the platform-side inventory note (L35971)', async () => {
    const user = userEvent.setup()
    render(
      <LiveFreshnessMarker
        element="Device heartbeat and last sync"
        marker={storyboardState}
        lastInventoryRead="10:20:03"
      />,
    )
    await user.click(screen.getByTestId('cc-freshness-marker-summary'))
    const note = screen.getByTestId('cc-freshness-inventory-note').textContent ?? ''
    expect(srcLine(35971)).toContain(note)
    expect(note).toContain('held on the platform side')
  })
})

describe('the degraded marker (AC-CC-123, L35982)', () => {
  // FAILS IF: the degraded form invents a device count, or loses the sync time
  // it genuinely still knows. L35975 is explicit that both are true at once:
  // the inventory is gone and the sync log is not.
  //
  // BOTH HALVES, AND THE SECOND IS THE ONE A CARELESS FIX BREAKS: a component
  // that rendered nothing at all would satisfy "no fabricated count" and fail
  // `AC-CC-120`, so the sync time is asserted present in the same read.
  // PLANTED: forced the expansion's branch to the device table, so the
  //   ordinary table renders with `inventoryAvailable` false.
  // RED: expected <table><thead>…(1)</thead> … to be null
  it('states unavailability and fabricates no count', async () => {
    const user = userEvent.setup()
    expect(srcLine(35982)).toContain('never renders a fabricated device count')
    render(
      <LiveFreshnessMarker
        element="Device heartbeat and last sync"
        marker={{ ...storyboardState, inventoryAvailable: false, lastSyncInScope: '09:11:47' }}
        lastInventoryRead="10:20:03"
      />,
    )
    const summary = screen.getByTestId('cc-freshness-marker-summary').textContent ?? ''
    expect(summary).toBe(
      'Device sync state unavailable · last successful sync in this scope 09:11:47',
    )
    // No count of any shape.
    expect(summary).not.toMatch(/\d+ of \d+/)
    // And the sync time survives, because the sync log did.
    expect(summary).toContain('09:11:47')

    await user.click(screen.getByTestId('cc-freshness-marker-summary'))
    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.getByTestId('cc-freshness-expansion-unavailable').textContent).toContain(
      'device list cannot be shown',
    )
  })
})
