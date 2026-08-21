import {
  CAPTURE_STATE_LABEL,
  captureStateLine,
  platformHoldsTheRecord,
  unresolvedProvenanceLine,
  type CaptureState,
  type RuntimeEnvelope,
} from '@/frontline/capture'
import {
  functionalitiesNamingNoPattern,
  patternsForModule,
  type FrontlineFallbackId,
  type FrontlineFallbackPattern,
} from '@/frontline/fallbacks'
import { OPEN_DECISION_IDS } from '@/disclosure/decisions'
import { CAPTURE_TYPES, type CaptureType } from '@/studio/vocab/authoring'

/**
 * `MOD-FL-A4` — the module's own vocabulary and its own logic. Everything
 * this file holds is either transcribed from §22.13 or CONSUMED from a wave-0
 * representation; nothing is re-derived.
 *
 * ── A CORRECTION TO THE BRIEF THIS FILE WAS WRITTEN FROM ──────────────────
 * The per-module brief says the capture-type contract "is already settled in
 * `src/frontline/capture.ts` — consume it". It is not there. That file holds
 * the capture STATE ladder and the nine-field runtime envelope, and neither
 * is the type contract. The contract is settled in
 * `src/studio/vocab/authoring.ts` as `CAPTURE_TYPES`, built from
 * `AC-STU-065` (L32421), and `TEST-WF-AUT-002-04` (L53401) makes divergence
 * between that list and the Frontline renderer list a BUILD FAILURE. So this
 * module imports that list rather than spelling a second one, which is
 * exactly what the test at L53401 exists to catch — and the correction is
 * reported rather than routed around.
 *
 * ── A SECOND CORRECTION, MEASURED ─────────────────────────────────────────
 * The brief calls this module's functionality count "24 — the largest built
 * in this slice". The count is right and the superlative is not: `MOD-FL-A6`
 * carries 28 distinct `FUNC-A6-*` identifiers (L41162-L41207) against this
 * module's 24, so A4 is the SECOND largest of the twelve. Nothing built here
 * changes; the claim is corrected rather than repeated, and
 * `tests/unit/fl-a4.test.ts` counts both out of the frozen source so the
 * correction is held rather than asserted in prose.
 *
 * ── A TYPE THE CONTRACT DOES NOT NAME CANNOT RENDER ───────────────────────
 * `FLA4_CAPTURE_TYPE_RENDERING` is a TOTAL `Record<CaptureType, …>`. The key
 * space IS the contract, so an eighth type has nowhere to be written and a
 * member dropped from the contract fails to compile here. `AC-A4-3` (L40867)
 * is the criterion this shape holds.
 */

/* ==================================================================== *
 * THE SEVEN-TYPE CONTRACT, PLUS NONE.
 * ==================================================================== */

export interface Fla4CaptureTypeRendering {
  /** §22.13's own name for this type, where it names one of its own. */
  readonly funcId: string
  /** The functionality's purpose clause, in the source's own words. */
  readonly purpose: string
  /** The `FB-FL-*` patterns the functionality itself names. */
  readonly patterns: readonly FrontlineFallbackId[]
  readonly sourceRef: string
}

/**
 * Seven types with a functionality of their own, and `none` with none —
 * `none` is not a capture, it is the instruction-only screen's absence of
 * one, so §22.13 gives it no `FUNC-*` and this record says so rather than
 * inventing one to fill the cell.
 */
export const FLA4_CAPTURE_TYPE_RENDERING: Readonly<
  Record<CaptureType, Fla4CaptureTypeRendering>
