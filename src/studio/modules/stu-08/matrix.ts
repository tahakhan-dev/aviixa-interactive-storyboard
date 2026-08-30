import type {
  StudioMatrixCell,
  StudioMatrixRow,
  StudioPersonaColumn,
} from '@/studio/access/evaluate'
import type { StudioMatrixRowSurface } from '@/studio/modules'

/**
 * `MOD-STU-08`'s own permission matrix — the source's table at **L32815
 * (header), L32816 (separator) and L32817-L32825, nine data rows**,
 * transcribed cell by cell.
 *
 * SEVEN ROWS ARE HERE. THE OTHER TWO ARE `STU_08_CROSS_SURFACE`, BELOW.
 * `STU_08_SOURCE_ROW_COUNT` is what keeps the two halves adding up to the
 * source's nine, so the split cannot quietly lose a row.
 *
 * TWO THINGS READ THIS FILE.
 *
 * 1. `scripts/build-stu-module-reach.mjs` derives which personas are offered
 *    this module's route, using `reachByStudioMatrix` over the rows
 *    classified `screen`. That is why every row carries `surface` and why
 *    every row answers all EIGHT persona columns.
 * 2. `evaluateStudioAccess` answers the per-control affordance question, one
 *    row at a time. There is no module-level role list anywhere in this
 *    module; a control asks for its own row and gets its own answer.
 *
 * ### ROWS 7 AND 8 ARE FRONTLINE CONSEQUENCES, NOT STUDIO CONTROLS
 *
 * "View published content on the device" (L32823) and "View published content
 * on the device while offline" (L32824) are **the only two rows on this
 * surface where the Worker column is the only non-`Not applicable` cell**.
 * L31515 states the convention they exist under: "Because the Studio is
 * web-only and requires an active connection, the statuses `Cached read-only
 * while offline` and `Queued while offline` almost never apply to a Studio
 * actor. Where they appear, they describe the Frontline consequence of a
 * Studio configuration, not a Studio user's own experience, and the row says
 * so."
 *
 * Both are carried in `STU_08_CROSS_SURFACE` rather than in the matrix, for
 * the same two reasons `MOD-STU-09`'s row 7 and `MOD-STU-17`'s row 7 are:
 *
 * - `StudioCellOutcome` deliberately cannot express `Not applicable`. A
 *   PERSONA column with no answer is a blank cell, and a blank cell is a
 *   defect (L10238). The six cells are carried verbatim below as TEXT.
 * - Classified `screen`, row 7's `Allowed with conditions` Worker cell would
 *   derive WORKER reach for a Studio route — contradicting `AC-STU-150`
 *   (L34667), "A Worker cannot reach any Studio route by any means". The
 *   cell is true of `SURF-FL` and false of `SURF-STU`; classifying it
 *   `screen` would assert the second.
 *
 * **A build that renders either as a Studio control invents a screen.** Each
 * renders one STATEMENT naming the surface that holds the capability — never
 * a control, and never a disabled control, which would promise that a Studio
 * user could one day view training content on a device.
 *
 * ### ROW 8'S `Unavailable` IS SENSE A
 *
 * The surface's adjudication holds `Unavailable` overloaded across two senses
 * that render oppositely: *never held* and *held but withheld in this
 * condition*. Row 8 is one of exactly two places on the surface carrying the
 * SECOND sense — the Worker holds the capability (row 7 says so) and it is
 * withheld while offline, by a named condition: "delivery is online-only and
 * content is excluded from the offline work package". The sense is written on
 * the record as `unavailableSense` rather than inferred from the word.
 *
 * ### THERE IS NO `routedTo` FIELD ON THIS CARD, AND THAT IS THE ANSWER
 *
 * The surface's routed prohibition renders a refusal DISABLED only where the
 * cell's own words point the reader at another row OF THIS MATRIX that the
 * evaluator says this same persona may act on. `MOD-STU-06` set the
 * convention for a card where no cell does that: the field is not written at
 * all, because a map of eight nulls per row that no fold reads is prose
 * wearing a mechanism's clothes — declared, never consulted, and free to go
 * wrong the day somebody writes a non-null into it.
 *
 * No cell of this card names an alternative held on this screen. Row 4's
 * Supervisor cell reads "Explicitly prohibited — cannot approve or release",
 * which is a statement of the separation-of-duties floor rather than a
 * routing; row 6's Worker cell names the Frontline Training Library Viewer,
 * which is ANOTHER SURFACE and therefore not a capability in this matrix at
 * all — that route is stated once, by the seam notice.
 *
 * The consuming path is `routedProhibitionApplies` in
 * `@/studio/modules/stu-18/rendering`, and the ten cards that reach it are
 * enumerated by slice 5 gate 17, which fails if this card ever declares the
 * field again without a fold that reads it.
 *
 * ### THE TWO COLUMNS THE CARD DOES NOT HEAD
 *
 * L32815's header is `Quality Manager | Supervisor with grant | Supervisor
 * without grant | Tenant Admin | Read-only Auditor | Worker` — six columns.
 * Neither the **Plant Manager persona** nor **`GRANT-STU-IMPL`** appears, and
 * a blank cell reads as "withheld" without anybody writing it down. Each is
 * filled from a named source line, and every fill is written on the row's own
 * `derivation`.
 *
 * ### `requiredTiers` and `requiredGrant` are `null` on every cell
 *
 * No cell in these rows names a commercial tier or a grant beyond the one
 * that opens its own column. WRITTEN on every cell, so "none" and
 * "unanswered" cannot read alike.
 */

