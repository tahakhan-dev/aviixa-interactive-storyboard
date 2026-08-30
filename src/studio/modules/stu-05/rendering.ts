import { permitsAction } from '@/policy/decision'
import type { StudioPersonaColumn } from '@/studio/access/evaluate'
import {
  SEEDED_LIBRARY_REGISTER,
  type LibraryRegister,
  type PointerSlot,
  type WorkflowScreenRef,
} from '@/studio/modules/stu-07/libraries'
import { openLibraryPicker, type PickerResult } from '@/studio/modules/stu-07/writes'
import type { AuthoringDraft } from '@/studio/modules/stu-10/seam'
import {
  SEEDED_TENANT,
  affordanceFor,
  type CapabilityAffordance,
} from '@/studio/modules/stu-18/rendering'
import { STU_SEAMS, stuSeamById, stuSeamStatus, type StudioSeamDefinition } from '@/studio/seams'
import { stu05Row, type Stu05RowId } from './matrix'
import {
  STU05_DEFAULT_CONTEXT,
  WHEEL_BOLT_CONFIGURATION,
  screenService,
  stu05Decision,
  type ScreenContext,
} from './sections'

/**
 * `MOD-STU-05`'s rendering rule — decided ONCE and read by every one of the
 * nine sections.
 *
 * ### WHY THIS IMPORTS `stu-18/rendering` RATHER THAN COPYING IT
 *
 * The six-token affordance rule (`allowed`/`allowedWithConditions` → enabled;
 * `readOnly`/`unavailable` → disabled carrying the CELL'S OWN WORDS;
 * `clientDecisionRequired` → both readings; `explicitlyProhibited` → ABSENT)
 * is a SURFACE rule, not a module one. A second copy here is the shape this
 * build has paid for repeatedly.
 *
 * ### NO DEAD CONTROLS, AND IT IS CHECKABLE
 *
 * Every control below names the `screenService` function it invokes. An
 * enabled control with no service key does not type-check, and the covering
 * test looks the key up in the service rather than trusting a handler that
 * might close over nothing. That is the difference between "a handler was
 * passed" and "the control does something".
 *
 * NO POLICY UNDER `src/ui/`. This file is under `src/studio/`, it computes
 * decisions, and the components it feeds only draw.
 */

export type Stu05Scenario = ScreenContext

export function stu05Scenario(over: Partial<Stu05Scenario> = {}): Stu05Scenario {
  return { ...STU05_DEFAULT_CONTEXT, ...over }
}

export { SEEDED_TENANT }
export type { CapabilityAffordance }

/* ==================================================================== *
 * THE CONTROLS THIS SCREEN OFFERS — one per matrix row that IS a control.
 * ==================================================================== */

export interface ScreenControl {
  readonly id: Stu05RowId
  readonly label: string
  readonly affordance: CapabilityAffordance
  /**
   * The `screenService` function this control invokes, or `null` where the
   * control is not drawn at all. Never a bound no-op: a control that renders
   * enabled and does nothing is the first defect this build shipped.
   */
  readonly serviceKey: keyof typeof screenService | null
  readonly sourceRefs: readonly string[]
}

/**
 * DO NOT INVENT A CONTROL. Every entry is one of the nine rows of the
 * source's own table.
 *
 * Row 1 ("Open the configuration panel") is NOT here: it is what the screen
 * IS, and the shell already answers it. Row 8 is not here either — it is a
 * statement about another surface, and `actionBundlePreview` renders it as a
 * READ rather than as a control anyone could click.
 *
 * Rows 5 and 6 ARE here, and they render as an ABSENCE with the rule stated.
 * That is deliberate: `AC-STU-155` requires an unavailable capability to be
 * shown with its reason rather than hidden, and `Explicitly prohibited`
 * carries no control anywhere — so a note stands where a control would be,
 * and the list is the same length for every persona.
 */
const CONTROL_ROWS = [
  'author-sections-one-through-nine',
  'choose-the-input-type',
  'set-a-hard-or-soft-proof-gate',
  'soften-the-platform-specification-gate',
  'define-a-new-severity-level',
  'map-a-band-to-a-catalog-level',
  'add-a-screen-level-qualification-override',
] as const satisfies readonly Stu05RowId[]

const CONTROL_LABELS = {
  'open-the-configuration-panel-on-a-draft-screen': 'Open the configuration panel',
  'author-sections-one-through-nine': 'Author this section',
  'choose-the-input-type': 'Choose the input type',
  'set-a-hard-or-soft-proof-gate': 'Set the proof gate',
  'soften-the-platform-specification-gate': 'Soften the specification gate',
  'define-a-new-severity-level': 'Define a new severity level',
  'map-a-band-to-a-catalog-level': 'Map a band to a catalog level',
  'edit-a-tenant-action-bundle': 'Edit the tenant action bundle',
  'add-a-screen-level-qualification-override': 'Add a qualification override',
} as const satisfies Readonly<Record<Stu05RowId, string>>

/**
 * Which service function each control invokes. `null` on the two rows that
 * are refused in all eight columns — and that is the honest answer rather
 * than an omission, because there is no function for an act the platform
 * refuses to anyone.
 */
const CONTROL_SERVICE = {
  'author-sections-one-through-nine': 'setInstruction',
  'choose-the-input-type': 'setInputType',
  'set-a-hard-or-soft-proof-gate': 'setGate',
  'soften-the-platform-specification-gate': null,
  'define-a-new-severity-level': null,
  'map-a-band-to-a-catalog-level': 'mapBand',
  'add-a-screen-level-qualification-override': 'setQualificationOverride',
} as const satisfies Readonly<
  Record<(typeof CONTROL_ROWS)[number], keyof typeof screenService | null>
