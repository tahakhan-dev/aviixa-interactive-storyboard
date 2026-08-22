/**
 * `MOD-FL-A6` — The Offline and Sync Engine. THE IDENTITY CARD, TRANSCRIBED,
 * AND THE SCOPE BOUNDARY THIS SLICE CUTS THROUGH THE MIDDLE OF IT.
 *
 * Frozen source §22.15, which opens at L41074. Identity card L41080-L41088;
 * the remaining card fields carry their own lines and are cited individually.
 *
 * THE ONE THING A READER OF THIS FILE HAS TO CARRY AWAY. Slice 7 built this
 * module's identity, its matrix, its refusals and the CONNECTED path, and
 * marked what it had not driven. Slice 8 built the other half in `offline.ts`:
 * the four axes the seven states sit on, the two bounded tenant settings, the
 * reconnect ladder walked over the thirty-seven steps, and the binding from
 * each functionality to the mechanism that now exercises it. The card stated
 * the OFFLINE behaviour from the first slice regardless, because a screen that
 * renders only the connected path implies the safety layer needs a network —
 * the one claim chapter 22 exists to deny (L40948, L40954, `AC-FL-000-4`
 * L39099). `A6_SLICE_BOUNDARY` below is the standing form of that: what this
 * build drives, and what is left undriven with the reason, held as data so it
 * renders rather than sitting in a comment.
 *
 * WHAT "TRANSCRIBED" MEANS HERE, EXACTLY — the same discipline `fl-a5`
 * settled. Each statement's `text` is the card field's own prose with the
 * inline `[SoW Fact — §x.y]` classification markers lifted out into
 * `sourceClass`, and nothing else altered. Where a field's prose is long it is
 * carried whole; the one field that is not is declared in `elision`.
 */

/** How the source classifies the claim, in the source's own vocabulary. */
export type A6SourceClass = 'SoW Fact' | 'Derived Clarification — adopted working position'

export interface A6CardStatement {
  /** The card field's own label, verbatim. */
  readonly field: string
  readonly text: string
  readonly sourceRef: string
  /**
   * The field's own inline `[SoW Fact — §x.y]` marker, lifted out.
   *
   * `null` WHERE THE CARD CARRIES NO MARKER, and that is a recorded absence
   * rather than a default. Ten of the twenty-two fields carry no
   * classification marker of their own, and §22.15's Source status paragraph
   * (L41276) does not name them either. Filling those ten with `SoW Fact`
   * because their neighbours carry it would be this build inventing a
   * classification the source withheld.
   */
  readonly sourceClass: A6SourceClass | null
  /**
   * What was left out of this field's prose, and where it went instead.
   * `null` where the field is carried whole, which is twenty-one of
   * twenty-two.
   */
  readonly elision: string | null
}

/**
 * TWENTY-TWO CARD FIELDS. Five of them — Identifier, Purpose, User benefit,
 * Owning surface, Roles that see and use it — are the identity card proper at
 * L41080-L41088, on the alternating text/blank-line rhythm the chapter uses
 * throughout, which is why the even lines are cited and the odd ones are not.
 * The other seventeen are the rest of §22.15's card and each carries its own
 * line.
 *
 * THE STATES FIELD (L41112) IS NOT ONE OF THE TWENTY-TWO. It is a list of
 * seven identifiers rather than prose, and it is carried in `A6_STATES` below
 * with the one gloss the source gives and the six it withholds.
 */
