import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { readFileSync } from 'node:fs'
import { ALL_THIRTY_STORYBOARDS } from '../../app/workflows/ai-and-its-absence/scope'
import {
  DETERMINISTIC_CONTROLS,
  RESERVED_AI_ACTS,
  type Storyboard,
} from '@/ai/storyboards/contract'
import {
  COLLAPSED_STATE_NAMES,
  PINNED_WORKER_MESSAGES,
  STORYBOARD_INVARIANTS,
  artificialIntelligenceIsAdvisoryOnly,
  deterministicLayerUnaffected,
  everySurfaceStatesWhatChanges,
  failedInferenceIsNeverAPass,
  finalStateDerivableFromAuditAlone,
  fixedMessageIsNotParaphrased,
  noImpliedReceiptOrApplication,
  noInventedContent,
  noStateCollapse,
  noTheatre,
  storyboardViolations,
} from '@/ai/storyboards/invariants'
import { COMPLIANCE_MESSAGE_READINGS } from '@/frontline/modules/fl-a1/service'
import {
  JOURNEY_SURFACES,
  affected,
  effectStatement,
  noEffect,
  type JourneySurfaceCode,
  type SurfaceEffect,
} from '@/ui/shared/journey'
import { FIXTURE_STORYBOARD } from './ai-storyboard-contract-fixture.test'

/**
 * Slice 11, wave 4, task 15A — the six render-time prohibitions, the two rules
 * that bind the set, `AC-44A-004`, and the five-surface rendering rule the
 * contract originally left to three transcription tasks to reinterpret. One
 * assertion each.
 *
 * EVERY CASE HERE PLANTS A DEFECT AND WATCHES IT GO RED. The baseline is
 * asserted clean in `ai-storyboard-contract-fixture.test.ts`, so a red here is
 * the planted defect and not the fixture. A gate that cannot fail is worse
 * than no gate: it is a gate that reads as coverage.
 *
 * The membership lists — `STORYBOARD_INVARIANTS`, the collapsed state names,
 * the deterministic controls, the reserved acts — are each proved by ADDING a
 * member, never by a length. A length agrees with any substitution. No count
 * is written here for the same reason.
 */

/** One field of `facts` overridden. Everything else stays the clean baseline. */
function withFacts(overrides: Partial<Storyboard['facts']>): Storyboard {
  return { ...FIXTURE_STORYBOARD, facts: { ...FIXTURE_STORYBOARD.facts, ...overrides } }
}

describe('prohibition 1 — no surface implies an offline tablet received or applied anything', () => {
  it('is red where a surface shows applied and the device has not acknowledged', () => {
    const defect = withFacts({
      deviceAcknowledgement: 'notAcknowledged',
      surfacesShowingApplied: ['CC'],
    })
    const violations = noImpliedReceiptOrApplication(defect)
    expect(violations).toHaveLength(1)
    expect(violations[0]!.message).toContain('Client Command Center')
    expect(violations[0]!.sourceRef).toBe('L93459')
  })

  it('names every offending surface rather than the first', () => {
    const defect = withFacts({
      deviceAcknowledgement: 'notAcknowledged',
      surfacesShowingApplied: ['DOH', 'CC', 'SA'],
    })
    expect(noImpliedReceiptOrApplication(defect)).toHaveLength(3)
  })

  it('is red where no command exists at all and a surface shows one applied', () => {
    // `noDeviceCommand` is not an excuse: L93928 is "Receives nothing; no
    // surface implies otherwise".
    const defect = withFacts({
      deviceAcknowledgement: 'noDeviceCommand',
      surfacesShowingApplied: ['FL'],
    })
    expect(noImpliedReceiptOrApplication(defect)).toHaveLength(1)
  })

  it('is green once the device has acknowledged', () => {
    const restored = withFacts({
      deviceAcknowledgement: 'acknowledged',
      surfacesShowingApplied: ['CC'],
    })
    expect(noImpliedReceiptOrApplication(restored)).toEqual([])
  })
})

