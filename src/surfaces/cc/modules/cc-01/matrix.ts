import type { RoleId } from '@/domain/roles'
import type { PermissionOutcome } from '@/policy/decision'
import type { DecisionReading } from '@/disclosure/decisions'

/* ==================================================================== *
 * `MOD-CC-01`'S PERMISSION MATRIX — SEVEN ROWS, SIX COLUMNS, COUNTED.
 *
 * Header L36262, separator L36263, data L36264 to L36270 — SEVEN rows. The
 * body stops there: L36272 is the DEC-PLUS-001 sentence, and the count was
 * taken by walking from the separator to the first line that is not a table
 * row rather than by reading the span. The header carries SIX cells:
 * `Capability on this module`, then the five fixed tenant roles.
 *
 * TRANSCRIBED HEADER-KEYED, NEVER POSITIONALLY. `cells` is a total record
 * over the five role columns, so a blank cell is untypeable and a column
 * swap moves a named key rather than sliding every value one place left.
 * Slice 8's two `MOD-CC-10` matrices ran their columns in opposite orders
 * and a positional read inverted every Worker and Tenant Admin cell
 * silently, because both readings were internally coherent.
 *
 * THE CARD IS L36219 TO L36423, NOT L36219 TO L36259. The dispatch gave the
 * shorter span; L36259 is inside the prose, three lines before the matrix
 * header, and the card runs to its `**Source status.**` paragraph at L36423.
 * Reported rather than quietly widened.
 *
 * `Allowed` IS A PREFIX OF `Allowed with conditions` AND THIS CARD USES
 * BOTH. The qualifier is split at the em dash first and the head compared
 * with `===`; there is no prefix comparison in this file. Slice 8 also found
 * `Allowed` used as a PROHIBITION nineteen times in one catalogue, which is
 * why every cell keeps its whole clause beside its outcome and nothing here
 * is reduced to a token.
 * ==================================================================== */

/** The header cells of L36262, in order, verbatim. */
export const CC01_COLUMN_ORDER = [
  'Capability on this module',
  'Tenant Admin',
  'Supervisor',
  'Quality Manager',
  'Read-only Auditor',
  'Worker',
] as const satisfies readonly string[]

/**
 * The five role columns read onto the platform's role identifiers, in the
 * card's own column order. Kept beside `CC01_COLUMN_ORDER` rather than
 * derived from it, because the mapping from a heading to a `RoleId` is the
 * step a positional transcription gets wrong and it should be visible.
 */
export const CC01_ROLE_COLUMNS = [
  'TENANT_ADMIN',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'READONLY_AUDITOR',
  'WORKER',
] as const satisfies readonly RoleId[]

export type Cc01RoleColumn = (typeof CC01_ROLE_COLUMNS)[number]

/** One transcribed cell: the source's words, and what they mean. */
export interface Cc01Cell {
  /** The cell exactly as the source writes it, em-dash qualifier included. */
  readonly verbatim: string
  readonly outcome: PermissionOutcome
}

/**
 * THE HEAD TOKEN DECIDES THE OUTCOME AND THE MATCH IS EXACT. Three heads are
 * every head this card uses; a fourth means the transcription drifted, so it
 * throws rather than defaulting. A silent default is how an untranscribed
 * token becomes `allowed`.
 */
const OUTCOME_BY_HEAD = {
  'Allowed with conditions': 'allowedWithConditions',
  Allowed: 'allowed',
  'Read-only': 'readOnly',
  'Explicitly prohibited': 'explicitlyProhibited',
} as const satisfies Record<string, PermissionOutcome>

export function cc01CellOutcome(verbatim: string): PermissionOutcome {
  const head = verbatim.split('—')[0]?.trim() ?? ''
  const outcome = (OUTCOME_BY_HEAD as Record<string, PermissionOutcome | undefined>)[head]
  if (outcome === undefined) {
    throw new Error(
      `MOD-CC-01 matrix cell head "${head}" is not one of the tokens this card uses. The cells ` +
        'were transcribed from L36264-L36270; a new head means the transcription drifted.',
    )
  }
  return outcome
}

