import { permitsAction, permitsRead, type PermissionOutcome } from '@/policy/decision'
import {
  evaluateStudioAccess,
  type StudioAccessDecision,
  type StudioAccessInput,
} from '@/studio/access/evaluate'
import {
  PUBLISH_CHECKS,
  type PublishCheckDefinition,
  type PublishCheckId,
} from '@/studio/publish/checks'
import {
  createPublishCheckRegister,
  evaluatePublish,
  registerPublishChecks,
  type PublishCheckImplementation,
  type PublishCheckRegister,
} from '@/studio/publish/register'
import {
  isInForce,
  itemsInLibrary,
  type LibraryRegister,
} from '@/studio/modules/stu-07/libraries'
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
import type { InheritableDefault, WorkflowSetting } from '@/studio/vocab/authoring'
import { stu04Row, type Stu04CapabilityId, type Stu04MatrixRow } from './matrix'
import {
  DEFAULT_ORDER,
  PLATFORM_DEVIATION_CAPTURE_SCREEN,
  SETTING_ORDER,
  drawnOrder,
  nodeById,
  validateStructure,
  type CanvasRegister,
  type WorkflowDraft,
} from './workflow'
import type { BuilderWriteAction } from './writes'

/**
 * `MOD-STU-04`'s rendering rule — decided ONCE and read by the canvas, the
 * settings panel and the validation panel alike.
 *
 * ### WHY THIS IMPORTS `stu-18/rendering` RATHER THAN COPYING IT
 *
 * The six-token affordance rule is a SURFACE rule, not a module one. A
 * second copy here is the shape this build has paid for repeatedly — a fix
 * that reaches one caller of two — so `affordanceFor`, `studioIdentityFor`
 * and `studioGrantsFor` are consumed, not forked. (They are named for the
 * module that first needed them and belong in a shared
 * `src/studio/rendering.ts`; lifting them would edit files this task does
 * not own, so it is reported rather than done — the same finding
 * `MOD-STU-07` recorded.)
 *
 * ### THE TWO READS — R15, AND THE ONLY PART OF THIS FILE THAT IS NEW
 *
 * `draftCanvasFor` and `publishedCanvasFor` are two functions over two
 * collections, not one function with a flag. Row 1 of the matrix prohibits
 * the Supervisor-without-the-grant and the Tenant Admin from the DRAFT
 * canvas; row 2 gives them the PUBLISHED one read-only. A single component
 * behind a `readOnly` prop satisfies row 2 and breaks row 1, because it has
 * already loaded the draft by the time anything decides. So the refusal
 * happens BEFORE `register.drafts` is touched, and the covering test counts
 * the accesses.
 *
 * ### SCOPE IS ENFORCED IN WHAT THE SCREEN READS
 *
 * `readableWorkflows` filters the DATA, not the markup. `AC-STU-048`
 * (L32013) and `AC-STU-151` (L34668) both say drafts are *invisible* to
 * roles without the grant, and a list that loads every draft and then hides
 * some has already put them in the response.
 *
 * NO POLICY UNDER `src/ui/`. This file is under `src/studio/`, it computes
 * decisions, and the component it feeds only draws.
 *
 * DETERMINISM: no clock, no random source, no module-level mutable state.
 */

export { SEEDED_TENANT }
export type { CapabilityAffordance }

export type Stu04Scenario = Stu18Scenario

export function scenario(over: Partial<Stu04Scenario> = {}): Stu04Scenario {
  return { ...SEEDED_SCENARIO, ...over }
}

/**
 * THE ONE ACCESS CALL THIS MODULE MAKES. Every control and both canvas reads
 * route through here, PER CONTROL, over that control's own matrix row —
 * never over a module-level role list.
 */
export function decisionForRow(row: Stu04MatrixRow, s: Stu04Scenario): StudioAccessDecision {
  const input: StudioAccessInput = {
    row,
    identity: studioIdentityFor(s.persona),
    grants: studioGrantsFor(s),
    commercialTier: s.commercialTier,
    identityLayer: s.identityLayer,
    state: SEEDED_STATE,
    online: s.online,
    resourceTenant: SEEDED_TENANT,
    authorOfRecord: null,
    reviewerOfRecord: null,
    releaseAuthorityOfRecord: null,
  }
  return evaluateStudioAccess(input)
}

