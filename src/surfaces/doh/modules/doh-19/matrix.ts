import type { SurfaceId } from '@/domain/surfaces'
import type { TenantRoleId } from '../../../../../app/hub/HubShell'
import type { DohControlMatrixRow } from '@/surfaces/doh/modules'
import type { DohBoundaryId } from '@/surfaces/doh/boundary'
import type { WriteAction } from '@/surfaces/doh/tenant-state'

/**
 * MOD-DOH-19 — Parts Registry, §19.21. Screen `SCR-DOH-06` at
 * `/hub/parts-registry`; catalogue B row L48100.
 *
 * ── THE SPANS, RE-MEASURED RATHER THAN QUOTED ─────────────────────────────
 * Identity card: header L30049, separator L30050, **14 data rows**
 * L30051-L30064. Control matrix: header L30068, separator L30069, **8 data
 * rows** L30070-L30077. Counted off the frozen source line by line. The plan
 * spans start on the table header, so a span quoted as n rows encloses n+2;
 * the plan's "8 data rows" for the matrix is CORRECT under that correction,
 * and so is its card span.
 *
 * ── WHAT THIS MODULE IS ABOUT ─────────────────────────────────────────────
 * The registry is Hub-owned tenant master data with ONE authoring seam into
 * the Standards and Operations Studio. Seam map row 11 (L13229) resolves the
 * seam and the supporting table at L13312 rules on it:
 * "a second entry point is not a second owner". L13262 states the same:
 * "Hub master data, with a Studio inline-add seam."
 *
 * Everything below exists to keep that ruling true on screen. The failure it
 * prevents is not a missing button — it is a SECOND OWNER of one record,
 * which is `FB-OWN-002`'s "the classic way a second system of record is born
 * accidentally" (L13319).
 *
 * ── THE ROW ORDINALS ──────────────────────────────────────────────────────
 * Counted from L30070 as row 1. Row 2 is the inline-add seam (L30071) and
 * row 6 is the floor row (L30075); the two are NOT the same case, which is
 * finding 2 below.
 */

export type Doh19ControlId =
  | 'bulk-upload-parts-by-csv'
  | 'add-a-part-inline-during-authoring'
  | 'edit-a-part-record'
  | 'archive-a-part'
  | 'view-the-registry'
  | 'type-a-part-number-on-the-floor'
  | 'create-a-bom-recipe-sku-or-routing-entity'
  | 'set-ingestion-limits-or-storage-metering'

/**
 * WHERE AN ADJACENT ROW'S ACT IS PERFORMED, AND WHO OWNS THE RECORD IT
 * TOUCHES — two questions, because on this card they have different answers
 * and that difference is the whole module.
 *
 * The §19.1.2 boundary register (`@/surfaces/doh/boundary`) can only express
 * ONE of them. Every one of its eight rows is a capability the Hub "feeds and
 * does not own", so `DohBoundaryRow.owningSurface` answers both questions at
 * once with the same surface. Row 2 is the shape it cannot hold: the act is
 * performed on `SURF-STU` and the record is owned HERE. Binding row 2 to the
 * register's `workflow-and-instruction-authoring` row would print that row's
 * contribution cell — "Holds the Job-to-workflow reference and the adoption
 * decision routing to the Job Owner" — under a statement about parts, which
 * is both wrong copy and, worse, an assertion that the Studio owns the part
 * record. That is exactly the second owner L13312 forbids.
 *
 * So `ownedHere` is a field and not an inference, and neither adjacent row
 * carries a `boundary`. See `DOH_19_REGISTER_GAP`.
 */
export interface Doh19MetElsewhere {
  /** The surface the act is actually performed on. */
  readonly surface: SurfaceId
  /**
   * `true` where this surface still owns the RECORD the act writes. Row 2
   * only. Row 8's limits belong to the platform console outright.
   */
  readonly ownedHere: boolean
  /** The module's own words for the split, printed beside the statement. */
  readonly note: string
}

