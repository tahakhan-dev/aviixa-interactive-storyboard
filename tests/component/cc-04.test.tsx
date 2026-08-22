import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { DeviationWorkspace } from '@/surfaces/cc/modules/cc-04/DeviationWorkspace'
import { CC04_COLUMNS, CC04_MATRIX, cc04Cell } from '@/surfaces/cc/modules/cc-04/matrix'

/**
 * `MOD-CC-04` AS A RENDERING.
 *
 * The unit suite next door asks whether the transcription matches the frozen
 * source. This one asks what a client actually SEES, because on this module
 * the two answers come apart three times: a correct transcription of row 12
 * rendered through the build's one rule draws nothing at all where the source
 * spells out a destination; a correct transcription of row 9's Supervisor
 * cell draws opposite things under two readings the source both states; and a
 * hold that has reached two of three devices must not be drawn as in force.
 *
 * ── TWO BEATEN-GATE SHAPES ARE ACTIVE HERE ───────────────────────────────
 *
 *  - `textContent` WELDS ADJACENT ELEMENTS, so a check that the disabled
 *    control carries its reason passes when the note beside it carries the
 *    same words. Every disabled reason below is resolved through
 *    `aria-describedby` off the control itself, and `reason.hidden === false`
 *    is asserted too, because a `hidden` attribute defeats the same read.
 *  - `Allowed` IS A PREFIX OF `Allowed with conditions`. Cell assertions
 *    below are exact equality against the model's own cell text, which the
 *    unit suite independently pins to the source line.
 */

afterEach(cleanup)

const RENDER = () => render(<DeviationWorkspace viewerRole="QUALITY_MANAGER" />)

/** A disabled control's reason, resolved off the control rather than welded. */
function reasonOf(control: HTMLElement): HTMLElement {
  const id = control.getAttribute('aria-describedby')
  expect(id, 'a disabled control with no aria-describedby states no reason').toBeTruthy()
  const reason = document.getElementById(id as string)
  expect(reason).not.toBeNull()
  expect((reason as HTMLElement).hidden).toBe(false)
  return reason as HTMLElement
}

describe('the twelve rows render, header-keyed and whole', () => {
  // FAILS IF: a row or a cell stops rendering. Sixty cells asserted by row
  // ordinal and column NAME, so a value drifting from the model cannot pass.
  // PLANTED: changed `CC04_COLUMNS.map` in `DeviationWorkspace.tsx` to
  // `[...CC04_COLUMNS].reverse().map` for the body cells only.
  // STAYED GREEN — and that is why the second gate below exists. Keying every
  // lookup on the column's own name makes this check immune to the ONE defect
  // the source's column order makes silent: the body cells landing under the
  // wrong headers. Name-keying is right for the value and blind to the layout,
  // so the order is asserted separately, positionally, on purpose.
  it('renders every cell of every row under its own column', () => {
    RENDER()
    expect(within(screen.getByTestId('cc-04-matrix')).getAllByRole('row')).toHaveLength(
      CC04_MATRIX.length + 1,
    )
    for (const row of CC04_MATRIX) {
      for (const column of CC04_COLUMNS) {
        expect(
          screen.getByTestId(`cc-04-cell-${row.ordinal}-${column}`).textContent,
          `row ${row.ordinal} · ${column}`,
        ).toBe(row.cells[column].text)
      }
    }
  })

  // FAILS IF: the body cells are drawn in an order the header row does not
  // carry. This is the check the name-keyed one above CANNOT make, and the
  // plant campaign proved it: reversing the body's column order left every
  // testid on its own value and the name-keyed gate green, with every cell on
  // screen sitting under the wrong heading. A reader of the rendered table
  // would then read the Worker's column as the Tenant Admin's — the exact
  // silent inversion this matrix's column order is dangerous for.
  // PLANTED: `[...CC04_COLUMNS].reverse().map` for the body cells only.
  // RED: expected [ 'Worker', 'Read-only Auditor', …(3) ] to deeply equal
  //      [ 'Tenant Admin', 'Supervisor', …(3) ]
  it('draws the body cells in the header’s own order, not only under its own names', () => {
    RENDER()
    const header = within(screen.getByTestId('cc-04-matrix'))
      .getAllByRole('columnheader')
      .map((th) => th.textContent)
    expect(header).toEqual(['Capability on this module', ...CC04_COLUMNS, 'Source'])
    for (const row of CC04_MATRIX) {
      const drawn = [...screen.getByTestId(`cc-04-row-${row.ordinal}`).querySelectorAll('td')]
        .map((td) => td.getAttribute('data-testid'))
        .filter((id): id is string => id !== null)
        .map((id) => id.replace(`cc-04-cell-${row.ordinal}-`, ''))
      expect(drawn, `row ${row.ordinal}`).toEqual([...CC04_COLUMNS])
    }
  })
})

