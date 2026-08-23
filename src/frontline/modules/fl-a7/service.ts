import type { DecisionReading } from '@/disclosure/decisions'
import {
  functionalitiesNamingNoPattern,
  patternsForModule,
  type FrontlineFallbackId,
  type FrontlineFallbackPattern,
} from '@/frontline/fallbacks'
import { STOP_CLASS_ITEMS_WITHOUT_A_COMMAND_CLASS } from '@/frontline/commands'

/**
 * `MOD-FL-A7`'s OWN LOGIC AND VOCABULARY. Everything shared with the other
 * eleven modules is consumed from `@/frontline/*` and re-derived nowhere.
 *
 * WHAT THIS FILE DELIBERATELY DOES NOT DO. It does not call
 * `evaluateFrontlineAccess`, for the reason `MOD-FL-A1`'s service states and
 * which holds twice over here: the matrix is the authority for what draws,
 * `frontlineAffordance` is the fold that reads it, and a second evaluator
 * answering the same question would be a second spelling of one ruling. Nor
 * does it mint a command class — `@/frontline/commands` closes the channel
 * at five and this module's rows 4, 5 and 6 are the acts that reach the
 * device through it.
 */

/* ==================================================================== *
 * THE ELEVEN FUNCTIONALITIES, AND `AC-FL-011-1`.
 *
 * `AC-FL-011-1` (L40151): "Every functionality in this chapter names at
 * least one `FB-FL-*` pattern." Eleven `FUNC-A7-*` identifiers are
 * enumerated at L41363-L41384 and each one's own Fallback clause is
 * transcribed below verbatim, so the criterion is asked of the source's
 * words rather than of a summary of them.
 *
 * THIS MODULE HAS NO GAP, AND THAT IS MEASURED RATHER THAN HOPED. Twelve
 * functionalities across wave 1's four modules name no pattern, each on a
 * ground the source itself gives. All eleven of this module's name one, so
 * `A7_FUNCTIONALITIES_NAMING_NO_PATTERN` is empty — and it is COMPUTED by
 * wave 0's `functionalitiesNamingNoPattern` rather than asserted, so if a
 * later edit dropped a clause the list would fill rather than the sentence
 * going quietly stale.
 * ==================================================================== */

export interface A7Functionality {
  readonly id: string
  /** The functionality's own opening sentence, verbatim. */
  readonly statement: string
  /** The functionality's own Fallback clause, verbatim, backticks stripped. */
  readonly fallbackClause: string
  /** The `FB-FL-*` identifiers that clause names. Empty where it names none. */
  readonly patterns: readonly FrontlineFallbackId[]
  readonly sourceRef: string
}

