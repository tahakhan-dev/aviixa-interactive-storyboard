import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { DevicesScreen } from '../../app/super-admin/devices-and-fleet/DevicesScreen'
import {
  DEVICES,
  DEVICE_LIFECYCLE_STATES,
  DEVICE_PLATFORM_ROLES,
  DEVICE_POLICY_ITEMS,
  DEVICE_WORKFLOWS,
  UNREACHED_WIPE_SEQUENCE,
  UNSPECIFIED_IN_SOURCE,
  REACHED_WIPE_SEQUENCE,
  type WipeStep,
} from '../../app/super-admin/devices-and-fleet/fixtures'
import { COMMAND_STATES } from '@/surfaces/sa/command-state'
import { SCREEN_STATES } from '@/ui/screen-state'

/**
 * D10's four forbidden words. The `signed` arm carries a word boundary AND a
 * "signed in"/"signed-in" exclusion: the SHARED spine copy in
 * `@/policy/decision.ts` REASON_CODES says "The signed-in role does not carry
 * a grant for this action", and every module that renders a real
 * `evaluateAccess` denial puts that string on screen. The exclusion is one
 * word sense wide — "the log is signed" still fails this gate.
 */
const FORBIDDEN_WORDS = /tamper-evident|\bchained\b|\bsigned\b(?![- ]in)|\bverified\b/i

/**
 * AC-SA-13-05 is a claim about what a RENDERED STATE says, not about which
 * words appear in prose. A prose gate was written first and rejected: it
 * matched the screen's own denial, "nothing is erased by it", on the
 * suspension row — the "gate that matched its own denial" this build has
 * already shipped once. So the gate is structural instead: the five states
 * below are the ones that assert the device itself received or acted on the
 * command, and none of them may be the rendered state of an unreached
 * device. `COMMAND_STATES` is the closed spine set, so a sixth device-side
 * state cannot be added without this list being revisited.
 */
const DEVICE_SIDE_STATES = ['delivered', 'downloaded', 'validated', 'applied', 'acknowledged']

/** The states a command may hold before any device has been reached. */
const PRE_DELIVERY_STATES = ['created', 'authorized', 'queued', 'available for delivery']

/** The command states rendered as a badge (exact text) inside a subtree. */
function badgeStates(root: HTMLElement): readonly string[] {
  return COMMAND_STATES.filter((state) => within(root).queryAllByText(state).length > 0)
}

/** The two seeded devices the platform has not reached. */
const UNREACHED_DEVICE_IDS = ['DEV-TAB-0271', 'DEV-TAB-0233']

function selectRole(sourceRoleId: string): void {
  fireEvent.change(screen.getByLabelText(/view as platform role/i), {
    target: { value: sourceRoleId },
  })
}

function selectState(stateId: string): void {
  fireEvent.change(screen.getByRole('combobox', { name: 'Screen state' }), {
    target: { value: stateId },
  })
}

function region(name: string): HTMLElement {
  return screen.getByRole('region', { name })
}

function advance(name: RegExp): void {
  fireEvent.click(screen.getByRole('button', { name }))
}

const REACHED_ADVANCE = /advance the reachable-device fixture one state/i
const UNREACHED_ADVANCE = /advance the unreachable-device fixture one state/i

