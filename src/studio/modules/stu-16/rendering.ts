import type { StudioAccessDecision, StudioAccessInput } from '@/studio/access/evaluate'
import { STUDIO_PERSONA_COLUMNS, evaluateStudioAccess } from '@/studio/access/evaluate'
import type { LibraryRegister } from '@/studio/modules/stu-07/libraries'
import {
  retireCoachingAsset,
  type LibraryActor,
  type LibraryAuditWrite,
  type LibraryWriteResult,
} from '@/studio/modules/stu-07/writes'
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
import type { LaneARefinement, SelectionWeights } from './lane-a'
import { applyLearningAct, type LearningActResult, type LearningAuditWrite } from './learning'
import { STU_16_MATRIX, stu16Row, type Stu16RowId } from './matrix'

/**
 * `MOD-STU-16`'s rendering rule, decided ONCE and read by the screen.
 *
 * ## THE ONE RULE THIS FILE EXISTS TO HOLD
 *
 * **A row whose `surface` is not `screen` never becomes a control on this
 * screen, whatever token its cells carry.** Three rows of this card describe
 * another surface and two of them carry permissive tokens — row 2's Quality
 * Manager cell reads `Allowed` and rows 5 and 6 read `Allowed with
 * conditions` for the Tenant Admin — and every one of those tokens names a
 * surface that is not this one.
 *
 * `learningControls` builds from `STU_16_ACT_ROW_IDS`, and the partition
 * below is TOTAL over the card: every row is a read gate, an act, a
 * statement this screen makes, or a statement about another surface. A row
 * added to the card and to no partition list falls into `statementRowIds`,
 * which draws a note — the safe direction. It cannot fall into the control
 * list, because the control list is a fixed set of ids rather than a filter
 * that a new row could satisfy.
 *
 * ## SCOPE IS ENFORCED IN THE READ
 *
 * `learningViewAffordance` is asked ONCE, for the whole screen, and where it
 * refuses the screen builds no panel at all — no effectiveness rows, no
 * proposals, no case relevance. The panels are not built and then hidden.
 * Task 17 shipped a read leak by applying the scope in the read on one path
 * and in the draw on another; there is one path here and the scope is on it.
 *
 * ## THE AFFORDANCE RULE IS THE SURFACE'S, NOT THIS MODULE'S
 *
 * `affordanceFor` comes from `MOD-STU-18`. `allowed`/`allowedWithConditions`
 * → enabled; `readOnly`/`unavailable` → disabled carrying the cell's own
 * words; `clientDecisionRequired` → the open decision, no control;
 * `explicitlyProhibited` → ABSENT, a note where a control would be. A second
 * copy of that rule is the shape this build has paid for repeatedly.
 *
 * ## NO DEAD CONTROLS
 *
 * Every control names the `learningService` function it invokes. An enabled
 * control with no service key does not type-check.
 */

export type Stu16Scenario = Stu18Scenario

export function stu16Scenario(over: Partial<Stu16Scenario> = {}): Stu16Scenario {
  return { ...SEEDED_SCENARIO, ...over }
}

/** THE ONE ACCESS CALL THIS MODULE MAKES, per row. */
export function stu16Decision(id: Stu16RowId, s: Stu16Scenario): StudioAccessDecision {
  const input: StudioAccessInput = {
    row: stu16Row(id),
    identity: studioIdentityFor(s.persona),
    grants: studioGrantsFor(s),
    commercialTier: s.commercialTier,
    identityLayer: s.identityLayer,
    state: SEEDED_STATE,
    online: s.online,
    resourceTenant: SEEDED_TENANT,
    // No row of this card occupies an approval stage — see ./matrix.ts.
    // Written as `null` rather than omitted, so the floor is declared.
    authorOfRecord: null,
    reviewerOfRecord: null,
    releaseAuthorityOfRecord: null,
  }
  return evaluateStudioAccess(input)
}

/* ==================================================================== *
 * THE PARTITION — total over the card, and a control list that is a
 * FIXED SET rather than a filter a new row could satisfy.
 * ==================================================================== */

