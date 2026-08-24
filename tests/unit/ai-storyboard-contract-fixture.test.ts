import { describe, expect, it } from 'vitest'
import type { Storyboard } from '@/ai/storyboards/contract'
import { STORYBOARD_INVARIANTS, storyboardViolations } from '@/ai/storyboards/invariants'
import { affected, noEffect } from '@/ui/shared/journey'

/**
 * Slice 11, wave 4, task 15A — the clean baseline the invariant tests plant
 * their defects into.
 *
 * THIS IS NOT STORYBOARD CONTENT. Not one of the thirty. Tasks 16, 17 and 18
 * own §44A.1's preconditions and every other card's text; this fixture is
 * placeholder prose that exercises the SHAPE. It carries `number: 1` only
 * because `StoryboardNumber` admits no value outside 1-30, and its content
 * strings say so in themselves so that nobody later mistakes this file for
 * task 16's deliverable.
 *
 * It lives in a `*.test.ts` file rather than a bare helper because this task's
 * path list is `tests/unit/ai-storyboard-contract-*.test.ts` and a fixture
 * outside it would be a file this task was not given. It earns the name: it
 * asserts that the baseline is clean under every invariant, which is the half
 * of "watch it go red" that proves the red came from the planted defect rather
 * than from the fixture.
 */

export const FIXTURE_STORYBOARD: Storyboard = {
  number: 1,
  identifier: 'SB-AI-01',
  fallback: { chapter: '44A.1', identifier: 'FB-AI-01' },
  cardHeaderRef: 'L92791',
  surfaceTableRef: 'L92815',
  content: {
    identifier: 'Fixture card, not §44A.1 content. Task 16 owns the thirty.',
    preconditions: 'Fixture precondition text.',
    trigger: 'Fixture trigger text.',
    actorsAndRoles: 'Fixture actor text.',
    workerVisibleExperience: 'Fixture worker-visible text.',
    automaticFallback: 'Fixture automatic fallback text.',
    manualFallback: 'Fixture manual fallback text.',
    fallbackOfFallback: 'Fixture fallback-of-fallback text.',
    safeStop: 'Fixture safe stop text.',
    localData: 'Fixture local data text.',
    centralData: 'Fixture central data text.',
    notifications: 'Fixture notification text.',
    reconnection: 'Fixture reconnection text.',
    conflictResolution: 'Fixture conflict resolution text.',
    finalOfficialState: 'Fixture final official state text.',
    audit: 'Fixture audit text.',
    recoveryObjectives: 'Fixture recovery objective text.',
    residualRisk: 'Fixture residual risk text.',
    sourceStatus: 'Fixture source status text.',
  },
  surfaces: {
    DOH: affected('Fixture Hub effect.', 'L92817'),
    STU: noEffect('the fixture states no Studio effect', 'L92818'),
    CC: affected('Fixture Command Center effect.', 'L92819'),
    FL: affected('Fixture Frontline effect.', 'L92820'),
    SA: noEffect('the fixture states no console effect', 'L92821'),
  },
  audit: [
    { id: 'created', statement: 'Fixture event created.', sourceRef: 'L92808' },
    { id: 'uploaded', statement: 'Fixture event uploaded.', sourceRef: 'L92808' },
  ],
  finalOfficialState: {
    name: 'Fixture final official state',
    derivedFrom: ['created', 'uploaded'],
  },
  absentCapability: null,
  facts: {
    deviceAcknowledgement: 'noDeviceCommand',
    surfacesShowingApplied: [],
    contentOrigin: 'authored',
    inference: 'noInference',
    gateOutcome: 'unpassed',
    stateNamesShown: ['queued', 'uploading'],
    outcomeIsPartial: false,
    partialLabelledPartial: false,
    connectivity: 'knownOffline',
    showsSpinner: false,
    showsRetryControl: false,
    fixedMessages: [],
    deterministicStandings: {
      specificationGate: 'unchanged',
      evaluationGate: 'unchanged',
      qualificationGate: 'unchanged',
      severityOneHold: 'unchanged',
    },
    aiActs: [],
  },
}

describe('the invariant baseline', () => {
  it('is clean under every invariant, so a red is the planted defect', () => {
    expect(storyboardViolations(FIXTURE_STORYBOARD)).toEqual([])
  })

  it('is clean under each invariant taken alone', () => {
    for (const invariant of STORYBOARD_INVARIANTS) {
      expect(invariant.check(FIXTURE_STORYBOARD), invariant.id).toEqual([])
    }
  })
})
