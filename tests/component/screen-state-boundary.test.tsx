import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ScreenStateBoundary } from '@/ui/ScreenStateBoundary'
import { SCREEN_STATES } from '@/ui/screen-state'

describe('ScreenStateBoundary', () => {
  it('renders a distinguishable treatment for every one of the thirteen states', () => {
    const seen = new Set<string>()
    for (const s of SCREEN_STATES) {
      const { container, unmount } = render(
        <ScreenStateBoundary state={s.id} surface="SURF-FL" detail={{ objectLabel: 'scheduled runs' }}>
          <p>content</p>
        </ScreenStateBoundary>,
      )
      const text = (container.textContent ?? '').trim()
      expect(text.length, s.id).toBeGreaterThan(0)
      seen.add(text)
      unmount()
    }
    expect(seen.size).toBe(13)
  })

  it('renders children only in the success state', () => {
    const { container: ok } = render(
      <ScreenStateBoundary state="STATE-03" surface="SURF-DOH"><p>content</p></ScreenStateBoundary>,
    )
    expect(ok.textContent).toContain('content')
    const { container: empty } = render(
      <ScreenStateBoundary state="STATE-01" surface="SURF-DOH" detail={{ objectLabel: 'runs', whatCreatesIt: 'Run Scheduling' }}>
        <p>content</p>
      </ScreenStateBoundary>,
    )
    expect(empty.textContent).not.toContain('content')
  })

  // STATE-02: loading never renders a zero.
  it('renders no digit in the loading state', () => {
    const { container } = render(
      <ScreenStateBoundary state="STATE-02" surface="SURF-DOH" detail={{ objectLabel: 'scheduled runs' }} />,
    )
    expect(container.textContent ?? '').not.toMatch(/\d/)
  })

  // Frozen source: only the Frontline surface has a true offline state.
  it('throws when a non-Frontline surface asks for the offline state', () => {
    expect(() =>
      render(<ScreenStateBoundary state="STATE-07" surface="SURF-DOH" />),
    ).toThrow(/only the frontline/i)
  })

  it('allows the offline state on the Frontline surface', () => {
    const { container } = render(<ScreenStateBoundary state="STATE-07" surface="SURF-FL" />)
    expect((container.textContent ?? '').length).toBeGreaterThan(0)
  })

  // STATE-09: never render a queued action as applied or complete.
  it('names the true command state when queued and never says applied or complete', () => {
    const { container } = render(
      <ScreenStateBoundary state="STATE-09" surface="SURF-FL" detail={{ commandState: 'available for delivery' }} />,
    )
    const t = (container.textContent ?? '').toLowerCase()
    expect(t).toContain('available for delivery')
    expect(t).not.toContain('applied')
    expect(t).not.toContain('complete')
    expect(t).not.toContain('synced')
  })
})