describe('prohibition 2 — the platform never invents content, rules, or thresholds', () => {
  it('is red on model-generated content, under any failure condition', () => {
    const defect = withFacts({ contentOrigin: 'modelGenerated' })
    const violations = noInventedContent(defect)
    expect(violations).toHaveLength(1)
    expect(violations[0]!.sourceRef).toBe('L93026')
  })

  it('is red where authored content is absent and the gate passed anyway', () => {
    // L93024: the tablet must not invent to fill a gap, NOR quietly let the
    // worker skip the step. A stated absence with a passed gate is the second.
    const defect = withFacts({ contentOrigin: 'statedAbsence', gateOutcome: 'passed' })
    expect(noInventedContent(defect)).toHaveLength(1)
  })

  it('is green on a stated absence that leaves the gate unpassed', () => {
    const restored = withFacts({ contentOrigin: 'statedAbsence', gateOutcome: 'unpassed' })
    expect(noInventedContent(restored)).toEqual([])
  })

  it('is green on authored, packaged and human-decided content', () => {
    for (const origin of ['authored', 'packaged', 'humanDecided'] as const) {
      expect(noInventedContent(withFacts({ contentOrigin: origin })), origin).toEqual([])
    }
  })
})

describe('prohibition 3 — a failed inference is never treated as a pass', () => {
  it('is red on a failed inference with a passed gate', () => {
    const defect = withFacts({ inference: 'failed', gateOutcome: 'passed' })
    const violations = failedInferenceIsNeverAPass(defect)
    expect(violations).toHaveLength(1)
    expect(violations[0]!.sourceRef).toBe('L94553')
  })

  it('is red on an inconclusive inference with a passed gate', () => {
    // The Vision contract's own terminal state is "human inspection, gate
    // unpassed until proof", so inconclusive is not a pass either.
    const defect = withFacts({ inference: 'inconclusive', gateOutcome: 'passed' })
    expect(failedInferenceIsNeverAPass(defect)).toHaveLength(1)
  })

  it('is green where a failed inference leaves the gate held or unpassed', () => {
    for (const outcome of ['held', 'unpassed', 'noGate'] as const) {
      expect(
        failedInferenceIsNeverAPass(withFacts({ inference: 'failed', gateOutcome: outcome })),
        outcome,
      ).toEqual([])
    }
  })

  it('is green where the inference passed', () => {
    expect(
      failedInferenceIsNeverAPass(withFacts({ inference: 'passed', gateOutcome: 'passed' })),
    ).toEqual([])
  })
})

describe('prohibition 4 — no state collapse', () => {
  it('polices a literal list of collapsed names, not a count', () => {
    expect([...COLLAPSED_STATE_NAMES]).toEqual(['synced', 'sent', 'done'])
  })

  it('is red on each of the three collapsed names', () => {
    for (const name of COLLAPSED_STATE_NAMES) {
      const defect = withFacts({ stateNamesShown: ['queued', name] })
      const violations = noStateCollapse(defect)
      expect(violations, name).toHaveLength(1)
      expect(violations[0]!.sourceRef).toBe('L92652')
    }
  })

  it('matches a state NAME exactly and does not scan prose', () => {
    // The honest sentence "never shows a completion tick, and never 'done'"
    // is a description of the prohibition, not a breach of it. A substring
    // scan would flag it; this gate reads names.
    const restored = withFacts({
      stateNamesShown: ['upload interrupted', 'not done until acknowledged'],
    })
    expect(noStateCollapse(restored)).toEqual([])
  })

  it('is red on a partial outcome that is not labelled partial', () => {
    const defect = withFacts({ outcomeIsPartial: true, partialLabelledPartial: false })
    const violations = noStateCollapse(defect)
    expect(violations).toHaveLength(1)
    expect(violations[0]!.sourceRef).toBe('L93313')
  })

  it('is green on a partial outcome labelled partial', () => {
    const restored = withFacts({ outcomeIsPartial: true, partialLabelledPartial: true })
    expect(noStateCollapse(restored)).toEqual([])
  })
})

describe('prohibition 5 — no theatre', () => {
  it('is red on a spinner against a known-offline state', () => {
    const defect = withFacts({ connectivity: 'knownOffline', showsSpinner: true })
    const violations = noTheatre(defect)
    expect(violations).toHaveLength(1)
    expect(violations[0]!.sourceRef).toBe('L92843')
  })

  it('is red on a retry control against a known-offline state', () => {
    const defect = withFacts({ connectivity: 'knownOffline', showsRetryControl: true })
    expect(noTheatre(defect)).toHaveLength(1)
  })

  it('is red on both at once, separately', () => {
    const defect = withFacts({
      connectivity: 'knownOffline',
      showsSpinner: true,
      showsRetryControl: true,
    })
    expect(noTheatre(defect)).toHaveLength(2)
  })

  it('does not treat unknown connectivity as known-offline', () => {
    const restored = withFacts({
      connectivity: 'unknown',
      showsSpinner: true,
      showsRetryControl: true,
    })
    expect(noTheatre(restored)).toEqual([])
  })
})

