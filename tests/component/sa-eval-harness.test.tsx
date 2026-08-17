import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { SCREEN_STATES } from '@/ui/screen-state'
import { saModuleById } from '@/surfaces/sa/modules'
import { EvalHarnessScreen } from '../../app/super-admin/eval-harness/EvalHarnessScreen'
import {
  EVAL_PLATFORM_ROLES,
  EVAL_SCENARIOS,
  SCENARIO_VERDICTS,
  EVAL_RUN_STATES,
  CANARY_RUN_STATES,
  EVAL_UNSPECIFIED_IN_SOURCE,
} from '../../app/super-admin/eval-harness/fixtures'

const MODULE = saModuleById('MOD-SA-05')

/** The twelve applicable screen states: all thirteen less frontline-only STATE-07. */
const APPLICABLE_STATES = SCREEN_STATES.filter((s) => !s.frontlineOnly)

/**
 * Every interactive element on the page. Used by the ABSENT gates: a
 * prohibition that renders as ABSENT must draw NO control — a note only.
 * Prose that merely mentions "enablement" is not a violation; a control is.
 */
function interactiveText(container: HTMLElement): string[] {
  return Array.from(
    container.querySelectorAll('button, a, input, select, [role=switch], [role=button]'),
  ).map((el) => `${el.textContent ?? ''} ${el.getAttribute('aria-label') ?? ''}`)
}

