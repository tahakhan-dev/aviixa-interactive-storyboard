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
  | { type: 'SET_FILTER'; key: string; value: string }
  | { type: 'SET_SEARCH'; value: string }
  | { type: 'SET_PAGE'; page: number }
  | { type: 'TOGGLE_ROW'; id: string }
  | { type: 'TOGGLE_PAGE'; ids: readonly string[] }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'TOGGLE_COLUMN'; key: string }

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
      return { ...state, filters: { ...state.filters, [action.key]: action.value }, page: 0 }
    case 'SET_SEARCH':
      return { ...state, search: action.value, page: 0 }
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
  setFilter(key: string, value: string): void
  setSearch(value: string): void
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
      setFilter: (key, value) => dispatch({ type: 'SET_FILTER', key, value }),
      setSearch: (value) => dispatch({ type: 'SET_SEARCH', value }),
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
