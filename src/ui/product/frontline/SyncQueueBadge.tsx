'use client'

import { StatusPill } from '../StatusPill'
import { borderColor, controlMinClass, radiusClass } from '../tokens'

/**
 * Task 13 — the sync queue, never collapsed to one "syncing" spinner. §12.2
 * forbids folding distinct states into one indicator, and the thirteen-
 * member capture ladder (`@/frontline/capture`) exists precisely so a
 * screen can say which of its states a capture is actually in. This badge
 * carries the three the brief names by name — `queued`, `uploading`,
 * `quarantined` — as three separately toned, separately labelled
 * `StatusPill`s, each rendered even at zero so an explicit "0 quarantined"
 * is never confused with "unknown". A caller with more of the ladder to
 * show (e.g. the full sync-detail sheet) reads `@/frontline/capture`
 * directly; this badge is the persistent-chrome summary, not the ladder.
 *
 * Same connectivity rule as `ConnectivityBadge`: `counts` is a controlled
 * prop over the product's own simulated state, never a real upload queue —
 * there is no backend for it to reflect.
 */
export interface SyncQueueCounts {
  readonly queued: number
  readonly uploading: number
  readonly quarantined: number
}

export interface SyncQueueBadgeProps {
  readonly counts: SyncQueueCounts
  /** A stable registry id (ruling R4). Omit when the badge opens nothing. */
  readonly controlId?: string | undefined
  /** When present, the badge becomes a real ≥44px button (e.g. opens the sync inbox). */
  readonly onOpenDetail?: (() => void) | undefined
}

export function SyncQueueBadge({ counts, controlId, onOpenDetail }: SyncQueueBadgeProps) {
  const pills = (
    <>
      <StatusPill tone="queued" label={`${counts.queued} queued`} />
      <StatusPill tone="pending" label={`${counts.uploading} uploading`} />
      <StatusPill tone="conflict" label={`${counts.quarantined} quarantined`} />
    </>
  )

  if (onOpenDetail !== undefined) {
    return (
      <button
        type="button"
        data-control-id={controlId ?? 'fl-sync-queue-badge'}
        onClick={onOpenDetail}
        className={`flex flex-wrap items-center gap-2 ${controlMinClass('spacious')} ${radiusClass('md')} border ${borderColor('border')} px-2`}
      >
        {pills}
      </button>
    )
  }

  return (
    <div role="status" className="flex flex-wrap items-center gap-2">
      {pills}
    </div>
  )
}
