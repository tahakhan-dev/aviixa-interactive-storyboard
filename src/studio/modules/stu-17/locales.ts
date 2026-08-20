import type { StudioDecisionId } from '@/studio/disclosure/decisions'
import { STU_MODULES, stuModuleById, type StudioModuleId } from '@/studio/modules'
import type { PublishCheckImplementation, PublishCheckVerdict } from '@/studio/publish/register'
import { LOCALES, type Locale } from '@/studio/vocab'

/**
 * `MOD-STU-17`'s domain — the per-locale authored variants, the publish-time
 * completeness check, and `SB-STU-20`'s coverage grid. Frozen source §5.17,
 * card L34351-L34498.
 *
 * THREE RULES THIS FILE EXISTS TO HOLD.
 *
 * 1. **THE BLOCK IS PER LOCALE.** L34361: "A Workflow declaring English and
 *    Spanish whose Spanish coaching default is missing publishes in English
 *    and is blocked in Spanish, with the specific missing element named."
 *    `FUNC-STU-17-03-A-2` (L34410) states the same as a functionality:
 *    "Block publication in the incomplete locale only, naming each missing
 *    element, and permit publication in complete locales." Both readings of
 *    that sentence render, from the shared canon: `D29` in
 *    `@/studio/disclosure/decisions`. This module holds NO copy of it.
 *
 * 2. **THE CHECK FAILS CLOSED.** `FUNC-STU-17-03-A-1` (L34409): "where the
 *    check itself cannot run, publication is blocked, failing closed, because
 *    publishing an unverified locale is the exact failure the check exists to
 *    prevent." `AC-STU-149` (L34487) repeats it. There is deliberately no
 *    argument, option or state in this file that lets an unrunnable check
 *    return anything a caller could publish on: `evaluateLocaleCompleteness`
 *    returns an EMPTY `publishable` and a stated reason, and there is no
 *    second entry point that returns warnings.
 *
 * 3. **NOTHING IS TRANSLATED AT RUN TIME, ANYWHERE** (L34357). There is no
 *    translate function here, no locale-inference, and no fallback that
 *    renders one locale's content under another's name. A missing variant is
 *    a BLOCK, never a substitution — which is why the only thing this module
 *    computes for a missing element is a refusal and an editor link.
 *
 * DETERMINISM: no clock, no random source, no module-level mutable state.
 * Every register this file reads arrives as a parameter or is a frozen seed.
 */

/* ==================================================================== *
 * THE ELEMENT SET — every worker-facing element, coaching defaults included.
 * ==================================================================== */

/**
 * L34400 (`FUNC-STU-17-01-A-2`) names six: "instruction text at each
 * difficulty level, screen-specific notes, Shared Instruction Blocks,
 * deviation-capture forms, coaching assets, and Training Library content".
 * L34357 lists the same six in the same order.
 *
 * **THE SEVENTH IS NOT AN INVENTION AND IS THE ONE THAT MATTERS.** L34359
 * requires the check to cover "every worker-facing element of the Workflow —
 * **including the designated coaching defaults**", and the card's own
 * illustrative example (L34449) makes the missing element "Screen 7, Section
 * 6, curated coaching default, Spanish". `AC-STU-147` (L34485) names it
 * separately from coaching assets as well. A designated default is a POINTER
 * at an asset, so an element set that collapsed it into `Coaching assets`
 * would report full coverage for a locale whose default was never designated
 * — the exact outcome the example describes.
 */
export type WorkerFacingElementKind =
  | 'Instruction text at each difficulty level'
  | 'Screen-specific notes'
  | 'Shared Instruction Blocks'
  | 'Deviation-capture forms'
  | 'Coaching assets'
  | 'Training Library content'
  | 'Designated coaching default'

export const WORKER_FACING_ELEMENT_KINDS = [
  'Instruction text at each difficulty level',
  'Screen-specific notes',
  'Shared Instruction Blocks',
  'Deviation-capture forms',
  'Coaching assets',
  'Training Library content',
  'Designated coaching default',
] as const satisfies readonly WorkerFacingElementKind[]

