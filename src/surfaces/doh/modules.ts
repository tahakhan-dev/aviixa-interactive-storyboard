/**
 * The SURF-DOH spine, part 1 of 6: the fifteen built modules of the
 * Delivery Operations Hub's nineteen-module inventory (`canonicalModuleCount`
 * on `SURF-DOH` in `@/domain/surfaces`). Spec §1.
 *
 * Names are canonical; `SCR-DOH-NN` numbers are annotations only (D1), and a
 * three-digit `SCR-DOH-NNN` literal is forbidden anywhere in the codebase —
 * the two source catalogues collide silently on the same identifier. Every
 * `slug` below is a plain name, never a screen number, for the same reason.
 *
 * THIS FILE ALSO OWNS THE CONTROL-MATRIX VOCABULARY the sixteen Hub matrices
 * share — the row's surface, the status union, the row shape and the ONE
 * derivation of `rolesReaching`. It owns them because `rolesReaching` is
 * computed FROM the matrices: a rule that lives beside the thing it reads
 * cannot be applied to fifteen modules and forgotten on the sixteenth.
 *
 * THE RULE LIVES HERE; THE MATRICES DO NOT REACH IT AT RUNTIME. This file
 * used to import the module matrices to run that rule itself, which
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
import MODULE_REACH from '../../../registries/generated/doh/module-reach.json' with { type: 'json' }

export type DohModuleId =
  | 'MOD-DOH-01'
  | 'MOD-DOH-02'
  | 'MOD-DOH-03'
  | 'MOD-DOH-04'
  | 'MOD-DOH-05'
  | 'MOD-DOH-06'
  | 'MOD-DOH-07'
  | 'MOD-DOH-08'
  | 'MOD-DOH-09'
  | 'MOD-DOH-12'
  | 'MOD-DOH-13'
  | 'MOD-DOH-14'
  | 'MOD-DOH-15'
  | 'MOD-DOH-16'
  | 'MOD-DOH-19'

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
 * - `screen` — the capability is met on THIS MODULE'S OWN SCREEN. It stays
 *   `screen` when the answer is "absent for everyone": a row like "Create
 *   an equipment record" or "Change the 60-day horizon" is still this
 *   screen's own disclosure that it offers nothing. It also stays `screen`
 *   where this BUILD renders the module's own capability on a shared
 *   screen — `MOD-DOH-12`'s tier read view is `MOD-DOH-12`'s capability,
 *   drawn on `MOD-DOH-01`'s screen because this slice built one screen for
 *   both; the screen is shared, the capability is not delegated.
 * - `chrome` — the shell draws it on every Hub route, above the content
 *   and outside the rail's answer. A role reaches it whether or not the
 *   rail offers the module, so holding it says nothing about reach.
 * - `another-surface` — the capability is met, and NOT on this module's own
 *   screen. This screen can only describe it.
 *
 * The reservation is what keeps the third honest: `another-surface` means
 * somebody, somewhere, holds it. A capability that exists NOWHERE is a
 * `screen` row whose every cell refuses.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THREE MEMBERS, FOUR CASES — the ruling, settled against the source rather
 * than by majority. `another-surface` had drifted to three readings inside
 * one slice, and the reason is structural: there is a fourth case and no
 * member for it, so each module that met it borrowed a different neighbour.
 *
 * THE FOURTH CASE is a capability met on a DIFFERENT SCREEN OF THIS SURFACE.
 * Four live rows are in it:
 *
 * - `MOD-DOH-05` row 8 (L27701), the tag-to-qualification-set mapping, met
 *   in the tenant administration area — `SCR-DOH-23`, L48117.
 * - `MOD-DOH-15` row 3 (L29479), approving a cloned Job, which is
 *   `MOD-DOH-05` row 4 drawn on `SCR-DOH-12` (L48106).
 * - `MOD-DOH-06` rows 11 and 12 (L27918, L27919), the record-finish window
 *   and the run-extension cap, both set in the tenant administration area.
 *
 * The first two are classified `another-surface`; the last two are
 * classified `screen`. NEITHER MODULE IS WRONG ABOUT ITS OWN SCREEN, and
 * that is what makes this a vocabulary defect rather than four mistakes:
 *
 * - FOR REACH, the fourth case must behave like `another-surface`. Clause
 *   one below asks whether this module's OWN SCREEN offers the role
 *   something, and a capability met on another screen does not. It is
 *   measured, not argued: `MOD-DOH-15` row 3 is the only row on its card
 *   whose Quality Manager cell holds anything, so classifying it `screen`
 *   gives that module a Quality Manager whose whole standing is an act on
 *   another module's screen — two roles becomes three, and the
 *   `noClassification` mutant in `scripts/build-doh-module-reach.mjs` pins
 *   it on every build.
 * - FOR RENDERING, the fourth case must NOT behave like `another-surface`.
 *   `adjacentAffordance` in `@/surfaces/doh/boundary` folds the token
 *   straight to `cross-surface`, and `AC-DOH-012-3` (L25767) makes that a
 *   CROSS-SURFACE LINK. `MOD-DOH-06` says exactly why it refuses one: the
 *   setting is "a different Hub screen", so what its rows draw is a named
 *   pointer and no control — "not a `CrossSurfaceStatement` (which claims a
 *   place on another surface)". `MOD-DOH-05` reaches the same conclusion
 *   from the other side, withholding its `boundary` pointer because "the
 *   eight-row boundary register is CROSS-SURFACE, and the tenant
 *   administration area is a different screen of THIS surface".
 *
 * AND THE SOURCE SETTLES WHICH IT IS NOT. L1598, on the five-surface
 * diagram: the tenant administration area "is attached to the Delivery
 * Operations Hub rather than drawn as its own box, **because it is a screen
 * group and not a surface**". `AC-PROD-040` (L1614): "exactly five surfaces
 * exist; the tenant administration area is not presented as a sixth." So
 * none of the four rows is on another surface, whatever it is classified.
 *
 * THE REMEDY, NAMED AND NOT TAKEN HERE: a fourth member, `another-screen`,
 * excluded from reach exactly as `another-surface` is and rendered as a
 * named pointer rather than a cross-surface link. It touches six matrices,
 * two folds and `@/surfaces/doh/boundary`, which is a task of its own; this
 * ruling is what that task would encode. UNTIL THEN, READ THE THIRD MEMBER
 * AS "not this module's own screen" — that is what clause one uses it for,
 * and it is the reading a fourth module must not diverge from again.
 */
