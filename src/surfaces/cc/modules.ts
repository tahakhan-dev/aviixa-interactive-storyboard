/**
 * The `SURF-CC` spine: the thirteen Client Command Center modules, and which
 * of the thirteen screens each one claims.
 *
 * WHY THIS FILE EXISTS BEFORE ANY COMMAND CENTER MODULE DOES. Slice 9 is the
 * whole surface — thirteen modules, thirteen screens, a closed action set of
 * ten — and none of it is built. `scripts/build-registries.mjs` walks
 * `src/**\/modules.ts` for `id:` and `slug:` pairs, so without a spine a
 * Command Center module can be fully built and still invisible to the
 * coverage registries. That is what happened to the Frontline: twelve
 * modules were built before `src/frontline/modules.ts` existed and the
 * generator refused the moment the routes were wired. The keys are settled
 * here once instead of by thirteen tasks each choosing.
 *
 * THE INVENTORY IS THIRTEEN AND THE SOURCE SAYS SO IN ITS OWN WORDS. §21.1.5
 * carries the table: header L35184, separator L35185, thirteen data rows
 * L35186-L35198, introduced at L35182 — "The module map at §6.1.6 lists
 * exactly thirteen modules". The criterion is `AC-CC-040` (L35261) — "The
 * surface exposes exactly thirteen modules; no fourteenth module route
 * exists." Its second clause is what decides `MOD-CC-02` below.
 *
 * ELEVEN SLUGS FOR THIRTEEN SCREENS, AND TWO MODULES THAT CLAIM NONE. The
 * §25.5 screen register (header L48384, separator L48385, data
 * L48386-L48398) is what decides it, and the `Modules and features shown`
 * column is the one that matters:
 *
 *   SCR-CC-01 Sign-in                   → `Reuses MOD-DOH-09`      (no CC module)
 *   SCR-CC-02 Live shift board          → `MOD-CC-01, MOD-CC-02`   (two modules)
 *   SCR-CC-03 Cell view                 → `MOD-CC-03 FEAT-CC-0301` (one feature)
 *   SCR-CC-04 Run drill-down            → `MOD-CC-03 all features`
 *   SCR-CC-05 Deviation workspace       → `MOD-CC-04 all features`
 *   SCR-CC-06 Governance gate queue     → `MOD-CC-05 all features`
 *   SCR-CC-07 Learned-change approvals  → `MOD-CC-06 all features`
 *   SCR-CC-08 Agent activity panel      → `MOD-CC-08 all features`
 *   SCR-CC-09 Alert and escalation feed → `MOD-CC-09 all features`
 *   SCR-CC-10 Sync-conflict review      → `MOD-CC-10 all features`
 *   SCR-CC-11 Reports and Builder       → `MOD-CC-11 all features`
 *   SCR-CC-12 Shift handoff panel       → `MOD-CC-12 all features`
 *   SCR-CC-13 Learning read view        → `MOD-CC-06 FEAT-CC-0603, MOD-CC-07`
 *
 * A SLUG IS A CLAIM OF OWNERSHIP, NEVER OF APPEARANCE. Three consequences,
 * each read off that column rather than assumed:
 *
 *  - `MOD-CC-03` appears on TWO rows and one module owns at most one route —
 *    the generator throws outright on a second. It owns SCR-CC-04, which
 *    shows `all features`; SCR-CC-03 shows one feature of it and is claimed
 *    by nobody, so argmax awards that route when slice 9 builds it.
 *  - `MOD-CC-06` is the same shape and owns SCR-CC-07 for the same reason.
 *    That leaves SCR-CC-13 shared between `MOD-CC-06` and `MOD-CC-07`, which
 *    is exactly the tie argmax cannot settle, so `MOD-CC-07` declares it.
 *    `MOD-FL-A7` claims `profile-lite` on that same reasoning.
 *  - `MOD-CC-02` and `MOD-CC-13` claim nothing, and their reasons are on
 *    their own records below rather than here, because each is a ruling in
 *    its own right.
 *
 * NO ROUTE DIRECTORY IS BUILT YET, AND THE DECLARATIONS ARE STILL SAFE.
 * `scripts/build-registries.mjs` skips a declared slug whose directory does
 * not exist — its own comment calls that "declared, not built" and leaves the
 * module honestly not-represented — so nothing here moves a coverage row
 * before slice 9 earns it. What the declarations buy now is the collision
 * check: a slug is matched on the route directory BASENAME across EVERY
 * surface, not within `app/command-center/`, and two directories carrying a
 * claimed name is a hard refusal. `sign-in` already exists twice
 * (`app/frontline/sign-in` and `app/studio/sign-in`), which is why
 * `MOD-FL-A1` had to abstain, and why no module here may ever claim
 * SCR-CC-01 — a third directory of that name would refuse the build even if
 * a Command Center module owned that screen, and none does. Every slug below
 * was checked against the basename of every route directory on disk, and
 * `tests/unit/cc-spine.test.ts` re-runs that check off the tree rather than
 * off this list.
 */

