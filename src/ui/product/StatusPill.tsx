'use client'

import { radiusClass, statusBg, statusText, type StatusToken } from './tokens'

/**
 * Task 12 — the product-level status readout, built on `tokens.ts`'s
 * ten-member `StatusToken` vocabulary (ok/info/warn/danger/stale/offline/
 * queued/pending/conflict/blocked), NOT `src/ui/primitives/StatusPill.tsx`'s
 * six-member `StatusTone`. See `tokens.ts`'s own header for why the two
 * stay separate types with the same component name rather than one being
 * widened to cover the other.
 *
 * Colour is never load-bearing alone (same rule the primitive states): an
 * icon (decorative, `aria-hidden`) and a label (what assistive technology
 * and colour-blind readers rely on) are both always rendered. `icon` is
 * optional only because a caller can supply one; when omitted, a per-tone
 * default renders, so a caller can never construct a pill with no
 * non-colour signal at all.
 *
 * States: one visual rendering per tone. No interactive states — a status
 * pill is a readout, not a control, so it carries no `data-control-id`.
 */
const DEFAULT_ICON: Readonly<Record<StatusToken, string>> = {
  ok: '✓',
  info: 'ℹ',
  warn: '▲',
  danger: '✕',
  stale: '◐',
  offline: '○',
  queued: '…',
  pending: '◔',
  conflict: '⇆',
  blocked: '⛔',
}

export interface StatusPillProps {
  readonly tone: StatusToken
  readonly label: string
  readonly icon?: string
}

export function StatusPill({ tone, label, icon }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${radiusClass('pill')} px-2.5 py-0.5 text-xs font-medium ${statusBg(tone)} ${statusText(tone)}`}
    >
      <span aria-hidden="true">{icon ?? DEFAULT_ICON[tone]}</span>
      <span>{label}</span>
    </span>
  )
}
