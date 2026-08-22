/**
 * THE EIGHT RUNGS OF THE FALLBACK LADDER — §38.2, L82069 (Level 0) to L82212
 * (the last row of Level 7).
 *
 * Eight levels, each a `Attribute | Specification` table, transcribed
 * header-keyed rather than positionally.
 *
 * ── THIRTEEN ATTRIBUTES, EXCEPT ONCE ───────────────────────────────────────
 * L82067 claims the count: "Each level below carries the thirteen attributes
 * the blueprint commission requires". Levels 0, 1, 3, 4, 5, 6 and 7 each carry
 * thirteen. LEVEL 2 CARRIES FOURTEEN. Counted, not assumed: the table headers
 * are L82071, L82089, L82107, L82126, L82144, L82162, L82180 and L82198, and
 * the row counts under them are 13, 13, 14, 13, 13, 13, 13, 13.
 *
 * THE FOURTEENTH ROW IS NOT NORMALISED AWAY, and this is the whole reason this
 * file transcribes rather than validates. It is `Honest scope note` at L82122,
 * and it reads "Very few AVIIXA dependencies have an approved alternate" —
 * then names the single platform-contracted email vendor, the single audit log
 * per tenant, the single stated deployment region at V1, and the Delivery
 * Operations Hub as sole system of record, each with its own `SoW Fact`
 * citation, and states that none of them has an alternate.
 *
 * That row is the source admitting that Level 2, approved alternate
 * dependency, is mostly theoretical on this platform. Dropping it to make the
 * ladder uniform at thirteen would delete the admission and leave a ladder
 * whose second rung reads as a real option everywhere. So `attributeCount` is
 * per-rung and `DECLARED_LADDER_ATTRIBUTE_COUNT` is the claim, kept separate,
 * and nothing in this build reconciles them.
 *
 * This module is data. It computes nothing and decides nothing.
 */

/** The eight rungs, by the source's own numbering. */
export type FallbackLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

/** One `Attribute | Specification` row, verbatim, both cells. */
export interface LadderAttribute {
  readonly attribute: string
  readonly specification: string
  /**
   * The frozen-source line this row is on. A NUMBER rather than an `L`-string:
   * this file carries one hundred and six of them and the tree's citation
   * lexer would read each as a claim about that line's text.
   */
  readonly line: number
}

export interface LadderRung {
  readonly level: FallbackLevel
  /** The level's name from its own heading, without the `Level N \u2014 ` prefix. */
  readonly name: string
  /** The heading line, verbatim. */
  readonly heading: string
  /** Header-keyed rows, in the source's order. Thirteen, or fourteen at Level 2. */
  readonly attributes: readonly LadderAttribute[]
  readonly headingLine: number
  /** The `| Attribute | Specification |` header row's line. */
  readonly headerLine: number
}

/**
 * What L82067 says every level carries. The array below is what they actually
 * carry. The two are deliberately not reconciled.
 */
export const DECLARED_LADDER_ATTRIBUTE_COUNT = 13

/**
 * The attribute the ladder has at Level 2 and nowhere else, named so a reader
 * finds the exception without counting rows.
 */
export const LEVEL_2_EXTRA_ATTRIBUTE = 'Honest scope note'

