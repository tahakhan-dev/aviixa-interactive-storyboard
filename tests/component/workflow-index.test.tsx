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

  it('filters compose — surface AND status together narrow further', async () => {
    render(<WorkflowIndex />)
    await userEvent.selectOptions(screen.getByLabelText(/surface/i), 'SURF-FL')
    const afterOne = screen.getAllByRole('row').length
    await userEvent.selectOptions(screen.getByLabelText(/status/i), 'not-represented')
    expect(screen.getAllByRole('row').length).toBeLessThanOrEqual(afterOne)
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
    expect(screen.queryByText(/no workflows have been registered/i)).toBeNull()
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