export const A7_FUNCTIONALITIES = [
  {
    id: 'FUNC-A7-01-1-1',
    statement:
      'Manage an encrypted store regardless of device, assuming no mobile-device-management is present.',
    fallbackClause: 'Fallback: FB-FL-SEC-01.',
    patterns: ['FB-FL-SEC-01'],
    sourceRef: 'L41363',
  },
  {
    id: 'FUNC-A7-01-1-2',
    statement: 'Keep captured media inside the store so nothing reaches the device gallery.',
    fallbackClause: 'Fallback: FB-FL-STORE-01.',
    patterns: ['FB-FL-STORE-01'],
    sourceRef: 'L41364',
  },
  {
    id: 'FUNC-A7-02-1-1',
    statement:
      'Attempt a final sync of pending captures before wiping, so de-authorising a worker or a device never silently destroys unsynced work.',
    fallbackClause: 'Fallback: FB-FL-SEC-01.',
    patterns: ['FB-FL-SEC-01'],
    sourceRef: 'L41367',
  },
  {
    id: 'FUNC-A7-02-1-2',
    statement:
      'Treat the wipe as a critical-class platform action requiring Root Super Admin approval.',
    fallbackClause: 'Fallback: FB-FL-CMD-01.',
    patterns: ['FB-FL-CMD-01'],
    sourceRef: 'L41368',
  },
  {
    id: 'FUNC-A7-03-1-1',
    statement: 'Lock out after repeated failures.',
    fallbackClause: 'Fallback: FB-FL-SEC-01.',
    patterns: ['FB-FL-SEC-01'],
    sourceRef: 'L41371',
  },
  {
    id: 'FUNC-A7-03-2-1',
    statement:
      'Route reset through the managed-credential path owned by the Delivery Operations Hub.',
    fallbackClause: 'Fallback: FB-FL-AUTH-01.',
    patterns: ['FB-FL-AUTH-01'],
    sourceRef: 'L41373',
  },
  {
    id: 'FUNC-A7-04-1-1',
    statement:
      "Hold only what the assigned Runs require, never the wider tenant's data, and hold it only briefly.",
    fallbackClause: 'Fallback: FB-FL-SEC-01.',
    patterns: ['FB-FL-SEC-01'],
    sourceRef: 'L41376',
  },
  {
    id: 'FUNC-A7-05-1-1',
    statement:
      'Continue operations in full while master-data writes are blocked platform-side; the banner goes to the Tenant Admin only.',
    fallbackClause: 'Fallback: FB-FL-SEC-01.',
    patterns: ['FB-FL-SEC-01'],
    sourceRef: 'L41379',
  },
  {
    id: 'FUNC-A7-05-2-1',
    statement:
      'Start no new Runs while letting in-flight Runs complete, capture, sync, compute summaries, and close.',
    fallbackClause: 'Fallback: FB-FL-CMD-01.',
    patterns: ['FB-FL-CMD-01'],
    sourceRef: 'L41381',
  },
  {
    id: 'FUNC-A7-05-3-1',
    statement:
      'Lock immediately, preserve all local data, and show the fixed message "Operation suspended. Contact your supervisor. Your work has been saved."',
    fallbackClause: 'Fallback: FB-FL-SEC-01.',
    patterns: ['FB-FL-SEC-01'],
    sourceRef: 'L41383',
  },
  {
    id: 'FUNC-A7-05-3-2',
    statement:
      "Render the message verbatim in the worker's language from the versioned locale pack, with no runtime translation.",
    fallbackClause: 'Fallback: FB-FL-SEC-01.',
    patterns: ['FB-FL-SEC-01'],
    sourceRef: 'L41384',
  },
] as const satisfies readonly A7Functionality[]

/**
 * `AC-FL-011-1` ASKED, THROUGH WAVE 0's ONE IMPLEMENTATION OF THE RULE.
 * Empty is the criterion met, and the value is computed rather than claimed.
 */
export const A7_FUNCTIONALITIES_NAMING_NO_PATTERN =
  functionalitiesNamingNoPattern(A7_FUNCTIONALITIES)

/**
 * `FUNC-A7-03-1-1` STATES AN OPEN VALUE AND NAMES NO NUMBER, SO NEITHER
 * DOES THIS MODULE. L41371: "the exact failure count and any lockout
 * duration are `Not specified in the Statement of Work` and are `TBD —
 * Client Decision Required`". The section's own source status agrees at
 * L41446 — "Lockout thresholds are `TBD — Client Decision Required`". A
 * plausible number here would be indistinguishable from a stated one
 * forever afterwards.
 */
export const A7_LOCKOUT_THRESHOLD = {
  attempts: null,
  duration: null,
  note: 'The exact failure count and any lockout duration are Not specified in the Statement of Work and are TBD — Client Decision Required. The stated trade-off is that too few attempts locks out gloved workers mistyping on a small keypad, while too many weakens the control. Decision owner: the client, through the deep security pass under engineering design item E10.',
  sourceRef: 'L41371 (FUNC-A7-03-1-1), L41446 (source status), L42596 (E10)',
} as const

/* ==================================================================== *
 * THE FALLBACK SETS, ALL THREE, RECONCILED NOWHERE.
 * ==================================================================== */

/** §22.9's module map, read through wave 0. Three patterns list `MOD-FL-A7`. */
export const A7_PATTERNS_FROM_MAP: readonly FrontlineFallbackPattern[] =
  patternsForModule('MOD-FL-A7')

