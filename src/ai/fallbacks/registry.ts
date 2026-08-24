/**
 * THE COLLISION-AWARE FALLBACK-CONTRACT REGISTRY.
 *
 * The frozen source uses the literal `FB-AI-01` for four different contracts,
 * in four places that do not cross-reference each other:
 *
 *   - L88916, chapter 40.1 — a boundary violation attempt.
 *   - L92793, storyboard 44A.1 — a worker asking while offline.
 *   - L46951, chapter 24 — a fallback contract FAMILY, sitting alongside
 *     `FB-CORE-01` and `FB-SYNC-01` in a table of families rather than of
 *     numbered contracts. It is not even the same KIND of object as the other
 *     three, which is the clearest reason a bare literal cannot be a key.
 *   - L74495, section 30D.8 — trace-store unavailability, which is chapter
 *     40's subject for `FB-AI-12` (L88927) under a different literal.
 *
 * That last pair is why this registry does not assume the collision is a
 * property of the low numbers. `FB-AI-12` itself has two owners — chapter
 * 40.12 and storyboard 44A.12 (L93730) — and 44A.12 is where a worker flags
 * an unsafe response, so a resolver that answers with chapter 40's contract
 * there answers about the wrong thing on the surface where a person acts.
 *
 * ── THE KEY IS A COMPOUND, AND A LOOKUP RETURNS EVERY OWNER ────────────────
 * `ownersOf` returns an array and never a single record. A resolver that
 * silently picks one is the defect; the sixteen-literal overlap between the
 * two registers is the reason. `ownerAt` is the narrow form, and it takes the
 * chapter as well as the identifier because that is the only pair that
 * identifies a contract.
 *
 * ── THE THIRTEENTH ROW IS NOT A CONTRACT ───────────────────────────────────
 * Section 44A.31's register has thirteen data rows (L95359-L95371). Twelve
 * name one `FB-AGT-*` contract each. The thirteenth names a RANGE standing
 * for one contract per storyboard across 44A.1 to 44A.30, so a gate keyed on
 * thirteen asserts the wrong cardinality. It is registered as a range, and
 * the covering test expands it against the thirty storyboard cards that
 * actually claim its members rather than against a number.
 *
 * This module is data and three lookups. It computes nothing and decides
 * nothing.
 */

/** One contract, in one chapter. The pair is the key; neither half alone is. */
export interface FallbackContractOwner {
  /**
   * The section that owns this contract, as the source's own register names
   * it — a section number where the register gives one, and the chapter
   * otherwise.
   */
  readonly chapter: string
  readonly identifier: string
  /** The contract, verbatim from `contractLocator`. */
  readonly contract: string
  /** The line where this chapter CLAIMS the identifier. */
  readonly locator: string
  /**
   * The line carrying the contract in words. The same line for a register
   * row, and the section heading for a storyboard card — a card's identifier
   * row names the literal and the heading says what it is for, and citing one
   * line for both would be a citation that does not carry what it claims.
   */
  readonly contractLocator: string
}

/**
 * A register row that names a span of identifiers rather than one. Kept apart
 * from the owners so that counting rows and counting contracts cannot be
 * confused, which is the mistake the source's own thirteenth row invites.
 */
export interface FallbackIdentifierRange {
  readonly chapter: string
  readonly first: string
  readonly last: string
  readonly contract: string
  readonly locator: string
}

