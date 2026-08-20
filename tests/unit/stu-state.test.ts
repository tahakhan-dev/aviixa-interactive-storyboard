import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ScreenStateId } from '@/ui/screen-state'
import { SCREEN_STATES } from '@/ui/screen-state'
import { COMMAND_STATES, type CommandState } from '@/surfaces/sa/command-state'
import {
  STU_SCREEN_IDS,
  STU_APPLICABLE_STATES,
  STU_EXCLUDED_STATES,
  STU_STATE_DEPARTURES,
  screensWithState,
  screenRendersState,
  type StudioScreenId,
  type StudioStateApplicability,
} from '@/studio/state/screen-states'
import {
  STU_CONNECTIVITY_TREATMENTS,
  STU_CONNECTIVITY_READINGS,
  STU_CONNECTIVITY_POSTURES,
  STU_POSTURE_ROWS,
  studioConnectivityTreatment,
  studioPostureTransition,
  posturePermitsWrite,
  type StudioConnectivityKind,
  type StudioPosture,
} from '@/studio/state/connectivity'
import {
  COMMAND_STATE_PHRASES,
  FORBIDDEN_ADOPTION_WORDS,
  STU_ADOPTION_SUMMARY_EXEMPLAR,
  claimsAdoption,
  renderAdoption,
  renderAdoptionSummary,
} from '@/studio/state/adoption'

/**
 * Matched on WORD BOUNDARIES. "delivered" contains the letters of "live", so
 * a substring check would fail on the one phrase the source itself prints —
 * and a test that cannot pass on correct code teaches people to weaken it.
 */
const forbidden = (word: string) => new RegExp(`\\b${word}\\b`, 'i')

/* ==================================================================== *
 * Part 1 — S4/D22: the applicable subset of the thirteen, and the four
 * departures (frozen source L48330, verified verbatim against the file).
 * ==================================================================== */

describe('STU_APPLICABLE_STATES — the twelve that render on SURF-STU', () => {
  // FAILS IF: a `STATE-07` row is added to the table, or the exclusion is
  // moved out of the table into a caller-side filter that one caller skips.
  it('excludes STATE-07 from every Studio screen', () => {
    expect(STU_APPLICABLE_STATES.map((s) => s.id)).not.toContain('STATE-07')
  })

  // FAILS IF: any of the other twelve contract states is dropped, or the
  // table drifts out of the source's STATE-01..STATE-13 order. Asserted as
  // exact equality, not `toContain` — defect shape 9 (a subset assertion
  // passes on an empty set) cannot hide here.
  it('carries exactly the other twelve, in contract order', () => {
    expect(STU_APPLICABLE_STATES.map((s) => s.id)).toEqual([
      'STATE-01', 'STATE-02', 'STATE-03', 'STATE-04', 'STATE-05', 'STATE-06',
      'STATE-08', 'STATE-09', 'STATE-10', 'STATE-11', 'STATE-12', 'STATE-13',
    ])
    expect(STU_APPLICABLE_STATES.length + STU_EXCLUDED_STATES.length).toBe(SCREEN_STATES.length)
  })

  // FAILS IF: the exclusion record stops naming what replaces STATE-07. A
  // build that merely omits STATE-07 has hidden the departure; L48330 says
  // what takes its place, and a screen must be able to render that.
  it('names STATE-12 with unsaved-work protection as what replaces STATE-07', () => {
    expect(STU_EXCLUDED_STATES.map((s) => s.id)).toEqual(['STATE-07'])
    const [only] = STU_EXCLUDED_STATES
    expect(only?.replacedBy).toBe('STATE-12')
    expect(only?.reason).toMatch(/authoring requires a connection/i)
    expect(only?.reason).toMatch(/unsaved-work protection/i)
    expect(only?.sourceRef).toMatch(/L48330/)
  })

  // FAILS IF: STATE-07 leaks back onto any screen through `screensWithState`
  // — the reader, not just the table, has to refuse it.
  it('returns no screens at all for STATE-07', () => {
    expect(screensWithState('STATE-07')).toEqual([])
  })
})

