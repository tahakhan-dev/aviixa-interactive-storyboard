import type { DecisionId, DecisionReading } from '@/disclosure/decisions'
import { frontlineConnectivityTreatment } from '@/frontline/access'
import {
  functionalitiesNamingNoPattern,
  patternsForModule,
  type FrontlineFallbackId,
  type FrontlineFallbackPattern,
} from '@/frontline/fallbacks'

/**
 * `MOD-FL-B8` — Coaching Rendering. The module's own logic and vocabulary.
 *
 * THE WHOLE OF THIS FILE OBEYS ONE SENTENCE FROM THE MATRIX: "coaching is
 * advisory and never gates" (L41471). Every model below is shaped so that a
 * gating build would not compile rather than merely being reviewed for:
 * `gates` and `dismissRequired` are declared as the LITERAL type `false`, the
 * same construction wave 0 uses for `degradedOffline: false` on the safety
 * layer and `queued: true` on an offline write. A `true` there is a type
 * error, not a code-review finding.
 *
 * THE SECOND CONSTRUCTION, AND IT IS THE SURVEILLANCE ONE.
 * `B8DismissalOutcome.supervisorNotification` is typed `null` rather than
 * `something | null`. `AC-B8-4` (L41579) — "a single dismissal raises no
 * supervisor notification; only the Studio-defined repeated-coaching pattern
 * does" — is therefore held by the type system rather than by a branch anyone
 * could add an exception to. Nothing in this module counts dismissals, and
 * nothing compares one worker with another: the repeated-coaching pattern is
 * defined in the Standards and Operations Studio and evaluated where that
 * definition lives (`FUNC-B8-01-2-3`, L41536), never on the device.
 */

/* ==================================================================== *
 * THE HAPPY PATH. L41486, steps at L41488-L41492.
 * ==================================================================== */

export interface B8Step {
  /**
   * The step's ordinal, as a literal union. There is no `number` anywhere in
   * this module and this is why: a numeric member is the shape a per-worker
   * counter arrives in, and the covering suite sweeps the whole module for
   * one. Five steps, five literals.
   */
  readonly n: 1 | 2 | 3 | 4 | 5
  readonly text: string
  readonly sourceRef: string
}

export const B8_HAPPY_PATH = [
  {
    n: 1,
    text: "The worker reaches a step where the Prevention Agent's pre-authorised policy applies.",
    sourceRef: 'L41488',
  },
  {
    n: 2,
    text:
      "Online, the agent selects an asset by multimodal semantic search over the tenant's approved " +
      'corpus and selects the language variant matching the worker’s profile language.',
    sourceRef: 'L41489',
  },
  { n: 3, text: 'The card renders at the step where it helps.', sourceRef: 'L41490' },
  {
    n: 4,
    text: 'The worker views it, optionally replays it, and continues.',
    sourceRef: 'L41491',
  },
  { n: 5, text: 'The interaction is recorded as a learning signal.', sourceRef: 'L41492' },
] as const satisfies readonly B8Step[]

/* ==================================================================== *
 * WHAT THE WORKER IS SHOWN, AND WHY THE THREE ABSENT CASES ARE ONE CASE.
 *
 * L41504: "The authored Work Instructions serve. This is the case offline,
 * during a server-side agent outage, and during a platform-wide or per-tenant
 * emergency pause." Three different causes, one experience, and the source
 * says so again in `FUNC-B8-02-1-2` (L41540): "the application does not
 * announce agent failures to the worker, because the worker's guidance is
 * unchanged."
 *
 * SO THE CAUSE IS A PARAMETER AND THE ANSWER IS NOT. `coachingGuidance` takes
 * the reach of the agent layer and returns the SAME value for all three absent
 * causes, byte for byte. `TEST-B8-6` (L41592) asks for an agent-outage test
 * "asserting the same fallback as offline"; the covering suite asks it by
 * comparing the three returns rather than by reading three branches.
 *
 * NEITHER MEMBER CARRIES A FAILURE MESSAGE, AND THERE IS NOWHERE TO PUT ONE.
 * `TEST-B8-5` (L41591) asks that no agent-unavailable message appears, and
 * `SB-FL-017` frame 3 says the same in the storyboard's own words.
 * ==================================================================== */

/** Why the agent-selected card is or is not there. L41504, FB-FL-AI-01 L40110. */
export type B8AgentReach =
  /** Connected, and the reasoning layer answers. */
  | 'available'
  /** The device has no connection. The reasoning layer is server-side and online-only. */
  | 'offline'
  /** A server-side agent outage. */
  | 'agent-outage'
  /** A platform-wide or per-tenant emergency pause from the Super Admin platform console. */
  | 'emergency-pause'

export const B8_AGENT_REACHES = [
  'available',
  'offline',
  'agent-outage',
  'emergency-pause',
] as const satisfies readonly B8AgentReach[]

type MissingFromReaches = Exclude<B8AgentReach, (typeof B8_AGENT_REACHES)[number]>
const _reachesExhaustive: MissingFromReaches extends never ? true : never = true
void _reachesExhaustive

/** The three causes under which the agent-selected card is absent. Derived. */
export const B8_ABSENT_REACHES = B8_AGENT_REACHES.filter((r) => r !== 'available')

