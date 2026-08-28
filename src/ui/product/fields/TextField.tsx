'use client'

import { FieldShell, describedByFor, useFieldBinding } from '../Form'
import { bg, borderColor, radiusClass, textColor } from '../tokens'

export interface TextFieldProps {
  readonly name: string
  readonly label: string
  readonly hint?: string | undefined
  readonly required?: boolean | undefined
  readonly placeholder?: string | undefined
  /**
   * Task 2 (unit-01) addition: defaults to `'text'`, unchanged for every
   * existing caller. Sign-in needs `'email'`/`'password'` — a plain,
   * additive, backward-compatible widening rather than a second field
   * component duplicating `FieldShell`'s label/hint/error wiring for two
   * more input types that are otherwise identical single-line text.
   */
  readonly type?: 'text' | 'email' | 'password' | undefined
  /** Task 2 addition, same reasoning as `type` above. */
  readonly autoComplete?: string | undefined
  /** Task 2 addition: blur is when this screen's inline validation runs. */
  readonly onBlur?: (() => void) | undefined
  /** Standalone mode (e.g. a `Wizard` step managing its own state). Omit to
   *  read/write through the ambient `Form` context by `name` instead. */
  readonly value?: string | undefined
  readonly onChange?: ((next: string) => void) | undefined
  readonly error?: string | undefined
}

export function TextField({
  name,
  label,
  hint,
  required,
  placeholder,
  type = 'text',
  autoComplete,
  onBlur,
  value,
  onChange,
  error,
}: TextFieldProps) {
  const bound = useFieldBinding<string>(name, value, onChange, error)
  const invalid = bound.error !== undefined
  return (
    <FieldShell label={label} controlId={bound.controlId} hint={hint} error={bound.error} required={required}>
      <input
        id={bound.controlId}
        name={name}
        type={type}
        value={bound.value ?? ''}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        onChange={(e) => bound.onChange(e.target.value)}
        onBlur={onBlur}
        aria-describedby={describedByFor(bound.controlId, hint !== undefined, invalid)}
        aria-invalid={invalid ? 'true' : undefined}
        data-control-id={bound.controlId}
        className={`${radiusClass('md')} border ${invalid ? 'border-[var(--status-danger)]' : borderColor('border-strong')} ${bg('surface')} px-3 py-2 text-sm ${textColor('ink')}`}
      />
    </FieldShell>
  )
}
