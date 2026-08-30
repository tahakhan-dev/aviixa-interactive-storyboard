import type { RoleId } from '@/domain/roles'
import type {
  FrontlineCapabilityExistence,
  FrontlineMatrixCell,
  FrontlineMatrixRow,
} from '@/frontline/matrix'

/**
 * `MOD-FL-B12`'s permission matrix, transcribed row by row and cell by cell.
 * Header L42111, separator L42112, data L42113-L42120. EIGHT rows, FIVE
 * columns, FORTY cells, every one of them filled.
 *
 * `FrontlineMatrixRow` and `FrontlineMatrixCell` are wave 0's types and are
 * parameterised here, never redefined, and no second evaluator is written: the
 * verdict comes from `frontlineAffordance` in `@/frontline/matrix`.
 *
 * ── THIS IS THE MATRIX WHERE `Unavailable` MEANS TWO OPPOSITE THINGS ────
 *
 * TEN OF THE FIFTEEN `Unavailable` CELLS ON THIS WHOLE SURFACE ARE HERE, and
 * they are five and five across two senses that have to render differently.
 * The other five are `MOD-FL-B10`'s single row, L41797, which is the permanent
 * sense as well. Counted off the twelve matrices rather than read off wave 0's
 * tally: no other Frontline matrix carries the token at all, so this module and
 * B10 hold every occurrence of it between them.
 *
 * ROW 2, L42114 — "the library is deliberately excluded from the offline Run
 * bundle". The capability EXISTS. It is absent under a stated condition, and
 * the condition lifts: the card's own Reconnect behaviour field (L42145) says
 * the destination becomes available again. `existence: 'absent-under-condition'`.
 *
 * ROW 8, L42120 — "practice mode is not in this scope". The capability exists
 * NOWHERE FOR ANYONE. It is cut rather than deferred, and the source says so
 * outside this chapter too: L2726 records the answer given to a client who
 * asked for it, and L4807 files it as a scope boundary whose return is a change
 * request. There is no condition to lift. `existence: 'not-in-scope'`.
 *
 * WHAT MAKES THEM RENDER DIFFERENTLY IS NOT A BRANCH IN THIS MODULE. Wave 0's
 * fold reaches `existence` at question three and the TOKEN only at question
 * five, so both rows return `kind: 'stated-line'` carrying a different
 * `existence` and a different closing sentence — one says it returns when the
 * condition lifts, the other says there is nothing to come back to. A module
 * that read the token would render these two rows identically, which is the
 * defect this matrix is the trap for.
 *
 * ── ROW 3 IS THE OTHER SURFACE, AND THE AUTHORING HALF ALREADY SHIPS ────
 *
 * L42115 gives the Quality Manager `Allowed with conditions` — "in the
 * Standards and Operations Studio with an authoring grant, never here". It is
 * one of the eight cells on this surface ending in those words. The row is
 * `another-surface`, so all five of its cells return a cross-surface statement
 * and none of them draws a control, whatever the token reads. The Studio's own
 * authoring screen exists in this build; nothing under `@/studio` is imported
 * here, because importing a component that can upload or version would carry
 * exactly the capability this row places elsewhere across the boundary.
 *
 * ── ROW 1, AND THE QUALIFIER THAT IS DOING WORK ────────────────────────
 *
 * The Supervisor cell reads "Not applicable — no execution session on this
 * surface" and the Tenant Admin cell reads a bare `Not applicable`. They are
 * not the same statement and neither is `Client Decision Required`: none of the
 * eleven cells wave 0 enumerates in `TENANT_ADMIN_OPEN_CELLS` is in this
 * matrix, so `openDecision` is `null` on all forty and the `AC-FL-009-5`
 * device-session question is not this module's to carry. `Not applicable` is
 * not a refusal — the act does not arise for that role here — and it is
 * transcribed with whatever reason the cell gives, including none.
 */

export type FlB12Column = Extract<
  RoleId,
  'WORKER' | 'SUPERVISOR' | 'QUALITY_MANAGER' | 'TENANT_ADMIN' | 'READONLY_AUDITOR'
>

export const FL_B12_COLUMNS = [
  'WORKER',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'TENANT_ADMIN',
  'READONLY_AUDITOR',
] as const satisfies readonly FlB12Column[]

type MissingFromColumns = Exclude<FlB12Column, (typeof FL_B12_COLUMNS)[number]>
const _columnsExhaustive: MissingFromColumns extends never ? true : never = true
void _columnsExhaustive

