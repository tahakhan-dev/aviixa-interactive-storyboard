/**
 * `MOD-FL-A5` — On-Device Detection and Containment. THE IDENTITY CARD,
 * TRANSCRIBED, AND THE STATE VOCABULARY THE CARD ITSELF CARRIES.
 *
 * Frozen source §22.14. Identity card L40898-L40906; the remaining card
 * fields are cited individually below.
 *
 * THE ONE THING A READER OF THIS FILE HAS TO CARRY AWAY. This module is the
 * safety layer, and the slice that builds it is titled "online execution".
 * L40948: "A Severity 1 hold fires immediately, even offline; the lot is
 * protected from the moment of the breach, not from the moment of sync." A
 * screen rendering only the connected path implies the safety layer needs a
 * network, which is the one claim chapter 22 exists to deny — so the offline
 * behaviour is stated on the card NOW, in slice 7, even though slice 8 is
 * what builds the offline simulation. `A5_CLAIMS_NEVER_MADE` below is the
 * standing form of that, and `service.ts` holds it structurally: the
 * containment decision takes no connectivity argument at all.
 *
 * WHAT "TRANSCRIBED" MEANS HERE, EXACTLY. Each statement's `text` is the
 * card field's own prose with the inline `[SoW Fact — §x.y]` classification
 * markers lifted out into `sourceClass`, and nothing else altered — no
 * trimming to fit a card, no paraphrase, no re-ordering. Where a field's
 * prose is long it is carried whole. A claim held in data and never drawn is
 * a code comment rather than a disclosure, so every statement here renders
 * on the panel and the component suite walks this list against the markup.
 */

/** How the source classifies the claim, in the source's own vocabulary. */
export type A5SourceClass =
  | 'SoW Fact'
  | 'Derived Clarification'
  | 'Derived Clarification — adopted working position'

export interface A5CardStatement {
  /** The card field's own label, verbatim. */
  readonly field: string
  readonly text: string
  readonly sourceRef: string
  /**
   * The field's own inline `[SoW Fact — §x.y]` marker, lifted out.
   *
   * `null` WHERE THE CARD CARRIES NO MARKER, and that is a recorded absence
   * rather than a default. Five of the nineteen fields — User benefit,
   * Objects affected, Dependencies, Audit, Fallback identifier — carry no
   * classification marker of their own, and §22.14's Source status paragraph
   * (L41072) does not name them either. Filling those five with `SoW Fact`
   * because their neighbours carry it would be this build inventing a
   * classification the source withheld.
   */
  readonly sourceClass: A5SourceClass | null
  /**
   * What was left out of this field's prose, and where it went instead.
   * `null` where the field is carried whole, which is eighteen of nineteen.
   */
  readonly elision: string | null
}

/**
 * NINETEEN CARD FIELDS. Five of them — Identifier, Purpose, User benefit,
 * Owning surface, Roles that see and use it — are the identity card proper
 * at L40898-L40906, on the alternating text/blank-line rhythm the chapter
 * uses throughout. The other fourteen are the rest of §22.14's card and each
 * carries its own line.
 */