describe('prohibition 6 — SCR-FL-LOCK-01\'s message is fixed', () => {
  it('pins the English wording verbatim from the source', () => {
    const lock = PINNED_WORKER_MESSAGES.find((message) => message.screen === 'SCR-FL-LOCK-01')
    expect(lock).toBeDefined()
    expect(lock!.english).toBe(
      'Operation suspended. Contact your supervisor. Your work has been saved.',
    )
    expect(lock!.englishRef).toBe('L94829')
    expect(lock!.prohibitionRef).toBe('L94876')
    // The source contains no Spanish anywhere, so there is nothing to pin
    // against and this build does not invent one.
    expect(lock!.spanish).toBeNull()
  })

  it('discloses DEC-MSG-001 rather than claiming one source wording', () => {
    // "Fixed by the source" is not "the source says it once". L5263 registers
    // the divergence itself: Reading A at L5265 (§4.2.3, repeated at §7.11),
    // Reading B at L5266 (§8.9.2). Both are real source strings under an open
    // `Client Decision Required`.
    const lock = PINNED_WORKER_MESSAGES.find((message) => message.screen === 'SCR-FL-LOCK-01')!
    expect(lock.collision).not.toBeNull()
    expect(lock.collision!.decision).toBe('DEC-MSG-001')
    expect(lock.collision!.decisionRef).toBe('L5263')
    expect(lock.collision!.adoptedReadingRef).toBe('L5265')
    expect(lock.collision!.otherReadingRef).toBe('L5266')
    expect(lock.collision!.otherReadingText).toBe('Operation suspended — your work has been saved.')
    // Which reading §44A fixes, and why — L94829 is the wording the chapter
    // itself writes and AC-44A-25-2 is at L94880.
    expect(lock.collision!.whyAdopted).toContain('L94829')
    expect(lock.collision!.whyAdopted).toContain('AC-44A-25-2')
  })

  it('agrees with the disclosure this build already carries, string for string', () => {
    // `COMPLIANCE_MESSAGE_READINGS` (§22, MOD-FL-A1) transcribed the same two
    // readings from the same register. Two transcriptions of one pair drift;
    // this is the gate that catches it. Compared here rather than imported
    // into the module, because a §44A contract has no business depending on a
    // Frontline module's service at run time.
    const [readingA, readingB] = COMPLIANCE_MESSAGE_READINGS
    const lock = PINNED_WORKER_MESSAGES.find((message) => message.screen === 'SCR-FL-LOCK-01')!
    expect(lock.english).toBe(readingA.text)
    expect(lock.collision!.otherReadingText).toBe(readingB.text)
    expect(readingA.locator).toContain(lock.collision!.adoptedReadingRef)
    expect(readingB.locator).toContain(lock.collision!.otherReadingRef)
  })

  it('reports Reading B as a source string under an open decision, not as an invention', () => {
    const defect = withFacts({
      fixedMessages: [
        {
          screen: 'SCR-FL-LOCK-01',
          english: 'Operation suspended — your work has been saved.',
          spanish: 'Operación suspendida.',
          sourceRef: 'L5266',
        },
      ],
    })
    const violations = fixedMessageIsNotParaphrased(defect)
    expect(violations).toHaveLength(1)
    const { message } = violations[0]!
    expect(message).toContain('DEC-MSG-001')
    expect(message).toContain('L5265')
    expect(message).toContain('L5266')
    expect(message).toContain('Reading B')
    expect(message).toContain('NOT an invented paraphrase')
    expect(message).not.toContain('so it is a paraphrase')
  })

  it('still reports a wording that is neither reading as a paraphrase', () => {
    const defect = withFacts({
      fixedMessages: [
        {
          screen: 'SCR-FL-LOCK-01',
          english: 'Operation suspended. Your work is safe.',
          spanish: 'Operación suspendida.',
          sourceRef: 'L94829',
        },
      ],
    })
    const { message } = fixedMessageIsNotParaphrased(defect)[0]!
    expect(message).toContain('renders neither reading, so it is a paraphrase')
    // The pair is still disclosed, so a reader is never told there is one
    // wording when the source writes two.
    expect(message).toContain('DEC-MSG-001')
  })

  it('says why the Spanish violation stands rather than reading as a forgotten defect', () => {
    const defect = withFacts({
      fixedMessages: [
        {
          screen: 'SCR-FL-LOCK-01',
          english: 'Operation suspended. Contact your supervisor. Your work has been saved.',
          spanish: null,
          sourceRef: 'L94829',
        },
      ],
    })
    const { message } = fixedMessageIsNotParaphrased(defect)[0]!
    expect(message).toContain('DEC-MSG-001')
    expect(message).toContain('STANDS')
  })

  it('is red on a paraphrase', () => {
    const defect = withFacts({
      fixedMessages: [
        {
          screen: 'SCR-FL-LOCK-01',
          english: 'Operation suspended. Please contact your supervisor. Your work is saved.',
          spanish: 'Operación suspendida.',
          sourceRef: 'L94829',
        },
      ],
    })
    const violations = fixedMessageIsNotParaphrased(defect)
    expect(violations).toHaveLength(1)
    expect(violations[0]!.sourceRef).toBe('L94876')
  })

  it('is red on a missing Spanish rendering, under TEST-44A-004', () => {
    const defect = withFacts({
      fixedMessages: [
        {
          screen: 'SCR-FL-LOCK-01',
          english: 'Operation suspended. Contact your supervisor. Your work has been saved.',
          spanish: null,
          sourceRef: 'L94829',
        },
      ],
    })
    const violations = fixedMessageIsNotParaphrased(defect)
    expect(violations).toHaveLength(1)
    expect(violations[0]!.sourceRef).toBe('L92757')
  })

  it('is green on the exact wording in both languages', () => {
    const restored = withFacts({
      fixedMessages: [
        {
          screen: 'SCR-FL-LOCK-01',
          english: 'Operation suspended. Contact your supervisor. Your work has been saved.',
          spanish: 'Operación suspendida. Comuníquese con su supervisor. Su trabajo se ha guardado.',
          sourceRef: 'L94829',
        },
      ],
    })
    expect(fixedMessageIsNotParaphrased(restored)).toEqual([])
  })

  it('says so where a rendered fixed message names an unpinned screen', () => {
    const defect = withFacts({
      fixedMessages: [
        { screen: 'SCR-FL-UNKNOWN-99', english: 'Anything.', spanish: 'Algo.', sourceRef: 'L1' },
      ],
    })
    const violations = fixedMessageIsNotParaphrased(defect)
    expect(violations).toHaveLength(1)
    expect(violations[0]!.message).toContain('SCR-FL-UNKNOWN-99')
  })
})

