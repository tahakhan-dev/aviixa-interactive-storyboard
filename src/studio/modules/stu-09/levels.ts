import type { RoleId } from '@/domain/roles'
import { scenarioRunId, tenantId, type TenantId } from '@/domain/ids'
import { emptyDomainState, withTenant, type ScenarioDomainState } from '@/domain/state'
import { permitsAction } from '@/policy/decision'
import {
  evaluateStudioAccess,
  type IdentityLayerState,
  type StudioAccessDecision,
  type StudioIdentity,
  type StudioPersonaColumn,
} from '@/studio/access/evaluate'
import type { StudioCommercialTier, StudioGrantId, StudioGrantState } from '@/studio/access/grants'
import { DIFFICULTY_LEVELS, LOCALES, type DifficultyLevel, type Locale } from '@/studio/vocab'
import { stu09Row, type Stu09RowId } from './matrix'

/**
 * `MOD-STU-09`'s domain — three difficulty levels, two locales, six
 * renderings, and the one guarantee that makes the whole feature safe.
 *
 * THE GUARANTEE IS STRUCTURAL, NOT A VALIDATION. `FUNC-STU-09-01-C-1`
 * (L32991) and `AC-STU-088` (L33075) require required captures, gates,
 * specification limits and severity mappings to be "byte-identical across
 * all three levels", and `TEST-STU-093` (L33083) states the denial as
 * "confirm no such path exists". A runtime check comparing three copies
 * would be a path that exists and then refuses. So the enforced content
 * hangs off the SCREEN and a level carries nothing but instruction text and
 * its own review state — `LevelRendering` has no field a level-specific
 * limit could be written into, and the covering test proves that with
 * `@ts-expect-error` as well as at runtime.
 *
 * EIGHT SCREENS, NOT ONE. L32525's own illustrative example is "screens 3
 * through 10", all measurement screens on the Wheel Bolt Torque Verification
 * Workflow, and it revises "all eight screens" together. A fixture with one
 * measurement screen under-validates the coverage rule by seven, so the seed
 * below carries all eight and every coverage assertion runs across them.
 *
 * DETERMINISM. No clock and no randomness. Every register — the screens, the
 * declared locales, the audit sink — arrives as a parameter or is a frozen
 * seed; nothing is read from a module-load snapshot at call time.
 */

/* ==================================================================== *
 * THE STATES — L32981, per level per locale.
 * ==================================================================== */

export type LevelRenderingState =
  | 'Authored'
  | 'Drafted by artificial intelligence'
  | 'Edited'
  | 'Reviewed'
  | 'Published within a version'

export const LEVEL_RENDERING_STATES = [
  'Authored',
  'Drafted by artificial intelligence',
  'Edited',
  'Reviewed',
  'Published within a version',
] as const satisfies readonly LevelRenderingState[]

type MissingFromRenderingStates = Exclude<
  LevelRenderingState,
  (typeof LEVEL_RENDERING_STATES)[number]
>
const _renderingStatesExhaustive: MissingFromRenderingStates extends never ? true : never = true
void _renderingStatesExhaustive

/**
 * The two states that satisfy the coverage check. L32981: "A level that is
 * Drafted but not Reviewed blocks publication" — and `AC-STU-089` (L33076)
 * counts "six REVIEWED renderings". A published rendering passed review to
 * get published, so it counts; the other three do not.
 *
 * A `Set` built from a written list rather than a `!==` chain, so adding a
 * sixth state forces a decision here instead of silently defaulting to
 * "blocks".
 */
const REVIEWED_STATES: ReadonlySet<LevelRenderingState> = new Set<LevelRenderingState>([
  'Reviewed',
  'Published within a version',
])

export function isReviewed(state: LevelRenderingState | null): boolean {
  return state !== null && REVIEWED_STATES.has(state)
}

/* ==================================================================== *
 * THE CONTENT MODEL — where the equivalence guarantee lives.
 * ==================================================================== */