describe('row 12 draws a LINK, and never a control and never an absence', () => {
  // FAILS IF: either of row 12's two link-bearing cells stops rendering a
  // link. Both are asserted, because the Tenant Admin cell would otherwise
  // draw nothing at all and the Quality Manager cell would draw a live
  // control — two different wrong renderings of one row.
  // PLANTED: deleted the Tenant Admin `<CrossSurfaceLink>` from
  // `DeviationWorkspace.tsx`.
  // RED: expected [ <div role="note" …(4)>…(5)</div> ] to have a length of 2
  //      but got 1
  it('renders both cells as cross-surface links with a real anchor', () => {
    RENDER()
    const links = screen.getAllByTestId('cc-cross-surface-link')
    expect(links).toHaveLength(2)
    expect(links.map((l) => l.getAttribute('data-cell-id')).sort()).toEqual([
      'cc-04-reclassify-severity-quality-manager',
      'cc-04-reclassify-severity-tenant-admin',
    ])
    for (const link of links) {
      expect(link.getAttribute('data-link-state')).toBe('link')
      const anchor = within(link).getByTestId('cc-cross-surface-link-anchor')
      expect(anchor.getAttribute('href')).toBe('/hub')
      expect(link.textContent).toContain('Reclassify severity')
      expect(link.textContent).toContain('L36845')
    }
  })

  // FAILS IF: the Quality Manager cell is drawn as a control this surface can
  // act on. The whole point of the population-B link-out is that no handler
  // exists — a disabled control would still imply a condition that could
  // become true, and this boundary does not move.
  it('offers no button inside either link-out', () => {
    RENDER()
    for (const link of screen.getAllByTestId('cc-cross-surface-link')) {
      expect(within(link).queryAllByRole('button')).toEqual([])
    }
  })
})

describe('the severity boundary is disclosed as a boundary, not a contradiction', () => {
  // FAILS IF: the pair is presented as a contradiction, or the criterion's
  // scope is dropped. Both halves must name what they govern, and the
  // criterion must be named beside the row that grants the act elsewhere.
  // PLANTED: flipped `isContradiction` to `true` in `readings.ts`.
  // RED: expected 'true' to be 'false' // Object.is equality
  it('names AC-CC-221 as governing the display and the row as governing an act elsewhere', () => {
    RENDER()
    const box = screen.getByTestId('cc-04-severity-boundary')
    expect(box.getAttribute('data-is-contradiction')).toBe('false')
    expect(box.textContent).toContain('AC-CC-221')
    expect(box.textContent).toContain('L37000')
    expect(box.textContent).toContain('L36845')
    expect(box.textContent).toContain('DISPLAYS')
    expect(box.textContent).toContain('Delivery Operations Hub anomaly record')
    expect(box.textContent).toContain('boundary, not')
  })
})

