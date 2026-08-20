import type { TenantId } from '@/domain/ids'
import { permitsAction } from '@/policy/decision'
import {
  evaluateStudioAccess,
  type StudioAccessDecision,
  type StudioPersonaColumn,
} from '@/studio/access/evaluate'
import { WHEEL_BOLT_DRAFT_CONTENT } from '@/studio/journey/fixture'
import {
  sectionRendering,
  type AtomicCapabilityRow,
} from '@/studio/modules/stu-01/capabilities'
import {
  isInForce,
  itemById,
  SLOT_LIBRARY,
  type LibraryRegister,
  type PointerSlot,
} from '@/studio/modules/stu-07/libraries'
import { setScreenPointer, type LibraryAuditWrite } from '@/studio/modules/stu-07/writes'
import {
  SEEDED_SCENARIO,
  SEEDED_STATE,
  SEEDED_TENANT,
  studioGrantsFor,
  studioIdentityFor,
  type Stu18Scenario,
} from '@/studio/modules/stu-18/rendering'
import type { PublishCheckImplementation, PublishCheckVerdict } from '@/studio/publish/register'
import {
  CAPTURE_TYPES,
  LOCALES,
  type CaptureType,
  type ConfigurationSection,
  type Locale,
} from '@/studio/vocab'
import { stu05Row, type Stu05RowId } from './matrix'

/**
 * `MOD-STU-05` — the nine configuration sections, as DATA and as DOMAIN.
 *
 * ### THE ATOMIC-UNIT RULE (L32201), which shapes the whole model
 *
 * "A screen is the atomic unit of authoring and execution … **There is no
 * intermediate sub-screen construct**." So there is one record per screen and
 * no container between a Workflow and a screen; instruction content is
 * EMBEDDED per screen, and `MOD-STU-09`'s difficulty levels are renderings of
 * that embedded content rather than separate documents.
 *
 * ### DERIVE ONCE, FEED EVERY BRANCH
 *
 * Nine sections is nine chances for a state fold applied to one render branch
 * while three others read the raw value. `sectionStates` is therefore the ONE
 * place a section's visibility and completion are decided, it answers ALL
 * NINE every time, and the panel, the footer, the blocking list and the
 * announcement all read the array it returns. `ConfigurationPanel` cannot
 * even ask the question — it is handed the answers.
 *
 * ### EIGHT MEASUREMENT SCREENS, NOT ONE
 *
 * L32525's screens 3 through 10 are all measurement screens sharing one
 * block. Every walk in this file runs the full eight; a module that validated
 * the first would under-validate by seven.
 *
 * ### EVERY WRITE THROUGH ONE AUDIT PATH
 *
 * `commit` is the only mutation site, and it runs domain refusals → audit
 * append → mutation, in that order. A refused action is not an action and
 * never reaches the sink. An audit that fails fails the action with it:
 * nothing is left half-applied and nothing is queued, because this surface
 * never queues a write (D4).
 *
 * ### DETERMINISM
 *
 * No clock, no counter, no random source. Every register is a parameter.
 */

/* ==================================================================== *
 * 1. THE NINE SECTIONS — L32218-L32226, quoted whole.
 * ==================================================================== */

export interface SectionDefinition {
  /** 1..9, the source's own numbering and the order the panel renders in. */
  readonly ordinal: number
  /** The section name, from the closed vocabulary — never a second spelling. */
  readonly section: ConfigurationSection
  /** The table's third column, verbatim. */
  readonly configures: string
  /** The table's fourth column, verbatim. Why the section exists at all. */
  readonly capabilityServed: string
  /** Sections 8 and 9. The source's own word: "Optional". */
  readonly optional: boolean
  /** Section 5. "Measurement screens only." */
  readonly measurementOnly: boolean
  readonly sourceRef: string
}

/** The card's own row count, L32218-L32226. Nine, and the count is a claim. */
export const SECTION_SOURCE_ROW_COUNT = 9

export const SECTION_DEFINITIONS = [
  {
    ordinal: 1,
    section: 'Screen content',
    configures:
      'Instruction text and optional reference image; a Shared Instruction Block’s content appears first if applied',
    capabilityServed: 'Worker display; basis for coaching context',
    optional: false,
    measurementOnly: false,
    sourceRef: 'L32218',
  },
  {
    ordinal: 2,
    section: 'Input type',
    configures: 'What the worker provides: one of seven capture types, or none',
    capabilityServed: 'Determines proof; basis for evidence-gap detection',
    optional: false,
    measurementOnly: false,
    sourceRef: 'L32219',
  },
  {
    ordinal: 3,
    section: 'Timing',
    configures: 'Maximum and minimum duration and the coaching trigger percentage',
    capabilityServed: 'Prevention Agent trigger; deviation time mechanism',
    optional: false,
    measurementOnly: false,
    sourceRef: 'L32220',
  },
  {
    ordinal: 4,
    section: 'Gate and proof',
    configures: 'Whether the worker can advance without valid proof — hard gate or soft gate',
    capabilityServed: 'Release enforcement; evidence-gap detection',
    optional: false,
    measurementOnly: false,
    sourceRef: 'L32221',
  },
  {
    ordinal: 5,
    section: 'Specification limits',
    configures:
      'Lower and upper specification limit, unit, drawing reference. Measurement screens only',
    capabilityServed: 'Deviation specification mechanism',
    optional: false,
    measurementOnly: true,
    sourceRef: 'L32222',
  },
  {
    ordinal: 6,
    section: 'Coaching content',
    configures:
      'The curated default coaching cards; live assets are retrieved from the approved corpus',
    capabilityServed: 'Prevention Agent selection',
    optional: false,
    measurementOnly: false,
    sourceRef: 'L32223',
  },
  {
    ordinal: 7,
    section: 'Deviation rules and severity mapping',
    configures:
      'The severity mapping into the global catalog, banded on measurement screens, the containment checklist, and the escalation routing',
    capabilityServed: 'Deviation and Containment',
    optional: false,
    measurementOnly: false,
    sourceRef: 'L32224',
  },
  {
    ordinal: 8,
    section: 'Tool and equipment',
    configures:
      'Required tool, optional barcode scan to unlock the screen, optional calibration confirmation. Optional',
    capabilityServed: 'Proof capture; equipment context',
    optional: true,
    measurementOnly: false,
    sourceRef: 'L32225',
  },
  {
    ordinal: 9,
    section: 'Qualification override',
    configures:
      'An additional certification required for this specific screen, above the workflow baseline. Optional',
    capabilityServed: 'Qualification check',
    optional: true,
    measurementOnly: false,
    sourceRef: 'L32226',
  },
] as const satisfies readonly SectionDefinition[]

type MissingFromSectionDefinitions = Exclude<
  ConfigurationSection,
  (typeof SECTION_DEFINITIONS)[number]['section']