/**
 * What a level MAY carry. Instruction text and a review state, and nothing
 * else. This interface is the equivalence guarantee: there is no field here
 * a capture, a gate, a specification limit or a severity mapping could be
 * written into, so `TEST-STU-093`'s "no such path exists" is a property of
 * the type rather than of a validator somebody could forget to call.
 */
export interface LevelRendering {
  readonly instructionText: string
  readonly state: LevelRenderingState
}

/**
 * What the platform ENFORCES on a screen, identical across all three levels
 * because there is exactly one of it per screen. L32945: "the level changes
 * the depth of explanation, never the required captures, gates, limits, or
 * severity mappings, which are identical across levels."
 */
export interface EnforcedContent {
  readonly requiredCaptures: readonly string[]
  readonly gates: readonly string[]
  readonly specificationLimits: {
    readonly lower: number
    readonly upper: number
    readonly unit: string
    readonly drawingReference: string
  }
  readonly severityMappings: readonly { readonly band: string; readonly severity: number }[]
}

/**
 * The four names `AC-STU-088` uses. Exported so the covering test can assert
 * that NONE of them appears on any level rendering — an assertion over a
 * written vocabulary rather than over whatever keys happen to exist, which
 * is what stops it passing on an empty set.
 */
export const ENFORCED_CONTENT_KEYS = [
  'requiredCaptures',
  'gates',
  'specificationLimits',
  'severityMappings',
] as const satisfies readonly (keyof EnforcedContent)[]

type MissingFromEnforcedKeys = Exclude<
  keyof EnforcedContent,
  (typeof ENFORCED_CONTENT_KEYS)[number]
>
const _enforcedKeysExhaustive: MissingFromEnforcedKeys extends never ? true : never = true
void _enforcedKeysExhaustive

/**
 * One screen's instruction content. `levels` is keyed level-then-locale and
 * its leaves are `LevelRendering`; a locale absent from a level means that
 * rendering has not been authored at all, which is a different gap from one
 * authored and not reviewed and is named differently below.
 */
export interface ScreenModel {
  readonly screenId: string
  /** ONE per screen. Not one per level — that is the guarantee. */
  readonly enforced: EnforcedContent
  readonly levels: Readonly<Record<DifficultyLevel, Readonly<Partial<Record<Locale, LevelRendering>>>>>
}

/**
 * THE ONE READ of a screen's enforced content, and the reason it takes a
 * level it does not use.
 *
 * `AC-STU-088` is a claim about three things being equal. A function that
 * could not be asked the question per level would make the claim untestable;
 * a function that answered it per level would make the claim false. So it
 * takes the level, ignores it, and the covering test compares all three
 * serialisations across all eight screens. The single change that turns that
 * test red is this function reaching into the level for anything.
 */
export function enforcedFor(screen: ScreenModel, level: DifficultyLevel): EnforcedContent {
  void level
  return screen.enforced
}

/* ==================================================================== *
 * THE SEED — Bright Bikes, screens 3 through 10 (L32525).
 * ==================================================================== */

export const STU09_TENANT: TenantId = tenantId('TEN-BRIGHT-BIKES')

export const STU09_SEED_STATE: ScenarioDomainState = withTenant(
  emptyDomainState(scenarioRunId('RUN-STU-DIFFICULTY')),
  STU09_TENANT,
  (p) => ({ ...p, displayName: 'Bright Bikes', lifecycleState: 'ACTIVE', tier: 'Enterprise' }),
)

/** The declared locale set, from the surface vocabulary. Never a literal. */
export const STU09_DECLARED_LOCALES: readonly Locale[] = LOCALES

/**
 * L32525's eight bolts, in the source's own order: "Bolt A front-left on
 * screen 3, Bolt B front-right on screen 4, through to Bolt H rear-right on
 * screen 10."
 */
const BOLTS = [
  ['3', 'Bolt A front-left'],
  ['4', 'Bolt B front-right'],
  ['5', 'Bolt C mid-left'],
  ['6', 'Bolt D mid-right'],
  ['7', 'Bolt E lower-left'],
  ['8', 'Bolt F lower-right'],
  ['9', 'Bolt G rear-left'],
  ['10', 'Bolt H rear-right'],
] as const

