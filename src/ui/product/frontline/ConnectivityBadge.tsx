'use client'

import { StatusPill } from '../StatusPill'
import { textColor } from '../tokens'

/**
 * Task 13 — the PRODUCT's simulated connectivity, never the browser's real
 * network. §4.1 is explicit that this control simulates AVIIXA connectivity
 * and must not reflect `navigator.onLine` or a `window` `online`/`offline`
 * listener — reading either here would make the storyboard tell the truth
 * about the wrong thing, so `status` is a plain controlled prop and this
 * file contains no `navigator`, no `addEventListener`, and no effect of any
 * kind. The caller (a scenario's own state, not this component) decides
 * what "connected" means for the demo.
 *
 * Built on `StatusPill` (Task 12): colour is never load-bearing alone —
 * every state carries a distinct icon and a label that says the word, so a
 * colour-blind reader or forced-colors mode reads the same fact.
 */
export type ConnectivityStatus = 'online' | 'offline'

export interface ConnectivityBadgeProps {
  readonly status: ConnectivityStatus
  /** Optional extra context, e.g. why offline changes nothing about the run. */
  readonly note?: string | undefined
}

export function ConnectivityBadge({ status, note }: ConnectivityBadgeProps) {
  return (
    <div role="status" className="flex flex-col items-start gap-0.5">
      <StatusPill
        tone={status === 'online' ? 'ok' : 'offline'}
        label={status === 'online' ? 'Connected' : 'Offline — working locally'}
      />
      {note !== undefined ? <p className={`text-xs ${textColor('ink-subtle')}`}>{note}</p> : null}
    </div>
  )
}
