import type {
  StudioMatrixCell,
  StudioMatrixRow,
  StudioPersonaColumn,
} from '@/studio/access/evaluate'
import type { StudioMatrixRowSurface } from '@/studio/modules'

/**
 * `MOD-STU-03`'s own permission matrix — the source's table at **L31902
 * (header), L31903 (separator) and L31904–L31912 (nine data rows)**,
 * transcribed cell by cell.
 *
 * TWO THINGS READ THIS FILE, and it is shaped for both:
 *
 * 1. `scripts/build-stu-module-reach.mjs` derives which personas are offered
 *    this module's route, using `reachByStudioMatrix` over the rows
 *    classified `screen`. That is why every row carries `surface` and why
 *    every row answers all EIGHT persona columns.
 * 2. `evaluateStudioAccess` (`@/studio/access/evaluate`) answers the
 *    per-control affordance question, one row at a time. There is no
 *    module-level role list anywhere in this module; a control asks for its
 *    own row and gets its own answer.
 *
 * ### FINDING — the module card heads SEVEN columns; the vocabulary has EIGHT
 *
 * L31902's header is `Quality Manager | Supervisor with grant | Supervisor
 * without grant | Tenant Admin | Read-only Auditor | Worker | Implementation
 * team grant`. The **Plant Manager persona** column, which the consolidated
 * matrix at L34539 heads and which `StudioPersonaColumn` carries, is absent
 * from this module card entirely — the same absence `MOD-STU-11`'s card has.
 *
 * It is filled from `DEC-ROLE-001` (L34522): the persona's Studio access "is
 * delivered by a Supervisor role without the authoring grant". Its cell on
 * every row is therefore the `supervisor-without-grant` cell, carrying the
 * same words with the substitution named in the note. That is not an
 * invention, and it produces exactly the access §5.18 describes for this
 * module: read the Library (row 1, `Allowed`), read linkage (row 8,
 * `Read-only`), author nothing (rows 3–6, `Explicitly prohibited`). A blank
 * cell would have read as "withheld" without anybody writing it down.
 *
 * ### `requiredTiers` and `requiredGrant` are `null` on every cell, and that
 * ### is an answer rather than an omission
 *
 * No cell in these nine rows names a commercial tier or a grant beyond the
 * one that opens its own column, and the source states the tier position
 * positively twice rather than leaving it silent:
 *
 * - Job Type "is available at every commercial tier" (L31890);
 * - under `DEC-TAX-002`'s adopted working position every tenant creates its
 *   own Job Types and Service Type tags "immediately, on every tier, with no
 *   platform approval step, so no tenant is blocked" (L31892).
 *
 * Hanging a tier off row 6 would therefore contradict the source directly.
 *
 * ### `stage` is `null` on every row, and that is also an answer
 *
 * `StudioMatrixRow.stage` records which of the three approval stages a
 * capability OCCUPIES. None of these nine does: creating and classifying a
 * Workflow is authoring work that happens before a submission exists, and
 * the chain's own stages are `MOD-STU-11`'s rows (L33270–L33279). Marking
 * row 3 `author` would arm separation-of-duties evaluation against a
 * submission that has not been made, and `AC-STU-052`'s "can author and
 * submit and can never approve or release" is enforced where the approve and
 * release controls live, not here.
 */

export type Stu03RowId =
  | 'open-the-library-filtered-to-published'
  | 'see-draft-and-in-review-workflows'
  | 'create-a-new-workflow'
  | 'apply-a-job-type-to-a-workflow'
  | 'apply-a-service-type-tag'
  | 'create-a-custom-job-type-or-service-type-tag'
  | 'edit-or-delete-a-platform-seeded-starter-type'
  | 'see-linkage-counts'
  | 'see-another-tenants-workflows'

export const STU_03_ROW_IDS = [
  'open-the-library-filtered-to-published',
  'see-draft-and-in-review-workflows',
  'create-a-new-workflow',
  'apply-a-job-type-to-a-workflow',
  'apply-a-service-type-tag',
  'create-a-custom-job-type-or-service-type-tag',
  'edit-or-delete-a-platform-seeded-starter-type',
  'see-linkage-counts',
  'see-another-tenants-workflows',
] as const satisfies readonly Stu03RowId[]

