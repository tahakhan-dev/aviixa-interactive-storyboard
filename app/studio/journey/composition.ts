import type { ComponentType } from 'react'
import { STU_MODULES, stuModuleById, type StudioModuleId } from '@/studio/modules'
import { STU_SEAMS, stuSeamById, type StudioSeamDefinition } from '@/studio/seams'
import { JOURNEY_STEPS, JOURNEY_REFUSALS, journeyStep } from '@/studio/journey/effects'
import { journeyStates, type JourneyState } from '@/studio/journey/fixture'
import { WorkflowLibraryScreen } from '../workflow-library/WorkflowLibraryScreen'
import { BuilderScreen } from '../builder/BuilderScreen'
import { ScreenConfigurationScreen } from '../screen-configuration/ScreenConfigurationScreen'
import { AgentsScreen } from '../agents/AgentsScreen'
import { ApprovalWorkflowScreen } from '../approvals/ApprovalWorkflowScreen'
import { VersionsScreen } from '../versions/VersionsScreen'
import { WorkPackageScreen } from '../work-package/WorkPackageScreen'

/**
 * The Workflow Builder journey's COMPOSITION — which real module route each
 * of the twenty-two `SEQ-011` steps is performed on.
 *
 * THIS FILE RE-IMPLEMENTS NOTHING, AND THAT IS THE WHOLE DESIGN. Every row
 * below points at a route screen that already exists under `app/studio/`,
 * imported as a component and rendered whole. Nothing here reaches into
 * `@/studio/modules/stu-NN/` — a journey that imported a module's write
 * functions would be a second authoring path for the same content, and a
 * control drawn twice is a control that can disagree with itself.
 *
 * WHERE THE ACT BELONGS TO ANOTHER SURFACE THERE IS NO ROUTE AT ALL. Step 19
 * — pinning a package to a run — is `MOD-DOH-06`'s act in slice 6. It
 * composes the seam registry's own row and renders `StudioSeamNotice`. It
 * offers no control, because a row naming another surface is never an enabled
 * control here, whatever its token reads.
 *
 * WHERE THE ACTING MODULE HAS NO ROUTE OF ITS OWN, THE REGISTRY'S OWN REASON
 * IS CARRIED. Step 7 is `MOD-STU-09`'s act and `MOD-STU-09` has `slug: null`
 * with a stated `noRouteReason`: its three renderings are authored inside
 * Section 1 of `SCR-STU-04`, which is `MOD-STU-05`'s route. So the step is
 * hosted there and prints the registry's sentence rather than inventing one,
 * and it does NOT claim a route that does not exist.
 */

interface ComposedBase {
  readonly step: number
  /** The module whose ACT this step is. Never a guess. */
  readonly moduleId: string
}

export interface ComposedRoute extends ComposedBase {
  readonly kind: 'route'
  readonly moduleId: StudioModuleId
  /** Whose route hosts it. The same module, except where one has no route. */
  readonly hostModuleId: StudioModuleId
  readonly href: string
  readonly Screen: ComponentType
  /** The acting module's own stated reason for having no route. */
  readonly hostNote: string | null
}

export interface ComposedSeam extends ComposedBase {
  readonly kind: 'seam'
  readonly moduleId: 'MOD-DOH-06'
  readonly seam: StudioSeamDefinition
}

export type JourneyComposition = ComposedRoute | ComposedSeam

/** The route href, read off the registry's slug. Throws rather than guesses. */
function hrefFor(id: StudioModuleId): string {
  const slug = stuModuleById(STU_MODULES, id).slug
  if (slug === null) throw new Error(`${id} has no route slug, so it cannot host a journey step`)
  return `/studio/${slug}/`
}

function route(step: number, moduleId: StudioModuleId, Screen: ComponentType): ComposedRoute {
  return { kind: 'route', step, moduleId, hostModuleId: moduleId, href: hrefFor(moduleId), Screen, hostNote: null }
}

