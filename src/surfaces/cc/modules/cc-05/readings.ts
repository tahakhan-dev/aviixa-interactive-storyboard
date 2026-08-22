import type { DecisionReading } from '@/disclosure/decisions'

/**
 * WHERE ANOTHER TABLE ANSWERS ONE OF `MOD-CC-05`'S EIGHT ROWS DIFFERENTLY.
 *
 * FIVE tables in this source answer the same permission question about this
 * module, not the four the common brief enumerates:
 *
 *   §21.8's own matrix, L37076-L37085        — capability-keyed, eight rows
 *   §21.1.2's surface matrix, L35002-L35023  — capability-keyed, `Gate-item decision` at L35008
 *   `MOD-CC-13`'s action matrix, L38680-L38691 — action-keyed, row 2 at L38683
 *   §25.4's action matrix, L48442-L48456     — action-keyed, row 2 at L48445
 *   `MTX-TEN-02c`, chapter 17, L22056-L22070 — MODULE-keyed, this module at L22062
 *
 * THE FIFTH IS THE ONE NO BRIEF IN THIS SLICE NAMES, and it is the sharpest,
 * because it is keyed on the MODULE rather than on a capability: it answers
 * "what does this role hold on `MOD-CC-05`" in one cell, where §21.8 answers
 * it in eight. It gives the Tenant Admin `Read-only`, which §21.8 prohibits on
 * every one of its eight rows, and it gives the Quality Manager `Allowed with
 * conditions`, which §21.8 writes as a bare `Allowed` six times.
 *
 * AND ITS HEADER LIES ABOUT ITS OWN FIRST TWO COLUMNS. L22056 reads `# |
 * Module | Tenant Admin | …`, and the body puts the module IDENTIFIER under
 * `#` and the module NAME under `Module` — the same inversion the
 * command-class table carries, in a different chapter. A header-keyed lookup
 * for `Module` returns "Governance gate queue", not "MOD-CC-05". This
 * module's own suite went red on that before anything here was written, which
 * is the argument for header-keying and then checking what the header
 * actually returned.
 *
 * ── ONE OF THESE DOES HAVE A DECISION IDENTIFIER, AND IT IS NOT MINE ─────
 *
 * `MOD-CC-04`'s equivalent file records that no decision identifier covers its
 * three divergences. This module is different: `MTX-TEN-02c`'s Tenant Admin
 * cell carries the condition key `[K1]`, whose text (L22072) opens
 * "`DEC-TACC-001`: report-format authoring places the Tenant Admin on this
 * surface, and the source does not state whether the Tenant Admin sees the
 * monitoring modules. Until decided, read-only monitoring access is served and
 * no operational action is granted." The decision's own card is at L23069 and
 * names `MTX-TEN-02c`'s Tenant Admin column among its affected cells. So the
 * `Read-only` in that cell is a STATED PLACEHOLDER under an open client
 * decision, not a second opinion — and reading it as a competing grant would
 * be as wrong as ignoring it.
 *
 * `DEC-TACC-001` RECOMMENDS AND DOES NOT ADOPT. L23069's recommendation is
 * "report builder plus read-only monitoring". A recommendation is not an
 * adoption, and `CC05_TENANT_ADMIN_DECISION` below records it as one of two
 * fields that cannot be confused, in the shape the surface's own local
 * disclosure register uses for the same distinction.
 *
 * ── THE SHAPE IS WHAT KEEPS IT HONEST ────────────────────────────────────
 *
 * `DecisionReading` is the canon's own type, imported rather than re-declared.
 * It has exactly two fields, `text` and `locator`, so there is nowhere on a
 * reading to mark it the winner. `readings` is a fixed-length pair, so a third
 * reading is a type error rather than a review comment, and there is no
 * `adopted` arm here at all.
 *
 * `src/surfaces/cc/decisions/disclosure.ts` is task 5's surface-wide local
 * disclosure register and is NOT edited or extended here. Its records are
 * keyed on a `CcDecisionId`, and `DEC-TACC-001` is not one of them —
 * deliberately, because that identifier is chapter 17's and belongs to the
 * whole Tenant Admin column across eleven module cells (L23069), not to this
 * module. It is pointed at from here and spelled nowhere twice.
 */

/** Exactly two readings. A third is a type error. */
export type TwoReadings = readonly [DecisionReading, DecisionReading]

