import type { DecisionReading } from '@/disclosure/decisions'
import type { RoleId } from '@/domain/roles'
import { routeBySurface } from '@/routes/definitions'
import { CC_EXCLUDED_ROLES, ccScreenOpensFor } from '@/surfaces/cc/access'
import { ccFallbackPatternById } from '@/surfaces/cc/fallback/patterns'
import { CC_SCREENS, ccScreen, type CcScreen, type CcScreenId } from '@/surfaces/cc/screens'

/**
 * `SCR-CC-01` — THE SIGN-IN, AND THE SURFACE EXCLUSION, AS DATA.
 *
 * ── THIS DIRECTORY AUTHORS NO ROUTE, AND THE ABSTENTION IS DECLARED HERE ──
 *
 * The dispatch for this task granted `app/command-center/<slug from the
 * spine>/**`. There is no such slug, and building any directory there would
 * turn a wave-0 sibling suite red for every task running against this tree.
 * Stated in full, because an undeclared absence is the `cc-10-s366` finding
 * and this one is deliberate:
 *
 *  - `ccScreenSlug(ccScreen('SCR-CC-01'))` returns `'sign-in'`, from
 *    `unownedSlug` on the screen record. It is the only slug the spine offers
 *    this screen.
 *  - `app/frontline/sign-in` and `app/studio/sign-in` already carry that
 *    basename, and `tests/unit/cc-spine.test.ts` asserts that the walk finds
 *    those two and no third. A `app/command-center/sign-in/` is that third.
 *  - Every other name is refused from the other side. `scripts/cc-reach.mjs`
 *    builds `expectedKeys` from the register rows whose `authoredHere` is
 *    true, and `authoredHere` is `slug !== null && slug !== 'sign-in'` — so
 *    the twelve authored keys are the whole permitted set, and a directory
 *    outside it lands in `unnamed` and the script exits non-zero AT MODULE
 *    LOAD. The owning task already ran that plant and recorded the red in
 *    `tests/unit/cc-spine-completion.test.ts`: a real
 *    `app/command-center/cc-14-scratch/page.tsx` produced
 *    "app/command-center/ holds 1 route directory/directories no register row
 *    names: cc-14-scratch", and the suite reported no tests at all.
 *
 * So the register's thirteen screens map onto twelve authored route
 * directories, and this is the row that accounts for the difference. The
 * surface already says so in four places, none of them this file: the screen
 * record's `noOwnerReason`, `scripts/cc-reach.mjs`'s `authoredHere: false`,
 * `CC_NAV`'s exclusion of `SCR-CC-01`, and the shell's own rail paragraph.
 *
 * THE WIRING, NAMED RATHER THAN LEFT TO INFERENCE. `SignInScreen` beside the
 * rail on `app/command-center/page.tsx`, the surface index — the register's
 * `Navigation entry point` for this row is "Application entry" (L48386) and
 * `/command-center` is it. That file is wave 0's and is gated on naming no
 * module identifier in its own text, so the mount is a task that owns it,
 * not this one.
 *
 * ── WHAT THIS FILE DOES NOT REBUILD ───────────────────────────────────────
 *
 * The register row is `ccScreen('SCR-CC-01')`, not a second transcription of
 * L48386. The exclusion is `CC_EXCLUDED_ROLES` and `ccScreenOpensFor`, not a
 * second door. The route layer's grant is
 * `routeBySurface('SURF-CC').allowedRoles`. The auth fallback is
 * `ccFallbackPatternById('FB-CC-AUTH')`. Every one of them is READ here and
 * the agreement between them is COMPUTED, so a change to any of them turns
 * this red rather than leaving a stale copy agreeing with itself.
 *
 * IT IS SERVER DATA AND MUST STAY SO. No `'use client'` here or on anything
 * it imports: Next replaces a client module's exports with client references
 * and every string below would be gone by the time a server component
 * prerenders it, while a component suite — which never crosses that boundary
 * — stayed green. That is how four Run Player panels shipped an undefined
 * module id.
 */

/* ==================================================================== *
 * 1. THE SCREEN, AND THE MODULE IT REUSES.
 * ==================================================================== */

export const CC_SIGN_IN_SCREEN: CcScreen = ccScreen('SCR-CC-01')

