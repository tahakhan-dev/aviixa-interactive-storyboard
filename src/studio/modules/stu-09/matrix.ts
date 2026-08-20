import type {
  StudioMatrixCell,
  StudioMatrixRow,
  StudioPersonaColumn,
} from '@/studio/access/evaluate'
import type { StudioMatrixRowSurface } from '@/studio/modules'

/**
 * `MOD-STU-09`'s own permission matrix — the source's table at **L32962
 * (header), L32963 (separator) and L32964–L32971, eight data rows**,
 * transcribed cell by cell.
 *
 * TWO THINGS READ THIS FILE, and it is shaped for both, exactly as
 * `MOD-STU-03`'s is:
 *
 * 1. `scripts/build-stu-module-reach.mjs` derives which personas this module
 *    reaches, using `reachByStudioMatrix` over the rows classified `screen`.
 *    That is why every row carries `surface` and why every row answers all
 *    EIGHT persona columns.
 * 2. `evaluateStudioAccess` (`@/studio/access/evaluate`) answers the
 *    per-control affordance question, one row at a time. There is no
 *    module-level role list anywhere in this module; a control asks for its
 *    own row and gets its own answer.
 *
 * ### FINDING 1 — the module card heads SIX persona columns; the vocabulary
 * ### has EIGHT
 *
 * L32962's header is `Quality Manager | Supervisor with grant | Supervisor
 * without grant | Tenant Admin | Read-only Auditor | Worker`. Neither the
 * **Plant Manager persona** column nor the **`GRANT-STU-IMPL`** column that
 * the consolidated matrix heads (L34539) appears on this card at all — this
 * card is narrower than `MOD-STU-03`'s, which at least carries the
 * implementation-team column.
 *
 * - `plant-manager-persona` is filled from `DEC-ROLE-001` (L34522): the
 *   persona's Studio access "is delivered by a Supervisor role without the
 *   authoring grant". Its cell is therefore the `supervisor-without-grant`
 *   cell with the substitution named in the note — see `withPlantManager`.
 * - `implementation-team` is filled from the card's own FUNCTION lines where
 *   they name it (`FUNC-STU-09-01-A-1` at L32987 names "implementation team
 *   grant" in Roles allowed) and otherwise from the CONSOLIDATED matrix row
 *   that states the same capability, with the row named in every note. It is
 *   never guessed: where the capacity is refused, the refusal is the
 *   source's own — `FUNC-STU-18-02-C-1` (L34588) prohibits "the capacity
 *   itself from any approval stage", and L34559's chain row spells the same
 *   cell "Explicitly prohibited — author and submit only".
 *
 * ### FINDING 2 — ROW 7 IS NOT HERE, and row 8's Worker cell is not either
 *
 * Row 7, "Set the difficulty level on a worker profile" (L32970), is a
 * cross-surface statement (R22). Its Quality Manager cell reads `Not
 * applicable — the profile field is Delivery Operations Hub master data` and
 * three columns read `Allowed` for a Delivery Operations Hub act. Two things
 * follow, and both are why it is carried in `STU_09_CROSS_SURFACE` rather
 * than in the matrix:
 *
 * - `StudioCellOutcome` deliberately cannot express `Not applicable` (see
 *   `MOD-STU-12`'s Job Owner column for the same ruling): a PERSONA column
 *   with no answer is a blank cell, and a blank cell is a defect.
 * - Classified `screen`, its `Allowed` cells would derive Tenant Admin and
 *   Supervisor reach for a module that HAS NO ROUTE (`slug: null`,
 *   `src/studio/modules.ts`), which would be a claim the build contradicts.
 *
 * Row 8's WORKER cell (`Allowed with conditions — the worker sees only the
 * level their profile selects`) is the same shape one cell down, and it
 * collides with an acceptance criterion. `AC-STU-150` (L34667): "A Worker
 * cannot reach any Studio route by any means", which `STU_PERSONAS` already
 * encodes as `studioAccess: 'explicitly-prohibited'`. Both readings are true
 * of different surfaces: on SURF-STU the Worker reads nothing, and on
 * SURF-FL the Worker reads exactly one level, from the package. So the
 * matrix cell states the SURF-STU answer with AC-STU-150 quoted in its note,
 * and the card's own sentence is carried verbatim as the second
 * `STU_09_CROSS_SURFACE` entry. Neither is dropped and neither is silently
 * merged into the other.
 *
 * `STU_09_SOURCE_ROW_COUNT` is what keeps the two halves adding up to the
 * source's eight.
 *
 * ### `requiredTiers` and `requiredGrant` are `null` on every cell
 *
 * No cell in these eight rows names a commercial tier or a grant beyond the
 * one that opens its own column. Written on every cell rather than left off:
 * a cell that omits them and a cell that states "none" read identically at a
 * glance, and only one of them is an answer.
 *
 * ### `stage` is `null` on every row but one
 *
 * Row 4, "Review drafted levels in the chain", OCCUPIES the Reviewer stage —
 * its own cell says so ("not on own submission"), and that is what arms
 * separation-of-duties evaluation in `evaluateStudioAccess`. Authoring,
 * drafting and editing happen before a submission exists, so they occupy no
 * stage; marking them `author` would arm distinctness against a submission
 * that has not been made.
 */

