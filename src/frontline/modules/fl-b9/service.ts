import {
  functionalitiesNamingNoPattern,
  patternsForModule,
  type FrontlineFallbackId,
  type FrontlineFallbackPattern,
} from '@/frontline/fallbacks'
import { FL_COMMAND_CLASSES, effectiveOnThisDevice } from '@/frontline/commands'

/**
 * `MOD-FL-B9`'s OWN LOGIC AND VOCABULARY. Everything shared with the other
 * eleven modules is consumed from `@/frontline/*` and re-derived nowhere.
 *
 * WHY THIS FILE DOES NOT CALL `evaluateFrontlineAccess`, AND IT IS NOT THE
 * REASON `MOD-FL-A1` GAVE. A1's reason was that its two screens establish who
 * the actor is rather than take acts. This module takes acts, so the
 * evaluator would be the right call — except for one of them.
 *
 * `evaluateFrontlineAccess` CHECKED `forcesSyncFirst` INSIDE its `ctx.online`
 * branch (`src/frontline/access.ts`), so a permitted WRITE taken offline
 * returned `queuedOffline` whether or not the act forced a sync first. For a
 * supervisor sign-off that outcome is a false claim in the source's own
 * words: `FUNC-B9-03-1-2` (L41706) — "Offline: blocks the sign-off" — and
 * `TEST-B9-7` (L41765) asks a test to assert the forced sync blocks it and
 * NO PARTIAL SIGN-OFF RECORD IS CREATED. A queued sign-off is a partial
 * record of exactly that kind.
 *
 * THAT IS PAST TENSE NOW. The controller moved the check above the
 * connectivity branch after this module and `MOD-FL-A1` reported it
 * independently, and `tests/unit/fl-access.test.ts` gained the offline case
 * wave 0's own test never asked. The reasoning below stands unchanged: this
 * module still does not call the evaluator for the sign-off, because
 * `signOffReadiness` answers a narrower question from the source's own two
 * clauses, and that was never a workaround for the defect.
 *
 * That is a finding about wave 0, recorded in `B9_SOURCE_FINDINGS` below and
 * reported to the controller, NOT routed around: this module does not call
 * the evaluator for the sign-off and does not patch it either. `access.ts` is
 * not this module's file. `signOffReadiness` answers the narrower question
 * this act actually asks, from the two clauses the source writes for it.
 *
 * THE MATRIX IS STILL THE AUTHORITY FOR WHAT DRAWS. `frontlineAffordance` is
 * the fold that decides every cell, and nothing here re-answers it.
 */

/* ==================================================================== *
 * THE THIRTEEN FUNCTIONALITIES, AND `AC-FL-011-1`.
 *
 * `AC-FL-011-1` (L40151): "Every functionality in this chapter names at
 * least one `FB-FL-*` pattern." Thirteen `FUNC-B9-*` identifiers are
 * enumerated at L41690-L41711 under four features, and each one's own
 * Fallback clause is transcribed below verbatim, so the criterion is asked of
 * the source's words rather than of a summary of them.
 * ==================================================================== */

export interface B9Functionality {
  readonly id: string
  /** The functionality's own opening sentence, verbatim. */
  readonly statement: string
  /** Its Roles-allowed clause, verbatim. */
  readonly rolesAllowed: string
  /** Its connectivity clause, verbatim. */
  readonly connectivity: string
  /** Its Fallback clause, verbatim, backticks stripped. */
  readonly fallbackClause: string
  /** The `FB-FL-*` identifiers that clause names. Empty where it names none. */
  readonly patterns: readonly FrontlineFallbackId[]
  readonly sourceRef: string
}

