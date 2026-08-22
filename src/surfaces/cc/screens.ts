import type { RoleId } from '@/domain/roles'
import { CC_MODULE_SPINE, ccModule, type CcModuleId } from './modules'

/* ==================================================================== *
 * THE `SCR-CC-*` CATALOGUE — thirteen screens, one register.
 *
 * ONE REGISTER, NOT TWO, AND THAT WAS CHECKED RATHER THAN ASSUMED. The
 * Frontline needed RULING FL-1 because two registers both called themselves
 * "the screen register" and shared six tokens. The Command Center does not
 * have that problem: `SCR-CC-01` through `SCR-CC-13` each occur exactly
 * TWICE in the frozen source — once as a register row (L48386-L48398) and
 * once as a node of the navigation flowchart that follows it — and nothing
 * else in the chapter uses a numbered `SCR-CC-*` token. The chapter's other
 * ninety-odd `SCR-CC-*` tokens are storyboard identifiers in a different
 * shape entirely (`SCR-CC-BOARD-01`, `SCR-CC-CONF-01`, `SCR-CC-DEVWS-05`),
 * so they cannot collide with a numbered one. No ruling is needed here, and
 * writing one would be a second spelling of a decision the source already
 * makes.
 *
 * THE IDENTIFIER IS STILL NOT A ROUTE KEY. That much DOES transfer, from
 * `src/studio/screens.ts` and `src/frontline/screens.ts` alike: routes are
 * keyed on `slug`, a plain name, and `slug` lives on the module spine so
 * there is exactly one spelling of it. A screen's route is DERIVED from its
 * owning module — see `ccScreenSlug` — rather than restated here.
 *
 * TWO SCREENS THAT NO COMMAND CENTER MODULE OWNS, and neither is a defect:
 *
 *  - `SCR-CC-01` Sign-in reads `Reuses MOD-DOH-09` (L48386). It is the Hub's
 *    module rendered here, so no `MOD-CC-*` may claim it — and could not
 *    anyway, because `sign-in` is a route directory basename that already
 *    exists twice and `scripts/build-registries.mjs` refuses a claim it
 *    cannot resolve.
 *  - `SCR-CC-03` Cell view shows `MOD-CC-03 FEAT-CC-0301` (L48388) — one
 *    feature of a module whose `all features` row is `SCR-CC-04` (L48389).
 *    One module owns at most one route, so `MOD-CC-03` claims the drill-down
 *    and the cell view is left to the generator's argmax rule, which can
 *    settle it because no second module is named on that row.
 *
 * `MOD-CC-02` IS ON THIS REGISTER AND STILL OWNS NO SCREEN. It shares
 * `SCR-CC-02` with `MOD-CC-01` (L48387), and the ruling is on its own spine
 * record. It is named here in `modulesShown` because the register names it;
 * appearing in a `modulesShown` list is precisely NOT a claim of ownership,
 * which is the distinction this whole file turns on.
 * ==================================================================== */

export type CcScreenId =
  | 'SCR-CC-01'
  | 'SCR-CC-02'
  | 'SCR-CC-03'
  | 'SCR-CC-04'
  | 'SCR-CC-05'
  | 'SCR-CC-06'
  | 'SCR-CC-07'
  | 'SCR-CC-08'
  | 'SCR-CC-09'
  | 'SCR-CC-10'
  | 'SCR-CC-11'
  | 'SCR-CC-12'
  | 'SCR-CC-13'

