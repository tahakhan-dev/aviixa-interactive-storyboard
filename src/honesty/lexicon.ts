/**
 * # THE PROHIBITED-PHRASING LEXICON, AS DATA
 *
 * L78396 introduces it: prohibited phrasings and their compliant replacements,
 * classified `Derived Clarification`, offered because banned vague wording is
 * the mechanism by which the rule is usually broken. The table's header sits at
 * L78398 and its eight rows run L78400 to L78407. `TEST-OFF-401` at L78451 is
 * the test the source asks for — a lexical scan of every rendered string on all
 * five surfaces against a prohibited-phrasing dictionary, failing the build on
 * any match in a device-effect context. This module is that dictionary;
 * `tests/coverage/offline-phrasing.test.ts` is that scan.
 *
 * ## WHAT THE SOURCE ACTUALLY PROHIBITS, AND WHY THAT DECIDES THE MATCHER
 *
 * §34.4's table gives eight phrasings and no qualifier. §12's statement table
 * gives three of the same eight WITH the qualifier, and the qualifier is the
 * whole rule: L12782 prohibits a Hold released claim as a global claim before
 * all acknowledgements; L12783 prohibits Synced as the only device state;
 * L12784 prohibits a cleared claim immediately on granting. Beside them
 * L12785 ALLOWS a per-device claim that states exactly what is known.
 *
 * So the prohibition is on the bare, unqualified claim — the badge, the pill,
 * the status line — and not on the words occurring inside prose that goes on to
 * name the acknowledgement. Two scopes follow directly, and every rule below
 * declares which one it is in:
 *
 *   `bare-claim`    the whole rendered run IS the phrasing. Always an offence,
 *                   with no exemption available anywhere. This is the badge.
 *   `any-rendering` the phrasing appears inside a longer run. An offence
 *                   unless that exact run is a named disclosure.
 *
 * `synced` is `bare-claim` only, and that is measured rather than assumed: the
 * built tree renders twenty-five legitimate uses of the word — a last-synced
 * time, which is the age clause doing its job, and the Frontline sync inbox
 * saying there is no single state called synced. A rule that reported those
 * would be a rule somebody switched off.
 *
 * ## THE NINTH RULE IS NOT A TABLE ROW AND SAYS SO
 *
 * L78384 states the rule in simple words and refuses one artefact the table
 * does not list: the platform must never draw a tick next to a done claim until
 * the tablet itself has said it did it. `src/ui/ScreenStateBoundary.tsx` and
 * `src/ui/sa/CommandStateBadge.tsx` both carry that word in prose. It is
 * carried here as a rule with its own locator and no table cells, rather than
 * invented as a ninth row of a table that has eight.
 *
 * `sent` is deliberately NOT a rule of its own, and the two prose comments
 * naming it overstate the source. `AC-OFF-404` at L78445 requires notification
 * wording to distinguish queued, sent, delivered, opened, read and acknowledged
 * — so `sent` is one of six states the source itself asks a surface to name,
 * and the Frontline notification inbox renders it today as exactly that. What
 * L78406 prohibits is the phrase that conflates sending with delivery and
 * reading, which is rule `notification-sent-to` below.
 */

/** Each row of the table at L78400-L78407, transcribed cell by cell. */
export interface LexiconRow {
  /** The name the rule for this row is reported under. */
  readonly id: string
  /** Column 1, verbatim at `blueprintLine`. */
  readonly prohibited: string
  /** Column 2, verbatim at `blueprintLine`. */
  readonly why: string
  /** Column 3, verbatim at `blueprintLine`. */
  readonly replacement: string
  readonly blueprintLine: number
}

/**
 * The eight rows, in source order. Column three is the half a developer
 * actually needs: it is the wording that ships instead.
 */
