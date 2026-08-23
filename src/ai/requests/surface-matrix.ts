import { type SurfaceId } from '@/domain/surfaces'
import { type QueuedRequestStateId } from './states'

/**
 * THE STATE-TO-SURFACE MATRIX FOR QUEUED ARTIFICIAL-INTELLIGENCE REQUESTS.
 *
 * One row per state, one column per surface, transcribed from the table under
 * the header at L89695. Rows were COUNTED by walking the pipe-prefixed lines
 * beneath that header, not taken from a span: both dispatch briefs gave the
 * rows as L89698-L89709, and measured they run L89697-L89708. L89696 is the
 * separator, and the brief's span runs one line past the last row onto a blank.
 * The covering test re-measures rather than trusting the numbers written here.
 *
 * ── THE MATRIX IS WHERE AN ACT LIVES, AND THREE ACTS ARE NOT ON THE DEVICE ─
 * L89702 puts the human gate on the Client Command Center — "Allowed — the
 * gate is exercised here". L89706 puts cancellation with a reason there too.
 * L89708 puts reconciliation on the Delivery Operations Hub — "Allowed — the
 * record of truth holds it". The Frontline column shows those states and
 * offers none of those acts, so a Frontline renderer reading this matrix finds
 * nothing to build. Building a gate-decision or a reconciliation control on
 * the worker's device would put a Command Center act and a Hub act on the
 * floor interface, which is the defect this table exists to prevent.
 *
 * ── THE STUDIO COLUMN IS A STATED ABSENCE, WITH A REASON, ON EVERY ROW ─────
 * Every Studio cell is `Not applicable` and every one carries its reason, so
 * `reason` is a required field rather than an optional one: there is no way to
 * spell an empty Studio cell in these types. Both dispatch briefs say the
 * column reads `Not applicable — authoring surface` on every row. MEASURED, it
 * does not: the `saved locally` row at L89697 reads "Not
 * applicable — the Studio authors content, it does not observe runtime
 * requests". A build that asserted uniformity would have shipped the wrong
 * reason on that row, so each reason is transcribed per row.
 *
 * ── THE PLATFORM-CONSOLE CONDITIONS ARE THE VISIBILITY BOUNDARY ────────────
 * The Super Admin column is mostly `Allowed with conditions`, and the
 * conditions differ row by row: queue depth without content, counts and rates,
 * counts and rates and latency, the gate mechanism without the decision, a
 * staleness rate, an expiry rate. AC-42-605 at L89718 is the rule underneath —
 * counts, rates and latencies without content. Collapsing them into one
 * "aggregate only" would erase the boundary each condition draws, so each is
 * carried as its own string and checked against its own row.
 *
 * ── ONE CELL IS NOT `ALLOWED WITH CONDITIONS` AND IT MATTERS ───────────────
 * L89707 gives the platform console a plain `Allowed` on `failed`, annotated
 * "failure classes drive platform incident handling". Failure classes are not
 * request content, and the source grants them outright. Rendering that as a
 * conditioned cell would understate what the console may see; rendering the
 * conditioned cells as plain would overstate it. `allowed` therefore carries an
 * optional note and `allowed with conditions` a required condition, and the two
 * cannot be spelled the same way.
 *
 * ── THE FIVE COLUMNS ARE THE FIVE SURFACES, PROVED RATHER THAN NAMED ───────
 * The column axis is bound to `SurfaceId` the way `@/ui/shared/journey`'s
 * `JOURNEY_SURFACES` binds its own five-surface column axis: a short code per
 * column, the canonical surface identifier beside it, and two compile-time
 * `Exclude<…> extends never` checks — one that every column code is listed
 * exactly once, one that every platform surface is represented. Declared as
 * five bare strings instead, the columns are five strings that HAPPEN to match
 * the five surfaces, and a sixth surface or a renamed one would leave this
 * table silently short a column.
 *
 * The HEADINGS stay the source's own wording, which is not the canonical
 * surface name in every case — the table writes `Super Admin platform
 * console` where `SURFACES` writes `Super Admin Platform Console`. Only the
 * identity is bound; the transcription is left alone.
 *
 * This module is data and two lookups.
 */

export type QueuedRequestSurfaceId =
  | 'frontline'
  | 'command-center'
  | 'hub'
  | 'studio'
  | 'super-admin'

