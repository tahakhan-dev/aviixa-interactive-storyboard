import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { AlertEscalationFeed } from '@/surfaces/cc/modules/cc-09/AlertEscalationFeed'
import {
  CC09_DEMONSTRATION_FILTER,
  CC09_STORYBOARD_FEED,
  cc09IsUnacknowledged,
  cc09VisibleEntries,
} from '@/surfaces/cc/modules/cc-09/feed'
import { CC09_COLUMNS, CC09_MATRIX, cc09Cell } from '@/surfaces/cc/modules/cc-09/matrix'

/**
 * `MOD-CC-09` AS A RENDERING.
 *
 * The unit suite next door asks whether the transcription matches the frozen
 * source. This one asks what a client actually SEES, because on this module
 * the two answers come apart three times: a filter that is correct in the
 * model can still hide an item on screen; a correct transcription of row 9
 * rendered through the build's one rule draws nothing at all where the source
 * spells out a destination; and a clearance that has reached no device must
 * not be drawn as delivered.
 *
 * ── BEATEN-GATE SHAPES THAT ARE ACTIVE HERE ─────────────────────────────
 *
 *  - `textContent` WELDS ADJACENT ELEMENTS, so a check that the frozen
 *    control carries its reason passes when the paragraph beside it carries
 *    the same words. The reason is resolved through `aria-describedby` off
 *    the control itself, and `reason.hidden === false` is asserted too.
 *  - A NAME-KEYED CELL LOOKUP IS BLIND TO COLUMN ORDER. Reversing the body's
 *    columns leaves every `data-testid` on its own value and a name-keyed
 *    gate green, with every cell under the wrong heading — the exact silent
 *    inversion this matrix's column order is dangerous for. The order is
 *    asserted separately, positionally.
 *
 * ── THE TWO CELL GATES ARE COMPLEMENTARY AND ARE NOT REDUNDANT ──────────
 *
 * The campaign planted the removal of EACH and of BOTH, because redundant
 * protections cannot be verified one at a time. The result is that they are
 * not a redundant pair, and the evidence is on the record rather than
 * assumed:
 *
 *   reversed body columns, name-keyed gate skipped  → RED   (positional)
 *   reversed body columns, positional gate skipped  → GREEN (name-keying is
 *                                                            blind to layout)
 *   reversed body columns, BOTH skipped             → GREEN
 *   cell VALUE drifted, positional gate skipped     → RED   (name-keyed)
 *
 * So the positional gate is the ONLY cover for a layout inversion and the
 * name-keyed gate is the only cover for a value drift on the nine rows the
 * positional gate does not inspect. Removing either leaves a real defect
 * shippable. This is the common brief's own finding, reproduced here on this
 * module's own table: header-keying protects the transcription and does not
 * protect the render.
 *  - AN ABSENCE CHECK THAT PASSES ON AN EMPTY RENDER. The Tenant Admin's
 *    acknowledge cell must draw NO control and DOES draw a note; both halves
 *    are asserted, so a component that rendered nothing at all would fail.
 *  - `Allowed` IS A PREFIX OF `Allowed with conditions`. Cell assertions are
 *    exact equality against the model's own cell text, which the unit suite
 *    independently pins to the source line.
 */

afterEach(cleanup)

const RENDER = () => render(<AlertEscalationFeed viewerRole="QUALITY_MANAGER" />)

/** A disabled control's reason, resolved off the control rather than welded. */
function reasonOf(control: HTMLElement): HTMLElement {
  const id = control.getAttribute('aria-describedby')
  expect(id, 'a disabled control with no aria-describedby states no reason').toBeTruthy()
  const reason = document.getElementById(id as string)
  expect(reason).not.toBeNull()
  expect((reason as HTMLElement).hidden).toBe(false)
  return reason as HTMLElement
}