interface B8GuidanceBase {
  readonly heading: string
  readonly body: string
  /**
   * ALWAYS `false`, and typed as the literal so a `true` will not compile.
   * L41471: coaching is advisory and never gates. A card that gated would be
   * `EXCL`-class rather than a styling choice, and this is where that is held.
   */
  readonly gates: false
  /**
   * ALWAYS `false`. The specific defect this module is most able to ship is a
   * card built as a modal that must be dismissed, which converts an advisory
   * into a gate while looking like ordinary competent interface work.
   */
  readonly dismissRequired: false
  readonly sourceRef: string
}

export interface B8CoachingCard extends B8GuidanceBase {
  readonly kind: 'agent-selected-card'
  /** `SB-FL-017` frame 2's two controls, in the storyboard's own words. */
  readonly controls: readonly ['Play again', 'Dismiss']
}

export interface B8AuthoredInstruction extends B8GuidanceBase {
  readonly kind: 'authored-work-instruction'
  /**
   * Frame 3: the instruction is "expanded in place, with no card". There are
   * no card controls, because there is no card.
   */
  readonly controls: readonly []
}

export type B8Guidance = B8CoachingCard | B8AuthoredInstruction

/**
 * The one value the three absent causes all return. Declared once so the three
 * are identical by construction and the covering gate compares three CALLS
 * rather than three references to this constant — a comparison against the
 * constant a branch returns is the tautology shape this build has recorded.
 */
const AUTHORED_INSTRUCTION: B8AuthoredInstruction = {
  kind: 'authored-work-instruction',
  controls: [],
  gates: false,
  dismissRequired: false,
  heading: 'Work Instruction for this step',
  body:
    'Seat the socket squarely on the fastener before applying force, and keep the drive square to the ' +
    'bolt axis through the whole pull. This is the step’s authored Work Instruction, from the ' +
    'released package pinned to this run, in its authored languages.',
  sourceRef: 'L41498, FUNC-B8-02-1-1 · L41539, AC-B8-2 · L41577',
}

export function coachingGuidance(reach: B8AgentReach): B8Guidance {
  if (reach === 'available') {
    return {
      kind: 'agent-selected-card',
      controls: ['Play again', 'Dismiss'],
      gates: false,
      dismissRequired: false,
      heading: 'Tip',
      body:
        'A thirty-second clip on seating the socket squarely, selected from the tenant’s approved ' +
        'corpus for this step.',
      sourceRef: 'L41489, FUNC-B8-01-1-1 · L41531, SB-FL-017 · L41566',
    }
  }
  // The three absent causes, answered identically. There is no branch here and
  // that is the point: a per-cause message is what `TEST-B8-5` forbids.
  return AUTHORED_INSTRUCTION
}

/**
 * What the worker is told about WHY, which is nothing, and the source's reason
 * for that. Rendered as a statement about the design rather than as a runtime
 * message, so the panel can be honest about the rule without the card region
 * ever carrying it.
 */
export const B8_NO_FAILURE_ANNOUNCEMENT = {
  rule:
    'The application does not announce agent failures to the worker, because the worker’s guidance ' +
    'is unchanged. What is absent offline is only the agent-selected card; the guidance itself never ' +
    'disappears.',
  where:
    'The Client Command Center shows agent unavailability and the Super Admin platform console shows ' +
    'the pause state. The oversight surfaces carry it; the tablet does not.',
  sourceRef: 'FUNC-B8-02-1-2 · L41540, L41498, FB-FL-AI-01 · L40110',
} as const

/**
 * `AC-B8-6` (L41581), read through wave 0 rather than restated. The safety
 * layer's treatment carries `degradedOffline: false` as a literal, so this
 * module cannot state the emergency pause without stating what it leaves
 * alone.
 */
export const B8_SAFETY_LAYER_UNTOUCHED = frontlineConnectivityTreatment({ kind: 'safety-layer' })

/* ==================================================================== *
 * THE LANGUAGE VARIANT, AND THE THING THAT IS NOT IN THE RETURN TYPE.
 *
 * `FUNC-B8-01-1-2` (L41532): "Select the language variant matching the
 * worker's profile language, with nothing machine-translated on the fly."
 * L41496: "translation is never runtime." L41521: coaching content "is never
 * machine-translated at runtime, which means no unreviewed text ever reaches a
 * worker's screen." Row 7 of the matrix prohibits it in every column.
 *
 * `B8VariantOutcome` HAS TWO MEMBERS AND NEITHER IS A TRANSLATION. Where an
 * authored variant exists it is selected; where none exists the platform says
 * so, which is §7.18's own rule at L48677: "Where a rendering does not exist,
 * the platform says so rather than translating."
 *
 * THE LANGUAGE SET IS THE PLATFORM'S, NOT THIS MODULE'S. L48677 names English
 * and Spanish and gives the worker's profile-lite preference as what drives
 * all four rendering layers. `MOD-FL-A1` owns that preference; this module
 * reads it and never sets it.
 * ==================================================================== */

export type B8Language = 'English' | 'Spanish'

export const B8_LANGUAGES = ['English', 'Spanish'] as const satisfies readonly B8Language[]

export type B8VariantOutcome =
  | {
      readonly kind: 'authored-variant'
      readonly language: B8Language
      readonly line: string
      readonly sourceRef: string
    }
  | {
      readonly kind: 'no-rendering-exists'
      readonly line: string
      readonly sourceRef: string
    }

