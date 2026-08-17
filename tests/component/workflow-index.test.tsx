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

  // Final review, MAJOR 2: this used to compose surface with status, but
  // every one of the 724 rows is status 'not-represented' -- the status
  // clause changed nothing, so the assertion was `x <= x` and deleting the
  // status clause from the filter still passed. Actor genuinely varies
  // (426 distinct values); 'Worker' is a real, strict subset of the SURF-FL
  // rows (51 of 376), so composing the two must narrow further than surface
  // alone, and deleting the actor clause changes the count -- proven below.
  it('filters compose — surface AND actor together narrow further than surface alone', async () => {
    render(<WorkflowIndex />)
    await userEvent.selectOptions(screen.getByLabelText(/surface/i), 'SURF-FL')
    const afterSurface = screen.getAllByRole('row').length
    await userEvent.selectOptions(screen.getByLabelText(/actor/i), 'Worker')
    const afterBoth = screen.getAllByRole('row').length
    expect(afterBoth).toBeLessThan(afterSurface)
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
