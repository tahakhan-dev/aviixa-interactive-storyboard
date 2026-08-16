import type { CommittedTransition, ProposedTransition } from '@/domain/transition'
import { errorMessage, STORES } from './schema'

/** Out-of-line key `commitTransition` stores the current snapshot under. */
const SNAPSHOT_STORE = 'snapshots' satisfies (typeof STORES)[number]

/**
 * Ledger arrays on `ProposedTransition` happen to share their property name
 * with the object store they belong in. `satisfies` ties this list to
 * `STORES` so a typo here is a compile error, not a silently-dropped write.
 */
const LEDGER_KEYS = ['audit', 'events', 'commands', 'notifications', 'schedules'] as const satisfies readonly (typeof STORES)[number][]

export interface PersistenceFailure {
  readonly reason: string
}

export type CommitResult =
  | { readonly ok: true; readonly committed: CommittedTransition }
  | { readonly ok: false; readonly failure: PersistenceFailure }

function refuse(reason: string): CommitResult {
  return { ok: false, failure: { reason } }
}

/**
 * Commits `proposed` in exactly ONE `readwrite` IndexedDB transaction: the
 * next snapshot plus every ledger record it carries. Resolves `ok: true`
 * only once the transaction's own `oncomplete` fires -- never on a resolved
 * `put()` request, which is not durability. Resolves `ok: false` on
 * `onerror`/`onabort` (or a synchronous `put()` throw, which this function
 * turns into an explicit `transaction.abort()` so nothing that transaction
 * already wrote survives). Never throws: every failure path resolves a
 * typed `CommitResult`, matching the platform rule that the kernel and
 * coordinator never reject with an exception.
 *
 * MOD-DOH-17: "an action that cannot be audited does not happen." If any
 * record -- audit included -- cannot be written, the whole transaction is
 * aborted and NOTHING from it is visible: not the snapshot, not any other
 * store's records from the same commit.
 */
export function commitTransition(
  db: IDBDatabase,
  proposed: ProposedTransition,
): Promise<CommitResult> {
  if (proposed.status !== 'accepted' || proposed.nextState === null) {
    return Promise.resolve(
      refuse('Refused: only a transition with status "accepted" and a non-null nextState may be committed.'),
    )
  }
  const nextState = proposed.nextState

  return new Promise((resolve) => {
    let settled = false
    const settle = (result: CommitResult) => {
      if (settled) return
      settled = true
      resolve(result)
    }

    let tx: IDBTransaction
    try {
      tx = db.transaction([SNAPSHOT_STORE, ...LEDGER_KEYS], 'readwrite')
    } catch (err) {
      settle(refuse(`Could not open the commit transaction: ${errorMessage(err)}`))
      return
    }

    // Set before an abort reason from a caught synchronous throw, if any.
    let abortReason: string | null = null

    tx.onabort = () => {
      settle(refuse(abortReason ?? `Transaction aborted: ${errorMessage(tx.error)}`))
    }
    tx.onerror = (event) => {
      // A request-level error that isn't handled/prevented aborts the
      // transaction automatically; onabort above resolves the failure. This
      // handler exists so an unhandled error event never becomes an
      // unhandled promise rejection or a thrown exception here.
      event.preventDefault?.()
    }
    tx.oncomplete = () => {
      settle({
        ok: true,
        committed: { ...proposed, nextState, committed: true, committedState: nextState },
      })
    }

    try {
      tx.objectStore(SNAPSHOT_STORE).put(nextState, nextState.sequence)
      for (const key of LEDGER_KEYS) {
        const store = tx.objectStore(key)
        for (const record of proposed[key]) {
          store.put(record)
        }
      }
    } catch (err) {
      abortReason = `A record could not be written: ${errorMessage(err)}`
      try {
        tx.abort()
      } catch {
        // Transaction may already be finishing/aborted; onabort/onerror
        // above still resolves the typed failure either way.
      }
    }
  })
}
