import type { SurfaceId } from '@/domain/surfaces'
import type { FrontlineMatrixOutcome } from './access'
import type { FrontlineSlug } from './screens'

/**
 * THE CONTROL-MATRIX VOCABULARY THE TWELVE FRONTLINE MATRICES SHARE, AND
 * THE ORDER OF QUESTIONS THAT DECIDES WHAT A CELL DRAWS.
 *
 * THE CELL ARITHMETIC THIS SHAPE HAS TO SURVIVE. Twelve matrices, 106 rows:
 * A1 10, A2 9, A3 10, A4 9, A5 9, A6 9, A7 9, B8 7, B9 9, B10 7, B11 10,
 * B12 8. Eleven of them carry five persona columns and `MOD-FL-A7` carries a
 * sixth, "Platform roles" (its header is L41295). 97 × 5 + 9 × 6 = 539, and
 * 539 status tokens are what the source actually holds — 332 `Explicitly
 * prohibited`, 92 `Not applicable`, 55 `Allowed`, 27 `Allowed with
 * conditions`, 15 `Unavailable`, 11 `Client Decision Required`, 7
 * `Read-only`. Every cell is filled and no row is truncated. `cells` is a
 * TOTAL `Record` over the row's own column set for exactly that reason: a
 * blank cell is untypeable, which is L10238's rule made structural.
 *
 * ── THE ORDER OF QUESTIONS ─────────────────────────────────────────────
 *
 * A ROW DESCRIBING ANOTHER SURFACE IS NEVER AN ENABLED CONTROL HERE,
 * WHATEVER ITS TOKEN READS. Thirty-odd Frontline cells carry `Allowed`,
 * `Allowed with conditions` or `Read-only` while their own text places the
 * act on the Hub, the Command Center, the Studio or the platform console.
 * Eight of them end in the words "not here" or "never here". Six of them are
 * run cancellation and terminal completion, and `EXCL-FL-06` (L39489) makes
 * that an INVARIANT exclusion — shipping the control is a broken guarantee,
 * not a misplacement.
 *
 * `frontlineAffordance` is handed the token DELIBERATELY and reaches it
 * last. It is one ordering, not a special case per row, because the traps
 * are one trap seen from six angles:
 *
 *   1. Is the act met on another SURFACE?          → cross-surface statement
 *   2. Is it met on another DESTINATION of this one? → a named place
 *   3. Does the capability exist here at all?      → a stated line, no control
 *   4. Does the cell route to another row of THIS matrix? → a routed pointer
 *   5. Only now, the token.
 *
 * WHY THE FOURTH CASE IS NOT THE FIRST. `routedTo` names a capability IN
 * THIS MATRIX and nothing else. An alternative on another surface is a
 * cross-surface statement, and an alternative on this very surface is a
 * named place — a pointer is wrong for both. That is why the type below
 * cannot hold a `routedTo` that leaves the matrix: it is keyed on the row
 * ids of the matrix it belongs to.
 *
 * ── WHAT THIS SURFACE NEVER DRAWS ──────────────────────────────────────
 *
 * `FrontlineAffordance` HAS NO `disabled` MEMBER, and that is the rule
 * rather than a convention a reviewer has to notice. A deferred or
 * non-existent capability renders as NO CONTROL plus a stated line where it
 * would sit — not a disabled control, not an empty region. A disabled
 * control is legitimate elsewhere in this build and the source requires one
 * in at least one other place; on the matrix axis of this surface it is not
 * expressible, so no task can reach for it under pressure.
 */

