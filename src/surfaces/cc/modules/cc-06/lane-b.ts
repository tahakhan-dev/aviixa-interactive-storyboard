import type { DecisionReading } from '@/disclosure/decisions'

/**
 * THE LANE B APPLICATION PATH, THE TWO §26.7 ROWS THAT LOOK LIKE ITS DENIAL,
 * AND EVERY PLACE ANOTHER TABLE ANSWERS ONE OF `MOD-CC-06`'S EIGHT ROWS
 * DIFFERENTLY.
 *
 * ══ THE TRAP THIS FILE EXISTS TO NOT FALL INTO ═══════════════════════════
 *
 * §26.7's cross-surface matrix carries TWO rows about this module's subject,
 * and read one at a time they say opposite things about the Command Center:
 *
 *   L49593  Lane B configured values   Client Command Center column:
 *           `Allowed with conditions` — the decision, Quality Manager and above
 *   L49595  Tenant settings            Client Command Center column:
 *           `Explicitly prohibited` — editing configuration is deliberately
 *           impossible here
 *
 * A reader who opens only the second builds no Lane B path at all. `AC-CC-060`
 * (L35470) is then asserted against nothing: "The surface holds exactly one
 * outbound configuration path, the Lane B application path, and no other
 * configuration write is reachable" — a criterion with two clauses, of which
 * a prohibition-only reading satisfies the second by making the first false.
 * The one rule this surface must enforce is enforced against an empty set,
 * and a gate over it passes on a module that does nothing.
 *
 * SO BOTH ROWS ARE RECORDED AND THE PATH IS BUILT. They are not a
 * contradiction and this file does not disclose them as one: they are rows of
 * a RECORD-TYPE matrix and they name two different records. `AC-CC-060` is
 * the reconciliation and the source states it twice more — L35462, "exactly
 * one outbound arrow into configuration", and L37387, this module "writes the
 * only outbound configuration path described in section 21.2.2".
 *
 * ── AND THEY ARE TWO ROWS APART, NOT ONE ─────────────────────────────────
 *
 * The dispatch that commissioned this module said L49595 "sits one row below
 * L49593". It sits TWO below: L49594 is the `Sync conflicts` row, a data row
 * of the same table, and it is `MOD-CC-10`'s subject rather than this
 * module's. The distance is not load-bearing for anything built here, and the
 * correction is recorded because a locator stated wrongly in a dispatch is
 * how a wrong locator reaches a comment.
 *
 * ══ WHAT THE PATH IS, AND WHAT IT IS NOT ═════════════════════════════════
 *
 * It is a MODEL of the landing steps, not a mutation. This is a storyboard;
 * there is no configuration record to write and no publication pipeline to
 * call. What the source specifies and what is therefore buildable is the
 * ORDER: which steps follow an approval, in which of the two landings, each
 * with the line that states it. `ccLaneBApplication` returns that order, and
 * refuses to return one where `DEC-PKGFIELD-001` leaves the field unassigned.
 *
 * The refusal is the part that matters. `FUNC-CC-0604-3-1` (L37431) renders a
 * proposal NOT DECIDABLE where the affected field's package assignment is not
 * enumerated, and states its own reason on that line: "Purpose: refuse to
 * invent a contractual behaviour." A path that guessed a landing for an
 * unenumerated field would be exactly the invention the decision is open
 * about. Those quotation marks previously held a paraphrase of that clause
 * rather than the clause — same identifier, same substance, this comment's
 * own words — which is how a comment comes to be quoted as the source.
 */

/* ==================================================================== *
 * 1. THE CONFIGURATION BOUNDARY — BOTH §26.7 ROWS, HEADER-KEYED.
 * ==================================================================== */

/**
 * §26.7's own seven column headers, verbatim from L49574, in its order.
 * Header-keyed and not positional: this table runs SURFACES across the top
 * where every chapter-21 module matrix runs PERSONAS, so a positional read of
 * one against the habit of the other lands on a different kind of thing
 * entirely rather than on a wrong cell.
 */
export const CC06_XSURFACE_COLUMNS = [
  'Record type',
  'Single source of truth',
  'Frontline Worker Application',
  'Delivery Operations Hub',
  'Standards and Operations Studio',
  'Client Command Center',
  'Super Admin platform console',
] as const satisfies readonly string[]

