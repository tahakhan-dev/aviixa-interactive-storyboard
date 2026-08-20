import type { PublishCheckImplementation, PublishCheckVerdict } from '@/studio/publish/register'
import { claimsAdoption } from '@/studio/state/adoption'
import { DIFFICULTY_LEVELS, LOCALES, type DifficultyLevel, type Locale } from '@/studio/vocab'

/**
 * `MOD-STU-06` — Shared Instruction Blocks. The domain, its readers, and the
 * one publish-check element this module owns.
 *
 * ### R11 — THE NATURAL DATA MODEL FOR THIS FEATURE IS A LIBRARY, AND THAT
 * ### IS THE DEFECT
 *
 * "Author once, apply to eight screens" describes a library item exactly.
 * The source says so itself and names the trap in the same breath (L32443):
 * *"That scoping rule is the module's defining constraint and is easy to get
 * wrong in implementation. A block is not a library item. It has no
 * cross-Workflow reuse, no independent version number, and no separate
 * governance: it lives inside its Workflow and is published, diffed, and
 * archived with it."* L32441: *"Blocks are scoped to a single Workflow and do
 * not appear in the Content Libraries."*
 *
 * So `BlockRegister` is **keyed by Workflow**. Not a flat block table with a
 * `workflowId` column that every read must remember to filter on — keyed, so
 * that a cross-Workflow read has nowhere to come from. `blocksVisibleIn`
 * cannot return another Workflow's block because it has no expression that
 * reaches one: it indexes the map and reads that scope's own array.
 *
 * The difference is not stylistic. A flat table makes the correct behaviour
 * a filter somebody applies; the keyed map makes the incorrect behaviour
 * unwritable. Compare `MOD-STU-07`, where a `LibraryRegister` IS flat —
 * correctly, because a library item is reachable from every Workflow, which
 * is the property a block must not have.
 *
 * ### WHAT THIS MODULE IS NOT HANDED
 *
 * No run register, no version register, no package. `MOD-STU-12`'s `publish`
 * protects in-flight work by omission — it has no code that could change a
 * pin — and this module takes the same shape one step earlier: a block edit
 * cannot propagate to a pinned package here because nothing in this file can
 * name one. L32500: *"no propagation occurs to a pinned package."*
 *
 * DETERMINISM: no clock, no counter, no random source. Every identifier is
 * derived from the record it belongs to.
 */

/* ==================================================================== *
 * THE THREE STATES — L32473.
 * ==================================================================== */

export type BlockState = 'Draft' | 'Applied to one or more screens' | 'Published within a version'

export const BLOCK_STATES = [
  'Draft',
  'Applied to one or more screens',
  'Published within a version',
] as const satisfies readonly BlockState[]

type MissingFromStates = Exclude<BlockState, (typeof BLOCK_STATES)[number]>
const _statesExhaustive: MissingFromStates extends never ? true : never = true
void _statesExhaustive

/* ==================================================================== *
 * THE TWO FROZEN NOTICES.
 * ==================================================================== */

/** `SB-STU-09`'s prominent line, verbatim (L32523). */
export const SCOPE_NOTICE =
  'Blocks belong to this Workflow only. They are not Content Library items and cannot be used in another Workflow.'

/**
 * The propagation sentence, assembled from L32480 and L32500 and rendered
 * wherever a block edit is offered. `AC-STU-070` (L32562) binds the negative
 * half of it: *"no view suggests live propagation to a pinned package."*
 */
export const PROPAGATION_NOTICE =
  'A block edit changes worker-facing instruction content, so it is a content change requiring ' +
  'republication. The change lands in a new draft and reaches the floor only through a new ' +
  'published version and its adoption; no propagation occurs to a pinned package, and a Run ' +
  'already under way finishes on the version it started (L32480, L32500, AC-STU-070).'

/**
 * The phrases a view on this module may never use of the floor.
 *
 * Two sources, one function, so a fix reaches both callers. `claimsAdoption`
 * already holds the surface-wide list ('live', 'in force', 'adopted', …) and
 * is consumed rather than copied; the patterns below are the ones
 * `AC-STU-070` adds and that list does not cover.
 *
 * IT IS PROVEN CAPABLE OF FIRING. A negative assertion over a predicate that
 * can never return `true` is this build's ninth defect shape, so the covering
 * test asserts a positive case for each pattern before asserting the
 * absences.
 */
