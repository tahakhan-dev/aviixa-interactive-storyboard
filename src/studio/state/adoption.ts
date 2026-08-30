/**
 * The adoption renderer. Spec §2 S10 — "never claim a device state".
 *
 * The Studio has no control that reaches a device (L31304) and no view of
 * one either. What it may show is the COMMAND STATE the Delivery Operations
 * Hub reports, in the source's own plain words, per device:
 *
 *   AC-STU-023 (L31226)  "No Studio view describes a published version as in
 *                        force on a device; per-device adoption is reported
 *                        from the Delivery Operations Hub with explicit
 *                        command states."
 *   AC-STU-112 (L33590)  "Adoption is reported per device with explicit
 *                        command states and never as a binary claim of being
 *                        live."
 *   L33579               a device whose command state cannot be determined is
 *                        "shown as unknown with the last known state and its
 *                        timestamp, never as adopted."
 *
 * The fifteen command states are the ONLY adoption vocabulary. They are not
 * redefined here — `CommandState` and their canonical order live in
 * `@/surfaces/sa/command-state` (slice 3, frozen source L42846). This module
 * adds the plain-words phrasing L31304 requires, one phrase per state, none
 * shared: collapsing two states onto one phrase destroys exactly the
 * information the adoption panel exists to show.
 */
import type { CommandState } from '@/surfaces/sa/command-state'

/**
 * THE PHRASE TABLE. Fifteen rows, one per command state, each saying what
 * has happened AND what has not. Three of them are the source's own
 * exemplars, printed verbatim at L31304: "queued, not yet delivered",
 * "delivered, not yet applied", "applied and acknowledged".
 */
export const COMMAND_STATE_PHRASES = {
  created: 'created, not yet authorized',
  authorized: 'authorized, not yet queued',
  queued: 'queued, not yet delivered',
  'available for delivery': 'available for delivery, not yet delivered',
  delivered: 'delivered, not yet applied',
  downloaded: 'downloaded, not yet validated',
  validated: 'validated, not yet applied',
  applied: 'applied, not yet acknowledged',
  acknowledged: 'applied and acknowledged',
  rejected: 'rejected by the device',
  failed: 'failed on the device',
  expired: 'expired before it was applied',
  cancelled: 'cancelled before it was applied',
  superseded: 'superseded by a later command',
  reconciled: 'reconciled after a reported gap',
} as const satisfies Record<CommandState, string>

// Same shape as `COMMAND_STATES`' own check: fails to compile if
// `CommandState` gains a member this table does not phrase.
type MissingFromPhrases = Exclude<CommandState, keyof typeof COMMAND_STATE_PHRASES>
const _phrasesExhaustive: MissingFromPhrases extends never ? true : never = true
void _phrasesExhaustive

export type CommandStatePhrases = Readonly<Record<CommandState, string>>

/**
 * The words a Studio view may never use of a device. Exported so the other
 * S10 renderers route through this one list rather than each growing their
 * own copy — AC-STU-028 (no escalation reported delivered before the Hub
 * records delivery, L31328) and AC-STU-118 (no clearance effective before
 * applied, L33769) are the same prohibition about different objects.
 *
 * "effective" is deliberately NOT here. AC-STU-118 forbids it BEFORE the
 * command reaches applied — a condition on the state, not a ban on the word
 * — and a shared list that banned it outright would refuse correct wording
 * on a clearance that HAS been applied. Over-strict shared guards get
 * weakened; this one stays true so it can stay.
 *
 * Matched on WORD BOUNDARIES, never as substrings: "delivered" contains the
 * letters of "live", and a substring check would ban the one word the
 * source itself prints.
 */
export const FORBIDDEN_ADOPTION_WORDS = [
  'adopted',
  'adoption complete',
  'live',
  'in force',
  'synced',
  'sent',
  'done',
] as const satisfies readonly string[]

const FORBIDDEN_CLAIM = new RegExp(`\\b(?:${FORBIDDEN_ADOPTION_WORDS.join('|')})\\b`, 'i')

/**
 * Whether a rendered string makes a claim S10 forbids. One function, so a
 * fix reaches every caller rather than one of several.
 */
export function claimsAdoption(text: string): boolean {
  return FORBIDDEN_CLAIM.test(text)
}

export interface AdoptionInput {
  readonly deviceId: string
  /** `null` where the device's command state cannot be determined — the
   *  case L33579 legislates, and the only case that must never read as
   *  adopted. */
  readonly commandState: CommandState | null
  /** The last state the Hub did report, with the stamp it was true at.
   *  `null` where the device has never reported. The stamp is a caller-
   *  supplied string: this module derives nothing from time. */
  readonly lastKnown: { readonly state: CommandState; readonly at: string } | null
}

