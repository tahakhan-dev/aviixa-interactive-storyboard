/**
 * The SURF-DOH spine, part 2 of 6: the tenant state gate. Spec §2 S2, D19.
 *
 * Read on every request and applied BEFORE any write control renders
 * (L27002). Five operating states — `pilot` is an orthogonal flag ("a pilot
 * tenant is functionally identical to a paying tenant", D19), never a sixth
 * state; `draft` and `awaiting_administrator` belong to SURF-SA and never
 * render here, because in draft no user can authenticate.
 */
export type TenantState =
  | 'active'
  | 'soft-suspended'
  | 'hard-suspended'
  | 'compliance-suspended'
  | 'archived'

export const TENANT_STATES = [
  'active',
  'soft-suspended',
  'hard-suspended',
  'compliance-suspended',
  'archived',
] as const satisfies readonly TenantState[]

type MissingFromTenantStates = Exclude<TenantState, (typeof TENANT_STATES)[number]>
const _tenantStatesExhaustive: MissingFromTenantStates extends never ? true : never = true
void _tenantStatesExhaustive

/**
 * L26547: "the stricter interpretation applies" wherever tenant state
 * cannot be determined. Modelled as a sixth row in the SAME table rather
 * than a fallback branch, so a caller can never reach `writeAllowed`
 * without an explicit state and skip the refusal.
 */
export type TenantWriteState = TenantState | 'indeterminate'

/**
 * Every write class the source names across the three suspension states
 * (L26919-L26921) plus the two decisions that extend the table (D15, D16).
 * A flat, closed set — no action outside it needs the gate, because
 * everything the gate does NOT name is `writeAllowed('active', ...) === true`.
 */
export type WriteAction =
  // Master-data creation, named exactly at L26919/L64977: "creation of new
  // Jobs, new Workers, new locations, new shifts, new parts".
  | 'create-job'
  | 'create-worker'
  | 'create-location'
  | 'create-shift'
  | 'create-part'
  // "and all configuration edits" (L26919).
  | 'edit-configuration'
  // D15: a tier upgrade is a self-service Tenant Admin write, blocked under
  // soft suspension by the stricter reading (L26547) though neither the
  // blocked nor the open enumeration names it directly.
  | 'upgrade-tier'
  // Operational actions soft suspension explicitly keeps open ("operations
  // continue in full", L16521): recertification of existing workers
  // (L26919, "because it operates the existing account rather than growing
  // it") and clearances (soft's open list names "clearances operate"
  // alongside recertification).
  | 'recertify-worker'
  | 'grant-clearance'
  | 'start-run'
  // Hard suspension's enumerated completion pipeline, "exactly" (L26920):
  // in-flight runs complete, step execution, data capture and sync,
  // substitution to complete an in-flight run, summaries computing and
  // closing, mandatory notifications, audit.
  | 'execute-step'
  | 'capture-data'
  | 'sync-data'
  | 'substitute-to-complete-run'
  | 'compute-summary'
  | 'send-notification'
  | 'write-audit'

export const ALL_WRITE_ACTIONS = [
  'create-job',
  'create-worker',
  'create-location',
  'create-shift',
  'create-part',
  'edit-configuration',
  'upgrade-tier',
  'recertify-worker',
  'grant-clearance',
  'start-run',
  'execute-step',
  'capture-data',
  'sync-data',
  'substitute-to-complete-run',
  'compute-summary',
  'send-notification',
  'write-audit',
] as const satisfies readonly WriteAction[]

type MissingFromWriteActions = Exclude<WriteAction, (typeof ALL_WRITE_ACTIONS)[number]>
const _writeActionsExhaustive: MissingFromWriteActions extends never ? true : never = true
void _writeActionsExhaustive

interface TenantWriteClassRow {
  readonly state: TenantWriteState
  /** `'all'` for the unrestricted case; otherwise the exact OPEN set —
   *  everything not listed is blocked. Encoding OPEN rather than BLOCKED
   *  matches how the source itself states hard suspension ("read-only
   *  except the enumerated completion pipeline") and keeps the table from
   *  needing two parallel lists that could drift apart. */
  readonly open: readonly WriteAction[] | 'all'
  readonly note: string
}