>
const _sectionDefinitionsExhaustive: MissingFromSectionDefinitions extends never ? true : never =
  true
void _sectionDefinitionsExhaustive

export function sectionDefinition(section: ConfigurationSection): SectionDefinition {
  const found = SECTION_DEFINITIONS.find((s) => s.section === section)
  if (found === undefined) throw new Error(`MOD-STU-05: no definition for section "${section}".`)
  return found
}

/* ==================================================================== *
 * 2. THE SCREEN RECORD.
 * ==================================================================== */

/** L32236. Two, and no third: a gate is hard or soft. */
export type GateType = 'hard' | 'soft'

export const GATE_TYPES = ['hard', 'soft'] as const satisfies readonly GateType[]

type MissingFromGateTypes = Exclude<GateType, (typeof GATE_TYPES)[number]>
const _gateTypesExhaustive: MissingFromGateTypes extends never ? true : never = true
void _gateTypesExhaustive

/** L32277 — the three states, in order, within a version. */
export type ScreenConfigurationState = 'Incomplete' | 'Configured' | 'Published within a version'

export const SCREEN_CONFIGURATION_STATES = [
  'Incomplete',
  'Configured',
  'Published within a version',
] as const satisfies readonly ScreenConfigurationState[]

type MissingFromScreenStates = Exclude<
  ScreenConfigurationState,
  (typeof SCREEN_CONFIGURATION_STATES)[number]
>
const _screenStatesExhaustive: MissingFromScreenStates extends never ? true : never = true
void _screenStatesExhaustive

/**
 * `active: false` is `AC-STU-064`'s retention: a value belonging to a section
 * that is no longer relevant is RETAINED AND MARKED INACTIVE, never deleted,
 * "so that reverting the input type restores them". A nullable field would
 * have made deletion the only expressible answer.
 */
export interface SpecificationLimits {
  readonly active: boolean
  readonly lower: number
  readonly upper: number
  readonly unit: string
  readonly drawingReference: string
}

export interface TimingValues {
  readonly maximumSeconds: number
  readonly minimumSeconds: number
  readonly triggerPercent: number
  /** True where the percentage comes from the Workflow default (L32234). */
  readonly triggerInherited: boolean
}

export interface CoachingDefaultDesignation {
  readonly locale: Locale
  /** The Coaching Corpus item designated as this locale's curated default. */
  readonly itemId: string
}

/**
 * The Severity 1 arming confirmation, recorded WITH the authored band —
 * `SB-STU-05` (L31814) and `FUNC-STU-05-08-C-1` (L32313). It is a RECORDED
 * ACT, not a warning: if it cannot be recorded, the mapping is not saved.
 */
export interface ArmingConfirmation {
  readonly confirmed: true
  readonly confirmedByIdentityId: string
  /** The four statements the panel made, carried with the confirmation. */
  readonly statements: readonly string[]
}

export interface SeverityBand {
  /** The degree of departure this band covers, in the author's own words. */
  readonly band: string
  /** A level of the GLOBAL catalog. Severity levels are not defined here. */
  readonly level: string
  readonly containmentChecklistId: string | null
  readonly routingTemplateId: string | null
  /** Non-null exactly where `level` is Severity 1. */
  readonly armingConfirmation: ArmingConfirmation | null
}

export interface ToolRequirement {
  readonly active: boolean
  readonly tool: string
  readonly barcodeScanRequired: boolean
  readonly calibrationConfirmationRequired: boolean
}

export interface QualificationOverride {
  readonly active: boolean
  readonly certification: string
}

export interface ScreenContent {
  /** The applied Shared Instruction Block's title, or `null`. */
  readonly blockTitle: string | null
  /** The screen-specific note that renders after the block. */
  readonly note: string
  readonly referenceImage: string | null
}

export interface ScreenConfiguration {
  readonly screenId: string
  readonly name: string
  readonly content: ScreenContent
  readonly inputType: CaptureType
  readonly timing: TimingValues
  readonly gate: GateType
  /** `null` where none was ever authored; inactive where the type moved on. */
  readonly limits: SpecificationLimits | null
  readonly coachingDefaults: readonly CoachingDefaultDesignation[]
  readonly severityBands: readonly SeverityBand[]
  readonly tool: ToolRequirement | null
  readonly qualificationOverride: QualificationOverride | null
  /** The work-instruction step this screen's part mini-form opens inside. */
  readonly stepId: string
}

export interface ConfigurationDraft {
  readonly tenant: TenantId
  readonly workflowName: string
  readonly screens: readonly ScreenConfiguration[]
}

export function isMeasurementScreen(screen: ScreenConfiguration): boolean {
  return screen.inputType === 'measurement entry'
}

/**
 * Throws on an unknown screen rather than returning `undefined`. "This screen
 * has no limits" and "there is no such screen" are different answers, and an
 * assertion written over the first would pass silently on the second.
 */
export function configuredScreen(
  draft: ConfigurationDraft,
  screenId: string,
): ScreenConfiguration {
  const found = draft.screens.find((s) => s.screenId === screenId)
  if (found === undefined) {
    throw new Error(
      `MOD-STU-05: no screen named "${screenId}" is in this draft. An empty answer and a missing ` +
        'screen are different things, and only one of them is true.',
    )
  }
  return found
}

export function limits(draft: ConfigurationDraft, screenId: string): SpecificationLimits | null {
  return configuredScreen(draft, screenId).limits
}

export function severityMapping(
  draft: ConfigurationDraft,
  screenId: string,
): readonly SeverityBand[] {
  return configuredScreen(draft, screenId).severityBands
}

/* ==================================================================== *
 * 3. THE SEED — Bright Bikes, screens 3 through 10 (L32525) plus the
 *    photograph screen that proves Section 5's absence.
 * ==================================================================== */

/**
 * Every literal below that the source states is READ FROM the journey
 * fixture rather than retyped, so a change over there turns the covering
 * test red instead of leaving two copies to drift.
 */
const SPEC = WHEEL_BOLT_DRAFT_CONTENT.specification

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

/** The eight, in the source's own order. `MOD-STU-09` seeds the same eight. */
export const MEASUREMENT_SCREEN_IDS: readonly string[] = BOLTS.map(([n]) => `screen ${n}`)

const ARMED_BY = studioIdentityFor('supervisor-with-authoring-grant').identityId

/**
 * The two bands of L32525's example, with their percentages read from the
 * journey fixture. The Severity 1 band arrives CONFIRMED, because the seed is
 * a draft an author already armed — `SB-STU-05`'s panel was shown and
 * answered, and a seed carrying an unconfirmed Severity 1 mapping would be a
 * draft the platform must refuse to publish.
 */
export const ARMING_PANEL_HEADING = 'This band arms an automatic lot hold.'

/**
 * `SB-STU-05` (L31814), the four things the panel states in plain words.
 * Carried as data so that the panel, the recorded confirmation and the test
 * read one list rather than three copies.
 */
