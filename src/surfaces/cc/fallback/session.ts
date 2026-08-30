import { ccFallbackPatternById, queuesClientSide } from './patterns'

/**
 * `FB-CC-SESS` — THE FROZEN VIEWER SESSION, specified in full at §21.2.3
 * (L35485-L35570) and summarised as a pattern at L35658.
 *
 * A RULING, AND WHY IT IS NOT A SEVENTH CONNECTIVITY MODE.
 * `src/scenario/controls.ts` declares six connectivity modes — `online`,
 * `slow`, `flapping`, `offline`, `dependency-down`, `recovering` — and none
 * of them is a frozen viewer session. This file does NOT add one, and that
 * is deliberate rather than timid: `ConnectivityMode` is read by every
 * surface, so widening it is a slice-level ruling, and more importantly
 * `offline` would be the WRONG member to reuse. §21.2.3's opening states the
 * distinction the source cares most about: "Three different things can be
 * disconnected, and they are not the same thing" (L35489). The table at
 * L35541-L35549 runs those three side by side, and the Command Center
 * session column is transcribed below. `offline` on this build means a
 * device holding captures it will sync later; a frozen Command Center
 * session holds NOTHING, because the surface owns no record and has no
 * device. Putting an offline device's semantics on a browser tab is exactly
 * the conflation §21.2.3 exists to prevent.
 *
 * The state lives here instead, scoped to this surface, where the twelve
 * later module tasks read it. If the slice later rules that
 * `ConnectivityMode` should carry it, this type is what moves.
 *
 * `AC-CC-072` (L35557) — "On session transport loss, the surface freezes
 * with a labelled banner within five seconds, disables every decision
 * control and stores no action client-side." A storyboard has no transport
 * to sever, so the five-second bound is named here and NOT claimed as
 * enforced; what this file enforces is the other two thirds.
 */
export type CcSessionState = 'live' | 'frozen'

export const CC_SESSION_STATES = ['live', 'frozen'] as const satisfies readonly CcSessionState[]

/** The six rules `DEC-CCOFF-001` (raised L35503) proposes, one per line. */
export interface CcFrozenSessionRule {
  /** The rule's own bold heading, verbatim. */
  readonly rule: string
  readonly sourceRef: string
}

export const CC_FROZEN_SESSION_RULES = [
  { rule: 'Detect, do not guess.', sourceRef: 'L35507' },
  { rule: 'Freeze and label, never blank.', sourceRef: 'L35508' },
  { rule: 'Disable every decision control, with the reason shown.', sourceRef: 'L35509' },
  { rule: 'Queue nothing.', sourceRef: 'L35510' },
  { rule: 'Name the alternate route.', sourceRef: 'L35511' },
  { rule: 'Escalate the human, not the software.', sourceRef: 'L35512' },
] as const satisfies readonly CcFrozenSessionRule[]

/**
 * The `Command Center session offline` column of §21.2.3's three-case table,
 * header L35541, separator L35542, data L35543-L35549 — seven rows,
 * counted. Transcribed HEADER-KEYED off the `Aspect` column, never
 * positionally: the other two columns are the device and site cases, and a
 * positional read would put a device's answer on a browser session, which is
 * the one mistake this table exists to prevent.
 */
export interface CcFrozenSessionFact {
  readonly aspect: string
  readonly commandCenterSessionOffline: string
  readonly sourceRef: string
}

export const CC_FROZEN_SESSION_FACTS = [
  { aspect: 'Who is disconnected', commandCenterSessionOffline: 'One browser session', sourceRef: 'L35543' },
  { aspect: 'Floor impact', commandCenterSessionOffline: 'None whatsoever', sourceRef: 'L35544' },
  { aspect: 'Board behaviour', commandCenterSessionOffline: 'Whole surface frozen with banner', sourceRef: 'L35545' },
  { aspect: 'Decision controls', commandCenterSessionOffline: 'Disabled, with the reason shown', sourceRef: 'L35546' },
  { aspect: 'Actions queued client-side', commandCenterSessionOffline: 'None, deliberately', sourceRef: 'L35547' },
  { aspect: 'Escalation timers', commandCenterSessionOffline: 'Continue server-side', sourceRef: 'L35548' },
  {
    aspect: 'Source status',
    commandCenterSessionOffline: '`Not specified in the Statement of Work`; `DEC-CCOFF-001`',
    sourceRef: 'L35549',
  },
] as const satisfies readonly CcFrozenSessionFact[]

/**
 * `SB-CC-05`'s rendered banner (L35535), with only the timestamp
 * parameterised. Rules 2 and 5 in one string, which is how the storyboard
 * writes it: the freeze, the floor's innocence, the disablement and the
 * alternate route. Nothing is added and nothing is dropped.
 */
export function frozenBannerText(lastUpdate: string): string {
  return `Not live · last update ${lastUpdate} · this screen is frozen. The floor is unaffected. Decisions are disabled until the connection returns. You can acknowledge escalations from the email notification, and the same actions are available in the Delivery Operations Hub.`
}

/** `SB-CC-05`'s verbatim tooltip on a frozen decision control (L35535). */
export const CC_FROZEN_CONTROL_REASON = 'Disabled: this screen is not current'

/**
 * The invariant, DERIVED from the pattern registry rather than restated
 * here, so a `FB-CC-SESS` row that ever gained a queue turns this false in
 * one place. `AC-CC-091` (L35711); the pattern's own distinctive invariant
 * at L35658 reads "nothing is queued client-side, ever."
 */
export const CC_FROZEN_SESSION_QUEUES_NOTHING =
  !queuesClientSide(ccFallbackPatternById('FB-CC-SESS'))
