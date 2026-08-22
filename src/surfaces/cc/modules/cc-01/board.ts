import type { CcModuleId } from '@/surfaces/cc/modules'
import { ccModule } from '@/surfaces/cc/modules'
import { ccScreen } from '@/surfaces/cc/screens'
import {
  CC_ELEMENT_CLASS_ASSIGNMENTS,
  type CcElementClassAssignment,
  type CcMarkerDevice,
  type CcMarkerState,
} from '@/surfaces/cc/live/model'
import {
  ccFallbackPatternById,
  queuesClientSide,
  type CcFallbackPattern,
  type CcFallbackPatternId,
} from '@/surfaces/cc/fallback/patterns'

/* ==================================================================== *
 * `MOD-CC-01` — THE LIVE SHIFT BOARD, AS SERVER DATA.
 *
 * NO `'use client'` IN THIS FILE AND NONE MAY BE ADDED. Everything below is
 * a plain data object a server component reads. Four Run Player panels
 * shipped `data-testid="fl-panel-undefined"` in slice 7 because their data
 * was a module-scope const inside a client module and Next.js replaces a
 * client module's exports with client references — invisible to every
 * component test, because a component suite mounts the component and the
 * client boundary only exists in a build. Only `./LiveShiftBoard` renders.
 *
 * NOTHING HERE IS REBUILT FROM ANOTHER TASK'S FILE. The freshness classes
 * and the eighteen-row element assignment are wave 0's `../../live/model`;
 * the nine fallback patterns are wave 0's `../../fallback/patterns`; the
 * screen row and the slug are the spine's. Each is CONSUMED, and the
 * derivations below read them rather than restating them.
 * ==================================================================== */

export const CC01_MODULE = ccModule('MOD-CC-01')
export const CC01_SCREEN = ccScreen('SCR-CC-02')

/**
 * The route directory's name, derived from the spine rather than typed, so
 * `app/command-center/live-shift-board/` has exactly one literal spelling of
 * itself and `CC_NAV`'s published pathname cannot drift from the tree.
 */
export const CC01_SLUG: string = (() => {
  const { slug } = CC01_MODULE
  if (slug === null) {
    throw new Error(
      'MOD-CC-01 declares no slug on the module spine, yet SCR-CC-02 names it as owner. A module ' +
        'that abstains from a route cannot own one.',
    )
  }
  return slug
})()

/* ==================================================================== *
 * THE FOUR-PART INFORMATION CONTRACT — L36231, AND PART THREE IS THE ONE.
 *
 * L36233: "Each of the four parts is a testable obligation, not a design
 * aspiration ... Part three is the one most often dropped in implementation
 * and is the one this platform cannot drop: a board that shows attention and
 * normality but not sync state is a board that lies by omission."
 *
 * That sentence is why this screen is where `MOD-CC-02`'s chrome and §21.3's
 * marker mount: part three IS the sync state, and a board without it fails
 * `AC-CC-160` (L36397) on every render.
 * ==================================================================== */

export interface Cc01ContractPart {
  readonly part: 1 | 2 | 3 | 4
  /** Verbatim from L36231's enumeration. */
  readonly obligation: string
  /** The `data-testid` on the region that discharges it. Never blank. */
  readonly renderedBy: string
}

export const CC01_INFORMATION_CONTRACT = [
  { part: 1, obligation: 'where attention is needed, ranked by severity', renderedBy: 'cc01-attention' },
  {
    part: 2,
    obligation: 'what is running normally, compressed to almost no visual cost',
    renderedBy: 'cc01-quiet-band',
  },
  {
    part: 3,
    obligation: 'what the platform cannot currently see — the sync state',
    renderedBy: 'cc01-sync-state',
  },
  { part: 4, obligation: 'one gesture from "noticed" to full context', renderedBy: 'cc01-drill' },
] as const satisfies readonly Cc01ContractPart[]

/**
 * The three display states of L36282, verbatim. Not the thirteen-row screen
 * inventory — that belongs to `SCR-CC-02` and is already transcribed with a
 * per-row owner in `../cc-02/chrome.ts`, which this task consumes rather
 * than writing a second time.
 */
export const CC01_DISPLAY_STATES = [
  { id: 'normal', meaning: 'exception-first summary band with no attention items' },
  { id: 'attention', meaning: 'one or more ranked attention items above the summary band' },
  {
    id: 'degraded',
    meaning: 'one or more sources stale or unavailable, with `FB-CC-STALE` presentation',
  },
] as const satisfies readonly { readonly id: string; readonly meaning: string }[]

