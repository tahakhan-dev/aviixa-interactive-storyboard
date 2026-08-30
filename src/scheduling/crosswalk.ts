/**
 * THE DISCOVERY-TO-DEPLOYMENT CROSSWALK — the mechanism the source publishes for
 * its own two-register problem, plus the one collision it does not know about.
 *
 * ── WHAT L102392 SETTLES, IN ITS OWN WORDS ─────────────────────────────────
 * The plan that dispatched this work carried the card-versus-crosswalk conflict
 * as a C1 contradiction: six findings hold a field-complete card in §45A.8 AND
 * are classified "not a scheduled obligation" in §45A.17.2. IT IS NOT A
 * CONTRADICTION, and the line that says so is L102392, read whole:
 *
 *   §45A.2 "carries the *discovery* register: `SCHED-001` through `SCHED-035`,
 *   one row per candidate found by sweeping every surface, module and feature
 *   for time-based behaviour. Its job is to prove nothing was missed, and it
 *   includes candidates that turned out **not** to be scheduled obligations at
 *   all. This section carries the *deployable* register … The two are not
 *   competing lists and neither supersedes the other: a numbered row is a
 *   finding, a mnemonic row is a commitment."
 *
 * A field-complete card for a non-obligation is what the discovery register is
 * FOR. The sweep's value is that it records what it found in full and THEN
 * classifies it, so a reader can see the reasoning rather than an absence. All
 * six cards agree with their crosswalk row in their own text, and each says so
 * in the fields where a real timer would have to say something else — see
 * `CARD_VERSUS_CROSSWALK` below, which carries the agreement rather than a
 * conflict, with the card field that carries it.
 *
 * L102465 states the resolution rule and it has exactly three outcomes: a
 * finding maps to a commitment, maps to one already carried, or is classified
 * not a scheduled obligation with the mechanism that carries the behaviour
 * instead. `AC-SCHED-383` (L102543) makes that last clause testable.
 *
 * ── WHAT L102392 DOES NOT SETTLE ───────────────────────────────────────────
 * It opens "stated plainly because two numbering schemes exist". Four exist.
 * Three of the four are reconciled — two by this crosswalk and the third,
 * §30A.3's, by the narrative-short-form ruling at L102537. The fourth, §54.7's
 * Matrix 14, is reconciled by nothing: chapter 45A never names it and it never
 * names chapter 45A. `MATRIX_14_UNRECONCILED` carries the six rows where the two
 * registers give opposite answers, and settles none of them.
 *
 * ── `DEC-SCHED-011` IS NOT DISCLOSED HERE, DELIBERATELY ────────────────────
 * Its three readings — it does not exist, it is open, it is closed — live in one
 * place, `src/disclosure/decisions.ts`, because a decision is a property of the
 * source and a second home is how one reading drifts out of step with another.
 * This module holds only what the canon cannot: the crosswalk that reading (c)
 * names as the thing that closed it. `CROSSWALK` is that artefact. It is built
 * and rendered without any of the three readings being true, which is the whole
 * point — see `DEC_SCHED_011_INDEPENDENCE`.
 */

import {
  DEPLOYABLE_OBLIGATIONS,
  DISCOVERY_FINDINGS,
  type DeployableObligationId,
  type DiscoveryFindingId,
  type Matrix14ScheduleId,
} from './registers'

/* ── the crosswalk, thirty-five rows, L102492-L102526 ──────────────────────── */

/**
 * One resolved finding. `obligation` is `null` exactly when the finding is
 * classified not a scheduled obligation, and in that case `resolution` names the
 * mechanism that carries the behaviour instead — which `AC-SCHED-383` requires
 * and `slice-10-scheduled-work.test.ts` asserts of every such row.
 */
export interface CrosswalkRow {
  readonly finding: DiscoveryFindingId
  readonly obligation: DeployableObligationId | null
  readonly resolution: string
  readonly line: number
}

