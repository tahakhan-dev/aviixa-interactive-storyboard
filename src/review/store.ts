import { REVIEW_STORES } from '@/persistence/schema'
import type { ReviewRecord } from './records'

type ReviewStoreName = (typeof REVIEW_STORES)[number]

const REVIEW_RECORDS_STORE: ReviewStoreName = 'reviewRecords'
const REVIEW_EVENTS_STORE: ReviewStoreName = 'reviewEvents'

/**
 * The one place any function below reaches into a review transaction for an
 * object store. Its `name` parameter is typed against `ReviewStoreName` --
 * the literal union of `REVIEW_STORES` -- so naming a product store here
 * (e.g. `'snapshots'`) is a compile error, not a runtime mistake that could
 * slip a client-review write into product truth.
 */
function reviewObjectStore(tx: IDBTransaction, name: ReviewStoreName): IDBObjectStore {
  return tx.objectStore(name)
}

/**
 * Opens a `readwrite`/`readonly` transaction spanning ONLY `REVIEW_STORES`
 * -- never a product store alongside it -- runs `run` against it, and
 * resolves once the transaction completes. Matches the persistence
 * coordinator's contract (`@/persistence/coordinator`): never throws, never
 * rejects. A closed database throws synchronously from `db.transaction(...)`
 * -- caught here and treated the same as any other transaction failure, so
 * a caller always gets a resolved `Promise<void>` rather than a rejection.
 */
function runReviewTransaction(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  run: (tx: IDBTransaction) => void,
): Promise<void> {
  return new Promise((resolve) => {
    let settled = false
    const settle = (): void => {
      if (settled) return
      settled = true
      resolve()
    }

    let tx: IDBTransaction
    try {
      tx = db.transaction([...REVIEW_STORES], mode)
    } catch {
      settle()
      return
    }
    tx.oncomplete = settle
    tx.onerror = settle
    tx.onabort = settle

    try {
      run(tx)
    } catch {
      settle()
    }
  })
}

export function putReviewRecord(db: IDBDatabase, record: ReviewRecord): Promise<void> {
  return runReviewTransaction(db, 'readwrite', (tx) => {
    reviewObjectStore(tx, REVIEW_RECORDS_STORE).put(record)
  })
}

/** Clears both review stores. Never touches a product store. */
export function resetReview(db: IDBDatabase): Promise<void> {
  return runReviewTransaction(db, 'readwrite', (tx) => {
    reviewObjectStore(tx, REVIEW_RECORDS_STORE).clear()
    reviewObjectStore(tx, REVIEW_EVENTS_STORE).clear()
  })
}

export function listReviewRecords(db: IDBDatabase): Promise<readonly ReviewRecord[]> {
  return new Promise((resolve) => {
    let settled = false
    const settle = (records: readonly ReviewRecord[]): void => {
      if (settled) return
      settled = true
      resolve(records)
    }

    let tx: IDBTransaction
    try {
      tx = db.transaction([...REVIEW_STORES], 'readonly')
    } catch {
      settle([])
      return
    }
    tx.onerror = () => settle([])
    tx.onabort = () => settle([])

    try {
      const req = reviewObjectStore(tx, REVIEW_RECORDS_STORE).getAll()
      req.onsuccess = () => settle((req.result as ReviewRecord[] | undefined) ?? [])
      req.onerror = () => settle([])
    } catch {
      settle([])
    }
  })
}