export interface Cc05Divergence {
  readonly id: string
  /** The act, in this module's own matrix wording where it has one. */
  readonly capability: string
  /** This module's own matrix rows the disagreement touches, and the column. */
  readonly ownRows: readonly number[]
  readonly column: string
  /** The question the tables answer differently. Never rhetorical. */
  readonly question: string
  readonly readings: TwoReadings
  /**
   * Every statement of the question found in the source, with its line. Kept
   * separate from `readings` on purpose: five tables can make two readings,
   * and collapsing statements into readings is how "five different statuses"
   * gets written down for a question that carries two.
   */
  readonly statements: readonly { readonly text: string; readonly line: number }[]
  /** What a client actually sees under each reading. Never a paraphrase. */
  readonly renderedConsequence: string
  /** The `DEC-*` identifier covering it, or `null` where none exists. */
  readonly decisionRef: string | null
}

export const CC05_DIVERGENCES = [
  {
    id: 'tenant-admin-on-this-module',
    capability: 'See the gate queue',
    ownRows: [1, 2, 3, 4, 5, 6, 7, 8],
    column: 'Tenant Admin',
    question:
      'Does the Tenant Admin see this module at all — nothing, a read-only view, or a present ' +
      'control that does not confer?',
    readings: [
      {
        text:
          'Explicitly prohibited, and the note says why: not an in-shift actor. The Tenant Admin ' +
          'never holds any capability on this module in any circumstance, so nothing is drawn ' +
          'where a control would be. The module inventory agrees in its own words, naming the ' +
          'Tenant Admin in the "Not a user" column.',
        locator: 'MOD-CC-05 §21.8 · L37078; §21.1.2 · L35008; §21.16 row 2 · L38683; inventory · L35247',
      },
      {
        text:
          'Present and not actionable. MTX-TEN-02c gives the whole module `Read-only` under ' +
          "DEC-TACC-001's stated interim position — read-only monitoring served, no operational " +
          'action granted — and §25.4 gives the gate-item row `Unavailable`, which this build ' +
          'renders as a disabled control carrying its reason.',
        locator: 'MTX-TEN-02c · L22062, condition [K1] · L22072; §25.4 row 2 · L48445',
      },
    ],
    statements: [
      { text: 'Explicitly prohibited — not an in-shift actor', line: 37078 },
      { text: 'Explicitly prohibited', line: 35008 },
      { text: 'Explicitly prohibited', line: 38683 },
      { text: 'Read-only', line: 22062 },
      { text: 'Unavailable', line: 48445 },
    ],
    renderedConsequence:
      '`src/ui/WriteControl.tsx` draws `explicitlyProhibited` at `BASE_ROLE` as nothing at all, ' +
      '`readOnly` and `unavailable` as a present control that explains itself. The two readings ' +
      'therefore render OPPOSITELY, and the stake is the whole module: under the first a Tenant ' +
      'Admin opening this screen sees an empty frame, under the second a queue they can read and ' +
      'not act on. This is the ABSENT-versus-DISABLED conflict, and here it is the only one of ' +
      'the five tables that is keyed on the module rather than on a capability that disagrees.',
    decisionRef: 'DEC-TACC-001',
  },
  {
    id: 'supervisor-see-versus-decide',
    capability: 'See the gate queue / Open a gate item with full context / Approve an item',
    ownRows: [1, 2, 3, 4, 5, 6],
    column: 'Supervisor',
    question:
      'Is §21.8 splitting one permission into a seen half and a decided half, or contradicting ' +
      'the tables that answer it in a single row?',
    readings: [
      {
        text:
          'A DECOMPOSITION. §21.8 answers in six rows what the other tables answer in one: the ' +
          'Supervisor is `Read-only` on seeing the queue and on opening an item with full ' +
          'context, and `Explicitly prohibited` on each of the four acts that decide one. §25.4 ' +
          "and MTX-TEN-02c both give a single `Read-only`, which is the seen half; §21.16 and " +
          'the surface matrix both give a single `Explicitly prohibited`, which is the decided ' +
          'half. On this reading no table is wrong and every one is partial.',
        locator: 'MOD-CC-05 §21.8 rows 1-2 · L37078, L37079; rows 3-6 · L37080-L37083',
      },
      {
        text:
          'A CONTRADICTION. Two tables answer the same one-row question `Read-only` and two ' +
          'answer it `Explicitly prohibited`, two-to-two, and the split is not stated as a ' +
          'decomposition anywhere — §21.8 never says its six rows refine the single row the ' +
          'others carry. On this reading the source disagrees with itself about whether a ' +
          'Supervisor sees the queue.',
        locator: '§25.4 row 2 · L48445 and MTX-TEN-02c · L22062 against §21.16 row 2 · L38683 and §21.1.2 · L35008',
      },
    ],
    statements: [
      { text: 'Read-only — visibility without decision authority (see the queue)', line: 37078 },
      { text: 'Read-only (open an item)', line: 37079 },
      { text: 'Explicitly prohibited (approve)', line: 37080 },
      { text: 'Explicitly prohibited (gate-item decision, surface matrix)', line: 35008 },
      { text: 'Explicitly prohibited (gate-item decision, §21.16)', line: 38683 },
      { text: 'Read-only (decide a gate item, §25.4)', line: 48445 },
      { text: 'Read-only (module-keyed)', line: 22062 },
    ],
    renderedConsequence:
      'Under the decomposition the Supervisor gets a readable queue with every decision control ' +
      'disabled and its reason shown. Under the contradiction one of those two is wrong and the ' +
      'screen either offers a Supervisor nothing or offers them a queue two tables say they may ' +
      'not see. THE CHOICE IS NOT MADE HERE: the common brief records the identical shape on ' +
      "`MOD-CC-10`'s §36.6 split and leaves it open, and this module's tables show that shape " +
      'exactly. §21.8 renders whole, for every role, and the two readings sit beside it.',
    decisionRef: null,
  },
  {
    id: 'quality-manager-conditioned-or-not',
    capability: 'Approve an item / Adjust within bounds and approve / Decline with a categorised reason',
    ownRows: [1, 2, 3, 4, 5, 6],
    column: 'Quality Manager',
    question:
      "Is the Quality Manager's grant on this module unconditional, or conditioned on the " +
      'action-2 authority and the gate policy that resolves the timeout?',
    readings: [
      {
        text:
          'Unconditional. §21.8 writes a bare `Allowed` in the Quality Manager column on all six ' +
          'rows that carry a grant, with no ` — ` and no note. §21.1.2, §21.16 and §25.4 all ' +
          'write a bare `Allowed` on the gate-item row as well.',
        locator:
          'MOD-CC-05 §21.8 · L37078-L37083; §21.1.2 · L35008; §21.16 row 2 · L38683; §25.4 row 2 · L48445',
      },
      {
        text:
          'Conditioned. MTX-TEN-02c writes `Allowed with conditions` `[K9]`, and the condition ' +
          'names the authority level and the timeout defaults: "Gate-item decision — approve, ' +
          'adjust within bounds, or decline with reason — is action 2, Quality Manager and ' +
          'above; gate-item timeout defaults are 10 minutes for Severity 1 and 30 minutes for ' +
          'others, configurable per severity level."',
        locator: 'MTX-TEN-02c · L22062, condition [K9] · L22072',
      },
    ],
    statements: [
      { text: 'Allowed', line: 37080 },
      { text: 'Allowed', line: 35008 },
      { text: 'Allowed', line: 38683 },
      { text: 'Allowed', line: 48445 },
      { text: 'Allowed with conditions', line: 22062 },
    ],
    renderedConsequence:
      'A `startsWith` classifier reads `Allowed with conditions` as `Allowed` and this divergence ' +
      'disappears entirely — the fifth table then agrees with the other four and nothing is ' +
      'disclosed. That is why every token comparison in this module is an exact equality on the ' +
      "cell's own head. Rendered, the difference is whether the three decision controls carry a " +
      'stated condition beside them or nothing at all.',
    decisionRef: null,
  },
] as const satisfies readonly Cc05Divergence[]

