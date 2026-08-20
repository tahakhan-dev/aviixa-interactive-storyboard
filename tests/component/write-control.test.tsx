import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WriteControl, type WriteControlProps } from '@/ui/WriteControl'
import { allow, decide, deny, type PermissionDecision } from '@/policy/decision'

/**
 * The four branches of the ONE shared write control, proven directly rather
 * than only through a module screen. Two Hub modules route their write
 * controls through this component; a change to the branch ORDER here changes
 * both at once, which is the point of lifting it and also the risk.
 *
 * This asserts the ORDER and the composition of the reasons. It deliberately
 * does NOT assert that a role-refused control renders absent rather than
 * disabled-with-a-reason: that question is unsettled in the frozen source,
 * and a test here would freeze it. What it pins is that the module's own
 * wording is what gets rendered, whatever the rendering turns out to be.
 *
 * The ONE part of that question which IS settled is pinned, because the
 * component used to get it wrong: `ROLE_NOT_GRANTED` is written for a
 * categorical prohibition AND for a grant this person held and no longer
 * holds, and those two render oppositely. The two decisions below differ only
 * in their OUTCOME, which is exactly the discrimination the component makes.
 */
const ROLE_REFUSED: PermissionDecision = deny('explicitlyProhibited', 'ROLE_NOT_GRANTED', undefined, {
  stage: 'BASE_ROLE',
  sourceRefs: [],
})

/**
 * A revoked grant, shaped as `evaluateStudioAccess` shapes one: the same
 * reason code as `ROLE_REFUSED`, outcome `unavailable`, and the revocation
 * named in the explanation the caller hands in (L34605).
 */
const GRANT_REVOKED: PermissionDecision = deny(
  'unavailable',
  'ROLE_NOT_GRANTED',
  'Workflow Authoring (GRANT-STU-AUTHOR) does not currently apply, because it was revoked.',
  {
    stage: 'BASE_ROLE',
    sourceRefs: ['L34605'],
    conditionToEnable: 'Ask your Tenant Admin to assign GRANT-STU-AUTHOR again.',
  },
)

const ALLOWED = allow('ALL_STAGES_PASSED', [])

function renderControl(over: Partial<WriteControlProps> = {}) {
  const onAct = vi.fn()
  const props: WriteControlProps = {
    label: 'Create a Site',
    decision: ALLOWED,
    roleName: 'Supervisor',
    gateReason: null,
    objectReason: null,
    refusalNote: 'MODULE REFUSAL NOTE',
    neverQueuedNote: 'a structural change with no audit entry would be unaccountable',
    onAct,
    ...over,
  }
  render(<WriteControl {...props} />)
  return onAct
}

describe('WriteControl', () => {
  it('renders the module’s own note, and no control at all, for a role-refused decision', () => {
    renderControl({ decision: ROLE_REFUSED })
    expect(screen.getByRole('note').textContent).toBe('MODULE REFUSAL NOTE')
    expect(screen.queryByRole('button')).toBeNull()
  })

  // FAILS IF: the ABSENT branch goes back to keying on the reason code alone.
  // A person whose grant was revoked would then be shown the note that says
  // the capability exists for nobody -- told it never existed, rather than
  // that it was taken away.
  it('disables with the revocation named, never absent, for a revoked grant', () => {
    renderControl({ decision: GRANT_REVOKED })
    expect(screen.queryByRole('note'), 'a revoked grant rendered as ABSENT').toBeNull()
    const button = screen.getByRole('button')
    expect(button.getAttribute('aria-disabled')).toBe('true')
    expect(document.body.textContent).toContain('does not currently apply, because it was revoked.')
    expect(document.body.textContent).toContain('Ask your Tenant Admin to assign GRANT-STU-AUTHOR again.')
  })

  it('disables with the module’s D7 clause, the condition and the role for any other refusal', () => {
    renderControl({
      decision: decide('unavailable', 'TENANT_SUSPENDED', 'The workspace is suspended.', {
        stage: 'FEATURE_AND_SUSPENSION',
        sourceRefs: [],
        conditionToEnable: 'Restore the workspace to active.',
      }),
    })
    const button = screen.getByRole('button')
    expect(button.getAttribute('aria-disabled')).toBe('true')
    expect(document.body.textContent).toContain(
      'The workspace is suspended. Restore the workspace to active. Nothing here is queued — never queued, in any state — because a structural change with no audit entry would be unaccountable (D7). Viewing as Supervisor.',
    )
  })

  it('prefers the tenant-state gate over the object condition when both refuse', () => {
    renderControl({ gateReason: 'GATE REASON', objectReason: 'OBJECT REASON' })
    expect(document.body.textContent).toContain('GATE REASON')
    expect(document.body.textContent).not.toContain('OBJECT REASON')
  })

  it('disables with the object condition once the gate is open', () => {
    renderControl({ objectReason: 'OBJECT REASON' })
    expect(screen.getByRole('button').getAttribute('aria-disabled')).toBe('true')
    expect(document.body.textContent).toContain('OBJECT REASON')
  })

  it('acts only when the decision, the gate and the object all permit it', () => {
    const onAct = renderControl()
    fireEvent.click(screen.getByRole('button'))
    expect(onAct).toHaveBeenCalledTimes(1)
  })

  it('never calls onAct through a refused control', () => {
    const onAct = renderControl({ gateReason: 'GATE REASON' })
    fireEvent.click(screen.getByRole('button'))
    expect(onAct).not.toHaveBeenCalled()
  })
})
