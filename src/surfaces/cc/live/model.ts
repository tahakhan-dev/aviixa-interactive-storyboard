import type { CcModuleId } from '@/surfaces/cc/modules'
import type { DecisionReading } from '@/disclosure/decisions'

/* ==================================================================== *
 * §21.3 — THE LIVE MODEL OF `SURF-CC`. THE SURFACE'S, NOT A MODULE'S.
 *
 * Five subsections, each verified as a heading before anything below was
 * written:
 *
 *   L35819  21.3.1  The three freshness classes
 *   L35925  21.3.2  The freshness marker and what selecting it reveals
 *   L35994  21.3.3  Connectivity loss, made visible
 *   L36068  21.3.4  As-of times, late data and the materiality default
 *   L36136  21.3.5  Run completion — submitted, complete, finished, and manual close
 *
 * WHY THIS IS ONE FILE AND NOT THIRTEEN. Every Command Center module states
 * its own behaviour against this model. Invented mid-slice, twelve tasks each
 * invent a different one — which is exactly what happened to the Super Admin
 * aggregate vocabulary, where ten screens defined six different member sets
 * before `src/surfaces/sa/freshness.ts` was hoisted.
 *
 * AND IT IS NOT THE SUPER ADMIN'S MODEL. `SA_FRESHNESS` is a SEVEN-token
 * vocabulary — `current`, `stale`, `unavailable`, `reconciled`, `loading`,
 * `empty`, `recovering` — scoped to `OBJ-SA-AGGREGATE` and keyed on
 * `ScreenStateId`. It answers "how does this aggregate read right now". §21.3
 * answers a different question: "by what transport does this element arrive,
 * and what must it therefore always show". The two are orthogonal — a
 * `pushed` element can read `stale` — so neither is expressible in the other
 * and neither file is extended by this one. Both are read, neither is edited.
 *
 * `src/ui/primitives/FreshnessLabel.tsx` TAKES TWO FREE-TEXT STRINGS,
 * `asOfLabel` and `originLabel`, and renders them joined by a comma. It cannot
 * carry a class assignment, cannot carry the per-element marker obligation,
 * and has no way to render "unknown" as distinct from a missing string. It is
 * a consumer's file, so `./FreshnessMarker` is built here instead of that one
 * being widened.
 *
 * NO `'use client'` IN THIS FILE AND NONE MAY BE ADDED. Four Run Player
 * panels shipped `data-testid="fl-panel-undefined"` in slice 7 because their
 * data was a module-scope const inside a client module, and Next.js replaces a
 * client module's exports with client references. Every table below is server
 * data; only `./FreshnessMarker` crosses the boundary, and it exports a
 * component and a props type, never a table.
 * ==================================================================== */

/* ==================================================================== *
 * 21.3.1 — THE THREE CLASSES.
 *
 * COUNTED, NOT INFERRED FROM A SPAN. Header L35827, separator L35828, data
 * L35829-L35831 — THREE rows, and the line after the last is blank, so the
 * body stops there. The blank itself is deliberately NOT cited:
 * `tests/coverage/locator-fidelity.test.ts` lexes any L-number in a comment as
 * a citation, and naming a blank line files a knowingly-false one. The suite
 * asserts the stop directly instead.
 *
 * L35825 states the rule the enum exists to keep: "Every element on the
 * surface belongs to exactly one of three classes", and assigning an element
 * to the wrong class "either burns network capacity for no benefit or, far
 * worse, implies a currency it does not have".
 * ==================================================================== */

export type CcFreshnessClass = 'pushed' | 'refreshed' | 'on-sync'

export const CC_FRESHNESS_CLASSES = [
  'pushed',
  'refreshed',
  'on-sync',
] as const satisfies readonly CcFreshnessClass[]

// Fails to compile if the union gains a member the array does not list, or
// the array gains one the union does not name. Both directions, because
// `satisfies` alone only checks one of them.
type _AssertClassesExhaustive = [CcFreshnessClass] extends [(typeof CC_FRESHNESS_CLASSES)[number]]
  ? [(typeof CC_FRESHNESS_CLASSES)[number]] extends [CcFreshnessClass]
    ? true
    : never
  : never
const _classesExhaustive: _AssertClassesExhaustive = true
void _classesExhaustive

export interface CcFreshnessClassRecord {
  readonly id: CcFreshnessClass
  /** Verbatim `Class` cell. */
  readonly label: string
  /** Verbatim `What is in it` cell. */
  readonly contents: string
  /** Verbatim `How it moves` cell. */
  readonly movement: string
  /** Verbatim `Honest latency` cell. The source's own word is "honest". */
  readonly honestLatency: string
  readonly sourceRef: string
}

export const CC_FRESHNESS_CLASS_TABLE = [
  {
    id: 'pushed',
    label: 'Pushed (event)',
    contents:
      'Rule-based triggers and what follows from them: deviations opened, escalations fired, ' +
      'agent proposals entering the gate queue, learned-change proposals, sync-conflict events, ' +
      'connectivity warnings, agent outputs',
    movement: 'Pushed to every open Command Center session the moment the event reaches the server',
    honestLatency:
      'Seconds from server receipt — though receipt itself can be delayed by an offline device, ' +
      'and the event displays its origin time against its receipt time',
    sourceRef: 'L35829',
  },
  {
    id: 'refreshed',
    label: 'Refreshed (state)',
    contents:
      "The board's aggregates: cell and line status, active run counts, run progress and pace, " +
      'key performance indicator tiles, coaching indicators',
    movement:
      'Periodic refresh — default every 60 seconds, tenant-configurable down to a platform floor ' +
      "of 30 seconds; intervals faster than the default are validated against the deployment's " +
      'scale before they apply',
    honestLatency: 'Up to one refresh interval',
    sourceRef: 'L35830',
  },
  {
    id: 'on-sync',
    label: 'On-sync (eventual)',
    contents:
      'Step-level data from offline devices; late-arriving captures within the record-finish ' +
      'window, flagged as late',
    movement: 'Arrives when the device reconnects; affected numbers recompute on landing',
    honestLatency:
      'Minutes to hours — which is exactly what the freshness marker exists to show',
    sourceRef: 'L35831',
  },
] as const satisfies readonly CcFreshnessClassRecord[]

/* ==================================================================== *
 * THE PUSHED CLASS MEASURES FROM SERVER RECEIPT, NEVER FROM THE FLOOR.
 *
 * L35835 — "An event that occurred on an offline device at 09:41 and reached
 * the server at 10:22 is pushed within seconds of 10:22 and is displayed with
 * both times. The platform never implies it knew at 09:41."
 *
 * `originTime` is therefore never optional and never inferred: a pushed
 * element that carries only one time cannot say which of the two it is.
 * ==================================================================== */