/** The source table's own data-row count, L32964–L32971. */
export const STU_09_SOURCE_ROW_COUNT = 8

export type Stu09RowId =
  | 'author-one-difficulty-level'
  | 'request-artificial-intelligence-drafting'
  | 'edit-a-drafted-level-before-submission'
  | 'review-drafted-levels-in-the-chain'
  | 'publish-a-level-that-has-not-been-reviewed'
  | 'make-a-level-change-a-capture-gate-limit-or-severity-mapping'
  | 'read-all-three-levels-of-published-content'

export const STU_09_ROW_IDS = [
  'author-one-difficulty-level',
  'request-artificial-intelligence-drafting',
  'edit-a-drafted-level-before-submission',
  'review-drafted-levels-in-the-chain',
  'publish-a-level-that-has-not-been-reviewed',
  'make-a-level-change-a-capture-gate-limit-or-severity-mapping',
  'read-all-three-levels-of-published-content',
] as const satisfies readonly Stu09RowId[]

type MissingFromRowIds = Exclude<Stu09RowId, (typeof STU_09_ROW_IDS)[number]>
const _rowIdsExhaustive: MissingFromRowIds extends never ? true : never = true
void _rowIdsExhaustive

export interface StudioDifficultyMatrixRow extends StudioMatrixRow {
  readonly id: Stu09RowId
  /** Read by `reachByStudioMatrix`'s clause one. All seven are screen rows. */
  readonly surface: StudioMatrixRowSurface
}

function cell(
  outcome: StudioMatrixCell['outcome'],
  note: string,
  openDecision: string | null = null,
): StudioMatrixCell {
  return { outcome, note, openDecision, requiredTiers: null, requiredGrant: null }
}

const PROHIBITED = cell('explicitlyProhibited', 'Explicitly prohibited')
const ALLOWED = cell('allowed', 'Allowed')
const READ_ONLY = cell('readOnly', 'Read-only')
const AUDITOR_OPEN = cell(
  'clientDecisionRequired',
  'Client Decision Required — DEC-AUDSTU-001',
  'DEC-AUDSTU-001',
)
const NOT_ON_OWN_SUBMISSION = cell(
  'allowedWithConditions',
  'Allowed with conditions — not on own submission',
)

/**
 * The implementation-team cell for a capability the card's own FUNCTION line
 * names it in. `FUNC-STU-09-01-A-1` (L32987) lists "implementation team
 * grant" among Roles allowed, and L34520 bounds the capacity: "author and
 * submit only, fully audited, revoked at onboarding's end".
 */