export interface QueuedRequestSurfaceColumn {
  readonly id: QueuedRequestSurfaceId
  /** The platform surface this column IS, not a name that resembles one. */
  readonly surfaceId: SurfaceId
  /** The table's own column heading, verbatim. */
  readonly heading: string
}

/** The columns, in the order the table writes them. */
export const QUEUED_REQUEST_SURFACE_COLUMNS = [
  { id: 'frontline', surfaceId: 'SURF-FL', heading: 'Frontline Worker Application' },
  { id: 'command-center', surfaceId: 'SURF-CC', heading: 'Client Command Center' },
  { id: 'hub', surfaceId: 'SURF-DOH', heading: 'Delivery Operations Hub' },
  { id: 'studio', surfaceId: 'SURF-STU', heading: 'Standards and Operations Studio' },
  { id: 'super-admin', surfaceId: 'SURF-SA', heading: 'Super Admin platform console' },
] as const satisfies readonly QueuedRequestSurfaceColumn[]

type MissingFromColumns = Exclude<
  QueuedRequestSurfaceId,
  (typeof QUEUED_REQUEST_SURFACE_COLUMNS)[number]['id']
>
const _columnsExhaustive: MissingFromColumns extends never ? true : never = true
void _columnsExhaustive
type MissingSurfaceId = Exclude<
  SurfaceId,
  (typeof QUEUED_REQUEST_SURFACE_COLUMNS)[number]['surfaceId']
>
const _everySurfaceIsAColumn: MissingSurfaceId extends never ? true : never = true
void _everySurfaceIsAColumn

/** Column order, as the table writes it. */
export const QUEUED_REQUEST_SURFACE_IDS: readonly QueuedRequestSurfaceId[] =
  QUEUED_REQUEST_SURFACE_COLUMNS.map((c) => c.id)

/** The table's own column headings, in the same order. */
export const SURFACE_COLUMN_HEADINGS: readonly string[] =
  QUEUED_REQUEST_SURFACE_COLUMNS.map((c) => c.heading)

/**
 * A cell. `reason` on a stated absence is REQUIRED — the reason is what makes
 * the absence a statement rather than an omission — while `unavailable`
 * carries `string | null` because the source writes bare `Unavailable` on one
 * row and an explained one on others, and inventing a reason there would be a
 * false claim about the source.
 */
export type SurfaceCell =
  | { readonly disposition: 'allowed'; readonly note: string | null }
  | { readonly disposition: 'allowed with conditions'; readonly condition: string }
  | { readonly disposition: 'read-only' }
  | { readonly disposition: 'unavailable'; readonly reason: string | null }
  | { readonly disposition: 'not applicable'; readonly reason: string }

export interface SurfaceMatrixRow {
  readonly state: QueuedRequestStateId
  readonly locator: string
  readonly cells: { readonly [S in QueuedRequestSurfaceId]: SurfaceCell }
}

const allowed = (note: string | null = null): SurfaceCell => ({ disposition: 'allowed', note })
const conditioned = (condition: string): SurfaceCell => ({
  disposition: 'allowed with conditions',
  condition,
})
const readOnly = (): SurfaceCell => ({ disposition: 'read-only' })
const unavailable = (reason: string | null = null): SurfaceCell => ({
  disposition: 'unavailable',
  reason,
})
const notApplicable = (reason: string): SurfaceCell => ({
  disposition: 'not applicable',
  reason,
})

/** The short Studio reason. The `saved locally` row carries a longer one of its own. */
const AUTHORING = 'authoring surface'
const SERVER_UNAWARE = 'the server does not know it exists'
const COUNTS_AND_RATES = 'counts and rates only'
const COUNTS_ONLY = 'counts only'

