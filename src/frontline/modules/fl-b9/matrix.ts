import type { RoleId } from '@/domain/roles'
import type { FrontlineMatrixCell, FrontlineMatrixRow } from '@/frontline/matrix'

/**
 * `MOD-FL-B9`'s PERMISSION MATRIX, TRANSCRIBED ROW BY ROW AND CELL BY CELL.
 * Header L41616, separator L41617, data L41618-L41626. **Nine rows, five
 * persona columns, forty-five cells**, and `cells` is a total `Record` over
 * `B9Column`, so a blank is untypeable.
 *
 * `note` IS THE CELL'S WHOLE TEXT, BACKTICKS STRIPPED, AND NOTHING ELSE —
 * the same reading `MOD-FL-A1` and `MOD-FL-A5` took, and the only one under
 * which no cell is blank. Twenty of the forty-five are a bare `Explicitly
 * prohibited` with no words after it, and six more carry the whole clause
 * inside the backticks.
 *
 * ── TWO OF THE SIX GENUINE NON-WORKER CONTROLS ON THIS SURFACE ARE HERE ──
 *
 * Six rows across the twelve Frontline matrices carry a permissive Supervisor
 * or Quality Manager cell that is a GENUINE on-device control rather than an
 * elsewhere-act: L40189, L40190 and L40192 in `MOD-FL-A1`, L40534 in
 * `MOD-FL-A3`, and **L41623 and L41624 here**. `MOD-FL-A1`'s own matrix names
 * these two in `GENUINE_NON_WORKER_CONTROLS_ELSEWHERE` from the other end.
 *
 * The uniform rule "a permissive Supervisor cell means the act is elsewhere"
 * is right thirty-odd times on this surface and wrong exactly here. Applied
 * uniformly it deletes THIS module's sign-off authorisation and leaves the
 * sign-off screen `SCR-FL-15` (L39877) with no way to be authorised at all.
 *
 * THE STEP-UP SHEET ITSELF IS NOT THIS MODULE'S AND IS NOT A PANEL.
 * `MOD-FL-A1` owns it, and §22.7's own Destination column for `SCR-FL-03`
 * (L39865) reads "Overlay on any destination". The control drawn here is the
 * authorisation; what it raises is A1's overlay, read from wave 0's
 * `FL_OVERLAY_ON_ANY_DESTINATION` rather than re-spelled.
 *
 * ── ROW 4 NAMES THE HUB; ROW 5 NAMES NO SURFACE ────────────────────────
 *
 * L41621's Tenant Admin cell says "tenant-level setting in the Delivery
 * Operations Hub". Its neighbour L41622 says only "uniform at tenant level,
 * deliberately not per-user" and **names no surface at all** — wave 0
 * enumerates it as one of the two cells that name a condition and no surface
 * (L41622 against L41621, L41100 against L41099). A rule that finds a
 * cross-surface act by looking for a surface name misses row 5 precisely
 * because the note is silent.
 *
 * SO ROW 5 IS NOT CLASSIFIED `another-surface`, AND THAT IS A RULING.
 * `FrontlineMetElsewhere` requires a NAMED surface for that classification,
 * and the source names none for this act anywhere: the card's Owning-surface
 * line (L41610) enumerates three non-device homes — posture to the Hub,
 * clearance granting to the Command Center, the substitution hierarchy to the
 * Hub — and the clearance duration is not among them; `FUNC-B9-01-3-2`
 * (L41696) says only "Tenant Admin sets the duration". Naming the Hub because
 * the neighbouring row does would be this build supplying a fact the source
 * withholds. What is certain is that the capability is not on this surface
 * for anyone: `AC-SCOPE-040` (L2683) — "the Frontline Worker Application
 * exposes no authoring or configuration control." So the row is `screen` with
 * `existence: 'not-in-scope'` and renders a stated line and no control, and
 * `B9_SOURCE_FINDINGS` carries the gap rather than closing it.
 *
 * ── ROW 3 IS THE COMMAND CHANNEL SEEN FROM THE RECIPIENT END ───────────
 *
 * `Grant a qualification clearance` (L41620) is Client Command Center action
 * 10. `CMD-FL-CLEAR` is already settled in `@/frontline/commands` — origin
 * "Client Command Center, action 10", authority "Supervisor and above",
 * effect "Unparks a run blocked at a qualification gate" — and the device is
 * the RECIPIENT. L39670: a command is effective on a device when that device
 * has applied it, never because someone created it. The Quality Manager cell
 * is one of wave 0's eleven ELLIPTICAL cells: it reads only "Allowed — same"
 * and inherits the surface from the cell beside it without naming it, which
 * is why `surface` is a property of the ROW here and never of the cell's
 * wording.
 *
 * ── NO CELL IN THIS MATRIX IS ROUTED ──────────────────────────────────
 *
 * `routedTo` is declared only where a cell's OWN WORDS name another row of
 * this matrix. Row 9's five cells are a bare `Explicitly prohibited` and row
 * 2's name a reason rather than a route, so none is given one. The clearance
 * that would unpark row 9's Run is row 3 of this matrix, but row 9's cells do
 * not say so and a convenience pointer is not a transcription.
 */