describe('MOD-SA-13 — the console shell contract', () => {
  it('renders under the shell with one h1 and the module id and band as annotations', () => {
    render(<DevicesScreen />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Devices and Fleet')
    expect(screen.getByText(/MOD-SA-13 · Operations layer/)).toBeDefined()
  })

  it('carries the prototype disclosure and shows SCR-SA numbers only as annotations', () => {
    const { container } = render(<DevicesScreen />)
    expect(screen.getByText(/simulated behaviour only/i)).toBeDefined()
    expect(screen.getAllByText(/SCR-SA-19/).length).toBeGreaterThan(0)
    for (const a of container.querySelectorAll('a')) {
      expect(a.getAttribute('href') ?? '').not.toMatch(/SCR-SA/i)
    }
  })

  it('states prominently that no device channel exists behind this screen', () => {
    render(<DevicesScreen />)
    const text = region('Prototype boundary').textContent ?? ''
    expect(text).toMatch(/no device channel/i)
    expect(text).toMatch(/fixture/i)
  })

  it('D10: never uses tamper-evident, chained, signed or verified, for any role', () => {
    const { container } = render(<DevicesScreen />)
    for (const role of DEVICE_PLATFORM_ROLES) {
      selectRole(role.sourceId)
      expect(container.textContent ?? '', role.sourceId).not.toMatch(FORBIDDEN_WORDS)
    }
  })

  it('renders no invariant as a control: no switch, no toggle anywhere on the screen', () => {
    const { container } = render(<DevicesScreen />)
    expect(container.querySelector('[role=switch]')).toBeNull()
  })
})

describe('MOD-SA-13 — the fleet, its telemetry and its aggregates', () => {
  it('renders one row per seeded device and covers all five OBJ-SA-DEVICE states', () => {
    render(<DevicesScreen />)
    const rows = within(region('Fleet')).getAllByRole('row')
    expect(rows).toHaveLength(DEVICES.length + 1)
    expect(DEVICE_LIFECYCLE_STATES).toHaveLength(5)
    for (const state of DEVICE_LIFECYCLE_STATES) {
      expect(region('Fleet').textContent, state).toContain(state)
    }
  })

  it('AC-SA-01-03: every fleet aggregate carries an as-of stamp and degrades, never a zero or a blank', () => {
    render(<DevicesScreen />)
    const summary = region('Fleet summary')
    const text = summary.textContent ?? ''
    expect(text).toMatch(/as of /i)
    expect(text).toMatch(/stale/i)
    expect(text).toMatch(/\d+ (minutes|hours) old/i)
    expect(text).toMatch(/unavailable/i)
    for (const cell of within(summary).getAllByRole('cell')) {
      expect((cell.textContent ?? '').trim().length).toBeGreaterThan(0)
    }
    expect(text).not.toMatch(/\b0\b/)
  })

  it('holds the line at the tenant: no rate, no per-worker series, and no device row names a worker', () => {
    const { container } = render(<DevicesScreen />)
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/\brates?\b/i)
    expect(text).not.toMatch(/per[- ](worker|person|operator|shift|hour|minute|run)\b/i)
    expect(region('Fleet').textContent ?? '').toMatch(/names no worker/i)
  })

  it('AC-SA-13-05: an unreached device is rendered as unreached, never as wiped, locked or updated', () => {
    render(<DevicesScreen />)
    const fleet = region('Fleet').textContent ?? ''
    expect(fleet).toMatch(/not been reached/i)
    expect(fleet).not.toMatch(/\bwiped\b(?!\s+with a final sync attempt)/i)
  })

  it('AC-SA-13-06: the package inventory records which package version each run executed against', () => {
    render(<DevicesScreen />)
    const text = region('Device detail').textContent ?? ''
    expect(text).toMatch(/package inventory/i)
    expect(text).toMatch(/package version/i)
  })
})