export type Cc06XSurfaceColumn = (typeof CC06_XSURFACE_COLUMNS)[number]

export interface Cc06XSurfaceRow {
  /** Verbatim `Record type` cell — the row's own subject. */
  readonly recordType: string
  /** Verbatim `Single source of truth` cell. */
  readonly singleSourceOfTruth: string
  /** Verbatim `Client Command Center` cell, INCLUDING its note. Never split. */
  readonly commandCenterCell: string
  /** The line this row occupies in the frozen source. */
  readonly line: number
}

/**
 * The two rows, and the third that sits between them so the distance is a
 * fact on the record rather than an assertion in a comment.
 */
export const CC06_XSURFACE_ROWS = [
  {
    recordType: 'Lane B configured values',
    singleSourceOfTruth:
      'The surface that owns the value — Studio for package-borne, server-side settings otherwise',
    commandCenterCell: '`Allowed with conditions` — the decision, Quality Manager and above',
    line: 49593,
  },
  {
    recordType: 'Sync conflicts',
    singleSourceOfTruth:
      'Frontline offline writes create them; Client Command Center resolves; Delivery Operations Hub audits',
    commandCenterCell:
      '`Allowed with conditions` — Quality Manager and above resolve; Supervisors view only',
    line: 49594,
  },
  {
    recordType: 'Tenant settings',
    singleSourceOfTruth: 'The tenant-configuration registry, one object per tenant',
    commandCenterCell:
      '`Explicitly prohibited` — editing configuration is deliberately impossible here',
    line: 49595,
  },
] as const satisfies readonly Cc06XSurfaceRow[]

/** The two of the three this module's boundary is drawn from. */
export const CC06_GRANTING_ROW_LINE = 49593
export const CC06_PROHIBITING_ROW_LINE = 49595

/**
 * THE ROWS ARE A BOUNDARY, NOT A CONTRADICTION, AND SAYING SO IS THE WORK.
 *
 * The same shape `MOD-CC-04` records for `AC-CC-221` and its row 12, reached
 * from the other side: there, a criterion about a RENDERING was about to be
 * read as a prohibition on an ACT; here, a prohibition on one RECORD is about
 * to be read as a prohibition on a different record's decision. Both errors
 * delete something the source requires be drawn.
 */
export const CC06_CONFIGURATION_BOUNDARY = {
  criterion: 'AC-CC-060',
  criterionLine: 35470,
  criterionText:
    'The surface holds exactly one outbound configuration path, the Lane B application path, ' +
    'and no other configuration write is reachable.',
  grantingRowLine: CC06_GRANTING_ROW_LINE,
  grantingRowGoverns:
    'The record type `Lane B configured values`, whose single source of truth is "the surface ' +
    'that owns the value — Studio for package-borne, server-side settings otherwise". The ' +
    'Command Center cell grants THE DECISION, to a Quality Manager and above, and grants no ' +
    'write: the value lands on the owning record, on the owning surface.',
  prohibitingRowLine: CC06_PROHIBITING_ROW_LINE,
  prohibitingRowGoverns:
    'The record type `Tenant settings`, whose single source of truth is "the tenant-' +
    'configuration registry, one object per tenant". The Command Center cell prohibits editing ' +
    'that object here, and the Studio and the Hub columns on the same row both read `Allowed ' +
    'with conditions`, which is where such an edit is performed.',
  isContradiction: false,
  whyNot:
    'They are rows of a record-type matrix and they name two different records. One grants a ' +
    'decision over Lane B configured values; the other refuses an edit of the tenant-' +
    'configuration registry. Nothing is granted and refused about one object, so the two cannot ' +
    'disagree — and AC-CC-060 is the surface-level statement that holds them together: exactly ' +
    'one outbound configuration path exists, and it is the one L49593 grants.',
  costOfReadingOnlyTheProhibition:
    'No Lane B path is built. AC-CC-060 then has nothing to hold: its second clause — no other ' +
    'configuration write is reachable — is trivially satisfied by a surface with no ' +
    'configuration path at all, and its first clause is false. A gate over the criterion passes ' +
    'on a module that does nothing, which is the failure mode this whole slice is guarding ' +
    'against.',
  alsoStatedAt: [35462, 37387],
} as const

