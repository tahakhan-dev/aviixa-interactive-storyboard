import { cellFromSource, type ColumnCell } from '@/policy/columns'
import {
  type ControlStatus,
  type DohControlMatrixRow,
  type MatrixRowSurface,
} from '@/surfaces/doh/modules'
import { rolesInDomain } from '@/domain/roles'
import type { TenantRoleId } from '../../../../../app/hub/HubShell'

/**
 * `MOD-DOH-11` — Audit and Retention, §19.13. THE TRANSCRIPTION.
 *
 * ── TEN DATA ROWS, COUNTED BY READING TO WHERE THE BODY STOPS ─────────────
 * Header L28863, separator L28864, body L28865-L28874, and the body stops
 * where the blank line after L28874 begins — which is how its end was found
 * rather than by trusting a span. Ten rows by five tenant-role columns is
 * fifty cells. The count was read off
 * the file, not inferred from the span: `DOH_11_ROW_COUNT` below is asserted
 * against the source in `tests/unit/doh-11.test.ts`, which also asserts the
 * header and separator are not rows.
 *
 * ── ONE PARSER, BECAUSE `Allowed` IS A PREFIX OF `Allowed with conditions` ─
 * Every cell goes through `cellFromSource` (`@/policy/columns`), the same
 * parser the two 45A.7 matrices use. This file re-derives no token rule, so
 * the prefix trap is solved in one place for both matrices rather than twice.
 * The rows are held as VERBATIM PIPE LINES so a reader can diff a row against
 * the frozen source by eye, and anything the parser does not understand
 * throws at module load rather than becoming a confident wrong permission.
 *
 * ── THE ONE NORMALISATION, AND IT IS A REPORTED GAP IN `cellFromSource` ───
 * Two cells here backtick the WHOLE cell INCLUDING the stated reason —
 * `` `Not applicable — deferred beyond V1` `` on both deferral rows.
 * `cellFromSource` strips a leading backtick and a backtick immediately after
 * the token, but nothing strips a backtick that closes the cell AFTER the
 * reason, so the parsed `detail` would end in a stray backtick and render
 * that way. `closeBalancedBacktick` below removes exactly that one character,
 * only when the cell opens and closes with a backtick and carries no interior
 * one. The fix belongs in `cellFromSource`; `src/policy/**` is another task's
 * file, so this is reported rather than edited there.
 *
 * ── EVERY ROW IS CLASSIFIED `screen`, AND IT IS MEASURED THAT IT CANNOT
 *    MOVE THE REACH ANSWER ───────────────────────────────────────────────
 * Two rows state that the act itself is performed on the Super Admin platform
 * console — the retention horizon and the legal hold, each in its own cell's
 * words. Under `MOD-DOH-06`'s reading of `another-surface` (recorded as a
 * divergence in `MATRIX_ROW_SURFACE_DIVERGENCES`) those two would be
 * reclassified, and under `MOD-DOH-05`'s reading they would not. This module
 * declines to add a fourth reading: both rows are `Explicitly prohibited` in
 * all five columns, so neither can contribute a held capability to clause one
 * of `rolesReachingByMatrix` and neither carries `Unavailable` to trigger
 * clause two. `doh11ReachIsClassificationIndependent` measures that, over
 * every subset of the two, rather than asserting it.
 */

/** Ten, read off the body rather than taken from the span. */
export const DOH_11_ROW_COUNT = 10

export type Doh11RowId =
  | 'read-the-full-tenant-audit-log'
  | 'read-summary-and-run-state-audit-events'
  | 'export-audit'
  | 'bulk-export-to-tenant-owned-storage'
  | 'edit-or-delete-an-audit-entry'
  | 'set-the-retention-horizon'
  | 'place-or-release-a-legal-hold'
  | 'trigger-anonymisation'
  | 'reverse-anonymisation'
  | 'verify-tamper-evidence-through-chained-hashes'