export function authoredVariant(
  profileLanguage: B8Language,
  authored: readonly B8Language[],
): B8VariantOutcome {
  if (authored.includes(profileLanguage)) {
    return {
      kind: 'authored-variant',
      language: profileLanguage,
      line: `Shown in ${profileLanguage}, from content authored and approved in ${profileLanguage}. Nothing was translated to produce it.`,
      sourceRef: 'FUNC-B8-01-1-2 · L41532, L41496, L48677',
    }
  }
  return {
    kind: 'no-rendering-exists',
    line:
      'No approved coaching content exists for this step in your language, so none is shown. The ' +
      'platform says so rather than translating, and the step’s authored Work Instruction is ' +
      'unaffected.',
    sourceRef: 'L48677, L41521, row 7 · L41474',
  }
}

/* ==================================================================== *
 * THE DISMISSAL, AND THE SOCIAL CONTRACT IT SITS INSIDE.
 *
 * L41517: "The distinction is the module's core social contract: one dismissed
 * nudge is a data point, a pattern is a signal."
 *
 * `supervisorNotification` IS TYPED `null`, NOT `X | null`. There is no value
 * that could be assigned to it, so a per-dismissal supervisor notification is
 * not something a later change could add without changing this type on
 * purpose. `AC-B8-4` (L41579) and `FUNC-B8-01-2-3` (L41536) are what it holds.
 *
 * THERE IS NO COUNT IN THIS FILE, AND THERE IS NOWHERE TO PUT ONE. The pattern
 * is defined in the Standards and Operations Studio and "the pattern is
 * evaluated where the definition lives" (L41536) — not on the device. A device
 * that counted would be the surveillance affordance that arrives as a
 * kindness, and `RISK-FL-B8-1` (L39250) names exactly that risk in the
 * source's own words: "dismissal recording can be perceived as monitoring".
 * ==================================================================== */

export interface B8DismissalOutcome {
  readonly learningSignal: 'recorded'
  /** Typed `null`. `AC-B8-4` L41579 held by the type rather than by a branch. */
  readonly supervisorNotification: null
  /** L41535's own two words for the two connectivity cases. */
  readonly upload: 'uploaded' | 'queued'
  readonly line: string
  readonly sourceRef: string
}

export function dismissalOutcome(
  connectivity: 'connected' | 'offline',
): B8DismissalOutcome {
  return {
    learningSignal: 'recorded',
    supervisorNotification: null,
    upload: connectivity === 'connected' ? 'uploaded' : 'queued',
    line:
      connectivity === 'connected'
        ? 'Waved away. It is recorded as a learning signal and uploaded, and it reaches nobody: a single dismissal raises no supervisor notification.'
        : 'Waved away. It is recorded as a learning signal and queued on this tablet until the connection returns, and it reaches nobody: a single dismissal raises no supervisor notification.',
    sourceRef: 'FUNC-B8-01-2-2 · L41535, AC-B8-4 · L41579, L41514',
  }
}

/* ==================================================================== *
 * THE NOTIFICATIONS TABLE. Header L41512, separator L41513, data
 * L41514-L41515. TWO rows, and the second is the only one with a recipient.
 * ==================================================================== */

export interface B8NotificationRow {
  readonly trigger: string
  readonly recipient: string
  readonly channel: string
  readonly statesExercised: string
  readonly sourceRef: string
}

export const B8_NOTIFICATIONS = [
  {
    trigger: 'A single coaching dismissal',
    recipient: 'Nobody — interventions are silent to the supervisor by default',
    channel:
      'Not applicable — no notification is raised; the dismissal is recorded as a learning signal only',
    statesExercised: 'created, suppressed',
    sourceRef: 'L41514',
  },
  {
    trigger: 'The Studio-defined repeated-coaching pattern is met',
    recipient: 'The Supervisor',
    channel: 'in-app and email',
    statesExercised:
      'created, eligible, queued, sent, provider-accepted, delivered, opened, read, acknowledged, acted, resolved',
    sourceRef: 'L41515',
  },
] as const satisfies readonly B8NotificationRow[]

export const B8_SOCIAL_CONTRACT = {
  text:
    "The distinction is the module's core social contract: one dismissed nudge is a data point, a " +
    'pattern is a signal.',
  sourceRef: 'L41517',
} as const

/* ==================================================================== *
 * THE EIGHT FUNCTIONALITIES. L41531-L41543. The smallest FUNC count of the
 * twelve modules.
 * ==================================================================== */

export interface B8Functionality {
  readonly id: string
  readonly statement: string
  readonly rolesAllowed: string
  readonly rolesProhibited: string
  readonly connectivity: string
  /** The functionality's own Fallback clause, verbatim. */
  readonly fallbackClause: string
  /** The `FB-FL-*` identifiers that clause names. Empty where it names none. */
  readonly patterns: readonly FrontlineFallbackId[]
  readonly sourceRef: string
}

