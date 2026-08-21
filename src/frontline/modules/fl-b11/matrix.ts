import type { RoleId } from '@/domain/roles'
import type { FrontlineMatrixCell, FrontlineMatrixRow } from '@/frontline/matrix'

/**
 * `MOD-FL-B11`'s permission matrix, transcribed row by row and cell by cell.
 * Header L41947, separator L41948, data L41949-L41958. TEN rows, FIVE columns,
 * FIFTY cells, every one of them filled.
 *
 * `FrontlineMatrixRow` and `FrontlineMatrixCell` are wave 0's types and are
 * parameterised here, never redefined, and no second evaluator is written: the
 * verdict comes from `frontlineAffordance` in `@/frontline/matrix`.
 *
 * ── WHAT THIS MATRIX HAS, AND WHAT IT DOES NOT ─────────────────────────
 *
 * FOUR OF THE SEVEN TOKENS APPEAR, and they sum to the cell count rather than
 * being asserted beside it: `Explicitly prohibited` 26, `Not applicable` 12,
 * `Allowed` 8, `Allowed with conditions` 4 — 26 + 12 + 8 + 4 = 50 = 10 × 5.
 *
 * NO `Client Decision Required` CELL, so `openDecision` is `null` on all
 * fifty. All eleven of them across the twelve matrices sit in the Tenant Admin
 * column and every one is enumerated in wave 0's `TENANT_ADMIN_OPEN_CELLS`;
 * none of the eleven is `MOD-FL-B11`. This module's five Tenant Admin
 * prohibitions and five Tenant Admin `Not applicable` cells defer nothing, and
 * the `AC-FL-009-5` device-session question is not this module's to carry. Its
 * open decisions are elsewhere — in `service.ts`, on behaviour rather than on
 * permission, and row 6's is carried in that row's own record below.
 *
 * NO `Read-only` AND NO `Unavailable` CELL, so the token overload at L42114
 * against L42120 does not arise here.
 *
 * ── THE DENSEST CROSS-SURFACE BLOCK IN THE SLICE ───────────────────────
 *
 * ROWS 5, 6, 7 AND 10 ARE `another-surface`, AND EIGHT OF THEIR CELLS CARRY A
 * PERMISSIVE TOKEN — the Supervisor's and the Quality Manager's, on each of
 * the four. Every one of the eight names the Delivery Operations Hub, three of
 * them elliptically: L41954, L41955 and L41958 all read "— same" in the
 * Quality Manager column and inherit the surface from the neighbouring cell
 * without naming it. Wave 0 enumerates exactly those three among its eleven
 * elliptical cells, which is why `surface`, `existence` and `metElsewhere` are
 * declared PER ROW: an elliptical cell inherits the row's classification
 * because the classification was never a property of the cell's wording.
 *
 * ROWS 5 AND 6 ARE TWO OF THE SIX INVARIANT-EXCLUDED ACTS. `EXCL-FL-06`
 * (L39489) reads "Worker-initiated Run cancellation or terminal completion |
 * Governance action, segregation of duties | Delivery Operations Hub |
 * Invariant", so a control here is a broken guarantee rather than a misplaced
 * button. Wave 0 refuses a row classified anything but `another-surface` for
 * either act, by matching the Action text, and `MOD-FL-A2` and `MOD-FL-A3`
 * meet the same two acts independently — one catching it does not protect the
 * other two.
 *
 * ── THE TWO ROWS WHOSE CAPABILITY EXISTS NOWHERE, AND THE ONE THAT DOES ─
 *
 * ROW 2, `Pause the Run for everybody`, is `not-in-scope` and ROW 9,
 * `Re-attribute pre-substitution steps`, is `present`. Both are prohibited in
 * all five columns and the distinction is `fl-a6`'s rule applied rather than a
 * new one: the question is whether the CAPABILITY exists, not whether the ACT
 * is permitted.
 *
 *  - Row 2's capability does not exist for anyone. `FUNC-B11-01-1-2` (L42016)
 *    says "Ensure pause is not a Run state" and gives its fallback as "Not
 *    applicable — a state that does not exist cannot fail." A state that does
 *    not exist is `not-in-scope` in the source's own words.
 *  - Row 9's capability is an act on a thing that does exist. The steps and
 *    their attribution are on the device; re-attributing them is what is
 *    prohibited. Classifying it `not-in-scope` would say that attribution is a
 *    thing that exists nowhere for anyone, which is the opposite of what
 *    L42003 and L42005 say — the attribution exists and is immutable.
 *
 * ── THE FOUR ROWS THIS SCREEN ACTUALLY OWNS ────────────────────────────
 *
 * ROWS 1, 3, 4 AND 8: pause the worker's own session, step away, hand back,
 * and receive the structured handover state as a substitute. FOUR `Allowed`
 * cells on this screen's side of the line, all four the Worker's, and no
 * `Allowed with conditions` cell on this side at all — all four of those sit
 * on `another-surface` rows. Rows 3 and 4 each "raise a flag to the
 * supervisor" — that flag is a notification, not a control on this surface.
 */

