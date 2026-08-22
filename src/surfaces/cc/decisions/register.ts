/**
 * CHAPTER 21'S DECISION REGISTER, TRANSCRIBED, AND THE TWO IDENTIFIERS IT
 * DOES NOT ACCOUNT FOR.
 *
 * The register is the table at L38940-L38957: a header row, a separator row,
 * and SIXTEEN data rows. Counted, not inferred from the span — six of this
 * build's brief errors were counts read off a span, and the span here is
 * eighteen lines for sixteen rows. The chapter's own coverage statement
 * (L38992) agrees with the count and with the split: "sixteen decisions
 * remain open, five of them raised here", and exactly five rows carry the
 * status `**New, raised here**`.
 *
 * SEVENTEEN DISTINCT `DEC-*` IDENTIFIERS ARE REFERENCED INSIDE THE CHAPTER
 * (L34799-L39017). Sixteen are the register's. The seventeenth is
 * `DEC-CONTLAUNCH-001`, which the chapter names exactly once (L36937, inside
 * `MOD-CC-04`) and never registers.
 *
 * The eighteenth is `DEC-CLEAR-001`, and it is a different kind of absence:
 * it is not among the seventeen at all, because chapter 21 never names it.
 * It is raised in chapter 26 (L49887, inside §26.8.1) and bears on this
 * surface because the act it governs is the tenth of the closed ten (L38691,
 * "Grant a qualification clearance").
 *
 * SO THE ARITHMETIC IS 16 + 1 + 1 = 18, and the two addends are absences of
 * different kinds. A dispatch that describes both as "not in the register"
 * loses that difference: one is a chapter identifier the register omits, the
 * other is a foreign identifier the chapter never mentions. Only ONE of the
 * seventeen is missing from the register.
 *
 * WHAT THIS FILE DOES NOT DO. It transcribes; it adjudicates nothing. The
 * `whereItAppears` strings are the register's own claim about itself, and
 * `tests/unit/cc-decisions.test.ts` re-derives section membership from the
 * frozen source and holds the claim against it rather than trusting it.
 */

export type CcDecisionId =
  | 'DEC-NAME-001'
  | 'DEC-ROLE-001'
  | 'DEC-PLUS-001'
  | 'DEC-GATE-001'
  | 'DEC-REPORT-001'
  | 'DEC-LANEB-001'
  | 'DEC-PKGFIELD-001'
  | 'DEC-NOSHIFT-001'
  | 'DEC-FINISH-001'
  | 'DEC-SYNC-001'
  | 'DEC-WIPE-001'
  | 'DEC-CCWRITE-001'
  | 'DEC-REFRESH-001'
  | 'DEC-CONFLICTCAP-001'
  | 'DEC-CCOFF-001'
  | 'DEC-CCFORM-001'
  | 'DEC-CONTLAUNCH-001'
  | 'DEC-CLEAR-001'

/**
 * Three ways an identifier stands to chapter 21's register, and they are not
 * degrees of one thing.
 *
 * - `registered` — a row of the table at L38940-L38957.
 * - `named-unregistered` — the chapter's prose names it and the register
 *   does not carry it.
 * - `foreign` — the chapter never names it; another chapter raises it and it
 *   governs an act this surface performs.
 */
export type CcRegisterStanding = 'registered' | 'named-unregistered' | 'foreign'

export interface CcDecisionRow {
  readonly id: CcDecisionId
  readonly standing: CcRegisterStanding
  /** The row's own line, or for the two outside it, the line that raises it. */
  readonly line: number
  /** Verbatim from the register's Status column; the raising sentence for the two outside. */
  readonly status: string
  /** Verbatim from the register's "Where it appears" column, where there is one. */
  readonly whereItAppears: string
  /** Verbatim from the register's "Decision owner" column. */
  readonly owner: string
}

