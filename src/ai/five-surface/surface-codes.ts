import { SURFACES, type SurfaceId } from '@/domain/surfaces'
import { type JourneySurfaceCode } from '@/ui/shared/journey'
import { type QueuedRequestSurfaceId } from '@/ai/requests/surface-matrix'

/**
 * THE ONE JOIN BETWEEN THE BUILD'S TWO FIVE-SURFACE SPELLINGS.
 *
 * The five surfaces are spelled twice in this build and were joined nowhere:
 *
 *   `@/ui/shared/journey`            `DOH | STU | CC | FL | SA`
 *   `@/ai/requests/surface-matrix`   `frontline | command-center | hub |
 *                                     studio | super-admin`
 *
 * Both bind independently to `SurfaceId` — each carries the canonical
 * identifier beside its own code and each proves the binding with a pair of
 * `Exclude<…> extends never` checks. Neither binds to the OTHER. So a
 * five-surface overlay reading the journey's effects record and the
 * queued-request matrix in one screen had two vocabularies for one axis and no
 * way to line up a column, which is how a five-column table silently becomes a
 * four-column one.
 *
 * ── `SurfaceId` IS THE PIVOT, AND THAT IS WHY THIS FILE IS SHORT ───────────
 * A third spelling was not added and neither existing union was widened. Both
 * already resolve to `SurfaceId`, so the join is the composition of two
 * mappings that already exist, and the only new thing here is the fact that
 * the composition is TOTAL and checked in both directions.
 *
 * ── THE EXHAUSTIVENESS CHECKS ARE THE POINT ────────────────────────────────
 * Three `Exclude<…> extends never` checks below, one per union. Adding a sixth
 * surface to `SurfaceId`, a sixth code to `JourneySurfaceCode`, or a sixth
 * column id to `QueuedRequestSurfaceId` fails `tsc` HERE rather than silently
 * dropping a column at the far end of a `.map`. That is the whole reason this
 * is a checked join and not an object literal.
 *
 * ── THE NAME IS NOT TRANSCRIBED ────────────────────────────────────────────
 * `name` is read from `SURFACES` at module load, never typed here. The two
 * source tables this build transcribes spell the console two ways — the
 * queued-request table writes `Super Admin platform console` and `SURFACES`
 * writes `Super Admin Platform Console` — and each transcription keeps its own
 * heading. What a join may not do is introduce a THIRD spelling, so it holds
 * no string of its own.
 *
 * Wave 5's task 19 widens `JourneyStep` and consumes this module rather than
 * writing a fourth five-surface vocabulary. Its public names are
 * `FIVE_SURFACE_JOIN`, `FIVE_SURFACE_JOURNEY_CODES`,
 * `FIVE_SURFACE_QUEUED_REQUEST_IDS`, `FiveSurfaceJoinRow`,
 * `fiveSurfaceBySurfaceId`, `fiveSurfaceByJourneyCode`,
 * `fiveSurfaceByQueuedRequestId`, `journeyCodeOfQueuedRequestSurface` and
 * `queuedRequestSurfaceOfJourneyCode`.
 *
 * This module is data and four total lookups. It renders nothing and decides
 * nothing.
 */

export interface FiveSurfaceJoinRow {
  /** The canonical platform surface. The pivot both spellings already share. */
  readonly surfaceId: SurfaceId
  /** `@/ui/shared/journey`'s code. */
  readonly journeyCode: JourneySurfaceCode
  /** `@/ai/requests/surface-matrix`'s column id. */
  readonly queuedRequestId: QueuedRequestSurfaceId
  /**
   * The canonical name, read from `SURFACES` rather than typed. Never a
   * transcription: a table's own heading stays in that table's module.
   */
  readonly name: string
}

const nameOf = (id: SurfaceId): string => {
  const surface = SURFACES.find((s) => s.id === id)
  if (surface === undefined) {
    throw new Error(`"${id}" is not a platform surface, so it has no canonical name.`)
  }
  return surface.name
}

