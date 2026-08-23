import type { DecisionReading } from '@/disclosure/decisions'
import { FALLBACK_LOCAL_DISCLOSURES } from '@/fallbacks/disclosure'

import { PROTOCOL_DISCLOSURES } from './protocol'

/* ==================================================================== *
 * §37B — "New Decisions and Open Items Raised by Chapters 36 and 37".
 *
 * The section heading is L81722 and its last content line is the illustrative
 * example at L81765. Its table is the spine of it: header L81730, separator
 * L81731, data L81732 to L81739. EIGHT DATA
 * ROWS, counted one by one rather than inferred from the span — the span
 * says where the table is, not how many rows it has.
 *
 * ── THE COUNT THE SOURCE CONTRADICTS ITSELF ON, CARRIED NOT TIDIED ─────────
 * The business-purpose paragraph exempts one row —
 * L81728 "a decision taken is not the same as a decision owed" — and the
 * coverage statement then counts every row anyway:
 * L81761 "eight open decisions and thirteen preserved contradictions remain".
 * The classification paragraph says it a third way,
 * L81763 "Every item in the table is `Client Decision Required`", which the
 * exemption directly denies of the first row.
 *
 * SEVEN ARE OPEN. EIGHT ARE LISTED. Both numbers are carried below with all
 * four locators and NEITHER IS CHOSEN. `DEC_37B_OPEN_COUNT_READINGS` uses the
 * canon's `DecisionReading`, which has exactly two fields, so there is
 * nowhere on it to mark a winner even by accident.
 *
 * ── WHAT THIS MODULE DOES NOT RE-SPELL ─────────────────────────────────────
 * `DEC-SYNC-001`'s adopted order is `@/frontline/commands`'s
 * `DEC_SYNC_001_ORDER` (L39672) and its disclosure record is
 * `@/offline/protocol`'s. `DEC-FB-008`'s readings are
 * `@/fallbacks/disclosure`'s. Both are imported and checked at load, not
 * copied: a third character-for-character pin is worse than an import,
 * because there is no second spelling to drift.
 *
 * ── THE CLAIM THIS SURFACE MUST NEVER MAKE ─────────────────────────────────
 * Whether a device write can lift a Severity 1 hold is classified three ways
 * at three levels, and `DEC_37B_HOLD_STATE_IS_NOT_OURS` says so while
 * pointing at the two modules that already carry all three. §37B raises no
 * `DEC-FB-*` item at all — measured, zero occurrences of the string between
 * L81722 and L81765 — so filing one here as a §37B decision would be the
 * coverage-map error in its other direction.
 *
 * This module is data. It computes nothing and decides nothing.
 * ==================================================================== */

/**
 * The five column headings, exactly as the header row spells them:
 * L81730 "| Identifier | Question | Why it matters | Recommendation | Decision owner |"
 *
 * Header-keyed, never positional — the cells below are a total `Record` over
 * these, so a blank cell is untypeable and a column cannot silently shift.
 */
export const DEC_37B_COLUMNS = [
  'Identifier',
  'Question',
  'Why it matters',
  'Recommendation',
  'Decision owner',
] as const satisfies readonly string[]

export type Dec37bColumn = (typeof DEC_37B_COLUMNS)[number]

/** The eight identifiers the table lists, in table order. */
export type Dec37bId =
  | 'DEC-SYNC-001'
  | 'DEC-SYNC-002'
  | 'DEC-SYNC-003'
  | 'DEC-SYNC-004'
  | 'DEC-SYNC-005'
  | 'DEC-SYNC-006'
  | 'DEC-OFF-001'
  | 'DEC-OFF-002'

export interface Dec37bRow {
  readonly identifier: Dec37bId
  /** The frozen-source line this row is transcribed from. */
  readonly line: number
  readonly cells: Readonly<Record<Dec37bColumn, string>>
}

