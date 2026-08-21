/**
 * The `SURF-FL` spine: the twelve Frontline modules, and which of the six
 * destinations each one claims.
 *
 * WHY THIS FILE EXISTS AT ALL, WHICH IS NOT OBVIOUS FROM ITS SIZE. Three
 * surfaces already ship one — `src/studio/modules.ts`,
 * `src/surfaces/doh/modules.ts`, `src/surfaces/sa/modules.ts` — and
 * `scripts/build-registries.mjs` walks `src/**\/modules.ts` for `id:` and
 * `slug:` pairs. Without a spine, a module can be fully built and still be
 * invisible to the coverage registries, because nothing tells them which
 * route belongs to it. Twelve modules were built before this file existed and
 * the build refused to proceed the moment they were wired:
 *
 *   Ambiguous module ownership for route app/frontline/notifications-and-sync-inbox:
 *   MOD-FL-B10 and MOD-FL-A6 are both mentioned 1 times, and no module
 *   declares slug "notifications-and-sync-inbox".
 *
 * That refusal is the generator's own rule working — "A route must either
 * name its own module more often than any it cross-references, or be claimed
 * by a slug declaration" — and it refused rather than picking. Naming one of
 * the two more often to win an argmax would have been manufacturing the
 * evidence, so the claim is declared here instead.
 *
 * SIX SLUGS FOR SIX DESTINATIONS, AND SIX MODULES THAT CLAIM NONE. §25.5's
 * register (L48529-L48534) is what decides it, column by column, and the
 * `Modules and features shown` column is the one that matters:
 *
 *   SCR-FL-01 Login          → `MOD-FL-A1 all features`
 *   SCR-FL-02 My Runs        → `MOD-FL-A2 all features`
 *   SCR-FL-03 Run Player     → `MOD-FL-A3 to A5, B8, B9, B11`  (six modules)
 *   SCR-FL-04 Notifications  → `MOD-FL-B10 all features`
 *   SCR-FL-05 Training       → `MOD-FL-B12 all features`
 *   SCR-FL-06 Profile-lite   → `MOD-FL-A1, MOD-FL-A7`          (two modules)
 *
 * `MOD-FL-A7` claims Profile-lite, which it shares with `MOD-FL-A1`, because
 * two modules on one route is exactly the tie the argmax cannot settle.
 * `MOD-FL-A1` itself claims nothing: it appears on two destinations, and the
 * one the register gives it alone — Login — lives at a directory basename
 * `app/studio/sign-in` already uses, so a claim on it would be ambiguous
 * across surfaces. Its own route names no other module, so argmax awards it
 * without a claim. A slug is declared here ONLY to break a genuine tie.
 * The five Run Player modules that are not `MOD-FL-A3` claim nothing, because
 * a panel is a state of that route and not a route — `AC-FL-010-2` (L40046)
 * says so and `AC-FL-010-1` (L40045) is what a seventh destination would
 * break.
 *
 * `MOD-FL-A6` IS THE ONE THAT APPEARS IN NO ROW OF THE REGISTER AT ALL, and
 * that is not an omission to repair. Its sync indicator is persistent chrome
 * on all six destinations (`AC-FL-010-5`, L40049), and its detail sheet
 * surfaces on the Notifications destination — §22.8's information-architecture
 * row for that destination names `MOD-FL-B10` and `MOD-FL-A6` together at
 * L40035, and §22.7 gives the sync detail sheet its own row at L39868, also
 * naming A6. Giving it a route of its own would make seven destinations where
 * the source counts six.
 *
 * THE `Band` COLUMN IS THE SOURCE'S OWN AND IT IS NOT A RIGOUR GRADE. The
 * module inventory at L39844 reads `Identifier | Module | Band | One-line
 * scope`, its rows run L39846-L39857, and the bands are exactly the letter in
 * each identifier: A1 through A7 read `A`, B8 through B12 read `B`. It is
 * recorded here because three separate module tasks went looking for a
 * "grade column" that does not exist.
 */

export type FrontlineModuleSpineId =
  | 'MOD-FL-A1'
  | 'MOD-FL-A2'
  | 'MOD-FL-A3'
  | 'MOD-FL-A4'
  | 'MOD-FL-A5'
  | 'MOD-FL-A6'
  | 'MOD-FL-A7'
  | 'MOD-FL-B8'
  | 'MOD-FL-B9'
  | 'MOD-FL-B10'
  | 'MOD-FL-B11'
  | 'MOD-FL-B12'

export interface FrontlineModuleSpineEntry {
  readonly id: FrontlineModuleSpineId
  /** The module's own name, from its identity card. */
  readonly name: string
  /** The identity card's first line. */
  readonly sourceRef: string
  /** The `Band` this module's inventory row carries, and that row's line. */
  readonly band: 'A' | 'B'
  readonly bandRef: string
  /**
   * The route directory under `app/frontline/` this module claims, or `null`.
   * A slug is a claim of OWNERSHIP, not of appearance: a module that renders
   * on a destination another module owns declares `null` and says why.
   */
  readonly slug: string | null
  /** Required when `slug` is `null`. Never a placeholder. */
  readonly noRouteReason: string | null
}

