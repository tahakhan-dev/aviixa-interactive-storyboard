import type { RoleId } from '@/domain/roles'
import type { FrontlineMatrixCell, FrontlineMatrixRow } from '@/frontline/matrix'

/**
 * `MOD-FL-B10`'s permission matrix, transcribed row by row and cell by cell.
 * Header L41790, separator L41791, data L41792-L41798. SEVEN rows, FIVE
 * columns, THIRTY-FIVE cells, every one of them filled.
 *
 * `FrontlineMatrixRow` and `FrontlineMatrixCell` are wave 0's types and are
 * parameterised here, never redefined, and no second evaluator is written: the
 * verdict comes from `frontlineAffordance` in `@/frontline/matrix`.
 *
 * ── WHAT THIS MATRIX HAS, AND WHAT IT DOES NOT ─────────────────────────
 *
 * FOUR OF THE SEVEN TOKENS APPEAR, and they sum to the cell count rather than
 * being asserted beside it: `Explicitly prohibited` 22, `Not applicable` 6,
 * `Unavailable` 5, `Allowed` 2 — 22 + 6 + 5 + 2 = 35 = 7 × 5.
 *
 * NO `Client Decision Required` CELL. All eleven of them across the twelve
 * matrices are enumerated in wave 0's `TENANT_ADMIN_OPEN_CELLS` and none is
 * `MOD-FL-B10`, so `openDecision` is `null` on all thirty-five and the
 * `AC-FL-009-5` device-session question is not this module's to carry. This
 * module's four Tenant Admin refusals carry no deferred question: three read
 * the bare token and the fourth (L41798) gives the V1 channel closure as its
 * own reason.
 *
 * NO `Allowed with conditions` AND NO `Read-only`. Two controls, both the
 * Worker's, both unconditional in the source's own token.
 *
 * ── ROW 6, AND THE TOKEN THAT MEANS TWO OPPOSITE THINGS ────────────────
 *
 * `Receive an operating-system push alert` (L41797) carries `Unavailable` in
 * all five columns, and HERE THE TOKEN MEANS "EXISTS NOWHERE FOR ANYONE":
 * "there is no operating-system push at launch". The card states the two
 * grounds in full at L41850 and closes with "Operating-system push is a later
 * addition, on the same two grounds" — a later product, not a condition that
 * lifts on this build.
 *
 * IN `MOD-FL-B12` THE SAME TOKEN MEANS THE OPPOSITE. Its row at L42114 asks
 * about viewing training material offline, and its ground is stated there as
 * "the library is deliberately excluded from the offline Run bundle": it
 * exists, it is absent under a condition, and it returns at the next
 * connection. Six rows further down that same matrix, L42120's row asks about
 * a practice or rehearsal mode and its ground reads "practice mode is not in
 * this scope" — the permanent sense again. Two opposite senses of one token,
 * six rows apart in one table, and this row is the third instance.
 *
 * THE TWO QUOTATIONS ABOVE ARE THE CELLS' GROUNDS AND NOT WHOLE CELLS, AND
 * THEY ARE SPLIT FROM THEIR ACTION COLUMNS DELIBERATELY. A cell is
 * `| Action | \`Token\` — ground |`, so the Action and the ground are not a
 * contiguous run of the source line: quoting them as one phrase asserts a
 * sentence the source does not contain, which is what
 * `tests/coverage/locator-fidelity.test.ts` caught here.
 *
 * A TOKEN CANNOT TELL THEM APART AND `existence` CAN, which is why wave 0
 * declared the field. This row is `not-in-scope`, so `frontlineAffordance`
 * reaches `statedLine` BEFORE it reaches the token and the sentence it builds
 * ends "It exists nowhere for anyone in this scope, so there is nothing to
 * come back to." A reader is told which sense without being asked to infer it.
 *
 * ── ROW 7 IS `present`, AND THAT IS A RULING RATHER THAN A DEFAULT ─────
 *
 * `Configure quiet hours or additional channels` (L41798) names five things
 * that are outside V1 — Short Message Service, operating-system push,
 * webhooks, external recipients, and quiet hours — so the temptation is to
 * classify it `not-in-scope` alongside row 6. The source did not. Six rows
 * apart in ITS OWN matrix it used `Unavailable` for the capability that does
 * not exist and `Explicitly prohibited` for this one, and the distinction it
 * drew is between a capability and an ACT: the act of configuring channels is
 * prohibited for every role, including the Tenant Admin who configures
 * everything else. `FUNC-B10-02-1-3` (L41865) states it as an act — "Roles
 * allowed: nobody may add a channel. Roles prohibited: every role."
 * Classifying it `not-in-scope` would overwrite the source's own distinction
 * with this build's tidier one.
 *
 * ── ROW 1's SUPERVISOR CELL IS A POINTER, NOT A REFUSAL ────────────────
 *
 * "Not applicable — no execution session; equivalent feeds are in the Client
 * Command Center". Rule 5 of this surface: `Not applicable` is not a refusal,
 * it says the act does not arise for that role here. The row is still
 * `screen`, because the ROW's act — the worker's own inbox — is met on this
 * screen; the classification is a property of the row and not of a cell, and
 * `MOD-FL-A6`'s row 1 (L41094) is the same shape with the same pointer.
 *
 * ── WHAT THIS MODULE DRAWS ─────────────────────────────────────────────
 *
 * TWO CONTROLS, BOTH THE WORKER'S: view the inbox for the logged-in identity,
 * and leave a general notification unread. The second is a control in the
 * source's own token and is an ABSENCE of an obligation in behaviour, which is
 * why the screen renders it as the inbox never gating on having been opened
 * rather than as a button.
 */

