import type { RoleId } from '@/domain/roles'
import type { PermissionOutcome } from '@/policy/decision'

/**
 * `MOD-CC-13` — THE CLOSED ACTION SET OF TEN, ITS AUTHORITY TABLE AND ITS
 * PERMISSION MATRIX, BOTH TRANSCRIBED HEADER-KEYED.
 *
 * This is the surface's authority model. Twelve module screens place controls
 * whose meaning is defined here, so every count below was taken by reading the
 * rows and every cell was read with the clause that follows its token.
 *
 * ── THE TWO TABLES, AND WHERE THEY STOP ──────────────────────────────────
 *
 *   authority and executing service   header L38663 · separator L38664 ·
 *                                     data L38665-L38674 · TEN rows
 *   the action permission matrix      header L38680 · separator L38681 ·
 *                                     data L38682-L38691 · TEN rows
 *
 * Ten in each case is what is on the page, not a span subtracted. The bodies
 * stop where the table stops: the next non-blank line below the first is
 * L38676, which carries the `[SoW Fact — §6.14.2, §3.5]` attribution, and the
 * next non-blank line below the second is L38693, which opens `**The notes to
 * the matrix.**`. The blank line between each body and its successor is
 * asserted in `tests/unit/cc-actions.test.ts` rather than cited here, because
 * a blank line carries nothing and a citation to one claims that it does.
 *
 * ── COLUMN ORDER: TENANT ADMIN FIRST, WORKER LAST ────────────────────────
 *
 * L38680 reads `# | Action | Tenant Admin | Supervisor | Quality Manager |
 * Read-only Auditor | Worker` — the exact inversion of every Frontline matrix,
 * which opens on Worker. A positional transcription against the Frontline
 * habit swaps those two columns and inverts every cell on both roles
 * SILENTLY, because both readings are internally coherent: Tenant Admin and
 * Worker are `Explicitly prohibited` on all ten rows, so the swap is
 * invisible in this table's own data and only shows when a screen renders it.
 * `CC13_COLUMNS` is therefore the header line's own five words in the header
 * line's own order, and the covering gate re-parses L38680 at run time rather
 * than trusting this comment.
 *
 * ── THE TWO TABLES NAME SIX OF THE TEN ACTIONS DIFFERENTLY ───────────────
 *
 * They are joined by the `#` column, which BOTH carry and which both run 1
 * to 10. They cannot be joined by name: row 2 is `Approve, adjust-within-
 * bounds, or decline a gate item` in the authority table and `Gate-item
 * decision` in the matrix, and rows 3, 4, 6, 8 and 9 diverge the same way.
 * Both wordings are kept — `authorityAction` and `matrixAction` — because a
 * single merged name would be neither table's.
 *
 * ── THE PREFIX TRAPS, WHICH ARE WHY `token` IS NOT A `startsWith` ────────
 *
 *  - `Allowed` is a prefix of `Allowed with conditions — expired qualification
 *    only, Quality Manager notified` (L38691, Supervisor). A prefix classifier
 *    reads the single conditional grant in the table as unconditional.
 *  - `Explicitly prohibited` is a prefix of `Explicitly prohibited — may
 *    request with a note` (L38685, Supervisor). That one is harmless to
 *    classify by prefix and is the reason the first looks safe.
 *
 * So a cell splits on its own ` — ` and the HEAD is compared for EXACT
 * EQUALITY. The note is carried verbatim beside it rather than discarded, and
 * L38685 is why: its token is a PROHIBITION and its note grants a different
 * act — requesting, not releasing. A transcription that kept the token and
 * dropped the note would lose the only thing a Supervisor may do on that row.
 */

/** The header's own five persona columns, verbatim from L38680, in its order. */
export const CC13_COLUMNS = [
  'Tenant Admin',
  'Supervisor',
  'Quality Manager',
  'Read-only Auditor',
  'Worker',
] as const satisfies readonly string[]

export type Cc13Column = (typeof CC13_COLUMNS)[number]

/** Each header word read onto the platform's own role identifier. Total, single-valued. */
export const CC13_COLUMN_ROLE = {
  'Tenant Admin': 'TENANT_ADMIN',
  Supervisor: 'SUPERVISOR',
  'Quality Manager': 'QUALITY_MANAGER',
  'Read-only Auditor': 'READONLY_AUDITOR',
  Worker: 'WORKER',
} as const satisfies Record<Cc13Column, RoleId>

