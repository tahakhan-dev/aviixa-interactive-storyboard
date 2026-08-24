import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { SURFACES, type SurfaceId } from '@/domain/surfaces'
import { JOURNEY_SURFACES, type JourneySurfaceCode } from '@/ui/shared/journey'
import {
  QUEUED_REQUEST_SURFACE_COLUMNS,
  type QueuedRequestSurfaceId,
} from '@/ai/requests/surface-matrix'
import {
  FIVE_SURFACE_JOIN,
  FIVE_SURFACE_JOURNEY_CODES,
  FIVE_SURFACE_QUEUED_REQUEST_IDS,
  fiveSurfaceByJourneyCode,
  fiveSurfaceByQueuedRequestId,
  fiveSurfaceBySurfaceId,
  journeyCodeOfQueuedRequestSurface,
  queuedRequestSurfaceOfJourneyCode,
} from '@/ai/five-surface/surface-codes'

/**
 * Slice 11, wave 3, task 15 — THE ONE JOIN BETWEEN THE TWO FIVE-SURFACE
 * SPELLINGS.
 *
 * `@/ui/shared/journey` spells the five surfaces `DOH | STU | CC | FL | SA`.
 * `@/ai/requests/surface-matrix` spells them
 * `frontline | command-center | hub | studio | super-admin`. Both bind
 * independently to `SurfaceId` and NEITHER binds to the other, so before this
 * module a five-surface overlay reading both had two vocabularies and no way to
 * line up a column.
 *
 * WHAT THIS FILE HOLDS, and it is not "the mapping exists":
 *
 *   - MEMBERSHIP IS A LITERAL LIST DECLARED HERE, outside the module, typed to
 *     the two unions. Adding a row the unions do not carry fails to compile;
 *     adding a member to either union without a join row fails the module's own
 *     compile-time exhaustiveness checks. No length is asserted anywhere: a
 *     length passes for the wrong reason the moment one row is swapped for
 *     another.
 *   - THE JOIN IS TOTAL AND ROUND-TRIPPING, both directions, over the lists
 *     the two existing modules publish rather than over a hand-typed copy.
 *   - THE NAMES COME FROM `SURFACES`, so a renamed surface cannot leave this
 *     module carrying the old spelling.
 */

/* ── the frozen source ─────────────────────────────────────────────────── */

const SOURCE_PATH =
  '/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Production_Product_Blueprint.md'
const LINES: readonly string[] = [
  '',
  ...readFileSync(SOURCE_PATH, 'utf8').replace(/\n$/, '').split('\n'),
]
const L = (n: number): string => LINES[n] ?? ''

/**
 * The membership list, declared OUTSIDE the module under test and typed to
 * both unions. This is the gate: a deletion from `FIVE_SURFACE_JOIN` fails
 * here by name, and an addition to either union fails `tsc` in the module.
 */
const EXPECTED_PAIRS: readonly (readonly [SurfaceId, JourneySurfaceCode, QueuedRequestSurfaceId])[] =
  [
    ['SURF-DOH', 'DOH', 'hub'],
    ['SURF-STU', 'STU', 'studio'],
    ['SURF-CC', 'CC', 'command-center'],
    ['SURF-FL', 'FL', 'frontline'],
    ['SURF-SA', 'SA', 'super-admin'],
  ]

describe('the five-surface code join', () => {
  it('carries exactly the pairs the two existing unions can spell, by name', () => {
    expect(
      FIVE_SURFACE_JOIN.map((row) => [row.surfaceId, row.journeyCode, row.queuedRequestId]),
    ).toEqual(EXPECTED_PAIRS.map((pair) => [...pair]))
  })

  it('covers every surface both existing modules publish, with nothing left over', () => {
    expect([...FIVE_SURFACE_JOIN].map((r) => r.surfaceId).sort()).toEqual(
      SURFACES.map((s) => s.id).slice().sort(),
    )
    expect([...FIVE_SURFACE_JOURNEY_CODES].sort()).toEqual(
      JOURNEY_SURFACES.map((s) => s.code).slice().sort(),
    )
    expect([...FIVE_SURFACE_QUEUED_REQUEST_IDS].sort()).toEqual(
      QUEUED_REQUEST_SURFACE_COLUMNS.map((c) => c.id).slice().sort(),
    )
  })

  it('agrees with each existing module about which surface a code IS', () => {
    for (const surface of JOURNEY_SURFACES) {
      expect(fiveSurfaceByJourneyCode(surface.code).surfaceId).toBe(surface.surfaceId)
    }
    for (const column of QUEUED_REQUEST_SURFACE_COLUMNS) {
      expect(fiveSurfaceByQueuedRequestId(column.id).surfaceId).toBe(column.surfaceId)
    }
  })

  it('round-trips both directions for every member, so no column can be dropped', () => {
    for (const surface of JOURNEY_SURFACES) {
      const queued = queuedRequestSurfaceOfJourneyCode(surface.code)
      expect(journeyCodeOfQueuedRequestSurface(queued)).toBe(surface.code)
    }
    for (const column of QUEUED_REQUEST_SURFACE_COLUMNS) {
      const code = journeyCodeOfQueuedRequestSurface(column.id)
      expect(queuedRequestSurfaceOfJourneyCode(code)).toBe(column.id)
    }
  })

  it('takes its surface name from SURFACES rather than a second spelling', () => {
    for (const row of FIVE_SURFACE_JOIN) {
      const canonical = SURFACES.find((s) => s.id === row.surfaceId)
      expect(canonical).toBeDefined()
      expect(row.name).toBe(canonical?.name)
    }
  })

  it('resolves by surface identifier too, so a caller holding only SurfaceId can join', () => {
    for (const surface of SURFACES) {
      expect(fiveSurfaceBySurfaceId(surface.id).surfaceId).toBe(surface.id)
    }
  })

  it('refuses an unknown code rather than answering undefined', () => {
    expect(() => fiveSurfaceByJourneyCode('XX' as JourneySurfaceCode)).toThrow(/XX/)
    expect(() => fiveSurfaceByQueuedRequestId('nope' as QueuedRequestSurfaceId)).toThrow(/nope/)
  })

  it('is a build artefact and says so — the source names five surfaces, not two spellings', () => {
    // L90834 is the source's own statement of why one shared label matters.
    expect(L(90834)).toContain('One event, five distinct obligations, one shared label')
  })
})
