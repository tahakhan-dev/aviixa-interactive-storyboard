/**
 * Slice 6, wave 0, task 3 — the deterministic due-transition evaluator.
 *
 * `ledgers.schedules` has existed since slice 1 (`src/domain/state.ts` line
 * 20) and has never held a record, because nothing in this build derived a
 * state change from elapsed time. This module is that derivation, and only
 * that: it is pure data plus pure functions, it decides nothing about
 * permission, and it writes nothing. A caller reads the clock in, gets the
 * transitions that have fallen due out, and commits them itself.
 *
 * ── HOW MANY TIMERS ARE THERE, ACTUALLY ────────────────────────────────────
 * The plan (`docs/superpowers/plans/2026-08-21-replan-slices-05-13.md`,
 * slice 6 mechanism (3)) says "Four named timers" and then lists FIVE rows.
 * Both numbers are wrong for this file, because the five rows are not five
 * of the same thing. Read at their own locators they are four different
 * kinds of mechanism, and `BRIEFED_TIMER_ROWS` below records each one with
 * the reading it got and why. The short version:
 *
 *   +15 no-show alert   L27868  clock-driven, raises an alert, moves no state
 *   +30 auto-cancel     L27868  clock-driven, moves the run to `cancelled`
 *   run auto-close      L27880  clock-driven, moves the run to `finished`
 *   Summary recompute   L27884  NOT clock-driven — a capture ARRIVING drives
 *                               it; the clock only bounds whether it is taken
 *   aging bands         L28269  NOT a transition at all — the source says so
 *                               in the same sentence that names the hours
 *
 * So: THREE clock-driven timers, of which TWO change run state; one
 * arrival-driven recompute; one display band. `AutomaticTransition` covers
 * the four that are actually automatic. The band is a band and is returned
 * as one, by `reviewAgingBand`, which cannot emit a transition because its
 * return type has nowhere to put one.
 *
 * ── AND THE SOURCE SAYS THERE IS EXACTLY ONE ───────────────────────────────
 * Twice, marked `SoW Fact` both times, the source states that auto-close is
 * the platform's only actorless transition — L27933 and L7078 — while
 * L27868, also `SoW Fact`, gives two more. That contradiction is real, it is
 * not this task's to settle, and it is disclosed at
 * `CONTRADICTION_AUTOMATIC_TRANSITION_COUNT` rather than resolved by picking
 * whichever count made the code tidier. The COUNT is unchanged from wave 0's
 * reading; one of its two locators was wrong and is corrected there.
 *
 * ── NO ACTOR ───────────────────────────────────────────────────────────────
 * Every other write in this build carries an actor and an audit line naming
 * them (`TransitionContext.actorOfRecord`, `src/domain/transition.ts:24`).
 * These four carry none, and the way that is enforced here is the type:
 * `AutomaticTransition.actor` is the literal type `null`, so assigning an
 * identity to it is a compile error, not a review finding. The evaluator
 * also never receives an identity — no parameter of any function in this
 * file can carry one — so there is no last-human-actor available to borrow
 * even by accident. See `AutomaticTransition.actor` for the full account.
 *
 * ── DETERMINISM ────────────────────────────────────────────────────────────
 * The clock comes in as an injected `Clock` (`@/domain/clock`) exactly as
 * `src/kernel/reduce.ts` takes it, and `now()` is read ONCE per call.
 * `logicalTick()` is deliberately never called: it is a mutable counter, so
 * two evaluations of one unchanged fixture would differ in their output, and
 * "the same fixture advanced the same way produces the same transitions" is
 * the property this module exists to have. No `Date.now()`, no `new Date()`,
 * no `Math.random()` — the same rule `src/scenario/controls.ts:225` states
 * for the generators.
 *
 * ── WHAT THIS FILE DELIBERATELY DOES NOT DECIDE ────────────────────────────
 * DEC-RUNSTATE-001 (card L5242-L5251) leaves `submitted` and `complete`
 * defined three different ways. This module never branches on a run-state
 * name; it branches on the INSTANTS in `RunTimingFacts` — when the run was
 * scheduled to start, whether it started, when it reached complete. All
 * three readings agree that there is such an instant and that the finish
 * window runs from it, so keying on the instant settles nothing. A version
 * of this evaluator that switched on a `RunState` union would have had to
 * pick a reading to compile.
 */

