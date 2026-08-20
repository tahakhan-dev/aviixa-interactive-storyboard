import type {
  StudioMatrixCell,
  StudioMatrixRow,
  StudioPersonaColumn,
} from '@/studio/access/evaluate'
import type { StudioMatrixRowSurface } from '@/studio/modules'

/**
 * `MOD-STU-14`'s own permission matrix — the source's table at **L33820
 * (header), L33822-L33829, eight data rows**, transcribed cell by cell.
 *
 * ### R22'S NAMED TRAP — ROWS 2 AND 3, AND WHY THEY ARE NOT IN THE MATRIX
 *
 * Row 2, "Trigger a package build" (L33823), reads `Not applicable — the
 * build fires at run assignment in the Delivery Operations Hub` for the
 * Quality Manager, and **both Supervisor columns read `Allowed with
 * conditions`**. Row 3, "Perform an on-demand re-pull to a device" (L33824),
 * has the same shape with both Supervisor columns reading `Allowed`.
 *
 * **An implementer reading only the Allowed cells will put a Build button on
 * a Studio screen.** They are cross-surface statements: the conditions the
 * two Allowed cells state — "through run assignment in the Delivery
 * Operations Hub", "on-demand re-pull by the supervisor" — name the surface
 * the act happens on, and it is not this one. Slice 5 builds the definition,
 * the manifest and the pinning contract, and never fires a build.
 *
 * Two things follow, both the same ruling `MOD-STU-09` and `MOD-STU-12`
 * reached for their own cross-surface rows:
 *
 * - `StudioCellOutcome` deliberately cannot express `Not applicable`, so a
 *   persona column with no answer would be a blank cell, and a blank cell is
 *   a defect (L10238).
 * - Classified `screen`, those `Allowed` cells would derive Supervisor reach
 *   for a capability this surface **does not hold**, and the route would then
 *   be offered on the strength of an act performed somewhere else.
 *
 * Row 8, "Execute a package" (L33829), is the same shape one surface further
 * out: five `Not applicable` cells and a Worker cell reading `Allowed — on
 * the assigned device`. It is `SURF-FL`'s, entirely.
 *
 * All three live in `STU_14_CROSS_SURFACE` with their cells preserved
 * verbatim, and `STU_14_SOURCE_ROW_COUNT` is what keeps the two halves adding
 * up to the source's eight.
 *
 * ### ROW 1 IS THE SURFACE'S CATEGORICAL PROHIBITION
 *
 * "Define package contents" (L33822) is `Explicitly prohibited` in **every**
 * column, and the Quality Manager's cell states the reason: "the package
 * definition is platform-fixed from the published version". It is the only
 * row on this surface where the most privileged tenant role is categorically
 * prohibited from something with **no alternative holder anywhere** — no
 * Studio persona, no Hub persona, no platform console operator defines
 * package contents, because the definition is fixed by the platform from the
 * published version. That is an **ABSENCE**, not a disabled control: a
 * disabled control implies a condition that could become true, and none can.
 *
 * ### `routedTo` IS `null` ON EVERY CELL, AND IT IS WRITTEN DOWN
 *
 * Task 11's mechanism, surface-wide: a cell renders **disabled** only where
 * its `routedTo` names a capability the persona actually holds **on this
 * surface**, and a capability nobody holds renders **absent**. No cell of
 * this card names one. Rows 2 and 3 have an alternative and it is on ANOTHER
 * SURFACE — pointing `routedTo` at it is exactly how a disabled Studio
 * control gets justified by a Hub permission — so the map is present, total,
 * and null throughout, and the covering test asserts that rather than
 * assuming it.
 *
 * ### THE CARD HEADS SIX COLUMNS; THE VOCABULARY HAS EIGHT
 *
 * L33820's header is `Quality Manager | Supervisor with grant | Supervisor
 * without grant | Tenant Admin | Read-only Auditor | Worker`. Neither the
 * Plant Manager persona nor `GRANT-STU-IMPL` appears on it.
 *
 * - `plant-manager-persona` mirrors `supervisor-without-grant` and says so —
 *   `DEC-ROLE-001` (L34522) delivers this persona's Studio access "by a
 *   Supervisor role without the authoring grant".
 * - `implementation-team` is filled from the CONSOLIDATED matrix row that
 *   states the same capability, with the row named in the note, never
 *   guessed.
 */

