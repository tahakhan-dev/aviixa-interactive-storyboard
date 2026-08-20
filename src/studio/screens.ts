import type { StudioModuleId } from './modules'

/**
 * The SURF-STU spine, part 2 of 3: screen catalogue B, all fifteen rows.
 * Spec §3 D1, plan D1.
 *
 * CATALOGUE B (`SCR-STU-01`…`15`, L48259-L48273) IS THE ROUTE KEY'S
 * ANNOTATION. Unlike slice 4's `SCR-DOH-23`/`SCR-DOH-023` collision, the
 * Studio's two catalogues share no token — there is no three-digit form —
 * so they collide on COVERAGE, not identity. B wins because it is the only
 * catalogue carrying roles-that-can-open, module-and-feature and a
 * navigation entry point; because `AC-SCR-STU-001` (L48346) asserts all
 * fifteen exist; and because it is the only one with a Sign-in row and a
 * permissions screen, both of which the surface demonstrably needs.
 *
 * NAMES ARE CANONICAL; THE IDS ARE ANNOTATIONS, NEVER ROUTE KEYS. Routes
 * are keyed on the module slug (`@/studio/modules`). No three-digit
 * `SCR-STU-NNN` literal appears anywhere in this codebase.
 *
 * THIS CATALOGUE IS COMPLETE AND ITS GAPS ARE DECLARED RATHER THAN FILLED.
 * All fifteen rows are here, transcribed with the source's own module
 * column. Five modules — `MOD-STU-01`, `09`, `10`, `14`, `16` — appear in
 * no row of it, and each declares that on its own registry entry
 * (`uncataloguedScreen`) instead of borrowing the nearest id. Catalogue A's
 * three orphans are registered below as sub-views of their catalogue-B
 * parents, and the nineteen one-off storyboard literals are recorded as
 * names. **None of the twenty-two becomes a route.**
 */
export interface StudioScreenDefinition {
  readonly id: string
  /** The screen name, as the source's register writes it. */
  readonly name: string
  /** The register's own Purpose column. */
  readonly purpose: string
  /**
   * The register's own "Modules and features shown" column — the source's
   * link, not a derived one. Two rows carry more than one module and three
   * modules carry more than one row; neither is an error.
   */
  readonly moduleIds: readonly StudioModuleId[]
  /** The register's own "Navigation entry point" column. */
  readonly navigationEntryPoint: string
  readonly sourceRef: string
}

