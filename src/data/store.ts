/**
 * Task 7 (`src/data/store.ts`) — the in-memory database plus its subscriber
 * set. This is the one mutable object in the data layer. `repository.ts` is
 * the only file allowed to call `replace`/`notify`/`restore`/`resetToSeed`;
 * every other consumer reads business truth through `Repository`, never
 * through this module directly (the same rule that keeps a component from
 * importing a seed file — this is the one place both would land on).
 *
 * A collection is always swapped for a NEW array, never spliced in place
 * (`replace` below), so a reader holding a reference from an earlier
 * `get()` keeps seeing the rows it was built from even if a write lands a
 * moment later — the same structural-sharing discipline `@/domain/state`
 * already holds for `ScenarioDomainState`.
 *
 * No ambient time or randomness: the store owns one `Clock`
 * (`@/domain/clock#fixedClock`), pinned at the same canonical epoch the
 * rest of the storyboard uses, and never reads `Date.now()`/`new Date()`/
 * `Math.random()` itself.
 */
import { fixedClock, CANONICAL_EPOCH_MS, type Clock } from '@/domain/clock'
import type { CollectionName } from './schemas'

/** One array per §3.1 collection, keyed exhaustively over `CollectionName`. */
export type CollectionData = { readonly [K in CollectionName]: readonly unknown[] }

export interface Store {
  readonly clock: Clock
  get(name: CollectionName): readonly unknown[]
  replace(name: CollectionName, rows: readonly unknown[]): void
  /** A monotonic counter shared by every collection — ids and sequencing never collide across a commit. */
  nextSequence(): number
  /**
   * Task 5 (closure sweep) — continues the counter after a rehydrated
   * restore instead of leaving it at the fresh-boot `0` `createStore` always
   * starts at. `n` is the last sequence value already spent (by the session
   * whose snapshot this is), so the NEXT `nextSequence()` call returns
   * `n + 1`. Takes the higher of `n` and the counter's current value, so a
   * stale/lower rehydrated value can never move the counter backwards.
   * Call this once, right after `restore()`, before any write runs.
   */
  seedSequence(n: number): void
  subscribe(listener: () => void): () => void
  /** Fires every registered listener once. `repository.ts` calls this exactly once per committed write. */
  notify(): void
  snapshot(): CollectionData
  restore(data: CollectionData): void
  /** Back to the seed this store was booted with — `Repository.reset()`. */
  resetToSeed(): void
}

export function createStore(seed: CollectionData): Store {
  const initialSeed = seed
  let data: CollectionData = seed
  let sequence = 0
  const listeners = new Set<() => void>()
  const clock = fixedClock(CANONICAL_EPOCH_MS)

  return {
    clock,
    get(name) {
      return data[name]
    },
    replace(name, rows) {
      data = { ...data, [name]: rows }
    },
    nextSequence() {
      sequence += 1
      return sequence
    },
    seedSequence(n) {
      sequence = Math.max(sequence, n)
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    notify() {
      for (const listener of listeners) listener()
    },
    snapshot() {
      return { ...data }
    },
    restore(next) {
      data = { ...next }
    },
    resetToSeed() {
      data = initialSeed
      sequence = 0
    },
  }
}
