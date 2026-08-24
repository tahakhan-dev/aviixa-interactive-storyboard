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

/**
 * ── THE SOURCE'S OWN WORDS, AT EVERY LINE THIS MODULE CITES ────────────────
 *
 * Every locator above is a data field and every identifier is a separate data
 * field beside it, so nothing in the record puts the two next to each other in
 * one run of text. That is a real cost rather than a cosmetic one: a reader of
 * this file cannot tell a right line from a wrong one without opening 18MB of
 * frozen source, and `tests/coverage/locator-fidelity.test.ts` grades a
 * citation strong only where a double-quoted verbatim excerpt sits beside it.
 * Both problems have the same answer, and it is not a weaker gate.
 *
 * So the lines are quoted here, and EXTRACTED MECHANICALLY RATHER THAN TYPED.
 * Each excerpt is the longest quotation-free run of its own line under the
 * gate's own `normalise` — lower-cased, backticks and emphasis dropped,
 * dashes folded, whitespace collapsed — which is why they read as lower case
 * and why every one of them is a substring of the line it names by
 * construction rather than by care. A hand-typed quotation is the shape this
 * build has already shipped as a paraphrase presented as a quotation.
 *
 * BLOCK A CARRIES ITS IDENTIFIER AND BLOCK B DELIBERATELY DOES NOT, and the
 * difference is a claim rather than a formatting choice. A register row and a
 * storyboard card's identifier row both CONTAIN the literal, so writing the
 * literal beside the line asserts something true and checkable. A section
 * HEADING does not contain the literal at all — it says what the contract is
 * for, in words — so prefixing one with its identifier would assert that the
 * identifier is at a line it is not at. Block B is prefixed with the section
 * number instead, which is what the heading really carries.
 *
 * TWO HEADINGS CARRY NO USABLE EXCERPT and are named rather than quietly
 * dropped, because a silent gap in a mechanical extraction is the shape that
 * has returned valid JSON over 15% of its subject in this build. They are
 * storyboard 6's and storyboard 22's: both are four-word headings shorter than
 * the thirty-two-character floor, so there is nothing to fix at either. A
 * lower floor would start admitting fragments that are not claims — the gate's
 * own minimum is thirty, and a four-word heading is under it either way.
 *
 * BLOCK A — the row where each chapter claims the literal.
 *
 * FB-AI-00 L88915 "fb-ai-00 | total loss of the agentic layer | chapter 40 opening"
 * FB-AI-01 L88916 "fb-ai-01 | boundary violation attempt | 40.1"
 * FB-AI-02 L88917 "fb-ai-02 | orchestrator loop failure | 40.2"
 * FB-AI-03 L88918 "fb-ai-03 | coaching retrieval and delivery failure | 40.3"
 * FB-AI-04 L88919 "fb-ai-04 | deviation brief assembly and gate delivery failure | 40.4"
 * FB-AI-05 L88920 "fb-ai-05 | shift handoff brief failure | 40.5"
 * FB-AI-06 L88921 "fb-ai-06 | vision scope-creep guard | 40.6"
 * FB-AI-07 L88922 "fb-ai-07 | atom failure and evaluation regression | 40.7"
 * FB-AI-08 L88923 "fb-ai-08 | memory store failure | 40.8"
 * FB-AI-09 L88924 "fb-ai-09 | model and provider failure | 40.9"
 * FB-AI-10 L88925 "fb-ai-10 | governance gate delivery and decision failure | 40.10"
 * FB-AI-11 L88926 "fb-ai-11 | evaluation harness failure | 40.11"
 * FB-AI-12 L88927 "fb-ai-12 | trace and decision-record failure | 40.12"
 * FB-AI-13 L88928 "fb-ai-13 | isolation and quota failure | 40.13"
 * FB-AI-14 L88929 "fb-ai-14 | learning pipeline and publication failure | 40.14"
 * FB-AI-15 L88930 "fb-ai-15 | pause, kill and rollback failure | 40.15"
 * FB-AI-16 L88931 "fb-ai-16 | authority and prohibition failure | 40.16"
 * FB-AI-101 L88932 "fb-ai-101 | agent definition and policy lifecycle failure | 41.1"
 * FB-AI-102 L88933 "fb-ai-102 | prompt, model and provider configuration failure | 41.2"
 * FB-AI-103 L88934 "fb-ai-103 | tool permission, memory configuration and retrieval source failure | 41.3"
 * FB-AI-104 L88935 "fb-ai-104 | evaluation suite, routing policy and quota failure | 41.4"
 * FB-AI-105 L88936 "fb-ai-105 | request, recommendation, draft, output and feedback failure | 41.5"
 * FB-AI-106 L88937 "fb-ai-106 | composed-agent lifecycle failure | 41.6"
 * FB-AI-107 L88938 "fb-ai-107 | incident, package and rollback-version failure | 41.7"
 * FB-AI-108 L88939 "fb-ai-108 | evidence and audit integrity failure | 41.8"
 * FB-AGT-PREV-01 L95359 "fb-agt-prev-01 | coaching selection unavailable | 44.1 | authored work instructions, gates intact"
 * FB-AGT-PREV-02 L95360 "fb-agt-prev-02 | stale, withdrawn or mismatched asset | 44.1 | pinned asset rendered, divergence recorded"
 * FB-AGT-PREV-03 L95361 "fb-agt-prev-03 | duplicate intervention prevention | 44.1 | single render per idempotency key"
 * FB-AGT-DEV-01 L95362 "fb-agt-dev-01 | deviation brief cannot be assembled | 44.2 | deterministic record rendered, hold in force"
 * FB-AGT-DEV-02 L95363 "fb-agt-dev-02 | classification divergence | 44.2 | deterministic band in force, divergence flagged"
 * FB-AGT-DEV-03 L95364 "fb-agt-dev-03 | escalation delivery failure | 44.2 | hold persists, item ages visibly"
 * FB-AGT-SHA-01 L95365 "fb-agt-sha-01 | no handoff brief produced | 44.3 | shift starts on time, honest no-brief state"
 * FB-AGT-SHA-02 L95366 "fb-agt-sha-02 | incomplete source data | 44.3 | partial brief that states it is partial"
 * FB-AGT-SHA-03 L95367 "fb-agt-sha-03 | duplicate or conflicting briefs | 44.3 | multiple honest artifacts, none merged"
 * FB-AGT-VIS-01 L95368 "fb-agt-vis-01 | vision inference unavailable or inconclusive | 44.4 | human inspection, gate unpassed until proof"
 * FB-AGT-VIS-02 L95369 "fb-agt-vis-02 | model rollback and withdrawn versions | 44.4 | previous version in force, outputs marked"
 * FB-AGT-VIS-03 L95370 "fb-agt-vis-03 | one device with a corrupt model | 44.4 | feature disabled on that device only"
 * FB-AI-01 L92793 "identifier | sb-ai-01; fallback contract fb-ai-01; extends fb-agt-prev-01"
 * FB-AI-02 L92876 "identifier | sb-ai-02; fallback contract fb-ai-02; extends fb-agt-prev-01 and fb-agt-dev-01"
 * FB-AI-03 L92960 "identifier | sb-ai-03; fallback contract fb-ai-03; conditional on dec-localai-001"
 * FB-AI-04 L93041 "identifier | sb-ai-04; fallback contract fb-ai-04"
 * FB-AI-05 L93129 "identifier | sb-ai-05; fallback contract fb-ai-05; extends fb-agt-dev-01"
 * FB-AI-06 L93221 "identifier | sb-ai-06; fallback contract fb-ai-06"
 * FB-AI-07 L93305 "identifier | sb-ai-07; fallback contract fb-ai-07"
 * FB-AI-08 L93393 "identifier | sb-ai-08; fallback contract fb-ai-08"
 * FB-AI-09 L93474 "identifier | sb-ai-09; fallback contract fb-ai-09"
 * FB-AI-10 L93566 "identifier | sb-ai-10; fallback contract fb-ai-10; extends fb-agt-prev-02"
 * FB-AI-11 L93645 "identifier | sb-ai-11; fallback contract fb-ai-11; conditional on dec-localai-001"
 * FB-AI-12 L93730 "identifier | sb-ai-12; fallback contract fb-ai-12"
 * FB-AI-13 L93816 "identifier | sb-ai-13; fallback contract fb-ai-13"
 * FB-AI-14 L93901 "identifier | sb-ai-14; fallback contract fb-ai-14"
 * FB-AI-15 L93992 "identifier | sb-ai-15; fallback contract fb-ai-15; shares dec-aidup-001 with fb-agt-prev-03"
 * FB-AI-16 L94073 "identifier | sb-ai-16; fallback contract fb-ai-16; extends fb-agt-vis-02"
 * FB-AI-17 L94157 "identifier | sb-ai-17; fallback contract fb-ai-17; extends fb-agt-vis-03; conditional on dec-localai-001 and dec-vision-004"
 * FB-AI-18 L94240 "identifier | sb-ai-18; fallback contract fb-ai-18"
 * FB-AI-19 L94325 "identifier | sb-ai-19; fallback contract fb-ai-19"
 * FB-AI-20 L94405 "identifier | sb-ai-20; fallback contract fb-ai-20"
 * FB-AI-21 L94486 "identifier | sb-ai-21; fallback contract fb-ai-21; conditional on dec-ask-001"
 * FB-AI-22 L94568 "identifier | sb-ai-22; fallback contract fb-ai-22; instance of fb-agt-vis-01"
 * FB-AI-23 L94663 "identifier | sb-ai-23; fallback contract fb-ai-23"
 * FB-AI-24 L94743 "identifier | sb-ai-24; fallback contract fb-ai-24"
 * FB-AI-25 L94825 "identifier | sb-ai-25; fallback contract fb-ai-25"
 * FB-AI-26 L94907 "identifier | sb-ai-26; fallback contract fb-ai-26; terminal case of fb-agt-prev-01 and fb-ai-04"
 * FB-AI-27 L94991 "identifier | sb-ai-27; fallback contract fb-ai-27"
 * FB-AI-28 L95076 "identifier | sb-ai-28; fallback contract fb-ai-28; extends fb-agt-sha-01"
 * FB-AI-29 L95161 "identifier | sb-ai-29; fallback contract fb-ai-29"
 * FB-AI-30 L95251 "identifier | sb-ai-30; fallback contract fb-ai-30"
 * FB-AI-01 L46951 "fb-ai-01 | artificial-intelligence degraded or unavailable, including the platform emergency pause. fallback is authored content and deterministic behaviour, never silence"
 * FB-AI-01 L74495 "failure, first fallback, fallback failure, terminal safe state, recovery, reconciliation. fb-ai-01. failure: the trace store is unavailable while an agent is running. first fallback: the decision record, which is small and operationally"
 *
 * BLOCK B — the heading that carries the contract in words.
 *
 * 44A.1 L92772 "44a.1 worker asks artificial intelligence while offline"
 * 44A.2 L92855 "44a.2 worker online but cloud artificial intelligence is down"
 * 44A.3 L92940 "44a.3 local artificial intelligence unavailable but cached guidance exists"
 * 44A.4 L93020 "44a.4 no artificial intelligence and no cached guidance"
 * 44A.5 L93105 "44a.5 severity 1 deviation while artificial intelligence is unavailable"
 * 44A.7 L93283 "44a.7 quality manager releases a hold after reconnection"
 * 44A.8 L93370 "44a.8 studio publishes while the tablet is offline"
 * 44A.9 L93453 "44a.9 command center issues an action to an offline device"
 * 44A.10 L93543 "44a.10 artificial intelligence uses an outdated work instruction"
 * 44A.11 L93625 "44a.11 local and cloud artificial intelligence disagree"
 * 44A.12 L93707 "44a.12 worker flags an unsafe response"
 * 44A.13 L93794 "44a.13 an agent action partially succeeds"
 * 44A.14 L93879 "44a.14 an approved artificial-intelligence action expires"
 * 44A.15 L93969 "44a.15 a retry risks a duplicate action"
 * 44A.16 L94050 "44a.16 a bad model is rolled back"
 * 44A.17 L94134 "44a.17 one device has a corrupt model"
 * 44A.18 L94217 "44a.18 artificial intelligence is disabled for one tenant"
 * 44A.19 L94302 "44a.19 platform-wide artificial-intelligence outage"
 * 44A.20 L94384 "44a.20 reconnection fails midway"
 * 44A.21 L94463 "44a.21 a queued question is obsolete"
 * 44A.23 L94630 "44a.23 storage fills with queued artificial-intelligence work"
 * 44A.24 L94722 "44a.24 artificial intelligence recovers but dashboards remain stale"
 * 44A.25 L94802 "44a.25 an offline tablet is suspended or wiped"
 * 44A.26 L94886 "44a.26 the primary artificial-intelligence fallback also fails"
 * 44A.27 L94968 "44a.27 no authorized human is available"
 * 44A.28 L95052 "44a.28 an outage crosses a shift"
 * 44A.29 L95138 "44a.29 recovery occurs after a personnel change"
 * 44A.30 L95221 "44a.30 artificial intelligence conflicts with the official record"
 */
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