> = {
  'measurement entry': {
    funcId: 'FUNC-A4-03-1-1',
    purpose: 'a numeric value evaluated against authored limits',
    patterns: ['FB-FL-CAP-01'],
    sourceRef: 'FUNC-A4-03-1-1 L40803',
  },
  'photo capture': {
    funcId: 'FUNC-A4-03-1-3',
    purpose: 'visual proof bound into the evidence chain',
    patterns: ['FB-FL-STORE-01', 'FB-FL-UP-01'],
    sourceRef: 'FUNC-A4-03-1-3 L40805',
  },
  'barcode or Quick Response code scan': {
    funcId: 'FUNC-A4-03-1-2',
    purpose: 'identification and validation',
    patterns: ['FB-FL-SCAN-01'],
    sourceRef: 'FUNC-A4-03-1-2 L40804',
  },
  'checkbox confirmation': {
    funcId: 'FUNC-A4-03-1-4',
    purpose:
      'confirmation of one item or of many, governed by the authored multiplicity setting',
    patterns: ['FB-FL-CAP-01'],
    sourceRef: 'FUNC-A4-03-1-4 L40806',
  },
  'digital signature': {
    funcId: 'FUNC-A4-03-1-6',
    purpose: 'an attributable attestation at a step',
    patterns: ['FB-FL-AUTH-01'],
    sourceRef: 'FUNC-A4-03-1-6 L40808',
  },
  'free text': {
    funcId: 'FUNC-A4-03-1-7',
    purpose: 'an observation the authored types cannot hold',
    patterns: ['FB-FL-CAP-01'],
    sourceRef: 'FUNC-A4-03-1-7 L40809',
  },
  'dropdown selection': {
    funcId: 'FUNC-A4-03-1-5',
    purpose:
      'a constrained choice from an authored option list, recorded as the selected option’s stable identifier together with its rendered label, which is what distinguishes it in evidence from free text',
    patterns: ['FB-FL-CAP-01'],
    sourceRef: 'FUNC-A4-03-1-5 L40807',
  },
  none: {
    funcId: 'none',
    purpose:
      'instruction-only screens. The adopted contract adds this to the seven; §22.13 gives it no functionality of its own, because it is the absence of a capture rather than a kind of one',
    patterns: [],
    sourceRef: 'L40769',
  },
}

/** The contract as this module renders it. Never a second list. */
export const FLA4_RENDERED_CAPTURE_TYPES: readonly CaptureType[] = CAPTURE_TYPES

/**
 * The two type names §1.7 and §7.8.3 use that the adopted contract does not,
 * and what the adopted contract renders them as. `AC-A4-3` (L40867) says the
 * application renders no eighth type, so these are carried as a MAPPING and
 * never as members: a screen asked for a checklist renders a checkbox
 * confirmation with several items, and the evidence record states whether
 * every item was completed.
 */
export const FLA4_UNRENDERED_TYPE_NAMES = [
  {
    name: 'checklist',
    rendersAs: 'checkbox confirmation',
    why: 'several confirmations under the authored multiplicity setting',
    sourceRef: 'FUNC-A4-03-1-4 L40806',
  },
  {
    name: 'boolean',
    rendersAs: 'checkbox confirmation',
    why: 'one confirmation under the authored multiplicity setting',
    sourceRef: 'FUNC-A4-03-1-4 L40806',
  },
] as const satisfies readonly {
  readonly name: string
  readonly rendersAs: CaptureType
  readonly why: string
  readonly sourceRef: string
}[]

/* ==================================================================== *
 * THE TWENTY-FOUR FUNCTIONALITIES, AND THE FALLBACK OBLIGATION.
 *
 * `AC-FL-011-1` (L40151): "Every functionality in this chapter names at least
 * one `FB-FL-*` pattern." This module has twenty-four functionalities, the
 * largest count of the twelve, so a rule checked by eye is a rule that goes
 * unchecked — `functionalitiesNamingNoPattern` in `@/frontline/fallbacks` is
 * handed this list.
 *
 * IT DOES NOT COME BACK EMPTY, AND THAT IS A FINDING RATHER THAN A BUG HERE.
 * Eight of the twenty-four write `Not applicable` in their Fallback clause
 * and name no `FB-FL-*` pattern at all. Every one of the eight states a
 * reason for it — "an absent capability has no failure mode", "the honest
 * note is itself the safe outcome", "a prohibition on gating cannot itself
 * fail" — so this is the source declining the obligation on a stated ground,
 * not a gap in this transcription. Inventing a pattern to make the criterion
 * come out clean would be manufacturing the evidence, so the eight are
 * recorded with their reasons and `FLA4_FUNCTIONALITIES_NAMING_NO_PATTERN`
 * is asserted to be exactly those eight.
 * ==================================================================== */

