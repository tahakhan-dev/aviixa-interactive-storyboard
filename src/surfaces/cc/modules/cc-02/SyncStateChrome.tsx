import { HonestElement } from '@/honesty/HonestElement'
import type { CommandState } from '@/surfaces/sa/command-state'
import {
  CC02_BANNER_FACT,
  CC02_MARKER_STATES,
  CC02_RUN_STATE_FACT,
  CC02_RUN_STATE_RENDERINGS,
  CC02_TENANT_BANNER_MINUTES,
  cc02BannerShows,
  cc02DeviceIntent,
  cc02NoDeviceIntent,
  cc02PendingText,
  type Cc02MarkerStateId,
  type Cc02PendingCaptures,
  type Cc02RunState,
} from './chrome'
import { CC02_MANUAL_CLOSE_LINK, cc02Affordance, cc02Row } from './matrix'

/* ==================================================================== *
 * `MOD-CC-02` RENDERED. CHROME, ON SOMEBODY ELSE'S SCREEN.
 *
 * NO `'use client'`, AND NO ROUTE. This module owns no screen; these are the
 * elements it supplies to every other module (L36503) and to every tile and
 * drill view (L36443). There is no page here, no `app/command-center/`
 * directory, and nothing in this file registers anything.
 *
 * EVERY ELEMENT GOES THROUGH `HonestElement`, WHICH IS THE POINT. L36435
 * says this module renders §21.3's honesty rule "as concrete interface
 * elements", and `src/honesty/HonestElement.tsx` is the three-clause test as
 * a type: a device-derived fact without an age and a device-aimed intent
 * without a `CommandState` are both unrepresentable. So the marker cannot be
 * rendered without its origin and age, and the module whose whole job is
 * honesty about knowledge does not get its own second-best version of the
 * check. A defective element THROWS there rather than rendering, which is why
 * nothing below needs a guard of its own.
 *
 * THE MARKER RENDERS BEFORE THE VALUE. L36475 — "renders the marker before
 * the element's value renders" — so `SyncStateChrome` takes the value as
 * `children` and puts the marker above it rather than beside it.
 * ==================================================================== */

export interface FreshnessMarkerProps {
  readonly state: Cc02MarkerStateId
  /** The last successful sync in this element's scope, as displayed. */
  readonly lastSyncLabel: string
  readonly devicesOffline: number
  readonly devicesTotal: number
  readonly pending: Cc02PendingCaptures
  /**
   * The per-device command confirmation state the marker supports
   * (`FB-CC-CMD`, L36520), or `null` where this element carries no intent
   * aimed at a device.
   *
   * REQUIRED AND NULLABLE, NEVER OPTIONAL OR DEFAULTED. A defaulted parameter
   * does not count toward `Function.length` and slice 7 recorded an arity
   * gate beaten by exactly that; worse here, a default would make every
   * marker silently declare itself not-about-a-device, which is the effect
   * clause quietly answered on the caller's behalf.
   */
  readonly commandState: CommandState | null
}

/**
 * The marker's own words for each state. `unknown-pending` has no storyboard
 * rendering — `SB-CC-13` has no slot for it — so its wording is built from
 * its rule (`FUNC-CC-0201-1-3`, L36530) rather than quoted, and the count
 * text goes through `cc02PendingText`, which cannot print a zero for an
 * unknown.
 */
function markerText(p: FreshnessMarkerProps): string {
  switch (p.state) {
    case 'live-all-synced':
      return 'Live · all devices synced'
    case 'partially-synced':
      return `Synced ${p.lastSyncLabel} · ${p.devicesOffline} of ${p.devicesTotal} devices offline · ${cc02PendingText(p.pending)}`
    case 'unknown-pending':
      return `Synced ${p.lastSyncLabel} · ${cc02PendingText(p.pending)}`
    case 'inventory-unavailable':
      return `Device sync state unavailable · last successful sync in this scope ${p.lastSyncLabel}`
  }
}

const markerState = (id: Cc02MarkerStateId) => {
  const found = CC02_MARKER_STATES.find((s) => s.id === id)
  if (found === undefined) throw new Error(`Unknown MOD-CC-02 marker state: ${id}`)
  return found
}

/**
 * The freshness marker. `AC-CC-180` (L36591) requires one "in every state,
 * including healthy", so there is no branch here that renders nothing — a
 * marker that only appears in trouble is the defect `SUB-CC-0201-2` (L36531)
 * is named for.
 */
