import { permitsAction } from '@/policy/decision'
import type { StudioAccessDecision, StudioAccessInput } from '@/studio/access/evaluate'
import { evaluateStudioAccess } from '@/studio/access/evaluate'
import {
  SEEDED_SCENARIO,
  SEEDED_STATE,
  SEEDED_TENANT,
  affordanceFor,
  studioGrantsFor,
  studioIdentityFor,
  type CapabilityAffordance,
  type Stu18Scenario,
} from '@/studio/modules/stu-18/rendering'
import type { Locale } from '@/studio/vocab'
import {
  applyLocalisationAct,
  type ElementLocaleState,
  type LocalisationActResult,
  type LocalisationAuditWrite,
  type LocalisedWorkflow,
} from './locales'
import { stu17Row, type Stu17RowId } from './matrix'

/**
 * `MOD-STU-17`'s rendering rule, decided ONCE and read by the screen.
 *
 * WHY THIS IMPORTS `stu-18/rendering` RATHER THAN COPYING IT. The six-token
 * affordance rule (`allowed`/`allowedWithConditions` → enabled;
 * `readOnly`/`unavailable` → disabled carrying the CELL'S OWN WORDS;
 * `clientDecisionRequired` → the open decision; `explicitlyProhibited` →
 * ABSENT) is a SURFACE rule, not a module one, and `MOD-STU-05`,
 * `MOD-STU-07` and `MOD-STU-09` already read it from there. A second copy is
 * the shape this build has paid for repeatedly.
 *
 * EVERY REFUSAL ON THIS SCREEN IS AN ABSENCE, AND THAT IS CHECKABLE. A cell
 * renders disabled only where its `routedTo` names a capability this persona
 * actually holds; no cell of this card names one (see `./matrix.ts`), so
 * `Explicitly prohibited` renders as a note where a control would be and
 * never as a disabled button implying a condition that could become true.
 *
 * NO DEAD CONTROLS, AND IT IS CHECKABLE. Every control names the
 * `localisationService` function it invokes. An enabled control with no
 * service key does not type-check, and the covering test looks the key up in
 * the service and then asserts the EFFECT — that the coverage grid and the
 * publication decision change — rather than that a handler was passed.
 *
 * NO POLICY UNDER `src/ui/`. This file is under `src/studio/`, it computes
 * decisions, and the screen it feeds only draws.
 */

export type Stu17Scenario = Stu18Scenario

export function stu17Scenario(over: Partial<Stu17Scenario> = {}): Stu17Scenario {
  return { ...SEEDED_SCENARIO, ...over }
}

/** THE ONE ACCESS CALL THIS MODULE MAKES, per control, over the matrix ROW. */
export function stu17Decision(id: Stu17RowId, s: Stu17Scenario): StudioAccessDecision {
  const input: StudioAccessInput = {
    row: stu17Row(id),
    identity: studioIdentityFor(s.persona),
    grants: studioGrantsFor(s),
    commercialTier: s.commercialTier,
    identityLayer: s.identityLayer,
    state: SEEDED_STATE,
    online: s.online,
    resourceTenant: SEEDED_TENANT,
    // No row of this card occupies an approval stage — the chain that reviews
    // a drafted variant is MOD-STU-11's. Written as `null` rather than
    // omitted, so the floor is declared rather than forgotten.
    authorOfRecord: null,
    reviewerOfRecord: null,
    releaseAuthorityOfRecord: null,
  }
  return evaluateStudioAccess(input)
}

/* ==================================================================== *
 * THE SERVICE — what an enabled control actually invokes.
 * ==================================================================== */

/**
 * Every function routes through `applyLocalisationAct`, the module's single
 * write path, which writes the audit entry BEFORE it mutates and refuses the
 * act outright where the audit cannot be written. Three call sites, one
 * enforcement point: an audit contract wired to one handler of three is the
 * defect this build shipped in slice 4.
 */
export const localisationService = {
  declareLocaleCoverage: (
    workflow: LocalisedWorkflow,
    locales: readonly Locale[],
    identityId: string,
    writeAudit: LocalisationAuditWrite,
  ): LocalisationActResult =>
    applyLocalisationAct(workflow, { act: 'declare-locale-coverage', locales }, identityId, writeAudit),

  authorLocaleVariant: (
    workflow: LocalisedWorkflow,
    elementId: string,
    locale: Locale,
    state: ElementLocaleState,
    identityId: string,
    writeAudit: LocalisationAuditWrite,
  ): LocalisationActResult =>
    applyLocalisationAct(
      workflow,
      { act: 'author-locale-variant', elementId, locale, state },
      identityId,
      writeAudit,
    ),

  requestDrafting: (
    workflow: LocalisedWorkflow,
    elementId: string,
    locale: Locale,
    identityId: string,
    writeAudit: LocalisationAuditWrite,
  ): LocalisationActResult =>
    applyLocalisationAct(
      workflow,
      { act: 'request-drafting', elementId, locale },
      identityId,
      writeAudit,
    ),
}

