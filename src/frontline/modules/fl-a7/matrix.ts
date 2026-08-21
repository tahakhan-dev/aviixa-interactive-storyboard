import { ROLES, type RoleId } from '@/domain/roles'
import type { SurfaceId } from '@/domain/surfaces'
import {
  FL_ACTS_HELD_ELSEWHERE,
  type FrontlineCrossSurfaceAct,
} from '@/frontline/cross-surface'
import type {
  FrontlineMatrixCell,
  FrontlineMatrixRow,
  FrontlineMetElsewhere,
} from '@/frontline/matrix'
import type { FrontlineSlug } from '@/frontline/screens'

/**
 * `MOD-FL-A7`'s PERMISSION MATRIX, TRANSCRIBED ROW BY ROW AND CELL BY CELL.
 *
 * Header L41295, separator L41296, data L41297-L41305. **Nine rows, SIX
 * persona columns, fifty-four cells**, and `cells` is a total `Record` over
 * `A7Column`, so a blank is untypeable. `FL_MATRIX_SHAPE`'s `MOD-FL-A7` row
 * in `@/frontline/matrix` carries the same four line numbers and the same
 * two counts; the covering test asserts this file and that one agree, and
 * asserts BOTH against the frozen source parsed at run time.
 *
 * ── THE SIXTH COLUMN IS NOT A `RoleId`, AND THIS IS THE FIRST THING THAT
 *    HAD TO BE CHECKED ────────────────────────────────────────────────
 *
 * `MOD-FL-A7` is the ONLY Frontline matrix with a sixth persona column. The
 * other eleven carry five, and `src/frontline/modules/fl-a5/matrix.ts`
 * types its columns as `Extract<RoleId, …>` — five headers, five members of
 * the platform's own role union, which is exactly right there and would be
 * a false claim here. **"Platform roles" is plural and names no single
 * role.** `@/domain/roles` holds four roles in the `PLATFORM` security
 * domain and the source narrows the column further inside its own cells:
 * L41300 reads "Root Super Admin approves" and L41302 reads "client
 * platform team only".
 *
 * So `A7Column` is the HEADER'S OWN SIX WORDS (L41295) and
 * `A7_COLUMN_ROLES` maps each one to the SET of `RoleId`s it covers — five
 * singletons and one set of four, the four DERIVED from `ROLES` by security
 * domain rather than listed here, so a platform role added or removed over
 * there cannot leave this column out of step.
 *
 * A ROW TYPE SHARED WITH A FIVE-COLUMN MODULE WOULD HAVE BEEN THE DEFECT.
 * Wave 0 parameterises `FrontlineMatrixRow<Id, Column>` on the column type
 * precisely so this matrix can carry six where the others carry five;
 * nothing here redefines the row, the cell or the fold.
 *
 * ── WHERE EACH ROW'S ACT IS MET ────────────────────────────────────────
 *
 * FOUR ROWS ARE MET SOMEWHERE ELSE AND FIVE ARE MET WHEREVER THEY ARE
 * ATTEMPTED, and the split is not the token's — it is whether the row has a
 * permissive cell whose act genuinely happens.
 *
 *  - Rows 3, 4, 5 and 6 each carry a permissive cell naming a WEB SURFACE:
 *    the Delivery Operations Hub managed-credential path (L41299), the
 *    platform critical class the Root Super Admin approves (L41300), and
 *    the Hub lifecycle or Super Admin platform console (L41301, L41302).
 *    `another-surface`, every one.
 *  - Row 9's Worker cell is permissive and its act — completing an
 *    in-flight Run — happens on the Run Player, which is a DESTINATION of
 *    this surface and not another surface. `another-destination`. L1598 and
 *    `AC-PROD-040` (L1614) cap the platform at five surfaces, so dressing a
 *    Frontline destination as a surface crossing would claim a sixth.
 *  - Rows 1, 2, 7 and 8 are `Explicitly prohibited` in all six columns.
 *    They are refused on every destination of this surface alike, so they
 *    are stated wherever they could be attempted rather than pointed
 *    somewhere else — `MOD-FL-A1`'s row 9 (L40196) is the same shape and
 *    took the same classification.
 *
 * ── EVERY ROW IS `present`, INCLUDING ROW 7 ────────────────────────────
 *
 * `existence` asks whether the capability exists on this surface at all,
 * and wave 0 reserves `not-in-scope` for the source's own `Unavailable`
 * cells in the "exists nowhere for anyone" sense (L42120, L41797, against
 * L42114's opposite sense). NO CELL IN THIS MATRIX READS `Unavailable`.
 * Row 7, `Dismiss the compliance lock screen`, reads `Explicitly
 * prohibited` in all six columns — a prohibition on a gesture a worker
 * might attempt, not a claim that dismissal is unimaginable. Classifying it
 * `not-in-scope` would replace the source's ruling with this build's and
 * would swap the source's token for a stated line. Both draw NO CONTROL, so
 * nothing about the screen changes; what changes is which of the two the
 * record says, and the record says `Explicitly prohibited`.
 *
 * ── `routedTo` IS EMPTY ON ALL NINE, AND THAT IS A READING ──────────────
 *
 * `routedTo` names a capability IN THIS MATRIX that a column is routed to
 * INSTEAD. No cell here does that. The nearest candidate is row 7's
 * Platform-roles cell, "it lifts only when the suspension lifts" — but the
 * suspension rows of this matrix (5 and 6) are about APPLYING one, which is
 * the opposite act, and this matrix has no row for lifting one. Pointing a
 * reader at row 6 would send them to the act that caused the lock. The
 * cell's own words already carry the whole answer and they render verbatim.
 *
 * Row 9's Supervisor and Quality Manager cells read "Not applicable — no
 * execution session", which in `MOD-FL-A1` routes to that matrix's own
 * session row (L40188). THIS matrix has no session row, so the same words
 * carry no route here. That asymmetry is the two matrices', not an omission.
 */