export const CC_DECISION_REGISTER = [
  {
    id: 'DEC-NAME-001',
    standing: 'registered',
    line: 38942,
    status: 'Pre-existing',
    whereItAppears: 'Chapter preamble',
    owner: 'Client product owner',
  },
  {
    id: 'DEC-ROLE-001',
    standing: 'registered',
    line: 38943,
    status: 'Pre-existing',
    whereItAppears: '21.1.2, 21.4, 21.11, 21.15, 21.16',
    owner: 'Client product owner with tenant governance lead',
  },
  {
    id: 'DEC-PLUS-001',
    standing: 'registered',
    line: 38944,
    status: 'Pre-existing',
    whereItAppears: '21.1.2 and every permission matrix in this chapter',
    owner: 'Client product owner',
  },
  {
    id: 'DEC-GATE-001',
    standing: 'registered',
    line: 38945,
    status:
      "Pre-existing — adopted working position of 2026-08-14: gating declared per agent in the agent record's governance-binding field; both source readings retained in the card; client ratification outstanding",
    whereItAppears: '21.7, 21.8',
    owner: 'Client product owner with quality lead',
  },
  {
    id: 'DEC-REPORT-001',
    standing: 'registered',
    line: 38946,
    status: 'Pre-existing',
    whereItAppears: '21.14',
    owner: 'Client product owner',
  },
  {
    id: 'DEC-LANEB-001',
    standing: 'registered',
    line: 38947,
    status: 'Pre-existing',
    whereItAppears: '21.9',
    owner: 'Client product owner with quality lead',
  },
  {
    id: 'DEC-PKGFIELD-001',
    standing: 'registered',
    line: 38948,
    status: 'Pre-existing',
    whereItAppears: '21.9',
    owner: 'Client product owner with engineering',
  },
  {
    id: 'DEC-NOSHIFT-001',
    standing: 'registered',
    line: 38949,
    status: 'Pre-existing',
    whereItAppears: '21.1.2, 21.12, 21.15',
    owner: 'Client product owner',
  },
  {
    id: 'DEC-FINISH-001',
    standing: 'registered',
    line: 38950,
    status: 'Pre-existing',
    whereItAppears: '21.3.5',
    owner: 'Client product owner',
  },
  {
    id: 'DEC-SYNC-001',
    standing: 'registered',
    line: 38951,
    status:
      'Pre-existing — adopted working position of 2026-08-14: stop-class commands, then the full capture upload, then the enabling-class commands; both source readings retained in the card; client ratification outstanding',
    whereItAppears: '21.2.5, 21.16',
    owner:
      'Payload semantics deferred to the Functional Specification, which must implement this ordering',
  },
  {
    id: 'DEC-WIPE-001',
    standing: 'registered',
    line: 38952,
    status: 'Pre-existing',
    whereItAppears: '21.16',
    owner: 'Client product owner with engineering',
  },
  {
    id: 'DEC-CCWRITE-001',
    standing: 'registered',
    line: 38953,
    status: '**New, raised here**',
    whereItAppears: '21.2.1, 21.3.5, 21.7, 21.10, 21.14, 21.16',
    owner: 'Client product owner',
  },
  {
    id: 'DEC-REFRESH-001',
    standing: 'registered',
    line: 38954,
    status: '**New, raised here**',
    whereItAppears: '21.3.1, 21.5',
    owner: 'Client product owner with platform operations lead',
  },
  {
    id: 'DEC-CONFLICTCAP-001',
    standing: 'registered',
    line: 38955,
    status: '**New, raised here**',
    whereItAppears: '21.13',
    owner: 'Client product owner with quality lead',
  },
  {
    id: 'DEC-CCOFF-001',
    standing: 'registered',
    line: 38956,
    status: '**New, raised here**',
    whereItAppears: "21.2.3, 21.2.5, and every module's session-offline behaviour",
    owner: 'Client product owner with security lead',
  },
  {
    id: 'DEC-CCFORM-001',
    standing: 'registered',
    line: 38957,
    status: '**New, raised here**',
    whereItAppears: '21.1.4',
    owner: 'Client product owner with security lead',
  },
  {
    id: 'DEC-CONTLAUNCH-001',
    standing: 'named-unregistered',
    line: 36937,
    status:
      'Named once by this chapter and carried in no row of its register. Its own card is section 51.11A, where an adopted working position of 2026-08-14 is recorded.',
    whereItAppears: '21.7',
    owner:
      'Recorded on the card at section 51.11A; the register that would name an owner does not carry the row.',
  },
  {
    id: 'DEC-CLEAR-001',
    standing: 'foreign',
    line: 49887,
    status:
      'Raised in chapter 26 as a new decision and never named by chapter 21. It governs the tenth of this chapter’s closed ten operational actions.',
    whereItAppears: '26.8.1',
    owner: "Client's quality governance lead with the Quality Manager community",
  },
] as const satisfies readonly CcDecisionRow[]

/**
 * TWO ROWS CLAIM A UNIVERSAL THAT THE CHAPTER'S TEXT DOES NOT BEAR OUT, and
 * this is the `DEC-STUCK-001` shape: a decision a module reaches through a
 * coverage statement is not a decision that module's own section states.
 *
 * `DEC-PLUS-001` claims "every permission matrix in this chapter" and is
 * named in eight module sections of twelve. `DEC-CCOFF-001` claims "every
 * module's session-offline behaviour" and is named in one. Both claims are
 * about where the decision BINDS, which is a different assertion from where
 * the identifier is written, and neither is treated here as an error in the
 * source. They are declared so the section-membership gate can hold every
 * other row to the literal standard without being defeated by these two.
 */
export const UNIVERSAL_CLAUSE_ROWS = ['DEC-PLUS-001', 'DEC-CCOFF-001'] as const satisfies
  readonly CcDecisionId[]
