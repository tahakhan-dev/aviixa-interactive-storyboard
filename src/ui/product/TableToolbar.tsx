'use client'

import { useId } from 'react'
import { bg, borderColor, controlMinClass, radiusClass, textColor } from './tokens'
import type { FilterDef } from './DataTable'

/**
 * Search box, one native `<select>` per `FilterDef`, and a column-visibility
 * disclosure — nothing here owns state, it only reads `useTableState`'s
 * current values and dispatches through the actions it's given, so this and
 * `DataTable` read the exact same reducer rather than each keeping a copy.
 *
 * Built directly on `src/ui/product/tokens.ts` rather than the existing
 * `Field`/`Select` primitives — both are on the fixed-light `--color-*`
 * layer (Task 9's own inventory of primitives that are illegible in dark
 * mode under the new shell), and wrapping them in a compensating style here
 * would leave that bug in place for whoever reuses this toolbar next.
 * Native `<input>`/`<select>` supply full keyboard operability for free
 * (ladder rung 4); only the token classes are new.
 */
export interface TableToolbarProps<T> {
  readonly idPrefix: string
  readonly search: { readonly placeholder: string } | undefined
  readonly searchValue: string
  readonly onSearchChange: (value: string) => void
  readonly filters: readonly FilterDef<T>[] | undefined
  readonly filterValues: Readonly<Record<string, string>>
  readonly onFilterChange: (key: string, value: string) => void
  readonly columns: readonly { readonly key: string; readonly header: string }[]
  readonly hiddenColumns: ReadonlySet<string>
  readonly onToggleColumn: (key: string) => void
}

export function TableToolbar<T>({
  idPrefix,
  search,
  searchValue,
  onSearchChange,
  filters,
  filterValues,
  onFilterChange,
  columns,
  hiddenColumns,
  onToggleColumn,
}: TableToolbarProps<T>) {
  const searchId = useId()

  return (
    <div className="flex flex-wrap items-end gap-3">
      {search !== undefined ? (
        <div className="flex flex-col gap-1">
          <label htmlFor={searchId} className={`text-xs font-medium ${textColor('ink-muted')}`}>
            Search
          </label>
          <input
            id={searchId}
            type="search"
            value={searchValue}
            placeholder={search.placeholder}
            onChange={(e) => onSearchChange(e.target.value)}
            data-control-id={`${idPrefix}-search`}
            className={`${radiusClass('md')} border ${borderColor('border-strong')} ${bg('surface')} ${textColor('ink')} px-3 py-1.5 text-sm ${controlMinClass('comfortable')}`}
          />
        </div>
      ) : null}

      {(filters ?? []).map((filter) => {
        const filterId = `${idPrefix}-filter-${filter.key}`
        return (
          <div key={filter.key} className="flex flex-col gap-1">
            <label htmlFor={filterId} className={`text-xs font-medium ${textColor('ink-muted')}`}>
              {filter.label}
            </label>
            <select
              id={filterId}
              value={filterValues[filter.key] ?? ''}
              onChange={(e) => onFilterChange(filter.key, e.target.value)}
              data-control-id={filterId}
              className={`${radiusClass('md')} border ${borderColor('border-strong')} ${bg('surface')} ${textColor('ink')} px-3 py-1.5 text-sm ${controlMinClass('comfortable')}`}
            >
              <option value="">All</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )
      })}

      <details className="ml-auto">
        <summary
          data-control-id={`${idPrefix}-columns`}
          className={`cursor-pointer ${radiusClass('md')} border ${borderColor('border-strong')} ${bg('surface')} ${textColor('ink')} px-3 py-1.5 text-sm ${controlMinClass('comfortable')}`}
        >
          Columns
        </summary>
        <div
          className={`mt-2 flex flex-col gap-1 ${radiusClass('md')} border ${borderColor('border')} ${bg('raised')} p-2`}
        >
          {columns.map((col) => {
            const checkboxId = `${idPrefix}-column-${col.key}`
            return (
              <label key={col.key} htmlFor={checkboxId} className={`flex items-center gap-2 text-sm ${textColor('ink')}`}>
                <input
                  id={checkboxId}
                  type="checkbox"
                  checked={!hiddenColumns.has(col.key)}
                  onChange={() => onToggleColumn(col.key)}
                  data-control-id={checkboxId}
                  className="h-4 w-4"
                />
                {col.header}
              </label>
            )
          })}
        </div>
      </details>
    </div>
  )
}