describe('the Supervisor’s “Mark evidence reviewed” cell, drawn both ways', () => {
  // FAILS IF: the two readings stop rendering differently, which is the whole
  // finding. Reading A must draw NO control at all; reading B must draw one
  // that is present and carries its reason.
  // PLANTED: changed reading A's decision in `DeviationWorkspace.tsx` from
  // `deny('explicitlyProhibited', …)` to `deny('unavailable', …)`.
  // RED: expected [ Array(1) ] to deeply equal []
  it('reading A draws nothing that could be mistaken for a control', () => {
    RENDER()
    const a = screen.getByTestId('cc-04-mark-evidence-prohibited')
    expect(within(a).queryAllByRole('button')).toEqual([])
    expect(a.textContent).toContain('Quality Manager')
    expect(a.textContent).toContain('L36842')
  })

  // FAILS IF: reading B draws an absence, or draws a control with no reason.
  // The reason is read off the control through `aria-describedby` rather than
  // off `textContent`, because `textContent` welds the sibling note to the
  // button and would pass on the note alone.
  // PLANTED: changed reading B's decision from `deny('unavailable', …)` to
  // `deny('explicitlyProhibited', …)`.
  // RED: Unable to find an accessible element with the role "button"
  it('reading B draws a present control that explains itself', () => {
    RENDER()
    const b = screen.getByTestId('cc-04-mark-evidence-unavailable')
    const control = within(b).getByRole('button')
    expect(control.textContent).toBe('Mark evidence reviewed')
    const reason = reasonOf(control)
    expect(reason.textContent).toContain('does not confer on the Supervisor')
    expect(reason.textContent).toContain('AC-CC-227')
    expect(reason.textContent).toContain('never queued')
  })

  // FAILS IF: the two renderings converge. A count of controls is true of
  // both a defect and its fix if both sides draw one, so the gate names WHICH
  // side draws it.
  it('exactly one of the two readings draws a control, and it is reading B', () => {
    RENDER()
    const a = within(screen.getByTestId('cc-04-mark-evidence-prohibited')).queryAllByRole('button')
    const b = within(screen.getByTestId('cc-04-mark-evidence-unavailable')).queryAllByRole('button')
    expect(a).toHaveLength(0)
    expect(b).toHaveLength(1)
    expect(cc04Cell(9, 'Supervisor').token).toBe('Explicitly prohibited')
  })
})

describe('the divergences carry both readings and no winner', () => {
  // FAILS IF: a reading is dropped, or one is marked. Three divergences, two
  // readings each, both locators rendered, and no rendered word that could
  // mark one — the shape is enforced by the type and the rendering is checked
  // here.
  // PLANTED: rendered only `d.readings[0]` in `DeviationWorkspace.tsx`.
  // (Deleting a reading from the record itself is a TYPE error rather than a
  // red — `readings` is a fixed-length pair — so the plant is on the
  // rendering, which is the half a type cannot hold.)
  // RED: expected 'Row 9 · Supervisor · Mark evidence reviewed…' to contain
  //      '§25.4 row 7 · L48450'
  it('renders both readings and both locators for all three', () => {
    RENDER()
    const mark = screen.getByTestId('cc-04-divergence-mark-evidence-reviewed-supervisor')
    expect(mark.textContent).toContain('L36842')
    expect(mark.textContent).toContain('L38688')
    expect(mark.textContent).toContain('§25.4 row 7 · L48450')

    const release = screen.getByTestId('cc-04-divergence-release-and-request-supervisor')
    expect(release.textContent).toContain('L36838')
    expect(release.textContent).toContain('L36839')
    expect(release.textContent).toContain('§25.4 row 4 · L48447')
    expect(release.textContent).toContain('§21.16 row 4 · L38685')

    const severity = screen.getByTestId(
      'cc-04-divergence-reclassify-severity-displayed-versus-performed',
    )
    expect(severity.textContent).toContain('L36845')
    expect(severity.textContent).toContain('§26.7 · L49578')
  })

  // FAILS IF: a rendered divergence acquires an adopted, preferred or chosen
  // reading. Checked against the rendered text of all three at once, because
  // a word that marks a winner is a word a reviewer would read.
  // PLANTED: prefixed the mark-evidence record's `renderedConsequence` with
  // "The first reading is adopted."
  // RED: cc-04-divergence-mark-evidence-reviewed-supervisor marks a winner
  //      with "adopted": expected 'row 9 · supervisor · mark evidence re…'
  //      not to contain 'adopted'
  it('renders no word that marks one reading as the answer', () => {
    RENDER()
    for (const id of [
      'cc-04-divergence-mark-evidence-reviewed-supervisor',
      'cc-04-divergence-release-and-request-supervisor',
      'cc-04-divergence-reclassify-severity-displayed-versus-performed',
    ]) {
      const text = screen.getByTestId(id).textContent ?? ''
      for (const word of ['adopted', 'preferred', 'we choose', 'the correct reading']) {
        expect(text.toLowerCase(), `${id} marks a winner with "${word}"`).not.toContain(word)
      }
    }
  })
})

