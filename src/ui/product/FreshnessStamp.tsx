'use client'

import { radiusClass, statusBg, statusText, textColor } from './tokens'

/**
 * Task 12, pass criterion 4 — states an as-of time on every projection, with
 * a stale treatment that is not just a colour swap: `stale` renders as a
 * toned, icon-bearing pill that says the word "Stale" out loud, while fresh
 * renders as plain muted text with no pill at all. A reader — or a
 * colour-blind reader, or forced-colors mode — never has to infer staleness
 * from hue alone; the shape of the rendering itself changes.
 *
 * NOT `src/ui/primitives/FreshnessLabel.tsx`: that primitive states age and
 * origin but has no distinct stale rendering (STATE-08's default treatment,
 * always the same shape) and is built on the legacy `--color-*` tokens.
 * `src/ui/product/**` may only reference `tokens.ts`'s vocabulary (see
 * `DataTable.tsx`'s header), so this is a fresh implementation, not a
 * wrapper.
 *
 * States: fresh, stale. Both are a single, non-interactive text/pill
 * rendering — a freshness stamp is a fact statement, not a control.
 */
export interface FreshnessStampProps {
  readonly asOfLabel: string
  readonly stale?: boolean
  readonly originLabel?: string
}

export function FreshnessStamp({ asOfLabel, stale = false, originLabel }: FreshnessStampProps) {
  const suffix = originLabel !== undefined ? `, ${originLabel}` : ''

  if (stale) {
    return (
      <p
        className={`inline-flex items-center gap-1.5 ${radiusClass('pill')} px-2 py-0.5 text-xs font-medium ${statusBg('stale')} ${statusText('stale')}`}
      >
        <span aria-hidden="true">◐</span>
        <span>{`Stale — as of ${asOfLabel}${suffix}`}</span>
      </p>
    )
  }

  return <p className={`text-xs ${textColor('ink-subtle')}`}>{`As of ${asOfLabel}${suffix}`}</p>
}