describe('the deterministic layer is unaffected in every storyboard', () => {
  it('polices exactly the four controls AC-44A-002 names, as a literal list', () => {
    // The names are `AC-44A-002`'s own, at L92747. A fifth control here is a
    // claim about the source's enumeration, so it turns this red.
    expect(DETERMINISTIC_CONTROLS.map((control) => control.id)).toEqual([
      'specificationGate',
      'evaluationGate',
      'qualificationGate',
      'severityOneHold',
    ])
    expect(DETERMINISTIC_CONTROLS.map((control) => control.label)).toEqual([
      'specification gate',
      'evaluation gate',
      'qualification gate',
      'Severity 1 hold',
    ])
  })

  it('is red on each of the four named controls, one at a time', () => {
    const controls = [
      'specificationGate',
      'evaluationGate',
      'qualificationGate',
      'severityOneHold',
    ] as const
    for (const control of controls) {
      const defect = withFacts({
        deterministicStandings: {
          ...FIXTURE_STORYBOARD.facts.deterministicStandings,
          [control]: 'relaxed',
        },
      })
      const violations = deterministicLayerUnaffected(defect)
      expect(violations, control).toHaveLength(1)
      expect(violations[0]!.sourceRef).toBe('L92747')
    }
  })

  it('names the control in the source\'s own words', () => {
    const defect = withFacts({
      deterministicStandings: {
        ...FIXTURE_STORYBOARD.facts.deterministicStandings,
        severityOneHold: 'relaxed',
      },
    })
    expect(deterministicLayerUnaffected(defect)[0]!.message).toContain('Severity 1 hold')
  })
})

