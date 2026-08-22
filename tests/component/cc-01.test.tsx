import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { LiveShiftBoard } from '@/surfaces/cc/modules/cc-01/LiveShiftBoard'
import { BoardSyncChrome } from '@/surfaces/cc/modules/cc-01/BoardSyncChrome'
import {
  CC01_BOARD_ELEMENTS,
  CC01_INFORMATION_CONTRACT,
  CC01_LANDING_ROLE,
  CC01_STORYBOARD_DEVICES,
} from '@/surfaces/cc/modules/cc-01/board'
import { CC01_MATRIX, CC01_ROLE_COLUMNS } from '@/surfaces/cc/modules/cc-01/matrix'

/**
 * `SCR-CC-02` AS A RENDERING.
 *
 * The unit suite next door asks whether the transcription matches the frozen
 * source. This one asks whether what the source says REACHES THE SCREEN,
 * because a rule held in data and never drawn is a code comment, and a code
 * comment is not an honest element. Slice 8's own finding: a component that
 * compiles, passes its unit suite and is imported by nothing is not shipped.
 *
 * FOUR BEATEN-GATE SHAPES ARE LIVE IN THIS FILE AND ARE PINNED BY
 * CONSTRUCTION:
 *
 *  - A `textContent` SWEEP BEATEN BY ELEMENT CONCATENATION. Every assertion
 *    that cares about a specific string reads the ELEMENT carrying it, found
 *    by test id, never a parent's concatenated text.
 *  - THE SAME SWEEP BEATEN BY A `hidden` ATTRIBUTE, because `getByTestId`
 *    finds hidden elements and `textContent` reads them. `hiddenWithin`
 *    walks the whole rendered subtree.
 *  - `Allowed` IS A PREFIX OF `Allowed with conditions`. The cell gate uses
 *    `toBe` on the element's own text, never `toContain`.
 *  - AN ALLOWANCE TAKING ITS ALLOWED STRING FROM THE VALUE UNDER TEST. The
 *    never-zero gate asserts the ABSENCE of a zero in the device row as well
 *    as the presence of the unknown wording, so a renderer printing both
 *    would still fail.
 */

const SOURCE = readFileSync(
  join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md'),
  'utf8',
).split('\n')

function srcLine(n: number): string {
  const l = SOURCE[n - 1]
  if (l === undefined) throw new Error(`the frozen source has no line ${n}`)
  return l
}

afterEach(cleanup)

/** Every element in a subtree that a reader could not see. */
function hiddenWithin(root: HTMLElement): string[] {
  const out: string[] = []
  for (const el of Array.from(root.querySelectorAll('*'))) {
    if (el.hasAttribute('hidden') || el.getAttribute('aria-hidden') === 'true') {
      out.push(el.tagName.toLowerCase())
    }
  }
  return out
}

const board = () => render(<LiveShiftBoard viewerRole={CC01_LANDING_ROLE} />)

describe('SCR-CC-02 — the board names its own module and its four-part contract', () => {
  it('carries MOD-CC-01 as a rendered identifier, not only as a slug claim', () => {
    board()
    // FAILS IF: the module id paragraph is removed from the board. Planted;
    // red; reversed. A route claimed by a slug is demonstrated by the claim
    // alone and can ship without ever saying what it is.
    expect(screen.getByTestId('cc01-module-id').textContent).toContain('MOD-CC-01')
    expect(screen.getByTestId('cc01-board').getAttribute('data-module-id')).toBe('MOD-CC-01')
  })

  it('renders all four parts of the contract, each in the region it names', () => {
    const { container } = board()
    for (const part of CC01_INFORMATION_CONTRACT) {
      expect(screen.getByTestId(`cc01-contract-part-${part.part}`).textContent).toContain(
        part.obligation,
      )
      // `renderedBy` is not decoration: the region it names must exist.
      // FAILS IF: the sync-state region is dropped, which is part three —
      // the one L36233 says is most often dropped. Planted; red; reversed.
      expect(screen.getByTestId(part.renderedBy)).toBeTruthy()
    }
    expect(hiddenWithin(container)).toHaveLength(0)
  })
})

