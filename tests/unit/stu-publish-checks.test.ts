import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  PUBLISH_CHECKS,
  publishCheckById,
  publishChecksOwnedBy,
  type PublishCheckId,
} from '@/studio/publish/checks'
import {
  createPublishCheckRegister,
  registerPublishChecks,
  evaluatePublish,
  registeredOwners,
  type PublishCheckImplementation,
} from '@/studio/publish/register'

/**
 * The subject a check runs against is owned by the module that implements
 * the check, never by the registry — so the registry is generic over it and
 * this suite supplies its own. `violating` names the ONE check this subject
 * is built to fail.
 */
interface TestSubject {
  readonly violating: PublishCheckId | null
  readonly unrunnable: readonly PublishCheckId[]
  /** Plants the defect of a check that blocks but names nothing. */
  readonly nameNothing: boolean
}

const CLEAN: TestSubject = { violating: null, unrunnable: [], nameNothing: false }
const fixtureViolating = (id: PublishCheckId): TestSubject => ({ ...CLEAN, violating: id })
const fixtureWith = (patch: Partial<TestSubject>): TestSubject => ({ ...CLEAN, ...patch })

/**
 * One test double per check, standing in for the module implementation that
 * Task 14/15/16/… will register. They are deliberately NOT in `src/` — a
 * module implementing a sibling's check is a defect (C4), and so is the
 * registry implementing all eleven.
 */
function doubles(): readonly PublishCheckImplementation<TestSubject>[] {
  return PUBLISH_CHECKS.map((check) => ({
    checkId: check.id,
    implementedBy: check.ownerModules[0]!,
    run: (subject: TestSubject) => {
      if (subject.unrunnable.includes(check.id))
        return { outcome: 'cannot-run' as const, reason: 'the validation service is unavailable' }
      if (subject.violating === check.id)
        return {
          outcome: 'blocked' as const,
          blockingElement: subject.nameNothing ? '' : `screen 4 — ${check.namesElement}`,
        }
      return { outcome: 'passed' as const }
    },
  }))
}

function fullRegister() {
  const result = registerPublishChecks(createPublishCheckRegister<TestSubject>(), ...doubles())
  if (!result.ok) throw new Error(`fixture register failed: ${result.failure}`)
  return result.register
}

