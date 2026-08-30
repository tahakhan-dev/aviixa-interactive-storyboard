import type { DecisionReading } from '@/disclosure/decisions'

/**
 * THE WRITES THAT ORIGINATE ON THIS SURFACE AND SIT OUTSIDE THE CLOSED SET
 * OF TEN. SIX ARE GRANTED. FOUR OF THE SIX ARE THE SOURCE'S OWN.
 *
 * ── WHY THE REGISTER IS NEITHER FOUR NOR SIX ─────────────────────────────
 *
 * `DEC-CCWRITE-001` names four, and its reading A calls them "the four
 * outside acts". A register that presented six as the source's number would
 * misreport the very decision it exists to disclose; a register of four would
 * hide two granted writes this build found in the matrices. So every entry
 * carries `namedByDecCcWrite001`, and the two counts are computed from that
 * flag rather than typed anywhere.
 *
 * ── THE DECISION IS STATED TWICE, AND BOTH STATEMENTS AGREE ──────────────
 *
 * L35350 is the card (§21.2.1). It is 1,856 characters on one line and
 * carries the whole decision — the contradiction, both readings, the options,
 * the recommendation and the owner. Its four named writes are spread across
 * it, two in the first sentence and two in the second.
 *
 * L38713 restates it inside `MOD-CC-13`'s own card: "The set is closed at ten
 * as a set of *operational actions*, yet several writes originate on this
 * surface and sit outside it: report-format authoring, which the source
 * explicitly excludes; manual close of a stuck run, which the source
 * explicitly excludes; prior-case relevance marks; and optional one-tap
 * feedback on agent outputs." Same four, same order, and it points back to
 * §21.2.1. It states no number at all — "several".
 *
 * ── THE SOURCE'S OWN SPLIT WITHIN ITS FOUR ───────────────────────────────
 *
 * L35350 divides them and the division is in the text rather than imposed on
 * it. Two it "places explicitly outside that set"; of the other two it says
 * "Two further writes originate here and are not enumerated anywhere."
 * `exclusionKind` carries that split.
 *
 * ── THE TWO THIS BUILD ADDS, AND WHY THEY ARE NOT THE SOURCE'S ───────────
 *
 * Both are granted cells in chapter-21 module matrices whose act is not one
 * of the ten and is not one of `DEC-CCWRITE-001`'s four. Both were read
 * header-keyed off their own header lines — L37860 and L38082, each
 * `Capability on this module | Tenant Admin | Supervisor | Quality Manager |
 * Read-only Auditor | Worker` — so the Supervisor and Quality Manager cells
 * below are the third and fourth fields of their rows, not a position
 * inherited from a Frontline matrix.
 */

export type OutsideWriteExclusion =
  /** The source names the act and states that it sits outside the ten. */
  | 'explicitly-excluded'
  /** The source grants the act and enumerates it nowhere. */
  | 'not-enumerated'

export interface OutsideWrite {
  /** The act, in the source's own words. */
  readonly act: string
  /** `true` only for the four `DEC-CCWRITE-001` names at L35350 and L38713. */
  readonly namedByDecCcWrite001: boolean
  /** The section `DEC-CCWRITE-001` attributes it to, or the section that grants it. */
  readonly section: string
  readonly exclusionKind: OutsideWriteExclusion
  /** What the source says about its standing, verbatim where it is quoted. */
  readonly standing: string
  /** Who holds the grant, read from the granting table's own header. */
  readonly granted: string
  /** Every line read for this entry. */
  readonly sourceRefs: readonly string[]
}

