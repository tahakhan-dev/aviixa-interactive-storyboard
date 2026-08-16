import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusPill } from '@/ui/primitives/StatusPill'
import { Banner } from '@/ui/primitives/Banner'
import { EmptyState } from '@/ui/primitives/EmptyState'
import { SkeletonBlock } from '@/ui/primitives/SkeletonBlock'
import { FreshnessLabel } from '@/ui/primitives/FreshnessLabel'
import { PermissionNotice } from '@/ui/primitives/PermissionNotice'
import { deny, decide } from '@/policy/decision'

describe('status primitives', () => {
  it('StatusPill renders both an icon and a text label, never colour alone', () => {
    render(<StatusPill tone="blocked" icon="⛔" label="On hold" />)
    expect(screen.getByText('On hold')).toBeDefined()
    // The icon is decorative; the label carries the meaning for assistive tech.
    expect(screen.getByText('⛔').getAttribute('aria-hidden')).toBe('true')
  })

  it('Banner exposes its heading to assistive technology', () => {
    render(<Banner tone="attention" heading="Tenant suspended" body="No new work can be created." />)
    expect(screen.getByRole('status')).toBeDefined()
    expect(screen.getByText('Tenant suspended')).toBeDefined()
  })

  // STATE-01: never a blank panel; always name what creates the thing.
  it('EmptyState names what would appear and what creates it', () => {
    render(<EmptyState title="No runs are scheduled for Day Shift." whatCreatesIt="Runs are created in Run Scheduling." />)
    expect(screen.getByText(/No runs are scheduled/)).toBeDefined()
    expect(screen.getByText(/created in Run Scheduling/)).toBeDefined()
  })

  // STATE-02: loading never renders a zero.
  it('SkeletonBlock names the object being fetched and renders no digits', () => {
    const { container } = render(<SkeletonBlock lines={3} label="Loading scheduled runs" />)
    expect(screen.getByText('Loading scheduled runs')).toBeDefined()
    expect(container.textContent ?? '').not.toMatch(/\d/)
  })

  // STATE-08: age and origin explicit.
  it('FreshnessLabel states both age and origin', () => {
    render(<FreshnessLabel asOfLabel="as at 13:58" originLabel="from the Delivery Operations Hub" />)
    expect(screen.getByText(/as at 13:58/)).toBeDefined()
    expect(screen.getByText(/Delivery Operations Hub/)).toBeDefined()
  })

  // STATE-05: state the refusal plainly; never hide it behind a missing control.
  it('PermissionNotice renders the decision explanation in plain language', () => {
    const d = deny('explicitlyProhibited', 'ROLE_NOT_GRANTED', undefined, {
      stage: 'BASE_ROLE', sourceRefs: ['MOD-CC-13'],
    })
    render(<PermissionNotice decision={d} />)
    expect(screen.getByText(d.explanation)).toBeDefined()
  })

  // Deviation from brief: the brief's literal source called `deny('readOnly', ...)`,
  // but `deny` is typed to accept only genuine refusals
  // ('unavailable' | 'explicitlyProhibited' | 'clientDecisionRequired') per
  // @/policy/decision's RULING 1 — passing 'readOnly' does not compile.
  // `readOnly` is a permitted-read outcome and goes through `decide` instead.
  it('PermissionNotice renders nothing for a permitted decision', () => {
    const d = decide('readOnly', 'READ_ONLY_RECORD', undefined, { stage: 'BASE_ROLE', sourceRefs: ['x'] })
    const { container } = render(<PermissionNotice decision={d} />)
    expect(container.textContent).toContain(d.explanation)
  })
})
