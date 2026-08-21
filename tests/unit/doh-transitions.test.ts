import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { stripComments } from '../coverage/strip-comments'
import { CANONICAL_EPOCH_MS, fixedClock } from '@/domain/clock'
import { tenantId } from '@/domain/ids'
import type { IdentitySimulationState } from '@/domain/state'
import {
  AGING_BANDS,
  AUTO_CANCEL_AFTER_MS,
  BRIEFED_TIMER_ROWS,
  CONTRADICTION_AUTOMATIC_TRANSITION_COUNT,
  DEC_FINISH_001,
  DUE_TIMERS,
  FINISH_WINDOW_CEILING_MS,
  FINISH_WINDOW_DEFAULT_MS,
  FINISH_WINDOW_FLOOR_MS,
  NO_SHOW_ALERT_AFTER_MS,
  dueTransitions,
  finishWindowEndsAtMs,
  finishWindowRejection,
  finishWindowVerdict,
  lateCaptureOutcome,
  reviewAgingBand,
  scheduleRecords,
  type AutomaticTransition,
  type AutomaticTransitionId,
  type RunTimingFacts,
} from '@/surfaces/doh/transitions'

/**
 * Slice 6, wave 0, task 3 — the deterministic due-transition evaluator.
 *
 * Four things are proved here and they are not the same claim:
 *
 *   1. HOW MANY TIMERS THERE ARE. The plan says four and lists five. Every
 *      one of the five is read at its own locator IN THE FROZEN SOURCE and
 *      classified, so the register in `transitions.ts` cannot drift from
 *      what the source says without this file going red.
 *   2. THAT THE TRANSITIONS HAVE NO ACTOR. Not by reading the `actor` field
 *      and finding it null — that is the field under test asserting about
 *      itself. By three independent routes: the type cannot hold an
 *      identity, the module cannot SEE an identity, and a full identity in
 *      scope during evaluation leaks nowhere into the output.
 *   3. THAT IT IS DETERMINISTIC. Same fixture, same advance, same output —
 *      and, the stronger property, the same output whether the clock got
 *      there in one jump or eight steps.
 *   4. THAT DEC-FINISH-001 IS DISCLOSED RATHER THAN SETTLED.
 *
 * Numeric expectations below are written as RAW LITERALS (900_000, not
 * `15 * MINUTE_MS`) so that no assertion is derived from the constant it is
 * checking. A test that computes its expectation from the field under test
 * passes for any value of that field.
 */

/* ==================================================================== *
 * THE FROZEN SOURCE.
 * ==================================================================== */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA256 = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const SOURCE_LINE_COUNT = 122_241

const sourceBytes = existsSync(SOURCE_PATH) ? readFileSync(SOURCE_PATH) : Buffer.alloc(0)
const sourceLines = ((lines: string[]) => (lines.at(-1) === '' ? lines.slice(0, -1) : lines))(
  sourceBytes.toString('utf8').split('\n'),
)

/** 1-based, the way a citation is written. */
const L = (n: number): string => sourceLines[n - 1] ?? ''

