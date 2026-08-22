/**
 * §21.2.5 — THE NINE `FB-CC-*` PATTERNS, AS DATA.
 *
 * Frozen source: the nine pattern paragraphs are introduced one per line at
 * L35654, L35656, L35658, L35660, L35662, L35664, L35666, L35668 and L35670.
 * The selection table is header L35692, separator L35693, data L35694-L35702.
 *
 * THE COUNT IS DERIVED, NOT QUOTED. `grep -o 'FB-CC-[A-Za-z0-9]*'` over the
 * hash-verified blueprint yields exactly eleven distinct tokens: the nine
 * mnemonic identifiers below, plus `FB-CC-001` and `FB-CC-002`, which are
 * NOT members of this library. `FB-CC-001` is at L11414 and `FB-CC-002` at
 * L13846 — one occurrence each, in other chapters, numbered where this
 * library is mnemonic. This is the `FB-SCHED-009` shape: a token that parses
 * as the first member of a library it does not belong to. A regex keyed on
 * `FB-CC-\w+` collects all eleven; `CC_FALLBACK_PATTERN_IDS` is the nine.
 *
 * `AC-CC-090` (L35710) — "Every functionality in this chapter references at
 * least one `FB-CC-*` pattern" — is asserted against the nine, which is why
 * this is a table something reads rather than prose a reviewer scans.
 *
 * THE `Client-side queueing` COLUMN IS THE HONESTY RULE IN ONE COLUMN, and
 * it is transcribed verbatim rather than reduced to a boolean, because the
 * nine cells are not the same sentence. Five read "Not applicable — nothing
 * is written" (STALE, PUSH, AGENT, REPORT, QUEUE); `FB-CC-CMD` reads "Not
 * applicable — the device queues, not the board" and `FB-CC-AUTH` "Not
 * applicable — session denied"; `FB-CC-SESS` and `FB-CC-WRITE` read "None,
 * deliberately", which is the stronger statement — a write exists on those
 * paths and is still not queued. All nine refuse a client-side queue;
 * `queuesClientSide` below classifies the transcribed cell rather than
 * carrying a hand-written claim beside it.
 *
 * `AC-CC-091` (L35711) — "No fallback path on this surface queues an
 * authority action client-side."
 */

/** Closed at nine. `FB-CC-001` and `FB-CC-002` are not members; see above. */
export type CcFallbackPatternId =
  | 'FB-CC-STALE'
  | 'FB-CC-PUSH'
  | 'FB-CC-SESS'
  | 'FB-CC-WRITE'
  | 'FB-CC-CMD'
  | 'FB-CC-AGENT'
  | 'FB-CC-AUTH'
  | 'FB-CC-REPORT'
  | 'FB-CC-QUEUE'

export interface CcFallbackPattern {
  readonly id: CcFallbackPatternId
  /** The pattern paragraph's own words after the em dash, verbatim. */
  readonly title: string
  /** `| Triggering condition |`, verbatim. */
  readonly triggeringCondition: string
  /** `| Decision controls |`, verbatim. */
  readonly decisionControls: string
  /** `| Client-side queueing |`, verbatim. Never summarised — see header. */
  readonly clientSideQueueing: string
  /** `| Terminal safe state |`, verbatim. */
  readonly terminalSafeState: string
  /** The paragraph's line, then the table row's line. */
  readonly sourceRef: string
}