export const A6_CARD = [
  {
    field: 'Identifier and name',
    text: 'MOD-FL-A6. Name. Offline and Sync Engine.',
    sourceRef: 'MOD-FL-A6 · L41080',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Purpose',
    text:
      'To be what lets the safety backbone and the capture model work on a floor with no reliable ' +
      'connectivity.',
    sourceRef: 'L41082',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'User benefit',
    text:
      'The floor never waits for a network. A worker never loses work. A worker never has to think ' +
      'about synchronisation, and never has to resolve anything.',
    sourceRef: 'L41084',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Owning surface',
    text:
      "Frontline Worker Application (SURF-FL). Package production is the Standards and Operations " +
      "Studio's; command origination is elsewhere; the device end of both is here.",
    sourceRef: 'L41086',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Roles that see and use it',
    text:
      'Worker, who sees only the honest sync indicator and the optional manual sync convenience. No ' +
      'other role interacts with this module on the device.',
    sourceRef: 'L41088',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Preconditions',
    text:
      'An enrolled device with the application installed and an authenticated session for package ' +
      "delivery scoped to the identity's assignments.",
    sourceRef: 'L41104',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Inputs',
    text:
      'Work packages; assignments; command-channel actions; server acknowledgements; server-receipt ' +
      'timestamps; tenant settings for the offline trust window and the clock-skew threshold; ' +
      'adoption timing for version changes.',
    sourceRef: 'L41106',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Outputs',
    text:
      'Uploaded capture events and evidence; command acknowledgements; clock-skew operational events; ' +
      'device and usage telemetry; the sync state the indicator renders.',
    sourceRef: 'L41108',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Objects affected',
    text:
      'OBJ-FL-QUEUE the durable upload queue; OBJ-FL-CMDLEDGER the local command ledger; OBJ-FL-PKG ' +
      'the staged package set; OBJ-FL-SYNCSTATE.',
    sourceRef: 'OBJ-FL-QUEUE · L41110',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Alternate paths',
    text:
      'A mid-shift assignment pulled lazily. A forced sync before a designated high-risk action. A ' +
      'clearance expiring and re-blocking at the next gate evaluation. A version change published ' +
      'mid-shift, held to the boundary of the next execution. A clock-skew detection. A conflict ' +
      'routed to the Client Command Center. Storage exhaustion, open as DEC-STORE-001.',
    sourceRef: 'L41125',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Online behaviour',
    text:
      'Continuous bidirectional sync; immediate package staging; forced syncs succeed; server-receipt ' +
      'timestamps are written; commands are pulled and applied; telemetry emits.',
    sourceRef: 'L41127',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Offline behaviour',
    text:
      'A full Run executes offline from the pinned package. Queues accumulate durably. Cached ' +
      'credentials and qualifications are trusted within the tenant-set offline trust window, default ' +
      'about 24 hours with a platform ceiling of 72 hours; a tenant may shorten it and never exceed ' +
      'the ceiling. Forced-sync-gated actions do not proceed. No command can arrive, so no hold can ' +
      'be released and no clearance can land.',
    sourceRef: 'L41129',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Reconnect behaviour, and the adopted ordering',
    text:
      'On reconnection the engine both drains the upload queue and pulls pending commands, and it ' +
      'does so in three ordered passes. Pass one: the command manifest is pulled and validated and ' +
      'the stop class is applied at once — suspension in all three states, device de-authorisation ' +
      'and remote wipe, and any tenant compliance stop — after identity, tenant, device, token and ' +
      'suspension-status validation and before any upload. Pass two: the full durable queue uploads ' +
      '— capture events, evidence media, local audit records, and the deviations and holds raised ' +
      'offline — with no capture discarded, delayed indefinitely, or overwritten to make room for a ' +
      'command, and with remote wipe still performing its final sync attempt before erasure. Pass ' +
      'three: the enabling class applies — lot release, reassignment or substitution, qualification ' +
      'clearance, and version change.',
    sourceRef: 'L41131',
    sourceClass: 'Derived Clarification — adopted working position',
    elision:
      'L41131 also carries the DEC-SYNC-001 disagreement in full — the two source readings, the four ' +
      'options considered, the adoption date, the trade-off and where ratification rests. That ' +
      'passage is the decision, and it is disclosed on this panel through the decision disclosure ' +
      'rather than twice, so it is lifted out of this field and not summarised here. The rationale ' +
      'sentence that follows pass three is lifted with it, because it is the argument FOR the ' +
      "adopted option rather than a statement of the field's own behaviour.",
  },
  {
    field: 'Artificial-intelligence behaviour',
    text:
      'Not applicable — no artificial-intelligence capability participates in package delivery, ' +
      'queueing, upload, command application, timestamping, conflict handling, or storage ' +
      'management. This is deliberate: synchronisation decisions must be deterministic and ' +
      "reproducible for an audit, and a model in this path would make the record's completeness a " +
      'probabilistic property.',
    sourceRef: 'L41133',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'No-artificial-intelligence behaviour',
    text: 'Identical. This module is unaffected by any agent outage or emergency pause.',
    sourceRef: 'L41135',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Dependencies',
    text:
      'MOD-FL-A1 for identity-scoped package delivery; MOD-FL-A7 for the encrypted store; all other ' +
      'modules for the data it carries; the platform synchronisation endpoints.',
    sourceRef: 'MOD-FL-A1 · L41137',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Interconnections',
    text:
      'Delivers the package MOD-FL-A3 renders and MOD-FL-A5 enforces. Carries the captures MOD-FL-A4 ' +
      'produces. Carries the commands MOD-FL-B9, MOD-FL-B10, and MOD-FL-B11 act on. Feeds the sync ' +
      'indicator MOD-FL-A2 renders.',
    sourceRef: 'MOD-FL-A3 · L41139',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Audit',
    text:
      'Package staging and verification, queue enqueue and drain, upload attempts and outcomes, ' +
      'command download, validation, application, and acknowledgement, clock-skew detections, ' +
      'eviction events, and version-change adoption are all audited. Queue and ledger operations ' +
      'commit with their audit entries.',
    sourceRef: 'L41150',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Security',
    text:
      "The queue and ledger live inside the application's encrypted store. Commands are validated " +
      'before application, which prevents a spoofed or replayed command from taking effect; a ' +
      'fencing token or equivalent monotonic guard — a marker that lets the receiver reject an ' +
      'instruction from a stale sender, which matters because a delayed command must not undo a ' +
      'newer one, and which belongs in the glossary — is the mechanism by which a superseded command ' +
      'is rejected rather than applied. Minimal on-device scope means the device holds only what the ' +
      "assigned Runs require, never the wider tenant's data, and holds it only briefly.",
    sourceRef: 'L41152',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Fallback identifier',
    text:
      'FB-FL-CORE-01 primary; FB-FL-UP-01 for uploads; FB-FL-CMD-01 for commands; FB-FL-PKG-01 for ' +
      'packages; FB-FL-TIME-01 for skew; FB-FL-STORE-01 for storage; FB-FL-AUTH-01 for trust-window ' +
      'expiry.',
    sourceRef: 'FB-FL-CORE-01 · L41154',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Recovery and reconciliation',
    text:
      'Recovery is reconnection and automatic queue drain. Reconciliation covers three distinct ' +
      'comparisons: expected step executions against received captures per Run, with gaps surfaced; ' +
      'the server command ledger against device acknowledgements, with unacknowledged commands ' +
      'surfaced as propagation lag; and, where a true conflict occurred, the Client Command ' +
      "Center's conflict-review panel, where a Quality Manager resolves and Supervisors view only.",
    sourceRef: 'L41156',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Failure, first fallback, fallback failure, terminal safe state, recovery, reconciliation',
    text:
      'The failure is that synchronisation cannot complete. The first fallback is continued offline ' +
      'operation with durable queues. The fallback failure is trust-window expiry or storage ' +
      'exhaustion. The terminal safe state differs by cause: on trust-window expiry, no new session ' +
      'and no high-risk action, with all data preserved; on storage exhaustion, capture blocked with ' +
      'all data preserved and never eviction of unconfirmed evidence, subject to DEC-STORE-001. ' +
      'Recovery is reconnection. Reconciliation is the three comparisons named above.',
    sourceRef: 'L41239',
    sourceClass: null,
    elision: null,
  },
] as const satisfies readonly A6CardStatement[]