/** The source table's own data-row count, L33822-L33829. */
export const STU_14_SOURCE_ROW_COUNT = 8

export type Stu14RowId =
  | 'define-package-contents'
  | 'swap-the-package-of-an-in-flight-run'
  | 'include-training-library-content-in-a-package'
  | 'exclude-a-severity-mapping-from-a-package'
  | 'view-which-package-version-a-run-is-pinned-to'

export const STU_14_ROW_IDS = [
  'define-package-contents',
  'swap-the-package-of-an-in-flight-run',
  'include-training-library-content-in-a-package',
  'exclude-a-severity-mapping-from-a-package',
  'view-which-package-version-a-run-is-pinned-to',
] as const satisfies readonly Stu14RowId[]

type MissingFromRowIds = Exclude<Stu14RowId, (typeof STU_14_ROW_IDS)[number]>
const _rowIdsExhaustive: MissingFromRowIds extends never ? true : never = true
void _rowIdsExhaustive

export interface StudioPackageMatrixRow extends StudioMatrixRow {
  readonly id: Stu14RowId
  /** Read by `reachByStudioMatrix`'s clause one. All five are screen rows. */
  readonly surface: StudioMatrixRowSurface
  /** Task 11's mechanism. Null on every cell of this card — see the header. */
  readonly routedTo: Readonly<Record<StudioPersonaColumn, Stu14RowId | null>>
}

function cell(
  outcome: StudioMatrixCell['outcome'],
  note: string,
  openDecision: string | null = null,
): StudioMatrixCell {
  return { outcome, note, openDecision, requiredTiers: null, requiredGrant: null }
}

const PROHIBITED = cell('explicitlyProhibited', 'Explicitly prohibited')
const ALLOWED = cell('allowed', 'Allowed')
const READ_ONLY = cell('readOnly', 'Read-only')
const AUDITOR_OPEN = cell(
  'clientDecisionRequired',
  'Client Decision Required — DEC-AUDSTU-001',
  'DEC-AUDSTU-001',
)

/**
 * The consolidated-matrix row each `implementation-team` cell was read from.
 * Written down rather than inferred, because "the implementation team's cell
 * came from somewhere" and "somebody guessed it" read identically otherwise.
 */
const IMPL_SOURCE = {
  reading: 'L34542, “Read published Workflow content” — Allowed with conditions',
  authoring: 'L34545, “Author all nine configuration sections” — Allowed with conditions',
} as const

const IMPL_READING = cell(
  'allowedWithConditions',
  `Allowed with conditions — onboarding only. This card heads no implementation-team column; filled from the consolidated matrix (${IMPL_SOURCE.reading})`,
)

/** Nobody is routed anywhere on this card. Total, and asserted. */
const ROUTES_NOWHERE: Readonly<Record<StudioPersonaColumn, Stu14RowId | null>> = {
  'quality-manager': null,
  'supervisor-with-authoring-grant': null,
  'supervisor-without-grant': null,
  'plant-manager-persona': null,
  'tenant-admin': null,
  'read-only-auditor': null,
  worker: null,
  'implementation-team': null,
}

/**
 * The Plant Manager persona reads the `supervisor-without-grant` cell and
 * says so in its own note rather than being silently aliased.
 */
function withPlantManager(
  cells: Omit<Record<StudioPersonaColumn, StudioMatrixCell>, 'plant-manager-persona'>,
): Record<StudioPersonaColumn, StudioMatrixCell> {
  const mirrored = cells['supervisor-without-grant']
  return {
    ...cells,
    'plant-manager-persona': {
      ...mirrored,
      note:
        `${mirrored.note} — this module’s own table (L33820) heads no Plant Manager column; ` +
        'DEC-ROLE-001 (L34522) delivers this persona’s Studio access through a Supervisor role ' +
        'without the authoring grant.',
    },
  }
}

