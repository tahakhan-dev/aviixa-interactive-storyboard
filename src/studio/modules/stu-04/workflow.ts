import {
  INHERITABLE_DEFAULTS,
  WORKFLOW_SETTINGS,
  type InheritableDefault,
  type Locale,
  type WorkflowSetting,
} from '@/studio/vocab/authoring'

/**
 * `OBJ-STU-WORKFLOW` and `OBJ-STU-SCREEN` (L32078) as a structure, plus every
 * DERIVATION taken off it.
 *
 * ### R4 — ONE STRUCTURE, AND WHY THERE IS NO SECOND FIELD FOR IT
 *
 * L32042: *"The screen order and branch targets drawn on this canvas are also
 * the reference the sequence-detection mechanism compares against at run
 * time."* L32098 makes the prohibition explicit: *"no role may author a
 * sequence reference that differs from the drawn order, because two
 * references would make skip detection unfalsifiable."*
 *
 * A build that STORES the drawn order and STORES the detection reference has
 * created exactly the second reference the source forbids, and the two can
 * then disagree without anything going red. So `WorkflowDraft` carries six
 * fields and none of them is a reference: `sequenceDetectionReference` is a
 * FUNCTION over `nodes` and `branches`, and `AC-STU-056` — *"identical to
 * the drawn screen order and branch targets, with no separate authoring
 * path"* — holds by construction rather than by assertion.
 *
 * ### THIS FILE EXPORTS NO MUTATOR
 *
 * Every change to a workflow goes through `./writes`, which is the only file
 * that reaches the audit sink. A pure `withScreenRemoved` exported here
 * would be a second, unaudited way to change the drawn order, and the
 * covering test scans this module's exports for one.
 *
 * ### THE ARROW RULE, and why it is the only place unreachability can come
 * from
 *
 * The source's own diagram (L32122) draws S1→S2→S3, then TWO conditional
 * arrows off S3, then a plain arrow S4→S5. So:
 *
 *   **a node's outgoing arrows are its drawn branches where it has any, and
 *   otherwise the default arrow to the next node in the drawn order.**
 *
 * That is what makes "every node reachable" a check that can fail: an author
 * who retargets S3's in-tolerance branch to S5 has left S4 with nothing
 * pointing at it. Under a model where the drawn order always supplies every
 * consecutive arrow, no node is ever unreachable and
 * `FUNC-STU-04-02-B-2`'s reachability clause would be a check that cannot
 * fail — worse than no check.
 *
 * The gate-failure arrow is separate and additional (L32044): a gated screen
 * routes to the platform-standard deviation-capture screen unless the author
 * overrides the target per screen.
 *
 * DETERMINISM: no clock, no random source, no module-level mutable state.
 */

/**
 * The platform-standard deviation-capture screen. It is NOT an authored node
 * — it belongs to the platform and travels in the offline package
 * (L32044), which is why the default failure path works with no
 * connectivity. Branch targets may name it; the drawn order never contains
 * it.
 */
export const PLATFORM_DEVIATION_CAPTURE_SCREEN = 'SCR-PLATFORM-DEVIATION-CAPTURE'

/**
 * The depth past which the fork guidance recommends splitting into separate
 * Workflows.
 *
 * L32120 says *"a variant tree that exceeds a reasonable branch depth"* and
 * names no number anywhere in the source. Four is this build's pick under
 * APP-012, and the cost of it being wrong is nil: **the recommendation never
 * blocks**, so a threshold set too low produces one more piece of advice and
 * a threshold set too high produces one less. It is stated on screen as a
 * client-delegated choice rather than presented as the source's figure.
 */
export const REASONABLE_BRANCH_DEPTH = 4

export type ScreenNodeKind = 'standard' | 'measurement' | 'deviation-capture'

export const SCREEN_NODE_KINDS = [
  'standard',
  'measurement',
  'deviation-capture',
] as const satisfies readonly ScreenNodeKind[]

type MissingFromNodeKinds = Exclude<ScreenNodeKind, (typeof SCREEN_NODE_KINDS)[number]>
const _nodeKindsExhaustive: MissingFromNodeKinds extends never ? true : never = true
void _nodeKindsExhaustive

