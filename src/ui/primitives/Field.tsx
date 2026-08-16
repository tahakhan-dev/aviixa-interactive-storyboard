'use client'

import { cloneElement, useId, type ReactElement } from 'react'

/**
 * Generates an id for the child input when it has none, associates `label`
 * via `htmlFor`, and joins `description` and `error` ids into the input's
 * `aria-describedby` (shared primitive contract, rule 1 — every input needs
 * an accessible name). `error` also sets `aria-invalid`.
 *
 * States: default, with description, with error (`aria-invalid`), required.
 */
export interface FieldProps {
  label: string
  description?: string
  error?: string
  required?: boolean
  children: ReactElement
}

interface ChildProps {
  id?: string
  'aria-describedby'?: string
}

export function Field({ label, description, error, required = false, children }: FieldProps) {
  const generatedId = useId()
  const descId = useId()
  const errId = useId()

  const childProps = children.props as ChildProps
  const inputId = childProps.id ?? generatedId

  const describedBy = [
    description !== undefined ? descId : null,
    error !== undefined ? errId : null,
    childProps['aria-describedby'] ?? null,
  ].filter((part): part is string => part !== null)

  const child = cloneElement(children, {
    id: inputId,
    'aria-describedby': describedBy.length > 0 ? describedBy.join(' ') : undefined,
    'aria-invalid': error !== undefined ? 'true' : undefined,
    'aria-required': required ? 'true' : undefined,
  } as Record<string, unknown>)

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-sm font-medium text-[var(--color-ink)]">
        {label}
        {required ? ' *' : ''}
      </label>
      {child}
      {description !== undefined ? (
        <p id={descId} className="text-xs text-[var(--color-ink-muted)]">
          {description}
        </p>
      ) : null}
      {error !== undefined ? (
        <p id={errId} className="text-xs text-[var(--color-status-blocked)]">
          {error}
        </p>
      ) : null}
    </div>
  )
}