export const B9_FUNCTIONALITIES = [
  {
    id: 'FUNC-B9-01-1-1',
    statement:
      'Enforce the gate locally with no on-device worker override, for an expired or never-held certification for the step in front of them.',
    rolesAllowed: 'Roles allowed: nobody may override on the device.',
    connectivity: 'Online and offline: identical.',
    fallbackClause: 'Fallback: FB-FL-GATE-01.',
    patterns: ['FB-FL-GATE-01'],
    sourceRef: 'L41690',
  },
  {
    id: 'FUNC-B9-01-2-1',
    statement:
      'Apply the tenant-level posture: hard-block under the strict posture, which is the platform default, or notify without blocking under the lenient posture, with the lapse recorded and surfaced.',
    rolesAllowed: 'Roles allowed: Tenant Admin sets it in the Delivery Operations Hub.',
    connectivity:
      'Online and offline: identical, because the posture travels with the package and the evaluation is local.',
    fallbackClause: 'Fallback: FB-FL-GATE-01.',
    patterns: ['FB-FL-GATE-01'],
    sourceRef: 'L41692',
  },
  {
    id: 'FUNC-B9-01-2-2',
    statement:
      'Keep an expired qualification visible in the Client Command Center until it is resolved, under either posture.',
    rolesAllowed: 'Roles allowed: Supervisor and Quality Manager see it.',
    connectivity:
      'Online and offline: Not applicable — this functionality is enforced on the Client Command Center, not on the device.',
    fallbackClause: 'Fallback: Not applicable — same reason.',
    patterns: [],
    sourceRef: 'L41693',
  },
  {
    id: 'FUNC-B9-01-3-1',
    statement:
      "Apply a clearance granted as Client Command Center action 10 by a Supervisor acting from their own device, wherever they are, audited, and delivered on the command channel at the device's next sync.",
    rolesAllowed: 'Roles allowed: Supervisor and above grant; the device applies.',
    connectivity: 'Online: applies within seconds. Offline: cannot arrive.',
    fallbackClause: 'Fallback: FB-FL-CMD-01.',
    patterns: ['FB-FL-CMD-01'],
    sourceRef: 'L41695',
  },
  {
    id: 'FUNC-B9-01-3-2',
    statement:
      'Apply the tenant-defined clearance duration uniformly at tenant level, deliberately not per-user, after which the block re-applies until the underlying certification is put right.',
    rolesAllowed: 'Roles allowed: Tenant Admin sets the duration.',
    connectivity: 'Online and offline: expiry is evaluated locally at the next gate evaluation.',
    fallbackClause: 'Fallback: FB-FL-GATE-01.',
    patterns: ['FB-FL-GATE-01'],
    sourceRef: 'L41696',
  },
  {
    id: 'FUNC-B9-01-3-3',
    statement:
      "Treat a Service Type tag as able to pre-populate a step's qualification requirements at authoring time while never deciding them.",
    rolesAllowed: 'Roles allowed: authors in the Standards and Operations Studio.',
    connectivity:
      'Online and offline: identical, because the resolved requirements travel in the package.',
    fallbackClause: 'Fallback: FB-FL-PKG-01.',
    patterns: ['FB-FL-PKG-01'],
    sourceRef: 'L41697',
  },
  {
    id: 'FUNC-B9-02-1-1',
    statement:
      'Park the blocked Run rather than stalling the worker, and let them continue with their other assigned Runs.',
    rolesAllowed: 'Roles allowed: Worker continues elsewhere.',
    connectivity: 'Online: a clearance can arrive quickly. Offline: the Run stays parked.',
    fallbackClause: 'Fallback: FB-FL-GATE-01, with DEC-PARK-001 open for the single-run case.',
    patterns: ['FB-FL-GATE-01'],
    sourceRef: 'L41700',
  },
  {
    id: 'FUNC-B9-02-1-2',
    statement: 'Resume the parked Run when the clearance arrives.',
    rolesAllowed: 'Roles allowed: automatic on clearance application.',
    connectivity: 'Online: resumes at the next sync. Offline: no resumption is possible.',
    fallbackClause: 'Fallback: FB-FL-CMD-01.',
    patterns: ['FB-FL-CMD-01'],
    sourceRef: 'L41701',
  },
  {
    id: 'FUNC-B9-02-1-3',
    statement:
      'Apply the same parking behaviour when a previously granted clearance expires and the block re-applies at the next gate evaluation.',
    rolesAllowed: 'Roles allowed: automatic.',
    connectivity: 'Online and offline: identical.',
    fallbackClause: 'Fallback: FB-FL-GATE-01.',
    patterns: ['FB-FL-GATE-01'],
    sourceRef: 'L41702',
  },
  {
    id: 'FUNC-B9-03-1-1',
    statement:
      "Execute a required supervisor sign-off as a screen type through the second-identity step-up, capturing the supervisor's identity at the moment of sign-off against that authorisation only, without ending the worker's session.",
    rolesAllowed: 'Roles allowed: Supervisor, Quality Manager.',
    connectivity: 'Online: proceeds after the forced sync. Offline: does not proceed.',
    fallbackClause: 'Fallback: FB-FL-AUTH-01.',
    patterns: ['FB-FL-AUTH-01'],
    sourceRef: 'L41705',
  },
  {
    id: 'FUNC-B9-03-1-2',
    statement: 'Force a sync before sign-off as a designated high-risk action.',
    rolesAllowed: 'Roles allowed: automatic.',
    connectivity: 'Online: completes. Offline: blocks the sign-off.',
    fallbackClause: 'Fallback: FB-FL-AUTH-01.',
    patterns: ['FB-FL-AUTH-01'],
    sourceRef: 'L41706',
  },
  {
    id: 'FUNC-B9-03-2-1',
    statement:
      'Let a higher authority sign in place of an unavailable supervisor, recorded in full — who signed, in lieu of whom, and why — with a notification raised when it occurs, and never as a silent skip.',
    rolesAllowed: "Roles allowed: Quality Manager, under this chapter's reading.",
    connectivity:
      'Online: proceeds. Offline: does not proceed, because the forced sync applies equally.',
    fallbackClause: 'Fallback: FB-FL-AUTH-01.',
    patterns: ['FB-FL-AUTH-01'],
    sourceRef: 'L41708',
  },
  {
    id: 'FUNC-B9-04-1-1',
    statement:
      'Let an author switch on a per-screen identity re-confirmation for high-stakes steps, so the worker re-confirms who they are at that step and not just at Run start.',
    rolesAllowed:
      'Roles allowed: Worker re-confirms; an author with a grant enables it in the Standards and Operations Studio.',
    connectivity:
      'Online and offline: identical, because it re-confirms a local session rather than re-authenticating against a server.',
    fallbackClause: 'Fallback: FB-FL-AUTH-01.',
    patterns: ['FB-FL-AUTH-01'],
    sourceRef: 'L41711',
  },
] as const satisfies readonly B9Functionality[]

