import { canonicalSerialize } from '@/domain/hash'
import type { LedgerRecord, ScenarioDomainState } from '@/domain/state'
import type { CommittedTransition, ProposedTransition } from '@/domain/transition'
import { errorMessage, STORES } from './schema'

/** Out-of-line key `commitTransition` stores the current snapshot under. */
const SNAPSHOT_STORE = 'snapshots' satisfies (typeof STORES)[number]
const IDEMPOTENCY_STORE = 'idempotency' satisfies (typeof STORES)[number]

/**
 * Ledger arrays on `ProposedTransition` happen to share their property name
 * with the object store they belong in. `satisfies` ties this list to
 * `STORES` so a typo here is a compile error, not a silently-dropped write.
 */
const LEDGER_KEYS = ['audit', 'events', 'commands', 'notifications', 'schedules'] as const satisfies readonly (typeof STORES)[number][]

/**
 * Compile-time exhaustiveness check: every field on `ProposedTransition`
 * typed `readonly LedgerRecord[]` must appear in `LEDGER_KEYS`. Without
 * this, a later slice adding e.g. `captures: readonly LedgerRecord[]` to
 * `ProposedTransition` would compile fine while `commitTransition` silently
 * never wrote a single capture record -- a success result with a missing
 * required record, which is exactly what the one-transaction guarantee
 * forbids. If this line stops compiling, add the new field's name to
 * `LEDGER_KEYS` (and write it inside the transaction below).
 */
type LedgerArrayKeys = {
  [K in keyof ProposedTransition]: ProposedTransition[K] extends readonly LedgerRecord[] ? K : never
}[keyof ProposedTransition]
type KeysMatch<A extends string, B extends string> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
const _ledgerKeysMatchProposedTransition: KeysMatch<(typeof LEDGER_KEYS)[number], LedgerArrayKeys> = true
void _ledgerKeysMatchProposedTransition

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
 * Domain state carries time only as a Clock-issued number and holds no
 * class instances (RULING: hash.ts throws on Date/Map/Set/RegExp/instances
 * and non-finite numbers). `canonicalSerialize` is exactly that check, and
 * it is synchronous, so this runs BEFORE the transaction ever opens: a
 * value the audit chain's `hashState` could never process later must not
 * be written now, however successfully IndexedDB's structured clone would
 * have accepted it (which is a strictly looser check -- it happily clones
 * a Date or a Map, which is precisely what must never reach the ledger).
 */
function firstNonPlainDataReason(nextState: ScenarioDomainState, records: readonly LedgerRecord[]): string | null {
  try {
    canonicalSerialize(nextState)
    for (const record of records) canonicalSerialize(record)
    return null
  } catch (err) {
    return errorMessage(err)
  }
}

/**
 * Commits `proposed` in exactly ONE `readwrite` IndexedDB transaction: the
 * next snapshot plus every ledger record it carries, plus an idempotency
 * marker when `proposed.idempotencyKey` is set. Resolves `ok: true` only
 * once the transaction's own `oncomplete` fires -- never on a resolved
 * `put()`/`add()` request, which is not durability. Never throws: every
 * failure path -- a non-accepted proposal, non-plain-data, a transaction
 * that could not open, or the transaction aborting for any reason -- resolves
 * a typed `CommitResult`, matching the platform rule that the kernel and
 * coordinator never reject with an exception or throw synchronously.
 *
 * MOD-DOH-17: "an action that cannot be audited does not happen." If any
 * record -- audit included -- cannot be written, the whole transaction is
 * aborted and NOTHING from it is visible: not the snapshot, not any other
 * store's records from the same commit. This holds for BOTH failure
 * mechanisms IndexedDB has: a synchronous `put()`/`add()` throw (e.g. a
 * non-cloneable value slipping past the pre-check) is caught and turned
 * into an explicit `transaction.abort()`; an asynchronous request `error`
 * event (e.g. a duplicate idempotency key, quota exhaustion mid-write) is
 * left to run its DEFAULT action -- which IS aborting the transaction --
 * by never calling `preventDefault()` on it. Calling `preventDefault()`
 * there was the bug a prior version of this file had: it cancels the very
 * abort this guarantee depends on, so the async path resolved `ok: true`
 * with the audit record silently missing. See tests/unit/coordinator.test.ts
 * for the regression test.
 */
export function commitTransition(
  db: IDBDatabase,
  proposed: ProposedTransition,
): Promise<CommitResult> {
  if (!proposed || proposed.status !== 'accepted' || proposed.nextState === null) {
    return Promise.resolve(
      refuse('Refused: only a transition with status "accepted" and a non-null nextState may be committed.'),
    )
  }
  const nextState = proposed.nextState

  const allLedgerRecords = LEDGER_KEYS.flatMap((key) => proposed[key])
  const nonPlainReason = firstNonPlainDataReason(nextState, allLedgerRecords)
  if (nonPlainReason !== null) {
    return Promise.resolve(refuse(`Refused: not plain data -- ${nonPlainReason}`))
  }

  return new Promise((resolve) => {
    let settled = false
    const settle = (result: CommitResult) => {
      if (settled) return
      settled = true
      resolve(result)
    }

    let tx: IDBTransaction
    try {
      tx = db.transaction([SNAPSHOT_STORE, IDEMPOTENCY_STORE, ...LEDGER_KEYS], 'readwrite')
    } catch (err) {
      settle(refuse(`Could not open the commit transaction: ${errorMessage(err)}`))
      return
    }

    // Set from either a caught synchronous throw or an async request-error
    // event, whichever happens first -- both feed the same failure message.
    let abortReason: string | null = null

    tx.onabort = () => {
      settle(refuse(abortReason ?? `Transaction aborted: ${errorMessage(tx.error)}`))
    }
    tx.onerror = (event) => {
      // A request-level error event bubbles here. Its DEFAULT ACTION is to
      // abort the transaction -- do NOT call preventDefault(): doing so
      // cancels that abort and lets the transaction complete with whatever
      // partial writes already succeeded, which is exactly the "visible
      // success with a missing audit record" this guarantee forbids. Just
      // record the reason and let onabort (above) resolve the failure once
      // the default abort actually happens.
      const target = event.target as IDBRequest | null
      abortReason ??= `A record could not be written: ${errorMessage(target?.error ?? tx.error)}`
    }
    tx.oncomplete = () => {
      settle({
        ok: true,
        committed: { ...proposed, nextState, committed: true, committedState: nextState },
      })
    }

    try {
      // `add`, not `put`: `sequence` is monotonic domain state, not a slot
      // to overwrite. Re-committing an already-written sequence is a bug
      // (or a replay) and must fail loudly, not silently clobber prior
      // visible truth.
      tx.objectStore(SNAPSHOT_STORE).add(nextState, nextState.sequence)
      for (const key of LEDGER_KEYS) {
        const store = tx.objectStore(key)
        for (const record of proposed[key]) {
          store.put(record)
        }
      }
      if (proposed.idempotencyKey != null) {
        // `add`, not `put`: a duplicate idempotency key means this exact
        // transition was already committed -- replay protection, not an
        // upsert. The collision surfaces as an async ConstraintError on
        // this request, which aborts the whole transaction via onerror
        // above (never via preventDefault).
        tx.objectStore(IDEMPOTENCY_STORE).add(
          { correlationId: proposed.correlationId, sequence: nextState.sequence },
          proposed.idempotencyKey,
        )
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
