import type { ReactNode } from 'react'
import { screenState, type ScreenStateId } from '@/ui/screen-state'
import type { SurfaceId } from '@/domain/surfaces'
import type { PermissionDecision } from '@/policy/decision'
import {
  EmptyState,
  SkeletonBlock,
  Banner,
  PermissionNotice,
  FreshnessLabel,
  StatusPill,
  type StatusTone,
} from '@/ui/primitives'

/**
 * Frozen source §25 (L48014): "Rather than writing the same thirteen
 * paragraphs seventy-nine times, this section writes them once as a
 * contract every screen must honour, and then each screen only has to
 * record where it differs." This component IS that written-once contract —
 * the default treatment for each of the thirteen states in `@/ui/screen-state`,
 * so the 81 module screens in later slices need only pass a `detail` where
 * their content differs from the default.
 *
 * `children` renders ONLY for STATE-03 (Success). Every other state ignores
 * `children` and renders its own default treatment instead — a screen that
 * is not in the success state must never leak stale success markup.
 */

/**
 * STATE-09: the fifteen canonical command states (frozen source, L1632).
 * Never collapsed, never rendered as "applied" or "complete" unless that IS
 * the true state, and never named "synced", "sent" or "done" — those three
 * words are forbidden as state names anywhere in the product.
 */
export type CommandState =
  | 'created'
  | 'authorized'
  | 'queued'
  | 'available for delivery'
  | 'delivered'
  | 'downloaded'
  | 'validated'
  | 'applied'
  | 'acknowledged'
  | 'rejected'
  | 'failed'
  | 'expired'
  | 'cancelled'
  | 'superseded'
  | 'reconciled'

/**
 * BLOCKING 5: STATE-09 is the QUEUED state -- an action that has NOT yet
 * taken effect, shown in its true in-flight state. A terminal command state
 * (the lifecycle has concluded, one way or another) is not "queued" in any
 * sense, so rendering one under STATE-09 is exactly the "never applied or
 * complete" violation the state's own contract forbids. This is the same
 * partition COMMAND_STATE_TONE already draws: 'ok', 'blocked' and 'stale'
 * are all concluded outcomes; 'neutral' and 'info' are still in flight.
 */
// Exported (not just module-local) so `@/surfaces/sa/command-state`'s
// `CommandStateBadge` -- used by MOD-SA-07/09/13 wherever a device command
// state needs its own badge outside the STATE-09 (Queued) boundary above,
// including terminal states this boundary itself refuses to render under
// STATE-09 -- draws tone and terminal-ness from the same one source instead
// of a second, independently-maintained copy that could quietly drift from
// this one.
export const TERMINAL_COMMAND_STATES: ReadonlySet<CommandState> = new Set([
  'applied',
  'acknowledged',
  'reconciled',
  'rejected',
  'failed',
  'expired',
  'cancelled',
  'superseded',
])

export const COMMAND_STATE_TONE: Record<CommandState, StatusTone> = {
  created: 'neutral',
  authorized: 'info',
  queued: 'info',
  'available for delivery': 'info',
  delivered: 'info',
  downloaded: 'info',
  validated: 'info',
  applied: 'ok',
  acknowledged: 'ok',
  reconciled: 'ok',
  rejected: 'blocked',
  failed: 'blocked',
  expired: 'blocked',
  cancelled: 'blocked',
  superseded: 'stale',
}

/**
 * Everything a screen may need to supply to specialise the default
 * treatment for its state. Every field is optional: the boundary renders a
 * sensible, honest default for any field a screen does not supply, so a
 * screen only records where it differs (per the contract this component
 * carries).
 */
export interface ScreenStateDetail {
  /** STATE-01, STATE-02: what the reader would call the missing/loading object. */
  objectLabel?: string
  /** STATE-01: what creates the object, in words. */
  whatCreatesIt?: string
  /** STATE-01: the creating action, where this role holds it. */
  action?: ReactNode
  /** STATE-04: the field that failed validation. */
  fieldLabel?: string
  /** STATE-04: the rule that was broken, in words. */
  rule?: string
  /** STATE-04: the permitted range or format. */
  permittedFormat?: string
  /**
   * STATE-05: the decision to explain. The boundary RECEIVES this; it never
   * computes one — no policy VALUE import lives in this file, only the
   * `PermissionDecision` TYPE (erased at compile time). Required in
   * practice: STATE-05 throws rather than render anything if this is
   * omitted, because there is no honest default for a governed denial.
   */
  decision?: PermissionDecision
  /** STATE-06: the one cause of the read-only state. */
  readOnlyCause?: string
  /** STATE-07: how long the surface has been offline. */
  offlineSince?: string
  /** STATE-07: what remains possible while offline. */
  offlineRemaining?: string
  /** STATE-08: when the content was true. */
  asOfLabel?: string
  /** STATE-08: where the content came from. */
  originLabel?: string
  /** STATE-09: the true command state — one of the fifteen canonical values. */
  commandState?: CommandState
  /** STATE-10: what AI capability is missing while degraded. */
  degradedMissing?: string
  /** STATE-10: what remains available while degraded. */
  degradedRemaining?: string
  /** STATE-11: why AI assistance is unavailable. */
  unavailableCause?: string
  /** STATE-12: what failed. */
  failureWhat?: string
  /**
   * STATE-12: whether anything was written before the failure. A reader
   * must never be left unsure, so an unstated value is itself stated as
   * unreported, never silently omitted.
   */
  wasWritten?: boolean
  /** STATE-12: the next step available to the reader. */
  nextStep?: string
  /** STATE-13: what is being replayed or recomputed, and how much remains. */
  recoveryProgress?: string
}

