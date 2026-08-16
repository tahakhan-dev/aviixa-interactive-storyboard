import type { PermissionDecision } from '@/policy/decision'

/**
 * STATE-05: a plain statement that this identity's roles and scopes do not
 * carry the action. Renders `decision.explanation` in plain language, plus
 * `decision.conditionToEnable` — what would have to become true — when the
 * decision carries one. This primitive never computes a permission; it only
 * renders the `PermissionDecision` it is handed.
 *
 * States: a single rendering, driven entirely by the `decision` prop's
 * content (no separate visual states of its own).
 */
export interface PermissionNoticeProps {
  decision: PermissionDecision
}

export function PermissionNotice({ decision }: PermissionNoticeProps) {
  return (
    <p role="note" className="text-sm text-[var(--color-ink-muted)]">
      {decision.explanation}
      {decision.conditionToEnable !== null ? ` ${decision.conditionToEnable}` : ''}
    </p>
  )
}
