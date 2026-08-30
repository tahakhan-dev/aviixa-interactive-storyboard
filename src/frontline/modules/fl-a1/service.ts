import {
  functionalitiesNamingNoPattern,
  patternsForModule,
  type FrontlineFallbackId,
  type FrontlineFallbackPattern,
} from '@/frontline/fallbacks'

/**
 * `MOD-FL-A1`'s OWN LOGIC AND VOCABULARY. Everything shared with the other
 * eleven modules is consumed from `@/frontline/*` and re-derived nowhere.
 *
 * WHAT THIS FILE DELIBERATELY DOES NOT DO. It does not call
 * `evaluateFrontlineAccess`. The matrix is the authority for what draws on
 * this module's two destinations and `frontlineAffordance` is the fold that
 * reads it; a second evaluator answering the same question would be a second
 * spelling of the same ruling, which is the defect shape this build has
 * recorded most. `evaluateFrontlineAccess` answers a different question — may
 * THIS actor take THIS act on a device in THIS connectivity posture — and
 * belongs to the modules that take acts, not to the two screens that
 * establish who the actor is.
 */

/* ==================================================================== *
 * THE FOURTEEN FUNCTIONALITIES, AND `AC-FL-011-1`.
 *
 * `AC-FL-011-1` (L40151): "Every functionality in this chapter names at
 * least one `FB-FL-*` pattern." Fourteen `FUNC-A1-*` identifiers are
 * enumerated at L40258-L40279 and each one's own Fallback clause is
 * transcribed below verbatim, so the criterion is asked of the source's
 * words rather than of a summary of them.
 * ==================================================================== */

export interface A1Functionality {
  readonly id: string
  /** The functionality's own opening sentence, verbatim. */
  readonly statement: string
  /** The functionality's own Fallback clause, verbatim, backticks stripped. */
  readonly fallbackClause: string
  /** The `FB-FL-*` identifiers that clause names. Empty where it names none. */
  readonly patterns: readonly FrontlineFallbackId[]
  readonly sourceRef: string
}

export const A1_FUNCTIONALITIES = [
  {
    id: 'FUNC-A1-01-1-1',
    statement: "Federate authentication to the tenant's identity provider.",
    fallbackClause: 'Fallback: FB-FL-AUTH-01.',
    patterns: ['FB-FL-AUTH-01'],
    sourceRef: 'L40258',
  },
  {
    id: 'FUNC-A1-01-2-1',
    statement:
      'Validate username and Personal Identification Number against platform-managed credentials provisioned through the Delivery Operations Hub.',
    fallbackClause: 'Fallback: FB-FL-AUTH-01.',
    patterns: ['FB-FL-AUTH-01'],
    sourceRef: 'L40260',
  },
  {
    id: 'FUNC-A1-01-2-2',
    statement: 'Enforce Personal Identification Number lockout after repeated failures.',
    fallbackClause: 'Fallback: FB-FL-SEC-01.',
    patterns: ['FB-FL-SEC-01'],
    sourceRef: 'L40261',
  },
  {
    id: 'FUNC-A1-02-1-1',
    statement: 'Resolve qualifications from the identity, never from the device.',
    fallbackClause: 'Fallback: FB-FL-AUTH-01.',
    patterns: ['FB-FL-AUTH-01'],
    sourceRef: 'L40264',
  },
  {
    id: 'FUNC-A1-02-1-2',
    statement:
      'Resolve language preference and work-instruction difficulty level from the worker profile.',
    fallbackClause: 'Fallback: FB-FL-AUTH-01.',
    patterns: ['FB-FL-AUTH-01'],
    sourceRef: 'L40265',
  },
  {
    id: 'FUNC-A1-02-1-3',
    statement: 'Bind attribution to identity in every runtime envelope.',
    fallbackClause: 'Fallback: FB-FL-CAP-01.',
    patterns: ['FB-FL-CAP-01'],
    sourceRef: 'L40266',
  },
  {
    id: 'FUNC-A1-03-1-1',
    statement: 'Fast Personal Identification Number switching between workers.',
    fallbackClause: 'Fallback: FB-FL-AUTH-01.',
    patterns: ['FB-FL-AUTH-01'],
    sourceRef: 'L40269',
  },
  {
    id: 'FUNC-A1-03-1-2',
    statement: 'Short, configurable auto-logout.',
    fallbackClause: 'Fallback: FB-FL-SEC-01.',
    patterns: ['FB-FL-SEC-01'],
    sourceRef: 'L40270',
  },
  {
    id: 'FUNC-A1-03-1-3',
    statement: 'Visible who-is-logged-in indicator.',
    fallbackClause:
      'Fallback: Not applicable — a persistent indicator has no failure mode beyond the application itself failing, which is covered by FB-FL-CORE-01.',
    patterns: ['FB-FL-CORE-01'],
    sourceRef: 'L40271',
  },
  {
    id: 'FUNC-A1-03-1-4',
    statement: 'Identity re-confirmation at Run start.',
    fallbackClause: 'Fallback: FB-FL-AUTH-01.',
    patterns: ['FB-FL-AUTH-01'],
    sourceRef: 'L40272',
  },
  {
    id: 'FUNC-A1-03-2-1',
    statement:
      'Single sign-on or Personal Identification Number with a long or no auto-logout and minimal re-confirmation friction.',
    fallbackClause: 'Fallback: FB-FL-AUTH-01.',
    patterns: ['FB-FL-AUTH-01'],
    sourceRef: 'L40274',
  },
  {
    id: 'FUNC-A1-04-1-1',
    statement:
      "Accept a Supervisor or higher authority credential on the worker's device without ending or disturbing the worker's session.",
    fallbackClause: 'Fallback: FB-FL-AUTH-01.',
    patterns: ['FB-FL-AUTH-01'],
    sourceRef: 'L40277',
  },
  {
    id: 'FUNC-A1-04-1-2',
    statement:
      'Capture the second identity against the specific authorisation it granted, and only that, then release it.',
    fallbackClause: 'Fallback: FB-FL-CAP-01.',
    patterns: ['FB-FL-CAP-01'],
    sourceRef: 'L40278',
  },
  {
    id: 'FUNC-A1-04-1-3',
    statement: "Preserve the worker's session throughout.",
    fallbackClause:
      'Fallback: Not applicable — session preservation is a local invariant with no external dependency.',
    patterns: [],
    sourceRef: 'L40279',
  },
] as const satisfies readonly A1Functionality[]

