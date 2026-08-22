/**
 * THE PER-SURFACE STATE CONTRACT — SIXTEEN ATTRIBUTES ACROSS THE FIVE
 * SURFACES. Frozen source chapter 34, the offline and synchronisation
 * chapter.
 *
 * ── THE TABLE, COUNTED ─────────────────────────────────────────────────────
 * The table is introduced at L78196 — "the sixteen attributes, condensed by
 * surface". The
 * header is L78198, the separator L78199, and the sixteen data rows are
 * L78200-L78215 with no gap. Six columns: `Attribute`, then the five surfaces
 * in the order Delivery Operations Hub, Standards and Operations Studio,
 * Client Command Center, Frontline Worker Application, Super Admin platform
 * console.
 *
 *     16 rows x 6 columns  =  96 cells
 *     16 rows x 5 surfaces =  80 surface cells, every one non-blank
 *
 * ── HEADER-KEYED, NEVER POSITIONAL ─────────────────────────────────────────
 * `STATE_CONTRACT_COLUMNS` is the whole reason this file can be checked. It
 * maps each column heading, verbatim as the source spells it, onto the
 * `SurfaceId` this build already uses, so a test can re-read L78198 and prove
 * the mapping rather than trust the order the rows happen to be typed in.
 * Chapter 34's OTHER five-surface tables order their columns differently, and
 * a positional transcription inverts cells silently because both readings are
 * internally coherent.
 *
 * The heading in this table is `Super Admin platform console`. The event
 * matrix in the same chapter (`@/offline/event-matrix`) heads the same column
 * `Super Admin`. Same surface, two headings, and both are transcribed as the
 * source writes them — which is why the mapping is a record keyed on the
 * heading rather than a shared constant.
 *
 * ── CELLS ARE VERBATIM PROSE, NOT A TYPED OUTCOME ──────────────────────────
 * Unlike the event matrix, most cells here are descriptive rather than a
 * permission token: `Filed records and queued commands` is not a member of
 * any closed set. Some rows do carry a backticked token — `Last update shown`
 * is `Allowed` on all five, `Actions blocked` and `Artificial-intelligence
 * state` carry `Not applicable` and `Explicitly prohibited` and `Unavailable`
 * — but the row as a whole is not an outcome row, so the cells are carried as
 * the source's own strings and nothing is re-typed into a union it does not
 * belong to. `cells` is a total `Record` over `SurfaceId`, so a blank cell is
 * untypeable, which is the rule L78196 states for this table.
 *
 * ── THE TRAP, AND IT IS WHY THIS FILE EXISTS ───────────────────────────────
 * `HUB_REACHABILITY_TENSION` below. Two rows of THIS ONE TABLE make two
 * different claims about the Delivery Operations Hub, and the safety
 * invariant rests on the second. Both cells, both locators, and the criterion
 * are carried and neither is chosen. See that record.
 */
import type { SurfaceId } from '@/domain/surfaces'

/**
 * The five column headings of L78198, verbatim, keyed onto this build's
 * surface identifiers. The transcription below is keyed through this, never
 * through column position.
 */
export const STATE_CONTRACT_COLUMNS: Readonly<Record<SurfaceId, string>> = {
  'SURF-DOH': 'Delivery Operations Hub',
  'SURF-STU': 'Standards and Operations Studio',
  'SURF-CC': 'Client Command Center',
  'SURF-FL': 'Frontline Worker Application',
  'SURF-SA': 'Super Admin platform console',
}

/** The sixteen `Attribute` cells of L78200-L78215, verbatim and in source order. */
export type StateContractAttribute =
  | 'Knows'
  | 'Does not know'
  | 'Displays'
  | 'Data source'
  | 'Freshness'
  | 'Last update shown'
  | 'Status classification'
  | 'Actions allowed'
  | 'Actions blocked'
  | 'Actions queued'
  | 'Notifications'
  | 'Artificial-intelligence state'
  | 'Fallback'
  | 'Recovery'
  | 'Reconciliation'
  | 'Must never claim prematurely'

export interface StateContractRow {
  readonly attribute: StateContractAttribute
  /** Total over the five surfaces. A blank cell cannot be expressed. */
  readonly cells: Readonly<Record<SurfaceId, string>>
  readonly sourceRef: string
}