export const B8_FUNCTIONALITIES = [
  {
    id: 'FUNC-B8-01-1-1',
    statement:
      'Present the agent-selected asset, retrieved by multimodal semantic search over the tenant’s ' +
      'approved corpus, at the step where it helps.',
    rolesAllowed: 'Roles allowed: Worker sees it.',
    rolesProhibited: 'Roles prohibited: nobody may select manually.',
    connectivity: 'Online: available. Offline: absent.',
    fallbackClause: 'Fallback: FB-FL-AI-01.',
    patterns: ['FB-FL-AI-01'],
    sourceRef: 'L41531',
  },
  {
    id: 'FUNC-B8-01-1-2',
    statement:
      'Select the language variant matching the worker’s profile language, with nothing ' +
      'machine-translated on the fly.',
    rolesAllowed: 'Roles allowed: automatic.',
    rolesProhibited: 'Roles prohibited: no runtime translation by anybody.',
    connectivity:
      'Online: variant selected. Offline: authored instructions render in their authored languages.',
    fallbackClause: 'Fallback: FB-FL-AI-01.',
    patterns: ['FB-FL-AI-01'],
    sourceRef: 'L41532',
  },
  {
    id: 'FUNC-B8-01-2-1',
    statement: 'Make cards replayable.',
    rolesAllowed: 'Roles allowed: Worker.',
    rolesProhibited: 'Roles prohibited: none.',
    connectivity: 'Online and offline: replay applies to whichever content is showing.',
    fallbackClause: 'Fallback: Not applicable — replay reads content already on screen.',
    patterns: [],
    sourceRef: 'L41534',
  },
  {
    id: 'FUNC-B8-01-2-2',
    statement:
      'Make cards dismissible, recording dismissals as learning signals and as a ' +
      'supervisor-visibility signal.',
    rolesAllowed: 'Roles allowed: Worker.',
    rolesProhibited: 'Roles prohibited: no dismissal may block or delay the step.',
    connectivity: 'Online: recorded and uploaded. Offline: recorded and queued.',
    fallbackClause: 'Fallback: FB-FL-UP-01.',
    patterns: ['FB-FL-UP-01'],
    sourceRef: 'L41535',
  },
  {
    id: 'FUNC-B8-01-2-3',
    statement:
      'Keep interventions silent to the supervisor by default, escalating to an actionable signal ' +
      'only on the repeated-coaching pattern the Standards and Operations Studio defines.',
    rolesAllowed: 'Roles allowed: Supervisor receives only the pattern signal.',
    rolesProhibited: 'Roles prohibited: no per-dismissal supervisor notification.',
    connectivity:
      'Online: the pattern is evaluated where the definition lives. Offline: dismissals queue and ' +
      'the pattern is evaluated when they arrive.',
    fallbackClause: 'Fallback: FB-FL-UP-01.',
    patterns: ['FB-FL-UP-01'],
    sourceRef: 'L41536',
  },
  {
    id: 'FUNC-B8-02-1-1',
    statement:
      'Fall back to the step’s authored Work Instructions, which already travel inside the ' +
      'Workflow package, rendered in their authored languages.',
    rolesAllowed: 'Roles allowed: Worker.',
    rolesProhibited: 'Roles prohibited: nobody may substitute unapproved content.',
    connectivity:
      'Online: available as the underlying instruction regardless. Offline: this is the guidance.',
    fallbackClause: 'Fallback: FB-FL-PKG-01.',
    patterns: ['FB-FL-PKG-01'],
    sourceRef: 'L41539',
  },
  {
    id: 'FUNC-B8-02-1-2',
    statement: 'Make clear that what is absent offline is only the agent-selected card.',
    rolesAllowed: 'Roles allowed: Worker.',
    rolesProhibited:
      'Roles prohibited: the application does not announce agent failures to the worker, because ' +
      'the worker’s guidance is unchanged.',
    connectivity: 'Online and offline: identical instruction content.',
    fallbackClause: 'Fallback: FB-FL-AI-01.',
    patterns: ['FB-FL-AI-01'],
    sourceRef: 'L41540',
  },
  {
    id: 'FUNC-B8-03-1-1',
    statement:
      'Let Studio-authored timing thresholds drive coaching while the worker sees the support ' +
      'content and never the stopwatch.',
    rolesAllowed: 'Roles allowed: Worker sees the card.',
    rolesProhibited:
      'Roles prohibited: no timing value renders to the worker, in any module, any state, any ' +
      'release.',
    connectivity: 'Online: an agent-selected card. Offline: the authored instruction.',
    fallbackClause: 'Fallback: FB-FL-AI-01.',
    patterns: ['FB-FL-AI-01'],
    sourceRef: 'L41543',
  },
] as const satisfies readonly B8Functionality[]

/**
 * `AC-FL-011-1` ASKED, AND THE ANSWER IS NOT EMPTY. Wave 0's
 * `functionalitiesNamingNoPattern` is the one place that rule lives, and run
 * over this module's eight it returns `FUNC-B8-01-2-1` (L41534), whose Fallback
 * clause reads "Not applicable — replay reads content already on screen." and
 * names no `FB-FL-*` pattern at all.
 *
 * THE SOURCE STATES THE GROUND ITSELF, inside the clause: replay reads content
 * that is already on screen, so it depends on nothing that could be
 * unavailable. It is the same shape as the twelve gaps wave 1 measured across
 * its four modules — "an absent capability has no failure mode".
 *
 * NOTHING IS ASSIGNED TO CLOSE IT. `FB-FL-AI-01` would look plausible beside
 * its three siblings and would make `AC-FL-011-1` read clean against an
 * invented fact. An assigned pattern is indistinguishable from a real one
 * forever afterwards, so it is carried on screen instead.
 */
