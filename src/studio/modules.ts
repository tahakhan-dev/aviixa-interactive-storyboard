/**
 * The SURF-STU spine, part 1 of 3: the eighteen derived Studio modules,
 * their route slugs, the persona vocabulary the twenty-six Studio matrices
 * share, and the ONE derivation of module reach. Spec §1, §4; plan C2, C3.
 *
 * THE COUNT IS DERIVED AND SAYS SO. L30897: "The Statement of Work provides
 * no canonical module count for the Standards and Operations Studio." The
 * eighteen come from one stated rule (L30899) — "One module per numbered
 * section of Part V, in section order, with the section's own heading as the
 * module name" — recorded as `DEC-STUDIO-001`, with three alternatives
 * rejected on the record (L30901-L30907). `AC-STU-014` (L30992) binds THIS
 * BUILD'S own documents and screens too, so every place the count renders
 * carries the qualifier and the decision reference. See
 * `app/studio/StudioShell.tsx`.
 *
 * NAMES ARE CANONICAL, IDS ARE ANNOTATIONS (D1). Catalogue B
 * (`SCR-STU-01`…`15`, L48259-L48273) is the route key's ANNOTATION, never
 * the route key itself; every `slug` below is a plain name and no slug is a
 * screen number. Unlike slice 4's `SCR-DOH-23`/`SCR-DOH-023` collision the
 * two Studio catalogues share no token — there is no three-digit form — so
 * they collide on COVERAGE rather than identity, and the five modules
 * catalogue B does not name declare that rather than borrowing a row.
 *
 * THIS FILE ALSO OWNS THE MATRIX-ROW VOCABULARY the Studio matrices share:
 * the persona columns, the row's surface classification, and the reach rule
 * that reads them. It owns them because reach is computed FROM those rows —
 * a rule that lives beside the thing it reads cannot be applied to
 * seventeen modules and forgotten on the eighteenth. It does NOT own a cell
 * status union (the nine `PermissionOutcome` tokens of `@/policy/decision`
 * are the surface's status vocabulary, shared from slice 2a — spec §4), and
 * it does NOT own any module's cells: `MOD-STU-18`'s consolidated matrix is
 * Task 6's data (plan C19, C20).
 *
 * THE RULE LIVES HERE; THE MATRICES DO NOT REACH IT AT RUNTIME (C3). The
 * SURF-DOH spine documents what happens otherwise: deriving reach by
 * importing the matrices pointed the shared contract at its own consumers,
 * closed a real value cycle, and survived only because the field was a
 * getter. So the rule is applied ONCE, at build time, by
 * `scripts/build-stu-module-reach.mjs`, which writes
 * `registries/generated/stu/module-reach.json`; this file imports that
 * answer and nothing else. That generator also refuses to write anything if
 * a file under `src/` value-imports `app/`, so the edge that created the
 * cycle cannot be drawn again.
 */
import type { RoleId } from '@/domain/roles'
import type { PermissionOutcome } from '@/policy/decision'
import GENERATED from '../../registries/generated/stu/module-reach.json' with { type: 'json' }

export type StudioModuleId =
  | 'MOD-STU-01'
  | 'MOD-STU-02'
  | 'MOD-STU-03'
  | 'MOD-STU-04'
  | 'MOD-STU-05'
  | 'MOD-STU-06'
  | 'MOD-STU-07'
  | 'MOD-STU-08'
  | 'MOD-STU-09'
  | 'MOD-STU-10'
  | 'MOD-STU-11'
  | 'MOD-STU-12'
  | 'MOD-STU-13'
  | 'MOD-STU-14'
  | 'MOD-STU-15'
  | 'MOD-STU-16'
  | 'MOD-STU-17'
  | 'MOD-STU-18'

/* ==================================================================== *
 * THE PERSONA COLUMNS — the source's own eight, not five roles plus
 * three inventions.
 * ==================================================================== */

/**
 * THE EIGHT COLUMNS the consolidated Studio permission matrix heads
 * (the header row at L34539, introduced at L34537), and the vocabulary
 * every Studio matrix keys its cells on.
 *
 * IT IS NOT THE FIVE TENANT ROLES. Three of the eight are not roles at all,
 * and collapsing them onto roles is what would make every cell below them
 * unreadable:
 *
 * - `supervisor-with-authoring-grant` and `supervisor-without-grant`
 *   are one role split by a GRANT. "Authoring is a capability, not a sixth
 *   role" (`FUNC-STU-18-02-A-1`, L34584) — and the two columns disagree on
 *   fifteen of the twenty-three consolidated rows, so merging them would
 *   have to pick one and silently lose the other.
 * - `plant-manager-persona` is `DEC-ROLE-001`, preserved rather than
 *   resolved (L34522). §5.18's table is headed **Fixed role** and includes
 *   Plant Manager; §3.5 fixes exactly five roles and does not. Both
 *   readings stand, and this blueprint "treats Plant Manager as a persona
 *   whose Studio access is delivered by a Supervisor role without the
 *   authoring grant".
 * - `implementation-team` is `GRANT-STU-IMPL`, "a provisioned,
 *   temporary authoring capacity during onboarding — author and submit
 *   only, fully audited, revoked at onboarding's end" (L34520). The source
 *   states no role that carries it, so `deliveredByRole` is `null` and says so
 *   rather than being pinned to a role the source never named.
 */