/**
 * The join, in the order `JOURNEY_SURFACES` writes its codes. The order is the
 * journey's rather than the matrix's because the journey's is the one a
 * five-row surface-reaction table renders in, and that table is the shape
 * thirty storyboards will consume.
 */
export const FIVE_SURFACE_JOIN: readonly FiveSurfaceJoinRow[] = (
  [
    ['SURF-DOH', 'DOH', 'hub'],
    ['SURF-STU', 'STU', 'studio'],
    ['SURF-CC', 'CC', 'command-center'],
    ['SURF-FL', 'FL', 'frontline'],
    ['SURF-SA', 'SA', 'super-admin'],
  ] as const satisfies readonly (readonly [
    SurfaceId,
    JourneySurfaceCode,
    QueuedRequestSurfaceId,
  ])[]
).map(([surfaceId, journeyCode, queuedRequestId]) => ({
  surfaceId,
  journeyCode,
  queuedRequestId,
  name: nameOf(surfaceId),
}))

/* ── the three exhaustiveness checks ───────────────────────────────────── */

const JOIN_TUPLES = [
  ['SURF-DOH', 'DOH', 'hub'],
  ['SURF-STU', 'STU', 'studio'],
  ['SURF-CC', 'CC', 'command-center'],
  ['SURF-FL', 'FL', 'frontline'],
  ['SURF-SA', 'SA', 'super-admin'],
] as const

type MissingSurfaceId = Exclude<SurfaceId, (typeof JOIN_TUPLES)[number][0]>
const _everySurfaceJoined: MissingSurfaceId extends never ? true : never = true
void _everySurfaceJoined

type MissingJourneyCode = Exclude<JourneySurfaceCode, (typeof JOIN_TUPLES)[number][1]>
const _everyJourneyCodeJoined: MissingJourneyCode extends never ? true : never = true
void _everyJourneyCodeJoined

type MissingQueuedRequestId = Exclude<QueuedRequestSurfaceId, (typeof JOIN_TUPLES)[number][2]>
const _everyQueuedRequestIdJoined: MissingQueuedRequestId extends never ? true : never = true
void _everyQueuedRequestIdJoined

/* ── the four total lookups ────────────────────────────────────────────── */

export const FIVE_SURFACE_JOURNEY_CODES: readonly JourneySurfaceCode[] = FIVE_SURFACE_JOIN.map(
  (row) => row.journeyCode,
)

export const FIVE_SURFACE_QUEUED_REQUEST_IDS: readonly QueuedRequestSurfaceId[] =
  FIVE_SURFACE_JOIN.map((row) => row.queuedRequestId)

/**
 * Total. Throws rather than answering `undefined`, because a missing column is
 * exactly the failure this join exists to make impossible and an `undefined`
 * silently renders as a blank cell.
 */
export function fiveSurfaceBySurfaceId(id: SurfaceId): FiveSurfaceJoinRow {
  const row = FIVE_SURFACE_JOIN.find((candidate) => candidate.surfaceId === id)
  if (row === undefined) {
    throw new Error(`"${id}" is not a joined platform surface.`)
  }
  return row
}

export function fiveSurfaceByJourneyCode(code: JourneySurfaceCode): FiveSurfaceJoinRow {
  const row = FIVE_SURFACE_JOIN.find((candidate) => candidate.journeyCode === code)
  if (row === undefined) {
    throw new Error(`"${code}" is not a journey surface code.`)
  }
  return row
}

export function fiveSurfaceByQueuedRequestId(id: QueuedRequestSurfaceId): FiveSurfaceJoinRow {
  const row = FIVE_SURFACE_JOIN.find((candidate) => candidate.queuedRequestId === id)
  if (row === undefined) {
    throw new Error(`"${id}" is not a queued-request surface column.`)
  }
  return row
}

export const journeyCodeOfQueuedRequestSurface = (id: QueuedRequestSurfaceId): JourneySurfaceCode =>
  fiveSurfaceByQueuedRequestId(id).journeyCode

export const queuedRequestSurfaceOfJourneyCode = (
  code: JourneySurfaceCode,
): QueuedRequestSurfaceId => fiveSurfaceByJourneyCode(code).queuedRequestId
