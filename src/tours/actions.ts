/**
 * Task 15 — one action, one real handler, every time.
 *
 * §10.6, the rule this whole file exists to keep: "the tour drives the real
 * product." Every function below either (a) resolves a `data-control-id`
 * element already on the page and drives it with the same events a human's
 * mouse/keyboard would fire, or (b) — `navigate` only, which has no control
 * to resolve — calls the `TourHost`'s injected real router. THERE IS NO
 * THIRD PATH. Grep proves it: nothing in this file imports
 * `@/data/repository`, so there is no way for a tour to mutate the
 * repository directly. If a step needs state changed, it clicks (or types
 * into, or selects) the control that changes it — the exact same control a
 * reviewer's own hand would use, because every fixed id below (the
 * `demo-*` ones) is drawn from `@/ui/demo/RoleSimulator` and
 * `@/ui/demo/ScenarioControls`, never invented here.
 *
 * WHY DEMO-CHROME CONTROLS, SPECIFICALLY, FOR SWITCH ROLE / CONNECTIVITY /
 * CLOCK / FAILURE INJECTION. `@/ui/demo/DemoChrome`'s own header states the
 * property this relies on: switching role/connectivity/clock/failure
 * injection is "local React state... no repository call, ever" — the
 * reviewer's own tool, not a second product action layer. A tour driving
 * these controls is doing exactly what a human reviewer already does by
 * hand on the same bar; it is not a shortcut around anything, because there
 * is nothing under these controls to shortcut around.
 */
import type { ConnectivityMode } from '@/scenario/controls'
import type { TourAction, TourHost } from './types'

export type ActionOutcome = { readonly ok: true } | { readonly ok: false; readonly reason: string }

/* ────────────────────────────────────────────────────────────────────── *
 * Timing — the only "clock" this file has any business touching is the
 * WALL clock, and only to make typing/clicking visually legible when a
 * human is watching. It never reads or writes the scenario's own simulated
 * Clock (`@/domain/clock`) — see `performAdvanceClock` below, which moves
 * simulated time exclusively by clicking the real buttons that move it.
 * ────────────────────────────────────────────────────────────────────── */

const BASE_CHAR_DELAY_MS = 55
const BASE_SETTLE_DELAY_MS = 120

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** `speed` is `0.5 | 1 | 2` (`TourRunner#setSpeed`) — higher speed, shorter real-time delay. */
async function settle(speed: number): Promise<void> {
  await sleep(BASE_SETTLE_DELAY_MS / speed)
}

/* ────────────────────────────────────────────────────────────────────── *
 * Control resolution — the ONE selector scheme this whole engine uses.
 * ────────────────────────────────────────────────────────────────────── */

function attrSelector(controlId: string): string {
  // Escapes only what would otherwise break out of the quoted attribute
  // value; a `data-control-id` may legitimately contain `/` (a route-slug
  // id, per `NavItem`'s own doc comment) or `-`, neither of which needs it.
  const escaped = controlId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return `[data-control-id="${escaped}"]`
}

export function resolveControl(controlId: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(attrSelector(controlId))
}

/* ────────────────────────────────────────────────────────────────────── *
 * Fix round 1 / Important 1 — a disabled control is FOUND but not
 * ACTIVATABLE. Clicking, typing into, or selecting on it is a native no-op
 * in the browser; treating that as `{ ok: true }` is exactly the failure
 * §10.6 forbids — a tour reporting success over a product that did not
 * respond. Every action below that resolves a control and is about to
 * interact with it runs through this one check first, rather than each
 * `perform*` re-deriving its own notion of "disabled."
 * ────────────────────────────────────────────────────────────────────── */

function isDisabled(el: HTMLElement): boolean {
  return (
    ((el instanceof HTMLButtonElement ||
      el instanceof HTMLInputElement ||
      el instanceof HTMLSelectElement ||
      el instanceof HTMLTextAreaElement ||
      el instanceof HTMLFieldSetElement) &&
      el.disabled) ||
    el.getAttribute('aria-disabled') === 'true'
  )
}

/**
 * Shared pre-flight for every action about to interact with a resolved,
 * present control: refuses a disabled one (naming the step's control id and
 * its visible text — the "why" a human reading the failure would go look
 * for — rather than the disabled boolean alone) and, for an enabled one,
 * scrolls it into view first. An off-screen-but-enabled control gets
 * scrolled to and clicked — what a reviewer's own hand would do — rather
 * than silently acted on off in a part of the page nobody watching ever
 * saw.
 */