/**
 * `AC-FL-011-1` ASKED, AND THE ANSWER IS NOT EMPTY. Wave 0's
 * `functionalitiesNamingNoPattern` is the one place that rule lives, and run
 * over this module's thirteen it returns `FUNC-B9-01-2-2` (L41693), whose
 * Fallback clause reads "Not applicable — same reason." and names no
 * `FB-FL-*` pattern at all.
 *
 * THE SOURCE STATES THE GROUND ITSELF, in the clause immediately before:
 * "Online and offline: `Not applicable — this functionality is enforced on
 * the Client Command Center, not on the device.`" The "same reason" the
 * Fallback clause points at is that one. A functionality enforced on another
 * surface has no failure mode on this device to fall back from.
 *
 * NOTHING IS ASSIGNED TO CLOSE IT. `FB-FL-CMD-01` would look plausible and
 * would make the criterion pass against an invented fact, which is the one
 * thing a disclosure of a gap must not do. It is carried on screen instead.
 */
export const B9_FUNCTIONALITIES_NAMING_NO_PATTERN =
  functionalitiesNamingNoPattern(B9_FUNCTIONALITIES)

/* ==================================================================== *
 * THREE READINGS OF THIS MODULE'S FALLBACK SET, AND NONE RECONCILED.
 * ==================================================================== */

/** §22.9's module map, read through wave 0. Three patterns list `MOD-FL-B9`. */
export const B9_MAPPED_PATTERNS: readonly FrontlineFallbackPattern[] =
  patternsForModule('MOD-FL-B9')

/** Every pattern this module's own thirteen functionalities reach. Derived. */
export const B9_PATTERNS_NAMED_BY_FUNCTIONALITIES = [
  ...new Set(B9_FUNCTIONALITIES.flatMap((f) => f.patterns)),
] as const satisfies readonly FrontlineFallbackId[]

/**
 * A FINDING, RECORDED RATHER THAN RECONCILED — and the first module MEASURED
 * SO FAR where two of the three readings agree.
 *
 * The §22.9 map (rows L40131, L40135, L40137) puts `MOD-FL-B9` against three
 * patterns. The module card's own Fallback identifier line (L41680) names the
 * same three — "`FB-FL-GATE-01` primary; `FB-FL-AUTH-01` for the step-up and
 * forced sync; `FB-FL-CMD-01` for clearance delivery". The thirteen
 * functionalities reach a FOURTH, `FB-FL-PKG-01`, at L41697, and
 * `FB-FL-PKG-01`'s own map row (L40132) lists `MOD-FL-A2`, `MOD-FL-A3` and
 * `MOD-FL-A6` and not this module.
 *
 * `MOD-FL-A1` measured 2/3/4, `MOD-FL-A3` 4/6/7 and `MOD-FL-A5` 3/4/7 for the
 * same three readings, and all three diverge at every reading. This module
 * measures 3/3/4. `MOD-FL-A4` is UNRECORDED: it ships no comparison of the
 * three, so whether its readings agree is not something this module can say,
 * and "the first" above means the first of the four that have been measured.
 * No `DEC` identifier is attached to the divergence anywhere in the frozen
 * source.
 */