describe('PUBLISH_CHECKS — the eleven, as data', () => {
  // Fails if a twelfth check is added or one is dropped. This assertion is
  // what stops the loop below passing vacuously on an empty registry.
  it('holds exactly eleven checks with distinct ids and gapless ordinals 1..11', () => {
    expect(PUBLISH_CHECKS).toHaveLength(11)
    expect(new Set(PUBLISH_CHECKS.map((c) => c.id)).size).toBe(11)
    expect(PUBLISH_CHECKS.map((c) => c.ordinal)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
  })

  // Fails if any check loses its locator, its refusal sentence, or the
  // statement of what its blocking element must name.
  it('gives every check a source locator, a refusal, and an element it must name', () => {
    for (const c of PUBLISH_CHECKS) {
      expect(c.sourceRef).toMatch(/L\d{4,6}/)
      expect(c.refuses.length).toBeGreaterThan(20)
      expect(c.namesElement.length).toBeGreaterThan(5)
      expect(c.ownerModules.length).toBeGreaterThan(0)
      for (const m of c.ownerModules) expect(m).toMatch(/^MOD-STU-\d{2}$/)
    }
  })

  // Fails if a check whose source wording does not itself state a
  // publication block is silently promoted to `SoW Fact`.
  it('marks the two checks read forward from another stage as derived, with the divergence stated', () => {
    const derived = PUBLISH_CHECKS.filter((c) => c.sourceClass === 'Derived Clarification')
    expect(derived.map((c) => c.id)).toEqual(['severity-one-arming', 'chain-staffable'])
    for (const c of derived) expect(c.note).toMatch(/FINDING/)
  })

  // Fails if two modules are given the same check to implement (C4: a
  // module implementing a sibling's check is a defect).
  it('assigns each check an owner set, and no check to two modules that both own it alone', () => {
    expect(publishChecksOwnedBy('MOD-STU-05').map((c) => c.ordinal)).toEqual([2, 3, 4, 5, 10])
    expect(publishChecksOwnedBy('MOD-STU-04').map((c) => c.id)).toEqual(['structural-validity'])
    expect(publishChecksOwnedBy('MOD-STU-99')).toEqual([])
    expect(publishCheckById('locale-completeness').ownerModules).toEqual(['MOD-STU-17'])
  })

  // Fails the moment anything in the publish path grows a way to publish
  // past a failed check. A gate that can be set aside is not a gate.
  it('models no way to publish past a failed check', () => {
    const banned = /(force|override|bypass|waive|acknowledge|ignore|skip)\s*[:?=(]/i
    for (const f of ['src/studio/publish/checks.ts', 'src/studio/publish/register.ts'])
      expect({ f, hit: banned.test(readFileSync(f, 'utf8')) }).toEqual({ f, hit: false })
  })
})

describe('evaluatePublish — a fail-closed gate set, not a warning set', () => {
  // THE brief's test. Fails if any single check stops blocking on its own,
  // or blocks without naming its element.
  it('blocks publication on each of the eleven checks individually', () => {
    const register = fullRegister()
    expect(PUBLISH_CHECKS.length).toBe(11)
    for (const check of PUBLISH_CHECKS) {
      const r = evaluatePublish(register, fixtureViolating(check.id))
      expect(r.blocked).toBe(true)
      expect(r.blockers.map((b) => b.checkId)).toContain(check.id)
      const blocker = r.blockers.find((b) => b.checkId === check.id)!
      expect(blocker.blockingElement).toBeTruthy()
      expect(blocker.kind).toBe('failed')
      // Every other check passed, so exactly one blocker — a fixture that
      // failed everything would make this loop meaningless.
      expect(r.blockers).toHaveLength(1)
      expect(r.passed).toHaveLength(10)
    }
  })

  // Fails if a clean subject is ever blocked — the guard that keeps the
  // eleven assertions above from passing on a gate that blocks everything.
  it('publishes a subject that passes all eleven', () => {
    const r = evaluatePublish(fullRegister(), CLEAN)
    expect(r.blocked).toBe(false)
    expect(r.blockers).toEqual([])
    expect(r.passed).toHaveLength(11)
  })

  // Fails if an unrunnable check is treated as a pass. FB-STU-09 L31453 /
  // AC-STU-149 L34487: where the check cannot run, publication is blocked.
  it('blocks publication when a check cannot run at all, and names the check', () => {
    const r = evaluatePublish(fullRegister(), fixtureWith({ unrunnable: ['locale-completeness'] }))
    expect(r.blocked).toBe(true)
    expect(r.blockers).toHaveLength(1)
    expect(r.blockers[0]!.kind).toBe('cannot-run')
    expect(r.blockers[0]!.blockingElement).toMatch(/locale completeness/i)
    expect(r.blockers[0]!.blockingElement).toMatch(/validation service is unavailable/i)
  })

  // Fails if an unregistered check is skipped instead of blocking. An empty
  // registry must refuse publication eleven times over, never publish.
  it('blocks on every check that has no registered implementation', () => {
    const r = evaluatePublish(createPublishCheckRegister<TestSubject>(), CLEAN)
    expect(r.blocked).toBe(true)
    expect(r.blockers).toHaveLength(11)
    expect(r.passed).toEqual([])
    for (const b of r.blockers) expect(b.kind).toBe('cannot-run')
  })

  // Fails if a check that blocks while naming nothing is reported as a
  // named failure — the message the screen shows would then be blank.
  it('treats a blocking element that names nothing as a check that could not run', () => {
    const r = evaluatePublish(
      fullRegister(),
      fixtureWith({ violating: 'severity-mapping', nameNothing: true }),
    )
    expect(r.blocked).toBe(true)
    expect(r.blockers[0]!.kind).toBe('cannot-run')
    expect(r.blockers[0]!.blockingElement).toMatch(/named no element/i)
  })

  // Fails if evaluation order follows registration order — the screen would
  // then list its blockers differently depending on module load order.
  it('reports blockers in check ordinal order, never registration order', () => {
    const reversed = registerPublishChecks(
      createPublishCheckRegister<TestSubject>(),
      ...[...doubles()].reverse(),
    )
    expect(reversed.ok).toBe(true)
    if (!reversed.ok) return
    const r = evaluatePublish(reversed.register, fixtureWith({ unrunnable: PUBLISH_CHECKS.map((c) => c.id) }))
    expect(r.blockers.map((b) => b.ordinal)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
  })
})

describe('registerPublishChecks — one implementation per check (C4)', () => {
  // Fails if a second module can quietly re-implement a sibling's check.
  it('refuses a second implementation of the same check, naming both modules', () => {
    const first = registerPublishChecks(createPublishCheckRegister<TestSubject>(), ...doubles())
    expect(first.ok).toBe(true)
    if (!first.ok) return
    const again = registerPublishChecks(first.register, {
      checkId: 'severity-mapping',
      implementedBy: 'MOD-STU-04',
      run: () => ({ outcome: 'passed' as const }),
    })
    expect(again.ok).toBe(false)
    if (again.ok) return
    expect(again.failure).toBe('already-registered')
    expect(again.checkId).toBe('severity-mapping')
    expect(again.registeredBy).toBe('MOD-STU-05')
    expect(again.attemptedBy).toBe('MOD-STU-04')
  })

  // Fails if a module can register a check it does not own.
  it('refuses a registration from a module the check does not name as an owner', () => {
    const r = registerPublishChecks(createPublishCheckRegister<TestSubject>(), {
      checkId: 'locale-completeness',
      implementedBy: 'MOD-STU-04',
      run: () => ({ outcome: 'passed' as const }),
    })
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.failure).toBe('not-an-owner')
  })

  // Fails if registration mutates the register it was handed. Every reader
  // takes its register as a PARAMETER; a module-load snapshot that later
  // grows members is the defect this build shipped three times in slice 4.
  it('never mutates the register it is handed', () => {
    const empty = createPublishCheckRegister<TestSubject>()
    const r = registerPublishChecks(empty, ...doubles())
    expect(r.ok).toBe(true)
    expect(registeredOwners(empty).size).toBe(0)
    if (!r.ok) return
    expect(registeredOwners(r.register).size).toBe(11)
    expect(registeredOwners(r.register).get('capability-dependency')).toBe('MOD-STU-01')
  })
})

// ---------------------------------------------------------------------------
// The journey fixture and the five-surface effects
// ---------------------------------------------------------------------------

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  FB_SEQ_012,
  fbSeq012TerminalState,
  INITIAL_JOURNEY_STATE,
  journeyStateAfterStep,
  journeyStates,
  linkableVersions,
  SEQUENCE_STATES,
  versionByNumber,
  WHEEL_BOLT_DRAFT_CONTENT,
  type JourneyState,
} from '@/studio/journey/fixture'
import { JOURNEY_REFUSALS, JOURNEY_STEPS, journeyStep } from '@/studio/journey/effects'
import {
  effectStatement,
  JOURNEY_SURFACES,
  type JourneySurfaceCode,
} from '@/ui/shared/journey'
import { FiveSurfaceEffects } from '@/ui/shared/FiveSurfaceEffects'

function foldedStates(): readonly JourneyState[] {
  const fold = journeyStates(JOURNEY_STEPS)
  if (!fold.ok) throw new Error(`journey fold stopped at step ${fold.atStep}: ${fold.reason}`)
  return fold.states
}

const SURFACE_CODES = JOURNEY_SURFACES.map((s) => s.code)

describe('JOURNEY_STEPS — twenty-two steps, five surfaces each', () => {
  // Fails if a step is added, dropped, renumbered, or duplicated.
  it('holds twenty-two steps numbered 1..22 without a gap', () => {
    expect(JOURNEY_STEPS).toHaveLength(22)
    expect(JOURNEY_STEPS.map((s) => s.number)).toEqual(
      Array.from({ length: 22 }, (_, i) => i + 1),
    )
    expect(journeyStep(19)?.actingSurface).toBe('DOH')
    expect(journeyStep(23)).toBeNull()
  })

  // Fails if any surface cell goes blank on any step — the same rule as a
  // blank permission-matrix cell. An empty string is structurally impossible
  // here, so this asserts the RENDERED sentence, which is what could break.
  it('renders a non-blank, source-located effect on all five surfaces of every step', () => {
    expect(SURFACE_CODES).toEqual(['DOH', 'STU', 'CC', 'FL', 'SA'])
    for (const step of JOURNEY_STEPS) {
      for (const code of SURFACE_CODES) {
        const effect = step.effects[code as JourneySurfaceCode]
        const sentence = effectStatement(effect).trim()
        // Not a length contest: the source's own clauses are sometimes three
        // words ("Draft and diff."). The claim is that a cell is never blank
        // and never a single token standing in for a sentence.
        expect(sentence.length).toBeGreaterThan(9)
        expect(sentence.split(/\s+/).length).toBeGreaterThanOrEqual(3)
        expect(effect.sourceRef).toMatch(/L\d{4,6}/)
      }
    }
  })

  // Fails if "no effect" ever loses its reason. A surface with no effect
  // SAYS SO, with the reason — that is a rendering, not an omission.
  it('gives every absent surface a stated reason, never a bare absence', () => {
    const absent = JOURNEY_STEPS.flatMap((s) =>
      SURFACE_CODES.map((c) => s.effects[c as JourneySurfaceCode]).filter(
        (e) => e.kind === 'noDirectEffect',
      ),
    )
    expect(absent.length).toBeGreaterThan(0)
    for (const e of absent) {
      expect(e.kind).toBe('noDirectEffect')
      if (e.kind !== 'noDirectEffect') continue
      expect(e.reason.trim().length).toBeGreaterThan(20)
      expect(effectStatement(e)).toMatch(/^No direct effect — \S/)
    }
  })

  // A strict, non-empty split in BOTH directions: some steps touch all five
  // surfaces and some do not. An assertion that only one side is non-empty
  // would pass on a journey where every cell said the same thing.
  it('splits strictly: some steps touch all five surfaces, some honestly do not', () => {
    const touchesAll = JOURNEY_STEPS.filter((s) =>
      SURFACE_CODES.every((c) => s.effects[c as JourneySurfaceCode].kind === 'affected'),
    )
    const hasAnAbsence = JOURNEY_STEPS.filter((s) =>
      SURFACE_CODES.some((c) => s.effects[c as JourneySurfaceCode].kind === 'noDirectEffect'),
    )
    expect(touchesAll.length).toBeGreaterThan(0)
    expect(hasAnAbsence.length).toBeGreaterThan(0)
    expect(touchesAll.length + hasAnAbsence.length).toBe(JOURNEY_STEPS.length)
    expect(touchesAll.length).toBeLessThan(JOURNEY_STEPS.length)
    expect(hasAnAbsence.length).toBeLessThan(JOURNEY_STEPS.length)
  })

  // Fails if any effect collapses the command ladder into a single word. A
  // command CREATED is not a command APPLIED, and no surface sentence may
  // claim a device state the platform cannot know.
  it('never collapses created, delivered, applied and acknowledged into one word', () => {
    const collapsing =
      /\b(synced|in sync|up to date|delivered everywhere|live on the floor|already on the tablet)\b/i
    for (const step of JOURNEY_STEPS)
      for (const code of SURFACE_CODES) {
        const sentence = effectStatement(step.effects[code as JourneySurfaceCode])
        expect({ step: step.number, code, hit: collapsing.test(sentence) }).toEqual({
          step: step.number,
          code,
          hit: false,
        })
      }
  })

  // Fails if a refusal loses its locator or points at a step that is not in
  // the journey — the four refusals are the point of four of these steps.
  it('carries the four refusals, each on a real step, each with its source', () => {
    expect(JOURNEY_REFUSALS).toHaveLength(4)
    for (const r of JOURNEY_REFUSALS) {
      expect(journeyStep(r.atStep)).not.toBeNull()
      expect(r.sourceRef).toMatch(/L\d{4,6}/)
      expect(r.reason.length).toBeGreaterThan(40)
    }
    expect(JOURNEY_REFUSALS.map((r) => r.atStep).sort((a, b) => a - b)).toEqual([13, 14, 17, 21])
  })
})

describe('the journey fixture — every step reachable from the one before it', () => {
  // Fails if any step's precondition is not satisfied by the state its
  // predecessor produced. This is the whole reachability claim.
  it('folds all twenty-two steps without a single unmet precondition', () => {
    const fold = journeyStates(JOURNEY_STEPS)
    expect(fold.ok).toBe(true)
    if (!fold.ok) return
    expect(fold.states).toHaveLength(23)
    expect(fold.states[0]).toEqual(INITIAL_JOURNEY_STATE)
  })

  // Fails if a step could be reached out of order — the defect a fixture
  // that jumps to a convenient state would hide.
  it('refuses to reach approval, publication or a package out of order', () => {
    const states = foldedStates()
    const afterSubmit = states[12]!
    const afterApprove = states[16]!
    expect(journeyStep(16)!.requires(afterSubmit).met).toBe(false)
    expect(journeyStep(17)!.requires(afterSubmit).met).toBe(false)
    expect(journeyStep(18)!.requires(afterApprove).met).toBe(false)
    expect(journeyStep(19)!.requires(states[17]!).met).toBe(false)
    expect(journeyStep(12)!.requires(INITIAL_JOURNEY_STATE).met).toBe(false)
  })

  // Fails if the fold does not stop where a precondition is unmet.
  it('stops the fold with a typed failure rather than producing a state anyway', () => {
    const fold = journeyStates([journeyStep(17)!])
    expect(fold.ok).toBe(false)
    if (fold.ok) return
    expect(fold.atStep).toBe(17)
    expect(fold.reason).toMatch(/release-approved/i)
  })

  // Fails if the four sequence states stop advancing in the source's order.
  it('advances the four sequence states in order, at the steps that produce them', () => {
    const states = foldedStates()
    expect(SEQUENCE_STATES).toHaveLength(4)
    expect(states[0]!.sequenceState).toBe('STATE-STU-PREPARED')
    expect(states[11]!.sequenceState).toBe('STATE-STU-PREPARED')
    expect(states[12]!.sequenceState).toBe('STATE-WF-DRAFT-SUBMITTED')
    expect(states[16]!.sequenceState).toBe('STATE-WF-RELEASE-APPROVED')
    expect(states[17]!.sequenceState).toBe('STATE-WF-RELEASE-APPROVED')
    expect(states[18]!.sequenceState).toBe('STATE-WF-PUBLISHED-V210')
    const seen = states.map((s) => s.sequenceState)
    expect([...new Set(seen)]).toEqual([...SEQUENCE_STATES])
  })

  // Fails if the SEQ-011 ending state (L68040) stops holding: a complete
  // draft that is submitted and is NOT published, NOT versioned as a
  // release, and NOT available for Job assignment.
  it('reaches SEQ-011’s ending state exactly as the source states it', () => {
    const state = foldedStates()[12]!
    expect(state.submission?.status).toBe('Submitted')
    expect(state.draft?.name).toBe(WHEEL_BOLT_DRAFT_CONTENT.workflowName)
    expect(state.draft?.difficultyLevels).toEqual(['simple', 'standard', 'expanded'])
    expect(state.draft?.localesComplete).toEqual(['English', 'Spanish'])
    expect(state.draft?.inheritableDefaults).toHaveLength(2)
    expect(state.draft?.screenOrder).toHaveLength(WHEEL_BOLT_DRAFT_CONTENT.screenCount)
    expect(state.versions).toEqual([])
    expect(state.workPackages).toEqual([])
    expect(linkableVersions(state)).toEqual([])
    expect(WHEEL_BOLT_DRAFT_CONTENT.specification).toEqual({
      lowerLimit: 44,
      upperLimit: 47,
      unit: 'Newton metres',
      drawingReference: 'DWG-A441',
    })
    expect(WHEEL_BOLT_DRAFT_CONTENT.severityBands).toEqual([
      { departureFromPercent: 0, departureToPercent: 10, severity: 2 },
      { departureFromPercent: 10, departureToPercent: null, severity: 1 },
    ])
    expect(WHEEL_BOLT_DRAFT_CONTENT.qualificationBaseline).toBe(
      'Torque Wrench Operator Certification',
    )
  })

  // Fails if a version created is treated as a version distributed, or a
  // package built as a package delivered, or a pin as an execution.
  it('keeps created, distributable, built, pinned and ready as five distinct facts', () => {
    const s = foldedStates()
    const published = versionByNumber(s[17]!, 'v2.1.0')!
    expect(published.status).toBe('Published')
    expect(published.distributable).toBe(false)
    expect(s[17]!.workPackages).toEqual([])
    expect(linkableVersions(s[17]!)).toEqual([])

    expect(versionByNumber(s[18]!, 'v2.1.0')!.distributable).toBe(true)
    expect(s[18]!.workPackages).toEqual([{ version: 'v2.1.0', status: 'Built', quarantined: false }])
    expect(s[18]!.hubPin).toBeNull()

    expect(s[19]!.workPackages[0]!.status).toBe('Pinned')
    expect(s[19]!.hubPin?.deviceReadiness).toBe('assigned-not-ready')
    expect(s[19]!.hubPin?.ownedBy).toMatch(/MOD-DOH-06/)
  })

  // Fails if a superseded or rolled-back version is deleted, hidden, or
  // re-bases the run that already pinned it.
  it('supersedes and rolls back forward, never deleting and never re-basing a pinned run', () => {
    const s = foldedStates()
    expect(versionByNumber(s[20]!, 'v2.1.0')).toMatchObject({
      status: 'Superseded',
      supersededBy: 'v2.2.0',
    })
    expect(versionByNumber(s[21]!, 'v2.2.0')).toMatchObject({
      status: 'Superseded',
      supersededBy: 'v2.3.0',
    })
    expect(versionByNumber(s[21]!, 'v2.3.0')?.republishDescription).toBe(
      'Reverts severity banding to the v2.1.0 basis pending engineering review',
    )
    expect(s[22]!.versions.map((v) => v.number)).toEqual(['v2.1.0', 'v2.2.0', 'v2.3.0'])
    expect(s[22]!.hubPin?.version).toBe('v2.1.0')
    expect(versionByNumber(s[22]!, 'v2.2.0')?.status).toBe('Archived')
  })

  // Fails if a version with an active pinned run can be archived.
  it('refuses to archive a version an active run is pinned to', () => {
    const before = foldedStates()[21]!
    const pinnedToTheBadVersion: JourneyState = {
      ...before,
      hubPin: { ...before.hubPin!, version: 'v2.2.0' },
    }
    const refusal = journeyStep(22)!.requires(pinnedToTheBadVersion)
    expect(refusal.met).toBe(false)
    if (refusal.met) return
    expect(refusal.reason).toMatch(/pinned run/i)
  })

  // Fails if the reader stops taking its states as a parameter, or stops
  // returning a typed failure for a step outside the journey.
  it('reads a folded state by step number and refuses one outside the journey', () => {
    const states = foldedStates()
    expect(journeyStateAfterStep(states, 0)).toEqual({ ok: true, state: INITIAL_JOURNEY_STATE })
    expect(journeyStateAfterStep(states, 22).ok).toBe(true)
    expect(journeyStateAfterStep(states, 23).ok).toBe(false)
    expect(journeyStateAfterStep(states, -1).ok).toBe(false)
    expect(journeyStateAfterStep([], 0).ok).toBe(false)
  })

  // Fails if anything in the journey reads an ambient clock or randomness.
  it('is deterministic: the same fold twice, and no ambient time or randomness', () => {
    expect(journeyStates(JOURNEY_STEPS)).toEqual(journeyStates(JOURNEY_STEPS))
    const banned = /\b(Date\.now|Math\.random|new Date)\b/
    for (const f of [
      'src/studio/journey/fixture.ts',
      'src/studio/journey/effects.ts',
      'src/ui/shared/FiveSurfaceEffects.tsx',
    ])
      expect({ f, hit: banned.test(readFileSync(f, 'utf8')) }).toEqual({ f, hit: false })
  })
})

describe('FB-SEQ-012 — the one-person quality team', () => {
  // Fails if the terminal safe state ever softens: it stays submitted and
  // unpublished, no version exists, no package can be built, no Job can link.
  it('stalls the submission and produces no version, no package and no linkage', () => {
    const afterSubmit = foldedStates()[12]!
    const terminal = fbSeq012TerminalState(afterSubmit)
    expect(terminal.submission?.status).toBe('Submitted')
    expect(terminal.submission?.stalled).toBe(true)
    expect(terminal.submission?.reviewerOfRecord).toBeNull()
    expect(terminal.versions).toEqual([])
    expect(terminal.workPackages).toEqual([])
    expect(terminal.hubPin).toBeNull()
    expect(linkableVersions(terminal)).toEqual([])
    expect(FB_SEQ_012.terminalSafeState).toMatch(/no version exists/)
    expect(FB_SEQ_012.whatItProves).toMatch(/it does not get published at all/)
  })

  // Fails if the branch stops being the staffability check made operational,
  // or if that check leaves the registry.
  it('is publish check eleven made operational, and branches from the submit step', () => {
    expect(FB_SEQ_012.branchesFromStep).toBe(12)
    expect(journeyStep(FB_SEQ_012.branchesFromStep)?.title).toBe('Submit')
    expect(PUBLISH_CHECKS.map((c) => c.id)).toContain(FB_SEQ_012.publishCheckId)
    expect(publishCheckById(FB_SEQ_012.publishCheckId).ordinal).toBe(11)
  })

  // Fails if the review stage can be reached with nobody distinct to fill it.
  it('cannot advance to approval, because no distinct Reviewer exists', () => {
    const terminal = fbSeq012TerminalState(foldedStates()[12]!)
    const refusal = journeyStep(16)!.requires(terminal)
    expect(refusal.met).toBe(false)
    if (refusal.met) return
    expect(refusal.reason).toMatch(/Reviewer/i)
  })
})

describe('FiveSurfaceEffects — the panel Task 23 renders on every step', () => {
  // Fails if any surface row disappears or renders blank for any step. This
  // is the exact contract the journey walkthrough asserts against.
  it('renders all five surface rows, none blank, on all twenty-two steps', () => {
    for (const step of JOURNEY_STEPS) {
      const html = renderToStaticMarkup(createElement(FiveSurfaceEffects, { step }))
      for (const code of SURFACE_CODES) {
        const marker = `data-testid="effect-${code}"`
        expect({ step: step.number, code, present: html.includes(marker) }).toEqual({
          step: step.number,
          code,
          present: true,
        })
      }
      const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      expect(text.length).toBeGreaterThan(200)
      for (const code of SURFACE_CODES)
        expect(text).toContain(effectStatement(step.effects[code as JourneySurfaceCode]).slice(0, 30))
    }
  })

  // Fails if an absent surface stops saying so on screen.
  it('says "No direct effect" on screen, with the reason, where a surface is untouched', () => {
    const html = renderToStaticMarkup(createElement(FiveSurfaceEffects, { step: journeyStep(13)! }))
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
    expect(text).toContain('No direct effect')
    expect(text).toContain('the prior version remains in force')
  })

  // Fails if the panel starts computing permissions instead of rendering the
  // record it is handed. No policy under src/ui.
  it('holds no policy', () => {
    const src = readFileSync('src/ui/shared/FiveSurfaceEffects.tsx', 'utf8')
    expect(src).not.toMatch(/@\/policy/)
    expect(src).not.toMatch(/\ballowedRoles\b|\bevaluateAccess\b/)
  })
})
