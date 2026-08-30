import type { ScreenStateId } from '@/ui/screen-state'

/**
 * How an aggregate reads, and why.
 *
 * `current`, `stale`, `unavailable` and `reconciled` are the frozen source's
 * own aggregate vocabulary for `OBJ-SA-AGGREGATE` (L42991). `loading`, `empty`
 * and `recovering` are the presentation states a screen genuinely distinguishes
 * and the source's four do not cover.
 *
 * One vocabulary. Ten screens defined their own with SIX different member sets
 * between them, and one had already drifted to `fresh` / `not-yet-arrived` --
 * inventing words for a vocabulary the source states -- while also collapsing
 * `STATE-02` (Loading) and `STATE-13` (Recovery) into a single rendering that
 * every other screen keeps apart. No screen was wrong alone.
 *
 * `AC-SA-01-03` (L43070) is the rule this exists to keep: a degraded aggregate
 * renders STALE WITH ITS AGE, a wholly unavailable one renders UNAVAILABLE, and
 * NEITHER renders as zero or blank.
 */
export const SA_FRESHNESS = [
  'current',
  'stale',
  'unavailable',
  'reconciled',
  'loading',
  'empty',
  'recovering',
] as const

export type SaFreshness = (typeof SA_FRESHNESS)[number]

type _AssertFreshnessClosed = [SaFreshness] extends [(typeof SA_FRESHNESS)[number]] ? true : never
const _freshnessIsClosed: _AssertFreshnessClosed = true
void _freshnessIsClosed

/**
 * The one mapping from screen state to how an aggregate reads. `STATE-02` and
 * `STATE-13` are DISTINCT: a value that has not arrived yet is not a value
 * being rebuilt after a failure, and telling a reviewer otherwise hides which
 * of the two the screen is in.
 */
export function saFreshnessFor(state: ScreenStateId): SaFreshness {
  switch (state) {
    case 'STATE-01':
      return 'empty'
    case 'STATE-02':
      return 'loading'
    case 'STATE-08':
      return 'stale'
    case 'STATE-10':
    case 'STATE-11':
    case 'STATE-12':
      return 'unavailable'
    case 'STATE-13':
      return 'recovering'
    default:
      return 'current'
  }
}

/** What an aggregate shows. Never a zero, never a blank (`AC-SA-01-03`). */
export function saAggregateText(freshness: SaFreshness, value: string): string {
  switch (freshness) {
    case 'unavailable':
      return 'Unavailable'
    case 'loading':
      return 'Not yet arrived'
    case 'empty':
      return 'Nothing recorded yet'
    case 'recovering':
      return 'Being rebuilt after a failure'
    default:
      return value
  }
}
