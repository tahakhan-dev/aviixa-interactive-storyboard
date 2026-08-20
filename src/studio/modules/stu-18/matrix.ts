import type { StudioMatrixCell, StudioMatrixRow, StudioPersonaColumn } from '@/studio/access/evaluate'
import { STUDIO_PERSONA_COLUMNS } from '@/studio/access/evaluate'
import type { StudioMatrixRowSurface } from '@/studio/modules'

/**
 * `MOD-STU-18`'s own data: the consolidated Studio permission matrix,
 * transcribed from the frozen source at **L34539 (header) and L34541-L34563
 * (twenty-three data rows)**, one row per line, in the source's own order.
 *
 * OWNERSHIP. Task 4 owns the module registry and `StudioMatrixRowSurface`;
 * task 1 owns `StudioMatrixRow`, `StudioMatrixCell` and `StudioPersonaColumn`.
 * NEITHER TYPE IS REDEFINED HERE. This file holds the DATA, and the data is
 * the only thing this module owns about the matrix.
 *
 * CELLS KEY ON `StudioPersonaColumn`, NOT ON `RoleId`. The source heads eight
 * columns and there are five tenant roles: the two Supervisor columns, the
 * Plant Manager persona and `GRANT-STU-IMPL` all collapse under a role key,
 * and `scripts/build-stu-module-reach.mjs` refuses a matrix keyed on anything
 * else rather than reading it partially.
 *
 * WHY EVERY CONSTRAINT SITS ON THE CELL AND NEVER ON THE ROW. **L34554**
 * carries three different conditions in three columns — the Quality Manager's
 * names only a tier, the Supervisor's names a grant AND a tier, the Tenant
 * Admin's names only a grant. A row-level `requiredGrant` would demand
 * `GRANT-STU-AGENT` of the one persona who holds the capability by role
 * (L34553, `Hold or delegate the Agent Author capability | Allowed`), and a
 * row-level `requiredTiers` would let a Tenant Admin compose on Starter. A
 * row is not uniform across its columns.
 *
 * TWO TOKENS THAT ARE NOT WHAT THEY LOOK LIKE, and both live in this table:
 *
 * - **`Explicitly prohibited` carries no rendering anywhere in the source.**
 *   It is a statement about authority. Nothing in this file infers a control
 *   treatment from it; `rendering.ts` decides that, once.
 * - **`Unavailable` is overloaded.** Row 23 (L34563) settles the connectivity
 *   axis in a single row: seven columns read `Unavailable — the Studio
 *   requires an active connection` (sense A — the capability exists and is
 *   withheld by a condition) against one column reading `Explicitly
 *   prohibited — no access at all` (never held). Same row, same axis, two
 *   tokens, two renderings.
 *
 * Every `note` below is the cell's own words from the source line, verbatim.
 * Where the source writes a bare status the note is that status; where it
 * writes a status and a qualifier the note carries both, because the
 * qualifier is frequently the whole answer (row 21's `Read-only — may
 * generate the read-only export` GRANTS an export a mechanical `Read-only`
 * mapping would remove).
 */

/* ==================================================================== *
 * The row vocabulary.
 * ==================================================================== */

export type Stu18RowId =
  | 'open-the-studio'
  | 'read-published-workflow-content'
  | 'read-drafts-and-in-review-versions'
  | 'create-a-workflow'
  | 'author-all-nine-configuration-sections'
  | 'create-and-apply-shared-instruction-blocks'
  | 'create-edit-archive-content-library-items'
  | 'propose-a-content-library-change'
  | 'manage-qualification-requirements'
  | 'submit-for-review'
  | 'act-as-reviewer'
  | 'approve-or-release'
  | 'hold-or-delegate-the-agent-author-capability'
  | 'compose-a-reasoning-agent'
  | 'enable-or-disable-an-atomic-capability'
  | 'read-the-learning-view'
  | 'decide-a-lane-b-proposal'
  | 'assign-or-revoke-the-two-grants'
  | 'hold-any-stage-of-the-approval-chain'
  | 'publish-training-library-content'
  | 'generate-a-portable-document-format-export'
  | 'widen-beyond-the-floor'
  | 'use-any-capability-while-offline'