export interface CcPushedTimes {
  /** When it happened, on the device. */
  readonly originTime: string
  /** When the server learned of it. Latency is measured from THIS. */
  readonly receiptTime: string
}

/** L35835, `AC-CC-112` (L35909): where the two differ, BOTH render. */
export const ccPushedShowsBothTimes = (t: CcPushedTimes): boolean =>
  t.originTime !== t.receiptTime

/* ==================================================================== *
 * THE REFRESH NUMBERS, AND A QUALIFIER THAT DIFFERS FROM THE NUMBERS CANON.
 *
 * L35837 — "The default is 60 seconds; the tenant may configure down to a
 * platform floor of 30 seconds; and intervals faster than the default are
 * validated against the deployment's scale before they apply". The pair is
 * fixed in the numbers canon and quoted exactly.
 *
 * THE NUMBERS ARE THE SAME EVERYWHERE; THE QUALIFIER IS NOT, AND IT IS THE
 * QUALIFIER `DEC-REFRESH-001` TURNS ON. §21.3 calls 30 seconds a PLATFORM
 * floor (L35830, L35837). The numbers canon's own register row calls it a
 * per-tenant floor — L12899, "Command Center board refresh | 60 seconds |
 * Per-tenant floor 30 seconds | Shorter is stricter". Counted across the
 * frozen source: three occurrences of "platform floor of 30 seconds" against
 * thirteen of "per-tenant floor of 30 seconds". A platform floor is not a
 * tenant's to cross; a per-tenant floor is a bound a tenant sets within. That
 * difference is carried on the decision below, not resolved here, and no
 * number is changed by it.
 * ==================================================================== */

export const CC_REFRESH_DEFAULT_SECONDS = 60
export const CC_REFRESH_FLOOR_SECONDS = 30

/**
 * `AC-CC-113` (L35910) — "accepts values down to 30 seconds subject to scale
 * validation, and rejects values below 30 seconds rather than clamping
 * silently." Returns the outcome rather than a boolean so a caller cannot
 * collapse "rejected" and "needs validation" into one branch; clamping is not
 * a member, because a clamp is the behaviour the criterion forbids.
 */
export type CcRefreshOutcome = 'rejected-below-floor' | 'requires-scale-validation' | 'accepted'

export function ccRefreshOutcome(seconds: number): CcRefreshOutcome {
  if (seconds < CC_REFRESH_FLOOR_SECONDS) return 'rejected-below-floor'
  if (seconds < CC_REFRESH_DEFAULT_SECONDS) return 'requires-scale-validation'
  return 'accepted'
}

/**
 * `FB-CC-STALE`'s entry condition for a refreshed element, from step 4 of the
 * numbered workflow at L35848: "Where the element's class is refreshed and the
 * last successful refresh is older than two intervals, the element enters
 * `FB-CC-STALE` and shows its age prominently rather than quietly."
 *
 * STRICTLY OLDER THAN, not at-or-after. The source says "older than two
 * intervals" and a boundary read the other way puts an element into a fallback
 * one tick early, which on the default interval is a stale banner at 120
 * seconds on a board that refreshed on time.
 */
export const ccIsStale = (ageSeconds: number, intervalSeconds: number): boolean =>
  ageSeconds > 2 * intervalSeconds

/* ==================================================================== *
 * THE 18-ROW ASSIGNMENT TABLE — THE SPINE OF THE WHOLE MODEL.
 *
 * COUNTED, NOT INFERRED. Header L35882, separator L35883, data
 * L35884-L35901 — EIGHTEEN rows, and the line after the last is blank, so the
 * body stops there. The blank is not cited; the suite asserts the stop. Columns, header-keyed: Element, Module, Class, Marker obligation.
 *
 * THE OBLIGATION IS PER-ELEMENT, NOT PER-CLASS, WHICH IS THE WHOLE REASON A
 * CLASS ENUM ALONE CANNOT EXPRESS THIS. Eight rows are `Refreshed` and they
 * carry FOUR different obligations between them: `As-of time` on five,
 * `As-of time; floor completions arrive on-sync`, `Per-device timestamps`,
 * `Per-device last-seen time`. Seven are `Pushed` and no two of those seven
 * share an obligation at all.
 *
 * TWO ROWS ARE PER-DEVICE, NOT ONE. `Hold per-device confirmation state`
 * (L35897) reads `Per-device timestamps` and `Device heartbeat and last sync`
 * (L35901) reads `Per-device last-seen time`. A model that made only the first
 * per-device would render the marker's own source data as a single scope
 * timestamp. `perDevice` below is a field, not a special case on one row.
 *
 * ONE ROW PUTS A CLASS AND A QUALIFIER IN THE SAME CELL. L35900, `Report
 * figures` (`MOD-CC-11`), Class cell verbatim: `Refreshed with an explicit
 * data-as-of stamp`. `classCell` keeps the cell as written and `freshnessClass`
 * carries the class it names, so the qualifier is neither lost nor promoted
 * into a fourth class.
 * ==================================================================== */

export interface CcElementClassAssignment {
  /** Verbatim `Element` cell. */
  readonly element: string
  /** Verbatim `Module` cell, split. Two rows name two modules. */
  readonly modules: readonly CcModuleId[]
  /** Verbatim `Class` cell, INCLUDING any qualifier. Never normalised. */
  readonly classCell: string
  /** The class `classCell` names. Derived by reading, asserted by the suite. */
  readonly freshnessClass: CcFreshnessClass
  /** Verbatim `Marker obligation` cell. */
  readonly markerObligation: string
  /** Whether the obligation is stated per device rather than per scope. */
  readonly perDevice: boolean
  readonly sourceRef: string
}

