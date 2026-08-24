import { type JourneySurfaceCode } from '@/ui/shared/journey'
import { DOH_AI_OVERLAY } from '@/surfaces/doh/ai-degradation'
import { STU_AI_OVERLAY } from '@/studio/ai-degradation'
import { CC_AI_OVERLAY } from '@/surfaces/cc/ai-degradation'
import { FL_AI_OVERLAY } from '@/frontline/ai-degradation'
import { SA_AI_OVERLAY } from '@/surfaces/sa/ai-degradation'
import { FIVE_SURFACE_JOIN } from './surface-codes'
import { type SurfaceAiOverlay } from './overlay'

/**
 * THE FIVE OVERLAYS AS ONE REGISTRY, AND THE ONE STEP RESOLVER.
 *
 * ── WHY THIS EXISTS: BOTH JOURNEY REGISTERS, NOT ONE ──────────────────────
 * There are TWO step registers in this build and they sit on opposite sides of
 * the `src/`/`app/` boundary: `src/studio/journey/effects.ts` holds the
 * twenty-two-step Studio journey, and `app/hub/journey/effects.ts` holds a
 * second, parallel composition with its own `HubJourneyStep`, its own
 * `JOURNEY_STEPS`, its own `journeyStep` and its own `JOURNEY_REFUSALS`.
 *
 * A silent single-register overlay leaves one journey with no
 * artificial-intelligence degradation and looks identical from outside to a
 * considered abstention. BOTH are overlaid, through this one function, so
 * there is one answer to "what does this step do when artificial intelligence
 * fails" and not two that can drift.
 *
 * AND "OVERLAID" MEANS RENDERED, WHICH IS WHAT THIS SENTENCE DID NOT MEAN WHEN
 * IT WAS FIRST WRITTEN. Both registers exported `AI_DEGRADATION_BY_STEP` and
 * nothing consumed either; the only gate read the two files as TEXT and
 * asserted the identifier appeared in them, which the identifier's presence
 * satisfies. So from outside, both journeys still rendered no
 * artificial-intelligence degradation — the exact shape this paragraph claimed
 * was impossible. The two screens now read the register and mount
 * `AiDegradationOverlay` for the open step:
 * `app/studio/journey/JourneyScreen.tsx` and `app/hub/journey/JourneyScreen.tsx`,
 * each under `data-testid="step-ai-degradation"`, and the gate asserts the
 * register's VALUE — every step number, and every overlay matched to its step's
 * acting surface — rather than the presence of a name.
 *
 * ── NO STEP IS ADDED TO EITHER REGISTER, AND THAT IS DELIBERATE ───────────
 * Four shipped tests pin the two registers' step populations — not merely their
 * lengths but their step NUMBERS: `tests/unit/stu-publish-checks.test.ts` and
 * `tests/component/stu-journey.test.tsx` on the Studio's twenty-two, and
 * `tests/unit/doh-journey.test.ts` and `tests/component/doh-journey.test.tsx`
 * on the Hub's nine. Adding a twenty-third step or a tenth would go red in
 * four files this task does not own.
 *
 * Those pins are RIGHT, and the overlay does not need to break them. An AI
 * degradation overlay is not another step in a journey; it is a property OF
 * each step — what that step's acting surface does when artificial intelligence
 * fails. So it is an adjunct keyed by step number, derived from the step's own
 * `actingSurface` through the five-surface join, and neither register's step
 * population changes. Nothing is renumbered, because nothing is added.
 *
 * ── IT IS DERIVED, NOT WRITTEN, SO THE TWO JOURNEYS CANNOT DISAGREE ───────
 * There is no hand-written map from step to behaviour. `actingSurface` is
 * already on `JourneyStep`, the join already turns a `JourneySurfaceCode` into
 * a surface, and the surface already has exactly one overlay. Two hand-written
 * maps would be two chances to file the Hub's step 6 under the Studio's
 * behaviour; a derivation has none.
 *
 * ── THE HONEST CASE FOR THE STUDIO IS ALREADY IN ITS OVERLAY ──────────────
 * A Studio step resolves to `STU_AI_OVERLAY`, whose `statedAbsences` say the
 * surface displays no runtime availability state and why — twelve
 * `Not applicable` cells in the queued-request matrix, and `AC-42-301`'s
 * conditional binding on surfaces that DISPLAY such a state. So a Studio step
 * renders a stated absence with its reason rather than a blank, which is the
 * same rule `@/ui/shared/journey` enforces structurally for a surface with no
 * effect: never an empty statement, always a reason.
 */

export const FIVE_SURFACE_OVERLAYS: readonly SurfaceAiOverlay[] = [
  DOH_AI_OVERLAY,
  STU_AI_OVERLAY,
  CC_AI_OVERLAY,
  FL_AI_OVERLAY,
  SA_AI_OVERLAY,
]

/**
 * Compile-time: every joined surface has an overlay. Adding a sixth surface to
 * `SurfaceId` fails the join's own check, and a joined surface with no overlay
 * fails `overlayForSurfaceCode` at module load rather than at render time.
 */
const BY_CODE = new Map<JourneySurfaceCode, SurfaceAiOverlay>(
  FIVE_SURFACE_OVERLAYS.map((overlay) => [overlay.journeyCode, overlay]),
)

for (const row of FIVE_SURFACE_JOIN) {
  if (!BY_CODE.has(row.journeyCode)) {
    throw new Error(
      `The five-surface join carries ${row.journeyCode} (${row.surfaceId}) but no `
        + 'artificial-intelligence degradation overlay exists for it, so a journey step acting '
        + 'on that surface would render a blank rather than a stated behaviour.',
    )
  }
}

/** Total. Throws rather than answering `undefined`. */
export function overlayForSurfaceCode(code: JourneySurfaceCode): SurfaceAiOverlay {
  const overlay = BY_CODE.get(code)
  if (overlay === undefined) {
    throw new Error(`No artificial-intelligence degradation overlay for surface code ${code}.`)
  }
  return overlay
}

/**
 * The minimum a step must carry to be overlaid. Structural rather than
 * `JourneyStep`, so both registers' own step types satisfy it without either
 * importing the other's and without widening `JourneyStep`, which is wave 5's.
 */
export interface OverlayableStep {
  readonly number: number
  readonly actingSurface: JourneySurfaceCode
}

export interface StepAiDegradation {
  readonly step: number
  /** The surface the ACT happens on, which is the surface whose overlay binds. */
  readonly actingSurface: JourneySurfaceCode
  readonly overlay: SurfaceAiOverlay
}

export const aiDegradationForStep = (step: OverlayableStep): StepAiDegradation => ({
  step: step.number,
  actingSurface: step.actingSurface,
  overlay: overlayForSurfaceCode(step.actingSurface),
})

/**
 * Every step of a register, overlaid. Total over the register: a step that
 * resolved to nothing would be a journey step with no stated behaviour under
 * failure, which is the blank this whole contract exists to make unspellable.
 */
export const aiDegradationForSteps = (
  steps: readonly OverlayableStep[],
): readonly StepAiDegradation[] => steps.map(aiDegradationForStep)