/**
 * The one enforced bundle every one of the eight screens carries: the
 * canonical 44–47 Newton metre window on `DWG-A441` (L68168), with the two
 * severity bands L68166 names.
 */
const WHEEL_BOLT_ENFORCED: EnforcedContent = {
  requiredCaptures: ['Numeric torque reading', 'Photograph of the torque wrench display'],
  gates: ['Hard gate — the reading must be recorded before the screen advances'],
  specificationLimits: { lower: 44, upper: 47, unit: 'Newton metres', drawingReference: 'DWG-A441' },
  severityMappings: [
    { band: 'Outside 44–47 by less than 1 Newton metre', severity: 2 },
    { band: 'Outside 44–47 by 1 Newton metre or more', severity: 1 },
  ],
}

function rendering(instructionText: string, state: LevelRenderingState): LevelRendering {
  return { instructionText, state }
}

/**
 * Screen 3's own six renderings, with ONE gap: the Spanish expanded
 * rendering is drafted and not yet reviewed. The gap is deliberate and
 * singular — a fixture in which everything passes cannot show a red cell,
 * and a fixture in which everything fails cannot show a green one.
 */
function levelsFor(bolt: string, gapped: boolean): ScreenModel['levels'] {
  const simple = `Tighten ${bolt}. Type the number from the wrench.`
  const standard = `Torque ${bolt} to the value on drawing DWG-A441. Record the reading.`
  const expanded =
    `Torque ${bolt} to the value on drawing DWG-A441 and record the reading. The window matters ` +
    'because a bolt outside it can loosen in service; if the wrench slips, record the first ' +
    'reading before re-torquing.'
  return {
    simple: {
      English: rendering(simple, 'Reviewed'),
      Spanish: rendering(`Apriete ${bolt}. Escriba el número de la llave.`, 'Reviewed'),
    },
    standard: {
      English: rendering(standard, 'Reviewed'),
      Spanish: rendering(`Apriete ${bolt} al valor del plano DWG-A441. Registre la lectura.`, 'Reviewed'),
    },
    expanded: {
      English: rendering(expanded, 'Reviewed'),
      Spanish: rendering(
        `Apriete ${bolt} al valor del plano DWG-A441 y registre la lectura.`,
        gapped ? 'Drafted by artificial intelligence' : 'Reviewed',
      ),
    },
  }
}

/**
 * ALL EIGHT measurement screens (L32525), one gapped. Exported as a value a
 * caller passes in; nothing here reads it from module scope at call time.
 */
export const WHEEL_BOLT_SCREENS: readonly ScreenModel[] = BOLTS.map(([number, bolt]) => ({
  screenId: `screen ${number}`,
  enforced: WHEEL_BOLT_ENFORCED,
  levels: levelsFor(bolt, number === '3'),
}))

/** The fully covered variant — six reviewed renderings on every screen. */
export const FULLY_COVERED_SCREENS: readonly ScreenModel[] = BOLTS.map(([number, bolt]) => ({
  screenId: `screen ${number}`,
  enforced: WHEEL_BOLT_ENFORCED,
  levels: levelsFor(bolt, false),
}))

export function screenById(screens: readonly ScreenModel[], screenId: string): ScreenModel {
  const found = screens.find((s) => s.screenId === screenId)
  if (found === undefined) {
    throw new Error(`MOD-STU-09: no screen model is seeded for "${screenId}".`)
  }
  return found
}

/* ==================================================================== *
 * THE COVERAGE STRIP — six cells, and the specific gap named on each red
 * one (SB-STU-12, L33038).
 * ==================================================================== */

export interface DifficultyCell {
  readonly level: DifficultyLevel
  readonly locale: Locale
  /** `null` where no rendering exists at all — not the same as unreviewed. */
  readonly state: LevelRenderingState | null
}

/**
 * Three levels by the declared locales, in level-then-locale order. Six
 * cells for the two declared locales, and the function does not hard-code
 * six: a third declared locale produces nine, and `FUNC-STU-09-02-A-2`'s
 * "three levels by two locales" is a statement about the locale set, not
 * about the strip.
 */
