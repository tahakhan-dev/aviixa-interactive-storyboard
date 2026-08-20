import { ROLES, type RoleId } from '@/domain/roles'
import type { StudioScreenId } from '@/studio/screens'
import { COACHING_ASSET_STATES, LOCALES, NOTIFICATION_CHANNELS } from '@/studio/vocab'
import type { CoachingAssetState, Locale, NotificationChannel } from '@/studio/vocab'

/**
 * `MOD-STU-07` — the three libraries, their records, and every reader over
 * them. §5.7, card L32574-L32784.
 *
 * THE ONE PROPERTY THIS MODULE IS ABOUT (L32580, `AC-STU-071` L32763):
 * *"Items are authored or uploaded once and referenced from many screens via
 * pickers; screens hold pointers, so updating a library item propagates to
 * every screen that references it."* Everything below follows from that one
 * sentence, and so do both of its hazards:
 *
 * 1. **An edit here reaches screens the author is not looking at.** So
 *    `reuseImpact` is not a display convenience — `editLibraryItem` REFUSES
 *    an edit whose shown impact does not match the register's, so the
 *    author cannot make the change without having been shown what it
 *    reaches. See `writes.ts`.
 * 2. **A pointer can be left dangling.** So an archival with live
 *    references is refused and the referencing screens are NAMED
 *    (`AC-STU-077`, L32769), and a picker that fails to load never clears an
 *    existing pointer (`AC-STU-018`, L31098).
 *
 * EVERY READER TAKES ITS REGISTER AS A PARAMETER. Nothing here closes over
 * a module-load snapshot — that is the defect that shipped three times in
 * slice 4, and eighteen module screens call readers like these.
 *
 * DETERMINISM. No clock, no random source, no module-level mutable state.
 * `SEEDED_LIBRARY_REGISTER` is frozen data and every write returns a new
 * register rather than mutating it.
 *
 * NO `throw` ON ANY PATH. A screen that crashes on one bad row shows nothing
 * about the other rows; every failure is a typed result.
 */

/* ==================================================================== *
 * THE THREE LIBRARIES.
 * ==================================================================== */

export type LibraryId = 'containment-checklists' | 'coaching-corpus' | 'escalation-routing'

export const LIBRARY_IDS = [
  'containment-checklists',
  'coaching-corpus',
  'escalation-routing',
] as const satisfies readonly LibraryId[]

type MissingFromLibraries = Exclude<LibraryId, (typeof LIBRARY_IDS)[number]>
const _librariesExhaustive: MissingFromLibraries extends never ? true : never = true
void _librariesExhaustive

/** Catalogue B, L48264-L48266. The three tabs of one route. */
export const LIBRARY_SCREEN_IDS = {
  'containment-checklists': 'SCR-STU-06',
  'coaching-corpus': 'SCR-STU-07',
  'escalation-routing': 'SCR-STU-08',
} as const satisfies Readonly<Record<LibraryId, StudioScreenId>>

/**
 * Catalogue A, L31074-L31076. Carried alongside catalogue B rather than
 * instead of it: the two catalogues name the same three screens with
 * different identifiers, and a screen that renders one and not the other
 * makes the cross-reference unfindable from whichever list the reader has.
 */
export const LIBRARY_CATALOGUE_A_IDS = {
  'containment-checklists': 'SCR-STU-CHECKLIST',
  'coaching-corpus': 'SCR-STU-CORPUS',
  'escalation-routing': 'SCR-STU-ROUTING',
} as const satisfies Readonly<Record<LibraryId, string>>

export const LIBRARY_NAMES = {
  'containment-checklists': 'Containment Checklist Library',
  'coaching-corpus': 'Coaching Corpus',
  'escalation-routing': 'Escalation Routing Templates',
} as const satisfies Readonly<Record<LibraryId, string>>

/* ==================================================================== *
 * STATES — L32647. Two vocabularies, deliberately not one.
 * ==================================================================== */

/**
 * Checklists and templates. **Coaching assets do NOT use this** — they carry
 * their own five states, which task 3 already closed at L32647 and which are
 * consumed here rather than re-declared. Folding the two into one vocabulary
 * would let a coaching asset be `Published` and a checklist be `Indexed`,
 * neither of which the source has a meaning for.
 */
export type ItemLifecycleState = 'Draft' | 'Published' | 'Archived'