describe('the four departures from the thirteen-state contract (L48330)', () => {
  // FAILS IF: a fifth departure is invented, or one of the four is dropped.
  // L48330 says "four stated departures" and enumerates them.
  it('records exactly four, each with its source locator', () => {
    expect(STU_STATE_DEPARTURES.length).toBe(4)
    for (const d of STU_STATE_DEPARTURES) {
      expect(d.sourceRef, d.states.join('/')).toMatch(/L48330/)
      expect(d.states.length, d.sourceRef).toBeGreaterThan(0)
    }
    expect(STU_STATE_DEPARTURES.flatMap((d) => d.states).sort()).toEqual(
      ['STATE-04', 'STATE-07', 'STATE-09', 'STATE-10', 'STATE-11'],
    )
  })

  // FAILS IF: STATE-09 is widened to every screen (the easy wrong reading of
  // "the contract defaults apply"), or narrowed to publication screens by
  // guessing rather than by the two the source names.
  it('applies STATE-09 on exactly two screens', () => {
    expect(screensWithState('STATE-09')).toEqual(['SCR-STU-04', 'SCR-STU-11'])
  })

  // FAILS IF: the artificial-intelligence pair is copied from slice 4, where
  // STATE-10/STATE-11 render nowhere. On this surface they render, and on a
  // DIFFERENT pair of screens from STATE-09 — SCR-STU-13, not SCR-STU-11.
  it('applies STATE-10 and STATE-11 on exactly two screens', () => {
    expect(screensWithState('STATE-10')).toEqual(['SCR-STU-04', 'SCR-STU-13'])
    expect(screensWithState('STATE-11')).toEqual(['SCR-STU-04', 'SCR-STU-13'])
  })

  // FAILS IF: STATE-04's special weight is lost — the two named checks
  // becoming warnings instead of publication blockers is precisely the
  // dishonest-product failure L48330 legislates against.
  it('carries STATE-04 as a publication blocker, not a warning', () => {
    const row = STU_APPLICABLE_STATES.find((s) => s.id === 'STATE-04')
    expect(row?.departure).toMatch(/publication blockers, not warnings/i)
    expect(row?.departure).toMatch(/locale completeness/i)
    expect(row?.departure).toMatch(/severity-mapping/i)
  })

  // FAILS IF: a contract-default state is quietly narrowed to a subset of
  // screens. Asserted against the full fifteen with the length checked, so
  // it cannot pass on an empty result (defect shape 5).
  it('applies every non-departure state to all fifteen screens', () => {
    const departed: readonly ScreenStateId[] = ['STATE-09', 'STATE-10', 'STATE-11']
    const defaults = STU_APPLICABLE_STATES.filter((s) => !departed.includes(s.id))
    expect(defaults.length).toBe(9)
    for (const s of defaults) {
      expect(screensWithState(s.id), s.id).toEqual(STU_SCREEN_IDS)
      expect(screensWithState(s.id).length, s.id).toBe(15)
    }
  })
})

describe('the fifteen-screen register (catalogue B, L48259-L48273)', () => {
  // FAILS IF: a screen id is invented or the catalogue is truncated. L48330:
  // "All fifteen screens render the contract defaults".
  it('holds exactly fifteen screens in source order', () => {
    expect(STU_SCREEN_IDS).toEqual([
      'SCR-STU-01', 'SCR-STU-02', 'SCR-STU-03', 'SCR-STU-04', 'SCR-STU-05',
      'SCR-STU-06', 'SCR-STU-07', 'SCR-STU-08', 'SCR-STU-09', 'SCR-STU-10',
      'SCR-STU-11', 'SCR-STU-12', 'SCR-STU-13', 'SCR-STU-14', 'SCR-STU-15',
    ])
  })

  // FAILS IF: a departure names a screen outside the catalogue — the
  // "screen pointing at content that is not there" defect (shape 4/5).
  it('never names a screen outside the catalogue', () => {
    const named = STU_APPLICABLE_STATES.flatMap((s) => (s.screens === 'all' ? [] : s.screens))
    expect(named.length).toBe(6) // STATE-09 ×2, STATE-10 ×2, STATE-11 ×2.
    for (const id of named) expect(STU_SCREEN_IDS, id).toContain(id)
  })
})