/**
 * The rendering for ONE control, with task 11's routed-prohibition branch.
 *
 * The disabled control is rendered ONLY where the routed capability's own
 * decision actually PERMITS ACTING. On this matrix that check does real
 * work: row 1 routes the three read-only columns to row 2, and row 2 is
 * `Read-only`, which is not an action — so the pointer resolves to nothing
 * to click and the control collapses to ABSENT, which is correct, because
 * opening a draft canvas is a capability those personas never hold.
 *
 * Handed decisions; computes no permission of its own.
 */
export function builderAffordance(
  label: string,
  decision: StudioAccessDecision,
  routedTo: Stu04CapabilityId | null,
  routedDecision: StudioAccessDecision | null,
): CapabilityAffordance {
  if (
    decision.outcome === 'explicitlyProhibited' &&
    routedTo !== null &&
    routedDecision !== null &&
    permitsAction(routedDecision.decision)
  ) {
    return {
      kind: 'disabled',
      label,
      reason:
        `${decision.reason} ${CONTROL_LABELS[routedTo]} is open to you instead and is enabled ` +
        'beside this one.',
    }
  }
  return affordanceFor(label, decision)
}

const CONTROL_LABELS = {
  'open-the-canvas-for-a-draft-workflow': 'Open the draft canvas',
  'open-the-canvas-read-only-for-a-published-version': 'Open the published canvas, read-only',
  'set-the-four-workflow-settings': 'Set the Workflow settings',
  'set-the-default-escalation-routing-template': 'Set the default escalation routing template',
  'set-the-default-coaching-trigger-percentage': 'Set the default coaching trigger percentage',
  'set-a-workflow-level-default-severity': 'Set a workflow-level default severity',
  'add-remove-and-reorder-screen-nodes': 'Add, remove and reorder screens',
  'draw-a-conditional-branch': 'Draw a conditional branch',
  'override-the-platform-standard-gate-failure-target': 'Override the gate-failure target',
  'preview-the-sequence': 'Preview Sequence',
} as const satisfies Readonly<Record<Stu04CapabilityId, string>>

/**
 * `FUNC-STU-04-01-C-1` renders here and nowhere else. Row 6 is refused in
 * all eight columns with no alternative anywhere on this screen, so the
 * screen states the rule in prose and offers nothing to click. A disabled
 * control would imply a condition that could one day become true.
 */
export const SEVERITY_PROHIBITION_NOTE =
  'Severity is never a workflow default; it is always mapped explicitly per screen, so no screen ' +
  'inherits a consequence nobody chose for it (L32040, FUNC-STU-04-01-C-1). There is no control ' +
  'here and no application programming interface route behind one: AC-STU-055 closes both.'

export const VALIDATION_PANEL_HEADING =
  'This drawing is also the sequence-detection reference used at run time.'

/* ==================================================================== *
 * THE CONTROLS.
 *
 * DO NOT INVENT A CONTROL. Every entry is one of the source's own ten rows.
 * Rows 1 and 2 are not controls — they are what the screen READS, and scope
 * is enforced there rather than in what is drawn. Row 6 appears on no
 * panel at all.
 * ==================================================================== */

export interface TargetOption {
  readonly id: string
  readonly label: string
}

export interface BuilderControlDefinition {
  readonly id: string
  readonly capabilityId: Stu04CapabilityId
  readonly label: string
  /** The write this control performs, or `null` where it only reads. */
  readonly action: BuilderWriteAction | null
  /** The setting or default this control writes, where it writes one. */
  readonly setting: WorkflowSetting | null
  readonly inheritableDefault: InheritableDefault | null
  /**
   * L48332 — *"the canvas is operable without a pointing device, with branch
   * targets selectable from a list as well as by drag."* Every control that
   * has targets publishes them as a LIST; the drag is the alternative, not
   * the only route.
   */
  readonly targetOptions: (workflow: WorkflowDraft) => readonly TargetOption[]
}

const NO_TARGETS = (): readonly TargetOption[] => []

