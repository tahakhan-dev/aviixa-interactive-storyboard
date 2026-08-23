import type { TenantId } from '@/domain/ids'
import type { RoleId } from '@/domain/roles'
import { permitsRead, type PermissionDecision } from '@/policy/decision'
import { evaluateAccess, type AccessContext } from '@/policy/evaluate'
import { routeBySurface, routesForRole } from '@/routes/definitions'
import { cellStatus, rolesReachingByMatrix, type ControlStatus } from '@/surfaces/doh/modules'
import type { TenantRoleId } from '../../../../../app/hub/HubShell'
import {
  AUDIT_TAXONOMY,
  CONTROL_MATRIX,
  doh11Row,
  type AuditEventClassId,
  type Doh11Row,
  type Doh11RowId,
} from './matrix'

/**
 * `MOD-DOH-11`'s rendering rule and its read-scope selector, decided ONCE and
 * read by the screen. The screen holds no `role ===` and no status comparison.
 *
 * ── THE ORDER OF THE QUESTIONS IS THE RULE ────────────────────────────────
 * 1. Does this persona reach this surface at all? D11, read out of the route
 *    registry, never re-asserted here.
 * 2. IS THIS CELL A ROUTING BRANCH? A prohibition that names a permission in
 *    the same cell, whose named permission is held by this same role on an
 *    immediately adjacent row of this same matrix. Asked BEFORE the token,
 *    because the token alone would send it to ABSENT.
 * 3. Only now, the token.
 *
 * ── WHY THE ROUTING BRANCH RENDERS DISABLED AND NOT ABSENT ────────────────
 * The categorical rule this build inherited sends `Explicitly prohibited` to
 * ABSENT, and the source's own definition row backs it — L109081: "The action
 * is offered nowhere and is refused if attempted by any route." That
 * definition is about a capability nobody holds. This cell is a different
 * animal: it reads `Explicitly prohibited` AND names the permission that
 * replaces it in the same words (L28865), and the row immediately below grants
 * exactly those events to exactly that role (L28866). Sending it to ABSENT
 * deletes the only sentence telling a Quality Manager what they CAN read —
 * against the source's own principle at L34595, "Present every unavailable
 * capability with a stated reason rather than hiding it."
 *
 * THIS IS NOT THIS MODULE'S RULING TO MAKE, AND IT IS NOT MAKING ONE.
 * `DEC-AUDITQM-001` in `src/disclosure/decisions.ts` already adopted reading
 * (b) and already states the consequence — the full-log cell is the routing
 * branch and not a categorical prohibition, so it renders DISABLED with the
 * named reason. This fold implements that record. The screen cites the record
 * through `DecisionDisclosure` and restates none of it.
 *
 * ── WHAT MAKES THE BRANCH LOAD-BEARING RATHER THAN A FLAG ─────────────────
 * `routesTo` names a row; it does not assert an outcome. Before rendering
 * DISABLED the fold checks two things that can both fail:
 *
 *   (a) the named row is the IMMEDIATELY NEXT row of this matrix — "the
 *       alternative is on the same screen and immediately adjacent" is the
 *       ground for the rendering, so a distant row is a different situation
 *       and throws rather than borrowing this one's answer;
 *   (b) that row's cell FOR THIS SAME ROLE actually permits a read.
 *
 * Fail (b) and the cell falls through to ABSENT, which is the correct answer
 * for a prohibition with no live alternative. The unit suite plants exactly
 * that — row 2's Quality Manager cell moved off `Read-only` — and watches the
 * rendering flip.
 *
 * ── NO `cross-surface` ARM ────────────────────────────────────────────────
 * Two rows state that the act is performed on the Super Admin platform
 * console, in their own cells' words. No tenant role opens that surface, so
 * there is no link to draw and no pointer that could be read as a verified
 * route; the cell's own sentence is what renders where the control would sit.
 * A `cross-surface` arm here would be a fourth reading of `another-surface`
 * on top of the three already recorded as divergences, for two rows that are
 * `Explicitly prohibited` in all five columns.
 */

