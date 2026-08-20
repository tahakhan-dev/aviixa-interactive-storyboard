/**
 * The SURF-DOH spine, part 1 of 6: the eight slice-4 modules of the
 * Delivery Operations Hub's nineteen-module inventory (`canonicalModuleCount`
 * on `SURF-DOH` in `@/domain/surfaces`). Spec §1.
 *
 * Names are canonical; `SCR-DOH-NN` numbers are annotations only (D1), and a
 * three-digit `SCR-DOH-NNN` literal is forbidden anywhere in the codebase —
 * the two source catalogues collide silently on the same identifier. Every
 * `slug` below is a plain name, never a screen number, for the same reason.
 *
 * THIS FILE ALSO OWNS THE CONTROL-MATRIX VOCABULARY the nine Hub matrices
 * share — the row's surface, the status union, the row shape and the ONE
 * derivation of `rolesReaching`. It owns them because `rolesReaching` is
 * computed FROM the matrices: a rule that lives beside the thing it reads
 * cannot be applied to eight modules and forgotten on the ninth.
 *
 * THE RULE LIVES HERE; THE MATRICES DO NOT REACH IT AT RUNTIME. This file
 * used to import the eight module matrices to run that rule itself, which
 * pointed `src/` at `app/` — the shared contract importing its own
 * consumers — and closed a real value cycle (`HubShell` and two fixtures
 * import back into this file). The cycle was survivable only because
 * `rolesReaching` was a GETTER, deferring each read past module
 * initialisation; an eager read threw. So the rule is now applied ONCE, at
 * build time, by `scripts/build-doh-module-reach.mjs`, which writes it to
 * `registries/generated/doh/module-reach.json`; this file imports that.
 * Nothing under `src/` value-imports `app/` any more, and that generator
 * refuses to write anything if one ever does again. The field is still
 * derived, still cannot drift from the matrices, and is no longer a getter.
 *
 * The devices matrix is absent from the list below because that screen is
 * uncatalogued and claims no module (D4, D5) — it has no route for a rail
 * to offer, and so no reach entry either.
 */
import { rolesInDomain, type RoleId } from '@/domain/roles'
import type { PermissionOutcome } from '@/policy/decision'
import type { TenantRoleId } from '../../../app/hub/HubShell'
import MODULE_REACH from '../../../registries/generated/doh/module-reach.json'

export type DohModuleId =
  | 'MOD-DOH-01'
  | 'MOD-DOH-02'
  | 'MOD-DOH-03'
  | 'MOD-DOH-04'
  | 'MOD-DOH-09'
  | 'MOD-DOH-12'
  | 'MOD-DOH-13'
  | 'MOD-DOH-14'

/* ==================================================================== *
 * THE CONTROL-MATRIX VOCABULARY. One surface union, one status union,
 * one row shape, one derivation — all of them here, all of them read by
 * `app/hub/<module>/fixtures.ts`.
 * ==================================================================== */

/**
 * WHERE THE CAPABILITY A MATRIX ROW NAMES IS MET.
 *
 * THE DEFECT THIS EXISTS FOR. A permission matrix row is not always about
 * the screen that prints it. "See the suspension banner" and "See the
 * support-session banner" are about the Hub CHROME, which every persona
 * meets on every route regardless of what the module rail offers; "Call the
 * inbound business-system integration endpoint" is "not a screen control at
 * all — an outside system calls it"; "Change ladder thresholds" is set in
 * the Super Admin console. Scanning a role's whole column and calling the
 * result "can this role reach this module" merges all three, and a role
 * that holds nothing but a chrome banner reads as a module user.
 *
 * THE THREE, and the line between them:
 *
 * - `screen` — the row names a capability of this module's own screen. It
 *   stays `screen` when the answer is "absent for everyone": a row like
 *   "Create an equipment record" or "Change the 60-day horizon" is still
 *   this screen's own disclosure that it offers nothing. It also stays
 *   `screen` when the Hub screen that renders it belongs to a SIBLING
 *   module — `MOD-DOH-12`'s tier read view is built on `MOD-DOH-01`'s
 *   screen, and it is a Hub screen either way.
 * - `chrome` — the shell draws it on every Hub route, above the content
 *   and outside the rail's answer. A role reaches it whether or not the
 *   rail offers the module, so holding it says nothing about reach.
 * - `another-surface` — the capability IS met, but not on a Hub screen:
 *   the Super Admin platform console, the worker's device, the Client
 *   Command Center, or an outside system calling in. This screen can only
 *   describe it.
 *
 * The reservation is what keeps the third honest: `another-surface` means
 * somebody, somewhere, holds it. A capability that exists NOWHERE is a
 * `screen` row whose every cell refuses.
 */
