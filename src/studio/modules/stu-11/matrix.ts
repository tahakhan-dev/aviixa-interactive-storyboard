import type {
  StudioMatrixCell,
  StudioMatrixRow,
  StudioPersonaColumn,
} from '@/studio/access/evaluate'
import type { StudioMatrixRowSurface } from '@/studio/modules'

/**
 * `MOD-STU-11`'s own permission matrix — the source's table at **L33268
 * (header) and L33270-L33279 (ten data rows)**, transcribed cell by cell.
 *
 * TWO THINGS READ THIS FILE, and it is shaped for both:
 *
 * 1. `scripts/build-stu-module-reach.mjs` derives which personas are offered
 *    this module's route, using `reachByStudioMatrix` over the rows classified
 *    `screen`. That is why every row carries `surface` and why every row
 *    answers all EIGHT persona columns.
 * 2. `evaluateStudioAccess` (`@/studio/access/evaluate`) answers the
 *    per-control affordance question, one row at a time. There is no
 *    module-level role list anywhere in this module; a control asks for its
 *    own row and gets its own answer.
 *
 * ### FINDING — the module card heads SEVEN columns; the vocabulary has EIGHT
 *
 * L33268's header is `Quality Manager | Supervisor with grant | Supervisor
 * without grant | Tenant Admin | Read-only Auditor | Worker | Implementation
 * team grant`. The **Plant Manager persona** column, which the consolidated
 * matrix at L34539 heads and which `StudioPersonaColumn` carries, is absent
 * from this module card entirely.
 *
 * It is filled here from `DEC-ROLE-001` (L34522) — the persona's Studio access
 * "is delivered by a Supervisor role without the authoring grant" — so its
 * cell on every row is the `supervisor-without-grant` cell, with the same
 * words and the decision named in the note. That is not an invention: on all
 * twenty-three rows of the consolidated matrix (L34541-L34563) the two columns
 * are **identical**, including every approval row — L34550 Submit for review,
 * L34551 Act as Reviewer, L34552 Approve or release and L34559 Hold any stage
 * all read `Explicitly prohibited` in both, and L34542 and L34561 read
 * `Read-only` in both. A blank cell would have read as "withheld" without
 * anybody writing it down, which is the defect L10238 names one level up.
 *
 * ### The two conditions this matrix does NOT carry, stated rather than left
 * ### to inference
 *
 * No cell in these ten rows names a commercial tier or a grant beyond the one
 * that opens its own column, so `requiredTiers` and `requiredGrant` are `null`
 * throughout. They are per-CELL fields (the Agent Author row at L34554 carries
 * three different conditions across three columns), and writing `null` on each
 * cell is the answer rather than the absence of one.
 */

export type StudioApprovalCapabilityId =
  | 'author-and-submit'
  | 'review-a-submission'
  | 'edit-content-while-reviewing'
  | 'return-with-comments'
  | 'advance-to-release'
  | 'release-and-publish'
  | 'hold-release-authority-override'
  | 'assign-release-authority'
  | 'bypass-the-release-authority'
  | 'read-the-approval-log'

export const STU_11_CAPABILITY_IDS = [
  'author-and-submit',
  'review-a-submission',
  'edit-content-while-reviewing',
  'return-with-comments',
  'advance-to-release',
  'release-and-publish',
  'hold-release-authority-override',
  'assign-release-authority',
  'bypass-the-release-authority',
  'read-the-approval-log',
] as const satisfies readonly StudioApprovalCapabilityId[]

type MissingFromCapabilities = Exclude<
  StudioApprovalCapabilityId,
  (typeof STU_11_CAPABILITY_IDS)[number]
>
const _capabilitiesExhaustive: MissingFromCapabilities extends never ? true : never = true
void _capabilitiesExhaustive

export interface StudioApprovalMatrixRow extends StudioMatrixRow {
  readonly id: StudioApprovalCapabilityId
  /** Read by `reachByStudioMatrix`'s clause one. All ten are screen rows. */
  readonly surface: StudioMatrixRowSurface
  /**
   * PER COLUMN, never per row. Task 11's mechanism (`MOD-STU-07`), retrofitted
   * here. Where a prohibited cell's own words name an alternative THIS persona
   * holds, this is that capability's id; `null` is the answer for a categorical
   * prohibition, and it is written on every column rather than omitted.
   *
   * The pointer is CHECKED, never asserted: the fold asks
   * `routedProhibitionApplies` for the routed row's own decision, and a route
   * whose target does not permit this persona collapses back to ABSENT.
   */
  readonly routedTo: Readonly<Record<StudioPersonaColumn, StudioApprovalCapabilityId | null>>
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
      note: `${mirrored.note} — this module's own table (L33268) heads no Plant Manager column; DEC-ROLE-001 (L34522) delivers this persona's Studio access through a Supervisor role without the authoring grant, and the consolidated matrix reads the two columns identically on every row.`,
    },
  }
}