export const A5_CARD = [
  {
    field: 'Identifier and name',
    text: 'MOD-FL-A5. On-Device Detection and Containment.',
    sourceRef: 'MOD-FL-A5 · L40898',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Purpose',
    text:
      'This module is the single most consequential architectural position in the Frontline scope. ' +
      "Its purpose is to make the platform's quality guarantees local, uniform, and beyond the reach " +
      'of configuration, by running the deterministic gates, deviation detection, severity ' +
      'classification, the immediate Severity 1 hold, and pre-authorised containment on the device, ' +
      'offline.',
    sourceRef: 'L40900',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'User benefit',
    text:
      'A worker on an offline floor gets the same protection as one on a connected floor. A quality ' +
      'organisation gets a guarantee that no worker can work past a gate by being out of coverage. A ' +
      'tenant gets a containment response that starts at the moment of the breach rather than at the ' +
      "moment of the supervisor's arrival.",
    sourceRef: 'L40902',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Owning surface',
    text:
      'Frontline Worker Application (SURF-FL). Severity levels are a global catalog defined ' +
      'platform-side; tenant action bundles above the floor are configured in the Delivery Operations ' +
      'Hub tenant administration area; deviation rules, severity mappings, and containment checklists ' +
      'are authored in the Standards and Operations Studio.',
    sourceRef: 'L40904',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Roles that see and use it',
    text:
      'Worker, who experiences the gate, the classification, and the containment checklist. Quality ' +
      'Manager, who alone releases a Severity 1 hold, acting from the Client Command Center. ' +
      'Supervisor, who may request release with a note and who receives escalations.',
    sourceRef: 'L40906',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Preconditions',
    text:
      'An active Run with a verified, version-pinned package carrying the authored specification ' +
      'limits, severity bands, tenant action bundles, gate rules, and containment checklists.',
    sourceRef: 'L40922',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Inputs',
    text:
      'Captured values and their step context; authored specification limits; authored severity ' +
      "mappings; the tenant's configured action bundles as carried in the package; gate rules; timing " +
      'and sequence expectations; evidence requirements; the pre-authorised containment checklist for ' +
      'the classified severity level.',
    sourceRef: 'L40924',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Outputs',
    text:
      'Deterministic results written into the runtime envelope; severity classifications; local hold ' +
      'records with their scope; containment checklist execution records; escalation payloads queued ' +
      'for delivery; deviation-capture screen data where the author routed one.',
    sourceRef: 'L40926',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Objects affected',
    text:
      'OBJ-FL-HOLD the local hold; OBJ-FL-CONTAINMENT the containment execution record; ' +
      'OBJ-FL-DEVIATION the deviation record; and by consequence the Lot, Unit, or Run the hold lands ' +
      'on.',
    sourceRef: 'OBJ-FL-HOLD · L40928',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Online behaviour',
    text:
      'Identical detection, classification, hold placement, and containment launch, plus immediate ' +
      'escalation delivery and, where available, agentic interpretation on the server after the ' +
      'deterministic trigger. Server-side detection atoms mirror and confirm; they are never the ' +
      'trigger.',
    sourceRef: 'L40946',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Offline behaviour',
    text:
      'Identical in every safety respect. Classification happens on-device at the point of capture, ' +
      'mandatory and uniform for every tenant. A Severity 1 hold fires immediately, even offline; the ' +
      'lot is protected from the moment of the breach, not from the moment of sync. Containment ' +
      'launches locally. Only the delivery of the escalation defers.',
    sourceRef: 'L40948',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Reconnect behaviour',
    text:
      'The classification, hold, containment record, and escalation upload. The escalation delivers, ' +
      'late but complete. The hold propagates: sibling devices working the same lot learn of it at ' +
      'their next sync, not instantly. The Client Command Center presents propagation honestly as ' +
      'issued, propagating, in force, and hold-propagation lag is measured as platform telemetry.',
    sourceRef: 'L40950',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Artificial-intelligence behaviour',
    text:
      'No artificial-intelligence model sits in the deviation-triggering path. Detection — timing, ' +
      "sequence, specification, and evidence checks — is rule-based and runs on the worker's device, " +
      'using the limits and severity mappings carried in the version-pinned work package. Agents ' +
      'activate only after a deterministic trigger, to interpret, assemble context, retrieve prior ' +
      'cases, and propose. The Deviation and Containment Agent is an action agent, human-gated where ' +
      'it proposes beyond pre-authorised containment. Artificial intelligence may never classify a ' +
      'deviation, place or release a hold, or alter a limit.',
    sourceRef: 'L40952',
    sourceClass: 'SoW Fact',
    elision:
      'L40952 also carries the Prevention Agent gating contradiction and its adopted position in ' +
      'full. That passage is DEC-GATE-001 and is disclosed on this panel through the decision ' +
      'disclosure rather than twice, so it is lifted out of this field and not summarised here. ' +
      'Every sentence carried above is one of the field\u2019s own [SoW Fact \u2014 \u00a73.2] and ' +
      '[SoW Fact \u2014 \u00a73.7] statements; the lifted passage is the field\u2019s single ' +
      '[Derived Clarification \u2014 adopted working position].',
  },
  {
    field: 'No-artificial-intelligence behaviour',
    text:
      'Fully intact. The safety layer is not configurable, and no platform-level pause of the agentic ' +
      'layer ever suppresses it: pausing, degrading, or stopping agent machinery, for maintenance or ' +
      'by deliberate operator action from the Super Admin platform console, removes coaching and ' +
      'reasoning, never gates, detection, or classification. The deterministic backbone is not agent ' +
      'machinery and has no off switch. The one loss offline is the agent-selected coaching card, and ' +
      "the step's authored Work Instructions are the fallback.",
    sourceRef: 'L40954',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Dependencies',
    text:
      'MOD-FL-A4 for the captured values it evaluates; MOD-FL-A3 for the branch routing it triggers; ' +
      'MOD-FL-A6 for the package that carries its rules and for the queue that carries its ' +
      'escalations; the Standards and Operations Studio for authored limits, mappings, and ' +
      "checklists; the Delivery Operations Hub tenant administration area for the tenant's action " +
      'bundles above the floor.',
    sourceRef: 'MOD-FL-A4 · L40956',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Audit',
    text:
      'Every gate evaluation and its outcome, every deterministic result, every classification with ' +
      'its band and the mapping version that produced it, every hold placement with its scope, every ' +
      'containment checklist item, and every escalation queued and delivered is audited, with the ' +
      'audit entry committing in the same local transaction as the record.',
    sourceRef: 'L40971',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Security',
    text:
      'The safety layer lives in the native execution core and is never delegated to a presentation ' +
      'layer, which means a compromised or substituted rendering layer cannot weaken it. The rules it ' +
      'evaluates arrive in an integrity-verified, version-pinned package, so a tampered package is ' +
      'rejected rather than executed. The layer reads no worker-supplied text as instruction, so no ' +
      'capture can influence its own classification. There is no configuration path, on any surface, ' +
      'at any tier, that can loosen it, and the platform rejects a looser-than-floor value rather ' +
      'than logging it.',
    sourceRef: 'L40973',
    sourceClass: 'SoW Fact',
    elision: null,
  },
  {
    field: 'Fallback identifier',
    text:
      'FB-FL-SEV1-01 primary; FB-FL-CAP-01 where the classification cannot be recorded; FB-FL-AI-01 ' +
      'for the loss of the interpretive layer; FB-FL-PKG-01 where the rules themselves are ' +
      'unavailable.',
    sourceRef: 'FB-FL-SEV1-01 · L40975',
    sourceClass: null,
    elision: null,
  },
  {
    field: 'Recovery and reconciliation',
    text:
      'Recovery from a hold is a Quality Manager release delivered as a lot-release command, applied ' +
      'per device. Recovery from an undelivered escalation is reconnection. Reconciliation is the ' +
      "propagation-lag telemetry plus the Delivery Operations Hub's anomaly register, where the " +
      'anomaly carries an Open to Resolved lifecycle with a closure note, because auditors require ' +
      'evidence of resolution.',
    sourceRef: 'L40977',
    sourceClass: 'SoW Fact',
    elision: null,
  },
] as const satisfies readonly A5CardStatement[]

