'use client'

import { useEffect, useState } from 'react'
import {
  REVIEW_STATUSES,
  REVIEW_SEVERITIES,
  createReviewRecord,
  type ReviewStatus,
  type ReviewSeverity,
  type ReviewRecord,
} from '@/review/records'
import { putReviewRecord, listReviewRecords } from '@/review/store'
import { bootstrapStorage } from '@/persistence/bootstrap'
import { openDatabase } from '@/persistence/schema'
import { fixedClock } from '@/domain/clock'
import { SURFACES, type SurfaceId } from '@/domain/surfaces'
import { Button, Field, Select, Banner } from '@/ui/primitives'

// Deliberately never "Approve": the frozen source's own product review chain
// (Author -> Reviewer -> Release Authority) grants Workflow approval, Job
// approval, Quality release and production authorisation -- none of that
// vocabulary belongs to a client-review comment on this storyboard.
const STATUS_ACTION_LABEL: Record<ReviewStatus, string> = {
  'accepted-for-review': 'Accept for client review',
  'needs-change': 'Needs change',
  question: 'Question',
  comment: 'Comment',
}

// Fix round 1 (review, Major 1): `severity` used to be hardcoded to
// 'minor' on every submission -- a real vocabulary member with no control
// behind it, so a blocking defect was exported as 'minor' and no one could
// tell from this shell. A reviewer's own assessment of how much a comment
// matters, per `ReviewSeverity`'s doc comment in `@/review/records`.
const SEVERITY_LABEL: Record<ReviewSeverity, string> = {
  blocking: 'Blocking',
  major: 'Major',
  minor: 'Minor',
  question: 'Needs clarification',
}

/**
 * BLOCKING 4 (final review): this page used to keep every review record in
 * `useState` only and never call `putReviewRecord` -- notes vanished on
 * reload while the page told the reviewer they were "kept separately from
 * the product's own audit trail," which was false; they were kept nowhere.
 *
 * `checking` covers the one render before the effect below has resolved
 * `bootstrapStorage` -- during that window this shell does not yet know
 * whether it can save, so it says neither "saved" nor "not saved."
 */
type StorageMode =
  | { readonly kind: 'checking' }
  | { readonly kind: 'durable'; readonly db: IDBDatabase }
  | { readonly kind: 'not-durable'; readonly reason: string }