export type Doh11Affordance =
  /** Enabled. The cell's condition, where it has one, rides along. */
  | { readonly kind: 'control'; readonly label: string; readonly conditions: string }
  /** Rendered, and no write path. The cell is a read. */
  | { readonly kind: 'read-only'; readonly label: string; readonly reason: string }
  /**
   * Visible, inoperable, and the reason is the cell's own words. The routing
   * branch, and the only arm that names a decision identifier.
   */
  | {
      readonly kind: 'disabled'
      readonly label: string
      /** The prohibition's own named permission, verbatim from the cell. */
      readonly namedReason: string
      /** What the reader may read instead, and where that row says so. */
      readonly insteadLabel: string
      readonly insteadRef: string
      readonly decisionRef: string
    }
  /** Nothing is drawn, and the reason is printed where the control would be. */
  | { readonly kind: 'absent'; readonly reason: string }

/** A cell that lets a reader see something. The three permissive statuses. */
const PERMITS_READ = [
  'allowed',
  'allowed-with-conditions',
  'read-only',
] as const satisfies readonly ControlStatus[]

function cellPermitsRead(row: Doh11Row, role: TenantRoleId): boolean {
  return (PERMITS_READ as readonly ControlStatus[]).includes(cellStatus(row, role))
}

/**
 * `cellFromSource`'s own wording for a cell that states the bare token and
 * qualifies it nowhere. Not a magic string this file invented: the unit suite
 * asserts it is what the shared parser actually produces for a bare
 * `Explicitly prohibited` cell, so a change to that wording turns this red
 * rather than quietly disabling the check below.
 */
export const BARE_PROHIBITION_DETAIL = 'Explicitly prohibited, stated bare in the source'

/** D11 asked at the registry. `HubShell` asks the same question of the same entry. */
function reachesThisSurface(role: RoleId): boolean {
  const hub = routeBySurface('SURF-DOH')
  return routesForRole(role).some((r) => r.id === hub.id)
}

/**
 * The routing branch, or `null` when this cell is not one. Separated from the
 * fold so the unit suite can ask the question directly over all fifty cells
 * and assert that exactly one answers.
 */
export function doh11RoutingBranch(
  row: Doh11Row,
  role: TenantRoleId,
): { readonly namedReason: string; readonly instead: Doh11Row } | null {
  if (row.routesTo === null) return null
  if (cellStatus(row, role) !== 'explicitly-prohibited') return null

  const index = CONTROL_MATRIX.indexOf(row)
  const instead = doh11Row(row.routesTo)
  if (CONTROL_MATRIX.indexOf(instead) !== index + 1) {
    throw new Error(
      `MOD-DOH-11 row "${row.id}" routes to "${row.routesTo}", which is not the immediately ` +
        'adjacent row. The DISABLED rendering rests on the alternative being on the same screen ' +
        'and immediately adjacent; a distant row is a different situation and may not borrow it.',
    )
  }
  // The prohibition's cell must actually NAME the permission. A routing row
  // whose cell states the bare token has no named reason to render, and a
  // DISABLED control with no explanation is the one thing every locked
  // rendering in this tree refuses — so it throws rather than drawing one.
  const named = row.detail[role]
  if (named === BARE_PROHIBITION_DETAIL) {
    throw new Error(
      `MOD-DOH-11 row "${row.id}" is a routing branch and its ${role} cell states the bare ` +
        'token, so there is no named permission to render. A disabled control with no stated ' +
        'reason is not an option; re-check the transcription or the routing pointer.',
    )
  }

  // The named permission has to be live for THIS role on that row.
  if (!cellPermitsRead(instead, role)) return null
  return { namedReason: named, instead }
}

/**
 * ONE cell's affordance. Handed the row and the role; computes no permission
 * of its own beyond reading the cell the matrix states.
 */
export function doh11Affordance(row: Doh11Row, role: TenantRoleId): Doh11Affordance {
  // 1. D11, before the token.
  if (!reachesThisSurface(role)) {
    return {
      kind: 'absent',
      reason:
        `${row.detail[role]} The route registry admits no Worker to the Delivery Operations Hub ` +
        '(D11), so nothing on this screen is withheld from this role — the screen is not offered ' +
        'at all.',
    }
  }

  // 2. The routing branch, before the token, because the token would delete it.
  const branch = doh11RoutingBranch(row, role)
  if (branch !== null) {
    return {
      kind: 'disabled',
      label: row.control,
      namedReason: branch.namedReason,
      insteadLabel: branch.instead.control,
      insteadRef: branch.instead.sourceRef,
      decisionRef: 'DEC-AUDITQM-001',
    }
  }

  // 3. The token, last.
  switch (cellStatus(row, role)) {
    case 'allowed':
    case 'allowed-with-conditions':
      return { kind: 'control', label: row.control, conditions: row.detail[role] }
    case 'read-only':
      return { kind: 'read-only', label: row.control, reason: row.detail[role] }
    case 'unavailable':
    case 'not-applicable':
    case 'explicitly-prohibited':
      return { kind: 'absent', reason: row.detail[role] }
  }
}

