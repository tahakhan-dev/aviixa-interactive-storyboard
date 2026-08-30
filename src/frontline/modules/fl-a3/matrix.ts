import {
  FL_MATRIX_SHAPE,
  type FrontlineMatrixRow,
  type FrontlineMatrixShape,
} from '@/frontline/matrix'

/**
 * `MOD-FL-A3`'S PERMISSION MATRIX, TRANSCRIBED ROW BY ROW AND CELL BY CELL.
 *
 * Header L40524, separator L40525, data L40526-L40535. Ten rows, five persona
 * columns, fifty cells — and the shape is not restated here: `A3_SHAPE` below
 * READS the row out of `FL_MATRIX_SHAPE`, which is wave 0's own count. A
 * second spelling of "ten rows" is a second thing that can be wrong.
 *
 * ── HOW `note` IS DEFINED, EXACTLY ────────────────────────────────────────
 *
 * `note` is the SOURCE CELL'S ENTIRE TEXT with its backticks removed, and
 * nothing else. Not the words after the token, not a summary, not a blank
 * where the cell carries only a token. That definition is mechanical, so
 * `tests/unit/fl-a3.test.ts` rebuilds all fifty notes from the frozen source
 * by splitting the row on pipes and stripping backticks, and compares. A
 * transcription that drifted by one word fails at the cell that drifted.
 *
 * It also settles the "blank cell" problem the type raises. Six of these
 * fifty cells carry a token and nothing after it; under this definition their
 * note is the token's own words, which is what the cell actually says. There
 * is no cell for which nothing could be written, so `cells` being a TOTAL
 * `Record` costs nothing and buys the guarantee.
 *
 * ── THE TWO ROWS CLASSIFIED AWAY FROM THIS SCREEN ─────────────────────────
 *
 * Row 7 and row 10, and they are the same trap from two angles.
 *
 * **Row 10, L40535.** The Supervisor and the Quality Manager both read
 * `Allowed` and both say "in the Delivery Operations Hub, not here".
 * `EXCL-FL-06` (L39489) reads "Worker-initiated Run cancellation or terminal
 * completion | Governance action, segregation of duties | Delivery Operations
 * Hub | **Invariant**" — so a control here is a BROKEN GUARANTEE and not a
 * misplaced button. Wave 0 refuses this row at the type level rather than at
 * review: `INVARIANT_EXCLUDED_ACTS` carries the exact string "Terminally
 * complete or cancel the Run", and `controlsOnActsHeldElsewhere` reports any
 * row carrying it that is not classified `another-surface`. Three separate
 * modules meet this act independently and one catching it does not protect
 * the other two, which is why the check is wave 0's and not this file's.
 *
 * **Row 7, L40532.** Harder, because no cell ends in "not here" except the
 * Tenant Admin's, and three of the five read `Explicitly prohibited`. Reading
 * the row by its majority token classifies it `screen` and renders four
 * refusals — telling a Supervisor they are forbidden from an act they perform
 * daily in the Delivery Operations Hub. The Supervisor's own cell says where
 * it happens: "the profile field is maintained in the Delivery Operations
 * Hub". `FUNC-A3-04-1-1` (L40622) says the same in full: "the Tenant Admin or
 * Supervisor maintains the profile field in the Delivery Operations Hub".
 * So the row is `another-surface`, and the per-cell tokens still render
 * beside it — wave 0's rule is that the token is not corrected, downgraded or
 * hidden; what is refused is the CONTROL.
 *
 * ── AND THE ROW THAT LOOKS THE SAME AND IS NOT ────────────────────────────
 *
 * **Row 9, L40534.** The Supervisor and the Quality Manager read `Allowed —
 * by second-identity step-up`, which is the same permissive-token-on-a-
 * non-Worker shape as row 10. It is a GENUINE on-device control: L40520 puts
 * both roles on this screen "momentarily, at an authored sign-off screen
 * through the second-identity step-up", and `FUNC-A3-05-3-1` (L40630) builds
 * it as "a screen type in its own right". Applying "Supervisor permissive
 * means elsewhere" uniformly deletes the one non-Worker control this module
 * owns. Row 9 is `screen`.
 */

export type A3RowId =
  | 'advance'
  | 'review-prior-screen'
  | 'edit-before-commit'
  | 'alter-committed-value'
  | 'append-correction'
  | 'skip-gated-step'
  | 'difficulty-level'
  | 'declare-worker-finished'
  | 'authorise-sign-off'
  | 'terminally-complete-or-cancel'

