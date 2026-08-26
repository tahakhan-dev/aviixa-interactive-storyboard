'use client'

import { FieldShell, describedByFor, useFieldBinding } from '../Form'
import { bg, borderColor, radiusClass, textColor } from '../tokens'

export interface TextFieldProps {
  readonly name: string
  readonly label: string
  readonly hint?: string | undefined
  readonly required?: boolean | undefined
  readonly placeholder?: string | undefined
  /** Standalone mode (e.g. a `Wizard` step managing its own state). Omit to
   *  read/write through the ambient `Form` context by `name` instead. */
  readonly value?: string | undefined
  readonly onChange?: ((next: string) => void) | undefined
  readonly error?: string | undefined
}

export function TextField({ name, label, hint, required, placeholder, value, onChange, error }: TextFieldProps) {
  const bound = useFieldBinding<string>(name, value, onChange, error)
  const invalid = bound.error !== undefined
  return (
    <FieldShell label={label} controlId={bound.controlId} hint={hint} error={bound.error} required={required}>
      <input
        id={bound.controlId}
        name={name}
        type="text"
        value={bound.value ?? ''}
        placeholder={placeholder}
        required={required}
        onChange={(e) => bound.onChange(e.target.value)}
        aria-describedby={describedByFor(bound.controlId, hint !== undefined, invalid)}
        aria-invalid={invalid ? 'true' : undefined}
        data-control-id={bound.controlId}
        className={`${radiusClass('md')} border ${invalid ? 'border-[var(--status-danger)]' : borderColor('border-strong')} ${bg('surface')} px-3 py-2 text-sm ${textColor('ink')}`}
      />
    </FieldShell>
  )
}