export type StudioPersonaId =
  | 'quality-manager'
  | 'supervisor-with-authoring-grant'
  | 'supervisor-without-grant'
  | 'plant-manager-persona'
  | 'tenant-admin'
  | 'read-only-auditor'
  | 'worker'
  | 'implementation-team'

/**
 * WHETHER THIS PERSONA MAY OPEN THE STUDIO AT ALL — row 1 of the
 * consolidated matrix, "Open the Studio" (L34541).
 *
 * THREE VALUES, AND THE THIRD IS THE POINT. The route registry
 * (`src/routes/definitions.ts`) answers the same question for SURF-DOH with
 * a role list, and a list can only say yes or no. The source's own answer
 * here has a third value: the Read-only Auditor's cell reads
 * `Client Decision Required — DEC-AUDSTU-001` at L34541, and `AC-STU-157` (L34674)
 * requires it to stay that way — "the Read-only Auditor's Studio access is
 * not assumed". Reading it as a refusal is the live defect plan C16 names;
 * reading it as a grant asserts an access the source withholds. So the
 * shell reads THIS, and `tests/component/stu-shell.test.tsx` cross-checks
 * it against the route registry everywhere the registry can answer, with
 * the one exemption named.
 */
export type StudioSurfaceAccess =
  | 'permitted'
  | 'permitted-with-conditions'
  | 'client-decision-open'
  | 'explicitly-prohibited'

export const STUDIO_SURFACE_ACCESS = [
  'permitted',
  'permitted-with-conditions',
  'client-decision-open',
  'explicitly-prohibited',
] as const satisfies readonly StudioSurfaceAccess[]

type MissingFromSurfaceAccess = Exclude<StudioSurfaceAccess, (typeof STUDIO_SURFACE_ACCESS)[number]>
const _surfaceAccessExhaustive: MissingFromSurfaceAccess extends never ? true : never = true
void _surfaceAccessExhaustive

export interface StudioPersona {
  readonly id: StudioPersonaId
  /** The column heading, as the source writes it. */
  readonly name: string
  /**
   * WHICH REGISTRY ROLE DELIVERS THIS PERSONA'S STUDIO ACCESS, or `null`
   * where the source names none. Never guessed — `deliveryNote` states the
   * reasoning either way.
   *
   * DELIBERATELY NOT NAMED `roleId`, AND NOT THE SAME QUESTION AS
   * `PERSONA_COLUMN_ROLES` IN `@/studio/access/evaluate`. That map answers
   * "does a role of this name exist in the registry" and reads `null` for
   * the Plant Manager persona, because this build mints no Plant Manager
   * role and `tests/unit/roles.test.ts` pins that. This field answers
   * `DEC-ROLE-001`'s own sentence instead (L34522) — the persona's Studio
   * access "is delivered by a Supervisor role without the authoring grant"
   * — so it reads `SUPERVISOR`. Two true answers to two different
   * questions; giving them the same field name is what would make them
   * look like a contradiction.
   */
  readonly deliveredByRole: RoleId | null
  readonly deliveryNote: string
  /** Row 1 of the consolidated matrix, L34541. */
  readonly studioAccess: StudioSurfaceAccess
  /** What that access costs or is conditioned on, in one sentence. */
  readonly accessNote: string
  readonly sourceRef: string
}

