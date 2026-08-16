import type { Clock } from '@/domain/clock'
import { emptyDomainState, withTenant, type PresentationState, type ScenarioDomainState } from '@/domain/state'
import { canonicalSerialize, hashState } from '@/domain/hash'
import { scenarioRunId, tenantId, type ScenarioRunId } from '@/domain/ids'
import type { RunLineage } from './lineage'

// Minor (final review): spec §3 names this mode `recovering`; this shipped
// `reconnecting` instead. Aligned to the spec's exact word.
export type ConnectivityMode =
  | 'online'
  | 'slow'
  | 'flapping'
  | 'offline'
  | 'dependency-down'
  | 'recovering'

// Task 5 controller finding: this used to be annotated `readonly
// ConnectivityMode[]`, which WIDENS the literal array back to the union
// type -- exactly the same defect I3 (final review) already fixed once for
// `REVIEW_STATUSES` in `@/review/records.ts`. With the widened annotation,
// `(typeof CONNECTIVITY_MODES)[number]` collapses to plain `ConnectivityMode`
// and any exhaustiveness check below type-checks unconditionally, whether or
// not the array actually lists every member -- a check that cannot fail is
// not a check. `as const satisfies readonly ConnectivityMode[]` keeps the
// literal tuple type (so the assertion below can compare it against the
// union) while still verifying every element is a valid `ConnectivityMode`.
export const CONNECTIVITY_MODES = [
  'online',
  'slow',
  'flapping',
  'offline',
  'dependency-down',
  'recovering',
] as const satisfies readonly ConnectivityMode[]

// Compile-time exhaustiveness check, same shape as
// `_AssertReviewStatusesExhaustive` in `@/review/records.ts`: fails to
// compile if `ConnectivityMode` gains or loses a member that
// `CONNECTIVITY_MODES` does not list exactly once.
type _AssertConnectivityModesExhaustive = [ConnectivityMode] extends [
  (typeof CONNECTIVITY_MODES)[number],
]
  ? [(typeof CONNECTIVITY_MODES)[number]] extends [ConnectivityMode]
    ? true
    : never
  : never
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- type-only compile-time check
const _connectivityModesExhaustive: _AssertConnectivityModesExhaustive = true

/** What `play`/`pause`/`setConnectivity` actually hold. See `getPlaybackState`. */
export interface PlaybackState {
  readonly playing: boolean
  readonly connectivity: ConnectivityMode
}

/** The result of `compareBeforeAndAfter` -- a pure diff, never a mutation. */
export interface StateComparison {
  readonly changedTenants: readonly string[]
  readonly sequenceDelta: number
  readonly priorHash: string
  readonly nextHash: string
  readonly identical: boolean
}

export interface ScenarioControls {
  /** Move `n` steps through the story. Clamps at both ends -- never wraps. */
  step(n: number): void
  /** Jump straight to a named step. Throws, naming the id, if it is unknown. */
  jumpTo(id: string): void
  play(): void
  pause(): void
  /** Stop and return to the first step. */
  replay(): void
  /** Clears view-only state (filters, selection, story position). */
  resetPresentation(): void
  setConnectivity(mode: ConnectivityMode): void
  /**
   * Blocking 5 (final review): `play`/`pause`/`setConnectivity` used to
   * write to a closure-local object with no way to ever read it back --
   * unobservable, and therefore untestable, by construction. This getter is
   * that missing read path, so those three writers are real, tested state
   * rather than a control that "looks production-grade but does nothing"
   * (spec §8).
   */
  getPlaybackState(): PlaybackState
  /** Advances the injected Clock. Never touches real (ambient) time. */
  advanceClock(ms: number): void
  /**
   * Starts a brand-new run with NO parent lineage -- that absence is what
   * distinguishes a clean start from `branchFrom` (`@/scenario/lineage`),
   * which always carries explicit parent lineage. Returns a freshly-built
   * `ScenarioDomainState` under `newRunId`; the run it replaces, if any, is
   * never read and never touched -- its immutable snapshot and append-only
   * ledger survive untouched. `newRunId` is supplied by the caller (see
   * `@/domain/ids`'s `scenarioRunId`) rather than generated here: run ids
   * are hashed and replayed, so they must be derived deterministically, not
   * randomised, and only the caller knows what a fresh id should be derived
   * from.
   */
  startClean(newRunId: ScenarioRunId): { readonly state: ScenarioDomainState; readonly lineage: RunLineage }
  /**
   * Deterministically builds the canonical fixture world for `seed`: every
   * generated value (the run id, the seed tenant's id and name) is a pure
   * function of the seed string, so the same seed always produces the same
   * state hash and a different seed always produces a different one. Never
   * consults `Math.random`, `Date.now`, or `crypto.randomUUID`.
   */
  loadCanonicalStory(seed: string): ScenarioDomainState
  /**
   * Pure: hashes `before` and `after` to compare them but mutates neither.
   * Async only because hashing is (`@/domain/hash`'s `sha256Hex` uses
   * `crypto.subtle.digest`, which returns a Promise).
   */
  compareBeforeAndAfter(
    before: ScenarioDomainState,
    after: ScenarioDomainState,
  ): Promise<StateComparison>
}