export interface Doh19Row extends DohControlMatrixRow<Doh19ControlId> {
  /**
   * Non-null on exactly the rows classified `another-surface`, null on the
   * six this screen owns. `doh19ClassificationAgrees` proves the two agree
   * rather than trusting them to; a row classified adjacent with no `metOn`
   * has nowhere to send a reader and would render a statement naming no place.
   */
  readonly metElsewhere: Doh19MetElsewhere | null
  /**
   * The suspension write class this row's act belongs to, or `null` where the
   * source states no tenant-state condition for it.
   *
   * ONLY ROW 1 CARRIES ONE, and that is a transcription and not a judgement:
   * L30070 says the bulk upload is "blocked in every suspension state as
   * new-part creation; subject to platform ingestion limits", and `create-part`
   * is already a `WriteAction` in `@/surfaces/doh/tenant-state` — named at
   * L26919 in "creation of new Jobs, new Workers, new locations, new shifts,
   * new parts". Rows 3 and 4 are writes too and the source gates NEITHER; see
   * `UNSPECIFIED_IN_SOURCE` entry 1 rather than a gate invented here.
   */
  readonly writeAction: WriteAction | null
  /**
   * Never set on this card. Declared so the shared
   * `inlineControlsOnAdjacentCapabilities` gate can read the field on these
   * rows like any other, and so the reason it is always absent is written
   * where a reader looking for a pointer will find it.
   */
  readonly boundary?: DohBoundaryId
}

const ALL: <T>(v: T) => Readonly<Record<TenantRoleId, T>> = (v) => ({
  TENANT_ADMIN: v,
  SUPERVISOR: v,
  QUALITY_MANAGER: v,
  READONLY_AUDITOR: v,
  WORKER: v,
})

/**
 * L30071 and L30075 both spell the four non-admin cells `Not applicable —
 * same reason`, which is a pointer at the first cell and not a statement a
 * screen can print on its own. The reason is carried into every column here,
 * because a cell that renders "same reason" beside no reason is the blank
 * cell L10238 forbids.
 */
const SAME_REASON = (first: string, rest: string): Readonly<Record<TenantRoleId, string>> => ({
  TENANT_ADMIN: first,
  SUPERVISOR: rest,
  QUALITY_MANAGER: rest,
  READONLY_AUDITOR: rest,
  WORKER: rest,
})

const INLINE_ADD_REASON =
  'Not applicable. The inline-add seam is a Standards and Operations Studio authoring act under Studio permissions, so no column of this table grants it and no control for it renders here.'

const FLOOR_REASON =
  'Not applicable. Consumption is referenced through the work-instruction step, so the step already knows the part and nobody types a part number on the floor. There is no such act on any surface for a cell to grant.'

