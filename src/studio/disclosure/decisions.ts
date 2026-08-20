/**
 * Slice 5, task 3 -- the twenty-four `SURF-STU` decisions, design section 3
 * and census section 7, each carrying **both** source readings with their own
 * locators.
 *
 * The rule this file exists to enforce, from `APP-012`: the client delegated
 * the decision, not the pretence that the source settled it. So a record holds
 * the readings and the build position separately, and a reading has no field
 * in which it could be marked "the answer". Which reading the build acted on
 * lives in `adopted`, and `DecisionDisclosure` labels that a client-delegated
 * choice under `APP-012` every single time.
 *
 * `AC-STU-104` (L33404) and `AC-STU-143` (L34337) are the source's own
 * instruction for the worst of them: surface the tension, never implement it
 * silently.
 *
 * This module is data. It computes nothing and decides nothing.
 */

export type StudioDecisionId =
  | 'D1'
  | 'D2'
  | 'D3'
  | 'D4'
  | 'D5'
  | 'D6'
  | 'D7'
  | 'D8'
  | 'D9'
  | 'D10'
  | 'D11'
  | 'D12'
  | 'D13'
  | 'D14'
  | 'D15'
  | 'D16'
  | 'D17'
  | 'D18'
  | 'D19'
  | 'D20'
  | 'D21'
  | 'D22'
  | 'D23'
  | 'D24'

/**
 * One reading of the source, and where it is. **Exactly two fields.** There is
 * deliberately no `isCanonical`, no `preferred`, no `settled` -- a field like
 * that is how a disclosure quietly becomes an assertion, and `DEC-LANEB-001`
 * is precisely the case where neither reading may be presented as the
 * source's answer.
 */
export interface DecisionReading {
  readonly text: string
  /** Frozen-source locator, e.g. `AC-STU-097 · L33397`. Always names a line. */
  readonly locator: string
}

export interface StudioDecision {
  /** This build's stable key, matching design section 3 and census section 7. */
  readonly id: StudioDecisionId
  /**
   * The source's own `DEC-*` identifier, or `null` where the source recorded
   * the conflict without ever giving it one. `null` is disclosed on screen,
   * not hidden -- an unidentified conflict is harder for a client to find, and
   * saying so is part of the disclosure.
   */
  readonly decisionRef: string | null
  /**
   * A second source identifier for the same question, or `null`. Only `D7`
   * has one: `DEC-VERROLL-001`. Required-and-nullable rather than optional, so
   * every record carries the key and the whole array can take the
   * `as const satisfies` form the closed-vocabulary gate requires.
   */
  readonly alias: string | null
  readonly question: string
  readonly readings: readonly DecisionReading[]
  /** What this build does, and why. Never presented as the source's ruling. */
  readonly adopted: string
  /**
   * Closed-vocabulary members this decision's prose names. Each is pinned by
   * `tests/unit/stu-vocab.test.ts` against `STUDIO_VOCABULARY_MEMBERS`, so
   * removing a member from its set turns this disclosure red rather than
   * leaving it pointing at something that is no longer there.
   */
  readonly pins: readonly string[]
}