/** The five persona columns of L40524, in the header's own order. */
export type A3Column =
  | 'worker'
  | 'supervisor'
  | 'qualityManager'
  | 'tenantAdmin'
  | 'readonlyAuditor'

export const A3_COLUMNS = [
  'worker',
  'supervisor',
  'qualityManager',
  'tenantAdmin',
  'readonlyAuditor',
] as const satisfies readonly A3Column[]

type MissingFromColumns = Exclude<A3Column, (typeof A3_COLUMNS)[number]>
const _columnsExhaustive: MissingFromColumns extends never ? true : never = true
void _columnsExhaustive

/** The header's own wording for each column, L40524, verbatim. */
export const A3_COLUMN_HEADINGS: Readonly<Record<A3Column, string>> = {
  worker: 'Worker',
  supervisor: 'Supervisor',
  qualityManager: 'Quality Manager',
  tenantAdmin: 'Tenant Admin',
  readonlyAuditor: 'Read-only Auditor',
}

/**
 * Wave 0's count for this matrix, READ rather than restated. If the shape row
 * ever disappears this throws at module load, which is louder and earlier
 * than a screen quietly rendering the wrong span.
 */
export const A3_SHAPE: FrontlineMatrixShape = (() => {
  const found = FL_MATRIX_SHAPE.find((m) => m.module === 'MOD-FL-A3')
  if (found === undefined) {
    throw new Error('FL_MATRIX_SHAPE holds no row for MOD-FL-A3; wave 0 and this module disagree.')
  }
  return found
})()

export type A3MatrixRow = FrontlineMatrixRow<A3RowId, A3Column>

/**
 * The only two `Client Decision Required` cells in this matrix, both in the
 * Tenant Admin column: L40526 and L40534. Wave 0's `TENANT_ADMIN_OPEN_CELLS`
 * lists exactly those two for `MOD-FL-A3` and the suite holds the two lists
 * equal. They defer to `AC-FL-009-5` (L39948) — whether a Tenant Admin holds a
 * device session at all — which `src/routes/definitions.ts` records once, as
 * a QUESTION and not an answer. This module discloses it; it does not answer
 * it in either direction, which is what the criterion forbids.
 */
export const A3_TENANT_ADMIN_OPEN_DECISION = 'AC-FL-009-5'

const NA_NO_SESSION = 'Not applicable — no execution session'
const PROHIBITED = 'Explicitly prohibited'
const HUB = 'the Delivery Operations Hub'

