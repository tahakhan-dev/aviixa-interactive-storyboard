import { describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, fireEvent, within } from '@testing-library/react'

import { allow, deny, type PermissionDecision } from '@/policy/decision'
import { WriteControl, type WriteControlProps } from '@/ui/WriteControl'
import {
  CcFallbackLibrary,
  GateItemDecision,
  FrozenSessionBanner,
  type GateItemDecisionProps,
} from '@/surfaces/cc/fallback/CcFallbackDisclosure'
import { CC_FALLBACK_PATTERNS } from '@/surfaces/cc/fallback/patterns'
import { CC_FROZEN_CONTROL_REASON, frozenBannerText } from '@/surfaces/cc/fallback/session'

/**
 * `FB-CC-QUEUE`'s not-decidable rendering and `FB-CC-SESS`'s frozen board,
 * on screen.
 *
 * THE REASON IS READ THROUGH `aria-describedby`, NEVER OFF `textContent`.
 * `Button` renders its `disabledReason` into a separate element wired to the
 * control; `document.body.textContent` welds that element to the item-level
 * notice above it, so a check written that way passes when EITHER of the two
 * carries the missing element's name and cannot tell which. Resolving the id
 * reads exactly one of them.
 *
 * THE MISSING ELEMENT IS NAMED IN TWO PLACES ON PURPOSE — at the item, and
 * on the control — because the source states both obligations: the item "is
 * rendered as not decidable, with the missing element named" and "its
 * decision controls are disabled" (L35670). Two protections against one
 * defect cannot be verified one at a time, so the plant campaign removed
 * each of them and then both.
 */

const ALLOWED = allow('ALL_STAGES_PASSED', [])

const ROLE_REFUSED: PermissionDecision = deny(
  'explicitlyProhibited',
  'ROLE_NOT_GRANTED',
  undefined,
  { stage: 'BASE_ROLE', sourceRefs: [] },
)

const GRANT_REVOKED: PermissionDecision = deny(
  'unavailable',
  'ROLE_NOT_GRANTED',
  'Gate decision does not currently apply, because it was revoked.',
  { stage: 'BASE_ROLE', sourceRefs: [], conditionToEnable: 'Ask your Tenant Admin.' },
)

function renderControl(over: Partial<WriteControlProps> = {}) {
  cleanup()
  const onAct = vi.fn()
  render(
    <WriteControl
      label="Approve"
      decision={ALLOWED}
      roleName="Supervisor"
      gateReason={null}
      objectReason={null}
      refusalNote="MODULE REFUSAL NOTE"
      neverQueuedNote="a decision taken on unknown state is a decision taken blind"
      onAct={onAct}
      {...over}
    />,
  )
  return onAct
}

/** The one text the control itself carries, unwelded from anything near it. */
function controlReason(): string {
  const button = screen.getByRole('button')
  const id = button.getAttribute('aria-describedby')
  expect(id, 'the control carries no reason element at all').not.toBeNull()
  const reason = document.getElementById(id ?? '')
  expect(reason, `no element with id ${id ?? ''}`).not.toBeNull()
  // A `hidden` reason is a reason nobody reads. `getByRole` would skip it;
  // reading the element directly would not, so it is asserted here.
  expect(reason?.hidden, 'the reason element is hidden').toBe(false)
  return reason?.textContent ?? ''
}

