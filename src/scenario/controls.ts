import type { Clock } from '@/domain/clock'
import type { PresentationState } from '@/domain/state'

export type ConnectivityMode =
  | 'online'
  | 'slow'
  | 'flapping'
  | 'offline'
  | 'dependency-down'
  | 'reconnecting'

export const CONNECTIVITY_MODES: readonly ConnectivityMode[] = [
  'online',
  'slow',
  'flapping',
  'offline',
  'dependency-down',
  'reconnecting',
] as const

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
  // PresentationState itself (no test or consumer reads them back yet); kept
  // as real, held state -- not dead writes -- so a later UI layer has
  // somewhere to read from.
  const playback = { playing: false, connectivity: 'online' as ConnectivityMode }

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

    advanceClock(ms) {
      // `Clock.advance` already refuses a negative delta -- no duplicate
      // check here.
      clock.advance(ms)
    },
  }
}