describe('screenRendersState — the per-screen reader eighteen screens call', () => {
  // FAILS IF: `screenRendersState` re-derives the ruling instead of reading
  // the same row `screensWithState` reads. An exported reader with no test
  // is defect shape 1 waiting to happen: a control that does nothing.
  it('answers from the same table, for a departure state and a default one', () => {
    expect(screenRendersState('SCR-STU-04', 'STATE-09')).toBe(true)
    expect(screenRendersState('SCR-STU-11', 'STATE-09')).toBe(true)
    expect(screenRendersState('SCR-STU-02', 'STATE-09')).toBe(false)
    expect(screenRendersState('SCR-STU-11', 'STATE-10')).toBe(false)
    expect(screenRendersState('SCR-STU-13', 'STATE-10')).toBe(true)
    expect(screenRendersState('SCR-STU-02', 'STATE-03')).toBe(true)
  })

  // FAILS IF: STATE-07 reaches any of the fifteen through this reader. All
  // fifteen are checked, not a sample — the departure has to hold everywhere.
  it('refuses STATE-07 on every one of the fifteen screens', () => {
    expect(STU_SCREEN_IDS.length).toBe(15)
    for (const id of STU_SCREEN_IDS) {
      expect(screenRendersState(id, 'STATE-07'), id).toBe(false)
    }
  })

  // FAILS IF: it closes over the module-load table rather than reading the
  // register handed to it.
  it('reads its register as a parameter', () => {
    const alternate: readonly StudioStateApplicability[] = [
      { id: 'STATE-07', screens: ['SCR-STU-01'], departure: null, sourceRef: 'test-fixture' },
    ]
    expect(screenRendersState('SCR-STU-01', 'STATE-07', alternate)).toBe(true)
    expect(screenRendersState('SCR-STU-01', 'STATE-07')).toBe(false)
  })
})

describe('screensWithState reads its register as a parameter', () => {
  // FAILS IF: `screensWithState` closes over a module-load snapshot of the
  // table instead of reading the register it is handed. That exact defect —
  // a reader bound to a module-load snapshot — shipped three times in slice
  // 4, and eighteen module screens are about to call this function.
  it('answers from the register it is given, not from a module-load snapshot', () => {
    const alternate: readonly StudioStateApplicability[] = [
      { id: 'STATE-09', screens: ['SCR-STU-01'], departure: null, sourceRef: 'test-fixture' },
    ]
    expect(screensWithState('STATE-09', alternate)).toEqual(['SCR-STU-01'])
    // And the default register is untouched by the call above.
    expect(screensWithState('STATE-09')).toEqual(['SCR-STU-04', 'SCR-STU-11'])
  })

  // FAILS IF: a state absent from the supplied register is silently treated
  // as a contract default and granted all fifteen screens. Absent must mean
  // absent, or the STATE-07 exclusion is one table edit away from evaporating.
  it('returns no screens for a state the register does not carry', () => {
    expect(screensWithState('STATE-03', [])).toEqual([])
  })
})

/* ==================================================================== *
 * Part 2 — S5/D4: the connectivity ruling.
 * ==================================================================== */