export const STU18_ROW_IDS = [
  'open-the-studio',
  'read-published-workflow-content',
  'read-drafts-and-in-review-versions',
  'create-a-workflow',
  'author-all-nine-configuration-sections',
  'create-and-apply-shared-instruction-blocks',
  'create-edit-archive-content-library-items',
  'propose-a-content-library-change',
  'manage-qualification-requirements',
  'submit-for-review',
  'act-as-reviewer',
  'approve-or-release',
  'hold-or-delegate-the-agent-author-capability',
  'compose-a-reasoning-agent',
  'enable-or-disable-an-atomic-capability',
  'read-the-learning-view',
  'decide-a-lane-b-proposal',
  'assign-or-revoke-the-two-grants',
  'hold-any-stage-of-the-approval-chain',
  'publish-training-library-content',
  'generate-a-portable-document-format-export',
  'widen-beyond-the-floor',
  'use-any-capability-while-offline',
] as const satisfies readonly Stu18RowId[]

type MissingFromRowIds = Exclude<Stu18RowId, (typeof STU18_ROW_IDS)[number]>
const _rowIdsExhaustive: MissingFromRowIds extends never ? true : never = true
void _rowIdsExhaustive

/**
 * One row of this module's matrix. Task 1's row type, plus the two fields
 * this surface's consumers need: an id, and task 4's row classification.
 *
 * `surface` is what stops chrome counting as module standing. Row 1 (`Open
 * the Studio`) and row 23 (the connectivity row) are `chrome`; row 17 is
 * `another-surface`, because its own cell says the decision is taken in the
 * Client Command Center. Counting row 23 as a screen row would withhold this
 * module from every persona, since seven of its eight cells refuse.
 */
export type Stu18MatrixRow = StudioMatrixRow & {
  readonly id: Stu18RowId
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
  readonly routedTo: Readonly<Record<StudioPersonaColumn, Stu18RowId | null>>
}

/* ==================================================================== *
 * Cell constructors. Nothing here decides anything; they exist so a
 * hundred and eighty-four cells can be written without a hundred and
 * eighty-four repetitions of four null fields.
 * ==================================================================== */

interface CellExtra {
  readonly openDecision?: string
  readonly requiredTiers?: StudioMatrixCell['requiredTiers']
  readonly requiredGrant?: StudioMatrixCell['requiredGrant']
}

function cell(
  outcome: StudioMatrixCell['outcome'],
  note: string,
  extra: CellExtra = {},
): StudioMatrixCell {
  return {
    outcome,
    note,
    openDecision: extra.openDecision ?? null,
    requiredTiers: extra.requiredTiers ?? null,
    requiredGrant: extra.requiredGrant ?? null,
  }
}

const ALLOWED = cell('allowed', 'Allowed')
const READ_ONLY = cell('readOnly', 'Read-only')
const PROHIBITED = cell('explicitlyProhibited', 'Explicitly prohibited')
const AUDITOR_OPEN = cell('clientDecisionRequired', 'Client Decision Required — DEC-AUDSTU-001', {
  openDecision: 'DEC-AUDSTU-001',
})

/**
 * The default is a PROHIBITION, and every deviation from it is written out.
 * That direction matters: an omitted column would otherwise read as whatever
 * the last one said, and `Every cell carries an explicit status` (L34537) is
 * the rule this table is built to keep. A missing key is impossible — the
 * return type is a total `Record` over the eight columns.
 */
function cellsOf(
  overrides: Partial<Record<StudioPersonaColumn, StudioMatrixCell>>,
): Readonly<Record<StudioPersonaColumn, StudioMatrixCell>> {
  const out = {} as Record<StudioPersonaColumn, StudioMatrixCell>
  for (const column of STUDIO_PERSONA_COLUMNS) out[column] = overrides[column] ?? PROHIBITED
  return out
}

/* ==================================================================== *
 * THE TWENTY-THREE ROWS — L34541 to L34563, one row per source line.
 * ==================================================================== */

/**
 * Every column answers `null` — this row routes nobody anywhere. Written
 * down rather than left off: a cell that omits the field and a cell that
 * says "no route" read identically at a glance, and only one is an answer.
 */
