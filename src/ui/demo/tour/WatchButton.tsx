'use client'

import { useTourRunnerApi } from '../DemoChrome'

/**
 * Task 16 — the launch point: `<WatchButton tourId=… />`, the "Produces"
 * contract this task hands down. Reads the ONE shared `TourRunner` off
 * `DemoChrome`'s context (never a repository write, never a second engine)
 * and calls its own `start(tourId)`.
 *
 * Deliberately does NOT pre-validate `tourId` against the loaded tours list:
 * `TourRunner#start` already reports an unknown id as a typed `state.error`
 * (`@/tours/runner`, "Unknown tour id") rather than silently doing nothing —
 * re-deriving that same "does this id exist" check here would be a second,
 * parallel copy of a decision the runner already owns correctly.
 */
export interface WatchButtonProps {
  readonly tourId: string
}

export function WatchButton({ tourId }: WatchButtonProps) {
  const { runner } = useTourRunnerApi()
  const disabled = runner === null

  return (
    <button
      type="button"
      data-control-id={`demo-tour-watch-${tourId}`}
      disabled={disabled}
      title={disabled ? 'Tour data is still loading.' : undefined}
      onClick={() => runner?.start(tourId)}
      className="rounded border border-[#f5d90a] px-2 py-1 text-xs font-semibold text-[#f0e6ff] hover:bg-[#2a1a4a] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
    >
      Watch
    </button>
  )
}
