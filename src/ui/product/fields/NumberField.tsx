'use client'

import { FieldShell, describedByFor, useFieldBinding } from '../Form'
import { bg, borderColor, radiusClass, textColor } from '../tokens'

export interface NumberFieldProps {
  readonly name: string
  readonly label: string
  readonly hint?: string | undefined
  readonly required?: boolean | undefined
  readonly value?: number | undefined
  readonly onChange?: ((next: number | undefined) => void) | undefined
  readonly error?: string | undefined
}

/**
 * Deliberately carries NO hand-written range/sign check of its own — e.g.
 * no `if (next < 0)`. `<input type="number">` gives numeric-keypad affordance
 * for free (ladder rung 4) but a browser does not refuse a typed "-1" just
 * because no `min` is set, and this component sets none: whether a value is
 * acceptable is `schema.safeParse`'s question alone (`Form.tsx`'s own single
 * most important property), never a second, possibly-disagreeing copy of
 * that rule living here.
 */
export function NumberField({ name, label, hint, required, value, onChange, error }: NumberFieldProps) {
  const bound = useFieldBinding<number | undefined>(name, value, onChange, error)
  const invalid = bound.error !== undefined
  return (
    <FieldShell label={label} controlId={bound.controlId} hint={hint} error={bound.error} required={required}>
      <input
        id={bound.controlId}
        name={name}
        type="number"
        value={bound.value ?? ''}
        required={required}
        onChange={(e) => {
          const raw = e.target.valueAsNumber
          bound.onChange(Number.isNaN(raw) ? undefined : raw)
        }}
        aria-describedby={describedByFor(bound.controlId, hint !== undefined, invalid)}
        aria-invalid={invalid ? 'true' : undefined}
        data-control-id={bound.controlId}
        className={`${radiusClass('md')} border ${invalid ? 'border-[var(--status-danger)]' : borderColor('border-strong')} ${bg('surface')} px-3 py-2 text-sm ${textColor('ink')}`}
      />
    </FieldShell>
  )
}