export const ARMING_PANEL_STATEMENTS = [
  'What will be held: the Lot where a lot exists, the Unit where work is serialized, otherwise the Run.',
  'Release is Quality Manager only, with no supervisor exception.',
  'The hold is placed on the device immediately, including offline.',
  'Escalation delivery follows at sync.',
] as const satisfies readonly string[]

function armed(): ArmingConfirmation {
  return {
    confirmed: true,
    confirmedByIdentityId: ARMED_BY,
    statements: [...ARMING_PANEL_STATEMENTS],
  }
}

const SEEDED_BANDS: readonly SeverityBand[] = WHEEL_BOLT_DRAFT_CONTENT.severityBands.map((b) => ({
  band:
    b.departureToPercent === null
      ? `beyond ${b.departureFromPercent} per cent outside the limits`
      : `${b.departureFromPercent} to ${b.departureToPercent} per cent outside the limits`,
  level: `Severity ${b.severity}`,
  containmentChecklistId: 'CHK-TORQUE-RESPONSE',
  routingTemplateId: 'ROU-SEVERITY-BANDS',
  armingConfirmation: b.severity === 1 ? armed() : null,
}))

const SEEDED_COACHING: readonly CoachingDefaultDesignation[] = [
  { locale: 'English', itemId: 'AST-TORQUE-ANGLE-EN' },
  { locale: 'Spanish', itemId: 'AST-TORQUE-ANGLE-ES' },
]

function boltScreen(number: string, bolt: string): ScreenConfiguration {
  return {
    screenId: `screen ${number}`,
    name: `Screen ${number} — Wheel bolt torque`,
    content: {
      blockTitle: WHEEL_BOLT_DRAFT_CONTENT.sharedInstructionBlock.title,
      note: bolt,
      referenceImage: 'IMG-TORQUE-SEQUENCE',
    },
    inputType: 'measurement entry',
    timing: {
      // The maximum and the trigger are the source's own (L32381); the
      // MINIMUM is a seeded fixture value, because the illustrative example
      // states only the maximum while §5.5.4 configures both. Stated here
      // rather than presented as the source's number.
      maximumSeconds: 120,
      minimumSeconds: 20,
      triggerPercent: 80,
      triggerInherited: true,
    },
    gate: 'hard',
    limits: {
      active: true,
      lower: SPEC.lowerLimit,
      upper: SPEC.upperLimit,
      unit: SPEC.unit,
      drawingReference: SPEC.drawingReference,
    },
    coachingDefaults: SEEDED_COACHING,
    severityBands: SEEDED_BANDS,
    tool: {
      active: true,
      tool: 'Torque wrench',
      barcodeScanRequired: false,
      calibrationConfirmationRequired: true,
    },
    qualificationOverride: {
      active: true,
      certification: WHEEL_BOLT_DRAFT_CONTENT.screenLevelQualificationAddition.certification,
    },
    stepId: `STEP-${number}`,
  }
}

/**
 * The eleventh screen of the same Workflow (`screenCount: 11`). It is a PHOTO
 * screen, and it is here for one reason: Section 5's absence cannot be
 * demonstrated on a draft where every screen is a measurement screen, and
 * Section 7's non-measurement arm — a single catalog level rather than bands
 * — has nowhere to render.
 */
const PHOTOGRAPH_SCREEN: ScreenConfiguration = {
  screenId: 'screen 11',
  name: 'Screen 11 — Torque photograph',
  content: {
    blockTitle: null,
    note: 'Photograph the completed fastener pattern.',
    referenceImage: null,
  },
  inputType: 'photo capture',
  timing: { maximumSeconds: 60, minimumSeconds: 10, triggerPercent: 80, triggerInherited: true },
  gate: 'soft',
  limits: null,
  coachingDefaults: SEEDED_COACHING,
  severityBands: [
    {
      band: 'Any missing or unusable photograph',
      level: 'Severity 3',
      containmentChecklistId: null,
      routingTemplateId: 'ROU-SEVERITY-BANDS',
      armingConfirmation: null,
    },
  ],
  tool: null,
  qualificationOverride: null,
  stepId: 'STEP-11',
}

export const WHEEL_BOLT_CONFIGURATION: ConfigurationDraft = {
  tenant: SEEDED_TENANT,
  workflowName: WHEEL_BOLT_DRAFT_CONTENT.workflowName,
  screens: [...BOLTS.map(([n, bolt]) => boltScreen(n, bolt)), PHOTOGRAPH_SCREEN],
}

/* ==================================================================== *
 * 4. SECTION STATE — DERIVED ONCE, READ BY EVERY BRANCH.
 * ==================================================================== */

export type SectionVisibility =
  /** Drawn, with its controls. */
  | 'rendered'
  /** Not relevant to the selected input type (L32203). Section 5 only. */
  | 'absent-for-input-type'
  /** The capability is not enabled: `SB-STU-04`'s single line stands here. */
  | 'not-available'
  /** `FB-STU-07` — the capability state could not be read. Value intact. */
  | 'frozen-read-only'

export const SECTION_VISIBILITIES = [
  'rendered',
  'absent-for-input-type',
  'not-available',
  'frozen-read-only',
] as const satisfies readonly SectionVisibility[]

type MissingFromVisibilities = Exclude<SectionVisibility, (typeof SECTION_VISIBILITIES)[number]>
const _visibilitiesExhaustive: MissingFromVisibilities extends never ? true : never = true
void _visibilitiesExhaustive

/** `SB-STU-08`'s completion indicator: complete, incomplete, not applicable. */
export type SectionCompletion = 'complete' | 'incomplete' | 'not-applicable'

export interface SectionState {
  readonly ordinal: number
  readonly section: ConfigurationSection
  readonly visibility: SectionVisibility
  readonly completion: SectionCompletion
  readonly optional: boolean
  /** Sections 8 and 9 — `SB-STU-08`'s "collapsed by default". */
  readonly collapsedByDefault: boolean
  /** Named, never a count. `SB-STU-08` requires the missing element named. */
  readonly missingElements: readonly string[]
  /** Why the section is not drawn, or why it is frozen. `null` when rendered. */
  readonly reason: string | null
  /** The capability whose state produced `reason`, where one did. */
  readonly capability: string | null
  /** True where the section's APPEARANCE is conditional and must be announced. */
  readonly announced: boolean
}

/**
 * What is missing from ONE section on ONE screen, in the source's own field
 * names. Optional sections return an empty list by construction — an optional
 * section can never be the reason a screen is Incomplete.
 */