export const B9_PATTERN_DIVERGENCE = {
  fromTheModuleMap: ['FB-FL-AUTH-01', 'FB-FL-CMD-01', 'FB-FL-GATE-01'],
  fromTheCardsFallbackLine: ['FB-FL-GATE-01', 'FB-FL-AUTH-01', 'FB-FL-CMD-01'],
  fromTheFunctionalities: [
    'FB-FL-GATE-01',
    'FB-FL-CMD-01',
    'FB-FL-PKG-01',
    'FB-FL-AUTH-01',
  ],
  note: '§22.9’s module map names three patterns for this module and the module card’s own Fallback identifier line names the same three, which is the first agreement between any two of the three readings across the modules measured so far — MOD-FL-A1 at 2/3/4, MOD-FL-A3 at 4/6/7 and MOD-FL-A5 at 3/4/7 all diverge at every reading, and MOD-FL-A4 records no comparison at all. The thirteen functionalities here reach a fourth, FB-FL-PKG-01, through the Service Type pre-population rule, and the map does not list this module against it. All three readings are the source’s own and none is corrected here.',
  sourceRef: 'map L40131, L40135, L40137 (and L40132 for the fourth); card L41680; functionality L41697',
} as const

/* ==================================================================== *
 * THE GATE. TWO PARAMETERS, AND NEITHER OF THEM IS THE CONNECTION.
 *
 * L41652: "The gate itself is enforced locally, exactly as online."
 * `FUNC-B9-01-1-1` (L41690): "Online and offline: identical."
 * `AC-FL-000-4` (L39099) requires identical outcomes with the network
 * disabled, and L40948 is the position this surface exists to hold.
 *
 * The ARITY IS THE RULING: there is nowhere to pass a connection state into
 * `gateEvaluation`, so the gate cannot be put behind one. The covering gate
 * reads the function's own text rather than only `Function.length`, because
 * a DEFAULTED parameter does not count towards the length and a defaulted
 * connectivity parameter is exactly the shape nobody has to notice.
 * ==================================================================== */

/** The two tenant postures. L41618, L41621, `FUNC-B9-01-2-1` L41692. */
export type B9Posture = 'strict' | 'lenient'

export type B9GateState = 'STATE-B9-PASSED' | 'STATE-B9-BLOCKED' | 'STATE-B9-NOTIFIED'

export interface B9GateEvaluation {
  readonly state: B9GateState
  /**
   * `STATE-B9-PARKED` where the block parks the Run, and `null` otherwise.
   * The lenient posture notifies WITHOUT blocking, so it never parks.
   */
  readonly parks: 'STATE-B9-PARKED' | null
  /** What the worker is told, in the storyboard's register. */
  readonly line: string
  readonly sourceRef: string
}

export function gateEvaluation(
  qualificationCurrent: boolean,
  posture: B9Posture,
): B9GateEvaluation {
  if (qualificationCurrent) {
    return {
      state: 'STATE-B9-PASSED',
      parks: null,
      line: 'The qualification is current, so the step proceeds with no visible friction.',
      sourceRef: 'L41642',
    }
  }
  if (posture === 'lenient') {
    return {
      state: 'STATE-B9-NOTIFIED',
      parks: null,
      line: 'Under the lenient posture the step is not blocked, and the lapse is recorded and surfaced rather than hidden.',
      sourceRef: 'AC-B9-2 · L41747',
    }
  }
  return {
    state: 'STATE-B9-BLOCKED',
    parks: 'STATE-B9-PARKED',
    line: 'Under the strict posture, which is the platform default, the step will not proceed and the Run is set aside.',
    sourceRef: 'L41618 (the posture), L41652 (the parked Run)',
  }
}

/* ==================================================================== *
 * THE CLEARANCE, SEEN FROM THE RECIPIENT END.
 *
 * `CMD-FL-CLEAR` is settled in `@/frontline/commands` and is read from there,
 * never re-declared. L39670: a command is effective on a device when that
 * device has APPLIED it, never because someone created it — so this module
 * asks `effectiveOnThisDevice` rather than inventing a second predicate.
 * ==================================================================== */

export const B9_CLEARANCE_COMMAND = FL_COMMAND_CLASSES.find((c) => c.id === 'CMD-FL-CLEAR')

export interface B9ClearanceOutcome {
  readonly applied: boolean
  readonly state: 'STATE-B9-CLEARED' | 'STATE-B9-CLEARANCEEXPIRED'
  /** The typed reason a rejection carries. Never a bare failure. */
  readonly reason: string
  readonly sourceRef: string
}

/**
 * L41654: "A clearance that has already expired by the time it arrives is
 * rejected with a typed reason rather than applied." `AC-B9-5` (L41750) adds
 * that expiry re-blocks at the NEXT gate evaluation and never interrupts the
 * step under way.
 */
