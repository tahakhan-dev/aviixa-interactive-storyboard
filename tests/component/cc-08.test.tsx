import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { AgentActivityPanel } from '@/surfaces/cc/modules/cc-08/AgentActivityPanel'
import {
  CC08_ABSENCE_IS_CORRECT_ROW,
  CC08_COLUMNS,
  CC08_LINK_OUT_ROWS,
  CC08_MATRIX,
  cc08Row,
} from '@/surfaces/cc/modules/cc-08/matrix'
import { CC08_DIVERGENCES } from '@/surfaces/cc/modules/cc-08/readings'
import { CC_FROZEN_CONTROL_REASON } from '@/surfaces/cc/fallback/session'

/**
 * `MOD-CC-08` AS A RENDERING.
 *
 * The unit suite next door asks whether the transcription matches the frozen
 * source. This one asks what a client actually SEES, because on this module
 * the two answers come apart on three of the nine rows: a correct
 * transcription of rows 6 and 7 rendered through the build's one rule draws a
 * note and NO LINK where the source spells out a destination, and a correct
 * transcription of row 8 — the same token, the same trailing-note shape —
 * must draw exactly that absence and no link at all.
 *
 * ── THREE BEATEN-GATE SHAPES ARE ACTIVE HERE ─────────────────────────────
 *
 *  - `textContent` WELDS ADJACENT ELEMENTS, so a check that a disabled control
 *    carries its reason passes when the note beside it carries the same words.
 *    Every disabled reason below is resolved through `aria-describedby` off
 *    the control itself, and `reason.hidden === false` is asserted too,
 *    because a `hidden` attribute defeats the same read.
 *  - A NAME-KEYED CELL LOOKUP IS BLIND TO COLUMN ORDER. Reversing the body's
 *    columns leaves every `data-testid` on its own value and a name-keyed gate
 *    green, with every cell under the wrong heading — the exact silent
 *    inversion this matrix's column order is dangerous for. Header-keying
 *    protects the transcription and does not protect the render, so the order
 *    is asserted separately and positionally.
 *  - `Allowed` IS A PREFIX OF `Allowed with conditions`. Cell assertions below
 *    are exact equality against the model's own cell text, which the unit
 *    suite independently pins to the source line.
 */

afterEach(cleanup)

const RENDER = () => render(<AgentActivityPanel viewerRole="SUPERVISOR" />)

/** A disabled control's reason, resolved off the control rather than welded. */
function reasonOf(control: HTMLElement): HTMLElement {
  const id = control.getAttribute('aria-describedby')
  expect(id, 'a disabled control with no aria-describedby states no reason').toBeTruthy()
  const reason = document.getElementById(id as string)
  expect(reason).not.toBeNull()
  expect((reason as HTMLElement).hidden).toBe(false)
  return reason as HTMLElement
}

describe('the nine rows render, header-keyed and whole', () => {
  // FAILS IF: a row or a cell stops rendering. Forty-five cells asserted by
  // row ordinal and column NAME, so a value drifting from the model cannot
  // pass. This check is deliberately blind to column ORDER; the next one is
  // not, and the pair is why both exist.
  // PLANTED: changed row 5's Worker cell in `matrix.ts` to the Tenant Admin's
  // text, which is the swap a positional read produces.
  // RED: expected 'Allowed with conditions — requires Tenant or Site read
  //      scope' to be 'Explicitly prohibited'
  it('renders every cell of every row under its own column', () => {
    RENDER()
    expect(within(screen.getByTestId('cc-08-matrix')).getAllByRole('row')).toHaveLength(
      CC08_MATRIX.length + 1,
    )
    for (const row of CC08_MATRIX) {
      for (const column of CC08_COLUMNS) {
        expect(
          screen.getByTestId(`cc-08-cell-${row.ordinal}-${column}`).textContent,
          `row ${row.ordinal} · ${column}`,
        ).toBe(row.cells[column].text)
      }
    }
  })

  // FAILS IF: the body cells are drawn in an order the header row does not
  // carry. This is the check the name-keyed one above CANNOT make: five of
  // this matrix's nine rows carry the identical `Explicitly prohibited` in
  // both the Tenant Admin and the Worker column, so a reader of a
  // column-reversed table would read the Worker's column as the Tenant
  // Admin's and only row 5 would look wrong.
  // PLANTED: `[...CC08_COLUMNS].reverse().map` for the body cells only in
  // `AgentActivityPanel.tsx`.
  // RED: expected [ 'Worker', 'Read-only Auditor', …(3) ] to deeply equal
  //      [ 'Tenant Admin', 'Supervisor', …(3) ]
  it('draws the body cells in the header’s own order, not only under its own names', () => {
    RENDER()
    const header = within(screen.getByTestId('cc-08-matrix'))
      .getAllByRole('columnheader')
      .map((th) => th.textContent)
    expect(header).toEqual(['Capability on this module', ...CC08_COLUMNS, 'Source'])
    for (const row of CC08_MATRIX) {
      const drawn = [...screen.getByTestId(`cc-08-row-${row.ordinal}`).querySelectorAll('td')]
        .map((td) => td.getAttribute('data-testid'))
        .filter((id): id is string => id !== null)
        .map((id) => id.replace(`cc-08-cell-${row.ordinal}-`, ''))
      expect(drawn, `row ${row.ordinal}`).toEqual([...CC08_COLUMNS])
    }
  })
})

