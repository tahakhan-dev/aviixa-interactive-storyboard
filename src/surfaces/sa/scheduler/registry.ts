import {
  DEPLOYABLE_OBLIGATIONS,
  SCHEDULED_WORK_CENSUS,
  type DeployableObligation,
} from '@/scheduling'
import { SCHEDULE_OCCURRENCE_STATES } from '@/domain/vocabularies'
import { saAggregateText, saFreshnessFor, type SaFreshness } from '@/surfaces/sa/freshness'
import type { StatusTone } from '@/ui/primitives'

/**
 * THE TWO UNCATALOGUED SCHEDULER SCREENS.
 *
 * ── WHAT "UNCATALOGUED" MEANS HERE, MEASURED ───────────────────────────────
 * Both identifiers are named in prose storyboards and neither appears in any
 * screen register. The Delivery Operations Hub screen register is the only
 * register in this build's reach with the shape that would carry one — header
 * L48093, separator L48094, body L48095-L48117, twenty-three rows
 * `SCR-DOH-01`..`SCR-DOH-23` — and it names no scheduler screen at all.
 *
 * SO NO NUMBERED `SCR-SA-NN` LITERAL IS MINTED FOR EITHER, and this file
 * carries the identifiers exactly as the source spells them. `SCR-SA-SCHED-01`
 * and `SCR-SA-SCHED-02` ARE the source's own tokens; a catalogue number would
 * not be. The precedent is task 9's `SCR-DOH-20`, which has a register row and
 * no repository row: the screen was built by citing the line and parsing it
 * from the frozen source in the gate rather than by minting a registry entry.
 *
 * ── THE ASYMMETRY, AND WHAT IT IS AND IS NOT ───────────────────────────────
 * `SCR-SA-SCHED-01` occurs FOUR times in 122,241 lines. `SCR-SA-SCHED-02`
 * occurs ONCE. That asymmetry is real and it is an asymmetry of
 * CORROBORATION, not of specification:
 *
 *   `SCR-SA-SCHED-01`  L99687   the 45A.9 storyboard, with the column list
 *                      L100259  named as showing backlog and health telemetry
 *                      L100759  the 45A.10.5 storyboard, adding a tenant drill
 *                      L100764  an illustrative example someone opens it in
 *   `SCR-SA-SCHED-02`  L100760  one line, which specifies eight fields and
 *                               one explicit exclusion
 *
 * The dispatching brief said the second screen is "named and effectively
 * unspecified". IT IS NOT. L100760, read whole, gives it a field list as
 * complete as anything in this chapter and then states what it may never
 * show. What the second screen has NO second source for is anything at all:
 * no storyboard section of its own, no controls block, no prohibitions block,
 * no acceptance criterion naming it, no illustrative example. It is specified
 * exactly once and corroborated nowhere, so a reading error on that one line
 * has nothing to be caught by — which is why `OCCURRENCE_DETAIL_FIELDS` below
 * is a transcription of that line and nothing is inferred around it.
 *
 * ── PROVENANCE, WHICH IS NOT `SoW Fact` AND MUST NOT RENDER AS ONE ─────────
 * L99685 says the Statement of Work "does not describe a screen", classifies
 * the storyboard `User-Mandated Product Extension` and says it "needs
 * `DEC-SCHED-005`". L100778 says the same of both screens by name: "The
 * scheduler registry screens, the backlog drill, the governed tick and the
 * staleness rendering are `User-Mandated Product Extension` under
 * `DEC-SCHED-005`." So every column and field below is a product extension
 * pending a client decision, and the screens say so.
 *
 * This module is data plus three total functions. It decides nothing.
 */

/* ── the two screens, as the source names them ─────────────────────────────── */