export const CC_ELEMENT_CLASS_ASSIGNMENTS = [
  {
    element: 'Deviation opened',
    modules: ['MOD-CC-04', 'MOD-CC-09'],
    classCell: 'Pushed',
    freshnessClass: 'pushed',
    markerObligation: 'Origin and receipt times',
    perDevice: false,
    sourceRef: 'L35884',
  },
  {
    element: 'Escalation fired and its routing state',
    modules: ['MOD-CC-09'],
    classCell: 'Pushed',
    freshnessClass: 'pushed',
    markerObligation: 'Origin and receipt times; fallback marked',
    perDevice: false,
    sourceRef: 'L35885',
  },
  {
    element: 'Gate item arrival',
    modules: ['MOD-CC-05'],
    classCell: 'Pushed',
    freshnessClass: 'pushed',
    markerObligation: 'Waiting time from arrival',
    perDevice: false,
    sourceRef: 'L35886',
  },
  {
    element: 'Lane B proposal arrival',
    modules: ['MOD-CC-06'],
    classCell: 'Pushed',
    freshnessClass: 'pushed',
    markerObligation: 'Age in days against the 30-day stale flag',
    perDevice: false,
    sourceRef: 'L35887',
  },
  {
    element: 'Sync-conflict event',
    modules: ['MOD-CC-10'],
    classCell: 'Pushed',
    freshnessClass: 'pushed',
    markerObligation: 'Both device timestamps and server receipt',
    perDevice: false,
    sourceRef: 'L35888',
  },
  {
    element: 'Connectivity warning',
    modules: ['MOD-CC-02'],
    classCell: 'Pushed',
    freshnessClass: 'pushed',
    markerObligation: 'Time of detection',
    perDevice: false,
    sourceRef: 'L35889',
  },
  {
    element: 'Agent output produced',
    modules: ['MOD-CC-08', 'MOD-CC-12'],
    classCell: 'Pushed',
    freshnessClass: 'pushed',
    markerObligation: 'Production time',
    perDevice: false,
    sourceRef: 'L35890',
  },
  {
    element: 'Cell and line status',
    modules: ['MOD-CC-01'],
    classCell: 'Refreshed',
    freshnessClass: 'refreshed',
    markerObligation: 'As-of time',
    perDevice: false,
    sourceRef: 'L35891',
  },
  {
    element: 'Active runs against scheduled',
    modules: ['MOD-CC-01'],
    classCell: 'Refreshed',
    freshnessClass: 'refreshed',
    markerObligation: 'As-of time',
    perDevice: false,
    sourceRef: 'L35892',
  },
  {
    element: 'Run progress and pace',
    modules: ['MOD-CC-01', 'MOD-CC-03'],
    classCell: 'Refreshed',
    freshnessClass: 'refreshed',
    markerObligation: 'As-of time',
    perDevice: false,
    sourceRef: 'L35893',
  },
  {
    element: 'Key performance indicator tiles',
    modules: ['MOD-CC-01'],
    classCell: 'Refreshed',
    freshnessClass: 'refreshed',
    markerObligation: 'As-of time',
    perDevice: false,
    sourceRef: 'L35894',
  },
  {
    element: 'Coaching indicators',
    modules: ['MOD-CC-01', 'MOD-CC-08'],
    classCell: 'Refreshed',
    freshnessClass: 'refreshed',
    markerObligation: 'As-of time',
    perDevice: false,
    sourceRef: 'L35895',
  },
  {
    /*
     * THE ROW WHOSE OBLIGATION NAMES A SECOND CLASS. The element is
     * `Refreshed`, and its obligation says its inputs are not: "floor
     * completions arrive on-sync". The class is the element's transport, not
     * its data's provenance, and this row is where the two visibly differ.
     */
    element: 'Containment checklist progress',
    modules: ['MOD-CC-04'],
    classCell: 'Refreshed',
    freshnessClass: 'refreshed',
    markerObligation: 'As-of time; floor completions arrive on-sync',
    perDevice: false,
    sourceRef: 'L35896',
  },
  {
    element: 'Hold per-device confirmation state',
    modules: ['MOD-CC-04'],
    classCell: 'Refreshed',
    freshnessClass: 'refreshed',
    markerObligation: 'Per-device timestamps',
    perDevice: true,
    sourceRef: 'L35897',
  },
  {
    element: 'Step-level capture detail',
    modules: ['MOD-CC-03'],
    classCell: 'On-sync',
    freshnessClass: 'on-sync',
    markerObligation: 'As-of time and late-arrival flag',
    perDevice: false,
    sourceRef: 'L35898',
  },
  {
    element: 'Evidence media',
    modules: ['MOD-CC-04'],
    classCell: 'On-sync',
    freshnessClass: 'on-sync',
    markerObligation: 'As-of time',
    perDevice: false,
    sourceRef: 'L35899',
  },
  {
    /* A CLASS AND A QUALIFIER IN ONE CELL. See the header. */
    element: 'Report figures',
    modules: ['MOD-CC-11'],
    classCell: 'Refreshed with an explicit data-as-of stamp',
    freshnessClass: 'refreshed',
    markerObligation: 'Data-as-of timestamp on the file itself',
    perDevice: false,
    sourceRef: 'L35900',
  },
  {
    /* THE SECOND PER-DEVICE ROW. See the header. */
    element: 'Device heartbeat and last sync',
    modules: ['MOD-CC-02'],
    classCell: 'Refreshed',
    freshnessClass: 'refreshed',
    markerObligation: 'Per-device last-seen time',
    perDevice: true,
    sourceRef: 'L35901',
  },
] as const satisfies readonly CcElementClassAssignment[]

export type CcAssignedElement = (typeof CC_ELEMENT_CLASS_ASSIGNMENTS)[number]['element']

/**
 * `AC-CC-110` (L35907) — the assignment is DISCOVERABLE, so the lookup is the
 * discovery. Throws on an unassigned element rather than defaulting to a
 * class: `AC-CC-111` (L35908) makes an unmarked element a failure, and a
 * default would render one silently with somebody else's obligation.
 */
export function ccElementAssignment(element: string): CcElementClassAssignment {
  const row = CC_ELEMENT_CLASS_ASSIGNMENTS.find((r) => r.element === element)
  if (row === undefined) {
    throw new Error(
      `No freshness class is assigned to "${element}". §21.3.1 L35825 requires every element on ` +
        'the surface to belong to exactly one of three classes, and L35907 (AC-CC-110) requires ' +
        "the assignment to be discoverable in the element's specification. Add the row to " +
        'CC_ELEMENT_CLASS_ASSIGNMENTS against its own line of L35884-L35901, or the element is ' +
        'not one §21.3.1 assigns.',
    )
  }
  return row
}

