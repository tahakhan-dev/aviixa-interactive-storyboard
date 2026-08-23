import type { RoleId } from '@/domain/roles'
import { surfaceById } from '@/domain/surfaces'
import type { TenantRoleId } from '../../../../../app/hub/HubShell'
import { routeBySurface, routesForRole } from '@/routes/definitions'
import { cellStatus, rolesReachingByMatrix, type ControlStatus } from '@/surfaces/doh/modules'
import { writeAllowed, writeClassNote, type TenantWriteState } from '@/surfaces/doh/tenant-state'
import {
  CONTROL_MATRIX,
  PREFERENCE_SEVERITY_LABEL,
  categoriesInGroup,
  preferenceLevelFor,
  preferenceRow,
  type Doh10Row,
  type PreferenceCategory,
  type PreferenceGroupId,
} from './matrix'

/**
 * MOD-DOH-10's two rendering rules, decided once and read by the screen.
 *
 * ── RULE ONE: THE TWELVE MATRIX ROWS ──────────────────────────────────────
 * The order of the questions is the rule, and it is slice 5's order with one
 * question this card adds:
 *
 * 1. **Does this persona reach this surface at all?** D11, read out of the
 *    route registry. The Worker holds no Hub route.
 * 2. **Is this cell's act met on this screen?** `metByRole`, per CELL rather
 *    than per row, because rows 2, 5 and 11 need three different answers in
 *    three columns of one row. See `./matrix`.
 * 3. **Is a permissive token closed by the tenant state right now?** Row 1
 *    only: L28689's policy edit is a configuration edit.
 * 4. **Only now, the token.**
 *
 * Questions 1 and 2 are separate on purpose and they do not collapse. The
 * Worker fails 1 on every row; on row 11 it ALSO has a named other surface,
 * and a fold that stopped at 1 would print "the Hub admits no Worker" over a
 * cell whose act the Worker really performs, on the Frontline inbox. So 2
 * runs first for a cell that names somewhere, and 1 answers the rest.
 *
 * ── NO `read-only` ARM AND NO `disabled` ARM ──────────────────────────────
 * `Read-only` occurs in exactly one cell of this card (L28699) and every one
 * of the twelve acts is a write, so the token cannot mean STATE-06 here — the
 * argument and its two acceptance criteria are in `./matrix`. The arm is
 * therefore absent from the union, and `_noReadOnlyArm` below makes adding it
 * a compile error rather than a review note. `disabled` is absent for the
 * deferral ruling every Hub module carries: a capability that is refused
 * always, or met elsewhere, or does not exist, renders as no control plus a
 * stated line — never greyed out, because greyed out promises a later.
 *
 * ── RULE TWO: THE PREFERENCE GROUPS ──────────────────────────────────────
 * `preferenceAffordance` folds one category and one viewer into either a
 * locked control or an operable email toggle. It returns the LockedControl
 * payload rather than a component, so this file holds no JSX and the screen
 * holds no policy. Three inputs decide it, in this order:
 *
 * 1. the category's group — Always sent and Protected are locked by the
 *    matrix columns SB-PREF-01 requires drawn (see `./matrix`);
 * 2. the viewer's own write standing — the Read-only Auditor holds `Allowed`
 *    on rows 2 and 5 and two acceptance criteria say it renders no write
 *    control anywhere in the Hub, so its Configurable toggle is locked too,
 *    with both criteria named;
 * 3. the preference matrix's own condition on the email cell, which is what
 *    `remains` is built from rather than a sentence written here.
 */

export type Doh10Affordance =
  /** Enabled. The cell's conditions, where it has any, ride along. */
  | { readonly kind: 'control'; readonly label: string; readonly conditions: string }
  /** Nothing drawn, and the reason printed where the control would be. */
  | { readonly kind: 'absent'; readonly reason: string }
  /** The act is this cell's and it happens on a surface the source names. */
  | {
      readonly kind: 'cross-surface'
      readonly reason: string
      readonly performedOn: string
      readonly screen: string
      readonly note: string
      readonly linkHref: string | null
      readonly linkLabel: string | null
    }
  /** Granted, and the source names no screen on any surface that draws it. */
  | { readonly kind: 'no-screen-named'; readonly reason: string; readonly note: string }