/* ==================================================================== *
 * WHAT EACH CELL CONTRIBUTES — SIX ROWS, COUNTED.
 *
 * Header L36241, separator L36242, data L36243-L36248 — SIX rows, counted by
 * walking from the separator to the first line that is not a table row.
 * Columns, header-keyed: Board element, Source, Freshness class.
 *
 * ONE ROW'S CLASS CELL CARRIES A QUALIFIER AND IT IS NOT A FOURTH CLASS.
 * L36244 reads `Refreshed, driven by pushed events` — the transport is the
 * refresh and the trigger is a push. `classCell` keeps the cell as written
 * exactly as `../../live/model` does for `Report figures`, so the qualifier
 * is neither lost nor promoted.
 * ==================================================================== */

export interface Cc01CellContribution {
  /** Verbatim `Board element` cell. */
  readonly element: string
  /** Verbatim `Source` cell. */
  readonly source: string
  /** Verbatim `Freshness class` cell, qualifier included. */
  readonly classCell: string
  readonly sourceRef: string
}

export const CC01_CELL_CONTRIBUTIONS = [
  {
    element: 'Location (Cell) or line identity and the current shift',
    source: 'Delivery Operations Hub locations and shifts',
    classCell: 'Refreshed',
    sourceRef: 'L36243',
  },
  {
    element:
      "Status — the highest active severity among the cell's open deviations, with a distinct coaching-active state below deviation level",
    source:
      'Rule-based detection events against the global severity catalog as mapped per screen in the Standards and Operations Studio',
    classCell: 'Refreshed, driven by pushed events',
    sourceRef: 'L36244',
  },
  {
    element: 'Active runs against scheduled, and aggregate run progress',
    source: 'Delivery Operations Hub runs and assignments',
    classCell: 'Refreshed',
    sourceRef: 'L36245',
  },
  {
    element: 'Pace — the count of runs behind their expected timing',
    source: 'Studio-authored timing expectations plus execution telemetry',
    classCell: 'Refreshed',
    sourceRef: 'L36246',
  },
  {
    element: 'Missing-evidence count across active runs',
    source: 'Rule-based evidence-gap detection',
    classCell: 'Refreshed',
    sourceRef: 'L36247',
  },
  {
    element: 'Freshness marker',
    source: 'Device heartbeat and sync log',
    classCell: 'Refreshed',
    sourceRef: 'L36248',
  },
] as const satisfies readonly Cc01CellContribution[]

/* ==================================================================== *
 * THE ELEMENTS THIS BOARD STAMPS, AND WHY ONE OF THEM IS `MOD-CC-02`'S.
 *
 * `CC_ELEMENT_CLASS_ASSIGNMENTS` assigns eighteen elements across the
 * surface. Five name `MOD-CC-01`; they are derived below rather than listed,
 * so a row that changes module cannot leave a second list stale.
 *
 * AND THE SIXTH IS `Device heartbeat and last sync` (L35901), which names
 * `MOD-CC-02`. It rides here because L36503 says so — the module "supplies
 * markers to every other module; supplies the banner to the board" — and
 * because it is the ONE element on this screen whose marker obligation is
 * `Per-device last-seen time`. Dropping it would leave this board rendering
 * the marker's own source data as a single scope timestamp, which is exactly
 * the defect wave 0 named: TWO rows of the eighteen are per-device, not one,
 * and the other (`Hold per-device confirmation state`, L35897) is
 * `MOD-CC-04`'s and does not appear on this screen.
 *
 * So the assertion this file can honestly make is narrow and is made
 * narrowly: of the elements THIS SCREEN carries, exactly one is per-device,
 * and it is the marker's own. `CC01_PER_DEVICE_ELEMENTS` is derived from the
 * `perDevice` flag rather than from a count, because a count of two is also
 * true of the flags moved onto the wrong pair.
 * ==================================================================== */

const namesModule = (row: CcElementClassAssignment, id: CcModuleId): boolean =>
  (row.modules as readonly CcModuleId[]).includes(id)

/** The five the eighteen-row table assigns to this module. Derived. */
export const CC01_OWN_ELEMENTS: readonly CcElementClassAssignment[] =
  CC_ELEMENT_CLASS_ASSIGNMENTS.filter((r) => namesModule(r, 'MOD-CC-01'))

/**
 * The marker's own source data, assigned to `MOD-CC-02` and rendered here.
 * Looked up by its `Element` cell so a table edit that renamed or dropped the
 * row throws at import rather than silently rendering five elements.
 */
export const CC01_MARKER_ELEMENT: CcElementClassAssignment = (() => {
  const row = CC_ELEMENT_CLASS_ASSIGNMENTS.find(
    (r) => r.element === 'Device heartbeat and last sync',
  )
  if (row === undefined) {
    throw new Error(
      'The eighteen-row assignment table no longer carries "Device heartbeat and last sync". ' +
        'That row (L35901) is the marker\'s own per-device source data on this screen; without ' +
        'it the board would render the marker as a single scope timestamp.',
    )
  }
  return row
})()