/** The header's own six persona columns, verbatim from L41295. */
export const A7_COLUMNS = [
  'Worker',
  'Supervisor',
  'Quality Manager',
  'Tenant Admin',
  'Read-only Auditor',
  'Platform roles',
] as const

export type A7Column = (typeof A7_COLUMNS)[number]

/**
 * The four roles of the platform security domain, DERIVED rather than
 * listed. `ROLES` is the platform's own register and its `domain` field is
 * the only thing that says which side of the boundary a role sits on.
 */
export const PLATFORM_ROLE_IDS: readonly RoleId[] = ROLES.filter(
  (r) => r.domain === 'PLATFORM',
).map((r) => r.id)

/**
 * WHICH ROLES A COLUMN COVERS. Total over the six, and a SET rather than a
 * role — five of the six happen to be singletons and the sixth is not, and
 * a `Record<A7Column, RoleId>` would have had to invent a single role for a
 * column whose header is plural.
 */
export const A7_COLUMN_ROLES: Readonly<Record<A7Column, readonly RoleId[]>> = {
  Worker: ['WORKER'],
  Supervisor: ['SUPERVISOR'],
  'Quality Manager': ['QUALITY_MANAGER'],
  'Tenant Admin': ['TENANT_ADMIN'],
  'Read-only Auditor': ['READONLY_AUDITOR'],
  'Platform roles': PLATFORM_ROLE_IDS,
}

/**
 * The ONE role a cross-surface pointer is checked against for a column.
 * `frontlineCrossSurfaceModel` takes a single `RoleId` because a link is
 * drawn for a viewer, and a viewer is one person.
 *
 * FOR THE SIXTH COLUMN THE PICK IS THE SOURCE'S OWN, NOT AN ARBITRARY ONE:
 * L41300's cell names the Root Super Admin as the approver. It is also not
 * load-bearing, and the covering test is what makes that a fact rather than
 * a hope — all four platform roles reach the same surfaces (`ROLES` gives
 * each of them `reachableSurfaces: ['SURF-SA']`), so every one of the four
 * produces the same link state for every row of this matrix, and the test
 * asserts exactly that rather than trusting this sentence.
 */