export const DEC_37B_TABLE = [
  {
    identifier: 'DEC-SYNC-001',
    line: 81732,
    cells: {
      Identifier: '`DEC-SYNC-001`',
      Question:
        'Does a reconnecting device upload captures before or after pulling commands',
      'Why it matters':
        "Determines whether a suspended worker's brief window or an unsynced capture's brief risk is accepted; both stated safety rules pull opposite ways",
      Recommendation:
        "**Adopted, not open.** Split by urgency: stop-class commands first — suspension in all three states, device de-authorisation and remote wipe, any tenant compliance stop — then the full capture upload, then the enabling classes of lot release, reassignment or substitution, qualification clearance and version change. Carried in the canon's register and in §51.0; the full card is §36.2",
      'Decision owner':
        'Adopted 2026-08-14 by the party commissioning this blueprint; ratification with client platform leadership and the quality lead before the Frontline Functional Specification closes item E3',
    },
  },
  {
    identifier: 'DEC-SYNC-002',
    line: 81733,
    cells: {
      Identifier: '`DEC-SYNC-002`',
      Question: 'Command expiry horizons per command class',
      'Why it matters': 'Prevents a stale reassignment applying to a finished run',
      Recommendation:
        "Tenant-set within a platform ceiling, matching the platform's established pattern",
      'Decision owner': 'Client platform leadership with the tenant-configuration registry owner',
    },
  },
  {
    identifier: 'DEC-SYNC-003',
    line: 81734,
    cells: {
      Identifier: '`DEC-SYNC-003`',
      Question:
        'Recovery Time Objective and Recovery Point Objective for the sync service',
      'Why it matters':
        'Determines redundancy investment and what may be contractually promised to a regulated tenant',
      Recommendation:
        'Internal engineering target at V1, converting to a contractual objective at the first regulated tenant',
      'Decision owner': 'Client platform leadership with the commercial owner',
    },
  },
  {
    identifier: 'DEC-SYNC-004',
    line: 81735,
    cells: {
      Identifier: '`DEC-SYNC-004`',
      Question: 'Maximum offline duration before a device is treated as lost',
      'Why it matters':
        'Needed by the wipe interaction, stuck-run closure and fleet alerting; the three existing windows answer different questions',
      Recommendation: 'A distinct tenant-set device-lost horizon within a platform ceiling',
      'Decision owner': 'Client platform leadership with the fleet operations owner',
    },
  },
  {
    identifier: 'DEC-SYNC-005',
    line: 81736,
    cells: {
      Identifier: '`DEC-SYNC-005`',
      Question: 'Retry budget and dead-letter threshold',
      'Why it matters':
        'An infinite retry loop is forbidden, so a bound must exist; too tight a bound dead-letters recoverable records',
      Recommendation: 'A server-measured time box with a platform-set bound',
      'Decision owner':
        'Client platform leadership with the Frontline Functional Specification engineering owner',
    },
  },
  {
    identifier: 'DEC-SYNC-006',
    line: 81737,
    cells: {
      Identifier: '`DEC-SYNC-006`',
      Question: "The numeric cap on the sync-conflict review panel's visible list",
      'Why it matters':
        'Too small hides conflicts; too large invites bulk acceptance as a substitute for review',
      Recommendation: 'A single platform value at V1, converting to tenant-set if feedback demands',
      'Decision owner': 'Client product owner with the Command Center design owner',
    },
  },
  {
    identifier: 'DEC-OFF-001',
    line: 81738,
    cells: {
      Identifier: '`DEC-OFF-001`',
      Question:
        'Platform default, floor and ceiling for the qualification clearance duration',
      'Why it matters':
        'Without bounds a tenant could make the qualification gate decorative, which the configurability principle forbids',
      Recommendation:
        "Tenant-set with a ceiling aligned to the offline trust window's ceiling",
      'Decision owner':
        'Client quality lead with the floor-register owner; a floor-register change is critical-class and needs root approval',
    },
  },
  {
    identifier: 'DEC-OFF-002',
    line: 81739,
    cells: {
      Identifier: '`DEC-OFF-002`',
      Question:
        'Number of failed personal-identification-number attempts before lockout, and the lockout duration',
      'Why it matters':
        'A security value that affects floor productivity directly; too strict locks workers out mid-shift, too loose weakens a shared-device credential',
      Recommendation:
        'Platform-set default with a tenant-tightening option, consistent with the configurability principle',
      'Decision owner':
        'Client platform leadership with the deep security pass accompanying the Frontline Functional Specification, item E10',
    },
  },
] as const satisfies readonly Dec37bRow[]

/**
 * The eight identifiers as a runtime value, so the absent-from-canon gate
 * compares two arrays rather than restating literals it took from the value
 * under test.
 */
export const DEC_37B_IDS = [
  'DEC-SYNC-001',
  'DEC-SYNC-002',
  'DEC-SYNC-003',
  'DEC-SYNC-004',
  'DEC-SYNC-005',
  'DEC-SYNC-006',
  'DEC-OFF-001',
  'DEC-OFF-002',
] as const satisfies readonly Dec37bId[]