type MissingFromKinds = Exclude<
  WorkerFacingElementKind,
  (typeof WORKER_FACING_ELEMENT_KINDS)[number]
>
const _kindsExhaustive: MissingFromKinds extends never ? true : never = true
void _kindsExhaustive

/** L34393, per element per locale, in the source's own order. */
export type ElementLocaleState =
  | 'Authored'
  | 'Drafted by artificial intelligence'
  | 'Reviewed'
  | 'Complete'
  | 'Incomplete'

export const ELEMENT_LOCALE_STATES = [
  'Authored',
  'Drafted by artificial intelligence',
  'Reviewed',
  'Complete',
  'Incomplete',
] as const satisfies readonly ElementLocaleState[]

type MissingFromElementStates = Exclude<
  ElementLocaleState,
  (typeof ELEMENT_LOCALE_STATES)[number]
>
const _elementStatesExhaustive: MissingFromElementStates extends never ? true : never = true
void _elementStatesExhaustive

/** L34393, per locale on a Workflow. Two states, and the second one blocks. */
export type WorkflowLocaleState = 'Complete and publishable' | 'Incomplete and blocked'

export const WORKFLOW_LOCALE_STATES = [
  'Complete and publishable',
  'Incomplete and blocked',
] as const satisfies readonly WorkflowLocaleState[]

type MissingFromWorkflowStates = Exclude<
  WorkflowLocaleState,
  (typeof WORKFLOW_LOCALE_STATES)[number]
>
const _workflowStatesExhaustive: MissingFromWorkflowStates extends never ? true : never = true
void _workflowStatesExhaustive

/**
 * `SB-STU-20`'s three cell renderings (L34447): "each cell showing Complete,
 * Drafted awaiting review, or Missing with the element named".
 *
 * **FINDING F2 — THE CARD NAMES FIVE STATES AND THE STORYBOARD NAMES THREE
 * RENDERINGS, AND THE SOURCE STATES NO MAPPING BETWEEN THEM.** This build's
 * mapping is `renderingOf` below and it is stated rather than assumed:
 * `Complete` renders Complete; `Authored`, `Drafted by artificial
 * intelligence` and `Reviewed` all render `Drafted awaiting review`, because
 * the happy path (L34414-L34420) runs authoring, then drafting, then review,
 * and only THEN the completeness check — so an element that has not reached
 * `Complete` is one the check has not cleared, whatever stage it stopped at.
 * `Incomplete` and an absent variant both render Missing, because L34359 asks
 * whether the element "exists in every locale the Workflow declares" and a
 * never-authored variant and a variant recorded incomplete both answer no.
 *
 * Nothing weaker is available: reading `Reviewed` as publishable would let a
 * reviewed-but-unfinished element through the one check that stands between a
 * declared locale and a blank screen on the floor.
 */
export type CoverageCellRendering = 'Complete' | 'Drafted awaiting review' | 'Missing'

export const COVERAGE_CELL_RENDERINGS = [
  'Complete',
  'Drafted awaiting review',
  'Missing',
] as const satisfies readonly CoverageCellRendering[]

type MissingFromRenderings = Exclude<
  CoverageCellRendering,
  (typeof COVERAGE_CELL_RENDERINGS)[number]
>
const _renderingsExhaustive: MissingFromRenderings extends never ? true : never = true
void _renderingsExhaustive

export function renderingOf(state: ElementLocaleState | undefined): CoverageCellRendering {
  if (state === undefined || state === 'Incomplete') return 'Missing'
  if (state === 'Complete') return 'Complete'
  return 'Drafted awaiting review'
}

/**
 * WHICH MODULE HOLDS THE EDITOR for each kind of element. `SB-STU-20`
 * requires every Missing cell to link "straight to the editor for that
 * element in that locale", and a link needs a route.
 *
 * `MOD-STU-09` is deliberately absent even though it owns difficulty levels:
 * its own registry entry carries `slug: null` because the three renderings
 * are authored inside Section 1 of `SCR-STU-04`, which is `MOD-STU-05`'s
 * route. Pointing at a module with no route would produce a dead link.
 */
