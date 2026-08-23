import { roleById, type RoleId, type SecurityDomain } from '@/domain/roles'
import {
  decide,
  deny,
  notApplicable,
  permitsAction,
  type PermissionDecision,
  type PermissionOutcome,
} from './decision'
import { evaluateAccess, type AccessContext, type AccessRequest } from './evaluate'

/**
 * A MATRIX COLUMN THAT IS NOT A PERSON.
 *
 * `evaluateAccess` is keyed on `RoleId` and the six shipped Hub matrices are
 * keyed on the five tenant roles, which is correct for every matrix built
 * before this slice. Three matrices transcribed in this slice are keyed on
 * something else, and all three were measured on the frozen source rather
 * than taken from a brief:
 *
 * - 45A.7 Matrix A, header L99233: TEN pipe-delimited columns — one operation
 *   column and NINE actor columns, of which four are platform console roles
 *   and FIVE are non-human identities (Scheduler Controller, Scheduled
 *   Execution Worker, Data-pipeline identity, Artificial-intelligence
 *   scheduler identity, Integration identity). 22 data rows, L99235-L99256.
 * - 45A.7 Matrix B, header L99260: six columns — one operation column and the
 *   five tenant roles. 22 data rows, L99262-L99283.
 * - `MOD-SA-18`, header L46160: seven columns — one action column and SIX
 *   mixed actor columns, four platform roles plus the Tenant Admin and the
 *   Read-only Auditor. 8 data rows, L46162-L46169.
 * - `MOD-SA-14`, header L45653: six columns — one action column, the four
 *   platform roles, and an AGGREGATE, "Any tenant role". 7 data rows,
 *   L45655-L45661.
 *
 * SO THE GAP IS THE COLUMN TYPE, NOT THE OUTCOME UNION. `PermissionOutcome`
 * already carries every token these four matrices use, including
 * `notApplicable` with its required stated reason — which is what the two
 * Integration-identity cells at L99235 and L99236 need.
 *
 * WHY THERE ARE THREE ARMS FOR FOUR COLUMN CLASSES. A tenant-role column and
 * a platform-role column are one arm carrying a `RoleId`, because the role
 * registry already knows which security domain a role belongs to and
 * `columnClass` reads it there. A second declaration of that split is a
 * second thing to drift, and one already exists: `src/surfaces/doh/modules.ts`
 * bridges it with a cast (`rolesInDomain('TENANT').map((r) => r.id as
 * TenantRoleId)`). `TenantRoleId` is not widened and is not imported here.
 */
export type MatrixColumn = RoleColumn | IdentityColumn | AggregateColumn

/** One named role, tenant-domain or platform-domain. The registry says which. */
export interface RoleColumn {
  readonly kind: 'role'
  /** The column header, verbatim from the source table. */
  readonly header: string
  readonly role: RoleId
}

/**
 * One named non-human identity — a program with its own credential lifecycle,
 * not a person and not a role.
 */
export interface IdentityColumn {
  readonly kind: 'identity'
  /** The column header, verbatim from the source table. */
  readonly header: string
  /**
   * Where this identity is DEFINED. Not the matrix cell's locator — the
   * identity's own. The source spells two of these identities two ways
   * (L17887/L17888 against L98883/L98885) and one header, "Integration
   * identity", covers two separate register rows (L17884 and L17885), so a
   * caller carries every locator it means rather than one it picked. Which
   * spelling is canonical is a disclosure the decision canon holds, not a
   * fact this type decides.
   */
  readonly identitySourceRefs: readonly string[]
}

/**
 * A header standing for a SET of roles rather than for one actor.
 * `MOD-SA-14`'s fifth column is "Any tenant role" (L45653).
 */
export interface AggregateColumn {
  readonly kind: 'aggregate'
  /** The column header, verbatim from the source table. */
  readonly header: string
  /**
   * The roles the header covers, transcribed rather than derived. Deriving
   * "Any tenant role" from `rolesInDomain('TENANT')` would silently answer a
   * question the header only implies, and one cell already contradicts the
   * header: L45659 grants the aggregate `Allowed with conditions` and its
   * stated condition names the Tenant Admin alone. See `ColumnCell.narrowsTo`.
   */
  readonly members: readonly RoleId[]
  readonly sourceRef: string
}

