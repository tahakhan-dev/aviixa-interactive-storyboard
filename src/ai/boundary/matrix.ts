import { AI_AGENT_ROSTER, aiRosterAgent, type AiAgentId } from '@/ai/agents/roster'
import { aiProhibition } from '@/ai/abilities/prohibitions'
import { matrixCellProvenance } from '@/ai/agents/contracts'
import { aiMode, type AiModeId, type AiModeRow } from '@/ai/modes'
import type { ProvenanceClassId } from '@/ai/provenance/classes'
import { cellFromSource } from '@/policy/columns'
import type { PermissionOutcome } from '@/policy/decision'

/**
 * THE DETERMINISTIC BOUNDARY — what may and may not touch the
 * deviation-triggering path.
 *
 * Section 40.1's supporting matrix. Its header is at L86136 and its data rows
 * follow the separator; the count is walked out of the frozen bytes by
 * `tests/unit/ai-boundary.test.ts` and is not written down here, because a
 * span states where a table is and not how many rows it has.
 *
 * ── ITS AXIS IS `Component`, AND THAT IS WHY IT IS ITS OWN VOCABULARY ──────
 * Every other permission matrix in this slice is indexed by a role or by a
 * surface. This one is indexed by the thing doing the acting — a device layer,
 * a server-side atom, four agents, two humans. Before it was declared, the
 * tree was searched for an existing `Component` axis and for each of these
 * eight names: nothing in `src/`, `app/` or `tests/` declares them. This
 * slice's recurring defect is a vocabulary declared twice, so the search came
 * first.
 *
 * ── THE FOUR AGENT ROWS ARE NOT THE FOUR ROSTER AGENTS ─────────────────────
 * Three of them are, and take their names from `@/ai/agents/roster` rather
 * than being re-typed. The fourth is the TENANT-COMPOSED reasoning agent,
 * which chapter 44's roster does not hold — it is a family, `AI-AGT-COMP-*`
 * at L86038, composed by a tenant rather than shipped by the platform. And
 * the roster's own fourth agent, Vision Reasoning, is not in this matrix at
 * all. Both absences are measured against the frozen source in the covering
 * test rather than asserted here, because a stated absence and an oversight
 * look identical from outside.
 *
 * ── THE UNIFORMITY IS THE CHAPTER'S POINT, SO IT IS COMPUTED ───────────────
 * The agent rows read `Explicitly prohibited` in all four columns. That is
 * the whole argument of section 40.1 and it must be visible as a pattern
 * rather than as several identical-looking rows. `uniformlyProhibitedRows`
 * derives the set from the cells; nothing states how many there are, on
 * screen or in a comment, so the claim cannot go stale against the data.
 *
 * ── THE CELL WHOSE OWN TEXT GRANTS WHAT THE CELL FORBIDS ───────────────────
 * L86145's release cell reads `Explicitly prohibited — may request release
 * with a note`. Storing the leading token alone drops a real affordance;
 * storing the cell as one string invites a reader to take the second clause
 * as a softening of the first. They are two different acts: the prohibition
 * is on RELEASING, the affordance is on REQUESTING, and section 44.2 carries
 * the request as its own row reading `Allowed` for the Supervisor at L92034,
 * one row above its release row at L92035, which reads `Explicitly
 * prohibited` for the same person. So the cell keeps the prohibition as its
 * outcome and hangs the other act off `separateAct` with its own locator.
 * Neither half is dropped and neither is promoted.
 *
 * ── SAFETY IS THE OPPOSITE OF FAIL-CLOSED ──────────────────────────────────
 * A controller brief once quoted the source as ruling that "centrally
 * evidentiary actions fail closed" under an audit outage. That phrase occurs
 * zero times in the frozen bytes — measured in the covering test, not
 * asserted here — and the source's own position is the reverse: deterministic
 * safety keeps running. `DETERMINISTIC_SAFETY_STATEMENTS` carries the two
 * sentences that say so, each pinned to the line it is on.
 *
 * `deterministicStandingUnder` therefore takes an operating mode and returns
 * what the deterministic layer still does. It cannot return anything weaker:
 * the mode row's own `deterministicSafety` field is the literal type
 * `'Allowed'`, so there is no value to degrade to, and the matrix it returns
 * is the same matrix for every mode. There is no transition in the source
 * from an AI state to a reduced deterministic standing, so there is none
 * here.
 *
 * ── PROVENANCE ─────────────────────────────────────────────────────────────
 * Everything this module describes is a deterministic rule, so every
 * rendering path over it emits exactly one class and that class is `PROV-4`.
 * Section 42.4's absolute rule cuts the other way for free: nothing here may
 * ever be labelled live artificial intelligence, because none of it is.
 *
 * This module is data, two lookups and one derivation. It decides nothing.
 */