export interface Fla4Functionality {
  readonly id: string
  /** The functionality's own opening sentence, verbatim. */
  readonly title: string
  readonly patterns: readonly FrontlineFallbackId[]
  /** The source's own reason where it names no pattern. `null` where it does. */
  readonly noPatternReason: string | null
  readonly sourceRef: string
}

export const FLA4_FUNCTIONALITIES = [
  {
    id: 'FUNC-A4-01-1-1',
    title:
      'Show the worker immediately whether the value is within tolerance, against the specification limits the Studio author set, without waiting for a server round-trip.',
    patterns: ['FB-FL-CAP-01'],
    noPatternReason: null,
    sourceRef: 'FUNC-A4-01-1-1 L40793',
  },
  {
    id: 'FUNC-A4-01-1-2',
    title:
      'Render the feedback in high contrast and visually rather than audibly, because plants can be loud enough that no audio cue can be relied on.',
    // The source writes "Not applicable — a rendering property, covered by
    // `FB-FL-RENDER-01` if the renderer itself fails." It DOES name a
    // pattern, in the same clause that says the obligation does not apply, so
    // it is recorded as naming one.
    patterns: ['FB-FL-RENDER-01'],
    noPatternReason: null,
    sourceRef: 'FUNC-A4-01-1-2 L40794',
  },
  {
    id: 'FUNC-A4-02-1-1',
    title:
      'Use the device’s hardware scanner where one is present and fall back to the camera otherwise.',
    patterns: ['FB-FL-SCAN-01'],
    noPatternReason: null,
    sourceRef: 'FUNC-A4-02-1-1 L40797',
  },
  {
    id: 'FUNC-A4-02-2-1',
    title: 'Identify the unit being worked.',
    patterns: ['FB-FL-SCAN-01'],
    noPatternReason: null,
    sourceRef: 'FUNC-A4-02-2-1 L40799',
  },
  {
    id: 'FUNC-A4-02-2-2',
    title: 'Validate a scan against an expected value where a screen defines one.',
    patterns: ['FB-FL-SCAN-01'],
    noPatternReason: null,
    sourceRef: 'FUNC-A4-02-2-2 L40800',
  },
  {
    id: 'FUNC-A4-03-1-1',
    title: 'Measurement.',
    patterns: ['FB-FL-CAP-01'],
    noPatternReason: null,
    sourceRef: 'FUNC-A4-03-1-1 L40803',
  },
  {
    id: 'FUNC-A4-03-1-2',
    title: 'Scan.',
    patterns: ['FB-FL-SCAN-01'],
    noPatternReason: null,
    sourceRef: 'FUNC-A4-03-1-2 L40804',
  },
  {
    id: 'FUNC-A4-03-1-3',
    title: 'Photo.',
    patterns: ['FB-FL-STORE-01', 'FB-FL-UP-01'],
    noPatternReason: null,
    sourceRef: 'FUNC-A4-03-1-3 L40805',
  },
  {
    id: 'FUNC-A4-03-1-4',
    title: 'Checkbox confirmation.',
    patterns: ['FB-FL-CAP-01'],
    noPatternReason: null,
    sourceRef: 'FUNC-A4-03-1-4 L40806',
  },
  {
    id: 'FUNC-A4-03-1-5',
    title: 'Dropdown selection.',
    patterns: ['FB-FL-CAP-01'],
    noPatternReason: null,
    sourceRef: 'FUNC-A4-03-1-5 L40807',
  },
  {
    id: 'FUNC-A4-03-1-6',
    title: 'Digital signature, covering electronic signature or acknowledgement.',
    patterns: ['FB-FL-AUTH-01'],
    noPatternReason: null,
    sourceRef: 'FUNC-A4-03-1-6 L40808',
  },
  {
    id: 'FUNC-A4-03-1-7',
    title: 'Free text.',
    patterns: ['FB-FL-CAP-01'],
    noPatternReason: null,
    sourceRef: 'FUNC-A4-03-1-7 L40809',
  },
  {
    id: 'FUNC-A4-03-2-1',
    title: 'Refuse video capture and direct Bluetooth-gauge integration.',
    patterns: [],
    noPatternReason: 'Not applicable — an absent capability has no failure mode.',
    sourceRef: 'FUNC-A4-03-2-1 L40811',
  },
  {
    id: 'FUNC-A4-04-1-1',
    title:
      'Make captured evidence immutable and bind it to the step, the unit where one applies, the worker’s identity, the device, and both timestamps.',
    patterns: ['FB-FL-CAP-01'],
    noPatternReason: null,
    sourceRef: 'FUNC-A4-04-1-1 L40814',
  },
  {
    id: 'FUNC-A4-04-1-2',
    title: 'Route corrections through the append-only model.',
    patterns: ['FB-FL-CAP-01'],
    noPatternReason: null,
    sourceRef: 'FUNC-A4-04-1-2 L40815',
  },
  {
    id: 'FUNC-A4-04-2-1',
    title:
      'Keep captured media in the application’s encrypted store so it never touches the device gallery.',
    patterns: ['FB-FL-STORE-01'],
    noPatternReason: null,
    sourceRef: 'FUNC-A4-04-2-1 L40817',
  },
  {
    id: 'FUNC-A4-04-2-2',
    title:
      'Evict media only after confirmed server receipt plus an integrity check, never on the strength of an attempted upload.',
    patterns: ['FB-FL-STORE-01'],
    noPatternReason: null,
    sourceRef: 'FUNC-A4-04-2-2 L40818',
  },
  {
    id: 'FUNC-A4-04-3-1',
    title:
      'Ensure the Client Command Center and the Delivery Operations Hub display evidence and never edit it.',
    patterns: [],
    noPatternReason: 'Not applicable — same reason.',
    sourceRef: 'FUNC-A4-04-3-1 L40820',
  },
  {
    id: 'FUNC-A4-05-1-1',
    title:
      'Record the named place a capture belongs to — the site, line, and cell of the operational hierarchy, resolved from the station and assignment context.',
    patterns: [],
    noPatternReason:
      'Not applicable — provenance failure is handled by the next functionality rather than by a fallback pattern.',
    sourceRef: 'FUNC-A4-05-1-1 L40823',
  },
  {
    id: 'FUNC-A4-05-1-2',
    title: 'Note plainly where the context cannot supply a location.',
    patterns: [],
    noPatternReason: 'Not applicable — the honest note is itself the safe outcome.',
    sourceRef: 'FUNC-A4-05-1-2 L40824',
  },
  {
    id: 'FUNC-A4-05-1-3',
    title: 'Never let provenance gate a capture.',
    patterns: [],
    noPatternReason: 'Not applicable — a prohibition on gating cannot itself fail.',
    sourceRef: 'FUNC-A4-05-1-3 L40825',
  },
  {
    id: 'FUNC-A4-05-2-1',
    title: 'Record no Global Positioning System stamp.',
    patterns: [],
    noPatternReason: 'Not applicable — an absent capability has no failure mode.',
    sourceRef: 'FUNC-A4-05-2-1 L40827',
  },
  {
    id: 'FUNC-A4-05-2-2',
    title:
      'Disclose the stamp plainly to the worker as part of the record they are creating.',
    patterns: [],
    noPatternReason: 'Not applicable — a disclosure line has no external dependency.',
    sourceRef: 'FUNC-A4-05-2-2 L40828',
  },
  {
    id: 'FUNC-A4-05-3-1',
    title: 'Resolve provenance to the depth the tenant configured.',
    patterns: [],
    noPatternReason: 'Not applicable — the record states which levels it resolved.',
    sourceRef: 'FUNC-A4-05-3-1 L40830',
  },
] as const satisfies readonly Fla4Functionality[]

