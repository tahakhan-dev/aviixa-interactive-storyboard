import type { DecisionReading } from '@/disclosure/decisions'
import { frontlineConnectivityTreatment } from '@/frontline/access'
import {
  patternsForModule,
  type FrontlineFallbackId,
  type FrontlineFallbackPattern,
} from '@/frontline/fallbacks'

/**
 * `MOD-FL-B12`'s own logic and vocabulary. Frozen source §22.21.
 *
 * ── THE ONE STRUCTURAL RULING IN THIS FILE ─────────────────────────────
 *
 * THIS MODULE IMPORTS NOTHING THAT CAN AUTHOR. The Studio half of the Training
 * Library ships in this build, and reusing one of its components would carry
 * upload and versioning across a surface boundary the source draws in words —
 * L42115 gives authoring to the Quality Manager "in the Standards and
 * Operations Studio with an authoring grant, never here". The defence is not a
 * review note: nothing under `@/studio` is imported by any file of this module,
 * and the unit suite reads these files and asserts it, so a later edit that
 * reaches for `trainingControls` or `uploadStatement` goes red rather than
 * shipping a viewer that can upload.
 *
 * THIS MODULE COMPUTES NO PROGRESS AND HOLDS NO COUNT. There is nothing to
 * count from: `AC-B12-5` (L42223) says a viewing creates no Step Execution, no
 * Data Capture and no other production record, so the record a completion
 * figure would be computed from does not exist. That is the reason the
 * prohibition holds here rather than depending on nobody adding one later.
 *
 * ── WHAT IS NOT RE-DERIVED HERE ────────────────────────────────────────
 *
 * The offline treatment comes from `frontlineConnectivityTreatment` in
 * `@/frontline/access`, whose `online-only-read` row cites this module's own
 * lines as the source's case for it. The fallback patterns come from
 * `patternsForModule`. The affordance fold comes from `@/frontline/matrix`.
 * The decision records for the two identifiers the canon already holds come
 * from `@/disclosure/decisions` through `DecisionDisclosure`, not from prose
 * written here.
 */

/* ==================================================================== *
 * THE NINE FUNCTIONALITIES.
 *
 * Counted off the source between the Features heading (L42171) and the Mermaid
 * block (L42193), not off a brief. Five features, five sub-features, nine
 * functionalities.
 * ==================================================================== */

export interface B12Functionality {
  readonly id: string
  /** The functionality's own opening sentence, verbatim. */
  readonly statement: string
  /** The `Purpose:` clause, verbatim. */
  readonly purpose: string
  /** The `Roles prohibited:` clause, verbatim. */
  readonly rolesProhibited: string
  /** The online-and-offline clause, verbatim. */
  readonly connectivity: string
  readonly patterns: readonly FrontlineFallbackId[]
  /**
   * Why `patterns` is empty, IN THE SOURCE'S OWN WORDS. `null` where the
   * functionality names a pattern. Three of the nine name none, each on a
   * ground the source itself gives, and none of the three is filled here.
   */
  readonly patternsNote: string | null
  readonly sourceRef: string
}