/**
 * `MOD-DOH-09`'S OWN AUTHORITY ROW DISAGREES WITH THE ROW THAT REUSES IT,
 * AND NO ACCEPTANCE CRITERION ASKS.
 *
 * Transcribed HEADER-KEYED from `MTX-TEN-02a` (L22003), whose header is
 * L22005 — `| # | Module | Tenant Admin | Supervisor | Quality Manager |
 * Read-only Auditor | Worker |` — and whose `MOD-DOH-09` row is L22015. A
 * positional read of that row against the register's role list inverts it.
 *
 * The two statements are not repairable into one another and neither is
 * chosen: the register says who may OPEN the Command Center sign-in, the
 * matrix says what each tenant role holds ON that Hub module. Under one
 * reading they are different questions; under another the surface reuses a
 * module two of its three admitted roles are `Unavailable` on. Both are
 * recorded, and the Auditor cell is the sharp end: `Read-only` there, where
 * this surface excludes the role at the door.
 */
export const CC_SIGN_IN_MOD_DOH_09_READINGS = [
  {
    text: 'SCR-CC-01 | Sign-in | Authenticate and establish scope for the shift | Supervisor, Quality Manager, Tenant Admin | Reuses MOD-DOH-09 | Application entry',
    locator: '§25.5 screen register · L48386',
  },
  {
    text: 'MOD-DOH-09 | Permissions, Roles and Access | Allowed [H17] | Unavailable | Unavailable | Read-only | Explicitly prohibited [H18]',
    locator: 'MTX-TEN-02a · L22015',
  },
] as const satisfies readonly DecisionReading[]

/* ==================================================================== *
 * 2. THE SURFACE EXCLUSION — VERIFIED, NEVER RE-IMPLEMENTED.
 * ==================================================================== */

/**
 * The exclusion asked of the three layers that already answer it, and
 * ANSWERED BY COMPUTATION. Nothing below is a written-down claim beside the
 * thing it describes; every field is derived from a module this task does not
 * own, which is the only form in which "already satisfied, do not fork it"
 * can be checked rather than asserted.
 */
export interface CcSignInExclusionCheck {
  /** `routeBySurface('SURF-CC').allowedRoles`, read. */
  readonly routeLayerGrants: readonly RoleId[]
  /** `CC_EXCLUDED_ROLES`, read. */
  readonly excludedAtTheDoor: readonly RoleId[]
  /** True when no excluded role appears in the route layer's grant. */
  readonly satisfiedAtRouteLayer: boolean
  /** True when every role the register admits is one the route layer grants. */
  readonly registerAgreesWithRouteLayer: boolean
  /** The excluded roles for which `ccScreenOpensFor` refuses this screen. */
  readonly refusedByScreenGate: readonly RoleId[]
}

const CC_ROUTE_GRANTS: readonly RoleId[] = routeBySurface('SURF-CC').allowedRoles

export const CC_SIGN_IN_EXCLUSION: CcSignInExclusionCheck = {
  routeLayerGrants: CC_ROUTE_GRANTS,
  excludedAtTheDoor: CC_EXCLUDED_ROLES,
  satisfiedAtRouteLayer: CC_EXCLUDED_ROLES.every((r) => !CC_ROUTE_GRANTS.includes(r)),
  registerAgreesWithRouteLayer: CC_SIGN_IN_SCREEN.rolesThatCanOpen.every((r) =>
    CC_ROUTE_GRANTS.includes(r),
  ),
  refusedByScreenGate: CC_EXCLUDED_ROLES.filter((r) => !ccScreenOpensFor('SCR-CC-01', r)),
}

/**
 * THE SAME EXCLUSION, THREE TOKENS, AND THE THIRD IS OUTSIDE CHAPTER 21.
 *
 * Every reading with its own locator; none chosen. The tokens are not
 * interchangeable in this build — `src/ui/WriteControl.tsx` draws
 * `explicitlyProhibited` as nothing at all and `unavailable` as a disabled
 * control carrying its reason — so a sign-in that classified the excluded
 * roles by token alone would render three different screens for one rule.
 * It renders none of them: this surface refuses the session, and that is
 * `FB-CC-AUTH` rather than a cell status.
 */
export const CC_EXCLUSION_TOKEN_READINGS = [
  {
    text: 'Open any Command Center route | Allowed with conditions — report and banner routes only | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited',
    locator: '§21.1.2 surface matrix · L35004',
  },
  {
    text: 'See the connectivity-loss banner | Allowed | Allowed | Allowed | Not applicable — no surface access | Not applicable — no surface access',
    locator: '§21.1.2 surface matrix · L35019',
  },
  {
    text: 'the Read-only Auditor is Unavailable on the Client Command Center',
    locator: '§3.5 scope row · L3799',
  },
] as const satisfies readonly DecisionReading[]

/* ==================================================================== *
 * 3. LANDING RESOLUTION — §21.1.3's OWN TABLE, AND WHAT THE REGISTER
 *    WILL AND WILL NOT SUPPORT.
 * ==================================================================== */