/* ==================================================================== *
 * 2. THE PACKAGE TEST AND THE PATH ITSELF.
 * ==================================================================== */

/**
 * "Where an approved change lands is decided by one question: is the value
 * package-borne — does it travel inside the work package the device carries
 * and evaluates, possibly offline — or server-only?" (L37275).
 *
 * THE THIRD MEMBER IS NOT A THIRD LANDING. It is the state in which the
 * question cannot be answered, and `DEC-PKGFIELD-001` (L37286) is why: the
 * authoritative field-by-field assignment "is carried in the package contract
 * of the Frontline Worker Application Part, and that Part does not enumerate
 * it". Three members rather than two so that the unanswerable case is a value
 * this module can hold, rather than a `null` that some caller defaults.
 */
export const CC06_PACKAGE_TESTS = [
  'package-borne',
  'server-only',
  'not-enumerated',
] as const satisfies readonly string[]

export type Cc06PackageTest = (typeof CC06_PACKAGE_TESTS)[number]

export interface Cc06LaneBStep {
  /** 1-based, the source's own order in the happy path. */
  readonly ordinal: number
  readonly step: string
  /** The line that states this step. */
  readonly sourceRef: string
}

/**
 * The outcome of the path for one approved proposal.
 *
 * TWO ARMS, AND THE SECOND CARRIES NO STEPS AT ALL. A shape with a `steps`
 * array on both arms would let an empty array stand for a refusal, and an
 * empty array is what a bug returns. The refusal arm has a different shape,
 * so a caller that renders steps cannot render a refusal by accident and the
 * compiler says so.
 */
export type Cc06LaneBApplication =
  | {
      readonly kind: 'applies'
      readonly packageTest: 'package-borne' | 'server-only'
      readonly steps: readonly Cc06LaneBStep[]
      /** L37437's own terminal safe state where publication cannot complete. */
      readonly terminalSafeState: string
    }
  | {
      readonly kind: 'not-decidable'
      /** The ONE element that could not be resolved, named for `FB-CC-QUEUE`. */
      readonly missingElement: string
      readonly openDecision: 'DEC-PKGFIELD-001'
      readonly why: string
      readonly sourceRef: string
    }

/**
 * The steps common to both landings, from the numbered chronological workflow.
 * They run AFTER the landing step and are shared because the source shares
 * them: L37323's change-log write and L37324's audit write follow both
 * branches of the diagram at L37347 and L37348.
 */
const AFTER_LANDING: readonly Cc06LaneBStep[] = [
  {
    ordinal: 3,
    step:
      'The change is written to the owning configuration record with full audit and appears in ' +
      'the Studio change log attributed "approved by [user] on agent proposal".',
    sourceRef: 'L37323',
  },
  {
    ordinal: 4,
    step: 'The outcome is written to the Delivery Operations Hub audit trail.',
    sourceRef: 'L37324',
  },
]

const DECIDE_STEP: Cc06LaneBStep = {
  ordinal: 1,
  step: 'The Quality Manager reviews the evidence and the scope and decides.',
  sourceRef: 'L37319',
}

/** Verbatim from L37437, including its lower-case opening word. */
const TERMINAL_SAFE_STATE =
  'the configured value remains unchanged and the approval remains audited as an approval, not ' +
  'as an effect.'

/**
 * THE ONE OUTBOUND CONFIGURATION PATH `AC-CC-060` NAMES.
 *
 * It takes the package test and returns the ordered landing, or refuses. It
 * writes nothing, because nothing on this surface writes: the decision is
 * here and the record is on the surface that owns the value (L49593), which
 * is the same sentence L38657 states for all ten operational actions — "the
 * Command Center is the cockpit, never the engine".
 *
 * THE REFUSAL IS NOT AN ERROR PATH. It is `FUNC-CC-0604-3-1` (L37431) and
 * `AC-CC-268` (L37449), and it renders through `WriteControl`'s
 * `missingElement` branch rather than as an absence: the decision controls
 * are disabled with the missing element named, the item is still in the
 * queue, and the waiting clock is still running. `FB-CC-QUEUE` is the pattern
 * and L37330 gives this module the same shape for an unresolvable scope of
 * impact.
 */