describe('MOD-SA-13 — the fifteen command states and the honest stepper', () => {
  it('draws both wipe sequences from the fifteen canonical states, in canonical order', () => {
    for (const seq of [REACHED_WIPE_SEQUENCE, UNREACHED_WIPE_SEQUENCE]) {
      const indices = seq.map((s) => COMMAND_STATES.indexOf(s.state))
      expect(indices.every((i) => i >= 0)).toBe(true)
      for (let i = 1; i < indices.length; i += 1) {
        expect(indices[i]!, seq[i]!.state).toBeGreaterThan(indices[i - 1]!)
      }
    }
  })

  it('starts both fixtures at created and advances only on an explicit user action', () => {
    render(<DevicesScreen />)
    expect(within(region('Wipe on a device that returns')).getByText('created')).toBeDefined()
    // A role change and a screen-state change move nothing.
    selectRole('ROLE-PLAT-SUP')
    selectState('STATE-08')
    expect(within(region('Wipe on a device that returns')).getByText('created')).toBeDefined()
    selectRole('ROLE-PLAT-ROOT')
    selectState('STATE-03')
    advance(REACHED_ADVANCE)
    expect(within(region('Wipe on a device that returns')).getByText('authorized')).toBeDefined()
  })

  it('keeps the state name visible at every step of the reachable sequence', () => {
    render(<DevicesScreen />)
    for (const step of REACHED_WIPE_SEQUENCE) {
      expect(
        within(region('Wipe on a device that returns')).getByText(step.state),
        step.state,
      ).toBeDefined()
      if (step !== REACHED_WIPE_SEQUENCE[REACHED_WIPE_SEQUENCE.length - 1]) {
        advance(REACHED_ADVANCE)
      }
    }
  })

  it('AC-SA-13-04: the final sync attempt precedes erasure and cannot be stepped past', () => {
    // Widened to the declared step type: `as const` narrows each element to
    // its own literal shape, on which the optional flags do not exist.
    const steps: readonly WipeStep[] = REACHED_WIPE_SEQUENCE
    const syncIndex = steps.findIndex((s) => s.finalSyncAttempt)
    const eraseIndex = steps.findIndex((s) => s.erasureRuns)
    expect(syncIndex).toBeGreaterThanOrEqual(0)
    expect(eraseIndex).toBeGreaterThan(syncIndex)
    render(<DevicesScreen />)
    const text = region('Wipe on a device that returns').textContent ?? ''
    expect(text).toMatch(/final sync attempt/i)
  })

  it('AC-SA-13-05: the unreachable fixture never reaches a state claiming the device took the command', () => {
    render(<DevicesScreen />)
    // Click far more times than the sequence is long: the fixture must stop.
    for (let i = 0; i < 12; i += 1) {
      const r = region('Wipe on a device that never returns')
      const states = badgeStates(r)
      expect(states, `click ${i}`).toHaveLength(1)
      expect(PRE_DELIVERY_STATES, `click ${i}`).toContain(states[0])
      expect(DEVICE_SIDE_STATES, `click ${i}`).not.toContain(states[0])
      fireEvent.click(within(r).getByRole('button', { name: UNREACHED_ADVANCE }))
    }
    const finalRegion = region('Wipe on a device that never returns')
    expect(badgeStates(finalRegion)).toEqual(['available for delivery'])
    expect(finalRegion.textContent ?? '').toMatch(/DEC-WIPE-001/)
    // The stepper is inert at the end, with the reason named — not a dead control.
    const button = within(region('Wipe on a device that never returns')).getByRole('button', {
      name: UNREACHED_ADVANCE,
    })
    expect(button.getAttribute('aria-disabled')).toBe('true')
  })

  it('the console records a command against an unreached device and never claims it arrived', () => {
    render(<DevicesScreen />)
    const before = within(region('Command log')).getAllByRole('row').length
    fireEvent.click(screen.getByRole('button', { name: /record a device suspension command/i }))
    const log = region('Command log')
    const rows = within(log).getAllByRole('row')
    expect(rows.length).toBe(before + 1)
    expect(log.textContent ?? '').toMatch(/not been delivered/i)
    // Every logged command against a device the platform has not reached
    // renders a pre-delivery state, the newly recorded one included.
    for (const row of rows) {
      const text = row.textContent ?? ''
      if (!UNREACHED_DEVICE_IDS.some((id) => text.includes(id))) continue
      const states = badgeStates(row)
      expect(states, text).toHaveLength(1)
      expect(PRE_DELIVERY_STATES, text).toContain(states[0])
    }
    const suspensionRow = rows.find((r) => (r.textContent ?? '').includes('Device suspension'))
    expect(suspensionRow).toBeDefined()
    expect(badgeStates(suspensionRow!)).toEqual(['queued'])
  })
})