export function cellsFor(
  screen: ScreenModel,
  locales: readonly Locale[] = STU09_DECLARED_LOCALES,
): readonly DifficultyCell[] {
  return DIFFICULTY_LEVELS.flatMap((level) =>
    locales.map((locale) => ({
      level,
      locale,
      state: screen.levels[level][locale]?.state ?? null,
    })),
  )
}

/**
 * The gap, in words, or `null` where the cell is green. SB-STU-12 requires
 * each red cell to name "the specific gap", so every arm of this names a
 * DIFFERENT thing; a single "not reviewed" for all four would satisfy the
 * word "named" and not the word "specific".
 *
 * The leading `<locale> <level>:` is the cell's own address and is what the
 * covering test matches on — dropping either half is the planted defect.
 */
export function gapNote(cell: DifficultyCell): string | null {
  const at = `${cell.locale} ${cell.level}`
  // Switched over ALL SIX possibilities including the two green ones, rather
  // than returning early on `isReviewed`. An early return would leave the
  // `default` arm reachable for a sixth state and typed as a `never` the
  // checker could not prove, so a new state would fall through to a runtime
  // throw instead of failing to compile.
  switch (cell.state) {
    case 'Reviewed':
    case 'Published within a version':
      return null
    case null:
      return `${at}: not authored — no rendering exists at this level in this locale.`
    case 'Authored':
      return `${at}: not reviewed — authored and not yet through the chain.`
    case 'Drafted by artificial intelligence':
      return `${at}: not reviewed — drafted by the platform’s artificial intelligence and awaiting your edit.`
    case 'Edited':
      return `${at}: not reviewed — edited and not yet through the chain.`
    default: {
      const exhaustive: never = cell.state
      throw new Error(`MOD-STU-09: unhandled rendering state ${JSON.stringify(exhaustive)}.`)
    }
  }
}

/**
 * EVERY GAP ACROSS EVERY SCREEN, listed by SCREEN, LEVEL AND LOCALE — the
 * three things "Recovery and reconciliation" (L33069) requires: "any gap is
 * listed by screen, level, and locale."
 *
 * This is the element set `MOD-STU-09` contributes to the publish-time
 * completeness check. It does NOT register that check — see
 * `COMPLETENESS_CHECK_OWNERSHIP` below, which states why.
 */
export function coverageGapElements(
  screens: readonly ScreenModel[],
  locales: readonly Locale[] = STU09_DECLARED_LOCALES,
): readonly string[] {
  return screens.flatMap((screen) =>
    cellsFor(screen, locales).flatMap((cell) => {
      const note = gapNote(cell)
      return note === null ? [] : [`${screen.screenId} — ${note}`]
    }),
  )
}

/**
 * THE DECLARED NON-OWNERSHIP, pinned rather than worked around.
 *
 * The task brief instructs this module to "register with Task 5 as part of
 * check #6's element set". It cannot, and the source agrees with the
 * registry rather than with the brief: `PUBLISH_CHECKS`'s
 * `locale-completeness` row names `MOD-STU-17` as its only owner, and
 * `MOD-STU-09`'s own Interconnections line (L33054) reads "covered by
 * `MOD-STU-17`'s completeness check". C4 is that no check is implemented
 * twice, so `MOD-STU-09` supplies the ELEMENTS and `MOD-STU-17` runs the
 * check over them.
 *
 * The absence is declared here and asserted by a test that goes RED the day
 * `MOD-STU-09` is added to that row's `ownerModules` — the same shape slice
 * 4's two unregistered dependencies used, one of which pinned "the registry
 * lacks this row" and went red when the row landed.
 */
export const COMPLETENESS_CHECK_OWNERSHIP = {
  checkId: 'locale-completeness',
  ownedBy: 'MOD-STU-17',
  suppliedBy: 'MOD-STU-09',
  note:
    'MOD-STU-09 supplies the per-screen, per-level, per-locale element set and does not implement ' +
    'the check. Registering it would be refused `not-an-owner` by `registerPublishChecks`, which ' +
    'is the honest answer and not a workaround: L33054 states the coverage is MOD-STU-17’s.',
  sourceRef: 'L33054, AC-STU-089 L33076, PUBLISH_CHECKS locale-completeness',
} as const

