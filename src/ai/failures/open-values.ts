/**
 * THE GOVERNING VALUES THE SOURCE NAMES AS CONTROLS AND SETS FOR NONE.
 *
 * Section §43.1.2 lists the retry limits, timeouts, breaker thresholds, queue
 * ceilings, confidence floors and token ceilings that govern every
 * artificial-intelligence path on this platform, and fixes not one of them.
 * The source is explicit about why, at L90008: each "would, if written as a
 * number in this blueprint, be quoted in a functional specification, then in a
 * test plan, then in a service-level conversation."
 *
 * So there is no value in this module, and no place to put one. Every entry
 * carries the question, the state `SB-43-102` (L90030) fixes — "Not yet set —
 * client decision `DEC-*`" — and the refusal `AC-43-111` (L90038) requires.
 * `AC-43-112` (L90039) is what forbids the alternative, and `TEST-43-112`
 * (L90045) is the default-scan; this file is scanned by
 * `tests/unit/ai-open-values.test.ts` for a digit and for a spelled-out value,
 * because a seeded default arrives in either spelling and the digit rule alone
 * was measured missing the word form.
 *
 * ── IT CONSUMES THE CANON, IT DOES NOT RESTATE IT ──────────────────────────
 * The register's records — the question, every reading, the source's own
 * recommendation labelled as one, the adopted position — live in
 * `@/disclosure/decisions`, registered by this wave's decision-canon task. A
 * second copy here would be a second thing to keep true. What this module adds
 * is the register's own ordering, the value each row owes in the register's
 * own words, and the refusal.
 *
 * ── THE REFUSAL IS THE FEATURE, AND IT IS NOT UNCONDITIONAL ────────────────
 * `enablementRefusal` answers for a named capability and the register values
 * that govern it. It refuses whenever any of them is unset — which is all of
 * them, in this build — and it answers `null` for a capability the register
 * does not govern at all. A function that refused everything would say nothing
 * about governance.
 */

import { decisionRecord, type DecisionId, type OpenDecision } from '@/disclosure/decisions'

/**
 * The register's rows, in the register's own order, declared as a literal
 * list. Not filtered off the decision canon: a population derived from the
 * array it is meant to police can only ever agree with it.
 */
export const AI_OPEN_REGISTER_IDS = [
  'DEC-AIRETRY-001',
  'DEC-AITIMEOUT-001',
  'DEC-AICB-001',
  'DEC-AIFAILOVER-001',
  'DEC-AIQUEUE-001',
  'DEC-AISTALE-001',
  'DEC-AICONF-001',
  'DEC-AIQUAR-001',
  'DEC-AIREPLAY-001',
  'DEC-AITOKEN-001',
] as const satisfies readonly DecisionId[]

export type AiGoverningValueId = (typeof AI_OPEN_REGISTER_IDS)[number]

export interface UnsetGoverningValue {
  readonly id: AiGoverningValueId
  /** The register's `Value owed` cell, verbatim. */
  readonly valueOwed: string
  /** The row's own line in the frozen source. */
  readonly locator: string
  /** The state `SB-43-102` fixes, with the wildcard resolved to this row's identifier. */
  readonly state: string
  /** The canon's record. Held by reference; never copied. */
  readonly decision: OpenDecision
}

/**
 * The `Value owed` column, verbatim and in the register's order. There is no
 * sibling field holding a number, a range, or a starting position — the
 * absence is the design, and the default-scan is what keeps it true.
 */
const VALUES_OWED: readonly { readonly id: AiGoverningValueId; readonly valueOwed: string; readonly locator: string }[] = [
  { id: 'DEC-AIRETRY-001', valueOwed: 'Retry limit and backoff for a failing model call', locator: 'L89997' },
  { id: 'DEC-AITIMEOUT-001', valueOwed: 'Orchestrator loop timeout and max plan steps', locator: 'L89998' },
  {
    id: 'DEC-AICB-001',
    valueOwed: 'Circuit-breaker open threshold, open duration, and half-open probe policy',
    locator: 'L89999',
  },
  {
    id: 'DEC-AIFAILOVER-001',
    valueOwed: 'Approved alternate provider and model failover policy',
    locator: 'L90000',
  },
  {
    id: 'DEC-AIQUEUE-001',
    valueOwed:
      'Queue-depth ceiling and back-pressure policy for queued artificial-intelligence requests, per device and per tenant',
    locator: 'L90001',
  },
  {
    id: 'DEC-AISTALE-001',
    valueOwed: 'Answerable horizon and answer presentability horizon',
    locator: 'L90002',
  },
  {
    id: 'DEC-AICONF-001',
    valueOwed: 'Confidence or relevance floor for corpus retrieval, and the suppression rule below it',
    locator: 'L90003',
  },
  {
    id: 'DEC-AIQUAR-001',
    valueOwed: 'Model quarantine policy — entry criteria, scope, duration, exit criteria',
    locator: 'L90004',
  },
  {
    id: 'DEC-AIREPLAY-001',
    valueOwed: 'Safe replay policy — what may be re-run after recovery, and what must never be',
    locator: 'L90005',
  },
  {
    id: 'DEC-AITOKEN-001',
    valueOwed: 'Per-tenant token ceiling values and the behaviour at breach',
    locator: 'L90006',
  },
]

export const UNSET_GOVERNING_VALUES: readonly UnsetGoverningValue[] = VALUES_OWED.map((row) => ({
  ...row,
  state: `Not yet set — client decision ${row.id}`,
  decision: decisionRecord(row.id),
}))

const BY_ID = new Map<AiGoverningValueId, UnsetGoverningValue>(
  UNSET_GOVERNING_VALUES.map((v) => [v.id, v]),
)

export function governingValue(id: AiGoverningValueId): UnsetGoverningValue {
  const found = BY_ID.get(id)
  if (!found) throw new Error(`No governing value is registered for ${id}.`)
  return found
}

export interface EnablementRefusal {
  /** The capability the caller asked about, as the caller named it. */
  readonly capability: string
  /** Every governing value that is unset. In this build, all of them. */
  readonly unset: readonly AiGoverningValueId[]
  /** What a surface shows instead of an enablement control. */
  readonly refusal: string
}

/**
 * `AC-43-111`. Answers `null` where the register governs nothing about the
 * capability, and a refusal otherwise — naming every unset value, because a
 * refusal a client cannot trace back to a decision is a dead end rather than a
 * disclosure.
 *
 * There is no path through this function that enables anything. That is not an
 * oversight: no register value can be set in this build, so a code path that
 * pretended one could would be a path nothing ever exercises and nothing ever
 * checks.
 */
export function enablementRefusal(
  capability: string,
  governedBy: readonly AiGoverningValueId[],
): EnablementRefusal | null {
  const unset = governedBy.map((id) => governingValue(id).id)
  // Destructured rather than compared against a length, because this file is
  // scanned for digits and a numeric comparison is indistinguishable from a
  // seeded value to any scan simple enough to be trusted.
  const [governed] = unset
  if (governed === undefined) return null
  return {
    capability,
    unset,
    refusal:
      `${capability} cannot be enabled: the values that govern it are not set. ` +
      unset.map((id) => `${governingValue(id).valueOwed} — ${governingValue(id).state}.`).join(' ') +
      ' The platform refuses rather than applying a default, because a default written here would ' +
      'be read as a value the client chose.',
  }
}
