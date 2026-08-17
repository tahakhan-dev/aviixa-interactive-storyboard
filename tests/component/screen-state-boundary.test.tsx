import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ScreenStateBoundary, type CommandState } from '@/ui/ScreenStateBoundary'
import { SCREEN_STATES } from '@/ui/screen-state'
import type { SurfaceId } from '@/domain/surfaces'
import type { PermissionDecision } from '@/policy/decision'

// A real, evaluator-produced decision -- used only to give STATE-05 a
// legitimate `detail.decision` in tests that aren't specifically about the
// missing-decision case. The boundary itself must never fabricate one of
// these (see BLOCKING 4 below).
const FIXTURE_DECISION: PermissionDecision = {
  outcome: 'explicitlyProhibited',
  reasonCode: 'ROLE_NOT_GRANTED',
  explanation: 'Test fixture: the signed-in role does not carry this action.',
  stage: 'BASE_ROLE',
  sourceRefs: [],
  auditExpectation: 'RECORDED_AS_REFUSAL',
  conditionToEnable: null,
}

describe('ScreenStateBoundary', () => {
  it('renders a distinguishable treatment for every one of the thirteen states', () => {
    const seen = new Set<string>()
    for (const s of SCREEN_STATES) {
      const detail =
        s.id === 'STATE-05'
          ? { objectLabel: 'scheduled runs', decision: FIXTURE_DECISION }
          : { objectLabel: 'scheduled runs' }
      const { container, unmount } = render(
        <ScreenStateBoundary state={s.id} surface="SURF-FL" detail={detail}>
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

  // BLOCKING 4(b): omitting detail.decision must never render a fabricated
  // governed denial. Before the fix, this rendered a specific, false,
  // auditable claim of outcome `explicitlyProhibited` at stage `BASE_ROLE`
  // with reason `ROLE_NOT_GRANTED` -- a claim no evaluator ever produced.
  it('throws rather than fabricating a decision when STATE-05 is rendered without detail.decision', () => {
    expect(() => render(<ScreenStateBoundary state="STATE-05" surface="SURF-DOH" />)).toThrow()
  })

  it('renders the supplied decision plainly when one is provided for STATE-05', () => {
    const { container } = render(
      <ScreenStateBoundary state="STATE-05" surface="SURF-DOH" detail={{ decision: FIXTURE_DECISION }} />,
    )
    expect(container.textContent).toContain(FIXTURE_DECISION.explanation)
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
  // Deferred finding: the original test exercised SURF-DOH only, which a
  // narrower implementation hard-coded to that one surface would also
  // satisfy. Loop over all four non-Frontline surfaces so this actually
  // proves the check is generic, and assert SURF-FL is exempt.
  it('throws on every non-Frontline surface asking for the offline state, and only those', () => {
    const nonFrontline: SurfaceId[] = ['SURF-SA', 'SURF-DOH', 'SURF-STU', 'SURF-CC']
    for (const surface of nonFrontline) {
      expect(
        () => render(<ScreenStateBoundary state="STATE-07" surface={surface} />),
        surface,
      ).toThrow(/only the frontline/i)
    }
    expect(() => render(<ScreenStateBoundary state="STATE-07" surface="SURF-FL" />)).not.toThrow()
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

  // BLOCKING 5: the test above only ever drove a non-terminal command state
  // ('available for delivery'), so it proved the boundary echoes its input,
  // never that a terminal state is refused. Drive every terminal member of
  // the canonical fifteen through STATE-09 and assert each is refused,
  // rather than silently rendered as "⏳applied" with a success tone.
  it('refuses to render a terminal command state under STATE-09 (Queued)', () => {
    const terminal: CommandState[] = [
      'applied', 'acknowledged', 'reconciled', 'rejected', 'failed', 'expired', 'cancelled', 'superseded',
    ]
    for (const commandState of terminal) {
      expect(
        () => render(<ScreenStateBoundary state="STATE-09" surface="SURF-FL" detail={{ commandState }} />),
        commandState,
      ).toThrow()
    }
  })

  it('still renders every non-terminal command state under STATE-09', () => {
    const nonTerminal: CommandState[] = [
      'created', 'authorized', 'queued', 'available for delivery', 'delivered', 'downloaded', 'validated',
    ]
    for (const commandState of nonTerminal) {
      const { container, unmount } = render(
        <ScreenStateBoundary state="STATE-09" surface="SURF-FL" detail={{ commandState }} />,
      )
      expect((container.textContent ?? '').toLowerCase(), commandState).toContain(commandState)
      unmount()
    }
  })
})