/* ==================================================================== *
 * THE STATES FIELD, AND THE TRAP INSIDE IT.
 *
 * `STATE-A5-ISSUED`, `STATE-A5-PROPAGATING`, `STATE-A5-INFORCE` and
 * `STATE-A5-RELEASED` are listed together under this module's OWN States
 * field at L40930, which is exactly what makes a device timeline of the four
 * look source-faithful. It is not. L40950 places the sequence on the other
 * side of the boundary: "The Client Command Center presents propagation
 * honestly as issued, propagating, in force". `TEST-STATE-003` (L48065)
 * asserts the Command Center workspace "shows propagating with the per-device
 * list and never in force", and L39707 says why — a release "is complete the
 * moment it is recorded and audited, but its effect on any given device
 * exists only after that device has pulled, validated, and applied it."
 *
 * So `heldByThisDevice` is a field rather than a comment. A pull-based device
 * cannot observe `STATE-A5-PROPAGATING` at all: the state's own gloss says it
 * is "known to the server, not yet applied on every sibling device", and the
 * device is not the server and has no sibling roster. Rendering the four as
 * one device timeline claims knowledge of sibling devices this device has no
 * mechanism to hold.
 *
 * ON THE THREE CONTAINMENT STATES. L40930 names them and gives them no gloss.
 * `gloss` is `null` for exactly those three and the panel says so in plain
 * words rather than inventing three descriptions that would read as
 * transcription.
 * ==================================================================== */

export type A5StateGroup = 'hold' | 'containment'

export interface A5State {
  readonly id: string
  readonly group: A5StateGroup
  /** The state's own gloss at L40930, verbatim. `null` where the source gives none. */
  readonly gloss: string | null
  /** Whether THIS device can observe the state from what it holds. */
  readonly heldByThisDevice: boolean
  readonly sourceRef: string
}

