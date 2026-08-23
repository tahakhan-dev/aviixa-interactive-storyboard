/**
 * THE ARTIFICIAL-INTELLIGENCE ABILITY REGISTER, FOR EVERY SURFACE.
 *
 * §40.16 is the safety register for the artificial-intelligence layer, and
 * L87914 states what it is for: "Every ability is listed with its full
 * authority profile so that a reviewer can answer, for any ability, the
 * question". This module is that register as data. It computes nothing and
 * decides nothing.
 *
 * ── TWO AXES, AND THEY ARE NOT THE SAME NUMBER ─────────────────────────────
 * The abilities are one axis: `AI-01` upward, one paragraph each. The
 * attributes are another: the preamble at L87920 declares them as a
 * semicolon-separated list, and `TEST-AI-016-A` (L88013) walks "the fourteen
 * attributes" of every ability. Nothing in the source disagrees with itself
 * here — there is no discrepancy to report — but the two sizes are close
 * enough that an implementer reading fast writes one where the other belongs.
 * Neither is written down here. `tests/unit/ai-abilities.test.ts` measures
 * both off the frozen bytes and asserts they DIFFER, which is the only claim
 * about them that a reader could act on.
 *
 * ── WHY EVERY VALUE IS STORED WHOLE ────────────────────────────────────────
 * The dispatch for this file says that the costliest brief error this build
 * produced dropped a third of one sentence. A value quoted short is the worst
 * shape available in a safety register: it still reads as a complete
 * statement, it still passes a `includes()` check against its own source
 * line, and it silently changes what the platform claims an agent may do. So
 * the covering test does not check that a stored value is FOUND in the line —
 * any prefix of it would pass that. It re-parses the paragraph at run time and
 * compares the whole ordered run, label by label and value by value.
 *
 * Three values recur across later slices and are the ones most likely to be
 * clipped: `AI-01`'s human approval, which carries the `DEC-GATE-001`
 * disagreement in its own tail; `AI-04`'s validation gate, whose final clause
 * is the REASON the launch is on-device; and `AI-07`'s expiry, which is not
 * an expiry at all — the item ages and re-routes. Each has its own named test.
 *
 * ── THE ATTRIBUTE LABEL IS NOT THE ATTRIBUTE ───────────────────────────────
 * The eleventh attribute is written `*Rollback or compensation:*` in three
 * paragraphs and `*Rollback:*` in the rest. Both are the source's own words
 * for one attribute, so the label is stored per ability, verbatim, alongside
 * the canonical name — the same alias treatment `src/ai/agents/roster.ts`
 * gives the governance-binding spellings, and for the same reason: a check
 * written against either literal fails on the other, and normalising one away
 * would make the register's own words wrong on nine paragraphs.
 *
 * ── AI-13 IS AN ABSENCE, AND AN ABSENCE RENDERS AS ONE ─────────────────────
 * Its paragraph states that the requesting role "and all other attributes"
 * are not specified, names the five attributes that ARE fixed, and points at
 * `DEC-VISION-001`. So its fourteen attributes each carry the source's own
 * literal rather than an empty string, which is exactly what `TEST-AI-016-A`
 * asks for; and the record additionally carries the five fixed attributes,
 * the reason, `SB-AI-006`'s rendering ruling, and every open vision decision.
 *
 * `SB-AI-006` (L86781) forbids the platform to display a greyed-out "coming
 * soon" agent, because the agent activity panel's contract is per-agent live
 * status for deployed agents. A surface reading this record therefore has
 * everything it needs to render a stated absence and nothing it could mistake
 * for a disabled control.
 *
 * THE DEC-VISION ROWS ARE TWO LINES LOWER THAN THE DISPATCH SAID, AND THEY
 * ARE IN THREE TABLES. The brief located them at L95384-L95389; L95384 is
 * "| `DEC-HANDOFF-003` | What counts as material late data requiring a revised
 * brief? | 44.3 | Client Decision Required |". Chapter 40's new-decision
 * register raises `DEC-VISION-001` alone, chapter 44A's register raises all
 * six, and an appendix index lists six again as occurrence counts. What is
 * stored below is the register that raises the whole set, and the covering
 * test finds it by taking the longest contiguous run rather than by trusting
 * any line number written here.
 */

/* ==================================================================== *
 * THE ATTRIBUTE AXIS — the register's own preamble.
 * ==================================================================== */

export type AbilityAttributeName =
  | 'requestingRole'
  | 'effectiveRoleAndScope'
  | 'objectsAffected'
  | 'inputEvidence'
  | 'draftsRecommendsOrExecutes'
  | 'humanApproval'
  | 'policyConditions'
  | 'validationGates'
  | 'idempotency'
  | 'expiry'
  | 'rollbackOrCompensation'
  | 'audit'
  | 'manualAlternative'
  | 'safeStop'

export interface AbilityAttributeDefinition {
  readonly name: AbilityAttributeName
  /** The preamble's own words for this attribute, verbatim and in its order. */
  readonly preambleWording: string
}