export function ccLaneBApplication(packageTest: Cc06PackageTest): Cc06LaneBApplication {
  if (packageTest === 'not-enumerated') {
    return {
      kind: 'not-decidable',
      missingElement: "the affected field's package-borne or server-only assignment",
      openDecision: 'DEC-PKGFIELD-001',
      why:
        'The package test cannot be executed deterministically for this field. The source states ' +
        'that the authoritative field-by-field assignment is carried in the package contract of ' +
        'the Frontline Worker Application Part, and that Part does not enumerate it. The ' +
        'decision is withheld rather than guessed, and the source gives that refusal its own ' +
        'reason at L37431: "Purpose: refuse to invent a contractual behaviour."',
      sourceRef: 'L37286 · L37331 · L37431',
    }
  }
  if (packageTest === 'package-borne') {
    return {
      kind: 'applies',
      packageTest,
      steps: [
        DECIDE_STEP,
        {
          ordinal: 2,
          step:
            'The platform auto-publishes a patch version and distributes it per the tenant’s ' +
            'adoption timing; in-flight runs finish on their pinned content.',
          sourceRef: 'L37321',
        },
        ...AFTER_LANDING,
      ],
      terminalSafeState: TERMINAL_SAFE_STATE,
    }
  }
  return {
    kind: 'applies',
    packageTest,
    steps: [
      DECIDE_STEP,
      { ordinal: 2, step: 'The change applies immediately.', sourceRef: 'L37322' },
      ...AFTER_LANDING,
    ],
    terminalSafeState: TERMINAL_SAFE_STATE,
  }
}

/**
 * The one thing about the path that is NOT rendered as an outcome: an
 * approval whose publication has not completed. L37333 and L37404 both bind
 * it and they bind it in the same direction — the queue "shows the
 * approved-but-not-yet-published state honestly rather than showing the
 * change as in force". `AC-CC-264` (L37445) is the count on the other side:
 * exactly one patch publication, and no second approval.
 */
export const CC06_APPROVED_NOT_PUBLISHED = {
  state: 'approved-and-awaiting-publication',
  /**
   * THE SOURCE NAMES THIS STATE TWICE AND NOT IN THE SAME WORDS, which a gate
   * found rather than a reading. L37404 and L37437 write
   * `approved-and-awaiting-publication`; L37333 writes
   * `approved-but-not-yet-published`. Same state, two spellings, and a gate
   * asserting either one across all three lines finds two of three. Both are
   * carried; neither is normalised into the other.
   */
  alsoNamed: 'approved-but-not-yet-published',
  neverRenderedAs: 'in force',
  why:
    'An approval is not an effect. The decision commits and is audited; the publication is ' +
    'pipeline machinery that may fail, and where it ultimately cannot complete the configured ' +
    'value remains unchanged. Rendering the change as in force would state that something on ' +
    'the floor changed when nothing did.',
  sourceRefs: ['L37333', 'L37404', 'L37437'],
} as const

/* ==================================================================== *
 * 3. AGING, NEVER EXPIRY.
 * ==================================================================== */

/**
 * `FEAT-CC-0603` (L37420), and the freshness obligation §21.3 assigns it.
 *
 * The stale flag is a COPY to a digest, not a state change on the proposal:
 * "after 30 days, a stale flag copies to the Quality Manager's digest"
 * (L37273). The proposal stays in the queue. `AC-CC-263` (L37444) is the
 * criterion and `FUNC-CC-0603-1-2` (L37423) is the functionality whose whole
 * content is that nothing expires.
 *
 * THE DAY COUNT IS NOT COMPUTED HERE and no clock is read. §21.3's table
 * assigns this module's `Lane B proposal arrival` element the marker
 * obligation "Age in days against the 30-day stale flag" (L35887); that
 * assignment is consumed from `src/surfaces/cc/live/model.ts` rather than
 * restated, so a change to the table changes this module. The storyboard's
 * own age — "Created 12 days ago · stale flag at 30 days" (L37367) — is an
 * illustration and is labelled one wherever it renders.
 */
