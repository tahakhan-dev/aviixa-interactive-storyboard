import type { TenantId } from '@/domain/ids'
import { roleById, type RoleId } from '@/domain/roles'
import { permitsRead, type PermissionDecision } from './decision'
import {
  cellFor,
  cellFromSource,
  columnClass,
  columnKey,
  evaluateColumnAccess,
  type ColumnCell,
  type ColumnKey,
  type ColumnMatrixRow,
  type LiveEvaluation,
  type MatrixColumn,
  type RoleColumn,
} from './columns'
import { evaluateAccess } from './evaluate'

/**
 * THE TWENTY-TWO GOVERNED SCHEDULING OPERATIONS, OVER 45A.7's TWO MATRICES.
 *
 * Every count below was measured on the frozen source by reading to where each
 * body stops, not inferred from a span, and every cell is transcribed verbatim
 * rather than classified by hand.
 *
 *   Matrix A  header L99233  10 pipe columns = 1 operation + 9 actors
 *                            (4 platform console roles + 5 non-human identities)
 *                            22 data rows L99235-L99256, 198 cells
 *   Matrix B  header L99260   6 pipe columns = 1 operation + 5 tenant roles
 *                            22 data rows L99262-L99283, 110 cells
 *
 * L99229 states "Twenty-two operations are governed" and then enumerates
 * `PER-SCHED-01` to `PER-SCHED-22`. The stated count and the enumeration agree
 * at 22, which is worth recording because four places in this source state a
 * count beside an enumeration that contradicts it.
 *
 * WHY THE OPERATION IS NAMED TWICE. L99229's prose and the matrices' first
 * column disagree on the wording of nine of the twenty-two — L99229 has
 * "view occurrence history and effect receipts" where both matrix rows have
 * "view occurrences and receipts". Neither contradicts the other; the prose is
 * the fuller form. Both are kept so no screen has to pick one silently, and
 * `buildRows` below fails if the identifier order of either matrix ever stops
 * matching the enumeration.
 *
 * The two matrices' first columns are byte-identical for all 22 rows, so an
 * operation is one thing asked of two different populations, not two things.
 */
export const SCHEDULE_OPERATIONS = [
  ['PER-SCHED-01', 'view definition'],
  ['PER-SCHED-02', 'view occurrence history and effect receipts'],
  ['PER-SCHED-03', 'create or edit a draft definition'],
  ['PER-SCHED-04', 'submit a definition for approval'],
  ['PER-SCHED-05', 'approve or return a definition'],
  ['PER-SCHED-06', 'activate a definition'],
  ['PER-SCHED-07', 'pause a definition'],
  ['PER-SCHED-08', 'resume a definition'],
  ['PER-SCHED-09', 'retire a definition'],
  ['PER-SCHED-10', 'change cadence or offset'],
  ['PER-SCHED-11', 'change the governing time zone'],
  ['PER-SCHED-12', 'change retry, misfire or catch-up policy'],
  ['PER-SCHED-13', 'trigger an occurrence manually'],
  ['PER-SCHED-14', 'retry a failed occurrence'],
  ['PER-SCHED-15', 'replay a completed occurrence'],
  ['PER-SCHED-16', 'request a backfill'],
  ['PER-SCHED-17', 'skip or suppress a planned occurrence'],
  ['PER-SCHED-18', 'cancel an occurrence'],
  ['PER-SCHED-19', 'release a quarantined or dead-lettered occurrence'],
  ['PER-SCHED-20', 'break a stuck lease'],
  ['PER-SCHED-21', 'change the maintenance-window calendar'],
  ['PER-SCHED-22', 'edit tenant-owned timing settings'],
  // `as const satisfies`, not an annotation: an annotation widens every literal
  // and `ScheduleOperationId` below would become `string`.
] as const satisfies readonly (readonly [string, string])[]

/** The enumerated identifier of one governed scheduling operation. */
export type ScheduleOperationId = (typeof SCHEDULE_OPERATIONS)[number][0]

/** L99229's fuller wording for an operation, for a screen that wants it. */
export function operationEnumeratedAs(id: ScheduleOperationId): string {
  const found = SCHEDULE_OPERATIONS.find(([opId]) => opId === id)
  if (found === undefined) throw new Error(`Unknown scheduling operation: ${id}`)
  return found[1]
}

