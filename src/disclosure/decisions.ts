/**
 * The open-decision canon, for every surface. HOW MANY IS NOT WRITTEN HERE:
 * this line said "forty-three records today", and a count of a list in the
 * doc comment above the list is a hand-maintained copy of a derived answer —
 * the class that reached twenty-nine copies in this tree before slice 10
 * consolidated it into one membership gate in
 * `tests/unit/surface-neutral.test.ts`. That gate is a literal list of ids and
 * it is the only place the population is asserted.
 *
 * Twenty-nine were raised while `SURF-STU` was built and none of them owned by
 * it. Slice 5 shipped this file under `src/studio/`; it moved here unchanged in
 * substance because a decision is a property of the SOURCE, not of the screen
 * that happens to render it, and slice 6 cites four of these records from
 * `SURF-DOH`: `DEC-LANEB-001`, `DEC-WFROLL-001`, `DEC-LIB-001`, `DEC-TAX-002`.
 *
 * SLICE 10 ADDED FOURTEEN — notifications, schedules, audit and reports. Three
 * of them are shapes this file had not carried before, and each is a shape
 * rather than a special case:
 *
 *  - **Three readings, three renderings.** `DEC-AUDITSUP-001` is one question
 *    answered by three tokens in three chapters -- `Read-only`, `Unavailable`
 *    and `Client Decision Required` -- which render STATE-06, ABSENT and
 *    DISABLED-with-the-identifier. `DEC-AUDITQM-001` is the same shape.
 *    `DEC-SCHED-011` is the extreme of it: its three readings disagree about
 *    whether the decision EXISTS, and nothing here settles that.
 *  - **A second alias pair, and a third that is not one.** `DEC-SCHED-002` is
 *    registered canonical with `DEC-SCHED-MISFIRE-001` as its alias, on the
 *    same criterion `DEC-WFROLL-001` used: the card carrying options, a
 *    recommendation, a trade-off and an owner wins. `S10-IDENT-SCHED-001`
 *    registers the scheduler identity spellings the same way and MINTS NO
 *    `DEC-*` IDENTIFIER, because the source raises no decision for it.
 *  - **A second build-local key, on a conflict between a matrix and a named
 *    criterion.** `S10-DOH10-AUDITWRITE-001`: `MOD-DOH-10`'s matrix grants the
 *    Read-only Auditor two writes (L28690, L28693) and `AC-AUTH-003` (L10426)
 *    and `AC-DOH-011-2` (L25695) refuse the role any write anywhere in the Hub.
 *    Same treatment and same reason -- `decisionRef: null`, no `DEC-*` minted,
 *    because the source records the collision and raises no decision for it.
 *  - **A record with NO readings at all.** `DEC-FINISH-002` occurs twice in
 *    122,241 lines and neither occurrence says what the two readings are. The
 *    absence IS the disclosure, so the record carries none and states that.
 *    Inventing two would have been the worst outcome available. This is the
 *    only record in the canon below the two-reading floor, and
 *    `tests/unit/slice-10-decisions.test.ts` holds it to being the only one.
 *
 * THE RULE THIS FILE EXISTS TO ENFORCE, from `APP-012`: the client delegated
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
 * THE KEY, AND WHY IT CHANGED. Slice 5 keyed these on `D1`..`D29`, its own
 * design-section numbering. That number is unusable across surfaces, and not
 * hypothetically: slice 4 numbers the Hub's decisions `D1`..`D27` in its own
 * prose, so `D11` is already the Studio's object-naming scheme in one file and
 * the Hub's `DEC-WKRVIEW-001` in another. A second surface citing `D11` would
 * render the wrong disclosure. So **where the source names the decision, the
 * source's own `DEC-*` identifier IS the key** -- one identifier, one record,
 * one wording, whichever surface asks for it. Twelve conflicts the source
 * recorded without ever naming keep this build's own key and say so by
 * carrying `decisionRef: null`; nothing on another surface can cite one,
 * because there is no shared identifier to cite it by.
 *
 * This module is data. It computes nothing and decides nothing.
 */

export type DecisionId =
  | 'D1'
  | 'D2'
  | 'DEC-AUDSTU-001'
  | 'D4'
  | 'D5'
  | 'D6'
  | 'DEC-WFROLL-001'
  | 'D8'
  | 'D9'
  | 'D10'
  | 'D11'
  | 'DEC-CAPAUTH-001'
  | 'DEC-DELEG-001'
  | 'DEC-LANEB-001'
  | 'DEC-LIB-001'
  | 'DEC-WIDIFF-001'
  | 'DEC-LIBREV-001'
  | 'DEC-LANEBAUTH-001'
  | 'DEC-CAP-001'
  | 'DEC-TAX-002'
  | 'D21'
  | 'D22'
  | 'DEC-STUXREF-001'
  | 'DEC-TENGRANT-001'
  | 'DEC-ROLE-001'
  | 'DEC-RELAUTH-001'
  | 'DEC-EMBED-001'
  | 'DEC-ARCH-001'
  | 'D29'
  // Slice 10 — notifications, schedules, audit, reports.
  | 'DEC-AUDITSUP-001'
  | 'DEC-AUDITQM-001'
  | 'DEC-AUDITHASH-001'
  | 'DEC-AUDITOFF-001'
  | 'DEC-NOTIFCOUNT-001'
  | 'DEC-NOTIFSEV-001'
  | 'DEC-NOTIFPRI-001'
  | 'DEC-NOTIFPREF-001'
  | 'DEC-NOTIFACK-001'
  | 'DEC-SCHED-002'
  | 'DEC-SCHED-011'
  | 'DEC-FINISH-002'
  | 'DEC-CMDEXP-001'
  | 'S10-IDENT-SCHED-001'
  | 'S10-DOH10-AUDITWRITE-001'

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