/** `OBJ-STU-SCREEN` — one screen the worker meets, as a node on the canvas. */
export interface WorkflowScreenNode {
  readonly id: string
  /**
   * The screen's number in the sequence as the author drew it. Carried on
   * the node rather than derived from the array index so that a REORDER is
   * visible in every projection of the structure: an index-derived number
   * would renumber itself and make a reorder invisible downstream, which is
   * precisely the "renders but changes nothing" defect.
   */
  readonly ordinal: number
  readonly name: string
  readonly kind: ScreenNodeKind
  /** Whether the screen carries a gate that can fail (L32044). */
  readonly gated: boolean
  /** `null` accepts the platform-standard target; a screen id overrides it. */
  readonly gateFailureOverride: string | null
}

/**
 * One drawn arrow. Keyed on `(from, condition)`: drawing again from the same
 * node under the same condition RETARGETS that arrow, which is how an author
 * "supplies a target" for a dangling branch (L32120). A different condition
 * is a different arrow.
 */
export interface DrawnBranch {
  readonly from: string
  readonly to: string
  readonly condition: string
}

export type WorkflowSettingValue = string | readonly Locale[] | null

/**
 * Exactly four, because the KEY TYPE is task 3's closed vocabulary. A fifth
 * setting cannot be added here — it has to be minted in
 * `@/studio/vocab/authoring`, where the source's own sentence about the four
 * is quoted.
 */
export type WorkflowSettingsRecord = Readonly<Record<WorkflowSetting, WorkflowSettingValue>>

export type InheritableDefaultValue = string | number | null

/**
 * Exactly two, for the same structural reason. The source's "exactly" is
 * load-bearing and a third default is a change request, not a convenience —
 * and severity, the obvious third, is prohibited by name on row 6 of this
 * module's matrix.
 */
export type InheritableDefaultsRecord = Readonly<
  Record<InheritableDefault, InheritableDefaultValue>
>

export type WorkflowLifecycle = 'Draft' | 'Published'

/** `OBJ-STU-WORKFLOW`. Six fields, and the covering test asserts the SET. */
export interface WorkflowDraft {
  readonly id: string
  readonly lifecycle: WorkflowLifecycle
  readonly settings: WorkflowSettingsRecord
  readonly defaults: InheritableDefaultsRecord
  /** THE drawn order. There is no second one. */
  readonly nodes: readonly WorkflowScreenNode[]
  /** THE drawn arrows. There is no second set. */
  readonly branches: readonly DrawnBranch[]
}

/**
 * The field set, as data, so the "no second reference" assertion can compare
 * SETS rather than name two forbidden strings — a subset assertion passes on
 * anything it does not name, which is this build's ninth defect shape.
 */
export const WORKFLOW_KEYS = [
  'id',
  'lifecycle',
  'settings',
  'defaults',
  'nodes',
  'branches',
] as const satisfies readonly (keyof WorkflowDraft)[]

type MissingFromWorkflowKeys = Exclude<keyof WorkflowDraft, (typeof WORKFLOW_KEYS)[number]>
const _workflowKeysExhaustive: MissingFromWorkflowKeys extends never ? true : never = true
void _workflowKeysExhaustive

/* ==================================================================== *
 * READS.
 * ==================================================================== */

export function workflowSettings(workflow: WorkflowDraft): WorkflowSettingsRecord {
  return workflow.settings
}

export function inheritableDefaults(workflow: WorkflowDraft): InheritableDefaultsRecord {
  return workflow.defaults
}

/** THE drawn order, read off the one structure that holds it. */
export function drawnOrder(workflow: WorkflowDraft): readonly string[] {
  return workflow.nodes.map((node) => node.id)
}

export function nodeById(workflow: WorkflowDraft, id: string): WorkflowScreenNode | null {
  return workflow.nodes.find((node) => node.id === id) ?? null
}