/* ==================================================================== *
 * THE STATES FIELD, AND THE SLICE BOUNDARY RUNNING THROUGH IT.
 *
 * L41112 lists seven and glosses exactly one — `STATE-A6-TRUSTVALID`, "inside
 * the offline trust window". The other six are named and left bare. `gloss` is
 * `null` for those six and the panel says so in plain words rather than
 * inventing six descriptions that would read as transcription.
 *
 * THESE ARE THE MODULE'S STATES, NOT THE CAPTURE LADDER'S. `STATE-A6-
 * INTERRUPTED` is the engine's own interrupted-sync state; `upload-interrupted`
 * in `@/frontline/capture` is one of the thirteen rungs a single capture sits
 * on. Two vocabularies, and this build keeps them apart rather than folding
 * one into the other.
 * ==================================================================== */

export interface A6State {
  readonly id: string
  /** The state's own gloss at L41112, verbatim. `null` where the source gives none. */
  readonly gloss: string | null
  /**
   * Whether THIS build can be driven into the state from the screen. Slice 7
   * drove two and marked the other five stated-only; `offline.ts` drives all
   * seven, and `a6StateReading` is the only place a device situation becomes
   * one. The flag is a declaration and the covering suite proves it by
   * REACHING each state through that resolver, so flipping one without a
   * situation that produces it goes red.
   */
  readonly drivenHere: boolean
  readonly sourceRef: string
}

