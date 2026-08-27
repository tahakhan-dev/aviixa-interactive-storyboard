'use client'

import { useState } from 'react'
import type { PlaybackSpeed, TourRunner, TourRunnerState } from '@/tours/types'

/**
 * Task 16, pass criterion 2 (the operability half): every control here is a
 * native `<button>`/`<select>` — keyboard-operable by construction (Enter/
 * Space activates a button, arrow keys drive a select) with no custom
 * key-handling of its own needed. `TourOverlay` wraps the panel this renders
 * inside in `@/ui/primitives/useOverlayFocus`, which Tab-traps focus to this
 * panel while a tour is open — the reason a reviewer can drive the whole
 * tour from the keyboard alone without ever tabbing out onto the page the
 * tour itself is busy driving.
 *
 * Ruling R4: every one of these carries a stable `data-control-id`.
 *
 * `PlaybackSpeed` has no getter on `TourRunner` (`@/tours/types` — `speed`
 * is private to the runner's own closure, `setSpeed` is write-only). The
 * select's value is therefore this component's own local state, mirroring
 * what was last SET rather than reading back a value the runner does not
 * expose — seeded at `1`, the runner's own documented default.
 */
export interface TourControlsProps {
  readonly runner: TourRunner
  readonly state: TourRunnerState
  readonly onTakeOver: () => void
}

const SPEEDS: readonly PlaybackSpeed[] = [0.5, 1, 2]

const BUTTON_CLASS =
  'rounded border border-[#f5d90a] px-2 py-1 text-[#f0e6ff] hover:bg-[#2a1a4a] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent'

export function TourControls({ runner, state, onTakeOver }: TourControlsProps) {
  const [speed, setSpeed] = useState<PlaybackSpeed>(1)

  const isPlaying = state.status === 'playing'
  const canResume = state.status === 'paused'
  const canPlayPause = isPlaying || canResume
  const canBack = state.stepIndex > 0
  const canNext = state.status !== 'done'

  return (
    <div data-demo="tour-controls" className="flex flex-wrap items-center gap-2 text-xs">
      <button
        type="button"
        data-control-id="demo-tour-playpause"
        disabled={!canPlayPause}
        onClick={() => (isPlaying ? runner.pause() : runner.resume())}
        className={BUTTON_CLASS}
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <button
        type="button"
        data-control-id="demo-tour-back"
        disabled={!canBack}
        onClick={() => runner.back()}
        className={BUTTON_CLASS}
      >
        Back
      </button>
      <button
        type="button"
        data-control-id="demo-tour-next"
        disabled={!canNext}
        onClick={() => runner.next()}
        className={BUTTON_CLASS}
      >
        Next
      </button>
      <button
        type="button"
        data-control-id="demo-tour-restart"
        onClick={() => runner.restart()}
        className={BUTTON_CLASS}
      >
        Restart
      </button>
      <label className="flex items-center gap-1 text-[#c9b3ff]">
        Speed
        <select
          data-control-id="demo-tour-speed"
          value={speed}
          onChange={(e) => {
            const next = Number(e.target.value) as PlaybackSpeed
            setSpeed(next)
            runner.setSpeed(next)
          }}
          className="rounded border border-[#4a3070] bg-[#1b1030] px-1 py-1 text-[#f0e6ff]"
        >
          {SPEEDS.map((s) => (
            <option key={s} value={s}>
              {s}×
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        data-control-id="demo-tour-exit"
        onClick={() => runner.exit()}
        className={BUTTON_CLASS}
      >
        Exit
      </button>
      <button
        type="button"
        data-control-id="demo-tour-takeover"
        onClick={onTakeOver}
        className={`${BUTTON_CLASS} bg-[#f5d90a] font-bold text-[#1b1030] hover:bg-[#fef08a]`}
      >
        Take over
      </button>
    </div>
  )
}