function missingIn(
  definition: SectionDefinition,
  screen: ScreenConfiguration,
  declaredLocales: readonly Locale[],
): readonly string[] {
  switch (definition.section) {
    case 'Screen content':
      return screen.content.note.trim() === '' ? ['instruction text'] : []
    case 'Input type':
      return (CAPTURE_TYPES as readonly string[]).includes(screen.inputType)
        ? []
        : [`the capture type “${String(screen.inputType)}”, which is outside the adopted seven`]
    case 'Timing': {
      const missing: string[] = []
      if (screen.timing.maximumSeconds <= 0) missing.push('maximum expected duration')
      if (screen.timing.minimumSeconds < 0) missing.push('minimum expected duration')
      if (screen.timing.triggerPercent <= 0) missing.push('coaching trigger percentage')
      return missing
    }
    case 'Gate and proof':
      return (GATE_TYPES as readonly string[]).includes(screen.gate) ? [] : ['gate type']
    case 'Specification limits': {
      const value = screen.limits
      if (value === null || !value.active) {
        return ['lower specification limit', 'upper specification limit', 'unit', 'drawing reference']
      }
      const missing: string[] = []
      if (value.unit.trim() === '') missing.push('unit')
      if (value.drawingReference.trim() === '') missing.push('drawing reference')
      return missing
    }
    case 'Coaching content':
      return declaredLocales
        .filter((locale) => !screen.coachingDefaults.some((d) => d.locale === locale))
        .map((locale) => `curated coaching default for ${locale}`)
    case 'Deviation rules and severity mapping': {
      if (screen.inputType === 'none') return []
      if (screen.severityBands.length === 0) {
        return ['at minimum one severity mapping covering any out-of-tolerance reading']
      }
      return screen.severityBands
        .filter((b) => b.level === 'Severity 1' && b.armingConfirmation === null)
        .map((b) => `a recorded arming confirmation for the band “${b.band}”`)
    }
    // Sections 8 and 9 are optional. An optional section is never missing.
    case 'Tool and equipment':
    case 'Qualification override':
      return []
    default: {
      const exhaustive: never = definition.section
      throw new Error(`MOD-STU-05: unhandled section ${JSON.stringify(exhaustive)}`)
    }
  }
}

/**
 * THE ONE DERIVATION. All nine sections, always, for one screen.
 *
 * Order of the two gates matters and is stated: the CAPABILITY gate runs
 * first, because a capability that is not enabled removes the section
 * whatever the input type says, and a capability whose state cannot be read
 * freezes it read-only rather than hiding it (`FUNC-STU-05-01-A-1`'s own
 * `FB-STU-07` difference, L32285). The INPUT-TYPE gate runs second.
 */
export function sectionStates(
  screen: ScreenConfiguration,
  capabilityRows: readonly AtomicCapabilityRow[],
  declaredLocales: readonly Locale[] = LOCALES,
): readonly SectionState[] {
  return SECTION_DEFINITIONS.map((definition) => {
    const base = {
      ordinal: definition.ordinal,
      section: definition.section,
      optional: definition.optional,
      collapsedByDefault: definition.optional,
    }

    const capability = sectionRendering(definition.section, capabilityRows, screen)
    if (capability.kind === 'not-available') {
      return {
        ...base,
        visibility: 'not-available' as const,
        completion: 'not-applicable' as const,
        missingElements: [],
        reason: capability.reason,
        capability: capability.capability,
        announced: false,
      }
    }
    if (capability.kind === 'frozen-read-only') {
      return {
        ...base,
        visibility: 'frozen-read-only' as const,
        completion: 'not-applicable' as const,
        missingElements: [],
        reason: capability.reason,
        capability: null,
        announced: false,
      }
    }

    if (definition.measurementOnly && !isMeasurementScreen(screen)) {
      return {
        ...base,
        visibility: 'absent-for-input-type' as const,
        completion: 'not-applicable' as const,
        missingElements: [],
        reason:
          'Not relevant to the selected input type. Section 5 appears only on measurement screens ' +
          '(AC-STU-060). Any limits authored earlier are retained and marked inactive, not deleted.',
        capability: null,
        announced: false,
      }
    }

    const missingElements = missingIn(definition, screen, declaredLocales)
    return {
      ...base,
      visibility: 'rendered' as const,
      completion: missingElements.length === 0 ? ('complete' as const) : ('incomplete' as const),
      missingElements,
      reason: null,
      capability: null,
      announced: definition.measurementOnly,
    }
  })
}

/**
 * `SB-STU-08`'s footer: every blocking element, by section and by element.
 * Reads the SAME array the panel drew from, so the footer and the sections
 * cannot contradict each other.
 */
export function blockingElements(states: readonly SectionState[]): readonly string[] {
  return states.flatMap((state) =>
    state.missingElements.map((element) => `${state.section} — ${element}`),
  )
}

/**
 * L32277: Incomplete while any mandatory element for its input type is
 * missing, Configured when all are present. `Published within a version` is
 * the third state and is NOT derivable from the sections — it is a property
 * of the version, which `MOD-STU-12` owns — so it is never returned here and
 * the vocabulary says so rather than this function guessing.
 */
export function screenConfigurationState(
  states: readonly SectionState[],
): Extract<ScreenConfigurationState, 'Incomplete' | 'Configured'> {
  return states.some((s) => s.completion === 'incomplete') ? 'Incomplete' : 'Configured'
}

/* ==================================================================== *
 * 5. THE SPECIFICATION GATE — HARD, PLATFORM-WIDE (L32236).
 * ==================================================================== */

export interface MeasurementEvaluation {
  readonly deviation: boolean
  /** The catalog level the reading classifies into, or `null` in tolerance. */
  readonly severity: string | null
  readonly band: string | null
  readonly departurePercent: number
  /** Why the authored gate did not enter this calculation. */
  readonly note: string
}

/**
 * THE AUTHORED GATE IS NOT AN INPUT HERE, AND THAT IS THE WHOLE POINT.
 * L32236: "an out-of-tolerance measurement always registers as a deviation
 * and always classifies a severity, and no author or tenant setting can
 * configure that away. **A soft proof gate never softens the specification
 * gate.**" This function does not read `screen.gate`, and the single change
 * that would make its covering test red is this function reading it.
 */
export function evaluateMeasurement(
  draft: ConfigurationDraft,
  screenId: string,
  reading: number,
): MeasurementEvaluation {
  const screen = configuredScreen(draft, screenId)
  const value = screen.limits
  const note =
    'The authored proof gate governs proof capture only. The specification gate is hard ' +
    'platform-wide (L32236), so this classification is identical under a hard and a soft gate.'
  if (value === null || !value.active) {
    return { deviation: false, severity: null, band: null, departurePercent: 0, note }
  }
  if (reading >= value.lower && reading <= value.upper) {
    return { deviation: false, severity: null, band: null, departurePercent: 0, note }
  }
  const nearest = reading > value.upper ? value.upper : value.lower
  const departurePercent = Math.abs((reading - nearest) / nearest) * 100
  const band = bandFor(screen.severityBands, departurePercent)
  return {
    deviation: true,
    severity: band?.level ?? null,
    band: band?.band ?? null,
    departurePercent,
    note,
  }
}

