import type { RoleId } from '@/domain/roles'
import type { SurfaceId } from '@/domain/surfaces'
import type {
  FrontlineMatrixCell,
  FrontlineMatrixRow,
  FrontlineMetElsewhere,
} from '@/frontline/matrix'
import type { FrontlineSlug } from '@/frontline/screens'
import { FL_OVERLAY_ON_ANY_DESTINATION } from '@/frontline/screens'

/**
 * `MOD-FL-A1`'s PERMISSION MATRIX, TRANSCRIBED ROW BY ROW AND CELL BY CELL.
 *
 * Header L40186, separator L40187, data L40188-L40197. **Ten rows, five
 * persona columns, fifty cells**, and `cells` is a total `Record` over
 * `A1Column`, so a blank is untypeable. `FL_MATRIX_SHAPE`'s `MOD-FL-A1` row
 * in `@/frontline/matrix` carries the same four line numbers and the same
 * two counts; the covering test asserts this file and that one agree, and
 * asserts BOTH against the frozen source parsed at run time.
 *
 * `note` IS THE CELL'S WHOLE TEXT, BACKTICKS STRIPPED, AND NOTHING ELSE.
 * That is the only reading under which no cell is blank — twenty-four of the
 * fifty are a bare `Explicitly prohibited` with no words after it, and five
 * more carry the whole clause INSIDE the backticks (`Not applicable — no
 * execution session`). A transcription that stored "the words after the
 * token" would leave twenty-four notes empty, which is exactly the blank
 * the total `Record` exists to forbid. Storing the whole cell also makes the
 * transcription mechanically checkable: the covering test splits L40188 to
 * L40197 on the pipe, strips backticks, and compares — so a paraphrase, a
 * dropped clause or a smart-quoted dash goes red rather than unnoticed.
 *
 * ── THE THREE ROWS THAT ARE THE INVERSE TRAP ───────────────────────────
 *
 * Six rows across the twelve Frontline matrices carry a permissive
 * Supervisor or Quality Manager cell that is a GENUINE on-device control
 * rather than an elsewhere-act: L40189, L40190 and L40192 here, L40534 in
 * `MOD-FL-A3`, and L41623 and L41624 in `MOD-FL-B9`. **Three of the six are
 * this matrix's**, and between them they hold SIX permissive
 * Supervisor-and-Quality-Manager cells — every one of them the
 * second-identity step-up, which L40182 names as the only way those two
 * roles touch this device at all.
 *
 * The uniform rule "a permissive Supervisor cell means the act is elsewhere"
 * is right thirty-odd times on this surface and wrong exactly here. Applied
 * here it deletes the sign-off authorisation path and leaves `MOD-FL-B9`'s
 * sign-off screen (L41623) with no way to be authorised, because the
 * authorising credential is accepted by THIS module.
 *
 * ── ROW 5 IS THE ONE ROW WHERE THE WORKER IS THE REFUSED PARTY ─────────
 *
 * L40192's Worker cell reads `Explicitly prohibited` while its Supervisor
 * and Quality Manager cells read a plain `Allowed`. Nowhere else in this
 * matrix does the Worker column carry the refusal and a non-Worker column
 * carry the grant.
 *
 * ── WHY CLASSIFICATION IS RESOLVED PER VIEWING DESTINATION ────────────
 *
 * `FrontlineRowSurface` answers "met on THIS destination's own screen?", and
 * this module has TWO destinations — `SCR-FL-01` Login (`sign-in`) and
 * `SCR-FL-06` Profile-lite. Row 8's language preference and row 10's logout
 * are met on Profile-lite; rows 1 to 4 are met on Login. The same row is
 * therefore `screen` to one of this module's views and `another-destination`
 * to the other, and a single hard-coded `surface` would be a false claim on
 * one of the two.
 *
 * So the transcription records WHERE each row is met, once, and
 * `a1RowsFor(slug)` resolves that into wave 0's `surface` and `metElsewhere`
 * for the view that is asking. It re-derives nothing: the four members of
 * `FrontlineRowSurface`, the `FrontlineMetElsewhere` shape and the order of
 * questions all stay in `@/frontline/matrix`, and `frontlineAffordance` is
 * the only thing that decides what draws.
 *
 * ── ROW 5 IS AN OVERLAY, NOT A DESTINATION ────────────────────────────
 *
 * §22.7's `SCR-FL-03` row (L39865) is the second-identity step-up sheet and
 * its own Destination column reads "Overlay on any destination". Wave 0
 * holds that row apart from the destination set as
 * `FL_OVERLAY_ON_ANY_DESTINATION` precisely so this build never has two
 * things called `SCR-FL-03` — §25.5's `SCR-FL-03` is the Run Player. That
 * ruling is CONSUMED here and not reopened: an overlay row is `screen` on
 * every destination it can be raised over, which is all of them.
 */