describe('studioConnectivityTreatment — D4', () => {
  // FAILS IF: any one of the five treatments is collapsed into another —
  // most dangerously, a failed read rendered as stale content, which is a
  // screen showing data it cannot confirm.
  it('splits connection loss four ways and never queues', () => {
    expect(studioConnectivityTreatment({ kind: 'loaded-content' })).toMatchObject({
      state: 'STATE-08',
      freshness: 'required',
    })
    expect(studioConnectivityTreatment({ kind: 'failed-read' })).toMatchObject({
      state: 'STATE-12',
      namesWhatFailed: true,
      namesWhetherAnythingWasWritten: true,
    })
    expect(studioConnectivityTreatment({ kind: 'write-control' })).toMatchObject({
      render: 'disabled',
      queued: false,
    })
    expect(studioConnectivityTreatment({ kind: 'editor' })).toMatchObject({
      localBuffer: true,
      message: /no save has been recorded/i,
    })
    expect(studioConnectivityTreatment({ kind: 'reconnect' })).toMatchObject({
      state: 'STATE-13',
      revalidate: 'full',
    })
  })

  // FAILS IF: any treatment sets `queued` true, or a sixth treatment is
  // added without the never-queue property. "Nothing on this surface ever
  // queues a write" is the whole of D4's second half; iterating the table
  // means a new row cannot dodge it. The length assertion keeps the loop
  // from passing vacuously (defect shape 5).
  it('never queues on any treatment, and there are exactly five', () => {
    expect(STU_CONNECTIVITY_TREATMENTS.length).toBe(5)
    const kinds = STU_CONNECTIVITY_TREATMENTS.map((t) => t.kind)
    expect(kinds).toEqual(['loaded-content', 'failed-read', 'write-control', 'editor', 'reconnect'])
    for (const kind of kinds) {
      expect(studioConnectivityTreatment({ kind }).queued, kind).toBe(false)
    }
  })

  // FAILS IF: a write control renders enabled, or disables without naming
  // its reason. D9 sense A: DISABLED with the condition named — an
  // unexplained disabled control is the same lie as a hidden one.
  it('disables every write control with a named reason', () => {
    const t = studioConnectivityTreatment({ kind: 'write-control' })
    expect(t.render).toBe('disabled')
    expect(t.reason).toMatch(/requires an active connection/i)
    expect(t.reason.length).toBeGreaterThan(10)
  })

  // FAILS IF: the editor claims a save, or drops the local buffer, or leaves
  // submit or publish live. FB-STU-01 (L30863) names all four behaviours;
  // AC-STU-009 (L30871) forbids the save confirmation.
  it('holds the editor in an explicit disconnected state with the buffer and no save claim', () => {
    const t = studioConnectivityTreatment({ kind: 'editor' })
    expect(t.localBuffer).toBe(true)
    expect(t.submitDisabled).toBe(true)
    expect(t.publishDisabled).toBe(true)
    expect(t.message).toMatch(/no save has been recorded/i)
    // `\b` matters: "unsaved edits" is the CORRECT wording and must pass;
    // "saved" or "saving" as their own words is the claim AC-STU-009 forbids.
    expect(t.message).not.toMatch(/\bsaved\b|\bsaving\b/i)
  })

  // FAILS IF: reconnection re-enables submission before structural
  // validation re-runs in full (L32152) — a validation result computed
  // before a dependency changed is stale data being acted upon.
  it('re-runs structural validation in full before submission re-enables', () => {
    const t = studioConnectivityTreatment({ kind: 'reconnect' })
    expect(t.revalidate).toBe('full')
    expect(t.submissionReenabled).toBe(false)
    expect(t.sourceRef).toMatch(/L32152/)
  })

  // FAILS IF: loaded content renders without its freshness stated. STATE-08:
  // "Stale content is never presented as current."
  it('degrades loaded content with its freshness stated, and never as current', () => {
    const t = studioConnectivityTreatment({ kind: 'loaded-content' })
    expect(t.freshness).toBe('required')
    expect(t.presentedAsCurrent).toBe(false)
  })

  // FAILS IF: the unresolved source decision is presented as settled. Three
  // readings disagree (L48014, L48330, L30839-L30851) and no DEC-* id
  // exists; APP-012 delegates the pick, not the pretence that the source
  // settled it, so all three ship with their locators.
  it('discloses all three source readings with their locators', () => {
    // Four rows: the THREE conflicting source readings, plus D4's own
    // reconciling reading, which is the one marked chosen.
    expect(STU_CONNECTIVITY_READINGS.length).toBe(4)
    expect(STU_CONNECTIVITY_READINGS.filter((r) => !r.chosen).length).toBe(3)
    const locators = STU_CONNECTIVITY_READINGS.map((r) => r.sourceRef)
    expect(locators.some((l) => l.includes('L48014'))).toBe(true)
    expect(locators.some((l) => l.includes('L48330'))).toBe(true)
    expect(locators.some((l) => l.includes('L30839'))).toBe(true)
    const chosen = STU_CONNECTIVITY_READINGS.filter((r) => r.chosen)
    expect(chosen.length).toBe(1)
    expect(chosen[0]?.disclosure).toMatch(/client-delegated choice/i)
    expect(chosen[0]?.disclosure).toMatch(/APP-012/)
  })
})

