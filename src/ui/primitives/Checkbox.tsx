'use client'

import { useId } from 'react'

/**
 * A native checkbox input — space-to-toggle keyboard operability comes from
 * the platform for free.
 *
 * States: default, checked, focus, disabled — all native.
 */
export interface CheckboxProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function Checkbox({ label, checked, onChange }: CheckboxProps) {
  const id = useId()
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-[var(--color-border-strong)]"
      />
      <label htmlFor={id} className="text-sm text-[var(--color-ink)]">
        {label}
      </label>
    </div>
  )
}