export const A3_MATRIX = [
  {
    id: 'advance',
    control: 'Advance through the authored sequence',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    cells: {
      worker: { outcome: 'allowed', note: 'Allowed', openDecision: null },
      supervisor: { outcome: 'notApplicable', note: NA_NO_SESSION, openDecision: null },
      qualityManager: { outcome: 'notApplicable', note: NA_NO_SESSION, openDecision: null },
      tenantAdmin: {
        outcome: 'clientDecisionRequired',
        note: 'Client Decision Required',
        openDecision: A3_TENANT_ADMIN_OPEN_DECISION,
      },
      readonlyAuditor: { outcome: 'explicitlyProhibited', note: PROHIBITED, openDecision: null },
    },
    sourceRef: 'L40526',
  },
  {
    id: 'review-prior-screen',
    control: 'Review a prior completed screen',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    cells: {
      worker: { outcome: 'readOnly', note: 'Read-only', openDecision: null },
      supervisor: { outcome: 'notApplicable', note: NA_NO_SESSION, openDecision: null },
      qualityManager: { outcome: 'notApplicable', note: NA_NO_SESSION, openDecision: null },
      tenantAdmin: { outcome: 'notApplicable', note: 'Not applicable', openDecision: null },
      readonlyAuditor: { outcome: 'explicitlyProhibited', note: PROHIBITED, openDecision: null },
    },
    sourceRef: 'L40527',
  },
  {
    id: 'edit-before-commit',
    control: 'Edit a value before commit',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    cells: {
      worker: { outcome: 'allowed', note: 'Allowed', openDecision: null },
      supervisor: { outcome: 'notApplicable', note: NA_NO_SESSION, openDecision: null },
      qualityManager: { outcome: 'notApplicable', note: NA_NO_SESSION, openDecision: null },
      tenantAdmin: { outcome: 'notApplicable', note: 'Not applicable', openDecision: null },
      readonlyAuditor: { outcome: 'explicitlyProhibited', note: PROHIBITED, openDecision: null },
    },
    sourceRef: 'L40528',
  },
  {
    /**
     * THE SAME FIELD, THE OPPOSITE ACT, THE ADJACENT ROW. Row 4 is prohibited
     * for all five columns and row 5 is `Allowed` for the Worker. A screen
     * that renders row 4 as a flat refusal tells the worker there is nothing
     * to be done about a wrong value, which is false and is the one thing the
     * append-only design exists to make untrue. `STATE-06` (L48666) is the
     * source's own sentence for it: "Values cannot be changed; a correction is
     * recorded as a new entry."
     *
     * So the Worker's cell is ROUTED to row 5 — a pointer inside this matrix,
     * which is what `routedTo` is for and why it is keyed on `A3RowId` and
     * cannot leave. Only the Worker: for the other four columns row 5 is
     * `Not applicable` or `Explicitly prohibited` too, and pointing them at it
     * would route a reader to a second refusal.
     */
    id: 'alter-committed-value',
    control: 'Alter a committed value in place',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: { worker: 'append-correction' },
    cells: {
      worker: { outcome: 'explicitlyProhibited', note: PROHIBITED, openDecision: null },
      supervisor: { outcome: 'explicitlyProhibited', note: PROHIBITED, openDecision: null },
      qualityManager: { outcome: 'explicitlyProhibited', note: PROHIBITED, openDecision: null },
      tenantAdmin: { outcome: 'explicitlyProhibited', note: PROHIBITED, openDecision: null },
      readonlyAuditor: { outcome: 'explicitlyProhibited', note: PROHIBITED, openDecision: null },
    },
    sourceRef: 'L40529',
  },
  {
    id: 'append-correction',
    control: 'Append a correction to a committed value',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    cells: {
      worker: { outcome: 'allowed', note: 'Allowed', openDecision: null },
      supervisor: { outcome: 'notApplicable', note: NA_NO_SESSION, openDecision: null },
      qualityManager: { outcome: 'notApplicable', note: NA_NO_SESSION, openDecision: null },
      tenantAdmin: { outcome: 'notApplicable', note: 'Not applicable', openDecision: null },
      readonlyAuditor: { outcome: 'explicitlyProhibited', note: PROHIBITED, openDecision: null },
    },
    sourceRef: 'L40530',
  },
  {
    /**
     * `EXCL-FL-05` (L39488) is the other Invariant exclusion this module
     * meets: "Worker-initiated gate override | The gate is the guarantee |
     * Client Command Center action 10, qualification clearance only |
     * Invariant". Unlike row 10 the ACT is met here — the gate blocks the step
     * on this screen — so the row is `screen` and every cell is a refusal
     * rendered where the control would have been. The clearance that unblocks
     * it is a command, not a control: `CMD-FL-CLEAR` in
     * `src/frontline/commands.ts`, applied on the device, originated nowhere
     * near it.
     */
    id: 'skip-gated-step',
    control: 'Skip a gated step',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    cells: {
      worker: { outcome: 'explicitlyProhibited', note: PROHIBITED, openDecision: null },
      supervisor: { outcome: 'explicitlyProhibited', note: PROHIBITED, openDecision: null },
      qualityManager: { outcome: 'explicitlyProhibited', note: PROHIBITED, openDecision: null },
      tenantAdmin: { outcome: 'explicitlyProhibited', note: PROHIBITED, openDecision: null },
      readonlyAuditor: { outcome: 'explicitlyProhibited', note: PROHIBITED, openDecision: null },
    },
    sourceRef: 'L40531',
  },
  {
    id: 'difficulty-level',
    control: 'Change the rendered work-instruction difficulty level',
    surface: 'another-surface',
    existence: 'present',
    metElsewhere: {
      where: 'another-surface',
      surface: 'SURF-DOH',
      note:
        'The Supervisor’s own cell says where the act is met — "the profile field is maintained in ' +
        `${HUB}" — and the Tenant Admin's reads "Allowed with conditions — in ${HUB} worker record, ` +
        'not here". FUNC-A3-04-1-1 (L40622) states it in full: the Tenant Admin or Supervisor ' +
        'maintains the profile field there. Nobody changes a difficulty level on this device, and ' +
        'no worker changes their own on any surface.',
    },
    routedTo: {},
    cells: {
      worker: {
        outcome: 'explicitlyProhibited',
        note: 'Explicitly prohibited — the level is selected by a worker-profile parameter',
        openDecision: null,
      },
      supervisor: {
        outcome: 'explicitlyProhibited',
        note: `Explicitly prohibited on this surface; the profile field is maintained in ${HUB}`,
        openDecision: null,
      },
      qualityManager: {
        outcome: 'explicitlyProhibited',
        note: 'Explicitly prohibited on this surface',
        openDecision: null,
      },
      tenantAdmin: {
        outcome: 'allowedWithConditions',
        note: `Allowed with conditions — in ${HUB} worker record, not here`,
        openDecision: null,
      },
      readonlyAuditor: { outcome: 'explicitlyProhibited', note: PROHIBITED, openDecision: null },
    },
    sourceRef: 'L40532',
  },
  {
    id: 'declare-worker-finished',
    control: 'Declare worker-finished',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    cells: {
      worker: { outcome: 'allowed', note: 'Allowed', openDecision: null },
      supervisor: { outcome: 'notApplicable', note: NA_NO_SESSION, openDecision: null },
      qualityManager: { outcome: 'notApplicable', note: NA_NO_SESSION, openDecision: null },
      tenantAdmin: { outcome: 'notApplicable', note: 'Not applicable', openDecision: null },
      readonlyAuditor: { outcome: 'explicitlyProhibited', note: PROHIBITED, openDecision: null },
    },
    sourceRef: 'L40533',
  },
  {
    id: 'authorise-sign-off',
    control: 'Authorise an authored sign-off screen',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    cells: {
      worker: { outcome: 'explicitlyProhibited', note: PROHIBITED, openDecision: null },
      supervisor: {
        outcome: 'allowed',
        note: 'Allowed — by second-identity step-up',
        openDecision: null,
      },
      qualityManager: {
        outcome: 'allowed',
        note: 'Allowed — by second-identity step-up',
        openDecision: null,
      },
      tenantAdmin: {
        outcome: 'clientDecisionRequired',
        note: 'Client Decision Required',
        openDecision: A3_TENANT_ADMIN_OPEN_DECISION,
      },
      readonlyAuditor: { outcome: 'explicitlyProhibited', note: PROHIBITED, openDecision: null },
    },
    sourceRef: 'L40534',
  },
  {
    id: 'terminally-complete-or-cancel',
    control: 'Terminally complete or cancel the Run',
    surface: 'another-surface',
    existence: 'present',
    metElsewhere: {
      where: 'another-surface',
      surface: 'SURF-DOH',
      note:
        'The Supervisor and the Quality Manager both read "Allowed — in the Delivery Operations ' +
        'Hub, not here". EXCL-FL-06 (L39489) classifies worker-initiated Run cancellation or ' +
        'terminal completion as an Invariant exclusion on the ground of segregation of duties, so ' +
        'a control drawn here would be a broken guarantee rather than a button in the wrong place.',
    },
    routedTo: {},
    cells: {
      worker: { outcome: 'explicitlyProhibited', note: PROHIBITED, openDecision: null },
      supervisor: {
        outcome: 'allowed',
        note: `Allowed — in ${HUB}, not here`,
        openDecision: null,
      },
      qualityManager: {
        outcome: 'allowed',
        note: `Allowed — in ${HUB}, not here`,
        openDecision: null,
      },
      tenantAdmin: { outcome: 'explicitlyProhibited', note: PROHIBITED, openDecision: null },
      readonlyAuditor: { outcome: 'explicitlyProhibited', note: PROHIBITED, openDecision: null },
    },
    sourceRef: 'L40535',
  },
] as const satisfies readonly A3MatrixRow[]

/**
 * The token tally for THIS matrix, counted off the cells rather than declared.
 * The suite checks it three ways — against fifty, against `A3_SHAPE.rows`
 * times `A3_COLUMNS.length`, and against a fresh count taken from the frozen
 * source — so a dropped cell moves one reading and not the others.
 */
export function a3TokenTally(
  rows: readonly A3MatrixRow[] = A3_MATRIX,
): Readonly<Record<string, number>> {
  const tally: Record<string, number> = {}
  for (const row of rows) {
    for (const column of A3_COLUMNS) {
      const outcome = row.cells[column].outcome
      tally[outcome] = (tally[outcome] ?? 0) + 1
    }
  }
  return tally
}

export function a3CellCount(rows: readonly A3MatrixRow[] = A3_MATRIX): number {
  return rows.length * A3_COLUMNS.length
}

export function a3Row(id: A3RowId, rows: readonly A3MatrixRow[] = A3_MATRIX): A3MatrixRow {
  const found = rows.find((r) => r.id === id)
  if (found === undefined) throw new Error(`MOD-FL-A3 holds no matrix row "${id}"`)
  return found
}