export function clearanceApplication(clearance: {
  readonly alreadyExpiredOnArrival: boolean
}): B9ClearanceOutcome {
  if (clearance.alreadyExpiredOnArrival) {
    return {
      applied: false,
      state: 'STATE-B9-CLEARANCEEXPIRED',
      reason:
        'This clearance had already expired when it reached this tablet, so it was rejected rather than applied. The Run stays parked and the rejection is acknowledged back.',
      sourceRef: 'L41654, TEST-B9-8 · L41766',
    }
  }
  return {
    applied: true,
    state: 'STATE-B9-CLEARED',
    reason:
      'The clearance was validated and applied on this tablet, and the parked Run resumes at a safe boundary. It runs for the tenant-defined duration, after which the block re-applies at the next gate evaluation.',
    sourceRef: 'L41654, AC-B9-4 · L41749, AC-B9-5 · L41750',
  }
}

/** L39670's predicate, read from wave 0 rather than restated. */
export const CLEARANCE_IS_EFFECTIVE_WHEN_APPLIED = effectiveOnThisDevice('applied')

/* ==================================================================== *
 * THE SIGN-OFF, AND THE FORCED SYNC THAT IS NOT A REFUSAL.
 * ==================================================================== */

export interface B9SignOffReadiness {
  readonly proceeds: boolean
  /** What the screen says. Never "queued", never "synced", never a bare tick. */
  readonly line: string
  readonly sourceRef: string
}

/**
 * `FUNC-B9-03-1-2` (L41706): "Online: completes. Offline: blocks the
 * sign-off." L41652: "A sign-off requiring a forced sync does not proceed."
 * `AC-B9-6` (L41751) requires a COMPLETED forced sync.
 *
 * OFFLINE IS NOT A QUEUE HERE, and that is the whole reason this function
 * exists rather than a call to `evaluateFrontlineAccess` — see the file
 * header and `B9_SOURCE_FINDINGS`. A queued sign-off would be the partial
 * record `TEST-B9-7` (L41765) asks a test to prove absent.
 */
export function signOffReadiness(online: boolean): B9SignOffReadiness {
  if (online) {
    return {
      proceeds: true,
      line: 'A synchronisation is forced first, because a sign-off is a designated high-risk action, and the sign-off proceeds once it has completed.',
      sourceRef: 'L41644, FUNC-B9-03-1-2 · L41706, L48668',
    }
  }
  return {
    proceeds: false,
    line: 'This tablet cannot reach the office, so the forced sync cannot complete and the sign-off does not proceed. Nothing is recorded and nothing is written part-way; the identity and authority a sign-off records have to be fresh rather than stale cache.',
    sourceRef: 'L41652, FUNC-B9-03-1-2 · L41706, TEST-B9-7 · L41765',
  }
}

/* ==================================================================== *
 * THE EIGHT ACCEPTANCE CRITERIA. L41746-L41753.
 * ==================================================================== */

export interface B9AcceptanceCriterion {
  readonly id: string
  readonly text: string
  readonly sourceRef: string
}

export const B9_ACCEPTANCE_CRITERIA = [
  {
    id: 'AC-B9-1',
    text: 'No interface anywhere in the application permits a worker to override a qualification gate.',
    sourceRef: 'AC-B9-1 · L41746',
  },
  {
    id: 'AC-B9-2',
    text: 'The strict posture is the platform default, and the lenient posture records and surfaces the lapse rather than hiding it.',
    sourceRef: 'AC-B9-2 · L41747',
  },
  {
    id: 'AC-B9-3',
    text: 'A gate block while offline parks the Run and offers the worker their other assigned Runs.',
    sourceRef: 'AC-B9-3 · L41748',
  },
  {
    id: 'AC-B9-4',
    text: 'A clearance is applied only as a validated command and carries the tenant-defined duration uniformly, not per user.',
    sourceRef: 'AC-B9-4 · L41749',
  },
  {
    id: 'AC-B9-5',
    text: 'Clearance expiry re-blocks at the next gate evaluation and never interrupts the step under way.',
    sourceRef: 'AC-B9-5 · L41750',
  },
  {
    id: 'AC-B9-6',
    text: "A supervisor sign-off requires a completed forced sync and is captured through the step-up without ending the worker's session.",
    sourceRef: 'AC-B9-6 · L41751',
  },
  {
    id: 'AC-B9-7',
    text: 'A substitute sign-off records who signed, in lieu of whom, and why, and raises a notification; it is never a silent skip.',
    sourceRef: 'AC-B9-7 · L41752',
  },
  {
    id: 'AC-B9-8',
    text: 'Step-level identity re-confirmation is off by default and is enabled per screen in the Standards and Operations Studio only.',
    sourceRef: 'AC-B9-8 · L41753',
  },
] as const satisfies readonly B9AcceptanceCriterion[]