const _idsExhaustive: Exclude<Dec37bId, (typeof DEC_37B_IDS)[number]> extends never
  ? true
  : never = true
void _idsExhaustive

/* ==================================================================== *
 * HOW MANY ARE OPEN. BOTH READINGS, ALL FOUR LOCATORS, NEITHER CHOSEN.
 * ==================================================================== */

/**
 * The two readings of the same table. `DecisionReading` has exactly two
 * fields — text and locator — and no third in which one could be marked the
 * answer. That is the whole reason this uses the canon's type rather than a
 * local one with a `count` field somebody would eventually fill in.
 */
export const DEC_37B_OPEN_COUNT_READINGS = [
  {
    text:
      'EIGHT, the number the section states. The table carries eight data rows, counted row by ' +
      'row, and the coverage statement says in terms that eight open decisions remain. The ' +
      'source classification then says every item in the table is Client Decision Required, ' +
      'which makes the first row open along with the other seven.',
    locator: 'rows L81732-L81739 · coverage statement L81761 · classification L81763',
  },
  {
    text:
      'SEVEN, the number the section implies. The business-purpose paragraph exempts ' +
      'DEC-SYNC-001 by name — it carries an adopted working position and is shown with it — and ' +
      'the row itself opens Adopted, not open. Under that exemption seven of the eight rows are ' +
      'owed and one is taken. The diagram commentary states the same thing a second time: ' +
      'DEC-SYNC-001 is already answered by an adopted working position, so DEC-SYNC-004 is the ' +
      'one still owed.',
    locator: 'exemption L81728 · row L81732 · diagram commentary L81757',
  },
] as const satisfies readonly DecisionReading[]

/* ==================================================================== *
 * WHAT THIS MODULE DOES NOT HOLD, AND WHERE IT IS HELD INSTEAD.
 *
 * A POINTER THAT CAN POINT AT ITSELF IS NOT A POINTER. Every `path` below is
 * outside `src/offline/`, and the covering suite reads the named file and
 * requires it to carry BOTH the identifier and the locator quoted here. A
 * pointer at a neighbour in this directory — or at this file — would be
 * satisfied by this file naming all three identifiers, which it does.
 * ==================================================================== */

export interface HeldElsewhere {
  readonly decisionRef: string
  /** Repo-relative path of the module that holds the record. Never under `src/offline/`. */
  readonly path: string
  /** The frozen-source locator that file itself carries for this decision. */
  readonly locator: string
  readonly why: string
}

export const DEC_37B_HELD_ELSEWHERE = [
  {
    decisionRef: 'DEC-SYNC-001',
    path: 'src/frontline/commands.ts',
    locator: 'L39672',
    why:
      'The adopted order is DEC_SYNC_001_ORDER there, settled in slice 7 from L39672 and read ' +
      'here rather than respelt. Its canon-shape disclosure record, with both source readings, ' +
      'is PROTOCOL_DISCLOSURES in src/offline/protocol.ts. This module adds only what §37B ' +
      'itself adds: the exemption at L81728 and its collision with L81761 and L81763.',
  },
  {
    decisionRef: 'DEC-FB-008',
    path: 'src/fallbacks/disclosure.ts',
    locator: 'L82477',
    why:
      'The hold-state contradiction is chapter 38’s, not §37B’s. Its three readings are ' +
      'held there and imported by identity in src/offline/conflict.ts. §37B raises no DEC-FB ' +
      'item at all, so a record for one here would be this build filing a decision under a ' +
      'section that does not state it.',
  },
] as const satisfies readonly HeldElsewhere[]

export interface AlsoDisclosedIn {
  readonly decisionRef: Dec37bId
  readonly path: string
  /** What that record holds, and why it is not the same record as this one. */
  readonly holds: string
}

/**
 * TWO OF THE SEVEN ARE ALSO DISCLOSED ELSEWHERE, AND THAT IS DECLARED RATHER
 * THAN COLLAPSED.
 *
 * `DEC-OFF-001` and `DEC-OFF-002` each have a record in the offline
 * use-case catalogue, keyed to the group-D entry that RAISES them. This module
 * holds the §37B side, keyed to the closing register that COLLECTS them. Same
 * shape as `DEC-FB-008`, which has a chapter-36 record and a chapter-38 one:
 * two sections state one question and the two records cite different lines.
 *
 * They are not a second spelling of one another — no sentence and no locator
 * is shared beyond the §37B row itself — and merging them would drop what
 * only one side carries. In particular the §37B row asks a WIDER question than
 * the use-case note it collects, and that divergence is this side's.
 *
 * The covering suite requires every other file in `src/` that declares one of
 * these seven to be named here, so a genuinely duplicated record is red and a
 * deliberately paired one is documented.
 */