/**
 * The target of the first arrow drawn from a node, or `null` where the
 * author drew none. Deliberately reports what is DRAWN rather than where a
 * worker would end up: a dangling branch must keep naming its missing
 * target, because "the platform does not silently reroute" (L32120).
 */
export function branchTarget(workflow: WorkflowDraft, from: string): string | null {
  return workflow.branches.find((branch) => branch.from === from)?.to ?? null
}

/**
 * Where a failed gate on this screen routes. `null` where the screen carries
 * no gate — there is nothing to fail.
 */
export function gateFailureTarget(workflow: WorkflowDraft, nodeId: string): string | null {
  const node = nodeById(workflow, nodeId)
  if (node === null || !node.gated) return null
  return node.gateFailureOverride ?? PLATFORM_DEVIATION_CAPTURE_SCREEN
}

/** Whether a target is something the package can carry — a node, or the platform form. */
export function isPackagedTarget(workflow: WorkflowDraft, target: string): boolean {
  return target === PLATFORM_DEVIATION_CAPTURE_SCREEN || nodeById(workflow, target) !== null
}

/** The arrow rule, in one place. See the header. */
export function outgoingArrows(workflow: WorkflowDraft, nodeId: string): readonly string[] {
  const drawn = workflow.branches.filter((branch) => branch.from === nodeId)
  if (drawn.length > 0) return drawn.map((branch) => branch.to)
  const index = workflow.nodes.findIndex((node) => node.id === nodeId)
  if (index < 0 || index === workflow.nodes.length - 1) return []
  return [workflow.nodes[index + 1]!.id]
}

export interface GateFailureArrow {
  readonly from: string
  readonly to: string
}

export interface SequenceDetectionReference {
  readonly order: readonly string[]
  readonly branchTargets: readonly DrawnBranch[]
  readonly gateFailureTargets: readonly GateFailureArrow[]
}

/**
 * THE reference the sequence-detection mechanism compares against at run
 * time — DERIVED, every time, from the drawing. There is nothing to keep in
 * step because there is nothing else to keep in step with.
 */
export function sequenceDetectionReference(workflow: WorkflowDraft): SequenceDetectionReference {
  return {
    order: drawnOrder(workflow),
    branchTargets: workflow.branches,
    gateFailureTargets: workflow.nodes
      .filter((node) => node.gated)
      .map((node) => ({ from: node.id, to: gateFailureTarget(workflow, node.id)! })),
  }
}

/**
 * A deterministic stamp of the whole drawn structure. Used to tell a
 * validation result computed over THIS structure from one computed over a
 * structure that has since changed (L32152). No clock and no counter: the
 * same drawing always stamps the same.
 */
export function structureFingerprint(workflow: WorkflowDraft): string {
  return JSON.stringify(sequenceDetectionReference(workflow))
}

/* ==================================================================== *
 * THE WALK.
 * ==================================================================== */

export interface PreviewStep {
  readonly position: number
  readonly nodeId: string
  readonly name: string
  /** How the worker arrives here — the entry, the drawn order, or a condition. */
  readonly arrivedVia: string
}

/**
 * `FUNC-STU-04-02-A-1`'s preview, and `SB-STU-07`'s *"Preview Sequence
 * control walks the graph in worker order"*.
 *
 * It WALKS: depth-first from the entry, following each node's arrows in the
 * order they were drawn. On a straight chain that equals the drawn order —
 * which is the point, because the drawing IS the route — but it gets there
 * by traversal, so an author who retargets an arrow sees the route change.
 * Nodes the walk cannot reach are appended, named as unreachable, rather
 * than dropped: a preview that silently omits a screen would hide the exact
 * defect the structural check exists to report.
 */