/* ==================================================================== *
 * THE COLUMNS — L86136, verbatim, minus the axis cell.
 * ==================================================================== */

export const BOUNDARY_MATRIX_HEADER_REF = 'L86136'

export type BoundaryColumnId =
  | 'evaluateSpecificationRule'
  | 'setSeverityBand'
  | 'placeSeverity1Hold'
  | 'releaseSeverity1Hold'

export const BOUNDARY_COLUMN_IDS = [
  'evaluateSpecificationRule',
  'setSeverityBand',
  'placeSeverity1Hold',
  'releaseSeverity1Hold',
] as const satisfies readonly BoundaryColumnId[]

type MissingFromColumnIds = Exclude<BoundaryColumnId, (typeof BOUNDARY_COLUMN_IDS)[number]>
const _columnIdsExhaustive: MissingFromColumnIds extends never ? true : never = true
void _columnIdsExhaustive

export interface BoundaryColumn {
  readonly id: BoundaryColumnId
  /** The header cell, verbatim. */
  readonly heading: string
}

export const BOUNDARY_COLUMNS = [
  { id: 'evaluateSpecificationRule', heading: 'May evaluate a specification rule' },
  { id: 'setSeverityBand', heading: 'May set a severity band' },
  { id: 'placeSeverity1Hold', heading: 'May place a Severity 1 hold' },
  { id: 'releaseSeverity1Hold', heading: 'May release a Severity 1 hold' },
] as const satisfies readonly BoundaryColumn[]

/* ==================================================================== *
 * THE CELLS.
 * ==================================================================== */

/** The permission token a cell leads with. The closed vocabulary's members
 *  that this matrix actually uses; it uses no others. */
export type BoundaryOutcome =
  | 'Allowed'
  | 'Allowed with conditions'
  | 'Explicitly prohibited'
  | 'Not applicable'

/**
 * What the text after the em dash IS. Without this, a cell that qualifies a
 * permission, a cell that explains why a column does not apply, and the cell
 * that names an entirely different act all render as "the same kind of
 * footnote" — which is exactly how the Supervisor's release cell gets read as
 * a softened prohibition.
 *
 * The counts that used to stand in this paragraph were inverted; they are
 * removed rather than corrected, because a number in prose is a claim nobody
 * re-measures and the tally was never the thing a reader could act on. The
 * split is measured in `tests/unit/ai-boundary.test.ts` off the cells.
 *
 * IT IS DERIVED, NOT DECLARED. It used to be a third argument to `qualified`,
 * unchecked by anything: flipping `HUMAN_NOT_RULE_ENGINE` from
 * `reason-for-not-applicable` to `condition` passed all 26 unit and 13
 * component tests while the screen rendered "Only where: a human does not
 * execute the rule engine" — an inapplicability drawn as a conditional grant,
 * the exact mis-rendering this type exists to prevent. See `kindOf`.
 */
export type QualifierKind =
  /** Narrows the permission the outcome grants. */
  | 'condition'
  /** Says why the column does not apply to this component. */
  | 'reason-for-not-applicable'
  /** Names a DIFFERENT act, granted elsewhere. It does not touch the outcome. */
  | 'separate-act'

export interface SeparateAct {
  /** The other act, in the source's words. */
  readonly act: string
  /** What that other act reads where the source grants it. */
  readonly outcomeElsewhere: 'Allowed'
  /** The row that grants it. */
  readonly grantedAt: string
  /** The act this cell forbids, which is not the one above. */
  readonly prohibitedAct: string
  /** Lines carrying the prohibition on `prohibitedAct` for this component. */
  readonly prohibitionRefs: readonly string[]
  /** The distinction, in the words a screen can render. */
  readonly reading: string
}