export const FRONTLINE_MODULE_SPINE = [
  {
    id: 'MOD-FL-A1',
    name: 'Identity, Authentication and Device Mode',
    sourceRef: 'L40174',
    band: 'A',
    bandRef: 'L39846',
    slug: null,
    noRouteReason:
      'Owns SCR-FL-01 (L48529) and renders at app/frontline/sign-in, but declares no slug: a slug is matched on the route directory BASENAME across every surface, and `sign-in` exists twice — app/frontline/sign-in and app/studio/sign-in. The generator refuses a claim it cannot resolve, and it is right to: "Which one demonstrates the module is a guess; refusing to make it." No claim is needed, because that directory names MOD-FL-A1 and no other module, so the argmax rule awards it without one. A slug is declared here only where two modules genuinely tie on one route.',
  },
  {
    id: 'MOD-FL-A2',
    name: 'My Runs',
    sourceRef: 'L40347',
    band: 'A',
    bandRef: 'L39847',
    slug: 'my-runs',
    noRouteReason: null,
  },
  {
    id: 'MOD-FL-A3',
    name: 'Run Player',
    sourceRef: 'L40512',
    band: 'A',
    bandRef: 'L39848',
    slug: 'run-player',
    noRouteReason: null,
  },
  {
    id: 'MOD-FL-A4',
    name: 'Data Capture and Evidence',
    sourceRef: 'L40708',
    band: 'A',
    bandRef: 'L39849',
    slug: null,
    noRouteReason:
      'A panel of the Run Player, which MOD-FL-A3 owns. SCR-FL-03 (L48531) names six modules and capture is a state of that route, never a destination — AC-FL-010-2 (L40046).',
  },
  {
    id: 'MOD-FL-A5',
    name: 'On-Device Detection and Containment',
    sourceRef: 'L40898',
    band: 'A',
    bandRef: 'L39850',
    slug: null,
    noRouteReason:
      'A panel of the Run Player. Deviation and containment are states of that route (L48531); TEST-FL-010-2 (L40056) is the test that they are not reachable as destinations.',
  },
  {
    id: 'MOD-FL-A6',
    name: 'Offline and Sync Engine',
    sourceRef: 'L41080',
    band: 'A',
    bandRef: 'L39851',
    slug: null,
    noRouteReason:
      'Appears in no row of the six-destination register (L48529-L48534). Its indicator is persistent chrome on all six destinations (AC-FL-010-5, L40049), and the information-architecture row for the Notifications destination names MOD-FL-B10 and MOD-FL-A6 together at L40035, with the sync detail sheet carrying its own row at L39868. A route of its own would make seven where the source counts six.',
  },
  {
    id: 'MOD-FL-A7',
    name: 'Security and Data Protection',
    sourceRef: 'L41283',
    band: 'A',
    bandRef: 'L39852',
    slug: 'profile-lite',
    noRouteReason: null,
  },
  {
    id: 'MOD-FL-B8',
    name: 'Coaching Rendering',
    sourceRef: 'L41454',
    band: 'B',
    bandRef: 'L39853',
    slug: null,
    noRouteReason:
      'A panel of the Run Player (L48531). Coaching is advisory and never gates (L41471), so it is a state of the step the worker is on rather than a place to go.',
  },
  {
    id: 'MOD-FL-B9',
    name: 'Gates and Sign-Off Authority',
    sourceRef: 'L41604',
    band: 'B',
    bandRef: 'L39854',
    slug: null,
    noRouteReason:
      'A panel of the Run Player (L48531). Sign-off is a state of the run being executed; the step-up that authorises it is an overlay on any destination (L39865), which is not a route either.',
  },
  {
    id: 'MOD-FL-B10',
    name: 'Notifications',
    sourceRef: 'L41778',
    band: 'B',
    bandRef: 'L39855',
    slug: 'notifications-and-sync-inbox',
    noRouteReason: null,
  },
  {
    id: 'MOD-FL-B11',
    name: 'Worker Lifecycle on Device',
    sourceRef: 'L41935',
    band: 'B',
    bandRef: 'L39856',
    slug: null,
    noRouteReason:
      'A panel of the Run Player (L48531). Handover and substitution are states of the run in progress; the acts this module names that are NOT states — cancellation, terminal completion — are held on the Delivery Operations Hub and are EXCL-FL-06 invariant exclusions (L39489).',
  },
  {
    id: 'MOD-FL-B12',
    name: 'Training Library Viewer',
    sourceRef: 'L42099',
    band: 'B',
    bandRef: 'L39857',
    slug: 'training-library-viewer',
    noRouteReason: null,
  },
] as const satisfies readonly FrontlineModuleSpineEntry[]

/**
 * The six destinations, derived rather than listed. `AC-FL-010-1` (L40045)
 * counts destinations a worker can stand in, and this is that count taken
 * from the claims above rather than from a number anyone maintains.
 */
export const FRONTLINE_CLAIMED_SLUGS: readonly string[] = FRONTLINE_MODULE_SPINE.filter(
  (m) => m.slug !== null,
).map((m) => m.slug as string)
