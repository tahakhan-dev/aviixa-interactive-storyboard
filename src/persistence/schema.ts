export const DB_NAME = 'aviixa-storyboard'
export const DB_VERSION = 1

/**
 * Every object store the app persists to, in one declared list. Ledger
 * stores (`audit`, `events`, `commands`, `notifications`, `schedules`) mirror
 * `LedgerRecord`'s shape and are keyed in-line on `id`. `snapshots` and
 * `meta` hold single/keyed descriptor records with no natural `id` field of
 * their own, so they use out-of-line keys supplied by the caller.
 * `idempotency` is keyed out-of-line on the idempotency key itself, so the
 * coordinator can `add()` (not `put()`) it and let a duplicate key -- a
 * replayed transition -- fail as a real key-collision instead of silently
 * overwriting the record of the transition it already committed.
 */
export const STORES = [
  'snapshots',
  'audit',
  'events',
  'commands',
  'notifications',
  'schedules',
  'captures',
  'idempotency',
  'reviewRecords',
  'reviewEvents',
  'meta',
] as const

export type StoreName = (typeof STORES)[number]

const OUT_OF_LINE_STORES: ReadonlySet<StoreName> = new Set(['snapshots', 'meta', 'idempotency'])

function storeOptionsFor(store: StoreName): IDBObjectStoreParameters | undefined {
  return OUT_OF_LINE_STORES.has(store) ? undefined : { keyPath: 'id' }
}

/** Thrown by `openDatabase` when the `open()` request reports `blocked`. */
export class IndexedDbBlockedError extends Error {
  override readonly name = 'IndexedDbBlockedError'
}

/** Safely turn a caught value (Error, DOMException, or anything else) into a plain-language message. */
export function errorMessage(err: unknown): string {
  if (
    err &&
    typeof err === 'object' &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string'
  ) {
    return (err as { message: string }).message
  }
  return String(err)
}

/** Safely read `.name` off a caught DOMException/Error (e.g. `'QuotaExceededError'`), or `''`. */
export function errorName(err: unknown): string {
  if (err && typeof err === 'object' && 'name' in err && typeof (err as { name: unknown }).name === 'string') {
    return (err as { name: string }).name
  }
  return ''
}

/**
 * Opens (and, on first use, creates) the storyboard's IndexedDB database.
 * Resolves once the connection is ready; every declared store already
 * exists on the resolved database. Never throws -- rejects instead, so
 * callers (notably `bootstrapStorage`) can interpret the failure.
 */
export function openDatabase(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let req: IDBOpenDBRequest
    try {
      req = factory.open(DB_NAME, DB_VERSION)
    } catch (err) {
      reject(err)
      return
    }
    let blocked = false
    req.onupgradeneeded = () => {
      const db = req.result
      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, storeOptionsFor(store))
        }
      }
    }
    req.onblocked = () => {
      blocked = true
      reject(new IndexedDbBlockedError('IndexedDB open() blocked by another open connection'))
    }
    req.onsuccess = () => {
      // `blocked` fires before `success` when it fires at all, but the spec
      // allows success to still land later once the blocking connection
      // closes. We already rejected on the block -- nobody holds this
      // handle, so close it rather than leak an open connection.
      if (blocked) {
        req.result.close()
        return
      }
      resolve(req.result)
    }
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open() failed'))
  })
}