const cell = (verbatim: string): Cc01Cell => ({ verbatim, outcome: cc01CellOutcome(verbatim) })

const ALLOWED = cell('Allowed')
const PROHIBITED = cell('Explicitly prohibited')
const SCOPE_CONDITION = cell('Allowed with conditions — requires Tenant or Site read scope')

export type Cc01RowId =
  | 'view-the-scoped-board'
  | 'view-the-cross-area-board'
  | 'see-pace-state'
  | 'see-the-coaching-active-state'
  | 'see-the-freshness-marker-and-expand-it'
  | 'drill-from-a-tile'
  | 'change-what-the-board-ranks'

/**
 * WHERE A ROW'S OBLIGATION IS ACTUALLY HELD.
 *
 * `this-module` is something the board draws. `another-surface` is an act
 * this surface does not carry, and the only thing it may offer is a way to
 * reach it. `another-payload` is the third shape and it is the one this
 * card's trap turns on: the cell states a prohibition whose subject is a
 * FIELD IN ANOTHER SURFACE'S PAYLOAD, and no control drawn in this surface's
 * matrix can enforce the absence of a field somewhere else.
 */
export type Cc01RowHeldWhere = 'this-module' | 'another-surface' | 'another-payload'

export interface Cc01Row {
  readonly id: Cc01RowId
  /** Verbatim from the `Capability on this module` column. */
  readonly capability: string
  readonly heldWhere: Cc01RowHeldWhere
  readonly cells: Record<Cc01RoleColumn, Cc01Cell>
  /** This row's own line in the matrix. */
  readonly sourceRef: string
  /** The functionality or criterion that specifies the act, and its line. */
  readonly specRef: string
  /**
   * For an `another-payload` row: what actually enforces the prohibition, and
   * where. `null` on every other row. Never a control drawn here.
   */
  readonly enforcedBy: string | null
}