/**
 * A FINDING, CARRIED AND NOT RECONCILED — the same three-way divergence
 * wave 1 measured on `MOD-FL-A1`, `MOD-FL-A3` and `MOD-FL-A5`, present
 * again here in the same shape and with the same absence of any `DEC-*`
 * identifier attached to it anywhere.
 *
 * §22.9's module map lists `MOD-FL-A7` against THREE patterns —
 * `FB-FL-CMD-01` (L40135), `FB-FL-STORE-01` (L40139) and `FB-FL-SEC-01`
 * (L40141). The module card's own Fallback identifier line (L41351) names
 * FOUR, adding `FB-FL-AUTH-01` "for credential paths". The eleven
 * functionalities reach the same four. `FB-FL-AUTH-01`'s map row (L40131)
 * lists `MOD-FL-A1`, `MOD-FL-A6`, `MOD-FL-B9` and `MOD-FL-B11`, and
 * `MOD-FL-A7` is not among them, while `FUNC-A7-03-2-1` (L41373) names it
 * outright.
 *
 * Wave 1's measurements were A1 2/3/4, A3 4/6/7, A5 3/4/7. This module is
 * 3/4/4. `patternsForModule` stays the map's reading, untouched, and the
 * other two readings stand beside it with their own lines.
 */
export const A7_PATTERN_DIVERGENCE = {
  fromTheModuleMap: ['FB-FL-CMD-01', 'FB-FL-STORE-01', 'FB-FL-SEC-01'],
  fromTheCardsFallbackLine: [
    'FB-FL-SEC-01',
    'FB-FL-CMD-01',
    'FB-FL-STORE-01',
    'FB-FL-AUTH-01',
  ],
  fromTheFunctionalities: [
    'FB-FL-SEC-01',
    'FB-FL-STORE-01',
    'FB-FL-CMD-01',
    'FB-FL-AUTH-01',
  ],
  note: "§22.9's module map names three patterns for this module; the module card's own Fallback identifier line names four; the eleven functionalities between them name the same four. The map does not list this module against FB-FL-AUTH-01, and the card and FUNC-A7-03-2-1 both do. All three readings are the source's own, no DEC-* identifier is attached to the disagreement anywhere, and none of the three is corrected here.",
  sourceRef:
    'map L40130-L40143 (rows L40135, L40139, L40141, and L40131 which omits this module); card L41351; functionalities L41373',
} as const

/** Every pattern this module's own words reach, derived from the eleven. */
export const A7_PATTERNS_NAMED_BY_FUNCTIONALITIES = [
  ...new Set(A7_FUNCTIONALITIES.flatMap((f) => f.patterns)),
] as const satisfies readonly FrontlineFallbackId[]

/* ==================================================================== *
 * THE FIXED COMPLIANCE MESSAGE, AND WHY THIS MODULE DOES NOT RENDER IT.
 * ==================================================================== */

/**
 * `SCR-FL-21` — the suspension lock screen — is this module's (L39883) and
 * its Destination column reads "Full-screen interrupt", so it is not a
 * route and this build's six destinations do not grow a seventh for it.
 * `SB-FL-016` (L41412) describes it: "A full-screen interrupt, high
 * contrast, no controls except a language toggle… No error code, no retry,
 * no dismiss." It also says the sync indicator is NOT shown there, and
 * gives the reason.
 *
 * THIS MODULE'S VIEW IS `SCR-FL-06` PROFILE-LITE, AND THAT SCREEN IS NOT
 * LOCKED. So the lock is DESCRIBED here and not rendered, and neither
 * wording of the fixed message is printed as the message anywhere in this
 * module — the module that would print it is the one that renders the
 * interrupt, and slice 7 does not build it.
 */
export const A7_COMPLIANCE_LOCK = {
  screenId: 'SCR-FL-21',
  storyboard: 'SB-FL-016',
  description:
    'A full-screen interrupt, high contrast, no controls except a language toggle. One line, the fixed message. No error code, no retry, no dismiss. Beneath it, nothing else. The sync indicator is not shown, because there is nothing the worker can do about it and showing a pending count here would invite a worker to try to fix a state they cannot fix.',
  whyNotRenderedHere:
    'Profile-lite is not the lock. §22.7 gives SCR-FL-21 the Destination column “Full-screen interrupt” (L39883), so it is a state of the application rather than a destination, and this build does not key a route on it. Nothing in this module prints either wording of the fixed message as the message.',
  sourceRef: 'L39883 (§22.7), L41412 (SB-FL-016), L41383 (FUNC-A7-05-3-1)',
} as const