export const CROSSWALK = [
  {
    finding: 'SCHED-001',
    obligation: 'SCHED-RUN-AUTOCLOSE',
    resolution: 'Run auto-close after the finish window.',
    line: 102492,
  },
  {
    finding: 'SCHED-002',
    obligation: 'SCHED-NOSHOW-ALERT',
    resolution: 'Supervisor alert at fifteen minutes.',
    line: 102493,
  },
  {
    finding: 'SCHED-003',
    obligation: 'SCHED-NOSHOW-CANCEL',
    resolution: 'Auto-cancel at thirty minutes.',
    line: 102494,
  },
  {
    finding: 'SCHED-004',
    obligation: 'SCHED-QUAL-WARN',
    resolution: 'Qualification expiry warnings at 14, 7, 1 and 0 days.',
    line: 102495,
  },
  {
    finding: 'SCHED-005',
    obligation: 'SCHED-QUAL-ACK',
    resolution: 'Escalation of an unacknowledged expiry notice.',
    line: 102496,
  },
  {
    finding: 'SCHED-006',
    obligation: null,
    resolution:
      'Not a scheduled obligation. Clearance lapse is evaluated at the next gate evaluation on the device, which is a request-time check, not a timer.',
    line: 102497,
  },
  {
    finding: 'SCHED-007',
    obligation: 'SCHED-DIGEST',
    resolution: "Per-shift digest at each shift's configured delivery time.",
    line: 102498,
  },
  {
    finding: 'SCHED-008',
    obligation: null,
    resolution:
      "Not a scheduled obligation. Review-queue aging highlights are computed at read time from the record's age.",
    line: 102499,
  },
  {
    finding: 'SCHED-009',
    obligation: null,
    resolution:
      "Not a scheduled obligation. The Qualification Calendar's sixty-day horizon is a query bound evaluated when the screen is opened.",
    line: 102500,
  },
  {
    finding: 'SCHED-010',
    obligation: null,
    resolution:
      'Not a scheduled obligation. The today-plus-seven-days visibility horizon is a query bound evaluated at read time.',
    line: 102501,
  },
  {
    finding: 'SCHED-011',
    obligation: 'SCHED-HANDOFF',
    resolution: 'Shift Handoff Agent run before shift end.',
    line: 102502,
  },
  {
    finding: 'SCHED-012',
    obligation: 'SCHED-HANDOFF-GRACE',
    resolution: 'Escalation of an unacknowledged handoff brief.',
    line: 102503,
  },
  {
    finding: 'SCHED-013',
    obligation: 'SCHED-GATE-TIMEOUT',
    resolution: 'Gate-item timeout and re-route.',
    line: 102504,
  },
  {
    finding: 'SCHED-014',
    obligation: 'SCHED-PROPOSAL-STALE',
    resolution: 'Lane-B proposal stale flag at thirty days.',
    line: 102505,
  },
  {
    finding: 'SCHED-015',
    obligation: 'SCHED-CRIT-RENOTIFY',
    resolution: 'Critical notification re-notification.',
    line: 102506,
  },
  {
    finding: 'SCHED-016',
    obligation: 'SCHED-CONNECTIVITY',
    resolution: 'Connectivity-loss protocol at 30, 60 and 120 minutes.',
    line: 102507,
  },
  {
    finding: 'SCHED-017',
    obligation: null,
    resolution:
      'Not a scheduled obligation. Board refresh is a client-side polling interval in an open browser session, not a server-side timer.',
    line: 102508,
  },
  {
    finding: 'SCHED-018',
    obligation: null,
    resolution:
      'Not a scheduled obligation. The offline credential-trust window is a signed device-local expiry evaluated on the device.',
    line: 102509,
  },
  {
    finding: 'SCHED-019',
    obligation: null,
    resolution:
      'Not a scheduled obligation. Clock-skew evaluation happens per capture and at synchronisation, not on a cadence.',
    line: 102510,
  },
  {
    finding: 'SCHED-020',
    obligation: null,
    resolution:
      "Not a scheduled obligation as a timer in its own right; support-session expiry is enforced at request time against the session's time box. The sweeper that closes expired session records is a cleanup task, not the control.",
    line: 102511,
  },
  {
    finding: 'SCHED-021',
    obligation: null,
    resolution:
      "Not a scheduled obligation, for the same reason as the support session: the compliance-emergency session's expiry is enforced at request time.",
    line: 102512,
  },
  {
    finding: 'SCHED-022',
    obligation: 'SCHED-SUSPEND-SOFT',
    resolution: 'Soft-suspension evaluation at the non-payment threshold.',
    line: 102513,
  },
  {
    finding: 'SCHED-023',
    obligation: 'SCHED-PILOT-EXPIRY',
    resolution: 'Pilot term expiry tracking.',
    line: 102514,
  },
  {
    finding: 'SCHED-024',
    obligation: 'SCHED-REPORT-DELIVERY',
    resolution: 'Scheduled report delivery.',
    line: 102515,
  },
  {
    finding: 'SCHED-025',
    obligation: 'SCHED-USAGE-LADDER',
    resolution: 'Usage-ladder threshold evaluation.',
    line: 102516,
  },
  {
    finding: 'SCHED-026',
    obligation: 'SCHED-TIERING',
    resolution: 'Storage tiering past the retention horizon.',
    line: 102517,
  },
  {
    finding: 'SCHED-027',
    obligation: 'SCHED-ANONYMISE',
    resolution: 'Worker personal-data anonymisation at twenty-four months.',
    line: 102518,
  },
  {
    finding: 'SCHED-028',
    obligation: 'SCHED-TRACE-RETENTION',
    resolution: 'Trace retention at twenty-four months.',
    line: 102519,
  },
  {
    finding: 'SCHED-029',
    obligation: 'SCHED-DRIFT-CANARY',
    resolution: 'Drift canary re-running the evaluation suite.',
    line: 102520,
  },
  {
    finding: 'SCHED-030',
    obligation: 'SCHED-DB-MAINT',
    resolution: 'Maintenance windows and their notices.',
    line: 102521,
  },
  {
    finding: 'SCHED-031',
    obligation: null,
    resolution:
      'Not a scheduled obligation. The notified-class adoption window is a state on the version record, evaluated when a Job Owner opens it.',
    line: 102522,
  },
  {
    finding: 'SCHED-032',
    obligation: null,
    resolution:
      'Not a scheduled obligation. Archival reactivation bands are evaluated when a reactivation is requested.',
    line: 102523,
  },
  {
    finding: 'SCHED-033',
    obligation: null,
    resolution:
      'Not a scheduled obligation. The late-capture acceptance boundary is the finish window, already carried by `SCHED-RUN-AUTOCLOSE`.',
    line: 102524,
  },
  {
    finding: 'SCHED-034',
    obligation: null,
    resolution:
      'Not a scheduled obligation. The application-version floor is enforced at device contact, which is a request-time check.',
    line: 102525,
  },
  {
    finding: 'SCHED-035',
    obligation: 'SCHED-COMMAND-AGE',
    resolution: 'Pending-command age and expiry.',
    line: 102526,
  },
] as const satisfies readonly CrosswalkRow[]