/** A step whose acting module has no route, hosted on the one that holds it. */
function hosted(
  step: number,
  moduleId: StudioModuleId,
  hostModuleId: StudioModuleId,
  Screen: ComponentType,
): ComposedRoute {
  return {
    kind: 'route',
    step,
    moduleId,
    hostModuleId,
    href: hrefFor(hostModuleId),
    Screen,
    hostNote: stuModuleById(STU_MODULES, moduleId).noRouteReason,
  }
}

export const JOURNEY_COMPOSITION = [
  route(1, 'MOD-STU-03', WorkflowLibraryScreen),
  route(2, 'MOD-STU-03', WorkflowLibraryScreen),
  route(3, 'MOD-STU-04', BuilderScreen),
  route(4, 'MOD-STU-04', BuilderScreen),
  route(5, 'MOD-STU-04', BuilderScreen),
  route(6, 'MOD-STU-05', ScreenConfigurationScreen),
  hosted(7, 'MOD-STU-09', 'MOD-STU-05', ScreenConfigurationScreen),
  route(8, 'MOD-STU-04', BuilderScreen),
  route(9, 'MOD-STU-04', BuilderScreen),
  route(10, 'MOD-STU-12', VersionsScreen),
  route(11, 'MOD-STU-11', ApprovalWorkflowScreen),
  route(12, 'MOD-STU-11', ApprovalWorkflowScreen),
  route(13, 'MOD-STU-11', ApprovalWorkflowScreen),
  route(14, 'MOD-STU-11', ApprovalWorkflowScreen),
  route(15, 'MOD-STU-15', AgentsScreen),
  route(16, 'MOD-STU-11', ApprovalWorkflowScreen),
  route(17, 'MOD-STU-12', VersionsScreen),
  route(18, 'MOD-STU-14', WorkPackageScreen),
  {
    kind: 'seam',
    step: 19,
    moduleId: 'MOD-DOH-06',
    seam: stuSeamById(STU_SEAMS, 'package-build-trigger-and-pin'),
  },
  route(20, 'MOD-STU-12', VersionsScreen),
  route(21, 'MOD-STU-12', VersionsScreen),
  route(22, 'MOD-STU-12', VersionsScreen),
] as const satisfies readonly JourneyComposition[]

export function compositionForStep(step: number): JourneyComposition | null {
  return JOURNEY_COMPOSITION.find((c) => c.step === step) ?? null
}

/* ==================================================================== *
 * THE FOLD — the states the journey actually reached.
 * ==================================================================== */

/**
 * Folded once, at module load, from the real step transitions. Deterministic:
 * `SEQ-011` reads no clock and mints no random identifier.
 *
 * A BROKEN FOLD IS SAID OUT LOUD RATHER THAN RENDERED AS AN EMPTY JOURNEY.
 * `journeyStates` stops at the first step whose precondition its predecessor
 * did not satisfy, and `JourneyScreen` renders that failure in an alert. The
 * alternative — falling back to `INITIAL_JOURNEY_STATE` for every step —
 * would draw twenty-two plausible screens over a journey that never happened.
 */
export const JOURNEY_FOLD = journeyStates(JOURNEY_STEPS)

/** Index 0 is the state before step 1; index n the state after step n. */
export const JOURNEY_STATES: readonly JourneyState[] = JOURNEY_FOLD.ok ? JOURNEY_FOLD.states : []

/* ==================================================================== *
 * THE FOUR REFUSALS — demonstrated, not printed.
 * ==================================================================== */

export interface RefusalDemonstration {
  readonly atStep: number
  readonly refusal: string
  readonly reason: string
  readonly sourceRef: string
  /** What was attempted, in one sentence. */
  readonly attempted: string
  /**
   * What happened when it was attempted. COMPUTED from the real precondition
   * or the real folded state — never written down. Loosen a guard and this
   * string starts "NOT REFUSED", which is what makes the gate able to fail.
   */
  readonly outcome: string
}

const NOT_REACHED = 'NOT REFUSED — the journey never reached the state this attempt starts from'