/**
 * Which band covers a departure. The bands carry their own words, so the
 * bounds are read back out of them rather than kept in a second field that
 * could disagree with the label an author reads.
 */
function bandFor(bands: readonly SeverityBand[], departurePercent: number): SeverityBand | null {
  let widest: SeverityBand | null = null
  let widestFrom = -1
  for (const band of bands) {
    const numbers = band.band.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? []
    const from = numbers[0] ?? 0
    const to = numbers.length > 1 ? numbers[1]! : Number.POSITIVE_INFINITY
    if (departurePercent >= from && departurePercent <= to && from > widestFrom) {
      widest = band
      widestFrom = from
    }
  }
  // At minimum one mapping covers ANY out-of-tolerance reading (L32247), so a
  // departure outside every authored band still classifies: the widest band
  // stands. A `null` here would be a deviation with no severity, which
  // L32244 forbids.
  return widest ?? (bands.length > 0 ? bands[bands.length - 1]! : null)
}

/* ==================================================================== *
 * 6. THE DECISION — PER CONTROL, OVER A MATRIX ROW.
 * ==================================================================== */

/** The reviewer-varied scenario, consumed from `MOD-STU-18`, never re-declared. */
export type ScreenContext = Stu18Scenario

export const STU05_DEFAULT_CONTEXT: ScreenContext = SEEDED_SCENARIO

/**
 * THE ONE ACCESS CALL THIS MODULE MAKES. Every control routes through here,
 * per control, over that control's own matrix row — never over a
 * module-level role list.
 *
 * The input is composed here rather than through `MOD-STU-18`'s
 * `decisionForRow`, whose parameter is typed to that module's own row union;
 * the identity seed, the grant map and the domain state ARE consumed from it,
 * so nothing about "who is being viewed as" is declared twice. Lifting the
 * whole composition into a shared `src/studio/rendering.ts` would edit files
 * this task does not own, and `MOD-STU-07` recorded the same observation.
 */
export function stu05Decision(
  rowId: Stu05RowId,
  persona: StudioPersonaColumn,
  ctx: ScreenContext = STU05_DEFAULT_CONTEXT,
): StudioAccessDecision {
  const s: ScreenContext = { ...ctx, persona }
  return evaluateStudioAccess({
    row: stu05Row(rowId),
    identity: studioIdentityFor(persona),
    grants: studioGrantsFor(s),
    commercialTier: s.commercialTier,
    identityLayer: s.identityLayer,
    state: SEEDED_STATE,
    online: s.online,
    resourceTenant: SEEDED_TENANT,
    // No row of this card occupies an approval stage, so no stage of the
    // submission in view is claimed here. `MOD-STU-11` owns the chain.
    authorOfRecord: null,
    reviewerOfRecord: null,
    releaseAuthorityOfRecord: null,
  })
}

/* ==================================================================== *
 * 7. THE ONE AUDIT PATH.
 * ==================================================================== */

/** L32405 — "Every section value change is captured in the draft revision history." */
export type ScreenWriteAction =
  | 'author-screen-content'
  | 'choose-input-type'
  | 'set-timing'
  | 'set-gate'
  | 'set-specification-limits'
  | 'designate-coaching-default'
  | 'map-severity-band'
  | 'attach-library-pointer'
  | 'set-tool-requirement'
  | 'set-qualification-override'

export const SCREEN_WRITE_ACTIONS = [
  'author-screen-content',
  'choose-input-type',
  'set-timing',
  'set-gate',
  'set-specification-limits',
  'designate-coaching-default',
  'map-severity-band',
  'attach-library-pointer',
  'set-tool-requirement',
  'set-qualification-override',
] as const satisfies readonly ScreenWriteAction[]

type MissingFromWriteActions = Exclude<ScreenWriteAction, (typeof SCREEN_WRITE_ACTIONS)[number]>
const _writeActionsExhaustive: MissingFromWriteActions extends never ? true : never = true
void _writeActionsExhaustive

export interface ScreenAuditEntry {
  /** Identity and action, never "acting as role" (L34657). */
  readonly actorIdentityId: string
  readonly action: ScreenWriteAction
  readonly screenId: string
  readonly section: ConfigurationSection
  readonly tenant: TenantId
  readonly sourceRefs: readonly string[]
}

export type ScreenAuditWrite = (
  entry: ScreenAuditEntry,
) => { readonly ok: true } | { readonly ok: false; readonly reason: string }

export type ScreenWriteResult =
  | { readonly ok: true; readonly draft: ConfigurationDraft; readonly message: string }
  | { readonly ok: false; readonly draft: ConfigurationDraft; readonly reason: string }

export interface ScreenWriteInput {
  readonly draft: ConfigurationDraft
  readonly screenId: string
  readonly persona: StudioPersonaColumn
  readonly ctx?: ScreenContext
  readonly writeAudit: ScreenAuditWrite
}

const AUDIT_REFS = ['L32431', 'L34657'] as const

function refuse(draft: ConfigurationDraft, reason: string): ScreenWriteResult {
  return { ok: false, draft, reason }
}

/**
 * THE ONLY MUTATION SITE IN THIS MODULE. Three things in one fixed order:
 *
 *   1. DOMAIN REFUSALS — the evaluator's answer for THIS control, then the
 *      rules that belong to the act itself. None of them reaches the sink: a
 *      refused action is not an action, and an audit entry for one would put
 *      a write in the log that never happened.
 *   2. THE AUDIT APPEND — after the refusals and BEFORE the mutation.
 *   3. THE MUTATION.
 *
 * On every refusal the returned draft is the SAME OBJECT that came in, so a
 * caller comparing by identity can see that nothing happened.
 */
function commit(
  input: ScreenWriteInput & {
    readonly rowId: Stu05RowId
    readonly action: ScreenWriteAction
    readonly section: ConfigurationSection
    readonly sourceRefs: readonly string[]
  },
  apply: (screen: ScreenConfiguration) => ScreenConfiguration,
  successMessage: string,
): ScreenWriteResult {
  const { draft, screenId } = input

  const decision = stu05Decision(input.rowId, input.persona, input.ctx)
  if (!permitsAction(decision.decision)) {
    return refuse(
      draft,
      `Refused before anything was written: ${decision.reason} Nothing was written, and no audit ` +
        'entry was appended, because a refused action is not an action.',
    )
  }

  const screen = draft.screens.find((s) => s.screenId === screenId)
  if (screen === undefined) {
    return refuse(draft, `No screen named "${screenId}" is in this draft, so nothing was written.`)
  }

  const audit = input.writeAudit({
    actorIdentityId: studioIdentityFor(input.persona).identityId,
    action: input.action,
    screenId,
    section: input.section,
    tenant: draft.tenant,
    sourceRefs: [...input.sourceRefs, ...AUDIT_REFS],
  })
  if (!audit.ok) {
    return refuse(
      draft,
      `The audit write failed, so the action did not happen: ${audit.reason}. ${screenId} is ` +
        'unchanged, nothing is left half-applied, and nothing was queued for later — the audit ' +
        'entry commits in the same transaction as the action, so a failed audit fails the action ' +
        'with it.',
    )
  }

  return {
    ok: true,
    draft: {
      ...draft,
      screens: draft.screens.map((s) => (s.screenId === screenId ? apply(s) : s)),
    },
    message: successMessage,
  }
}

