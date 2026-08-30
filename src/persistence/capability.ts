import type { StorageBootstrapState } from './bootstrap'

/**
 * Every action the product can attempt, sorted into "safe" (no durable
 * evidence at stake -- see `SAFE_ACTIONS` below) and "durable" (represents
 * evidence, an audit trail, or an authoritative state change -- see
 * `DURABLE_ACTIONS`).
 */
export type ActionClass =
  | 'navigate'
  | 'readFixture'
  | 'presentation'
  | 'failurePreview'
  | 'sandboxDemo'
  | 'durableEvidence'
  | 'requiredAudit'
  | 'captureAcceptance'
  | 'queueAcceptance'
  | 'approval'
  | 'publication'
  | 'release'
  | 'hold'
  | 'synchronisation'
  | 'lifecycleChange'
  | 'checkpointCredit'

/** Never represents durable evidence, an audit obligation, or an authoritative change. */
const SAFE_ACTIONS = [
  'navigate',
  'readFixture',
  'presentation',
  'failurePreview',
  'sandboxDemo',
] as const satisfies readonly ActionClass[]

/** The narrower subset of `SAFE_ACTIONS` permitted when storage is broken, not merely absent. */
const READ_ONLY_ACTIONS = ['navigate', 'readFixture'] as const satisfies readonly ActionClass[]

/**
 * Spec §5.3: the three RECOVERABLE, uncorrupted failure exits additionally
 * permit `presentation` -- it touches no durable store at all, so blocking a
 * density toggle on a read-only screen buys no safety and costs a reviewer
 * something real.
 */
const READ_ONLY_PLUS_PRESENTATION_ACTIONS = [
  'navigate',
  'readFixture',
  'presentation',
] as const satisfies readonly ActionClass[]

/**
 * MOD-DOH-17: "an action that cannot be audited does not happen." Every one
 * of these represents durable evidence, a required audit record, or an
 * authoritative lifecycle change -- so none may proceed anywhere but
 * `ready-durable`.
 */
const DURABLE_ACTIONS = [
  'durableEvidence',
  'requiredAudit',
  'captureAcceptance',
  'queueAcceptance',
  'approval',
  'publication',
  'release',
  'hold',
  'synchronisation',
  'lifecycleChange',
  'checkpointCredit',
] as const satisfies readonly ActionClass[]

const ALL_ACTIONS: readonly ActionClass[] = [...SAFE_ACTIONS, ...DURABLE_ACTIONS]

/**
 * The frozen capability table, keyed by every `StorageBootstrapState`.
 * `Record<StorageBootstrapState, ...>` makes the table exhaustive by
 * construction: omitting a state here is a compile error, not a silent gap.
 * Stated explicitly row for row per spec §5.3 -- not by rule of thumb -- so
 * no implementer has to decide privately which classes count.
 *
 * - `ready-durable` is the only state that permits durable action classes.
 * - `ephemeral-preview` permits the five safe classes (navigation, read-only
 *   fixture inspection, presentation, failure preview, labelled sandbox
 *   demo) and blocks every durable one.
 * - `quota-limited`, `upgrade-blocked` and `migration-failed-read-only` are
 *   RECOVERABLE and uncorrupted failure exits: storage was tried and denied
 *   or degraded, but its integrity is not in question. These three
 *   additionally permit `presentation` -- presentation touches no store at
 *   all, so blocking it buys no safety and costs a reviewer a density
 *   toggle on what is otherwise a read-only screen.
 * - `persistence-denied` and `corrupt-quarantined` are NOT merely
 *   recoverable: the store's own integrity is itself in question there, so
 *   only the two genuinely read-only classes are permitted -- not
 *   `presentation`, and not failure previews or sandbox demos, which this
 *   table treats as needing at least a working (if non-durable) client
 *   state. Treating all five failure exits as one risk class would be
 *   simpler and wrong.
 * - Every in-progress state (uninitialized through migrating) permits
 *   nothing: validation, migration and atomic store installation must
 *   finish before anything -- including navigation -- is allowed, so no
 *   role-aware content can flash before the bootstrap guarantee holds.
 */
const CAPABILITY_TABLE: Readonly<Record<StorageBootstrapState, readonly ActionClass[]>> =
  Object.freeze({
    'uninitialized': [],
    'client-mounted': [],
    opening: [],
    reading: [],
    'runtime-validating': [],
    'checksum-verifying': [],
    migrating: [],
    'ready-durable': ALL_ACTIONS,
    'upgrade-blocked': READ_ONLY_PLUS_PRESENTATION_ACTIONS,
    'persistence-denied': READ_ONLY_ACTIONS,
    'quota-limited': READ_ONLY_PLUS_PRESENTATION_ACTIONS,
    'corrupt-quarantined': READ_ONLY_ACTIONS,
    'migration-failed-read-only': READ_ONLY_PLUS_PRESENTATION_ACTIONS,
    'ephemeral-preview': SAFE_ACTIONS,
  })

export function permittedUnder(state: StorageBootstrapState, action: ActionClass): boolean {
  // `state` is typed as the closed StorageBootstrapState union, so every
  // valid value is a key by construction (see CAPABILITY_TABLE above) --
  // but this is a boolean gate consulted everywhere a caller may act on
  // unchecked input, so an unmapped key fails closed to `false` rather than
  // throwing on `undefined.includes`.
  return (CAPABILITY_TABLE[state] ?? []).includes(action)
}