export type CcModuleId =
  | 'MOD-CC-01'
  | 'MOD-CC-02'
  | 'MOD-CC-03'
  | 'MOD-CC-04'
  | 'MOD-CC-05'
  | 'MOD-CC-06'
  | 'MOD-CC-07'
  | 'MOD-CC-08'
  | 'MOD-CC-09'
  | 'MOD-CC-10'
  | 'MOD-CC-11'
  | 'MOD-CC-12'
  | 'MOD-CC-13'

export interface CcModuleSpineEntry {
  readonly id: CcModuleId
  /** Verbatim from the inventory's `Module name` column. */
  readonly name: string
  /** The identity card's own first line — its `**Identity.**` paragraph. */
  readonly sourceRef: string
  /** The `Source section` the inventory row carries, and that row's line. */
  readonly sourceSection: string
  readonly inventoryRef: string
  /** The chapter section that specifies it, from the same inventory row. */
  readonly specSection: string
  /**
   * The route directory under `app/command-center/` this module claims, or
   * `null`. Ownership, not appearance: a module that renders on a screen
   * another module owns declares `null` and says why.
   */
  readonly slug: string | null
  /** Required when `slug` is `null`. Never a placeholder. */
  readonly noRouteReason: string | null
}

export const CC_MODULE_SPINE = [
  {
    id: 'MOD-CC-01',
    name: 'Live shift board',
    sourceRef: 'L36225',
    sourceSection: '§6.3',
    inventoryRef: 'L35186',
    specSection: 'Section 21.4',
    slug: 'live-shift-board',
    noRouteReason: null,
  },
  {
    id: 'MOD-CC-02',
    name: 'Sync state and connectivity',
    sourceRef: 'L36433',
    sourceSection: '§6.2',
    inventoryRef: 'L35187',
    specSection: 'Section 21.5',
    slug: null,
    noRouteReason:
      'Surface chrome, never a route. The register puts it on SCR-CC-02 (L48387) beside MOD-CC-01, whose own module name IS that screen\'s name, so the board is MOD-CC-01\'s and the freshness marker, the device list and the connectivity banner ride on it. Routing it would invent a fourteenth Command Center screen against a register of thirteen, which AC-CC-040 (L35261) forbids: "The surface exposes exactly thirteen modules; no fourteenth module route exists." Its own concentration row agrees — MOD-CC-02 (L35244) makes the Supervisor its principal user and the Tenant Admin a secondary one for the banner, an appearance on someone else\'s screen either way.',
  },
  {
    id: 'MOD-CC-03',
    name: 'Run and exception drill-down',
    sourceRef: 'L36624',
    sourceSection: '§6.4',
    inventoryRef: 'L35188',
    specSection: 'Section 21.6',
    slug: 'run-drill-down',
    noRouteReason: null,
  },
  {
    id: 'MOD-CC-04',
    name: 'Deviation workspace and evidence review',
    sourceRef: 'L36802',
    sourceSection: '§6.5',
    inventoryRef: 'L35189',
    specSection: 'Section 21.7',
    slug: 'deviation-workspace',
    noRouteReason: null,
  },
  {
    id: 'MOD-CC-05',
    name: 'Governance gate queue',
    sourceRef: 'L37033',
    sourceSection: '§6.6',
    inventoryRef: 'L35190',
    specSection: 'Section 21.8',
    slug: 'governance-gate-queue',
    noRouteReason: null,
  },
  {
    id: 'MOD-CC-06',
    name: 'Learned-change approvals',
    sourceRef: 'L37257',
    sourceSection: '§6.7',
    inventoryRef: 'L35191',
    specSection: 'Section 21.9',
    slug: 'learned-change-approvals',
    noRouteReason: null,
  },
  {
    id: 'MOD-CC-07',
    name: 'Feedback signal capture',
    sourceRef: 'L37477',
    sourceSection: '§6.8',
    inventoryRef: 'L35192',
    specSection: 'Section 21.10',
    slug: 'learning-read-view',
    noRouteReason: null,
  },
  {
    id: 'MOD-CC-08',
    name: 'Agent activity panel',
    sourceRef: 'L37640',
    sourceSection: '§6.9',
    inventoryRef: 'L35193',
    specSection: 'Section 21.11',
    slug: 'agent-activity-panel',
    noRouteReason: null,
  },
  {
    id: 'MOD-CC-09',
    name: 'Alert and escalation feed',
    sourceRef: 'L37832',
    sourceSection: '§6.10',
    inventoryRef: 'L35194',
    specSection: 'Section 21.12',
    slug: 'alert-and-escalation-feed',
    noRouteReason: null,
  },
  {
    id: 'MOD-CC-10',
    name: 'Sync-conflict review panel',
    sourceRef: 'L38054',
    sourceSection: '§6.11',
    inventoryRef: 'L35195',
    specSection: 'Section 21.13',
    slug: 'sync-conflict-review-panel',
    noRouteReason: null,
  },
  {
    id: 'MOD-CC-11',
    name: 'Standard reports and Custom Report Builder',
    sourceRef: 'L38253',
    sourceSection: '§6.12',
    inventoryRef: 'L35196',
    specSection: 'Section 21.14',
    slug: 'reports-and-report-builder',
    noRouteReason: null,
  },
  {
    id: 'MOD-CC-12',
    name: 'Shift handoff panel',
    sourceRef: 'L38459',
    sourceSection: '§6.13',
    inventoryRef: 'L35197',
    specSection: 'Section 21.15',
    slug: 'shift-handoff-panel',
    noRouteReason: null,
  },
  {
    id: 'MOD-CC-13',
    name: 'Operational actions, the closed set of ten',
    sourceRef: 'L38651',
    sourceSection: '§6.14',
    inventoryRef: 'L35198',
    specSection: 'Section 21.16',
    slug: null,
    noRouteReason:
      'Appears in no row of the thirteen-screen register (L48386-L48398), the same gap shape as MOD-FL-A6\'s in the Frontline\'s six. It is not an omission to repair: its ten actions are exercised FROM the screens the other modules own, and the interconnection lines record that one action at a time — the sync-conflict module\'s reads MOD-CC-13 (L38175), "exercises action 5 of `MOD-CC-13`", and action 5 of the table is L38669, "Resolve or Resolve All sync conflicts". A route of its own would make fourteen screens where AC-SCR-CC-001 (L48492) counts thirteen.',
  },
] as const satisfies readonly CcModuleSpineEntry[]

/**
 * The eleven route keys slice 9 must build under `app/command-center/`,
 * derived from the claims above rather than kept as a second list. A twelfth
 * appearing here without a register row is a fourteenth screen by another
 * name.
 */
export const CC_CLAIMED_SLUGS: readonly string[] = CC_MODULE_SPINE.filter(
  (m) => m.slug !== null,
).map((m) => m.slug as string)

export function ccModule(id: CcModuleId): CcModuleSpineEntry {
  const found = CC_MODULE_SPINE.find((m) => m.id === id)
  if (found === undefined) throw new Error(`Unknown Command Center module: ${id}`)
  return found
}
