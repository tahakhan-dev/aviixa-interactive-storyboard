import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { DrillDown } from '@/surfaces/cc/modules/cc-03/DrillDown'
import {
  CC03_CELL_SCREEN,
  CC03_CELL_SLUG,
  CC03_COLUMNS,
  CC03_FEATURES,
  CC03_MATRIX,
  CC03_ROW_HELD_ELSEWHERE,
  CC03_RUN_SCREEN,
  CC03_RUN_SLUG,
  cc03Cell,
} from '@/surfaces/cc/modules/cc-03/matrix'
import { CC03_DIVERGENCES, CC03_TACC_DISCLOSURE } from '@/surfaces/cc/modules/cc-03/readings'

/**
 * `MOD-CC-03` AS A RENDERING, ON BOTH OF ITS SCREENS.
 *
 * The unit suite next door asks whether the transcription matches the frozen
 * source. This one asks what a client actually SEES, because on this module
 * the two answers come apart three times: one component serves two register
 * rows and must render them DIFFERENTLY; row 7's link is the affordance
 * `AC-CC-204` requires and the shared link-out component cannot draw it; and
 * action 8 must be reachable from a screen whose matrix never mentions it.
 *
 * ── BEATEN-GATE SHAPES ACTIVE HERE ───────────────────────────────────────
 *
 *  - A NAME-KEYED CELL LOOKUP BLIND TO COLUMN ORDER. Reversing the body's
 *    columns leaves every `data-testid` on its own value and a name-keyed
 *    gate green, with every cell under the wrong heading — the exact silent
 *    inversion this matrix's Tenant-Admin-first order is dangerous for. The
 *    order is therefore asserted POSITIONALLY as well, and the plant campaign
 *    confirmed the name-keyed gate stays green under it.
 *  - `textContent` WELDS ADJACENT ELEMENTS. The two-screen difference is read
 *    off `data-` attributes and off the presence or absence of a testid,
 *    never off a substring of the whole panel.
 *  - `Allowed` IS A PREFIX OF `Allowed with conditions`. Cell assertions are
 *    exact equality against the model's own cell text, which the unit suite
 *    independently pins to the source line.
 */

afterEach(cleanup)

const BUILT = [CC03_CELL_SLUG, CC03_RUN_SLUG, 'live-shift-board']

const renderRun = () =>
  render(<DrillDown screen={CC03_RUN_SCREEN} viewerRole="SUPERVISOR" builtSlugs={BUILT} />)
const renderCell = () =>
  render(<DrillDown screen={CC03_CELL_SCREEN} viewerRole="SUPERVISOR" builtSlugs={BUILT} />)

describe('the eight rows render, header-keyed and whole, on both screens', () => {
  // FAILS IF: a row or a cell stops rendering. Forty cells asserted by row
  // ordinal and column NAME, so a value drifting from the model cannot pass.
  // PLANTED: changed `CC03_COLUMNS.map` in `DrillDown.tsx` to
  // `[...CC03_COLUMNS].reverse().map` for the body cells only.
  // STAYED GREEN — which is why the positional gate below exists.
  it.each([
    ['run', renderRun],
    ['cell', renderCell],
  ])('renders every cell of every row under its own column (%s view)', (_name, doRender) => {
    doRender()
    expect(within(screen.getByTestId('cc-03-matrix')).getAllByRole('row')).toHaveLength(
      CC03_MATRIX.length + 1,
    )
    for (const row of CC03_MATRIX) {
      for (const column of CC03_COLUMNS) {
        expect(
          screen.getByTestId(`cc-03-cell-${row.ordinal}-${column}`).textContent,
          `row ${row.ordinal} · ${column}`,
        ).toBe(row.cells[column].text)
      }
    }
  })

  // FAILS IF: the body cells are drawn in an order the header row does not
  // carry. This is the check the name-keyed one CANNOT make.
  // PLANTED: `[...CC03_COLUMNS].reverse().map` for the body cells only.
  // RED: expected [ 'Worker', 'Read-only Auditor', …(3) ] to deeply equal
  //      [ 'Tenant Admin', 'Supervisor', …(3) ]
  it('draws the body cells in the header’s own order, not only under its own names', () => {
    renderRun()
    const header = within(screen.getByTestId('cc-03-matrix'))
      .getAllByRole('columnheader')
      .map((th) => th.textContent)
    expect(header).toEqual(['Capability on this module', ...CC03_COLUMNS, 'Source'])
    for (const row of CC03_MATRIX) {
      const drawn = [...screen.getByTestId(`cc-03-row-${row.ordinal}`).querySelectorAll('td')]
        .map((td) => td.getAttribute('data-testid'))
        .filter((id): id is string => id !== null)
        .map((id) => id.replace(`cc-03-cell-${row.ordinal}-`, ''))
      expect(drawn, `row ${row.ordinal}`).toEqual([...CC03_COLUMNS])
    }
  })
})