export interface CcScreen {
  readonly id: CcScreenId
  /** Verbatim from the `Screen name` column. */
  readonly name: string
  /** Verbatim from the `Purpose` column. */
  readonly purpose: string
  /** Verbatim from the `Roles that can open it` column. */
  readonly rolesColumn: string
  /**
   * That column read onto the platform's role identifiers. It is a
   * transcription of the column and nothing more: `SCR-CC-10` reads
   * "Supervisor for viewing, Quality Manager for resolution", and BOTH may
   * open it — what each may then DO is the module's permission matrix, not
   * this list.
   */
  readonly rolesThatCanOpen: readonly RoleId[]
  /** Verbatim from the `Modules and features shown` column. */
  readonly modulesShown: string
  /** Verbatim from the `Navigation entry point` column. */
  readonly navigationEntry: string
  /** This row's own line in the register. */
  readonly registerRef: string
  /** The module that OWNS this route, or `null`. */
  readonly owningModule: CcModuleId | null
  /** Required exactly when `owningModule` is `null`. Never a placeholder. */
  readonly noOwnerReason: string | null
  /**
   * Required exactly when `owningModule` is `null` and a route is still
   * needed, so the route key is settled here rather than invented by
   * whichever slice-9 task builds the directory. `null` where no route
   * exists to name.
   */
  readonly unownedSlug: string | null
}

const SUP = 'SUPERVISOR' satisfies RoleId
const QM = 'QUALITY_MANAGER' satisfies RoleId
const TA = 'TENANT_ADMIN' satisfies RoleId