const LIVE_PROPAGATION_CLAIMS: readonly RegExp[] = [
  /takes effect (?:immediately|now|straight away)/i,
  /(?:propagat\w+|updates?|changes?|appears?) (?:immediately|instantly|live|at once)/i,
  /\b(?:live|immediately|instantly) on (?:the floor|the device|devices)\b/i,
  /updates? live\b/i,
]

export function suggestsLivePropagation(text: string): boolean {
  return LIVE_PROPAGATION_CLAIMS.some((pattern) => pattern.test(text)) || claimsAdoption(text)
}

/* ==================================================================== *
 * THE RECORDS.
 * ==================================================================== */

/**
 * One authored rendering. `OBJ-039` (L8653): *"title; shared content
 * including text and images; the set of screens applying it."* Content is
 * per LOCALE and per DIFFICULTY LEVEL, because the block is instruction
 * content and `MOD-STU-09`'s difficulty model and the Workflow's declared
 * locales both apply to it (L32517).
 */
export interface BlockContent {
  readonly locale: Locale
  readonly level: DifficultyLevel
  readonly text: string
}

export interface InstructionBlock {
  /** Derived from the Workflow and the title. Deterministic, no counter. */
  readonly id: string
  /**
   * R11. Carried on the record as well as being the register's key — the key
   * makes a cross-Workflow read unreachable; the field makes the scope
   * readable from the block a caller already holds, so nothing has to infer
   * it from a variable name.
   */
  readonly workflowId: string
  readonly title: string
  readonly content: readonly BlockContent[]
  /** The set of screens applying it. Screens of THIS Workflow, only. */
  readonly appliesToScreenIds: readonly string[]
  /**
   * The version this block was published within, or `null` in Draft. A block
   * has **no independent version number** (L32443): this names the
   * Workflow version it travelled inside.
   */
  readonly publishedInVersion: string | null
}

/** A screen of this Workflow, with its own screen-specific note. */
export interface BlockScreen {
  readonly id: string
  readonly name: string
  /** Section 1's second half. Survives a block removal intact (L32489). */
  readonly note: string
}

/**
 * ONE WORKFLOW'S BLOCKS. There is no shape in this module that holds two
 * Workflows' blocks in one list.
 */
export interface WorkflowBlockScope {
  readonly workflowId: string
  readonly workflowName: string
  readonly lifecycle: 'Draft' | 'Published'
  readonly blocks: readonly InstructionBlock[]
  readonly screens: readonly BlockScreen[]
  /** The Workflow's declared locale coverage — this module's dependency. */
  readonly declaredLocales: readonly Locale[]
}

/** Keyed by Workflow. This IS the scoping rule (R11). */
export type BlockRegister = Readonly<Record<string, WorkflowBlockScope>>

/* ==================================================================== *
 * READERS. Every one takes its register or scope as a parameter.
 * ==================================================================== */

export function scopeOf(register: BlockRegister, workflowId: string): WorkflowBlockScope | undefined {
  return register[workflowId]
}

/**
 * Every block this Workflow can see — which is every block it HAS, because
 * there is nowhere else for one to come from.
 */
export function blocksVisibleIn(
  register: BlockRegister,
  workflowId: string,
): readonly InstructionBlock[] {
  return register[workflowId]?.blocks ?? []
}

export function blockIn(
  register: BlockRegister,
  workflowId: string,
  blockId: string,
): InstructionBlock | undefined {
  return blocksVisibleIn(register, workflowId).find((block) => block.id === blockId)
}

export function screenIn(scope: WorkflowBlockScope, screenId: string): BlockScreen | undefined {
  return scope.screens.find((screen) => screen.id === screenId)
}

/** The applying screens, as SCREENS — so a caller that must name them can. */
export function applyingScreens(
  scope: WorkflowBlockScope,
  blockId: string,
): readonly BlockScreen[] {
  const block = scope.blocks.find((b) => b.id === blockId)
  if (block === undefined) return []
  return block.appliesToScreenIds.flatMap((id) => {
    const screen = screenIn(scope, id)
    return screen === undefined ? [] : [screen]
  })
}