export const DEC_37B_ALSO_DISCLOSED_IN = [
  {
    decisionRef: 'DEC-OFF-001',
    path: 'src/offline/use-cases/group-a-d/catalogue.ts',
    holds:
      'The use-case side, raised by UC-OFF-037 at L81488, where a clearance expires offline and ' +
      're-blocks at the next gate evaluation. This module holds the §37.1 side: the rule at ' +
      'L80785, the authorization-register row at L80837 with two TBD columns, and the ' +
      'options-and-trade-offs card at L80844, none of which that record cites.',
  },
  {
    decisionRef: 'DEC-OFF-002',
    path: 'src/offline/use-cases/group-a-d/catalogue.ts',
    holds:
      'The use-case side, raised by UC-OFF-033 at L81460. This module holds the measured finding ' +
      'that side has no reason to carry: the identifier has no card anywhere in the document, ' +
      'and the §37B row asks the attempt count AND the lockout duration where the use-case note ' +
      'raises only the attempt count.',
  },
] as const satisfies readonly AlsoDisclosedIn[]

/**
 * THE THREE CLASSIFICATIONS OF ONE SENTENCE, NAMED HERE AND CHOSEN NOWHERE.
 *
 * Whether a device write can lift a Severity 1 hold is stated as fact on its
 * own row, classified derived for the table that carries that row, and
 * recorded as unresolved in chapter 38. All three are already on the record
 * in the two modules named above; this constant exists so that a reader of
 * the §37B surface is told the question exists and told it is not settled
 * here, rather than finding §37B silent and concluding the matter is closed.
 */
export const DEC_37B_HOLD_STATE_IS_NOT_OURS = {
  question:
    'May a later in-specification write, under last-write-wins, discard an earlier Severity 1 classification and so lift the hold it placed?',
  levels: [
    'The row itself, L80192, states it as SoW Fact against §3.3 and §7.9.2: the hold stands and no device write lifts it.',
    'The section’s own Source status, L80233, classifies the per-object authority table carrying that row as Derived Clarification.',
    'Chapter 38, L82477, records the same question as DEC-FB-008 and says in terms that it does not choose.',
  ],
  chosenHere: 'NOTHING. This surface renders that the question is open and points at its holders.',
  heldBy: 'src/fallbacks/disclosure.ts and src/offline/conflict.ts',
} as const

/* ==================================================================== *
 * THE SEVEN RECORDS THIS BUILD IS THE FIRST TO WRITE.
 *
 * `src/disclosure/decisions.ts` carries no record for any of these — not one
 * of the seven is a member of its `DecisionId` union. That file is not
 * this task's to edit; one later task lifts the offline set at once. So these
 * are disclosed HERE, in the canon's own record shape, with `DecisionReading`
 * IMPORTED rather than redeclared, so the lift is a move and not a rewrite.
 * The covering suite asserts every identifier is ABSENT from the canon: the
 * moment one is lifted this suite goes red and forces the switch.
 *
 * NOTHING IS ADOPTED. Not one of these seven has a number in the source, and
 * a number picked by this build would be indistinguishable from one the
 * source stated. `adopted` records what this build does, which in every case
 * is to render the question, its options and its owner, and to invent no
 * value.
 * ==================================================================== */

export interface Dec37bLocalDisclosure {
  /** One of the eight, minus `DEC-SYNC-001`, which is held elsewhere. */
  readonly decisionRef: Exclude<Dec37bId, 'DEC-SYNC-001'>
  readonly question: string
  /** The canon's own reading shape, imported. Two fields, and neither is `answer`. */
  readonly readings: readonly DecisionReading[]
  /** What this build does. Never presented as the source's ruling. */
  readonly adopted: string
  /** Why this is disclosed locally rather than through the shared canon. */
  readonly canonNote: string
}

const canonNote = (ref: string, extra = ''): string =>
  `The shared decision canon at @/disclosure/decisions carries no record for ${ref} — it is ` +
  'not a member of that file’s DecisionId union — and that file is another task’s path. ' +
  'Disclosed here in the canon’s own shape so it can be absorbed without a rewrite, and ' +
  `declared as a gap rather than filed under a neighbouring identifier.${extra}`