export const A7_COLUMN_POINTER_ROLE: Readonly<Record<A7Column, RoleId>> = {
  Worker: 'WORKER',
  Supervisor: 'SUPERVISOR',
  'Quality Manager': 'QUALITY_MANAGER',
  'Tenant Admin': 'TENANT_ADMIN',
  'Read-only Auditor': 'READONLY_AUDITOR',
  'Platform roles': 'ROOT_SUPER_ADMIN',
}

export type A7RowId =
  | 'read-store-outside'
  | 'export-media'
  | 'pin-reset'
  | 'wipe-or-deauthorise'
  | 'soft-or-hard-suspension'
  | 'compliance-suspension'
  | 'dismiss-compliance-lock'
  | 'capture-under-compliance-stop'
  | 'complete-in-flight-run'

/**
 * WHERE THE ROW'S ACT IS MET. Recorded once, resolved per viewing
 * destination by `a7RowsFor`. `MOD-FL-A7` has one destination — `SCR-FL-06`
 * Profile-lite — so today only one resolution is ever asked for; the shape
 * is the one `MOD-FL-A1` established because that module has two and this
 * matrix must not answer the same question a second way.
 */
export type A7Home =
  /** Attempted wherever the worker is, and refused there. `screen` on every destination. */
  | { readonly kind: 'attempted-anywhere'; readonly note: string }
  /** Another DESTINATION of this surface. A named place, never a link off-surface. */
  | {
      readonly kind: 'destination'
      readonly destination: FrontlineSlug
      readonly note: string
    }
  /** Another SURFACE entirely. A statement, never a control, on every view. */
  | {
      readonly kind: 'another-surface'
      readonly surface: Exclude<SurfaceId, 'SURF-FL'>
      readonly note: string
    }

export interface A7BaseRow {
  readonly id: A7RowId
  /** The Action column, verbatim (L41297-L41305, first cell). */
  readonly control: string
  readonly home: A7Home
  /** TOTAL over the six columns. A blank cell is untypeable. */
  readonly cells: Readonly<Record<A7Column, FrontlineMatrixCell>>
  readonly sourceRef: string
}

/**
 * ROW 4's TENANT ADMIN CELL DOES NOT DEFER TO THE DEVICE-SESSION QUESTION,
 * AND THIS IS A FINDING RATHER THAN A PREFERENCE.
 *
 * `TENANT_ADMIN_OPEN_CELLS` in `@/frontline/matrix` lists this cell among
 * eleven and its surrounding comment says "every one of them defers to the
 * same unanswered question — whether a Tenant Admin holds a device session
 * at all (L39837, `AC-FL-009-5` at L39948)". Measured against the frozen
 * source, that is true of the other ten and NOT of this one. L39837's cell
 * gives its reason as "the Statement of Work does not grant or deny a
 * Tenant Admin a device session". L41300's gives a different reason in its
 * own words: "the Statement of Work places device wipe and de-authorisation
 * in the platform critical class and does not grant it to a Tenant Admin".
 * The section's own source status agrees and files it separately — L41446:
 * "Tenant Admin wipe authority is `Client Decision Required`" — as does
 * `FUNC-A7-02-1-2` at L41368.
 *
 * It is the only `Client Decision Required` cell in the slice that ARGUES
 * rather than recording an absence, and the argument is what identifies it
 * as a second question. The enumeration in wave 0 is not edited from here;
 * this constant is the citation key that keeps the two questions apart on
 * screen, and the divergence is reported rather than reconciled.
 */
export const A7_TENANT_ADMIN_WIPE_AUTHORITY = {
  id: 'Tenant Admin wipe authority',
  question:
    'Whether a Tenant Admin may trigger a remote data wipe or de-authorisation. The Statement of Work places both in the platform critical class and does not grant either to a Tenant Admin, and it does not deny it in terms.',
  distinctFrom:
    'The Tenant Admin DEVICE-SESSION question, which is AC-FL-009-5 (L39948) over L39837 and asks whether a Tenant Admin holds an execution session on a device at all. That one is recorded once in src/routes/definitions.ts and is read through routeOpenDecisionFor; it is not this one, and answering either would not answer the other.',
  sourceRef: 'L41300 (the cell), L41368 (FUNC-A7-02-1-2), L41446 (the section source status)',
} as const