/* ==================================================================== *
 * THE COUNTED SHAPE OF THE TWELVE MATRICES.
 *
 * THREE INDEPENDENT TRANSCRIPTIONS, SO THE ARITHMETIC IS A CHECK AND NOT A
 * RESTATEMENT. `rows` is counted off the row ordinals, `dataLines` off the
 * line numbers, and `FL_TOKEN_TALLY` off the status tokens — three
 * different readings of the same tables. Rows × columns must equal the
 * tally, and each span must be exactly `rows` lines long. A row silently
 * dropped from a transcription moves one of the three and not the others,
 * which a row count alone cannot catch.
 *
 * `MOD-FL-A7` is the only Frontline matrix with a sixth persona column,
 * "Platform roles"; its header is at L41295 and the other eleven carry five.
 * ==================================================================== */

export interface FrontlineMatrixShape {
  readonly module: string
  readonly rows: number
  readonly columns: number
  /** The header line, the separator line, and the first and last data lines. */
  readonly headerLine: number
  readonly separatorLine: number
  readonly firstDataLine: number
  readonly lastDataLine: number
}

export const FL_MATRIX_SHAPE = [
  { module: 'MOD-FL-A1', rows: 10, columns: 5, headerLine: 40186, separatorLine: 40187, firstDataLine: 40188, lastDataLine: 40197 },
  { module: 'MOD-FL-A2', rows: 9, columns: 5, headerLine: 40359, separatorLine: 40360, firstDataLine: 40361, lastDataLine: 40369 },
  { module: 'MOD-FL-A3', rows: 10, columns: 5, headerLine: 40524, separatorLine: 40525, firstDataLine: 40526, lastDataLine: 40535 },
  { module: 'MOD-FL-A4', rows: 9, columns: 5, headerLine: 40720, separatorLine: 40721, firstDataLine: 40722, lastDataLine: 40730 },
  { module: 'MOD-FL-A5', rows: 9, columns: 5, headerLine: 40910, separatorLine: 40911, firstDataLine: 40912, lastDataLine: 40920 },
  { module: 'MOD-FL-A6', rows: 9, columns: 5, headerLine: 41092, separatorLine: 41093, firstDataLine: 41094, lastDataLine: 41102 },
  { module: 'MOD-FL-A7', rows: 9, columns: 6, headerLine: 41295, separatorLine: 41296, firstDataLine: 41297, lastDataLine: 41305 },
  { module: 'MOD-FL-B8', rows: 7, columns: 5, headerLine: 41466, separatorLine: 41467, firstDataLine: 41468, lastDataLine: 41474 },
  { module: 'MOD-FL-B9', rows: 9, columns: 5, headerLine: 41616, separatorLine: 41617, firstDataLine: 41618, lastDataLine: 41626 },
  { module: 'MOD-FL-B10', rows: 7, columns: 5, headerLine: 41790, separatorLine: 41791, firstDataLine: 41792, lastDataLine: 41798 },
  { module: 'MOD-FL-B11', rows: 10, columns: 5, headerLine: 41947, separatorLine: 41948, firstDataLine: 41949, lastDataLine: 41958 },
  { module: 'MOD-FL-B12', rows: 8, columns: 5, headerLine: 42111, separatorLine: 42112, firstDataLine: 42113, lastDataLine: 42120 },
] as const satisfies readonly FrontlineMatrixShape[]

/**
 * Every status token across all twelve matrices, counted. Independently
 * transcribed from the shape above: this is a reading of the CELLS, that is
 * a reading of the ROWS.
 */
export const FL_TOKEN_TALLY: Readonly<Record<string, number>> = {
  'Explicitly prohibited': 332,
  'Not applicable': 92,
  Allowed: 55,
  'Allowed with conditions': 27,
  Unavailable: 15,
  'Client Decision Required': 11,
  'Read-only': 7,
}

/**
 * All eleven `Client Decision Required` cells sit in the Tenant Admin
 * column, and every one of them defers to the same unanswered question —
 * whether a Tenant Admin holds a device session at all (L39837,
 * `AC-FL-009-5` at L39948). `src/routes/definitions.ts` records that
 * question once so these eleven are not answered eleven times privately.
 */