export const DEC_37B_LOCAL_DISCLOSURES = [
  {
    decisionRef: 'DEC-SYNC-002',
    question: 'What is the expiry horizon of each of the five command classes?',
    readings: [
      {
        text:
          'The card states the gap and its consequence: step 26 cancels expired commands, but the ' +
          'source states no expiry horizon for any of the five command classes. A qualification ' +
          'clearance carries a tenant-defined duration and can expire on its own terms; a lot ' +
          'release, a reassignment, a suspension and a version change have no stated lifetime, so ' +
          'applying a two-week-old reassignment to a device that finally returns would reassign a ' +
          'run that has since finished. Options: (a) no expiry, with supersession handling the ' +
          'practical cases; (b) a per-class horizon set platform-side; (c) a per-class horizon set ' +
          'per tenant within a platform ceiling. Recommended: (c).',
        locator: 'DEC-SYNC-002 card · L80095',
      },
      {
        text:
          'The §37B row states the same recommendation in one clause — tenant-set within a platform ' +
          'ceiling, matching the platform’s established pattern — and names the owner as client ' +
          'platform leadership with the tenant-configuration registry owner.',
        locator: 'DEC-SYNC-002 row · L81733',
      },
      {
        text:
          'Where it would surface if adopted: the tenant administration area inside the Delivery ' +
          'Operations Hub, beside the offline trust window and the clock-skew threshold, each ' +
          'showing its default, its platform ceiling and the rejection behaviour for a ' +
          'looser-than-floor value. That is conditional on the decision landing tenant-set, and is ' +
          'recorded as a conditional rather than built.',
        locator: 'storyboard L80101',
      },
    ],
    adopted:
      'Nothing. No horizon is invented for any command class. What is settled and is NOT this ' +
      'decision: the five classes themselves and their drain order, which are ' +
      '@/frontline/commands’s. Cancellation of an expired command is protocol step 26 and is ' +
      'reachable; only the threshold that makes a command expired is open.',
    canonNote: canonNote('DEC-SYNC-002'),
  },
  {
    decisionRef: 'DEC-SYNC-003',
    question:
      'What Recovery Time Objective and Recovery Point Objective does the sync service carry?',
    readings: [
      {
        text:
          'The options and the recommendation are stated in the FB-SYNC-01 fallback contract, not ' +
          'in the decision card: (a) no committed objective at V1, monitored only; (b) an internal ' +
          'engineering target not exposed to tenants; (c) a contractual objective per tier. ' +
          'Recommended (b) at V1, converting to (c) at the first regulated-industry tenant. Owner: ' +
          'the client’s platform leadership with the commercial owner for tier exposure.',
        locator: 'FB-SYNC-01 bullet · L80039',
      },
      {
        text:
          'THE TWO SITES POINT AT EACH OTHER AND NEITHER IS THE CARD. The §36.2 entry is a stub ' +
          'that defers to the contract above it, and the contract bullet defers back to §36.2. Of ' +
          'the four decision entries §36.2 writes, this is the only one that states no options of ' +
          'its own.',
        locator: '§36.2 stub L80097 · contract bullet L80039',
      },
      {
        text:
          'The §37B row compresses the recommendation to internal engineering target at V1, ' +
          'converting to a contractual objective at the first regulated tenant, and drops the ' +
          'lettered options entirely.',
        locator: 'DEC-SYNC-003 row · L81734',
      },
    ],
    adopted:
      'Nothing. No objective is invented, and no tier is told one. A storyboard has no sync ' +
      'service to measure, so this is recorded and not enforced.',
    canonNote: canonNote('DEC-SYNC-003'),
  },
  {
    decisionRef: 'DEC-SYNC-004',
    question: 'After how long offline is a device treated as lost?',
    readings: [
      {
        text:
          'The card names three existing windows and refuses all three: the offline credential ' +
          'trust window of approximately 24 hours with a 72-hour ceiling, the record-finish window ' +
          'of 48 hours by default, and the site-wide connectivity-loss protocol of 30, 60 and 120 ' +
          'minutes — and states that none of these is a statement that a device is lost. Options: ' +
          '(a) derive it from the credential trust window; (b) derive it from the record-finish ' +
          'window; (c) a distinct tenant-set device-lost horizon within a platform ceiling. ' +
          'Recommended (c), because credential trust and record finish answer different questions ' +
          'and neither is about the device’s physical fate.',
        locator: 'DEC-SYNC-004 card · L80099',
      },
      {
        text:
          'Three downstream behaviours are named as needing the threshold: step 7’s wipe ' +
          'interaction under DEC-WIPE-001, the stuck-run manual close, and fleet-telemetry ' +
          'alerting. The diagram commentary calls this the item still owed once DEC-SYNC-001 is ' +
          'taken.',
        locator: 'DEC-SYNC-004 card · L80099 · diagram commentary L81757',
      },
    ],
    adopted:
      'Nothing. No device-lost horizon is invented, and none of the three existing windows is ' +
      'reused as one — reusing one would be this build answering the question the card refuses to ' +
      'answer, in the exact way the card says produces misleading alerts.',
    canonNote: canonNote('DEC-SYNC-004'),
  },
  {
    decisionRef: 'DEC-SYNC-005',
    question:
      'What retry budget separates a record still being retried from one that is dead-lettered?',
    readings: [
      {
        text:
          'The bound’s existence is settled and only its size is open: an infinite retry loop is ' +
          'prohibited by the platform’s fallback discipline, and the exact budget is TBD — Client ' +
          'Decision Required.',
        locator: 'quarantine section · L80382',
      },
      {
        text:
          'The card gives three options — (a) a fixed platform-wide attempt count; (b) a ' +
          'time-boxed budget; (c) a tenant-set budget within a platform ceiling — and recommends ' +
          '(b) with a platform-set bound, on the stated ground that a time box needs a clock and ' +
          'the chapter has just established that device clocks are not always trustworthy, so the ' +
          'box must be measured server-side. It also records that this is related to but distinct ' +
          'from DEC-SYNC-002, which concerns command expiry rather than retry.',
        locator: 'DEC-SYNC-005 card · L80441',
      },
      {
        text:
          'The §37B row compresses that to a server-measured time box with a platform-set bound, ' +
          'and drops the letters and the reasoning.',
        locator: 'DEC-SYNC-005 row · L81736',
      },
    ],
    adopted:
      'Nothing. No budget is invented. src/offline/quarantine.ts already refuses to invent one and ' +
      'exports RETRY_BUDGET_IS_OPEN as the marker; that is a marker rather than a disclosure — it ' +
      'carries no readings, no options and no owner — so this is the first record for it and not a ' +
      'second spelling of one.',
    canonNote: canonNote('DEC-SYNC-005'),
  },
  {
    decisionRef: 'DEC-SYNC-006',
    question:
      'What is the numeric cap on the sync-conflict review panel’s visible list?',
    readings: [
      {
        text:
          'The cap itself is SoW Fact — at scale the panel caps the visible list, most recent ' +
          'first, with a count — and only its value is open. The card gives three options: (a) a ' +
          'fixed platform value; (b) a tenant-set value within a platform ceiling; (c) an adaptive ' +
          'cap based on the reviewing session. Recommended (a) at V1, converting to (b) if tenant ' +
          'feedback demands it, because a single well-chosen value is easier to validate against ' +
          'real reconnection volumes than a setting nobody knows how to tune.',
        locator: 'DEC-SYNC-006 card · L80504',
      },
      {
        text:
          'THE STORYBOARD PRINTS A NUMERAL AND SAYS IT IS NOT ONE. The overflow state is written ' +
          'as showing the fifty most recent of nine hundred and twelve conflicts, with the numeral ' +
          'standing for whatever DEC-SYNC-006 settles. A build that read fifty as the cap would be ' +
          'shipping a contractual value the source explicitly declined to state.',
        locator: 'SCR-CC-CONF-01 storyboard · L80541',
      },
      {
        text:
          'Classified twice more in the same section: the panel’s Source status carves out the ' +
          'cap value as Client Decision Required against DEC-SYNC-006, and the section’s ' +
          'traceability paragraph repeats it. The §37B row adds the owner: the client product ' +
          'owner with the Command Center design owner.',
        locator: 'source status L80587 · traceability L80601 · row L81737',
      },
    ],
    adopted:
      'Nothing. No cap is invented, and the storyboard’s fifty is recorded as an illustration ' +
      'rather than read as a value. THIS RECORD IS THE FIRST IN THE TREE. ' +
      'src/surfaces/cc/modules/cc-10-s366/matrix.ts names the identifier and states in terms that ' +
      'it does not disclose it; the panel body that would render the cap is slice 9’s. Until ' +
      'that lands, this is where a client looking for DEC-SYNC-006 finds it.',
    canonNote: canonNote('DEC-SYNC-006'),
  },
  {
    decisionRef: 'DEC-OFF-001',
    question:
      'What are the platform default, floor and ceiling for the qualification clearance duration?',
    readings: [
      {
        text:
          'The mechanism is SoW Fact and only the bounds are open: a clearance carries a ' +
          'tenant-defined duration enforced at the next gate evaluation, set at tenant level and ' +
          'applied uniformly, deliberately not per-user — and the duration value itself is ' +
          'described only by example, a shift or a day or two.',
        locator: 'rule two L80785 · authorization register row L80837',
      },
      {
        text:
          'The card states what is at stake and why it may not be left unbounded: the clearance ' +
          'duration is the single value determining how long a worker may perform certified work ' +
          'without a current certification, and leaving it unbounded would let a tenant set a ' +
          'clearance duration of a year, which would make the qualification gate decorative. ' +
          'Options: (a) a single platform-fixed duration; (b) a tenant-set duration with a ' +
          'platform ceiling; (c) a tenant-set duration with a ceiling that varies by ' +
          'Regulated-Industry mode. Recommended (b), with the ceiling aligned to the offline trust ' +
          'window’s ceiling so a clearance can never outlive the cached authority that carries ' +
          'it.',
        locator: 'DEC-OFF-001 card · L80844',
      },
      {
        text:
          'The owner carries a consequence the §37B row keeps: the client’s quality lead with ' +
          'the platform floor-register owner, since a floor-register change is a critical-class ' +
          'action requiring root approval.',
        locator: 'card owner L80844 · row L81738 · use case UC-OFF-037 L81488',
      },
    ],
    adopted:
      'Nothing. No default, floor or ceiling is invented. What is rendered is that the duration ' +
      'exists, is tenant-set and uniform, and that its bounds are owed — which is the state ' +
      'AC-FL-011-5 requires an open decision to be left in.',
    canonNote: canonNote('DEC-OFF-001'),
  },
  {
    decisionRef: 'DEC-OFF-002',
    question:
      'How many failed personal-identification-number attempts trigger lockout, and for how long?',
    readings: [
      {
        text:
          'THE ONLY ONE OF THE EIGHT WITH NO CARD. The identifier occurs five times in the whole ' +
          'document and not one of them is an options-and-trade-offs block: a use-case note, the ' +
          '§37B row, a diagram node, the §37B classification sentence, and the decision index row. ' +
          'The use case defers the card to the closing register of the chapter, and the closing ' +
          'register is a table row.',
        locator: 'use case UC-OFF-033 · L81460 · row L81739 · index L115297',
      },
      {
        text:
          'AND THE ROW ASKS MORE THAN THE NOTE RAISED. The use-case note calls open only the ' +
          'number of failures before lockout; the §37B row asks the number of failed attempts ' +
          'before lockout AND the lockout duration. The duration is open in the row and is raised ' +
          'nowhere else in the document, so which of the two questions DEC-OFF-002 actually names ' +
          'has two answers and this build takes neither.',
        locator: 'note L81460 · row L81739',
      },
      {
        text:
          'What IS settled around it, and is not this decision: lockout is applied by the device ' +
          'after the configured number of failures, reset runs through the Hub-owned ' +
          'managed-credential path and is impossible offline, and AC-37A-403 requires that a ' +
          'lockout never affect another worker’s session or data on a Shared device.',
        locator: 'UC-OFF-033 · L81460',
      },
    ],
    adopted:
      'Nothing. No attempt count and no lockout duration is invented, and the narrower and wider ' +
      'readings of the question are both carried above with their own locators.',
    canonNote: canonNote(
      'DEC-OFF-002',
      ' It is also the one identifier of the eight for which the source itself writes no card, so ' +
        'there is no source text a canon record could be lifted from beyond the row and the note.',
    ),
  },
] as const satisfies readonly Dec37bLocalDisclosure[]