export const CONTROL_MATRIX = [
  {
    id: 'bulk-upload-parts-by-csv',
    control: 'Bulk-upload parts by comma-separated values',
    surface: 'screen',
    metElsewhere: null,
    writeAction: 'create-part',
    status: {
      TENANT_ADMIN: 'allowed-with-conditions',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN:
        'Allowed with conditions: blocked in every suspension state as new-part creation, and subject to the platform ingestion limits set from the Super Admin platform console.',
      SUPERVISOR:
        'Explicitly prohibited. Registry writes are Tenant Admin acts (L30063); this role holds no bulk-upload path here or anywhere.',
      QUALITY_MANAGER:
        'Explicitly prohibited. Registry writes are Tenant Admin acts (L30063); this role holds no bulk-upload path here or anywhere.',
      READONLY_AUDITOR:
        'Explicitly prohibited. Registry writes are Tenant Admin acts (L30063); this role holds no bulk-upload path here or anywhere.',
      WORKER:
        'Explicitly prohibited. Registry writes are Tenant Admin acts (L30063); this role holds no bulk-upload path here or anywhere.',
    },
    rendering:
      'A control for the Tenant Admin while the tenant state permits new-part creation, and the stated line in its place while it does not. Never a disabled control.',
    effect: 'Parts are imported whole or the file is rejected with a per-row error report.',
    sourceRef: 'L30070',
  },
  {
    id: 'add-a-part-inline-during-authoring',
    control: 'Add a part inline during authoring',
    surface: 'another-surface',
    metElsewhere: {
      surface: 'SURF-STU',
      ownedHere: true,
      note:
        'The act happens in the Standards and Operations Studio; the record it creates is this registry’s. Seam map row 11 rules on exactly this: "a second entry point is not a second owner" (L13312).',
    },
    writeAction: null,
    status: ALL('not-applicable'),
    detail: SAME_REASON(INLINE_ADD_REASON, INLINE_ADD_REASON),
    rendering:
      'A cross-surface statement naming the Studio as the place and this surface as the owner, with a link where the viewer’s role actually opens the Studio. Never a control, never a disabled control.',
    effect:
      'The Studio creates a skeletal record through a name-only mini-form and the platform mints the identifier; completion happens here.',
    sourceRef: 'L30071',
  },
  {
    id: 'edit-a-part-record',
    control: 'Edit a part record',
    surface: 'screen',
    metElsewhere: null,
    writeAction: null,
    status: {
      TENANT_ADMIN: 'allowed',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN:
        'Allowed. The source states the bare token and attaches no condition — no suspension clause, no limit — so none is invented here; the silence is recorded in UNSPECIFIED_IN_SOURCE.',
      SUPERVISOR:
        'Explicitly prohibited. The source states the bare token for this role on this row and qualifies it nowhere; the silence is recorded in UNSPECIFIED_IN_SOURCE rather than filled in here.',
      QUALITY_MANAGER:
        'Explicitly prohibited. The source states the bare token for this role on this row and qualifies it nowhere; the silence is recorded in UNSPECIFIED_IN_SOURCE rather than filled in here.',
      READONLY_AUDITOR:
        'Explicitly prohibited. The source states the bare token for this role on this row and qualifies it nowhere; the silence is recorded in UNSPECIFIED_IN_SOURCE rather than filled in here.',
      WORKER:
        'Explicitly prohibited. The source states the bare token for this role on this row and qualifies it nowhere; the silence is recorded in UNSPECIFIED_IN_SOURCE rather than filled in here.',
    },
    rendering: 'A control for the Tenant Admin; the stated refusal in its place for the other four.',
    effect: 'The part record changes. The platform-minted identifier never does.',
    sourceRef: 'L30072',
  },
  {
    id: 'archive-a-part',
    control: 'Archive a part',
    surface: 'screen',
    metElsewhere: null,
    writeAction: null,
    status: {
      TENANT_ADMIN: 'allowed-with-conditions',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN:
        'Allowed with conditions, and the condition is a CONSEQUENCE rather than a gate: referencing work instructions keep their reference, and the archived part is not offered for new references. Nothing about the actor or the tenant state narrows this act.',
      SUPERVISOR:
        'Explicitly prohibited. The source states the bare token for this role on this row and qualifies it nowhere; the silence is recorded in UNSPECIFIED_IN_SOURCE rather than filled in here.',
      QUALITY_MANAGER:
        'Explicitly prohibited. The source states the bare token for this role on this row and qualifies it nowhere; the silence is recorded in UNSPECIFIED_IN_SOURCE rather than filled in here.',
      READONLY_AUDITOR:
        'Explicitly prohibited. The source states the bare token for this role on this row and qualifies it nowhere; the silence is recorded in UNSPECIFIED_IN_SOURCE rather than filled in here.',
      WORKER:
        'Explicitly prohibited. The source states the bare token for this role on this row and qualifies it nowhere; the silence is recorded in UNSPECIFIED_IN_SOURCE rather than filled in here.',
    },
    rendering:
      'A control for the Tenant Admin, with the consequence printed beside it rather than as a precondition on it.',
    effect: 'The part moves to `archived`. Existing references survive; new references are not offered it.',
    sourceRef: 'L30073',
  },
  {
    id: 'view-the-registry',
    control: 'View the registry',
    surface: 'screen',
    metElsewhere: null,
    writeAction: null,
    status: {
      TENANT_ADMIN: 'allowed',
      SUPERVISOR: 'read-only',
      QUALITY_MANAGER: 'read-only',
      READONLY_AUDITOR: 'read-only',
      WORKER: 'unavailable',
    },
    detail: {
      TENANT_ADMIN: 'Allowed. The registry list renders with this role’s write controls beside it.',
      SUPERVISOR: 'Read-only. The registry list renders and carries no write path.',
      QUALITY_MANAGER: 'Read-only. The registry list renders and carries no write path.',
      READONLY_AUDITOR: 'Read-only. The registry list renders and carries no write path.',
      WORKER:
        'Unavailable. No standing on this module in any scope, so the rail does not offer the route and a deep link meets STATE-05 — which is a different statement from a prohibition this role could read on the screen (L10238).',
    },
    rendering:
      'The registry table, with write controls only where another row grants one. `Unavailable` withholds the route itself.',
    effect: 'The tenant’s part master data is legible to four of the five roles.',
    sourceRef: 'L30074',
  },
  {
    id: 'type-a-part-number-on-the-floor',
    control: 'Type a part number on the floor',
    surface: 'screen',
    metElsewhere: null,
    writeAction: null,
    status: ALL('not-applicable'),
    detail: SAME_REASON(FLOOR_REASON, FLOOR_REASON),
    rendering:
      'No control and the stated line in its place, for every role. No link and no pointer: there is no surface to send anyone to.',
    effect:
      'None. The row records a design rule — L30045: "Identification is entirely optional per client and per part: track as much as possible, force nothing." — rather than an act anyone performs.',
    sourceRef: 'L30075',
  },
  {
    id: 'create-a-bom-recipe-sku-or-routing-entity',
    control: 'Create a bill of materials, recipe, stock-keeping unit or routing entity',
    surface: 'screen',
    metElsewhere: null,
    writeAction: null,
    status: ALL('explicitly-prohibited'),
    detail: SAME_REASON(
      'Explicitly prohibited: these four are deliberately not first-class platform entities. A bill-of-materials-shaped need is met by Data Capture entries inside workflow steps, which is a Studio configuration and a Frontline capture, not a registry row — L30043: "it does not become the system that defines product structure".',
      'Explicitly prohibited: these four are deliberately not first-class platform entities. The prohibition is universal on this row, so no column carries an alternative and none is pointed at.',
    ),
    rendering: 'No control for any role, and the reason in its place. No pointer: the alternative is not a row of this table.',
    effect: 'None. The platform records what execution touched and consumed and does not define product structure.',
    sourceRef: 'L30076',
  },
  {
    id: 'set-ingestion-limits-or-storage-metering',
    control: 'Set ingestion limits or storage metering',
    surface: 'another-surface',
    metElsewhere: {
      surface: 'SURF-SA',
      ownedHere: false,
      note:
        'Owned there outright, unlike row 2. L30041: "Registry ingestion limits and storage metering are governed from the Super Admin platform console."',
    },
    writeAction: null,
    status: ALL('explicitly-prohibited'),
    detail: SAME_REASON(
      'Explicitly prohibited here: ingestion limits and storage metering are governed from the Super Admin platform console and are not tenant-editable (L30063). Row 1’s upload is subject to whatever they are set to.',
      'Explicitly prohibited here: ingestion limits and storage metering are governed from the Super Admin platform console and are not tenant-editable (L30063).',
    ),
    rendering:
      'A cross-surface statement naming the platform console, and never a link: no tenant role opens `SURF-SA`, which "has no tenant-visible interface" (L25707).',
    effect: 'The limits the tenant’s uploads are measured against are set elsewhere and read here.',
    sourceRef: 'L30077',
  },
] as const satisfies readonly Doh19Row[]