/** The card's own data-row count, L32817-L32825. Nine, and the count is a claim. */
export const STU_08_SOURCE_ROW_COUNT = 9

export type Stu08RowId =
  | 'author-and-upload-training-content'
  | 'submit-content-into-the-approval-chain'
  | 'review-a-submission'
  | 'release-and-publish'
  | 'archive-content'
  | 'read-published-training-content-in-the-studio'
  | 'have-viewing-count-as-execution-or-as-a-qualification'

export const STU_08_ROW_IDS = [
  'author-and-upload-training-content',
  'submit-content-into-the-approval-chain',
  'review-a-submission',
  'release-and-publish',
  'archive-content',
  'read-published-training-content-in-the-studio',
  'have-viewing-count-as-execution-or-as-a-qualification',
] as const satisfies readonly Stu08RowId[]

type MissingFromRowIds = Exclude<Stu08RowId, (typeof STU_08_ROW_IDS)[number]>
const _rowIdsExhaustive: MissingFromRowIds extends never ? true : never = true
void _rowIdsExhaustive

export interface Stu08MatrixRow extends StudioMatrixRow {
  readonly id: Stu08RowId
  /** Read by `reachByStudioMatrix`'s clause one. */
  readonly surface: StudioMatrixRowSurface
  /** Why a column the card does not head reads the way it does. */
  readonly derivation: Readonly<Record<StudioPersonaColumn, string | null>>
}

function cell(
  outcome: StudioMatrixCell['outcome'],
  note: string,
  openDecision: string | null = null,
): StudioMatrixCell {
  return { outcome, note, openDecision, requiredTiers: null, requiredGrant: null }
}

const ALLOWED = cell('allowed', 'Allowed')
const PROHIBITED = cell('explicitlyProhibited', 'Explicitly prohibited')
const READ_ONLY = cell('readOnly', 'Read-only')
const AUDITOR_OPEN = cell(
  'clientDecisionRequired',
  'Client Decision Required — `DEC-AUDSTU-001`',
  'DEC-AUDSTU-001',
)

const PLANT_MANAGER_VIA_SUPERVISOR =
  'MOD-STU-08’s table (L32815) heads no Plant Manager column. DEC-ROLE-001 (L34522) delivers this ' +
  'persona’s Studio access "by a Supervisor role without the authoring grant", so this cell IS ' +
  'that column’s cell, and the substitution is written down rather than aliased silently. ' +
  'Derived Clarification.'