/**
 * The five tenant-role columns in the header's own order, L28863:
 * Tenant Admin, Supervisor, Quality Manager, Read-only Auditor, Worker.
 * Read out of the role registry rather than typed a second time, and the
 * header's spelling is asserted against the source in the unit suite.
 */
const COLUMNS: readonly TenantRoleId[] = rolesInDomain('TENANT').map(
  (r) => r.id as TenantRoleId,
)

/**
 * One row of §19.13's permission matrix.
 *
 * `routesTo` is the whole C1 trap in one field, and it is a POINTER TO A ROW
 * OF THIS MATRIX rather than prose: the cell that reads `Explicitly
 * prohibited` and names a permission in the same words is a routing branch,
 * and the row the reader is being routed to is the next one. The fold checks
 * the target's own cell for the SAME role before it renders anything, so the
 * branch cannot be satisfied by this field alone.
 */
export interface Doh11Row extends DohControlMatrixRow<Doh11RowId> {
  /** Per role, the parsed cell — outcome plus the cell's verbatim condition. */
  readonly cells: Readonly<Record<TenantRoleId, ColumnCell>>
  /**
   * The row of THIS matrix holding the permission a prohibition names in its
   * own cell, or `null`. Non-null on one row only.
   */
  readonly routesTo: Doh11RowId | null
}

/**
 * The ten body lines of L28865-L28874, verbatim. Row i's locator is
 * `28865 + i`, because the body is contiguous — asserted line by line in the
 * unit suite against the frozen file.
 */
export const DOH_11_SOURCE_ROWS = [
  '| Read the full tenant audit log | `Read-only` | `Unavailable` | `Explicitly prohibited` — scoped to Summary and run-state events only | `Read-only` — the same access as the Tenant Admin | `Unavailable` |',
  '| Read Summary and run-state audit events | `Read-only` | `Unavailable` | `Read-only` | `Read-only` | `Unavailable` |',
  '| Export audit as comma-separated values or JavaScript Object Notation with date and entity filters | `Allowed` | `Explicitly prohibited` | `Allowed with conditions` — within the Quality Manager\'s audit scope | `Allowed` | `Explicitly prohibited` |',
  '| Bulk export to tenant-owned storage | `Not applicable — deferred beyond V1` | `Not applicable — same reason` | `Not applicable — same reason` | `Not applicable — same reason` | `Not applicable — same reason` |',
  '| Edit or delete an audit entry | `Explicitly prohibited` | `Explicitly prohibited` | `Explicitly prohibited` | `Explicitly prohibited` | `Explicitly prohibited` |',
  '| Set the retention horizon | `Explicitly prohibited` — configured per tenant in the Super Admin platform console with maker-checker | `Explicitly prohibited` | `Explicitly prohibited` | `Explicitly prohibited` | `Explicitly prohibited` |',
  '| Place or release a legal hold | `Explicitly prohibited` — a Super Admin managed object and a critical-class action | `Explicitly prohibited` | `Explicitly prohibited` | `Explicitly prohibited` | `Explicitly prohibited` |',
  '| Trigger anonymisation | `Explicitly prohibited` — automatic at 24 months for standard tenants and never in Regulated-Industry mode | `Explicitly prohibited` | `Explicitly prohibited` | `Explicitly prohibited` | `Explicitly prohibited` |',
  '| Reverse anonymisation | `Explicitly prohibited` — anonymisation is the platform\'s one irreversible act | `Explicitly prohibited` | `Explicitly prohibited` | `Explicitly prohibited` | `Explicitly prohibited` |',
  '| Verify tamper-evidence through chained hashes | `Not applicable — deferred beyond V1` | `Not applicable — same reason` | `Not applicable — same reason` | `Not applicable — same reason` | `Not applicable — same reason` |',
] as const

/** The first line of the BODY. Row i is at `BODY_FIRST_LINE + i`. */
const BODY_FIRST_LINE = 28865