const EDITOR_MODULE_BY_KIND = {
  'Instruction text at each difficulty level': 'MOD-STU-05',
  'Screen-specific notes': 'MOD-STU-05',
  'Shared Instruction Blocks': 'MOD-STU-06',
  'Deviation-capture forms': 'MOD-STU-05',
  'Coaching assets': 'MOD-STU-07',
  'Training Library content': 'MOD-STU-08',
  'Designated coaching default': 'MOD-STU-05',
} as const satisfies Readonly<Record<WorkerFacingElementKind, StudioModuleId>>

export interface WorkerFacingElement {
  readonly id: string
  readonly kind: WorkerFacingElementKind
  /** How the block names it, in the wording the source's own example uses. */
  readonly name: string
  /** The screen it belongs to, or `null` where it belongs to the Workflow. */
  readonly screenId: string | null
  /**
   * The state of this element IN EACH LOCALE. A key that is absent means the
   * variant was never authored, which is a different fact from `Incomplete`
   * and is why this is a `Partial` rather than a total record — both render
   * Missing and both block, and neither is written as the other.
   */
  readonly states: Readonly<Partial<Record<Locale, ElementLocaleState>>>
}

export interface LocalisedWorkflow {
  readonly workflowId: string
  readonly workflowName: string
  /**
   * What the Workflow DECLARES, which is the only set the check measures
   * against (L34359). Never `LOCALES`: a Workflow declaring English alone is
   * complete when English is complete.
   */
  readonly declaredLocales: readonly Locale[]
  readonly elements: readonly WorkerFacingElement[]
}

/** Drops one element. Used to prove a coverage assertion is driven by the element. */
export function withoutElement(
  workflow: LocalisedWorkflow,
  elementId: string,
): LocalisedWorkflow {
  return { ...workflow, elements: workflow.elements.filter((e) => e.id !== elementId) }
}

/* ==================================================================== *
 * THE CHECK. Per locale, and fail-closed.
 * ==================================================================== */

/** Whether the check can answer at all. The second value blocks everything. */
export type CompletenessCheckStatus = 'runnable' | 'unrunnable'

export interface LocaleBlocker {
  readonly locale: Locale
  readonly elementId: string
  /** The SPECIFIC missing element, named. A blocker that names nothing is a defect. */
  readonly element: string
  readonly kind: WorkerFacingElementKind
  readonly rendering: Exclude<CoverageCellRendering, 'Complete'>
}

export interface LocaleSummary {
  readonly locale: Locale
  readonly state: WorkflowLocaleState
  /** `SB-STU-20`'s per-locale summary line, L34447. */
  readonly line: string
  readonly missingCount: number
  readonly awaitingReviewCount: number
}

export interface LocaleCompleteness {
  readonly checkStatus: CompletenessCheckStatus
  /** Locales this version may publish in. EMPTY whenever the check cannot run. */
  readonly publishable: readonly Locale[]
  readonly blocked: readonly Locale[]
  readonly blockers: readonly LocaleBlocker[]
  readonly summaries: readonly LocaleSummary[]
  /** Non-null ONLY where the check could not answer. Fail-closed's own words. */
  readonly reason: string | null
}

const UNRUNNABLE_REASON =
  'Publication is blocked in every declared locale because locale completeness could not be ' +
  'verified. The check failed to run, and publishing an unverified locale is the exact failure ' +
  'the check exists to prevent (FUNC-STU-17-03-A-1, L34409; AC-STU-149, L34487).'

const UNDECLARED_REASON =
  'Publication is blocked because this Workflow declares no locale, so locale completeness could ' +
  'not be verified against anything. The declaration is a precondition of the check (L34385), ' +
  'and an unmeasurable check blocks rather than passes (AC-STU-149, L34487).'