describe('artificial intelligence is advisory unless the source grants execution authority', () => {
  it('reserves exactly the five acts L92653 names, in the source\'s own words', () => {
    expect(RESERVED_AI_ACTS.map((act) => act.id)).toEqual([
      'classifies',
      'releasesAHold',
      'bypassesAGate',
      'selfApproves',
      'executesAStaleQueuedAction',
    ])
    expect(RESERVED_AI_ACTS.map((act) => act.label)).toEqual([
      'classifies',
      'releases a hold',
      'bypasses a gate',
      'self-approves',
      'executes a stale queued action',
    ])
  })

  it('is red on each of the five reserved acts with no authority', () => {
    const acts = [
      'classifies',
      'releasesAHold',
      'bypassesAGate',
      'selfApproves',
      'executesAStaleQueuedAction',
    ] as const
    for (const act of acts) {
      const defect = withFacts({ aiActs: [{ act, executionAuthorityRef: null }] })
      const violations = artificialIntelligenceIsAdvisoryOnly(defect)
      expect(violations, act).toHaveLength(1)
      expect(violations[0]!.sourceRef).toBe('L92653')
    }
  })

  it('is green where the source grants the authority and the line is named', () => {
    const restored = withFacts({
      aiActs: [{ act: 'classifies', executionAuthorityRef: 'L92653' }],
    })
    expect(artificialIntelligenceIsAdvisoryOnly(restored)).toEqual([])
  })
})

describe('AC-44A-004 — the final official state is derivable from the audit log alone', () => {
  it('is red where the state names no audit event', () => {
    const defect: Storyboard = {
      ...FIXTURE_STORYBOARD,
      finalOfficialState: { name: 'Fixture final official state', derivedFrom: [] },
    }
    const violations = finalStateDerivableFromAuditAlone(defect)
    expect(violations).toHaveLength(1)
    expect(violations[0]!.sourceRef).toBe('L92749')
  })

  it('is red where it names an event the audit log does not hold', () => {
    const defect: Storyboard = {
      ...FIXTURE_STORYBOARD,
      finalOfficialState: {
        name: 'Fixture final official state',
        derivedFrom: ['created', 'never-recorded'],
      },
    }
    const violations = finalStateDerivableFromAuditAlone(defect)
    expect(violations).toHaveLength(1)
    expect(violations[0]!.message).toContain('never-recorded')
  })

  it('is red on an unnamed final official state', () => {
    const defect: Storyboard = {
      ...FIXTURE_STORYBOARD,
      finalOfficialState: { name: '   ', derivedFrom: ['created'] },
    }
    expect(finalStateDerivableFromAuditAlone(defect)).toHaveLength(1)
  })

  it('is red on a duplicated audit event identifier, which breaks reconstruction', () => {
    const defect: Storyboard = {
      ...FIXTURE_STORYBOARD,
      audit: [...FIXTURE_STORYBOARD.audit, { ...FIXTURE_STORYBOARD.audit[0]! }],
    }
    expect(finalStateDerivableFromAuditAlone(defect)).toHaveLength(1)
  })
})