/**
 * The two obligations that originate outside the numbered sweep, L102532 and
 * L102533, under the heading at L102528. `AC-SCHED-381` (L102543) requires every
 * obligation to be reachable from the crosswalk "whether from a numbered finding
 * or from the independent-provenance table", so these two are what make that
 * criterion satisfiable rather than false.
 */
export const INDEPENDENT_PROVENANCE: readonly {
  readonly obligation: DeployableObligationId
  readonly provenance: string
  readonly line: number
}[] = [
  {
    obligation: 'SCHED-BACKUP',
    provenance:
      'Backup creation and restore verification. Raised in the platform-operations sweep rather than in the numbered discovery table, because it is infrastructure rather than product behaviour.',
    line: 102532,
  },
  {
    obligation: 'SCHED-SUSPEND-HARD',
    provenance:
      'Hard-suspension evaluation at the second non-payment threshold. The numbered row `SCHED-022` covers both suspension evaluations as one candidate; the deployable register splits them because they carry different allowed-action sets.',
    line: 102533,
  },
]

/* ── the resolver ──────────────────────────────────────────────────────────── */

export type Resolution =
  | { readonly kind: 'obligation'; readonly obligation: DeployableObligationId; readonly resolution: string }
  | { readonly kind: 'not-an-obligation'; readonly mechanism: string }