/**
 * WHERE THE FIXED MESSAGE IS QUOTED, AND WHICH WORDING EACH PLACE USES.
 * Measured across the frozen source rather than assumed: EVERY Frontline
 * occurrence quotes Reading A, and `TEST-SCR-FL-006` (L48703) requires both
 * wordings preserved. The two readings themselves are carried in
 * `A7_DISCLOSURES` under `DEC-MSG-001` and neither is marked the answer.
 */
export const A7_MESSAGE_RENDERINGS = [
  { where: 'Surface-level terminal safe state, §22.5', quotes: 'Reading A', locator: 'L39913' },
  {
    where: 'FB-FL-SEC-01, first fallback under compliance suspension',
    quotes: 'Reading A',
    locator: 'L40120',
  },
  { where: 'AC-A1-7 — "displays the fixed message verbatim"', quotes: 'neither', locator: 'L40321' },
  { where: 'FUNC-A7-05-3-1, the compliance lock', quotes: 'Reading A', locator: 'L41383' },
  { where: 'Storyboard SB-FL-016, the compliance lock', quotes: 'Reading A', locator: 'L41412' },
  {
    where: 'Part IV §4.2.3, the worker-facing contract',
    quotes: 'Reading A',
    locator: 'L12663',
  },
  {
    where: 'The suspension notification matrix, workers on mobile',
    quotes: 'Reading A',
    locator: 'L26929',
  },
  {
    where: 'TEST-SCR-FL-006 — names DEC-MSG-001 and requires both, quoting neither',
    quotes: 'neither',
    locator: 'L48703',
  },
] as const

/* ==================================================================== *
 * THE DECISIONS THIS MODULE DISCLOSES.
 *
 * WHY THEY ARE NOT RENDERED BY `@/disclosure/DecisionDisclosure`. That
 * component takes a `DecisionId`, and the union the canon in
 * `src/disclosure/decisions.ts` exports contains NONE of
 * `DEC-MSG-001`, `DEC-WIPE-001`, `DEC-WIPELOGOUT-001`, `DEC-SUSP-001`,
 * `DEC-DEVICE-001` or `DEC-CMDCLASS-001`. Adding them means editing a file this
 * module does not own, and one later task lifts them all at once.
 *
 * `Stu14LocalDisclosure` in `@/studio/modules/stu-14/rendering` set the
 * idiom and wave 1 followed it: disclose locally IN THE CANON'S OWN SHAPE,
 * import `DecisionReading` rather than redeclaring it, declare the gap on
 * `canonNote`, and never file a decision under a neighbouring identifier.
 *
 * THE STAND-IN IS BUILT TO EXPIRE. The covering suite reads the canon's
 * exported `DecisionId` union out of the file and asserts every identifier
 * carried here is ABSENT from it. The moment one is lifted, this module's
 * suite goes red and forces the switch — a stand-in with no expiry gate is
 * how two spellings of one decision ship.
 * ==================================================================== */

export type A7DecisionRef =
  | 'DEC-MSG-001'
  | 'DEC-WIPE-001'
  | 'DEC-WIPELOGOUT-001'
  | 'DEC-SUSP-001'
  | 'DEC-DEVICE-001'
  | 'DEC-CMDCLASS-001'

export interface A7LocalDisclosure {
  readonly decisionRef: A7DecisionRef
  readonly question: string
  /** The canon's own reading shape, imported. Two fields, and neither is `answer`. */
  readonly readings: readonly DecisionReading[]
  /** What this build does. Never presented as the source's ruling. */
  readonly adopted: string
  /** Why this module is a place the decision has to be disclosed. */
  readonly whyHere: string
  /** Why it is disclosed locally rather than through the shared canon. */
  readonly canonNote: string
}

const CANON_NOTE =
  'The shared decision canon at @/disclosure/decisions carries no record keyed to this identifier — ' +
  'it is not a member of that file’s DecisionId union — and that file is ' +
  'another task’s path. Disclosed here in the canon’s own shape so it can be absorbed without a ' +
  'rewrite, and declared as a gap rather than filed under a neighbouring identifier.'

