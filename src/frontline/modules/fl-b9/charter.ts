/**
 * `MOD-FL-B9` — Gates and Sign-Off Authority. THE IDENTITY CARD,
 * TRANSCRIBED.
 *
 * The card is §22.18's own five statements at L41604, L41606, L41608, L41610
 * and L41612 — the lines between them are blank. Nothing here is
 * paraphrased and nothing is trimmed to fit a card.
 *
 * THIRTEEN STATEMENTS BEYOND THE CARD, EACH CARRYING ITS OWN LOCATOR. The
 * views need the states, the offline behaviour, the fallback line and the
 * terminal safe state, and a statement rendered without its own line is how a
 * citation drifts one section over — the defect this build has recorded
 * eleven times.
 *
 * THE OFFLINE STATEMENT IS NOT AN AFTERTHOUGHT ON THIS CARD. L41652: "The
 * gate itself is enforced locally, exactly as online." The qualification gate
 * is a member of the deterministic layer L40948 protects, so a panel that
 * rendered only the connected path would imply the gate needs a network — the
 * one claim chapter 22 exists to deny. `SAFETY_LAYER` below reads wave 0's
 * treatment rather than re-spelling it.
 *
 * WHAT IS DELIBERATELY NOT HERE. No pace, no timer, no countdown, no ranking,
 * no productivity comparison — `AC-FL-000-5` (L39100), `TEST-FL-000-3`
 * (L39108), `AC-SCR-FL-002` (L48690) and `AC-SCOPE-045` (L2683). The one
 * place a forbidden word appears in this module's rendered text is
 * `DEC-PARK-001`'s third candidate behaviour, which is the source's own
 * proposal quoted verbatim at L41682 in a disclosure of an open decision —
 * not a display. The covering gate allows that one string and no other.
 *
 * NO GRADE IS TRANSCRIBED. The build plan grades this module `C1`; that is a
 * plan value. The frozen source's own module-inventory column is `Band`
 * (header L39844) and this module's row (L39854) reads `B`. Neither is
 * carried as a product fact.
 */

import { frontlineConnectivityTreatment } from '@/frontline/access'

export type B9CardFieldId =
  | 'in-simple-words'
  | 'identifier'
  | 'purpose'
  | 'user-benefit'
  | 'owning-surface'
  | 'roles'
  | 'preconditions'
  | 'objects'
  | 'states'
  | 'online'
  | 'offline'
  | 'reconnect'
  | 'artificial-intelligence'
  | 'dependencies'
  | 'audit'
  | 'security'
  | 'fallback-identifier'
  | 'terminal-safe-state'

export interface B9CardStatement {
  readonly id: B9CardFieldId
  /** The heading the claim renders under. The card's own label. */
  readonly field: string
  /** The claim, in the frozen source's own words, with its markup dropped. */
  readonly text: string
  readonly sourceRef: string
  /**
   * How the source classifies the claim, in the source's own vocabulary, or
   * `null` where the line carries no marker at all. Fourteen of the eighteen
   * carry none, and that absence is recorded rather than filled in.
   */
  readonly sourceClass: string | null
  /** `true` for the five statements of the L41604-L41612 identity card. */
  readonly onTheCard: boolean
}