export const STU_PERSONAS = [
  {
    id: 'quality-manager',
    name: 'Quality Manager',
    deliveredByRole: 'QUALITY_MANAGER',
    deliveryNote: 'One of the five fixed tenant roles (§3.5), carrying the authoring grant by default.',
    studioAccess: 'permitted',
    accessNote:
      'Full authoring across all nine sections, and Release Authority by tenant default.',
    sourceRef: 'L34514 (five-role table), L34539 (matrix header), L34541 (Open the Studio)',
  },
  {
    id: 'supervisor-with-authoring-grant',
    name: 'Supervisor with GRANT-STU-AUTHOR',
    deliveredByRole: 'SUPERVISOR',
    deliveryNote:
      'The Supervisor role with the authoring grant applied — a quality engineer staffed in this role. Authoring is a capability, not a sixth role (L34584).',
    studioAccess: 'permitted',
    accessNote:
      'Creates and authors, acts as Reviewer on submissions they did not author, and cannot approve or release.',
    sourceRef: 'L34515 (five-role table), L34539 (matrix header), L34541 (Open the Studio)',
  },
  {
    id: 'supervisor-without-grant',
    name: 'Supervisor without the grant',
    deliveredByRole: 'SUPERVISOR',
    deliveryNote:
      'The same fixed role without the authoring grant. The two columns disagree on most rows, so they are two personas over one role, never one merged column.',
    studioAccess: 'permitted',
    accessNote:
      'Read-only access to published Workflow content for reference. No access to drafts or in-review versions.',
    sourceRef: 'L34515 (five-role table), L34539 (matrix header), L34541 (Open the Studio)',
  },
  {
    id: 'plant-manager-persona',
    name: 'Plant Manager persona',
    deliveredByRole: 'SUPERVISOR',
    deliveryNote:
      'DEC-ROLE-001, preserved rather than resolved (L34522): §5.18 heads its table "Fixed role" and includes Plant Manager, while §3.5 fixes exactly five roles and does not. This build treats it as "a persona whose Studio access is delivered by a Supervisor role without the authoring grant", and records the divergence.',
    studioAccess: 'permitted',
    accessNote:
      'Read-only access to published Workflow content. No access to drafts or in-review versions; cannot edit.',
    sourceRef: 'L34516 (five-role table), L34522 (DEC-ROLE-001), L34539, L34541',
  },
  {
    id: 'tenant-admin',
    name: 'Tenant Admin',
    deliveredByRole: 'TENANT_ADMIN',
    deliveryNote: 'One of the five fixed tenant roles (§3.5).',
    studioAccess: 'permitted',
    accessNote:
      'Administers Studio capacities and reads published content; holds no stage of the approval chain, for separation of duties.',
    sourceRef: 'L34517 (five-role table), L34539 (matrix header), L34541 (Open the Studio)',
  },
  {
    id: 'read-only-auditor',
    name: 'Read-only Auditor',
    deliveredByRole: 'READONLY_AUDITOR',
    deliveryNote:
      'One of the five fixed tenant roles (§3.5), and the one §5.18’s five-row table does not enumerate at all.',
    studioAccess: 'client-decision-open',
    accessNote:
      'DEC-AUDSTU-001 is open and is not guessed here. The cost of the alternative is stated by the source itself: an auditor with no Studio access must depend on the audited party to produce the approval log and the diff, "which weakens the audit" (L34524).',
    sourceRef: 'L34524 (DEC-AUDSTU-001), L34539, L34541, AC-STU-157 L34674',
  },
  {
    id: 'worker',
    name: 'Frontline Worker',
    deliveredByRole: 'WORKER',
    deliveryNote: 'One of the five fixed tenant roles (§3.5).',
    studioAccess: 'explicitly-prohibited',
    accessNote:
      'AC-STU-150 (L34667): "A Worker cannot reach any Studio route by any means." Workers meet Workflow content exclusively through the Frontline surface during Run execution (L34518).',
    sourceRef: 'L34518 (five-role table), L34539, L34541, AC-STU-150 L34667',
  },
  {
    id: 'implementation-team',
    name: 'Implementation team (GRANT-STU-IMPL)',
    deliveredByRole: null,
    deliveryNote:
      'The source states no role that carries this grant — only that the client’s implementation team holds "a provisioned, temporary authoring capacity during onboarding" (L34520). No role is invented for it here, so the route registry cannot be cross-checked against this persona and the test that does that check exempts it by name.',
    studioAccess: 'permitted-with-conditions',
    accessNote:
      'Author and submit only, fully audited, revoked at onboarding’s end. Holds no stage of the approval chain (L34520, §5.11.4).',
    sourceRef: 'L34520 (the implementation team’s capacity), L34539, L34541',
  },
] as const satisfies readonly StudioPersona[]

type MissingFromPersonas = Exclude<StudioPersonaId, (typeof STU_PERSONAS)[number]['id']>
const _personasExhaustive: MissingFromPersonas extends never ? true : never = true
void _personasExhaustive

export const STUDIO_PERSONA_IDS = STU_PERSONAS.map((p) => p.id)

export function stuPersonaById(
  personas: readonly StudioPersona[],
  id: StudioPersonaId,
): StudioPersona {
  const found = personas.find((p) => p.id === id)
  if (!found) throw new Error(`Unknown SURF-STU persona: ${id}`)
  return found
}

/* ==================================================================== *
 * THE ROW CLASSIFICATION AND THE ONE REACH RULE.
 * ==================================================================== */

/**
 * WHERE THE CAPABILITY A MATRIX ROW NAMES IS MET.
 *
 * A PERMISSION MATRIX ROW IS NOT ALWAYS ABOUT THE SCREEN THAT PRINTS IT.
 * The Hub learned this expensively: its `rolesReaching` was hand-written,
 * scanned whole columns, and counted chrome banners as module standing, so
 * a role that held nothing but a banner read as a module user. The same
 * three classes are real here, and two of them matter immediately:
 *
 * - `screen` — the row names a capability of this module's own screen. It
 *   stays `screen` when the answer is "refused for everyone": a row whose
 *   every cell prohibits is still this screen's own disclosure that it
 *   offers nothing.
 * - `chrome` — the shell draws it on every Studio route, outside whatever
 *   the module rail offers. Two rows of the consolidated matrix are this
 *   shape: "Open the Studio" (L34541), which is the surface-level question
 *   this file's `studioAccess` carries, and "Use any Studio capability
 *   while offline" (row 23, L34563), which is the connectivity axis.
 *
 *   ROW 23 IS THE TRAP, AND CLAUSE ONE IS WHAT DISARMS IT. It reads
 *   `Unavailable` in seven of its eight columns. `Unavailable` is
 *   overloaded across two senses that render oppositely (inherited from
 *   slice 4, not re-litigated): on the CONNECTIVITY axis it is sense A —
 *   DISABLED with the condition named — and on the ROLE axis it is sense B,
 *   ABSENT (D9). Counting row 23 as a screen row would withhold every
 *   Studio module from every persona on a row that says only "the Studio
 *   requires an active connection". It is chrome, and the rule never reads
 *   it.
 * - `another-surface` — the capability IS met, but not on a Studio screen:
 *   the Client Command Center, the Delivery Operations Hub's tenant
 *   administration area, the device, or the platform console. This is R22's
 *   five cross-surface statements — the package build, the clearance grant,
 *   the worker profile field, the rebase, the action bundle — and a Studio
 *   screen can only describe them. The reservation keeps it honest:
 *   `another-surface` means somebody, somewhere, holds it. A capability
 *   that exists NOWHERE is a `screen` row whose every cell refuses.
 */