// --- the columns, verbatim from the two headers -----------------------------

const PLATFORM_COLUMNS: readonly MatrixColumn[] = [
  { kind: 'role', header: 'Root Super Admin', role: 'ROOT_SUPER_ADMIN' },
  { kind: 'role', header: 'Admin', role: 'ADMIN' },
  { kind: 'role', header: 'Platform Engineer', role: 'PLATFORM_ENGINEER' },
  { kind: 'role', header: 'Support', role: 'SUPPORT' },
]

/**
 * The five non-human columns of Matrix A, each carrying every locator where
 * its identity is DEFINED rather than the one this file happened to find
 * first. Two of them are spelled two ways in two chapters and one header
 * covers two separate register rows, so `identitySourceRefs` is a list:
 *
 *   Scheduler Controller         `IDENT-SCHEDCTL` L17887 · `IDENT-SCHED-CTL` L98883
 *   Scheduled Execution Worker   `IDENT-SCHEDWKR` L17888 · `IDENT-SCHED-WRK` L98885
 *   Data-pipeline identity       `IDENT-PIPE` L17889
 *   Artificial-intelligence …    `IDENT-AISCHED` L17890
 *   Integration identity         `IDENT-INT-EMAIL` L17884 · `IDENT-INT-ERP` L17885
 *
 * The last is not a spelling collision but a different shape: ONE header over
 * TWO identities, both register rows opening "Integration identity, ". Which
 * spelling of the scheduler pair is canonical is a disclosure the decision
 * canon holds; this file mints no decision identifier and picks no winner.
 */
const IDENTITY_COLUMNS: readonly MatrixColumn[] = [
  {
    kind: 'identity',
    header: 'Scheduler Controller',
    identitySourceRefs: ['L17887', 'L98883'],
  },
  {
    kind: 'identity',
    header: 'Scheduled Execution Worker',
    identitySourceRefs: ['L17888', 'L98885'],
  },
  { kind: 'identity', header: 'Data-pipeline identity', identitySourceRefs: ['L17889'] },
  {
    kind: 'identity',
    header: 'Artificial-intelligence scheduler identity',
    identitySourceRefs: ['L17890'],
  },
  { kind: 'identity', header: 'Integration identity', identitySourceRefs: ['L17884', 'L17885'] },
]

const TENANT_COLUMNS: readonly MatrixColumn[] = [
  { kind: 'role', header: 'Tenant Admin', role: 'TENANT_ADMIN' },
  { kind: 'role', header: 'Supervisor', role: 'SUPERVISOR' },
  { kind: 'role', header: 'Quality Manager', role: 'QUALITY_MANAGER' },
  { kind: 'role', header: 'Read-only Auditor', role: 'READONLY_AUDITOR' },
  { kind: 'role', header: 'Worker', role: 'WORKER' },
]

// --- the rows, transcribed verbatim ----------------------------------------

/**
 * The 22 data rows of Matrix A, each the whole source line. A verbatim pipe
 * row is the shortest transcription that can be diffed against the source by
 * eye, and it keeps every cell's stated condition attached to its cell. The
 * one parser is `cellFromSource`, so 44 rows do not re-derive the token rule
 * — and neither does this file re-derive it, which is what makes `Allowed`
 * being a prefix of `Allowed with conditions` a problem solved in one place.
 */