export const B8_FUNCTIONALITIES_NAMING_NO_PATTERN =
  functionalitiesNamingNoPattern(B8_FUNCTIONALITIES)

/* ==================================================================== *
 * THREE READINGS OF THIS MODULE'S FALLBACK SET, AND NONE RECONCILED.
 * ==================================================================== */

/** §22.9's module map, read through wave 0. Two patterns list `MOD-FL-B8`. */
export const B8_MAPPED_PATTERNS: readonly FrontlineFallbackPattern[] =
  patternsForModule('MOD-FL-B8')

/** Every pattern this module's own eight functionalities reach. Derived. */
export const B8_PATTERNS_NAMED_BY_FUNCTIONALITIES = [
  ...new Set(B8_FUNCTIONALITIES.flatMap((f) => f.patterns)),
] as const satisfies readonly FrontlineFallbackId[]

/**
 * A FINDING, RECORDED RATHER THAN RECONCILED, and this module diverges at every
 * reading exactly as `MOD-FL-A1` (2/3/4), `MOD-FL-A3` (4/6/7) and `MOD-FL-A5`
 * (3/4/7) did. This module measures 2/3/3, and the three sets are not nested:
 *
 *   §22.9's map          FB-FL-CORE-01 (L40130), FB-FL-AI-01 (L40136)
 *   the card's own line  FB-FL-AI-01, FB-FL-CORE-01, FB-FL-PKG-01 (L41523)
 *   the functionalities  FB-FL-AI-01, FB-FL-UP-01, FB-FL-PKG-01
 *
 * `FB-FL-UP-01` is reached only by the functionalities: its own map row
 * (L40134) lists `MOD-FL-A4` and `MOD-FL-A6` and not this module, and the
 * card's Fallback line does not name it either — yet `FUNC-B8-01-2-2` (L41535)
 * and `FUNC-B8-01-2-3` (L41536) both name it in their own words. `FB-FL-PKG-01`
 * is reached by two of the three and its map row (L40132) lists neither this
 * module nor, as `MOD-FL-A5` recorded from its end, `MOD-FL-A5`.
 * `FB-FL-CORE-01` is reached by two of the three and by none of the eight
 * functionalities.
 *
 * All three readings are the source's own and none is corrected here. No `DEC`
 * identifier is attached to the divergence anywhere in the frozen source.
 */
export const B8_PATTERN_DIVERGENCE = {
  fromTheModuleMap: ['FB-FL-CORE-01', 'FB-FL-AI-01'],
  fromTheCardsFallbackLine: ['FB-FL-AI-01', 'FB-FL-CORE-01', 'FB-FL-PKG-01'],
  fromTheFunctionalities: ['FB-FL-AI-01', 'FB-FL-UP-01', 'FB-FL-PKG-01'],
  note:
    'Two, three and three, and the three sets are not nested. FB-FL-UP-01 is named by two ' +
    'functionalities and by neither the map nor the card; FB-FL-CORE-01 is named by the map and the ' +
    'card and by none of the eight functionalities. Carrying all three is what the chapter’s own ' +
    'divergence requires, and reconciling them would be this build choosing which of the source’s ' +
    'three readings is the real one.',
  sourceRef: 'map L40130 and L40136 (and L40132, L40134 for the two it omits); card L41523',
} as const

/* ==================================================================== *
 * THE SIX ACCEPTANCE CRITERIA. L41576-L41581.
 *
 * ONE OF THE SIX IS NOT TRANSCRIBED, AND `fl-a3` SETTLED THE IDIOM. `AC-B8-5`
 * (L41580) states its criterion by naming the excluded thing, and the excluded
 * thing is exactly what `AC-FL-000-5` (L39100) forbids any screen of this
 * application from displaying, in any state, in any release. Quoting the
 * criterion would put the excluded word on the screen the criterion is about.
 * The criterion is carried as `null` with the ground stated, and the covering
 * suite proves the omission is a rule by asserting that L41580 really does
 * carry an excluded word — so if a later edit made the line safe to quote, the
 * omission goes red rather than standing on a stale reason.
 * ==================================================================== */

export interface B8AcceptanceCriterion {
  readonly id: string
  /** The criterion's own words, or `null` where they cannot be rendered. */
  readonly criterion: string | null
  /** Why not, where `criterion` is `null`. `null` otherwise. */
  readonly whyNotTranscribed: string | null
  readonly sourceRef: string
}