function countedLine(missing: number, awaiting: number): string {
  if (missing === 0 && awaiting === 0) return 'Ready to publish'
  const parts: string[] = []
  if (missing > 0) parts.push(`${missing} missing element${missing === 1 ? '' : 's'}`)
  if (awaiting > 0) parts.push(`${awaiting} drafted awaiting review`)
  return `Blocked, ${parts.join(' and ')}`
}

/**
 * THE ONE IMPLEMENTATION of the locale-completeness check (publish check 6,
 * `PUBLISH_CHECKS`), applied per declared locale.
 *
 * The order of the two fail-closed guards is deliberate: an unrunnable check
 * is answered before the element set is looked at, so a Workflow with no
 * elements at all cannot come back "complete" from a check that never ran.
 */
export function evaluateLocaleCompleteness(
  workflow: LocalisedWorkflow,
  options?: { readonly checkStatus?: CompletenessCheckStatus },
): LocaleCompleteness {
  const checkStatus: CompletenessCheckStatus = options?.checkStatus ?? 'runnable'
  const declared = workflow.declaredLocales

  if (checkStatus === 'unrunnable' || declared.length === 0) {
    return {
      checkStatus,
      publishable: [],
      blocked: [...declared],
      blockers: [],
      summaries: declared.map((locale) => ({
        locale,
        state: 'Incomplete and blocked',
        line: 'Blocked, completeness could not be verified',
        missingCount: 0,
        awaitingReviewCount: 0,
      })),
      reason: declared.length === 0 ? UNDECLARED_REASON : UNRUNNABLE_REASON,
    }
  }

  const blockers: LocaleBlocker[] = []
  for (const element of workflow.elements) {
    for (const locale of declared) {
      const rendering = renderingOf(element.states[locale])
      if (rendering === 'Complete') continue
      blockers.push({
        locale,
        elementId: element.id,
        element: element.name,
        kind: element.kind,
        rendering,
      })
    }
  }

  const summaries: LocaleSummary[] = declared.map((locale) => {
    const forLocale = blockers.filter((b) => b.locale === locale)
    const missingCount = forLocale.filter((b) => b.rendering === 'Missing').length
    const awaitingReviewCount = forLocale.length - missingCount
    return {
      locale,
      state: forLocale.length === 0 ? 'Complete and publishable' : 'Incomplete and blocked',
      line: countedLine(missingCount, awaitingReviewCount),
      missingCount,
      awaitingReviewCount,
    }
  })

  return {
    checkStatus,
    publishable: summaries.filter((s) => s.state === 'Complete and publishable').map((s) => s.locale),
    blocked: summaries.filter((s) => s.state === 'Incomplete and blocked').map((s) => s.locale),
    blockers,
    summaries,
    reason: null,
  }
}

/** The blocking sentence for one locale — every missing element, named. */
export function blockingElementsFor(
  result: LocaleCompleteness,
  locale: Locale,
): string {
  const named = result.blockers
    .filter((b) => b.locale === locale)
    .map((b) =>
      b.rendering === 'Missing'
        ? `${b.element} is missing`
        : `${b.element} is drafted and awaiting review`,
    )
  return `${locale} — ${named.join('; ')}`
}

/**
 * PUBLISH CHECK 6, registered per locale.
 *
 * The register in `@/studio/publish/register` answers "may this publish?" for
 * ONE publication. The source's answer is per locale (L34361), so the check is
 * registered per locale and a caller asks it once per declared locale. That is
 * what makes "publishes in English and is blocked in Spanish" expressible
 * through task 5's own register rather than through a second publication path
 * built here — and there is no waiver, no severity below "blocks", and no way
 * for a caller to reach publication with a blocker outstanding.
 */