export type MatrixRowSurface = 'screen' | 'chrome' | 'another-surface'

export const MATRIX_ROW_SURFACES = [
  'screen',
  'chrome',
  'another-surface',
] as const satisfies readonly MatrixRowSurface[]

// Same widening hazard, same fix, as `PERMISSION_OUTCOMES` in
// `@/policy/decision`: `as const satisfies` keeps the members literal, so a
// fourth surface added to the union above and not to the array fails here.
type MissingFromRowSurfaces = Exclude<MatrixRowSurface, (typeof MATRIX_ROW_SURFACES)[number]>
const _rowSurfacesExhaustive: MissingFromRowSurfaces extends never ? true : never = true
void _rowSurfacesExhaustive

/**
 * THE ONE CELL-STATUS UNION, and it was six identical copies — one each in
 * the devices, location-configuration, shift-management, qualification-
 * calendar, tenant-view-of-platform-administration and worker-lifecycle
 * fixtures, each with its own array and its own exhaustiveness proof. Six
 * proofs of six unions prove nothing about the seventh spelling.
 */
export type ControlStatus =
  | 'allowed'
  | 'allowed-with-conditions'
  | 'read-only'
  | 'explicitly-prohibited'
  | 'not-applicable'
  | 'unavailable'

export const CONTROL_STATUSES = [
  'allowed',
  'allowed-with-conditions',
  'read-only',
  'explicitly-prohibited',
  'not-applicable',
  'unavailable',
] as const satisfies readonly ControlStatus[]

type MissingFromControlStatuses = Exclude<ControlStatus, (typeof CONTROL_STATUSES)[number]>
const _controlStatusesExhaustive: MissingFromControlStatuses extends never ? true : never = true
void _controlStatusesExhaustive

/**
 * THE SAME SIX STATUSES IN THE SOURCE'S OWN TITLE CASE, which `MOD-DOH-01`
 * and `MOD-DOH-12` render verbatim into their on-screen tables. It was two
 * identical copies. It is NOT merged into `ControlStatus`: both spellings
 * are asserted literally by those modules' own suites and by what their
 * screens print, so merging them would change a rendered document.
 */
export type MatrixStatus =
  | 'Allowed'
  | 'Allowed with conditions'
  | 'Read-only'
  | 'Unavailable'
  | 'Explicitly prohibited'
  | 'Not applicable'

export const MATRIX_STATUSES = [
  'Allowed',
  'Allowed with conditions',
  'Read-only',
  'Unavailable',
  'Explicitly prohibited',
  'Not applicable',
] as const satisfies readonly MatrixStatus[]

type MissingFromMatrixStatuses = Exclude<MatrixStatus, (typeof MATRIX_STATUSES)[number]>
const _matrixStatusesExhaustive: MissingFromMatrixStatuses extends never ? true : never = true
void _matrixStatusesExhaustive

/**
 * THE ONE ROW SHAPE for the six matrices that key a cell on `ControlStatus`.
 * It was three shapes among those six — one carrying `provenance`, two
 * carrying `detail`, three carrying neither — so a gate asking one question
 * of all six had to ask it three ways.
 *
 * `detail` is required, per cell and per role. A refusal with no stated
 * cause is a refusal the screen cannot explain, and L10238 is explicit:
 * "a blank cell is an unanswered question that an implementer will answer
 * privately and inconsistently". Where the frozen source states no cause,
 * the cell says so and the module's `UNSPECIFIED_IN_SOURCE` panel carries
 * it — no cause is invented to fill the field.
 */
export interface DohControlMatrixRow<Id extends string = string> {
  readonly id: Id
  readonly control: string
  /** Where this row's capability is met. Read by `rolesReachingByMatrix`. */
  readonly surface: MatrixRowSurface
  readonly status: Readonly<Record<TenantRoleId, ControlStatus>>
  /** Per cell, per role, never blank. */
  readonly detail: Readonly<Record<TenantRoleId, string>>
  /** How this screen draws each refusal, by rule and not by taste. */
  readonly rendering: string
  readonly effect: string
  readonly sourceRef: string
}