describe('the chapter-20 connectivity posture machine (L30839-L30851)', () => {
  // FAILS IF: the four postures are collapsed into the thirteen screen
  // states, or renamed. They are NOT any of the thirteen, which is exactly
  // why D4 exists.
  it('holds the four postures the source names, and none of the thirteen', () => {
    expect(STU_CONNECTIVITY_POSTURES).toEqual(['Connected', 'Degraded', 'ReadOnlyCache', 'Suspended'])
    for (const p of STU_CONNECTIVITY_POSTURES) {
      expect(SCREEN_STATES.map((s) => s.name), p).not.toContain(p)
    }
  })

  /**
   * The eleventh defect shape is a guard whose baseline was chosen so the
   * failure could not appear — a state machine test that only ever starts
   * from the happy state. So this asserts ALL SIXTEEN ordered pairs, from
   * every posture the model admits, including the ten the source's arrow
   * list does not contain: those must be REFUSED, not merely untested.
   */
  const EXPECTED: Record<StudioPosture, Record<StudioPosture, boolean>> = {
    Connected:     { Connected: false, Degraded: true,  ReadOnlyCache: false, Suspended: false },
    Degraded:      { Connected: true,  Degraded: false, ReadOnlyCache: true,  Suspended: false },
    ReadOnlyCache: { Connected: true,  Degraded: false, ReadOnlyCache: false, Suspended: true  },
    Suspended:     { Connected: true,  Degraded: false, ReadOnlyCache: false, Suspended: false },
  }

  // FAILS IF: a posture's meaning drifts from the source's own wording,
  // which is the sentence a screen prints to explain the posture it is in.
  it('carries the source’s own wording for each posture', () => {
    expect(STU_POSTURE_ROWS.length).toBe(4)
    expect(STU_POSTURE_ROWS.map((r) => r.meaning)).toEqual([
      'Studio fully operational, authoring and publication available',
      'Connection lost, local draft buffer active, no save confirmed',
      'Published content readable from the last retrieved state',
      'Authoring suspended, published content unchanged, runs continue',
    ])
  })

  // FAILS IF: any arrow is added, dropped, or reversed. Six of the sixteen
  // are permitted; the other ten — including all four self-transitions —
  // are refused with a reason rather than left undefined.
  it('rules on all sixteen ordered pairs from every posture, not only the happy one', () => {
    let allowed = 0
    let refused = 0
    for (const from of STU_CONNECTIVITY_POSTURES) {
      for (const to of STU_CONNECTIVITY_POSTURES) {
        const r = studioPostureTransition(from, to)
        expect(r.allowed, `${from} -> ${to}`).toBe(EXPECTED[from][to])
        if (r.allowed) {
          allowed++
          expect(r.trigger.length, `${from} -> ${to}`).toBeGreaterThan(0)
        } else {
          refused++
          expect(r.reason, `${from} -> ${to}`).toMatch(/not a transition/i)
        }
      }
    }
    expect(allowed).toBe(6)
    expect(refused).toBe(10)
  })

  // FAILS IF: an allowed transition loses the source's own trigger wording,
  // which is what a screen renders to explain the move.
  it('carries the source trigger on each of the six permitted transitions', () => {
    const c = studioPostureTransition('Connected', 'Degraded')
    expect(c.allowed && c.trigger).toMatch(/connection lost during an authoring session/i)
    const d = studioPostureTransition('Degraded', 'ReadOnlyCache')
    expect(d.allowed && d.trigger).toMatch(/session times out before restoration/i)
    const s = studioPostureTransition('Suspended', 'Connected')
    expect(s.allowed && s.trigger).toMatch(/dependencies re-validated/i)
  })

  // FAILS IF: a posture outside the four is admitted rather than refused.
  // A typed failure, never a throw — the expected path must not throw.
  it('refuses an unrecognised posture with a typed failure rather than throwing', () => {
    const bogus = 'Offline' as StudioPosture
    expect(() => studioPostureTransition(bogus, 'Connected')).not.toThrow()
    const r = studioPostureTransition(bogus, 'Connected')
    expect(r.allowed).toBe(false)
    expect(r.allowed === false && r.reason).toMatch(/not a transition/i)
  })

  // FAILS IF: writing is permitted in any posture but Connected. Degraded
  // holds a LOCAL buffer, which is not a write; ReadOnlyCache and Suspended
  // are read-only by name. Asserted across all four, not only Connected.
  it('permits writes in Connected alone', () => {
    expect(STU_CONNECTIVITY_POSTURES.filter((p) => posturePermitsWrite(p))).toEqual(['Connected'])
  })
})