export type StudioMatrixRowSurface = 'screen' | 'chrome' | 'another-surface'

export const STUDIO_MATRIX_ROW_SURFACES = [
  'screen',
  'chrome',
  'another-surface',
] as const satisfies readonly StudioMatrixRowSurface[]

type MissingFromRowSurfaces = Exclude<
  StudioMatrixRowSurface,
  (typeof STUDIO_MATRIX_ROW_SURFACES)[number]
>
const _rowSurfacesExhaustive: MissingFromRowSurfaces extends never ? true : never = true
void _rowSurfacesExhaustive

/**
 * WHAT A MODULE'S ROUTE IS TO ONE PERSONA. Three values, and the third is
 * not a shade of either other one.
 *
 * NEVER COLLAPSED ONTO TWO. `DEC-AUDSTU-001` puts forty-seven cells across
 * fifteen matrices at `Client Decision Required`, and `AC-STU-157` (L34674)
 * forbids assuming either answer. A boolean here would have to pick one:
 * `withheld` pre-empts the decision in the direction the criterion names,
 * and `offered` asserts an access the source withholds. So the state is its
 * own, it renders with the decision identifier, and a client search on
 * `DEC-AUDSTU-001` finds every place it binds.
 */
export type StudioModuleReachState = 'offered' | 'withheld' | 'client-decision-open'

export const STUDIO_MODULE_REACH_STATES = [
  'offered',
  'withheld',
  'client-decision-open',
] as const satisfies readonly StudioModuleReachState[]

type MissingFromReachStates = Exclude<
  StudioModuleReachState,
  (typeof STUDIO_MODULE_REACH_STATES)[number]
>
const _reachStatesExhaustive: MissingFromReachStates extends never ? true : never = true
void _reachStatesExhaustive

/**
 * The reach map for one module: every persona answered, none omitted. A
 * `Partial` here would let a missing key read as "withheld" without anybody
 * writing that down, which is the blank-cell defect L10238 names.
 */
export type StudioModuleReach = Readonly<Record<StudioPersonaId, StudioModuleReachState>>

/** What one cell contributes to the reach question. */
type ReachContribution = 'holds' | 'refuses' | 'open'

/**
 * A TOTAL map over the nine `PermissionOutcome` tokens, not a lookup with a
 * fallback: a tenth outcome fails to compile here instead of normalising to
 * `undefined` and quietly reaching every module.
 *
 * The two offline tokens map to `holds` on their own meaning — a cached
 * read is a read, a queued write is a write that was accepted — but neither
 * may legitimately appear on this surface at all: the Studio has no offline
 * mode, `STATE-07` renders nowhere (D22), and "nothing on this surface ever
 * queues a write" (D4). That surface-level refusal is enforced where it
 * belongs, in `scripts/build-stu-module-reach.mjs`, which rejects a matrix
 * carrying either rather than folding the rule into this general one.
 */
const CONTRIBUTION: Readonly<Record<PermissionOutcome, ReachContribution>> = {
  allowed: 'holds',
  allowedWithConditions: 'holds',
  readOnly: 'holds',
  cachedReadOnlyOffline: 'holds',
  queuedOffline: 'holds',
  unavailable: 'refuses',
  explicitlyProhibited: 'refuses',
  clientDecisionRequired: 'open',
  notApplicable: 'refuses',
}

/**
 * WHO REACHES A MODULE'S ROUTE — the ONE implementation of the rule, and
 * the only thing a module's reach is allowed to be.
 *
 * THE RULE, in one sentence with two clauses that both do work:
 *
 *   over this module's OWN SCREEN ROWS ONLY, a persona is offered the route
 *   when some cell lets it read or act; failing that, it is an open client
 *   decision when some cell defers to one; failing both, the route is
 *   withheld.
 *
 * CLAUSE ONE, `surface === 'screen'`, is what stops chrome and another
 * surface from counting as module standing — see `StudioMatrixRowSurface`
 * above for the two rows on this surface where it is load-bearing.
 *
 * CLAUSE TWO is the precedence between a grant and an open decision, and it
 * is deliberate: a persona holding something real on this screen is offered
 * the route, and the open decision only settles a column with nothing else
 * in it. The Read-only Auditor's columns are exactly that shape.
 *
 * A MATRIX WITH NO SCREEN ROW CANNOT ANSWER, and this says so rather than
 * returning a map that reads as "withheld from everyone" — the difference
 * between a build that stops and a module that silently reaches nobody.
 * This is an integrity failure of the data, not an expected path, so it
 * throws; every expected outcome is one of the three states.
 */