/**
 * `AC-FL-011-1` ASKED, AND THE ANSWER IS NOT EMPTY. Wave 0's
 * `functionalitiesNamingNoPattern` is the one place that rule lives, and run
 * over this module's fourteen it returns `FUNC-A1-04-1-3` (L40279), whose
 * Fallback clause reads "Not applicable — session preservation is a local
 * invariant with no external dependency." and names no `FB-FL-*` pattern at
 * all.
 *
 * ITS NEIGHBOUR IS THE PROOF THAT THIS IS THE SOURCE'S GAP AND NOT A
 * TRANSCRIPTION SLIP. `FUNC-A1-03-1-3` (L40271) opens its Fallback clause
 * with the identical "Not applicable —" and then names `FB-FL-CORE-01`
 * inside it, so the source does supply a pattern from inside that
 * construction where it has one to supply. L40279 has none.
 *
 * NOTHING IS ASSIGNED TO CLOSE IT. Picking a plausible pattern would make
 * `AC-FL-011-1` pass against an invented fact, which is the one thing a
 * disclosure of a gap must not do. It is carried on screen instead.
 */
export const A1_FUNCTIONALITIES_NAMING_NO_PATTERN =
  functionalitiesNamingNoPattern(A1_FUNCTIONALITIES)

/* ==================================================================== *
 * THE FALLBACK MAP, AND A DIVERGENCE BETWEEN IT AND THE MODULE CARD.
 * ==================================================================== */

/**
 * §22.9's module map, read through wave 0. Two patterns list `MOD-FL-A1`:
 * `FB-FL-AUTH-01` (L40131) and `FB-FL-SEC-01` (L40141).
 */
export const A1_PATTERNS_FROM_MAP: readonly FrontlineFallbackPattern[] =
  patternsForModule('MOD-FL-A1')

/**
 * A FINDING, RECORDED RATHER THAN RECONCILED. §22.9's module map and
 * §22.10's own Fallback identifier line do not name the same set.
 *
 * The map (L40130-L40143) puts `MOD-FL-A1` against two patterns. The module
 * card's Fallback identifier line (L40250) names THREE — "`FB-FL-AUTH-01`
 * primary; `FB-FL-SEC-01` for lockout, suspension, and de-authorisation;
 * `FB-FL-CORE-01` for connectivity loss" — and the module's own
 * functionalities reach a fourth, `FB-FL-CAP-01`, at L40266 and L40278.
 * `FB-FL-CORE-01`'s map row (L40130) lists seven modules and `MOD-FL-A1` is
 * not among them; `FB-FL-CAP-01`'s (L40133) lists two and it is not among
 * them either.
 *
 * Neither reading is corrected here. `patternsForModule` stays the map's
 * reading, untouched, and the card's and the functionalities' readings are
 * carried beside it with their own lines.
 */