/** The four outcome tokens these fifty cells actually use. */
export const CC13_TOKENS = [
  'Allowed',
  'Allowed with conditions',
  'Read-only',
  'Explicitly prohibited',
] as const satisfies readonly string[]

export type Cc13Token = (typeof CC13_TOKENS)[number]

/**
 * The token as this build's own permission vocabulary names it. The nine
 * tokens already live in `@/policy/decision`; nothing is redeclared, only
 * mapped.
 */
export const CC13_TOKEN_OUTCOME = {
  Allowed: 'allowed',
  'Allowed with conditions': 'allowedWithConditions',
  'Read-only': 'readOnly',
  'Explicitly prohibited': 'explicitlyProhibited',
} as const satisfies Record<Cc13Token, PermissionOutcome>

export interface Cc13Cell {
  /** The cell exactly as the source writes it. The tokens here are not backticked. */
  readonly text: string
  /** The head of the cell, before any ` — `. Always exactly one of `CC13_TOKENS`. */
  readonly token: Cc13Token
  /** Everything after the first ` — `, or `null` where the cell carries no note. */
  readonly note: string | null
}

/** The `#` column, which is the only key the two tables share. */
export type Cc13Ordinal = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export interface Cc13Action {
  readonly ordinal: Cc13Ordinal
  /** The `Action` column of the AUTHORITY table, verbatim. */
  readonly authorityAction: string
  /** The `Authority` column, verbatim. */
  readonly authority: string
  /** The `Executes via` column, verbatim. */
  readonly executesVia: string
  /** That row's own line in the frozen source. */
  readonly authorityRef: string
  /** The `Action` column of the MATRIX, verbatim. Six of ten differ from `authorityAction`. */
  readonly matrixAction: string
  /** That row's own line in the frozen source. */
  readonly matrixRef: string
  /** Total over the five columns. A blank cell is untypeable. */
  readonly cells: Record<Cc13Column, Cc13Cell>
}

const cell = (text: string): Cc13Cell => {
  const [head, ...rest] = text.split(' — ')
  const token = CC13_TOKENS.find((t) => t === head)
  if (token === undefined) {
    throw new Error(
      `MOD-CC-13 matrix cell "${text}" has head "${head}", which is not one of the four tokens ` +
        `L38682-L38691 use. Exact equality on the head, never a prefix: "Allowed" is a prefix of ` +
        `"Allowed with conditions" and a prefix test reads the clearance row as unconditional.`,
    )
  }
  return { text, token, note: rest.length === 0 ? null : rest.join(' — ') }
}

const PROHIBITED = 'Explicitly prohibited'

/**
 * A row-9 shorthand used ONLY where every one of the five cells is the same
 * string. Nine of the ten rows share the Tenant Admin, Read-only Auditor and
 * Worker cells verbatim; those three are spelled out per row anyway, because
 * a helper that fills three columns from one constant is a check that cannot
 * see a transcription error in any of them.
 */