export const ITEM_LIFECYCLE_STATES = [
  'Draft',
  'Published',
  'Archived',
] as const satisfies readonly ItemLifecycleState[]

type MissingFromLifecycle = Exclude<ItemLifecycleState, (typeof ITEM_LIFECYCLE_STATES)[number]>
const _lifecycleExhaustive: MissingFromLifecycle extends never ? true : never = true
void _lifecycleExhaustive

/* ==================================================================== *
 * WHAT A SCREEN CAN POINT AT.
 * ==================================================================== */

export type PointerSlot =
  | 'containment-checklist'
  | 'coaching-default'
  | 'escalation-routing-template'

export const POINTER_SLOTS = [
  'containment-checklist',
  'coaching-default',
  'escalation-routing-template',
] as const satisfies readonly PointerSlot[]

type MissingFromSlots = Exclude<PointerSlot, (typeof POINTER_SLOTS)[number]>
const _slotsExhaustive: MissingFromSlots extends never ? true : never = true
void _slotsExhaustive

/** Which library fills each slot. A total map, so no slot has no library. */
export const SLOT_LIBRARY = {
  'containment-checklist': 'containment-checklists',
  'coaching-default': 'coaching-corpus',
  'escalation-routing-template': 'escalation-routing',
} as const satisfies Readonly<Record<PointerSlot, LibraryId>>

/* ==================================================================== *
 * THE AUDITED ACTIONS.
 * ==================================================================== */

/**
 * L32754 lists what writes to the tenant audit log: *"Item creation, edits,
 * review outcomes, archival, asset approval, flagging, retirement, and every
 * propagation event."*
 *
 * The tenth member is the one refusal the source asks to be recorded:
 * `TEST-STU-080` requires that an attempt to name an individual through the
 * application programming interface *"confirm refusal **and audit entry**"*.
 * The third-channel refusal (`AC-STU-076`) asks for no such entry and is not
 * given one — recording a refusal the source does not ask for would be an
 * invention, and the asymmetry is the source's, stated rather than smoothed.
 */
export type LibraryWriteAction =
  | 'create'
  | 'edit'
  | 'archive'
  | 'approve'
  | 'retire'
  | 'propose'
  | 'index'
  | 'reference'
  | 'set-routing-rule'
  | 'refused-named-individual'

export const LIBRARY_WRITE_ACTIONS = [
  'create',
  'edit',
  'archive',
  'approve',
  'retire',
  'propose',
  'index',
  'reference',
  'set-routing-rule',
  'refused-named-individual',
] as const satisfies readonly LibraryWriteAction[]

type MissingFromActions = Exclude<LibraryWriteAction, (typeof LIBRARY_WRITE_ACTIONS)[number]>
const _actionsExhaustive: MissingFromActions extends never ? true : never = true
void _actionsExhaustive

/* ==================================================================== *
 * THE FOUR PROPERTIES THAT KEEP THE CORPUS SAFE — L32599-L32602.
 * ==================================================================== */

export interface CorpusProperty {
  readonly id:
    | 'curation-is-retained'
    | 'retrieval-is-hybrid'
    | 'a-default-is-retained'
    | 'retrieval-quality-is-evaluated'
  readonly heading: string
  /** The source's own words for the property, kept verbatim. */
  readonly quotation: string
  readonly sourceRef: string
}

export const CORPUS_PROPERTIES = [
  {
    id: 'curation-is-retained',
    heading: 'Curation is retained',
    quotation:
      'Only approved content enters the corpus; the agent selects only from what the quality team sanctioned. Embeddings change how an asset is found, never whether it was approved.',
    sourceRef: 'L32599',
  },
  {
    id: 'retrieval-is-hybrid',
    heading: 'Retrieval is hybrid',
    quotation:
      'A metadata filter narrows the corpus before semantic ranking, so a torque clip cannot surface on a paint screen.',
    sourceRef: 'L32600',
  },
  {
    id: 'a-default-is-retained',
    heading: 'A default is retained',
    quotation:
      'Each screen or failure type keeps a curated fallback asset per locale for cold start, before there is effectiveness data to learn from.',
    sourceRef: 'L32601',
  },
  {
    id: 'retrieval-quality-is-evaluated',
    heading: 'Retrieval quality is evaluated',
    quotation:
      'Retrieval behaviour is checked against scenario evaluations from day one, exactly like every other agent capability.',
    sourceRef: 'L32602',
  },
] as const satisfies readonly CorpusProperty[]

