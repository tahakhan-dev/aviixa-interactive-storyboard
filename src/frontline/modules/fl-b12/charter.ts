/**
 * `MOD-FL-B12` — The Training Library Viewer. THE IDENTITY CARD, TRANSCRIBED.
 *
 * Frozen source §22.21, which opens at L42093. Identity card L42099-L42107,
 * on the alternating text/blank-line rhythm the chapter uses throughout, which
 * is why the odd lines are cited and the even ones are not. The remaining card
 * fields each carry their own line and are cited individually.
 *
 * WHAT "TRANSCRIBED" MEANS HERE — the discipline `fl-a5` settled and `fl-a6`
 * followed. Each statement's `text` is the card field's own prose with the
 * inline `[SoW Fact — §x.y]` classification markers lifted out into
 * `sourceClass`, and nothing else altered. Where a field's prose is long it is
 * carried whole; the two fields that are not are declared in `elision`.
 *
 * ── THE ONE THING A READER OF THIS FILE HAS TO CARRY AWAY ──────────────
 *
 * THIS MODULE IS ONLINE-ONLY AND IT IS THE ONLY ONE OF THE TWELVE THAT IS.
 * The slice is titled "online execution" and on this module the title is
 * literally right rather than a scope note. That is a fact about a content
 * viewer and it does not generalise: the deterministic safety layer is
 * IDENTICAL offline, which L40948 states in its own words — "A Severity 1 hold
 * fires immediately, even offline". `B12_ONLINE_ONLY_SCOPE` below says both
 * halves as data, so the second half renders rather than sitting in a comment
 * where a reader of the screen never meets it.
 *
 * ── WHAT IS DELIBERATELY NOT HERE ──────────────────────────────────────
 *
 * No pace figure, no elapsed time, no countdown, no ranking, no productivity
 * comparison, and — the shape this particular screen is most likely to grow —
 * no completion count, no "modules watched" figure and no progress percentage,
 * in any string this file holds or any state the view can reach.
 * `AC-FL-000-5` (L39100), `TEST-FL-000-3` (L39108), `AC-SCR-FL-002` (L48690)
 * and `AC-SCOPE-045` (L2683) are the four criteria; row 6 of the matrix
 * (L42118) already forbids the record any such figure would have to be
 * computed from. `fl-a3/service.ts` settled that the enumeration itself is not
 * transcribed onto a worker-facing screen, and this module holds to that: the
 * rule is stated, the banned words stay in this comment.
 */

/** How the source classifies the claim, in the source's own vocabulary. */
export type B12SourceClass = 'SoW Fact' | 'Derived Clarification'

export interface B12CardStatement {
  /** The card field's own label, verbatim. */
  readonly field: string
  readonly text: string
  readonly sourceRef: string
  /**
   * The field's own inline `[SoW Fact — §x.y]` marker, lifted out.
   *
   * `null` WHERE THE CARD CARRIES NO MARKER, and that is a recorded absence
   * rather than a default. Fourteen of the twenty-two fields below carry no
   * classification marker of their own. §22.21's Source status paragraph
   * (L42240) names the subjects it classifies rather than the card fields, so
   * it does not supply one either. Filling those fourteen with `SoW Fact`
   * because their neighbours carry it would be this build inventing a
   * classification the source withheld.
   */
  readonly sourceClass: B12SourceClass | null
  /** What was left out of this field's prose, and where it went instead. */
  readonly elision: string | null
}

/**
 * TWENTY-TWO CARD FIELDS. Five of them — Identifier and name, Purpose, User
 * benefit, Owning surface, Roles that see and use it — are the identity card
 * proper at L42099-L42107. The other seventeen are the rest of §22.21's card,
 * each on its own line.
 *
 * THE STATES FIELD (L42130) IS NOT ONE OF THE TWENTY-TWO. It is three
 * identifiers with a clause each rather than prose, and it is carried in
 * `B12_STATES` below.
 */