/** Markdown emphasis stripped, so a quote spanning a bold run still matches. */
const plain = (s: string): string => s.replace(/[*`_]/g, '')

describe('the frozen source this task read', () => {
  it('is the file the standing rules name, by hash and by length', () => {
    expect(sourceBytes.length).toBeGreaterThan(0)
    expect(createHash('sha256').update(sourceBytes).digest('hex')).toBe(SOURCE_SHA256)
    expect(sourceLines.length).toBe(SOURCE_LINE_COUNT)
  })
})

/* ==================================================================== *
 * 1. HOW MANY TIMERS THERE ACTUALLY ARE.
 *
 * The dispatch's table has five rows under a heading saying four, and the
 * plan it came from has the same defect at
 * `docs/superpowers/plans/2026-08-21-replan-slices-05-13.md` slice 6
 * mechanism (3). Neither number describes what is at the locators, because
 * the five rows are four different KINDS of mechanism.
 *
 * The expected locator and the expected classification below are written
 * out literally in this file, independently of the register, and the
 * SOURCE LINE at that locator must carry the token that justifies the
 * classification. That is what makes this a reading of the source rather
 * than a restatement of the register.
 * ==================================================================== */

const EXPECTED_ROWS = [
  {
    locator: 'L27868',
    line: 27_868,
    kind: 'automatic-notification',
    // The verb is `raises`, and an alert is not a lifecycle state.
    mustContain: 'raises a supervisor alert at plus 15 minutes',
  },
  {
    locator: 'L27868',
    line: 27_868,
    kind: 'automatic-transition',
    mustContain: 'is auto-cancelled at plus 30 minutes',
  },
  {
    locator: 'L27880',
    line: 27_880,
    kind: 'automatic-transition',
    mustContain: "the platform's run auto-close scheduler closes the record automatically",
  },
  {
    locator: 'L27884',
    line: 27_884,
    kind: 'arrival-driven',
    // "arriving" is the trigger. Elapsed time only bounds acceptance.
    mustContain: 'A Data Capture arriving after run completion is accepted up to the finish window',
  },
  {
    locator: 'L28269',
    line: 28_269,
    kind: 'display-band',
    // The same sentence that names the hours refuses to make them a lock.
    mustContain: 'the aging highlights and the digest are the pressure, not a lock',
  },
] as const

describe('the timer count, read at the locators rather than taken from the brief', () => {
  it('finds FIVE rows where the plan heading says four', () => {
    expect(BRIEFED_TIMER_ROWS).toHaveLength(5)
    expect(EXPECTED_ROWS).toHaveLength(5)
  })

  it.each(EXPECTED_ROWS)(
    'reads $locator in the frozen source and finds the text that fixes its kind as $kind',
    ({ line, mustContain }) => {
      expect(plain(L(line))).toContain(mustContain)
    },
  )

  it('classifies each row the way its own line reads', () => {
    expect(BRIEFED_TIMER_ROWS.map((r) => [r.locator, r.kind])).toEqual(
      EXPECTED_ROWS.map((r) => [r.locator, r.kind]),
    )
  })

  it('counts THREE clock-driven timers, not four and not five', () => {
    // `summary-recompute` is an automatic transition but not a timer: no
    // amount of elapsed time produces one, so it is not in DUE_TIMERS.
    expect(DUE_TIMERS).toEqual(['no-show-alert', 'auto-cancel', 'run-auto-close'])
    const clockDriven = BRIEFED_TIMER_ROWS.filter(
      (r) => r.kind === 'automatic-transition' || r.kind === 'automatic-notification',
    )
    expect(clockDriven).toHaveLength(3)
  })

  it('counts TWO of them as run-state changes and one as an alert', () => {
    expect(BRIEFED_TIMER_ROWS.filter((r) => r.kind === 'automatic-transition')).toHaveLength(2)
    expect(BRIEFED_TIMER_ROWS.filter((r) => r.kind === 'automatic-notification')).toHaveLength(1)
  })

  it('counts the last two rows out of the timer set entirely', () => {
    expect(BRIEFED_TIMER_ROWS.filter((r) => r.kind === 'arrival-driven')).toHaveLength(1)
    expect(BRIEFED_TIMER_ROWS.filter((r) => r.kind === 'display-band')).toHaveLength(1)
  })

  it('never lets an aging band become a timer id', () => {
    const timers: readonly string[] = DUE_TIMERS
    for (const band of AGING_BANDS) expect(timers).not.toContain(band)
  })
})

/* ==================================================================== *
 * THE COUNT CONTRADICTION IN THE SOURCE ITSELF.
 *
 * The dispatch called these "four automatic state changes". The source
 * says, twice and marked SoW Fact both times, that there is ONE. Neither
 * of those numbers survives reading L27868. Preserved, not resolved.
 *
 * ONE OF THE TWO LOCATORS WAS WRONG AND IS CORRECTED HERE. Wave 0 cited
 * L27854 and L7078 as the tagged pair. L27854 states the claim but is
 * §19.8's untagged "In simple words" paragraph and carries no
 * classification; the tagged restatement inside §19.8 is L27933. The
 * contradiction is untouched — only where to look for one half of it moved.
 *
 * THE TAG IS NOW READ, NOT ASSUMED, which is what would have caught this the
 * first time: the old block asserted the WORDS at L27854 and never asked
 * whether the line was tagged, so a locator pointing at plain prose passed a
 * test named for a `SoW Fact` claim. Every locator in `claimLocators` is now
 * required to carry the tag, at its own line, in the frozen source.
 * ==================================================================== */

const SOW_FACT = '[SoW Fact'

describe('the source contradicts itself on how many actorless transitions exist', () => {
  it('states it at L27933, inside §19.8, and marks it SoW Fact', () => {
    expect(plain(L(27_933))).toContain(
      'This is the one automatic transition on the platform — a data-integrity rule, not a status change.',
    )
    expect(L(27_933)).toContain(SOW_FACT)
  })

  it('states it again at L7078, and marks it SoW Fact', () => {
    expect(plain(L(7078))).toContain("This is the platform's one automatic transition")
    expect(L(7078)).toContain(SOW_FACT)
  })

  // WHY L27854 IS NOT IN `claimLocators`, proved rather than asserted. It
  // says the same thing and carries no classification, so offering it as a
  // tagged source claim is the defect this test now forbids.
  it('says the same thing at L27854 in plain words, with NO classification', () => {
    expect(plain(L(27_854))).toContain(
      'That automatic closing is the only thing on this platform that happens without a person deciding it.',
    )
    expect(L(27_854)).not.toContain('SoW Fact')
    expect(CONTRADICTION_AUTOMATIC_TRANSITION_COUNT.claimLocators).not.toContain('L27854')
  })

  it('gives two more at L27868, also marked SoW Fact', () => {
    expect(plain(L(27_868))).toContain('supervisor alert at plus 15 minutes')
    expect(plain(L(27_868))).toContain('auto-cancelled at plus 30 minutes')
    expect(L(27_868)).toContain(SOW_FACT)
  })

  it('restates the same two at L7072, so it is not a one-line slip', () => {
    expect(plain(L(7072))).toContain('a Supervisor alert fires at 15 minutes past the scheduled start')
    expect(plain(L(7072))).toContain('the run auto-cancels at 30 minutes')
  })

  it('records the contradiction unresolved, with both sides locatable', () => {
    expect(CONTRADICTION_AUTOMATIC_TRANSITION_COUNT.resolved).toBe(false)
    expect(CONTRADICTION_AUTOMATIC_TRANSITION_COUNT.claimLocators).toEqual(['L27933', 'L7078'])
    expect(CONTRADICTION_AUTOMATIC_TRANSITION_COUNT.againstLocators).toEqual(['L27868', 'L7072'])
  })

  // THE GENERAL FORM, so the next locator to go wrong goes red too. Every
  // line this record offers as a tagged claim must BE tagged, wherever the
  // record moves next; the expectation is the frozen source, never the field.
  it('carries the SoW Fact tag at every line it cites as a tagged claim', () => {
    for (const locator of CONTRADICTION_AUTOMATIC_TRANSITION_COUNT.claimLocators) {
      const line = Number(locator.replace(/^L/, ''))
      expect(Number.isInteger(line), locator).toBe(true)
      expect(L(line), `${locator} is offered as a SoW Fact claim and is not tagged`).toContain(
        SOW_FACT,
      )
    }
  })

  // The claim the record states must be findable at the lines it names.
  it('quotes something each cited line actually says', () => {
    for (const locator of CONTRADICTION_AUTOMATIC_TRANSITION_COUNT.claimLocators) {
      const line = Number(locator.replace(/^L/, ''))
      expect(plain(L(line)).toLowerCase(), locator).toContain('one automatic transition')
    }
  })
})

/* ==================================================================== *
 * THE TIMER CONSTANTS. Raw literals only.
 * ==================================================================== */

describe('the timer constants', () => {
  it('puts the no-show alert at fifteen minutes', () => {
    expect(NO_SHOW_ALERT_AFTER_MS).toBe(900_000)
  })

  it('puts the auto-cancel at thirty minutes', () => {
    expect(AUTO_CANCEL_AFTER_MS).toBe(1_800_000)
  })

  it('bounds the finish window at 24 hours and 7 days, defaulting to 48', () => {
    expect(FINISH_WINDOW_FLOOR_MS).toBe(86_400_000)
    expect(FINISH_WINDOW_DEFAULT_MS).toBe(172_800_000)
    expect(FINISH_WINDOW_CEILING_MS).toBe(604_800_000)
  })
})

/* ==================================================================== *
 * THE EVALUATOR.
 * ==================================================================== */

const TENANT = tenantId('TEN-RIVERSIDE')

function run(over: Partial<RunTimingFacts> = {}): RunTimingFacts {
  return {
    runId: 'RUN-0001',
    tenant: TENANT,
    scheduledStartMs: CANONICAL_EPOCH_MS,
    startedAtMs: null,
    cancelledAtMs: null,
    completeAtMs: null,
    finishedAtMs: null,
    finishWindowMs: 172_800_000,
    ...over,
  }
}

/** A clock parked `ms` after the canonical epoch. */
const at = (ms: number) => fixedClock(CANONICAL_EPOCH_MS + ms)

const ids = (ts: readonly AutomaticTransition[]): readonly AutomaticTransitionId[] =>
  ts.map((t) => t.id)

describe('the no-show timers (L27868)', () => {
  it('fires nothing one millisecond before fifteen minutes', () => {
    expect(dueTransitions(run(), at(899_999))).toEqual([])
  })

  it('raises the alert at exactly fifteen minutes, moving no state', () => {
    const [t, ...rest] = dueTransitions(run(), at(900_000))
    expect(rest).toEqual([])
    expect(t?.id).toBe('no-show-alert')
    expect(t?.toState).toBeNull()
    expect(t?.atMs).toBe(CANONICAL_EPOCH_MS + 900_000)
  })

  it('still has not cancelled one millisecond before thirty minutes', () => {
    expect(ids(dueTransitions(run(), at(1_799_999)))).toEqual(['no-show-alert'])
  })

  it('cancels at exactly thirty minutes, in due order', () => {
    const out = dueTransitions(run(), at(1_800_000))
    expect(ids(out)).toEqual(['no-show-alert', 'auto-cancel'])
    expect(out[1]?.toState).toBe('cancelled')
    expect(out[1]?.atMs).toBe(CANONICAL_EPOCH_MS + 1_800_000)
  })

  it('fires neither on a run that started, however late the clock is', () => {
    const started = run({ startedAtMs: CANONICAL_EPOCH_MS + 60_000 })
    expect(dueTransitions(started, at(86_400_000))).toEqual([])
  })

  it('fires neither on a run a person already cancelled', () => {
    const cancelled = run({ cancelledAtMs: CANONICAL_EPOCH_MS + 60_000 })
    expect(dueTransitions(cancelled, at(86_400_000))).toEqual([])
  })

  it('fires each timer once — an already-emitted id is not re-emitted', () => {
    expect(ids(dueTransitions(run(), at(1_800_000), ['no-show-alert']))).toEqual(['auto-cancel'])
    expect(dueTransitions(run(), at(1_800_000), ['no-show-alert', 'auto-cancel'])).toEqual([])
  })
})

describe('run auto-close (L27880)', () => {
  const complete = run({ completeAtMs: CANONICAL_EPOCH_MS + 3_600_000, startedAtMs: CANONICAL_EPOCH_MS })

  it('knows when the window ends', () => {
    expect(finishWindowEndsAtMs(complete)).toBe(CANONICAL_EPOCH_MS + 3_600_000 + 172_800_000)
  })

  it('does not close one millisecond early', () => {
    expect(dueTransitions(complete, at(3_600_000 + 172_800_000 - 1))).toEqual([])
  })

  it('closes to `finished` the instant the window elapses', () => {
    const [t] = dueTransitions(complete, at(3_600_000 + 172_800_000))
    expect(t?.id).toBe('run-auto-close')
    expect(t?.toState).toBe('finished')
  })

  it('never closes a run that never reached complete', () => {
    const started = run({ startedAtMs: CANONICAL_EPOCH_MS })
    expect(finishWindowEndsAtMs(started)).toBeNull()
    expect(dueTransitions(started, at(31_536_000_000))).toEqual([])
  })

  it('never closes a run twice', () => {
    const finished = { ...complete, finishedAtMs: CANONICAL_EPOCH_MS + 200_000_000 }
    expect(dueTransitions(finished, at(31_536_000_000))).toEqual([])
  })
})

/* ==================================================================== *
 * 3. DETERMINISM.
 * ==================================================================== */

/**
 * Walk a clock forward through `advances`, evaluating after each step and
 * carrying the emitted ids forward — which is what a scenario engine does.
 */
function sweep(facts: RunTimingFacts, advances: readonly number[]): readonly AutomaticTransition[] {
  const clock = fixedClock(CANONICAL_EPOCH_MS)
  const seen: AutomaticTransitionId[] = []
  const all: AutomaticTransition[] = []
  for (const ms of advances) {
    clock.advance(ms)
    for (const t of dueTransitions(facts, clock, seen)) {
      seen.push(t.id)
      all.push(t)
    }
  }
  return all
}

describe('determinism', () => {
  it('returns a deeply equal result when called twice on an unadvanced clock', () => {
    // This is what forbids `clock.logicalTick()`: a mutable counter would
    // make these two calls differ while nothing about the world changed.
    const clock = at(1_800_000)
    expect(dueTransitions(run(), clock)).toEqual(dueTransitions(run(), clock))
  })

  it('produces identical ledger records from two independently built clocks', () => {
    const a = scheduleRecords(dueTransitions(run(), at(1_800_000)), 7)
    const b = scheduleRecords(dueTransitions(run(), at(1_800_000)), 7)
    expect(a).toEqual(b)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('records the DUE instant, not the observation instant', () => {
    // One 40-minute jump against eight 5-minute steps. Both must record the
    // alert at +15 and the cancellation at +30. If `atMs` were `clock.now()`
    // the single jump would stamp both at +40 and the schedule board would
    // disagree with the audit trail about a run nobody touched.
    const oneJump = sweep(run(), [2_400_000])
    const eightSteps = sweep(run(), Array<number>(8).fill(300_000))
    expect(oneJump).toEqual(eightSteps)
    expect(oneJump.map((t) => t.atMs)).toEqual([
      CANONICAL_EPOCH_MS + 900_000,
      CANONICAL_EPOCH_MS + 1_800_000,
    ])
  })

  it('reads no ambient time and no randomness anywhere in the module', () => {
    // Stripped, not raw: this module's own prose NAMES `Date.now()` and
    // `Math.random()` in order to deny them, and a raw scan goes red on
    // correct code.
    const code = stripComments(readFileSync('src/surfaces/doh/transitions.ts', 'utf8'))
    expect(code).not.toMatch(/Date\.now|new Date\(/)
    expect(code).not.toMatch(/Math\.random/)
    expect(code).not.toMatch(/randomUUID/)
    // `logicalTick` is a MUTABLE counter on the injected Clock. Reading it
    // would break the "called twice, same answer" property above, so the
    // module must not reach for it even though it is right there.
    expect(code).not.toMatch(/logicalTick/)
  })
})

/* ==================================================================== *
 * 2. NO ACTOR — proved three ways, none of them by reading `actor`.
 * ==================================================================== */

/** Every string anywhere in a value, however deeply nested. */
function allStrings(v: unknown, acc: string[] = []): string[] {
  if (typeof v === 'string') acc.push(v)
  else if (Array.isArray(v)) for (const x of v) allStrings(x, acc)
  else if (v !== null && typeof v === 'object') for (const x of Object.values(v)) allStrings(x, acc)
  return acc
}

describe('an automatic transition has no actor', () => {
  /* ---- route 1: the TYPE cannot hold an identity ------------------- */

  it('types `actor` as exactly null, so an identity does not compile', () => {
    type ActorIsExactlyNull = [AutomaticTransition['actor']] extends [null]
      ? [null] extends [AutomaticTransition['actor']]
        ? true
        : never
      : never
    const proof: ActorIsExactlyNull = true
    expect(proof).toBe(true)
  })

  it('refuses an identity in the actor field at compile time', () => {
    const base = dueTransitions(run(), at(1_800_000))[1]!
    // @ts-expect-error -- `actor` is the literal type `null`. Widening it to
    // `string | null` makes this ts-expect-error unused and `pnpm typecheck`
    // goes red, which is the point: the guard fails when it stops guarding.
    const leak: AutomaticTransition = { ...base, actor: 'USR-SUPERVISOR-01' }
    expect(leak.actor).toBe('USR-SUPERVISOR-01')
  })

  /* ---- route 2: the MODULE cannot see an identity ------------------ */

  it('names no identity type or actor field anywhere in the module', () => {
    // The failure mode is not a developer deciding to lie. It is a consumer
    // that already holds an identity reaching for the nearest one because
    // the field wanted a value. The module cannot do that if it has no way
    // to receive one, and this is the check that it still has none.
    const code = stripComments(readFileSync('src/surfaces/doh/transitions.ts', 'utf8'))
    for (const forbidden of [
      'actorOfRecord',
      'IdentitySimulationState',
      'identity',
      'signedIn',
      'RoleId',
      'TransitionContext',
    ]) {
      expect(code, `module must not reference ${forbidden}`).not.toContain(forbidden)
    }
  })

  /* ---- route 3: a real identity in scope leaks nowhere -------------- */

  it('leaks no part of a signed-in identity into the transitions or the ledger', () => {
    // A fully populated identity, exactly as the rest of the build carries
    // one, live in this scope during evaluation — and never passed in,
    // because there is no parameter that would take it.
    const supervisor: IdentitySimulationState = {
      signedIn: true,
      role: 'supervisor' as IdentitySimulationState['role'],
      tenant: TENANT,
      siteScope: ['SITE-RIVERSIDE'],
      areaScope: ['AREA-LINE-2'],
      qualifications: ['QUAL-FOOD-SAFETY'],
      deviceId: 'DEV-HUB-11',
      stepUpActive: false,
      accessSessionId: 'SESS-77',
    }
    const out = dueTransitions(run(), at(1_800_000))
    const records = scheduleRecords(out, 1)
    const emitted = allStrings([out, records])

    expect(emitted.length).toBeGreaterThan(0)
    for (const needle of [
      'supervisor',
      'SITE-RIVERSIDE',
      'AREA-LINE-2',
      'QUAL-FOOD-SAFETY',
      'DEV-HUB-11',
      'SESS-77',
    ]) {
      expect(emitted.join(' '), `identity fragment ${needle} leaked`).not.toContain(needle)
    }
    // The identity really was reachable — otherwise the loop above proves
    // nothing about leakage, only that the fixture was unused.
    expect(supervisor.accessSessionId).toBe('SESS-77')
  })

  /* ---- what IS recorded instead ------------------------------------ */

  it('names the mechanism on the ledger record, per TEST-RUN-002 at L7135', () => {
    expect(plain(L(7135))).toContain(
      'assert the automatic finish with an audit event naming the scheduler',
    )
    const complete = run({ completeAtMs: CANONICAL_EPOCH_MS, startedAtMs: CANONICAL_EPOCH_MS })
    const [rec, ...rest] = scheduleRecords(dueTransitions(complete, at(172_800_000)), 4)
    expect(rest).toEqual([])
    expect(rec?.kind).toBe('doh.run.run-auto-close')
    expect(rec?.id).toBe('SCHED-RUN-0001-run-auto-close')
    expect(rec?.sequence).toBe(4)
    expect(rec?.tenant).toBe(TENANT)
    expect(rec?.payload).toEqual({
      runId: 'RUN-0001',
      toState: 'finished',
      dueAtMs: CANONICAL_EPOCH_MS + 172_800_000,
      actor: null,
    })
  })

  it('carries no actor on the arrival-driven recompute either', () => {
    const complete = run({ completeAtMs: CANONICAL_EPOCH_MS, startedAtMs: CANONICAL_EPOCH_MS })
    const { recompute } = lateCaptureOutcome(complete, CANONICAL_EPOCH_MS + 60_000, false)
    expect(recompute?.id).toBe('summary-recompute')
    expect(recompute?.actor).toBeNull()
  })
})

/* ==================================================================== *
 * ROW 4 — the late-arriving capture (L27884, TEST-RUN-003 at L7136).
 * ==================================================================== */

describe('late-arriving captures', () => {
  const complete = run({ completeAtMs: CANONICAL_EPOCH_MS, startedAtMs: CANONICAL_EPOCH_MS })
  const WINDOW_END = CANONICAL_EPOCH_MS + 172_800_000

  it('accepts a capture one minute inside the window, flagged late, and recomputes', () => {
    const out = lateCaptureOutcome(complete, WINDOW_END - 60_000, false)
    expect(out.accepted).toBe(true)
    expect(out.flags).toEqual(['late_arrival'])
    expect(out.recompute).not.toBeNull()
  })

  it('rejects a capture one minute after the window, with no recompute', () => {
    const out = lateCaptureOutcome(complete, WINDOW_END + 60_000, false)
    expect(out.accepted).toBe(false)
    expect(out.flags).toEqual([])
    expect(out.recompute).toBeNull()
  })

  it('dual-flags an archived worker inside the window (L27884)', () => {
    expect(plain(L(27_884))).toContain('dual-flagged')
    const out = lateCaptureOutcome(complete, WINDOW_END - 60_000, true)
    expect(out.flags).toEqual(['late_arrival', 'submitted_by_archived_worker'])
  })

  it('treats a capture arriving before complete as an ordinary capture', () => {
    const out = lateCaptureOutcome(complete, CANONICAL_EPOCH_MS - 1, false)
    expect(out.accepted).toBe(true)
    expect(out.flags).toEqual([])
    expect(out.recompute).toBeNull()
  })

  it('agrees with auto-close about the exact boundary instant', () => {
    // The load-bearing consistency claim: one instant cannot be both inside
    // the window and after the run auto-closed. At exactly WINDOW_END the
    // run closes AND the capture is refused, in the same evaluation.
    expect(lateCaptureOutcome(complete, WINDOW_END, false).accepted).toBe(false)
    expect(ids(dueTransitions(complete, at(172_800_000)))).toEqual(['run-auto-close'])
  })

  it('never produces a recompute from the clock alone', () => {
    // `summary-recompute` is reachable only through an arrival. Advancing a
    // year over a completed run yields auto-close and nothing else.
    const out = dueTransitions(complete, at(31_536_000_000))
    expect(ids(out)).toEqual(['run-auto-close'])
  })
})

/* ==================================================================== *
 * ROW 5 — the aging bands, which the source refuses to make a lock.
 * ==================================================================== */

describe('review-queue aging bands (L28269)', () => {
  const QUEUED = CANONICAL_EPOCH_MS

  it.each([
    [86_399_999, 'under-24h'],
    [86_400_000, 'aged-24h'],
    [172_799_999, 'aged-24h'],
    [172_800_000, 'aged-48h'],
    [259_199_999, 'aged-48h'],
    [259_200_000, 'aged-72h'],
    [360_000_000, 'aged-72h'],
  ])('bands an item aged %ims as %s', (aged, band) => {
    expect(reviewAgingBand(QUEUED, at(aged))).toBe(band)
  })

  it('is a highlight and not a lock — no transition falls due from aging', () => {
    // The queue item's run is complete with a 7-day window, so it is nowhere
    // near auto-close. Ageing it past 72 hours must produce NOTHING: the
    // source says the highlights "are the pressure, not a lock", and a
    // transition here would fabricate the enforcement it refuses to build.
    const inReview = run({
      completeAtMs: CANONICAL_EPOCH_MS,
      startedAtMs: CANONICAL_EPOCH_MS,
      finishWindowMs: 604_800_000,
    })
    expect(reviewAgingBand(QUEUED, at(259_200_000))).toBe('aged-72h')
    expect(dueTransitions(inReview, at(259_200_000))).toEqual([])
  })

  it('returns a plain band, with nowhere to put a transition', () => {
    const band: unknown = reviewAgingBand(QUEUED, at(360_000_000))
    expect(typeof band).toBe('string')
    expect(AGING_BANDS).toContain(band)
  })
})

/* ==================================================================== *
 * 4. DEC-FINISH-001 — validated AND disclosed.
 * ==================================================================== */

describe('the finish window as a validated tenant setting', () => {
  it('rejects twelve hours and states the bound (TEST-RUN-004 at L7137)', () => {
    expect(plain(L(7137))).toContain(
      'Attempt to set a finish window of 12 hours and assert rejection stating the bound',
    )
    expect(finishWindowVerdict(43_200_000)).toBe('below-floor')
    expect(finishWindowRejection('below-floor')).toContain('24 hours')
  })

  it('rejects one millisecond under the floor', () => {
    expect(finishWindowVerdict(86_399_999)).toBe('below-floor')
  })

  it('accepts the floor, the default and the ceiling exactly', () => {
    expect(finishWindowVerdict(86_400_000)).toBe('accepted')
    expect(finishWindowVerdict(172_800_000)).toBe('accepted')
    expect(finishWindowVerdict(604_800_000)).toBe('accepted')
    expect(finishWindowRejection('accepted')).toBeNull()
  })

  it('rejects one millisecond over the ceiling and states that bound too', () => {
    expect(finishWindowVerdict(604_800_001)).toBe('above-ceiling')
    expect(finishWindowRejection('above-ceiling')).toContain('7 days')
  })
})

describe('DEC-FINISH-001 is disclosed, not settled', () => {
  it('is a card at L27882, and the card is where the readings come from', () => {
    expect(L(27_882)).toContain('DEC-FINISH-001')
    expect(plain(L(27_882))).toContain(
      'state the bounds as settled at a floor of 24 hours and a ceiling of 7 days',
    )
    expect(plain(L(27_882))).toContain(
      'marks the bounds as an open drafting item, suggesting 24 hours to 7 days rather than fixing them',
    )
  })

  it('carries both readings, each with its own locator', () => {
    expect(DEC_FINISH_001.readings).toHaveLength(2)
    for (const r of DEC_FINISH_001.readings) {
      expect(r.text.length).toBeGreaterThan(20)
      expect(r.locator).toContain('L27882')
    }
    expect(DEC_FINISH_001.readings[0]?.text).not.toBe(DEC_FINISH_001.readings[1]?.text)
  })

  it('gives no reading a field in which it could be marked the answer', () => {
    // The rule `src/studio/disclosure/decisions.ts` states: a reading has
    // exactly two fields, because a third is how a disclosure quietly
    // becomes an assertion.
    for (const r of DEC_FINISH_001.readings) {
      expect(Object.keys(r).sort()).toEqual(['locator', 'text'])
    }
  })

  it('says on screen that the bound is enforced AND that one Part leaves it open', () => {
    const s = DEC_FINISH_001.onScreen
    // Enforced — the same two bounds the validator actually applies, named
    // from the raw hours/days rather than from the constants.
    expect(s).toContain('24 hours')
    expect(s).toContain('7 days')
    // Open — the half most easily dropped, which is the whole instruction.
    expect(s).toMatch(/leaves that bound open|drafting/)
    expect(s).toMatch(/unanswered|open/)
  })

  it('names its build position as a build position', () => {
    expect(DEC_FINISH_001.buildPosition).toMatch(/build position/)
    expect(DEC_FINISH_001.buildPosition).not.toMatch(/settled by the source|the source answers/)
  })
})