/* ==================================================================== *
 * THE OPEN DECISIONS THIS MODULE DISCLOSES.
 *
 * WHY THEY ARE NOT RENDERED BY `@/disclosure/DecisionDisclosure`. That
 * component takes a `DecisionId`, and the union the canon in
 * `src/disclosure/decisions.ts` exports contains NONE of `DEC-PLUS-001`,
 * `DEC-SUBAUTH-001` or `DEC-PARK-001`.
 * Adding them means editing that file, which this module does not own
 * and which one later task lifts all at once. So the three are carried here
 * with the same three obligations the renderer discharges: the identifier,
 * EVERY reading with its own locator, and this build's working position
 * labelled a client-delegated choice.
 *
 * THE STAND-IN IS BUILT TO EXPIRE. The covering suite asserts each of these
 * three identifiers is ABSENT from the canon's exported union. The moment one
 * is lifted, that suite goes red and forces the switch — a stand-in with no
 * expiry gate is how two spellings of one decision ship.
 * ==================================================================== */

export interface B9Disclosure {
  readonly decisionRef: string
  readonly question: string
  readonly readings: readonly { readonly text: string; readonly locator: string }[]
  /** What this build does. Never presented as the source's ruling. */
  readonly adopted: string
  /** Why MOD-FL-B9 is a place this decision has to be disclosed. */
  readonly whyHere: string
  /** Why it is disclosed here rather than through the shared renderer. */
  readonly canonNote: string
}

const CANON_NOTE =
  "The shared decision canon's DecisionId union does not hold this identifier. It is disclosed here in the canon's own record shape, and this module's unit suite asserts the absence, so the disclosure moves to the canon the moment the canon holds it."

export const B9_DISCLOSURES = [
  {
    decisionRef: 'DEC-PLUS-001',
    question:
      'What "Supervisor and above" and "Quality Manager and above" mean across five roles the platform states are additive and non-hierarchical. Two of this matrix\'s rows turn on the phrase.',
    readings: [
      {
        text: 'This chapter therefore reads Supervisor and above as "any identity holding the Supervisor role or the Quality Manager role", and never as a rank comparison, and preserves the ambiguity as DEC-PLUS-001.',
        locator: 'L39840 · Client Decision Required — DEC-PLUS-001',
      },
      {
        text: 'But the platform also states that the five roles are additive and non-hierarchical, and that the audit log records identity rather than "acting as role".',
        locator: 'L41684 · §7.13.3 against the platform role model',
      },
      {
        text: 'DEC-PLUS-001, DEC-WIDIFF-001, and DEC-PKGFIELD-001 are referenced without resolution.',
        locator: 'L39960 · the chapter’s own source-classification paragraph',
      },
    ],
    adopted:
      'The chapter’s reading is carried and labelled as the chapter’s: an identity holding the Supervisor role or the Quality Manager role, never a rank comparison. Nothing on this screen orders the five roles, and no cell is widened or narrowed by the reading.',
    whyHere:
      'Row 3’s clearance grant is Supervisor and above (FUNC-B9-01-3-1, L41695) and row 7’s substitute sign-off turns on "higher authority", which L41684 calls the same underlying gap. Both cells render permissively, so the phrase decides who those controls are for.',
    canonNote: CANON_NOTE,
  },
  {
    decisionRef: 'DEC-SUBAUTH-001',
    question:
      'Who may sign in place of an unavailable supervisor. §7.13.3 gives the answer as a role hierarchy resolved from the Delivery Operations Hub; the platform states the five roles are not a hierarchy.',
    readings: [
      {
        text: '§7.13.3 states that where no supervisor is available, a higher authority may sign off in their place, with the role hierarchy resolved from the Delivery Operations Hub within the platform\'s five fixed roles and the authority matrix of Part III.',
        locator: 'L41684 · SoW Fact — §7.13.3',
      },
      {
        text: 'This chapter reads it as "an identity holding the Quality Manager role may substitute for an unavailable Supervisor" and records the specific instance as DEC-SUBAUTH-001.',
        locator: 'L41684 · Client Decision Required — DEC-SUBAUTH-001',
      },
      {
        text: 'the definition of "higher authority" is open as DEC-SUBAUTH-001 and DEC-PLUS-001',
        locator: 'FUNC-B9-03-2-1 · L41708',
      },
      {
        text: 'The definition of "higher authority" for substitution is Client Decision Required — DEC-SUBAUTH-001, related to DEC-PLUS-001.',
        locator: 'L41771 · the section’s own Source status',
      },
    ],
    adopted:
      'The chapter’s reading is what row 7 renders — the Quality Manager column carries the control and no other column does — and it is labelled the chapter’s reading rather than the source’s settlement. The row’s Supervisor cell is Not applicable because the Supervisor is the party being substituted for, which is the source’s own words and not a consequence of the reading.',
    whyHere:
      'The decision sits directly on row 7 (L41624). It is the one row of this matrix whose only permissive cell is the Quality Manager’s, so whether the reading holds decides whether the substitute sign-off has a signatory at all.',
    canonNote: CANON_NOTE,
  },
  {
    decisionRef: 'DEC-PARK-001',
    question:
      'What happens when the parked Run is the worker’s only assigned Run. Parking assumes there is other work to move to, and the source does not say what happens when there is not.',
    readings: [
      {
        text: "Open item: what happens when the parked Run is the worker's only assigned Run is Not specified in the Statement of Work and is proposed as DEC-PARK-001; the candidate behaviours are that the worker idles with an honest explanation, that the Supervisor is escalated to immediately rather than through the ordinary path, or that the run no-show timers at plus 15 and plus 30 minutes take over.",
        locator: 'L41682 · Client Decision Required — DEC-PARK-001',
      },
      {
        text: 'DEC-PARK-001 is proposed as new.',
        locator: 'L40167 · §22.9’s own source-classification paragraph',
      },
      {
        text: 'Fallback: FB-FL-GATE-01, with DEC-PARK-001 open for the single-run case.',
        locator: 'FUNC-A6-05-3-2 · L41190 — the same case raised again in MOD-FL-A6',
      },
    ],
    adopted:
      'Nothing is adopted and none of the three candidate behaviours is built. This module renders the parked Run and the storyboard’s own single control back to the worker’s other assigned Runs; the list those Runs appear on is MOD-FL-A2’s, and what that list shows when it is empty is the open question itself.',
    whyHere:
      'Row 9 (L41626) prohibits unparking without a clearance in every column, and FUNC-B9-02-1-1 (L41700) names the decision in its own Fallback clause. The prohibition is what makes the single-Run case a real dead end rather than a nuisance.',
    canonNote: CANON_NOTE,
  },
] as const satisfies readonly B9Disclosure[]