describe('the ten rows render, header-keyed and whole', () => {
  // FAILS IF: a row or a cell stops rendering. Fifty cells asserted by row
  // ordinal and column NAME, so a value drifting from the model cannot pass.
  // PLANTED: changed `CC09_COLUMNS.map` in `AlertEscalationFeed.tsx` to
  // `[...CC09_COLUMNS].reverse().map` for the body cells only.
  // STAYED GREEN — which is why the positional gate below exists. Name-keying
  // is right for the VALUE and blind to the LAYOUT.
  it('renders every cell of every row under its own column', () => {
    RENDER()
    expect(within(screen.getByTestId('cc-09-matrix')).getAllByRole('row')).toHaveLength(
      CC09_MATRIX.length + 1,
    )
    for (const row of CC09_MATRIX) {
      for (const column of CC09_COLUMNS) {
        expect(
          screen.getByTestId(`cc-09-cell-${row.ordinal}-${column}`).textContent,
          `row ${row.ordinal} · ${column}`,
        ).toBe(row.cells[column].text)
      }
    }
  })

  // FAILS IF: the body cells are drawn in an order the header row does not
  // carry. This is the check the name-keyed one CANNOT make.
  // PLANTED: `[...CC09_COLUMNS].reverse().map` for the body cells only.
  // RED: expected [ 'Explicitly prohibited', 'Explicitly prohibited',
  //      'Allowed', 'Allowed', 'Explicitly prohibited' ] to deeply equal
  //      [ 'Explicitly prohibited', 'Allowed', 'Allowed',
  //        'Explicitly prohibited', 'Explicitly prohibited' ]
  it('draws the body cells in the header’s own order, not only under its own names', () => {
    RENDER()
    const table = screen.getByTestId('cc-09-matrix')
    const headings = within(table)
      .getAllByRole('columnheader')
      .map((h) => h.textContent)
    expect(headings).toEqual(['Capability on this module', ...CC09_COLUMNS, 'Source'])
    // Row 1 is deliberately NOT used: three of its five cells are identical
    // and a reversal of it is invisible. Row 4 has a note on the Tenant Admin
    // cell only, so its own order is asymmetric under reversal.
    const row4 = within(table).getByTestId('cc-09-row-4')
    const values = within(row4)
      .getAllByRole('cell')
      .slice(0, CC09_COLUMNS.length)
      .map((c) => c.textContent)
    expect(values).toEqual(CC09_COLUMNS.map((c) => cc09Cell(4, c).text))
  })
})

describe('the filter cannot hide an unacknowledged escalation, on screen', () => {
  // FAILS IF: an item carrying an unacknowledged escalation is not on the
  // page. This is the one place a wrong answer on this module is a safety
  // defect rather than a wrong string, and the model gate next door does not
  // prove the component renders what the model returns.
  // PLANTED: changed the component's `visible` to
  // `cc09VisibleEntries(CC09_STORYBOARD_FEED, CC09_DEMONSTRATION_FILTER).filter((v) => v.matchedFilter)`.
  // RED: Unable to find an element by:
  //      [data-testid="cc-09-entry-nobody-on-shift-fallback"]
  it('every unacknowledged entry is on the page, and says why it is', () => {
    RENDER()
    const unacknowledged = CC09_STORYBOARD_FEED.filter(cc09IsUnacknowledged)
    expect(unacknowledged.length).toBeGreaterThan(0)
    for (const e of unacknowledged) {
      expect(screen.getByTestId(`cc-09-entry-${e.id}`)).toBeTruthy()
    }
    // The one that the filter excludes carries the rescue note naming the
    // criterion, so a rescued item cannot read as a match.
    const rescued = cc09VisibleEntries(CC09_STORYBOARD_FEED, CC09_DEMONSTRATION_FILTER).filter(
      (v) => v.forcedVisible,
    )
    expect(rescued.length).toBeGreaterThan(0)
    for (const v of rescued) {
      const el = screen.getByTestId(`cc-09-entry-${v.entry.id}`)
      expect(el.getAttribute('data-forced-visible')).toBe('yes')
      expect(el.getAttribute('data-matched-filter')).toBe('no')
      expect(screen.getByTestId(`cc-09-forced-${v.entry.id}`).textContent).toContain('AC-CC-329')
    }
  })

  // FAILS IF: the filter admits everything, which would render the rule as a
  // gate that cannot fail — the check above would pass on a component that
  // simply drew the whole feed.
  // PLANTED: changed `CC09_DEMONSTRATION_FILTER` to `{}`.
  // RED: expected an acknowledged entry to be absent, found
  //      cc-09-entry-sb-cc-20-acknowledged
  it('an acknowledged entry the filter excludes is genuinely absent', () => {
    RENDER()
    const excluded = cc09VisibleEntries(CC09_STORYBOARD_FEED, CC09_DEMONSTRATION_FILTER)
    const shown = new Set(excluded.map((v) => v.entry.id))
    const dropped = CC09_STORYBOARD_FEED.filter((e) => !shown.has(e.id))
    expect(dropped.length).toBeGreaterThan(0)
    for (const e of dropped) {
      expect(cc09IsUnacknowledged(e), `${e.id} was dropped while unacknowledged`).toBe(false)
      expect(screen.queryByTestId(`cc-09-entry-${e.id}`)).toBeNull()
    }
  })

  // FAILS IF: a pushed entry renders one time where the source states two.
  // An event that occurred on the floor at 10:07:22 and reached the server at
  // 10:22:14 must display BOTH and never imply the platform knew at 10:07:22.
  // PLANTED: removed the `Origin` half of the times paragraph, leaving the
  // receipt.
  // RED: expected '· server receipt 10:22:14 — both shown…' to contain
  //      '10:07:22 device time'
  it('a pushed entry renders origin and receipt, and says they differ', () => {
    RENDER()
    const withTimes = CC09_STORYBOARD_FEED.filter((e) => e.times !== null)
    expect(withTimes.length).toBeGreaterThan(0)
    for (const e of withTimes) {
      const el = screen.queryByTestId(`cc-09-times-${e.id}`)
      if (el === null) continue
      expect(el.textContent).toContain(e.times?.originTime)
      expect(el.textContent).toContain(e.times?.receiptTime)
      expect(el.textContent).toContain('both shown')
    }
    // And the marker obligation is read from §21.3's table rather than
    // restated, so the panel names both elements with their obligations.
    expect(screen.getByTestId('cc-09-pushed-elements').textContent).toContain('fallback marked')
    expect(screen.getByTestId('cc-09-latency-rule').textContent).toContain('server receipt')
  })
})