/**
 * FINDING F1 — the card's own function line is NARROWER than the consolidated
 * matrix, and the card wins.
 *
 * `FUNC-STU-08-01-A-1` (L32841) states "Roles allowed: Quality Manager,
 * Supervisor with the grant. Roles prohibited: **all others**" for authoring
 * and uploading training content per language. The consolidated matrix gives
 * `GRANT-STU-IMPL` `Allowed with conditions` on "Author all nine
 * configuration sections" (L34545) and on "Submit for review" (L34550), but
 * both of those rows are about WORKFLOW content; L34520 provisions the team
 * "a provisioned, temporary authoring capacity during onboarding — author and
 * submit only", and nothing in §5.8 extends it to the Training Library.
 *
 * Refused, because L34605 is explicit that the Studio permits nothing it has
 * not been told to permit, and because the module card's own function line is
 * the specific statement for this content. Fail-closed, with the tension
 * recorded rather than smoothed away.
 */
const IMPL_TEAM_FAILS_CLOSED =
  'MOD-STU-08’s table (L32815) heads no `GRANT-STU-IMPL` column. FUNC-STU-08-01-A-1 (L32841) ' +
  'states "Roles allowed: Quality Manager, Supervisor with the grant. Roles prohibited: all ' +
  'others" for training content, which is narrower than the consolidated matrix’s Workflow rows ' +
  '(L34545, L34550). The card’s own function line is the specific statement, and L34605 permits ' +
  'nothing the Studio has not been told to permit. Refused. Derived Clarification, fail-closed.'

const IMPL_TEAM_HOLDS_NO_STAGE =
  'MOD-STU-08’s table heads no `GRANT-STU-IMPL` column; the consolidated matrix states this one ' +
  'directly — "Hold any stage of the approval chain | … | `GRANT-STU-IMPL` | Explicitly ' +
  'prohibited — author and submit only" (L34562), and "Act as Reviewer | … | Explicitly ' +
  'prohibited" (L34551). Transcribed from there. Derived Clarification.'

const IMPL_TEAM_NEVER_RELEASES =
  'MOD-STU-08’s table heads no `GRANT-STU-IMPL` column; the consolidated matrix carries THIS ' +
  'module’s own capability as a row — "Publish Training Library content | Allowed with ' +
  'conditions — as Release Authority | Explicitly prohibited | … | `GRANT-STU-IMPL` | Explicitly ' +
  'prohibited" (L34561). Transcribed from there, not derived. Derived Clarification.'

const IMPL_TEAM_READS =
  'MOD-STU-08’s table heads no `GRANT-STU-IMPL` column; the consolidated matrix states this one ' +
  'directly — "Read published Workflow content | … | `GRANT-STU-IMPL` | Allowed with conditions" ' +
  '(L34542), and L34520 scopes the capacity to onboarding. Transcribed from there. Derived ' +
  'Clarification.'

const UNIVERSAL_REFUSAL =
  'A universal refusal: the card’s own cell prohibits the Quality Manager, who owns this module, ' +
  'so no column this card omits can hold what its owner does not. No derivation is needed and ' +
  'none is invented.'

/**
 * The Plant Manager cell mirrors the without-grant cell and says so in its own
 * derivation rather than being silently aliased.
 */
function withDerivedColumns(
  cells: Omit<
    Record<StudioPersonaColumn, StudioMatrixCell>,
    'plant-manager-persona' | 'implementation-team'
  >,
  implementationTeam: StudioMatrixCell,
  implementationNote: string,
): {
  cells: Record<StudioPersonaColumn, StudioMatrixCell>
  derivation: Record<StudioPersonaColumn, string | null>
} {
  return {
    cells: {
      ...cells,
      'plant-manager-persona': cells['supervisor-without-grant'],
      'implementation-team': implementationTeam,
    },
    derivation: {
      'quality-manager': null,
      'supervisor-with-authoring-grant': null,
      'supervisor-without-grant': null,
      'plant-manager-persona': PLANT_MANAGER_VIA_SUPERVISOR,
      'tenant-admin': null,
      'read-only-auditor': null,
      worker: null,
      'implementation-team': implementationNote,
    },
  }
}

