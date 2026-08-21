import type { RoleId } from '@/domain/roles'
import { surfaceById } from '@/domain/surfaces'
import type { TenantRoleId } from '../../../../../app/hub/HubShell'
import { routeBySurface, routeOpenDecisionFor, routesForRole } from '@/routes/definitions'
import { adjacentAffordance } from '@/surfaces/doh/boundary'
import { cellStatus, rolesReachingByMatrix } from '@/surfaces/doh/modules'
import type { ControlStatus } from '@/surfaces/doh/modules'
import { writeAllowed, writeClassNote, type TenantWriteState } from '@/surfaces/doh/tenant-state'
import { CONTROL_MATRIX, type Doh19Row } from './matrix'

/**
 * MOD-DOH-19's rendering rule, decided ONCE and read by the screen.
 *
 * ── THE ORDER OF THE QUESTIONS IS THE WHOLE RULE ──────────────────────────
 * Slice 5's order, applied as an order and not as a special case per row:
 *
 * 1. **Is this row this surface's at all?** `surface === 'another-surface'`
 *    wins over every token. Both adjacent rows here happen to refuse in every
 *    column, so the classification changes nothing a reader would SEE on this
 *    card today — and it is still asked first, because a fold that asked the
 *    token first would give the right answer for the wrong reason and would
 *    ship a control the day a permissive token lands on an adjacent row.
 * 2. **Does this persona reach this surface at all?** D11, read out of the
 *    route registry rather than re-asserted. The Worker holds no Hub route.
 *
 *    WHAT THIS BRANCH CAN PROVE TODAY, said plainly rather than implied.
 *    `HubShell` asks the SAME registry question before any child renders, so
 *    on `/hub/parts-registry` the Worker never reaches this fold and this
 *    branch is UNREACHABLE through the screen. The component suite therefore
 *    sweeps the four roles that reach the route and asserts the Worker's
 *    refusal at the shell instead — a sweep of the Worker's affordances would
 *    pass against an empty document and read as evidence. The branch is
 *    exercised by the unit suite, which calls the fold directly, and it is
 *    kept because the fold is the MODULE's answer rather than this route's.
 * 3. **Does a control render for this act at all right now?** On this card
 *    that is the SUSPENSION WRITE CLASS: row 1's `Allowed with conditions`
 *    is a full block in four of the five tenant states. No row on this card
 *    names an act the screen does not carry, so there is no `noControlHere`
 *    field — a field that is null on all eight rows would be a slot for a
 *    future special case, not a rule.
 * 4. **Only now, the token.**
 *
 * ── NO `disabled` MEMBER, AND THAT IS THE POINT ───────────────────────────
 * The deferral ruling: a deferred or non-existent capability renders as no
 * control plus a stated line where it would sit — not a disabled control and
 * not an empty region. `Doh19Affordance` below has four arms and none of them
 * is `disabled`, so the ruling is enforced by the type rather than by review.
 *
 * A disabled control is a promise that something exists and is currently out
 * of reach. Row 2's act is not out of reach — it is somewhere else. Row 6's
 * does not exist anywhere. Row 7's is refused to everyone including the
 * Tenant Admin. Drawing any of the three greyed out tells a reader to come
 * back later for a thing that is never coming.
 *
 * ── NO `routedTo` EITHER, AND IT IS CHECKED RATHER THAN ASSUMED ───────────
 * `routedTo[column]` names a capability IN THIS MATRIX that a persona holds
 * instead. Every alternative on this card is either on another surface (rows
 * 2 and 8) or nowhere at all (rows 6 and 7), and an alternative on another
 * surface is never a `routedTo` — it renders in the cell's own words inside
 * the cross-surface statement. So the field does not exist here, and
 * `doh19AffordanceKinds` measures that no cell ever produces a pointer-shaped
 * rendering.
 */

export type Doh19Affordance =
  /** Enabled. The cell's condition, where it has one, rides along. */
  | { readonly kind: 'control'; readonly label: string; readonly conditions: string }
  /** Rendered, and no write path. STATE-06. */
  | { readonly kind: 'read-only'; readonly label: string; readonly reason: string }
  /** Nothing is drawn, and the reason is printed where the control would be. */
  | { readonly kind: 'absent'; readonly reason: string }
  /** The act is performed on another surface. Never a control here. */
  | {
      readonly kind: 'cross-surface'
      readonly reason: string
      /** The surface the act happens on, by registered name. */
      readonly performedOn: string
      /** True where THIS surface still owns the record. Row 2 only. */
      readonly ownedHere: boolean
      /** The module's own words for the split. */
      readonly note: string
      /** Set only where the route registry actually admits this viewer. */
      readonly linkHref: string | null
      readonly linkLabel: string | null
      /** Set where whether this role opens the target is an OPEN question. */
      readonly openDecision: string | null
    }

/** Compile-time proof of the deferral ruling: adding `disabled` breaks this. */
type NoDisabledArm = Extract<Doh19Affordance, { kind: 'disabled' }> extends never ? true : never
const _noDisabledArm: NoDisabledArm = true
void _noDisabledArm

/**
 * D11 asked at the registry, not restated. `HubShell` asks the same question
 * of the same registry entry.
 */
function reachesThisSurface(role: RoleId): boolean {
  const hub = routeBySurface('SURF-DOH')
  return routesForRole(role).some((r) => r.id === hub.id)
}

const HOLDS_A_CONTROL: readonly ControlStatus[] = ['allowed', 'allowed-with-conditions']

