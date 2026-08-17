import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CoveragePage from '../../app/coverage/page'
import { REGISTRY_DESCRIPTORS } from '@/coverage/descriptors'

describe('coverage dashboard', () => {
  // Brief defect, corrected: the verbatim brief used
  // `new RegExp(d.title, 'i')`, an unanchored substring match. Two real
  // descriptor titles collide under it -- "Sub-features" contains
  // "Features" as a case-insensitive substring, so
  // `getByRole('link', { name: /Features/i })` matches BOTH the "Features"
  // link and the "Sub-features" link and throws "multiple elements found".
  // Reproduced by running this test verbatim before this fix. An exact
  // (RTL default) string match on `d.title` checks the identical property
  // -- a discoverable link whose accessible name is the registry's title --
  // without the substring collision.
  it('links to every one of the fourteen registry indexes', () => {
    render(<CoveragePage />)
    for (const d of REGISTRY_DESCRIPTORS) {
      expect(screen.getByRole('link', { name: d.title }), d.slug).toBeDefined()
    }
  })

  it('has exactly one level-1 heading', () => {
    render(<CoveragePage />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('never renders a green check implying a production control exists', () => {
    const { container } = render(<CoveragePage />)
    const text = container.textContent ?? ''
    expect(text).not.toContain('✅')
    expect(text.toLowerCase()).not.toMatch(/\bproduction[- ]ready\b/)
  })

  it('states plainly that behaviour is simulated', () => {
    const { container } = render(<CoveragePage />)
    expect((container.textContent ?? '').toLowerCase()).toMatch(/simulated/)
  })

  // Task 10 / addendum §5: the dashboard's source-defined class must read
  // 63 for modules, never 81 -- 81 is the correct total reconciled count
  // and still renders in the registry table above, but the source-class
  // breakdown is a narrower, different figure.
  it('reads 63 source-defined and 18 derived for modules, never 81 for source-defined', () => {
    const { container } = render(<CoveragePage />)
    const text = container.textContent ?? ''
    expect(text).toMatch(/source-defined: 63 of 81 modules/)
    expect(text).toMatch(/derived: 18 of 81 modules/)
    expect(text).not.toMatch(/source-defined: 81/)
  })

  // Minor (final review round 2): the Build classification section had no
  // test at all -- an "honest zero" (no row anywhere has a buildClass yet)
  // reads identically to the section having silently gone missing unless
  // something pins the heading and all three rows down. All three counts
  // are genuinely 0 of 81 today; that is the correct value, not a
  // placeholder, and this test says so rather than treating 0 as absence.
  it('pins the Build classification section: heading plus all three honest-zero rows', () => {
    const { container } = render(<CoveragePage />)
    expect(screen.getByRole('heading', { name: 'Build classification' })).toBeDefined()
    const text = container.textContent ?? ''
    for (const label of ['Demonstrated in storyboard', 'Not applicable', 'Decision blocked']) {
      expect(text, label).toMatch(new RegExp(`${label}: 0 of 81 modules`))
    }
  })
})