export const B12_FUNCTIONALITIES = [
  {
    id: 'FUNC-B12-01-1-1',
    statement:
      'Render only material uploaded with the same discipline as Work-Instruction versions, with ' +
      'who uploaded it, when, and what version is current recorded, and superseded versions ' +
      'remaining in the history.',
    purpose: 'a controlled library, not a shared drive.',
    rolesProhibited: 'no upload or edit on this surface.',
    connectivity: 'Online: renders. Offline: unavailable.',
    patterns: ['FB-FL-CORE-01'],
    patternsNote: null,
    sourceRef: 'FUNC-B12-01-1-1 · L42175',
  },
  {
    id: 'FUNC-B12-02-1-1',
    statement:
      'Exclude the library from the offline Run bundle, keeping bundles lean so assignment-time ' +
      'sync stays fast on floor networks.',
    purpose: 'package economics.',
    rolesProhibited: 'nobody may add training media to a Run package.',
    connectivity: 'Online: reachable. Offline: unavailable.',
    patterns: ['FB-FL-CORE-01'],
    patternsNote: null,
    sourceRef: 'FUNC-B12-02-1-1 · L42178',
  },
  {
    id: 'FUNC-B12-02-1-2',
    statement:
      'Ensure the library is never required mid-Run and that nothing in a Run depends on it.',
    purpose: 'an online-only dependency must never sit in an offline-first execution path.',
    rolesProhibited: 'no authored workflow may make a Run depend on library content.',
    connectivity: 'Online and offline: identical guarantee.',
    patterns: [],
    patternsNote: 'Not applicable — the guarantee is the absence of a dependency.',
    sourceRef: 'FUNC-B12-02-1-2 · L42179',
  },
  {
    id: 'FUNC-B12-02-1-3',
    statement: 'Report unavailability honestly when offline rather than rendering an empty list.',
    purpose: 'the worker sees state honestly.',
    rolesProhibited: 'no surface may imply the library is empty rather than unreachable.',
    connectivity: 'Online and offline: distinct renderings.',
    patterns: ['FB-FL-CORE-01'],
    patternsNote: null,
    sourceRef: 'FUNC-B12-02-1-3 · L42180',
  },
  {
    id: 'FUNC-B12-03-1-1',
    statement:
      'Provide a video or document per language as separate assets — English and Spanish variants, ' +
      'video or video with alternate audio.',
    purpose: 'the platform does not machine-translate or dub long-form media.',
    rolesProhibited: 'no runtime translation by anybody.',
    connectivity: 'Online: the matching variant renders. Offline: unavailable.',
    patterns: ['FB-FL-CORE-01'],
    patternsNote: null,
    sourceRef: 'FUNC-B12-03-1-1 · L42183',
  },
  {
    id: 'FUNC-B12-03-1-2',
    statement: "Render in the worker's language where a variant exists.",
    purpose: "the worker's profile language drives every rendering layer wherever a rendering exists.",
    rolesProhibited: 'none.',
    connectivity: 'Online: applies. Offline: unavailable.',
    patterns: ['FB-FL-CORE-01'],
    patternsNote: null,
    sourceRef: 'FUNC-B12-03-1-2 · L42184',
  },
  {
    id: 'FUNC-B12-04-1-1',
    statement: "Scope the viewer to the worker's tenant.",
    purpose: 'cross-tenant data isolation is a platform-fixed invariant.',
    rolesProhibited: 'all cross-tenant access.',
    connectivity: 'Online: enforced. Offline: unavailable.',
    patterns: ['FB-FL-SEC-01'],
    patternsNote: null,
    sourceRef: 'FUNC-B12-04-1-1 · L42187',
  },
  {
    id: 'FUNC-B12-04-1-2',
    statement: 'Ensure watching a video creates no production record.',
    purpose: 'content delivery, not execution.',
    rolesProhibited: 'no component may create a Step Execution or Data Capture from a viewing.',
    connectivity: 'Online: enforced. Offline: not applicable, as viewing is impossible.',
    patterns: [],
    patternsNote: 'Not applicable — the absence of a record cannot fail.',
    sourceRef: 'FUNC-B12-04-1-2 · L42188',
  },
  {
    id: 'FUNC-B12-05-1-1',
    statement: 'Provide no practice mode.',
    purpose:
      'a rehearsal capability running a real Workflow end to end with results segregated from ' +
      'production records would be a change request if it resurfaces.',
    rolesProhibited: 'every role.',
    connectivity: 'Online and offline: identical absence.',
    patterns: [],
    patternsNote: 'Not applicable — an excluded capability has no failure mode.',
    sourceRef: 'FUNC-B12-05-1-1 · L42191',
  },
] as const satisfies readonly B12Functionality[]

