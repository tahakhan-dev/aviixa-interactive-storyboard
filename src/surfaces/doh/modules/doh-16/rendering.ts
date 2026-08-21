import type { RoleId } from '@/domain/roles'
import type { TenantRoleId } from '../../../../../app/hub/HubShell'
import { routeBySurface, routesForRole } from '@/routes/definitions'
import { cellStatus, rolesReachingByMatrix, type ControlStatus } from '@/surfaces/doh/modules'
import {
  jobOwnerGate,
  type JobOwnerContradiction,
  type JobOwnerGatedRowId,
  type JobOwnerVerdict,
} from '@/surfaces/doh/job-owner'
import { CONTROL_MATRIX, type Doh16Row, type Doh16RowId } from './matrix'
import {
  flaggedJob,
  lanesOf,
  scopeVerdict,
  type PairedJobs,
  type ScopeVerdict,
  type ViewerScope,
} from './pairing'

/**
 * `MOD-DOH-16`'s rendering rule, decided ONCE and read by the screen.
 *
 * ── THE ORDER OF THE QUESTIONS IS THE WHOLE RULE ──────────────────────────
 * Wave 1's order, applied as an order of QUESTIONS rather than copied as a
 * list of branches:
 *
 * 1. **Is this row this surface's at all?** The row's classification wins
 *    over every token, including `Allowed`. No row on this card is
 *    `another-surface` or `chrome` today — all six are acts of this screen —
 *    but the question is still asked FIRST, because asking it last is how a
 *    permissive token on a row that belongs elsewhere becomes a control
 *    here. The unit suite reclassifies a row and watches the answer move, so
 *    the branch is measured rather than decorative.
 * 2. **Does this persona reach this surface at all?** D11, read out of the
 *    route registry rather than re-asserted. The Worker holds no Hub screen.
 *    Asked BEFORE the token so that no cell in the Worker column can become
 *    a Hub control by being permissive — and on this card the Worker's own
 *    row 3 cell is `Unavailable`, so the two agree; they are still asked in
 *    this order, because agreeing today is not the same as being the same
 *    question.
 * 3. **Does this screen carry a control for the row at all?** Row 4 is the
 *    only one: `FUNC-DOH-16-2.1.1` (L29658) gives receipt no actor, so no
 *    persona can be offered a control for it however permissive the cell.
 * 4. **Only now, the token** — and for the two owner-conditioned rows, the
 *    Job's owner field, read per Job through the shared predicate.
 *
 * ── NO `disabled` MEMBER, AND THAT IS THE DEFERRAL RULING AS A SHAPE ───────
 * Wave 1's ruling: a deferred or non-existent capability renders as no
 * control plus a stated line where it would sit — not disabled, not empty.
 * `Doh16Affordance` below has four members and none of them is `disabled`,
 * so the ruling cannot be broken by a screen that forgets it. There is no
 * `routedTo` on this card for a disabled control to point at either, and
 * `./matrix` gives the reasoning for that rather than leaving it as silence.
 *
 * ── WHY THIS IS NOT `@/ui/**` ─────────────────────────────────────────────
 * Every answer below is a rendering decision derived from a permission fact,
 * so it lives in the surface layer and the screen draws what it returns.
 */

export type Doh16Affordance =
  /** Enabled. The cell's condition, where it has one, rides along. */
  | { readonly kind: 'control'; readonly label: string; readonly conditions: string }
  /** Rendered, and no write path. STATE-06. */
  | { readonly kind: 'read-only'; readonly label: string; readonly reason: string }
  /** Nothing is drawn, and the reason is printed where the control would sit. */
  | { readonly kind: 'absent'; readonly reason: string }
  /**
   * The source answers this cell TWICE and the two answers cannot both hold.
   *
   * There is deliberately no `label`, no `conditions` and no single cell on
   * this member. A screen handed one of these cannot draw it as one answer
   * without first choosing, in its own file, which reading to draw — which is
   * the same mechanism `JobOwnerGateResult` uses one layer down, carried up
   * rather than quietly collapsed on the way.
   */
  | {
      readonly kind: 'disclosed'
      readonly contradiction: JobOwnerContradiction
      readonly verdict: JobOwnerVerdict
    }