import type { Clock } from '@/domain/clock'
import type { TenantId } from '@/domain/ids'
import type { LedgerRecord } from '@/domain/state'

const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS

/* ── the timers ──────────────────────────────────────────────────────────── */

/**
 * L27868 — "A run left unstarted after its scheduled start raises a
 * supervisor alert at plus 15 minutes and is auto-cancelled at plus 30
 * minutes." Restated with a second locator at L7072, workflow step 3.
 */
export const NO_SHOW_ALERT_AFTER_MS = 15 * MINUTE_MS
export const AUTO_CANCEL_AFTER_MS = 30 * MINUTE_MS

/**
 * L27879 — "a tenant-configurable period, default 48 hours, bounded by a
 * platform floor of 24 hours and a ceiling of 7 days".
 *
 * The bounds are `DEC-FINISH-001` and are NOT settled in the source. This
 * build validates against 24 h and 7 d because the chapter itself says it
 * does — L27882, "This chapter builds to 24 hours and 7 days and records the
 * divergence" — and `DEC_FINISH_001` below carries the divergence and the
 * words a screen must show. Neither reading is marked as the answer.
 */
export const FINISH_WINDOW_FLOOR_MS = 24 * HOUR_MS
export const FINISH_WINDOW_DEFAULT_MS = 48 * HOUR_MS
export const FINISH_WINDOW_CEILING_MS = 7 * 24 * HOUR_MS

/**
 * The three clock-driven timers, and the only three. `summary-recompute` is
 * an `AutomaticTransition` too but is NOT a member of this union, because it
 * never falls due on a clock — nothing about elapsed time causes it to
 * happen and `dueTransitions` therefore cannot produce one.
 */
export type DueTimerId = 'no-show-alert' | 'auto-cancel' | 'run-auto-close'

export const DUE_TIMERS = [
  'no-show-alert',
  'auto-cancel',
  'run-auto-close',
] as const satisfies readonly DueTimerId[]

type MissingFromDueTimers = Exclude<DueTimerId, (typeof DUE_TIMERS)[number]>
const _dueTimersExhaustive: MissingFromDueTimers extends never ? true : never = true
void _dueTimersExhaustive

/** Every automatic effect this module produces. Four, per the header. */
export type AutomaticTransitionId = DueTimerId | 'summary-recompute'

/* ── the record ──────────────────────────────────────────────────────────── */

/**
 * One automatic effect that has become due (or, for `summary-recompute`, has
 * been caused by an arrival). Deliberately NOT called an "event" — the
 * kernel's `LedgerRecord` is that, and `scheduleRecords` converts.
 */