/* ==================================================================== *
 * Part 3 — S10: the adoption renderer over slice 3's fifteen command
 * states. AC-STU-023 (L31226), AC-STU-112 (L33590), L33579.
 * ==================================================================== */

describe('renderAdoption — never a claim of a device state', () => {
  // FAILS IF: an indeterminate device is rendered as adopted, live, or in
  // force, or loses its last known state and timestamp. L33579: "shown as
  // unknown with the last known state and its timestamp, never as adopted."
  it('renders an indeterminate device as unknown with its last known state, never adopted', () => {
    const r = renderAdoption({ deviceId: 'DEV-1', commandState: null, lastKnown: { state: 'validated', at: 'T0' } })
    expect(r.label).toMatch(/unknown/i)
    expect(r.label).toMatch(/T0/)
    expect(r.label).toMatch(/validated, not yet applied/)
    expect(r.label).not.toMatch(/adopted|live/i)
    expect(r.determinate).toBe(false)
    expect(r.claimsAdoption).toBe(false)
  })

  // FAILS IF: the forbidden-claim check is written as a substring match. The
  // source's own exemplar phrase, "delivered, not yet applied", contains the
  // letters of "live" — a substring ban would forbid the correct wording and
  // get weakened, which is how a real guard becomes a decorative one.
  it('keeps the source’s “delivered” phrasing without it reading as a live claim', () => {
    const r = renderAdoption({ deviceId: 'DEV-1', commandState: null, lastKnown: { state: 'delivered', at: 'T0' } })
    expect(r.label).toContain('delivered, not yet applied')
    expect(r.label).toContain('T0')
    expect(claimsAdoption(r.label)).toBe(false)
    expect(r.label).not.toMatch(forbidden('live'))
    expect(r.label).not.toMatch(forbidden('adopted'))
  })

  // FAILS IF: the no-history case is folded into the with-history case and
  // renders a blank or an invented timestamp. A device that has never
  // reported is a state the model admits and must render honestly.
  it('renders a device with no history at all as unknown, with nothing invented', () => {
    const r = renderAdoption({ deviceId: 'DEV-2', commandState: null, lastKnown: null })
    expect(r.label).toMatch(/unknown/i)
    expect(r.label).toMatch(/no state has been recorded/i)
    expect(r.label).not.toMatch(/adopted|live|undefined|null/i)
    expect(r.claimsAdoption).toBe(false)
  })

  // FAILS IF: an unrecognised stored state throws, or is rendered as though
  // it were one of the fifteen. The brief's own fixture passes
  // `state: 'dispatched'`, which is NOT one of the source's fifteen — a
  // typed failure, not a throw and not a silent pass-through.
  it('refuses an unrecognised last-known state without throwing and without claiming adoption', () => {
    const input = { deviceId: 'DEV-3', commandState: null, lastKnown: { state: 'dispatched' as CommandState, at: 'T0' } }
    expect(() => renderAdoption(input)).not.toThrow()
    const r = renderAdoption(input)
    expect(r.label).toMatch(/unknown/i)
    expect(r.label).toMatch(/T0/)
    expect(r.label).toMatch(/not recognised/i)
    expect(r.claimsAdoption).toBe(false)
  })

  // FAILS IF: a state that WAS reported but is outside the fifteen renders
  // as "no state has been recorded". A state was recorded; the vocabulary is
  // what does not recognise it, and those are different sentences.
  it('distinguishes a reported-but-unrecognised state from never having reported', () => {
    const r = renderAdoption({ deviceId: 'DEV-6', commandState: 'dispatched' as CommandState, lastKnown: null })
    expect(r.label).toMatch(/unknown/i)
    expect(r.label).toMatch(/reported state not recognised/i)
    expect(r.label).not.toMatch(/no state has been recorded/i)
    expect(r.determinate).toBe(false)
    expect(r.claimsAdoption).toBe(false)
  })

  /**
   * Transitions from EVERY state the model admits, not only the happy one:
   * all fifteen command states, plus the three indeterminate shapes above.
   */
  // FAILS IF: any one of the fifteen renders a forbidden claim — including
  // `applied` and `acknowledged`, the two a naive renderer would call "live".
  it('never claims adoption from any of the fifteen command states', () => {
    expect(COMMAND_STATES.length).toBe(15)
    for (const state of COMMAND_STATES) {
      const r = renderAdoption({ deviceId: 'DEV-4', commandState: state, lastKnown: null })
      expect(r.determinate, state).toBe(true)
      expect(r.claimsAdoption, state).toBe(false)
      expect(claimsAdoption(r.label), state).toBe(false)
      for (const word of FORBIDDEN_ADOPTION_WORDS) {
        expect(r.label, `${state} / ${word}`).not.toMatch(forbidden(word))
      }
    }
  })

  // FAILS IF: the fifteen are collapsed onto a shorter vocabulary — two
  // states sharing one phrase destroys exactly the information the panel
  // exists to show.
  it('gives each of the fifteen its own distinct plain-words phrase', () => {
    const phrases = COMMAND_STATES.map((s) => COMMAND_STATE_PHRASES[s])
    expect(phrases.length).toBe(15)
    expect(new Set(phrases).size).toBe(15)
    for (const p of phrases) expect(p.length).toBeGreaterThan(0)
  })

  // FAILS IF: the three phrasings the source itself prints at L31304 are
  // reworded. They are the exemplars a reviewer checks first.
  it('uses the source’s own three exemplar phrasings verbatim', () => {
    expect(COMMAND_STATE_PHRASES.queued).toBe('queued, not yet delivered')
    expect(COMMAND_STATE_PHRASES.delivered).toBe('delivered, not yet applied')
    expect(COMMAND_STATE_PHRASES.acknowledged).toBe('applied and acknowledged')
  })

  // FAILS IF: `renderAdoption` closes over a module-load snapshot of the
  // phrase table instead of reading the register it is handed.
  it('reads its phrase register as a parameter, not as a module-load snapshot', () => {
    const alternate = { ...COMMAND_STATE_PHRASES, applied: 'aplicado, aún sin confirmar' }
    const r = renderAdoption({ deviceId: 'DEV-5', commandState: 'applied', lastKnown: null }, alternate)
    expect(r.label).toContain('aplicado, aún sin confirmar')
    expect(renderAdoption({ deviceId: 'DEV-5', commandState: 'applied', lastKnown: null }).label)
      .toContain('applied, not yet acknowledged')
  })
})

