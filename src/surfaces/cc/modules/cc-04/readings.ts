import type { DecisionReading } from '@/disclosure/decisions'

/**
 * WHERE ANOTHER TABLE ANSWERS ONE OF `MOD-CC-04`'S TWELVE ROWS DIFFERENTLY.
 *
 * Four tables in this source answer the same permission question for this
 * surface — §21.7's own matrix (this module's, L36832-L36845), `MOD-CC-13`'s
 * action matrix (L38680-L38691), §25.4's action matrix (L48442-L48456) and
 * §26.7's record-type matrix (L49574-L49601). **No decision identifier covers
 * the disagreement between them.** `AC-CC-502` requires every cell to carry
 * an explicit status and every cell does; that four tables give different
 * statuses to the same act is tested by no acceptance criterion at all.
 *
 * So this file carries readings, never a verdict.
 *
 * ── THE SHAPE IS WHAT KEEPS IT HONEST ────────────────────────────────────
 *
 * `DecisionReading` is the canon's own type, imported rather than
 * re-declared. It has exactly two fields, `text` and `locator`, so there is
 * nowhere on a reading to mark it the winner — not by a `preferred` flag, not
 * by an `adopted` field, not by anything a later hand could add without
 * changing a shared type every canon record depends on. `readings` is a
 * fixed-length pair, so a third reading is a type error rather than a review
 * comment, and there is no `adopted` arm here at all: none of these three
 * divergences is adopted anywhere in the source.
 *
 * `src/surfaces/cc/decisions/disclosure.ts` is the surface's own local
 * disclosure register and is NOT edited or extended here. Its records are
 * keyed on a `CcDecisionId`, and these three divergences have no `DEC-*`
 * identifier to key on — that absence is the finding, and forcing one of them
 * into a register of identified decisions would erase it.
 */

/** Exactly two readings. A third is a type error. */
export type TwoReadings = readonly [DecisionReading, DecisionReading]

export interface Cc04Divergence {
  readonly id: string
  /** The act, in this module's own matrix wording. */
  readonly capability: string
  /** This module's own matrix row, and the column the disagreement is on. */
  readonly ownRow: number
  readonly column: string
  /** The question the tables answer differently. Never rhetorical. */
  readonly question: string
  readonly readings: TwoReadings
  /**
   * Every statement of the question found in the source, with its line. This
   * is separate from `readings` on purpose: three tables can make two
   * readings, and collapsing statements into readings is how "three different
   * statuses" gets written down for a cell that carries two.
   */
  readonly statements: readonly { readonly text: string; readonly line: number }[]
  /** What a client actually sees under each reading. Never a paraphrase. */
  readonly renderedConsequence: string
}