export interface BoundaryCell {
  /** The cell, exactly as the source writes it. */
  readonly verbatim: string
  readonly outcome: BoundaryOutcome
  /** The text after the em dash, or `null` where the cell is the bare token. */
  readonly qualifier: string | null
  readonly qualifierKind: QualifierKind | null
  readonly separateAct: SeparateAct | null
}

/**
 * WHAT A QUALIFIER IS, READ OFF THE CELL RATHER THAN ASSERTED ABOUT IT.
 *
 * `Not applicable` grants nothing, so a clause after it cannot narrow a grant
 * — it can only say why the column does not apply. Any other outcome carries
 * a grant for the clause to narrow, so its clause is a condition. Those two
 * exhaust every cell in this matrix, and neither is a judgement a transcriber
 * has to get right a second time.
 *
 * `separate-act` is NOT derivable and is not derived: whether a clause names a
 * different act is a reading of the source, so it is carried by the cell that
 * makes it, and `SUPERVISOR_RELEASE` is written out in full for that reason.
 *
 * A PROHIBITION WITH A PLAIN REASON THROWS rather than guessing. None occurs
 * in this matrix today. If one arrives, "why you may not" is neither a
 * condition on a grant nor a separate act, and inventing a third answer here
 * silently is how a footnote becomes a softened prohibition.
 */
const kindOf = (outcome: PermissionOutcome, qualifier: string): QualifierKind => {
  if (outcome === 'notApplicable') return 'reason-for-not-applicable'
  if (outcome === 'explicitlyProhibited' || outcome === 'unavailable') {
    throw new Error(
      `The boundary cell "${outcome} — ${qualifier}" qualifies a refusal. That is a reason or a ` +
        'separate act, never a condition, and this matrix has no derivation for it. Write the ' +
        'cell out with its own reading, as SUPERVISOR_RELEASE is.',
    )
  }
  return 'condition'
}

/**
 * ONE CELL, DECODED BY THE TREE'S PARSER RATHER THAN BY A SECOND ONE.
 *
 * `src/policy/columns.ts` `cellFromSource` is this tree's source-cell parser:
 * the nine tokens of L10238 in its spelling, longest first, the separator
 * requirement that is what actually stops `Allowed` swallowing
 * `Allowed with conditions`, three backtick placements, the rule that
 * `Not applicable` must state a reason, and a hard throw on anything else.
 * This module used to re-derive the token-and-clause split with its own
 * `BoundaryOutcome` union and its own `bare`/`qualified` pair. All 32 cells of
 * this matrix were run through `cellFromSource` before it was adopted and all
 * 32 parse identically, qualifiers included — there is no §40.1 shape it does
 * not fit, so there is nothing here to abstain from.
 *
 * `outcome` STAYS THE SOURCE'S SPELLING and does not become a
 * `PermissionOutcome`. The renderer prints this field, and `verbatim` is the
 * cell — the parser is consumed for the SPLIT and the refusal, which is what
 * was duplicated, not for a second vocabulary.
 *
 * The parameter is `token` rather than `outcome`, which is not a style
 * preference. `tests/coverage/contract-gates.test.ts` scans every file
 * declaring a permission matrix for an `outcome:` that could be empty, reads
 * the expression bound to it, and flagged an earlier helper's PARAMETER LIST —
 * `(outcome: BoundaryOutcome): BoundaryCell => ({ ... qualifier: null` — as a
 * nullable outcome. The field it is worried about is not nullable and never
 * was, but the gate cannot tell a parameter from a field and the fix belongs
 * in the name that collides, not in the gate.
 */
const cellOf = (token: BoundaryOutcome, qualifier: string | null): BoundaryCell => {
  const verbatim = qualifier === null ? token : `${token} — ${qualifier}`
  const parsed = cellFromSource(verbatim)
  const stated = qualifier === null ? null : parsed.detail
  return {
    verbatim,
    outcome: token,
    qualifier: stated,
    qualifierKind: stated === null ? null : kindOf(parsed.outcome, stated),
    separateAct: null,
  }
}