export const CC_WRITES_OUTSIDE_THE_TEN = [
  {
    act: 'Report-format authoring',
    namedByDecCcWrite001: true,
    section: '§6.14.2',
    exclusionKind: 'explicitly-excluded',
    standing:
      'L38696, note 2 to the matrix: "Report-format authoring is authoring, not an in-shift operational action, and sits outside this list." It belongs to the Tenant Admin and Quality Manager grants and is specified in section 21.14. AC-CC-410 (L38867) turns it into a criterion: report-format authoring and manual close are not exposed as operational actions.',
    granted:
      'Tenant Admin Allowed and Quality Manager Allowed at L35017 (Author a report format); Supervisor Explicitly prohibited there.',
    sourceRefs: ['L35350', 'L38713', 'L38696', 'L38867', 'L35017', 'L48454'],
  },
  {
    act: 'Manual close of a stuck run',
    namedByDecCcWrite001: true,
    section: '§6.2.6',
    exclusionKind: 'explicitly-excluded',
    standing:
      'L36152: "Manual close is a run-lifecycle act executed on the Delivery Operations Hub run record, linked from the Command Center drill; it is deliberately not one of the ten operational actions." The same line files it under DEC-CCWRITE-001 by name. AC-CC-410 (L38867) names it beside report-format authoring.',
    granted:
      'L36152 — a Supervisor, as an audited act with a mandatory note, on the Hub-owned run record.',
    sourceRefs: ['L35350', 'L38713', 'L36152', 'L38867'],
  },
  {
    act: 'Marking a prior case relevant or not relevant',
    namedByDecCcWrite001: true,
    section: '§6.5.5',
    exclusionKind: 'not-enumerated',
    standing:
      'The decision card places it among the two writes that originate here and are not enumerated anywhere. The granting section files it under DEC-CCWRITE-001 in the same sentence that grants it — L36826: "This is one of the surface-originating writes recorded under DEC-CCWRITE-001 as sitting outside the counted set of ten." It does emit an event, EVT-CC-CASE-MARKED, to a Delivery Operations Hub learning-signal record.',
    granted:
      'Supervisor Allowed and Quality Manager Allowed at L36843 (MOD-CC-04, "Mark a prior case relevant or not relevant"); Tenant Admin, Read-only Auditor and Worker Explicitly prohibited.',
    sourceRefs: ['L35350', 'L38713', 'L36826', 'L36843', 'L35367'],
  },
  {
    act: 'Optional one-tap feedback on agent outputs',
    namedByDecCcWrite001: true,
    section: '§6.8.2',
    exclusionKind: 'not-enumerated',
    standing:
      'L35350 places it among the two that "originate here and are not enumerated anywhere". It emits EVT-CC-FEEDBACK (L35368) to a Delivery Operations Hub learning-signal record, and FUNC-CC-0702-3-1 (L37601) specifies it as one-tap, non-blocking and non-modal.',
    granted:
      'Supervisor Allowed and Quality Manager Allowed at L37508 (MOD-CC-07, "Give optional one-tap feedback on an agent output"); Tenant Admin, Read-only Auditor and Worker Explicitly prohibited.',
    sourceRefs: ['L35350', 'L38713', 'L37508', 'L35368', 'L37601'],
  },
  {
    act: 'Resolve an escalation',
    namedByDecCcWrite001: false,
    section: '§6.10',
    exclusionKind: 'not-enumerated',
    standing:
      'Not one of the ten and not one of DEC-CCWRITE-001’s four. Action 1 of the closed set is ACKNOWLEDGE an alert or escalation (L38665, L38682); resolution is a distinct write. The source holds the two apart elsewhere: §26.7’s row is headed "Escalation acknowledgement state" and its Command Center cell reads "Allowed with conditions — acknowledge from feed or notification, Supervisor and above" (L49589), naming acknowledgement and no resolution at all.',
    granted:
      'L37866, MOD-CC-09’s matrix, read against its header at L37860. Supervisor is NOT a plain grant — the cell reads "Allowed with conditions — where the underlying act is within the Supervisor’s authority". Quality Manager reads "Allowed". Tenant Admin, Read-only Auditor and Worker Explicitly prohibited.',
    sourceRefs: ['L37866', 'L37860', 'L49589', 'L38665', 'L38682'],
  },
  {
    act: 'Flag an automatic resolution as wrong',
    namedByDecCcWrite001: false,
    section: '§6.11',
    exclusionKind: 'not-enumerated',
    standing:
      'Not one of the ten and not one of DEC-CCWRITE-001’s four. Action 5 is "Resolve or Resolve All sync conflicts" (L38669, L38686); flagging a resolution the platform made automatically is a different write, and it opens the Delivery Operations Hub’s append-only correction path rather than altering the sync result — which L38090, the row two below it, prohibits for every role.',
    granted:
      'L38089, MOD-CC-10’s matrix, read against its header at L38082. Supervisor "Allowed" and Quality Manager "Allowed", both plain; Tenant Admin, Read-only Auditor and Worker Explicitly prohibited.',
    sourceRefs: ['L38089', 'L38082', 'L38090', 'L38669', 'L38686'],
  },
] as const satisfies readonly OutsideWrite[]

/** Six. Computed. */
export const OUTSIDE_WRITE_COUNT: number = CC_WRITES_OUTSIDE_THE_TEN.length

/** The four `DEC-CCWRITE-001` names. Computed from the flag, never typed. */
export const OUTSIDE_WRITES_NAMED_BY_THE_SOURCE: readonly OutsideWrite[] =
  CC_WRITES_OUTSIDE_THE_TEN.filter((w) => w.namedByDecCcWrite001)

/** The two this build found in the matrices. Computed from the same flag. */
export const OUTSIDE_WRITES_FOUND_BY_THIS_BUILD: readonly OutsideWrite[] =
  CC_WRITES_OUTSIDE_THE_TEN.filter((w) => !w.namedByDecCcWrite001)

/**
 * The sentence a screen renders above the register, so a reader cannot take
 * six for the source's number. It is built from the two computed counts, so
 * it cannot say "four" while the array holds five.
 */