export const CC04_DIVERGENCES = [
  {
    id: 'mark-evidence-reviewed-supervisor',
    capability: 'Mark evidence reviewed',
    ownRow: 9,
    column: 'Supervisor',
    question:
      'Is the Supervisor categorically excluded from marking evidence reviewed, or does the ' +
      'capability simply not confer on them here?',
    readings: [
      {
        text:
          'Explicitly prohibited. The Supervisor never holds this capability in any ' +
          'circumstance, so nothing is drawn where the control would be — a disabled control ' +
          'would invite the belief the right exists somewhere.',
        locator: 'MOD-CC-04 §21.7 · L36842; MOD-CC-13 §21.16 row 7 · L38688',
      },
      {
        text:
          'Unavailable. The capability exists on this screen and does not confer on the ' +
          'Supervisor, so the control is present and disabled and carries its own reason.',
        locator: '§25.4 row 7 · L48450',
      },
    ],
    statements: [
      { text: 'Explicitly prohibited', line: 36842 },
      { text: 'Explicitly prohibited', line: 38688 },
      { text: 'Unavailable', line: 48450 },
    ],
    renderedConsequence:
      "`src/ui/WriteControl.tsx` draws `explicitlyProhibited` at `BASE_ROLE` as nothing at all " +
      'and `unavailable` as a disabled control carrying its reason. The two readings therefore ' +
      'render OPPOSITELY — an absent cell against a present one that explains itself. This is ' +
      'the ABSENT-versus-DISABLED conflict this build has carried since slice 4, and it is at ' +
      'its sharpest here because the mark is a quality signature carried onto the Delivery ' +
      'Operations Hub review queue (AC-CC-227, L37006): a Supervisor who never learns the mark ' +
      'exists cannot ask who holds it.',
  },
  {
    id: 'release-and-request-supervisor',
    capability: 'Release a lot hold / Request a lot hold release with a note',
    ownRow: 5,
    column: 'Supervisor',
    question:
      'Is the Supervisor prohibited from releasing a hold and separately granted a request, or ' +
      'conditionally granted one act that is a request?',
    readings: [
      {
        text:
          'Two capabilities on two rows. The Supervisor is `Explicitly prohibited` from ' +
          'releasing and `Allowed` to request with a note — a prohibition and a grant, not one ' +
          'qualified grant. §26.7 states the same split in one sentence: release is Quality ' +
          'Manager only; Supervisors request with a note.',
        locator: 'MOD-CC-04 §21.7 · L36838 and L36839; §26.7 · L49579',
      },
      {
        text:
          'One capability, conditionally granted. §25.4 carries no request row at all: its ' +
          'single release row gives the Supervisor `Allowed with conditions — request only, ' +
          'with a mandatory note`, folding the request into the release as its condition. ' +
          '§21.16 folds it the other way, as a note on a prohibition: `Explicitly prohibited — ' +
          'may request with a note`.',
        locator: '§25.4 row 4 · L48447; §21.16 row 4 · L38685',
      },
    ],
    statements: [
      { text: 'Explicitly prohibited (release)', line: 36838 },
      { text: 'Allowed (request with a note)', line: 36839 },
      { text: 'Explicitly prohibited — may request with a note', line: 38685 },
      { text: 'Allowed with conditions — request only, with a mandatory note', line: 48447 },
    ],
    renderedConsequence:
      'Under the first reading the release control is ABSENT for a Supervisor and a separate ' +
      'request control is LIVE. Under the second there is one control, present and conditional. ' +
      'The rendered difference is whether a Supervisor is offered one affordance or two, and ' +
      'the three tables give three different tokens for the same person on the same act.',
  },
  {
    id: 'reclassify-severity-displayed-versus-performed',
    capability: 'Reclassify severity',
    ownRow: 12,
    column: 'Quality Manager',
    question:
      'Where is the deviation-classification permission stated, and does the row govern the ' +
      'same thing in both tables?',
    readings: [
      {
        text:
          'A row of a ROLE matrix. `Reclassify severity` runs across the five personas: the ' +
          'Tenant Admin is `Explicitly prohibited` with the destination in the note, the ' +
          'Quality Manager is `Allowed with conditions`, and the other three are prohibited.',
        locator: 'MOD-CC-04 §21.7 row 12 · L36845',
      },
      {
        text:
          'A row of a RECORD-TYPE matrix. `Deviation classification` runs across the six ' +
          'surfaces, and the Client Command Center column reads "`Allowed with conditions` — ' +
          'Quality Manager reclassification with a recorded reason at review time". It names ' +
          'no Tenant Admin, and it does not name the Delivery Operations Hub anomaly record as ' +
          'the destination.',
        locator: '§26.7 · L49578',
      },
    ],
    statements: [
      { text: 'Reclassify severity (role matrix, five persona columns)', line: 36845 },
      { text: 'Deviation classification (record-type matrix, six surface columns)', line: 49578 },
    ],
    renderedConsequence:
      'The dispatch that commissioned this module called L49578 a REPEAT of L36845. It is not ' +
      'one: the two rows have different subjects, different column sets and different content, ' +
      'and only the Quality Manager reading is common to both. Treating the second as a repeat ' +
      'of the first would import a surface-level `Allowed with conditions` into a persona ' +
      'column, and would lose the destination — which only L36845 states.',
  },
] as const satisfies readonly Cc04Divergence[]

/* ==================================================================== *
 * THE SEVERITY BOUNDARY, WHICH IS NOT A CONTRADICTION AND MUST NOT BE
 * DISCLOSED AS ONE.
 * ==================================================================== */