/** The header's own five persona columns are five members of `RoleId`. */
export type B9Column = Extract<
  RoleId,
  'WORKER' | 'SUPERVISOR' | 'QUALITY_MANAGER' | 'TENANT_ADMIN' | 'READONLY_AUDITOR'
>

export const B9_COLUMNS = [
  'WORKER',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'TENANT_ADMIN',
  'READONLY_AUDITOR',
] as const satisfies readonly B9Column[]

type MissingFromColumns = Exclude<B9Column, (typeof B9_COLUMNS)[number]>
const _columnsExhaustive: MissingFromColumns extends never ? true : never = true
void _columnsExhaustive

/** The header row's own words, L41616. Never re-worded for a table heading. */
export const B9_COLUMN_HEADINGS = {
  WORKER: 'Worker',
  SUPERVISOR: 'Supervisor',
  QUALITY_MANAGER: 'Quality Manager',
  TENANT_ADMIN: 'Tenant Admin',
  READONLY_AUDITOR: 'Read-only Auditor',
} as const satisfies Readonly<Record<B9Column, string>>

export type B9RowId =
  | 'be-blocked-at-gate'
  | 'override-gate-on-device'
  | 'grant-clearance'
  | 'set-enforcement-posture'
  | 'set-clearance-duration'
  | 'authorise-sign-off'
  | 'substitute-sign-off'
  | 'enable-step-level-reconfirmation'
  | 'unpark-without-clearance'

export interface B9MatrixRow extends FrontlineMatrixRow<B9RowId, B9Column> {
  /** The functionality clause that governs this row, verbatim. */
  readonly why: string
  /** That clause's own identifier and line. */
  readonly whyRef: string
}

/**
 * `AC-FL-009-5` (L39948) — the Tenant Admin device-session question, carried
 * as an open item and not resolved in either direction. Two of this matrix's
 * cells defer to it, both in the Tenant Admin column: L41623 and L41624, and
 * wave 0's `TENANT_ADMIN_OPEN_CELLS` lists exactly those two for this module.
 * This constant is the citation key, never a second answer.
 */
export const B9_TENANT_ADMIN_OPEN_DECISION = 'AC-FL-009-5'

const cell = (
  outcome: FrontlineMatrixCell['outcome'],
  note: string,
  openDecision: string | null = null,
): FrontlineMatrixCell => ({ outcome, note, openDecision })

const EP = (note = 'Explicitly prohibited'): FrontlineMatrixCell =>
  cell('explicitlyProhibited', note)

const CDR = (): FrontlineMatrixCell =>
  cell('clientDecisionRequired', 'Client Decision Required', B9_TENANT_ADMIN_OPEN_DECISION)

