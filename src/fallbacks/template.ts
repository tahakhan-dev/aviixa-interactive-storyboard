/**
 * THE FALLBACK CONTRACT TEMPLATE — TWENTY-SIX DECLARED FIELDS, TWENTY-FOUR
 * RENDERED ROWS, AND THE RULING THAT RECONCILES THEM.
 *
 * §38.3 declares the template closed: L82242 states the rule in the source's
 * own plain words — "the same twenty-six questions every time, so nobody has
 * to remember what to ask, and nobody can quietly leave out the awkward
 * question". The twenty-six are tabulated at L82313 (header) through L82340
 * (field 26) and are transcribed below, header-keyed, verbatim.
 *
 * AND EVERY ONE OF THE SEVENTY INSTANCES RENDERS TWENTY-FOUR ROWS. That is
 * not a transcription slip and it is not this build's observation: the source
 * says so itself at L82431 — "Every contract below is rendered as a
 * twenty-four-row table covering the twenty-six template fields" — and then
 * lists the twenty-four row names in order. Both readings were measured
 * against the frozen source, from both sides: the prose list at L82431 and
 * the actual row labels of all seventy instances are the same twenty-four
 * strings in the same order, and no instance departs from it.
 *
 * ── THE RULING, AND IT IS A CLIENT-DELEGATED CHOICE UNDER `APP-012` ────────
 * This build renders TWENTY-FOUR and declares TWENTY-SIX. `RENDERED_ROWS` is
 * the row vocabulary a contract actually carries; `FALLBACK_TEMPLATE_FIELDS`
 * is the closed twenty-six the template mandates; `TEMPLATE_FIELD_ROW` maps
 * every one of the twenty-six onto the row that answers it, and is many-to-one
 * in exactly two places.
 *
 * WHY THAT WAY ROUND, stated so it can be disagreed with. The alternative —
 * a twenty-six-field contract type where fields 11/12 and 22/23 each draw
 * from one rendered cell — was rejected because populating it requires
 * deciding where inside one sentence the entry clause ends and the exit
 * clause begins, seventy times, and the source never draws that line. That is
 * invention, and invention is the one thing the template exists to prevent
 * (field 3 of the authoring workflow: a value not present in the source is
 * raised as a decision rather than invented). Splitting the pair loses
 * information this build does not have; keeping the pair loses nothing,
 * because `TEMPLATE_FIELD_ROW` still answers "which row answers field 12?".
 * Neither number is wrong and this build carries both.
 *
 * A THIRD READING, WHICH NO BRIEF RECORDED AND WHICH IS RECORDED HERE. The
 * class diagram at L82260-L82288 gives `FallbackContract` twenty-eight
 * members: an `identifier` plus TWENTY-SEVEN fields. It splits `entryTrigger`
 * and `exitTrigger` (L82272, L82273) and `audit` and `monitoring` (L82283,
 * L82284) as the prose table does — and it also splits `residualRisk` and
 * `sourceStatus` (L82287, L82288), which the prose table carries as the
 * single field 26. So the source states its own field count three times and
 * gets 26, 24 and 27. All three are declared here; none is corrected away.
 *
 * This module is data. It computes nothing and decides nothing.
 */

/**
 * The twenty-four row labels every one of the seventy contracts renders, in
 * the source's own fixed order. Header-keyed and never positional: a contract
 * is a total `Record` over this union, so a blank cell is untypeable and a
 * dropped row is a type error rather than a silently short table.
 */
export type RenderedRow =
  | "Normal path"
  | "Dependencies"
  | "Criticality"
  | "Failure modes"
  | "Detection"
  | "Invariants held"
  | "First fallback"
  | "Secondary or manual fallback"
  | "Fallback of fallback"
  | "Terminal safe state"
  | "Entry and exit triggers"
  | "Allowed actions"
  | "Blocked actions"
  | "Roles"
  | "Five-surface effect"
  | "Data treatment"
  | "User communication"
  | "Escalation"
  | "Recovery"
  | "Reconciliation"
  | "Audit and monitoring"
  | "Recovery Time Objective and Recovery Point Objective"
  | "Acceptance tests"
  | "Residual risk and source status"