/**
 * The per-row material this module states and the source does not put in a
 * cell: the row's id, how this screen draws it, what it does, and the one
 * routing pointer. Kept beside the transcription and keyed on the id so a row
 * added to `DOH_11_SOURCE_ROWS` without an entry here fails at module load.
 */
const ROW_META: readonly {
  readonly id: Doh11RowId
  readonly surface: MatrixRowSurface
  readonly rendering: string
  readonly effect: string
  readonly routesTo: Doh11RowId | null
}[] = [
  {
    id: 'read-the-full-tenant-audit-log',
    surface: 'screen',
    rendering:
      'A read, so no write control is drawn for any role. The Quality Manager’s cell is a routing branch and renders DISABLED with its own named reason; every other refusal on this row renders as no control with the cell’s words where the control would sit.',
    effect:
      'Decides whether the audit browser is offered over every event class or over none.',
    routesTo: 'read-summary-and-run-state-audit-events',
  },
  {
    id: 'read-summary-and-run-state-audit-events',
    surface: 'screen',
    rendering: 'A read. The scope line above the table states which of the two reads is in force.',
    effect:
      'The scoped read the previous row’s prohibition names, and the licence stage of the audit selector for the Quality Manager.',
    routesTo: null,
  },
  {
    id: 'export-audit',
    surface: 'screen',
    rendering:
      'The one write control on this screen. Disabled with its reason while the audit store cannot commit, because the export request is itself audited.',
    effect: 'Produces a comma-separated-values or JavaScript Object Notation file of the read.',
    routesTo: null,
  },
  {
    id: 'bulk-export-to-tenant-owned-storage',
    surface: 'screen',
    rendering:
      'No control, and the deferral stated where the control would be — a disabled control would promise a capability that is not coming in this release.',
    effect: 'Nothing at V1.',
    routesTo: null,
  },
  {
    id: 'edit-or-delete-an-audit-entry',
    surface: 'screen',
    rendering:
      'No control for any role, and the append-only rule stated once. Drawing a disabled Delete would imply the path exists somewhere.',
    effect: 'Nothing. No edit or delete path exists for any role, including the Root Super Admin.',
    routesTo: null,
  },
  {
    id: 'set-the-retention-horizon',
    surface: 'screen',
    rendering: 'No control. The cell’s own words name where the act is performed instead.',
    effect: 'Nothing on this surface.',
    routesTo: null,
  },
  {
    id: 'place-or-release-a-legal-hold',
    surface: 'screen',
    rendering: 'No control. The cell’s own words name where the act is performed instead.',
    effect: 'Nothing on this surface.',
    routesTo: null,
  },
  {
    id: 'trigger-anonymisation',
    surface: 'screen',
    rendering: 'No control. The cell states that the act is automatic rather than offered.',
    effect: 'Nothing on this surface.',
    routesTo: null,
  },
  {
    id: 'reverse-anonymisation',
    surface: 'screen',
    rendering: 'No control. The cell states the act is irreversible.',
    effect: 'Nothing, ever.',
    routesTo: null,
  },
  {
    id: 'verify-tamper-evidence-through-chained-hashes',
    surface: 'screen',
    rendering:
      'No control, and the deferral stated in the source’s own words. This is the row that forbids the whole screen from claiming tamper-evidence.',
    effect: 'Nothing at V1.',
    routesTo: null,
  },
]

/**
 * Drops the backtick that CLOSES a wholly-backticked cell, and only that.
 * Runs before `cellFromSource` so the parsed condition does not end in a
 * stray backtick. Guarded three ways: the cell must open with a backtick,
 * close with one, and hold no interior backtick — a condition that names an
 * identifier in backticks of its own is left exactly as the source wrote it.
 */
function closeBalancedBacktick(cell: string): string {
  const t = cell.trim()
  if (!t.startsWith('`') || !t.endsWith('`') || t.length < 2) return t
  if (t.slice(1, -1).includes('`')) return t
  return t.slice(0, -1)
}