export const LEXICON: readonly LexiconRow[] = [
  {
    id: 'hold-released',
    prohibited: '"Hold released"',
    why: 'Implies device effect from a server act',
    replacement: '"Release issued 11:04 · propagating · in force on 3 of 4 devices"',
    blueprintLine: 78400,
  },
  {
    id: 'clearance-granted',
    prohibited: '"Clearance granted to Maya"',
    why: 'Implies the worker is unblocked',
    replacement: '"Clearance recorded 10:12 · queued for TAB-014 · last seen 09:38"',
    blueprintLine: 78401,
  },
  {
    id: 'deployed-to-the-floor',
    prohibited: '"Version v2.2.0 deployed to the floor"',
    why: 'Implies adoption',
    replacement:
      '"Version v2.2.0 published · adoption per tenant timing · pinned runs unaffected"',
    blueprintLine: 78402,
  },
  {
    id: 'device-suspended',
    prohibited: '"Device suspended"',
    why: 'Implies the device honoured it',
    replacement: '"Suspension recorded · queued for delivery · device last seen 09:38"',
    blueprintLine: 78403,
  },
  {
    id: 'device-wiped',
    prohibited: '"Device wiped"',
    why: 'Implies erasure occurred',
    replacement: '"Wipe authorised · awaiting final sync attempt · not yet executed"',
    blueprintLine: 78404,
  },
  {
    id: 'synced-alone',
    prohibited: '"Synced" as a lone state',
    why: 'Collapses thirteen distinct capture states into one',
    replacement: 'The specific capture state, for example "uploaded" or "officially recorded"',
    blueprintLine: 78405,
  },
  {
    id: 'notification-sent-to',
    prohibited: '"Notification sent to the worker"',
    why: 'Conflates sending with delivery and reading',
    replacement:
      'The specific notification state, for example "queued" or "delivered, not opened"',
    blueprintLine: 78406,
  },
  {
    id: 'all-devices-up-to-date',
    prohibited: '"All devices up to date"',
    why: 'Cannot be known between syncs',
    replacement: '"All devices acknowledged as at 11:31"',
    blueprintLine: 78407,
  },
]

export type PhrasingScope = 'bare-claim' | 'any-rendering'

/** One lexical rule: what to look for, where it may be looked for, and why. */
export interface PhrasingRule {
  /** Shares its name with the `LEXICON` row it enforces, where it has one. */
  readonly id: string
  /**
   * The rule's body, as regex source. Assembled fresh at every call — a shared
   * `g` regex carries `lastIndex` between calls and skips hits in every second
   * string it is handed, which `slice-07-absence-sweep.test.ts` records.
   *
   * Written to the source's own construction, widened for the two evasions this
   * build has watched a text sweep lose to: the PLURAL (a singular pattern
   * passed a planted `timers`) and the intervening copula, which is how the
   * same claim is written in a sentence rather than on a badge.
   */
  readonly pattern: string
  readonly scope: PhrasingScope
  /** The frozen-source line whose words this rule is drawn from. */
  readonly blueprintLine: number
  /** Those words, verbatim at that line. */
  readonly quote: string
}

/** The copulas a claim is written through when it is a sentence and not a badge. */
const COPULA = '(?:is |are |was |were |has been |have been |been )?'
const DEVICE = '(?:device|devices|tablet|tablets)'