/** The header's own five persona columns, verbatim from L40186. */
export const A1_COLUMNS = [
  'Worker',
  'Supervisor',
  'Quality Manager',
  'Tenant Admin',
  'Read-only Auditor',
] as const

export type A1Column = (typeof A1_COLUMNS)[number]

/**
 * The column a reader is standing in, as a platform `RoleId`. Total over the
 * five, so a column cannot be read as a role nobody assigned. The
 * cross-surface renderer checks its pointer against `@/routes/definitions`
 * for a ROLE, and this is the only place this module turns a persona column
 * into one.
 */
export const A1_COLUMN_ROLE: Readonly<Record<A1Column, RoleId>> = {
  Worker: 'WORKER',
  Supervisor: 'SUPERVISOR',
  'Quality Manager': 'QUALITY_MANAGER',
  'Tenant Admin': 'TENANT_ADMIN',
  'Read-only Auditor': 'READONLY_AUDITOR',
}

export type A1RowId =
  | 'session'
  | 'sso'
  | 'managed-pin'
  | 'fast-switch'
  | 'step-up'
  | 'device-mode'
  | 'pin-reset'
  | 'language'
  | 'other-identity'
  | 'log-out'

/**
 * WHERE THE ROW'S ACT IS MET. Recorded once, resolved per viewing
 * destination by `a1RowsFor`.
 */
export type A1Home =
  /** One of this module's own destinations. `screen` there, a named place elsewhere. */
  | { readonly kind: 'destination'; readonly destination: FrontlineSlug; readonly note: string }
  /**
   * `SCR-FL-03`, whose Destination column reads "Overlay on any destination"
   * (L39865). Raised over whichever destination the reader is on, so it is
   * `screen` on both of this module's views.
   */
  | { readonly kind: 'overlay'; readonly note: string }
  /** Another SURFACE entirely. A statement, never a control, on every view. */
  | {
      readonly kind: 'another-surface'
      readonly surface: Exclude<SurfaceId, 'SURF-FL'>
      readonly note: string
    }

export interface A1BaseRow {
  readonly id: A1RowId
  /** The Action column, verbatim (L40188-L40197, first cell). */
  readonly control: string
  readonly home: A1Home
  /**
   * A capability IN THIS MATRIX this column is routed to instead. Declared
   * only where the cell's OWN WORDS name another row of this matrix, never
   * as a convenience:
   *
   *  - "Supervisors act by step-up, not by session" names the step-up row;
   *  - "same basis", beside it, inherits that reference;
   *  - "no execution session" names the session row;
   *  - "a step-up is released rather than logged out" names the step-up row.
   *
   * Row 10's Tenant Admin cell is a BARE `Not applicable` naming nothing, so
   * it carries no route and stays a refusal. That asymmetry is the source's,
   * not an omission.
   */
  readonly routedTo: Partial<Readonly<Record<A1Column, A1RowId>>>
  readonly cells: Readonly<Record<A1Column, FrontlineMatrixCell>>
  readonly sourceRef: string
}

/**
 * `AC-FL-009-5` (L39948) — the Tenant Admin device-session question, carried
 * as an open item and not resolved in either direction. Four of this
 * matrix's cells defer to it and every one sits in the Tenant Admin column:
 * L40188, L40189, L40190, L40192. It is recorded ONCE, in
 * `src/routes/definitions.ts`, through the `RouteOpenDecision` mechanism —
 * this constant is the citation key, never a second answer.
 */
export const A1_TENANT_ADMIN_OPEN_DECISION = 'AC-FL-009-5'

const EP = (note = 'Explicitly prohibited'): FrontlineMatrixCell => ({
  outcome: 'explicitlyProhibited',
  note,
  openDecision: null,
})