export const FALLBACK_CONTRACT_OWNERS = [
  // A: chapter 40 and 41 register, L88915-L88939. Twenty-five data rows under the
  // header at L88913 and the separator at L88914.
  { chapter: 'Chapter 40 opening', identifier: 'FB-AI-00', contract: 'Total loss of the agentic layer', locator: 'L88915', contractLocator: 'L88915' },
  { chapter: '40.1', identifier: 'FB-AI-01', contract: 'Boundary violation attempt', locator: 'L88916', contractLocator: 'L88916' },
  { chapter: '40.2', identifier: 'FB-AI-02', contract: 'Orchestrator loop failure', locator: 'L88917', contractLocator: 'L88917' },
  { chapter: '40.3', identifier: 'FB-AI-03', contract: 'Coaching retrieval and delivery failure', locator: 'L88918', contractLocator: 'L88918' },
  { chapter: '40.4', identifier: 'FB-AI-04', contract: 'Deviation brief assembly and gate delivery failure', locator: 'L88919', contractLocator: 'L88919' },
  { chapter: '40.5', identifier: 'FB-AI-05', contract: 'Shift handoff brief failure', locator: 'L88920', contractLocator: 'L88920' },
  { chapter: '40.6', identifier: 'FB-AI-06', contract: 'Vision scope-creep guard', locator: 'L88921', contractLocator: 'L88921' },
  { chapter: '40.7', identifier: 'FB-AI-07', contract: 'Atom failure and evaluation regression', locator: 'L88922', contractLocator: 'L88922' },
  { chapter: '40.8', identifier: 'FB-AI-08', contract: 'Memory store failure', locator: 'L88923', contractLocator: 'L88923' },
  { chapter: '40.9', identifier: 'FB-AI-09', contract: 'Model and provider failure', locator: 'L88924', contractLocator: 'L88924' },
  { chapter: '40.10', identifier: 'FB-AI-10', contract: 'Governance gate delivery and decision failure', locator: 'L88925', contractLocator: 'L88925' },
  { chapter: '40.11', identifier: 'FB-AI-11', contract: 'Evaluation harness failure', locator: 'L88926', contractLocator: 'L88926' },
  { chapter: '40.12', identifier: 'FB-AI-12', contract: 'Trace and decision-record failure', locator: 'L88927', contractLocator: 'L88927' },
  { chapter: '40.13', identifier: 'FB-AI-13', contract: 'Isolation and quota failure', locator: 'L88928', contractLocator: 'L88928' },
  { chapter: '40.14', identifier: 'FB-AI-14', contract: 'Learning pipeline and publication failure', locator: 'L88929', contractLocator: 'L88929' },
  { chapter: '40.15', identifier: 'FB-AI-15', contract: 'Pause, kill and rollback failure', locator: 'L88930', contractLocator: 'L88930' },
  { chapter: '40.16', identifier: 'FB-AI-16', contract: 'Authority and prohibition failure', locator: 'L88931', contractLocator: 'L88931' },
  { chapter: '41.1', identifier: 'FB-AI-101', contract: 'Agent definition and policy lifecycle failure', locator: 'L88932', contractLocator: 'L88932' },
  { chapter: '41.2', identifier: 'FB-AI-102', contract: 'Prompt, model and provider configuration failure', locator: 'L88933', contractLocator: 'L88933' },
  { chapter: '41.3', identifier: 'FB-AI-103', contract: 'Tool permission, memory configuration and retrieval source failure', locator: 'L88934', contractLocator: 'L88934' },
  { chapter: '41.4', identifier: 'FB-AI-104', contract: 'Evaluation suite, routing policy and quota failure', locator: 'L88935', contractLocator: 'L88935' },
  { chapter: '41.5', identifier: 'FB-AI-105', contract: 'Request, recommendation, draft, output and feedback failure', locator: 'L88936', contractLocator: 'L88936' },
  { chapter: '41.6', identifier: 'FB-AI-106', contract: 'Composed-agent lifecycle failure', locator: 'L88937', contractLocator: 'L88937' },
  { chapter: '41.7', identifier: 'FB-AI-107', contract: 'Incident, package and rollback-version failure', locator: 'L88938', contractLocator: 'L88938' },
  { chapter: '41.8', identifier: 'FB-AI-108', contract: 'Evidence and audit integrity failure', locator: 'L88939', contractLocator: 'L88939' },
  // B: section 44A.31, the twelve rows that name one contract each.
  { chapter: '44.1', identifier: 'FB-AGT-PREV-01', contract: 'Coaching selection unavailable', locator: 'L95359', contractLocator: 'L95359' },
  { chapter: '44.1', identifier: 'FB-AGT-PREV-02', contract: 'Stale, withdrawn or mismatched asset', locator: 'L95360', contractLocator: 'L95360' },
  { chapter: '44.1', identifier: 'FB-AGT-PREV-03', contract: 'Duplicate intervention prevention', locator: 'L95361', contractLocator: 'L95361' },
  { chapter: '44.2', identifier: 'FB-AGT-DEV-01', contract: 'Deviation brief cannot be assembled', locator: 'L95362', contractLocator: 'L95362' },
  { chapter: '44.2', identifier: 'FB-AGT-DEV-02', contract: 'Classification divergence', locator: 'L95363', contractLocator: 'L95363' },
  { chapter: '44.2', identifier: 'FB-AGT-DEV-03', contract: 'Escalation delivery failure', locator: 'L95364', contractLocator: 'L95364' },
  { chapter: '44.3', identifier: 'FB-AGT-SHA-01', contract: 'No handoff brief produced', locator: 'L95365', contractLocator: 'L95365' },
  { chapter: '44.3', identifier: 'FB-AGT-SHA-02', contract: 'Incomplete source data', locator: 'L95366', contractLocator: 'L95366' },
  { chapter: '44.3', identifier: 'FB-AGT-SHA-03', contract: 'Duplicate or conflicting briefs', locator: 'L95367', contractLocator: 'L95367' },
  { chapter: '44.4', identifier: 'FB-AGT-VIS-01', contract: 'Vision inference unavailable or inconclusive', locator: 'L95368', contractLocator: 'L95368' },
  { chapter: '44.4', identifier: 'FB-AGT-VIS-02', contract: 'Model rollback and withdrawn versions', locator: 'L95369', contractLocator: 'L95369' },
  { chapter: '44.4', identifier: 'FB-AGT-VIS-03', contract: 'One device with a corrupt model', locator: 'L95370', contractLocator: 'L95370' },
  // C: the thirty storyboard cards that individually claim the members of the
  // range row. `locator` is the card row claiming the literal; `contractLocator`
  // is the section heading carrying the contract in words.
  { chapter: '44A.1', identifier: 'FB-AI-01', contract: 'Worker asks artificial intelligence while offline', locator: 'L92793', contractLocator: 'L92772' },
  { chapter: '44A.2', identifier: 'FB-AI-02', contract: 'Worker online but cloud artificial intelligence is down', locator: 'L92876', contractLocator: 'L92855' },
  { chapter: '44A.3', identifier: 'FB-AI-03', contract: 'Local artificial intelligence unavailable but cached guidance exists', locator: 'L92960', contractLocator: 'L92940' },
  { chapter: '44A.4', identifier: 'FB-AI-04', contract: 'No artificial intelligence and no cached guidance', locator: 'L93041', contractLocator: 'L93020' },
  { chapter: '44A.5', identifier: 'FB-AI-05', contract: 'Severity 1 deviation while artificial intelligence is unavailable', locator: 'L93129', contractLocator: 'L93105' },
  { chapter: '44A.6', identifier: 'FB-AI-06', contract: 'Supervisor unavailable', locator: 'L93221', contractLocator: 'L93197' },
  { chapter: '44A.7', identifier: 'FB-AI-07', contract: 'Quality Manager releases a hold after reconnection', locator: 'L93305', contractLocator: 'L93283' },
  { chapter: '44A.8', identifier: 'FB-AI-08', contract: 'Studio publishes while the tablet is offline', locator: 'L93393', contractLocator: 'L93370' },
  { chapter: '44A.9', identifier: 'FB-AI-09', contract: 'Command Center issues an action to an offline device', locator: 'L93474', contractLocator: 'L93453' },
  { chapter: '44A.10', identifier: 'FB-AI-10', contract: 'Artificial intelligence uses an outdated Work Instruction', locator: 'L93566', contractLocator: 'L93543' },
  { chapter: '44A.11', identifier: 'FB-AI-11', contract: 'Local and cloud artificial intelligence disagree', locator: 'L93645', contractLocator: 'L93625' },
  { chapter: '44A.12', identifier: 'FB-AI-12', contract: 'Worker flags an unsafe response', locator: 'L93730', contractLocator: 'L93707' },
  { chapter: '44A.13', identifier: 'FB-AI-13', contract: 'An agent action partially succeeds', locator: 'L93816', contractLocator: 'L93794' },
  { chapter: '44A.14', identifier: 'FB-AI-14', contract: 'An approved artificial-intelligence action expires', locator: 'L93901', contractLocator: 'L93879' },
  { chapter: '44A.15', identifier: 'FB-AI-15', contract: 'A retry risks a duplicate action', locator: 'L93992', contractLocator: 'L93969' },
  { chapter: '44A.16', identifier: 'FB-AI-16', contract: 'A bad model is rolled back', locator: 'L94073', contractLocator: 'L94050' },
  { chapter: '44A.17', identifier: 'FB-AI-17', contract: 'One device has a corrupt model', locator: 'L94157', contractLocator: 'L94134' },
  { chapter: '44A.18', identifier: 'FB-AI-18', contract: 'Artificial intelligence is disabled for one tenant', locator: 'L94240', contractLocator: 'L94217' },
  { chapter: '44A.19', identifier: 'FB-AI-19', contract: 'Platform-wide artificial-intelligence outage', locator: 'L94325', contractLocator: 'L94302' },
  { chapter: '44A.20', identifier: 'FB-AI-20', contract: 'Reconnection fails midway', locator: 'L94405', contractLocator: 'L94384' },
  { chapter: '44A.21', identifier: 'FB-AI-21', contract: 'A queued question is obsolete', locator: 'L94486', contractLocator: 'L94463' },
  { chapter: '44A.22', identifier: 'FB-AI-22', contract: 'Vision inference fails', locator: 'L94568', contractLocator: 'L94547' },
  { chapter: '44A.23', identifier: 'FB-AI-23', contract: 'Storage fills with queued artificial-intelligence work', locator: 'L94663', contractLocator: 'L94630' },
  { chapter: '44A.24', identifier: 'FB-AI-24', contract: 'Artificial intelligence recovers but dashboards remain stale', locator: 'L94743', contractLocator: 'L94722' },
  { chapter: '44A.25', identifier: 'FB-AI-25', contract: 'An offline tablet is suspended or wiped', locator: 'L94825', contractLocator: 'L94802' },
  { chapter: '44A.26', identifier: 'FB-AI-26', contract: 'The primary artificial-intelligence fallback also fails', locator: 'L94907', contractLocator: 'L94886' },
  { chapter: '44A.27', identifier: 'FB-AI-27', contract: 'No authorized human is available', locator: 'L94991', contractLocator: 'L94968' },
  { chapter: '44A.28', identifier: 'FB-AI-28', contract: 'An outage crosses a shift', locator: 'L95076', contractLocator: 'L95052' },
  { chapter: '44A.29', identifier: 'FB-AI-29', contract: 'Recovery occurs after a personnel change', locator: 'L95161', contractLocator: 'L95138' },
  { chapter: '44A.30', identifier: 'FB-AI-30', contract: 'Artificial intelligence conflicts with the official record', locator: 'L95251', contractLocator: 'L95221' },
  // D: the two owners outside either register.
  { chapter: '24', identifier: 'FB-AI-01', contract: 'Artificial-intelligence degraded or unavailable, including the platform emergency pause. Fallback is authored content and deterministic behaviour, never silence.', locator: 'L46951', contractLocator: 'L46951' },
  { chapter: '30D.8', identifier: 'FB-AI-01', contract: 'Failure: the trace store is unavailable while an agent is running', locator: 'L74495', contractLocator: 'L74495' },
] as const satisfies readonly FallbackContractOwner[]

