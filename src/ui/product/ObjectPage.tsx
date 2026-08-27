'use client'

import type { KeyboardEvent, ReactNode } from 'react'
import type { BreadcrumbItem } from '@/ui/primitives'
import { PageHeader } from './PageHeader'
import { borderColor, textColor } from './tokens'

/**
 * Task 12 — the detail-page shell every object screen across the five
 * surfaces builds on: header + status + tab set + actions slot (task
 * brief). Composed from `PageHeader` (Task 9, already token-built) for the
 * breadcrumb/title/actions row; `status` and `freshness` are plain slots so
 * a caller renders its own `StatusPill`/`FreshnessStamp` without this
 * component needing to know either type.
 *
 * THE TAB BAR IS HAND-ROLLED ON TOKENS, NOT `src/ui/primitives/Tabs.tsx`.
 * That primitive is one of the seven non-theme-aware primitives Task 9's
 * inventory measured (2.47-2.79:1, debt D6, "owned by tasks 10-13") and
 * `src/ui/product/**` may only reference `tokens.ts` (`DataTable.tsx`'s own
 * header states this rule and applies it to the same primitive). The
 * roving-tabindex/arrow-key-navigation behaviour below is the same contract
 * `Tabs.tsx` implements — reused as a pattern, not as an import, since the
 * only thing wrong with `Tabs.tsx` is its colours, not its logic.
 *
 * DEBT D6 (progress.md, "Debts D6-D8 recorded with owners"): a third
 * token-built duplicate of `Tabs.tsx`'s ARIA tablist logic, alongside
 * whichever future task migrates it.
 *
 * Only the ACTIVE tab's content is rendered (unlike `Wizard`, which keeps
 * every step mounted to preserve in-progress field state across Back/Next).
 * An object page's tabs are independent read-mostly sections, not a
 * multi-step form with state to lose, so there is nothing here worth the
 * extra cost of keeping every tab's content mounted at once.
 */
export interface ObjectPageTab {
  readonly id: string
  readonly label: string
  readonly content: ReactNode
}

export interface ObjectPageProps {
  readonly breadcrumbs: readonly BreadcrumbItem[]
  readonly title: string
  readonly status?: ReactNode
  readonly freshness?: ReactNode
  readonly actions?: ReactNode
  readonly tabs: readonly ObjectPageTab[]
  readonly activeTabId: string
  readonly onTabChange: (id: string) => void
}

export function ObjectPage({
  breadcrumbs,
  title,
  status,
  freshness,
  actions,
  tabs,
  activeTabId,
  onTabChange,
}: ObjectPageProps) {
  const active = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0]

  function moveFrom(id: string, delta: number): void {
    const idx = tabs.findIndex((tab) => tab.id === id)
    if (idx === -1) return
    const next = tabs[(idx + delta + tabs.length) % tabs.length]
    if (next) onTabChange(next.id)
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, id: string): void {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      moveFrom(id, 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      moveFrom(id, -1)
    } else if (e.key === 'Home') {
      e.preventDefault()
      const first = tabs[0]
      if (first) onTabChange(first.id)
    } else if (e.key === 'End') {
      e.preventDefault()
      const last = tabs[tabs.length - 1]
      if (last) onTabChange(last.id)
    }
  }

  return (
    <div>
      <PageHeader breadcrumbs={breadcrumbs} title={title} {...(actions !== undefined ? { actions } : {})} />

      {status !== undefined || freshness !== undefined ? (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {status}
          {freshness}
        </div>
      ) : null}

      <div role="tablist" aria-label={`${title} sections`} className={`mt-4 flex gap-1 border-b ${borderColor('border')}`}>
        {tabs.map((tab) => {
          const selected = tab.id === active?.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              data-control-id={`object-page-tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(e) => onKeyDown(e, tab.id)}
              className={`px-3 py-2 text-sm font-medium ${
                selected ? `border-b-2 ${borderColor('accent')} ${textColor('ink')}` : textColor('ink-muted')
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="mt-4">{active?.content}</div>
    </div>
  )
}