export const CC_SCREENS = [
  {
    id: 'SCR-CC-01',
    name: 'Sign-in',
    purpose: 'Authenticate and establish scope for the shift',
    rolesColumn: 'Supervisor, Quality Manager, Tenant Admin',
    rolesThatCanOpen: [SUP, QM, TA],
    modulesShown: 'Reuses MOD-DOH-09',
    navigationEntry: 'Application entry',
    registerRef: 'L48386',
    owningModule: null,
    noOwnerReason:
      "The register names the Delivery Operations Hub's own identity module, not a Command Center one, so no MOD-CC-* owns this screen. A slug could not be declared for it in any case: scripts/build-registries.mjs matches a slug on the route directory basename across every surface, and app/frontline/sign-in and app/studio/sign-in already carry that name.",
    unownedSlug: 'sign-in',
  },
  {
    id: 'SCR-CC-02',
    name: 'Live shift board',
    purpose: 'Show where attention is needed, what is normal, and what cannot be seen',
    rolesColumn: 'Supervisor, Quality Manager, Tenant Admin',
    rolesThatCanOpen: [SUP, QM, TA],
    modulesShown: 'MOD-CC-01, MOD-CC-02',
    navigationEntry: 'Landing for the Supervisor',
    registerRef: 'L48387',
    owningModule: 'MOD-CC-01',
    noOwnerReason: null,
    unownedSlug: null,
  },
  {
    id: 'SCR-CC-03',
    name: 'Cell view',
    purpose: "Show one cell's active runs, deviations, coaching activity, and devices",
    rolesColumn: 'Supervisor, Quality Manager',
    rolesThatCanOpen: [SUP, QM],
    modulesShown: 'MOD-CC-03 FEAT-CC-0301',
    navigationEntry: 'Live shift board',
    registerRef: 'L48388',
    owningModule: null,
    noOwnerReason:
      'Shows ONE feature of MOD-CC-03, whose `all features` row is SCR-CC-04. One module owns at most one route — the generator throws on a second — so MOD-CC-03 claims the drill-down and leaves this route to the argmax rule, which can settle it because the row names no second module to tie with.',
    unownedSlug: 'cell-view',
  },
  {
    id: 'SCR-CC-04',
    name: 'Run drill-down',
    purpose:
      "Show one run's progress, step states, captures, and flags against its pinned version",
    rolesColumn: 'Supervisor, Quality Manager',
    rolesThatCanOpen: [SUP, QM],
    modulesShown: 'MOD-CC-03 all features',
    navigationEntry: 'Cell view',
    registerRef: 'L48389',
    owningModule: 'MOD-CC-03',
    noOwnerReason: null,
    unownedSlug: null,
  },
  {
    id: 'SCR-CC-05',
    name: 'Deviation workspace and evidence review',
    purpose: 'Meet the agent-assembled deviation record and disposition it',
    rolesColumn: 'Supervisor, Quality Manager',
    rolesThatCanOpen: [SUP, QM],
    modulesShown: 'MOD-CC-04 all features',
    navigationEntry: 'Alert feed, board tile, or run drill',
    registerRef: 'L48390',
    owningModule: 'MOD-CC-04',
    noOwnerReason: null,
    unownedSlug: null,
  },
  {
    id: 'SCR-CC-06',
    name: 'Governance gate queue',
    purpose: 'Decide proposed interventions beyond pre-authorised policy',
    rolesColumn: 'Quality Manager',
    rolesThatCanOpen: [QM],
    modulesShown: 'MOD-CC-05 all features',
    navigationEntry: 'Landing for the Quality Manager',
    registerRef: 'L48391',
    owningModule: 'MOD-CC-05',
    noOwnerReason: null,
    unownedSlug: null,
  },
  {
    id: 'SCR-CC-07',
    name: 'Learned-change approvals',
    purpose: 'Decide Lane B proposals with their evidence and scope',
    rolesColumn: 'Quality Manager',
    rolesThatCanOpen: [QM],
    modulesShown: 'MOD-CC-06 all features',
    navigationEntry: 'Quality Manager landing',
    registerRef: 'L48392',
    owningModule: 'MOD-CC-06',
    noOwnerReason: null,
    unownedSlug: null,
  },
  {
    id: 'SCR-CC-08',
    name: 'Agent activity panel',
    purpose: 'Show what the agents have done and whether they are healthy',
    rolesColumn: 'Supervisor, Quality Manager, Tenant Admin',
    rolesThatCanOpen: [SUP, QM, TA],
    modulesShown: 'MOD-CC-08 all features',
    navigationEntry: 'Main navigation',
    registerRef: 'L48393',
    owningModule: 'MOD-CC-08',
    noOwnerReason: null,
    unownedSlug: null,
  },
  {
    id: 'SCR-CC-09',
    name: 'Alert and escalation feed',
    purpose: 'Hold every pushed event with its routing state',
    rolesColumn: 'Supervisor, Quality Manager',
    rolesThatCanOpen: [SUP, QM],
    modulesShown: 'MOD-CC-09 all features',
    navigationEntry: 'Main navigation',
    registerRef: 'L48394',
    owningModule: 'MOD-CC-09',
    noOwnerReason: null,
    unownedSlug: null,
  },
  {
    id: 'SCR-CC-10',
    name: 'Sync-conflict review panel',
    purpose: 'Review automatically resolved conflicts and handle skew-flagged ones',
    rolesColumn: 'Supervisor for viewing, Quality Manager for resolution',
    rolesThatCanOpen: [SUP, QM],
    modulesShown: 'MOD-CC-10 all features',
    navigationEntry: 'Main navigation',
    registerRef: 'L48395',
    owningModule: 'MOD-CC-10',
    noOwnerReason: null,
    unownedSlug: null,
  },
  {
    id: 'SCR-CC-11',
    name: 'Reports and Custom Report Builder',
    purpose: 'Render, save, and schedule formats over the five standard data sets',
    rolesColumn: 'Tenant Admin, Quality Manager',
    rolesThatCanOpen: [TA, QM],
    modulesShown: 'MOD-CC-11 all features',
    navigationEntry: 'Main navigation',
    registerRef: 'L48396',
    owningModule: 'MOD-CC-11',
    noOwnerReason: null,
    unownedSlug: null,
  },
  {
    id: 'SCR-CC-12',
    name: 'Shift handoff panel',
    purpose: 'Read, acknowledge, and annotate the handoff brief',
    rolesColumn: 'Supervisor, Quality Manager',
    rolesThatCanOpen: [SUP, QM],
    modulesShown: 'MOD-CC-12 all features',
    navigationEntry: 'Main navigation',
    registerRef: 'L48397',
    owningModule: 'MOD-CC-12',
    noOwnerReason: null,
    unownedSlug: null,
  },
  {
    id: 'SCR-CC-13',
    name: 'Learning read view',
    purpose: 'Read what the platform has learned, changing nothing',
    rolesColumn: 'Quality Manager',
    rolesThatCanOpen: [QM],
    modulesShown: 'MOD-CC-06 FEAT-CC-0603, MOD-CC-07',
    navigationEntry: 'Beside the learned-change queue',
    registerRef: 'L48398',
    owningModule: 'MOD-CC-07',
    noOwnerReason: null,
    unownedSlug: null,
  },
] as const satisfies readonly CcScreen[]