export function reachByStudioMatrix<Row extends { readonly surface: StudioMatrixRowSurface }>(
  rows: readonly Row[],
  statusOf: (row: Row, persona: StudioPersonaId) => PermissionOutcome,
): StudioModuleReach {
  const screenRows = rows.filter((row) => row.surface === 'screen')
  if (screenRows.length === 0) {
    throw new Error(
      'reachByStudioMatrix: no row is classified `screen`. Clause one of the rule reads that ' +
        'classification; without it the module reaches nobody, and writing that down would be a ' +
        'silent withdrawal rather than an answer.',
    )
  }
  const entries = STU_PERSONAS.map((persona) => {
    const column = screenRows.map((row) => CONTRIBUTION[statusOf(row, persona.id)])
    const state: StudioModuleReachState = column.includes('holds')
      ? 'offered'
      : column.includes('open')
        ? 'client-decision-open'
        : 'withheld'
    return [persona.id, state] as const
  })
  return Object.fromEntries(entries) as StudioModuleReach
}

/* ==================================================================== *
 * THE EIGHTEEN MODULES.
 * ==================================================================== */

/**
 * A module catalogue B has no row for. Five modules are in this position,
 * and each states where its screen actually is rather than borrowing the
 * nearest catalogue-B id — which is what D1 refuses.
 */
export interface StudioUncataloguedScreen {
  /** One sentence: which screen this module's content is on, and why. */
  readonly note: string
  readonly sourceRef: string
}

export interface StudioModuleDefinition {
  readonly id: StudioModuleId
  /** Canonical name — the source's own derived inventory, L30913-L30930. */
  readonly name: string
  /** Which inventory row this name is from. */
  readonly sourceRef: string
  /** One sentence, quoted from the module card's own Purpose field. */
  readonly purpose: string
  readonly purposeRef: string
  /**
   * URL segment under `/studio/`, a plain name, never a bare number and
   * never a screen id (D1). `null` for the two modules the source renders
   * inside another module's screen and gives no route of their own; the
   * reason is on `noRouteReason` and is never blank.
   */
  readonly slug: string | null
  readonly noRouteReason: string | null
  /**
   * Set where catalogue B carries no row naming this module. `null` where
   * it does — `stuScreensForModule` in `@/studio/screens` is then the
   * annotation, read from the source's own "Modules and features shown"
   * column.
   */
  readonly uncataloguedScreen: StudioUncataloguedScreen | null
  /**
   * WHICH PERSONAS ARE OFFERED THIS MODULE'S ROUTE, or `null` while this
   * module's own permission matrix has not been built.
   *
   * DERIVED, NEVER TYPED, AND NOT DERIVED HERE. Every entry reads it from
   * `registries/generated/stu/module-reach.json`, which
   * `scripts/build-stu-module-reach.mjs` writes by applying
   * `reachByStudioMatrix` — the function directly above, the one and only
   * implementation — to that module's own matrix. There is no second copy
   * of the rule and no second copy of the answer.
   *
   * `null` IS THE HONEST ANSWER TODAY AND IS NOT AN EMPTY MAP. Eighteen
   * module tasks follow this one; until a module's matrix lands there is
   * nothing to derive from, and a map of eighteen `withheld` entries would
   * be a derivation that never ran, dressed as one that did. The shell
   * fails closed on `null` — it lists the module, offers no link, and says
   * why — which is `AC-STU-155`'s "every unavailable capability is shown
   * with its specific missing condition named" (L34672) applied to this
   * build's own state rather than to the product's.
   *
   * A GENERATED FILE SOMEBODY CAN OPEN IS NOT A HAND-MAINTAINED FIELD, and
   * three things stop it becoming one: `pnpm build` re-runs the generator,
   * so an edit survives only until the next build; the annotation below is
   * a total `Record<StudioModuleId, …>`, so a module id deleted from the
   * file fails `tsc` rather than becoming a module nobody reaches; and
   * `reachOf` rejects any key that is not one of the eight personas and any
   * value that is not one of the three states, so a typo throws at import
   * rather than quietly shrinking a rail.
   */
  readonly reach: StudioModuleReach | null
  /**
   * Whether this module's route exists in the tree yet — derived at build
   * time by the same generator from `app/studio/<slug>/page.tsx`, for the
   * same reason as `reach`: eighteen tasks land these routes one at a time,
   * and a hand-maintained boolean would be wrong the moment one did. A
   * module index that links a route nothing exports is slice 4's defect
   * shape 5 — a screen pointing at content that is not there.
   */
  readonly routeBuilt: boolean
}

/* -------------------------------------------------------------------- *
 * The generated answers, read once and validated at the boundary.
 * -------------------------------------------------------------------- */

interface GeneratedModuleEntry {
  readonly matrixPath: string | null
  readonly reach: Readonly<Record<string, string>> | null
  readonly routePath: string | null
}

/**
 * The annotation is the compile-time half of the guard: a `StudioModuleId`
 * missing from the JSON fails `tsc` here rather than becoming a module that
 * reaches nobody.
 */
const GENERATED_MODULES: Readonly<Record<StudioModuleId, GeneratedModuleEntry>> = GENERATED.modules