export function localeCompletenessCheck(
  locale: Locale,
  options: { readonly checkStatus?: CompletenessCheckStatus } = {},
): PublishCheckImplementation<LocalisedWorkflow> {
  return {
    checkId: 'locale-completeness',
    implementedBy: 'MOD-STU-17',
    run: (workflow): PublishCheckVerdict => {
      const result = evaluateLocaleCompleteness(workflow, options)
      if (result.reason !== null) return { outcome: 'cannot-run', reason: result.reason }
      if (result.publishable.includes(locale)) return { outcome: 'passed' }
      if (!result.blocked.includes(locale)) {
        // Fail closed on a locale the Workflow never declared: nothing was
        // checked for it, so nothing may publish into it.
        return {
          outcome: 'blocked',
          blockingElement: `${locale} — this Workflow does not declare ${locale}, so its content was never checked`,
        }
      }
      return { outcome: 'blocked', blockingElement: blockingElementsFor(result, locale) }
    },
  }
}

/* ==================================================================== *
 * SB-STU-20 — THE COVERAGE GRID (L34447).
 * ==================================================================== */

export interface EditorLink {
  readonly label: string
  /** `null` where the owning module's route is not in the tree yet. */
  readonly href: string | null
  readonly moduleId: StudioModuleId
  /** Why there is no link, where there is none. Never an empty link. */
  readonly unavailableNote: string | null
}

export interface CoverageCell {
  readonly elementId: string
  readonly locale: Locale
  readonly rendering: CoverageCellRendering
  readonly state: ElementLocaleState | null
  /** The cell's own sentence. Names the element, always (L34447). */
  readonly note: string
  /** Present on every cell the check refuses. `null` on a Complete cell. */
  readonly editorLink: EditorLink | null
}

export interface CoverageGrid {
  readonly workflowId: string
  readonly workflowName: string
  readonly elements: readonly WorkerFacingElement[]
  readonly locales: readonly Locale[]
  readonly cells: readonly CoverageCell[]
  readonly summaries: readonly LocaleSummary[]
  readonly completeness: LocaleCompleteness
}

function editorLinkFor(
  workflow: LocalisedWorkflow,
  element: WorkerFacingElement,
  locale: Locale,
): EditorLink {
  const moduleId = EDITOR_MODULE_BY_KIND[element.kind]
  const module = stuModuleById(STU_MODULES, moduleId)
  const label = `Open ${element.name} in ${locale}`
  if (module.slug === null || !module.routeBuilt) {
    return {
      label,
      href: null,
      moduleId,
      unavailableNote:
        `The editor for this element is ${module.name} (${moduleId}), whose route is not in ` +
        'this build yet. The gap is stated rather than linked, because a link to a route that ' +
        'does not exist is worse than no link.',
    }
  }
  const screen = element.screenId === null ? '' : `&screen=${element.screenId}`
  return {
    label,
    href: `/studio/${module.slug}?workflow=${workflow.workflowId}${screen}&element=${element.id}&locale=${locale}`,
    moduleId,
    unavailableNote: null,
  }
}

/**
 * "A grid with one row per worker-facing element and one column per declared
 * locale" (L34447). The grid is DERIVED from the same evaluation the publish
 * check runs, never computed a second time here: a screen that decided
 * completeness for itself would be a second answer to the one question this
 * module exists to answer.
 */
export function coverageGrid(workflow: LocalisedWorkflow): CoverageGrid {
  const completeness = evaluateLocaleCompleteness(workflow)
  const locales = workflow.declaredLocales
  const cells = workflow.elements.flatMap((element) =>
    locales.map((locale): CoverageCell => {
      const state = element.states[locale] ?? null
      const rendering = renderingOf(state ?? undefined)
      return {
        elementId: element.id,
        locale,
        rendering,
        state,
        note: `${rendering} — ${element.name}, ${locale}`,
        editorLink: rendering === 'Complete' ? null : editorLinkFor(workflow, element, locale),
      }
    }),
  )
  return {
    workflowId: workflow.workflowId,
    workflowName: workflow.workflowName,
    elements: workflow.elements,
    locales,
    cells,
    summaries: completeness.summaries,
    completeness,
  }
}

/**
 * The permanent line `SB-STU-20` requires, verbatim (L34447). A constant so
 * that a reworded copy in a second place cannot exist.
 */