/**
 * Rows 1, 4, 5, 6 and 7 of L33822-L33829, in source order. Rows 2, 3 and 8
 * are cross-surface and are below.
 */
export const STU_14_MATRIX = [
  {
    id: 'define-package-contents',
    capability: 'Define package contents',
    surface: 'screen',
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L33822', 'FUNC-STU-14-01-A-1 L33845', 'L33814'],
    routedTo: ROUTES_NOWHERE,
    cells: withPlantManager({
      // THE ROW. The most privileged tenant role on the surface, categorically
      // prohibited, with no alternative holder anywhere — the package
      // definition is platform-fixed from the published version.
      'quality-manager': cell(
        'explicitlyProhibited',
        'Explicitly prohibited — the package definition is platform-fixed from the published version',
      ),
      'supervisor-with-authoring-grant': PROHIBITED,
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      // FUNC-STU-14-01-A-1 to A-4 (L33845-L33848) each read "Roles allowed:
      // system function" with the prohibition stated as a RULE — "no role may
      // remove screen content", "no role may exclude them". A rule, not a
      // list, so the two columns the card does not head follow from it.
      'implementation-team': cell(
        'explicitlyProhibited',
        'Explicitly prohibited — every content function of this card reads “Roles allowed: system function”, and the prohibitions are stated as rules covering no role rather than as column lists (FUNC-STU-14-01-A-1 to A-4, L33845-L33848)',
      ),
    }),
  },
  {
    id: 'swap-the-package-of-an-in-flight-run',
    capability: 'Swap the package of an in-flight Run',
    surface: 'screen',
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L33825', 'FUNC-STU-14-02-B-1 L33858', 'AC-STU-125 L33946'],
    routedTo: ROUTES_NOWHERE,
    cells: withPlantManager({
      'quality-manager': PROHIBITED,
      'supervisor-with-authoring-grant': PROHIBITED,
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      // FUNC-STU-14-02-B-1 (L33858): "Roles prohibited: every role and every
      // agent from swapping it." Every role — so the eighth column too.
      'implementation-team': cell(
        'explicitlyProhibited',
        'Explicitly prohibited — “every role and every agent from swapping it” (FUNC-STU-14-02-B-1, L33858)',
      ),
    }),
  },
  {
    id: 'include-training-library-content-in-a-package',
    capability: 'Include Training Library content in a package',
    surface: 'screen',
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L33826', 'FUNC-STU-14-01-C-1 L33852', 'L33799', 'AC-STU-080 L32922'],
    routedTo: ROUTES_NOWHERE,
    cells: withPlantManager({
      'quality-manager': PROHIBITED,
      'supervisor-with-authoring-grant': PROHIBITED,
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      // FUNC-STU-14-01-C-1 (L33852): "Roles prohibited: every role from
      // including them."
      'implementation-team': cell(
        'explicitlyProhibited',
        'Explicitly prohibited — “every role from including them” (FUNC-STU-14-01-C-1, L33852)',
      ),
    }),
  },
  {
    id: 'exclude-a-severity-mapping-from-a-package',
    capability: 'Exclude a severity mapping from a package',
    surface: 'screen',
    isPublishedRead: false,
    stage: null,
    sourceRefs: ['L33827', 'FUNC-STU-14-01-A-3 L33847', 'TEST-STU-126 L33955'],
    routedTo: ROUTES_NOWHERE,
    cells: withPlantManager({
      'quality-manager': PROHIBITED,
      'supervisor-with-authoring-grant': PROHIBITED,
      'supervisor-without-grant': PROHIBITED,
      'tenant-admin': PROHIBITED,
      'read-only-auditor': PROHIBITED,
      worker: PROHIBITED,
      // FUNC-STU-14-01-A-3 (L33847): "Roles prohibited: no role may exclude
      // them", with the reason stated — "a package without severity mappings
      // could omit a hold".
      'implementation-team': cell(
        'explicitlyProhibited',
        'Explicitly prohibited — “no role may exclude them”, because a package without severity mappings could omit a hold (FUNC-STU-14-01-A-3, L33847)',
      ),
    }),
  },
  {
    id: 'view-which-package-version-a-run-is-pinned-to',
    capability: 'View which package version a Run is pinned to',
    surface: 'screen',
    // The read this whole screen IS. L34605's fail-closed floor keeps
    // published read open when the identity layer is unreachable, and the
    // pinned version is a fact about published content.
    isPublishedRead: true,
    stage: null,
    sourceRefs: ['L33828', 'SB-STU-17 L33905', 'AC-STU-150 L34667', 'L34542'],
    routedTo: ROUTES_NOWHERE,
    cells: withPlantManager({
      'quality-manager': ALLOWED,
      'supervisor-with-authoring-grant': ALLOWED,
      'supervisor-without-grant': READ_ONLY,
      'tenant-admin': READ_ONLY,
      'read-only-auditor': AUDITOR_OPEN,
      // The card's own cell reads "Allowed with conditions — the worker sees
      // the version on their own Run" (L33828), which is a FRONTLINE
      // consequence read from the package on the device. AC-STU-150 (L34667)
      // is "A Worker cannot reach any Studio route by any means", and
      // STU_PERSONAS already carries `studioAccess:
      // 'explicitly-prohibited'`. Both are true of different surfaces, so
      // this cell answers for SURF-STU and the card's sentence is preserved
      // verbatim in STU_14_CROSS_SURFACE below. Neither is dropped.
      worker: cell(
        'explicitlyProhibited',
        'Explicitly prohibited on SURF-STU — AC-STU-150 (L34667): “A Worker cannot reach any Studio route by any means.” The card’s own cell, “Allowed with conditions — the worker sees the version on their own Run” (L33828), is a Frontline consequence read from the package on the device and is carried verbatim in STU_14_CROSS_SURFACE',
      ),
      'implementation-team': IMPL_READING,
    }),
  },
] as const satisfies readonly StudioPackageMatrixRow[]