export const A7_DISCLOSURES = [
  {
    decisionRef: 'DEC-MSG-001',
    question:
      'The fixed worker-facing compliance-suspension message is worded differently in two Parts, and it is the only text the platform shows a worker at the moment their device locks.',
    readings: [
      {
        text: 'Reading A: “Operation suspended. Contact your supervisor. Your work has been saved.”',
        locator: 'L5265 · SoW Fact — §4.2.3, repeated verbatim at §7.11',
      },
      {
        text: 'Reading B: “Operation suspended — your work has been saved.”',
        locator: 'L5266 · SoW Fact — §8.9.2',
      },
      {
        text: 'The divergence, recorded: this blueprint uses the Part IV wording as the worker-facing string because Part IV is where the worker-facing contract lives, and notes the divergence in wording as a drafting inconsistency rather than a behavioural one.',
        locator: 'L44923',
      },
    ],
    adopted:
      'Both wordings are carried and neither is rendered as the fixed message. TEST-SCR-FL-006 (L48703) requires both preserved, and every Frontline occurrence of the string quotes Reading A alone — L39913, L40120, L41383, L41412 — while AC-A1-7 (L40321) says “displays the fixed message verbatim” and quotes neither. The shorter wording drops the only actionable instruction in the sentence, which is why the divergence is not a wording preference.',
    whyHere:
      'FUNC-A7-05-3-1 (L41383) is the functionality that shows the message, and SB-FL-016 (L41412) is the screen that shows it. This module owns both. Profile-lite is not the lock screen, so this module describes the lock and prints neither wording as the message.',
    canonNote: CANON_NOTE,
  },
  {
    decisionRef: 'DEC-WIPE-001',
    question:
      'How long a wipe command may remain pending, and what happens if the device never returns. §7.11 and §8.13.3 require a final sync attempt before erasure, which an offline device cannot perform, and the Statement of Work states neither the pending lifetime nor the never-returns behaviour.',
    readings: [
      {
        text: 'The two ends of the range are both unacceptable in different ways: a wipe that expires quickly leaves a lost device holding tenant data indefinitely, while a wipe that never expires leaves an open destructive command that could fire months later against a device that has since been legitimately re-enrolled.',
        locator: 'L41355',
      },
      {
        text: 'The four options on the record: (a) an indefinite pending wipe with no expiry; (b) a tenant-set expiry after which the command is marked expired and a fleet alert is raised; (c) an expiry that converts the wipe into a lock-on-contact rather than an erase-on-contact, preserving the evidence for later extraction; (d) a two-stage command in which the device locks immediately on contact and erases only after a successful final sync.',
        locator: 'L41355',
      },
      {
        text: 'The state diagram draws it honestly rather than inventing an exit: the self-loop on WipePending is the honest depiction of DEC-WIPE-001 — the source requires a final sync before erasure and does not say what happens when that sync cannot occur, so the state has no specified exit.',
        locator: 'L41406, L41410',
      },
    ],
    adopted:
      'Nothing is adopted, and AC-A7-8 (L41429) is why: DEC-WIPE-001 and DEC-WIPELOGOUT-001 remain visibly open and no implementation closes either silently. AC-FL-011-5 (L40155) says the same for this decision and DEC-STORE-001, and AC-FL-026-5 (L42644) forbids the chapter claiming a coverage figure while it stands. The source records a recommendation — option (d) — and a recommendation is not a resolution; the residual risk it names is that a device which locks but cannot sync still holds data, for which encryption at rest, not the wipe, is the actual control. Decision owner: the client, jointly across the Frontline and Super Admin workstreams.',
    whyHere:
      'Row 4 of this matrix is the act (L41300) and FUNC-A7-02-1-1 (L41367) states the offline half of it in terms — “Offline: it cannot, which is the heart of DEC-WIPE-001”. STATE-A7-WIPEPENDING is one of this module’s seven states, and it is the state with no specified exit. The module’s own traceability row names this decision and only this one (L60845).',
    canonNote: CANON_NOTE,
  },
  {
    decisionRef: 'DEC-WIPELOGOUT-001',
    question:
      '§7.11 states server-triggered remote data wipe on logout or de-authorisation. Read literally, a wipe on every logout erases the encrypted store at every Shared-mode shift handover.',
    readings: [
      {
        text: 'The literal reading: taken literally, a wipe on every logout would erase the encrypted store at every Shared-mode shift handover, which would contradict §7.10.7’s rule that media is evicted only after confirmed server receipt plus an integrity check, and would destroy a departing worker’s queued captures whenever the floor logged out while offline.',
        locator: 'L41357 · §7.11',
      },
      {
        text: 'The reading this chapter adopts: “logout” here means a de-authorising logout event initiated by the platform, not the ordinary end-of-shift logout a worker performs, and ordinary logout preserves the queue.',
        locator: 'L41357 · Client Decision Required — DEC-WIPELOGOUT-001',
      },
    ],
    adopted:
      'The adopted reading, with the literal one left standing beside it. AC-A7-8 (L41429) requires both this and DEC-WIPE-001 to remain visibly open and forbids any implementation closing either silently. The illustrative example at L41414 works the adopted reading through in the source’s own words: fourteen pending captures from the previous shift were never at risk, because an ordinary end-of-shift logout does not wipe the store.',
    whyHere:
      'It lands on rows 1 and 4 of this matrix — the encrypted store and the wipe — and it decides what SCR-FL-06 Profile-lite’s logout does to the store. Profile-lite is where the worker logs out (L40218), which makes this the destination the literal reading would be most destructive on.',
    canonNote: CANON_NOTE,
  },
  {
    decisionRef: 'DEC-SUSP-001',
    question:
      'How a soft suspension is released. §4.2.4 says the platform acts on the operator’s signal and not on a payment event; §8.9.2 and Part IX give the soft-state exit as automatic on payment; §4.2.1 and §8.12 state there is no payment integration on the platform.',
    readings: [
      {
        text: 'Release on the operator’s explicit signal, with no payment event observed, because the platform receives none.',
        locator: 'L41353 · §4.2.4',
      },
      {
        text: 'Automatic release on payment, as §8.9.2 and Part IX give the soft-state exit.',
        locator: 'L41353 · §8.9.2 and Part IX',
      },
    ],
    adopted:
      'Release by an explicit operator signal in the Super Admin platform console, with NO PAYMENT EVENT OBSERVED. Recorded as an adopted working position dated 2026-08-14 at L41353 and restated at L41379 and L41446. Both readings stay on the record and no payment path is rendered anywhere in this module — there is no payment integration to render one against.',
    whyHere:
      'STATE-A7-SOFTSUSP is one of this module’s seven states (L41315) and FUNC-A7-05-1-1 (L41379) is the functionality that honours it. The source’s own note there is the one worth keeping in view: none of the writes a soft suspension blocks happen on this surface anyway, so the device experiences soft suspension as no change at all.',
    canonNote: CANON_NOTE,
  },
  {
    decisionRef: 'DEC-DEVICE-001',
    question:
      'The standardised device profile — the make or class, capability tier, and operating-system split the target fleets will standardise on. The published minimum specification and the performance envelope are all set against this answer.',
    readings: [
      {
        text: 'The question is open and owed by the client; no profile is stated anywhere in the source.',
        locator: 'L42506 · Client Decision Required',
      },
      {
        text: 'AC-FL-025-5 requires DEC-DEVICE-001 and DEC-SCAN-001 to remain visibly open, and no published budget or performance commitment to be stated as final before they close.',
        locator: 'L42561',
      },
    ],
    adopted:
      'Nothing is adopted, and nothing may be. TEST-FL-025-5 (L42571) asserts the build carries explicit provisional markers pending it, and AC-FL-026-5 (L42644) forbids a coverage claim while it stands. This module names no device make, class, tier or operating system.',
    whyHere:
      'The security position of this module is stated against the absence of a device profile: L41349 — the application manages its own encrypted store “regardless of device, because it may run on shared, tenant-owned, or occasionally personal devices and assumes no mobile-device-management is present”. E10 (L42596) makes the personal-device case part of the deep security pass. The bearing is on the module’s security statement rather than on a matrix row, and it is worth saying which: THIS MODULE’S OWN TRACEABILITY ROW (L60845) NAMES ONLY DEC-WIPE-001. The connection here is through §7.20 and §7.21, not through that row.',
    canonNote: CANON_NOTE,
  },
  {
    decisionRef: 'DEC-CMDCLASS-001',
    question:
      'Device wipe and de-authorisation reaches a device but is not one of the five named command-channel classes. §7.2.2 fixes the channel at five; §7.11 and §8.13.3 nonetheless require a remote wipe and de-authorisation instruction to reach a device.',
    readings: [
      {
        text: 'Either the wipe travels on the command channel, in which case the channel has six classes and the source’s table is incomplete, or it travels on a separate mechanism, in which case that mechanism is undocumented and unaudited by the command channel’s rules.',
        locator: 'L51551',
      },
      {
        text: 'The three options on the record: (a) treat wipe as an instance within the suspension class, which fits its semantics of stopping work on a device; (b) add a sixth class named device lifecycle, and re-state the class count; (c) define a separate device-management channel with its own audited rules.',
        locator: 'L51551',
      },
    ],
    adopted:
      'Nothing is adopted here. The source recommends option (a) and states the trade-off — the suspension class would then contain an irreversible instance, which it otherwise does not — and it says in terms that DEC-WIPE-001 remains separate and unresolved, because that one concerns how long a wipe may remain pending. This build keeps them separate: @/frontline/commands closes the device at five classes, per AC-FL-007-1 (L39719), and mints no sixth.',
    whyHere:
      'Rows 4, 5 and 6 of this matrix are the three acts that reach the device this way, and row 4 is the one with no class to arrive on. @/frontline/commands records the same gap and is the file that has to carry it; this record supplies the identifier the source attaches to it, so the gap is not carried under a neighbouring one.',
    canonNote: CANON_NOTE,
  },
] as const satisfies readonly A7LocalDisclosure[]