type NoReadOnlyArm = Extract<Doh10Affordance, { kind: 'read-only' }> extends never ? true : never
const _noReadOnlyArm: NoReadOnlyArm = true
void _noReadOnlyArm

type NoDisabledArm = Extract<Doh10Affordance, { kind: 'disabled' }> extends never ? true : never
const _noDisabledArm: NoDisabledArm = true
void _noDisabledArm

/** D11 asked at the registry, not restated. `HubShell` asks the same thing. */
function reachesThisSurface(role: RoleId): boolean {
  const hub = routeBySurface('SURF-DOH')
  return routesForRole(role).some((r) => r.id === hub.id)
}

const HOLDS_A_CONTROL: readonly ControlStatus[] = ['allowed', 'allowed-with-conditions']

/**
 * The permanent cause behind the one `Read-only` cell and behind the two
 * grants the same two criteria refuse. One string, because it is one pair of
 * acceptance criteria and a second copy is how one of two screens quietly
 * stops naming the second criterion.
 */
export const READONLY_AUDITOR_WRITES_NOTHING =
  'AC-AUTH-003 (L10426): the Read-only Auditor "holds no write capability anywhere and no Client Command Center access at all". AC-DOH-011-2 (L25695): a Read-only Auditor session "renders no write control anywhere in the Hub, including in the tenant administration area." So this is not withheld for now and no control is drawn disabled, which would read as a state that could change.'

export function doh10Affordance(
  row: Doh10Row,
  role: TenantRoleId,
  tenantState: TenantWriteState = 'active',
): Doh10Affordance {
  const status = cellStatus(row, role)
  const met = row.metByRole[role]

  // 2 before 1, for a cell that names somewhere. A cell met elsewhere is met
  // elsewhere whether or not this surface admits the viewer.
  if (met.kind === 'other-surface') {
    const target = routeBySurface(met.surface)
    const admits = routesForRole(role).some((r) => r.id === target.id)
    const surfaceName = surfaceById(met.surface).name
    return {
      kind: 'cross-surface',
      reason: row.detail[role],
      performedOn: surfaceName,
      screen: met.screen,
      note: met.note,
      linkHref: admits ? target.pathname : null,
      linkLabel: admits ? `Open the ${surfaceName}` : null,
    }
  }

  if (met.kind === 'no-screen-named' && HOLDS_A_CONTROL.includes(status)) {
    return { kind: 'no-screen-named', reason: row.detail[role], note: met.note }
  }

  // 1. D11, before the token.
  if (!reachesThisSurface(role)) {
    return {
      kind: 'absent',
      reason: `${row.detail[role]} The route registry admits no Worker to the Delivery Operations Hub (D11), so nothing on this screen is withheld from this role — the screen is not offered at all.`,
    }
  }

  // 3. A permissive token the tenant state closes. Row 1 only.
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

  // 4. The token, last. There is no `read-only` arm to fall into: the one
  //    cell carrying that token is a write, and it refuses permanently.
  switch (status) {
    case 'allowed':
    case 'allowed-with-conditions':
      return { kind: 'control', label: row.control, conditions: row.detail[role] }
    case 'read-only':
      return { kind: 'absent', reason: `${row.detail[role]} ${READONLY_AUDITOR_WRITES_NOTHING}` }
    case 'unavailable':
    case 'not-applicable':
    case 'explicitly-prohibited':
      return { kind: 'absent', reason: row.detail[role] }
  }
}

/**
 * Every kind this card produces over every row, role and tenant state.
 * Exported because "no control is ever drawn for X" is a claim about a walk,
 * and a claim about never is worth what the walk behind it covers.
 */
export function doh10AffordanceKinds(
  roles: readonly TenantRoleId[],
  states: readonly TenantWriteState[],
): ReadonlySet<Doh10Affordance['kind']> {
  const kinds = new Set<Doh10Affordance['kind']>()
  for (const row of CONTROL_MATRIX) {
    for (const role of roles) {
      for (const state of states) kinds.add(doh10Affordance(row, role, state).kind)
    }
  }
  return kinds
}

