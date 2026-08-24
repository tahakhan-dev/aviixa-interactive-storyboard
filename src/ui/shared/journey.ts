import type { SurfaceId } from '@/domain/surfaces'

/**
 * The render model behind `FiveSurfaceEffects`, for every surface's journey.
 *
 * The rule it exists to hold: an action's effect is visible on **every surface
 * it touches, and honestly absent on the ones it does not**. A surface with no
 * effect carries `kind: 'noDirectEffect'` **and a reason**, exactly as a blank
 * matrix cell is a build-blocking defect elsewhere in this build.
 *
 * The ARM is enforced by this type; the CONTENT of the reason is not, and
 * cannot be — see `effectStatement` below for what that costs and which
 * invariant pays it.
 *
 * It lives here rather than under `src/studio/` because the effects panel is
 * not the Studio's. Slice 5 built the twenty-two-step Studio journey against
 * it; slice 6's Hub journey composes Hub module routes over the same panel and
 * cites `WF-ORG-004` (L52656), `WF-AUT-010` (L53668) and `WF-EXE-001` (L53787)
 * where the Studio journey cites the `WF-AUT-0NN` authoring family. That is
 * the whole reason `workflowRef` is spelled generally: the field carries the
 * source's own workflow identifier for the step, from whichever family names
 * it, and `null` where the source names none.
 *
 * This module is data and one formatter. It computes no policy.
 */

export type JourneySurfaceCode = 'DOH' | 'STU' | 'CC' | 'FL' | 'SA'

export interface JourneySurfaceRef {
  readonly code: JourneySurfaceCode
  readonly surfaceId: SurfaceId
  readonly name: string
}

export const JOURNEY_SURFACES = [
  { code: 'DOH', surfaceId: 'SURF-DOH', name: 'Delivery Operations Hub' },
  { code: 'STU', surfaceId: 'SURF-STU', name: 'Standards and Operations Studio' },
  { code: 'CC', surfaceId: 'SURF-CC', name: 'Client Command Center' },
  { code: 'FL', surfaceId: 'SURF-FL', name: 'Frontline Worker Application' },
  { code: 'SA', surfaceId: 'SURF-SA', name: 'Super Admin platform console' },
] as const satisfies readonly JourneySurfaceRef[]

// Compile-time exhaustiveness check, same shape as `PERMISSION_OUTCOMES` in
// `@/policy/decision.ts`: every surface code appears exactly once, and every
// platform surface is represented.
type MissingFromJourneySurfaces = Exclude<
  JourneySurfaceCode,
  (typeof JOURNEY_SURFACES)[number]['code']
>
const _journeySurfacesExhaustive: MissingFromJourneySurfaces extends never ? true : never = true
void _journeySurfacesExhaustive
type MissingSurfaceId = Exclude<SurfaceId, (typeof JOURNEY_SURFACES)[number]['surfaceId']>
const _everySurfaceRepresented: MissingSurfaceId extends never ? true : never = true
void _everySurfaceRepresented

/**
 * An effect either happened on this surface or it did not. The second case
 * carries a REASON: "no direct effect" is a rendering, not an omission.
 *
 * `reason` and `statement` are `string`, which admits `''`. Nothing here
 * narrows that, deliberately: no non-empty-string type exists, and inventing a
 * branded one would change a type two journey screens and four test files
 * already depend on. Blank content is caught as a violation, not as a type
 * error — `everySurfaceStatesWhatChanges` in `@/ai/storyboards/invariants`.
 */
export type SurfaceEffect =
  | { readonly kind: 'affected'; readonly statement: string; readonly sourceRef: string }
  | { readonly kind: 'noDirectEffect'; readonly reason: string; readonly sourceRef: string }

export type FiveSurfaceEffectRecord = { readonly [K in JourneySurfaceCode]: SurfaceEffect }

export const affected = (statement: string, sourceRef: string): SurfaceEffect => ({
  kind: 'affected',
  statement,
  sourceRef,
})
export const noEffect = (reason: string, sourceRef: string): SurfaceEffect => ({
  kind: 'noDirectEffect',
  reason,
  sourceRef,
})