export type FlB11Column = Extract<
  RoleId,
  'WORKER' | 'SUPERVISOR' | 'QUALITY_MANAGER' | 'TENANT_ADMIN' | 'READONLY_AUDITOR'
>

export const FL_B11_COLUMNS = [
  'WORKER',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'TENANT_ADMIN',
  'READONLY_AUDITOR',
] as const satisfies readonly FlB11Column[]

type MissingFromColumns = Exclude<FlB11Column, (typeof FL_B11_COLUMNS)[number]>
const _columnsExhaustive: MissingFromColumns extends never ? true : never = true
void _columnsExhaustive

/** The header row's own words, L41947. Never re-worded for a table heading. */
export const FL_B11_COLUMN_HEADINGS = {
  WORKER: 'Worker',
  SUPERVISOR: 'Supervisor',
  QUALITY_MANAGER: 'Quality Manager',
  TENANT_ADMIN: 'Tenant Admin',
  READONLY_AUDITOR: 'Read-only Auditor',
} as const satisfies Readonly<Record<FlB11Column, string>>

export type FlB11RowId =
  | 'pause-own-session'
  | 'pause-run-for-everybody'
  | 'step-away'
  | 'hand-back'
  | 'cancel-a-run'
  | 'terminally-complete-a-run'
  | 'initiate-substitution'
  | 'receive-handover-state'
  | 're-attribute-steps'
  | 'extend-run-end-time'

/**
 * One row, plus the three things wave 0's row type deliberately does not
 * carry.
 *
 * `why` / `whyRef` — the source sentence that governs the row. REQUIRED on all
 * ten rather than optional on the prohibitions, and the arithmetic is why:
 * TWENTY-EIGHT of the fifty cells here carry a bare token and no words of
 * their own, which `B11_BARE_TOKEN_CELLS` below derives rather than asserts.
 * Rule 4 of this surface says a prohibition renders as no control PLUS A
 * STATED LINE where the control would sit, and a line reading only "Explicitly
 * prohibited" is the empty region wearing a token. A row added without a
 * governing sentence does not compile.
 *
 * `metElsewhereRef` — the line the row's cross-surface statement is read from.
 * Every one of the four names a second, independent reading beside the row's
 * own cell, because a `metElsewhere` note resting on one cell is this build
 * asserting a surface rather than citing one — and three of the four rows have
 * an elliptical cell that names no surface at all.
 *
 * `openDecisionBeside` — an open decision the CELL TEXT ITSELF states as
 * settled fact. It is not `FrontlineMatrixCell['openDecision']`, which pairs
 * with a `Client Decision Required` outcome and reaches the fold as part of a
 * refusal; this is the opposite shape, a PERMISSIVE cell quietly adopting one
 * reading of an open question. Row 6 is the only row that carries one, and
 * there is no field in which the reading could be recorded as the answer.
 */
export interface FlB11MatrixRow extends FrontlineMatrixRow<FlB11RowId, FlB11Column> {
  readonly why: string
  readonly whyRef: string
  readonly metElsewhereRef: string | null
  readonly openDecisionBeside: string | null
}

function cell(outcome: FrontlineMatrixCell['outcome'], note: string): FrontlineMatrixCell {
  return { outcome, note, openDecision: null }
}

/** The bare tokens, as the cells' own and only words. Thirty-two cells carry one. */
const PROHIBITED = cell('explicitlyProhibited', 'Explicitly prohibited')
const NA_BARE = cell('notApplicable', 'Not applicable')
const NA_NO_SESSION = cell('notApplicable', 'Not applicable — no execution session')

/** The Delivery Operations Hub, spelled once. */
const HUB = 'SURF-DOH' as const