const BY_FINDING = new Map<DiscoveryFindingId, CrosswalkRow>(
  CROSSWALK.map((row): [DiscoveryFindingId, CrosswalkRow] => [row.finding, row]),
)

/**
 * Resolves one numbered finding. Total over `DiscoveryFindingId` because
 * `AC-SCHED-380` (L102543) requires every numbered finding to appear exactly
 * once in the crosswalk, and the test asserts set equality rather than trusting
 * that — but the `undefined` branch stays, because a lookup that cannot express
 * a miss is a lookup that reports a wrong answer as a right one.
 */
export function resolveFinding(finding: DiscoveryFindingId): Resolution | undefined {
  const row = BY_FINDING.get(finding)
  if (row === undefined) return undefined
  return row.obligation === null
    ? { kind: 'not-an-obligation', mechanism: row.resolution }
    : { kind: 'obligation', obligation: row.obligation, resolution: row.resolution }
}

/**
 * The findings that resolve to one obligation. Several findings may map to one
 * commitment — L102392 says so — and an obligation of independent provenance
 * has none, so an empty result is a real answer and not a miss.
 */
export function findingsFor(obligation: DeployableObligationId): readonly DiscoveryFindingId[] {
  return CROSSWALK.filter((r): boolean => r.obligation === obligation).map(
    (r): DiscoveryFindingId => r.finding,
  )
}

/** Every finding the crosswalk classifies as not a scheduled obligation. */
export const NOT_AN_OBLIGATION: readonly DiscoveryFindingId[] = CROSSWALK.filter(
  (r): boolean => r.obligation === null,
).map((r): DiscoveryFindingId => r.finding)

/**
 * The one place inside §45A.17.2 where the source states a count beside an
 * enumeration that contradicts it — and here it contradicts ITSELF as well.
 * Both figures render; the counted one is the one a screen may act on, because
 * the rows are the evidence and they are in this file.
 */
export const NOT_AN_OBLIGATION_COUNT = {
  /** Counted from `CROSSWALK`, and equal to `NOT_AN_OBLIGATION.length`. */
  counted: 13,
  /** L102535: "35 numbered findings resolve to 22 mapped obligations and 13 classified as not scheduled obligations." */
  statedAsThirteen: 102535,
  /** L102467: "Fourteen of the thirty-five findings resolve to 'not a scheduled obligation'". */
  statedAsFourteen: 102467,
  /** L102486 repeats fourteen: "which is why fourteen findings resolve to no obligation". */
  restatedAsFourteen: 102486,
} as const

/* ── the six cards the plan called a conflict, and why they are not ────────── */

/**
 * A finding that carries a field-complete card in §45A.8 AND is classified not a
 * scheduled obligation. There are six, and they are exactly the six
 * non-obligations that have a card at all — the other seven have none.
 */
export interface CardAgainstCrosswalk {
  readonly finding: DiscoveryFindingId
  /** The card's own line in §45A.8. */
  readonly cardLine: number
  /** The crosswalk row's line. */
  readonly crosswalkLine: number
  /**
   * Whether the card and the crosswalk row disagree. All six read `false`, and
   * this field exists so that a seventh which DID disagree could say so without
   * the shape of this fixture having to change.
   */
  readonly conflicts: false
  /**
   * The card field that carries the agreement, quoted. A real timer would have
   * to fill these fields with a policy; each of these six fills them with the
   * reason there is no moment to have a policy about.
   */
  readonly cardAgrees: string
}