/**
 * The one sentence a surface row renders.
 *
 * WHAT THIS DOES NOT GUARANTEE, corrected in place. This comment used to claim
 * the shape made an empty string "structurally impossible rather than merely
 * discouraged". IT DOES NOT. `reason: string` and `statement: string` both
 * admit `''`, TypeScript has no non-empty-string type, and `noEffect('', ref)`
 * compiles — after which this function returns "No direct effect — " with
 * nothing after the dash: a blank cell wearing a label, which reads downstream
 * as a rendering. Requiring the FIELD is not requiring its CONTENT. That gap
 * shipped a blank Studio reason in a §44A storyboard before any check caught
 * it.
 *
 * WHERE THE CHECK ACTUALLY LIVES. `everySurfaceStatesWhatChanges` in
 * `@/ai/storyboards/invariants` (L92664) convicts a blank or whitespace-only
 * reason or statement on any of the five surfaces. It is an invariant rather
 * than a type because the type cannot express it, and a comment asserting an
 * impossibility the type does not deliver is the same defect as a gate that
 * cannot fail: it reads as coverage. Non-storyboard callers of this module —
 * the journey screens — are policed by their own panels' tests, not by that
 * invariant.
 *
 * WHAT THIS TEMPLATE COLLAPSES, STATED RATHER THAN LEFT TO BE NOTICED. The
 * §44A storyboards carry 20 absent cells out of 150. The frozen source writes
 * "No direct effect" nowhere in that chapter: it writes eight distinct absence
 * markers — "No change;", "Not applicable —", "No involvement;", "No platform
 * action;", "No intervention.", "Unaffected;", "Receives nothing;", "No role
 * in commands;" — and each card stores the REMAINDER of its cell as the
 * reason. This function renders all twenty under one label. That is a
 * deliberate presentation choice: a marker's job is to say the surface is
 * unaffected, which the label now says, and the reason carries the source's
 * own words for why.
 *
 * IT IS ONLY SAFE WHERE THE MARKER SAYS NOTHING THE LABEL DOES NOT. Two of the
 * source's markers carry content — "Receives nothing" (L93928) and "No role in
 * commands" (L93499) — and both are kept, restored into the reason with a
 * subject ("it receives nothing…"). A third, "No involvement in tenant
 * personnel" (L95189), SCOPES the absence, and dropping it made storyboard 29
 * render a blanket no-effect the source never stated; it is now carried the
 * same way. `tests/unit/ai-storyboard-contract-invariants.test.ts` holds all
 * twenty against their own source lines, so a fourth cannot be dropped
 * silently.
 */
export function effectStatement(effect: SurfaceEffect): string {
  return effect.kind === 'affected' ? effect.statement : `No direct effect — ${effect.reason}`
}

/**
 * One step of a journey, as the effects panel renders it. Deliberately no
 * `requires`/`produces` here: a journey's state fold is that journey's own,
 * typed on that journey's own state, and the panel neither reads nor needs
 * it. A surface composes this with its own transition type -- `SURF-STU` does
 * exactly that in `@/studio/journey/effects`.
 */
export interface JourneyStep {
  readonly number: number
  readonly title: string
  /**
   * The source workflow this step belongs to -- `WF-AUT-002` on the Studio
   * authoring journey, `WF-ORG-004` / `WF-AUT-010` / `WF-EXE-001` on the Hub's
   * -- or `null` where the source names none. Free text rather than a
   * `WF-<FAMILY>-<NNN>` union because the source writes compounds it has no
   * identifier for: "WF-AUT-002 into WF-AUT-004", "WF-AUT-008, implicitly".
   * Narrowing the type would delete the qualifier, which is the one thing
   * telling a reader the step is not squarely inside that workflow.
   */
  readonly workflowRef: string | null
  readonly sourceRef: string
  readonly ownerModule: string
  /** The surface the ACT happens on, which is not always the surface reading it. */
  readonly actingSurface: JourneySurfaceCode
  readonly effects: FiveSurfaceEffectRecord
  /** Where this step departs from a five-surface row, and why. */
  readonly note: string | null
}