/**
 * `AC-CC-221` GOVERNS THE DISPLAY. ROW 12 GOVERNS AN ACT ON ANOTHER RECORD.
 *
 * L37000 reads, in full: "Severity displayed always equals the on-device
 * classification; no server-side or agent value overrides it." Every word of
 * that binds what this surface DRAWS. It says nothing about whether a
 * reclassification may be performed, and it names no actor who could perform
 * one — it names the two things that may not override the display, a server
 * value and an agent value, and a Quality Manager at review time is neither.
 *
 * L36845's Quality Manager cell grants exactly one act — `Allowed with
 * conditions — at review time on the anomaly record, with a recorded reason`
 * — and the Tenant Admin cell on the same row says where it happens:
 * "reclassification is a review-time act on the Delivery Operations Hub
 * anomaly record". L36881 states the same thing in prose among the alternate
 * paths. So the criterion and the row are about two different records: this
 * surface's displayed value, and the Hub's anomaly record.
 *
 * READING THE CRITERION AS A FLAT PROHIBITION ERASES THE LINK THE ROW
 * REQUIRES. That was an earlier draft's reading of it, and its cost is
 * concrete rather than theoretical: `explicitlyProhibited` renders as nothing
 * at all, so a "flat prohibition" reading draws an EMPTY CELL on the one row
 * of the twelve where the source spells out a destination. It is the same
 * defect as a prohibited-token cell swallowing a link, arrived at from the
 * other side, and both halves of the row are already registered as link-out
 * cells in `src/surfaces/cc/decisions/link-outs.ts`.
 *
 * Disclosing this pair as a contradiction would be a second error on top of
 * the first. It is a boundary, and saying so is the work.
 */
export const CC04_SEVERITY_BOUNDARY = {
  criterion: 'AC-CC-221',
  criterionLine: 37000,
  criterionGoverns:
    'What this surface DISPLAYS. The displayed severity always equals the on-device ' +
    'classification and no server-side or agent value overrides it, in every state of this ' +
    'workspace, including while a reclassification is in progress elsewhere.',
  rowLine: 36845,
  rowGoverns:
    'An act performed at review time on the Delivery Operations Hub anomaly record, by a ' +
    'Quality Manager, with a recorded reason. It is not performed on this surface and this ' +
    'surface renders a link to where it is.',
  isContradiction: false,
  whyNot:
    'The criterion binds a rendering on this surface; the row binds an act on another ' +
    "surface's record. They do not address the same object, so they cannot disagree. The " +
    'classification itself happened on the device at the instant of capture (L36810), which is ' +
    'the value the criterion protects.',
  alsoStatedAt: 36881,
} as const

/* ==================================================================== *
 * A COUNT THIS MODULE DOES NOT COMPUTE, AND WHY.
 * ==================================================================== */

/**
 * "AWAITING QUALITY MANAGER" IS NOT DERIVABLE FROM THESE ROWS.
 *
 * Row 5 (L36838) grants release to the Quality Manager. Row 6 (L36839) grants
 * the REQUEST to the Supervisor AND to the Quality Manager, and
 * `FUNC-CC-0404-1-2` (L36990) agrees word for word: "Roles allowed:
 * Supervisor, Quality Manager."
 *
 * So a Quality Manager may lodge a request that lands as an item for the
 * Quality Manager. `AC-CC-226` (L37005) makes the request "a recorded item
 * for the Quality Manager" without qualifying who lodged it, and the happy
 * path (L36869) describes only the Supervisor's case. A count of "requests
 * awaiting a Quality Manager" therefore cannot distinguish an item awaiting
 * someone else's authority from one a Quality Manager raised to themselves,
 * and the source supplies nothing that would let it.
 *
 * NOTHING HERE COMPUTES THAT NUMBER. The panel renders the request records
 * the source supports — each with its requester and its note — and names this
 * gap beside them. A derived count would be a value invented by this build
 * and rendered as if the source stated it, which is the storyboard defect
 * this whole slice is guarding against.
 */
export const CC04_UNCOMPUTED_COUNT = {
  name: 'Requests awaiting a Quality Manager',
  computed: false,
  why:
    'The Quality Manager is granted BOTH the release (row 5, L36838) and the request (row 6, ' +
    'L36839), and FUNC-CC-0404-1-2 (L36990) lists the Quality Manager among the roles allowed ' +
    'to request. A request record therefore may queue an item for the same person who may ' +
    'grant it, and no field in the source separates the two cases. Any such count would be ' +
    'wrong for an unknowable share of its rows.',
  whatIsRenderedInstead:
    'Each request record with its requester and its mandatory note, unaggregated, and this ' +
    'statement beside them.',
} as const