describe('SCR-CC-02 — the marker reaches the screen, with its devices behind it', () => {
  it('mounts §21.3.2’s marker against the per-device element, not a scope timestamp', () => {
    board()
    const marker = screen.getByTestId('cc-freshness-marker')
    expect(marker.getAttribute('data-marker-form')).toBe('partially-synced')
    // The class line carries the element, its class cell and its obligation.
    // FAILS IF: CC01_MARKER_ELEMENT is pointed at `Cell and line status`,
    // whose obligation is `As-of time`. Planted; red; reversed.
    expect(screen.getByTestId('cc-freshness-class').textContent).toContain(
      'Per-device last-seen time',
    )
    expect(screen.getByTestId('cc01-per-device').textContent).toContain(
      'Device heartbeat and last sync',
    )
  })

  it('expands to the three storyboard devices with their last-seen times', async () => {
    const user = userEvent.setup()
    board()
    // Collapsed: the expansion is not mounted at all rather than hidden.
    expect(screen.queryByTestId('cc-freshness-expansion')).toBeNull()
    await user.click(screen.getByTestId('cc-freshness-marker-summary'))
    const expansion = screen.getByTestId('cc-freshness-expansion')
    for (const d of CC01_STORYBOARD_DEVICES) {
      const row = within(expansion).getByTestId(`cc-freshness-device-${d.deviceId}`)
      expect(row.textContent).toContain(d.lastSeen)
    }
    expect(within(expansion).getAllByRole('row')).toHaveLength(
      CC01_STORYBOARD_DEVICES.length + 1,
    )
  })

  it('never renders a zero for the unknown pending count', async () => {
    const user = userEvent.setup()
    board()
    await user.click(screen.getByTestId('cc-freshness-marker-summary'))
    const dark = screen.getByTestId('cc-freshness-device-TAB-014')
    const known = screen.getByTestId('cc-freshness-device-TAB-015')
    // Both directions, because the presence of the right wording is also
    // true of a row printing "0 captures pending · pending captures unknown".
    // FAILS IF: TAB-014's pendingCaptures becomes 0. Planted; red on both
    // assertions; reversed.
    expect(dark.textContent).toContain('pending captures unknown')
    expect(dark.textContent).not.toMatch(/\b0 captures pending\b/)
    // And the known rows DO print a number, so the gate is not passing
    // because nothing ever prints one.
    expect(known.textContent).toContain('0 captures pending')
    expect(srcLine(35967)).toContain('Unknown while offline')
  })

  it('mounts MOD-CC-02’s chrome around every element, marker before value', () => {
    board()
    // FAILS IF: SyncStateChrome is dropped from the element list. Planted;
    // red; reversed. Its absence is invisible to a text sweep because the
    // element's own value still renders.
    const chromes = screen.getAllByTestId('cc02-chrome')
    expect(chromes).toHaveLength(CC01_BOARD_ELEMENTS.length)
    for (const c of chromes) {
      const marker = within(c).getByTestId('cc02-marker-partially-synced')
      // L36475 — the marker renders BEFORE the element's value renders.
      expect(c.firstElementChild).toBe(marker)
    }
  })
})

describe('SCR-CC-02 — the quiet band can never claim more than the devices allow', () => {
  it('states the count and takes its sync half from the marker', () => {
    board()
    const band = screen.getByTestId('cc01-quiet-band-text')
    expect(band.textContent).toBe(
      '5 cells normal · Synced 09:11 · 1 of 3 devices offline · pending captures unknown',
    )
    // FAILS IF: the band is given a literal `all synced`. Planted; red; the
    // storyboard's own words are "5 cells normal · all synced", and printing
    // them beside a dark tablet is the one sentence this board must not
    // render. Reversed.
    expect(band.textContent).not.toContain('all synced')
  })

  it('renders three attention tiles and no tile for a quiet cell', () => {
    board()
    const attention = screen.getByTestId('cc01-attention')
    expect(within(attention).getAllByRole('listitem')).toHaveLength(3)
    expect(screen.queryByTestId('cc01-tile-quiet-1')).toBeNull()
  })
})

describe('SCR-CC-02 — the matrix on screen, header-keyed', () => {
  it('draws every cell as its whole clause', () => {
    board()
    for (const row of CC01_MATRIX) {
      for (const col of CC01_ROLE_COLUMNS) {
        // `toBe`, never `toContain`: `Allowed` is a prefix of `Allowed with
        // conditions` and a containment read passes on the shorter token.
        expect(screen.getByTestId(`cc01-cell-${row.id}-${col}`).textContent).toBe(
          row.cells[col].verbatim,
        )
      }
    }
  })

  it('renders the pace prohibition as a statement about another surface, with no control', () => {
    board()
    expect(screen.getByTestId('cc01-pace-worker-cell').textContent).toBe(
      'Explicitly prohibited — never worker-facing',
    )
    const enforced = screen.getByTestId('cc01-pace-enforced-by')
    expect(enforced.textContent).toContain('AC-CC-165')
    expect(enforced.textContent).toContain('Frontline Worker Application')
    // FAILS IF: a disabled `pace` control is added to that section. Planted
    // as a `<button disabled>`; red; reversed. A control here would assert
    // that this surface is where the rule lives.
    const section = screen.getByTestId('cc01-pace-containment')
    expect(within(section).queryAllByRole('button')).toHaveLength(0)
    expect(within(section).queryAllByRole('checkbox')).toHaveLength(0)
  })
})