export const PERMANENT_LINE =
  'Nothing is translated at run time. Every locale variant is authored and reviewed.'

/* ==================================================================== *
 * THE SEEDED WORKFLOW — the card's own illustrative example (L34449).
 * ==================================================================== */

/**
 * Bright Bikes, "Assembly — Wheel Bolt Torque Verification", declaring
 * English and Spanish, with the one gap the source's own example describes:
 * "He forgets to designate a Spanish curated coaching default on screen 7.
 * The completeness check blocks publication in Spanish, naming 'Screen 7,
 * Section 6, curated coaching default, Spanish'."
 *
 * Every one of the seven element kinds appears, so the check is demonstrated
 * over the whole element set rather than over the one row that fails — the
 * defect shape where a contract is proven where it costs nothing.
 */
export const WHEEL_BOLT_LOCALISATION: LocalisedWorkflow = {
  workflowId: 'WF-WHEEL-BOLT',
  workflowName: 'Assembly — Wheel Bolt Torque Verification',
  declaredLocales: LOCALES,
  elements: [
    {
      id: 'screen-3-instruction-text',
      kind: 'Instruction text at each difficulty level',
      name: 'Screen 3, instruction text at all three difficulty levels',
      screenId: 'SCR-3',
      states: { English: 'Complete', Spanish: 'Complete' },
    },
    {
      id: 'screen-3-notes',
      kind: 'Screen-specific notes',
      name: 'Screen 3, screen-specific notes',
      screenId: 'SCR-3',
      states: { English: 'Complete', Spanish: 'Complete' },
    },
    {
      id: 'torque-safety-block',
      kind: 'Shared Instruction Blocks',
      name: 'Shared Instruction Block, torque wrench safety',
      screenId: null,
      states: { English: 'Complete', Spanish: 'Complete' },
    },
    {
      id: 'screen-7-deviation-form',
      kind: 'Deviation-capture forms',
      name: 'Screen 7, deviation-capture form',
      screenId: 'SCR-7',
      states: { English: 'Complete', Spanish: 'Complete' },
    },
    {
      id: 'torque-technique-clip',
      kind: 'Coaching assets',
      name: 'Coaching asset, torque sequence demonstration',
      screenId: null,
      states: { English: 'Complete', Spanish: 'Complete' },
    },
    {
      id: 'wheel-bolt-training-module',
      kind: 'Training Library content',
      name: 'Training Library, wheel bolt torque module',
      screenId: null,
      states: { English: 'Complete', Spanish: 'Complete' },
    },
    {
      // The source's own gap. The Spanish key is ABSENT rather than
      // `Incomplete`, because Sam never designated it — the example's word is
      // "forgets", not "left unfinished".
      id: 'screen-7-section-6-coaching-default',
      kind: 'Designated coaching default',
      name: 'Screen 7, Section 6, curated coaching default',
      screenId: 'SCR-7',
      states: { English: 'Complete' },
    },
  ],
}

/* ==================================================================== *
 * THE DERIVED CLARIFICATION AT L34361 — IN THE CANON, NOT HERE.
 * ==================================================================== */

/**
 * L34361's two readings of "blocks publication in that locale" used to be
 * held in this module, in the canon's shape but outside it, because the canon
 * carried no record for them. It carries one now — `D29` — so the tension
 * renders through `DecisionDisclosure` like every other decision on this
 * surface, and this module states no wording of its own.
 *
 * **NOTHING HERE MAY HOLD A `readings` ARRAY AGAIN.** Two wordings of one
 * decision is how one of them quietly stops mentioning the alternative;
 * `tests/unit/stu-localisation.test.ts` scans this module's exports for the
 * shape rather than for the old export's name, so a re-mint under a new name
 * still goes red.
 */

/* ==================================================================== *
 * D11 — `OBJ-STU-LOCALE` HAS NO NUMERIC COUNTERPART.
 * ==================================================================== */

