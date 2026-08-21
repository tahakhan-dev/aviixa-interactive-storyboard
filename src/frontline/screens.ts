import type { PermissionOutcome } from '@/policy/decision'

/* ==================================================================== *
 * THE `SCR-FL-*` NAMESPACE RULING — RULING FL-1.
 *
 * TWO REGISTERS BOTH CALL THEMSELVES "THE SCREEN REGISTER", THEY SHARE THE
 * SIX TOKENS `SCR-FL-01`…`SCR-FL-06`, AND FIVE OF THE SIX DISAGREE.
 *
 *   §22.7  (header L39861, separator L39862, data L39863-L39885) — 23 rows,
 *          introduced at L39859 as "The screen register is:". It is the only
 *          register carrying the VIEWS the Run Player actually renders, and
 *          the only one with a Destination column. Its count is asserted at
 *          L39956 ("each of the twenty-three screens") and L40057 ("the
 *          twenty-three-screen register").
 *
 *   §25.5  (header L48527, separator L48528, data L48529-L48534) — 6 rows,
 *          introduced at L48525 as "Screen register — exactly six
 *          destinations." It is the only register carrying roles-that-can-
 *          open and a navigation entry point. Its count is asserted at
 *          L40045 (`AC-FL-010-1`), L48689 (`AC-SCR-FL-001`) and L48698
 *          (`TEST-SCR-FL-001`).
 *
 * Neither cross-references the other. No `DEC-*` identifier is attached to
 * the conflict anywhere in the frozen source. Either register alone reads
 * complete and self-consistent, which is why nothing prompts a check.
 *
 * WHAT DISAGREES, MEASURED: one token agrees and five do not. Every pairing
 * is carried below on the destination it belongs to, in `contested`.
 *
 * THE RULING, AND IT IS THIS BUILD'S, NOT THE SOURCE'S:
 *
 *  1. **No `SCR-FL-*` identifier is ever a route key.** Routes are keyed on
 *     `slug`, a plain name. The precedent is close but does NOT transfer
 *     unaltered: `src/studio/screens.ts` rules "NAMES ARE CANONICAL; THE IDS
 *     ARE ANNOTATIONS, NEVER ROUTE KEYS" over two Studio catalogues that
 *     SHARE NO TOKEN, so there the ids were merely redundant. Here the same
 *     token names two different screens, so an id used as a key would not be
 *     redundant — it would be wrong for one of the two readings, silently.
 *
 *  2. **§25.5 fixes the DESTINATION SET.** Six routes, because three
 *     criteria assert exactly six and none asserts anything else about
 *     destinations, and because §25.5 is the only register that says which
 *     roles may open a screen — which is what a route needs.
 *
 *  3. **§22.7's other seventeen rows are VIEWS AND OVERLAYS, never routes.**
 *     Its own Destination column says so: `SCR-FL-03` reads "Overlay on any
 *     destination" and `SCR-FL-21` reads "Full-screen interrupt". Building
 *     one route per row would create a seventh destination and fail
 *     `AC-FL-010-1` (L40045) and `TEST-FL-010-2` (L40056).
 *
 *  4. **Neither register is corrected, hidden, or averaged.** Both ship on
 *     screen with their locators, and the pick is disclosed as a
 *     CLIENT-DELEGATED CHOICE under this build's standing rule — the client
 *     delegated the decision, not the pretence that the source settled it.
 *
 * THE STRUCTURE IS WHAT HOLDS RULE 4, NOT A GUARD. A `FrontlineDestination`
 * has no `screenId: string`. The token lives in `contested`, whose shape
 * REQUIRES both readings beside it — so a task cannot write down
 * `SCR-FL-02` for My Runs without also writing what §22.7 says that token
 * names. There is no field in which a single reading could be recorded as
 * the answer.
 * ==================================================================== */