export const TENANT_ADMIN_OPEN_CELLS = [
  { module: 'MOD-FL-A1', sourceRef: 'L40188' },
  { module: 'MOD-FL-A1', sourceRef: 'L40189' },
  { module: 'MOD-FL-A1', sourceRef: 'L40190' },
  { module: 'MOD-FL-A1', sourceRef: 'L40192' },
  { module: 'MOD-FL-A2', sourceRef: 'L40361' },
  { module: 'MOD-FL-A3', sourceRef: 'L40526' },
  { module: 'MOD-FL-A3', sourceRef: 'L40534' },
  { module: 'MOD-FL-A4', sourceRef: 'L40722' },
  { module: 'MOD-FL-A7', sourceRef: 'L41300' },
  { module: 'MOD-FL-B9', sourceRef: 'L41623' },
  { module: 'MOD-FL-B9', sourceRef: 'L41624' },
] as const

/**
 * WHERE A ROW'S CAPABILITY IS MET. Four members, and the fourth is the one
 * `@/surfaces/doh/modules` names as its remedy and does not take:
 * `another-screen`, "excluded from reach exactly as `another-surface` is and
 * rendered as a named pointer rather than a cross-surface link." The Hub
 * carries three recorded divergences because it has three tokens and needs
 * four; this surface starts with four.
 *
 * `SURF-FL` is the surface. A capability met on another DESTINATION of it —
 * the sync detail sheet, the step-up overlay, Profile-lite's logout — is
 * `another-destination`, never `another-surface`: L1598 and `AC-PROD-040`
 * (L1614) cap the platform at five surfaces, and a cross-surface statement
 * over a Frontline destination would claim a sixth.
 */
export type FrontlineRowSurface =
  /** Met on this destination's own screen. */
  | 'screen'
  /** Met in the persistent chrome — the sync indicator, the device-mode marker. */
  | 'chrome'
  /** Met on another destination of THIS surface. A named place, never a link off-surface. */
  | 'another-destination'
  /** Met on another SURFACE entirely. A statement, never a control. */
  | 'another-surface'

export const FRONTLINE_ROW_SURFACES = [
  'screen',
  'chrome',
  'another-destination',
  'another-surface',
] as const satisfies readonly FrontlineRowSurface[]

type MissingFromRowSurfaces = Exclude<
  FrontlineRowSurface,
  (typeof FRONTLINE_ROW_SURFACES)[number]
>
const _rowSurfacesExhaustive: MissingFromRowSurfaces extends never ? true : never = true
void _rowSurfacesExhaustive

/**
 * Whether the capability exists on this surface at all. Separate from the
 * status token because they answer different questions and the source proves
 * it: `Unavailable` means "exists and is absent under a stated condition" at
 * L42114 (training material offline, back at the next connection) and
 * "exists nowhere for anyone" at L42120 (practice mode) and L41797
 * (operating-system push) — six rows apart in one matrix. One has a route
 * back and the other never will, and a token cannot tell them apart.
 */
export type FrontlineCapabilityExistence =
  /** Built here, now. */
  | 'present'
  /** Exists, absent under a stated condition, returns when the condition lifts. */
  | 'absent-under-condition'
  /** Exists nowhere for anyone, in this scope. Never returns. */
  | 'not-in-scope'
  /** Real, and this build has not reached it yet. A schedule claim, not a product claim. */
  | 'deferred-to-a-later-slice'

export const FRONTLINE_CAPABILITY_EXISTENCE = [
  'present',
  'absent-under-condition',
  'not-in-scope',
  'deferred-to-a-later-slice',
] as const satisfies readonly FrontlineCapabilityExistence[]

type MissingFromExistence = Exclude<
  FrontlineCapabilityExistence,
  (typeof FRONTLINE_CAPABILITY_EXISTENCE)[number]
>
const _existenceExhaustive: MissingFromExistence extends never ? true : never = true
void _existenceExhaustive