export const FL_B11_MATRIX = [
  {
    id: 'pause-own-session',
    control: 'Pause their own session by lock, log-out, or timeout',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    metElsewhereRef: null,
    openDecisionBeside: null,
    routedTo: {},
    cells: {
      WORKER: cell('allowed', 'Allowed'),
      SUPERVISOR: NA_NO_SESSION,
      QUALITY_MANAGER: NA_NO_SESSION,
      TENANT_ADMIN: NA_BARE,
      READONLY_AUDITOR: PROHIBITED,
    },
    why:
      'Treat pause as a per-worker, session-level idle — a device lock, a log-out, or a timeout — ' +
      'that preserves on-device progress.',
    whyRef: 'FUNC-B11-01-1-1 · L42015',
    sourceRef: 'L41949',
  },
  {
    id: 'pause-run-for-everybody',
    control: 'Pause the Run for everybody',
    surface: 'screen',
    existence: 'not-in-scope',
    metElsewhere: null,
    metElsewhereRef: null,
    openDecisionBeside: null,
    routedTo: {},
    cells: {
      WORKER: cell('explicitlyProhibited', 'Explicitly prohibited — pause is not a Run state'),
      SUPERVISOR: cell(
        'explicitlyProhibited',
        'Explicitly prohibited — pausing or stopping a run is deliberately impossible from the ' +
          'Client Command Center',
      ),
      QUALITY_MANAGER: cell('explicitlyProhibited', 'Explicitly prohibited — same'),
      TENANT_ADMIN: PROHIBITED,
      READONLY_AUDITOR: PROHIBITED,
    },
    why:
      'Ensure pause is not a Run state, so pausing one worker’s session does not pause the Run while ' +
      'other workers may still be active on it. Roles prohibited: nobody may pause a Run from any ' +
      'surface; pausing or stopping a run is deliberately impossible from the Client Command Center.',
    whyRef: 'FUNC-B11-01-1-2 · L42016',
    sourceRef: 'L41950',
  },
  {
    id: 'step-away',
    control: 'Step away from their part of a Run',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    metElsewhereRef: null,
    openDecisionBeside: null,
    routedTo: {},
    cells: {
      WORKER: cell('allowed', 'Allowed — raises a flag to the supervisor'),
      SUPERVISOR: NA_NO_SESSION,
      QUALITY_MANAGER: NA_NO_SESSION,
      TENANT_ADMIN: NA_BARE,
      READONLY_AUDITOR: PROHIBITED,
    },
    why:
      'Let a worker step away from their part of a Run, raising a flag to the supervisor. Roles ' +
      'prohibited: nobody may suppress the flag. Online: the flag delivers. Offline: it queues, and ' +
      'no surface claims the supervisor knows.',
    whyRef: 'FUNC-B11-02-1-1 · L42019',
    sourceRef: 'L41951',
  },
  {
    id: 'hand-back',
    control: 'Hand back their part of a Run',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    metElsewhereRef: null,
    openDecisionBeside: null,
    routedTo: {},
    cells: {
      WORKER: cell('allowed', 'Allowed — raises a flag to the supervisor'),
      SUPERVISOR: NA_NO_SESSION,
      QUALITY_MANAGER: NA_NO_SESSION,
      TENANT_ADMIN: NA_BARE,
      READONLY_AUDITOR: PROHIBITED,
    },
    why:
      'Let a worker hand back their part of a Run, raising a flag to the supervisor. Difference from ' +
      'step-away: hand-back signals that the worker does not intend to return to this part, which is ' +
      'what tells the supervisor a substitution may be needed.',
    whyRef: 'FUNC-B11-02-1-2 · L42020',
    sourceRef: 'L41952',
  },
  {
    id: 'cancel-a-run',
    control: 'Cancel a Run',
    surface: 'another-surface',
    existence: 'present',
    metElsewhere: {
      where: 'another-surface',
      surface: HUB,
      note:
        'A Supervisor cancels in the Delivery Operations Hub, own area, with a categorised reason, ' +
        'and a Quality Manager in any area on the same basis. The module’s own card says the same ' +
        'thing from the other end: cancellation and terminal completion are Supervisor and Quality ' +
        'Manager governance actions owned in the Delivery Operations Hub. EXCL-FL-06 classifies ' +
        'worker-initiated Run cancellation as an Invariant exclusion on the ground of segregation of ' +
        'duties, so a control drawn here would be a broken guarantee rather than a button in the ' +
        'wrong place.',
    },
    metElsewhereRef: 'L41953 (the row); L41941 (the card); EXCL-FL-06 L39489',
    openDecisionBeside: null,
    routedTo: {},
    cells: {
      WORKER: PROHIBITED,
      SUPERVISOR: cell(
        'allowed',
        'Allowed — in the Delivery Operations Hub, own area, categorised reason',
      ),
      QUALITY_MANAGER: cell(
        'allowed',
        'Allowed — in the Delivery Operations Hub, any area, categorised reason',
      ),
      TENANT_ADMIN: PROHIBITED,
      READONLY_AUDITOR: PROHIBITED,
    },
    why:
      'Prevent a worker from cancelling or terminally completing a Run. Purpose: those are supervisor ' +
      'and Quality Manager governance actions owned in the Delivery Operations Hub. Roles allowed: ' +
      'nobody on this surface.',
    whyRef: 'FUNC-B11-02-1-3 · L42021',
    sourceRef: 'L41953',
  },
  {
    id: 'terminally-complete-a-run',
    control: 'Terminally complete a Run',
    surface: 'another-surface',
    existence: 'present',
    metElsewhere: {
      where: 'another-surface',
      surface: HUB,
      note:
        'Both the Supervisor cell and the Quality Manager cell read Allowed with conditions, and the ' +
        'Quality Manager’s reads only "— same", inheriting the surface from its neighbour. The ' +
        'condition the Supervisor cell states is "a manually closed stuck run is complete at close ' +
        'time and finishes on the same clock, in the Delivery Operations Hub". EXCL-FL-06 classifies ' +
        'worker-initiated terminal completion as an Invariant exclusion, so a control drawn here ' +
        'would be a broken guarantee rather than a button in the wrong place.',
    },
    metElsewhereRef: 'L41954 (the row); L41941 (the card); EXCL-FL-06 L39489',
    openDecisionBeside: 'DEC-STUCK-001',
    routedTo: {},
    cells: {
      WORKER: PROHIBITED,
      SUPERVISOR: cell(
        'allowedWithConditions',
        'Allowed with conditions — a manually closed stuck run is complete at close time and ' +
          'finishes on the same clock, in the Delivery Operations Hub',
      ),
      QUALITY_MANAGER: cell('allowedWithConditions', 'Allowed with conditions — same'),
      TENANT_ADMIN: PROHIBITED,
      READONLY_AUDITOR: PROHIBITED,
    },
    why:
      'Prevent a worker from cancelling or terminally completing a Run. Purpose: those are supervisor ' +
      'and Quality Manager governance actions owned in the Delivery Operations Hub. Online and ' +
      'offline: identical absence.',
    whyRef: 'FUNC-B11-02-1-3 · L42021',
    sourceRef: 'L41954',
  },
  {
    id: 'initiate-substitution',
    control: 'Initiate a mid-Run substitution',
    surface: 'another-surface',
    existence: 'present',
    metElsewhere: {
      where: 'another-surface',
      surface: HUB,
      note:
        'Initiated in the Delivery Operations Hub with a reason, delivered via the command channel. ' +
        'The card’s Owning-surface line states the same boundary independently, and the command ' +
        'class that carries it is already settled for the whole surface: CMD-FL-REASSIGN, origin ' +
        '"Delivery Operations Hub or Client Command Center", authority "Supervisor and above", ' +
        'effect on device "Alters the worker’s assigned work; presents structured handover to a ' +
        'substitute". The device is the recipient and never the originator.',
    },
    metElsewhereRef: 'L41955 (the row); L41941 (the card); CMD-FL-REASSIGN L39663',
    openDecisionBeside: null,
    routedTo: {},
    cells: {
      WORKER: PROHIBITED,
      SUPERVISOR: cell(
        'allowed',
        'Allowed — initiated in the Delivery Operations Hub with a reason, delivered via the command ' +
          'channel',
      ),
      QUALITY_MANAGER: cell('allowed', 'Allowed — same'),
      TENANT_ADMIN: PROHIBITED,
      READONLY_AUDITOR: PROHIBITED,
    },
    why:
      'Apply a supervisor-initiated substitution, initiated in the Delivery Operations Hub with a ' +
      'reason and delivered via the command channel. Roles allowed: Supervisor and above initiate; ' +
      'the device applies. Roles prohibited: no worker initiates it.',
    whyRef: 'FUNC-B11-03-1-1 · L42024',
    sourceRef: 'L41955',
  },
  {
    id: 'receive-handover-state',
    control: 'Receive the structured handover state as a substitute',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    metElsewhereRef: null,
    openDecisionBeside: null,
    routedTo: {},
    cells: {
      WORKER: cell('allowed', 'Allowed — the substitute worker'),
      SUPERVISOR: NA_NO_SESSION,
      QUALITY_MANAGER: NA_NO_SESSION,
      TENANT_ADMIN: NA_BARE,
      READONLY_AUDITOR: PROHIBITED,
    },
    why:
      'Present the substitute with the structured handover state: the last completed step, the open ' +
      'flags, and the current state, and let them work forward from there. Roles prohibited: the ' +
      'substitute cannot see the prior worker’s session or credentials.',
    whyRef: 'FUNC-B11-03-1-2 · L42025',
    sourceRef: 'L41956',
  },
  {
    id: 're-attribute-steps',
    control: 'Re-attribute pre-substitution steps',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    metElsewhereRef: null,
    openDecisionBeside: null,
    routedTo: {},
    cells: {
      WORKER: PROHIBITED,
      SUPERVISOR: PROHIBITED,
      QUALITY_MANAGER: PROHIBITED,
      TENANT_ADMIN: PROHIBITED,
      READONLY_AUDITOR: PROHIBITED,
    },
    why:
      'Keep pre-substitution steps attributed to the original worker. Purpose: this attribution is ' +
      'what keeps the platform’s Worker-Shift metering honest — where a substitution occurs, each ' +
      'worker who actually worked counts one. Roles prohibited: nobody may re-attribute.',
    whyRef: 'FUNC-B11-03-1-3 · L42026',
    sourceRef: 'L41957',
  },
  {
    id: 'extend-run-end-time',
    control: 'Extend a run end time',
    surface: 'another-surface',
    existence: 'present',
    metElsewhere: {
      where: 'another-surface',
      surface: HUB,
      note:
        'Supervisor-authorised, reason-required, capped at shift end plus a tenant-set maximum, ' +
        'audited, in the Delivery Operations Hub — four conditions and a surface in one cell, with ' +
        'the Quality Manager’s reading only "— same". The module’s own terminal-safe-state paragraph ' +
        'names the same four conditions independently, as one of the two ways a Supervisor resolves ' +
        'an unprogressed Run from the Delivery Operations Hub.',
    },
    metElsewhereRef: 'L41958 (the row); L42062 (the terminal safe state)',
    openDecisionBeside: null,
    routedTo: {},
    cells: {
      WORKER: PROHIBITED,
      SUPERVISOR: cell(
        'allowedWithConditions',
        'Allowed with conditions — supervisor-authorised, reason-required, capped at shift end plus ' +
          'a tenant-set maximum, audited, in the Delivery Operations Hub',
      ),
      QUALITY_MANAGER: cell('allowedWithConditions', 'Allowed with conditions — same'),
      TENANT_ADMIN: PROHIBITED,
      READONLY_AUDITOR: PROHIBITED,
    },
    why:
      'The terminal safe state is an unprogressed Run with complete prior captures, which the ' +
      'Supervisor resolves from the Delivery Operations Hub by cancellation with a categorised ' +
      'reason, partial data preserved and excluded from the summary, or by an end-time extension ' +
      'that is supervisor-authorised, reason-required, capped at shift end plus a tenant-set ' +
      'maximum, and audited.',
    whyRef: 'L42062',
    sourceRef: 'L41958',
  },
] as const satisfies readonly FlB11MatrixRow[]

