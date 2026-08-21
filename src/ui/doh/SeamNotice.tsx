import { dohSeamById, dohSeamStatus, type DohSeamId } from '@/surfaces/doh/seams'

/**
 * A named cross-slice interface, never an inline stub (R10). Every module
 * screen that reaches a seam renders this instead of quietly omitting the
 * behaviour or faking it — it says outright which slice and module owns the
 * other half.
 *
 * THIS NOTICE MAKES A CLAIM ABOUT A SCHEDULE, AND ONLY ABOUT A SCHEDULE.
 * Every registered seam names a `MOD-DOH-*` owner and a slice number, and
 * the closing line below says so outright rather than leaving a reader to
 * infer which kind of absence this is.
 *
 * ── A SCHEDULE HAS TWO STATES AND THIS DREW ONE ───────────────────────────
 * "Not built here" is true of a schedule OUTSTANDING and false of a schedule
 * MET. `dohSeamStatus` has derived `open | closed` since slice 4 and this
 * component ignored it, so when slice 6 closed `worker-shift-meter`,
 * `archival-cascade` and `qualification-gate` — `ownerSlice 6`, and this
 * build is slice 6 — three screens began telling a client that something
 * shipped in the build they are reading was not built. That is the same
 * defect shape as the boundary case below, pointed the other way: an absence
 * asserted where there is none.
 *
 * SO `closed` SAYS THE SCHEDULE ARRIVED AND NOT ONE WORD MORE. It is derived
 * from `ownerSlice <= THIS_SLICE`, which is a fact about the CALENDAR; the
 * component cannot see what the owning module actually built and must not
 * imply it did. "Closed at slice N" is the registry's own word for the
 * registry's own fact, and the line points a reader at the owning module for
 * what that slice carries. Overclaiming here — "built", "shipped", "now
 * available" — would trade a false absence for a false presence, which is
 * the worse of the two: `qualification-gate` is registered as co-owned by
 * `MOD-DOH-06` and `MOD-DOH-07`, and only `MOD-DOH-07`'s half is built.
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
 *
 * THREE CLAIMS, THREE RENDERINGS, AND NONE OF THEM COLLAPSES INTO ANOTHER:
 * a PLACE that never moves is `CrossSurfaceStatement`; a schedule still
 * OUTSTANDING is this notice's `open`; a schedule MET is this notice's
 * `closed`. The middle sentence — "This is a schedule, not a boundary" — is
 * deliberately common to both of the last two, because the thing that
 * separates them from a boundary does not change when the date passes.
 */
export interface SeamNoticeProps {
  readonly seamId: DohSeamId
}

export function SeamNotice({ seamId }: SeamNoticeProps) {
  const seam = dohSeamById(seamId)
  const status = dohSeamStatus(seam)
  const closed = status === 'closed'
  return (
    <div
      role="note"
      data-seam-status={status}
      className="rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4 text-sm"
    >
      <p className="font-medium text-[var(--color-ink)]">
        {closed
          ? `Cross-slice seam — closed at slice ${seam.ownerSlice}`
          : 'Cross-slice seam — not built here'}
      </p>
      <p className="mt-1 text-[var(--color-ink-muted)]">{seam.description}</p>
      <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
        Owned by {seam.ownerModule}, slice {seam.ownerSlice}.
      </p>
      <p data-testid="seam-is-a-schedule" className="mt-1 text-xs text-[var(--color-ink-subtle)]">
        {closed ? (
          <>
            This is a schedule, not a boundary, and the schedule has been met: slice{' '}
            {seam.ownerSlice} owns the other half and has landed. What that slice built for this
            seam is {seam.ownerModule}&rsquo;s statement to make, not this notice&rsquo;s. An act
            owned by another surface permanently is not this notice.
          </>
        ) : (
          <>
            This is a schedule, not a boundary: the capability belongs on this surface and arrives
            with slice {seam.ownerSlice}. An act owned by another surface permanently is not this
            notice.
          </>
        )}
      </p>
    </div>
  )
}