/** The viewer, and the pair being looked at. Both are required. */
export interface Doh16Bearing {
  readonly pair: PairedJobs
  readonly scope: ViewerScope
}

/**
 * The two rows whose every cell is conditioned on the Job's owner field, and
 * the ids the SHARED predicate registers them under. This map is the only
 * place the two vocabularies meet; it is total over its own keys, so a third
 * owner-conditioned row cannot be added to `./matrix` and silently skip the
 * predicate.
 */
const OWNER_GATED: Readonly<Partial<Record<Doh16RowId, JobOwnerGatedRowId>>> = {
  'receive-the-review-flag': 'mod-doh-16-row-4-receive-the-review-flag',
  'act-on-the-review-flag': 'mod-doh-16-row-5-act-on-the-review-flag',
}

const HOLDS_A_CONTROL: readonly ControlStatus[] = ['allowed', 'allowed-with-conditions']

/**
 * D11 asked at the registry, not restated. `HubShell` asks the same question
 * of the same registry entry; asking it here too is not a second rule, it is
 * the same rule read by the layer that decides what a cell renders.
 */
function reachesThisSurface(role: RoleId): boolean {
  const hub = routeBySurface('SURF-DOH')
  return routesForRole(role).some((r) => r.id === hub.id)
}

/** Where a row's capability is NOT met on this screen, in that row's own terms. */
const NOT_THIS_SCREEN: Readonly<Record<'chrome' | 'another-surface', string>> = {
  chrome:
    'The Hub shell draws this on every route, above the content and outside this module’s answer, so it is not a control this screen carries.',
  'another-surface':
    'This capability is met somewhere other than a Hub screen. This screen can describe it and never offers a control for it.',
}

/**
 * Scope over BOTH Jobs, which is what rows 1 and 2 require in the source's
 * own words. Returned as the two verdicts rather than a boolean so the
 * refusal can name WHICH Job is out of scope — a Supervisor told only that
 * they lack scope learns nothing they can act on.
 */
export function bothJobsInScope(
  pair: PairedJobs,
  scope: ViewerScope,
): readonly [ScopeVerdict, ScopeVerdict] {
  const [a, b] = lanesOf(pair)
  return [scopeVerdict(a.record, scope), scopeVerdict(b.record, scope)]
}

/**
 * ONE cell's affordance. Handed the row, the role and the pair; computes no
 * permission of its own beyond reading the cell the matrix already states and
 * the two fields — the Job's owner field and the Job's parent node — the
 * source's own conditions name.
 */
export function doh16Affordance(
  row: Doh16Row,
  role: TenantRoleId,
  ctx: Doh16Bearing,
): Doh16Affordance {
  const status = cellStatus(row, role)
  const detail = row.detail[role]

  // 1. Classification first, ahead of every token.
  if (row.surface !== 'screen') {
    return { kind: 'absent', reason: `${detail} ${NOT_THIS_SCREEN[row.surface]}` }
  }

  // 2. D11, before the token, so a grant in the Worker column cannot become a
  //    Hub control by being permissive.
  if (!reachesThisSurface(role)) {
    return {
      kind: 'absent',
      reason: `${detail} The route registry admits no Worker to the Delivery Operations Hub (D11), so this cell is met on another surface or not at all — it is not withheld here.`,
    }
  }

  // 3. A permissive token on a row this screen carries no control for.
  if (row.noControlHere !== null && HOLDS_A_CONTROL.includes(status)) {
    return { kind: 'absent', reason: `${detail} ${row.noControlHere}` }
  }

  // 4. The token, last — through the owner field where the source conditions
  //    the cell on it.
  const gatedRowId = OWNER_GATED[row.id]
  if (gatedRowId !== undefined) return ownerConditioned(row, role, ctx, status, gatedRowId)

  switch (status) {
    case 'allowed':
      return { kind: 'control', label: row.control, conditions: detail }
    case 'allowed-with-conditions':
      return scopeConditioned(row, ctx, detail)
    case 'read-only':
      return { kind: 'read-only', label: row.control, reason: detail }
    case 'unavailable':
    case 'not-applicable':
      return { kind: 'absent', reason: detail }
    case 'explicitly-prohibited':
      // The stated line where the control would sit. `absence` is set only on
      // row 6, whose capability exists nowhere at all.
      return { kind: 'absent', reason: row.absence === null ? detail : `${detail} ${row.absence}` }
  }
}