/**
 * Whether the two registers name the SAME SCREEN under one token.
 *
 * IT IS NOT A STRING COMPARISON, AND TRYING TO MAKE IT ONE IS HOW THIS GETS
 * COUNTED WRONG. `SCR-FL-01` reads "Login" in one register and "Login,
 * adapting to device mode" in the other: two wordings, one screen. Every
 * other shared token names two genuinely different screens. So agreement is
 * a judgement, and the shape forces the judgement to carry its reason —
 * `agree: true` cannot be written without saying why the two wordings are
 * the same screen, and `agree: false` cannot be written without saying what
 * each one names.
 */
export type ScreenTokenAgreement =
  | { readonly agree: true; readonly why: string }
  | { readonly agree: false; readonly whatEachNames: string }

/**
 * One `SCR-FL-*` token, with what each register says it names. Every field
 * is required; there is no shape in which a single reading could be recorded
 * as the answer.
 */
export interface ContestedScreenToken {
  /** The token itself. Never a route key. */
  readonly token: string
  /** §25.5's reading, verbatim from its "Screen name" column. */
  readonly registerA: string
  /** §25.5's line. */
  readonly registerARef: string
  /** §22.7's reading, verbatim from its "Screen or view" column. */
  readonly registerB: string
  /** §22.7's line. */
  readonly registerBRef: string
  readonly agreement: ScreenTokenAgreement
}

/**
 * How a destination behaves with the network gone, read off the source's own
 * destination-property table (header L40030, separator L40031, data
 * L40032-L40037) and mapped onto the platform's nine outcomes.
 *
 * `cachedReadOnlyOffline` is here because the source puts it here — L40035
 * reads "`Cached read-only while offline`" in full. This is the FIRST
 * surface in the build where that member and `queuedOffline` are
 * load-bearing; `src/studio/access/evaluate.ts` excludes both by
 * construction, and correctly, for its own surface.
 */
export type FrontlineOfflineAvailability = Extract<
  PermissionOutcome,
  'allowed' | 'allowedWithConditions' | 'cachedReadOnlyOffline' | 'unavailable'
>

export interface FrontlineDestination {
  /**
   * THE ROUTE KEY. A plain name, never an identifier. `pathname` is derived
   * from it, so there is no second spelling to drift.
   */
  readonly slug: string
  /** §25.5's "Screen name" column, verbatim. What the destination is called on screen. */
  readonly name: string
  /** §25.5's "Purpose" column, verbatim. */
  readonly purpose: string
  /** §25.5's "Roles that can open it" column, verbatim. Never re-derived. */
  readonly rolesThatCanOpen: string
  /** §25.5's "Modules and features shown" column, verbatim. */
  readonly modulesShown: string
  /** §25.5's "Navigation entry point" column, verbatim. */
  readonly navigationEntryPoint: string
  /** RULE 4 made structural: the token, and BOTH readings of it. */
  readonly contested: ContestedScreenToken
  readonly offline: FrontlineOfflineAvailability
  /** The offline cell's own words after the token, verbatim (L40032-L40037). */
  readonly offlineNote: string
  /** The destination-property table's "Persistent chrome" column, verbatim. */
  readonly persistentChrome: string
  /** The destination-property table's "Depth from Login" column. */
  readonly depthFromLogin: number
  readonly sourceRef: string
}

/**
 * THE SIX. Order is §25.5's own.
 *
 * ON `training-library-viewer` RATHER THAN `training-library`: the
 * destination is named "Training Library" on screen and nothing about that
 * changes. The SLUG differs because `src/studio/modules.ts` declares
 * `slug: 'training-library'` for `MOD-STU-08` and
 * `scripts/build-registries.mjs` refuses outright when two route directories
 * carry a name some module has claimed — "Which one demonstrates the module
 * is a guess; refusing to make it." The slug is a build artefact and the
 * conflict is a build fact, so the build fact is what moved. `MOD-FL-B12`'s
 * own name in the source's module inventory is "Training Library Viewer",
 * which is where this spelling comes from rather than from invention.
 */