/**
 * §21.1.3 runs from its heading at L35053 to its traceability paragraph at
 * L35122, and the line after that one is blank — its number is deliberately
 * not spelled here, because a citation of a blank line is wrong even inside a
 * sentence saying the line is blank, and `tests/coverage/locator-fidelity`
 * has gone red on exactly that. The precedence table is header L35073,
 * separator L35074, and its rows were counted one at a time rather than
 * subtracted from a span: L35075, L35076, L35077, L35078, L35079, L35080,
 * L35081 — seven.
 *
 * The rule the table implements is stated at L35061 and it constrains what
 * may be built from this: the landing view is "a **routing default, not a
 * permission**". Nothing here filters anything.
 */
export interface CcLandingRow {
  /** Verbatim from the `Grant set held` column. */
  readonly grantSet: string
  /** Verbatim from the `Landing view` column. */
  readonly landingView: string
  /** Verbatim from the `Reason` column. */
  readonly reason: string
  /**
   * The register row this landing view names, or `null` where the table
   * resolves to no screen at all. Naming a screen is NOT a claim that the
   * register calls it a landing — `ccLandingIsRegisterNamed` asks that, off
   * the register's own `Navigation entry point` column.
   */
  readonly registerScreen: CcScreenId | null
  /** This row's own line in the precedence table. */
  readonly sourceRef: string
}

export const CC_LANDING_PRECEDENCE = [
  {
    grantSet: 'Quality Manager, with or without Supervisor',
    landingView: 'Decision queues',
    reason: 'Gate items and learned-change proposals carry timeouts',
    registerScreen: 'SCR-CC-06',
    sourceRef: 'L35075',
  },
  {
    grantSet: 'Supervisor only',
    landingView: 'Scoped live shift board',
    reason: "The board is the Supervisor's working instrument",
    registerScreen: 'SCR-CC-02',
    sourceRef: 'L35076',
  },
  {
    grantSet:
      'Supervisor or Quality Manager with Tenant or Site read scope acting as the Plant Manager persona',
    landingView: 'Cross-Area aggregate board',
    reason: 'Stated in the source for this user group',
    registerScreen: null,
    sourceRef: 'L35077',
  },
  {
    grantSet: 'Tenant Admin only',
    landingView: 'Report formats and delivery',
    reason: 'The Tenant Admin is not an in-shift actor',
    registerScreen: 'SCR-CC-11',
    sourceRef: 'L35078',
  },
  {
    grantSet: 'Tenant Admin plus an operational grant',
    landingView: "The operational grant's landing",
    reason: 'An administrator who also holds an operational role acts in that role',
    registerScreen: null,
    sourceRef: 'L35079',
  },
  {
    grantSet: 'Read-only Auditor',
    landingView: 'Not applicable — no Command Center access exists for this role',
    reason: 'Explicit exclusion',
    registerScreen: null,
    sourceRef: 'L35080',
  },
  {
    grantSet: 'Worker',
    landingView: "Not applicable — the Frontline Worker Application is the worker's surface",
    reason: 'Explicit exclusion',
    registerScreen: null,
    sourceRef: 'L35081',
  },
] as const satisfies readonly CcLandingRow[]

/**
 * Does the SCREEN REGISTER itself call this landing a landing? Asked of the
 * register's own `Navigation entry point` column rather than answered by a
 * field written beside the row, because the answer is the finding.
 *
 * Two rows say yes. `SCR-CC-02` reads "Landing for the Supervisor" (L48387)
 * and `SCR-CC-06` reads "Landing for the Quality Manager" (L48391). The
 * Tenant Admin's row points at `SCR-CC-11`, whose entry point is
 * "Main navigation" (L48396) — so the precedence table sends the Tenant Admin
 * somewhere the register does not receive them.
 */
export function ccLandingIsRegisterNamed(row: CcLandingRow): boolean {
  if (row.registerScreen === null) return false
  return /landing/i.test(ccScreen(row.registerScreen).navigationEntry)
}

/** The landings the register supports by name, derived. Never a second list. */
export const CC_REGISTER_NAMED_LANDINGS: readonly CcScreenId[] = CC_SCREENS.filter((s) =>
  /landing/i.test(s.navigationEntry),
).map((s) => s.id)

/* ==================================================================== *
 * 4. THE TENANT ADMIN, CARRIED RATHER THAN RESOLVED.
 * ==================================================================== */