/** A role holds a capability when the cell lets it read or act. */
const HOLDING_STATUSES = [
  'allowed',
  'allowed-with-conditions',
  'read-only',
] as const satisfies readonly ControlStatus[]

/**
 * The five tenant roles, in registry order, read from `@/domain/roles`
 * rather than typed here a sixth time. The narrowing is safe by the
 * registry's own definition — the TENANT security domain holds exactly
 * these five (MOD-DOH-09) — and `tests/component/doh-shell.test.tsx`
 * asserts the shell's tuple equals `rolesInDomain('TENANT')`, so a sixth
 * tenant role fails there rather than silently widening this.
 */
const TENANT_ROLES = rolesInDomain('TENANT').map((r) => r.id as TenantRoleId)

/**
 * The Title-Case spelling onto the shared union. A TOTAL `Record`, not a
 * lookup with a fallback: a seventh `MatrixStatus` fails to compile here
 * instead of normalising to `undefined` and quietly reaching every module.
 */
const FROM_TITLE_CASE: Readonly<Record<MatrixStatus, ControlStatus>> = {
  Allowed: 'allowed',
  'Allowed with conditions': 'allowed-with-conditions',
  'Read-only': 'read-only',
  Unavailable: 'unavailable',
  'Explicitly prohibited': 'explicitly-prohibited',
  'Not applicable': 'not-applicable',
}

/**
 * `MOD-DOH-09` keys its cells on the policy union instead. Total for the
 * same reason, and the two offline outcomes map onto what they let a person
 * do: a cached read is a read, a queued write is a write that was accepted.
 * `clientDecisionRequired` maps onto `not-applicable` — it is neither a
 * grant nor the withholding token, so it settles the reach question in
 * neither direction, which is the honest answer for a question the client
 * has not answered. No cell in the nine matrices carries it today.
 *
 * `unavailable` HERE IS THE OVERLOADED TOKEN, and this is the one place the
 * two senses could be conflated. They are not, and the reason is structural
 * rather than a rule applied by hand: a MATRIX CELL states role-level
 * standing — "cannot hold this in any scope" — while TRANSIENT
 * unavailability of an action a role does hold is never a matrix cell at
 * all. It is a `PermissionDecision` computed at render time
 * (`decide('unavailable', 'TENANT_SUSPENDED', …)`), and this derivation
 * reads no decision. Write a transient refusal into a matrix cell and the
 * two would merge; the matrices do not, and each module's suite pins the
 * cells that carry the token.
 */
const FROM_OUTCOME: Readonly<Record<PermissionOutcome, ControlStatus>> = {
  allowed: 'allowed',
  allowedWithConditions: 'allowed-with-conditions',
  readOnly: 'read-only',
  cachedReadOnlyOffline: 'read-only',
  queuedOffline: 'allowed',
  unavailable: 'unavailable',
  explicitlyProhibited: 'explicitly-prohibited',
  clientDecisionRequired: 'not-applicable',
  notApplicable: 'not-applicable',
}

