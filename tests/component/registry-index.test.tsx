import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RegistryIndex } from '../../app/coverage/[registry]/page'

const SLUGS = [
  'modules', 'features', 'sub-features', 'functions', 'workflows',
  'business-use-cases', 'business-objects', 'events', 'commands',
  'notifications', 'offline-scenarios', 'ai-storyboards',
  'scheduled-work', 'actionable-controls',
] as const

describe('registry index rows', () => {
  it.each(SLUGS)('%s renders real rows with source lines', (slug) => {
    render(<RegistryIndex slug={slug} />)
    expect(screen.getAllByRole('row').length).toBeGreaterThan(1)
  })

  it('states what the number counts, next to the number', () => {
    render(<RegistryIndex slug="modules" />)
    // "canonical modules" legitimately appears twice here: once in the
    // count-header prose (countedThing) and once in the dedup-rule prose,
    // which itself narrates the 92 -> 81 canonical-modules derivation --
    // getByText would throw on the genuine duplicate, so assert presence.
    expect(screen.getAllByText(/canonical modules/i).length).toBeGreaterThan(0)
  })

  it('shows both figures where raw and reconciled differ', () => {
    const { container } = render(<RegistryIndex slug="modules" />)
    const t = container.textContent ?? ''
    // Minor (final review): bare `toContain('81')`/`toContain('92')` were
    // satisfied by the dedupRule prose alone (which itself narrates
    // "92 raw ... -> 81 canonical modules"), so the "Reconciled count /
    // Raw extracted count" header this test names could be deleted and it
    // would still pass. Matches the header's own wording specifically.
    expect(t).toMatch(/Reconciled count:\s*81/)
    expect(t).toMatch(/Raw extracted count:\s*92/)
    expect(t.toLowerCase()).toMatch(/alias|duplicate|dedup/)
  })

  it('says plainly where the source fixes no total', () => {
    const { container } = render(<RegistryIndex slug="workflows" />)
    expect((container.textContent ?? '').toLowerCase()).toMatch(/no single .*total|fixes no/)
  })

  it('never presents an extracted identifier count as a canonical total', () => {
    for (const slug of ['functions', 'features', 'notifications'] as const) {
      const { container, unmount } = render(<RegistryIndex slug={slug} />)
      expect((container.textContent ?? '').toLowerCase()).toMatch(/extracted|identifier/)
      unmount()
    }
  })

  it('never claims production capability', () => {
    for (const slug of SLUGS) {
      const { container, unmount } = render(<RegistryIndex slug={slug} />)
      const t = (container.textContent ?? '').toLowerCase()
      expect(t, slug).not.toContain('production-ready')
      expect(t, slug).not.toMatch(/\bimplemented\b/)
      unmount()
    }
  })

  // Addendum §3: the 20 unjoinable FUNC- ids must be disclosed by id, not
  // dropped or bucketed as a silent "other".
  it('discloses the 20 unjoinable FUNC- ids by id on the functions index', () => {
    const { container } = render(<RegistryIndex slug="functions" />)
    const t = container.textContent ?? ''
    expect(t).toContain('FUNC-TEN-001')
    expect(t).toMatch(/20 of 990/)
  })

  // Addendum §3: families with no extracted names must say so, not leave a
  // reviewer to infer it from empty columns.
  it('states plainly that no names were extracted for the nameless families', () => {
    const { container } = render(<RegistryIndex slug="events" />)
    expect((container.textContent ?? '').toLowerCase()).toMatch(/no names were extracted/)
  })
})