/**
 * EIGHT READINGS OF ONE QUESTION AND NO IDENTIFIER TO FILE THEM UNDER.
 *
 * The question a sign-in cannot avoid: what does a Tenant Admin session
 * reach on this surface? The surface matrix answers it once, four module
 * matrices answer it more generously, the precedence table answers it a
 * fifth way, and the register declines to receive the answer.
 *
 * The reading type is the canon's `DecisionReading`, imported. It has exactly
 * two fields, `text` and `locator`, so there is nowhere on a reading to mark
 * one as the winner — not a `preferred` flag, not an `adopted` field. This
 * is a `readonly DecisionReading[]` rather than the `TwoReadings` pair
 * `src/surfaces/cc/decisions/disclosure.ts` uses, because that type admits
 * exactly two and this is eight; that file is another task's and is not
 * edited. No `DEC-*` identifier is attached to this conflict anywhere in the
 * source, so none is minted here.
 */
export const CC_TENANT_ADMIN_READINGS = [
  {
    text: 'Open any Command Center route | Allowed with conditions — report and banner routes only',
    locator: '§21.1.2 surface matrix · L35004',
  },
  {
    text: 'View the cross-Area rolled-up board | Allowed with conditions — requires Tenant or Site read scope',
    locator: 'MOD-CC-01 §21.4 matrix · L36265',
  },
  {
    text: 'See the freshness marker on any element | Allowed',
    locator: 'MOD-CC-02 §21.5 matrix · L36452',
  },
  {
    text: 'See run completion states | Read-only',
    locator: 'MOD-CC-02 §21.5 matrix · L36456',
  },
  {
    text: 'See the cross-Area agent health roll-up | Allowed with conditions — requires Tenant or Site read scope',
    locator: 'MOD-CC-08 §21.11 matrix · L37670',
  },
  {
    text: 'See the unacknowledged-brief flag | Allowed with conditions — where holding Tenant or Site read scope',
    locator: 'MOD-CC-12 §21.15 matrix · L38488',
  },
  {
    text: 'Tenant Admin only | Report formats and delivery | The Tenant Admin is not an in-shift actor',
    locator: '§21.1.3 precedence table · L35078',
  },
  {
    text: 'SCR-CC-11 | Reports and Custom Report Builder | Tenant Admin, Quality Manager | Main navigation',
    locator: '§25.5 screen register · L48396',
  },
] as const satisfies readonly DecisionReading[]

/**
 * Why this is not resolved here, stated once so no reader has to reconstruct
 * it. The two rows that look like a resolution are L35078 and L35079, and
 * L34961 carries the same sentence in prose outside the table — but a
 * resolution would have to choose between "report and banner routes only"
 * and four module matrices that grant boards, markers, roll-ups and flags,
 * and nothing in the source performs that choice.
 */
export const CC_TENANT_ADMIN_UNRESOLVED =
  'The Tenant Admin landing is not computed on this screen. Eight statements are carried above ' +
  'with their locators and none is adopted: the surface matrix restricts the role to report and ' +
  'banner routes, four module matrices grant it board, marker, roll-up and flag capabilities ' +
  'beyond that, the precedence table sends it to report formats and delivery, and the screen ' +
  'register receives that screen from main navigation rather than as a landing. A landing chosen ' +
  'here would be this build answering a question the source answers four ways.'

/* ==================================================================== *
 * 5. WHAT THIS SCREEN DOES WHEN AUTHENTICATION FAILS.
 * ==================================================================== */

/**
 * `FB-CC-AUTH`, READ FROM THE WAVE-0 REGISTRY. There is no degraded-auth
 * mode to build: the pattern's `Decision controls` cell is "Unavailable" and
 * its `Client-side queueing` cell is "Not applicable — session denied", which
 * is the whole of it. Note the shape of that refusal — `FB-CC-SESS` and
 * `FB-CC-WRITE` read "None, deliberately", the stronger statement, because a
 * write exists on those paths and is still not queued. This one has no write
 * because it has no session.
 */
export const CC_SIGN_IN_FALLBACK = ccFallbackPatternById('FB-CC-AUTH')

/**
 * The five sign-in tests the source names for this screen's own section,
 * carried as what they are — the source's tests, not this build's. They are
 * why no partial-session state is modelled: `TEST-CC-014` asserts that a
 * failed authorisation service opens NO session, and `TEST-CC-015` that
 * recovery opens a normal one with no pre-failure session restored.
 */
export const CC_SIGN_IN_SOURCE_TESTS = [
  {
    text: 'TEST-CC-014 (failure) — Fail the authorisation service; assert no session opens and an access-denial audit entry exists.',
    locator: 'TEST-CC-014 · L35048',
  },
  {
    text: 'TEST-CC-015 (recovery) — Restore the authorisation service; assert normal session opening and no restored pre-failure session.',
    locator: 'TEST-CC-015 · L35049',
  },
  {
    text: 'TEST-CC-023 (denial) — Open a session as Read-only Auditor; assert no landing view resolves.',
    locator: 'TEST-CC-023 · L35119',
  },
] as const satisfies readonly DecisionReading[]