/**
 * Every kind this card can produce over every row and every role. Exported
 * because the DISABLED-not-ABSENT claim is a claim about what renders exactly
 * once, and a claim about a count is only worth what the walk behind it
 * covers.
 */
export function doh11AffordanceKinds(
  roles: readonly TenantRoleId[],
): ReadonlyMap<Doh11Affordance['kind'], number> {
  const counts = new Map<Doh11Affordance['kind'], number>()
  for (const row of CONTROL_MATRIX) {
    for (const role of roles) {
      const kind = doh11Affordance(row, role).kind
      counts.set(kind, (counts.get(kind) ?? 0) + 1)
    }
  }
  return counts
}

/**
 * WHO REACHES THIS MODULE'S ROUTE — the shared rule over this module's own
 * matrix, never a hand-written rail and never catalogue B's cell.
 *
 * It answers the Tenant Admin, the Quality Manager and the Read-only Auditor.
 * Catalogue B's row for the audit log explorer names the same three at L48114,
 * and the Supervisor is absent from both — which is the fourth locator of
 * `DEC-AUDITSUP-001` rather than a restatement of the matrix. The unit suite
 * compares the two so neither can drift.
 *
 * BOTH CLAUSES FIRE ON THE SUPERVISOR AND ON THE WORKER, and it is measured
 * rather than assumed: each holds nothing on any row (clause one) AND reads
 * `Unavailable` on both read rows (clause two).
 */
export function doh11RolesReaching(): readonly TenantRoleId[] {
  return rolesReachingByMatrix(CONTROL_MATRIX, cellStatus)
}

/* ==================================================================== *
 * THE READ-SCOPE SELECTOR — AC-30D-105, and it is a READ concern.
 * ==================================================================== */

/**
 * One audit event as the screen holds it BEFORE the selector runs.
 * `resourceTenant` is the tenant that owns the object the event references —
 * the field stage two exists to check.
 */
export interface AuditEventReference {
  readonly eventId: string
  readonly eventClass: AuditEventClassId
  readonly resourceTenant: TenantId
  /** `SB-AUD-01`'s plain sentence for the event. Never a content dump. */
  readonly sentence: string
  readonly sourceRef: string
}

/**
 * Stage one's answer: which event classes this reader's own cell licences,
 * and which row said so.
 */
export interface AuditReadLicence {
  readonly kind: 'full' | 'scoped' | 'none'
  /** The permitted classes. Empty on `none`. */
  readonly classes: readonly AuditEventClassId[]
  /** The row of this module's matrix that answered. */
  readonly rowId: Doh11RowId
  readonly rowRef: string
  /** The scope line the storyboard puts above the table, for this reader. */
  readonly statement: string
}

const ALL_CLASSES: readonly AuditEventClassId[] = AUDIT_TAXONOMY.map((c) => c.id)
const SUMMARY_AND_RUN_STATE: readonly AuditEventClassId[] = AUDIT_TAXONOMY.filter(
  (c) => c.inQualityManagerScope,
).map((c) => c.id)

/**
 * STAGE ONE — THE LICENCE, AND IT IS THE READER'S OWN CELL.
 *
 * The full-log row first, then the scoped row. Both are read off the matrix;
 * neither is a role list written here. That ordering is what produces three
 * different answers from two rows without a role comparison anywhere:
 *
 *   Tenant Admin and Read-only Auditor  full-log cell is `Read-only`  → full
 *   Quality Manager                     full-log cell prohibits, and the
 *                                       scoped row grants it            → scoped
 *   Supervisor and Worker               `Unavailable` on both           → none
 *
 * THE DISABLED RENDERING IS NOT A LICENCE, and that is the point of asking
 * the cells rather than the affordance. The Quality Manager's full-log cell
 * renders DISABLED — visible, inoperable, reason named — and grants nothing.
 * What grants is the adjacent row. A selector keyed on "is anything drawn for
 * this role on the full-log row" would read the DISABLED control as a full
 * licence, which is the disclosure this whole file exists to prevent.
 *
 * FORBIDDEN CLASSES ARE EXCLUDED BEFORE THE QUERY, not filtered after it —
 * `AC-30D-403` at L74232, and §30D.4's own numbered workflow says the same at
 * L74186: "The query is bounded to the tenant and to the permitted event
 * classes before execution, so that unauthorised classes are never retrieved
 * and then filtered."
 */
