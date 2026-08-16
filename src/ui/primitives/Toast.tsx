import type { StatusTone } from './StatusPill'
import { Button } from './Button'

/**
 * `role="status"` so assistive technology announces it without focus
 * moving. Colour is never load-bearing alone: `icon` and `label` are both
 * required, same as `StatusPill`. The dismiss button's accessible name
 * names what it dismisses, rather than a bare "Dismiss".
 *
 * States: one rendering per tone — ok, info, attention, blocked, stale,
 * neutral.
 */
const TONE_BORDER: Record<StatusTone, string> = {
  ok: 'border-[var(--color-status-ok)]',
  info: 'border-[var(--color-status-info)]',
  attention: 'border-[var(--color-status-attention)]',
  blocked: 'border-[var(--color-status-blocked)]',
  stale: 'border-[var(--color-status-stale)]',
  neutral: 'border-[var(--color-border-strong)]',
}

export interface ToastProps {
  tone: StatusTone
  icon: string
  label: string
  onDismiss: () => void
}

export function Toast({ tone, icon, label, onDismiss }: ToastProps) {
  return (
    <div
      role="status"
      className={`flex items-center gap-3 rounded-[var(--radius-surface)] border-l-4 bg-[var(--color-surface)] p-3 shadow ${TONE_BORDER[tone]}`}
    >
      <span aria-hidden="true">{icon}</span>
      <span className="text-sm text-[var(--color-ink)]">{label}</span>
      <Button variant="secondary" onClick={onDismiss}>{`Dismiss: ${label}`}</Button>
    </div>
  )
}