export const A1_ROWS = [
  {
    id: 'session',
    control: 'Establish an execution session on the device',
    home: {
      kind: 'destination',
      destination: 'sign-in',
      note: 'The session is established at Login, which §25.5 gives the purpose "Authenticate the identity and establish attribution, qualification, and language" (L48529).',
    },
    routedTo: { Supervisor: 'step-up', 'Quality Manager': 'step-up' },
    cells: {
      Worker: { outcome: 'allowed', note: 'Allowed', openDecision: null },
      Supervisor: EP('Explicitly prohibited — Supervisors act by step-up, not by session'),
      'Quality Manager': EP('Explicitly prohibited — same basis'),
      'Tenant Admin': {
        outcome: 'clientDecisionRequired',
        note: 'Client Decision Required — not addressed in the Statement of Work',
        openDecision: A1_TENANT_ADMIN_OPEN_DECISION,
      },
      'Read-only Auditor': EP(),
    },
    sourceRef: 'L40188',
  },
  {
    id: 'sso',
    control: 'Authenticate by single sign-on federated to the tenant identity provider',
    home: {
      kind: 'destination',
      destination: 'sign-in',
      note: 'The single-sign-on track is offered on the Login screen (L48529, FUNC-A1-01-1-1 at L40258).',
    },
    routedTo: {},
    cells: {
      Worker: {
        outcome: 'allowedWithConditions',
        note: 'Allowed with conditions — where the worker is a staff or admin role holder rather than an hourly floor worker',
        openDecision: null,
      },
      Supervisor: { outcome: 'allowed', note: 'Allowed', openDecision: null },
      'Quality Manager': { outcome: 'allowed', note: 'Allowed', openDecision: null },
      'Tenant Admin': {
        outcome: 'clientDecisionRequired',
        note: 'Client Decision Required',
        openDecision: A1_TENANT_ADMIN_OPEN_DECISION,
      },
      'Read-only Auditor': EP(),
    },
    sourceRef: 'L40189',
  },
  {
    id: 'managed-pin',
    control: 'Authenticate by platform-managed username and Personal Identification Number',
    home: {
      kind: 'destination',
      destination: 'sign-in',
      note: 'The managed-credential track is offered on the Login screen (L48529, FUNC-A1-01-2-1 at L40260).',
    },
    routedTo: {},
    cells: {
      Worker: { outcome: 'allowed', note: 'Allowed', openDecision: null },
      Supervisor: {
        outcome: 'allowedWithConditions',
        note: 'Allowed with conditions — for step-up only',
        openDecision: null,
      },
      'Quality Manager': {
        outcome: 'allowedWithConditions',
        note: 'Allowed with conditions — for step-up only',
        openDecision: null,
      },
      'Tenant Admin': {
        outcome: 'clientDecisionRequired',
        note: 'Client Decision Required',
        openDecision: A1_TENANT_ADMIN_OPEN_DECISION,
      },
      'Read-only Auditor': EP(),
    },
    sourceRef: 'L40190',
  },
  {
    id: 'fast-switch',
    control: 'Fast Personal Identification Number switch in Shared mode',
    home: {
      kind: 'destination',
      destination: 'sign-in',
      note: '§22.7 places the fast Personal Identification Number switch on the Login destination (SCR-FL-02, L39864).',
    },
    routedTo: { 'Tenant Admin': 'session' },
    cells: {
      Worker: { outcome: 'allowed', note: 'Allowed', openDecision: null },
      Supervisor: EP(),
      'Quality Manager': EP(),
      'Tenant Admin': {
        outcome: 'notApplicable',
        note: 'Not applicable — no execution session',
        openDecision: null,
      },
      'Read-only Auditor': EP(),
    },
    sourceRef: 'L40191',
  },
  {
    id: 'step-up',
    control: 'Perform a second-identity step-up to authorise a sign-off or approval',
    home: {
      kind: 'overlay',
      note: `§22.7 gives ${FL_OVERLAY_ON_ANY_DESTINATION.id} the Destination column "${FL_OVERLAY_ON_ANY_DESTINATION.destinationColumn}" (${FL_OVERLAY_ON_ANY_DESTINATION.sourceRef}), so the step-up sheet is raised over whichever destination the worker is already on and is never a destination of its own.`,
    },
    routedTo: {},
    cells: {
      Worker: EP(),
      Supervisor: { outcome: 'allowed', note: 'Allowed', openDecision: null },
      'Quality Manager': { outcome: 'allowed', note: 'Allowed', openDecision: null },
      'Tenant Admin': {
        outcome: 'clientDecisionRequired',
        note: 'Client Decision Required',
        openDecision: A1_TENANT_ADMIN_OPEN_DECISION,
      },
      'Read-only Auditor': EP(),
    },
    sourceRef: 'L40192',
  },
  {
    id: 'device-mode',
    control: 'Change the device mode',
    home: {
      kind: 'another-surface',
      surface: 'SURF-SA',
      note: 'Device mode is set per device at enrollment in the Super Admin platform console, which L40180 also names as the owner of device enrollment and device-mode setting. TEST-A1-4 (L40330) asserts that no interface for it exists on the device at all.',
    },
    routedTo: {},
    cells: {
      Worker: EP(),
      Supervisor: EP(),
      'Quality Manager': EP(),
      'Tenant Admin': EP(
        'Explicitly prohibited — device mode is set per device at enrollment in the Super Admin platform console',
      ),
      'Read-only Auditor': EP(),
    },
    sourceRef: 'L40193',
  },
  {
    id: 'pin-reset',
    control: 'Reset a Personal Identification Number after lockout',
    home: {
      kind: 'another-surface',
      surface: 'SURF-DOH',
      note: 'Through the Delivery Operations Hub managed-credential path, not on the device. The Quality Manager and Tenant Admin cells read "same path" and inherit that surface from the Supervisor cell beside them without naming it — which is why the classification is the ROW\'s and not each cell\'s.',
    },
    routedTo: {},
    cells: {
      Worker: EP(),
      Supervisor: {
        outcome: 'allowed',
        note: 'Allowed — through the Delivery Operations Hub managed-credential path, not on the device',
        openDecision: null,
      },
      'Quality Manager': { outcome: 'allowed', note: 'Allowed — same path', openDecision: null },
      'Tenant Admin': { outcome: 'allowed', note: 'Allowed — same path', openDecision: null },
      'Read-only Auditor': EP(),
    },
    sourceRef: 'L40194',
  },
  {
    id: 'language',
    control: 'Set the language preference for the logged-in identity',
    home: {
      kind: 'destination',
      destination: 'profile-lite',
      note: "The Worker cell names the place itself — \"in Profile-lite\" — and §25.5 gives SCR-FL-06 the purpose 'Set language preference and log out' (L48534).",
    },
    routedTo: { Supervisor: 'session', 'Quality Manager': 'session', 'Tenant Admin': 'session' },
    cells: {
      Worker: { outcome: 'allowed', note: 'Allowed — in Profile-lite', openDecision: null },
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
      'Tenant Admin': {
        outcome: 'notApplicable',
        note: 'Not applicable — no execution session',
        openDecision: null,
      },
      'Read-only Auditor': EP(),
    },
    sourceRef: 'L40195',
  },
  {
    id: 'other-identity',
    control: "View another identity's session or work",
    home: {
      kind: 'overlay',
      note: 'Refused on every destination of this surface alike, which is why it is stated wherever it could be attempted rather than pointed somewhere else. AC-SCOPE-044 (L2683) — no other worker\'s data is reachable — and L39243 — no session data is shown to other workers.',
    },
    routedTo: {},
    cells: {
      Worker: EP(),
      Supervisor: EP(),
      'Quality Manager': EP(),
      'Tenant Admin': EP(),
      'Read-only Auditor': EP(),
    },
    sourceRef: 'L40196',
  },
  {
    id: 'log-out',
    control: 'Log out',
    home: {
      kind: 'destination',
      destination: 'profile-lite',
      note: 'The happy path\'s own step 8 (L40218): "At shift end the worker logs out from Profile-lite, and the device returns to the charging bay." §25.5 gives SCR-FL-06 the same purpose (L48534).',
    },
    routedTo: { Supervisor: 'step-up', 'Quality Manager': 'step-up' },
    cells: {
      Worker: { outcome: 'allowed', note: 'Allowed', openDecision: null },
      Supervisor: {
        outcome: 'notApplicable',
        note: 'Not applicable — a step-up is released rather than logged out',
        openDecision: null,
      },
      'Quality Manager': {
        outcome: 'notApplicable',
        note: 'Not applicable — same basis',
        openDecision: null,
      },
      'Tenant Admin': { outcome: 'notApplicable', note: 'Not applicable', openDecision: null },
      'Read-only Auditor': EP(),
    },
    sourceRef: 'L40197',
  },
] as const satisfies readonly A1BaseRow[]