export const QUEUED_REQUEST_SURFACE_MATRIX = [
  {
    state: 'saved locally',
    locator: 'L89697',
    cells: {
      frontline: allowed('shown in the request list'),
      'command-center': unavailable(SERVER_UNAWARE),
      hub: unavailable(SERVER_UNAWARE),
      studio: notApplicable('the Studio authors content, it does not observe runtime requests'),
      'super-admin': unavailable('no telemetry exists for an unsent record'),
    },
  },
  {
    state: 'waiting for connection',
    locator: 'L89698',
    cells: {
      frontline: allowed(),
      'command-center': unavailable(),
      hub: unavailable(),
      studio: notApplicable(AUTHORING),
      'super-admin': conditioned('visible only as device queue depth, never content'),
    },
  },
  {
    state: 'uploaded',
    locator: 'L89699',
    cells: {
      frontline: allowed(),
      'command-center': readOnly(),
      hub: readOnly(),
      studio: notApplicable(AUTHORING),
      'super-admin': conditioned(COUNTS_AND_RATES),
    },
  },
  {
    state: 'revalidating',
    locator: 'L89700',
    cells: {
      frontline: allowed(),
      'command-center': readOnly(),
      hub: readOnly(),
      studio: notApplicable(AUTHORING),
      'super-admin': conditioned(COUNTS_AND_RATES),
    },
  },
  {
    state: 'processing',
    locator: 'L89701',
    cells: {
      frontline: allowed(),
      'command-center': readOnly(),
      hub: readOnly(),
      studio: notApplicable(AUTHORING),
      'super-admin': conditioned('counts, rates, latency'),
    },
  },
  {
    state: 'pending human review',
    locator: 'L89702',
    cells: {
      frontline: allowed(),
      'command-center': allowed('the gate is exercised here'),
      hub: readOnly(),
      studio: notApplicable(AUTHORING),
      'super-admin': conditioned('gate mechanism observed, never the decision'),
    },
  },
  {
    state: 'answer available',
    locator: 'L89703',
    cells: {
      frontline: allowed(),
      'command-center': readOnly(),
      hub: readOnly(),
      studio: notApplicable(AUTHORING),
      'super-admin': conditioned(COUNTS_AND_RATES),
    },
  },
  {
    state: 'stale',
    locator: 'L89704',
    cells: {
      frontline: allowed(),
      'command-center': readOnly(),
      hub: readOnly(),
      studio: notApplicable(AUTHORING),
      'super-admin': conditioned('staleness rate as a quality signal'),
    },
  },
  {
    state: 'expired',
    locator: 'L89705',
    cells: {
      frontline: allowed(),
      'command-center': readOnly(),
      hub: readOnly(),
      studio: notApplicable(AUTHORING),
      'super-admin': conditioned('expiry rate as a queue-health signal'),
    },
  },
  {
    state: 'cancelled',
    locator: 'L89706',
    cells: {
      frontline: allowed(),
      'command-center': allowed('a Supervisor or Quality Manager may cancel with a reason'),
      hub: readOnly(),
      studio: notApplicable(AUTHORING),
      'super-admin': conditioned(COUNTS_ONLY),
    },
  },
  {
    state: 'failed',
    locator: 'L89707',
    cells: {
      frontline: allowed(),
      'command-center': readOnly(),
      hub: readOnly(),
      studio: notApplicable(AUTHORING),
      'super-admin': allowed('failure classes drive platform incident handling'),
    },
  },
  {
    state: 'reconciled',
    locator: 'L89708',
    cells: {
      frontline: unavailable('the worker sees the outcome, not the bookkeeping'),
      'command-center': readOnly(),
      hub: allowed('the record of truth holds it'),
      studio: notApplicable(AUTHORING),
      'super-admin': conditioned(COUNTS_ONLY),
    },
  },
] as const satisfies readonly SurfaceMatrixRow[]

/** The cell at a state and a surface. Total, so it cannot answer `undefined`. */
export function cellAt(state: QueuedRequestStateId, surface: QueuedRequestSurfaceId): SurfaceCell {
  const row = QUEUED_REQUEST_SURFACE_MATRIX.find((r) => r.state === state)
  if (row === undefined) {
    throw new Error(`No surface-matrix row for queued-request state ${state}.`)
  }
  return row.cells[surface]
}

/**
 * A cell rendered back to the source's own wording. Every branch is spelled
 * out because the disposition words differ in more than a suffix, and the
 * covering test compares the result with the frozen cell.
 */
export function cellText(cell: SurfaceCell): string {
  switch (cell.disposition) {
    case 'allowed':
      return cell.note === null ? 'Allowed' : `Allowed — ${cell.note}`
    case 'allowed with conditions':
      return `Allowed with conditions — ${cell.condition}`
    case 'read-only':
      return 'Read-only'
    case 'unavailable':
      return cell.reason === null ? 'Unavailable' : `Unavailable — ${cell.reason}`
    case 'not applicable':
      return `Not applicable — ${cell.reason}`
  }
}