export interface ScreenStateBoundaryProps {
  state: ScreenStateId
  surface: SurfaceId
  detail?: ScreenStateDetail
  children?: ReactNode
}

export function ScreenStateBoundary({
  state,
  surface,
  detail,
  children,
}: ScreenStateBoundaryProps) {
  const definition = screenState(state)
  if (definition.frontlineOnly && surface !== 'SURF-FL') {
    throw new Error(
      'Only the Frontline Worker Application has a true offline state.',
    )
  }

  const objectLabel = detail?.objectLabel ?? 'this item'

  switch (state) {
    case 'STATE-01':
      return (
        <EmptyState
          title={`There are no ${objectLabel} yet.`}
          whatCreatesIt={detail?.whatCreatesIt ?? 'Nothing has created one yet.'}
          {...(detail?.action !== undefined ? { action: detail.action } : {})}
        />
      )

    case 'STATE-02':
      return <SkeletonBlock lines={3} label={`Loading ${objectLabel}…`} />

    case 'STATE-03':
      return <>{children}</>

    case 'STATE-04':
      return (
        <Banner
          tone="attention"
          heading={`${detail?.fieldLabel ?? objectLabel} is not accepted`}
          body={`${detail?.rule ?? 'A validation rule was broken.'} ${
            detail?.permittedFormat ?? 'The permitted format has not been stated for this field.'
          }`}
        />
      )

    case 'STATE-05':
      // No fabricated fallback: "the caller told us nothing" is not itself
      // a prohibition. A missing `detail.decision` here means some screen
      // tried to render Permission-denied without ever calling
      // `evaluateAccess` -- rendering ANY specific outcome (even
      // `clientDecisionRequired`) would assert a governed claim no
      // evaluator produced. This throws rather than fabricates, the same
      // way the `frontlineOnly` check above throws on a contract violation
      // instead of silently rendering something plausible-looking.
      if (detail?.decision === undefined) {
        throw new Error(
          'STATE-05 (Permission-denied) requires detail.decision from the policy evaluator. ' +
            'It was omitted -- this is a caller bug, not a permission outcome, and must not be rendered as one.',
        )
      }
      return <PermissionNotice decision={detail.decision} />

    case 'STATE-06':
      return (
        <Banner
          tone="blocked"
          heading="Read-only"
          body={detail?.readOnlyCause ?? 'Every input here is disabled, and the cause has not been named.'}
        />
      )

    case 'STATE-07':
      return (
        <div>
          <StatusPill tone="blocked" icon="📴" label="Offline" />
          <p>
            {detail?.offlineSince ?? 'Offline since an unrecorded time'} —{' '}
            {detail?.offlineRemaining ?? 'what remains possible has not been stated'}.
          </p>
        </div>
      )

    case 'STATE-08':
      return (
        <FreshnessLabel
          asOfLabel={detail?.asOfLabel ?? 'as of an earlier time'}
          originLabel={detail?.originLabel ?? 'origin not stated'}
        />
      )

    case 'STATE-09': {
      const commandState = detail?.commandState ?? 'queued'
      // Fail loudly rather than render "⏳applied" with a success tone: a
      // caller asking the Queued boundary to show a concluded command is a
      // contract violation, not a fourteenth screen state to invent a
      // rendering for -- throwing matches the `frontlineOnly` precedent
      // above and STATE-05's precedent (see BLOCKING 4) for the same kind
      // of caller mistake.
      if (TERMINAL_COMMAND_STATES.has(commandState)) {
        throw new Error(
          `STATE-09 (Queued) cannot render terminal command state "${commandState}" -- ` +
            'a concluded command is not "queued"; render the state that actually applies once the command has finished, not through the Queued boundary.',
        )
      }
      return (
        <StatusPill tone={COMMAND_STATE_TONE[commandState]} icon="⏳" label={commandState} />
      )
    }

    case 'STATE-10':
      return (
        <Banner
          tone="attention"
          heading="AI assistance degraded"
          body={`${detail?.degradedMissing ?? 'Some AI output is missing.'} ${
            detail?.degradedRemaining ?? 'Deterministic checks continue unchanged.'
          }`}
        />
      )

    case 'STATE-11':
      return (
        <Banner
          tone="blocked"
          heading="AI assistance unavailable"
          body={detail?.unavailableCause ?? 'The agent is unavailable, and no cause has been reported.'}
        />
      )

    case 'STATE-12':
      return (
        <Banner
          tone="blocked"
          heading="Failed"
          body={`${detail?.failureWhat ?? 'The action failed.'} ${
            detail?.wasWritten === undefined
              ? 'Whether anything was written has not been reported.'
              : detail.wasWritten
                ? 'Some data was written before the failure.'
                : 'Nothing was written.'
          } ${detail?.nextStep ?? 'Retry, or contact support if it happens again.'}`}
        />
      )

    case 'STATE-13':
      return (
        <Banner
          tone="info"
          heading="Recovering"
          body={
            detail?.recoveryProgress ??
            'Replaying and recomputing what was missed. How much remains has not been stated.'
          }
        />
      )

    default: {
      const exhaustive: never = state
      throw new Error(`Unhandled screen state: ${String(exhaustive)}`)
    }
  }
}