type MissingFromRows = Exclude<A1RowId, (typeof A1_ROWS)[number]['id']>
const _rowsExhaustive: MissingFromRows extends never ? true : never = true
void _rowsExhaustive

/** The header line, the separator, and the first and last data lines. */
export const A1_MATRIX_SHAPE = {
  module: 'MOD-FL-A1',
  rows: 10,
  columns: 5,
  headerLine: 40186,
  separatorLine: 40187,
  firstDataLine: 40188,
  lastDataLine: 40197,
} as const

/**
 * The row list as wave 0's `FrontlineMatrixRow`, classified for ONE viewing
 * destination. `existence` is `present` on all ten: every act in this matrix
 * exists somewhere in this scope, and the two that are met on another
 * surface say so through `surface` rather than by pretending the capability
 * is absent. `stated-line` is reserved for a capability that does not exist,
 * and none of these is one.
 */
export function a1RowsFor(
  viewing: FrontlineSlug,
): readonly FrontlineMatrixRow<A1RowId, A1Column>[] {
  return A1_ROWS.map((row) => {
    const [surface, metElsewhere] = classify(row.home, viewing)
    return {
      id: row.id,
      control: row.control,
      surface,
      existence: 'present',
      metElsewhere,
      routedTo: row.routedTo,
      cells: row.cells,
      sourceRef: row.sourceRef,
    }
  })
}

