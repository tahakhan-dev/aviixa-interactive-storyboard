/**
 * STATE-02: loading never renders a zero. A count that has not arrived is a
 * placeholder, not the number nought — this component's output contains no
 * digit at all, enforced by a test over its rendered text content. `label`
 * names the object being fetched, per the STATE-02 contract.
 *
 * States: a single "loading" rendering. `lines` only varies the number of
 * placeholder bars, not a distinct state.
 */
export interface SkeletonBlockProps {
  lines: number
  label: string
}

export function SkeletonBlock({ lines, label }: SkeletonBlockProps) {
  return (
    <div role="status" className="space-y-2">
      <span className="block text-sm text-[var(--color-ink-muted)]">{label}</span>
      {Array.from({ length: lines }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="block h-3 animate-pulse rounded bg-[var(--color-surface-sunken)]"
        />
      ))}
    </div>
  )
}