export function auditReadLicence(role: TenantRoleId): AuditReadLicence {
  const fullLog = doh11Row('read-the-full-tenant-audit-log')
  if (cellPermitsRead(fullLog, role)) {
    return {
      kind: 'full',
      classes: ALL_CLASSES,
      rowId: fullLog.id,
      rowRef: fullLog.sourceRef,
      statement: 'You are reading the full tenant audit log.',
    }
  }
  const scoped = doh11Row('read-summary-and-run-state-audit-events')
  if (cellPermitsRead(scoped, role)) {
    return {
      kind: 'scoped',
      classes: SUMMARY_AND_RUN_STATE,
      rowId: scoped.id,
      rowRef: scoped.sourceRef,
      statement: 'You are reading Summary and run-state events.',
    }
  }
  return {
    kind: 'none',
    classes: [],
    rowId: fullLog.id,
    rowRef: fullLog.sourceRef,
    statement:
      'No audit read is offered to this role. Both read rows of this module read `Unavailable`, ' +
      'and the audit log explorer does not admit this role at all.',
  }
}

/**
 * STAGE TWO — THE OBJECT AUTHORISATION, and it is the only thing between a
 * read-permissive cell and a cross-tenant disclosure.
 *
 * `AC-30D-105`, L74029: "Audit reading never bypasses the authorisation of the
 * objects it references." Its paired test `TEST-30D-103` at L74032 asks for a
 * read of an audit event referencing evidence the reader may not view, and
 * asserts the reference discloses no content.
 *
 * THE CEILING TASK 7 REPORTED APPLIES HERE UNCHANGED. A `Read-only` cell is
 * answered by the cell alone, so nothing in stage one ever reaches
 * `evaluateAccess` — correct for a ceiling, and it means TENANT ISOLATION HAS
 * NOT BEEN CHECKED when stage one returns a licence. Stage two asks it of
 * every referenced object, one object at a time, with that object's own
 * tenant.
 *
 * `allowedRoles` is deliberately the reader's own role: the role question was
 * answered in stage one off the matrix row, and re-answering it here from a
 * hand-built list would be a second declaration that could disagree with the
 * first. What stage two adds is everything after the base-role stage — tenant
 * isolation above all, then suspension and lifecycle.
 *
 * WHAT THIS FUNCTION IS, IN ONE SENTENCE: it is the ONLY way an audit event
 * reaches this screen. Nothing renders a reference the selector did not
 * return, so scope is enforced in what the screen READS. A screen that
 * fetched every event and drew fewer would be enforcing scope in what it
 * DREW, which is defect shape 7.
 */
export function readableAuditEvents(
  refs: readonly AuditEventReference[],
  role: TenantRoleId,
  ctx: AccessContext,
): readonly AuditEventReference[] {
  const licence = auditReadLicence(role)
  if (licence.kind === 'none') return []

  const permitted = new Set(licence.classes)
  return refs
    .filter((ref) => permitted.has(ref.eventClass))
    .filter((ref) => permitsRead(auditObjectDecision(ref, role, ctx)))
}

/**
 * Stage two for ONE reference, exported so the screen can name the refusal
 * beside a reference it did not get and so the suite can assert the decision
 * rather than the filtered list. The action string carries the class, so an
 * audit row for the refusal names what was asked for.
 */
export function auditObjectDecision(
  ref: AuditEventReference,
  role: TenantRoleId,
  ctx: AccessContext,
): PermissionDecision {
  return evaluateAccess(
    {
      action: `READ_AUDIT_EVENT/${ref.eventClass}`,
      allowedRoles: [role],
      resourceTenant: ref.resourceTenant,
      sourceRefs: [ref.sourceRef, 'L74029'],
    },
    ctx,
  )
}