export const FALLBACK_LADDER = [
  {
    level: 0,
    name: "primary path",
    heading: "**Level 0 — primary path.**",
    headingLine: 82069,
    headerLine: 82071,
    attributes: [
      { attribute: "Entry trigger", specification: "Normal operation; the system's default state.", line: 82073 },
      { attribute: "Detection", specification: "Continuous health signals, latency and error-rate thresholds held in Observability settings [SoW Fact — §8.1.3].", line: 82074 },
      { attribute: "Retry limit", specification: "Not applicable — no failure has occurred at this level.", line: 82075 },
      { attribute: "Time limit", specification: "Not applicable — the level is unbounded by design.", line: 82076 },
      { attribute: "Authorization", specification: "The function's normal authority model applies unchanged.", line: 82077 },
      { attribute: "Allowed actions", specification: "Every action the function normally permits.", line: 82078 },
      { attribute: "Blocked actions", specification: "Every action the function normally blocks.", line: 82079 },
      { attribute: "Data treatment", specification: "Normal writes with the one-transaction audit guarantee [SoW Fact — §4.10.1].", line: 82080 },
      { attribute: "User message", specification: "None; the absence of a degradation banner is the message.", line: 82081 },
      { attribute: "Responsible role", specification: "The function's normal owner.", line: 82082 },
      { attribute: "Exit condition", specification: "Any of the eight misbehaviours is detected.", line: 82083 },
      { attribute: "Audit", specification: "Ordinary per-action audit.", line: 82084 },
      { attribute: "Test", specification: "`TEST-FB-020` — golden-path regression per function.", line: 82085 },
    ],
  },
  {
    level: 1,
    name: "safe retry or resume",
    heading: "**Level 1 — safe retry or resume.**",
    headingLine: 82087,
    headerLine: 82089,
    attributes: [
      { attribute: "Entry trigger", specification: "A transient error, a timeout, or a missing acknowledgement on an idempotent operation.", line: 82091 },
      { attribute: "Detection", specification: "Error class or timeout expiry at the caller, plus duplicate-detection state at the callee.", line: 82092 },
      { attribute: "Retry limit", specification: "Not specified in the Statement of Work. `TBD — Client Decision Required`, `DEC-FB-001`. **Recommendation — R&D:** a bounded count per dependency class with exponential back-off and jitter, and a circuit breaker that opens after a stated consecutive-failure count. **Benefit:** stops retry storms amplifying an outage. **Cost:** a tuning surface that must be owned. **Client decision required:** yes.", line: 82093 },
      { attribute: "Time limit", specification: "Not specified in the Statement of Work. `TBD — Client Decision Required`, `DEC-FB-001`. **Recommendation — R&D:** a total elapsed budget per operation class, shorter for interactive operations than for background ones, so a worker never watches a spinner longer than the budget.", line: 82094 },
      { attribute: "Authorization", specification: "Unchanged from Level 0; a retry carries the original actor's identity and never elevates.", line: 82095 },
      { attribute: "Allowed actions", specification: "Idempotent re-send, resume of an interrupted transfer, re-read.", line: 82096 },
      { attribute: "Blocked actions", specification: "Retry of any non-idempotent operation without an idempotency key; any retry that would re-execute an approval, a release, or a state transition.", line: 82097 },
      { attribute: "Data treatment", specification: "Nothing is written twice; the idempotency key suppresses duplicates and records the suppression.", line: 82098 },
      { attribute: "User message", specification: "For background operations, none. For interactive operations beyond the interactive threshold, \"Still working — retrying\" with an elapsed time.", line: 82099 },
      { attribute: "Responsible role", specification: "Automated; no human role is engaged at this level.", line: 82100 },
      { attribute: "Exit condition", specification: "Success, or limit reached, or the circuit breaker opening.", line: 82101 },
      { attribute: "Audit", specification: "Retry counts are telemetry; a circuit-breaker opening is an audited platform event.", line: 82102 },
      { attribute: "Test", specification: "`TEST-FB-021` — inject a lost acknowledgement and assert exactly one server-side effect after retry.", line: 82103 },
    ],
  },
  {
    level: 2,
    name: "approved alternate dependency",
    heading: "**Level 2 — approved alternate dependency.**",
    headingLine: 82105,
    headerLine: 82107,
    attributes: [
      { attribute: "Entry trigger", specification: "Level 1 exhausted and the contract names an approved alternate.", line: 82109 },
      { attribute: "Detection", specification: "Health of the alternate is checked before switching, so the platform does not fail over into a second failure.", line: 82110 },
      { attribute: "Retry limit", specification: "Inherits the Level 1 register value for the alternate. `TBD — Client Decision Required`, `DEC-FB-001`.", line: 82111 },
      { attribute: "Time limit", specification: "The switch decision itself must be bounded; `TBD — Client Decision Required`, `DEC-FB-001`. **Recommendation — R&D:** the failover decision budget should be materially shorter than the operation budget, so failover is not itself the source of the delay.", line: 82112 },
      { attribute: "Authorization", specification: "The alternate operates under the same authority model; an alternate that cannot enforce the same authorization is not an approved alternate.", line: 82113 },
      { attribute: "Allowed actions", specification: "The same operations the primary supports, with the same validation.", line: 82114 },
      { attribute: "Blocked actions", specification: "Any operation the alternate cannot validate identically; failing over to a weaker validator is prohibited under prohibition four and six.", line: 82115 },
      { attribute: "Data treatment", specification: "Writes must remain in one logical record; a split-brain write across primary and alternate is prohibited under prohibition nine.", line: 82116 },
      { attribute: "User message", specification: "\"Operating on a secondary route\" with the start time, where the difference is user-visible.", line: 82117 },
      { attribute: "Responsible role", specification: "Automated, with notification to the client's platform operations team.", line: 82118 },
      { attribute: "Exit condition", specification: "Primary health restored and confirmed for a stated stability period.", line: 82119 },
      { attribute: "Audit", specification: "Failover and failback are both audited platform events.", line: 82120 },
      { attribute: "Test", specification: "`TEST-FB-022` — force primary failure, assert failover, assert identical validation on the alternate, assert failback.", line: 82121 },
      { attribute: "Honest scope note", specification: "Very few AVIIXA dependencies have an approved alternate. The single platform-contracted email vendor [SoW Fact — §4.11.2], the single audit log per tenant [SoW Fact — §1.4], the single stated deployment region at V1 [SoW Fact — §8.7.2 settings table, Memory and Data row], and the Delivery Operations Hub as sole system of record [SoW Fact — §1.2, §1.4] each have none. Chapter 39, No-Single-Point-of-Failure Analysis, treats each of them by name.", line: 82122 },
    ],
  },
  {
    level: 3,
    name: "last-known-good approved mode",
    heading: "**Level 3 — last-known-good approved mode.**",
    headingLine: 82124,
    headerLine: 82126,
    attributes: [
      { attribute: "Entry trigger", specification: "No alternate exists or the alternate failed, and a validated cached or pinned artefact is available.", line: 82128 },
      { attribute: "Detection", specification: "The artefact's age and validity are evaluated against its own freshness rule before use.", line: 82129 },
      { attribute: "Retry limit", specification: "Not applicable — this level does not call the failed dependency; the retry continues in the background at Level 1's budget.", line: 82130 },
      { attribute: "Time limit", specification: "Bounded by the artefact's own trust window. Two such windows exist in the source: the offline credential and clearance trust window, approximately 24 hours with a platform ceiling of 72 hours, tenant-set [SoW Fact — §1.7]; and the clock-skew threshold, approximately 5 minutes with a ceiling of 60 minutes [SoW Fact — §1.7]. For artefacts with no source-stated window: `TBD — Client Decision Required`, `DEC-FB-001`.", line: 82131 },
      { attribute: "Authorization", specification: "Cached authorization is honoured only inside its trust window and only for the scope it was cached with; it never widens.", line: 82132 },
      { attribute: "Allowed actions", specification: "Read and execute against pinned work packages; continue an in-flight run on its pinned version [SoW Fact — §2.4].", line: 82133 },
      { attribute: "Blocked actions", specification: "Any action requiring a fresh authorization decision after the trust window expires; any presentation of cached data without its age.", line: 82134 },
      { attribute: "Data treatment", specification: "Reads only, from cache; writes continue to be queued durably for the primary.", line: 82135 },
      { attribute: "User message", specification: "The data's age, always. \"Synced 13:58 · 2 of 9 devices offline · 14 captures pending\" is the source's own pattern [SoW Fact — §6.2.3].", line: 82136 },
      { attribute: "Responsible role", specification: "Automated; the Tenant Admin is banner-notified at the 60-minute connectivity threshold [SoW Fact — §4.13.1].", line: 82137 },
      { attribute: "Exit condition", specification: "Dependency restored, or trust window expired.", line: 82138 },
      { attribute: "Audit", specification: "Entry into last-known-good mode is audited with the artefact's age.", line: 82139 },
      { attribute: "Test", specification: "`TEST-FB-023` — assert every cached render carries an age; assert expiry of the trust window blocks the dependent action rather than extending it.", line: 82140 },
    ],
  },
  {
    level: 4,
    name: "deterministic or manual workflow",
    heading: "**Level 4 — deterministic or manual workflow.**",
    headingLine: 82142,
    headerLine: 82144,
    attributes: [
      { attribute: "Entry trigger", specification: "No cache, expired cache, or an artefact that cannot be trusted.", line: 82146 },
      { attribute: "Detection", specification: "Explicit; the system knows it has no valid data path and says so.", line: 82147 },
      { attribute: "Retry limit", specification: "Not applicable — the work is being done by rules or by people, not by the failed dependency.", line: 82148 },
      { attribute: "Time limit", specification: "The tenant's own operational limits govern; the platform imposes none. Where a manual period must end for data-integrity reasons — for example before a run's finish window elapses at the tenant's default of 48 hours [SoW Fact — §1.7] — the contract states it.", line: 82149 },
      { attribute: "Authorization", specification: "Unchanged and enforced. On the device, the deterministic layer enforces the same gates it always enforces [SoW Fact — §7.9.4]. Manual work is performed only by the role the contract names.", line: 82150 },
      { attribute: "Allowed actions", specification: "On-device deterministic gating, detection and classification; authored Work Instructions as the coaching fallback [SoW Fact — §7.9.1]; the approved manual forms of section 38.6.", line: 82151 },
      { attribute: "Blocked actions", specification: "Uncontrolled spreadsheets, personal devices, personal email, universal-serial-bus drives, and loose paper — all explicitly prohibited, with reasons given in section 38.6.", line: 82152 },
      { attribute: "Data treatment", specification: "Manual records are entered later with full provenance: who did the work, who entered it, when it was done, when it was entered, and against which approved form.", line: 82153 },
      { attribute: "User message", specification: "Plain statement of what is unavailable and what the person should do instead, naming the approved form.", line: 82154 },
      { attribute: "Responsible role", specification: "Named per contract; typically Supervisor for operational continuity and Quality Manager for any quality disposition.", line: 82155 },
      { attribute: "Exit condition", specification: "Dependency restored and the manual record entered and reconciled.", line: 82156 },
      { attribute: "Audit", specification: "The manual episode is an audited object with a start, an end, an operator, and a reconciliation outcome.", line: 82157 },
      { attribute: "Test", specification: "`TEST-FB-024` — run a full manual episode in a test tenant and assert the reconciliation produces a complete, provenance-marked record with no silent gaps.", line: 82158 },
    ],
  },
  {
    level: 5,
    name: "authorized human escalation",
    heading: "**Level 5 — authorized human escalation.**",
    headingLine: 82160,
    headerLine: 82162,
    attributes: [
      { attribute: "Entry trigger", specification: "The manual or deterministic path cannot proceed, or a decision is required that only a person may take.", line: 82164 },
      { attribute: "Detection", specification: "The contract's decision point is reached with no automated resolution available.", line: 82165 },
      { attribute: "Retry limit", specification: "Re-notification rather than retry: unacknowledged critical notifications re-notify after 4 hours, or 1 hour in Regulated-Industry mode [SoW Fact — §1.7, §3.9].", line: 82166 },
      { attribute: "Time limit", specification: "Gate-item timeouts of 10 minutes for Severity 1 and 30 minutes for others, configurable per severity level [SoW Fact — §1.7]. For non-gate escalations no limit is stated: `TBD — Client Decision Required`, `DEC-FB-005`.", line: 82167 },
      { attribute: "Authorization", specification: "Escalation routing is keyed by severity to roles, never to individuals [SoW Fact — §3.9]. Authority is unchanged by the escalation; a Supervisor who could not release a lot before cannot release one now.", line: 82168 },
      { attribute: "Allowed actions", specification: "Acknowledge; decide within the decider's existing authority; request the decision of a higher authority.", line: 82169 },
      { attribute: "Blocked actions", specification: "Self-approval; approval by the creator; any decision outside the decider's role authority; any decision the Command Center's closed set of ten actions does not contain [SoW Fact — §6.14.2].", line: 82170 },
      { attribute: "Data treatment", specification: "The decision is recorded on the record it concerns, with the identity of the decider and the reason where the action is reason-required.", line: 82171 },
      { attribute: "User message", specification: "The escalation states what is needed, from whom, by when, and what happens if no decision arrives.", line: 82172 },
      { attribute: "Responsible role", specification: "Resolved at runtime by the Delivery Operations Hub from roles to the people on shift; where no holder of the target role is on shift, the platform default escalates to the tenant's Quality Manager role irrespective of shift, marked as a fallback delivery — carried as an open drafting item, `DEC-NOSHIFT-001` [SoW Fact — §3.9].", line: 82173 },
      { attribute: "Exit condition", specification: "Acknowledgement plus decision; acknowledgement alone is not resolution [SoW Fact — §3.9].", line: 82174 },
      { attribute: "Audit", specification: "Acknowledged and resolved are distinct, timestamped states; fallback deliveries are visibly marked [SoW Fact — §3.9].", line: 82175 },
      { attribute: "Test", specification: "`TEST-FB-025` — simulate no eligible recipient on shift and assert the fallback delivery fires, is marked as a fallback, and is not silently dropped.", line: 82176 },
    ],
  },
  {
    level: 6,
    name: "controlled hold or safe stop",
    heading: "**Level 6 — controlled hold or safe stop.**",
    headingLine: 82178,
    headerLine: 82180,
    attributes: [
      { attribute: "Entry trigger", specification: "No permitted degraded mode remains, or continuing would sacrifice a higher priority item.", line: 82182 },
      { attribute: "Detection", specification: "Explicit decision by the contract's logic or by the escalated role.", line: 82183 },
      { attribute: "Retry limit", specification: "Not applicable — the platform has stopped trying by design, and background health checks continue independently.", line: 82184 },
      { attribute: "Time limit", specification: "None. A controlled hold persists until a human resolves it; this is deliberate, because an automatically expiring safety stop would be a safety stop that expires.", line: 82185 },
      { attribute: "Authorization", specification: "Exit from a hold requires the authority that governs the held object. A Severity 1 lot hold is released by the Quality Manager only, uniformly [SoW Fact — §3.3, §3.4].", line: 82186 },
      { attribute: "Allowed actions", specification: "Read; acknowledge; prepare the resolution; work that is genuinely unaffected — the scope of the stop is always as narrow as the failure permits.", line: 82187 },
      { attribute: "Blocked actions", specification: "Any progression of the held work; any workaround that would produce an unaudited or unqualified record.", line: 82188 },
      { attribute: "Data treatment", specification: "Everything already captured is preserved. Nothing captured during the hold is discarded; captures continue to be committed locally on devices even when they cannot be uploaded [SoW Fact — §7.10].", line: 82189 },
      { attribute: "User message", specification: "For the compliance-suspension case the message is fixed verbatim: \"Operation suspended. Contact your supervisor. Your work has been saved.\" [SoW Fact — §4.2.3]. For other holds, a plain statement of what is stopped, why, who can lift it, and that captured work is safe.", line: 82190 },
      { attribute: "Responsible role", specification: "The role named in the contract; for quality dispositions the Quality Manager, for operational continuity the Supervisor, for platform-wide states the client's platform operations team.", line: 82191 },
      { attribute: "Exit condition", specification: "The authorised human act that lifts the hold, plus confirmation that the underlying cause is resolved.", line: 82192 },
      { attribute: "Audit", specification: "Entry, the reason, every acknowledgement, and the lifting act are all audited under the one-transaction guarantee.", line: 82193 },
      { attribute: "Test", specification: "`TEST-FB-026` — assert that a controlled hold cannot be lifted by any role other than the one named, including by the Root Super Admin where the object is a tenant Severity 1 lot hold.", line: 82194 },
    ],
  },
  {
    level: 7,
    name: "recovery and reconciliation",
    heading: "**Level 7 — recovery and reconciliation.**",
    headingLine: 82196,
    headerLine: 82198,
    attributes: [
      { attribute: "Entry trigger", specification: "The dependency is restored, or the manual episode has completed, or the hold has been lifted.", line: 82200 },
      { attribute: "Detection", specification: "Health confirmed for a stability period before drain begins, so the platform does not flap.", line: 82201 },
      { attribute: "Retry limit", specification: "Drain uses the Level 1 register with back-pressure. `TBD — Client Decision Required`, `DEC-FB-001`.", line: 82202 },
      { attribute: "Time limit", specification: "Reconciliation must complete before the affected run's finish window elapses where run data is involved — tenant-configurable, default 48 hours, floor 24 hours, ceiling 7 days [SoW Fact — §1.7, §4.6.8], noting `DEC-FINISH-001` on the bounds' settled status.", line: 82203 },
      { attribute: "Authorization", specification: "Reconciliation writes carry the identity of the original actor for captures and the identity of the reconciling operator for corrections; the two are never merged.", line: 82204 },
      { attribute: "Allowed actions", specification: "Idempotent replay; duplicate suppression; conflict routing to the Command Center sync-conflict panel; append-only correction records; audited recompute after finish [SoW Fact — §4.7.4, §6.2.5].", line: 82205 },
      { attribute: "Blocked actions", specification: "Silent overwrite; back-dating; deletion of a duplicate without a suppression record; re-finalisation of a finished record by any route other than the audited recompute.", line: 82206 },
      { attribute: "Data treatment", specification: "Late captures inside the finish window fold in flagged `late_arrival`; after finish, the audited-recompute rule applies and the prior computed output is preserved [SoW Fact — §2.4, §4.7.4].", line: 82207 },
      { attribute: "User message", specification: "Reconciliation outcomes are visible: recomputed figures carry a late-data indicator and the reviewing Quality Manager is notified [SoW Fact — §4.7.4].", line: 82208 },
      { attribute: "Responsible role", specification: "Automated for replay and duplicate suppression; Quality Manager and above for conflict resolution [SoW Fact — §6.14.2 action five]; Supervisors view only.", line: 82209 },
      { attribute: "Exit condition", specification: "Every queued item is accounted for as applied, suppressed, quarantined, or dead-lettered; the reconciliation record is written.", line: 82210 },
      { attribute: "Audit", specification: "Every recompute is logged; every conflict event is fully audited in the Delivery Operations Hub [SoW Fact — §4.7.1, §4.13.2].", line: 82211 },
      { attribute: "Test", specification: "`TEST-FB-027` — after a simulated two-hour outage, assert that the count of committed-locally captures equals applied plus suppressed plus quarantined plus dead-lettered, with zero unaccounted.", line: 82212 },
    ],
  },
] as const satisfies readonly LadderRung[]

const BY_LEVEL = new Map<FallbackLevel, LadderRung>(FALLBACK_LADDER.map((r) => [r.level, r]))

/**
 * One rung, or `undefined` where the array does not carry it. `undefined`
 * rather than a stand-in record: unlike the decision canon there is nothing
 * honest to render in a rung's place, and `fallback-contracts.test.ts` holds
 * that all eight are present, so the branch cannot be reached in this build.
 */
export function ladderRung(level: FallbackLevel): LadderRung | undefined {
  return BY_LEVEL.get(level)
}

/**
 * The rung a level's specification for one attribute lives on, header-keyed.
 * Returns `undefined` where that level does not carry that attribute — which
 * is the whole of the Level 2 exception and is why this is a lookup rather
 * than an index.
 */
export function ladderSpecification(
  level: FallbackLevel,
  attribute: string,
): string | undefined {
  return BY_LEVEL.get(level)?.attributes.find((a) => a.attribute === attribute)?.specification
}
