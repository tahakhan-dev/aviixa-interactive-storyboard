import type { RoleId } from '@/domain/roles'
import type { TenantRoleId } from '../../../../../app/hub/HubShell'
import { routeBySurface, routesForRole } from '@/routes/definitions'
import { adjacentAffordance } from '@/surfaces/doh/boundary'
import { cellStatus, rolesReachingByMatrix } from '@/surfaces/doh/modules'
import type { ControlStatus } from '@/surfaces/doh/modules'
import { CONTROL_MATRIX, doh08Row, type Doh08ControlId, type Doh08Row } from './matrix'

/**
 * MOD-DOH-08's rendering rule, decided ONCE and read by the screen.
 *
 * ── THE ORDER OF THE QUESTIONS IS THE WHOLE RULE ──────────────────────────
 * 1. **Is this row this surface's at all?** `surface === 'another-surface'`
 *    wins over every token, including `Allowed`. Row 8 reads `Allowed` for
 *    the Quality Manager at L28307 and the act is Client Command Center
 *    action 4; row 5 reads `Allowed with conditions` and L49578 marks this
 *    surface "mirrors and records; never the trigger". Neither is a control
 *    here.
 * 2. **Does this persona reach this surface at all?** D11, read out of the
 *    route registry rather than re-asserted — the Worker holds no Hub screen,
 *    so every grant in the Worker column is met somewhere else. Asked BEFORE
 *    the token, so row 10's `Allowed with conditions` for the Worker cannot
 *    become a Hub control.
 * 3. **Does this screen carry a control for the row at all?** `noControlHere`
 *    — one row, row 14, whose enabling module this slice reads and does not
 *    build.
 * 4. **Only now, the token.**
 *
 * ── WHY THIS IS NOT `@/ui/**` ─────────────────────────────────────────────
 * "Taking a button off the screen does not stop anyone." Every answer below
 * is a rendering decision derived from a permission fact, so it lives in the
 * surface layer and the screen draws what it returns.
 */

/**
 * `unavailable` ON THE ROLE AXIS MEANS ABSENT, AND THAT IS NOT A SHADE OF
 * `explicitly-prohibited`. A role marked `Explicitly prohibited` OPENS the
 * screen and meets a refusal it can read; a role marked `Unavailable` has no
 * standing on the module in any scope and is not offered the route at all
 * (L10238, and `rolesReachingByMatrix`'s clause two). Both land on `absent`
 * here because both draw nothing — but the REASON differs, and the reason is
 * what the screen prints.
 */
export type Doh08Affordance =
  /** Enabled. The cell's condition, where it has one, rides along. */
  | { readonly kind: 'control'; readonly label: string; readonly conditions: string }
  /** Rendered, and no write path. STATE-06. */
  | { readonly kind: 'read-only'; readonly label: string; readonly reason: string }
  /**
   * A routed prohibition whose target this persona actually holds HERE. The
   * only shape that may draw a disabled control, because it is the only one
   * where a reader is being pointed somewhere real.
   */
  | { readonly kind: 'disabled'; readonly label: string; readonly reason: string }
  /** Nothing is drawn, and the reason is printed where the control would be. */
  | { readonly kind: 'absent'; readonly reason: string }
  /** The act lives on another surface, permanently. Never a control here. */
  | {
      readonly kind: 'cross-surface'
      readonly reason: string
      /** Set only where the route registry actually admits this viewer. */
      readonly linkHref: string | null
      readonly linkLabel: string | null
    }

/**
 * D11 asked at the registry, not restated. `HubShell` asks the same question
 * of the same registry entry; asking it here too is not a second rule, it is
 * the same rule read by the layer that decides what a cell renders.
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
 * `DohBoundaryId`, the eight rows of the §19.1.2 register at L25719-L25726.
 * **Neither of this card's two adjacent capabilities is one of those eight**:
 * the register lists qualification clearance granting (Command Center action
 * 10) and the sync-conflict panel and the Custom Report Builder, and it does
 * not list the lot-hold release (action 4) or anomaly reclassification. So
 * there is no `DohBoundaryId` to pass and no `CrossSurfaceStatementModel` to
 * build.
 *
 * `adjacentAffordance` already anticipates exactly this — its `boundary` field
 * is optional and it returns `{ kind: 'cross-surface', boundary: null }` for a
 * row "adjacent to something the register does not list". What has no home is
 * the RENDERING of that answer. This function is that home, for this module,
 * and the gap is reported upward rather than patched into a wave-0 file.
 *
 * The link discipline is the same one `crossSurfaceStatement` applies and is
 * the reason it is checked rather than asserted: a routing pointer reads as a
 * verified fact, so the link renders only where `@/routes/definitions` admits
 * this viewer to the target surface, and collapses to a plain statement where
 * it does not.
 */