export const CC06_AGING = {
  staleAfterDays: 30,
  staleFlagIsA: "copy into the Quality Manager's digest",
  expires: false,
  whyNoExpiry:
    'Expiry would erase the evidence of a decision not taken; visible aging makes the ' +
    'non-decision visible instead. A decline, with its categorised reason, is itself ' +
    'remembered: the pattern behind it is proposed less.',
  elementName: 'Lane B proposal arrival',
  sourceRefs: ['L37273', 'L37420', 'L37423', 'L37444'],
} as const

/* ==================================================================== *
 * 4. WHERE ANOTHER TABLE ANSWERS ONE OF THESE EIGHT ROWS DIFFERENTLY.
 * ==================================================================== */

/** Exactly two readings. A third is a type error, not a review comment. */
export type TwoReadings = readonly [DecisionReading, DecisionReading]

export interface Cc06Divergence {
  readonly id: string
  /** The act, in this module's own matrix wording. */
  readonly capability: string
  /** This module's own matrix rows, and the column the disagreement is on. */
  readonly ownRows: readonly number[]
  readonly column: string
  /** The question the tables answer differently. Never rhetorical. */
  readonly question: string
  readonly readings: TwoReadings
  /**
   * Every statement of the question found in the source, with its line. Kept
   * separate from `readings` on purpose: four tables can make two readings,
   * and collapsing statements into readings is how "four different statuses"
   * gets written down for an act that carries two.
   */
  readonly statements: readonly { readonly text: string; readonly line: number }[]
  /** What a client actually sees under each reading. Never a paraphrase. */
  readonly renderedConsequence: string
}

export const CC06_DIVERGENCES = [
  {
    id: 'learned-change-supervisor-decomposition',
    capability:
      'See the Lane B proposal queue / Annotate a proposal / Approve a proposal / Decline a proposal with a categorised reason',
    ownRows: [1, 2, 3, 4],
    column: 'Supervisor',
    question:
      'Is the Supervisor prohibited from the learned-change act, or granted an observing and ' +
      'annotating half of it and prohibited only from the deciding half — and are the four ' +
      'tables disagreeing, or is one of them decomposing what the others state as one row?',
    readings: [
      {
        text:
          'A DECOMPOSITION. §21.9 splits one act into four rows and the Supervisor holds two of ' +
          'them: `Read-only — observe` on seeing the queue and `Allowed with conditions — ' +
          'annotation only, no decision` on annotating, then `Explicitly prohibited` on both ' +
          'approve and decline. §21.1.2 states the same thing in one cell — `Read-only — ' +
          'observe and annotate` — and its note carries BOTH halves, so it is the finer table ' +
          'stated coarsely rather than a different answer. The prose agrees at L37271: ' +
          '"Supervisors observe and annotate; record-affecting authority sits with the Quality ' +
          'Manager".',
        locator:
          'MOD-CC-06 §21.9 rows 1-4 · L37294, L37295, L37296, L37297; §21.1.2 · L35009; prose L37271',
      },
      {
        text:
          'A CONTRADICTION. The two action-keyed tables state one row for the whole act and ' +
          'disagree with each other on it: §21.16 row 3 reads `Explicitly prohibited` and §25.4 ' +
          'row 3 reads bare `Read-only`, with no note and nothing granted. Under §21.16 the ' +
          'Supervisor holds nothing at all here — not the queue, not the annotation — and that ' +
          'cannot be reconciled with a grant of annotation by decomposing anything.',
        locator: '§21.16 row 3 · L38684; §25.4 row 3 · L48446',
      },
    ],
    statements: [
      { text: 'Read-only — observe', line: 37294 },
      { text: 'Allowed with conditions — annotation only, no decision', line: 37295 },
      { text: 'Explicitly prohibited', line: 37296 },
      { text: 'Explicitly prohibited', line: 37297 },
      { text: 'Read-only — observe and annotate', line: 35009 },
      { text: 'Explicitly prohibited', line: 38684 },
      { text: 'Read-only', line: 48446 },
    ],
    renderedConsequence:
      '`src/ui/WriteControl.tsx` draws `explicitlyProhibited` at `BASE_ROLE` as nothing at all ' +
      'and `readOnly` as a disabled control carrying its reason. So under §21.16 a Supervisor ' +
      'opening this queue is shown NOTHING — no queue, no annotation control, no statement that ' +
      'either exists — and under §21.9 the same person sees the queue, sees a live annotation ' +
      'control, and sees the two decision controls absent. It is the ABSENT-versus-DISABLED ' +
      'conflict, and here it decides whether a whole module is visible to a role rather than ' +
      'whether one cell is. Neither reading is chosen.',
  },
  {
    id: 'learned-change-tenant-admin-token',
    capability: 'Approve a proposal',
    ownRows: [3],
    column: 'Tenant Admin',
    question:
      'Is the Tenant Admin explicitly prohibited from the learned-change decision, or is the ' +
      'capability simply unavailable to them?',
    readings: [
      {
        text:
          'Explicitly prohibited. Every one of this module’s eight rows says so for the ' +
          'Tenant Admin, and §21.1.2 and §21.16 agree on the act. Nothing is drawn where the ' +
          'control would be.',
        locator: 'MOD-CC-06 §21.9 · L37296; §21.1.2 · L35009; §21.16 row 3 · L38684',
      },
      {
        text:
          'Unavailable. §25.4 reads `Unavailable` in the Tenant Admin column for all ten ' +
          'operational actions including this one, so the control is present and disabled and ' +
          'carries its own reason.',
        locator: '§25.4 row 3 · L48446',
      },
    ],
    statements: [
      { text: 'Explicitly prohibited', line: 37296 },
      { text: 'Explicitly prohibited', line: 35009 },
      { text: 'Explicitly prohibited', line: 38684 },
      { text: 'Unavailable', line: 48446 },
    ],
    renderedConsequence:
      'The whole Tenant Admin column of §25.4 reads `Unavailable` where §21.16’s reads ' +
      '`Explicitly prohibited`, and the two render oppositely — an absent cell against a ' +
      'present one that explains itself. It is the same column-wide divergence the surface ' +
      'carries on every one of the ten actions rather than anything peculiar to this module, ' +
      'and it is recorded here because this module’s act is one of the ten.',
  },
] as const satisfies readonly Cc06Divergence[]