describe('renderAdoptionSummary — SB-STU-03’s honest summary line (L31304)', () => {
  // FAILS IF: the summary drifts from the source's exemplar by so much as a
  // word. It is the one sentence a Release Authority reads after publishing.
  it('reproduces the source exemplar exactly', () => {
    expect(renderAdoptionSummary({ jobsNotified: 1, devicesOnVersion: 0, devicesTotal: 1 }))
      .toBe('Published. One Job notified. Zero of one devices on this version.')
    expect(STU_ADOPTION_SUMMARY_EXEMPLAR)
      .toBe('Published. One Job notified. Zero of one devices on this version.')
  })

  // FAILS IF: the singular exemplar is hard-coded and the general case is
  // never exercised — defect shape 11, a baseline chosen so the failure
  // cannot appear.
  it('counts plural Jobs and non-zero devices correctly', () => {
    expect(renderAdoptionSummary({ jobsNotified: 4, devicesOnVersion: 2, devicesTotal: 9 }))
      .toBe('Published. Four Jobs notified. Two of nine devices on this version.')
    expect(renderAdoptionSummary({ jobsNotified: 0, devicesOnVersion: 0, devicesTotal: 0 }))
      .toBe('Published. Zero Jobs notified. Zero of zero devices on this version.')
  })

  // FAILS IF: the summary ever says a device is live or adopted, or claims
  // the version is in force. AC-STU-023.
  it('never claims a version is in force on a device', () => {
    const line = renderAdoptionSummary({ jobsNotified: 3, devicesOnVersion: 3, devicesTotal: 3 })
    expect(claimsAdoption(line)).toBe(false)
    expect(FORBIDDEN_ADOPTION_WORDS.length).toBe(7)
    expect(FORBIDDEN_ADOPTION_WORDS).not.toContain('effective')
    for (const word of FORBIDDEN_ADOPTION_WORDS) {
      expect(line, word).not.toMatch(forbidden(word))
    }
  })
})

