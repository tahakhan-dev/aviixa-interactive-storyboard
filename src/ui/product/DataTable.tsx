'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import type { Query } from '@/data/repository'
import { LiveRegion } from '@/ui/primitives'
import { bg, borderColor, radiusClass, textColor } from './tokens'
import { useTableState } from './useTableState'
import { TableToolbar } from './TableToolbar'
import { Pagination } from './Pagination'

/**
 * Task 10. The production successor to `src/ui/primitives/Table.tsx` —
 * that primitive stays in place (old screens still render it) but is a
 * static list renderer: no sort, no filter, no pagination, no selection.
 * This is the version every list screen across all five surfaces migrates
 * to, consuming `Query<T>` (Task 7) directly rather than a pre-flattened
 * `TableRow[]`.
 *
 * BUILT ENTIRELY ON `src/ui/product/tokens.ts`, NEVER ON
 * `src/ui/primitives/{Table,Checkbox,Field,Select,Tabs,FreshnessLabel}` —
 * Task 9's own primitive inventory measured all six (plus `Table`'s own
 * caption) as not theme-aware under the new shell in dark mode (contrast as
 * low as 1.05:1). Wrapping any of them in a compensating style here would
 * leave that bug in place for the next reader; this component owns its own
 * markup instead, so nothing it renders can inherit a fixed-light colour.
 * `LiveRegion` is the one primitive reused as-is — it sets no colour at all.
 *
 * SEVEN BEHAVIOURS, ONE REDUCER. `useTableState` owns sort/filter/search/
 * page/selection/column-visibility; `TableToolbar` only dispatches into it
 * and this component only reads from it, so the two can never disagree
 * about what the current view is.
 */
export interface DataTableColumn<T> {
  readonly key: string
  readonly header: string
  readonly render: (row: T) => ReactNode
  readonly sortValue?: (row: T) => string | number
  readonly align?: 'start' | 'end'
  readonly hideBelow?: 'md' | 'lg'
  readonly defaultHidden?: boolean
}

export interface FilterOption {
  readonly value: string
  readonly label: string
}

export interface FilterDef<T> {
  readonly key: string
  readonly label: string
  readonly options: readonly FilterOption[]
  readonly match: (row: T, value: string) => boolean
}

export interface BulkAction {
  readonly id: string
  readonly label: string
  readonly onAction: (ids: readonly string[]) => void
}

export interface DataTableProps<T> {
  readonly caption: string
  readonly columns: readonly DataTableColumn<T>[]
  readonly query: Query<T>
  readonly rowId: (row: T) => string
  readonly rowHref?: (row: T) => string
  readonly filters?: readonly FilterDef<T>[]
  readonly search?: { readonly placeholder: string; readonly match: (row: T, q: string) => boolean }
  readonly selection?: { readonly onChange: (ids: readonly string[]) => void; readonly bulkActions: readonly BulkAction[] }
  /** Default 20. */
  readonly pageSize?: number
  readonly emptyState: { readonly title: string; readonly whatCreatesIt: string }
}

/** Fixed row height the virtualization window's spacer math is built on. */
const ROW_HEIGHT_PX = 44
/** Above this many rows on the current page, the body windows instead of rendering every row. */
const VIRTUALIZE_THRESHOLD = 200
const OVERSCAN_ROWS = 8
const VIEWPORT_HEIGHT_PX = 560

function slugify(caption: string): string {
  const slug = caption.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '')
  return slug.length > 0 ? `dt-${slug}` : 'dt-table'
}

/** Native `indeterminate` has no JSX prop — it must be set imperatively on the DOM node. */
function SelectAllCheckbox({
  checked,
  indeterminate,
  onChange,
  controlId,
  label,
}: {
  readonly checked: boolean
  readonly indeterminate: boolean
  readonly onChange: () => void
  readonly controlId: string
  readonly label: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={label}
      data-control-id={controlId}
      className="h-4 w-4"
    />
  )
}