/**
 * ONE CELL. `outcome` is required and non-nullable, `note` is required and
 * verbatim from the source's own cell, and there is no field in which a
 * blank could be recorded.
 *
 * ON THE ELLIPTICAL CELLS, WHICH ARE A THIRD TRAP SHAPE AND NOT A SMALL ONE.
 * Eleven permissive Frontline cells say only "— same", "— same path" or
 * "— same location, same floor constraint", inheriting the surface from the
 * neighbouring cell without naming it: L40194 (two cells), L40919, L41299
 * (two), L41472, L41620, L41623, L41954, L41955, L41958. A rule that
 * classified a CELL by looking for a surface name in its own text misses
 * every one of them, and misses L41100 and L41622 for the same reason —
 * those two name a condition and no surface at all. So `surface`,
 * `existence` and `metElsewhere` are declared PER ROW, never per cell: an
 * elliptical cell inherits the row's classification because the
 * classification was never a property of the cell's wording.
 */
export interface FrontlineMatrixCell {
  readonly outcome: FrontlineMatrixOutcome
  /** The cell's own words from the source, verbatim. Never invented, never blank. */
  readonly note: string
  /** The open decision this cell defers to, where the outcome is one. */
  readonly openDecision: string | null
}

/** Where an act is met, when the row says it is not met on this screen. */
export type FrontlineMetElsewhere =
  | {
      readonly where: 'another-surface'
      /** Never `SURF-FL`. A capability met here is not a surface crossing. */
      readonly surface: Exclude<SurfaceId, 'SURF-FL'>
      /** The row's own words for what happens there. Verbatim. */
      readonly note: string
    }
  | {
      readonly where: 'another-destination'
      readonly destination: FrontlineSlug
      readonly note: string
    }

/**
 * ONE ROW. `Id` is the matrix's own row-id union, which is what makes
 * `routedTo` unable to leave the matrix.
 */
export interface FrontlineMatrixRow<
  Id extends string = string,
  Column extends string = string,
> {
  readonly id: Id
  /** The Action column, verbatim. */
  readonly control: string
  readonly surface: FrontlineRowSurface
  readonly existence: FrontlineCapabilityExistence
  /**
   * Required when `surface` is `another-surface` or `another-destination`,
   * and `null` otherwise. The two are held together by
   * `frontlineAffordance`, which refuses a row that classifies itself away
   * from this screen and names nowhere to send a reader.
   */
  readonly metElsewhere: FrontlineMetElsewhere | null
  /**
   * A capability IN THIS MATRIX that this column is routed to instead.
   * Keyed on `Id`, so a pointer at a row this matrix does not hold does not
   * compile. Absent for every column that is not routed.
   */
  readonly routedTo: Partial<Readonly<Record<Column, Id>>>
  /** TOTAL over the columns. A blank cell is untypeable. */
  readonly cells: Readonly<Record<Column, FrontlineMatrixCell>>
  /** The row's own line in the frozen source. */
  readonly sourceRef: string
}

/* ==================================================================== *
 * WHAT A CELL DRAWS. Five members, and none of them is `disabled`.
 * ==================================================================== */