function crossSurface(row: Doh08Row, role: TenantRoleId): Doh08Affordance {
  const target = routeBySurface('SURF-CC')
  const admits = routesForRole(role).some((r) => r.id === target.id)
  return {
    kind: 'cross-surface',
    reason: row.detail[role],
    linkHref: admits ? target.pathname : null,
    linkLabel: admits ? 'Open in the Client Command Center' : null,
  }
}

/**
 * ONE cell's affordance. Handed the row and the role; computes no permission
 * of its own beyond reading the cell the matrix already states.
 */
export function doh08Affordance(row: Doh08Row, role: TenantRoleId): Doh08Affordance {
  const status = cellStatus(row, role)

  // 1. Classification first. `adjacentAffordance` is handed the token and
  //    ignores it, which is the point: a fold that never saw the token could
  //    not be shown to disregard it.
  if (adjacentAffordance(row, status).kind === 'cross-surface') {
    return crossSurface(row, role)
  }

  // 2. D11, before the token, so a grant in the Worker column cannot become a
  //    Hub control by being permissive.
  if (!reachesThisSurface(role)) {
    return {
      kind: 'absent',
      reason: `${row.detail[role]} The route registry admits no Worker to the Delivery Operations Hub (D11), so this cell is met on another surface or not at all — it is not withheld here.`,
    }
  }

  // 3. A permissive token on a row this screen carries no control for.
  if (row.noControlHere !== null && HOLDS_A_CONTROL.includes(status)) {
    return { kind: 'absent', reason: `${row.detail[role]} ${row.noControlHere}` }
  }

  // 4. The token, last.
  switch (status) {
    case 'allowed':
    case 'allowed-with-conditions':
      return { kind: 'control', label: row.control, conditions: row.detail[role] }
    case 'read-only':
      return { kind: 'read-only', label: row.control, reason: row.detail[role] }
    case 'unavailable':
      return { kind: 'absent', reason: row.detail[role] }
    case 'not-applicable':
      return { kind: 'absent', reason: row.detail[role] }
    case 'explicitly-prohibited': {
      const routed = row.routedTo[role]
      if (routed === null) return { kind: 'absent', reason: row.detail[role] }
      // THE POINTER IS CHECKED, NEVER ASSERTED. A disabled control implies a
      // route that is open; where the target does not actually give this
      // persona a control HERE, the prohibition has nowhere to send anyone and
      // collapses back to ABSENT.
      const target = doh08Affordance(doh08Row(routed), role)
      if (target.kind !== 'control') return { kind: 'absent', reason: row.detail[role] }
      return {
        kind: 'disabled',
        label: row.control,
        reason: `${row.detail[role]} ${target.label} is the route open to you.`,
      }
    }
  }
}

/**
 * Every `routedTo` pointer on the card, with the answer the fold gives it.
 * Exported because a routing pointer nothing indexes is forbidden — a reviewer
 * reads one as a verified fact — and the unit suite walks this rather than
 * trusting the fold to have been called.
 */
export interface Doh08RoutedPointer {
  readonly from: Doh08ControlId
  readonly role: TenantRoleId
  readonly to: Doh08ControlId
  readonly resolvesTo: Doh08Affordance['kind']
}

export function doh08RoutedPointers(
  roles: readonly TenantRoleId[],
): readonly Doh08RoutedPointer[] {
  const out: Doh08RoutedPointer[] = []
  for (const row of CONTROL_MATRIX) {
    for (const role of roles) {
      const to = row.routedTo[role]
      if (to === null) continue
      out.push({ from: row.id, role, to, resolvesTo: doh08Affordance(row, role).kind })
    }
  }
  return out
}

/**
 * WHO REACHES THIS MODULE'S ROUTE — the shared rule over this module's own
 * matrix, never a hand-written rail and never catalogue B's cell.
 *
 * It answers {Quality Manager, Read-only Auditor}, and the two clauses that
 * produce it are worth naming because only one of them does any work here:
 * every column holds something on some screen row, so clause one is not what
 * narrows this; row 2 at L28301 marks the Tenant Admin, the Supervisor and the
 * Worker `Unavailable` on the review queue and clause two withholds all three,
 * and row 1 withholds the Worker again.
 *
 * THE CLASSIFICATION DOES NOT MOVE THE ANSWER, WHICH IS WORTH PROVING RATHER
 * THAN ASSUMING. Rows 5 and 8 are the two `another-surface` rows and neither
 * carries `unavailable` in any column, so reclassifying them back to `screen`
 * produces the same reach set. The unit suite measures that: the classification
 * is load-bearing for what RENDERS and is not smuggling a reach decision.
 */
export function doh08RolesReaching(): readonly TenantRoleId[] {
  return rolesReachingByMatrix(CONTROL_MATRIX, cellStatus)
}