/* ==================================================================== *
 * THREE READINGS OF THIS MODULE'S FALLBACK SET, CARRIED APART.
 *
 * Measured on this module and identical in shape to the three measured before
 * it. The section 22.9 module map, the card's own Fallback identifier field
 * and the functionality clauses do not agree, and none of the three is
 * reconciled here. No `DEC-*` identifier is attached to the disagreement
 * anywhere in the frozen source.
 *
 * THE MAP AND THE CARD AGREE ON ONE PATTERN. The map row for `FB-FL-CORE-01`
 * (L40130) lists this module; the card (L42167) names `FB-FL-CORE-01` primary.
 *
 * THE FUNCTIONALITIES NAME A SECOND. `FUNC-B12-04-1-1` (L42187) names
 * `FB-FL-SEC-01`, and `FB-FL-SEC-01`'s own map row (L40141) lists
 * `MOD-FL-A7`, `MOD-FL-A1` and `MOD-FL-B11` and does not list this module.
 * That is the same shape as `FB-FL-PKG-01`'s map row omitting `MOD-FL-A5`
 * while A5's card claims it — the disagreement runs in the same direction each
 * time it is measured.
 * ==================================================================== */

/** Reading one: what §22.9's map gives this module. Read, never listed again. */
export const B12_MAPPED_PATTERNS: readonly FrontlineFallbackPattern[] =
  patternsForModule('MOD-FL-B12')

/** Reading two: what the card's own Fallback identifier field names, L42167. */
export const B12_CARD_PATTERNS = ['FB-FL-CORE-01'] as const satisfies readonly FrontlineFallbackId[]

/** Reading three: what the nine functionalities name. Derived from them. */
export const B12_PATTERNS_NAMED_BY_FUNCTIONALITIES = [
  ...new Set(B12_FUNCTIONALITIES.flatMap((f) => f.patterns as readonly FrontlineFallbackId[])),
] as const satisfies readonly FrontlineFallbackId[]

/**
 * `AC-FL-011-1` (L40151) asks every functionality to name at least one
 * `FB-FL-*` pattern. Three of this module's nine name none, each on a ground
 * the source itself states, and THEY ARE REPORTED RATHER THAN FILLED. An
 * assigned pattern is indistinguishable from a real one forever afterwards,
 * and the criterion then reads clean because nobody looked.
 *
 * DERIVED from the functionality list, so a fourth gap appearing cannot be
 * missed by this constant being out of date.
 */
export const B12_PATTERN_GAPS: readonly B12Functionality[] = B12_FUNCTIONALITIES.filter(
  (f) => f.patterns.length === 0,
)

/* ==================================================================== *
 * THE HONEST RENDERING, WHICH IS A FUNCTIONALITY RATHER THAN A FALLBACK.
 *
 * `FUNC-B12-02-1-3` (L42180) makes reporting unavailability honestly a
 * functionality in its own right and says the two renderings are distinct. The
 * offline sentence is NOT written here: it is wave 0's `online-only-read`
 * treatment, which the surface settled once for every screen that has no local
 * copy to show, and whose own `sourceRef` cites this module's lines.
 * ==================================================================== */

export interface LibraryRendering {
  readonly connected: boolean
  /** The state the card names for this connectivity, L42130. */
  readonly state: 'STATE-B12-AVAILABLE' | 'STATE-B12-UNAVAILABLE'
  /** The line the screen prints. Never an empty list, never an error code. */
  readonly line: string
  readonly sourceRef: string
}

export function libraryRendering(connected: boolean): LibraryRendering {
  if (connected) {
    return {
      connected: true,
      state: 'STATE-B12-AVAILABLE',
      line:
        'Material scoped to your tenant, rendered in your language where a variant exists. Nothing ' +
        'you watch or read here is recorded as production data.',
      sourceRef: 'L42135, L42137',
    }
  }
  const treatment = frontlineConnectivityTreatment({ kind: 'online-only-read' })
  return {
    connected: false,
    state: 'STATE-B12-UNAVAILABLE',
    // The storyboard's own frame 3 line, then the surface's settled reason for
    // an online-only read. Not an empty list, and not an error code.
    line: `${SB_FL_021_FRAMES[2].line} ${treatment.reason}`,
    sourceRef: `SB-FL-021 · L42209; ${treatment.sourceRef}`,
  }
}