/* ==================================================================== *
 * THE UNSET PROFILE FIELD — a defined default, never an absence.
 * ==================================================================== */

export interface WorkerRendering {
  readonly level: DifficultyLevel
  /** True where the profile field was unset and the default was applied. */
  readonly isDefault: boolean
  readonly note: string
}

/**
 * L33011 and L32998: "Where a worker's profile field is unset, the standard
 * level is rendered as the defined default" — "a defined default rather than
 * an absence". The word "default" is in the returned note deliberately: an
 * empty state here would be the absence the source refuses.
 *
 * The profile field itself is `MOD-DOH-04` master data and reaches this
 * module as an ADDITIVE FIXTURE FIELD, never a new module — hence the
 * parameter, and hence no writer anywhere in this file.
 */
export function renderingForWorker(profileLevel: DifficultyLevel | null): WorkerRendering {
  if (profileLevel === null) {
    return {
      level: 'standard',
      isDefault: true,
      note:
        'This worker’s profile difficulty field is unset, so the standard level is rendered as ' +
        'the defined default. This is a defined default rather than an absence: nothing is ' +
        'missing and no screen is blank.',
    }
  }
  return {
    level: profileLevel,
    isDefault: false,
    note: `This worker’s profile difficulty field selects the ${profileLevel} level.`,
  }
}

/* ==================================================================== *
 * PERSONA → IDENTITY, and the per-control affordance.
 * ==================================================================== */

export interface SeededDifficultyIdentity {
  readonly identity: StudioIdentity
  readonly grants: Readonly<Partial<Record<StudioGrantId, StudioGrantState>>>
}

function seeded(
  identityId: string,
  roles: readonly RoleId[],
  grants: Readonly<Partial<Record<StudioGrantId, StudioGrantState>>> = {},
): SeededDifficultyIdentity {
  return { identity: { identityId, roles, signedIn: true, tenant: STU09_TENANT }, grants }
}

const PERSONA_IDENTITIES: Readonly<Record<StudioPersonaColumn, SeededDifficultyIdentity>> = {
  'quality-manager': seeded('IDN-STU09-QM', ['QUALITY_MANAGER']),
  'supervisor-with-authoring-grant': seeded('IDN-STU09-SUP-GRANT', ['SUPERVISOR'], {
    'GRANT-STU-AUTHOR': 'Active',
  }),
  'supervisor-without-grant': seeded('IDN-STU09-SUP', ['SUPERVISOR']),
  // DEC-ROLE-001 (L34522): delivered by a Supervisor role without the grant.
  'plant-manager-persona': seeded('IDN-STU09-PLANT', ['SUPERVISOR']),
  'tenant-admin': seeded('IDN-STU09-ADMIN', ['TENANT_ADMIN']),
  'read-only-auditor': seeded('IDN-STU09-AUD', ['READONLY_AUDITOR']),
  worker: seeded('IDN-STU09-WKR', ['WORKER']),
  // L34584: the capacity is a GRANT on whatever tenant role the person
  // holds, never a sixth role.
  'implementation-team': seeded('IDN-STU09-IMPL', ['SUPERVISOR'], { 'GRANT-STU-IMPL': 'Active' }),
}

export function difficultyPersonaIdentity(persona: StudioPersonaColumn): SeededDifficultyIdentity {
  return PERSONA_IDENTITIES[persona]
}

export interface DifficultyContext {
  /** The register, passed in. Never a module-load snapshot. */
  readonly state: ScenarioDomainState
  readonly identityLayer: IdentityLayerState
  readonly online: boolean
  readonly commercialTier?: StudioCommercialTier
  /** Stage occupancy on THIS submission, by identity. `null` = unoccupied. */
  readonly authorOfRecord?: string | null
  readonly reviewerOfRecord?: string | null
  readonly releaseAuthorityOfRecord?: string | null
}