export const B9_MATRIX = [
  {
    id: 'be-blocked-at-gate',
    control: 'Be blocked at a qualification gate',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    cells: {
      WORKER: cell(
        'allowedWithConditions',
        'Allowed with conditions — under the strict posture, which is the platform default',
      ),
      SUPERVISOR: cell('notApplicable', 'Not applicable — no execution session'),
      QUALITY_MANAGER: cell('notApplicable', 'Not applicable — no execution session'),
      TENANT_ADMIN: cell('notApplicable', 'Not applicable'),
      READONLY_AUDITOR: cell('notApplicable', 'Not applicable — no execution session'),
    },
    why: 'Purpose: the one gate posture a tenant governs, a people-governance choice and never a safety one.',
    whyRef: 'FUNC-B9-01-2-1 · L41692',
    sourceRef: 'L41618',
  },
  {
    id: 'override-gate-on-device',
    control: 'Override a qualification gate on the device',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    cells: {
      WORKER: EP('Explicitly prohibited — there is no on-device worker override'),
      SUPERVISOR: EP('Explicitly prohibited on the device'),
      QUALITY_MANAGER: EP('Explicitly prohibited on the device'),
      TENANT_ADMIN: EP(),
      READONLY_AUDITOR: EP(),
    },
    why: 'Roles prohibited: every role, including Supervisor and Quality Manager present in person.',
    whyRef: 'FUNC-B9-01-1-1 · L41690',
    sourceRef: 'L41619',
  },
  {
    id: 'grant-clearance',
    control: 'Grant a qualification clearance',
    surface: 'another-surface',
    existence: 'present',
    metElsewhere: {
      where: 'another-surface',
      surface: 'SURF-CC',
      note: 'Client Command Center action 10, delivered on the command channel',
    },
    routedTo: {},
    cells: {
      WORKER: EP(),
      SUPERVISOR: cell(
        'allowed',
        'Allowed — Client Command Center action 10, delivered on the command channel',
      ),
      QUALITY_MANAGER: cell('allowed', 'Allowed — same'),
      TENANT_ADMIN: EP('Explicitly prohibited — not named in the action-10 authority'),
      READONLY_AUDITOR: EP(),
    },
    why: 'Roles allowed: Supervisor and above grant; the device applies.',
    whyRef: 'FUNC-B9-01-3-1 · L41695',
    sourceRef: 'L41620',
  },
  {
    id: 'set-enforcement-posture',
    control: 'Set the enforcement posture',
    surface: 'another-surface',
    existence: 'present',
    metElsewhere: {
      where: 'another-surface',
      surface: 'SURF-DOH',
      note: 'tenant-level setting in the Delivery Operations Hub; strict blocking is the default',
    },
    routedTo: {},
    cells: {
      WORKER: EP(),
      SUPERVISOR: EP(),
      QUALITY_MANAGER: EP(),
      TENANT_ADMIN: cell(
        'allowedWithConditions',
        'Allowed with conditions — tenant-level setting in the Delivery Operations Hub; strict blocking is the default',
      ),
      READONLY_AUDITOR: EP(),
    },
    why: 'Roles allowed: Tenant Admin sets it in the Delivery Operations Hub.',
    whyRef: 'FUNC-B9-01-2-1 · L41692',
    sourceRef: 'L41621',
  },
  {
    id: 'set-clearance-duration',
    control: 'Set the clearance duration',
    surface: 'screen',
    // NOT `present`, and NOT `another-surface`. See the file header: the
    // source names no surface for this act anywhere, and AC-SCOPE-040
    // (L2683) makes it certain the capability is on no screen of this
    // application for anyone. A stated line and no control is the only
    // rendering that neither draws a configuration control here nor invents
    // the surface the source withholds.
    existence: 'not-in-scope',
    metElsewhere: null,
    routedTo: {},
    cells: {
      WORKER: EP(),
      SUPERVISOR: EP(),
      QUALITY_MANAGER: EP(),
      TENANT_ADMIN: cell(
        'allowedWithConditions',
        'Allowed with conditions — uniform at tenant level, deliberately not per-user',
      ),
      READONLY_AUDITOR: EP(),
    },
    why: 'Roles allowed: Tenant Admin sets the duration. Roles prohibited: no per-user variation.',
    whyRef: 'FUNC-B9-01-3-2 · L41696',
    sourceRef: 'L41622',
  },
  {
    id: 'authorise-sign-off',
    control: 'Authorise a required supervisor sign-off',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    cells: {
      WORKER: EP(),
      SUPERVISOR: cell('allowed', 'Allowed — by second-identity step-up, after a forced sync'),
      QUALITY_MANAGER: cell('allowed', 'Allowed — same'),
      TENANT_ADMIN: CDR(),
      READONLY_AUDITOR: EP(),
    },
    why: 'Roles allowed: Supervisor, Quality Manager. Roles prohibited: Worker.',
    whyRef: 'FUNC-B9-03-1-1 · L41705',
    sourceRef: 'L41623',
  },
  {
    id: 'substitute-sign-off',
    control: 'Perform a substitute sign-off in place of an unavailable supervisor',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    cells: {
      WORKER: EP(),
      SUPERVISOR: cell(
        'notApplicable',
        'Not applicable — the Supervisor is the party being substituted for',
      ),
      QUALITY_MANAGER: cell(
        'allowedWithConditions',
        'Allowed with conditions — a higher authority may sign in their place, recorded in full and notified',
      ),
      TENANT_ADMIN: CDR(),
      READONLY_AUDITOR: EP(),
    },
    why: "Roles allowed: Quality Manager, under this chapter's reading.",
    whyRef: 'FUNC-B9-03-2-1 · L41708',
    sourceRef: 'L41624',
  },
  {
    id: 'enable-step-level-reconfirmation',
    control: 'Enable step-level identity re-confirmation',
    surface: 'another-surface',
    existence: 'present',
    metElsewhere: {
      where: 'another-surface',
      surface: 'SURF-STU',
      note: 'as a Studio authoring choice per screen with an authoring grant, off by default',
    },
    routedTo: {},
    cells: {
      WORKER: EP(),
      SUPERVISOR: EP(),
      QUALITY_MANAGER: cell(
        'allowedWithConditions',
        'Allowed with conditions — as a Studio authoring choice per screen with an authoring grant, off by default',
      ),
      TENANT_ADMIN: EP(),
      READONLY_AUDITOR: EP(),
    },
    why: 'Roles allowed: Worker re-confirms; an author with a grant enables it in the Standards and Operations Studio.',
    whyRef: 'FUNC-B9-04-1-1 · L41711',
    sourceRef: 'L41625',
  },
  {
    id: 'unpark-without-clearance',
    control: 'Unpark a Run without a clearance',
    surface: 'screen',
    existence: 'present',
    metElsewhere: null,
    routedTo: {},
    cells: {
      WORKER: EP(),
      SUPERVISOR: EP(),
      QUALITY_MANAGER: EP(),
      TENANT_ADMIN: EP(),
      READONLY_AUDITOR: EP(),
    },
    why: 'Roles prohibited: nobody may unpark without a clearance.',
    whyRef: 'FUNC-B9-02-1-1 · L41700',
    sourceRef: 'L41626',
  },
] as const satisfies readonly B9MatrixRow[]