function prepareInteraction(el: HTMLElement, controlId: string): ActionOutcome | null {
  if (isDisabled(el)) {
    const label = el.textContent?.trim()
    return {
      ok: false,
      reason:
        `Element data-control-id="${controlId}"${label ? ` ("${label}")` : ''} is disabled ` +
        '(el.disabled === true) and cannot be activated. The tour stops here rather than reporting ' +
        'a click/type/select that did nothing — a disabled-but-present control is not the same as a ' +
        'successfully activated one.',
    }
  }
  el.scrollIntoView({ block: 'center', behavior: 'instant' })
  return null
}

/* ────────────────────────────────────────────────────────────────────── *
 * Native-event plumbing. A React-controlled input/select tracks its own
 * previous value through a property setter React itself installed on the
 * DOM node; assigning `.value =` directly leaves that tracker unaware
 * anything changed, so the very next real keystroke would be seen as "no
 * change" and dropped. Calling the PROTOTYPE's own value setter (bypassing
 * the instance-level one React installed) is the standard, well-known fix —
 * it is what makes the `input`/`change` event that follows actually reach
 * the component's `onChange`, running the field's real validation exactly
 * as a genuine keystroke would.
 * ────────────────────────────────────────────────────────────────────── */

function nativeValueSetter(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): ((v: string) => void) | null {
  const proto: object =
    el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : el instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
  if (!setter) return null
  return (v: string) => setter.call(el, v)
}

function isTypeable(el: HTMLElement): el is HTMLInputElement | HTMLTextAreaElement {
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
}