export interface UncataloguedScreen {
  /** The source's own identifier. Never a minted `SCR-SA-NN`. */
  readonly identifier: 'SCR-SA-SCHED-01' | 'SCR-SA-SCHED-02'
  /** The screen name as the source writes it, immediately after the identifier. */
  readonly name: string
  /** Every line the identifier occurs on, and what that line contributes. */
  readonly occurrences: readonly { readonly line: number; readonly contributes: string }[]
  /** The classification the source gives the storyboard, verbatim. */
  readonly classification: 'User-Mandated Product Extension'
  /** The decision the classification names. */
  readonly pendingDecision: 'DEC-SCHED-005'
}

export const SCHEDULER_SCREENS = [
  {
    identifier: 'SCR-SA-SCHED-01',
    name: 'Scheduler Registry',
    occurrences: [
      {
        line: 99687,
        contributes:
          'The storyboard bullet, carrying the whole column list and the layer-1 restriction.',
      },
      {
        line: 100259,
        contributes:
          'Named as the screen that shows backlog and health as named telemetry, classified a product extension under DEC-SCHED-005.',
      },
      {
        line: 100759,
        contributes:
          'Restated for the console surface, adding a per-tenant backlog drill that names the tenant and shows counts only.',
      },
      {
        line: 100764,
        contributes:
          'An illustrative example in which a Platform Engineer opens it and sees a named tenant contributing overdue objects, with held distinguished from failed.',
      },
    ],
    classification: 'User-Mandated Product Extension',
    pendingDecision: 'DEC-SCHED-005',
  },
  {
    identifier: 'SCR-SA-SCHED-02',
    name: 'Occurrence detail',
    occurrences: [
      {
        line: 100760,
        contributes:
          'The whole of it: eight fields and one explicit exclusion, in one line, corroborated nowhere.',
      },
    ],
    classification: 'User-Mandated Product Extension',
    pendingDecision: 'DEC-SCHED-005',
  },
] as const satisfies readonly UncataloguedScreen[]

/* ── the column list, transcribed from L99687 ──────────────────────────────── */

/**
 * Which part of the build can answer a column.
 *
 * `definitionRegister` — §45A.17.1's own header (L102394) declares a column
 * that answers it. `absentFromTheRegister` — the header declares no such
 * column, so the register cannot answer it and no other table in this
 * slice's reach does either. `telemetry` — the column is a live measurement
 * of running work, and a browser-only storyboard runs none.
 */
export type ColumnAnswerability = 'definitionRegister' | 'absentFromTheRegister' | 'telemetry'

export interface RegistryColumn {
  /** The column as L99687 words it, verbatim and in its order. */
  readonly label: string
  readonly answerability: ColumnAnswerability
  /**
   * The field of `DeployableObligation` that answers it, or `null`. Null for
   * every column that is not `definitionRegister`.
   */
  readonly field: keyof DeployableObligation | null
  /** Why it cannot be answered, for the two kinds that cannot. Null otherwise. */
  readonly whyNot: string | null
}

/**
 * TEN COLUMNS, TRANSCRIBED FROM L99687 IN ITS OWN ORDER AND ITS OWN WORDS:
 * "name, owning surface, authority class, mechanism class, cron expression or
 * trigger description, scope (platform-wide or per tenant), last successful
 * occurrence, next expected occurrence, backlog depth, and health chip".
 *
 * FIVE OF THE TEN HAVE NO DATA BEHIND THEM, AND THAT IS THE SCREEN'S MAIN
 * FINDING RATHER THAN A GAP IN IT. Counted against the deployable register's
 * own header at L102394 — "Identifier | Obligation | Owning surface |
 * Authority class | Mechanism | Cadence or due rule | Source", seven columns:
 *
 *   answered by the register   name, owning surface, authority class,
 *                              mechanism class, the trigger-description half
 *   declared by no column      scope
 *   live measurement           last successful occurrence, next expected
 *                              occurrence, backlog depth, health chip
 *
 * ON THE FIFTH COLUMN, WHICH IS TWO THINGS WITH AN "OR" BETWEEN THEM.
 * MEASURED across the twenty-four register rows: not one `Cadence or due
 * rule` cell contains a cron expression. Every cell is a due rule in words —
 * "Completion plus 48 h default, floor 24 h, ceiling 7 days", "Start plus 15
 * minutes", "`TBD — Client Decision Required`". So the register answers the
 * trigger-description half of that column and the cron-expression half is
 * empty for all twenty-four, which the screen states rather than leaving a
 * reader to assume the expressions exist somewhere else.
 */