/**
 * Rows 1 and 2: `Allowed with conditions` — must hold scope over both Jobs.
 *
 * The refusal is ABSENT rather than disabled, and the reason names the Job.
 * A disabled control would say the person lacks the capability; what they
 * lack is scope over one specific Job, which is a different sentence and the
 * only one that tells them what to change.
 */
function scopeConditioned(row: Doh16Row, ctx: Doh16Bearing, detail: string): Doh16Affordance {
  const [a, b] = bothJobsInScope(ctx.pair, ctx.scope)
  if (a.held && b.held) return { kind: 'control', label: row.control, conditions: detail }
  const missing = [a, b].filter((v) => !v.held)
  return {
    kind: 'absent',
    reason: `${detail} ${missing.map((v) => v.reason).join(' ')}`,
  }
}

/**
 * Rows 4 and 5, through the ONE shared predicate.
 *
 * THE JOB IS NAMED BEFORE ANYTHING IS ANSWERED. `jobOwnerGate` cannot be
 * reached without a Job, which is why no answer this function produces can
 * be reused as "this identity is a Job Owner". Where the pair carries no
 * flag there is no Job to name and no act to gate, and that is said in words
 * rather than defaulted to a permissive or a prohibitive token.
 */
function ownerConditioned(
  row: Doh16Row,
  role: TenantRoleId,
  ctx: Doh16Bearing,
  status: ControlStatus,
  gatedRowId: JobOwnerGatedRowId,
): Doh16Affordance {
  const detail = row.detail[role]

  if (status === 'explicitly-prohibited') return { kind: 'absent', reason: detail }

  const flagged = flaggedJob(ctx.pair)
  if (flagged === null) {
    return {
      kind: 'absent',
      reason: `${detail} No paired Job on this pair has been cancelled or materially changed, so no review flag has been raised and there is nothing here to route or to act on.`,
    }
  }

  const gate = jobOwnerGate(gatedRowId, role, flagged.record, ctx.scope.identityId)
  if (gate.kind === 'disclosed') {
    return { kind: 'disclosed', contradiction: gate.contradiction, verdict: gate.verdict }
  }
  if (!gate.verdict.held) return { kind: 'absent', reason: `${detail} ${gate.verdict.reason}` }
  return { kind: 'control', label: row.control, conditions: `${detail} ${gate.verdict.reason}` }
}

/**
 * WHO REACHES THIS MODULE'S ROUTE — the shared rule over this module's own
 * matrix, never a hand-written rail and never catalogue A's "Primary role"
 * cell.
 *
 * It answers {Tenant Admin, Supervisor, Quality Manager, Read-only Auditor},
 * and only ONE clause does any work: row 3 (L29615) marks the Worker
 * `Unavailable`, and clause two withholds. Clause one narrows nothing here,
 * because all six rows are this screen's own.
 *
 * DERIVED IN-MODULE AND NOT REGISTERED, WHICH IS KNOWN DEBT. `MOD-DOH-16` is
 * still in `DOH_OUT_OF_SLICE_MODULES`, so the module rail offers this route
 * to nobody and `registries/generated/doh/module-reach.json` carries no entry
 * for it. Registering it means editing `src/surfaces/doh/modules.ts`, which
 * concurrent module tasks are consuming. What is NOT done in its place is a
 * hand-written rail: the answer below comes from `rolesReachingByMatrix`, the
 * same one implementation every registered module's entry is generated from,
 * so when the module is registered the generated value and this one are the
 * same rule applied to the same rows.
 */
export function doh16RolesReaching(): readonly TenantRoleId[] {
  return rolesReachingByMatrix(CONTROL_MATRIX, cellStatus)
}