export interface AutomaticTransition {
  readonly id: AutomaticTransitionId
  readonly runId: string
  readonly tenant: TenantId | null
  /**
   * The instant the effect belongs to. For a timer this is the instant it
   * fell DUE, never the instant the evaluator happened to be called: a
   * scenario that advances the clock in one 40-minute jump and one that
   * advances it in eight 5-minute steps must record the same +30 auto-cancel
   * at the same millisecond, or the schedule board and the audit trail
   * disagree about a run neither of them touched.
   */
  readonly atMs: number
  /**
   * The run state this moves the run INTO, or null where the effect changes
   * no state. Two of the four move state. The no-show alert does not — its
   * verb at L27868 is `raises`, and an alert is not a lifecycle state — and
   * the Summary recompute rewrites a computed view, never the run.
   */
  readonly toState: 'cancelled' | 'finished' | null
  /**
   * ALWAYS NULL, AND TYPED SO IT CANNOT BE ANYTHING ELSE.
   *
   * The literal type `null` — not `string | null` — is the point. Every
   * other write in this build fills the equivalent field from
   * `TransitionContext.actorOfRecord`, and the failure mode this guards is
   * not a developer deciding to lie: it is a consumer that already has an
   * identity in hand (the Supervisor whose board triggered the sweep, the
   * Quality Manager whose queue was open) reaching for the nearest one
   * because the field wanted a value. That would put a person's name against
   * a cancellation they did not make, which is an audit defect and not a
   * modelling detail. With this type it does not compile.
   *
   * WHAT IS RECORDED INSTEAD. `id` names the mechanism, which is what the
   * source asks for — TEST-RUN-002 · L7135 — "Advance the clock past the
   * window and assert the automatic finish with an audit event naming the
   * scheduler." `run-auto-close` is that name; AC-RUN-002 · L7126 — "The
   * finish transition occurs only through the run auto-close scheduler after
   * the tenant's configured window."
   *
   * For the +15 and +30 timers the source names NO scheduler anywhere, so
   * none is minted here and the timer id is the whole of what is known.
   * L27903 groups them with auto-close under one fallback pattern —
   * "`FB-DOH-SCHED-010` for no-show checks and auto-close" — and a fallback
   * pattern is not an actor either. That registry is slice 6 task 4's; this
   * file names no `FB-DOH-` string rather than mint a second copy of it.
   *
   * WHY NOT A SYNTHETIC IDENTITY. A `SYSTEM` or `PLATFORM` pseudo-actor is
   * the obvious alternative and is rejected: it makes the actor field
   * non-null everywhere, so every downstream reader loses the ability to ASK
   * whether a write was human, and the one question the audit trail exists
   * to answer becomes a string comparison against a magic value that a
   * future tenant could legitimately name a user.
   */
  readonly actor: null
}

/* ── the input ───────────────────────────────────────────────────────────── */

/**
 * The run, as instants. See the header on DEC-RUNSTATE-001 for why this is
 * timestamps and not a state enum. Every field is a fact about when
 * something happened, and every one of them is `null` until it has.
 *
 * There is no identity field, and there is deliberately nowhere to put one:
 * that absence is half of the no-actor guarantee, the type on
 * `AutomaticTransition.actor` being the other half.
 */
export interface RunTimingFacts {
  readonly runId: string
  readonly tenant: TenantId | null
  /** L27868's "its scheduled start" — the anchor for +15 and +30. */
  readonly scheduledStartMs: number
  /** null while the run is "left unstarted" (L27868). */
  readonly startedAtMs: number | null
  /** Set once the run is cancelled, by this evaluator or by a person. */
  readonly cancelledAtMs: number | null
  /**
   * The instant the run reached `complete` — L27879, the run "enters its
   * finish window". Null until it does, which is why no finish-window timer
   * can fall due on a run that never completed.
   */
  readonly completeAtMs: number | null
  /** Set once auto-close has run. A finished run has no timers left. */
  readonly finishedAtMs: number | null
  /** The tenant's configured window. Validate with `finishWindowVerdict`. */
  readonly finishWindowMs: number
}

/** The instant the finish window closes, or null if it has not opened. */
export function finishWindowEndsAtMs(facts: RunTimingFacts): number | null {
  return facts.completeAtMs === null ? null : facts.completeAtMs + facts.finishWindowMs
}

/* ── the evaluator ───────────────────────────────────────────────────────── */

/**
 * Every clock-driven transition that has fallen due at the clock's current
 * instant and has not already been emitted.
 *
 * `clock.now()` is read ONCE (as `src/kernel/reduce.ts` does, for the reason
 * its MINOR 8 comment gives) and `clock.logicalTick()` is never read at all
 * — see the header. Calling this twice on an unadvanced clock returns two
 * deeply equal arrays; that is the determinism contract and it is asserted
 * directly rather than assumed.
 *
 * `alreadyEmitted` is how a timer fires once. The caller owns it because the
 * caller owns the ledger; passing an empty set is what a fresh fixture does.
 *
 * Order is by `atMs` then by the fixed `DUE_TIMERS` order — never insertion
 * order, which would let two callers assembling the same facts differently
 * produce different ledgers.
 */