/** L78200-L78215. Sixteen rows, counted, in source order. */
export const OFF_STATE_CONTRACT = [
  {
    attribute: 'Knows',
    cells: {
      'SURF-DOH': 'Filed records and queued commands',
      'SURF-STU': 'Content, versions, approvals',
      'SURF-CC': 'Server knowledge with age',
      'SURF-FL': 'Own device state in full',
      'SURF-SA': 'Fleet metadata and policy',
    },
    sourceRef: 'L78200',
  },
  {
    attribute: 'Does not know',
    cells: {
      'SURF-DOH': 'Unsynced device captures or command application',
      'SURF-STU': 'Device package inventory or adoption',
      'SURF-CC': 'Current device state between syncs',
      'SURF-FL': 'Any server decision since last sync',
      'SURF-SA': 'Operational content outside a named access class',
    },
    sourceRef: 'L78201',
  },
  {
    attribute: 'Displays',
    cells: {
      'SURF-DOH': 'Record, lifecycle state, command inventory, audit',
      'SURF-STU': 'Authoring and publication state',
      'SURF-CC': 'Board with per-element freshness',
      'SURF-FL': 'Run Player, My Runs, sync indicator, inbox',
      'SURF-SA': 'Named telemetry and policy',
    },
    sourceRef: 'L78202',
  },
  {
    attribute: 'Data source',
    cells: {
      'SURF-DOH': 'Own filed record plus telemetry',
      'SURF-STU': 'Own content store',
      'SURF-CC': 'Event stream plus periodic refresh',
      'SURF-FL': 'On-device encrypted store',
      'SURF-SA': 'Platform telemetry',
    },
    sourceRef: 'L78203',
  },
  {
    attribute: 'Freshness',
    cells: {
      'SURF-DOH': 'Server-receipt time',
      'SURF-STU': 'Immediate for own records',
      'SURF-CC': 'Explicit per element',
      'SURF-FL': 'Last sync time for server-derived state',
      'SURF-SA': 'Last heartbeat',
    },
    sourceRef: 'L78204',
  },
  {
    attribute: 'Last update shown',
    cells: {
      'SURF-DOH': '`Allowed` — receipt timestamp displayed',
      'SURF-STU': '`Allowed` — publication timestamp displayed',
      'SURF-CC': '`Allowed` — marker on every element',
      'SURF-FL': '`Allowed` — last-synced time persistent',
      'SURF-SA': '`Allowed` — last-seen column',
    },
    sourceRef: 'L78205',
  },
  {
    attribute: 'Status classification',
    cells: {
      'SURF-DOH': 'Official for filed, pending for queued',
      'SURF-STU': 'Official for published',
      'SURF-CC': 'Live, cached, stale, pending, provisional',
      'SURF-FL': 'Official for own captures, cached for server state',
      'SURF-SA': 'Official for policy, stale for aged metrics',
    },
    sourceRef: 'L78206',
  },
  {
    attribute: 'Actions allowed',
    cells: {
      'SURF-DOH': 'Full Hub set within role and scope',
      'SURF-STU': 'Author, review, approve, publish',
      'SURF-CC': 'The closed set of ten',
      'SURF-FL': 'The offline capability set of Section 34.7',
      'SURF-SA': 'Policy and critical-class within maker-checker',
    },
    sourceRef: 'L78207',
  },
  {
    attribute: 'Actions blocked',
    cells: {
      'SURF-DOH': '`Not applicable — the Hub is server-side and unaffected by device reachability`',
      'SURF-STU': 'Rebasing an in-flight run — `Explicitly prohibited`',
      'SURF-CC': 'Gate override, run pause or stop, record edit, Job or run creation — `Explicitly prohibited`',
      'SURF-FL': 'Sign-off without a forced sync — `Explicitly prohibited`',
      'SURF-SA': 'Ambient browsing of tenant content — `Explicitly prohibited`',
    },
    sourceRef: 'L78208',
  },
  {
    attribute: 'Actions queued',
    cells: {
      'SURF-DOH': 'Five command classes to unreachable devices — `Queued while offline`',
      'SURF-STU': 'Version-change command emitted, delivery not displayed — `Queued while offline`',
      'SURF-CC': 'Lot release, reassignment, clearance — `Queued while offline`',
      'SURF-FL': 'Captures, evidence, containment records, flags — `Queued while offline`',
      'SURF-SA': 'Wipe and de-authorisation — `Queued while offline`',
    },
    sourceRef: 'L78209',
  },
  {
    attribute: 'Notifications',
    cells: {
      'SURF-DOH': 'In-app and email only',
      'SURF-STU': 'Version-change notices at next execution boundary',
      'SURF-CC': 'Alert and escalation feed',
      'SURF-FL': 'In-app inbox, no operating-system push',
      'SURF-SA': 'Platform notifications and tenant communications',
    },
    sourceRef: 'L78210',
  },
  {
    attribute: 'Artificial-intelligence state',
    cells: {
      'SURF-DOH': '`Not applicable — the Hub hosts no reasoning layer`',
      'SURF-STU': 'Drafts two difficulty levels, all reviewed before publication',
      'SURF-CC': 'Agent activity panel, advisory and gated',
      'SURF-FL': '`Unavailable` offline — authored Work Instructions are the fallback',
      'SURF-SA': 'Emergency pause renders as agent unavailability, never silence',
    },
    sourceRef: 'L78211',
  },
  {
    attribute: 'Fallback',
    cells: {
      'SURF-DOH': 'Display record as at last receipt with sync-pending detail',
      'SURF-STU': 'Hold submission in approval state, never partial publish',
      'SURF-CC': 'Degrade to last-synced picture with age',
      'SURF-FL': 'Park the run; continue other assigned runs',
      'SURF-SA': 'Hold the critical-class action pending',
    },
    sourceRef: 'L78212',
  },
  {
    attribute: 'Recovery',
    cells: {
      'SURF-DOH': 'Device reconnection',
      'SURF-STU': 'Service restoration',
      'SURF-CC': 'Device reconnection and recompute',
      'SURF-FL': 'Automatic on reconnection, never a worker action',
      'SURF-SA': 'Device contact',
    },
    sourceRef: 'L78213',
  },
  {
    attribute: 'Reconciliation',
    cells: {
      'SURF-DOH': 'Fold captures, flag `late_arrival`, audit material recompute',
      'SURF-STU': 'Version history reconciles adoption per run pinning',
      'SURF-CC': 'Recompute aggregates with a new as-of stamp',
      'SURF-FL': 'Acknowledge applied commands and clear queue entries',
      'SURF-SA': 'Reconcile telemetry and command state',
    },
    sourceRef: 'L78214',
  },
  {
    attribute: 'Must never claim prematurely',
    cells: {
      'SURF-DOH': 'That a run is `complete` while data is owed',
      'SURF-STU': 'That published content is in force on a device',
      'SURF-CC': 'That a hold is in force on an unacknowledged device',
      'SURF-FL': 'That a capture is server-accepted or a hold released',
      'SURF-SA': 'That a device is wiped, de-authorised or suspended',
    },
    sourceRef: 'L78215',
  },
] as const satisfies readonly StateContractRow[]