describe('rows 6 and 7 draw a LINK-OUT, and never an empty cell', () => {
  // FAILS IF: either link-bearing cell stops rendering its link-out. Both are
  // asserted, because each would otherwise draw a note with no link at all —
  // two cells, one wrong rendering, and the source spells a destination in
  // both.
  // PLANTED: deleted `CC08_LINK_OUT_ROWS[1]` from `matrix.ts`, so only the
  // switch-agent link-out rendered.
  // RED: expected [ <div role="note" …> ] to have a length of 2 but got 1
  it('renders both cells as cross-surface link-outs', () => {
    RENDER()
    const links = screen.getAllByTestId('cc-cross-surface-link')
    expect(links).toHaveLength(CC08_LINK_OUT_ROWS.length)
    expect(links.map((l) => l.getAttribute('data-cell-id'))).toEqual([
      'cc-08-switch-agent',
      'cc-08-reconfigure-agent',
    ])
    for (const link of links) {
      expect(link.textContent).toContain('Held on another surface')
    }
  })

  // FAILS IF: the named-owner cell stops resolving to a real anchor. The
  // Supervisor reaches the Standards and Operations Studio in the route
  // registry, so the pointer is CHECKED and this one becomes a link.
  // PLANTED: changed `cc-08-switch-agent`'s owner surface from `SURF-STU` to
  // `SURF-SA` in `link-outs.ts` — a task-5 file, reversed byte-identically.
  // RED: expected 'statement' to be 'link'
  it('the switch-agent cell resolves to a real anchor at the Studio', () => {
    RENDER()
    const link = screen
      .getAllByTestId('cc-cross-surface-link')
      .find((l) => l.getAttribute('data-cell-id') === 'cc-08-switch-agent')
    expect(link).toBeDefined()
    if (link === undefined) return
    expect(link.getAttribute('data-link-state')).toBe('link')
    const anchor = within(link).getByTestId('cc-cross-surface-link-anchor')
    expect(anchor.getAttribute('href')).toBe('/studio')
    expect(link.textContent).toContain('Switch an agent on or off')
    expect(link.textContent).toContain('L37671')
  })

  // FAILS IF: the ambiguous cell acquires a destination. Its own words name
  // two owners — "Studio or platform action" — and choose neither, so drawing
  // a link to either is this build choosing on the source's behalf. Both
  // candidates must be named and no anchor may exist.
  // PLANTED: changed `cc-08-reconfigure-agent`'s owner from the ambiguous arm
  // to `{ kind: 'named', surface: 'SURF-STU', place: 'where an agent is
  // reconfigured' }` in `link-outs.ts`; reversed byte-identically.
  // RED: expected 'link' to be 'owner-undecided'
  it('the reconfigure cell names both owners and links to neither', () => {
    RENDER()
    const link = screen
      .getAllByTestId('cc-cross-surface-link')
      .find((l) => l.getAttribute('data-cell-id') === 'cc-08-reconfigure-agent')
    expect(link).toBeDefined()
    if (link === undefined) return
    expect(link.getAttribute('data-link-state')).toBe('owner-undecided')
    expect(within(link).queryAllByTestId('cc-cross-surface-link-anchor')).toEqual([])
    const note = within(link).getByTestId('cc-cross-surface-link-note').textContent ?? ''
    expect(note).toContain('Studio')
    expect(note).toContain('platform action')
    expect(link.textContent).toContain('L37672')
  })

  // FAILS IF: either link-out is drawn as a control this surface can act on.
  // The whole point of this population is that no handler exists — a disabled
  // control would still imply a condition that could become true, and this
  // boundary does not move.
  it('offers no button inside either link-out', () => {
    RENDER()
    for (const link of screen.getAllByTestId('cc-cross-surface-link')) {
      expect(within(link).queryAllByRole('button')).toEqual([])
    }
  })
})