export const OUTSIDE_WRITE_COUNT_STATEMENT: string =
  `${OUTSIDE_WRITE_COUNT} writes originate on this surface and sit outside the closed set of ten. ` +
  `DEC-CCWRITE-001 names ${OUTSIDE_WRITES_NAMED_BY_THE_SOURCE.length} of them, and its reading A ` +
  `calls those "the four outside acts". The other ${OUTSIDE_WRITES_FOUND_BY_THIS_BUILD.length} are ` +
  `granted cells this build read in chapter-21 module matrices; the source counts neither of them, ` +
  `and neither is presented here as the source's number.`

/* ==================================================================== *
 * `DEC-CCWRITE-001`, DISCLOSED LOCALLY.
 *
 * `@/disclosure/decisions` holds this build's decision canon and carries no
 * record for `DEC-CCWRITE-001`. That file is another task's path and is read
 * here, never written. The `Stu14LocalDisclosure` idiom applies: the readings
 * are carried in a type with exactly two fields, so there is nowhere to mark
 * a winner even by accident, and `tests/unit/cc-actions.test.ts` asserts the
 * identifier is ABSENT from the canon — so a later lift into the canon turns
 * this suite red and forces the switch rather than leaving two spellings.
 * ==================================================================== */

export interface CcLocalDisclosure {
  readonly decisionRef: 'DEC-CCWRITE-001'
  readonly question: string
  readonly readings: readonly DecisionReading[]
  readonly options: readonly string[]
  readonly recommendation: string
  readonly decisionOwner: string
  readonly canonNote: string
}

export const DEC_CCWRITE_001: CcLocalDisclosure = {
  decisionRef: 'DEC-CCWRITE-001',
  question:
    'Is the closed set of ten the complete inventory of Command Center writes, or the inventory of authority-bearing operational actions only?',
  readings: [
    {
      text:
        'Reading A — the ten are the complete inventory of Command Center writes, and the four outside acts are defects in the enumeration.',
      locator: 'DEC-CCWRITE-001 · L35350',
    },
    {
      text:
        'Reading B — the ten are the inventory of authority-bearing operational actions, and authoring, lifecycle and learning-signal writes are legitimately a different class.',
      locator: 'DEC-CCWRITE-001 · L35350',
    },
  ],
  options: [
    '(a) restate the closed set as "ten operational actions plus a named, closed list of non-operational writes"',
    '(b) expand the closed set to fourteen',
    '(c) leave as-is and accept the ambiguity',
  ],
  recommendation:
    'Option (a), because it preserves the source’s own reasoning while closing the enumeration gap [Recommendation — R&D]. Recorded, not adopted: what is at stake is the scope-control promise at L38657 that "adding an action is a scope decision, never a drift", which is weakened if writes can exist outside the counted list without ceremony.',
  decisionOwner: 'The client’s product owner.',
  canonNote:
    'The decision canon carries no record for DEC-CCWRITE-001. Disclosed here rather than filed under a neighbouring identifier, and the covering gate asserts the identifier is absent from the canon so a later lift is forced rather than duplicated.',
}

/**
 * A FINDING THAT BEARS ON OPTION (b), RECORDED BECAUSE IT IS EVIDENCE THE
 * CLIENT WOULD WANT AND NOT BECAUSE IT SETTLES ANYTHING.
 *
 * Option (b) is "expand the closed set to fourteen" — ten plus the four.
 * There are six. Under option (b) as written, the two this build found would
 * still sit outside the expanded set.
 *
 * And §25.4 has already done a version of it once, in the source's own text:
 * the table at L48442-L48456 is headed "Actions and permissions across the
 * ten operational actions" and carries THIRTEEN data rows. Row 11, L48454, is
 * "Author or export a report format" — which is `DEC-CCWRITE-001`'s first
 * outside write, sitting inside a table whose heading counts ten. Rows 12 and
 * 13 are two of the four absolute exclusions. So the source has already put a
 * non-operational write inside a table of the ten without restating the
 * count, which is the drift L38657 warns about, occurring in the source
 * rather than in an implementation.
 */
export const CC_WRITES_OUTSIDE_FINDINGS = [
  {
    finding:
      'DEC-CCWRITE-001’s option (b) expands the closed set to fourteen — ten plus its four. Six writes are granted outside the ten, so option (b) as written would leave two of them outside the expanded set.',
    sourceRefs: ['L35350'],
  },
  {
    finding:
      '§25.4’s table is headed "Actions and permissions across the ten operational actions" (L48440) and has thirteen data rows (L48444-L48456). Row 11 (L48454) is "Author or export a report format", which is DEC-CCWRITE-001’s first outside write placed inside a table of the ten. Rows 12 and 13 (L48455, L48456) are two of the four absolute exclusions and are not actions either.',
    sourceRefs: ['L48440', 'L48444', 'L48454', 'L48455', 'L48456'],
  },
] as const satisfies readonly { readonly finding: string; readonly sourceRefs: readonly string[] }[]