/** The eight, computed by the shared rule and never listed a second time. */
export const FLA4_FUNCTIONALITIES_NAMING_NO_PATTERN: readonly string[] =
  functionalitiesNamingNoPattern(FLA4_FUNCTIONALITIES)

/**
 * The five patterns the §22.9 map lists against this module, read through
 * `patternsForModule` rather than transcribed. The module's own Fallback
 * identifier line (L40785) names the same five — `FB-FL-CAP-01` primary,
 * `FB-FL-SCAN-01` for identification, `FB-FL-UP-01` for upload,
 * `FB-FL-STORE-01` for storage, `FB-FL-CORE-01` for connectivity — and the
 * covering test holds the two readings equal rather than asserting one.
 */
export const FLA4_PATTERNS: readonly FrontlineFallbackPattern[] =
  patternsForModule('MOD-FL-A4')

/**
 * The module's own Fallback-identifier line, transcribed. It is an
 * INDEPENDENT reading of the same fact `FLA4_PATTERNS` derives from the map,
 * which is what makes comparing them a check rather than a restatement.
 */
export const FLA4_CARD_PATTERN_IDS = [
  'FB-FL-CAP-01',
  'FB-FL-SCAN-01',
  'FB-FL-UP-01',
  'FB-FL-STORE-01',
  'FB-FL-CORE-01',
] as const satisfies readonly FrontlineFallbackId[]