/* ==================================================================== *
 * THE CONTROLS THIS SCREEN OFFERS.
 * ==================================================================== */

export interface LocalisationControl {
  readonly id: Stu17RowId
  readonly label: string
  readonly affordance: CapabilityAffordance
  /**
   * The `localisationService` function this control invokes, or `null` where
   * the control is not drawn at all. Never a bound no-op.
   */
  readonly serviceKey: keyof typeof localisationService | null
  readonly sourceRefs: readonly string[]
}

/**
 * DO NOT INVENT A CONTROL. Every entry is one of the source's own rows.
 *
 * Row 8 ("View the coverage report") is NOT here: it is what the screen IS,
 * and `coverageReportAffordance` answers it once for the whole screen rather
 * than as a button beside the grid it governs — the same move `MOD-STU-05`
 * makes with "Open the configuration panel".
 *
 * Rows 4, 5 and 6 ARE here, and they render as an ABSENCE with the rule
 * stated. That is deliberate: `AC-STU-155` requires an unavailable capability
 * to be shown with its reason rather than hidden, `Explicitly prohibited`
 * carries no control anywhere, and the list is the same length for every
 * persona so a reader cannot infer a capability from a shorter list.
 *
 * ROW 7 IS NOT HERE AND HAS NO ENTRY ANYWHERE. All six of its cells read
 * `Not applicable` — locale-pack versioning sits platform-side — so there is
 * no control, no disabled control, and no note. See `./matrix.ts`.
 */
const CONTROL_ROWS = [
  'declare-a-workflows-locale-coverage',
  'author-a-locale-variant',
  'request-artificial-intelligence-drafting-of-a-locale-variant',
  'publish-into-an-incomplete-locale',
  'enable-run-time-machine-translation',
  'add-a-locale-beyond-english-and-spanish',
] as const satisfies readonly Stu17RowId[]

const CONTROL_LABELS = {
  'declare-a-workflows-locale-coverage': 'Declare locale coverage',
  'author-a-locale-variant': 'Author this locale variant',
  'request-artificial-intelligence-drafting-of-a-locale-variant': 'Draft this locale variant',
  'publish-into-an-incomplete-locale': 'Publish into an incomplete locale',
  'enable-run-time-machine-translation': 'Enable run-time machine translation',
  'add-a-locale-beyond-english-and-spanish': 'Add a locale',
  'view-the-coverage-report': 'View the coverage report',
} as const satisfies Readonly<Record<Stu17RowId, string>>

/**
 * Which service function each control invokes. `null` on the three rows
 * refused in all eight columns — the honest answer rather than an omission,
 * because there is no function for an act the platform refuses to everyone.
 */
const CONTROL_SERVICE = {
  'declare-a-workflows-locale-coverage': 'declareLocaleCoverage',
  'author-a-locale-variant': 'authorLocaleVariant',
  'request-artificial-intelligence-drafting-of-a-locale-variant': 'requestDrafting',
  'publish-into-an-incomplete-locale': null,
  'enable-run-time-machine-translation': null,
  'add-a-locale-beyond-english-and-spanish': null,
} as const satisfies Readonly<
  Record<(typeof CONTROL_ROWS)[number], keyof typeof localisationService | null>
>

export function localisationControls(s: Stu17Scenario): readonly LocalisationControl[] {
  return CONTROL_ROWS.map((id) => {
    const row = stu17Row(id)
    const affordance = affordanceFor(CONTROL_LABELS[id], stu17Decision(id, s))
    const serviceKey = affordance.kind === 'enabled' ? CONTROL_SERVICE[id] : null
    return { id, label: CONTROL_LABELS[id], affordance, serviceKey, sourceRefs: row.sourceRefs }
  })
}

/**
 * ROW 8 — whether this persona reads the coverage report at all, and how.
 *
 * SCOPE IS ENFORCED IN THE READ. The screen asks this ONCE and draws no grid
 * where the answer refuses; the grid is not drawn and then hidden. The
 * Read-only Auditor's answer is `DEC-AUDSTU-001` and renders as the open
 * decision, never as a guess in either direction (`AC-STU-157`, L34674).
 */
export function coverageReportAffordance(s: Stu17Scenario): CapabilityAffordance {
  return affordanceFor(
    CONTROL_LABELS['view-the-coverage-report'],
    stu17Decision('view-the-coverage-report', s),
  )
}

/** Whether this persona may act on one row — the evaluator's answer, reused. */
export function permitsRow(id: Stu17RowId, s: Stu17Scenario): boolean {
  return permitsAction(stu17Decision(id, s).decision)
}