/** The header row's own words, L42111. Never re-worded for a table heading. */
export const FL_B12_COLUMN_HEADINGS = {
  WORKER: 'Worker',
  SUPERVISOR: 'Supervisor',
  QUALITY_MANAGER: 'Quality Manager',
  TENANT_ADMIN: 'Tenant Admin',
  READONLY_AUDITOR: 'Read-only Auditor',
} as const satisfies Readonly<Record<FlB12Column, string>>

export type FlB12RowId =
  | 'view-connected'
  | 'view-offline'
  | 'upload-or-version'
  | 'download-to-device'
  | 'view-another-tenants-material'
  | 'viewing-creates-a-record'
  | 'required-mid-run'
  | 'practice-mode'

/**
 * One row, plus the two things wave 0's row type deliberately does not carry.
 *
 * `why` / `whyRef` — the source sentence that governs the row, with its own
 * locator. Required on all eight rather than optional on the prohibitions:
 * THIRTY-FOUR of the forty cells here are a bare token with no words of their
 * own, and rule 4 of this surface says a prohibition renders as no control PLUS
 * A STATED LINE. A line reading only "Explicitly prohibited" is the empty
 * region wearing a token.
 *
 * `metElsewhereRef` — the line the row's cross-surface statement is read from.
 * Here it is the row's own line, because row 3's own cell names the surface in
 * its own words; the field is carried anyway so the assertion is a citation
 * rather than a claim.
 */
export interface FlB12MatrixRow extends FrontlineMatrixRow<FlB12RowId, FlB12Column> {
  readonly why: string
  readonly whyRef: string
  readonly metElsewhereRef: string | null
}

function cell(outcome: FrontlineMatrixCell['outcome'], note: string): FrontlineMatrixCell {
  return { outcome, note, openDecision: null }
}

/** The bare token, as the cell's own and only words. */
const PROHIBITED = cell('explicitlyProhibited', 'Explicitly prohibited')
const PROHIBITED_ON_THIS_SURFACE = cell(
  'explicitlyProhibited',
  'Explicitly prohibited on this surface',
)
const UNAVAILABLE_BARE = cell('unavailable', 'Unavailable')