export const CC_FALLBACK_PATTERNS = [
  {
    id: 'FB-CC-STALE',
    title: 'the refreshed-state pipeline stalls.',
    triggeringCondition: 'Aggregate age exceeds two refresh intervals',
    decisionControls: 'Remain enabled',
    clientSideQueueing: 'Not applicable — nothing is written',
    terminalSafeState: 'Module-level degraded display with age',
    sourceRef: 'L35654 (pattern), L35694 (table row)',
  },
  {
    id: 'FB-CC-PUSH',
    title: 'the pushed-event transport is lost while the session is otherwise healthy.',
    triggeringCondition: 'Push transport lost, polling works',
    decisionControls: 'Remain enabled',
    clientSideQueueing: 'Not applicable — nothing is written',
    terminalSafeState: 'Polling with an explicit notice',
    sourceRef: 'L35656 (pattern), L35695 (table row)',
  },
  {
    id: 'FB-CC-SESS',
    title: 'this session loses the platform.',
    triggeringCondition: 'Platform unreachable from this session',
    decisionControls: 'Disabled with the reason shown',
    clientSideQueueing: 'None, deliberately',
    terminalSafeState: 'Frozen labelled board',
    sourceRef: 'L35658 (pattern), L35696 (table row)',
  },
  {
    id: 'FB-CC-WRITE',
    title: "an operational action's service call fails.",
    triggeringCondition: 'Owning service call fails',
    decisionControls: 'Return to pre-action state',
    clientSideQueueing: 'None, deliberately',
    terminalSafeState: 'Action did not happen, user told',
    sourceRef: 'L35660 (pattern), L35697 (table row)',
  },
  {
    id: 'FB-CC-CMD',
    title: 'a command reaches the channel but not the device.',
    triggeringCondition: 'Device has not confirmed a command',
    decisionControls: 'Remain enabled',
    clientSideQueueing: 'Not applicable — the device queues, not the board',
    terminalSafeState: 'Honest per-device propagation state',
    sourceRef: 'L35662 (pattern), L35698 (table row)',
  },
  {
    id: 'FB-CC-AGENT',
    title: 'agent output is unavailable or degraded.',
    triggeringCondition: 'Agent output unavailable',
    decisionControls: 'Remain enabled',
    clientSideQueueing: 'Not applicable — nothing is written',
    terminalSafeState: 'No-agent operating mode',
    sourceRef: 'L35664 (pattern), L35699 (table row)',
  },
  {
    id: 'FB-CC-AUTH',
    title: 'identity, role or scope resolution fails.',
    triggeringCondition: 'Identity, role or scope unresolved',
    decisionControls: 'Unavailable',
    clientSideQueueing: 'Not applicable — session denied',
    terminalSafeState: 'Session denied and audited',
    sourceRef: 'L35666 (pattern), L35700 (table row)',
  },
  {
    id: 'FB-CC-REPORT',
    title: 'report generation or scheduled delivery fails.',
    triggeringCondition: 'Generation or delivery fails',
    decisionControls: 'Remain enabled for retry',
    clientSideQueueing: 'Not applicable — nothing is written',
    terminalSafeState: 'Delivery recorded as failed, recipients told',
    sourceRef: 'L35668 (pattern), L35701 (table row)',
  },
  {
    id: 'FB-CC-QUEUE',
    title: 'an approval-queue item cannot render its required context.',
    triggeringCondition: 'Item context incomplete',
    decisionControls: 'Disabled for that item only',
    clientSideQueueing: 'Not applicable — nothing is written',
    terminalSafeState: 'Item not decidable, ages visibly, never expires',
    sourceRef: 'L35670 (pattern), L35702 (table row)',
  },
] as const satisfies readonly CcFallbackPattern[]

/** Derived from the registry, so the two cannot disagree. */
export const CC_FALLBACK_PATTERN_IDS = CC_FALLBACK_PATTERNS.map((p) => p.id)

type MissingFromPatterns = Exclude<
  CcFallbackPatternId,
  (typeof CC_FALLBACK_PATTERNS)[number]['id']
>
const _patternsExhaustive: MissingFromPatterns extends never ? true : never = true
void _patternsExhaustive

/**
 * `AC-CC-091` asked of one pattern, by CLASSIFYING its transcribed cell —
 * never by reading a boolean written next to it. The two accepted shapes are
 * the source's own two: a `Not applicable` cell (no client-side store exists
 * on that path) and `None, deliberately` (one could and does not). Anything
 * else is a queue, which on this surface is a defect.
 */
export function queuesClientSide(pattern: CcFallbackPattern): boolean {
  return !(
    pattern.clientSideQueueing.startsWith('Not applicable') ||
    pattern.clientSideQueueing === 'None, deliberately'
  )
}

export function ccFallbackPatternById(id: CcFallbackPatternId): CcFallbackPattern {
  const found = CC_FALLBACK_PATTERNS.find((p) => p.id === id)
  if (found === undefined) throw new Error(`no FB-CC pattern registered: ${id}`)
  return found
}

/**
 * `AC-CC-090`'s question, asked of a module's declared functionality list.
 * Returns the functionalities naming no pattern; empty is the criterion met.
 * The twelve later module tasks hand it their own lists, so the rule lives
 * in one place rather than being re-derived thirteen times.
 */
export function ccFunctionalitiesNamingNoPattern(
  functionalities: readonly {
    readonly id: string
    readonly patterns: readonly CcFallbackPatternId[]
  }[],
): readonly string[] {
  return functionalities.filter((f) => f.patterns.length === 0).map((f) => f.id)
}
