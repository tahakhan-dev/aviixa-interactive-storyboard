import { hashState } from '@/domain/hash'
import { DB_NAME, DB_VERSION, STORES, errorMessage, errorName, openDatabase, IndexedDbBlockedError } from './schema'

export { STORES }

/**
 * The eight states that make up a healthy boot sequence, plus the six exits
 * a boot can end on instead. Every exit is reachable -- see
 * tests/unit/bootstrap.test.ts for one test per exit that actually drives
 * the FSM there, not merely a value declared in this union.
 */
export type StorageBootstrapState =
  | 'uninitialized'
  | 'client-mounted'
  | 'opening'
  | 'reading'
  | 'runtime-validating'
  | 'checksum-verifying'
  | 'migrating'
  | 'ready-durable'
  | 'upgrade-blocked'
  | 'persistence-denied'
  | 'quota-limited'
  | 'corrupt-quarantined'
  | 'migration-failed-read-only'
  | 'ephemeral-preview'

export interface BootstrapResult {
  readonly state: StorageBootstrapState
  readonly trace: readonly StorageBootstrapState[]
  /** Only `ready-durable` is durable. Everything else restricts what may happen. */
  readonly durable: boolean
  readonly reason: string | null
}

/** Out-of-line key the schema descriptor is stored under in the `meta` store. */
export const META_KEY = 'schema-descriptor'

interface SchemaDescriptor {
  readonly version: number
  readonly checksum: string
}

/**
 * The descriptor's checksum is a fingerprint of the schema this build knows
 * how to read -- the store list and its version. It has nothing to do with
 * the *content* of any tenant's data (which is opaque to bootstrap); it only
 * proves the descriptor record itself was written by, and matches, this
 * schema.
 */
function computeChecksum(): Promise<string> {
  return hashState({ db: DB_NAME, stores: [...STORES] })
}

function readMeta(db: IDBDatabase): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('meta', 'readonly')
    const req = tx.objectStore('meta').get(META_KEY)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('meta read failed'))
  })
}

function writeMeta(db: IDBDatabase, descriptor: SchemaDescriptor): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('meta', 'readwrite')
    tx.objectStore('meta').put(descriptor, META_KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('meta write failed'))
    tx.onabort = () => reject(tx.error ?? new Error('meta write aborted'))
  })
}

type MetaValidation =
  | { readonly kind: 'absent' }
  | { readonly kind: 'present'; readonly meta: SchemaDescriptor }
  | { readonly kind: 'invalid'; readonly reason: string }

function validateMeta(raw: unknown): MetaValidation {
  if (raw === undefined) return { kind: 'absent' }
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { kind: 'invalid', reason: 'Stored schema descriptor is not a plain object.' }
  }
  const record = raw as Record<string, unknown>
  if (typeof record.version !== 'number' || typeof record.checksum !== 'string') {
    return {
      kind: 'invalid',
      reason: 'Stored schema descriptor is missing a numeric version or string checksum.',
    }
  }
  return { kind: 'present', meta: { version: record.version, checksum: record.checksum } }
}

/**
 * Walks the storage boot sequence against `factory`, recording every state it
 * passes through. Never throws: every failure -- an absent factory, a
 * refused/blocked/quota-exhausted open, unreadable or malformed metadata, or
 * an unmigratable schema version -- resolves to a typed failure exit with a
 * plain-language `reason` instead. Only `ready-durable` sets `durable: true`.
 *
 * `factory` may be `undefined`/`null`: that models a client with no
 * IndexedDB implementation at all (as opposed to one that was asked and
 * refused), which exits straight to `ephemeral-preview` rather than a hard
 * failure -- there is nothing to retry or diagnose, just no capability.
 */
export async function bootstrapStorage(
  factory: IDBFactory | null | undefined,
): Promise<BootstrapResult> {
  const trace: StorageBootstrapState[] = ['uninitialized']
  const exit = (state: StorageBootstrapState, durable: boolean, reason: string | null): BootstrapResult => {
    trace.push(state)
    return { state, trace: [...trace], durable, reason }
  }

  trace.push('client-mounted')
  if (!factory) {
    return exit(
      'ephemeral-preview',
      false,
      'No IndexedDB implementation is available in this environment; running in a non-durable preview mode.',
    )
  }

  trace.push('opening')
  let db: IDBDatabase
  try {
    db = await openDatabase(factory)
  } catch (err) {
    if (err instanceof IndexedDbBlockedError) {
      return exit(
        'upgrade-blocked',
        false,
        'Another open connection is blocking the schema upgrade. Close other tabs and retry.',
      )
    }
    if (errorName(err) === 'QuotaExceededError') {
      return exit('quota-limited', false, `Storage quota exceeded while opening the database: ${errorMessage(err)}`)
    }
    return exit('persistence-denied', false, `IndexedDB refused to open: ${errorMessage(err)}`)
  }

  trace.push('reading')
  let metaRaw: unknown
  try {
    metaRaw = await readMeta(db)
  } catch (err) {
    db.close()
    return exit('persistence-denied', false, `Failed to read schema metadata: ${errorMessage(err)}`)
  }

  trace.push('runtime-validating')
  const validated = validateMeta(metaRaw)
  if (validated.kind === 'invalid') {
    db.close()
    return exit('corrupt-quarantined', false, validated.reason)
  }

  // A version mismatch is resolved (or not) during migration, before the
  // checksum is ever consulted -- a checksum computed against a schema
  // version this build doesn't recognise as current isn't meaningful to
  // compare in the first place.
  trace.push('migrating')
  if (validated.kind === 'absent') {
    try {
      await writeMeta(db, { version: DB_VERSION, checksum: await computeChecksum() })
    } catch (err) {
      db.close()
      if (errorName(err) === 'QuotaExceededError') {
        return exit('quota-limited', false, `Storage quota exceeded while initialising schema metadata: ${errorMessage(err)}`)
      }
      return exit('persistence-denied', false, `Failed to initialise schema metadata: ${errorMessage(err)}`)
    }
  } else if (validated.meta.version !== DB_VERSION) {
    db.close()
    return exit(
      'migration-failed-read-only',
      false,
      `No migration path from stored schema version ${validated.meta.version} to ${DB_VERSION}.`,
    )
  }

  trace.push('checksum-verifying')
  if (validated.kind === 'present') {
    const expected = await computeChecksum()
    if (validated.meta.checksum !== expected) {
      db.close()
      return exit(
        'corrupt-quarantined',
        false,
        'Stored schema checksum does not match this build; quarantining rather than trusting unverifiable data.',
      )
    }
  }

  db.close()
  return exit('ready-durable', true, null)
}