export function dueTransitions(
  facts: RunTimingFacts,
  clock: Clock,
  alreadyEmitted: readonly AutomaticTransitionId[] = [],
): readonly AutomaticTransition[] {
  const nowMs = clock.now()
  const emitted = new Set(alreadyEmitted)
  // Narrowed to the clock-driven ids on purpose: `summary-recompute` has no
  // due instant, so a member of this array could never be one, and the sort
  // below indexes `DUE_TIMERS` without a cast that would hide the day
  // somebody tried.
  const out: (AutomaticTransition & { readonly id: DueTimerId })[] = []

  const add = (
    id: DueTimerId,
    atMs: number,
    toState: AutomaticTransition['toState'],
  ): void => {
    if (emitted.has(id) || nowMs < atMs) return
    out.push({ id, runId: facts.runId, tenant: facts.tenant, atMs, toState, actor: null })
  }

  // L27868. "A run left unstarted after its scheduled start" — both timers
  // are conditioned on the run never having started, so a run that started
  // at +20 minutes gets neither. A run already cancelled (by a person, or by
  // the +30 timer on an earlier sweep) is past both.
  if (facts.startedAtMs === null && facts.cancelledAtMs === null) {
    add('no-show-alert', facts.scheduledStartMs + NO_SHOW_ALERT_AFTER_MS, null)
    add('auto-cancel', facts.scheduledStartMs + AUTO_CANCEL_AFTER_MS, 'cancelled')
  }

  // L27880 — "The finish window has elapsed and the platform's run auto-close
  // scheduler closes the record automatically."
  const windowEnd = finishWindowEndsAtMs(facts)
  if (windowEnd !== null && facts.finishedAtMs === null) {
    add('run-auto-close', windowEnd, 'finished')
  }

  return out.sort(
    (a, b) => a.atMs - b.atMs || DUE_TIMERS.indexOf(a.id) - DUE_TIMERS.indexOf(b.id),
  )
}

/**
 * The due transitions as `ledgers.schedules` records — the ledger the plan
 * names and the one that has been empty since slice 1.
 *
 * The id is derived from the run and the timer, never generated: a timer
 * fires once per run, so that pair is already unique, and a
 * `crypto.randomUUID()` here would break replay the same way
 * `src/kernel/reduce.ts:372` says it would in the kernel.
 *
 * `sequence` is the caller's, because the kernel owns the monotonic
 * sequence; inventing one here would produce a ledger whose numbering
 * disagrees with every other ledger in the same commit.
 */
export function scheduleRecords(
  transitions: readonly AutomaticTransition[],
  fromSequence: number,
): readonly LedgerRecord[] {
  return transitions.map((t, i) => ({
    id: `SCHED-${t.runId}-${t.id}`,
    sequence: fromSequence + i,
    logicalTime: t.atMs,
    tenant: t.tenant,
    kind: `doh.run.${t.id}`,
    payload: { runId: t.runId, toState: t.toState, dueAtMs: t.atMs, actor: t.actor },
  }))
}

/* ── row 4: the late-arriving capture ────────────────────────────────────── */

/**
 * L27884's two flags, spelled as the source spells them: a `late_arrival`
 * flag, and the dual flag for "submitted by archived worker".
 */
export type CaptureFlag = 'late_arrival' | 'submitted_by_archived_worker'

export interface LateCaptureOutcome {
  readonly accepted: boolean
  readonly flags: readonly CaptureFlag[]
  /**
   * The recompute, or null. L28267: "the Summary recomputes as late data
   * lands; every recompute is logged." It is an `AutomaticTransition` — it
   * has no actor either — but it is not a `DueTimerId`, because no amount of
   * elapsed time causes it. The clock only decides whether the capture is
   * taken at all.
   */
  readonly recompute: AutomaticTransition | null
}