/* ==================================================================== *
 * 21.3.2 — THE MARKER, ITS TWO DISPLAY STATES AND ITS EXPANSION.
 *
 * L35931 — "Every tile and every drill view carries a compact sync-state
 * element": "Live · all devices synced", or "Synced 14:32 · 2 of 9 devices
 * offline · 14 captures pending." Selecting it "lists the devices behind the
 * number and when each was last seen."
 *
 * TWO DISPLAY STATES, NOT FOUR. Steps 4 and 5 of the workflow (L35940,
 * L35941) give the marker exactly two forms — every device live, or not —
 * and step 7 (L35943) forbids it disappearing in the healthy case: "Showing
 * it when everything is fine is what makes it trustworthy when something is
 * not." `MOD-CC-02`'s own card enumerates FOUR marker states at L36469, and
 * that is the module's enumeration of its own states rather than §21.3.2's
 * display forms; the two are not reconciled here and neither is edited.
 * `src/surfaces/cc/modules/cc-02/chrome.ts` carries the card's four with its
 * own reading of where the storyboard disagrees.
 *
 * THE DEVICE LIST IS FIVE COLUMNS AND THREE ROWS. Header L35965, separator
 * L35966, data L35967-L35969 — THREE rows, and the line after the last is blank, so
 * the body stops there. The blank is not cited; the suite asserts the stop. The columns are the expansion's contract, and step 6 (L35942)
 * states the same five in prose: identifier, assigned Location (Cell) where
 * one applies, last-seen time, last successful sync time, and pending-capture
 * count where known.
 * ==================================================================== */

export const CC_MARKER_DEVICE_COLUMNS = [
  'Device',
  'Location (Cell)',
  'Last seen',
  'Last successful sync',
  'Pending captures',
] as const satisfies readonly string[]

/**
 * NEVER A ZERO FOR AN UNKNOWN COUNT. L35945 — "Where the platform cannot
 * know, the marker must say so rather than showing zero, because a zero would
 * be read as 'nothing is waiting'." `AC-CC-122` (L35981) is the criterion.
 * The storyboard's own first device row proves it is not hypothetical: L35967
 * reads `Unknown while offline` where L35968 and L35969 read `0`.
 *
 * There is no third spelling — no `-1`, no `null`, no optional field a
 * renderer would print as blank. `MOD-CC-02` reaches the same union from its
 * own card (`FUNC-CC-0201-1-3`, L36530); this one is §21.3.2's and the
 * surface model does not depend on a module for its own vocabulary.
 */
export type CcPendingCaptures = number | 'unknown'

export const ccPendingCapturesText = (pending: CcPendingCaptures): string =>
  pending === 'unknown' ? 'pending captures unknown' : `${pending} captures pending`

export interface CcMarkerDevice {
  /** `Device` — the device identifier. */
  readonly deviceId: string
  /** `Location (Cell)`, or `null` where none applies. Step 6, L35942. */
  readonly cell: string | null
  /** `Last seen`. */
  readonly lastSeen: string
  /** `Last successful sync`. */
  readonly lastSync: string
  /** `Pending captures` — a count, or `unknown`. Never a zero standing in. */
  readonly pendingCaptures: CcPendingCaptures
}

/**
 * The marker's scope, from step 2 (L35938): "one Location (Cell), one Area,
 * or the whole board".
 */
export type CcMarkerScope = 'cell' | 'area' | 'board'

export interface CcMarkerState {
  readonly scope: CcMarkerScope
  /** Every device in scope, in the order the expansion lists them. */
  readonly devices: readonly CcMarkerDevice[]
  /** Most recent successful sync in scope. Step 5, L35941. */
  readonly lastSyncInScope: string
  /**
   * `false` where the fleet inventory read failed. The degraded form of
   * L35975 still knows the sync time — "the sync time is still known from the
   * sync log even when the inventory is not" — so it is a separate flag and
   * not an empty device list, which would render as a fabricated zero.
   */
  readonly inventoryAvailable: boolean
}

export type CcMarkerForm = 'live-all-synced' | 'partially-synced' | 'inventory-unavailable'

export function ccMarkerForm(state: CcMarkerState): CcMarkerForm {
  if (!state.inventoryAvailable) return 'inventory-unavailable'
  if (state.devices.length === 0) return 'partially-synced'
  return ccOfflineCount(state) === 0 ? 'live-all-synced' : 'partially-synced'
}

/**
 * OFFLINE IS NOT THE SAME AS UNKNOWN, AND READING IT THAT WAY IS THE EASY
 * MISTAKE. L35939's second computed value is "the count of devices in scope
 * not currently synced", and L35931's own example reads "Synced 14:32 · 2 of 9
 * devices offline · 14 captures pending" — two offline devices with a KNOWN
 * pending count of fourteen between them. So an offline device may report a
 * number, and a marker that counted only the unknowns would have rendered
 * "0 of 9 devices offline" for that exact line.
 *
 * The storyboard at L35967-L35969 does not distinguish the two, because its
 * one offline device is also its one unknown; L35931 is the line that does.
 */
export const ccDeviceIsSynced = (d: CcMarkerDevice): boolean => d.pendingCaptures === 0

export const ccOfflineCount = (state: CcMarkerState): number =>
  state.devices.filter((d) => !ccDeviceIsSynced(d)).length

/**
 * The marker's own line. `AC-CC-120` (L35979) requires it in EVERY state
 * including the healthy one, and `AC-CC-123` (L35982) requires the degraded
 * form to "never render a fabricated device count" — so the unavailable form
 * names no count at all and states its sync time, which L35975 gives verbatim
 * as the terminal safe state.
 */
export function ccMarkerText(state: CcMarkerState): string {
  switch (ccMarkerForm(state)) {
    case 'inventory-unavailable':
      return `Device sync state unavailable · last successful sync in this scope ${state.lastSyncInScope}`
    case 'live-all-synced':
      return 'Live · all devices synced'
    default: {
      const offline = ccOfflineCount(state)
      const known = state.devices.reduce<number>(
        (sum, d) => (d.pendingCaptures === 'unknown' ? sum : sum + d.pendingCaptures),
        0,
      )
      const anyUnknown = state.devices.some((d) => d.pendingCaptures === 'unknown')
      return (
        `Synced ${state.lastSyncInScope} · ${offline} of ${state.devices.length} devices offline · ` +
        ccPendingCapturesText(anyUnknown ? 'unknown' : known)
      )
    }
  }
}

/** L35971, rendered beneath the expansion, verbatim but for the time. */
export const ccInventoryNote = (lastInventoryRead: string): string =>
  `Device inventory is held on the platform side. Last inventory read ${lastInventoryRead}.`