describe('every surface states what changes — the tenth invariant', () => {
  /**
   * WHY THIS EXISTS, AND WHY NOT IN THE TYPE.
   *
   * `journey.ts:57-59` types the absent arm with a REQUIRED `reason: string`,
   * and `reason: string` admits `''`. `noEffect('', ref)` compiles and
   * `effectStatement` then returns "No direct effect — " with nothing after the
   * dash: a blank cell wearing a label. TypeScript has no non-empty-string
   * type, so the requiredness of the field is not the requiredness of its
   * CONTENT, and the nine invariants never read `storyboard.surfaces` at all.
   * A consumer task's own test caught this before the contract did, which is
   * exactly the failure L92648 warns about — the one chapter rule left to each
   * of three transcription tasks to reinterpret.
   *
   * THE CROSS-CHECK. `kind: 'noDirectEffect'` is legal. `reason: ''` is a legal
   * string. Together they are a violation and neither says so alone — the same
   * shape as `deviceAcknowledgement` against `surfacesShowingApplied`.
   *
   * THE SOURCE. L92664: "**The five-surface reaction** states, for each
   * surface, what changes." Measured for this test across the thirty tables at
   * `STORYBOARD_SURFACE_TABLE_REFS`: 150 reaction cells, 0 blank. Where a
   * surface changes nothing the source still writes the reason — L92818 "No
   * change; after reconnection the signal contributes to...", L94688 "Not
   * applicable — the Studio has no device storage role". "No direct effect"
   * itself appears NOWHERE in the chapter: it is this build's rendering of the
   * source's rule, which is why the reason is what carries the source's
   * content and a blank one renders nothing the source wrote.
   */

  /** One surface's effect replaced. Everything else stays the clean baseline. */
  function withSurface(code: JourneySurfaceCode, effect: SurfaceEffect): Storyboard {
    return {
      ...FIXTURE_STORYBOARD,
      surfaces: { ...FIXTURE_STORYBOARD.surfaces, [code]: effect },
    }
  }

  // The five codes as a literal list declared HERE, outside the module. A sixth
  // surface in `JOURNEY_SURFACES` that this invariant did not police would be
  // caught by the tuple assertion below rather than by a count.
  const SURFACE_CODES = ['DOH', 'STU', 'CC', 'FL', 'SA'] as const

  it('polices the same five surfaces the source tuple names', () => {
    expect(JOURNEY_SURFACES.map((surface) => surface.code)).toEqual([...SURFACE_CODES])
  })

  it('is red on a blank reason, on each of the five surfaces one at a time', () => {
    for (const code of SURFACE_CODES) {
      const defect = withSurface(code, noEffect('', 'L92817'))
      const violations = everySurfaceStatesWhatChanges(defect)
      expect(violations, code).toHaveLength(1)
      expect(violations[0]!.invariant).toBe('everySurfaceStatesWhatChanges')
      expect(violations[0]!.sourceRef).toBe('L92664')
      expect(violations[0]!.storyboard).toBe(1)
      const name = JOURNEY_SURFACES.find((surface) => surface.code === code)!.name
      expect(violations[0]!.message, code).toContain(name)
    }
  })

  it('is red on a whitespace-only reason, which renders identically to a blank one', () => {
    const defect = withSurface('STU', noEffect('   \t\n ', 'L92818'))
    expect(everySurfaceStatesWhatChanges(defect)).toHaveLength(1)
  })

  it('is red on a blank statement on an AFFECTED arm', () => {
    // The affected arm has the same gap: `statement: string` admits `''`, and
    // an affected surface rendering nothing is a blank cell too.
    const defect = withSurface('DOH', affected('', 'L92817'))
    const violations = everySurfaceStatesWhatChanges(defect)
    expect(violations).toHaveLength(1)
    expect(violations[0]!.message).toContain('Delivery Operations Hub')
  })

  it('is red on a whitespace-only statement on an affected arm', () => {
    expect(everySurfaceStatesWhatChanges(withSurface('CC', affected('  ', 'L92819')))).toHaveLength(
      1,
    )
  })

  it('names every blank surface rather than the first', () => {
    const defect: Storyboard = {
      ...FIXTURE_STORYBOARD,
      surfaces: {
        ...FIXTURE_STORYBOARD.surfaces,
        DOH: affected('', 'L92817'),
        STU: noEffect(' ', 'L92818'),
        SA: noEffect('', 'L92821'),
      },
    }
    expect(everySurfaceStatesWhatChanges(defect)).toHaveLength(3)
  })

  it('quotes what the reader would have seen, so the dangling dash is visible', () => {
    // The whole point of the defect: the rendering does not look empty, it
    // looks like a label. The violation has to show that.
    const defect = withSurface('SA', noEffect('', 'L92821'))
    expect(everySurfaceStatesWhatChanges(defect)[0]!.message).toContain(
      effectStatement(noEffect('', 'L92821')),
    )
  })

  it('is green on the clean baseline, where all five carry text', () => {
    expect(everySurfaceStatesWhatChanges(FIXTURE_STORYBOARD)).toEqual([])
  })

  it('is green once the reason is restored', () => {
    const restored = withSurface('STU', noEffect('the fixture states no Studio effect', 'L92818'))
    expect(everySurfaceStatesWhatChanges(restored)).toEqual([])
  })

  it('reports through the runner, not only when called directly', () => {
    const defect = withSurface('FL', noEffect('  ', 'L92820'))
    const reported = storyboardViolations(defect).map((violation) => violation.invariant)
    expect(reported).toContain('everySurfaceStatesWhatChanges')
  })
})

