import { permitsAction } from '@/policy/decision'
import {
  evaluateStudioAccess,
  type StudioAccessDecision,
  type StudioAccessInput,
} from '@/studio/access/evaluate'
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
import { blockState, type InstructionBlock, type WorkflowBlockScope } from './blocks'
import { stu06Row, type Stu06CapabilityId, type Stu06MatrixRow } from './matrix'

/**
 * `MOD-STU-06`'s rendering rule — decided ONCE and read by the panel, the
 * editor and the route.
 *
 * ### WHY THIS IMPORTS `stu-18/rendering` RATHER THAN COPYING IT
 *
 * The six-token affordance rule (`allowed`/`allowedWithConditions` →
 * enabled; `readOnly`/`unavailable` → disabled carrying the cell's own
 * words; `clientDecisionRequired` → both readings; `explicitlyProhibited` →
 * absent) is a SURFACE rule, not a module one. `MOD-STU-07` reached the same
 * conclusion. A second copy here is the shape this build has paid for
 * repeatedly: a fix that reaches one caller of two.
 *
 * `MOD-STU-07` adds one branch on top of it, `libraryAffordance`, for its
 * routed prohibition. **This module adds none**, and that is a decision
 * rather than an omission: no row of this matrix prohibits a persona while
 * another row of it permits that same persona an alternative, so there is
 * nothing to route anyone to and `affordanceFor` is the whole rule. See
 * `matrix.ts` for why row 5 is categorical and why row 6's Worker cell is
 * not a routing either.
 *
 * `Stu18Scenario` and `affordanceFor` are named for the module that first
 * needed them and belong in a shared `src/studio/rendering.ts`. Lifting them
 * would edit files this task does not own, so it is reported rather than
 * done — the same report `MOD-STU-07` filed.
 *
 * NO POLICY UNDER `src/ui/`. This file is under `src/studio/`, it computes
 * decisions, and the component it feeds only draws.
 *
 * DETERMINISM: no clock, no random source, no module-level mutable state.
 */

export { SEEDED_TENANT }
export type { CapabilityAffordance }

export type Stu06Scenario = Stu18Scenario

export function scenario(over: Partial<Stu06Scenario> = {}): Stu06Scenario {
  return { ...SEEDED_SCENARIO, ...over }
}

/**
 * THE ONE ACCESS CALL THIS MODULE MAKES. Every control routes through here,
 * PER CONTROL, over that control's own matrix row — never over a
 * module-level role list.
 */