export type FlB10Column = Extract<
  RoleId,
  'WORKER' | 'SUPERVISOR' | 'QUALITY_MANAGER' | 'TENANT_ADMIN' | 'READONLY_AUDITOR'
>

export const FL_B10_COLUMNS = [
  'WORKER',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'TENANT_ADMIN',
  'READONLY_AUDITOR',
] as const satisfies readonly FlB10Column[]

type MissingFromColumns = Exclude<FlB10Column, (typeof FL_B10_COLUMNS)[number]>
const _columnsExhaustive: MissingFromColumns extends never ? true : never = true
void _columnsExhaustive

/** The header row's own words, L41790. Never re-worded for a table heading. */
export const FL_B10_COLUMN_HEADINGS = {
  WORKER: 'Worker',
  SUPERVISOR: 'Supervisor',
  QUALITY_MANAGER: 'Quality Manager',
  TENANT_ADMIN: 'Tenant Admin',
  READONLY_AUDITOR: 'Read-only Auditor',
} as const satisfies Readonly<Record<FlB10Column, string>>

export type FlB10RowId =
  | 'view-own-inbox'
  | 'view-another-identity-inbox'
  | 'mute-in-app-notification'
  | 'leave-general-notification-unread'
  | 'dismiss-change-notice-unseen'
  | 'receive-os-push-alert'
  | 'configure-quiet-hours-or-channels'

/**
 * One row, plus the one thing wave 0's row type deliberately does not carry.
 *
 * `why` / `whyRef` — the source sentence that governs the row, with an
 * identifier-anchored locator. Required on all seven rather than optional on
 * the prohibitions, because TWENTY-NINE of this matrix's thirty-five cells are
 * a bare token with no words of their own and rule 4 of this surface says a
 * prohibition renders as no control PLUS A STATED LINE. A line reading only
 * "Explicitly prohibited" is the empty region wearing a token.
 *
 * There is no `metElsewhereRef` here and no `metElsewhere` on any row: not one
 * of the seven acts is held on another surface or another destination. That is
 * the finding, not an omission — this module owns its whole matrix, which is
 * rare on this surface and is why the field would otherwise be `null` seven
 * times over and read as an oversight.
 */
export interface FlB10MatrixRow extends FrontlineMatrixRow<FlB10RowId, FlB10Column> {
  readonly why: string
  readonly whyRef: string
}

function cell(outcome: FrontlineMatrixCell['outcome'], note: string): FrontlineMatrixCell {
  return { outcome, note, openDecision: null }
}