export const RENDERED_ROWS = [
  "Normal path",
  "Dependencies",
  "Criticality",
  "Failure modes",
  "Detection",
  "Invariants held",
  "First fallback",
  "Secondary or manual fallback",
  "Fallback of fallback",
  "Terminal safe state",
  "Entry and exit triggers",
  "Allowed actions",
  "Blocked actions",
  "Roles",
  "Five-surface effect",
  "Data treatment",
  "User communication",
  "Escalation",
  "Recovery",
  "Reconciliation",
  "Audit and monitoring",
  "Recovery Time Objective and Recovery Point Objective",
  "Acceptance tests",
  "Residual risk and source status",
] as const satisfies readonly RenderedRow[]

const _renderedRowsExhaustive: Exclude<RenderedRow, (typeof RENDERED_ROWS)[number]> extends never
  ? true
  : never = true
void _renderedRowsExhaustive

/** One numbered row of the closed template. Four columns, header-keyed. */
export interface TemplateField {
  /** 1..26, the source's own `#` column. */
  readonly number: number
  /** The `Field` cell, verbatim. */
  readonly field: string
  /** The `What it must contain` cell, verbatim. */
  readonly mustContain: string
  /** The `Why it is mandatory` cell, verbatim. */
  readonly whyMandatory: string
  /**
   * The frozen-source line this row is on. A NUMBER rather than an `L`-string
   * on purpose: this file carries twenty-six of them and the tree's citation
   * lexer would read each as a claim about that line's text, which it is not.
   * `templateFieldLocator` below spells the citation where one is wanted.
   */
  readonly line: number
}

/**
 * The declared closed set. Twenty-six, no fewer; the source's own rule is that
 * a genuinely inapplicable field must say so rather than be left empty.
 */