export function decisionForRow(row: Stu06MatrixRow, s: Stu06Scenario): StudioAccessDecision {
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

/* ==================================================================== *
 * THE CONTROLS THIS SCREEN OFFERS.
 * ==================================================================== */

/**
 * DO NOT INVENT A CONTROL. These four are rows 1 to 4 of the source's own
 * table and nothing else.
 *
 * Row 5, *Reuse a block in another Workflow*, appears on NO control. It is
 * refused in all eight columns with no alternative anywhere, so the screen
 * states the rule in prose — `SB-STU-09`'s prominent line — and offers
 * nothing to click. A disabled control would imply a condition that could
 * one day become true.
 *
 * Row 6, *Read a block on published content*, is not a control either: it is
 * what the panel IS, and scope is enforced in what the screen READS
 * (`readableBlocks`) rather than in what it draws.
 */
const CONTROL_IDS = [
  'create-a-block-within-a-workflow',
  'apply-a-block-to-a-screen',
  'edit-a-block-propagating-to-every-applying-screen',
  'remove-a-block-from-a-screen',
] as const satisfies readonly Stu06CapabilityId[]

const CONTROL_LABELS = {
  'create-a-block-within-a-workflow': 'Create a block',
  'apply-a-block-to-a-screen': 'Apply to a screen',
  'edit-a-block-propagating-to-every-applying-screen': 'Edit block content',
  'remove-a-block-from-a-screen': 'Remove from this screen',
  'reuse-a-block-in-another-workflow': 'Reuse in another Workflow',
  'read-a-block-on-published-content': 'Read published block content',
} as const satisfies Readonly<Record<Stu06CapabilityId, string>>

export interface BlockControl {
  readonly id: Stu06CapabilityId
  readonly label: string
  readonly affordance: CapabilityAffordance
  readonly sourceRefs: readonly string[]
}

/**
 * The controls this screen offers this persona, each with its own decision.
 *
 * The LIST is the same for every persona — what varies is each control's
 * affordance. That is the difference between enforcing scope in what a
 * screen reads and enforcing it in what a screen draws: a persona with
 * nothing enabled still gets an answer per capability rather than a shorter
 * screen that quietly omits the question.
 */
export function blockControls(s: Stu06Scenario): readonly BlockControl[] {
  return CONTROL_IDS.map((id) => {
    const row = stu06Row(id)
    return {
      id,
      label: CONTROL_LABELS[id],
      affordance: affordanceFor(CONTROL_LABELS[id], decisionForRow(row, s)),
      sourceRefs: row.sourceRefs,
    }
  })
}

/**
 * THE DELETE CONTROL, AND THE ROW THAT GOVERNS IT.
 *
 * FINDING, recorded rather than smoothed. `SB-STU-09` (L32523) and the
 * alternate path (L32501) both describe a DELETE control on this screen, and
 * the permission matrix at L32458-L32463 carries **no delete row**. Row 4 is
 * *Remove a block from a screen*, which is a different act: it un-applies a
 * block and leaves the block itself alone.
 *
 * Governed by ROW 1 — *Create a block within a Workflow* — because creating
 * and destroying a draft record inside one's own Workflow is one authority,
 * and because L34605 permits nothing the Studio has not been told to permit:
 * borrowing the narrower of the two candidate rows keeps the control
 * reachable for exactly the personas the card lets author a block, and for
 * nobody else. `deleteRefusal` in `blocks.ts` then applies the object rules
 * on top, so a persona who MAY delete still cannot delete a block screens
 * apply.
 */
export function deleteControlDecision(s: Stu06Scenario): StudioAccessDecision {
  return decisionForRow(stu06Row('create-a-block-within-a-workflow'), s)
}

/* ==================================================================== *
 * SCOPE IS ENFORCED IN WHAT THE SCREEN READS.
 * ==================================================================== */

export interface ReadableBlocks {
  readonly blocks: readonly InstructionBlock[]
  /** How many the Workflow holds that this view may not read. */
  readonly withheldCount: number
  /** Never blank where anything is withheld — `AC-STU-155`, L34672. */
  readonly withheldReason: string | null
}

/**
 * WHICH BLOCKS THIS VIEW MAY READ — the filter applied to the DATA, not to
 * the markup. Slice 4's seventh defect shape is scope enforced in what a
 * screen DREW rather than in what it READ, and the difference is not
 * cosmetic: a panel that loads every draft and then hides some has already
 * put them in the response.
 *
 * TWO ROWS ANSWER IT, NOT ONE, and that is the fix for the mistake the
 * mechanical reading makes. Row 6 gives the Quality Manager `Read-only` on
 * *Read a block on published content*; applying that token alone as the read
 * scope would hide the Quality Manager's OWN DRAFTS from them. The
 * consolidated matrix states the draft question separately — *"Read drafts
 * and in-review versions"* (L34543) is `Allowed` for the Quality Manager,
 * the grant-holding Supervisor and `GRANT-STU-IMPL`, and
 * `Explicitly prohibited` for everyone else — and those are exactly the
 * personas this card lets author a block. So a persona who may create a
 * block reads the drafts too; a persona who may not reads what is published
 * within a version, and nothing else ever reaches the component.
 */
export function readableBlocks(s: Stu06Scenario, scope: WorkflowBlockScope): ReadableBlocks {
  const authors = permitsAction(
    decisionForRow(stu06Row('create-a-block-within-a-workflow'), s).decision,
  )
  if (authors) return { blocks: scope.blocks, withheldCount: 0, withheldReason: null }

  const read = decisionForRow(stu06Row('read-a-block-on-published-content'), s)
  if (read.outcome === 'readOnly' || permitsAction(read.decision)) {
    const blocks = scope.blocks.filter((b) => blockState(b) === 'Published within a version')
    return {
      blocks,
      withheldCount: scope.blocks.length - blocks.length,
      withheldReason:
        blocks.length === scope.blocks.length
          ? null
          : `${read.reason} — this view reads block content published within a version only. ` +
            'Drafts and in-review versions are Explicitly prohibited to it (L34543), so they are ' +
            'not read here rather than read and then hidden.',
    }
  }
  return {
    blocks: [],
    withheldCount: scope.blocks.length,
    withheldReason: `${read.reason} No block in this Workflow is read from this view.`,
  }
}