type MissingFromRowIds = Exclude<Stu03RowId, (typeof STU_03_ROW_IDS)[number]>
const _rowIdsExhaustive: MissingFromRowIds extends never ? true : never = true
void _rowIdsExhaustive

/**
 * A rendering the STORYBOARD states for a control whose matrix cell reads
 * `Explicitly prohibited`, declared on the row that carries it.
 *
 * WHY THIS IS A ROW FIELD AND NOT A BRANCH IN THE FOLD. `Explicitly
 * prohibited` carries no rendering anywhere in the frozen source, so this
 * build renders it ABSENT everywhere — except that `SB-STU-06` (L31976)
 * states the opposite for exactly one control, by name and with its reason:
 * "A New Workflow button sits top-right, visible to grant-holders and
 * **disabled with a stated reason for read-only roles rather than hidden**,
 * so a Supervisor understands they need the grant rather than assuming the
 * feature is missing."
 *
 * That is the ABSENT/DISABLED rule applied, not broken: a Supervisor holds
 * "create a Workflow" generally and is refused now for a named, fixable
 * reason — the authoring grant. Writing the exception as DATA ON THE ROW,
 * read once by `libraryAffordance`, is what stops it becoming a special case
 * inside a fold that eight other rows also pass through.
 */
export interface StoryboardProhibitionRendering {
  /** The storyboard's own sentence, quoted. */
  readonly statement: string
  /**
   * The condition to name to a **Supervisor without the grant**, and to
   * nobody else.
   *
   * IT IS PERSONA-SPECIFIC BECAUSE THE OBSTACLE IS. L31976 names the
   * Supervisor by name — "so a Supervisor understands they need the grant" —
   * and the Supervisor's two columns are one role split by a grant (L34584),
   * so the grant really is what separates them. It is NOT what separates the
   * other read-only personas from this capability, and saying so to them
   * would name the wrong missing condition:
   *
   * - the **Plant Manager persona** is stated read-only and unable to edit by
   *   §5.18, so offering it the authoring grant would offer a capacity the
   *   source withholds. `MOD-STU-18` reached the same exclusion for the same
   *   reason and this module does not disagree with it.
   * - the **Tenant Admin** administers grants and may not self-assign one
   *   (L34584), so "ask your Tenant Admin" is addressed to the person reading
   *   it and is advice they cannot act on.
   *
   * Every other persona gets the evaluator's own stated reason instead, which
   * is what `AC-STU-155` (L34672) asks for: the specific missing condition.
   */
  readonly grantCondition: string
  /** Said to every persona the control is drawn for. The storyboard's point. */
  readonly generalCondition: string
  readonly sourceRef: string
}

export interface StudioLibraryMatrixRow extends StudioMatrixRow {
  readonly id: Stu03RowId
  /** Read by `reachByStudioMatrix`'s clause one. All nine are screen rows. */
  readonly surface: StudioMatrixRowSurface
  /**
   * Non-null on the ONE row `SB-STU-06` states a rendering for. Every other
   * row leaves a prohibited cell absent, which is the surface default.
   */
  readonly storyboardProhibition: StoryboardProhibitionRendering | null
}

function cell(
  outcome: StudioMatrixCell['outcome'],
  note: string,
  openDecision: string | null = null,
): StudioMatrixCell {
  // `requiredTiers` and `requiredGrant` are written on every cell rather than
  // left off: a cell that omits them and a cell that states "none" read
  // identically at a glance, and only one of them is an answer.
  return { outcome, note, openDecision, requiredTiers: null, requiredGrant: null }
}

const PROHIBITED = cell('explicitlyProhibited', 'Explicitly prohibited')
const ALLOWED = cell('allowed', 'Allowed')
const AUDITOR_OPEN = cell(
  'clientDecisionRequired',
  'Client Decision Required — DEC-AUDSTU-001',
  'DEC-AUDSTU-001',
)
const DURING_ONBOARDING = cell(
  'allowedWithConditions',
  'Allowed with conditions — during onboarding only',
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
        `${mirrored.note} — this module’s own table (L31902) heads no Plant Manager column; ` +
        'DEC-ROLE-001 (L34522) delivers this persona’s Studio access through a Supervisor role ' +
        'without the authoring grant, which produces exactly the read-only access §5.18 describes.',
    },
  }
}