/* ==================================================================== *
 * 5. THE TWO DECISIONS, AND THEY STAND DIFFERENTLY TO THE CANON.
 * ==================================================================== */

/**
 * `DEC-LANEB-001` IS IN THE SHARED CANON AND IS NOT RESPELLED HERE.
 * `src/disclosure/decisions.ts` carries a record for it, so this module
 * POINTS at it — `<DecisionDisclosure id="DEC-LANEB-001" />` — rather than
 * minting a second spelling. That is the uncommon case on this build and it
 * is the rule the moment it holds.
 *
 * BUT THE CANON'S RECORD IS THE STUDIO'S STATEMENT OF IT, AND §21.9 MAKES A
 * DIFFERENT ONE. Both readings in the canon locate to `card DEC-LANEB-001
 * L33253`, the Studio card, and its `adopted` text names three kinds of value
 * that must route through the full chain: a specification limit, a severity
 * mapping, "or a gate rule". §21.9 raises the same identifier at L37284 with
 * three lettered options and recommends option (c) — and option (c) as §21.9
 * writes it names TWO: "values that cannot alter a specification limit or a
 * severity mapping". The phrase "gate rule" does not occur on L37284 and does
 * occur on L33253.
 *
 * So the identifier is one and the statements are two, and this record says
 * so rather than importing the third element into this surface's reading. It
 * also does not promote §21.9's recommendation to an adoption: L37467 marks
 * it `Client Decision Required` and the canon lists it among
 * `OPEN_DECISION_IDS`.
 */
export const CC06_LANEB_STANDING = {
  decisionRef: 'DEC-LANEB-001',
  inSharedCanon: true,
  canonRecordStatesTheStudioSide: true,
  chapter21Line: 37284,
  studioCardLine: 33253,
  chapter21Recommendation: 'option (c)',
  chapter21Owner: "the client's product owner with the quality lead",
  differenceFromTheCanonRecord:
    'The canon record’s adopted text names a specification limit, a severity mapping or a ' +
    'gate rule. §21.9’s option (c) names a specification limit or a severity mapping and ' +
    'not a gate rule. One identifier, two statements of the same question with different ' +
    'value sets; the difference is imported nowhere and adjudicated nowhere.',
  whyNotRespelled:
    'The canon holds the record. A second spelling under this module would be a fifth table ' +
    'answering the same question, which is the defect this surface already carries four of.',
} as const