/** The line the attribute axis is declared on, and nothing else is claimed of it. */
export const ABILITY_ATTRIBUTE_PREAMBLE_REF = 'L87920'

export const ABILITY_ATTRIBUTES = [
  { name: 'requestingRole', preambleWording: 'requesting role' },
  { name: 'effectiveRoleAndScope', preambleWording: 'effective role and scope' },
  { name: 'objectsAffected', preambleWording: 'objects affected' },
  { name: 'inputEvidence', preambleWording: 'input evidence' },
  {
    name: 'draftsRecommendsOrExecutes',
    preambleWording: 'whether it drafts, recommends or executes',
  },
  { name: 'humanApproval', preambleWording: 'human approval' },
  { name: 'policyConditions', preambleWording: 'policy conditions' },
  { name: 'validationGates', preambleWording: 'validation gates' },
  { name: 'idempotency', preambleWording: 'idempotency' },
  { name: 'expiry', preambleWording: 'expiry' },
  { name: 'rollbackOrCompensation', preambleWording: 'rollback or compensation' },
  { name: 'audit', preambleWording: 'audit' },
  { name: 'manualAlternative', preambleWording: 'manual alternative' },
  { name: 'safeStop', preambleWording: 'safe-stop behaviour' },
] as const satisfies readonly AbilityAttributeDefinition[]

type MissingFromAttributes = Exclude<
  AbilityAttributeName,
  (typeof ABILITY_ATTRIBUTES)[number]['name']
>
const _attributesExhaustive: MissingFromAttributes extends never ? true : never = true
void _attributesExhaustive

/* ==================================================================== *
 * THE ABILITY AXIS.
 * ==================================================================== */

export type AiAbilityId =
  | 'AI-01'
  | 'AI-02'
  | 'AI-03'
  | 'AI-04'
  | 'AI-05'
  | 'AI-06'
  | 'AI-07'
  | 'AI-08'
  | 'AI-09'
  | 'AI-10'
  | 'AI-11'
  | 'AI-12'
  | 'AI-13'

export const AI_ABILITY_IDS = [
  'AI-01',
  'AI-02',
  'AI-03',
  'AI-04',
  'AI-05',
  'AI-06',
  'AI-07',
  'AI-08',
  'AI-09',
  'AI-10',
  'AI-11',
  'AI-12',
  'AI-13',
] as const satisfies readonly AiAbilityId[]

type MissingFromIds = Exclude<AiAbilityId, (typeof AI_ABILITY_IDS)[number]>
const _idsExhaustive: MissingFromIds extends never ? true : never = true
void _idsExhaustive

export interface AbilityAttributeValue {
  readonly attribute: AbilityAttributeName
  /**
   * This paragraph's own label for the attribute, verbatim. Stored per
   * ability because the source writes the eleventh two ways and both are its
   * own words.
   */
  readonly label: string
  /** The value, whole. Never a summary and never a leading clause. */
  readonly value: string
}

export interface AbilityOpenDecision {
  readonly id: string
  /** The register row that raises it. */
  readonly sourceRef: string
}

/**
 * The shape of an ability the Statement of Work does not specify. Present on
 * exactly one record; `null` everywhere else, so a consumer cannot mistake a
 * stated absence for a field nobody filled in.
 */
export interface AbilityNotSpecified {
  /** The literal `TEST-AI-016-A` asks for where an attribute is unstated. */
  readonly literal: string
  /** The single collective label the paragraph uses in place of fourteen. */
  readonly collectiveLabel: string
  /** Why it is unspecified, in the source's words. */
  readonly reason: string
  /** The source's own lead-in to the fixed attributes. */
  readonly fixedAttributesLead: string
  /** The attributes that ARE fixed, verbatim, in the source's order. */
  readonly fixedAttributes: readonly string[]
  /** `SB-AI-006`'s ruling on how this absence may be rendered, verbatim. */
  readonly renderingRule: string
  readonly renderingRuleRef: string
  /** Every open decision the source raises about this ability. */
  readonly openDecisions: readonly AbilityOpenDecision[]
}

export interface AiAbility {
  readonly id: AiAbilityId
  /** The paragraph's own heading, verbatim, without its trailing stop. */
  readonly title: string
  /** The full attribute axis, in the preamble's order, always complete. */
  readonly attributes: readonly AbilityAttributeValue[]
  readonly notSpecified: AbilityNotSpecified | null
  /** The paragraph this record transcribes. */
  readonly sourceRef: string
}