export function previewSequence(workflow: WorkflowDraft): readonly PreviewStep[] {
  const entries = entryPoints(workflow)
  const start = entries[0] ?? workflow.nodes[0]?.id ?? null
  const seen = new Set<string>()
  const steps: PreviewStep[] = []

  const visit = (nodeId: string, arrivedVia: string): void => {
    if (seen.has(nodeId)) return
    const node = nodeById(workflow, nodeId)
    if (node === null) return
    seen.add(nodeId)
    steps.push({ position: steps.length + 1, nodeId, name: node.name, arrivedVia })
    for (const target of outgoingArrows(workflow, nodeId)) {
      const condition = workflow.branches.find((b) => b.from === nodeId && b.to === target)?.condition
      visit(target, condition ?? 'the drawn order')
    }
  }

  if (start !== null) visit(start, 'the entry point')
  for (const node of workflow.nodes) {
    if (seen.has(node.id)) continue
    seen.add(node.id)
    steps.push({
      position: steps.length + 1,
      nodeId: node.id,
      name: node.name,
      arrivedVia: 'nothing — no arrow reaches this screen',
    })
  }
  return steps
}

/** Nodes nothing points at. Exactly one of these is what L32080 requires. */
export function entryPoints(workflow: WorkflowDraft): readonly string[] {
  const targeted = new Set<string>()
  for (const node of workflow.nodes) {
    for (const target of outgoingArrows(workflow, node.id)) targeted.add(target)
  }
  return workflow.nodes.filter((node) => !targeted.has(node.id)).map((node) => node.id)
}

/* ==================================================================== *
 * STRUCTURAL VALIDATION — publish check #1, and this module's only one.
 * ==================================================================== */

export type StructuralFindingKind =
  | 'dangling-branch'
  | 'unreachable-node'
  | 'entry-point'
  | 'fork-guidance'

export const STRUCTURAL_FINDING_KINDS = [
  'dangling-branch',
  'unreachable-node',
  'entry-point',
  'fork-guidance',
] as const satisfies readonly StructuralFindingKind[]

type MissingFromFindingKinds = Exclude<
  StructuralFindingKind,
  (typeof STRUCTURAL_FINDING_KINDS)[number]
>
const _findingKindsExhaustive: MissingFromFindingKinds extends never ? true : never = true
void _findingKindsExhaustive

export interface StructuralFinding {
  readonly kind: StructuralFindingKind
  /** What the panel names — never empty. */
  readonly element: string
  /**
   * The specific screen the item points at. `SB-STU-07`: *"Each validation
   * item names the specific screen and is clickable."* Never `null` on a
   * blocker, which is what makes the item clickable rather than decorative.
   */
  readonly screenId: string | null
  readonly message: string
}

export interface StructuralValidation {
  readonly valid: boolean
  readonly blockers: readonly StructuralFinding[]
  /** Advice. `FB-STU`-free and never a blocker (L32120). */
  readonly recommendations: readonly StructuralFinding[]
  /** The structure this answer was computed over. See `structureFingerprint`. */
  readonly computedOver: string
}

/**
 * *"every node reachable, every branch target resolvable, exactly one entry
 * point"* (L32080), computed over the structure it is handed and nothing
 * else. No caching: a cached answer is the stale data L32152 is about.
 */