export const FL_DESTINATIONS = [
  {
    slug: 'sign-in',
    name: 'Login',
    purpose:
      'Authenticate the identity and establish attribution, qualification, and language',
    rolesThatCanOpen: 'Worker; Supervisor for step-up',
    modulesShown: 'MOD-FL-A1 all features',
    navigationEntryPoint: 'Application entry',
    contested: {
      token: 'SCR-FL-01',
      registerA: 'Login',
      registerARef: 'L48529',
      registerB: 'Login, adapting to device mode',
      registerBRef: 'L39863',
      agreement: {
        agree: true,
        why: 'Both name the login screen. §22.7 adds "adapting to device mode", which describes the same screen rather than a different one — MOD-FL-A1 owns the Shared and Personal device modes and the login adapts to whichever the device is enrolled in. This is the one shared token on which the two registers do not conflict.',
      },
    },
    offline: 'allowedWithConditions',
    offlineNote: 'cached credentials within the offline trust window',
    persistentChrome: 'Device mode indicator',
    depthFromLogin: 0,
    sourceRef: 'L48529 (§25.5), L39863 (§22.7), L40032 (offline)',
  },
  {
    slug: 'my-runs',
    name: 'My Runs',
    purpose:
      'Present the assigned work for this identity with package readiness and sync state',
    rolesThatCanOpen: 'Worker',
    modulesShown: 'MOD-FL-A2 all features',
    navigationEntryPoint: 'After login',
    contested: {
      token: 'SCR-FL-02',
      registerA: 'My Runs',
      registerARef: 'L48530',
      registerB: 'Fast Personal Identification Number switch, Shared mode',
      registerBRef: 'L39864',
      agreement: {
        agree: false,
        whatEachNames: 'One register calls this the My Runs destination; the other calls it the fast personal-identification-number switch used on a shared device, which it places at the Login destination. Different screens, at different depths.',
      },
    },
    offline: 'allowed',
    offlineNote: 'fully offline from the local store',
    persistentChrome: 'Sync indicator, who is logged in',
    depthFromLogin: 1,
    sourceRef: 'L48530 (§25.5), L39864 (§22.7), L40033 (offline)',
  },
  {
    slug: 'run-player',
    name: 'Run Player',
    purpose: 'Execute the pinned work package end to end',
    rolesThatCanOpen: 'Worker; Supervisor within a step-up',
    modulesShown: 'MOD-FL-A3 to A5, B8, B9, B11',
    navigationEntryPoint: 'My Runs',
    contested: {
      token: 'SCR-FL-03',
      registerA: 'Run Player',
      registerARef: 'L48531',
      registerB: 'Second-identity step-up sheet',
      registerBRef: 'L39865',
      agreement: {
        agree: false,
        whatEachNames: 'One register calls this the Run Player, the destination a worker spends nearly all their time on; the other calls it the second-identity step-up sheet, whose own Destination column reads "Overlay on any destination". A full-screen destination and an overlay.',
      },
    },
    offline: 'allowed',
    offlineNote: 'fully offline from the pinned package',
    persistentChrome: 'Sync indicator',
    depthFromLogin: 2,
    sourceRef: 'L48531 (§25.5), L39865 (§22.7), L40034 (offline)',
  },
  {
    slug: 'notifications-and-sync-inbox',
    name: 'Notifications and sync inbox',
    purpose: 'Hold identity-scoped notifications and the honest sync detail',
    rolesThatCanOpen: 'Worker',
    modulesShown: 'MOD-FL-B10 all features',
    navigationEntryPoint: 'Persistent navigation',
    contested: {
      token: 'SCR-FL-04',
      registerA: 'Notifications and sync inbox',
      registerARef: 'L48532',
      registerB: 'My Runs list, Jobs with Runs beneath',
      registerBRef: 'L39866',
      agreement: {
        agree: false,
        whatEachNames: 'One register calls this the notifications and synchronisation inbox; the other calls it the My Runs list, Jobs with Runs beneath.',
      },
    },
    offline: 'cachedReadOnlyOffline',
    offlineNote:
      'back-filled content from the last sync plus live local sync detail',
    persistentChrome: 'Sync indicator',
    depthFromLogin: 2,
    sourceRef: 'L48532 (§25.5), L39866 (§22.7), L40035 (offline)',
  },
  {
    slug: 'training-library-viewer',
    name: 'Training Library',
    purpose: 'View long-form training material when connected',
    rolesThatCanOpen: 'Worker',
    modulesShown: 'MOD-FL-B12 all features',
    navigationEntryPoint: 'Persistent navigation',
    contested: {
      token: 'SCR-FL-05',
      registerA: 'Training Library',
      registerARef: 'L48533',
      registerB: 'Package readiness detail',
      registerBRef: 'L39867',
      agreement: {
        agree: false,
        whatEachNames: 'One register calls this the Training Library; the other calls it the package readiness detail, which it places on the My Runs destination.',
      },
    },
    offline: 'unavailable',
    offlineNote: 'online-only by design, excluded from the offline bundle',
    persistentChrome: 'Sync indicator',
    depthFromLogin: 2,
    sourceRef: 'L48533 (§25.5), L39867 (§22.7), L40036 (offline)',
  },
  {
    slug: 'profile-lite',
    name: 'Profile-lite',
    purpose: 'Set language preference and log out',
    rolesThatCanOpen: 'Worker',
    modulesShown: 'MOD-FL-A1, MOD-FL-A7',
    navigationEntryPoint: 'Persistent navigation',
    contested: {
      token: 'SCR-FL-06',
      registerA: 'Profile-lite',
      registerARef: 'L48534',
      registerB: 'Sync detail sheet',
      registerBRef: 'L39868',
      agreement: {
        agree: false,
        whatEachNames: 'One register calls this Profile-lite, where language preference is set and the worker logs out; the other calls it the sync detail sheet, which it places on My Runs and Notifications both.',
      },
    },
    offline: 'allowed',
    offlineNote: 'language preference and logout work offline',
    persistentChrome: 'Sync indicator',
    depthFromLogin: 2,
    sourceRef: 'L48534 (§25.5), L39868 (§22.7), L40037 (offline)',
  },
] as const satisfies readonly FrontlineDestination[]