export const REGISTRY_COLUMNS = [
  { label: 'name', answerability: 'definitionRegister', field: 'obligation', whyNot: null },
  {
    label: 'owning surface',
    answerability: 'definitionRegister',
    field: 'owningSurface',
    whyNot: null,
  },
  {
    label: 'authority class',
    answerability: 'definitionRegister',
    field: 'authorityClass',
    whyNot: null,
  },
  { label: 'mechanism class', answerability: 'definitionRegister', field: 'mechanism', whyNot: null },
  {
    label: 'cron expression or trigger description',
    answerability: 'definitionRegister',
    field: 'cadence',
    whyNot: null,
  },
  {
    label: 'scope (platform-wide or per tenant)',
    answerability: 'absentFromTheRegister',
    field: null,
    whyNot:
      'The scheduled-work definition register declares seven columns and none of them is scope. No other table in this chapter assigns a scope per definition, so this column has no source to draw on and is left unanswered rather than derived from the owning surface, which is a different question.',
  },
  {
    label: 'last successful occurrence',
    answerability: 'telemetry',
    field: null,
    whyNot:
      'A measurement of a scheduled work item that has run. Nothing runs here, so there is nothing recorded.',
  },
  {
    label: 'next expected occurrence',
    answerability: 'telemetry',
    field: null,
    whyNot:
      'A projection made by materialising future occurrences. No occurrence has been materialised, so there is nothing recorded.',
  },
  {
    label: 'backlog depth',
    answerability: 'telemetry',
    field: null,
    whyNot:
      'A count of occurrences past their due moment. No occurrence exists to be past anything, so there is nothing recorded — and a nothing-recorded reading is not a zero.',
  },
  {
    label: 'health chip',
    answerability: 'telemetry',
    field: null,
    whyNot:
      'Derived from the three readings above. With all three unrecorded the chip reads unknown, never healthy.',
  },
] as const satisfies readonly RegistryColumn[]

/** The five columns the deployable register answers, in L99687's order. */
export const ANSWERED_COLUMNS = REGISTRY_COLUMNS.filter(
  (c): boolean => c.answerability === 'definitionRegister',
)

/** The five it does not, in L99687's order. */
export const UNANSWERED_COLUMNS = REGISTRY_COLUMNS.filter(
  (c): boolean => c.answerability !== 'definitionRegister',
)

/**
 * One registry row, built from the deployable register rather than restated.
 * The identifier is the register's mnemonic, which is the row a reader can
 * open in the frozen source at `line`.
 */
export interface RegistryRow {
  readonly id: string
  readonly cells: readonly string[]
  readonly line: number
}

/**
 * The twenty-four rows, derived. A second list would be a second thing to
 * drift out of step with `src/scheduling/registers.ts`, and the census in
 * that file is the denominator this screen is measured against.
 */
export const REGISTRY_ROWS: readonly RegistryRow[] = DEPLOYABLE_OBLIGATIONS.map((o) => ({
  id: o.id,
  cells: ANSWERED_COLUMNS.map((c) => String(o[c.field as keyof DeployableObligation])),
  line: o.line,
}))

/**
 * The register's own census row, so the screen states its denominator from
 * the shared register rather than from a number typed here. Task 6 counted it
 * by reading to where the body stops.
 */
export const DEPLOYABLE_CENSUS = SCHEDULED_WORK_CENSUS.find(
  (r): boolean => r.keySpace === 'ch-45a.17.1-deployable',
)