describe('two screens, one component, and the difference is the register’s own cell', () => {
  // FAILS IF: the two screens render identically, which would make the second
  // route a duplicate of the first rather than the screen the register
  // carries. The feature flags are read off `data-shown`, not off prose.
  // PLANTED: changed `cc03ScreenFeatures` in matrix.ts to return SCR-CC-04's
  // entry for both screens. THREE reds in this suite.
  // RED: expected [ 'yes', 'yes', 'yes' ] to deeply equal [ 'yes', 'no', 'no' ]
  it('the cell view marks one feature shown and the run view marks three', () => {
    renderCell()
    const cellFlags = CC03_FEATURES.map((f) =>
      screen.getByTestId(`cc-03-feature-${f.id}`).getAttribute('data-shown'),
    )
    expect(cellFlags).toEqual(['yes', 'no', 'no'])
    cleanup()

    renderRun()
    const runFlags = CC03_FEATURES.map((f) =>
      screen.getByTestId(`cc-03-feature-${f.id}`).getAttribute('data-shown'),
    )
    expect(runFlags).toEqual(['yes', 'yes', 'yes'])
  })

  // FAILS IF: the panel does not say which screen it is. The registry
  // generator awards the cell view's unclaimed route by argmax over the
  // module ids its files name, so the rendered identity is not decoration.
  it('each render states its own screen and the module', () => {
    renderCell()
    expect(screen.getByTestId('cc-03-drill').getAttribute('data-screen')).toBe('SCR-CC-03')
    expect(screen.getByTestId('cc-03-drill').getAttribute('data-module')).toBe('MOD-CC-03')
    expect(screen.getByTestId('cc-03-identity').textContent).toContain('MOD-CC-03 FEAT-CC-0301')
    cleanup()

    renderRun()
    expect(screen.getByTestId('cc-03-drill').getAttribute('data-screen')).toBe('SCR-CC-04')
    expect(screen.getByTestId('cc-03-identity').textContent).toContain('MOD-CC-03 all features')
  })

  // FAILS IF: the chain stops being walkable, or a link is offered for a
  // route that is not built — slice 4's defect shape 5, a screen pointing at
  // content that is not there.
  // PLANTED: removed the `built &&` guard from the chain's link branch, so a
  // route with no directory would still be offered as a link — slice 4's
  // defect shape 5.
  // RED: expected [ <a …(2)></a>, <a …(2)></a> ] to have a length of +0 but got 2
  it('the chain is three levels and links only to built routes other than this one', () => {
    renderRun()
    const chain = screen.getByTestId('cc-03-chain')
    expect(within(chain).getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByTestId('cc-03-chain-3').getAttribute('data-current')).toBe('yes')
    expect(screen.getByTestId('cc-03-chain-2').getAttribute('data-current')).toBe('no')
    // The current level offers no link to itself; the other two do.
    expect(within(screen.getByTestId('cc-03-chain-3')).queryAllByRole('link')).toHaveLength(0)
    expect(within(screen.getByTestId('cc-03-chain-2')).getAllByRole('link')).toHaveLength(1)
    cleanup()

    render(<DrillDown screen={CC03_RUN_SCREEN} viewerRole="SUPERVISOR" builtSlugs={[]} />)
    expect(within(screen.getByTestId('cc-03-chain')).queryAllByRole('link')).toHaveLength(0)
    expect(screen.getByTestId('cc-03-chain-1').textContent).toContain('not built yet')
  })
})

describe('row 7 draws a LINK on the screen that shows its feature, and a statement on the other', () => {
  // FAILS IF: the history boundary stops offering the link `AC-CC-204`
  // requires. A faithful rendering of the cell's `Read-only` token through
  // any control component draws a disabled control or nothing; neither is
  // what the row asks for, and the shared `CrossSurfaceLink` cannot take this
  // cell at all.
  // PLANTED: deleted the `<Link>` from the history block in `DrillDown.tsx`.
  // RED: Unable to find an element by: [data-testid="cc-03-history-anchor"]
  it('the run view renders a real anchor into the Hub', () => {
    renderRun()
    const block = screen.getByTestId('cc-03-history-link')
    expect(block.getAttribute('data-link-state')).toBe('link')
    const anchor = within(block).getByTestId('cc-03-history-anchor')
    expect(anchor.getAttribute('href')).toBe('/hub')
    expect(block.textContent).toContain('L36660')
    expect(screen.getByTestId('cc-03-link-register-gap').textContent).toContain('CcLinkOutToken')
  })

  // FAILS IF: the cell view renders the history affordance its register row
  // does not show, or renders nothing at all where it should say why. The
  // register cell for SCR-CC-03 is `MOD-CC-03 FEAT-CC-0301`, and the history
  // boundary is FEAT-CC-0303.
  // PLANTED: replaced the feature guard with `true` so the link rendered on
  // both screens.
  // RED: expected [ <div role="note" …(3)>…(4)</div> ] to have a length of +0
  //      but got 1
  it('the cell view renders no anchor and says where the link is', () => {
    renderCell()
    expect(screen.queryAllByTestId('cc-03-history-link')).toHaveLength(0)
    expect(screen.queryAllByTestId('cc-03-history-anchor')).toHaveLength(0)
    const note = screen.getByTestId('cc-03-history-not-here')
    expect(note.textContent).toContain('FEAT-CC-0303')
    expect(note.textContent).toContain('SCR-CC-04')
    // The matrix row itself still renders, because the matrix is the
    // module's and not the screen's.
    expect(
      screen.getByTestId(`cc-03-cell-${CC03_ROW_HELD_ELSEWHERE}-Supervisor`).textContent,
    ).toBe(cc03Cell(CC03_ROW_HELD_ELSEWHERE, 'Supervisor').text)
  })

  // FAILS IF: the pointer is asserted rather than checked. A role that does
  // not open the Hub must meet a statement, never a dead link.
  // PLANTED: replaced `viewerOpensHub` with `true` in `DrillDown.tsx`.
  // RED: expected 'link' to be 'statement' // Object.is equality
  it('a role that does not open the Hub gets a statement and no anchor', () => {
    render(<DrillDown screen={CC03_RUN_SCREEN} viewerRole="WORKER" builtSlugs={BUILT} />)
    const block = screen.getByTestId('cc-03-history-link')
    expect(block.getAttribute('data-link-state')).toBe('statement')
    expect(within(block).queryAllByTestId('cc-03-history-anchor')).toHaveLength(0)
    expect(block.textContent).toContain('does not open')
  })
})