export const A6_STATES = [
  { id: 'STATE-A6-CONNECTED', gloss: null, drivenHere: true, sourceRef: 'STATE-A6-CONNECTED · L41112' },
  { id: 'STATE-A6-OFFLINE', gloss: null, drivenHere: true, sourceRef: 'STATE-A6-OFFLINE · L41112' },
  { id: 'STATE-A6-SYNCING', gloss: null, drivenHere: true, sourceRef: 'STATE-A6-SYNCING · L41112' },
  { id: 'STATE-A6-INTERRUPTED', gloss: null, drivenHere: true, sourceRef: 'STATE-A6-INTERRUPTED · L41112' },
  {
    id: 'STATE-A6-TRUSTVALID',
    gloss: 'inside the offline trust window',
    drivenHere: true,
    sourceRef: 'STATE-A6-TRUSTVALID · L41112',
  },
  { id: 'STATE-A6-TRUSTEXPIRED', gloss: null, drivenHere: true, sourceRef: 'STATE-A6-TRUSTEXPIRED · L41112' },
  { id: 'STATE-A6-SKEWFLAGGED', gloss: null, drivenHere: true, sourceRef: 'STATE-A6-SKEWFLAGGED · L41112' },
] as const satisfies readonly A6State[]

/**
 * The states this build states rather than drives. Derived, never listed
 * twice. It was five after slice 7 and is EMPTY now, and it is kept rather
 * than deleted because an empty list is the assertion: a state added to the
 * seven, or a state whose resolver branch is lost, lands here where the
 * covering suite is looking.
 */
export const STATES_THIS_SLICE_ONLY_STATES: readonly A6State[] = A6_STATES.filter(
  (s) => !s.drivenHere,
)

/**
 * THE SCOPE BOUNDARY, AS DATA SO IT RENDERS. A claim held in a comment is a
 * code comment; a claim on the screen is a disclosure, and a half-built module
 * that does not say which half is built is the more misleading of the two.
 */
export const A6_SLICE_BOUNDARY = {
  builtHere:
    'This module is built in both halves. The identity, the permission matrix, every refusal the ' +
    'matrix carries and the connected path came first: the sync detail sheet, the manual sync ' +
    'convenience, and the capture states the sheet reports. The offline half followed: all seven ' +
    'states on the four axes they sit on, the platform ceilings on the two bounded tenant settings, ' +
    'the reconnect ladder walked over the thirty-seven-step protocol, package staging and pinning, ' +
    'eviction, conflict routing under the skew guard, and reconciliation.',
  builtLater:
    'Two of the twenty-eight functionalities are still not driven, and neither is an omission. ' +
    'Storage-full behaviour is `Client Decision Required` under DEC-STORE-001 and no implementation ' +
    'may close that silently; concurrent same-record editing is an excluded capability, so there is ' +
    'nothing to run. Both are named on this sheet with the line that says so.',
  whyStatedNow:
    'Because a screen that renders only the connected path implies the safety layer needs a network, ' +
    'and that is the one claim this chapter exists to deny. The offline behaviour is on the card ' +
    'above, in the source’s own words.',
  sourceRef: 'AC-FL-000-4 · L39099',
} as const

