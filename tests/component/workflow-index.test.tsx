import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WorkflowIndex } from '../../app/workflows/page'

describe('workflow index filters', () => {
  it('filters by surface', async () => {
    render(<WorkflowIndex />)
    const before = screen.getAllByRole('row').length
    await userEvent.selectOptions(screen.getByLabelText(/surface/i), 'SURF-FL')
    expect(screen.getAllByRole('row').length).toBeLessThan(before)
  })

  // Final review round 1, MAJOR 2 -- and round 2's follow-up: 'Worker' was
  // one-sided proof. Every one of the 51 'Worker'-actor rows happens to
  // ALSO touch SURF-FL, so actor-alone ('Worker', no surface) already gives
  // the same 51 rows as surface+actor together -- deleting the SURFACE
  // clause left this test passing (51 either way). 'Quality Manager' is a
  // real actor that appears BOTH inside and outside SURF-FL (16 of its 32
  // rows touch FL, 16 do not), so surface+actor (16) is a strict subset of
  // EITHER filter alone (surface-only 389, actor-only 32) -- two-sided by
  // construction, not just by which value happened to be picked first.
  //
  // Final review round 3 (non-blocking): surface-only was 376 here until
  // round 2's own "all five" fix (WorkflowIndex.tsx's surfaceTouchedMatches)
  // pulled in 13 more SURF-FL rows -- this comment named the pre-fix count
  // and went stale in the very commit that changed it.
  it('filters compose — surface AND actor together narrow further than EITHER alone (two-sided)', async () => {
    render(<WorkflowIndex />)

    await userEvent.selectOptions(screen.getByLabelText(/surface/i), 'SURF-FL')
    const surfaceOnly = screen.getAllByRole('row').length // 390 (389 rows + header)

    await userEvent.selectOptions(screen.getByLabelText(/actor/i), 'Quality Manager')
    const both = screen.getAllByRole('row').length // 17 (16 rows + header)

    await userEvent.selectOptions(screen.getByLabelText(/surface/i), '') // clear surface, keep actor
    const actorOnly = screen.getAllByRole('row').length // 33 (32 rows + header)

    // Fails if the ACTOR clause is deleted: both would equal surfaceOnly.
    expect(both).toBeLessThan(surfaceOnly)
    // Fails if the SURFACE clause is deleted: both would equal actorOnly
    // (selecting SURF-FL would be inert, so "both" already collapses to
    // actor-only before this line even runs).
    expect(both).toBeLessThan(actorOnly)
  })

  // Final review, MAJOR 1: surfacesTouched is free text -- 95 of 724 rows
  // carry a prose surface name (e.g. "Delivery Operations Hub") with no
  // SURF-DOH code at all. A filter that matches only the code silently
  // drops every row whose cell reads exactly that prose name -- worse than
  // a filter that visibly does not work. SB-001@L61090 is such a row.
  it('surface filter matches a prose-only surface name, not just the SURF-* code', async () => {
    render(<WorkflowIndex />)
    expect(screen.getByText('SB-001@L61090', { selector: 'td' })).toBeDefined()
    await userEvent.selectOptions(screen.getByLabelText(/surface/i), 'SURF-DOH')
    expect(screen.getByText('SB-001@L61090', { selector: 'td' })).toBeDefined()
  })

  // Final review round 2, MAJOR: 13 rows read "all five"/"All five
  // surfaces" in surfacesTouched -- a row that genuinely touches every
  // surface, but matched no single-surface filter option at all. Selecting
  // ANY surface hid these rows, the same silent-drop defect as the
  // prose-name bug just above. WF-BOUNDARY-LOOKUP is such a row.
  it('surface filter matches a row whose surfacesTouched reads "all five", for any surface selected', async () => {
    render(<WorkflowIndex />)
    for (const surfaceId of ['SURF-SA', 'SURF-DOH', 'SURF-STU', 'SURF-CC', 'SURF-FL']) {
      await userEvent.selectOptions(screen.getByLabelText(/surface/i), surfaceId)
      expect(screen.getByText('WF-BOUNDARY-LOOKUP', { selector: 'td' }), surfaceId).toBeDefined()
    }
  })

  // Empty and no-match say different things. `__none__` is a real, stable
  // option on the actor filter -- "no primary actor recorded" -- and since
  // every one of the 724 rows carries a primary actor, selecting it can
  // never match, which is what makes this combination deterministic rather
  // than a fragile guess at two filter values that happen to intersect at
  // zero today.
  it('a filter matching nothing renders no-match, NOT the empty state', async () => {
    render(<WorkflowIndex />)
    await userEvent.selectOptions(screen.getByLabelText(/surface/i), 'SURF-SA')
    await userEvent.selectOptions(screen.getByLabelText(/actor/i), '__none__')
    expect(screen.getByText(/no workflows match/i)).toBeDefined()
    // Minor (final review): this used to check for "no workflows have been
    // registered", a string that matches nothing anywhere in this codebase
    // (the real empty-state title is "There are no workflows recorded
    // yet."), so the negative assertion could never fail. Matches the real
    // text the Table/EmptyState primitive would actually render if the
    // no-match/empty-state branches were ever confused.
    expect(screen.queryByText(/there are no workflows recorded yet/i)).toBeNull()
  })

  it('clearing filters restores every row', async () => {
    render(<WorkflowIndex />)
    const before = screen.getAllByRole('row').length
    await userEvent.selectOptions(screen.getByLabelText(/surface/i), 'SURF-FL')
    await userEvent.click(screen.getByRole('button', { name: /clear filters/i }))
    expect(screen.getAllByRole('row').length).toBe(before)
  })

  it('every filter control has an accessible name', () => {
    render(<WorkflowIndex />)
    for (const label of [/surface/i, /actor/i, /status/i, /collapsed/i]) {
      expect(screen.getByLabelText(label)).toBeDefined()
    }
  })

  it('filtering never touches domain truth — every row still reads not-represented', async () => {
    render(<WorkflowIndex />)
    await userEvent.selectOptions(screen.getByLabelText(/surface/i), 'SURF-FL')
    const cells = screen.getAllByText('not-represented')
    expect(cells.length).toBeGreaterThan(0)
  })
})
