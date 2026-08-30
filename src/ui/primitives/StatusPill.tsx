/**
 * Colour is never load-bearing alone (shared primitive contract, rule 3).
 * Both `icon` and `label` are required, so a pill cannot be constructed that
 * communicates by colour alone. The icon is decorative (`aria-hidden`); the
 * label is what assistive technology and colour-blind readers rely on.
 *
 * States: one visual rendering per tone — ok, info, attention, blocked,
 * stale, neutral. A pill has no interactive states (no hover/focus/disabled);
 * it is a status readout, not a control.
 */
export type StatusTone = 'ok' | 'info' | 'attention' | 'blocked' | 'stale' | 'neutral'

const TONE_CLASS: Record<StatusTone, string> = {
  ok: 'bg-[var(--color-status-ok)]/10 text-[var(--color-status-ok)]',
  info: 'bg-[var(--color-status-info)]/10 text-[var(--color-status-info)]',
  attention: 'bg-[var(--color-status-attention)]/10 text-[var(--color-status-attention)]',
  blocked: 'bg-[var(--color-status-blocked)]/10 text-[var(--color-status-blocked)]',
  stale: 'bg-[var(--color-status-stale)]/10 text-[var(--color-status-stale)]',
  neutral: 'bg-[var(--color-status-neutral)]/10 text-[var(--color-status-neutral)]',
}

export interface StatusPillProps {
  tone: StatusTone
  icon: string
  label: string
}

export function StatusPill({ tone, icon, label }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CLASS[tone]}`}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </span>
  )
}