/**
 * SIX PAIRS, AND NOT ONE OF THEM IS A CONTRADICTION. Each card states in its own
 * `Misfire` or `Retry and catch-up` field that there is nothing to schedule,
 * which is the same finding the crosswalk row reaches. `SCHED-020` is the one
 * that looks otherwise and is not: its card names a `Scheduled Execution Worker`
 * for the record transition, and the crosswalk row anticipates exactly that —
 * "The sweeper that closes expired session records is a cleanup task, not the
 * control" — which `DNC-19`'s own "what a sweeper may still legitimately do"
 * column then licenses in words, "Close orphaned session records and report
 * them". Three statements, one position.
 */
export const CARD_VERSUS_CROSSWALK = [
  {
    finding: 'SCHED-006',
    cardLine: 99406,
    crosswalkLine: 102497,
    conflicts: false,
    cardAgrees:
      'Misfire: not applicable — the evaluation happens at the next gate rather than at a scheduled instant, so there is no moment to miss.',
  },
  {
    finding: 'SCHED-008',
    cardLine: 99410,
    crosswalkLine: 102499,
    conflicts: false,
    cardAgrees:
      'Retry and catch-up: not applicable — a read-time computation has nothing to catch up.',
  },
  {
    finding: 'SCHED-009',
    cardLine: 99412,
    crosswalkLine: 102500,
    conflicts: false,
    cardAgrees:
      'Retry and catch-up: not applicable — a projection has no historical obligation.',
  },
  {
    finding: 'SCHED-010',
    cardLine: 99414,
    crosswalkLine: 102501,
    conflicts: false,
    cardAgrees: 'Misfire: not applicable — nothing fires.',
  },
  {
    finding: 'SCHED-017',
    cardLine: 99428,
    crosswalkLine: 102508,
    conflicts: false,
    cardAgrees:
      'Retry and catch-up: serve the previous aggregate with its age; no catch-up exists for a superseded read.',
  },
  {
    finding: 'SCHED-020',
    cardLine: 99430,
    crosswalkLine: 102511,
    conflicts: false,
    cardAgrees:
      "Failure ladder: deny at request time even if the sweep is late, then the tenant's own End-session control, terminal safe state is access denied.",
  },
] as const satisfies readonly CardAgainstCrosswalk[]

/**
 * Where the plan's reasoning about these six was half right. It said clearance
 * lapse and the qualification-calendar horizon are both covered by the
 * do-not-use-cron register, "so a sweeper there is a named prohibition, not a
 * design choice". Clearance lapse is: `DNC-03` at L98487 is "Clearance validity
 * and its expiry", whose correct mechanism is the device-local signed timer the
 * card describes. The qualification-calendar horizon is NOT: `DNC-02` at L98486
 * is the qualification GATE at assignment, run start and gated screens, and what
 * it licenses a sweeper to do is warn at 14, 7, 1 and 0 days — which is
 * `SCHED-QUAL-WARN`, a real obligation. No `DNC-` row names the calendar horizon
 * at all, and `SCHED-009`'s card cites `DEC-SCHED-008` rather than a
 * prohibition. So one of the two is a named prohibition and the other is the
 * design choice the plan said it was not.
 */
export const DNC_COVERAGE_OF_THE_SIX = {
  clearanceLapse: { finding: 'SCHED-006', dnc: 'DNC-03', dncLine: 98487, namedProhibition: true },
  qualificationCalendarHorizon: {
    finding: 'SCHED-009',
    dnc: null,
    dncLine: null,
    namedProhibition: false,
  },
} as const

/* ── the collision the crosswalk does not reach ────────────────────────────── */

/**
 * A Matrix 14 Schedule Definition that asserts a timer for a finding the
 * crosswalk classifies as not a scheduled obligation. Neither register knows the
 * other exists, so there is no rule to apply and no winner to pick.
 */