export const STUDIO_DECISIONS = [
  {
    id: 'D1',
    decisionRef: null,
    alias: null,
    question: 'Which Studio screen catalogue is canonical?',
    readings: [
      {
        text: 'Catalogue A, the mnemonic register: twenty-one rows, three of which the numbered catalogue has no row for at all.',
        locator: 'L31067-L31089',
      },
      {
        text: 'Catalogue B, the numbered screen register: fifteen rows, and the only catalogue carrying roles-that-can-open, module-and-feature and navigation entry point. It is also the only one with a Sign-in row and a permissions screen, both of which the surface needs.',
        locator: 'L48259-L48273 · AC-SCR-STU-001 L48346',
      },
    ],
    adopted:
      'Catalogue B is the route key. The two catalogues share no token, so they collide on coverage rather than identity, and catalogue A’s three orphans become sub-views of their catalogue-B parents: SCR-STU-LEARN a view of SCR-STU-13, SCR-STU-PARTADD an inline panel of SCR-STU-04, SCR-STU-DRAFTAI a state of SCR-STU-11. The nineteen one-off storyboard literals are recorded as uncatalogued names and none becomes a route.',
    pins: ['SCR-STU-13', 'SCR-STU-04', 'SCR-STU-11'],
  },
  {
    id: 'D2',
    decisionRef: null,
    alias: null,
    question: 'Which permission statement governs a Studio matrix cell?',
    readings: [
      {
        text: 'The chapter-20 module matrices. The source’s own reason: the module template is “identical for all eighteen so that a reader can compare modules directly and so that an omission is visible rather than invisible”, and “Every cell carries an explicit status”. (The module count in that quotation is a derived count, not stated in the Statement of Work — DEC-STUDIO-001.)',
        locator: 'L31513 · L34537',
      },
      {
        text: 'Three coarser tables outside chapter 20 restate Studio permissions and all three disagree with it: MTX-TEN-02b, the eight-row table at section 25.3, and the SEQ-0xx role-authority tables.',
        locator: 'L22031 · L48319 · L67899',
      },
    ],
    adopted:
      'The chapter-20 module matrices govern every cell, without exception. The other three are restatements at coarser granularity. Section 25.3’s eight-row table is recorded as attributed-but-disputed and is the single most dangerous restatement on the surface, because it fills the Read-only Auditor column with statuses AC-STU-157 forbids.',
    pins: [],
  },
  {
    id: 'D3',
    decisionRef: 'DEC-AUDSTU-001',
    alias: null,
    question: 'May the Read-only Auditor open the Studio, and see what?',
    readings: [
      {
        text: 'Option (a): no Studio access. Section 3.5 routes the auditor to the Delivery Operations Hub record instead. The card records the counter-pattern in the same breath: Studio publish events are ingested into that tenant audit log while the diff and the approval log are not stated to be.',
        locator: 'DEC-AUDSTU-001 · L34524',
      },
      {
        text: 'Option (b), the source’s own recommendation: read-only to published versions, version history, approval logs and diffs, and no drafts. Option (a) is rejected in the card because it “would force auditors to depend on the audited party to produce evidence, which weakens the audit”.',
        locator: 'DEC-AUDSTU-001 · L34524',
      },
      {
        text: 'Option (c): read-only to everything, drafts included.',
        locator: 'DEC-AUDSTU-001 · L34524',
      },
    ],
    adopted:
      'Every Read-only Auditor cell on this surface renders Client Decision Required, and option (b) is staged behind the decision rather than shipped. L34524 is binding: “Until decided, every Read-only Auditor cell in this chapter reads Client Decision Required rather than being guessed.” Forty-seven cells across fifteen matrices, and the cost is stated on screen: an auditor cannot read an approval log or a diff without depending on the audited party to export one.',
    pins: [],
  },
  {
    id: 'D4',
    decisionRef: null,
    alias: null,
    question: 'What does the Studio do when the connection drops?',
    readings: [
      {
        text: 'The thirteen-state contract answers with STATE-08 stale-data and STATE-13 recovery.',
        locator: 'STATE-08 L48015 · STATE-13 L48020',
      },
      {
        text: 'The surface’s own state departures answer with STATE-12 failure: “a lost connection renders STATE-12 with unsaved-work protection”.',
        locator: 'L48330',
      },
      {
        text: 'Chapter 20’s own four-state machine answers with an explicit disconnected state — “Connection lost, local draft buffer active, no save confirmed” — and AC-STU-009: “The Studio never displays a save confirmation for a write that did not durably commit.”',
        locator: 'L30842-L30863 · AC-STU-009 L30871',
      },
    ],
    adopted:
      'The split rule that satisfies all three. Content already loaded renders STATE-08 with a freshness marker. A read that fails outright renders STATE-12 naming what failed and whether anything was written. Every write control is DISABLED with a named reason and is never queued. The editor additionally holds an explicit disconnected state with the local draft buffer and the plain statement that no save has been recorded. Reconnection renders STATE-13, and structural validation re-runs in full before submission is re-enabled (L32152). Nothing on this surface ever queues a write. The source gave this conflict no `DEC-*` identifier.',
    pins: [],
  },
  {
    id: 'D5',
    decisionRef: null,
    alias: null,
    question:
      'Is a version that a newer version has replaced Superseded or Outdated?',
    readings: [
      {
        text: 'MOD-STU-12’s own states line uses both words in one paragraph for two different things: “A version is Published, Superseded when a later version exists, or Archived. Adoption per Job is Notified, Decided-adopt, Decided-defer, or Outdated after the update window lapses.”',
        locator: 'L33479',
      },
      {
        text: 'OBJ-037 collapses them onto the version: “Draft, In Review, Published, Outdated, Archived, as drawn in 7.3.3.”',
        locator: 'OBJ-037 · L8616',
      },
    ],
    adopted:
      'Superseded is the version state and Outdated is the per-Job adoption state, exactly as L33479 uses them. OBJ-037’s naming is recorded as an erratum. Collapsing them loses the distinction between a newer version existing and this Job’s update window lapsing, and those two are separately notified (L33569).',
    pins: ['Superseded', 'Outdated'],
  },
  {
    id: 'D6',
    decisionRef: null,
    alias: null,
    question:
      'Does a Workflow, as distinct from a version, have an Archived state?',
    readings: [
      {
        text: 'Chapter 20 says yes and flags it as derived: “Draft, In Review, Published, Archived. The first three are stated in section 5.3.1; Archived follows from section 5.12.3’s manual archival.”',
        locator: 'L31124 · L31924',
      },
      {
        text: 'OBJ-036 omits it: “Draft, In Review, Published as authoring statuses of the workflow’s current version.”',
        locator: 'OBJ-036 · L8597',
      },
    ],
    adopted:
      'Yes. MOD-STU-03’s own state machine draws it, and a Library with no archived filter cannot express the linkage view’s not-linkable state. OBJ-036 is recorded as the narrower statement rather than a contradiction. Whether an archived version can be un-archived is separately open as DEC-ARCH-001 (L33443).',
    pins: [],
  },
  {
    id: 'D7',
    decisionRef: 'DEC-WFROLL-001',
    alias: 'DEC-VERROLL-001',
    question:
      'How is a defective published version rolled back, and can a version be marked withdrawn so no new Job may link to it?',
    readings: [
      {
        text: 'DEC-WFROLL-001, chapter 28 — the card carrying options, a recommendation, a trade-off and a decision owner: “Not specified in the Statement of Work: whether a version can be marked withdrawn so no new Job may link to it.”',
        locator: 'DEC-WFROLL-001 · L53350 · card at L53710',
      },
      {
        text: 'DEC-VERROLL-001, chapter 7 — the same question in one line, with no options and no cross-reference to the chapter-28 card: “a defective published version is corrected by a new version rather than by an unpublish, with DEC-VERROLL-001 raised on the rollback question.”',
        locator: 'DEC-VERROLL-001 · L8623',
      },
    ],
    adopted:
      'DEC-WFROLL-001 is registered as canonical and DEC-VERROLL-001 as its alias, because the chapter-28 card is the one carrying options, a recommendation, a trade-off and an owner. Both identifiers render, so a client searching on either finds the same card. The question itself stays open.',
    pins: [],
  },
  {
    id: 'D8',
    decisionRef: null,
    alias: null,
    question: 'Does the offline package carry five content classes or six?',
    readings: [
      {
        text: 'Five. AC-STU-120: “The package carries all five stated content classes and excludes Training Library content and escalation delivery.” The five numbered classes are enumerated at L33793-L33797.',
        locator: 'AC-STU-120 · L33941 · classes L33793-L33797',
      },
      {
        text: 'Six. AC-WF-AUT-009-01: “Every package carries specification limits, gate rules, severity mappings, catalog definitions, tenant action bundles, and deviation-capture forms”, and TEST-WF-AUT-009-01 is “Manifest assertion for the six mandatory content classes.” The six-way list splits one class into three and another into two, and drops screen content and coaching entirely.',
        locator: 'AC-WF-AUT-009-01 · L53647 · TEST-WF-AUT-009-01 L53648',
      },
    ],
    adopted:
      'The manifest asserts contents, not cardinality. One data structure quotes the five numbered classes verbatim and the six-way split is recorded as a second grouping of the same contents, so both test-strength criteria are satisfied and neither count is asserted as the count. Both are test-strength assertions about one manifest, and the source gave the conflict no `DEC-*` identifier at all.',
    pins: [],
  },
  {
    id: 'D9',
    decisionRef: null,
    alias: null,
    question: 'What does Unavailable mean on this surface?',
    readings: [
      {
        text: 'Sense A, the connectivity axis. MOD-STU-18 row 23 settles it in a single row: seven columns read “Unavailable — the Studio requires an active connection” and the eighth reads “Explicitly prohibited — no access at all”, same row, same axis.',
        locator: 'L34563',
      },
      {
        text: 'Sense B, the role axis. MTX-TEN-02b’s conditions and section 25.3’s rows use Unavailable where the chapter-20 matrices state Explicitly prohibited for the same cells.',
        locator: 'L22052 · L48319',
      },
    ],
    adopted:
      'On the connectivity axis Unavailable is sense A and renders DISABLED with the condition named. On the role axis it is sense B and renders ABSENT — and under D2 those cells never render at all, because chapter 20 states them as Explicitly prohibited, which carries no rendering anywhere. The slice-4 adjudication is inherited, not re-litigated.',
    pins: [],
  },
  {
    id: 'D10',
    decisionRef: null,
    alias: null,
    question: 'Which feature-numbering scheme is the traceability key?',
    readings: [
      {
        text: 'Chapter 20’s per-module scheme, FEAT-STU-07-01 and its siblings, declared inside each module card.',
        locator: 'L32660',
      },
      {
        text: 'The four-digit catalogue, FEAT-STU-0101 and its siblings — the only scheme covering every Studio module in one uniform table with a three-per-module shape — over a derived count, not stated in the Statement of Work (DEC-STUDIO-001).',
        locator: 'L47378-L47431',
      },
    ],
    adopted:
      'The four-digit catalogue is the traceability key, on the same reasoning and for the same reason as slice 4’s D20: it is the only scheme a traceability matrix can close against. The chapter scheme maps to it once, in one table, and the two are never mixed in a ticket. Both are registered in features.json.',
    pins: [],
  },
  {
    id: 'D11',
    decisionRef: null,
    alias: null,
    question: 'Which Studio object naming scheme is canonical?',
    readings: [
      {
        text: 'The OBJ-STU-* mnemonic register, fifteen rows, readable and used throughout chapter 20.',
        locator: 'L31122-L31138',
      },
      {
        text: 'The numeric register OBJ-036 through OBJ-051 plus OBJ-066, eighteen rows. business-objects.json carries the numeric ninety-nine and zero mnemonics.',
        locator: 'L8589-L8875 · L9391',
      },
    ],
    adopted:
      'The numeric register is canonical and the mnemonics are labels, because the numeric scheme is the one the coverage register can close against. Three mnemonics have no numeric counterpart — OBJ-STU-QUALREQ, OBJ-STU-CAPSTATE and OBJ-STU-LOCALE — and are recorded as a registered gap, not minted as new rows, because minting three OBJ-1xx rows would inflate a closed register of ninety-nine.',
    pins: [],
  },
  {
    id: 'D12',
    decisionRef: 'DEC-CAPAUTH-001',
    alias: null,
    question: 'Who may enable an atomic capability, and does anyone hold it?',
    readings: [
      {
        text: 'Section 5.15.2 states that “an authorised user” enables capabilities in the Atomic Capability area without naming the role. The source’s recommendation is option (b): the Tenant Admin, with mandatory Quality Manager consultation recorded.',
        locator: 'DEC-CAPAUTH-001 · L33992',
      },
      {
        text: 'All four tenant columns of MOD-STU-15 row 1 and MOD-STU-18 row 15 read Client Decision Required — so nobody holds capability enablement, and enablement is what decides which of the nine configuration sections exist across every Workflow.',
        locator: 'L34009 · L34555',
      },
    ],
    adopted:
      'The Atomic Capabilities view is built read-only, with the enablement controls DISABLED and DEC-CAPAUTH-001 named, over a seeded enablement state so the nine sections render. Building an operator would pre-empt the decision; omitting the view would hide the mechanism AC-STU-006 and AC-STU-008 require to be visible.',
    pins: [],
  },
  {
    id: 'D13',
    decisionRef: 'DEC-DELEG-001',
    alias: null,
    question: 'May the Agent Author capability be delegated?',
    readings: [
      {
        text: 'Section 5.18 states that the Quality Manager “holds or delegates the Agent Author capability”, section 5.15.4 repeats that compose authority is “assigned to the Quality Manager or a delegated administrator”, and chapter 20 gives MOD-STU-15 a whole matrix column headed Delegated administrator with Agent Author.',
        locator: 'DEC-DELEG-001 · L17920 · L34009',
      },
      {
        text: 'Section 4.8.4 states plainly: “Delegation is deferred beyond V1; cover is handled by manually adding and removing the role”, and section 4.13 lists role delegation among the items explicitly outside V1 scope.',
        locator: 'DEC-DELEG-001 · L17920',
      },
    ],
    adopted:
      'MTX-TEN-02b’s interim position, condition Y21: “Until decided, the build denies Supervisor access to the Agent Builder and names the decision.” The delegated column renders Client Decision Required with DEC-DELEG-001. Building it as Allowed with conditions would contradict section 4.8.4 at the level of a stated fact. DEC-DELEG-001 is not in chapter 20’s open-decisions table at all.',
    pins: [],
  },
  {
    id: 'D14',
    decisionRef: 'DEC-LANEB-001',
    alias: null,
    question:
      'Does an approved Lane-B value still pass the three-stage approval chain?',
    readings: [
      {
        text: 'AC-STU-097: “No content reaches a published version without three recorded transitions by three distinct identities.” Reading (a) of the card: the chain is absolute and a Lane-B patch must still pass Reviewer and Release Authority, making the “no ceremony” language descriptive of the proposal rather than the publication.',
        locator: 'AC-STU-097 · L33397 · card DEC-LANEB-001 L33253',
      },
      {
        text: 'AC-STU-138: “An approved package-borne value publishes as a patch and adopts per the tenant’s adoption timing; a server-only value applies immediately.” Reading (b) of the card: the Lane-B decision by a Quality Manager in the Client Command Center is the human sign-off and substitutes for the chain.',
        locator: 'AC-STU-138 · L34332 · card DEC-LANEB-001 L33253',
      },
    ],
    adopted:
      'The source’s own hybrid: the single Lane-B decision suffices except for a specification limit, a severity mapping or a gate rule, each of which routes through the full chain. This is the only reading under which both acceptance criteria hold, on disjoint value sets — the two cannot both hold for one package-borne value. AC-STU-104 (L33404) and AC-STU-143 (L34337) bind both sides: surface the tension, never implement it silently. The classifier this adds depends on DEC-PKGFIELD-001, which is open (L33807), so it ships as a named interface over a seeded field map whose provenance renders.',
    pins: [],
  },
  {
    id: 'D15',
    decisionRef: 'DEC-LIB-001',
    alias: null,
    question: 'Does a library edit reach an in-flight Run?',
    readings: [
      {
        text: 'Section 5.7 states that screens hold pointers and a library edit propagates to every referencing screen immediately.',
        locator: 'DEC-LIB-001 · L32591',
      },
      {
        text: 'Section 5.14 and Part II state that a Run’s work package is pinned at assignment and never re-based. The interaction for an in-flight Run whose containment checklist or coaching asset changes mid-Run is not stated at all.',
        locator: 'DEC-LIB-001 · L32591 · L33805',
      },
    ],
    adopted:
      'Pinning semantics govern anything that ships in the package: a library edit propagates in the Studio at once and reaches the floor at the next package build. The counter-argument is recorded and is not trivial — pinning “delays a safety-motivated checklist improvement by up to one Run”. AC-STU-070 forbids any view suggesting live propagation to a pinned package.',
    pins: [],
  },
  {
    id: 'D16',
    decisionRef: 'DEC-WIDIFF-001',
    alias: null,
    question: 'How many difficulty levels does the offline package carry?',
    readings: [
      {
        text: 'The source’s interim rule: “Until it resolves, the package definition carries instruction content at all levels.” AC-STU-090 (L33077) requires that interim rule to be applied and the decision surfaced.',
        locator: 'DEC-WIDIFF-001 · L32949 · AC-STU-090 L33077',
      },
      {
        text: 'The source’s recommendation, option (c): the assigned worker’s level plus the standard level as a substitution fallback, because a mid-Run substitution can occur offline and a worker receiving the standard level is a degradation of comfort rather than of safety.',
        locator: 'DEC-WIDIFF-001 · L32949',
      },
    ],
    adopted:
      'The interim rule wins, so the package carries all three levels: simple, standard and expanded. It is the reading carrying an acceptance criterion. The recommendation renders as the alternative with its storage trade-off stated — carrying all three multiplies the instruction payload by three on every device, competing for the storage coaching assets and deviation forms also need.',
    pins: ['simple', 'standard', 'expanded'],
  },
  {
    id: 'D17',
    decisionRef: 'DEC-LIBREV-001',
    alias: null,
    question:
      'What does the “lightweight review” for published Content Library edits remove?',
    readings: [
      {
        text: 'Option (a): the full three-stage chain with a scoped preview limited to the changed item, preserving the separation-of-duties floor. The source’s recommendation, and its own interim treatment: “Until it is decided, this blueprint treats library edits as passing the full chain and records the divergence.”',
        locator: 'DEC-LIBREV-001 · L32622',
      },
      {
        text: 'Option (b): Author plus a single Reviewer with release authority folded into the review, which reduces the floor for library content and creates two governance regimes. Option (c) gives library content its own two-stage chain, a third regime.',
        locator: 'DEC-LIBREV-001 · L32622',
      },
    ],
    adopted:
      'Option (a). One separation-of-duties floor across all content that reaches the floor is the whole point of section 5.18’s non-widening rule, and a containment checklist is the standard first response to a deviation. The cost is recorded: small coaching-asset corrections get slower.',
    pins: [],
  },
  {
    id: 'D18',
    decisionRef: 'DEC-LANEBAUTH-001',
    alias: null,
    question: 'Who may decide a Lane-B proposal?',
    readings: [
      {
        text: 'Section 5.16.3 states that “a Quality Engineer or Quality Manager accepts or rejects” a Lane-B proposal. A quality engineer is a persona, not a role: section 5.18 staffs them as holders of the Supervisor or Quality Manager role with the authoring grant applied.',
        locator: 'DEC-LANEBAUTH-001 · L34175',
      },
      {
        text: 'Section 3.8 and the Client Command Center’s closed action set state that the learned-change decision is a Quality Manager and above action. A quality engineer holding only the Supervisor role could decide under section 5.16.3 but not under section 6.14.2.',
        locator: 'DEC-LANEBAUTH-001 · L34175',
      },
    ],
    adopted:
      'Option (a), Quality Manager and above only — the source’s recommendation, “because the Client Command Center’s action set is explicitly closed at ten and adding decision authority to a role is a scope decision rather than a drift”, and because slice 4 already built that closed set’s authority column. The Supervisor-with-grant cell renders Client Decision Required.',
    pins: [],
  },
  {
    id: 'D19',
    decisionRef: 'DEC-CAP-001',
    alias: null,
    question: 'Which seven capture types exist at launch?',
    readings: [
      {
        text: 'Sections 1.7 and 7.8.3 list seven: measurement, scan, photo, checklist, boolean, electronic signature, and free text.',
        locator: 'DEC-CAP-001 · L32232',
      },
      {
        text: 'Section 5.5.3 lists a different seven: measurement entry, photo capture, barcode or Quick Response code scan, checkbox confirmation, digital signature, free text, and dropdown selection — plus none, for instruction-only screens.',
        locator: 'DEC-CAP-001 · L32232 · AC-STU-065 L32421',
      },
    ],
    adopted:
      'ADOPTED, not open: the section 5.5.3 set, built from AC-STU-065’s own words, “with checkbox confirmation carrying a multiplicity setting, so one confirmation is what sections 1.7 and 7.8.3 call a boolean and many confirmations are what they call a checklist; the merge removes a type name and no capability.” The eight members are measurement entry, photo capture, barcode or Quick Response code scan, checkbox confirmation, digital signature, free text, dropdown selection, and none. There is no eighth capture type beyond none, and TEST-WF-AUT-002-04 (L53401) makes divergence from the Frontline renderer list a build failure. Why it matters concretely: a Frontline player cannot render a type the contract does not name.',
    // Literal, NOT `[...CAPTURE_TYPES]`. A pin spread from the array it is
    // meant to pin cannot fail: drop a member and the pin drops with it, and
    // this decision goes on naming a type the vocabulary no longer holds.
    pins: [
      'measurement entry',
      'photo capture',
      'barcode or Quick Response code scan',
      'checkbox confirmation',
      'digital signature',
      'free text',
      'dropdown selection',
      'none',
    ],
  },
  {
    id: 'D20',
    decisionRef: 'DEC-TAX-002',
    alias: null,
    question:
      'Does the platform-seeded taxonomy catalogue ship with the sixteen starter names?',
    readings: [
      {
        text: 'The counts of eight starter Job Types and eight starter Service Type tags are source-confirmed, but “the canonical names and codes of the eight starter Job Types and the eight starter Service Type tags are not stated anywhere in the Statement of Work”, and this build does not invent them.',
        locator: 'DEC-TAX-002 · L31894',
      },
      {
        text: 'The adopted working position of 2026-08-14: “The platform-seeded catalogue of Job Types and Service Type tags ships empty: zero seeded entries at version 1. Every tenant creates its own Job Types and Service Type tags immediately, on every tier, with no platform approval step, so no tenant is blocked.”',
        locator: 'DEC-TAX-002 · L31892',
      },
    ],
    adopted:
      'The seeded catalogue ships empty and tenants create their own. The sixteen names are not invented and no fixture names one as canonical. Which tenant role may create a custom type stays open as DEC-TAXROLE-001 (L31914); the custom-type control renders Client Decision Required with the source’s Tenant Admin reading recommended.',
    pins: [],
  },
  {
    id: 'D21',
    decisionRef: null,
    alias: null,
    question:
      'Which statement of an object’s states governs — the module identity card, or the object register?',
    readings: [
      {
        text: 'The module identity cards enumerate each object’s states, and every object on the surface has two to four rival sets elsewhere. The source classifies state names as Derived Clarification while the behaviours are SoW Fact.',
        locator: 'L33289 · L33839 · L34030',
      },
      {
        text: 'Three operationally distinct states live only in prose or in a sequence diagram and appear in no identity-card enumeration: Quarantined on a package, Stalled on a submission, Distributable on a version — “Versioned and Distributable are different states, so a version can exist in history without ever having been safe to run.”',
        locator: 'L33839 · SEQ-012 L68307 · SEQ-013 L68455-L68465',
      },
    ],
    adopted:
      'The module identity cards govern the enumerations, the same ruling and the same reason as slice 4’s D21. What is lost is recorded rather than discarded: the three are modelled as flags, each attached where the source attaches it. Quarantined stops a bad package reaching a device; Stalled is the only state making DEC-RELAUTH-001’s deadlock visible to a tenant; Distributable separates a version existing from a version being safe to run.',
    pins: ['Quarantined', 'Stalled', 'Distributable'],
  },
  {
    id: 'D22',
    decisionRef: null,
    alias: null,
    question: 'Does the Studio have a STATE-07 offline state?',
    readings: [
      {
        text: 'The thirteen-state contract defines STATE-07 Offline as a state every screen inherits by default, and scopes it in the same row: “Only the Frontline Worker Application has a true offline state.”',
        locator: 'STATE-07 · L48014',
      },
      {
        text: 'The surface’s own departures are decisive: “STATE-07 offline is not applicable anywhere on this surface, because authoring requires a connection; a lost connection renders STATE-12 with unsaved-work protection.”',
        locator: 'L48330',
      },
    ],
    adopted:
      'STATE-07 renders nowhere on SURF-STU, and a gate asserts its absence — the same shape as slice 4’s absence gate, on a different token. No source disagrees on this specific point. D4 supplies what replaces it. The source gave this no `DEC-*` identifier.',
    pins: [],
  },
  {
    id: 'D23',
    decisionRef: 'DEC-STUXREF-001',
    alias: null,
    question:
      'Which configuration section carries the Severity 1 arming confirmation?',
    readings: [
      {
        text: 'Section 5.2.2 cites “(5.5.9)” as the place where the Studio surfaces the Severity 1 arming consequence — and section 5.5.9 is Tool and equipment.',
        locator: 'DEC-STUXREF-001 · L31869',
      },
      {
        text: 'Section 5.5.1’s table and section 5.11’s own numbering place Deviation rules and severity mapping at section 5.5.8, and section 5.5.8 states the same arming disclosure directly. The behaviour is unambiguous; the cross-reference is off by one.',
        locator: 'DEC-STUXREF-001 · L31869 · section table L32216',
      },
    ],
    adopted:
      'Build against section 5.5.8 — Section 7, Deviation rules and severity mapping — and record the off-by-one, because “downstream requirement traceability keyed on the cited section number would point at the wrong configuration section”, which is Tool and equipment.',
    pins: ['Deviation rules and severity mapping', 'Tool and equipment'],
  },
  {
    id: 'D24',
    decisionRef: 'DEC-TENGRANT-001',
    alias: null,
    question: 'Does a Studio grant carry an expiry?',
    readings: [
      {
        text: 'MOD-STU-18’s states line attaches it to one grant only: “A grant is Assigned, Active, Revoked, or Expired, the last applying to the implementation team’s capacity at onboarding’s end.”',
        locator: 'L34573',
      },
      {
        text: 'DEC-TENGRANT-001, raised outside chapter 20 and absent from its table: each grant row shows the holder, the grant type, “and, where the client decides one, an expiry”.',
        locator: 'DEC-TENGRANT-001 · L16457',
      },
    ],
    adopted:
      'Expired applies to GRANT-STU-IMPL because section 5.11.4 requires revocation at onboarding’s end. The other two grants render Client Decision Required under DEC-TENGRANT-001, with the four grant states — Assigned, Active, Revoked, Expired — modelled for all three so the decision changes a rendering rather than a schema.',
    pins: ['Assigned', 'Active', 'Revoked', 'Expired'],
  },
] as const satisfies readonly StudioDecision[]