/** Every block applying to one screen, in the scope's own order. */
export function blocksOnScreen(
  scope: WorkflowBlockScope,
  screenId: string,
): readonly InstructionBlock[] {
  return scope.blocks.filter((block) => block.appliesToScreenIds.includes(screenId))
}

export function blockState(block: InstructionBlock): BlockState {
  if (block.publishedInVersion !== null) return 'Published within a version'
  if (block.appliesToScreenIds.length > 0) return 'Applied to one or more screens'
  return 'Draft'
}

export function blockText(
  block: InstructionBlock,
  locale: Locale,
  level: DifficultyLevel,
): string | null {
  return block.content.find((c) => c.locale === locale && c.level === level)?.text ?? null
}

/**
 * `AC-STU-068` (L32560) — Section 1 renders BLOCK CONTENT FIRST and the
 * screen-specific note SECOND, on every applying screen and in every locale
 * and difficulty level.
 *
 * A block with no authored rendering for this locale and level does NOT
 * vanish from the composition. It renders a stated gap, because a silently
 * shorter Section 1 is exactly the blank safety advisory
 * `FUNC-STU-06-03-A-1` (L32493) exists to prevent, and publish check 6 is
 * what refuses the publication.
 */
export function composeSection1(
  scope: WorkflowBlockScope,
  screenId: string,
  locale: Locale,
  level: DifficultyLevel,
): readonly string[] {
  const screen = screenIn(scope, screenId)
  if (screen === undefined) return []
  const blocks = blocksOnScreen(scope, screenId).map((block) => {
    const text = blockText(block, locale, level)
    return text === null
      ? `“${block.title}” has no ${locale} ${level} rendering authored, so this Workflow cannot publish in ${locale} until it does.`
      : text
  })
  return [...blocks, screen.note]
}

export interface CoverageState {
  readonly complete: boolean
  /** Every missing locale and level pair, named. Never a bare count. */
  readonly missing: readonly string[]
}

/**
 * `FUNC-STU-06-03-A-1` (L32493) — block content is included in the
 * publish-time locale-completeness check, *"since a block is worker-facing
 * Workflow content"*.
 */
export function coverageState(
  block: InstructionBlock,
  declaredLocales: readonly Locale[],
): CoverageState {
  const missing: string[] = []
  for (const locale of declaredLocales) {
    for (const level of DIFFICULTY_LEVELS) {
      if (blockText(block, locale, level) === null) missing.push(`${locale} · ${level}`)
    }
  }
  return { complete: missing.length === 0, missing }
}

/**
 * L32473 — *"A block with no applying screens is Draft and orphaned."* A
 * block published within a version is excluded: it reached the floor, so it
 * is not unused work.
 */
export function unusedBlocks(scope: WorkflowBlockScope): readonly InstructionBlock[] {
  return scope.blocks.filter((block) => blockState(block) === 'Draft')
}

export interface SubmissionReport {
  /**
   * ALWAYS `false`, and it is a field rather than an omission. L32473 —
   * an orphaned block is *"reported as an unused block at submission rather
   * than blocking it"*, and L32502 repeats it: *"submission proceeds with an
   * unused-block report rather than a block."* Reported is not blocking, and
   * a reader of this type should not have to infer that from silence.
   */
  readonly blocksSubmission: false
  readonly unusedBlockTitles: readonly string[]
  readonly message: string
}

export function submissionReport(scope: WorkflowBlockScope): SubmissionReport {
  const unused = unusedBlocks(scope)
  const titles = unused.map((block) => block.title)
  return {
    blocksSubmission: false,
    unusedBlockTitles: titles,
    message:
      titles.length === 0
        ? 'Every block in this Workflow applies to at least one screen. Nothing to report.'
        : `${titles.length} unused block${titles.length === 1 ? '' : 's'} in this Workflow — ` +
          `${titles.map((t) => `“${t}”`).join(', ')} — ${titles.length === 1 ? 'applies' : 'apply'} ` +
          'to no screen. This is reported at submission and does not block it (L32473).',
  }
}