/**
 * WHO AN AUDIT ROW FOR A CELL IN THIS COLUMN MAY NAME, and this is the point
 * of the type rather than a convenience on it.
 *
 * 45A.7 rule two, L99197, whole line: a scheduled run "acts under its own
 * non-human identity with its own credential lifecycle. Where a scheduled
 * effect exists because a human decided something, the human's decision is
 * recorded as the authority and the identity is recorded as the actor, and the
 * two are never conflated. This mirrors the platform's own rule that the audit
 * log records identity and action, never 'acting as role'."
 *
 * Read that as three separate statements and three arms fall out.
 *
 * - A ROLE column names no actor. The actor is the session identity that holds
 *   the role; the role is the authority. Attributing the row to the role is
 *   the "acting as role" the rule forbids by name.
 * - An IDENTITY column IS the actor, because a non-human identity is an
 *   identity — that is the whole of rule two's first sentence.
 * - An AGGREGATE column can be neither. It is a set, so it has no credential
 *   and no session, and naming it in an audit row is "acting as role" with the
 *   role left unspecified. There is no evaluation path for it at all; see
 *   `evaluateColumnAccess`.
 */
export type ColumnAttribution =
  /** The signed-in identity is the actor; this column is the authority. */
  | 'SESSION_IDENTITY'
  /** This column is the actor, under its own credential lifecycle. */
  | 'THE_NAMED_IDENTITY'
  /** No actor exists. An audit row may not be keyed on this column. */
  | 'NOT_ATTRIBUTABLE'

export function columnAttribution(column: MatrixColumn): ColumnAttribution {
  switch (column.kind) {
    case 'role':
      return 'SESSION_IDENTITY'
    case 'identity':
      return 'THE_NAMED_IDENTITY'
    case 'aggregate':
      return 'NOT_ATTRIBUTABLE'
  }
}

/**
 * The four column classes, for a caller that needs the tenant/platform split
 * the type deliberately does not re-declare. Read from the role registry, so
 * it cannot disagree with it.
 */
export type ColumnClass = SecurityDomain | 'NON_HUMAN' | 'AGGREGATE'

export function columnClass(column: MatrixColumn): ColumnClass {
  switch (column.kind) {
    case 'role':
      return roleById(column.role).domain
    case 'identity':
      return 'NON_HUMAN'
    case 'aggregate':
      return 'AGGREGATE'
  }
}

/**
 * The key a row's cells are stored under. PREFIXED, so an identity or an
 * aggregate whose header happens to spell a role id cannot collide with that
 * role's column, and so a key in a failure message says what it is.
 */
export type ColumnKey = `role:${RoleId}` | `identity:${string}` | `aggregate:${string}`

export function columnKey(column: MatrixColumn): ColumnKey {
  switch (column.kind) {
    case 'role':
      return `role:${column.role}`
    case 'identity':
      return `identity:${column.header}`
    case 'aggregate':
      return `aggregate:${column.header}`
  }
}

/**
 * One cell. `detail` is required and may not be blank: L10238, whole line —
 * "Blank cells are prohibited, because a blank cell is an unanswered question
 * that an implementer will answer privately and inconsistently." Where the
 * source states the bare token and qualifies it nowhere, the cell says so in
 * the source's own terms; no cause is invented to fill the field.
 */
export interface ColumnCell {
  readonly outcome: PermissionOutcome
  /** The cell's stated condition or cause, verbatim. Never blank. */
  readonly detail: string
  /**
   * Set ONLY on an aggregate column's cell, and only when the cell's own
   * words cover fewer roles than the header does. L45659 is the case: the
   * header is "Any tenant role" and the cell reads `Allowed with conditions —
   * the Tenant Admin configures tenant notification preferences within the
   * mandatory baseline`. The header and the cell disagree, and the cell wins,
   * because it is the more specific statement.
   */
  readonly narrowsTo?: readonly RoleId[]
}

export interface ColumnMatrixRow {
  /** The operation or action identifier, e.g. `PER-SCHED-13`. */
  readonly id: string
  /** Column one of the row, verbatim. */
  readonly operation: string
  readonly cells: Readonly<Partial<Record<ColumnKey, ColumnCell>>>
  readonly sourceRef: string
}

/**
 * The cell for this column, or a throw.
 *
 * A MISSING CELL IS A DEFECT, NOT A DEFAULT — that is L10238 again. A
 * `Partial<Record<...>>` is what a header-keyed store can be typed as when the
 * header set is not known statically, so completeness is checked rather than
 * assumed, and it is checked loudly.
 */