export const B8_ACCEPTANCE_CRITERIA = [
  {
    id: 'AC-B8-1',
    criterion:
      'Online, cards are agent-selected from the tenant’s approved corpus in the worker’s profile ' +
      'language, with no runtime translation.',
    whyNotTranscribed: null,
    sourceRef: 'AC-B8-1 · L41576',
  },
  {
    id: 'AC-B8-2',
    criterion:
      'Offline, the step’s authored Work Instructions render in place of the card, from the pinned ' +
      'package.',
    whyNotTranscribed: null,
    sourceRef: 'AC-B8-2 · L41577',
  },
  {
    id: 'AC-B8-3',
    criterion: 'No coaching card ever blocks, gates, or delays a step.',
    whyNotTranscribed: null,
    sourceRef: 'AC-B8-3 · L41578',
  },
  {
    id: 'AC-B8-4',
    criterion:
      'A single dismissal raises no supervisor notification; only the Studio-defined ' +
      'repeated-coaching pattern does.',
    whyNotTranscribed: null,
    sourceRef: 'AC-B8-4 · L41579',
  },
  {
    id: 'AC-B8-5',
    criterion: null,
    whyNotTranscribed:
      'This criterion forbids a class of worker-facing display by naming it, and the name is a word ' +
      'AC-FL-000-5 (L39100) excludes from every rendered screen in this scope, in any module, any ' +
      'state, any release. Rendering the criterion would break the criterion. It is cited rather ' +
      'than quoted and it is honoured throughout this module: nothing here shows the worker a ' +
      'measure of their own speed, and the eight functionalities include one whose only purpose is ' +
      'that a threshold may drive the coaching without the worker ever seeing the instrument.',
    sourceRef: 'AC-B8-5 · L41580',
  },
  {
    id: 'AC-B8-6',
    criterion:
      'An emergency pause of the agentic layer removes cards and leaves gates, detection, ' +
      'classification, and the Severity 1 hold untouched.',
    whyNotTranscribed: null,
    sourceRef: 'AC-B8-6 · L41581',
  },
] as const satisfies readonly B8AcceptanceCriterion[]

/* ==================================================================== *
 * THE EIGHT TESTS. L41587-L41594. Transcribed because three of them are the
 * denial and failure tests this panel's refusals answer to.
 * ==================================================================== */

export interface B8SourceTest {
  readonly id: string
  readonly type: string
  readonly text: string
  readonly sourceRef: string
}

export const B8_SOURCE_TESTS = [
  {
    id: 'TEST-B8-3',
    type: 'Denial',
    text:
      'Attempt to make a card gate a step through authored configuration and assert the platform ' +
      'refuses.',
    sourceRef: 'TEST-B8-3 · L41589',
  },
  {
    id: 'TEST-B8-4',
    type: 'Denial',
    text:
      'Dismiss one card and assert no supervisor notification is created, only a learning signal.',
    sourceRef: 'TEST-B8-4 · L41590',
  },
  {
    id: 'TEST-B8-5',
    type: 'Offline',
    text:
      'Airplane-mode test asserting the authored Work Instruction renders and no agent-unavailable ' +
      'message appears.',
    sourceRef: 'TEST-B8-5 · L41591',
  },
  {
    id: 'TEST-B8-6',
    type: 'Failure',
    text:
      'Agent-outage test asserting the same fallback as offline and no impact on gates or ' +
      'classification.',
    sourceRef: 'TEST-B8-6 · L41592',
  },
  {
    id: 'TEST-B8-7',
    type: 'Failure',
    text:
      'Emergency-pause test asserting cards disappear, agent unavailability is rendered on oversight ' +
      'surfaces, and the deterministic layer is unaffected.',
    sourceRef: 'TEST-B8-7 · L41593',
  },
] as const satisfies readonly B8SourceTest[]

/* ==================================================================== *
 * THE OPEN DECISION THIS MODULE CARRIES LOCALLY, AND THE TWO IT DOES NOT.
 *
 * `DEC-GATE-001` IS THIS MODULE'S, AND THE ASSIGNMENT WAS VERIFIED RATHER THAN
 * ACCEPTED. It occurs exactly twice inside §22.17 — L41502 and L41596 — and
 * §22.17 runs from its heading at L41448 to its Source status at L41596, the
 * last line before §22.18's heading. `MOD-FL-B9` recorded from its own end that the
 * same identifier occurs nowhere in §22.18 and that L41502 and L41596 are this
 * module's; that finding and this one were made independently and agree.
 *
 * WHY IT IS NOT RENDERED BY `@/disclosure/DecisionDisclosure`. That component
 * takes a `DecisionId`, and the canon in `src/disclosure/decisions.ts` holds
 * twenty-nine records of which none is `DEC-GATE-001` — every one of the
 * twenty-nine was raised while `SURF-STU` and the platform surfaces were built.
 * Adding it means editing that file, which this module does not own and which
 * one later task lifts all at once. So it is carried here in the canon's own
 * record shape, with `DecisionReading` IMPORTED rather than redeclared, and
 * with the same three obligations the renderer discharges: the identifier,
 * EVERY reading with its own locator, and this build's working position
 * labelled a client-delegated choice.
 *
 * THE STAND-IN IS BUILT TO EXPIRE. The covering suite asserts this identifier
 * is ABSENT from the canon's exported union. The moment it is lifted, that
 * suite goes red and forces the switch — a stand-in with no expiry gate is how
 * two spellings of one decision ship.
 * ==================================================================== */

export interface B8LocalDisclosure {
  readonly decisionRef: string
  readonly question: string
  readonly readings: readonly DecisionReading[]
  /** What this build does. Never presented as the source's ruling. */
  readonly adopted: string
  /** What is lost if the client rules the other way. The source's own words. */
  readonly consequenceIfRuledOtherwise: string
  /** Why `MOD-FL-B8` is a place this decision has to be disclosed. */
  readonly whyHere: string
  /** Why it is disclosed here rather than through the shared renderer. */
  readonly canonNote: string
}