/**
 * `AC-STU-069` (L32561) — *"A block cannot be deleted while screens apply it;
 * the applying screens are NAMED."* `SB-STU-09` (L32523) puts the same rule
 * on the control: *"A delete control is disabled while applying screens
 * exist, with those screens named."*
 *
 * NAMED, NOT COUNTED. "8 screens still apply this block" tells an author
 * nothing they can act on; the eight names tell them where to go.
 *
 * The published clause reconciles two source statements rather than picking
 * one. `OBJ-039` (L8651) states the block is *"archived with the workflow;
 * no deletion"*, while §5.6 gives the editor a delete control. Both are true
 * if the control governs a DRAFT block and `OBJ-039` governs one already
 * published within a version — which is also the only reading under which a
 * pinned package keeps resolving.
 *
 * FIX ONCE, WHERE ALL CALLERS ROUTE. `deleteBlock` and the view's delete
 * control both call this; neither carries a second copy of the rule. Two
 * call sites before this function existed, two after.
 */
export function deleteRefusal(scope: WorkflowBlockScope, blockId: string): string | null {
  const block = scope.blocks.find((b) => b.id === blockId)
  if (block === undefined) {
    return `No block “${blockId}” exists in ${scope.workflowName}, so there is nothing to delete.`
  }
  const applying = applyingScreens(scope, blockId)
  if (applying.length > 0) {
    return (
      `“${block.title}” cannot be deleted while screens apply it. These screens apply it: ` +
      `${applying.map((screen) => screen.name).join(', ')}. Remove the block from each of them ` +
      'first; removing it leaves each screen’s own note intact (AC-STU-069, L32561).'
    )
  }
  if (block.publishedInVersion !== null) {
    return (
      `“${block.title}” is published within a version (${block.publishedInVersion}) and is ` +
      'archived with its Workflow rather than deleted, so the pinned packages carrying it keep ' +
      'resolving (OBJ-039, L8651).'
    )
  }
  return null
}

/* ==================================================================== *
 * PUBLISH CHECK 7 — THE BLOCK-REFERENCE ELEMENT.
 * ==================================================================== */

export interface BlockPublishSubject {
  readonly scope: WorkflowBlockScope
}

/**
 * `MOD-STU-06`'s registration into publish check 7, `library-pointer`, whose
 * `ownerModules` names this module alongside `MOD-STU-07` and `MOD-STU-10`.
 * This module registers the BLOCK-REFERENCE element and nothing else; the
 * asset and part halves belong to its two co-owners (C4).
 *
 * `FUNC-STU-06-02-A-1` (L32483): *"an unresolvable block reference blocks
 * publication rather than rendering an empty section."* The blocking element
 * names the SCREEN and the BLOCK TITLE, which is what check 7's own
 * `namesElement` asks for.
 *
 * A SCOPE WITH NO BLOCKS PASSES, and the covering test asserts both halves —
 * that an empty scope passes AND that one dangling reference blocks —
 * because the first assertion alone is satisfied by a check that can only
 * ever pass.
 */
export const blockReferencePublishCheck: PublishCheckImplementation<BlockPublishSubject> = {
  checkId: 'library-pointer',
  implementedBy: 'MOD-STU-06',
  run: ({ scope }): PublishCheckVerdict => {
    // An application lives on the BLOCK, so deleting a block takes its
    // applications with it and a screen can never point at a block that has
    // gone. The reference that CAN dangle is the other direction: a block
    // still applying to a screen the canvas no longer holds, which would
    // package a composition for a screen that never ships.
    const unresolvable = scope.blocks.flatMap((block) =>
      block.appliesToScreenIds.flatMap((screenId) =>
        screenIn(scope, screenId) === undefined
          ? [
              `${screenId} — shared instruction block “${block.title}” applies to a screen this ` +
                'Workflow no longer holds',
            ]
          : [],
      ),
    )
    if (unresolvable.length === 0) return { outcome: 'passed' }
    return { outcome: 'blocked', blockingElement: unresolvable.join('; ') }
  },
}

/* ==================================================================== *
 * THE SEED — Bright Bikes, the source's own illustrative Workflow
 * (L32525): screens 3 through 10 of Wheel Bolt Torque Verification.
 * ==================================================================== */

export const WF_TORQUE = 'WF-BB-TORQUE'
export const WF_INSPECTION = 'WF-BB-INSPECTION'