/**
 * L27884 — "A Data Capture arriving after run completion is accepted up to
 * the finish window with a late_arrival flag and rejected after it."
 *
 * THE BOUNDARY. The source states "up to the finish window" and states that
 * `finished` is reached when the window "has elapsed" (L27880); it does not
 * state which side of the exact instant a capture landing ON it falls. This
 * build takes the window as half-open — an arrival strictly before the end
 * is inside — because the alternative makes one instant both inside the
 * window and after auto-close. That tie-break is a build convention, named
 * here so it is visible, and it is not a reading of anything — the source's
 * own test never probes the instant itself:
 * TEST-RUN-003 · L7136 — "Deliver a capture at window minus one minute and
 * at window plus one minute and assert acceptance flagged late and rejection
 * respectively."
 *
 * A capture arriving BEFORE the run completed is an ordinary capture: not
 * late, not flagged, and no recompute, because L28267 computes the Summary
 * at `complete` and there is nothing yet to recompute.
 */
export function lateCaptureOutcome(
  facts: RunTimingFacts,
  arrivalMs: number,
  submitterArchived: boolean,
): LateCaptureOutcome {
  const completeAt = facts.completeAtMs
  const windowEnd = finishWindowEndsAtMs(facts)
  if (completeAt === null || windowEnd === null || arrivalMs < completeAt) {
    return { accepted: true, flags: [], recompute: null }
  }
  if (arrivalMs >= windowEnd) {
    return { accepted: false, flags: [], recompute: null }
  }
  const flags: CaptureFlag[] = ['late_arrival']
  if (submitterArchived) flags.push('submitted_by_archived_worker')
  return {
    accepted: true,
    flags,
    recompute: {
      id: 'summary-recompute',
      runId: facts.runId,
      tenant: facts.tenant,
      atMs: arrivalMs,
      toState: null,
      actor: null,
    },
  }
}

/* ── row 5: the aging bands, which are not a transition ──────────────────── */

/**
 * L28269 — "with aging highlights at 24, 48 and 72 hours".
 */
export type AgingBand = 'under-24h' | 'aged-24h' | 'aged-48h' | 'aged-72h'

export const AGING_BANDS = [
  'under-24h',
  'aged-24h',
  'aged-48h',
  'aged-72h',
] as const satisfies readonly AgingBand[]

type MissingFromAgingBands = Exclude<AgingBand, (typeof AGING_BANDS)[number]>
const _agingBandsExhaustive: MissingFromAgingBands extends never ? true : never = true
void _agingBandsExhaustive

/**
 * The highlight band for one review-queue item. Returns a BAND and nothing
 * else, and that is the whole design.
 *
 * The sentence that names the hours also says what they are not —
 * L28269 — "The platform enforces no review service-level agreement — the
 * aging highlights and the digest are the pressure, not a lock." So crossing
 * 72 hours moves no state, blocks nothing, and closes nothing. This
 * function's return type has nowhere to put an `AutomaticTransition`, which
 * is the cheapest available way to stop a later consumer growing one.
 *
 * Bands are inclusive at the boundary, unlike the finish window: an item at
 * exactly 24 hours is highlighted, because a highlight that appears a
 * millisecond late costs nothing and one that never appears is the defect.
 */
export function reviewAgingBand(queuedAtMs: number, clock: Clock): AgingBand {
  const agedMs = clock.now() - queuedAtMs
  if (agedMs >= 72 * HOUR_MS) return 'aged-72h'
  if (agedMs >= 48 * HOUR_MS) return 'aged-48h'
  if (agedMs >= 24 * HOUR_MS) return 'aged-24h'
  return 'under-24h'
}

/* ── the finish window as a validated tenant setting ─────────────────────── */

export type FinishWindowVerdict = 'accepted' | 'below-floor' | 'above-ceiling'

/**
 * AC-RUN-005 · L7129 — "The tenant finish window is validated against the
 * platform floor register at entry and a looser value is rejected rather
 * than logged, with both readings of `DEC-FINISH-001` preserved in the
 * register."
 */