/** The bare token, as the cell's own and only words. */
const PROHIBITED = cell('explicitlyProhibited', 'Explicitly prohibited')
const NA_BARE = cell('notApplicable', 'Not applicable')
const NA_NO_SESSION = cell('notApplicable', 'Not applicable — no execution session')
const UNAVAILABLE_BARE = cell('unavailable', 'Unavailable')

export const FL_B10_MATRIX = [
  {
    id: 'view-own-inbox',
    control: 'View the inbox for the logged-in identity',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    cells: {
      WORKER: cell('allowed', 'Allowed'),
      SUPERVISOR: cell(
        'notApplicable',
        'Not applicable — no execution session; equivalent feeds are in the Client Command Center',
      ),
      QUALITY_MANAGER: cell('notApplicable', 'Not applicable — same basis'),
      TENANT_ADMIN: NA_BARE,
      READONLY_AUDITOR: PROHIBITED,
    },
    why:
      'Back-fill the inbox on login so a worker logging in on any device sees the notifications ' +
      'addressed to their identity; the inbox follows the login, not the hardware.',
    whyRef: 'FUNC-B10-01-1-1 · L41856',
    sourceRef: 'L41792',
  },
  {
    id: 'view-another-identity-inbox',
    control: "View another identity's inbox",
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    cells: {
      WORKER: PROHIBITED,
      SUPERVISOR: PROHIBITED,
      QUALITY_MANAGER: PROHIBITED,
      TENANT_ADMIN: PROHIBITED,
      READONLY_AUDITOR: PROHIBITED,
    },
    why: 'Roles allowed: Worker, own identity only. Roles prohibited: all others.',
    whyRef: 'FUNC-B10-01-1-1 · L41856',
    sourceRef: 'L41793',
  },
  {
    id: 'mute-in-app-notification',
    control: 'Mute an in-application notification',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    cells: {
      WORKER: cell(
        'explicitlyProhibited',
        'Explicitly prohibited — in-app notifications cannot be muted, platform-wide',
      ),
      SUPERVISOR: PROHIBITED,
      QUALITY_MANAGER: PROHIBITED,
      TENANT_ADMIN: PROHIBITED,
      READONLY_AUDITOR: PROHIBITED,
    },
    why: 'Roles allowed: nobody may mute. Roles prohibited: every role, including Tenant Admin.',
    whyRef: 'FUNC-B10-01-2-2 · L41860',
    sourceRef: 'L41794',
  },
  {
    id: 'leave-general-notification-unread',
    control: 'Leave a general notification unread',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    cells: {
      WORKER: cell(
        'allowed',
        'Allowed — general notifications carry no read obligation',
      ),
      SUPERVISOR: NA_NO_SESSION,
      QUALITY_MANAGER: NA_NO_SESSION,
      TENANT_ADMIN: NA_BARE,
      READONLY_AUDITOR: PROHIBITED,
    },
    why:
      'Let general notifications carry no read obligation, so a worker may leave them unread and ' +
      'nothing gates on having opened the inbox.',
    whyRef: 'FUNC-B10-01-2-1 · L41859',
    sourceRef: 'L41795',
  },
  {
    id: 'dismiss-change-notice-unseen',
    control: 'Dismiss a notified-class work-instruction change notice without seeing it',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    cells: {
      WORKER: cell(
        'explicitlyProhibited',
        'Explicitly prohibited — the notice is part of starting the work, not an inbox item that ' +
          'can be ignored',
      ),
      SUPERVISOR: PROHIBITED,
      QUALITY_MANAGER: PROHIBITED,
      TENANT_ADMIN: PROHIBITED,
      READONLY_AUDITOR: PROHIBITED,
    },
    why: 'Roles allowed: Worker sees it. Roles prohibited: nobody may suppress it.',
    whyRef: 'FUNC-B10-03-2-1 · L41871',
    sourceRef: 'L41796',
  },
  {
    id: 'receive-os-push-alert',
    control: 'Receive an operating-system push alert',
    surface: 'screen',
    // THE PERMANENT SENSE. See the file comment: L42114 is the other sense and
    // only this field separates them.
    existence: 'not-in-scope',
    metElsewhere: null,
    routedTo: {},
    cells: {
      WORKER: cell('unavailable', 'Unavailable — there is no operating-system push at launch'),
      SUPERVISOR: UNAVAILABLE_BARE,
      QUALITY_MANAGER: UNAVAILABLE_BARE,
      TENANT_ADMIN: UNAVAILABLE_BARE,
      READONLY_AUDITOR: UNAVAILABLE_BARE,
    },
    why: 'Roles prohibited: no build may enable push in this scope.',
    whyRef: 'FUNC-B10-02-1-1 · L41863',
    sourceRef: 'L41797',
  },
  {
    id: 'configure-quiet-hours-or-channels',
    control: 'Configure quiet hours or additional channels',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    cells: {
      WORKER: PROHIBITED,
      SUPERVISOR: PROHIBITED,
      QUALITY_MANAGER: PROHIBITED,
      TENANT_ADMIN: cell(
        'explicitlyProhibited',
        'Explicitly prohibited — Short Message Service, operating-system push, webhooks, external ' +
          'recipients, and quiet hours are all outside V1',
      ),
      READONLY_AUDITOR: PROHIBITED,
    },
    why:
      'Restrict channels to in-application and email, platform-wide, at every tier, with Short ' +
      'Message Service, operating-system push, webhooks, external recipients, and quiet hours all ' +
      'outside V1.',
    whyRef: 'FUNC-B10-02-1-3 · L41865',
    sourceRef: 'L41798',
  },
] as const satisfies readonly FlB10MatrixRow[]