/**
 * MEASURED, not asserted: how many of the twenty-four `Cadence or due rule`
 * cells contain a cron expression. A cron expression is five or six
 * whitespace-separated fields of digits, `*`, `/`, `,` and `-`; nothing in
 * the register matches that shape, and this constant is computed so it cannot
 * become a stale claim if the register is ever re-transcribed.
 */
const CRON_EXPRESSION = /^[\d*/,\-?LW#]+(\s+[\d*/,\-?LW#]+){4,5}$/
export const CADENCE_CELLS_HOLDING_A_CRON_EXPRESSION = DEPLOYABLE_OBLIGATIONS.filter(
  (o): boolean => CRON_EXPRESSION.test(o.cadence.trim()),
).length

/* ── the telemetry readings, and the one rule they exist to keep ───────────── */

/**
 * WHAT AN UNRECORDED TELEMETRY FIGURE READS AS. `AC-SCHED-183` (L100775) — "A
 * stale telemetry figure never renders as healthy" — and the surface's own
 * terminal safe state at L100766, which is worth quoting because it names the
 * defect it forbids: the console renders "scheduler health unknown since
 * 04:12" rather than a green indicator, and "A green indicator computed from
 * stale data is the single most dangerous rendering on this surface."
 *
 * `saAggregateText` is the shared implementation of exactly this rule for
 * `SURF-SA` and it already exists, so nothing is reimplemented here: it is
 * the one place `AC-SA-01-03`'s never-zero-never-blank promise is kept, and a
 * second implementation would be a second place for it to stop being kept.
 *
 * This screen's own state is `STATE-01`, which reads `empty` — "Nothing
 * recorded yet". That is the honest state for a storyboard with no scheduler
 * behind it: not a failure, not a zero, and not a green chip.
 */
export const TELEMETRY_STATE = 'STATE-01' as const

export function telemetryReading(): string {
  return saAggregateText(saFreshnessFor(TELEMETRY_STATE), 'unreachable placeholder')
}

/**
 * The health chip's tone for a freshness. `ok` IS ONLY EVER RETURNED FOR
 * `current`, which is `AC-SCHED-183` expressed as a total function rather
 * than as a rule a reviewer has to remember: every other freshness — stale
 * included — gets a tone that is not `ok`, so no arrangement of the data can
 * produce a green chip over a figure that is not current.
 */
export function healthTone(freshness: SaFreshness): StatusTone {
  switch (freshness) {
    case 'current':
      return 'ok'
    case 'reconciled':
      return 'info'
    case 'stale':
      return 'stale'
    case 'unavailable':
      return 'blocked'
    case 'loading':
    case 'empty':
    case 'recovering':
      return 'neutral'
  }
}

/** What the chip says. Never "healthy" outside `current`. */
export function healthLabel(freshness: SaFreshness): string {
  return freshness === 'current'
    ? 'Scheduler health current'
    : `Scheduler health unknown — ${saAggregateText(freshness, 'current').toLowerCase()}`
}

/* ── the second screen, transcribed from L100760 ───────────────────────────── */

export interface OccurrenceDetailField {
  /** The field as L100760 words it, verbatim and in its order. */
  readonly label: string
  /**
   * Where the source says what would fill it, or `null` where it says
   * nothing. Only two of the eight have a second line behind them.
   */
  readonly definedAt: number | null
  /** What that second line contributes, or why there is none. */
  readonly note: string
}

/**
 * EIGHT FIELDS, TRANSCRIBED FROM L100760: "occurrence identifier, definition,
 * intended time, actual time, duration, outcome, attempt count, and the
 * reason class for any block or failure".
 *
 * TWO OF THE EIGHT HAVE A VOCABULARY OR A DEFINITION ELSEWHERE IN THE
 * CHAPTER AND SIX DO NOT, which is the shape of this screen's whole problem
 * and the reason it is transcribed rather than modelled. The two:
 *
 *   occurrence identifier   L98875 defines the `SCHEDRUN-` object and lists
 *                           what it carries, which overlaps this field list
 *                           without being it.
 *   reason class            L100972-L100979 enumerate eight block reason
 *                           classes, one per gate condition. This is the one
 *                           field of the eight with a closed source
 *                           vocabulary, and it is in `BLOCK_REASON_CLASSES`.
 *
 * `outcome` is the field that looks answered and is not — see
 * `OCCURRENCE_OUTCOME_VOCABULARY_CONFLICT`.
 */
export const OCCURRENCE_DETAIL_FIELDS = [
  {
    label: 'occurrence identifier',
    definedAt: 98875,
    note: 'The `SCHEDRUN-` object is defined as one durable row per planned moment, carrying its planned instant in Coordinated Universal Time, its governing local time, its revision pointer, its idempotency key, its state and its effect receipt pointer. That is a wider list than this screen shows, so the screen shows this field and does not import the rest.',
  },
  {
    label: 'definition',
    definedAt: null,
    note: 'The definition this occurrence belongs to. Which key space its identifier comes from is not stated, and four key spaces carry the `SCHED-` prefix.',
  },
  {
    label: 'intended time',
    definedAt: null,
    note: 'The planned instant. No format, no timezone rule and no relationship to the governing local time is stated for this field on this screen.',
  },
  {
    label: 'actual time',
    definedAt: null,
    note: 'When it ran. Nothing states what this reads for an occurrence that never ran, and the screen therefore renders no value rather than an empty one.',
  },
  {
    label: 'duration',
    definedAt: null,
    note: 'How long it took. No unit is stated.',
  },
  {
    label: 'outcome',
    definedAt: null,
    note: 'The one field whose vocabulary the chapter states twice, differently. Both sets are carried and neither is presented as the answer.',
  },
  {
    label: 'attempt count',
    definedAt: null,
    note: 'How many attempts were made. This is the field that makes at-least-once triggering visible rather than hidden, and no maximum is stated for it here.',
  },
  {
    label: 'the reason class for any block or failure',
    definedAt: 100970,
    note: 'The eight gate conditions each name their own block reason class, in a table whose header this line is. That is a closed set and it is the only field of the eight with one.',
  },
] as const satisfies readonly OccurrenceDetailField[]

/**
 * The exclusion, transcribed from the second half of L100760: "It shows **no**
 * tenant operational content: no measurement, no worker name, no evidence."
 *
 * It is carried as its own constant because it is the half of that line a
 * screen is most likely to drop, and dropping it turns a layer-1 telemetry
 * screen into a layer-3 record reader on paper.
 */
export const OCCURRENCE_DETAIL_EXCLUDES = [
  'no measurement',
  'no worker name',
  'no evidence',
] as const

export interface BlockReasonClass {
  /** The gate condition's number in its own table. */
  readonly condition: number
  /** The condition's name, verbatim. */
  readonly name: string
  /** The reason class, verbatim including the source's own em dash. */
  readonly reasonClass: string
  readonly line: number
}

/**
 * THE EIGHT BLOCK REASON CLASSES. Table header L100970, separator L100971,
 * body L100972-L100979 — eight rows counted by reading to where the body
 * stops, which is the blank line before the section's diagram.
 *
 * These are the execution gate of 45A.12: the eight things that must be
 * establishable before any occurrence executes, each with the reason class it
 * blocks under when it cannot be. `AC-SCHED-184` (L100776) names that gate by
 * section for the console's governed manual tick, which is what connects this
 * table to these two screens.
 *
 * WHY THEY BELONG TO THE SECOND SCREEN AND NOT THE FIRST. The registry lists
 * definitions; a reason class is a property of one occurrence. L100760's
 * eighth field is the only place either screen is said to show one.
 */
export const BLOCK_REASON_CLASSES = [
  {
    condition: 1,
    name: 'Tenant scope',
    reasonClass: 'blocked — tenant scope unresolved',
    line: 100972,
  },
  {
    condition: 2,
    name: 'Authority',
    reasonClass: 'blocked — authority unresolved',
    line: 100973,
  },
  {
    condition: 3,
    name: 'Qualification',
    reasonClass: 'blocked — qualification state unreadable',
    line: 100974,
  },
  { condition: 4, name: 'Version', reasonClass: 'blocked — version mismatch', line: 100975 },
  {
    condition: 5,
    name: 'Hold state',
    reasonClass: 'blocked — hold state unreadable',
    line: 100976,
  },
  {
    condition: 6,
    name: 'Legal hold',
    reasonClass: 'blocked — legal hold unreadable',
    line: 100977,
  },
  {
    condition: 7,
    name: 'Idempotency',
    reasonClass: 'blocked — idempotency unverifiable',
    line: 100978,
  },
  {
    condition: 8,
    name: 'Official truth',
    reasonClass: 'blocked — audit unavailable',
    line: 100979,
  },
] as const satisfies readonly BlockReasonClass[]

/**
 * THE `outcome` FIELD HAS TWO SOURCE VOCABULARIES AND NO CROSS-REFERENCE.
 *
 * MEASURED. §45A.6's occurrence lifecycle diagram declares FIFTEEN states as
 * diagram nodes at L99091-L99105 — Planned, Due, Suppressed, Misfired,
 * Claimed, Executing, PartiallyExecuted, Skipped, Succeeded, FailedRetryable,
 * DeadLettered, Quarantined, Cancelled, Expired, Reconciled. §45A.17.2's
 * occurrence state register at L102559 declares TWELVE inline — `pending`,
 * `claimed`, `running`, `succeeded`, `succeeded_late`,
 * `duplicate_suppressed`, `blocked`, `failed`, `missed`, `cancelled`,
 * `manual_completion`, `reconciled` — and says none may be collapsed into
 * "done".
 *
 * FOUR NAMES ARE COMMON TO BOTH: claimed, succeeded, cancelled, reconciled.
 * ELEVEN of the fifteen are absent from the twelve and EIGHT of the twelve
 * are absent from the fifteen. They are not two spellings of one set; they
 * are two sets, and the register set carries distinctions the lifecycle set
 * does not have a state for at all — `succeeded_late`,
 * `duplicate_suppressed` and `manual_completion` above all.
 *
 * WHY THIS IS NOT ACADEMIC. `AC-SCHED-372` (L102613) reads "no state outside
 * the four registers appears in any code path or user interface string". Read
 * strictly, that criterion forbids the fifteen-state set, which is what this
 * build shipped in `src/domain/vocabularies.ts` from the lifecycle diagram.
 * BOTH READINGS ARE THE SOURCE'S OWN AND NEITHER IS PREFERRED HERE. This
 * screen renders no occurrence outcome, so it needs no answer; what it does
 * is name the two sets and their locators, so a reader is not shown one and
 * left believing it is the vocabulary.
 *
 * NO `DEC-*` IDENTIFIER IS MINTED FOR THIS. The source raises none, and a
 * build-minted decision identifier is a register entry the client would
 * search the frozen source for and not find — the same ruling
 * `S10-IDENT-SCHED-001` records for the scheduler identity spellings and
 * `MATRIX_14_UNRECONCILED` records for Matrix 14.
 */
export const OCCURRENCE_OUTCOME_VOCABULARY_CONFLICT = {
  lifecycleDiagram: {
    countedStates: 15,
    firstNodeLine: 99091,
    lastNodeLine: 99105,
    shippedAs: 'src/domain/vocabularies.ts SCHEDULE_OCCURRENCE_STATES',
    shippedCount: SCHEDULE_OCCURRENCE_STATES.length,
  },
  stateRegister: {
    countedStates: 12,
    line: 102559,
    states: [
      'pending',
      'claimed',
      'running',
      'succeeded',
      'succeeded_late',
      'duplicate_suppressed',
      'blocked',
      'failed',
      'missed',
      'cancelled',
      'manual_completion',
      'reconciled',
    ],
  },
  /** The four names both sets carry, in the register's order. */
  common: ['claimed', 'succeeded', 'cancelled', 'reconciled'],
  criterionThatFavoursTheRegister: 102613,
  settled: false,
  decisionMinted: null,
} as const

/* ── the three things the source could not establish ───────────────────────── */

export interface UnestablishedItem {
  readonly question: string
  /** What the source does say, and where. Every locator opened whole. */
  readonly whatTheSourceSays: readonly { readonly text: string; readonly locator: string }[]
  /** What is therefore not known, stated as an absence and not as a guess. */
  readonly notKnown: string
}

/**
 * THREE ITEMS, AND THE DISCIPLINE IS THAT NONE OF THEM IS ANSWERED.
 *
 * The first two were measured for this task rather than accepted: no line of
 * the Hub screen register body L48095-L48117 names a scheduler screen, and
 * ZERO `MOD-*` identifiers occur anywhere in §45A.10.5 (L100713-L100779) or
 * in the §45A.9 screen-storyboard block (L99685-L99692) — the two passages
 * that between them contain four of the five occurrences of the two screen
 * identifiers. So "no module claims either screen" is a counted absence
 * across the passages that would have to carry the claim, not an impression.
 *
 * The third is `DEC-FINISH-002`, which is already in the decision canon with
 * ZERO readings because the absence is the disclosure. It is cited here and
 * rendered through `DecisionDisclosure`; nothing about it is restated.
 */
export const UNESTABLISHED = [
  {
    question: 'Which surface renders the tenant-scope scheduled-run ledger?',
    whatTheSourceSays: [
      {
        text: 'The five-surface matrix gives the Delivery Operations Hub `Allowed` on "Holds the official scheduled-run ledger for tenant-scope work", and marks the Super Admin console `Not applicable — platform scope only` on the same row.',
        locator: 'L100424',
      },
      {
        text: 'The next-but-two row, "Displays occurrence state", gives the Hub `Allowed` and the Super Admin console `Allowed` — counts and health only.',
        locator: 'L100427',
      },
      {
        text: 'The Hub screen register names twenty-three screens and not one of them is a scheduler screen.',
        locator: 'L48095-L48117',
      },
      {
        text: 'The Scheduler Registry is explicitly platform-scope layer-1 telemetry: "No tenant operational content appears here — this is layer 1, named administration and telemetry".',
        locator: 'L99687',
      },
    ],
    notKnown:
      'The source states a display obligation for tenant-scope scheduled-run data and names no screen to carry it. This build renders the obligation as open rather than inventing a Hub screen for it, and neither of these two screens claims it: both are platform-scope by the line that describes them.',
  },
  {
    question: 'Which module owns either screen?',
    whatTheSourceSays: [
      {
        text: 'The per-surface timing-classification table classifies `SURF-SA` as `TC-10` platform or infrastructure maintenance schedule, and its justification names a settings category rather than a module: "The named platform schedulers and the maintenance-window calendar sit in its System settings category". It names no `MOD-*` identifier at all.',
        locator: 'L98141',
      },
      {
        text: 'The per-module table nineteen lines further on does give `MOD-SA-07` Platform Settings the same `TC-10` classification, because "The System category names the platform schedulers and maintenance windows". That is a classification of the module, not a claim on either screen.',
        locator: 'L98235',
      },
      {
        text: '`MOD-SA-07`’s own module record is settings categories, the severity catalogue, locale packs, the floor register and the enforced invariants. Measured across it: zero `PER-SCHED-*` operations and one use of the word scheduler, in its source-status paragraph.',
        locator: 'L44629-L44662',
      },
      {
        text: 'Zero `MOD-*` identifiers occur in the whole of §45A.10.5, the section that storyboards both screens.',
        locator: 'L100713-L100779',
      },
      {
        text: 'Zero `MOD-*` identifiers occur in the §45A.9 screen-storyboard block either.',
        locator: 'L99685-L99692',
      },
    ],
    notKnown:
      'No `MOD-*` identifier claims either screen. The nearest thing to a claim is a module classified for the same timing reason, and a shared classification is not ownership. So these two routes sit outside the module rail rather than under a module header, which is why neither renders a band-and-module annotation: an annotation naming a module would be the claim the source does not make.',
  },
  {
    question: 'What are `DEC-FINISH-002`’s two readings?',
    whatTheSourceSays: [
      {
        text: 'It is minted as "the manual-close anchor contradiction recorded as `DEC-FINISH-002` and indexed in Chapter 51, section 51.12, where its home chapter is named".',
        locator: 'L98703',
      },
      {
        text: 'The decision index carries it against chapter 45A with a reference count of two — and those two references are these two lines.',
        locator: 'L115082',
      },
    ],
    notKnown:
      'Neither occurrence states a reading. The decision canon therefore holds this record with an empty readings array, which `DecisionDisclosure` renders as a disclosure of absence. The consequence for these screens is a limit rather than a rendering: the occurrence detail screen shows `intended time` and `actual time`, and for a manually completed occurrence the source does not say what either anchors to, so no value is presented as source-backed.',
  },
] as const satisfies readonly UnestablishedItem[]

/* ── the honesty model, quoted rather than paraphrased ─────────────────────── */

/**
 * THE CLAIM THIS CHAPTER MAKES AND THE ONE IT REFUSES, from L98954 read
 * whole: "This architecture does not claim end-to-end exactly-once execution
 * and no implementation should. What it claims is narrower and provable:
 * at-least-once delivery of the trigger, at-most-once effect per idempotency
 * key, and a written record of every attempt."
 *
 * Both screens carry it, because both show attempt-shaped data — the registry
 * a backlog depth, the detail screen an attempt count — and a reader who does
 * not know the model reads a second attempt as a second effect.
 */
export const TRIGGER_MODEL = {
  claimed:
    'at-least-once delivery of the trigger, at-most-once effect per idempotency key, and a written record of every attempt',
  refused: 'end-to-end exactly-once execution',
  locator: 'L98954',
} as const

/**
 * WHY AN OFFLINE DEVICE IS NOT AUTOMATICALLY UNHEALTHY, in the source's own
 * treatment of the case. L100928, whole line, is the failure entry for a
 * command queued to a device that never returns: detection is that "Command
 * age exceeds its expected delivery window; the device's last-seen time
 * exceeds the connectivity-loss thresholds of 30, 60 and 120 minutes", and
 * the terminal safe state is that "the command remains queued and visibly
 * undelivered; the affected work is treated as not-yet-reached, never as
 * reached".
 *
 * So being offline is not the signal — exceeding a named threshold is. And
 * L100922 says what this console shows for it: "Propagation-lag distribution
 * for the tenant, plus a count of commands queued beyond their expected
 * delivery window. Counts only." A count of commands past their window is not
 * a count of offline devices, and neither is a health verdict on one.
 */
export const OFFLINE_IS_NOT_UNHEALTHY = {
  statement:
    'A device being offline is not a health signal on this console. What is measured is a command whose age has passed its expected delivery window, against the named connectivity-loss thresholds of 30, 60 and 120 minutes. Until a threshold is passed there is nothing to report, and when one is passed the work is shown as not-yet-reached — never as reached, and never as a failure of the device.',
  locators: ['L100922', 'L100928'],
} as const

/**
 * The word for the thing, used everywhere a reader can see it.
 *
 * "Scheduled work item" is the phrase, and never a phrase naming a scheduling
 * daemon. The registry's fifth column is transcribed as the source words it,
 * "cron expression or trigger description", because that is a column heading
 * being quoted rather than a claim that any such expression exists — and
 * `CADENCE_CELLS_HOLDING_A_CRON_EXPRESSION` measures that none does.
 */
export const THE_NOUN = 'scheduled work item' as const