/**
 * `DEC-PKGFIELD-001` IS ABSENT FROM THE SHARED CANON, and that absence is
 * load-bearing rather than incidental: the canon's `DecisionId` union has no
 * such member, so `decisionRecord('DEC-PKGFIELD-001')` does not compile and
 * there is nothing to point at. It is disclosed locally, in the
 * `Stu14LocalDisclosure` idiom, and `tests/unit/cc-06.test.ts` asserts the
 * identifier is ABSENT from the canon — so a later slice that lifts it turns
 * this suite red and forces the switch rather than leaving two spellings.
 *
 * `src/surfaces/cc/decisions/disclosure.ts` is this surface's own local
 * register and is NOT edited or extended here; it holds four records and none
 * of them is this one.
 */
export const CC06_PKGFIELD_DISCLOSURE = {
  decisionRef: 'DEC-PKGFIELD-001',
  question:
    'Which configured fields are package-borne and which are server-only, and what does this ' +
    'queue do with a proposal whose field is neither?',
  readings: [
    {
      text:
        'The source’s own examples are authoritative until the enumeration exists: coaching ' +
        'triggers and timing margins are package-borne; escalation timeouts, routing fallback ' +
        'targets, connectivity thresholds and report schedule times are server-only. Every ' +
        'other field requires the enumeration.',
      locator: 'DEC-PKGFIELD-001 · L37286',
    },
    {
      text:
        'The package test cannot be executed deterministically at all until the Frontline Worker ' +
        'Application Part’s package contract enumerates the assignment field by field, ' +
        'which it does not. On this reading the examples are illustrations rather than a ' +
        'partial enumeration, and no field is decidable from them.',
      locator: 'DEC-PKGFIELD-001 · L37286',
    },
  ],
  canonNote:
    'The shared decision canon carries no record for DEC-PKGFIELD-001 and its DecisionId union ' +
    'has no such member, so there is nothing to point at and a local disclosure is the only ' +
    'honest form. The Studio discloses the same identifier locally for the same reason in ' +
    'src/studio/modules/stu-14/rendering.ts, against its own line L33807; this module discloses ' +
    'it against §21.9’s statement at L37286. Two locators, one identifier, no canon record.',
  /** What this module does under the second reading, which is the safer one. */
  behaviour:
    'A proposal whose field the source’s own examples do not cover renders NOT DECIDABLE ' +
    'with the missing element named, and its decision controls are disabled. The item stays in ' +
    'the queue and never expires. Nothing guesses a landing.',
  sourceRefs: ['L37286', 'L37331', 'L37431', 'L37449'],
} as const

/* ==================================================================== *
 * 6. THE BOUNDARY WITH `SCR-CC-13`, WHICH IS ANOTHER TASK'S ROUTE.
 * ==================================================================== */

/**
 * `SCR-CC-13` IS NOT THIS MODULE'S ROUTE AND THIS MODULE APPEARS ON IT.
 *
 * The register row L48398 reads `MOD-CC-06 FEAT-CC-0603, MOD-CC-07` in its
 * `Modules and features shown` column, and `src/surfaces/cc/modules.ts` gives
 * `MOD-CC-07` `slug: 'learning-read-view'`. So the directory
 * `app/command-center/learning-read-view/` belongs to the task that owns
 * `MOD-CC-07`, and this module supplies a component for it to mount.
 * Nothing here builds that route.
 *
 * ── AND THE FEATURE THE REGISTER NAMES IS NOT THE FEATURE THE SCREEN IS ──
 *
 * This is a real divergence inside the source and it was not in any dispatch.
 *
 *  - The register (L48398) names `FEAT-CC-0603`. In §21.9's own feature list,
 *    `FEAT-CC-0603` is **Aging** (L37420) — stale flagging at 30 days and
 *    never expiring. It has nothing to do with a learning view.
 *  - The learning read view is `FEAT-CC-0605` (L37432), and the screen's own
 *    name and purpose in the register are that feature's own words:
 *    `FUNC-CC-0605-1-1` (L37434) exists to "show what the platform has
 *    learned, changing nothing", and L48398's `Purpose` column reads "Read
 *    what the platform has learned, changing nothing".
 *
 * NEITHER READING IS CHOSEN AND THE COMPONENT RENDERS BOTH FEATURES, which
 * costs one section and makes the mount correct under either. Choosing the
 * register would put a stale-flag panel on a screen called "Learning read
 * view"; choosing the card would drop the feature the register names from the
 * only screen that names it.
 */