export interface Matrix14Conflict {
  readonly matrix14: Matrix14ScheduleId
  /** Block A's line, where the definition, its requirement and its identity are. */
  readonly matrix14Line: number
  /** The finding or findings the same subject carries in §45A.2. */
  readonly findings: readonly DiscoveryFindingId[]
  /** The crosswalk row that denies it, and its line. */
  readonly crosswalkLines: readonly number[]
  /** What the two say, side by side, neither preferred. */
  readonly matrix14Says: string
  readonly crosswalkSays: string
}

/**
 * SIX ROWS WHERE THE TWO REGISTERS GIVE OPPOSITE ANSWERS, and this is the real
 * conflict in this chapter — not the card-versus-crosswalk pairs, which
 * reconcile. Matrix 14 gives each of these a `REQ-*` requirement, a non-human
 * identity, a workflow, and a fallback contract naming a misfire; §45A.17.2
 * says the behaviour needs no timer at all.
 *
 * NEITHER SIDE IS PREFERRED HERE AND NO SCHEDULER AFFORDANCE IS BUILT FOR ANY
 * OF THE SIX. The build's position is procedural: both readings render with
 * their own locators, and nothing depends on which is true. It is deliberately
 * not registered as a decision — the source raises no `DEC-*` identifier for
 * this collision, and minting one would put an identifier into a register the
 * client would then search the source for and not find. That is the same ruling
 * `S10-IDENT-SCHED-001` records in `src/disclosure/decisions.ts` for the
 * scheduler identity spellings, and Matrix 14 block A is a FOURTH set of those
 * spellings on top of the three that record already carries.
 *
 * Measured rather than impressionistic: Matrix 14's twenty-four rows cover
 * twenty of the twenty-four deployable obligations (`SCHED-05` and `SCHED-13`
 * each covering two), contradict six findings, and omit four obligations
 * entirely — `SCHED-DRIFT-CANARY`, `SCHED-BACKUP`, `SCHED-DB-MAINT` and
 * `SCHED-COMMAND-AGE`.
 */
export const MATRIX_14_UNRECONCILED = [
  {
    matrix14: 'SCHED-15',
    matrix14Line: 117906,
    findings: ['SCHED-020'],
    crosswalkLines: [102511],
    matrix14Says:
      'Support-session time-box expiry, default 2 hours, driven by `IDENT-SESSION-TIMER` under `REQ-SA-150`.',
    crosswalkSays:
      'Not a scheduled obligation as a timer in its own right; enforced at request time, and the sweeper is a cleanup task rather than the control.',
  },
  {
    matrix14: 'SCHED-16',
    matrix14Line: 117907,
    findings: ['SCHED-006', 'SCHED-018'],
    crosswalkLines: [102497, 102509],
    matrix14Says:
      'Offline credential and clearance trust-window expiry as one Schedule Definition, driven by `IDENT-DEVICE-TRUST-TIMER` under `REQ-PLAT-203`.',
    crosswalkSays:
      'Two separate findings, both not scheduled obligations: a signed device-local expiry, and a gate evaluation on the device.',
  },
  {
    matrix14: 'SCHED-20',
    matrix14Line: 117911,
    findings: ['SCHED-017'],
    crosswalkLines: [102508],
    matrix14Says:
      'Command Center board refresh as a Schedule Definition, driven by `IDENT-BOARD-REFRESH` under `REQ-CC-030`.',
    crosswalkSays:
      'Not a scheduled obligation. A client-side polling interval in an open browser session, not a server-side timer.',
  },
  {
    matrix14: 'SCHED-22',
    matrix14Line: 117913,
    findings: ['SCHED-009'],
    crosswalkLines: [102500],
    matrix14Says:
      'Qualification Calendar horizon RECOMPUTE across 60 days, driven by `IDENT-QUAL-EVALUATOR` under `REQ-DOH-060`.',
    crosswalkSays:
      'Not a scheduled obligation. A query bound evaluated when the screen is opened.',
  },
  {
    matrix14: 'SCHED-23',
    matrix14Line: 117914,
    findings: ['SCHED-010'],
    crosswalkLines: [102501],
    matrix14Says:
      'Run schedule visibility horizon of today plus 7 days, driven by `IDENT-SCHEDULE-PROJECTOR` under `REQ-DOH-090`.',
    crosswalkSays: 'Not a scheduled obligation. A query bound evaluated at read time.',
  },
  {
    matrix14: 'SCHED-24',
    matrix14Line: 117915,
    findings: ['SCHED-032'],
    crosswalkLines: [102523],
    matrix14Says:
      'Archival reactivation window EVALUATION at 0 to 6, 6 to 12 and beyond 12 months, driven by `IDENT-LIFECYCLE-WATCHER` under `REQ-SA-170`.',
    crosswalkSays: 'Not a scheduled obligation. Evaluated when a reactivation is requested.',
  },
] as const satisfies readonly Matrix14Conflict[]