/**
 * The one range row, L95371. Its members are claimed individually by the
 * thirty storyboard cards registered above, which is why the expansion is
 * checkable rather than a promise.
 */
export const FALLBACK_IDENTIFIER_RANGES = [
  {
    chapter: '44A.1 to 44A.30',
    first: 'FB-AI-01',
    last: 'FB-AI-30',
    contract: 'One per storyboard, as named in section 44A',
    locator: 'L95371',
  },
] as const satisfies readonly FallbackIdentifierRange[]

/**
 * THE COMPOUND KEY AS A TYPE, so a caller can hold one rather than pass two
 * loose strings side by side.
 *
 * Added by slice 11 wave 4 task 15A for the thirty §44A storyboard cards. No
 * row was added or changed: the thirty storyboard owners were already
 * registered here, which is why the storyboard contract consumes this registry
 * instead of standing up a parallel one. The key exists because a `FB-AI-*`
 * literal on its own does not identify a contract — sixteen of them name two —
 * and a signature taking `(chapter, identifier)` lets a caller swap the
 * arguments silently, while a record does not.
 */
export interface FallbackContractKey {
  readonly chapter: string
  readonly identifier: string
}

/** The compound key. Chapter first, because that is what disambiguates. */
export function fallbackKey(chapter: string, identifier: string): string {
  return `${chapter}::${identifier}`
}