const PERSONA_IDS: readonly string[] = STU_PERSONAS.map((p) => p.id)
const REACH_STATES: readonly string[] = STUDIO_MODULE_REACH_STATES

/**
 * One module's generated reach, narrowed by CHECKING rather than by
 * asserting — which is what makes the runtime half of the guard real. A
 * cast would have been the short way to write this and would have shipped
 * the typo instead: a persona key the vocabulary does not know, or a fourth
 * state, throws at import.
 */
function reachOf(id: StudioModuleId): StudioModuleReach | null {
  const generated = GENERATED_MODULES[id].reach
  if (generated === null) return null
  const keys = Object.keys(generated)
  const badKey = keys.find((k) => !PERSONA_IDS.includes(k))
  const badValue = Object.entries(generated).find(([, v]) => !REACH_STATES.includes(v))
  if (badKey !== undefined || badValue !== undefined || keys.length !== PERSONA_IDS.length) {
    throw new Error(
      `registries/generated/stu/module-reach.json: ${id} carries a reach map this vocabulary does ` +
        `not recognise (${JSON.stringify(generated)}). Re-run \`pnpm build:registries\`.`,
    )
  }
  return generated as StudioModuleReach
}

// Same widening hazard as `ROLES` and `DOH_MODULES`: a plain
// `: readonly StudioModuleDefinition[]` annotation would widen the const and
// make the exhaustiveness check below vacuous. `as const satisfies` keeps
// every `id` literal narrowed to `StudioModuleId`.
export const STU_MODULES = [
  {
    id: 'MOD-STU-01',
    name: 'Charter and Position',
    sourceRef: 'L30913',
    purpose:
      'Establish and enforce the Studio’s authority boundary: enable, configure, compose; never define',
    purposeRef: 'L31565',
    slug: 'capabilities',
    noRouteReason: null,
    uncataloguedScreen: {
      note: 'Catalogue B names no screen for MOD-STU-01. Its Atomic Capabilities view is catalogue A’s SCR-STU-CAPS; catalogue B’s SCR-STU-13 row names MOD-STU-02 and MOD-STU-15 only, so no catalogue-B row is borrowed for it here.',
      sourceRef: 'L31084 (catalogue A); L48271 (catalogue B, SCR-STU-13)',
    },
    reach: reachOf('MOD-STU-01'),
    routeBuilt: GENERATED_MODULES['MOD-STU-01'].routePath !== null,
  },
  {
    id: 'MOD-STU-02',
    name: 'Agent Configuration',
    sourceRef: 'L30914',
    purpose:
      'Supply each standard agent with the operating parameters it requires, carried inside authored Workflow content',
    purposeRef: 'L31699',
    slug: 'agents',
    noRouteReason: null,
    uncataloguedScreen: null,
    reach: reachOf('MOD-STU-02'),
    routeBuilt: GENERATED_MODULES['MOD-STU-02'].routePath !== null,
  },
  {
    id: 'MOD-STU-03',
    name: 'Workflow Library and Tenant Workspace',
    sourceRef: 'L30915',
    purpose:
      'Hold, classify, filter, and expose the tenant’s complete Workflow inventory with authoring status, version, and linkage',
    purposeRef: 'L31886',
    // C13: renamed from `library` — two route directories differing by one
    // character from `content-libraries` is a glob and an import waiting to
    // resolve to the wrong module.
    slug: 'workflow-library',
    noRouteReason: null,
    uncataloguedScreen: null,
    reach: reachOf('MOD-STU-03'),
    routeBuilt: GENERATED_MODULES['MOD-STU-03'].routePath !== null,
  },
  {
    id: 'MOD-STU-04',
    name: 'Workflow Builder',
    sourceRef: 'L30916',
    purpose:
      'Set Workflow-level settings and defaults, and assemble the screen sequence and branch targets that are simultaneously the worker’s path and the sequence-detection reference',
    purposeRef: 'L32053',
    slug: 'builder',
    noRouteReason: null,
    uncataloguedScreen: null,
    reach: reachOf('MOD-STU-04'),
    routeBuilt: GENERATED_MODULES['MOD-STU-04'].routePath !== null,
  },
  {
    id: 'MOD-STU-05',
    name: 'Screen Authoring — the Nine Configuration Sections',
    sourceRef: 'L30917',
    purpose:
      'Configure every screen the worker meets, supplying each agent capability with the information it requires',
    purposeRef: 'L32210',
    slug: 'screen-configuration',
    noRouteReason: null,
    uncataloguedScreen: null,
    reach: reachOf('MOD-STU-05'),
    routeBuilt: GENERATED_MODULES['MOD-STU-05'].routePath !== null,
  },
  {
    id: 'MOD-STU-06',
    name: 'Shared Instruction Blocks',
    sourceRef: 'L30918',
    purpose:
      'Author instruction context once at Workflow level and apply it to any number of screens within that Workflow',
    purposeRef: 'L32450',
    slug: 'instruction-blocks',
    noRouteReason: null,
    uncataloguedScreen: null,
    reach: reachOf('MOD-STU-06'),
    routeBuilt: GENERATED_MODULES['MOD-STU-06'].routePath !== null,
  },
  {
    id: 'MOD-STU-07',
    name: 'Content Libraries',
    sourceRef: 'L30919',
    purpose:
      'Hold the tenant’s reusable containment checklists, approved coaching assets, and escalation routing templates, referenced by pointer from screens',
    purposeRef: 'L32587',
    // C13: renamed from `libraries` — see MOD-STU-03.
    slug: 'content-libraries',
    noRouteReason: null,
    uncataloguedScreen: null,
    reach: reachOf('MOD-STU-07'),
    routeBuilt: GENERATED_MODULES['MOD-STU-07'].routePath !== null,
  },
  {
    id: 'MOD-STU-08',
    name: 'Training Library',
    sourceRef: 'L30920',
    purpose:
      'Author, version, and publish long-form instructional content delivered online-only and excluded from the offline work package',
    purposeRef: 'L32809',
    slug: 'training-library',
    noRouteReason: null,
    uncataloguedScreen: null,
    reach: reachOf('MOD-STU-08'),
    routeBuilt: GENERATED_MODULES['MOD-STU-08'].routePath !== null,
  },
  {
    id: 'MOD-STU-09',
    name: 'Work-Instruction Difficulty Levels',
    sourceRef: 'L30921',
    purpose:
      'Provide three reviewed renderings of the same instruction content so each worker reads at the depth that suits them, without any variation in what the platform enforces',
    purposeRef: 'L32956',
    slug: null,
    noRouteReason:
      'No route of its own. The three renderings are authored inside Section 1 of SCR-STU-04, MOD-STU-05’s screen configuration panel; a separate route would invent a second authoring path for one body of content.',
    uncataloguedScreen: {
      note: 'Catalogue B carries no row for MOD-STU-09. Its content is authored in Section 1 of SCR-STU-04.',
      sourceRef: 'L48262 (SCR-STU-04); module card L32953',
    },
    reach: reachOf('MOD-STU-09'),
    routeBuilt: GENERATED_MODULES['MOD-STU-09'].routePath !== null,
  },
  {
    id: 'MOD-STU-10',
    name: 'Parts-Registry Authoring Seam',
    sourceRef: 'L30922',
    purpose:
      'Let an author reference a part that does not yet exist without leaving the authoring context or stalling on master data',
    purposeRef: 'L33105',
    slug: null,
    noRouteReason:
      'No route of its own. The whole module is an inline mini-form inside SCR-STU-04 — leaving the authoring context is the thing it exists to avoid, so a route would contradict its purpose.',
    uncataloguedScreen: {
      note: 'Catalogue B carries no row for MOD-STU-10. Catalogue A’s SCR-STU-PARTADD, the inline part mini-form, is registered as a sub-view of SCR-STU-04 rather than minted as a screen id (D1).',
      sourceRef: 'L31088 (catalogue A); L48262 (SCR-STU-04)',
    },
    reach: reachOf('MOD-STU-10'),
    routeBuilt: GENERATED_MODULES['MOD-STU-10'].routePath !== null,
  },
  {
    id: 'MOD-STU-11',
    name: 'Approval Workflow',
    sourceRef: 'L30923',
    purpose:
      'Enforce three-stage human sign-off with separation of duties on every piece of content that reaches the frontline',
    purposeRef: 'L33262',
    slug: 'approvals',
    noRouteReason: null,
    uncataloguedScreen: null,
    reach: reachOf('MOD-STU-11'),
    routeBuilt: GENERATED_MODULES['MOD-STU-11'].routePath !== null,
  },
  {
    id: 'MOD-STU-12',
    name: 'Versioning and Publication',
    sourceRef: 'L30924',
    purpose:
      'Mint, classify, describe, distribute, compare, archive, and export Workflow versions, and make the version number the audit receipt for which limits were in force',
    purposeRef: 'L33450',
    slug: 'versions',
    noRouteReason: null,
    uncataloguedScreen: null,
    reach: reachOf('MOD-STU-12'),
    routeBuilt: GENERATED_MODULES['MOD-STU-12'].routePath !== null,
  },
  {
    id: 'MOD-STU-13',
    name: 'Qualification Requirements',
    sourceRef: 'L30925',
    purpose:
      'State authoritatively which certifications a Workflow and its individual screens require, at two levels, validated at three points',
    purposeRef: 'L33627',
    slug: 'qualification-requirements',
    noRouteReason: null,
    uncataloguedScreen: null,
    reach: reachOf('MOD-STU-13'),
    routeBuilt: GENERATED_MODULES['MOD-STU-13'].routePath !== null,
  },
  {
    id: 'MOD-STU-14',
    name: 'Offline Package',
    sourceRef: 'L30926',
    purpose:
      'Define, build, deliver, and pin the complete self-sufficient bundle a device needs to render, evaluate, and enforce a Run alone',
    purposeRef: 'L33814',
    slug: 'work-package',
    noRouteReason: null,
    uncataloguedScreen: {
      note: 'Catalogue B carries no row for MOD-STU-14. Its view is the storyboard SB-STU-17, the read-only package contents view, which the Studio and the Delivery Operations Hub both present; no catalogue-B id is borrowed for it.',
      sourceRef: 'L33905 (SB-STU-17)',
    },
    reach: reachOf('MOD-STU-14'),
    routeBuilt: GENERATED_MODULES['MOD-STU-14'].routePath !== null,
  },
  {
    id: 'MOD-STU-15',
    name: 'Agent Builder',
    sourceRef: 'L30927',
    purpose:
      'Enable atomic capabilities within entitlement and compose, evaluate, approve, deploy, and map tenant reasoning agents',
    purposeRef: 'L34001',
    // Shares the `agents` route with MOD-STU-02: catalogue B's SCR-STU-13
    // "Agent configuration and Agent Builder" merges what catalogue A splits
    // into SCR-STU-CAPS and SCR-STU-AGENT, and one screen is one route.
    slug: 'agents',
    noRouteReason: null,
    uncataloguedScreen: null,
    reach: reachOf('MOD-STU-15'),
    routeBuilt: GENERATED_MODULES['MOD-STU-15'].routePath !== null,
  },
  {
    id: 'MOD-STU-16',
    name: 'Memory and the Two-Lane Learning Loop',
    sourceRef: 'L30928',
    purpose:
      'Write the Studio’s authored content into memory, refine selection automatically inside authored boundaries, and route any proposed change to a configured value through a single human decision',
    purposeRef: 'L34186',
    slug: 'learning',
    noRouteReason: null,
    uncataloguedScreen: {
      note: 'Catalogue B carries no row for MOD-STU-16. Catalogue A’s SCR-STU-LEARN, the learning read view, is rendered on its own route and annotated SCR-STU-13, minting no new screen id (D1, plan C12); catalogue B’s SCR-STU-13 row itself names MOD-STU-02 and MOD-STU-15 only.',
      sourceRef: 'L31086 (catalogue A); L48271 (catalogue B, SCR-STU-13)',
    },
    reach: reachOf('MOD-STU-16'),
    routeBuilt: GENERATED_MODULES['MOD-STU-16'].routePath !== null,
  },
  {
    id: 'MOD-STU-17',
    name: 'Localisation',
    sourceRef: 'L30929',
    purpose:
      'Hold per-locale authored variants inside one Workflow and block publication in any locale whose worker-facing content is incomplete',
    purposeRef: 'L34368',
    slug: 'localisation',
    noRouteReason: null,
    uncataloguedScreen: null,
    reach: reachOf('MOD-STU-17'),
    routeBuilt: GENERATED_MODULES['MOD-STU-17'].routePath !== null,
  },
  {
    id: 'MOD-STU-18',
    name: 'Permissions and Roles in the Studio',
    sourceRef: 'L30930',
    purpose:
      'Gate every Studio capability by role and grant, and enforce a separation-of-duties floor that no tenant can widen',
    purposeRef: 'L34533',
    // Catalogue B gives this module two screens — SCR-STU-15 Studio
    // permissions and grants, and SCR-STU-01 Sign-in. `permissions-and-grants`
    // is the module's own route; the sign-in route is registered on the
    // screen rather than here, because a module has one slug and two screens.
    slug: 'permissions-and-grants',
    noRouteReason: null,
    uncataloguedScreen: null,
    reach: reachOf('MOD-STU-18'),
    routeBuilt: GENERATED_MODULES['MOD-STU-18'].routePath !== null,
  },
] as const satisfies readonly StudioModuleDefinition[]