export type MatrixRowSurface = 'screen' | 'chrome' | 'another-surface'

/**
 * THE LIVE READINGS THE RULING ABOVE ADJUDICATES, recorded rather than
 * corrected here: they live in module files this task does not own, and a
 * classification changed from outside the module that measured it is how a
 * reading gets averaged instead of settled.
 *
 * Each is a FINDING, not a permission: nothing may cite a row here as
 * precedent for a fifth reading.
 */
export interface MatrixRowSurfaceDivergence {
  /** The file, rows or fold that reads the token differently. */
  readonly where: string
  readonly reads: string
  readonly ruling:
    /** Right for reach, and the member's NAME is what is false. */
    | 'right-for-reach-wrong-name'
    /** Right for what it renders, and wrong for reach — the same fourth case. */
    | 'right-for-rendering-wrong-for-reach'
    /** Reads a fact off the token that the token does not carry. */
    | 'narrower-than-the-definition'
  readonly why: string
  readonly sourceRef: string
}

export const MATRIX_ROW_SURFACE_DIVERGENCES = [
  {
    where: '`MOD-DOH-05` row 8 and `MOD-DOH-15` row 3',
    reads: '`another-surface` means "not THIS MODULE’s screen". `MOD-DOH-05` row 8 is met in the tenant administration area; `MOD-DOH-15` row 3 is met on `SCR-DOH-12`, `MOD-DOH-05`’s approval queue. Both are screens of SURF-DOH.',
    ruling: 'right-for-reach-wrong-name',
    why: 'This is the classification the reach rule needs — neither capability is met on the classifying module’s own screen, so neither may count toward reaching its route, and `MOD-DOH-15` measurably gains a Quality Manager if it does. What is false is the member’s NAME: L1598 and AC-PROD-040 (L1614) put the tenant administration area inside SURF-DOH and cap the surfaces at five, and `SCR-DOH-12` is plainly a Hub screen. Both rows withhold the `boundary` pointer for exactly that reason and neither is handed to `CrossSurfaceStatement`, so the cross-surface rendering the token normally triggers is suppressed by hand on each card.',
    sourceRef: 'L27701 and L29479 (the rows); L1598 and AC-PROD-040 L1614 (five surfaces); L48117 and L48106 (the two Hub screens)',
  },
  {
    where: '`MOD-DOH-06` rows 11 and 12',
    reads: '`another-surface` means another SURFACE, so a capability set on a different HUB screen stays `screen`. Both rows are set in the tenant administration area and are classified `screen`, drawing a named pointer and no control.',
    ruling: 'right-for-rendering-wrong-for-reach',
    why: 'The rendering is right and the module says why: a `CrossSurfaceStatement` "claims a place on another surface" and the tenant administration area is not one, so the rows draw a named pointer instead. The classification is still wrong for clause one — neither value is set on `MOD-DOH-06`’s own screen, so neither should count toward reaching its route. It does not move this module’s answer, because row 2 (L27910) admits all five roles on its own screen anyway; that is a fact about this card, not a defence of the classification.',
    sourceRef: 'L27918 and L27919 (the rows); L48117 (SCR-DOH-23); L27910 (the row that carries this module’s reach)',
  },
  {
    where: '`@/surfaces/doh/modules/doh-08/rendering`, `crossSurface`',
    reads: '`another-surface` means the Client Command Center — the fold resolves `routeBySurface(\'SURF-CC\')` for every `another-surface` row and labels the link "Open in the Client Command Center".',
    ruling: 'narrower-than-the-definition',
    why: 'Correct on this card, and only because both of its `another-surface` rows are Command Center acts: row 5 reclassification and row 8 the Severity 1 lot-hold release, which is Command Center action 4 (L28304, L28307, L49578). It is not the definition. The token says only "not this screen", so the same fold over `MOD-DOH-05` row 8 or `MOD-DOH-15` row 3 would offer a Command Center link for a capability met on a Hub screen — and a routing pointer is read as a verified fact. The target belongs on the row (`metElsewhere`, `metInstead`, `boundary`), never on the token.',
    sourceRef: 'L28304 and L28307 (the two rows); L1600-L1606 (the five surfaces)',
  },
] as const satisfies readonly MatrixRowSurfaceDivergence[]

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

