import { StatusPill, type StatusTone } from '@/ui/primitives'
import { COMMAND_STATE_TONE } from '@/ui/ScreenStateBoundary'
import type { CommandState } from '@/surfaces/sa/command-state'

/**
 * The fifteen device command states (`@/surfaces/sa/command-state`), each
 * always shown by its own name — never collapsed, never rendered as
 * "applied"/"complete" unless that IS the true state, never "synced",
 * "sent" or "done" (those three words are forbidden as state names
 * anywhere in the product). `MOD-SA-07`, `MOD-SA-09` and `MOD-SA-13`
 * consume this component wherever a command's state needs a badge outside
 * `ScreenStateBoundary`'s STATE-09 (Queued) boundary, which only ever
 * renders NON-terminal states — this badge renders any of the fifteen,
 * terminal included, since a device fleet or approval history legitimately
 * shows a command that has already concluded.
 *
 * Tone comes from `COMMAND_STATE_TONE`, exported by `ScreenStateBoundary`
 * itself, so this badge and STATE-09's rendering can never quietly
 * disagree on what tone a given command state gets.
 */
const ICON_BY_TONE: Record<StatusTone, string> = {
  ok: '✓',
  info: '●',
  neutral: '○',
  blocked: '✕',
  stale: '↺',
  attention: '⚠',
}

export interface CommandStateBadgeProps {
  readonly state: CommandState
}

export function CommandStateBadge({ state }: CommandStateBadgeProps) {
  const tone = COMMAND_STATE_TONE[state]
  return <StatusPill tone={tone} icon={ICON_BY_TONE[tone]} label={state} />
}