export const B12_CARD = [
  {
    field: 'Identifier and name',
    text: 'MOD-FL-B12. Name. Training Library Viewer.',
    sourceRef: 'MOD-FL-B12 · L42099',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Purpose',
    text:
      "To be the Frontline viewer of the platform's longer-form training material — material that " +
      'supports the work but does not belong inside it — online-only, versioned, audited, ' +
      'per-language, and creating no production record.',
    sourceRef: 'L42101',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'User benefit',
    text:
      'A worker learning a station has somewhere controlled to learn from, and the job packages stay ' +
      'small enough that assignment-time sync is fast on floor networks.',
    sourceRef: 'L42103',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Owning surface',
    text:
      'Frontline Worker Application (SURF-FL) is the viewer. Upload, versioning, and control live ' +
      'with the Standards and Operations Studio. Storage, entitlement, and package-exclusion policy ' +
      'are platform-side in the Super Admin platform console.',
    sourceRef: 'L42105',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Roles that see and use it',
    text:
      'Worker, as a viewer, scoped to their tenant and rendered in their language where a variant ' +
      'exists.',
    sourceRef: 'L42107',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Preconditions',
    text: 'An authenticated session and connectivity.',
    sourceRef: 'L42122',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Inputs',
    text:
      "Versioned, audited training assets uploaded by the tenant's authorised staff; the worker's " +
      'tenant scope and language preference.',
    sourceRef: 'L42124',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Outputs',
    text: 'Rendered content. No production record, no capture, no step execution.',
    sourceRef: 'L42126',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Objects affected',
    text:
      'None in the operational record. Not applicable — the viewer reads content and writes no ' +
      'operational object; view telemetry, if collected, is platform metadata rather than a ' +
      'production record.',
    sourceRef: 'L42128',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Happy path',
    text:
      'Between Runs, with connectivity, the worker opens the Training Library. The viewer renders ' +
      "material scoped to the worker's tenant, in the worker's language where a variant exists. The " +
      'worker watches or reads. Nothing is recorded as production data.',
    sourceRef: 'L42134',
    sourceClass: null,
    elision:
      'The source writes this field as four numbered steps at L42134 to L42137 rather than as one ' +
      'paragraph. The four sentences are its four steps in its order, joined; no step is dropped ' +
      'and none is added.',
  },
  {
    field: 'Alternate paths',
    text:
      'Offline, the destination reports its unavailability honestly rather than showing an empty ' +
      'list. A language with no variant, where the material renders in the language the uploader ' +
      'provided.',
    sourceRef: 'L42139',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Online behaviour',
    text: 'Full availability, scoped and language-rendered.',
    sourceRef: 'L42141',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Offline behaviour',
    text:
      'Unavailable by design. The library is deliberately excluded from the offline Run bundle, ' +
      'keeping bundles lean — screens, limits, gates, instructions, and the short coaching assets — ' +
      'so assignment-time sync stays fast on floor networks. A worker reaches the library when the ' +
      'device is connected; it is never required mid-Run, and nothing in a Run depends on it.',
    sourceRef: 'L42143',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Reconnect behaviour',
    text:
      'The destination becomes available again. No queued state exists, because nothing was ' +
      'recorded.',
    sourceRef: 'L42145',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Artificial-intelligence behaviour',
    text:
      'Not applicable — no artificial-intelligence capability selects, ranks, translates, or ' +
      'summarises training material in this release. The platform does not machine-translate or dub ' +
      'long-form media; training content stays authored, controlled, and predictable. A Vision ' +
      'Reasoning Agent ships in a later release with the vision atoms and has no role here.',
    sourceRef: 'L42147',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'No-artificial-intelligence behaviour',
    text: 'Identical.',
    sourceRef: 'L42149',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Dependencies',
    text:
      'MOD-FL-A1 for identity and language; connectivity; the Standards and Operations Studio for ' +
      'upload and versioning; the Super Admin platform console for storage, entitlement, and ' +
      'package-exclusion policy.',
    sourceRef: 'MOD-FL-A1 · L42151',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Interconnections',
    text:
      'Complementary to MOD-FL-B8: the in-flow coaching card is a thirty-second nudge at the step, ' +
      'and the library holds the ten-minute video on operating the tool, the walkthrough of a Work ' +
      'Instruction for somebody learning it, and the reference document a worker wants before the ' +
      'shift — not during a step.',
    sourceRef: 'MOD-FL-B8 · L42153',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Audit',
    text:
      "Material is uploaded by the tenant's authorised staff with the same discipline as " +
      'Work-Instruction versions — who uploaded it, when, and what version is current are recorded, ' +
      'and superseded versions remain in the history. It is a controlled library, not a shared ' +
      'drive. Whether individual viewings are audited is Not specified in the Statement of Work; ' +
      'because watching a video creates no production record, this chapter treats view telemetry as ' +
      'platform metadata at most and does not assert a viewing audit trail.',
    sourceRef: 'L42163',
    sourceClass: 'SoW Fact',
    elision:
      'The SoW Fact marker on this field covers the upload-discipline sentences only. The final ' +
      'sentence is the chapter recording a gap, and the source classifies it in its own words as ' +
      'Not specified in the Statement of Work rather than as fact. Both halves are carried; the ' +
      'marker is not stretched over the second.',
  },
  {
    field: 'Security',
    text:
      "The viewer is scoped to the worker's tenant, which is the cross-tenant isolation control. " +
      'Material is not downloaded to the device, which means a lost tablet carries no training ' +
      'corpus. Per-language assets are supplied by the uploader rather than generated, so no ' +
      'unreviewed text or audio reaches a worker.',
    sourceRef: 'L42165',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Fallback identifier',
    text:
      'FB-FL-CORE-01 primary — and uniquely in this chapter, the terminal state of that pattern for ' +
      'this module is simply unavailability, because no execution depends on the library.',
    sourceRef: 'FB-FL-CORE-01 · L42167',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Recovery and reconciliation',
    text:
      'Recovery is reconnection. Reconciliation is Not applicable — the viewer creates no record ' +
      'that can diverge from the server.',
    sourceRef: 'L42169',
    sourceClass: null,
    elision: null,
  },
] as const satisfies readonly B12CardStatement[]