export type FrontlineAffordance =
  /** The worker's own act, on this screen. The only member that draws a control. */
  | {
      readonly kind: 'control'
      readonly outcome: Extract<FrontlineMatrixOutcome, 'allowed' | 'allowedWithConditions'>
      readonly note: string
    }
  /** Visible and unchangeable, with the cause named. Not a refusal. */
  | { readonly kind: 'read-only'; readonly note: string }
  /** Owned by another SURFACE. A statement, and a link only where the pointer checks out. */
  | {
      readonly kind: 'cross-surface'
      readonly surface: Exclude<SurfaceId, 'SURF-FL'>
      readonly note: string
    }
  /** Met on another destination of THIS surface. A named place, never a link off-surface. */
  | {
      readonly kind: 'named-place'
      readonly destination: FrontlineSlug
      readonly note: string
    }
  /** Routed to another row of THIS matrix. */
  | { readonly kind: 'routed'; readonly toRowId: string; readonly note: string }
  /**
   * NO CONTROL, and a stated line where the control would sit. The line is
   * required and carries the reason — an empty region and a disabled control
   * are both refused by this member existing instead of them.
   */
  | {
      readonly kind: 'stated-line'
      readonly existence: Exclude<FrontlineCapabilityExistence, 'present'>
      readonly line: string
    }
  /** A refusal, with its reason. Audited where the platform requires it. */
  | {
      readonly kind: 'refusal'
      readonly outcome: Extract<
        FrontlineMatrixOutcome,
        'explicitlyProhibited' | 'unavailable' | 'clientDecisionRequired' | 'notApplicable'
      >
      readonly note: string
      readonly openDecision: string | null
    }

/**
 * THE ORDER OF QUESTIONS, AS ONE FOLD.
 *
 * It is handed the token and reaches it in the last branch. That is the
 * whole rule: a cell reading `Allowed` whose act is the Delivery Operations
 * Hub's returns a cross-surface statement, and the token is not corrected,
 * downgraded or hidden — the matrix goes on saying `Allowed` on screen with
 * its own words and its own locator. What is refused is the CONTROL.
 */
/**
 * `NoInfer` ON THE COLUMN, AND IT IS LOAD-BEARING RATHER THAN TIDY.
 *
 * `Column` must be inferred from the ROW, never from the column argument. A
 * matrix is written `as const` — the idiom across all eighteen Studio matrices
 * and every Frontline one — so its rows carry literal types, and `routedTo`
 * carries the literal keys it actually names. Let `Column` infer from the
 * argument and asking about ONE column instantiates the row type at that one
 * column: a row routing `{ worker: 'append-correction' }` then shares no
 * property with `Partial<Record<'readonlyAuditor', …>>`, and TypeScript's
 * weak-type check rejects it — an error about a column the caller is not
 * asking about, raised against a row that is correct.
 *
 * Three call sites hit it the moment `A3_MATRIX` was moved onto the shipped
 * `as const` idiom, and every one asked a legitimate question: one column, one
 * pair of columns, one subset. Annotating each row at each call site is the
 * same repair written three times and again for every module still to come.
 * Inferring `Column` from the row and constraining the argument to a member of
 * it is the same check, asked once, where all callers route.
 */
export function frontlineAffordance<Id extends string, Column extends string>(
  row: FrontlineMatrixRow<Id, Column>,
  column: NoInfer<Column>,
): FrontlineAffordance {
  const cell = row.cells[column]

  // 1 and 2. THE CLASSIFICATION, BEFORE THE TOKEN.
  if (row.surface === 'another-surface' || row.surface === 'another-destination') {
    const met = row.metElsewhere
    if (met === null) {
      throw new Error(
        `Frontline matrix row "${row.id}" is classified \`${row.surface}\` and names nowhere ` +
          'to send a reader. A row that is not met on this screen must say where it is met.',
      )
    }
    return met.where === 'another-surface'
      ? { kind: 'cross-surface', surface: met.surface, note: met.note }
      : { kind: 'named-place', destination: met.destination, note: met.note }
  }

  // 3. DOES IT EXIST HERE AT ALL. Before the token, because `Unavailable`
  //    carries two opposite senses in one matrix and only this field
  //    separates them.
  if (row.existence !== 'present') {
    return {
      kind: 'stated-line',
      existence: row.existence,
      line: statedLine(row, cell),
    }
  }

  // 4. A CAPABILITY IN THIS MATRIX.
  const routed = row.routedTo[column]
  if (routed !== undefined) {
    return { kind: 'routed', toRowId: routed, note: cell.note }
  }

  // 5. ONLY NOW, THE TOKEN.
  switch (cell.outcome) {
    case 'allowed':
    case 'allowedWithConditions':
      return { kind: 'control', outcome: cell.outcome, note: cell.note }
    case 'readOnly':
      return { kind: 'read-only', note: cell.note }
    case 'explicitlyProhibited':
    case 'unavailable':
    case 'clientDecisionRequired':
    case 'notApplicable':
      return {
        kind: 'refusal',
        outcome: cell.outcome,
        note: cell.note,
        openDecision: cell.openDecision,
      }
  }
}

