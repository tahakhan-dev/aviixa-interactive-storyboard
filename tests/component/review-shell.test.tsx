import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ReviewPage from '../../app/review/page'

describe('review shell', () => {
  it('labels its accept action for client review, never as an approval', () => {
    render(<ReviewPage />)
    expect(screen.getByRole('button', { name: /accept for client review/i })).toBeDefined()
    expect(screen.queryByRole('button', { name: /^approve$/i })).toBeNull()
  })

  it('uses no product-approval language anywhere on the page', () => {
    const { container } = render(<ReviewPage />)
    const t = (container.textContent ?? '').toLowerCase()
    for (const forbidden of ['workflow approval', 'job approval', 'quality release', 'production authorisation']) {
      expect(t, forbidden).not.toContain(forbidden)
    }
  })

  it('states that review records are storyboard metadata, not product audit', () => {
    const { container } = render(<ReviewPage />)
    expect((container.textContent ?? '').toLowerCase()).toMatch(/not.*(product )?audit|storyboard metadata/)
  })

  it('offers all four review statuses', () => {
    render(<ReviewPage />)
    for (const s of ['needs change', 'question', 'comment']) {
      expect(screen.getByText(new RegExp(s, 'i')), s).toBeDefined()
    }
  })

  it('has exactly one level-1 heading and a main landmark', () => {
    render(<ReviewPage />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('main')).toBeDefined()
  })
})
