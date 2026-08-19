import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SA_INVARIANTS } from '@/surfaces/sa/invariants'
import { COMMAND_STATES } from '@/surfaces/sa/command-state'
import { InvariantChip } from '@/ui/sa/InvariantChip'
import { CommandStateBadge } from '@/ui/sa/CommandStateBadge'
import { ProhibitionNotice, type ProhibitionRendering } from '@/ui/sa/ProhibitionNotice'
import { PrototypeDisclosure } from '@/ui/sa/PrototypeDisclosure'

describe('InvariantChip — spec §3, the load-bearing rendering decision', () => {
  // Risk R2, guarded: the obvious design is a lock icon on a switch. A
  // disabled toggle implies an enabled state exists somewhere, which is
  // exactly the defect this test exists to prevent for EVERY one of the
  // six invariants, not just the first.
  it('renders every one of the six invariants as a status chip, never as a control', () => {
    for (const invariant of SA_INVARIANTS) {
      const { container, unmount } = render(<InvariantChip invariant={invariant} />)
      expect(container.querySelector('button'), invariant.id).toBeNull()
      expect(container.querySelector('input'), invariant.id).toBeNull()
      expect(container.querySelector('[role=switch]'), invariant.id).toBeNull()
      expect(container.querySelector('[tabindex]'), invariant.id).toBeNull()
      unmount()
    }
  })

  it('names the invariant and states it is enforced, in text', () => {
    const first = SA_INVARIANTS[0]!
    render(<InvariantChip invariant={first} />)
    expect(screen.getByText(new RegExp(`${first.name}.*enforced`, 'i'))).toBeDefined()
  })
})

describe('CommandStateBadge — the fifteen device command states', () => {
  it('renders every one of the fifteen states with its own name visible, and nothing rendered as a control', () => {
    for (const state of COMMAND_STATES) {
      const { container, unmount } = render(<CommandStateBadge state={state} />)
      expect(container.textContent?.toLowerCase(), state).toContain(state)
      expect(container.querySelector('button'), state).toBeNull()
      expect(container.querySelector('input'), state).toBeNull()
      unmount()
    }
  })

  it('never collapses a state into a different word — applied is never called complete, synced, sent or done', () => {
    render(<CommandStateBadge state="applied" />)
    const text = screen.getByText('applied').closest('span')?.textContent?.toLowerCase() ?? ''
    expect(text).not.toMatch(/complete|synced|sent|done/)
  })
})

describe('ProhibitionNotice — the three renderings, applied by rule', () => {
  it('ABSENT: draws nothing controllable, only a one-line note', () => {
    const rendering: ProhibitionRendering = {
      kind: 'absent',
      note: 'Atom creation does not exist for any account, including the root.',
    }
    const { container } = render(<ProhibitionNotice rendering={rendering} />)
    expect(screen.getByText(rendering.note)).toBeDefined()
    expect(container.querySelector('button')).toBeNull()
    expect(container.querySelector('input')).toBeNull()
    expect(container.querySelector('[role=switch]')).toBeNull()
  })

  it('DISABLED WITH A NAMED REASON: draws an inert control with the reason in text', () => {
    const rendering: ProhibitionRendering = {
      kind: 'disabled-with-reason',
      label: 'Create user',
      reason: 'User creation is root-only.',
    }
    render(<ProhibitionNotice rendering={rendering} />)
    const control = screen.getByText('Create user').closest('button')
    expect(control).not.toBeNull()
    expect(control?.getAttribute('aria-disabled')).toBe('true')
    expect(screen.getByText(rendering.reason)).toBeDefined()
  })

  it('CLASS BADGE: replaces the action bar, is not focusable, and names root approval', () => {
    const rendering: ProhibitionRendering = { kind: 'class-badge' }
    const { container } = render(<ProhibitionNotice rendering={rendering} />)
    expect(screen.getByText(/critical class.*root approval required/i)).toBeDefined()
    expect(container.querySelector('button')).toBeNull()
    expect(container.querySelector('[tabindex]')).toBeNull()
    // The collision resolution (spec §3): this reads as a status chip, not
    // a control implying an approval path — no `title`/tooltip attribute.
    expect(container.querySelector('[title]')).toBeNull()
  })

  // Step 7: a `disabled-with-reason` rendering with no reason must not
  // compile. This is a STATIC proof, not a runtime one -- `pnpm typecheck`
  // fails if the line below stops needing `@ts-expect-error` (e.g. if
  // `reason` were ever weakened to optional on that union arm).
  it('type system: disabled-with-reason with no reason does not compile', () => {
    // @ts-expect-error -- `reason` is required on the 'disabled-with-reason' arm; omitting it must not type-check.
    const invalid: ProhibitionRendering = { kind: 'disabled-with-reason', label: 'Create user' }
    expect(invalid).toBeDefined()
  })
})

describe('PrototypeDisclosure — every screen carries it', () => {
  it('never uses the words tamper-evident, chained, signed or verified', () => {
    const { container } = render(<PrototypeDisclosure />)
    const text = (container.textContent ?? '').toLowerCase()
    expect(text).not.toMatch(/tamper-evident/)
    expect(text).not.toMatch(/chained/)
    expect(text).not.toMatch(/signed/)
    expect(text).not.toMatch(/verified/)
  })

  it('states this is simulated, not a connected production system', () => {
    render(<PrototypeDisclosure />)
    expect(screen.getByText(/simulated/i)).toBeDefined()
  })
})
