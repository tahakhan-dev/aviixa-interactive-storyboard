import type { CcPushedTimes } from '@/surfaces/cc/live/model'

/**
 * THE FEED ITSELF, AND THE ONE PIECE OF BEHAVIOUR THIS MODULE HAS.
 *
 * `AC-CC-329` (L38027) — "No filter can hide an item carrying an
 * unacknowledged escalation from the actor responsible for it." That is a
 * function, not a sentence, and `cc09VisibleEntries` below is it. Everything
 * else on this module is a transcription or a disclosure; this is the only
 * place where getting it wrong would ship a safety defect rather than a
 * wrong string.
 *
 * ── THE FOUR FILTER DIMENSIONS ARE THE SOURCE'S OWN FOUR ────────────────
 *
 * L37838 states the spine: "Every pushed event lands in the feed, filterable
 * by Area, severity, type and state". Matrix row 2 (L37863) is the capability,
 * `FUNC-CC-0901-1-2` (L37993) is the functionality and `AC-CC-320` (L38018)
 * is the criterion; all four name the same four dimensions. A fifth would be
 * this build widening a filter the source closes, which is the direction that
 * hides things.
 *
 * ── AN UNSTATED DIMENSION IS `null`, NEVER A GUESS ─────────────────────
 *
 * The storyboard does not state an Area for its own escalation — `SB-CC-20`
 * gives a Location ("Wheel Station 2", L37930) and a Site (`SITE-RIVERSIDE`,
 * L37939) and no Area. An entry therefore carries `null` on a dimension the
 * source does not state for it, and an entry cannot MATCH a filter on a
 * dimension it does not state. It can still be FORCED VISIBLE, which is the
 * whole point: an item whose Area is unknown is exactly the item a strict
 * Area filter would silently drop.
 *
 * ── THE ENTRIES ARE THE SOURCE'S OWN AND ARE LABELLED AS ILLUSTRATIONS ──
 *
 * Two of the three are one escalation at two of the states L37881 lists —
 * `SB-CC-20` expanded (L37936-L37945) is the acknowledged moment, and L37940
 * gives the notified moment two minutes earlier, before the acknowledgement
 * L37941 records. The third is the alternate path at L37899: nobody holding
 * the target role is on shift, so delivery falls back to the tenant's Quality
 * Manager role irrespective of shift, marked as a fallback. It is
 * unacknowledged by construction — L37894 is why the fallback fires at all —
 * and it is the entry that makes matrix row 6 and `AC-CC-322` renderable.
 * Its time and its lot are `null` because the source states neither, and a
 * plausible one would be this build inventing a record.
 */

/** L37838, L37863 and L37993, all four in the source's own order. */
export const CC09_FILTER_DIMENSIONS = [
  'Area',
  'severity',
  'type',
  'state',
] as const satisfies readonly string[]

export type Cc09FilterDimension = (typeof CC09_FILTER_DIMENSIONS)[number]

/** `**States.**` L37881, the escalation ladder, in the source's own order. */
export const CC09_ESCALATION_STATES = [
  'notified',
  'acknowledged',
  'timed out',
  'fallback delivered',
  're-notified',
  'resolved',
] as const satisfies readonly string[]

export type Cc09EscalationState = (typeof CC09_ESCALATION_STATES)[number]

export interface Cc09FeedEntry {
  readonly id: string
  /** The collapsed row's leading time, or `null` where the source states none. */
  readonly at: string | null
  /**
   * The escalation's own state, from L37881's ladder. This is ALSO the `state`
   * filter dimension — one field, never two, because an entry whose ladder
   * state and whose filterable state could disagree is an entry a filter can
   * hide by reading the wrong one.
   */
  readonly state: Cc09EscalationState
  /**
   * The other three dimensions. `null` is "the source does not state this for
   * this entry" and never a default.
   */
  readonly dimensions: Record<Exclude<Cc09FilterDimension, 'state'>, string | null>
  /**
   * Origin and receipt, which is the marker obligation §21.3 assigns both of
   * this module's pushed elements. `null` only where the source states
   * neither time for the entry.
   */
  readonly times: CcPushedTimes | null
  /** Who claimed it and when, verbatim, or `null` while nobody has. */
  readonly acknowledged: string | null
  /** L37945's own cell, or `null`. */
  readonly resolved: string | null
  /** `AC-CC-322` (L38020) — a fallback delivery is visibly marked as one. */
  readonly fallbackMarked: boolean
  /** What the entry says about itself, in the source's words. */
  readonly summary: string
  readonly sourceRefs: readonly string[]
}