/* ==================================================================== *
 * 21.3.3 — CONNECTIVITY LOSS, MADE VISIBLE.
 *
 * COUNTED, NOT INFERRED. Header L36042, separator L36043, data
 * L36044-L36046 — THREE rows, and the line after the last is blank, so the
 * body stops there. The blank is not cited; the suite asserts the stop.
 * Columns: Threshold, Default, Configurable, Audience, Rendered on this
 * surface.
 *
 * READ THE CLAUSE, NEVER THE TOKEN. The `Rendered on this surface` column
 * reads `No — platform-side signal`, `Yes — on this board`, and `Banner states
 * the elapsed duration` — three different answers where a two-token read sees
 * one no and two yesses. The third is not a second banner: it is the SAME
 * banner gaining a sentence, which is why `rendersOwnBanner` is true on
 * exactly one row and the 120-minute row's rendering is its own field.
 *
 * ONE THRESHOLD IS TENANT-FACING. L36007 — the 30-minute alert "is not
 * displayed to the tenant, because it is a platform-side signal". L36009 —
 * the 120-minute escalation "fires on the platform side". Only L36008's
 * banner is drawn here.
 *
 * THE BANNER'S AUDIENCE IS A DECLARED STRENGTHENING, NOT A TRANSCRIPTION.
 * L36013 — the source specifies the banner as visible to the Tenant Admin;
 * whether Supervisors and Quality Managers also see it is "Not specified in
 * the Statement of Work", and the blueprint renders it to every Command
 * Center user in scope with the Tenant Admin named as accountable, marking it
 * so the client can constrain it. The `Audience` cell carries both halves and
 * is not split into a rule.
 * ==================================================================== */

export interface CcConnectivityThreshold {
  /** Verbatim `Threshold` cell. */
  readonly threshold: string
  /** Verbatim `Default` cell. */
  readonly defaultLabel: string
  /** The same default in minutes, for the clock. */
  readonly defaultMinutes: number
  /** Verbatim `Configurable` cell. Every row says yes, in the same words. */
  readonly configurable: string
  /** Verbatim `Audience` cell. */
  readonly audience: string
  /** Verbatim `Rendered on this surface` cell. */
  readonly renderedHere: string
  /** Whether THIS row puts its own banner on the board. Exactly one does. */
  readonly rendersOwnBanner: boolean
  readonly sourceRef: string
}

export const CC_CONNECTIVITY_THRESHOLDS = [
  {
    threshold: 'Platform-operations alert',
    defaultLabel: '30 minutes',
    defaultMinutes: 30,
    configurable: 'Yes, a configurable default',
    audience: "The client's Super Admin team",
    renderedHere: 'No — platform-side signal',
    rendersOwnBanner: false,
    sourceRef: 'L36044',
  },
  {
    threshold: 'Tenant warning banner',
    defaultLabel: '60 minutes',
    defaultMinutes: 60,
    configurable: 'Yes, a configurable default',
    audience:
      'Tenant Admin named; all in-scope Command Center users under the strengthened rule',
    renderedHere: 'Yes — on this board',
    rendersOwnBanner: true,
    sourceRef: 'L36045',
  },
  {
    threshold: 'On-call escalation',
    defaultLabel: '120 minutes',
    defaultMinutes: 120,
    configurable: 'Yes, a configurable default',
    audience: "The platform's on-call rota",
    renderedHere: 'Banner states the elapsed duration',
    rendersOwnBanner: false,
    sourceRef: 'L36046',
  },
] as const satisfies readonly CcConnectivityThreshold[]

/**
 * `AC-CC-133` (L36055) — "At no point during a connectivity loss does any
 * board element blank, disappear, or render a value without its age." L36000
 * states the same as the surface's own rule: "The board never goes blank
 * because the floor went dark: it shows the last truth, and its timestamp."
 *
 * Exported as a constant a gate can hold rather than as prose, because a
 * blanking element is the one failure this whole section exists to forbid and
 * it is invisible to a test that only reads what IS rendered.
 */
export const CC_BOARD_NEVER_BLANKS = true

/**
 * Which thresholds have fired at a given elapsed time, in order. The clock is
 * the only thing that decides; nothing here is a role check.
 */
export const ccFiredThresholds = (
  elapsedMinutes: number,
): readonly CcConnectivityThreshold[] =>
  CC_CONNECTIVITY_THRESHOLDS.filter((t) => elapsedMinutes >= t.defaultMinutes)

/* ==================================================================== *
 * 21.3.4 — AS-OF TIMES, LATE DATA AND THE MATERIALITY DEFAULT.
 *
 * L36074 is the whole rule in one sentence-run: every aggregate carries an
 * as-of timestamp; record-level views flag late-arriving captures explicitly;
 * "No number a supervisor may have acted on is ever silently rewritten";
 * where late data materially changes the headline figures of a closed shift or
 * a finished record the recompute is itself an audited event; and "The
 * platform default for materiality is any change to a severity count".
 *
 * ANY CHANGE TO ANY SEVERITY COUNT, AND THE BAR IS DELIBERATELY LOW. L36076
 * unpacks it: "if a recompute changes the number of Severity 1 events, or
 * Severity 2 events, or any other severity level's count ... A change from
 * three Severity 2 events to four is not a rounding difference; it is a
 * different shift." So the predicate is per-level and not on a total — two
 * levels moving by one each in opposite directions leaves the total unchanged
 * and IS material.
 *
 * A HALF-RECOMPUTED NUMBER IS WORSE THAN AN ADMITTEDLY OLD ONE. L36115,
 * `FB-CC-STALE`: the aggregate keeps its previous value AND its previous
 * stamp. `AC-CC-144` (L36123) is the criterion. That is why the stamp is on
 * the same record as the value and not passed alongside it.
 * ==================================================================== */

export interface CcAsOfValue<T> {
  readonly value: T
  /** `AC-CC-140` (L36119). Never optional; an aggregate without one is not renderable. */
  readonly asOf: string
}

/** Severity level → count. The keys are the levels the source counts by. */
export type CcSeverityCounts = Readonly<Record<string, number>>

/**
 * `AC-CC-143` (L36122) — a recompute changing ANY severity count for a closed
 * shift or finished record is material. Per level, and in both directions: a
 * level present before and absent after has changed too, which is why the key
 * sets are unioned rather than iterated over `before` alone.
 */
export function ccIsMaterialRecompute(
  before: CcSeverityCounts,
  after: CcSeverityCounts,
): boolean {
  const levels = new Set([...Object.keys(before), ...Object.keys(after)])
  for (const level of levels) {
    if ((before[level] ?? 0) !== (after[level] ?? 0)) return true
  }
  return false
}

