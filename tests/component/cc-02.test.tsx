import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  ConnectivityBanner,
  FreshnessMarker,
  ManualCloseLink,
  RunCompletionState,
  SyncStateChrome,
  type FreshnessMarkerProps,
} from '@/surfaces/cc/modules/cc-02/SyncStateChrome'
import { CC02_MARKER_STATES, CC02_RUN_STATES } from '@/surfaces/cc/modules/cc-02/chrome'
import { HonestElement } from '@/honesty/HonestElement'
import { CC02_MANUAL_CLOSE_LINK } from '@/surfaces/cc/modules/cc-02/matrix'

/**
 * `MOD-CC-02` AS A RENDERING.
 *
 * The unit suite next door asks whether the transcription matches the frozen
 * source. This one asks whether what the source says REACHES THE SCREEN,
 * because a rule held in data and never drawn is a code comment, and a code
 * comment is not an honest element.
 *
 * FOUR OF SLICE 7'S BEATEN-GATE SHAPES ARE LIVE IN THIS FILE AND ARE PINNED
 * BY CONSTRUCTION:
 *
 *  - A `textContent` SWEEP BEATEN BY ELEMENT CONCATENATION. `a timer` +
 *    `STATE-X` reads back as `a timerSTATE-X`. Every assertion below that
 *    cares about a specific string reads the ELEMENT that carries it, found
 *    by test id, rather than a parent's concatenated `textContent`.
 *  - THE SAME SWEEP BEATEN BY A `hidden` ATTRIBUTE, because `getByTestId`
 *    finds hidden elements and `textContent` reads them. A gate below walks
 *    the rendered subtree and fails on any hidden element, so a later task
 *    cannot satisfy a text assertion with something the user never sees.
 *  - `Allowed` IS A PREFIX OF `Allowed with conditions`. The link gate asserts
 *    the ABSENCE of every control element rather than the presence of a link,
 *    because a page with both a link and a button has a link.
 *  - A SHARED HELPER USED AS ITS OWN TEST WHOSE ONLY FIRING BRANCH COULD NOT
 *    FIRE. The honesty binding is proved on an element that DOES defect, not
 *    only on the four that do not.
 */

const SOURCE = readFileSync(
  join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md'),
  'utf8',
).split('\n')

function srcLine(n: number): string {
  const l = SOURCE[n - 1]
  if (l === undefined) throw new Error(`the frozen source has no line ${n}`)
  return l
}

afterEach(cleanup)

const marker = (over: Partial<FreshnessMarkerProps> = {}): FreshnessMarkerProps => ({
  state: 'live-all-synced',
  lastSyncLabel: '09:11',
  devicesOffline: 0,
  devicesTotal: 3,
  pending: 'unknown',
  commandState: null,
  ...over,
})

/** Every element in a subtree that a reader could not see. */
function hiddenWithin(root: HTMLElement): string[] {
  const out: string[] = []
  for (const el of Array.from(root.querySelectorAll('*'))) {
    if (el.hasAttribute('hidden') || el.getAttribute('aria-hidden') === 'true') {
      out.push(el.tagName.toLowerCase())
    }
  }
  return out
}

/* ==================================================================== *
 * THE MARKER.
 * ==================================================================== */