/** A cell that is nothing but its permission token. */
const bare = (token: BoundaryOutcome): BoundaryCell => cellOf(token, null)

/** A cell whose clause qualifies or explains, and grants nothing new. */
const qualified = (token: BoundaryOutcome, qualifier: string): BoundaryCell =>
  cellOf(token, qualifier)

const PROHIBITED = 'Explicitly prohibited'
const ALL_FOUR_PROHIBITED = {
  evaluateSpecificationRule: bare(PROHIBITED),
  setSeverityBand: bare(PROHIBITED),
  placeSeverity1Hold: bare(PROHIBITED),
  releaseSeverity1Hold: bare(PROHIBITED),
} as const satisfies Readonly<Record<BoundaryColumnId, BoundaryCell>>

const HUMAN_NOT_RULE_ENGINE = qualified(
  'Not applicable',
  'a human does not execute the rule engine',
)
const HOLD_IS_AUTOMATIC = qualified('Not applicable', 'the hold is automatic')

/**
 * The Supervisor's release cell. Both halves, kept apart.
 *
 * `prohibitionRefs` names lines that carry the prohibition on RELEASING for
 * this same person AND name the act, which this matrix's own cell does not:
 * its release column is headed once, at L86136, and the cell under it holds
 * only the token. That cell is cited by the row's own `sourceRef`. The
 * corroborating line is section 44.2's release row, which sits one row below
 * its request row — the same person, `Explicitly prohibited` on releasing and
 * `Allowed` on requesting, one row apart in one matrix.
 */
const SUPERVISOR_RELEASE: BoundaryCell = {
  verbatim: 'Explicitly prohibited — may request release with a note',
  outcome: PROHIBITED,
  qualifier: 'may request release with a note',
  qualifierKind: 'separate-act',
  separateAct: {
    act: 'Request release with a note',
    outcomeElsewhere: 'Allowed',
    grantedAt: 'L92034',
    prohibitedAct: 'Release a Severity 1 hold',
    prohibitionRefs: ['L92035'],
    reading:
      'Two different acts, and the second does not soften the first. Releasing a Severity 1 ' +
      'hold is prohibited for a Supervisor, without exception and on every surface. Asking a ' +
      'Quality Manager to release one, with a note, is a separate act that the source grants ' +
      'in its own right. A Supervisor never gains a release; a Supervisor is never left with ' +
      'no route.',
  },
}

/* ==================================================================== *
 * THE ROWS — the data rows under L86136.
 * ==================================================================== */

export type BoundaryComponentId =
  | 'on-device-deterministic-layer'
  | 'detection-class-atom-mirror'
  | 'prevention-agent'
  | 'deviation-and-containment-agent'
  | 'shift-handoff-agent'
  | 'tenant-composed-reasoning-agent'
  | 'quality-manager-human'
  | 'supervisor-human'

/** What kind of thing is acting. The uniformity claim is about `'agent'`. */
export type BoundaryComponentKind = 'deterministic' | 'agent' | 'human'

export interface BoundaryRow {
  readonly id: BoundaryComponentId
  /** Column one, verbatim. Taken from the roster wherever the roster has it. */
  readonly component: string
  readonly kind: BoundaryComponentKind
  /** The roster agent this row is, or `null` where the roster holds none. */
  readonly rosterAgentId: AiAgentId | null
  /** Why the roster holds none, or `null` where it does. */
  readonly rosterAbsence: string | null
  readonly cells: Readonly<Record<BoundaryColumnId, BoundaryCell>>
  /** The data row this record transcribes. */
  readonly sourceRef: string
}

/** The roster's own name for an agent, so no agent name is typed twice. */
const rosterName = (id: AiAgentId): string => aiRosterAgent(AI_AGENT_ROSTER, id).name

