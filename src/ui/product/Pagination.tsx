'use client'

import { bg, borderColor, controlMinClass, radiusClass, textColor } from './tokens'

/**
 * Reads `total` — the count BEFORE paging (`Query#total()`), never
 * `count()` — so the control states how much data really exists rather
 * than how many rows fit on the current page. A caller passing `count()`
 * here is exactly the bug the brief calls out: a pagination control that
 * lies about how much data exists.
 */
export interface PaginationProps {
  readonly idPrefix: string
  readonly page: number
  readonly pageSize: number
  readonly total: number
  readonly onPageChange: (page: number) => void
}

export function Pagination({ idPrefix, page, pageSize, total, onPageChange }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : page * pageSize + 1
  const end = Math.min(total, (page + 1) * pageSize)
  const atFirst = page <= 0
  const atLast = page >= pageCount - 1

  const buttonClass = (disabled: boolean) =>
    `${radiusClass('md')} border ${borderColor('border-strong')} ${bg('surface')} ${textColor('ink')} px-3 py-1.5 text-sm ${controlMinClass('comfortable')} ${disabled ? 'opacity-50' : ''}`

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3">
      <p className={`text-sm ${textColor('ink-muted')}`}>
        Showing {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          data-control-id={`${idPrefix}-page-first`}
          aria-disabled={atFirst}
          onClick={() => !atFirst && onPageChange(0)}
          className={buttonClass(atFirst)}
        >
          First
        </button>
        <button
          type="button"
          data-control-id={`${idPrefix}-page-prev`}
          aria-disabled={atFirst}
          onClick={() => !atFirst && onPageChange(page - 1)}
          className={buttonClass(atFirst)}
        >
          Previous
        </button>
        <span className={`text-sm ${textColor('ink')}`}>
          Page {page + 1} of {pageCount}
        </span>
        <button
          type="button"
          data-control-id={`${idPrefix}-page-next`}
          aria-disabled={atLast}
          onClick={() => !atLast && onPageChange(page + 1)}
          className={buttonClass(atLast)}
        >
          Next
        </button>
        <button
          type="button"
          data-control-id={`${idPrefix}-page-last`}
          aria-disabled={atLast}
          onClick={() => !atLast && onPageChange(pageCount - 1)}
          className={buttonClass(atLast)}
        >
          Last
        </button>
      </div>
    </nav>
  )
}