/**
 * `AC-CC-141` (L36120) — no aggregate value is replaced without a new as-of
 * timestamp — and `AC-CC-144` (L36123) — a partially completed recompute is
 * never rendered; the previous value and stamp persist instead.
 *
 * Both are one function because both are one decision: what may replace what
 * is on screen. A recompute that did not complete returns the previous record
 * UNCHANGED, stamp included, which is L36115's rule word for word.
 */
export function ccApplyRecompute<T>(
  previous: CcAsOfValue<T>,
  next: CcAsOfValue<T> | null,
): CcAsOfValue<T> {
  if (next === null) return previous
  if (next.asOf === previous.asOf) {
    throw new Error(
      'A recomputed aggregate carries the previous as-of stamp. AC-CC-141 (L36120) forbids ' +
        'replacing a value without a new stamp, and L36083 states why: the old value is not ' +
        'silently replaced in place with no trace.',
    )
  }
  return next
}

/** L36082, L36162 — the source's own flag, spelled as the source spells it. */
export const CC_LATE_ARRIVAL_FLAG = 'late_arrival'

/* ==================================================================== *
 * 21.3.5 — THE RUN LIFECYCLE.
 *
 * THREE STATES, NOT FOUR, AND THE SECTION HEADING NAMES FOUR THINGS. L36136
 * heads the subsection "Run completion — submitted, complete, finished, and
 * manual close", and the dispatch brief read that as four states. The body
 * does not: L36142 — "'The run is done' therefore has three distinct
 * meanings, kept separate as the platform's run lifecycle". L36182 is
 * explicit about the fourth — "Manual close is drawn as an entry into
 * submitted rather than a state of its own, because that is exactly what the
 * source says it produces: the run stands submitted with the gap recorded."
 *
 * So manual close is an ACT with an entry edge, not a state, and it is
 * modelled as one below.
 *
 * THE DIAGRAM CARRIES A FOURTH NODE THE PROSE DOES NOT COUNT. L36169-L36171
 * open the state machine at `InProgress`, "Run executing, assignments open".
 * It is a position a run occupies and it is not one of the three meanings of
 * "done", so it is carried as a lifecycle POSITION with `isCompletionState`
 * false rather than added to the three or dropped.
 *
 * MANUAL CLOSE IS NOT THIS FILE'S TO DEFINE, AND THE BOUNDARY IS NAMED HERE
 * SO IT IS NOT DEFINED TWICE. L36152 — it is "a run-lifecycle act executed on
 * the Delivery Operations Hub run record, linked from the Command Center
 * drill; it is deliberately not one of the ten operational actions", and
 * `AC-CC-153` (L36203) makes the exclusion testable. The closed action set of
 * ten belongs to slice 9's task 4 and `DEC-STUCK-001` — which asks what state
 * a manually closed run stands in — is already disclosed by `MOD-FL-B11` and
 * `MOD-DOH-06`. What this file owes is the entry EDGE and the statement that
 * it terminates here, which is `CC_MANUAL_CLOSE_BOUNDARY`.
 * ==================================================================== */

export type CcRunState = 'submitted' | 'complete' | 'finished'

export const CC_RUN_STATES = [
  'submitted',
  'complete',
  'finished',
] as const satisfies readonly CcRunState[]

type _AssertRunStatesExhaustive = [CcRunState] extends [(typeof CC_RUN_STATES)[number]]
  ? [(typeof CC_RUN_STATES)[number]] extends [CcRunState]
    ? true
    : never
  : never
const _runStatesExhaustive: _AssertRunStatesExhaustive = true
void _runStatesExhaustive

/** Every position a run occupies on this surface, including the pre-state. */
export type CcRunPosition = 'in-progress' | CcRunState

export interface CcRunLifecyclePosition {
  readonly id: CcRunPosition
  /** What the position means, from its own paragraph. */
  readonly meaning: string
  /** Whether it is one of L36142's three meanings of "the run is done". */
  readonly isCompletionState: boolean
  readonly sourceRef: string
}

export const CC_RUN_LIFECYCLE = [
  {
    id: 'in-progress',
    meaning: 'Run executing, assignments open',
    isCompletionState: false,
    sourceRef: 'L36170',
  },
  {
    id: 'submitted',
    meaning:
      'every assignment on the run is finished as known to the server: the floor has turned the ' +
      'work in. This is the state the board displays and supervisors act on. While devices still ' +
      'owe data, the run shows as submitted with sync pending, and the freshness marker carries ' +
      'the detail',
    isCompletionState: true,
    sourceRef: 'L36144',
  },
  {
    id: 'complete',
    meaning:
      "every assigned device has synced; no capture remains pending on any device. The run's data " +
      'set is whole as of that moment, and remains open only to late-arriving corrections within ' +
      'the window',
    isCompletionState: true,
    sourceRef: 'L36146',
  },
  {
    id: 'finished',
    meaning:
      'the record-finish window has closed. It is tenant-configurable with a platform default of ' +
      "48 hours. The platform's run auto-close scheduler finishes the run automatically; its " +
      'figures are final. Anything arriving after finish follows the audited-recompute ' +
      'discipline, never a silent rewrite',
    isCompletionState: true,
    sourceRef: 'L36148',
  },
] as const satisfies readonly CcRunLifecyclePosition[]

export interface CcRunTransition {
  readonly from: CcRunPosition
  readonly to: CcRunPosition
  /** What causes it. Verbatim from the diagram edge or the paragraph. */
  readonly cause: string
  /**
   * `true` for the ONE automatic transition on the platform. L36148 — "The
   * finish is the one automatic transition on the platform", and `AC-CC-152`
   * (L36202) makes it the only one. A second `true` here is a defect.
   */
  readonly automatic: boolean
  readonly sourceRef: string
}

export const CC_RUN_TRANSITIONS = [
  {
    from: 'in-progress',
    to: 'submitted',
    cause: 'every assignment finished as known to the server',
    automatic: false,
    sourceRef: 'L36171',
  },
  {
    from: 'in-progress',
    to: 'submitted',
    cause: 'manual close by a Supervisor with a mandatory note',
    automatic: false,
    sourceRef: 'L36178',
  },
  {
    from: 'submitted',
    to: 'complete',
    cause: 'every assigned device synced, no capture pending',
    automatic: false,
    sourceRef: 'L36173',
  },
  {
    from: 'complete',
    to: 'finished',
    cause: 'record finish window closes, default forty eight hours',
    automatic: true,
    sourceRef: 'L36175',
  },
  {
    from: 'submitted',
    to: 'finished',
    cause: 'window closes even if a device never returns',
    automatic: true,
    sourceRef: 'L36176',
  },
] as const satisfies readonly CcRunTransition[]