/** The nine rows of L31904–L31912, one row per source line, in source order. */
export const STU_03_MATRIX = [
  {
    id: 'open-the-library-filtered-to-published',
    capability: 'Open the Library filtered to Published',
    surface: 'screen',
    // THE published-read row. L34605's fail-closed floor keeps exactly this
    // open when the identity layer is unreachable: "permits nothing beyond
    // published read". `AC-STU-017` (L31097) and `AC-STU-047` (L32012) make
    // the Published filter the landing state rather than a preference.
    isPublishedRead: true,
    stage: null,
    storyboardProhibition: null,
    sourceRefs: ['L31904', 'AC-STU-017 L31097', 'AC-STU-047 L32012'],
    cells: withPlantManager({
      'quality-manager': ALLOWED,
      'supervisor-with-authoring-grant': ALLOWED,
      'supervisor-without-grant': ALLOWED,
      'tenant-admin': ALLOWED,
      'read-only-auditor': AUDITOR_OPEN,
      worker: PROHIBITED,
      'implementation-team': DURING_ONBOARDING,
    }),
  },
  {
    id: 'see-draft-and-in-review-workflows',
    capability: 'See Draft and In Review Workflows',
    surface: 'screen',
    isPublishedRead: false,
    stage: null,
    storyboardProhibition: null,
    // The narrowest read that is not a prohibition. With row 1 — the widest
    // read on the surface — this pair IS the draft-visibility boundary, and
    // `AC-STU-048` (L32013) is the test over it. R14: it is enforced in the
    // READ (`workflowsVisibleTo`), never by hiding drawn rows.
    sourceRefs: ['L31905', 'AC-STU-048 L32013', 'L32004'],
    cells: withPlantManager({
      'quality-manager': ALLOWED,
      'supervisor-with-authoring-grant': cell(
        'allowedWithConditions',
        'Allowed with conditions — grant-holders and the chain only',
      ),
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': AUDITOR_OPEN,
      worker: PROHIBITED,
      'implementation-team': DURING_ONBOARDING,
    }),
  },
  {
    id: 'create-a-new-workflow',
    capability: 'Create a new Workflow',
    surface: 'screen',
    isPublishedRead: false,
    stage: null,
    storyboardProhibition: {
      statement:
        'A New Workflow button sits top-right, visible to grant-holders and disabled with a ' +
        'stated reason for read-only roles rather than hidden, so a Supervisor understands they ' +
        'need the grant rather than assuming the feature is missing.',
      // The wording follows `SB-STU-21`'s own worked example of a stated
      // missing condition (L34631) — "Requires the authoring grant. Ask your
      // Tenant Admin." — so a reader meets one sentence for one obstacle
      // across both surfaces rather than two spellings of it.
      grantCondition: 'Requires the authoring grant, GRANT-STU-AUTHOR. Ask your Tenant Admin.',
      generalCondition: 'The feature exists and is not missing; this view does not hold it.',
      sourceRef: 'SB-STU-06 L31976',
    },
    sourceRefs: ['L31906', 'SB-STU-06 L31976', 'FUNC-STU-03-01-B-1 L31934'],
    cells: withPlantManager({
      'quality-manager': ALLOWED,
      'supervisor-with-authoring-grant': ALLOWED,
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      'implementation-team': cell(
        'allowedWithConditions',
        'Allowed with conditions — author and submit only',
      ),
    }),
  },
  {
    id: 'apply-a-job-type-to-a-workflow',
    capability: 'Apply a Job Type to a Workflow',
    surface: 'screen',
    isPublishedRead: false,
    stage: null,
    storyboardProhibition: null,
    sourceRefs: ['L31907', 'L31890', 'AC-STU-050 L32015'],
    cells: withPlantManager({
      'quality-manager': ALLOWED,
      'supervisor-with-authoring-grant': ALLOWED,
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      'implementation-team': cell('allowedWithConditions', 'Allowed with conditions'),
    }),
  },
  {
    id: 'apply-a-service-type-tag',
    capability: 'Apply a Service Type tag',
    surface: 'screen',
    isPublishedRead: false,
    stage: null,
    storyboardProhibition: null,
    sourceRefs: ['L31908', 'L31890', 'AC-STU-051 L32016'],
    cells: withPlantManager({
      'quality-manager': ALLOWED,
      'supervisor-with-authoring-grant': ALLOWED,
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      'implementation-team': cell('allowedWithConditions', 'Allowed with conditions'),
    }),
  },
  {
    id: 'create-a-custom-job-type-or-service-type-tag',
    capability: 'Create a custom Job Type or Service Type tag',
    surface: 'screen',
    isPublishedRead: false,
    stage: null,
    storyboardProhibition: null,
    // Three columns defer to `DEC-TAXROLE-001` (L31914) and one grants
    // outright. Under `DEC-TAX-002`'s adopted position this is the ORDINARY
    // path at version 1, not an extension: the seeded catalogue is empty, so
    // a tenant with no custom Job Type has no Job Type at all.
    sourceRefs: ['L31909', 'DEC-TAXROLE-001 L31914', 'FUNC-STU-03-02-B-1 L31939'],
    cells: withPlantManager({
      'quality-manager': ALLOWED,
      'supervisor-with-authoring-grant': cell(
        'clientDecisionRequired',
        'Client Decision Required — the Statement of Work says tenants may create custom types without naming the role',
        'DEC-TAXROLE-001',
      ),
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': cell(
        'clientDecisionRequired',
        'Client Decision Required — the tenant administration area is a plausible home; not stated',
        'DEC-TAXROLE-001',
      ),
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      'implementation-team': cell(
        'clientDecisionRequired',
        'Client Decision Required',
        'DEC-TAXROLE-001',
      ),
    }),
  },
  {
    id: 'edit-or-delete-a-platform-seeded-starter-type',
    capability: 'Edit or delete a platform-seeded starter type',
    surface: 'screen',
    isPublishedRead: false,
    stage: null,
    storyboardProhibition: null,
    // Eight prohibitions, and `AC-STU-049` (L32014) states the rule rather
    // than the list — which matters, because under `DEC-TAX-002` the seeded
    // catalogue is EMPTY at version 1. A check that walked the seeded
    // entries would pass on an empty set and prove nothing; the rule is
    // asserted over the eight columns instead.
    sourceRefs: ['L31910', 'AC-STU-049 L32014', 'FUNC-STU-03-02-A-1 L31937'],
    cells: withPlantManager({
      'quality-manager': cell(
        'explicitlyProhibited',
        'Explicitly prohibited — inherited read-only',
      ),
      'supervisor-with-authoring-grant': PROHIBITED,
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      'implementation-team': PROHIBITED,
    }),
  },
  {
    id: 'see-linkage-counts',
    capability: 'See linkage counts',
    surface: 'screen',
    isPublishedRead: false,
    stage: null,
    storyboardProhibition: null,
    sourceRefs: ['L31911', 'AC-STU-053 L32018', 'FUNC-STU-03-01-A-1 L31930'],
    cells: withPlantManager({
      'quality-manager': ALLOWED,
      'supervisor-with-authoring-grant': ALLOWED,
      'supervisor-without-grant': cell('readOnly', 'Read-only'),
      'tenant-admin': cell('readOnly', 'Read-only'),
      'read-only-auditor': AUDITOR_OPEN,
      worker: PROHIBITED,
      'implementation-team': cell('allowedWithConditions', 'Allowed with conditions'),
    }),
  },
  {
    id: 'see-another-tenants-workflows',
    capability: "See another tenant's Workflows",
    // A SCREEN ROW WHOSE EVERY CELL REFUSES, which is the honest
    // classification: the capability exists nowhere, for anybody, on any
    // surface. `another-surface` would reserve that somebody somewhere holds
    // it, and nobody does.
    surface: 'screen',
    isPublishedRead: false,
    stage: null,
    storyboardProhibition: null,
    sourceRefs: ['L31912', 'L31879', 'L32004', 'TEST-STU-060 L32028'],
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
] as const satisfies readonly StudioLibraryMatrixRow[]

/**
 * Total over the nine. Throws on an unknown id rather than returning
 * `undefined`: every caller passes a literal `Stu03RowId`, so an unknown one
 * is a defect and not a state to render.
 */
export function stu03Row(id: Stu03RowId): StudioLibraryMatrixRow {
  const found = STU_03_MATRIX.find((row) => row.id === id)
  if (found === undefined) {
    throw new Error(`MOD-STU-03: no matrix row is transcribed for "${id}".`)
  }
  return found
}