export function ccScreen(id: CcScreenId): CcScreen {
  const found = CC_SCREENS.find((s) => s.id === id)
  if (found === undefined) throw new Error(`Unknown Command Center screen: ${id}`)
  return found
}

/**
 * The route key for a screen, DERIVED. There is no `slug` field on a screen,
 * so an owned screen and its owning module cannot drift apart: the module
 * spine is the only place a claimed slug is spelled, and the generator reads
 * that same file.
 *
 * The throw is not defensive noise. `owningModule` pointing at a module that
 * declares no slug is the exact inversion this build is guarding against — a
 * module recorded as owning a route while abstaining from it — and it must
 * be loud rather than silently `null`.
 */
export function ccScreenSlug(screen: CcScreen): string | null {
  if (screen.owningModule === null) return screen.unownedSlug
  const owner = ccModule(screen.owningModule)
  if (owner.slug === null) {
    throw new Error(
      `${screen.id} names ${owner.id} as its owning module, and ${owner.id} declares no slug. ` +
        'A module that abstains from a route cannot own one.',
    )
  }
  return owner.slug
}

/** `/command-center/<slug>` — the one derivation, so no path is typed twice. */
export const ccPathname = (slug: string): string => `/command-center/${slug}`

/* ==================================================================== *
 * THE SHELL'S MODEL — data, not a component.
 *
 * `app/command-center/page.tsx` is a placeholder this task does not own, and
 * there is nothing to render behind a rail until slice 9 builds the screens.
 * So what ships here is the shell's INPUT: which routes exist, which roles
 * may open each, and which module claims it. A slice-9 shell reads this and
 * renders; it does not re-derive it.
 *
 * IT IS A SERVER MODULE ON PURPOSE, AND THAT IS NOT A STYLE CHOICE. Four
 * Run Player panels shipped with `data-testid="fl-panel-undefined"` in the
 * built HTML while every component test passed, because they declared their
 * panel data as a module-scope const in a `'use client'` file: Next.js
 * replaces a client module's exports with client references, so the string
 * fields are gone by the time a server component prerenders them. A
 * component suite mounts the component and never crosses that boundary. This
 * file carries no `'use client'`, and nothing here may acquire one.
 * ==================================================================== */

export interface CcNavEntry {
  readonly screen: CcScreenId
  readonly label: string
  readonly pathname: string
  readonly rolesThatCanOpen: readonly RoleId[]
  /** `null` for the two screens no Command Center module claims. */
  readonly owningModule: CcModuleId | null
}

/**
 * Every routed screen, register order. Twelve of thirteen: `SCR-CC-01` is
 * the sign-in and a surface's entry point is not a rail item, but it is
 * excluded here by having no route of its own to offer rather than by name.
 */
export const CC_NAV: readonly CcNavEntry[] = CC_SCREENS.flatMap((s) => {
  const slug = ccScreenSlug(s)
  if (slug === null || s.id === 'SCR-CC-01') return []
  return [
    {
      screen: s.id,
      label: s.name,
      pathname: ccPathname(slug),
      rolesThatCanOpen: s.rolesThatCanOpen,
      owningModule: s.owningModule,
    },
  ]
})

/**
 * The modules that render as persistent chrome rather than at a route.
 * Derived from the spine's abstentions and then narrowed to the ones the
 * register still shows, so a module that abstains because it appears NOWHERE
 * — `MOD-CC-13` — is not silently promoted to chrome by an abstention it
 * shares with `MOD-CC-02`.
 */
export const CC_CHROME_MODULES: readonly CcModuleId[] = CC_MODULE_SPINE.filter(
  (m) => m.slug === null && CC_SCREENS.some((s) => s.modulesShown.includes(m.id)),
).map((m) => m.id)