/**
 * A FINDING ABOUT A NEIGHBOURING FILE, RECORDED AND NOT EDITED.
 *
 * `STOP_CLASS_ITEMS_WITHOUT_A_COMMAND_CLASS` in `@/frontline/commands`
 * carries device de-authorisation and remote data wipe as items in
 * `DEC-SYNC-001`'s stop class that have no command class among the five,
 * and it files both under `openDecision: 'DEC-WIPE-001'`. Measured against
 * the frozen source, the identifier the source attaches to THAT question is
 * `DEC-CMDCLASS-001` (L51551, indexed at L52187 and L115290), and L51551
 * says in its own last sentence that "`DEC-WIPE-001` remains separate and
 * unresolved: it concerns how long a wipe may remain pending and what
 * happens if the device never returns."
 *
 * Two different questions, one identifier. `@/frontline/commands` is wave
 * 0's file and not this module's to edit, so the correction was recorded
 * here and reported, with a covering test reading that file's own field and
 * asserting the mismatch still stood — so the record could not go stale in
 * either direction.
 *
 * IT DID NOT GO STALE. The controller read L51551, agreed, and refiled the
 * gap in `@/frontline/commands` under `DEC-CMDCLASS-001`. The assertion went
 * red exactly as designed and this note came out with it. What stays is the
 * guard: `filedUnder` still reads wave 0's own field, and the test now
 * asserts it AGREES with the source's identifier. If anyone refiles it under
 * the neighbouring identifier again, this goes red from the other side.
 *
 * The record is kept rather than deleted because the shape of the mistake is
 * the lesson: a gap filed under the nearest identifier that already exists
 * reads exactly like a transcription, since a real decision is attached to a
 * real question — just not to this one.
 */