describe('the resolve write, and the filter rule’s standing', () => {
  // FAILS IF: the page presents the act as one of the ten, or presents this
  // build's register count as the source's number.
  // PLANTED: changed `CC09_RESOLVE_IS_ONE_OF_THE_TEN` to `true`.
  // RED: expected 'true' to be 'false'
  it('says the act is granted here and is not one of the ten', () => {
    RENDER()
    const el = screen.getByTestId('cc-09-resolve-not-one-of-ten')
    expect(el.getAttribute('data-one-of-the-ten')).toBe('false')
    expect(el.textContent).toContain('is not one of the ten')
    expect(el.textContent).toContain('DEC-CCWRITE-001 names 4')
    expect(el.textContent).toContain("this build's count and not the source's")
    // And the two lines that name acknowledgement alone are on the page with
    // which half each names, so a reader can check the split themselves.
    const split = screen.getByTestId('cc-09-ack-resolve-split')
    expect(split.textContent).toContain('L49589')
    expect(split.textContent).toContain('L38682')
  })

  // FAILS IF: the recommendation is presented as a source fact, or the page
  // claims a client decision the line says it is not, or a filter persists.
  // PLANTED: changed `CC09_FILTER_RULE.persistsAnyFilter` to `true`.
  // RED: expected 'true' to be 'false'
  it('discloses the filter rule as a recommendation and persists nothing', () => {
    RENDER()
    const el = screen.getByTestId('cc-09-filter-rule')
    expect(el.getAttribute('data-persists-any-filter')).toBe('false')
    expect(el.getAttribute('data-client-decision-required')).toBe('false')
    expect(el.textContent).toContain('Recommendation — R&D')
    expect(el.textContent).toContain('not to a source fact')
    expect(el.textContent).toContain('AC-CC-329')
    // All four statements render with their standings, including the one
    // §21.12's own Source status line classifies differently.
    const statements = screen.getByTestId('cc-09-filter-statements')
    expect(statements.textContent).toContain('Derived Clarification')
    expect(statements.textContent).toContain('Acceptance criterion')
    expect(statements.textContent).toContain('L34881')
  })
})