/** Row 1. What the screen IS, answered once for the whole screen. */
export const LEARNING_READ_ROW_ID = 'read-the-learning-view' satisfies Stu16RowId

/** The two rows of this card that are acts a person takes ON THIS SCREEN. */
export const STU_16_ACT_ROW_IDS = [
  'reverse-a-lane-a-refinement',
  'flag-or-retire-a-low-performing-coaching-asset',
] as const satisfies readonly Stu16RowId[]

export type Stu16ActRowId = (typeof STU_16_ACT_ROW_IDS)[number]

/**
 * Everything else this screen states rather than offers: rows 4, 7 and 8 as
 * the card stands. Derived by subtraction so the partition is total — a row
 * added to the card and to no list lands here and draws a note.
 */
export const STU_16_STATEMENT_ROW_IDS: readonly Stu16RowId[] = STU_16_MATRIX.filter(
  (row) =>
    row.surface === 'screen' &&
    row.id !== LEARNING_READ_ROW_ID &&
    !(STU_16_ACT_ROW_IDS as readonly Stu16RowId[]).includes(row.id),
).map((row) => row.id)

/* ==================================================================== *
 * THE READ GATE.
 * ==================================================================== */

/**
 * Row 1 (L34194), asked once. The screen builds nothing where this refuses.
 */
export function learningViewAffordance(s: Stu16Scenario): CapabilityAffordance {
  return affordanceFor('Read the learning view', stu16Decision(LEARNING_READ_ROW_ID, s))
}

/** Whether the three panels are built at all. One question, one answer. */
export function learningViewIsOpen(s: Stu16Scenario): boolean {
  const affordance = learningViewAffordance(s)
  return affordance.kind === 'enabled' || affordance.kind === 'disabled'
}

/* ==================================================================== *
 * THE SERVICE — what an enabled control actually invokes.
 * ==================================================================== */

export interface RetireAssetInput {
  readonly register: LibraryRegister
  readonly itemId: string
  readonly actor: LibraryActor
  readonly decision: StudioAccessDecision
  readonly writeAudit: LibraryAuditWrite
}

/**
 * The two acts this screen offers.
 *
 * `retireAsset` delegates to `MOD-STU-07`'s `retireCoachingAsset` and hands
 * the audit sink straight through. It is NOT re-implemented here and it is
 * NOT wrapped in this module's audit path: `MOD-STU-07` already writes the
 * entry before it mutates and refuses the act where the write fails, and a
 * second wrapper would put two entries in the log for one act. Retirement is
 * one idea with one spelling, and this module reads it.
 */
export const learningService = {
  /**
   * Deliberately NOT named `reverseLaneARefinement`, which is the bare
   * mutator in `./lane-a.ts`. Two functions of one name are two things a
   * reader — and a call-site count — cannot tell apart, and the covering
   * test counts call sites of the bare mutator to prove the audit is not
   * bypassed. The names differ so that count means what it says.
   */
  reverseRefinement: (
    weights: SelectionWeights,
    refinement: LaneARefinement,
    identityId: string,
    writeAudit: LearningAuditWrite,
  ): LearningActResult =>
    applyLearningAct(weights, { act: 'reverse-lane-a-refinement', refinement }, identityId, writeAudit),

  retireAsset: (input: RetireAssetInput): LibraryWriteResult => retireCoachingAsset(input),
}

/* ==================================================================== *
 * THE CONTROLS.
 * ==================================================================== */

export interface LearningControl {
  readonly id: Stu16ActRowId
  readonly label: string
  readonly affordance: CapabilityAffordance
  /** The `learningService` function this control invokes. Never a bound no-op. */
  readonly serviceKey: keyof typeof learningService
  readonly sourceRefs: readonly string[]
}

const CONTROL_LABELS: Readonly<Record<Stu16ActRowId, string>> = {
  'reverse-a-lane-a-refinement': 'Reverse this Lane-A refinement',
  'flag-or-retire-a-low-performing-coaching-asset': 'Retire this coaching asset',
}