/** A bare `Explicitly prohibited`, which forty-one of the fifty-four cells are. */
const EP = (note = 'Explicitly prohibited'): FrontlineMatrixCell => ({
  outcome: 'explicitlyProhibited',
  note,
  openDecision: null,
})

/**
 * The suspension act declared once for the whole surface in
 * `FL_ACTS_HELD_ELSEWHERE`, READ from there rather than re-spelled. Rows 5
 * and 6 are both instances of it and its `sourceRef` already names L41301,
 * L41302, L41303 and L39665 — wave 0 reached this matrix from the surface
 * end before this module reached it from the row end, and one act described
 * twice in two wordings is the defect shape this build has recorded most.
 *
 * THE CELL NAMES TWO SURFACES AND `FrontlineMetElsewhere` HOLDS ONE. L41301
 * reads "Delivery Operations Hub lifecycle or Super Admin platform
 * console". Wave 0 already ruled on that pairing — `owningSurface:
 * 'SURF-SA'` with the Hub named in the statement's own words — and the
 * ruling is CONSUMED here rather than reopened, which is the whole reason
 * that constant exists.
 */
const SUSPENSION_ACT: FrontlineCrossSurfaceAct = (() => {
  const act = FL_ACTS_HELD_ELSEWHERE.find(
    (a) => a.capability === 'Applying a soft, hard, or compliance suspension.',
  )
  if (act === undefined) {
    throw new Error(
      'FL_ACTS_HELD_ELSEWHERE no longer declares the suspension act. MOD-FL-A7 rows 5 and 6 ' +
        'read their owning surface from that declaration and will not re-derive it here.',
    )
  }
  return act
})()

