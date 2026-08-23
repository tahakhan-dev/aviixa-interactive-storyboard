import type { RoleId } from '@/domain/roles'
import type { TenantRoleId } from '../../../../../app/hub/HubShell'
import { routeBySurface, routeOpenDecisionFor, routesForRole } from '@/routes/definitions'
import {
  adjacentAffordance,
  crossSurfaceStatement,
  type CrossSurfaceStatementModel,
} from '@/surfaces/doh/boundary'
import { cellStatus, rolesReachingByMatrix } from '@/surfaces/doh/modules'
import type { OffRegisterCrossSurface } from '@/ui/doh/CrossSurfaceStatement'
import { MOD_DOH_18_MATRIX, type Doh18Row } from './matrix'

/**
 * `MOD-DOH-18`'s rendering rule, decided once and read by the component.
 *
 * ── THE ORDER OF THE QUESTIONS IS THE RULE ────────────────────────────────
 * 1. **Is this row this surface's at all?** `surface === 'another-surface'`
 *    wins over every token, including a bare `Allowed`. Two of the four
 *    adjacent rows carry one, which is exactly why the classification is
 *    asked first and `adjacentAffordance` is handed the token and ignores it.
 * 2. **Does this persona reach this surface at all?** Read out of the route
 *    registry rather than restated, so a permissive cell in a column that
 *    holds no Hub route cannot become a Hub control.
 * 3. **Only now, the token.** On this card it produces exactly three
 *    `control` answers, all on row 1 — the query, which is the one act this
 *    surface both owns and grants. The other three rows it owns refuse every
 *    column. Whether an act is OFFERED is a separate question from whether it
 *    is held, and this module has no screen on which to offer one: the
 *    component states each affordance and draws no interactive control.
 *
 * ── THERE IS NO `disabled` ARM, AND THE ABSENCE IS THE RULING ─────────────
 * A disabled control is only honest where a reader is being pointed at
 * something they actually hold HERE. Every refusal on this card is either a
 * capability that exists on no surface at V1 (rows 5, 6, 8) or an act on
 * another surface (rows 2, 3, 4, 7), and neither points anywhere on this
 * screen. So no row carries a `routedTo` pointer and no branch can draw a
 * disabled control — which is what `CrossSurfaceStatement` also refuses, for
 * the same reason: a disabled control implies a condition that could become
 * true, and this boundary does not move.
 */

export type Doh18Affordance =
  /** Rendered, no write path. The query row for the Read-only Auditor. */
  | { readonly kind: 'read-only'; readonly label: string; readonly reason: string }
  /** Enabled. The cell's own condition, where it has one, rides along. */
  | { readonly kind: 'control'; readonly label: string; readonly conditions: string }
  /** Nothing drawn, and the reason printed where the control would be. */
  | { readonly kind: 'absent'; readonly reason: string }
  /**
   * The act lives on another surface permanently. Carries the model the
   * shared component takes, so the component chooses no wording of its own.
   */
  | {
      readonly kind: 'cross-surface'
      /**
       * The row's own cell, verbatim. `adjacentAffordance` does not correct,
       * downgrade or hide the token: the source says `Allowed` and the matrix
       * goes on saying so, with its own cell text. What is refused is the
       * control, not the transcription.
       */
      readonly reason: string
      readonly statement: CrossSurfaceStatementModel | OffRegisterCrossSurface
    }

/**
 * Whether this persona reaches this surface at all, asked at the registry that
 * already answers it. `app/hub/HubShell.tsx` asks the same question of the
 * same entry; asking it here is the same rule read by the layer that decides
 * what a cell renders, not a second rule.
 */
function reachesThisSurface(role: RoleId): boolean {
  const hub = routeBySurface('SURF-DOH')
  return routesForRole(role).some((r) => r.id === hub.id)
}

/**
 * The off-register statement, with its link state CHECKED rather than
 * asserted. A reviewer reads a routing pointer as a verified fact, so the link
 * is drawn only where the route registry admits this viewer to the owning
 * surface, and the third state exists because for one pair the source refuses
 * to answer: drawing no link there would assert the refusal it withholds.
 *
 * The three states are `crossSurfaceStatement`'s own, and this is the second
 * implementation of them. It exists because that function is keyed on a
 * register id and this row deliberately has none; the duplication is reported
 * rather than left for a reader to find.
 */