/**
 * WHO REACHES THIS MODULE'S ROUTE, by the shared rule over this module's own
 * matrix. No cell on this card carries `Unavailable`, so clause two never
 * fires and the answer is clause one alone: rows 2 and 5 are `Allowed` for
 * all five, so the rule returns ALL FIVE TENANT ROLES — the Worker included.
 *
 * THAT DISAGREES WITH D11 AND THE DISAGREEMENT IS THE POINT. The route
 * registry admits no Worker to the Hub, so `HubShell` withholds this route
 * from the one role the matrix rule admits. The two are not asking the same
 * question: the matrix asks whether this module's screen offers the role
 * anything, and the registry asks whether the role opens the surface at all.
 * Both answers are correct and this module is where they visibly differ.
 *
 * Nothing here is reconciled by narrowing either side. The screen states it,
 * `DOH_10_UNSCREENED_GRANTS` in `./matrix` measures the two cells it turns
 * on, and the module is not registered in `DOH_MODULES` by this task in any
 * case — see the report.
 */
export function doh10RolesReaching(): readonly TenantRoleId[] {
  return rolesReachingByMatrix(CONTROL_MATRIX, cellStatus)
}

/* ==================================================================== *
 * RULE TWO — ONE PREFERENCE CATEGORY, ONE VIEWER.
 * ==================================================================== */

/** Exactly `LockedControlProps`, structurally, so the screen can spread it. */
export interface LockedPayload {
  readonly controlId: string
  readonly label: string
  readonly settingValue: string
  readonly reason: string
  readonly remains: string | null
}

export type PreferenceAffordance =
  | { readonly kind: 'locked'; readonly locked: LockedPayload }
  | {
      readonly kind: 'email-toggle'
      readonly label: string
      /** The matrix cell that permits it, verbatim. Printed beside it. */
      readonly condition: string
      /** The in-app half, which no control can reach. */
      readonly inAppNote: string
    }

/**
 * The DOM-safe, register-qualified control id.
 *
 * `LockedControl.controlId` is a bare `string` and its own documentation
 * offers `NOTIF-059` as the example — which is precisely the unqualified
 * `NOTIF-*` literal `@/registry/signals` makes impossible to hold, because
 * both registers number from `NOTIF-001` and agree on none of the twenty-five
 * overlapping names. Passing the branded key straight through would be
 * correct and would put `#` and `.` in an HTML id. So the id is qualified by
 * hand here, and the fact that the prop cannot require the qualification is a
 * finding rather than a workaround; see the report.
 */
function lockedControlId(category: PreferenceCategory): string {
  return `ch30c2-${category.id}`
}

/**
 * What the reader may still change about a locked category, read out of the
 * 30C.10 matrix row for the viewer's own level rather than written here.
 *
 * This is what makes the matrix load-bearing instead of decorative, and it is
 * why the two locked groups need no second component: `remains` is `null`
 * for Always sent, and for Protected it is the level's own answer on the two
 * columns that are not a prohibition — "May reduce email" and "May change
 * recipient roles". L73704 renders both halves in one sentence for a Tenant
 * Admin: "Containment notifications cannot be turned off. You can change who
 * receives them and reduce email frequency." An individual user gets the
 * first half only, because L73710 prohibits the second — which is also why
 * SB-PREF-01's own phrase for the group is "email frequency options only".
 */
function remainsFor(role: TenantRoleId): string {
  const level = preferenceLevelFor(role)
  const row = preferenceRow(level)
  const email = row.cells['May reduce email']
  const recipients = row.cells['May change recipient roles']
  const parts = [`Email volume: ${email}`, `Recipient roles: ${recipients}`]
  return `What you may still change, from the ${level} row of the 30C.10 matrix (${row.sourceRef}). ${parts.join('. ')}.`
}

const ALWAYS_SENT_REASON =
  'These are required for safety, compliance, or your organisation’s account — SB-PREF-01’s own explanation for this group (L73702). The category is one of the three mandatory families named at L51603, it skips the enablement check entirely and is always eligible (L28706), and no role may disable it (L28682, matrix row L28691).'