function buildRows(): readonly Doh11Row[] {
  if (DOH_11_SOURCE_ROWS.length !== DOH_11_ROW_COUNT) {
    throw new Error(
      `MOD-DOH-11: ${DOH_11_SOURCE_ROWS.length} transcribed rows against a counted body of ${DOH_11_ROW_COUNT}`,
    )
  }
  if (ROW_META.length !== DOH_11_ROW_COUNT) {
    throw new Error(
      `MOD-DOH-11: ${ROW_META.length} row descriptions against ${DOH_11_ROW_COUNT} rows`,
    )
  }
  return DOH_11_SOURCE_ROWS.map((text, i) => {
    const sourceRef = `L${BODY_FIRST_LINE + i}`
    const parts = text.split('|')
    if (parts[0] !== '' || parts[parts.length - 1] !== '') {
      throw new Error(`MOD-DOH-11 ${sourceRef} is not a pipe-delimited table row: ${text}`)
    }
    const fields = parts.slice(1, -1).map((f) => f.trim())
    if (fields.length !== COLUMNS.length + 1) {
      throw new Error(
        `MOD-DOH-11 ${sourceRef} has ${fields.length} fields; the header declares ${COLUMNS.length + 1}`,
      )
    }
    const control = fields[0] ?? ''
    if (control === '') throw new Error(`MOD-DOH-11 ${sourceRef} names no action`)

    const cells: Partial<Record<TenantRoleId, ColumnCell>> = {}
    const status: Partial<Record<TenantRoleId, ControlStatus>> = {}
    const detail: Partial<Record<TenantRoleId, string>> = {}
    COLUMNS.forEach((role, c) => {
      const cell = cellFromSource(closeBalancedBacktick(fields[c + 1] ?? ''))
      cells[role] = cell
      status[role] = STATUS_FROM_OUTCOME[cell.outcome]
      detail[role] = cell.detail
    })

    const meta = ROW_META[i]
    if (meta === undefined) throw new Error(`MOD-DOH-11 ${sourceRef} has no row description`)
    return {
      id: meta.id,
      control,
      surface: meta.surface,
      status: status as Readonly<Record<TenantRoleId, ControlStatus>>,
      detail: detail as Readonly<Record<TenantRoleId, string>>,
      cells: cells as Readonly<Record<TenantRoleId, ColumnCell>>,
      rendering: meta.rendering,
      effect: meta.effect,
      sourceRef,
      routesTo: meta.routesTo,
    }
  })
}

/**
 * The nine-member outcome union onto the six-member cell-status union. A
 * TOTAL `Record`, so a tenth outcome fails to compile here rather than
 * normalising to `undefined`. It is not `outcomeCellStatus` from
 * `@/surfaces/doh/modules`, which reads a `{ cells: Record<role, { outcome }> }`
 * shape and is what builds this record's own field — using it here would be
 * circular. `tests/unit/doh-11.test.ts` asserts the two agree on every cell.
 */
const STATUS_FROM_OUTCOME = {
  allowed: 'allowed',
  allowedWithConditions: 'allowed-with-conditions',
  readOnly: 'read-only',
  cachedReadOnlyOffline: 'read-only',
  queuedOffline: 'allowed',
  unavailable: 'unavailable',
  explicitlyProhibited: 'explicitly-prohibited',
  clientDecisionRequired: 'not-applicable',
  notApplicable: 'not-applicable',
} as const satisfies Readonly<Record<ColumnCell['outcome'], ControlStatus>>

export const CONTROL_MATRIX: readonly Doh11Row[] = buildRows()

export function doh11Row(id: Doh11RowId): Doh11Row {
  const row = CONTROL_MATRIX.find((r) => r.id === id)
  if (row === undefined) throw new Error(`MOD-DOH-11 has no row ${id}`)
  return row
}

/**
 * MEASURED, NOT ASSERTED: no subset of the two rows whose act is performed on
 * the platform console can change who reaches this route, whichever reading
 * of `another-surface` is applied to them. Returns every distinct reach answer
 * over the four subsets; a single-element result is the claim.
 */