/* ==================================================================== *
 * THE STORYBOARD, `SB-FL-021` — the library, connected and not. L42209.
 * ==================================================================== */

export interface B12StoryboardFrame {
  readonly n: number
  /** The frame's own description, verbatim. */
  readonly description: string
  /** The line the frame puts on screen, where it gives one. Empty otherwise. */
  readonly line: string
  /** Whether this slice draws the frame, or states it. */
  readonly drawnHere: boolean
  readonly sourceRef: string
}

export const SB_FL_021_FRAMES = [
  {
    n: 1,
    description:
      'connected: a simple list of titles with durations and a language marker, grouped by station, ' +
      'with a search field.',
    line: '',
    drawnHere: true,
    sourceRef: 'SB-FL-021 · L42209',
  },
  {
    n: 2,
    description:
      'a video playing full screen with standard controls and no capture affordances anywhere.',
    line: '',
    drawnHere: true,
    sourceRef: 'SB-FL-021 · L42209',
  },
  {
    n: 3,
    description:
      'offline: the same destination shows a single line — not an empty list, and not an error code.',
    line:
      'The Training Library needs a connection. It is not needed for any of your runs.',
    drawnHere: true,
    sourceRef: 'SB-FL-021 · L42209',
  },
] as const satisfies readonly B12StoryboardFrame[]

/**
 * What frame 1 names that this slice states rather than builds. Grouping by
 * station and a search field are list affordances over a corpus this build does
 * not hold; the one item below is the source's own, and a search box over one
 * item would be a control pretending to a capability.
 */
export const SB_FL_021_STATED_NOT_BUILT =
  'Frame 1 also names grouping by station and a search field. This slice renders the frozen ' +
  "source's own single example item rather than a tenant corpus, so neither is built here — a " +
  'search field over one item would be a control pretending to a capability.'

/**
 * THE ONE ITEM ON THE LIST, AND IT IS THE SOURCE'S OWN. L42211 is an
 * `Illustrative Example` and is labelled as one on screen. Every field below is
 * a fact that line states; nothing is invented to fill a column, and the
 * duration is the material's own length rather than anything measured about a
 * worker.
 */
export const B12_ILLUSTRATIVE_ITEM = {
  classification: 'Illustrative Example',
  subject: 'operating the torque wrench',
  length: 'ten-minute',
  language: 'Spanish',
  uploadedBy: "Elena's team",
  version: 'its third version',
  station: 'Wheel Station 2',
  device: 'TAB-014',
  whatItIsNot:
    'Nothing about the viewing enters the production record, and no run depends on his having ' +
    'watched it. During the outage later that day, the library is simply unavailable, and nothing ' +
    'he needed to do was affected.',
  sourceRef: 'L42211',
} as const

/* ==================================================================== *
 * ACCEPTANCE CRITERIA AND THE TESTS THE REFUSALS ANSWER TO.
 * ==================================================================== */

export const B12_ACCEPTANCE_CRITERIA = [
  {
    id: 'AC-B12-1',
    text: 'No training material is included in any Run package or downloaded to the device.',
    sourceRef: 'AC-B12-1 · L42219',
  },
  {
    id: 'AC-B12-2',
    text: 'No authored workflow can create a dependency on library content, and no Run blocks on it.',
    sourceRef: 'AC-B12-2 · L42220',
  },
  {
    id: 'AC-B12-3',
    text: "The viewer is scoped to the worker's tenant, verified by attempted cross-tenant access.",
    sourceRef: 'AC-B12-3 · L42221',
  },
  {
    id: 'AC-B12-4',
    text:
      "Material renders in the worker's language where a variant exists, with no runtime " +
      'translation or dubbing.',
    sourceRef: 'AC-B12-4 · L42222',
  },
  {
    id: 'AC-B12-5',
    text: 'A viewing creates no Step Execution, Data Capture, or other production record.',
    sourceRef: 'AC-B12-5 · L42223',
  },
  {
    id: 'AC-B12-6',
    text:
      'Offline, the destination reports unavailability with a plain message rather than an empty ' +
      'list.',
    sourceRef: 'AC-B12-6 · L42224',
  },
  {
    id: 'AC-B12-7',
    text: 'No practice or rehearsal mode exists in the build.',
    sourceRef: 'AC-B12-7 · L42225',
  },
] as const satisfies readonly { readonly id: string; readonly text: string; readonly sourceRef: string }[]