/** The source's own row count, so a dropped row cannot pass as a full transcription. */
export const DOH_19_SOURCE_ROW_COUNT = 8

const BY_ID = new Map<Doh19ControlId, Doh19Row>(CONTROL_MATRIX.map((r) => [r.id, r]))

export function doh19Row(id: Doh19ControlId): Doh19Row {
  const found = BY_ID.get(id)
  if (!found) throw new Error(`MOD-DOH-19: no matrix row is transcribed for "${id}".`)
  return found
}

/**
 * `surface` and `metElsewhere` answer the same question and must agree. Split
 * across two fields because the shared row shape owns `surface` and only this
 * card needs the destination; exported so the unit suite proves the agreement
 * instead of assuming it. Empty is the only healthy answer.
 */
export function doh19ClassificationDisagreements(): readonly string[] {
  return CONTROL_MATRIX.filter(
    (r) => (r.surface === 'another-surface') !== (r.metElsewhere !== null),
  ).map((r) => `${r.id}: surface \`${r.surface}\` with metElsewhere ${r.metElsewhere ? 'set' : 'null'}`)
}

/* ==================================================================== *
 * FINDINGS — the traps this card holds, including the ones the plan did
 * not list. Rendered on screen rather than kept in a comment.
 * ==================================================================== */

export interface Doh19Finding {
  readonly id: string
  readonly title: string
  readonly what: string
  readonly why: string
  readonly sourceRef: string
}

