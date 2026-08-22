import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { CC_FROZEN_CONTROL_REASON } from '@/surfaces/cc/fallback/session'
import {
  FeedbackAffordances,
  FeedbackSignalCapture,
} from '@/surfaces/cc/modules/cc-07/FeedbackSignalCapture'
import {
  CC07_COLUMNS,
  CC07_MATRIX,
  CC07_MODULE,
  CC07_OUTSIDE_WRITE_ROWS,
  CC07_ROW_LEARNING_READ_VIEW,
  cc07Cell,
  cc07Row,
} from '@/surfaces/cc/modules/cc-07/matrix'
import { CC07_DIVERGENCES, CC07_GAPS } from '@/surfaces/cc/modules/cc-07/readings'

/**
 * `MOD-CC-07` AS A RENDERING.
 *
 * The unit suite next door asks whether the transcription matches the frozen
 * source. This one asks what a client actually SEES, because on this module
 * the two answers come apart twice: the two writes `DEC-CCWRITE-001` places
 * outside the counted ten are the only controls this module draws, and they
 * must draw differently in a live session and a frozen one; and row 6 grants
 * the Supervisor a read of a screen whose register row admits one role, so the
 * screen must show both statements rather than either.
 *
 * ── THREE BEATEN-GATE SHAPES ARE ACTIVE HERE ─────────────────────────────
 *
 *  - `textContent` WELDS ADJACENT ELEMENTS, so a check that the disabled
 *    control carries its reason passes when the note beside it carries the
 *    same words. Every disabled reason below is resolved through
 *    `aria-describedby` off the control itself, and `reason.hidden === false`
 *    is asserted too, because a `hidden` attribute defeats the same read.
 *  - A NAME-KEYED CELL LOOKUP IS BLIND TO COLUMN ORDER. Reversing the body's
 *    columns leaves every `data-testid` sitting on its own value and a
 *    name-keyed gate green, with every cell under the wrong heading. The order
 *    is therefore asserted POSITIONALLY as well, on purpose — header-keying
 *    protects the transcription and does not protect the render.
 *  - A CHECK TRUE OF BOTH A DEFECT AND ITS FIX. Both session states render on
 *    the same page, so a gate asserting "the control is disabled" would be
 *    satisfied by a panel that disabled both. Each state is asserted inside its
 *    own container and the live one is asserted ENABLED.
 */

afterEach(cleanup)

const RENDER = () => render(<FeedbackSignalCapture />)

/** A disabled control's reason, resolved off the control rather than welded. */
function reasonOf(control: HTMLElement): HTMLElement {
  const id = control.getAttribute('aria-describedby')
  expect(id, 'a disabled control with no aria-describedby states no reason').toBeTruthy()
  const reason = document.getElementById(id as string)
  expect(reason).not.toBeNull()
  expect((reason as HTMLElement).hidden).toBe(false)
  return reason as HTMLElement
}

describe('the seven rows render, header-keyed and whole', () => {
  // FAILS IF: a row or a cell stops rendering. Thirty-five cells asserted by
  // row ordinal and column NAME, so a value drifting from the model cannot
  // pass. This gate is deliberately blind to column order; the next one is not.
  // PLANTED: the body `<td>` rendering `row.cells[c].token` instead of
  // `row.cells[c].text` — every note dropped, including the two that name this
  // module's own screen and the one saying the gating prohibition binds every
  // role.
  // RED: row 1 · Supervisor: expected 'Explicitly prohibited' to be
  //      'Explicitly prohibited — no gate decis…' // Object.is equality
  it('renders every cell of every row under its own column', () => {
    RENDER()
    expect(within(screen.getByTestId('cc-07-matrix')).getAllByRole('row')).toHaveLength(
      CC07_MATRIX.length + 1,
    )
    for (const row of CC07_MATRIX) {
      for (const column of CC07_COLUMNS) {
        expect(
          screen.getByTestId(`cc-07-cell-${row.ordinal}-${column}`).textContent,
          `row ${row.ordinal} · ${column}`,
        ).toBe(row.cells[column].text)
      }
    }
  })

  // FAILS IF: the body's columns are reordered against the header's. A
  // name-keyed lookup cannot see this — every testid would still sit on its own
  // value, under the wrong heading. Asserted positionally, against the header
  // cells the table actually renders.
  // PLANTED: `CC07_COLUMNS.map` in the body -> `[...CC07_COLUMNS].reverse().map`,
  // for the body cells only. The name-keyed gate above STAYED GREEN on it,
  // exactly as slice 8 recorded it would; this one reds.
  // RED: expected [ 'Explicitly prohibited', …(4) ] to deeply equal
  //      [ 'Explicitly prohibited', …(4) ]
  it('the rendered column order is the header’s order, positionally', () => {
    RENDER()
    const table = screen.getByTestId('cc-07-matrix')
    const headers = within(table)
      .getAllByRole('columnheader')
      .map((h) => h.textContent)
    expect(headers).toEqual(['Capability on this module', ...CC07_COLUMNS, 'Source'])
    for (const row of CC07_MATRIX) {
      const tr = screen.getByTestId(`cc-07-row-${row.ordinal}`)
      const bodyCells = within(tr)
        .getAllByRole('cell')
        .map((c) => c.textContent)
      // The last cell is the source ref; the five before it are the personas.
      expect(bodyCells.slice(0, CC07_COLUMNS.length)).toEqual(
        CC07_COLUMNS.map((c) => row.cells[c].text),
      )
      expect(bodyCells[bodyCells.length - 1]).toBe(row.sourceRef)
    }
  })
})