type MissingFromCorpusProperties = Exclude<
  CorpusProperty['id'],
  (typeof CORPUS_PROPERTIES)[number]['id']
>
const _corpusPropertiesExhaustive: MissingFromCorpusProperties extends never ? true : never = true
void _corpusPropertiesExhaustive

/* ==================================================================== *
 * THE THREE THINGS A ROUTING RULE NAMES — L32612-L32614.
 * ==================================================================== */

export interface RoutingRuleField {
  readonly id: 'recipient-roles' | 'channels' | 'response-behaviour'
  readonly heading: string
  readonly quotation: string
  /** The parts the source enumerates inside this field, in its order. */
  readonly parts: readonly string[]
  readonly sourceRef: string
}

export const ROUTING_RULE_FIELDS = [
  {
    id: 'recipient-roles',
    heading: 'Recipient roles',
    quotation:
      'Recipient roles — never named individuals, for example Line Supervisor, Quality Manager.',
    parts: [],
    sourceRef: 'L32612',
  },
  {
    id: 'channels',
    heading: 'Channels',
    quotation:
      'Channels — in-app and email, the platform’s only notification channels; other channels are outside launch scope.',
    parts: [...NOTIFICATION_CHANNELS],
    sourceRef: 'L32613',
  },
  {
    id: 'response-behaviour',
    heading: 'Response behaviour',
    quotation:
      'Response behaviour — whether acknowledgement is required, the timeout to wait for it, the fallback recipients to escalate to if no acknowledgement arrives in time, and a dedupe window that groups a flood of related deviations into a single alert.',
    parts: ['acknowledgement required', 'timeout', 'fallback recipients', 'dedupe window'],
    sourceRef: 'L32614',
  },
] as const satisfies readonly RoutingRuleField[]

type MissingFromRuleFields = Exclude<
  RoutingRuleField['id'],
  (typeof ROUTING_RULE_FIELDS)[number]['id']
>
const _ruleFieldsExhaustive: MissingFromRuleFields extends never ? true : never = true
void _ruleFieldsExhaustive

/**
 * WHO A RULE MAY NAME. Derived from the role register rather than restated,
 * so a sixth tenant role could not appear here without appearing there —
 * and so this module cannot fork the five-role floor.
 *
 * The tenant security domain only: a platform console role is not a person
 * on a tenant's shift, and naming one would route a factory escalation to
 * somebody with no standing in that tenant at all.
 */
export const ESCALATION_RECIPIENT_ROLES: readonly RoleId[] = ROLES.filter(
  (role) => role.domain === 'TENANT',
).map((role) => role.id)

export function isEscalationRecipientRole(value: string): value is RoleId {
  return (ESCALATION_RECIPIENT_ROLES as readonly string[]).includes(value)
}

export function isNotificationChannel(value: string): value is NotificationChannel {
  return (NOTIFICATION_CHANNELS as readonly string[]).includes(value)
}

/**
 * The severity bands a rule is keyed on, and a checklist is tagged by. NOT a
 * vocabulary this module closes: the global severity catalog is a
 * platform-side object administered in the Super Admin console (L44467,
 * §8.7.2) and reaches the Studio through the `global-severity-catalog` seam.
 * These four are the seeded fixture that seam returns, read at L73143
 * ("Severity 1, Severity 2, Severity 3 and below") and L73154 ("Severity 4
 * of 4"). The screen renders the seam notice beside them rather than
 * presenting them as this module's own list.
 */
export const SEEDED_SEVERITY_BANDS: readonly string[] = [
  'Severity 1',
  'Severity 2',
  'Severity 3',
  'Severity 4',
]

/* ==================================================================== *
 * THE RECORDS. `OBJ-040`..`OBJ-043`, L8665-L8722.
 * ==================================================================== */

export interface ChecklistStep {
  readonly id: string
  readonly text: string
  /**
   * What this step would have to fetch from the server to render, or `null`.
   * A non-null value is what authoring REFUSES: under the adopted working
   * position of `DEC-CONTLAUNCH-001` the checklist launches locally from the
   * pinned package with no network, so *"a step that requires a server
   * lookup cannot be a launch-time step, and authoring must refuse it"*
   * (L32653).
   */
  readonly serverLookup: string | null
}