/**
 * `stage` is `null` on all rows but three, and the three are the source's own
 * chain stages (L32846 — "Pass every training item through Author, Reviewer,
 * and Release Authority with separation of duties enforced").
 *
 * Row 1 is deliberately NOT staged: authoring and uploading happen BEFORE a
 * submission exists, so marking it `author` would arm distinctness against a
 * submission that has not been made — the ruling `MOD-STU-09` reached for the
 * same shape.
 */
export const STU_08_MATRIX = [
  {
    id: 'author-and-upload-training-content',
    capability: 'Author and upload Training Library content',
    surface: 'screen',
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L32817', 'FUNC-STU-08-01-A-1 L32841'],
    ...withDerivedColumns(
      {
        'quality-manager': ALLOWED,
        'supervisor-with-authoring-grant': ALLOWED,
        'supervisor-without-grant': PROHIBITED,
        'tenant-admin': PROHIBITED,
        'read-only-auditor': PROHIBITED,
        worker: PROHIBITED,
      },
      PROHIBITED,
      IMPL_TEAM_FAILS_CLOSED,
    ),
  },
  {
    id: 'submit-content-into-the-approval-chain',
    capability: 'Submit content into the approval chain',
    surface: 'screen',
    isPublishedRead: false,
    stage: 'author',
    sourceRefs: ['L32818', 'FUNC-STU-08-02-A-1 L32846'],
    ...withDerivedColumns(
      {
        'quality-manager': ALLOWED,
        'supervisor-with-authoring-grant': ALLOWED,
        'supervisor-without-grant': PROHIBITED,
        'tenant-admin': PROHIBITED,
        'read-only-auditor': PROHIBITED,
        worker: PROHIBITED,
      },
      PROHIBITED,
      IMPL_TEAM_FAILS_CLOSED,
    ),
  },
  {
    id: 'review-a-submission',
    capability: 'Review a submission',
    surface: 'screen',
    isPublishedRead: false,
    stage: 'reviewer',
    sourceRefs: ['L32819', 'L33245', 'FUNC-STU-08-02-A-1 L32846'],
    ...withDerivedColumns(
      {
        'quality-manager': cell(
          'allowedWithConditions',
          'Allowed with conditions — not on own submission',
        ),
        'supervisor-with-authoring-grant': cell(
          'allowedWithConditions',
          'Allowed with conditions — not on own submission',
        ),
        'supervisor-without-grant': PROHIBITED,
        'tenant-admin': PROHIBITED,
        'read-only-auditor': PROHIBITED,
        worker: PROHIBITED,
      },
      PROHIBITED,
      IMPL_TEAM_HOLDS_NO_STAGE,
    ),
  },
  {
    id: 'release-and-publish',
    capability: 'Release and publish',
    surface: 'screen',
    isPublishedRead: false,
    stage: 'release-authority',
    sourceRefs: ['L32820', 'L34561', 'FUNC-STU-11-01-C-1 L33302'],
    ...withDerivedColumns(
      {
        'quality-manager': cell(
          'allowedWithConditions',
          'Allowed with conditions — Release Authority by tenant default, not on own submission',
        ),
        'supervisor-with-authoring-grant': cell(
          'explicitlyProhibited',
          'Explicitly prohibited — cannot approve or release',
        ),
        'supervisor-without-grant': PROHIBITED,
        'tenant-admin': PROHIBITED,
        'read-only-auditor': PROHIBITED,
        worker: PROHIBITED,
      },
      PROHIBITED,
      IMPL_TEAM_NEVER_RELEASES,
    ),
  },
  {
    id: 'archive-content',
    capability: 'Archive content',
    surface: 'screen',
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L32821', 'L32865'],
    ...withDerivedColumns(
      {
        'quality-manager': ALLOWED,
        'supervisor-with-authoring-grant': PROHIBITED,
        'supervisor-without-grant': PROHIBITED,
        'tenant-admin': PROHIBITED,
        'read-only-auditor': PROHIBITED,
        worker: PROHIBITED,
      },
      PROHIBITED,
      IMPL_TEAM_HOLDS_NO_STAGE,
    ),
  },
  {
    id: 'read-published-training-content-in-the-studio',
    capability: 'Read published training content in the Studio',
    surface: 'screen',
    isPublishedRead: true,
    stage: null,
    sourceRefs: ['L32822', 'AC-STU-157 L34674'],
    ...withDerivedColumns(
      {
        'quality-manager': ALLOWED,
        'supervisor-with-authoring-grant': ALLOWED,
        'supervisor-without-grant': READ_ONLY,
        'tenant-admin': READ_ONLY,
        // AC-STU-157 (L34674) keeps this unassumed in either direction.
        'read-only-auditor': AUDITOR_OPEN,
        worker: cell(
          'explicitlyProhibited',
          'Explicitly prohibited — workers view it through the Frontline Training Library Viewer',
        ),
      },
      cell('allowedWithConditions', 'Allowed with conditions — onboarding only'),
      IMPL_TEAM_READS,
    ),
  },
  {
    id: 'have-viewing-count-as-execution-or-as-a-qualification',
    capability: 'Have viewing count as execution or as a qualification',
    surface: 'screen',
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L32825', 'FUNC-STU-08-03-B-1 L32851', 'AC-STU-081 L32923'],
    ...withDerivedColumns(
      {
        'quality-manager': PROHIBITED,
        'supervisor-with-authoring-grant': PROHIBITED,
        'supervisor-without-grant': PROHIBITED,
        'tenant-admin': PROHIBITED,
        'read-only-auditor': PROHIBITED,
        worker: PROHIBITED,
      },
      PROHIBITED,
      UNIVERSAL_REFUSAL,
    ),
  },
] as const satisfies readonly Stu08MatrixRow[]