/**
 * WHO REACHES A MODULE'S ROUTE — the ONE implementation of the rule, and
 * the only thing `rolesReaching` is allowed to be.
 *
 * THE RULE, in one sentence with two clauses that both do work:
 *
 *   a role reaches the route when this module's OWN SCREEN offers it
 *   something, and no screen row marks it `Unavailable`.
 *
 * CLAUSE ONE, `surface === 'screen'`, is what stops a chrome banner from
 * counting as module standing. `MOD-DOH-01`'s compliance message is
 * `Allowed` for all five roles because sign-in is blocked for everyone and
 * everyone must be told why (L26886-L26888) — it is the shell's suspension
 * slot, and three of those five hold nothing on the screen itself.
 * `MOD-DOH-13` carries the same shape across three banner rows (L29198-
 * L29200).
 *
 * CLAUSE TWO is the source's own withholding token. `Unavailable` means
 * "cannot hold this in any scope" — no standing on the module at all — and
 * the source keeps it deliberately distinct from `Explicitly prohibited`
 * (L10238): a role that is only ever prohibited OPENS the screen and meets
 * a refusal it can read, while a role marked `Unavailable` is not offered
 * the route and a deep link meets STATE-05. It outranks a grant on the same
 * matrix, which is what `MOD-DOH-04` turns on: the Worker is `Unavailable`
 * on the clearance corpus, so the two conditional grants left in that
 * column — the own-record read and the own-certification alerts — are met
 * on the device rather than in the Hub.
 *
 * BOTH CLAUSES ARE LOAD-BEARING, AND IT IS MEASURED RATHER THAN ASSERTED —
 * on every build, by the mutation pins in `scripts/build-doh-module-reach.mjs`,
 * which is where this rule is now run over the eight matrices. Three
 * mutants, three pinned answers:
 *
 * - clause two removed: exactly `MOD-DOH-04` moves, gaining the Worker —
 *   five roles, not four — which is `tests/unit/doh-workers.test.ts` red.
 * - clause one removed, clause two left in place: NOTHING moves. Reading
 *   every row instead of the screen rows gains the chrome grants, but the
 *   same widening pulls the screen rows' `Unavailable` cells into the same
 *   column, and clause two withholds on them regardless.
 * - both removed, which is the bare "does this role hold anything anywhere
 *   in this matrix" question `tests/coverage/slice-04-gates.test.ts` gate 4
 *   asks: exactly the three modules that gate pins move — `MOD-DOH-01`
 *   offers all five roles instead of two, `MOD-DOH-13` offers four instead
 *   of two, `MOD-DOH-04` offers five instead of four. The other five are
 *   unchanged under every mutant.
 *
 * So the classification is load-bearing against the MEANING question rather
 * than against clause two, and the two clauses do not disagree with each
 * other on today's data. That is worth saying plainly rather than dressing
 * either clause up as redundant — the classification is what makes the
 * meaning question askable at all, and the withholding token is what
 * answers it when a role holds something on the screen and still has no
 * standing.
 *
 * NOT D11, AND DELIBERATELY NOT. Whether the persona reaches SURF-DOH at
 * all is the route registry's answer, asked first by `app/hub/HubShell.tsx`
 * — which is why `MOD-DOH-03` reaching all five roles is not a bug: its
 * matrix withholds from nobody, and the Worker still lands on no Hub route.
 * Restating D11 here would give one rule two owners.
 */
export function rolesReachingByMatrix<Row extends { readonly surface: MatrixRowSurface }>(
  rows: readonly Row[],
  statusOf: (row: Row, role: TenantRoleId) => ControlStatus,
): readonly TenantRoleId[] {
  const screenRows = rows.filter((row) => row.surface === 'screen')
  return TENANT_ROLES.filter((role) => {
    const column = screenRows.map((row) => statusOf(row, role))
    const holdsSomething = column.some((status) =>
      (HOLDING_STATUSES as readonly ControlStatus[]).includes(status),
    )
    return holdsSomething && !column.includes('unavailable')
  })
}

/* The three cell readers, one per spelling the nine matrices use. They are
 * exported because `MOD-DOH-12` publishes the same derivation over its own
 * matrix for its screen to pass to `evaluateAccess`, and that copy must run
 * the SAME rule over the SAME rows rather than a second implementation of
 * it — its unit suite compares the two, and a wrapper that just re-read
 * `rolesReaching` would make that comparison vacuous. */

/** The six matrices keyed on the shared union. */
export const cellStatus = (row: DohControlMatrixRow, role: TenantRoleId): ControlStatus =>
  row.status[role]

/** `MOD-DOH-01` and `MOD-DOH-12`, keyed on the Title-Case spelling. */
export const titleCaseCellStatus = (
  row: { readonly byRole: Readonly<Record<TenantRoleId, { readonly status: MatrixStatus }>> },
  role: TenantRoleId,
): ControlStatus => FROM_TITLE_CASE[row.byRole[role].status]

/** `MOD-DOH-09`, keyed on the policy union. */
export const outcomeCellStatus = (
  row: { readonly cells: Readonly<Record<TenantRoleId, { readonly outcome: PermissionOutcome }>> },
  role: TenantRoleId,
): ControlStatus => FROM_OUTCOME[row.cells[role].outcome]