describe('MOD-SA-05 Eval Harness — the shell contract', () => {
  it('renders under the console shell with band and module id as an annotation, and exactly one h1', () => {
    render(<EvalHarnessScreen />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(MODULE.name)
    expect(screen.getByText(/MOD-SA-05 · Definition layer/)).toBeDefined()
  })

  it('carries the prototype disclosure', () => {
    render(<EvalHarnessScreen />)
    expect(screen.getByText(/Simulated behaviour only/i)).toBeDefined()
  })

  it('annotates the screen numbers without ever keying a route on one', () => {
    const { container } = render(<EvalHarnessScreen />)
    expect(screen.getByText(/SCR-SA-06/)).toBeDefined()
    for (const el of Array.from(container.querySelectorAll('a[href]'))) {
      expect(el.getAttribute('href')).not.toMatch(/SCR-SA-\d+/i)
    }
  })

  // Every role AND every applicable state: the refusal copy that carries the
  // greatest risk of a banned word only renders for two of the four roles,
  // and some of it only in particular states. A single default-role render
  // reports the module clean for a property it never exercised.
  it.each(EVAL_PLATFORM_ROLES)(
    'names none of the four forbidden words anywhere in its copy, in every state — $roleAnnotation',
    (role) => {
      for (const state of APPLICABLE_STATES) {
        const { container, unmount } = render(
          <EvalHarnessScreen role={role.id} screenState={state.id} />,
        )
        expect(container.textContent ?? '', `${role.id} / ${state.id}`).not.toMatch(
          /\b(tamper-evident|chained|signed|verified)\b/i,
        )
        unmount()
      }
    },
  )

  it('resolves no link to record-level tenant content', () => {
    const { container } = render(<EvalHarnessScreen />)
    for (const el of Array.from(container.querySelectorAll('a[href]'))) {
      expect(el.getAttribute('href')).toMatch(/^\/super-admin\//)
    }
    expect(screen.getByText(/named access class/i)).toBeDefined()
  })
})

describe('MOD-SA-05 — the four panels the source closes at L108982', () => {
  it('renders the scenario list, suite runner, gate view and drift canary panel', () => {
    render(<EvalHarnessScreen />)
    for (const name of [
      /Scenario list/i,
      /Suite runner/i,
      /Gate view/i,
      /Drift canary/i,
    ]) {
      expect(screen.getByRole('region', { name })).toBeDefined()
    }
  })

  it('shows scenario pending, passing and failing states, using the closed verdict set', () => {
    render(<EvalHarnessScreen />)
    expect(SCENARIO_VERDICTS).toEqual(['pending', 'passing', 'failing'])
    const list = screen.getByRole('region', { name: /Scenario list/i })
    for (const verdict of SCENARIO_VERDICTS) {
      expect(within(list).getAllByText(new RegExp(verdict, 'i')).length).toBeGreaterThan(0)
    }
    for (const s of EVAL_SCENARIOS) {
      expect(within(list).getByText(s.name), s.id).toBeDefined()
    }
  })

  it('keeps the eval-run and canary vocabularies closed at the source values', () => {
    expect(EVAL_RUN_STATES).toEqual(['queued', 'running', 'completed', 'errored'])
    expect(CANARY_RUN_STATES).toEqual(['scheduled', 'ran', 'misfired'])
  })

  it('reads the gate view as a blocking list naming the failing scenario, never a score or a rate', () => {
    const { container } = render(<EvalHarnessScreen />)
    const gate = screen.getByRole('region', { name: /Gate view/i })
    expect(within(gate).getByText(/Blocked by/i)).toBeDefined()
    expect(container.textContent ?? '').not.toMatch(/pass rate|per-worker|per worker|score of/i)
    expect(gate.textContent ?? '').not.toMatch(/\d+\s?%/)
  })

  it('renders the canary cadence as required-and-unset, with its last run and verdict always displayed', () => {
    render(<EvalHarnessScreen />)
    const canary = screen.getByRole('region', { name: /Drift canary/i })
    expect(within(canary).getByText(/Not yet set — DEC-CANARY-001/i)).toBeDefined()
    expect(within(canary).getByText(/Last run/i)).toBeDefined()
    expect(within(canary).getByText(/Verdict/i)).toBeDefined()
    expect(within(canary).getByText(/Named owner/i)).toBeDefined()
  })
})

describe('MOD-SA-05 — the evaluation gate is an invariant, never a control', () => {
  it('renders the enforced invariants as status chips with no control of any kind', () => {
    render(<EvalHarnessScreen />)
    const region = screen.getByRole('region', { name: /Enforced invariants/i })
    expect(region.querySelector('button')).toBeNull()
    expect(region.querySelector('input')).toBeNull()
    expect(region.querySelector('[role=switch]')).toBeNull()
    expect(region.querySelector('[tabindex]')).toBeNull()
    expect(within(region).getByText(/The evaluation gate — ENFORCED/)).toBeDefined()
  })

  it.each(EVAL_PLATFORM_ROLES)(
    'offers no enablement control at all while a scenario fails — $roleAnnotation',
    (role) => {
      const { container } = render(<EvalHarnessScreen role={role.id} />)
      for (const text of interactiveText(container)) {
        expect(text, `interactive element offered to ${role.id}`).not.toMatch(
          /enable|enablement|publish|distribute/i,
        )
      }
      expect(screen.getByText(/No enablement control is offered here/i)).toBeDefined()
    },
  )

  it.each(EVAL_PLATFORM_ROLES)(
    'offers no control that disables the gate, weakens a verdict or accepts a failure — $roleAnnotation',
    (role) => {
      const { container } = render(<EvalHarnessScreen role={role.id} />)
      for (const text of interactiveText(container)) {
        expect(text, `interactive element offered to ${role.id}`).not.toMatch(
          /disable|override|accept|waive|edit|delete|dismiss/i,
        )
      }
    },
  )

  it('draws a one-line note where each absent control would be', () => {
    render(<EvalHarnessScreen />)
    const absences = screen.getByRole('region', { name: /Controls that do not exist/i })
    for (const phrase of [
      /disables the evaluation gate/i,
      /weaken/i,
      /edited or deleted/i,
      /trace viewer/i,
    ]) {
      expect(within(absences).getAllByText(phrase).length).toBeGreaterThan(0)
    }
    expect(absences.querySelector('button')).toBeNull()
  })
})

describe('MOD-SA-05 — per-control allowed roles, through evaluateAccess', () => {
  it.each([
    ['PLATFORM_ENGINEER', true],
    ['ROOT_SUPER_ADMIN', true],
    ['ADMIN', false],
    ['SUPPORT', false],
  ] as const)('renders the suite runner for %s as actionable=%s', (roleId, actionable) => {
    render(<EvalHarnessScreen role={roleId} />)
    const runner = screen.getByRole('region', { name: /Suite runner/i })
    const run = within(runner).getByRole('button', { name: /Run scenario/i })
    if (actionable) {
      expect(run.getAttribute('aria-disabled')).toBeNull()
    } else {
      // DISABLED WITH A NAMED REASON: drawn, inert, reason in text.
      expect(run.getAttribute('aria-disabled')).toBe('true')
      const describedBy = run.getAttribute('aria-describedby')
      expect(describedBy).not.toBeNull()
      const reason = document.getElementById(describedBy ?? '')
      expect(reason?.textContent ?? '').toMatch(/engineering|Support/i)
    }
  })

  it('shows every role the gate view, and refuses the canary panel detail to Support with its reason named', () => {
    for (const role of EVAL_PLATFORM_ROLES) {
      const { unmount } = render(<EvalHarnessScreen role={role.id} />)
      expect(screen.getByRole('region', { name: /Gate view/i })).toBeDefined()
      const canary = screen.getByRole('region', { name: /Drift canary/i })
      if (role.id === 'SUPPORT') {
        expect(within(canary).getByRole('note').textContent ?? '').toMatch(/role/i)
      } else {
        expect(within(canary).getByText(/Not yet set — DEC-CANARY-001/i)).toBeDefined()
      }
      unmount()
    }
  })

  it('names every one of the four platform roles as a view switcher, never a login', () => {
    render(<EvalHarnessScreen />)
    expect(EVAL_PLATFORM_ROLES).toHaveLength(4)
    const selector = screen.getByLabelText(/Console role/i)
    for (const role of EVAL_PLATFORM_ROLES) {
      expect(within(selector).getByText(new RegExp(role.roleAnnotation))).toBeDefined()
    }
    expect(screen.getByText(/view switcher, not a login/i)).toBeDefined()
  })
})

describe('MOD-SA-05 — the twelve applicable screen states', () => {
  it('offers all twelve, and never the frontline-only STATE-07', () => {
    render(<EvalHarnessScreen />)
    const selector = screen.getByLabelText(/Screen state/i)
    expect(within(selector).queryByText(/STATE-07/)).toBeNull()
    for (const state of APPLICABLE_STATES) {
      expect(within(selector).getByText(new RegExp(state.id)), state.id).toBeDefined()
    }
    expect(within(selector).getAllByRole('option')).toHaveLength(12)
  })

  it.each(APPLICABLE_STATES.map((s) => s.id))('renders %s without losing the module', (stateId) => {
    render(<EvalHarnessScreen screenState={stateId} />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('region', { name: /Gate view/i })).toBeDefined()
  })

  it('STATE-11: with every model unavailable the module remains operable and enablement stays blocked', () => {
    render(<EvalHarnessScreen role="PLATFORM_ENGINEER" screenState="STATE-11" />)
    // Operable: the deterministic scenarios can still be run.
    const runner = screen.getByRole('region', { name: /Suite runner/i })
    expect(
      within(runner).getByRole('button', { name: /Run scenario/i }).getAttribute('aria-disabled'),
    ).toBeNull()
    // AC-SA-05-09: agent-behaviour scenarios render unable-to-run, never passing.
    const list = screen.getByRole('region', { name: /Scenario list/i })
    const agentRows = EVAL_SCENARIOS.filter((s) => s.agentBehaviour)
    expect(agentRows.length).toBeGreaterThan(0)
    for (const s of agentRows) {
      const row = within(list).getByText(s.name).closest('tr')
      expect(row?.textContent ?? '', s.id).toMatch(/Unable to run/i)
      expect(row?.textContent ?? '', s.id).not.toMatch(/passing/i)
    }
    // And the gate still blocks.
    expect(screen.getByText(/No enablement control is offered here/i)).toBeDefined()
  })

  it('STATE-11 keeps the deterministic scenarios readable rather than blanking them', () => {
    render(<EvalHarnessScreen screenState="STATE-11" />)
    const list = screen.getByRole('region', { name: /Scenario list/i })
    const deterministic = EVAL_SCENARIOS.filter((s) => !s.agentBehaviour)
    for (const s of deterministic) {
      const row = within(list).getByText(s.name).closest('tr')
      expect(row?.textContent ?? '', s.id).not.toMatch(/Unable to run/i)
    }
  })

  it('STATE-12: harness unavailability blocks enablement and never permits it', () => {
    render(<EvalHarnessScreen role="PLATFORM_ENGINEER" screenState="STATE-12" />)
    const runner = screen.getByRole('region', { name: /Suite runner/i })
    expect(
      within(runner).getByRole('button', { name: /Run scenario/i }).getAttribute('aria-disabled'),
    ).toBe('true')
    expect(screen.getByText(/Failure to evaluate is failure to enable/i)).toBeDefined()
  })

  it('STATE-09: an accepted run renders in its true eval-run state, never as completed', () => {
    render(<EvalHarnessScreen screenState="STATE-09" />)
    const runner = screen.getByRole('region', { name: /Suite runner/i })
    expect(within(runner).getByText(/queued/i)).toBeDefined()
  })

  it('STATE-06: one banner, one cause', () => {
    render(<EvalHarnessScreen screenState="STATE-06" />)
    expect(screen.getAllByRole('status').filter((n) => /read-only/i.test(n.textContent ?? ''))).toHaveLength(1)
  })
})

describe('MOD-SA-05 — aggregates never render as zero or blank', () => {
  it('STATE-03 renders the posture aggregate with an as-of timestamp', () => {
    render(<EvalHarnessScreen screenState="STATE-03" />)
    const posture = screen.getByRole('region', { name: /Harness posture/i })
    expect(within(posture).getByText(/as of/i)).toBeDefined()
  })

  it('STATE-08 degrades the aggregate to stale WITH its age, never to zero', () => {
    render(<EvalHarnessScreen screenState="STATE-08" />)
    const posture = screen.getByRole('region', { name: /Harness posture/i })
    expect(posture.textContent ?? '').toMatch(/stale/i)
    expect(posture.textContent ?? '').toMatch(/\d+ (minutes|hours) old/i)
  })

  it('STATE-12 degrades the aggregate to unavailable, never to zero or blank', () => {
    render(<EvalHarnessScreen screenState="STATE-12" />)
    const posture = screen.getByRole('region', { name: /Harness posture/i })
    expect(posture.textContent ?? '').toMatch(/Unavailable/i)
    expect(posture.textContent ?? '').not.toMatch(/\b0\b/)
  })

  it('STATE-01 aggregates the same records the table shows: no verdict count over an empty list', () => {
    render(<EvalHarnessScreen screenState="STATE-01" />)
    const list = screen.getByRole('region', { name: /Scenario list/i })
    expect(within(list).getByText(/No evaluation scenario has been authored yet/i)).toBeDefined()

    const posture = screen.getByRole('region', { name: /Harness posture/i })
    // No count of any verdict may be reported while the same screen says the
    // records do not exist — and the absence is words, not a zero or a blank.
    for (const verdict of SCENARIO_VERDICTS) {
      expect(posture.textContent ?? '', verdict).not.toMatch(
        new RegExp(`\\d+\\s+${verdict}`, 'i'),
      )
    }
    expect(posture.textContent ?? '').not.toMatch(/\b0\b/)
    expect(within(posture).getByText(/nothing to aggregate/i)).toBeDefined()

    // The run target list offers no scenario that the list says does not exist.
    const runner = screen.getByRole('region', { name: /Suite runner/i })
    for (const s of EVAL_SCENARIOS) {
      expect(within(runner).queryByText(new RegExp(s.name)), s.id).toBeNull()
    }
  })

  // The two panels render the SAME records. This is the cross-panel gate:
  // whatever scenario the gate view names as a blocker, the scenario list
  // must also show — in every applicable state, not just the default one.
  // A row that named a scenario the list says was never authored (and any
  // second cause invented for its absence) fails here.
  it.each(APPLICABLE_STATES.map((s) => s.id))(
    '%s: the gate view names only scenarios the scenario list also shows',
    (stateId) => {
      render(<EvalHarnessScreen screenState={stateId} />)
      const gate = screen.getByRole('region', { name: /Gate view/i }).textContent ?? ''
      const list = screen.getByRole('region', { name: /Scenario list/i }).textContent ?? ''
      for (const s of EVAL_SCENARIOS) {
        if (gate.includes(s.name) || gate.includes(s.id)) {
          expect(list, `${stateId} names ${s.id} in the gate view only`).toContain(s.name)
        }
      }
    },
  )

  it('STATE-01: the gate view gives no second account of the missing scenarios', () => {
    render(<EvalHarnessScreen screenState="STATE-01" />)
    const gate = screen.getByRole('region', { name: /Gate view/i }).textContent ?? ''
    for (const s of EVAL_SCENARIOS) {
      expect(gate, s.id).not.toContain(s.id)
    }
    expect(gate).not.toMatch(/cannot be read/i)
  })

  it('STATE-02 renders a placeholder, never the number nought', () => {
    render(<EvalHarnessScreen screenState="STATE-02" />)
    const posture = screen.getByRole('region', { name: /Harness posture/i })
    expect(posture.textContent ?? '').not.toMatch(/\b0\b/)
    expect(within(posture).getByRole('status')).toBeDefined()
  })
})

describe('MOD-SA-05 — what the source does not define', () => {
  it('names every missing affordance instead of inventing a control', () => {
    render(<EvalHarnessScreen />)
    const panel = screen.getByRole('region', { name: /Unspecified in source/i })
    expect(EVAL_UNSPECIFIED_IN_SOURCE.length).toBeGreaterThan(0)
    for (const item of EVAL_UNSPECIFIED_IN_SOURCE) {
      expect(within(panel).getByText(item.affordance), item.affordance).toBeDefined()
    }
    expect(panel.querySelector('button')).toBeNull()
    expect(panel.querySelector('input')).toBeNull()
  })

  it('states the role and screen conflicts the source leaves open rather than resolving them silently', () => {
    render(<EvalHarnessScreen />)
    const panel = screen.getByRole('region', { name: /Conflicts in the source/i })
    for (const phrase of [/L87338/, /L108982/, /L56974/, /DEC-CANARY-001/]) {
      expect(within(panel).getAllByText(phrase).length).toBeGreaterThan(0)
    }
  })
})