export function finishWindowVerdict(ms: number): FinishWindowVerdict {
  if (ms < FINISH_WINDOW_FLOOR_MS) return 'below-floor'
  if (ms > FINISH_WINDOW_CEILING_MS) return 'above-ceiling'
  return 'accepted'
}

/**
 * The rejection wording, required to name the bound —
 * TEST-RUN-004 · L7137 — "Attempt to set a finish window of 12 hours and
 * assert rejection stating the bound."
 *
 * It lives here rather than on a screen so the schedule board, the run
 * detail, the review queue and the Summary state the same bound in the same
 * words. That is the slice-4 defect where one fold reached one render branch
 * of four, and the closing lifecycle is exactly where it would land again.
 */
export function finishWindowRejection(verdict: FinishWindowVerdict): string | null {
  if (verdict === 'below-floor') return 'Below the platform floor of 24 hours.'
  if (verdict === 'above-ceiling') return 'Above the platform ceiling of 7 days.'
  return null
}

/* ── disclosures ─────────────────────────────────────────────────────────── */

/**
 * `DEC-FINISH-001`, card L27882.
 *
 * Shaped to match `src/studio/disclosure/decisions.ts` — two fields on a
 * reading, and NO field in which a reading could be marked the answer — so
 * that slice 6 task 1's surface-neutral canon can absorb it without a
 * rewrite. That file is another agent's path this task does not touch.
 *
 * `onScreen` is the sentence a screen must render. This task owns no screen;
 * MOD-DOH-06 (task 7) mounts it. The requirement is that the bound is
 * enforced AND that the screen says one Part leaves it open — enforcing
 * silently is the failure mode, and the two halves must not drift apart,
 * which is why the enforced constants and the disclosed wording sit in one
 * file.
 */
export const DEC_FINISH_001 = {
  id: 'DEC-FINISH-001',
  question: "The record-finish window's floor and ceiling.",
  readings: [
    {
      text: 'The bounds are settled: a floor of 24 hours and a ceiling of 7 days.',
      locator: 'DEC-FINISH-001 (§4.6.8, §8.19) · L27882',
    },
    {
      text: 'The bounds are an open drafting item, suggesting 24 hours to 7 days rather than fixing them.',
      locator: 'DEC-FINISH-001 (§2.4) · L27882',
    },
  ],
  buildPosition:
    'Validated against 24 hours and 7 days, because the chapter states that it builds to those values and records the divergence. This is a build position, not the source settling the question.',
  onScreen:
    'The finish window is validated against a floor of 24 hours and a ceiling of 7 days. One Part of the source leaves that bound open — it records the range as a drafting suggestion rather than a fixed bound — and the question is unanswered.',
} as const

/**
 * How each of the plan's five rows actually reads at its own locator.
 *
 * This exists because the plan's heading says four and its table lists five,
 * and because four of the five turn out to be three different kinds of
 * thing. A consumer that reads this register instead of the plan's table
 * cannot build a fifth timer that does not exist.
 */
export type TimerRowKind =
  /** Clock-driven; moves the run into another state; no actor. */
  | 'automatic-transition'
  /** Clock-driven; raises an alert; moves no state; no actor. */
  | 'automatic-notification'
  /** Not clock-driven. An arrival drives it; the clock only bounds it. */
  | 'arrival-driven'
  /** Not a transition at all. A rendered band the source refuses to lock. */
  | 'display-band'

export interface TimerRowReading {
  readonly row: string
  readonly locator: string
  readonly kind: TimerRowKind
  readonly finding: string
}