export const CC06_SHARED_SCREEN_BOUNDARY = {
  screen: 'SCR-CC-13',
  registerLine: 48398,
  registerModulesShown: 'MOD-CC-06 FEAT-CC-0603, MOD-CC-07',
  routeOwnedBy: 'MOD-CC-07',
  routeBuiltHere: false,
  whatThisModuleSupplies:
    'One component, `Cc06LearningReadView`, mounted by the task that owns MOD-CC-07 inside ' +
    'app/command-center/learning-read-view/. It renders both features the two readings name and ' +
    'no route of its own.',
  featureReadings: [
    {
      text:
        'The register names FEAT-CC-0603, which §21.9’s own feature list calls Aging ' +
        '(L37420): flag a proposal stale at 30 days and copy the flag to the digest, and never ' +
        'expire a proposal.',
      locator: '§25.5 register row · L48398 · feature heading L37420',
    },
    {
      text:
        'The screen’s own name and purpose are FEAT-CC-0605’s, the learning read view ' +
        '(L37432): the Lane A refinement log, proposals and their outcomes, case-relevance ' +
        'adjustments and coaching effectiveness. FUNC-CC-0605-1-1 (L37434) states its purpose in ' +
        'the register’s own words — "show what the platform has learned, changing ' +
        'nothing".',
      locator: '§25.5 register row · L48398 · feature heading L37432 · FUNC-CC-0605-1-1 L37434',
    },
  ],
} as const

/**
 * What `FEAT-CC-0605` renders, verbatim from `FUNC-CC-0605-1-1` (L37434).
 * FOUR, counted off the sentence rather than inferred from the feature.
 *
 * THE SOURCE STATES THE SAME FOUR TWICE AND NOT IN THE SAME WORDS, which was
 * found by a gate rather than by reading: the functionality at L37434 writes
 * "proposals and outcomes" and the prose at L37288 writes "proposals and
 * their outcomes". One word, and it is the second item of four. The
 * functionality's wording is the one carried here because a functionality is
 * what a screen renders; the prose variant is recorded rather than
 * normalised, because a paraphrase that is true of a set can be false of the
 * words and this is exactly that shape.
 */
export const CC06_LEARNING_VIEW_CONTENT = [
  'The Lane A refinement log',
  'Proposals and outcomes',
  'Case-relevance adjustments',
  'Coaching effectiveness',
] as const satisfies readonly string[]

/** The prose statement of the same four, and its one differing word. */
export const CC06_LEARNING_VIEW_PROSE_VARIANT = {
  functionalityLine: 37434,
  proseLine: 37288,
  differingItem: 'Proposals and outcomes',
  proseWording: 'proposals and their outcomes',
} as const

/**
 * The one thing the learning view must not offer, and it is a whole
 * functionality: `FUNC-CC-0605-1-2` (L37435) — "Offer no learning on-off
 * switch anywhere", roles prohibited: every role. `AC-CC-269` (L37450) is the
 * criterion and matrix row 6 (L37299) is the cell, whose Tenant Admin note
 * says why: "no such switch exists".
 */
export const CC06_NO_SWITCH = {
  exists: false,
  why:
    'A switch’s main effect would be that the learning loop quietly never starts. The ' +
    'approval queue is the control: nothing reaches configured behaviour without a person ' +
    'approving it here, and Lane A changes no configured value by definition.',
  sourceRefs: ['L37288', 'L37299', 'L37435', 'L37450'],
} as const