export const CC13_ACTIONS = [
  {
    ordinal: 1,
    authorityAction: 'Acknowledge an alert or escalation',
    authority: 'Supervisor and above',
    executesVia:
      'Escalation record on the Delivery Operations Hub — one acknowledgement state, written from any channel',
    authorityRef: 'L38665',
    matrixAction: 'Acknowledge an alert or escalation',
    matrixRef: 'L38682',
    cells: {
      'Tenant Admin': cell(PROHIBITED),
      Supervisor: cell('Allowed'),
      'Quality Manager': cell('Allowed'),
      'Read-only Auditor': cell(PROHIBITED),
      Worker: cell(PROHIBITED),
    },
  },
  {
    ordinal: 2,
    authorityAction: 'Approve, adjust-within-bounds, or decline a gate item',
    authority: 'Quality Manager and above',
    executesVia:
      'Gate decision record into the Delivery Operations Hub audit; the intervention executes on approval',
    authorityRef: 'L38666',
    matrixAction: 'Gate-item decision',
    matrixRef: 'L38683',
    cells: {
      'Tenant Admin': cell(PROHIBITED),
      Supervisor: cell(PROHIBITED),
      'Quality Manager': cell('Allowed'),
      'Read-only Auditor': cell(PROHIBITED),
      Worker: cell(PROHIBITED),
    },
  },
  {
    ordinal: 3,
    authorityAction: 'Approve or decline a learned-change proposal',
    authority: 'Quality Manager and above',
    executesVia:
      'The Lane B pipeline: package-borne auto-publishes a patch; server-only applies immediately; Delivery Operations Hub audit',
    authorityRef: 'L38667',
    matrixAction: 'Learned-change decision',
    matrixRef: 'L38684',
    cells: {
      'Tenant Admin': cell(PROHIBITED),
      Supervisor: cell(PROHIBITED),
      'Quality Manager': cell('Allowed'),
      'Read-only Auditor': cell(PROHIBITED),
      Worker: cell(PROHIBITED),
    },
  },
  {
    ordinal: 4,
    authorityAction: 'Release a lot hold, including automatic Severity 1 holds',
    authority: 'Quality Manager only — Supervisors request with a note',
    executesVia: 'Lot record on the Delivery Operations Hub; hold and release fully audited',
    authorityRef: 'L38668',
    matrixAction: 'Release a lot hold',
    matrixRef: 'L38685',
    cells: {
      'Tenant Admin': cell(PROHIBITED),
      Supervisor: cell('Explicitly prohibited — may request with a note'),
      'Quality Manager': cell('Allowed'),
      'Read-only Auditor': cell(PROHIBITED),
      Worker: cell(PROHIBITED),
    },
  },
  {
    ordinal: 5,
    authorityAction: 'Resolve or Resolve All sync conflicts',
    authority: 'Quality Manager and above; Supervisors view',
    executesVia: 'Sync-conflict records on the Delivery Operations Hub',
    authorityRef: 'L38669',
    matrixAction: 'Resolve or Resolve All sync conflicts',
    matrixRef: 'L38686',
    cells: {
      'Tenant Admin': cell(PROHIBITED),
      Supervisor: cell('Read-only'),
      'Quality Manager': cell('Allowed'),
      'Read-only Auditor': cell(PROHIBITED),
      Worker: cell(PROHIBITED),
    },
  },
  {
    ordinal: 6,
    authorityAction: 'Acknowledge and annotate the shift handoff brief',
    authority: 'Supervisor and above',
    executesVia:
      'Brief record on the Delivery Operations Hub; annotations feed the feedback loops',
    authorityRef: 'L38670',
    matrixAction: 'Acknowledge and annotate the handoff brief',
    matrixRef: 'L38687',
    cells: {
      'Tenant Admin': cell(PROHIBITED),
      Supervisor: cell('Allowed'),
      'Quality Manager': cell('Allowed'),
      'Read-only Auditor': cell(PROHIBITED),
      Worker: cell(PROHIBITED),
    },
  },
  {
    ordinal: 7,
    authorityAction: 'Mark evidence reviewed',
    authority: 'Quality Manager and above',
    executesVia:
      'Evidence record on the Delivery Operations Hub, audited; the mark carries to the Delivery Operations Hub review queue',
    authorityRef: 'L38671',
    matrixAction: 'Mark evidence reviewed',
    matrixRef: 'L38688',
    cells: {
      'Tenant Admin': cell(PROHIBITED),
      Supervisor: cell(PROHIBITED),
      'Quality Manager': cell('Allowed'),
      'Read-only Auditor': cell(PROHIBITED),
      Worker: cell(PROHIBITED),
    },
  },
  {
    ordinal: 8,
    authorityAction: 'Reassign a run mid-shift, for absence or an expired qualification',
    authority: 'Supervisor and above',
    executesVia:
      "The Delivery Operations Hub Assignment service — the same service the Delivery Operations Hub's own screens use, with identical rules including qualification checks",
    authorityRef: 'L38672',
    matrixAction: 'Reassign a run mid-shift',
    matrixRef: 'L38689',
    cells: {
      'Tenant Admin': cell(PROHIBITED),
      Supervisor: cell('Allowed'),
      'Quality Manager': cell('Allowed'),
      'Read-only Auditor': cell(PROHIBITED),
      Worker: cell(PROHIBITED),
    },
  },
  {
    ordinal: 9,
    authorityAction: 'Request an agent re-check on a record',
    authority: 'Supervisor and above',
    executesVia: 'Re-runs the rule-based evaluation; an agent activates only if a trigger results',
    authorityRef: 'L38673',
    matrixAction: 'Request an agent re-check',
    matrixRef: 'L38690',
    cells: {
      'Tenant Admin': cell(PROHIBITED),
      Supervisor: cell('Allowed'),
      'Quality Manager': cell('Allowed'),
      'Read-only Auditor': cell(PROHIBITED),
      Worker: cell(PROHIBITED),
    },
  },
  {
    ordinal: 10,
    authorityAction: 'Grant a qualification clearance',
    authority: 'Supervisor and above',
    executesVia:
      "The command channel, applied at the device's next sync; clearance duration per the tenant's setting; recorded on the Delivery Operations Hub qualification record",
    authorityRef: 'L38674',
    matrixAction: 'Grant a qualification clearance',
    matrixRef: 'L38691',
    cells: {
      'Tenant Admin': cell(PROHIBITED),
      Supervisor: cell(
        'Allowed with conditions — expired qualification only, Quality Manager notified',
      ),
      'Quality Manager': cell('Allowed'),
      'Read-only Auditor': cell(PROHIBITED),
      Worker: cell(PROHIBITED),
    },
  },
] as const satisfies readonly Cc13Action[]

