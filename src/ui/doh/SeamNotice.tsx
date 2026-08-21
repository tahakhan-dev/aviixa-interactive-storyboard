import { dohSeamById, type DohSeamId } from '@/surfaces/doh/seams'

/**
 * A named cross-slice interface, never an inline stub (R10). Every module
 * screen that reaches a seam renders this instead of quietly omitting the
 * behaviour or faking it — it says outright which slice and module owns the
 * missing half.
 *
 * THIS NOTICE MAKES A CLAIM ABOUT A SCHEDULE, AND ONLY ABOUT A SCHEDULE.
 * "Not built here, owned by module X, slice N" says the capability belongs
 * on THIS surface and has not arrived yet; it comes true when slice N ships.
 * Every one of the seven registered seams is that shape — each names a
 * `MOD-DOH-*` owner and a slice number — and the closing line below now says
 * so outright rather than leaving a reader to infer which kind of absence
 * this is.
 *
 * IT IS NOT `@/ui/doh/CrossSurfaceStatement`, and the difference is a claim
 * about the product rather than a difference of wording. The eight rows of
 * the boundary register (§19.1.2, L25719-L25726) are acts that live on
 * another surface PERMANENTLY: the Hub "does not carry its user interface or
 * its decision rights" (L25715). Rendering "not built yet" over the Custom
 * Report Builder or a clearance grant would tell a client the platform is
 * behind schedule on something it is not building at all, ever, here.
 * `tests/unit/doh-boundary.test.ts` holds `DOH_SEAMS` to its half of the
 * split so the two cannot converge by accident.
 */
export interface SeamNoticeProps {
  readonly seamId: DohSeamId
}

export function SeamNotice({ seamId }: SeamNoticeProps) {
  const seam = dohSeamById(seamId)
  return (
    <div
      role="note"
      className="rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4 text-sm"
    >
      <p className="font-medium text-[var(--color-ink)]">Cross-slice seam — not built here</p>
      <p className="mt-1 text-[var(--color-ink-muted)]">{seam.description}</p>
      <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
        Owned by {seam.ownerModule}, slice {seam.ownerSlice}.
      </p>
      <p data-testid="seam-is-a-schedule" className="mt-1 text-xs text-[var(--color-ink-subtle)]">
        This is a schedule, not a boundary: the capability belongs on this surface and arrives with
        slice {seam.ownerSlice}. An act owned by another surface permanently is not this notice.
      </p>
    </div>
  )
}
