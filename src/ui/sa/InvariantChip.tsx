import { StatusPill } from '@/ui/primitives'
import type { SaInvariantDefinition } from '@/surfaces/sa/invariants'

/**
 * Spec §3 — the single most load-bearing decision in this slice. The six
 * ENFORCED invariants (`AC-SA-INV-003`, L47849) carry no off control, no
 * approval path and no configuration key, on any screen — the ABSENT
 * rendering. This chip is the ABSENT rendering's visible form: a STATUS
 * CHIP, not a control. It reuses `StatusPill` (a `<span>`, never a
 * `<button>`/`<input>`/`[role=switch]`) rather than a disabled toggle,
 * which is the obvious design two source passages literally describe and
 * which this component exists to refuse — a disabled toggle implies an
 * enabled state exists somewhere, and for these six it never does.
 *
 * No `title`/tooltip either: L87376's "absence of control, not a disabled
 * control" and L44041's "ENFORCED badge" both hold at once only if nothing
 * here reads as an interactive affordance, including a hover hint.
 */
export interface InvariantChipProps {
  readonly invariant: SaInvariantDefinition
}

export function InvariantChip({ invariant }: InvariantChipProps) {
  return (
    <div>
      <StatusPill tone="blocked" icon="🔒" label={`${invariant.name} — ENFORCED`} />
      <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">{invariant.description}</p>
    </div>
  )
}