export const PHRASING_RULES: readonly PhrasingRule[] = [
  {
    id: 'hold-released',
    pattern: `holds? ${COPULA}released`,
    scope: 'any-rendering',
    blueprintLine: 78400,
    quote: 'Implies device effect from a server act',
  },
  {
    id: 'clearance-granted',
    pattern: `clearances? ${COPULA}granted`,
    scope: 'any-rendering',
    blueprintLine: 78401,
    quote: 'Implies the worker is unblocked',
  },
  {
    id: 'deployed-to-the-floor',
    pattern: `deployed to the (?:floor|floors|fleet|${DEVICE})`,
    scope: 'any-rendering',
    blueprintLine: 78402,
    quote: 'Implies adoption',
  },
  {
    id: 'device-suspended',
    pattern: `${DEVICE} ${COPULA}suspended`,
    scope: 'any-rendering',
    blueprintLine: 78403,
    quote: 'Implies the device honoured it',
  },
  {
    id: 'device-wiped',
    pattern: `${DEVICE} ${COPULA}wiped`,
    scope: 'any-rendering',
    blueprintLine: 78404,
    quote: 'Implies erasure occurred',
  },
  {
    // `bare-claim` because the word has twenty-five honest uses in the built
    // tree and one dishonest shape. See the header.
    id: 'synced-alone',
    pattern: 'synced',
    scope: 'bare-claim',
    blueprintLine: 78405,
    quote: 'Collapses thirteen distinct capture states into one',
  },
  {
    id: 'notification-sent-to',
    pattern: 'notifications? sent to',
    scope: 'any-rendering',
    blueprintLine: 78406,
    quote: 'Conflates sending with delivery and reading',
  },
  {
    id: 'all-devices-up-to-date',
    pattern: `all ${DEVICE} (?:is |are )?up to date`,
    scope: 'any-rendering',
    blueprintLine: 78407,
    quote: 'Cannot be known between syncs',
  },
  {
    // The ninth rule, and the one with no table row. See the header.
    id: 'tick-next-to-done',
    pattern: 'done',
    scope: 'bare-claim',
    blueprintLine: 78384,
    quote: 'must never draw a tick next to',
  },
]

/**
 * The one normalisation both sides pass through, so a comparison between a
 * markdown line and a rendered string is a comparison of words rather than of
 * typography. Same shape, and for the same reasons, as the fold in
 * `tests/coverage/slice-07-absence-sweep.test.ts`: the frozen source writes
 * identifiers in backticks and emphasis in asterisks, the built pages render
 * neither, and React renders a typographic apostrophe where the source has a
 * straight one. Lower-casing last is why no matcher here needs an `i` flag.
 */
export const fold = (s: string): string =>
  s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[`*_]/g, '')
    .replace(/[–—‒]/g, '-')
    .replace(/[  ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

/**
 * LETTER LOOKAROUNDS, NEVER `\b`.
 *
 * `\b` fails on the join two adjacent elements produce, because the boundary it
 * needs sits between two word characters; a letter lookaround does not care.
 * Digits, hyphens and the middle dot are not letters, so `device wiped-2` and
 * `hold released · 11:04` are still found, while `resynced` and `abandoned` are
 * not. Built fresh at each call, never shared.
 */
const matcherFor = (rule: PhrasingRule): RegExp =>
  new RegExp(`(?<![a-z])(?:${rule.pattern})(?![a-z])`, 'g')

export interface PhrasingMatch {
  readonly ruleId: string
  readonly scope: PhrasingScope
  /** The matched words, as folded. */
  readonly words: string
  /** Offset into the folded string. */
  readonly at: number
}

/**
 * Every rule that fires on one already-folded string, `bare-claim` rules
 * included. Deciding whether a `bare-claim` match is an offence is
 * `isBareClaim`'s job, not this one's — a caller that needs to report the
 * distinction needs both halves.
 */
export function phrasingMatches(folded: string): readonly PhrasingMatch[] {
  const found: PhrasingMatch[] = []
  for (const rule of PHRASING_RULES) {
    for (const m of folded.matchAll(matcherFor(rule))) {
      found.push({ ruleId: rule.id, scope: rule.scope, words: m[0], at: m.index })
    }
  }
  return found
}

/**
 * True when the match IS the whole rendered run rather than a part of it —
 * the badge, the pill, the status line, which is what L12782, L12783 and
 * L12784 each prohibit.
 *
 * Leading and trailing non-alphanumerics are discounted first, so a tick, a
 * bullet, a middle dot or a full stop cannot buy a rendering its way out. Only
 * the ends are trimmed: an interior separator makes the run two words about
 * something, which is no longer a bare claim.
 */
export function isBareClaim(folded: string, match: PhrasingMatch): boolean {
  const from = folded.search(/[a-z0-9]/)
  if (from === -1) return false
  let to = folded.length
  while (to > from && !/[a-z0-9]/.test(folded.charAt(to - 1))) to -= 1
  return match.at === from && match.at + match.words.length === to
}