/* ==================================================================== *
 * `DEC-TACC-001`, POINTED AT AND NOT RESPELLED.
 * ==================================================================== */

/**
 * The decision that governs divergence one. It is chapter 17's, it is `Client
 * Decision Required`, and it is carried in no file of this build — the canon
 * at `src/disclosure/decisions.ts` holds twenty-nine records and this is not
 * one of them, and task 5's surface register keys on a `CcDecisionId` that
 * does not include it. It is recorded here as a POINTER with its own line,
 * which is what the build did with `DEC-FINISH-001` rather than mint a second
 * spelling.
 *
 * THE RECOMMENDATION AND THE ADOPTION ARE SEPARATE FIELDS BECAUSE THEY ARE
 * SEPARATE THINGS, and a single `position: string` is how a recommendation
 * graduates into an adoption by inattention. `adopted` is `null` because
 * L23069 adopts nothing: it recommends, states its trade-off, and names the
 * client's product owner as the decision owner.
 */
export const CC05_TENANT_ADMIN_DECISION = {
  decisionRef: 'DEC-TACC-001',
  classification: 'Client Decision Required',
  cardRef: 'L23069',
  registerRef: 'L115232',
  /** The condition key that puts it on this module's own cell. */
  conditionKey: 'K1',
  conditionRef: 'L22072',
  question: "The Tenant Admin's Client Command Center presence.",
  interimPosition:
    'Until decided, read-only monitoring access is served and no operational action is granted.',
  recommendation:
    'Report builder plus read-only monitoring, because a Tenant Admin configuring escalation and digest settings benefits from seeing their effect, and read-only carries no authority risk.',
  adopted: null,
  affectedHere:
    "L23069 names MTX-TEN-02c's Tenant Admin column among its affected cells, and eleven module cells depend on it. This module's eight rows all read Explicitly prohibited in the Tenant Admin column, which is one of the three options the decision has not chosen between.",
} as const