function offRegisterStatement(row: Doh18Row, role: TenantRoleId): OffRegisterCrossSurface {
  if (row.offRegister === null) {
    throw new Error(
      `${row.id} is classified another-surface, carries no boundary, and carries no ` +
        'off-register statement either; a reader would be shown a boundary claim with nothing behind it',
    )
  }
  const route = routeBySurface('SURF-STU')
  const admits = routesForRole(role).some((r) => r.id === route.id)
  const openDecision = routeOpenDecisionFor('SURF-STU', role)
  const base = {
    boundary: null,
    rowId: row.id,
    capability: row.offRegister.capability,
    owningSurface: 'SURF-STU',
    offRegisterNote: row.offRegister.whyNotOnTheRegister,
    sourceRef: row.sourceRef,
  } as const

  if (admits) {
    return {
      ...base,
      linkState: 'link',
      linkLabel: 'Open in the Standards and Operations Studio',
      linkHref: route.pathname,
      note: row.offRegister.note,
    }
  }
  if (openDecision !== null) {
    return {
      ...base,
      linkState: 'open-decision',
      linkLabel: null,
      linkHref: null,
      note: `${row.offRegister.note} Whether your role opens the Standards and Operations Studio is an open question: ${openDecision.decision}. No link is drawn and none is refused.`,
    }
  }
  return {
    ...base,
    linkState: 'statement',
    linkLabel: null,
    linkHref: null,
    note: `${row.offRegister.note} The Standards and Operations Studio is not a surface your role opens, so no link is drawn to it.`,
  }
}

export function doh18Affordance(row: Doh18Row, role: TenantRoleId): Doh18Affordance {
  const status = cellStatus(row, role)

  // 1. Classification first, and the token is handed in so that disregarding
  //    it is demonstrable rather than merely claimed.
  if (adjacentAffordance(row, status).kind === 'cross-surface') {
    return {
      kind: 'cross-surface',
      reason: row.detail[role],
      statement:
        row.boundary === undefined
          ? offRegisterStatement(row, role)
          : crossSurfaceStatement(row.boundary, role),
    }
  }

  // 2. Reach, before the token.
  if (!reachesThisSurface(role)) {
    return {
      kind: 'absent',
      reason: `${row.detail[role]} The route registry admits no ${role} to the Delivery Operations Hub, so this cell is met on another surface or not at all — it is not withheld here.`,
    }
  }

  // 3. The token, last.
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
 * WHO REACHES THIS MODULE — the shared rule over this module's own matrix.
 *
 * It answers four roles: the Worker is withheld by BOTH clauses on the one
 * screen row that grants anything, holding nothing on it and carrying
 * `Unavailable` there. Reach is not a route here, because catalogue B gives
 * this module no screen; it is which personas the component's matrix has
 * anything to say to.
 *
 * THE CLASSIFICATION DOES NOT MOVE THIS ANSWER, which is worth measuring
 * rather than assuming: the four `another-surface` rows refuse the Worker in
 * every column anyway, so reclassifying all four back to `screen` returns the
 * same four roles. The classification is load-bearing for what RENDERS and is
 * not smuggling a reach decision. The unit suite measures it.
 */
export function doh18RolesReaching(): readonly TenantRoleId[] {
  return rolesReachingByMatrix(MOD_DOH_18_MATRIX, cellStatus)
}

/**
 * Every distinct boundary this card states, in row order. TWO, and the count
 * is what the component renders one statement per: rows 2, 3 and 4 are the
 * same Custom Report Builder boundary and would otherwise draw three identical
 * panels, and row 7 is the off-register Studio one.
 */
export function doh18CrossSurfaceRows(): readonly Doh18Row[] {
  const seen = new Set<string>()
  const out: Doh18Row[] = []
  // Widened to the interface deliberately: `as const satisfies` keeps every
  // row a literal, and a row that omits the optional `boundary` has no such
  // property to read on the literal union.
  const rows: readonly Doh18Row[] = MOD_DOH_18_MATRIX
  for (const row of rows) {
    if (row.surface !== 'another-surface') continue
    const key = row.boundary ?? `off-register:${row.id}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(row)
  }
  return out
}