const PROTECTED_REASON =
  'Locked for disabling, with email frequency options only (SB-PREF-01, L73702). The category is in the extended non-disableable set enumerated at L73676 — safety-critical, security-critical, qualification, suspension, hold, release and required-approval notifications. That extension is this blueprint’s proposal rather than a Statement of Work fact: DEC-NOTIFPREF-001 holds both readings, and AC-30C-1003 (L73719) is the criterion it ships behind.'

/**
 * ONE category, ONE viewer. Order matters: the group decides first because it
 * is a property of the category, and the viewer's own write standing decides
 * second because it can only ever narrow.
 */
export function preferenceAffordance(
  category: PreferenceCategory,
  role: TenantRoleId,
): PreferenceAffordance {
  const controlId = lockedControlId(category)
  const label = `${category.id} — ${category.name}`

  if (category.group === 'always-sent') {
    return {
      kind: 'locked',
      locked: {
        controlId,
        label,
        settingValue: 'Always sent, both channels',
        reason: ALWAYS_SENT_REASON,
        remains: null,
      },
    }
  }

  if (category.group === 'protected') {
    return {
      kind: 'locked',
      locked: {
        controlId,
        label,
        settingValue: 'On, cannot be switched off',
        reason: PROTECTED_REASON,
        remains: remainsFor(role),
      },
    }
  }

  // Configurable — and the one viewer for whom it is not.
  if (role === 'READONLY_AUDITOR') {
    return {
      kind: 'locked',
      locked: {
        controlId,
        label,
        settingValue: 'On, and not yours to change',
        reason: `The matrix grants this role the preference act — L28690 reads \`Allowed\` for the Read-only Auditor on "Set own channel preferences within policy" — and two acceptance criteria refuse it. ${READONLY_AUDITOR_WRITES_NOTHING} Both readings stand; this build renders the control rather than deleting it, and renders it inoperable rather than live. A client-delegated choice under APP-012, not a claim the source settled it.`,
        remains: null,
      },
    }
  }

  const level = preferenceLevelFor(role)
  const row = preferenceRow(level)
  return {
    kind: 'email-toggle',
    label,
    condition: `${level} (${row.sourceRef}) — May reduce email: ${row.cells['May reduce email']}. Severity is a ${PREFERENCE_SEVERITY_LABEL.classification} under ${PREFERENCE_SEVERITY_LABEL.decision}, so the condition’s "Critical categories" selects by a value the client has not ratified.`,
    inAppNote:
      'The in-app item always exists. There is no control for it at any level, because the platform "validates that in-app remains enabled, which it always does because the control does not exist" (L73684).',
  }
}

/**
 * Which keys a viewer may actually toggle. The screen's handler is guarded on
 * this rather than on a group name, so the locked groups cannot be reached
 * from a call site that has a key and a good intention. Returns the branded
 * keys, so a bare `NOTIF-*` literal cannot be compared against it.
 */
export function togglableKeysFor(role: TenantRoleId): readonly string[] {
  return categoriesInGroup('configurable')
    .filter((c) => preferenceAffordance(c, role).kind === 'email-toggle')
    .map((c) => c.key)
}

/**
 * Every affordance kind the preference fold produces, per group and per role.
 * Exported for the same reason as `doh10AffordanceKinds`: the claim is that
 * two of the three groups NEVER yield a toggle, and that only a walk can show.
 */
export function preferenceAffordanceKinds(
  roles: readonly TenantRoleId[],
): ReadonlyMap<PreferenceGroupId, ReadonlySet<PreferenceAffordance['kind']>> {
  const out = new Map<PreferenceGroupId, Set<PreferenceAffordance['kind']>>()
  for (const group of ['always-sent', 'protected', 'configurable'] as const) {
    const kinds = new Set<PreferenceAffordance['kind']>()
    for (const category of categoriesInGroup(group)) {
      for (const role of roles) kinds.add(preferenceAffordance(category, role).kind)
    }
    out.set(group, kinds)
  }
  return out
}