describe('the freshness marker', () => {
  // FAILS IF: any marker state renders nothing. `AC-CC-180` (L36591) asks for
  // a marker "in every state, including healthy", and the healthy one is the
  // state a marker that only appears in trouble would skip — which is the
  // defect `SUB-CC-0201-2` (L36531) exists to name.
  // PLANTED: made `FreshnessMarker` return `null` for 'live-all-synced'.
  // RED: Unable to find an element by:
  //      [data-testid="cc02-marker-live-all-synced"].
  it('renders in every state the card names, including healthy', () => {
    expect(srcLine(36591)).toContain('including healthy')
    for (const s of CC02_MARKER_STATES) {
      cleanup()
      render(<FreshnessMarker {...marker({ state: s.id })} />)
      expect(screen.getByTestId(`cc02-marker-${s.id}`)).toBeTruthy()
    }
  })

  // FAILS IF: a marker reaches the screen without its origin or its age. The
  // three-clause test's first two clauses (L78392, L78393) are enforced in
  // `HonestElement`, and this asserts the enforcement is LIVE here rather
  // than decorative — the label element is read on its own, so a neighbouring
  // element's text cannot supply the words by concatenation.
  // PLANTED: replaced `<HonestElement .../>` in `FreshnessMarker` with a
  //   plain `<p>{markerText(props)}</p>`.
  // RED: expected null not to be null — the FreshnessLabel element was gone
  //      while the marker's own test id still resolved, which is exactly the
  //      failure a parent-textContent assertion would have missed.
  it('carries origin and age on the element that states them', () => {
    expect(srcLine(78392)).toContain('The origin clause')
    const { container } = render(<FreshnessMarker {...marker({ state: 'partially-synced' })} />)
    const label = container.querySelector('p.text-xs')
    expect(label).not.toBeNull()
    expect(label?.textContent).toContain('the device')
    expect(label?.textContent).toContain('last successful sync in this scope')
  })

  // FAILS IF: an unknown pending count reaches the screen as a zero.
  // `AC-CC-182` (L36593). Read off the marker's own element.
  // PLANTED: changed `markerText`'s 'partially-synced' branch to interpolate
  //   `p.pending` directly instead of calling `cc02PendingText`.
  // RED: expected 'Synced 09:11 · 1 of 3 devices offline · unknown' to
  //      contain 'pending captures unknown'.
  it('says unknown on the screen, never nought', () => {
    render(
      <FreshnessMarker
        {...marker({ state: 'partially-synced', devicesOffline: 1, pending: 'unknown' })}
      />,
    )
    const el = screen.getByTestId('cc02-marker-partially-synced')
    expect(el.textContent).toContain('pending captures unknown')
    expect(el.textContent).not.toContain('0 pending')
  })

  // FAILS IF: the effect clause never reaches the screen. L36520 names
  // `FB-CC-CMD` "for the per-device command confirmation state the marker
  // supports", so a marker carrying a device-aimed intent must NAME the
  // command's true state (L78394). Both directions are asserted, because a
  // gate that only checks the badge is present passes on a component that
  // always renders one.
  // PLANTED: hard-coded `intent={cc02NoDeviceIntent}` in `FreshnessMarker`.
  // RED: expected null not to be null — no badge for a device-aimed marker.
  it('names the command state when the element is aimed at a device', () => {
    expect(srcLine(78394)).toContain('The effect clause')
    expect(srcLine(36520)).toContain('per-device command confirmation state')
    const withIntent = render(<FreshnessMarker {...marker({ commandState: 'delivered' })} />)
    expect(withIntent.container.textContent).toContain('delivered')
    cleanup()
    const without = render(<FreshnessMarker {...marker({ commandState: null })} />)
    expect(without.container.textContent).not.toContain('delivered')
  })

  // FAILS IF: the honesty binding is decorative. Proved on an element that
  // DOES defect rather than only on the four that do not — a helper whose
  // only firing branch cannot fire is one of slice 7's eleven shapes. A bare
  // completion claim with no device intent is the `tick-next-to-done` rule
  // (L78384), and `HonestElement` throws rather than rendering it.
  // PLANTED: none required; the throw is asserted directly, and the negative
  //   case beside it proves the assertion is not vacuous.
  it('refuses to render an element the three-clause test rejects', () => {
    expect(srcLine(78384)).toContain('must never draw a tick next to')
    // The four this module actually renders all pass, so the binding is not
    // simply refusing everything.
    for (const s of CC02_MARKER_STATES) {
      cleanup()
      expect(() => render(<FreshnessMarker {...marker({ state: s.id })} />)).not.toThrow()
    }
    cleanup()
    // And the branch that must be able to fire, does. A bare completion claim
    // with no device-aimed intent is exit two of the diagram at L78409.
    expect(() =>
      render(
        <HonestElement
          statement="done"
          fact={{ from: 'server-record' }}
          intent={{ aimedAtDevice: false }}
        />,
      ),
    ).toThrow()
    cleanup()
    // A device-derived fact with a blank age is exit one.
    expect(() =>
      render(
        <HonestElement
          statement="Live"
          fact={{ from: 'device', asOfLabel: '  ' }}
          intent={{ aimedAtDevice: false }}
        />,
      ),
    ).toThrow()
  })

  // FAILS IF: any part of the chrome is drawn but not visible. `getByTestId`
  // finds hidden elements and `textContent` reads them, so every text gate in
  // this file could otherwise be satisfied by something no reader sees.
  // PLANTED: added `hidden` to the marker's wrapping `<div>`.
  // RED: expected [ 'div' ] to have a length of 0 but got 1.
  it('hides nothing it renders', () => {
    const { container } = render(
      <SyncStateChrome marker={marker({ state: 'partially-synced', devicesOffline: 1 })}>
        <p>14 captures</p>
      </SyncStateChrome>,
    )
    expect(hiddenWithin(container)).toHaveLength(0)
  })

  // FAILS IF: the marker stops rendering before the value. L36475 — "renders
  // the marker before the element's value renders". A position check, and the
  // one shape that would be true of both a defect and its fix is a check that
  // both are merely present, so this compares document order.
  // PLANTED: moved `{children}` above `<FreshnessMarker />` in
  //   `SyncStateChrome`.
  // RED: expected 4 to be 2 — Node.DOCUMENT_POSITION_PRECEDING instead of
  //      FOLLOWING.
  it('renders the marker before the value it wraps', () => {
    render(
      <SyncStateChrome marker={marker()}>
        <p data-testid="cc02-test-value">14 captures</p>
      </SyncStateChrome>,
    )
    const m = screen.getByTestId('cc02-marker-live-all-synced')
    const v = screen.getByTestId('cc02-test-value')
    expect(m.compareDocumentPosition(v) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})

/* ==================================================================== *
 * THE BANNER AND THE RUN STATES.
 * ==================================================================== */

describe('the connectivity banner and the run states', () => {
  // FAILS IF: the banner appears below its threshold or on an unknown site
  // state. L36587 makes withholding the terminal safe state, so the absent
  // case is the one that matters and it is asserted twice.
  // PLANTED: changed `ConnectivityBanner` to render whenever
  //   `elapsedMinutes !== 'unknown'`.
  // RED: expected null not to be null → then, on the second plant
  //   (`elapsedMinutes === 'unknown' || >= 60`), expected null to be null
  //   failed with the banner present.
  it('renders at sixty minutes and is withheld below it and when unknown', () => {
    expect(srcLine(36587)).toContain('withheld rather than guessed')
    render(<ConnectivityBanner elapsedMinutes={60} />)
    expect(screen.getByTestId('cc02-connectivity-banner')).toBeTruthy()
    cleanup()
    render(<ConnectivityBanner elapsedMinutes={59} />)
    expect(screen.queryByTestId('cc02-connectivity-banner')).toBeNull()
    cleanup()
    render(<ConnectivityBanner elapsedMinutes="unknown" />)
    expect(screen.queryByTestId('cc02-connectivity-banner')).toBeNull()
  })

  // FAILS IF: the three run states are collapsed, or any of them renders the
  // word the rule forbids. L36446 — "never collapsed into 'done'" — and
  // `AC-CC-186` (L36597). Each state is read on its OWN element so a shared
  // parent cannot supply another state's name by concatenation.
  // PLANTED: made `RunCompletionState` render 'done' for 'finished'.
  // RED: expected 'done — its figures marked final' to contain 'finished'.
  it('renders three distinct states and never the collapsing word', () => {
    expect(srcLine(36446)).toContain('never collapsed into "done"')
    expect(srcLine(36597)).toContain('AC-CC-186')
    for (const state of CC02_RUN_STATES) {
      cleanup()
      render(<RunCompletionState state={state} />)
      const el = screen.getByTestId(`cc02-run-state-${state}`)
      expect(el.textContent).toContain(state)
      // `done` as a whole word, not as part of another. The lexicon's own
      // rule is scoped `bare-claim`; here the element must not carry it at
      // all, because a run state IS the badge.
      expect(/(?<![a-z])done(?![a-z])/i.test(el.textContent ?? '')).toBe(false)
    }
  })
})

/* ==================================================================== *
 * THE LINK OUT. A LINK, AND NOTHING THAT ACTS.
 * ==================================================================== */

describe('the manual close is reachable and never performable here', () => {
  // FAILS IF: this surface grows a control for an act it does not own. The
  // assertion is the ABSENCE of every control element rather than the
  // presence of an anchor — a page carrying both a link and a button still
  // has a link, which is the "prefix" shape wearing a DOM hat.
  // PLANTED: added `<button type="button">Close run</button>` beside the
  //   anchor in `ManualCloseLink`.
  // RED: expected 1 to be 0 — one button in the manual-close subtree.
  it('renders a link and no control at all', () => {
    const { container } = render(<ManualCloseLink runRecordHref="/hub/runs/RUN-1" />)
    const el = screen.getByTestId('cc02-manual-close-link')
    expect(el.querySelectorAll('a')).toHaveLength(1)
    expect(container.querySelectorAll('button')).toHaveLength(0)
    expect(container.querySelectorAll('input')).toHaveLength(0)
    expect(container.querySelectorAll('textarea')).toHaveLength(0)
    expect(container.querySelectorAll('form')).toHaveLength(0)
    expect(container.querySelectorAll('[role="button"]')).toHaveLength(0)
  })

  // FAILS IF: the destination or the precondition stops reaching the reader.
  // Both are the cell's own clauses (L36459); a link that did not say where
  // it goes or that a note is required would leave a Supervisor to discover
  // the Hub's precondition after following it.
  // PLANTED: removed the precondition `<span>` from `ManualCloseLink`.
  // RED: Unable to find an element by:
  //      [data-testid="cc02-manual-close-precondition"].
  it('states the destination and the Hub’s precondition', () => {
    expect(srcLine(36459)).toContain('reached by a link from the drill')
    render(<ManualCloseLink runRecordHref="/hub/runs/RUN-1" />)
    const link = screen.getByTestId('cc02-manual-close-link')
    expect(link.textContent).toContain(CC02_MANUAL_CLOSE_LINK.destination)
    const pre = screen.getByTestId('cc02-manual-close-precondition')
    expect(pre.textContent).toContain('mandatory note')
    expect(pre.textContent).toContain('performed there')
  })

  // FAILS IF: the anchor points anywhere but the href it was handed. A link
  // that resolved its own Hub path here would be this surface deciding where
  // the Hub's record lives, which is the seam the Hub owns.
  // PLANTED: hard-coded `href="/command-center/close-run"` in the anchor.
  // RED: expected '/command-center/close-run' to be '/hub/runs/RUN-1'.
  it('links out rather than anywhere on this surface', () => {
    render(<ManualCloseLink runRecordHref="/hub/runs/RUN-1" />)
    const a = screen.getByTestId('cc02-manual-close-link').querySelector('a')
    expect(a?.getAttribute('href')).toBe('/hub/runs/RUN-1')
    expect(a?.getAttribute('href')).not.toContain('/command-center/')
  })
})
