import Link from 'next/link'
import type { CcLinkOutModel } from '@/surfaces/cc/decisions/link-outs'

/**
 * THE SHARED CROSS-SURFACE LINK-OUT.
 *
 * The Command Center owns no operational record. Twelve cells across its
 * twelve module matrices describe an act the cell's own words place on
 * another surface, and the build's one rendering rule draws the wrong thing
 * for every one of them — nothing at all where the token is `Explicitly
 * prohibited`, a live control where it is `Allowed with conditions`. This
 * draws the third thing, which is the only thing the source asks for.
 *
 * IT HOLDS NO POLICY AND CANNOT. Everything it needs is decided in
 * `ccLinkOutModel` under `src/surfaces/cc/decisions/`, outside `src/ui/`,
 * and handed in whole. This file names no role, reads no route registry and
 * evaluates no grant — the same discipline `WriteControl` states for itself,
 * and the reason the model function does not live here.
 *
 * IT HAS NO PROP THAT COULD ADD A CONTROL. Not a handler, not a label for
 * one, not a disabled one. A disabled control would be its own false claim:
 * it implies a condition that could become true, and this boundary does not
 * move. `AC-CC-301` (L37802) is the general statement — "each such control
 * is a link" — and `FUNC-CC-0801-1-2` (L37781) the specific one.
 *
 * FOUR STATES, AND THE FOURTH IS NOT A SHADE OF THE OTHERS.
 *
 * - `link` — the viewer's own role reaches the owning surface.
 * - `statement` — it does not, so there is no link.
 * - `open-decision` — whether the role reaches it is a question the source
 *   refuses to answer, and drawing no link silently would assert the refusal
 *   the source withholds.
 * - `owner-undecided` — the CELL names two owners and chooses neither. Not
 *   the viewer's reach but the destination itself is unsettled. Rendering
 *   one of the two would be this build choosing on the source's behalf, so
 *   both are named and neither is linked.
 *
 * THIS IS WHAT `MOD-CC-02`'S CHROME SHOULD HAVE CONSUMED. That module built
 * a local `ManualCloseLink` over a raw `<a href>` and a href handed in from
 * outside; the same row appears here as `cc-02-manual-close-supervisor` with
 * its pointer checked against the route registry. That module's files are
 * another task's path and are not edited.
 */
export interface CrossSurfaceLinkProps {
  readonly model: CcLinkOutModel
}

export function CrossSurfaceLink({ model }: CrossSurfaceLinkProps) {
  const { cell } = model
  return (
    <div
      role="note"
      data-testid="cc-cross-surface-link"
      data-link-state={model.linkState}
      data-cell-id={cell.id}
      className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4 text-sm"
    >
      <p className="font-medium text-[var(--color-ink)]">Held on another surface</p>
      <p className="mt-1 text-[var(--color-ink-muted)]">{cell.capability}</p>
      <p
        data-testid="cc-cross-surface-link-note"
        className="mt-1 text-[var(--color-ink-muted)]"
      >
        {model.note}
      </p>
      {model.linkState === 'link' && model.linkHref !== null && model.linkLabel !== null ? (
        <p className="mt-2">
          <Link
            href={model.linkHref}
            data-testid="cc-cross-surface-link-anchor"
            className="underline text-[var(--color-ink)]"
          >
            {model.linkLabel}
          </Link>
        </p>
      ) : null}
      <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">{model.sourceRef}</p>
    </div>
  )
}