describe('the count this module does not compute', () => {
  // FAILS IF: an "awaiting Quality Manager" number appears anywhere on the
  // panel. The gate scans the whole rendered subtree for a digit adjacent to
  // the phrase rather than trusting the flag, because a flag is satisfied by
  // itself.
  // PLANTED: rendered `Awaiting Quality Manager: 3` beside the note.
  // RED: expected '…Awaiting Quality Manager: 3…' not to match /awaiting[^.]{0,40}\d/i
  it('states the gap and renders no such number', () => {
    const { container } = RENDER()
    const box = screen.getByTestId('cc-04-uncomputed-count')
    expect(box.getAttribute('data-computed')).toBe('false')
    expect(box.textContent).toContain('is not computed here')
    expect(box.textContent).toContain('L36839')
    expect(container.textContent ?? '').not.toMatch(/awaiting[^.]{0,40}\d/i)
  })
})

describe('the hold is never promoted past what the devices confirm', () => {
  // FAILS IF: a hold with an unconfirmed device renders as in force. The
  // storyboard's own set is two acknowledged of three, so the honest answer
  // is `propagating` with the third device NAMED.
  // PLANTED: changed `TAB-021`'s state in `DeviationWorkspace.tsx` from
  // `'delivered'` to `'acknowledged'`.
  // RED: expected 'in force: In force on 3 of 3 devices. Every relevant device
  //      has acknowledged application.' to contain 'propagating'
  it('renders propagating with the unconfirmed device named', () => {
    RENDER()
    const state = screen.getByTestId('cc-04-hold-state').textContent ?? ''
    expect(state).toContain('propagating')
    expect(state).not.toContain('in force on')
    expect(state).toContain('TAB-021')
    const devices = screen.getByTestId('cc-04-hold-devices').textContent ?? ''
    expect(devices).toContain('2 of 3')
    expect(devices).toContain('TAB-015')
    expect(devices).toContain('TAB-016')
    expect(devices).toContain('TAB-021')
  })

  // FAILS IF: the per-device marker obligation is restated rather than read
  // from §21.3's assignment table. The rendered words are the table's own.
  it('renders the live model’s per-device obligation for this element', () => {
    RENDER()
    const text = screen.getByTestId('cc-04-workspace').textContent ?? ''
    expect(text).toContain('Hold per-device confirmation state')
    expect(text).toContain('Per-device timestamps')
    expect(text).toContain('per device')
    expect(text).toContain('L35897')
  })

  // FAILS IF: the surface promotes an unreturned device on a timer. There is
  // no timeout anywhere in this path and the rendered reason says so, which
  // is `DEC-WIPE-001` left open rather than closed by this build.
  it('says plainly that nothing promotes the hold on a timer', () => {
    RENDER()
    expect(screen.getByTestId('cc-04-hold-state').textContent).toContain('DEC-WIPE-001')
  })
})