type MissingFromMatrix = Exclude<FlB10RowId, (typeof FL_B10_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

export function b10Row(id: FlB10RowId): FlB10MatrixRow {
  const found = FL_B10_MATRIX.find((r) => r.id === id)
  if (found === undefined) throw new Error(`MOD-FL-B10 has no matrix row "${id}"`)
  return found
}

/**
 * The shape the brief asserts, DERIVED here rather than quoted, so the
 * arithmetic is a check on the transcription instead of a restatement of it.
 * Seven rows over the seven data lines L41792-L41798, five columns,
 * thirty-five cells.
 */
export const FL_B10_SHAPE = {
  module: 'MOD-FL-B10',
  rows: FL_B10_MATRIX.length,
  columns: FL_B10_COLUMNS.length,
  cells: FL_B10_MATRIX.length * FL_B10_COLUMNS.length,
  headerLine: 41790,
  separatorLine: 41791,
  firstDataLine: 41792,
  lastDataLine: 41798,
} as const

/**
 * THE `Unavailable` OVERLOAD, CARRIED AS DATA SO THE SCREEN SAYS WHICH SENSE
 * IT MEANS. Three cells in two matrices, two senses, one token. This module
 * owns the third and states the other two beside it rather than beneath a
 * comment, because a reader of row 6 cannot see the other two.
 */
export const UNAVAILABLE_TWO_SENSES = [
  {
    sense: 'exists nowhere for anyone',
    row: 'Receive an operating-system push alert',
    cellWords: 'Unavailable — there is no operating-system push at launch',
    routeBack: 'None. Operating-system push is a later addition, on the same two grounds.',
    sourceRef: 'L41797, and the two grounds at L41850',
  },
  {
    sense: 'exists, absent under a stated condition',
    row: 'View training material offline',
    cellWords: 'Unavailable — the library is deliberately excluded from the offline Run bundle',
    routeBack: 'The next connection. The destination table calls it online-only by design.',
    sourceRef: 'L42114, L40036',
  },
  {
    sense: 'exists nowhere for anyone',
    row: 'Use a practice or rehearsal mode',
    cellWords: 'Unavailable — practice mode is not in this scope',
    routeBack: 'None, in this scope.',
    sourceRef: 'L42120',
  },
] as const satisfies readonly {
  readonly sense: string
  readonly row: string
  readonly cellWords: string
  readonly routeBack: string
  readonly sourceRef: string
}[]