/**
 * The sentence that stands where the control would have been. It always
 * names WHAT would sit here and WHY it does not, because a line that says
 * only "not available" is the empty region wearing a sentence.
 */
function statedLine(
  row: { readonly control: string; readonly existence: FrontlineCapabilityExistence },
  cell: FrontlineMatrixCell,
): string {
  const why =
    row.existence === 'absent-under-condition'
      ? `${cell.note} It returns when that condition lifts.`
      : row.existence === 'not-in-scope'
        ? `${cell.note} It exists nowhere for anyone in this scope, so there is nothing to come back to.`
        : `${cell.note} It is real and this build has not reached it yet.`
  return `${row.control} — no control is drawn here. ${why}`
}

/**
 * `EXCL-FL-06` (L39489) classifies run cancellation and terminal completion
 * as an INVARIANT exclusion, so a control for one is a broken guarantee
 * rather than a misplaced button. Six cells across three matrices carry a
 * permissive token for exactly those two acts and every one of them reads
 * "in the Delivery Operations Hub" or "not here": L40369 (`MOD-FL-A2`),
 * L40535 (`MOD-FL-A3`), L41953 and L41954 (`MOD-FL-B11`). Four rows, two
 * permissive cells each — the Supervisor's and the Quality Manager's.
 *
 * A module that classifies one of those rows `screen` is refused here rather
 * than at review, because three different tasks meet the same act
 * independently and one catching it does not protect the other two.
 */
export const INVARIANT_EXCLUDED_ACTS = [
  { act: 'Cancel a Run', sourceRef: 'L40369, L41953; EXCL-FL-06 L39489' },
  { act: 'Terminally complete or cancel the Run', sourceRef: 'L40535; EXCL-FL-06 L39489' },
  { act: 'Terminally complete a Run', sourceRef: 'L41954; EXCL-FL-06 L39489' },
] as const

const INVARIANT_ACT_TEXT: ReadonlySet<string> = new Set(
  INVARIANT_EXCLUDED_ACTS.map((a) => a.act),
)

/**
 * Every row on which this surface would draw a control for an act the source
 * places elsewhere. Non-empty is the defect; the returned strings are the
 * rows, so a failure names them rather than reporting a count.
 *
 * TWO DEFECT SHAPES, ONE ANSWER, and the second is the one that actually
 * ships: nobody writes `surface: 'another-surface'` and then draws a button
 * on it. What happens is that the cell reads `Allowed`, the row gets
 * classified by its token, and the button follows honestly from a wrong
 * classification.
 */
export function controlsOnActsHeldElsewhere<Id extends string, Column extends string>(
  rows: readonly FrontlineMatrixRow<Id, Column>[],
  columns: readonly Column[],
): readonly string[] {
  const offenders: string[] = []
  for (const row of rows) {
    if (INVARIANT_ACT_TEXT.has(row.control) && row.surface !== 'another-surface') {
      offenders.push(
        `${row.id}: "${row.control}" is an EXCL-FL-06 invariant exclusion and is classified \`${row.surface}\``,
      )
    }
    for (const column of columns) {
      const drawn = frontlineAffordance(row, column)
      if (drawn.kind !== 'control') continue
      if (row.surface === 'screen' || row.surface === 'chrome') continue
      offenders.push(`${row.id}: draws a control for ${column} on a \`${row.surface}\` row`)
    }
  }
  return offenders
}