const IMPL_AUTHORING = cell(
  'allowedWithConditions',
  'Allowed with conditions — the onboarding author-and-submit capacity only',
)

/**
 * The Plant Manager persona reads the `supervisor-without-grant` cell, and
 * says so in its own note rather than being silently aliased.
 */
function withPlantManager(
  cells: Omit<Record<StudioPersonaColumn, StudioMatrixCell>, 'plant-manager-persona'>,
): Record<StudioPersonaColumn, StudioMatrixCell> {
  const mirrored = cells['supervisor-without-grant']
  return {
    ...cells,
    'plant-manager-persona': {
      ...mirrored,
      note:
        `${mirrored.note} — this module’s own table (L32962) heads no Plant Manager column; ` +
        'DEC-ROLE-001 (L34522) delivers this persona’s Studio access through a Supervisor role ' +
        'without the authoring grant.',
    },
  }
}

/** Rows 1–6 and 8 of L32964–L32971, in source order. Row 7 is below. */
export const STU_09_MATRIX = [
  {
    id: 'author-one-difficulty-level',
    capability: "Author one difficulty level of a screen's instruction",
    surface: 'screen',
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L32964', 'FUNC-STU-09-01-A-1 L32987', 'AC-STU-086 L33073'],
    cells: withPlantManager({
      'quality-manager': ALLOWED,
      'supervisor-with-authoring-grant': ALLOWED,
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      // FUNC-STU-09-01-A-1 (L32987) names the implementation team grant in
      // Roles allowed, in the card's own words.
      'implementation-team': IMPL_AUTHORING,
    }),
  },
  {
    id: 'request-artificial-intelligence-drafting',
    capability: 'Request artificial-intelligence drafting of the other two levels',
    surface: 'screen',
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L32965', 'FUNC-STU-09-01-B-1 L32989', 'L34545'],
    cells: withPlantManager({
      'quality-manager': ALLOWED,
      'supervisor-with-authoring-grant': ALLOWED,
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      // FUNC-STU-09-01-B-1 (L32989): "requested by an authoring-grant
      // holder". The consolidated matrix's own "Author all nine
      // configuration sections" row (L34545) reads `Allowed with conditions`
      // in this column, and difficulty levels are Section 1 content.
      'implementation-team': cell(
        'allowedWithConditions',
        'Allowed with conditions — the onboarding author-and-submit capacity only; the consolidated matrix reads Allowed with conditions on “Author all nine configuration sections” (L34545)',
      ),
    }),
  },
  {
    id: 'edit-a-drafted-level-before-submission',
    capability: 'Edit a drafted level before submission',
    surface: 'screen',
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L32966', 'SB-STU-12 L33038', 'L34545'],
    cells: withPlantManager({
      'quality-manager': ALLOWED,
      'supervisor-with-authoring-grant': ALLOWED,
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      'implementation-team': IMPL_AUTHORING,
    }),
  },
  {
    id: 'review-drafted-levels-in-the-chain',
    capability: 'Review drafted levels in the chain',
    surface: 'screen',
    isPublishedRead: false,
    // The ONE row that occupies an approval stage. Its own cell states the
    // condition — "not on own submission" — and `evaluateStudioAccess`
    // enforces it against IDENTITY, never against role (L33389).
    stage: 'reviewer',
    sourceRefs: ['L32967', 'FUNC-STU-09-02-A-1 L32994', 'L34551', 'AC-STU-087 L33074'],
    cells: withPlantManager({
      'quality-manager': NOT_ON_OWN_SUBMISSION,
      'supervisor-with-authoring-grant': NOT_ON_OWN_SUBMISSION,
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      // L34551 "Act as Reviewer" reads `Explicitly prohibited` in this
      // column, and FUNC-STU-18-02-C-1 (L34588) prohibits "the capacity
      // itself from any approval stage". Not an inference: two source lines.
      'implementation-team': cell(
        'explicitlyProhibited',
        'Explicitly prohibited — author and submit only; the capacity holds no stage of the chain (L34559, FUNC-STU-18-02-C-1 L34588)',
      ),
    }),
  },
  {
    id: 'publish-a-level-that-has-not-been-reviewed',
    capability: 'Publish a level that has not been reviewed',
    surface: 'screen',
    isPublishedRead: false,
    stage: null,
    // Six prohibitions in the card and eight here. AC-STU-087 (L33074)
    // states the RULE — "every artificial-intelligence-drafted level passes
    // the full review chain before publication" — rather than a list, which
    // is what makes the eighth and the seventh cell derivations and not
    // inventions: no column anywhere holds this.
    sourceRefs: ['L32968', 'AC-STU-087 L33074', 'TEST-STU-092 L33082', 'L32945'],
    cells: withPlantManager({
      'quality-manager': PROHIBITED,
      'supervisor-with-authoring-grant': PROHIBITED,
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      'implementation-team': PROHIBITED,
    }),
  },
  {
    id: 'make-a-level-change-a-capture-gate-limit-or-severity-mapping',
    capability: 'Make a level change a capture, gate, limit, or severity mapping',
    surface: 'screen',
    isPublishedRead: false,
    stage: null,
    // FUNC-STU-09-01-C-1 (L32991): "Roles prohibited: no role may configure
    // a level-specific capture, gate, limit, or mapping." The rule, not a
    // list — so the eight columns follow from it.
    sourceRefs: ['L32969', 'FUNC-STU-09-01-C-1 L32991', 'AC-STU-088 L33075', 'TEST-STU-093 L33083'],
    cells: withPlantManager({
      'quality-manager': PROHIBITED,
      'supervisor-with-authoring-grant': PROHIBITED,
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      'implementation-team': PROHIBITED,
    }),
  },
  {
    id: 'read-all-three-levels-of-published-content',
    capability: 'Read all three levels of published content',
    surface: 'screen',
    // THE published-read row. L34605's fail-closed floor keeps exactly this
    // open when the identity layer is unreachable: "permits nothing beyond
    // published read".
    isPublishedRead: true,
    stage: null,
    sourceRefs: ['L32971', 'L34542', 'AC-STU-150 L34667', 'L34605'],
    cells: withPlantManager({
      'quality-manager': ALLOWED,
      'supervisor-with-authoring-grant': ALLOWED,
      'supervisor-without-grant': READ_ONLY,
      'tenant-admin': READ_ONLY,
      'read-only-auditor': AUDITOR_OPEN,
      // FINDING 2. The card's cell reads "Allowed with conditions — the
      // worker sees only the level their profile selects" (L32971), which is
      // a FRONTLINE consequence: AC-STU-150 (L34667) is "A Worker cannot
      // reach any Studio route by any means", and STU_PERSONAS already
      // carries `studioAccess: 'explicitly-prohibited'` for this column. The
      // card's sentence is preserved verbatim in STU_09_CROSS_SURFACE below;
      // this cell answers for SURF-STU only, which is the surface the matrix
      // is about.
      worker: cell(
        'explicitlyProhibited',
        'Explicitly prohibited on SURF-STU — AC-STU-150 (L34667): “A Worker cannot reach any Studio route by any means.” The card’s own cell, “Allowed with conditions — the worker sees only the level their profile selects” (L32971), is a Frontline consequence read from the package and is carried verbatim in STU_09_CROSS_SURFACE',
      ),
      'implementation-team': cell(
        'allowedWithConditions',
        'Allowed with conditions — the consolidated matrix reads Allowed with conditions on “Read published Workflow content” (L34542)',
      ),
    }),
  },
] as const satisfies readonly StudioDifficultyMatrixRow[]