function classify(
  home: A1Home,
  viewing: FrontlineSlug,
): ['screen' | 'another-destination' | 'another-surface', FrontlineMetElsewhere | null] {
  if (home.kind === 'another-surface') {
    return [
      'another-surface',
      { where: 'another-surface', surface: home.surface, note: home.note },
    ]
  }
  if (home.kind === 'overlay' || home.destination === viewing) return ['screen', null]
  return [
    'another-destination',
    { where: 'another-destination', destination: home.destination, note: home.note },
  ]
}

export function a1RowById(id: A1RowId): A1BaseRow {
  const found = A1_ROWS.find((r) => r.id === id)
  if (found === undefined) throw new Error(`no MOD-FL-A1 matrix row: ${id}`)
  return found
}

/**
 * THE INVERSE TRAP, RECORDED AS DATA SO A LATER READER MEETS IT RATHER THAN
 * REDISCOVERING IT. Six rows across the twelve matrices; three are this
 * module's, and those three carry six permissive Supervisor-and-Quality-
 * Manager cells between them.
 */
export const GENUINE_NON_WORKER_CONTROLS = [
  {
    rowId: 'sso',
    columns: ['Supervisor', 'Quality Manager'],
    why: 'Both cells read a plain `Allowed` with no elsewhere-qualifier. L40182 states the only way these two roles touch this device: momentarily, through the second-identity step-up. FUNC-A1-01-1-1 (L40258) puts Supervisor and Quality Manager on the single-sign-on track.',
    sourceRef: 'L40189',
  },
  {
    rowId: 'managed-pin',
    columns: ['Supervisor', 'Quality Manager'],
    why: 'Both cells read `Allowed with conditions` and state the condition in four words — "for step-up only". A condition naming the step-up is not a condition naming another surface.',
    sourceRef: 'L40190',
  },
  {
    rowId: 'step-up',
    columns: ['Supervisor', 'Quality Manager'],
    why: 'The step-up itself. Both cells read a plain `Allowed`, and the Worker cell on this row is `Explicitly prohibited` — the one row on this surface where the Worker is the refused party. MOD-FL-B9 (L41623) consumes this authorisation for its sign-off; deleting the control here leaves that screen with no way to be authorised.',
    sourceRef: 'L40192',
  },
] as const satisfies readonly {
  readonly rowId: A1RowId
  readonly columns: readonly A1Column[]
  readonly why: string
  readonly sourceRef: string
}[]

/**
 * The other three of the six, named so this module's record of the trap is
 * the whole trap and not just its own share of it. Not consumed here — they
 * belong to `MOD-FL-A3` and `MOD-FL-B9`.
 */
export const GENUINE_NON_WORKER_CONTROLS_ELSEWHERE = [
  { module: 'MOD-FL-A3', sourceRef: 'L40534', act: 'Authorise an authored sign-off screen' },
  { module: 'MOD-FL-B9', sourceRef: 'L41623', act: 'Authorise a required supervisor sign-off' },
  {
    module: 'MOD-FL-B9',
    sourceRef: 'L41624',
    act: 'Perform a substitute sign-off in place of an unavailable supervisor',
  },
] as const