/** The three Denial tests and the Offline one. The four the refusals answer to. */
export const B12_DENIAL_TESTS = [
  {
    id: 'TEST-B12-3',
    type: 'Denial',
    text: 'Attempt cross-tenant access by identifier manipulation and assert refusal.',
    sourceRef: 'TEST-B12-3 · L42233',
  },
  {
    id: 'TEST-B12-4',
    type: 'Denial',
    text: 'Inspect a Run package and assert no training media is present.',
    sourceRef: 'TEST-B12-4 · L42234',
  },
  {
    id: 'TEST-B12-5',
    type: 'Denial',
    text:
      'Attempt to author a workflow step that requires library content and assert the platform ' +
      'refuses.',
    sourceRef: 'TEST-B12-5 · L42235',
  },
  {
    id: 'TEST-B12-6',
    type: 'Offline',
    text:
      'Airplane-mode test asserting the honest unavailability message and no empty-list rendering.',
    sourceRef: 'TEST-B12-6 · L42236',
  },
] as const satisfies readonly {
  readonly id: string
  readonly type: string
  readonly text: string
  readonly sourceRef: string
}[]

/* ==================================================================== *
 * WHAT DID NOT LINE UP, RECORDED RATHER THAN CLOSED.
 * ==================================================================== */

export interface B12SourceFinding {
  readonly what: string
  readonly evidence: string
  readonly notClosedBecause: string
  readonly sourceRef: string
}

export const B12_SOURCE_FINDINGS = [
  {
    what: 'This module names no open decision anywhere in its own section.',
    evidence:
      'Section 22.21 runs from L42093 to L42240 and no DEC-* identifier occurs on any line of it. ' +
      'The two decisions disclosed on this screen are attached to the source elsewhere — the ' +
      "Offline and Sync Engine's own functionality and source status carry both.",
    notClosedBecause:
      'They still bear on this module, because the library is versioned and this is the surface a ' +
      'version reaches a worker on. They are disclosed as decisions this module is downstream of ' +
      'rather than as decisions the source filed against it, and the difference is stated rather ' +
      'than smoothed over.',
    sourceRef: 'L41195, L41276',
  },
  {
    what: 'The three readings of this module’s fallback set do not agree.',
    evidence:
      'The section 22.9 map gives it FB-FL-CORE-01 and no more. The card names FB-FL-CORE-01 ' +
      'primary. The functionalities name FB-FL-CORE-01 and FB-FL-SEC-01, and FB-FL-SEC-01’s own ' +
      'map row lists MOD-FL-A7, MOD-FL-A1 and MOD-FL-B11 without this module.',
    notClosedBecause:
      'No DEC-* identifier is attached to the disagreement anywhere in the frozen source, and the ' +
      'same shape has been measured on three earlier modules. All three readings are carried; none ' +
      'is reconciled.',
    sourceRef: 'L40130, L40141, L42167, L42187',
  },
  {
    what: 'Three of the nine functionalities name no FB-FL-* pattern.',
    evidence:
      'AC-FL-011-1 asks every functionality in the chapter to name at least one. The three that do ' +
      'not each give a ground of their own: the guarantee is the absence of a dependency; the ' +
      'absence of a record cannot fail; an excluded capability has no failure mode.',
    notClosedBecause:
      'They are reported, not filled. An assigned pattern is indistinguishable from a real one ' +
      'forever afterwards, and the criterion would then read clean because nobody looked.',
    sourceRef: 'AC-FL-011-1 · L40151',
  },
  {
    what: 'This destination carries two different screen identifiers.',
    evidence:
      'The six-row register gives it SCR-FL-05 and the twenty-three-row register gives it ' +
      'SCR-FL-19, while giving SCR-FL-05 to the package readiness detail on My Runs.',
    notClosedBecause:
      'RULING-FL-1 settled that no screen identifier is a route key on this surface and that both ' +
      'registers ship with their locators. This module carries both and keys on neither.',
    sourceRef: 'SCR-FL-05 · L48533; SCR-FL-19 · L39881',
  },
  {
    what: 'The source states no notification behaviour for new or updated material.',
    evidence:
      'The Notifications table records the recipient as Not specified in the Statement of Work and ' +
      'the channel as TBD — Client Decision Required, with the notification states exercised given ' +
      'as Not applicable because inventing one would create an obligation the source did not ' +
      'intend.',
    notClosedBecause:
      'It carries no DEC-* identifier, so it is disclosed below as an open item with the three ' +
      'options the source itself lists. No notification is built here in either direction.',
    sourceRef: 'L42159, L42161',
  },
] as const satisfies readonly B12SourceFinding[]