/** L36148, L36150 — not in dispute, quoted exactly. */
export const CC_RECORD_FINISH_DEFAULT_HOURS = 48

/* ==================================================================== *
 * WHAT EACH STATE PERMITS — AND `Allowed` IS NOT A PERMISSION IN EVERY COLUMN.
 *
 * COUNTED, NOT INFERRED. Header L36190, separator L36191, data
 * L36192-L36194 — THREE rows, and the line after the last is blank, so the
 * body stops there. The blank is not cited; the suite asserts the stop.
 * Six columns: State, Board shows it, Supervisors act on it, Late captures
 * fold in, Figures final, Who or what causes the transition.
 *
 * THE `Figures final` COLUMN USES `Allowed` AS AN ASSERTION, NOT A GRANT.
 * L36194 reads `Allowed — figures are final` for Finished, and L36192 and
 * L36193 read `Not applicable — not final`. Nobody is being permitted
 * anything: the column states WHETHER the figures are final. A gate keyed on
 * the token alone would read Finished as the most permissive row in the
 * table, when its other three cells are the two `Read-only`s and the one
 * `Explicitly prohibited`. Slice 8 found `Allowed` used as a prohibition
 * nineteen times out of fifty-three; this is the same shape in a fourth
 * flavour — a status token in a column that is not about status.
 *
 * SO EVERY CELL IS KEPT AS ITS FULL CLAUSE and nothing here is reduced to a
 * token. `figuresFinal` is a boolean derived from reading the clause, and the
 * clause stays beside it.
 * ==================================================================== */

export interface CcRunStatePermission {
  readonly state: CcRunState
  /** Verbatim `Board shows it` cell. */
  readonly boardShowsIt: string
  /** Verbatim `Supervisors act on it` cell. */
  readonly supervisorsActOnIt: string
  /** Verbatim `Late captures fold in` cell. */
  readonly lateCapturesFoldIn: string
  /** Verbatim `Figures final` cell — an ASSERTION column. See the header. */
  readonly figuresFinalCell: string
  /** What that cell asserts, read as a clause and not off its token. */
  readonly figuresFinal: boolean
  /** Verbatim `Who or what causes the transition` cell. */
  readonly transitionCause: string
  readonly sourceRef: string
}

export const CC_RUN_STATE_PERMISSIONS = [
  {
    state: 'submitted',
    boardShowsIt: 'Allowed — this is the acted-on state',
    supervisorsActOnIt: 'Allowed',
    lateCapturesFoldIn: 'Allowed within the window',
    figuresFinalCell: 'Not applicable — not final',
    figuresFinal: false,
    transitionCause:
      "Every assignment finished as known to the server, or a Supervisor's manual close",
    sourceRef: 'L36192',
  },
  {
    state: 'complete',
    boardShowsIt: 'Allowed',
    supervisorsActOnIt: 'Allowed',
    lateCapturesFoldIn: 'Allowed within the window',
    figuresFinalCell: 'Not applicable — not final',
    figuresFinal: false,
    transitionCause: 'Every assigned device synced with no pending capture',
    sourceRef: 'L36193',
  },
  {
    state: 'finished',
    boardShowsIt: 'Read-only — reached through Delivery Operations Hub run history',
    supervisorsActOnIt: 'Read-only',
    lateCapturesFoldIn: 'Explicitly prohibited — audited recompute applies instead',
    figuresFinalCell: 'Allowed — figures are final',
    figuresFinal: true,
    transitionCause: "The platform's run auto-close scheduler, automatically",
    sourceRef: 'L36194',
  },
] as const satisfies readonly CcRunStatePermission[]

/* ==================================================================== *
 * THE MANUAL-CLOSE BOUNDARY, DECLARED AND NOT CROSSED.
 * ==================================================================== */

export interface CcOwnedElsewhere {
  readonly what: string
  /** Which task or module owns it, and why not this one. */
  readonly ownedBy: string
  /** What THIS file does define about it, which is only the edge. */
  readonly definedHere: string
  readonly sourceRef: string
}

export const CC_MANUAL_CLOSE_BOUNDARY = {
  what: 'Manual close of a stuck run',
  ownedBy:
    'The closed action set of ten (slice 9 task 4) and the Delivery Operations Hub run record. ' +
    'DEC-STUCK-001 — which state a manually closed run stands in — is already disclosed by ' +
    'src/frontline/modules/fl-b11/service.ts and src/surfaces/doh/modules/doh-06/matrix.ts, and ' +
    'src/surfaces/cc/modules/cc-02/chrome.ts declines to route a manual close into any state for ' +
    'the same reason.',
  definedHere:
    'One entry edge, in-progress to submitted, cause "manual close by a Supervisor with a ' +
    'mandatory note" (L36178). No affordance, no authority check, no note validation and no ' +
    'assertion about which state the run then stands in — L36182 says it produces submitted with ' +
    'the gap recorded, and stating that as this model’s own rule would settle DEC-STUCK-001 by ' +
    'transcription.',
  sourceRef: 'L36152 · AC-CC-153 L36203',
} as const satisfies CcOwnedElsewhere

/* ==================================================================== *
 * `DEC-REFRESH-001` — RAISED IN THIS SECTION, DISCLOSED HERE, SETTLED NOWHERE.
 *
 * L35839 CARRIES THE WHOLE DECISION ON ONE LINE — 2,324 characters of it: the
 * contradiction, both readings, three options, the recommendation, the
 * trade-offs and the decision owner. It was read whole. A `sed | cut` read of
 * a line like it has already produced one false "not supported by the source"
 * finding on this build.
 *
 * WHAT IT IS. The configurability principle says a tenant may make the
 * platform stricter than default and never looser than the platform floor, and
 * that the platform rejects a looser-than-floor value rather than logging it.
 * A 30-second refresh is STRICTER than the 60-second default, yet 30 seconds
 * is a floor the tenant may not cross — "a limit on how strict a tenant may
 * be, which the configurability principle does not contemplate".
 *
 * WHY IT IS DISCLOSED HERE WHEN SOMETHING ALREADY NAMES IT.
 * `app/super-admin/tenant-configuration-registry/fixtures.ts` carries the
 * identifier with this same L35839 locator, and `MOD-CC-02` correctly declined
 * to respell it — row 6 of its matrix prohibits configuring the interval in
 * every column, so it draws no control the decision governs. Neither is true
 * here: this file OWNS the two numbers, and `ccRefreshOutcome` above is the
 * function the decision governs.
 *
 * And what that registry carries is a `conflict` string and a `resolution`
 * string, where the resolution reads "Rejected at entry". That is the SA
 * module's own behaviour and it is honest about being that — but it means the
 * two readings L35839 states do not survive anywhere in this tree today, and
 * the only record a slice-9 module task would find says the question is
 * answered. `readings` below is `DecisionReading` IMPORTED from the canon, so
 * it has exactly two fields and there is nowhere to mark a winner even by
 * accident.
 *
 * AND THE MISSING VALIDATION IS PART OF THE SAME DECISION, NOT A DETAIL.
 * L35839 states that faster-than-default intervals "are validated against the
 * deployment's scale before they apply" without saying who validates, by what
 * criteria, or what happens when validation fails. `ccRefreshOutcome` returns
 * `requires-scale-validation` and performs none, because there is nothing
 * stated to perform.
 * ==================================================================== */