export interface OpenDecision {
  /**
   * The citation key, from any surface. It is the source's own `DEC-*`
   * identifier wherever the source names one, and this build's own key only
   * where the source names none -- the invariant `id === decisionRef` OR
   * `decisionRef === null`, which `surface-neutral.test.ts` holds against the
   * whole array so the two can never drift into naming one decision twice.
   */
  readonly id: DecisionId
  /**
   * The source's own `DEC-*` identifier, or `null` where the source recorded
   * the conflict without ever giving it one. `null` is disclosed on screen,
   * not hidden -- an unidentified conflict is harder for a client to find, and
   * saying so is part of the disclosure. It is also what tells a reader that
   * `id` is this build's key rather than the source's.
   */
  readonly decisionRef: string | null
  /**
   * A second spelling of the same question, or `null`. Three records carry
   * one: `DEC-WFROLL-001` (`DEC-VERROLL-001`), `DEC-SCHED-002`
   * (`DEC-SCHED-MISFIRE-001`), and `S10-IDENT-SCHED-001`, whose subject is a
   * non-human identity register rather than a decision identifier and which
   * therefore lists the re-spellings rather than one.
   *
   * WHAT IT IS FOR, and it is not cosmetic: where the source asks one question
   * under two identifiers and never cross-references them, dropping one makes
   * the card unfindable by a client searching on the other. So the build
   * registers one canonical, keeps the other as an alias, renders both, and
   * says on screen that it registered an alias rather than dropping one.
   *
   * Required-and-nullable rather than optional, so every record carries the
   * key and the whole array can take the `as const satisfies` form the
   * closed-vocabulary gate requires.
   */
  readonly alias: string | null
  readonly question: string
  /**
   * Every reading, never only the one the build acted on. Two or more, with
   * ONE exception the canon states rather than hides: `DEC-FINISH-002` carries
   * none, because the source records none. An empty array is a disclosure of
   * absence and `DecisionDisclosure` renders it as one; it is never a record
   * whose readings were not written yet.
   */
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

export const OPEN_DECISIONS = [
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
    id: 'DEC-AUDSTU-001',
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
    id: 'DEC-WFROLL-001',
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
    id: 'DEC-CAPAUTH-001',
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
    id: 'DEC-DELEG-001',
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
    id: 'DEC-LANEB-001',
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
    id: 'DEC-LIB-001',
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
    id: 'DEC-WIDIFF-001',
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
    id: 'DEC-LIBREV-001',
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
    id: 'DEC-LANEBAUTH-001',
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
    id: 'DEC-CAP-001',
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
    id: 'DEC-TAX-002',
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
    id: 'DEC-STUXREF-001',
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
    id: 'DEC-TENGRANT-001',
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
  {
    id: 'DEC-ROLE-001',
    decisionRef: 'DEC-ROLE-001',
    alias: null,
    question: 'Is Plant Manager a fixed role, or a persona?',
    readings: [
      {
        text: 'Reading A, the closure reading: five tenant roles exist and Plant Manager and Quality Director are personas. §4.8.1 is the strongest closure statement the source makes — “There are five fixed roles at V1; custom roles are deferred beyond V1. There is no ‘Quality Director’ role” — and §3.5 repeats it. A plant manager is a Supervisor at Site or Tenant scope, and where decision authority is genuinely needed the person additionally holds Quality Manager, which is the resolution §6.1.3 supplies in its own closing sentence.',
        locator: 'DEC-ROLE-001 · Reading A L17688 · §4.8.1 quoted at L17684',
      },
      {
        text: 'Reading B, the user-group reading: “Plant Manager / Quality Director” is a real Client Command Center user group with its own landing view, its own aggregate tiles and a named position in the escalation-fallback chain, but composed rather than declared — a role plus a scope plus a landing-view preference. It owes a landing-view field and an escalation recipient class, and still owes no sixth role.',
        locator: 'DEC-ROLE-001 · Reading B L17690',
      },
      {
        text: 'Reading C, the fixed-role-table reading: §5.18’s Studio access table is headed “Fixed role” and carries Plant Manager as a row alongside Quality Manager, Supervisor, Tenant Admin and Frontline Worker. Read literally the Studio recognises a sixth fixed role whose entire remit is “Read-only access to published Workflow content. No access to drafts or in-review versions; cannot edit.”',
        locator: 'DEC-ROLE-001 · Reading C L17692 · §5.18 table L34512-L34516',
      },
    ],
    adopted:
      'Reading A, which is also the source’s own recorded position for this surface: Plant Manager is “a persona whose Studio access is delivered by a Supervisor role without the authoring grant, which produces exactly the access §5.18 describes” (L34522). The persona column stays in every Studio matrix and no sixth role is minted, so the access evaluator resolves a Plant Manager through the supervisor-without-grant column and every derived cell names DEC-ROLE-001 as the reason. The cost is stated rather than hidden: a Plant Manager and a Supervisor without the grant are one identity in the audit log and cannot be told apart there, and if the client makes Plant Manager a role every cell of that column becomes separately settable. Decision owner, L17705: the client product owner, with the tenant quality lead consulted.',
    pins: [],
  },
  {
    id: 'DEC-RELAUTH-001',
    decisionRef: 'DEC-RELAUTH-001',
    alias: null,
    question:
      'What is the minimum staffing a tenant must maintain for the three-stage chain to be completable, and who is eligible to receive a per-workflow Release Authority override?',
    readings: [
      {
        text: 'Option (a): require at least two holders of a Release-Authority-capable role at tenant scope, enforced at Workflow submission with a clear message. Trade-off, stated in the card: it imposes a staffing requirement on small tenants.',
        locator: 'DEC-RELAUTH-001 · L33255',
      },
      {
        text: 'Option (b): permit the per-workflow override to name any authoring-grant holder who is not the Author or the Reviewer. Trade-off: it widens release authority beyond the Quality Manager, which §5.11.2 does not contemplate.',
        locator: 'DEC-RELAUTH-001 · L33255',
      },
      {
        text: 'Option (c): permit the Reviewer stage to be performed by a second Quality Manager only, forcing the staffing question at onboarding. Trade-off: the strictest and least flexible.',
        locator: 'DEC-RELAUTH-001 · L33255',
      },
    ],
    adopted:
      'Option (a), with the pre-submission staffing check the card itself recommends, “because a deadlock discovered at release time wastes an entire authoring cycle”. It ships as publish check eleven and it REFUSES submission naming the shortfall; it never auto-approves and never substitutes a role that is not authorised. Why it matters, in the card’s own words: a tenant with exactly one Quality Manager and one authoring-grant holder can author and review but cannot release, the Workflow stalls, and the floor keeps running on the prior version — safe, but a silent operational deadlock. Decision owner, L33255: the client’s product owner with the onboarding function.',
    pins: [],
  },
  {
    id: 'DEC-EMBED-001',
    decisionRef: 'DEC-EMBED-001',
    alias: null,
    question:
      'Does Coaching Corpus content cross the platform boundary to be embedded — under what data-processing terms, in which region, and is the index rebuilt when the model changes?',
    readings: [
      {
        text: 'Option (a): embed in-region under a data-processing agreement with no retention by the model provider. Trade-off: it requires a contractual term and a named region.',
        locator: 'DEC-EMBED-001 · L32606',
      },
      {
        text: 'Option (b): embed only non-identifiable asset types and exclude video containing identifiable workers from semantic indexing, falling back to metadata retrieval for those. Trade-off: it reduces retrieval quality, and the card adds that it “degrades the corpus precisely where video is most useful”.',
        locator: 'DEC-EMBED-001 · L32606',
      },
      {
        text: 'Option (c): run an in-boundary embedding model, accepting a quality difference. Trade-off: it increases platform engineering scope and carries an unquantified quality cost.',
        locator: 'DEC-EMBED-001 · L32606',
      },
    ],
    adopted:
      'Option (a), with an explicit no-training, no-retention term and a documented index-rebuild procedure for model version changes. Why it matters is the card’s own reason: the deployment posture is cloud, United States region, with the client owning the account, and sending video of identifiable workers to an external model is a data-processing question the compliance posture must answer explicitly. What the source does settle is held to regardless of the answer — corpus media containing identifiable workers is held in the tenant’s own isolated memory, never shared across tenants and never exported as external training data (L32755). Decision owner, L32606: the client’s platform team with legal counsel, alongside DEC-CERT-001.',
    pins: [],
  },
  {
    id: 'DEC-ARCH-001',
    decisionRef: 'DEC-ARCH-001',
    alias: null,
    question:
      'Can an archived version be un-archived, can an archived version be linked to a new Job, and is archival reversible at all?',
    readings: [
      {
        text: 'Option (a): archival is reversible by the Quality Manager with an audited reason. Trade-off: it makes archival a weaker signal of retirement.',
        locator: 'DEC-ARCH-001 · L33443',
      },
      {
        text: 'Option (b): archival is irreversible and a new version must be created from the archived content. Trade-off: it forces a version-number increment for a clerical mistake.',
        locator: 'DEC-ARCH-001 · L33443',
      },
      {
        text: 'Option (c): archival is reversible only within a stated window. Trade-off: it adds a timer nobody asked for.',
        locator: 'DEC-ARCH-001 · L33443',
      },
    ],
    adopted:
      'Option (a), the card’s own recommendation — “because the platform’s only irreversible act is worker personal-data anonymisation and adding a second irreversible act to a content operation is disproportionate”. MOD-STU-12 owns it: un-archival requires an audited reason and refuses without one, and the restored state is DERIVED, so an un-archived version never claims to be in force while a newer one exists. MOD-STU-03’s Library draws no un-archive control, because archival is a per-VERSION act and none of the nine matrix rows governing that screen names archival; the state machine there carries the statement instead (L31974). Why it matters: a tenant that archives the wrong version has no stated remedy, and the platform’s no-purge data model means the content certainly still exists. Decision owner, L33443: the client’s quality lead.',
    pins: [],
  },
  {
    id: 'D29',
    decisionRef: null,
    alias: null,
    question:
      'Does an incomplete locale block publication in that locale only, or does any incompleteness block the whole publication?',
    readings: [
      {
        text:
          'Per-locale. “The blocking rule is per-locale, not per-Workflow. A Workflow declaring English and Spanish whose Spanish coaching default is missing publishes in English and is blocked in Spanish, with the specific missing element named.” `FUNC-STU-17-03-A-2` states the same as a functionality: “Block publication in the incomplete locale only, naming each missing element, and permit publication in complete locales.”',
        locator: 'L34361 · FUNC-STU-17-03-A-2 L34410',
      },
      {
        text:
          'Whole-publication. The same sentence records the alternative in its own words, and rejects it in its own words: “the alternative reading, that any incompleteness blocks the whole publication, would make a partially localised improvement impossible to ship and is rejected for that reason.” The rejection is the source’s, not this build’s, and it is carried here as the source’s sentence rather than restated as a ruling.',
        locator: 'L34361',
      },
    ],
    adopted:
      'The per-locale reading. The Statement-of-Work sentence it reads is “an incomplete locale blocks publication in that locale” (L34359), and L34410 states the per-locale scope a second time as `FUNC-STU-17-03-A-2`. The source itself classes that scope a `Derived Clarification` rather than a `SoW Fact` (L34410, L34498), which is exactly why it renders as a reading here and never as a settled rule. MOD-STU-17 implements it: English publishes while Spanish is blocked and the missing element is named, and where the completeness check cannot run every declared locale is blocked, failing closed (`FUNC-STU-17-03-A-1` L34409, `AC-STU-149` L34487). The cost is stated rather than hidden: a version can reach the floor in one language while the other is still blocked, so a mixed-language site may run English screens for Spanish-speaking workers unless the Release Authority holds the release — which is what the card’s own example has Elena do (L34449). The whole-publication reading removes that risk and pays for it in the source’s own words: it would make a partially localised improvement impossible to ship.',
    pins: [],
  },

  /* ================================================================== *
   * SLICE 10 — notifications, schedules, audit, reports.
   * ================================================================== */

  {
    id: 'DEC-AUDITSUP-001',
    decisionRef: 'DEC-AUDITSUP-001',
    alias: null,
    question: 'May a Supervisor read the audit log, and of what?',
    readings: [
      {
        text: 'Reading (a), chapter 17: the tenant role-to-module matrix gives the Supervisor `Read-only` on the Audit and Retention module, and its own condition note narrows that to held scope while calling the narrowing a recommendation over a stated silence — “Not specified in the Statement of Work whether audit reading is scope-narrowed for a Supervisor; recommendation: narrow to held scope, since the Read-only Auditor exists precisely to hold the tenant-wide read.” The note names no decision identifier. `Read-only` renders STATE-06 with the cause stated.',
        locator: 'MOD-DOH-11 row L22017 · condition [H23] L22027',
      },
      {
        text: 'Reading (b), chapter 19.13: the module’s own matrix reads `Unavailable` for the Supervisor on BOTH read rows and `Explicitly prohibited` on export. On the role axis `Unavailable` is sense B and renders ABSENT, so under this reading the Supervisor has no audit view at all. The screen register agrees and is a fourth locator rather than a restatement: the audit log explorer admits the Read-only Auditor, the Tenant Admin and the Quality Manager, and omits the Supervisor.',
        locator: 'L28865-L28867 · SCR-DOH-20 L48114',
      },
      {
        text: 'Reading (c), chapter 30D.4: the by-role audit matrix reads `Client Decision Required` and names this identifier, and the section states the options in words — “The options are no access, matching the literal source, scoped read as recommended, or read of the Supervisor’s own actions only.” The trade-off is “operational self-service against information exposure inside a plant”, and the flow diagram carries the same node rather than an invented answer. `Client Decision Required` renders DISABLED with the identifier named.',
        locator: 'DEC-AUDITSUP-001 · L74217 · options and trade-off L74178 · flow node L74198',
      },
    ],
    adopted:
      'Reading (c)’s token, and it is chosen because it is the only one of the three that is not an answer: every Supervisor audit cell renders Client Decision Required, DISABLED, with DEC-AUDITSUP-001 named, and all three readings render beside it. Readings (a) and (b) are mutually exclusive answers to a question the source says twice it did not settle, so adopting either would present a guess as the source’s position. What this costs is stated rather than hidden: a Supervisor who grants clearances, requests releases, substitutes workers and cancels runs — all audited — cannot read their own trail, and the decision changes a route’s role list and not only a cell, because the audit log explorer does not admit the Supervisor at all. Measured, because the shape is unusual: nine references across the frozen source and NO card in section 51.9 — the options live in the prose of 30D.4 instead of in a card, which is why they are quoted here from L74178. Decision owner, L74178: the client’s product owner with the quality lead.',
    pins: [],
  },
  {
    id: 'DEC-AUDITQM-001',
    decisionRef: 'DEC-AUDITQM-001',
    alias: null,
    question:
      'Is the Quality Manager’s audit read scoped to Summary and run-state events, and if so how do they read their own most consequential decisions?',
    readings: [
      {
        text: 'Reading (a), chapter 17: the tenant role-to-module matrix gives the Quality Manager a bare `Read-only` on the Audit and Retention module with NO condition note of any kind — the only unqualified cell in that row — which read literally is the full tenant log, unscoped.',
        locator: 'MOD-DOH-11 row L22017',
      },
      {
        text: 'Reading (b), chapter 19.13: the module’s own matrix reads `Explicitly prohibited` on the full-log row and names a permission inside the same cell, “scoped to Summary and run-state events only”, while the very next row grants exactly those events `Read-only` and the export row reads `Allowed with conditions` within the Quality Manager’s audit scope.',
        locator: 'L28865 · L28866 · L28867',
      },
      {
        text: 'Reading (c), chapter 30D.4: `Allowed with conditions` — Summary and run-state events, with the extension pending this identifier. The source writes its own argument for the extension: a Quality Manager “releases holds, decides Lane B proposals, authorises never-held clearances, and approves Jobs, none of which are Summary or run-state events, so under the literal reading they cannot read their own most consequential decisions”, and the recommendation is to extend the read to the classes in which the Quality Manager is an actor or approver.',
        locator: 'DEC-AUDITQM-001 · L74218 · the argument L74178 · flow node L74197',
      },
    ],
    adopted:
      'Reading (b) supplies the cells, because the module matrix governs a matrix cell on the inherited slice-4 ruling; the extension question stays open and every Quality Manager audit cell names DEC-AUDITQM-001. One consequence is worth being explicit about: the full-log cell is the routing branch and not a categorical prohibition, because the permission is named in the same cell and the immediately adjacent row grants exactly those events — so it renders DISABLED with the named reason, not ABSENT. Ten references and no card in section 51.9; the options and the recommendation are in the prose at L74178. The cost the source itself names is carried on screen: a Quality Manager cannot see their own hold release in the audit view, which is the anomaly this decision exists to resolve.',
    pins: [],
  },
  {
    id: 'DEC-AUDITHASH-001',
    decisionRef: 'DEC-AUDITHASH-001',
    alias: null,
    question:
      'Is the audit hash in the Execution Summary footer a per-document integrity digest, or evidence of log integrity?',
    readings: [
      {
        text: 'Reading (a), the source’s own recommendation: a per-document integrity digest, “which is implementable at V1 and does not imply a chained log”. The third option in the same sentence is to remove the footer hash until V2. The contradiction is that section 4.7.5 puts an audit hash in the per-run portable-document-format footer while sections 4.10.2 and 8.18 defer hash-chaining, and “the source uses the same word for both without reconciling them”.',
        locator: 'DEC-AUDITHASH-001 · L73949',
      },
      {
        text: 'Reading (b): it is intended as evidence of log integrity, “which would pull the deferred V2 hardening into V1”, at additional cost — the middle option is a minimal per-record hash chain at V1. The trade-off is “auditor confidence against V1 scope”. The export-capability matrix renders the open question directly, as a Client Decision Required row naming this identifier.',
        locator: 'DEC-AUDITHASH-001 matrix cell L74759 · classification L73970',
      },
    ],
    adopted:
      'Reading (a), the per-document digest, and the export capability renders Client Decision Required with the identifier rather than as an available feature. The harder half of this is a claim this build may never make, and it is a limit rather than a preference: no screen may imply that a V1 audit log is cryptographically tamper-evident, because chained hashes and signed batches are deferred beyond V1 and what V1 delivers is “append-only with no delete or edit path on any surface, which is an access-control property rather than a cryptographic one”. The commercial consequence is the source’s own: an auditor asking whether the log was altered gets a different answer at V1 than at V2. Eight references, no card in section 51.9. Decision owner, L73949: the client’s quality lead with the JBS delivery lead.',
    pins: [],
  },
  {
    id: 'DEC-AUDITOFF-001',
    decisionRef: 'DEC-AUDITOFF-001',
    alias: null,
    question:
      'How is the one-transaction guarantee honoured on a device that cannot reach the server?',
    readings: [
      {
        text: 'Reading (a), the literal source: the one-transaction guarantee is stated for administrative and operational changes, and a full run executing offline with data syncing on reconnection is stated, and how the guarantee is honoured on a device with no server is stated nowhere. The section says why that cannot simply be left: “the alternative to answering it is either a device that silently records unaudited work or a device that cannot work offline, and both contradict stated positions”.',
        locator: 'DEC-AUDITOFF-001 · L74372',
      },
      {
        text: 'Reading (b), the proposed model, classified `Derived Clarification` with a client decision on its bounds: a local durable append-only queue that IS the device’s audit store, with business events and their audit events written into it together in one local transaction — the commit-together rule at device scope — and both the device timestamp and the server-receipt timestamp preserved on the way up. When the queue cannot preserve an action the device blocks the action and enters an upload-only state; the action-class register states the same in two rows, “Continue into the local durable append-only queue” for Frontline capture and “Halt, upload-only mode” when that queue is unwritable.',
        // The two action-class rows are quoted above by their own words rather
        // than by line number, deliberately: neither row carries an identifier,
        // so a line number beside them would be a citation nothing anchors.
        // `tests/unit/slice-10-decisions.test.ts` asserts both rows by content.
        locator: 'DEC-AUDITOFF-001 classification L74438',
      },
    ],
    adopted:
      // THE STORAGE-FULL DECISION IS NAMED BY ITS SUBJECT, NOT BY ITS
      // IDENTIFIER, AND THAT IS DELIBERATE. `MOD-FL-A2` and three other
      // Frontline modules already disclose it locally, and four suites assert
      // its identifier is absent from this file so that a lift turns them red
      // rather than leaving two homes for one decision. Spelling it here would
      // create the second home without moving the record.
      'Reading (b), the proposed model, with its bounds left open — that is what the decision is about, and the model itself is what the source proposes rather than what it settles. Two things are held to regardless of the answer, because they are stated: an action that cannot be audited does not happen, and the storage-full case is deferred to the Frontline Functional Specification under its own open decision, which this record references and does not pre-empt beyond the invariant that no unaudited capture may be accepted. Four references and no card in section 51.9.',
    pins: [],
  },
  {
    id: 'DEC-NOTIFCOUNT-001',
    decisionRef: 'DEC-NOTIFCOUNT-001',
    alias: null,
    question:
      'Is the notification catalogue of eighty-seven categories in thirteen families the ratified catalogue?',
    readings: [
      {
        text: 'Reading (a): ratify eighty-seven as stated. The reconciliation “produced exactly eighty-seven categories, organised into thirteen families”, and the number is `Derived Clarification`, not a source fact — “No canonical notification category count exists in the Statement of Work, in the same way that no canonical Studio module count exists.” The client must ratify before the Functional Specification fixes message identifiers, “because every category becomes a locale key pair, a routing rule, a preference row, and an audit class”.',
        locator: 'DEC-NOTIFCOUNT-001 · L72927 · the reconciliation L72925',
      },
      {
        text: 'Reading (b): merge families “where a tenant would experience two categories as one”, or expand “where a tenant’s quality system needs finer classification”. The trade-off in the source’s words: “fewer categories means less configuration burden and coarser routing; more categories means precise routing and a larger preference surface for the Tenant Admin to maintain.”',
        locator: 'DEC-NOTIFCOUNT-001 · L72927 · catalogue L72950-L73096',
      },
    ],
    adopted:
      'The eighty-seven and the thirteen families are the counts this build renders, and every rendering of either carries the `Derived Clarification` label — the same treatment DEC-STUDIO-001 gets for the Studio module count, and for the same reason: a derived count presented bare reads as a source fact. One count in the same section is NOT safe to render and this build does not: the prose class distribution at L72929 claims “34 notifications, 9 alerts, 12 action-required notifications, 8 approval requests, 0 general tasks because no general task object exists, 6 reminders, 15 escalations, and 3 command-linked notifications”, and counting the catalogue itself yields no folding of its compound tokens that produces fifteen escalations or three command-linked. The eighty-seven total and the thirteen families reconcile; the distribution does not, and is disclosed as a contradiction rather than rendered as a breakdown. Decision owner, L72927: the client’s product owner with the JBS delivery lead.',
    pins: [],
  },
  {
    id: 'DEC-NOTIFSEV-001',
    decisionRef: 'DEC-NOTIFSEV-001',
    alias: null,
    question:
      'What are the notification severity levels, and how is notification severity kept apart from deviation severity and anomaly severity?',
    readings: [
      {
        text: 'Reading (a), the literal source: it “does not fully specify notification severity”. It uses the word Critical for notifications in exactly one operative place — a Critical notification unacknowledged after 4 hours re-notifies the same audience on the same channels, tightening to 1 hour in Regulated-Industry mode — and “never enumerates the other levels, never states how a category is assigned a level, and never states a priority concept at all. Everything else in this section is proposal.”',
        locator: 'DEC-NOTIFSEV-001 · L73141',
      },
      {
        text: 'Reading (b), the proposed model, classified `Recommendation — R&D`: four levels, Critical, High, Medium and Informational. The decision exists in two parts and the second is the trap: three severity vocabularies already exist and are not the same thing — deviation severity, anomaly severity at review time, and notification severity — and “a Severity 1 deviation produces a Critical notification and a Critical anomaly, which makes the three vocabularies look identical at the top and diverge everywhere below”. Confusing them “would let a tenant’s configuration of deviation action bundles silently change notification escalation behaviour, which no source sentence permits”.',
        locator: 'DEC-NOTIFSEV-001 · L73143 · the count L73147 · classification L73186',
      },
    ],
    adopted:
      'The four levels are modelled and the three vocabularies are kept in separate fields with separate screen labels, and NO screen presents a notification severity as a source-backed value — that is the limit this record exists to make checkable, and it follows from the source’s own classification line, which puts “the four severity levels, the three priority levels, the assignment table, and the unclassified fallback” in `Recommendation — R&D` rather than in `SoW Fact`. What is settled and does ship: the Critical re-notification rule and its Regulated-Industry tightening, which are `SoW Fact`. Measured, because the shape misleads: the level table is ONE table of seven data rows carrying both axes — four severity rows and three priority rows — not two tables, and a reader counting rows to count severity levels gets seven.',
    pins: [],
  },
  {
    id: 'DEC-NOTIFPRI-001',
    decisionRef: 'DEC-NOTIFPRI-001',
    alias: null,
    question:
      'Does a notification priority axis exist at all, separate from severity, and how many levels does it have?',
    readings: [
      {
        text: 'Reading (a), the literal source: it “never states a priority concept at all”. Under this reading there is no priority axis and delivery behaviour is a function of severity alone.',
        locator: 'DEC-NOTIFPRI-001 · L73147 · the silence L73141',
      },
      {
        text: 'Reading (b), the proposed model, classified `Recommendation — R&D`: three levels — Immediate, Standard, Deferred — on a separate axis, “because severity answers how serious the underlying condition is while priority answers how the delivery behaves, and the two genuinely diverge: an allocation ladder event at 100 percent is commercially serious but does not need to interrupt a shift, while a shift handoff brief is operationally routine but is worthless if it arrives an hour late”. The three rows carry the same qualifier in every behaviour column: “Not applicable — priority governs presentation, not channel”.',
        locator: 'DEC-NOTIFPRI-001 · L73147 · rows L73155-L73157 · classification L73186',
      },
    ],
    adopted:
      'The three priority levels are modelled as a separate axis and, exactly as with severity, no screen presents a notification priority as a source-backed value. The reason for modelling rather than omitting is the source’s own: priority governs presentation and severity governs seriousness, and folding them would make a routine-but-time-critical item indistinguishable from a serious-but-not-urgent one. Four references and no card in section 51.9; both counts sit in one sentence at L73147 with severity, which is why this record and DEC-NOTIFSEV-001 share locators without sharing a question.',
    pins: [],
  },
  {
    id: 'DEC-NOTIFPREF-001',
    decisionRef: 'DEC-NOTIFPREF-001',
    alias: null,
    question:
      'May a Tenant Admin disable any non-baseline notification category, including hold escalations, release notifications, approval requests and suspension notices?',
    readings: [
      {
        text: 'Reading (a), the source permits it. The literal two-level model — the Tenant Admin sets which events fire and to which recipient roles, and each user sets channel preferences within that policy — “permits a Tenant Admin to disable any non-baseline category, and that includes hold escalations, release notifications, approval requests, and suspension notices, none of which are in the three baseline families as the source names them”.',
        locator: 'DEC-NOTIFPREF-001 · L73674',
      },
      {
        text: 'Reading (b), this blueprint’s implementation blocks it, treating the permission as “a defect of specification rather than an intended permission”, because disabling the notification that tells a Quality Manager a lot is frozen “would leave the tenant compliant with the letter of §4.9.2 and outside the intent of §3.3 and §3.4”. The extended non-disableable set is enumerated as identifier ranges — measured at 38 categories — and the options are to ratify it, to keep the source’s literal model and accept the risk, or to make the extended set a Regulated-Industry-mode constituent. The recommendation is to ratify.',
        locator: 'DEC-NOTIFPREF-001 · L73674 · the set L73676 · AC-30C-1003 L73719',
      },
    ],
    adopted:
      'Reading (b), the extended set, with both readings on screen and the extension labelled a proposal rather than a source fact. One thing about the rendering is NOT a preference and is the reason this decision reaches a screen at all: the preference matrix reads `Explicitly prohibited` down whole columns, and the inherited categorical rule would send those cells to ABSENT — which would delete the Always-sent and Protected groups and leave a preferences screen showing only what can be switched off, the exact inversion of what the same section’s storyboard draws. The storyboard requires the opposite: three groups, with “every locked control” stating “its reason inline rather than showing a disabled control with no explanation”. So those cells render visible-and-locked-with-a-reason. Measured against the whole table rather than a span of it: of the five permission columns, exactly TWO read a prohibition in every cell — a truncation that stops at the third data row makes it look like three. Decision owner, L73674: the client’s product owner with the quality lead.',
    pins: [],
  },
  {
    id: 'DEC-NOTIFACK-001',
    decisionRef: 'DEC-NOTIFACK-001',
    alias: null,
    question: 'How does an acknowledgement from an email notification authenticate?',
    readings: [
      {
        text: 'Reading (a), deep-link-then-authenticate, recommended in the source: “the email control deep-links into the product and the acknowledgement is written only after a valid session exists”. What is stated and not open is that an escalation can be acknowledged in-app or from email and “either writes one acknowledgement state on the record”; what is not stated is how the email half authenticates. The blueprint “refuses to invent an unauthenticated acknowledgement path”.',
        locator: 'DEC-NOTIFACK-001 · L73434',
      },
      {
        text: 'Reading (b): a signed single-use acknowledgement link with a short lifetime, or removing email acknowledgement entirely. The trade-off is “security against speed on a factory floor”, and the reason both halves matter is stated: “a one-click email acknowledgement without authentication would be a security defect and a one-click acknowledgement with authentication is a slower experience the client should agree to knowingly”.',
        locator: 'DEC-NOTIFACK-001 · L73434 · AC-30C-705 L73506',
      },
    ],
    adopted:
      'Reading (a). No unauthenticated acknowledgement path is built, and the acceptance criterion the source writes for it is carried as an obligation rather than as a setting: email acknowledgement occurs only after an authenticated session exists, pending this decision. The reason the click is expensive at all is worth stating on screen, because it looks like overhead: “A notification is a pointer to a business object, never a carrier of authority”, so the click re-runs authorisation from scratch — which matters most for email, where “an email link can be opened days later, on any device, by anyone holding the mailbox”. Five references, no card in section 51.9. Decision owner, L73434: the client’s product owner with the security reviewer.',
    pins: [],
  },
  {
    id: 'DEC-SCHED-002',
    decisionRef: 'DEC-SCHED-002',
    alias: 'DEC-SCHED-MISFIRE-001',
    question:
      'What happens when a scheduled run does not fire at its intended time — run late, skip, or a policy declared per schedule class?',
    readings: [
      {
        text: 'Option A — run late, always. Option B — skip, always. The gap the card states plainly is that neither is right for every schedule: “A missed record-finish should run late, because the finish is a data-integrity rule. A missed 06:00 digest should probably be skipped or delivered late once, not delivered five times. A missed drift-canary run should run late.” The only stated behaviour in the source resembling a misfire policy is section 8.7.5’s emergency pause parking in-flight agent runs at their next stage boundary.',
        locator: 'DEC-SCHED-002 card · L114327',
      },
      {
        text: 'Option C, the recommendation — a per-class policy declared on the schedule definition, choosing among run-late, skip and backfill, “with run-late as the default for integrity-bearing schedules and skip-with-a-single-catch-up for notification-bearing schedules”, reasoned as “a single global policy is wrong for at least one important schedule under any choice”. The trade-off is that “each schedule definition carries a decision that someone must make correctly, and a wrong choice is discovered only during an incident”.',
        locator: 'DEC-SCHED-002 card · L114327',
      },
      {
        text: 'The same question under a second identifier, and the alias half of this record. Chapter 30A raises “Misfire, backfill and re-drive semantics for every scheduled behaviour, and specifically whether a missed shift-handoff brief is regenerated” as `DEC-SCHED-MISFIRE-001`, `Client Decision Required`, with no options, no recommendation, no owner and no cross-reference to the card above.',
        locator: 'DEC-SCHED-MISFIRE-001 raised L66451 · registered L71650',
      },
    ],
    adopted:
      'DEC-SCHED-002 is registered as canonical and DEC-SCHED-MISFIRE-001 as its alias — the same ruling and the same criterion as DEC-WFROLL-001 and DEC-VERROLL-001: the identifier whose card carries options, a recommendation, a trade-off and a decision owner is the one a client can act on. The build registered an alias rather than dropping one, so a client searching on either identifier finds this card, and the question itself stays open. Why an alias and not a merge: the two identifiers are not two views of one register but two chapters that did not know about each other, and the measurement says so rather than an impression. DEC-SCHED-MISFIRE-001 occurs ZERO times inside the chapter that owns scheduled work, and DEC-SCHED-002 occurs zero times inside the chapter that mints DEC-SCHED-MISFIRE-001. Nothing in this build adopts a misfire policy: no scheduler affordance renders a run-late, skip or backfill outcome as settled behaviour. Decision owner, L114327: the JBS engineering lead, ratified by the client’s product owner for user-visible classes.',
    pins: [],
  },
  {
    id: 'DEC-SCHED-011',
    decisionRef: 'DEC-SCHED-011',
    alias: null,
    question:
      'Does DEC-SCHED-011 exist, is it open, or is it already closed? The three readings disagree about the decision itself rather than about its answer.',
    readings: [
      {
        text: 'Reading (a), it does not exist. Chapter 27.5 bounds the band in words — misfire and catch-up “is governed by the scheduled-work decision band `DEC-SCHED-001` through `DEC-SCHED-010`, owned by the scheduled-work chapter” — and the card set in section 51.9 stops at DEC-SCHED-010, whose card is the last of the ten.',
        locator: 'the band bounded L51002 · last card DEC-SCHED-010 L114479',
      },
      {
        text: 'Reading (b), it is open, with nine references. The complete decision identifier index carries a row for it naming chapter 45A as its home chapter and counting nine references — the same shape and the same table as every other open identifier in the index.',
        locator: 'DEC-SCHED-011 index row L115148',
      },
      {
        text: 'Reading (c), it is closed, and the source says so twice in the same section: “That crosswalk closes `DEC-SCHED-011`, which recorded its absence”, and again in the section’s own classification and traceability paragraph as “This crosswalk closes `DEC-SCHED-011`, which recorded its absence”. One word differs between the two sentences and neither is a quotation of the other; both close it.',
        locator: 'DEC-SCHED-011 closed L102392 · restated L102547',
      },
    ],
    adopted:
      'Nothing is settled here, and that is the position rather than a deferral of one. The three readings are mutually exclusive at the level of the decision’s existence — a decision cannot simultaneously not exist, be open with nine references, and have been closed — so any pick would be a claim about the source that the source contradicts on its own page. What the build does instead is procedural and checkable: all three readings render with their own locators, and no scheduler affordance is built whose behaviour depends on which of the three is true. Measured rather than assumed: DEC-SCHED-011 occurs eight times inside chapter 45A and once in the index, which is nine, so reading (b)’s count reconciles with reading (c)’s closure appearing inside that same count — the index counted the closure as a reference. That is the mechanism behind the contradiction and it is worth more than the contradiction.',
    pins: [],
  },
  {
    id: 'DEC-FINISH-002',
    decisionRef: 'DEC-FINISH-002',
    alias: null,
    question:
      'What does a manually closed run anchor its finish to? The source names this as a contradiction — “the manual-close anchor contradiction” — and never writes down what the sides of it are.',
    // DELIBERATELY EMPTY, AND THIS IS THE DISCLOSURE. Two occurrences exist in
    // the whole frozen source and neither states a reading: the naming inside
    // chapter 45A's group-3 sweep, and the index row that gives it chapter 45A
    // as its home and counts two references. There is no card in section 51.9
    // and none anywhere else. Writing two readings here would have been
    // inventing them, which is the one outcome this record exists to refuse.
    readings: [],
    adopted:
      'The absence is what is disclosed. This build records the question and states plainly that NEITHER reading was recorded, and it invents none — a fabricated pair of readings would be indistinguishable on screen from a real pair and would be quoted back as the source’s. Measured, not estimated: DEC-FINISH-002 occurs exactly twice in 122,241 lines — the naming at L98703, where the source lists it as open beside DEC-FINISH-001 and points at the decision index for its home chapter, and the index row at L115082, which names chapter 45A and counts two references. The two references ARE those two lines, so the identifier is defined entirely by its own registration. The consequence for this slice is a limit and not a rendering: no screen presents a manual-close anchor as a source-backed value, and no gate may assert one, because there is nothing to assert it against.',
    pins: [],
  },
  {
    id: 'DEC-CMDEXP-001',
    decisionRef: 'DEC-CMDEXP-001',
    alias: null,
    question:
      'How long does a command remain valid, and what happens to one that is never delivered?',
    readings: [
      {
        text: 'Option (a): no expiry for any class, “with supersession as the only replacement mechanism”. The gap is that the source “defines the command channel and its five classes but states no validity period for any class, and states no behaviour for a command that remains undelivered indefinitely”.',
        locator: 'DEC-CMDEXP-001 · L50875',
      },
      {
        text: 'Option (b), the recommendation: per-class expiry aligned to natural boundaries, “such as shift end for reassignment and clearance, and no expiry for suspension and lot release”, because it “matches the source’s existing shift-scoped semantics for clearances and assignments while preserving the indefinite persistence that suspension and lot release safety require”. Option (c) is a single platform-wide expiry. The trade-off: “per-class rules are more to specify and test.”',
        locator: 'DEC-CMDEXP-001 · L50875 · register row L52186',
      },
    ],
    adopted:
      'Option (b) is modelled and no expiry duration is rendered as a source-backed value, because none exists — the classes “differ enormously in how they age: a version-change notice is harmless when stale, while a reassignment for a shift that ended six hours ago is actively wrong if applied”, and that asymmetry is the whole decision. Nine references, no card in section 51.9; the options, recommendation, trade-off and owner are in the prose at L50875 and the register row at L52186 states the gap in one line. Related and separate, in the source’s own words: DEC-WIPE-001 “already covers the unbounded-pending case for device wipe specifically”. Decision owner, L50875: the client’s platform team with the Frontline lead.',
    pins: [],
  },
  {
    id: 'S10-IDENT-SCHED-001',
    // A BUILD-LOCAL KEY, AND THE `S10-` PREFIX IS DELIBERATE. The source raises
    // NO decision for this collision, so `decisionRef` is null and no `DEC-*`
    // identifier is minted -- minting one would put a decision identifier into
    // a register the client would then search the source for and not find. The
    // slice-5 `D1`..`D29` numbering is not reused because that scheme is a
    // design-section number and collides across surfaces, which is the reason
    // this file is keyed on source identifiers in the first place. `S10-` does
    // not occur in the frozen source.
    decisionRef: null,
    alias: 'IDENT-SCHED-CTL / IDENT-SCHED-WRK / IDENT-SCHED-PLATFORM',
    question:
      'Under which spelling is the scheduler identity registered, when three chapters spell the same two non-human identities three different ways and no decision identifier is raised for the collision?',
    readings: [
      {
        text: 'Spelling (a), chapters 13.4 and 14.5: `IDENT-SCHEDCTL`, the Scheduler Controller identity, and `IDENT-SCHEDWKR`, the Scheduled Execution Worker identity, both classified `User-Mandated Product Extension`. This is the only spelling carrying the full non-human identity contract — measured at seventeen field rows, covering purpose, owner, human sponsor, scope, credential type, provisioning, rotation, expiry, permissions, prohibited actions, tenant boundary, offline behaviour, audit, compromise response, fallback, recovery and reconciliation.',
        locator: 'IDENT-SCHEDCTL L17887 · IDENT-SCHEDWKR L17888 · the contract table L18612',
      },
      {
        text: 'Spelling (b), chapter 45A.5: `IDENT-SCHED-CTL`, “the non-human identity that materialises occurrences and marks them due”, whose “authority is deliberately tiny”, and `IDENT-SCHED-WRK`, which “claims occurrences and performs effects, always through the owning business service and always under a scope narrowed to the definition’s declared scope”. Same two identities, hyphenated differently, with the authority stated and the contract absent.',
        locator: 'IDENT-SCHED-CTL L98883 · IDENT-SCHED-WRK L98885',
      },
      {
        text: 'Spelling (c), chapter 27.4, proposed as `Derived Clarification` “because scheduled work cannot be audited without them”: `IDENT-SCHED-PLATFORM`, “the platform scheduler that owns intended execution times”, plus six per-purpose workers — the run auto-close worker, the per-shift digest worker, the qualification-expiry evaluation worker, the agent execution worker, the usage metering worker, and the on-device sync engine. This is a re-spelling of the controller AND a decomposition of the single worker identity into one identity per purpose, which is why only its scheduler half is aliased below.',
        locator: 'seven identities proposed L51000',
      },
    ],
    adopted:
      'Spelling (a) is registered canonical and the re-spellings of the same two identities are registered as its aliases, so a search on any of them reaches this record; no `DEC-*` identifier is minted, because the source raises none and a build-minted decision identifier is worse than a build-local key. (a) wins on the same criterion the alias pairs use: it is the only spelling carrying the identity contract, and that contract is what an audit reader needs. Spelling (c)’s six per-purpose workers are disclosed and NOT aliased onto the single worker identity, because they are a decomposition rather than a second name — collapsing six identities into one alias would hide a real structural difference the client has to decide about. Why the collision is not cosmetic, in the source’s own rule: the audit “records identity and action, never ‘acting as role’”, so an audit row keyed on one spelling is unfindable by a search on another, and three spellings across three chapters is three unfindable populations.',
    pins: [],
  },
  {
    id: 'S10-DOH10-AUDITWRITE-001',
    // A BUILD-LOCAL KEY, SAME GROUND AS `S10-IDENT-SCHED-001`. The source
    // raises no decision for this collision, so `decisionRef` is null and no
    // `DEC-*` identifier is minted -- minting one would put a decision
    // identifier into a register the client would then search the source for
    // and not find. `S10-` does not occur in the frozen source.
    decisionRef: null,
    alias: null,
    question:
      'May a Read-only Auditor write, when MOD-DOH-10’s permission matrix grants that role two writes and two acceptance criteria say the role writes nothing anywhere?',
    readings: [
      {
        text: 'The matrix grants them. `MOD-DOH-10` row 2, "Set own channel preferences within policy", and row 5, "Mute a digest section", both read `Allowed` in the Read-only Auditor column — the same value they carry for all five roles. Both acts are writes; every one of the twelve acts on that card is a write, so neither cell can be read as a permissive value landing on a read.',
        locator: 'MOD-DOH-10 row 2 · L28690 · row 5 · L28693 (header L28687)',
      },
      {
        text: 'Two acceptance criteria refuse them, in both of the terms that matter — the capability and the rendering. `AC-AUTH-003`: "The Read-only Auditor holds no write capability anywhere and no Client Command Center access at all." `AC-DOH-011-2`: "A Read-only Auditor session renders no write control anywhere in the Hub, including in the tenant administration area." Neither carves out a preference, and the second is about what a session DRAWS, so it cannot be satisfied by permitting the act and hiding the control.',
        locator: 'AC-AUTH-003 · L10426 · AC-DOH-011-2 · L25695',
      },
    ],
    adopted:
      'Neither reading is presented as the answer, and the build declines the one action that would decide it silently: no live write control renders for this role on those two rows. They render LOCKED — visible, inoperable, with both criteria named inline and the matrix cell quoted beside them — which is a client-delegated choice under APP-012 rather than a claim the source settled it. The asymmetry is deliberate and is the whole reason this is not a coin toss: rendering the control would ship a failure of two NAMED criteria, while withholding it contradicts a matrix cell that no criterion cites. The same two criteria also decide the opposite-shaped case on the same card — L28699 gives that role `Read-only` on acknowledgement, a token that would otherwise render as disabled-for-now over an act withheld always — so the pair is load-bearing in both directions and cannot be read as boilerplate.',
    pins: [],
  },
] as const satisfies readonly OpenDecision[]

/**
 * The ids as a closed set in their own right, with the same real
 * exhaustiveness check every vocabulary in `@/studio/vocab` carries: an id
 * added to the union and not listed here stops `Exclude` resolving to `never`
 * and fails the type-check. (It named an ordinal — "a forty-fourth id" — which
 * is the canon's size wearing a different grammar, and went stale on the next
 * record.)
 *
 * It is declared as its own literal list rather than mapped off
 * `OPEN_DECISIONS`, because a check derived from the array it is meant to
 * police can only ever pass.
 */
export const OPEN_DECISION_IDS = [
  'D1',
  'D2',
  'DEC-AUDSTU-001',
  'D4',
  'D5',
  'D6',
  'DEC-WFROLL-001',
  'D8',
  'D9',
  'D10',
  'D11',
  'DEC-CAPAUTH-001',
  'DEC-DELEG-001',
  'DEC-LANEB-001',
  'DEC-LIB-001',
  'DEC-WIDIFF-001',
  'DEC-LIBREV-001',
  'DEC-LANEBAUTH-001',
  'DEC-CAP-001',
  'DEC-TAX-002',
  'D21',
  'D22',
  'DEC-STUXREF-001',
  'DEC-TENGRANT-001',
  'DEC-ROLE-001',
  'DEC-RELAUTH-001',
  'DEC-EMBED-001',
  'DEC-ARCH-001',
  'D29',
  'DEC-AUDITSUP-001',
  'DEC-AUDITQM-001',
  'DEC-AUDITHASH-001',
  'DEC-AUDITOFF-001',
  'DEC-NOTIFCOUNT-001',
  'DEC-NOTIFSEV-001',
  'DEC-NOTIFPRI-001',
  'DEC-NOTIFPREF-001',
  'DEC-NOTIFACK-001',
  'DEC-SCHED-002',
  'DEC-SCHED-011',
  'DEC-FINISH-002',
  'DEC-CMDEXP-001',
  'S10-IDENT-SCHED-001',
  'S10-DOH10-AUDITWRITE-001',
] as const satisfies readonly DecisionId[]

const _decisionIdsExhaustive: Exclude<DecisionId, (typeof OPEN_DECISION_IDS)[number]> extends never ? true : never = true
void _decisionIdsExhaustive

const BY_ID = new Map<DecisionId, OpenDecision>(OPEN_DECISIONS.map((d): [DecisionId, OpenDecision] => [d.id, d]))

/**
 * The honest stand-in for an id with no record. It cannot be reached while
 * `stu-vocab.test.ts` holds -- that test asserts the record ids ARE the
 * declared set -- and it exists so that a registry defect discloses itself on
 * screen instead of throwing inside a render. A typed failure, never a throw.
 */
function missingRecord(id: DecisionId): OpenDecision {
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

export function decisionRecord(id: DecisionId): OpenDecision {
  return BY_ID.get(id) ?? missingRecord(id)
}