export const STU09_DEFAULT_CONTEXT: DifficultyContext = {
  state: STU09_SEED_STATE,
  identityLayer: 'reachable',
  online: true,
}

/** Per-control affordances come from HERE, never from a module-level role list. */
export function difficultyDecision(
  rowId: Stu09RowId,
  persona: StudioPersonaColumn,
  ctx: DifficultyContext,
): StudioAccessDecision {
  const who = difficultyPersonaIdentity(persona)
  return evaluateStudioAccess({
    row: stu09Row(rowId),
    identity: who.identity,
    grants: who.grants,
    commercialTier: ctx.commercialTier ?? 'Enterprise',
    identityLayer: ctx.identityLayer,
    state: ctx.state,
    online: ctx.online,
    authorOfRecord: ctx.authorOfRecord ?? null,
    reviewerOfRecord: ctx.reviewerOfRecord ?? null,
    releaseAuthorityOfRecord: ctx.releaseAuthorityOfRecord ?? null,
  })
}

export type DifficultyControlRendering =
  /**
   * `Explicitly prohibited` carries NO rendering anywhere in the frozen
   * source, so this build rules it ABSENT — with an explanatory line where
   * the control would sit, never blank space.
   */
  | { readonly kind: 'absent'; readonly note: string }
  /** DISABLED with a named, fixable reason: holds it generally, refused now. */
  | {
      readonly kind: 'disabled'
      readonly label: string
      readonly reason: string
      readonly openDecision: string | null
    }
  | { readonly kind: 'enabled'; readonly label: string }

/**
 * THE ONE FOLD. Every rendering of every difficulty control comes through
 * here, so a branch cannot be fixed on one control and left wrong on
 * another.
 */
export function difficultyAffordance(
  rowId: Stu09RowId,
  persona: StudioPersonaColumn,
  ctx: DifficultyContext,
  label: string,
): DifficultyControlRendering {
  const decision = difficultyDecision(rowId, persona, ctx)
  const cell = stu09Row(rowId).cells[persona]

  if (decision.outcome === 'explicitlyProhibited') {
    return {
      kind: 'absent',
      note:
        `${decision.reason} No control for this act is drawn here, because the act does not ` +
        'exist on this surface for this view.',
    }
  }
  if (decision.outcome === 'readOnly') {
    return {
      kind: 'absent',
      note: `${decision.reason} Reading needs no control: the rendering itself is the content.`,
    }
  }
  if (permitsAction(decision.decision)) {
    return { kind: 'enabled', label }
  }
  return {
    kind: 'disabled',
    label,
    reason: `${decision.reason} Nothing here is queued for later — the Studio queues no write in any state.`,
    openDecision: cell.openDecision,
  }
}

/* ==================================================================== *
 * THE WRITE PATH, AND ITS AUDIT.
 * ==================================================================== */

/**
 * L33063: "Which level was authored, which were drafted, who edited each,
 * and the review outcome for each rendering are recorded and appear in the
 * screen-level diff." Identity and action, never "acting as role" (L34657).
 */
export interface DifficultyAuditEntry {
  readonly actorIdentityId: string
  readonly action: 'author' | 'edit-drafted-level'
  readonly screenId: string
  readonly level: DifficultyLevel
  readonly locale: Locale
  readonly tenant: TenantId
  readonly sourceRefs: readonly string[]
}

export type DifficultyAuditWrite = (
  entry: DifficultyAuditEntry,
) => { readonly ok: true } | { readonly ok: false; readonly reason: string }

export interface EditLevelInput {
  readonly screens: readonly ScreenModel[]
  readonly screenId: string
  readonly persona: StudioPersonaColumn
  readonly level: DifficultyLevel
  readonly locale: Locale
  readonly instructionText: string
  readonly ctx?: DifficultyContext
  readonly writeAudit: DifficultyAuditWrite
}

export interface EditLevelResult {
  readonly ok: boolean
  /** The NEW screen set on success; the ORIGINAL, untouched, on every refusal. */
  readonly screens: readonly ScreenModel[]
  readonly message: string
}