interface LibraryItemBase {
  readonly id: string
  readonly library: LibraryId
  readonly name: string
  readonly version: number
  /**
   * IMMUTABILITY OF PUBLISHED CONTENT, made structural. Where an edit is
   * made to a `Published` item the original is never touched; a new record
   * is written carrying this pointer back to it. The source grants no
   * in-place edit of published content — *"the prior published item remains
   * in force"* (L32656) until review completes.
   */
  readonly supersedes: string | null
  /**
   * Set only once a successor has been RELEASED by the approval chain, which
   * is `MOD-STU-11`'s act and not this module's. Nothing here writes it, and
   * a screen reading it is reading a released succession, never a pending
   * one.
   */
  readonly supersededBy: string | null
}

export interface ChecklistItem extends LibraryItemBase {
  readonly library: 'containment-checklists'
  readonly state: ItemLifecycleState
  readonly severityBands: readonly string[]
  readonly serviceTypeTag: string | null
  readonly steps: readonly ChecklistStep[]
}

export interface CoachingAssetItem extends LibraryItemBase {
  readonly library: 'coaching-corpus'
  /** The five of L32647, consumed from `@/studio/vocab`, never re-declared. */
  readonly assetState: CoachingAssetState
  /**
   * THE APPROVAL FACT, kept apart from the state label — and this separation
   * IS `AC-STU-072` (L32764), *"indexing never changes approval state"*.
   *
   * The source's five states run `Uploaded, Approved, Indexed, Flagged for
   * review, Retired`, so successful indexing does move the STATE LABEL from
   * `Approved` to `Indexed`. If that label were the only record of approval,
   * the acceptance criterion would be untestable — there would be nothing
   * left that indexing must not touch. This field is that thing: written
   * only by `approveCoachingAsset` and `retireCoachingAsset`, both a Quality
   * Manager's audited decision, and by `indexCoachingAsset` on no path at
   * all. *"Embeddings change how an asset is found, never whether it was
   * approved"* (L32599).
   */
  readonly approved: boolean
  /**
   * Whether the asset is in the multimodal index. A flagged asset can still
   * be in the index — flagging is a curation signal, not a removal — which
   * is why this is not derived from `assetState`.
   */
  readonly indexed: boolean
  readonly locale: Locale
  readonly mediaKind: 'text' | 'image' | 'portable-document-format' | 'video'
  readonly screenTag: string
  readonly classificationTag: string
  /** Whether the quality team designated this the cold-start default. */
  readonly curatedDefault: boolean
  readonly containsIdentifiableWorkers: boolean
  readonly resolutionRate: number | null
}

export interface RoutingRule {
  readonly severityBand: string
  readonly recipientRoles: readonly RoleId[]
  readonly channels: readonly NotificationChannel[]
  readonly acknowledgementRequired: boolean
  readonly timeoutMinutes: number
  readonly fallbackRecipientRoles: readonly RoleId[]
  readonly dedupeWindowMinutes: number
}

export interface RoutingTemplateItem extends LibraryItemBase {
  readonly library: 'escalation-routing'
  readonly state: ItemLifecycleState
  readonly rules: readonly RoutingRule[]
}

export type LibraryItem = ChecklistItem | CoachingAssetItem | RoutingTemplateItem

/** A Workflow screen that holds a pointer. Not a catalogue-B Studio screen. */
export interface WorkflowScreenRef {
  readonly id: string
  readonly name: string
  readonly workflowId: string
  readonly workflowName: string
}

export interface ScreenPointer {
  readonly screenId: string
  readonly slot: PointerSlot
  /** The POINTER. A screen never holds a copy — `AC-STU-071`, L32763. */
  readonly itemId: string
}

export interface LibraryProposal {
  readonly id: string
  readonly itemId: string
  readonly proposedByIdentityId: string
  readonly summary: string
}

export interface LibraryRegister {
  readonly items: readonly LibraryItem[]
  readonly screens: readonly WorkflowScreenRef[]
  readonly pointers: readonly ScreenPointer[]
  readonly proposals: readonly LibraryProposal[]
}

/* ==================================================================== *
 * THE AUTHORING REFUSAL — one implementation, both callers.
 * ==================================================================== */