type MissingFromMatrix = Exclude<Stu09RowId, (typeof STU_09_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

/**
 * Total over the seven. Throws on an unknown id rather than returning
 * `undefined`: every caller passes a literal `Stu09RowId`, so an unknown one
 * is a defect and not a state to render.
 */
export function stu09Row(id: Stu09RowId): StudioDifficultyMatrixRow {
  const found = STU_09_MATRIX.find((row) => row.id === id)
  if (found === undefined) {
    throw new Error(`MOD-STU-09: no matrix row is transcribed for "${id}".`)
  }
  return found
}

/* ==================================================================== *
 * THE CROSS-SURFACE STATEMENTS — never Studio controls (R22).
 * ==================================================================== */

export interface StudioDifficultyCrossSurfaceRow {
  readonly id: 'set-the-difficulty-level-on-a-worker-profile' | 'read-the-selected-level-on-the-frontline'
  readonly capability: string
  /**
   * The surface that actually holds the control. Deliberately NOT named
   * `surface`: `scripts/build-stu-module-reach.mjs` finds a module's matrix
   * by looking for the one exported array whose every row carries `surface`,
   * and a second such array in this file would make it read neither.
   */
  readonly heldOn: 'SURF-DOH' | 'SURF-FL'
  readonly owner: string
  /** The source cells, verbatim, in the card's own header order. */
  readonly cells: readonly { readonly column: string; readonly text: string }[]
  /** The one sentence a Studio screen renders in place of a control. */
  readonly statement: string
  readonly sourceRefs: readonly string[]
}

export const STU_09_CROSS_SURFACE = [
  {
    id: 'set-the-difficulty-level-on-a-worker-profile',
    capability: 'Set the difficulty level on a worker profile',
    heldOn: 'SURF-DOH',
    owner:
      'MOD-DOH-04, the worker record in the Delivery Operations Hub — the profile field is Delivery Operations Hub master data',
    cells: [
      {
        column: 'Quality Manager',
        text: 'Not applicable — the profile field is Delivery Operations Hub master data',
      },
      {
        column: 'Supervisor with grant',
        text: 'Allowed — supervisor-entered worker record maintenance in the Delivery Operations Hub',
      },
      { column: 'Supervisor without grant', text: 'Allowed — same reason' },
      { column: 'Tenant Admin', text: 'Allowed — same reason' },
      { column: 'Read-only Auditor', text: 'Read-only' },
      { column: 'Worker', text: 'Explicitly prohibited — no self-selection is specified' },
    ],
    statement:
      'The difficulty level on a worker profile is set on the worker record in the Delivery ' +
      'Operations Hub, never here. No Studio control writes it, for any persona, in any state — ' +
      'FUNC-STU-09-03-A-1 (L32998) prohibits “the Studio from writing it, since it is another ' +
      'surface’s master data”.',
    sourceRefs: ['L32970', 'FUNC-STU-09-03-A-1 L32998'],
  },
  {
    id: 'read-the-selected-level-on-the-frontline',
    capability: 'Read all three levels of published content — the Worker column',
    heldOn: 'SURF-FL',
    owner: 'The Frontline Worker Application, rendering the packaged level on the device',
    cells: [
      {
        column: 'Worker',
        text: 'Allowed with conditions — the worker sees only the level their profile selects',
      },
    ],
    statement:
      'A Worker reads one level, on the Frontline surface, from the package — never in the ' +
      'Studio. AC-STU-150 (L34667): “A Worker cannot reach any Studio route by any means.”',
    sourceRefs: ['L32971', 'AC-STU-150 L34667', 'FUNC-STU-09-03-A-1 L32998'],
  },
] as const satisfies readonly StudioDifficultyCrossSurfaceRow[]

/**
 * The two halves add up to the source's eight rows: seven persona-matrix
 * rows plus row 7. A count asserted rather than assumed, because dropping a
 * row into the cross-surface register is exactly how a matrix quietly loses
 * one.
 */
export const STU_09_MATRIX_AND_CROSS_SURFACE_ROWS =
  STU_09_MATRIX.length + STU_09_CROSS_SURFACE.filter((r) => r.heldOn === 'SURF-DOH').length