/* ==================================================================== *
 * DECISIONS AND CONTRADICTIONS, IN TWO KINDS, AND THE KINDS ARE NOT ONE.
 *
 * TWO OF THE FOUR ARE IN THE SHARED CANON ALREADY, AND THAT IS THE UNUSUAL
 * CASE ON THIS SURFACE. Wave 1 recorded thirteen Frontline decisions absent
 * from `@/disclosure/decisions` and built local stand-ins for them in the
 * canon's own shape. `DEC-LIB-001` and `DEC-LANEB-001` are NOT among the
 * thirteen: both are members of the canon's `DecisionId` union with full
 * records, raised while `SURF-STU` was built and cited by `SURF-DOH` since. So
 * this module renders them through `DecisionDisclosure`, the one place an open
 * decision is drawn on any surface, and writes no prose of its own for either.
 * A local stand-in beside a canon record would be the second spelling the
 * stand-in idiom exists to prevent.
 *
 * THE OTHER TWO CARRY NO IDENTIFIER AT ALL, so there is nothing to look them up
 * by. They are disclosed locally in the canon's shape — `DecisionReading`
 * IMPORTED rather than redeclared, so a reading carries exactly two fields and
 * there is no field in which one could be marked the answer.
 * ==================================================================== */

/** The two the canon holds. Rendered through `DecisionDisclosure`, never re-worded. */
export const B12_CANON_DECISIONS = [
  {
    id: 'DEC-LIB-001',
    whyHere:
      'The Training Library is a versioned, audited library and this surface is where a version ' +
      'reaches a worker. The question is whether a library edit reaches something already pinned, ' +
      'and this module is the one place on the device where nothing is ever pinned — the library is ' +
      'excluded from the Run bundle by design, so a viewer here always reads whatever the platform ' +
      'currently holds. That is a fact about this module, not an answer to the decision: the ' +
      'question is about containment checklists and coaching assets inside a package, and it stays ' +
      'exactly as open as the canon records it.',
    whereTheSourceAttachesIt:
      'L41195 and L41276, on the Offline and Sync Engine. Section 22.21 names no DEC-* identifier ' +
      'of its own.',
  },
  {
    id: 'DEC-LANEB-001',
    whyHere:
      'The card requires training material to be versioned with the same discipline as ' +
      'Work-Instruction versions, and the adoption class a version travels in is what this decision ' +
      'leaves open. The source does not state which class a training asset publishes under, and ' +
      'this build does not choose one: no version-adoption behaviour is implemented on this screen ' +
      'in either direction.',
    whereTheSourceAttachesIt:
      'L41195, L41276, L41869 and L41927, on the Offline and Sync Engine and on Notifications. ' +
      'Section 22.21 names no DEC-* identifier of its own.',
  },
] as const satisfies readonly {
  readonly id: 'DEC-LIB-001' | 'DEC-LANEB-001'
  readonly whyHere: string
  readonly whereTheSourceAttachesIt: string
}[]