describe('the two writes outside the ten, live and frozen', () => {
  // FAILS IF: the live control is not actionable. A panel that disabled both
  // states would satisfy any gate keyed on the frozen one alone, and the whole
  // point of L37497 is that this control never blocks and is never gating.
  // PLANTED: `gateReason={frozen ? CC_FROZEN_CONTROL_REASON : null}` ->
  // `gateReason={CC_FROZEN_CONTROL_REASON}` — both states disabled.
  // RED: expected 'true' to be null
  it('the live control is enabled and carries no disabled reason', () => {
    RENDER()
    const live = screen.getByTestId('cc-07-controls-live')
    for (const ordinal of CC07_OUTSIDE_WRITE_ROWS) {
      const control = within(within(live).getByTestId(`cc-07-write-${ordinal}`)).getByRole('button')
      // `Button` marks its inert state with `aria-disabled`, not the `disabled`
      // attribute, so that is what is read — a `.disabled` check here is
      // always false and would pass on both states.
      expect(control.getAttribute('aria-disabled')).toBeNull()
      expect(control.getAttribute('aria-describedby')).toBeNull()
      expect(control.textContent).toBe(cc07Row(ordinal).capability)
    }
  })

  // FAILS IF: the frozen control stops being disabled, or stops saying WHY.
  // The reason is resolved through `aria-describedby` off the control, never
  // off `textContent`, which welds the row's own label to it — and the label
  // above each control is the capability, so a welded read would pass on the
  // label alone.
  // PLANTED: `frozen ? CC_FROZEN_CONTROL_REASON : null` -> `frozen ? '' : null`.
  // An empty string still disables the control and still wires an
  // `aria-describedby`, so the control LOOKS right and states nothing — a
  // stricter plant than removing the reason outright, and the exact defect a
  // `textContent` read would miss.
  // RED: expected '' to be 'Disabled: this screen is not current' //
  //      Object.is equality
  it('the frozen control is disabled and states the frozen session as its reason', () => {
    RENDER()
    const frozen = screen.getByTestId('cc-07-controls-frozen')
    for (const ordinal of CC07_OUTSIDE_WRITE_ROWS) {
      const control = within(within(frozen).getByTestId(`cc-07-write-${ordinal}`)).getByRole(
        'button',
      )
      expect(control.getAttribute('aria-disabled')).toBe('true')
      expect(reasonOf(control).textContent).toBe(CC_FROZEN_CONTROL_REASON)
    }
  })

  // FAILS IF: the affordances stop saying whose screen they are on. They mount
  // inside four other modules' screens as well as this one, and a mount that
  // does not name its host is how a mention count moves without a reader
  // knowing which screen moved it.
  it('the affordances name the screen they are mounted on and their session state', () => {
    render(<FeedbackAffordances mountedOn="MOD-CC-12" frozen={false} />)
    const el = screen.getByTestId('cc-07-affordances')
    expect(el.getAttribute('data-mounted-on')).toBe('MOD-CC-12')
    expect(el.getAttribute('data-frozen')).toBe('false')
    expect(within(el).getByTestId(`cc-07-write-${CC07_OUTSIDE_WRITE_ROWS[0]}`)).not.toBeNull()
  })
})

