import type { PermissionDecision } from '@/policy/decision'

/**
 * STATE-05: a plain statement of why an outcome is what it is. Renders
 * `decision.explanation`, plus `decision.conditionToEnable` — what would
 * have to become true — when the decision carries one. This primitive never
 * computes a permission; it only renders the `PermissionDecision` it is
 * handed.
 *
 * Renders nothing for a fully `allowed` decision — there is no cause to
 * account for. Every other outcome gets its reason named, including
 * permissive-but-conditioned ones like `readOnly`: a reader who CAN read a
 * record but can't act on it still needs to know why.
 *
 * States: rendered (any outcome but `allowed`), empty (`allowed`).
 */
export interface PermissionNoticeProps {
  decision: PermissionDecision
}

export function PermissionNotice({ decision }: PermissionNoticeProps) {
  if (decision.outcome === 'allowed') return null
  return (
    <p role="note" className="text-sm text-[var(--color-ink-muted)]">
      {decision.explanation}
      {decision.conditionToEnable !== null ? ` ${decision.conditionToEnable}` : ''}
    </p>
  )
}