/**
 * The four commitments Matrix 14 has no row for.
 *
 * THIS LIST IS DERIVED AND SAYS SO. The source publishes no crosswalk between
 * Matrix 14 and §45A.17.1 — that is the whole finding above — so the
 * correspondence behind this list was made by matching subjects, not by reading
 * a table. It is `Derived Clarification` in the source's own vocabulary and no
 * screen may present it as a source-stated mapping. What IS source-stated is
 * each side separately: twenty-four rows at L117892-L117915 and twenty-four at
 * L102396-L102419.
 */
export const OBLIGATIONS_ABSENT_FROM_MATRIX_14 = [
  'SCHED-DRIFT-CANARY',
  'SCHED-COMMAND-AGE',
  'SCHED-BACKUP',
  'SCHED-DB-MAINT',
] as const satisfies readonly DeployableObligationId[]

/* ── what this module says about `DEC-SCHED-011`, which is one thing ───────── */

/**
 * The crosswalk is the artefact reading (c) of `DEC-SCHED-011` names — L102392
 * and L102547 both say "crosswalk closes `DEC-SCHED-011`, which recorded its
 * absence". It is built here and it resolves all thirty-five findings, and NONE
 * OF THAT decides whether the decision exists, is open, or is closed. Reading
 * (a) bounds the band at `DEC-SCHED-001` through `DEC-SCHED-010` (L51002);
 * reading (b) carries it as an open index row with nine references (L115148, in
 * a table whose own preamble at L114952 says most identifiers in it "stay open
 * until the client answers them").
 *
 * The three readings live in `src/disclosure/decisions.ts` and nothing here
 * restates them. What this constant records is the INDEPENDENCE: this crosswalk
 * is correct under all three readings, so no code path in `src/scheduling/` has
 * to know which is true, and none does.
 */
export const DEC_SCHED_011_INDEPENDENCE = {
  decision: 'DEC-SCHED-011',
  /** Where the three readings are disclosed. One home, never two. */
  disclosedIn: 'src/disclosure/decisions.ts',
  /** The crosswalk that reading (c) names, and its acceptance criteria. */
  crosswalkSection: '45A.17.2',
  crosswalkHeadingLine: 102459,
  /** True of this module by construction, and asserted rather than asserted-of. */
  settlesNothing: true,
} as const

/* ── reconciliation, computed rather than quoted ───────────────────────────── */

/**
 * The reconciliation L102535 states, recomputed from the rows so that it cannot
 * go stale. A count copied into a constant is a count that stops measuring.
 */
export const RECONCILIATION = {
  findings: DISCOVERY_FINDINGS.length,
  mapped: CROSSWALK.filter((r): boolean => r.obligation !== null).length,
  notObligations: NOT_AN_OBLIGATION.length,
  independentProvenance: INDEPENDENT_PROVENANCE.length,
  obligations: DEPLOYABLE_OBLIGATIONS.length,
} as const