const MATRIX_A_SOURCE_ROWS = [
  '| `PER-SCHED-01` view definition | Allowed | Allowed | Allowed | Read-only | Allowed with conditions, own definitions only | Allowed with conditions, claimed definitions only | Allowed with conditions, own definitions only | Allowed with conditions, own definitions only | Not applicable — no integration schedule exists at V1 |',
  '| `PER-SCHED-02` view occurrences and receipts | Allowed | Allowed | Allowed | Read-only | Allowed with conditions, write own rows only | Allowed with conditions, claimed rows only | Allowed with conditions, own rows only | Allowed with conditions, own rows only | Not applicable — no integration schedule exists at V1 |',
  '| `PER-SCHED-03` create or edit a draft | Allowed | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
  '| `PER-SCHED-04` submit for approval | Allowed | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
  '| `PER-SCHED-05` approve or return | Allowed | Allowed with conditions, may not approve own submission | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
  '| `PER-SCHED-06` activate | Allowed | Allowed | Allowed with conditions, requires Admin approval | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
  '| `PER-SCHED-07` pause | Allowed | Allowed | Allowed with conditions, requires Admin approval | Explicitly prohibited | Allowed with conditions, only as a consequence of definition state | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
  '| `PER-SCHED-08` resume | Allowed | Allowed | Allowed with conditions, requires Admin approval | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
  '| `PER-SCHED-09` retire | Allowed | Allowed with conditions, critical-class definitions require root approval | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
  '| `PER-SCHED-10` change cadence or offset | Allowed | Allowed with conditions, through a new revision only | Allowed with conditions, requires Admin approval | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
  '| `PER-SCHED-11` change governing time zone | Allowed | Allowed with conditions, through a new revision and with an impact statement | Allowed with conditions, requires Admin approval | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
  '| `PER-SCHED-12` change retry, misfire or catch-up policy | Allowed | Allowed with conditions, through a new revision only | Allowed with conditions, requires Admin approval | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
  '| `PER-SCHED-13` trigger manually | Allowed | Allowed with conditions, reason required | Allowed with conditions, requires Admin approval and reason | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
  '| `PER-SCHED-14` retry a failed occurrence | Allowed | Allowed with conditions, reason required | Allowed with conditions, requires Admin approval | Explicitly prohibited | Allowed with conditions, automatic retries within the declared policy only | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
  '| `PER-SCHED-15` replay a completed occurrence | Allowed with conditions, safety-sensitive or externally visible work requires explicit review | Allowed with conditions, requires root approval where the work is critical-class | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
  '| `PER-SCHED-16` request a backfill | Allowed with conditions, bounded and reviewed | Allowed with conditions, bounded, reviewed and root-approved for critical-class work | Allowed with conditions, may request only | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
  '| `PER-SCHED-17` skip or suppress a planned occurrence | Allowed | Allowed with conditions, reason required | Explicitly prohibited | Explicitly prohibited | Allowed with conditions, only as a consequence of definition state | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
  '| `PER-SCHED-18` cancel an occurrence | Allowed | Allowed with conditions, reason required | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
  '| `PER-SCHED-19` release a quarantined or dead-lettered occurrence | Allowed | Allowed with conditions, critical-class work requires root approval | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
  '| `PER-SCHED-20` break a stuck lease | Allowed | Allowed with conditions, reason required and a higher fencing token issued | Allowed with conditions, requires Admin approval | Explicitly prohibited | Allowed with conditions, automatic expiry only | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
  '| `PER-SCHED-21` change the maintenance-window calendar | Allowed | Allowed with conditions, tenant notices required | Allowed with conditions, requires Admin approval | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
  '| `PER-SCHED-22` edit tenant-owned timing settings | Allowed with conditions, platform-side edits ride maker-checker | Allowed with conditions, current-value changes are Admin actions | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
] as const