/**
 * The registered gap, handed forward rather than papered over.
 *
 * `OBJ-STU-LOCALE` is one of this module's six Objects affected (L34391) and
 * the mnemonic register carries it. The numeric register does not, and
 * `OBJ-051` "Locale pack" (L8875) is NOT it: that object is "the versioned
 * file of translated interface text for one language" — the platform-side
 * pack whose versioning and governance L34359 puts outside the tenant
 * surfaces entirely. The per-locale AUTHORED VARIANT of a Workflow's
 * worker-facing content is tenant content, is authored and reviewed in the
 * Studio, and never leaves the platform.
 *
 * **NO `OBJ-1xx` IDENTIFIER IS MINTED HERE.** D11's own ruling: minting rows
 * "would inflate a closed register of ninety-nine". The gap is registered,
 * and `tests/unit/stu-localisation.test.ts` fails if any `OBJ-1xx` appears
 * anywhere in this module.
 */
export const OBJ_STU_LOCALE_GAP = {
  mnemonic: 'OBJ-STU-LOCALE',
  numericCounterpart: null,
  namedAt: 'L34391 (MOD-STU-17 Objects affected), L31122-L31138 (the mnemonic register)',
  notThisObject: {
    id: 'OBJ-051',
    name: 'Locale pack',
    locator: 'L8875',
    why:
      'OBJ-051 is “the versioned file of translated interface text for one language” — the ' +
      'platform-side pack whose versioning and governance sit outside every tenant surface ' +
      '(L34359, L34382). OBJ-STU-LOCALE is the per-locale authored variant of a Workflow’s ' +
      'worker-facing content: tenant content, authored and reviewed in the Studio. Joining the ' +
      'two would report coverage for an object this surface does not hold.',
  },
  decision: 'D11' as StudioDecisionId,
  /**
   * The one sentence a screen renders for this gap. Deliberately says nothing
   * about pack management or pack versioning: that row of the matrix reads
   * `Not applicable` in all six columns and draws nothing at all, and a
   * sentence describing the platform-side pack's lifecycle on a Studio screen
   * would be the beginning of the surface the source does not place here.
   */
  screenNote:
    'OBJ-STU-LOCALE — the per-locale authored variant of this Workflow’s worker-facing content — ' +
    'has no counterpart in the numeric object register, and none is minted here. The gap is ' +
    'registered under D11 and carried forward rather than closed by inventing a row.',
  handOffTo:
    'Task 25 — the object-register gap list. Registered here so the gap is carried forward with ' +
    'its reason rather than closed by minting an OBJ-1xx row.',
  sourceRefs: ['L34391', 'L8875', 'L31122-L31138', 'D11'],
} as const

/* ==================================================================== *
 * THE WRITES — one path, audited before it mutates.
 * ==================================================================== */

/**
 * The three acts the matrix permits, as a discriminated union so an act
 * cannot be constructed without the fields it needs.
 */
export type LocalisationAct =
  | { readonly act: 'declare-locale-coverage'; readonly locales: readonly Locale[] }
  | {
      readonly act: 'author-locale-variant'
      readonly elementId: string
      readonly locale: Locale
      readonly state: ElementLocaleState
    }
  | { readonly act: 'request-drafting'; readonly elementId: string; readonly locale: Locale }

export type LocalisationActId = LocalisationAct['act']

export interface LocalisationAuditEntry {
  readonly act: LocalisationActId
  readonly identityId: string
  /** What was written, named. L34472 audits "variant authorship and drafting". */
  readonly detail: string
}

/** The sink, handed in. Never a module-level list. */
export type LocalisationAuditWrite = (entry: LocalisationAuditEntry) => 'committed' | 'failed'

export type LocalisationActResult =
  | {
      readonly outcome: 'applied'
      readonly workflow: LocalisedWorkflow
      readonly audited: LocalisationAuditEntry
    }
  | { readonly outcome: 'refused'; readonly reason: string }