// Each `open` list is declared as an explicitly-typed `readonly WriteAction[]`
// constant, NOT a bare literal inside the table below. `as const satisfies`
// on the table gives `state` its real per-row literal narrowing (needed for
// the exhaustiveness check just below) — but the same trick applied to
// `open` would keep each list as its own narrow literal tuple type instead
// of `readonly WriteAction[]`, and a union of differently-shaped tuples
// makes `.includes()` uncallable with a plain `WriteAction` argument
// (`Array<T>.includes` collapses to `never` across such a union). Referencing
// an already-typed constant sidesteps that: `as const` only narrows fresh
// literal expressions, never an identifier that already carries its own type.
const SOFT_SUSPENSION_OPEN: readonly WriteAction[] = [
  'recertify-worker',
  'grant-clearance',
  'start-run',
  'execute-step',
  'capture-data',
  'sync-data',
  'substitute-to-complete-run',
  'compute-summary',
  'send-notification',
  'write-audit',
]

const HARD_SUSPENSION_PIPELINE: readonly WriteAction[] = [
  'execute-step',
  'capture-data',
  'sync-data',
  'substitute-to-complete-run',
  'compute-summary',
  'send-notification',
  'write-audit',
]

const NO_WRITES_OPEN: readonly WriteAction[] = []

/**
 * THE WRITE-CLASS TABLE. One data structure, not scattered conditionals
 * (S2, R4) — `writeAllowed` below does nothing but look a row up in this
 * array. Six rows: the five operating states plus `indeterminate`.
 */
export const TENANT_WRITE_CLASSES = [
  {
    state: 'active',
    open: 'all',
    note: 'Normal operation. No write class is restricted by tenant state.',
  },
  {
    state: 'soft-suspended',
    open: SOFT_SUSPENSION_OPEN,
    note:
      'L26919/L64977: blocks new Jobs, Workers, locations, shifts, parts, and all configuration ' +
      'edits, plus a tier upgrade (D15). Recertification and clearances deliberately stay open — ' +
      'the account keeps operating rather than growing.',
  },
  {
    state: 'hard-suspended',
    open: HARD_SUSPENSION_PIPELINE,
    note:
      'L26920: read-only except the enumerated completion pipeline. No new runs. D16: ' +
      'recertification and clearance grants are absent from the pipeline and are therefore ' +
      'blocked — a certification expiring mid-hard-suspension has no renewal path, only substitution.',
  },
  {
    state: 'compliance-suspended',
    open: NO_WRITES_OPEN,
    note: 'L26921: blocks all logins immediately. No signed-in user remains to write anything.',
  },
  {
    state: 'archived',
    open: NO_WRITES_OPEN,
    note:
      'The source states no open write class for a closed tenant; the stricter interpretation ' +
      '(L26547) applies in that silence, same as `indeterminate` below.',
  },
  {
    state: 'indeterminate',
    open: NO_WRITES_OPEN,
    note: 'L26547: "the stricter interpretation applies" where tenant state cannot be determined.',
  },
] as const satisfies readonly TenantWriteClassRow[]

type MissingFromWriteClasses = Exclude<TenantWriteState, (typeof TENANT_WRITE_CLASSES)[number]['state']>
const _writeClassesExhaustive: MissingFromWriteClasses extends never ? true : never = true
void _writeClassesExhaustive

const WRITE_CLASS_BY_STATE = new Map(TENANT_WRITE_CLASSES.map((r) => [r.state, r]))

/**
 * The one function every module's write controls call. Reads ONE row of
 * the table above; no branch anywhere else in the codebase may re-derive
 * this decision.
 */
export function writeAllowed(state: TenantWriteState, action: WriteAction): boolean {
  const row = WRITE_CLASS_BY_STATE.get(state)
  if (!row) return false // Stricter interpretation: an unmapped state refuses (L26547).
  return row.open === 'all' || row.open.includes(action)
}

/**
 * The note that names WHY a state refuses, read from the same row
 * `writeAllowed` reads. Four screens each built their own
 * `new Map(TENANT_WRITE_CLASSES.map(...))` to reach it and each wrote its own
 * `?? ''`; this is that lookup once, over the map the table already keeps.
 *
 * No exhaustiveness check of its own: `_writeClassesExhaustive` above already
 * proves every `TenantWriteState` has a row, so the `?? ''` is unreachable for
 * a well-typed caller and is kept only to preserve the exact string the four
 * call sites produced.
 */
export function writeClassNote(state: TenantWriteState): string {
  return WRITE_CLASS_BY_STATE.get(state)?.note ?? ''
}