export const B9_CARD = [
  {
    id: 'in-simple-words',
    field: 'In simple words',
    text: "Some steps can only be done by somebody with a current certificate. If a worker's certificate has run out, the tablet stops them at that step. The worker cannot talk their way past it on the tablet; there is no secret code. A supervisor, wherever they are, can give them a temporary permission from their own screen, and that permission arrives the next time the tablet talks to the office. Meanwhile the blocked job is set aside and the worker gets on with their other jobs. Some steps also need a supervisor's signature, and the supervisor can put that in on the worker's tablet without logging the worker out.",
    sourceRef: 'L41602',
    sourceClass: null,
    onTheCard: false,
  },
  {
    id: 'identifier',
    field: 'Identifier and name',
    text: 'MOD-FL-B9. Gates and Sign-Off Authority.',
    sourceRef: 'L41604',
    sourceClass: 'SoW Fact — §7.3, §7.13',
    onTheCard: true,
  },
  {
    id: 'purpose',
    field: 'Purpose',
    text: 'To enforce the qualification gate on the device with no worker override, to handle the offline case through the parked Run, to carry sign-off authority including the substitute sign-off, and to support step-level identity re-confirmation where an author enables it.',
    sourceRef: 'L41606',
    sourceClass: 'SoW Fact — §7.13.1 to §7.13.4',
    onTheCard: true,
  },
  {
    id: 'user-benefit',
    field: 'User benefit',
    text: 'The worker is never stalled by a block they cannot resolve: the Run parks and other work continues. The supervisor is never required to walk to a station. The quality organisation gets a clean audit trail instead of an on-the-spot override.',
    sourceRef: 'L41608',
    sourceClass: null,
    onTheCard: true,
  },
  {
    id: 'owning-surface',
    field: 'Owning surface',
    text: 'Frontline Worker Application (SURF-FL) enforces. Enforcement posture is a tenant-level setting in the Delivery Operations Hub. Clearance granting is Client Command Center action 10. The role hierarchy that defines who may substitute for whom is resolved from the Delivery Operations Hub.',
    sourceRef: 'L41610',
    sourceClass: 'SoW Fact — §7.13.1, §7.13.3',
    onTheCard: true,
  },
  {
    id: 'roles',
    field: 'Roles that see and use it',
    text: 'Worker, who meets the gate. Supervisor and above, who grant clearances remotely and who sign off through the step-up. Quality Manager, who is the escalation target for a second override in the same area in the same shift.',
    sourceRef: 'L41612',
    sourceClass: null,
    onTheCard: true,
  },
  {
    id: 'preconditions',
    field: 'Preconditions',
    text: 'An active Run with a package carrying gate rules and any authored screen-level qualification overrides. Cached qualification data within the offline trust window.',
    sourceRef: 'L41628',
    sourceClass: null,
    onTheCard: false,
  },
  {
    id: 'objects',
    field: 'Objects affected',
    text: 'OBJ-FL-GATEBLOCK; OBJ-FL-PARKEDRUN; OBJ-FL-SIGNOFF; OBJ-FL-SUBSIGN.',
    sourceRef: 'L41634',
    sourceClass: null,
    onTheCard: false,
  },
  {
    id: 'states',
    field: 'States',
    text: 'STATE-B9-PASSED; STATE-B9-BLOCKED; STATE-B9-NOTIFIED under the lenient posture; STATE-B9-PARKED; STATE-B9-CLEARED; STATE-B9-CLEARANCEEXPIRED; STATE-B9-SIGNED; STATE-B9-SUBSTITUTESIGNED.',
    sourceRef: 'L41636',
    sourceClass: null,
    onTheCard: false,
  },
  {
    id: 'online',
    field: 'Online behaviour',
    text: 'Gate evaluation is identical, because it is local. Clearances can arrive within seconds. Forced syncs before sign-offs complete. Escalations deliver immediately.',
    sourceRef: 'L41650',
    sourceClass: null,
    onTheCard: false,
  },
  {
    id: 'offline',
    field: 'Offline behaviour',
    text: 'The gate itself is enforced locally, exactly as online. Because the clearance travels down on sync, a gate that blocks while the device is offline cannot be cleared until the device reconnects; rather than stall the worker, the blocked Run parks and the worker continues with their other assigned Runs. A sign-off requiring a forced sync does not proceed. Cached qualifications are trusted within the offline trust window.',
    sourceRef: 'L41652',
    sourceClass: 'SoW Fact — §7.13.2',
    onTheCard: false,
  },
  {
    id: 'reconnect',
    field: 'Reconnect behaviour',
    text: 'The parked Run resumes when the clearance arrives, validated and applied at a safe boundary. Queued block records and escalations upload. A clearance that has already expired by the time it arrives is rejected with a typed reason rather than applied.',
    sourceRef: 'L41654',
    sourceClass: null,
    onTheCard: false,
  },
  {
    id: 'artificial-intelligence',
    field: 'Artificial-intelligence behaviour',
    text: 'Not applicable — no artificial-intelligence capability evaluates a gate, grants a clearance, authorises a sign-off, or resolves a substitution. Artificial intelligence may never bypass a qualification gate or self-approve. A Service Type tag may pre-populate a step’s qualification requirements at authoring time and never decides them, and that pre-population is a mapping lookup rather than a model.',
    sourceRef: 'L41656',
    sourceClass: null,
    onTheCard: false,
  },
  {
    id: 'dependencies',
    field: 'Dependencies',
    text: 'MOD-FL-A1 for the step-up and cached identity; MOD-FL-A5 for local gate enforcement; MOD-FL-A6 for the command channel, the trust window, forced sync, and clearance expiry at the next gate evaluation; the Delivery Operations Hub for worker qualifications, posture, duration, and the substitution hierarchy; the Client Command Center for action 10.',
    sourceRef: 'L41660',
    sourceClass: null,
    onTheCard: false,
  },
  {
    id: 'audit',
    field: 'Audit',
    text: 'Every gate evaluation and outcome, every block, every parking and unparking, every clearance application with its grant, duration, and categorised reason as recorded in the Delivery Operations Hub, every sign-off with its authorising identity, every substitute sign-off with who signed, in lieu of whom, and why, and every step-level re-confirmation are audited.',
    sourceRef: 'L41676',
    sourceClass: null,
    onTheCard: false,
  },
  {
    id: 'security',
    field: 'Security',
    text: 'There is no on-device worker override, which removes the single most attractive social-engineering target on the floor. The clearance arrives as a validated command with an authority behind it rather than as a code a worker could be told over a radio. Sign-off requires a forced sync, so the identity and authority recorded are fresh rather than stale cache. The step-up is momentary and bound to one authorisation.',
    sourceRef: 'L41678',
    sourceClass: null,
    onTheCard: false,
  },
  {
    id: 'fallback-identifier',
    field: 'Fallback identifier',
    text: 'FB-FL-GATE-01 primary; FB-FL-AUTH-01 for the step-up and forced sync; FB-FL-CMD-01 for clearance delivery.',
    sourceRef: 'L41680',
    sourceClass: null,
    onTheCard: false,
  },
  {
    id: 'terminal-safe-state',
    field: 'Failure, first fallback, fallback failure, terminal safe state, recovery, reconciliation',
    text: "The failure is a worker blocked at a gate. The first fallback is the tenant's posture — notify without blocking under the lenient posture. The secondary fallback is a remotely granted clearance. The fallback failure is that the device is offline and no clearance can arrive, at which point the Run parks. The terminal safe state is the parked Run with all prior captures preserved and queued, and no override path anywhere. Recovery is clearance arrival or certification correction. Reconciliation is the Delivery Operations Hub's grant record against the device's application.",
    sourceRef: 'L41740',
    sourceClass: null,
    onTheCard: false,
  },
] as const satisfies readonly B9CardStatement[]

