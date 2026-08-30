import { CRITICAL_ACTIONS, type SaCriticalActionId } from '@/surfaces/sa/critical-actions'

/**
 * The disclosure every screen offering a critical-class action must carry.
 *
 * DEC-ROOTSUCC-001 (L55989): the root approves its own critical requests,
 * because the frozen source assigns no second critical approver — so the
 * platform-wide refusal of self-approval has nothing to fall back to. The
 * consequence is that root unavailability FREEZES those actions rather than
 * routing them elsewhere.
 *
 * This is a shared component rather than per-screen copy because it shipped
 * as per-screen copy first, and a cross-module review found the obvious
 * result: five screens stated the freeze and the two carrying seven of the
 * eleven critical actions — the emergency pause, and retention and legal hold
 * — omitted it. The storyboard's most honest disclosure about this design was
 * missing exactly where it bites hardest.
 */
export const ROOT_FREEZE_HEADLINE = 'Critical class frozen — no second approver exists'

export interface RootUnavailableFreezeProps {
  /** The critical-class actions THIS screen offers. */
  readonly actions: readonly SaCriticalActionId[]
}

export function RootUnavailableFreeze({ actions }: RootUnavailableFreezeProps) {
  const named = CRITICAL_ACTIONS.filter((a) => actions.includes(a.id))
  return (
    <section
      aria-label="Root unavailability"
      className="mt-6 rounded-[var(--radius-surface)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-4"
    >
      <h2 className="text-sm font-semibold">{ROOT_FREEZE_HEADLINE}</h2>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        The root decides its own critical requests. That is not an oversight in this screen: the
        frozen source assigns no second critical approver, so the platform-wide refusal of
        self-approval has nothing to fall back to (DEC-ROOTSUCC-001; the contradiction is recorded
        at L55989). While the root is unavailable these actions do not route elsewhere — they
        freeze, and stay pending and visible rather than expiring.
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-ink-muted)]">
        {named.map((a) => (
          <li key={a.id}>
            {a.name} <span className="text-[var(--color-ink-subtle)]">({a.sourceRef})</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 max-w-prose text-xs text-[var(--color-ink-subtle)]">
        Rendered rather than hidden, because a reviewer needs to see the concentration this design
        carries.
      </p>
    </section>
  )
}