/* ==================================================================== *
 * THE STATES FIELD.
 *
 * L42130 names three and gives each a clause of its own for two of them. Every
 * one is reachable from this screen: this module has no offline half held back
 * for a later slice, because its offline behaviour IS a rendering rather than
 * a simulation — `FUNC-B12-02-1-3` (L42180) makes the honest unavailability
 * message a functionality in its own right and says the two renderings are
 * distinct.
 * ==================================================================== */

export interface B12State {
  readonly id: string
  /** The state's own clause at L42130, verbatim. `null` where the source gives none. */
  readonly clause: string | null
  /** Whether THIS build can be driven into the state from the screen. */
  readonly drivenHere: boolean
  readonly sourceRef: string
}

export const B12_STATES = [
  {
    id: 'STATE-B12-AVAILABLE',
    clause: 'when connected',
    drivenHere: true,
    sourceRef: 'STATE-B12-AVAILABLE · L42130',
  },
  {
    id: 'STATE-B12-UNAVAILABLE',
    clause: 'when offline',
    drivenHere: true,
    sourceRef: 'STATE-B12-UNAVAILABLE · L42130',
  },
  {
    id: 'STATE-B12-VIEWING',
    clause: null,
    drivenHere: true,
    sourceRef: 'STATE-B12-VIEWING · L42130',
  },
] as const satisfies readonly B12State[]

/* ==================================================================== *
 * ONLINE-ONLY, AND THE HALF OF THAT SENTENCE THAT DOES NOT GENERALISE.
 * ==================================================================== */

export const B12_ONLINE_ONLY_SCOPE = {
  whatIsOnlineOnly:
    'This module is online-only by design and it is the only one of the twelve that is. The library ' +
    'is deliberately excluded from the offline Run bundle so that assignment-time sync stays fast ' +
    'on floor networks, and reaching it needs a connection.',
  whatIsOnlineOnlyRef: 'L42143',
  whatDoesNotGeneralise:
    'Nothing else on this device works this way. The deterministic safety layer is identical with ' +
    'no connection: a Severity 1 hold fires immediately, even offline, and the lot is protected ' +
    'from the moment of the breach rather than from the moment of sync. A full Run executes offline ' +
    'from the pinned package. This screen being unreachable offline is a statement about long-form ' +
    'video, not about the platform.',
  whatDoesNotGeneraliseRef: 'L40948',
  whyItIsSaidHere:
    'Because this is the one screen in the application whose honest offline answer is "come back ' +
    'when you have a connection", and a reader who meets that answer without the sentence beside it ' +
    'will generalise it to the work.',
  whyRef: 'AC-FL-000-4 · L39099',
} as const

/* ==================================================================== *
 * THE CLAIMS THIS MODULE MUST NEVER MAKE, HELD AS DATA SO THEY RENDER.
 * ==================================================================== */