export type FrontlineSlug = (typeof FL_DESTINATIONS)[number]['slug']

/** `/frontline/<slug>` — derived, so no second spelling of a route exists. */
export function frontlinePathname(slug: FrontlineSlug): string {
  return `/frontline/${slug}`
}

export function flDestinationBySlug(slug: FrontlineSlug): FrontlineDestination {
  const found = FL_DESTINATIONS.find((d) => d.slug === slug)
  if (found === undefined) throw new Error(`no Frontline destination for slug: ${slug}`)
  return found
}

/**
 * The five tokens the two registers read differently, and the one they do
 * not. DERIVED from the destination list rather than listed a second time,
 * so a row cannot be left out of the count by being forgotten here.
 */
export const CONTESTED_TOKENS: readonly ContestedScreenToken[] = FL_DESTINATIONS.map(
  (d) => d.contested,
).filter((c) => !c.agreement.agree)

export const AGREED_TOKENS: readonly ContestedScreenToken[] = FL_DESTINATIONS.map(
  (d) => d.contested,
).filter((c) => c.agreement.agree)

/* ==================================================================== *
 * §22.7'S OTHER SEVENTEEN ROWS — VIEWS AND OVERLAYS, NEVER ROUTES.
 *
 * WHY THE IDENTIFIERS ARE NOT SPELLED IN THE `app/` TREE, AND WHY THAT IS
 * NOT SQUEAMISHNESS. `scripts/build-registries.mjs` derives every
 * inventory's coverage status from `citedTokens` — "every identifier-shaped
 * token a shipped screen names" — and it discloses its own ceiling: "a
 * screen that names an identifier in order to record that it does NOT act on
 * it ... is cited the same as one that renders it." Printing these
 * seventeen tokens on the surface index would move seventeen rows to
 * `demonstrated-in-storyboard` on the strength of a sentence saying they are
 * not built yet. So the index renders each row by NAME and by LINE. The
 * identifiers live here, under `src/`, which that walk does not read.
 * ==================================================================== */

/** Where §22.7 itself says a row is met. Its own Destination column, verbatim. */
export type PlayerViewPlacement =
  /** A state of the Run Player route. */
  | 'run-player'
  /** A state of one of the other five destinations. */
  | 'other-destination'
  /** Its Destination column reads "Overlay on any destination". */
  | 'overlay'
  /** Its Destination column reads "Full-screen interrupt". */
  | 'full-screen-interrupt'