export function FreshnessMarker(props: FreshnessMarkerProps) {
  const state = markerState(props.state)
  return (
    <div data-testid={`cc02-marker-${props.state}`}>
      <HonestElement
        statement={markerText(props)}
        fact={{ from: 'device', asOfLabel: state.fact.asOfLabel }}
        intent={
          props.commandState === null
            ? cc02NoDeviceIntent
            : cc02DeviceIntent(props.commandState)
        }
      />
    </div>
  )
}

/**
 * The site-wide banner, at the sixty-minute threshold and no other. The two
 * thresholds either side of it are platform-side and explicitly not tenant
 * channels (L36509, L36511), and their functionalities prohibit tenant roles
 * outright (L36535, L36537) — so this surface renders one of the three.
 *
 * Unknown elapsed time withholds the banner rather than guessing it: L36587
 * makes that the terminal safe state, "a false site-wide banner would be its
 * own credibility failure".
 */
export function ConnectivityBanner({
  elapsedMinutes,
}: {
  readonly elapsedMinutes: number | 'unknown'
}) {
  if (!cc02BannerShows(elapsedMinutes)) return null
  return (
    <div data-testid="cc02-connectivity-banner" role="status">
      <HonestElement
        statement={`This site has been out of contact for ${String(elapsedMinutes)} minutes, past the ${CC02_TENANT_BANNER_MINUTES}-minute threshold. Every tile below still carries its own marker.`}
        fact={CC02_BANNER_FACT}
        intent={cc02NoDeviceIntent}
      />
    </div>
  )
}

/**
 * A run's completion state, one of three and never collapsed (L36446,
 * `AC-CC-186` L36597). The state is the Hub record's, so the origin clause
 * answers "the server's own record" and no age is claimed for it; the device
 * age that belongs beside it is the marker's own element.
 *
 * NOTHING HERE TRANSITIONS A MANUALLY CLOSED RUN. `DEC-STUCK-001` is open on
 * exactly that question and this card states Reading B as flat fact at
 * L36485 while L27917 states Reading A. This component renders the state it
 * is given and derives none.
 */
export function RunCompletionState({ state }: { readonly state: Cc02RunState }) {
  const rendering = CC02_RUN_STATE_RENDERINGS.find((r) => r.state === state)
  if (rendering === undefined) throw new Error(`Unknown MOD-CC-02 run state: ${state}`)
  return (
    <div data-testid={`cc02-run-state-${state}`}>
      <HonestElement
        statement={`${state} — ${rendering.meaning}`}
        fact={CC02_RUN_STATE_FACT}
        intent={cc02NoDeviceIntent}
      />
    </div>
  )
}

/**
 * THE LINK OUT, AND IT IS A LINK.
 *
 * Row 8's Supervisor cell opens `Allowed with conditions`, and what it
 * permits happens on the Delivery Operations Hub run record. `cc02Affordance`
 * asks the surface question first and returns `link-out`; this component
 * renders that answer and has no other branch. There is no button, no
 * handler, no note field and no `onClose` prop — a note input here would be
 * the Command Center collecting the Hub's mandatory note, which is the record
 * edit L38704 excludes absolutely, for every role.
 *
 * The precondition is STATED rather than collected, so a Supervisor knows
 * before following the link that a note is required and where the act lives.
 */
export function ManualCloseLink({ runRecordHref }: { readonly runRecordHref: string }) {
  const row = cc02Row('manually-close-a-stuck-run')
  if (cc02Affordance(row) !== 'link-out') return null
  return (
    <p data-testid="cc02-manual-close-link">
      <a href={runRecordHref}>Close this stuck run on {CC02_MANUAL_CLOSE_LINK.destination}</a>{' '}
      <span data-testid="cc02-manual-close-precondition">
        The close is performed there and requires {CC02_MANUAL_CLOSE_LINK.precondition}.
      </span>
    </p>
  )
}

/**
 * The chrome around one element's value. The marker comes first because
 * L36475 says it renders before the value does, and the value is `children`
 * so this module never has to know what it is wrapping — which is what
 * "available everywhere on the surface" (L36435) requires.
 */
export function SyncStateChrome({
  marker,
  children,
}: {
  readonly marker: FreshnessMarkerProps
  readonly children?: React.ReactNode
}) {
  return (
    <div data-testid="cc02-chrome">
      <FreshnessMarker {...marker} />
      {children}
    </div>
  )
}