/**
 * Why this step cannot be a launch-time step, or `null` where it can.
 *
 * FIX ONCE, WHERE ALL CALLERS ROUTE. `createLibraryItem` and
 * `editLibraryItem` both call this; neither carries a second copy of the
 * rule. Two call sites before, two after — and a third caller gets the rule
 * by calling, not by re-deriving it.
 */
export function stepRefusalReason(step: ChecklistStep): string | null {
  if (step.serverLookup === null) return null
  return (
    `Step “${step.text}” requires a server lookup (${step.serverLookup}), so it cannot be a ` +
    'launch-time step. Under the adopted working position of DEC-CONTLAUNCH-001 the containment ' +
    'checklist launches locally on the device, from the version-pinned work package, at the ' +
    'instant of classification and with no network required — so every step must be fully ' +
    'renderable from the package with no server call, and authoring refuses one that is not ' +
    '(L32653). Nothing was written.'
  )
}

/* ==================================================================== *
 * READERS. Every one takes its register as a parameter.
 * ==================================================================== */

export function itemById(register: LibraryRegister, itemId: string): LibraryItem | undefined {
  return register.items.find((item) => item.id === itemId)
}

export function itemsInLibrary(
  register: LibraryRegister,
  library: LibraryId,
): readonly LibraryItem[] {
  return register.items.filter((item) => item.library === library)
}

export function screenById(
  register: LibraryRegister,
  screenId: string,
): WorkflowScreenRef | undefined {
  return register.screens.find((screen) => screen.id === screenId)
}

/** Every pointer aimed at this item, from every screen and every slot. */
export function referencingPointers(
  register: LibraryRegister,
  itemId: string,
): readonly ScreenPointer[] {
  return register.pointers.filter((pointer) => pointer.itemId === itemId)
}

export interface ReuseImpact {
  readonly screenIds: readonly string[]
  readonly screenNames: readonly string[]
  readonly workflowIds: readonly string[]
  readonly workflowNames: readonly string[]
  readonly screenCount: number
  readonly workflowCount: number
}

/**
 * WHAT AN EDIT TO THIS ITEM WOULD REACH — the thing SB-STU-10 puts on every
 * row (*"the count of referencing screens, and the count of Workflows
 * affected"*, L32725) and the thing `editLibraryItem` refuses to proceed
 * without.
 *
 * Distinct screens, not pointers: one screen can hold two pointers at the
 * same item across two slots, and counting pointers would tell an author a
 * change reaches more screens than it does.
 */
export function reuseImpact(register: LibraryRegister, itemId: string): ReuseImpact {
  const pointers = referencingPointers(register, itemId)
  const screenIds: string[] = []
  const screenNames: string[] = []
  const workflowIds: string[] = []
  const workflowNames: string[] = []
  for (const pointer of pointers) {
    if (screenIds.includes(pointer.screenId)) continue
    screenIds.push(pointer.screenId)
    const screen = screenById(register, pointer.screenId)
    screenNames.push(screen?.name ?? pointer.screenId)
    if (screen !== undefined && !workflowIds.includes(screen.workflowId)) {
      workflowIds.push(screen.workflowId)
      workflowNames.push(screen.workflowName)
    }
  }
  return {
    screenIds,
    screenNames,
    workflowIds,
    workflowNames,
    screenCount: screenIds.length,
    workflowCount: workflowIds.length,
  }
}

export function screenPointer(
  register: LibraryRegister,
  screenId: string,
  slot: PointerSlot,
): string | null {
  const found = register.pointers.find((p) => p.screenId === screenId && p.slot === slot)
  return found?.itemId ?? null
}

/**
 * The item a screen's pointer resolves to. This is the propagation rule
 * itself: nothing is copied into the screen, so whatever the item says now
 * is what every referencing screen shows now.
 */
export function resolvePointer(
  register: LibraryRegister,
  screenId: string,
  slot: PointerSlot,
): LibraryItem | null {
  const itemId = screenPointer(register, screenId, slot)
  if (itemId === null) return null
  return itemById(register, itemId) ?? null
}

/** True where the item is the one currently in force on the floor. */
export function isInForce(item: LibraryItem): boolean {
  return item.library === 'coaching-corpus'
    ? item.approved && item.assetState !== 'Retired'
    : item.state === 'Published'
}

/**
 * Locale coverage for a screen's coaching defaults. `AC-STU-074` (L32766)
 * blocks publication where a declared locale has no curated default — the
 * CHECK is `MOD-STU-05`'s (`coaching-default-per-locale`), and this module
 * supplies the reading it runs over.
 */