/** The 22 data rows of Matrix B, each the whole source line. */
const MATRIX_B_SOURCE_ROWS = [
  '| `PER-SCHED-01` view definition | Unavailable | Unavailable | Unavailable | Unavailable | Unavailable |',
  '| `PER-SCHED-02` view occurrences and receipts | Unavailable | Unavailable | Unavailable | Read-only, through the tenant audit log only | Unavailable |',
  '| `PER-SCHED-03` create or edit a draft | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
  '| `PER-SCHED-04` submit for approval | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
  '| `PER-SCHED-05` approve or return | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
  '| `PER-SCHED-06` activate | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
  '| `PER-SCHED-07` pause | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
  '| `PER-SCHED-08` resume | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
  '| `PER-SCHED-09` retire | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
  '| `PER-SCHED-10` change cadence or offset | Allowed with conditions, only for tenant-owned settings such as digest delivery times and report schedules | Unavailable | Allowed with conditions, only for saved report formats the role may author | Explicitly prohibited | Explicitly prohibited |',
  '| `PER-SCHED-11` change governing time zone | Allowed with conditions, only by editing Site and Shift definitions the role owns | Unavailable | Unavailable | Explicitly prohibited | Explicitly prohibited |',
  '| `PER-SCHED-12` change retry, misfire or catch-up policy | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
  '| `PER-SCHED-13` trigger manually | Allowed with conditions, only on-demand generation of a report the role may run | Unavailable | Allowed with conditions, only on-demand generation of a report the role may run | Explicitly prohibited | Explicitly prohibited |',
  '| `PER-SCHED-14` retry a failed occurrence | Unavailable | Unavailable | Unavailable | Unavailable | Unavailable |',
  '| `PER-SCHED-15` replay a completed occurrence | Unavailable | Unavailable | Unavailable | Unavailable | Unavailable |',
  '| `PER-SCHED-16` request a backfill | Unavailable | Unavailable | Unavailable | Unavailable | Unavailable |',
  '| `PER-SCHED-17` skip or suppress a planned occurrence | Unavailable | Unavailable | Unavailable | Unavailable | Unavailable |',
  '| `PER-SCHED-18` cancel an occurrence | Unavailable | Unavailable | Unavailable | Unavailable | Unavailable |',
  '| `PER-SCHED-19` release a quarantined or dead-lettered occurrence | Unavailable | Unavailable | Unavailable | Unavailable | Unavailable |',
  '| `PER-SCHED-20` break a stuck lease | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
  '| `PER-SCHED-21` change the maintenance-window calendar | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |',
  '| `PER-SCHED-22` edit tenant-owned timing settings | Allowed with conditions, within registry bounds, in the tenant administration area | Allowed with conditions, only the run-extension act within the tenant cap | Allowed with conditions, only report formats and review-related settings the role owns | Explicitly prohibited | Explicitly prohibited |',
] as const

/** A 45A.7 row: `ColumnMatrixRow` with its identifier narrowed. */
export interface ScheduleMatrixRow extends ColumnMatrixRow {
  readonly id: ScheduleOperationId
}

/**
 * One transcribed matrix.
 *
 * FAILS AT MODULE LOAD ON ANYTHING IT DOES NOT UNDERSTAND, which is the point.
 * A pipe count that does not match the header, an identifier out of the
 * enumeration's order, or a cell `cellFromSource` cannot read is a
 * transcription defect, and a transcription defect that produced a plausible
 * default would be a confident wrong permission on a screen.
 *
 * `firstLine` is the first line of the BODY and the rows are contiguous, so
 * row i's locator is `firstLine + i`. The two bodies are L99235-L99256 and
 * L99262-L99283; each ends where the blank line before the next paragraph
 * begins, counted by reading to that line rather than from a span.
 */
function buildRows(
  sourceRows: readonly string[],
  firstLine: number,
  columns: readonly MatrixColumn[],
): readonly ScheduleMatrixRow[] {
  if (sourceRows.length !== SCHEDULE_OPERATIONS.length) {
    throw new Error(
      `expected ${SCHEDULE_OPERATIONS.length} rows to match the L99229 enumeration, got ${sourceRows.length}`,
    )
  }
  return sourceRows.map((text, i) => {
    const parts = text.split('|')
    if (parts[0] !== '' || parts[parts.length - 1] !== '') {
      throw new Error(`L${firstLine + i} is not a pipe-delimited table row: ${text}`)
    }
    const fields = parts.slice(1, -1).map((f) => f.trim())
    if (fields.length !== columns.length + 1) {
      throw new Error(
        `L${firstLine + i} has ${fields.length} fields; the header declares ${columns.length + 1}`,
      )
    }
    const head = /^`(PER-SCHED-\d\d)` (.+)$/.exec(fields[0] ?? '')
    const stated = head?.[1]
    const operation = head?.[2]
    if (stated === undefined || operation === undefined) {
      throw new Error(
        `L${firstLine + i} column one is not an identifier and an operation: ${fields[0]}`,
      )
    }
    // The enumerated identifier, taken from the enumeration rather than from
    // the row, so the row's own spelling is checked against it instead of
    // becoming the answer.
    const enumerated = SCHEDULE_OPERATIONS[i]
    if (enumerated === undefined || stated !== enumerated[0]) {
      throw new Error(
        `L${firstLine + i} states ${stated} where the L99229 enumeration has ${enumerated?.[0]}`,
      )
    }
    const cells: Partial<Record<ColumnKey, ColumnCell>> = {}
    columns.forEach((column, c) => {
      cells[columnKey(column)] = cellFromSource(fields[c + 1] ?? '')
    })
    return { id: enumerated[0], operation, cells, sourceRef: `L${firstLine + i}` }
  })
}