export function validateStructure(workflow: WorkflowDraft): StructuralValidation {
  const blockers: StructuralFinding[] = []

  // Every branch target resolvable. A dangling branch keeps naming its
  // missing target — the platform does not silently reroute.
  for (const branch of workflow.branches) {
    if (isPackagedTarget(workflow, branch.to)) continue
    blockers.push({
      kind: 'dangling-branch',
      element: `branch ${branch.from} -> ${branch.to}`,
      screenId: branch.to,
      message:
        `The branch drawn from ${branch.from} on “${branch.condition}” points at ${branch.to}, ` +
        'which is no longer a screen in this Workflow. The Workflow is structurally invalid until ' +
        'a target is supplied; the platform does not silently reroute it.',
    })
  }

  // Every gate-failure override resolvable, for the same reason: L32107 —
  // "the override target must itself be packaged or the override is
  // rejected at publication".
  for (const node of workflow.nodes) {
    if (node.gateFailureOverride === null) continue
    if (isPackagedTarget(workflow, node.gateFailureOverride)) continue
    blockers.push({
      kind: 'dangling-branch',
      element: `gate-failure override ${node.id} -> ${node.gateFailureOverride}`,
      screenId: node.id,
      message:
        `${node.name} overrides the platform-standard gate-failure target with ` +
        `${node.gateFailureOverride}, which is not carried in this Workflow’s package.`,
    })
  }

  // Exactly one entry point.
  const entries = entryPoints(workflow)
  if (entries.length !== 1) {
    for (const entry of entries.length === 0 ? [workflow.nodes[0]?.id ?? null] : entries) {
      blockers.push({
        kind: 'entry-point',
        element: `entry point ${entry ?? '(none)'}`,
        screenId: entry,
        message:
          entries.length === 0
            ? 'No screen is an entry point: every screen is pointed at by another, so the worker ' +
              'has nowhere to start. A Workflow structure has exactly one entry point.'
            : `${entries.length} screens are entry points (${entries.join(', ')}). A Workflow ` +
              'structure has exactly one, so the worker has one place to start.',
      })
    }
  }

  // Every node reachable.
  const reachable = reachableNodeIds(workflow)
  for (const node of workflow.nodes) {
    if (reachable.has(node.id)) continue
    blockers.push({
      kind: 'unreachable-node',
      element: `unreachable screen ${node.id}`,
      screenId: node.id,
      message:
        `No arrow reaches “${node.name}” (${node.id}), so a worker never meets it and the ` +
        'sequence-detection reference has no route through it.',
    })
  }

  const guidance = forkGuidanceFinding(workflow)
  return {
    valid: blockers.length === 0,
    blockers,
    recommendations: guidance === null ? [] : [guidance],
    computedOver: structureFingerprint(workflow),
  }
}

/**
 * Which authored screens the walk can actually reach from the entry.
 * Cycle-safe, and it stops at the platform-standard screen because that one
 * belongs to the package rather than to this drawing.
 */
export function reachableNodeIds(workflow: WorkflowDraft): ReadonlySet<string> {
  const start = entryPoints(workflow)[0] ?? workflow.nodes[0]?.id ?? null
  if (start === null) return new Set()
  const seen = new Set<string>()
  const stack = [start]
  while (stack.length > 0) {
    const current = stack.pop()!
    if (seen.has(current) || nodeById(workflow, current) === null) continue
    seen.add(current)
    for (const target of outgoingArrows(workflow, current)) stack.push(target)
  }
  return seen
}

/* ==================================================================== *
 * FORK GUIDANCE — `FEAT-STU-04-03`, surfaced at the point of decision and
 * never blocking.
 * ==================================================================== */

export interface ForkGuidance {
  readonly depth: number
  readonly threshold: number
  readonly recommendSplit: boolean
  readonly message: string
}

/**
 * The depth of the variant tree: the longest run of consecutive BRANCHING
 * screens along any route. A screen with one arrow is routing; a screen with
 * two is a fork, and a chain of forks is the "sprawling branch tree" L32046
 * says the canvas is not for.
 *
 * Cycle-safe by construction — a rework branch pointing backwards is legal
 * routing, and a traversal that did not guard against it would not
 * terminate.
 */
export function forkGuidance(workflow: WorkflowDraft): ForkGuidance {
  const depth = maxForkDepth(workflow)
  const recommendSplit = depth > REASONABLE_BRANCH_DEPTH
  return {
    depth,
    threshold: REASONABLE_BRANCH_DEPTH,
    recommendSplit,
    message: recommendSplit
      ? `This canvas forks ${depth} times in a row. Where the work differs significantly, author ` +
        'separate Workflows and link the right one per Run at assignment in the Delivery ' +
        'Operations Hub — the canvas is for in-run routing, not for variant management (L32046). ' +
        'This is a recommendation and it never blocks.'
      : `This canvas forks ${depth} times in a row, within the depth this build treats as ` +
        'reasonable. Branches are for light forks — a conditional re-check, a tolerance-dependent ' +
        'route, a deviation path; a substantively different sequence is a separate Workflow ' +
        '(L32046).',
  }
}