export interface CcLiveLocalDisclosure {
  readonly decisionRef: 'DEC-REFRESH-001'
  readonly question: string
  readonly readings: readonly DecisionReading[]
  /** What this build DOES. Never presented as the source's ruling. */
  readonly adopted: string
  /** What the source leaves unstated, carried rather than filled in. */
  readonly unstated: readonly string[]
  /** The three options, verbatim in substance, in the source's own order. */
  readonly options: readonly string[]
  /** Why it is disclosed here rather than through the shared canon. */
  readonly canonNote: string
}

export const CC_LIVE_DISCLOSURES = [
  {
    decisionRef: 'DEC-REFRESH-001',
    question:
      'Is the 30-second board-refresh floor a protective platform limit on the interval value, or ' +
      'an unnamed exception to a configurability principle stated as universal? And who validates ' +
      'a faster-than-default interval, by what criteria, and what happens when validation fails?',
    readings: [
      {
        text:
          '30 seconds is a protective platform limit on load, correctly described as a floor on ' +
          'the INTERVAL VALUE rather than on strictness, and the configurability principle simply ' +
          'does not apply to performance parameters.',
        locator: 'DEC-REFRESH-001 · L35839 · the floor as stated L35837',
      },
      {
        text:
          'The configurability principle is stated as universal — "everything configurable on ' +
          'this platform obeys one sentence" — so a strictness ceiling is an exception that must ' +
          'be named as one.',
        locator: 'DEC-REFRESH-001 · L35839',
      },
    ],
    adopted:
      'Neither. The two numbers are carried as the source states them and ccRefreshOutcome ' +
      'returns three outcomes with no clamp among them, because a clamp is the one behaviour ' +
      'AC-CC-113 (L35910) forbids under either reading. Whether a below-floor request is refused ' +
      'as a safety floor or as a performance limit changes the MESSAGE and not the outcome, so ' +
      'no message text is written here. Decision owner, from L35839: the client’s product owner ' +
      'with the platform operations lead.',
    unstated: [
      'Who performs the scale validation.',
      'By what criteria the scale validation passes or fails.',
      'What happens when the scale validation fails.',
      'Whether the floor is the platform’s or the tenant’s: §21.3 calls it a platform floor ' +
        '(L35830, L35837) and the numbers canon’s own register row calls it a per-tenant floor ' +
        '(L12899). Counted across the frozen source, 3 occurrences of the first wording and ' +
        '13 of the second. Under reading A the distinction is immaterial; under reading B ' +
        'it is the exception’s scope.',
    ],
    options: [
      '(a) hard reject below 30 seconds with an explanatory message, consistent with the ' +
        "platform's reject-rather-than-log posture",
      '(b) accept and clamp to 30 seconds with a visible notice',
      '(c) allow below 30 seconds subject to a scale validation with named criteria and a named ' +
        'validating authority',
    ],
    canonNote:
      // The membership count this sentence used to spell — "its DecisionId
      // union has twenty-nine members" — was a stored copy of a derived answer
      // and became a false on-screen claim the moment slice 10 registered
      // fourteen more. What the disclosure needs to say is that the identifier
      // is not in the union, which is what the suite measures; the size of the
      // union is not this screen's business and no reader can act on it.
      'The shared decision canon at @/disclosure/decisions carries no record keyed to this ' +
      'identifier — it is not a member of that file’s DecisionId union — ' +
      'and that file is another task’s path. Disclosed here in the canon’s own record shape, with ' +
      'DecisionReading imported rather than redeclared so no field exists in which a reading ' +
      'could be marked the answer. This model’s unit suite asserts the absence, so the disclosure ' +
      'moves to the canon the moment the canon holds it.',
  },
] as const satisfies readonly CcLiveLocalDisclosure[]

/* ==================================================================== *
 * `DEC-FINISH-001` — RAISED IN THIS SECTION TOO, AND ALREADY HELD ELSEWHERE.
 *
 * L36150 raises it against the record-finish window's bounds: the platform
 * data model marks floor and ceiling as an open drafting value with a
 * suggested range of 24 hours to 7 days, while the Delivery Operations Hub and
 * the Super Admin platform console state them as settled at floor 24 hours and
 * ceiling 7 days. The dispatch brief does not name it; it is in scope because
 * it is raised inside 21.3.5, which this task owns.
 *
 * It is NOT respelled here. `REGISTRY_SOURCE_CONFLICTS` in
 * `app/super-admin/tenant-configuration-registry/fixtures.ts` already carries
 * it with both readings preserved and the bound rendered with the decision
 * reference attached. This model touches only the 48-hour DEFAULT, which
 * L36150 says is not in dispute and quotes exactly — so there is no bound here
 * for a second record to govern.
 * ==================================================================== */

export interface CcDecisionHeldElsewhere {
  readonly decisionRef: string
  readonly heldBy: readonly string[]
  readonly heldByLocator: string
  readonly whyNotHere: string
}

export const CC_LIVE_DECISIONS_HELD_ELSEWHERE = [
  {
    decisionRef: 'DEC-FINISH-001',
    heldBy: ['app/super-admin/tenant-configuration-registry/fixtures.ts'],
    heldByLocator: 'L36150',
    whyNotHere:
      'That registry carries both readings for the window’s floor and ceiling and renders the ' +
      'bound with the decision reference attached. This model carries only the 48-hour default, ' +
      'which L36150 states is not in dispute and quotes exactly, and no floor or ceiling value at ' +
      'all — so a record here would govern nothing this file holds.',
  },
] as const satisfies readonly CcDecisionHeldElsewhere[]