export interface DohModuleDefinition {
  readonly id: DohModuleId
  /** Canonical name (`registries/generated/modules.json`, the source's own §4.1.3 inventory). */
  readonly name: string
  /** URL segment under `/hub/`, unique, never a bare number. */
  readonly slug: string
  /** One plain-language sentence, quoted from the module's own purpose line. */
  readonly purpose: string
  /**
   * The tenant roles this module's route is offered to, and the ONE place
   * the module rail reads to decide what to draw.
   *
   * DERIVED, NEVER TYPED, AND NOT DERIVED HERE. Every entry below reads it
   * from `registries/generated/doh/module-reach.json`, which
   * `scripts/build-doh-module-reach.mjs` writes by applying
   * `rolesReachingByMatrix` — the function directly above, the one and only
   * implementation — to that module's own matrix. There is no second copy
   * of the rule and no second copy of the answer. It was a hand-maintained
   * list carrying a hand-written rule ("any cell in its column
   * `Unavailable`"), and a gate found the rule wrong on three of the eight
   * while the values it happened to produce were right.
   *
   * A GENERATED FILE SOMEBODY CAN OPEN IS NOT A HAND-MAINTAINED FIELD HERE,
   * and four separate things stop it becoming one. `pnpm build` re-runs the
   * generator, so an edit survives only until the next build. Until then the
   * eight module suites in `tests/unit` compare this field against their own
   * live matrices and go red on the edited entry — each non-vacuously,
   * pinning the exact role set AND its size, so neither a widened nor a
   * narrowed list passes. A module id deleted from the file fails `tsc` on
   * the annotation below rather than becoming a module nobody reaches. And
   * `reachOf` refuses any token that is not a tenant role, so a typo throws
   * at import rather than quietly shrinking a rail.
   */
  readonly rolesReaching: readonly RoleId[]
}

/**
 * The generated map, read once. The annotation is the compile-time half of
 * the guard: a `DohModuleId` missing from the JSON fails `tsc` here rather
 * than becoming a module that reaches nobody.
 */
const GENERATED_REACH: Readonly<Record<DohModuleId, readonly string[]>> = MODULE_REACH.reach

/**
 * One module's generated reach, narrowed to `RoleId` by INTERSECTING with
 * the role registry rather than by asserting — which is what makes the
 * runtime half of the guard real. A token the registry does not know is
 * dropped by the filter, the lengths then disagree, and this throws; the
 * cast that would have been the short way to write this would have shipped
 * the typo instead. Canonical registry order, whatever order the file is in.
 */
function reachOf(id: DohModuleId): readonly RoleId[] {
  const generated = GENERATED_REACH[id]
  const roles = TENANT_ROLES.filter((role) => generated.includes(role))
  if (roles.length !== generated.length) {
    throw new Error(
      `registries/generated/doh/module-reach.json: ${id} names a role that is not a tenant role ` +
        `or names one twice (${generated.join(', ')}). Re-run \`pnpm build:registries\`.`,
    )
  }
  return roles
}

