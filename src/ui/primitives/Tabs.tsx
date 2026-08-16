'use client'

import type { KeyboardEvent } from 'react'

/**
 * `role="tablist"` with `role="tab"` children, roving `tabIndex`, and
 * ArrowLeft/ArrowRight/Home/End navigation. Controlled: `activeId` and
 * `onChange` are owned by the caller, so both keyboard navigation and click
 * report through the same callback.
 *
 * States: default (inactive tab), selected (`aria-selected="true"`), focus.
 */
export interface TabItem {
  id: string
  label: string
}

export interface TabsProps {
  tabs: readonly TabItem[]
  activeId: string
  onChange: (id: string) => void
}

export function Tabs({ tabs, activeId, onChange }: TabsProps) {
  function moveFrom(id: string, delta: number) {
    const idx = tabs.findIndex((t) => t.id === id)
    if (idx === -1) return
    const next = tabs[(idx + delta + tabs.length) % tabs.length]
    if (next) onChange(next.id)
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, id: string) {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      moveFrom(id, 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      moveFrom(id, -1)
    } else if (e.key === 'Home') {
      e.preventDefault()
      const first = tabs[0]
      if (first) onChange(first.id)
    } else if (e.key === 'End') {
      e.preventDefault()
      const last = tabs[tabs.length - 1]
      if (last) onChange(last.id)
    }
  }

  return (
    <div role="tablist" className="flex gap-1 border-b border-[var(--color-border)]">
      {tabs.map((tab) => {
        const selected = tab.id === activeId
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => onKeyDown(e, tab.id)}
            className={`px-3 py-2 text-sm font-medium ${
              selected
                ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'text-[var(--color-ink-muted)]'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