export function cellFor(row: ColumnMatrixRow, column: MatrixColumn): ColumnCell {
  const key = columnKey(column)
  const cell = row.cells[key]
  if (cell === undefined) {
    throw new Error(`${row.id} has no cell for ${key}; a blank cell is prohibited (L10238)`)
  }
  if (cell.detail.trim() === '') {
    throw new Error(`${row.id} cell ${key} has a blank detail; a blank cell is prohibited (L10238)`)
  }
  return cell
}

/**
 * The columns this row has no cell for.
 *
 * FOR A GATE, WITH ONE HAZARD STATED: this is empty for an empty `columns`
 * list, so a gate that only asserts the result is empty passes on a matrix
 * whose header list it failed to load. Assert the column count too.
 */
export function missingCells(
  row: ColumnMatrixRow,
  columns: readonly MatrixColumn[],
): readonly ColumnKey[] {
  return columns.map(columnKey).filter((key) => row.cells[key] === undefined)
}

/**
 * The roles this row's own cells grant the action to — the ONE place a role
 * list for a row comes from. `evaluateColumnAccess` fills `allowedRoles` from
 * it, which is why that function's request parameter has no `allowedRoles`
 * field: a screen cannot hand-write "the Quality Manager may approve" and have
 * it disagree with the row nobody re-read.
 *
 * Role columns only. An identity column's grant is not a role grant (L99197),
 * and an aggregate column names no role at all until a cell narrows it.
 */
export function rolesPermitting(
  row: ColumnMatrixRow,
  columns: readonly MatrixColumn[],
): readonly RoleId[] {
  return columns
    .filter((c): c is RoleColumn => c.kind === 'role')
    .filter((c) => permitsAction(cellDecision(row, c, cellFor(row, c))))
    .map((c) => c.role)
}

/**
 * Which roles an aggregate cell actually covers: the cell's own narrowing
 * where it states one, the header's membership otherwise. The caller then
 * evaluates each as a role column and attributes the act to the one that
 * performed it — never to the aggregate.
 */
export function aggregateResolvesTo(
  column: AggregateColumn,
  cell: ColumnCell,
): readonly RoleId[] {
  return cell.narrowsTo ?? column.members
}

/** The live half of a role column's answer. */
export interface LiveEvaluation {
  /**
   * Everything `evaluateAccess` needs EXCEPT the role list, which comes from
   * the row. See `rolesPermitting`.
   */
  readonly req: Omit<AccessRequest, 'allowedRoles'>
  readonly ctx: AccessContext
}

/**
 * ONE ANSWER PER CELL, AND `evaluateAccess` IS STILL THE ONLY EVALUATOR.
 *
 * A cell is the source's declared CEILING. `evaluateAccess` is the live
 * evaluation — session, tenant isolation, suspension, scope, object state,
 * qualification, device, segregation of duties. The answer is the more
 * restrictive of the two, and the two are consulted in that order:
 *
 * 1. The cell does not permit the action (`Read-only`, `Unavailable`,
 *    `Explicitly prohibited`, `Cached read-only while offline`, `Not
 *    applicable`, `Client Decision Required`) — the cell's own words answer,
 *    and `evaluateAccess` is never asked. Reaching it would produce a refusal
 *    reason the source did not state, over a refusal it already did.
 * 2. The cell permits (`Allowed`, `Allowed with conditions`, `Queued while
 *    offline`) — `evaluateAccess` runs, with `allowedRoles` from the row. If
 *    it refuses, its refusal is the answer.
 * 3. It allows, and the cell was conditional — the CELL's decision is
 *    returned, not a bare allow. A `Allowed with conditions` cell rendered as
 *    a full allow is the condition silently dropped.
 *
 * THREE MISUSES THROW, AND EACH NAMES ITS RULE.
 *
 * - An AGGREGATE column has no evaluation. It names no actor
 *   (`NOT_ATTRIBUTABLE`), so an access decision keyed on it would be the
 *   "acting as role" L99197 forbids. Use `aggregateResolvesTo` and evaluate a
 *   member.
 * - A ROLE column with `live === null` fails closed. Answering a role column
 *   from the matrix alone is scope enforced in what a screen DRAWS rather
 *   than in what it READS.
 * - An IDENTITY column with `live !== null` fails closed, and this one is rule
 *   two itself: "A scheduled run must not reuse an expired human session or a
 *   stale bearer token" (L99197). A non-human identity's cell is answered from
 *   its own declared authority under rule one's narrowing (L99195), never from
 *   whoever happens to be looking at the screen. Ignoring a session that was
 *   passed would be the same defect written quietly.
 */
