import { REVIEW_STORES, errorMessage } from '@/persistence/schema'
import type { ReviewRecord } from './records'

/**
 * FAILURE-SIGNALLING CONVENTION for this module (I8, final review — the
 * codebase's failure signalling had drifted: the gateway (`@/scenario/
 * gateway`) and package import (`@/review/package`) return typed results;
 * this module used to return `Promise<void>` and settle identically on
 * `oncomplete`, `onerror` AND `onabort`, so an unstorable record resolved
 * with nothing written and no signal at all — exactly the "silent catch"
 * §8 forbids).
 *
 * Documented once here so slices 3-13 do not each invent a different rule:
 *
 *   - Any function that crosses an IO boundary (IndexedDB, in this module)
 *     NEVER throws or rejects. It always resolves to a typed result object
 *     discriminated by `ok`: `{ ok: true, ...data }` or
 *     `{ ok: false, reason: string }`. A caller can always tell success
 *     from failure without a try/catch.
 *   - A synchronous function that only validates a caller-controlled
 *     argument against a precondition (e.g. `createReviewRecord`'s
 *     non-empty-comment rule, `branchFrom`'s range check) MAY throw: that
 *     failure is a programming error in the immediate, synchronous caller,
 *     not a runtime/environment failure, so a typed result would only add
 *     ceremony around what should already be caught in development.
 */
export type ReviewStoreResult = { readonly ok: true } | { readonly ok: false; readonly reason: string }

export type ListReviewRecordsResult =
  | { readonly ok: true; readonly records: readonly ReviewRecord[] }
  | { readonly ok: false; readonly reason: string }

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
 * resolves once the transaction settles. Matches the persistence
 * coordinator's contract (`@/persistence/coordinator`) and the gateway's
 * (`@/scenario/gateway`): never throws, never rejects -- but (I8, final
 * review) UNLIKE the version this replaces, `oncomplete` now resolves
 * `{ ok: true }` while `onerror`/`onabort`/a synchronous throw resolve
 * `{ ok: false, reason }`, so a caller can tell a real write from a failed
 * one instead of both looking identical.
 */
function runReviewTransaction(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  run: (tx: IDBTransaction) => void,
): Promise<ReviewStoreResult> {
  return new Promise((resolve) => {
    let settled = false
    const settle = (result: ReviewStoreResult): void => {
      if (settled) return
      settled = true
      resolve(result)
    }

    let tx: IDBTransaction
    try {
      tx = db.transaction([...REVIEW_STORES], mode)
    } catch (err) {
      settle({ ok: false, reason: `Could not open a review transaction: ${errorMessage(err)}` })
      return
    }
    tx.oncomplete = () => settle({ ok: true })
    tx.onerror = () =>
      settle({ ok: false, reason: `The review transaction failed: ${errorMessage(tx.error)}` })
    tx.onabort = () =>
      settle({ ok: false, reason: `The review transaction was aborted: ${errorMessage(tx.error)}` })

    try {
      run(tx)
    } catch (err) {
      settle({ ok: false, reason: `The review transaction threw: ${errorMessage(err)}` })
    }
  })
}

export function putReviewRecord(db: IDBDatabase, record: ReviewRecord): Promise<ReviewStoreResult> {
  return runReviewTransaction(db, 'readwrite', (tx) => {
    reviewObjectStore(tx, REVIEW_RECORDS_STORE).put(record)
  })
}

/** Clears both review stores. Never touches a product store. */
export function resetReview(db: IDBDatabase): Promise<ReviewStoreResult> {
  return runReviewTransaction(db, 'readwrite', (tx) => {
    reviewObjectStore(tx, REVIEW_RECORDS_STORE).clear()
    reviewObjectStore(tx, REVIEW_EVENTS_STORE).clear()
  })
}

export function listReviewRecords(db: IDBDatabase): Promise<ListReviewRecordsResult> {
  return new Promise((resolve) => {
    let settled = false
    const settle = (result: ListReviewRecordsResult): void => {
      if (settled) return
      settled = true
      resolve(result)
    }

    let tx: IDBTransaction
    try {
      tx = db.transaction([...REVIEW_STORES], 'readonly')
    } catch (err) {
      settle({ ok: false, reason: `Could not open a review transaction: ${errorMessage(err)}` })
      return
    }
    tx.onerror = () =>
      settle({ ok: false, reason: `The review transaction failed: ${errorMessage(tx.error)}` })
    tx.onabort = () =>
      settle({ ok: false, reason: `The review transaction was aborted: ${errorMessage(tx.error)}` })

    try {
      const req = reviewObjectStore(tx, REVIEW_RECORDS_STORE).getAll()
      req.onsuccess = () =>
        settle({ ok: true, records: (req.result as ReviewRecord[] | undefined) ?? [] })
      req.onerror = () =>
        settle({ ok: false, reason: `Could not read review records: ${errorMessage(req.error)}` })
    } catch (err) {
      settle({ ok: false, reason: `The review transaction threw: ${errorMessage(err)}` })
    }
  })
}
