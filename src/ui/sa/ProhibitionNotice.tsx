import { Button, StatusPill } from '@/ui/primitives'

/**
 * Spec §3 — three renderings for a prohibition, applied by rule, never by
 * taste. A CLOSED UNION, so a caller cannot construct `disabled-with-reason`
 * without a `reason`: the field is required on that one arm only, and
 * TypeScript rejects the literal at compile time (see
 * `tests/component/sa-spine.test.tsx`'s `@ts-expect-error` proof). Making a
 * reasonless disabled rendering a type error, not a runtime check, is the
 * whole point — a runtime-only guard could still be bypassed by a caller
 * that never runs the code path in question.
 */
export type ProhibitionRendering =
  | {
      /** The action does not exist for anyone, including the root. */
      readonly kind: 'absent'
      /** The one-line note that sits where a control would be. */
      readonly note: string
    }
  | {
      /** Exists on this platform, but not for this role or not in this state. */
      readonly kind: 'disabled-with-reason'
      readonly label: string
      readonly reason: string
    }
  | {
      /** A critical-class action, seen by a non-root role: no control can
       *  be mistaken for an approval path. Replaces the whole action bar. */
      readonly kind: 'class-badge'
      /** Defaults to the canonical text (L23707) if not supplied. */
      readonly label?: string
    }

export interface ProhibitionNoticeProps {
  readonly rendering: ProhibitionRendering
}

const DEFAULT_CLASS_BADGE_LABEL = 'Critical class — root approval required'

export function ProhibitionNotice({ rendering }: ProhibitionNoticeProps) {
  switch (rendering.kind) {
    case 'absent':
      // Nothing drawn that could be mistaken for a control — a plain note.
      return <p role="note">{rendering.note}</p>

    case 'disabled-with-reason':
      // Reuses `Button`'s own disabled treatment (`aria-disabled`, the
      // reason rendered as visible text via `aria-describedby`) rather than
      // hand-rolling a second inert-control pattern.
      return <Button disabledReason={rendering.reason}>{rendering.label}</Button>

    case 'class-badge':
      // A status chip, not a control — the same structural move as
      // `InvariantChip`: no `<button>`, no `tabindex`, no tooltip implying
      // an approval path is reachable from here.
      return (
        <StatusPill tone="blocked" icon="🔒" label={rendering.label ?? DEFAULT_CLASS_BADGE_LABEL} />
      )

    default: {
      const exhaustive: never = rendering
      throw new Error(`Unhandled prohibition rendering: ${JSON.stringify(exhaustive)}`)
    }
  }
}
