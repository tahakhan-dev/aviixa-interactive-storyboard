/**
 * STATE-08: age AND origin both explicit, so a reader can judge how much to
 * trust stale content. Both are required props rendered as plain text.
 *
 * States: a single rendering — freshness is a fact statement, not a control.
 */
export interface FreshnessLabelProps {
  asOfLabel: string
  originLabel: string
}

export function FreshnessLabel({ asOfLabel, originLabel }: FreshnessLabelProps) {
  return (
    <p className="text-xs text-[var(--color-ink-subtle)]">
      {asOfLabel}, {originLabel}
    </p>
  )
}