export const A7_COMMAND_CLASS_GAP = {
  filedUnder: STOP_CLASS_ITEMS_WITHOUT_A_COMMAND_CLASS.map((i) => i.openDecision),
  theSourcesIdentifier: 'DEC-CMDCLASS-001',
  note: 'The gap that de-authorisation and remote wipe reach a device without being one of the five command classes is raised in the frozen source as DEC-CMDCLASS-001, at L51551, and is indexed under that identifier at L52187 and L115290. @/frontline/commands carried the same gap filed under DEC-WIPE-001, which L51551 explicitly holds separate: DEC-WIPE-001 concerns how long a wipe may remain pending and what happens if the device never returns, not which channel it arrives on. That file has since been refiled under DEC-CMDCLASS-001 and this record now guards the agreement rather than reporting the mismatch.',
  sourceRef: 'L51551, L52187, L115290; TEST-27.6-01 at L51562',
} as const

/* ==================================================================== *
 * THE THREE SUSPENSION STATES, AS THE DEVICE EXPERIENCES THEM.
 *
 * L41410 states what the diagram makes explicit and it is the sentence this
 * whole module turns on: "the three suspension states are genuinely
 * different on the device: soft changes nothing the worker can see, hard
 * limits starting work, and compliance stops everything." Three rows,
 * because collapsing them into a severity number is exactly the
 * collapse that sentence exists to refuse.
 * ==================================================================== */