function detailOf(act: LocalisationAct, workflow: LocalisedWorkflow): string {
  if (act.act === 'declare-locale-coverage') {
    return `${workflow.workflowId} declares ${act.locales.join(' and ')}`
  }
  const element = workflow.elements.find((e) => e.id === act.elementId)
  const name = element === undefined ? act.elementId : element.name
  return act.act === 'request-drafting'
    ? `${name}, ${act.locale} — drafted by artificial intelligence, awaiting review`
    : `${name}, ${act.locale} — ${act.state}`
}

function withState(
  workflow: LocalisedWorkflow,
  elementId: string,
  locale: Locale,
  state: ElementLocaleState,
): LocalisedWorkflow {
  return {
    ...workflow,
    elements: workflow.elements.map((element) =>
      element.id === elementId
        ? { ...element, states: { ...element.states, [locale]: state } }
        : element,
    ),
  }
}

/**
 * THE ONLY WRITE PATH IN THIS MODULE. All three acts route through it, so the
 * audit contract is demonstrated where it costs something rather than on the
 * one handler that mutates nothing.
 *
 * THE AUDIT IS WRITTEN BEFORE THE MUTATION, and a failed audit refuses the
 * act outright — `FB-STU-10` (L31454): an action that cannot be audited does
 * not happen, and there is no first fallback that permits it to proceed
 * unaudited. The workflow handed in is never mutated; a caller holding the
 * earlier one keeps exactly what it had.
 *
 * ROW 6 IS ENFORCED HERE TOO. `Locale` is closed at English and Spanish, so a
 * third locale does not type-check; this refuses one at run time as well,
 * because a declaration arriving from a register that defeated the type
 * system must not widen the platform to a language nothing is authored in.
 */
export function applyLocalisationAct(
  workflow: LocalisedWorkflow,
  act: LocalisationAct,
  identityId: string,
  writeAudit: LocalisationAuditWrite,
): LocalisationActResult {
  if (act.act === 'declare-locale-coverage') {
    const outside = act.locales.filter((locale) => !LOCALES.includes(locale))
    if (outside.length > 0) {
      return {
        outcome: 'refused',
        reason:
          `Refused: ${outside.join(', ')} is outside the platform’s two languages. Two languages ` +
          'at V1 — English and Spanish — and adding a locale beyond them is explicitly prohibited ' +
          'for every role (L34381).',
      }
    }
    if (act.locales.length === 0) {
      return {
        outcome: 'refused',
        reason:
          'Refused: a Workflow declares its locale coverage before authoring begins (L34385), and ' +
          'a Workflow declaring nothing cannot be checked for completeness against anything.',
      }
    }
  }

  if (act.act !== 'declare-locale-coverage') {
    const known = workflow.elements.some((e) => e.id === act.elementId)
    if (!known) {
      return {
        outcome: 'refused',
        reason: `Refused: ${workflow.workflowId} holds no worker-facing element “${act.elementId}”.`,
      }
    }
  }

  const audited: LocalisationAuditEntry = {
    act: act.act,
    identityId,
    detail: detailOf(act, workflow),
  }
  if (writeAudit(audited) === 'failed') {
    return {
      outcome: 'refused',
      reason:
        'Refused: the audit entry could not be written, so the change was not made. An action ' +
        'that cannot be audited does not happen (FB-STU-10, L31454).',
    }
  }

  if (act.act === 'declare-locale-coverage') {
    return { outcome: 'applied', workflow: { ...workflow, declaredLocales: act.locales }, audited }
  }
  if (act.act === 'request-drafting') {
    // AC-STU-146 (L34484): every drafted variant passes the review chain. A
    // drafted variant is NOT Complete and does NOT unblock its locale, which
    // is the whole reason the state is recorded as its own.
    return {
      outcome: 'applied',
      workflow: withState(
        workflow,
        act.elementId,
        act.locale,
        'Drafted by artificial intelligence',
      ),
      audited,
    }
  }
  return {
    outcome: 'applied',
    workflow: withState(workflow, act.elementId, act.locale, act.state),
    audited,
  }
}