export const FALLBACK_TEMPLATE_FIELDS = [
  {
    number: 1,
    field: "Normal path",
    mustContain: "The healthy behaviour in one or two sentences.",
    whyMandatory: "Without it the degraded mode has no baseline to be measured against.",
    line: 82315,
  },
  {
    number: 2,
    field: "Dependencies",
    mustContain: "Every service, store, device, network, model, and person the path needs.",
    whyMandatory: "Enumerating the dependency is what makes the single-point analysis of Chapter 39 possible.",
    line: 82316,
  },
  {
    number: 3,
    field: "Criticality",
    mustContain: "Safety-critical, quality-critical, operationally critical, or advisory.",
    whyMandatory: "Determines how far down the ladder the contract may go before stopping.",
    line: 82317,
  },
  {
    number: 4,
    field: "Failure modes",
    mustContain: "Which of the eight misbehaviours apply.",
    whyMandatory: "Prevents the naive \"it is down\" assumption.",
    line: 82318,
  },
  {
    number: 5,
    field: "Detection",
    mustContain: "The concrete signal, and its source.",
    whyMandatory: "Undetected failure has no fallback at all.",
    line: 82319,
  },
  {
    number: 6,
    field: "Invariants",
    mustContain: "Which priority-order items this contract promises to hold under all conditions.",
    whyMandatory: "The reviewer's checklist.",
    line: 82320,
  },
  {
    number: 7,
    field: "First fallback",
    mustContain: "The Level 1 or Level 2 behaviour.",
    whyMandatory: "The ordinary recovery path.",
    line: 82321,
  },
  {
    number: 8,
    field: "Secondary or manual fallback",
    mustContain: "The Level 3 or Level 4 behaviour.",
    whyMandatory: "The path when automation is exhausted.",
    line: 82322,
  },
  {
    number: 9,
    field: "Fallback of fallback",
    mustContain: "What happens when field 8 also fails.",
    whyMandatory: "The question most often omitted, and the one incidents actually reach.",
    line: 82323,
  },
  {
    number: 10,
    field: "Terminal safe state",
    mustContain: "The Level 6 state, named.",
    whyMandatory: "Guarantees a defined floor rather than undefined behaviour.",
    line: 82324,
  },
  {
    number: 11,
    field: "Entry trigger",
    mustContain: "The precise condition that starts the degraded mode.",
    whyMandatory: "Makes entry testable.",
    line: 82325,
  },
  {
    number: 12,
    field: "Exit trigger",
    mustContain: "The precise condition that ends it.",
    whyMandatory: "Prevents stuck levels.",
    line: 82326,
  },
  {
    number: 13,
    field: "Allowed actions",
    mustContain: "What users and services may still do.",
    whyMandatory: "Prevents over-restriction during an incident.",
    line: 82327,
  },
  {
    number: 14,
    field: "Blocked actions",
    mustContain: "What is refused, and by which control.",
    whyMandatory: "Prevents under-restriction during an incident.",
    line: 82328,
  },
  {
    number: 15,
    field: "Roles",
    mustContain: "Who acts, who decides, who is informed.",
    whyMandatory: "Removes \"somebody will handle it\".",
    line: 82329,
  },
  {
    number: 16,
    field: "Five-surface effect",
    mustContain: "The state of each of the five surfaces during the degraded mode.",
    whyMandatory: "The platform has five surfaces and an incident touches several.",
    line: 82330,
  },
  {
    number: 17,
    field: "Data treatment",
    mustContain: "What happens to in-flight, queued, cached, and partial data.",
    whyMandatory: "Protects prohibition nine.",
    line: 82331,
  },
  {
    number: 18,
    field: "User communication",
    mustContain: "The exact message pattern, per surface.",
    whyMandatory: "Protects prohibitions ten and eleven.",
    line: 82332,
  },
  {
    number: 19,
    field: "Escalation",
    mustContain: "Who is escalated to, on what timer, through which channel.",
    whyMandatory: "Connects the contract to the tenant's escalation record.",
    line: 82333,
  },
  {
    number: 20,
    field: "Recovery",
    mustContain: "How the primary path is resumed.",
    whyMandatory: "The climb back.",
    line: 82334,
  },
  {
    number: 21,
    field: "Reconciliation",
    mustContain: "How the records are made to agree afterwards.",
    whyMandatory: "The accounting obligation.",
    line: 82335,
  },
  {
    number: 22,
    field: "Audit",
    mustContain: "What is written, where, and under which guarantee.",
    whyMandatory: "An unauditable degraded mode is not permitted.",
    line: 82336,
  },
  {
    number: 23,
    field: "Monitoring",
    mustContain: "The metric, the threshold, and where the threshold is configured.",
    whyMandatory: "Connects the contract to Observability settings.",
    line: 82337,
  },
  {
    number: 24,
    field: "Recovery Time Objective and Recovery Point Objective",
    mustContain: "A source value, a recommendation, or `TBD — Client Decision Required`.",
    whyMandatory: "The two numbers a client actually contracts on.",
    line: 82338,
  },
  {
    number: 25,
    field: "Acceptance tests",
    mustContain: "The `TEST-*` identifiers proving the contract.",
    whyMandatory: "Makes the contract real.",
    line: 82339,
  },
  {
    number: 26,
    field: "Residual risk and source status",
    mustContain: "What is still exposed, and how each claim is classified.",
    whyMandatory: "Prevents a false claim of complete coverage.",
    line: 82340,
  },
] as const satisfies readonly TemplateField[]

/** The declared count, from the closure rule. Never derived from the array. */
export const DECLARED_TEMPLATE_FIELD_COUNT = 26

/** The rendered count, from the source's own sentence about its own tables. */
export const RENDERED_ROW_COUNT = 24