/**
 * EVERY owner of a bare literal, in registration order.
 *
 * An array, always, and never a `find`. A caller holding a bare literal does
 * not know which contract it has, and a function that answers as though it
 * did would hide that from them.
 */
export function ownersOf(identifier: string): readonly FallbackContractOwner[] {
  return FALLBACK_CONTRACT_OWNERS.filter((o) => o.identifier === identifier)
}

/** The one owner at a compound key, or `null` where the pair names none. */
export function ownerAt(chapter: string, identifier: string): FallbackContractOwner | null {
  return (
    FALLBACK_CONTRACT_OWNERS.find(
      (o) => o.chapter === chapter && o.identifier === identifier,
    ) ?? null
  )
}

/**
 * The identifiers a range row stands for, expanded on its own numbering.
 *
 * The width is taken from the range's own endpoints rather than fixed at two
 * digits, so a range whose endpoints are spelled differently expands wrongly
 * and visibly instead of quietly producing plausible members.
 */
export function expandRange(range: FallbackIdentifierRange): readonly string[] {
  const match = /^(.*?)(\d+)$/.exec(range.first)
  const end = /^(.*?)(\d+)$/.exec(range.last)
  if (match === null || end === null || match[1] !== end[1]) {
    throw new Error(`A fallback range must share one prefix: ${range.first} to ${range.last}.`)
  }
  const prefix = match[1]!
  const width = match[2]!.length
  const out: string[] = []
  for (let n = Number(match[2]); n <= Number(end[2]); n += 1) {
    out.push(`${prefix}${String(n).padStart(width, '0')}`)
  }
  return out
}