const CONTROL_SERVICE: Readonly<Record<Stu16ActRowId, keyof typeof learningService>> = {
  'reverse-a-lane-a-refinement': 'reverseRefinement',
  'flag-or-retire-a-low-performing-coaching-asset': 'retireAsset',
}

export function learningControls(s: Stu16Scenario): readonly LearningControl[] {
  return STU_16_ACT_ROW_IDS.map((id) => {
    const row = stu16Row(id)
    return {
      id,
      label: CONTROL_LABELS[id],
      affordance: affordanceFor(CONTROL_LABELS[id], stu16Decision(id, s)),
      serviceKey: CONTROL_SERVICE[id],
      sourceRefs: row.sourceRefs,
    }
  })
}

/* ==================================================================== *
 * THE STATEMENTS — what the screen says rather than offers.
 * ==================================================================== */

export interface LearningStatement {
  readonly id: Stu16RowId
  readonly capability: string
  /** What the row means for the persona in view, through the surface's rule. */
  readonly affordance: CapabilityAffordance
  /**
   * **THE ROW'S OWN CELLS, VERBATIM** — every distinct note across the eight
   * columns, in column order, deduplicated.
   *
   * NOT the acting persona's cell alone, and the reason is row 4. Its
   * architectural absence — *"there is no separate on/off switch"* (L34197) —
   * is written on the Quality Manager's cell and is a fact about the
   * PLATFORM, not about that persona; rendering only the reader's own cell
   * would show a Tenant Admin a bare `Explicitly prohibited` and lose the
   * sentence `AC-STU-141` (L34335) exists to make visible.
   *
   * It is also not the affordance's `reason`. `evaluateStudioAccess`
   * composes its own explanation for a hard denial rather than passing the
   * cell text through, so a screen that rendered only the affordance would
   * print "an explicit denial applies to this role" where the source wrote a
   * sentence about the platform. Found by watching the covering test go red,
   * not by reading the code.
   *
   * Rows 2, 5 and 6 gain the same way: a Quality Manager reading this screen
   * sees the Read-only Auditor's *"no Client Command Center access at all"*,
   * which is the settled cross-surface fact the card states once.
   */
  readonly statedRules: readonly string[]
  /**
   * Whether the capability is held on a surface this build does not draw
   * here. `true` for rows 2, 5 and 6 — and a `true` here is why no control
   * exists for a row whose token reads `Allowed`.
   */
  readonly onAnotherSurface: boolean
  readonly sourceRefs: readonly string[]
}

function statementFor(id: Stu16RowId, s: Stu16Scenario): LearningStatement {
  const row = stu16Row(id)
  return {
    id,
    capability: row.capability,
    affordance: affordanceFor(row.capability, stu16Decision(id, s)),
    statedRules: [...new Set(STUDIO_PERSONA_COLUMNS.map((column) => row.cells[column].note))],
    onAnotherSurface: row.surface === 'another-surface',
    sourceRefs: row.sourceRefs,
  }
}

/**
 * Rows 4, 7 and 8 — this screen's own statements about what it does not
 * offer anybody. Row 4 is the one that matters most: its cell states an
 * ARCHITECTURAL ABSENCE, *"there is no separate on/off switch"* (L34197,
 * L34177), and a disabled toggle here would invent the control the source
 * says does not exist. `explicitlyProhibited` renders `absent` — a note, no
 * control of any kind — which is exactly what that sentence needs.
 */
export function boundaryStatements(s: Stu16Scenario): readonly LearningStatement[] {
  return STU_16_STATEMENT_ROW_IDS.map((id) => statementFor(id, s))
}

/**
 * Rows 2, 5 and 6 — capabilities held somewhere else. Rendered as statements
 * beside the seam that owns them, never as controls: an `another-surface`
 * row is never an enabled Studio control, whatever its token reads.
 */
export function otherSurfaceStatements(s: Stu16Scenario): readonly LearningStatement[] {
  return STU_16_MATRIX.filter((row) => row.surface === 'another-surface').map((row) =>
    statementFor(row.id, s),
  )
}