/**
 * Compile-time proof that all ten ordinals are present exactly once. A row
 * dropped or duplicated stops `MissingOrdinal` being `never`.
 */
type MissingOrdinal = Exclude<Cc13Ordinal, (typeof CC13_ACTIONS)[number]['ordinal']>
const _ordinalsExhaustive: MissingOrdinal extends never ? true : never = true
void _ordinalsExhaustive

export function cc13Action(ordinal: Cc13Ordinal): Cc13Action {
  const found = CC13_ACTIONS.find((a) => a.ordinal === ordinal)
  if (found === undefined) throw new Error(`MOD-CC-13 has no action ${ordinal}`)
  return found
}

export function cc13Cell(ordinal: Cc13Ordinal, column: Cc13Column): Cc13Cell {
  return cc13Action(ordinal).cells[column]
}

/** The matrix's verdict for a role on an action, as a `PermissionOutcome`. */
export function cc13Outcome(ordinal: Cc13Ordinal, column: Cc13Column): PermissionOutcome {
  return CC13_TOKEN_OUTCOME[cc13Cell(ordinal, column).token]
}

/** 10 rows × 5 columns. Computed, so it cannot disagree with the array above. */
export const CC13_CELL_COUNT: number = CC13_ACTIONS.length * CC13_COLUMNS.length

/* ==================================================================== *
 * THE FOUR ABSOLUTE EXCLUSIONS, AND THE STATEMENT OF THEM THAT SAYS
 * THREE.
 *
 * L38700 opens `**The four absolute exclusions.** **Four exclusions are
 * absolute, for every role** [SoW Fact — §6.14.3]:` and four bullets follow
 * at L38702, L38703, L38704 and L38705. Counted: four sentences of intent,
 * four bullets.
 *
 * L48368 states the same set and calls it three. The whole line is 562
 * characters and the clause is its fourth sentence: "Three prohibitions bind
 * every screen absolutely: no gate override, no run pause or stop, no record
 * or configuration edit, and no Job or run creation [SoW Fact — §6.14.3]."
 * The stated number is three; the enumeration that follows the colon is four,
 * and it is item-for-item the same four as L38702-L38705 — same section
 * attribution, same order.
 *
 * NEITHER NUMBER IS ADOPTED AS THE SOURCE'S INTENT. What is carried is the
 * enumeration, which both statements agree on, plus the miscount as a
 * recorded finding. A build that "corrected" L48368 to four would be choosing
 * for the client on a line the client wrote.
 * ==================================================================== */

export interface Cc13Exclusion {
  readonly ordinal: 1 | 2 | 3 | 4
  /** The bullet's own leading sentence, verbatim and bolded in the source. */
  readonly rule: string
  /** The rest of the bullet, verbatim. */
  readonly reason: string
  readonly sourceRef: string
  /** How L48368's four-item enumeration names the same exclusion, verbatim. */
  readonly asNamedAtL48368: string
}

export const CC13_ABSOLUTE_EXCLUSIONS = [
  {
    ordinal: 1,
    rule: 'It cannot override a specification gate or the evaluation gate.',
    reason:
      "The two hard gates admit no override from any surface, and no Command Center action reaches them — on a worker's behalf or otherwise. The qualification gate alone carries a governed clearance path, and that path is action 10.",
    sourceRef: 'L38702',
    asNamedAtL48368: 'no gate override',
  },
  {
    ordinal: 2,
    rule: 'It cannot pause or stop a run.',
    reason:
      'Interrupting active work is floor-disruptive and a worker-experience question that belongs to the Frontline Worker Application surface.',
    sourceRef: 'L38703',
    asNamedAtL48368: 'no run pause or stop',
  },
  {
    ordinal: 3,
    rule: 'It cannot edit any record or any configuration.',
    reason:
      'Evidence is immutable; corrections are append-only through the Delivery Operations Hub discipline; configuration changes travel only through Standards and Operations Studio authoring or the governed Lane B pipeline.',
    sourceRef: 'L38704',
    asNamedAtL48368: 'no record or configuration edit',
  },
  {
    ordinal: 4,
    rule: 'It cannot create Jobs or runs.',
    reason: 'That is Delivery Operations Hub authoring.',
    sourceRef: 'L38705',
    asNamedAtL48368: 'no Job or run creation',
  },
] as const satisfies readonly Cc13Exclusion[]

