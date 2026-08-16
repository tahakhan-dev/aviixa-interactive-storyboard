import type { Clock } from '@/domain/clock'
import type { PresentationState } from '@/domain/state'

// Minor (final review): spec §3 names this mode `recovering`; this shipped
// `reconnecting` instead. Aligned to the spec's exact word.
export type ConnectivityMode =
  | 'online'
  | 'slow'
  | 'flapping'
  | 'offline'
  | 'dependency-down'
  | 'recovering'

export const CONNECTIVITY_MODES: readonly ConnectivityMode[] = [
  'online',
  'slow',
  'flapping',
  'offline',
  'dependency-down',
  'recovering',
] as const

/** What `play`/`pause`/`setConnectivity` actually hold. See `getPlaybackState`. */
export interface PlaybackState {
  readonly playing: boolean
  readonly connectivity: ConnectivityMode
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
  }
}