export const FL_B12_MATRIX = [
  {
    id: 'view-connected',
    control: 'View training material when connected',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    metElsewhereRef: null,
    routedTo: {},
    cells: {
      WORKER: cell('allowed', 'Allowed'),
      SUPERVISOR: cell(
        'notApplicable',
        'Not applicable — no execution session on this surface',
      ),
      QUALITY_MANAGER: cell('notApplicable', 'Not applicable — same basis'),
      TENANT_ADMIN: cell('notApplicable', 'Not applicable'),
      READONLY_AUDITOR: PROHIBITED,
    },
    why:
      'Worker, as a viewer, scoped to their tenant and rendered in their language where a variant ' +
      'exists.',
    whyRef: 'L42107',
    sourceRef: 'L42113',
  },
  {
    id: 'view-offline',
    control: 'View training material offline',
    surface: 'screen',
    // The library exists. It is absent while the device has no connection, and
    // the card's Reconnect behaviour field says the destination becomes
    // available again with no queued state, because nothing was recorded.
    existence: 'absent-under-condition',
    metElsewhere: null,
    metElsewhereRef: null,
    routedTo: {},
    cells: {
      WORKER: cell(
        'unavailable',
        'Unavailable — the library is deliberately excluded from the offline Run bundle',
      ),
      SUPERVISOR: UNAVAILABLE_BARE,
      QUALITY_MANAGER: UNAVAILABLE_BARE,
      TENANT_ADMIN: UNAVAILABLE_BARE,
      READONLY_AUDITOR: UNAVAILABLE_BARE,
    },
    why:
      'Report unavailability honestly when offline rather than rendering an empty list. Purpose: ' +
      'the worker sees state honestly. Roles prohibited: no surface may imply the library is empty ' +
      'rather than unreachable.',
    whyRef: 'FUNC-B12-02-1-3 · L42180',
    sourceRef: 'L42114',
  },
  {
    id: 'upload-or-version',
    control: 'Upload or version training material',
    surface: 'another-surface',
    existence: 'present',
    metElsewhere: {
      where: 'another-surface',
      surface: 'SURF-STU',
      note:
        'in the Standards and Operations Studio with an authoring grant, never here',
    },
    metElsewhereRef: 'L42115',
    routedTo: {},
    cells: {
      WORKER: PROHIBITED,
      SUPERVISOR: PROHIBITED_ON_THIS_SURFACE,
      QUALITY_MANAGER: cell(
        'allowedWithConditions',
        'Allowed with conditions — in the Standards and Operations Studio with an authoring grant, ' +
          'never here',
      ),
      TENANT_ADMIN: PROHIBITED_ON_THIS_SURFACE,
      READONLY_AUDITOR: PROHIBITED,
    },
    why:
      'Roles allowed: Worker views; authorised tenant staff upload in the Standards and Operations ' +
      'Studio. Roles prohibited: no upload or edit on this surface.',
    whyRef: 'FUNC-B12-01-1-1 · L42175',
    sourceRef: 'L42115',
  },
  {
    id: 'download-to-device',
    control: 'Download training material to the device',
    // The act exists and is what is prohibited: work packages download to this
    // device every shift. Classifying the row `not-in-scope` would say
    // downloading is a thing that exists nowhere for anyone, which is false of
    // the device this screen runs on.
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    metElsewhereRef: null,
    routedTo: {},
    cells: {
      WORKER: cell(
        'explicitlyProhibited',
        'Explicitly prohibited — online-only by design, to keep bundles lean',
      ),
      SUPERVISOR: PROHIBITED,
      QUALITY_MANAGER: PROHIBITED,
      TENANT_ADMIN: PROHIBITED,
      READONLY_AUDITOR: PROHIBITED,
    },
    why:
      'Purpose: package economics. Roles prohibited: nobody may add training media to a Run package.',
    whyRef: 'FUNC-B12-02-1-1 · L42178',
    sourceRef: 'L42116',
  },
  {
    id: 'view-another-tenants-material',
    control: "View another tenant's material",
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    metElsewhereRef: null,
    routedTo: {},
    cells: {
      WORKER: cell(
        'explicitlyProhibited',
        "Explicitly prohibited — the viewer is scoped to the worker's tenant",
      ),
      SUPERVISOR: PROHIBITED,
      QUALITY_MANAGER: PROHIBITED,
      TENANT_ADMIN: PROHIBITED,
      READONLY_AUDITOR: PROHIBITED,
    },
    why:
      'Purpose: cross-tenant data isolation is a platform-fixed invariant. Roles allowed: Worker, ' +
      'own tenant only. Roles prohibited: all cross-tenant access.',
    whyRef: 'FUNC-B12-04-1-1 · L42187',
    sourceRef: 'L42117',
  },
  {
    id: 'viewing-creates-a-record',
    control: 'Have a viewing create a production record',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    metElsewhereRef: null,
    routedTo: {},
    cells: {
      WORKER: cell(
        'explicitlyProhibited',
        'Explicitly prohibited — content delivery, not execution',
      ),
      SUPERVISOR: PROHIBITED,
      QUALITY_MANAGER: PROHIBITED,
      TENANT_ADMIN: PROHIBITED,
      READONLY_AUDITOR: PROHIBITED,
    },
    why:
      'Purpose: content delivery, not execution. Roles prohibited: no component may create a Step ' +
      'Execution or Data Capture from a viewing.',
    whyRef: 'FUNC-B12-04-1-2 · L42188',
    sourceRef: 'L42118',
  },
  {
    id: 'required-mid-run',
    control: 'Be required to view material mid-Run',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    metElsewhereRef: null,
    routedTo: {},
    cells: {
      WORKER: cell(
        'explicitlyProhibited',
        'Explicitly prohibited — it is never required mid-Run and nothing in a Run depends on it',
      ),
      SUPERVISOR: PROHIBITED,
      QUALITY_MANAGER: PROHIBITED,
      TENANT_ADMIN: PROHIBITED,
      READONLY_AUDITOR: PROHIBITED,
    },
    why:
      'Roles prohibited: no authored workflow may make a Run depend on library content. An ' +
      'online-only dependency must never sit in an offline-first execution path.',
    whyRef: 'FUNC-B12-02-1-2 · L42179',
    sourceRef: 'L42119',
  },
  {
    id: 'practice-mode',
    control: 'Use a practice or rehearsal mode',
    surface: 'screen',
    // Cut from scope rather than deferred, and there is nothing to come back
    // to. `deferred-to-a-later-slice` would be a schedule claim about a
    // capability the source removed from the product.
    existence: 'not-in-scope',
    metElsewhere: null,
    metElsewhereRef: null,
    routedTo: {},
    cells: {
      WORKER: cell('unavailable', 'Unavailable — practice mode is not in this scope'),
      SUPERVISOR: UNAVAILABLE_BARE,
      QUALITY_MANAGER: UNAVAILABLE_BARE,
      TENANT_ADMIN: UNAVAILABLE_BARE,
      READONLY_AUDITOR: UNAVAILABLE_BARE,
    },
    why:
      'Roles allowed: nobody. Roles prohibited: every role. A rehearsal capability running a real ' +
      'Workflow end to end with results segregated from production records would be a change ' +
      'request if it resurfaces.',
    whyRef: 'FUNC-B12-05-1-1 · L42191',
    sourceRef: 'L42120',
  },
] as const satisfies readonly FlB12MatrixRow[]