// Same widening hazard as `SA_MODULES`/`ROLES`/`SCREEN_STATES`: a plain
// `: readonly DohModuleDefinition[]` annotation would widen the const and
// make the exhaustiveness check below vacuous. `as const satisfies` keeps
// every `id` literal narrowed to `DohModuleId`.
export const DOH_MODULES = [
  {
    id: 'MOD-DOH-01',
    name: 'Tenant Lifecycle and Tier Operations',
    slug: 'tenant-lifecycle-and-tier-operations',
    purpose:
      "Enforce the tenant's commercial and compliance state everywhere in the Hub, record every transition, and render the tenant's own position read-only.",
    // L26883-L26896. Two of the twelve rows are the shell's suspension slot
    // rather than this screen, and the compliance message is `Allowed` for
    // all five roles there; on the screen's own rows the Supervisor, the
    // Quality Manager and the Worker are `Unavailable` throughout.
    rolesReaching: reachOf('MOD-DOH-01'),
  },
  {
    id: 'MOD-DOH-02',
    name: 'Location Configuration',
    slug: 'location-configuration',
    purpose:
      "Hold the tenant's physical structure as the anchor for timezone, shifts, Job binding, scoping and reporting drill-down.",
    // L27113-L27127. Eleven screen rows and nothing else; only the Worker is
    // `Unavailable` (on viewing the location tree).
    rolesReaching: reachOf('MOD-DOH-02'),
  },
  {
    id: 'MOD-DOH-03',
    name: 'Shift Management',
    slug: 'shift-management',
    purpose:
      "Define the tenant's working-time blocks as the anchor for metering, production dating and escalation resolution.",
    // L27287-L27297. The one matrix of the eight carrying no `Unavailable`
    // cell at all — every column, the Worker's included, holds a reading or
    // acting status on `View Shifts`. So this module withholds its route
    // from nobody. The Worker still reaches no Hub route: the route registry
    // answers that first (D11), and this field is never consulted for a
    // persona the surface already withholds.
    rolesReaching: reachOf('MOD-DOH-03'),
  },
  {
    id: 'MOD-DOH-04',
    name: 'Worker Lifecycle and Qualifications',
    slug: 'worker-lifecycle-and-qualifications',
    purpose:
      'Hold who may do what, enforce it at assignment and on the device, and provide the audited exception path when the line would otherwise stop.',
    // L27466-L27484. Fifteen screen rows. The Worker holds two of them —
    // the own-record read and the own-certification alerts — and is
    // `Unavailable` on the clearance corpus, which is the module's own
    // statement that the Worker has no standing here; both grants are met
    // on the device.
    rolesReaching: reachOf('MOD-DOH-04'),
  },
  {
    id: 'MOD-DOH-09',
    name: 'Permissions, Roles and Access',
    slug: 'permissions-roles-and-access',
    purpose:
      'Configure who exists in the tenant, what each may do, and where; enforce it across all five surfaces from one place.',
    // L28518-L28533. Twelve screen rows; only the Worker is `Unavailable`
    // (viewing the user and role register), and the other three non-admin
    // roles read that register.
    rolesReaching: reachOf('MOD-DOH-09'),
  },
  {
    id: 'MOD-DOH-12',
    name: 'Integration Surface (Tenant Side)',
    slug: 'integration-surface',
    purpose:
      'Narrowed to single sign-on only (FEAT-DOH-1201): the connection record for the tenant and its contact email. No operational object.',
    // L29038-L29050. The tier read view is a Hub screen row even though this
    // slice builds it on `MOD-DOH-01`'s screen; it is the one row carrying
    // `Unavailable`, and it withholds the Supervisor, the Quality Manager
    // and the Worker, who hold nothing else here either.
    rolesReaching: reachOf('MOD-DOH-12'),
  },
  {
    id: 'MOD-DOH-13',
    name: 'Tenant View of Platform Administration',
    slug: 'tenant-view-of-platform-administration',
    purpose:
      "Make every platform-side access to a tenant's workspace visible to that tenant, and give the tenant a control it can actually exercise.",
    // L29195-L29206. Three of the ten rows are the shell's banner slot and
    // reach every Hub persona regardless of the rail; on the two rows this
    // screen owns — Platform Access History and the post-session report —
    // the Supervisor, the Quality Manager and the Worker are `Unavailable`.
    rolesReaching: reachOf('MOD-DOH-13'),
  },
  {
    id: 'MOD-DOH-14',
    name: 'Qualification Calendar',
    slug: 'qualification-calendar',
    purpose:
      'Give the Quality Manager a single 60-day, tenant-wide view of certification expiry for planning.',
    // L29341-L29350, the matrix D24 adopts over its seven restatements. Six
    // screen rows; only the Worker is `Unavailable`. The Supervisor reads it
    // filtered to their own Area, and the Tenant Admin and Auditor read it.
    rolesReaching: reachOf('MOD-DOH-14'),
  },
] as const satisfies readonly DohModuleDefinition[]

// Compile-time exhaustiveness check, same shape as `PERMISSION_OUTCOMES` in
// `@/policy/decision.ts`: fails to compile if `DohModuleId` gains or loses a
// member that `DOH_MODULES` does not list exactly once.
type MissingFromDohModules = Exclude<DohModuleId, (typeof DOH_MODULES)[number]['id']>
const _dohModulesExhaustive: MissingFromDohModules extends never ? true : never = true
void _dohModulesExhaustive

const BY_ID = new Map(DOH_MODULES.map((m) => [m.id, m]))