/**
 * WHERE THE CROSS-SURFACE STATEMENT COMES FROM, AND WHY IT IS NOT
 * `@/ui/doh/CrossSurfaceStatement`.
 *
 * That component and `crossSurfaceStatement(id, role)` are keyed on
 * `DohBoundaryId`, the eight §19.1.2 rows at L25719-L25726. Neither of this
 * card's adjacent capabilities is one of the eight — see
 * `DOH_19_REGISTER_GAP` in `./matrix` for why row 2 would not fit even if a
 * row were added for it, since the register's `owningSurface` would assert
 * that the Studio owns a record this surface owns.
 *
 * The three link states are `crossSurfaceStatement`'s own, re-derived here
 * over the same registry rather than approximated: a link where the role
 * opens the target, an open-decision line where the source refuses to say
 * (the Read-only Auditor and `SURF-STU`, `DEC-AUDSTU-001`), and a plain
 * statement otherwise. No tenant role opens `SURF-SA`, so row 8 is always
 * the plain statement.
 */
function crossSurface(row: Doh19Row, role: TenantRoleId): Doh19Affordance {
  const met = row.metElsewhere
  if (met === null) {
    throw new Error(
      `MOD-DOH-19: row "${row.id}" is classified \`another-surface\` and names no surface to send a reader to.`,
    )
  }
  const target = routeBySurface(met.surface)
  const admits = routesForRole(role).some((r) => r.id === target.id)
  const open = routeOpenDecisionFor(met.surface, role)
  return {
    kind: 'cross-surface',
    reason: row.detail[role],
    performedOn: surfaceById(met.surface).name,
    ownedHere: met.ownedHere,
    note: met.note,
    linkHref: admits ? target.pathname : null,
    linkLabel: admits ? `Open the ${surfaceById(met.surface).name}` : null,
    openDecision:
      !admits && open !== null
        ? `Whether your role opens the ${surfaceById(met.surface).name} is an open question: ${open.decision}. No link is drawn and none is refused.`
        : null,
  }
}

/**
 * ONE cell's affordance. Handed the row, the role and the tenant state;
 * computes no permission of its own beyond reading the cell the matrix states
 * and the write class the tenant-state table states.
 */
export function doh19Affordance(
  row: Doh19Row,
  role: TenantRoleId,
  tenantState: TenantWriteState = 'active',
): Doh19Affordance {
  const status = cellStatus(row, role)

  // 1. Classification first. `adjacentAffordance` is handed the token and
  //    ignores it, which is the point.
  if (adjacentAffordance(row, status).kind === 'cross-surface') {
    return crossSurface(row, role)
  }

  // 2. D11, before the token.
  if (!reachesThisSurface(role)) {
    return {
      kind: 'absent',
      reason: `${row.detail[role]} The route registry admits no Worker to the Delivery Operations Hub (D11), so nothing on this screen is withheld from this role — the screen is not offered at all.`,
    }
  }

  // 3. A permissive token the tenant state closes. Row 1 only: L30070 blocks
  //    the upload "in every suspension state as new-part creation", and
  //    `create-part` is already a write class — read, never re-derived.
  if (
    row.writeAction !== null &&
    HOLDS_A_CONTROL.includes(status) &&
    !writeAllowed(tenantState, row.writeAction)
  ) {
    return {
      kind: 'absent',
      reason: `${row.detail[role]} It is blocked right now by the tenant state: ${writeClassNote(tenantState)}`,
    }
  }

  // 4. The token, last.
  switch (status) {
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
 * Every kind this card can produce, over every row, every role and every
 * tenant write state. Exported because the deferral ruling is a claim about
 * what NEVER renders, and a claim about never is only worth what the walk
 * behind it covers. The unit suite asserts the set.
 */
export function doh19AffordanceKinds(
  roles: readonly TenantRoleId[],
  states: readonly TenantWriteState[],
): ReadonlySet<Doh19Affordance['kind']> {
  const kinds = new Set<Doh19Affordance['kind']>()
  for (const row of CONTROL_MATRIX) {
    for (const role of roles) {
      for (const state of states) kinds.add(doh19Affordance(row, role, state).kind)
    }
  }
  return kinds
}

/**
 * WHO REACHES THIS MODULE'S ROUTE — the shared rule over this module's own
 * matrix, never a hand-written rail and never catalogue B's cell.
 *
 * It answers {Tenant Admin, Supervisor, Quality Manager, Read-only Auditor}.
 * Catalogue B's cell for `SCR-DOH-06` (L48100) names TWO of those four, and
 * `DOH_CATALOGUE_B_REACH_NARROWER` in `@/surfaces/doh/screens` already records
 * this screen as the fifth narrowing case with the Quality Manager and the
 * Read-only Auditor as the omitted pair. Re-measured here off the matrix and
 * it agrees; the unit suite compares the two so neither can drift.
 *
 * BOTH CLAUSES FIRE ON THE WORKER AND THAT IS WORTH SAYING RATHER THAN
 * LEAVING IMPLICIT. The Worker holds nothing on any screen row (clause one)
 * AND row 5 marks it `Unavailable` (clause two), so either clause alone would
 * withhold. On this card the two do not disagree, and the suite measures that
 * instead of asserting it.
 *
 * THE CLASSIFICATION DOES NOT MOVE THE ANSWER HERE EITHER. Rows 2 and 8 are
 * the two `another-surface` rows and neither holds a permissive or an
 * `Unavailable` cell, so reclassifying both back to `screen` produces the same
 * four. The classification is load-bearing for what RENDERS, and it is not
 * smuggling a reach decision — measured in the suite, not assumed.
 */
export function doh19RolesReaching(): readonly TenantRoleId[] {
  return rolesReachingByMatrix(CONTROL_MATRIX, cellStatus)
}