export const A1_PATTERN_DIVERGENCE = {
  fromTheModuleMap: ['FB-FL-AUTH-01', 'FB-FL-SEC-01'],
  fromTheCardsFallbackLine: ['FB-FL-AUTH-01', 'FB-FL-SEC-01', 'FB-FL-CORE-01'],
  fromTheFunctionalities: ['FB-FL-AUTH-01', 'FB-FL-SEC-01', 'FB-FL-CAP-01', 'FB-FL-CORE-01'],
  note: "§22.9's module map names two patterns for this module; the module card's own Fallback identifier line names three; the fourteen functionalities between them name four. The map does not list this module against FB-FL-CORE-01 or FB-FL-CAP-01, and the card and the functionalities both do. All three readings are the source's own and none is corrected here.",
  sourceRef: 'map L40130-L40143 (rows L40131, L40141); card L40250; functionalities L40266, L40271, L40278',
} as const

/** Every pattern this module's own words reach, derived from the fourteen. */
export const A1_PATTERNS_NAMED_BY_FUNCTIONALITIES = [
  ...new Set(A1_FUNCTIONALITIES.flatMap((f) => f.patterns)),
] as const satisfies readonly FrontlineFallbackId[]

/* ==================================================================== *
 * `DEC-MSG-001` — THE FIXED WORKER-FACING COMPLIANCE MESSAGE, IN BOTH
 * WORDINGS, AND NEITHER MARKED AS THE ANSWER.
 * ==================================================================== */

/**
 * `TEST-SCR-FL-006` (L48703) requires the lock screen to render the fixed
 * message from the platform string table "and assert the wording is taken
 * from the platform string table rather than composed in the client — both
 * source wordings are preserved under `DEC-MSG-001`."
 *
 * EVERY FRONTLINE OCCURRENCE QUOTES READING A ONLY, AND THAT WAS MEASURED
 * RATHER THAN ASSUMED. §22 quotes it at L39913, L40120, L41383 and L41412,
 * and `AC-A1-7` (L40321) says "displays the fixed message verbatim" without
 * quoting anything. Reading B appears nowhere in the Frontline chapter. Both
 * readings live in the decision card at L5265-L5266, and L44923 records the
 * divergence and states that this blueprint uses the Part IV wording.
 *
 * WHERE READING B STOOD IN THIS BUILD BEFORE THIS MODULE — MEASURED, NOT
 * INFERRED. It is recorded in `registries/raw/extract/CHK-002.json`,
 * `CHK-014.json` and `CHK-034.json`, and in
 * `registries/generated/source-reconciliation.json`. It appears in NO file
 * under `src/` or `app/`; the only application asset carrying either wording
 * is `app/hub/tenant-lifecycle-and-tier-operations/fixtures.ts`, which
 * carries Reading A alone. So this record is the first place in the
 * application tree that both wordings stand together, which is what this
 * slice was told to expect.
 *
 * THE SHAPE FORBIDS PICKING ONE. There is no `canonical`, no `adopted` and
 * no `preferred` field — the same discipline `@/disclosure/decisions`
 * applies to a `DecisionReading`, and for the same reason: a field like that
 * is how a disclosure quietly becomes an assertion.
 */
export interface ComplianceMessageReading {
  readonly label: string
  /** The fixed string, verbatim. Never paraphrased and never composed. */
  readonly text: string
  readonly locator: string
}

export const COMPLIANCE_MESSAGE_READINGS = [
  {
    label: 'Reading A',
    text: 'Operation suspended. Contact your supervisor. Your work has been saved.',
    locator: 'L5265 · SoW Fact — §4.2.3, repeated verbatim at §7.11',
  },
  {
    label: 'Reading B',
    text: 'Operation suspended — your work has been saved.',
    locator: 'L5266 · SoW Fact — §8.9.2',
  },
] as const satisfies readonly ComplianceMessageReading[]

/** Where §22 renders the message, and which reading each of those places quotes. */
export const COMPLIANCE_MESSAGE_FRONTLINE_RENDERINGS = [
  { where: 'Surface-level terminal safe state', quotes: 'Reading A', locator: 'L39913' },
  { where: 'FB-FL-SEC-01, first fallback under compliance suspension', quotes: 'Reading A', locator: 'L40120' },
  { where: 'FUNC-A7-05-3-1, the compliance lock', quotes: 'Reading A', locator: 'L41383' },
  { where: 'Storyboard SB-FL-016, the compliance lock', quotes: 'Reading A', locator: 'L41412' },
  {
    where: 'AC-A1-7 — "displays the fixed message verbatim", quoting neither wording',
    quotes: 'neither',
    locator: 'L40321',
  },
] as const