/**
 * A tension the source carries and never names. Same shape as the canon's
 * records so it can be absorbed without a rewrite, and declared as carrying no
 * identifier so a reader does not go looking for one.
 */
export interface B12UnidentifiedTension {
  /** This build's key. There is no source identifier, and saying so is the disclosure. */
  readonly key: string
  readonly question: string
  readonly readings: readonly DecisionReading[]
  /** What this build does. Never presented as the source's ruling. */
  readonly adopted: string
  readonly whyHere: string
  readonly noIdentifierNote: string
}

const NO_IDENTIFIER_NOTE =
  'The frozen source attaches no DEC-* identifier to this anywhere, so there is nothing to look it ' +
  'up by and nothing for a client to search the decision canon for. It is disclosed here with both ' +
  'locators, in the canon’s own shape, and it is not filed under a neighbouring identifier — a ' +
  'client searching for one of those would then find someone else’s decision instead.'

export const B12_UNIDENTIFIED_TENSIONS = [
  {
    key: 'unavailable-two-senses',
    question:
      'The token Unavailable is used for two opposite conditions six rows apart in this one matrix. ' +
      'Does it mean a capability that exists and is absent under a stated condition, or a ' +
      'capability that exists nowhere for anyone?',
    readings: [
      {
        text:
          'Row 2 means the first: the library is deliberately excluded from the offline Run bundle, ' +
          'and the destination becomes available again at the next connection with no queued state.',
        locator: 'L42114',
      },
      {
        text:
          'Row 8 means the second: practice mode is not in this scope. It is cut rather than ' +
          'deferred and returns only as a change request, so there is no condition to lift. ' +
          'MOD-FL-B10 uses the token in this same permanent sense for operating-system push.',
        locator: 'L42120 · L41797',
      },
    ],
    adopted:
      'Both readings stand and neither is corrected. The token is printed on screen exactly as each ' +
      'cell writes it, and what differs is the sentence beside it: one says the capability returns ' +
      'when the condition lifts, the other says there is nothing to come back to. The separation is ' +
      'wave 0’s capability-existence field rather than a rule written here, and the affordance fold ' +
      'reaches that field before it reaches the token, so a screen cannot render the two the same ' +
      'way by reading the token alone.',
    whyHere:
      'This matrix is the only place in the frozen source where both senses sit inside one table. ' +
      'It is the module that has to render them apart, so it is the module that discloses the ' +
      'overload.',
    noIdentifierNote: NO_IDENTIFIER_NOTE,
  },
  {
    key: 'training-material-notification',
    question:
      'Is a worker notified when new or updated training material is published, and through which ' +
      'channel?',
    readings: [
      {
        text:
          'The source does not state that a worker is notified of new training material. The ' +
          'recipient is Not specified in the Statement of Work and the channel is TBD — Client ' +
          'Decision Required.',
        locator: 'L42159',
      },
      {
        text:
          'A controlled library nobody knows has changed is a library nobody uses, while a forced ' +
          'notification would contradict the no-read-obligation position of MOD-FL-B10.',
        locator: 'L42161',
      },
    ],
    adopted:
      'Nothing is resolved here and no notification is built in either direction. The source lists ' +
      'three options — no notification at all, relying on supervisors to direct learning; a ' +
      'non-obligating inbox item; or a per-tenant setting — and recommends the second because it ' +
      'matches the general-notification model already specified and creates no obligation. Decision ' +
      'owner: the client.',
    whyHere:
      'It is this module’s own Notifications field. Inventing a notification would create an ' +
      'obligation the source explicitly says it did not intend, and building none silently would ' +
      'answer the question in the other direction just as quietly.',
    noIdentifierNote: NO_IDENTIFIER_NOTE,
  },
] as const satisfies readonly B12UnidentifiedTension[]
