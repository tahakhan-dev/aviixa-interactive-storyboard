'use client'

import { FieldShell, describedByFor, useFieldBinding } from '../Form'
import { bg, borderColor, radiusClass, textColor } from '../tokens'

export interface SelectFieldOption {
  readonly value: string
  readonly label: string
}

export interface SelectFieldProps {
  readonly name: string
  readonly label: string
  readonly options: readonly SelectFieldOption[]
  readonly hint?: string | undefined
  readonly required?: boolean | undefined
  readonly placeholder?: string | undefined
  readonly value?: string | undefined
  readonly onChange?: ((next: string) => void) | undefined
  readonly error?: string | undefined
}

export function SelectField({
  name,
  label,
  options,
  hint,
  required,
  placeholder,
  value,
  onChange,
  error,
}: SelectFieldProps) {
  const bound = useFieldBinding<string>(name, value, onChange, error)
  const invalid = bound.error !== undefined
  return (
    <FieldShell label={label} controlId={bound.controlId} hint={hint} error={bound.error} required={required}>
      {/* DEBT D6 (task-11 brief: "six primitives measured as not
          theme-aware ... Select is exactly what a form layer would reach
          for. Do not reach for them"): this native `<select>` duplicates
          `src/ui/primitives/Select.tsx`'s job on the token layer instead.
          Reconcile with that primitive once its own migration lands. */}
      <select
        id={bound.controlId}
        name={name}
        value={bound.value ?? ''}
        required={required}
        onChange={(e) => bound.onChange(e.target.value)}
        aria-describedby={describedByFor(bound.controlId, hint !== undefined, invalid)}
        aria-invalid={invalid ? 'true' : undefined}
        data-control-id={bound.controlId}
        className={`${radiusClass('md')} border ${invalid ? 'border-[var(--status-danger)]' : borderColor('border-strong')} ${bg('surface')} px-3 py-2 text-sm ${textColor('ink')}`}
      >
        {placeholder !== undefined ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}