// Compile-time exhaustiveness check, same shape as `PERMISSION_OUTCOMES` in
// `@/policy/decision.ts`: fails to compile if `StudioModuleId` gains or
// loses a member that `STU_MODULES` does not list exactly once.
type MissingFromStudioModules = Exclude<StudioModuleId, (typeof STU_MODULES)[number]['id']>
const _studioModulesExhaustive: MissingFromStudioModules extends never ? true : never = true
void _studioModulesExhaustive

/**
 * Every reader takes its register as a parameter. A module-load snapshot
 * closed over inside a reader is the defect that shipped three times in
 * slice 4 — a control that did nothing because the filter it drove had
 * captured the register at import.
 */
export function stuModuleById(
  modules: readonly StudioModuleDefinition[],
  id: StudioModuleId,
): StudioModuleDefinition {
  const found = modules.find((m) => m.id === id)
  if (!found) throw new Error(`Unknown SURF-STU module: ${id}`)
  return found
}

/**
 * What this module's route is to this persona — the ONE place a rail or an
 * index asks, computed here so no component has to.
 *
 * `null` reach is `withheld`, deliberately and fail-closed: an underived
 * answer is not a grant. The caller distinguishes the two by reading
 * `module.reach === null` itself, so the reason can be stated on screen
 * instead of an absence being drawn with no explanation.
 */
export function stuModuleReachFor(
  module: StudioModuleDefinition,
  persona: StudioPersonaId,
): StudioModuleReachState {
  return module.reach === null ? 'withheld' : module.reach[persona]
}

/** The modules whose route this persona is offered, in canonical order. */
export function stuModulesReachedBy(
  modules: readonly StudioModuleDefinition[],
  persona: StudioPersonaId,
): readonly StudioModuleDefinition[] {
  return modules.filter(
    (m: StudioModuleDefinition) =>
      m.slug !== null && m.routeBuilt && stuModuleReachFor(m, persona) !== 'withheld',
  )
}