export const DOH_19_FINDINGS = [
  {
    id: 'C2-inline-add-is-a-studio-act',
    title: 'Row 2 is `Not applicable` in all five columns because the act is a Studio act',
    what:
      'Every cell of L30071 refuses, and not because the capability is withheld from anyone. The inline-add seam is performed in the Standards and Operations Studio under Studio permissions, so no column of a Hub table can grant it. The card says so twice — L30055: "the inline-add seam lives in Standards and Operations Studio authoring"; L30063: "the inline-add seam is an authoring act in the Studio under its own permissions".',
    why:
      'The record it writes is still this registry’s. Rendering a control, or a disabled control, would make this surface a second writer of a record it already owns from a second entry point. L13312 rules: "a second entry point is not a second owner".',
    sourceRef: 'L30071, L30055, L30063, L13229, L13262, L13312',
  },
  {
    id: 'row-6-is-not-row-2',
    title: 'A SECOND all-`Not applicable` row, and it is a different case',
    what:
      'Row 6 (L30075) refuses in all five columns exactly as row 2 does. The plan lists one such row. There are two, and grouping them costs the classification: row 2’s act is met on `SURF-STU`, row 6’s act is met NOWHERE. L30075’s own reason is that "consumption is referenced through the work-instruction step; nobody types part numbers on the floor".',
    why:
      '`@/surfaces/doh/modules` reserves `another-surface` for a capability somebody holds: "A capability that exists NOWHERE is a `screen` row whose every cell refuses." So row 2 is `another-surface` and row 6 is `screen`, from identical tokens. A row 6 classified adjacent would render a cross-surface statement pointing at a surface where the act does not happen either.',
    sourceRef: 'L30075, L30071, L30045',
  },
  {
    id: 'row-6-is-a-restatement',
    title: 'Row 6 states a design rule, not an act anyone requested',
    what:
      'Nobody has ever asked to type a part number; the row exists to record that the platform closed the possibility. It is a prohibition-shaped restatement of L30045 sitting in a table of acts.',
    why:
      'It must still render — it is in the matrix — but it can never acquire a control, a link or a routing pointer, and a reader who treats "there must be somewhere this happens" as universal will invent one.',
    sourceRef: 'L30075, L30045',
  },
  {
    id: 'row-1-permissive-token-hides-a-total-block',
    title: 'Row 1’s `Allowed with conditions` is a full prohibition under every suspension state',
    what:
      'L30070 reads "blocked in every suspension state as new-part creation; subject to platform ingestion limits" — two conditions in one cell, and the first closes the act completely in four of the five tenant states.',
    why:
      'A screen that folds `allowed-with-conditions` into an enabled button ships a bulk-upload control that is live during suspension. The gate is `writeAllowed(state, "create-part")` in `@/surfaces/doh/tenant-state`, which already carries this class from L26919 — it is read, not re-derived.',
    sourceRef: 'L30070, L30056, L26919',
  },
  {
    id: 'row-4-condition-is-not-a-gate',
    title: 'Row 4’s condition is a consequence, and row 1’s is a gate — same token, opposite kind',
    what:
      'L30073 qualifies `Allowed with conditions` with "referencing work instructions keep their reference; the archived part is not offered for new references". Neither clause narrows who may archive or when. It describes what happens to the record afterwards.',
    why:
      '`allowed-with-conditions` does not mean "gated". Reading row 4’s clause as a precondition invents a restriction the source never states; reading row 1’s as a consequence drops one it does. The token cannot answer which — only the cell’s words can.',
    sourceRef: 'L30073, L30070',
  },
  {
    id: 'part-state-vocabulary-splits-across-chapters',
    title: 'The part record has two disjoint state vocabularies and neither chapter names the other',
    what:
      'This card’s States field (L30060) gives the part `active` and `archived`. MOD-STU-10, built in slice 5 and shipped as `RegistryPartState` in `@/studio/seams/parts/registry`, gives it two others — L33129: "The registry record is Skeletal until completed in the Delivery Operations Hub, then Complete."',
    why:
      'A part arriving through the seam this module owns lands in a state this module’s own card cannot name, and the completion act that clears it has no row in this matrix. Recorded, not reconciled: picking one vocabulary would settle a conflict between two chapters that this task has no standing to settle.',
    sourceRef: 'L30060, L33129, L33116',
  },
  {
    id: 'studio-points-at-a-hub-row-that-does-not-exist',
    title: 'MOD-STU-10 routes a Tenant Admin into a Hub act this matrix does not carry',
    what:
      'MOD-STU-10’s row 4, "Complete a skeletal part record" (L33116), gives the Tenant Admin "Allowed — in the Delivery Operations Hub, subject to its own permissions" and the Read-only Auditor `Read-only`. This card’s eight rows contain no completion act.',
    why:
      'That is a routing pointer whose target is off-matrix, aimed at this module. The nearest act here is row 3, "Edit a part record", `Allowed` for the Tenant Admin — consistent in substance, but a row is not minted to receive a pointer. Reported upward; the Studio half is not this task’s to edit.',
    sourceRef: 'L33116, L30072, L30060',
  },
] as const satisfies readonly Doh19Finding[]