export function doh11ReachIsClassificationIndependent(
  reachOf: (rows: readonly Doh11Row[]) => readonly TenantRoleId[],
): ReadonlySet<string> {
  const candidates: readonly Doh11RowId[] = [
    'set-the-retention-horizon',
    'place-or-release-a-legal-hold',
  ]
  const answers = new Set<string>()
  for (const mask of [0, 1, 2, 3]) {
    const reclassified = CONTROL_MATRIX.map((row) => {
      const bit = candidates.indexOf(row.id)
      return bit >= 0 && (mask & (1 << bit)) !== 0
        ? { ...row, surface: 'another-surface' as MatrixRowSurface }
        : row
    })
    answers.add([...reachOf(reclassified)].join(','))
  }
  return answers
}

/* ==================================================================== *
 * THE AUDITED TAXONOMY — and the count the source states beside it.
 * ==================================================================== */

/**
 * WHAT THE SOURCE ENUMERATES, AND WHAT IT SAYS IT ENUMERATES. The taxonomy
 * is one sentence, semicolon-separated, at L28836. Counted by reading it:
 * **TWELVE** items. The source calls it a thirteen-class taxonomy THREE
 * times — L28922, L28969 and L28997 — and §30D.2 restates the same twelve at
 * L74042. Both numbers are reported and neither is renumbered: the
 * enumeration is what a screen can act on, and the mismatch is a finding
 * rather than something to average.
 *
 * Two readings would each produce thirteen and the build picks neither:
 * splitting "every assignment and substitution" into two classes, or reading
 * "every clearance — grant, use and lapse" as three. Nothing in the source
 * chooses, so `DOH_11_TAXONOMY_COUNT_CONFLICT` states the disagreement and
 * the twelve are what the selector keys on.
 *
 * `inQualityManagerScope` marks the two classes the phrase "Summary and
 * run-state events" names — the run state transition and the Summary review
 * action. That phrase is the Quality Manager's whole read scope at L28838,
 * L28865 and L28866, and it is what stage one of the selector resolves to.
 */
export interface AuditEventClassDefinition {
  readonly id: string
  /** The source's own words for this class, verbatim from the enumeration. */
  readonly stated: string
  readonly inQualityManagerScope: boolean
}

export const AUDIT_TAXONOMY = [
  { id: 'run-state-transition', stated: 'Every run state transition', inQualityManagerScope: true },
  { id: 'step-execution', stated: 'every step execution', inQualityManagerScope: false },
  { id: 'data-capture', stated: 'every data capture', inQualityManagerScope: false },
  {
    id: 'assignment-and-substitution',
    stated: 'every assignment and substitution',
    inQualityManagerScope: false,
  },
  { id: 'permission-change', stated: 'every permission change', inQualityManagerScope: false },
  {
    id: 'configuration-change',
    stated:
      'every configuration change, including every tenant-setting change in the tenant administration area',
    inQualityManagerScope: false,
  },
  {
    id: 'summary-review-action',
    stated: 'every Summary review action',
    inQualityManagerScope: true,
  },
  {
    id: 'clearance',
    stated: 'every clearance — grant, use and lapse',
    inQualityManagerScope: false,
  },
  {
    id: 'lane-b-auto-publish',
    stated:
      'every Lane B auto-publish event, covering proposal, human approval, automatic publication and distribution, as its own audit class',
    inQualityManagerScope: false,
  },
  {
    id: 'platform-side-access-event',
    stated: 'every platform-side access event against the tenant',
    inQualityManagerScope: false,
  },
  {
    id: 'tenant-state-transition',
    stated: 'every tenant state transition in `tenant_state_history`',
    inQualityManagerScope: false,
  },
  {
    id: 'studio-publication',
    stated:
      'and every work-instruction or media version published in the Standards and Operations Studio',
    inQualityManagerScope: false,
  },
] as const satisfies readonly AuditEventClassDefinition[]