describe('the two renderings a faithful transcription would get wrong', () => {
  // FAILS IF: the Tenant Admin's acknowledge cell draws a control. Its token
  // is a categorical prohibition and `WriteControl` draws it as nothing —
  // BOTH halves are asserted, so a component that rendered nothing at all
  // would fail the second.
  // PLANTED: changed the decision on that control from
  // `deny('explicitlyProhibited', …)` to `deny('unavailable', …)`.
  // RED: expected 1 to be 0 (a button appeared)
  it('the Tenant Admin’s acknowledge cell draws a note and no control', () => {
    RENDER()
    const box = screen.getByTestId('cc-09-acknowledge-tenant-admin')
    expect(within(box).queryAllByRole('button')).toHaveLength(0)
    const note = within(box).getByRole('note')
    expect(note.textContent).toContain('not an in-shift actor')
  })

  // FAILS IF: a frozen session renders an enabled control, or renders one
  // whose reason does not name the route that stays open. L37953: the
  // acknowledgement remains possible from the email notification.
  // PLANTED: removed the `gateReason` prop from that control.
  // RED: a disabled control with no aria-describedby states no reason
  it('a frozen session disables the control and names the email route in its own reason', () => {
    RENDER()
    const box = screen.getByTestId('cc-09-acknowledge-frozen')
    const button = within(box).getByRole('button')
    expect(button.getAttribute('aria-disabled')).toBe('true')
    const reason = reasonOf(button)
    expect(reason.textContent).toContain('email notification')
    expect(reason.textContent).toContain('same single state on the record')
    expect(reason.textContent).toContain('FB-CC-SESS')
  })

  // FAILS IF: row 9 draws nothing, or draws a control. The cell prohibits
  // every role and names the destination in the same words.
  // PLANTED: replaced the `CrossSurfaceLink` with the row's cell text.
  // RED: Unable to find an element by:
  //      [data-testid="cc-cross-surface-link"]
  it('row 9 draws a cross-surface link and no control', () => {
    RENDER()
    const link = screen.getByTestId('cc-cross-surface-link')
    expect(link.getAttribute('data-cell-id')).toBe('cc-09-routing-timers-channels')
    expect(within(link).queryAllByRole('button')).toHaveLength(0)
    expect(link.textContent).toContain('Change routing, timers or channels')
  })

  // FAILS IF: the clearance is drawn as reaching a device it has not reached.
  // L37951 — the feed renders the command state honestly and never as
  // delivered to an offline device.
  // PLANTED: changed the clearance device's state from `queued` to
  // `acknowledged`.
  // RED: expected 'in force: In force on 1 of 1 devices…' not to contain
  //      'in force'
  it('the clearance renders as issued, never as delivered or in force', () => {
    RENDER()
    const state = screen.getByTestId('cc-09-clearance-state').textContent ?? ''
    expect(state).toContain('issued')
    expect(state).not.toContain('in force')
    expect(state).not.toContain('delivered')
    const devices = screen.getByTestId('cc-09-clearance-devices').textContent ?? ''
    expect(devices).toContain('Confirmed (0 of 1)')
  })
})

describe('what this panel deliberately does not draw', () => {
  // FAILS IF: this panel draws the ten operational actions a second time. The
  // rail is mounted by the ROUTE and the ten are a closed set with one owner;
  // a second list here would be a second spelling of it.
  // PLANTED: rendered `<Cc13ActionRail …/>` inside the panel.
  // RED: expected 1 to be 0 (found cc13-rail)
  it('does not draw the action rail — the route mounts it', () => {
    RENDER()
    expect(screen.queryByTestId('cc13-rail')).toBeNull()
    expect(screen.getByTestId('cc-09-exercised-actions').textContent).toContain(
      'actions 1 and 10',
    )
  })

  // FAILS IF: this panel renders `FB-CC-QUEUE`'s not-decidable pattern. L37984
  // names this module's five fallback identifiers and FB-CC-QUEUE is not one
  // of them, so a `missingElement` here would be another module's pattern.
  it('names its own five fallback identifiers and not FB-CC-QUEUE', () => {
    RENDER()
    const page = document.body.textContent ?? ''
    for (const id of ['FB-CC-PUSH', 'FB-CC-SESS', 'FB-CC-WRITE', 'FB-CC-CMD', 'FB-CC-STALE']) {
      expect(page, id).toContain(id)
    }
    expect(page).not.toContain('Not decidable —')
  })

  // FAILS IF: a divergence is rendered with only one of its two readings, or
  // with a winner marked. Both readings, both locators, neither chosen.
  it('renders both readings of every divergence and marks no winner', () => {
    RENDER()
    for (const id of [
      'acknowledge-tenant-admin',
      'acknowledge-auditor-and-worker',
      'clearance-supervisor-condition',
    ]) {
      const el = screen.getByTestId(`cc-09-divergence-${id}`)
      expect(el.textContent).toBeTruthy()
    }
    expect(screen.getByTestId('cc-09-decomposition').getAttribute('data-outcomes-agree')).toBe(
      'true',
    )
  })
})