export interface A7SuspensionState {
  readonly stateId: string
  readonly name: string
  /** What the DEVICE does. The source's own words. */
  readonly onTheDevice: string
  /** How it ends, in the source's own words. Never a payment path. */
  readonly exit: string
  readonly sourceRef: string
}

export const A7_SUSPENSION_STATES = [
  {
    stateId: 'STATE-A7-SOFTSUSP',
    name: 'Soft suspension',
    onTheDevice:
      'Operations continue in full while master-data writes are blocked platform-side; the banner goes to the Tenant Admin only. No new Jobs, Workers, locations, shifts, or parts are created — but none of those happen on this surface anyway, so the device experiences soft suspension as no change at all.',
    exit: 'Release by an explicit operator signal in the Super Admin platform console, with no payment event observed because no payment integration exists. An adopted working position under DEC-SUSP-001, dated 2026-08-14, not a position the source settled.',
    sourceRef: 'L41379 (FUNC-A7-05-1-1), L41353 (the exit), L41392-L41394 (the diagram)',
  },
  {
    stateId: 'STATE-A7-HARDSUSP',
    name: 'Hard suspension',
    onTheDevice:
      'Start no new Runs while letting in-flight Runs complete, capture, sync, compute summaries, and close. An enumerated completion pipeline rather than an abrupt stop.',
    exit: 'Reinstatement. The suspension is lifted and the device returns to normal operation.',
    sourceRef: 'L41381 (FUNC-A7-05-2-1), L41305 (row 9), L41427 (AC-A7-6)',
  },
  {
    stateId: 'STATE-A7-COMPLIANCELOCK',
    name: 'Compliance suspension',
    onTheDevice:
      'Lock immediately, preserve all local data, and show the fixed message. Nobody may act on the device, and that includes dismissing the lock. Devices lock at next contact, which the platform states plainly rather than implying an instant global stop.',
    exit: 'The suspension lifting, through the dual authorised path. The lock lifts only when the suspension lifts; there is no dismissal for any persona.',
    sourceRef: 'L41383 (FUNC-A7-05-3-1), L41303 (row 7), L41400 (the diagram)',
  },
] as const satisfies readonly A7SuspensionState[]

/**
 * THE ONE CLAIM AN OFFLINE DEVICE MAY NOT MAKE ABOUT ANY OF THE THREE.
 * L41323: "No suspension, de-authorisation, or wipe command can arrive, and
 * no surface may imply otherwise." L41381 says the same for hard suspension
 * from the other end: "an offline device continues under its last known
 * state, which no surface may misrepresent." `TEST-A7-6` (L41440) delivers
 * a compliance suspension while the device is offline and asserts the
 * device continues under its last known state and that no surface claims
 * the device is locked.
 *
 * THE SAFETY LAYER IS THE OPPOSITE CASE AND IS NOT GATED BY THIS. L40948's
 * Severity 1 hold fires immediately, even offline. What cannot arrive
 * offline is a COMMAND from the platform; what does not change offline is
 * the deterministic layer on the device. Reading either as the other is the
 * inversion `AC-FL-000-4` (L39099) exists to forbid.
 */
export const A7_OFFLINE_HONESTY = {
  claim:
    'No suspension, de-authorisation, or wipe command can arrive while the device is offline, and no surface may imply otherwise. The device continues under its last known state, which no surface may misrepresent as the new one. A pending wipe attempts its final sync of pending captures before erasing, and until it can, nothing is erased.',
  whatStillWorks:
    'Personal Identification Number lockout still operates, because the failure counter is local. The encrypted store operates unchanged. The deterministic safety layer is identical offline and is not what this rule is about: a Severity 1 hold fires immediately, even offline, and the lot is protected from the moment of the breach rather than the moment of sync.',
  sourceRef: 'L41323, L41325, L41381, L41440 (TEST-A7-6); L40948 and AC-FL-000-4 L39099 for the safety layer',
} as const