export function curatedDefaultCoverage(
  register: LibraryRegister,
  screenTag: string,
): readonly { readonly locale: Locale; readonly itemId: string | null }[] {
  return LOCALES.map((locale) => {
    const found = itemsInLibrary(register, 'coaching-corpus').find(
      (item) =>
        item.library === 'coaching-corpus' &&
        item.curatedDefault &&
        item.locale === locale &&
        item.screenTag === screenTag,
    )
    return { locale, itemId: found?.id ?? null }
  })
}

/* ==================================================================== *
 * THE SEEDED REGISTER. Bright Bikes, the source's own illustrative tenant,
 * and its Torque Out-of-Tolerance Response checklist (L32731).
 *
 * The storyboard is browser-only and has no network, so the multimodal
 * index is a seeded fixture with an explicit NOT INDEXED state
 * (`multimodal-embedding-service`, an unscheduled seam). That is what makes
 * the simulation honest rather than a claim of a capability nothing here
 * performs.
 * ==================================================================== */

export const SEEDED_LIBRARY_REGISTER: LibraryRegister = {
  items: [
    {
      id: 'CHK-TORQUE-RESPONSE',
      library: 'containment-checklists',
      name: 'Torque Out-of-Tolerance Response',
      version: 3,
      supersedes: null,
      supersededBy: null,
      state: 'Published',
      severityBands: ['Severity 1', 'Severity 2'],
      serviceTypeTag: 'Assembly',
      steps: [
        { id: 'CHK-TORQUE-1', text: 'Stop the line and quarantine the unit', serverLookup: null },
        { id: 'CHK-TORQUE-2', text: 'Photograph the fastener and the torque display', serverLookup: null },
        { id: 'CHK-TORQUE-3', text: 'Record the observed torque value', serverLookup: null },
      ],
    },
    {
      id: 'CHK-COOLANT-DRAFT',
      library: 'containment-checklists',
      name: 'Coolant Overflow Response',
      version: 1,
      supersedes: null,
      supersededBy: null,
      state: 'Draft',
      severityBands: ['Severity 3'],
      serviceTypeTag: null,
      steps: [{ id: 'CHK-COOLANT-1', text: 'Contain the spill', serverLookup: null }],
    },
    {
      id: 'CHK-PAINT-OVERSPRAY',
      library: 'containment-checklists',
      name: 'Overspray Containment',
      version: 1,
      supersedes: null,
      supersededBy: null,
      state: 'Draft',
      severityBands: ['Severity 4'],
      serviceTypeTag: 'Finishing',
      steps: [{ id: 'CHK-PAINT-1', text: 'Mask the adjacent panel', serverLookup: null }],
    },
    {
      id: 'CHK-LEGACY-ARCHIVED',
      library: 'containment-checklists',
      name: 'Legacy Fastener Response',
      version: 2,
      supersedes: null,
      supersededBy: null,
      state: 'Archived',
      severityBands: ['Severity 2'],
      serviceTypeTag: null,
      steps: [{ id: 'CHK-LEGACY-1', text: 'Escalate to the line supervisor', serverLookup: null }],
    },
    {
      id: 'AST-TORQUE-ANGLE-ES',
      library: 'coaching-corpus',
      name: 'Torque photograph camera angle (Spanish)',
      version: 1,
      supersedes: null,
      supersededBy: null,
      assetState: 'Approved',
      approved: true,
      indexed: false,
      locale: 'Spanish',
      mediaKind: 'video',
      screenTag: 'torque-photograph',
      classificationTag: 'evidence-quality',
      curatedDefault: true,
      containsIdentifiableWorkers: true,
      resolutionRate: null,
    },
    {
      id: 'AST-TORQUE-ANGLE-EN',
      library: 'coaching-corpus',
      name: 'Torque photograph camera angle (English)',
      version: 2,
      supersedes: null,
      supersededBy: null,
      assetState: 'Indexed',
      approved: true,
      indexed: true,
      locale: 'English',
      mediaKind: 'video',
      screenTag: 'torque-photograph',
      classificationTag: 'evidence-quality',
      curatedDefault: true,
      containsIdentifiableWorkers: true,
      resolutionRate: 0.81,
    },
    {
      id: 'AST-PAINT-DEPTH-EN',
      library: 'coaching-corpus',
      name: 'Reading the paint depth gauge (English)',
      version: 1,
      supersedes: null,
      supersededBy: null,
      assetState: 'Uploaded',
      approved: false,
      indexed: false,
      locale: 'English',
      mediaKind: 'image',
      screenTag: 'paint-depth',
      classificationTag: 'measurement-technique',
      curatedDefault: false,
      containsIdentifiableWorkers: false,
      resolutionRate: null,
    },
    {
      id: 'AST-STALE-CLIP-EN',
      library: 'coaching-corpus',
      name: 'Fastener seating (English, 2024 line)',
      version: 1,
      supersedes: null,
      supersededBy: null,
      assetState: 'Flagged for review',
      approved: true,
      indexed: true,
      locale: 'English',
      mediaKind: 'video',
      screenTag: 'torque-photograph',
      classificationTag: 'evidence-quality',
      curatedDefault: false,
      containsIdentifiableWorkers: false,
      resolutionRate: 0.12,
    },
    {
      id: 'ROU-SEVERITY-BANDS',
      library: 'escalation-routing',
      name: 'Assembly line escalation',
      version: 4,
      supersedes: null,
      supersededBy: null,
      state: 'Published',
      rules: [
        {
          severityBand: 'Severity 1',
          recipientRoles: ['SUPERVISOR', 'QUALITY_MANAGER'],
          channels: ['in-app', 'email'],
          acknowledgementRequired: true,
          timeoutMinutes: 10,
          fallbackRecipientRoles: ['QUALITY_MANAGER'],
          dedupeWindowMinutes: 20,
        },
      ],
    },
    {
      id: 'ROU-DEFAULT',
      library: 'escalation-routing',
      name: 'Workflow default routing',
      version: 1,
      supersedes: null,
      supersededBy: null,
      state: 'Draft',
      rules: [
        {
          severityBand: 'Severity 2',
          recipientRoles: ['SUPERVISOR'],
          channels: ['in-app'],
          acknowledgementRequired: true,
          timeoutMinutes: 15,
          fallbackRecipientRoles: ['QUALITY_MANAGER'],
          dedupeWindowMinutes: 30,
        },
      ],
    },
  ],
  screens: [
    {
      id: 'SCR-WF-TORQUE-PHOTO',
      name: 'Torque photograph',
      workflowId: 'WF-TORQUE',
      workflowName: 'Torque Verification',
    },
    {
      id: 'SCR-WF-TORQUE-FINAL',
      name: 'Final fastener check',
      workflowId: 'WF-TORQUE',
      workflowName: 'Torque Verification',
    },
    {
      id: 'SCR-WF-PAINT-CURE',
      name: 'Cure time confirmation',
      workflowId: 'WF-PAINT',
      workflowName: 'Paint Line',
    },
    {
      id: 'SCR-WF-PAINT-MASK',
      name: 'Masking check',
      workflowId: 'WF-PAINT',
      workflowName: 'Paint Line',
    },
    {
      id: 'SCR-WF-PAINT-DEPTH',
      name: 'Paint depth measurement',
      workflowId: 'WF-PAINT',
      workflowName: 'Paint Line',
    },
  ],
  pointers: [
    { screenId: 'SCR-WF-TORQUE-PHOTO', slot: 'containment-checklist', itemId: 'CHK-TORQUE-RESPONSE' },
    { screenId: 'SCR-WF-TORQUE-FINAL', slot: 'containment-checklist', itemId: 'CHK-TORQUE-RESPONSE' },
    { screenId: 'SCR-WF-PAINT-CURE', slot: 'containment-checklist', itemId: 'CHK-COOLANT-DRAFT' },
    { screenId: 'SCR-WF-PAINT-MASK', slot: 'containment-checklist', itemId: 'CHK-COOLANT-DRAFT' },
    {
      screenId: 'SCR-WF-TORQUE-PHOTO',
      slot: 'escalation-routing-template',
      itemId: 'ROU-SEVERITY-BANDS',
    },
    { screenId: 'SCR-WF-TORQUE-PHOTO', slot: 'coaching-default', itemId: 'AST-TORQUE-ANGLE-EN' },
  ],
  proposals: [],
}

export { COACHING_ASSET_STATES, LOCALES, NOTIFICATION_CHANNELS }
export type { CoachingAssetState, Locale, NotificationChannel }