export interface ControlsDeps {
  readonly clock: Clock
  readonly steps: readonly string[]
  getPresentation(): PresentationState
  setPresentation(next: PresentationState): void
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Presentation-only story navigation. Every mutation goes through
 * `getPresentation`/`setPresentation` -- this never touches
 * `ScenarioDomainState` -- and every tick of time goes through the injected
 * `Clock`, never `Date.now()`.
 */
export function createControls(deps: ControlsDeps): ScenarioControls {
  const { clock, steps, getPresentation, setPresentation } = deps

  // Playback/connectivity are presentation-adjacent but not part of
  // PresentationState itself. Blocking 5 (final review): this comment used
  // to claim they were "real, held state -- not dead writes" while
  // `ScenarioControls` exposed no getter at all, which made `play`, `pause`
  // and `setConnectivity` unobservable -- and therefore untestable -- by
  // construction; the claim was false. `getPlaybackState()` below is the
  // read path that makes it true: mutable, but a mutable object with no
  // reader was exactly the defect, so this now has one.
  const playback: { playing: boolean; connectivity: ConnectivityMode } = {
    playing: false,
    connectivity: 'online',
  }

  const goToIndex = (index: number): void => {
    if (steps.length === 0) return
    const id = steps[clamp(index, 0, steps.length - 1)]
    if (id === undefined) return
    setPresentation({ ...getPresentation(), storyStepId: id })
  }

  return {
    step(n) {
      const current = getPresentation().storyStepId
      const currentIndex = current === null ? -1 : steps.indexOf(current)
      goToIndex(currentIndex + n)
    },

    jumpTo(id) {
      if (!steps.includes(id)) {
        throw new Error(`Unknown story step id: "${id}"`)
      }
      setPresentation({ ...getPresentation(), storyStepId: id })
    },

    play() {
      playback.playing = true
    },

    pause() {
      playback.playing = false
    },

    replay() {
      playback.playing = false
      goToIndex(0)
    },

    resetPresentation() {
      setPresentation({
        ...getPresentation(),
        filters: {},
        selection: [],
        storyStepId: null,
      })
    },

    setConnectivity(mode) {
      playback.connectivity = mode
    },

    getPlaybackState() {
      return { playing: playback.playing, connectivity: playback.connectivity }
    },

    advanceClock(ms) {
      // `Clock.advance` already refuses a negative delta -- no duplicate
      // check here.
      clock.advance(ms)
    },

    startClean(newRunId) {
      return {
        state: emptyDomainState(newRunId),
        lineage: {
          runId: newRunId,
          parentRunId: null,
          branchedFromSequence: null,
          createdAtLogical: clock.now(),
        },
      }
    },

    loadCanonicalStory(seed) {
      // Every generated value below is a pure function of `seed` -- the run
      // id and the seed tenant's id/name are all derived directly from the
      // string, never from `Math.random`, `Date.now`, or
      // `crypto.randomUUID`. That is the whole determinism contract: same
      // seed in, same state (and therefore same hash) out.
      const runId = scenarioRunId(`RUN-CANONICAL-${seed}`)
      return withTenant(emptyDomainState(runId), tenantId(`TEN-CANONICAL-${seed}`), (p) => ({
        ...p,
        displayName: `Canonical Story (${seed})`,
        lifecycleState: 'ACTIVE',
      }))
    },

    async compareBeforeAndAfter(before, after) {
      const [priorHash, nextHash] = await Promise.all([hashState(before), hashState(after)])
      const changedTenants: string[] = []
      const allTenantIds = new Set([...Object.keys(before.tenants), ...Object.keys(after.tenants)])
      for (const id of allTenantIds) {
        const priorTenant = Object.hasOwn(before.tenants, id) ? before.tenants[id] : undefined
        const nextTenant = Object.hasOwn(after.tenants, id) ? after.tenants[id] : undefined
        if (canonicalSerialize(priorTenant) !== canonicalSerialize(nextTenant)) {
          changedTenants.push(id)
        }
      }
      return {
        changedTenants,
        sequenceDelta: after.sequence - before.sequence,
        priorHash,
        nextHash,
        identical: priorHash === nextHash,
      }
    },
  }
}