export const BRIEFED_TIMER_ROWS = [
  {
    row: 'no-show alert at +15 minutes',
    locator: 'L27868',
    kind: 'automatic-notification',
    finding:
      'Real and clock-driven, but it "raises a supervisor alert" and moves no run state. Counting it as a state change overstates it; leaving it out of the automatic set understates it. Restated at L7072.',
  },
  {
    row: 'auto-cancel at +30 minutes',
    locator: 'L27868',
    kind: 'automatic-transition',
    finding:
      'A genuine actorless run-state change, scheduled to cancelled. Restated at L7072. It is also the row that contradicts L27933 and L7078.',
  },
  {
    row: 'run auto-close when the finish window elapses',
    locator: 'L27880',
    kind: 'automatic-transition',
    finding:
      'The one the source itself acknowledges, complete to finished. AC-RUN-002 · L7126 makes it the only path into finished, and the MOD-DOH-06 matrix row at L27920 refuses forcing a run to finished early in all five role columns.',
  },
  {
    row: 'Summary recompute on a late-arriving capture',
    locator: 'L27884',
    kind: 'arrival-driven',
    finding:
      'Not a timer. Nothing about elapsed time causes it — a capture arriving causes it, and the finish window only decides whether that capture is accepted (L27884) or rejected. Modelled as an AutomaticTransition, since it has no actor, but it is unreachable from dueTransitions.',
  },
  {
    row: 'review-queue aging bands at 24 / 48 / 72 hours',
    locator: 'L28269',
    kind: 'display-band',
    finding:
      'Not a transition and not a timer. The same sentence that names the hours says the platform enforces no review service-level agreement and that the highlights are the pressure, not a lock. Building it as a transition would fabricate an enforcement the source explicitly refuses.',
  },
] as const satisfies readonly TimerRowReading[]

/**
 * The source contradicts itself about how many actorless transitions exist,
 * and both sides are marked `SoW Fact`. Preserved, not resolved.
 *
 * ONE LOCATOR CORRECTED, THE CLAIM UNTOUCHED. Wave 0 cited the `SoW Fact`
 * side as L27854 and L7078. L7078 is tagged and stands. **L27854 is not
 * tagged at all** — it is §19.8's untagged "In simple words" paragraph,
 * which states the claim in plain words and carries no classification. The
 * `SoW Fact`-tagged restatement inside §19.8 is L27933, step 10 of the happy
 * path. `MOD-DOH-06` measured this against the frozen source
 * (`src/surfaces/doh/modules/doh-06/matrix.ts`,
 * `CONTRADICTION_AUTOMATIC_TRANSITION_COUNT_CORRECTED`) and this record now
 * cites the same pair. Nothing about the CONTRADICTION changes: the source
 * still asserts exactly one actorless transition, twice and tagged, and
 * L27868 still gives two more.
 *
 * L27933 — "This is **the one automatic transition on the platform** — a
 * data-integrity rule, not a status change." `[SoW Fact — §2.4, §4.6.8]`
 *
 * L7078 — "The finish window elapses and the run auto-close scheduler
 * finishes the record. This is the platform's one automatic transition".
 * `[SoW Fact — §2.4, §8.7.1]`
 *
 * L27854 says the same thing in plain words and is kept out of
 * `claimLocators` for the one reason that matters: a locator in that list is
 * offered as a tagged source claim, and that line is not one.
 *
 * Against L27868, which gives an alert at +15 and a cancellation at +30 with
 * no actor anywhere in the sentence. The +30 auto-cancel is unambiguously a
 * state change nobody decides, so the "one automatic transition" claim
 * cannot be literally true as written.
 *
 * This build implements what L27868 and L27880 SPECIFY and records the count
 * claim as contradicted, because the alternative — implementing the count —
 * means deleting a cancellation rule the source states in two places, or
 * inventing an actor for it. There is no third reading in which the counts
 * agree, and no card exists for this one: it is raised here.
 */
export const CONTRADICTION_AUTOMATIC_TRANSITION_COUNT = {
  id: 'CONTRADICTION-AUTOCLOSE-ONLY',
  claim: "This is the platform's one automatic transition.",
  claimLocators: ['L27933', 'L7078'],
  against:
    'L27868 gives a supervisor alert at plus 15 minutes and an auto-cancellation at plus 30 minutes, neither of which any person decides.',
  againstLocators: ['L27868', 'L7072'],
  resolved: false,
} as const