export function DataTable<T>({
  caption,
  columns,
  query,
  rowId,
  rowHref,
  filters,
  search,
  selection,
  pageSize = 20,
  emptyState,
}: DataTableProps<T>) {
  const idPrefix = slugify(caption)
  const defaultHiddenKeys = columns.filter((c) => c.defaultHidden === true).map((c) => c.key)
  const [state, actions] = useTableState(defaultHiddenKeys)

  // Baseline count BEFORE this component's own filter/search state is
  // applied — the "does anything exist at all" question. `query` itself may
  // already carry the caller's own scoping `.where()`s; that's the universe
  // this table draws from, not a second copy of the whole collection.
  const baseTotal = query.total()

  let filteredQuery = query
  for (const filter of filters ?? []) {
    const value = state.filters[filter.key]
    if (value !== undefined && value !== '') {
      filteredQuery = filteredQuery.where((row) => filter.match(row, value))
    }
  }
  if (search !== undefined && state.search.trim() !== '') {
    const needle = state.search.trim()
    filteredQuery = filteredQuery.where((row) => search.match(row, needle))
  }

  const filteredTotal = filteredQuery.total()
  const allFilteredRows = filteredQuery.all()

  const sortColumn = columns.find((c) => c.key === state.sortKey)
  const sortFn = sortColumn?.sortValue
  const sortedRows = sortFn
    ? [...allFilteredRows].sort((a, b) => {
        const av = sortFn(a)
        const bv = sortFn(b)
        const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))
        return state.sortDir === 'asc' ? cmp : -cmp
      })
    : allFilteredRows

  const pageCount = Math.max(1, Math.ceil(filteredTotal / pageSize))
  const pageIndex = Math.min(state.page, pageCount - 1)
  const pageRows = sortedRows.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize)
  const pageIds = pageRows.map(rowId)

  const visibleColumns = columns.filter((c) => !state.hiddenColumns.has(c.key))
  // `hideBelow: 'md'` only matters against the card list (the table itself
  // never renders below `md` at all, so the column is always present
  // there). `hideBelow: 'lg'` additionally drops the column between `md`
  // and `lg` inside the table via a responsive class, not JS state — a
  // breakpoint is a CSS fact, not something to recompute on scroll/resize.
  const cardColumns = visibleColumns.filter((c) => c.hideBelow === undefined)
  const tableCellClass = (hideBelow: DataTableColumn<T>['hideBelow']): string =>
    hideBelow === 'lg' ? 'hidden lg:table-cell' : ''

  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => state.selected.has(id))
  const somePageSelected = !allPageSelected && pageIds.some((id) => state.selected.has(id))

  useEffect(() => {
    selection?.onChange([...state.selected])
  }, [state.selected, selection])

  const noDataAtAll = baseTotal === 0
  const noMatch = !noDataAtAll && filteredTotal === 0

  const virtualize = pageRows.length > VIRTUALIZE_THRESHOLD
  const [scrollTop, setScrollTop] = useState(0)
  const visibleRowCount = Math.ceil(VIEWPORT_HEIGHT_PX / ROW_HEIGHT_PX)
  const windowStart = virtualize ? Math.max(0, Math.floor(scrollTop / ROW_HEIGHT_PX) - OVERSCAN_ROWS) : 0
  const windowEnd = virtualize
    ? Math.min(pageRows.length, windowStart + visibleRowCount + OVERSCAN_ROWS * 2)
    : pageRows.length
  const windowedRows = pageRows.slice(windowStart, windowEnd)
  const topSpacerPx = windowStart * ROW_HEIGHT_PX
  const bottomSpacerPx = (pageRows.length - windowEnd) * ROW_HEIGHT_PX
  // ponytail: the mobile card list below always renders every `pageRows`
  // entry unwindowed — only the desktop table body virtualizes. A caller
  // opting into a >200-row page AND a sub-md viewport at once renders the
  // full card list to the DOM. Add card-list windowing if that combination
  // turns up in a real screen; no list built so far needs it.

  const selectAllLabel = `Select all ${pageRows.length} rows on this page`
  const sortAnnouncement =
    sortColumn && sortFn
      ? `Sorted by ${sortColumn.header}, ${state.sortDir === 'asc' ? 'ascending' : 'descending'}`
      : ''

  const colSpan = visibleColumns.length + (selection !== undefined ? 1 : 0)

  const firstCell = (row: T, content: ReactNode): ReactNode => {
    if (rowHref === undefined) return content
    return (
      <Link href={rowHref(row)} data-control-id={`${idPrefix}-row-${rowId(row)}`} className="hover:underline">
        {content}
      </Link>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <TableToolbar
        idPrefix={idPrefix}
        search={search !== undefined ? { placeholder: search.placeholder } : undefined}
        searchValue={state.search}
        onSearchChange={actions.setSearch}
        filters={filters}
        filterValues={state.filters}
        onFilterChange={actions.setFilter}
        columns={columns.map((c) => ({ key: c.key, header: c.header }))}
        hiddenColumns={state.hiddenColumns}
        onToggleColumn={actions.toggleColumn}
      />

      {selection !== undefined && state.selected.size > 0 ? (
        <div
          role="region"
          aria-label="Bulk actions"
          className={`flex flex-wrap items-center gap-3 ${radiusClass('md')} border ${borderColor('border')} ${bg('raised')} px-3 py-2`}
        >
          <span className={`text-sm font-medium ${textColor('ink')}`}>{state.selected.size} selected</span>
          {selection.bulkActions.map((action) => (
            <button
              key={action.id}
              type="button"
              data-control-id={`${idPrefix}-bulk-${action.id}`}
              onClick={() => action.onAction([...state.selected])}
              className={`${radiusClass('md')} border ${borderColor('border-strong')} ${bg('surface')} ${textColor('ink')} px-3 py-1 text-sm`}
            >
              {action.label}
            </button>
          ))}
          <button
            type="button"
            data-control-id={`${idPrefix}-bulk-clear`}
            onClick={actions.clearSelection}
            className={`text-sm underline ${textColor('ink-muted')}`}
          >
            Clear selection
          </button>
        </div>
      ) : null}

      {/* Screen-reader only: the visual sort state is already carried by the
          arrow glyph and `aria-sort` on the active header, so a second,
          always-visible "Sorted by…" line would be redundant for a sighted
          reader — and, caught live in Chrome, unstyled text here inherits
          the page's legacy `color: var(--color-ink)` base rule (fixed
          light, not dark-mode aware), which is nearly invisible on a dark
          background. `sr-only` clips visually without `display:none`, so
          the live region still reaches assistive tech. */}
      <div className="sr-only">
        <LiveRegion>{sortAnnouncement}</LiveRegion>
      </div>

      {noDataAtAll ? (
        <div className={`${radiusClass('lg')} border border-dashed ${borderColor('border-strong')} ${bg('sunken')} p-6 text-center`}>
          <p className={`font-medium ${textColor('ink')}`}>{emptyState.title}</p>
          <p className={`mt-1 text-sm ${textColor('ink-muted')}`}>{emptyState.whatCreatesIt}</p>
        </div>
      ) : noMatch ? (
        <div role="status" className={`${radiusClass('lg')} border ${borderColor('border')} ${bg('sunken')} p-6 text-center`}>
          <p className={`font-medium ${textColor('ink')}`}>No {caption} match the current search or filters.</p>
          <p className={`mt-1 text-sm ${textColor('ink-muted')}`}>Try a different search term, or clear a filter above.</p>
        </div>
      ) : (
        <>
          {/* Desktop / tablet: a real table. */}
          <div className="hidden md:block">
            <div
              className={virtualize ? 'overflow-y-auto' : undefined}
              style={virtualize ? { maxHeight: VIEWPORT_HEIGHT_PX } : undefined}
              onScroll={virtualize ? (e) => setScrollTop(e.currentTarget.scrollTop) : undefined}
            >
              <table className="w-full border-collapse text-left text-sm">
                <caption className="sr-only">{caption}</caption>
                <thead>
                  <tr className={`border-b ${borderColor('border')}`}>
                    {selection !== undefined ? (
                      <th scope="col" className="w-10 p-2">
                        <SelectAllCheckbox
                          checked={allPageSelected}
                          indeterminate={somePageSelected}
                          onChange={() => actions.togglePage(pageIds)}
                          controlId={`${idPrefix}-select-page`}
                          label={selectAllLabel}
                        />
                      </th>
                    ) : null}
                    {visibleColumns.map((col) => {
                      const sortable = col.sortValue !== undefined
                      const isActive = state.sortKey === col.key
                      const ariaSort = !sortable ? undefined : isActive ? (state.sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
                      const alignClass = col.align === 'end' ? 'text-right' : 'text-left'
                      return (
                        <th
                          key={col.key}
                          scope="col"
                          aria-sort={ariaSort}
                          className={`p-2 font-medium ${textColor('ink')} ${alignClass} ${tableCellClass(col.hideBelow)}`}
                        >
                          {sortable ? (
                            <button
                              type="button"
                              data-control-id={`${idPrefix}-sort-${col.key}`}
                              onClick={() => actions.setSort(col.key)}
                              className="inline-flex items-center gap-1 hover:underline"
                            >
                              {col.header}
                              <span aria-hidden="true">{isActive ? (state.sortDir === 'asc' ? '↑' : '↓') : ''}</span>
                            </button>
                          ) : (
                            col.header
                          )}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {virtualize && topSpacerPx > 0 ? (
                    <tr aria-hidden="true" style={{ height: topSpacerPx }}>
                      <td colSpan={colSpan} style={{ padding: 0, border: 'none' }} />
                    </tr>
                  ) : null}
                  {windowedRows.map((row) => {
                    const id = rowId(row)
                    return (
                      <tr key={id} className={`h-11 border-b ${borderColor('border')}`}>
                        {selection !== undefined ? (
                          <td className="p-2">
                            <input
                              type="checkbox"
                              checked={state.selected.has(id)}
                              onChange={() => actions.toggleRow(id)}
                              aria-label={`Select row ${id}`}
                              data-control-id={`${idPrefix}-select-${id}`}
                              className="h-4 w-4"
                            />
                          </td>
                        ) : null}
                        {visibleColumns.map((col, colIndex) => {
                          const alignClass = col.align === 'end' ? 'text-right' : 'text-left'
                          const content = col.render(row)
                          return (
                            <td
                              key={col.key}
                              className={`p-2 ${textColor('ink')} ${alignClass} ${tableCellClass(col.hideBelow)}`}
                            >
                              {colIndex === 0 ? firstCell(row, content) : content}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                  {virtualize && bottomSpacerPx > 0 ? (
                    <tr aria-hidden="true" style={{ height: bottomSpacerPx }}>
                      <td colSpan={colSpan} style={{ padding: 0, border: 'none' }} />
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          {/* Below md: the same data and the same links, as a card list. */}
          <ul className="flex flex-col gap-3 md:hidden">
            {pageRows.map((row) => {
              const id = rowId(row)
              return (
                <li key={id} className={`${radiusClass('lg')} border ${borderColor('border')} ${bg('raised')} p-3`}>
                  <div className="flex items-start justify-between gap-2">
                    {selection !== undefined ? (
                      <input
                        type="checkbox"
                        checked={state.selected.has(id)}
                        onChange={() => actions.toggleRow(id)}
                        aria-label={`Select row ${id}`}
                        data-control-id={`${idPrefix}-select-${id}`}
                        className="mt-1 h-4 w-4"
                      />
                    ) : null}
                    <dl className="flex-1 space-y-1">
                      {cardColumns.map((col, colIndex) => (
                        <div key={col.key} className="flex items-baseline justify-between gap-3">
                          <dt className={`text-xs font-medium ${textColor('ink-muted')}`}>{col.header}</dt>
                          <dd className={`text-sm ${textColor('ink')}`}>
                            {colIndex === 0 ? firstCell(row, col.render(row)) : col.render(row)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </li>
              )
            })}
          </ul>

          <Pagination idPrefix={idPrefix} page={pageIndex} pageSize={pageSize} total={filteredTotal} onPageChange={actions.setPage} />
        </>
      )}
    </div>
  )
}