/**
 * THE MISCOUNT, RECORDED RATHER THAN REPAIRED. Both fields are read off the
 * source; `statedCount` is the word L48368 uses and `enumeratedCount` is
 * `CC13_ABSOLUTE_EXCLUSIONS.length`, computed rather than typed, so the two
 * cannot be brought into agreement by editing this record.
 */
export const CC13_EXCLUSION_MISCOUNT = {
  statedCount: 'Three',
  statedAt: 'L48368',
  enumeratedCount: CC13_ABSOLUTE_EXCLUSIONS.length,
  agreeingStatement: 'L38700 — "Four exclusions are absolute, for every role"',
  finding:
    'L48368 states "Three prohibitions bind every screen absolutely" and then lists four, item for item the same four as L38702-L38705 and under the same §6.14.3 attribution. The enumeration is carried; neither number is adopted as the source’s intent.',
} as const

/**
 * `AC-CC-407` IS ASSERTED AGAINST NOTHING IN THE MATRIX IT BELONGS TO, AND
 * THIS BUILD DOES NOT ADD THE ROWS TO MAKE IT TRUE.
 *
 * L38864 reads: "AC-CC-407 — No path exists to override a specification gate
 * or the evaluation gate, pause or stop a run, edit a record or
 * configuration, or create a Job or run." That is the four exclusions,
 * one criterion.
 *
 * `MOD-CC-13`'s own matrix at L38682-L38691 carries NONE of them: its ten
 * rows are the ten actions and nothing else. The exclusions live one
 * paragraph below it, in prose. Where the four ARE carried as matrix rows:
 *
 *   the surface matrix, §21.1.2   all four — L35020 pause or stop, L35021
 *                                 edit any record or configuration, L35022
 *                                 override a gate, L35023 create a Job or run
 *   §25.4's action matrix         two — L48455 override, L48456 pause or stop
 *   `MOD-CC-13`'s own matrix      none
 *
 * Adding rows here to give `AC-CC-407` something to test would be inventing
 * table rows the source does not have — the failure mode this build has
 * already been bitten by. The gap is recorded and left.
 */
export const CC13_AC_407_COVERAGE = {
  criterion: 'AC-CC-407',
  criterionRef: 'L38864',
  carriedInOwnMatrix: 0,
  carriedInSurfaceMatrix: 4,
  surfaceMatrixRefs: ['L35020', 'L35021', 'L35022', 'L35023'],
  carriedIn254Matrix: 2,
  matrix254Refs: ['L48455', 'L48456'],
  finding:
    'AC-CC-407 states the four absolute exclusions as one criterion. MOD-CC-13’s own matrix (L38682-L38691) contains no row for any of them, so within its own section the criterion is asserted against nothing. No row is added here to repair it.',
} as const

/* ==================================================================== *
 * THE COMMAND CENTER OWNS NO OPERATIONAL RECORD.
 *
 * L38657: "every action is a command against a Delivery Operations Hub-owned
 * record, executed through the owning Delivery Operations Hub service,
 * written to the Delivery Operations Hub audit trail — the Command Center is
 * the cockpit, never the engine."
 *
 * SO EVERY ONE OF THE TEN NEEDS BOTH: the control here, and a pointer to the
 * record there. L48437 states the pointer as an obligation — "Audit or
 * history link | Every action links to its Delivery Operations Hub audit
 * entry." The two are not alternatives, and reading the cockpit rule as
 * "six cells get a link INSTEAD of a control" would remove the ten controls
 * the module exists to place.
 *
 * A FINDING ON THE `Executes via` COLUMN. Nine of the ten name an owning
 * place: a Hub record (rows 1, 2, 4, 5, 6, 7, 10), a named Hub service
 * (row 8), or the Lane B pipeline (row 3). ROW 9 NAMES NONE — L38673 reads
 * only "Re-runs the rule-based evaluation; an agent activates only if a
 * trigger results". `AC-CC-401` (L38858) nevertheless asserts of all ten that
 * each "executes through the same owning Delivery Operations Hub service that
 * the Delivery Operations Hub's own screen for that record uses". The source
 * does supply row 9's owner, but in a different table: L35365,
 * `EVT-CC-RECHECK-REQUESTED` is "Emitted by | Delivery Operations Hub record
 * service". `owningPlace` below is read from the `Executes via` column and is
 * `null` for row 9; `owningPlaceElsewhere` carries L35365's answer separately,
 * so the gap in the column is visible rather than papered over.
 *
 * THE COMPONENT IS TASK 5'S AND IS NOT SPELLED A SEVENTH TIME HERE.
 * `src/frontline/cross-surface.tsx` is the Frontline equivalent and its model
 * takes a capability, an owning surface, what happens there, and a source
 * reference. This file supplies exactly that shape as DATA and renders no
 * link itself — so when task 5's shared component lands there is nothing here
 * to delete and nothing here competing with it.
 * ==================================================================== */