/** Runs a step's real precondition against a state and reports what it said. */
function attempt(stepNumber: number, from: JourneyState | undefined): string {
  const step = journeyStep(stepNumber)
  if (step === null || from === undefined) return NOT_REACHED
  const precondition = step.requires(from)
  return precondition.met
    ? `NOT REFUSED — step ${stepNumber} was permitted from this state`
    : `Refused — ${precondition.reason}`
}

function refusalRecord(atStep: number): (typeof JOURNEY_REFUSALS)[number] {
  const found = JOURNEY_REFUSALS.find((r) => r.atStep === atStep)
  if (found === undefined) throw new Error(`No refusal is registered at step ${atStep}`)
  return found
}

/** Step 13's refusal, from the state step 13 produced with its comment removed. */
function returnedWithNoComment(): JourneyState | undefined {
  const after13 = JOURNEY_STATES[13]
  if (after13 === undefined || after13.submission === null) return undefined
  return { ...after13, submission: { ...after13.submission, comments: [] } }
}

/**
 * Step 17's refusal is not a precondition — it is an ABSENCE, and reading the
 * pin is how an absence is demonstrated without creating it. `MOD-STU-12`'s
 * publish holds no reference to the run register, so the only thing to check
 * is that the pin the Hub wrote at step 19 is still the pin after two further
 * publications. Nothing here hands publication a run to look at.
 */
function inFlightPinHeld(): string {
  const atPin = JOURNEY_STATES[19]?.hubPin
  const afterSupersede = JOURNEY_STATES[20]?.hubPin
  const afterRollback = JOURNEY_STATES[21]?.hubPin
  if (atPin === undefined || atPin === null) return NOT_REACHED
  if (afterSupersede?.version !== atPin.version || afterRollback?.version !== atPin.version)
    return `NOT REFUSED — the pin moved from ${atPin.version} to ${afterSupersede?.version ?? 'nothing'}`
  return (
    `Refused — the in-flight run was not re-based: ${atPin.runId} still executes ` +
    `${atPin.version}, and is ${atPin.deviceReadiness}, after v2.2.0 and v2.3.0 both published.`
  )
}

/** Step 21: nothing is deleted, and the corrected content is a NEW number. */
function nothingWasDeleted(): string {
  const before = JOURNEY_STATES[20]
  const after = JOURNEY_STATES[21]
  if (before === undefined || after === undefined) return NOT_REACHED
  const withdrawn = after.versions.find((v) => v.number === 'v2.2.0')
  if (withdrawn === undefined || after.versions.length <= before.versions.length)
    return 'a published version was removed from the register'
  const minted = after.versions.filter((v) => !before.versions.some((b) => b.number === v.number))
  return (
    `v2.2.0 is retained as ${withdrawn.status} and stays readable; the correction came out ` +
    `forward as ${minted.map((v) => v.number).join(', ')}.`
  )
}

export const REFUSAL_DEMONSTRATIONS = [
  {
    ...refusalRecord(13),
    attempted:
      'Strip the Reviewer’s comment from the returned submission, then revise and resubmit it (step 14).',
    outcome: attempt(14, returnedWithNoComment()),
  },
  {
    ...refusalRecord(14),
    attempted:
      'Advance the submission straight to the Release Authority from Submitted, with no Reviewer of record (step 16, from the state step 12 produced).',
    outcome: attempt(16, JOURNEY_STATES[12]),
  },
  {
    ...refusalRecord(17),
    attempted:
      'Publish over an in-flight run: RUN-2026-08-14-A pinned v2.1.0 at step 19, and steps 20 and 21 publish v2.2.0 and v2.3.0 on top of it.',
    outcome: inFlightPinHeld(),
  },
  {
    ...refusalRecord(21),
    attempted:
      'Roll back by un-publishing v2.2.0 and republishing the last known-good content without re-running the chain (step 17 again, from the post-rollback state).',
    outcome: `${attempt(17, JOURNEY_STATES[21])}. Nothing was deleted: ${nothingWasDeleted()}`,
  },
] as const satisfies readonly RefusalDemonstration[]

export function refusalForStep(step: number): RefusalDemonstration | null {
  return REFUSAL_DEMONSTRATIONS.find((r) => r.atStep === step) ?? null
}