export const A7_ROWS = [
  {
    id: 'read-store-outside',
    control: "Read the application's encrypted store outside the application",
    home: {
      kind: 'attempted-anywhere',
      note: 'Refused on every destination of this surface alike, so it is stated wherever it could be attempted rather than pointed somewhere else. AC-A7-1 (L41422) makes the store unreadable outside the application with no dependency on device-level management, and L41349 gives the reason: the application assumes no mobile-device-management is present, because relying on management the tenant may not have would make the guarantee conditional on something the platform cannot verify.',
    },
    cells: {
      Worker: EP(),
      Supervisor: EP(),
      'Quality Manager': EP(),
      'Tenant Admin': EP(),
      'Read-only Auditor': EP(),
      'Platform roles': EP(),
    },
    sourceRef: 'L41297',
  },
  {
    id: 'export-media',
    control: 'Export captured media anywhere',
    home: {
      kind: 'attempted-anywhere',
      note: 'Refused on every destination alike. AC-A7-2 (L41423) puts no captured media within reach of the device gallery, a file browser, a backup, or any other application, and TEST-A7-2 (L41436) attempts all four and asserts each fails. FUNC-A7-01-1-2 (L41364) states the purpose: evidence cannot be shared, deleted, or stripped of its binding.',
    },
    cells: {
      Worker: EP(),
      Supervisor: EP(),
      'Quality Manager': EP(),
      'Tenant Admin': EP(),
      'Read-only Auditor': EP(),
      'Platform roles': EP(),
    },
    sourceRef: 'L41298',
  },
  {
    id: 'pin-reset',
    control: 'Reset a Personal Identification Number after lockout',
    home: {
      kind: 'another-surface',
      surface: 'SURF-DOH',
      note: "Through the Delivery Operations Hub managed-credential path. FUNC-A7-03-2-1 (L41373) gives the reason — a supervised path with an audit trail rather than a device-local escape hatch — and states the offline position in the source's own words: “Not applicable — reset is performed on a web surface, not on the device.” The Quality Manager and Tenant Admin cells read “same path” and inherit that surface from the Supervisor cell beside them without naming it, which is why the classification is the ROW's and not each cell's. TEST-A7-3 (L41437) attempts a device-local reset and asserts no such path exists.",
    },
    cells: {
      Worker: EP(),
      Supervisor: {
        outcome: 'allowed',
        note: 'Allowed — through the Delivery Operations Hub managed-credential path',
        openDecision: null,
      },
      'Quality Manager': { outcome: 'allowed', note: 'Allowed — same path', openDecision: null },
      'Tenant Admin': { outcome: 'allowed', note: 'Allowed — same path', openDecision: null },
      'Read-only Auditor': EP(),
      'Platform roles': {
        outcome: 'notApplicable',
        note: 'Not applicable — tenant credential administration is a tenant action',
        openDecision: null,
      },
    },
    sourceRef: 'L41299',
  },
  {
    id: 'wipe-or-deauthorise',
    control: 'Trigger a remote data wipe or de-authorisation',
    home: {
      kind: 'another-surface',
      surface: 'SURF-SA',
      note: 'A critical-class platform action approved by the Root Super Admin in the Super Admin platform console (L41289, FUNC-A7-02-1-2 at L41368). The device is the RECIPIENT and never the origin: FUNC-A7-02-1-1 (L41367) states that no worker may trigger or cancel it. DEC-SYNC-001 (L39672) orders it first on reconnection, in the stop class, and @/frontline/commands records that neither de-authorisation nor remote wipe is one of the five command classes the device accepts.',
    },
    cells: {
      Worker: EP(),
      Supervisor: EP(),
      'Quality Manager': EP(),
      'Tenant Admin': {
        outcome: 'clientDecisionRequired',
        note: 'Client Decision Required — the Statement of Work places device wipe and de-authorisation in the platform critical class and does not grant it to a Tenant Admin',
        openDecision: A7_TENANT_ADMIN_WIPE_AUTHORITY.id,
      },
      'Read-only Auditor': EP(),
      'Platform roles': {
        outcome: 'allowedWithConditions',
        note: 'Allowed with conditions — critical class, Root Super Admin approves',
        openDecision: null,
      },
    },
    sourceRef: 'L41300',
  },
  {
    id: 'soft-or-hard-suspension',
    control: 'Apply a soft or hard suspension',
    home: {
      kind: 'another-surface',
      surface: SUSPENSION_ACT.owningSurface,
      note: SUSPENSION_ACT.whatHappensThere,
    },
    cells: {
      Worker: EP(),
      Supervisor: EP(),
      'Quality Manager': EP(),
      'Tenant Admin': EP(),
      'Read-only Auditor': EP(),
      'Platform roles': {
        outcome: 'allowedWithConditions',
        note: 'Allowed with conditions — Delivery Operations Hub lifecycle or Super Admin platform console',
        openDecision: null,
      },
    },
    sourceRef: 'L41301',
  },
  {
    id: 'compliance-suspension',
    control: 'Apply a compliance suspension',
    home: {
      kind: 'another-surface',
      surface: SUSPENSION_ACT.owningSurface,
      note: SUSPENSION_ACT.whatHappensThere,
    },
    cells: {
      Worker: EP(),
      Supervisor: EP(),
      'Quality Manager': EP(),
      'Tenant Admin': EP(),
      'Read-only Auditor': EP(),
      'Platform roles': {
        outcome: 'allowedWithConditions',
        note: 'Allowed with conditions — client platform team only, critical class',
        openDecision: null,
      },
    },
    sourceRef: 'L41302',
  },
  {
    id: 'dismiss-compliance-lock',
    control: 'Dismiss the compliance lock screen',
    home: {
      kind: 'attempted-anywhere',
      note: 'The lock is a full-screen interrupt over whatever the worker was doing — §22.7 gives SCR-FL-21 the Destination column “Full-screen interrupt” (L39883) — so the gesture is attempted wherever the device is, and it is refused there, for every persona including the platform. Storyboard SB-FL-016 (L41412): “No error code, no retry, no dismiss.” TEST-A7-4 (L41438) attempts the dismissal and asserts no control exists.',
    },
    cells: {
      Worker: EP(),
      Supervisor: EP(),
      'Quality Manager': EP(),
      'Tenant Admin': EP(),
      'Read-only Auditor': EP(),
      'Platform roles': EP('Explicitly prohibited — it lifts only when the suspension lifts'),
    },
    sourceRef: 'L41303',
  },
  {
    id: 'capture-under-compliance-stop',
    control: 'Continue capturing under a compliance stop',
    home: {
      kind: 'attempted-anywhere',
      note: 'Refused on every destination alike, and not pointed at the Run Player: under a compliance stop the application is locked and no capture happens anywhere, so naming a place would say the act is met there. FUNC-A7-05-3-1 (L41383) — “nobody may act on the device”. AC-A7-5 (L41426) preserves all local data while it holds; nothing captured is lost, and nothing further is captured.',
    },
    cells: {
      Worker: EP(),
      Supervisor: EP(),
      'Quality Manager': EP(),
      'Tenant Admin': EP(),
      'Read-only Auditor': EP(),
      'Platform roles': EP(),
    },
    sourceRef: 'L41304',
  },
  {
    id: 'complete-in-flight-run',
    control: 'Complete an in-flight Run under hard suspension',
    home: {
      kind: 'destination',
      destination: 'run-player',
      note: '§25.5 gives SCR-FL-03 the purpose “Execute the pinned work package end to end” (L48531), and completing an in-flight Run is that act. Hard suspension does not stop work already running: FUNC-A7-05-2-1 (L41381) starts no new Runs while letting in-flight Runs complete, capture, sync, compute summaries, and close, and AC-A7-6 (L41427) requires every in-flight Run to be able to do all five. Its own offline clause is the honesty rule this module lives by: the command must have arrived to take effect, and an offline device continues under its last known state, which no surface may misrepresent.',
    },
    cells: {
      Worker: {
        outcome: 'allowedWithConditions',
        note: 'Allowed with conditions — in-flight Runs complete, capture, sync, compute summaries, and close; no new Runs start',
        openDecision: null,
      },
      Supervisor: {
        outcome: 'notApplicable',
        note: 'Not applicable — no execution session',
        openDecision: null,
      },
      'Quality Manager': {
        outcome: 'notApplicable',
        note: 'Not applicable — no execution session',
        openDecision: null,
      },
      'Tenant Admin': { outcome: 'notApplicable', note: 'Not applicable', openDecision: null },
      'Read-only Auditor': EP(),
      'Platform roles': { outcome: 'notApplicable', note: 'Not applicable', openDecision: null },
    },
    sourceRef: 'L41305',
  },
] as const satisfies readonly A7BaseRow[]