/* ==================================================================== *
 * TWO SMALLER THINGS READ OFF THE SOURCE, NEITHER A DIVERGENCE.
 * ==================================================================== */

/**
 * THE MODULE INVENTORY NAMES THE TENANT ADMIN WHERE EVERY OTHER ROW NAMES THE
 * WORKER. §21.1's inventory (L35241-L35255) carries a `Not a user` column, and
 * on twelve of its thirteen rows that column reads "Read-only Auditor — no
 * access; Worker — no access". `MOD-CC-05`'s row (L35247) reads "Read-only
 * Auditor — no access; **Tenant Admin — not an in-shift actor**" and does not
 * name the Worker at all.
 *
 * That is not a permission divergence — §21.8's own matrix prohibits the
 * Worker on all eight rows, and nothing anywhere grants them anything here. It
 * is a SUBSTITUTION in a summary column, and it matters only because it is the
 * one row of the thirteen that states the Tenant Admin's exclusion in prose,
 * which is the exclusion `DEC-TACC-001` is open on. The count is asserted by
 * walking the table rather than trusting this sentence.
 */
export const CC05_INVENTORY_ROW = {
  sourceRef: 'L35247',
  notAUser: 'Read-only Auditor — no access; Tenant Admin — not an in-shift actor',
  principalUser: 'Quality Manager',
  secondaryUser: 'Supervisor — visibility only',
  whatIsUnusual:
    'It is the only row of the thirteen whose "Not a user" column names the Tenant Admin, and the only one that does not name the Worker. Every other row names the Read-only Auditor and the Worker.',
} as const

/**
 * THE TRACEABILITY TABLE USES A DIFFERENT FALLBACK VOCABULARY ENTIRELY.
 *
 * L47534-L47536 carry three rows for this module in the master feature
 * traceability table, and their fallback column reads `FB-APPROVE-01`,
 * `FB-APPROVE-01` and `FB-NOTIF-01` — identifiers that are in neither the nine
 * `FB-CC-*` patterns nor anything §21.8 declares at L37188. The same rows also
 * classify this module "Online-only — web surface, no offline mode", where
 * §21.8 gives it two distinct offline sections and a reconnect section (L37159, L37161, L37163).
 *
 * Recorded, not reconciled, and deliberately NOT folded into the `FB-CC-*`
 * registry: task 3's registry is closed at nine and these are a different
 * chapter's naming scheme, not a tenth member of it.
 */
export const CC05_FOREIGN_FALLBACK_NAMES = {
  sourceRefs: ['L47534', 'L47535', 'L47536'],
  names: ['FB-APPROVE-01', 'FB-NOTIF-01'],
  ownDeclarationRef: 'L37188',
  offlineClaim: 'Online-only — web surface, no offline mode',
  offlineContradictionRefs: ['L37159', 'L37161', 'L37163'],
  note: 'Two identifiers outside the nine-pattern registry, and an online-only classification that §21.8 contradicts in its own two offline sections and its reconnect section. Neither is adopted and neither is added to the registry.',
} as const