/**
 * The twenty-four ids as a closed set in their own right, with the same real
 * exhaustiveness check every vocabulary in `@/studio/vocab` carries: adding a
 * twenty-fifth id to the union without listing it here stops `Exclude`
 * resolving to `never` and fails the type-check.
 *
 * It is declared as its own literal list rather than mapped off
 * `STUDIO_DECISIONS`, because a check derived from the array it is meant to
 * police can only ever pass.
 */
export const STUDIO_DECISION_IDS = [
  'D1',
  'D2',
  'D3',
  'D4',
  'D5',
  'D6',
  'D7',
  'D8',
  'D9',
  'D10',
  'D11',
  'D12',
  'D13',
  'D14',
  'D15',
  'D16',
  'D17',
  'D18',
  'D19',
  'D20',
  'D21',
  'D22',
  'D23',
  'D24',
] as const satisfies readonly StudioDecisionId[]

const _decisionIdsExhaustive: Exclude<StudioDecisionId, (typeof STUDIO_DECISION_IDS)[number]> extends never ? true : never = true
void _decisionIdsExhaustive

const BY_ID = new Map<StudioDecisionId, StudioDecision>(STUDIO_DECISIONS.map((d): [StudioDecisionId, StudioDecision] => [d.id, d]))

/**
 * The honest stand-in for an id with no record. It cannot be reached while
 * `stu-vocab.test.ts` holds -- that test asserts the record ids ARE the
 * twenty-four -- and it exists so that a registry defect discloses itself on
 * screen instead of throwing inside a render. A typed failure, never a throw.
 */
function missingRecord(id: StudioDecisionId): StudioDecision {
  return {
    id,
    decisionRef: null,
    alias: null,
    question: 'This build holds no decision record for this identifier.',
    readings: [],
    adopted:
      'Nothing is disclosed here, because the record is missing from the registry. That is a defect in this build, not a position it has taken.',
    pins: [],
  }
}

export function studioDecision(id: StudioDecisionId): StudioDecision {
  return BY_ID.get(id) ?? missingRecord(id)
}