/**
 * Which rendered row answers which template field. Total over 1..26, and
 * many-to-one in exactly two places — fields 11 and 12 both land on
 * `Entry and exit triggers`, fields 22 and 23 both land on
 * `Audit and monitoring`. Those two collapses, and only those two, are the
 * whole of the 26-to-24 difference; every other field maps one-to-one, and
 * field 6 is a rename (`Invariants` to `Invariants held`) rather than a
 * collapse.
 */
export const TEMPLATE_FIELD_ROW: Readonly<Record<number, RenderedRow>> = {
  1: "Normal path",
  2: "Dependencies",
  3: "Criticality",
  4: "Failure modes",
  5: "Detection",
  6: "Invariants held",
  7: "First fallback",
  8: "Secondary or manual fallback",
  9: "Fallback of fallback",
  10: "Terminal safe state",
  11: "Entry and exit triggers",
  12: "Entry and exit triggers",
  13: "Allowed actions",
  14: "Blocked actions",
  15: "Roles",
  16: "Five-surface effect",
  17: "Data treatment",
  18: "User communication",
  19: "Escalation",
  20: "Recovery",
  21: "Reconciliation",
  22: "Audit and monitoring",
  23: "Audit and monitoring",
  24: "Recovery Time Objective and Recovery Point Objective",
  25: "Acceptance tests",
  26: "Residual risk and source status",
}

/**
 * The two collapsed pairs, named rather than left to be inferred from the map.
 * `TEMPLATE_FIELD_ROW` is where the collapse lives; this is where a reader
 * finds out that it exists.
 */
export const COLLAPSED_FIELD_PAIRS = [
  { fields: [11, 12], row: 'Entry and exit triggers' },
  { fields: [22, 23], row: 'Audit and monitoring' },
] as const satisfies readonly { fields: readonly [number, number]; row: RenderedRow }[]

/**
 * The class diagram's twenty-seven field names, in its own order and its own
 * spelling. It is the third and least-cited reading of the field count, and it
 * is here so that a later task comparing field sets against the diagram finds
 * the diagram rather than re-deriving it. `identifier` is the class's key and
 * is not a template field, so it is not in this list.
 */
export const CLASS_DIAGRAM_FIELDS = [
  'normalPath',
  'dependencies',
  'criticality',
  'failureModes',
  'detection',
  'invariants',
  'firstFallback',
  'secondaryOrManualFallback',
  'fallbackOfFallback',
  'terminalSafeState',
  'entryTrigger',
  'exitTrigger',
  'allowedActions',
  'blockedActions',
  'roles',
  'fiveSurfaceEffect',
  'dataTreatment',
  'userCommunication',
  'escalation',
  'recovery',
  'reconciliation',
  'audit',
  'monitoring',
  'recoveryObjectives',
  'acceptanceTests',
  'residualRisk',
  'sourceStatus',
] as const

/**
 * The four criticality values field 3 declares, verbatim from its own cell:
 * "Safety-critical, quality-critical, operationally critical, or advisory"
 * (L82317).
 *
 * IT IS NOT THE VOCABULARY THE SOURCE USES. The library index at L82417 gives
 * the identity-and-authentication family a highest criticality of
 * `Security-critical`, which is a fifth value field 3 does not list, and the
 * seventy contracts' own `Criticality` cells are free prose rather than a
 * token — several name two classes at once. So this build stores the cell
 * verbatim and never parses it into an enum, and this constant is the
 * DECLARED vocabulary, recorded so the gap is visible rather than a token set
 * something later validates against and fails.
 */
export const DECLARED_CRITICALITY_VALUES = [
  'Safety-critical',
  'quality-critical',
  'operationally critical',
  'advisory',
] as const

/** The citation for one template field, spelled the way the tree cites. */
export function templateFieldLocator(field: TemplateField): string {
  return `Fallback template field ${field.number} \u00b7 L${field.line}`
}
