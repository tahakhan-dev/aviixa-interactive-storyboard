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
 * D10's four forbidden words, with NO exclusion arm. The shared spine copy in
 * `@/policy/decision.ts` REASON_CODES no longer says "signed-in" anywhere, so
 * the `(?![- ]in)` lookahead that used to guard `\bsigned\b` is gone: it was an
 * unanchored superset that let "signed in" through, and nothing on this
 * console needs it any more.
 */
const FORBIDDEN_WORDS = /tamper-evident|\bchained\b|\bsigned\b|\bverified\b/i

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

function openDevice(deviceId: string): void {
  fireEvent.change(screen.getByRole('combobox', { name: 'Open a device detail' }), {
    target: { value: deviceId },
  })
}

/**
 * The three view selects, resolved ONCE per render. React keeps the same DOM
 * nodes across re-renders, so the permutation loops below must not pay an
 * accessible-name query per step: 96 of those over a tree this size, not the
 * re-renders, is what pushed those loops past vitest's 5000ms default under
 * load. A gate that is flaky-to-red gets disabled by the next person.
 */
function switchers(): { role: HTMLElement; state: HTMLElement } {
  return {
    role: screen.getByRole('combobox', { name: 'View as platform role' }),
    state: screen.getByRole('combobox', { name: 'Screen state' }),
  }
}

function setSelect(el: HTMLElement, value: string): void {
  fireEvent.change(el, { target: { value } })
}

/** The screen states this module offers, resolved once. */
const APPLICABLE_STATES = SCREEN_STATES.filter((s) => !s.frontlineOnly)

/** The three states whose treatment reads the selected role: the success
 *  rendering, the refusal and the read-only gate. */
const ROLE_SENSITIVE_STATES = ['STATE-03', 'STATE-05', 'STATE-06']

/**
 * The view sweep both permutation gates below run, with `visit` called once
 * per view. NOT the 4x12 cross product: that was 48 re-renders of a
 * six-table tree per test, the two slowest tests in the file, and it timed
 * out against vitest's 5000ms default under concurrent load — a red gate
 * pointing at a property the code does not violate, which is how a gate gets
 * deleted by the next person who sees it.
 *
 * The union of two slices covers every string and every control the screen
 * can draw, because role-dependent copy renders only where the screen state
 * does not replace it: all twelve states at the root (which holds every
 * control, so nothing is hidden from this slice), and all four roles at the
 * three states whose treatment reads the role. 28 re-renders, not 48.
 */