/* ==================================================================== *
 * THE CLAIMS THIS MODULE MUST NEVER MAKE, HELD AS DATA SO THEY RENDER.
 *
 * This is the module that renders the sync indicator, and `AC-FL-010-5`
 * (L40049) puts that indicator on every screen of every destination. So it is
 * the module most able to ship a false sync claim on all six destinations at
 * once, which is why the three below are declared rather than assumed.
 * ==================================================================== */

export interface A6NeverClaimed {
  readonly claim: string
  readonly instead: string
  readonly sourceRef: string
}

export const A6_CLAIMS_NEVER_MADE = [
  {
    claim: 'That anything is synced.',
    instead:
      'There is no single state called synced, and no bare success. A capture that is uploaded has ' +
      'not been accepted; a capture that is accepted has not yet been reflected in summaries. Every ' +
      'line on this sheet names a rung of the thirteen-state capture ladder, and the four rungs on ' +
      'which the platform holds no record say so in the same sentence. The label comes from a total ' +
      'record over that ladder, so there is no branch through which a fourteenth word could arrive.',
    sourceRef: 'AC-FL-006-3 · L39636',
  },
  {
    claim: 'That the floor waits for a network.',
    instead:
      'A full Run executes offline from the pinned package and the deterministic safety layer is ' +
      'identical with the network interface disabled. Sync is continuous when connected and is never ' +
      'a worker action; the manual control on this sheet is a convenience and never a dependency, ' +
      'and nothing on this device is gated behind it.',
    sourceRef: 'AC-A6-1 · L41245',
  },
  {
    claim: 'That the worker has anything to resolve, reorder, or attend to.',
    instead:
      'The worker is never presented with a conflict, a queue editor, or a sync obligation. Conflict ' +
      'review lives on the Client Command Center, where a Quality Manager resolves and Supervisors ' +
      'view only; the queue has no editing interface for anyone; and the sheet carries no conflict ' +
      'list and no resolve control.',
    sourceRef: 'AC-A6-11 · L41255',
  },
] as const satisfies readonly A6NeverClaimed[]

/* ==================================================================== *
 * WHERE THIS MODULE SURFACES, AND THE COLLISION SEEN FROM ITS END.
 *
 * `MOD-FL-A6` APPEARS IN NO ROW OF THE SIX-DESTINATION REGISTER. §25.5's
 * Modules column (L48529-L48534) names `MOD-FL-A1`, `MOD-FL-A2`, `MOD-FL-A3`
 * to `A5` with `B8`, `B9` and `B11`, `MOD-FL-B10`, `MOD-FL-B12`, and
 * `MOD-FL-A1` with `MOD-FL-A7`. A6 is in none of them, and this build creates
 * no route for it.
 *
 * IT SURFACES TWICE ALL THE SAME, and both places are stated in the source.
 * `AC-FL-010-5` (L40049) puts the sync indicator on every screen of every
 * destination — persistent chrome, not a destination. And the destination
 * property table's Notifications row (L40035) lists `MOD-FL-B10` and
 * `MOD-FL-A6` together, while §22.7 gives `SCR-FL-06` to the sync detail sheet
 * across "My Runs and Notifications" (L39868). §25.5 gives the same token
 * `SCR-FL-06` to Profile-lite (L48534), which is `RULING-FL-1`'s collision
 * seen from this module's end rather than a new one.
 * ==================================================================== */

export const A6_WHERE_IT_SURFACES = [
  {
    place: 'The sync indicator — persistent chrome on all six destinations.',
    what: 'The sync indicator is present on every screen of every destination.',
    sourceRef: 'AC-FL-010-5 · L40049',
  },
  {
    place: 'The sync detail sheet, on the Notifications and sync inbox destination.',
    what:
      'Cached read-only while offline — back-filled content from the last sync plus live local sync ' +
      'detail',
    sourceRef: 'L40035',
  },
  {
    place: 'The same sheet, as the twenty-three-row register names it.',
    what: 'Sync detail sheet',
    sourceRef: 'SCR-FL-06 · L39868',
  },
] as const satisfies readonly {
  readonly place: string
  readonly what: string
  readonly sourceRef: string
}[]