export interface FrontlinePlayerView {
  readonly id: string
  /** §22.7's "Screen or view" column, verbatim. */
  readonly name: string
  /** §22.7's "Destination" column, verbatim. */
  readonly destinationColumn: string
  readonly placement: PlayerViewPlacement
  readonly sourceRef: string
}

/**
 * The seventeen rows of §22.7 that are not one of the six destinations.
 * `SCR-FL-20` is here too: §22.7 gives it the Profile-lite destination, and
 * it is the same place `SCR-FL-06` names in §25.5 — one destination, two
 * tokens, which is the collision seen from the other end.
 */
export const FL_PLAYER_VIEWS = [
  {
    id: 'SCR-FL-07',
    name: 'Run Player step screen, all authored element types',
    destinationColumn: 'Run Player',
    placement: 'run-player',
    sourceRef: 'L39869',
  },
  {
    id: 'SCR-FL-08',
    name: 'Unit identification screen',
    destinationColumn: 'Run Player',
    placement: 'run-player',
    sourceRef: 'L39870',
  },
  {
    id: 'SCR-FL-09',
    name: 'Read-only review of a prior completed screen',
    destinationColumn: 'Run Player',
    placement: 'run-player',
    sourceRef: 'L39871',
  },
  {
    id: 'SCR-FL-10',
    name: 'Append-only correction sheet',
    destinationColumn: 'Run Player',
    placement: 'run-player',
    sourceRef: 'L39872',
  },
  {
    id: 'SCR-FL-11',
    name: 'Deviation capture screen',
    destinationColumn: 'Run Player',
    placement: 'run-player',
    sourceRef: 'L39873',
  },
  {
    id: 'SCR-FL-12',
    name: 'Containment checklist',
    destinationColumn: 'Run Player',
    placement: 'run-player',
    sourceRef: 'L39874',
  },
  {
    id: 'SCR-FL-13',
    name: 'Coaching card',
    destinationColumn: 'Run Player',
    placement: 'run-player',
    sourceRef: 'L39875',
  },
  {
    id: 'SCR-FL-14',
    name: 'Gate block and parked-run notice',
    destinationColumn: 'Run Player',
    placement: 'run-player',
    sourceRef: 'L39876',
  },
  {
    id: 'SCR-FL-15',
    name: 'Supervisor sign-off screen with step-up',
    destinationColumn: 'Run Player',
    placement: 'run-player',
    sourceRef: 'L39877',
  },
  {
    id: 'SCR-FL-16',
    name: 'Worker-finished completion screen',
    destinationColumn: 'Run Player',
    placement: 'run-player',
    sourceRef: 'L39878',
  },
  {
    id: 'SCR-FL-17',
    name: 'Version change notice on the first screen of the next execution',
    destinationColumn: 'Run Player',
    placement: 'run-player',
    sourceRef: 'L39879',
  },
  {
    id: 'SCR-FL-18',
    name: 'Notifications inbox',
    destinationColumn: 'Notifications',
    placement: 'other-destination',
    sourceRef: 'L39880',
  },
  {
    id: 'SCR-FL-19',
    name: 'Training Library list and viewer',
    destinationColumn: 'Training Library',
    placement: 'other-destination',
    sourceRef: 'L39881',
  },
  {
    id: 'SCR-FL-20',
    name: 'Profile-lite: language preference and logout',
    destinationColumn: 'Profile-lite',
    placement: 'other-destination',
    sourceRef: 'L39882',
  },
  {
    id: 'SCR-FL-21',
    name: 'Suspension lock screen with the fixed compliance message',
    destinationColumn: 'Full-screen interrupt',
    placement: 'full-screen-interrupt',
    sourceRef: 'L39883',
  },
  {
    id: 'SCR-FL-22',
    name: 'Step-away and hand-back sheet',
    destinationColumn: 'Run Player',
    placement: 'run-player',
    sourceRef: 'L39884',
  },
  {
    id: 'SCR-FL-23',
    name: 'Substitution handover state',
    destinationColumn: 'Run Player',
    placement: 'run-player',
    sourceRef: 'L39885',
  },
] as const satisfies readonly FrontlinePlayerView[]