/** Every screen in the drawn order, plus the platform-standard form. */
function branchTargetOptions(workflow: WorkflowDraft): readonly TargetOption[] {
  return [
    ...drawnOrder(workflow).map((id) => ({ id, label: nodeById(workflow, id)?.name ?? id })),
    {
      id: PLATFORM_DEVIATION_CAPTURE_SCREEN,
      label: 'Platform-standard deviation-capture screen (carried in the offline package)',
    },
  ]
}

export const BUILDER_CONTROLS = [
  ...SETTING_ORDER.map((setting) => ({
    id: `setting:${setting}`,
    capabilityId: 'set-the-four-workflow-settings' as const,
    label: `Set ${setting}`,
    action: 'set-workflow-setting' as const,
    setting,
    inheritableDefault: null,
    targetOptions: NO_TARGETS,
  })),
  ...DEFAULT_ORDER.map((inheritableDefault) => ({
    id: `default:${inheritableDefault}`,
    capabilityId:
      inheritableDefault === 'default-escalation-routing-template'
        ? ('set-the-default-escalation-routing-template' as const)
        : ('set-the-default-coaching-trigger-percentage' as const),
    label: `Set ${inheritableDefault.replace(/-/g, ' ')}`,
    action: 'set-inheritable-default' as const,
    setting: null,
    inheritableDefault,
    targetOptions: NO_TARGETS,
  })),
  {
    id: 'canvas:add',
    capabilityId: 'add-remove-and-reorder-screen-nodes',
    label: 'Add screen',
    action: 'add-screen-node',
    setting: null,
    inheritableDefault: null,
    targetOptions: NO_TARGETS,
  },
  {
    id: 'canvas:remove',
    capabilityId: 'add-remove-and-reorder-screen-nodes',
    label: 'Remove screen',
    action: 'remove-screen-node',
    setting: null,
    inheritableDefault: null,
    targetOptions: NO_TARGETS,
  },
  {
    id: 'canvas:move-earlier',
    capabilityId: 'add-remove-and-reorder-screen-nodes',
    label: 'Move screen earlier',
    action: 'reorder-screen-nodes',
    setting: null,
    inheritableDefault: null,
    targetOptions: NO_TARGETS,
  },
  {
    id: 'canvas:move-later',
    capabilityId: 'add-remove-and-reorder-screen-nodes',
    label: 'Move screen later',
    action: 'reorder-screen-nodes',
    setting: null,
    inheritableDefault: null,
    targetOptions: NO_TARGETS,
  },
  {
    id: 'canvas:branch',
    capabilityId: 'draw-a-conditional-branch',
    label: 'Draw a conditional branch',
    action: 'draw-branch',
    setting: null,
    inheritableDefault: null,
    targetOptions: branchTargetOptions,
  },
  {
    id: 'canvas:gate-failure',
    capabilityId: 'override-the-platform-standard-gate-failure-target',
    label: 'Override the gate-failure target',
    action: 'override-gate-failure-target',
    setting: null,
    inheritableDefault: null,
    targetOptions: branchTargetOptions,
  },
  {
    id: 'canvas:preview',
    capabilityId: 'preview-the-sequence',
    label: 'Preview Sequence',
    action: null,
    setting: null,
    inheritableDefault: null,
    targetOptions: NO_TARGETS,
  },
] as const satisfies readonly BuilderControlDefinition[]

export interface BuilderControl extends BuilderControlDefinition {
  readonly affordance: CapabilityAffordance
  readonly sourceRefs: readonly string[]
}

/**
 * The controls this persona meets, each with its own decision.
 *
 * The LIST is the same for every persona; what varies is each control's
 * affordance. That is the difference between enforcing scope in what a
 * screen reads and enforcing it in what it draws — and for a read-only role
 * every editing affordance comes back `absent`, which is L32171's
 * requirement that read-only roles get "a rendered view with no editing
 * affordances rather than a disabled editor".
 */
export function builderControls(s: Stu04Scenario): readonly BuilderControl[] {
  return BUILDER_CONTROLS.map((control) => {
    const row = stu04Row(control.capabilityId)
    const decision = decisionForRow(row, s)
    const routedTo = row.routedTo[s.persona]
    const routedDecision = routedTo === null ? null : decisionForRow(stu04Row(routedTo), s)
    return {
      ...control,
      affordance: builderAffordance(control.label, decision, routedTo, routedDecision),
      sourceRefs: row.sourceRefs,
    }
  })
}