export interface B12NeverClaimed {
  readonly claim: string
  readonly instead: string
  readonly sourceRef: string
}

export const B12_CLAIMS_NEVER_MADE = [
  {
    claim: 'That anything here was tracked, scored, or counted.',
    instead:
      'A viewing creates no production record — no Step Execution, no Data Capture, no other ' +
      'operational object. There is therefore no record from which any figure about the worker ' +
      'could be computed, and no such figure is drawn in any state of this screen. The prohibition ' +
      'is on the record first and on the display second, which is why it holds rather than being a ' +
      'rule somebody has to remember.',
    sourceRef: 'AC-B12-5 · L42223',
  },
  {
    claim: 'That any of this material is on the tablet, or could be.',
    instead:
      'No training material is included in any Run package or downloaded to the device. The ' +
      'exclusion is the design: bundles stay lean so assignment-time sync is fast, and a lost tablet ' +
      'carries no training corpus. Nobody may add training media to a Run package, which is a ' +
      'prohibition on every role rather than a setting.',
    sourceRef: 'AC-B12-1 · L42219',
  },
  {
    claim: 'That anything in a Run waits on this screen.',
    instead:
      'The library is never required mid-Run and nothing in a Run depends on it. No authored ' +
      'workflow can create a dependency on library content and no Run blocks on it. This module is ' +
      'never a gate, and a viewer reachable from inside the Run Player as a required step would be ' +
      'the defect this row exists to forbid.',
    sourceRef: 'AC-B12-2 · L42220',
  },
  {
    claim: 'That a worker could rehearse a Workflow here.',
    instead:
      'There is no practice or rehearsal mode in the build. It is cut rather than deferred: a ' +
      'rehearsal capability running a real Workflow end to end with results segregated from ' +
      'production records would be a change request if it resurfaces. What exists instead is this ' +
      'viewer.',
    sourceRef: 'AC-B12-7 · L42225',
  },
] as const satisfies readonly B12NeverClaimed[]

/* ==================================================================== *
 * WHERE THIS MODULE SURFACES, AND THE NAMESPACE COLLISION SEEN FROM ITS END.
 *
 * This destination carries TWO screen identifiers, from the two registers
 * `RULING-FL-1` holds apart in `@/frontline/screens`. §25.5 gives it
 * `SCR-FL-05` (L48533) and §22.7 gives the same token to the package readiness
 * detail on My Runs (L39867), while §22.7's own row for this destination is
 * `SCR-FL-19` (L39881). Neither identifier is a route key here; the slug is,
 * and the slug is wave 0's.
 * ==================================================================== */

export const B12_WHERE_IT_SURFACES = [
  {
    place: 'The Training Library destination, as the six-row register names it.',
    what: 'View long-form training material when connected. Worker. MOD-FL-B12 all features. Persistent navigation.',
    sourceRef: 'SCR-FL-05 · L48533',
  },
  {
    place: 'The same destination, as the twenty-three-row register names it.',
    what: 'Training Library list and viewer.',
    sourceRef: 'SCR-FL-19 · L39881',
  },
  {
    place: 'The destination-property table, which is where the offline answer is fixed.',
    what: 'Unavailable — online-only by design, excluded from the offline bundle. Sync indicator. Depth 2.',
    sourceRef: 'L40036',
  },
  {
    place: 'The navigation diagram, which states the condition in the node label itself.',
    what: 'SCR-FL-05 Training Library, connected only.',
    sourceRef: 'SCR-FL-05 · L48542',
  },
] as const satisfies readonly {
  readonly place: string
  readonly what: string
  readonly sourceRef: string
}[]

/**
 * The module inventory's own Band column, read off this module's own row.
 * Header L39844, and B12's row is L39857 — the last of the twelve. A1 through
 * A7 read `A` and B8 through B12 read `B`; that letter is what the `B` in the
 * module identifier means. No build-plan rigour grade is transcribed here,
 * because the source's inventory has no such column.
 */
export const B12_INVENTORY_ROW = {
  identifier: 'MOD-FL-B12',
  module: 'Training Library Viewer',
  band: 'B',
  oneLineScope:
    'Online-only viewer of versioned, per-language training material; no production records',
  sourceRef: 'MOD-FL-B12 · L39857',
  headerRef: 'L39844',
} as const