describe('MOD-SA-13 — per-control allowed roles through evaluateAccess', () => {
  it('every one of the four platform roles reads the whole screen', () => {
    render(<DevicesScreen />)
    for (const role of DEVICE_PLATFORM_ROLES) {
      selectRole(role.sourceId)
      expect(within(region('Fleet')).getAllByRole('row').length, role.sourceId).toBe(
        DEVICES.length + 1,
      )
      expect(region('Device policy layer').textContent, role.sourceId).toMatch(
        /application-version floor/i,
      )
    }
  })

  it('the wipe draft is held by the Admin and the root, and named as refused for the others', () => {
    render(<DevicesScreen />)
    const draftName = /draft the wipe and de-authorisation request/i
    for (const sourceId of ['ROLE-PLAT-ROOT', 'ROLE-PLAT-ADMIN']) {
      selectRole(sourceId)
      expect(
        screen.getByRole('button', { name: draftName }).getAttribute('aria-disabled'),
        sourceId,
      ).toBeNull()
    }
    for (const sourceId of ['ROLE-PLAT-ENG', 'ROLE-PLAT-SUP']) {
      selectRole(sourceId)
      const button = screen.getByRole('button', { name: draftName })
      expect(button.getAttribute('aria-disabled'), sourceId).toBe('true')
      expect(region('Wipe and de-authorisation').textContent, sourceId).toMatch(
        /Admin drafts and the Root Super Admin approves/i,
      )
    }
  })

  it('a non-root role sees the class badge in place of the approval action bar', () => {
    render(<DevicesScreen />)
    selectRole('ROLE-PLAT-ROOT')
    expect(screen.getByRole('button', { name: /approve the critical-class request/i })).toBeDefined()
    for (const sourceId of ['ROLE-PLAT-ADMIN', 'ROLE-PLAT-ENG', 'ROLE-PLAT-SUP']) {
      selectRole(sourceId)
      expect(
        screen.queryByRole('button', { name: /approve the critical-class request/i }),
        sourceId,
      ).toBeNull()
      expect(region('Wipe and de-authorisation').textContent, sourceId).toMatch(
        /Critical class — root approval required/,
      )
    }
  })

  it('AC-SA-13-03: wipe and de-authorisation are critical class and mirrored to both audit streams', () => {
    render(<DevicesScreen />)
    const text = region('Wipe and de-authorisation').textContent ?? ''
    expect(text).toMatch(/critical class/i)
    expect(text).toMatch(/mirrored/i)
    expect(text).toMatch(/tenant’s own audit stream|tenant's own audit stream/i)
  })
})

describe('MOD-SA-13 — the three prohibition renderings, by rule', () => {
  it('AC-SA-13-02: enrollment is ABSENT — no console role holds it, the root included', () => {
    render(<DevicesScreen />)
    for (const role of DEVICE_PLATFORM_ROLES) {
      selectRole(role.sourceId)
      for (const button of screen.getAllByRole('button')) {
        expect(button.textContent ?? '', role.sourceId).not.toMatch(/enrol/i)
      }
    }
    expect(region('Absent by rule').textContent ?? '').toMatch(
      /enrollment is tenant self-service|no console role can enroll/i,
    )
  })

  it('names a wipe without a final sync attempt as absent for every account', () => {
    render(<DevicesScreen />)
    const notes = region('Absent by rule').textContent ?? ''
    expect(notes).toMatch(/without a final sync attempt/i)
    expect(notes).toMatch(/no delete or purge/i)
  })

  it('names every affordance the source leaves undefined instead of inventing one', () => {
    render(<DevicesScreen />)
    const text = region('Unspecified in source').textContent ?? ''
    expect(UNSPECIFIED_IN_SOURCE.length).toBeGreaterThan(3)
    for (const item of UNSPECIFIED_IN_SOURCE) expect(text).toContain(item)
  })

  it('renders the device policy layer as read-only, with no edit control drawn', () => {
    render(<DevicesScreen />)
    expect(DEVICE_POLICY_ITEMS).toHaveLength(3)
    const policy = region('Device policy layer')
    expect(within(policy).queryAllByRole('button')).toHaveLength(0)
    for (const item of DEVICE_POLICY_ITEMS) {
      expect(policy.textContent ?? '').toContain(item.name)
    }
  })
})

describe('MOD-SA-13 — the workflows the source defines', () => {
  it('renders each device workflow with its actor, trigger and terminal state', () => {
    render(<DevicesScreen />)
    const text = region('Device workflows').textContent ?? ''
    expect(DEVICE_WORKFLOWS.length).toBeGreaterThanOrEqual(6)
    for (const wf of DEVICE_WORKFLOWS) {
      expect(text, wf.id).toContain(wf.id)
      expect(text, wf.id).toContain(wf.terminalState)
    }
  })
})

describe('MOD-SA-13 — the twelve applicable screen states', () => {
  it('offers every state but the frontline-only STATE-07, and renders each without throwing', () => {
    render(<DevicesScreen />)
    const options = within(screen.getByRole('combobox', { name: 'Screen state' })).getAllByRole(
      'option',
    )
    expect(options).toHaveLength(SCREEN_STATES.length - 1)
    expect(options.map((o) => o.textContent ?? '').join(' ')).not.toMatch(/STATE-07/)
    for (const state of SCREEN_STATES.filter((s) => !s.frontlineOnly)) {
      selectState(state.id)
      expect(region('Screen state').textContent, state.id).toContain(state.id)
    }
  })

  it('AC-SA-000-09: with every AI model unavailable the module remains fully operable', () => {
    render(<DevicesScreen />)
    selectState('STATE-11')
    expect(region('Screen state').textContent ?? '').toMatch(/unavailable/i)
    // The fleet still reads, the stepper still steps, the controls still decide.
    expect(within(region('Fleet')).getAllByRole('row')).toHaveLength(DEVICES.length + 1)
    advance(REACHED_ADVANCE)
    expect(within(region('Wipe on a device that returns')).getByText('authorized')).toBeDefined()
    selectRole('ROLE-PLAT-ROOT')
    expect(screen.getByRole('button', { name: /approve the critical-class request/i })).toBeDefined()
  })
})

describe('MOD-SA-13 — the no-link rule', () => {
  it('resolves no link to record-level tenant content; tenant access goes to a session request', () => {
    const { container } = render(<DevicesScreen />)
    const hrefs = [...container.querySelectorAll('a')].map((a) => a.getAttribute('href') ?? '')
    expect(hrefs.length).toBeGreaterThan(0)
    for (const href of hrefs) {
      expect(href).toMatch(/^\/super-admin\//)
      expect(href).not.toMatch(/tenant[s]?\/[A-Z]/)
      expect(href).not.toMatch(/device[s]?\/[A-Z]/)
    }
    expect(hrefs.some((h) => /^\/super-admin\/support-access\/?$/.test(h))).toBe(true)
    expect(container.textContent ?? '').toMatch(/no ambient browsing/i)
  })
})