/* ==================================================================== *
 * A SOURCE CONTRADICTION WITH NO DECISION IDENTIFIER ATTACHED.
 *
 * It is held in a DIFFERENT SHAPE from the three above, and deliberately:
 * `B9Disclosure` carries a `decisionRef`, and giving this one a `DEC-*`
 * identifier — even a plausible one — would file a contradiction the source
 * never registered under a name a later reader would look up and not find.
 * ==================================================================== */

export interface B9Contradiction {
  readonly title: string
  readonly question: string
  readonly readings: readonly { readonly text: string; readonly locator: string }[]
  /** Statements that bear on the conflict without closing it. */
  readonly bearsOnIt: readonly { readonly text: string; readonly locator: string }[]
  readonly whatThisBuildDraws: string
  readonly noDecisionIdentifier: string
}

export const CH4_AGAINST_CH22_ON_GATE_OVERRIDE = {
  title: 'Whether a Supervisor or Quality Manager may override a qualification gate on the device',
  question:
    'Chapter 4.4’s surface-scope matrix and Chapter 22.18’s module matrix answer the same question with opposite tokens for the same two roles, neither mentions the other, and no decision identifier is attached to the conflict anywhere in the frozen source.',
  readings: [
    {
      text: 'Override a gate that blocks the worker | Explicitly prohibited | Allowed with conditions | Allowed with conditions | Explicitly prohibited',
      locator: 'L2671 · Chapter 4.4, the surface capability matrix — no surface qualifier',
    },
    {
      text: 'Override a qualification gate on the device | Explicitly prohibited — there is no on-device worker override | Explicitly prohibited on the device | Explicitly prohibited on the device',
      locator: 'L41619 · Chapter 22.18, this module’s own matrix — qualified on the device',
    },
  ],
  bearsOnIt: [
    {
      text: 'a Supervisor grants a qualification clearance as Command Center action 10 and cannot release a lot hold, requesting release with a note instead',
      locator:
        'L2679 · Chapter 4.4’s own conditions paragraph, which states every condition its matrix leaves as "with conditions" and gives the Supervisor no on-device override among them',
    },
    {
      text: 'A qualification block is lifted by a clearance granted by a Supervisor in the Client Command Center and delivered over the command channel',
      locator: 'L2642 · Chapter 4.4’s own prose, two paragraphs above its matrix',
    },
    {
      text: 'EXCL-FL-05 | Worker-initiated gate override | The gate is the guarantee | Client Command Center action 10, qualification clearance only | Invariant',
      locator:
        'L39488 · the exclusion is worker-initiated and names neither the Supervisor nor the Quality Manager, so it settles the Worker column and does not close this',
    },
  ],
  whatThisBuildDraws:
    'No override control is drawn on this device for any column, which is Chapter 22.18’s reading and the reading of the chapter that is about this surface. Both readings are rendered with both locators and neither is corrected, hidden or averaged. Chapter 4.4 is the short chapter an implementer reads first, which is why the conflict is stated on this screen rather than only in a report.',
  noDecisionIdentifier:
    'No DEC-* identifier is attached to this conflict anywhere in the frozen source, so it is disclosed as a contradiction and not as a decision. Filing it under a neighbouring identifier that happens to exist would be worse than leaving it unnamed.',
} as const satisfies B9Contradiction