export type AuditEventClassId = (typeof AUDIT_TAXONOMY)[number]['id']

/** Both numbers, because the source states one beside an enumeration of the other. */
export const DOH_11_TAXONOMY_COUNT_CONFLICT = {
  enumerated: AUDIT_TAXONOMY.length,
  stated: 13,
  where:
    'The taxonomy is one semicolon-separated sentence in §19.13’s business rules and yields twelve classes; §30D.2 restates the same twelve. Three other lines of the module call it a thirteen-class taxonomy — the functionality that records it, its acceptance criterion, and the module’s own source-status paragraph.',
  sourceRefs: ['L28836', 'L74042', 'L28922', 'L28969', 'L28997'],
  notSettled:
    'Splitting “every assignment and substitution” into two classes would give thirteen, and so would reading “every clearance — grant, use and lapse” as three. The source chooses neither, so this build renders both numbers and keys its selector on the twelve it can read.',
} as const

/* ==================================================================== *
 * AUDIT FAILURE IS GRADED — §30D.14's own table, transcribed.
 * ==================================================================== */

/**
 * THE GRADED RESPONSE, VERBATIM. Header L74865, separator L74866, body
 * L74867-L74875 — **NINE data rows**, counted by reading to the blank line.
 * Three columns: the action class, what happens when the audit store is
 * unavailable, and the rationale.
 *
 * The section states the halt classes in prose as well, and the prose list is
 * SEVEN named classes — privileged, destructive, approval, publication,
 * release, security, platform — where the table has nine rows because it also
 * carries the two Frontline rows and the two that continue. Both are recorded
 * because a screen that quoted one as the other would be quoting a count
 * beside an enumeration that contradicts it.
 *
 * ONE BANNER FOR ALL OF THIS IS WRONG, and that is the whole reason this
 * table is data rather than a sentence: on this screen an export halts and a
 * read continues, and a single "audit unavailable" banner would say the same
 * thing about both.
 */
export interface AuditFailureGrade {
  readonly actionClass: string
  readonly behaviour: string
  readonly rationale: string
  readonly sourceRef: string
  /** True where the behaviour column's first word is Halt. Derived, never typed. */
  readonly halts: boolean
}

const GRADED_SOURCE_ROWS = [
  '| Privileged platform actions | Halt. Refused with the audit-unavailable message | An unaudited privileged action is the failure mode the access model exists to prevent |',
  '| Destructive actions, including archival, erasure execution, device wipe | Halt | Irreversibility plus no record is the worst combination available |',
  '| Approvals, publications, releases | Halt | These are governance acts whose entire value is the record |',
  '| Security actions, including role changes and suspension | Halt | The audit log is the separation of duties made verifiable |',
  '| Platform configuration changes | Halt | Includes attempts on locked settings, which are themselves an event class |',
  '| Frontline capture and step execution | Continue into the local durable append-only queue, which is the device\'s audit store | The commit-together rule holds locally; the work is not unaudited, it is audited locally and pending |',
  '| Frontline capture when the local queue is unwritable | Halt, upload-only mode | The device has no remaining audit path |',
  '| Reads outside access sessions | Continue | Reads outside access classes are not audited by design |',
  '| Notification sending | Halt | Stated in §30C.12 and §30D.9 |',
] as const

const GRADED_BODY_FIRST_LINE = 74867

export const AUDIT_FAILURE_GRADING: readonly AuditFailureGrade[] = GRADED_SOURCE_ROWS.map(
  (text, i) => {
    const sourceRef = `L${GRADED_BODY_FIRST_LINE + i}`
    const fields = text.split('|').slice(1, -1).map((f) => f.trim())
    if (fields.length !== 3) {
      throw new Error(`MOD-DOH-11 ${sourceRef} has ${fields.length} fields; the header declares 3`)
    }
    const [actionClass, behaviour, rationale] = fields as [string, string, string]
    return { actionClass, behaviour, rationale, sourceRef, halts: behaviour.startsWith('Halt') }
  },
)

