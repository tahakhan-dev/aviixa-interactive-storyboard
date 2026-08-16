'use client'

import { useId } from 'react'

/**
 * A native `<select>` — keyboard operability (arrow keys, typeahead) and
 * accessible-name association come from the platform for free (ladder rung
 * 4: native feature over a picker library).
 *
 * States: default, focus, disabled — all native.
 */
export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps {
  label: string
  options: readonly SelectOption[]
  value: string
  onChange: (value: string) => void
}

export function Select({ label, options, value, onChange }: SelectProps) {
  const id = useId()
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-[var(--color-ink)]">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-2 text-sm text-[var(--color-ink)]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