export interface ScheduleMatrix {
  /** As the source names it. */
  readonly name: 'Matrix A' | 'Matrix B'
  readonly headerRef: string
  readonly columns: readonly MatrixColumn[]
  readonly rows: readonly ScheduleMatrixRow[]
}

/** The four platform console role types and the five non-human identities. */
export const MATRIX_A: ScheduleMatrix = {
  name: 'Matrix A',
  headerRef: 'L99233',
  columns: [...PLATFORM_COLUMNS, ...IDENTITY_COLUMNS],
  rows: buildRows(MATRIX_A_SOURCE_ROWS, 99235, [...PLATFORM_COLUMNS, ...IDENTITY_COLUMNS]),
}

/** The five tenant role types. */
export const MATRIX_B: ScheduleMatrix = {
  name: 'Matrix B',
  headerRef: 'L99260',
  columns: TENANT_COLUMNS,
  rows: buildRows(MATRIX_B_SOURCE_ROWS, 99262, TENANT_COLUMNS),
}

/**
 * WHICH MATRIX ANSWERS FOR THIS COLUMN — and the reason this is a function
 * rather than a parameter a caller passes.
 *
 * The same operation is asked of two populations in two tables, and a screen
 * that read the wrong one would not fail loudly: Matrix A holds no Tenant
 * Admin column, so `cellFor` would throw, but Matrix A's platform columns and
 * Matrix B's tenant columns are both role columns and nothing in a
 * `RoleColumn` says which table it came from. The role registry's own security
 * domain does say, so `columnClass` is what decides and no caller re-declares
 * it.
 *
 * Neither 45A.7 matrix carries an aggregate column, so that arm is a throw
 * rather than a third matrix.
 */
export function matrixFor(column: MatrixColumn): ScheduleMatrix {
  const klass = columnClass(column)
  switch (klass) {
    case 'TENANT':
      return MATRIX_B
    case 'PLATFORM':
    case 'NON_HUMAN':
      return MATRIX_A
    case 'AGGREGATE':
      throw new Error(
        `${columnKey(column)} is an aggregate column; neither 45A.7 matrix has one, and an aggregate names no actor`,
      )
  }
}

/** The row for this operation in this matrix, or a throw. */
export function scheduleRow(matrix: ScheduleMatrix, id: ScheduleOperationId): ScheduleMatrixRow {
  const row = matrix.rows.find((r) => r.id === id)
  if (row === undefined) throw new Error(`${matrix.name} has no row for ${id}`)
  return row
}

/**
 * ONE ENTRY POINT FOR ONE ACTOR'S ANSWER ON ONE OPERATION. The matrix is
 * chosen from the column, the cell is the source's ceiling, and
 * `evaluateColumnAccess` is still the only evaluator — including its three
 * throws: an aggregate column, a role column with no live evaluation, and an
 * identity column handed a live human session.
 */
export function scheduleDecision(
  id: ScheduleOperationId,
  column: MatrixColumn,
  live: LiveEvaluation | null,
): PermissionDecision {
  const matrix = matrixFor(column)
  return evaluateColumnAccess(scheduleRow(matrix, id), column, live, matrix.columns)
}

// --- Matrix B's eight conditional grants -----------------------------------

export interface TenantTimingGrant {
  readonly operation: ScheduleOperationId
  readonly role: RoleId
  /** The cell's own stated condition, verbatim. */
  readonly condition: string
  readonly sourceRef: string
}

/**
 * THE EIGHT PERMISSIVE CELLS OF MATRIX B, derived from the transcription
 * rather than listed a second time — a second list is a second thing to drift,
 * and the row it came from is the one a reader can open.
 *
 * WHY THERE ARE ANY AT ALL. Matrix B's own introduction is two sentences, not
 * one: tenant roles hold no authority over the scheduling machinery, AND
 * "What they hold is authority over the tenant's own timing settings and
 * visibility of the resulting business outcomes" (L99258, whole line). Built
 * to the first sentence alone this matrix is 110 refusals; the second sentence
 * is what licenses these eight.
 */