/* ==================================================================== *
 * THE OPEN DECISIONS THIS MODULE DISCLOSES.
 *
 * WHY THEY ARE NOT RENDERED BY `@/disclosure/DecisionDisclosure`. That
 * component takes a `DecisionId`, and the union the canon in
 * `src/disclosure/decisions.ts` exports contains NONE of `DEC-MSG-001`,
 * `DEC-WIPELOGOUT-001`, `DEC-SUSP-001` or `DEC-DEVICE-001`. Adding them
 * means editing that file, which this module does not own, so the four
 * are carried here with the same three obligations the renderer discharges:
 * the identifier, EVERY reading with its own locator, and this build's
 * working position labelled a client-delegated choice.
 *
 * THE PRECEDENT THIS PARAGRAPH USED TO CITE IS GONE, and is not replaced by
 * a substitute (unit-01 final whole-branch review, MINOR 5). It named
 * `SURF-SA`'s `app/super-admin/tenants-lifecycle-and-pilots/fixtures.ts` as
 * carrying `DEC-SUSP-001` and `DEC-MSG-001` the same way; unit 1 deleted
 * that file when it rebuilt the tenants screens, and neither identifier is
 * named anywhere under `app/` now. The reasoning above stands on its own —
 * it never needed the precedent — and naming some other file that happens
 * to disclose locally would be a citation invented to fill the hole the
 * deletion left.
 *
 * The fifth disclosure — the Tenant Admin device session — is NOT here. It
 * is a `RouteOpenDecision` recorded once in `src/routes/definitions.ts` and
 * read through `routeOpenDecisionFor`, and copying its wording here would be
 * the second spelling that mechanism exists to prevent.
 * ==================================================================== */

export interface A1OpenDecision {
  readonly id: string
  readonly question: string
  readonly readings: readonly { readonly text: string; readonly locator: string }[]
  /** What this build does. Never presented as the source's ruling. */
  readonly adopted: string
  /** Why MOD-FL-A1 is a place this decision has to be disclosed. */
  readonly bearingHere: string
}

export const A1_OPEN_DECISIONS = [
  {
    id: 'DEC-MSG-001',
    question:
      'The fixed worker-facing compliance-suspension message is worded differently in two Parts, and it is the only text the platform shows a worker at the moment their device locks.',
    readings: COMPLIANCE_MESSAGE_READINGS.map((r) => ({
      text: `${r.label}: “${r.text}”`,
      locator: r.locator,
    })),
    adopted:
      'Both wordings are carried, and neither is rendered as the fixed message. The source itself records at L44923 that this blueprint uses the Part IV wording and calls the divergence a drafting inconsistency; the decision card at L5268 lists a third option, an agreed new string, which nothing has taken. TEST-SCR-FL-006 (L48703) requires both wordings preserved, so preserving both is what this module does.',
    bearingHere:
      'AC-A1-7 (L40321) — compliance suspension blocks all logins immediately and displays the fixed message verbatim. The block happens at this module\'s Login destination, so this is a screen that would have to render the string.',
  },
  {
    id: 'DEC-WIPELOGOUT-001',
    question:
      '§7.11 states server-triggered remote data wipe on logout or de-authorisation. Read literally, a wipe on every logout erases the encrypted store at every Shared-mode shift handover.',
    readings: [
      {
        text: 'The literal reading: "logout" is any logout, so the store is erased at the end of every shift and at every fast Personal Identification Number switch.',
        locator: 'L41357 · §7.11',
      },
      {
        text: 'The reading this chapter adopts: "logout" means a de-authorising logout event initiated by the platform, not the ordinary end-of-shift logout a worker performs, and ordinary logout preserves the queue.',
        locator: 'L41357 · Client Decision Required — DEC-WIPELOGOUT-001',
      },
    ],
    adopted:
      'The adopted reading. AC-A7-8 (L41429) requires DEC-WIPE-001 and DEC-WIPELOGOUT-001 to remain visibly open and forbids any implementation closing either silently, so the alternative stands on screen beside it.',
    bearingHere:
      'It governs two of this matrix\'s rows and they render oppositely under the two readings: row 4, the fast Personal Identification Number switch in Shared mode (L40191), and row 10, Log out (L40197). Under the literal reading each of those acts destroys a departing worker\'s queued captures.',
  },
  {
    id: 'DEC-SUSP-001',
    question:
      'How a soft suspension is released. §4.2.4 says the platform acts on the operator\'s signal and not on a payment event; §8.9.2 and Part IX give the soft-state exit as automatic on payment; §4.2.1 and §8.12 state there is no payment integration on the platform.',
    readings: [
      {
        text: 'Release on the operator\'s explicit signal, with no payment event observed, because the platform receives none.',
        locator: 'L44927 · §4.2.4',
      },
      {
        text: 'Automatic release on payment.',
        locator: 'L44927 · §8.9.2 and Part IX',
      },
    ],
    adopted:
      'Release by an explicit operator signal in the Super Admin platform console, with no payment event observed and the payment path left open and unbuilt. Recorded as an adopted working position dated 2026-08-14 at L41353, with ratification still owed by the client.',
    bearingHere:
      'STATE-A1-SUSPENDED (L40207) is a state of this module — compliance stop, all logins blocked — and the Preconditions line (L40199) makes the absence of a compliance suspension a precondition of every login. Which suspensions are in force, and how they end, decides whether this module\'s Login destination is reachable at all.',
  },
  {
    id: 'DEC-DEVICE-001',
    question:
      'The standardised device profile — the make or class, capability tier, and operating-system split the target fleets will standardise on. The published minimum specification and the performance envelope are all set against this answer.',
    readings: [
      {
        text: 'The question is open and owed by the client; no profile is stated anywhere in the source.',
        locator: 'L42506 · Client Decision Required',
      },
      {
        text: 'AC-FL-025-5 requires DEC-DEVICE-001 to remain visibly open and no published budget or performance commitment to be stated as final before it closes.',
        locator: 'L42561',
      },
    ],
    adopted:
      'Nothing is adopted, and nothing may be. AC-FL-026-5 (L42644) forbids this chapter claiming a coverage figure while DEC-DEVICE-001 remains open, and TEST-FL-025-5 (L42571) asserts the build carries explicit provisional markers pending it. This module states no device make, class, tier or operating system.',
    bearingHere:
      'The traceability row for this module names it: MOD-FL-A1, use cases UC-WKR-04, UC-WKR-01 and UC-DVC via UC-TADM-04, workflows WF-WKR-003 and WF-DVC-001, client decision DEC-DEVICE-001 (L60839). The device mode row (L40193) is where a reader would otherwise expect a device profile to be described.',
  },
] as const satisfies readonly A1OpenDecision[]