const CANON_NOTE =
  "The shared decision canon's DecisionId union does not hold this identifier. It is disclosed here " +
  "in the canon's own record shape, and this module's unit suite asserts the absence, so the " +
  'disclosure moves to the canon the moment the canon holds it.'

export const B8_LOCAL_DISCLOSURES = [
  {
    decisionRef: 'DEC-GATE-001',
    question:
      'Whether every action agent needs a per-event runtime human gate, or whether pre-authorised, ' +
      'Studio-authored policy is itself the gate. The Prevention Agent is the agent that renders ' +
      'every card this module draws.',
    readings: [
      {
        text:
          '§3.7 and §6.6.1 say it operates entirely under pre-authorised, Studio-authored policy ' +
          'with the runtime gate existing only for proposals beyond that policy',
        locator: 'DEC-GATE-001 · L40952',
      },
      {
        text:
          '§8.3.2 says every action agent routes through a human gate before any effect and §8.3.3 ' +
          'labels the Prevention Agent "action, gated".',
        locator: 'DEC-GATE-001 · L40952',
      },
      {
        text:
          'Under the Part VIII reading, a coaching card could not be shown to a worker until a human ' +
          'approved it in the Command Center, which would make real-time coaching impossible.',
        locator: 'L113198',
      },
      {
        text:
          'A runtime gate is unreachable offline, which is decisive evidence for Option A or C: an ' +
          'agent whose gate cannot be reached offline cannot act offline at all.',
        locator: 'L113206',
      },
    ],
    adopted:
      'The Prevention Agent gating position is adopted at Option C: the Prevention Agent’s ' +
      'governance binding is declared authoring-time policy and it carries no per-event runtime ' +
      'gate, with both source readings preserved in the card. So no per-event runtime gate stands ' +
      'between a selected asset and the worker, and every intervention is logged.',
    consequenceIfRuledOtherwise:
      'If the client rules that every action agent must be gated at runtime, real-time coaching ' +
      'cannot ship in its current form and the Prevention Agent becomes an advisory-only surface.',
    whyHere:
      'This module renders what the Prevention Agent selects, and the decision’s own Offline-impact ' +
      'clause names module B8 by identifier. The decision occurs twice inside §22.17 and nowhere ' +
      'else in the chapter’s twelve module sections but §22.14, MOD-FL-A5’s, which is the ' +
      'deterministic layer this module is downstream of.',
    canonNote: CANON_NOTE,
  },
] as const satisfies readonly B8LocalDisclosure[]

/** The identifiers this module carries locally. The expiry gate reads this. */
export const B8_LOCAL_DECISION_IDS: readonly string[] = B8_LOCAL_DISCLOSURES.map(
  (d) => d.decisionRef,
)

/**
 * THE TWO DECISIONS THIS MODULE CITES THROUGH THE SHARED RENDERER, AND A
 * CORRECTION TO THE BRIEF THIS MODULE WAS BUILT FROM.
 *
 * The dispatch assigned `DEC-LANEB-001` and `DEC-LIB-001` to this module and
 * gave four locators for the first (L41195, L41276, L41869, L41927) and two for
 * the second (L41195, L41276). All six are REAL and all six are ELSEWHERE:
 * L41195 and L41276 are §22.15's, `MOD-FL-A6`'s, and L41869 and L41927 are
 * §22.20's, `MOD-FL-B10`'s. Neither identifier occurs anywhere in §22.17 —
 * grepping L41448 to L41596 returns `DEC-GATE-001` twice and nothing else.
 *
 * BOTH ARE STILL THIS MODULE'S TO DISCLOSE, ON LINES THE BRIEF DID NOT NAME.
 * `DEC-LIB-001`'s own decision card names the coaching asset in its statement
 * of the unresolved interaction (L32591, restated at L33805). `DEC-LANEB-001`'s
 * canonical example throughout the source IS a coaching value: the glossary's
 * Lane B row gives "the proposal to move a coaching trigger from 80 per cent to
 * 75 per cent" (L5930) and the package-test row beside it says "the coaching
 * trigger travels in the package, so approval published a patch version"
 * (L5931). Both therefore bear on the assets and thresholds this module
 * renders, and both are cited from those lines rather than from the six the
 * brief supplied.
 *
 * BOTH ARE IN THE CANON, so they are rendered by `@/disclosure/DecisionDisclosure`
 * and no local record is written for either. Writing one would be the second
 * spelling this build has recorded three times.
 */
export const B8_CANON_DECISIONS = [
  {
    id: 'DEC-LIB-001' as DecisionId,
    whyHere:
      'The decision’s own card states the unresolved interaction as an in-flight Run "whose ' +
      'containment checklist or coaching asset changes mid-Run", which is the asset this module ' +
      'renders. The short coaching assets travel inside the Workflow package (FUNC-A6-01-1-1, ' +
      'L41162) and the Run is pinned to its package version, so whether a library edit reaches a ' +
      'card already on this device is exactly the question the card cannot answer for itself.',
    sourceRef: 'DEC-LIB-001 · L32591, restated at L33805; package contents at L41162',
  },
  {
    id: 'DEC-LANEB-001' as DecisionId,
    whyHere:
      'The source’s standing example of a Lane B proposal is a coaching value: moving a coaching ' +
      'trigger from 80 per cent to 75 per cent, decided by a Quality Manager and auto-published as a ' +
      'patch version. The package test that follows it says the coaching trigger travels in the ' +
      'package, so an approved Lane B change to a Studio-authored threshold reaches this module ' +
      'through the pinned package rather than through a second approval — which is the contradiction ' +
      'the decision preserves.',
    sourceRef: 'DEC-LANEB-001 · L5930, L5931',
  },
] as const satisfies readonly {
  readonly id: DecisionId
  readonly whyHere: string
  readonly sourceRef: string
}[]