function sweepViews(visit: (label: string) => void): void {
  const sel = switchers()
  setSelect(sel.role, 'ROLE-PLAT-ROOT')
  for (const state of APPLICABLE_STATES) {
    setSelect(sel.state, state.id)
    visit(`ROLE-PLAT-ROOT / ${state.id}`)
  }
  for (const stateId of ROLE_SENSITIVE_STATES) {
    setSelect(sel.state, stateId)
    for (const role of DEVICE_PLATFORM_ROLES) {
      setSelect(sel.role, role.sourceId)
      visit(`${role.sourceId} / ${stateId}`)
    }
  }
  setSelect(sel.state, 'STATE-03')
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

  it('D10: never uses tamper-evident, chained, signed or verified, for any role or screen state', () => {
    const { container } = render(<DevicesScreen />)
    // Every role AND every screen state: the state treatments render their own
    // copy, and a role-only loop never reads a single word of it.
    sweepViews((label) => {
      expect(container.textContent ?? '', label).not.toMatch(FORBIDDEN_WORDS)
    })
    // Every device detail pane too — the note and the audit trail are the only
    // free prose about a device on this screen.
    for (const device of DEVICES) {
      openDevice(device.id)
      expect(container.textContent ?? '', device.id).not.toMatch(FORBIDDEN_WORDS)
    }
  })

  it('draws no toggle control of any kind: no switch, no checkbox and no radio, for any role', () => {
    // This module renders no invariant at all, so an "invariant as a control"
    // assertion would be vacuous here. What it CAN prove is the general form:
    // nothing on this screen is a toggle. `[role=switch]` alone missed every
    // native checkbox and radio, which is how a toggle actually gets drawn.
    const { container } = render(<DevicesScreen />)
    for (const role of DEVICE_PLATFORM_ROLES) {
      selectRole(role.sourceId)
      expect(container.querySelectorAll('[role=switch]'), role.sourceId).toHaveLength(0)
      expect(container.querySelectorAll('[role=checkbox]'), role.sourceId).toHaveLength(0)
      expect(container.querySelectorAll('input[type=checkbox]'), role.sourceId).toHaveLength(0)
      expect(container.querySelectorAll('input[type=radio]'), role.sourceId).toHaveLength(0)
      expect(screen.queryAllByRole('switch'), role.sourceId).toHaveLength(0)
      expect(screen.queryAllByRole('checkbox'), role.sourceId).toHaveLength(0)
      expect(screen.queryAllByRole('radio'), role.sourceId).toHaveLength(0)
    }
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
    // The third clause is proved on the RENDERED CELLS, never on the screen's
    // own prose: `toMatch(/names no worker/i)` only ever read this table's
    // caption sentence back to itself and could not see a name in a cell.
    // Two cheap heuristics over each cell, after the tenant labels — the only
    // legitimate multi-word proper nouns on a device row — are stripped out:
    // a worker lexicon, and a capitalised name pair.
    const WORKER_LEXICON =
      /\b(worker|operator|technician|inspector|employee|staff|person|assignee|assigned to)\b/i
    const NAME_PAIR = /[A-Z][a-z]+\s+[A-Z][a-z]+/
    const tenantLabels = DEVICES.map((d) => d.tenantLabel)
    const cells = within(region('Fleet')).getAllByRole('cell')
    expect(cells.length).toBeGreaterThan(0)
    for (const cell of cells) {
      let t = cell.textContent ?? ''
      for (const label of tenantLabels) t = t.split(label).join(' ')
      expect(t, t).not.toMatch(WORKER_LEXICON)
      expect(t, t).not.toMatch(NAME_PAIR)
    }
  })

  it('AC-SA-13-05: an unreached device is rendered as unreached, never as wiped, locked or updated', () => {
    render(<DevicesScreen />)
    expect(region('Fleet').textContent ?? '').toMatch(/not been reached/i)
    // All three words AC-SA-13-05 names, checked in BOTH places a device is
    // described: its fleet row and its detail pane. The pane carries the only
    // free prose about a device (the note and the audit trail), and the old
    // region('Fleet') scope never read a word of it.
    const TOOK_THE_COMMAND = /\bwiped\b|\blocked\b|\bupdated\b/i
    const unreached = DEVICES.filter((d) => d.contact === 'not reached')
    expect(unreached.length).toBeGreaterThan(1)
    for (const device of unreached) {
      const row = within(region('Fleet'))
        .getAllByRole('row')
        .find((r) => (r.textContent ?? '').includes(device.id))
      expect(row, device.id).toBeDefined()
      expect(row!.textContent ?? '', device.id).toMatch(/has not been reached/i)
      expect(row!.textContent ?? '', device.id).not.toMatch(TOOK_THE_COMMAND)
      openDevice(device.id)
      expect(region('Device detail').textContent ?? '', device.id).not.toMatch(TOOK_THE_COMMAND)
    }
    // The gate is scoped to contact, not to a word the screen simply never
    // uses: the reached, retired device DOES render as wiped, and must.
    openDevice('DEV-TAB-0294')
    expect(region('Device detail').textContent ?? '').toMatch(/\bwiped\b/i)
  })

  it('AC-SA-13-06: the package inventory records which package version each run executed against', () => {
    render(<DevicesScreen />)
    expect(region('Device detail').textContent ?? '').toMatch(/package inventory/i)
    // Read the fixture ROWS, not the hard-coded heading and column header:
    // both of those render whether or not a single package is recorded.
    const CAPTION = /package versions recorded against this device/i
    const withPackages = DEVICES.find((d) => d.id === 'DEV-TAB-0141')!
    expect(withPackages.packages.length).toBeGreaterThan(1)
    openDevice(withPackages.id)
    const table = within(region('Device detail')).getByRole('table', { name: CAPTION })
    expect(within(table).getAllByRole('row')).toHaveLength(withPackages.packages.length + 1)
    for (const pkg of withPackages.packages) {
      const row = within(table)
        .getAllByRole('row')
        .find((r) => (r.textContent ?? '').includes(pkg.packageVersion))
      expect(row, pkg.packageVersion).toBeDefined()
      expect(row!.textContent ?? '', pkg.packageVersion).toContain(pkg.scope)
      expect(row!.textContent ?? '', pkg.packageVersion).toContain(pkg.runsInTenantMonth)
      // A tenant-month count, never a rate and never a per-worker series.
      expect(pkg.runsInTenantMonth, pkg.packageVersion).toMatch(
        /^\d+ runs recorded in the tenant-month$/,
      )
    }
    // A device with nothing recorded renders the empty state and no grid —
    // never a zero-row table and never a zero.
    const empty = DEVICES.find((d) => d.packages.length === 0)!
    openDevice(empty.id)
    expect(within(region('Device detail')).queryByRole('table', { name: CAPTION })).toBeNull()
    expect(region('Device detail').textContent ?? '').toMatch(
      /no package has been recorded against this device/i,
    )
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
    const RET = 'Wipe on a device that returns'
    const NEV = 'Wipe on a device that never returns'
    // BOTH steppers, not just the reachable one: the unreachable fixture is
    // the one carrying the AC-SA-13-05 hard gate, and an opening index other
    // than 0 there renders a command state no user asked for.
    expect(badgeStates(region(RET))).toEqual(['created'])
    expect(badgeStates(region(NEV))).toEqual(['created'])
    // A role change and a screen-state change move neither.
    selectRole('ROLE-PLAT-SUP')
    selectState('STATE-08')
    expect(badgeStates(region(RET))).toEqual(['created'])
    expect(badgeStates(region(NEV))).toEqual(['created'])
    selectRole('ROLE-PLAT-ROOT')
    selectState('STATE-03')
    advance(REACHED_ADVANCE)
    expect(badgeStates(region(RET))).toEqual(['authorized'])
    // Stepping one fixture does not step the other.
    expect(badgeStates(region(NEV))).toEqual(['created'])
    advance(UNREACHED_ADVANCE)
    expect(badgeStates(region(NEV))).toEqual(['authorized'])
    expect(badgeStates(region(RET))).toEqual(['authorized'])
  })

  it('STATE-06 and STATE-12 disable every control, both steppers included', () => {
    render(<DevicesScreen />)
    selectRole('ROLE-PLAT-ROOT')
    const NAMES = [
      /draft the wipe and de-authorisation request/i,
      /approve the critical-class request/i,
      REACHED_ADVANCE,
      UNREACHED_ADVANCE,
      /record a device suspension command/i,
    ]
    for (const stateId of ['STATE-06', 'STATE-12']) {
      selectState(stateId)
      for (const name of NAMES) {
        const button = screen.getByRole('button', { name })
        expect(button.getAttribute('aria-disabled'), `${stateId} ${String(name)}`).toBe('true')
      }
      // And clicking one changes nothing.
      fireEvent.click(screen.getByRole('button', { name: REACHED_ADVANCE }))
      expect(badgeStates(region('Wipe on a device that returns')), stateId).toEqual(['created'])
    }
    // The same controls are live again once the state permits them.
    selectState('STATE-03')
    for (const name of NAMES) {
      expect(
        screen.getByRole('button', { name }).getAttribute('aria-disabled'),
        String(name),
      ).toBeNull()
    }
  })

  it('STATE-06: banner, module note and every disabled reason print ONE identical cause', () => {
    render(<DevicesScreen />)
    // The ROOT, deliberately: it holds the draft AND the approval, so any
    // role-framed cause ("holds no device action") is false of the very role
    // that is nonetheless disabled here. The default role would prove nothing.
    selectRole('ROLE-PLAT-ROOT')
    selectState('STATE-06')
    const reasons = new Set<string>()
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(4)
    for (const button of buttons) {
      const name = button.textContent ?? ''
      expect(button.getAttribute('aria-disabled'), name).toBe('true')
      const describedBy = button.getAttribute('aria-describedby')
      expect(describedBy, name).not.toBeNull()
      reasons.add(document.getElementById(describedBy!)?.textContent ?? '')
    }
    // One cause, not one per control and not one per screen region.
    expect([...reasons], 'every disabled control names the same cause').toHaveLength(1)
    const cause = [...reasons][0]!
    expect(cause).toMatch(/^Read-only \(STATE-06\)/)
    // The banner and this module's own state note carry that same string,
    // verbatim — the two other places the state is rendered.
    const stateRegion = region('Screen state').textContent ?? ''
    expect(stateRegion.split(cause), 'the note and the banner both carry it').toHaveLength(3)
    // And no SECOND cause anywhere: the role framing the boundary used to
    // print alongside it is gone.
    expect(stateRegion).not.toMatch(/hold no device action|names the Admin as drafter/i)
  })

  it('STATE-06: the device-detail input is genuinely disabled; the view switchers are not', () => {
    render(<DevicesScreen />)
    const detail = (): HTMLSelectElement =>
      screen.getByRole('combobox', { name: 'Open a device detail' }) as HTMLSelectElement
    expect(detail().disabled).toBe(false)
    selectState('STATE-06')
    // "Every input is disabled" is a claim about the DOM, not about prose.
    expect(detail().disabled).toBe(true)
    // The two the copy exempts stay live, and must: disabling the screen-state
    // switcher would leave a reader with no way out of the state.
    for (const name of ['View as platform role', 'Screen state']) {
      expect(
        (screen.getByRole('combobox', { name }) as HTMLSelectElement).disabled,
        name,
      ).toBe(false)
    }
    selectState('STATE-03')
    expect(detail().disabled).toBe(false)
  })

  it('a recorded draft never outlives the role or the screen state it was made under', () => {
    render(<DevicesScreen />)
    const drafted = (): boolean =>
      /SA-REQ-0134/.test(region('Wipe and de-authorisation').textContent ?? '')
    selectRole('ROLE-PLAT-ADMIN')
    fireEvent.click(screen.getByRole('button', { name: /draft the wipe/i }))
    expect(drafted()).toBe(true)
    // A role that never held the control must be told it lacks the capability,
    // never that the action is already done.
    selectRole('ROLE-PLAT-ENG')
    expect(drafted()).toBe(false)
    expect(region('Wipe and de-authorisation').textContent ?? '').toMatch(/not permitted|no device action/i)
    // A screen-state move clears it too.
    selectRole('ROLE-PLAT-ADMIN')
    fireEvent.click(screen.getByRole('button', { name: /draft the wipe/i }))
    expect(drafted()).toBe(true)
    selectState('STATE-06')
    expect(drafted()).toBe(false)
  })

  it('a recorded suspension never outlives its role or screen state: the log row, the button and its reason move together', () => {
    render(<DevicesScreen />)
    // All THREE sites that render "the suspension is recorded", read together
    // on every assertion below. Checking only the button reason is how round 1
    // shipped a refusal printed directly above the row it denies.
    const log = (): HTMLElement => region('Command log')
    const suspensionRow = (): HTMLElement | undefined =>
      within(log())
        .getAllByRole('row')
        .find((r) => (r.textContent ?? '').includes('CMD-0623'))
    const suspendButton = (): HTMLElement =>
      within(log()).getByRole('button', { name: /record a device suspension command/i })
    const suspendReason = (): string | null => {
      const id = suspendButton().getAttribute('aria-describedby')
      return id === null ? null : (document.getElementById(id)?.textContent ?? '')
    }

    // Recorded by a role that holds it: row present, control spent, reason says so.
    selectRole('ROLE-PLAT-ADMIN')
    expect(suspensionRow()).toBeUndefined()
    expect(suspendReason()).toBeNull()
    fireEvent.click(suspendButton())
    expect(suspensionRow()).toBeDefined()
    expect(suspendReason() ?? '').toMatch(/already recorded in the log below/i)

    // AXIS 1 — the role. A role that never held the control must be told it
    // lacks the capability, and the log must not sit below that refusal still
    // showing the row that role never created.
    selectRole('ROLE-PLAT-ENG')
    expect(suspensionRow(), 'the row outlived the role that recorded it').toBeUndefined()
    const engReason = suspendReason() ?? ''
    expect(engReason).toMatch(/does not carry a grant/i)
    expect(engReason).toMatch(/Viewing as Platform Engineer/)
    expect(engReason, 'a refusal and "already done" are two causes for one rendering').not.toMatch(
      /already recorded/i,
    )
    // And returning to the role that held it finds the control live again, not
    // spent: a cleared click must clear the button too, not just the table.
    selectRole('ROLE-PLAT-ADMIN')
    expect(suspensionRow()).toBeUndefined()
    expect(suspendReason()).toBeNull()

    // AXIS 2 — the screen state, from the same recorded starting point.
    fireEvent.click(suspendButton())
    expect(suspensionRow()).toBeDefined()
    selectState('STATE-06')
    expect(suspensionRow(), 'the row outlived the screen state that recorded it').toBeUndefined()
    const readOnlyReason = suspendReason() ?? ''
    expect(readOnlyReason).toMatch(/^Read-only \(STATE-06\)/)
    expect(readOnlyReason).not.toMatch(/already recorded/i)
    selectState('STATE-03')
    expect(suspensionRow()).toBeUndefined()
    expect(suspendReason()).toBeNull()
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

  it('names every affordance the source leaves undefined', () => {
    render(<DevicesScreen />)
    const text = region('Unspecified in source').textContent ?? ''
    expect(UNSPECIFIED_IN_SOURCE.length).toBeGreaterThan(3)
    for (const item of UNSPECIFIED_IN_SOURCE) expect(text).toContain(item)
  })

  it('…instead of inventing one: the drawn controls are exactly the ones the source defines', () => {
    const { container } = render(<DevicesScreen />)
    // The other half of the rule, and the half a presence-only assertion over
    // UNSPECIFIED_IN_SOURCE can never catch: an "Export the fleet inventory"
    // button two sections above a panel saying no export is defined. The
    // control surface is pinned as an ALLOWLIST rather than probed with a
    // handful of negative regexes, so ANY control the source does not define
    // fails this test the moment it is drawn.
    const CONTROLS = [
      'Draft the wipe and de-authorisation request',
      'Approve the critical-class request',
      'Advance the reachable-device fixture one state',
      'Advance the unreachable-device fixture one state',
      'Record a device suspension command',
    ]
    const COMBOBOXES = ['View as platform role', 'Screen state', 'Open a device detail']
    // The 48 permutations are swept with querySelectorAll rather than
    // getAllByRole: role+name resolution over a tree with six tables and
    // three option lists costs ~20ms a permutation, which is what made this
    // test time out under load. The selectors cover the same ground — an
    // explicit `role=` attribute is included in each — and cost nothing.
    const controlsIn = (): readonly string[] =>
      [...container.querySelectorAll('button, [role=button]')].map((b) =>
        (b.textContent ?? '').trim(),
      )
    // The combobox names are proved once, outside the sweep: they are fixed
    // labels, and nothing in the sweep can rename them.
    for (const name of COMBOBOXES) expect(screen.getByRole('combobox', { name })).toBeDefined()
    // Across the sweep: a control cannot hide behind a view the default
    // render never reaches.
    sweepViews((label) => {
      for (const text of controlsIn()) {
        expect(CONTROLS, `${label}: ${text}`).toContain(text)
      }
      expect(container.querySelectorAll('select, [role=combobox]'), label).toHaveLength(
        COMBOBOXES.length,
      )
      // No text entry anywhere: a search box over a cross-tenant fleet is
      // the ambient-browsing path the source forbids.
      expect(
        container.querySelectorAll(
          'input, textarea, [contenteditable], [role=textbox], [role=searchbox], [role=spinbutton]',
        ),
        label,
      ).toHaveLength(0)
    })
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