/**
 * Every column answers `null` — this row routes nobody anywhere. Written
 * down rather than left off: a cell that omits the field and a cell that
 * says "no route" read identically at a glance, and only one is an answer.
 */
const ROUTES_NOWHERE: Readonly<Record<StudioPersonaColumn, StudioApprovalCapabilityId | null>> = {
  'quality-manager': null,
  'supervisor-with-authoring-grant': null,
  'supervisor-without-grant': null,
  'plant-manager-persona': null,
  'tenant-admin': null,
  'read-only-auditor': null,
  worker: null,
  'implementation-team': null,
}

/**
 * THE ONE ROUTED ROW ON THIS CARD, and the evidence for both of its columns.
 *
 * Row 3, `Edit content while reviewing`, is refused to everybody — but the
 * Quality Manager cell does not stop at the refusal, it names the route:
 * `Explicitly prohibited — the Reviewer cannot edit; **corrections go back to
 * the Author**` (L33272). `FUNC-STU-11-01-B-3` (L33300) states the same
 * sentence as the row's PURPOSE, not as one column's rider — "corrections go
 * back to the Author so that the Author remains the single content owner and
 * the review remains a review" — and `FUNC-STU-11-01-B-2` (L33299) names the
 * act that sends them back: "Return with comments or advance. Purpose: the
 * two lawful outcomes. Roles allowed: Quality Manager or Supervisor with the
 * grant, in either case not the Author."
 *
 * So the route is `return-with-comments`, and it is carried on exactly the
 * two columns `FUNC-STU-11-01-B-1`/`-B-2` admit to the Reviewer stage. The
 * grant-holder's own cell is a bare `Explicitly prohibited`, and the route is
 * still theirs: the refusal is a row-level rule ("Roles allowed: none"), and
 * the lawful alternative is stated for both Reviewer-stage roles at once.
 *
 * INDEPENDENTLY PINNED, and deliberately not against this field: row 4's own
 * cells at L33273 read `Allowed` in both columns. The fold asks the evaluator
 * for row 4's decision rather than trusting the pointer, so prohibiting row 4
 * collapses row 3 back to ABSENT.
 *
 * The other six columns route nowhere and stay ABSENT. They hold
 * `return-with-comments` nowhere either, so even a route written on them
 * would render nothing — but writing one would be an assertion the data does
 * not support, and the point of this field is that it is not one.
 */
const ROUTES_REVIEWERS_TO_RETURN: Readonly<
  Record<StudioPersonaColumn, StudioApprovalCapabilityId | null>
> = {
  ...ROUTES_NOWHERE,
  'quality-manager': 'return-with-comments',
  'supervisor-with-authoring-grant': 'return-with-comments',
}