const ROUTES_NOWHERE: Readonly<Record<StudioPersonaColumn, Stu18RowId | null>> = {
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
 * THE THREE ROUTED CELLS OF THE CONSOLIDATED MATRIX, each with the row that
 * receives it and the cell that proves the receiver permits the same persona.
 *
 * This card RESTATES other modules' rules, so most of its prohibitions are
 * categorical restatements and route nowhere. Three are not: their own words
 * name the alternative the same holder keeps, and the row holding it is on
 * this very card, one or nine lines away.
 *
 * 1. Row 7, `Create, edit, archive Content Library items` (L34547) — the
 *    grant-holder's cell reads `Explicitly prohibited — **may propose only**`.
 *    Row 8, `Propose a Content Library change` (L34548), reads `Allowed` in
 *    that same column. This is `MOD-STU-07`'s routing rule (L32628/L32631)
 *    restated at the consolidated level, and it routes here for the same
 *    reason it routes there.
 * 2. Row 13, `Hold or delegate the Agent Author capability` (L34553) — the
 *    Tenant Admin's cell reads `Explicitly prohibited — **assigns it, does
 *    not hold it by default**`. Row 19, `Assign or revoke GRANT-STU-AUTHOR
 *    and GRANT-STU-AGENT` (L34558), reads `Allowed — administers Studio
 *    capacities from the tenant administration area` in that same column.
 *    The cell names the act; the act is a row of this table.
 * 3. Row 20, `Hold any stage of the approval chain` (L34559) — the
 *    implementation-team cell reads `Explicitly prohibited — **author and
 *    submit only**`. Row 10, `Submit for review` (L34550), reads `Allowed
 *    with conditions` in that same column, and L34520 provisions the capacity
 *    in exactly those words.
 *
 * NOT ROUTED, and each is an answer rather than an omission:
 *
 * - Row 13's grant-holder cell says `unless delegated GRANT-STU-AGENT`. That
 *   is a CONDITION on this capability, not a different capability elsewhere,
 *   and `requiredGrant` is the field that carries it.
 * - Row 20's Tenant Admin cell says `holds no stage, for separation of
 *   duties`. Categorical, and `AC-STU-152` (L34669) is why it can never
 *   become true.
 * - Row 12 (`Approve or release`) refuses the grant-holder with no
 *   alternative named. Row 11 (`Act as Reviewer`) is a DIFFERENT stage, not
 *   the same act relocated, so pointing at it would tell somebody they may
 *   release by reviewing.
 * - Rows 3's and 22's refusals have only `Read-only` cells beside them, and
 *   `Read-only` is not an ACTION: a route to it resolves to nothing to click
 *   and collapses back to ABSENT.
 */
const ROUTES: Partial<
  Record<Stu18RowId, Readonly<Partial<Record<StudioPersonaColumn, Stu18RowId>>>>
> = {
  'create-edit-archive-content-library-items': {
    'supervisor-with-authoring-grant': 'propose-a-content-library-change',
  },
  'hold-or-delegate-the-agent-author-capability': {
    'tenant-admin': 'assign-or-revoke-the-two-grants',
  },
  'hold-any-stage-of-the-approval-chain': {
    'implementation-team': 'submit-for-review',
  },
}

/** One row's routes, defaulting every unnamed column to `null`. */
function routesFor(id: Stu18RowId): Readonly<Record<StudioPersonaColumn, Stu18RowId | null>> {
  return { ...ROUTES_NOWHERE, ...(ROUTES[id] ?? {}) }
}

export const STU18_MATRIX = [
  {
    id: 'open-the-studio',
    capability: 'Open the Studio',
    // Surface access, not module standing. Task 4's rule: an "Open the
    // Studio" row is chrome, never a screen row.
    surface: 'chrome',
    routedTo: routesFor('open-the-studio'),
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L34541', 'FUNC-STU-18-01-A-1 L34580', 'AC-STU-150 L34667'],
    cells: cellsOf({
      'quality-manager': ALLOWED,
      'supervisor-with-authoring-grant': ALLOWED,
      'supervisor-without-grant': ALLOWED,
      'plant-manager-persona': ALLOWED,
      'tenant-admin': ALLOWED,
      'read-only-auditor': AUDITOR_OPEN,
      'implementation-team': cell(
        'allowedWithConditions',
        'Allowed with conditions — onboarding only',
      ),
    }),
  },
  {
    id: 'read-published-workflow-content',
    capability: 'Read published Workflow content',
    surface: 'screen',
    routedTo: routesFor('read-published-workflow-content'),
    // THE ONE ROW L34605's FAIL-CLOSED FLOOR NAMES: "permits nothing beyond
    // published read". A boolean the row declares, never a string match on
    // its capability text.
    isPublishedRead: true,
    stage: null,
    sourceRefs: ['L34542', 'L34605', 'AC-STU-156 L34673'],
    cells: cellsOf({
      'quality-manager': ALLOWED,
      'supervisor-with-authoring-grant': ALLOWED,
      'supervisor-without-grant': READ_ONLY,
      'plant-manager-persona': READ_ONLY,
      'tenant-admin': READ_ONLY,
      'read-only-auditor': AUDITOR_OPEN,
      'implementation-team': cell('allowedWithConditions', 'Allowed with conditions'),
    }),
  },
  {
    id: 'read-drafts-and-in-review-versions',
    capability: 'Read drafts and in-review versions',
    surface: 'screen',
    routedTo: routesFor('read-drafts-and-in-review-versions'),
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L34543', 'L34508', 'AC-STU-151 L34668'],
    cells: cellsOf({
      'quality-manager': ALLOWED,
      'supervisor-with-authoring-grant': ALLOWED,
      'read-only-auditor': AUDITOR_OPEN,
      'implementation-team': cell('allowedWithConditions', 'Allowed with conditions'),
    }),
  },
  {
    id: 'create-a-workflow',
    capability: 'Create a Workflow',
    surface: 'screen',
    routedTo: routesFor('create-a-workflow'),
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L34544'],
    cells: cellsOf({
      'quality-manager': ALLOWED,
      'supervisor-with-authoring-grant': ALLOWED,
      'implementation-team': cell('allowedWithConditions', 'Allowed with conditions'),
    }),
  },
  {
    id: 'author-all-nine-configuration-sections',
    capability: 'Author all nine configuration sections',
    surface: 'screen',
    routedTo: routesFor('author-all-nine-configuration-sections'),
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L34545'],
    cells: cellsOf({
      'quality-manager': ALLOWED,
      'supervisor-with-authoring-grant': ALLOWED,
      'implementation-team': cell('allowedWithConditions', 'Allowed with conditions'),
    }),
  },
  {
    id: 'create-and-apply-shared-instruction-blocks',
    capability: 'Create and apply Shared Instruction Blocks',
    surface: 'screen',
    routedTo: routesFor('create-and-apply-shared-instruction-blocks'),
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L34546'],
    cells: cellsOf({
      'quality-manager': ALLOWED,
      'supervisor-with-authoring-grant': ALLOWED,
      'implementation-team': cell('allowedWithConditions', 'Allowed with conditions'),
    }),
  },
  {
    id: 'create-edit-archive-content-library-items',
    capability: 'Create, edit, archive Content Library items',
    surface: 'screen',
    routedTo: routesFor('create-edit-archive-content-library-items'),
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L34547', 'MOD-STU-07 L32637'],
    cells: cellsOf({
      'quality-manager': cell('allowed', 'Allowed — the Quality Manager owns the libraries'),
      'supervisor-with-authoring-grant': cell(
        'explicitlyProhibited',
        'Explicitly prohibited — may propose only',
      ),
    }),
  },
  {
    id: 'propose-a-content-library-change',
    capability: 'Propose a Content Library change',
    surface: 'screen',
    routedTo: routesFor('propose-a-content-library-change'),
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L34548'],
    cells: cellsOf({
      'quality-manager': ALLOWED,
      'supervisor-with-authoring-grant': ALLOWED,
      'implementation-team': cell('allowedWithConditions', 'Allowed with conditions'),
    }),
  },
  {
    id: 'manage-qualification-requirements',
    capability: 'Manage Qualification Requirements',
    surface: 'screen',
    routedTo: routesFor('manage-qualification-requirements'),
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L34549'],
    cells: cellsOf({
      'quality-manager': ALLOWED,
      'supervisor-with-authoring-grant': ALLOWED,
      'implementation-team': cell('allowedWithConditions', 'Allowed with conditions'),
    }),
  },
  {
    id: 'submit-for-review',
    capability: 'Submit for review',
    surface: 'screen',
    routedTo: routesFor('submit-for-review'),
    isPublishedRead: false,
    // The Author's own act. L33289 orders the chain Author, Reviewer, Release
    // Authority, and submission is the act that closes the Author stage.
    stage: 'author',
    sourceRefs: ['L34550', 'L33289'],
    cells: cellsOf({
      'quality-manager': ALLOWED,
      'supervisor-with-authoring-grant': ALLOWED,
      'implementation-team': cell('allowedWithConditions', 'Allowed with conditions'),
    }),
  },
  {
    id: 'act-as-reviewer',
    capability: 'Act as Reviewer',
    surface: 'screen',
    routedTo: routesFor('act-as-reviewer'),
    isPublishedRead: false,
    stage: 'reviewer',
    sourceRefs: ['L34551', 'L33389', 'AC-STU-153 L34670'],
    cells: cellsOf({
      'quality-manager': cell('allowedWithConditions', 'Allowed with conditions — not own submission'),
      'supervisor-with-authoring-grant': cell(
        'allowedWithConditions',
        'Allowed with conditions — only on submissions they did not author',
      ),
    }),
  },
  {
    id: 'approve-or-release',
    capability: 'Approve or release',
    surface: 'screen',
    routedTo: routesFor('approve-or-release'),
    isPublishedRead: false,
    stage: 'release-authority',
    sourceRefs: ['L34552', 'L33389', 'AC-STU-154 L34671'],
    cells: cellsOf({
      'quality-manager': cell(
        'allowedWithConditions',
        'Allowed with conditions — Release Authority by tenant default, never on own submission or one they reviewed',
      ),
    }),
  },
  {
    id: 'hold-or-delegate-the-agent-author-capability',
    capability: 'Hold or delegate the Agent Author capability',
    surface: 'screen',
    routedTo: routesFor('hold-or-delegate-the-agent-author-capability'),
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L34553', 'DEC-DELEG-001'],
    cells: cellsOf({
      'quality-manager': ALLOWED,
      // The source's own qualifier names an exception this build does not
      // build: §4.8.4 defers delegation beyond V1, and MTX-TEN-02b's
      // condition [Y21] (L22052) states the interim position — "until
      // decided, the build denies Supervisor access to the Agent Builder and
      // names the decision". The token stays as the source writes it and the
      // decision is named; the exception is not implemented.
      'supervisor-with-authoring-grant': cell(
        'explicitlyProhibited',
        'Explicitly prohibited unless delegated GRANT-STU-AGENT',
        { openDecision: 'DEC-DELEG-001' },
      ),
      'tenant-admin': cell(
        'explicitlyProhibited',
        'Explicitly prohibited — assigns it, does not hold it by default',
      ),
    }),
  },
  {
    id: 'compose-a-reasoning-agent',
    capability: 'Compose a reasoning agent',
    surface: 'screen',
    routedTo: routesFor('compose-a-reasoning-agent'),
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L34554', 'L34586', 'DEC-DELEG-001'],
    // THREE DIFFERENT CONDITIONS IN THREE COLUMNS, on one source line. This
    // is the row that proves a constraint belongs on the cell.
    cells: cellsOf({
      'quality-manager': cell(
        'allowedWithConditions',
        'Allowed with conditions — Growth or Enterprise tier',
        { requiredTiers: ['Growth', 'Enterprise'] },
      ),
      'supervisor-with-authoring-grant': cell(
        'allowedWithConditions',
        'Allowed with conditions — only with GRANT-STU-AGENT and Growth or Enterprise',
        {
          requiredTiers: ['Growth', 'Enterprise'],
          requiredGrant: 'GRANT-STU-AGENT',
          openDecision: 'DEC-DELEG-001',
        },
      ),
      'tenant-admin': cell(
        'allowedWithConditions',
        'Allowed with conditions — only if delegated GRANT-STU-AGENT',
        { requiredGrant: 'GRANT-STU-AGENT', openDecision: 'DEC-DELEG-001' },
      ),
    }),
  },
  {
    id: 'enable-or-disable-an-atomic-capability',
    capability: 'Enable or disable an atomic capability',
    // Classified `screen` rather than `another-surface` deliberately:
    // DEC-CAPAUTH-001 is exactly the question of WHO holds this authority,
    // so naming a surface for it would answer the open decision. Task 4's
    // rule for a capability that exists nowhere is a screen row whose every
    // cell refuses, and three of these defer instead.
    surface: 'screen',
    routedTo: routesFor('enable-or-disable-an-atomic-capability'),
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L34555', 'DEC-CAPAUTH-001'],
    cells: cellsOf({
      'quality-manager': cell(
        'clientDecisionRequired',
        'Client Decision Required — DEC-CAPAUTH-001',
        { openDecision: 'DEC-CAPAUTH-001' },
      ),
      'supervisor-with-authoring-grant': cell(
        'clientDecisionRequired',
        'Client Decision Required — DEC-CAPAUTH-001',
        { openDecision: 'DEC-CAPAUTH-001' },
      ),
      'tenant-admin': cell(
        'clientDecisionRequired',
        'Client Decision Required — DEC-CAPAUTH-001',
        { openDecision: 'DEC-CAPAUTH-001' },
      ),
    }),
  },
  {
    id: 'read-the-learning-view',
    capability: 'Read the learning view',
    surface: 'screen',
    routedTo: routesFor('read-the-learning-view'),
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L34556'],
    cells: cellsOf({
      'quality-manager': ALLOWED,
      'supervisor-with-authoring-grant': ALLOWED,
      'read-only-auditor': AUDITOR_OPEN,
    }),
  },
  {
    id: 'decide-a-lane-b-proposal',
    capability: 'Decide a Lane-B proposal',
    // The cell says where: "in the Client Command Center". A Studio screen
    // can describe this and can never offer it.
    surface: 'another-surface',
    routedTo: routesFor('decide-a-lane-b-proposal'),
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L34557', 'DEC-LANEBAUTH-001'],
    cells: cellsOf({
      'quality-manager': cell('allowed', 'Allowed — in the Client Command Center'),
      'supervisor-with-authoring-grant': cell(
        'clientDecisionRequired',
        'Client Decision Required — DEC-LANEBAUTH-001',
        { openDecision: 'DEC-LANEBAUTH-001' },
      ),
      'read-only-auditor': cell(
        'explicitlyProhibited',
        'Explicitly prohibited — no Client Command Center access at all',
      ),
    }),
  },
  {
    id: 'assign-or-revoke-the-two-grants',
    capability: 'Assign or revoke GRANT-STU-AUTHOR and GRANT-STU-AGENT',
    // FINDING, disclosed rather than resolved: L34532 puts grant
    // administration "in the tenant administration area inside the Delivery
    // Operations Hub", which would make this `another-surface`. Catalogue B
    // (L48273) gives the Studio SCR-STU-15 "Studio permissions and grants —
    // Assign and revoke authoring and Agent Author grants", and L16457 names
    // the screen SCR-STU-GRANT-01, a Studio-prefixed identifier. Classified
    // `screen` because two source statements put a Studio screen on it and
    // one puts the area elsewhere; the divergence renders on the screen.
    surface: 'screen',
    routedTo: routesFor('assign-or-revoke-the-two-grants'),
    isPublishedRead: false,
    // NOT an approval stage. L34569 and AC-STU-152: the Tenant Admin
    // administers capacities and holds no stage of the chain.
    stage: null,
    sourceRefs: ['L34558', 'L34532', 'L48273', 'AC-STU-152 L34669'],
    cells: cellsOf({
      'tenant-admin': cell(
        'allowed',
        'Allowed — administers Studio capacities from the tenant administration area',
      ),
    }),
  },
  {
    id: 'hold-any-stage-of-the-approval-chain',
    capability: 'Hold any stage of the approval chain',
    surface: 'screen',
    routedTo: routesFor('hold-any-stage-of-the-approval-chain'),
    isPublishedRead: false,
    // `null`, and deliberately: the row asks about ALL THREE stages at once.
    // Naming one would make the separation-of-duties floor apply to a third
    // of the question it is asking. Rows 10, 11 and 12 carry the real stage
    // occupancy and the floor binds there.
    stage: null,
    sourceRefs: ['L34559', 'L33289', 'AC-STU-152 L34669'],
    cells: cellsOf({
      'quality-manager': cell(
        'allowedWithConditions',
        'Allowed with conditions — one stage per submission',
      ),
      'supervisor-with-authoring-grant': cell(
        'allowedWithConditions',
        'Allowed with conditions — Author or Reviewer only',
      ),
      'tenant-admin': cell(
        'explicitlyProhibited',
        'Explicitly prohibited — holds no stage, for separation of duties',
      ),
      'implementation-team': cell(
        'explicitlyProhibited',
        'Explicitly prohibited — author and submit only',
      ),
    }),
  },
  {
    id: 'publish-training-library-content',
    capability: 'Publish Training Library content',
    surface: 'screen',
    routedTo: routesFor('publish-training-library-content'),
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L34560'],
    cells: cellsOf({
      'quality-manager': cell(
        'allowedWithConditions',
        'Allowed with conditions — as Release Authority',
      ),
    }),
  },
  {
    id: 'generate-a-portable-document-format-export',
    capability: 'Generate a portable-document-format export of a version',
    surface: 'screen',
    routedTo: routesFor('generate-a-portable-document-format-export'),
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L34561'],
    cells: cellsOf({
      'quality-manager': ALLOWED,
      'supervisor-with-authoring-grant': ALLOWED,
      // THE TOKEN CARRIES ITS OWN RENDERING INSTRUCTION. Mapping `Read-only`
      // mechanically to a disabled control removes an export the source
      // grants in the same breath as the token.
      'supervisor-without-grant': cell(
        'readOnly',
        'Read-only — may generate the read-only export',
      ),
      'plant-manager-persona': cell('readOnly', 'Read-only — may generate the read-only export'),
      'tenant-admin': cell('readOnly', 'Read-only — may generate the read-only export'),
      'read-only-auditor': AUDITOR_OPEN,
      'implementation-team': cell('allowedWithConditions', 'Allowed with conditions'),
    }),
  },
  {
    id: 'widen-beyond-the-floor',
    capability: 'Widen any of the above beyond the separation-of-duties floor',
    // A CAPABILITY THAT EXISTS NOWHERE is a screen row whose every cell
    // refuses — task 4's own rule, and this is the row it describes. The
    // floor is the platform's, not the tenant's (FUNC-STU-18-03-A-1).
    surface: 'screen',
    routedTo: routesFor('widen-beyond-the-floor'),
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L34562', 'L34508', 'AC-STU-154 L34671'],
    cells: cellsOf({}),
  },
  {
    id: 'use-any-capability-while-offline',
    capability: 'Use any Studio capability while offline',
    // The connectivity axis, and chrome rather than a screen row: counting
    // it as module standing would withhold this module from every persona,
    // because seven of its eight cells refuse.
    surface: 'chrome',
    routedTo: routesFor('use-any-capability-while-offline'),
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L34563', 'L34637', 'TEST-STU-153 L34682'],
    cells: cellsOf({
      'quality-manager': cell(
        'unavailable',
        'Unavailable — the Studio requires an active connection',
      ),
      'supervisor-with-authoring-grant': cell('unavailable', 'Unavailable — same reason'),
      'supervisor-without-grant': cell('unavailable', 'Unavailable — same reason'),
      'plant-manager-persona': cell('unavailable', 'Unavailable — same reason'),
      'tenant-admin': cell('unavailable', 'Unavailable — same reason'),
      'read-only-auditor': cell('unavailable', 'Unavailable — same reason'),
      'worker': cell('explicitlyProhibited', 'Explicitly prohibited — no access at all'),
      'implementation-team': cell('unavailable', 'Unavailable — same reason'),
    }),
  },
] as const satisfies readonly Stu18MatrixRow[]

type MissingFromMatrix = Exclude<Stu18RowId, (typeof STU18_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

const BY_ID = new Map<Stu18RowId, Stu18MatrixRow>(STU18_MATRIX.map((row) => [row.id, row]))

/**
 * Total over the closed row vocabulary — every id in `Stu18RowId` is in the
 * table above, proved by the exhaustiveness check, so this never throws and
 * never returns `undefined`.
 */
export function stu18Row(id: Stu18RowId): Stu18MatrixRow {
  const found = BY_ID.get(id)
  if (found === undefined) {
    throw new Error(
      `MOD-STU-18: no matrix row is registered for "${id}". The row vocabulary and the table are ` +
        'exhaustiveness-checked against each other, so this is unreachable while that check holds.',
    )
  }
  return found
}