describe('row 6 and the register row are both on screen', () => {
  // FAILS IF: either half of the SCR-CC-13 roles divergence stops rendering.
  // The whole finding is that a Supervisor holds a read of a screen the
  // register admits one role to, and a screen showing only one of the two
  // statements has adjudicated it silently.
  // PLANTED: deleted the `{CC07_SCREEN.rolesColumn}` fragment from the row-6
  // paragraph, leaving the matrix cells rendering.
  // RED: expected '…the register row for SCR-CC-13 names one role…' to contain
  //      'Quality Manager (L48398)'
  it('renders the Supervisor’s read-only cell and the register’s roles column together', () => {
    RENDER()
    const p = screen.getByTestId('cc-07-read-view-row')
    const text = p.textContent ?? ''
    expect(text).toContain(cc07Cell(CC07_ROW_LEARNING_READ_VIEW, 'Supervisor').text)
    expect(text).toContain(cc07Cell(CC07_ROW_LEARNING_READ_VIEW, 'Quality Manager').text)
    expect(text).toContain('Quality Manager')
    expect(text).toContain('L48398')
  })
})

describe('the divergences and the gaps render whole, with both readings each', () => {
  // FAILS IF: a divergence stops rendering, or renders with fewer than both
  // readings. A record with one reading on screen has chosen the other.
  // PLANTED: `d.readings.map` -> `d.readings.slice(0, 1).map`.
  // RED: tenant-admin-read-only-or-prohibited reading: expected 'The Tenant
  //      Admin on this module · Ten…' to contain 'Explicitly prohibited on
  //      every capabi…'
  it('every divergence renders both readings, its question and every statement', () => {
    RENDER()
    for (const d of CC07_DIVERGENCES) {
      const li = screen.getByTestId(`cc-07-divergence-${d.id}`)
      const text = li.textContent ?? ''
      expect(text).toContain(d.question)
      let rendered = 0
      for (const r of d.readings) {
        expect(text, `${d.id} reading`).toContain(r.text)
        expect(text, `${d.id} locator`).toContain(r.locator)
        rendered += 1
      }
      expect(rendered).toBe(2)
      for (const s of d.statements) expect(text, `${d.id} L${s.line}`).toContain(`L${s.line}`)
    }
  })

  // FAILS IF: a gap stops rendering. The two gaps are criteria asserted
  // against nothing on this module, and an unrendered gap is a gap nobody
  // reviews.
  it('both gaps render what binds, what is absent, and why it is not repaired', () => {
    RENDER()
    for (const g of CC07_GAPS) {
      const text = screen.getByTestId(`cc-07-gap-${g.id}`).textContent ?? ''
      expect(text).toContain(g.binds)
      expect(text).toContain(g.absence)
      expect(text).toContain(g.notRepaired)
    }
  })
})

describe('what this panel does NOT draw', () => {
  // FAILS IF: this panel draws a control for row 7. The act it forbids is not
  // one a person performs — it binds the other twelve modules — and a control
  // offered to a person there would be a misreading rendered.
  // PLANTED: `<FeedbackAffordances … frozen={false} />` drawn twice in the live
  // block — the shape a second mount of the same panel takes.
  // RED: expected [ <button …(2)></button>, …(5) ] to have a length of 4 but
  //      got 6 (and the live-control gate red beside it: Found multiple
  //      elements by: [data-testid="cc-07-write-2"])
  it('draws exactly four controls: two writes in two session states', () => {
    RENDER()
    expect(screen.getAllByRole('button')).toHaveLength(4)
    expect(screen.getByTestId('cc-07-optionality').textContent).toContain(
      cc07Row(7).cells['Tenant Admin'].text,
    )
  })

  // FAILS IF: this panel starts drawing the ten operational actions. L38793
  // does not name this module among the seven whose screens exercise them, and
  // the panel says so where a reader will meet it rather than only in a
  // comment.
  it('states that it exercises none of the ten, and mounts no rail', () => {
    RENDER()
    const text = screen.getByTestId('cc-07-no-action-rail').textContent ?? ''
    expect(text).toContain('L38793')
    expect(text).toContain('actionRail')
    expect(screen.queryByTestId('cc-13-action-rail')).toBeNull()
  })

  // FAILS IF: the panel stops naming its own module id in the DOM. A module
  // demonstrated by its slug claim alone never says what it is.
  it('the panel carries its own module id as data', () => {
    RENDER()
    expect(screen.getByTestId('cc-07-panel').getAttribute('data-module')).toBe(CC07_MODULE.id)
    expect(screen.getByTestId('cc-07-identity').textContent).toContain(CC07_MODULE.sourceRef)
  })
})