/* ==================================================================== *
 * 8. THE SECTION WRITES. Every one of them calls `commit`.
 * ==================================================================== */

export function setInstruction(
  input: ScreenWriteInput & { readonly note: string; readonly blockTitle?: string | null },
): ScreenWriteResult {
  if (input.note.trim() === '') {
    return refuse(input.draft, 'Instruction text is the worker’s actual instruction and cannot be blank. Nothing was written.')
  }
  return commit(
    { ...input, rowId: 'author-sections-one-through-nine', action: 'author-screen-content', section: 'Screen content', sourceRefs: ['L32228', 'FUNC-STU-05-02-A-1 L32284'] },
    (screen) => ({
      ...screen,
      content: {
        ...screen.content,
        note: input.note,
        blockTitle: input.blockTitle === undefined ? screen.content.blockTitle : input.blockTitle,
      },
    }),
    `${input.screenId}: instruction content saved.`,
  )
}

/**
 * `AC-STU-064` (L32337, L32420). A value belonging to a section that is no
 * longer relevant is RETAINED AND MARKED INACTIVE, never deleted, "so that
 * reverting the input type restores them; this prevents an accidental type
 * change from destroying a specification limit."
 *
 * The rule is applied to the RECORD, not to a render branch: `active` is the
 * only thing that moves, and reverting the type moves it back.
 */
export function setInputType(
  input: ScreenWriteInput & { readonly inputType: CaptureType },
): ScreenWriteResult {
  if (!(CAPTURE_TYPES as readonly string[]).includes(input.inputType)) {
    return refuse(
      input.draft,
      `“${String(input.inputType)}” is outside the adopted DEC-CAP-001 set of seven, plus none. ` +
        'Nothing was written; publishing a type the device cannot render would strand a worker ' +
        'mid-Run (L32291).',
    )
  }
  return commit(
    { ...input, rowId: 'choose-the-input-type', action: 'choose-input-type', section: 'Input type', sourceRefs: ['L32230', 'AC-STU-064 L32420'] },
    (screen) => {
      const measurement = input.inputType === 'measurement entry'
      return {
        ...screen,
        inputType: input.inputType,
        limits: screen.limits === null ? null : { ...screen.limits, active: measurement },
      }
    },
    `${input.screenId}: input type set to ${input.inputType}. Values belonging to sections that ` +
      'are no longer relevant are retained and marked inactive, never deleted.',
  )
}

export function setTiming(
  input: ScreenWriteInput & {
    readonly maximumSeconds: number
    readonly minimumSeconds: number
    readonly triggerPercent?: number
  },
): ScreenWriteResult {
  if (input.minimumSeconds > input.maximumSeconds) {
    return refuse(input.draft, 'The minimum expected duration cannot exceed the maximum. Nothing was written.')
  }
  return commit(
    { ...input, rowId: 'author-sections-one-through-nine', action: 'set-timing', section: 'Timing', sourceRefs: ['L32234'] },
    (screen) => ({
      ...screen,
      timing: {
        maximumSeconds: input.maximumSeconds,
        minimumSeconds: input.minimumSeconds,
        triggerPercent: input.triggerPercent ?? screen.timing.triggerPercent,
        triggerInherited: input.triggerPercent === undefined,
      },
    }),
    `${input.screenId}: timing saved.`,
  )
}

export function setGate(input: ScreenWriteInput & { readonly gate: GateType }): ScreenWriteResult {
  if (!(GATE_TYPES as readonly string[]).includes(input.gate)) {
    return refuse(input.draft, `“${String(input.gate)}” is not a gate type. Nothing was written.`)
  }
  return commit(
    { ...input, rowId: 'set-a-hard-or-soft-proof-gate', action: 'set-gate', section: 'Gate and proof', sourceRefs: ['L32236', 'AC-STU-061 L32417'] },
    (screen) => ({ ...screen, gate: input.gate }),
    `${input.screenId}: ${input.gate} proof gate saved. This governs proof capture only — a soft ` +
      'proof gate never softens the specification gate.',
  )
}

export function setLimits(
  input: ScreenWriteInput & {
    readonly limits: Omit<SpecificationLimits, 'active'>
  },
): ScreenWriteResult {
  const { lower, upper, unit, drawingReference } = input.limits
  if (lower >= upper) {
    return refuse(input.draft, 'The lower specification limit must be below the upper. Nothing was written.')
  }
  if (unit.trim() === '' || drawingReference.trim() === '') {
    return refuse(
      input.draft,
      'A specification limit carries a unit and a drawing reference; the specification gate would ' +
        'have nothing to check against without them. Nothing was written.',
    )
  }
  return commit(
    { ...input, rowId: 'author-sections-one-through-nine', action: 'set-specification-limits', section: 'Specification limits', sourceRefs: ['L32238', 'FUNC-STU-05-06-A-1 L32301'] },
    (screen) => ({ ...screen, limits: { ...input.limits, active: isMeasurementScreen(screen) } }),
    `${input.screenId}: specification limits saved.`,
  )
}

export function setTool(
  input: ScreenWriteInput & { readonly tool: Omit<ToolRequirement, 'active'> },
): ScreenWriteResult {
  return commit(
    { ...input, rowId: 'author-sections-one-through-nine', action: 'set-tool-requirement', section: 'Tool and equipment', sourceRefs: ['L32251'] },
    (screen) => ({ ...screen, tool: { ...input.tool, active: true } }),
    `${input.screenId}: tool and equipment saved.`,
  )
}

export function setQualificationOverride(
  input: ScreenWriteInput & { readonly certification: string },
): ScreenWriteResult {
  if (input.certification.trim() === '') {
    return refuse(input.draft, 'An override names a certification. Nothing was written.')
  }
  return commit(
    { ...input, rowId: 'add-a-screen-level-qualification-override', action: 'set-qualification-override', section: 'Qualification override', sourceRefs: ['L32253', 'FUNC-STU-05-10-A-1 L32321'] },
    (screen) => ({
      ...screen,
      qualificationOverride: { active: true, certification: input.certification },
    }),
    `${input.screenId}: screen-level qualification override saved.`,
  )
}