type MissingFromCard = Exclude<B9CardFieldId, (typeof B9_CARD)[number]['id']>
const _cardExhaustive: MissingFromCard extends never ? true : never = true
void _cardExhaustive

/** The five statements of the L41604-L41612 identity card, in source order. */
export const B9_IDENTITY_CARD = B9_CARD.filter((s) => s.onTheCard)

/* ==================================================================== *
 * THE EIGHT STATES, AND THE ONE GLOSS THE SOURCE SUPPLIES.
 *
 * L41636 names eight and describes exactly one of them —
 * `STATE-B9-NOTIFIED` "under the lenient posture". The other seven are bare,
 * and a gloss is not written for them here: an invented description is
 * indistinguishable from a transcribed one forever afterwards.
 *
 * ALL EIGHT ARE THIS DEVICE'S OWN. Unlike `MOD-FL-A5`'s hold lifecycle,
 * none of these is a fleet rendering the Client Command Center holds
 * (L40930, L40950, `TEST-STATE-003` L48065), so this module's timeline
 * claims nothing a pull-based device cannot know.
 * ==================================================================== */

export interface B9State {
  readonly id: string
  /** The source's own words after the identifier, or `null` where it gives none. */
  readonly gloss: string | null
}

export const B9_STATES = [
  { id: 'STATE-B9-PASSED', gloss: null },
  { id: 'STATE-B9-BLOCKED', gloss: null },
  { id: 'STATE-B9-NOTIFIED', gloss: 'under the lenient posture' },
  { id: 'STATE-B9-PARKED', gloss: null },
  { id: 'STATE-B9-CLEARED', gloss: null },
  { id: 'STATE-B9-CLEARANCEEXPIRED', gloss: null },
  { id: 'STATE-B9-SIGNED', gloss: null },
  { id: 'STATE-B9-SUBSTITUTESIGNED', gloss: null },
] as const satisfies readonly B9State[]

