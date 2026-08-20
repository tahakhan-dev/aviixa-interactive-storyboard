import { stuSeamStatus, type StudioSeamDefinition } from '@/studio/seams'

/**
 * A named cross-slice interface, never an inline stub (R10, R21). Every
 * Studio screen that reaches a dependency it does not own renders this
 * instead of quietly omitting the behaviour or faking it.
 *
 * THIS COMPONENT HOLDS NO POLICY AND COMPUTES NO DECISION. It is handed a
 * seam RECORD — not an identifier it looks up against a module-load
 * snapshot, and not a role, a grant or an outcome — and draws it. The only
 * thing it derives is `stuSeamStatus`, which is a pure read of the record's
 * own `ownerSlices` and is presentation, not permission.
 *
 * THE THIRD ARM IS THE ONE THAT MATTERS. Five seams carry no owning slice
 * at all (census §6.3): the counterpart's OWNER is known and its SCHEDULE
 * is not. Those render "owner stated, no slice assigned" — the plain
 * statement — rather than inheriting the nearest slice number, which is
 * exactly what slice 4's two unregistered dependencies refused to do.
 *
 * The first arm matters too, in the opposite direction: a seam whose owner
 * has already shipped is drawn as CONSUMPTION, not as an absence. A notice
 * reading "not built here" over slice 4's live grant registry would be a
 * screen asserting an absence the build contradicts.
 */
export interface StudioSeamNoticeProps {
  readonly seam: StudioSeamDefinition
}

export function StudioSeamNotice({ seam }: StudioSeamNoticeProps) {
  const status = stuSeamStatus(seam)
  const heading =
    status === 'built'
      ? 'Cross-slice seam — consumed, not owned here'
      : 'Cross-slice seam — not built here'
  const ownership =
    status === 'unscheduled'
      ? `${seam.owner}. Owner stated, no slice assigned.`
      : `${seam.owner} — ${status === 'built' ? 'built in' : 'owned by'} ${
          seam.ownerSlices.length === 1 ? 'slice' : 'slices'
        } ${seam.ownerSlices.join(' and ')}.`

  return (
    <div
      role="note"
      className="rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4 text-sm"
    >
      <p className="font-medium text-[var(--color-ink)]">
        {heading}: {seam.name}
      </p>
      <p className="mt-1 text-[var(--color-ink-muted)]">{seam.contract}</p>
      <p data-testid="seam-ownership" className="mt-1 text-xs text-[var(--color-ink-subtle)]">
        {ownership}
      </p>
      <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">Source: {seam.sourceRef}</p>
    </div>
  )
}
