/**
 * STATE-01: never a blank panel, never confused with a failure. Always names
 * what would appear here (`title`) and what creates it (`whatCreatesIt`),
 * plus the creating action where this role holds it (`action`).
 *
 * States: a single rendering. `action` present or absent is not a distinct
 * visual state so much as an optional slot — the primitive still names the
 * creating action in text via `whatCreatesIt` even when no button is passed.
 */
export interface EmptyStateProps {
  title: string
  whatCreatesIt: string
  action?: React.ReactNode
}

export function EmptyState({ title, whatCreatesIt, action }: EmptyStateProps) {
  return (
    <div className="rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-6 text-center">
      <p className="font-medium text-[var(--color-ink)]">{title}</p>
      <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{whatCreatesIt}</p>
      {action !== undefined ? <div className="mt-3">{action}</div> : null}
    </div>
  )
}
