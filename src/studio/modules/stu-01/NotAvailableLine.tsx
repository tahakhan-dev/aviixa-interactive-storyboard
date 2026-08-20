/**
 * `SB-STU-04` (L31640), the single line that renders where a configuration
 * section would be:
 *
 *   "In any configuration section whose capability is not enabled, the Studio
 *    renders a single line where the section would be: the section name, the
 *    words 'Not available', and the specific reason, for example 'Requires the
 *    containment response capability, which is not enabled for this tenant.'
 *    A link leads to the Atomic Capabilities view for users permitted to
 *    enable it, and states who to ask for users who are not."
 *
 * Exported for the nine-section panel (`MOD-STU-05`, Task 15) to consume, so
 * the sentence is written once for all nine sections rather than nine times.
 *
 * IT HOLDS NO POLICY. `viewHref` and `whoToAsk` are HANDED IN by the screen
 * that computed them; this component asks nobody anything. It also lives
 * outside `src/ui/`, so nothing here is even in the position to grow one.
 *
 * WHY BOTH THE LINK AND THE WHO-TO-ASK SENTENCE RENDER, ALWAYS. The
 * storyboard splits them by "permitted to enable it", and in this build
 * NOBODY is established as permitted to enable — `DEC-CAPAUTH-001` is open.
 * Rendering only the link would assert an authority the decision withholds;
 * rendering only the who-to-ask sentence would drop the pointer the
 * storyboard requires. So the link is offered to a reader who may reach the
 * Atomic Capabilities view (the screen decides that and passes `viewHref`),
 * and the who-to-ask sentence always renders, because "who to ask" is
 * genuinely unanswered until the client answers it.
 */
export interface NotAvailableLineProps {
  /** The section this line stands in for, by its own name. */
  readonly section: string
  /** The specific reason — never a bare status. Built by `notAvailableReason`. */
  readonly reason: string
  /** The route to the Atomic Capabilities view, or `null` for a reader who may not reach it. */
  readonly viewHref: string | null
  /** Who to ask. Always rendered. */
  readonly whoToAsk: string
}

export function NotAvailableLine({ section, reason, viewHref, whoToAsk }: NotAvailableLineProps) {
  return (
    <p
      role="note"
      data-testid={`not-available-${section}`}
      className="border-l-2 border-[var(--color-border-strong)] py-1 pl-3 text-sm text-[var(--color-ink-muted)]"
    >
      <span className="font-medium text-[var(--color-ink)]">{section}</span>
      {' — '}
      <span className="font-medium text-[var(--color-ink)]">Not available</span>
      {'. '}
      <span>{reason}</span>{' '}
      {viewHref !== null ? (
        <>
          <a href={viewHref} className="text-[var(--color-primary)] underline">
            Atomic Capabilities view
          </a>
          {'. '}
        </>
      ) : null}
      <span>{whoToAsk}</span>
    </p>
  )
}