/* ==================================================================== *
 * THE TWO READS.
 * ==================================================================== */

export type CanvasOpen =
  | {
      readonly ok: true
      readonly outcome: PermissionOutcome
      readonly cause: string
      readonly workflow: WorkflowDraft
      readonly editable: boolean
    }
  | { readonly ok: false; readonly outcome: PermissionOutcome; readonly cause: string }

/**
 * ROW 1. A persona this refuses never reaches `register.drafts` — the draft
 * is not read, not read-and-hidden and not read-and-disabled.
 */
export function draftCanvasFor(
  s: Stu04Scenario,
  register: CanvasRegister,
  workflowId: string,
): CanvasOpen {
  const decision = decisionForRow(stu04Row('open-the-canvas-for-a-draft-workflow'), s)
  if (!permitsAction(decision.decision)) {
    return { ok: false, outcome: decision.outcome, cause: decision.reason }
  }
  const workflow = register.drafts.find((w) => w.id === workflowId)
  if (workflow === undefined) {
    return {
      ok: false,
      outcome: 'notApplicable',
      cause: `No Draft Workflow ${workflowId} exists in this workspace.`,
    }
  }
  return { ok: true, outcome: decision.outcome, cause: decision.reason, workflow, editable: true }
}

/**
 * ROW 2. `Read-only` is a READ, so this permits where `draftCanvasFor`
 * refuses — and `editable` is derived from the same decision rather than
 * from a caller's flag.
 */
export function publishedCanvasFor(
  s: Stu04Scenario,
  register: CanvasRegister,
  workflowId: string,
): CanvasOpen {
  const decision = decisionForRow(
    stu04Row('open-the-canvas-read-only-for-a-published-version'),
    s,
  )
  if (!permitsRead(decision.decision)) {
    return { ok: false, outcome: decision.outcome, cause: decision.reason }
  }
  const workflow = register.published.find((w) => w.id === workflowId)
  if (workflow === undefined) {
    return {
      ok: false,
      outcome: 'notApplicable',
      cause: `No Published version of ${workflowId} exists.`,
    }
  }
  return {
    ok: true,
    outcome: decision.outcome,
    cause: decision.reason,
    workflow,
    editable: permitsAction(decision.decision),
  }
}

export interface ReadableWorkflows {
  readonly workflows: readonly WorkflowDraft[]
  /** How many the register holds that this view may not read. */
  readonly withheldCount: number
  /** Never blank where anything is withheld — `AC-STU-155`. */
  readonly withheldReason: string | null
}

/**
 * WHICH WORKFLOWS THIS VIEW MAY READ — the filter applied to the DATA.
 *
 * The two reads above answer one workflow each; this answers the list the
 * canvas offers, and it is the same rule: a persona refused the draft canvas
 * never has a draft in its response.
 */
export function readableWorkflows(s: Stu04Scenario, register: CanvasRegister): ReadableWorkflows {
  const draftDecision = decisionForRow(stu04Row('open-the-canvas-for-a-draft-workflow'), s)
  const publishedDecision = decisionForRow(
    stu04Row('open-the-canvas-read-only-for-a-published-version'),
    s,
  )
  const published = permitsRead(publishedDecision.decision) ? register.published : []

  if (permitsAction(draftDecision.decision)) {
    return { workflows: [...register.drafts, ...published], withheldCount: 0, withheldReason: null }
  }
  return {
    workflows: published,
    withheldCount: register.drafts.length,
    withheldReason:
      `${draftDecision.reason} Drafts and in-review versions are not read by this view at all, ` +
      'rather than read and then hidden (AC-STU-048, AC-STU-151).',
  }
}

/* ==================================================================== *
 * C4 — THE RIGHT PANEL READS TASK 5's REGISTRY AND IMPLEMENTS CHECK #1.
 * ==================================================================== */

/**
 * The ONE check `MOD-STU-04` owns. It calls `validateStructure`, the same
 * walk the canvas draws from, so the panel and the canvas cannot disagree.
 *
 * Checks 2 and 5 belong to `MOD-STU-05` and check 6 to `MOD-STU-17`. This
 * module implementing one of them would be a defect, and
 * `registerPublishChecks` refuses it as `not-an-owner` rather than
 * accepting it silently.
 */