export default function ReviewPage() {
  // Review-record timestamps are deliberately outside the kernel's
  // determinism constraint (see `createReviewRecord`'s doc comment in
  // `@/review/records`), so a wall-clock-seeded `fixedClock` is fine here --
  // this is never fed through `reduce` or hashed into a scenario snapshot.
  const [clock] = useState(() => fixedClock(Date.now()))
  const [reviewerLabel, setReviewerLabel] = useState('')
  const [surface, setSurface] = useState<SurfaceId>(SURFACES[0]?.id ?? 'SURF-SA')
  const [severity, setSeverity] = useState<ReviewSeverity>('minor')
  const [note, setNote] = useState('')
  const [records, setRecords] = useState<readonly ReviewRecord[]>([])
  const [error, setError] = useState<string | undefined>(undefined)
  const [storage, setStorage] = useState<StorageMode>({ kind: 'checking' })

  // Runs once, client-side only (never during the static-export prerender
  // pass, which has no `indexedDB`). Opens the SAME database the gateway
  // and every other persistence-layer consumer use, via the same
  // `bootstrapStorage` readiness gate the rest of the app is bound by --
  // this shell gets no special, unvalidated path to storage.
  useEffect(() => {
    let cancelled = false
    // Fix round 1 (review, root cause behind Major 1's test hanging): the
    // cleanup below used to only set `cancelled = true`. It had no way to
    // reach the opened `IDBDatabase` -- `db` was scoped to `init()`, not
    // this effect -- so once `storage.kind` became 'durable' the
    // connection was NEVER closed on unmount, only in the narrow race
    // where cleanup ran before the open resolved. A leaked connection
    // blocks a later `indexedDB.deleteDatabase(...)` indefinitely (proven:
    // a second component test that submits a durable-path note right
    // after this page's existing one hung past an 8s wait, and even the
    // test file's own un-awaited-then-awaited cleanup hook timed out at
    // 10s). Tracking the db in the effect's own scope lets cleanup close
    // it unconditionally.
    let openedDb: IDBDatabase | undefined

    async function init(): Promise<void> {
      const factory = typeof indexedDB === 'undefined' ? null : indexedDB
      const boot = await bootstrapStorage(factory)
      if (cancelled) return

      if (!boot.durable || factory === null) {
        setStorage({
          kind: 'not-durable',
          reason:
            boot.reason ?? 'IndexedDB is not available in this browser, so notes are not being saved.',
        })
        return
      }

      let db: IDBDatabase
      try {
        db = await openDatabase(factory)
      } catch {
        if (!cancelled) {
          setStorage({
            kind: 'not-durable',
            reason: 'The review database could not be opened, so notes are not being saved.',
          })
        }
        return
      }
      if (cancelled) {
        db.close()
        return
      }
      openedDb = db
      setStorage({ kind: 'durable', db })

      const listed = await listReviewRecords(db)
      if (!cancelled && listed.ok) setRecords(listed.records)
    }

    void init()
    return () => {
      cancelled = true
      openedDb?.close()
    }
  }, [])

  async function submit(status: ReviewStatus): Promise<void> {
    let record: ReviewRecord
    try {
      record = createReviewRecord(
        {
          anchorType: 'surface',
          anchorId: surface,
          surface,
          reviewerLabel: reviewerLabel.trim() === '' ? 'Unnamed reviewer' : reviewerLabel,
          status,
          severity,
          comment: note,
          // This shell is not yet wired to a live scenario snapshot or
          // build pipeline (that wiring is deferred); these three fields
          // say so plainly rather than fabricate a fingerprint or hash.
          sourceFingerprint: 'not-wired-in-this-storyboard',
          scenarioVersion: 'not-wired-in-this-storyboard',
          buildHash: 'not-wired-in-this-storyboard',
        },
        clock,
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'This review note could not be recorded.')
      return
    }

    if (storage.kind !== 'durable') {
      // Honest, not aspirational: storage is not ready, so this note is
      // shown in-session (so the reviewer sees their own input reflected)
      // but is NOT claimed to be saved anywhere.
      setError(
        storage.kind === 'checking'
          ? 'This note is not yet saved: storage is still starting up.'
          : `This note was not saved: ${storage.reason}`,
      )
      setRecords((prev) => [...prev, record])
      setNote('')
      return
    }

    const result = await putReviewRecord(storage.db, record)
    if (!result.ok) {
      setError(`This review note could not be saved: ${result.reason}`)
      return
    }
    setRecords((prev) => [...prev, record])
    setNote('')
    setError(undefined)
  }

  return (
    <main id="main" className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-sm font-medium tracking-wide text-[var(--color-ink-subtle)]">AVIIXA</p>
      <h1 className="mt-2 text-3xl font-semibold">Review</h1>
      <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">
        Simulated behaviour only. This storyboard is a client-validation
        prototype, not a connected production system.
      </p>
      {/*
        This sentence is true regardless of storage state: a review record
        is storyboard metadata, never a product audit record, whether or
        not it happens to be saved anywhere. The DURABILITY claim -- whether
        it is actually saved -- is the part that must depend on real storage
        state (BLOCKING 4, final review), so it is a separate paragraph below.
      */}
      <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">
        Review records left here are storyboard metadata, kept separately
        from the product&apos;s own audit trail. Accepting a screen for
        client review only marks this storyboard page as reviewed; it is not
        a product audit and never a business-state transition.
      </p>
      {storage.kind === 'durable' ? (
        <p className="mt-2 max-w-prose text-[var(--color-ink-muted)]">
          These notes are saved to this browser&apos;s local storage.
        </p>
      ) : storage.kind === 'checking' ? (
        <p className="mt-2 max-w-prose text-[var(--color-ink-muted)]">
          Checking whether this browser can save these notes durably…
        </p>
      ) : (
        <div className="mt-4">
          <Banner
            tone="attention"
            heading="These notes are not being saved"
            body={`${storage.reason} Notes typed below will be shown for this session only and will not survive a reload.`}
          />
        </div>
      )}

      {error !== undefined ? (
        <div className="mt-4">
          <Banner tone="attention" heading="This review note was not recorded" body={error} />
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        <Field label="Reviewer name">
          <input
            value={reviewerLabel}
            onChange={(e) => setReviewerLabel(e.target.value)}
            className="w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-2 text-sm text-[var(--color-ink)]"
          />
        </Field>

        <Select
          label="Which surface this note is about"
          value={surface}
          onChange={(v) => setSurface(v as SurfaceId)}
          options={SURFACES.map((s) => ({ value: s.id, label: s.name }))}
        />

        <Select
          label="Severity — how much this matters to you as the reviewer"
          value={severity}
          onChange={(v) => setSeverity(v as ReviewSeverity)}
          options={REVIEW_SEVERITIES.map((s) => ({ value: s, label: SEVERITY_LABEL[s] }))}
        />

        <Field label="Note" description="A note is required for two of the four actions below.">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            className="w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-2 text-sm text-[var(--color-ink)]"
          />
        </Field>

        <div className="flex flex-wrap gap-2">
          {REVIEW_STATUSES.map((status) => (
            <Button
              key={status}
              variant={status === 'accepted-for-review' ? 'primary' : 'secondary'}
              onClick={() => void submit(status)}
            >
              {STATUS_ACTION_LABEL[status]}
            </Button>
          ))}
        </div>
      </div>

      {records.length > 0 ? (
        <div className="mt-8">
          <h2 className="text-xl font-semibold">Notes recorded this session</h2>
          <ul className="mt-2 space-y-2 text-sm text-[var(--color-ink-muted)]">
            {records.map((r) => (
              <li key={r.id}>
                <span className="font-medium text-[var(--color-ink)]">
                  {STATUS_ACTION_LABEL[r.status]}
                </span>
                {r.comment !== '' ? ` — ${r.comment}` : ''}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </main>
  )
}
