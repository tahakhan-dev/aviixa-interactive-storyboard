/**
 * Task 7 (`src/data/boot.ts`) — loads the §3.1 seeds once, validates every
 * row with the SAME zod schemas `scripts/validate-collections.mjs` runs at
 * compile-level (`@/data/schemas#COLLECTIONS`), and hands the resulting
 * store to the persistence bridge already built in `src/persistence`
 * (`bootstrapStorage`) rather than re-implementing IndexedDB open/upgrade/
 * checksum logic here. `boot()` is the one async entry point in the data
 * layer; every `Repository` method it returns is synchronous.
 *
 * Static imports, not a loop over `COLLECTIONS`' file names: this keeps
 * every seed file inside webpack/Turbopack's static module graph, which a
 * `pnpm build` static export needs (no dynamic `fetch`/`import()` of a
 * runtime-computed path).
 */
import { bootstrapStorage, type BootstrapResult } from '@/persistence/bootstrap'
import { createRepository, readLatestSnapshot, type Repository } from './repository'
import { COLLECTIONS, type CollectionName } from './schemas'
import { createStore, type CollectionData, type Store } from './store'

import tenants from './collections/tenants.json'
import users from './collections/users.json'
import roles from './collections/roles.json'
import roleGrants from './collections/role-grants.json'
import sites from './collections/sites.json'
import areas from './collections/areas.json'
import locations from './collections/locations.json'
import shifts from './collections/shifts.json'
import workers from './collections/workers.json'
import qualifications from './collections/qualifications.json'
import qualificationGrants from './collections/qualification-grants.json'
import devices from './collections/devices.json'
import workflowDefinitions from './collections/workflow-definitions.json'
import workInstructions from './collections/work-instructions.json'
import contentBlocks from './collections/content-blocks.json'
import training from './collections/training.json'
import specifications from './collections/specifications.json'
import evaluations from './collections/evaluations.json'
import packages from './collections/packages.json'
import jobs from './collections/jobs.json'
import runs from './collections/runs.json'
import unitExecutions from './collections/unit-executions.json'
import stepExecutions from './collections/step-executions.json'
import captures from './collections/captures.json'
import evidence from './collections/evidence.json'
import deviations from './collections/deviations.json'
import holds from './collections/holds.json'
import summaries from './collections/summaries.json'
import reports from './collections/reports.json'
import parts from './collections/parts.json'
import notifications from './collections/notifications.json'
import commands from './collections/commands.json'
import events from './collections/events.json'
import audit from './collections/audit.json'
import schedules from './collections/schedules.json'
import featureControls from './collections/feature-controls.json'
import entitlements from './collections/entitlements.json'
import aiRequests from './collections/ai-requests.json'
import accessSessions from './collections/access-sessions.json'
import tours from './collections/tours.json'
import approvalRequests from './collections/approval-requests.json'

const RAW: Readonly<Record<CollectionName, readonly unknown[]>> = {
  tenants,
  users,
  roles,
  'role-grants': roleGrants,
  sites,
  areas,
  locations,
  shifts,
  workers,
  qualifications,
  'qualification-grants': qualificationGrants,
  devices,
  'workflow-definitions': workflowDefinitions,
  'work-instructions': workInstructions,
  'content-blocks': contentBlocks,
  training,
  specifications,
  evaluations,
  packages,
  jobs,
  runs,
  'unit-executions': unitExecutions,
  'step-executions': stepExecutions,
  captures,
  evidence,
  deviations,
  holds,
  summaries,
  reports,
  parts,
  notifications,
  commands,
  events,
  audit,
  schedules,
  'feature-controls': featureControls,
  entitlements,
  'ai-requests': aiRequests,
  'access-sessions': accessSessions,
  tours,
  'approval-requests': approvalRequests,
}

export interface BootResult {
  readonly repository: Repository
  readonly bootstrap: BootstrapResult
  /**
   * Exposed for callers that build their own `AccessContext` (the scratch
   * verification route; later, real sign-in wiring) and need
   * `@/data/repository#scenarioStateFor` to derive `AccessContext.state`
   * from the same store the repository reads. Not part of the `Repository`
   * door itself — nothing here lets a caller bypass it to mutate a
   * collection directly.
   */
  readonly store: Store
}

/**
 * Validates every seed row against its own zod schema, exactly as
 * `scripts/validate-collections.mjs` does, and throws naming every problem
 * if any row fails — a seed that does not validate must never become a
 * running store (§12.6: "fails the build on a seed that does not
 * validate"). Returns the row set unchanged from the JSON on disk
 * otherwise: this is validation, not a second data-shaping pass.
 */
function loadAndValidateSeed(): CollectionData {
  const problems: string[] = []
  const seed = {} as Record<CollectionName, readonly unknown[]>

  for (const name of Object.keys(COLLECTIONS) as CollectionName[]) {
    const def = COLLECTIONS[name]
    const rows = RAW[name]
    const valid: unknown[] = []
    rows.forEach((row, i) => {
      const parsed = def.schema.safeParse(row)
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          problems.push(`${name}[${i}] ${issue.path.join('.') || '(root)'}: ${issue.message}`)
        }
        return
      }
      valid.push(parsed.data)
    })
    seed[name] = valid
  }

  if (problems.length > 0) {
    throw new Error(`boot(): the seed failed schema validation —\n${problems.join('\n')}`)
  }
  return seed as CollectionData
}