export const STU_11_MATRIX = [
  {
    id: 'author-and-submit',
    capability: 'Author and submit',
    surface: 'screen',
    routedTo: ROUTES_NOWHERE,
    isPublishedRead: false,
    stage: 'author',
    sourceRefs: ['L33270'],
    cells: withPlantManager({
      'quality-manager': cell('allowed', 'Allowed'),
      'supervisor-with-authoring-grant': cell('allowed', 'Allowed'),
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      'implementation-team': cell(
        'allowedWithConditions',
        'Allowed with conditions — onboarding only',
      ),
    }),
  },
  {
    id: 'review-a-submission',
    capability: 'Review a submission',
    surface: 'screen',
    routedTo: ROUTES_NOWHERE,
    isPublishedRead: false,
    stage: 'reviewer',
    sourceRefs: ['L33271'],
    cells: withPlantManager({
      'quality-manager': cell(
        'allowedWithConditions',
        'Allowed with conditions — not their own submission, and not if they will release it',
      ),
      'supervisor-with-authoring-grant': cell(
        'allowedWithConditions',
        'Allowed with conditions — act as Reviewer on submissions they did not author',
      ),
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      'implementation-team': PROHIBITED,
    }),
  },
  {
    id: 'edit-content-while-reviewing',
    capability: 'Edit content while reviewing',
    surface: 'screen',
    routedTo: ROUTES_REVIEWERS_TO_RETURN,
    // No stage: this is the capability the source allows to NOBODY
    // (`FUNC-STU-11-01-B-3`, L33300 — "Roles allowed: none"), so there is no
    // stage for anyone to occupy by doing it.
    stage: null,
    isPublishedRead: false,
    sourceRefs: ['L33272', 'FUNC-STU-11-01-B-3 L33300', 'AC-STU-098 L33398'],
    cells: withPlantManager({
      'quality-manager': cell(
        'explicitlyProhibited',
        'Explicitly prohibited — the Reviewer cannot edit; corrections go back to the Author',
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
    id: 'return-with-comments',
    capability: 'Return a submission with comments',
    surface: 'screen',
    routedTo: ROUTES_NOWHERE,
    isPublishedRead: false,
    stage: 'reviewer',
    sourceRefs: ['L33273'],
    cells: withPlantManager({
      'quality-manager': cell('allowed', 'Allowed'),
      'supervisor-with-authoring-grant': cell('allowed', 'Allowed'),
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      'implementation-team': PROHIBITED,
    }),
  },
  {
    id: 'advance-to-release',
    capability: 'Advance a submission to release',
    surface: 'screen',
    routedTo: ROUTES_NOWHERE,
    isPublishedRead: false,
    stage: 'reviewer',
    sourceRefs: ['L33274'],
    cells: withPlantManager({
      'quality-manager': cell('allowed', 'Allowed'),
      'supervisor-with-authoring-grant': cell('allowed', 'Allowed'),
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      'implementation-team': PROHIBITED,
    }),
  },
  {
    id: 'release-and-publish',
    capability: 'Release and publish',
    surface: 'screen',
    routedTo: ROUTES_NOWHERE,
    isPublishedRead: false,
    stage: 'release-authority',
    sourceRefs: ['L33275'],
    cells: withPlantManager({
      'quality-manager': cell(
        'allowedWithConditions',
        'Allowed with conditions — Release Authority by tenant default, never on a submission they authored or reviewed',
      ),
      'supervisor-with-authoring-grant': cell(
        'explicitlyProhibited',
        'Explicitly prohibited — cannot approve or release',
      ),
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      'implementation-team': PROHIBITED,
    }),
  },
  {
    id: 'hold-release-authority-override',
    capability: 'Hold a per-workflow Release Authority override',
    surface: 'screen',
    routedTo: ROUTES_NOWHERE,
    isPublishedRead: false,
    // Holding the override is ELIGIBILITY to be named Release Authority on one
    // workflow. It occupies no stage on any submission by itself, so
    // separation of duties has nothing to check here — it checks at the
    // release, on `release-and-publish`.
    stage: null,
    sourceRefs: ['L33276', 'DEC-RELAUTH-001 L33255'],
    cells: withPlantManager({
      'quality-manager': cell(
        'allowedWithConditions',
        'Allowed with conditions — assignment eligibility is `DEC-RELAUTH-001`',
        'DEC-RELAUTH-001',
      ),
      'supervisor-with-authoring-grant': cell(
        'clientDecisionRequired',
        'Client Decision Required — `DEC-RELAUTH-001`',
        'DEC-RELAUTH-001',
      ),
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      'implementation-team': PROHIBITED,
    }),
  },
  {
    id: 'assign-release-authority',
    capability: 'Assign Release Authority per workflow',
    surface: 'screen',
    routedTo: ROUTES_NOWHERE,
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L33277', 'FUNC-STU-11-03-A-2 L33311'],
    cells: withPlantManager({
      'quality-manager': cell('allowed', 'Allowed'),
      'supervisor-with-authoring-grant': PROHIBITED,
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      'implementation-team': PROHIBITED,
    }),
  },
  {
    id: 'bypass-the-release-authority',
    capability: 'Bypass the Release Authority',
    surface: 'screen',
    routedTo: ROUTES_NOWHERE,
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L33278', 'FUNC-STU-11-01-C-2 L33303', 'AC-STU-099 L33399'],
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
    id: 'read-the-approval-log',
    capability: 'Read the approval log',
    surface: 'screen',
    routedTo: ROUTES_NOWHERE,
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L33279'],
    cells: withPlantManager({
      'quality-manager': cell('allowed', 'Allowed'),
      'supervisor-with-authoring-grant': cell('allowed', 'Allowed'),
      'supervisor-without-grant': cell('readOnly', 'Read-only'),
      'tenant-admin': cell('readOnly', 'Read-only — holds no stage of the chain'),
      'read-only-auditor': cell(
        'clientDecisionRequired',
        'Client Decision Required — `DEC-AUDSTU-001`; the Delivery Operations Hub audit log is the specified route',
        'DEC-AUDSTU-001',
      ),
      worker: PROHIBITED,
      'implementation-team': cell('allowedWithConditions', 'Allowed with conditions'),
    }),
  },
] as const satisfies readonly StudioApprovalMatrixRow[]

type MissingFromMatrix = Exclude<StudioApprovalCapabilityId, (typeof STU_11_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

const BY_ID = new Map<StudioApprovalCapabilityId, StudioApprovalMatrixRow>(
  STU_11_MATRIX.map((row) => [row.id, row]),
)

/**
 * One row, by its capability. Total: the exhaustiveness check above proves
 * every member of the union is in the table, so the fallback can only ever be
 * reached by a caller that has already defeated the type system — and it
 * returns the most restrictive row rather than throwing, because a render that
 * crashes shows nothing about the nine controls beside it.
 */
export function approvalRow(id: StudioApprovalCapabilityId): StudioApprovalMatrixRow {
  return BY_ID.get(id) ?? STU_11_MATRIX[8]
}