export const AI_ABILITY_REGISTER = [
  {
    id: "AI-01",
    title: "Real-time coaching selection and delivery",
    sourceRef: "L87922",
    attributes: [
      {
        attribute: "requestingRole",
        label: "Requesting role",
        value:
          "none; deterministic timing trigger.",
      },
      {
        attribute: "effectiveRoleAndScope",
        label: "Effective role and scope",
        value:
          "non-human identity, scoped to the tenant, run, screen and worker of the trigger.",
      },
      {
        attribute: "objectsAffected",
        label: "Objects affected",
        value:
          "the coaching card presented to the worker; the intervention record; episodic memory.",
      },
      {
        attribute: "inputEvidence",
        label: "Input evidence",
        value:
          "timing signal, difficulty type, screen classification, worker locale, approved corpus.",
      },
      {
        attribute: "draftsRecommendsOrExecutes",
        label: "Drafts, recommends or executes",
        value:
          "executes a delivery, drawn only from approved content.",
      },
      {
        attribute: "humanApproval",
        label: "Human approval",
        value:
          "governance binding `authoring-time policy` — the approval is at authoring and there is no per-event runtime gate; the source disagreement stays on the record in `DEC-GATE-001`.",
      },
      {
        attribute: "policyConditions",
        label: "Policy conditions",
        value:
          "the timing threshold, coaching content and corpus curation were approved at authoring.",
      },
      {
        attribute: "validationGates",
        label: "Validation gates",
        value:
          "metadata filter before semantic ranking; locale must match an authored variant.",
      },
      {
        attribute: "idempotency",
        label: "Idempotency",
        value:
          "delivering the same asset twice for the same trigger must not create two intervention records; keyed by trigger identifier.",
      },
      {
        attribute: "expiry",
        label: "Expiry",
        value:
          "the trigger is stale once the screen completes; a delivery must not arrive after screen completion.",
      },
      {
        attribute: "rollbackOrCompensation",
        label: "Rollback or compensation",
        value:
          "none needed — a dismissed card leaves no state; the intervention record is append-only.",
      },
      {
        attribute: "audit",
        label: "Audit",
        value:
          "every intervention logged; dismissals recorded.",
      },
      {
        attribute: "manualAlternative",
        label: "Manual alternative",
        value:
          "the worker asks a supervisor, and the work instruction itself remains available at the authored difficulty level.",
      },
      {
        attribute: "safeStop",
        label: "Safe-stop",
        value:
          "no coaching, screen proceeds under deterministic control.",
      },
    ],
    notSpecified: null,
  },
  {
    id: "AI-02",
    title: "Deviation brief assembly",
    sourceRef: "L87924",
    attributes: [
      {
        attribute: "requestingRole",
        label: "Requesting role",
        value:
          "none; deterministic deviation trigger. Supervisor and above may request an agent re-check, action number nine.",
      },
      {
        attribute: "effectiveRoleAndScope",
        label: "Effective role and scope",
        value:
          "tenant, deviation, lot, unit or run.",
      },
      {
        attribute: "objectsAffected",
        label: "Objects affected",
        value:
          "the deviation record; the brief; episodic memory.",
      },
      {
        attribute: "inputEvidence",
        label: "Input evidence",
        value:
          "deviation detail, lot scope, worker history, equipment status, prior cases, containment checklist, evidence gap.",
      },
      {
        attribute: "draftsRecommendsOrExecutes",
        label: "Drafts, recommends or executes",
        value:
          "drafts an artifact and executes pre-authorised policy steps.",
      },
      {
        attribute: "humanApproval",
        label: "Human approval",
        value:
          "none for policy steps; required for anything beyond policy.",
      },
      {
        attribute: "policyConditions",
        label: "Policy conditions",
        value:
          "the checklist and routing were chosen by the quality engineer.",
      },
      {
        attribute: "validationGates",
        label: "Validation gates",
        value:
          "the trigger must exist; the severity value is read, never written.",
      },
      {
        attribute: "idempotency",
        label: "Idempotency",
        value:
          "one brief per deviation; re-check produces a revision, not a duplicate.",
      },
      {
        attribute: "expiry",
        label: "Expiry",
        value:
          "a brief for a finished run record is a late artifact and must be marked late.",
      },
      {
        attribute: "rollbackOrCompensation",
        label: "Rollback or compensation",
        value:
          "a superseded brief is retained; briefs are append-only.",
      },
      {
        attribute: "audit",
        label: "Audit",
        value:
          "full.",
      },
      {
        attribute: "manualAlternative",
        label: "Manual alternative",
        value:
          "the deviation workspace and the Studio checklist library.",
      },
      {
        attribute: "safeStop",
        label: "Safe-stop",
        value:
          "raw deviation record plus checklist reference; escalation still fires because it is a Hub function.",
      },
    ],
    notSpecified: null,
  },
  {
    id: "AI-03",
    title: "Prior-case retrieval",
    sourceRef: "L87926",
    attributes: [
      {
        attribute: "requestingRole",
        label: "Requesting role",
        value:
          "none; invoked within `AI-02` and `AI-08`.",
      },
      {
        attribute: "effectiveRoleAndScope",
        label: "Effective role and scope",
        value:
          "tenant episodic memory only.",
      },
      {
        attribute: "objectsAffected",
        label: "Objects affected",
        value:
          "none; read-only.",
      },
      {
        attribute: "inputEvidence",
        label: "Input evidence",
        value:
          "the current deviation and its context.",
      },
      {
        attribute: "draftsRecommendsOrExecutes",
        label: "Drafts, recommends or executes",
        value:
          "recommends.",
      },
      {
        attribute: "humanApproval",
        label: "Human approval",
        value:
          "not applicable — read-only retrieval changes nothing.",
      },
      {
        attribute: "policyConditions",
        label: "Policy conditions",
        value:
          "tenant isolation.",
      },
      {
        attribute: "validationGates",
        label: "Validation gates",
        value:
          "tenant partition assertion on every query.",
      },
      {
        attribute: "idempotency",
        label: "Idempotency",
        value:
          "naturally idempotent.",
      },
      {
        attribute: "expiry",
        label: "Expiry",
        value:
          "not applicable — no action results.",
      },
      {
        attribute: "rollbackOrCompensation",
        label: "Rollback",
        value:
          "not applicable — no state change.",
      },
      {
        attribute: "audit",
        label: "Audit",
        value:
          "the evidence list records which cases were surfaced.",
      },
      {
        attribute: "manualAlternative",
        label: "Manual alternative",
        value:
          "the Quality Manager searches the deviation history in the Hub.",
      },
      {
        attribute: "safeStop",
        label: "Safe-stop",
        value:
          "the brief states that no comparable prior cases were available.",
      },
    ],
    notSpecified: null,
  },
  {
    id: "AI-04",
    title: "Containment checklist launch, performed on the device",
    sourceRef: "L87928",
    attributes: [
      {
        attribute: "requestingRole",
        label: "Requesting role",
        value:
          "none; follows classification.",
      },
      {
        attribute: "effectiveRoleAndScope",
        label: "Effective role and scope",
        value:
          "the run, unit or lot in scope.",
      },
      {
        attribute: "objectsAffected",
        label: "Objects affected",
        value:
          "the containment record.",
      },
      {
        attribute: "inputEvidence",
        label: "Input evidence",
        value:
          "the severity band and the configured checklist reference.",
      },
      {
        attribute: "draftsRecommendsOrExecutes",
        label: "Drafts, recommends or executes",
        value:
          "the device executes the launch locally from the version-pinned work package under pre-authorised policy; no agent triggers it, and the Deviation and Containment Agent's part is the server-side mirror and the enrichment of the brief, per the adopted working position of `DEC-CONTLAUNCH-001`.",
      },
      {
        attribute: "humanApproval",
        label: "Human approval",
        value:
          "pre-authorised at authoring; no per-event gate.",
      },
      {
        attribute: "policyConditions",
        label: "Policy conditions",
        value:
          "the checklist was selected by the quality engineer and is tagged by severity applicability.",
      },
      {
        attribute: "validationGates",
        label: "Validation gates",
        value:
          "the checklist must be published and applicable to the classified severity, and every step must be fully renderable from the work package with no server call, because a step that requires a server lookup cannot be a launch-time step.",
      },
      {
        attribute: "idempotency",
        label: "Idempotency",
        value:
          "one launch per classification event.",
      },
      {
        attribute: "expiry",
        label: "Expiry",
        value:
          "not applicable — the checklist is launched at classification and completed by a human.",
      },
      {
        attribute: "rollbackOrCompensation",
        label: "Rollback",
        value:
          "not applicable — a completed containment record is evidence and is immutable.",
      },
      {
        attribute: "audit",
        label: "Audit",
        value:
          "full.",
      },
      {
        attribute: "manualAlternative",
        label: "Manual alternative",
        value:
          "the supervisor opens the checklist from the Studio library.",
      },
      {
        attribute: "safeStop",
        label: "Safe-stop",
        value:
          "the on-device pre-authorised checklist launches locally and offline regardless of agent availability.",
      },
    ],
    notSpecified: null,
  },
  {
    id: "AI-05",
    title: "Escalation routing execution",
    sourceRef: "L87930",
    attributes: [
      {
        attribute: "requestingRole",
        label: "Requesting role",
        value:
          "none.",
      },
      {
        attribute: "effectiveRoleAndScope",
        label: "Effective role and scope",
        value:
          "tenant, severity band.",
      },
      {
        attribute: "objectsAffected",
        label: "Objects affected",
        value:
          "notification records.",
      },
      {
        attribute: "inputEvidence",
        label: "Input evidence",
        value:
          "the referenced routing template.",
      },
      {
        attribute: "draftsRecommendsOrExecutes",
        label: "Drafts, recommends or executes",
        value:
          "executes under pre-authorised policy.",
      },
      {
        attribute: "humanApproval",
        label: "Human approval",
        value:
          "pre-authorised.",
      },
      {
        attribute: "policyConditions",
        label: "Policy conditions",
        value:
          "recipient roles never individuals; acknowledgement timers and fallback tiers per the template.",
      },
      {
        attribute: "validationGates",
        label: "Validation gates",
        value:
          "role-to-person resolution against people on shift.",
      },
      {
        attribute: "idempotency",
        label: "Idempotency",
        value:
          "de-duplication is a stated property of escalation routing.",
      },
      {
        attribute: "expiry",
        label: "Expiry",
        value:
          "re-notification at 4 hours, or 1 hour in Regulated-Industry mode.",
      },
      {
        attribute: "rollbackOrCompensation",
        label: "Rollback",
        value:
          "not applicable — a delivered notification is a record.",
      },
      {
        attribute: "audit",
        label: "Audit",
        value:
          "full, with fallback deliveries visibly marked.",
      },
      {
        attribute: "manualAlternative",
        label: "Manual alternative",
        value:
          "the Hub's escalation service, which is not an agent function.",
      },
      {
        attribute: "safeStop",
        label: "Safe-stop",
        value:
          "escalation continues without the agent.",
      },
    ],
    notSpecified: null,
  },
  {
    id: "AI-06",
    title: "Evidence-gap identification",
    sourceRef: "L87932",
    attributes: [
      {
        attribute: "requestingRole",
        label: "Requesting role",
        value:
          "none.",
      },
      {
        attribute: "effectiveRoleAndScope",
        label: "Effective role and scope",
        value:
          "the deviation.",
      },
      {
        attribute: "objectsAffected",
        label: "Objects affected",
        value:
          "the brief.",
      },
      {
        attribute: "inputEvidence",
        label: "Input evidence",
        value:
          "the screen's gate-and-proof configuration against captured evidence.",
      },
      {
        attribute: "draftsRecommendsOrExecutes",
        label: "Drafts, recommends or executes",
        value:
          "recommends.",
      },
      {
        attribute: "humanApproval",
        label: "Human approval",
        value:
          "not applicable — it names a gap and changes nothing.",
      },
      {
        attribute: "policyConditions",
        label: "Policy conditions",
        value:
          "none beyond the screen configuration.",
      },
      {
        attribute: "validationGates",
        label: "Validation gates",
        value:
          "none needed.",
      },
      {
        attribute: "idempotency",
        label: "Idempotency",
        value:
          "naturally idempotent.",
      },
      {
        attribute: "expiry",
        label: "Expiry",
        value:
          "not applicable.",
      },
      {
        attribute: "rollbackOrCompensation",
        label: "Rollback",
        value:
          "not applicable.",
      },
      {
        attribute: "audit",
        label: "Audit",
        value:
          "part of the brief record.",
      },
      {
        attribute: "manualAlternative",
        label: "Manual alternative",
        value:
          "the supervisor compares evidence against the screen requirements.",
      },
      {
        attribute: "safeStop",
        label: "Safe-stop",
        value:
          "the gap is not named; the requirement is still visible on the record.",
      },
    ],
    notSpecified: null,
  },
  {
    id: "AI-07",
    title: "Beyond-policy containment proposal",
    sourceRef: "L87934",
    attributes: [
      {
        attribute: "requestingRole",
        label: "Requesting role",
        value:
          "none; the agent proposes.",
      },
      {
        attribute: "effectiveRoleAndScope",
        label: "Effective role and scope",
        value:
          "the proposed scope, which the human may adjust.",
      },
      {
        attribute: "objectsAffected",
        label: "Objects affected",
        value:
          "on approval, the containment scope.",
      },
      {
        attribute: "inputEvidence",
        label: "Input evidence",
        value:
          "prior cases, shared-lot linkage, the deviation.",
      },
      {
        attribute: "draftsRecommendsOrExecutes",
        label: "Drafts, recommends or executes",
        value:
          "drafts a proposal; executes only after approval.",
      },
      {
        attribute: "humanApproval",
        label: "Human approval",
        value:
          "required, Quality Manager and above, in the Command Center gate queue.",
      },
      {
        attribute: "policyConditions",
        label: "Policy conditions",
        value:
          "the proposal must lead with scope of impact.",
      },
      {
        attribute: "validationGates",
        label: "Validation gates",
        value:
          "window of 10 minutes at Severity 1, 30 minutes otherwise; re-route on elapse; never executes on its own.",
      },
      {
        attribute: "idempotency",
        label: "Idempotency",
        value:
          "one gate item per proposal; approval executes once.",
      },
      {
        attribute: "expiry",
        label: "Expiry",
        value:
          "the item never expires; it ages and re-routes.",
      },
      {
        attribute: "rollbackOrCompensation",
        label: "Rollback or compensation",
        value:
          "an over-broad approved containment is narrowed by a further human decision, recorded; the original is not erased.",
      },
      {
        attribute: "audit",
        label: "Audit",
        value:
          "decision, adjustment, evidence basis and note.",
      },
      {
        attribute: "manualAlternative",
        label: "Manual alternative",
        value:
          "the Quality Manager extends containment directly.",
      },
      {
        attribute: "safeStop",
        label: "Safe-stop",
        value:
          "the proposal remains undecided; the pre-authorised containment stands.",
      },
    ],
    notSpecified: null,
  },
  {
    id: "AI-08",
    title: "Shift handoff brief",
    sourceRef: "L87936",
    attributes: [
      {
        attribute: "requestingRole",
        label: "Requesting role",
        value:
          "none; scheduled.",
      },
      {
        attribute: "effectiveRoleAndScope",
        label: "Effective role and scope",
        value:
          "tenant, site, shift.",
      },
      {
        attribute: "objectsAffected",
        label: "Objects affected",
        value:
          "the brief record.",
      },
      {
        attribute: "inputEvidence",
        label: "Input evidence",
        value:
          "the shift's deviations, coaching events, gate outcomes, qualification requirements, lot and equipment status.",
      },
      {
        attribute: "draftsRecommendsOrExecutes",
        label: "Drafts, recommends or executes",
        value:
          "drafts an artifact only.",
      },
      {
        attribute: "humanApproval",
        label: "Human approval",
        value:
          "none; reasoning agent.",
      },
      {
        attribute: "policyConditions",
        label: "Policy conditions",
        value:
          "visibility restrictions by audience.",
      },
      {
        attribute: "validationGates",
        label: "Validation gates",
        value:
          "readiness derived only from the qualification record.",
      },
      {
        attribute: "idempotency",
        label: "Idempotency",
        value:
          "one brief per shift boundary; a regeneration supersedes and is marked.",
      },
      {
        attribute: "expiry",
        label: "Expiry",
        value:
          "a brief generated after shift start states its generation time.",
      },
      {
        attribute: "rollbackOrCompensation",
        label: "Rollback",
        value:
          "not applicable — superseded briefs are retained.",
      },
      {
        attribute: "audit",
        label: "Audit",
        value:
          "brief, delivery, acknowledgement, annotation.",
      },
      {
        attribute: "manualAlternative",
        label: "Manual alternative",
        value:
          "the live shift board and open-deviation list.",
      },
      {
        attribute: "safeStop",
        label: "Safe-stop",
        value:
          "explicit no-brief record.",
      },
    ],
    notSpecified: null,
  },
  {
    id: "AI-09",
    title: "Emerging-pattern watch item",
    sourceRef: "L87938",
    attributes: [
      {
        attribute: "requestingRole",
        label: "Requesting role",
        value:
          "none.",
      },
      {
        attribute: "effectiveRoleAndScope",
        label: "Effective role and scope",
        value:
          "tenant, shift.",
      },
      {
        attribute: "objectsAffected",
        label: "Objects affected",
        value:
          "the Studio authoring queue entry.",
      },
      {
        attribute: "inputEvidence",
        label: "Input evidence",
        value:
          "statistical computation over shift events.",
      },
      {
        attribute: "draftsRecommendsOrExecutes",
        label: "Drafts, recommends or executes",
        value:
          "recommends to authors.",
      },
      {
        attribute: "humanApproval",
        label: "Human approval",
        value:
          "not applicable — it changes nothing; any resulting change travels the Studio approval chain.",
      },
      {
        attribute: "policyConditions",
        label: "Policy conditions",
        value:
          "supervisors and above only; never workers.",
      },
      {
        attribute: "validationGates",
        label: "Validation gates",
        value:
          "none needed.",
      },
      {
        attribute: "idempotency",
        label: "Idempotency",
        value:
          "one watch item per pattern per shift.",
      },
      {
        attribute: "expiry",
        label: "Expiry",
        value:
          "not stated; a watch item is an authoring candidate and ages with the authoring backlog.",
      },
      {
        attribute: "rollbackOrCompensation",
        label: "Rollback",
        value:
          "not applicable.",
      },
      {
        attribute: "audit",
        label: "Audit",
        value:
          "recorded.",
      },
      {
        attribute: "manualAlternative",
        label: "Manual alternative",
        value:
          "the quality engineer reviews screen-level statistics.",
      },
      {
        attribute: "safeStop",
        label: "Safe-stop",
        value:
          "no watch item.",
      },
    ],
    notSpecified: null,
  },
  {
    id: "AI-10",
    title: "Lane B proposal drafting",
    sourceRef: "L87940",
    attributes: [
      {
        attribute: "requestingRole",
        label: "Requesting role",
        value:
          "none.",
      },
      {
        attribute: "effectiveRoleAndScope",
        label: "Effective role and scope",
        value:
          "tenant, the configured object.",
      },
      {
        attribute: "objectsAffected",
        label: "Objects affected",
        value:
          "on approval, a configured value and, for package-borne values, a published patch version.",
      },
      {
        attribute: "inputEvidence",
        label: "Input evidence",
        value:
          "activations, outcomes, sample size, scope of impact.",
      },
      {
        attribute: "draftsRecommendsOrExecutes",
        label: "Drafts, recommends or executes",
        value:
          "drafts a proposal; never executes.",
      },
      {
        attribute: "humanApproval",
        label: "Human approval",
        value:
          "required, Quality Manager and above, exactly once.",
      },
      {
        attribute: "policyConditions",
        label: "Policy conditions",
        value:
          "value-level changes only; never content, wording or composition.",
      },
      {
        attribute: "validationGates",
        label: "Validation gates",
        value:
          "the proposed value must lie within the platform's floors and ceilings — the register rejects a looser-than-floor value rather than logging it.",
      },
      {
        attribute: "idempotency",
        label: "Idempotency",
        value:
          "one proposal per pattern; a re-proposal after a decline is a distinct record and the pattern is proposed less.",
      },
      {
        attribute: "expiry",
        label: "Expiry",
        value:
          "never expires; ages with a 30-day stale flag.",
      },
      {
        attribute: "rollbackOrCompensation",
        label: "Rollback",
        value:
          "a subsequent human decision or authored version; the change log carries the prior value.",
      },
      {
        attribute: "audit",
        label: "Audit",
        value:
          "end to end, proposal to in-force per device.",
      },
      {
        attribute: "manualAlternative",
        label: "Manual alternative",
        value:
          "the quality engineer edits the value in the Studio and republishes.",
      },
      {
        attribute: "safeStop",
        label: "Safe-stop",
        value:
          "the proposal remains undecided and the existing human-authored value stays in force.",
      },
    ],
    notSpecified: null,
  },
  {
    id: "AI-11",
    title: "Work-instruction difficulty-level drafting",
    sourceRef: "L87942",
    attributes: [
      {
        attribute: "requestingRole",
        label: "Requesting role",
        value:
          "the author, in the Studio.",
      },
      {
        attribute: "effectiveRoleAndScope",
        label: "Effective role and scope",
        value:
          "the workflow being authored.",
      },
      {
        attribute: "objectsAffected",
        label: "Objects affected",
        value:
          "draft instruction content at the two levels the author did not write.",
      },
      {
        attribute: "inputEvidence",
        label: "Input evidence",
        value:
          "the author's written level.",
      },
      {
        attribute: "draftsRecommendsOrExecutes",
        label: "Drafts, recommends or executes",
        value:
          "drafts only.",
      },
      {
        attribute: "humanApproval",
        label: "Human approval",
        value:
          "required — every drafted level passes the full review chain before publication.",
      },
      {
        attribute: "policyConditions",
        label: "Policy conditions",
        value:
          "three levels exist: simple, standard, expanded; the author writes one.",
      },
      {
        attribute: "validationGates",
        label: "Validation gates",
        value:
          "Author, Reviewer, Release Authority; the locale-completeness check blocks publication in an incomplete locale.",
      },
      {
        attribute: "idempotency",
        label: "Idempotency",
        value:
          "re-drafting replaces a draft, never a published version.",
      },
      {
        attribute: "expiry",
        label: "Expiry",
        value:
          "a draft has no runtime effect and therefore no expiry consequence.",
      },
      {
        attribute: "rollbackOrCompensation",
        label: "Rollback",
        value:
          "discard the draft; published levels roll back only by republication.",
      },
      {
        attribute: "audit",
        label: "Audit",
        value:
          "the Studio change log and approval chain.",
      },
      {
        attribute: "manualAlternative",
        label: "Manual alternative",
        value:
          "the author writes all three levels.",
      },
      {
        attribute: "safeStop",
        label: "Safe-stop",
        value:
          "the author writes the remaining levels by hand; publication is blocked until all required content exists.",
      },
    ],
    notSpecified: null,
  },
  {
    id: "AI-12",
    title: "Agent re-check on request",
    sourceRef: "L87944",
    attributes: [
      {
        attribute: "requestingRole",
        label: "Requesting role",
        value:
          "Supervisor and above, Command Center action number nine.",
      },
      {
        attribute: "effectiveRoleAndScope",
        label: "Effective role and scope",
        value:
          "the run or deviation in question.",
      },
      {
        attribute: "objectsAffected",
        label: "Objects affected",
        value:
          "a revised artifact.",
      },
      {
        attribute: "inputEvidence",
        label: "Input evidence",
        value:
          "the existing record.",
      },
      {
        attribute: "draftsRecommendsOrExecutes",
        label: "Drafts, recommends or executes",
        value:
          "re-runs the rule-based evaluation and re-drafts.",
      },
      {
        attribute: "humanApproval",
        label: "Human approval",
        value:
          "not applicable — a re-check produces an artifact, not an effect.",
      },
      {
        attribute: "policyConditions",
        label: "Policy conditions",
        value:
          "the re-check re-runs rule-based evaluation; it does not re-decide severity, which is fixed at capture.",
      },
      {
        attribute: "validationGates",
        label: "Validation gates",
        value:
          "the deterministic classification is read, never recomputed as authoritative.",
      },
      {
        attribute: "idempotency",
        label: "Idempotency",
        value:
          "repeated re-checks produce revisions, not duplicates.",
      },
      {
        attribute: "expiry",
        label: "Expiry",
        value:
          "a re-check on a finished run record produces a late artifact, marked late.",
      },
      {
        attribute: "rollbackOrCompensation",
        label: "Rollback",
        value:
          "superseded artifacts are retained.",
      },
      {
        attribute: "audit",
        label: "Audit",
        value:
          "the requesting identity and the outcome.",
      },
      {
        attribute: "manualAlternative",
        label: "Manual alternative",
        value:
          "the supervisor reads the raw record.",
      },
      {
        attribute: "safeStop",
        label: "Safe-stop",
        value:
          "the existing artifact stands.",
      },
    ],
    notSpecified: null,
  },
  {
    id: "AI-13",
    title: "Vision reasoning",
    sourceRef: "L87946",
    attributes: [
      { attribute: "requestingRole", label: "Requesting role, and all other attributes", value: "Not specified in the Statement of Work" },
      { attribute: "effectiveRoleAndScope", label: "Requesting role, and all other attributes", value: "Not specified in the Statement of Work" },
      { attribute: "objectsAffected", label: "Requesting role, and all other attributes", value: "Not specified in the Statement of Work" },
      { attribute: "inputEvidence", label: "Requesting role, and all other attributes", value: "Not specified in the Statement of Work" },
      { attribute: "draftsRecommendsOrExecutes", label: "Requesting role, and all other attributes", value: "Not specified in the Statement of Work" },
      { attribute: "humanApproval", label: "Requesting role, and all other attributes", value: "Not specified in the Statement of Work" },
      { attribute: "policyConditions", label: "Requesting role, and all other attributes", value: "Not specified in the Statement of Work" },
      { attribute: "validationGates", label: "Requesting role, and all other attributes", value: "Not specified in the Statement of Work" },
      { attribute: "idempotency", label: "Requesting role, and all other attributes", value: "Not specified in the Statement of Work" },
      { attribute: "expiry", label: "Requesting role, and all other attributes", value: "Not specified in the Statement of Work" },
      { attribute: "rollbackOrCompensation", label: "Requesting role, and all other attributes", value: "Not specified in the Statement of Work" },
      { attribute: "audit", label: "Requesting role, and all other attributes", value: "Not specified in the Statement of Work" },
      { attribute: "manualAlternative", label: "Requesting role, and all other attributes", value: "Not specified in the Statement of Work" },
      { attribute: "safeStop", label: "Requesting role, and all other attributes", value: "Not specified in the Statement of Work" },
    ],
    notSpecified: {
      literal: "Not specified in the Statement of Work",
      collectiveLabel: "Requesting role, and all other attributes",
      reason: "later release, `DEC-VISION-001`, section 40.6.",
      fixedAttributesLead: "The only fixed attributes are:",
      fixedAttributes: [
        "reasoning type",
        "no participation in the deviation-triggering path",
        "no severity classification",
        "evaluation-gated",
        "tenant-isolated",
      ],
      renderingRule:
        "the platform must not display a greyed-out \"coming soon\" agent, because the agent activity panel's contract is per-agent live status for deployed agents and a placeholder would pollute a surface whose value is that everything on it is real.",
      renderingRuleRef: "L86781",
      openDecisions: [
        { id: "DEC-VISION-001", sourceRef: "L95386" },
        { id: "DEC-VISION-002", sourceRef: "L95387" },
        { id: "DEC-VISION-003", sourceRef: "L95388" },
        { id: "DEC-VISION-004", sourceRef: "L95389" },
        { id: "DEC-VISION-005", sourceRef: "L95390" },
        { id: "DEC-VISION-006", sourceRef: "L95391" },
      ],
    },
  },
] as const satisfies readonly AiAbility[]

