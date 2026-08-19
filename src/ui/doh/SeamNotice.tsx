import { dohSeamById, type DohSeamId } from '@/surfaces/doh/seams'

/**
 * A named cross-slice interface, never an inline stub (R10). Every module
 * screen that reaches a seam renders this instead of quietly omitting the
 * behaviour or faking it — it says outright which slice and module owns the
 * missing half.
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
    </div>
  )
}