/* ==================================================================== *
 * WHAT THE SECTION SAYS ABOUT ITSELF THAT IS NOT TRUE OF ITSELF.
 *
 * Measured against the frozen source, not inferred. None of these is tidied
 * and none is chosen; they are rendered as the section's own arithmetic.
 * ==================================================================== */

export const DEC_37B_SOURCE_FINDINGS = [
  {
    text:
      'THE SECTION SAYS FOUR AND LISTS FIVE. The source classification names the sync items it ' +
      'draws on as "the four sync items `DEC-SYNC-002` through `DEC-SYNC-006` proposed in §36.2, ' +
      '§36.5 and §36.6". That range is five identifiers, and all five have rows in the table ' +
      'above. Same shape as AC-CC-407’s three ' +
      'prohibitions listing four: the enumeration is carried, the count word is recorded as a ' +
      'miscount, and neither number is adopted as the source’s intent.',
    locator: 'L81763',
  },
  {
    text:
      'THE SENTENCE DESCRIBES A LIST IT DOES NOT DESCRIBE. The same sentence says the ' +
      'contradiction list is drawn from the canon’s register plus DEC-OFF-001, DEC-OFF-002 and ' +
      'the sync items. The contradiction list one line above holds thirteen identifiers and not ' +
      'one of those seven is among them — swept over the line, zero occurrences of DEC-OFF-001, ' +
      'DEC-OFF-002 or DEC-SYNC-002 through DEC-SYNC-006. The thirteen it does hold are exactly ' +
      'the thirteen preserved contradictions the coverage statement counts.',
    locator: 'contradiction list L81759 · classification L81763 · coverage statement L81761',
  },
  {
    text:
      'THE DIAGRAM CARRIES NINE SOURCE NODES FOR AN EIGHT-ROW TABLE. Counted node by node, the ' +
      'dependency flowchart’s source nodes are all eight table identifiers and one more: ' +
      'DEC-STORE-001, storage-full behaviour, reaching blocker OFF-BLK-05 and use case ' +
      'UC-OFF-061. DEC-STORE-001 has no row in the table — it is on the preserved-contradiction ' +
      'list instead — so the diagram and the table are two different sets of what this section ' +
      'raises. A tenth decision, DEC-WIPE-001, is named in a target node as an interaction ' +
      'rather than drawn as a source.',
    locator: 'diagram L81741-L81755 · DEC-STORE-001 node L81754 · table L81732-L81739',
  },
  {
    text:
      'THE DECISION INDEX RECONCILES, FOR ALL EIGHT, AND SAYING SO IS PART OF THE DISCLOSURE. ' +
      'Every one of the eight index rows states a reference count that matches a measured count ' +
      'of occurrences over all 122,241 lines — the counts are DEC_37B_INDEX_ROWS below. That is ' +
      'the opposite of DEC-FB-002, where the index counted mentions and never the cards, so the ' +
      'index is usable evidence here and is not usable there.',
    locator: 'index rows L115106-L115111 and L115296-L115297',
  },
] as const satisfies readonly DecisionReading[]

