import Link from 'next/link'
import type { CrossSurfaceStatementModel } from '@/surfaces/doh/boundary'

/**
 * ONE of the eight adjacent capabilities of the boundary register (§19.1.2,
 * L25719-L25726), rendered where a Hub screen touches it.
 *
 * THE COMPONENT'S WHOLE JOB IS THE THING IT DOES NOT DRAW. AC-DOH-012-3
 * (L25767): "A Hub screen that touches an adjacent capability renders a
 * cross-surface link and no inline editing affordance for that capability."
 * `SB-DOH-003` (L25757) shows both halves — the Job detail version panel
 * carries a link reading "Open in the Standards and Operations Studio" and
 * "carries no editing affordance"; the tier and usage screen carries a line
 * reading "Tier and cap changes are administered by platform support" and
 * "no upgrade button". So there is no `<button>`, no field, no toggle and no
 * disabled control anywhere below, and there is no prop that could add one.
 * A disabled control would be its own false claim: it implies a condition
 * that could become true, and this boundary does not move.
 *
 * IT IS NOT `SeamNotice`, AND THE DIFFERENCE IS A CLAIM ABOUT THE PRODUCT.
 * `@/ui/doh/SeamNotice` says "not built here — owned by module X, slice N",
 * which is true of something arriving later and false of an act that
 * permanently lives on another surface. Both components render a bordered
 * note over a capability this screen does not carry, and only one of them is
 * honest about any given case.
 *
 * THIS COMPONENT HOLDS NO POLICY AND COMPUTES NO REACH. It is handed the
 * model — including whether the link renders at all, which is a checked
 * routing question `@/surfaces/doh/boundary` answers against the route
 * registry, not a question a component may answer for itself.
 */
export interface CrossSurfaceStatementProps {
  /** From `crossSurfaceStatement(id, role)`. Never assembled by hand. */
  readonly statement: CrossSurfaceStatementModel
}

export function CrossSurfaceStatement({ statement }: CrossSurfaceStatementProps) {
  const { boundary, owningSurfaceName, linkState, linkLabel, linkHref, note } = statement
  return (
    <div
      role="note"
      data-testid="cross-surface-statement"
      data-boundary={boundary.id}
      data-link-state={linkState}
      className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4 text-sm"
    >
      <p className="font-medium text-[var(--color-ink)]">
        Cross-surface boundary — owned by the {owningSurfaceName}
      </p>
      <p className="mt-1 text-[var(--color-ink-muted)]">{boundary.capability}</p>
      <p data-testid="cross-surface-note" className="mt-1 text-[var(--color-ink-muted)]">
        {note}
      </p>
      {linkState === 'link' && linkHref !== null && linkLabel !== null ? (
        <p className="mt-2">
          <Link href={linkHref} className="underline text-[var(--color-ink)]">
            {linkLabel}
          </Link>
        </p>
      ) : null}
      <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
        {boundary.owningSurfaceText}. {boundary.sourceStatus} {boundary.sourceRef}
      </p>
    </div>
  )
}
