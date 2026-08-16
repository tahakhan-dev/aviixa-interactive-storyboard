import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusPill } from '@/ui/primitives/StatusPill'
import { Banner } from '@/ui/primitives/Banner'
import { EmptyState } from '@/ui/primitives/EmptyState'
import { SkeletonBlock } from '@/ui/primitives/SkeletonBlock'
import { FreshnessLabel } from '@/ui/primitives/FreshnessLabel'
import { PermissionNotice } from '@/ui/primitives/PermissionNotice'
import { allow, deny, decide } from '@/policy/decision'

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

  // Fix round 1, Finding 2: the brief's literal source called
  // `deny('readOnly', ...)` in a test titled "renders nothing for a
  // permitted decision", yet asserted the explanation text WAS present —
  // the title contradicted its own assertion. `readOnly` is permitted-read
  // but still needs its cause named (it goes through `decide`, since `deny`
  // only accepts genuine refusals per RULING 1), so the title now says what
  // the test actually verifies.
  it('PermissionNotice states the cause for a read-only decision, which is permissive but still needs its reason named', () => {
    const d = decide('readOnly', 'READ_ONLY_RECORD', undefined, { stage: 'BASE_ROLE', sourceRefs: ['x'] })
    const { container } = render(<PermissionNotice decision={d} />)
    expect(container.textContent).toContain(d.explanation)
  })

  // A fully `allowed` decision needs no explanation surfaced — there is
  // nothing to account for.
  it('PermissionNotice renders nothing for a fully allowed decision', () => {
    const d = allow('BASE_ROLE', ['x'])
    const { container } = render(<PermissionNotice decision={d} />)
    expect(container.textContent).toBe('')
  })
})