function forkGuidanceFinding(workflow: WorkflowDraft): StructuralFinding | null {
  const guidance = forkGuidance(workflow)
  if (!guidance.recommendSplit) return null
  return {
    kind: 'fork-guidance',
    element: `branch depth ${guidance.depth}`,
    screenId: null,
    message: guidance.message,
  }
}

function maxForkDepth(workflow: WorkflowDraft): number {
  let best = 0
  const walk = (nodeId: string, depth: number, path: ReadonlySet<string>): void => {
    if (path.has(nodeId) || nodeById(workflow, nodeId) === null) return
    const arrows = outgoingArrows(workflow, nodeId)
    const next = arrows.length > 1 ? depth + 1 : 0
    if (next > best) best = next
    const extended = new Set(path).add(nodeId)
    for (const target of arrows) walk(target, next, extended)
  }
  const start = entryPoints(workflow)[0] ?? workflow.nodes[0]?.id ?? null
  if (start !== null) walk(start, 0, new Set())
  return best
}

/* ==================================================================== *
 * THE JOURNEY PROJECTION.
 * ==================================================================== */

export interface BuilderDraftProjection {
  readonly name: string | null
  readonly jobType: string | null
  readonly locales: readonly Locale[]
  readonly inheritableDefaults: readonly string[]
  readonly screenOrder: readonly number[]
  readonly branchesDrawn: boolean
  readonly gateFailureBranchTarget: string | null
  readonly validation: 'not-run' | 'blocked' | 'passed'
}

/**
 * What this module contributes to `SEQ-011`'s draft record — the fields
 * journey steps 3, 4, 5 and 8 produce, projected off the REAL structure
 * rather than restated.
 *
 * This is where "produces states that satisfy the next step's requirements"
 * is made checkable: step 5 refuses on an empty `screenOrder`, step 6
 * refuses until `branchesDrawn`, and step 9 refuses while `validation` is
 * `not-run`. Every one of those reads a field derived here, so a reorder
 * that changed nothing, a branch control that wrote nothing, or a validator
 * that answered without running would stop the fold rather than pass
 * quietly.
 */
export function builderDraftProjection(
  workflow: WorkflowDraft,
  validation: StructuralValidation | null,
): BuilderDraftProjection {
  const locales = workflow.settings['locale coverage']
  return {
    name: typeof workflow.settings.name === 'string' ? workflow.settings.name : null,
    jobType: typeof workflow.settings['Job Type'] === 'string' ? workflow.settings['Job Type'] : null,
    locales: Array.isArray(locales) ? (locales as readonly Locale[]) : [],
    inheritableDefaults: INHERITABLE_DEFAULTS.filter(
      (id) => workflow.defaults[id] !== null,
    ).map((id) => `${DEFAULT_LABELS[id]} — ${String(workflow.defaults[id])}`),
    screenOrder: workflow.nodes.map((node) => node.ordinal),
    branchesDrawn: workflow.branches.length > 0,
    gateFailureBranchTarget:
      workflow.nodes.find((node) => node.gated) === undefined
        ? null
        : gateFailureTarget(workflow, workflow.nodes.find((node) => node.gated)!.id),
    validation: validation === null ? 'not-run' : validation.valid ? 'passed' : 'blocked',
  }
}

export const DEFAULT_LABELS = {
  'default-escalation-routing-template': 'default escalation routing template',
  'default-coaching-trigger-percentage': 'default coaching trigger percentage',
} as const satisfies Readonly<Record<InheritableDefault, string>>

export const SETTING_LABELS = {
  name: 'Name',
  'Job Type': 'Job Type',
  'optional Service Type tag': 'Service Type tag (optional)',
  'locale coverage': 'Locale coverage',
} as const satisfies Readonly<Record<WorkflowSetting, string>>

/**
 * Whether a setting is inherited by screens. `SB-STU-07` requires the left
 * panel to label each item "with whether it is inherited by screens", and
 * the answer is structural: the four settings are NOT inherited — they are
 * Workflow identity and scope — and the two defaults are.
 */
export function isInheritedByScreens(item: WorkflowSetting | InheritableDefault): boolean {
  return (INHERITABLE_DEFAULTS as readonly string[]).includes(item)
}