type MissingFromMatrix = Exclude<FlB11RowId, (typeof FL_B11_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

export function b11Row(id: FlB11RowId): FlB11MatrixRow {
  const found = FL_B11_MATRIX.find((r) => r.id === id)
  if (found === undefined) throw new Error(`no MOD-FL-B11 matrix row: ${id}`)
  return found
}

/**
 * The shape the brief asserts, DERIVED here rather than quoted, so the
 * arithmetic is a check on the transcription instead of a restatement of it.
 * Ten rows over the ten data lines L41949-L41958, five columns, fifty cells.
 */
export const FL_B11_SHAPE = {
  module: 'MOD-FL-B11',
  rows: FL_B11_MATRIX.length,
  columns: FL_B11_COLUMNS.length,
  cells: FL_B11_MATRIX.length * FL_B11_COLUMNS.length,
  headerLine: 41947,
  separatorLine: 41948,
  firstDataLine: 41949,
  lastDataLine: 41958,
} as const

/**
 * THE EIGHT PERMISSIVE CELLS ON THE FAR SIDE OF THE LINE — the block this
 * matrix is densest in. DERIVED from the rows rather than listed a second
 * time, so a row that changed its classification cannot leave a stale entry
 * here claiming it did not.
 *
 * Two of the four rows are `EXCL-FL-06` invariant exclusions and two are not,
 * and the difference is not cosmetic: shipping a control for the first two is
 * a BROKEN GUARANTEE, and for the second two a misplaced button. Both are
 * refused, and the record says which is which rather than flattening them.
 */
export const B11_ELSEWHERE_PERMISSIVE_CELLS: readonly {
  readonly rowId: FlB11RowId
  readonly column: FlB11Column
  readonly note: string
  readonly sourceRef: string
}[] = FL_B11_MATRIX.flatMap((row) =>
  row.surface === 'another-surface'
    ? FL_B11_COLUMNS.filter(
        (c) =>
          row.cells[c].outcome === 'allowed' || row.cells[c].outcome === 'allowedWithConditions',
      ).map((column) => ({
        rowId: row.id,
        column,
        note: row.cells[column].note,
        sourceRef: row.sourceRef,
      }))
    : [],
)

/**
 * The two rows `EXCL-FL-06` covers, by the Action text wave 0 matches on. Held
 * as a list of ids rather than as a boolean on the row, because wave 0's
 * `controlsOnActsHeldElsewhere` already keys on the Action text and a second
 * flag here would be a second spelling of the same ruling.
 */
export const B11_INVARIANT_EXCLUDED_ROWS = [
  'cancel-a-run',
  'terminally-complete-a-run',
] as const satisfies readonly FlB11RowId[]

/**
 * Membership, typed for the whole row-id union rather than for the two
 * members of the constant.
 *
 * This exists because of a real trade-off rather than for tidiness. The
 * constant is `as const satisfies` — the idiom every matrix in this build
 * uses, and the one `tests/coverage/slice-2c-gates.test.ts` gate 2 enforces,
 * because a leading `readonly FlB11RowId[]` annotation wins over `as const`
 * and throws the literal members away. Keeping them literal is what lets a
 * gate assert WHICH two acts are excluded rather than merely how many.
 *
 * The cost is that `.includes(someRowId)` no longer type-checks: the array's
 * element type is now the two literals, so asking it about a third is a type
 * error rather than the `false` the caller wants. Widening the constant back
 * to silence that would put the annotation the gate rejects straight back, so
 * the widening happens here, once, where the question is asked.
 */
export const isB11InvariantExcluded = (id: FlB11RowId): boolean =>
  (B11_INVARIANT_EXCLUDED_ROWS as readonly FlB11RowId[]).includes(id)

/**
 * The three elliptical cells of this matrix — the Quality Manager cells of
 * rows 6, 7 and 10, each of which reads only "— same" after its token and
 * names no surface. Wave 0 enumerates all three among the eleven it counts
 * across the twelve matrices, so this is a reading of the same fact from the
 * module's end rather than a new claim. DERIVED, so a cell that stopped being
 * elliptical cannot leave a stale entry behind.
 */
export const B11_ELLIPTICAL_CELLS: readonly {
  readonly rowId: FlB11RowId
  readonly column: FlB11Column
  readonly note: string
  readonly sourceRef: string
}[] = B11_ELSEWHERE_PERMISSIVE_CELLS.filter((c) => c.note.trim().endsWith('— same'))

/**
 * THE TOKEN TALLY, COUNTED OFF THE CELLS. A third reading of the same table:
 * `FL_B11_SHAPE.rows` is counted off the row list, `cells` off rows × columns,
 * and this off the outcomes. A row silently dropped moves one of the three and
 * not the others.
 */
export const B11_TOKEN_TALLY: Readonly<Record<string, number>> = FL_B11_MATRIX.reduce<
  Record<string, number>
>((acc, row) => {
  for (const column of FL_B11_COLUMNS) {
    const o = row.cells[column].outcome
    acc[o] = (acc[o] ?? 0) + 1
  }
  return acc
}, {})

/**
 * The cells whose note is the status token and nothing else — no clause, no
 * surface, no reason. This is the count that makes `why` required on every
 * row: more than half of this matrix says nothing but its token, and a stated
 * line built from those cells alone would be the empty region wearing one.
 * DERIVED against the seven-token vocabulary rather than counted by hand.
 */
export const B11_BARE_TOKEN_CELLS: readonly string[] = FL_B11_MATRIX.flatMap((row) =>
  FL_B11_COLUMNS.filter((c) => !row.cells[c].note.includes('—')).map((c) => `${row.id}.${c}`),
)
