/**
 * Frozen source §25 (L48014): "Rather than writing the same thirteen paragraphs
 * seventy-nine times, this section writes them once as a contract every screen
 * must honour, and then each screen only has to record where it differs."
 *
 * The contract exists to keep four things apart that look alike and are not:
 * nothing exists yet, we are fetching, we cannot fetch, and we fetched something
 * old — plus queued versus applied, and degraded versus unavailable.
 */
export type ScreenStateId =
  | 'STATE-01' | 'STATE-02' | 'STATE-03' | 'STATE-04' | 'STATE-05'
  | 'STATE-06' | 'STATE-07' | 'STATE-08' | 'STATE-09' | 'STATE-10'
  | 'STATE-11' | 'STATE-12' | 'STATE-13'

export interface ScreenStateDefinition {
  readonly id: ScreenStateId
  /** Exact source name. */
  readonly name: string
  /** What the user actually sees. Plain language. */
  readonly contract: string
  /** The mistake this state exists to prevent. */
  readonly neverDo: string
  /** True only for STATE-07: no other surface may render it. */
  readonly frontlineOnly: boolean
}

export const SCREEN_STATES: readonly ScreenStateDefinition[] = [
  {
    id: 'STATE-01', name: 'Empty', frontlineOnly: false,
    contract:
      'The frame renders with a plain sentence naming what would appear here and what creates it, plus the creating action where this role holds it.',
    neverDo: 'Never a blank panel, and never confused with a failure.',
  },
  {
    id: 'STATE-02', name: 'Loading', frontlineOnly: false,
    contract:
      'A skeleton of the eventual layout with a progress indicator and the object being fetched named.',
    neverDo: 'Loading never renders a zero. A count that has not arrived is a placeholder, not the number nought.',
  },
  {
    id: 'STATE-03', name: 'Success', frontlineOnly: false,
    contract:
      'The requested content, with its as-of time where it is an aggregate and its freshness class where the surface has one.',
    neverDo: 'Never present an aggregate without saying when it was true.',
  },
  {
    id: 'STATE-04', name: 'Validation', frontlineOnly: false,
    contract:
      'The invalid field is marked, the rule that was broken is stated in words, and the permitted range or format is stated.',
    neverDo: 'Never reject a value without saying what would be accepted.',
  },
  {
    id: 'STATE-05', name: 'Permission-denied', frontlineOnly: false,
    contract:
      'A plain statement that this identity’s roles and scopes do not carry the action, and the name of the role that does.',
    neverDo: 'Never hide the refusal behind a missing button, and never disclose what the actor may not see.',
  },
  {
    id: 'STATE-06', name: 'Read-only', frontlineOnly: false,
    contract:
      'Every input is disabled, with one banner naming the cause — tenant suspension, an archived object, or a role without write authority.',
    neverDo: 'Never scatter the cause across several messages. One banner, one cause.',
  },
  {
    id: 'STATE-07', name: 'Offline', frontlineOnly: true,
    contract:
      'The persistent indicator carries offline status, how long, and what remains possible. Only the Frontline Worker Application has a true offline state.',
    neverDo: 'No other surface may render an offline state, because no other surface has one.',
  },
  {
    id: 'STATE-08', name: 'Stale-data', frontlineOnly: false,
    contract:
      'Content renders with its age and its origin explicit, so a reader can judge how much to trust it.',
    neverDo: 'Never show old content as though it were current.',
  },
  {
    id: 'STATE-09', name: 'Queued', frontlineOnly: false,
    contract:
      'An accepted action that has not yet taken effect is shown in its true command state — created, authorised, queued, available for delivery, and so on.',
    neverDo: 'Never render a queued action as applied or complete, and never collapse its state into one word.',
  },
  {
    id: 'STATE-10', name: 'Artificial-intelligence-degraded', frontlineOnly: false,
    contract:
      'The agent’s output area states plainly that the agent is degraded, what is missing, and what remains available. Deterministic behaviour continues unchanged.',
    neverDo: 'Never let a degraded agent look healthy, and never let its absence stop a deterministic check.',
  },
  {
    id: 'STATE-11', name: 'Artificial-intelligence-unavailable', frontlineOnly: false,
    contract:
      'The agent’s area states unavailability with its cause where known, including when agents are paused by the platform.',
    neverDo: 'Never present cached guidance or a deterministic rule as live artificial intelligence.',
  },
  {
    id: 'STATE-12', name: 'Failure', frontlineOnly: false,
    contract:
      'The screen names what failed, whether anything was written, and the next step.',
    neverDo: 'Never leave the reader unsure whether their data was saved.',
  },
  {
    id: 'STATE-13', name: 'Recovery', frontlineOnly: false,
    contract:
      'The transitional state after a failure or reconnection: what is being replayed or recomputed, and how much remains.',
    neverDo: 'Never show a recovering system as fully recovered.',
  },
] as const

export const FRONTLINE_ONLY_STATES: readonly ScreenStateId[] = ['STATE-07'] as const

const BY_ID = new Map(SCREEN_STATES.map((s) => [s.id, s]))

export function screenState(id: ScreenStateId): ScreenStateDefinition {
  const found = BY_ID.get(id)
  if (!found) throw new Error(`Unknown screen state: ${id}`)
  return found
}
