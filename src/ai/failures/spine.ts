/**
 * THE SHARED RESPONSE SPINE — SECTION 43.1.1, THE DEFAULTS EVERY CATALOGUED
 * FAILURE INHERITS.
 *
 * The source's inheritance model, at L89913: "An attribute may inherit,
 * deviate, or be owed, and the third is the one that matters most on this
 * platform: where the Statement of Work names a control without setting a
 * value, the attribute leaves the contract and enters the open register as a
 * decision with an owner, rather than being filled in with a plausible number
 * that would later be quoted as contractual."
 *
 * `AC-43-101` (L89973) is what that model owes: every catalogued row either
 * inherits a spine default or states its deviation explicitly, and no row
 * leaves an attribute unstated. `TEST-43-101` (L89979) is the completeness
 * lint. Both are discharged in `./catalogue`, which resolves each item of this
 * spine for each catalogued row.
 *
 * ── THE SPAN WAS MEASURED, NOT CARRIED ─────────────────────────────────────
 * The re-plan's span for this list begins at item 10 and runs past the last
 * item into a mermaid fence. The span used here was measured by opening it,
 * and `tests/unit/ai-failures.test.ts` re-measures it at run time: every line
 * in the span is a numbered item, and the line on each side of it is not.
 *
 * Item 2 is the operational severity bands, at L89927. Item 12 is Roles, at
 * L89937 — which is the line the re-plan gives for the severity bands.
 *
 * Every `spineDefault` below is the remainder of its own source line,
 * verbatim, and the test rebuilds the line from the record and compares it
 * whole. Nothing here is a paraphrase.
 */

export type SpineItemNumber =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11
  | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21

/**
 * Declared as a literal list rather than derived from `RESPONSE_SPINE`. A
 * population derived from the array it polices shrinks with it, and the
 * completeness gate would keep passing over the smaller set.
 */
export const SPINE_ITEM_NUMBERS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
] as const satisfies readonly SpineItemNumber[]

/**
 * How the source files its own items, at L89983. Kept as the source's three
 * groupings rather than flattened, because "`Derived Clarification` or `TBD —
 * Client Decision Required` as marked" is a different claim from either half
 * of it, and collapsing it would assert something the source did not.
 */
export type SpineClassification =
  | 'SoW Fact'
  | 'Derived Clarification'
  | 'Derived Clarification or TBD — Client Decision Required'

export interface SpineItem {
  readonly item: SpineItemNumber
  /** The bolded lead of the item's own line, without its full stop. */
  readonly name: string
  readonly locator: string
  readonly classification: SpineClassification
  /** The rest of the item's line, verbatim. */
  readonly spineDefault: string
}