/* ==================================================================== *
 * FINDINGS, RECORDED RATHER THAN CLOSED.
 * ==================================================================== */

export interface B8SourceFinding {
  readonly what: string
  readonly evidence: string
  readonly notClosedBecause: string
  readonly sourceRef: string
}

export const B8_SOURCE_FINDINGS = [
  {
    what:
      'The dispatch cited §15.2 for the support-not-surveillance invariant. §15.2 is the role-grant ' +
      'lifecycle.',
    evidence:
      '§15.2 opens at L19053 and is titled "The role-grant lifecycle". The invariant is §3.3, which ' +
      'opens at L1994 and states the position in the source’s own words at L2000, making it three ' +
      'concrete prohibitions and one data-handling rule. The per-worker view this module must not ' +
      'build is forbidden by the third prohibition (L2006) and by the data-handling rule (L2008), ' +
      'not by §15.2.',
    notClosedBecause:
      'A locator is a finding rather than an obstacle. Every citation in this module points at §3.3 ' +
      'and at AC-SCOPE-044, and none of them points at §15.2.',
    sourceRef: 'L19053 against L1994, L2000, L2006, L2008',
  },
  {
    what:
      'Row 5 of this matrix names two owning surfaces and wave 0’s row type holds one.',
    evidence:
      'L41472 gives the Supervisor and Quality Manager cells the Client Command Center and the ' +
      'Read-only Auditor cell the Delivery Operations Hub record. frontlineAffordance returns the ' +
      'ROW’s metElsewhere for every cell of a cross-surface row, so the fold names the Client ' +
      'Command Center over a cell whose own words name the Hub.',
    notClosedBecause:
      'src/frontline/matrix.ts is wave 0’s file and not this module’s to edit; a local widening of ' +
      'the shared type would be a second spelling of one ruling. This module declares the per-column ' +
      'destination beside the row and the panel names the place from it, while the fold goes on ' +
      'deciding that no control is drawn.',
    sourceRef: 'L41472; @/frontline/matrix FrontlineMetElsewhere',
  },
  {
    what:
      'The three readings of this module’s fallback set are two, three and three, and the sets are ' +
      'not nested.',
    evidence:
      '§22.9’s map lists this module against FB-FL-CORE-01 (L40130) and FB-FL-AI-01 (L40136). The ' +
      'card’s Fallback line (L41523) names FB-FL-AI-01, FB-FL-CORE-01 and FB-FL-PKG-01. The eight ' +
      'functionalities reach FB-FL-AI-01, FB-FL-UP-01 and FB-FL-PKG-01, and FB-FL-UP-01’s own map ' +
      'row (L40134) lists MOD-FL-A4 and MOD-FL-A6 and not this module.',
    notClosedBecause:
      'All three are the source’s own readings and no DEC identifier is attached to the divergence ' +
      'anywhere in the frozen source. Reconciling them would be this build deciding which reading is ' +
      'the real one, which is the finding rather than its repair.',
    sourceRef: 'L40130, L40132, L40134, L40136, L41523',
  },
  {
    what:
      'AC-FL-011-1 is not met by one of this module’s eight functionalities, on a ground the source ' +
      'states itself.',
    evidence:
      'FUNC-B8-01-2-1 (L41534) reads "Fallback: Not applicable — replay reads content already on ' +
      'screen." AC-FL-011-1 (L40151) asks every functionality in the chapter to name at least one ' +
      'FB-FL-* pattern.',
    notClosedBecause:
      'An assigned pattern is indistinguishable from a real one forever afterwards, and the ' +
      'criterion would then read clean because nobody looked. It is reported and left open.',
    sourceRef: 'FUNC-B8-01-2-1 · L41534; AC-FL-011-1 · L40151',
  },
  {
    what:
      'The dispatch’s six locators for DEC-LANEB-001 and DEC-LIB-001 are all real and all outside ' +
      'this module’s section.',
    evidence:
      'L41195 and L41276 are §22.15’s, MOD-FL-A6’s; L41869 and L41927 are §22.20’s, MOD-FL-B10’s. ' +
      'Neither identifier occurs between L41448 and L41596, where the only DEC identifier is ' +
      'DEC-GATE-001, twice.',
    notClosedBecause:
      'Both decisions still bear on this module, on lines the brief did not name: DEC-LIB-001’s card ' +
      'states the unresolved interaction in terms of a coaching asset (L32591) and DEC-LANEB-001’s ' +
      'standing example is a coaching trigger travelling in the package (L5930, L5931). They are ' +
      'disclosed from those lines and the six supplied locators are not used.',
    sourceRef: 'L41195, L41276, L41869, L41927 against L41448 to L41596; L32591, L5930, L5931',
  },
] as const satisfies readonly B8SourceFinding[]