export function designateCoachingDefault(
  input: ScreenWriteInput & { readonly locale: Locale; readonly itemId: string },
): ScreenWriteResult {
  return commit(
    { ...input, rowId: 'author-sections-one-through-nine', action: 'designate-coaching-default', section: 'Coaching content', sourceRefs: ['L32240', 'FUNC-STU-05-07-A-1 L32304'] },
    (screen) => ({
      ...screen,
      coachingDefaults: [
        ...screen.coachingDefaults.filter((d) => d.locale !== input.locale),
        { locale: input.locale, itemId: input.itemId },
      ],
    }),
    `${input.screenId}: curated coaching default designated for ${input.locale}.`,
  )
}

/* ==================================================================== *
 * 9. THE SEVERITY MAPPING, AND THE ARMING CONFIRMATION IT CANNOT SKIP.
 * ==================================================================== */

export interface MapBandInput extends ScreenWriteInput {
  readonly band: string
  /** A level of the global catalog. This module defines none (L32242). */
  readonly level: string
  /**
   * Whether the confirmation could be RECORDED. Not "did the author click" —
   * `FUNC-STU-05-08-C-1` (L32313) refuses on the RECORD, not on the answer,
   * and a build that shows the panel and saves regardless satisfies a naive
   * reading while failing AC-STU-043 and AC-STU-063.
   */
  readonly recordConfirmation?: 'succeeds' | 'fails'
  readonly containmentChecklistId?: string | null
  readonly routingTemplateId?: string | null
}

export type MapBandResult =
  | { readonly ok: true; readonly draft: ConfigurationDraft; readonly band: SeverityBand; readonly message: string }
  | { readonly ok: false; readonly draft: ConfigurationDraft; readonly reason: string }

/** Severity 1 is the one level the platform floor arms automatically (L32242). */
export const SEVERITY_ONE = 'Severity 1'

export function mapBand(input: MapBandInput): MapBandResult {
  const armsTheHold = input.level === SEVERITY_ONE

  // THE REFUSAL SITS BEFORE THE AUDIT AND BEFORE THE MUTATION. If the
  // confirmation cannot be recorded, the mapping is not saved — and nothing
  // is logged, because nothing happened.
  if (armsTheHold && input.recordConfirmation !== 'succeeds') {
    return {
      ok: false,
      draft: input.draft,
      reason:
        `${ARMING_PANEL_HEADING} The confirmation could not be recorded, so the mapping was not ` +
        'saved (FUNC-STU-05-08-C-1, L32313). No author arms the platform’s strongest reflex by ' +
        'accident, and a mapping saved without its recorded confirmation would do exactly that.',
    }
  }

  const confirmation = armsTheHold
    ? {
        confirmed: true as const,
        confirmedByIdentityId: studioIdentityFor(input.persona).identityId,
        statements: [...ARMING_PANEL_STATEMENTS],
      }
    : null

  const band: SeverityBand = {
    band: input.band,
    level: input.level,
    containmentChecklistId: input.containmentChecklistId ?? null,
    routingTemplateId: input.routingTemplateId ?? null,
    armingConfirmation: confirmation,
  }

  const written = commit(
    { ...input, rowId: 'map-a-band-to-a-catalog-level', action: 'map-severity-band', section: 'Deviation rules and severity mapping', sourceRefs: ['L32244', 'FUNC-STU-05-08-C-1 L32313', 'SB-STU-05 L31814'] },
    (screen) => ({
      ...screen,
      severityBands: [
        ...screen.severityBands.filter((b) => b.band !== band.band),
        band,
      ],
    }),
    `${input.screenId}: ${input.band} mapped to ${input.level}.` +
      (armsTheHold ? ' The arming confirmation is recorded with the authored band.' : ''),
  )
  if (!written.ok) return { ok: false, draft: written.draft, reason: written.reason }
  return { ok: true, draft: written.draft, band, message: written.message }
}

/* ==================================================================== *
 * 10. SECTIONS 6 AND 7's PICKERS — MOD-STU-07's, never a second copy.
 * ==================================================================== */

export interface AttachPointerInput extends ScreenWriteInput {
  readonly register: LibraryRegister
  readonly slot: PointerSlot
  readonly itemId: string
}

export type AttachPointerResult =
  | { readonly ok: true; readonly draft: ConfigurationDraft; readonly register: LibraryRegister; readonly message: string }
  | { readonly ok: false; readonly draft: ConfigurationDraft; readonly register: LibraryRegister; readonly reason: string }

/**
 * ATTACHING A LIBRARY POINTER IS `MOD-STU-07`'s WRITE, NOT THIS MODULE'S.
 * C4 — no check and no write is implemented twice — so this delegates to
 * `setScreenPointer`, which owns the pointer table, its refusals and its
 * audit entry. What this module adds is the DECISION for its own control and
 * the band-or-locale attachment on its own record.
 *
 * FINDING, recorded rather than smoothed over: `PointerSlot` is keyed per
 * SCREEN, while §5.5.7 designates coaching defaults per LOCALE and §5.5.8
 * attaches a containment checklist and a routing template per BAND ("each
 * able to carry its own"). The screen-level pointer is still written, because
 * that table is what `reuseImpact` reads to name the screens a library edit
 * would reach; the per-band and per-locale attachments live on this module's
 * own record. Both facts are written down; neither is collapsed into the
 * other.
 */
export function attachPointer(input: AttachPointerInput): AttachPointerResult {
  const { draft, register, slot, itemId } = input
  const decision = stu05Decision('author-sections-one-through-nine', input.persona, input.ctx)
  if (!permitsAction(decision.decision)) {
    return {
      ok: false,
      draft,
      register,
      reason: `Refused before anything was written: ${decision.reason} Nothing was written.`,
    }
  }

  const item = itemById(register, itemId)
  if (item === undefined || !isInForce(item)) {
    return {
      ok: false,
      draft,
      register,
      reason: `${itemId} is not an item in force in the ${SLOT_LIBRARY[slot]} library, so no screen may point at it. Nothing was written.`,
    }
  }

  const audit: LibraryAuditWrite = () =>
    input.writeAudit({
      actorIdentityId: studioIdentityFor(input.persona).identityId,
      action: 'attach-library-pointer',
      screenId: input.screenId,
      section: slot === 'coaching-default' ? 'Coaching content' : 'Deviation rules and severity mapping',
      tenant: draft.tenant,
      sourceRefs: ['L32249', 'L32632', ...AUDIT_REFS],
    })

  const result = setScreenPointer({
    register,
    screenId: input.screenId,
    slot,
    itemId,
    actor: {
      identityId: studioIdentityFor(input.persona).identityId,
      displayName: input.persona,
      tenant: draft.tenant,
    },
    decision,
    writeAudit: audit,
  })
  if (!result.ok) {
    return { ok: false, draft, register, reason: result.message }
  }
  return { ok: true, draft, register: result.register, message: result.message }
}