export function evaluateColumnAccess(
  row: ColumnMatrixRow,
  column: MatrixColumn,
  live: LiveEvaluation | null,
  columns: readonly MatrixColumn[],
): PermissionDecision {
  const cell = cellFor(row, column)

  if (column.kind === 'aggregate') {
    throw new Error(
      `${row.id} column ${columnKey(column)} is an aggregate and names no actor; ` +
        'resolve it with aggregateResolvesTo and evaluate a member (L99197)',
    )
  }

  if (column.kind === 'identity') {
    if (live !== null) {
      throw new Error(
        `${row.id} column ${columnKey(column)} is a non-human identity and may not be ` +
          'answered from a human session (L99197)',
      )
    }
    return cellDecision(row, column, cell)
  }

  if (live === null) {
    throw new Error(
      `${row.id} column ${columnKey(column)} is a role and needs a live evaluation; ` +
        'the matrix alone is a ceiling, not an answer',
    )
  }

  const ceiling = cellDecision(row, column, cell)
  if (!permitsAction(ceiling)) return ceiling

  const live0 = evaluateAccess(
    { ...live.req, allowedRoles: rolesPermitting(row, columns) },
    live.ctx,
  )
  if (!permitsAction(live0)) return live0
  return cell.outcome === 'allowed' ? live0 : ceiling
}

/**
 * The cell, as a decision. No live state is read here, which is why it is not
 * exported: a caller holding this alone would be holding the ceiling and
 * calling it the answer.
 *
 * `stage` names WHERE the answer came from; `columnAttribution` names WHO the
 * row may be attributed to. `BASE_ROLE` on an identity column is the former —
 * the stage that reads an actor's own declared grant, which under rule one
 * (L99195) is exactly what a non-human identity's row states. Conflating the
 * two fields is the L99197 error; keeping them separate is how the identity
 * arm can use this stage and still be `THE_NAMED_IDENTITY` rather than a role.
 */
function cellDecision(
  row: ColumnMatrixRow,
  column: RoleColumn | IdentityColumn,
  cell: ColumnCell,
): PermissionDecision {
  const refs = [row.sourceRef, ...(column.kind === 'identity' ? column.identitySourceRefs : [])]
  const opts = { stage: 'BASE_ROLE', sourceRefs: refs } as const

  switch (cell.outcome) {
    case 'allowed':
      return decide('allowed', 'ALLOWED', undefined, { ...opts, auditExpectation: 'RECORDED' })
    case 'allowedWithConditions':
      return decide('allowedWithConditions', 'CONDITIONS_APPLY', cell.detail, {
        ...opts,
        auditExpectation: 'RECORDED',
        conditionToEnable: cell.detail,
      })
    case 'readOnly':
      return decide('readOnly', 'READ_ONLY_RECORD', cell.detail, opts)
    case 'cachedReadOnlyOffline':
      return decide('cachedReadOnlyOffline', 'CACHED_WHILE_OFFLINE', cell.detail, opts)
    case 'queuedOffline':
      return decide('queuedOffline', 'QUEUED_WHILE_OFFLINE', cell.detail, {
        ...opts,
        auditExpectation: 'RECORDED',
      })
    case 'unavailable':
      return deny('unavailable', 'MATRIX_STATES_UNAVAILABLE', cell.detail, opts)
    case 'explicitlyProhibited':
      return deny('explicitlyProhibited', 'EXPLICIT_DENY', cell.detail, {
        ...opts,
        auditExpectation: 'RECORDED_AS_REFUSAL',
      })
    case 'clientDecisionRequired':
      return deny('clientDecisionRequired', 'DECISION_OPEN', cell.detail, opts)
    case 'notApplicable':
      return notApplicable(cell.detail, opts)
  }
}

/**
 * THE NINE SOURCE TOKENS OF L10238, in its spelling, longest first.
 *
 * `Allowed` is a prefix of `Allowed with conditions`, and a check that matched
 * `Allowed` first is on this build's list of gates that could not fail. 41 of
 * 45A.7 Matrix A's 198 cells read `Allowed with conditions` and every one of
 * them states its condition after a comma in the same cell, so a prefix match
 * reads 41 conditioned grants as unconditional ones.
 *
 * WHICH MECHANISM ACTUALLY STOPS THAT, measured by planting it: not this
 * order. Moving `Allowed` to the front of this array changes no result and
 * fails no test, because the SEPARATOR REQUIREMENT below rejects it — `Allowed`
 * followed by " with conditions" is followed by neither a separator nor the end
 * of the cell, so the loop keeps going. The order is a second line of defence
 * and nothing pins it; the separator requirement is the one that works, and the
 * "not one of the nine source tokens" case is what holds it.
 */