/**
 * WHY NEITHER ADJACENT ROW CARRIES A `DohBoundaryId`, recorded where a
 * reviewer looking for the missing pointer will find it.
 *
 * The §19.1.2 register's eight rows (L25719-L25726) list neither the parts
 * inline-add seam nor registry ingestion limits. `MOD-DOH-08` reported the
 * same gap for its two adjacent rows and rendered them from the row's own
 * words; this module does the same rather than patching a wave-0 file, and
 * rather than binding a row to a register entry that names the wrong owner.
 *
 * Row 2 is the harder half and would not be fixed by adding a register row:
 * the register's contract is "the Hub feeds it and does not own it", and the
 * Hub DOES own the part record. Row 2 needs a shape the register does not
 * have — performed there, owned here.
 */
export const DOH_19_REGISTER_GAP = {
  rows: ['add-a-part-inline-during-authoring', 'set-ingestion-limits-or-storage-metering'],
  gap:
    '`crossSurfaceStatement` and `@/ui/doh/CrossSurfaceStatement` are keyed on `DohBoundaryId`. Neither of this card’s adjacent capabilities is one of the eight §19.1.2 rows, so there is no id to pass and no `CrossSurfaceStatementModel` to build. Both render module-locally, from `./rendering`.',
  andRow2WouldStillNotFit:
    'Adding a register row for the inline-add seam would assert that the Standards and Operations Studio OWNS the part record, because that is what `DohBoundaryRow.owningSurface` means. The seam map rules the opposite at L13312.',
  sourceRef: 'L25719-L25726, L13312',
} as const

/**
 * The silences. Stated rather than filled: "a blank cell is an unanswered
 * question that an implementer will answer privately and inconsistently"
 * (L10238).
 */
export const UNSPECIFIED_IN_SOURCE = [
  {
    id: 'no-suspension-clause-on-edit-or-archive',
    question:
      'Do the suspension states block editing or archiving an existing part, as they block creating one?',
    what:
      'L30070 gates the bulk upload on every suspension state. L30072 and L30073 are writes to master data too and carry no tenant-state clause at all, and the card’s Preconditions (L30056) name only "a suspension state that blocks new-part creation".',
    treatment:
      'No gate is applied to rows 3 and 4. The stricter reading would block them; the source’s own enumeration at L26919 names creation and configuration edits, and whether a part edit is a "configuration edit" is precisely what is unstated. Recorded rather than decided.',
    sourceRef: 'L30072, L30073, L30056, L26919',
  },
  {
    id: 'bare-prohibitions-on-rows-1-3-4',
    question: 'Why are the four non-admin roles prohibited from the three registry writes?',
    what:
      'L30070, L30072 and L30073 state the bare token for the Supervisor, Quality Manager, Read-only Auditor and Worker and qualify it nowhere. The card’s Security field (L30063) gives the only cause anywhere: registry writes are Tenant Admin acts.',
    treatment:
      'The cells say exactly that and invent no per-role reason. A cause written here would read back as the source’s.',
    sourceRef: 'L30070, L30072, L30073, L30063',
  },
  {
    id: 'archived-part-and-the-seam',
    question: 'May the Studio inline-add seam create a part whose name matches an archived one?',
    what:
      'L30073 says an archived part "is not offered for new references". The seam creates a NEW record from a name; nothing states whether the name collides, is de-duplicated, or silently mints a second part.',
    treatment:
      'Unanswered here. The seam contract in `@/studio/seams/parts/registry` has one writable field and no de-duplication statement either, so neither side of the seam holds an answer to borrow.',
    sourceRef: 'L30073, L33207',
  },
] as const