export const A5_STATES = [
  {
    id: 'STATE-A5-ISSUED',
    group: 'hold',
    gloss: 'placed locally at capture',
    heldByThisDevice: true,
    sourceRef: 'STATE-A5-ISSUED · L40930',
  },
  {
    id: 'STATE-A5-PROPAGATING',
    group: 'hold',
    gloss: 'known to the server, not yet applied on every sibling device',
    heldByThisDevice: false,
    sourceRef: 'STATE-A5-PROPAGATING · L40930',
  },
  {
    id: 'STATE-A5-INFORCE',
    group: 'hold',
    gloss: 'applied on a given device',
    heldByThisDevice: true,
    sourceRef: 'STATE-A5-INFORCE · L40930',
  },
  {
    id: 'STATE-A5-RELEASED',
    group: 'hold',
    gloss: 'a Quality Manager release command validated and applied on a given device',
    heldByThisDevice: true,
    sourceRef: 'STATE-A5-RELEASED · L40930',
  },
  {
    id: 'STATE-A5-LAUNCHED',
    group: 'containment',
    gloss: null,
    heldByThisDevice: true,
    sourceRef: 'STATE-A5-LAUNCHED · L40930',
  },
  {
    id: 'STATE-A5-INPROGRESS',
    group: 'containment',
    gloss: null,
    heldByThisDevice: true,
    sourceRef: 'STATE-A5-INPROGRESS · L40930',
  },
  {
    id: 'STATE-A5-COMPLETE',
    group: 'containment',
    gloss: null,
    heldByThisDevice: true,
    sourceRef: 'STATE-A5-COMPLETE · L40930',
  },
] as const satisfies readonly A5State[]

/** The one state of the seven this device cannot observe. Derived, never listed twice. */
export const STATES_THIS_DEVICE_CANNOT_HOLD: readonly A5State[] = A5_STATES.filter(
  (s) => !s.heldByThisDevice,
)

export const PROPAGATION_IS_NOT_A_DEVICE_TIMELINE = {
  claim:
    'This device shows the hold it placed and the hold it has applied. It does not show a fleet ' +
    'timeline, because it has no way to know one: propagating means known to the server and not yet ' +
    'applied on every sibling device, and a pull-based device holds only its own copy. The issued, ' +
    'propagating, in force sequence is the Client Command Center rendering across a fleet.',
  sourceRef: 'TEST-STATE-003 · L48065',
} as const

/* ==================================================================== *
 * THE CLAIMS THIS MODULE MUST NEVER MAKE, HELD AS DATA SO THEY RENDER.
 *
 * Two of the four the surface forbids land on this module specifically, and
 * both are traps whose wrong answer LOOKS like faithfulness to the source.
 * ==================================================================== */

export interface A5NeverClaimed {
  readonly claim: string
  readonly instead: string
  readonly sourceRef: string
}

export const A5_CLAIMS_NEVER_MADE = [
  {
    claim: 'That the safety layer needs a network.',
    instead:
      'Gates, deviation detection, severity classification, the immediate Severity 1 hold and the ' +
      'containment launch all run on the device with no network involvement. A Severity 1 hold fires ' +
      'immediately, even offline; the lot is protected from the moment of the breach, not from the ' +
      'moment of sync. Only the delivery of the escalation defers. Nothing on this panel is drawn ' +
      'behind a connectivity check, and the containment decision in this module takes no connectivity ' +
      'argument at all.',
    sourceRef: 'AC-FL-000-4 · L39099',
  },
  {
    claim: 'That this device knows what the rest of the floor knows about a hold.',
    instead:
      'Sibling devices working the same lot learn of the hold at their next sync, not instantly. This ' +
      'device renders its own copy and says plainly that the rest converges later. The issued, ' +
      'propagating, in force sequence is a Client Command Center rendering across a fleet.',
    sourceRef: 'TEST-STATE-003 · L48065',
  },
] as const satisfies readonly A5NeverClaimed[]

/**
 * The strongest sentence in this module's permission matrix, and the reason
 * it needs a home outside a cell.
 *
 * It is written in the Read-only Auditor cell of row 9 (L40920) and it is not
 * about auditors: "and no platform console role can do it either; the
 * deterministic backbone has no off switch." Platform roles have no column on
 * this matrix — the five are Worker, Supervisor, Quality Manager, Tenant
 * Admin, Read-only Auditor — so a per-column fold renders the sentence under
 * the narrowest persona on the surface and the claim about the whole platform
 * is lost. The panel renders it at row level, from here.
 */
export const NO_OFF_SWITCH = {
  text:
    'and no platform console role can do it either; the deterministic backbone has no off switch',
  whyOutsideTheCell:
    'The sentence is written in the Read-only Auditor cell and makes a claim about platform console ' +
    'roles, which have no column on this matrix. Rendered per column it would sit under the narrowest ' +
    'persona on the surface.',
  corroboration:
    'Roles prohibited: nobody may pause the deterministic backbone, which has no off switch.',
  sourceRef: 'L40920',
  corroborationRef: 'FUNC-A5-04-1-2 · L41010',
} as const