const EDIT_SOURCE_REFS = ['L32966', 'L33063', 'L34657', 'FB-STU-10 L31454'] as const

/**
 * Edit a drafted level's instruction text.
 *
 * THE ORDER IS THE CONTRACT, and it is the same order `MOD-STU-18`'s grant
 * administration uses:
 *
 *   1. This function's own DOMAIN REFUSALS. A refused action is not an
 *      action, so the audit sink is not called at all.
 *   2. The AUDIT APPEND, before the mutation.
 *   3. The MUTATION, and only if the append succeeded — `FB-STU-10`
 *      (L31454): "Action does not happen; state unchanged."
 *
 * The mutation is OBSERVABLE: the rendering's text changes and its state
 * moves to `Edited`. The covering test runs the same call twice, once with
 * the sink accepting and once with it failing, and asserts the text changed
 * in the first case and did not in the second — so the contract is
 * demonstrated where it costs something.
 */
export function editDifficultyLevel(input: EditLevelInput): EditLevelResult {
  const { screens, screenId, persona, level, locale, instructionText, writeAudit } = input
  const ctx = input.ctx ?? STU09_DEFAULT_CONTEXT
  const refuse = (message: string): EditLevelResult => ({ ok: false, screens, message })

  /* ---- 1. DOMAIN REFUSALS. The audit sink is not reached by any of these. */

  const decision = difficultyDecision('edit-a-drafted-level-before-submission', persona, ctx)
  if (!permitsAction(decision.decision)) {
    return refuse(
      `Refused before anything was written: ${decision.reason} No instruction text was changed, ` +
        'and no audit entry was appended, because a refused action is not an action.',
    )
  }

  const screen = screens.find((s) => s.screenId === screenId)
  if (screen === undefined) {
    return refuse(
      `No screen named ${screenId} is in this Workflow, so nothing was written. A rendering is ` +
        'never created against a screen the draft does not hold.',
    )
  }

  const existing = screen.levels[level][locale]
  if (existing === undefined) {
    return refuse(
      `${locale} ${level} has no rendering on ${screenId}, so there is nothing to edit. An ` +
        'unauthored rendering is not the same thing as a drafted one, and reporting it as edited ' +
        'would be a false claim about what happened.',
    )
  }
  if (isReviewed(existing.state)) {
    return refuse(
      `${locale} ${level} on ${screenId} is ${existing.state}. Editing it here would put reviewed ` +
        'content back into the draft without the chain seeing it; a change to reviewed content ' +
        'republishes through the normal versioning discipline (L32947). Nothing was written.',
    )
  }
  if (instructionText.trim() === '') {
    return refuse(
      `An empty instruction text would leave ${locale} ${level} on ${screenId} blank on the floor. ` +
        'Nothing was written.',
    )
  }

  /* ---- 2. THE AUDIT APPEND, before the mutation and after the refusals. */

  const audit = writeAudit({
    actorIdentityId: difficultyPersonaIdentity(persona).identity.identityId,
    action: 'edit-drafted-level',
    screenId,
    level,
    locale,
    tenant: STU09_TENANT,
    sourceRefs: EDIT_SOURCE_REFS,
  })
  if (!audit.ok) {
    return refuse(
      `The audit write failed, so the action did not happen: ${audit.reason}. ${locale} ${level} ` +
        `on ${screenId} is unchanged, nothing is left half-applied, and nothing was queued for ` +
        'later — audit commits in the same transaction as the action, so a failed audit fails ' +
        'the action with it.',
    )
  }

  /* ---- 3. THE MUTATION. */

  const updated = screens.map((s) =>
    s.screenId === screenId
      ? {
          ...s,
          levels: {
            ...s.levels,
            [level]: { ...s.levels[level], [locale]: { instructionText, state: 'Edited' as const } },
          },
        }
      : s,
  )
  return {
    ok: true,
    screens: updated,
    message:
      `Edited ${locale} ${level} on ${screenId}, with its audit entry in the same transaction, ` +
      'recorded against identity and action rather than “acting as role” (L34657). The rendering ' +
      'is Edited and still has to pass the full review chain before publication.',
  }
}