export interface AdoptionRendering {
  readonly deviceId: string
  /** What the adoption panel prints for this device. */
  readonly label: string
  /** `false` whenever the command state could not be determined. */
  readonly determinate: boolean
  /** Always `false` — carried so a screen can assert it rather than trust
   *  the label, and so a regression shows up as data, not as prose. */
  readonly claimsAdoption: boolean
  /** The plain-words phrase, or `null` where there is no recognised state. */
  readonly phrase: string | null
  readonly lastKnownAt: string | null
}

/**
 * The one renderer every Studio adoption view calls. Takes its phrase
 * register AS A PARAMETER, defaulting to the table above and never closing
 * over a module-load snapshot of it.
 *
 * Five inputs, five renderings, and none of them claims a device state:
 *   a determinate state           -> its plain-words phrase;
 *   a reported state outside the
 *     fifteen                     -> unknown, naming the value unrecognised;
 *   indeterminate, last known     -> unknown, with that state and its stamp;
 *   indeterminate, last known
 *     outside the fifteen         -> unknown, naming the value unrecognised;
 *   indeterminate, never reported -> unknown, with nothing invented.
 * The two unrecognised cases are typed failures rather than throws: an
 * adoption panel that crashes on one stale row shows nothing about the other
 * fourteen devices.
 */
export function renderAdoption(
  input: AdoptionInput,
  phrases: CommandStatePhrases = COMMAND_STATE_PHRASES,
): AdoptionRendering {
  const { deviceId, commandState, lastKnown } = input
  // A register handed in by a caller may be short, and a stored state may
  // predate the current vocabulary, so the lookup is treated as partial even
  // though the default table is total.
  const phraseOf = (s: CommandState): string | undefined =>
    (phrases as Partial<Record<CommandState, string>>)[s]

  const unknown = (detail: string, at: string | null, phrase: string | null): AdoptionRendering => {
    const label = `${deviceId} — unknown; ${detail}${at === null ? '' : ` (as at ${at})`}.`
    return { deviceId, label, determinate: false, claimsAdoption: claimsAdoption(label), phrase, lastKnownAt: at }
  }

  if (commandState !== null) {
    const current = phraseOf(commandState)
    if (current !== undefined) {
      const label = `${deviceId} — ${current}`
      return {
        deviceId,
        label,
        determinate: true,
        claimsAdoption: claimsAdoption(label),
        phrase: current,
        lastKnownAt: lastKnown?.at ?? null,
      }
    }
    // A state WAS reported; it is the vocabulary that does not recognise it.
    // Saying "no state has been recorded" here would be a different, and
    // false, statement.
    return unknown(`reported state not recognised: “${commandState}”`, lastKnown?.at ?? null, null)
  }

  if (lastKnown === null) return unknown('no state has been recorded for this device', null, null)

  const known = phraseOf(lastKnown.state)
  return known === undefined
    ? unknown(`last known state not recognised: “${lastKnown.state}”`, lastKnown.at, null)
    : unknown(`last known: ${known}`, lastKnown.at, known)
}

/* ------------------------------------------------------------------ *
 * SB-STU-03's summary line (L31304).
 * ------------------------------------------------------------------ */

const SMALL_NUMBER_WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six',
  'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
] as const satisfies readonly string[]

function word(n: number): string {
  return SMALL_NUMBER_WORDS[n] ?? String(n)
}

function capitalised(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export interface AdoptionSummaryCounts {
  readonly jobsNotified: number
  readonly devicesOnVersion: number
  readonly devicesTotal: number
}

/**
 * The honest summary a Release Authority reads after publishing. It reports
 * how many devices are ON THE VERSION — a count, from command states — and
 * never that the version is in force, live, or adopted anywhere.
 *
 * The source's own exemplar, printed at L31304, is the zero-of-one case:
 * publication succeeded, one Job was notified, and not one device has the
 * version yet. That the exemplar's honest answer is "zero" is the point.
 */
export function renderAdoptionSummary(counts: AdoptionSummaryCounts): string {
  const jobs = `${capitalised(word(counts.jobsNotified))} ${counts.jobsNotified === 1 ? 'Job' : 'Jobs'} notified.`
  const devices = `${capitalised(word(counts.devicesOnVersion))} of ${word(counts.devicesTotal)} devices on this version.`
  return `Published. ${jobs} ${devices}`
}

/** The exemplar itself, as a fixture, so a screen can be compared against
 *  the source's own sentence rather than against a paraphrase of it. */
export const STU_ADOPTION_SUMMARY_EXEMPLAR = renderAdoptionSummary({
  jobsNotified: 1,
  devicesOnVersion: 0,
  devicesTotal: 1,
})