describe('row 8 draws the absence, and that is what the source asks for', () => {
  // FAILS IF: the trace boundary acquires a link, or stops stating its reason.
  // It carries the same token and the same trailing-note shape as rows 6 and
  // 7 and must render the opposite thing, so the two renderings are asserted
  // against each other rather than each on its own.
  // PLANTED: rendered row 8 through `CrossSurfaceLink` instead of
  // `WriteControl`, using a locally-built model.
  // RED: expected [ <div …>, <div …>, <div …> ] to have a length of 2 but got 3
  it('renders a stated absence with no control and no anchor', () => {
    RENDER()
    const boundary = screen.getByTestId('cc-08-trace-boundary')
    expect(within(boundary).queryAllByRole('button')).toEqual([])
    expect(boundary.querySelectorAll('a')).toHaveLength(0)
    expect(boundary.textContent).toContain('platform-internal')
    // The absent branch renders the module's own refusal note and nothing
    // else, so what is absent is named by the heading above it rather than by
    // the notice — asserted here so the pair is read together.
    expect(
      screen.getByRole('heading', {
        name: new RegExp(cc08Row(CC08_ABSENCE_IS_CORRECT_ROW).capability),
      }),
    ).toBeTruthy()
    // And it is not one of the link-outs.
    expect(within(boundary).queryAllByTestId('cc-cross-surface-link')).toEqual([])
    expect(screen.getAllByTestId('cc-cross-surface-link')).toHaveLength(2)
  })
})

describe('row 9 renders both readings, which render oppositely', () => {
  // FAILS IF: the absent reading draws a control, or the unavailable reading
  // draws nothing. That difference IS the finding, so it is rendered rather
  // than described, and the reason is read off the control through
  // `aria-describedby` rather than off welded `textContent`.
  // PLANTED: changed reading B's outcome in `AgentActivityPanel.tsx` from
  // `unavailable` to `explicitlyProhibited`, which collapses the two
  // renderings into one.
  // RED: expected null not to be null (no button in
  //      cc-08-recheck-unavailable)
  it('the prohibited reading draws no control and the unavailable one draws a disabled one', () => {
    RENDER()
    const prohibited = screen.getByTestId('cc-08-recheck-prohibited')
    expect(within(prohibited).queryAllByRole('button')).toEqual([])
    expect(prohibited.textContent).toContain('Nothing is drawn here')

    const unavailable = screen.getByTestId('cc-08-recheck-unavailable')
    const button = within(unavailable).getByRole('button')
    const reason = reasonOf(button)
    expect(reason.textContent).toContain('does not confer on the Tenant Admin')
    expect(reason.textContent).toContain('Viewing as Tenant Admin')
  })

  // FAILS IF: the frozen session is drawn as a refusal of the person rather
  // than of the session, or the live control stops being actionable. A frozen
  // session reaches the control through the gate branch: the grant is
  // unchanged in both renderings and only the reason differs.
  // PLANTED: changed the frozen rendering's decision from `allow(...)` to
  // `deny('explicitlyProhibited', ...)`, which draws the Supervisor nothing at
  // all instead of a disabled control saying why.
  // RED: expected null not to be null (no button in cc-08-recheck-frozen)
  it('the Supervisor’s control is live, and frozen it is disabled with the session’s reason', () => {
    RENDER()
    const live = within(screen.getByTestId('cc-08-recheck-live')).getByRole('button')
    expect(live.getAttribute('aria-describedby')).toBeNull()
    expect(live.hasAttribute('disabled')).toBe(false)

    const frozen = within(screen.getByTestId('cc-08-recheck-frozen')).getByRole('button')
    expect(reasonOf(frozen).textContent).toBe(CC_FROZEN_CONTROL_REASON)
  })
})