/** Every state line renders this locator. One line, eight identifiers. */
export const B9_STATES_SOURCE_REF = 'L41636'

/* ==================================================================== *
 * THE OFFLINE POSITION, READ FROM WAVE 0 RATHER THAN RE-SPELLED.
 * ==================================================================== */

/**
 * The qualification gate is a member of the deterministic layer, and
 * `frontlineConnectivityTreatment` is the one place this surface decides what
 * that means with the connection gone. `degradedOffline` is typed as the
 * literal `false` there, so this module could not gate the layer behind
 * connectivity even by accident.
 */
export const SAFETY_LAYER = frontlineConnectivityTreatment({ kind: 'safety-layer' })

/** This module's own sentence for the same position, at its own line. */
export const GATE_IS_IDENTICAL_OFFLINE = {
  text: 'The gate itself is enforced locally, exactly as online.',
  sourceRef: 'L41652',
} as const

/* ==================================================================== *
 * THE STORYBOARD, AND ITS SINGLE CONTROL.
 *
 * `SB-FL-018` (L41736) is the only place the source writes the words this
 * screen puts in front of a blocked worker, and it is explicit about what is
 * absent: "There is no code field, no 'proceed anyway', and no supervisor
 * password box on the worker's path." The panel renders the storyboard's own
 * strings and its one control, so the absence is structural rather than a
 * promise in a comment.
 * ==================================================================== */

export const SB_FL_018 = {
  id: 'SB-FL-018',
  heading: 'You cannot complete this step yet.',
  requirement: 'This step requires the Torque Verification certification. Yours expired on 13 August.',
  parked:
    'This run has been set aside. Your supervisor will be asked for a temporary clearance when this tablet reconnects.',
  /** The storyboard's own single control, verbatim including its full stop. */
  control: 'Go to my other runs.',
  absent:
    "There is no code field, no “proceed anyway”, and no supervisor password box on the worker’s path.",
  sourceRef: 'L41736',
} as const

/* ==================================================================== *
 * WHAT THIS MODULE NEVER CLAIMS.
 * ==================================================================== */

export interface B9ClaimNeverMade {
  readonly claim: string
  readonly instead: string
  readonly sourceRef: string
}

export const B9_CLAIMS_NEVER_MADE = [
  {
    claim: 'That a qualification gate needs a network to hold.',
    instead:
      'The gate evaluates against cached qualifications and the package’s own requirements, and blocks a worker offline exactly as it blocks them connected. What cannot arrive offline is the clearance that lifts the block, which is why the Run parks.',
    sourceRef: 'L41652',
  },
  {
    claim: 'That a supervisor has already been notified when the device is offline.',
    instead:
      'The escalation queues, and the storyboard’s own words say what will happen rather than what has: the supervisor will be asked for a temporary clearance when this tablet reconnects.',
    sourceRef: 'L41736',
  },
  {
    claim: 'That any role can lift a gate from this device.',
    instead:
      'A clearance arrives as a validated command with an authority behind it rather than as a code a worker could be told over a radio, and there is no on-device worker override, ever.',
    sourceRef: 'L41678',
  },
] as const satisfies readonly B9ClaimNeverMade[]