type MissingFromMatrix = Exclude<B9RowId, (typeof B9_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

export function b9Row(id: B9RowId): B9MatrixRow {
  const found = B9_MATRIX.find((r) => r.id === id)
  if (found === undefined) throw new Error(`no MOD-FL-B9 matrix row: ${id}`)
  return found
}

/**
 * The shape the brief asserts, DERIVED here rather than quoted, so the
 * arithmetic is a check on the transcription instead of a restatement of it.
 * Nine rows over the nine data lines L41618-L41626, five columns, forty-five
 * cells. Wave 0's `FL_MATRIX_SHAPE` carries the same six numbers from an
 * independent reading of the same table, and the covering test holds them
 * equal and holds both against the frozen source parsed at run time.
 */
export const B9_SHAPE = {
  module: 'MOD-FL-B9',
  rows: B9_MATRIX.length,
  columns: B9_COLUMNS.length,
  cells: B9_MATRIX.length * B9_COLUMNS.length,
  headerLine: 41616,
  separatorLine: 41617,
  firstDataLine: 41618,
  lastDataLine: 41626,
} as const

/**
 * THE INVERSE TRAP, RECORDED AS DATA SO A LATER READER MEETS IT RATHER THAN
 * REDISCOVERING IT. Two of the six genuine non-Worker on-device controls on
 * this surface are this module's, and both are the sign-off.
 */
export const B9_GENUINE_NON_WORKER_CONTROLS = [
  {
    rowId: 'authorise-sign-off',
    columns: ['SUPERVISOR', 'QUALITY_MANAGER'],
    why: 'Both cells read a plain Allowed and the condition they state is the second-identity step-up after a forced sync — a condition naming an overlay of this surface, not a condition naming another surface. L41612 states the only way these two roles touch this device: through the step-up. FUNC-B9-03-1-1 (L41705) puts the sign-off on the worker’s own device without ending the worker’s session.',
    sourceRef: 'L41623',
  },
  {
    rowId: 'substitute-sign-off',
    columns: ['QUALITY_MANAGER'],
    why: 'The Quality Manager cell reads Allowed with conditions and states the condition in its own words — a higher authority may sign in their place, recorded in full and notified. The Supervisor cell beside it is Not applicable because the Supervisor is the party being substituted for, which is a statement about this act on this device rather than a pointer anywhere else.',
    sourceRef: 'L41624',
  },
] as const satisfies readonly {
  readonly rowId: B9RowId
  readonly columns: readonly B9Column[]
  readonly why: string
  readonly sourceRef: string
}[]

/**
 * The other four of the six, named so this module's record of the trap is the
 * whole trap and not just its own share of it. Not consumed here — they
 * belong to `MOD-FL-A1` and `MOD-FL-A3`, and `MOD-FL-A1`'s own matrix carries
 * the same list from the other end.
 */
export const B9_GENUINE_NON_WORKER_CONTROLS_ELSEWHERE = [
  {
    module: 'MOD-FL-A1',
    sourceRef: 'L40189',
    act: 'Authenticate by single sign-on federated to the tenant identity provider',
  },
  {
    module: 'MOD-FL-A1',
    sourceRef: 'L40190',
    act: 'Authenticate by platform-managed username and Personal Identification Number',
  },
  {
    module: 'MOD-FL-A1',
    sourceRef: 'L40192',
    act: 'Perform a second-identity step-up to authorise a sign-off or approval',
  },
  { module: 'MOD-FL-A3', sourceRef: 'L40534', act: 'Authorise an authored sign-off screen' },
] as const