type MissingFromRows = Exclude<A7RowId, (typeof A7_ROWS)[number]['id']>
const _rowsExhaustive: MissingFromRows extends never ? true : never = true
void _rowsExhaustive

/** The header line, the separator, and the first and last data lines. */
export const A7_MATRIX_SHAPE = {
  module: 'MOD-FL-A7',
  rows: 9,
  columns: 6,
  headerLine: 41295,
  separatorLine: 41296,
  firstDataLine: 41297,
  lastDataLine: 41305,
} as const

/**
 * The row list as wave 0's `FrontlineMatrixRow`, classified for ONE viewing
 * destination. `existence` is `present` on all nine — see the header note.
 */
export function a7RowsFor(
  viewing: FrontlineSlug,
): readonly FrontlineMatrixRow<A7RowId, A7Column>[] {
  return A7_ROWS.map((row) => {
    const [surface, metElsewhere] = classify(row.home, viewing)
    return {
      id: row.id,
      control: row.control,
      surface,
      existence: 'present',
      metElsewhere,
      routedTo: {},
      cells: row.cells,
      sourceRef: row.sourceRef,
    }
  })
}

function classify(
  home: A7Home,
  viewing: FrontlineSlug,
): ['screen' | 'another-destination' | 'another-surface', FrontlineMetElsewhere | null] {
  if (home.kind === 'another-surface') {
    return [
      'another-surface',
      { where: 'another-surface', surface: home.surface, note: home.note },
    ]
  }
  if (home.kind === 'attempted-anywhere' || home.destination === viewing) return ['screen', null]
  return [
    'another-destination',
    { where: 'another-destination', destination: home.destination, note: home.note },
  ]
}