/** Every element this screen stamps, in the table's own order. */
export const CC01_BOARD_ELEMENTS: readonly CcElementClassAssignment[] = [
  ...CC01_OWN_ELEMENTS,
  CC01_MARKER_ELEMENT,
]

/** Derived from the flag, never from a count. See the header. */
export const CC01_PER_DEVICE_ELEMENTS: readonly string[] = CC01_BOARD_ELEMENTS.filter(
  (r) => r.perDevice,
).map((r) => r.element)

/* ==================================================================== *
 * EXCEPTION-FIRST IS A REAL AGGREGATION, NOT A STYLING CHOICE.
 *
 * L36237 — "the board's rendering cost must scale with the exception count,
 * not the cell count. A board that renders 120 full tiles and then visually
 * de-emphasises 113 of them has met the design intent and failed the scale
 * requirement. The summary band is a real aggregation, not a styling
 * choice." `AC-CC-162` (L36399) verifies it at 8, 47 and 120 cells.
 *
 * So the plan returns the tiles to RENDER and a COUNT for the rest. There is
 * no field holding the suppressed tiles, because a field holding them is the
 * failure: something downstream would render them.
 * ==================================================================== */

export interface Cc01BoardCell {
  readonly cellId: string
  /** `null` where nothing about this cell needs a person. */
  readonly exception: string | null
}

export interface Cc01RenderPlan {
  /** Only the exceptions. The quiet cells are not in this array at all. */
  readonly tiles: readonly Cc01BoardCell[]
  /** L36235's quiet band: a count and its sync state, never 113 tiles. */
  readonly quietCount: number
}

export function cc01RenderPlan(cells: readonly Cc01BoardCell[]): Cc01RenderPlan {
  const tiles = cells.filter((c) => c.exception !== null)
  return { tiles, quietCount: cells.length - tiles.length }
}

/**
 * L36235's band, and the sync half is DERIVED rather than claimed.
 *
 * The source's own band reads "47 cells normal · all synced" and L36288 says
 * the band carries "its count and sync state". Taking `all synced` as a
 * literal would print it beside a device list that has one tablet dark, which
 * is the single sentence this board must never render: L36305 — "a cell
 * showing 'normal' while offline is showing a **remembered** normal, and the
 * marker is what distinguishes the two." So the caller passes `ccMarkerText`'s
 * output and the claim can only ever be as strong as the device data.
 */
export const cc01QuietBandText = (quietCount: number, syncStateText: string): string =>
  `${quietCount} cells normal · ${syncStateText}`

/* ==================================================================== *
 * THE FOUR FALLBACKS THIS CARD NAMES, AND THE SESSION-OFFLINE STATEMENT.
 *
 * L36329 — "`FB-CC-STALE` for aggregate staleness; `FB-CC-PUSH` for
 * transport loss; `FB-CC-SESS` for session loss; `FB-CC-AGENT` for the
 * coaching-active state's unavailability." Four of the nine. Each is looked
 * up in wave 0's registry, so this module names patterns rather than
 * re-transcribing their cells.
 *
 * THE SESSION-OFFLINE BEHAVIOUR IS THIS SCREEN'S OWN AND IT IS STRONGER
 * THAN THE SURFACE RULE. L36307 — "`FB-CC-SESS`: the board freezes with its
 * labelled banner. No board interaction queues anything, because the board
 * writes nothing in any case." The surface refuses to queue as a discipline;
 * this board has nothing to queue, because L36278 says "no records. The
 * board writes nothing" and L36280 says "None. This module is read-only by
 * construction."
 *
 * `queuesClientSide` is asked of the registry rather than asserted, so a
 * `FB-CC-SESS` row that ever gained a queue turns this false in one place.
 * The library itself (`<CcFallbackLibrary />`) is surface-wide and its
 * declared wiring is the shell, not this screen; this screen names the four
 * that are its own.
 * ==================================================================== */

export const CC01_FALLBACK_IDS = [
  'FB-CC-STALE',
  'FB-CC-PUSH',
  'FB-CC-SESS',
  'FB-CC-AGENT',
] as const satisfies readonly CcFallbackPatternId[]

export const CC01_FALLBACKS: readonly CcFallbackPattern[] =
  CC01_FALLBACK_IDS.map(ccFallbackPatternById)

export const CC01_WRITES_RECORDS = false

export const CC01_SESSION_OFFLINE = {
  /** Verbatim from L36307, from the clause after `FB-CC-SESS`. */
  behaviour:
    'the board freezes with its labelled banner. No board interaction queues anything, because ' +
    'the board writes nothing in any case.',
  sourceRef: 'L36307',
  /** Derived from the pattern registry, never written down beside it. */
  queuesNothing: !queuesClientSide(ccFallbackPatternById('FB-CC-SESS')),
  whyNoWriteControl:
    'This module draws no decision control at all, so there is nothing for a frozen session to ' +
    'disable here. L36278 — "no records. The board writes nothing." L36280 — "None. This module ' +
    'is read-only by construction." The ten operational actions are MOD-CC-13\'s and mount as ' +
    'its rail; the frozen-session gate reason belongs on those controls, not on this board.',
} as const