const SOURCE_TOKENS = [
  ['Cached read-only while offline', 'cachedReadOnlyOffline'],
  ['Client Decision Required', 'clientDecisionRequired'],
  ['Allowed with conditions', 'allowedWithConditions'],
  ['Queued while offline', 'queuedOffline'],
  ['Explicitly prohibited', 'explicitlyProhibited'],
  ['Not applicable', 'notApplicable'],
  ['Unavailable', 'unavailable'],
  ['Read-only', 'readOnly'],
  ['Allowed', 'allowed'],
  // `as const satisfies`, not an annotation: the annotation form widens every
  // literal and is what `tests/coverage/slice-2c-gates.test.ts` gate 2 refuses.
] as const satisfies readonly (readonly [string, PermissionOutcome])[]

/** What may follow a token: nothing, or a separator the source actually uses. */
const SEPARATORS = [',', ' —', ' -', ';', ':'] as const

/**
 * A CELL BACKTICKED AS A WHOLE, UNWRAPPED — the third backtick placement the
 * source uses, and the one this parser used to leave half-stripped.
 *
 * The two it already handled: the whole cell opened with a backtick and the
 * token closed with one (`` `Allowed`, when X ``), or no backticks at all. The
 * third is `` `Not applicable — deferred beyond V1` `` — open at the start,
 * close AFTER the stated reason — where stripping the leading backtick alone
 * left the reason ending in a stray backtick, and `detail` is transcribed
 * verbatim, so that character reached the screen. `MOD-DOH-11` hit it on two
 * cells and normalised around it locally; this is the same rule, in the one
 * place all 37 call sites route through.
 *
 * GUARDED THREE WAYS, and the third is the one that matters: the cell must
 * open with a backtick, close with one, and hold NO INTERIOR backtick. A
 * condition that names an identifier in backticks of its own —
 * `` `Read-only` — see `OBJ-DOH-AUDIT` `` — is therefore untouched here and
 * falls through to the token-backtick path exactly as before. Unwrapping it
 * would strip a delimiter belonging to the identifier rather than to the cell.
 */
function unwrapWhollyBackticked(cell: string): string {
  if (cell.length < 2 || !cell.startsWith('`') || !cell.endsWith('`')) return cell
  const inner = cell.slice(1, -1)
  return inner.includes('`') ? cell : inner
}

/**
 * One cell's source text to one cell. The transcriber's entry point, so
 * forty-four rows across two matrices do not each re-derive the token rule.
 *
 * FAILS LOUDLY ON TEXT IT DOES NOT UNDERSTAND. A parser that fell back to a
 * default would turn an unrecognised cell into a confident wrong outcome, and
 * a transcription of 22 rows by 9 columns is exactly where that goes unnoticed.
 * `Not applicable` additionally requires its stated reason, because L10238
 * requires one and `notApplicable` refuses to be built without one.
 */
export function cellFromSource(text: string): ColumnCell {
  const trimmed = unwrapWhollyBackticked(text.trim())
  // Some cells backtick the WHOLE cell, some backtick only the token and then
  // state a condition in plain text (L100426), and some carry no backticks at
  // all (L99235). Stripping every backtick would be shorter and wrong: a
  // condition may name an identifier in backticks of its own, and `detail` is
  // transcribed verbatim.
  const head = trimmed.startsWith('`') ? trimmed.slice(1) : trimmed
  for (const [token, outcome] of SOURCE_TOKENS) {
    if (!head.startsWith(token)) continue
    const afterToken = head.slice(token.length)
    const rest = afterToken.startsWith('`') ? afterToken.slice(1) : afterToken
    if (rest !== '' && !SEPARATORS.some((s) => rest.startsWith(s))) continue
    const stated = rest.replace(/^[,;:]/, '').replace(/^ [—-]/, '').trim()
    if (outcome === 'notApplicable' && stated === '') {
      throw new Error(`"${trimmed}" is Not applicable with no stated reason (L10238)`)
    }
    return { outcome, detail: stated === '' ? `${token}, stated bare in the source` : stated }
  }
  throw new Error(`"${trimmed}" is not one of the nine source tokens (L10238)`)
}
