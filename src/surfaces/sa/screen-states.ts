import { SCREEN_STATES, type ScreenStateDefinition } from '@/ui/screen-state'

/**
 * The screen states that apply on SURF-SA: all thirteen less `STATE-07`
 * Offline, which is frontline-only — the console is an administrative surface
 * with no offline mode, and a disconnected operator sees no data rather than
 * stale data.
 *
 * One definition. This was hand-rolled as
 * `SCREEN_STATES.filter((s) => !s.frontlineOnly)` in eleven screens and again
 * in their tests, which is how a shared fact drifts: a cross-module review
 * found seven such duplications across the surface, and one had already
 * diverged. It also made the coverage gate unable to tell a module that walks
 * every state from one that names a few, because nothing shared was being
 * referenced.
 */
export const SA_APPLICABLE_STATES: readonly ScreenStateDefinition[] = SCREEN_STATES.filter(
  (s) => !s.frontlineOnly,
)

/** The twelve ids, for a gate or a test that wants them without the records. */
export const SA_APPLICABLE_STATE_IDS = SA_APPLICABLE_STATES.map((s) => s.id)