/* ==================================================================== *
 * THE BOARD'S MARKER DATA, AND EVERY NUMBER IN IT IS THE SOURCE'S.
 *
 * A `FreshnessMarker` needs a device count, an offline count and an age. The
 * shell has none of the three and correctly mounted neither module rather
 * than inventing them. This screen HAS them, and it has them because the
 * source states them: `SB-CC-08`'s device list is a real table at
 * L35967-L35969 with three named devices, and its first row reads `Unknown
 * while offline` where the other two read `0`.
 *
 * NOT ONE FIGURE BELOW IS THIS BUILD'S. Every value is transcribed and
 * carries its line, and the whole fixture is labelled on screen as the
 * storyboard's rather than presented as live telemetry. The distinction
 * matters here more than anywhere: the marker's entire purpose is that a
 * number on this surface is never more confident than the platform's
 * knowledge, and a fabricated device count would defeat `AC-CC-123`
 * (L35982) with the marker itself as the liar.
 *
 * THE FIRST ROW IS WHY `pendingCaptures` IS A UNION AND NOT A NUMBER.
 * `AC-CC-122` (L35981) — the marker never reports zero for a device whose
 * pending count is unknown. `'unknown'` is the value, not a sentinel; there
 * is no `-1` and no `null` a renderer would print as blank.
 * ==================================================================== */

export const CC01_STORYBOARD_DEVICES = [
  {
    deviceId: 'TAB-014',
    cell: 'Wheel Station 2',
    lastSeen: '09:11:47',
    lastSync: '09:11:47',
    pendingCaptures: 'unknown',
  },
  {
    deviceId: 'TAB-015',
    cell: 'Wheel Station 2',
    lastSeen: '10:21:58',
    lastSync: '10:21:58',
    pendingCaptures: 0,
  },
  {
    deviceId: 'TAB-016',
    cell: 'Wheel Station 2',
    lastSeen: '10:21:12',
    lastSync: '10:21:12',
    pendingCaptures: 0,
  },
] as const satisfies readonly CcMarkerDevice[]

/** `SB-CC-08`, L35963-L35971. Board scope, because the board is the scope. */
export const CC01_BOARD_MARKER: CcMarkerState = {
  scope: 'board',
  devices: CC01_STORYBOARD_DEVICES,
  lastSyncInScope: '09:11',
  inventoryAvailable: true,
}

/** L35971, verbatim but for the time this passes through. */
export const CC01_LAST_INVENTORY_READ = '10:20:03'

/**
 * THE CONNECTIVITY BANNER IS WITHHELD, AND WITHHOLDING IT IS THE RULE.
 *
 * `MOD-CC-02`'s `ConnectivityBanner` renders at and above the sixty-minute
 * tenant threshold and renders nothing for an unknown elapsed time. Neither
 * of this board's two storyboards states a site-wide outage: `SB-CC-12`
 * (L36383) opens "Live · all devices synced" and the illustrative example at
 * L36391 has one tablet out of contact, not a site. So this screen passes
 * `'unknown'` rather than a minute count it would have to invent, and
 * L36587 is the warrant: "treat unknown as not-lost and continue to render
 * per-device markers, because a false site-wide banner would be its own
 * credibility failure ... the tenant banner is withheld rather than
 * guessed."
 *
 * A number here would be the storyboard's illustrative figure rendered as a
 * value — the precise thing the shell refused to do, arriving one screen
 * later.
 */
export const CC01_SITE_ELAPSED_MINUTES: number | 'unknown' = 'unknown'

/* ==================================================================== *
 * THE SUPERVISOR'S LANDING, AND WHOSE ROLE THIS PAGE RENDERS FOR.
 *
 * L35076 — `Supervisor only | Scoped live shift board | The board is the
 * Supervisor's working instrument`. That is a routing fact with a rendering
 * consequence: the first screen a Supervisor sees must be honest about its
 * own freshness before it is useful, which is why the marker mounts here.
 *
 * The role is needed by two consumers that both ask a role-shaped question —
 * `ccLinkOutModel` asks whether the viewer's own role reaches the owning
 * surface, and `ActionRail` reads the viewer's column. It is NOT an access
 * decision: `evaluateCCAccess` answers that at the door on a real request.
 * ==================================================================== */

export const CC01_LANDING_ROLE = 'SUPERVISOR' as const
export const CC01_LANDING_REF = 'L35076'