export const BOUNDARY_ROWS = [
  {
    id: 'on-device-deterministic-layer',
    component: 'On-device deterministic layer',
    kind: 'deterministic',
    rosterAgentId: null,
    rosterAbsence: null,
    cells: {
      evaluateSpecificationRule: bare('Allowed'),
      setSeverityBand: bare('Allowed'),
      placeSeverity1Hold: bare('Allowed'),
      releaseSeverity1Hold: bare(PROHIBITED),
    },
    sourceRef: 'L86138',
  },
  {
    id: 'detection-class-atom-mirror',
    component: 'Detection-class atom, server-side mirror',
    kind: 'deterministic',
    rosterAgentId: null,
    rosterAbsence: null,
    cells: {
      evaluateSpecificationRule: qualified(
        'Allowed with conditions',
        'confirmation and reconciliation only, never the trigger',
      ),
      setSeverityBand: bare(PROHIBITED),
      placeSeverity1Hold: bare(PROHIBITED),
      releaseSeverity1Hold: bare(PROHIBITED),
    },
    sourceRef: 'L86139',
  },
  {
    id: 'prevention-agent',
    component: rosterName('prevention'),
    kind: 'agent',
    rosterAgentId: 'prevention',
    rosterAbsence: null,
    cells: ALL_FOUR_PROHIBITED,
    sourceRef: 'L86140',
  },
  {
    id: 'deviation-and-containment-agent',
    component: rosterName('deviation-and-containment'),
    kind: 'agent',
    rosterAgentId: 'deviation-and-containment',
    rosterAbsence: null,
    cells: ALL_FOUR_PROHIBITED,
    sourceRef: 'L86141',
  },
  {
    id: 'shift-handoff-agent',
    component: rosterName('shift-handoff'),
    kind: 'agent',
    rosterAgentId: 'shift-handoff',
    rosterAbsence: null,
    cells: ALL_FOUR_PROHIBITED,
    sourceRef: 'L86142',
  },
  {
    id: 'tenant-composed-reasoning-agent',
    component: 'Tenant-composed reasoning agent',
    kind: 'agent',
    rosterAgentId: null,
    rosterAbsence:
      'Chapter 44’s agent roster holds the agents this platform ships, and a tenant-composed ' +
      'reasoning agent is not one of them: it is a family the tenant composes, registered as ' +
      '`AI-AGT-COMP-*` at L86038, and tier-gated to Growth and Enterprise at L1736. It appears in this ' +
      'matrix because the boundary binds whatever acts, not only what the platform shipped — ' +
      'which is the point of an axis of components rather than an axis of named agents.',
    cells: ALL_FOUR_PROHIBITED,
    sourceRef: 'L86143',
  },
  {
    id: 'quality-manager-human',
    component: 'Quality Manager, human',
    kind: 'human',
    rosterAgentId: null,
    rosterAbsence: null,
    cells: {
      evaluateSpecificationRule: HUMAN_NOT_RULE_ENGINE,
      setSeverityBand: qualified(
        'Allowed with conditions',
        'reclassification at review time with a recorded reason',
      ),
      placeSeverity1Hold: HOLD_IS_AUTOMATIC,
      releaseSeverity1Hold: bare('Allowed'),
    },
    sourceRef: 'L86144',
  },
  {
    id: 'supervisor-human',
    component: 'Supervisor, human',
    kind: 'human',
    rosterAgentId: null,
    rosterAbsence: null,
    cells: {
      evaluateSpecificationRule: HUMAN_NOT_RULE_ENGINE,
      setSeverityBand: bare(PROHIBITED),
      placeSeverity1Hold: HOLD_IS_AUTOMATIC,
      releaseSeverity1Hold: SUPERVISOR_RELEASE,
    },
    sourceRef: 'L86145',
  },
] as const satisfies readonly BoundaryRow[]

type MissingFromRows = Exclude<BoundaryComponentId, (typeof BOUNDARY_ROWS)[number]['id']>
const _rowsExhaustive: MissingFromRows extends never ? true : never = true
void _rowsExhaustive

export function boundaryRow(id: BoundaryComponentId): BoundaryRow {
  const found = BOUNDARY_ROWS.find((row) => row.id === id)
  if (found === undefined) {
    throw new Error(`The deterministic boundary matrix holds no component named "${id}".`)
  }
  return found
}

/**
 * The rows that read the same prohibition in every column. Derived from the
 * cells rather than listed, so the pattern cannot drift from the data and no
 * count of it exists to go stale.
 */
