/**
 * STATE-02: loading never renders a zero. A count that has not arrived is a
 * placeholder, not the number nought. `label` names the object being
 * fetched, per the STATE-02 contract, and is rendered VERBATIM -- this
 * component does not itself forbid a digit in it. The guarantee is that
 * nothing here computes or fills in a placeholder count (there is no count
 * prop to render as `0`); it is not a claim that no caller-supplied label
 * can ever contain a digit. The existing test proves the guarantee for the
 * one label it passes, not a property this component enforces at runtime.
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