function fireInput(el: HTMLElement): void {
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

function fireChange(el: HTMLElement): void {
  el.dispatchEvent(new Event('change', { bubbles: true }))
}

/**
 * Character-by-character, with a visible caret: each keystroke sets the
 * accumulated value through the native setter, places the caret at the end
 * (exactly where a real keystroke would leave it) and fires the same
 * `input` event a browser fires per keystroke, so the field's own
 * `onChange` — and whatever validation it runs — sees every character
 * land, not one final paste. Pass criterion 2.
 */
async function typeInto(el: HTMLInputElement | HTMLTextAreaElement, text: string, speed: number): Promise<void> {
  el.focus()
  const setValue = nativeValueSetter(el)
  if (!setValue) throw new Error('Could not resolve a native value setter for this element.')
  let accumulated = ''
  for (const char of text) {
    accumulated += char
    setValue(accumulated)
    fireInput(el)
    el.setSelectionRange(accumulated.length, accumulated.length)
    await sleep(BASE_CHAR_DELAY_MS / speed)
  }
  fireChange(el)
}

function selectValue(el: HTMLSelectElement, value: string): void {
  const setValue = nativeValueSetter(el)
  if (setValue) setValue(value)
  else el.value = value
  fireInput(el)
  fireChange(el)
}

/* ────────────────────────────────────────────────────────────────────── *
 * Demo-chrome fixed control ids — drawn from `@/ui/demo/RoleSimulator` and
 * `@/ui/demo/ScenarioControls`, never invented. `demo-connectivity`,
 * `demo-failure-injection` and the two clock-advance buttons all live
 * inside the Scenario panel, which only exists in the DOM once
 * `demo-scenario-toggle` has opened it — `ensureScenarioPanelOpen` is the
 * one place that "open the panel first" step lives, so every action below
 * that needs one of those controls does the same real thing a reviewer
 * would: open the panel, then use what is inside it.
 * ────────────────────────────────────────────────────────────────────── */

const ROLE_SIMULATOR_ID = 'demo-role-simulator'
const SCENARIO_TOGGLE_ID = 'demo-scenario-toggle'
const CONNECTIVITY_ID = 'demo-connectivity'
const FAILURE_INJECTION_ID = 'demo-failure-injection'
const CLOCK_ADVANCE_1H_ID = 'demo-clock-advance-1h'
const CLOCK_ADVANCE_1D_ID = 'demo-clock-advance-1d'
const CLOCK_READOUT_SELECTOR = '[data-demo="clock-readout"]'

async function ensureScenarioPanelOpen(anyControlIdInside: string, speed: number): Promise<void> {
  if (resolveControl(anyControlIdInside)) return
  const toggle = resolveControl(SCENARIO_TOGGLE_ID)
  if (!toggle) throw new Error(`Could not resolve "${SCENARIO_TOGGLE_ID}" to open the scenario panel.`)
  toggle.click()
  await settle(speed)
}

/**
 * Fix round 1 / Important 3 — `restart()`'s only state-clearing step.
 *
 * `demo-scenario-toggle`/`demo-inspector-toggle` are TOGGLE buttons: a
 * click flips open/closed rather than setting an absolute value, so a
 * second run's identical click on an already-open panel closes it instead
 * of opening it — the panel state a prior run in the SAME session left
 * behind is not the panel state a fresh page load would start from.
 *
 * This does not special-case which control ids are toggles. It reads the
 * real ARIA contract every one of the reviewer chrome's toggle buttons
 * already carries (`aria-expanded`, set in `DemoChrome.tsx`) and clicks
 * whichever is currently `"true"` closed — the same "click to close" a
 * reviewer's own hand would do, generic to any control that exposes that
 * attribute, not a hardcoded list. Scoped to `[data-demo="chrome-root"]`
 * only: the reviewer's own chrome, never a product panel a tour's own
 * steps are responsible for opening or closing.
 */
export async function closeOpenReviewerPanels(speed: number): Promise<void> {
  const root = document.querySelector('[data-demo="chrome-root"]')
  if (!root) return
  const expanded = Array.from(root.querySelectorAll<HTMLElement>('[aria-expanded="true"]'))
  for (const el of expanded) {
    el.click()
    await settle(speed)
  }
}

/* ────────────────────────────────────────────────────────────────────── *
 * One function per TourAction kind.
 * ────────────────────────────────────────────────────────────────────── */

async function performNavigate(route: string, host: TourHost, speed: number): Promise<ActionOutcome> {
  host.navigate(route)
  await settle(speed)
  return { ok: true }
}

async function performSwitchRole(userId: string, speed: number): Promise<ActionOutcome> {
  const el = resolveControl(ROLE_SIMULATOR_ID)
  if (!el || !(el instanceof HTMLSelectElement)) {
    return { ok: false, reason: `Could not resolve "${ROLE_SIMULATOR_ID}" as a <select>.` }
  }
  const blocked = prepareInteraction(el, ROLE_SIMULATOR_ID)
  if (blocked) return blocked
  selectValue(el, userId)
  await settle(speed)
  return { ok: true }
}

async function performClick(controlId: string, speed: number): Promise<ActionOutcome> {
  const el = resolveControl(controlId)
  if (!el) return { ok: false, reason: `No element carries data-control-id="${controlId}".` }
  const blocked = prepareInteraction(el, controlId)
  if (blocked) return blocked
  el.click()
  await settle(speed)
  return { ok: true }
}

async function performType(controlId: string, value: string, speed: number): Promise<ActionOutcome> {
  const el = resolveControl(controlId)
  if (!el || !isTypeable(el)) {
    return { ok: false, reason: `No typeable <input>/<textarea> carries data-control-id="${controlId}".` }
  }
  const blocked = prepareInteraction(el, controlId)
  if (blocked) return blocked
  await typeInto(el, value, speed)
  await settle(speed)
  return { ok: true }
}

async function performSelect(controlId: string, value: string, speed: number): Promise<ActionOutcome> {
  const el = resolveControl(controlId)
  if (!el || !(el instanceof HTMLSelectElement)) {
    return { ok: false, reason: `No <select> carries data-control-id="${controlId}".` }
  }
  const blocked = prepareInteraction(el, controlId)
  if (blocked) return blocked
  selectValue(el, value)
  await settle(speed)
  return { ok: true }
}

async function performSetConnectivity(mode: ConnectivityMode, speed: number): Promise<ActionOutcome> {
  await ensureScenarioPanelOpen(CONNECTIVITY_ID, speed)
  const el = resolveControl(CONNECTIVITY_ID)
  if (!el || !(el instanceof HTMLSelectElement)) {
    return { ok: false, reason: `Could not resolve "${CONNECTIVITY_ID}" as a <select>.` }
  }
  const blocked = prepareInteraction(el, CONNECTIVITY_ID)
  if (blocked) return blocked
  selectValue(el, mode)
  await settle(speed)
  return { ok: true }
}

async function performInjectFailure(failureId: string, speed: number): Promise<ActionOutcome> {
  await ensureScenarioPanelOpen(FAILURE_INJECTION_ID, speed)
  const el = resolveControl(FAILURE_INJECTION_ID)
  if (!el || !(el instanceof HTMLSelectElement)) {
    return { ok: false, reason: `Could not resolve "${FAILURE_INJECTION_ID}" as a <select>.` }
  }
  const blocked = prepareInteraction(el, FAILURE_INJECTION_ID)
  if (blocked) return blocked
  selectValue(el, failureId)
  await settle(speed)
  return { ok: true }
}

const HOUR_MS = 60 * 60 * 1000

function readSimulatedClockMs(): number | null {
  const readout = document.querySelector(CLOCK_READOUT_SELECTOR)
  const text = readout?.textContent
  if (!text) return null
  // Inverse of `ScenarioControls`'s own `clockLabel`:
  // `new Date(ms).toISOString().replace('T', ' ').replace('Z', ' UTC')`.
  const iso = text.replace(' UTC', 'Z').replace(' ', 'T')
  const parsed = Date.parse(iso)
  return Number.isNaN(parsed) ? null : parsed
}

/**
 * Moves the simulated clock EXCLUSIVELY by clicking the two real buttons a
 * reviewer has — `+1h` and `+1d`. There is no third, direct way to move it
 * (`Clock#advance` is never imported here), so a target this reviewer could
 * not reach by hand either — one not a whole number of hours from the
 * current reading — is refused rather than faked. That refusal is real:
 * it is the exact same ceiling a human clicking these two buttons meets.
 */
async function performAdvanceClock(toStamp: string, speed: number): Promise<ActionOutcome> {
  await ensureScenarioPanelOpen(CLOCK_ADVANCE_1H_ID, speed)
  const current = readSimulatedClockMs()
  if (current === null) return { ok: false, reason: 'Could not read the simulated clock readout.' }
  const target = Date.parse(toStamp)
  if (Number.isNaN(target)) return { ok: false, reason: `"${toStamp}" is not a parseable stamp.` }
  const delta = target - current
  if (delta < 0) return { ok: false, reason: 'Scenario time never runs backwards.' }
  if (delta % HOUR_MS !== 0) {
    return {
      ok: false,
      reason:
        `"${toStamp}" is ${delta}ms past the current reading, which is not a whole number of hours — ` +
        'the +1h/+1d buttons can only land on a whole-hour boundary, exactly as they would for a ' +
        'reviewer clicking them by hand.',
    }
  }
  const totalHours = delta / HOUR_MS
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24

  const dayButton = days > 0 ? resolveControl(CLOCK_ADVANCE_1D_ID) : null
  if (days > 0 && !dayButton) return { ok: false, reason: `Could not resolve "${CLOCK_ADVANCE_1D_ID}".` }
  for (let i = 0; i < days; i++) {
    dayButton?.click()
    await settle(speed)
  }
  const hourButton = hours > 0 ? resolveControl(CLOCK_ADVANCE_1H_ID) : null
  if (hours > 0 && !hourButton) return { ok: false, reason: `Could not resolve "${CLOCK_ADVANCE_1H_ID}".` }
  for (let i = 0; i < hours; i++) {
    hourButton?.click()
    await settle(speed)
  }

  const reached = readSimulatedClockMs()
  if (reached !== target) {
    return { ok: false, reason: `Advanced to ${String(reached)}, not the requested ${String(target)}.` }
  }
  return { ok: true }
}

function performAssertState(check: string): ActionOutcome {
  // `check` is a controlId, resolved exactly like `expectVisible` — the
  // same live-DOM presence question, exposed as its own step action so a
  // tour can assert mid-flow state without necessarily clicking anything.
  return resolveControl(check) ? { ok: true } : { ok: false, reason: `No element carries data-control-id="${check}".` }
}

/* ────────────────────────────────────────────────────────────────────── *
 * The one dispatcher every TourStep goes through.
 * ────────────────────────────────────────────────────────────────────── */

export async function performAction(action: TourAction, host: TourHost, speed: number): Promise<ActionOutcome> {
  switch (action.kind) {
    case 'navigate':
      return performNavigate(action.route, host, speed)
    case 'switchRole':
      return performSwitchRole(action.userId, speed)
    case 'click':
      return performClick(action.controlId, speed)
    case 'type':
      return performType(action.controlId, action.value, speed)
    case 'select':
      return performSelect(action.controlId, action.value, speed)
    case 'setConnectivity':
      return performSetConnectivity(action.mode, speed)
    case 'advanceClock':
      return performAdvanceClock(action.toStamp, speed)
    case 'injectFailure':
      return performInjectFailure(action.failureId, speed)
    case 'assertState':
      return performAssertState(action.check)
  }
}