type MissingFromMatrix = Exclude<Stu08RowId, (typeof STU_08_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

const BY_ID = new Map<Stu08RowId, Stu08MatrixRow>(STU_08_MATRIX.map((row) => [row.id, row]))

/** One row, by id. Throws on an unknown id: every caller passes a literal. */
export function stu08Row(id: Stu08RowId): Stu08MatrixRow {
  const found = BY_ID.get(id)
  if (found === undefined) throw new Error(`MOD-STU-08: no matrix row named "${id}".`)
  return found
}

/* ==================================================================== *
 * ROWS 7 AND 8 — FRONTLINE CONSEQUENCES. Each renders one STATEMENT.
 * ==================================================================== */

export type Stu08CrossSurfaceRowId =
  | 'view-published-content-on-the-device'
  | 'view-published-content-on-the-device-while-offline'

export interface Stu08CrossSurfaceRow {
  readonly id: Stu08CrossSurfaceRowId
  readonly capability: string
  /**
   * The surface that actually holds the capability. Deliberately NOT named
   * `surface`: `scripts/build-stu-module-reach.mjs` finds a module's matrix
   * by looking for the one exported array whose every row carries `surface`,
   * and a second such array in this file would make it read neither.
   */
  readonly heldOn: 'SURF-FL'
  readonly owner: string
  /** The six source cells, verbatim, in the card's own header order. */
  readonly cells: readonly { readonly column: string; readonly text: string }[]
  /**
   * What a Studio screen draws for this row: one sentence, never a control
   * and never a disabled control. Written down rather than inferred from an
   * absent component.
   */
  readonly renders: 'cross-surface-statement'
  /** The one sentence the Studio screen renders in place of a control. */
  readonly statement: string
  /**
   * The condition the row's Worker cell names. Both rows state one, and
   * neither is a Studio state.
   */
  readonly condition: string
  /**
   * Which sense of `Unavailable` this row carries, or `null` where it carries
   * none. Row 8 is one of exactly two places on this surface using the
   * *withheld-in-this-condition* sense; the surface's adjudication holds the
   * token overloaded, so the sense is DECLARED rather than read off the word.
   */
  readonly unavailableSense: 'withheld-in-this-condition' | null
  readonly sourceRefs: readonly string[]
}

const STUDIO_IS_THE_AUTHORING_SURFACE =
  'The Frontline Worker Application, MOD-FL-B12 — the Training Library Viewer, specified in ' +
  'Chapter 22 and owned by slice 7.'

export const STU_08_CROSS_SURFACE = [
  {
    id: 'view-published-content-on-the-device',
    capability: 'View published content on the device',
    heldOn: 'SURF-FL',
    owner: STUDIO_IS_THE_AUTHORING_SURFACE,
    cells: [
      {
        column: 'Quality Manager',
        text: 'Not applicable — the Studio is the authoring surface',
      },
      { column: 'Supervisor with grant', text: 'Not applicable — same reason' },
      { column: 'Supervisor without grant', text: 'Not applicable — same reason' },
      { column: 'Tenant Admin', text: 'Not applicable — same reason' },
      { column: 'Read-only Auditor', text: 'Not applicable — same reason' },
      {
        column: 'Worker',
        text: 'Allowed with conditions — online only, through the Frontline Training Library Viewer',
      },
    ],
    renders: 'cross-surface-statement',
    statement:
      'A Worker views published training content on the device, over a connection, through the ' +
      'Frontline Training Library Viewer — never in the Studio. The Studio is the authoring ' +
      'surface, so this row is Not applicable in all five of its Studio columns and no control ' +
      'for it exists here, for any persona, in any state.',
    condition: 'online only, through the Frontline Training Library Viewer',
    unavailableSense: null,
    sourceRefs: ['L32823', 'L31515', 'AC-STU-150 L34667'],
  },
  {
    id: 'view-published-content-on-the-device-while-offline',
    capability: 'View published content on the device while offline',
    heldOn: 'SURF-FL',
    owner: STUDIO_IS_THE_AUTHORING_SURFACE,
    cells: [
      { column: 'Quality Manager', text: 'Not applicable — same reason' },
      { column: 'Supervisor with grant', text: 'Not applicable — same reason' },
      { column: 'Supervisor without grant', text: 'Not applicable — same reason' },
      { column: 'Tenant Admin', text: 'Not applicable — same reason' },
      { column: 'Read-only Auditor', text: 'Not applicable — same reason' },
      {
        column: 'Worker',
        text: 'Unavailable — delivery is online-only and content is excluded from the offline work package',
      },
    ],
    renders: 'cross-surface-statement',
    statement:
      'Offline, the Frontline Training Library Viewer states that training content requires a ' +
      'connection; no cached or partial item is presented as though it were available, and no ' +
      'Run is affected, because no Run depends on training content. This is the Worker’s ' +
      'experience on the device — it is not a Studio state, and the Studio offers no control ' +
      'for it.',
    condition:
      'delivery is online-only and content is excluded from the offline work package',
    unavailableSense: 'withheld-in-this-condition',
    sourceRefs: [
      'L32824',
      'L31515',
      'FUNC-STU-08-03-A-1 L32849',
      'AC-STU-085 L32927',
      'L32865',
    ],
  },
] as const satisfies readonly Stu08CrossSurfaceRow[]

type MissingFromCrossSurface = Exclude<
  Stu08CrossSurfaceRowId,
  (typeof STU_08_CROSS_SURFACE)[number]['id']
>
const _crossSurfaceExhaustive: MissingFromCrossSurface extends never ? true : never = true
void _crossSurfaceExhaustive
