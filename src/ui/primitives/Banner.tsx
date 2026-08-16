import type { StatusTone } from './StatusPill'

/**
 * One banner, one cause (STATE-06 rule: never scatter the cause across
 * several messages). `role="status"` so assistive technology announces the
 * heading without the page needing to move focus.
 *
 * States: one rendering per tone (ok, info, attention, blocked, stale,
 * neutral). No interactive states — a banner is a message, not a control,
 * though it may carry an optional action.
 */
const TONE_BORDER: Record<StatusTone, string> = {
  ok: 'border-[var(--color-status-ok)]',
  info: 'border-[var(--color-status-info)]',
  attention: 'border-[var(--color-status-attention)]',
  blocked: 'border-[var(--color-status-blocked)]',
  stale: 'border-[var(--color-status-stale)]',
  neutral: 'border-[var(--color-border-strong)]',
}

export interface BannerProps {
  tone: StatusTone
  heading: string
  body: string
  action?: React.ReactNode
}

export function Banner({ tone, heading, body, action }: BannerProps) {
  return (
    <div
      role="status"
      className={`rounded-[var(--radius-surface)] border-l-4 bg-[var(--color-surface)] p-4 ${TONE_BORDER[tone]}`}
    >
      <p className="font-semibold text-[var(--color-ink)]">{heading}</p>
      <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{body}</p>
      {action !== undefined ? <div className="mt-3">{action}</div> : null}
    </div>
  )
}