export const TENANT_TIMING_GRANTS: readonly TenantTimingGrant[] = MATRIX_B.rows.flatMap((row) =>
  MATRIX_B.columns
    .filter((column): column is RoleColumn => column.kind === 'role')
    .map((column) => ({ column, cell: cellFor(row, column) }))
    .filter(({ cell }) => cell.outcome === 'allowedWithConditions')
    .map(({ column, cell }) => ({
      operation: row.id,
      role: column.role,
      condition: cell.detail,
      sourceRef: row.sourceRef,
    })),
)

/**
 * WHY THESE EIGHT ARE NOT CROSS-SURFACE STATEMENTS, for the screen that
 * renders them. Held here as data rather than as prose in a component because
 * three wave-2 screens read these rows and one wording is one thing to keep
 * true.
 *
 * The plan assigned this task a "tenant cross-surface ruling" to make. It does
 * not need making: rule four settles it in the opposite direction, and one of
 * the eight cells settles it in the cell itself — `PER-SCHED-22` grants the
 * Tenant Admin `Allowed with conditions, within registry bounds, in the tenant
 * administration area` at L99283. `CrossSurfaceStatement` therefore stays
 * unwidened; nothing here names another surface.
 */
export const TENANT_TIMING_IS_SAME_SURFACE = {
  statement:
    'These eight grants are tenant-side acts in the tenant administration area, on this surface. Rule four states the reach and the place in one sentence: tenant roles hold no authority over platform scheduling machinery, and editing the tenant-configurable timing settings "is a Tenant Admin act in the tenant administration area, and it changes when platform work runs for that tenant without granting any control over the machinery". The permission row says the same thing in the cell itself, where the Tenant Admin is granted `Allowed with conditions, within registry bounds, in the tenant administration area`. No other surface is named, so no cross-surface statement is rendered.',
  whyNotAllRefusals:
    'Matrix B opens with two sentences, not one: "Tenant roles hold no authority over the scheduling machinery. What they hold is authority over the tenant\'s own timing settings and visibility of the resulting business outcomes." The second sentence is what these eight cells exercise; read to the first sentence alone the matrix is 110 refusals.',
  sourceRefs: ['L99201', 'L99258', 'L99283'],
} as const

// --- audit attribution, rule two -------------------------------------------

/**
 * WHO AN AUDIT ROW NAMES, in the two fields rule two requires to stay apart.
 *
 * The rule's own words: "the human's decision is recorded as the authority and
 * the identity is recorded as the actor, and the two are never conflated. This
 * mirrors the platform's own rule that the audit log records identity and
 * action, never 'acting as role'" (L99197). One field would be the
 * conflation.
 */
export interface ScheduleAttribution {
  /** The identity the act is recorded against. Never a role. */
  readonly actor: string
  /** What made the act permissible. Null only where no human decided. */
  readonly authority: string | null
}

/**
 * THREE COLUMN KINDS, THREE ANSWERS, AND THREE MISUSES THAT THROW. The three
 * arms are `columnAttribution`'s three values in its order — SESSION_IDENTITY,
 * THE_NAMED_IDENTITY, NOT_ATTRIBUTABLE — and the test asserts that pairing for
 * every column of both matrices rather than this function asserting it against
 * itself.
 *
 * - A ROLE column: the actor is the signed-in person, the authority is the
 *   role. Passing a `humanAuthority` as well throws — a role column's
 *   authority IS the role, and recording a second one is the conflation.
 *   A null `actorOfRecord` throws: an audit row with no actor cannot be
 *   written, and writing it against the role would be the "acting as role"
 *   the rule forbids by name.
 * - An IDENTITY column: the actor is the named identity, and the authority is
 *   the human decision behind it where one exists. A live human session throws
 *   for the same reason `evaluateColumnAccess` refuses one — rule two is that
 *   a scheduled run may not reuse a human session, and accepting one quietly
 *   here is the same defect written into the audit trail instead of the guard.
 * - An AGGREGATE column: no actor exists, so there is nothing to attribute.
 *   Neither 45A.7 matrix has one; the arm is here because the parameter type
 *   admits one and a silent answer would be worse than a throw.
 */