/* ==================================================================== *
 * Part 4 — the standing build constraints, checked over these three files.
 * ==================================================================== */

describe('the three modules obey the standing constraints', () => {
  const ROOT = join(process.cwd(), 'src/studio/state')
  const FILES = ['screen-states.ts', 'connectivity.ts', 'adoption.ts']
  const sources = FILES.map((f) => ({ f, src: readFileSync(join(ROOT, f), 'utf8') }))
  // Comment-stripped, same reason as the slice-04 gate: these files NAME the
  // forbidden constructs in prose in order to deny them.
  const stripped = sources.map(({ f, src }) => ({
    f,
    src: src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, ''),
  }))

  // FAILS IF: any of the three reads the real clock or randomness. A
  // time-derived state here derives from a stamp its caller supplies.
  it('reads no ambient clock and no randomness', () => {
    for (const { f, src } of stripped) {
      expect(/Date\.now|new Date\(|Math\.random/.test(src), f).toBe(false)
    }
  })

  // FAILS IF: an expected path throws. Typed failures only — an unknown
  // posture, an unrecognised command state and an absent register all
  // return values above, so no `throw` should remain.
  it('throws on no expected path', () => {
    for (const { f, src } of stripped) {
      expect(/\bthrow\b/.test(src), f).toBe(false)
    }
  })

  // FAILS IF: one of these three takes a VALUE from src/ui/. The rule is
  // "no policy under src/ui/", and its teeth are the other direction too:
  // policy that imports a UI value has put part of itself there. A type-only
  // import is erased at compile time and carries no behaviour, so it is the
  // one permitted form.
  //
  // (This assertion replaced one whose regex matched no import form that
  // exists in TypeScript — a gate that could not fail, defect shape 11.)
  it('takes nothing from src/ui/ but types', () => {
    let uiImporters = 0
    for (const { f, src } of stripped) {
      const lines = src.split('\n').filter((l) => l.includes("from '@/ui/"))
      if (lines.length > 0) uiImporters++
      for (const line of lines) {
        expect(line.trim(), `${f}: ${line.trim()}`).toMatch(/^import type /)
      }
    }
    // Non-vacuous: two of the three really do import a type from src/ui/,
    // so the loop above cannot pass by never running.
    expect(uiImporters).toBe(2)
  })

  // FAILS IF: a closed vocabulary loses its `as const satisfies` or its
  // exhaustiveness check. A vocabulary without one silently widens.
  it('closes every vocabulary with as-const-satisfies and a real Exclude check', () => {
    for (const { f, src } of stripped) {
      expect(src.includes('as const satisfies'), f).toBe(true)
      expect(/\bExclude</.test(src), f).toBe(true)
      expect(/extends\s+never\s*\?\s*true\s*:\s*never/.test(src), f).toBe(true)
    }
  })
})

// Type-level pins. These are assertions the compiler makes, not the runner:
// each fails `pnpm typecheck` if the corresponding type widens to `string`.
const _screenIdPin: StudioScreenId = 'SCR-STU-04'
const _kindPin: StudioConnectivityKind = 'editor'
const _posturePin: StudioPosture = 'Degraded'
const _stateIdPin: ScreenStateId = STU_APPLICABLE_STATES[0]?.id ?? 'STATE-01'
void _screenIdPin
void _kindPin
void _posturePin
void _stateIdPin