export const CC09_STORYBOARD_FEED = [
  {
    id: 'sb-cc-20-notified',
    at: '10:22:16',
    state: 'notified',
    dimensions: { Area: null, severity: 'Severity 1', type: 'Escalation fired' },
    times: { originTime: '10:07:22 device time', receiptTime: '10:22:14' },
    acknowledged: null,
    resolved: null,
    fallbackMarked: false,
    summary:
      'Quality Manager role at SITE-RIVERSIDE, resolved on shift to Elena, at 10:22:16, in-app and email. Nobody has claimed it yet.',
    sourceRefs: ['L37940', 'L37937', 'L37938', 'L37881'],
  },
  {
    id: 'sb-cc-20-acknowledged',
    at: '10:22:16',
    state: 'acknowledged',
    dimensions: { Area: null, severity: 'Severity 1', type: 'Escalation fired' },
    times: { originTime: '10:07:22 device time', receiptTime: '10:22:14' },
    acknowledged: 'Elena, 10:24:03, from in-app',
    resolved: '13:58:02 by Elena, on lot hold release',
    fallbackMarked: false,
    summary:
      '10:22:16 · Severity 1 · Wheel Station 2 · LOT-WB-2291 frozen · acknowledged. Severity 1 deviation opened on RB-0011.',
    sourceRefs: ['L37930', 'L37936', 'L37941', 'L37945'],
  },
  {
    id: 'nobody-on-shift-fallback',
    at: null,
    state: 'fallback delivered',
    dimensions: { Area: null, severity: null, type: 'Escalation fired' },
    times: null,
    acknowledged: null,
    resolved: null,
    fallbackMarked: true,
    summary:
      "Nobody holding the target role is on shift, so delivery falls back to the tenant's Quality Manager role irrespective of shift, explicitly marked as a fallback delivery, under DEC-NOSHIFT-001. The original target's miss is recorded, not hidden.",
    sourceRefs: ['L37899', 'L37894', 'L37971', 'L38024'],
  },
] as const satisfies readonly Cc09FeedEntry[]

/**
 * An entry carries an unacknowledged escalation when nobody has claimed it.
 *
 * KEYED ON THE ACKNOWLEDGEMENT, NEVER ON THE STATE, and the difference is the
 * whole rule. L37844: acknowledge means "I have seen this and own it"; resolve
 * means "it is dealt with". Reading the STATE would make a `fallback
 * delivered` entry look handled because it has moved on, and would make a
 * `resolved` entry that nobody acknowledged look handled because it ends the
 * ladder. The single acknowledgement state on the record is the only evidence
 * the surface has, and L37844 says so.
 */
export const cc09IsUnacknowledged = (e: Cc09FeedEntry): boolean => e.acknowledged === null

/** One dimension of one entry, with `state` read off the ladder field. */
export const cc09Dimension = (
  e: Cc09FeedEntry,
  d: Cc09FilterDimension,
): string | null => (d === 'state' ? e.state : e.dimensions[d])

export type Cc09Filter = Partial<Record<Cc09FilterDimension, string>>

export interface Cc09VisibleEntry {
  readonly entry: Cc09FeedEntry
  /** Whether the entry answers every dimension the filter names. */
  readonly matchedFilter: boolean
  /** `true` only where the filter excluded it and it is shown regardless. */
  readonly forcedVisible: boolean
  /** Never blank on a forced entry, and always `null` on a matched one. */
  readonly forcedReason: string | null
}

export const CC09_FORCED_REASON =
  'Shown despite the filter: this item carries an unacknowledged escalation, and AC-CC-329 (L38027) forbids any filter hiding one from the actor responsible for it.'

/**
 * The feed a person actually sees. EVERY entry the filter admits, PLUS every
 * entry carrying an unacknowledged escalation whether the filter admits it or
 * not, each one marked with why it is there.
 *
 * A DROPPED ENTRY IS THE DEFECT, SO NOTHING IS DROPPED SILENTLY. The return
 * carries the reason on the entry rather than leaving the caller to infer it
 * from a set difference, because a caller that infers it can render the item
 * without saying it was rescued — which reads as the filter having matched.
 *
 * A dimension the entry does not state cannot match a filter that names it.
 * That is deliberate and it is the strict direction: an entry of unknown Area
 * falls out of an Area filter, and is then rescued by the rule above if it is
 * unacknowledged.
 */
export function cc09VisibleEntries(
  entries: readonly Cc09FeedEntry[],
  filter: Cc09Filter,
): readonly Cc09VisibleEntry[] {
  const names = CC09_FILTER_DIMENSIONS.filter((d) => filter[d] !== undefined)
  return entries
    .map((entry) => {
      const matchedFilter = names.every((d) => cc09Dimension(entry, d) === filter[d])
      const forcedVisible = !matchedFilter && cc09IsUnacknowledged(entry)
      return {
        entry,
        matchedFilter,
        forcedVisible,
        forcedReason: forcedVisible ? CC09_FORCED_REASON : null,
      }
    })
    .filter((v) => v.matchedFilter || v.forcedVisible)
}

/**
 * The filter this module renders. A CONSTANT rather than a control that
 * writes anywhere, because L34881 classifies filter selections as
 * user-interface state and this build has no preference store: a filter that
 * appeared to save would be a persistence claim.
 *
 * It is chosen to EXCLUDE the storyboard's own acknowledged entry, so the
 * rescue above is visible on screen rather than described. A filter that
 * happened to admit everything would render a rule that could not be seen
 * working — the same shape as a gate that cannot fail.
 */
export const CC09_DEMONSTRATION_FILTER: Cc09Filter = { state: 'notified' }