export const STU_SCREENS = [
  {
    id: 'SCR-STU-01',
    name: 'Sign-in',
    purpose: 'Authenticate into the authoring workspace',
    moduleIds: ['MOD-STU-18'],
    navigationEntryPoint: 'Application entry',
    sourceRef: 'L48259',
  },
  {
    id: 'SCR-STU-02',
    name: 'Workflow Library',
    purpose: 'Find, filter, and open Workflows by status and version',
    moduleIds: ['MOD-STU-03'],
    navigationEntryPoint: 'After sign-in',
    sourceRef: 'L48260',
  },
  {
    id: 'SCR-STU-03',
    name: 'Workflow Builder canvas',
    purpose: 'Assemble screen order and branches',
    moduleIds: ['MOD-STU-04'],
    navigationEntryPoint: 'Workflow Library',
    sourceRef: 'L48261',
  },
  {
    id: 'SCR-STU-04',
    name: 'Screen configuration panel',
    purpose: 'Configure one screen across the nine sections',
    moduleIds: ['MOD-STU-05'],
    navigationEntryPoint: 'Canvas, by selecting a node',
    sourceRef: 'L48262',
  },
  {
    id: 'SCR-STU-05',
    name: 'Shared Instruction Blocks',
    purpose: 'Author and apply Workflow-scoped shared content',
    moduleIds: ['MOD-STU-06'],
    navigationEntryPoint: 'Canvas',
    sourceRef: 'L48263',
  },
  {
    id: 'SCR-STU-06',
    name: 'Containment Checklist Library',
    purpose: 'Maintain containment checklists by severity applicability',
    moduleIds: ['MOD-STU-07'],
    navigationEntryPoint: 'Content Libraries',
    sourceRef: 'L48264',
  },
  {
    id: 'SCR-STU-07',
    name: 'Coaching Corpus',
    purpose: 'Curate approved coaching assets per language',
    moduleIds: ['MOD-STU-07'],
    navigationEntryPoint: 'Content Libraries',
    sourceRef: 'L48265',
  },
  {
    id: 'SCR-STU-08',
    name: 'Escalation Routing Templates',
    purpose: 'Author routing rules per severity level',
    moduleIds: ['MOD-STU-07'],
    navigationEntryPoint: 'Content Libraries',
    sourceRef: 'L48266',
  },
  {
    id: 'SCR-STU-09',
    name: 'Training Library management',
    purpose: 'Upload and version long-form training material',
    moduleIds: ['MOD-STU-08'],
    navigationEntryPoint: 'Workspace navigation',
    sourceRef: 'L48267',
  },
  {
    id: 'SCR-STU-10',
    name: 'Qualification Requirements',
    purpose: 'Set baselines and screen-level overrides across the workspace',
    moduleIds: ['MOD-STU-13'],
    navigationEntryPoint: 'Workspace navigation',
    sourceRef: 'L48268',
  },
  {
    id: 'SCR-STU-11',
    name: 'Approval queue and review preview',
    purpose: 'Review submissions screen by screen and decide',
    moduleIds: ['MOD-STU-11'],
    navigationEntryPoint: 'Workspace navigation',
    sourceRef: 'L48269',
  },
  {
    id: 'SCR-STU-12',
    name: 'Version history, difference, and linkage',
    purpose: 'Compare versions and see which Jobs are on which version',
    moduleIds: ['MOD-STU-12'],
    navigationEntryPoint: 'Workflow Library',
    sourceRef: 'L48270',
  },
  {
    id: 'SCR-STU-13',
    name: 'Agent configuration and Agent Builder',
    purpose: 'Configure the three agents and compose reasoning agents',
    // The source's own column, and only it. Catalogue B MERGES what
    // catalogue A splits into `SCR-STU-CAPS` and `SCR-STU-AGENT`, but it
    // names MOD-STU-02 and MOD-STU-15 and no others — MOD-STU-01 and
    // MOD-STU-16 are NOT on this row, and both declare their own absence
    // rather than being added here.
    moduleIds: ['MOD-STU-02', 'MOD-STU-15'],
    navigationEntryPoint: 'Workspace navigation',
    sourceRef: 'L48271',
  },
  {
    id: 'SCR-STU-14',
    name: 'Localisation coverage',
    purpose: 'See and fix locale completeness before publication',
    moduleIds: ['MOD-STU-17'],
    navigationEntryPoint: 'Workflow Builder',
    sourceRef: 'L48272',
  },
  {
    id: 'SCR-STU-15',
    name: 'Studio permissions and grants',
    purpose: 'Assign and revoke authoring and Agent Author grants',
    moduleIds: ['MOD-STU-18'],
    navigationEntryPoint: 'Workspace navigation',
    sourceRef: 'L48273',
  },
] as const satisfies readonly StudioScreenDefinition[]

export type StudioScreenId = (typeof STU_SCREENS)[number]['id']

/**
 * CATALOGUE A'S THREE ORPHANS, registered as sub-views rather than minted
 * as screen ids (D1). Each has a real catalogue-B parent, and a build that
 * gave any of them its own `SCR-STU-*` id would be inventing a sixteenth
 * screen the source's own `AC-SCR-STU-001` says does not exist.
 */
export interface StudioSubView {
  /** The catalogue-A name. Recorded, never promoted to a screen id. */
  readonly name: string
  readonly parentScreenId: StudioScreenId
  readonly note: string
  readonly sourceRef: string
}

export const STU_CATALOGUE_A_SUBVIEWS = [
  {
    name: 'SCR-STU-LEARN',
    parentScreenId: 'SCR-STU-13',
    note: 'The learning read view. Rendered on its own route (`/studio/learning/`) annotated SCR-STU-13, minting no new screen id — plan C12 settles the design’s own contradiction here.',
    sourceRef: 'L31086',
  },
  {
    name: 'SCR-STU-PARTADD',
    parentScreenId: 'SCR-STU-04',
    note: 'The inline part mini-form. An inline panel of the screen configuration panel; MOD-STU-10 has no route of its own because leaving the authoring context is what the module exists to avoid.',
    sourceRef: 'L31088',
  },
  {
    name: 'SCR-STU-DRAFTAI',
    parentScreenId: 'SCR-STU-11',
    note: 'The pre-approval editing surface, where an artificial-intelligence-assisted draft lands before submission. A state of the approval queue screen, not a screen.',
    sourceRef: 'L31089',
  },
] as const satisfies readonly StudioSubView[]