describe('WriteControl — the fifth branch, FB-CC-QUEUE’s not-decidable item', () => {
  // FAILS IF: the branch is removed. Planted: the whole `missingElement`
  // block deleted from `src/ui/WriteControl.tsx`.
  it('disables the control and names the element that could not be resolved', () => {
    renderControl({ missingElement: 'the scope of impact' })
    expect(screen.getByRole('button').getAttribute('aria-disabled')).toBe('true')
    expect(controlReason()).toContain('Not decidable — the scope of impact could not be resolved.')
  })

  // FAILS IF: the branch queues the intent instead of refusing it. The
  // never-queued sentence is the surface's honesty rule and `AC-CC-091`
  // is asserted against it.
  it('carries the module’s never-queued clause on the disabled control', () => {
    renderControl({ missingElement: 'the evidence' })
    expect(controlReason()).toContain(
      'Nothing here is queued — never queued, in any state — because a decision taken on unknown state is a decision taken blind (D7).',
    )
  })

  it('never calls onAct through a not-decidable control', () => {
    const onAct = renderControl({ missingElement: 'the evidence' })
    fireEvent.click(screen.getByRole('button'))
    expect(onAct).not.toHaveBeenCalled()
  })

  /**
   * THE FOUR EXISTING BRANCHES ARE UNCHANGED, which is the whole condition
   * of extending a component every surface renders through. Each case below
   * ALSO sets `missingElement`, so a branch inserted ahead of one of them
   * rather than after all four turns this red.
   *
   * FAILS IF: the new branch is moved earlier. Planted: the `missingElement`
   * block moved above the `explicitlyProhibited` branch — the categorical
   * refusal then drew a disabled control where it must draw nothing.
   */
  it('leaves a categorical role refusal absent, even with the context incomplete', () => {
    renderControl({ decision: ROLE_REFUSED, missingElement: 'the scope of impact' })
    expect(screen.getByRole('note').textContent).toBe('MODULE REFUSAL NOTE')
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('leaves a revoked grant on its own reason, even with the context incomplete', () => {
    renderControl({ decision: GRANT_REVOKED, missingElement: 'the scope of impact' })
    const reason = controlReason()
    expect(reason).toContain('does not currently apply, because it was revoked.')
    expect(reason, 'the item’s missing context displaced the person’s own refusal').not.toContain(
      'Not decidable',
    )
  })

  it('leaves the tenant gate ahead of it', () => {
    renderControl({ gateReason: 'GATE REASON', missingElement: 'the scope of impact' })
    expect(controlReason()).toBe('GATE REASON')
  })

  it('leaves the object condition ahead of it', () => {
    renderControl({ objectReason: 'OBJECT REASON', missingElement: 'the scope of impact' })
    expect(controlReason()).toBe('OBJECT REASON')
  })

  it('acts normally when the context is complete', () => {
    const onAct = renderControl()
    fireEvent.click(screen.getByRole('button'))
    expect(onAct).toHaveBeenCalledTimes(1)
  })
})

function renderItem(over: Partial<GateItemDecisionProps> = {}) {
  cleanup()
  const onAct = vi.fn()
  render(
    <GateItemDecision
      label="Approve"
      decision={ALLOWED}
      roleName="Supervisor"
      refusalNote="MODULE REFUSAL NOTE"
      neverQueuedNote="a decision taken on unknown state is a decision taken blind"
      sessionState="live"
      raisedAtMinute={41}
      nowMinute={58}
      onAct={onAct}
      {...over}
    />,
  )
  return onAct
}

describe('GateItemDecision — the item, under both mechanisms', () => {
  /**
   * The waiting time is the obligation that a disabled control is most
   * likely to lose: an item that cannot be decided still ages, and the
   * clock it keeps is its ORIGINAL one (L35670, L35702).
   *
   * FAILS IF: the clock stops when the item cannot be decided. Planted:
   * `const waitingMinutes = missingElement === undefined ? nowMinute -
   * raisedAtMinute : 0` in `CcFallbackDisclosure.tsx`.
   */
  it('keeps one waiting time across decidable, not-decidable and frozen', () => {
    const read = (): string => screen.getByText(/^Waiting /).textContent ?? ''
    renderItem()
    const decidable = read()
    expect(decidable).toBe('Waiting 17 min')
    renderItem({ missingElement: 'the scope of impact' })
    expect(read(), 'the clock stopped because the item could not be decided').toBe(decidable)
    renderItem({ sessionState: 'frozen' })
    expect(read(), 'the clock stopped because the session froze').toBe(decidable)
    renderItem({ sessionState: 'frozen', missingElement: 'the evidence' })
    expect(read()).toBe(decidable)
  })

  /**
   * PROTECTION ONE of two. FAILS IF: the item-level notice stops naming the
   * element. Planted separately from the control's, and then both together —
   * with only one planted, the surviving one still names it, which is why
   * neither could be verified alone.
   */
  it('names the missing element at the item, in its own element', () => {
    renderItem({ missingElement: 'the scope of impact' })
    const note = screen.getByRole('status')
    expect(note.textContent).toContain(
      'Not decidable — the scope of impact could not be resolved.',
    )
    expect(note.textContent).toContain('never silently expires')
  })

  /** PROTECTION TWO of two, read off the control alone. */
  it('names the missing element on the control, independently of the item note', () => {
    renderItem({ missingElement: 'the scope of impact' })
    expect(controlReason()).toContain('Not decidable — the scope of impact could not be resolved.')
  })

  it('says nothing about decidability when the context is complete', () => {
    renderItem()
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.getByRole('button').getAttribute('aria-disabled')).toBeNull()
  })

  /**
   * `FB-CC-SESS`. FAILS IF: a frozen session leaves a decision control
   * actionable. Planted: `sessionState === 'frozen' ? ... : null` inverted
   * to always `null` in `CcFallbackDisclosure.tsx`.
   */
  it('disables the decision control while the session is frozen, with the reason shown', () => {
    const onAct = renderItem({ sessionState: 'frozen' })
    expect(screen.getByRole('button').getAttribute('aria-disabled')).toBe('true')
    expect(controlReason()).toBe(CC_FROZEN_CONTROL_REASON)
    fireEvent.click(screen.getByRole('button'))
    expect(onAct).not.toHaveBeenCalled()
  })

  it('keeps a frozen session ahead of an incomplete item, and still names the element', () => {
    renderItem({ sessionState: 'frozen', missingElement: 'the evidence' })
    expect(controlReason()).toBe(CC_FROZEN_CONTROL_REASON)
    expect(screen.getByRole('status').textContent).toContain('the evidence could not be resolved')
  })
})

describe('FrozenSessionBanner and the library, on screen', () => {
  it('renders SB-CC-05’s banner with the last update time it was handed', () => {
    cleanup()
    render(<FrozenSessionBanner lastUpdate="11:13:52" />)
    const section = screen.getByRole('region', { name: 'Session frozen' })
    expect(within(section).getByText(frozenBannerText('11:13:52'))).toBeDefined()
  })

  /**
   * FAILS IF: the rendered table drifts from the registry. The row count is
   * taken off the rendered `tbody` rather than off `CC_FALLBACK_PATTERNS
   * .length` compared to itself, and each row's cells are read WITHIN that
   * row, so `textContent` cannot weld one row's terminal safe state onto the
   * next row's trigger.
   */
  it('renders nine rows, one per pattern, cells read within their own row', () => {
    cleanup()
    render(<CcFallbackLibrary />)
    const table = screen.getByRole('table')
    const bodyRows = within(table).getAllByRole('row').slice(1)
    expect(bodyRows).toHaveLength(9)
    expect(bodyRows).toHaveLength(CC_FALLBACK_PATTERNS.length)

    bodyRows.forEach((row, index) => {
      const pattern = CC_FALLBACK_PATTERNS[index]
      expect(pattern).toBeDefined()
      const header = within(row).getByRole('rowheader')
      expect(header.textContent).toBe(pattern?.id)
      const cells = within(row).getAllByRole('cell').map((c) => c.textContent)
      expect(cells.slice(0, 4)).toEqual([
        pattern?.triggeringCondition,
        pattern?.decisionControls,
        pattern?.clientSideQueueing,
        pattern?.terminalSafeState,
      ])
    })
  })

  // FAILS IF: the disclosure stops warning about the numbered look-alikes.
  it('says on screen that the two numbered look-alikes are not members', () => {
    cleanup()
    render(<CcFallbackLibrary />)
    const section = screen.getByRole('region', {
      name: 'Command Center fallback pattern library',
    })
    expect(within(section).getByText(/FB-CC-001 \(L11414\)/)).toBeDefined()
    expect(within(section).getByText(/FB-CC-002 \(L13846\)/)).toBeDefined()
  })
})