type MissingFromStateContract = Exclude<
  StateContractAttribute,
  (typeof OFF_STATE_CONTRACT)[number]['attribute']
>
const _stateContractExhaustive: MissingFromStateContract extends never ? true : never = true
void _stateContractExhaustive

/**
 * THE ONE TABLE, TWO CLAIMS ABOUT THE SAME SURFACE, AND NEITHER IS CHOSEN.
 *
 * The `Actions blocked` row, L78208 — "the Hub is server-side and unaffected
 * by device reachability". Seven rows later the `Must never claim
 * prematurely` row, L78215 — "That a run is `complete` while data is owed".
 * A surface unaffected by device
 * reachability and a surface that must not call a run complete until every
 * device has synced are two different claims, and it is the second the
 * platform's safety invariant rests on.
 *
 * The source itself settles which one is load-bearing, and it does it twice
 * in its own acceptance block rather than in prose:
 *
 *   `AC-OFF-205` (L78227) — "A run does not display as `complete` until every
 *   assigned device has synced."
 *   `TEST-OFF-204` (L78234) — "Mark a run `submitted` with one device owing
 *   data and assert the Hub does not display `complete`."
 *
 * A test that asserts the Hub's display changes with device reachability is
 * not compatible with the Hub being unaffected by it. So the `Actions
 * blocked` cell is true of exactly what its own row is about — no Hub ACTION
 * is blocked by a dark device — and false as a general statement about the
 * Hub, which is how it reads when lifted out of its row.
 *
 * Nothing here picks one. Both cells are in `OFF_STATE_CONTRACT` verbatim at
 * their own lines; this record is the disagreement stated as data so a
 * consumer meets it instead of discovering it. The build rule it produces is
 * the narrow one: the `Actions blocked` cell may be quoted about actions and
 * never about display.
 */
export const HUB_REACHABILITY_TENSION = {
  surface: 'SURF-DOH',
  readingA: {
    attribute: 'Actions blocked',
    cell: '`Not applicable — the Hub is server-side and unaffected by device reachability`',
    sourceRef: 'L78208',
  },
  readingB: {
    attribute: 'Must never claim prematurely',
    cell: 'That a run is `complete` while data is owed',
    sourceRef: 'L78215',
  },
  criterion: {
    identifier: 'AC-OFF-205',
    statement: 'A run does not display as `complete` until every assigned device has synced.',
    sourceRef: 'L78227',
  },
  test: {
    identifier: 'TEST-OFF-204',
    statement: 'Mark a run `submitted` with one device owing data and assert the Hub does not display `complete`.',
    sourceRef: 'L78234',
  },
  chosen: null,
  buildRule:
    'The Actions blocked cell is quotable about Hub actions and never about Hub display. AC-OFF-205 and TEST-OFF-204 both bind the display to device sync, so a display claim taken from that cell contradicts the criterion in the same table.',
} as const satisfies {
  readonly surface: SurfaceId
  readonly readingA: { readonly attribute: StateContractAttribute; readonly cell: string; readonly sourceRef: string }
  readonly readingB: { readonly attribute: StateContractAttribute; readonly cell: string; readonly sourceRef: string }
  readonly criterion: { readonly identifier: string; readonly statement: string; readonly sourceRef: string }
  readonly test: { readonly identifier: string; readonly statement: string; readonly sourceRef: string }
  /** No reading is adopted here. Both stay on the record. */
  readonly chosen: null
  readonly buildRule: string
}