/**
 * THE NINETEEN ONE-OFF STORYBOARD NAMES, recorded so that nobody re-derives
 * them as screens and nobody promotes one to a route (D1). They are names
 * the source uses once or twice in a storyboard or a test table; they carry
 * no register row, no roles-that-can-open column and no navigation entry.
 *
 * Two of them — `SCR-STU-QUEUE` and `SCR-STU-PREVIEW` — ARE catalogue-A
 * rows as well (L31079, L31080), which the plan's own list of "literals
 * outside both catalogues" does not say. Both locators are recorded here
 * rather than the discrepancy being tidied away in either direction.
 */
export interface StudioUncataloguedScreenName {
  readonly name: string
  readonly sourceRef: string
  /** Non-null where the name is ALSO a catalogue-A row. */
  readonly alsoCatalogueA: string | null
}

export const STU_UNCATALOGUED_SCREEN_NAMES = [
  { name: 'SCR-STU-SCREENCFG', sourceRef: 'L11251', alsoCatalogueA: null },
  { name: 'SCR-STU-AGENTBUILDER', sourceRef: 'L12027', alsoCatalogueA: null },
  { name: 'SCR-STU-DEGRADE-01', sourceRef: 'L15086', alsoCatalogueA: null },
  { name: 'SCR-STU-GRANT-01', sourceRef: 'L16457', alsoCatalogueA: null },
  { name: 'SCR-STU-APPROVE', sourceRef: 'L20338', alsoCatalogueA: null },
  { name: 'SCR-STU-SCREEN-CONFIG', sourceRef: 'L61890', alsoCatalogueA: null },
  { name: 'SCR-STU-RELEASE', sourceRef: 'L62023, L68317', alsoCatalogueA: null },
  { name: 'SCR-STU-AGENTCFG', sourceRef: 'L68013', alsoCatalogueA: null },
  { name: 'SCR-STU-LIBRARIES', sourceRef: 'L68013', alsoCatalogueA: null },
  { name: 'SCR-STU-CAPABILITY', sourceRef: 'L68013', alsoCatalogueA: null },
  { name: 'SCR-STU-BUILDER', sourceRef: 'L68164', alsoCatalogueA: null },
  { name: 'SCR-STU-DIFFICULTY', sourceRef: 'L68164', alsoCatalogueA: null },
  { name: 'SCR-STU-QUALREQ', sourceRef: 'L68164', alsoCatalogueA: null },
  { name: 'SCR-STU-QUEUE', sourceRef: 'L68317', alsoCatalogueA: 'L31079 — the Approval Queue row' },
  {
    name: 'SCR-STU-PREVIEW',
    sourceRef: 'L68317',
    alsoCatalogueA: 'L31080 — the screen-by-screen review preview row',
  },
  { name: 'SCR-STU-PUBLISH', sourceRef: 'L68467', alsoCatalogueA: null },
  { name: 'SCR-STU-VERSIONS', sourceRef: 'L68467', alsoCatalogueA: null },
  { name: 'SCR-STU-VERSION-01', sourceRef: 'L93443', alsoCatalogueA: null },
  { name: 'SCR-STU-PUB-01', sourceRef: 'L100558', alsoCatalogueA: null },
] as const satisfies readonly StudioUncataloguedScreenName[]

/** Every reader takes its register as a parameter. */
export function stuScreenById(
  screens: readonly StudioScreenDefinition[],
  id: StudioScreenId,
): StudioScreenDefinition {
  const found = screens.find((s) => s.id === id)
  if (!found) throw new Error(`Unknown SURF-STU screen: ${id}`)
  return found
}

/**
 * The catalogue-B rows naming this module, in catalogue order — the
 * annotation a route renders. Empty for the five modules catalogue B does
 * not name; each of those carries `uncataloguedScreen` instead, and
 * `tests/component/stu-shell.test.tsx` asserts every module has exactly one
 * of the two, so an empty result can never be an unnoticed gap.
 */
export function stuScreensForModule(
  screens: readonly StudioScreenDefinition[],
  moduleId: StudioModuleId,
): readonly StudioScreenDefinition[] {
  return screens.filter((s) => (s.moduleIds as readonly string[]).includes(moduleId))
}
