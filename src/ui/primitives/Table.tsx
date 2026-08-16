import type { ReactNode } from 'react'
import { EmptyState } from './EmptyState'
import { SkeletonBlock } from './SkeletonBlock'

/**
 * Renders `<caption>` plus a real `<thead>`/`<tbody>`. Three distinct empty
 * paths, deliberately never collapsed into one message (shared primitive
 * contract — empty is not the same as no-match-after-filter):
 *  - nothing exists yet → the `EmptyState` primitive (STATE-01)
 *  - a filter excluded every row → "no runs match the current filters"
 *  - fetch in flight → `SkeletonBlock`, never a zero-row grid (STATE-02)
 *  - fetch failed → `role="alert"` naming what failed (STATE-12)
 *
 * ponytail: `columns[].key` is a plain string, not `keyof Row`, because
 * making Table generic over Row broke inference on the brief's own
 * `rows={[]}` test case (TS infers Row from an empty array as `never`,
 * which no column key can satisfy). Upgrade to a generic `Row` type if a
 * later slice needs compile-time column/row key matching.
 *
 * States: default (rows present), empty, no-match-after-filter, loading,
 * error.
 */
export interface TableColumn {
  key: string
  header: string
}

export type TableRow = Record<string, ReactNode>

export interface TableEmptyState {
  title: string
  whatCreatesIt: string
}

export interface TableProps {
  caption: string
  columns: readonly TableColumn[]
  rows: readonly TableRow[]
  emptyState: TableEmptyState
  filtered?: boolean
  loading?: boolean
  error?: string
}

export function Table({
  caption,
  columns,
  rows,
  emptyState,
  filtered = false,
  loading = false,
  error,
}: TableProps) {
  if (loading) {
    return (
      <div>
        <p className="font-medium text-[var(--color-ink)]">{caption}</p>
        <SkeletonBlock lines={3} label={`Loading ${caption}`} />
      </div>
    )
  }

  if (error !== undefined) {
    return (
      <div role="alert">
        <p className="font-medium text-[var(--color-ink)]">{caption}</p>
        <p className="text-sm text-[var(--color-status-blocked)]">{error}</p>
      </div>
    )
  }

  if (rows.length === 0) {
    if (filtered) {
      return (
        <div>
          <p className="font-medium text-[var(--color-ink)]">{caption}</p>
          <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
            No runs match the current filters.
          </p>
        </div>
      )
    }
    return <EmptyState title={emptyState.title} whatCreatesIt={emptyState.whatCreatesIt} />
  }

  return (
    <table className="w-full text-left text-sm">
      <caption className="pb-2 text-left font-medium text-[var(--color-ink)]">{caption}</caption>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} scope="col" className="border-b border-[var(--color-border)] p-2">
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {columns.map((col) => (
              <td key={col.key} className="border-b border-[var(--color-border)] p-2">
                {row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