describe('the invariant set', () => {
  it('is this literal list, in this order, each with its own source line', () => {
    // Proved by ADDING: registering `everySurfaceStatesWhatChanges` in the
    // module reddened this assertion before the member below existed, and
    // reddened the "runs every one of them" case with it. The nine that came
    // first are neither renamed nor reordered — a content task asserts a
    // violation by identifier, and renaming one would break that instead of
    // this.
    expect(STORYBOARD_INVARIANTS.map((invariant) => invariant.id)).toEqual([
      'noImpliedReceiptOrApplication',
      'noInventedContent',
      'failedInferenceIsNeverAPass',
      'noStateCollapse',
      'noTheatre',
      'fixedMessageIsNotParaphrased',
      'deterministicLayerUnaffected',
      'artificialIntelligenceIsAdvisoryOnly',
      'finalStateDerivableFromAuditAlone',
      'everySurfaceStatesWhatChanges',
    ])
  })

  it('runs every one of them, so a new invariant cannot be declared and skipped', () => {
    // One defect per invariant, all at once. The runner must report every one.
    const defect: Storyboard = {
      ...FIXTURE_STORYBOARD,
      finalOfficialState: { name: '', derivedFrom: [] },
      surfaces: { ...FIXTURE_STORYBOARD.surfaces, STU: noEffect('', 'L92818') },
      facts: {
        ...FIXTURE_STORYBOARD.facts,
        deviceAcknowledgement: 'notAcknowledged',
        surfacesShowingApplied: ['CC'],
        contentOrigin: 'modelGenerated',
        inference: 'failed',
        gateOutcome: 'passed',
        stateNamesShown: ['done'],
        connectivity: 'knownOffline',
        showsSpinner: true,
        fixedMessages: [
          {
            screen: 'SCR-FL-LOCK-01',
            english: 'A paraphrase.',
            spanish: 'Una parafrasis.',
            sourceRef: 'L94829',
          },
        ],
        deterministicStandings: {
          ...FIXTURE_STORYBOARD.facts.deterministicStandings,
          evaluationGate: 'relaxed',
        },
        aiActs: [{ act: 'selfApproves', executionAuthorityRef: null }],
      },
    }
    const reported = new Set(storyboardViolations(defect).map((violation) => violation.invariant))
    expect([...reported].sort()).toEqual(
      STORYBOARD_INVARIANTS.map((invariant) => invariant.id).slice().sort(),
    )
  })

  it('carries the storyboard number on every violation', () => {
    const defect = withFacts({ contentOrigin: 'modelGenerated' })
    for (const violation of storyboardViolations(defect)) {
      expect(violation.storyboard).toBe(1)
    }
  })
})