/* ==================================================================== *
 * 11. THE SERVICE — every write this module offers, and nothing else.
 * ==================================================================== */

/**
 * `TEST-STU-068` (L32427): "confirm no such control exists and the
 * application programming interface refuses." There is no
 * `setSpecificationGate` and no `defineSeverityLevel` here, and the covering
 * test asserts their absence by name AND by pattern, so a differently spelled
 * one cannot slip in.
 */
export const screenService = {
  setInstruction,
  setInputType,
  setTiming,
  setGate,
  setLimits,
  setTool,
  setQualificationOverride,
  designateCoachingDefault,
  mapBand,
  attachPointer,
} as const

/* ==================================================================== *
 * 12. THE FIVE PUBLICATION-BLOCKING VALIDATIONS.
 *
 * Task 5's registry says which module owns which check, and these are the
 * five it names for `MOD-STU-05`: #2 severity-mapping, #3 capture-type,
 * #4 specification-limits, #5 coaching-default-per-locale, #10
 * severity-one-arming. Registering anything else returns `not-an-owner`.
 *
 * EVERY ONE OF THEM WALKS ALL EIGHT MEASUREMENT SCREENS AND NAMES EVERY
 * FAILING ONE. A check that named the first would leave seven screens
 * unvalidated behind a green suite.
 *
 * EVERY ONE OF THEM REFUSES TO RUN ON AN EMPTY DRAFT. A walk over an empty
 * screen list passes every claim made inside it, which is the ninth defect
 * shape; `FB-STU-09`'s fail-closed rule makes "cannot run" a blocker anyway,
 * so the honest answer costs nothing.
 * ==================================================================== */

export interface ScreenPublishSubject {
  readonly workflowName: string
  readonly draft: ConfigurationDraft
  readonly declaredLocales: readonly Locale[]
  readonly maintainedCertifications: readonly string[]
}

function emptyDraftVerdict(subject: ScreenPublishSubject): PublishCheckVerdict | null {
  if (subject.draft.screens.length > 0) return null
  return {
    outcome: 'cannot-run',
    reason:
      `${subject.workflowName} carries no screens, so this check has nothing to walk. An empty ` +
      'walk passes every claim made inside it, and publishing on a check that verified nothing is ' +
      'the failure the check exists to prevent (FB-STU-09).',
  }
}

function blockedOn(elements: readonly string[]): PublishCheckVerdict {
  return { outcome: 'blocked', blockingElement: elements.join('; ') }
}

const severityMappingCheck: PublishCheckImplementation<ScreenPublishSubject> = {
  checkId: 'severity-mapping',
  implementedBy: 'MOD-STU-05',
  run: (subject) => {
    const early = emptyDraftVerdict(subject)
    if (early !== null) return early
    const failing = subject.draft.screens
      .filter((s) => s.inputType !== 'none' && s.severityBands.length === 0)
      .map(
        (s) =>
          `${s.screenId} (${s.name}) carries no severity mapping, and severity must be set ` +
          'explicitly on every screen that can deviate (L32244)',
      )
    return failing.length === 0 ? { outcome: 'passed' } : blockedOn(failing)
  },
}

const captureTypeCheck: PublishCheckImplementation<ScreenPublishSubject> = {
  checkId: 'capture-type',
  implementedBy: 'MOD-STU-05',
  run: (subject) => {
    const early = emptyDraftVerdict(subject)
    if (early !== null) return early
    const failing = subject.draft.screens
      .filter((s) => !(CAPTURE_TYPES as readonly string[]).includes(s.inputType))
      .map(
        (s) =>
          `${s.screenId} (${s.name}) carries the capture type “${String(s.inputType)}”, which is ` +
          'outside the adopted DEC-CAP-001 set of seven',
      )
    return failing.length === 0 ? { outcome: 'passed' } : blockedOn(failing)
  },
}

const specificationLimitsCheck: PublishCheckImplementation<ScreenPublishSubject> = {
  checkId: 'specification-limits',
  implementedBy: 'MOD-STU-05',
  run: (subject) => {
    const early = emptyDraftVerdict(subject)
    if (early !== null) return early
    const failing: string[] = []
    for (const screen of subject.draft.screens) {
      if (!isMeasurementScreen(screen)) continue
      const value = screen.limits
      const missing: string[] = []
      if (value === null || !value.active) {
        missing.push('lower specification limit', 'upper specification limit', 'unit', 'drawing reference')
      } else {
        if (value.unit.trim() === '') missing.push('unit')
        if (value.drawingReference.trim() === '') missing.push('drawing reference')
      }
      if (missing.length > 0) {
        failing.push(
          `${screen.screenId} (${screen.name}) is a measurement screen missing ${missing.join(', ')}`,
        )
      }
    }
    return failing.length === 0 ? { outcome: 'passed' } : blockedOn(failing)
  },
}

const coachingDefaultCheck: PublishCheckImplementation<ScreenPublishSubject> = {
  checkId: 'coaching-default-per-locale',
  implementedBy: 'MOD-STU-05',
  run: (subject) => {
    const early = emptyDraftVerdict(subject)
    if (early !== null) return early
    if (subject.declaredLocales.length === 0) {
      return {
        outcome: 'cannot-run',
        reason: 'No locale is declared on this Workflow, so per-locale coverage cannot be checked.',
      }
    }
    const failing: string[] = []
    for (const screen of subject.draft.screens) {
      for (const locale of subject.declaredLocales) {
        if (!screen.coachingDefaults.some((d) => d.locale === locale)) {
          failing.push(
            `${screen.screenId} (${screen.name}) has no designated coaching default in ${locale}`,
          )
        }
      }
    }
    return failing.length === 0 ? { outcome: 'passed' } : blockedOn(failing)
  },
}

const severityOneArmingCheck: PublishCheckImplementation<ScreenPublishSubject> = {
  checkId: 'severity-one-arming',
  implementedBy: 'MOD-STU-05',
  run: (subject) => {
    const early = emptyDraftVerdict(subject)
    if (early !== null) return early
    const failing: string[] = []
    for (const screen of subject.draft.screens) {
      for (const band of screen.severityBands) {
        if (band.level === SEVERITY_ONE && band.armingConfirmation === null) {
          failing.push(
            `${screen.screenId} (${screen.name}) maps the band “${band.band}” to ${SEVERITY_ONE} ` +
              'with no recorded arming confirmation',
          )
        }
      }
    }
    return failing.length === 0 ? { outcome: 'passed' } : blockedOn(failing)
  },
}

/** The five, in check ordinal order. */
export const stu05PublishChecks: readonly PublishCheckImplementation<ScreenPublishSubject>[] = [
  severityMappingCheck,
  captureTypeCheck,
  specificationLimitsCheck,
  coachingDefaultCheck,
  severityOneArmingCheck,
]
