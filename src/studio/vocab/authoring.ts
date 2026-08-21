/**
 * Slice 5, task 3 -- the authoring-surface vocabularies.
 *
 * Members are the frozen source's own words, not slugs of them. Collapsing
 * "Deviation rules and severity mapping" to `severity` or "barcode or Quick
 * Response code scan" to `scan` would lose exactly the distinction the source
 * spent a decision card preserving.
 *
 * `INHERITABLE_DEFAULTS` is the one exception and carries slug identifiers,
 * because those two members are settings keys rather than rendered state
 * names; their source wording is on each member's doc comment.
 */

/**
 * The adopted `DEC-CAP-001` seven, plus none. Built from `AC-STU-065`'s own
 * words at L32421: "The input-type picker offers exactly the adopted
 * `DEC-CAP-001` seven -- measurement entry, photo capture, barcode or Quick
 * Response code scan, checkbox confirmation, digital signature, free text, and
 * dropdown selection -- plus none, and publication is blocked for any capture
 * type outside that set, with the offending type named."
 *
 * **There is no eighth capture type.** `checklist` and `boolean` are §1.7's
 * and §7.8.3's names for what §5.5.3 calls `checkbox confirmation` with a
 * multiplicity setting -- the merge removes a type name and no capability
 * (L32232). `TEST-WF-AUT-002-04` (L53401) makes divergence between this list
 * and the Frontline renderer list a **build failure**.
 *
 * DEC-CAP-001 is ADOPTED, not open. Both source readings still render, through
 * `DecisionDisclosure` and `DEC-CAP-001`.
 */
export type CaptureType =
  | 'measurement entry'
  | 'photo capture'
  | 'barcode or Quick Response code scan'
  | 'checkbox confirmation'
  | 'digital signature'
  | 'free text'
  | 'dropdown selection'
  /** Instruction-only screens. The eighth member, and the source's own word. */
  | 'none'

export const CAPTURE_TYPES = [
  'measurement entry',
  'photo capture',
  'barcode or Quick Response code scan',
  'checkbox confirmation',
  'digital signature',
  'free text',
  'dropdown selection',
  'none',
] as const satisfies readonly CaptureType[]

const _captureTypesExhaustive: Exclude<CaptureType, (typeof CAPTURE_TYPES)[number]> extends never ? true : never = true
void _captureTypesExhaustive

/**
 * The four Workflow settings, L32040: "Each Workflow carries four settings set
 * before screen authoring begins -- **name, Job Type, the optional Service
 * Type tag, and locale coverage** (English and Spanish at launch)".
 */
export type WorkflowSetting =
  | 'name'
  | 'Job Type'
  | 'optional Service Type tag'
  | 'locale coverage'

export const WORKFLOW_SETTINGS = [
  'name',
  'Job Type',
  'optional Service Type tag',
  'locale coverage',
] as const satisfies readonly WorkflowSetting[]

const _workflowSettingsExhaustive: Exclude<WorkflowSetting, (typeof WORKFLOW_SETTINGS)[number]> extends never ? true : never = true
void _workflowSettingsExhaustive

/**
 * **Exactly two**, L32040: "**exactly two** workflow-level defaults that every
 * screen inherits unless overridden: **the default escalation routing template
 * and the default coaching trigger percentage**. Deviation severity is never a
 * workflow default; it is always mapped explicitly per screen."
 *
 * The source's own sentence on the count, quoted because it is the reason this
 * set is closed rather than extensible: "The word 'exactly' is the source's own
 * and is load-bearing: an implementation that adds a third inheritable default,
 * however convenient, departs from the specification and must be raised as a
 * change request."
 *
 * **Severity is the obvious third and is the one thing forbidden by name.**
 */
export type InheritableDefault =
  /** "the default escalation routing template" (L32040). */
  | 'default-escalation-routing-template'
  /** "the default coaching trigger percentage" (L32040). */
  | 'default-coaching-trigger-percentage'

export const INHERITABLE_DEFAULTS = [
  'default-escalation-routing-template',
  'default-coaching-trigger-percentage',
] as const satisfies readonly InheritableDefault[]

const _inheritableDefaultsExhaustive: Exclude<InheritableDefault, (typeof INHERITABLE_DEFAULTS)[number]> extends never ? true : never = true
void _inheritableDefaultsExhaustive

/**
 * The nine screen-configuration sections, in section order, in the wording of
 * the source's own table at L32216-L32226. `MOD-STU-05` owns them.
 *
 * Section 7 is where the Severity 1 arming confirmation lives. §5.2.2 cites
 * "(5.5.9)", which is Tool and Equipment -- the off-by-one recorded as
 * `DEC-STUXREF-001` (L31869) and disclosed as DEC-STUXREF-001.
 */
export type ConfigurationSection =
  | 'Screen content'
  | 'Input type'
  | 'Timing'
  | 'Gate and proof'
  | 'Specification limits'
  | 'Coaching content'
  | 'Deviation rules and severity mapping'
  | 'Tool and equipment'
  | 'Qualification override'

export const CONFIGURATION_SECTIONS = [
  'Screen content',
  'Input type',
  'Timing',
  'Gate and proof',
  'Specification limits',
  'Coaching content',
  'Deviation rules and severity mapping',
  'Tool and equipment',
  'Qualification override',
] as const satisfies readonly ConfigurationSection[]

const _configurationSectionsExhaustive: Exclude<ConfigurationSection, (typeof CONFIGURATION_SECTIONS)[number]> extends never ? true : never = true
void _configurationSectionsExhaustive

/**
 * L32945: "Every screen's instruction content exists at three difficulty
 * levels -- **simple, standard, and expanded**." The level changes the depth
 * of explanation, never the required captures, gates, limits, or severity
 * mappings. Three levels by two locales is six reviewed renderings per screen.
 */
export type DifficultyLevel = 'simple' | 'standard' | 'expanded'

export const DIFFICULTY_LEVELS = [
  'simple',
  'standard',
  'expanded',
] as const satisfies readonly DifficultyLevel[]

const _difficultyLevelsExhaustive: Exclude<DifficultyLevel, (typeof DIFFICULTY_LEVELS)[number]> extends never ? true : never = true
void _difficultyLevelsExhaustive

/**
 * L34357: "multilingual by locale files -- English and Spanish at launch --
 * and **nothing is translated at run time, anywhere**". L34381 closes the set:
 * "Add a locale beyond English and Spanish | Explicitly prohibited -- two
 * languages at V1".
 */
export type Locale = 'English' | 'Spanish'

export const LOCALES = ['English', 'Spanish'] as const satisfies readonly Locale[]

const _localesExhaustive: Exclude<Locale, (typeof LOCALES)[number]> extends never ? true : never = true
void _localesExhaustive

/**
 * L32613: "**Channels** -- in-app and email, the platform's only notification
 * channels; other channels are outside launch scope". L32636 closes the set:
 * "Add a notification channel beyond in-app and email | Explicitly prohibited
 * -- two channels only at V1".
 */
export type NotificationChannel = 'in-app' | 'email'

export const NOTIFICATION_CHANNELS = [
  'in-app',
  'email',
] as const satisfies readonly NotificationChannel[]

const _notificationChannelsExhaustive: Exclude<NotificationChannel, (typeof NOTIFICATION_CHANNELS)[number]> extends never ? true : never = true
void _notificationChannelsExhaustive