describe("the source's absence marker, across all thirty cards", () => {
  /**
   * WHAT THIS CATCHES THAT THE TENTH INVARIANT CANNOT.
   *
   * `everySurfaceStatesWhatChanges` convicts a BLANK reason. It cannot convict
   * a reason that is present, plausible and shorter than the cell it was
   * transcribed from — and storyboard 29 shipped exactly that. L95189 reads
   *
   *   `| Super Admin platform console | No involvement in tenant personnel; identity handling is a tenant record matter |`
   *
   * and the card stored only "identity handling is a tenant record matter", so
   * `effectStatement` rendered "No direct effect — identity handling is a
   * tenant record matter": a BLANKET absence where the source scoped it to
   * tenant personnel. Nothing was red. The reason was non-empty, the locator
   * was right, and the field cell above it still showed the source's own
   * wording, so a reader met two versions of one claim.
   *
   * So this reads the frozen source rather than the card, for every one of the
   * twenty absent cells in the thirty, and asserts two things:
   *
   *   1. the stored reason really is the source's own words — the cell at the
   *      cited line contains it, allowing only the subject this build restores
   *      when the source's marker is itself the sentence ("Receives nothing" →
   *      "it receives nothing");
   *   2. where the source's marker says MORE than "this surface is unaffected"
   *      — the whole of what `effectStatement`'s label conveys — the reason
   *      carries that too. Three markers do: "Receives nothing" (L93928), "No
   *      role in commands" (L93499) and "No involvement in tenant personnel"
   *      (L95189). The bare six below say nothing the label does not.
   *
   * Proved by planting: restoring storyboard 29's shortened reason turns case
   * 2 red naming `SB-AI-29 · SA`.
   */
  const BARE_ABSENCE_MARKERS = [
    'no change',
    'not applicable',
    'no involvement',
    'no platform action',
    'no intervention',
    'unaffected',
  ] as const

  const BLUEPRINT = readFileSync(
    join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md'),
    'utf8',
  ).split('\n')

  /** The reaction cell of a `| Surface | Reaction |` row, without its pipes. */
  function reactionCell(locator: string): string {
    const line = BLUEPRINT[Number(locator.replace(/^L/, '')) - 1] ?? ''
    return (line.split('|')[2] ?? '').trim()
  }

  /** The cell's leading absence marker: everything before its first break. */
  const markerOf = (cell: string): string => (cell.split(/;|—|\.\s/)[0] ?? '').trim().toLowerCase()

  /**
   * The reason as the source would have written it: this build restores a
   * subject where the source's marker is a sentence of its own, and that
   * inserted subject is the one departure allowed here.
   *
   * THE SECOND DEPARTURE, NORMALISED RATHER THAN CONVICTED. Chapter 44A holds
   * 282 straight apostrophes and ZERO curly ones (measured over L92596-L95408),
   * while `sb-11-to-20/index.ts` and `sb-21-to-30/storyboards.ts` transcribe
   * with 28 and 46 curly ones respectively and `sb-01-to-10/index.ts` with
   * none. That is a real drift — one field type, two renderings — but it is
   * typography, not meaning, and rewriting 74 characters inside single-quoted
   * literals is a different change from the one this gate exists for. Folded
   * here, reported there.
   */
  const asSource = (reason: string): string =>
    reason.replace(/^it (has )?/, '').toLowerCase().replace(/’/g, "'")

  const ABSENT_CELLS = ALL_THIRTY_STORYBOARDS.flatMap((storyboard) =>
    JOURNEY_SURFACES.map((surface) => ({
      where: `${storyboard.identifier} · ${surface.code}`,
      effect: storyboard.surfaces[surface.code],
    })),
  ).flatMap((entry) =>
    entry.effect.kind === 'noDirectEffect'
      ? [{ where: entry.where, reason: entry.effect.reason, ref: entry.effect.sourceRef }]
      : [],
  )

  it('finds absent cells to check at all', () => {
    // A gate that passes on an empty set is not a gate. This is not a count of
    // twenty: it is the refusal to run on nothing.
    expect(ABSENT_CELLS.length).toBeGreaterThan(0)
  })

  it('cites a five-surface reaction row for every absent cell', () => {
    for (const cell of ABSENT_CELLS) {
      expect(reactionCell(cell.ref), cell.where).not.toBe('')
    }
  })

  it('stores the source line, never a shortened paraphrase of it', () => {
    for (const cell of ABSENT_CELLS) {
      expect(reactionCell(cell.ref).toLowerCase(), cell.where).toContain(asSource(cell.reason))
    }
  })

  it('keeps any marker that says more than the rendered label does', () => {
    for (const cell of ABSENT_CELLS) {
      const marker = markerOf(reactionCell(cell.ref))
      if ((BARE_ABSENCE_MARKERS as readonly string[]).includes(marker)) continue
      expect(cell.reason.toLowerCase(), `${cell.where} · marker "${marker}"`).toContain(marker)
    }
  })

  it('renders the whole of the source cell for the three informative markers', () => {
    // Named, so that a marker silently becoming bare is a change to this list
    // rather than to nothing.
    for (const [ref, marker] of [
      ['L93499', 'no role in commands'],
      ['L93928', 'receives nothing'],
      ['L95189', 'no involvement in tenant personnel'],
    ] as const) {
      const cell = ABSENT_CELLS.find((entry) => entry.ref === ref)
      expect(cell, `no absent cell cites ${ref}`).toBeDefined()
      expect(markerOf(reactionCell(ref)), ref).toBe(marker)
      expect(effectStatement(noEffect(cell!.reason, ref)).toLowerCase()).toContain(marker)
    }
  })
})