/**
 * Two patterns this module's functionalities name that the §22.9 map does NOT
 * list against `MOD-FL-A4`. Recorded, not reconciled: `FB-FL-RENDER-01` is
 * mapped to `MOD-FL-A3` and `FB-FL-AUTH-01` to A1, A6, B9 and B11, and both
 * are named here by a functionality of this module. The map's "primary
 * modules" column and a functionality's Fallback clause are not the same
 * claim, so neither is wrong; the divergence is stated instead of smoothed.
 */
export const FLA4_PATTERNS_NAMED_BEYOND_THE_MAP = [
  { id: 'FB-FL-RENDER-01', namedBy: 'FUNC-A4-01-1-2 L40794', mappedTo: 'MOD-FL-A3' },
  { id: 'FB-FL-AUTH-01', namedBy: 'FUNC-A4-03-1-6 L40808', mappedTo: 'MOD-FL-A1, A6, B9, B11' },
] as const satisfies readonly {
  readonly id: FrontlineFallbackId
  readonly namedBy: string
  readonly mappedTo: string
}[]

/* ==================================================================== *
 * THE DECISIONS THIS MODULE DISCLOSES.
 *
 * SIX ARE NAMED IN THE BRIEF AND THE SHARED CANON HOLDS ONE OF THEM.
 * `src/disclosure/decisions.ts` — the only renderer of an open decision on
 * any surface — is keyed on `DecisionId`, and of the six only `DEC-CAP-001`
 * is a member. `DEC-STORE-001`, `DEC-AREA-001`, `DEC-SITE-001`,
 * `DEC-PLUS-001` and `DEC-SCAN-001` have no record there, and that file is
 * not this task's to edit.
 *
 * SO THE FIVE ARE CARRIED HERE, AND THE CARRYING IS ITSELF DISCLOSED.
 * `AC-FL-011-5` (L40155) requires `DEC-STORE-001` to "remain visibly open"
 * and `TEST-FL-011-5` (L40165) tests for an explicit marker, so not
 * disclosing was never available. `AC-MTX-004` (L10296) requires every "and
 * above" to carry a `DEC-PLUS-001` reference, which row 7's Supervisor cell
 * does.
 *
 * AND THE STAND-IN IS BUILT TO EXPIRE. `tests/unit/fl-a4.test.ts` asserts
 * that every id in this list is ABSENT from `OPEN_DECISION_IDS`. The moment
 * the controller lifts one into the shared canon, this list stops being the
 * complement and the suite goes red — which is what stops a module-local copy
 * outliving the reason it exists and becoming the second spelling.
 * ==================================================================== */

export interface Fla4DecisionReading {
  readonly text: string
  /** Frozen-source locator. Always names a line. */
  readonly locator: string
}

export interface Fla4OpenDecision {
  readonly id: string
  readonly question: string
  readonly readings: readonly Fla4DecisionReading[]
  /**
   * This build's working position, or the explicit statement that there is
   * none. Never presented as the source's ruling.
   */
  readonly adopted: string
  /** Where it bites in THIS module. Never blank. */
  readonly whereItBites: string
}