describe('containment, and the ten operational actions', () => {
  // FAILS IF: DEC-CONTLAUNCH-001's two consequences stop being stated. Both
  // bind this module and both are on one source line.
  // PLANTED: deleted the consequences paragraph from
  // `DeviationWorkspace.tsx`.
  // RED: Unable to find an element by: [data-testid="cc-04-contlaunch-consequences"]
  it('states both consequences of DEC-CONTLAUNCH-001 and consumes task 5’s record', () => {
    RENDER()
    expect(screen.getByTestId('cc-04-contlaunch').textContent).toContain('Option A')
    const consequences = screen.getByTestId('cc-04-contlaunch-consequences').textContent ?? ''
    expect(consequences).toContain('no gate item')
    expect(consequences).toContain('server-side mirror')
    expect(consequences).toContain('never a launch')
    expect(consequences).toContain('L36937')
  })

  // FAILS IF: this panel starts drawing the ten operational actions itself.
  // `MOD-CC-13`'s rail is mounted on this route by the page and draws all ten
  // with their owning places; a second list here would be a second spelling of
  // a closed set that has one owner. The panel NAMES the five and draws no
  // control for any of them.
  // PLANTED: restored this panel's own `<ul>` of the five with a control-shaped
  // row per action.
  // RED: expected '12479' to contain '1, 2, 4, 7 and 9'
  it('names the five without drawing a second copy of the rail', () => {
    RENDER()
    const named = screen.getByTestId('cc-04-exercised-actions').textContent ?? ''
    expect(named).toContain('1, 2, 4, 7 and 9')
    expect(named).toContain('L36943')
    expect(named).toContain('L38793')
    expect(named).toContain('not drawn twice')
    expect(within(screen.getByTestId('cc-04-exercised-actions')).queryAllByRole('listitem'))
      .toHaveLength(0)
    // The rail is the page's, not this component's: mounting it here would be
    // the duplication this gate exists to prevent.
    expect(screen.queryByTestId('cc13-rail')).toBeNull()
  })
})

describe('the frozen session, and the client boundary', () => {
  // FAILS IF: the session-offline statement drops the fact that nothing is
  // queued. `FB-CC-SESS`'s row is `None, deliberately` — the STRONGER of the
  // two refusal shapes, because a write exists on that path and is still not
  // queued — so the rendered words are the pattern's own.
  // PLANTED: softened that cell in `fallback/patterns.ts` to the weaker
  // `Not applicable — nothing is written`, which seven of the nine rows use.
  // RED: expected 'FB-CC-SESS — Platform unreachable fro…' to contain
  //      'None, deliberately'
  it('renders FB-CC-SESS’s own cells, including that nothing is queued', () => {
    RENDER()
    const text = screen.getByTestId('cc-04-session-offline').textContent ?? ''
    expect(text).toContain('FB-CC-SESS')
    expect(text).toContain('Disabled with the reason shown')
    expect(text).toContain('None, deliberately')
    expect(text).toContain('Frozen labelled board')
  })

  // FAILS IF: this module or its route acquires `'use client'` while
  // exporting plain data a server component reads. Asserted on the route file
  // too: it is the file that renders the module identifier the registry
  // generator reads out of the built HTML.
  // PLANTED: added `'use client'` to `DeviationWorkspace.tsx`.
  // RED: src/surfaces/cc/modules/cc-04/DeviationWorkspace.tsx: expected true
  //      to be false // Object.is equality
  it('neither the module nor its route is a client module', () => {
    for (const f of [
      'src/surfaces/cc/modules/cc-04/DeviationWorkspace.tsx',
      'src/surfaces/cc/modules/cc-04/matrix.ts',
      'src/surfaces/cc/modules/cc-04/readings.ts',
      'app/command-center/deviation-workspace/page.tsx',
    ]) {
      expect(/^'use client'/m.test(readFileSync(join(process.cwd(), f), 'utf8')), f).toBe(false)
    }
  })
})