export function uniformlyProhibitedRows(
  rows: readonly BoundaryRow[] = BOUNDARY_ROWS,
): readonly BoundaryRow[] {
  return rows.filter((row) =>
    BOUNDARY_COLUMN_IDS.every((columnId) => {
      const cell = row.cells[columnId]
      return cell.outcome === PROHIBITED && cell.qualifier === null
    }),
  )
}

/**
 * The two prohibitions from the ability register that the agent rows restate.
 * Read from the register rather than re-typed: #5 is the release column and
 * #7 is the severity-band column, and each carries its own `TEST-AI-016-N`.
 */
export const AGENT_ROW_CORROBORATION = [aiProhibition(5), aiProhibition(7)] as const

/* ==================================================================== *
 * WHAT THE DETERMINISTIC LAYER STILL DOES, UNDER ANY AI STATE.
 * ==================================================================== */

export interface DeterministicSafetyStatement {
  /** The source's sentence, verbatim enough to be found on its own line. */
  readonly text: string
  readonly sourceRef: string
  /** What the sentence is about, in this build's words. */
  readonly scope: string
}

export const DETERMINISTIC_SAFETY_STATEMENTS = [
  {
    text:
      '**Deterministic safety is untouched.** Gates, specification checks, deviation detection, ' +
      'and severity classification run locally with no model in the path, under every ' +
      'artificial-intelligence failure including a platform-wide pause.',
    sourceRef: 'L91127',
    scope:
      'Every artificial-intelligence failure, the platform-wide emergency pause included. This ' +
      'is the in-chapter statement and it is the one that governs this component.',
  },
  {
    text: 'Deterministic safety mechanisms are unaffected by an audit outage.',
    sourceRef: 'L74918',
    scope:
      'An audit-store outage, where halt-class actions do stop. Deterministic safety is named ' +
      'as the exception to that halt, not as an instance of it — which is the whole reason a ' +
      'brief quoting a fail-closed rule here was quoting something the source does not say.',
  },
] as const satisfies readonly DeterministicSafetyStatement[]

/**
 * Section 42.4's class for everything in this module. Exactly one, always.
 *
 * RESOLVED, NOT PINNED. Every element this module renders is the source's own
 * table compared against a component — a packaged value producing an outcome
 * by comparison, and no model in the path — which is what `PROV-4`,
 * "Deterministic rules", is. It used to be the literal `'PROV-4'` with a test
 * asserting the literal, which is a claim about itself: a change to the
 * classification order of L89443-L89455 would leave the literal standing and
 * the assertion green. `@/ai/agents/contracts` `matrixCellProvenance` already
 * did this properly for chapter 44's cells and the facts are the same facts,
 * so this consumes it rather than restating them.
 */
export const BOUNDARY_PROVENANCE_CLASS: ProvenanceClassId = matrixCellProvenance()

export interface DeterministicStanding {
  readonly mode: AiModeId
  readonly modeName: string
  /** The mode's worker-visible label, so a caller need not re-derive it. */
  readonly workerLabel: string
  /** What the mode does to AI. It is the only column that varies. */
  readonly agentInvocation: AiModeRow['agentInvocation']
  /**
   * The literal type, carried through from section 42.3's own column. There
   * is no weaker value in the type, so no consumer can be handed one.
   */
  readonly deterministicSafety: 'Allowed'
  /** The boundary, unchanged. The same rows under every mode. */
  readonly rows: readonly BoundaryRow[]
  readonly statements: readonly DeterministicSafetyStatement[]
}

/**
 * What the deterministic layer still does while the platform is in `mode`.
 *
 * The matrix does not take the mode as an input, and that is the point: no
 * argument reaches the rows, so there is no code path by which an AI state
 * could produce a different boundary. The mode is carried so a screen can say
 * which state it is speaking about, not so the answer can depend on it.
 */
export function deterministicStandingUnder(mode: AiModeId): DeterministicStanding {
  const row = aiMode(mode)
  return {
    mode,
    modeName: row.name,
    workerLabel: row.workerLabel,
    agentInvocation: row.agentInvocation,
    deterministicSafety: row.deterministicSafety,
    rows: BOUNDARY_ROWS,
    statements: DETERMINISTIC_SAFETY_STATEMENTS,
  }
}