export const FLA4_DECISIONS_NOT_IN_THE_SHARED_CANON = [
  {
    id: 'DEC-STORE-001',
    question: 'What the device does when on-device storage is exhausted.',
    readings: [
      {
        text: 'Block new capture with a clear message and force a sync.',
        locator: 'DEC-STORE-001 L40116',
      },
      {
        text: 'Block new media capture only while permitting non-media captures.',
        locator: 'DEC-STORE-001 L40116',
      },
      {
        text: 'Refuse to start additional Runs while permitting completion of Runs in progress.',
        locator: 'DEC-STORE-001 L40116',
      },
    ],
    adopted:
      'None. This is an explicit absence, not an unstated one: the source names three candidate behaviours, records a recommendation, and states that storage-full behaviour is deferred to the Frontline Functional Specification per platform and that no behaviour may be invented. This build invents none. What it does carry is the invariant the source does state and the recommendation does not overturn — capture blocked with all existing data preserved, never eviction of unconfirmed evidence.',
    whereItBites:
      'The preconditions of this module (L40732), the media-eviction functionality FUNC-A4-04-2-2 (L40818), and the terminal safe state of a failed local commit (L40859). STATE-12 (L48672) and AC-SCR-FL-006 (L48694) both defer to it by name.',
  },
  {
    id: 'DEC-AREA-001',
    question:
      'Whether a Job binds to one Area as a hard constraint or to one parent node at the tenant’s configured depth.',
    readings: [
      {
        text: 'Section 2.1: the superseded one-Area-per-Job constraint becomes one parent node per Job at the tenant’s configured depth.',
        locator: 'DEC-AREA-001 L39126',
      },
      {
        text: 'Section 4.5.1: a Job carries a single Area binding and one Area per Job is a hard constraint.',
        locator: 'DEC-AREA-001 L39126',
      },
    ],
    adopted:
      'The adopted working position, and it is the source’s own rather than this build’s: a Job anchors at the deepest parent node its tenant configured, so the provenance stamp resolves site, line and cell down to that node. Client ratification is outstanding and both readings stay on the record.',
    whereItBites:
      'The named-location provenance field of the runtime envelope, through FUNC-A4-05-3-1 (L40830) and AC-FL-001-5 (L39184). Row 9 of this module’s matrix (L40730) prohibits suppressing that stamp for every column, so what the stamp contains is not an implementation detail here.',
  },
  {
    id: 'DEC-SITE-001',
    question: 'Whether the Site level is a required minimum of the location hierarchy.',
    readings: [
      {
        text: 'Section 2.1 marks whether the Site level is a required minimum as open.',
        locator: 'DEC-SITE-001 L39126',
      },
      { text: 'Section 4.3.1 states the Site level as mandatory.', locator: 'DEC-SITE-001 L39126' },
    ],
    adopted:
      'The adopted working position, again the source’s own: the Site level is mandatory with a default Site auto-created at tenant provisioning, so the site element of the provenance stamp is always resolvable. Client ratification is outstanding.',
    whereItBites:
      'The same envelope field as DEC-AREA-001. Together the two decide what a complete provenance stamp contains — a site, resolving down to the Job’s parent node (L40830).',
  },
  {
    id: 'DEC-PLUS-001',
    question:
      'What "Quality Manager and above" orders, across five additive, non-hierarchical roles.',
    readings: [
      {
        text: 'The authority matrices use these forms without defining an ordering, and the platform states that multi-role is additive and that the audit log records identity rather than "acting as role".',
        locator: 'DEC-PLUS-001 L39840',
      },
      {
        text: 'Chapter 22 reads "Supervisor and above" as "any identity holding the Supervisor role or the Quality Manager role", and never as a rank comparison, and preserves the ambiguity.',
        locator: 'DEC-PLUS-001 L39840',
      },
    ],
    adopted:
      'None, and none is available: AC-MTX-004 (L10296) states that no matrix invents a role ordering and that every "and above" reproduces the source’s phrasing. This module’s row 7 Supervisor cell therefore carries the source’s words unchanged and names this decision beside them.',
    whereItBites:
      'Row 7 of this module’s matrix (L40728). The Supervisor cell reads Explicitly prohibited — Quality Manager and above, and the phrase is the whole of the ambiguity.',
  },
  {
    id: 'DEC-SCAN-001',
    question:
      'Which dedicated scanners and scanner-integrated devices the target floors actually use.',
    readings: [
      {
        text: 'The client supplies the list.',
        locator: 'DEC-SCAN-001 L42508',
      },
      { text: 'The client supplies representative hardware for testing.', locator: 'DEC-SCAN-001 L42508' },
      {
        text: 'The client accepts camera-based scanning as the launch path, with hardware scanning validated post-launch.',
        locator: 'DEC-SCAN-001 L42508',
      },
    ],
    adopted:
      'None. The decision owner is the client and the recommendation — the list plus representative hardware — is the source’s, not this build’s. What this module builds is unaffected either way: the hardware-then-camera ladder of FUNC-A4-02-1-1 works whichever list arrives, and no scanner family is named anywhere in this module.',
    whereItBites:
      'FUNC-A4-02-1-1 (L40797) names it as an open dependency. AC-FL-025-5 (L42561) requires it to remain visibly open.',
  },
] as const satisfies readonly Fla4OpenDecision[]