/**
 * The one §22.7 row that is neither a destination nor a view of one:
 * `SCR-FL-03`, whose Destination column reads "Overlay on any destination".
 * It is held apart from `FL_PLAYER_VIEWS` because its token is one of the
 * six contested ones — recording it in the view list would give this build
 * two things called `SCR-FL-03`, which is the defect, not the record of it.
 */
export const FL_OVERLAY_ON_ANY_DESTINATION = {
  id: 'SCR-FL-03',
  name: 'Second-identity step-up sheet',
  destinationColumn: 'Overlay on any destination',
  placement: 'overlay',
  sourceRef: 'L39865',
} as const satisfies FrontlinePlayerView

/**
 * §22.7's own count, and the arithmetic that reaches it, so "twenty-three"
 * is derived here rather than quoted from L39956.
 *
 * THE OVERLAY IS NOT A TWENTY-FOURTH ROW, and the first version of this
 * constant added it as one. `FL_OVERLAY_ON_ANY_DESTINATION` is §22.7's own
 * reading of `SCR-FL-03` — the same row already counted among the six,
 * because the token it carries is one of the six contested ones. It is held
 * separately so this build never has two things called `SCR-FL-03`, not
 * because it is an extra row of the register.
 */
export const S227_ROW_COUNT = FL_DESTINATIONS.length + FL_PLAYER_VIEWS.length

/* ==================================================================== *
 * THE DISCLOSURE, AS DATA. Rendered by `app/frontline/page.tsx`.
 * ==================================================================== */

export interface NamespaceReading {
  readonly label: string
  readonly reading: string
  readonly locator: string
}

export const SCR_FL_NAMESPACE_READINGS = [
  {
    label: 'The twenty-three-row register',
    reading:
      'Section 22.7 introduces its table with "The screen register is:" and lists twenty-three rows carrying a Destination column and a Module column. It is the only register naming the views the Run Player actually renders, and two of its rows are not destinations at all — one reads "Overlay on any destination" and one reads "Full-screen interrupt". Its count is asserted twice.',
    locator: 'L39859 · header L39861 · rows L39863-L39885 · counted at L39956 and L40057',
  },
  {
    label: 'The six-row register',
    reading:
      'Section 25.5 introduces its table with "Screen register — exactly six destinations." and lists six rows carrying roles-that-can-open, modules-and-features and a navigation entry point. It is the only register that says which roles may open a screen. Its count is asserted three times.',
    locator: 'L48525 · header L48527 · rows L48529-L48534 · counted at L40045, L48689 and L48698',
  },
] as const satisfies readonly NamespaceReading[]

export const SCR_FL_NAMESPACE_RULING = {
  id: 'RULING-FL-1',
  question:
    'Two tables in the frozen source both call themselves the screen register for this surface. They share the six identifiers SCR-FL-01 to SCR-FL-06 and five of those six name a different screen in each table. Neither table mentions the other, and the source attaches no decision identifier to the conflict.',
  readings: SCR_FL_NAMESPACE_READINGS,
  ruling:
    'No screen identifier is used as a route key on this surface. Routes are keyed on a plain name. The six-row register fixes the set of destinations, because three acceptance criteria assert exactly six and it is the only register stating who may open a screen. The other seventeen rows of the twenty-three-row register are states of a destination, an overlay, or a full-screen interrupt, and none of them becomes a route: building one route per row would create a seventh destination.',
  whyNotQuiet:
    'Both registers are carried on screen with their own locators, and every contested identifier is shown with both readings beside it. This build settles which register it keys on; it does not claim the source settled it.',
  delegation:
    'A client-delegated choice. The client delegated the decision, not the pretence that the source settled it — so the conflict is disclosed here rather than resolved out of sight by whichever task reached it first.',
  sourceRef:
    'Registers at L39861-L39885 and L48527-L48534. No DEC-* identifier is attached to this conflict anywhere in the frozen source.',
} as const