export const CC01_MATRIX = [
  {
    id: 'view-the-scoped-board',
    capability: 'View the scoped board',
    heldWhere: 'this-module',
    cells: {
      TENANT_ADMIN: cell('Read-only — reached only via the connectivity banner context'),
      SUPERVISOR: ALLOWED,
      QUALITY_MANAGER: ALLOWED,
      READONLY_AUDITOR: PROHIBITED,
      WORKER: PROHIBITED,
    },
    sourceRef: 'L36264',
    specRef: 'FUNC-CC-0101-1-1 · L36337',
    enforcedBy: null,
  },
  {
    id: 'view-the-cross-area-board',
    capability: 'View the cross-Area rolled-up board',
    heldWhere: 'this-module',
    cells: {
      TENANT_ADMIN: SCOPE_CONDITION,
      SUPERVISOR: SCOPE_CONDITION,
      QUALITY_MANAGER: SCOPE_CONDITION,
      READONLY_AUDITOR: PROHIBITED,
      WORKER: PROHIBITED,
    },
    sourceRef: 'L36265',
    specRef: 'FUNC-CC-0104-1-1 · L36360',
    enforcedBy: null,
  },
  {
    /*
     * THE TRAP. Read the Worker cell's WHOLE clause, not its head token: it
     * reads `Explicitly prohibited — never worker-facing`, and what it
     * prohibits is not an act a person performs on this surface. L36356's
     * `FUNC-CC-0103-2-1` states it as a prohibition rather than a grant —
     * "Roles allowed: not applicable — this is a prohibition, not a grant" —
     * and L36402's `AC-CC-165` names the thing that is actually tested: "No
     * pace state, flag or derived timer is present in any payload reaching
     * the Frontline Worker Application."
     *
     * A CELL IN THIS SURFACE'S MATRIX CANNOT ENFORCE THE ABSENCE OF A FIELD
     * IN ANOTHER SURFACE'S PAYLOAD. So this row is transcribed, its
     * obligation is recorded as held elsewhere, and NO CONTROL IS BUILT THAT
     * CLAIMS TO ENFORCE IT. Drawing a disabled "pace" affordance for the
     * Worker would be worse than drawing nothing: it would assert that this
     * surface is where the rule lives.
     */
    id: 'see-pace-state',
    capability: 'See pace state',
    heldWhere: 'another-payload',
    cells: {
      TENANT_ADMIN: PROHIBITED,
      SUPERVISOR: ALLOWED,
      QUALITY_MANAGER: ALLOWED,
      READONLY_AUDITOR: PROHIBITED,
      WORKER: cell('Explicitly prohibited — never worker-facing'),
    },
    sourceRef: 'L36266',
    specRef: 'FUNC-CC-0103-2-1 · L36356',
    enforcedBy:
      'AC-CC-165 (L36402) — "No pace state, flag or derived timer is present in any payload ' +
      'reaching the Frontline Worker Application." The subject is a Frontline payload, so the ' +
      'obligation is met by what SURF-FL is served and is untestable from a Command Center ' +
      'control. TEST-CC-165 (L36415) inspects those payloads, not this matrix.',
  },
  {
    id: 'see-the-coaching-active-state',
    capability: 'See the coaching-active state',
    heldWhere: 'this-module',
    cells: {
      TENANT_ADMIN: PROHIBITED,
      SUPERVISOR: ALLOWED,
      QUALITY_MANAGER: ALLOWED,
      READONLY_AUDITOR: PROHIBITED,
      WORKER: PROHIBITED,
    },
    sourceRef: 'L36267',
    specRef: 'FUNC-CC-0102-1-2 · L36346',
    enforcedBy: null,
  },
  {
    id: 'see-the-freshness-marker-and-expand-it',
    capability: 'See the freshness marker and expand it',
    heldWhere: 'this-module',
    cells: {
      TENANT_ADMIN: ALLOWED,
      SUPERVISOR: ALLOWED,
      QUALITY_MANAGER: ALLOWED,
      READONLY_AUDITOR: PROHIBITED,
      WORKER: PROHIBITED,
    },
    sourceRef: 'L36268',
    specRef: 'AC-CC-120 · L35979',
    enforcedBy: null,
  },
  {
    id: 'drill-from-a-tile',
    capability: 'Drill from a tile to full context',
    heldWhere: 'this-module',
    cells: {
      TENANT_ADMIN: PROHIBITED,
      SUPERVISOR: ALLOWED,
      QUALITY_MANAGER: ALLOWED,
      READONLY_AUDITOR: PROHIBITED,
      WORKER: PROHIBITED,
    },
    sourceRef: 'L36269',
    specRef: 'AC-CC-160 · L36397',
    enforcedBy: null,
  },
  {
    /*
     * POPULATION B — prohibited AND naming a destination. `WriteControl`
     * draws `explicitlyProhibited` as nothing at all, so a faithful
     * transcription produces an empty cell where the source names a place.
     * `CC_LINK_OUT_CELLS` already carries this row as `cc-01-board-ranking`
     * with this same line, so the link model is CONSUMED from task 5 rather
     * than respelled here.
     */
    id: 'change-what-the-board-ranks',
    capability: 'Change what the board ranks or how it flags',
    heldWhere: 'another-surface',
    cells: {
      TENANT_ADMIN: cell(
        'Explicitly prohibited — configuration lives in the Standards and Operations Studio',
      ),
      SUPERVISOR: PROHIBITED,
      QUALITY_MANAGER: PROHIBITED,
      READONLY_AUDITOR: PROHIBITED,
      WORKER: PROHIBITED,
    },
    sourceRef: 'L36270',
    specRef: 'L36239 — "The Command Center adds no rules of its own"',
    enforcedBy: null,
  },
] as const satisfies readonly Cc01Row[]

export function cc01Row(id: Cc01RowId): Cc01Row {
  const found = CC01_MATRIX.find((r) => r.id === id)
  if (found === undefined) throw new Error(`Unknown MOD-CC-01 matrix row: ${id}`)
  return found
}

/**
 * The rows whose obligation is NOT this module's to enforce, derived so a row
 * changing `heldWhere` cannot leave a second list stale.
 */
export const CC01_ROWS_HELD_ELSEWHERE: readonly Cc01RowId[] = CC01_MATRIX.filter(
  (r) => r.heldWhere !== 'this-module',
).map((r) => r.id)