/**
 * Task 5 (closure sweep) — row-by-row validates a snapshot read back from
 * IndexedDB against the SAME zod schemas `loadAndValidateSeed` runs on the
 * seed above. `bootstrapStorage`'s own checksum only fingerprints the
 * SCHEMA (store names/version); it says nothing about whether the CONTENT
 * sitting in `snapshots` still matches this build's row shapes (data
 * written by an older build, or a hand-edited/corrupted record). Any single
 * row failing means the WHOLE snapshot is discarded — never a partial mix
 * of rehydrated and reseeded collections; this is a hard invariant, not a
 * best-effort one, so this function returns `null` rather than a
 * partially-filled `CollectionData` on any failure. Never throws: `raw` is
 * `unknown` precisely because it is untrusted input.
 */
function validateSnapshot(raw: unknown): CollectionData | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null
  const record = raw as Record<string, unknown>
  const validated = {} as Record<CollectionName, readonly unknown[]>

  for (const name of Object.keys(COLLECTIONS) as CollectionName[]) {
    const rows = record[name]
    if (!Array.isArray(rows)) return null
    const def = COLLECTIONS[name]
    const valid: unknown[] = []
    for (const row of rows) {
      const parsed = def.schema.safeParse(row)
      if (!parsed.success) return null
      valid.push(parsed.data)
    }
    validated[name] = valid
  }
  return validated as CollectionData
}

/** Generated-id prefixes `store.nextSequence()` feeds (`repository.ts`'s `inviteConsoleUser`/`createTenantUser`/`assignTenantRole`). */
const GENERATED_ID_PREFIXES = ['RG-INVITE-', 'RG-CREATE-', 'RG-ASSIGN-'] as const

/**
 * Fallback only, for the rare case a restored snapshot has no usable
 * `SEQUENCE_KEY` value (one committed before this field existed, or a
 * corrupted one) — `resolveSequence` below prefers the persisted value
 * whenever it is present, exactly because reverse-parsing generated ids is
 * more fragile than the value `commitToPersistence` has already committed
 * alongside the snapshot.
 *
 * Scans ONLY `role-grants`' three `RG-` prefixes, not every generated-id
 * shape `store.nextSequence()` feeds elsewhere (`SITE-`, `AREA-`, `LOC-`,
 * `SHIFT-`, `WRK-`, `USR-${tenantId}-`, `QUAL-`, `DEV-${tenantId}-`,
 * `USR-INVITE-`, ...) — it can underestimate the true floor for a legacy
 * snapshot whose highest-numbered generated id lives in one of those other
 * collections rather than in `role-grants`. Acceptable for a fallback of a
 * fallback (only reachable for a snapshot saved before `SEQUENCE_KEY`
 * existed); not a general-purpose "derive the sequence" scan.
 */
function deriveSequenceFromIds(data: CollectionData): number {
  let max = 0
  for (const row of data['role-grants']) {
    const id = typeof (row as { id?: unknown }).id === 'string' ? (row as { id: string }).id : ''
    for (const prefix of GENERATED_ID_PREFIXES) {
      if (!id.startsWith(prefix)) continue
      const n = Number(id.slice(prefix.length))
      if (Number.isInteger(n) && n > max) max = n
    }
  }
  return max
}

function resolveSequence(sequenceRaw: unknown, validated: CollectionData): number {
  if (typeof sequenceRaw === 'number' && Number.isInteger(sequenceRaw) && sequenceRaw >= 0) {
    return sequenceRaw
  }
  return deriveSequenceFromIds(validated)
}

/**
 * Boots the repository: validate → build the in-memory store from the seed
 * → establish (through the existing persistence bridge, never a second one)
 * how durable this environment's IndexedDB actually is → if that came back
 * `ready-durable`, attempt to rehydrate the store from whatever the last
 * successful write durably committed (Task 5, closure sweep — the
 * persistence built for §12.4 was write-only until this step; see
 * `./repository#readLatestSnapshot` and `validateSnapshot` above for why a
 * read snapshot is never partially trusted). `indexedDbFactory` defaults to
 * `window.indexedDB` where one exists and to `null` otherwise (a server
 * render, or a browser with no IndexedDB at all) — `bootstrapStorage`
 * already has a typed, non-throwing exit for that case (`ephemeral-preview`).
 *
 * `createStore(seed)` always runs first, and `store.restore(...)` — not a
 * `createStore` override — is what applies a valid rehydrated snapshot: the
 * store's own `initialSeed` (what `Repository.reset()` returns to via
 * `resetToSeed()`) must stay the true §3.1 seed, never whatever was last
 * saved, or "reset" would silently stop meaning "reset."
 */
export async function boot(indexedDbFactory?: IDBFactory | null): Promise<BootResult> {
  const seed = loadAndValidateSeed()
  const store = createStore(seed)
  const factory = indexedDbFactory ?? (typeof indexedDB !== 'undefined' ? indexedDB : null)
  const bootstrap = await bootstrapStorage(factory)

  if (bootstrap.state === 'ready-durable') {
    const raw = await readLatestSnapshot(factory)
    const validated = raw ? validateSnapshot(raw.snapshot) : null
    if (raw && validated) {
      store.restore(validated)
      store.seedSequence(resolveSequence(raw.sequence, validated))
    }
  }

  // Fix round 1 (§12.4): the repository needs the SAME factory `bootstrapStorage`
  // just resolved, plus the durability it established, to commit a write
  // through `@/persistence/schema#openDatabase` later -- never a second,
  // independently-resolved persistence path.
  const repository = createRepository(store, {
    factory,
    capability: { state: bootstrap.state, durable: bootstrap.durable },
  })
  return { repository, bootstrap, store }
}