export function a7RowById(id: A7RowId): A7BaseRow {
  const found = A7_ROWS.find((r) => r.id === id)
  if (found === undefined) throw new Error(`no MOD-FL-A7 matrix row: ${id}`)
  return found
}

/**
 * ROW 3 IS ALSO `MOD-FL-A1`'s ROW 7, AND THE TWO TRANSCRIPTIONS OF IT ARE
 * NOT THE SAME TEXT. THIS IS A FINDING.
 *
 * Both matrices carry an Action reading `Reset a Personal Identification
 * Number after lockout`, both give the Worker and the Read-only Auditor
 * `Explicitly prohibited`, and both give the Supervisor, the Quality
 * Manager and the Tenant Admin `Allowed`. The Supervisor cells differ:
 *
 *   L40194 (`MOD-FL-A1` row 7)
 *     `Allowed` — through the Delivery Operations Hub managed-credential
 *     path, not on the device
 *   L41299 (`MOD-FL-A7` row 3)
 *     `Allowed` — through the Delivery Operations Hub managed-credential
 *     path
 *
 * The words ", not on the device" are present in one and absent in the
 * other. Neither is corrected: this module carries L41299 verbatim because
 * L41299 is this module's line, and `MOD-FL-A1` carries L40194 verbatim
 * because that is its. The covering test parses both lines and asserts the
 * divergence still exists, so a later transcription that quietly aligned
 * them would go red.
 *
 * AND THE SIXTH COLUMN IS WHY THE ROW IS NOT REDUNDANT. `MOD-FL-A1`'s
 * matrix has five columns and cannot hold the Platform-roles reading at
 * all. L41299's sixth cell — "Not applicable — tenant credential
 * administration is a tenant action" — exists only here.
 *
 * WHAT THIS MEANS FOR THE SCREEN, WHICH IS THE POINT OF RECORDING IT.
 * `SCR-FL-06` Profile-lite mounts `MOD-FL-A1` and `MOD-FL-A7` both (L48534)
 * and `MOD-FL-A1` already renders this act there as a cross-surface
 * statement. Rendering a second full statement for the same act would say
 * one thing twice on one screen. So this module's view draws the ONE
 * reading `MOD-FL-A1` cannot carry and names the neighbouring
 * transcription; `frontlineAffordance` still decides the row, and what it
 * decides is asserted rather than assumed.
 */
export const A7_ROW_3_ALSO_TRANSCRIBED_BY = {
  rowId: 'pin-reset',
  module: 'MOD-FL-A1',
  theirRow: 'row 7',
  theirSourceRef: 'L40194',
  ourSourceRef: 'L41299',
  divergence:
    'The Supervisor cell differs between the two lines. L40194 ends “managed-credential path, not on the device”; L41299 ends “managed-credential path”. The four words are in one transcription and not the other, and neither line is corrected against the other.',
  whatOnlyThisMatrixHolds:
    'The Platform-roles cell, “Not applicable — tenant credential administration is a tenant action”. MOD-FL-A1’s matrix has five persona columns and no place to record it.',
  renderingNote:
    'SCR-FL-06 Profile-lite mounts both modules (L48534) and MOD-FL-A1 already states this act there as a cross-surface statement, so this module states only the reading that module cannot carry rather than repeating one screen’s sentence twice.',
} as const

/**
 * The seven-token tally of this matrix, counted off the cells rather than
 * asserted beside them. Five of wave 0's seven tokens appear here; no cell
 * reads `Unavailable` and none reads `Read-only`, so the two opposite
 * senses of `Unavailable` (L42114 against L42120 and L41797) do not arise
 * in this module at all.
 */
export const A7_TOKEN_TALLY: Readonly<Record<string, number>> = A7_ROWS.reduce<
  Record<string, number>
>((tally, row) => {
  for (const column of A7_COLUMNS) {
    const outcome = row.cells[column].outcome
    tally[outcome] = (tally[outcome] ?? 0) + 1
  }
  return tally
}, {})