describe('action 8 is stated on both screens and no ninth row appears', () => {
  // FAILS IF: the gap stops being disclosed, or a ninth row appears in the
  // rendered table to close it. The rendered table is what a client reads,
  // so the absence is asserted on the DOM and not only on the model.
  // PLANTED: added a ninth row `Reassign a run mid-shift` to `CC03_MATRIX`.
  // RED: expected [ 'Reassign a run mid-shift' ] to deeply equal []
  it.each([
    ['run', renderRun],
    ['cell', renderCell],
  ])('states the placement and draws no reassignment row (%s view)', (_name, doRender) => {
    doRender()
    const statement = screen.getByTestId('cc-03-action-8')
    expect(statement.textContent).toContain('no row for reassigning a run')
    for (const ref of ['L36706', 'L38793', 'L38765']) {
      expect(screen.getByTestId(`cc-03-action-8-${ref}`).textContent).toContain(ref)
    }
    expect(screen.getByTestId('cc-03-no-ninth-row').textContent).toContain('No ninth row is added')

    const rows = within(screen.getByTestId('cc-03-matrix')).getAllByRole('row')
    expect(rows).toHaveLength(CC03_MATRIX.length + 1)
    const capabilities = rows.slice(1).map((r) => r.querySelector('th')?.textContent ?? '')
    expect(capabilities.filter((c) => /reassign/i.test(c))).toEqual([])
  })
})

describe('the divergences and DEC-TACC-001 render, both readings, no winner', () => {
  // FAILS IF: a divergence renders one reading. Both are asserted per record,
  // by their own locators, so a record that dropped a reading could not pass
  // by rendering the other one twice.
  // PLANTED: changed `d.readings.map` to `d.readings.slice(0, 1).map` in
  // `DrillDown.tsx`.
  // RED: expected '…' to contain 'MTX-TEN-02c · L22060; condition [K1] · L22072'
  it('every divergence renders both of its readings with both locators', () => {
    renderRun()
    for (const d of CC03_DIVERGENCES) {
      const block = screen.getByTestId(`cc-03-divergence-${d.id}`)
      for (const r of d.readings) {
        expect(block.textContent, `${d.id} · ${r.locator}`).toContain(r.locator)
      }
      for (const s of d.statements) {
        expect(block.textContent, `${d.id} · L${s.line}`).toContain(`L${s.line}`)
      }
    }
  })

  // FAILS IF: the open decision renders as adopted, or its recommendation is
  // rendered without being labelled one.
  // PLANTED: changed `data-adopted={String(CC03_TACC_DISCLOSURE.adopted)}` to
  // a literal `"true"`.
  // RED: expected 'true' to be 'false' // Object.is equality
  it('DEC-TACC-001 renders open, with its three options and its recommendation', () => {
    renderRun()
    const block = screen.getByTestId('cc-03-tacc')
    expect(block.getAttribute('data-adopted')).toBe('false')
    for (const option of CC03_TACC_DISCLOSURE.options) {
      expect(block.textContent).toContain(option)
    }
    expect(block.textContent).toContain('A recommendation is not an adoption')
    expect(block.textContent).toContain('L23069')
  })

  // FAILS IF: either criterion this module fails is rendered as satisfied.
  it('the two unmet criteria render as unmet', () => {
    renderRun()
    expect(screen.getByTestId('cc-03-ac-090').getAttribute('data-satisfied')).toBe('false')
    expect(screen.getByTestId('cc-03-ac-203').getAttribute('data-enforced')).toBe('false')
    expect(screen.getByTestId('cc-03-ac-090').textContent).toContain('FB-CC-AGENT')
  })
})