const BOLTS = [
  'A front-left',
  'B front-right',
  'C mid-left',
  'D mid-right',
  'E rear-left',
  'F rear-right',
  'G spare-left',
  'H rear-right',
] as const

export const BOLT_SCREEN_IDS: readonly string[] = BOLTS.map((_, i) => `SCR-TORQUE-${i + 3 < 10 ? `0${i + 3}` : i + 3}`)

const TORQUE_TEXT: Readonly<Record<Locale, Readonly<Record<DifficultyLevel, string>>>> = {
  English: {
    simple: 'Torque the bolts in the star sequence. Wear eye protection.',
    standard:
      'Torque each bolt to 45 Nm in the star sequence shown, using the calibrated wrench. Wear eye protection and confirm the calibration sticker is in date.',
    expanded:
      'Torque each bolt to 45 Nm in the star sequence shown, in two passes at 25 Nm and 45 Nm, using the calibrated wrench recorded against this cell. Wear eye protection, confirm the calibration sticker is in date, and re-check the seating of the wheel before the second pass.',
  },
  Spanish: {
    simple: 'Aplique el torque a los pernos en secuencia de estrella. Use protección ocular.',
    standard:
      'Aplique un torque de 45 Nm a cada perno en la secuencia de estrella indicada, con la llave calibrada. Use protección ocular y confirme que la etiqueta de calibración esté vigente.',
    expanded:
      'Aplique un torque de 45 Nm a cada perno en la secuencia de estrella indicada, en dos pasadas de 25 Nm y 45 Nm, con la llave calibrada registrada para esta celda. Use protección ocular, confirme que la etiqueta de calibración esté vigente y vuelva a verificar el asiento de la rueda antes de la segunda pasada.',
  },
}

function fullContent(): readonly BlockContent[] {
  return LOCALES.flatMap((locale) =>
    DIFFICULTY_LEVELS.map((level) => ({ locale, level, text: TORQUE_TEXT[locale][level] })),
  )
}

const TORQUE_SCOPE: WorkflowBlockScope = {
  workflowId: WF_TORQUE,
  workflowName: 'Assembly — Wheel Bolt Torque Verification',
  lifecycle: 'Published',
  declaredLocales: LOCALES,
  screens: [
    ...BOLTS.map((bolt, index) => ({
      id: `SCR-TORQUE-${index + 3 < 10 ? `0${index + 3}` : index + 3}`,
      name: `Screen ${index + 3} — Bolt ${bolt}`,
      note: `Bolt ${bolt}`,
    })),
    { id: 'SCR-TORQUE-11', name: 'Screen 11 — Preparation', note: 'Preparation' },
  ],
  blocks: [
    {
      id: 'BLK-WF-BB-TORQUE-bolt-torque-procedure',
      workflowId: WF_TORQUE,
      title: 'Bolt Torque Procedure',
      content: fullContent(),
      appliesToScreenIds: BOLT_SCREEN_IDS,
      publishedInVersion: 'v2.1.0',
    },
    {
      id: 'BLK-WF-BB-TORQUE-retired-hoist-advisory',
      workflowId: WF_TORQUE,
      title: 'Retired hoist advisory',
      content: [
        {
          locale: 'English',
          level: 'standard',
          text: 'The overhead hoist on this cell was retired; use the floor jack.',
        },
      ],
      appliesToScreenIds: [],
      publishedInVersion: null,
    },
  ],
}

const INSPECTION_SCOPE: WorkflowBlockScope = {
  workflowId: WF_INSPECTION,
  workflowName: 'Assembly — Final Inspection',
  lifecycle: 'Draft',
  declaredLocales: LOCALES,
  screens: [{ id: 'SCR-INSPECT-01', name: 'Screen 1 — Frame inspection', note: 'Frame weld seam' }],
  blocks: [],
}

/**
 * TWO Workflows, and the second one exists for exactly one reason: a gate
 * that attempts a genuine cross-Workflow reference needs a real second
 * Workflow to attempt it against. A refusal proven only against a Workflow
 * id nothing holds is a refusal proven against a typo.
 */
export const SEEDED_BLOCK_REGISTER: BlockRegister = {
  [WF_TORQUE]: TORQUE_SCOPE,
  [WF_INSPECTION]: INSPECTION_SCOPE,
}