/* ==================================================================== *
 * FINDINGS. Recorded rather than closed, and reported to the controller.
 * ==================================================================== */

export interface B9SourceFinding {
  readonly what: string
  readonly evidence: string
  readonly notClosedBecause: string
  readonly sourceRef: string
}

export const B9_SOURCE_FINDINGS = [
  {
    what: 'The clearance duration is the one act in this matrix the source gives no home.',
    evidence:
      'Row 5’s Tenant Admin cell (L41622) reads "Allowed with conditions — uniform at tenant level, deliberately not per-user" and names no surface, where its neighbour row 4 (L41621) names the Delivery Operations Hub for the sibling setting. The card’s Owning-surface line (L41610) enumerates three non-device homes and the duration is not among them, and FUNC-B9-01-3-2 (L41696) says only "Tenant Admin sets the duration".',
    notClosedBecause:
      'Naming the Hub because the neighbouring row does would be this build supplying a fact the source withholds. The row draws no control and states a line instead, on the ground AC-SCOPE-040 (L2683) gives: the Frontline Worker Application exposes no authoring or configuration control.',
    sourceRef: 'L41622 against L41621; L41610; L41696; AC-SCOPE-040 L2683',
  },
  {
    what: 'DEC-GATE-001 is not this module’s decision, and the four locators the dispatch gave for it are all real and all elsewhere.',
    evidence:
      'DEC-GATE-001 is action-agent gating: whether the Prevention Agent’s pre-authorised policy is a runtime gate. L40952 and L41072 are §22.14’s, MOD-FL-A5’s; L41502 and L41596 are §22.17’s, MOD-FL-B8’s. The identifier occurs nowhere in §22.18 at all — zero occurrences between L41598 and L41771 — and its canon card at L23089 and L112214 is about agent governance bindings.',
    notClosedBecause:
      'A qualification gate and an agent governance gate share a word and nothing else. Disclosing DEC-GATE-001 on this screen would attach an agent-governance contradiction to a certification block, and the reader who followed it would find a decision that has no bearing on anything here.',
    sourceRef: 'L40952, L41072, L41502, L41596 — all four real, none in §22.18',
  },
  {
    what: 'Wave 0’s access evaluator returned queuedOffline for a sign-off taken offline, which the source forbids. Reported here, fixed by the controller, and this record is kept as the account of it.',
    evidence:
      'evaluateFrontlineAccess in src/frontline/access.ts tested forcesSyncFirst INSIDE its online branch, so an offline permitted write returned queuedOffline whatever the act was. FUNC-B9-03-1-2 (L41706) reads "Offline: blocks the sign-off", L41652 reads "A sign-off requiring a forced sync does not proceed", and TEST-B9-7 (L41765) asks for a test asserting no partial sign-off record is created — a queued sign-off is exactly such a record. MOD-FL-A1 found the same defect independently from a different section.',
    notClosedBecause:
      'IT IS CLOSED. The check now precedes the connectivity branch and both states reach it, so a forced-sync act offline returns allowedWithConditions with the step named rather than queuing. It stays a condition rather than becoming a refusal, because refusing would make connectivity a gate on authority — the shape L40948 exists to forbid. This module still does not call the evaluator for the sign-off: signOffReadiness answers the narrower question from the source’s own two clauses, which is a separate ruling and unaffected. The record is kept because the account of how a defect survived wave 0’s own test — which asked the question only with online: true — is worth more than the row it occupied.',
    sourceRef: 'L41706, L41652, TEST-B9-7 L41765'
  },
] as const satisfies readonly B9SourceFinding[]
