'use client'

import { FieldShell, describedByFor, useFieldBinding } from '../Form'
import { bg, borderColor, radiusClass, textColor } from '../tokens'

export interface DateFieldProps {
  readonly name: string
  readonly label: string
  readonly hint?: string | undefined
  readonly required?: boolean | undefined
  /** An ISO-8601 stamp with an explicit offset (`@/data/schemas/platform#Stamp`),
   *  same as the value on the wire — see `toStamp`/`fromStamp` below for the
   *  one place this differs from the native `<input type="date">` value. */
  readonly value?: string | undefined
  readonly onChange?: ((next: string) => void) | undefined
  readonly error?: string | undefined
}

/** `<input type="date">`'s own value is always bare `YYYY-MM-DD` — never a
 *  `Stamp`, which requires an explicit time and offset. Converting at the
 *  edges (midnight UTC in, the date slice out) is what lets this field
 *  target a `Stamp` column and still pass `schema.safeParse`; leaving the
 *  bare date on the wire instead would make every valid pick fail the
 *  regex, which is a schema disagreement this component exists to avoid,
 *  not demonstrate. */
function toStamp(dateOnly: string): string {
  return dateOnly === '' ? '' : `${dateOnly}T00:00:00Z`
}
function fromStamp(stamp: string): string {
  return stamp.slice(0, 10)
}

export function DateField({ name, label, hint, required, value, onChange, error }: DateFieldProps) {
  const bound = useFieldBinding<string>(name, value, onChange, error)
  const invalid = bound.error !== undefined
  return (
    <FieldShell label={label} controlId={bound.controlId} hint={hint} error={bound.error} required={required}>
      <input
        id={bound.controlId}
        name={name}
        type="date"
        value={bound.value !== undefined ? fromStamp(bound.value) : ''}
        required={required}
        onChange={(e) => bound.onChange(toStamp(e.target.value))}
        aria-describedby={describedByFor(bound.controlId, hint !== undefined, invalid)}
        aria-invalid={invalid ? 'true' : undefined}
        data-control-id={bound.controlId}
        className={`${radiusClass('md')} border ${invalid ? 'border-[var(--status-danger)]' : borderColor('border-strong')} ${bg('surface')} px-3 py-2 text-sm ${textColor('ink')}`}
      />
    </FieldShell>
  )
}
