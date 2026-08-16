/**
 * The kernel never reads ambient time. Every timestamp it records comes from
 * an injected Clock, so an identical command sequence replays to an identical
 * state hash. Spec section 6.
 */
export interface Clock {
  /** Fictional scenario time, in milliseconds since the Unix epoch. */
  now(): number
  /** A strictly increasing sequence number for ordering within a run. */
  logicalTick(): number
  /** Advance fictional scenario time. Only the scenario engine calls this. */
  advance(ms: number): void
}

/**
 * The pinned start of the canonical story: Monday 2 March 2026, 06:00 UTC —
 * the start of the morning shift at the fictional Riverside plant.
 */
export const CANONICAL_EPOCH_MS = Date.UTC(2026, 2, 2, 6, 0, 0, 0)

export function fixedClock(epochMs: number): Clock {
  let current = epochMs
  let tick = 0
  return {
    now: () => current,
    logicalTick: () => ++tick,
    advance: (ms: number) => {
      if (ms < 0) throw new Error('Scenario time never runs backwards')
      current += ms
    },
  }
}