describe('SCR-CC-02 — the prohibited cell that names a place gets a link, not an absence', () => {
  it('renders the shared cross-surface link-out for the board-ranking row', () => {
    board()
    const link = screen.getByTestId('cc-cross-surface-link')
    expect(link.getAttribute('data-cell-id')).toBe('cc-01-board-ranking')
    expect(within(link).getByTestId('cc-cross-surface-link-note').textContent).not.toBe('')
    // FAILS IF: the CrossSurfaceLink is removed and the cell left to
    // WriteControl, which draws `explicitlyProhibited` as nothing at all.
    // Planted; red; reversed — the empty cell is exactly what AC-CC-301
    // forbids and is invisible to every text assertion.
    expect(link.getAttribute('data-link-state')).not.toBeNull()
  })
})

describe('SCR-CC-02 — the Tenant Admin contradiction is on screen, unresolved', () => {
  it('renders both readings with their own locators and picks neither', () => {
    board()
    const section = screen.getByTestId('cc01-tenant-admin-contest')
    const readings = within(section).getAllByRole('listitem')
    expect(readings).toHaveLength(2)
    expect(readings[0]?.textContent).toContain('L35004')
    expect(readings[1]?.textContent).toContain('L36265')
    expect(readings[1]?.textContent).toContain('L36268')
    // FAILS IF: one reading is dropped. Planted; red; reversed.
    expect(section.textContent).not.toMatch(/we adopt|the answer is|reading A wins/i)
  })
})

describe('SCR-CC-02 — the chrome slot, and the banner that is withheld', () => {
  it('draws no site-wide banner and says why in its place', () => {
    const { container } = render(<BoardSyncChrome />)
    // FAILS IF: CC01_SITE_ELAPSED_MINUTES is set to 70 — the storyboard's own
    // device-outage duration read as a site outage. Planted; red on the first
    // assertion; reversed. That number belongs to one tablet, not a site.
    expect(screen.queryByTestId('cc02-connectivity-banner')).toBeNull()
    const note = screen.getByTestId('cc01-banner-withheld')
    expect(note.textContent).toContain('withheld rather than guessed')
    expect(note.textContent).toContain('60')
    expect(hiddenWithin(container)).toHaveLength(0)
  })
})

describe('SCR-CC-02 — run completion is three states and never collapsed', () => {
  it('renders all three through MOD-CC-02’s own component', () => {
    board()
    const region = screen.getByTestId('cc01-run-states')
    // Asked of the STATE elements rather than of the region, so the gate
    // cannot be satisfied or broken by surrounding prose. A sweep over the
    // region read this file's own heading and went red on it, which is the
    // `textContent` welding shape arriving from the other side.
    for (const state of ['submitted', 'complete', 'finished']) {
      const el = within(region).getByTestId(`cc02-run-state-${state}`)
      expect(el.textContent).toContain(state)
      // The word rule 6 exists to forbid. L36446 states it.
      expect(el.textContent).not.toMatch(/\bdone\b/)
    }
    expect(srcLine(36446)).toContain('never collapsed')
  })

  it('offers no manual-close link, because that link belongs to the drill', () => {
    board()
    // FAILS IF: ManualCloseLink is mounted on the board. Planted; red;
    // reversed. L36459's own cell reads "reached by a link from the drill",
    // and the drill is SCR-CC-04's.
    expect(screen.queryByTestId('cc02-manual-close-link')).toBeNull()
  })
})

describe('SCR-CC-02 — fallbacks and the session-offline statement', () => {
  it('names the four its own card names and states why no control is closed', () => {
    board()
    for (const id of ['FB-CC-STALE', 'FB-CC-PUSH', 'FB-CC-SESS', 'FB-CC-AGENT']) {
      expect(screen.getByTestId(`cc01-fallback-${id}`)).toBeTruthy()
    }
    for (const id of ['FB-CC-WRITE', 'FB-CC-CMD', 'FB-CC-AUTH', 'FB-CC-REPORT', 'FB-CC-QUEUE']) {
      expect(screen.queryByTestId(`cc01-fallback-${id}`)).toBeNull()
    }
    const said = screen.getByTestId('cc01-session-offline')
    expect(said.textContent).toContain('the board writes nothing in any case')
    expect(said.textContent).toContain('read-only by construction')
  })

  it('draws no decision control at all, so there is none for a freeze to disable', () => {
    const { container } = board()
    // The board writes nothing. Any button here other than the marker's own
    // expansion toggle would be a write affordance on a read-only module.
    const buttons = Array.from(container.querySelectorAll('button'))
    expect(buttons.map((b) => b.getAttribute('data-testid'))).toEqual([
      'cc-freshness-marker-summary',
    ])
  })
})