/**
 * THE ONE WORDING for a cell where the frozen source states the bare token and
 * qualifies it nowhere. `detail` may not be blank (L10238) and a cause this
 * build invented would read back as the source's, so the cell says exactly what
 * the source said and points at the module's own silence panel.
 *
 * Held here, beside the `detail` field whose rule it satisfies, because it was
 * hand-written three times across three module fixtures in three near-identical
 * wordings — the same drift the row shape above was hoisted to end, and one no
 * single-module review could see. The wording is deliberately role-neutral: two
 * of the three copies said "none of the four non-admin roles", which is false
 * in `worker-lifecycle-and-qualifications`, where the Tenant Admin's own cell
 * carries this token on three rows.
 */
export const BARE_PROHIBITION =
  'Explicitly prohibited. The source states the bare token for this role on this row and qualifies it nowhere; the silence is recorded in UNSPECIFIED_IN_SOURCE rather than filled in here.'

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
 * which is where this rule is now run over the fifteen matrices. Three
 * mutants, three pinned answers:
 *
 * - clause two removed: `MOD-DOH-04` and `MOD-DOH-08` move, both to all
 *   five roles. `MOD-DOH-04` gains the Worker, which is
 *   `tests/unit/doh-workers.test.ts` red; `MOD-DOH-08` gains the Tenant
 *   Admin, the Supervisor and the Worker, all three withheld by row 2's
 *   `Unavailable` on the review queue (L28301).
 * - clause one removed, clause two left in place: exactly `MOD-DOH-15`
 *   moves, gaining the Quality Manager. THIS ANSWER CHANGED WHEN THE
 *   SLICE-6 SEVEN WERE REGISTERED and the old text here — "NOTHING moves" —
 *   was true of eight modules and is false of fifteen. On the slice-4 eight,
 *   reading every row instead of the screen rows gained the chrome grants
 *   but dragged the screen rows' `Unavailable` cells into the same column,
 *   and clause two withheld on them regardless, so the two clauses never
 *   disagreed. `MOD-DOH-15` is the first module where they do: no cell on
 *   its card carries `Unavailable` at all, so clause two can withhold
 *   nothing, and its row 3 — approving a clone, which is `MOD-DOH-05` row 4
 *   met on another screen — is the ONLY row whose Quality Manager cell holds
 *   anything. Clause one keeps that role out unaided.
 * - both removed, which is the bare "does this role hold anything anywhere
 *   in this matrix" question `tests/coverage/slice-04-gates.test.ts` gate 4
 *   asks: `MOD-DOH-01`, `MOD-DOH-04`, `MOD-DOH-08`, `MOD-DOH-13` and
 *   `MOD-DOH-15` move. `MOD-DOH-01` offers all five roles instead of two,
 *   `MOD-DOH-13` four instead of two, `MOD-DOH-04` five instead of four —
 *   the three exceptions that gate pins — plus the two slice-6 modules it
 *   does not look at.
 *
 * So the classification is load-bearing against the MEANING question on
 * every module, and on `MOD-DOH-15` against the reach answer itself. The two
 * clauses DO now disagree on live data, which is why each is pinned
 * separately rather than one being described as redundant.
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
  /**
   * URL segment under `/hub/`, never a bare number.
   *
   * UNIQUE PER ROUTE, NOT PER MODULE — corrected when the slice-6 seven
   * landed. `MOD-DOH-15` has no screen of its own: L48105 mounts it inside
   * `SCR-DOH-11`, `MOD-DOH-05`'s Job editor, so the two share a slug. The
   * field's job is to say where the rail sends a reader, and the honest
   * answer for a mounted module is the screen that mounts it. Two modules
   * naming one route is a fact about the source, not a collision.
   */
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
    id: 'MOD-DOH-05',
    name: 'Job Lifecycle and Approval',
    slug: 'job-lifecycle-and-approval',
    purpose:
      'Hold the standing definition of work, gate it through an absolute segregation of duties, and route version-adoption decisions to an accountable owner.',
    // L27694-L27707, fourteen data rows (L27692 is the header). Row 8 is the
    // one `another-surface` row; every other row is this module's own screen.
    // Only the Worker carries `Unavailable`, on `View Jobs` (L27707).
    //
    // TWO ROUTES, ONE SLUG. `SCR-DOH-10` and `SCR-DOH-11` live at this slug;
    // `SCR-DOH-12`, the approval queue, has its own navigation entry
    // (L48106) and its own directory. `slug` is the rail's link and a module
    // has one; the queue is reached from the screen this slug names.
    rolesReaching: reachOf('MOD-DOH-05'),
  },
  {
    id: 'MOD-DOH-06',
    name: 'Run Scheduling and Execution Oversight',
    slug: 'run-scheduling-and-execution-oversight',
    purpose:
      'Create, schedule, oversee, modify within strict limits, and close the execution records that everything else on the platform hangs off.',
    // L27909-L27920, twelve data rows (L27907 is the header). Every row is a
    // screen row and only the Worker carries `Unavailable`.
    rolesReaching: reachOf('MOD-DOH-06'),
  },
  {
    id: 'MOD-DOH-07',
    name: 'Worker Assignment',
    slug: 'worker-assignment',
    purpose:
      "Bind people to runs under a qualification check, fix the run's version contract, and provide a safe, attributed handover when a person changes mid-run.",
    // L28119-L28126, eight data rows (L28117 is the header).
    rolesReaching: reachOf('MOD-DOH-07'),
  },
  {
    id: 'MOD-DOH-08',
    name: 'Execution Summary Review and Distribution',
    slug: 'execution-summary-review',
    // The one slug that names the screen rather than the module name, and it
    // is a disclosed break rather than a slip — `app/hub/execution-summary-
    // review/fixtures.ts` records the four reasons and states that this is
    // the slug this row must carry.
    purpose:
      'Compute the honest record of what a run produced, put anything abnormal in front of a Quality Manager, and keep the record correctable without ever rewriting it.',
    // L28300-L28314, fifteen data rows (L28298 is the header). Rows 5 and 8
    // are `another-surface` (Client Command Center); row 2 marks the Tenant
    // Admin, the Supervisor and the Worker `Unavailable` on the review queue.
    rolesReaching: reachOf('MOD-DOH-08'),
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
  {
    id: 'MOD-DOH-15',
    name: 'Job Cloning',
    /**
     * THE ONE SLUG THAT IS NOT THIS MODULE'S OWN ROUTE, because this module
     * has none and the source says so. Catalogue B carries no `SCR-DOH-*`
     * row for `MOD-DOH-15`; L48105 MOUNTS it inside `SCR-DOH-11`, the Job
     * editor, which is `MOD-DOH-05`'s screen at this slug — and
     * `MOD_DOH_15_MOUNT` in `@/surfaces/doh/modules/doh-15/matrix` records
     * `hasRouteOfItsOwn: false` off that line.
     *
     * SO `slug` IS UNIQUE PER ROUTE AND NOT PER MODULE, and the field's own
     * doc below now says so. The alternative was a rail entry pointing at a
     * URL that 404s, which asserts a route the source does not give this
     * module; or leaving the module unregistered, which is the debt this
     * task exists to clear and which `tests/unit/doh-cloning.test.ts` pins.
     * A rail entry pointing at the screen that actually mounts the panel is
     * the source's own answer to "where is this module reached".
     */
    slug: 'job-lifecycle-and-approval',
    purpose:
      'Create a new Job from an existing one without carrying forward the three things that must be decided afresh: identity, approval and schedule.',
    // L29477-L29482, six data rows (L29475 is the header). Row 3 is
    // `another-surface` — approving a clone is `MOD-DOH-05` row 4 on another
    // screen — and it is the only row whose Quality Manager cell holds
    // anything, so clause one is what narrows this module to two roles. No
    // cell on this card carries `Unavailable`.
    rolesReaching: reachOf('MOD-DOH-15'),
  },
  {
    id: 'MOD-DOH-16',
    name: 'Multi-Area Job Pairing',
    slug: 'multi-area-job-pairing',
    purpose:
      'Represent work that spans Areas as two linked Jobs, visible together, with a human-decided change signal across the link.',
    // L29613-L29618, six data rows (L29611 is the header). The paired
    // scheduling view is uncatalogued — `DOH_UNCATALOGUED_SCREEN_NAMES`
    // registers it under the storyboard name `SB-DOH-028` — and L48105
    // additionally mounts this module inside the Job editor.
    rolesReaching: reachOf('MOD-DOH-16'),
  },
  {
    id: 'MOD-DOH-19',
    name: 'Parts Registry',
    slug: 'parts-registry',
    purpose:
      "Hold the tenant's part master data so work instructions can reference parts and genealogy can record what was consumed.",
    // L30070-L30077, eight data rows (L30068 is the header); catalogue B row
    // L48100. L30074 gives the Quality Manager and the Read-only Auditor
    // `Read-only` on viewing the registry, which catalogue B's cell omits —
    // see `DOH_CATALOGUE_B_REACH_NARROWER` in `@/surfaces/doh/screens`.
    rolesReaching: reachOf('MOD-DOH-19'),
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
 * The other four of the Hub's nineteen canonical modules (spec §1's
 * exclusion table, `registries/generated/modules.json` for the names).
 * Rendered by the module index as "not in this slice", never silently
 * dropped, so name-matching cannot pull one back into this slice by
 * accident.
 *
 * IT WAS ELEVEN AND IT IS FOUR. Seven rows moved into `DOH_MODULES` above
 * when slice 6 landed — `MOD-DOH-05`, `06`, `07`, `08`, `15`, `16` and `19`,
 * every one of which had a built route or a built mount and a control matrix
 * under `src/surfaces/doh/modules/` while this list still called it out of
 * slice. `MOD-DOH-19`'s row had also gone stale in the other direction: it
 * read "not yet scheduled", and slice 6 shipped it.
 */
export const DOH_OUT_OF_SLICE_MODULES = [
  { id: 'MOD-DOH-10', name: 'Notifications', ownedBy: 'Slice 10' },
  { id: 'MOD-DOH-11', name: 'Audit and Retention', ownedBy: 'Slice 10' },
  {
    id: 'MOD-DOH-17',
    name: 'Regulated-Industry Mode',
    ownedBy:
      'Slice 12. Every enforcement target it names sits in slice 6 or slice 10, so it had nothing to enforce before those landed (L29736); slice 6 reads its forced-on half for MOD-DOH-08 row 14 and builds none of it.',
  },
  {
    id: 'MOD-DOH-18',
    name: 'Standard Report Data Sets',
    // WAS `Slice 6`, AND SLICE 6 IS THIS SLICE — so the row said "not in
    // this slice" about a module it named this slice as owning. The master
    // design gives slice 6 "Job, Run, assignment, official truth" and slice
    // 10 "Notifications, schedules, audit, reports, handoff"; the re-plan's
    // §3.0 rules it to slice 10 on that ground and records this exact row as
    // wrong. It owns no screen in either catalogue, so the ruling costs
    // nothing either way.
    ownedBy: 'Slice 10',
  },
] as const satisfies readonly DohOutOfSliceModule[]

/**
 * The two lists together are the surface's whole canonical inventory, and
 * nothing may appear in both. `DohOutOfSliceModule.id` is a bare string by
 * design (these are OUT of the closed set), so this is the only check that
 * can catch a module being listed twice — the exhaustiveness check above
 * covers the in-slice fifteen and cannot see these four at all.
 */
type InSliceId = (typeof DOH_MODULES)[number]['id']
type OutOfSliceId = (typeof DOH_OUT_OF_SLICE_MODULES)[number]['id']
type OverlappingModuleIds = Extract<OutOfSliceId, InSliceId>

/**
 * The four ids `DOH_OUT_OF_SLICE_MODULES` names, narrowed to literals by
 * the `as const satisfies` above rather than widened to the interface's
 * deliberate bare `string`.
 *
 * NOT A ROUTE KEY, AND THAT IS THE WHOLE POINT of the bare `string` on
 * `DohOutOfSliceModule.id`. This alias exists so `@/surfaces/doh/screens`
 * can say WHICH out-of-slice module a catalogue-B screen row names without
 * either widening to `string` — which would let a typo through — or
 * promoting the id into `DohModuleId`, which is the closed set of modules
 * this build actually serves a route for.
 */
export type DohOutOfSliceModuleId = OutOfSliceId

/**
 * The surface's whole canonical nineteen-module inventory as one union: the
 * eight with a route and the eleven without. Read by the screen registry,
 * which must name a module for catalogue-B rows whose module is not built
 * here — `SCR-DOH-10` names `MOD-DOH-05` whether or not slice 6 has landed
 * it yet, and inventing a second spelling for the unbuilt half is how a
 * later slice ends up with two ids for one module.
 */
export type DohCanonicalModuleId = DohModuleId | DohOutOfSliceModuleId
const _noModuleIsInBothLists: OverlappingModuleIds extends never ? true : never = true
void _noModuleIsInBothLists