type MissingFromRegister = Exclude<AiAbilityId, (typeof AI_ABILITY_REGISTER)[number]['id']>
const _registerExhaustive: MissingFromRegister extends never ? true : never = true
void _registerExhaustive

/* ==================================================================== *
 * THE LOOKUPS — both refuse rather than approximate.
 * ==================================================================== */

/**
 * The register is passed in rather than closed over, on the pattern
 * `aiRosterAgent` established: a lookup that reads a module-load snapshot is
 * the first of this build's ten defect shapes, and a caller holding a filtered
 * view of the register is a legitimate thing for a surface to do.
 *
 * That is the opposite of the rule in `./prohibitions.ts`, deliberately. An
 * ability register is a catalogue and a narrowed catalogue is a normal view of
 * it; a prohibition list narrowed by its caller is a prohibition turned off.
 */
export function aiAbility(register: readonly AiAbility[], id: AiAbilityId): AiAbility {
  const found = register.find((a) => a.id === id)
  if (found === undefined) throw new Error(`The ability register holds no ability named "${id}".`)
  return found
}

export function abilityAttribute(
  ability: AiAbility,
  attribute: AbilityAttributeName,
): AbilityAttributeValue {
  const found = ability.attributes.find((a) => a.attribute === attribute)
  if (found === undefined) {
    throw new Error(`Ability "${ability.id}" carries no attribute named "${attribute}".`)
  }
  return found
}