describe('the disclosures a client can read on the page', () => {
  // FAILS IF: the AC-CC-090 failure is quietly dropped or repaired on screen.
  // Two of nine functionalities name no pattern, and the panel says which two.
  // PLANTED: filtered the two out of the rendered list in
  // `AgentActivityPanel.tsx`.
  // RED: expected '0' to be '2'
  it('names the two functionalities that reference no FB-CC pattern', () => {
    RENDER()
    const el = screen.getByTestId('cc-08-ac-090')
    expect(el.getAttribute('data-silent-count')).toBe('2')
    expect(el.textContent).toContain('FUNC-CC-0803-1-2')
    expect(el.textContent).toContain('FUNC-CC-0804-1-1')
    expect(el.textContent).toContain('platform escalation fallback governs')
    expect(el.textContent).toContain('not applicable')
  })

  // FAILS IF: the composed-agent half of AC-CC-300 is simulated. A fourth
  // status row would be this build inventing the instance the source
  // withholds, so the storyboard's three are drawn and the gap is stated.
  // PLANTED: added a fourth row to `STORYBOARD_STATUS`.
  // RED: expected 4 to be 3
  it('draws the storyboard’s three agents and states the composed-agent gap', () => {
    RENDER()
    const body = within(screen.getByTestId('cc-08-status')).getAllByRole('row')
    expect(body).toHaveLength(4)
    const gap = screen.getByTestId('cc-08-composed-agent-gap')
    expect(gap.getAttribute('data-simulated')).toBe('false')
    expect(gap.textContent).toContain('AC-CC-300')
    expect(gap.textContent).toContain('TEST-CC-300')
  })

  // FAILS IF: a divergence stops rendering both readings, or starts rendering
  // a winner. `TwoReadings` has nowhere to mark one, and this asserts that
  // both arrive on screen with their own locators.
  // PLANTED: rendered `d.readings[0]` alone instead of mapping both in
  // `AgentActivityPanel.tsx`, which is what choosing a winner would look like.
  // RED: agent-recheck-tenant-admin reading 2: expected '…' to contain
  //      '§25.4 row 9 · L48452'
  it('renders each divergence with both readings and both locators', () => {
    RENDER()
    expect(CC08_DIVERGENCES.length).toBe(3)
    for (const d of CC08_DIVERGENCES) {
      const el = screen.getByTestId(`cc-08-divergence-${d.id}`)
      const text = el.textContent ?? ''
      expect(text, `${d.id} row`).toContain(d.capability)
      d.readings.forEach((r, i) => {
        expect(text, `${d.id} reading ${i + 1}`).toContain(r.locator)
      })
      for (const s of d.statements) {
        expect(text, `${d.id} L${s.line}`).toContain(`L${s.line}`)
      }
    }
  })

  // FAILS IF: the panel stops saying it mounts no action rail, or starts
  // mounting one. The abstention is rendered so a reviewer meets a stated
  // absence naming its owner rather than a blank.
  // PLANTED: flipped `railMounted` to `true` in `readings.ts`.
  // RED: expected 'true' to be 'false'
  it('states that no action rail is mounted here, and why', () => {
    RENDER()
    const el = screen.getByTestId('cc-08-action-rail-abstention')
    expect(el.getAttribute('data-rail-mounted')).toBe('false')
    expect(el.textContent).toContain('L38793')
    expect(el.textContent).toContain('L37757')
    expect(el.textContent).toContain('MOD-CC-13')
  })

  // FAILS IF: an element's freshness class is restated here rather than read
  // from §21.3's table. Both rows are shared, and the sharing module is part
  // of the assignment.
  it('renders both freshness assignments with their shared module and line', () => {
    RENDER()
    const pushed = screen.getByTestId('cc-08-freshness-Agent output produced')
    expect(pushed.textContent).toContain('Pushed')
    expect(pushed.textContent).toContain('Production time')
    expect(pushed.textContent).toContain('MOD-CC-12')
    expect(pushed.textContent).toContain('L35890')
    const refreshed = screen.getByTestId('cc-08-freshness-Coaching indicators')
    expect(refreshed.textContent).toContain('Refreshed')
    expect(refreshed.textContent).toContain('MOD-CC-01')
    expect(refreshed.textContent).toContain('L35895')
  })

  // FAILS IF: the module stops naming itself on screen. A route claimed by a
  // slug is demonstrated by the claim alone; the panel says what it is.
  it('names its own module, screen and identity line', () => {
    RENDER()
    const identity = screen.getByTestId('cc-08-identity').textContent ?? ''
    expect(identity).toContain('MOD-CC-08')
    expect(identity).toContain('SCR-CC-08')
    expect(identity).toContain('L37640')
    expect(screen.getByTestId('cc-08-panel').getAttribute('data-module')).toBe('MOD-CC-08')
  })
})