/**
 * The prose list of halt CLASSES, which is seven and not nine. Its own
 * sentence: an unauditable privileged, destructive, approval, publication,
 * release, security, or platform action must not silently continue. The
 * acceptance criterion repeats the same seven.
 */
export const AUDIT_HALT_CLASSES = [
  'privileged',
  'destructive',
  'approval',
  'publication',
  'release',
  'security',
  'platform',
] as const

export const AUDIT_HALT_CLASS_LOCATORS = ['L74859', 'L74916'] as const

/**
 * The degraded-state banner every web surface carries, in the source's own
 * words. Quoted rather than paraphrased because it is a rendered string and
 * a paraphrase of it would be this build's claim about an outage.
 */
export const AUDIT_DEGRADED_BANNER = {
  text: 'Some actions are paused because the record system is unavailable. Nothing has been lost.',
  sourceRef: 'L74902',
} as const

/**
 * WHAT THIS SCREEN'S OWN GRADING IS, and the one place the source disagrees
 * with itself about it.
 *
 * The graded table puts "Reads outside access sessions" on Continue, and
 * §30D.4's own fallback paragraph says the same thing in words — reconciliation
 * is not required because reads outside access sessions are not audited. But
 * §19.13's Audit paragraph says this module audits "audit read access by
 * identity", which would make the read itself an audited act and therefore a
 * halt under the one-transaction rule.
 *
 * Both are stated. This build follows the graded table, because grading the
 * consequences is what that section exists to do and because the alternative
 * closes an auditor's read during the outage it most needs to read about —
 * and it says so on screen rather than picking silently. The export is a halt
 * either way: its request, filters and outcome are audited by the same
 * sentence, and an export is a governance act whose value is the record.
 */
export const DOH_11_READ_DURING_OUTAGE_CONFLICT = {
  continues:
    'The graded action-class register puts reads outside access sessions on Continue, with the rationale that reads outside access classes are not audited by design; §30D.4’s own fallback paragraph says the same in words.',
  continuesRefs: ['L74874', 'L74226'],
  wouldHalt:
    'This module’s Audit paragraph says it audits audit read access by identity, which under the one-transaction rule makes the read itself an audited act and therefore a halt.',
  wouldHaltRefs: ['L28953'],
  position:
    'This build follows the graded register: the read continues and the export halts. Neither reading is presented as settled, and no path shows a completed export while its own audit cannot commit.',
} as const

/* ==================================================================== *
 * WHAT V1 IS NOT.
 * ==================================================================== */

/**
 * THE CLAIM THIS SCREEN MAY NEVER MAKE, and its three locators, each read
 * whole. The matrix's own last row reads `Not applicable — deferred beyond
 * V1` for verifying tamper-evidence through chained hashes; the access-and-
 * export rule defers tamper-evidence through chained hashes or signed batches
 * beyond V1 in the same sentence that defers bulk export; and the module's
 * Security paragraph states the deferral rather than implying it, "so no
 * tenant is left believing the log is cryptographically chained when it is
 * not".
 *
 * `DEC-AUDITHASH-001` is cited on the screen through `DecisionDisclosure` and
 * is NOT restated here: it is about the audit hash in the Execution Summary
 * footer, not about the whole audit store, and a second wording of it on this
 * screen is the second home that component exists to prevent.
 */
export const V1_IS_NOT_TAMPER_EVIDENT = {
  statement:
    'What V1 delivers is append-only access control: no edit path and no delete path for any role, including the Root Super Admin. That is an access-control property, not a cryptographic one. Tamper-evidence through chained hashes or signed batches is deferred beyond V1, and this screen states the deferral rather than implying it — nothing on this screen is signed, hash-chained, or independently verifiable by an external auditor.',
  sourceRefs: ['L28874', 'L28838', 'L28955'],
} as const