export interface Dec37bIndexRow {
  readonly id: Dec37bId
  /** The decision-index row's own line. */
  readonly line: number
  /** The reference count that row states, and the measured occurrence count it matches. */
  readonly references: number
}

/**
 * The decision index's rows for the eight, transcribed. `references` is the
 * index's own number AND the measured number: the covering suite counts
 * occurrences of each identifier across the whole frozen source and requires
 * both to agree, so a wrong number here is red rather than decorative.
 */
export const DEC_37B_INDEX_ROWS = [
  { id: 'DEC-SYNC-001', line: 115106, references: 288 },
  { id: 'DEC-SYNC-002', line: 115107, references: 11 },
  { id: 'DEC-SYNC-003', line: 115108, references: 12 },
  { id: 'DEC-SYNC-004', line: 115109, references: 9 },
  { id: 'DEC-SYNC-005', line: 115110, references: 6 },
  { id: 'DEC-SYNC-006', line: 115111, references: 8 },
  { id: 'DEC-OFF-001', line: 115296, references: 12 },
  { id: 'DEC-OFF-002', line: 115297, references: 5 },
] as const satisfies readonly Dec37bIndexRow[]

/* ==================================================================== *
 * LOAD-TIME PINS. If a record this module points at moves, this module
 * fails at import rather than quietly keeping a stale pointer.
 * ==================================================================== */

if (!PROTOCOL_DISCLOSURES.some((d) => d.decisionRef === 'DEC-SYNC-001')) {
  throw new Error(
    'src/offline/protocol.ts no longer carries the DEC-SYNC-001 disclosure. This module points ' +
      'at it rather than re-spelling it; if that record moved, this module follows it and does ' +
      'not grow a copy.',
  )
}

if (!FALLBACK_LOCAL_DISCLOSURES.some((d) => d.decisionRef === 'DEC-FB-008')) {
  throw new Error(
    'src/fallbacks/disclosure.ts no longer carries DEC-FB-008. The hold-state readings are held ' +
      'there and pointed at from here; if that record moved, this module follows it and does not ' +
      'grow a copy.',
  )
}