>

export function screenControls(s: Stu05Scenario): readonly ScreenControl[] {
  return CONTROL_ROWS.map((id) => {
    const row = stu05Row(id)
    const decision = stu05Decision(id, s.persona, s)
    const affordance = affordanceFor(CONTROL_LABELS[id], decision)
    const serviceKey = affordance.kind === 'enabled' ? CONTROL_SERVICE[id] : null
    return { id, label: CONTROL_LABELS[id], affordance, serviceKey, sourceRefs: row.sourceRefs }
  })
}

/* ==================================================================== *
 * ROW 8 — A CROSS-SURFACE STATEMENT, READ THROUGH THE DECLARED SEAM.
 * ==================================================================== */

export interface ActionBundlePreview {
  readonly level: string
  /** `§3.3`'s floor, which no tenant may remove or weaken (L32242). */
  readonly platformFloor: string
  /** What the tenant's own bundle adds, where this build can see it. */
  readonly bundleNote: string
  readonly seamId: string
  readonly owner: string
  readonly status: string
}

/**
 * `SB-STU-08`'s live consequence preview: "for each band, the catalog level,
 * the tenant's configured action bundle for that level, and, for Severity 1,
 * the platform floor stated in full."
 *
 * IT IS A READ, AND THE FAR SIDE DOES NOT EXIST. The bundle is owned by "the
 * tenant administration area" — no `MOD-DOH-*` identifier appears for it
 * anywhere, and `OBJ-049` sits in the object register with no owning module —
 * so the `severity-action-bundle-editor` seam carries `ownerSlices: []` and
 * this preview states what it can see and what it cannot. There is no editor
 * on any Studio route, and row 8 of this module's matrix is the statement of
 * exactly that.
 */
export function actionBundlePreview(
  level: string,
  seams: readonly StudioSeamDefinition[] = STU_SEAMS,
): ActionBundlePreview {
  const seam = stuSeamById(seams, 'severity-action-bundle-editor')
  const armsTheFloor = level === 'Severity 1'
  return {
    level,
    platformFloor: armsTheFloor
      ? 'Automatic lot freeze plus Quality-Manager-only release. Tenants may add actions to a ' +
        'bundle; they may never remove or weaken this floor (L32242, §3.3).'
      : 'No platform floor is fixed at this level; the tenant’s bundle is the whole consequence.',
    bundleNote: seam.contract,
    seamId: seam.id,
    owner: seam.owner,
    status: stuSeamStatus(seam),
  }
}

/* ==================================================================== *
 * THE LIBRARY REGISTER THIS SCREEN READS.
 * ==================================================================== */

/**
 * `MOD-STU-07`'s seeded register with THIS Workflow's screens registered in
 * it, because `setScreenPointer` refuses a pointer for a screen the register
 * does not know and `reuseImpact` names screens out of the same table. The
 * items, the pointers and the proposals are the library's own and are not
 * copied — only the screen references this Workflow contributes are added.
 */
const WORKFLOW_SCREENS: readonly WorkflowScreenRef[] = WHEEL_BOLT_CONFIGURATION.screens.map(
  (screen) => ({
    id: screen.screenId,
    name: screen.name,
    workflowId: 'WF-WHEEL-BOLT',
    workflowName: WHEEL_BOLT_CONFIGURATION.workflowName,
  }),
)

export const SCREEN_LIBRARY_REGISTER: LibraryRegister = {
  ...SEEDED_LIBRARY_REGISTER,
  screens: [...SEEDED_LIBRARY_REGISTER.screens, ...WORKFLOW_SCREENS],
}

/**
 * `MOD-STU-10`'s draft shape, holding THIS Workflow's work-instruction steps.
 *
 * The TYPE is task 13's and is consumed, not re-declared; the FIXTURE is this
 * module's, because `SEEDED_DRAFT` carries `MOD-STU-10`'s own two steps and
 * `stepReferences` throws on a step it does not hold — deliberately, so that
 * a typo cannot pass as "this step has no references". Mounting the mini-form
 * against a draft that does not contain the screen's step would be exactly
 * that typo, made permanent.
 */
export const SCREEN_PARTS_DRAFT: AuthoringDraft = {
  tenant: SEEDED_TENANT,
  steps: WHEEL_BOLT_CONFIGURATION.screens.map((screen) => ({
    stepId: screen.stepId,
    // Empty is the ORDINARY case: a step is never forced to carry a part
    // reference (`AC-STU-094`, L33218).
    references: [],
  })),
}

/**
 * Sections 6 and 7's picker, consumed from `MOD-STU-07` rather than rebuilt.
 * OPENING IT IS A READ: it writes nothing, and a picker that fails to load
 * never clears an existing pointer (`AC-STU-018`, L31098).
 */
export function sectionPickerOptions(
  register: LibraryRegister,
  screenId: string,
  slot: PointerSlot,
  load: 'succeeds' | 'fails' = 'succeeds',
): PickerResult {
  return openLibraryPicker({ register, screenId, slot, load })
}

/** Whether this persona may act on one row — the evaluator's answer, reused. */
export function permitsRow(
  id: Stu05RowId,
  persona: StudioPersonaColumn,
  s: Stu05Scenario = STU05_DEFAULT_CONTEXT,
): boolean {
  return permitsAction(stu05Decision(id, persona, s).decision)
}