export const STRUCTURAL_VALIDITY_CHECK: PublishCheckImplementation<WorkflowDraft> = {
  checkId: 'structural-validity',
  implementedBy: 'MOD-STU-04',
  run: (workflow) => {
    const validation = validateStructure(workflow)
    if (validation.valid) return { outcome: 'passed' }
    return {
      outcome: 'blocked',
      blockingElement: validation.blockers.map((b) => b.element).join('; '),
    }
  },
}

/**
 * A NEW register every call. There is no module-level register on purpose:
 * a module-load snapshot read by a function that closed over it is the
 * defect this build shipped three times in slice 4.
 */
export function builderCheckRegister(): PublishCheckRegister<WorkflowDraft> {
  const result = registerPublishChecks(
    createPublishCheckRegister<WorkflowDraft>(),
    STRUCTURAL_VALIDITY_CHECK,
  )
  if (!result.ok) {
    throw new Error(
      `MOD-STU-04 could not register its own publish check (${result.failure}). The register is ` +
        'the authority on ownership and this module owns structural-validity alone.',
    )
  }
  return result.register
}

export interface ValidationPanelItem {
  readonly checkId: PublishCheckId
  readonly ordinal: number
  readonly name: string
  readonly kind: 'passed' | 'failed' | 'cannot-run'
  /** What the item names. Never blank. */
  readonly element: string
  /** The specific screen, where the finding has one — this is what is clickable. */
  readonly screenId: string | null
  readonly refuses: string
  readonly sourceRef: string
  readonly ownerModules: readonly string[]
  readonly implementedHere: boolean
}

export interface ValidationPanel {
  readonly heading: string
  readonly blocked: boolean
  readonly items: readonly ValidationPanelItem[]
  /** Never a blocker (L32120). */
  readonly recommendations: readonly string[]
}

/**
 * `SB-STU-07`'s right panel — structural validation results as a LIVE LIST.
 *
 * It lists ALL ELEVEN checks. The four the storyboard names by example
 * include two this module does not own (a screen with no severity mapping,
 * a screen missing a curated coaching default in a declared locale); those
 * appear as declared absences naming the module that owns them, rather than
 * being silently missing or — worse — implemented here.
 */
export function validationPanel(
  workflow: WorkflowDraft,
  register: PublishCheckRegister<WorkflowDraft>,
): ValidationPanel {
  const evaluation = evaluatePublish(register, workflow)
  const structural = validateStructure(workflow)
  const findingFor = (id: PublishCheckId): string | null =>
    id === 'structural-validity' ? (structural.blockers[0]?.screenId ?? null) : null

  const items = PUBLISH_CHECKS.map((check: PublishCheckDefinition): ValidationPanelItem => {
    const blocker = evaluation.blockers.find((b) => b.checkId === check.id)
    return {
      checkId: check.id,
      ordinal: check.ordinal,
      name: check.name,
      kind: blocker === undefined ? 'passed' : blocker.kind,
      element: blocker?.blockingElement ?? check.name,
      screenId: blocker === undefined ? null : findingFor(check.id),
      refuses: check.refuses,
      sourceRef: check.sourceRef,
      ownerModules: check.ownerModules,
      implementedHere: register.implementations.get(check.id)?.implementedBy === 'MOD-STU-04',
    }
  })

  return {
    heading: VALIDATION_PANEL_HEADING,
    blocked: evaluation.blocked,
    items,
    recommendations: structural.recommendations.map((r) => r.message),
  }
}

/* ==================================================================== *
 * C7 — THE ROUTING PICKER. Task 11's register, not a stub.
 * ==================================================================== */

/**
 * `FUNC-STU-04-01-B-1` — *"Online: picker reads the library."* It reads
 * `MOD-STU-07`'s escalation-routing library and offers what is in force; a
 * Draft template is not in force and is not offered. Where it returns
 * nothing, the workflow default cannot be set (L32120) and `writes.ts`
 * refuses with the missing default named.
 */
export function escalationTemplateOptions(register: LibraryRegister): readonly TargetOption[] {
  return itemsInLibrary(register, 'escalation-routing')
    .filter(isInForce)
    .map((item) => ({ id: item.id, label: item.name }))
}