/** Both label maps read the vocabularies, so neither can grow a fifth entry. */
export const SETTING_ORDER: readonly WorkflowSetting[] = WORKFLOW_SETTINGS
export const DEFAULT_ORDER: readonly InheritableDefault[] = INHERITABLE_DEFAULTS

/* ==================================================================== *
 * THE SEED. Bright Bikes' eleven-screen wheel-bolt Workflow — the source's
 * own illustrative example (L32188, L68040), and the same eleven screens
 * `SEQ-011` folds through.
 *
 * Screens 3 through 10 are ALL measurement screens (L32525), not one.
 * ==================================================================== */

const MEASUREMENT_ORDINALS = [3, 4, 5, 6, 7, 8, 9, 10] as const

function seededNode(ordinal: number, name: string): WorkflowScreenNode {
  const measurement = (MEASUREMENT_ORDINALS as readonly number[]).includes(ordinal)
  return {
    id: `S${ordinal}`,
    ordinal,
    name,
    kind: measurement ? 'measurement' : 'standard',
    // A measurement screen carries the specification gate, so it is the
    // screen that can fail one. The other three carry no gate and therefore
    // no failure path — `gateFailureTarget` answers `null` for them.
    gated: measurement,
    gateFailureOverride: null,
  }
}

const SEEDED_NODES: readonly WorkflowScreenNode[] = [
  seededNode(1, 'Scan the frame serial'),
  seededNode(2, 'Read the drawing reference'),
  seededNode(3, 'Measure wheel bolt torque — bolt 1'),
  seededNode(4, 'Measure wheel bolt torque — bolt 2'),
  seededNode(5, 'Measure wheel bolt torque — bolt 3'),
  seededNode(6, 'Measure wheel bolt torque — bolt 4'),
  seededNode(7, 'Measure wheel bolt torque — bolt 5'),
  seededNode(8, 'Measure wheel bolt torque — bolt 6'),
  seededNode(9, 'Measure wheel bolt torque — bolt 7'),
  seededNode(10, 'Measure wheel bolt torque — bolt 8'),
  seededNode(11, 'Supervisor sign-off'),
]

export const SEEDED_BUILDER_WORKFLOW: WorkflowDraft = {
  id: 'WF-BB-TORQUE',
  lifecycle: 'Draft',
  settings: {
    name: 'Assembly — Wheel Bolt Torque Verification',
    // Tenant-created. Under DEC-TAX-002 the seeded catalogue ships empty and
    // no starter Job Type is named anywhere in the source (L7908).
    'Job Type': 'Assembly',
    'optional Service Type tag': null,
    'locale coverage': ['English', 'Spanish'],
  },
  defaults: {
    'default-escalation-routing-template': 'ROU-SEVERITY-BANDS',
    'default-coaching-trigger-percentage': 80,
  },
  nodes: SEEDED_NODES,
  branches: [
    { from: 'S2', to: 'S3', condition: 'the drawing reference is legible' },
    { from: 'S3', to: 'S4', condition: 'measurement within the specification limits' },
    {
      from: 'S3',
      to: PLATFORM_DEVIATION_CAPTURE_SCREEN,
      condition: 'measurement outside the specification limits',
    },
  ],
}

/** The published version the read-only canvas opens (row 2 of the matrix). */
export const SEEDED_PUBLISHED_WORKFLOW: WorkflowDraft = {
  ...SEEDED_BUILDER_WORKFLOW,
  id: 'WF-BB-TORQUE',
  lifecycle: 'Published',
}

/**
 * What the canvas READS from. Two collections, because rows 1 and 2 of the
 * matrix are two reads: a persona refused the draft canvas never touches
 * `drafts` at all.
 */
export interface CanvasRegister {
  readonly drafts: readonly WorkflowDraft[]
  readonly published: readonly WorkflowDraft[]
}

export const SEEDED_CANVAS_REGISTER: CanvasRegister = {
  drafts: [SEEDED_BUILDER_WORKFLOW],
  published: [SEEDED_PUBLISHED_WORKFLOW],
}