/** `DEC-CAP-001` is in the shared canon and renders through the shared renderer. */
export const FLA4_DECISION_IN_THE_SHARED_CANON = 'DEC-CAP-001'

/** True for an id the shared canon holds. Used by the covering test, not by a view. */
export function inTheSharedCanon(id: string): boolean {
  return (OPEN_DECISION_IDS as readonly string[]).includes(id)
}

/* ==================================================================== *
 * ONE CAPTURE, AS THE SOURCE'S OWN EXAMPLE WRITES IT.
 *
 * `SB-FL-013` (L40855) and the Illustrative Example at L40857 are one
 * capture, described twice. The envelope below is that capture, built to the
 * NINE-FIELD shape settled in `@/frontline/capture` — the module does not
 * define an envelope, it fills one.
 *
 * `TEST-A4-10` (L40887) is the case the second envelope covers: "Remove
 * provenance context and assert the capture proceeds with an explicit
 * unresolved marker."
 * ==================================================================== */

export const FLA4_WORKED_CAPTURE: RuntimeEnvelope = {
  screenCarriesLimits: true,
  stepDefinition: {
    workflowId: 'WF-WHEEL-ASSEMBLY',
    pinnedVersion: 'v2.1.0',
    stepId: 'STEP-WHEEL-BOLT-TORQUE',
  },
  jobId: 'JOB-RIVERSIDE-WHEELS',
  runId: 'RUN-RB-0007',
  unitOrLot: { kind: 'unit', id: 'RB-0007' },
  workerIdentity: 'Maya',
  authorisingIdentity: null,
  deviceIdentity: 'TAB-014',
  namedLocation: {
    resolved: true,
    site: 'SITE-RIVERSIDE',
    area: 'AREA-ASSY-A',
    cell: 'CELL-WHEEL-2',
  },
  deviceTime: '09:14',
  serverReceiptTime: { received: false, heldAt: 'queued' },
  deterministicResult: { inSpecification: false, severityBand: 2 },
  evidenceRefs: ['EVID-TORQUE-PROOF-RB-0007'],
}

/**
 * The same capture on a device whose station context supplied no location.
 * The marker is REQUIRED to carry a note, so "recorded as unresolved" cannot
 * degrade into the empty value `AC-FL-006-1` (L39634) forbids.
 */
export const FLA4_WORKED_CAPTURE_WITHOUT_PROVENANCE: RuntimeEnvelope = {
  ...FLA4_WORKED_CAPTURE,
  namedLocation: {
    resolved: false,
    note: 'The station and assignment context supplied no site, line or cell for this device.',
  },
}

/**
 * What the screen prints beside a capture. Every branch reads
 * `captureStateLine`, which reads a TOTAL record over a union with no
 * `synced` member and no success member — so there is no branch here that
 * could produce a bare tick, and none that could be added.
 */
export function fla4CaptureLine(state: CaptureState): string {
  return captureStateLine(state)
}

/** The provenance sentence, or `null` where provenance resolved. */
export function fla4ProvenanceLine(envelope: RuntimeEnvelope): string | null {
  return unresolvedProvenanceLine(envelope.namedLocation)
}

/**
 * The states this module's storyboard actually walks: the capture is
 * committed on the device and enters the queue, and the platform holds no
 * record of it yet. `STATE-09` (L48669): "A capture is never shown as
 * recorded by the platform while it sits on the device."
 */
export const FLA4_STORYBOARD_STATES = [
  'committed-locally',
  'queued',
] as const satisfies readonly CaptureState[]

export function fla4PlatformHoldsTheRecord(state: CaptureState): boolean {
  return platformHoldsTheRecord(state)
}

export { CAPTURE_STATE_LABEL }