/* ==================================================================== *
 * THE TWO DEVICE MODES.
 *
 * §22.7 gives `SCR-FL-01` the name "Login, adapting to device mode"
 * (L39863), so the Login view has to be able to render both. The mode is set
 * per device at enrollment in the Super Admin platform console (L40193,
 * L40180) and `FUNC-A1-03-2-1` (L40274) states plainly that the mode cannot
 * be changed from the device.
 *
 * NO AUTO-LOGOUT VALUE IS RECORDED, AND NONE IS INVENTED. `FUNC-A1-03-1-2`
 * (L40270): the Statement of Work "states it is configurable but names no
 * default value, so the default is `TBD — Client Decision Required`."
 * ==================================================================== */

export interface A1DeviceMode {
  readonly id: 'shared' | 'personal'
  readonly name: string
  readonly posture: string
  /** What the login screen offers in this mode, in the source's own words. */
  readonly loginBehaviour: string
  readonly sourceRef: string
}

export const A1_DEVICE_MODES = [
  {
    id: 'shared',
    name: 'Shared mode',
    posture:
      'The predominant floor model and the tuned default. Fast Personal Identification Number switching between workers, a short and configurable auto-logout whose value the Statement of Work does not name, a visible who-is-logged-in indicator that cannot be hidden, and identity re-confirmation at Run start that cannot be skipped.',
    loginBehaviour:
      'The login screen adapts to Shared mode, offering fast Personal Identification Number entry with the worker\'s username.',
    sourceRef: 'L40268-L40272 (the four properties), L40212 (the login behaviour)',
  },
  {
    id: 'personal',
    name: 'Personal or assigned mode',
    posture:
      'Single sign-on or Personal Identification Number with a long or no auto-logout and minimal re-confirmation friction, to stay out of the way where the device stays with one identity. With no auto-logout the offline trust window becomes the effective session bound, which is why the window\'s ceiling matters more in this mode.',
    loginBehaviour:
      'The mode cannot be changed from the device; it is set per device at enrollment in the Super Admin platform console.',
    sourceRef: 'L40274 (the mode), L40193 and L40180 (where it is set)',
  },
] as const satisfies readonly A1DeviceMode[]

export function a1DeviceMode(id: A1DeviceMode['id']): A1DeviceMode {
  const found = A1_DEVICE_MODES.find((m) => m.id === id)
  if (found === undefined) throw new Error(`no MOD-FL-A1 device mode: ${id}`)
  return found
}