export const RESPONSE_SPINE = [
  { item: 1, name: "Detection", locator: 'L89926', classification: "Derived Clarification", spineDefault: "Every failure has an automated detector; no failure relies on a human noticing. Detectors draw on the alert thresholds already scoped in Observability settings — latency, error rate, evaluation failures, cost and budget breach — plus schema validation, queue depth, heartbeat, and the drift canary. [SoW Fact — §8.7.1 Observability, §8.5.3]" },
  { item: 2, name: "Severity", locator: 'L89927', classification: "Derived Clarification or TBD — Client Decision Required", spineDefault: "Operational severity is platform-side and distinct from the tenant-facing manufacturing severity catalog. Four bands are used in the catalog: **Critical** (tenant-visible loss of an artificial-intelligence capability across a surface), **Major** (degradation with a working fallback), **Minor** (self-healing within the retry budget), **Informational** (recorded, no user-visible effect). `Derived Clarification` — the source defines no operational severity scale, and reusing the manufacturing catalog for platform incidents would corrupt a quality-critical vocabulary." },
  { item: 3, name: "Exact user-visible message", locator: 'L89928', classification: "Derived Clarification", spineDefault: "Every message in this chapter is a `Recommendation — R&D` draft string requiring client approval, and every one must exist as an authored English and Spanish variant in the versioned locale pack, because a pack with untranslated keys fails publication rather than shipping gaps to a floor. [SoW Fact — §8.7.3] The single exception is the compliance-suspension string, which is fixed verbatim: \"Operation suspended. Contact your supervisor. Your work has been saved.\" [SoW Fact — §4.2.3, §7.11]" },
  { item: 4, name: "Confidence or validation gate", locator: 'L89929', classification: "SoW Fact", spineDefault: "No artificial-intelligence output reaches any surface without passing the hard evaluation gate and the platform's guardrails, and no capability enables with pending or failing scenarios. [SoW Fact — §8.5.1] Output that fails validation is suppressed, never rendered with a caveat." },
  { item: 5, name: "Retry limit", locator: 'L89930', classification: "Derived Clarification or TBD — Client Decision Required", spineDefault: "`Not specified in the Statement of Work` for every artificial-intelligence path. See section 43.1.2." },
  { item: 6, name: "Circuit breaker", locator: 'L89931', classification: "Derived Clarification or TBD — Client Decision Required", spineDefault: "`Not specified in the Statement of Work`. The source names \"failover thresholds\" as a Model and Inference control but fixes no value. [SoW Fact — §8.7.1] See section 43.1.2." },
  { item: 7, name: "Alternate provider or model", locator: 'L89932', classification: "Derived Clarification or TBD — Client Decision Required", spineDefault: "The source establishes four generic router roles — primary, fallback, lightweight, and embedding — and names failover thresholds as a control, which establishes that a fallback role exists; it does not state a failover policy. [SoW Fact — §8.7.1] The policy is `Recommendation — R&D` under `DEC-AIFAILOVER-001`." },
  { item: 8, name: "Deterministic fallback", locator: 'L89933', classification: "SoW Fact", spineDefault: "Always the same: the on-device deterministic layer plus the authored Work Instructions and packaged assets. It is never unavailable, because it never depended on the failing component. [SoW Fact — §7.9.1, §7.12]" },
  { item: 9, name: "Human fallback", locator: 'L89934', classification: "SoW Fact", spineDefault: "Always the authored escalation path: roles, never individuals, resolved server-side to people on shift, with the nobody-on-shift default carried open as `DEC-NOSHIFT-001`. [SoW Fact — §3.9]" },
  { item: 10, name: "Fallback of fallback", locator: 'L89935', classification: "Derived Clarification or TBD — Client Decision Required", spineDefault: "Deterministic no-artificial-intelligence mode, `AIMODE-07`." },
  { item: 11, name: "Terminal safe state", locator: 'L89936', classification: "Derived Clarification", spineDefault: "Deterministic execution continues where it is safe; where it is not, a controlled hold or safe stop. A hold is a valid ending. [Canon fallback ladder; consistent with `SoW Fact — §3.3` Severity 1 floor.]" },
  { item: 12, name: "Roles", locator: 'L89937', classification: "SoW Fact", spineDefault: "Detection and platform response belong to the client's platform team — Platform Engineer as maker, Admin as approver, root for critical class. [SoW Fact — §8.8.3] Tenant-side response belongs to the Supervisor for acknowledgement and reassignment, and to the Quality Manager for gate decisions, evidence review, and hold release. No platform role ever takes a tenant operational decision. [SoW Fact — §8, \"Not in this console\"]" },
  { item: 13, name: "Five-surface behaviour", locator: 'L89938', classification: "Derived Clarification", spineDefault: "Defined once per surface in section 43.3 and inherited by every row." },
  { item: 14, name: "Partial-output treatment", locator: 'L89939', classification: "Derived Clarification", spineDefault: "Quarantined, never published, never discarded. A partial output is retained with its trace for engineering and audit, and is excluded from every official record and every summary." },
  { item: 15, name: "Data preservation", locator: 'L89940', classification: "SoW Fact", spineDefault: "Nothing is discarded, overwritten, or silently re-run. Captures and evidence are immutable at creation; corrections are append-only annotations carrying who, when, and what changed. [SoW Fact — Part I evidence rule, §7.8]" },
  { item: 16, name: "Recovery", locator: 'L89941', classification: "SoW Fact", spineDefault: "Automatic where the failing component recovers; approval-cycled where a configuration or version change is required. [SoW Fact — §8.8.3]" },
  { item: 17, name: "Reconciliation", locator: 'L89942', classification: "SoW Fact", spineDefault: "Derived data recomputes with an as-of stamp; late captures fold in flagged `late_arrival` inside the record-finish window; audited recompute applies after finish; no number a supervisor may have acted on is silently rewritten. [SoW Fact — §2.4, §6.2.5]" },
  { item: 18, name: "Rollback", locator: 'L89943', classification: "SoW Fact", spineDefault: "Version and configuration changes roll back through the same approval cycle that applied them, with the evaluation gate re-asserted before the target version serves. [SoW Fact — §8.5.1, §8.8.3]" },
  { item: 19, name: "Audit", locator: 'L89944', classification: "SoW Fact", spineDefault: "The action and its audit event commit in the same transaction: an action that cannot be audited does not happen. [SoW Fact — §4.10.1, §8.18]" },
  { item: 20, name: "Monitoring", locator: 'L89945', classification: "SoW Fact", spineDefault: "Every failure has a metric, a threshold, and an owner. Cross-tenant recurrence is a platform incident, not a set of tenant problems. [SoW Fact — §8.1.3]" },
  { item: 21, name: "Acceptance tests", locator: 'L89946', classification: "Derived Clarification", spineDefault: "Every failure has at least one fault-injection test in the suite of `TEST-43-001`." },
] as const satisfies readonly SpineItem[]

const BY_ITEM = new Map<SpineItemNumber, SpineItem>(RESPONSE_SPINE.map((i) => [i.item, i]))

/**
 * Total over the declared item numbers. It throws rather than returning a
 * stand-in, because every caller reaches it through `SPINE_ITEM_NUMBERS` and a
 * miss would mean the two lists had drifted -- a build defect, not a state a
 * screen should render.
 */
export function spineItem(item: SpineItemNumber): SpineItem {
  const found = BY_ITEM.get(item)
  if (!found) throw new Error(`No spine item is registered for item ${String(item)}.`)
  return found
}
