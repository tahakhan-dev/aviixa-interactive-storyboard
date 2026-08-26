'use client'

import { useMemo, useReducer } from 'react'

/**
 * `DataTable`'s single source of truth. Sort, per-column filter values,
 * search text, page index, cross-page selection and column visibility live
 * in ONE reducer so `TableToolbar` (which only dispatches) and `DataTable`
 * (which only reads) can never disagree about what the current view is —
 * two components each holding a copy of "what's the sort column right now"
 * is the defect the brief calls out, not a convenience split.
 *
 * `selected` deliberately survives a page change: selecting page 1's rows,
 * paging to page 2 and selecting more is a real multi-page bulk action, and
 * the header checkbox toggles only ITS OWN page's ids (`TOGGLE_PAGE` is
 * given the exact id list to flip) — never the whole accumulated set.
 *
 * `selected` does NOT survive a filter/search change unreconciled. Fix
 * round 1 (review): selecting rows, then narrowing the filter, left the
 * bulk bar reporting a stale count that included ids no longer in the
 * filtered result at all — a bulk action would have fired against rows the
 * user could no longer see. `SET_FILTER`/`SET_SEARCH` now take the exact id
 * list the NEW filter/search produces (computed by `DataTable`, the only
 * place that holds the row data) and intersect `selected` against it in the
 * SAME dispatch that changes the filter/search — one state transition, no
 * intermediate render where the count is briefly wrong. Kept, not dropped:
 * the intersection preserves what's still valid rather than discarding the
 * whole selection on every filter tweak, and because the reconciliation
 * mutates the real `selected` set (not a display-only filter), the bulk
 * bar's count is never a second, unreconciled number — it just reads
 * `selected.size` as always.
 */
export interface TableState {
  readonly sortKey: string | null
  readonly sortDir: 'asc' | 'desc'
  readonly filters: Readonly<Record<string, string>>
  readonly search: string
  readonly page: number
  readonly selected: ReadonlySet<string>
  readonly hiddenColumns: ReadonlySet<string>
}

type Action =
  | { type: 'SET_SORT'; key: string }
  | { type: 'SET_FILTER'; key: string; value: string; validIds: readonly string[] }
  | { type: 'SET_SEARCH'; value: string; validIds: readonly string[] }
  | { type: 'SET_PAGE'; page: number }
  | { type: 'TOGGLE_ROW'; id: string }
  | { type: 'TOGGLE_PAGE'; ids: readonly string[] }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'TOGGLE_COLUMN'; key: string }

/** Keeps only ids still present in the new filter/search result — never a
 *  no-op copy when nothing actually changed, so an unaffected dispatch
 *  doesn't create a new `Set` reference for no reason. */
function reconcileSelected(selected: ReadonlySet<string>, validIds: readonly string[]): ReadonlySet<string> {
  const validSet = new Set(validIds)
  const next = new Set([...selected].filter((id) => validSet.has(id)))
  return next.size === selected.size ? selected : next
}

function reducer(state: TableState, action: Action): TableState {
  switch (action.type) {
    case 'SET_SORT': {
      const sameColumn = state.sortKey === action.key
      return {
        ...state,
        sortKey: action.key,
        sortDir: sameColumn && state.sortDir === 'asc' ? 'desc' : 'asc',
        page: 0,
      }
    }
    case 'SET_FILTER':
      return {
        ...state,
        filters: { ...state.filters, [action.key]: action.value },
        page: 0,
        selected: reconcileSelected(state.selected, action.validIds),
      }
    case 'SET_SEARCH':
      return {
        ...state,
        search: action.value,
        page: 0,
        selected: reconcileSelected(state.selected, action.validIds),
      }
    case 'SET_PAGE':
      return { ...state, page: action.page }
    case 'TOGGLE_ROW': {
      const next = new Set(state.selected)
      if (next.has(action.id)) next.delete(action.id)
      else next.add(action.id)
      return { ...state, selected: next }
    }
    case 'TOGGLE_PAGE': {
      const next = new Set(state.selected)
      const allSelected = action.ids.length > 0 && action.ids.every((id) => next.has(id))
      for (const id of action.ids) {
        if (allSelected) next.delete(id)
        else next.add(id)
      }
      return { ...state, selected: next }
    }
    case 'CLEAR_SELECTION':
      return { ...state, selected: new Set() }
    case 'TOGGLE_COLUMN': {
      const next = new Set(state.hiddenColumns)
      if (next.has(action.key)) next.delete(action.key)
      else next.add(action.key)
      return { ...state, hiddenColumns: next }
    }
    default:
      return state
  }
}

export interface TableActions {
  setSort(key: string): void
  /** `validIds`: the row ids the NEW filter set will match — used to reconcile `selected` atomically. */
  setFilter(key: string, value: string, validIds: readonly string[]): void
  /** `validIds`: the row ids the NEW search text will match — used to reconcile `selected` atomically. */
  setSearch(value: string, validIds: readonly string[]): void
  setPage(page: number): void
  toggleRow(id: string): void
  togglePage(ids: readonly string[]): void
  clearSelection(): void
  toggleColumn(key: string): void
}

/** `defaultHiddenKeys` seeds `hiddenColumns` once, from each column's own `defaultHidden`. */
export function useTableState(defaultHiddenKeys: readonly string[]): readonly [TableState, TableActions] {
  const [state, dispatch] = useReducer(reducer, defaultHiddenKeys, (keys): TableState => ({
    sortKey: null,
    sortDir: 'asc',
    filters: {},
    search: '',
    page: 0,
    selected: new Set(),
    hiddenColumns: new Set(keys),
  }))

  const actions = useMemo<TableActions>(
    () => ({
      setSort: (key) => dispatch({ type: 'SET_SORT', key }),
      setFilter: (key, value, validIds) => dispatch({ type: 'SET_FILTER', key, value, validIds }),
      setSearch: (value, validIds) => dispatch({ type: 'SET_SEARCH', value, validIds }),
      setPage: (page) => dispatch({ type: 'SET_PAGE', page }),
      toggleRow: (id) => dispatch({ type: 'TOGGLE_ROW', id }),
      togglePage: (ids) => dispatch({ type: 'TOGGLE_PAGE', ids }),
      clearSelection: () => dispatch({ type: 'CLEAR_SELECTION' }),
      toggleColumn: (key) => dispatch({ type: 'TOGGLE_COLUMN', key }),
    }),
    [],
  )

  return [state, actions] as const
}