/* ==================================================================== *
 * THE TENANT ADMIN READS TWO WAYS AND NO DECISION IDENTIFIER EXISTS.
 *
 * The surface matrix's first row (L35004) confines the Tenant Admin to
 * `Allowed with conditions — report and banner routes only`. Two of this
 * card's seven rows grant that role more than a report or a banner:
 *
 *   L36265  View the cross-Area rolled-up board  Allowed with conditions
 *   L36268  See the freshness marker and expand it  Allowed
 *
 * The dispatch cited only L36265 among its four module-matrix locators and
 * then said "two of those four rows are yours". Only ONE of the four it
 * lists is this card's; the other three are `MOD-CC-02` (L36452-L36456),
 * `MOD-CC-08` (L37670) and `MOD-CC-12` (L38488). The "two" is true of THIS
 * TABLE and its second row is L36268, which the dispatch does not name.
 * Reported; both are carried below off the source rather than off the brief.
 *
 * AND ONE ROW IS THE RECONCILIATION, WHICH IS WHY IT IS NOT COUNTED. L36264
 * reads `Read-only — reached only via the connectivity banner context`. That
 * is the board reached through a BANNER route, which is exactly what L35004
 * permits, and it is the only row of the seven that says so.
 *
 * NEITHER READING IS CHOSEN. `DecisionReading` is imported from the canon
 * rather than redeclared, so a reading has exactly two fields and there is
 * nowhere to mark a winner even by accident. There is no `DEC-*` identifier
 * for this contradiction anywhere in the source, which is why this is a pair
 * of readings and not a `CcLocalDisclosure`: that type is keyed on
 * `CcDecisionId` and a key would have to be minted to use it.
 * ==================================================================== */

export interface Cc01ContestedCell {
  /** The question both tables answer, in one sentence. */
  readonly question: string
  /** Exactly two. A third is a type error, not a review comment. */
  readonly readings: readonly [DecisionReading, DecisionReading]
  /** Rows of THIS card that the surface matrix's confinement would deny. */
  readonly rowsThisCardGrants: readonly Cc01RowId[]
  /** The row that reads consistently with the surface matrix, and why. */
  readonly reconcilingRow: Cc01RowId
  /** Why no `DEC-*` record is minted. Never blank. */
  readonly noDecisionIdentifier: string
}

export const CC01_TENANT_ADMIN_CONTEST = {
  question:
    'On the live shift board, is the Tenant Admin confined to report and banner routes, or does ' +
    'the module card grant that role board capabilities in its own right?',
  readings: [
    {
      text:
        'Reading A — the surface matrix governs. Opening any Command Center route is "Allowed ' +
        'with conditions — report and banner routes only", and the landing table agrees that a ' +
        'Tenant Admin alone lands on report formats and delivery because the role is not an ' +
        'in-shift actor. Under this reading the two module grants are reachable only where the ' +
        'banner context has already brought the role onto the board.',
      locator: 'L35004 · landing table L35078',
    },
    {
      text:
        'Reading B — the module card governs its own capabilities. Its cross-Area row grants the ' +
        'Tenant Admin the rolled-up board on the same condition it sets for the Supervisor and ' +
        'the Quality Manager, and its marker row grants that role the marker and its expansion ' +
        'outright, with no banner qualifier on either. Under this reading the surface row states ' +
        'a default that the module rows enumerate exceptions to.',
      locator: 'L36265 · L36268',
    },
  ],
  rowsThisCardGrants: ['view-the-cross-area-board', 'see-the-freshness-marker-and-expand-it'],
  reconcilingRow: 'view-the-scoped-board',
  noDecisionIdentifier:
    'The source raises no DEC-* identifier against this contradiction. AC-CC-502 requires every ' +
    'cell to carry an explicit status and every cell does, so no acceptance criterion is ' +
    'violated and none tests the disagreement. Minting a key here would put a second spelling ' +
    'of an unraised decision into the tree, so the two readings are carried with their own ' +
    'locators and neither is chosen.',
} as const satisfies Cc01ContestedCell