export function scheduleAttribution(
  column: MatrixColumn,
  live: LiveEvaluation | null,
  humanAuthority: string | null,
): ScheduleAttribution {
  switch (column.kind) {
    case 'role': {
      if (live === null) {
        throw new Error(
          `${columnKey(column)} is a role column and its audit row names the session identity, which needs a live evaluation`,
        )
      }
      if (humanAuthority !== null) {
        throw new Error(
          `${columnKey(column)} is a role column; its authority is the role, and a second authority is the conflation rule two forbids (L99197)`,
        )
      }
      const actor = live.ctx.actorOfRecord
      if (actor === null) {
        throw new Error(
          `${columnKey(column)} has no actor of record; an audit row may not be keyed on the role instead (L99197)`,
        )
      }
      return { actor, authority: roleById(column.role).name }
    }
    case 'identity': {
      if (live !== null) {
        throw new Error(
          `${columnKey(column)} is a non-human identity and may not be attributed to a human session (L99197)`,
        )
      }
      return { actor: column.header, authority: humanAuthority }
    }
    case 'aggregate':
      throw new Error(
        `${columnKey(column)} names a set of roles, not an actor; an audit row may not be keyed on it (L99197)`,
      )
  }
}

// --- the audit read scope ---------------------------------------------------

/**
 * One audit event as the reader's screen holds it BEFORE the scope filter.
 * `resourceTenant` is the tenant that owns the object the event references —
 * the field the filter exists to check.
 */
export interface ScheduleAuditReference {
  readonly eventId: string
  readonly operation: ScheduleOperationId
  readonly resourceTenant: TenantId
  readonly sourceRef: string
}

/**
 * THE SELECTOR, NOT THE RENDER. `AC-30D-105`, L74029: "Audit reading never
 * bypasses the authorisation of the objects it references." Its paired test
 * `TEST-30D-103` at L74032 asks for a read of an audit event referencing
 * evidence the reader may not view, and that the reference disclose nothing.
 * A screen that fetched every event and then drew fewer is scope enforced in
 * what it DREW; this filters what it READS, and it is the only way these rows
 * reach a screen.
 *
 * TWO STAGES, BECAUSE ONE IS NOT ENOUGH.
 *
 * 1. THE LICENCE is the reader's own cell on `PER-SCHED-02`. For the Read-only
 *    Auditor that is `Read-only, through the tenant audit log only` (L99263),
 *    which is rule five's "Scheduled-work effects are visible to that role
 *    only as audit records" (L99203). A reader whose cell permits no read gets
 *    nothing — which is most of Matrix B, the Tenant Admin included.
 *
 * 2. THE OBJECT AUTHORISATION runs per row, and it is what stops the licence
 *    from being a back door. A `Read-only` cell is answered by the cell alone,
 *    so `evaluateColumnAccess` never reaches `evaluateAccess` — correct for a
 *    ceiling, and it means tenant isolation has NOT been checked when stage
 *    one returns a read. Stage two asks it of every referenced object.
 *
 * `allowedRoles` is deliberately the reader's own role: the role question was
 * answered in stage one from the matrix row, and re-answering it here from a
 * hand-built list would be the second declaration `rolesPermitting` exists to
 * prevent. What stage two adds is everything after the base-role stage —
 * tenant isolation above all, then suspension and lifecycle. Stage two also
 * builds its request rather than spreading the caller's: a caller's own
 * `safetyControl` or `objectState` describes the act it wanted, not the
 * authorisation of the objects these events reference.
 *
 * A non-role column throws. No non-human identity has an audit-reading
 * screen; rule one narrows an identity to its definition's declared scope, and
 * that is not a log read.
 */
export function readableScheduleAudit(
  refs: readonly ScheduleAuditReference[],
  column: MatrixColumn,
  live: LiveEvaluation,
): readonly ScheduleAuditReference[] {
  if (column.kind !== 'role') {
    throw new Error(
      `${columnKey(column)} has no audit-reading screen; only a role column reads the audit log`,
    )
  }
  const licence = scheduleDecision('PER-SCHED-02', column, live)
  if (!permitsRead(licence)) return []

  return refs.filter((ref) =>
    permitsRead(
      evaluateAccess(
        {
          action: `READ_SCHEDULE_AUDIT/${ref.operation}`,
          allowedRoles: [column.role],
          resourceTenant: ref.resourceTenant,
          sourceRefs: [ref.sourceRef, 'L74029'],
        },
        live.ctx,
      ),
    ),
  )
}