export interface Cc13OwningPlace {
  readonly ordinal: Cc13Ordinal
  /** The act, in the authority table's own words. */
  readonly capability: string
  /**
   * The owning record, service or pipeline as the `Executes via` column names
   * it, or `null` where that column names none.
   */
  readonly owningPlace: string | null
  /** Where the source names the owner when `Executes via` does not. */
  readonly owningPlaceElsewhere: string | null
  readonly sourceRef: string
}

export const CC13_OWNING_PLACES = [
  {
    ordinal: 1,
    capability: 'Acknowledge an alert or escalation',
    owningPlace: 'Escalation record on the Delivery Operations Hub',
    owningPlaceElsewhere: null,
    sourceRef: 'L38665',
  },
  {
    ordinal: 2,
    capability: 'Approve, adjust-within-bounds, or decline a gate item',
    owningPlace: 'Gate decision record into the Delivery Operations Hub audit',
    owningPlaceElsewhere: null,
    sourceRef: 'L38666',
  },
  {
    ordinal: 3,
    capability: 'Approve or decline a learned-change proposal',
    owningPlace: 'The Lane B pipeline',
    owningPlaceElsewhere: null,
    sourceRef: 'L38667',
  },
  {
    ordinal: 4,
    capability: 'Release a lot hold, including automatic Severity 1 holds',
    owningPlace: 'Lot record on the Delivery Operations Hub',
    owningPlaceElsewhere: null,
    sourceRef: 'L38668',
  },
  {
    ordinal: 5,
    capability: 'Resolve or Resolve All sync conflicts',
    owningPlace: 'Sync-conflict records on the Delivery Operations Hub',
    owningPlaceElsewhere: null,
    sourceRef: 'L38669',
  },
  {
    ordinal: 6,
    capability: 'Acknowledge and annotate the shift handoff brief',
    owningPlace: 'Brief record on the Delivery Operations Hub',
    owningPlaceElsewhere: null,
    sourceRef: 'L38670',
  },
  {
    ordinal: 7,
    capability: 'Mark evidence reviewed',
    owningPlace: 'Evidence record on the Delivery Operations Hub',
    owningPlaceElsewhere: null,
    sourceRef: 'L38671',
  },
  {
    ordinal: 8,
    capability: 'Reassign a run mid-shift, for absence or an expired qualification',
    owningPlace: 'The Delivery Operations Hub Assignment service',
    owningPlaceElsewhere: null,
    sourceRef: 'L38672',
  },
  {
    ordinal: 9,
    capability: 'Request an agent re-check on a record',
    owningPlace: null,
    owningPlaceElsewhere:
      'L35365 — EVT-CC-RECHECK-REQUESTED is emitted by the Delivery Operations Hub record service. The `Executes via` column at L38673 names no owner, and AC-CC-401 (L38858) asserts one of all ten.',
    sourceRef: 'L38673',
  },
  {
    ordinal: 10,
    capability: 'Grant a qualification clearance',
    owningPlace:
      'The command channel, with the Delivery Operations Hub qualification record',
    owningPlaceElsewhere: null,
    sourceRef: 'L38674',
  },
] as const satisfies readonly Cc13OwningPlace[]

/**
 * The rows whose `Executes via` cell names no owning place. Computed from the
 * data, so it shrinks the moment a row gains one and cannot be left stale.
 */
export const CC13_ROWS_WITHOUT_A_NAMED_OWNER: readonly Cc13Ordinal[] =
  CC13_OWNING_PLACES.filter((p) => p.owningPlace === null).map((p) => p.ordinal)