export function dohModuleById(id: DohModuleId): DohModuleDefinition {
  const found = BY_ID.get(id)
  if (!found) throw new Error(`Unknown SURF-DOH module: ${id}`)
  return found
}

/**
 * The modules whose route is offered to `role`, in canonical order — what
 * the module rail draws, computed here so no component has to.
 *
 * The parameter annotation on the callback is load-bearing: `DOH_MODULES` is
 * `as const`, so a narrower element type would let `.includes` accept only
 * the members it already lists. Widening the element to
 * `DohModuleDefinition` asks the real question — is this role in the list —
 * instead of a tautology.
 *
 * Reading `m.rolesReaching` is a plain array read: the derivation over that
 * module's matrix already ran at build time, so there is nothing here to
 * cache and nothing that could let the rail and the screen disagree.
 *
 * This answers the MODULE question only. Whether `role` reaches SURF-DOH at
 * all is the route registry's answer (D11), asked first by `app/hub/HubShell.tsx`.
 */
export function dohModulesReachedBy(role: RoleId): readonly DohModuleDefinition[] {
  return DOH_MODULES.filter((m: DohModuleDefinition) => m.rolesReaching.includes(role))
}

export interface DohOutOfSliceModule {
  /** Deliberately a bare string, not `DohModuleId` — these ids are OUT of
   *  this slice's closed set and must never be confused for a route this
   *  slice serves. */
  readonly id: string
  readonly name: string
  /** A plain sentence naming the slice that owns it, or the stated reason it
   *  has no owner yet. Never left blank — spec §1's exclusion table. */
  readonly ownedBy: string
}

/**
 * The other eleven of the Hub's nineteen canonical modules (spec §1's
 * exclusion table, `registries/generated/modules.json` for the names).
 * Rendered by the Task 2 module index as "not in this slice", never
 * silently dropped, so name-matching cannot pull one back into slice 4 by
 * accident.
 */
export const DOH_OUT_OF_SLICE_MODULES = [
  { id: 'MOD-DOH-05', name: 'Job Lifecycle and Approval', ownedBy: 'Slice 6' },
  { id: 'MOD-DOH-06', name: 'Run Scheduling and Execution Oversight', ownedBy: 'Slice 6' },
  { id: 'MOD-DOH-07', name: 'Worker Assignment', ownedBy: 'Slice 6' },
  { id: 'MOD-DOH-08', name: 'Execution Summary Review and Distribution', ownedBy: 'Slice 6' },
  { id: 'MOD-DOH-10', name: 'Notifications', ownedBy: 'Slice 10' },
  { id: 'MOD-DOH-11', name: 'Audit and Retention', ownedBy: 'Slice 10' },
  { id: 'MOD-DOH-15', name: 'Job Cloning', ownedBy: 'Slice 6' },
  { id: 'MOD-DOH-16', name: 'Multi-Area Job Pairing', ownedBy: 'Slice 6' },
  {
    id: 'MOD-DOH-17',
    name: 'Regulated-Industry Mode',
    ownedBy:
      'No single-slice owner — every enforcement target it names sits in slice 6 or slice 10, so slice 4 has nothing to enforce (L29736).',
  },
  { id: 'MOD-DOH-18', name: 'Standard Report Data Sets', ownedBy: 'Slice 6' },
  {
    id: 'MOD-DOH-19',
    name: 'Parts Registry',
    ownedBy:
      'Not yet scheduled — tenant master data, but not tenant setup, users, Workers, qualifications or devices.',
  },
] as const satisfies readonly DohOutOfSliceModule[]

/**
 * The two lists together are the surface's whole canonical inventory, and
 * nothing may appear in both. `DohOutOfSliceModule.id` is a bare string by
 * design (these are OUT of the closed set), so this is the only check that
 * can catch a module being listed twice — the exhaustiveness check above
 * covers the in-slice eight and cannot see these eleven at all.
 */
type InSliceId = (typeof DOH_MODULES)[number]['id']
type OutOfSliceId = (typeof DOH_OUT_OF_SLICE_MODULES)[number]['id']
type OverlappingModuleIds = Extract<OutOfSliceId, InSliceId>
const _noModuleIsInBothLists: OverlappingModuleIds extends never ? true : never = true
void _noModuleIsInBothLists