type MissingFromMatrix = Exclude<FlB12RowId, (typeof FL_B12_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

/**
 * The shape the brief asserts, DERIVED here rather than quoted, so the
 * arithmetic is a check on the transcription instead of a restatement of it.
 * Eight rows over the eight data lines L42113-L42120, five columns, forty
 * cells.
 */
export const FL_B12_SHAPE = {
  module: 'MOD-FL-B12',
  rows: FL_B12_MATRIX.length,
  columns: FL_B12_COLUMNS.length,
  cells: FL_B12_MATRIX.length * FL_B12_COLUMNS.length,
  headerLine: 42111,
  separatorLine: 42112,
  firstDataLine: 42113,
  lastDataLine: 42120,
} as const

/**
 * The tokens this matrix uses, COUNTED OFF THE CELLS rather than written down
 * beside them. Five of the seven appear: 25 `Explicitly prohibited`, 10
 * `Unavailable`, 3 `Not applicable`, 1 `Allowed`, 1 `Allowed with conditions`.
 * The suite asserts the total is forty and that the ten `Unavailable` split
 * five and five across the two rows, because a tally written by hand beside a
 * transcription is a restatement of it and catches nothing.
 */
export const FL_B12_TOKEN_TALLY: Readonly<Record<string, number>> = FL_B12_MATRIX.reduce<
  Record<string, number>
>((acc, row) => {
  for (const column of FL_B12_COLUMNS) {
    const key = row.cells[column].outcome
    acc[key] = (acc[key] ?? 0) + 1
  }
  return acc
}, {})

/* ==================================================================== *
 * THE TWO SENSES, AS DATA SO THEY RENDER SIDE BY SIDE.
 *
 * The point of this record is that a reader meets both readings on one screen.
 * `routeBack` is what separates them and it is required, not optional: a sense
 * with no answer to "does it come back?" is the overload written down again
 * rather than resolved into two behaviours.
 * ==================================================================== */

export interface UnavailableSense {
  readonly rowId: FlB12RowId
  readonly existence: Exclude<FrontlineCapabilityExistence, 'present'>
  /** The cell's own words after the token, verbatim. */
  readonly cellWords: string
  /** What happens next for a worker who meets it. Never blank. */
  readonly routeBack: string
  readonly sourceRef: string
  /** Where the same sense is written elsewhere in the frozen source. */
  readonly corroboration: readonly { readonly reading: string; readonly sourceRef: string }[]
}

export const B12_UNAVAILABLE_SENSES = [
  {
    rowId: 'view-offline',
    existence: 'absent-under-condition',
    cellWords: 'the library is deliberately excluded from the offline Run bundle',
    routeBack:
      'It comes back at the next connection. The destination becomes available again and no queued ' +
      'state exists, because nothing was recorded. Nothing in a Run was waiting on it in the ' +
      'meantime.',
    sourceRef: 'L42114',
    corroboration: [
      {
        reading:
          'The destination-property table gives the same reading for the destination as a whole: ' +
          'Unavailable, online-only by design, excluded from the offline bundle.',
        sourceRef: 'L40036',
      },
      {
        reading:
          'The card states the return in its own words: the destination becomes available again, ' +
          'with no queued state, because nothing was recorded.',
        sourceRef: 'L42145',
      },
    ],
  },
  {
    rowId: 'practice-mode',
    existence: 'not-in-scope',
    cellWords: 'practice mode is not in this scope',
    routeBack:
      'There is none, and there never will be. It is cut rather than deferred; it returns only as a ' +
      'change request. Nothing about a connection, a version or a later slice changes this answer.',
    sourceRef: 'L42120',
    corroboration: [
      {
        reading:
          'The scope chapter records the answer given when a client asked for practice runs: ' +
          'practice mode is cut, not deferred, and what exists instead is this viewer.',
        sourceRef: 'L2726',
      },
      {
        reading:
          'The traceability register files it as a scope boundary requiring practice mode to be ' +
          'treated as cut rather than deferred, returning only as a change request.',
        sourceRef: 'L4807',
      },
      {
        reading:
          "MOD-FL-B10 carries the surface's only other Unavailable row and it is this same sense: " +
          'there is no operating-system push at launch.',
        sourceRef: 'L41797',
      },
    ],
  },
] as const satisfies readonly UnavailableSense[]
