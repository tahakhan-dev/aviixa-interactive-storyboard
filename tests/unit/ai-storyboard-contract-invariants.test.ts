import { describe, expect, it } from 'vitest'
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
  failedInferenceIsNeverAPass,
  finalStateDerivableFromAuditAlone,
  fixedMessageIsNotParaphrased,
  noImpliedReceiptOrApplication,
  noInventedContent,
  noStateCollapse,
  noTheatre,
  storyboardViolations,
} from '@/ai/storyboards/invariants'
import { FIXTURE_STORYBOARD } from './ai-storyboard-contract-fixture.test'

/**
 * Slice 11, wave 4, task 15A — the six render-time prohibitions and the two
 * rules that bind the set, one assertion each.
 *
 * EVERY CASE HERE PLANTS A DEFECT AND WATCHES IT GO RED. The baseline is
 * asserted clean in `ai-storyboard-contract-fixture.test.ts`, so a red here is
 * the planted defect and not the fixture. A gate that cannot fail is worse
 * than no gate: it is a gate that reads as coverage.
 *
 * The membership lists — the nine invariants, the three collapsed state names,
 * the four deterministic controls, the five reserved acts — are each proved by
 * ADDING a member, never by a length. A length agrees with any substitution.
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

describe('the invariant set', () => {
  it('is a literal list of nine, each with its own source line', () => {
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
    ])
  })

  it('runs every one of them, so a new invariant cannot be declared and skipped', () => {
    // One defect per invariant, all at once. The runner must report nine.
    const defect: Storyboard = {
      ...FIXTURE_STORYBOARD,
      finalOfficialState: { name: '', derivedFrom: [] },
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