type MissingFromMatrix = Exclude<Stu14RowId, (typeof STU_14_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

/**
 * One row of the five. Throws on an unknown id rather than returning
 * `undefined`: every caller passes a literal `Stu14RowId`, so an unknown one
 * is a defect and not a state to render.
 */
export function stu14Row(id: Stu14RowId): StudioPackageMatrixRow {
  const found = STU_14_MATRIX.find((row) => row.id === id)
  if (found === undefined) {
    throw new Error(`MOD-STU-14: no matrix row is transcribed for "${id}".`)
  }
  return found
}

/* ==================================================================== *
 * THE CROSS-SURFACE STATEMENTS — never Studio controls (R22).
 * ==================================================================== */

export type Stu14CrossSurfaceId =
  | 'trigger-a-package-build'
  | 'perform-an-on-demand-re-pull-to-a-device'
  | 'execute-a-package'

export interface StudioPackageCrossSurfaceRow {
  readonly id: Stu14CrossSurfaceId
  readonly capability: string
  /**
   * The surface that actually holds the control. Deliberately NOT named
   * `surface`: `scripts/build-stu-module-reach.mjs` finds a module's matrix
   * by looking for the one exported array whose every row carries `surface`,
   * and a second such array in this file would make it read neither.
   */
  readonly heldOn: 'SURF-DOH' | 'SURF-FL'
  readonly owner: string
  /** The source cells, verbatim, in the card's own header order. */
  readonly cells: readonly { readonly column: string; readonly text: string }[]
  /** The one sentence a Studio screen renders in place of a control. */
  readonly statement: string
  readonly sourceRefs: readonly string[]
}

export const STU_14_CROSS_SURFACE = [
  {
    id: 'trigger-a-package-build',
    capability: 'Trigger a package build',
    heldOn: 'SURF-DOH',
    owner: 'MOD-DOH-06, run assignment in the Delivery Operations Hub — slice 6',
    cells: [
      {
        column: 'Quality Manager',
        text: 'Not applicable — the build fires at run assignment in the Delivery Operations Hub',
      },
      {
        column: 'Supervisor with grant',
        text: 'Allowed with conditions — through run assignment in the Delivery Operations Hub',
      },
      { column: 'Supervisor without grant', text: 'Allowed with conditions — same' },
      { column: 'Tenant Admin', text: 'Explicitly prohibited' },
      { column: 'Read-only Auditor', text: 'Explicitly prohibited' },
      { column: 'Worker', text: 'Explicitly prohibited' },
    ],
    statement:
      'No Studio route fires a package build, for any persona, in any state. The build fires at ' +
      'run assignment in the Delivery Operations Hub. Both Supervisor cells read Allowed with ' +
      'conditions, and the condition each states — “through run assignment in the Delivery ' +
      'Operations Hub” — names the surface the act happens on. Slice 5 builds the definition, ' +
      'the manifest and the pinning contract; it never fires a build.',
    sourceRefs: ['L33823', 'FUNC-STU-14-02-A-1 L33855', 'seam package-build-trigger-and-pin'],
  },
  {
    id: 'perform-an-on-demand-re-pull-to-a-device',
    capability: 'Perform an on-demand re-pull to a device',
    heldOn: 'SURF-DOH',
    owner:
      'The supervisor, on the Delivery Operations Hub — the stated remedy when delivery failed or the device changed',
    cells: [
      {
        column: 'Quality Manager',
        text: 'Not applicable — re-pull is a supervisor action',
      },
      {
        column: 'Supervisor with grant',
        text: 'Allowed — on-demand re-pull by the supervisor',
      },
      { column: 'Supervisor without grant', text: 'Allowed — same' },
      { column: 'Tenant Admin', text: 'Explicitly prohibited' },
      { column: 'Read-only Auditor', text: 'Explicitly prohibited' },
      { column: 'Worker', text: 'Explicitly prohibited' },
    ],
    statement:
      'A re-pull to a device is a supervisor action taken on the Delivery Operations Hub against ' +
      'a device this surface does not address. No Studio control performs one, and the Quality ' +
      'Manager’s own cell says why: re-pull is a supervisor action.',
    sourceRefs: ['L33824', 'FUNC-STU-14-02-A-2 L33856', 'seam package-delivery-on-device'],
  },
  {
    id: 'execute-a-package',
    capability: 'Execute a package',
    heldOn: 'SURF-FL',
    owner: 'The Frontline Worker Application, on the assigned device — slices 7 and 8',
    cells: [
      { column: 'Quality Manager', text: 'Not applicable — execution is a Frontline action' },
      { column: 'Supervisor with grant', text: 'Not applicable — same reason' },
      { column: 'Supervisor without grant', text: 'Not applicable — same reason' },
      { column: 'Tenant Admin', text: 'Not applicable — same reason' },
      { column: 'Read-only Auditor', text: 'Not applicable — same reason' },
      { column: 'Worker', text: 'Allowed — on the assigned device' },
    ],
    statement:
      'Execution is a Frontline action on the assigned device. The Worker’s cell on row 7 — ' +
      '“Allowed with conditions — the worker sees the version on their own Run” — is the same ' +
      'statement one column over: a Worker meets this package on the device, never in the Studio ' +
      '(AC-STU-150, L34667).',
    sourceRefs: ['L33829', 'L33828', 'AC-STU-150 L34667'],
  },
] as const satisfies readonly StudioPackageCrossSurfaceRow[]

type MissingFromCrossSurface = Exclude<
  Stu14CrossSurfaceId,
  (typeof STU_14_CROSS_SURFACE)[number]['id']
>
const _crossSurfaceExhaustive: MissingFromCrossSurface extends never ? true : never = true
void _crossSurfaceExhaustive
